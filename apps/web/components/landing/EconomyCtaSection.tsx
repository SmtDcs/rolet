import Link from "next/link";

const LINES = [
  { label: "Character", value: "Free on devnet", note: "Ten matches of durability. Burns one per match." },
  { label: "Match reward", value: "0.02 SOL", note: "Paid from the treasury to the winner." },
  { label: "Purchase split", value: "5 / 95", note: "Five to operations, ninety-five to the reward pool." },
];

export function EconomyCtaSection() {
  return (
    <section id="economy" className="grid-field grain-field scroll-mt-14 border-t border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="frame" data-frame="THE VAULT">
          <p className="label">A closed loop, in SOL</p>
          <h2 className="macro-sm mt-3">Nothing here is printed</h2>
          <p className="mt-4 max-w-2xl font-sans text-[0.95rem] leading-relaxed text-[var(--color-phosphor-dim)]">
            Buying a character funds the pool that pays winners. Durability burns
            down as you play, so supply grows with matches rather than with time.
          </p>
        </div>

        <dl className="mt-10 grid grid-cols-1 gap-px bg-[var(--color-line)] sm:grid-cols-3">
          {LINES.map((l) => (
            <div key={l.label} className="bg-[var(--color-void)] px-6 py-7">
              <dt className="label">{l.label}</dt>
              <dd className="readout mt-3 text-2xl text-[var(--color-brass-bright)]">{l.value}</dd>
              <dd className="mt-2 font-sans text-[0.75rem] leading-snug text-[var(--color-phosphor-faint)]">
                {l.note}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-wrap gap-px bg-[var(--color-line)]">
          <Link href="/profile" className="btn btn-primary bg-[var(--color-void)]">
            Take a character
          </Link>
          <Link href="/docs" className="btn bg-[var(--color-void)]">
            Read the protocol
          </Link>
        </div>
      </div>
    </section>
  );
}
