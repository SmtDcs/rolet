import { NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Live counters for the landing ledger. Read straight from devnet so the
 * numbers are the chain's, not a marketing claim. Cached for a minute.
 */
const UPSTREAM = process.env.RPCFAST_BACKEND_URL ?? "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ROLET_PROGRAM_ID ??
    "mspQcUFhmAGYUsnBbcUndhaZiris53KtwYCjDHU91oH"
);

const PROFILE_SIZE = 190;
const LOBBY_SIZE = 221;

export const revalidate = 60;

export async function GET() {
  try {
    const conn = new Connection(UPSTREAM, "confirmed");
    const vault = PublicKey.findProgramAddressSync([Buffer.from("vault")], PROGRAM_ID)[0];
    const treasury = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury-sol"), vault.toBuffer()],
      PROGRAM_ID
    )[0];

    // dataSlice of length 0 keeps the response to keys only.
    const slice = { dataSlice: { offset: 0, length: 0 } };
    const [profiles, lobbies, treasuryLamports] = await Promise.all([
      conn.getProgramAccounts(PROGRAM_ID, { filters: [{ dataSize: PROFILE_SIZE }], ...slice }),
      conn.getProgramAccounts(PROGRAM_ID, { filters: [{ dataSize: LOBBY_SIZE }], ...slice }),
      conn.getBalance(treasury),
    ]);

    return NextResponse.json(
      {
        characters: profiles.length,
        lobbies: lobbies.length,
        treasurySol: Number((treasuryLamports / LAMPORTS_PER_SOL).toFixed(4)),
        source: "devnet",
      },
      { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json(
      { characters: null, lobbies: null, treasurySol: null, source: "unavailable" },
      { status: 200 }
    );
  }
}
