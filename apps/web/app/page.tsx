"use client";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AxieGamesSection } from "@/components/landing/AxieGamesSection";
import { AxieDuelistsSection } from "@/components/landing/AxieDuelistsSection";
import { AxieMarketplaceSection } from "@/components/landing/AxieMarketplaceSection";
import { AxieHowToStartSection } from "@/components/landing/AxieHowToStartSection";
import { AxieTournamentSection } from "@/components/landing/AxieTournamentSection";
import { AxieNewsSection } from "@/components/landing/AxieNewsSection";
import { AxieCommunitySection } from "@/components/landing/AxieCommunitySection";
import { AxieDownloadsSection } from "@/components/landing/AxieDownloadsSection";
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
    <div className="min-h-screen bg-[#060919] text-[#e2e8f0] selection:bg-[#0077b6] selection:text-white relative overflow-x-hidden">
      {/* Top Navbar */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main className="relative z-10">
        {/* 1. Hero Section (Welcome to Rolet Universe) */}
        <HeroSection
          vaultRewardSol={rewardSol}
          matchesSettled={matchesSettled}
        />

        {/* 2. The Rolet Universe / Game Modes (Axie Games Portfolio) */}
        <AxieGamesSection />

        {/* 3. Meet the Duelists / Archetypes (Axie Species Showcase) */}
        <AxieDuelistsSection />

        {/* 4. App.Rolet Marketplace (App.Axie NFT & Gear Trading) */}
        <AxieMarketplaceSection />

        {/* 5. How to Get Started (3-Step Onboarding Guide) */}
        <AxieHowToStartSection />

        {/* 6. Season 1 Tournament & 90/5/5 Tokenomics */}
        <AxieTournamentSection />

        {/* 7. Latest News & Patch Notes (Axie Gazette) */}
        <AxieNewsSection />

        {/* 8. Community Hub & Testimonials (Axie Discord & Socials) */}
        <AxieCommunitySection />

        {/* 9. Cross-Platform Downloads (Web, Mobile, Desktop) */}
        <AxieDownloadsSection />
      </main>

      {/* Global Footer */}
      <LandingFooter />
    </div>
  );
}
