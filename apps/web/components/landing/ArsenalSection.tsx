import Image from "next/image";

/**
 * The deck. Three cards are drawn large because those are the three a new
 * player meets first; the rest of the twelve stay sealed and are named only
 * as a count, which is honest and keeps the section from padding itself.
 */
const REVEALED = [
  {
    id: "hawkeye",
    index: "01",
    name: "HawkEye",
    does: "Shows the next chamber before you commit. Live or blank, you know.",
  },
  {
    id: "blocker",
    index: "02",
    name: "Blocker",
    does: "The next shot aimed at you hits nothing.",
  },
  {
    id: "healer",
    index: "03",
    name: "Healer",
    does: "One life back. Never past four.",
  },
] as const;

const NAMED = ["BulletExtractor", "LastChance", "RestoreBullet", "Shuffler", "HandOfFate"];

export function ArsenalSection() {
  return (
    <section id="cards" className="grid-field grain-field scroll-mt-14 border-t border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="frame" data-frame="THE ARSENAL">
          <p className="label">Twelve in the deck</p>
          <h2 className="macro-sm mt-3">Cards decide the chamber</h2>
          <p className="mt-4 max-w-2xl font-sans text-[0.95rem] leading-relaxed text-[var(--color-phosphor-dim)]">
            Four cards in hand, eight chambers ahead, four lives each. A pull is a
            coin you can read; a card is the skill that reads it.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-px bg-[var(--color-line)] sm:grid-cols-3">
          {REVEALED.map((card) => (
            <li key={card.id} className="bg-[var(--color-void)] p-6">
              <div className="relative aspect-[315/445] w-full">
                <Image
                  src={`/art/landing/card-${card.id}-hd.webp`}
                  alt={`${card.name} card`}
                  fill
                  quality={88}
                  sizes="(max-width: 640px) 90vw, 320px"
                  className="object-contain"
                />
              </div>
              <p className="label mt-6 text-[var(--color-brass)]">{card.index}</p>
              <p className="mt-1 font-display text-lg uppercase tracking-[0.16em] text-[var(--color-phosphor)]">
                {card.name}
              </p>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[var(--color-phosphor-dim)]">
                {card.does}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-px flex flex-wrap items-center gap-x-6 gap-y-2 border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-4">
          <span className="label text-[var(--color-brass-dim)]">Sealed</span>
          {NAMED.map((n) => (
            <span key={n} className="label">
              {n}
            </span>
          ))}
          <span className="label text-[var(--color-phosphor-faint)]">+ four in reserve</span>
        </div>
      </div>
    </section>
  );
}
