import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/motion";
import { LiveDashboardMockup } from "../components/LiveDashboardMockup";

// Stable random positions for floating particles (deterministic seed)
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 67.7) % 100,
  top: (i * 41.3) % 100,
  size: 2 + ((i * 5) % 3),
  duration: 8 + ((i * 1.6) % 6),
  delay: (i * 0.6) % 5,
  opacity: 0.18 + ((i * 0.05) % 0.25),
}));

const HEADLINE_WORDS = ["The", "reporting", "platform", "agencies"];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Parallax: as user scrolls, the mockup moves up slightly and fades
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.4]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section
      ref={sectionRef}
      className="relative pt-28 lg:pt-36 pb-16 lg:pb-24 overflow-hidden"
    >
      {/* Aurora behind — with parallax */}
      <motion.div
        className="absolute inset-0 -z-10 opacity-90"
        style={{ y: bgY }}
      >
        <AuroraBackground tone="default" />
      </motion.div>

      {/* Subtle grid */}
      <div className="absolute inset-0 -z-10 grid-bg opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      {/* Floating particles */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: i % 3 === 0 ? '#5B47E0' : i % 3 === 1 ? '#FF7A59' : '#10D9A0',
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px currentColor`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [p.opacity, p.opacity * 1.6, p.opacity],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Soft animated spotlight */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[20%] -z-10 size-[700px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(91,71,224,0.18) 0%, transparent 70%)',
          transform: 'translateX(-50%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

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

        {/* Headline — word-by-word reveal */}
        <h1 className="display-xl mt-6 max-w-5xl mx-auto">
          {HEADLINE_WORDS.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                delay: 0.15 + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block mr-3"
            >
              {w}
            </motion.span>
          ))}
          <motion.span
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-gradient-violet-flow relative inline-block"
          >
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
                transition={{ duration: 1.2, delay: 1.1 }}
              />
              <defs>
                <linearGradient id="scribble" x1="0" x2="1">
                  <stop offset="0" stopColor="#5B47E0" />
                  <stop offset="1" stopColor="#FF7A59" />
                </linearGradient>
              </defs>
            </svg>
          </motion.span>
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-6 max-w-2xl mx-auto text-base lg:text-lg text-muted-foreground leading-relaxed"
        >
          Connect every marketing platform you use, build white-label dashboards in minutes, and
          send automated reports your clients will actually read. All in one workspace.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/register">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="gradient" size="2xl" className="min-w-[200px] shadow-xl shadow-violet/30">
                Sign up free
                <ArrowRight className="size-5" />
              </Button>
            </motion.div>
          </Link>
          <Link to="/login">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" size="2xl" className="min-w-[200px] bg-white/70 backdrop-blur-sm">
                <Sparkles className="size-4" />
                Watch a 90-sec demo
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
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

        {/* Live mockup with soft glow halo + parallax */}
        <motion.div
          style={{ y: mockupY, opacity: mockupOpacity }}
          className="mt-16 lg:mt-20 max-w-[1100px] mx-auto px-2 relative"
        >
          {/* Soft glow halo behind mockup */}
          <div
            aria-hidden
            className="absolute inset-x-12 -inset-y-8 rounded-[2.5rem] -z-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(91,71,224,0.22) 0%, rgba(255,122,89,0.08) 40%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <LiveDashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
