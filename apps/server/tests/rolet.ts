/**
 * ROLET — temel init_match akışı (open_lobby → join_lobby → 2× reveal_secret
 * → seed_slot bekle → init_match).
 *
 * Eski sürüm lobby/reveal olmadan init_match çağırıyordu; program artık
 * lobby + iki commit-reveal şart koştuğu için hep düşüyordu. Bu sürüm kendi
 * solana-test-validator'ını ayrı portta açar, programı (ROLET_SO veya
 * target/deploy/rolet.so) yükler ve PlayerProfile hesaplarını genesis'e enjekte
 * eder (Core NFT mint gerekmez). Mevcut localnet / devnet'e dokunmaz.
 *
 * Çalıştır: npx ts-mocha -p ./tsconfig.anchor.json -t 600000 tests/rolet.ts
 */
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SYSVAR_SLOT_HASHES_PUBKEY, SystemProgram } from "@solana/web3.js";
import { keccak_256 } from "@noble/hashes/sha3";
import { randomBytes } from "crypto";
import { assert } from "chai";
import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const PROGRAM_ID = new PublicKey("Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792");
const RPC_PORT = Number(process.env.ROLET_TEST_RPC_PORT ?? 19899);
const SO_PATH = process.env.ROLET_SO ?? path.resolve(__dirname, "../target/deploy/rolet.so");
const IDL_PATH = process.env.ROLET_IDL ?? path.resolve(__dirname, "../target/idl/rolet.json");
const IDL = JSON.parse(fs.readFileSync(IDL_PATH, "utf8"));
const DURABILITY_MAX = 5;

const u64le = (n: BN) => n.toArrayLike(Buffer, "le", 8);
const pda = (seed: string, id: BN) =>
  PublicKey.findProgramAddressSync([Buffer.from(seed), u64le(id)], PROGRAM_ID)[0];
const profilePdaBump = (pk: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from("profile"), pk.toBuffer()], PROGRAM_ID);
/** keccak256(secret || player || match_id_le) — lib.rs `lobby_commitment`. */
const boundCommit = (secret: Buffer, player: PublicKey, id: BN) =>
  Buffer.from(keccak_256(Buffer.concat([secret, player.toBuffer(), u64le(id)])));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** PlayerProfile Borsh (INIT_SPACE = 190) — rolet-security-audit.ts ile aynı düzen. */
function profileAccountFile(dir: string, owner: PublicKey): [string, string] {
  const [addr, bump] = profilePdaBump(owner);
  const disc = Buffer.from(IDL.accounts.find((a: any) => a.name === "PlayerProfile").discriminator);
  const u32 = (n: number) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
  const u64 = (n: number) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
  const u16 = (n: number) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
  const encoded = Buffer.concat([
    disc, owner.toBuffer(), u32(0), PublicKey.default.toBuffer(),
    Buffer.from([DURABILITY_MAX, DURABILITY_MAX]),
    u32(0), u32(0), u32(0), u64(0), u64(0), u16(1000),
    Buffer.from([0]), u64(0), u64(1), Buffer.from([bump]),
  ]);
  const space = 8 + 190;
  const data = Buffer.alloc(space);
  encoded.copy(data);
  const file = path.join(dir, `${addr.toBase58()}.json`);
  fs.writeFileSync(file, JSON.stringify({
    pubkey: addr.toBase58(),
    account: { lamports: 10_000_000, data: [data.toString("base64"), "base64"], owner: PROGRAM_ID.toBase58(), executable: false, rentEpoch: 0, space },
  }));
  return [addr.toBase58(), file];
}

