"use client";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { RulesSection } from "@/components/landing/RulesSection";
import { GrimoireSection } from "@/components/landing/GrimoireSection";
import { EconomySection } from "@/components/landing/EconomySection";
import { HallOfFameSection } from "@/components/landing/HallOfFameSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useRolet } from "@/hooks/useRolet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function LandingPage() {
  const { fetchVault } = useRolet();
  const [rewardSol, setRewardSol] = useState(0.18);
  const [matchesSettled, setMatchesSettled] = useState(142);

  useEffect(() => {
    let active = true;
    fetchVault().then((v) => {
      if (active && v) {
        if (v.rewardSol) {
          setRewardSol(Number(v.rewardSol) / LAMPORTS_PER_SOL);
        }
        if (v.matchesSettled) {
          setMatchesSettled(Number(v.matchesSettled));
        }
      }
    });
    return () => {
      active = false;
    };
  }, [fetchVault]);

  return (
    <div className="min-h-screen bg-[#070605] text-[#e6d7c3] selection:bg-[#8c2727] selection:text-[#fff0e6] relative overflow-x-hidden">
      <LandingNavbar />
      <main className="relative z-10">
        <HeroSection
          vaultRewardSol={rewardSol}
          matchesSettled={matchesSettled}
        />
        <RulesSection />
        <GrimoireSection />
        <EconomySection />
        <HallOfFameSection />
      </main>
      <LandingFooter />
    </div>
  );
}
