"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ExternalLink,
  Gamepad2,
  ShoppingBag,
  Users,
  Coins,
  Trophy,
  Sparkles,
  ChevronDown,
  Flame,
} from "lucide-react";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gamesDropdownOpen, setGamesDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#060a1cf0] backdrop-blur-xl border-b border-[#1a2754]/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand Logo (Axie Style) */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00b4d8] via-[#0077b6] to-[#023e8a] p-[1.5px] shadow-[0_0_20px_rgba(0,180,216,0.4)] group-hover:shadow-[0_0_30px_rgba(0,180,216,0.7)] group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full rounded-[14px] bg-[#070c22] flex items-center justify-center overflow-hidden relative">
              {/* Internal Cyan Radial Core */}
              <div className="absolute inset-0 bg-radial from-[#00f0ff]/20 to-transparent" />
              {/* Revolver Chamber / Axie Emblem */}
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-[#38bdf8] group-hover:rotate-45 transition-transform duration-500 ease-out"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" className="stroke-[#0284c7]" />
                <circle cx="12" cy="12" r="2.5" fill="#38bdf8" />
                <circle cx="12" cy="6" r="1.5" fill="#f59e0b" />
                <circle cx="16.24" cy="7.76" r="1.5" fill="#38bdf8" />
                <circle cx="18" cy="12" r="1.5" fill="#f59e0b" />
                <circle cx="16.24" cy="16.24" r="1.5" fill="#38bdf8" />
                <circle cx="12" cy="18" r="1.5" fill="#f59e0b" />
                <circle cx="7.76" cy="16.24" r="1.5" fill="#38bdf8" />
                <circle cx="6" cy="12" r="1.5" fill="#f59e0b" />
                <circle cx="7.76" cy="7.76" r="1.5" fill="#38bdf8" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-2xl tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,180,216,0.5)]">
                ROLET
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                PvP
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#38bdf8]/80">
              Tactical Duel Universe
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links (Axie Menu Style) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-extrabold uppercase tracking-wider text-[#94a3b8]">
          {/* Games dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setGamesDropdownOpen(true)}
            onMouseLeave={() => setGamesDropdownOpen(false)}
          >
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:text-white hover:bg-[#131d42] transition-colors">
              <Gamepad2 className="w-4 h-4 text-[#38bdf8]" />
              <span>Games</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {gamesDropdownOpen && (
              <div className="absolute top-full left-0 w-64 pt-2 z-50">
                <div className="bg-[#0b122c] border border-[#1e2d63] rounded-2xl p-2 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                  <a
                    href="#games"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#152354] transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-[#0284c7]/20 text-[#38bdf8]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white text-xs font-bold flex items-center gap-1.5">
                        Chamber Duel
                        <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-500/20 text-emerald-400 font-mono">
                          LIVE
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748b] font-normal lowercase tracking-normal">
                        1v1 tactical chamber arena
                      </div>
                    </div>
                  </a>

                  <a
                    href="#games"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#152354] transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white text-xs font-bold flex items-center gap-1.5">
                        The Gauntlet
                        <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-400 font-mono">
                          Q2 2026
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748b] font-normal lowercase tracking-normal">
                        4-player survival shootout
                      </div>
                    </div>
                  </a>

                  <a
                    href="#games"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#152354] transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <ZapIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white text-xs font-bold flex items-center gap-1.5">
                        Blitz Protocol
                        <span className="px-1 py-0.2 rounded text-[8px] bg-cyan-500/20 text-cyan-400 font-mono">
                          ROLLUP
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748b] font-normal lowercase tracking-normal">
                        Sub-second MagicBlock turns
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          <a
            href="#duelists"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:text-white hover:bg-[#131d42] transition-colors"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Duelists</span>
          </a>

          <a
            href="#marketplace"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:text-white hover:bg-[#131d42] transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Marketplace</span>
          </a>

          <a
            href="#economy"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:text-white hover:bg-[#131d42] transition-colors"
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Ecosystem</span>
          </a>

          <a
            href="#leaderboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:text-white hover:bg-[#131d42] transition-colors"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Leaderboard</span>
          </a>

          <a
            href="https://github.com/SmtDcs/rolet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl hover:text-white hover:bg-[#131d42] transition-colors"
          >
            <span>Docs</span>
            <ExternalLink className="w-3 h-3 text-[#38bdf8]" />
          </a>
        </nav>

        {/* Right Action: Solana Devnet Pill & Axie 3D Tactile CTA */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Solana Status Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a122e] border border-[#1b2b60] text-[11px] font-mono text-[#7dd3fc]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Solana Devnet</span>
          </div>

          {/* Axie Blue Button: Marketplace / Armory */}
          <a
            href="#marketplace"
            className="btn-axie-glass text-xs px-4 py-2.5 hidden md:inline-flex"
          >
            App.Rolet
          </a>

          {/* Signature Axie Orange 3D Button: PLAY FOR FREE */}
          <Link
            href="/play"
            className="btn-axie-orange text-xs sm:text-sm px-6 py-2.5"
          >
            Play for Free
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            href="/play"
            className="btn-axie-orange text-xs px-4 py-2"
          >
            Play
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-[#0e1738] border border-[#1e2d63] text-[#38bdf8]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070d24] border-b border-[#1b2b60] px-6 py-6 flex flex-col gap-3 font-sans text-sm font-bold uppercase tracking-wider text-[#e2e8f0]">
          <a
            href="#games"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0f1b42]/60 hover:bg-[#16275f]"
          >
            <Gamepad2 className="w-5 h-5 text-[#38bdf8]" />
            <span>Games & Modes</span>
          </a>
          <a
            href="#duelists"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0f1b42]/60 hover:bg-[#16275f]"
          >
            <Users className="w-5 h-5 text-purple-400" />
            <span>Duelist Archetypes</span>
          </a>
          <a
            href="#marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0f1b42]/60 hover:bg-[#16275f]"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span>App.Rolet Marketplace</span>
          </a>
          <a
            href="#economy"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0f1b42]/60 hover:bg-[#16275f]"
          >
            <Coins className="w-5 h-5 text-emerald-400" />
            <span>Ecosystem & Vault</span>
          </a>
          <a
            href="#leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0f1b42]/60 hover:bg-[#16275f]"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Leaderboard</span>
          </a>

          <div className="pt-2">
            <Link
              href="/play"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-axie-orange w-full py-3.5 text-center text-sm"
            >
              Launch Rolet Arena
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
