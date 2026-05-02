import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/motion";
import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, MoreHorizontal, Sparkles } from "lucide-react";

/**
 * Live, animated miniature dashboard for the landing hero.
 * Numbers update on a slow loop, line chart draws in, widgets stagger on mount.
 */
export function LiveDashboardMockup() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3200);
    return () => clearInterval(id);
  }, []);

  // Numbers that rotate to feel "live"
  const cycle = tick % 3;
  const revenue = [42850, 47120, 51380][cycle];
  const conversions = [1284, 1392, 1451][cycle];
  const ctr = [4.2, 4.8, 5.3][cycle];
  const roas = [3.4, 3.7, 4.1][cycle];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full"
    >
      {/* Outer glow */}
      <div className="absolute -inset-4 bg-gradient-violet opacity-20 blur-3xl rounded-[2rem]" />

      {/* Frame */}
      <div className="relative rounded-[1.75rem] border border-border/80 bg-white shadow-xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/60 bg-secondary/40">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF7A59]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#F5A524]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#10D9A0]/60" />
          </div>
          <div className="ml-3 flex-1 max-w-md mx-auto">
            <div className="rounded-md bg-white border border-border/60 px-3 py-1 text-xs text-muted-foreground/70 truncate">
              app.agencypulse.com / acme-marketing / atlas-coffee
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
            <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
            Live
          </div>
        </div>

        {/* Body */}
        <div className="p-5 lg:p-6 grid grid-cols-12 gap-4 bg-[#FBFBF8]">
          {/* Header strip */}
          <div className="col-span-12 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground/70 mb-1">Atlas Coffee · Q4 Performance</div>
              <div className="font-heading text-lg font-semibold text-foreground tracking-tight">
                Cross-channel overview
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["#5B47E0", "#FF7A59", "#10D9A0"].map((c, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full border-2 border-white"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="px-2.5 py-1 rounded-full bg-mint/10 text-mint text-[11px] font-medium border border-mint/20 tabular">
                +18% vs last
              </div>
            </div>
          </div>

          {/* KPI row */}
          <KpiCard label="Revenue" value={revenue} prefix="$" delay={0.1} delta="+12.4%" positive />
          <KpiCard label="Conversions" value={conversions} delay={0.18} delta="+8.2%" positive />
          <KpiCard label="CTR" value={ctr} suffix="%" delay={0.26} delta="+0.6pp" positive decimals={1} />
          <KpiCard label="ROAS" value={roas} suffix="x" delay={0.34} delta="-0.2x" positive={false} decimals={1} />

          {/* Chart card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="col-span-12 lg:col-span-8 rounded-2xl border border-border/60 bg-white p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-muted-foreground/70 mb-1">Revenue trend</div>
                <div className="font-heading font-semibold tabular text-base">
                  $<AnimatedNumber value={revenue} format={{ maximumFractionDigits: 0 }} />
                  <span className="ml-2 text-xs text-mint font-medium">+12.4%</span>
                </div>
              </div>
              <button type="button" className="text-muted-foreground/50 hover:text-foreground transition">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            <MiniLineChart key={cycle} />
            <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground/70">
              <LegendDot color="#5B47E0" label="Google Ads" />
              <LegendDot color="#FF7A59" label="Meta" />
              <LegendDot color="#10D9A0" label="Organic" />
            </div>
          </motion.div>

          {/* AI insight card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="col-span-12 lg:col-span-4 rounded-2xl border border-violet/20 bg-gradient-to-br from-violet/5 via-white to-coral/5 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="size-7 rounded-lg bg-gradient-violet flex items-center justify-center">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <div className="text-xs font-medium tracking-wide text-violet uppercase">
                AI insight
              </div>
            </div>
            <div className="text-sm text-foreground/85 leading-relaxed">
              Meta CPA is up{" "}
              <span className="font-semibold">17%</span> this week.{" "}
              <span className="text-muted-foreground">
                Suggested action: rebalance budget toward Google Search.
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="px-2.5 py-1 rounded-full text-[11px] bg-white border border-border/60 font-medium">
                Apply now
              </div>
              <div className="px-2.5 py-1 rounded-full text-[11px] text-muted-foreground">
                Dismiss
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating accent cards */}
      <FloatingCard
        position="top-right"
        delay={0.9}
      >
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-mint/10 flex items-center justify-center">
            <ArrowUp className="size-4 text-mint" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Goal hit</div>
            <div className="text-xs font-semibold tabular">$50K MRR</div>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard position="bottom-left" delay={1.1}>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-coral/10 flex items-center justify-center">
            <Sparkles className="size-4 text-coral" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Report sent</div>
            <div className="text-xs font-semibold">12 clients · auto</div>
          </div>
        </div>
      </FloatingCard>
    </motion.div>
  );
}

