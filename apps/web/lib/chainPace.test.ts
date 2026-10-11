import assert from "node:assert/strict";
import test from "node:test";
import {
  blockhashExpired,
  expiredChainError,
  explicitWalletAdapters,
  launchActor,
  pollWaitMs,
  readSignature,
  seedReady,
  sessionFundPlan,
  sessionArmMessage,
  timeoutClaimable,
  sessionAttemptFresh,
  shouldArmSession,
  turnRoute,
} from "./chainPace";

test("only the host sends the launch transaction", () => {
  assert.equal(launchActor("host"), "send");
  assert.equal(launchActor("guest"), "watch");
});

test("launch waits until the seed slot is known to be in the past", () => {
  assert.equal(seedReady(0, 100), false);
  assert.equal(seedReady(100, null), false);
  assert.equal(seedReady(100, 0), false);
  assert.equal(seedReady(100, 100), false);
  assert.equal(seedReady(101, 100), true);
});

test("an unfunded session key is not armed", () => {
  assert.equal(shouldArmSession(false), false);
  assert.equal(shouldArmSession(true), true);
  assert.equal(sessionArmMessage(true), "Session key armed. Turns stay on this device.");
  assert.equal(sessionArmMessage(false), "Session key has no fee. Turns will ask the wallet.");
});

test("a failed read waits longer, and a quiet read stays at four seconds", () => {
  assert.equal(pollWaitMs(0), 4000);
  assert.equal(pollWaitMs(1), 8000);
  assert.equal(pollWaitMs(3), 16000);
});

test("a refresh does not register a second session key inside ten minutes", () => {
  const now = 1_000_000;
  assert.equal(sessionAttemptFresh(null, now), true);
  assert.equal(sessionAttemptFresh(now - 60_000, now), false);
  assert.equal(sessionAttemptFresh(now - 11 * 60_000, now), true);
});

test("a failed airdrop does not take SOL from the wallet", () => {
  assert.equal(sessionFundPlan(true), "register");
  assert.equal(sessionFundPlan(false), "skip");
});

test("a fresh match does not offer a timeout claim", () => {
  assert.equal(
    timeoutClaimable({ status: "active", yourTurn: false, currentSlot: 1_000, lastActionSlot: 1_000 }),
    false,
  );
  assert.equal(
    timeoutClaimable({ status: "active", yourTurn: false, currentSlot: 0, lastActionSlot: 1_000 }),
    false,
  );
  assert.equal(
    timeoutClaimable({ status: "active", yourTurn: true, currentSlot: 1_200, lastActionSlot: 1_000 }),
    false,
  );
  assert.equal(
    timeoutClaimable({ status: "active", yourTurn: false, currentSlot: 1_151, lastActionSlot: 1_000 }),
    true,
  );
});

test("legacy wallet adapters are not registered beside Wallet Standard", () => {
  assert.deepEqual(explicitWalletAdapters(), []);
});

test("a signature is confirmed from HTTP status, not a websocket", () => {
  assert.equal(readSignature(null), "pending");
  assert.equal(readSignature({ err: null, confirmationStatus: "processed" }), "pending");
  assert.equal(readSignature({ err: null, confirmationStatus: "confirmed" }), "landed");
  assert.equal(readSignature({ err: { InstructionError: [0, "Custom"] }, confirmationStatus: "confirmed" }), "failed");
  assert.equal(blockhashExpired(100, 100), false);
  assert.equal(blockhashExpired(101, 100), true);
});

test("an expired blockhash is sent again by the session key", () => {
  assert.equal(expiredChainError("Signature abc has expired: block height exceeded."), true);
  assert.equal(expiredChainError("Transaction simulation failed: Blockhash not found."), true);
  assert.equal(expiredChainError("Wallet not connected"), false);
});

test("a delegated match sends turns to the rollup", () => {
  assert.equal(turnRoute(true), "rollup");
  assert.equal(turnRoute(false), "base");
});
