import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { RoadmapStrip } from "@/components/landing/RoadmapStrip";
import { LedgerSection } from "@/components/landing/LedgerSection";
import { ArsenalSection } from "@/components/landing/ArsenalSection";
import { PlayOwnEarnSection } from "@/components/landing/PlayOwnEarnSection";
import { StoryScroll } from "@/components/landing/StoryScroll";
import { EconomyCtaSection } from "@/components/landing/EconomyCtaSection";
import { DocsSection } from "@/components/landing/DocsSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { WorkshopBackground } from "@/components/landing/WorkshopBackground";

export default function LandingPage() {
  return (
    // Opaque root sits above the global layout background. The live 3D
    // workshop is a fixed layer inside it; sections are translucent so the
    // lamp reads through as you scroll (native scroll, no pin/scrub).
    <div className="relative z-10 min-h-screen overflow-x-clip bg-[var(--color-void)] text-[var(--color-phosphor)]">
      <WorkshopBackground />
      <div className="relative z-10">
        <LandingNavbar />
        <main>
          {/* 1 hero · 2 roadmap · 3 ledger · 4 arsenal · 5 play/own/earn
              6 workshop story · 7 vault · 8 whitepaper · 9 community · 10 footer */}
          <HeroSection />
          <RoadmapStrip />
          <LedgerSection />
          <ArsenalSection />
          <PlayOwnEarnSection />
          <StoryScroll />
          <EconomyCtaSection />
          <DocsSection />
          <CommunitySection />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
