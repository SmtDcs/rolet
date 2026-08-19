import { PublicKey } from "@solana/web3.js";

// ── Economy parameters ─────────────────────────────────────────────
export const PRICE_SOL = 1;                    // character NFT price
export const CHARACTER_DURABILITY = 10;        // matches per character
export const REWARD_SOL = 0.12;                // winner reward per match
export const VAULT_SHARE_BPS = 7000;           // 70% of NFT revenue to vault
export const OPS_SHARE_BPS = 10000 - VAULT_SHARE_BPS; // 30% to ops

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports: number | { toString(): string }): string {
  const n = typeof lamports === "number" ? lamports : Number(lamports.toString());
  return (n / LAMPORTS_PER_SOL).toFixed(3);
}

export function nftPriceLamports(): number {
  return solToLamports(PRICE_SOL);
}

export function rewardLamports(): number {
  return solToLamports(REWARD_SOL);
}

// ── Treasury PDA ───────────────────────────────────────────────────
export const TREASURY_SOL_SEED = Buffer.from("treasury-sol");

export function treasurySolPda(
  vaultPk: PublicKey,
  programId: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [TREASURY_SOL_SEED, vaultPk.toBuffer()],
    programId,
  )[0];
}
