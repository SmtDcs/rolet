"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Sparkles,
  ExternalLink,
  Tag,
  Coins,
  Shield,
  Layers,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

interface MarketplaceItem {
  id: string;
  name: string;
  category: string;
  rarity: "MYTHIC" | "LEGENDARY" | "EPIC" | "RARE";
  rarityColor: string;
  priceSol: number;
  lastSaleSol?: number;
  perk: string;
  owner: string;
}

const FEATURED_ITEMS: MarketplaceItem[] = [
  {
    id: "relic-01",
    name: "Obsidian Peacemaker #007",
    category: "Mythic Revolver Skin",
    rarity: "MYTHIC",
    rarityColor: "bg-red-500/20 text-red-400 border-red-500/40",
    priceSol: 8.5,
    lastSaleSol: 7.8,
    perk: "Dark blued damascus steel with gold occult runes & custom firing sound.",
    owner: "7xK...9Qm2",
  },
  {
    id: "relic-02",
    name: "The Wheel of Fortune",
    category: "Tactical Tarot Relic",
    rarity: "LEGENDARY",
    rarityColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    priceSol: 3.2,
    lastSaleSol: 2.9,
    perk: "Reveals next cartridge state with 100% accuracy once per match.",
    owner: "4pL...8Vx1",
  },
  {
    id: "relic-03",
    name: "Cursed Silver Cylinder",
    category: "Revolver Chamber Mod",
    rarity: "EPIC",
    rarityColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    priceSol: 1.8,
    lastSaleSol: 1.6,
    perk: "Inflicts -1 nerve on opponent when chamber 8 is fired as a blank.",
    owner: "9eR...2Aa5",
  },
  {
    id: "relic-04",
    name: "Occult Duelist Coat",
    category: "Duelist Cosmetic Attire",
    rarity: "RARE",
    rarityColor: "bg-blue-500/20 text-cyan-400 border-blue-500/40",
    priceSol: 0.95,
    lastSaleSol: 0.88,
    perk: "Custom diegetic 3D avatar cloak visible to rivals across the table.",
    owner: "3tY...6Zp9",
  },
];

export function AxieMarketplaceSection() {
  return (
    <section id="marketplace" className="py-24 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header (Axie Marketplace Style) */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="axie-badge mb-3">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>App.Rolet Marketplace</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            Community-Owned{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500">
              Economy
            </span>
          </h2>
          <p className="font-sans text-slate-400 max-w-2xl text-base sm:text-lg">
            Duelists hold genuine digital ownership of weapons, relics, and cosmetic items. Trade freely on Solana with instant finality.
          </p>
        </div>

        {/* 4 Marketplace Stat Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-4 rounded-2xl bg-[#0b132e]/80 border border-[#1b2b62] text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase">24H Trading Volume</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">1,420 SOL</div>
            <span className="text-[10px] text-emerald-400 font-bold">+18.4% today</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b132e]/80 border border-[#1b2b62] text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Total Listed Assets</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">3,850+</div>
            <span className="text-[10px] text-cyan-400 font-bold">100% on-chain</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b132e]/80 border border-[#1b2b62] text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Floor Price</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">0.45 SOL</div>
            <span className="text-[10px] text-slate-400 font-mono">~$68 USD</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b132e]/80 border border-[#1b2b62] text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Highest Sale</span>
            <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mt-1">
              42.0 SOL
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Obsidian #001</span>
          </div>
        </div>

        {/* 4 Featured Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {FEATURED_ITEMS.map((item) => (
            <div
              key={item.id}
              className="axie-card p-5 flex flex-col justify-between group hover:border-amber-400/50"
            >
              {/* Top Details & Rarity */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${item.rarityColor}`}
                  >
                    {item.rarity}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.owner}
                  </span>
                </div>

                {/* Item Thumbnail Frame */}
                <div className="relative w-full aspect-square rounded-2xl bg-[#0a1029] border border-[#1d2a58] flex flex-col items-center justify-center p-4 mb-4 overflow-hidden group-hover:border-amber-400/40 transition-colors">
                  <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                  <div className="w-20 h-20 rounded-2xl bg-[#111c42] border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-10 h-10 text-amber-400" />
                  </div>
                  <span className="mt-3 text-[11px] font-mono font-bold text-slate-300">
                    {item.category}
                  </span>
                </div>

                {/* Title & Perk */}
                <h4 className="font-display text-base font-black uppercase text-white group-hover:text-amber-300 transition-colors">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 mb-4 leading-relaxed font-medium">
                  {item.perk}
                </p>
              </div>

              {/* Price & Action */}
              <div className="pt-3 border-t border-[#1a2652] flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Price</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {item.priceSol} SOL
                  </span>
                </div>
                <Link
                  href="/play"
                  className="btn-axie-glass text-[11px] px-3.5 py-1.5 flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ArrowUpRight className="w-3 h-3 text-[#38bdf8]" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Axie CTA: View All on Marketplace */}
        <div className="flex justify-center">
          <a
            href="https://github.com/SmtDcs/rolet"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-axie-blue px-8 py-3.5 text-xs sm:text-sm flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore App.Rolet Marketplace (3,800+ Items)</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
