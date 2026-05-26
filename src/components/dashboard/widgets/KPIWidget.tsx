import { TrendingUp, TrendingDown } from "lucide-react";

interface KPIWidgetProps {
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  labelColor?: string;
  valueColor?: string;
  hideLabel?: boolean;
}

export function KPIWidget({ label, value, trend, labelColor, valueColor, hideLabel }: KPIWidgetProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Metric label — hidden when the card header already shows the title */}
      {!hideLabel && (
        <p
          className="text-[11px] font-semibold uppercase tracking-widest truncate leading-none"
          style={{ color: labelColor || "var(--muted-foreground)" }}
        >
          {label}
        </p>
      )}

      {/* Value */}
      <p
        className="text-[28px] font-extrabold leading-none tracking-tight"
        style={{ color: valueColor || "var(--foreground)" }}
      >
        {value}
      </p>

      {/* Trend */}
      {trend ? (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit leading-none"
          style={{
            background: trend.isPositive ? "var(--success)" : "var(--destructive)",
            color: "#FFFFFF",
          }}
        >
          {trend.isPositive
            ? <TrendingUp className="size-3 stroke-[3]" />
            : <TrendingDown className="size-3 stroke-[3]" />}
          {Math.abs(trend.value).toFixed(1)}%
        </span>
      ) : (
        <span className="text-[12px] text-muted-foreground/40 leading-none">—</span>
      )}
    </div>
  );
}
