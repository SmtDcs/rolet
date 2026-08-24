"use client";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { WalletAdapter } from "@solana/wallet-adapter-base";

const RAW_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? "https://api.devnet.solana.com";

// Relative paths (e.g. /api/rpc for the Next.js proxy) must be resolved to
// absolute — umi's web3.js adapter rejects non-http(s) URLs outright.
function resolveEndpoint(raw: string): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (typeof window !== "undefined") return `${window.location.origin}${raw}`;
  return "https://api.devnet.solana.com";
}

export function createRoletUmi(wallet: WalletAdapter | null) {
  const umi = createUmi(resolveEndpoint(RAW_ENDPOINT)).use(mplCore());
  if (wallet) {
    umi.use(walletAdapterIdentity(wallet));
  }
  return umi;
}
