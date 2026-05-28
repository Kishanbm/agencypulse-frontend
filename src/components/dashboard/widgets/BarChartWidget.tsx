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

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    fill?: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  
  // Filter out metrics that have a value of 0 or are not numbers
  const activePayload = payload.filter(item => typeof item.value === "number" && item.value > 0);
  if (activePayload.length === 0) return null;

  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      padding: "12px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      minWidth: "160px"
    }}>
      {label && (
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </span>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {activePayload.map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color || item.fill, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>
                {item.name.replace(/_/g, " ")}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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

  const isScrollable = safeData.length > 8;
  const chartWidth = isScrollable ? safeData.length * 60 : undefined;

  // Dynamically calculate barSize to ensure bars remain thick and readable
  const calculatedBarSize = isScrollable
    ? Math.max(6, Math.floor(45 / (bars.length || 1)))
    : safeData.length > 0 
      ? Math.max(8, Math.min(40, Math.floor(400 / (safeData.length * (bars.length || 1))))) 
      : undefined;
 
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Chart Scroll Wrapper */}
      <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div style={{ width: chartWidth ? `${chartWidth}px` : '100%', minWidth: '100%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeData} margin={{ top: 10, right: 10, left: 8, bottom: 0 }} barCategoryGap="15%" barGap={1}>
              <CartesianGrid stroke="#CBD5E1" strokeOpacity={0.7} strokeDasharray="3 3" strokeWidth={1} />
              <XAxis
                dataKey="name"
                className="text-[10px] font-medium"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                dy={10}
                tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
              />
              <YAxis
                className="text-[10px] font-medium"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={45}
                domain={[0, (dataMax: number) => Math.max(50, Math.ceil(dataMax / 10) * 10)]}
                tickCount={6}
                tickFormatter={(v: number) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000 ? `${(v / 1_000).toFixed(1)}k`
                  : String(v)
                }
              />
              <Tooltip
                shared={true}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={<CustomTooltip />}
              />
              {bars.map((bar) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  fill={bar.fill}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  name={bar.label}
                  barSize={calculatedBarSize}
                  maxBarSize={80}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 pb-1 shrink-0">
        {bars.map((bar) => (
          <div key={bar.dataKey} className="flex items-center gap-1.5">
            <div
              className="size-2.5 rounded-sm shrink-0"
              style={{ background: bar.fill }}
            />
            <span className="text-[11px] text-muted-foreground truncate max-w-[120px]" title={bar.label}>
              {bar.label.replace(/_/g, " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
