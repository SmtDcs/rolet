import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";

// The program is deployed on the local validator at the address declared in
// `programs/rolet/src/lib.rs`. The Anchor CLI can't regenerate `target/types`
// on this machine (its bundled `anchor-syn` fails to build against the pinned
// `proc-macro2`), so we build the client from the checked-in IDL instead of
// importing `../target/types/rolet`.
const PROGRAM_ID = new PublicKey(
  "Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792",
);

function loadIdl(): any {
  const candidates = [
    path.resolve(process.cwd(), "target/idl/rolet.json"),
    path.resolve(process.cwd(), "idl/rolet.json"),
    path.resolve(process.cwd(), "../web/idl/rolet.json"),
    path.resolve(process.cwd(), "../../web/idl/rolet.json"),
  ];

  // Also walk up from the working directory looking for a workspace checkout.
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    candidates.push(path.join(dir, "apps/web/idl/rolet.json"));
    dir = path.dirname(dir);
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  }
  throw new Error(`rolet.json IDL not found; tried ${candidates.join(", ")}`);
}

const IDL = loadIdl();

async function expectErrorCode(code: number, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    const err = e as any;
    // Custom program errors surface as `err.code`; Anchor framework errors
    // (e.g. AccountNotInitialized) surface as `err.error.errorCode.number`.
    const actual = err?.error?.errorCode?.number ?? err?.code;
    assert.equal(
      actual,
      code,
      `expected error code ${code}, got ${actual} — ${err?.message ?? String(e)}`,
    );
    return;
  }
  assert.fail(`expected error code ${code}, but the call succeeded`);
}

describe("economy-core", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program: any = new Program(IDL, provider);

  const buyer = Keypair.generate();
  const authority = Keypair.generate();

  const profilePda = (who: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), who.toBuffer()],
      program.programId,
    )[0];
  const vaultPda = PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    program.programId,
  )[0];
  const treasurySolPda = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury-sol"), vaultPda.toBuffer()],
    program.programId,
  )[0];
  const lobbyPda = (matchId: BN) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("lobby"), matchId.toArrayLike(Buffer, "le", 8)],
      program.programId,
    )[0];

  const REWARD = new BN(Math.round(0.12 * LAMPORTS_PER_SOL));
  const PRICE = new BN(LAMPORTS_PER_SOL);

  before(async () => {
    for (const pubkey of [
      buyer.publicKey,
      authority.publicKey,
      provider.wallet.publicKey,
    ]) {
      const sig = await provider.connection.requestAirdrop(
        pubkey,
        20 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
  });

  it("init_vault stores treasury, ops wallet and prices", async () => {
    await program.methods
      .initVault(REWARD, PRICE)
      .accounts({
        vault: vaultPda,
        treasurySol: treasurySolPda,
        opsWallet: authority.publicKey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const v = await program.account.gameVault.fetch(vaultPda);
    assert.equal(v.rewardSol.toNumber(), REWARD.toNumber());
    assert.equal(v.characterPriceSol.toNumber(), PRICE.toNumber());
    assert.equal(v.treasurySol.toBase58(), treasurySolPda.toBase58());
    assert.equal(v.opsWallet.toBase58(), authority.publicKey.toBase58());
    assert.equal(v.authority.toBase58(), authority.publicKey.toBase58());
    assert.ok(v.treasuryBump > 0, "treasury bump should be set");
  });

  it("set_character_nft rejects an asset that is not a Core AssetV1 (6029)", async () => {
    // Passing the system program's own executable account exercises the
    // raw-byte validation: its first byte is the ELF magic (0x7f), not the
    // Core AssetV1 key (1), so `fetch_character_asset` returns
    // InvalidCharacterNft before any profile is committed.
    await expectErrorCode(6029, () =>
      program.methods
        .setCharacterNft("buyer", 10)
        .accounts({
          profile: profilePda(buyer.publicKey),
          characterNft: SystemProgram.programId,
          authority: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc(),
    );
  });

  it("open_lobby requires an initialized profile (AccountNotInitialized)", async () => {
    // The buyer's profile was rolled back by the failed set_character_nft
    // above, so opening a lobby must fail at the profile constraint.
    const matchId = new BN(Date.now());
    await expectErrorCode(3012, () =>
      program.methods
        .openLobby(matchId, new Array(32).fill(0))
        .accounts({
          lobby: lobbyPda(matchId),
          hostProfile: profilePda(buyer.publicKey),
          host: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc(),
    );
  });
});
