"use client";

import React from "react";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";
import { ShieldCheck, Lock, Coins, ArrowRight, CheckCircle2 } from "lucide-react";

export function EconomySection() {
  return (
    <section id="economy" className="py-20 md:py-28 border-b border-[#2b2016] bg-[#090705] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ParchmentSeal label="Sustainable Economics" sublabel="90 / 5 / 5 Model" variant="gold" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f5ecd8] mt-4 mb-4">
            VAULT MATHEMATICS & TRANSPARENCY
          </h2>
          <p className="font-serif italic text-base sm:text-lg text-[#b8a68f] leading-relaxed">
            No inflationary fake tokens. Every lamport circulates directly in native SOL on Solana Devnet. 
            Protocol revenue is mathematically structured to maximize rewards for winning duelists.
          </p>
        </div>

        {/* 90 / 5 / 5 Split Visual Bar & Cards */}
        <div className="rounded-sm border border-[#3b2b1d] bg-gradient-to-b from-[#140e0a] to-[#0a0705] p-8 md:p-10 mb-12 shadow-[0_0_30px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <span className="font-sans text-sm uppercase tracking-widest text-[#f5ecd8] font-bold">
              Entry Fees & Character Revenue Distribution
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#52c41a]">
              <ShieldCheck className="w-4 h-4 text-[#52c41a]" />
              <span>Smart Contract Verified</span>
            </div>
          </div>

          {/* Visual Percentage Bar */}
          <div className="w-full h-8 rounded-sm overflow-hidden flex border border-[#4d3827] mb-8 shadow-inner">
            <div
              style={{ width: "90%" }}
              className="bg-gradient-to-r from-[#2a683e] to-[#389e58] flex items-center justify-center text-xs font-bold text-white font-mono tracking-wider"
              title="90% Winner Treasury Pool"
            >
              90% Winner Treasury (Reward Pool)
            </div>
            <div
              style={{ width: "5%" }}
              className="bg-gradient-to-r from-[#8c6d31] to-[#c6a15b] flex items-center justify-center text-[10px] font-bold text-black font-mono"
              title="5% Insurance Fund"
            >
              5%
            </div>
            <div
              style={{ width: "5%" }}
              className="bg-gradient-to-r from-[#4d2118] to-[#7a2e20] flex items-center justify-center text-[10px] font-bold text-white font-mono"
              title="5% Operations & Infrastructure"
            >
              5%
            </div>
          </div>

          {/* 3 Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-sm border border-[#2e5e3a]/60 bg-[#0d1c12]/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-sm font-bold text-[#73d13d]">
                  90% Winner Treasury
                </span>
                <span className="text-[11px] font-mono text-[#52c41a]">GameVault PDA</span>
              </div>
              <p className="font-serif text-xs text-[#a3bfa9] leading-relaxed">
                A massive 90% of every character purchase and lobby stake flows directly into the Solana GameVault. 
                Victorious duelists leave the table with <strong>nearly double (+80% net return)</strong> on match stakes.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-[#c6a15b]/40 bg-[#1f1910]/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-sm font-bold text-[#e5c378]">
                  5% Insurance Reserve
                </span>
                <span className="text-[11px] font-mono text-[#c6a15b]">Safety Reserve</span>
              </div>
              <p className="font-serif text-xs text-[#c4b59d] leading-relaxed">
                Locked as an on-chain protocol reserve to safeguard dispute resolution, RPC network disruptions, 
                and sponsor seasonal championship jackpots.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-[#7a2e20]/40 bg-[#1c0f0c]/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-sm font-bold text-[#ff7875]">
                  5% Operations & Team
                </span>
                <span className="text-[11px] font-mono text-[#ff4d4f]">Ops Wallet</span>
              </div>
              <p className="font-serif text-xs text-[#cfa8a2] leading-relaxed">
                Dedicated exclusively to high-throughput RPC node infrastructure, MagicBlock Ephemeral Rollup maintenance, 
                and continuous smart contract audits.
              </p>
            </div>
          </div>
        </div>

        {/* ───── Provably Fair Commit-Reveal Explainer ───── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="p-8 rounded-sm border border-[#3b2b1d] bg-[#110c08]">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-[#52c41a]" />
              <span className="text-[11px] font-mono text-[#52c41a] uppercase tracking-wider">
                Cryptographic Fairness
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#f5ecd8] mb-4">
              Provably Fair Commit-Reveal RNG
            </h3>
            <p className="font-serif text-sm text-[#b8a68f] leading-relaxed mb-6">
              Neither the server, the players, nor the house can predict bullet positions in advance. 
              Both duelists submit SHA-256 hashes of their secret seeds on-chain during lobby formation. 
              The cylinder order is mathematically derived only after both commits are verified on Solana L1.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-[#c6a15b]">
              <span>SHA-256 Commit</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#a68e72]" />
              <span>Blockhash Mixing</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#a68e72]" />
              <span>Verifiable Shuffling</span>
            </div>
          </div>

          <div className="p-8 rounded-sm border border-[#3b2b1d] bg-[#110c08]">
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-[#e5c378]" />
              <span className="text-[11px] font-mono text-[#e5c378] uppercase tracking-wider">
                Non-Custodial Payouts
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#f5ecd8] mb-4">
              Instant Settlement via Anchor PDA
            </h3>
            <p className="font-serif text-sm text-[#b8a68f] leading-relaxed mb-6">
              Funds are never held by an intermediary custodian. The GameVault program PDA signs 
              and transfers SOL directly into the winner's wallet the exact second the fatal round triggers. 
              No withdrawal forms, no delay, and zero counterparty risk.
            </p>
            <div className="flex items-center gap-3 text-xs font-mono text-[#52c41a]">
              <CheckCircle2 className="w-4 h-4 text-[#52c41a]" />
              <span>Instant L1 Finality • No Withdrawal Limits</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
