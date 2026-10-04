import type { Metadata } from "next";
import { Special_Elite, VT323, Cinzel, Cinzel_Decorative } from "next/font/google";
import { SolanaProvider } from "@/components/SolanaProvider";
import "./globals.css";

const display = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rolet-display",
});

const mono = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rolet-mono",
});

const cinzel = Cinzel({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const cinzelDec = Cinzel_Decorative({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-cinzel-dec",
});

export const metadata: Metadata = {
  title: "ROLET // The Occult Casino & Tactical Russian Roulette on Solana",
  description: "Eight chambers. Twelve cards. One winner takes the vault. Fully on-chain PvP on Solana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${cinzel.variable} ${cinzelDec.variable}`}>
      <body className="relative min-h-screen bg-[#070605] text-[#e6d7c3] antialiased overflow-x-hidden selection:bg-[#8c2727] selection:text-[#fff5ea]">
        {/* Inline SVG turbulence — film-grain noise source */}
        <svg className="hidden" aria-hidden>
          <filter id="rolet-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </svg>

        <SolanaProvider>{children}</SolanaProvider>

        {/* ───── Cursed-monitor overlay stack ───── */}
        <div
          className="pointer-events-none fixed inset-0 z-[80] opacity-[0.18] mix-blend-overlay animate-noise"
          style={{ filter: "url(#rolet-noise)" }}
        />
        <div
          className="pointer-events-none fixed inset-0 z-[81] opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, transparent 2px, transparent 3px)",
          }}
        />
        <div
          className="pointer-events-none fixed inset-0 z-[82] mix-blend-screen opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(120,0,0,0.35) 100%)",
          }}
        />
        <div className="pointer-events-none fixed inset-0 z-[83] animate-flicker bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
      </body>
    </html>
  );
}
