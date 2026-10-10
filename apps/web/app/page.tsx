import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CardsSection } from "@/components/landing/CardsSection";
import { WorkshopNote } from "@/components/landing/WorkshopNote";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { WorkshopBackground } from "@/components/landing/WorkshopBackground";

export default function LandingPage() {
  return (
    // Opaque Soot root sits above the global layout background. The live 3D
    // workshop is a fixed layer inside it; sections are translucent so the
    // flickering lamp reads through as you scroll (native scroll, no pin/scrub).
    <div className="relative z-10 min-h-screen overflow-x-clip bg-[#141414] text-[#E6E1D6] selection:bg-[#B88A2E] selection:text-[#141414]">
      <WorkshopBackground />
      <div className="relative z-10">
        <LandingNavbar />
        <main>
          <HeroSection />
          <HowItWorksSection />
          <CardsSection />
          <WorkshopNote />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
