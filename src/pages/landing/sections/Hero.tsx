import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/motion";
import { LiveDashboardMockup } from "../components/LiveDashboardMockup";

export function Hero() {
  return (
    <section className="relative pt-28 lg:pt-36 pb-16 lg:pb-24 overflow-hidden">
      {/* Aurora behind */}
      <div className="absolute inset-0 -z-10 opacity-90">
        <AuroraBackground tone="default" />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 -z-10 grid-bg opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="mx-auto max-w-[1180px] px-4 lg:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-border/60 shadow-sm"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-mint opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full size-2 bg-mint" />
          </span>
          <span className="text-xs font-medium text-foreground/80">
            New: AI-powered insights now in beta
          </span>
          <ArrowRight className="size-3 text-muted-foreground" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="display-xl mt-6 max-w-5xl mx-auto"
        >
          The reporting platform agencies{" "}
          <span className="text-gradient-violet relative inline-block">
            actually love
            <svg
              className="absolute -bottom-2 left-0 w-full"
              height="14"
              viewBox="0 0 300 14"
              fill="none"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M2 8 Q 75 2, 150 7 T 298 6"
                stroke="url(#scribble)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.9 }}
              />
              <defs>
                <linearGradient id="scribble" x1="0" x2="1">
                  <stop offset="0" stopColor="#5B47E0" />
                  <stop offset="1" stopColor="#FF7A59" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="block">.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-6 max-w-2xl mx-auto text-base lg:text-lg text-muted-foreground leading-relaxed"
        >
          Connect every marketing platform you use, build white-label dashboards in minutes, and
          send automated reports your clients will actually read. All in one workspace.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/register">
            <Button variant="gradient" size="2xl" className="min-w-[200px] shadow-lg">
              Sign up free
              <ArrowRight className="size-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="2xl" className="min-w-[200px] bg-white/70 backdrop-blur-sm">
              <Sparkles className="size-4" />
              Watch a 90-sec demo
            </Button>
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-foreground/40" />
            No credit card required
          </span>
          <span className="hidden sm:inline-block size-1 rounded-full bg-foreground/20" />
          <span className="inline-flex items-center gap-1.5">
            <span className="sm:hidden size-1 rounded-full bg-foreground/40" />
            Set up in under 5 minutes
          </span>
          <span className="hidden sm:inline-block size-1 rounded-full bg-foreground/20" />
          <span className="inline-flex items-center gap-1.5">
            <span className="sm:hidden size-1 rounded-full bg-foreground/40" />
            Cancel anytime
          </span>
        </motion.div>

        {/* Live mockup */}
        <div className="mt-16 lg:mt-20 max-w-[1100px] mx-auto px-2">
          <LiveDashboardMockup />
        </div>
      </div>
    </section>
  );
}
