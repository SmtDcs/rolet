"use client";

import React from "react";
import {
  Newspaper,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Zap,
  Trophy,
} from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  date: string;
  summary: string;
  author: string;
}

const NEWS_ARTICLES: NewsItem[] = [
  {
    id: "news-01",
    title: "Season 1 Invitational Championship: $50,000 SOL Prize Pool Announced",
    category: "ESPORTS",
    categoryColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    date: "OCTOBER 2026",
    summary:
      "Official registration details, Swiss bracket seeding, and the Grand Champion Obsidian Peacemaker #001 physical & digital trophy reveal.",
    author: "Rolet Esports Committee",
  },
  {
    id: "news-02",
    title: "MagicBlock Rollup Engine: Sub-400ms Gasless Turns on Solana",
    category: "TECH ARCHITECTURE",
    categoryColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    date: "SEPTEMBER 2026",
    summary:
      "How ephemeral session keys and state delegation remove wallet popups, allowing lightning-fast tactile turns with zero gas fees.",
    author: "Core Engineering Team",
  },
  {
    id: "news-03",
    title: "Patch Notes v2.4: Archetype Rebalance & 4 New Tactical Tarot Relics",
    category: "GAMEPLAY PATCH",
    categoryColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    date: "SEPTEMBER 2026",
    summary:
      "Introducing 'The High Priestess' and 'The Star' chamber relics. Complete balance adjustments for Gunslinger quickdraw odds.",
    author: "Game Design Team",
  },
];

export function AxieNewsSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#070b1e]/60 border-t border-[#172554]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="axie-badge mb-3">
            <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dispatches & Updates</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            Latest{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#818cf8]">
              News & Gazettes
            </span>
          </h2>
          <p className="font-sans text-slate-400 max-w-2xl text-base sm:text-lg">
            Stay up to date with competitive tournaments, engineering updates, patch notes, and community announcements.
          </p>
        </div>

        {/* 3 Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {NEWS_ARTICLES.map((article) => (
            <article
              key={article.id}
              className="axie-card p-6 flex flex-col justify-between group cursor-pointer hover:border-cyan-400/50"
            >
              <div>
                {/* Meta Bar */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${article.categoryColor}`}
                  >
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{article.date}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-display text-lg sm:text-xl font-black uppercase text-white mb-3 tracking-tight group-hover:text-cyan-300 transition-colors leading-snug">
                  {article.title}
                </h3>

                {/* Summary */}
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium mb-6">
                  {article.summary}
                </p>
              </div>

              {/* Author & Read Link */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">{article.author}</span>
                <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Read Article</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
