import { NextRequest, NextResponse } from "next/server";
import bs58 from "bs58";
import {
  enterQueue,
  leaveQueue,
  markOpened,
  statusQueue,
  withMatchQueue,
  type QueueView,
} from "@/lib/matchQueue";
import { verifyQueueSignature } from "@/lib/queueSignature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(
  body:
    | { ok: true; token?: string; view: QueueView; duplicate?: boolean }
    | { ok: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  let body: {
    action?: string;
    wallet?: string;
    message?: string;
    signature?: string;
    token?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Missing queue request." }, 400);
  }

  const now = Date.now();

  if (body.action === "enter") {
    if (!body.message || !body.signature || !body.wallet) {
      return json({ ok: false, error: "Missing queue signature." }, 400);
    }
    let signature: Uint8Array;
    try {
      signature = bs58.decode(body.signature);
    } catch {
      return json({ ok: false, error: "Bad queue signature." }, 400);
    }
    const signed = verifyQueueSignature(body.message, signature, now);
    if (!signed || signed.wallet !== body.wallet) {
      return json({ ok: false, error: "Queue signature was rejected." }, 401);
    }
    const result = await withMatchQueue((state) => enterQueue(state, signed.wallet, now));
    return json({ ok: true, token: result.token, view: result.view, duplicate: result.duplicate });
  }

  if (!body.token) return json({ ok: false, error: "Missing queue token." }, 400);

  if (body.action === "status") {
    const view = await withMatchQueue((state) => statusQueue(state, body.token as string, now));
    if (!view) return json({ ok: false, error: "Queue session expired." }, 404);
    return json({ ok: true, view });
  }

  if (body.action === "opened") {
    const ok = await withMatchQueue((state) => markOpened(state, body.token as string, now));
    if (!ok) return json({ ok: false, error: "This wallet is not opening the bench." }, 409);
    const view = await withMatchQueue((state) => statusQueue(state, body.token as string, now));
    return json({ ok: true, view: view ?? { status: "expired" } });
  }

  if (body.action === "leave") {
    await withMatchQueue((state) => leaveQueue(state, body.token as string, now));
    return json({ ok: true, view: { status: "expired" } });
  }

  return json({ ok: false, error: "Unknown queue action." }, 400);
}
