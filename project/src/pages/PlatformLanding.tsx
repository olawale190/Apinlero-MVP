import { PlatformHero } from "../components/platform/PlatformHero";
import { PlatformFeatures } from "../components/platform/PlatformFeatures";
import { PlatformTestimonial } from "../components/platform/PlatformTestimonial";
import { PlatformPricing } from "../components/platform/PlatformPricing";
import { PlatformFooter } from "../components/platform/PlatformFooter";

interface PlatformLandingProps {
  onStartTrial: () => void;
  onViewStore: () => void;
}

export function PlatformLanding({ onStartTrial, onViewStore }: PlatformLandingProps) {
  return (
    <main className="min-h-screen bg-white">
      <PlatformHero onStartTrial={onStartTrial} />
      <PlatformFeatures />
      <PlatformTestimonial onViewStore={onViewStore} />
      <PlatformPricing onStartTrial={onStartTrial} />
      <PlatformFooter />
    </main>
  );
}
