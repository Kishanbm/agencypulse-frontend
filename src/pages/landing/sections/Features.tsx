import { motion } from "motion/react";
import {
  BarChart3,
  Zap,
  Sparkles,
  Palette,
  Users,
  Bell,
  Target,
  FileText,
  Layers,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem, Spotlight } from "@/components/motion";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Drag-and-drop dashboards",
    desc: "Build pixel-perfect dashboards with 40+ widget types. Resize, rearrange, save as templates.",
    accent: "violet",
  },
  {
    icon: FileText,
    title: "Automated reports",
    desc: "Schedule branded PDF or live-link reports. Your clients get them on time, every time.",
    accent: "coral",
  },
  {
    icon: Sparkles,
    title: "AI insights & narrative",
    desc: "Auto-summarize wins, anomalies, and recommendations in plain English. No analyst required.",
    accent: "violet",
  },
  {
    icon: Palette,
    title: "Full white-labeling",
    desc: "Custom domain, logo, colors, and email sender. Your clients never see our brand.",
    accent: "mint",
  },
  {
    icon: Users,
    title: "Client portals",
    desc: "Give each client a read-only branded login. They check progress, you focus on the work.",
    accent: "coral",
  },
  {
    icon: Layers,
    title: "Cross-channel rollups",
    desc: "Blend metrics across Google, Meta, TikTok, GA4 — view ROI across the whole funnel.",
    accent: "violet",
  },
  {
    icon: Target,
    title: "Goals & forecasting",
    desc: "Set monthly targets, track progress live, and forecast outcomes with confidence intervals.",
    accent: "mint",
  },
  {
    icon: Bell,
    title: "Smart alerts",
    desc: "Get notified the moment a metric drifts off-trend. Catch issues before clients do.",
    accent: "coral",
  },
  {
    icon: Zap,
    title: "Built for scale",
    desc: "Manage 5 or 500 clients. Roll-up dashboards, team roles, audit logs, SOC2-grade infra.",
    accent: "violet",
  },
];

const accentMap = {
  violet: { bg: "bg-violet/10", text: "text-violet", glow: "from-violet/20" },
  coral: { bg: "bg-coral/10", text: "text-coral", glow: "from-coral/20" },
  mint: { bg: "bg-mint/10", text: "text-mint", glow: "from-mint/20" },
};

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Soft drifting gradient orbs */}
      <motion.div
        aria-hidden
        className="absolute -top-20 left-[5%] size-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,71,224,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-0 right-[5%] size-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,122,89,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }}
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      <div className="mx-auto max-w-[1180px] px-4 lg:px-6 relative">
        <FadeIn className="max-w-2xl mx-auto text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium tracking-wide mb-5">
            Everything an agency needs
          </span>
          <h2 className="display-lg">
            One workspace.{" "}
            <span className="text-gradient-violet">Every client metric.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Stop juggling spreadsheets, screenshots, and 12 logins. AgencyPulse pulls every channel
            into one branded place — for you and your clients.
          </p>
        </FadeIn>

        <Stagger
          staggerChildren={0.07}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const a = accentMap[f.accent as keyof typeof accentMap];
            const glowColor =
              f.accent === "violet"
                ? "rgba(91,71,224,0.20)"
                : f.accent === "coral"
                ? "rgba(255,122,89,0.20)"
                : "rgba(16,217,160,0.20)";
            return (
              <StaggerItem key={f.title}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full"
                >
                  <Spotlight
                    color={glowColor}
                    size={400}
                    className="group h-full rounded-2xl border border-border/60 bg-white hover:border-foreground/15 hover:shadow-xl hover:shadow-black/5 transition-all"
                  >
                    <div className="relative p-6 h-full">
                      {/* Static accent glow in top-right */}
                      <div
                        className={`absolute -top-12 -right-12 size-48 rounded-full bg-gradient-to-br ${a.glow} to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none`}
                      />

                      <div
                        className={`relative size-11 rounded-xl ${a.bg} ${a.text} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="size-5" strokeWidth={2} />
                      </div>
                      <h3 className="font-heading font-semibold text-base tracking-tight mb-2">
                        {f.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </Spotlight>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
