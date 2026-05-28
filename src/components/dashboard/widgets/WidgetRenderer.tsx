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

function GoogleSheetsNotConfigured({ missing }: { missing: string[] }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-4">
      <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(91,71,224,0.08)" }}>
        <svg className="size-4" style={{ color: "#5B47E0" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-xs font-semibold text-foreground">Almost there!</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Click this widget to open the config panel, then fill in:
      </p>
      <div className="flex flex-col gap-1 mt-0.5">
        {missing.map((m) => (
          <span key={m} className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: "rgba(91,71,224,0.10)", color: "#5B47E0" }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function getGoogleSheetsNotConfigured(widget: DashboardWidget): string[] | null {
  if (widget.platform !== "GOOGLE_SHEETS") return null;
  const cfg = widget.config;
  if (!cfg?.spreadsheetId || !cfg?.sheetName) return ["Spreadsheet", "Sheet tab"];
  const missing: string[] = [];
  const t = widget.widgetType;
  // metric is optional when using count mode (__count__ or empty)
  if ((t === "LINE_CHART" || t === "BAR_CHART") && !cfg.dateColumn && !cfg.dimensionColumn) missing.push("Date column or Group column");
  if (t === "PIE_CHART" && !cfg.dimensionColumn) missing.push("Label column");
  return missing.length > 0 ? missing : null;
}

function BigQueryNotConfigured() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-4">
      <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(66,133,244,0.08)" }}>
        <svg className="size-4" style={{ color: "#4285F4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      </div>
      <p className="text-xs font-semibold text-foreground">SQL query required</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Click this widget to open the config panel and enter a BigQuery SQL query.
      </p>
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: "rgba(66,133,244,0.10)", color: "#4285F4" }}>
        SQL Query
      </span>
    </div>
  );
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

  if (!isLoading) {
    const missing = getGoogleSheetsNotConfigured(widget);
    if (missing) return <GoogleSheetsNotConfigured missing={missing} />;

    if (widget.platform === "GOOGLE_BIGQUERY" && !widget.config?.sqlQuery) {
      return <BigQueryNotConfigured />;
    }
  }

  switch (widget.widgetType) {
    case "KPI": {
      const kpiLabel = widget.config?.title || (widget.metricKeys?.[0] ?? "").replace(/_/g, " ");
      if (isLoading) return <WidgetSkeleton type="kpi" />;

      if (!widgetData?.data) {
        return (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground truncate leading-none">
              {kpiLabel}
            </p>
            <p className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: "rgba(0,0,0,0.12)" }}>—</p>
            <span className="text-[11px] text-muted-foreground/40 leading-none">No data</span>
          </div>
        );
      }

      const kpiData = widgetData.data as Record<string, unknown>;
      const rawCurrent = kpiData.current as Record<string, unknown> | undefined;
      const rawPrevious = kpiData.previous as Record<string, unknown> | undefined;
      const current = (rawCurrent?.metrics ?? rawCurrent ?? {}) as Record<string, number>;
      const previous = (rawPrevious?.metrics ?? rawPrevious ?? {}) as Record<string, number>;

      const firstMetric = Object.keys(current).find((k) => typeof current[k] === "number");
      if (!firstMetric) {
        return (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground truncate leading-none">
              {kpiLabel}
            </p>
            <p className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: "rgba(0,0,0,0.12)" }}>—</p>
            <span className="text-[11px] text-muted-foreground/40 leading-none">No data</span>
          </div>
        );
      }

      const currentValue = current[firstMetric];
      const previousValue = previous[firstMetric] ?? 0;

      let trend;
      if (previousValue !== 0) {
        const percentChange = ((currentValue - previousValue) / previousValue) * 100;
        trend = { value: percentChange, isPositive: percentChange >= 0 };
      }

      return (
        <KPIWidget
          label={kpiLabel}
          value={formatValue(currentValue, firstMetric)}
          trend={trend}
          labelColor={widget.config?.headerTextColor}
          valueColor={widget.config?.bodyTextColor}
          hideLabel
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
      const chartDataAll = raw.map((r) => {
        const metrics = (r.metrics ?? {}) as Record<string, number>;
        return { name: r.period ?? r.date, ...metrics };
      });

      const width = widget.position?.w ?? 6;
      let chartData = chartDataAll;

      if (width <= 6) {
        // Find all days that have active metric values
        const activeItems = chartDataAll.filter((item) => {
          return Object.entries(item).some(([key, val]) => {
            if (key === "name") return false;
            return typeof val === "number" && val > 0;
          });
        });

        if (activeItems.length >= 3) {
          // If we have plenty of active days, just display only the active ones
          chartData = activeItems;
        } else if (activeItems.length > 0) {
          // If we only have 1 or 2 active days, show a 3-day window ending on the last active day
          const lastActiveName = activeItems[activeItems.length - 1].name;
          const lastActiveIndex = chartDataAll.findIndex((item) => item.name === lastActiveName);
          const startIdx = Math.max(0, lastActiveIndex - 2);
          chartData = chartDataAll.slice(startIdx, lastActiveIndex + 1);
        } else {
          // If there's no data at all, fallback to showing the last 3 days
          chartData = chartDataAll.slice(-3);
        }
      }

      if (chartData.length === 0) {
        return <WidgetEmptyState message="No data to display" />;
      }

      const keys = Object.keys(chartData[0]).filter((k) => k !== "name");
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
        const metrics = (r.metrics ?? {}) as Record<string, unknown>;
        const dateVal = r.period ?? r.date;
        const row: Record<string, unknown> = {};
        if (dateVal) row["Date"] = dateVal;
        Object.assign(row, metrics);
        return row;
      });
      const columns = Object.keys(tableData[0] ?? {}).map((key) => ({
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
