"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GildedButton } from "@/components/ui/GildedButton";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#070605]/85 backdrop-blur-md border-b border-[#2b2016]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Seal & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-full border border-[#c6a15b] bg-gradient-to-br from-[#241a12] to-[#0e0906] flex items-center justify-center shadow-[0_0_12px_rgba(198,161,91,0.3)] group-hover:border-[#f3db98] group-hover:shadow-[0_0_20px_rgba(198,161,91,0.6)] transition-all">
            {/* 8-Chamber Revolver Cylinder Emblem */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#c6a15b]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <circle cx="12" cy="6" r="1.5" fill="currentColor" />
              <circle cx="16.24" cy="7.76" r="1.5" fill="currentColor" />
              <circle cx="18" cy="12" r="1.5" fill="currentColor" />
              <circle cx="16.24" cy="16.24" r="1.5" fill="currentColor" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" />
              <circle cx="7.76" cy="16.24" r="1.5" fill="currentColor" />
              <circle cx="6" cy="12" r="1.5" fill="currentColor" />
              <circle cx="7.76" cy="7.76" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-['Cinzel_Decorative',serif] text-xl font-bold tracking-widest text-[#f5ecd8] group-hover:text-[#ffdca8] transition-colors">
              ROLET
            </span>
            <span className="font-['Cinzel',serif] text-[9px] uppercase tracking-[0.25em] text-[#a68e72]">
              The Occult Casino
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-['Cinzel',serif] text-xs uppercase tracking-widest text-[#b8a68f]">
          <a href="#rules" className="hover:text-[#e5c378] transition-colors py-1 relative group">
            Masa Kuralları
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#c6a15b] group-hover:w-full transition-all duration-300" />
          </a>
          <a href="#grimoire" className="hover:text-[#e5c378] transition-colors py-1 relative group">
            Grimoire (12 Kart)
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#c6a15b] group-hover:w-full transition-all duration-300" />
          </a>
          <a href="#economy" className="hover:text-[#e5c378] transition-colors py-1 relative group">
            Kasa Ekonomisi
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#c6a15b] group-hover:w-full transition-all duration-300" />
          </a>
          <a href="#leaderboard" className="hover:text-[#e5c378] transition-colors py-1 relative group">
            Liderlik
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#c6a15b] group-hover:w-full transition-all duration-300" />
          </a>
          <a
            href="https://github.com/SmtDcs/rolet"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e5c378] transition-colors py-1"
          >
            Dokümanlar ↗
          </a>
        </nav>

        {/* Right CTA Area */}
        <div className="hidden md:flex items-center gap-5">
          {/* Solana Devnet Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#14100c] border border-[#3b2b1d] text-[10px] font-['Space_Mono',monospace] text-[#9c8973]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#52c41a] animate-pulse" />
            <span>Solana Devnet</span>
          </div>

          {/* Launch App Primary Button */}
          <GildedButton href="/play" variant="gold" size="sm">
            Launch App
          </GildedButton>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-3">
          <GildedButton href="/play" variant="gold" size="sm">
            Oyna
          </GildedButton>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#c6a15b] hover:text-[#f3db98]"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0e0a07] border-b border-[#3b2b1d] px-6 py-5 flex flex-col gap-4 font-['Cinzel',serif] text-sm uppercase tracking-wider text-[#b8a68f]">
          <a href="#rules" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#e5c378]">
            Masa Kuralları
          </a>
          <a href="#grimoire" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#e5c378]">
            Grimoire (12 Kart)
          </a>
          <a href="#economy" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#e5c378]">
            Kasa Ekonomisi
          </a>
          <a href="#leaderboard" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#e5c378]">
            Liderlik Kürsüsü
          </a>
          <div className="pt-2 border-t border-[#261b12] flex items-center justify-between text-xs font-['Space_Mono',monospace]">
            <span className="text-[#8a7761]">Ağ: Solana Devnet</span>
            <span className="text-[#52c41a]">● Aktif</span>
          </div>
        </div>
      )}
    </header>
  );
}
