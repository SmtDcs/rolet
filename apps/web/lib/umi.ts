"use client";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { WalletAdapter } from "@solana/wallet-adapter-base";

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? "https://api.devnet.solana.com";

export function createRoletUmi(wallet: WalletAdapter | null) {
  const umi = createUmi(RPC_ENDPOINT).use(mplCore());
  if (wallet) {
    umi.use(walletAdapterIdentity(wallet));
  }
  return umi;
}
