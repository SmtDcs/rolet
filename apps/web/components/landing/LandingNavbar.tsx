import Link from "next/link";
import { C, F } from "./theme";

export function LandingNavbar() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-30 border-b"
      style={{ background: "rgba(20,20,20,0.92)", borderColor: C.graphite }}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="text-2xl font-extrabold uppercase tracking-[0.18em]"
          style={{ fontFamily: F.display, color: C.bone }}
        >
          ROLET
        </Link>
        <div className="flex items-center gap-5 text-sm" style={{ fontFamily: F.sans }}>
          <a href="#how" className="hidden sm:inline hover:underline" style={{ color: C.worn }}>
            How it works
          </a>
          <a href="#cards" className="hidden sm:inline hover:underline" style={{ color: C.worn }}>
            Cards
          </a>
          <Link
            href="/duel"
            className="border px-4 py-1.5 font-medium uppercase tracking-wider transition-colors hover:bg-[#3A3F47]"
            style={{ background: C.graphite, color: C.bone, borderColor: C.brass }}
          >
            Enter
          </Link>
        </div>
      </nav>
    </header>
  );
}
