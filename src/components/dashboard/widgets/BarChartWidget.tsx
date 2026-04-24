import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
      <div className="h-80 bg-muted rounded animate-pulse" />
    );
  }

  if (error) {
    return (
      <div className="h-80 flex flex-col items-center justify-center space-y-3">
        <p className="text-sm text-red-600">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-primary hover:underline"
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
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={safeData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="name"
          className="text-xs"
          tick={{ fill: "var(--muted-foreground)" }}
        />
        <YAxis className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
          }}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Legend />
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.fill}
            isAnimationActive={false}
            name={bar.label}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
