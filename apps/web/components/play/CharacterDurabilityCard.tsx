"use client";

import React, { useState } from "react";
import { GildedButton } from "@/components/ui/GildedButton";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";
import { ShieldAlert, ShieldCheck, Coins } from "lucide-react";

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
          <ParchmentSeal label="Metaplex Core NFT" sublabel="Character & Durability" variant="gold" />
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#f5ecd8] mt-3">
            {isExhausted ? "DUELIST DURABILITY EXHAUSTED" : "EQUIP NEW DUELIST"}
          </h2>
          <p className="font-serif text-xs text-[#a68e72] mt-2">
            {isExhausted
              ? "Your character's 10 durability charges have expired. Equip a fresh Metaplex Core duelist to challenge the table."
              : "Acquire your Metaplex Core character with 10 on-chain durability charges."}
          </p>
        </div>

        {/* Durability Tracker Bar */}
        <div className="p-4 rounded-sm bg-[#120d09] border border-[#3b2b1d] mb-6">
          <div className="flex items-center justify-between text-xs font-sans mb-2">
            <span className="text-[#a68e72]">Remaining Durability</span>
            <span
              className={`font-mono font-bold ${
                durabilityRemaining > 2 ? "text-[#52c41a]" : "text-[#ff4d4f]"
              }`}
            >
              {durabilityRemaining} / {durabilityMax} Matches
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
          <label className="block text-xs font-sans text-[#a68e72] uppercase tracking-wider mb-2">
            Verified .sol Domain (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. satoshi.sol"
            value={snsInput}
            onChange={(e) => setSnsInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-sm bg-[#120d09] border border-[#3b2b1d] text-sm font-mono text-[#f5ecd8] focus:border-[#c6a15b] focus:outline-none"
          />
        </div>

        {/* 90 / 5 / 5 Split Reminder */}
        <div className="flex items-start gap-2.5 p-3 rounded-sm bg-[#0d1c12] border border-[#2e5e3a]/60 text-[11px] font-mono text-[#a3bfa9] mb-6">
          <Coins className="w-4 h-4 text-[#73d13d] shrink-0 mt-0.5" />
          <span>90% of fees flow directly to the Winner Treasury Vault. (5% Insurance, 5% Ops)</span>
        </div>

        {/* Purchase CTA */}
        <GildedButton onClick={handleBuy} variant="gold" size="lg" className="w-full" disabled={busy}>
          {busy ? "Equipping..." : `Equip Duelist (${characterPriceSol} SOL)`}
        </GildedButton>
      </div>
    </div>
  );
}
