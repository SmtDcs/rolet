import assert from "node:assert/strict";
import { createPrivateKey, sign } from "node:crypto";
import test from "node:test";
import { Keypair } from "@solana/web3.js";
import {
  createQueue,
  enterQueue,
  leaveQueue,
  markOpened,
  parseQueueMessage,
  queueMessage,
  reduceQueueView,
  statusQueue,
} from "./matchQueue";
import { verifyQueueSignature } from "./queueSignature";

const A = "11111111111111111111111111111111";
const B = "22222222222222222222222222222222";
const C = "33333333333333333333333333333333";

test("the first wallet waits and the second becomes the guest", () => {
  const q = createQueue();
  const first = enterQueue(q, A, 1_000);
  assert.equal(first.view.status, "waiting");
  const second = enterQueue(q, B, 2_000);
  assert.equal(second.view.status, "guest");
  assert.equal(second.view.opened, false);
  const host = statusQueue(q, first.token, 2_100);
  assert.equal(host?.status, "host");
  if (host?.status !== "host" || second.view.status !== "guest") return;
  assert.equal(host.matchId, second.view.matchId);
  assert.equal(q.pairs.length, 1);
  assert.equal(q.waiters.length, 0);
});

test("a third wallet waits for the next pair", () => {
  const q = createQueue();
  enterQueue(q, A, 1_000);
  enterQueue(q, B, 2_000);
  const third = enterQueue(q, C, 3_000);
  assert.equal(third.view.status, "waiting");
  assert.equal(q.waiters.length, 1);
});

test("the same wallet cannot sit twice", () => {
  const q = createQueue();
  enterQueue(q, A, 1_000);
  const again = enterQueue(q, A, 1_500);
  assert.equal(again.view.status, "waiting");
  assert.equal(q.waiters.length, 1);
});

test("a stale waiter is dropped", () => {
  const q = createQueue();
  enterQueue(q, A, 1_000);
  const next = enterQueue(q, B, 1_000 + 180_000);
  assert.equal(next.view.status, "waiting");
  assert.equal(q.waiters.length, 1);
  assert.equal(q.waiters[0].wallet, B);
});

test("only the host can mark the bench open", () => {
  const q = createQueue();
  const host = enterQueue(q, A, 1_000);
  const guest = enterQueue(q, B, 2_000);
  assert.equal(markOpened(q, guest.token, 2_500), false);
  assert.equal(markOpened(q, host.token, 2_500), true);
  const seen = statusQueue(q, guest.token, 2_600);
  assert.equal(seen?.status, "guest");
  if (seen?.status === "guest") assert.equal(seen.opened, true);
});

test("an unopened pair expires", () => {
  const q = createQueue();
  const host = enterQueue(q, A, 1_000);
  enterQueue(q, B, 2_000);
  const seen = statusQueue(q, host.token, 2_000 + 180_000);
  assert.equal(seen?.status, "expired");
});

test("leaving before open frees the other seat", () => {
  const q = createQueue();
  const host = enterQueue(q, A, 1_000);
  const guest = enterQueue(q, B, 2_000);
  leaveQueue(q, host.token, 2_100);
  const seen = statusQueue(q, guest.token, 2_200);
  assert.equal(seen?.status, "expired");
});

test("the second wallet does not kick the first session", () => {
  const q = createQueue();
  const first = enterQueue(q, A, 1_000);
  enterQueue(q, B, 2_000);
  const seen = statusQueue(q, first.token, 2_100);
  assert.equal(seen?.status, "host");
  assert.equal(reduceQueueView(seen).leave, false);
  assert.equal(reduceQueueView(seen).phase, "offer-open");
});

test("sitting again does not replace the first session token", () => {
  const q = createQueue();
  const first = enterQueue(q, A, 1_000);
  const again = enterQueue(q, A, 1_500);
  assert.equal(first.duplicate, false);
  assert.equal(again.duplicate, true);
  assert.equal(again.token, first.token);
  const seen = statusQueue(q, first.token, 1_600);
  assert.equal(seen?.status, "waiting");
});

test("a status poll keeps the seat past the original token lifetime", () => {
  const q = createQueue();
  const first = enterQueue(q, A, 0);
  let now = 0;
  for (let i = 0; i < 5; i++) {
    now += 150_000;
    const seen = statusQueue(q, first.token, now);
    assert.equal(seen?.status, "waiting", `poll ${i}`);
  }
});

test("a failed bench open is not a reason to leave", () => {
  const step = reduceQueueView({ status: "host", matchId: "42", opened: false });
  assert.equal(step.leave, false);
  assert.equal(step.phase, "offer-open");
  assert.equal(step.matchId, "42");
});

test("the guest sees the opponent before the bench is open, then gets a sit action", () => {
  const waiting = reduceQueueView({ status: "guest", matchId: "42", opened: false });
  assert.equal(waiting.phase, "opponent");
  assert.equal(waiting.leave, false);
  assert.notEqual(waiting.phase, reduceQueueView({ status: "waiting" }).phase);
  const sit = reduceQueueView({ status: "guest", matchId: "42", opened: true });
  assert.equal(sit.phase, "offer-sit");
  assert.equal(sit.leave, false);
});

test("a wallet signature matches the queue message", () => {
  const kp = Keypair.generate();
  const message = queueMessage(kp.publicKey.toBase58(), 5_000);
  const key = createPrivateKey({
    key: Buffer.concat([
      Buffer.from("302e020100300506032b657004220420", "hex"),
      Buffer.from(kp.secretKey.slice(0, 32)),
    ]),
    format: "der",
    type: "pkcs8",
  });
  const signature = sign(null, Buffer.from(message), key);
  const ok = verifyQueueSignature(message, signature, 5_000);
  assert.equal(ok?.wallet, kp.publicKey.toBase58());
  assert.equal(verifyQueueSignature(message, signature, 5_000 + 121_000), null);
  assert.equal(parseQueueMessage("nope"), null);
});
