import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Pencil, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/src/components/dashboard/DateRangePicker";
import { DashboardGrid } from "@/src/components/dashboard/DashboardGrid";
import { WidgetConfigPanel } from "@/src/components/dashboard/WidgetConfigPanel";
import { AddWidgetModal } from "@/src/components/dashboard/AddWidgetModal";
import { WidgetRenderer } from "@/src/components/dashboard/widgets/WidgetRenderer";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useDashboardEdit } from "@/src/hooks/useDashboardEdit";
import { useConnectedPlatforms } from "@/src/hooks/useConnectedPlatforms";
import { useAuthStore } from "@/src/lib/store";
import { getApiClient } from "@/src/lib/api";
import type { Dashboard, DashboardWidget } from "@/src/types/dashboard";

export function DashboardViewer() {
  const { id: campaignId, dashboardId } = useParams<{ id: string; dashboardId: string }>();
  const api = getApiClient();
  const { user } = useAuthStore();
  const canEdit = user?.role === "AGENCY_ADMIN" || user?.role === "AGENCY_OWNER";

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingWidgetId, setDeletingWidgetId] = useState<string | null>(null);

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery<Dashboard>({
    queryKey: ["dashboard", campaignId, dashboardId],
    queryFn: async () => {
      const response = await api.get<Dashboard>(
        `/campaigns/${campaignId}/dashboards/${dashboardId}`
      );
      return response.data;
    },
    enabled: !!campaignId && !!dashboardId,
  });

  const edit = useDashboardEdit({
    campaignId: campaignId!,
    dashboardId: dashboardId!,
  });

  const { connectedPlatforms } = useConnectedPlatforms(campaignId);

  // Warn user on browser close if unsaved changes exist
  useEffect(() => {
    if (!edit.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [edit.isDirty]);

  const displayWidgets: DashboardWidget[] = edit.editMode
    ? edit.editedWidgets
    : (dashboard?.widgets ?? []);

  const widgetIds = displayWidgets.map((w) => w.id);
  const { widgetDataMap, isLoading: widgetsLoading, error: widgetsError, refetch } = useDashboardData({
    campaignId,
    dashboardId,
    widgetIds,
    from: dateRange.from,
    to: dateRange.to,
  });

  const has403 = (error: any) =>
    error?.response?.status === 403 || error?.isForbidden === true;

  const handleEnterEdit = () => {
    if (dashboard) edit.enterEdit(dashboard.widgets);
  };

  const handleDeleteWidget = async (widgetId: string) => {
    setDeletingWidgetId(widgetId);
    try {
      await edit.removeWidget(widgetId);
    } finally {
      setDeletingWidgetId(null);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (dashboardLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-12 gap-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`col-span-12 ${i < 4 ? "lg:col-span-3" : i < 6 ? "lg:col-span-6" : ""} h-40 bg-muted rounded-lg`}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── 403 / error ───────────────────────────────────────────────────────────
  if (has403(dashboardError)) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-foreground mb-2">Access Denied</h3>
        <p className="text-muted-foreground">You don't have permission to view this dashboard.</p>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Failed to Load Dashboard</h3>
        <p className="text-muted-foreground mb-4">
          {dashboardError instanceof Error ? dashboardError.message : "An error occurred"}
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="flex gap-0 min-h-0">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-muted-foreground shrink-0" />
            <h3 className="font-semibold text-foreground">{dashboard.name}</h3>
            {edit.editMode && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Editing
              </span>
            )}
            {edit.editMode && edit.isDirty && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!edit.editMode ? (
              <>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                <Button variant="outline" size="sm" className="border-border">
                  Export
                </Button>
                {canEdit && (
                  <Button size="sm" className="bg-primary text-primary-foreground gap-1.5" onClick={handleEnterEdit}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Dashboard
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Widget
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={edit.cancelEdit}
                  disabled={edit.isSaving}
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground gap-1.5"
                  onClick={edit.saveChanges}
                  disabled={!edit.isDirty || edit.isSaving}
                >
                  <Save className="w-3.5 h-3.5" />
                  {edit.isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Widget permission warning */}
        {has403(widgetsError) && (
          <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            You don't have permission to view widget data for this dashboard.
          </div>
        )}

        {/* Grid */}
        <DashboardGrid
          widgets={displayWidgets}
          editMode={edit.editMode}
          selectedWidgetId={edit.selectedWidgetId}
          onWidgetClick={edit.setSelectedWidgetId}
          onLayoutChange={edit.updatePositions}
          renderWidget={(widget) => (
            <WidgetRenderer
              widget={widget}
              widgetData={widgetDataMap[widget.id]}
              isLoading={widgetsLoading}
              error={!has403(widgetsError) && widgetsError ? String(widgetsError) : undefined}
              onRetry={refetch}
            />
          )}
        />
      </div>

      {/* Config panel — only in edit mode when a widget is selected */}
      {edit.editMode && edit.selectedWidget && (
        <WidgetConfigPanel
          widget={edit.selectedWidget}
          onClose={() => edit.setSelectedWidgetId(null)}
          onUpdate={(changes) => edit.updateWidget(edit.selectedWidgetId!, changes)}
          onDelete={() => handleDeleteWidget(edit.selectedWidgetId!)}
          isDeleting={deletingWidgetId === edit.selectedWidgetId}
        />
      )}

      {/* Add widget modal */}
      {showAddModal && (
        <AddWidgetModal
          onClose={() => setShowAddModal(false)}
          onAdd={edit.addWidget}
          connectedPlatforms={connectedPlatforms}
        />
      )}
    </div>
  );
}
