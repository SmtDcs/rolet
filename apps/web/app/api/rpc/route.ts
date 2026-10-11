import { NextRequest, NextResponse } from "next/server";
import { rateLimitPlan } from "@/lib/chainPace";

const UPSTREAM_RPC = process.env.RPCFAST_BACKEND_URL ?? "https://api.devnet.solana.com";
const RPCFAST_API_KEY = process.env.RPCFAST_API_KEY ?? "";

/**
 * A match makes a few dozen calls a minute, so this stays clear of real play
 * while capping anyone using the proxy to burn the provider's quota.
 */
const RPC_LIMIT = 240;
const RPC_WINDOW_MS = 60_000;

type Bucket = { hits: number; windowStart: number };
const globalForRpc = globalThis as typeof globalThis & {
  __roletRpcRate?: Map<string, Bucket>;
};
const buckets = (globalForRpc.__roletRpcRate ??= new Map<string, Bucket>());

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? "local").trim();
}

function prune(now: number) {
  if (buckets.size < 512) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= RPC_WINDOW_MS) buckets.delete(key);
  }
}

/**
 * Thin JSON-RPC proxy so the browser never talks to RPC Fast directly
 * (their Beam product doesn't set CORS headers for browser origins).
 * The frontend sends requests to /api/rpc, and this route forwards them
 * server-side to the real RPC endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const now = Date.now();
    const key = clientKey(req);
    const previous = buckets.get(key) ?? { hits: 0, windowStart: now };
    const plan = rateLimitPlan({
      hits: previous.hits,
      windowStart: previous.windowStart,
      now,
      limit: RPC_LIMIT,
      windowMs: RPC_WINDOW_MS,
    });
    buckets.set(key, { hits: plan.hits, windowStart: plan.windowStart });
    prune(now);
    if (!plan.allow) {
      return NextResponse.json(
        { jsonrpc: "2.0", error: { code: -32005, message: "Too many requests" }, id: null },
        { status: 429 }
      );
    }

    const body = await req.text();

    const upstreamHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (RPCFAST_API_KEY) upstreamHeaders["X-Token"] = RPCFAST_API_KEY;

    const send = () =>
      fetch(UPSTREAM_RPC, {
        method: "POST",
        headers: upstreamHeaders,
        body,
      });
    let upstream: Response;
    try {
      upstream = await send();
    } catch {
      upstream = await send();
    }

    const data = await upstream.text();

    return new NextResponse(data, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32000, message: String(err) }, id: null },
      { status: 502 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
