import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";
import {
  siGoogleads,
  siMeta,
  siGoogleanalytics,
  siTiktok,
  siHubspot,
  siMailchimp,
  siShopify,
  siStripe,
  siPinterest,
  siYoutube,
  siX,
  siNotion,
  siZapier,
  siAirtable,
  siWordpress,
  siInstagram,
  siReddit,
  siSnapchat,
  siSpotify,
  siWebflow,
  siFigma,
  siWoocommerce,
  siSemrush,
  siGoogletagmanager,
  siGooglesearchconsole,
  siBuffer,
  siIntercom,
  siTypeform,
  siWix,
} from "simple-icons";
import { FadeIn } from "@/components/motion";

interface BrandLogo {
  name: string;
  hex: string;
  path: string;
}

function brand(icon: { title: string; hex: string; path: string }): BrandLogo {
  return { name: icon.title, hex: icon.hex, path: icon.path };
}

// Pool of available brands (real SVG paths via simple-icons)
const BRAND_POOL: BrandLogo[] = [
  brand(siGoogleads),
  brand(siMeta),
  brand(siGoogleanalytics),
  brand(siTiktok),
  brand(siHubspot),
  brand(siMailchimp),
  brand(siShopify),
  brand(siStripe),
  brand(siPinterest),
  brand(siYoutube),
  brand(siX),
  brand(siNotion),
  brand(siZapier),
  brand(siAirtable),
  brand(siWordpress),
  brand(siInstagram),
  brand(siReddit),
  brand(siSnapchat),
  brand(siSpotify),
  brand(siWebflow),
  brand(siFigma),
  brand(siWoocommerce),
  brand(siSemrush),
  brand(siGoogletagmanager),
  brand(siGooglesearchconsole),
  brand(siBuffer),
  brand(siIntercom),
  brand(siTypeform),
  brand(siWix),
];

interface OrbitSlot {
  angle: number;
  radius: number;
  size: number;
}

// 6 inner + 6 outer = 12 visible slots
const INNER_COUNT = 6;
const OUTER_COUNT = 6;

function computeSlots(viewportSize: number): OrbitSlot[] {
  // Push icons farther from the center hub for breathing room
  const innerR = viewportSize * 0.34;
  const outerR = viewportSize * 0.48;
  const innerSize = Math.max(52, viewportSize * 0.105);
  const outerSize = Math.max(60, viewportSize * 0.12);

  const inner: OrbitSlot[] = Array.from({ length: INNER_COUNT }, (_, i) => ({
    angle: (i / INNER_COUNT) * Math.PI * 2 - Math.PI / 2, // start top
    radius: innerR,
    size: innerSize,
  }));
  const outer: OrbitSlot[] = Array.from({ length: OUTER_COUNT }, (_, i) => ({
    angle:
      (i / OUTER_COUNT) * Math.PI * 2 - Math.PI / 2 + Math.PI / OUTER_COUNT, // offset
    radius: outerR,
    size: outerSize,
  }));
  return [...inner, ...outer];
}