function KpiCard({
  label,
  value,
  prefix,
  suffix,
  delta,
  positive,
  delay,
  decimals = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta: string;
  positive: boolean;
  delay: number;
  decimals?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="col-span-6 lg:col-span-3 rounded-xl border border-border/60 bg-white p-4"
    >
      <div className="text-[11px] text-muted-foreground/70 uppercase tracking-wide mb-2">{label}</div>
      <div className="font-heading text-xl font-semibold tabular tracking-tight">
        {prefix}
        <AnimatedNumber
          value={value}
          format={{
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }}
        />
        {suffix}
      </div>
      <div className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium tabular ${positive ? "text-mint" : "text-coral"}`}>
        {positive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
        {delta}
      </div>
    </motion.div>
  );
}

function MiniLineChart() {
  const w = 480;
  const h = 140;

  // Three lines representing channels
  const lines = [
    { color: "#5B47E0", path: "M0 96 C 40 88, 70 70, 110 64 S 180 50, 230 42 S 300 30, 360 22 S 440 12, 480 8" },
    { color: "#FF7A59", path: "M0 110 C 50 100, 90 92, 140 88 S 220 78, 270 72 S 340 64, 400 58 S 460 50, 480 48" },
    { color: "#10D9A0", path: "M0 124 C 50 118, 100 112, 160 106 S 240 96, 300 92 S 380 86, 440 82 S 470 80, 480 78" },
  ];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <defs>
        <linearGradient id="violetFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5B47E0" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#5B47E0" stopOpacity="0" />
        </linearGradient>
        <pattern id="grid" width="60" height="35" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 35" fill="none" stroke="#ECECE6" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill="url(#grid)" />

      {/* Filled area for primary line */}
      <motion.path
        d={`${lines[0].path} L ${w} ${h} L 0 ${h} Z`}
        fill="url(#violetFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      />

      {lines.map((l, i) => (
        <motion.path
          key={i}
          d={l.path}
          fill="none"
          stroke={l.color}
          strokeWidth={i === 0 ? 2.5 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.5 + i * 0.15, ease: "easeInOut" }}
        />
      ))}

      {/* End-point dot on primary */}
      <motion.circle
        cx="476"
        cy="8"
        r="4"
        fill="#5B47E0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.7, type: "spring" }}
      />
      <motion.circle
        cx="476"
        cy="8"
        r="9"
        fill="#5B47E0"
        opacity={0.18}
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.6, 1] }}
        transition={{ duration: 2, delay: 1.7, repeat: Infinity, repeatDelay: 0.5 }}
      />
    </svg>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function FloatingCard({
  children,
  position,
  delay,
}: {
  children: React.ReactNode;
  position: "top-right" | "bottom-left";
  delay: number;
}) {
  const positions = {
    "top-right": "absolute -top-4 -right-4 lg:-top-6 lg:-right-10",
    "bottom-left": "absolute -bottom-6 -left-4 lg:-bottom-8 lg:-left-10",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`${positions[position]} hidden md:block`}
      style={{ animation: `float 6s ease-in-out infinite`, animationDelay: `${delay}s` }}
    >
      <div className="rounded-2xl border border-border/60 bg-white shadow-lg p-3">
        {children}
      </div>
    </motion.div>
  );
}
