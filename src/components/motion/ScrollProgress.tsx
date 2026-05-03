import { motion, useScroll, useSpring } from "motion/react";

/**
 * Top-of-page scroll progress bar — thin gradient line that fills as the user scrolls.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[100] pointer-events-none"
      style={{
        scaleX,
        background:
          "linear-gradient(90deg, #5B47E0 0%, #8B6FF5 35%, #FF7A59 70%, #10D9A0 100%)",
        boxShadow: "0 0 12px rgba(91,71,224,0.5)",
      }}
      aria-hidden
    />
  );
}
