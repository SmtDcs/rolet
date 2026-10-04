"use client";

import React, { useState } from "react";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";

type CardCategory = "all" | "intel" | "offense" | "defense" | "trickery";

interface CardDef {
  id: string;
  name: string;
  category: "intel" | "offense" | "defense" | "trickery";
  categoryLabel: string;
  icon: string;
  effect: string;
  lore: string;
  tip: string;
}

const CARDS: CardDef[] = [
  {
    id: "hawkEye",
    name: "HawkEye",
    category: "intel",
    categoryLabel: "İstihbarat",
    icon: "👁️",
    effect: "Sıradaki hazneyi açığa çıkarır (Canlı mı, Kuru mu).",
    lore: "Gözlerini kısıp silindirin içine bakanlar, kurşunun kaderini önceden okur.",
    tip: "Kuru mermi görürsen tetiği hemen kendine çekip sıranı koru!",
  },
  {
    id: "bulletExtractor",
    name: "BulletExtractor",
    category: "trickery",
    categoryLabel: "Kurnazlık",
    icon: "⚙️",
    effect: "Haznedeki mermiyi ateşlemeden dışarı fırlatır.",
    lore: "Pirinç kerpeten kovanı yakalar; hazne boşalır, tehlike ertelenir.",
    tip: "Rakibin DoubleStrike bastığı bir canlı mermiyi fırlatıp oyununu boz.",
  },
  {
    id: "blocker",
    name: "Blocker",
    category: "defense",
    categoryLabel: "Savunma",
    icon: "🛡️",
    effect: "Bir sonraki mermiden gelecek tüm hasarı sıfırlar.",
    lore: "Yeleğin altındaki kurşungeçirmez çelik plaka hayat ile ölüm arasındaki tek engeldir.",
    tip: "Rakip tetiği sana doğrulttuğunda gelen canlı mermiyi boşa çıkar.",
  },
  {
    id: "doubleStrike",
    name: "DoubleStrike",
    category: "offense",
    categoryLabel: "Saldırı",
    icon: "⚡",
    effect: "Sıradaki canlı merminin hasarını 1'den 2'ye çıkarır.",
    lore: "İki kat barut, iki kat kıvılcım. Masada ikinci bir şans bırakmaz.",
    tip: "HawkEye ile canlı mermiyi teyit ettikten sonra oyna ve 2 can birden al!",
  },
  {
    id: "healer",
    name: "Healer",
    category: "defense",
    categoryLabel: "Savunma",
    icon: "🩸",
    effect: "+1 HP iyileşme sağlar (En fazla başlangıç canı olan 4 HP).",
    lore: "Koyu şarap ve tentürdiyot, titreyen elleri bir tur daha yatıştırır.",
    tip: "Canın 3 veya daha az olduğunda masada kalma süreni uzatır.",
  },
  {
    id: "restoreBullet",
    name: "RestoreBullet",
    category: "trickery",
    categoryLabel: "Kurnazlık",
    icon: "🔄",
    effect: "Ateşlenmiş boş bir hazneyi yeniden CANLI mermi ile doldurur.",
    lore: "Boşalan yuvaya yeni bir kurşun itilir; hazne yeniden ölüm fısıldar.",
    tip: "Mermiler azaldığında masadaki canlı mermi olasılığını yükselt.",
  },
  {
    id: "shuffler",
    name: "Shuffler",
    category: "trickery",
    categoryLabel: "Kurnazlık",
    icon: "🌪️",
    effect: "Kalan henüz ateşlenmemiş tüm hazneleri yeniden karıştırır.",
    lore: "Silindir hızla döndürülür ve kilitlenir; rakibin saydığı tüm kartlar çöpe gider.",
    tip: "Rakip hazneleri saydıysa veya sıradaki mermiyi öğrendiyse planını mahvet.",
  },
  {
    id: "cardThief",
    name: "CardThief",
    category: "trickery",
    categoryLabel: "Kurnazlık",
    icon: "🧤",
    effect: "Rakibin elindeki ilk kartı çalıp kendi boş slotuna koyar.",
    lore: "Masada gözleri mermideyken cepleri boşaltmak eski bir kumarbaz zanaatıdır.",
    tip: "Rakibin ölümcül kartını çalarak hem elini zayıflat hem kendine güç kat.",
  },
  {
    id: "randomInsight",
    name: "RandomInsight",
    category: "intel",
    categoryLabel: "İstihbarat",
    icon: "🔮",
    effect: "Henüz sıkılmamış rastgele bir haznenin mermisini gösterir.",
    lore: "Kader zarları masaya fırlatılır; kör nokta aydınlanır.",
    tip: "Oyunun sonlarına doğru haznedeki canlı/kuru dağılımını kesinleştir.",
  },
  {
    id: "lastChance",
    name: "LastChance",
    category: "defense",
    categoryLabel: "Savunma",
    icon: "⏳",
    effect: "Yalnızca 1 HP'deyken oynanabilir; rakibin turunu tamamen atlatır!",
    lore: "Ölümün eşiğindeki kumarbaza masanın bahşettiği son nefes.",
    tip: "Kritik anda sırayı tekrar kendine alarak maçı tersine çevir.",
  },
  {
    id: "handOfFate",
    name: "HandOfFate",
    category: "trickery",
    categoryLabel: "Kurnazlık",
    icon: "🎲",
    effect: "Sıradaki hazneyi yazı-tura atarak yeniden Canlı veya Kuru yapar.",
    lore: "Kader tanrıçası bozuk parayı havaya fırlatır; ölüm tersyüz olur.",
    tip: "Sıradaki merminin kesin Canlı olduğunu biliyorsan %50 şansla Kuru'ya çevir.",
  },
  {
    id: "silence",
    name: "Silence",
    category: "offense",
    categoryLabel: "Saldırı",
    icon: "🤐",
    effect: "Rakibin bir sonraki tur hiçbir kart oynamasını engeller.",
    lore: "Masaya düşen kurşun ağırlığı kelimeleri ve büyüleri boğazda düğümler.",
    tip: "Rakibin elinde güçlü savunma veya iyileşme kartları varken oyna.",
  },
];

