"use client";

import React from "react";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";
import { GildedButton } from "@/components/ui/GildedButton";
import { Crown, Trophy, Swords, ExternalLink } from "lucide-react";

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
            <ParchmentSeal label="Leaderboard" sublabel="Hall of Duelists" variant="gold" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f5ecd8] mt-4">
              MASTERS OF THE CYLINDER
            </h2>
            <p className="font-serif italic text-base text-[#b8a68f] mt-2">
              Verified with Bonfida SNS (.sol) identities. The highest-earning, longest-surviving duelists on Solana Devnet.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <GildedButton href="/play" variant="gold" size="sm">
              <Swords className="w-4 h-4 mr-2 text-[#c6a15b]" />
              <span>Challenge the Ranks</span>
            </GildedButton>
          </div>
        </div>

        {/* Table layout */}
        <div className="rounded-sm border border-[#3b2b1d] bg-[#110c08] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-[#1a120b] border-b border-[#3b2b1d] uppercase tracking-wider text-[#a68e72]">
                <tr>
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Duelist / Identity</th>
                  <th className="py-4 px-6">ELO Rating</th>
                  <th className="py-4 px-6 text-center">W / L Record</th>
                  <th className="py-4 px-6 text-right">Total SOL Claimed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#261c14] text-[#d8c8b0]">
                {TOP_DUELISTS.map((d) => (
                  <tr
                    key={d.rank}
                    className="hover:bg-[#18110b] transition-colors group"
                  >
                    <td className="py-4 px-6 font-display font-bold">
                      {d.rank === 1 && (
                        <span className="inline-flex items-center gap-1.5 text-[#ffd700]">
                          <Crown className="w-4 h-4 text-[#ffd700]" />
                          <span>#1</span>
                        </span>
                      )}
                      {d.rank === 2 && (
                        <span className="inline-flex items-center gap-1.5 text-[#e5e5e5]">
                          <Trophy className="w-4 h-4 text-[#c0c0c0]" />
                          <span>#2</span>
                        </span>
                      )}
                      {d.rank === 3 && (
                        <span className="inline-flex items-center gap-1.5 text-[#cd7f32]">
                          <Trophy className="w-4 h-4 text-[#cd7f32]" />
                          <span>#3</span>
                        </span>
                      )}
                      {d.rank > 3 && (
                        <span className="font-mono text-[#a68e72]">#{d.rank}</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f5ecd8] group-hover:text-[#ffdca8]">
                          {d.name}
                        </span>
                        {d.isSns && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#211710] border border-[#c6a15b]/40 text-[#c6a15b]">
                            SNS
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono text-[#a68e72]">
                      {d.elo} PTS
                    </td>

                    <td className="py-4 px-6 text-center font-mono">
                      <span className="text-[#52c41a]">{d.wins}W</span>
                      <span className="text-zinc-600 mx-1">/</span>
                      <span className="text-[#ff4d4f]">{d.losses}L</span>
                      <span className="text-[10px] text-zinc-500 ml-2">
                        ({Math.round((d.wins / (d.wins + d.losses)) * 100)}%)
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-mono font-bold text-[#e5c378]">
                      +{d.solClaimed.toFixed(2)} SOL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
