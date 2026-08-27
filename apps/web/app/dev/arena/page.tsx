"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const DuelArena3D = dynamic(() => import("@/components/DuelArena3D"), {
  ssr: false,
});

// Visual iteration playground — renders the full arena with NO wallet, NO
// chain, NO match. Every visual state is selectable so the arena can be
// audited and tuned in one pass.
export default function DevArenaPage() {
  const [playerHp, setPlayerHp] = useState(4);
  const [oppHp, setOppHp] = useState(4);
  const [liveCount, setLiveCount] = useState(5);
  const [blankCount, setBlankCount] = useState(3);
  const [isYourTurn, setIsYourTurn] = useState(true);
  const [gunHeld, setGunHeld] = useState(true);
  const [target, setTarget] = useState<"self" | "opponent">("opponent");
  const [firing, setFiring] = useState<"live" | "blank" | null>(null);

  const btn =
    "px-3 py-1 border border-rust/60 text-rust hover:text-red-400 hover:border-red-700 text-[11px] tracking-[0.3em]";

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-zinc-300">
      <DuelArena3D
        isYourTurn={isYourTurn}
        gunHeld={gunHeld}
        setGunHeld={setGunHeld}
        target={target}
        firing={firing}
        playerOneHp={playerHp}
        playerTwoHp={oppHp}
        playerOnePubkey="CeoeQQj6233aJ1SMKzrdVrVeLZVJ8C5zwXT7JNdfj8f4"
        playerTwoPubkey="GoeHXdTuSeJVeX9AREqtyMJ7SYuABbdGnsCbSRSs1XMv"
        liveCount={liveCount}
        blankCount={blankCount}
      />

      {/* Debug control deck */}
      <div className="absolute bottom-3 left-3 z-50 flex flex-col gap-2 rounded border border-rust/40 bg-black/80 p-3 font-mono backdrop-blur-sm">
        <div className="text-[10px] tracking-[0.4em] text-red-500">// ARENA DEBUG</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] text-zinc-500">YOUR HP</span>
          {[0, 1, 2, 3, 4].map((n) => (
            <button key={n} className={`${btn} ${playerHp === n ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setPlayerHp(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] text-zinc-500">ENEMY HP</span>
          {[0, 1, 2, 3, 4].map((n) => (
            <button key={n} className={`${btn} ${oppHp === n ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setOppHp(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] text-zinc-500">LIVE</span>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={`${btn} ${liveCount === n ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setLiveCount(n)}>
              {n}
            </button>
          ))}
          <span className="text-[10px] tracking-[0.2em] text-zinc-500 ml-2">BLANK</span>
          {[0, 1, 2, 3].map((n) => (
            <button key={n} className={`${btn} ${blankCount === n ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setBlankCount(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className={`${btn} ${isYourTurn ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setIsYourTurn((v) => !v)}>
            {isYourTurn ? "YOUR TURN" : "ENEMY TURN"}
          </button>
          <button className={`${btn} ${gunHeld ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setGunHeld((v) => !v)}>
            GUN {gunHeld ? "HELD" : "ON TABLE"}
          </button>
          <button className={`${btn} ${target === "opponent" ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setTarget((t) => (t === "opponent" ? "self" : "opponent"))}>
            TARGET {target.toUpperCase()}
          </button>
          <button className={btn} onClick={() => { setFiring("live"); setTimeout(() => setFiring(null), 700); }}>
            FIRE LIVE
          </button>
          <button className={btn} onClick={() => { setFiring("blank"); setTimeout(() => setFiring(null), 350); }}>
            FIRE BLANK
          </button>
        </div>
      </div>
    </main>
  );
}
