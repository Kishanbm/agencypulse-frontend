import NumberFlow from "@number-flow/react";
import type { ComponentProps } from "react";

type Format = ComponentProps<typeof NumberFlow>["format"];

interface AnimatedNumberProps {
  value: number;
  format?: Format;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Animated number counter — uses @number-flow/react for buttery smooth digit transitions.
 */
export function AnimatedNumber({
  value,
  format,
  prefix,
  suffix,
  className,
}: AnimatedNumberProps) {
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix ? <span>{prefix}</span> : null}
      <NumberFlow value={value} format={format} />
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}
