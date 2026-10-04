"use client";

import React from "react";
import Link from "next/link";
import {
  Wallet,
  Sparkles,
  Swords,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function AxieHowToStartSection() {
  const steps = [
    {
      step: "01",
      title: "Connect Solana Wallet",
      description:
        "Connect your Phantom, Backpack, or Solflare wallet in one click. No registration, no private key exposure, and zero upfront gas fees.",
      badge: "INSTANT ONBOARDING",
      icon: Wallet,
      color: "text-cyan-400",
      borderColor: "hover:border-cyan-500/50",
      glow: "from-cyan-500/10",
    },
    {
      step: "02",
      title: "Receive Free Starter Deck",
      description:
        "Every duelist automatically receives an 8-chamber antique revolver and a complimentary full deck of 12 tactical Tarot Relics to manipulate the odds.",
      badge: "FREE TO PLAY",
      icon: Sparkles,
      color: "text-amber-400",
      borderColor: "hover:border-amber-500/50",
      glow: "from-amber-500/10",
    },
    {
      step: "03",
      title: "Step into the Arena & Compete",
      description:
        "Join 1v1 tactical chamber duels, outthink opponents in real-time with commit-reveal RNG, and claim seasonal championship treasury pools.",
      badge: "EARN BOUNTIES",
      icon: Swords,
      color: "text-emerald-400",
      borderColor: "hover:border-emerald-500/50",
      glow: "from-emerald-500/10",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-[#070b1e]/70 border-y border-[#172554]">
      {/* Background radial spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/10 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="axie-badge mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Beginner&apos;s Guide</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            How to Get{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#818cf8]">
              Started
            </span>
          </h2>
          <p className="font-sans text-slate-400 max-w-2xl text-base sm:text-lg">
            Jump into the action in less than 60 seconds. No download required — play directly inside your browser or mobile wallet.
          </p>
        </div>

        {/* 3 Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`axie-card p-8 flex flex-col justify-between relative group ${item.borderColor}`}
              >
                {/* Step Number Watermark */}
                <div className="absolute top-6 right-6 font-display text-5xl font-black text-white/5 select-none group-hover:text-white/10 transition-colors">
                  {item.step}
                </div>

                <div>
                  {/* Icon & Badge */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0b1433] border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Icon className={`w-7 h-7 ${item.color}`} />
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                      Step {item.step}
                    </span>
                  </div>

                  <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10 mb-3">
                    {item.badge}
                  </span>

                  <h3 className="font-display text-2xl font-black uppercase text-white mb-3 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                  <span>Start this step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/play"
            className="btn-axie-orange px-8 py-3.5 text-xs sm:text-sm flex items-center gap-2 w-full sm:w-auto"
          >
            <Swords className="w-4 h-4" />
            <span>Launch Rolet Arena Now</span>
          </Link>
          <a
            href="https://github.com/SmtDcs/rolet"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-axie-glass px-8 py-3.5 text-xs sm:text-sm flex items-center gap-2 w-full sm:w-auto"
          >
            <span>Read Rulebook & Whitepaper</span>
          </a>
        </div>
      </div>
    </section>
  );
}
