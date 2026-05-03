import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, Spotlight } from "@/components/motion";

const PLANS = [
  {
    name: "Launch",
    description: "For solo operators getting their first 5 clients live.",
    monthly: 49,
    yearly: 39,
    features: [
      "Up to 5 client workspaces",
      "20 dashboards",
      "All integrations included",
      "Weekly automated reports",
      "Email support",
    ],
    accent: "default",
    cta: "Sign up free",
  },
  {
    name: "Agency",
    description: "Scale to 50 clients with white-label and team roles.",
    monthly: 149,
    yearly: 119,
    features: [
      "Up to 50 client workspaces",
      "Unlimited dashboards",
      "Full white-label + custom domain",
      "AI insights & narrative reports",
      "Client portals & team roles",
      "Priority chat support",
    ],
    accent: "featured",
    cta: "Sign up free",
    badge: "Most popular",
  },
  {
    name: "Scale",
    description: "For agencies running 100+ clients with custom infra.",
    monthly: null,
    yearly: null,
    features: [
      "Unlimited client workspaces",
      "Roll-up dashboards",
      "SSO & SCIM",
      "Dedicated success manager",
      "99.99% SLA + custom DPA",
      "On-prem data residency",
    ],
    accent: "default",
    cta: "Talk to sales",
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 dot-bg opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_60%)]" />

      {/* Subtle drifting orbs */}
      <motion.div
        aria-hidden
        className="absolute top-1/3 left-[10%] size-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,71,224,0.10) 0%, transparent 70%)', filter: 'blur(50px)' }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="mx-auto max-w-[1180px] px-4 lg:px-6 relative">
        <FadeIn className="max-w-2xl mx-auto text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium tracking-wide mb-5">
            Pricing
          </span>
          <h2 className="display-lg">
            Simple pricing that{" "}
            <span className="text-gradient-violet">scales with you</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </FadeIn>

        {/* Billing toggle */}
        <FadeIn delay={0.15} className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border/60 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                !yearly ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                yearly ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-mint text-mint-foreground font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {PLANS.map((p, i) => {
            const featured = p.accent === "featured";
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="relative"
              >
                {/* Soft static glow halo behind featured card */}
                {featured && (
                  <div
                    aria-hidden
                    className="absolute -inset-4 rounded-3xl -z-10 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(91,71,224,0.18) 0%, rgba(255,122,89,0.08) 50%, transparent 80%)",
                      filter: "blur(20px)",
                    }}
                  />
                )}

                {/* "Most popular" badge — sits OUTSIDE Spotlight so it doesn't clip */}
                {featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, y: -4 }}
                      whileInView={{ scale: 1, opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                      className="px-3 py-1 rounded-full bg-gradient-violet text-white text-[11px] font-semibold shadow-lg shadow-violet/30 inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Sparkles className="size-3" />
                      {p.badge}
                    </motion.div>
                  </div>
                )}

                <Spotlight
                  color={featured ? "rgba(91,71,224,0.22)" : "rgba(91,71,224,0.14)"}
                  size={420}
                  className={`relative rounded-2xl border ${
                    featured
                      ? "border-violet/40 bg-white shadow-2xl shadow-violet/10"
                      : "border-border/60 bg-white"
                  }`}
                >
                  <div className="relative p-7">
                    {featured && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-violet/60 to-transparent" />
                    )}

                    <h3 className="font-heading font-semibold text-lg tracking-tight">
                      {p.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1.5 min-h-[40px]">{p.description}</p>

                    <div className="mt-6 mb-6 min-h-[64px]">
                      {p.monthly !== null ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-heading font-bold text-5xl tabular tracking-tighter">
                            ${yearly ? p.yearly : p.monthly}
                          </span>
                          <span className="text-sm text-muted-foreground">/ mo</span>
                        </div>
                      ) : (
                        <div className="font-heading font-bold text-3xl tracking-tight">
                          Custom
                        </div>
                      )}
                      {p.monthly !== null && yearly && (
                        <div className="text-xs text-muted-foreground mt-1.5">
                          billed yearly · ${(p.yearly ?? 0) * 12}/yr
                        </div>
                      )}
                    </div>

                    <Link to={p.monthly === null ? "/register" : "/register"}>
                      <Button
                        variant={featured ? "gradient" : "outline"}
                        size="lg"
                        className="w-full h-11 text-sm"
                      >
                        {p.cta}
                      </Button>
                    </Link>

                    <ul className="mt-7 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <div
                            className={`mt-0.5 size-4 rounded-full flex items-center justify-center shrink-0 ${
                              featured ? "bg-violet/10" : "bg-mint/10"
                            }`}
                          >
                            <Check className={`size-2.5 ${featured ? "text-violet" : "text-mint"}`} strokeWidth={3} />
                          </div>
                          <span className="text-foreground/80">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Spotlight>
              </motion.div>
            );
          })}
        </div>

        <FadeIn delay={0.3} className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include unlimited team members, SSL, daily backups, and 99.95% uptime SLA.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
