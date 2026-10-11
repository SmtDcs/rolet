"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ChamberDial } from "./ChamberDial";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);
import type { Toast } from "@/hooks/useRolet";
import { C, F } from "@/components/landing/theme";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88A2E]";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/**
 * The matchmaking room. The bench is the world (grain and vignette stay on
 * that layer). Type, the invite, and the one action sit in a sharp dock.
 * `dial` omitted hides the cylinder. `dial={false}` holds the mark still.
 */
export function LobbyFrame({
  status,
  kicker,
  title,
  dial,
  farTaken = false,
  farLabel = "Empty seat",
  youSeated = true,
  children,
  toasts = [],
}: {
  status: string;
  kicker: string;
  title: string;
  dial?: boolean;
  farTaken?: boolean;
  farLabel?: string;
  youSeated?: boolean;
  children?: React.ReactNode;
  toasts?: Toast[];
}) {
  const showDial = dial !== undefined;
  return (
    <main className="relative z-10 min-h-svh overflow-x-hidden" style={{ background: C.soot, color: C.bone }}>
      <header
        className="fixed inset-x-0 top-0 z-30 border-b"
        style={{ background: "rgba(20,20,20,0.92)", borderColor: C.graphite }}
      >
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link
            href="/"
            className={`text-2xl font-extrabold uppercase tracking-[0.18em] ${FOCUS}`}
            style={{ fontFamily: F.display, color: C.bone }}
          >
            ROLET
          </Link>
          <span className="text-xs uppercase tracking-[0.18em]" style={{ fontFamily: F.mono, color: C.worn }}>
            {status}
          </span>
        </nav>
      </header>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-14 z-0" aria-hidden>
        <img
          src="/art/duel/bench.webp"
          alt=""
          width={960}
          height={540}
          fetchPriority="high"
          className="h-full w-full object-cover"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="absolute inset-0 opacity-[0.22] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 38%, transparent 26%, rgba(20,20,20,0.5) 70%, #141414 100%), linear-gradient(to bottom, transparent 46%, rgba(20,20,20,0.35) 68%, rgba(20,20,20,0.78) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-svh flex-col pt-14">
        <div className="flex min-h-[16rem] flex-1 flex-col items-center px-4 pt-3">
          <FarSeat taken={farTaken} label={farLabel} />
          <div className="flex flex-1 items-center justify-center py-2">
            {showDial ? <ChamberDial ticking={dial} /> : null}
          </div>
          <Hand seated={youSeated} />
        </div>

        <div className="border-t px-4 pb-8 pt-4" style={{ background: "rgba(20,20,20,0.94)", borderColor: C.graphite }}>
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs uppercase tracking-[0.22em]" style={{ fontFamily: F.mono, color: C.brass }}>
              {kicker}
            </p>
            <h1
              className="mt-1 text-balance text-[1.75rem] font-extrabold uppercase leading-none tracking-[0.04em] sm:text-[2.5rem]"
              style={{ fontFamily: F.display }}
              aria-live="polite"
            >
              {title}
            </h1>
            {children}
          </div>
        </div>
      </div>

      {toasts.length > 0 && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-2" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="border px-4 py-3 text-sm"
              style={{
                fontFamily: F.sans,
                background: C.gunmetal,
                color: C.bone,
                borderColor: t.level === "error" ? C.signal : t.level === "success" ? C.patina : C.graphite,
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function FarSeat({ taken, label }: { taken: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center">
      {taken ? (
        <img
          src="/art/duel/duelist.png"
          alt=""
          width={635}
          height={1046}
          className="h-28 w-auto sm:h-36"
          style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.7))" }}
        />
      ) : (
        <div
          className="flex h-28 w-16 items-end justify-center pb-3 sm:h-32 sm:w-[4.5rem]"
          style={{ background: C.worn, boxShadow: "0 10px 16px rgba(0,0,0,0.55)" }}
        >
          <span className="text-xs uppercase tracking-[0.16em]" style={{ fontFamily: F.mono, color: C.gunmetal }}>
            Open
          </span>
        </div>
      )}
      <p className="mt-1 text-xs uppercase tracking-[0.16em]" style={{ fontFamily: F.mono, color: taken ? C.bone : C.worn }}>
        {label}
      </p>
    </div>
  );
}

function Hand({ seated }: { seated: boolean }) {
  return (
    <div className={`flex items-end justify-center gap-4 sm:gap-6 ${seated ? "" : "opacity-40"}`}>
      <div className="px-1.5 py-1" style={{ background: "rgba(20,20,20,0.78)" }}>
        <p className="text-xs uppercase tracking-[0.16em]" style={{ fontFamily: F.mono, color: C.bone }}>
          Lives
        </p>
        <div className="mt-1 flex gap-1.5" role="img" aria-label={seated ? "Four lives" : "Lives not in play"}>
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              className="block h-7 w-2 border"
              style={{ borderColor: C.brass, background: seated ? C.brass : "transparent" }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-end" aria-hidden>
        {[-8, -3, 3, 8].map((tilt) => (
          <CardBack key={tilt} tilt={tilt} />
        ))}
      </div>
    </div>
  );
}

function CardBack({ tilt }: { tilt: number }) {
  return (
    <svg
      viewBox="0 0 90 126"
      className="-ml-4 h-[4.5rem] w-12 first:ml-0 sm:-ml-5 sm:h-24 sm:w-16"
      style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "50% 110%" }}
    >
      <path d="M9 5 H79 L85 12 V112 L78 122 H12 L4 112 V14 Z" fill="#C8BFA8" />
      <path d="M16 16 H74 V108 H16 Z" fill="none" stroke="#2E333A" strokeWidth="1.6" />
      <circle cx="45" cy="62" r="15" fill="none" stroke="#B88A2E" strokeWidth="1.6" />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        return (
          <circle key={i} cx={45 + Math.cos(angle) * 15} cy={62 + Math.sin(angle) * 15} r="2.3" fill="#1E2227" />
        );
      })}
      <circle cx="45" cy="62" r="3.2" fill="#B88A2E" />
      <circle cx="22" cy="28" r="1.3" fill="#3A2A1F" opacity="0.4" />
      <circle cx="68" cy="98" r="1.5" fill="#3A2A1F" opacity="0.35" />
    </svg>
  );
}

