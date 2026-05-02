import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Plug, LayoutDashboard, Send } from "lucide-react";
import { FadeIn } from "@/components/motion";

const STEPS = [
  {
    n: "01",
    icon: Plug,
    title: "Connect every channel",
    desc: "OAuth into Google, Meta, TikTok, GA4, HubSpot, and every platform your clients run on — three clicks each. We handle the token refresh forever.",
    accent: "violet",
  },
  {
    n: "02",
    icon: LayoutDashboard,
    title: "Build branded dashboards",
    desc: "Drag-drop widgets, blend metrics, save as templates. Reuse across every client. Your colors, your domain.",
    accent: "coral",
  },
  {
    n: "03",
    icon: Send,
    title: "Auto-send to clients",
    desc: "Schedule weekly PDFs or live links. Client portal logins for the engaged ones. AI summaries on every report.",
    accent: "mint",
  },
];

const accentMap = {
  violet: { fg: "text-violet", bg: "bg-violet/10", line: "from-violet/30" },
  coral: { fg: "text-coral", bg: "bg-coral/10", line: "from-coral/30" },
  mint: { fg: "text-mint", bg: "bg-mint/10", line: "from-mint/30" },
};

export function Workflow() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 20%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="py-24 lg:py-32 relative">
      <div className="mx-auto max-w-[1180px] px-4 lg:px-6">
        <FadeIn className="max-w-2xl mx-auto text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium tracking-wide mb-5">
            How it works
          </span>
          <h2 className="display-lg">
            From zero to{" "}
            <span className="text-gradient-violet">first client report</span>
            <span className="block">in under five minutes.</span>
          </h2>
        </FadeIn>

        <div ref={ref} className="relative max-w-4xl mx-auto">
          {/* Vertical scroll line */}
          <div className="absolute left-[35px] top-8 bottom-8 w-0.5 bg-border/60 hidden md:block">
            <motion.div
              className="absolute left-0 top-0 w-full bg-gradient-to-b from-violet via-coral to-mint origin-top"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="space-y-12">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const a = accentMap[s.accent as keyof typeof accentMap];
              return (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative grid md:grid-cols-[80px_1fr] gap-6 items-start"
                >
                  {/* Step number bubble */}
                  <div className="relative z-10">
                    <div className={`size-[72px] rounded-2xl ${a.bg} flex flex-col items-center justify-center border border-border/60 bg-white shadow-sm`}>
                      <span className={`text-[10px] font-mono tracking-widest ${a.fg} mb-0.5`}>STEP</span>
                      <span className="font-heading font-bold text-lg tracking-tight">{s.n}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="rounded-2xl border border-border/60 bg-white p-6 lg:p-8 hover:border-foreground/15 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`size-9 rounded-lg ${a.bg} ${a.fg} flex items-center justify-center`}>
                        <Icon className="size-4" />
                      </div>
                      <h3 className="font-heading font-semibold text-lg tracking-tight">
                        {s.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