describe("rolet", function () {
  this.timeout(600_000);

  let validator: ChildProcess | undefined;
  let ledgerDir: string;
  let connection: Connection;
  let program: any;
  const payer = Keypair.generate();
  const playerOne = Keypair.generate(); // host
  const playerTwo = Keypair.generate(); // guest

  before(async () => {
    assert.isTrue(fs.existsSync(SO_PATH), `program .so yok: ${SO_PATH}`);
    ledgerDir = fs.mkdtempSync(path.join(os.tmpdir(), "rolet-test-ledger-"));
    const accountArgs: string[] = [];
    for (const kp of [playerOne, playerTwo]) {
      const [addr, file] = profileAccountFile(ledgerDir, kp.publicKey);
      accountArgs.push("--account", addr, file);
    }
    validator = spawn(
      "solana-test-validator",
      [
        "--reset", "--quiet",
        "--ledger", path.join(ledgerDir, "ledger"),
        "--rpc-port", String(RPC_PORT),
        "--faucet-port", String(RPC_PORT + 1001),
        "--dynamic-port-range", `${RPC_PORT + 2000}-${RPC_PORT + 2050}`,
        "--bpf-program", PROGRAM_ID.toBase58(), SO_PATH,
        ...accountArgs,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    validator.stderr?.on("data", (d) => process.stderr.write(`[validator] ${d}`));
    connection = new Connection(`http://127.0.0.1:${RPC_PORT}`, "confirmed");
    for (let i = 0; ; i++) {
      try { await connection.getLatestBlockhash(); break; } catch {
        if (i > 120) throw new Error("validator açılmadı");
        await sleep(500);
      }
    }
    program = new Program(IDL, new anchor.AnchorProvider(connection, new anchor.Wallet(payer), { commitment: "confirmed" }));
    for (const kp of [payer, playerOne, playerTwo]) {
      const sig = await connection.requestAirdrop(kp.publicKey, 2e9);
      await connection.confirmTransaction(sig, "confirmed");
    }
  });

  after(async () => {
    validator?.kill("SIGINT");
    await sleep(500);
    try { fs.rmSync(ledgerDir, { recursive: true, force: true }); } catch { /* */ }
  });

  it("init_match — seeds the gun and deals two hands", async () => {
    const matchId = new BN(Date.now());
    const lobby = pda("lobby", matchId);
    const matchState = pda("match", matchId);
    const s1 = randomBytes(32);
    const s2 = randomBytes(32);

    await program.methods
      .openLobby(matchId, Array.from(boundCommit(s1, playerOne.publicKey, matchId)))
      .accounts({ lobby, hostProfile: profilePdaBump(playerOne.publicKey)[0], host: playerOne.publicKey, systemProgram: SystemProgram.programId })
      .signers([playerOne])
      .rpc();
    await program.methods
      .joinLobby(Array.from(boundCommit(s2, playerTwo.publicKey, matchId)))
      .accounts({ lobby, guestProfile: profilePdaBump(playerTwo.publicKey)[0], guest: playerTwo.publicKey })
      .signers([playerTwo])
      .rpc();
    for (const [s, kp] of [[s1, playerOne], [s2, playerTwo]] as const) {
      await program.methods.revealSecret(Array.from(s)).accounts({ lobby, player: kp.publicKey }).signers([kp]).rpc();
    }

    const seedSlot = (await program.account.lobbyState.fetch(lobby)).seedSlot.toNumber();
    assert.isAbove(seedSlot, 0);
    while ((await connection.getSlot("confirmed")) <= seedSlot) await sleep(200);

    await program.methods
      .initMatch(matchId)
      .accounts({
        matchState,
        lobby,
        playerOne: playerOne.publicKey,
        playerTwo: playerTwo.publicKey,
        payer: playerOne.publicKey,
        slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
        systemProgram: SystemProgram.programId,
      })
      .signers([playerOne])
      .rpc();

    const m = await program.account.matchState.fetch(matchState);
    assert.equal(m.playerOneHp, 4);
    assert.equal(m.playerTwoHp, 4);
    assert.equal(m.gun.chambers.length, 8);
    const live = m.gun.chambers.filter((c: any) => c.live).length;
    const blank = m.gun.chambers.filter((c: any) => c.blank).length;
    assert.equal(live, 5);
    assert.equal(blank, 3);
    assert.isTrue((await program.account.lobbyState.fetch(lobby)).launched);
  });
});
