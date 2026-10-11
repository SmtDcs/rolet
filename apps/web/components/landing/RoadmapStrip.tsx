/**
 * Brand rhythm. Two lanes running opposite directions at the same slow rate
 * (600s per loop) so the motion reads as idle telemetry rather than a ticker.
 * Stops entirely under prefers-reduced-motion.
 */
const LANE_A = [
  "New tactical cards",
  "Ranked seasons",
  "Tournaments",
  "Character variants",
  "Spectator mode",
];

const LANE_B = [
  "Mobile bench",
  "Crew matches",
  "Replay archive",
  "Crafting",
  "Ranked ladders",
];

function Lane({
  items,
  reverse = false,
}: {
  items: string[];
  reverse?: boolean;
}) {
  const track = [...items, ...items];
  return (
    <div className="relative flex overflow-hidden border-y border-[var(--color-line)] py-3">
      <div
        className={`flex w-max shrink-0 gap-10 ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
      >
        {track.map((item, i) => (
          <span key={`${item}-${i}`} className="label whitespace-nowrap">
            <span className="text-[var(--color-brass-dim)]">///</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RoadmapStrip() {
  return (
    <section aria-label="In the works" className="bg-[var(--color-surface)]">
      <div className="mx-auto w-full max-w-6xl px-6 pt-16">
        <h2 className="label">In the works</h2>
      </div>
      <div className="mt-6">
        <Lane items={LANE_A} />
        <Lane items={LANE_B} reverse />
      </div>
    </section>
  );
}
