import { motion, type HTMLMotionProps } from "motion/react";
import { type ReactNode } from "react";

interface StaggerProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delayChildren?: number;
  staggerChildren?: number;
  once?: boolean;
}

export function Stagger({
  children,
  delayChildren = 0,
  staggerChildren = 0.06,
  once = true,
  className,
  ...rest
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            delayChildren,
            staggerChildren,
          },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  y?: number;
}

export function StaggerItem({ children, y = 14, className, ...rest }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
