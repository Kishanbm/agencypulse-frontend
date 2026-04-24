import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@/src/lib/api";
import type { DashboardWidget, WidgetConfig, WidgetPosition, IntegrationPlatform, WidgetType } from "@/src/types/dashboard";

interface UseDashboardEditProps {
  campaignId: string;
  dashboardId: string;
}

export function useDashboardEdit({ campaignId, dashboardId }: UseDashboardEditProps) {
  const api = getApiClient();
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // Two separate states — original is the backend snapshot, edited is what user is doing
  const [originalWidgets, setOriginalWidgets] = useState<DashboardWidget[]>([]);
  const [editedWidgets, setEditedWidgets] = useState<DashboardWidget[]>([]);

  // Computed — true when there are unsaved changes
  const isDirty = useMemo(
    () => JSON.stringify(originalWidgets) !== JSON.stringify(editedWidgets),
    [originalWidgets, editedWidgets]
  );

  const selectedWidget = useMemo(
    () => editedWidgets.find((w) => w.id === selectedWidgetId) ?? null,
    [editedWidgets, selectedWidgetId]
  );

  // Enter edit mode — snapshot current backend state
  const enterEdit = useCallback((widgets: DashboardWidget[]) => {
    setOriginalWidgets(widgets);
    setEditedWidgets(structuredClone(widgets));
    setEditMode(true);
    setSelectedWidgetId(null);
  }, []);

  // Cancel — restore backend snapshot, no API calls
  const cancelEdit = useCallback(() => {
    setEditedWidgets(structuredClone(originalWidgets));
    setEditMode(false);
    setSelectedWidgetId(null);
  }, [originalWidgets]);

  // Update positions after drag/resize stops — receives full layout, fires once (not on every pixel)
  const updatePositions = useCallback((layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    setEditedWidgets((prev) =>
      prev.map((widget) => {
        const updated = layout.find((l) => l.i === widget.id);
        if (!updated) return widget;
        return { ...widget, position: { x: updated.x, y: updated.y, w: updated.w, h: updated.h } };
      })
    );
  }, []);

  // Update a single widget's config (title, metrics, platform, type)
  const updateWidget = useCallback((widgetId: string, changes: Partial<Pick<DashboardWidget, "config" | "metricKeys" | "platform" | "widgetType">>) => {
    setEditedWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, ...changes } : w))
    );
  }, []);

  // Add new widget — always placed at the bottom of the grid
  const addWidget = useCallback(async (dto: {
    widgetType: WidgetType;
    platform: IntegrationPlatform;
    metricKeys: string[];
    config: WidgetConfig;
  }) => {
    const maxY = editedWidgets.reduce((max, w) => Math.max(max, w.position.y + w.position.h), 0);
    const position: WidgetPosition = { x: 0, y: maxY, w: 6, h: 3 };

    const response = await api.post<DashboardWidget>(
      `/campaigns/${campaignId}/dashboards/${dashboardId}/widgets`,
      { ...dto, position }
    );

    setEditedWidgets((prev) => [...prev, response.data]);
    setOriginalWidgets((prev) => [...prev, response.data]);
    setSelectedWidgetId(response.data.id);
  }, [api, campaignId, dashboardId, editedWidgets]);

  // Remove a widget
  const removeWidget = useCallback(async (widgetId: string) => {
    await api.delete(`/campaigns/${campaignId}/dashboards/${dashboardId}/widgets/${widgetId}`);
    setEditedWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    setOriginalWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
  }, [api, campaignId, dashboardId, selectedWidgetId]);

  // Save — diff original vs edited, PATCH only what changed, sequentially
  const saveChanges = useCallback(async () => {
    const changed = editedWidgets.filter((ew) => {
      const orig = originalWidgets.find((ow) => ow.id === ew.id);
      return !orig || JSON.stringify(ew) !== JSON.stringify(orig);
    });

    if (changed.length === 0) {
      setEditMode(false);
      return;
    }

    setIsSaving(true);
    try {
      for (const w of changed) {
        await api.patch(
          `/campaigns/${campaignId}/dashboards/${dashboardId}/widgets/${w.id}`,
          {
            platform: w.platform,
            metricKeys: w.metricKeys,
            config: w.config,
            position: w.position,
          }
        );
      }

      // Snapshot the saved state
      setOriginalWidgets(structuredClone(editedWidgets));
      // Invalidate dashboard query so viewer re-fetches fresh data
      await queryClient.invalidateQueries({ queryKey: ["dashboard", campaignId, dashboardId] });
      setEditMode(false);
      setSelectedWidgetId(null);
    } finally {
      setIsSaving(false);
    }
  }, [api, campaignId, dashboardId, editedWidgets, originalWidgets, queryClient]);

  return {
    editMode,
    isSaving,
    isDirty,
    editedWidgets,
    selectedWidget,
    selectedWidgetId,
    setSelectedWidgetId,
    enterEdit,
    cancelEdit,
    updatePositions,
    updateWidget,
    addWidget,
    removeWidget,
    saveChanges,
  };
}
