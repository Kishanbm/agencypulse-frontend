import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search, Plus, MoreHorizontal, LayoutGrid, List,
  Trash2, ExternalLink, Pencil, Loader2, Building2, Globe, Layers,
  RotateCcw, CheckCircle2, TrendingUp, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Client, ClientsListResponse, CreateClientDto, UpdateClientDto } from "@/types/clients";
import { useHasRole } from "@/hooks/useRole";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLIENT_GRADIENTS = [
  'linear-gradient(135deg, #5B47E0, #8B5CF6)',
  'linear-gradient(135deg, #FF7A59, #FF9A76)',
  'linear-gradient(135deg, #10D9A0, #34d399)',
  'linear-gradient(135deg, #F5A524, #fbbf24)',
  'linear-gradient(135deg, #5B47E0, #FF7A59)',
  'linear-gradient(135deg, #10D9A0, #5B47E0)',
  'linear-gradient(135deg, #FF7A59, #F5A524)',
  'linear-gradient(135deg, #8B5CF6, #10D9A0)',
];

const AVAILABLE_SERVICES = [
  "SEO",
  "PPC",
  "Social Media",
  "Email Marketing",
  "Ecommerce",
  "Analytics",
  "Local & Reputation",
];

// ─── Schemas ──────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  name:    z.string().min(1, "Client name is required"),
  website: z.string().optional(),
  services: z.array(z.string()).optional(),
});
type ClientFormValues = z.infer<typeof clientSchema>;

// ─── Queries / mutations ───────────────────────────────────────────────────────

interface ClientFilters {
  search: string;
  status: string;
  services: string;
  sortBy: string;
}

function useClients(filters: ClientFilters) {
  return useQuery<ClientsListResponse>({
    queryKey: ["clients", filters],
    queryFn: () => api.get<ClientsListResponse>("/clients", { 
      params: { 
        search: filters.search || undefined, 
        status: filters.status || undefined,
        services: filters.services || undefined,
        sortBy: filters.sortBy || undefined,
        limit: 100 
      } 
    }).then((r) => r.data),
    staleTime: 30_000,
  });
}

function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateClientDto) => api.post<Client>("/clients", dto).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client created"); },
    onError: () => toast.error("Failed to create client"),
  });
}

function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateClientDto }) => api.patch<Client>(`/clients/${id}`, dto).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client updated"); },
    onError: () => toast.error("Failed to update client"),
  });
}

function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client archived"); },
    onError: () => toast.error("Failed to archive client"),
  });
}

function useRestoreClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/clients/${id}/restore`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client restored"); },
    onError: () => toast.error("Failed to restore client"),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function inputFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#0F172A';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}

// ─── Client action dropdown ────────────────────────────────────────────────────

function ClientMenu({
  client,
  onEdit,
  onDelete,
  onRestore,
}: {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const isArchived = client.status === 'ARCHIVED';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="size-7 rounded-none flex items-center justify-center transition-colors hover:bg-black/5 bg-black/5"
      >
        <MoreHorizontal className="size-4 text-foreground" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" as const }}
            className="absolute right-0 top-9 z-50 w-44 bg-white rounded-none overflow-hidden py-1"
            style={{ border: '1px solid #ECECE6', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
          >
            <Link
              to={`/clients/${client.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-[#FAFAF7] transition-colors"
            >
              <ExternalLink className="size-3.5 text-muted-foreground" />
              View Details
            </Link>

            {!isArchived && (
              <>
                <button
                  onClick={() => { setOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-[#FAFAF7] transition-colors"
                >
                  <Pencil className="size-3.5 text-muted-foreground" />
                  Edit
                </button>
                <div className="my-1" style={{ height: '1px', background: '#ECECE6' }} />
                <button
                  onClick={() => { setOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors"
                  style={{ color: '#f43f5e' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244,63,94,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 className="size-3.5" />
                  Archive
                </button>
              </>
            )}

            {isArchived && (
              <>
                <div className="my-1" style={{ height: '1px', background: '#ECECE6' }} />
                <button
                  onClick={() => { setOpen(false); onRestore(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors text-emerald-600 hover:bg-emerald-50"
                >
                  <RotateCcw className="size-3.5" />
                  Unarchive
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Client form modal ────────────────────────────────────────────────────────

function ClientFormModal({
  client,
  onClose,
}: {
  client?: Client | null;
  onClose: () => void;
}) {
  const isEdit = !!client;
  const create = useCreateClient();
  const update = useUpdateClient();
  const isPending = create.isPending || update.isPending;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    values: { name: client?.name ?? "", website: client?.website ?? "", services: client?.services ?? [] },
  });

  const navigate = useNavigate();
  const qc = useQueryClient();

  const onSubmit = async (values: ClientFormValues) => {
    if (isEdit && client) {
      await update.mutateAsync({ id: client.id, dto: values });
      onClose();
      form.reset();
    } else {
      const newClient = await create.mutateAsync(values);
      onClose();
      form.reset();
      // Prefetch campaigns before navigating so the detail page renders
      // the auto-created campaign immediately without a staleTime delay.
      await qc.prefetchQuery({
        queryKey: ["campaigns", newClient.id],
        queryFn: () =>
          api.get(`/clients/${newClient.id}/campaigns`, { params: { limit: 100 } }).then((r: any) => r.data),
      });
      navigate(`/clients/${newClient.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" as const }}
        className="bg-white rounded-none overflow-hidden w-full max-w-md mx-auto"
        style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED)' }} />
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
              <Building2 className="size-4" style={{ color: '#5B47E0' }} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-foreground">{isEdit ? "Edit Client" : "Add New Client"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update the client details." : "Enter the details of the new client."}</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Client Name</label>
              <input
                autoFocus
                placeholder="e.g. Acme Corp"
                className="w-full px-3 py-2.5 text-sm rounded-none outline-none transition-all bg-white"
                style={{ border: '1px solid #ECECE6' }}
                onFocus={inputFocus} onBlur={inputBlur}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-[10px]" style={{ color: '#f43f5e' }}>{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  placeholder="e.g. acme.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-none outline-none transition-all bg-white"
                  style={{ border: '1px solid #ECECE6' }}
                  onFocus={inputFocus} onBlur={inputBlur}
                  {...form.register("website")}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Required Services</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SERVICES.map((service) => {
                  const currentServices = form.watch("services") || [];
                  const isSelected = currentServices.includes(service);
                  return (
                    <button
                      type="button"
                      key={service}
                      onClick={() => {
                        if (isSelected) {
                          form.setValue("services", currentServices.filter((s) => s !== service));
                        } else {
                          form.setValue("services", [...currentServices, service]);
                        }
                      }}
                      className="px-3 py-1.5 text-[13px] font-medium rounded-none transition-all duration-200 border cursor-pointer hover:-translate-y-0.5 hover:shadow-sm"
                      style={{
                        backgroundColor: isSelected ? 'rgba(91,71,224,0.1)' : '#fff',
                        borderColor: isSelected ? '#5B47E0' : '#ECECE6',
                        color: isSelected ? '#5B47E0' : 'var(--muted-foreground)',
                      }}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 mt-2 border-t" style={{ borderColor: '#ECECE6' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold rounded-none transition-colors"
                style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-none text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                {isPending ? "Saving…" : isEdit ? "Update Client" : "Create Client"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Archive confirm modal ────────────────────────────────────────────────────

function ArchiveModal({
  clientName,
  onClose,
  onConfirm,
  isPending,
}: {
  clientName: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" as const }}
        className="bg-white rounded-none overflow-hidden w-full max-w-sm mx-auto shadow-2xl"
        style={{ border: '1px solid rgba(244,63,94,0.15)' }}
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(244,63,94,0.12)' }}>
              <Trash2 className="size-5" style={{ color: '#f43f5e' }} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">Archive Client?</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{clientName}</span> will be archived. You can restore it later.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2.5 justify-end mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold rounded-none transition-all hover:bg-gray-50"
              style={{ color: 'var(--foreground)' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-none text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#f43f5e', boxShadow: '0 4px 14px 0 rgba(244, 63, 94, 0.39)' }}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Archiving…" : "Archive Client"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── KPI Dashboard Row ────────────────────────────────────────────────────────
function AgencyMetricsRow({ totalClients, totalCampaigns, activeClients }: { totalClients: number, totalCampaigns: number, activeClients: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-none p-6 flex flex-col justify-center transition-shadow hover:shadow-md relative overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
        <p className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wide">Total Clients</p>
        <div className="flex items-end justify-between mt-2">
          <p className="text-3xl font-heading font-bold text-foreground leading-none">{totalClients}</p>
          <div className="size-8 rounded-none flex items-center justify-center text-indigo-600 bg-indigo-50/50">
            <Building2 className="size-4" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-none p-6 flex flex-col justify-center transition-shadow hover:shadow-md relative overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-emerald-50/50 to-transparent pointer-events-none" />
        <p className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wide">Active Clients</p>
        <div className="flex items-end justify-between mt-2">
          <p className="text-3xl font-heading font-bold text-foreground leading-none">{activeClients}</p>
          <div className="size-8 rounded-none flex items-center justify-center text-emerald-600 bg-emerald-50/50">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-none p-6 flex flex-col justify-center transition-shadow hover:shadow-md relative overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-rose-50/50 to-transparent pointer-events-none" />
        <p className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wide">Total Campaigns</p>
        <div className="flex items-end justify-between mt-2">
          <p className="text-3xl font-heading font-bold text-foreground leading-none">{totalCampaigns}</p>
          <div className="size-8 rounded-none flex items-center justify-center text-rose-600 bg-rose-50/50">
            <TrendingUp className="size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [services, setServices] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const canEdit = useHasRole("AGENCY_ADMIN");
  
  // Throttle search slightly in real app, but for now just pass
  const { data, isLoading } = useClients({ search, status, services, sortBy });
  const deleteClient = useDeleteClient();
  const restoreClient = useRestoreClient();

  const rawClients = data?.data ?? [];
  const clients = useMemo(() => {
    let list = [...rawClients];
    if (sortBy === 'campaigns') {
      list.sort((a, b) => (b._count?.campaigns || 0) - (a._count?.campaigns || 0));
    }
    return list;
  }, [rawClients, sortBy]);
  
  const total     = data?.meta?.total ?? 0;
  const deletingClient = clients.find((c) => c.id === deletingClientId) ?? null;

  // Calculate KPIs (based on fetched clients for now, ideally backend provided)
  const activeClientsCount = clients.filter(c => c.status === 'ACTIVE').length;
  const totalCampaignsCount = clients.reduce((acc, c) => acc + (c._count?.campaigns || 0), 0);

  const isFormOpen = formOpen || !!editingClient;

  function closeForm() {
    setFormOpen(false);
    setEditingClient(null);
  }

  return (
    <div className="p-5 lg:p-7 space-y-6 pb-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-tight text-foreground">Clients</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your agency's clients and their campaigns
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-none text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <Plus className="size-3.5" />
              Add Client
            </button>
          )}
        </div>
      </motion.div>

      {/* KPI Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" as const }}
      >
        <AgencyMetricsRow totalClients={total} activeClients={activeClientsCount} totalCampaigns={totalCampaignsCount} />
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" as const }}
        className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 rounded-none"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              placeholder="Search clients…"
              className="pl-9 pr-3 h-9 w-48 sm:w-56 rounded-none text-sm bg-white outline-none transition-all"
              style={{ border: '1px solid #ECECE6' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>

          <div className="w-px h-6 bg-[#ECECE6] mx-1 shrink-0" />

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 px-3 rounded-none text-sm bg-white outline-none transition-all shrink-0 cursor-pointer appearance-none"
            style={{ border: '1px solid #ECECE6', backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" viewBox="0 0 24 24" stroke="%239CA3AF" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
            onFocus={inputFocus} onBlur={inputBlur}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Service Filter */}
          <select
            value={services}
            onChange={(e) => setServices(e.target.value)}
            className="h-9 px-3 pr-8 rounded-none text-sm bg-white outline-none transition-all shrink-0 cursor-pointer appearance-none"
            style={{ border: '1px solid #ECECE6', backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" viewBox="0 0 24 24" stroke="%239CA3AF" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
            onFocus={inputFocus} onBlur={inputBlur}
          >
            <option value="">All Services</option>
            {AVAILABLE_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 pr-8 rounded-none text-sm bg-white outline-none transition-all cursor-pointer appearance-none"
            style={{ border: '1px solid #ECECE6', backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" viewBox="0 0 24 24" stroke="%239CA3AF" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
            onFocus={inputFocus} onBlur={inputBlur}
          >
            <option value="newest">Sort by Newest</option>
            <option value="name">Sort by Name</option>
            <option value="campaigns">Sort by Campaigns</option>
          </select>

          {/* View toggle */}
          <div className="flex rounded-none p-0.5 gap-0.5" style={{ border: '1px solid #ECECE6', background: 'rgba(0,0,0,0.02)' }}>
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="rounded-none px-2.5 py-1.5 transition-all"
                style={viewMode === mode ? { background: '#5B47E0', color: '#fff' } : { color: '#9CA3AF' }}
              >
                {mode === 'grid' ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-2"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-none animate-pulse" style={{ border: '1px solid #ECECE6', height: viewMode === 'list' ? '64px' : '180px' }} />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="bg-white rounded-none py-20 flex flex-col items-center gap-4"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="size-16 rounded-none flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.08)' }}>
            <Building2 className="size-8" style={{ color: '#5B47E0' }} />
          </div>
          <div className="text-center">
            <p className="font-heading font-semibold text-foreground text-lg">
              {search || status || services ? "No clients match your criteria" : "No clients yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || status || services ? "Try adjusting your filters." : "Add your first client to get started."}
            </p>
          </div>
          {!search && !status && !services && canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-none text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <Plus className="size-3.5" />
              Add your first client
            </button>
          )}
        </motion.div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client, i) => {
            const gradient = CLIENT_GRADIENTS[i % CLIENT_GRADIENTS.length];
            const isActive = client.status === 'ACTIVE';
            const isArchived = client.status === 'ARCHIVED';
            
            // Limit tags
            const displayTags = client.services?.slice(0, 2) || [];
            const extraTags = (client.services?.length || 0) - 2;

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" as const }}
                className={`group bg-white rounded-none p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col h-full ${isArchived ? 'opacity-70' : ''}`}
                style={{ border: '1px solid #ECECE6' }}
              >
                <div className="flex items-start justify-between mb-5 gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    {client.logoUrl ? (
                      <img 
                        src={client.logoUrl} 
                        alt={client.name} 
                        className="size-14 rounded-xl object-cover shadow-sm border border-gray-100 shrink-0" 
                      />
                    ) : (
                      <div
                        className="size-14 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-sm shrink-0"
                        style={{ background: isArchived ? '#9CA3AF' : gradient }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <Link to={`/clients/${client.id}`} className="block min-w-0">
                      <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-[#5B47E0] transition-colors truncate">
                        {client.name}
                      </h3>
                      {client.website && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                          <Globe className="size-3 shrink-0" />
                          <span className="truncate">{client.website}</span>
                        </p>
                      )}
                    </Link>
                  </div>
                  {canEdit && (
                    <ClientMenu
                      client={client}
                      onEdit={() => setEditingClient(client)}
                      onDelete={() => setDeletingClientId(client.id)}
                      onRestore={() => restoreClient.mutate(client.id)}
                    />
                  )}
                </div>

                {/* Service Tags */}
                <div className="flex flex-wrap gap-2 mb-6 flex-grow content-start">
                  {displayTags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 text-[11px] font-semibold bg-[#5B47E0]/5 text-[#5B47E0] rounded-none border border-[#5B47E0]/10">
                      {tag}
                    </span>
                  ))}
                  {extraTags > 0 && (
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-gray-50 text-gray-500 rounded-none border border-gray-100">
                      +{extraTags}
                    </span>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between mt-auto" style={{ borderTop: '1px solid #ECECE6' }}>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                    <Layers className="size-3.5" />
                    {client._count.campaigns} campaign{client._count.campaigns !== 1 ? "s" : ""}
                  </span>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-none"
                    style={isActive
                      ? { background: 'rgba(16,217,160,0.10)', color: '#059669' }
                      : isArchived 
                        ? { background: 'rgba(244,63,94,0.10)', color: '#e11d48' }
                        : { background: 'rgba(0,0,0,0.05)', color: '#9CA3AF' }
                    }
                  >
                    {isActive ? 'Active' : (client.status?.toLowerCase() ?? 'inactive')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-none overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />
          <div
            className="grid grid-cols-[1fr_120px_80px_100px_40px] gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            style={{ borderBottom: '1px solid #ECECE6', background: 'rgba(0,0,0,0.02)' }}
          >
            <span>Client</span>
            <span>Services</span>
            <span>Campaigns</span>
            <span>Status</span>
            <span />
          </div>
          {clients.map((client, i) => {
            const gradient = CLIENT_GRADIENTS[i % CLIENT_GRADIENTS.length];
            const isArchived = client.status === 'ARCHIVED';
            const isActive = client.status === 'ACTIVE';

            // Limit tags for list view
            const displayTags = client.services?.slice(0, 2) || [];
            const extraTags = (client.services?.length || 0) - 2;

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03, ease: "easeOut" as const }}
                className={`group grid grid-cols-[1fr_120px_80px_100px_40px] gap-4 items-center px-5 py-3.5 hover:bg-[#FAFAF7] transition-colors ${isArchived ? 'opacity-70' : ''}`}
                style={{ borderBottom: i < clients.length - 1 ? '1px solid #ECECE6' : 'none' }}
              >
                <Link to={`/clients/${client.id}`} className="flex items-center gap-3 min-w-0">
                  {client.logoUrl ? (
                    <img 
                      src={client.logoUrl} 
                      alt={client.name} 
                      className="size-9 rounded-xl shrink-0 object-cover border border-gray-100" 
                    />
                  ) : (
                    <div
                      className="size-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: isArchived ? '#9CA3AF' : gradient }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-[#5B47E0] transition-colors">
                      {client.name}
                    </p>
                    {client.website && (
                      <p className="text-xs text-muted-foreground truncate">{client.website}</p>
                    )}
                  </div>
                </Link>
                
                {/* Services Column */}
                <div className="flex flex-wrap gap-1">
                  {displayTags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-600 rounded-none">
                      {tag}
                    </span>
                  ))}
                  {extraTags > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-600 rounded-none">
                      +{extraTags}
                    </span>
                  )}
                  {displayTags.length === 0 && <span className="text-xs text-gray-400">-</span>}
                </div>

                <span className="text-sm text-muted-foreground">{client._count.campaigns}</span>
                
                {/* Status Column */}
                <div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-none"
                    style={isActive
                      ? { background: 'rgba(16,217,160,0.10)', color: '#059669' }
                      : isArchived 
                        ? { background: 'rgba(244,63,94,0.10)', color: '#e11d48' }
                        : { background: 'rgba(0,0,0,0.05)', color: '#9CA3AF' }
                    }
                  >
                    {isActive ? 'Active' : (client.status?.toLowerCase() ?? 'inactive')}
                  </span>
                </div>

                <div className="flex items-center justify-end">
                  {canEdit && (
                    <ClientMenu
                      client={client}
                      onEdit={() => setEditingClient(client)}
                      onDelete={() => setDeletingClientId(client.id)}
                      onRestore={() => restoreClient.mutate(client.id)}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isFormOpen && (
          <ClientFormModal
            client={editingClient}
            onClose={closeForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingClient && (
          <ArchiveModal
            clientName={deletingClient.name}
            onClose={() => setDeletingClientId(null)}
            onConfirm={() => { deleteClient.mutate(deletingClient.id); setDeletingClientId(null); }}
            isPending={deleteClient.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
