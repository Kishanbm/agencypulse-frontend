import { useState } from "react";
import { Plus, LayoutDashboard, ChevronRight, Loader2, Layers, ArrowRight } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import { useHasRole } from "@/hooks/useRole";

interface Dashboard {
  id: string;
  name: string;
  isDefault: boolean;
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
  const [newName, setNewName] = useState("");

  const queryKey = ["dashboards", campaignId];

  const { data: dashboards = [], isLoading, error } = useQuery<Dashboard[]>({
    queryKey,
    queryFn: () =>
      api
        .get<Dashboard[]>(`/campaigns/${campaignId}/dashboards`)
        .then((r) => (Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? [])),
    enabled: !!campaignId,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      api
        .post<Dashboard>(`/campaigns/${campaignId}/dashboards`, { name })
        .then((r) => r.data),
    onSuccess: (created) => {
      toast.success(`Dashboard "${created.name}" created`);
      void queryClient.invalidateQueries({ queryKey });
      setCreateOpen(false);
      setNewName("");
      navigate(`/clients/${clientId}/campaigns/${campaignId}/dashboards/${created.id}`);
    },
    onError: () => {
      toast.error("Failed to create dashboard — please try again");
    },
  });

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    createMutation.mutate(name);
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 space-y-5">
        <div className="h-8 w-40 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
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
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[1200px]">
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
        {canEdit && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
          >
            <Plus className="size-4" />
            Create Dashboard
          </button>
        )}
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {dashboards.map((dashboard, i) => {
            const gradient = DASH_GRADIENTS[i % DASH_GRADIENTS.length];
            return (
              <motion.div
                key={dashboard.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" as const }}
                className="bg-white rounded-2xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
                style={{ border: '1px solid #ECECE6' }}
                onClick={() => navigate(`/clients/${clientId}/campaigns/${campaignId}/dashboards/${dashboard.id}`)}
              >
                {/* Gradient top strip */}
                <div className="h-1 w-full" style={{ background: gradient }} />

                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="size-10 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ background: gradient }}
                    >
                      <LayoutDashboard className="size-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-heading font-semibold text-sm text-foreground truncate">{dashboard.name}</h4>
                        {dashboard.isDefault && (
                          <span
                            className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: 'rgba(91,71,224,0.10)', color: '#5B47E0' }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Layers className="size-3" />
                        {dashboard._count.widgets} widget{dashboard._count.widgets !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ArrowRight
                      className="size-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform duration-200"
                    />
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
              onClick={() => { setCreateOpen(false); setNewName(""); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              style={{ border: '1px solid #ECECE6' }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #5B47E0, #7C3AED)' }} />
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
                    <LayoutDashboard className="size-4" style={{ color: '#5B47E0' }} />
                  </div>
                  <h2 className="font-heading font-semibold text-base text-foreground">Create Dashboard</h2>
                </div>
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
                    onClick={() => { setCreateOpen(false); setNewName(""); }}
                    className="h-9 px-4 rounded-xl text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
                    style={{ border: '1px solid #ECECE6' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || createMutation.isPending}
                    className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                  >
                    {createMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                    {createMutation.isPending ? 'Creating…' : 'Create'}
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
