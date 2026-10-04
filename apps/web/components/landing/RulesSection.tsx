"use client";

import React from "react";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";
import { Sparkles, Crosshair, Trophy } from "lucide-react";

export function RulesSection() {
  const steps = [
    {
      num: "01",
      title: "Take a Seat & Equip Duelist",
      desc: "Equip a Metaplex Core standard duelist NFT. Each duelist holds 10 durability charges. Sitting at a table consumes exactly 1 durability charge.",
      icon: Sparkles,
      badge: "Metaplex Core",
    },
    {
      num: "02",
      title: "Pull Trigger or Cast Tarot",
      desc: "The cylinder is loaded with live copper and blank cartridges. Shoot yourself: if it clicks blank, you retain your turn! If it's live, you lose 1 candle HP. Play tarot spells to X-ray the chamber or steal cards.",
      icon: Crosshair,
      badge: "Commit-Reveal RNG",
    },
    {
      num: "03",
      title: "Claim Vault & Walk Away",
      desc: "The first duelist whose candles extinguish loses the match. The victor claims the accumulated prize from the Solana GameVault PDA (+80% net return) directly to their wallet.",
      icon: Trophy,
      badge: "90% SOL Pool",
    },
  ];

  return (
    <section id="rules" className="py-20 md:py-28 border-b border-[#2b2016] bg-[#090705] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ParchmentSeal label="Table Rules" sublabel="How It Works" variant="gold" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f5ecd8] mt-4 mb-4">
            LAWS OF THE OCCULT CASINO
          </h2>
          <p className="font-serif italic text-base sm:text-lg text-[#b8a68f] leading-relaxed">
            Three simple phases, where every pull of the trigger demands ice-cold nerve, calculated bluffing, and on-chain probability mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[#c6a15b]/30 to-transparent -translate-y-8 pointer-events-none" />

          {steps.map((s, idx) => {
            const IconComponent = s.icon;
            return (
              <div
                key={idx}
                className="relative rounded-sm border border-[#3b2b1d] bg-gradient-to-b from-[#140e0a] to-[#0a0705] p-8 shadow-[0_0_20px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-[#c6a15b] transition-all duration-300"
              >
                {/* Corner brackets */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#c6a15b] opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#c6a15b] opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#c6a15b] opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#c6a15b] opacity-60 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-display text-3xl font-bold text-[#c6a15b]/40 group-hover:text-[#c6a15b] transition-colors">
                      {s.num}
                    </span>
                    <div className="w-10 h-10 rounded-full border border-[#3b2b1d] bg-[#140e0a] flex items-center justify-center text-[#c6a15b] group-hover:border-[#c6a15b] transition-colors">
                      <IconComponent className="w-5 h-5 text-[#c6a15b]" />
                    </div>
                  </div>

                  <h3 className="font-sans text-lg font-bold text-[#f5ecd8] mb-3 group-hover:text-[#ffdca8] transition-colors">
                    {s.title}
                  </h3>

                  <p className="font-serif text-sm text-[#a68e72] leading-relaxed mb-6">
                    {s.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#261c14] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#52c41a]">
                    ● On-Chain Enforced
                  </span>
                  <span className="text-[11px] font-mono text-[#c6a15b]">
                    {s.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
