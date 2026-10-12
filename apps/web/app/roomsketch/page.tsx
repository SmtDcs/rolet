"use client";

// Temporary tuning route for the chamber room. Not linked from anywhere; it
// exists so the scene can be graded and its states exercised without an
// on-chain match. Every prop below can be driven from the query string:
//
//   ?held=1&target=self&fire=live&ohp=2&live=3&blank=5&raw=1
//
// Delete when the room lands in /duel.

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const DuelRoom3D = dynamic(() => import("@/components/DuelRoom3D"), {
  ssr: false,
});

function pick<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function num(value: string | null, fallback: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(max, Math.round(n)));
}

function Sketch() {
  const q = useSearchParams();
  const raw = q.get("raw") === "1";
  return (
    <DuelRoom3D
      isYourTurn={q.get("turn") !== "0"}
      gunHeld={q.get("held") === "1"}
      target={pick(q.get("target"), ["self", "opponent"] as const, "opponent")}
      firing={
        q.get("fire") === "live"
          ? "live"
          : q.get("fire") === "blank"
            ? "blank"
            : null
      }
      opponentPubkey=""
      opponentHp={num(q.get("ohp"), 4, 4)}
      opponentHitSignal={num(q.get("hit"), 0, 999999)}
      liveCount={num(q.get("live"), 5, 5)}
      blankCount={num(q.get("blank"), 3, 3)}
      raw={raw}
    />
  );
}

export default function RoomSketchPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <Suspense fallback={null}>
        <Sketch />
      </Suspense>
    </main>
  );
}
