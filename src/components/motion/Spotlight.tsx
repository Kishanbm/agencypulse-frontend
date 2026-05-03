import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
  /** Color of the spotlight glow — defaults to violet */
  color?: string;
  /** Size of the spotlight halo in pixels */
  size?: number;
  /** Disable the border ring overlay */
  noRing?: boolean;
}

/**
 * Spotlight — Apple/Linear-style cursor-follow glow on a card.
 * Tracks mouse position via motion values so we don't trigger React renders.
 */
export function Spotlight({
  children,
  className,
  color = "rgba(91,71,224,0.18)",
  size = 360,
  noRing = false,
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const [hovered, setHovered] = useState(false);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const background = useMotionTemplate`radial-gradient(${size}px circle at ${mouseX}px ${mouseY}px, ${color}, transparent 70%)`;

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Spotlight glow layer */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-0 transition-opacity duration-300"
        style={{ background, opacity: hovered ? 1 : 0 }}
        aria-hidden
      />
      {/* Subtle border ring on hover */}
      {!noRing && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            boxShadow: `inset 0 0 0 1px ${color.replace(/[\d.]+\)$/, "0.18)")}`,
          }}
          aria-hidden
        />
      )}
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  );
}
