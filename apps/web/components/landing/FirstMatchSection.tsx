import Link from "next/link";

/**
 * The operational layer the page was missing. StoryScroll explains how a match
 * works and Play/Own/Earn explains why it is built that way; neither tells a
 * first-time visitor what to click. Four steps, one row.
 */
const STEPS = [
  {
    index: "01",
    title: "Connect devnet",
    body: "Point your wallet at Solana devnet. Nothing here spends real SOL.",
  },
  {
    index: "02",
    title: "Take a character",
    body: "One Metaplex Core asset — free on devnet, 0.1 SOL at launch — good for ten matches. Durability burns one per match.",
  },
  {
    index: "03",
    title: "Find a bench",
    body: "Open the duel and ask for a match. Whoever queues first hosts the table.",
  },
  {
    index: "04",
    title: "Approve once",
    body: "One prompt opens a session. Reveals, turns and settlement run without asking again.",
  },
];

export function FirstMatchSection() {
  return (
    <section className="grid-field border-t border-[var(--color-line)] bg-[var(--color-void)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="label">How to play</h2>
        <h3 className="macro-sm mt-3">Your first match</h3>

        <ol className="mt-12 grid grid-cols-1 gap-px bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.index} className="bg-[var(--color-void)] px-6 py-7">
              <p className="readout text-[var(--color-brass)]">{s.index}</p>
              <p className="mt-3 font-display text-lg uppercase tracking-[0.12em] text-[var(--color-phosphor)]">
                {s.title}
              </p>
              <p className="mt-2 font-sans text-[0.8rem] leading-relaxed text-[var(--color-phosphor-dim)]">
                {s.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-px bg-[var(--color-line)]">
          <Link href="/profile" className="btn bg-[var(--color-void)]">
            Take a character
          </Link>
          <Link href="/duel" className="btn btn-primary bg-[var(--color-void)]">
            Enter the duel
          </Link>
        </div>
      </div>
    </section>
  );
}
