import { useEffect, useState } from "react";

/**
 * The cylinder, drawn once and used in both places: the landing story and the
 * live match. A labelled diagram has to get its count and alignment exactly
 * right, so it is drawn rather than generated, and it lives in one file so a
 * change reaches both surfaces.
 *
 * Colours go through style, not SVG attributes: presentation attributes do not
 * resolve var() custom properties.
 */
const DARK = "var(--color-void)";
const DRUM = "var(--color-surface-2)";
const LINE = "var(--color-line)";
const LINE_STRONG = "var(--color-line-strong)";
const BRASS = "var(--color-brass)";
const BRASS_DIM = "var(--color-brass-dim)";
const PHOSPHOR = "var(--color-phosphor)";
const PHOSPHOR_FAINT = "var(--color-phosphor-faint)";

const MONO = "var(--font-plex-mono), ui-monospace, monospace";

const TICK_MS = 900;

export type ChamberMark = "hidden" | "next" | "spent" | "live" | "blank";

export function ChamberDial({
  size = 196,
  marks,
  ticking = false,
  pointer = true,
  className,
}: {
  size?: number;
  /** One entry per chamber in ring order, starting at twelve o'clock. */
  marks?: ChamberMark[];
  /** While waiting, the index walks the ring one chamber at a time. */
  ticking?: boolean;
  /** Draw the index pointer at the next chamber. */
  pointer?: boolean;
  className?: string;
}) {
  const [tick, setTick] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduce || !ticking) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => window.clearInterval(timer);
  }, [reduce, ticking]);

  const walking = ticking && !reduce;
  const activeIndex = walking ? tick % 8 : 0;

  const c = size / 2;
  const scale = size / 196;
  const chambers = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const mark: ChamberMark = marks?.[i] ?? (i === activeIndex ? "next" : "hidden");
    return {
      i,
      mark,
      x: c + Math.cos(a) * 58 * scale,
      y: c + Math.sin(a) * 58 * scale,
      lx: c + Math.cos(a) * 76 * scale,
      ly: c + Math.sin(a) * 76 * scale,
    };
  });

  const ring = (mark: ChamberMark) => {
    if (mark === "next") return BRASS;
    if (mark === "spent") return LINE;
    if (mark === "live") return "var(--color-alert)";
    if (mark === "blank") return "var(--color-patina)";
    return LINE_STRONG;
  };

  const pin = (mark: ChamberMark) => {
    if (mark === "next") return BRASS;
    if (mark === "spent") return LINE;
    if (mark === "live") return "var(--color-alert)";
    if (mark === "blank") return "var(--color-patina)";
    return PHOSPHOR_FAINT;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Technical drawing of an eight chamber cylinder. Chamber order is not shown."
    >
      {/* graduation ring: 11.25 degree ticks, long every 45 */}
      {Array.from({ length: 32 }, (_, i) => {
        const a = (i * Math.PI) / 16 - Math.PI / 2;
        const long = i % 4 === 0;
        const r1 = 92 * scale;
        const r2 = (long ? 82 : 87) * scale;
        return (
          <line
            key={i}
            x1={c + Math.cos(a) * r1}
            y1={c + Math.sin(a) * r1}
            x2={c + Math.cos(a) * r2}
            y2={c + Math.sin(a) * r2}
            style={{ stroke: LINE, strokeWidth: long ? 1 : 0.5 }}
          />
        );
      })}

      <circle cx={c} cy={c} r={80 * scale} style={{ fill: DRUM, stroke: LINE_STRONG, strokeWidth: 1 }} />
      <circle cx={c} cy={c} r={72 * scale} style={{ fill: "none", stroke: LINE, strokeWidth: 1 }} />

      {chambers.map((h) => (
        <g key={h.i}>
          <circle
            cx={h.x}
            cy={h.y}
            r={15 * scale}
            style={{ fill: DARK, stroke: ring(h.mark), strokeWidth: 1 }}
          />
          <circle
            cx={h.x}
            cy={h.y}
            r={9.5 * scale}
            style={{ fill: "none", stroke: LINE, strokeWidth: 0.75 }}
          />
          <circle
            cx={h.x}
            cy={h.y}
            r={2 * scale}
            style={{ fill: pin(h.mark), opacity: h.mark === "hidden" ? 0.45 : 1 }}
          />
          <text
            x={h.lx}
            y={h.ly}
            fontSize={8 * scale}
            fontFamily={MONO}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fill: BRASS_DIM, opacity: 0.8 }}
          >
            {String(h.i + 1).padStart(2, "0")}
          </text>
        </g>
      ))}

      <circle cx={c} cy={c} r={15 * scale} style={{ fill: DARK, stroke: BRASS, strokeWidth: 1 }} />
      <circle cx={c} cy={c} r={3.5 * scale} style={{ fill: BRASS }} />

      {pointer && (
        <g transform={`rotate(${activeIndex * 45} ${c} ${c})`}>
          <line
            x1={c}
            y1={c - 17 * scale}
            x2={c}
            y2={c - 38 * scale}
            style={{ stroke: BRASS, strokeWidth: 1 }}
          />
          <path
            d={`M${c} ${c - 45 * scale} l${4.5 * scale} ${6.5 * scale} h${-9 * scale} z`}
            style={{ fill: BRASS }}
          />
        </g>
      )}

    </svg>
  );
}
