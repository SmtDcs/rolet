"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Target,
  Sparkles,
  Zap,
  Shield,
  Award,
  Swords,
  ChevronRight,
  Flame,
} from "lucide-react";

interface Archetype {
  id: string;
  name: string;
  role: string;
  badge: string;
  badgeColor: string;
  description: string;
  passiveAbility: {
    title: string;
    description: string;
  };
  stats: {
    precision: number;
    nerve: number;
    velocity: number;
    arcane: number;
  };
  iconColor: string;
}

const ARCHETYPES: Archetype[] = [
  {
    id: "gunslinger",
    name: "The Gunslinger",
    role: "Precision & Quickdraw Specialist",
    badge: "PRECISION CLASS",
    badgeColor: "bg-blue-500/20 text-cyan-400 border-blue-500/40",
    description:
      "A seasoned veteran of the dusty frontier. Possesses lightning reflexes and unshakeable chamber discipline under extreme pressure.",
    passiveAbility: {
      title: "Quickdraw Reflex",
      description:
        "When firing a blank at yourself, there is a 25% chance to immediately retain priority for an extra turn.",
    },
    stats: {
      precision: 95,
      nerve: 82,
      velocity: 90,
      arcane: 45,
    },
    iconColor: "text-cyan-400",
  },
  {
    id: "occultist",
    name: "The Occultist",
    role: "Dark Arcana & Chamber Divination",
    badge: "MYSTIC CLASS",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    description:
      "A mystic scholar who weaves forbidden tarot sigils into the revolver cylinder. Bends probability and sees through veiled cartridges.",
    passiveAbility: {
      title: "Tarot Divination",
      description:
        "Starts each duel with +1 extra Tarot Relic card in hand and gains +15% relic effect potency.",
    },
    stats: {
      precision: 65,
      nerve: 88,
      velocity: 70,
      arcane: 98,
    },
    iconColor: "text-purple-400",
  },
  {
    id: "phantom",
    name: "The Phantom Outlaw",
    role: "Stealth Rogue & Mind Games",
    badge: "ROGUE CLASS",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    description:
      "A shadowy trickster who thrives in psychological deception. Known for swapping chamber positions right under the opponent's nose.",
    passiveAbility: {
      title: "Chamber Camouflage",
      description:
        "Blinds rival relics that inspect or reveal the current chamber status for 1 full round.",
    },
    stats: {
      precision: 78,
      nerve: 96,
      velocity: 86,
      arcane: 72,
    },
    iconColor: "text-emerald-400",
  },
  {
    id: "high-roller",
    name: "The High Roller",
    role: "Fortune Seeker & Multiplier Master",
    badge: "CHAMPION CLASS",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    description:
      "An audacious aristocrat who wagers everything on a single turn. Converts extreme nerve into exponential treasury bounty multipliers.",
    passiveAbility: {
      title: "Treasury Surge",
      description:
        "Winning a duel at 1 HP remaining awards a +12% bonus to seasonal competitive championship prize points.",
    },
    stats: {
      precision: 70,
      nerve: 92,
      velocity: 75,
      arcane: 60,
    },
    iconColor: "text-amber-400",
  },
];

