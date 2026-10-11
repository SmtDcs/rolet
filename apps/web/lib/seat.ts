/** Sit down against a lobby that may already list a guest. */
export function decideSit(guest: string | null, wallet: string): "join" | "continue" | "taken" {
  if (guest === wallet) return "continue";
  if (guest) return "taken";
  return "join";
}

/** A later click must not replace the secret already committed on-chain. */
export function secretForSeat(existing: Uint8Array | null, fresh: Uint8Array): Uint8Array {
  return existing ?? fresh;
}

export function guestBase58(
  guest: { toBase58: () => string } | null | undefined,
): string | null {
  return guest ? guest.toBase58() : null;
}

export type RevealGate = {
  needed: boolean;
  landed: boolean;
  busy: boolean;
  inflight: boolean;
  attempts: number;
};

export type BenchView = {
  title: string;
  launch: boolean;
  close: boolean;
  leave: boolean;
};

/**
 * A slow request must not blank the screen. Close stays until both reveals.
 * Launch stays once both secrets are in, including while a start is in flight.
 */
export function hostBenchView(state: {
  guestReady: boolean;
  hostRevealed: boolean;
  guestRevealed: boolean;
  working: boolean;
}): BenchView {
  const both = state.hostRevealed && state.guestRevealed;
  const title = both
    ? state.working
      ? "Starting the match."
      : "Both revealed. Starting the match."
    : !state.guestReady
      ? "Waiting for an opponent."
      : !state.hostRevealed
        ? "Opponent sat down. Revealing."
        : "Waiting for their reveal.";
  return { title, launch: both, close: !both, leave: false };
}

/** Same rule for the guest: the step stays readable, and an action stays on screen. */
export function guestBenchView(state: {
  joined: boolean;
  hostRevealed: boolean;
  guestRevealed: boolean;
  working: boolean;
}): BenchView {
  const both = state.hostRevealed && state.guestRevealed;
  const title = !state.joined
    ? "A seat is open."
    : both
      ? state.working
        ? "Starting the match."
        : "Both revealed. Starting the match."
      : state.hostRevealed && !state.guestRevealed
        ? "The host revealed. Sending yours."
        : "Sitting down. Revealing.";
  return { title, launch: both, close: false, leave: state.joined };
}

/** One failed reveal must retry. Three misses, or a landed reveal, must stop. */
export function revealGate(gate: RevealGate): "wait" | "send" | "stop" {
  if (!gate.needed || gate.landed) return "stop";
  if (gate.busy || gate.inflight) return "wait";
  if (gate.attempts >= 3) return "stop";
  return "send";
}
