import { KPIWidget } from "./KPIWidget";
import { LineChartWidget } from "./LineChartWidget";
import { BarChartWidget } from "./BarChartWidget";
import { TableWidget } from "./TableWidget";
import { PieChartWidget } from "./PieChartWidget";
import { WidgetSkeleton } from "./WidgetSkeleton";
import { WidgetError } from "./WidgetError";
import { WidgetEmptyState } from "./WidgetEmptyState";
import { formatValue } from "@/src/lib/formatters";
import type { DashboardWidget } from "@/src/types/dashboard";

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
      const current = (kpiData.current as Record<string, number>) || {};
      const previous = (kpiData.previous as Record<string, number>) || {};
      const firstMetric = Object.keys(current)[0];
      const currentValue = firstMetric ? current[firstMetric] : 0;
      const previousValue = firstMetric ? previous[firstMetric] : 0;

      let trend;
      if (previousValue && previousValue !== 0) {
        const percentChange = ((currentValue - previousValue) / previousValue) * 100;
        trend = { value: percentChange, isPositive: percentChange >= 0 };
      }

      return (
        <KPIWidget
          label={widget.config?.title || "Metric"}
          value={formatValue(currentValue, firstMetric || "")}
          trend={trend}
        />
      );
    }

    case "LINE_CHART": {
      if (isLoading) return <WidgetSkeleton type="chart" />;
      if (!Array.isArray(widgetData?.data) || widgetData.data.length === 0)
        return <WidgetEmptyState message="No data for selected range" />;

      const chartData = (widgetData.data ?? []) as Array<Record<string, unknown>>;
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

      const chartData = (widgetData.data ?? []) as Array<Record<string, unknown>>;
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

      const tableData = (widgetData.data ?? []) as Array<Record<string, unknown>>;
      const columns = Object.keys(tableData[0]).map((key) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
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

      const pieData = widgetData.data as Array<{ name: string; value: number }>;
      return <PieChartWidget data={pieData} />;
    }

    default:
      return <WidgetError message={`Unknown widget type: ${widget.widgetType}`} onRetry={onRetry} />;
  }
}
