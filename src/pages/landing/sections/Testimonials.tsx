import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";
import { FadeIn } from "@/components/motion";

const TESTIMONIALS = [
  {
    quote:
      "We replaced four tools with AgencyPulse. Reporting hours dropped 70%. Clients renew because the dashboards are gorgeous and clearly ours.",
    author: "Maya Chen",
    role: "Founder",
    agency: "Northwind Digital",
    rating: 5,
    metric: { value: "70%", label: "less reporting time" },
  },
  {
    quote:
      "The AI insights catch issues before our clients do. Last week it flagged a Meta CPA spike on a Saturday — we fixed it before Monday standup.",
    author: "James O'Connor",
    role: "Head of Performance",
    agency: "Pulse & Co.",
    rating: 5,
    metric: { value: "3.2x", label: "faster issue detection" },
  },
  {
    quote:
      "Onboarded 40 clients in two weeks. The white-label is real — our clients never know AgencyPulse exists. That's the killer feature.",
    author: "Aisha Patel",
    role: "Operations Director",
    agency: "Atlas Marketing",
    rating: 5,
    metric: { value: "40+", label: "clients in 2 weeks" },
  },
];

const STATS = [
  { value: "12K+", label: "agencies trust us" },
  { value: "$2.4B", label: "ad spend tracked monthly" },
  { value: "4.9/5", label: "G2 rating · 1,400 reviews" },
  { value: "99.95%", label: "uptime SLA" },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-foreground text-background relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 size-[500px] rounded-full bg-violet/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 size-[500px] rounded-full bg-coral/20 blur-3xl" />
      </div>
      <div className="absolute inset-0 grid-bg opacity-[0.05]" />

      <div className="relative mx-auto max-w-[1180px] px-4 lg:px-6">
        <FadeIn className="max-w-2xl mx-auto text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium tracking-wide mb-5">
            Loved by 12,000+ agencies
          </span>
          <h2 className="display-lg text-background">
            The reporting platform that{" "}
            <span className="bg-gradient-to-r from-coral via-violet to-mint bg-clip-text text-transparent">
              earns its seat
            </span>
          </h2>
        </FadeIn>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14 max-w-4xl mx-auto">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center px-3 py-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
            >
              <div className="font-heading font-bold text-3xl lg:text-4xl tabular tracking-tight bg-gradient-to-r from-background to-background/60 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-xs text-background/60 mt-1.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-7 hover:bg-white/[0.07] transition-colors"
            >
              <Quote className="size-7 text-violet/70" strokeWidth={1.5} />

              <p className="mt-4 text-base leading-relaxed text-background/90">
                "{t.quote}"
              </p>

              <div className="mt-6 flex items-center gap-3 pt-5 border-t border-white/10">
                <div
                  className="size-10 rounded-full flex items-center justify-center font-heading font-bold text-sm text-white"
                  style={{
                    background: ["#5B47E0", "#FF7A59", "#10D9A0"][i % 3],
                  }}
                >
                  {t.author[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-background">{t.author}</div>
                  <div className="text-xs text-background/60 truncate">
                    {t.role} · {t.agency}
                  </div>
                </div>
                <div className="flex">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="size-3.5 fill-amber text-amber" />
                  ))}
                </div>
              </div>

              <div className="mt-4 px-3 py-2 rounded-lg bg-white/[0.04] inline-flex items-center gap-2">
                <span className="font-heading font-bold text-violet text-base tabular">
                  {t.metric.value}
                </span>
                <span className="text-xs text-background/60">{t.metric.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
