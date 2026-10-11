import assert from "node:assert/strict";
import test from "node:test";
import { decideSit, guestBase58, guestBenchView, hostBenchView, revealGate, secretForSeat } from "./seat";

const ME = "E8yaGuestWallet";
const OTHER = "72e7HostWallet";

test("an empty seat is joined once", () => {
  assert.equal(decideSit(null, ME), "join");
});

test("sitting again when this wallet is already the guest continues", () => {
  assert.equal(decideSit(ME, ME), "continue");
});

test("a seat held by someone else is not joined again", () => {
  assert.equal(decideSit(OTHER, ME), "taken");
});

test("a second sit reuses the secret that was already committed", () => {
  const committed = new Uint8Array([1, 2, 3]);
  const fresh = new Uint8Array([9, 9, 9]);
  assert.equal(secretForSeat(committed, fresh), committed);
});

test("the first sit uses a fresh secret", () => {
  const fresh = new Uint8Array([9, 9, 9]);
  assert.equal(secretForSeat(null, fresh), fresh);
});

test("guest pubkey is read only when the account has one", () => {
  assert.equal(guestBase58(null), null);
  assert.equal(guestBase58(undefined), null);
  assert.equal(guestBase58({ toBase58: () => ME }), ME);
});

test("reveal waits while a send is in flight and retries after a miss", () => {
  assert.equal(
    revealGate({ needed: true, landed: false, busy: true, inflight: false, attempts: 0 }),
    "wait",
  );
  assert.equal(
    revealGate({ needed: true, landed: false, busy: false, inflight: true, attempts: 1 }),
    "wait",
  );
  assert.equal(
    revealGate({ needed: true, landed: false, busy: false, inflight: false, attempts: 1 }),
    "send",
  );
});

test("a stalled host request still shows the step and a way out", () => {
  const waiting = hostBenchView({
    guestReady: false,
    hostRevealed: false,
    guestRevealed: false,
    working: true,
  });
  assert.equal(waiting.title, "Waiting for an opponent.");
  assert.equal(waiting.close, true);
  assert.equal(waiting.launch, false);

  const starting = hostBenchView({
    guestReady: true,
    hostRevealed: true,
    guestRevealed: true,
    working: true,
  });
  assert.equal(starting.title, "Starting the match.");
  assert.equal(starting.launch, true);
  assert.equal(starting.close, false);
});

test("a stalled guest request still shows leave, and launch once both revealed", () => {
  const revealing = guestBenchView({
    joined: true,
    hostRevealed: true,
    guestRevealed: false,
    working: true,
  });
  assert.equal(revealing.title, "The host revealed. Sending yours.");
  assert.equal(revealing.leave, true);
  assert.equal(revealing.launch, false);

  const starting = guestBenchView({
    joined: true,
    hostRevealed: true,
    guestRevealed: true,
    working: true,
  });
  assert.equal(starting.launch, true);
  assert.equal(starting.leave, true);
});

test("reveal stops after it lands, when it is not needed, or after three misses", () => {
  assert.equal(
    revealGate({ needed: true, landed: true, busy: false, inflight: false, attempts: 1 }),
    "stop",
  );
  assert.equal(
    revealGate({ needed: false, landed: false, busy: false, inflight: false, attempts: 0 }),
    "stop",
  );
  assert.equal(
    revealGate({ needed: true, landed: false, busy: false, inflight: false, attempts: 3 }),
    "stop",
  );
});
