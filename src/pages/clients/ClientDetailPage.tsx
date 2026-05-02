import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, MoreHorizontal, Pencil, Trash2, Loader2,
  ChevronRight, Rocket, ArrowUpRight, Users, Building2,
  Globe, Calendar, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useHasRole } from "@/hooks/useRole";
import type { Client, Campaign, CampaignsListResponse, CreateCampaignDto, UpdateCampaignDto } from "@/types/clients";

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMPAIGN_GRADIENTS = [
  'linear-gradient(135deg, #5B47E0, #8B5CF6)',
  'linear-gradient(135deg, #FF7A59, #FF9A76)',
  'linear-gradient(135deg, #10D9A0, #34d399)',
  'linear-gradient(135deg, #F5A524, #fbbf24)',
  'linear-gradient(135deg, #5B47E0, #FF7A59)',
  'linear-gradient(135deg, #10D9A0, #5B47E0)',
  'linear-gradient(135deg, #FF7A59, #F5A524)',
  'linear-gradient(135deg, #8B5CF6, #10D9A0)',
];

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  ACTIVE:   { label: 'Active',   bg: 'rgba(16,217,160,0.10)',  color: '#059669', border: '1px solid rgba(16,217,160,0.22)' },
  PAUSED:   { label: 'Paused',   bg: 'rgba(245,165,36,0.10)',  color: '#d97706', border: '1px solid rgba(245,165,36,0.22)' },
  INACTIVE: { label: 'Inactive', bg: 'rgba(156,163,175,0.10)', color: '#6B7280', border: '1px solid rgba(156,163,175,0.18)' },
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const campaignSchema = z.object({
  name:        z.string().min(1, "Campaign name is required").max(255),
  description: z.string().optional(),
});
type CampaignFormValues = z.infer<typeof campaignSchema>;

// ─── Queries / mutations ───────────────────────────────────────────────────────

function useClient(clientId: string) {
  return useQuery<Client>({
    queryKey: ["client", clientId],
    queryFn: () => api.get<Client>(`/clients/${clientId}`).then((r) => r.data),
  });
}

function useCampaigns(clientId: string) {
  return useQuery<CampaignsListResponse>({
    queryKey: ["campaigns", clientId],
    queryFn: () => api.get<CampaignsListResponse>(`/clients/${clientId}/campaigns`, { params: { limit: 100 } }).then((r) => r.data),
  });
}

function useCreateCampaign(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCampaignDto) => api.post<Campaign>(`/clients/${clientId}/campaigns`, dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns", clientId] });
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      toast.success("Campaign created");
    },
    onError: () => toast.error("Failed to create campaign"),
  });
}

