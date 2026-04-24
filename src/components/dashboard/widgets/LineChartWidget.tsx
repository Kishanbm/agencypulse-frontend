import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LineChartData {
  date: string;
  [key: string]: string | number;
}

interface LineChartWidgetProps {
  data: LineChartData[];
  lines: {
    dataKey: string;
    stroke: string;
    label: string;
  }[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function LineChartWidget({
  data,
  lines,
  isLoading,
  error,
  onRetry,
}: LineChartWidgetProps) {
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
      <LineChart data={safeData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
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
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            dot={false}
            isAnimationActive={false}
            name={line.label}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