export function LogosStrip() {
  // Track viewport for responsive sizing
  const [viewport, setViewport] = useState(() => getViewport());
  useEffect(() => {
    function onResize() {
      setViewport(getViewport());
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const slots = useMemo(() => computeSlots(viewport), [viewport]);
  const totalSlots = slots.length;

  // Initial assignment of brands to slots
  const [assignments, setAssignments] = useState<BrandLogo[]>(() =>
    BRAND_POOL.slice(0, totalSlots),
  );

  useEffect(() => {
    setAssignments((prev) => {
      // Adjust length if slot count changed
      if (prev.length === totalSlots) return prev;
      return BRAND_POOL.slice(0, totalSlots);
    });
  }, [totalSlots]);

  // Cycle: every interval, replace 2 slots with fresh logos from the pool
  useEffect(() => {
    const id = setInterval(() => {
      setAssignments((prev) => {
        const next = [...prev];
        const shown = new Set(prev.map((b) => b.name));
        const fresh = BRAND_POOL.filter((b) => !shown.has(b.name));
        if (fresh.length === 0) return prev;
        // Replace 2 random slots
        const indices = pickRandom(prev.length, Math.min(2, fresh.length));
        indices.forEach((slotIdx, i) => {
          if (fresh[i]) next[slotIdx] = fresh[i];
        });
        return next;
      });
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="integrations" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 dot-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      {/* Animated central glow */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] bg-gradient-violet opacity-[0.06] blur-[120px] rounded-full pointer-events-none"
        animate={{ scale: [1, 1.12, 1], opacity: [0.06, 0.10, 0.06] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Drifting accent blob */}
      <motion.div
        aria-hidden
        className="absolute top-1/3 left-[10%] size-[280px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,122,89,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }}
        animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/2 right-[8%] size-[260px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,217,160,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }}
        animate={{ x: [0, -30, 0], y: [0, 25, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="mx-auto max-w-[1180px] px-4 lg:px-6 relative">
        <FadeIn className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium tracking-wide mb-5">
            Integrations
          </span>
          <h2 className="display-lg max-w-3xl mx-auto">
            Plug into the platforms{" "}
            <span className="text-gradient-violet">your clients already use.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Connect ad platforms, analytics, CRMs, email tools, and e-commerce in three clicks. We
            handle OAuth, rate limits, and token refresh — forever.
          </p>
        </FadeIn>

        {/* Hub & orbit visualization */}
        <div
          className="relative mx-auto"
          style={{
            width: `${viewport}px`,
            height: `${viewport}px`,
            maxWidth: "100%",
          }}
        >
          {/* Animated connection lines (SVG) */}
          <ConnectionLines slots={slots} viewport={viewport} />

          {/* Orbit ring guides (faint dashed circles) */}
          <RingGuides viewport={viewport} />

          {/* Logo tiles positioned around the center */}
          {slots.map((slot, i) => {
            const cx = viewport / 2 + Math.cos(slot.angle) * slot.radius;
            const cy = viewport / 2 + Math.sin(slot.angle) * slot.radius;
            const brand = assignments[i];
            if (!brand) return null;
            return (
              <LogoTile
                key={i}
                slotIndex={i}
                cx={cx}
                cy={cy}
                size={slot.size}
                brand={brand}
              />
            );
          })}

          {/* Center hub */}
          <CenterHub viewport={viewport} />
        </div>

        {/* Footer line */}
        <FadeIn delay={0.2} className="text-center mt-14">
          <p className="text-sm text-muted-foreground">
            Don't see your stack?{" "}
            <a
              href="#"
              className="text-violet font-medium hover:underline underline-offset-4"
            >
              Request an integration →
            </a>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

function getViewport(): number {
  if (typeof window === "undefined") return 720;
  const w = window.innerWidth;
  if (w < 480) return Math.min(w - 32, 380);
  if (w < 768) return 520;
  if (w < 1024) return 620;
  return 760;
}

function CenterHub({ viewport }: { viewport: number }) {
  const size = Math.max(120, viewport * 0.24);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
    >
      <div className="relative">
        {/* Outer pulsing rings */}
        <motion.div
          className="absolute inset-0 rounded-full border border-violet/30"
          animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-violet/30"
          animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: 1.3 }}
        />

        {/* Hub card */}
        <div
          className="relative rounded-3xl bg-white border border-border shadow-xl overflow-hidden flex flex-col items-center justify-center"
          style={{
            width: size,
            height: size,
            boxShadow:
              "0 0 0 1px rgba(91,71,224,0.08), 0 12px 40px rgba(91,71,224,0.18), 0 4px 12px rgba(14,14,16,0.06)",
          }}
        >
          {/* Soft glow inside */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet/[0.06] via-transparent to-coral/[0.06]" />

          {/* Logo mark */}
          <div className="relative size-14 rounded-2xl bg-gradient-violet flex items-center justify-center shadow-md">
            <Sparkles className="size-6 text-white" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-2xl bg-gradient-violet blur-md opacity-50 -z-10" />
          </div>

          {/* "Connect with" label */}
          <div className="relative mt-2.5 text-center">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 font-medium">
              Connect with
            </div>
            <div className="font-heading font-bold text-base tracking-tight mt-0.5">
              your stack
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LogoTile({
  slotIndex,
  cx,
  cy,
  size,
  brand,
}: {
  slotIndex: number;
  cx: number;
  cy: number;
  size: number;
  brand: BrandLogo;
}) {
  // Float animation phase based on slot index
  const floatPhase = (slotIndex * 0.7) % (Math.PI * 2);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -6, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay: slotIndex * 0.04 },
        scale: { duration: 0.5, delay: slotIndex * 0.04 },
        y: {
          duration: 4 + (slotIndex % 3),
          repeat: Infinity,
          ease: "easeInOut",
          delay: floatPhase,
        },
      }}
      className="absolute z-10"
      style={{
        left: cx,
        top: cy,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={brand.name}
          initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.1, y: -4 }}
          className="h-full w-full rounded-2xl bg-white border border-border/70 shadow-sm hover:shadow-md flex items-center justify-center cursor-default group"
          style={{ perspective: "600px" }}
          title={brand.name}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={`#${brand.hex}`}
            className="transition-transform group-hover:scale-110"
            style={{ width: size * 0.5, height: size * 0.5 }}
            aria-label={brand.name}
          >
            <path d={brand.path} />
          </svg>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function RingGuides({ viewport }: { viewport: number }) {
  const center = viewport / 2;
  const innerR = viewport * 0.34;
  const outerR = viewport * 0.48;
  return (
    <svg
      width={viewport}
      height={viewport}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      <circle
        cx={center}
        cy={center}
        r={innerR}
        fill="none"
        stroke="#5B47E0"
        strokeOpacity="0.10"
        strokeWidth="1"
        strokeDasharray="3 6"
      />
      <circle
        cx={center}
        cy={center}
        r={outerR}
        fill="none"
        stroke="#5B47E0"
        strokeOpacity="0.08"
        strokeWidth="1"
        strokeDasharray="3 6"
      />
    </svg>
  );
}

/**
 * Animated connection lines from center hub to each orbit slot.
 * Uses stroke-dashoffset animation to create a flowing "data" effect.
 */
function ConnectionLines({
  slots,
  viewport,
}: {
  slots: OrbitSlot[];
  viewport: number;
}) {
  const center = viewport / 2;
  const hubRadius = Math.max(60, viewport * 0.12); // skip the part inside the hub card
  return (
    <svg
      width={viewport}
      height={viewport}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5B47E0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#5B47E0" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {slots.map((slot, i) => {
        const x1 = center + Math.cos(slot.angle) * hubRadius;
        const y1 = center + Math.sin(slot.angle) * hubRadius;
        const x2 = center + Math.cos(slot.angle) * (slot.radius - slot.size / 2);
        const y2 = center + Math.sin(slot.angle) * (slot.radius - slot.size / 2);
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#lineGradient)"
              strokeWidth="1"
            />
            {/* Flowing dot */}
            <circle r="2.5" fill="#5B47E0" opacity="0.85">
              <animate
                attributeName="cx"
                values={`${x1};${x2}`}
                dur={`${2 + (i % 3) * 0.4}s`}
                repeatCount="indefinite"
                begin={`${i * 0.18}s`}
              />
              <animate
                attributeName="cy"
                values={`${y1};${y2}`}
                dur={`${2 + (i % 3) * 0.4}s`}
                repeatCount="indefinite"
                begin={`${i * 0.18}s`}
              />
              <animate
                attributeName="opacity"
                values="0;0.9;0"
                dur={`${2 + (i % 3) * 0.4}s`}
                repeatCount="indefinite"
                begin={`${i * 0.18}s`}
              />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

function pickRandom(max: number, n: number): number[] {
  const indices = Array.from({ length: max }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, n);
}
