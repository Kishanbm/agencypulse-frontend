import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
      <div className="h-full flex-1 w-full bg-muted/40 rounded-xl animate-pulse" />
    );
  }

  if (error) {
    return (
      <div className="h-full flex-1 w-full flex flex-col items-center justify-center space-y-3">
        <p className="text-sm text-red-600">{error}</p>
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
      <AreaChart data={safeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <defs>
          {lines.map((line) => (
            <linearGradient key={`color-${line.dataKey}`} id={`color-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={line.stroke} stopOpacity={0.2} />
              <stop offset="95%" stopColor={line.stroke} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="#CBD5E1" strokeOpacity={0.7} strokeDasharray="3 3" strokeWidth={1} />
        <XAxis
          dataKey="date"
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
        {lines.map((line) => (
          <Area
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#color-${line.dataKey})`}
            name={line.label}
            isAnimationActive={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
