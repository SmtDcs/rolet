/**
 * ROLET — bağımsız güvenlik denetimi (commit-reveal + lobby lifecycle).
 *
 * Kendi kendine yeten test: kendi solana-test-validator'ını ayrı portta açar,
 * programı (ROLET_SO veya target/deploy/rolet.so) yükler, PlayerProfile
 * hesaplarını doğrudan genesis'e enjekte eder (Core NFT mint gerekmez) ve
 * sonunda validator'ı kapatır. Mevcut localnet / devnet'e dokunmaz.
 *
 * Çalıştır:  npx ts-mocha -p ./tsconfig.anchor.json -t 900000 --exit tests/rolet-security-audit.ts
 * Hızlı mod (claim_timeout başarı yolunu ~60 sn beklemeden atla): AUDIT_FAST=1
 */
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_SLOT_HASHES_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { keccak_256 } from "@noble/hashes/sha3";
import { randomBytes } from "crypto";
import { assert } from "chai";
import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const PROGRAM_ID = new PublicKey("Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792");
const RPC_PORT = Number(process.env.AUDIT_RPC_PORT ?? 18899);
const RPC_URL = `http://127.0.0.1:${RPC_PORT}`;
const SO_PATH = process.env.ROLET_SO ?? path.resolve(__dirname, "../target/deploy/rolet.so");
const IDL_PATH = process.env.ROLET_IDL ?? path.resolve(__dirname, "../target/idl/rolet.json");
const TURN_TIMEOUT_SLOTS = 150;
const LAUNCH_WINDOW_SLOTS = 300; // lib.rs LAUNCH_WINDOW_SLOTS
const DURABILITY_MAX = 50; // birçok launch (iadesiz) testi var

const IDL = JSON.parse(fs.readFileSync(IDL_PATH, "utf8"));

// ---------- helpers ----------
const u64le = (n: BN) => n.toArrayLike(Buffer, "le", 8);
const lobbyPda = (id: BN) =>
  PublicKey.findProgramAddressSync([Buffer.from("lobby"), u64le(id)], PROGRAM_ID)[0];
const matchPda = (id: BN) =>
  PublicKey.findProgramAddressSync([Buffer.from("match"), u64le(id)], PROGRAM_ID)[0];
const profilePdaBump = (pk: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from("profile"), pk.toBuffer()], PROGRAM_ID);
const profilePda = (pk: PublicKey) => profilePdaBump(pk)[0];

/** Must match lib.rs `lobby_commitment` and web/lib/lobbyCommit.ts. */
const boundCommit = (secret: Buffer, player: PublicKey, id: BN) =>
  Buffer.from(keccak_256(Buffer.concat([secret, player.toBuffer(), u64le(id)])));

function commitReveal(who: Keypair, id: BN) {
  const secret = randomBytes(32);
  return { secret, commit: boundCommit(secret, who.publicKey, id) };
}

let idCounter = 0;
const newMatchId = () => new BN(Date.now()).muln(1000).addn(++idCounter);

