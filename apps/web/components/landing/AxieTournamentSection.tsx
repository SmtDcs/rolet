"use client";

import React from "react";
import Link from "next/link";
import {
  Trophy,
  ShieldCheck,
  Coins,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  Flame,
  Award,
} from "lucide-react";

export function AxieTournamentSection() {
  return (
    <section id="tournament" className="py-24 relative overflow-hidden">
      {/* Background Gold & Purple Glows */}
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="axie-badge mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Competitive Esports & Treasury</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            Season 1{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-orange-400">
              Invitational & Economy
            </span>
          </h2>
          <p className="font-sans text-slate-400 max-w-2xl text-base sm:text-lg">
            A transparent on-chain protocol economy designed for sustainable competitive esports and community ownership.
          </p>
        </div>

        {/* Big Tournament Banner Card */}
        <div className="axie-card p-8 sm:p-12 mb-12 border-2 border-amber-500/30 relative overflow-hidden">
          {/* Subtle Radial Glow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/15 blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Info */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-4">
                <Flame className="w-3.5 h-3.5" />
                <span>SEASON 1 REGISTRATION CLOSES IN 14 DAYS</span>
              </div>

              <h3 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight mb-4">
                $50,000 SOL Global Invitational
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                Compete against the world&apos;s sharpest tacticians in an 8-round Swiss bracket duel tournament. 
                Top 64 players share the seasonal championship treasury, with the Grand Champion receiving the legendary 
                Obsidian Peacemaker #001 NFT trophy.
              </p>

              <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-[#090f26]/80 border border-white/10 mb-8 max-w-md">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">1st Place</span>
                  <div className="text-lg font-black text-amber-400 font-mono">20,000 SOL</div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">2nd-4th Place</span>
                  <div className="text-lg font-black text-slate-200 font-mono">15,000 SOL</div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Top 64 Tier</span>
                  <div className="text-lg font-black text-cyan-400 font-mono">15,000 SOL</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/play"
                  className="btn-axie-orange px-8 py-3.5 text-xs sm:text-sm flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Register for Invitational</span>
                </Link>
              </div>
            </div>

            {/* Right: Revenue Model Breakdown (90% / 5% / 5%) */}
            <div className="lg:col-span-5 bg-[#09102b] border border-[#1b2b63] rounded-3xl p-6 sm:p-8">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-4">
                Protocol Value Distribution
              </span>

              <div className="space-y-4">
                {/* 90% Treasury */}
                <div className="p-4 rounded-2xl bg-[#0e183d] border border-cyan-500/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-black uppercase text-white">Championship Treasury</span>
                    <span className="text-lg font-black text-cyan-400 font-mono">90%</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Directly fuels competitive seasonal tournament prizes and duel victory bounties.
                  </p>
                </div>

                {/* 5% Insurance Reserve */}
                <div className="p-4 rounded-2xl bg-[#0e183d] border border-amber-500/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-black uppercase text-white">Insurance & Safety Reserve</span>
                    <span className="text-lg font-black text-amber-400 font-mono">5%</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Locked on-chain buffer ensuring instant settlement liquidity for all participants.
                  </p>
                </div>

                {/* 5% Core Protocol Dev */}
                <div className="p-4 rounded-2xl bg-[#0e183d] border border-purple-500/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-black uppercase text-white">Core Protocol & MagicBlock</span>
                    <span className="text-lg font-black text-purple-400 font-mono">5%</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Dedicated to node RPC operations, security audits, and continuous feature development.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Trust Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0b1330]/80 border border-[#1b2b62] flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-white mb-1">100% Non-Custodial</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Prizes are routed directly to winners via Anchor smart contracts without middleman custody.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0b1330]/80 border border-[#1b2b62] flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-white mb-1">Verifiable Randomness</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Commit-reveal hashing guarantees zero rigging or front-running by validators or opponents.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0b1330]/80 border border-[#1b2b62] flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-white mb-1">Sub-Second Execution</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                MagicBlock Ephemeral Rollups ensure gasless session turns under 400ms for esports precision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
