import Link from "next/link";
import { C, F } from "./theme";

export function LandingFooter() {
  return (
    <footer className="border-t px-5 py-8" style={{ background: C.soot, borderColor: C.graphite }}>
      <div
        className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 text-xs sm:flex-row sm:items-center"
        style={{ fontFamily: F.mono, color: C.worn }}
      >
        <span>
          <span style={{ color: C.bone }}>ROLET</span> · Solana · workshop
        </span>
        <nav className="flex flex-wrap gap-5">
          <a href="#ledger" className="hover:underline">Ledger</a>
          <a href="#cards" className="hover:underline">Cards</a>
          <a href="#economy" className="hover:underline">Vault</a>
          <a
            href="https://rolet.gitbook.io/rolet"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Whitepaper
          </a>
          <Link href="/duel" className="hover:underline" style={{ color: C.brass }}>
            Enter
          </Link>
        </nav>
      </div>
    </footer>
  );
}
