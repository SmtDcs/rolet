"use client";

import React from "react";
import dynamic from "next/dynamic";
import { GildedButton } from "@/components/ui/GildedButton";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";

// Dynamically import 3D canvas with SSR disabled for optimal load speed
const Hero3DCanvas = dynamic(
  () => import("./Hero3DCanvas").then((mod) => mod.Hero3DCanvas),
  { ssr: false }
);

interface HeroSectionProps {
  vaultRewardSol?: number;
  matchesSettled?: number;
}

export function HeroSection({
  vaultRewardSol = 0.18,
  matchesSettled = 142,
}: HeroSectionProps) {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden border-b border-[#2b2016]">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-radial from-[#c6a15b]/10 via-[#8c2727]/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 flex flex-col items-start z-10">
            {/* Top Seal Badge */}
            <div className="mb-5">
              <ParchmentSeal
                label="Fully On-Chain Düello Protokolü"
                sublabel="Solana Devnet • Anchor 0.30.1"
                variant="gold"
              />
            </div>

            {/* Main Headline */}
            <h1 className="font-['Cinzel_Decorative',serif] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#f5ecd8] leading-[1.15] mb-6">
              SEKİZ HAZNE. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5c378] via-[#ffdca8] to-[#c6a15b] drop-shadow-[0_0_25px_rgba(198,161,91,0.35)]">
                ON İKİ KART.
              </span>
              <br />
              KAZANAN KASAYI ALIR.
            </h1>

            {/* Subhead description */}
            <p className="font-['Cinzel',serif] text-sm sm:text-base text-[#b8a68f] leading-relaxed max-w-xl mb-8">
              Solana L1 üzerinde çalışan, hiçbir sunucu ve arka kapı barındırmayan taktiksel Rus Ruleti. 
              İki oyuncu, 5 canlı ve 3 kuru mermiyle dolu tek bir revolveri paylaşır. Kartlarını oyna, 
              olasılığı bük ve hazine kasasındaki gerçek SOL ödülünü kazan.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <GildedButton href="/play" variant="gold" size="lg">
                <span className="text-lg">⚔️</span>
                <span>Masaya Otur / Launch App</span>
              </GildedButton>

              <GildedButton href="#rules" variant="dark" size="lg">
                <span>Masa Kuralları</span>
              </GildedButton>
            </div>

            {/* Trust Highlights */}
            <div className="flex flex-wrap items-center gap-6 text-xs font-['Space_Mono',monospace] text-[#9c8973]">
              <div className="flex items-center gap-2">
                <span className="text-[#52c41a]">✓</span>
                <span>Sunucu & DB Yok</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#52c41a]">✓</span>
                <span>Hilesiz Commit-Reveal RNG</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#52c41a]">✓</span>
                <span>Session Keys ile Sıfır Popup</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Revolver & Cards Canvas */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-lg border border-[#3b2b1d] bg-gradient-to-b from-[#140e0a]/80 to-[#0a0705]/95 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Corner brass ornaments */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#c6a15b]" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#c6a15b]" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#c6a15b]" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#c6a15b]" />

              <Hero3DCanvas />
            </div>
          </div>
        </div>

        {/* ───── Live On-Chain Ticker Strip ───── */}
        <div className="mt-14 pt-8 border-t border-[#261c14] grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col p-4 rounded-sm border border-[#2b2016] bg-[#0f0c09]/90">
            <span className="font-['Cinzel',serif] text-xs uppercase tracking-wider text-[#a68e72]">
              Maç Başına Kazanç
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Space_Mono',monospace] text-2xl font-bold text-[#e5c378]">
                {vaultRewardSol.toFixed(2)} SOL
              </span>
              <span className="text-[11px] text-[#52c41a] font-['Space_Mono',monospace]">(+%80 Getiri)</span>
            </div>
            <span className="text-[10px] text-[#736352] mt-1 font-['Space_Mono',monospace]">
              Hazine PDA’sından anında transfer
            </span>
          </div>

          <div className="flex flex-col p-4 rounded-sm border border-[#2b2016] bg-[#0f0c09]/90">
            <span className="font-['Cinzel',serif] text-xs uppercase tracking-wider text-[#a68e72]">
              Sonuçlanan Düellolar
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Space_Mono',monospace] text-2xl font-bold text-[#f5ecd8]">
                {matchesSettled}
              </span>
              <span className="text-[11px] text-[#c6a15b] font-['Space_Mono',monospace]">Maç</span>
            </div>
            <span className="text-[10px] text-[#736352] mt-1 font-['Space_Mono',monospace]">
              On-chain MatchState kayıtları
            </span>
          </div>

          <div className="flex flex-col p-4 rounded-sm border border-[#2b2016] bg-[#0f0c09]/90">
            <span className="font-['Cinzel',serif] text-xs uppercase tracking-wider text-[#a68e72]">
              Gelir Dağılımı
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Space_Mono',monospace] text-2xl font-bold text-[#52c41a]">
                %90
              </span>
              <span className="text-xs text-[#a68e72] font-['Space_Mono',monospace]">Hazine</span>
            </div>
            <span className="text-[10px] text-[#736352] mt-1 font-['Space_Mono',monospace]">
              %5 Sigorta Fonu • %5 Ekip
            </span>
          </div>

          <div className="flex flex-col p-4 rounded-sm border border-[#2b2016] bg-[#0f0c09]/90">
            <span className="font-['Cinzel',serif] text-xs uppercase tracking-wider text-[#a68e72]">
              Tur İmzası Hızı
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Space_Mono',monospace] text-2xl font-bold text-[#e5c378]">
                &lt; 50 ms
              </span>
            </div>
            <span className="text-[10px] text-[#736352] mt-1 font-['Space_Mono',monospace]">
              Session Keys ile sıfır cüzdan popup'ı
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
