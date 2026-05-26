import RGL from "react-grid-layout";
import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { GripVertical, Palette, X, Check, RotateCcw } from "lucide-react";
import { getPlatformIcon, getPlatformName, getPlatformColor } from "@/lib/platform-catalog";
import type { DashboardWidget } from "@/types/dashboard";

interface SectionConfig {
  headerBg?: string;
  headerText?: string;
  accentColor?: string;
  cardsBg?: string;
}

const SECTION_SWATCHES = [
  "#FFFFFF", "#F5F5F2", "#F0F4FF", "#F0FFF4", "#FFF7ED", "#FDF4FF", "#111827", "#1E3A5F",
  "#DBEAFE", "#BBF7D0", "#FDE68A", "#FECACA", "#E0E7FF", "#FCE7F3", "#D1FAE5", "#FEF9C3",
];

function isLightColor(hex: string): boolean {
  try {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  } catch { return true; }
}

interface MiniColorPickerProps {
  label: string;
  value?: string;
  defaultColor: string;
  onChange: (color: string) => void;
}

function MiniColorPicker({ label, value, defaultColor, onChange }: MiniColorPickerProps) {
  const active = value || defaultColor;
  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-wide opacity-60">{label}</span>
        {value && (
          <button
            onClick={() => onChange("")}
            className="opacity-50 hover:opacity-100 transition-opacity"
            title="Reset"
          >
            <RotateCcw className="size-2.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <label className="relative cursor-pointer shrink-0">
          <div
            className="size-7 rounded-lg border shadow-sm transition-transform hover:scale-105"
            style={{
              background: active,
              borderColor: isLightColor(active) ? "#D1D5DB" : "transparent",
            }}
            title="Pick color"
          />
          <input
            type="color"
            value={/^#[0-9A-Fa-f]{6}$/.test(active) ? active : defaultColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
        <div className="grid grid-cols-8 gap-0.5">
          {SECTION_SWATCHES.map((color) => (
            <button
              key={color}
              onClick={() => onChange(color)}
              className="size-4 rounded transition-transform hover:scale-110 flex items-center justify-center"
              style={{
                background: color,
                border: value === color ? "1.5px solid var(--primary)" : color === "#FFFFFF" ? "1px solid #D1D5DB" : "1px solid transparent",
              }}
              title={color}
            >
              {value === color && <Check className="size-2" style={{ color: isLightColor(color) ? "#374151" : "#fff" }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactGridLayout = RGL as any;

interface GridPosition { i: string; x: number; y: number; w: number; h: number; }
interface LayoutItem extends GridPosition { minW?: number; minH?: number; }

interface PlatformSectionProps {
  platform: string;
  widgets: DashboardWidget[];
  editMode: boolean;
  selectedWidgetId: string | null;
  onWidgetClick?: (widgetId: string) => void;
  onLayoutChange?: (layout: GridPosition[]) => void;
  renderWidget: (widget: DashboardWidget) => React.ReactNode;
  onSectionDragStart?: () => void;
  onSectionDragOver?: (e: React.DragEvent) => void;
  onSectionDragEnd?: () => void;
  isSectionDragging?: boolean;
}

const COL_COUNT = 12;
const ROW_HEIGHT = 44;

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Builds initial section layout: KPIs forced to h=3 (compact rectangle),
 * charts/tables placed below with saved relative positions.
 */
function buildSectionLayout(widgets: DashboardWidget[]): LayoutItem[] {
  const kpis = [...widgets.filter((w) => w.widgetType === "KPI")]
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  const others = widgets.filter((w) => w.widgetType !== "KPI");
  const items: LayoutItem[] = [];

  // Auto-pack KPIs in rows, using saved w and h
  let kpiX = 0, kpiRow = 0, rowH = 3;
  kpis.forEach((w) => {
    const kpiW = Math.max(2, Math.min(w.position.w || 3, 12));
    const kpiH = Math.max(1, w.position.h || 3);
    if (kpiX + kpiW > 12) { kpiRow += rowH; kpiX = 0; rowH = kpiH; }
    else { rowH = Math.max(rowH, kpiH); }
    items.push({ i: w.id, x: kpiX, y: kpiRow, w: kpiW, h: kpiH, minW: 2, minH: 1 });
    kpiX += kpiW;
  });

  const kpiHeight = kpis.length > 0 ? kpiRow + rowH : 0;
  const minChartY = others.length > 0 ? Math.min(...others.map((w) => w.position.y)) : 0;

  others.forEach((w) => {
    items.push({
      i: w.id,
      x: w.position.x,
      y: kpiHeight + (w.position.y - minChartY),
      w: w.position.w || 6,
      h: w.position.h || 4,
      minW: 2,
      minH: 2,
    });
  });

  return items;
}

export function PlatformSection({
  platform,
  widgets,
  editMode,
  selectedWidgetId,
  onWidgetClick,
  onLayoutChange,
  renderWidget,
  onSectionDragStart,
  onSectionDragOver,
  onSectionDragEnd,
  isSectionDragging,
}: PlatformSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1100);
  const widthTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSectionConfig, setShowSectionConfig] = useState(false);

  // Section-level color config, persisted per platform key in localStorage
  const sectionStorageKey = `section-cfg-${platform}`;
  const [sectionCfg, setSectionCfg] = useState<SectionConfig>(() => {
    try { return JSON.parse(localStorage.getItem(sectionStorageKey) ?? "{}"); } catch { return {}; }
  });

  const updateSectionCfg = (changes: Partial<SectionConfig>) => {
    setSectionCfg((prev) => {
      const next = { ...prev, ...changes };
      // Remove keys set to empty string so defaults take over
      (Object.keys(next) as (keyof SectionConfig)[]).forEach((k) => { if (!next[k]) delete next[k]; });
      try { localStorage.setItem(sectionStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry?.contentRect.width) return;
      const w = entry.contentRect.width;
      if (widthTimerRef.current) clearTimeout(widthTimerRef.current);
      // 220ms matches the panel slide-in transition — grid redraws only after resize settles
      widthTimerRef.current = setTimeout(() => setGridWidth(w), 220);
    });
    ro.observe(el);
    if (el.offsetWidth > 0) setGridWidth(el.offsetWidth);
    return () => { ro.disconnect(); if (widthTimerRef.current) clearTimeout(widthTimerRef.current); };
  }, []);

  // ── Layout state ──────────────────────────────────────────────────────────────
  const [layout, setLayout] = useState<LayoutItem[]>(() => buildSectionLayout(widgets));
  const prevIdsRef = useRef(widgets.map((w) => w.id).join(","));

  // 1. New widget added/removed → rebuild from scratch (preserve existing positions)
  useEffect(() => {
    const newIds = widgets.map((w) => w.id).join(",");
    if (newIds === prevIdsRef.current) return;
    prevIdsRef.current = newIds;
    setLayout((prev) => {
      const existingMap = new Map(prev.map((l) => [l.i, l]));
      return buildSectionLayout(widgets).map((item) => existingMap.get(item.i) ?? item);
    });
  }, [widgets]);

  // 2. External size change (e.g. size preset or custom input) → sync w/h from props
  // Safe: RGL only calls onDragStop/onResizeStop on USER interactions, not prop changes
  const lastRglReport = useRef(new Map<string, { w: number; h: number }>());
  useEffect(() => {
    setLayout((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const widget = widgets.find((w) => w.id === item.i);
        if (!widget) return item;
        if (widget.position.w !== item.w || widget.position.h !== item.h) {
          const rgl = lastRglReport.current.get(item.i);
          if (rgl?.w === widget.position.w && rgl?.h === widget.position.h) return item;
          changed = true;
          return { ...item, w: widget.position.w, h: widget.position.h };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [widgets]);

  const platformColor = getPlatformColor(platform);
  const platformIcon = getPlatformIcon(platform);
  const platformName = getPlatformName(platform) ?? platform;

  // Resolved section colors (fall back to platform-derived defaults)
  const sectionHeaderBg = sectionCfg.headerBg || `linear-gradient(90deg, ${hexToRgba(platformColor, 0.07)} 0%, #FAFAF9 60%)`;
  const sectionHeaderText = sectionCfg.headerText || undefined;
  const sectionAccent = sectionCfg.accentColor || platformColor;

  const handleLayoutChange = (newLayout: LayoutItem[]) => {
    newLayout.forEach((item) => lastRglReport.current.set(item.i, { w: item.w, h: item.h }));
    setLayout(newLayout);
    onLayoutChange?.(newLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })));
  };

  return (
    <div
      style={{
        background: sectionCfg.cardsBg || "#FFFFFF",
        border: "1px solid #E6E6E0",
        borderRadius: "20px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        marginBottom: "20px",
        opacity: isSectionDragging ? 0.4 : 1,
        transition: "opacity 0.15s ease",
        overflow: "visible", // must be visible so RGL resize handles aren't clipped
      }}
      onDragOver={onSectionDragOver}
    >
      {/* ── Section header ── */}
      <div
        draggable={editMode}
        onDragStart={(e) => { e.stopPropagation(); onSectionDragStart?.(); }}
        onDragEnd={onSectionDragEnd}
        style={{ borderRadius: "20px 20px 0 0", overflow: "hidden" }}
      >
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{
            background: sectionHeaderBg,
            borderBottom: "1px solid #EFEFEA",
            cursor: editMode ? "grab" : "default",
          }}
        >
          <div
            className="size-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: hexToRgba(sectionAccent, 0.13),
              border: `1.5px solid ${hexToRgba(sectionAccent, 0.22)}`,
            }}
          >
            {platformIcon ? (
              <Icon icon={platformIcon} style={{ width: 18, height: 18, color: sectionAccent }} />
            ) : (
              <span style={{ fontSize: 11, fontWeight: 800, color: sectionAccent }}>
                {platformName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <span
            className="font-bold text-[15px] leading-none"
            style={{ color: sectionHeaderText || "var(--foreground)" }}
          >
            {platformName}
          </span>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full leading-none"
            style={{ background: hexToRgba(sectionAccent, 0.10), color: sectionAccent }}
          >
            {widgets.length} {widgets.length === 1 ? "widget" : "widgets"}
          </span>
          {editMode && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSectionConfig((v) => !v); }}
                className="size-7 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: showSectionConfig ? hexToRgba(sectionAccent, 0.15) : "rgba(0,0,0,0.05)",
                  color: showSectionConfig ? sectionAccent : "rgba(0,0,0,0.35)",
                }}
                title="Section colors"
              >
                <Palette className="size-3.5" />
              </button>
              <GripVertical className="size-4 text-muted-foreground/35" />
            </div>
          )}
        </div>

        {/* ── Section color config panel (edit mode, toggled) ── */}
        {editMode && showSectionConfig && (
          <div
            className="px-5 py-3 flex flex-wrap items-start gap-4 border-b"
            style={{ background: "rgba(0,0,0,0.025)", borderColor: "#EFEFEA" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <MiniColorPicker
              label="Header bg"
              value={sectionCfg.headerBg}
              defaultColor="#F8F8F6"
              onChange={(c) => updateSectionCfg({ headerBg: c })}
            />
            <MiniColorPicker
              label="Header text"
              value={sectionCfg.headerText}
              defaultColor="#111827"
              onChange={(c) => updateSectionCfg({ headerText: c })}
            />
            <MiniColorPicker
              label="Accent color"
              value={sectionCfg.accentColor}
              defaultColor={platformColor}
              onChange={(c) => updateSectionCfg({ accentColor: c })}
            />
            <MiniColorPicker
              label="Section bg"
              value={sectionCfg.cardsBg}
              defaultColor="#FFFFFF"
              onChange={(c) => updateSectionCfg({ cardsBg: c })}
            />
            <div className="ml-auto self-center">
              <button
                onClick={() => {
                  setSectionCfg({});
                  try { localStorage.removeItem(sectionStorageKey); } catch {}
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
              >
                <RotateCcw className="size-3" /> Reset all
              </button>
            </div>
            <button
              onClick={() => setShowSectionConfig(false)}
              className="self-center p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <div style={{ height: "3px", background: sectionAccent }} />
      </div>

      {/* ── Unified widget grid ── */}
      <div ref={containerRef} style={{ padding: "12px" }}>
        <ReactGridLayout
          layout={layout}
          cols={COL_COUNT}
          rowHeight={ROW_HEIGHT}
          width={gridWidth}
          isDraggable={editMode}
          isResizable={editMode}
          onDragStop={handleLayoutChange}
          onResizeStop={handleLayoutChange}
          margin={[10, 10]}
          containerPadding={[0, 0]}
          draggableHandle=".widget-drag-handle"
          compactType={null}
          preventCollision={false}
          useCSSTransforms
        >
          {widgets.map((widget) => {
            const isSelected = editMode && selectedWidgetId === widget.id;
            const isKPI = widget.widgetType === "KPI";
            const headerBg = widget.config?.headerColor || "#F5F5F2";
            const bodyBg = widget.config?.bodyColor || "#FFFFFF";
            const headerTextColor = widget.config?.headerTextColor || "rgba(0,0,0,0.45)";
            const bodyTextColor = widget.config?.bodyTextColor;
            const radius = isKPI ? 14 : 16;

            return (
              // NOTE: overflow must NOT be hidden here — RGL appends resize handle inside this div
              <div
                key={widget.id}
                className="relative flex flex-col"
                style={{
                  background: bodyBg,
                  border: "1px solid #E8E8E2",
                  outline: isSelected ? `2px solid ${platformColor}` : "none",
                  outlineOffset: "-1px",
                  borderRadius: `${radius}px`,
                  boxShadow: isSelected
                    ? `0 0 0 4px ${hexToRgba(platformColor, 0.15)}, 0 2px 8px rgba(0,0,0,0.08)`
                    : "0 1px 4px rgba(0,0,0,0.05)",
                  cursor: editMode ? "pointer" : "default",
                  transition: "outline 0.1s, box-shadow 0.15s",
                }}
              >
                {/* Header strip — shown for all widget types.
                    Non-KPI: full header with title text and optional drag handle.
                    KPI in edit mode: compact drag handle bar with title.
                    KPI in view mode: thin colored accent bar (headerBg visible even with no title). */}
                {isKPI ? (
                  <div
                    className={editMode ? "widget-drag-handle flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing select-none shrink-0" : "flex items-center px-3 py-1.5 shrink-0"}
                    style={{
                      background: headerBg,
                      borderBottom: "1px solid rgba(0,0,0,0.07)",
                      borderRadius: `${radius - 1}px ${radius - 1}px 0 0`,
                    }}
                    onClick={editMode ? (e) => { e.stopPropagation(); onWidgetClick?.(widget.id); } : undefined}
                  >
                    <span className="text-[10px] font-semibold truncate" style={{ color: headerTextColor }}>
                      {widget.config?.title || "KPI"}
                    </span>
                    {editMode && (
                      <div className="flex gap-0.5 ml-2 shrink-0">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-px h-3 rounded" style={{ background: "rgba(0,0,0,0.18)" }} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={editMode ? "widget-drag-handle flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing select-none shrink-0" : "flex items-center px-4 py-2.5 shrink-0"}
                    style={{
                      background: headerBg,
                      borderBottom: "1px solid rgba(0,0,0,0.07)",
                      borderRadius: `${radius - 1}px ${radius - 1}px 0 0`,
                    }}
                    onClick={editMode ? (e) => { e.stopPropagation(); onWidgetClick?.(widget.id); } : undefined}
                  >
                    <span
                      className="text-[12px] font-semibold truncate"
                      style={{ color: headerTextColor }}
                    >
                      {widget.config?.title || widget.widgetType}
                    </span>
                    {editMode && (
                      <div className="flex gap-0.5 ml-2 shrink-0">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-px h-3 rounded" style={{ background: "rgba(0,0,0,0.18)" }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Content body */}
                <div
                  className="flex-1 min-h-0 flex flex-col overflow-hidden"
                  style={{ padding: "14px 16px", flex: "1 1 0", background: bodyBg, borderRadius: `0 0 ${radius}px ${radius}px`, ...(bodyTextColor ? { color: bodyTextColor } : {}) }}
                  onMouseDown={(e) => {
                    if (editMode) {
                      e.nativeEvent.stopImmediatePropagation();
                      onWidgetClick?.(widget.id);
                    }
                  }}
                >
                  <div className="flex-1 min-h-0 flex flex-col">
                    {renderWidget(widget)}
                  </div>
                </div>
              </div>
            );
          })}
        </ReactGridLayout>
      </div>
    </div>
  );
}
