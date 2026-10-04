"use client";

import React, { useState } from "react";
import { GildedButton } from "@/components/ui/GildedButton";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";

interface CharacterDurabilityCardProps {
  durabilityRemaining: number;
  durabilityMax: number;
  characterPriceSol?: number;
  onPurchase: (snsDomain: string) => Promise<unknown>;
  busy: boolean;
}

export function CharacterDurabilityCard({
  durabilityRemaining,
  durabilityMax = 10,
  characterPriceSol = 0.1,
  onPurchase,
  busy,
}: CharacterDurabilityCardProps) {
  const [snsInput, setSnsInput] = useState("");

  const isExhausted = durabilityRemaining <= 0;

  const handleBuy = async () => {
    const domain = snsInput.trim() || "duelist.sol";
    await onPurchase(domain);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070605]/90 backdrop-blur-md">
      <div className="w-full max-w-md rounded-sm border border-[#c6a15b]/40 bg-gradient-to-b from-[#18110b] to-[#0c0906] p-8 shadow-[0_0_40px_rgba(0,0,0,0.9)] relative">
        <div className="text-center mb-6">
          <ParchmentSeal label="Metaplex Core NFT" sublabel="Karakter & Dayanıklılık" variant="gold" />
          <h2 className="font-['Cinzel_Decorative',serif] text-2xl font-bold tracking-tight text-[#f5ecd8] mt-3">
            {isExhausted ? "DÜELLOCUNUN MÜHLETİ DOLDU" : "YENİ DÜELLOCU KUŞAN"}
          </h2>
          <p className="font-['Cinzel',serif] text-xs text-[#a68e72] mt-2">
            {isExhausted
              ? "Karakterinizin 10 dayanıklılığı tükendi. Masaya yeniden oturmak için bir sonraki düellocuyu kuşanmalısınız."
              : "Masada geçerli 10 dayanıklılık hakkına sahip Metaplex Core karakterinizi edinin."}
          </p>
        </div>

        {/* Durability Tracker Bar */}
        <div className="p-4 rounded-sm bg-[#120d09] border border-[#3b2b1d] mb-6">
          <div className="flex items-center justify-between text-xs font-['Cinzel',serif] mb-2">
            <span className="text-[#a68e72]">Kalan Dayanıklılık</span>
            <span
              className={`font-['Space_Mono',monospace] font-bold ${
                durabilityRemaining > 2 ? "text-[#52c41a]" : "text-[#ff4d4f]"
              }`}
            >
              {durabilityRemaining} / {durabilityMax} Maç
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#261c14] overflow-hidden">
            <div
              style={{ width: `${(durabilityRemaining / durabilityMax) * 100}%` }}
              className={`h-full transition-all duration-300 ${
                durabilityRemaining > 2 ? "bg-[#52c41a]" : "bg-[#ff4d4f]"
              }`}
            />
          </div>
        </div>

        {/* SNS Input */}
        <div className="mb-6">
          <label className="block text-xs font-['Cinzel',serif] text-[#a68e72] uppercase tracking-wider mb-2">
            Doğrulanacak .sol Kimliği (Opsiyonel)
          </label>
          <input
            type="text"
            placeholder="örnek: satoshi.sol"
            value={snsInput}
            onChange={(e) => setSnsInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-sm bg-[#120d09] border border-[#3b2b1d] text-sm font-['Space_Mono',monospace] text-[#f5ecd8] focus:border-[#c6a15b] focus:outline-none"
          />
        </div>

        {/* 90 / 5 / 5 Split Reminder */}
        <div className="p-3 rounded-sm bg-[#0d1c12] border border-[#2e5e3a]/60 text-[11px] font-['Space_Mono',monospace] text-[#a3bfa9] mb-6">
          <span>🏛️ Ücretin %90'ı doğrudan Kazanan Hazine Kasası'na aktarılır. (%5 Sigorta, %5 Ekip)</span>
        </div>

        {/* Purchase CTA */}
        <GildedButton onClick={handleBuy} variant="gold" size="lg" className="w-full" disabled={busy}>
          {busy ? "Kuşanılıyor..." : `Düellocuyu Satın Al (${characterPriceSol} SOL)`}
        </GildedButton>
      </div>
    </div>
  );
}
