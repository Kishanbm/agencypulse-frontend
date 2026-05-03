import { motion } from "motion/react";
import { FadeIn, Spotlight } from "@/components/motion";
import { Globe, Lock, Sparkles, ArrowUp, Activity, Users } from "lucide-react";

/**
 * Bento grid — large, asymmetric feature highlights with embedded mini-visuals.
 */
export function Bento() {
  return (
    <section className="py-24 lg:py-32 bg-secondary/40 relative overflow-hidden">
      <div className="absolute inset-0 dot-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      {/* Drifting background orbs */}
      <motion.div
        aria-hidden
        className="absolute top-1/4 left-[8%] size-[320px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,71,224,0.10) 0%, transparent 70%)', filter: 'blur(50px)' }}
        animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-1/4 right-[8%] size-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,217,160,0.10) 0%, transparent 70%)', filter: 'blur(50px)' }}
        animate={{ x: [0, -40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      <div className="mx-auto max-w-[1180px] px-4 lg:px-6 relative">
        <FadeIn className="max-w-2xl mx-auto text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-white border border-border/60 text-xs font-medium tracking-wide mb-5">
            Built different
          </span>
          <h2 className="display-lg">
            Why agencies switch and{" "}
            <span className="text-gradient-violet">never look back</span>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-12 gap-4">
          {/* Big — White-label */}
          <BentoCard className="col-span-12 lg:col-span-7 lg:row-span-2 min-h-[360px]">
            <div className="flex flex-col h-full justify-between">
              <div>
                <Pill icon={<Globe className="size-3.5" />} label="White-label" />
                <h3 className="font-heading text-2xl font-semibold tracking-tight mt-4 max-w-md">
                  Your brand, your domain.{" "}
                  <span className="text-muted-foreground font-normal">
                    Clients never see ours.
                  </span>
                </h3>
              </div>

              {/* Visual: branded preview cards */}
              <div className="relative mt-8 grid grid-cols-3 gap-3">
                {[
                  { name: "Acme Marketing", color: "#5B47E0" },
                  { name: "Bloom Agency", color: "#10D9A0" },
                  { name: "Pulse Studio", color: "#FF7A59" },
                ].map((b, i) => (
                  <motion.div
                    key={b.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border border-border/60 bg-white p-4 hover:shadow-md transition"
                  >
                    <div
                      className="size-7 rounded-lg mb-3 flex items-center justify-center font-heading font-bold text-white text-xs"
                      style={{ background: b.color }}
                    >
                      {b.name[0]}
                    </div>
                    <div className="text-xs font-medium truncate">{b.name}</div>
                    <div className="text-[10px] text-muted-foreground">app.{b.name.toLowerCase().replace(/\s/g, "")}.com</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Real-time */}
          <BentoCard className="col-span-12 md:col-span-6 lg:col-span-5 min-h-[170px]">
            <Pill icon={<Activity className="size-3.5" />} label="Real-time" />
            <h3 className="font-heading text-xl font-semibold tracking-tight mt-3">
              Live updates, no refresh
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              SSE-powered. Numbers tick up the moment a campaign converts.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full bg-mint animate-pulse" />
              <span className="text-mint font-medium">3 conversions in last 5 min</span>
            </div>
          </BentoCard>

          {/* AI */}
          <BentoCard
            className="col-span-12 md:col-span-6 lg:col-span-5 min-h-[170px]"
            bgClass="bg-gradient-to-br from-violet/[0.04] via-white to-coral/[0.04]"
            spotlightColor="rgba(255,122,89,0.20)"
          >
            <Pill icon={<Sparkles className="size-3.5" />} label="AI insights" />
            <h3 className="font-heading text-xl font-semibold tracking-tight mt-3">
              Insight that explains itself
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Plain-English summaries every Monday. With actions, not jargon.
            </p>
          </BentoCard>

          {/* Security */}
          <BentoCard className="col-span-12 md:col-span-7 lg:col-span-4 min-h-[200px]">
            <Pill icon={<Lock className="size-3.5" />} label="Security" />
            <h3 className="font-heading text-xl font-semibold tracking-tight mt-3">
              SOC2-grade by default
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Tokens encrypted at rest. RLS on every query. Audit log on every action.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["SOC2", "GDPR", "AES-256", "RLS"].map((b) => (
                <span key={b} className="px-2 py-0.5 rounded-md bg-foreground/5 text-foreground/70 text-[10px] font-medium tracking-wide">
                  {b}
                </span>
              ))}
            </div>
          </BentoCard>

          {/* Roles */}
          <BentoCard className="col-span-12 md:col-span-5 lg:col-span-4 min-h-[200px]">
            <Pill icon={<Users className="size-3.5" />} label="Team & clients" />
            <h3 className="font-heading text-xl font-semibold tracking-tight mt-3">
              5 roles, zero friction
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Owner, Admin, Staff, Client. Each sees exactly what they should — nothing more.
            </p>
          </BentoCard>

          {/* Performance */}
          <BentoCard
            className="col-span-12 lg:col-span-4 min-h-[200px]"
            bgClass="bg-foreground text-background"
            dark
            spotlightColor="rgba(91,71,224,0.32)"
          >
            <Pill
              icon={<ArrowUp className="size-3.5" />}
              label="Performance"
              dark
            />
            <h3 className="font-heading text-xl font-semibold tracking-tight mt-3">
              Built for 500+ clients
            </h3>
            <p className="text-sm text-background/70 mt-2 leading-relaxed">
              Roll-up dashboards aggregate metrics across your entire book of business.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Clients" value="528" dark />
              <Stat label="Reports / mo" value="12.4K" dark />
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  className = "",
  children,
  spotlightColor = "rgba(91,71,224,0.18)",
  dark = false,
  bgClass = "bg-white",
}: {
  className?: string;
  children: React.ReactNode;
  spotlightColor?: string;
  dark?: boolean;
  bgClass?: string;
}) {
  const borderClass = dark
    ? "border-white/10 hover:border-white/20"
    : "border-border/60 hover:border-foreground/15";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <Spotlight
        color={spotlightColor}
        size={420}
        className={`relative h-full rounded-2xl border ${borderClass} ${bgClass} hover:shadow-lg transition-all`}
      >
        <div className="relative p-6 lg:p-7 h-full">{children}</div>
      </Spotlight>
    </motion.div>
  );
}

function Pill({
  icon,
  label,
  dark = false,
}: {
  icon: React.ReactNode;
  label: string;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${
        dark
          ? "bg-white/10 text-white/80 border border-white/10"
          : "bg-secondary text-foreground/70 border border-border/60"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}

function Stat({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${dark ? "bg-white/5 border border-white/10" : "bg-secondary"}`}>
      <div className={`text-xs ${dark ? "text-background/60" : "text-muted-foreground"}`}>
        {label}
      </div>
      <div className={`font-heading font-semibold text-lg tabular tracking-tight mt-0.5 ${dark ? "text-background" : ""}`}>
        {value}
      </div>
    </div>
  );
}
