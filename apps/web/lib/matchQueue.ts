/** In-memory pair queue. One Node process. Players do not choose the room. */

const WAIT_MS = 180_000;
const UNOPENED_MS = 180_000;
const OPEN_MS = 10 * 60_000;
const TOKEN_MS = 10 * 60_000;

export type QueueView =
  | { status: "waiting" }
  | { status: "host"; matchId: string; opened: boolean }
  | { status: "guest"; matchId: string; opened: boolean }
  | { status: "expired" };

type Waiter = { wallet: string; since: number };
type Pair = {
  matchId: string;
  host: string;
  guest: string;
  createdAt: number;
  openedAt: number | null;
};
type Token = { token: string; wallet: string; expiresAt: number };

export type QueueState = {
  seq: number;
  waiters: Waiter[];
  pairs: Pair[];
  tokens: Token[];
};

export function createQueue(): QueueState {
  return { seq: 0, waiters: [], pairs: [], tokens: [] };
}

export function queueMessage(wallet: string, now: number): string {
  return `ROLET queue\n${wallet}\n${now}`;
}

export function parseQueueMessage(message: string): { wallet: string; at: number } | null {
  const lines = message.split("\n");
  if (lines.length !== 3 || lines[0] !== "ROLET queue") return null;
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(lines[1])) return null;
  if (!/^\d+$/.test(lines[2])) return null;
  const at = Number(lines[2]);
  if (!Number.isSafeInteger(at)) return null;
  return { wallet: lines[1], at };
}

function tokenOf(state: QueueState, token: string, now: number): Token | null {
  const row = state.tokens.find((t) => t.token === token);
  if (!row || row.expiresAt < now) return null;
  return row;
}

function sweep(state: QueueState, now: number) {
  state.waiters = state.waiters.filter((w) => now - w.since < WAIT_MS);
  state.pairs = state.pairs.filter((p) =>
    p.openedAt == null ? now - p.createdAt < UNOPENED_MS : now - p.openedAt < OPEN_MS,
  );
  state.tokens = state.tokens.filter((t) => t.expiresAt >= now);
}

function viewFor(state: QueueState, wallet: string): QueueView {
  const pair = state.pairs.find((p) => p.host === wallet || p.guest === wallet);
  if (pair) {
    return {
      status: pair.host === wallet ? "host" : "guest",
      matchId: pair.matchId,
      opened: pair.openedAt != null,
    };
  }
  if (state.waiters.some((w) => w.wallet === wallet)) return { status: "waiting" };
  return { status: "expired" };
}

function issue(state: QueueState, wallet: string, now: number): string {
  const existing = state.tokens.find((t) => t.wallet === wallet && t.expiresAt >= now);
  if (existing) {
    existing.expiresAt = now + TOKEN_MS;
    return existing.token;
  }
  state.tokens = state.tokens.filter((t) => t.wallet !== wallet);
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const token = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  state.tokens.push({ token, wallet, expiresAt: now + TOKEN_MS });
  return token;
}

export type QueueStep = {
  phase: "waiting" | "opponent" | "offer-open" | "offer-sit" | "enter-host" | "idle";
  leave: boolean;
  matchId?: string;
};

/** What the seated wallet should do. A failed open is not a leave. */
export function reduceQueueView(view: QueueView | null): QueueStep {
  if (!view || view.status === "expired") return { phase: "idle", leave: false };
  if (view.status === "waiting") return { phase: "waiting", leave: false };
  if (view.status === "guest" && !view.opened) {
    return { phase: "opponent", leave: false, matchId: view.matchId };
  }
  if (view.status === "guest") return { phase: "offer-sit", leave: false, matchId: view.matchId };
  if (view.opened) return { phase: "enter-host", leave: false, matchId: view.matchId };
  return { phase: "offer-open", leave: false, matchId: view.matchId };
}

export function enterQueue(
  state: QueueState,
  wallet: string,
  now: number,
): { token: string; view: QueueView; duplicate: boolean } {
  sweep(state, now);
  const sitting = viewFor(state, wallet);
  if (sitting.status === "waiting") {
    const waiter = state.waiters.find((w) => w.wallet === wallet);
    if (waiter) waiter.since = now;
    return { token: issue(state, wallet, now), view: sitting, duplicate: true };
  }
  if (sitting.status === "host" || sitting.status === "guest") {
    return { token: issue(state, wallet, now), view: sitting, duplicate: true };
  }

  const other = state.waiters.shift();
  if (!other || other.wallet === wallet) {
    state.waiters.push({ wallet, since: now });
    return { token: issue(state, wallet, now), view: { status: "waiting" }, duplicate: false };
  }

  state.seq = (state.seq + 1) % 1000;
  const matchId = String(now * 1000 + state.seq);
  state.pairs.push({
    matchId,
    host: other.wallet,
    guest: wallet,
    createdAt: now,
    openedAt: null,
  });
  return {
    token: issue(state, wallet, now),
    view: { status: "guest", matchId, opened: false },
    duplicate: false,
  };
}

export function statusQueue(state: QueueState, token: string, now: number): QueueView | null {
  sweep(state, now);
  const row = tokenOf(state, token, now);
  if (!row) return null;
  row.expiresAt = now + TOKEN_MS;
  const waiter = state.waiters.find((w) => w.wallet === row.wallet);
  if (waiter) waiter.since = now;
  return viewFor(state, row.wallet);
}

export function markOpened(state: QueueState, token: string, now: number): boolean {
  sweep(state, now);
  const row = tokenOf(state, token, now);
  if (!row) return false;
  const pair = state.pairs.find((p) => p.host === row.wallet && p.openedAt == null);
  if (!pair) return false;
  pair.openedAt = now;
  return true;
}

export function leaveQueue(state: QueueState, token: string, now: number): void {
  sweep(state, now);
  const row = tokenOf(state, token, now);
  if (!row) return;
  state.waiters = state.waiters.filter((w) => w.wallet !== row.wallet);
  state.pairs = state.pairs.filter(
    (p) => p.openedAt != null || (p.host !== row.wallet && p.guest !== row.wallet),
  );
  state.tokens = state.tokens.filter((t) => t.wallet !== row.wallet);
}

const globalQueue = globalThis as typeof globalThis & { __roletMatchQueue?: QueueState };

export function getMatchQueue(): QueueState {
  if (!globalQueue.__roletMatchQueue) globalQueue.__roletMatchQueue = createQueue();
  return globalQueue.__roletMatchQueue;
}

let chain: Promise<void> = Promise.resolve();

export function withMatchQueue<T>(fn: (state: QueueState) => T): Promise<T> {
  const run = chain.then(() => fn(getMatchQueue()));
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
