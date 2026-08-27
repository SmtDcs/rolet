"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import type { RoletCard } from "@/hooks/useRolet";

import DuelArena3D from "@/components/DuelArena3D";
const HandRack3D = dynamic(() => import("@/components/HandRack3D"), { ssr: false });

// Visual iteration playground — renders the full arena with the REAL game HUD
// (HP bar, card rack, PULL TRIGGER, target buttons) but NO wallet, NO chain,
// NO match. Compact debug sliders live top-left and can be ignored.

// ── Real game UI pieces (mirrored from app/duel/page.tsx) ────────────────────
function HpBar({ hp, maxHp, accent }: { hp: number; maxHp: number; accent: "player" | "opponent" }) {
  const low = hp <= 1;
  const mid = hp === 2;
  const aliveColor = low ? "#ff2020" : mid ? "#dd6600" : accent === "player" ? "#cc1a1a" : "#aa1010";
  const aliveGlow = low ? "#ff5050" : mid ? "#ff9933" : accent === "player" ? "#ff3030" : "#dd2020";
  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: maxHp }).map((_, i) => {
        const alive = i < hp;
        return (
          <motion.div
            key={i}
            className="relative flex-1 h-6 border border-zinc-800"
            animate={
              alive && low
                ? { boxShadow: [`0 0 8px ${aliveGlow}aa`, `0 0 22px ${aliveGlow}`, `0 0 8px ${aliveGlow}aa`] }
                : alive
                ? { boxShadow: `0 0 8px ${aliveGlow}66` }
                : { boxShadow: "none" }
            }
            transition={low && alive ? { boxShadow: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } } : { duration: 0.3 }}
          >
            <div className="absolute inset-0 grid grid-rows-2 grid-cols-4 gap-px p-px">
              {Array.from({ length: 8 }).map((_, j) => (
                <motion.div
                  key={j}
                  initial={false}
                  animate={{ scale: alive ? 1 : 0, opacity: alive ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 24 }}
                  style={{
                    backgroundColor: alive ? aliveColor : "#0e0606",
                    boxShadow: alive ? `inset 0 0 2px ${aliveGlow}` : "none",
                  }}
                />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function TargetButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 border text-[10px] tracking-[0.3em] transition-all ${
        active
          ? "border-red-600 bg-red-950/60 text-red-300 shadow-[0_0_12px_rgba(220,30,30,0.5)]"
          : "border-rust/60 bg-black/40 text-zinc-500 hover:border-rust hover:text-zinc-300"
      }`}
    >
      {active ? "▣" : "□"} {label}
    </button>
  );
}

const CARD_LABEL: Record<RoletCard, string> = {
  restoreBullet: "RestoreBullet",
  hawkEye: "HawkEye",
  silence: "Silence",
  blocker: "Blockade",
  bulletExtractor: "Extractor",
  shuffler: "Shuffler",
  doubleStrike: "DoubleStrike",
  healer: "Healer",
  cardThief: "CardThief",
  randomInsight: "RandomInsight",
  lastChance: "LastChance",
  handOfFate: "HandOfFate",
};

export default function DevArenaPage() {
  const [playerHp, setPlayerHp] = useState(4);
  const [oppHp, setOppHp] = useState(4);
  const [liveCount, setLiveCount] = useState(5);
  const [blankCount, setBlankCount] = useState(3);
  const [isYourTurn, setIsYourTurn] = useState(true);
  const [gunHeld, setGunHeld] = useState(true);
  const [target, setTarget] = useState<"self" | "opponent">("opponent");
  const [firing, setFiring] = useState<"live" | "blank" | null>(null);
  const [hand, setHand] = useState<(RoletCard | null)[]>(["hawkEye", "restoreBullet", null, "silence"]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [debugOpen, setDebugOpen] = useState(true);

  const btn = "px-2 py-0.5 border border-rust/60 text-rust hover:text-red-400 hover:border-red-700 text-[10px] tracking-[0.2em]";

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-zinc-300" style={{ width: "100vw", height: "100vh" }}>
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

      {/* Atmosphere overlays — same as real duel */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(10, 6, 4, 0.4) 75%)", zIndex: 2 }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px)", mixBlendMode: "multiply", zIndex: 8 }} />

      {/* Muzzle flash */}
      <AnimatePresence>
        {firing === "live" && (
          <motion.div
            key="fire-flash"
            className="pointer-events-none fixed inset-0 z-[99] mix-blend-screen"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ background: "radial-gradient(circle at 50% 55%, rgba(255,240,180,0.85) 0%, rgba(255,140,40,0.45) 25%, transparent 60%)" }}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-4 border-b border-rust/40 bg-black/40 backdrop-blur-sm">
        <span className="text-[10px] tracking-[0.4em] text-rust crt-text">// ARENA PREVIEW</span>
        <span className="text-[10px] tracking-[0.4em] text-zinc-400 crt-text">ROLET · VISUAL SANDBOX</span>
        <span className="text-[10px] tracking-[0.4em] text-red-500 animate-pulse crt-text">● LIVE</span>
      </div>

      {/* Real game HUD layout */}
      <div className="relative z-10 mx-auto grid h-full max-w-7xl grid-rows-[auto_1fr_auto] gap-1.5 px-6 pt-12 pb-2 overflow-hidden">
        {/* OPPONENT HUD */}
        <section className="relative flex justify-center pt-1">
          <div className="mt-3 flex items-center gap-4 border border-rust/60 bg-black/70 backdrop-blur-sm px-4 py-2">
            <div className="text-[10px] tracking-[0.4em] text-zinc-500">OPPONENT</div>
            <HpBar hp={oppHp} maxHp={4} accent="opponent" />
            <div className="text-[10px] tracking-[0.4em] text-rust">STATUS · WATCHING</div>
          </div>
        </section>

        {/* CENTER — empty space, 3D shows through (like the real CCTV viewport) */}
        <section className="relative flex items-stretch justify-center" />

        {/* PLAYER HUD */}
        <section className="relative flex flex-col gap-2 pt-1">
          <div className="grid grid-cols-12 gap-3 items-end">
            {/* Player vitals */}
            <div className="col-span-2 crt-frame crt-grain border border-rust/60 bg-black/70 backdrop-blur-sm p-2">
              <div className="flex items-center justify-between text-[8px] tracking-[0.35em] text-rust crt-text">
                <span>// SUBJECT_01</span>
                <span className={isYourTurn ? "text-red-400 animate-pulse" : "text-zinc-600"}>{isYourTurn ? "TURN" : "WAIT"}</span>
              </div>
              <div className="mt-2"><HpBar hp={playerHp} maxHp={4} accent="player" /></div>
              <div className="mt-1 text-center text-[9px] tracking-[0.3em] text-zinc-400 crt-text">HP {playerHp}/4</div>
            </div>

            {/* 3D card hand */}
            <div className="col-span-7 relative h-36">
              <HandRack3D
                hand={hand}
                selectedSlot={selectedSlot}
                onSelect={(i) => setSelectedSlot(i)}
                disabled={!isYourTurn}
              />
              {selectedSlot !== null && hand[selectedSlot] && (
                <button
                  onClick={() => { const card = hand[selectedSlot]!; const next = [...hand]; next[selectedSlot] = null; setHand(next); setSelectedSlot(null); }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 border border-red-500 bg-black/85 backdrop-blur-sm px-4 py-1.5 text-[10px] tracking-[0.4em] text-red-300 font-bold shadow-[0_0_18px_rgba(220,30,30,0.6)] hover:bg-red-950/60 crt-text"
                >
                  ▶ PLAY {CARD_LABEL[hand[selectedSlot]!].toUpperCase()}
                </button>
              )}
            </div>

            {/* Action panel */}
            <div className="col-span-3 crt-frame crt-grain border border-rust/60 bg-black/70 backdrop-blur-sm p-2 flex flex-col gap-2">
              <div className="text-[8px] tracking-[0.4em] text-rust crt-text">// FIRING SOLUTION</div>
              <div className="grid grid-cols-2 gap-1">
                <TargetButton label="OPP" active={target === "opponent"} onClick={() => setTarget("opponent")} />
                <TargetButton label="SELF" active={target === "self"} onClick={() => setTarget("self")} />
              </div>
              <motion.button
                onClick={() => { setFiring("live"); setTimeout(() => setFiring(null), 700); }}
                disabled={!isYourTurn}
                animate={isYourTurn ? { boxShadow: ["0 0 10px rgba(220,30,30,0.4), inset 0 0 12px rgba(120,0,0,0.3)", "0 0 28px rgba(255,30,30,0.85), inset 0 0 22px rgba(180,0,0,0.55)", "0 0 10px rgba(220,30,30,0.4), inset 0 0 12px rgba(120,0,0,0.3)"] } : { boxShadow: "none" }}
                whileHover={isYourTurn ? { scale: 1.04 } : {}}
                whileTap={isYourTurn ? { scale: 0.96 } : {}}
                transition={isYourTurn ? { boxShadow: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } } : {}}
                className={`group relative py-2.5 border-2 font-display tracking-[0.3em] text-sm transition-colors overflow-hidden ${
                  !isYourTurn ? "border-rust/40 text-rust/40 cursor-not-allowed" : "border-red-600 bg-gradient-to-b from-red-950/60 to-black text-red-400 text-bleed hover:text-red-100 hover:animate-red-alert"
                }`}
              >
                <span className="crt-text relative z-10">▼ PULL TRIGGER</span>
              </motion.button>
            </div>
          </div>
        </section>
      </div>

      {/* Compact debug deck — top-left, collapsible */}
      <div className="absolute top-12 left-3 z-50 flex flex-col gap-1.5 rounded border border-rust/40 bg-black/80 p-2.5 font-mono backdrop-blur-sm max-w-[280px]">
        <button className="text-[10px] tracking-[0.4em] text-red-500 text-left" onClick={() => setDebugOpen((v) => !v)}>
          {debugOpen ? "▾ ARENA DEBUG" : "▸ ARENA DEBUG"}
        </button>
        {debugOpen && (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] tracking-[0.2em] text-zinc-500">HP</span>
              {[0, 1, 2, 3, 4].map((n) => (
                <button key={`ph${n}`} className={`${btn} ${playerHp === n ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setPlayerHp(n)}>{n}</button>
              ))}
              <span className="text-[9px] tracking-[0.2em] text-zinc-500 ml-1">EN</span>
              {[0, 1, 2, 3, 4].map((n) => (
                <button key={`eh${n}`} className={`${btn} ${oppHp === n ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setOppHp(n)}>{n}</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] tracking-[0.2em] text-zinc-500">LIVE</span>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button key={`l${n}`} className={`${btn} ${liveCount === n ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setLiveCount(n)}>{n}</button>
              ))}
              <span className="text-[9px] tracking-[0.2em] text-zinc-500 ml-1">BLANK</span>
              {[0, 1, 2, 3].map((n) => (
                <button key={`b${n}`} className={`${btn} ${blankCount === n ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setBlankCount(n)}>{n}</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button className={`${btn} ${isYourTurn ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setIsYourTurn((v) => !v)}>
                {isYourTurn ? "YOUR TURN" : "ENEMY TURN"}
              </button>
              <button className={`${btn} ${gunHeld ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setGunHeld((v) => !v)}>
                GUN {gunHeld ? "HELD" : "TABLE"}
              </button>
              <button className={`${btn} ${target === "opponent" ? "!border-red-600 !text-red-400" : ""}`} onClick={() => setTarget((t) => (t === "opponent" ? "self" : "opponent"))}>
                TGT {target === "opponent" ? "OPP" : "SELF"}
              </button>
              <button className={btn} onClick={() => { setFiring("live"); setTimeout(() => setFiring(null), 700); }}>FIRE</button>
              <button className={btn} onClick={() => { setFiring("blank"); setTimeout(() => setFiring(null), 350); }}>BLANK</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
