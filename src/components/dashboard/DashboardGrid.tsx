import { useMemo, useState, useEffect, useRef } from "react";
import { LayoutDashboard } from "lucide-react";
import type { DashboardWidget } from "@/types/dashboard";
import { PlatformSection } from "./PlatformSection";

interface GridPosition { i: string; x: number; y: number; w: number; h: number; }

interface DashboardGridProps {
  widgets: DashboardWidget[];
  editMode: boolean;
  selectedWidgetId: string | null;
  onWidgetClick?: (widgetId: string) => void;
  onLayoutChange?: (layout: GridPosition[]) => void;
  renderWidget: (widget: DashboardWidget) => React.ReactNode;
}

export function DashboardGrid({
  widgets,
  editMode,
  selectedWidgetId,
  onWidgetClick,
  onLayoutChange,
  renderWidget,
}: DashboardGridProps) {
  // Group widgets by platform key
  const groups = useMemo(() => {
    const map = new Map<string, DashboardWidget[]>();
    for (const w of widgets) {
      const key = w.platform ?? "UNCATEGORIZED";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return map;
  }, [widgets]);

  // Maintain section order; sync when platforms are added/removed
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  useEffect(() => {
    setSectionOrder((prev) => {
      const current = new Set(groups.keys());
      const kept = prev.filter((k) => current.has(k));
      const added = [...current].filter((k) => !prev.includes(k));
      return [...kept, ...added];
    });
  }, [groups]);

  // Section drag-to-reorder
  const draggedKey = useRef<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const handleSectionDragStart = (key: string) => {
    draggedKey.current = key;
    setDraggingKey(key);
  };

  const handleSectionDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedKey.current || draggedKey.current === targetKey) return;
    setSectionOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(draggedKey.current!);
      const to = next.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, draggedKey.current!);
      return next;
    });
  };

  const handleSectionDragEnd = () => {
    draggedKey.current = null;
    setDraggingKey(null);
  };

  // Empty state
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="size-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(91,71,224,0.08)" }}
        >
          <LayoutDashboard className="size-6" style={{ color: "#5B47E0" }} />
        </div>
        <p className="font-semibold text-foreground text-sm mb-1">No widgets yet</p>
        <p className="text-[13px] text-muted-foreground">
          Click <strong>Edit Dashboard</strong> to add your first widget
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {sectionOrder.map((platformKey) => {
        const platformWidgets = groups.get(platformKey);
        if (!platformWidgets || platformWidgets.length === 0) return null;

        return (
          <PlatformSection
            key={platformKey}
            platform={platformKey}
            widgets={platformWidgets}
            editMode={editMode}
            selectedWidgetId={selectedWidgetId}
            onWidgetClick={onWidgetClick}
            onLayoutChange={(sectionLayout) => onLayoutChange?.(sectionLayout)}
            renderWidget={renderWidget}
            isSectionDragging={draggingKey === platformKey}
            onSectionDragStart={() => handleSectionDragStart(platformKey)}
            onSectionDragOver={(e) => handleSectionDragOver(e, platformKey)}
            onSectionDragEnd={handleSectionDragEnd}
          />
        );
      })}
    </div>
  );
}
