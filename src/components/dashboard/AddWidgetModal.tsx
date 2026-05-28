import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import { PLATFORM_CATALOG } from "@/lib/platform-catalog";
import type { WidgetType, IntegrationPlatform, WidgetConfig } from "@/types/dashboard";

const WIDGET_TYPES: { value: WidgetType; label: string; description: string }[] = [
  { value: "KPI", label: "KPI Card", description: "Single metric summary" },
  { value: "LINE_CHART", label: "Line Chart", description: "Trend over time" },
  { value: "BAR_CHART", label: "Bar Chart", description: "Compare categories" },
  { value: "TABLE", label: "Table", description: "Detailed data rows" },
  { value: "PIE_CHART", label: "Pie Chart", description: "Distribution breakdown" },
];

interface AddWidgetModalProps {
  onClose: () => void;
  onAdd: (dto: {
    widgetType: WidgetType;
    platform: IntegrationPlatform;
    metricKeys: string[];
    config: WidgetConfig;
  }) => Promise<void>;
  connectedPlatforms: IntegrationPlatform[];
}

export function AddWidgetModal({ onClose, onAdd, connectedPlatforms }: AddWidgetModalProps) {
  const [step, setStep] = useState<"type" | "config">("type");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [widgetType, setWidgetType] = useState<WidgetType>("KPI");
  const [platform, setPlatform] = useState<IntegrationPlatform | "">("");
  const [metricKeys, setMetricKeys] = useState<string[]>([]);
  const [title, setTitle] = useState("");

  const { metrics, isLoading: metricsLoading } = useMetricDefinitions(
    platform ? (platform as IntegrationPlatform) : undefined
  );

  const handlePlatformChange = (p: IntegrationPlatform) => {
    setPlatform(p);
    setMetricKeys([]); // reset on platform change
  };

  const toggleMetric = (key: string) => {
    setMetricKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isGoogleSheets = platform === "GOOGLE_SHEETS";
  const canProceed = platform !== "" && title.trim() !== "" && (isGoogleSheets || metricKeys.length > 0);

  const handleAdd = async () => {
    if (!canProceed || !platform) return;
    setError(null);
    setIsAdding(true);
    try {
      await onAdd({
        widgetType,
        platform: platform as IntegrationPlatform,
        metricKeys: isGoogleSheets ? ["value"] : metricKeys,
        config: { title: title.trim() },
      });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to add widget");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Add Widget</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Widget Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Widget Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {WIDGET_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setWidgetType(t.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    widgetType === t.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-foreground"
                  }`}
                >
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sessions Overview"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Platform
            </label>
            <div className="space-y-1.5">
              {connectedPlatforms.map((platformKey) => {
                const entry = PLATFORM_CATALOG.find((c) => c.key === platformKey);
                const label = entry?.name ?? platformKey;
                const isSelected = platform === platformKey;
                return (
                  <button
                    key={platformKey}
                    type="button"
                    onClick={() => handlePlatformChange(platformKey as IntegrationPlatform)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      Connected
                    </span>
                  </button>
                );
              })}
            </div>
            {connectedPlatforms.length === 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                No platforms connected for this campaign yet.
              </p>
            )}
          </div>

          {/* Metrics (hidden for Google Sheets — configured per-widget after adding) */}
          {platform && !isGoogleSheets && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Metrics
              </label>
              {metricsLoading ? (
                <div className="space-y-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-7 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1 max-h-44 overflow-y-auto border border-border rounded-md p-2">
                  {metrics.map((m) => {
                    const selected = metricKeys.includes(m.metricKey);
                    return (
                      <div
                        key={m.metricKey}
                        onClick={(e) => { e.stopPropagation(); toggleMetric(m.metricKey); }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm ${
                          selected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {}}
                          className="accent-primary pointer-events-none"
                        />
                        <span>{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {metricKeys.length === 0 && !metricsLoading && (
                <p className="text-xs text-muted-foreground">Select at least one metric</p>
              )}
            </div>
          )}

          {/* Google Sheets info note */}
          {isGoogleSheets && (
            <div className="rounded-lg px-3.5 py-3 text-xs text-muted-foreground" style={{ background: "rgba(91,71,224,0.06)", border: "1px solid rgba(91,71,224,0.15)" }}>
              After adding the widget, click it in the dashboard editor to configure your spreadsheet, sheet tab, and column mapping.
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!canProceed || isAdding}
            className="bg-primary text-primary-foreground"
          >
            {isAdding ? (
              "Adding..."
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Widget
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
