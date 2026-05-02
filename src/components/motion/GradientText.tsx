import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  variant?: "violet" | "mint" | "coral";
}

export function GradientText({
  children,
  className,
  variant = "violet",
}: GradientTextProps) {
  const variants = {
    violet: "text-gradient-violet",
    mint: "bg-gradient-mint bg-clip-text text-transparent",
    coral: "bg-gradient-coral bg-clip-text text-transparent",
  };
  return (
    <span className={cn(variants[variant], className)}>{children}</span>
  );
}
