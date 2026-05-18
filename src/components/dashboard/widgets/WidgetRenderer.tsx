import { KPIWidget } from "./KPIWidget";
import { LineChartWidget } from "./LineChartWidget";
import { BarChartWidget } from "./BarChartWidget";
import { TableWidget } from "./TableWidget";
import { PieChartWidget } from "./PieChartWidget";
import { WidgetSkeleton } from "./WidgetSkeleton";
import { WidgetError } from "./WidgetError";
import { WidgetEmptyState } from "./WidgetEmptyState";
import { formatValue } from "@/lib/formatters";
import type { DashboardWidget } from "@/types/dashboard";

interface WidgetData {
  widgetId: string;
  widgetType: string;
  data: unknown;
}

interface WidgetRendererProps {
  widget: DashboardWidget;
  widgetData?: WidgetData;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function WidgetRenderer({
  widget,
  widgetData,
  isLoading,
  error,
  onRetry,
}: WidgetRendererProps) {
  if (error) {
    return <WidgetError message={error} onRetry={onRetry} />;
  }

  switch (widget.widgetType) {
    case "KPI": {
      if (isLoading) return <WidgetSkeleton type="kpi" />;
      if (!widgetData?.data) return <WidgetEmptyState message="No data for selected range" />;

      // Backend shape: { current: { metrics: { key: value } }, previous?: { metrics: {...} } }
      const kpiData = widgetData.data as Record<string, unknown>;
      const rawCurrent = kpiData.current as Record<string, unknown> | undefined;
      const rawPrevious = kpiData.previous as Record<string, unknown> | undefined;
      // Unwrap nested metrics object if present
      const current = (rawCurrent?.metrics ?? rawCurrent ?? {}) as Record<string, number>;
      const previous = (rawPrevious?.metrics ?? rawPrevious ?? {}) as Record<string, number>;

      const firstMetric = Object.keys(current).find((k) => typeof current[k] === "number");
      if (!firstMetric) return <WidgetEmptyState message="No data for selected range" />;
      const currentValue = current[firstMetric];
      const previousValue = previous[firstMetric] ?? 0;

      let trend;
      if (previousValue !== 0) {
        const percentChange = ((currentValue - previousValue) / previousValue) * 100;
        trend = { value: percentChange, isPositive: percentChange >= 0 };
      }

      return (
        <KPIWidget
          label={widget.config?.title || "Metric"}
          value={formatValue(currentValue, firstMetric)}
          trend={trend}
        />
      );
    }

    case "LINE_CHART": {
      if (isLoading) return <WidgetSkeleton type="chart" />;
      if (!Array.isArray(widgetData?.data) || widgetData.data.length === 0)
        return <WidgetEmptyState message="No data for selected range" />;

      // Backend shape: [{ period: "YYYY-MM-DD", metrics: { key: value } }]
      // Flatten to: [{ date: "YYYY-MM-DD", key: value }]
      const raw = widgetData.data as Array<Record<string, unknown>>;
      const chartData = raw.map((r) => {
        const metrics = (r.metrics ?? {}) as Record<string, number>;
        return { date: r.period ?? r.date, ...metrics };
      });
      const keys = chartData.length > 0 ? Object.keys(chartData[0]).filter((k) => k !== "date") : [];

      return (
        <LineChartWidget
          data={chartData as Parameters<typeof LineChartWidget>[0]["data"]}
          lines={keys.map((key, idx) => ({
            dataKey: key,
            stroke: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][idx % 4],
            label: key,
          }))}
        />
      );
    }

    case "BAR_CHART": {
      if (isLoading) return <WidgetSkeleton type="chart" />;
      if (!Array.isArray(widgetData?.data) || widgetData.data.length === 0)
        return <WidgetEmptyState message="No data for selected range" />;

      // Flatten backend shape same as LINE_CHART
      const raw = widgetData.data as Array<Record<string, unknown>>;
      const chartData = raw.map((r) => {
        const metrics = (r.metrics ?? {}) as Record<string, number>;
        return { name: r.period ?? r.date, ...metrics };
      });
      const keys = chartData.length > 0 ? Object.keys(chartData[0]).filter((k) => k !== "name") : [];

      return (
        <BarChartWidget
          data={chartData as Parameters<typeof BarChartWidget>[0]["data"]}
          bars={keys.map((key, idx) => ({
            dataKey: key,
            fill: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][idx % 4],
            label: key,
          }))}
        />
      );
    }

    case "TABLE": {
      if (isLoading) return <WidgetSkeleton type="table" />;
      if (!Array.isArray(widgetData?.data) || widgetData.data.length === 0)
        return <WidgetEmptyState message="No data for selected range" />;

      // Flatten backend shape: { period, metrics: {...} } → { Date, key: value }
      const raw = widgetData.data as Array<Record<string, unknown>>;
      const tableData = raw.map((r) => {
        const metrics = (r.metrics ?? {}) as Record<string, number>;
        return { Date: r.period ?? r.date, ...metrics };
      });
      const columns = Object.keys(tableData[0]).map((key) => ({
        key,
        label: key === "Date" ? "Date" : key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      }));

      return (
        <TableWidget
          columns={columns}
          rows={tableData as Parameters<typeof TableWidget>[0]["rows"]}
        />
      );
    }

    case "PIE_CHART": {
      if (isLoading) return <WidgetSkeleton type="chart" />;
      if (!Array.isArray(widgetData?.data) || widgetData.data.length === 0)
        return <WidgetEmptyState message="No data for selected range" />;

      // For pie chart, take the last period's metrics as name/value slices
      const raw = widgetData.data as Array<Record<string, unknown>>;
      const lastRow = raw[raw.length - 1];
      const metrics = (lastRow?.metrics ?? lastRow ?? {}) as Record<string, number>;
      const pieData = Object.entries(metrics)
        .filter(([k]) => k !== "period" && k !== "date")
        .map(([name, value]) => ({ name, value: Number(value) }));
      return <PieChartWidget data={pieData} />;
    }

    default:
      return <WidgetError message={`Unknown widget type: ${widget.widgetType}`} onRetry={onRetry} />;
  }
}
