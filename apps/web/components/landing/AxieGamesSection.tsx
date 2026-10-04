"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Sparkles,
  Flame,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Swords,
  ChevronRight,
  Crosshair,
} from "lucide-react";

interface GameMode {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  status: "live" | "soon" | "testnet";
  description: string;
  features: string[];
  bannerGradient: string;
  accentColor: string;
  ctaText: string;
  ctaHref: string;
}

const GAME_MODES: GameMode[] = [
  {
    id: "chamber-duel",
    title: "Rolet: Chamber Duel",
    subtitle: "Tactical 1v1 Turn-Based Duel",
    badge: "FLAGSHIP • LIVE",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    status: "live",
    description:
      "The signature 8-chamber tactical duel. Two duelists sit across the table with 12 Tarot Relic cards. Read probability, manipulate chambers, and claim the victor's prize.",
    features: [
      "8-Chamber Revolver Mechanics",
      "12 Tactical Tarot Ability Cards",
      "Provably Fair Commit-Reveal VRF",
      "Instant SOL Vault Payouts",
    ],
    bannerGradient: "from-[#0284c7]/30 via-[#0369a1]/20 to-[#070e28]",
    accentColor: "#38bdf8",
    ctaText: "Play in Browser",
    ctaHref: "/play",
  },
  {
    id: "the-gauntlet",
    title: "Rolet: The Gauntlet",
    subtitle: "4-Player Knockout Battle Royale",
    badge: "IN DEVELOPMENT • Q2 2026",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    status: "soon",
    description:
      "A high-stakes tournament bracket where 4 duelists enter and take turns in a shrinking chamber circle. Last duelist standing claims the championship bounty.",
    features: [
      "4-Player Elimination Bracket",
      "Shrinking Safe Chambers",
      "Spectator Betting Pools",
      "Championship Trophy Badges",
    ],
    bannerGradient: "from-[#f59e0b]/25 via-[#b45309]/15 to-[#070e28]",
    accentColor: "#f59e0b",
    ctaText: "View Roadmap",
    ctaHref: "#tournament",
  },
  {
    id: "blitz-protocol",
    title: "Rolet: Blitz Protocol",
    subtitle: "MagicBlock Ephemeral Speed Arena",
    badge: "ALPHA TESTNET",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    status: "testnet",
    description:
      "Ultra-fast gasless chamber duels running on MagicBlock Ephemeral Rollups. 15-second turns, sub-400ms state updates, and zero wallet popups.",
    features: [
      "Gasless Session Keys",
      "Sub-400ms Turn Latency",
      "Ephemeral State Rollup",
      "State Compression (Bubblegum)",
    ],
    bannerGradient: "from-[#38bdf8]/25 via-[#0284c7]/15 to-[#070e28]",
    accentColor: "#00f0ff",
    ctaText: "Try Alpha Testnet",
    ctaHref: "/play",
  },
  {
    id: "occult-armory",
    title: "The Occult Armory",
    subtitle: "Relic Forge & Marketplace",
    badge: "APP.ROLET FORGE",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    status: "live",
    description:
      "The on-chain forge where duelists craft, synthesize, and trade enchanted cylinder relics, engraved barrels, and ceremonial duelist skins.",
    features: [
      "NFT Relic Crafting & Fusion",
      "Peer-to-Peer Trading",
      "On-Chain Provenance",
      "Cosmetic Prestige Ranks",
    ],
    bannerGradient: "from-[#a855f7]/25 via-[#7e22ce]/15 to-[#070e28]",
    accentColor: "#c084fc",
    ctaText: "Visit Armory",
    ctaHref: "#marketplace",
  },
];

export function AxieGamesSection() {
  const [selectedGame, setSelectedGame] = useState<string>("chamber-duel");

  return (
    <section id="games" className="py-24 relative overflow-hidden">
      {/* Background Section Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header (Axie Style) */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="axie-badge mb-3">
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>The Rolet Universe</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            Discover Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#818cf8]">
              Duel Modes
            </span>
          </h2>
          <p className="font-sans text-slate-400 max-w-2xl text-base sm:text-lg">
            From classic 1v1 tactical turn-based chamber duels to sub-second rollup speed matches and 4-player knockout gauntlets.
          </p>
        </div>

        {/* 4 Games Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {GAME_MODES.map((game) => {
            const isSelected = selectedGame === game.id;
            return (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`axie-card flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "border-cyan-400 ring-2 ring-cyan-500/30 scale-[1.02]"
                    : "hover:border-blue-500/50"
                }`}
              >
                {/* Visual Header / Banner */}
                <div
                  className={`relative h-44 p-5 flex flex-col justify-between bg-gradient-to-b ${game.bannerGradient} border-b border-[#1b2854] overflow-hidden`}
                >
                  {/* Decorative background radial pattern */}
                  <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full border border-white/10 opacity-30 pointer-events-none" />
                  <div className="absolute right-6 top-6 opacity-20 pointer-events-none">
                    <Crosshair className="w-24 h-24 text-white" />
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${game.badgeColor}`}
                    >
                      {game.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="relative z-10">
                    <h3 className="font-display text-xl font-black uppercase text-white drop-shadow">
                      {game.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-300">
                      {game.subtitle}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
                    {game.description}
                  </p>

                  {/* Key Features Pill list */}
                  <div className="space-y-2 mb-6">
                    {game.features.map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-[11px] font-mono text-slate-300"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Axie CTA Button */}
                  <div className="pt-2">
                    {game.status === "live" ? (
                      <Link
                        href={game.ctaHref}
                        className="btn-axie-orange w-full py-2.5 text-xs text-center flex items-center justify-center gap-1.5"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>{game.ctaText}</span>
                      </Link>
                    ) : game.status === "testnet" ? (
                      <Link
                        href={game.ctaHref}
                        className="btn-axie-blue w-full py-2.5 text-xs text-center flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{game.ctaText}</span>
                      </Link>
                    ) : (
                      <a
                        href={game.ctaHref}
                        className="btn-axie-glass w-full py-2.5 text-xs text-center flex items-center justify-center gap-1.5"
                      >
                        <span>{game.ctaText}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
