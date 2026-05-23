import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import type { DashboardWidget, WidgetType, IntegrationPlatform } from "@/types/dashboard";

const CHART_DEFAULTS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316"];

function isLight(hex: string): boolean {
  try {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  } catch { return true; }
}

const COLOR_TARGETS = [
  { key: "headerColor" as const,     label: "Header bg",   default: "#F5F5F2" },
  { key: "headerTextColor" as const, label: "Header text", default: "#9CA3AF" },
  { key: "bodyColor" as const,       label: "Card bg",     default: "#FFFFFF" },
  { key: "bodyTextColor" as const,   label: "Card text",   default: "#111827" },
];

function ColorTargetPanel({
  widget,
  onUpdate,
}: {
  widget: DashboardWidget;
  onUpdate: (changes: Partial<Pick<DashboardWidget, "config">>) => void;
}) {
  const [activeKey, setActiveKey] = useState<typeof COLOR_TARGETS[number]["key"]>("headerColor");
  const [hexInput, setHexInput] = useState("");

  const activeTarget = COLOR_TARGETS.find((t) => t.key === activeKey)!;
  const currentValue: string = (widget.config?.[activeKey] as string | undefined) || activeTarget.default;

  useEffect(() => {
    setHexInput((widget.config?.[activeKey] as string | undefined) ?? "");
  }, [activeKey, widget.config]);

  const apply = (color: string) => {
    const clean = color.startsWith("#") ? color : `#${color}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      onUpdate({ config: { ...widget.config, [activeKey]: clean } });
      setHexInput(clean);
    }
  };

  const reset = () => {
    onUpdate({ config: { ...widget.config, [activeKey]: undefined } });
    setHexInput("");
  };

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">Colors</label>

      {/* Target selector — 2×2 grid of chips */}
      <div className="grid grid-cols-2 gap-1.5">
        {COLOR_TARGETS.map((t) => {
          const val: string = (widget.config?.[t.key] as string | undefined) || t.default;
          const isActive = activeKey === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveKey(t.key)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
              style={{
                border: isActive ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                background: isActive ? "rgba(91,71,224,0.06)" : "var(--muted)",
              }}
            >
              <div
                className="size-5 rounded-md shrink-0 border"
                style={{
                  background: val,
                  borderColor: isLight(val) ? "#D1D5DB" : "transparent",
                }}
              />
              <span className="text-[11px] font-medium text-foreground truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Color picker — large swatch (opens native picker) + hex input */}
      <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center justify-between flex-1 gap-2">
          <label className="relative cursor-pointer shrink-0 group">
            <div
              className="size-10 rounded-xl border-2 shadow-md transition-transform group-hover:scale-105"
              style={{
                background: currentValue,
                borderColor: isLight(currentValue) ? "#D1D5DB" : "rgba(255,255,255,0.2)",
              }}
              title="Click to open color picker"
            />
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(currentValue) ? currentValue : activeTarget.default}
              onChange={(e) => apply(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={(e) => apply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply(hexInput)}
            maxLength={7}
            placeholder={activeTarget.default}
            className="flex-1 px-2.5 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
          />
          {widget.config?.[activeKey] && (
            <button onClick={reset} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0">Reset</button>
          )}
        </div>
      </div>
    </div>
  );
}

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

// Preset sizes: label → grid cols (w) × grid height-units (h)
// W mapping: 1=3cols(25%), 2=6cols(50%), 3=9cols(75%), 4=12cols(100%)
// H mapping: 1=3units(~150px), 2=5units(~260px), 3=8units(~420px)
const SIZE_PRESETS = [
  { label: "1×1", w: 3,  h: 3 },
  { label: "2×1", w: 6,  h: 3 },
  { label: "3×1", w: 9,  h: 3 },
  { label: "4×1", w: 12, h: 3 },
  { label: "1×2", w: 3,  h: 5 },
  { label: "2×2", w: 6,  h: 5 },
  { label: "3×2", w: 9,  h: 5 },
  { label: "4×2", w: 12, h: 5 },
  { label: "1×3", w: 3,  h: 8 },
  { label: "2×3", w: 6,  h: 8 },
  { label: "3×3", w: 9,  h: 8 },
  { label: "4×3", w: 12, h: 8 },
];

interface WidgetConfigPanelProps {
  widget: DashboardWidget;
  onClose: () => void;
  onUpdate: (changes: Partial<Pick<DashboardWidget, "config" | "metricKeys" | "platform" | "widgetType">>) => void;
  onResize: (w: number, h: number) => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function WidgetConfigPanel({
  widget,
  onClose,
  onUpdate,
  onResize,
  onDelete,
  isDeleting,
}: WidgetConfigPanelProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [customW, setCustomW] = useState(String(widget.position.w));
  const [customH, setCustomH] = useState(String(widget.position.h));
  const { metrics, isLoading: metricsLoading } = useMetricDefinitions(widget.platform);

  // Keep custom fields in sync when position changes externally (e.g. drag resize)
  useEffect(() => {
    setCustomW(String(widget.position.w));
    setCustomH(String(widget.position.h));
  }, [widget.position.w, widget.position.h]);

  const handleTitleChange = (title: string) => onUpdate({ config: { ...widget.config, title } });
  const handleTypeChange = (widgetType: WidgetType) => onUpdate({ widgetType });
  const handlePlatformChange = (platform: IntegrationPlatform) => onUpdate({ platform, metricKeys: [] });
  const handleMetricToggle = (key: string) => {
    const current = widget.metricKeys ?? [];
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    onUpdate({ metricKeys: next });
  };

  const handleDelete = () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    onDelete();
  };

  const applyCustomSize = () => {
    const w = Math.max(1, Math.min(12, parseInt(customW) || widget.position.w));
    const h = Math.max(1, Math.min(20, parseInt(customH) || widget.position.h));
    setCustomW(String(w));
    setCustomH(String(h));
    onResize(w, h);
  };

  // Detect current active size preset
  const activePreset = SIZE_PRESETS.find(
    (p) => p.w === widget.position.w && p.h === widget.position.h
  );

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col max-h-[calc(100vh-8rem)] sticky top-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Widget Config</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</label>
          <input
            type="text"
            value={widget.config?.title ?? ""}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            placeholder="Widget title"
          />
        </div>

        {/* Size presets */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Size</label>
          <div className="grid grid-cols-4 gap-1.5">
            {SIZE_PRESETS.map((preset) => {
              const isActive = activePreset?.label === preset.label;
              return (
                <button
                  key={preset.label}
                  onClick={() => onResize(preset.w, preset.h)}
                  className="h-8 rounded-md text-[11px] font-semibold transition-all"
                  style={{
                    background: isActive ? "var(--primary)" : "var(--muted)",
                    color: isActive ? "#FFFFFF" : "var(--muted-foreground)",
                    border: isActive ? "none" : "1px solid var(--border)",
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">Width × Height (drag handles also work)</p>

          {/* Custom size */}
          <div className="pt-1 space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Custom</p>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground shrink-0">W</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCustomSize()}
                  className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-center"
                />
              </div>
              <div className="flex-1 flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground shrink-0">H</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={customH}
                  onChange={(e) => setCustomH(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCustomSize()}
                  className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-center"
                />
              </div>
              <button
                onClick={applyCustomSize}
                className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all shrink-0"
                style={{ background: "var(--primary)", color: "#FFFFFF" }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Card Colors */}
        <ColorTargetPanel widget={widget} onUpdate={onUpdate} />

        {/* Chart / Pie Colors — only for chart widget types */}
        {(widget.widgetType === "LINE_CHART" || widget.widgetType === "BAR_CHART" || widget.widgetType === "PIE_CHART") && (
          <div className="border-t border-border pt-4 space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
              {widget.widgetType === "PIE_CHART" ? "Slice Colors" : "Series Colors"}
            </label>
            {(widget.metricKeys ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">Add metrics to configure colors</p>
            ) : (
              <div className="space-y-2">
                {(widget.metricKeys ?? []).map((key, idx) => {
                  const current = widget.config?.chartColors?.[idx] || CHART_DEFAULTS[idx % CHART_DEFAULTS.length];
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <label className="relative cursor-pointer shrink-0 group">
                        <div
                          className="size-8 rounded-lg border-2 shadow-sm transition-transform group-hover:scale-105"
                          style={{ background: current, borderColor: isLight(current) ? "#D1D5DB" : "rgba(255,255,255,0.2)" }}
                          title="Click to pick color"
                        />
                        <input
                          type="color"
                          value={/^#[0-9A-Fa-f]{6}$/.test(current) ? current : CHART_DEFAULTS[idx % CHART_DEFAULTS.length]}
                          onChange={(e) => {
                            const next = [...(widget.config?.chartColors ?? CHART_DEFAULTS.slice(0, widget.metricKeys?.length ?? 1))];
                            // ensure array is long enough
                            while (next.length <= idx) next.push(CHART_DEFAULTS[next.length % CHART_DEFAULTS.length]);
                            next[idx] = e.target.value;
                            onUpdate({ config: { ...widget.config, chartColors: next } });
                          }}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </label>
                      <span className="flex-1 text-xs text-foreground truncate">{key.replace(/_/g, " ")}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{current}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Widget Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Widget Type</label>
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
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Platform</label>
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
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Metrics</label>
          {!widget.platform ? (
            <p className="text-xs text-muted-foreground">Select a platform first</p>
          ) : metricsLoading ? (
            <div className="space-y-1.5">
              {[...Array(4)].map((_, i) => <div key={i} className="h-7 bg-muted rounded animate-pulse" />)}
            </div>
          ) : metrics.length === 0 ? (
            <p className="text-xs text-muted-foreground">No metrics available</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {metrics.map((m) => {
                const selected = widget.metricKeys?.includes(m.metricKey);
                return (
                  <div
                    key={m.metricKey}
                    onClick={() => handleMetricToggle(m.metricKey)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer transition-colors text-sm ${
                      selected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <input type="checkbox" checked={!!selected} onChange={() => {}} className="accent-primary pointer-events-none" />
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
              <Button variant="destructive" size="sm" className="flex-1" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Removing..." : "Yes, remove"}
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
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
