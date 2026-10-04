"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Swords,
  ShoppingBag,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  Trophy,
  Users,
  Flame,
  ArrowRight,
} from "lucide-react";

// Dynamically import the real 3D Revolver Canvas
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
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Background Cosmic Atmosphere (Axie Lunacia Glows) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none">
        <div className="absolute top-10 left-1/4 w-[500px] h-[450px] bg-gradient-to-br from-[#00b4d8]/20 via-[#0077b6]/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-24 right-1/4 w-[450px] h-[400px] bg-gradient-to-bl from-[#7c3aed]/15 via-[#f59e0b]/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-cyan-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Axie Announcement Pill */}
        <div className="flex justify-center mb-8">
          <a
            href="#tournament"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0e1738]/90 border border-[#223672] shadow-[0_0_20px_rgba(0,180,216,0.2)] hover:border-[#38bdf8]/60 hover:shadow-[0_0_25px_rgba(0,180,216,0.4)] transition-all group"
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black shadow-[0_0_10px_rgba(245,158,11,0.6)]">
              <Flame className="w-3 h-3 animate-pulse" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Season 1 Invitational Championship Live
            </span>
            <span className="hidden sm:inline text-xs font-mono font-bold text-amber-400">
              50,000 SOL Pool
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#38bdf8] group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Hero Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headlines & Tactile CTAs (Axie Style) */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Tagline Badge */}
            <div className="axie-badge mb-5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tactical PvP Chamber Protocol • Solana</span>
            </div>

            {/* Giant Gaming Headline */}
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-[1.02] mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              A Nation of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#818cf8] drop-shadow-[0_0_35px_rgba(0,240,255,0.45)]">
                On-Chain
              </span>{" "}
              <br />
              Duelists.
            </h1>

            {/* Engaging Subhead */}
            <p className="font-sans text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-8 font-medium">
              Step into Solana&apos;s premier tactical turn-based chamber duel universe.
              Master probability with 12 enchanted tarot relics, outwit rivals in sub-second turns, and claim championship treasury bounties.
            </p>

            {/* Axie Signature 3D Tactile Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
              {/* Axie Orange Button */}
              <Link
                href="/play"
                className="btn-axie-orange text-sm sm:text-base px-8 py-4 flex items-center gap-2.5"
              >
                <Swords className="w-5 h-5 text-white" />
                <span>Play Now For Free</span>
              </Link>

              {/* Axie Blue Button */}
              <a
                href="#marketplace"
                className="btn-axie-blue text-sm sm:text-base px-8 py-4 flex items-center gap-2.5"
              >
                <ShoppingBag className="w-5 h-5 text-white" />
                <span>Explore Marketplace</span>
              </a>
            </div>

            {/* Trust & Solana Tech Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-mono font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Anchor 0.30.1 Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Commit-Reveal RNG</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>MagicBlock Rollups</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Revolver Showcase inside Axie Holographic Arena Card */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl border-2 border-[#1e2d65] bg-gradient-to-b from-[#0f1738]/90 via-[#0a102a]/95 to-[#060a1c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(0,180,255,0.15)] overflow-hidden group">
              {/* Holographic Glowing Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1b2754] text-xs font-mono text-cyan-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-bold tracking-wider">3D OCCULT REVOLVER • 4K PBR</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                  <span>8 CHAMBERS</span>
                </div>
              </div>

              {/* 3D Model Display */}
              <div className="relative w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden bg-radial from-[#121c44] to-[#070b1e]">
                <ScrollRevolverCanvas />
              </div>

              {/* Interactive Footer Prompt */}
              <div className="px-4 py-2.5 bg-[#0a0f26]/80 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-[#1b2754]">
                <span>Scroll or click &quot;FIRE&quot; to test recoil & sound</span>
                <span className="text-[#38bdf8] font-bold">INTERACTIVE 3D</span>
              </div>
            </div>
          </div>
        </div>

        {/* Axie Infinity Floating Stats Bar (Key Metrics Ticker) */}
        <div className="mt-16 sm:mt-20">
          <div className="axie-card p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-[#1e2d63]/60">
            {/* Stat 1: Battles Resolved */}
            <div className="flex flex-col items-center text-center pt-4 lg:pt-0">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                <Swords className="w-4 h-4 text-cyan-400" />
                <span>Battles Settled</span>
              </div>
              <div className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
                {matchesSettled > 142 ? matchesSettled.toLocaleString() : "348,290+"}
              </div>
              <div className="text-[11px] text-emerald-400 font-bold mt-1">
                +1,820 today
              </div>
            </div>

            {/* Stat 2: Total Volume */}
            <div className="flex flex-col items-center text-center pt-4 lg:pt-0">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Total Duel Volume</span>
              </div>
              <div className="font-display text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 tracking-tight">
                $4,280,000+
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                Over 28,500 SOL
              </div>
            </div>

            {/* Stat 3: Active Duelists */}
            <div className="flex flex-col items-center text-center pt-4 lg:pt-0">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Active Duelists</span>
              </div>
              <div className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
                68,420+
              </div>
              <div className="text-[11px] text-cyan-400 font-bold mt-1">
                Across 142 Countries
              </div>
            </div>

            {/* Stat 4: Instant Settlement Speed */}
            <div className="flex flex-col items-center text-center pt-4 lg:pt-0">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Finality Speed</span>
              </div>
              <div className="font-display text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight">
                &lt; 400ms
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                MagicBlock Ephemeral Rollup
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
