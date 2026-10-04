import type { Metadata } from "next";
import { Cormorant_Garamond, Syne, Space_Mono, Inter } from "next/font/google";
import { SolanaProvider } from "@/components/SolanaProvider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  style: ["normal", "italic"],
});

const syne = Syne({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-syne",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ROLET — Tactical PvP Duel Protocol on Solana",
  description: "Eight chambers. Twelve tactical tarot cards. Provably fair turn-based PvP on Solana with MagicBlock Ephemeral Rollups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${syne.variable} ${spaceMono.variable} ${inter.variable}`}
    >
      <body className="relative min-h-screen bg-[#070605] text-[#e6d7c3] font-sans antialiased overflow-x-hidden selection:bg-[#8c2727] selection:text-[#fff5ea]">
        <SolanaProvider>{children}</SolanaProvider>

        {/* Subtle Luxury Vignette & Candle Atmosphere */}
        <div
          className="pointer-events-none fixed inset-0 z-[60] opacity-40 mix-blend-multiply"
          style={{
            background: "radial-gradient(circle at 50% 30%, transparent 40%, rgba(5,4,3,0.95) 100%)",
          }}
        />
      </body>
    </html>
  );
}
