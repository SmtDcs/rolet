"use client";

import React from "react";
import {
  Users,
  MessageSquare,
  Send,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Flame,
  Award,
} from "lucide-react";

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function AxieCommunitySection() {
  const socials = [
    {
      name: "Discord",
      count: "125,000+ Duelists",
      description: "Chat in real-time, arrange private arena duels, discuss meta loadouts, and report bugs.",
      icon: MessageSquare,
      color: "text-[#5865F2]",
      btnStyle: "btn-axie-purple",
      btnText: "Join Discord",
      href: "https://discord.gg",
    },
    {
      name: "X (Twitter)",
      count: "85,000+ Followers",
      description: "Daily highlight clips, tournament announcements, community bounties, and dev updates.",
      icon: TwitterIcon,
      color: "text-[#1DA1F2]",
      btnStyle: "btn-axie-blue",
      btnText: "Follow @RoletProtocol",
      href: "https://x.com",
    },
    {
      name: "Telegram",
      count: "32,000+ Members",
      description: "Fast-breaking announcements, seasonal tournament alerts, and multi-language communities.",
      icon: Send,
      color: "text-[#229ED9]",
      btnStyle: "btn-axie-glass",
      btnText: "Join Channel",
      href: "https://t.me",
    },
    {
      name: "GitHub",
      count: "Open Source Anchor 0.30.1",
      description: "Audit smart contracts, review MagicBlock rollup programs, and inspect commit-reveal randomness.",
      icon: GithubIcon,
      color: "text-slate-300",
      btnStyle: "btn-axie-glass",
      btnText: "View Repository",
      href: "https://github.com/SmtDcs/rolet",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Section Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-600/10 blur-[170px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="axie-badge mb-3">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Community Hub</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            Join Our Nation of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
              Duelists
            </span>
          </h2>
          <p className="font-sans text-slate-400 max-w-2xl text-base sm:text-lg">
            Connect with tactical masters, share game-winning deck strategies, and participate in global community tournaments.
          </p>
        </div>

        {/* 4 Social Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {socials.map((soc, idx) => {
            const Icon = soc.icon;
            return (
              <div
                key={idx}
                className="axie-card p-6 flex flex-col justify-between group hover:border-purple-400/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0b1330] border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Icon className={`w-6 h-6 ${soc.color}`} />
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      LIVE
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-black uppercase text-white mb-1">
                    {soc.name}
                  </h3>
                  <div className="text-xs font-mono font-bold text-amber-400 mb-3">
                    {soc.count}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6">
                    {soc.description}
                  </p>
                </div>

                <a
                  href={soc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${soc.btnStyle} w-full py-2.5 text-xs text-center flex items-center justify-center gap-1.5`}
                >
                  <span>{soc.btnText}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            );
          })}
        </div>

        {/* Player Testimonial Quotes Strip (Axie Style) */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0d1638] via-[#09102b] to-[#0d1638] border border-[#1b2b62] grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-slate-300 italic mb-4">
              &quot;The psychology of shooting yourself with a blank to retain turn initiative gives me pure adrenaline. Best on-chain PvP game of 2026.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-mono font-bold text-cyan-300 text-xs">
                SL
              </div>
              <div>
                <span className="text-xs font-bold text-white block">SolDuelist_99</span>
                <span className="text-[10px] font-mono text-slate-400">Rank #4 Global</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-slate-300 italic mb-4">
              &quot;MagicBlock sub-400ms turns feel as snappy as an offline console fighter. Zero wallet popups makes it incredibly addictive.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-mono font-bold text-amber-300 text-xs">
                0x
              </div>
              <div>
                <span className="text-xs font-bold text-white block">ZeroLag.sol</span>
                <span className="text-[10px] font-mono text-slate-400">Chamber Tactician</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-slate-300 italic mb-4">
              &quot;True Web3 gaming done right. Genuine asset ownership on Solana without any sketchy casino nonsense. Pure skill and probability.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center font-mono font-bold text-purple-300 text-xs">
                MC
              </div>
              <div>
                <span className="text-xs font-bold text-white block">MetaCrafter</span>
                <span className="text-[10px] font-mono text-slate-400">Guild Master</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
