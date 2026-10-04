"use client";

import React from "react";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";

export function RulesSection() {
  const steps = [
    {
      num: "01",
      title: "Masaya Otur & Düellocunu Seç",
      desc: "Metaplex Core NFT standardında bir düellocu kuşan. Her düellocu 10 dayanıklılık (durability) taşır. Her maça giriş yalnızca 1 dayanıklılık tüketir.",
      icon: "🎴",
      badge: "Metaplex Core",
    },
    {
      num: "02",
      title: "Tetiği Çek veya Kart Oyna",
      desc: "Revolverde 5 canlı ve 3 kuru mermi bulunur. Tetiği kendine çekip kuru mermi çıkarsa sıranı korursun! Canlı mermi çıkarsa 1 can kaybedersin. 12 taktiksel kartla sıradaki mermiyi röntgenle veya rakibin kartını çal.",
      icon: "🎯",
      badge: "Commit-Reveal RNG",
    },
    {
      num: "03",
      title: "Kasayı Al ve Masadan Kalk",
      desc: "4 canı ilk biten oyuncu masada kalır. Kazanan oyuncu, toplanan giriş ücretlerinin %90'ının biriktiği Solana Hazine Kasası'ndan (GameVault PDA) SOL ödülünü anında cüzdanına çeker.",
      icon: "🏆",
      badge: "%90 SOL Ödülü",
    },
  ];

  return (
    <section id="rules" className="py-20 md:py-28 border-b border-[#2b2016] bg-[#090705] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ParchmentSeal label="Oyun Kuralları" sublabel="Nasıl Oynanır?" variant="gold" />
          <h2 className="font-['Cinzel_Decorative',serif] text-3xl sm:text-4xl font-bold tracking-tight text-[#f5ecd8] mt-4 mb-4">
            MASANIN KANUNLARI
          </h2>
          <p className="font-['Cinzel',serif] text-sm sm:text-base text-[#b8a68f] leading-relaxed">
            Üç basit adımda başlayan, ancak her hamlesinde soğukkanlılık, blöf ve olasılık hesabı gerektiren on-chain düello döngüsü.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[#c6a15b]/30 to-transparent -translate-y-8 pointer-events-none" />

          {steps.map((s, idx) => (
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
                  <span className="font-['Cinzel_Decorative',serif] text-3xl font-bold text-[#c6a15b]/40 group-hover:text-[#c6a15b] transition-colors">
                    {s.num}
                  </span>
                  <span className="text-2xl">{s.icon}</span>
                </div>

                <h3 className="font-['Cinzel',serif] text-lg font-bold text-[#f5ecd8] mb-3 group-hover:text-[#ffdca8] transition-colors">
                  {s.title}
                </h3>

                <p className="font-['Cinzel',serif] text-xs sm:text-sm text-[#a68e72] leading-relaxed mb-6">
                  {s.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#261c14] flex items-center justify-between">
                <span className="text-[10px] font-['Space_Mono',monospace] text-[#52c41a]">
                  ● Zincir Üstü Kural
                </span>
                <span className="text-[11px] font-['Space_Mono',monospace] text-[#c6a15b]">
                  {s.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
