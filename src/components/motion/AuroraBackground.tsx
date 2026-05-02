import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  children?: ReactNode;
  className?: string;
  /** Tone variant — default mixes violet+coral+mint */
  tone?: "default" | "soft" | "warm" | "cool";
}

/**
 * Aurora mesh background — flowing gradient blobs with grain.
 * Uses CSS keyframes so it doesn't burn React renders.
 */
export function AuroraBackground({
  children,
  className,
  tone = "default",
}: AuroraBackgroundProps) {
  const blobs = {
    default: [
      { color: "#5B47E0", x: "10%", y: "20%", size: "44rem", delay: "0s" },
      { color: "#FF7A59", x: "70%", y: "10%", size: "38rem", delay: "-6s" },
      { color: "#10D9A0", x: "40%", y: "70%", size: "42rem", delay: "-12s" },
      { color: "#8B6FF5", x: "85%", y: "60%", size: "32rem", delay: "-3s" },
    ],
    soft: [
      { color: "#5B47E0", x: "20%", y: "30%", size: "36rem", delay: "0s" },
      { color: "#8B6FF5", x: "75%", y: "20%", size: "32rem", delay: "-8s" },
      { color: "#EFEBFD", x: "50%", y: "75%", size: "38rem", delay: "-4s" },
    ],
    warm: [
      { color: "#FF7A59", x: "15%", y: "25%", size: "40rem", delay: "0s" },
      { color: "#F5A524", x: "70%", y: "15%", size: "34rem", delay: "-6s" },
      { color: "#5B47E0", x: "55%", y: "70%", size: "32rem", delay: "-10s" },
    ],
    cool: [
      { color: "#5B47E0", x: "20%", y: "30%", size: "38rem", delay: "0s" },
      { color: "#38BDF8", x: "70%", y: "20%", size: "34rem", delay: "-7s" },
      { color: "#10D9A0", x: "50%", y: "70%", size: "36rem", delay: "-3s" },
    ],
  }[tone];

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-[0.45] mix-blend-multiply blur-3xl"
          style={{
            background: b.color,
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            transform: "translate(-50%, -50%)",
            animation: `aurora 18s ease-in-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 noise-bg opacity-60" />
      {children}
    </div>
  );
}
