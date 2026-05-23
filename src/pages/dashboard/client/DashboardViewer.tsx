import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Pencil, Plus, Save, X, Layers,
  ChevronRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { WidgetConfigPanel } from "@/components/dashboard/WidgetConfigPanel";
import { AddWidgetModal } from "@/components/dashboard/AddWidgetModal";
import { WidgetRenderer } from "@/components/dashboard/widgets/WidgetRenderer";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardEdit } from "@/hooks/useDashboardEdit";
import { useConnectedPlatforms } from "@/hooks/useConnectedPlatforms";
import { useHasRole } from "@/hooks/useRole";
import { getApiClient } from "@/lib/api";
import type { Dashboard, DashboardWidget } from "@/types/dashboard";

export function DashboardViewer() {
  const { clientId, campaignId, dashboardId } = useParams<{
    clientId: string;
    campaignId: string;
    dashboardId: string;
  }>();
  const location = useLocation();
  const api = getApiClient();
  const canEdit = useHasRole("AGENCY_ADMIN");

  const isEditRoute = location.pathname.endsWith("/edit");

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingWidgetId, setDeletingWidgetId] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateNamePrompt, setTemplateNamePrompt] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery<Dashboard>({
    queryKey: ["dashboard", campaignId, dashboardId],
    queryFn: () =>
      api.get<Dashboard>(`/campaigns/${campaignId}/dashboards/${dashboardId}`).then((r) => r.data),
    enabled: !!campaignId && !!dashboardId,
  });

  const edit = useDashboardEdit({ campaignId: campaignId!, dashboardId: dashboardId! });

  useEffect(() => {
    if (isEditRoute && dashboard && !edit.editMode) {
      edit.enterEdit(dashboard.widgets);
    }
  }, [isEditRoute, dashboard]);

  useEffect(() => {
    if (!edit.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [edit.isDirty]);

  const { connectedPlatforms } = useConnectedPlatforms(clientId, campaignId);

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

  const has403 = (error: unknown) =>
    (error as { response?: { status?: number } })?.response?.status === 403;

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

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    setTemplateNamePrompt(false);
    try {
      await api.post(
        `/clients/${clientId}/campaigns/${campaignId}/dashboards/${dashboardId}/save-as-template`,
        { templateName: templateName.trim() },
      );
      toast.success("Dashboard saved as template", {
        description: "Find it under Templates → My Agency.",
        action: { label: "View Templates", onClick: () => window.open("/templates", "_blank") },
      });
      setTemplateName("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to save as template");
    } finally {
      setSavingTemplate(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (dashboardLoading) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 space-y-5 animate-pulse">
        <div className="h-4 w-64 bg-muted rounded-xl" />
        <div className="h-7 w-48 bg-muted rounded-xl" />
        <div className="grid grid-cols-12 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`col-span-12 ${i < 4 ? "lg:col-span-3" : "lg:col-span-6"} h-40 bg-muted rounded-2xl`} />
          ))}
        </div>
      </div>
    );
  }

  if (has403(dashboardError)) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 flex flex-col items-center justify-center py-20 text-center">
        <div className="size-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(244,63,94,0.10)' }}>
          <X className="size-7" style={{ color: '#f43f5e' }} />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Access Denied</h3>
        <p className="text-sm text-muted-foreground">You don't have permission to view this dashboard.</p>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-semibold text-red-500 mb-4">Failed to load dashboard</p>
        <button
          onClick={() => window.location.reload()}
          className="h-9 px-4 rounded-xl text-sm font-medium"
          style={{ border: '1px solid #ECECE6' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="flex gap-0 min-h-0">
      <div className="flex-1 min-w-0 space-y-0 transition-all duration-200 ease-in-out">

        {/* ── Page header bar ── */}
        <div
          className="px-5 lg:px-7 py-4 flex items-center justify-between gap-4 flex-wrap sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border shadow-sm"
        >
          <div>
            <nav className="flex items-center gap-1 text-[11px] text-muted-foreground flex-wrap mb-1">
              <Link to="/clients" className="hover:text-foreground transition-colors">Clients</Link>
              <ChevronRight className="size-2.5 shrink-0" />
              <Link to={`/clients/${clientId}`} className="hover:text-foreground transition-colors">Client</Link>
              <ChevronRight className="size-2.5 shrink-0" />
              <Link to={`/clients/${clientId}/campaigns/${campaignId}`} className="hover:text-foreground transition-colors">Campaign</Link>
              <ChevronRight className="size-2.5 shrink-0" />
              <Link to={`/clients/${clientId}/campaigns/${campaignId}/dashboards`} className="hover:text-foreground transition-colors">Dashboards</Link>
              <ChevronRight className="size-2.5 shrink-0" />
              <span className="text-foreground font-semibold">{dashboard.name}</span>
            </nav>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div
                className="size-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(91,71,224,0.10)" }}
              >
                <LayoutDashboard className="size-3.5" style={{ color: "#5B47E0" }} />
              </div>
              <h1 className="font-heading font-bold text-foreground text-lg tracking-tight">
                {dashboard.name}
              </h1>
              {edit.editMode && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(91,71,224,0.10)', color: '#5B47E0' }}
                >
                  Editing
                </span>
              )}
              {edit.editMode && edit.isDirty && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(245,165,36,0.12)', color: '#d97706' }}
                >
                  Unsaved changes
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!edit.editMode ? (
              <>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                {canEdit && (
                  <>
                    <button
                      className="h-9 px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all hover:bg-muted text-foreground"
                      style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" }}
                      onClick={() => { setTemplateName(dashboard?.name ?? ""); setTemplateNamePrompt(true); }}
                      disabled={savingTemplate}
                    >
                      {savingTemplate ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4 text-muted-foreground" />}
                      {savingTemplate ? "Saving…" : "Save as Template"}
                    </button>
                    <button
                      className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 shadow-md"
                      style={{ background: "linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)" }}
                      onClick={handleEnterEdit}
                    >
                      <Pencil className="size-4 text-white/90" />
                      Edit Dashboard
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  className="h-9 px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all text-foreground hover:bg-muted"
                  style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" }}
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="size-4 text-muted-foreground" />
                  Add Widget
                </button>
                <button
                  className="h-9 px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all text-muted-foreground hover:bg-muted"
                  style={{ border: "1px solid var(--border)" }}
                  onClick={edit.cancelEdit}
                  disabled={edit.isSaving}
                >
                  <X className="size-4" />
                  Cancel
                </button>
                <button
                  className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 shadow-md"
                  style={{ background: "var(--primary)" }}
                  onClick={edit.saveChanges}
                  disabled={!edit.isDirty || edit.isSaving}
                >
                  {edit.isSaving ? <Loader2 className="size-4 animate-spin text-white/90" /> : <Save className="size-4 text-white/90" />}
                  {edit.isSaving ? "Saving…" : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Main content area ── */}
        <div
          className="px-5 lg:px-7 py-8 min-h-[calc(100vh-120px)] relative"
          style={{
            backgroundColor: "#EDECEA",
            backgroundImage: `
              linear-gradient(45deg, rgba(255,255,255,0.55) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(255,255,255,0.55) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.04) 75%),
              linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.04) 75%)
            `,
            backgroundSize: "80px 80px",
            backgroundPosition: "0 0, 0 40px, 40px -40px, -40px 0px",
          }}
        >

        {/* Widget data 403 warning */}
        {has403(widgetsError) && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-xs font-medium"
            style={{ background: "rgba(245,165,36,0.08)", border: "1px solid rgba(245,165,36,0.22)", color: "#d97706" }}
          >
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
        </div>{/* end main content area */}
      </div>

      {/* Config panel — only renders when a widget is selected; smooth transition prevents hard jiggle */}
      {edit.editMode && edit.selectedWidget && (
        <div className="w-72 shrink-0 transition-all duration-200 ease-in-out">
          <WidgetConfigPanel
            widget={edit.selectedWidget}
            onClose={() => edit.setSelectedWidgetId(null)}
            onUpdate={(changes) => edit.updateWidget(edit.selectedWidgetId!, changes)}
            onResize={(w, h) => {
              const wgt = edit.editedWidgets.find((ew) => ew.id === edit.selectedWidgetId);
              if (wgt) edit.updatePositions([{ i: wgt.id, x: wgt.position.x, y: wgt.position.y, w, h }]);
            }}
            onDelete={() => handleDeleteWidget(edit.selectedWidgetId!)}
            isDeleting={deletingWidgetId === edit.selectedWidgetId}
          />
        </div>
      )}

      {/* Add widget modal */}
      {showAddModal && (
        <AddWidgetModal
          onClose={() => setShowAddModal(false)}
          onAdd={edit.addWidget}
          connectedPlatforms={connectedPlatforms}
        />
      )}

      {/* Save as template dialog */}
      {templateNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTemplateNamePrompt(false)} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            style={{ border: '1px solid #ECECE6' }}
          >
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #5B47E0, #7C3AED)' }} />
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
                  <Layers className="size-4" style={{ color: '#5B47E0' }} />
                </div>
                <h2 className="font-heading font-semibold text-base">Save as Template</h2>
              </div>
              <input
                autoFocus
                type="text"
                className="w-full h-10 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none"
                style={{ border: '1px solid #ECECE6' }}
                placeholder="e.g. SEO Dashboard"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveAsTemplate(); if (e.key === "Escape") setTemplateNamePrompt(false); }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.15)'; e.currentTarget.style.borderColor = '#5B47E0'; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#ECECE6'; }}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setTemplateNamePrompt(false)}
                  className="h-9 px-4 rounded-xl text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={!templateName.trim()}
                  className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                >
                  Save Template
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
