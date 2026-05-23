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

      const kpiData = widgetData.data as Record<string, unknown>;
      const rawCurrent = kpiData.current as Record<string, unknown> | undefined;
      const rawPrevious = kpiData.previous as Record<string, unknown> | undefined;
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
          label={widget.config?.title || firstMetric}
          value={formatValue(currentValue, firstMetric)}
          trend={trend}
        />
      );
    }

    case "LINE_CHART": {
      if (isLoading) return <WidgetSkeleton type="chart" />;
      if (!Array.isArray(widgetData?.data) || widgetData.data.length === 0)
        return <WidgetEmptyState message="No data for selected range" />;

      const raw = widgetData.data as Array<Record<string, unknown>>;
      const chartData = raw.map((r) => {
        const metrics = (r.metrics ?? {}) as Record<string, number>;
        return { date: r.period ?? r.date, ...metrics };
      });
      const keys = chartData.length > 0 ? Object.keys(chartData[0]).filter((k) => k !== "date") : [];

      const lineDefaults = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
      return (
        <LineChartWidget
          data={chartData as Parameters<typeof LineChartWidget>[0]["data"]}
          lines={keys.map((key, idx) => ({
            dataKey: key,
            stroke: widget.config?.chartColors?.[idx] || lineDefaults[idx % 4],
            label: key,
          }))}
        />
      );
    }

    case "BAR_CHART": {
      if (isLoading) return <WidgetSkeleton type="chart" />;
      if (!Array.isArray(widgetData?.data) || widgetData.data.length === 0)
        return <WidgetEmptyState message="No data for selected range" />;

      const raw = widgetData.data as Array<Record<string, unknown>>;
      const chartData = raw.map((r) => {
        const metrics = (r.metrics ?? {}) as Record<string, number>;
        return { name: r.period ?? r.date, ...metrics };
      });
      const keys = chartData.length > 0 ? Object.keys(chartData[0]).filter((k) => k !== "name") : [];

      const barDefaults = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
      return (
        <BarChartWidget
          data={chartData as Parameters<typeof BarChartWidget>[0]["data"]}
          bars={keys.map((key, idx) => ({
            dataKey: key,
            fill: widget.config?.chartColors?.[idx] || barDefaults[idx % 4],
            label: key,
          }))}
        />
      );
    }

    case "TABLE": {
      if (isLoading) return <WidgetSkeleton type="table" />;
      if (!Array.isArray(widgetData?.data) || widgetData.data.length === 0)
        return <WidgetEmptyState message="No data for selected range" />;

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

      const raw = widgetData.data as Array<Record<string, unknown>>;
      // Sum all rows per metric key so pie shows totals across the date range
      const totals: Record<string, number> = {};
      raw.forEach((row) => {
        const metrics = (row.metrics ?? row ?? {}) as Record<string, unknown>;
        Object.entries(metrics).forEach(([k, v]) => {
          if (k === "period" || k === "date") return;
          if (typeof v === "number") totals[k] = (totals[k] ?? 0) + v;
        });
      });
      const pieData = Object.entries(totals)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }));
      if (pieData.length === 0) return <WidgetEmptyState message="No data for selected range" />;
      return <PieChartWidget data={pieData} colors={widget.config?.chartColors} />;
    }

    default:
      return <WidgetError message={`Unknown widget type: ${widget.widgetType}`} onRetry={onRetry} />;
  }
}
