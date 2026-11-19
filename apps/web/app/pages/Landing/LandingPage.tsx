import { Faq } from './components/Faq';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { LandingFooter } from './components/LandingFooter';
import { LandingHeader } from './components/LandingHeader';
import { Limits } from './components/Limits';
import { ReturnVsRisk } from './components/ReturnVsRisk';

export function LandingPage() {
  return (
    <div className="min-h-svh tabular-nums">
      <LandingHeader />
      <main id="main" tabIndex={-1}>
        <Hero />
        <ReturnVsRisk />
        <HowItWorks />
        <Faq />
        <Limits />
      </main>
      <LandingFooter />
    </div>
  );
}
