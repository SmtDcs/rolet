const ROWS = [
  {
    index: "01",
    title: "Play",
    body: "One wallet prompt opens a session. Every turn after that is signed by that session key, and the turns themselves run on an ephemeral rollup.",
  },
  {
    index: "02",
    title: "Own",
    body: "Your character is a Metaplex Core asset with ten matches of durability. It is yours to keep, trade or retire. The program never holds it for you.",
  },
  {
    index: "03",
    title: "Earn",
    body: "Win and the treasury pays a fixed 0.02 SOL. No token is printed, nothing is farmed into existence, and the reward does not decay with supply.",
  },
] as const;

export function PlayOwnEarnSection() {
  return (
    <section className="border-t border-[var(--color-line)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="label">Why it is built this way</h2>
        <h3 className="macro-sm mt-3">A duel, not a lottery</h3>

        <div className="mt-12 grid grid-cols-1 gap-px bg-[var(--color-line)] lg:grid-cols-3">
          {ROWS.map((r) => (
            <article key={r.title} className="bg-[var(--color-void)] p-7">
              <p className="readout text-[var(--color-brass)]">{r.index}</p>
              <h4 className="mt-4 font-display text-2xl uppercase tracking-[0.1em] text-[var(--color-phosphor)]">
                {r.title}
              </h4>
              <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--color-phosphor-dim)]">
                {r.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
