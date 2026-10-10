"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { C, F } from "./theme";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * Scrollytelling: one CSS-sticky 100vh stage (no GSAP pin-spacer), three scenes.
 * Scroll progress scrubs a single GSAP timeline.
 *
 * Performance rules (compositor-only):
 *  - Only transform (x/y/scale/rotation) and opacity are animated. No clip-path,
 *    no filter, no blur, no width/height/top/left.
 *  - Stepped eases removed: steps() made a smooth scroll read as low FPS.
 *  - The rotating dial is an HTML layer (div transform), not an SVG <g> repaint.
 *  - Dimming uses a black overlay's opacity instead of filter: brightness().
 *  - Grain is a static, normal-blend layer (no mix-blend, no per-frame animation).
 *  - will-change only on the handful of nodes that actually move.
 *  - Lenis already smooths the wheel, so scrub is direct (true) — no double lag.
 *  - Counter text is written only when the integer chamber changes.
 * prefers-reduced-motion: the wrapper collapses to a plain vertical stack
 * (Tailwind motion-safe / motion-reduce) and no timeline is built.
 */

// Chamber states around the dial (Signal = loaded, Patina = empty). Illustrative only.
const CHAMBERS = ["signal", "patina", "patina", "signal", "patina", "patina", "patina", "signal"] as const;

const CARDS = [
  { id: "hawkeye", name: "HawkEye", index: "01", verb: "sees", alt: "Eye pierced by an arrow" },
  { id: "blocker", name: "Blocker", index: "02", verb: "holds", alt: "Shield behind a striped barrier" },
  { id: "healer", name: "Healer", index: "03", verb: "mends", alt: "Open palm with a cross" },
] as const;

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// Scene layer: absolute + full-stage when motion is allowed, plain block otherwise.
const SCENE =
  "relative flex min-h-[100svh] w-full items-center overflow-hidden motion-safe:absolute motion-safe:inset-0 motion-safe:min-h-0 motion-safe:will-change-[transform,opacity]";

// Small animated nodes get a layer only when motion is on.
const MOVES = "motion-safe:will-change-[transform,opacity]";