function useUpdateCampaign(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCampaignDto }) =>
      api.patch<Campaign>(`/clients/${clientId}/campaigns/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns", clientId] });
      toast.success("Campaign updated");
    },
    onError: () => toast.error("Failed to update campaign"),
  });
}

function useDeleteCampaign(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${clientId}/campaigns/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns", clientId] });
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      toast.success("Campaign deleted");
    },
    onError: () => toast.error("Failed to delete campaign"),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function inputFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}

// ─── Campaign action dropdown ─────────────────────────────────────────────────

function CampaignMenu({ campaign, clientId, onEdit, onDelete }: { campaign: Campaign; clientId: string; onEdit: () => void; onDelete: () => void }) {
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
              to={`/clients/${clientId}/campaigns/${campaign.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-[#FAFAF7] transition-colors"
            >
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
              Open
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
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Campaign form modal ──────────────────────────────────────────────────────

function CampaignFormModal({ clientId, campaign, onClose }: { clientId: string; campaign?: Campaign | null; onClose: () => void }) {
  const isEdit = !!campaign;
  const create = useCreateCampaign(clientId);
  const update = useUpdateCampaign(clientId);
  const isPending = create.isPending || update.isPending;

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    values: { name: campaign?.name ?? "", description: campaign?.description ?? "" },
  });

  const onSubmit = async (values: CampaignFormValues) => {
    if (isEdit && campaign) await update.mutateAsync({ id: campaign.id, dto: values });
    else await create.mutateAsync(values);
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
              <Rocket className="size-4" style={{ color: '#5B47E0' }} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-foreground">{isEdit ? "Edit Campaign" : "Add New Campaign"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? "Update the campaign details." : "A default dashboard will be created automatically."}
              </p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Campaign Name</label>
              <input
                autoFocus
                placeholder="e.g. Google Ads Q2 2026"
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
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Description (optional)</label>
              <textarea
                rows={3}
                placeholder="Optional description…"
                className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white resize-none"
                style={{ border: '1px solid #ECECE6' }}
                onFocus={inputFocus as any} onBlur={inputBlur as any}
                {...form.register("description")}
              />
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
                {isPending ? "Saving…" : isEdit ? "Update Campaign" : "Create Campaign"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({ onClose, onConfirm, isPending }: { onClose: () => void; onConfirm: () => void; isPending: boolean }) {
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
            <h2 className="font-heading font-bold text-base text-foreground">Delete Campaign?</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            This will archive the campaign and its dashboards and reports. You can restore it later.
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
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [formOpen, setFormOpen]         = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const canEdit = useHasRole("AGENCY_ADMIN");
  const { data: client, isLoading: clientLoading } = useClient(clientId!);
  const { data: campaignData, isLoading: campaignsLoading } = useCampaigns(clientId!);
  const deleteCampaign = useDeleteCampaign(clientId!);

  const campaigns = campaignData?.data ?? [];
  const total     = campaignData?.meta?.total ?? 0;

  const isFormOpen = formOpen || !!editingCampaign;
  function closeForm() { setFormOpen(false); setEditingCampaign(null); }

  if (clientLoading) {
    return (
      <div className="p-5 lg:p-7 flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" style={{ color: '#5B47E0' }} />
          <span className="text-sm">Loading client…</span>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-5 lg:p-7 flex flex-col items-center justify-center h-64 gap-3">
        <Building2 className="size-12 opacity-20" />
        <p className="text-sm font-medium text-muted-foreground">Client not found.</p>
        <Link
          to="/clients"
          className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
        >
          Back to Clients
        </Link>
      </div>
    );
  }

  const isActive = client.status === 'ACTIVE';

  return (
    <div className="p-5 lg:p-7 space-y-6 pb-12 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link to="/clients" className="hover:text-foreground transition-colors font-medium">Clients</Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground font-semibold">{client.name}</span>
      </motion.nav>

      {/* Client hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        {/* Dark header strip */}
        <div className="px-6 pt-6 pb-5" style={{ background: '#0F0D1F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className="size-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #5B47E0, #8B5CF6)' }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading font-bold text-xl text-white tracking-tight">{client.name}</h1>
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={isActive
                    ? { background: 'rgba(16,217,160,0.18)', color: '#10D9A0' }
                    : { background: 'rgba(156,163,175,0.15)', color: '#9CA3AF' }
                  }
                >
                  {isActive ? 'Active' : (client.status?.toLowerCase() ?? 'inactive')}
                </span>
              </div>

              {client.website && (
                <a
                  href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-1 text-xs w-fit transition-colors"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.45)'; }}
                >
                  <Globe className="size-3" />
                  {client.website}
                  <ArrowUpRight className="size-3" />
                </a>
              )}

              <div className="flex items-center gap-5 mt-3">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  <Rocket className="size-3.5" style={{ color: '#5B47E0' }} />
                  <span className="font-semibold text-white">{client._count.campaigns}</span>
                  <span>campaign{client._count.campaigns !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  <Users className="size-3.5" style={{ color: '#10D9A0' }} />
                  <span className="font-semibold text-white">{client._count.staffAssignments}</span>
                  <span>staff assigned</span>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/clients/${clientId}/team`}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                >
                  <Users className="size-3.5" />
                  Manage team
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: '#ECECE6' }}>
          {[
            { icon: Rocket,   color: '#5B47E0', label: 'Campaigns',    value: client._count.campaigns },
            { icon: Users,    color: '#10D9A0', label: 'Staff',        value: client._count.staffAssignments },
            { icon: Calendar, color: '#F5A524', label: 'Member since', value: formatDate(client.createdAt) },
          ].map(({ icon: Icon, color, label, value }) => (
            <div key={label} className="flex flex-col items-center py-4 gap-1">
              <Icon className="size-4 mb-1" style={{ color }} />
              <span className="text-sm font-bold text-foreground">{value}</span>
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Campaigns section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
              <Rocket className="size-3.5" style={{ color: '#5B47E0' }} />
            </div>
            <span className="font-heading font-semibold text-sm text-foreground">Campaigns</span>
            {!campaignsLoading && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(91,71,224,0.08)', color: '#5B47E0' }}>
                {total}
              </span>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <Plus className="size-3" />
              Add campaign
            </button>
          )}
        </div>

        {campaignsLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="size-9 rounded-xl animate-pulse bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.08)' }}>
              <Rocket className="size-7" style={{ color: '#5B47E0' }} />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground">No campaigns yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create the first campaign for {client.name}.</p>
            </div>
            {canEdit && (
              <button
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
              >
                <Plus className="size-3.5" />
                Create first campaign
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#ECECE6' }}>
            {campaigns.map((campaign, i) => {
              const gradient     = CAMPAIGN_GRADIENTS[i % CAMPAIGN_GRADIENTS.length];
              const statusStyle  = STATUS_STYLES[campaign.status] ?? STATUS_STYLES['INACTIVE'];
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" as const }}
                  className="group flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAF7] transition-colors"
                >
                  <div
                    className="size-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: gradient }}
                  >
                    {campaign.name.charAt(0).toUpperCase()}
                  </div>

                  <Link to={`/clients/${clientId}/campaigns/${campaign.id}`} className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-[#5B47E0] transition-colors">
                      {campaign.name}
                    </p>
                    {campaign.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-sm mx-auto">{campaign.description}</p>
                    )}
                  </Link>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-xl"
                      style={{ background: statusStyle.bg, color: statusStyle.color, border: statusStyle.border }}
                    >
                      {statusStyle.label}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(campaign.createdAt)}</span>
                    {canEdit && (
                      <CampaignMenu
                        campaign={campaign}
                        clientId={clientId!}
                        onEdit={() => setEditingCampaign(campaign)}
                        onDelete={() => setDeletingId(campaign.id)}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {isFormOpen && (
          <CampaignFormModal
            clientId={clientId!}
            campaign={editingCampaign}
            onClose={closeForm}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deletingId && (
          <DeleteModal
            onClose={() => setDeletingId(null)}
            onConfirm={() => { deleteCampaign.mutate(deletingId!); setDeletingId(null); }}
            isPending={deleteCampaign.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