export function GrimoireSection() {
  const [filter, setFilter] = useState<CardCategory>("all");
  const [selectedCard, setSelectedCard] = useState<CardDef>(CARDS[0]);

  const filteredCards = filter === "all" ? CARDS : CARDS.filter((c) => c.category === filter);

  return (
    <section id="grimoire" className="py-20 md:py-28 border-b border-[#2b2016] bg-[#070605] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <ParchmentSeal label="Taktiksel Kartlar" sublabel="Grimoire Koleksiyonu" variant="gold" />
          <h2 className="font-['Cinzel_Decorative',serif] text-3xl sm:text-4xl font-bold tracking-tight text-[#f5ecd8] mt-4 mb-4">
            ON İKİ KUTSAL KART
          </h2>
          <p className="font-['Cinzel',serif] text-sm sm:text-base text-[#b8a68f] leading-relaxed">
            Rolet sadece tetiğe basmaktan ibaret değildir. Elinize dağıtılan 4 taktiksel kartla olasılıkları 
            hesaplayın, rakibin aklını okuyun ve kaderi kendi lehinize bükün.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 font-['Cinzel',serif] text-xs uppercase tracking-wider">
            {(
              [
                ["all", "Tüm Kartlar (12)"],
                ["intel", "İstihbarat"],
                ["offense", "Saldırı"],
                ["defense", "Savunma"],
                ["trickery", "Kurnazlık"],
              ] as const
            ).map(([cat, label]) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-sm border transition-all ${
                  filter === cat
                    ? "bg-[#c6a15b] text-[#120e0a] border-[#e5c378] font-bold shadow-[0_0_12px_rgba(198,161,91,0.5)]"
                    : "bg-[#140e0a] text-[#8c7760] border-[#36271c] hover:text-[#d6c3ad] hover:border-[#634934]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid & Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Showcase Detail Panel (Left) */}
          <div className="lg:col-span-5 rounded-sm border border-[#c6a15b]/40 bg-gradient-to-b from-[#18110b] to-[#0c0906] p-8 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative">
            <div className="absolute top-2 right-2 text-xs font-['Space_Mono',monospace] text-[#c6a15b]">
              KOD: {selectedCard.id}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-sm border border-[#c6a15b] bg-[#21160e] flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(198,161,91,0.3)]">
                {selectedCard.icon}
              </div>
              <div>
                <span className="text-[10px] font-['Space_Mono',monospace] uppercase text-[#52c41a] tracking-wider">
                  ● {selectedCard.categoryLabel}
                </span>
                <h3 className="font-['Cinzel_Decorative',serif] text-2xl font-bold text-[#f5ecd8]">
                  {selectedCard.name}
                </h3>
              </div>
            </div>

            <div className="mb-6 pb-6 border-b border-[#2b2016]">
              <span className="text-xs font-['Cinzel',serif] uppercase tracking-wider text-[#a68e72]">
                Zincir Üstü Etki:
              </span>
              <p className="font-['Cinzel',serif] text-base text-[#e5c378] mt-1 font-semibold leading-relaxed">
                {selectedCard.effect}
              </p>
            </div>

            <div className="mb-6 pb-6 border-b border-[#2b2016]">
              <span className="text-xs font-['Cinzel',serif] uppercase tracking-wider text-[#a68e72]">
                Kumarhane Rivayeti:
              </span>
              <p className="font-['Cinzel',serif] text-xs text-[#a68e72] italic mt-1 leading-relaxed">
                "{selectedCard.lore}"
              </p>
            </div>

            <div>
              <span className="text-xs font-['Cinzel',serif] uppercase tracking-wider text-[#52c41a]">
                💡 Taktiksel Hamle Tavsiyesi:
              </span>
              <p className="font-['Space_Mono',monospace] text-xs text-[#d6c4ad] mt-1 bg-[#140e0a] p-3 rounded-sm border border-[#3b2b1d]">
                {selectedCard.tip}
              </p>
            </div>
          </div>

          {/* Cards Rack / List (Right) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const isSelected = selectedCard.id === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`text-left p-4 rounded-sm border transition-all duration-200 relative group overflow-hidden ${
                    isSelected
                      ? "bg-[#21160d] border-[#c6a15b] shadow-[0_0_20px_rgba(198,161,91,0.35)] scale-[1.02]"
                      : "bg-[#110c08] border-[#312317] hover:border-[#6e5339] hover:bg-[#17100b]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{card.icon}</span>
                    <span className="text-[9px] font-['Space_Mono',monospace] uppercase text-[#8c745c]">
                      {card.categoryLabel}
                    </span>
                  </div>

                  <h4 className="font-['Cinzel',serif] text-sm font-bold text-[#f5ecd8] group-hover:text-[#ffdca8] transition-colors mb-1">
                    {card.name}
                  </h4>

                  <p className="font-['Cinzel',serif] text-[11px] text-[#9c8770] line-clamp-2 leading-snug">
                    {card.effect}
                  </p>

                  {/* Active gold corner tag */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#c6a15b]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