function Rivet({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-2 w-2 rounded-full ${className}`}
      style={{ background: C.brass, boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.35)" }}
    />
  );
}

function SceneLabel({ n, title }: { n: string; title: string }) {
  return (
    <p className="text-xs uppercase tracking-[0.3em]" style={{ fontFamily: F.mono, color: C.brass }}>
      {n} / {title}
    </p>
  );
}

function ChamberDial() {
  const r = 38;
  return (
    <div className="relative h-full w-full" aria-hidden>
      {/* Static frame + brass index notch at 12 o'clock */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r="47" fill="none" stroke={C.graphite} strokeWidth="2" />
        <path d="M50 1 L54 7 L46 7 Z" fill={C.brass} />
      </svg>
      {/* Rotating cylinder: its own composited layer, rotated with a CSS transform */}
      <div data-dial className={`absolute inset-0 ${MOVES}`}>
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="45" fill={C.gunmetal} stroke="#3A3F47" strokeWidth="1.5" />
          {CHAMBERS.map((state, i) => {
            const a = (i / CHAMBERS.length) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={50 + r * Math.cos(a)}
                cy={50 + r * Math.sin(a)}
                r="6.5"
                fill={C.soot}
                stroke={state === "signal" ? C.signal : C.patina}
                strokeWidth="2"
              />
            );
          })}
          <circle cx="50" cy="50" r="11" fill={C.brass} />
          <circle cx="50" cy="50" r="4" fill={C.soot} />
        </svg>
      </div>
    </div>
  );
}

export function ScrollStorySection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(root);
        const counter = q("[data-counter]")[0] as HTMLElement | undefined;
        const dialEl = q("[data-dial]")[0] as HTMLElement | undefined;
        let shown = 1;

        // Initial states — transform/opacity only.
        gsap.set(q("[data-scene='2'], [data-scene='3']"), { autoAlpha: 0, yPercent: 6 });
        gsap.set(q("[data-scene-1-plate]"), { scale: 1.12 });
        gsap.set(q("[data-line]"), { autoAlpha: 0, y: 28 });
        gsap.set(q("[data-card]"), { yPercent: 110, rotation: (i) => [-12, 4, 14][i] });
        gsap.set(q("[data-card-name]"), { autoAlpha: 0.15 });
        gsap.set(q("[data-duelist]"), { scale: 1.15 });
        gsap.set(q("[data-duelist-shade]"), { autoAlpha: 0.8 });
        gsap.set(q("[data-lamp]"), { autoAlpha: 0 });
        gsap.set(q("[data-cta]"), { autoAlpha: 0, y: 16 });
        gsap.set(q("[data-dim]"), { autoAlpha: 0 });
        gsap.set(q("[data-rail-fill]"), { scaleY: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            // Lenis already eases the wheel; a numeric scrub on top doubles the lag
            // and makes the stage feel like it is dropping frames.
            scrub: true,
          },
        });

        // Progress rail across the whole story.
        tl.to(q("[data-rail-fill]"), { scaleY: 1, duration: 3 }, 0);

        // ── Scene 1: Chambers ────────────────────────────────────
        tl.to(q("[data-scene-1-plate]"), { scale: 1, duration: 0.8 }, 0)
          .to(q("[data-scene='1'] [data-line]"), { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.25, stagger: 0.1 }, 0.05)
          // One smooth pass of the 8 chambers (7 × 45°), rotated as a CSS transform.
          .to(
            dialEl ?? {},
            {
              rotation: -315,
              duration: 0.75,
              ease: "power1.inOut",
              onUpdate: () => {
                if (!dialEl || !counter) return;
                // getProperty reads GSAP's cache — no layout read.
                const step = Math.round(-(gsap.getProperty(dialEl, "rotation") as number) / 45);
                const n = Math.min(8, step + 1);
                if (n !== shown) {
                  shown = n;
                  counter.textContent = String(n).padStart(2, "0");
                }
              },
            },
            0.05,
          );

        // ── Cross-fade 1 → 2 ────────────────────────────────────
        tl.to(q("[data-scene='1']"), { scale: 0.96, duration: 0.3 }, 0.85)
          .to(q("[data-scene='1'] [data-dim]"), { autoAlpha: 0.7, duration: 0.3 }, 0.85)
          .to(q("[data-scene='2']"), { autoAlpha: 1, yPercent: 0, ease: "power2.out", duration: 0.3 }, 0.9);

        // ── Scene 2: Cards — dealt one by one ───────────────────
        tl.to(q("[data-scene='2'] [data-line]"), { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.2 }, 1.1);
        q("[data-card]").forEach((card, i) => {
          const at = 1.2 + i * 0.16;
          tl.to(card, { yPercent: 0, rotation: [-3, 0, 3][i], ease: "power3.out", duration: 0.22 }, at).to(
            q("[data-card-name]")[i],
            { autoAlpha: 1, duration: 0.08 },
            at + 0.14,
          );
        });

        // ── Cross-fade 2 → 3 ────────────────────────────────────
        tl.to(q("[data-scene='2']"), { scale: 0.96, duration: 0.3 }, 1.9)
          .to(q("[data-scene='2'] [data-dim]"), { autoAlpha: 0.7, duration: 0.3 }, 1.9)
          .to(q("[data-scene='3']"), { autoAlpha: 1, yPercent: 0, ease: "power2.out", duration: 0.3 }, 1.95);

        // ── Scene 3: Duel — lamp catches, rival steps out of the dark ──
        tl.to(q("[data-lamp]"), { autoAlpha: 1, duration: 0.2 }, 2.2)
          .to(q("[data-duelist]"), { scale: 1, ease: "power2.out", duration: 0.4 }, 2.2)
          .to(q("[data-duelist-shade]"), { autoAlpha: 0, duration: 0.4 }, 2.2)
          .to(q("[data-scene='3'] [data-line]"), { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.2, stagger: 0.08 }, 2.35)
          .to(q("[data-cta]"), { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.15 }, 2.65)
          .to({}, { duration: 0.2 }); // short hold before the stage releases

        return () => {
          if (counter) counter.textContent = "01";
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      id="how"
      ref={root}
      aria-label="How it works"
      className="relative scroll-mt-14 motion-safe:h-[300vh]"
      style={{ background: C.soot }}
    >
      {/* Anchor for the navbar "Cards" link: start of scene 2 in the sticky story. */}
      <span id="cards" aria-hidden className="pointer-events-none absolute left-0 motion-safe:top-[80vh] motion-reduce:top-[100svh]" />

      <div className="motion-safe:sticky motion-safe:top-0 motion-safe:h-[100svh] motion-safe:overflow-hidden">
        {/* ── Scene 1: Chambers ─────────────────────────── */}
        <div data-scene="1" className={SCENE} style={{ background: C.soot }}>
          <div data-scene-1-plate className={`absolute inset-0 ${MOVES}`}>
            <Image
              src="/art/landing/workshop-chambers.png"
              alt="Eight bored chambers around a brass hub"
              fill
              unoptimized
              sizes="100vw"
              className="object-cover object-center opacity-60"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(20,20,20,0.1) 20%, rgba(20,20,20,0.85) 70%, #141414 100%)",
            }}
          />
          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-24 md:grid-cols-2">
            <div className="mx-auto aspect-square w-56 sm:w-72 md:w-96">
              <ChamberDial />
            </div>
            <div>
              <SceneLabel n="01" title="Chambers" />
              <h2
                data-line
                className="mt-4 text-5xl font-extrabold uppercase leading-none tracking-[0.08em] sm:text-7xl"
                style={{ fontFamily: F.display, color: C.bone }}
              >
                Eight chambers.
              </h2>
              <p data-line className="mt-3 text-lg sm:text-xl" style={{ fontFamily: F.sans, color: C.worn }}>
                Spin the cylinder. One truth stays sealed until both sides reveal.
              </p>
              <div className="mt-8 flex items-center gap-6 text-sm" style={{ fontFamily: F.mono, color: C.bone }}>
                <span>
                  CHAMBER <span data-counter>01</span> / 08
                </span>
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: C.worn }}>
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: C.patina }} />
                  empty
                </span>
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: C.worn }}>
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: C.signal }} />
                  loaded
                </span>
              </div>
            </div>
          </div>
          <div data-dim aria-hidden className="pointer-events-none absolute inset-0 z-20 hidden bg-black motion-safe:block" />
        </div>

        {/* ── Scene 2: Cards ────────────────────────────── */}
        <div data-scene="2" className={SCENE} style={{ background: C.gunmetal }}>
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-24">
            <SceneLabel n="02" title="Cards" />
            <h2
              data-line
              className="mt-4 text-5xl font-extrabold uppercase leading-none tracking-[0.08em] sm:text-7xl"
              style={{ fontFamily: F.display, color: C.bone }}
            >
              Play paper.
            </h2>
            <ul className="mt-10 grid grid-cols-3 gap-3 sm:gap-10">
              {CARDS.map((card) => (
                <li key={card.id} className="flex flex-col items-center">
                  <div
                    data-card
                    className={`relative aspect-[5/7] w-full max-w-[220px] border-2 p-3 sm:p-5 ${MOVES}`}
                    style={{ background: C.worn, borderColor: "#8C8370", boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}
                  >
                    <Rivet className="left-2 top-2" />
                    <Rivet className="right-2 top-2" />
                    <Rivet className="bottom-2 left-2" />
                    <Rivet className="bottom-2 right-2" />
                    <span className="absolute left-4 top-3 text-xs sm:text-sm" style={{ fontFamily: F.mono, color: "#5A5244" }}>
                      {card.index}
                    </span>
                    <div className="relative h-full w-full">
                      {/* Blend + mask are rasterised once inside the card's own layer; only its transform animates. */}
                      <Image
                        src={`/art/landing/card-${card.id}.png`}
                        alt={card.alt}
                        fill
                        unoptimized
                        sizes="220px"
                        className="object-contain mix-blend-multiply"
                        style={{
                          WebkitMaskImage: "radial-gradient(closest-side, #000 70%, transparent 100%)",
                          maskImage: "radial-gradient(closest-side, #000 70%, transparent 100%)",
                        }}
                      />
                    </div>
                    {card.id === "healer" && (
                      <Image
                        src="/art/landing/healer-seal.png"
                        alt="Brass wax seal with an eight-chamber ring"
                        width={48}
                        height={48}
                        unoptimized
                        className="absolute -bottom-3 -right-3 rounded-full"
                      />
                    )}
                  </div>
                  <p
                    data-card-name
                    className="mt-5 text-center text-xs font-medium uppercase tracking-[0.2em] sm:text-base"
                    style={{ fontFamily: F.sans, color: C.bone }}
                  >
                    {card.name} <span style={{ color: C.worn }}>{card.verb}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div data-dim aria-hidden className="pointer-events-none absolute inset-0 z-20 hidden bg-black motion-safe:block" />
        </div>

        {/* ── Scene 3: Duel ─────────────────────────────── */}
        <div data-scene="3" className={SCENE} style={{ background: C.soot }}>
          <div
            data-lamp
            aria-hidden
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse at 30% 35%, ${C.sodium}33 0%, rgba(20,20,20,0) 55%)` }}
          />
          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-24 md:grid-cols-2">
            <div className="relative mx-auto aspect-[487/677] w-48 sm:w-64 md:w-80">
              <div data-duelist className={`absolute inset-0 ${MOVES}`}>
                <Image
                  src="/art/landing/paper-duelist-a.png"
                  alt="Paper duelist card portrait: hooded figure with a blank mask and a brass wax seal"
                  fill
                  unoptimized
                  sizes="320px"
                  className="object-contain"
                />
              </div>
              {/* Darkness the rival steps out of (opacity, not filter: brightness) */}
              <div
                data-duelist-shade
                aria-hidden
                className="pointer-events-none absolute -inset-4 hidden motion-safe:block"
                style={{ background: C.soot }}
              />
            </div>
            <div>
              <SceneLabel n="03" title="Duel" />
              <h2
                data-line
                className="mt-4 text-5xl font-extrabold uppercase leading-none tracking-[0.08em] sm:text-7xl"
                style={{ fontFamily: F.display, color: C.bone }}
              >
                One bench.
              </h2>
              <p data-line className="mt-3 text-lg sm:text-xl" style={{ fontFamily: F.sans, color: C.worn }}>
                Face a paper rival under one lamp. Commit, reveal, pull.
              </p>
              <div data-cta className="mt-8 inline-block">
                <Link
                  href="/duel"
                  className="inline-block border px-6 py-3 text-sm font-medium uppercase tracking-[0.14em] transition-colors hover:bg-[#3A3F47]"
                  style={{ fontFamily: F.sans, background: C.graphite, color: C.bone, borderColor: C.brass }}
                >
                  Enter the workshop
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stage chrome (motion only): static grain, letterbox, progress rail */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-30 hidden motion-safe:block">
          {/* Static grain: normal blend, never animated → composited once, no per-frame cost. */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: GRAIN, transform: "translateZ(0)" }} />
          <div className="absolute inset-x-0 top-0 h-6" style={{ background: C.soot }} />
          <div className="absolute inset-x-0 bottom-0 h-6" style={{ background: C.soot }} />
          <div className="absolute bottom-16 right-5 top-24 hidden w-px sm:block" style={{ background: C.graphite }}>
            <div data-rail-fill className="h-full w-full origin-top" style={{ background: C.brass }} />
            {["01", "02", "03"].map((n, i) => (
              <span
                key={n}
                className="absolute right-3 text-[10px]"
                style={{ top: `${i * 50}%`, fontFamily: F.mono, color: C.worn }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
