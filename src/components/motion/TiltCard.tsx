import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees on either axis */
  max?: number;
  /** Lift on hover (px) */
  lift?: number;
}

/**
 * TiltCard — subtle 3D tilt that follows the cursor.
 * Light touch (default 6 deg) so it feels premium, not gimmicky.
 */
export function TiltCard({ children, className, max = 6, lift = 4 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), {
    stiffness: 250,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), {
    stiffness: 250,
    damping: 22,
  });
  const translateZ = useSpring(0, { stiffness: 250, damping: 22 });

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => translateZ.set(lift)}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
        translateZ.set(0);
      }}
      style={{
        rotateX,
        rotateY,
        z: translateZ,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
