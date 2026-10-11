import { createPublicKey, verify } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { parseQueueMessage } from "./matchQueue";

const SKEW_MS = 120_000;
const ED25519_SPKI = Buffer.from("302a300506032b6570032100", "hex");

export function verifyQueueSignature(
  message: string,
  signature: Uint8Array,
  now: number,
): { wallet: string } | null {
  const parsed = parseQueueMessage(message);
  if (!parsed) return null;
  if (Math.abs(now - parsed.at) > SKEW_MS) return null;
  if (signature.length !== 64) return null;
  let raw: Uint8Array;
  try {
    raw = new PublicKey(parsed.wallet).toBytes();
  } catch {
    return null;
  }
  const key = createPublicKey({
    key: Buffer.concat([ED25519_SPKI, Buffer.from(raw)]),
    format: "der",
    type: "spki",
  });
  const ok = verify(null, Buffer.from(message), key, Buffer.from(signature));
  return ok ? { wallet: parsed.wallet } : null;
}
