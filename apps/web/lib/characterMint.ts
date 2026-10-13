"use client";

import {
  generateSigner,
  publicKey,
  type Umi,
} from "@metaplex-foundation/umi";
import { createV1, MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import {
  toWeb3JsInstruction,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

/**
 * The asset's metadata has to be reachable by wallets and explorers, so it is
 * served from this app rather than written inline. Resolving it against the
 * page's own origin keeps devnet, a preview deploy and production honest.
 */
function defaultMetadataUri(): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/character/metadata.json`;
}

/**
 * Mints a ROLET character as a Metaplex Core asset whose update authority is
 * the ROLET program ID, and bundles the profile-linking instruction into the
 * SAME transaction:
 *   - paid path (default): purchase_character — charges the vault price and
 *     splits it inside the program (95% treasury, 5% ops).
 *   - free path (paid=false): set_character_nft. The program rejects a priced
 *     purchase at price zero, so an unpriced character enrols this way.
 *
 * The Core asset account is signed by the generated keypair via partialSign;
 * the returned transaction still needs the buyer wallet's signature.
 */
export async function mintCharacterAsset(opts: {
  umi: Umi;
  buyer: PublicKey;
  programId: PublicKey;
  snsDomain: string;
  durabilityMax: number;
  metadataUri?: string;
  paid?: boolean;
  opsWallet?: PublicKey;
}): Promise<{ mint: PublicKey; tx: Transaction }> {
  const { umi, buyer, programId, snsDomain, durabilityMax } = opts;
  const metadataUri = opts.metadataUri ?? defaultMetadataUri();
  const paid = opts.paid ?? true;

  const assetSigner = generateSigner(umi);
  const buyerUmi = publicKey(buyer.toBase58());
  const programUmi = publicKey(programId.toBase58());

  const builder = createV1(umi, {
    asset: assetSigner,
    name: `ROLET · ${snsDomain}`,
    uri: metadataUri,
    owner: buyerUmi,
    updateAuthority: programUmi,
  });

  const snsBytes = new TextEncoder().encode(snsDomain);
  const args = Buffer.alloc(4 + snsBytes.length + 1);
  args.writeUInt32LE(snsBytes.length, 0);
  Buffer.from(snsBytes).copy(args, 4);
  args.writeUInt8(durabilityMax, 4 + snsBytes.length);

  const [profilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), buyer.toBuffer()],
    programId,
  );

  let profileIx: {
    keys: Array<{ pubkey: PublicKey; isSigner: boolean; isWritable: boolean }>;
    programId: PublicKey;
    data: Buffer;
  };

  if (paid) {
    // opsWallet must match the vault's recorded ops_wallet — the program
    // enforces it. Default to the deployer wallet so a transient vault-fetch
    // failure (e.g. RPC rate limit) never bricks enrollment.
    const opsWallet = opts.opsWallet ?? new PublicKey("CeoeQQj6233aJ1SMKzrdVrVeLZVJ8C5zwXT7JNdfj8f4");
    const PURCHASE_CHARACTER_DISCRIMINATOR = Buffer.from([
      106, 152, 20, 133, 31, 138, 120, 36,
    ]);
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      programId,
    );
    const [treasurySolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury-sol"), vaultPda.toBuffer()],
      programId,
    );
    profileIx = {
      keys: [
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: toWeb3JsPublicKey(assetSigner.publicKey), isSigner: false, isWritable: false },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: treasurySolPda, isSigner: false, isWritable: true },
        { pubkey: opsWallet, isSigner: false, isWritable: true },
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
      ],
      programId,
      data: Buffer.concat([PURCHASE_CHARACTER_DISCRIMINATOR, args]),
    };
  } else {
    const SET_CHARACTER_NFT_DISCRIMINATOR = Buffer.from([
      1, 54, 4, 186, 169, 216, 90, 44,
    ]);
    profileIx = {
      keys: [
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: toWeb3JsPublicKey(assetSigner.publicKey), isSigner: false, isWritable: false },
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
      ],
      programId,
      data: Buffer.concat([SET_CHARACTER_NFT_DISCRIMINATOR, args]),
    };
  }

  // createV1 returns a TransactionBuilder. Umi-web3js-adapters 0.9.2 only
  // converts an already-built umi Transaction (not a builder), so pull out
  // the createV1 instruction and assemble a web3.js legacy Transaction
  // directly — the same pattern used elsewhere in this codebase.
  const createWeb3Ix = toWeb3JsInstruction(builder.getInstructions()[0]);

  const web3Tx = new Transaction().add(createWeb3Ix, profileIx);
  web3Tx.feePayer = buyer;
  web3Tx.recentBlockhash = (await umi.rpc.getLatestBlockhash()).blockhash;

  // The Core asset account must be signed by the generated keypair so the
  // system program can create it. Partial-sign with the asset keypair;
  // the caller still signs with the buyer wallet.
  const assetKeypair = Keypair.fromSecretKey(
    Uint8Array.from(assetSigner.secretKey as unknown as number[]),
  );
  web3Tx.partialSign(assetKeypair);

  return { mint: toWeb3JsPublicKey(assetSigner.publicKey), tx: web3Tx };
}

/**
 * Lists Core assets owned by a wallet. MPL Core has no on-chain owner index;
 * this uses the RPC's DAS getAssetsByOwner when available, else returns [].
 * MVP: the profile page always shows the equipped character, so an empty
 * list is acceptable — this helper is for the future character gallery.
 */
export async function fetchOwnedCharacters(opts: {
  umi: Umi;
  owner: PublicKey;
  programId: PublicKey;
}): Promise<Array<{ mint: PublicKey; name: string }>> {
  const { umi, owner } = opts;
  const ownerUmi = publicKey(owner.toBase58());

  try {
    const rpc = umi.rpc as unknown as {
      getAssetsByOwner?: (
        owner: string,
        sortBy: unknown,
        limit: number,
        page: number,
      ) => Promise<{
        result: { items: Array<{ id: string; content?: { metadata?: { name?: string } } }> };
      }>;
    };
    if (typeof rpc.getAssetsByOwner !== "function") return [];
    const res = await rpc.getAssetsByOwner(
      ownerUmi,
      { sortBy: { sortBy: "created", sortDirection: "asc" } } as never,
      100,
      1,
    );
    return res.result.items.map((item) => ({
      mint: new PublicKey(item.id),
      name: item.content?.metadata?.name ?? "ROLET Character",
    }));
  } catch {
    return [];
  }
}

export { MPL_CORE_PROGRAM_ID };
