"use client";

import React from "react";
import Link from "next/link";
import { AmbientAudio } from "@/components/ui/AmbientAudio";

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
              <span className="font-['Cinzel_Decorative',serif] text-xl font-bold tracking-widest text-[#f5ecd8]">
                ROLET
              </span>
            </div>
            <p className="font-['Cinzel',serif] text-xs text-[#8c7760] leading-relaxed max-w-sm">
              Solana L1 üzerinde çalışan, hiçbir sunucu veya harici veritabanı gerektirmeyen, 
              commit-reveal kriptografik rastgeleliğine sahip ilk tamamen zincir üstü taktiksel Rus Ruleti.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <span className="font-['Cinzel',serif] text-xs uppercase tracking-widest text-[#c6a15b] font-semibold block mb-4">
              Masa Menüsü
            </span>
            <ul className="space-y-2.5 font-['Cinzel',serif] text-xs text-[#b8a68f]">
              <li>
                <a href="#rules" className="hover:text-[#e5c378] transition-colors">
                  Masa Kuralları
                </a>
              </li>
              <li>
                <a href="#grimoire" className="hover:text-[#e5c378] transition-colors">
                  12 Taktiksel Kart
                </a>
              </li>
              <li>
                <a href="#economy" className="hover:text-[#e5c378] transition-colors">
                  Kasa Ekonomisi (%90/5/5)
                </a>
              </li>
              <li>
                <a href="#leaderboard" className="hover:text-[#e5c378] transition-colors">
                  Liderlik Kürsüsü
                </a>
              </li>
              <li>
                <Link href="/play" className="hover:text-[#e5c378] transition-colors text-[#e5c378]">
                  Oyun Portalı (/play) ↗
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem & Links */}
          <div>
            <span className="font-['Cinzel',serif] text-xs uppercase tracking-widest text-[#c6a15b] font-semibold block mb-4">
              Ekosistem & Kaynaklar
            </span>
            <ul className="space-y-2.5 font-['Space_Mono',monospace] text-xs text-[#8c7760]">
              <li>
                <a
                  href="https://github.com/SmtDcs/rolet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#e5c378] transition-colors"
                >
                  GitHub Kaynak Kodu ↗
                </a>
              </li>
              <li>
                <a
                  href="https://explorer.solana.com/address/Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#e5c378] transition-colors"
                >
                  Solana Explorer (Program) ↗
                </a>
              </li>
              <li>
                <span className="text-[#52c41a]">● Metaplex Core NFT</span>
              </li>
              <li>
                <span className="text-[#52c41a]">● Bonfida SNS (.sol)</span>
              </li>
              <li>
                <span className="text-[#52c41a]">● MagicBlock ER Compatible</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-8 border-t border-[#1f1710] flex flex-col sm:flex-row items-center justify-between gap-4 font-['Space_Mono',monospace] text-[10px] text-[#6b5847]">
          <span>© 2026 ROLET Protocol. Açık kaynak kodlu (MIT License).</span>
          <div className="flex items-center gap-4">
            <span>Ağ: Solana Devnet</span>
            <span>•</span>
            <span>Anchor 0.30.1</span>
          </div>
        </div>
      </div>

      {/* Floating ambient sound control in bottom right */}
      <AmbientAudio />
    </footer>
  );
}
