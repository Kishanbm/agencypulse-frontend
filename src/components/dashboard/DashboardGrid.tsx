// react-grid-layout uses `export =` (CommonJS) — cast to avoid ESM interop issues
import RGL from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useRef, useState, useEffect } from "react";
import type { DashboardWidget } from "@/types/dashboard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactGridLayout = RGL as any;

interface GridPosition {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DashboardGridProps {
  widgets: DashboardWidget[];
  editMode: boolean;
  selectedWidgetId: string | null;
  onWidgetClick?: (widgetId: string) => void;
  onLayoutChange?: (layout: GridPosition[]) => void;
  renderWidget: (widget: DashboardWidget) => React.ReactNode;
}

const COL_COUNT = 12;
const ROW_HEIGHT = 80;

export function DashboardGrid({
  widgets,
  editMode,
  selectedWidgetId,
  onWidgetClick,
  onLayoutChange,
  renderWidget,
}: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setGridWidth(width);
    });
    observer.observe(containerRef.current);
    setGridWidth(containerRef.current.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const layout = widgets.map((w) => ({
    i: w.id,
    x: w.position.x,
    y: w.position.y,
    w: w.position.w,
    h: w.position.h,
    minW: 2,
    minH: 2,
  }));

  const extractPositions = (l: Array<{ i: string; x: number; y: number; w: number; h: number }>): GridPosition[] =>
    l.map((item) => ({ i: item.i, x: item.x, y: item.y, w: item.w, h: item.h }));

  // layout is the full updated layout array — fires once when drag/resize ends (not on every pixel)
  const handleDragStop = (l: GridPosition[]) => {
    onLayoutChange?.(extractPositions(l));
  };

  const handleResizeStop = (l: GridPosition[]) => {
    onLayoutChange?.(extractPositions(l));
  };

  return (
    <div ref={containerRef} className="w-full">
    <ReactGridLayout
      layout={layout}
      cols={COL_COUNT}
      rowHeight={ROW_HEIGHT}
      width={gridWidth}
      isDraggable={editMode}
      isResizable={editMode}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      draggableHandle=".widget-drag-handle"
    >
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className={`bg-card border rounded-lg shadow-sm overflow-hidden transition-all duration-150 ${
            editMode ? "cursor-pointer" : ""
          } ${
            editMode && selectedWidgetId === widget.id
              ? "ring-2 ring-primary border-primary"
              : "border-border"
          } ${editMode ? "hover:ring-1 hover:ring-primary/50" : ""}`}
          onClick={() => editMode && onWidgetClick?.(widget.id)}
        >
          {editMode && (
            <div className="widget-drag-handle flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border cursor-grab active:cursor-grabbing select-none">
              <span className="text-xs font-medium text-muted-foreground truncate">
                {widget.config?.title || widget.widgetType}
              </span>
              <div className="flex gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-0.5 h-3 bg-muted-foreground/40 rounded" />
                ))}
              </div>
            </div>
          )}
          <div className="p-4">
            {!editMode && widget.config?.title && (
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {widget.config.title}
              </h4>
            )}
            {renderWidget(widget)}
          </div>
        </div>
      ))}
    </ReactGridLayout>
    </div>
  );
}
