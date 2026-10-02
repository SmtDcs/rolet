"use client";

// ROLET — 2D duel board. Replaces the 3D arena (parked for a later pass)
// with a pure CSS/SVG scene: room backdrop, opponent silhouette across
// the table, felt + revolver + chamber bullets. No three.js here, so the
// duel route ships a much lighter bundle.

import { useEffect, useRef, useState } from "react";

export type DuelBoardFiring = "live" | "blank" | null;

type DuelBoard2DProps = {
  isYourTurn: boolean;
  gunHeld: boolean;
  target: "self" | "opponent";
  firing: DuelBoardFiring;
  opponentPubkey: string;
  opponentHp: number;
  opponentHitSignal: number;
  liveCount: number;
  blankCount: number;
};

function hueOf(pubkey: string): number {
  let h = 0;
  for (let i = 0; i < Math.min(pubkey.length, 8); i++) {
    h = (h * 31 + pubkey.charCodeAt(i)) % 360;
  }
  return h;
}

/** Counts signal changes so one-shot CSS animations replay on every hit. */
function useBeat(signal: number): number {
  const [beat, setBeat] = useState(0);
  const prev = useRef(signal);
  useEffect(() => {
    if (signal !== prev.current) {
      prev.current = signal;
      setBeat((b) => b + 1);
    }
  }, [signal]);
  return beat;
}

