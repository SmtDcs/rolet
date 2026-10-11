"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { C, F } from "./theme";

/**
 * Scroll brief. One sticky stage, five beats. Scroll only changes which beat
 * is shown — no pinned WebGL, no scrubbed mesh. Reduced motion gets a stack.
 */

const BEATS = [
  {
    id: "bench",
    n: "01",
    title: "The bench",
    line: "Two players. One bench. The match lives on Solana.",
    note: "Lobby, reveal, chambers, cards, payout. A server never holds the state.",
  },
  {
    id: "load",
    n: "02",
    title: "The load",
    line: "Eight chambers. Five live, three blank. The order stays hidden.",
    note: "A card can show the next one. Otherwise you learn it on the pull.",
  },
  {
    id: "cards",
    n: "03",
    title: "The hand",
    line: "You draw four cards from a deck of twelve.",
    note: "HawkEye reads the next chamber. Blocker stops one hit. Healer returns one life, never past four.",
  },
  {
    id: "pull",
    n: "04",
    title: "The pull",
    line: "Fire across the bench, or into your own seat.",
    note: "A blank into yourself keeps the turn. Every other result passes it.",
  },
  {
    id: "prize",
    n: "05",
    title: "The prize",
    line: "Sitting down burns one point of durability.",
    note: "The winner is paid a fixed amount of SOL from the treasury. Four lives. First to zero loses.",
  },
] as const;

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.22em]" style={{ fontFamily: F.mono, color: C.brass }}>
      {children}
    </p>
  );
}

function Dot({ live }: { live: boolean }) {
  // Colours go through style, not SVG attributes: presentation attributes do
  // not resolve var() custom properties.
  const ink = live ? C.signal : C.patina;
  return (
    <svg
      width="19"
      height="9"
      viewBox="0 0 19 9"
      aria-hidden
      className="inline-block shrink-0 align-middle"
    >
      <rect x="16.5" y="0.5" width="2" height="8" style={{ fill: ink }} />
      <rect
        x="2.5"
        y="1"
        width="14"
        height="7"
        style={{ fill: live ? ink : C.soot, stroke: ink, strokeWidth: 1 }}
      />
      {live && <path d="M2.5 1c-2.2 1.1-2.2 5.9 0 7z" style={{ fill: ink }} />}
    </svg>
  );
}

function Lives({ n, markLoss = false }: { n: number; markLoss?: boolean }) {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => {
        const filled = i < n;
        const lost = markLoss && i === n;
        return (
          <span
            key={i}
            className="h-3 w-3"
            style={{
              background: filled ? C.bone : "transparent",
              boxShadow: `inset 0 0 0 1px ${filled ? C.bone : lost ? C.signal : C.worn}`,
            }}
          />
        );
      })}
    </span>
  );
}

