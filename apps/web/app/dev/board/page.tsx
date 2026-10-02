"use client";

// Dev playground for the 2D duel board + card hand (mirrors /dev/arena).
// Open /dev/board and flip states to review the visuals. Not linked from
// the game itself.

import { useState } from "react";
import DuelBoard2D from "@/components/DuelBoard2D";
import HandRack2D from "@/components/HandRack2D";
import type { RoletCard } from "@/hooks/useRolet";

const SAMPLE_HAND: RoletCard[] = ["hawkEye", "doubleStrike", "silence", "healer"];

export default function DevBoardPage() {
  const [target, setTarget] = useState<"self" | "opponent">("opponent");
  const [firing, setFiring] = useState<"live" | "blank" | null>(null);
  const [opponentHp, setOpponentHp] = useState(4);
  const [opponentHitSignal, setOpponentHitSignal] = useState(0);
  const [turn, setTurn] = useState(true);
  const [hand, setHand] = useState<(RoletCard | null)[]>([...SAMPLE_HAND]);
  const [selected, setSelected] = useState<number | null>(null);
  const [playedSlot, setPlayedSlot] = useState<number | null>(null);
  const [playSignal, setPlaySignal] = useState(0);

  const fire = (kind: "live" | "blank") => {
    setFiring(kind);
    if (kind === "live" && target === "opponent") {
      setTimeout(() => setOpponentHitSignal(Date.now()), 200);
      setTimeout(() => setOpponentHp((h) => Math.max(0, h - 1)), 220);
    }
    setTimeout(() => setFiring(null), kind === "live" ? 700 : 320);
  };

  const playSelected = () => {
    if (selected == null) return;
    const slot = selected;
    setPlayedSlot(slot);
    setPlaySignal(Date.now());
    setSelected(null);
    setTimeout(() => setHand((h) => h.map((c, i) => (i === slot ? null : c))), 620);
  };

  const btn =
    "border border-rust/60 bg-black/60 px-3 py-1.5 text-[10px] tracking-[0.25em] text-zinc-300 hover:border-red-600 hover:text-red-300";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <DuelBoard2D
        isYourTurn={turn}
        gunHeld={turn}
        target={target}
        firing={firing}
        opponentPubkey="DevOpponent1111111111111111111111111111111"
        opponentHp={opponentHp}
        opponentHitSignal={opponentHitSignal}
        liveCount={5}
        blankCount={3}
      />

      {/* Bottom dock — hand + dev controls, mimicking the real duel layout */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-4 pb-3">
        <div className="relative h-32 w-full max-w-2xl crt-frame border border-rust/50 bg-black/70 p-2 backdrop-blur-sm">
          <HandRack2D
            hand={hand}
            selectedSlot={selected}
            onSelect={setSelected}
            disabled={!turn}
            playedSlot={playedSlot}
            playSignal={playSignal}
          />
          {selected !== null && hand[selected] && (
            <button
              onClick={playSelected}
              className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 border border-red-500 bg-black/85 px-4 py-1.5 text-[10px] tracking-[0.4em] text-red-300 backdrop-blur-sm hover:bg-red-950/60"
            >
              ▶ PLAY {(hand[selected] as string).toUpperCase()}
            </button>
          )}
        </div>

        <div className="crt-frame flex flex-wrap justify-center gap-2 border border-rust/60 bg-black/80 px-3 py-2 backdrop-blur-sm">
          <span className="px-2 py-1.5 text-[9px] tracking-[0.3em] text-rust">// DEV BOARD</span>
          <button className={btn} onClick={() => setTarget((t) => (t === "self" ? "opponent" : "self"))}>
            TARGET: {target.toUpperCase()}
          </button>
          <button className={btn} onClick={() => fire("live")}>
            FIRE LIVE
          </button>
          <button className={btn} onClick={() => fire("blank")}>
            FIRE BLANK
          </button>
          <button className={btn} onClick={() => setTurn((t) => !t)}>
            TURN: {turn ? "YOU" : "OPPONENT"}
          </button>
          <button className={btn} onClick={() => setOpponentHp((h) => (h > 0 ? h - 1 : 4))}>
            OPP HP: {opponentHp}
          </button>
          <button className={btn} onClick={() => setOpponentHitSignal(Date.now())}>
            HIT OPPONENT
          </button>
          <button
            className={btn}
            onClick={() => {
              setHand([...SAMPLE_HAND]);
              setOpponentHp(4);
              setSelected(null);
              setTarget("opponent");
              setTurn(true);
            }}
          >
            RESET
          </button>
        </div>
      </div>
    </main>
  );
}
