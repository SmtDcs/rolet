import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const ACTIONS_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Content-Encoding, Accept-Encoding",
};

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "rolet.fun";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;

  const payload = {
    type: "action",
    icon: `${baseUrl}/favicon.ico`,
    title: "ROLET — Tactical PvP Duel Protocol on Solana",
    description:
      "Enter tactical turn-based chamber duels on Solana Devnet. Powered by Metaplex Core NFTs, session-key gameplay, and provably fair commit-reveal randomness.",
    label: "Duel Now",
    links: {
      actions: [
        {
          label: "Join Quick Match",
          href: `${baseUrl}/api/actions/duel?action=quickmatch`,
        },
        {
          label: "Host Match 0.1 SOL",
          href: `${baseUrl}/api/actions/duel?action=host`,
        },
        {
          label: "Mint Character NFT",
          href: `${baseUrl}/api/actions/duel?action=mint`,
        },
      ],
    },
  };

  return NextResponse.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accountStr = body?.account;
    if (!accountStr) {
      return NextResponse.json(
        { error: "Missing account public key in body" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const payer = new PublicKey(accountStr);
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action") || "quickmatch";

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
      "confirmed"
    );

    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const transaction = new Transaction({
      feePayer: payer,
      recentBlockhash: blockhash,
    });

    let message = "Joining ROLET Tactical Duel...";

    if (action === "host" || action === "mint") {
      // Program treasury vault memo / deposit transaction
      const transferAmount = action === "mint" ? 1 * LAMPORTS_PER_SOL : 0.1 * LAMPORTS_PER_SOL;
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: payer, // Safe no-op self transfer with memo structure for demonstration
          lamports: 0,
        })
      );
      message = action === "mint" ? "Minting Duelist Character NFT..." : "Hosting ROLET duel lobby on-chain...";
    } else {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: payer,
          lamports: 0,
        })
      );
    }

    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return NextResponse.json(
      {
        transaction: serializedTx.toString("base64"),
        message,
      },
      { headers: ACTIONS_CORS_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to construct Solana action: ${msg}` },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: ACTIONS_CORS_HEADERS,
  });
}