function Sheet({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col justify-center gap-4 p-4 sm:gap-5 sm:p-7">{children}</div>;
}

function Seat({ name }: { name: string }) {
  return (
    <div className="border px-3 py-3" style={{ borderColor: C.graphite, background: C.gunmetal }}>
      <Kicker>{name}</Kicker>
      <div className="mt-3">
        <Lives n={4} />
      </div>
    </div>
  );
}

function BenchFigure() {
  const steps = ["Lobby", "Reveal", "Chambers", "Cards", "Payout"];
  return (
    <Sheet>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <Seat name="You" />
        <span aria-hidden className="h-px w-4 sm:w-8" style={{ background: C.brass }} />
        <Seat name="Them" />
      </div>
      <div className="border px-3 py-3 sm:px-4" style={{ borderColor: C.brass, background: C.gunmetal }}>
        <Kicker>One match, on Solana</Kicker>
        <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="Match steps">
          {steps.map((step, i) => (
            <li key={step} className="inline-flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.14em]" style={{ fontFamily: F.mono, color: C.bone }}>
                {step}
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden style={{ color: C.brass }}>
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
      <p className="text-sm leading-relaxed" style={{ fontFamily: F.sans, color: C.worn }}>
        Both seats share that record. A server never holds it.
      </p>
    </Sheet>
  );
}

function Cylinder() {
  const size = 196;
  const c = size / 2;
  const chambers = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    return {
      i,
      x: c + Math.cos(a) * 58,
      y: c + Math.sin(a) * 58,
      lx: c + Math.cos(a) * 76,
      ly: c + Math.sin(a) * 76,
      next: i === 0,
    };
  });
  // SVG presentation attributes do not resolve var() custom properties, so
  // every colour is applied through style instead.
  const tick = { stroke: C.graphite };
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto shrink-0"
      role="img"
      aria-label="Technical drawing of an eight chamber cylinder. The chamber at twelve o'clock is next. Chamber order is not shown."
    >
      {Array.from({ length: 32 }, (_, i) => {
        const a = (i * Math.PI) / 16 - Math.PI / 2;
        const long = i % 4 === 0;
        const r1 = 92;
        const r2 = long ? 82 : 87;
        return (
          <line
            key={i}
            x1={c + Math.cos(a) * r1}
            y1={c + Math.sin(a) * r1}
            x2={c + Math.cos(a) * r2}
            y2={c + Math.sin(a) * r2}
            style={{ ...tick, strokeWidth: long ? 1 : 0.5 }}
          />
        );
      })}

      <circle cx={c} cy={c} r={80} style={{ fill: C.gunmetal, stroke: C.graphite, strokeWidth: 1 }} />
      <circle cx={c} cy={c} r={72} style={{ fill: "none", stroke: C.graphite, strokeWidth: 1 }} />

      {chambers.map((h) => (
        <g key={h.i}>
          <circle
            cx={h.x}
            cy={h.y}
            r={15}
            style={{
              fill: C.soot,
              stroke: h.next ? C.brass : C.graphite,
              strokeWidth: 1,
            }}
          />
          <circle
            cx={h.x}
            cy={h.y}
            r={9.5}
            style={{ fill: "none", stroke: C.graphite, strokeWidth: 0.75 }}
          />
          <circle
            cx={h.x}
            cy={h.y}
            r={2}
            style={{ fill: h.next ? C.brass : C.worn, opacity: h.next ? 1 : 0.45 }}
          />
          <text
            x={h.lx}
            y={h.ly}
            fontSize="8"
            fontFamily={F.mono}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fill: C.brass, opacity: 0.75 }}
          >
            {String(h.i + 1).padStart(2, "0")}
          </text>
        </g>
      ))}

      <circle cx={c} cy={c} r={15} style={{ fill: C.soot, stroke: C.brass, strokeWidth: 1 }} />
      <circle cx={c} cy={c} r={3.5} style={{ fill: C.brass }} />

      <line x1={c} y1={c - 17} x2={c} y2={c - 38} style={{ stroke: C.brass, strokeWidth: 1 }} />
      <path d={`M${c} ${c - 45} l4.5 6.5 h-9 z`} style={{ fill: C.brass }} />
    </svg>
  );
}

function LoadFigure() {
  return (
    <Sheet>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div>
          <Cylinder />
          <p className="mt-2 text-center text-xs uppercase tracking-[0.16em]" style={{ fontFamily: F.mono, color: C.worn }}>
            Order hidden
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <Kicker>Count, public</Kicker>
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Five live rounds and three blanks">
            {Array.from({ length: 5 }, (_, i) => (
              <Dot key={`live-${i}`} live />
            ))}
            {Array.from({ length: 3 }, (_, i) => (
              <Dot key={`blank-${i}`} live={false} />
            ))}
            <span className="text-sm" style={{ fontFamily: F.mono, color: C.bone }}>
              5 live / 3 blank
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed" style={{ fontFamily: F.sans, color: C.bone }}>
            You know the mix. The brass hole is next, and it stays a question until a card opens it or you pull.
          </p>
        </div>
      </div>
    </Sheet>
  );
}

