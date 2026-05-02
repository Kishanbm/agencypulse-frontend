import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  speed?: "slow" | "normal" | "fast";
}

/**
 * Infinite horizontal marquee. Children render twice for seamless loop.
 */
export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = true,
  speed = "normal",
}: MarqueeProps) {
  const speeds = { slow: "50s", normal: "32s", fast: "20s" };
  return (
    <div
      className={cn(
        "group flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,#000_8%,#000_92%,transparent_100%)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-full shrink-0 items-center gap-12 [animation:marquee_var(--marquee-duration)_linear_infinite]",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{ ["--marquee-duration" as string]: speeds[speed] }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
