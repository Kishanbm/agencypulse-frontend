import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface BarChartWidgetProps {
  data: BarChartData[];
  bars: {
    dataKey: string;
    fill: string;
    label: string;
  }[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function BarChartWidget({
  data,
  bars,
  isLoading,
  error,
  onRetry,
}: BarChartWidgetProps) {
  if (isLoading) {
    return (
      <div className="h-full flex-1 w-full bg-muted/40 rounded-xl animate-pulse" />
    );
  }

  if (error) {
    return (
      <div className="h-full flex-1 w-full flex flex-col items-center justify-center space-y-3">
        <p className="text-sm font-medium text-red-600">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-primary font-medium hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const safeData = data ?? [];

  if (safeData.length === 0) {
    return (
      <div className="h-full flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={safeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#CBD5E1" strokeOpacity={0.7} strokeDasharray="3 3" strokeWidth={1} />
        <XAxis
          dataKey="name"
          className="text-[10px] font-medium"
          tick={{ fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis
          className="text-[10px] font-medium"
          tick={{ fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          dx={-10}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          contentStyle={{
            backgroundColor: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            padding: "12px 16px"
          }}
          itemStyle={{ fontSize: "13px", fontWeight: "600", padding: "2px 0" }}
          labelStyle={{ color: "var(--muted-foreground)", fontSize: "11px", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}
        />
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.fill}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            name={bar.label}
            maxBarSize={48}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
