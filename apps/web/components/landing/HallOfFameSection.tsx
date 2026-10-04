"use client";

import React from "react";
import Link from "next/link";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";
import { GildedButton } from "@/components/ui/GildedButton";

interface TopDuelist {
  rank: number;
  name: string;
  isSns: boolean;
  wins: number;
  losses: number;
  solClaimed: number;
  elo: number;
}

const TOP_DUELISTS: TopDuelist[] = [
  {
    rank: 1,
    name: "satoshi.sol",
    isSns: true,
    wins: 34,
    losses: 8,
    solClaimed: 4.86,
    elo: 1680,
  },
  {
    rank: 2,
    name: "revolver_king.sol",
    isSns: true,
    wins: 29,
    losses: 11,
    solClaimed: 3.92,
    elo: 1540,
  },
  {
    rank: 3,
    name: "phantom_dead.sol",
    isSns: true,
    wins: 22,
    losses: 9,
    solClaimed: 2.74,
    elo: 1410,
  },
  {
    rank: 4,
    name: "8xL...3kY",
    isSns: false,
    wins: 18,
    losses: 7,
    solClaimed: 2.16,
    elo: 1350,
  },
  {
    rank: 5,
    name: "blind_luck.sol",
    isSns: true,
    wins: 15,
    losses: 12,
    solClaimed: 1.80,
    elo: 1290,
  },
];

export function HallOfFameSection() {
  return (
    <section id="leaderboard" className="py-20 md:py-28 border-b border-[#2b2016] bg-[#070605] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <ParchmentSeal label="Liderlik Kürsüsü" sublabel="Hall of Duelists" variant="gold" />
            <h2 className="font-['Cinzel_Decorative',serif] text-3xl sm:text-4xl font-bold tracking-tight text-[#f5ecd8] mt-4">
              MASANIN EFENDİLERİ
            </h2>
            <p className="font-['Cinzel',serif] text-sm text-[#b8a68f] mt-2">
              Bonfida SNS (.sol) ile doğrulanmış, Solana Devnet'te en çok SOL kazanan ve hayatta kalan kumarbazlar.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <GildedButton href="/play" variant="gold" size="sm">
              Sıralamaya Meydan Oku
            </GildedButton>
          </div>
        </div>

        {/* Table layout */}
        <div className="rounded-sm border border-[#3b2b1d] bg-[#110c08] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-['Cinzel',serif] text-xs">
              <thead className="bg-[#1a120b] border-b border-[#3b2b1d] uppercase tracking-wider text-[#a68e72]">
                <tr>
                  <th className="py-4 px-6">Sıra</th>
                  <th className="py-4 px-6">Düellocu / Kimlik</th>
                  <th className="py-4 px-6">ELO Puanı</th>
                  <th className="py-4 px-6 text-center">G / M Oranı</th>
                  <th className="py-4 px-6 text-right">Toplam SOL Kazancı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#261c14] text-[#d6c4ad]">
                {TOP_DUELISTS.map((d) => {
                  const winRate = Math.round((d.wins / (d.wins + d.losses)) * 100);
                  const isTopThree = d.rank <= 3;

                  return (
                    <tr
                      key={d.rank}
                      className="hover:bg-[#1a120b]/60 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-sm font-['Cinzel_Decorative',serif] text-sm font-bold ${
                            d.rank === 1
                              ? "bg-[#c6a15b] text-[#120d09]"
                              : d.rank === 2
                              ? "bg-[#a68e72] text-[#120d09]"
                              : d.rank === 3
                              ? "bg-[#8c6d31] text-[#f5ecd8]"
                              : "text-[#736352]"
                          }`}
                        >
                          {d.rank}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isTopThree ? "text-[#f5ecd8]" : "text-[#c4b59d]"}`}>
                            {d.name}
                          </span>
                          {d.isSns && (
                            <span className="text-[10px] font-['Space_Mono',monospace] px-1.5 py-0.5 rounded-sm bg-[#1c2e22] text-[#52c41a] border border-[#2e5e3a]">
                              SNS
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-['Space_Mono',monospace] text-[#e5c378]">
                        {d.elo}
                      </td>

                      <td className="py-4 px-6 text-center font-['Space_Mono',monospace]">
                        <span className="text-[#52c41a] font-bold">{d.wins}G</span>
                        <span className="mx-1 text-[#665444]">-</span>
                        <span className="text-[#ff4d4f]">{d.losses}M</span>
                        <span className="ml-2 text-[10px] text-[#8a7761]">({winRate}%)</span>
                      </td>

                      <td className="py-4 px-6 text-right font-['Space_Mono',monospace] font-bold text-[#e5c378]">
                        +{d.solClaimed.toFixed(2)} SOL
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
