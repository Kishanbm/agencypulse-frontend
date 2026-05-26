import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const DEFAULT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];

interface PieSlice {
  name: string;
  value: number;
}

interface PieChartWidgetProps {
  data: PieSlice[];
  colors?: string[];
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: PieSlice & { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const total = item.payload.value;
  return (
    <div style={{
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
      padding: "8px 12px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.payload.fill, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
        {item.name.replace(/_/g, " ")}
      </span>
      <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: 4 }}>
        {total.toLocaleString()}
      </span>
    </div>
  );
}

export function PieChartWidget({ data, colors }: PieChartWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const resolvedColors = data.map((_, i) => colors?.[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="35%"
              outerRadius="60%"
              dataKey="value"
              stroke="none"
              label={false}
              labelLine={false}
              isAnimationActive={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={resolvedColors[index]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 pb-1 shrink-0">
        {data.map((slice, index) => (
          <div key={slice.name} className="flex items-center gap-1.5">
            <div
              className="size-2.5 rounded-sm shrink-0"
              style={{ background: resolvedColors[index] }}
            />
            <span className="text-[11px] text-muted-foreground truncate max-w-[120px]" title={slice.name}>
              {slice.name.replace(/_/g, " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
