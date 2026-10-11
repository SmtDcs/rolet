const CONTENTS = [
  { label: "Protocol", note: "Accounts, instructions, commit-reveal seeding" },
  { label: "Economy", note: "Character supply, durability burn, reward pool" },
  { label: "Rollup", note: "What runs on the ephemeral rollup and why" },
  { label: "Characters", note: "Metaplex Core assets and the ten-match life" },
];

const GITBOOK = "https://rolet.gitbook.io/rolet";

export function DocsSection() {
  return (
    <section id="docs" className="grid-field scroll-mt-14 border-t border-[var(--color-line)] bg-[var(--color-void)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="frame" data-frame="THE WHITEPAPER">
              <p className="label">Written down, not promised</p>
              <h2 className="macro-sm mt-3">The whole protocol</h2>
              <p className="mt-4 font-sans text-[0.95rem] leading-relaxed text-[var(--color-phosphor-dim)]">
                Account layout, instruction by instruction, the commit-reveal seed,
                the durability model and what the rollup actually holds. It reads
                like a manual because it is one.
              </p>
            </div>
            <a
              href={GITBOOK}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary mt-8 inline-flex"
            >
              Open the GitBook
            </a>
          </div>

          <dl className="grid grid-cols-1 gap-px self-start bg-[var(--color-line)] sm:grid-cols-2">
            {CONTENTS.map((c) => (
              <a
                key={c.label}
                href={GITBOOK}
                target="_blank"
                rel="noreferrer"
                className="group bg-[var(--color-void)] px-6 py-7 transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <dt className="font-display text-lg uppercase tracking-[0.14em] text-[var(--color-phosphor)] group-hover:text-[var(--color-brass-bright)]">
                  {c.label}
                </dt>
                <dd className="mt-2 font-sans text-[0.8rem] leading-snug text-[var(--color-phosphor-faint)]">
                  {c.note}
                </dd>
              </a>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