async function expectErr(p: Promise<unknown>, name: string) {
  try {
    await p;
  } catch (e: any) {
    const text = [String(e?.message ?? e), ...(e?.logs ?? []), ...(e?.transactionLogs ?? [])].join("\n");
    assert.include(text, name, `beklenen hata ${name}, gelen:\n${text.slice(0, 1500)}`);
    return;
  }
  assert.fail(`beklenen hata ${name}, ama işlem BAŞARILI oldu`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("rolet-security-audit (bağımsız)", function () {
  this.timeout(600_000);

  let validator: ChildProcess | undefined;
  let ledgerDir: string;
  let connection: Connection;
  let program: any;

  const payer = Keypair.generate();
  const host = Keypair.generate();
  const guest = Keypair.generate();
  const stranger = Keypair.generate();

  async function waitForSlotAbove(target: number) {
    for (;;) {
      const s = await connection.getSlot("confirmed");
      if (s > target) return s;
      await sleep(200);
    }
  }

  async function profile(pk: PublicKey) {
    return program.account.playerProfile.fetch(profilePda(pk));
  }
  async function lobby(id: BN) {
    return program.account.lobbyState.fetch(lobbyPda(id));
  }

  const openLobby = (id: BN, commit: Buffer, h = host) =>
    program.methods
      .openLobby(id, Array.from(commit))
      .accounts({ lobby: lobbyPda(id), hostProfile: profilePda(h.publicKey), host: h.publicKey, systemProgram: SystemProgram.programId })
      .signers([h])
      .rpc();
  const joinLobby = (id: BN, commit: Buffer, g = guest) =>
    program.methods
      .joinLobby(Array.from(commit))
      .accounts({ lobby: lobbyPda(id), guestProfile: profilePda(g.publicKey), guest: g.publicKey })
      .signers([g])
      .rpc();
  const revealIx = (id: BN, secret: Buffer, who: Keypair) =>
    program.methods
      .revealSecret(Array.from(secret))
      .accounts({ lobby: lobbyPda(id), player: who.publicKey })
      .instruction();
  const reveal = (id: BN, secret: Buffer, who: Keypair) =>
    program.methods
      .revealSecret(Array.from(secret))
      .accounts({ lobby: lobbyPda(id), player: who.publicKey })
      .signers([who])
      .rpc();
  const initMatchIx = (id: BN, by: Keypair) =>
    program.methods
      .initMatch(id)
      .accounts({
        matchState: matchPda(id),
        lobby: lobbyPda(id),
        playerOne: host.publicKey,
        playerTwo: guest.publicKey,
        payer: by.publicKey,
        slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  const initMatch = (id: BN, by: Keypair = host) =>
    program.methods
      .initMatch(id)
      .accounts({
        matchState: matchPda(id),
        lobby: lobbyPda(id),
        playerOne: host.publicKey,
        playerTwo: guest.publicKey,
        payer: by.publicKey,
        slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
        systemProgram: SystemProgram.programId,
      })
      .signers([by])
      .rpc();
  const closeLobby = (id: BN, withGuest: boolean) =>
    program.methods
      .closeLobby()
      .accounts({
        lobby: lobbyPda(id),
        hostProfile: profilePda(host.publicKey),
        guestProfile: withGuest ? profilePda(guest.publicKey) : null,
        host: host.publicKey,
      })
      .signers([host])
      .rpc();
  async function sendTx(ixs: TransactionInstruction[], signers: Keypair[]) {
    const tx = new Transaction().add(...ixs);
    return anchor.web3.sendAndConfirmTransaction(connection, tx, signers, { commitment: "confirmed" });
  }

  /** Lobby aç + katıl + iki reveal. Sırları döndürür. */
  async function readyLobby(id: BN) {
    const h = commitReveal(host, id);
    const g = commitReveal(guest, id);
    await openLobby(id, h.commit);
    await joinLobby(id, g.commit);
    await reveal(id, h.secret, host);
    await reveal(id, g.secret, guest);
    return { h, g };
  }

  before(async function () {
    assert.isTrue(fs.existsSync(SO_PATH), `program .so yok: ${SO_PATH}`);
    ledgerDir = fs.mkdtempSync(path.join(os.tmpdir(), "rolet-audit-ledger-"));
    const space = 8 + 190; // PlayerProfile::INIT_SPACE = 190
    const disc = Buffer.from(IDL.accounts.find((a: any) => a.name === "PlayerProfile").discriminator);

    const accountArgs: string[] = [];
    for (const kp of [host, guest, stranger]) {
      const [pda, bump] = profilePdaBump(kp.publicKey);
      // Elle Borsh: authority | sns_domain(String) | character_nft | dur_rem | dur_max |
      // stats{u32,u32,u32,u64,u64,u16} | session_key Option<Pubkey> | expiry i64 | created_at i64 | bump
      const parts: Buffer[] = [disc, kp.publicKey.toBuffer()];
      const u32 = (n: number) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
      const u64 = (n: number) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
      const u16 = (n: number) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
      parts.push(u32(0)); // sns_domain ""
      parts.push(PublicKey.default.toBuffer());
      parts.push(Buffer.from([DURABILITY_MAX, DURABILITY_MAX]));
      parts.push(u32(0), u32(0), u32(0), u64(0), u64(0), u16(1000));
      parts.push(Buffer.from([0])); // session_key None
      parts.push(u64(0), u64(1), Buffer.from([bump]));
      const encoded = Buffer.concat(parts);
      const data = Buffer.alloc(space);
      encoded.copy(data);
      const file = path.join(ledgerDir, `${pda.toBase58()}.json`);
      fs.writeFileSync(
        file,
        JSON.stringify({
          pubkey: pda.toBase58(),
          account: { lamports: 10_000_000, data: [data.toString("base64"), "base64"], owner: PROGRAM_ID.toBase58(), executable: false, rentEpoch: 0, space },
        }),
      );
      accountArgs.push("--account", pda.toBase58(), file);
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

    connection = new Connection(RPC_URL, "confirmed");
    for (let i = 0; ; i++) {
      try {
        await connection.getLatestBlockhash();
        break;
      } catch {
        if (i > 120) throw new Error("validator açılmadı");
        await sleep(500);
      }
    }
    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(payer), { commitment: "confirmed" });
    program = new Program(IDL, provider);

    for (const kp of [payer, host, guest, stranger]) {
      const sig = await connection.requestAirdrop(kp.publicKey, 5e9);
      await connection.confirmTransaction(sig, "confirmed");
    }
    const p = await profile(host.publicKey);
    assert.equal(p.durabilityRemaining, DURABILITY_MAX);
  });

  after(async () => {
    validator?.kill("SIGINT");
    await sleep(500);
    try { fs.rmSync(ledgerDir, { recursive: true, force: true }); } catch { /* */ }
  });

  // ---------------------------------------------------------------- 1
  describe("1) join_lobby yalnızca commit kabul eder", () => {
    it("IDL: join_lobby argümanı sadece guest_commit", () => {
      const ix = IDL.instructions.find((i: any) => i.name === "join_lobby");
      assert.deepEqual(ix.args.map((a: any) => a.name), ["guest_commit"]);
    });

    it("join sonrası on-chain guest_secret sıfır, guest_revealed=false", async () => {
      const id = newMatchId();
      const h = commitReveal(host, id);
      const g = commitReveal(guest, id);
      await openLobby(id, h.commit);
      await joinLobby(id, g.commit);
      const l = await lobby(id);
      assert.deepEqual(Buffer.from(l.guestCommit), g.commit);
      assert.isTrue(Buffer.from(l.guestSecret).equals(Buffer.alloc(32)));
      assert.isFalse(l.guestRevealed);
      await closeLobby(id, true);
    });

    it("eski layout (commit+secret, 64 bayt) gönderilse bile secret saklanmaz", async () => {
      const id = newMatchId();
      const h = commitReveal(host, id);
      const g = commitReveal(guest, id);
      await openLobby(id, h.commit);
      const ix: TransactionInstruction = await program.methods
        .joinLobby(Array.from(g.commit))
        .accounts({ lobby: lobbyPda(id), guestProfile: profilePda(guest.publicKey), guest: guest.publicKey })
        .instruction();
      ix.data = Buffer.concat([ix.data, g.secret]); // eski client'ın göndereceği plaintext secret
      try {
        await sendTx([ix], [payer, guest]);
      } catch {
        /* reddedilmesi de kabul — her iki durumda secret zincire yazılmamalı */
      }
      const info = await connection.getAccountInfo(lobbyPda(id));
      assert.isFalse(info!.data.includes(g.secret), "plaintext secret lobby hesabında bulundu!");
      const l = await lobby(id);
      assert.isTrue(Buffer.from(l.guestSecret).equals(Buffer.alloc(32)));
      await closeLobby(id, l.guest !== null);
    });
  });

  // ---------------------------------------------------------------- 2
  describe("2) reveal kuralları", () => {
    it("guest yokken reveal → LobbyNotReady", async () => {
      const id = newMatchId();
      const h = commitReveal(host, id);
      await openLobby(id, h.commit);
      await expectErr(reveal(id, h.secret, host), "LobbyNotReady");
      await closeLobby(id, false);
    });

    it("yanlış secret (host ve guest) → InvalidReveal", async () => {
      const id = newMatchId();
      const h = commitReveal(host, id);
      const g = commitReveal(guest, id);
      await openLobby(id, h.commit);
      await joinLobby(id, g.commit);
      await expectErr(reveal(id, randomBytes(32), host), "InvalidReveal");
      await expectErr(reveal(id, h.secret, guest), "InvalidReveal"); // başkasının secret'ı
      const l = await lobby(id);
      assert.isFalse(l.hostRevealed);
      assert.isFalse(l.guestRevealed);
      await closeLobby(id, true);
    });

    it("katılımcı olmayan reveal → NotAParticipant; çift reveal → AlreadyRevealed", async () => {
      const id = newMatchId();
      const h = commitReveal(host, id);
      const g = commitReveal(guest, id);
      await openLobby(id, h.commit);
      await joinLobby(id, g.commit);
      await expectErr(reveal(id, h.secret, stranger), "NotAParticipant");
      await reveal(id, h.secret, host);
      await expectErr(reveal(id, h.secret, host), "AlreadyRevealed");
      const l = await lobby(id);
      assert.isTrue(l.hostRevealed);
      assert.equal(l.seedSlot.toNumber(), 0, "tek reveal'da seed_slot sabitlenmemeli");
      await closeLobby(id, true);
    });
  });

  // ---------------------------------------------------------------- 3
  describe("3) init_match kapıları", () => {
    it("hiç reveal yokken init_match → SecretsNotRevealed", async () => {
      const id = newMatchId();
      await openLobby(id, commitReveal(host, id).commit);
      await joinLobby(id, commitReveal(guest, id).commit);
      await expectErr(initMatch(id, host), "SecretsNotRevealed");
      await closeLobby(id, true);
    });

    it("tek reveal sonrası init_match → SecretsNotRevealed", async () => {
      const id = newMatchId();
      const h = commitReveal(host, id);
      await openLobby(id, h.commit);
      await joinLobby(id, commitReveal(guest, id).commit);
      await reveal(id, h.secret, host);
      await expectErr(initMatch(id, host), "SecretsNotRevealed");
      await closeLobby(id, true);
    });

    it("ikinci reveal ile AYNI tx'te init_match → SeedSlotNotReached (deterministik)", async () => {
      const id = newMatchId();
      const h = commitReveal(host, id);
      const g = commitReveal(guest, id);
      await openLobby(id, h.commit);
      await joinLobby(id, g.commit);
      await reveal(id, h.secret, host);
      const ixs = [await revealIx(id, g.secret, guest), await initMatchIx(id, guest)];
      await expectErr(sendTx(ixs, [guest]), "SeedSlotNotReached");
      // Atomik geri alma: guest reveal de geri alınmış olmalı
      const l = await lobby(id);
      assert.isFalse(l.guestRevealed);
      await closeLobby(id, true);
    });

    it("katılımcı olmayan payer → NotAParticipant", async () => {
      const id = newMatchId();
      await readyLobby(id);
      const l = await lobby(id);
      await waitForSlotAbove(l.seedSlot.toNumber());
      await expectErr(initMatch(id, stranger), "NotAParticipant");
      // RİSK-A: iki reveal sonrası lobby kapatılamaz; önce launch, sonra rent.
      await initMatch(id, host);
      await closeLobby(id, true);
    });

    it("seed_slot geçtikten sonra init_match başarılı; gun 5 live / 3 blank; tekrar → hata", async () => {
      const id = newMatchId();
      await readyLobby(id);
      const l = await lobby(id);
      assert.isAbove(l.seedSlot.toNumber(), 0);
      await waitForSlotAbove(l.seedSlot.toNumber());
      await initMatch(id, guest); // guest de tetikleyebilir
      const m = await program.account.matchState.fetch(matchPda(id));
      assert.equal(m.playerOneHp, 4);
      assert.equal(m.playerTwoHp, 4);
      assert.equal(m.gun.chambers.filter((c: any) => c.live).length, 5);
      assert.equal(m.gun.chambers.filter((c: any) => c.blank).length, 3);
      assert.isTrue((await lobby(id)).launched);
      // ikinci init (match PDA zaten var) başarısız olmalı
      await expectErr(initMatch(id, host), "already in use");
    });
  });

  // ---------------------------------------------------------------- 4
  describe("4) close_lobby durability iadesi", () => {
    it("guest yokken: host +1 iade, lobby kapanır", async () => {
      const before = (await profile(host.publicKey)).durabilityRemaining;
      const id = newMatchId();
      await openLobby(id, commitReveal(host, id).commit);
      assert.equal((await profile(host.publicKey)).durabilityRemaining, before - 1);
      await closeLobby(id, false);
      assert.equal((await profile(host.publicKey)).durabilityRemaining, before);
      assert.isNull(await connection.getAccountInfo(lobbyPda(id)));
    });

    it("guest katıldı, launch yok: guest_profile verilmezse → GuestProfileRequired", async () => {
      const id = newMatchId();
      await openLobby(id, commitReveal(host, id).commit);
      await joinLobby(id, commitReveal(guest, id).commit);
      await expectErr(closeLobby(id, false), "GuestProfileRequired");
      await closeLobby(id, true);
    });

    it("guest katıldı, launch yok: iki taraf da +1 iade", async () => {
      const hb = (await profile(host.publicKey)).durabilityRemaining;
      const gb = (await profile(guest.publicKey)).durabilityRemaining;
      const id = newMatchId();
      await openLobby(id, commitReveal(host, id).commit);
      await joinLobby(id, commitReveal(guest, id).commit);
      assert.equal((await profile(host.publicKey)).durabilityRemaining, hb - 1);
      assert.equal((await profile(guest.publicKey)).durabilityRemaining, gb - 1);
      await closeLobby(id, true);
      assert.equal((await profile(host.publicKey)).durabilityRemaining, hb);
      assert.equal((await profile(guest.publicKey)).durabilityRemaining, gb);
    });

    it("host olmayan biri close_lobby çağıramaz (has_one host)", async () => {
      const id = newMatchId();
      await openLobby(id, commitReveal(host, id).commit);
      const p = program.methods
        .closeLobby()
        .accounts({ lobby: lobbyPda(id), hostProfile: profilePda(stranger.publicKey), guestProfile: null, host: stranger.publicKey })
        .signers([stranger])
        .rpc();
      await expectErr(p, "ConstraintHasOne");
      await closeLobby(id, false);
    });

    it("launch sonrası close: iade YOK, sadece rent", async () => {
      const id = newMatchId();
      await readyLobby(id);
      await waitForSlotAbove((await lobby(id)).seedSlot.toNumber());
      await initMatch(id, host);
      const hb = (await profile(host.publicKey)).durabilityRemaining;
      const gb = (await profile(guest.publicKey)).durabilityRemaining;
      await closeLobby(id, true);
      assert.equal((await profile(host.publicKey)).durabilityRemaining, hb);
      assert.equal((await profile(guest.publicKey)).durabilityRemaining, gb);
      assert.isNull(await connection.getAccountInfo(lobbyPda(id)));
    });
  });

  // ---------------------------------------------------------------- 5
  describe("5) claim_timeout", () => {
    let id: BN;
    let onTurn: Keypair;
    let waiting: Keypair;
    before(async () => {
      id = newMatchId();
      await readyLobby(id);
      await waitForSlotAbove((await lobby(id)).seedSlot.toNumber());
      await initMatch(id, host);
      const m = await program.account.matchState.fetch(matchPda(id));
      onTurn = m.currentTurn.equals(host.publicKey) ? host : guest;
      waiting = onTurn === host ? guest : host;
    });
    const claim = (who: Keypair) =>
      program.methods.claimTimeout().accounts({ matchState: matchPda(id), claimant: who.publicKey }).signers([who]).rpc();

    it("erken claim → TimeoutNotReached", async () => {
      await expectErr(claim(waiting), "TimeoutNotReached");
    });
    it("sırası gelen oyuncu kendi timeout'unu claim edemez → CannotClaimOwnTimeout", async () => {
      await expectErr(claim(onTurn), "CannotClaimOwnTimeout");
    });
    it("yabancı claim → NotAParticipant", async () => {
      await expectErr(claim(stranger), "NotAParticipant");
    });
    it("TURN_TIMEOUT_SLOTS sonrası bekleyen oyuncu kazanır", async function () {
      if (process.env.AUDIT_FAST) this.skip();
      const m = await program.account.matchState.fetch(matchPda(id));
      await waitForSlotAbove(m.lastActionSlot.toNumber() + TURN_TIMEOUT_SLOTS);
      await claim(waiting);
      const after = await program.account.matchState.fetch(matchPda(id));
      assert.ok(after.status.completed);
      assert.isTrue(after.winner.equals(waiting.publicKey));
      await expectErr(claim(waiting), "MatchNotActive");
    });
  });

  // ---------------------------------------------------------------- 6
  describe("6) RİSK-A: iki reveal sonrası close_lobby re-roll yapamaz", () => {
    it("iki reveal sonrası (seed_slot öncesi) close → LobbyMustLaunch", async () => {
      const id = newMatchId();
      await readyLobby(id);
      await expectErr(closeLobby(id, true), "LobbyMustLaunch");
      await expectErr(closeLobby(id, false), "LobbyMustLaunch");
      assert.isNotNull(await connection.getAccountInfo(lobbyPda(id)));
    });

    it("seed_slot üretildikten sonra (sonuç hesaplanabilir) close → LobbyMustLaunch; guest yine de launch edebilir", async () => {
      const hb = (await profile(host.publicKey)).durabilityRemaining;
      const gb = (await profile(guest.publicKey)).durabilityRemaining;
      const id = newMatchId();
      await readyLobby(id);
      await waitForSlotAbove((await lobby(id)).seedSlot.toNumber());
      await expectErr(closeLobby(id, true), "LobbyMustLaunch");
      // Durability iade edilmedi
      assert.equal((await profile(host.publicKey)).durabilityRemaining, hb - 1);
      assert.equal((await profile(guest.publicKey)).durabilityRemaining, gb - 1);
      // Host kaçamıyor; guest maçı başlatabilir
      await initMatch(id, guest);
      assert.isTrue((await lobby(id)).launched);
      // Launch sonrası close: yalnızca rent, iade yok
      await closeLobby(id, true);
      assert.equal((await profile(host.publicKey)).durabilityRemaining, hb - 1);
      assert.equal((await profile(guest.publicKey)).durabilityRemaining, gb - 1);
    });

    it("tek reveal sonrası close hâlâ iki tarafa iade eder (sonuç bilinemez)", async () => {
      const hb = (await profile(host.publicKey)).durabilityRemaining;
      const gb = (await profile(guest.publicKey)).durabilityRemaining;
      const id = newMatchId();
      const h = commitReveal(host, id);
      await openLobby(id, h.commit);
      await joinLobby(id, commitReveal(guest, id).commit);
      await reveal(id, h.secret, host);
      await closeLobby(id, true);
      assert.equal((await profile(host.publicKey)).durabilityRemaining, hb);
      assert.equal((await profile(guest.publicKey)).durabilityRemaining, gb);
    });

    it("launch penceresi (seed_slot + LAUNCH_WINDOW_SLOTS) geçince close: sadece rent, iade YOK", async function () {
      if (process.env.AUDIT_FAST) this.skip();
      const hb = (await profile(host.publicKey)).durabilityRemaining;
      const gb = (await profile(guest.publicKey)).durabilityRemaining;
      const id = newMatchId();
      await readyLobby(id);
      const seed = (await lobby(id)).seedSlot.toNumber();
      await waitForSlotAbove(seed + LAUNCH_WINDOW_SLOTS + 1);
      await closeLobby(id, true);
      assert.isNull(await connection.getAccountInfo(lobbyPda(id)));
      assert.equal((await profile(host.publicKey)).durabilityRemaining, hb - 1, "host iade almamalı");
      assert.equal((await profile(guest.publicKey)).durabilityRemaining, gb - 1, "guest iade almamalı");
    });
  });

  // ---------------------------------------------------------------- 7
  describe("7) RİSK-B: commit oyuncuya + match_id'ye bağlı", () => {
    it("guest host'un commit'ini kopyalayamaz → DuplicateCommit", async () => {
      const id = newMatchId();
      const h = commitReveal(host, id);
      await openLobby(id, h.commit);
      await expectErr(joinLobby(id, h.commit), "DuplicateCommit");
      await closeLobby(id, false);
    });

    it("host'un secret'ı guest koltuğunda açılamaz (guest, host anahtarıyla bağlı commit verse bile) → InvalidReveal", async () => {
      const id = newMatchId();
      const h = commitReveal(host, id);
      await openLobby(id, h.commit);
      // Guest, host'un secret'ını sonradan tekrar kullanmayı umarak farklı bir commit girer
      await joinLobby(id, boundCommit(h.secret, guest.publicKey, newMatchId()));
      await reveal(id, h.secret, host);
      await expectErr(reveal(id, h.secret, guest), "InvalidReveal");
      assert.isFalse((await lobby(id)).guestRevealed);
      await closeLobby(id, true);
    });

    it("başka match_id'ye bağlı commit bu lobide açılamaz → InvalidReveal", async () => {
      const id = newMatchId();
      const other = newMatchId();
      const secret = randomBytes(32);
      await openLobby(id, boundCommit(secret, host.publicKey, other));
      await joinLobby(id, commitReveal(guest, id).commit);
      await expectErr(reveal(id, secret, host), "InvalidReveal");
      await closeLobby(id, true);
    });

    it("eski (bağsız) keccak(secret) commit artık açılamaz → InvalidReveal", async () => {
      const id = newMatchId();
      const secret = randomBytes(32);
      await openLobby(id, Buffer.from(keccak_256(secret)));
      await joinLobby(id, commitReveal(guest, id).commit);
      await expectErr(reveal(id, secret, host), "InvalidReveal");
      await closeLobby(id, true);
    });

    it("bağlı preimage ile iki taraf da reveal eder; seed_slot sabitlenir", async () => {
      const id = newMatchId();
      await readyLobby(id);
      const l = await lobby(id);
      assert.isTrue(l.hostRevealed && l.guestRevealed);
      assert.isAbove(l.seedSlot.toNumber(), 0);
      await waitForSlotAbove(l.seedSlot.toNumber());
      await initMatch(id, host);
      await closeLobby(id, true);
    });
  });
});
