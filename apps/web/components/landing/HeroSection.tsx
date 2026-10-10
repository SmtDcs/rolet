import Link from "next/link";
import { C, F } from "./theme";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden pt-14">
      {/* World layer lives in <WorkshopBackground /> (fixed 3D canvas). Only a
          right-side soot fade here so the copy stays legible over the scene. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to left, rgba(20,20,20,0.75) 0%, rgba(20,20,20,0.25) 40%, rgba(20,20,20,0) 60%), linear-gradient(to top, rgba(20,20,20,0.85) 0%, rgba(20,20,20,0) 30%), linear-gradient(to bottom, rgba(20,20,20,0.55) 0%, rgba(20,20,20,0) 16%)",
        }}
      />

      {/* Sharp HUD */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl justify-end px-5 pb-16 sm:pb-24">
        <div className="max-w-md">
        <h1
          className="text-7xl font-extrabold uppercase leading-none tracking-[0.12em] sm:text-9xl"
          style={{ fontFamily: F.display, color: C.bone }}
        >
          ROLET
        </h1>
        <p className="mt-4 text-lg sm:text-xl" style={{ fontFamily: F.sans, color: C.bone }}>
          8 chambers. Paper cards. Dark workshop.
        </p>
        <p className="mt-3 max-w-sm text-base leading-relaxed" style={{ fontFamily: F.sans, color: C.worn }}>
          Two players. One cylinder. You take turns pulling. Cards bend the odds.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Link
            href="/duel"
            className="border px-6 py-3 text-sm font-medium uppercase tracking-[0.14em] transition-colors hover:bg-[#3A3F47]"
            style={{ fontFamily: F.sans, background: C.graphite, color: C.bone, borderColor: C.brass }}
          >
            Enter the workshop
          </Link>
          <a
            href="#how"
            className="text-sm underline underline-offset-4"
            style={{ fontFamily: F.sans, color: C.worn }}
          >
            How it works
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}
