"use client";

import React from "react";
import Link from "next/link";
import { AmbientAudio } from "@/components/ui/AmbientAudio";
import { ExternalLink } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-[#050403] border-t border-[#261c14] py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full border border-[#c6a15b] bg-[#1a120b] flex items-center justify-center text-[#c6a15b]">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                  <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="18" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                  <circle cx="6" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <span className="font-display text-xl font-bold tracking-widest text-[#f5ecd8]">
                ROLET
              </span>
            </div>
            <p className="font-serif italic text-xs text-[#8c7760] leading-relaxed max-w-sm">
              The first fully on-chain tactical Russian Roulette running purely on Solana L1. 
              Zero servers, zero backend databases, and cryptographically verified via commit-reveal RNG.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <span className="font-sans text-xs uppercase tracking-widest text-[#c6a15b] font-semibold block mb-4">
              Navigation
            </span>
            <ul className="space-y-2.5 font-sans text-xs text-[#b8a68f]">
              <li>
                <a href="#rules" className="hover:text-[#e5c378] transition-colors">
                  Table Rules
                </a>
              </li>
              <li>
                <a href="#grimoire" className="hover:text-[#e5c378] transition-colors">
                  Grimoire (12 Cards)
                </a>
              </li>
              <li>
                <a href="#economy" className="hover:text-[#e5c378] transition-colors">
                  Vault Economy (90/5/5)
                </a>
              </li>
              <li>
                <a href="#leaderboard" className="hover:text-[#e5c378] transition-colors">
                  Hall of Fame
                </a>
              </li>
              <li>
                <Link href="/play" className="hover:text-[#e5c378] transition-colors text-[#e5c378] flex items-center gap-1">
                  <span>Launch Portal (/play)</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem & Links */}
          <div>
            <span className="font-sans text-xs uppercase tracking-widest text-[#c6a15b] font-semibold block mb-4">
              Ecosystem & Tech
            </span>
            <ul className="space-y-2.5 font-mono text-xs text-[#8c7760]">
              <li>
                <a
                  href="https://github.com/SmtDcs/rolet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#e5c378] transition-colors flex items-center gap-1"
                >
                  <span>GitHub Source Code</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://explorer.solana.com/address/Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#e5c378] transition-colors flex items-center gap-1"
                >
                  <span>Solana Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-[#52c41a]">● Metaplex Core NFTs</span>
              </li>
              <li>
                <span className="text-[#52c41a]">● Bonfida SNS (.sol)</span>
              </li>
              <li>
                <span className="text-[#52c41a]">● MagicBlock Ephemeral Rollups</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#1c140d] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-[#635342]">
            © 2026 ROLET Protocol. Deployed on Solana Devnet. All rights reserved.
          </p>

          {/* Ambient Audio Switch */}
          <div className="flex items-center gap-4">
            <AmbientAudio />
          </div>
        </div>
      </div>
    </footer>
  );
}
