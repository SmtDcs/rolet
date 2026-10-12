"use client";

// Temporary tuning route for the chamber room. Not linked from anywhere;
// it exists so the scene can be graded against the reference frame without
// an on-chain match. Delete when the room lands in /duel.

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const DuelRoom3D = dynamic(() => import("@/components/DuelRoom3D"), {
  ssr: false,
});

function Sketch() {
  const raw = useSearchParams().get("raw") === "1";
  return (
    <DuelRoom3D
      isYourTurn
      gunHeld={false}
      target="opponent"
      firing={null}
      opponentPubkey=""
      opponentHp={4}
      opponentHitSignal={0}
      liveCount={5}
      blankCount={3}
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