export function AxieDuelistsSection() {
  const [selectedId, setSelectedId] = useState<string>("gunslinger");
  const current = ARCHETYPES.find((a) => a.id === selectedId) || ARCHETYPES[0];

  return (
    <section id="duelists" className="py-24 relative overflow-hidden bg-[#070b1e]/60 border-y border-[#172554]">
      {/* Background Accent Spotlights */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="axie-badge mb-3">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Duelist Archetypes</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            Meet the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
              Duelists
            </span>
          </h2>
          <p className="font-sans text-slate-400 max-w-2xl text-base sm:text-lg">
            Choose your fighter class. Each archetype possesses unique passive abilities, combat stats, and distinct tactical advantages.
          </p>
        </div>

        {/* Archetype Selector Tabs (Axie Style) */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {ARCHETYPES.map((arch) => {
            const isSelected = selectedId === arch.id;
            return (
              <button
                key={arch.id}
                onClick={() => setSelectedId(arch.id)}
                className={`px-5 py-3 rounded-2xl font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 ${
                  isSelected
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_6px_0_#003566,0_10px_20px_rgba(0,180,216,0.4)] translate-y-[-2px]"
                    : "bg-[#0f1738] border border-[#1e2d63] text-slate-300 hover:bg-[#162252] hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : "bg-cyan-400"}`} />
                <span>{arch.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Archetype Feature Card */}
        <div className="axie-card p-6 sm:p-10 border-2 border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Archetype Profile & 3D Visual Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[340px] aspect-[4/5] rounded-3xl bg-gradient-to-b from-[#142354] via-[#0b1434] to-[#060a1d] border-2 border-cyan-400/40 p-6 flex flex-col items-center justify-between shadow-[0_0_40px_rgba(0,180,216,0.25)] overflow-hidden">
                {/* Ambient Radial Core */}
                <div className="absolute inset-0 bg-radial from-cyan-500/20 via-transparent to-transparent pointer-events-none" />

                {/* Top Badge */}
                <div className="w-full flex items-center justify-between text-xs font-mono">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${current.badgeColor}`}>
                    {current.badge}
                  </span>
                  <span className="text-amber-400 font-bold">TIER 1 DECK</span>
                </div>

                {/* Central Emblem Silhouette */}
                <div className="relative my-auto flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-[#0a1128] border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.4)] animate-pulse-slow">
                    <Target className={`w-16 h-16 ${current.iconColor}`} />
                  </div>
                  <span className="mt-4 font-display text-xl font-black uppercase text-white tracking-wider">
                    {current.name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {current.role}
                  </span>
                </div>

                {/* Bottom Stats Summary */}
                <div className="w-full grid grid-cols-2 gap-2 text-center text-[10px] font-mono bg-[#090f26]/80 p-2.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-slate-400">PRECISION: </span>
                    <span className="text-cyan-400 font-bold">{current.stats.precision}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400">NERVE: </span>
                    <span className="text-amber-400 font-bold">{current.stats.nerve}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detailed Lore, Passive Trait & Stat Bars */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="mb-6">
                <span className="text-xs font-mono uppercase tracking-widest text-[#38bdf8] font-bold">
                  Archetype Dossier
                </span>
                <h3 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight mt-1 mb-3">
                  {current.name}
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {current.description}
                </p>
              </div>

              {/* Passive Ability Box */}
              <div className="p-5 rounded-2xl bg-[#0c1638] border border-cyan-500/30 mb-8 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Signature Passive Trait: {current.passiveAbility.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  {current.passiveAbility.description}
                </p>
              </div>

              {/* Animated Combat Stat Bars */}
              <div className="space-y-4 mb-8">
                <div>
                  <div className="flex justify-between text-xs font-mono font-bold text-slate-300 mb-1">
                    <span>CHAMBER PRECISION</span>
                    <span className="text-cyan-400">{current.stats.precision} / 100</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#0d1636] overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${current.stats.precision}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono font-bold text-slate-300 mb-1">
                    <span>STEEL NERVE</span>
                    <span className="text-amber-400">{current.stats.nerve} / 100</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#0d1636] overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${current.stats.nerve}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono font-bold text-slate-300 mb-1">
                    <span>QUICKDRAW VELOCITY</span>
                    <span className="text-emerald-400">{current.stats.velocity} / 100</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#0d1636] overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${current.stats.velocity}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono font-bold text-slate-300 mb-1">
                    <span>ARCANE WILLPOWER</span>
                    <span className="text-purple-400">{current.stats.arcane} / 100</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#0d1636] overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${current.stats.arcane}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Equipping CTA */}
              <div className="flex items-center gap-4">
                <Link
                  href="/play"
                  className="btn-axie-orange px-8 py-3 text-xs sm:text-sm flex items-center gap-2"
                >
                  <Swords className="w-4 h-4" />
                  <span>Equip {current.name} in Arena</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
