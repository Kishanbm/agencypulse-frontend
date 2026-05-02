import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/motion";

export function CTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-[1180px] px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[2rem] overflow-hidden border border-border/60 bg-foreground"
        >
          {/* Aurora */}
          <div className="absolute inset-0 opacity-80">
            <AuroraBackground tone="default" />
          </div>
          {/* Grid */}
          <div className="absolute inset-0 grid-bg opacity-[0.05]" />

          <div className="relative px-6 lg:px-16 py-16 lg:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-background/90 mb-6"
            >
              <Sparkles className="size-3.5" />
              <span className="text-xs font-medium">Built by agency operators, for agency operators</span>
            </motion.div>

            <h2 className="display-lg text-background max-w-3xl mx-auto">
              Stop building reports.{" "}
              <span className="block bg-gradient-to-r from-coral via-violet to-mint bg-clip-text text-transparent">
                Start growing your agency.
              </span>
            </h2>

            <p className="mt-6 text-lg text-background/70 max-w-xl mx-auto">
              Get every metric, every client, every channel — in one workspace your team and your
              clients will actually use.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register">
                <Button variant="gradient" size="2xl" className="min-w-[220px] shadow-xl">
                  Sign up free
                  <ArrowRight className="size-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="2xl"
                  className="min-w-[220px] bg-white/5 hover:bg-white/10 border-white/15 text-background hover:text-background"
                >
                  Sign in
                </Button>
              </Link>
            </div>

            <p className="mt-7 text-sm text-background/50">
              No credit card · Cancel anytime · 5-min setup
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
