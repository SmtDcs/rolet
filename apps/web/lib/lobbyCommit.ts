import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

/**
 * Lobby commitment — MUST match `lobby_commitment` in
 * apps/server/programs/rolet/src/lib.rs:
 *   keccak256(secret[32] || player_pubkey[32] || match_id_u64_le[8])
 * Binding the player + match makes a commit non-transferable between seats
 * and lobbies (RISK-B).
 */
export function computeLobbyCommit(
  secret: Uint8Array,
  player: PublicKey,
  matchId: BN
): Uint8Array {
  if (secret.length !== 32) throw new Error("lobby secret must be 32 bytes");
  const preimage = new Uint8Array(72);
  preimage.set(secret, 0);
  preimage.set(player.toBytes(), 32);
  preimage.set(matchId.toArrayLike(Buffer, "le", 8), 64);
  return keccak_256(preimage);
}
