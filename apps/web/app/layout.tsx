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
      <body className="relative min-h-screen bg-[#060919] text-[#e2e8f0] font-sans antialiased overflow-x-hidden selection:bg-[#0077b6] selection:text-[#ffffff]">
        <SolanaProvider>{children}</SolanaProvider>

        {/* Axie Infinity Ambient Cosmic Glows */}
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
