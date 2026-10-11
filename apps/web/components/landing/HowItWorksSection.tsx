import Image from "next/image";
import Link from "next/link";
import { C, F } from "./theme";

// Restyle brief (Game Art Director): three moves, one picture each, one line each.
const CARD_ROW = [
  { id: "hawkeye", name: "HawkEye" },
  { id: "blocker", name: "Blocker" },
  { id: "healer", name: "Healer" },
] as const;

function Step({
  n,
  title,
  line,
  flip,
  children,
}: {
  n: string;
  title: string;
  line: string;
  flip?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
      <div
        className={`relative overflow-hidden border md:col-span-7 ${flip ? "md:order-2" : ""}`}
        style={{ background: C.soot, borderColor: C.graphite }}
      >
        {children}
      </div>
      <div className={`md:col-span-5 ${flip ? "md:order-1" : ""}`}>
        <p className="text-sm" style={{ fontFamily: F.mono, color: C.brass }}>
          {n}
        </p>
        <h3
          className="mt-2 text-4xl font-bold uppercase leading-none tracking-[0.06em] sm:text-5xl"
          style={{ fontFamily: F.display, color: C.bone }}
        >
          {title}
        </h3>
        <p className="mt-5 max-w-sm text-lg leading-relaxed" style={{ fontFamily: F.sans, color: C.worn }}>
          {line}
        </p>
      </div>
    </li>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how" className="scroll-mt-14 px-5 py-28" style={{ background: "rgba(20,20,20,0.94)" }}>
      <div className="mx-auto max-w-6xl">
        <h2
          className="text-5xl font-extrabold uppercase leading-none tracking-[0.06em] sm:text-6xl"
          style={{ fontFamily: F.display, color: C.bone }}
        >
          How it works
        </h2>
        <p className="mt-3 text-lg" style={{ fontFamily: F.sans, color: C.worn }}>
          Three moves. That&rsquo;s the game.
        </p>

        <ol className="mt-16 flex flex-col gap-20 md:gap-28">
          <Step n="01" title="Load the cylinder" line="Eight holes. You load them. You hear the click.">
            <div className="relative aspect-[9/8] w-full">
              <Image
                src="/art/landing/chambers-hd.webp"
                alt="Gunmetal cylinder with eight bored holes and a brass hub under an amber lamp"
                fill
                quality={90}
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-cover"
              />
            </div>
            {/* Chamber state — DOM only. Patina = empty, Signal = loaded. */}
            <div
              className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-2"
              style={{ background: "rgba(20,20,20,0.85)" }}
            >
              {[1, 1, 0, 1, 1, 0, 1, 0].map((loaded, i) => (
                <span
                  key={i}
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: loaded ? C.signal : C.patina }}
                />
              ))}
              <span className="ml-3 text-xs" style={{ fontFamily: F.mono, color: C.bone }}>
                5 live / 3 blank
              </span>
            </div>
          </Step>

          <Step flip n="02" title="Play a paper card" line="Pick a card. HawkEye sees. Blocker holds. Healer mends.">
            <div className="grid grid-cols-3 gap-3 p-5 sm:gap-5 sm:p-8">
              {CARD_ROW.map((c) => (
                <figure key={c.id} className="flex flex-col items-center">
                  <div className="relative aspect-[315/445] w-full">
                    <Image
                      src={`/art/landing/card-${c.id}-hd.webp`}
                      alt={`${c.name} card`}
                      fill
                      quality={90}
                      sizes="(min-width: 768px) 200px, 30vw"
                      className="object-contain"
                    />
                  </div>
                  <figcaption
                    className="mt-3 text-xs font-medium uppercase tracking-[0.2em] sm:text-sm"
                    style={{ fontFamily: F.sans, color: C.bone }}
                  >
                    {c.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Step>

          <Step n="03" title="Face the paper rival" line="Your rival is paper too. Same workshop. Same eight holes.">
            <div className="relative flex aspect-[9/8] w-full items-center justify-center">
              <div className="relative h-[88%] aspect-[560/755]">
                <Image
                  src="/art/landing/paper-duelist-hd.webp"
                  alt="Paper duelist card: hooded figure, blank paper mask, brass wax seal"
                  fill
                  quality={90}
                  sizes="(min-width: 768px) 420px, 80vw"
                  className="object-contain"
                />
              </div>
            </div>
          </Step>
        </ol>

        <div className="mt-24 flex justify-center">
          <Link
            href="/duel"
            className="border px-8 py-4 text-sm font-medium uppercase tracking-[0.14em] transition-colors hover:bg-[#3A3F47]"
            style={{ fontFamily: F.sans, background: C.graphite, color: C.bone, borderColor: C.brass }}
          >
            Enter the workshop
          </Link>
        </div>
      </div>
    </section>
  );
}
