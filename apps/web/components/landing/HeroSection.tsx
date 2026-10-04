"use client";

import React from "react";
import dynamic from "next/dynamic";
import { GildedButton } from "@/components/ui/GildedButton";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";
import { Swords, BookOpen, Check, ShieldCheck, Zap, Lock } from "lucide-react";

// Dynamically import the real Scroll-Driven 3D Revolver Canvas
const ScrollRevolverCanvas = dynamic(
  () => import("./ScrollRevolverCanvas").then((mod) => mod.ScrollRevolverCanvas),
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
          <div className="lg:col-span-6 flex flex-col items-start z-10">
            {/* Top Seal Badge */}
            <div className="mb-5">
              <ParchmentSeal
                label="On-Chain Occult Duel Protocol"
                sublabel="Solana Devnet • Anchor 0.30.1"
                variant="gold"
              />
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#f5ecd8] leading-[1.08] mb-6">
              EIGHT CHAMBERS. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5c378] via-[#ffdca8] to-[#c6a15b] drop-shadow-[0_0_25px_rgba(198,161,91,0.35)]">
                TWELVE CARDS.
              </span>
              <br />
              ONE CLAIMS THE VAULT.
            </h1>

            {/* Subhead description */}
            <p className="font-serif italic text-lg sm:text-xl text-[#d4c3ad] leading-relaxed max-w-xl mb-8">
              A tactical turn-based chamber duel running purely on Solana L1. 
              Two duelists share a single revolver cylinder loaded with live and blank cartridges. 
              Cast tactical tarot spells, master on-chain probability, and claim the victor's treasury prize.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <GildedButton href="/play" variant="gold" size="lg">
                <Swords className="w-5 h-5 text-[#c6a15b] mr-2" />
                <span>Enter Table / Launch App</span>
              </GildedButton>

              <GildedButton href="#rules" variant="dark" size="lg">
                <BookOpen className="w-4 h-4 text-[#a68e72] mr-2" />
                <span>Table Rules</span>
              </GildedButton>
            </div>

            {/* Trust Highlights */}
            <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#9c8973]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#52c41a]" />
                <span>Zero Server Dependencies</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#52c41a]" />
                <span>Provable Commit-Reveal RNG</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#52c41a]" />
                <span>MagicBlock Session Keys</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Revolver & Cards Canvas */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-lg border border-[#3b2b1d] bg-gradient-to-b from-[#140e0a]/80 to-[#0a0705]/95 shadow-[0_0_40px_rgba(0,0,0,0.85)] overflow-hidden">
              {/* Corner brass ornaments */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#c6a15b]" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#c6a15b]" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#c6a15b]" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#c6a15b]" />

              <ScrollRevolverCanvas />
            </div>
          </div>
        </div>

        {/* ───── Live On-Chain Ticker Strip ───── */}
        <div className="mt-14 pt-8 border-t border-[#261c14] grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col p-4 rounded-sm border border-[#2b2016] bg-[#0f0c09]/90">
            <span className="font-serif text-xs uppercase tracking-wider text-[#a68e72]">
              Prize Per Match
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl font-bold text-[#e5c378]">
                {vaultRewardSol.toFixed(2)} SOL
              </span>
              <span className="text-[10px] font-mono text-[#52c41a]">+80% Return</span>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-sm border border-[#2b2016] bg-[#0f0c09]/90">
            <span className="font-serif text-xs uppercase tracking-wider text-[#a68e72]">
              Duels Settled
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl font-bold text-[#f5ecd8]">
                {matchesSettled}
              </span>
              <span className="text-[10px] font-mono text-[#a68e72]">Verified L1</span>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-sm border border-[#2b2016] bg-[#0f0c09]/90">
            <span className="font-serif text-xs uppercase tracking-wider text-[#a68e72]">
              Cylinder Chambers
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl font-bold text-[#f5ecd8]">
                8 Slots
              </span>
              <span className="text-[10px] font-mono text-[#b83232]">Live & Blank Mix</span>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-sm border border-[#2b2016] bg-[#0f0c09]/90">
            <span className="font-serif text-xs uppercase tracking-wider text-[#a68e72]">
              Treasury Allocation
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl font-bold text-[#52c41a]">
                90% Pool
              </span>
              <span className="text-[10px] font-mono text-[#a68e72]">5% Ops / 5% Ins.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
