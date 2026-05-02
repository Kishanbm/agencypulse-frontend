import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import type { DashboardWidget, WidgetType, IntegrationPlatform } from "@/types/dashboard";

const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: "KPI", label: "KPI Card" },
  { value: "LINE_CHART", label: "Line Chart" },
  { value: "BAR_CHART", label: "Bar Chart" },
  { value: "TABLE", label: "Table" },
  { value: "PIE_CHART", label: "Pie Chart" },
];

const PLATFORMS: { value: IntegrationPlatform; label: string }[] = [
  { value: "GA4", label: "Google Analytics 4" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "META_ADS", label: "Meta Ads" },
  { value: "GOOGLE_SEARCH_CONSOLE", label: "Search Console" },
  { value: "LINKEDIN_ADS", label: "LinkedIn Ads" },
];

interface WidgetConfigPanelProps {
  widget: DashboardWidget;
  onClose: () => void;
  onUpdate: (changes: Partial<Pick<DashboardWidget, "config" | "metricKeys" | "platform" | "widgetType">>) => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function WidgetConfigPanel({
  widget,
  onClose,
  onUpdate,
  onDelete,
  isDeleting,
}: WidgetConfigPanelProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { metrics, isLoading: metricsLoading } = useMetricDefinitions(widget.platform);

  const handleTitleChange = (title: string) => {
    onUpdate({ config: { ...widget.config, title } });
  };

  const handleTypeChange = (widgetType: WidgetType) => {
    onUpdate({ widgetType });
  };

  const handlePlatformChange = (platform: IntegrationPlatform) => {
    // Reset metricKeys when platform changes — metrics differ per platform
    onUpdate({ platform, metricKeys: [] });
  };

  const handleMetricToggle = (key: string) => {
    const current = widget.metricKeys ?? [];
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    onUpdate({ metricKeys: next });
  };

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    onDelete();
  };

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col max-h-[calc(100vh-8rem)] sticky top-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Widget Config</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Title
          </label>
          <input
            type="text"
            value={widget.config?.title ?? ""}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            placeholder="Widget title"
          />
        </div>

        {/* Widget Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Widget Type
          </label>
          <select
            value={widget.widgetType}
            onChange={(e) => handleTypeChange(e.target.value as WidgetType)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            {WIDGET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Platform */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Platform
          </label>
          <select
            value={widget.platform ?? ""}
            onChange={(e) => handlePlatformChange(e.target.value as IntegrationPlatform)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">Select platform</option>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Metrics */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Metrics
          </label>
          {!widget.platform ? (
            <p className="text-xs text-muted-foreground">Select a platform first</p>
          ) : metricsLoading ? (
            <div className="space-y-1.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-7 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : metrics.length === 0 ? (
            <p className="text-xs text-muted-foreground">No metrics available for this platform</p>
          ) : (
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {metrics.map((m) => {
                const selected = widget.metricKeys?.includes(m.metricKey);
                return (
                  <div
                    key={m.metricKey}
                    onClick={() => handleMetricToggle(m.metricKey)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer transition-colors text-sm ${
                      selected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!selected}
                      onChange={() => {}}
                      className="accent-primary pointer-events-none"
                    />
                    <span>{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
          {widget.metricKeys?.length === 0 && widget.platform && (
            <p className="text-xs text-destructive">At least one metric required</p>
          )}
        </div>
      </div>

      {/* Delete */}
      <div className="p-4 border-t border-border">
        {deleteConfirm ? (
          <div className="space-y-2">
            <p className="text-xs text-destructive font-medium">Remove this widget?</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Removing..." : "Yes, remove"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Remove Widget
          </Button>
        )}
      </div>
    </div>
  );
}