export default function DuelBoard2D({
  isYourTurn,
  gunHeld,
  target,
  firing,
  opponentPubkey,
  opponentHp,
  opponentHitSignal,
  liveCount,
  blankCount,
}: DuelBoard2DProps) {
  const opponentDead = opponentHp <= 0;
  const hue = hueOf(opponentPubkey);
  const eyeColor = `hsl(${hue}, 92%, 62%)`;
  const opponentBeat = useBeat(opponentHitSignal);

  const armed = isYourTurn && gunHeld;
  const aimAtSelf = target === "self";
  const firingLive = firing === "live";
  const firingBlank = firing === "blank";

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] select-none overflow-hidden">
      {/* Room backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(96, 40, 14, 0.5) 0%, rgba(28, 12, 6, 0.92) 52%, #050302 100%)",
        }}
      />
      {/* Hanging bulb — the single warm source */}
      <div className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center">
        <div className="h-7 w-px bg-[#0a0604]" />
        <div
          className="h-3 w-3 rounded-full"
          style={{
            background: "#ffdfb0",
            boxShadow:
              "0 0 24px 6px rgba(255,176,96,0.55), 0 0 64px 20px rgba(255,140,60,0.22)",
          }}
        />
      </div>
      {/* Warm pool behind the opponent */}
      <div
        className="absolute left-1/2 top-[24%] h-28 w-[36rem] max-w-[90vw] -translate-x-1/2 rounded-full opacity-30 blur-2xl"
        style={{
          background: "radial-gradient(ellipse, rgba(180, 74, 24, 0.85), transparent 70%)",
        }}
      />
      {/* Floor line */}
      <div className="absolute inset-x-[8%] top-[62%] h-px bg-rust/25" />

      {/* Laser to opponent — only while armed and aiming across */}
      {armed && !aimAtSelf && (
        <div
          className="absolute left-1/2 top-[28%] h-[6%] w-[2px] -translate-x-1/2 animate-[rolet-laser_0.9s_ease-in-out_infinite]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,70,40,0.15), rgba(255,70,40,0.85))",
            boxShadow: "0 0 14px rgba(255,60,30,0.5)",
          }}
        />
      )}

      {/* Laser to self + red warning vignette */}
      {armed && aimAtSelf && (
        <>
          <div
            className="absolute left-1/2 top-[46%] h-[30vh] w-[2px] -translate-x-1/2 animate-[rolet-laser_0.8s_ease-in-out_infinite]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,70,40,0.85), rgba(255,70,40,0))",
              boxShadow: "0 0 14px rgba(255,60,30,0.6)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 100%, rgba(200,20,10,0.3) 0%, transparent 60%)",
            }}
          />
        </>
      )}

      {/* Stage — opponent + table, sized to sit inside the CCTV letterbox */}
      <div className="absolute inset-x-0 top-[14%] bottom-[54%] flex flex-col items-center justify-end">
        {/* Opponent */}
        <div className="relative">
          {/* Warm rim glow behind the silhouette */}
          <div
            className="absolute -inset-10 rounded-full opacity-70 blur-3xl"
            style={{
              background: "radial-gradient(ellipse, rgba(160,54,16,0.5), transparent 70%)",
            }}
          />
          <div
            key={`opp-${opponentBeat}`}
            className={`relative ${opponentBeat > 0 ? "animate-[rolet-jolt_0.5s_ease-out]" : ""}`}
          >
            <div
              className={`relative transition-transform duration-700 ${
                opponentDead
                  ? "translate-y-3 rotate-6 opacity-35"
                  : "animate-[rolet-breathe_3.6s_ease-in-out_infinite]"
              } ${!opponentDead && !isYourTurn ? "scale-[1.02]" : ""}`}
            >
              <OpponentSvg eyeColor={eyeColor} dead={opponentDead} />
            </div>
          </div>
          {/* Target brackets while aiming at the opponent */}
          {armed && !aimAtSelf && (
            <div className="absolute -inset-3 animate-[rolet-laser_1.2s_ease-in-out_infinite]">
              <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-red-500/80" />
              <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-red-500/80" />
              <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-red-500/80" />
              <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-red-500/80" />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="relative -mt-1.5 flex flex-col items-center">
          <div className="relative h-[88px] w-[min(640px,80vw)]">
            {/* Light pool on the felt */}
            <div
              className="absolute left-1/2 top-[-20px] h-24 w-80 -translate-x-1/2 rounded-full blur-2xl"
              style={{
                background: "radial-gradient(ellipse, rgba(255, 200, 140, 0.22), transparent 70%)",
              }}
            />
            {/* Felt body */}
            <div
              className="absolute inset-x-0 bottom-[8px] top-0 border border-rust/60"
              style={{
                background: "linear-gradient(180deg, #5a120c 0%, #2c0806 100%)",
                boxShadow: "inset 0 3px 12px rgba(0,0,0,0.65)",
              }}
            />
            {/* Far edge highlight */}
            <div className="absolute inset-x-3 top-0 h-px bg-[#8a6a3a]/70" />

            {/* Bullets on the felt — live glow, blank steel */}
            <div className="absolute bottom-[18px] left-[9%] flex items-center gap-[5px]">
              {Array.from({ length: liveCount }).map((_, i) => (
                <span
                  key={`live-${i}`}
                  className="h-[13px] w-[5px] rounded-[2px]"
                  style={{
                    background: "#6a0f06",
                    boxShadow: "0 0 9px rgba(255,68,34,0.8), inset 0 0 2px #ff8855",
                  }}
                />
              ))}
              {Array.from({ length: blankCount }).map((_, i) => (
                <span
                  key={`blank-${i}`}
                  className="h-[13px] w-[5px] rounded-[2px]"
                  style={{
                    background: "linear-gradient(180deg, #cfcfcf, #6f6f6f)",
                    boxShadow: "inset 0 0 2px rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>

            {/* Revolver — lifts and aims when armed */}
            <div
              className="absolute bottom-[10px] left-[58%] transition-transform duration-500"
              style={{
                transform: `translateX(-50%) rotate(${
                  !armed ? -10 : aimAtSelf ? 172 : 0
                }deg)`,
              }}
            >
              <div
                className={`relative transition-all duration-300 ${
                  firingLive
                    ? "animate-[rolet-recoil_0.4s_ease-out]"
                    : firingBlank
                    ? "animate-[rolet-jolt_0.3s_ease-out]"
                    : ""
                } ${
                  armed
                    ? "-translate-y-[6px] drop-shadow-[0_0_18px_rgba(255,120,60,0.35)]"
                    : "drop-shadow-[0_10px_16px_rgba(0,0,0,0.7)]"
                }`}
              >
                <RevolverSvg />
                {/* Muzzle flash follows the barrel (rotates with the gun) */}
                {firingLive && (
                  <div
                    className="absolute left-1/2 top-[-20px] h-16 w-16 -translate-x-1/2 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(255,244,200,0.95) 0%, rgba(255,150,50,0.65) 32%, transparent 70%)",
                      animation: "rolet-muzzle 0.32s ease-out forwards",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Near edge bar */}
            <div
              className="absolute inset-x-0 bottom-0 h-[8px] border border-rust/50"
              style={{ background: "linear-gradient(180deg, #3f1e0e 0%, #170a04 100%)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Opponent — skull bust silhouette with glowing eyes ─────────────────────
function OpponentSvg({ eyeColor, dead }: { eyeColor: string; dead: boolean }) {
  const eyeOpacity = dead ? 0.15 : 1;
  return (
    <svg
      width="172"
      height="146"
      viewBox="0 0 180 152"
      className="h-auto w-[128px] sm:w-[168px]"
      style={{ filter: "drop-shadow(0 0 22px rgba(150,30,8,0.35))" }}
      aria-hidden
    >
      <defs>
        <radialGradient id="roletSkull" cx="50%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#3a2114" />
          <stop offset="68%" stopColor="#241209" />
          <stop offset="100%" stopColor="#120804" />
        </radialGradient>
      </defs>
      {/* shoulders / cloak */}
      <path
        d="M12,152 C20,112 52,95 90,95 C128,95 160,112 168,152 Z"
        fill="#140a05"
        stroke="#3a2212"
        strokeWidth="1"
      />
      {/* neck */}
      <rect x="77" y="82" width="26" height="20" fill="#180d07" />
      {/* skull */}
      <ellipse
        cx="90"
        cy="51"
        rx="34"
        ry="38"
        fill="url(#roletSkull)"
        stroke="#4a2a16"
        strokeWidth="1.5"
      />
      {/* top rim light */}
      <path
        d="M61,38 Q90,12 119,38"
        fill="none"
        stroke="#5a3620"
        strokeWidth="2"
        opacity="0.75"
      />
      {/* cheek shading */}
      <path
        d="M63,64 Q70,83 90,85 Q110,83 117,64"
        fill="none"
        stroke="#1e0f07"
        strokeWidth="3"
      />
      {/* jaw */}
      <path
        d="M72,77 Q90,98 108,77 L112,86 Q90,106 68,86 Z"
        fill="#1a0d07"
        stroke="#3a2212"
        strokeWidth="1"
      />
      {/* teeth */}
      {[78, 85, 92, 99].map((x) => (
        <line key={x} x1={x} y1="86" x2={x} y2="93" stroke="#3a2212" strokeWidth="1.4" />
      ))}
      {/* eye sockets */}
      <ellipse cx="76" cy="49" rx="10.5" ry="12.5" fill="#050302" />
      <ellipse cx="104" cy="49" rx="10.5" ry="12.5" fill="#050302" />
      {/* glowing eyes */}
      <rect
        x="70.5"
        y="45.5"
        width="11"
        height="6"
        rx="1.5"
        fill={eyeColor}
        opacity={eyeOpacity}
        style={{ filter: `drop-shadow(0 0 8px ${eyeColor})` }}
      />
      <rect
        x="98.5"
        y="45.5"
        width="11"
        height="6"
        rx="1.5"
        fill={eyeColor}
        opacity={eyeOpacity}
        style={{ filter: `drop-shadow(0 0 8px ${eyeColor})` }}
      />
      {/* nasal cavity */}
      <path d="M87,57 L93,57 L90,65 Z" fill="#050302" />
    </svg>
  );
}

// ── Revolver — top-down silhouette, barrel pointing away from the player ───
function RevolverSvg() {
  return (
    <svg width="70" height="110" viewBox="0 0 96 150" aria-hidden>
      <defs>
        <linearGradient id="roletSteel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#55646f" />
          <stop offset="45%" stopColor="#93a4b1" />
          <stop offset="100%" stopColor="#3c4852" />
        </linearGradient>
        <linearGradient id="roletWood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5a3016" />
          <stop offset="100%" stopColor="#2e1507" />
        </linearGradient>
      </defs>
      {/* barrel */}
      <rect
        x="38"
        y="6"
        width="20"
        height="62"
        rx="3"
        fill="url(#roletSteel)"
        stroke="#1c242b"
        strokeWidth="1"
      />
      {/* front sight */}
      <rect x="45" y="2" width="6" height="7" rx="1" fill="#6e7f8c" stroke="#1c242b" />
      {/* frame */}
      <rect
        x="33"
        y="62"
        width="30"
        height="26"
        rx="3"
        fill="url(#roletSteel)"
        stroke="#1c242b"
        strokeWidth="1"
      />
      {/* cylinder */}
      <circle cx="48" cy="76" r="17" fill="url(#roletSteel)" stroke="#1c242b" strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={48 + Math.sin(a) * 9}
            cy={76 + Math.cos(a) * 9}
            r="2.6"
            fill="#101820"
          />
        );
      })}
      <circle cx="48" cy="76" r="3" fill="#101820" />
      {/* hammer hint */}
      <rect x="42" y="56" width="12" height="8" rx="2" fill="#55636f" stroke="#1c242b" />
      {/* trigger guard + trigger */}
      <path
        d="M33,88 Q22,92 26,101"
        fill="none"
        stroke="#4a5a66"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="33" y="90" width="4" height="9" rx="1.5" fill="#2a343c" />
      {/* grip */}
      <path
        d="M38,88 L58,88 L64,138 Q64,146 56,146 L40,146 Q32,146 34,136 Z"
        fill="url(#roletWood)"
        stroke="#1a0d04"
        strokeWidth="1.2"
      />
      <path
        d="M40,98 L58,98 M40,108 L59,108 M40,118 L60,118 M40,128 L62,128"
        stroke="#26130a"
        strokeWidth="1"
      />
      {/* muzzle bore */}
      <circle cx="48" cy="8" r="4.5" fill="#05080b" />
    </svg>
  );
}
