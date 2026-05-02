import { LandingNav } from "./sections/LandingNav";
import { Hero } from "./sections/Hero";
import { LogosStrip } from "./sections/LogosStrip";
import { Features } from "./sections/Features";
import { Bento } from "./sections/Bento";
import { Workflow } from "./sections/Workflow";
import { Testimonials } from "./sections/Testimonials";
import { Pricing } from "./sections/Pricing";
import { FAQ } from "./sections/FAQ";
import { CTA } from "./sections/CTA";
import { Footer } from "./sections/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <LandingNav />
      <main>
        <Hero />
        <LogosStrip />
        <Features />
        <Bento />
        <Workflow />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
