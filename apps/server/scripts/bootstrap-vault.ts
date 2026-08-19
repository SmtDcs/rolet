/**
 * Standalone vault bootstrap — runs without `anchor migrate` so it doesn't
 * depend on `anchor.workspace` autoloading. Loads the hand-written IDL and
 * calls init_vault with the SOL treasury PDA and ops wallet.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-vault.ts
 */
import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8899";
const VAULT_SEED = Buffer.from("vault");
const REWARD_SOL = new BN(Math.round(0.12 * LAMPORTS_PER_SOL));
const CHARACTER_PRICE_SOL = new BN(LAMPORTS_PER_SOL);

async function main() {
  const idlPath = path.resolve(__dirname, "..", "target", "idl", "rolet.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const programId = new PublicKey(idl.address);

  const walletPath =
    process.env.ANCHOR_WALLET ||
    path.join(os.homedir(), ".config", "solana", "id.json");
  const secret = JSON.parse(fs.readFileSync(walletPath, "utf8")) as number[];
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(idl as any, provider);

  console.log("─── ROLET vault bootstrap ───");
  console.log("rpc    :", RPC_URL);
  console.log("payer  :", payer.publicKey.toBase58());
  console.log("program:", programId.toBase58());

  const [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
    [VAULT_SEED],
    programId,
  );

  const existing = await connection.getAccountInfo(vaultPda);
  if (existing) {
    console.log("✓ vault already initialised at", vaultPda.toBase58());
    return;
  }

  const [treasurySolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury-sol"), vaultPda.toBuffer()],
    programId,
  );

  const sig = await program.methods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .initVault(REWARD_SOL as any, CHARACTER_PRICE_SOL as any)
    .accounts({
      vault: vaultPda,
      treasurySol: treasurySolPda,
      opsWallet: payer.publicKey,
      authority: payer.publicKey,
      systemProgram: SystemProgram.programId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .rpc({ commitment: "confirmed" });
  console.log("✓ init_vault sent:", sig);

  console.log("─── done · vault bump =", vaultBump, "───");
}

main().catch((err) => {
  console.error("bootstrap failed:", err);
  process.exit(1);
});