function ChamberMark({ hidden }: { hidden?: boolean }) {
  if (hidden) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs"
        style={{ borderColor: C.graphite, color: C.worn, fontFamily: F.mono }}
        aria-hidden
      >
        ?
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 overflow-hidden rounded-full border" style={{ borderColor: C.brass }} aria-hidden>
      <span className="h-full w-1/2" style={{ background: C.signal }} />
      <span className="h-full w-1/2" style={{ background: C.patina }} />
    </span>
  );
}

function HandFigure() {
  return (
    <Sheet>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative h-14 w-12 shrink-0" aria-hidden>
          <span className="absolute inset-0 translate-x-1.5 translate-y-1 border" style={{ borderColor: C.brass, background: C.worn }} />
          <span
            className="absolute inset-0 flex items-center justify-center border text-xl leading-none"
            style={{ borderColor: C.brass, background: C.bone, color: C.soot, fontFamily: F.display }}
          >
            12
          </span>
        </div>
        <span className="text-xs uppercase tracking-[0.16em]" style={{ fontFamily: F.mono, color: C.brass }}>
          Draw
        </span>
        <div className="flex gap-1.5" aria-label="A hand of four cards">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="h-14 w-8 border sm:w-9" style={{ background: C.worn, borderColor: C.brass }} />
          ))}
        </div>
      </div>
      <Kicker>Three of the twelve</Kicker>
      <ul className="flex flex-col gap-2">
        <li className="grid items-center gap-2 border px-3 py-2 sm:grid-cols-[7rem_1fr]" style={{ borderColor: C.graphite }}>
          <span className="text-base uppercase leading-none" style={{ fontFamily: F.display, color: C.bone }}>
            HawkEye
          </span>
          <span className="flex flex-wrap items-center gap-2 text-sm" style={{ fontFamily: F.sans, color: C.worn }}>
            <span className="inline-flex items-center gap-1.5" aria-hidden>
              <ChamberMark hidden />
              <span style={{ color: C.brass }}>→</span>
              <ChamberMark />
            </span>
            Next chamber opens.
          </span>
        </li>
        <li className="grid items-center gap-2 border px-3 py-2 sm:grid-cols-[7rem_1fr]" style={{ borderColor: C.graphite }}>
          <span className="text-base uppercase leading-none" style={{ fontFamily: F.display, color: C.bone }}>
            Blocker
          </span>
          <span className="flex flex-wrap items-center gap-2 text-sm" style={{ fontFamily: F.sans, color: C.worn }}>
            <span className="inline-flex items-center gap-1.5" aria-hidden>
              <Dot live />
              <span style={{ color: C.brass }}>→</span>
              <span className="inline-block h-4 w-1" style={{ background: C.brass }} />
              <span style={{ color: C.brass }}>→</span>
              <Lives n={4} />
            </span>
            The next hit on you does nothing.
          </span>
        </li>
        <li className="grid items-center gap-2 border px-3 py-2 sm:grid-cols-[7rem_1fr]" style={{ borderColor: C.graphite }}>
          <span className="text-base uppercase leading-none" style={{ fontFamily: F.display, color: C.bone }}>
            Healer
          </span>
          <span className="flex flex-wrap items-center gap-2 text-sm" style={{ fontFamily: F.sans, color: C.worn }}>
            <span className="inline-flex items-center gap-1.5" aria-hidden>
              <Lives n={3} />
              <span style={{ color: C.brass }}>→</span>
              <Lives n={4} />
            </span>
            One life back. Stops at four.
          </span>
        </li>
      </ul>
    </Sheet>
  );
}

