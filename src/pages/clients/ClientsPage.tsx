import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search, Plus, MoreHorizontal, LayoutGrid, List,
  Trash2, ExternalLink, Pencil, Loader2, Building2, Globe, Layers,
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

// ─── Schemas ──────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  name:    z.string().min(1, "Client name is required"),
  website: z.string().optional(),
});
type ClientFormValues = z.infer<typeof clientSchema>;

// ─── Queries / mutations ───────────────────────────────────────────────────────

function useClients(search: string) {
  return useQuery<ClientsListResponse>({
    queryKey: ["clients", search],
    queryFn: () => api.get<ClientsListResponse>("/clients", { params: { search: search || undefined, limit: 100 } }).then((r) => r.data),
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
    onError: () => toast.error("Failed to delete client"),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function inputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}

// ─── Client action dropdown ────────────────────────────────────────────────────

function ClientMenu({
  client,
  onEdit,
  onDelete,
}: {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.04)' }}
      >
        <MoreHorizontal className="size-3.5 text-muted-foreground" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" as const }}
            className="absolute right-0 top-9 z-50 w-44 bg-white rounded-xl overflow-hidden py-1"
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
    values: { name: client?.name ?? "", website: client?.website ?? "" },
  });

  const onSubmit = async (values: ClientFormValues) => {
    if (isEdit && client) {
      await update.mutateAsync({ id: client.id, dto: values });
    } else {
      await create.mutateAsync(values);
    }
    onClose();
    form.reset();
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
        className="bg-white rounded-2xl overflow-hidden w-full max-w-md mx-auto"
        style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED)' }} />
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
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
                className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white"
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
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white"
                  style={{ border: '1px solid #ECECE6' }}
                  onFocus={inputFocus} onBlur={inputBlur}
                  {...form.register("website")}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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
        className="bg-white rounded-2xl overflow-hidden w-full max-w-sm mx-auto"
        style={{ border: '1px solid rgba(244,63,94,0.20)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#e11d48)' }} />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(244,63,94,0.10)' }}>
              <Trash2 className="size-4" style={{ color: '#f43f5e' }} />
            </div>
            <h2 className="font-heading font-bold text-base text-foreground">Archive Client?</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{clientName}</span> and all associated campaigns will be archived. You can restore it later.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors"
              style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isPending ? "Archiving…" : "Archive"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const canEdit = useHasRole("AGENCY_ADMIN");
  const { data, isLoading } = useClients(search);
  const deleteClient = useDeleteClient();

  const clients   = data?.data ?? [];
  const total     = data?.meta?.total ?? 0;
  const deletingClient = clients.find((c) => c.id === deletingClientId) ?? null;

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
            {isLoading ? "Loading…" : `${total} client${total !== 1 ? "s" : ""} in your agency`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              placeholder="Search clients…"
              className="pl-9 pr-3 h-9 w-56 rounded-xl text-sm bg-white outline-none transition-all"
              style={{ border: '1px solid #ECECE6' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#5B47E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl p-0.5 gap-0.5" style={{ border: '1px solid #ECECE6', background: 'rgba(0,0,0,0.02)' }}>
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="rounded-lg px-2.5 py-1.5 transition-all"
                style={viewMode === mode ? { background: '#5B47E0', color: '#fff' } : { color: '#9CA3AF' }}
              >
                {mode === 'grid' ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />}
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <Plus className="size-3.5" />
              Add Client
            </button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #ECECE6', height: viewMode === 'list' ? '64px' : '140px' }} />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="bg-white rounded-2xl py-20 flex flex-col items-center gap-4"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="size-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.08)' }}>
            <Building2 className="size-8" style={{ color: '#5B47E0' }} />
          </div>
          <div className="text-center">
            <p className="font-heading font-semibold text-foreground text-lg">
              {search ? "No clients match your search" : "No clients yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try a different keyword." : "Add your first client to get started."}
            </p>
          </div>
          {!search && canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <Plus className="size-3.5" />
              Add your first client
            </button>
          )}
        </motion.div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clients.map((client, i) => {
            const gradient = CLIENT_GRADIENTS[i % CLIENT_GRADIENTS.length];
            const isActive = client.status === 'ACTIVE';
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" as const }}
                className="group bg-white rounded-2xl p-5 hover:shadow-lg transition-shadow relative overflow-hidden"
                style={{ border: '1px solid #ECECE6' }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: gradient }} />
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-sm"
                    style={{ background: gradient }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  {canEdit && (
                    <ClientMenu
                      client={client}
                      onEdit={() => setEditingClient(client)}
                      onDelete={() => setDeletingClientId(client.id)}
                    />
                  )}
                </div>

                <Link to={`/clients/${client.id}`} className="block">
                  <h3 className="font-heading font-semibold text-foreground group-hover:text-[#5B47E0] transition-colors truncate">
                    {client.name}
                  </h3>
                  {client.website && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                      <Globe className="size-2.5 shrink-0" />{client.website}
                    </p>
                  )}
                </Link>

                <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid #ECECE6' }}>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Layers className="size-3" />
                    {client._count.campaigns} campaign{client._count.campaigns !== 1 ? "s" : ""}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={isActive
                      ? { background: 'rgba(16,217,160,0.10)', color: '#059669' }
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
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />
          <div
            className="grid grid-cols-[1fr_80px_120px_40px] gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            style={{ borderBottom: '1px solid #ECECE6', background: 'rgba(0,0,0,0.02)' }}
          >
            <span>Client</span>
            <span>Campaigns</span>
            <span>Created</span>
            <span />
          </div>
          {clients.map((client, i) => {
            const gradient = CLIENT_GRADIENTS[i % CLIENT_GRADIENTS.length];
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03, ease: "easeOut" as const }}
                className="group grid grid-cols-[1fr_80px_120px_40px] gap-4 items-center px-5 py-3.5 hover:bg-[#FAFAF7] transition-colors"
                style={{ borderBottom: i < clients.length - 1 ? '1px solid #ECECE6' : 'none' }}
              >
                <Link to={`/clients/${client.id}`} className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: gradient }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-[#5B47E0] transition-colors">
                      {client.name}
                    </p>
                    {client.website && (
                      <p className="text-xs text-muted-foreground truncate">{client.website}</p>
                    )}
                  </div>
                </Link>
                <span className="text-sm text-muted-foreground">{client._count.campaigns}</span>
                <span className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</span>
                <div className="flex items-center justify-end">
                  {canEdit && (
                    <ClientMenu
                      client={client}
                      onEdit={() => setEditingClient(client)}
                      onDelete={() => setDeletingClientId(client.id)}
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
