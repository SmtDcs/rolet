"use client";

import React from "react";
import Link from "next/link";
import {
  ExternalLink,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Zap,
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

export function LandingFooter() {
  return (
    <footer className="bg-[#040712] border-t border-[#141f45] pt-20 pb-12 relative overflow-hidden text-slate-400">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-cyan-600/5 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12 pb-16 border-b border-[#141f45]">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-3 group mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00b4d8] to-[#023e8a] p-[1.5px] shadow-[0_0_15px_rgba(0,180,216,0.3)]">
                <div className="w-full h-full rounded-[14px] bg-[#070c22] flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-[#38bdf8]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="2.5" fill="#38bdf8" />
                    <circle cx="12" cy="6" r="1.5" fill="#f59e0b" />
                    <circle cx="18" cy="12" r="1.5" fill="#f59e0b" />
                    <circle cx="12" cy="18" r="1.5" fill="#f59e0b" />
                    <circle cx="6" cy="12" r="1.5" fill="#f59e0b" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xl tracking-wider text-white">
                  ROLET
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#38bdf8]">
                  Tactical Duel Universe
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-6 font-medium">
              The premier on-chain turn-based tactical chamber duel protocol on Solana. 
              Eight chambers, twelve tactical tarot relics, and lightning-fast sub-second execution powered by MagicBlock.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#0b1330] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
                aria-label="Discord"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#0b1330] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
                aria-label="X Twitter"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/SmtDcs/rolet"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#0b1330] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
                aria-label="GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Column 1: Games & Modes */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white mb-4">
              Duel Modes
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <a href="#games" className="hover:text-cyan-400 transition-colors">
                  Chamber Duel (1v1)
                </a>
              </li>
              <li>
                <a href="#games" className="hover:text-cyan-400 transition-colors">
                  The Gauntlet (4P)
                </a>
              </li>
              <li>
                <a href="#games" className="hover:text-cyan-400 transition-colors">
                  Blitz Protocol (Rollup)
                </a>
              </li>
              <li>
                <a href="#games" className="hover:text-cyan-400 transition-colors">
                  Occult Armory
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Ecosystem */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white mb-4">
              Ecosystem
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <a href="#duelists" className="hover:text-cyan-400 transition-colors">
                  Duelist Archetypes
                </a>
              </li>
              <li>
                <a href="#marketplace" className="hover:text-cyan-400 transition-colors">
                  App.Rolet Marketplace
                </a>
              </li>
              <li>
                <a href="#tournament" className="hover:text-cyan-400 transition-colors">
                  Season 1 Invitational
                </a>
              </li>
              <li>
                <a href="#tournament" className="hover:text-cyan-400 transition-colors">
                  Treasury Vault (90%)
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Developers */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white mb-4">
              Developers
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <a
                  href="https://github.com/SmtDcs/rolet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                >
                  <span>Anchor Contracts</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SmtDcs/rolet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                >
                  <span>MagicBlock Rollups</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SmtDcs/rolet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                >
                  <span>Audit Reports</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SmtDcs/rolet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                >
                  <span>Bug Bounty</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 4: Compliance & Network */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white mb-4">
              Network Status
            </h4>
            <div className="p-3 rounded-2xl bg-[#091129] border border-white/5 space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Solana Network:</span>
                <span className="text-emerald-400 font-bold">Devnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Finality Speed:</span>
                <span className="text-cyan-400 font-bold">&lt; 400ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Program:</span>
                <span className="text-slate-300 font-bold">v0.30.1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Compliance Notice */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © 2026 Rolet Protocol Foundation. All rights reserved. Built for Solana Renaissance & Colosseum.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Provably Fair Skill & Probability Protocol</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
