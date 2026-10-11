"use client";

// ROLET — 2D duel board (2.5D pass). A CSS/SVG scene rendered as a
// surveillance feed: room shadows, a single bulb pouring a light cone
// over an oval baize table, brass rail, felt stamp, revolver + shells.
// Depth comes from a shared perspective: layers sit at different Z, and
// a pointer parallax shifts them subtly. No three.js in this bundle.

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

/** Writes --px / --py (-1..1) on the scene root for layer parallax. */
function usePointerParallax() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

const MOTES = [
  { left: "44%", top: "18%", size: 3, delay: "0s", dur: "9s" },
  { left: "53%", top: "12%", size: 2, delay: "-3s", dur: "11s" },
  { left: "38%", top: "30%", size: 4, delay: "-6s", dur: "8s" },
  { left: "61%", top: "26%", size: 2, delay: "-1.5s", dur: "12s" },
  { left: "47%", top: "40%", size: 3, delay: "-8s", dur: "10s" },
  { left: "56%", top: "48%", size: 2, delay: "-4.5s", dur: "9.5s" },
  { left: "41%", top: "54%", size: 3, delay: "-7s", dur: "13s" },
  { left: "64%", top: "38%", size: 2, delay: "-2s", dur: "10.5s" },
];

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
  const sceneRef = usePointerParallax();
  const opponentDead = opponentHp <= 0;
  const hue = hueOf(opponentPubkey);
  const eyeColor = `hsl(${hue}, 92%, 62%)`;
  const opponentBeat = useBeat(opponentHitSignal);

  const armed = isYourTurn && gunHeld;
  const aimAtSelf = target === "self";
  const firingLive = firing === "live";
  const firingBlank = firing === "blank";

  return (
    <div
      ref={sceneRef}
      className="pointer-events-none absolute inset-0 z-[5] select-none overflow-hidden"
      style={{ perspective: "1100px" }}
    >
      {/* Room backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 38%, rgba(96, 44, 16, 0.52) 0%, rgba(26, 12, 6, 0.94) 54%, #050302 100%)",
        }}
      />
      {/* Back wall — a dim seam so the room has a far side */}
      <div className="absolute inset-x-0 top-[34%] h-px bg-[#3a2414]/25" />

      {/* Hanging bulb */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <div className="flex flex-col items-center">
          <div className="h-7 w-px bg-[#0a0604]" />
          <div
            className="h-3 w-3 rounded-full animate-[rolet-cone-flicker_4.2s_ease-in-out_infinite]"
            style={{
              background: "#ffdfb0",
              boxShadow:
                "0 0 24px 6px rgba(255,176,96,0.6), 0 0 70px 22px rgba(255,140,60,0.24)",
            }}
          />
        </div>
      </div>

      {/* Light cone — from the bulb down onto the table */}
      <div
        className="absolute left-1/2 top-[32px] h-[62vh] w-[min(760px,94vw)] animate-[rolet-cone-flicker_4.2s_ease-in-out_infinite]"
        style={{ transform: "translateX(-50%) translateZ(-80px)" }}
      >
        <div
          className="h-full w-full blur-[6px]"
          style={{
            clipPath: "polygon(49.4% 0%, 50.6% 0%, 94% 100%, 6% 100%)",
            background:
              "linear-gradient(180deg, rgba(255,184,77,0.20) 0%, rgba(255,150,60,0.07) 52%, rgba(255,150,60,0) 100%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Dust motes drifting through the light */}
        <div className="absolute inset-0">
          {MOTES.map((m, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: m.left,
                top: m.top,
                width: m.size,
                height: m.size,
                background: "#ffd9a3",
                opacity: 0.5,
                filter: "blur(0.5px)",
                animation: `rolet-mote ${m.dur} linear ${m.delay} infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Floor shadow under the table */}
      <div
        className="absolute left-1/2 top-[56%] h-[8%] w-[min(860px,94vw)] rounded-[50%]"
        style={{
          transform: "translateX(-50%) translateZ(-40px)",
          background: "radial-gradient(ellipse, rgba(0,0,0,0.6), transparent 70%)",
        }}
      />

      {/* Laser to opponent — only while armed and aiming across */}
      {armed && !aimAtSelf && (
        <div
          className="absolute left-1/2 top-[32%] h-[8%] w-[2px] animate-[rolet-laser_0.9s_ease-in-out_infinite]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,70,40,0.15), rgba(255,70,40,0.85))",
            boxShadow: "0 0 14px rgba(255,60,30,0.5)",
            transform: "translateX(-50%) translateZ(-60px)",
          }}
        />
      )}

      {/* Laser to self + red warning vignette */}
      {armed && aimAtSelf && (
        <>
          <div
            className="absolute left-1/2 top-[50%] h-[30vh] w-[2px] animate-[rolet-laser_0.8s_ease-in-out_infinite]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,70,40,0.85), rgba(255,70,40,0))",
              boxShadow: "0 0 14px rgba(255,60,30,0.6)",
              transform: "translateX(-50%) translateZ(-60px)",
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

      {/* Opponent — across the table, further back in Z */}
      <div className="absolute left-1/2 top-[24%] -translate-x-1/2">
        <div
          className="relative"
          style={{
            transform:
              "translate3d(calc(var(--px, 0) * 6px), calc(var(--py, 0) * 3px), -170px)",
          }}
        >
          {/* Warm rim glow behind the silhouette */}
          <div
            className="absolute -inset-12 rounded-full opacity-70 blur-3xl"
            style={{
              background: "radial-gradient(ellipse, rgba(170,60,18,0.5), transparent 70%)",
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
            <div className="absolute -inset-4 animate-[rolet-laser_1.2s_ease-in-out_infinite]">
              <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-red-500/80" />
              <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-red-500/80" />
              <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-red-500/80" />
              <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-red-500/80" />
            </div>
          )}
        </div>
      </div>

      {/* Table — oval baize slab, tilted back in 2.5D */}
      <div className="absolute left-1/2 top-[33%] -translate-x-1/2">
        <div
          style={{
            transform:
              "translate3d(calc(var(--px, 0) * 4px), calc(var(--py, 0) * 2px), 0) rotateX(36deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="relative h-[340px] w-[min(760px,86vw)] rounded-[50%]"
            style={{
              background:
                "linear-gradient(180deg, #55321b 0%, #2e1a0d 58%, #1a0d05 100%)",
              boxShadow:
                "0 44px 70px rgba(0,0,0,0.72), inset 0 2px 4px rgba(201,162,39,0.28), inset 0 -3px 6px rgba(0,0,0,0.6)",
            }}
          >
            {/* Brass rail line */}
            <div className="absolute inset-[7px] rounded-[50%] border border-[#c9a227]/35" />

            {/* Bench top — worn wood, not baize */}
            <div
              className="absolute inset-[18px] overflow-hidden rounded-[50%]"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 24%, #3a2a1d 0%, #241a12 46%, #140d08 100%)",
                boxShadow:
                  "inset 0 10px 30px rgba(0,0,0,0.55), inset 0 -4px 14px rgba(0,0,0,0.5)",
              }}
            >
              {/* Grain */}
              <div
                className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
                style={{ filter: "url(#rolet-noise)" }}
              />
              {/* Bulb pool on the felt */}
              <div
                className="absolute left-1/2 top-[8%] h-[74%] w-[62%] -translate-x-1/2 rounded-[50%] animate-[rolet-cone-flicker_4.2s_ease-in-out_infinite]"
                style={{
                  background:
                    "radial-gradient(ellipse, rgba(255,205,130,0.24) 0%, rgba(255,190,110,0.08) 55%, transparent 75%)",
                }}
              />
              {/* Felt stamp — printer's mark on the baize */}
              <FeltStamp />

              {/* Shells on the baize — live glow, blank steel */}
              <div className="absolute bottom-[34%] left-[16%] flex items-center gap-[6px]">
                {Array.from({ length: liveCount }).map((_, i) => (
                  <span
                    key={`live-${i}`}
                    className="h-[18px] w-[7px] rounded-[2px]"
                    style={{
                      background: "linear-gradient(180deg, #8a1a0c, #4a0a04)",
                      boxShadow:
                        "0 2px 4px rgba(0,0,0,0.6), 0 0 10px rgba(255,68,34,0.75), inset 0 1px 1px rgba(255,150,110,0.5)",
                    }}
                  />
                ))}
                {Array.from({ length: blankCount }).map((_, i) => (
                  <span
                    key={`blank-${i}`}
                    className="h-[18px] w-[7px] rounded-[2px]"
                    style={{
                      background: "linear-gradient(180deg, #d8d8d8, #6f6f6f)",
                      boxShadow:
                        "0 2px 4px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.55)",
                    }}
                  />
                ))}
              </div>

              {/* Revolver — center of the baize */}
              <div
                className="absolute bottom-[14%] left-1/2 transition-transform duration-500"
                style={{
                  transform: `translateX(-50%) rotate(${
                    !armed ? -8 : aimAtSelf ? 172 : 0
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
                      ? "-translate-y-[6px] drop-shadow-[0_0_20px_rgba(255,140,70,0.4)]"
                      : "drop-shadow-[0_14px_10px_rgba(0,0,0,0.65)]"
                  }`}
                >
                  <RevolverSvg />
                  {/* Muzzle flash follows the barrel (rotates with the gun) */}
                  {firingLive && (
                    <div
                      className="absolute left-1/2 top-[-22px] h-16 w-16 -translate-x-1/2 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(255,244,200,0.95) 0%, rgba(255,150,50,0.65) 32%, transparent 70%)",
                        animation: "rolet-muzzle 0.32s ease-out forwards",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Felt stamp — circular printer's mark on the baize ──────────────────────
function FeltStamp() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2"
      style={{ opacity: 0.15 }}
      aria-hidden
    >
      <defs>
        <path
          id="roletStampPath"
          d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"
        />
      </defs>
      <text
        fill="#e8dcc4"
        fontSize="11.5"
        letterSpacing="3.5"
        style={{ fontFamily: "var(--font-rolet-mono)" }}
      >
        <textPath href="#roletStampPath">
          ROLET · THE LAST ROUND · PROVABLY FAIR · SOLANA DEVNET ·
        </textPath>
      </text>
      <circle cx="100" cy="100" r="34" fill="none" stroke="#e8dcc4" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="6" fill="none" stroke="#e8dcc4" strokeWidth="0.8" />
      <path d="M100,88 L112,100 L100,112 L88,100 Z" fill="none" stroke="#e8dcc4" strokeWidth="0.8" />
    </svg>
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
      className="h-auto w-[118px] sm:w-[148px]"
      style={{ filter: "drop-shadow(0 0 22px rgba(150,30,8,0.35))" }}
      aria-hidden
    >
      <defs>
        <radialGradient id="roletSkull" cx="50%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#3a2114" />
          <stop offset="68%" stopColor="#241209" />
          <stop offset="100%" stopColor="#120804" />
        </radialGradient>
        <linearGradient id="roletCoat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c1009" />
          <stop offset="100%" stopColor="#0d0603" />
        </linearGradient>
      </defs>
      {/* shoulders / coat */}
      <path
        d="M12,152 C20,110 52,94 90,94 C128,94 160,110 168,152 Z"
        fill="url(#roletCoat)"
        stroke="#3a2212"
        strokeWidth="1"
      />
      {/* collar hint */}
      <path
        d="M70,102 Q90,112 110,102"
        fill="none"
        stroke="#4a2c17"
        strokeWidth="1.4"
        opacity="0.8"
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
      {/* top rim light from the bulb */}
      <path
        d="M61,38 Q90,12 119,38"
        fill="none"
        stroke="#8a5228"
        strokeWidth="2"
        opacity="0.8"
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
    <svg width="74" height="117" viewBox="0 0 96 150" aria-hidden>
      <defs>
        <linearGradient id="roletSteel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4e5c66" />
          <stop offset="42%" stopColor="#9db0be" />
          <stop offset="100%" stopColor="#39444d" />
        </linearGradient>
        <linearGradient id="roletWood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6a3a1c" />
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
      {/* barrel highlight */}
      <rect x="41" y="9" width="4" height="56" rx="2" fill="#e6eef4" opacity="0.28" />
      {/* front sight */}
      <rect x="45" y="2" width="6" height="7" rx="1" fill="#7d8f9c" stroke="#1c242b" />
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
      {/* engraving arc on the frame */}
      <path
        d="M36,66 Q48,60 60,66"
        fill="none"
        stroke="#c9a227"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* hammer hint */}
      <rect x="42" y="56" width="12" height="8" rx="2" fill="#5d6c78" stroke="#1c242b" />
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
      {/* grip medallion */}
      <circle cx="49" cy="117" r="4.5" fill="none" stroke="#c9a227" strokeWidth="0.8" opacity="0.55" />
      {/* muzzle bore */}
      <circle cx="48" cy="8" r="4.5" fill="#05080b" />
    </svg>
  );
}
