import { motion, type HTMLMotionProps } from "motion/react";
import { type ReactNode } from "react";

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  y = 16,
  once = true,
  className,
  ...rest
}: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
