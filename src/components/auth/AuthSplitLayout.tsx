import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowLeft,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { AnimatedNumber, AuroraBackground } from "@/components/motion";

interface AuthSplitLayoutProps {
  children: ReactNode;
  /** Tone of the visual panel */
  tone?: "default" | "warm" | "cool";
  /** Headline & sub on the brand panel */
  panelHeadline: string;
  panelSub: string;
  /** Variant of side panel content */
  variant?: "stats" | "features";
}

const PANEL_FEATURES = [
  { icon: Globe, label: "Full white-label, your domain" },
  { icon: Sparkles, label: "AI-generated insights & narrative reports" },
  { icon: Zap, label: "Connect every platform you use" },
  { icon: Users, label: "Branded portals for every client" },
  { icon: Shield, label: "SOC2 · GDPR · AES-256 encrypted" },
];

export function AuthSplitLayout({
  children,
  tone = "default",
  panelHeadline,
  panelSub,
  variant = "stats",
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ─── Left: VISUAL PANEL ─── */}
      <div className="hidden lg:flex flex-1 max-w-[640px] xl:max-w-[700px] m-3 rounded-3xl overflow-hidden relative">
        {/* Deep gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              tone === "warm"
                ? "linear-gradient(135deg, #3D2BBF 0%, #5B47E0 35%, #8B47C4 65%, #C4446A 100%)"
                : "linear-gradient(135deg, #1E1570 0%, #3D2BBF 30%, #5B47E0 60%, #7C3AED 100%)",
          }}
        />

        {/* Aurora blobs at high opacity for vibrancy */}
        <div className="absolute inset-0 opacity-40">
          <AuroraBackground tone={tone === "default" ? "soft" : tone} />
        </div>

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Subtle grid */}
        <div className="absolute inset-0 grid-bg opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        {/* Glowing orb top-right */}
        <div className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        {/* Glowing orb bottom-left */}
        <div className="absolute -bottom-20 -left-10 size-64 rounded-full bg-coral/20 blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-12">
          {/* Top — logo */}
          <Link to="/" className="flex items-center gap-2 group w-fit">
            <div className="size-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-md group-hover:bg-white/20 transition">
              <Sparkles className="size-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-semibold tracking-tight text-base text-white">
              AgencyPulse
            </span>
          </Link>

          {/* Middle — headline + visual */}
          <div className="space-y-7">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-heading font-bold text-3xl xl:text-[2.5rem] tracking-tight text-white leading-[1.05]"
            >
              {panelHeadline}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-white/70 text-base leading-relaxed max-w-md"
            >
              {panelSub}
            </motion.p>

            {/* Visual content based on variant */}
            {variant === "stats" ? <StatsCluster /> : <FeatureList />}
          </div>

          {/* Bottom — trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <Badge text="SOC2 Type II" />
            <Badge text="GDPR" />
            <Badge text="99.95% SLA" />
            <Badge text="14-day trial" />
          </motion.div>
        </div>
      </div>

      {/* ─── Right: FORM PANEL ─── */}
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-16 py-8 lg:py-10 relative">
        <header className="flex items-center justify-between">
          {/* Mobile-only logo (left panel hidden on mobile) */}
          <Link to="/" className="flex items-center gap-2 group lg:hidden">
            <div className="size-8 rounded-lg bg-gradient-violet flex items-center justify-center shadow-md">
              <Sparkles className="size-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-semibold tracking-tight">
              AgencyPulse
            </span>
          </Link>
          <span className="hidden lg:block" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to home
          </Link>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="w-full max-w-md py-8">{children}</div>
        </motion.div>

        <footer className="text-xs text-muted-foreground flex items-center justify-between">
          <div>© {new Date().getFullYear()} AgencyPulse, Inc.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Help</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[11px] font-medium text-white/80">
      <CheckCircle2 className="size-3 text-mint" strokeWidth={2.5} />
      {text}
    </span>
  );
}

/**
 * Animated stat cluster — used on Login. Hero metric + supporting cards.
 */
function StatsCluster() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35 }}
      className="space-y-3 max-w-md"
    >
      {/* Hero metric card */}
      <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-white/60 tracking-wide uppercase">
              Avg. agency saves
            </div>
            <div className="font-heading font-bold text-4xl tabular tracking-tight mt-1.5 text-white">
              <AnimatedNumber value={32} suffix=" hrs" />
            </div>
            <div className="text-xs text-mint font-medium mt-1.5 tabular">
              per week on reporting
            </div>
          </div>
          <div className="size-10 rounded-xl bg-mint/20 flex items-center justify-center">
            <TrendingUp className="size-5 text-mint" />
          </div>
        </div>

        {/* Mini chart bars */}
        <div className="mt-5 flex items-end gap-1.5 h-12">
          {[40, 55, 35, 70, 50, 80, 65, 90, 75, 95].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 rounded-md bg-gradient-to-t from-white/60 to-white/20"
            />
          ))}
        </div>
      </div>

      {/* Two side stats */}
      <div className="grid grid-cols-2 gap-3">
        <SmallStat label="Reports / mo" value="12.4K" accent="mint" />
        <SmallStat label="Active agencies" value="12K+" accent="coral" />
      </div>
    </motion.div>
  );
}

function SmallStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "violet" | "coral" | "mint";
}) {
  const fg =
    accent === "violet" ? "text-violet-300" : accent === "mint" ? "text-mint" : "text-coral";
  const bgDot =
    accent === "violet" ? "bg-violet-300" : accent === "mint" ? "bg-mint" : "bg-coral";
  const barColor =
    accent === "violet" ? "bg-violet-300" : accent === "mint" ? "bg-mint" : "bg-coral";
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4">
      <div className="flex items-center gap-2">
        <div className={`size-2 rounded-full ${bgDot}`} />
        <div className="text-xs text-white/60">{label}</div>
      </div>
      <div className={`font-heading font-bold text-2xl tabular tracking-tight mt-1 ${fg}`}>
        {value}
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "78%" }}
          transition={{ duration: 1, delay: 0.7 }}
          className={`h-full ${barColor}`}
        />
      </div>
    </div>
  );
}

/**
 * Feature checklist with stagger — used on Register.
 */
function FeatureList() {
  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } },
      }}
      className="space-y-3 max-w-md"
    >
      {PANEL_FEATURES.map((f) => {
        const Icon = f.icon;
        return (
          <motion.li
            key={f.label}
            variants={{
              hidden: { opacity: 0, x: -8 },
              show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm"
          >
            <div className="size-9 rounded-lg bg-white/15 text-white flex items-center justify-center shrink-0">
              <Icon className="size-4" />
            </div>
            <span className="text-sm font-medium text-white/90">{f.label}</span>
            <CheckCircle2 className="ml-auto size-4 text-mint shrink-0" strokeWidth={2.5} />
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
