import { Hero } from "../components/landing/Hero";
import { Problem } from "../components/landing/Problem";
import { Solution } from "../components/landing/Solution";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Testimonial } from "../components/landing/Testimonial";
import { Pricing } from "../components/landing/Pricing";
import { LandingFooter } from "../components/landing/LandingFooter";

interface LandingProps {
  onStartTrial: () => void;
}

export function Landing({ onStartTrial }: LandingProps) {
  return (
    <main className="min-h-screen">
      <Hero onStartTrial={onStartTrial} />
      <Problem />
      <Solution />
      <HowItWorks />
      <Testimonial />
      <Pricing onStartTrial={onStartTrial} />
      <LandingFooter />
    </main>
  );
}
