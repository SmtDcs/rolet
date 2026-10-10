import Image from "next/image";
import { C, F } from "./theme";

const CARDS = [
  { id: "hawkeye", name: "HawkEye", index: "01", does: "Shows you the next chamber. Live or blank, you know before you pull." },
  { id: "blocker", name: "Blocker", index: "02", does: "The next shot at you hits nothing." },
  { id: "healer", name: "Healer", index: "03", does: "Gets one life back. Never past four." },
] as const;

export function CardsSection() {
  return (
    <section id="cards" className="scroll-mt-14 px-5 py-28" style={{ background: "rgba(30,34,39,0.96)" }}>
      <div className="mx-auto max-w-6xl">
        <h2
          className="text-5xl font-extrabold uppercase leading-none tracking-[0.06em] sm:text-6xl"
          style={{ fontFamily: F.display, color: C.bone }}
        >
          The cards
        </h2>
        <p className="mt-3 text-lg" style={{ fontFamily: F.sans, color: C.worn }}>
          Twelve in the deck. These three you&rsquo;ll see first.
        </p>
        <ul className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-3">
          {CARDS.map((card) => (
            <li key={card.id} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="relative aspect-[315/445] w-full max-w-[260px]" style={{ filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.55))" }}>
                <Image
                  src={`/art/landing/card-${card.id}-hd.webp`}
                  alt={`${card.name} card`}
                  fill
                  quality={90}
                  sizes="260px"
                  className="object-contain"
                />
              </div>
              <p className="mt-6 text-xs" style={{ fontFamily: F.mono, color: C.brass }}>
                {card.index}
              </p>
              <p
                className="mt-1 text-lg font-medium uppercase tracking-[0.18em]"
                style={{ fontFamily: F.sans, color: C.bone }}
              >
                {card.name}
              </p>
              <p className="mt-2 max-w-[260px] text-sm leading-relaxed" style={{ fontFamily: F.sans, color: C.worn }}>
                {card.does}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
