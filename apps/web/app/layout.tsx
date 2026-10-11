import type { Metadata } from "next";
import localFont from "next/font/local";
import { SolanaProvider } from "@/components/SolanaProvider";
import "./globals.css";

// Every family is served from ./fonts. next/font/google resolves its files over
// the network at build time, which failed inside the container build, so the
// woff2 files are committed instead.

const cormorant = localFont({
  src: [
    { path: "./fonts/CormorantGaramond.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/CormorantGaramond-italic.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

const spaceMono = localFont({
  src: [
    { path: "./fonts/SpaceMono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/SpaceMono-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

const inter = localFont({
  src: [{ path: "./fonts/Inter.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
});

const bigShoulders = localFont({
  src: [{ path: "./fonts/BigShoulders.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-big-shoulders",
  display: "swap",
});

// IBM Plex Sans served locally: next/font/google + Turbopack (Next 16.2.4) fails to resolve its font files
const plexSans = localFont({
  src: [
    { path: "./fonts/IBMPlexSans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSans-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ROLET — Tactical PvP Duel Protocol on Solana",
  description: "8 chambers. Paper cards. Dark workshop. Provably fair turn-based PvP on Solana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${spaceMono.variable} ${inter.variable} ${bigShoulders.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="relative min-h-screen bg-[#060919] text-[#e2e8f0] font-sans antialiased overflow-x-hidden selection:bg-[#0077b6] selection:text-[#ffffff]">
        <SolanaProvider>{children}</SolanaProvider>

        {/* Ambient page glow (legacy, covered by landing root) */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle at 50% -10%, rgba(0, 180, 255, 0.18) 0%, transparent 50%), radial-gradient(circle at 90% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 45%), radial-gradient(circle at 10% 70%, rgba(245, 158, 11, 0.12) 0%, transparent 40%)",
          }}
        />
      </body>
    </html>
  );
}
