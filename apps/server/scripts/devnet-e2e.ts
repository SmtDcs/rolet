/**
 * Devnet E2E test — full economy flow with real MPL Core program.
 *
 * Flow:
 *   1. Player A mints a Core asset + purchase_character (0.1 SOL, 70/30)
 *   2. Player B mints a Core asset + purchase_character
 *   3. A opens a lobby (durability 10 -> 9)
 *   4. B joins (durability 10 -> 9)
 *   5. init_match with both commitments/secrets
 *   6. Alternate pull_trigger until a winner emerges (max 40 rounds)
 *   7. settle_match -> winner gets 0.02 SOL from treasury PDA
 *   8. Print durability + balances
 *
 * Usage:
 *   RPC_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   PLAYER_B_KEY=/path/player-b.json \
 *   npx tsx scripts/devnet-e2e.ts
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  generateSigner,
  publicKey,
  createSignerFromKeypair,
  keypairIdentity,
  type Umi,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createV1, mplCore } from "@metaplex-foundation/mpl-core";
import { toWeb3JsInstruction, toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { keccak_256 } from "@noble/hashes/sha3";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const DEFAULT_METADATA_URI =
  "https://arweave.net/PLACEHOLDER_ROLET_CHARACTER_METADATA.json";
const OPS_WALLET = new PublicKey("CeoeQQj6233aJ1SMKzrdVrVeLZVJ8C5zwXT7JNdfj8f4");

function loadKeypair(p: string): Keypair {
  if (!fs.existsSync(p)) {
    const kp = Keypair.generate();
    fs.writeFileSync(p, JSON.stringify(Array.from(kp.secretKey)));
    console.log(`generated new keypair -> ${p} (${kp.publicKey.toBase58()})`);
    return kp;
  }
  const secret = JSON.parse(fs.readFileSync(p, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function confirmSig(connection: Connection, sig: string, label: string) {
  await connection.confirmTransaction(sig, "confirmed");
  console.log(`  ✓ ${label}: ${sig.slice(0, 40)}…`);
}

async function purchaseCharacter(
  connection: Connection,
  umi: Umi,
  programId: PublicKey,
  vaultPda: PublicKey,
  treasurySolPda: PublicKey,
  buyer: Keypair,
  sns: string,
  tag: string,
): Promise<PublicKey> {
  const durabilityMax = 10;
  // createV1 draws its payer from the umi identity — set it per buyer.
  const buyerUmi = umi.use(
    keypairIdentity(
      createSignerFromKeypair(
        umi,
        umi.eddsa.createKeypairFromSecretKey(
          new Uint8Array(buyer.secretKey),
        ) as never,
      ),
    ),
  );
  const assetSignerForBuyer = generateSigner(buyerUmi);

  const createIx = toWeb3JsInstruction(
    createV1(buyerUmi, {
      asset: assetSignerForBuyer,
      name: `ROLET Character #${Date.now().toString(36)}${tag}`,
      uri: DEFAULT_METADATA_URI,
      owner: publicKey(buyer.publicKey.toBase58()),
      updateAuthority: publicKey(programId.toBase58()),
    }).getInstructions()[0],
  );

  const snsBytes = Buffer.from(sns, "utf8");
  const args = Buffer.alloc(4 + snsBytes.length + 1);
  args.writeUInt32LE(snsBytes.length, 0);
  snsBytes.copy(args, 4);
  args.writeUInt8(durabilityMax, 4 + snsBytes.length);

  const [profile] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), buyer.publicKey.toBuffer()],
    programId,
  );

  const purchaseIx = {
    keys: [
      { pubkey: profile, isSigner: false, isWritable: true },
      { pubkey: toWeb3JsPublicKey(assetSignerForBuyer.publicKey), isSigner: false, isWritable: false },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: treasurySolPda, isSigner: false, isWritable: true },
      { pubkey: OPS_WALLET, isSigner: false, isWritable: true },
      { pubkey: buyer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data: Buffer.concat([Buffer.from([106, 152, 20, 133, 31, 138, 120, 36]), args]),
  };

  const tx = new Transaction().add(createIx, purchaseIx);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = buyer.publicKey;
  const assetKp = Keypair.fromSecretKey(
    Uint8Array.from(assetSignerForBuyer.secretKey as unknown as number[]),
  );
  // Single sign() call: web3.js drops prior partial signatures on sign().
  tx.sign(assetKp, buyer);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await confirmSig(connection, sig, `purchase_character (${tag})`);
  return toWeb3JsPublicKey(assetSignerForBuyer.publicKey);
}

async function main() {
  const walletPath =
    process.env.ANCHOR_WALLET || path.join(os.homedir(), ".config", "solana", "id.json");
  const playerA = loadKeypair(walletPath);
  const playerB = loadKeypair(
    process.env.PLAYER_B_KEY || path.join(process.cwd(), ".player-b.json"),
  );

  const connection = new Connection(RPC_URL, "confirmed");
  const umi = createUmi(RPC_URL).use(mplCore());

  const idlPath = path.resolve(process.cwd(), "target", "idl", "rolet.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const programId = new PublicKey(idl.address);
  const wallet = new anchor.Wallet(playerA);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program: any = new Program(idl as any, provider);

  console.log("─── ROLET devnet E2E ───");
  console.log("program:", programId.toBase58());
  console.log("player A (main wallet):", playerA.publicKey.toBase58());
  console.log("player B:", playerB.publicKey.toBase58());

  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault")], programId);
  const [treasurySolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury-sol"), vaultPda.toBuffer()],
    programId,
  );
  const [profileA] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), playerA.publicKey.toBuffer()],
    programId,
  );
  const [profileB] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), playerB.publicKey.toBuffer()],
    programId,
  );

  const vault = await program.account.gameVault.fetch(vaultPda);
  console.log("character price:", vault.characterPriceSol.toNumber() / 1e9, "SOL");
  console.log("reward:", vault.rewardSol.toNumber() / 1e9, "SOL");

  // ── Step 1+2: purchase characters ────────────────────────────────
  console.log("\n[1] purchase_character for A + B");
  const balTreasuryBefore = await connection.getBalance(treasurySolPda);
  const balOpsBefore = await connection.getBalance(OPS_WALLET);

  await purchaseCharacter(connection, umi, programId, vaultPda, treasurySolPda, playerA, "alice", "A");
  await purchaseCharacter(connection, umi, programId, vaultPda, treasurySolPda, playerB, "bob", "B");

  const balTreasuryAfter = await connection.getBalance(treasurySolPda);
  const balOpsAfter = await connection.getBalance(OPS_WALLET);
  console.log(`  treasury delta: +${(balTreasuryAfter - balTreasuryBefore) / 1e9} SOL (expect +0.14 for 2 purchases)`);
  console.log(`  ops delta:      +${(balOpsAfter - balOpsBefore) / 1e9} SOL (expect +0.06 for 2 purchases)`);

  const profA1 = await program.account.playerProfile.fetch(profileA);
  const profB1 = await program.account.playerProfile.fetch(profileB);
  console.log(`  A durability: ${profA1.durabilityRemaining}, B durability: ${profB1.durabilityRemaining}`);

  // ── Step 3+4: lobby ──────────────────────────────────────────────
  console.log("\n[2] open_lobby (A) + join_lobby (B)");
  const matchId = new anchor.BN(Date.now());
  const matchIdBuf = Buffer.alloc(8);
  matchIdBuf.writeBigUInt64LE(BigInt(matchId.toString()));

  const [lobbyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lobby"), matchIdBuf],
    programId,
  );

  const hostSecret = Keypair.generate().secretKey.slice(0, 32);
  const guestSecret = Keypair.generate().secretKey.slice(0, 32);
  // Commit preimage = secret || player pubkey || match_id (u64 LE) — RISK-B.
  const boundCommit = (secret: Uint8Array, player: PublicKey) =>
    Array.from(
      Buffer.from(
        keccak_256(Buffer.concat([Buffer.from(secret), player.toBuffer(), matchIdBuf])),
      ),
    );
  const hostCommit = boundCommit(hostSecret, playerA.publicKey);
  const guestCommit = boundCommit(guestSecret, playerB.publicKey);

  await program.methods
    .openLobby(matchId, hostCommit)
    .accounts({
      lobby: lobbyPda,
      hostProfile: profileA,
      host: playerA.publicKey,
      systemProgram: SystemProgram.programId,
    } as never)
    .signers([playerA])
    .rpc({ commitment: "confirmed" })
    .then((sig: string) => confirmSig(connection, sig, "open_lobby"));

  await program.methods
    .joinLobby(guestCommit)
    .accounts({
      lobby: lobbyPda,
      guestProfile: profileB,
      guest: playerB.publicKey,
    } as never)
    .signers([playerB])
    .rpc({ commitment: "confirmed" })
    .then((sig: string) => confirmSig(connection, sig, "join_lobby"));

  const profA2 = await program.account.playerProfile.fetch(profileA);
  const profB2 = await program.account.playerProfile.fetch(profileB);
  console.log(`  A durability: ${profA1.durabilityRemaining} -> ${profA2.durabilityRemaining}`);
  console.log(`  B durability: ${profB1.durabilityRemaining} -> ${profB2.durabilityRemaining}`);

  // ── Step 5: reveal_secret & init_match ───────────────────────────
  console.log("\n[3] reveal_secret (host & guest)");
  await program.methods
    .revealSecret(Array.from(hostSecret))
    .accounts({
      lobby: lobbyPda,
      player: playerA.publicKey,
    } as never)
    .signers([playerA])
    .rpc({ commitment: "confirmed" })
    .then((sig: string) => confirmSig(connection, sig, "reveal_secret (host)"));

  await program.methods
    .revealSecret(Array.from(guestSecret))
    .accounts({
      lobby: lobbyPda,
      player: playerB.publicKey,
    } as never)
    .signers([playerB])
    .rpc({ commitment: "confirmed" })
    .then((sig: string) => confirmSig(connection, sig, "reveal_secret (guest)"));

  const lobbyAcct = await program.account.lobbyState.fetch(lobbyPda);
  console.log(`  lobby seed_slot: ${lobbyAcct.seedSlot.toString()}`);
  while (true) {
    const curSlot = await connection.getSlot("confirmed");
    if (curSlot > Number(lobbyAcct.seedSlot)) break;
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("\n[4] init_match");
  const [matchPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("match"), matchIdBuf],
    programId,
  );
  await program.methods
    .initMatch(matchId)
    .accounts({
      matchState: matchPda,
      lobby: lobbyPda,
      playerOne: playerA.publicKey,
      playerTwo: playerB.publicKey,
      payer: playerA.publicKey,
      slotHashes: new PublicKey("SysvarS1otHashes111111111111111111111111111"),
      systemProgram: SystemProgram.programId,
    } as never)
    .signers([playerA])
    .rpc({ commitment: "confirmed" })
    .then((sig: string) => confirmSig(connection, sig, "init_match"));

  // ── Step 6: pull_trigger loop ────────────────────────────────────
  console.log("\n[4] pull_trigger loop (max 40 rounds)");
  let winner: PublicKey | null = null;
  for (let round = 0; round < 40; round++) {
    const m = await program.account.matchState.fetch(matchPda);
    // Anchor 0.32 deserializes enums as objects: { completed: {} } etc.
    const statusKey = typeof m.status === "object" ? Object.keys(m.status)[0] : m.status;
    if (statusKey === "completed") {
      const w = m.winner;
      if (w) {
        winner = new PublicKey(w as never);
        console.log(`  winner after ${round} rounds: ${winner.toBase58()}`);
        break;
      }
    }
    const currentTurn: PublicKey = m.currentTurn;
    const actor = currentTurn.equals(playerA.publicKey) ? playerA : playerB;
    const actorProfile = currentTurn.equals(playerA.publicKey) ? profileA : profileB;

    try {
      await program.methods
        .pullTrigger(false)
        .accounts({
          matchState: matchPda,
          currentProfile: actorProfile,
          actor: actor.publicKey,
        } as never)
        .signers([actor])
        .rpc({ commitment: "confirmed" });
      const m2 = await program.account.matchState.fetch(matchPda);
      console.log(
        `  round ${round}: ${actor.publicKey.toBase58().slice(0, 6)}… pulled — p1hp=${m2.playerOneHp} p2hp=${m2.playerTwoHp}`,
      );
    } catch (e) {
      console.log(`  round ${round} failed:`, (e as Error).message.slice(0, 140));
      break;
    }
  }

  if (!winner) {
    console.log("  !! no winner — dumping state");
    const m = await program.account.matchState.fetch(matchPda);
    console.log("  status:", m.status, "winner:", m.winner?.toString());
    process.exit(1);
  }

  // ── Step 7: settle_match ─────────────────────────────────────────
  console.log("\n[5] settle_match");
  const balWinnerBefore = await connection.getBalance(winner);
  await program.methods
    .settleMatch()
    .accounts({
      matchState: matchPda,
      profileOne: profileA,
      profileTwo: profileB,
      vault: vaultPda,
      treasurySol: treasurySolPda,
      winner,
      rentRefund: playerA.publicKey,
      systemProgram: SystemProgram.programId,
    } as never)
    .signers([playerA])
    .rpc({ commitment: "confirmed" })
    .then((sig: string) => confirmSig(connection, sig, "settle_match"));

  const balWinnerAfter = await connection.getBalance(winner);
  console.log(`  winner balance delta: +${(balWinnerAfter - balWinnerBefore) / 1e9} SOL (expect +0.02)`);

  // ── Step 8: final state ──────────────────────────────────────────
  console.log("\n[6] final state");
  const profAFinal = await program.account.playerProfile.fetch(profileA);
  const profBFinal = await program.account.playerProfile.fetch(profileB);
  console.log("  A:", JSON.stringify({
    durability: profAFinal.durabilityRemaining,
    wins: profAFinal.stats.wins,
    losses: profAFinal.stats.losses,
    rewards: profAFinal.stats.totalRewardsClaimed.toNumber() / 1e9,
  }));
  console.log("  B:", JSON.stringify({
    durability: profBFinal.durabilityRemaining,
    wins: profBFinal.stats.wins,
    losses: profBFinal.stats.losses,
    rewards: profBFinal.stats.totalRewardsClaimed.toNumber() / 1e9,
  }));
  const balTreasuryFinal = await connection.getBalance(treasurySolPda);
  console.log("  treasury:", balTreasuryFinal / 1e9, "SOL");
  console.log("\n─── E2E complete ───");
}

main().catch((err) => {
  console.error("E2E failed:", err);
  process.exit(1);
});
