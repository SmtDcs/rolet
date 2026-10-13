import Link from "next/link";

const LINKS = [
  { label: "Discord", href: "https://discord.gg/" },
  { label: "X", href: "https://x.com/" },
  { label: "GitHub", href: "https://github.com/SmtDcs/rolet" },
];

/**
 * Deliberately the plainest section on the page: one statement, one action.
 * The composition carries it instead of decoration.
 */
export function CommunitySection() {
  return (
    <section className="grid-field-lg grain-field border-t border-[var(--color-line)] bg-[var(--color-surface-2)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="label">A public bench</h2>
            <p className="macro mt-4">
              Everyone
              <br />
              plays in
              <br />
              the open
            </p>
          </div>
          <div>
            <p className="max-w-md font-sans text-[0.95rem] leading-relaxed text-[var(--color-phosphor-dim)]">
              Every match settles on chain and the result is readable by anyone.
              There is no hidden server state and no private scoreboard. Bring a
              wallet, take a seat.
            </p>
            <div className="mt-8 flex w-fit flex-wrap gap-px bg-[var(--color-line)]">
              <Link href="/duel" className="btn btn-primary bg-[var(--color-void)]">
                Enter the duel
              </Link>
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="btn bg-[var(--color-void)]"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