function PullFigure() {
  const rows = [
    { aim: "At them", live: true, before: 4, after: 3, stay: false, who: "Them" },
    { aim: "At them", live: false, before: 4, after: 4, stay: false, who: "Them" },
    { aim: "At you", live: false, before: 4, after: 4, stay: true, who: "You" },
    { aim: "At you", live: true, before: 4, after: 3, stay: false, who: "You" },
  ];
  return (
    <Sheet>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={`${row.aim}-${row.live}`}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border px-3 py-2"
            style={{ borderColor: C.graphite }}
            aria-label={`${row.aim}, ${row.live ? "live" : "blank"}. ${row.who} ${row.before === row.after ? "keep their lives" : "lose one life"}. ${row.stay ? "Turn stays." : "Turn passes."}`}
          >
            <span className="inline-flex items-center gap-2 text-sm" style={{ fontFamily: F.sans, color: C.bone }}>
              {row.aim}
              <Dot live={row.live} />
              <span className="text-xs uppercase tracking-[0.14em]" style={{ fontFamily: F.mono, color: C.worn }}>
                {row.live ? "Live" : "Blank"}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.14em]" style={{ fontFamily: F.mono, color: C.worn }}>
                {row.who}
              </span>
              <Lives n={row.before} />
              <span aria-hidden className="text-xs" style={{ fontFamily: F.mono, color: C.brass }}>
                {row.before === row.after ? "=" : "→"}
              </span>
              <Lives n={row.after} markLoss={row.after < row.before} />
            </span>
            <span className="text-xs uppercase tracking-[0.14em]" style={{ fontFamily: F.mono, color: row.stay ? C.brass : C.worn }}>
              {row.stay ? "Turn stays" : "Turn passes"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm leading-relaxed" style={{ fontFamily: F.sans, color: C.worn }}>
        Only a blank into your own seat keeps the turn. A life that hits zero ends the match.
      </p>
    </Sheet>
  );
}

function PrizeFigure() {
  return (
    <Sheet>
      <ul className="flex flex-col gap-2">
        <li
          className="flex flex-wrap items-center justify-between gap-3 border px-3 py-3"
          style={{ borderColor: C.graphite }}
          aria-label="When you sit, one durability mark burns."
        >
          <Kicker>You sit</Kicker>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-3" style={{ background: C.brass }} />
            <span aria-hidden className="text-xs" style={{ color: C.brass }}>
              →
            </span>
            <span aria-hidden className="inline-block h-3 w-3 border" style={{ borderColor: C.signal }} />
            <span className="text-sm" style={{ fontFamily: F.sans, color: C.bone }}>
              One durability mark burns
            </span>
          </span>
        </li>
        <li
          className="flex flex-wrap items-center justify-between gap-3 border px-3 py-3"
          style={{ borderColor: C.graphite }}
          aria-label="When you win, the treasury pays a fixed amount of SOL."
        >
          <Kicker>You win</Kicker>
          <span className="inline-flex flex-wrap items-center gap-2">
            <span
              className="border px-2 py-1 text-xs uppercase tracking-[0.14em]"
              style={{ borderColor: C.brass, color: C.brass, fontFamily: F.mono }}
            >
              Treasury
            </span>
            <span aria-hidden style={{ color: C.brass }}>
              →
            </span>
            <span className="border px-2 py-1 text-sm" style={{ borderColor: C.bone, color: C.bone, fontFamily: F.mono }}>
              SOL
            </span>
            <span className="text-sm" style={{ fontFamily: F.sans, color: C.worn }}>
              fixed amount
            </span>
          </span>
        </li>
        <li
          className="flex flex-wrap items-center justify-between gap-3 border px-3 py-3"
          style={{ borderColor: C.graphite }}
          aria-label="Four lives. First to zero loses."
        >
          <Kicker>Lives</Kicker>
          <span className="inline-flex items-center gap-2">
            <Lives n={4} />
            <span aria-hidden className="text-xs" style={{ fontFamily: F.mono, color: C.brass }}>
              →
            </span>
            <Lives n={0} />
            <span className="text-sm" style={{ fontFamily: F.sans, color: C.bone }}>
              Zero loses
            </span>
          </span>
        </li>
      </ul>
    </Sheet>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full overflow-hidden border"
      style={{ background: C.soot, borderColor: C.graphite }}
    >
      <span aria-hidden className="absolute left-2 top-2 h-1.5 w-1.5" style={{ background: C.brass }} />
      <span aria-hidden className="absolute right-2 top-2 h-1.5 w-1.5" style={{ background: C.brass }} />
      <span aria-hidden className="absolute bottom-2 left-2 h-1.5 w-1.5" style={{ background: C.brass }} />
      <span aria-hidden className="absolute bottom-2 right-2 h-1.5 w-1.5" style={{ background: C.brass }} />
      {children}
    </div>
  );
}

