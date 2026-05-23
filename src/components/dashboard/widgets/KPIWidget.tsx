import { TrendingUp, TrendingDown } from "lucide-react";

interface KPIWidgetProps {
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
}

export function KPIWidget({ label, value, trend }: KPIWidgetProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Metric label */}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground truncate leading-none">
        {label}
      </p>

      {/* Value */}
      <p className="text-[28px] font-extrabold text-foreground leading-none tracking-tight">
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
