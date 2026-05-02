import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, MessageCircle, Mail } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    q: "How does the 14-day free trial work?",
    a: "Sign up with your email — no card required. You get full access to every feature on the Agency plan for 14 days. After that, pick a plan or your account pauses (your data stays). No surprise charges, ever.",
  },
  {
    q: "Can I really white-label the entire platform?",
    a: "Yes. Every Agency plan includes custom domain, full logo & color theming, custom email sender, and complete removal of AgencyPulse branding. Your clients log into app.youragency.com and never know we exist.",
  },
  {
    q: "Which integrations are supported?",
    a: "Every major ad platform, analytics tool, CRM, email tool, and e-commerce stack — Google Ads, Meta, GA4, TikTok, LinkedIn, HubSpot, Mailchimp, Shopify, Klaviyo, Salesforce, Stripe, and more. New integrations ship every quarter based on customer requests.",
  },
  {
    q: "How does AgencyPulse protect client data?",
    a: "OAuth tokens are AES-256-GCM encrypted at rest. PostgreSQL Row Level Security enforces tenant isolation on every query. We're SOC2 Type II certified and GDPR compliant. Daily backups, 99.95% uptime SLA.",
  },
  {
    q: "Can my clients log in to view their own dashboards?",
    a: "Yes — every plan includes branded read-only client portals. Invite client users via email and they see only their own data, on your domain, with your colors. Engagement metrics included.",
  },
  {
    q: "Do you offer a discount for nonprofits or solo operators?",
    a: "Yes — registered nonprofits get 30% off all plans. Solo operators on the Launch plan can apply for our Founder Program (50% off year one) — email founders@agencypulse.com.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 lg:py-32 relative">
      <div className="mx-auto max-w-[1180px] px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left column — heading + support card (sticky on desktop) */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <FadeIn>
                <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium tracking-wide mb-5">
                  FAQ
                </span>
                <h2 className="display-md">
                  Questions,{" "}
                  <span className="text-gradient-violet">answered.</span>
                </h2>
                <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                  The things prospective customers ask us most. Still curious? Our team responds in
                  under an hour.
                </p>
              </FadeIn>

              {/* Support card */}
              <FadeIn delay={0.15}>
                <div className="mt-8 rounded-2xl border border-border/60 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {["#5B47E0", "#FF7A59", "#10D9A0"].map((c, i) => (
                        <div
                          key={i}
                          className="size-9 rounded-full border-2 border-white flex items-center justify-center text-white font-heading font-semibold text-xs"
                          style={{ background: c }}
                        >
                          {["M", "J", "A"][i]}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Real people, fast replies</div>
                      <div className="inline-flex items-center gap-1.5 text-xs text-mint mt-0.5">
                        <span className="size-1.5 rounded-full bg-mint animate-pulse" />
                        Online · avg reply &lt;1 hour
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <a
                      href="mailto:hello@agencypulse.com"
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/60 hover:border-foreground/15 hover:bg-secondary/50 transition group"
                    >
                      <div className="size-8 rounded-lg bg-violet/10 text-violet flex items-center justify-center">
                        <Mail className="size-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Email</div>
                        <div className="text-sm font-medium">hello@agencypulse.com</div>
                      </div>
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/60 hover:border-foreground/15 hover:bg-secondary/50 transition group"
                    >
                      <div className="size-8 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
                        <MessageCircle className="size-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Live chat</div>
                        <div className="text-sm font-medium">Talk to us right now</div>
                      </div>
                    </a>
                  </div>

                  <div className="mt-5 pt-5 border-t border-border/60">
                    <Button variant="outline" size="lg" className="w-full">
                      Book a 15-min demo
                    </Button>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Right column — Q&A list */}
          <div className="lg:col-span-7 space-y-3">
            {FAQS.map((f, i) => (
              <FAQItem key={f.q} q={f.q} a={f.a} index={i} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQItem({
  q,
  a,
  index,
  defaultOpen = false,
}: {
  q: string;
  a: string;
  index: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="rounded-2xl border border-border/60 bg-white overflow-hidden hover:border-foreground/15 transition-colors"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 lg:p-6 text-left group"
      >
        <span className="font-heading font-semibold text-base lg:text-lg tracking-tight">
          {q}
        </span>
        <div
          className={`size-9 shrink-0 rounded-full flex items-center justify-center transition-all ${
            open ? "bg-violet text-white rotate-45" : "bg-secondary group-hover:bg-foreground group-hover:text-background"
          }`}
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 lg:px-6 pb-5 lg:pb-6 text-muted-foreground leading-relaxed">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
