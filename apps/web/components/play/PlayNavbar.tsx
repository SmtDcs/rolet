"use client";

import React from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";

interface PlayNavbarProps {
  durabilityRemaining?: number;
  durabilityMax?: number;
  hasSessionKey?: boolean;
}

export function PlayNavbar({
  durabilityRemaining = 10,
  durabilityMax = 10,
  hasSessionKey = false,
}: PlayNavbarProps) {
  const { connected } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[#070605]/90 backdrop-blur-md border-b border-[#2b2016] px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Back to Home + Brand */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 font-['Cinzel',serif] text-xs text-[#a68e72] hover:text-[#e5c378] transition-colors py-1"
        >
          <span>←</span>
          <span>Ana Sayfa</span>
        </Link>
        <span className="text-[#3b2b1d]">|</span>
        <span className="font-['Cinzel_Decorative',serif] text-sm font-bold tracking-widest text-[#f5ecd8] hidden sm:inline">
          ROLET CASINO
        </span>
      </div>

      {/* Middle: Game State Badges */}
      <div className="flex items-center gap-3">
        {connected && (
          <>
            {/* Durability Tracker */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-sm bg-[#120d09] border border-[#3d2b1c] text-xs font-['Space_Mono',monospace]">
              <span className="text-[#a68e72]">Dayanıklılık:</span>
              <span
                className={`font-bold ${
                  durabilityRemaining > 2 ? "text-[#52c41a]" : "text-[#ff4d4f]"
                }`}
              >
                {durabilityRemaining}/{durabilityMax}
              </span>
            </div>

            {/* Session Key Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-sm bg-[#120d09] border border-[#3d2b1c] text-xs font-['Space_Mono',monospace]">
              <span className="text-[#a68e72]">Oturum:</span>
              <span
                className={`flex items-center gap-1 font-bold ${
                  hasSessionKey ? "text-[#52c41a]" : "text-[#d48806]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${hasSessionKey ? "bg-[#52c41a]" : "bg-[#d48806]"}`} />
                {hasSessionKey ? "Gazsız (Aktif)" : "Beklemede"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: Wallet MultiButton */}
      <div className="flex items-center gap-3">
        <div className="wallet-adapter-gold">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