const STEPS = ["Seat", "Opponent", "Reveal", "Launch"];

export function LobbySteps({ current }: { current: number }) {
  return (
    <ol className="mt-4 grid grid-cols-4 gap-2" aria-label="Lobby progress">
      {STEPS.map((step, i) => (
        <li key={step} aria-current={i === current ? "step" : undefined}>
          <span
            className="block text-xs uppercase tracking-[0.12em]"
            style={{ fontFamily: F.mono, color: i === current ? C.brass : C.worn }}
          >
            {step}
          </span>
          <span
            className="mt-1.5 block w-8"
            style={{ height: i === current ? 2 : 1, background: i === current ? C.brass : C.graphite }}
          />
        </li>
      ))}
    </ol>
  );
}

const buttonClass = `inline-flex min-h-12 w-full cursor-pointer items-center justify-center border px-6 text-sm font-medium uppercase tracking-[0.14em] transition-colors hover:bg-[#3A3F47] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#2E333A] sm:w-auto sm:min-w-56 ${FOCUS}`;

export function LobbyButton({
  children,
  note,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  note?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={buttonClass}
        style={{ fontFamily: F.sans, background: C.graphite, color: C.bone, borderColor: C.brass }}
      >
        {children}
      </button>
      {note && (
        <p className="mt-2 text-[15px] leading-snug" style={{ fontFamily: F.sans, color: C.worn }}>
          {note}
        </p>
      )}
    </div>
  );
}

export function LobbyLink({
  href,
  children,
  note,
}: {
  href: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="mt-4">
      <Link
        href={href}
        className={buttonClass}
        style={{ fontFamily: F.sans, background: C.graphite, color: C.bone, borderColor: C.brass }}
      >
        {children}
      </Link>
      {note && (
        <p className="mt-2 text-[15px] leading-snug" style={{ fontFamily: F.sans, color: C.worn }}>
          {note}
        </p>
      )}
    </div>
  );
}

export function LobbyQuiet({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-4 inline-flex min-h-11 cursor-pointer items-center text-sm underline underline-offset-4 ${FOCUS}`}
      style={{ fontFamily: F.sans, color: C.worn }}
    >
      {children}
    </button>
  );
}

export function LobbyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 max-w-md text-[15px] leading-snug" style={{ fontFamily: F.sans, color: C.worn }}>
      {children}
    </p>
  );
}

export function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-4 max-w-sm px-3 py-3" style={{ background: C.worn, color: C.gunmetal, transform: "rotate(-1deg)" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em]" style={{ fontFamily: F.mono }}>
          Invite
        </p>
        <button
          type="button"
          className={`inline-flex min-h-11 cursor-pointer items-center text-sm uppercase tracking-[0.14em] underline underline-offset-4 hover:underline ${FOCUS}`}
          style={{ fontFamily: F.sans, color: C.gunmetal }}
          onClick={() => {
            const full = url.startsWith("http") ? url : `${window.location.origin}${url}`;
            navigator.clipboard.writeText(full).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              },
              () => setCopied(false),
            );
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="mt-1 break-all text-xs leading-relaxed" style={{ fontFamily: F.mono }}>
        {url}
      </p>
    </div>
  );
}

export function LobbyWallet() {
  return (
    <div className="mt-4">
      <WalletMultiButton className="!h-12 !rounded-none !border !border-[#B88A2E] !bg-[#2E333A] !px-8 !font-sans !text-sm !font-medium !uppercase !tracking-[0.14em] !text-[#E6E1D6] hover:!bg-[#3A3F47]" />
    </div>
  );
}