function BeatVisual({ id }: { id: (typeof BEATS)[number]["id"] }) {
  if (id === "bench") return <BenchFigure />;
  if (id === "load") return <LoadFigure />;
  if (id === "cards") return <HandFigure />;
  if (id === "pull") return <PullFigure />;
  return <PrizeFigure />;
}

function Copy({
  beat,
  onJump,
}: {
  beat: (typeof BEATS)[number];
  onJump: (index: number) => void;
}) {
  return (
    <div>
      <nav className="flex gap-2" aria-label="Story steps">
        {BEATS.map((item, index) => {
          const on = item.id === beat.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={on ? "step" : undefined}
              aria-label={`${item.n} ${item.title}`}
              onClick={() => onJump(index)}
              className="flex h-11 min-w-11 items-center justify-center border border-[#2E333A] px-2 text-xs hover:border-[#B88A2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88A2E]"
              style={{
                fontFamily: F.mono,
                color: on ? C.soot : C.worn,
                background: on ? C.brass : "transparent",
                borderColor: on ? C.brass : undefined,
              }}
            >
              {item.n}
            </button>
          );
        })}
      </nav>
      <div aria-live="polite">
        <h2
          className="mt-6 text-balance text-4xl uppercase leading-none tracking-[0.04em] sm:text-5xl"
          style={{ fontFamily: F.display, color: C.bone }}
        >
          {beat.title}
        </h2>
        <p className="mt-4 text-lg leading-relaxed" style={{ fontFamily: F.sans, color: C.bone }}>
          {beat.line}
        </p>
        <p className="mt-3 max-w-md text-base leading-relaxed" style={{ fontFamily: F.sans, color: C.worn }}>
          {beat.note}
        </p>
      </div>
      {beat.id === "prize" && (
        <Link
          href="/duel"
          className="mt-8 inline-flex border bg-[#2E333A] px-6 py-3 text-sm font-medium uppercase tracking-[0.14em] hover:bg-[#3A414A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88A2E]"
          style={{ fontFamily: F.sans, color: C.bone, borderColor: C.brass }}
        >
          Enter the workshop
        </Link>
      )}
    </div>
  );
}

export function StoryScroll() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [reduce, setReduce] = useState(false);
  const beat = BEATS[active];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const el = root.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      if (travel <= 0) return;
      const passed = Math.min(Math.max(-rect.top, 0), travel);
      const next = Math.min(BEATS.length - 1, Math.floor((passed / travel) * BEATS.length));
      setActive((cur) => (cur === next ? cur : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduce]);

  const jump = (index: number) => {
    const el = root.current;
    if (!el || reduce) {
      document.getElementById(BEATS[index].id)?.scrollIntoView({ block: "start" });
      setActive(index);
      return;
    }
    const travel = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY + (index / BEATS.length) * travel + 4;
    window.scrollTo({ top, behavior: "smooth" });
  };

  if (reduce) {
    return (
      <section id="how" className="scroll-mt-14 px-5 py-24" style={{ background: C.soot }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-24">
          {BEATS.map((item) => (
            <article id={item.id} key={item.id} className="scroll-mt-20 grid items-center gap-8 md:grid-cols-12">
              <div className="md:col-span-7">
                <Frame>
                  <BeatVisual id={item.id} />
                </Frame>
              </div>
              <div className="md:col-span-5">
                <Copy beat={item} onJump={jump} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="how" ref={root} className="relative" style={{ height: "520vh", background: C.soot }}>
      <div id="cards" className="pointer-events-none absolute left-0 h-px w-px scroll-mt-14" style={{ top: "42%" }} />
      <div className="sticky top-14 flex h-[calc(100svh-3.5rem)] items-center px-5">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <Frame>
              <BeatVisual id={beat.id} />
            </Frame>
          </div>
          <div className="md:col-span-5">
            <Copy beat={beat} onJump={jump} />
          </div>
        </div>
      </div>
    </section>
  );
}
