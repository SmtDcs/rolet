/** Wallet Standard already registers Phantom and Solflare. A second copy warns. */
export function explicitWalletAdapters(): readonly [] {
  return [];
}

export type SignatureRead = "landed" | "failed" | "pending";

/** Confirmed or finalized counts. Processed is not enough, and an err is a failure. */
export function readSignature(
  status: { err: unknown; confirmationStatus?: string | null } | null,
): SignatureRead {
  if (!status) return "pending";
  if (status.err) return "failed";
  if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
    return "landed";
  }
  return "pending";
}

export function blockhashExpired(blockHeight: number, lastValidBlockHeight: number): boolean {
  return blockHeight > lastValidBlockHeight;
}

/** Matches the program: TURN_TIMEOUT_SLOTS = 150, and the claim must be strictly after it. */
export const TURN_TIMEOUT_SLOTS = 150;

export function timeoutClaimable(state: {
  status: string;
  yourTurn: boolean;
  currentSlot: number;
  lastActionSlot: number;
}): boolean {
  if (state.status !== "active" || state.yourTurn) return false;
  if (state.currentSlot <= 0 || state.lastActionSlot <= 0) return false;
  return state.currentSlot > state.lastActionSlot + TURN_TIMEOUT_SLOTS;
}

/** The host publishes the match. The guest waits until that account exists. */
export function launchActor(role: "host" | "guest"): "send" | "watch" {
  return role === "host" ? "send" : "watch";
}

/**
 * init_match reverts until the chain has produced the seed slot.
 * A failed slot read is 0, which is not proof that the slot has passed.
 */
export function seedReady(curSlot: number, seedSlot: number | null): boolean {
  if (seedSlot == null || seedSlot <= 0) return false;
  if (!(curSlot > 0)) return false;
  return curSlot > seedSlot;
}

/** SOL the wallet moves into a fresh session key so it can pay its own fees. */
export const SESSION_FUND_LAMPORTS = 20_000_000;

/**
 * The session key is funded and registered in one wallet-signed transaction.
 * The wallet must hold at least the transfer plus fees.
 */
export function sessionFundPlan(input: {
  walletBalance: number;
  required: number;
}): "register" | "insufficient" {
  return input.walletBalance >= input.required ? "register" : "insufficient";
}

/** A remount inside ten minutes must not register another session key. */
export function sessionAttemptFresh(previousMs: number | null, now: number): boolean {
  if (previousMs == null || !Number.isFinite(previousMs)) return true;
  return now - previousMs > 10 * 60 * 1000;
}

export function sessionArmMessage(): string {
  return "Session key armed. The rest of the match runs without wallet prompts.";
}

/** Quiet reads every 4s. Each failed read doubles the wait, up to 16s. */
export function pollWaitMs(failures: number): number {
  const n = Math.max(0, Math.floor(failures));
  return Math.min(4000 * 2 ** Math.min(n, 2), 16000);
}

export function expiredChainError(message: string): boolean {
  return (
    message.includes("block height exceeded") ||
    message.includes("Blockhash not found")
  );
}

/**
 * Turns and the end-of-match commit run on the rollup only while the
 * delegation program owns the match account. Settlement stays on devnet.
 */
export function turnRoute(ownerIsDelegationProgram: boolean): "rollup" | "base" {
  return ownerIsDelegationProgram ? "rollup" : "base";
}
