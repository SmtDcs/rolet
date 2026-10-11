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

/** Devnet airdrop is the only funding. A miss must not transfer SOL out of the wallet. */
export function sessionFundPlan(airdropLanded: boolean): "register" | "skip" {
  return airdropLanded ? "register" : "skip";
}

/** A session key with no lamports cannot pay a turn. Leave the wallet as signer. */
export function shouldArmSession(funded: boolean): boolean {
  return funded;
}

/** A remount inside ten minutes must not register another session key. */
export function sessionAttemptFresh(previousMs: number | null, now: number): boolean {
  if (previousMs == null || !Number.isFinite(previousMs)) return true;
  return now - previousMs > 10 * 60 * 1000;
}

export function sessionArmMessage(funded: boolean): string {
  return funded
    ? "Session key armed. Turns stay on this device."
    : "Session key has no fee. Turns will ask the wallet.";
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
