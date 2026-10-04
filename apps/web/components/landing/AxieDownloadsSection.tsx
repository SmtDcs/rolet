"use client";

import React from "react";
import Link from "next/link";
import {
  Globe,
  Smartphone,
  Monitor,
  Download,
  CheckCircle2,
  Sparkles,
  Swords,
  Layers,
} from "lucide-react";

export function AxieDownloadsSection() {
  const platforms = [
    {
      title: "Web Browser",
      badge: "RECOMMENDED",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      description: "Play instantly in Chrome, Brave, Safari, or Phantom wallet in-app browser with zero installation.",
      icon: Globe,
      cta: "Play in Browser",
      href: "/play",
      isPrimary: true,
    },
    {
      title: "Solana Mobile dApp Store",
      badge: "VERIFIED",
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      description: "Optimized for Solana Saga and Chapter 2 devices with native Seed Vault security integration.",
      icon: Smartphone,
      cta: "Explore Saga dApp",
      href: "/play",
      isPrimary: false,
    },
    {
      title: "Windows & macOS",
      badge: "DESKTOP APP",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
      description: "Standalone client featuring 120 FPS high-refresh rate diegetic 3D graphics and Discord rich presence.",
      icon: Monitor,
      cta: "Download Client",
      href: "https://github.com/SmtDcs/rolet/releases",
      isPrimary: false,
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-[#070b1e]/70 border-t border-[#172554]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="axie-badge mb-3">
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cross-Platform Gaming</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            Play Across Any{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#818cf8]">
              Device
            </span>
          </h2>
          <p className="font-sans text-slate-400 max-w-2xl text-base sm:text-lg">
            Whether you&apos;re at your desktop battle-station or dueling on the go with Solana Mobile, Rolet delivers a seamless experience.
          </p>
        </div>

        {/* 3 Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {platforms.map((plat, idx) => {
            const Icon = plat.icon;
            return (
              <div
                key={idx}
                className={`axie-card p-8 flex flex-col justify-between ${
                  plat.isPrimary ? "border-cyan-400/50 ring-1 ring-cyan-500/30" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0b1433] border border-white/10 flex items-center justify-center shadow-lg">
                      <Icon className="w-7 h-7 text-cyan-400" />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${plat.badgeColor}`}
                    >
                      {plat.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-black uppercase text-white mb-3">
                    {plat.title}
                  </h3>

                  <p className="text-slate-300 text-sm leading-relaxed font-medium mb-6">
                    {plat.description}
                  </p>
                </div>

                <div className="pt-4">
                  {plat.isPrimary ? (
                    <Link
                      href={plat.href}
                      className="btn-axie-orange w-full py-3 text-xs sm:text-sm text-center flex items-center justify-center gap-2"
                    >
                      <Swords className="w-4 h-4" />
                      <span>{plat.cta}</span>
                    </Link>
                  ) : (
                    <a
                      href={plat.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-axie-glass w-full py-3 text-xs sm:text-sm text-center flex items-center justify-center gap-2"
                    >
                      <span>{plat.cta}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
