import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface BeamDividerProps {
  className?: string;
  /** Tone of the beam */
  tone?: "violet" | "warm" | "cool";
}

/**
 * BeamDivider — animated gradient beam line between sections.
 * A horizontal hairline that breathes opacity, with a moving "scan" highlight.
 */
export function BeamDivider({ className, tone = "violet" }: BeamDividerProps) {
  const grad = {
    violet:
      "linear-gradient(90deg, transparent 0%, rgba(91,71,224,0.45) 50%, transparent 100%)",
    warm:
      "linear-gradient(90deg, transparent 0%, rgba(255,122,89,0.45) 50%, transparent 100%)",
    cool:
      "linear-gradient(90deg, transparent 0%, rgba(16,217,160,0.45) 50%, transparent 100%)",
  }[tone];

  const scanColor = {
    violet: "rgba(91,71,224,0.9)",
    warm: "rgba(255,122,89,0.9)",
    cool: "rgba(16,217,160,0.9)",
  }[tone];

  return (
    <div
      className={cn(
        "relative h-px w-full max-w-[1180px] mx-auto overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {/* Static gradient line */}
      <div className="absolute inset-0" style={{ background: grad }} />
      {/* Moving scan highlight */}
      <motion.div
        className="absolute top-0 h-full w-[120px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${scanColor}, transparent)`,
          filter: "blur(1px)",
        }}
        animate={{ x: ["-150px", "calc(100vw + 50px)"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
