"use client";

import React, { useState } from "react";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";
import {
  Eye,
  Wrench,
  Shield,
  Zap,
  Heart,
  RotateCcw,
  Shuffle,
  Hand,
  VolumeX,
  Compass,
  Hourglass,
  Crown,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type CardCategory = "all" | "intel" | "offense" | "defense" | "trickery";

interface CardDef {
  id: string;
  name: string;
  category: "intel" | "offense" | "defense" | "trickery";
  categoryLabel: string;
  icon: LucideIcon;
  effect: string;
  lore: string;
  tip: string;
}

const CARDS: CardDef[] = [
  {
    id: "hawkEye",
    name: "HawkEye",
    category: "intel",
    categoryLabel: "Intel",
    icon: Eye,
    effect: "Reveals the next cylinder chamber (Live or Blank).",
    lore: "Peer into the chamber's depths; decipher the bullet's destiny before the hammer falls.",
    tip: "If it's a blank, shoot yourself immediately to keep your turn!",
  },
  {
    id: "bulletExtractor",
    name: "BulletExtractor",
    category: "trickery",
    categoryLabel: "Trickery",
    icon: Wrench,
    effect: "Ejects the current chamber's cartridge without firing.",
    lore: "Pliers bite the brass rim; the shell flies, delaying fatal retribution.",
    tip: "Disrupt an opponent's double-damage combo by discarding their live round.",
  },
  {
    id: "blocker",
    name: "Blocker",
    category: "defense",
    categoryLabel: "Defense",
    icon: Shield,
    effect: "Negates all incoming damage from the next live round.",
    lore: "An occult steel plate beneath the vest, warding off death by inches.",
    tip: "Play when the opponent aims down your throat to nullify their shot.",
  },
  {
    id: "doubleStrike",
    name: "DoubleStrike",
    category: "offense",
    categoryLabel: "Offense",
    icon: Zap,
    effect: "Doubles the damage of the next live bullet from 1 to 2 HP.",
    lore: "Double grain gunpowder, double spark. No second chances at this table.",
    tip: "Confirm a live round with HawkEye, then cast DoubleStrike for a fatal 2-HP blast.",
  },
  {
    id: "healer",
    name: "Healer",
    category: "defense",
    categoryLabel: "Defense",
    icon: Heart,
    effect: "Restores +1 candle HP (up to maximum starting HP of 4).",
    lore: "Dark ceremonial wine and iodine, steadying trembling hands for one more round.",
    tip: "Use when down to 1 or 2 HP to stay alive through bad odds.",
  },
  {
    id: "restoreBullet",
    name: "RestoreBullet",
    category: "trickery",
    categoryLabel: "Trickery",
    icon: RotateCcw,
    effect: "Re-loads a spent empty chamber with a fresh LIVE cartridge.",
    lore: "A fresh copper round pushed into the void; the cylinder whispers doom once more.",
    tip: "Increases the live ratio when the cylinder runs dry.",
  },
  {
    id: "shuffler",
    name: "Shuffler",
    category: "trickery",
    categoryLabel: "Trickery",
    icon: Shuffle,
    effect: "Reshuffles all remaining unspent chambers in the cylinder.",
    lore: "A violent cylinder spin locks shut, wrecking every count and calculation.",
    tip: "Play if the opponent counted cards or scouted the upcoming round.",
  },
  {
    id: "cardThief",
    name: "CardThief",
    category: "trickery",
    categoryLabel: "Trickery",
    icon: Hand,
    effect: "Steals the first available card from the opponent's hand.",
    lore: "Eyes glued to the barrel while nimble fingers clean out their vest pockets.",
    tip: "Snatch their DoubleStrike or Healer right before they execute.",
  },
  {
    id: "silence",
    name: "Silence",
    category: "offense",
    categoryLabel: "Offense",
    icon: VolumeX,
    effect: "Silences the opponent, preventing them from playing cards on their next turn.",
    lore: "Cold dread grips the throat; incantations wither to silent gasps.",
    tip: "Paralyze an opponent holding lethal cards while you line up the kill shot.",
  },
  {
    id: "randomInsight",
    name: "RandomInsight",
    category: "intel",
    categoryLabel: "Intel",
    icon: Compass,
    effect: "Reveals one random live bullet's exact index in the cylinder.",
    lore: "Whispers of the deceased duelists echo from the brass engravings.",
    tip: "Gives vital foresight to calculate odds across multi-turn exchanges.",
  },
  {
    id: "lastChance",
    name: "LastChance",
    category: "defense",
    categoryLabel: "Defense",
    icon: Hourglass,
    effect: "If a lethal shot strikes you, survive with exactly 1 HP (one-time ward).",
    lore: "A silver coin deflected the lead; fate grants one final breath.",
    tip: "Your emergency clutch insurance when facing fatal 2-damage rounds.",
  },
  {
    id: "handOfFate",
    name: "HandOfFate",
    category: "trickery",
    categoryLabel: "Trickery",
    icon: Crown,
    effect: "Discards your entire hand and draws fresh occult cards.",
    lore: "Tear up the pact; demand an audience with the elder dealer.",
    tip: "Recycles defensive cards when you urgently need offensive spells.",
  },
];

export function GrimoireSection() {
  const [selectedCategory, setSelectedCategory] = useState<CardCategory>("all");
  const [activeCard, setActiveCard] = useState<CardDef>(CARDS[0]);

  const filteredCards =
    selectedCategory === "all"
      ? CARDS
      : CARDS.filter((c) => c.category === selectedCategory);

  const categories: { id: CardCategory; label: string }[] = [
    { id: "all", label: "All Spells (12)" },
    { id: "intel", label: "Intel" },
    { id: "offense", label: "Offense" },
    { id: "defense", label: "Defense" },
    { id: "trickery", label: "Trickery" },
  ];

  return (
    <section id="grimoire" className="py-20 md:py-28 border-b border-[#2b2016] bg-[#070605] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <ParchmentSeal label="Tactical Grimoire" sublabel="Occult Arcana" variant="gold" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f5ecd8] mt-4 mb-4">
            TWELVE SACRED TAROT CARDS
          </h2>
          <p className="font-serif italic text-base sm:text-lg text-[#b8a68f] leading-relaxed">
            Pure randomness kills fools. The master duelist bends probability on-chain with twelve tactical cards drawn from the occult deck.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-sm font-sans text-xs uppercase tracking-wider transition-all duration-200 border ${
                selectedCategory === cat.id
                  ? "bg-[#241a12] text-[#e5c378] border-[#c6a15b] shadow-[0_0_12px_rgba(198,161,91,0.3)]"
                  : "bg-[#0f0c09] text-[#a68e72] border-[#2b2016] hover:border-[#4a3726] hover:text-[#e6d7c3]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 12 Card Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredCards.map((card) => {
              const isSelected = activeCard.id === card.id;
              const IconComp = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => setActiveCard(card)}
                  className={`cursor-pointer rounded-sm border p-4 flex flex-col items-center text-center transition-all duration-300 relative group overflow-hidden ${
                    isSelected
                      ? "bg-gradient-to-b from-[#241a12] to-[#120d09] border-[#c6a15b] shadow-[0_0_20px_rgba(198,161,91,0.25)] -translate-y-1"
                      : "bg-gradient-to-b from-[#120d09] to-[#0a0705] border-[#2b2016] hover:border-[#5a422e] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full border border-[#3b2b1d] bg-[#1a140f] flex items-center justify-center text-[#c6a15b] mb-3 group-hover:border-[#c6a15b] transition-colors">
                    <IconComp className="w-5 h-5 text-[#c6a15b]" />
                  </div>

                  <span className="font-sans text-xs font-bold text-[#f5ecd8] mb-1 group-hover:text-[#ffdca8]">
                    {card.name}
                  </span>

                  <span className="text-[10px] font-mono text-[#a68e72] uppercase tracking-wider">
                    {card.categoryLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right: Card Detail Showcase Panel */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="rounded-sm border border-[#c6a15b]/60 bg-gradient-to-b from-[#1c140e] to-[#0c0906] p-6 shadow-[0_0_30px_rgba(0,0,0,0.85)] relative">
              {/* Corner brass details */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#c6a15b]" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#c6a15b]" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#c6a15b]" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#c6a15b]" />

              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#2b2016]">
                <div className="w-14 h-14 rounded-full border border-[#c6a15b] bg-[#241a12] flex items-center justify-center shadow-[0_0_15px_rgba(198,161,91,0.35)]">
                  {React.createElement(activeCard.icon as React.ComponentType<{ className?: string }>, { className: "w-7 h-7 text-[#e5c378]" })}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#f5ecd8]">
                    {activeCard.name}
                  </h3>
                  <span className="text-xs font-mono text-[#c6a15b] uppercase tracking-wider">
                    Category: {activeCard.categoryLabel}
                  </span>
                </div>
              </div>

              {/* Effect */}
              <div className="mb-4">
                <span className="text-[11px] font-sans uppercase tracking-widest text-[#a68e72] block mb-1">
                  On-Chain Effect
                </span>
                <p className="font-sans text-sm font-semibold text-[#f5ecd8] leading-snug">
                  {activeCard.effect}
                </p>
              </div>

              {/* Lore */}
              <div className="mb-4 p-3 rounded-sm bg-[#120d09] border border-[#2b2016]">
                <span className="text-[10px] font-serif uppercase tracking-widest text-[#c6a15b] block mb-1">
                  Grimoire Inscription
                </span>
                <p className="font-serif italic text-xs text-[#b8a68f] leading-relaxed">
                  "{activeCard.lore}"
                </p>
              </div>

              {/* Tactical Tip */}
              <div className="p-3 rounded-sm bg-[#140b08] border border-[#4a1c12]">
                <span className="text-[10px] font-sans uppercase tracking-widest text-[#ff8f8f] block mb-1">
                  Tactical Insight
                </span>
                <p className="font-sans text-xs text-[#f0d0cb] leading-relaxed">
                  {activeCard.tip}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
