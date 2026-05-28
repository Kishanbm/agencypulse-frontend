import { useState } from "react";
import { Plus, LayoutDashboard, ChevronRight, Loader2, Layers, ArrowRight, Search, MoreVertical, Pencil, Copy, Trash2, Clock } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import { useHasRole } from "@/hooks/useRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { DashboardTemplate, CloneDashboardResponse } from "@/types/templates";

interface Dashboard {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { widgets: number };
}

const DASH_GRADIENTS = [
  'linear-gradient(135deg, #5B47E0, #8B5CF6)',
  'linear-gradient(135deg, #FF7A59, #F5A524)',
  'linear-gradient(135deg, #10D9A0, #06b6d4)',
  'linear-gradient(135deg, #f43f5e, #ec4899)',
  'linear-gradient(135deg, #8B5CF6, #6366f1)',
  'linear-gradient(135deg, #F5A524, #FF7A59)',
];

export function DashboardsList() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const navigate = useNavigate();
  const api = getApiClient();
  const queryClient = useQueryClient();
  const canEdit = useHasRole("AGENCY_ADMIN");

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | "BLANK" | null>(null);
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<Dashboard | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [dashboardToRename, setDashboardToRename] = useState<Dashboard | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const queryKey = ["dashboards", campaignId];

  const { data: dashboards = [], isLoading, error } = useQuery<Dashboard[]>({
    queryKey,
    queryFn: () =>
      api
        .get<Dashboard[]>(`/campaigns/${campaignId}/dashboards`)
        .then((r) => (Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? [])),
    enabled: !!campaignId,
  });

  const filteredDashboards = dashboards.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", "dashboards"],
    queryFn: () => api.get<{ items: DashboardTemplate[] }>("/templates/dashboards").then((r) => r.data),
    enabled: createOpen,
  });

  const templates = templatesData?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      api
        .post<Dashboard>(`/campaigns/${campaignId}/dashboards`, { name })
        .then((r) => r.data),
    onSuccess: (created) => {
      toast.success(`Dashboard "${created.name}" created`);
      void queryClient.invalidateQueries({ queryKey });
      handleCloseModal();
      navigate(`/clients/${clientId}/campaigns/${campaignId}/dashboards/${created.id}`);
    },
    onError: () => {
      toast.error("Failed to create dashboard — please try again");
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (args: { templateId: string; name: string }) =>
      api
        .post<CloneDashboardResponse>(`/templates/dashboards/${args.templateId}/clone`, {
          campaignId,
          name: args.name,
        })
        .then((r) => r.data),
    onSuccess: (cloned) => {
      toast.success(`Dashboard "${cloned.name}" created from template`);
      void queryClient.invalidateQueries({ queryKey });
      handleCloseModal();
      navigate(`/clients/${clientId}/campaigns/${campaignId}/dashboards/${cloned.id}`);
    },
    onError: () => toast.error("Failed to clone template"),
  });

  const renameMutation = useMutation({
    mutationFn: (args: { dashboardId: string; name: string }) =>
      api.patch(`/campaigns/${campaignId}/dashboards/${args.dashboardId}`, { name: args.name }),
    onSuccess: () => {
      toast.success("Dashboard renamed");
      void queryClient.invalidateQueries({ queryKey });
      setRenameOpen(false);
      setDashboardToRename(null);
    },
    onError: () => toast.error("Failed to rename dashboard"),
  });

  const deleteMutation = useMutation({
    mutationFn: (dashboardId: string) =>
      api.delete(`/campaigns/${campaignId}/dashboards/${dashboardId}`),
    onSuccess: () => {
      toast.success("Dashboard deleted");
      void queryClient.invalidateQueries({ queryKey });
      setDeleteConfirmOpen(false);
      setDashboardToDelete(null);
    },
    onError: () => toast.error("Failed to delete dashboard"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (dashboardId: string) => {
      // 1. Get the original dashboard with all its widgets
      const res = await api.get(`/campaigns/${campaignId}/dashboards/${dashboardId}`);
      const original = Array.isArray(res.data) ? res.data[0] : (res.data as any)?.data ?? res.data;
      if (!original) throw new Error("Dashboard not found");

      // 2. Create the new dashboard
      const createRes = await api.post(`/campaigns/${campaignId}/dashboards`, {
        name: `${original.name} (Copy)`
      });
      const newDashboard = createRes.data as any;

      // 3. Clone all widgets (if any) sequentially
      const widgets = original.widgets || [];
      for (const widget of widgets) {
        await api.post(`/campaigns/${campaignId}/dashboards/${newDashboard.id}/widgets`, {
          widgetType: widget.widgetType,
          platform: widget.platform,
          metricKeys: widget.metricKeys,
          config: widget.config,
          position: widget.position
        });
      }
      return newDashboard;
    },
    onSuccess: (newDash) => {
      toast.success(`Duplicated as "${newDash.name}"`);
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error("Failed to duplicate dashboard"),
  });

  function handleCloseModal() {
    setCreateOpen(false);
    setCreateStep(1);
    setSelectedTemplate(null);
    setNewName("");
  }

  function handleNext() {
    if (!selectedTemplate) return;
    if (selectedTemplate === "BLANK") {
      setNewName("");
    } else {
      setNewName(selectedTemplate.name);
    }
    setCreateStep(2);
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    if (selectedTemplate === "BLANK") {
      createMutation.mutate(name);
    } else if (selectedTemplate) {
      cloneMutation.mutate({ templateId: selectedTemplate.id, name });
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 space-y-5 max-w-[1400px] mx-auto">
        <div className="h-8 w-40 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-500 mb-4">Failed to load dashboards</p>
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

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap"
      >
        <Link to="/clients" className="hover:text-foreground transition-colors font-medium">Clients</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}`} className="hover:text-foreground transition-colors font-medium">Client</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}/campaigns/${campaignId}`} className="hover:text-foreground transition-colors font-medium">Campaign</Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-foreground font-semibold">Dashboards</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Dashboards</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            Visualize campaign performance with custom widget layouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full sm:w-64 pl-9 pr-4 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
              style={{ border: '1px solid #ECECE6' }}
            />
          </div>
          {canEdit && (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <Plus className="size-4" />
              Create Dashboard
            </button>
          )}
        </div>
      </motion.div>

      {/* Grid */}
      {dashboards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="bg-white rounded-2xl py-16 text-center px-4"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div
            className="mx-auto mb-4 size-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(91,71,224,0.08)' }}
          >
            <LayoutDashboard className="size-7" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-sm font-semibold text-foreground">No dashboards yet</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            Create your first dashboard to start visualising campaign data.
          </p>
          {canEdit && (
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <Plus className="size-3.5" />
              Create First Dashboard
            </button>
          )}
        </motion.div>
      ) : filteredDashboards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl py-16 text-center px-4"
          style={{ border: '1px solid #ECECE6' }}
        >
          <p className="text-sm font-semibold text-foreground">No matching dashboards</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search query.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dashboard, i) => {
            const gradient = DASH_GRADIENTS[i % DASH_GRADIENTS.length];
            return (
              <motion.div
                key={dashboard.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" as const }}
                className="bg-white rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:bg-slate-50 relative min-h-[160px] flex flex-col justify-center"
                style={{ 
                  border: '1px solid #ECECE6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 10px 24px rgba(0,0,0,0.06)' 
                }}
                onClick={() => navigate(`/clients/${clientId}/campaigns/${campaignId}/dashboards/${dashboard.id}`)}
              >
                <div className="p-7 relative">
                  <div className="absolute right-4 top-4 z-10">
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors"
                          >
                            <MoreVertical className="size-5" />
                          </button>
                        } />
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDashboardToRename(dashboard); setRenameValue(dashboard.name); setRenameOpen(true); }}
                            className="cursor-pointer"
                          >
                            <Pencil className="size-4 mr-2 text-muted-foreground" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(dashboard.id); }}
                            disabled={duplicateMutation.isPending && duplicateMutation.variables === dashboard.id}
                            className="cursor-pointer"
                          >
                            {duplicateMutation.isPending && duplicateMutation.variables === dashboard.id ? (
                              <Loader2 className="size-4 mr-2 animate-spin text-muted-foreground" />
                            ) : (
                              <Copy className="size-4 mr-2 text-muted-foreground" />
                            )}
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDashboardToDelete(dashboard); setDeleteConfirmOpen(true); }}
                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-5 pr-8">
                    <div
                      className="size-16 rounded-xl shrink-0 flex flex-col gap-[4px] p-2.5 transition-transform group-hover:scale-105"
                      style={{ background: 'rgba(91,71,224,0.05)', border: `1px solid ${gradient.split(',')[1].trim()}` }}
                    >
                      <div className="h-1/2 w-full rounded-[3px] opacity-40" style={{ background: gradient }} />
                      <div className="h-1/2 w-full flex gap-[4px]">
                        <div className="h-full w-1/2 rounded-[3px] opacity-40" style={{ background: gradient }} />
                        <div className="h-full w-1/2 rounded-[3px] opacity-40" style={{ background: gradient }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {dashboard.isDefault && (
                        <div className="mb-1.5">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: 'rgba(91,71,224,0.10)', color: '#5B47E0' }}
                          >
                            Default
                          </span>
                        </div>
                      )}
                      <h4 className="font-heading font-semibold text-base text-foreground truncate mb-3" title={dashboard.name}>
                        {dashboard.name}
                      </h4>
                      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Layers className="size-3.5" />
                          {dashboard._count.widgets} widget{dashboard._count.widgets !== 1 ? "s" : ""}
                        </span>
                        {dashboard.updatedAt && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className={`relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden transition-all duration-300 ${createStep === 1 ? 'max-w-2xl' : 'max-w-md'}`}
              style={{ border: '1px solid #ECECE6' }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #5B47E0, #7C3AED)' }} />
              
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
                    <LayoutDashboard className="size-4" style={{ color: '#5B47E0' }} />
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-base text-foreground">
                      {createStep === 1 ? 'Choose a Template' : 'Name your Dashboard'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {createStep === 1 ? 'Start from scratch or use a pre-built setup.' : 'Give it a recognisable name.'}
                    </p>
                  </div>
                </div>

                {/* Step 1: Template Selection */}
                {createStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 pb-2">
                      {/* Blank Option */}
                      <div
                        onClick={() => setSelectedTemplate("BLANK")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedTemplate === "BLANK" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="font-semibold text-sm">Blank Dashboard</div>
                        <div className="text-xs text-muted-foreground mt-1">Start from scratch with an empty canvas.</div>
                      </div>

                      {/* Seeded Templates */}
                      {isLoadingTemplates ? (
                        <div className="p-4 rounded-xl border border-border flex items-center justify-center">
                          <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        templates.map((tpl) => (
                          <div
                            key={tpl.id}
                            onClick={() => setSelectedTemplate(tpl)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedTemplate === tpl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <div className="font-semibold text-sm">{tpl.name}</div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.description}</div>
                            <div className="text-[10px] font-medium text-primary mt-2 flex items-center gap-1">
                              <Layers className="size-3" />
                              {tpl.widgetCount} widgets
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="flex justify-end pt-2 border-t border-border">
                      <button
                        onClick={handleCloseModal}
                        className="h-9 px-4 mr-2 rounded-xl text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={!selectedTemplate}
                        className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50 bg-primary"
                      >
                        Continue <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Name Input */}
                {createStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dashboard name</label>
                      <input
                        autoFocus
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        placeholder="e.g. SEO Overview"
                        className="w-full h-10 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none transition-shadow"
                        style={{ border: '1px solid #ECECE6' }}
                        onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.15)'; e.currentTarget.style.borderColor = '#5B47E0'; }}
                        onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#ECECE6'; }}
                      />
                    </div>
                    
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => setCreateStep(1)}
                        className="h-9 px-4 rounded-xl text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
                        style={{ border: '1px solid #ECECE6' }}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={!newName.trim() || createMutation.isPending || cloneMutation.isPending}
                        className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                      >
                        {(createMutation.isPending || cloneMutation.isPending) && <Loader2 className="size-3.5 animate-spin" />}
                        {(createMutation.isPending || cloneMutation.isPending) ? 'Creating…' : 'Create'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {renameOpen && dashboardToRename && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setRenameOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <h3 className="font-semibold text-foreground text-lg mb-2">Rename Dashboard</h3>
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && renameValue.trim() && renameMutation.mutate({ dashboardId: dashboardToRename.id, name: renameValue.trim() })}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setRenameOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => renameValue.trim() && renameMutation.mutate({ dashboardId: dashboardToRename.id, name: renameValue.trim() })}
                    disabled={renameMutation.isPending || !renameValue.trim()}
                    className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {renameMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && dashboardToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirmOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Trash2 className="size-5" />
                  </div>
                  <h3 className="font-semibold text-lg">Delete Dashboard?</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you sure you want to delete <strong>{dashboardToDelete.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(dashboardToDelete.id)}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
