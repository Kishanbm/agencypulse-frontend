import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, MoreHorizontal, Pencil, Trash2, Loader2,
  ChevronRight, Rocket, ArrowUpRight, Users, Building2,
  Globe, Calendar, Activity, BarChart2, FileText, Plug,
  Bell, MessageSquare, Clock
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

function useClientActivity(clientId: string) {
  return useQuery<{ id: string; action: string; time: string; type: string }[]>({
    queryKey: ["clientActivity", clientId],
    queryFn: () => api.get<{ id: string; action: string; time: string; type: string }[]>(`/clients/${clientId}/activity`).then((r) => r.data),
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
  e.currentTarget.style.borderColor = '#0F172A';
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
        className="size-7 rounded-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
            className="absolute right-0 top-9 z-50 w-44 bg-white rounded-none overflow-hidden py-1"
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
        className="bg-white rounded-none overflow-hidden w-full max-w-md mx-auto"
        style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED)' }} />
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
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
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Description (optional)</label>
              <textarea
                rows={3}
                placeholder="Optional description…"
                className="w-full px-3 py-2.5 text-sm rounded-none outline-none transition-all bg-white resize-none"
                style={{ border: '1px solid #ECECE6' }}
                onFocus={inputFocus as any} onBlur={inputBlur as any}
                {...form.register("description")}
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
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
        className="bg-white rounded-none overflow-hidden w-full max-w-sm mx-auto"
        style={{ border: '1px solid rgba(244,63,94,0.20)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#e11d48)' }} />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(244,63,94,0.10)' }}>
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
              className="px-4 py-2.5 text-sm font-semibold rounded-none transition-colors"
              style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-none text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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
  const [activityPage, setActivityPage] = useState(1);

  const { data: client, isLoading: clientLoading } = useClient(clientId!);
  const { data: campaignData, isLoading: campaignsLoading } = useCampaigns(clientId!);
  const { data: activityData, isLoading: activityLoading } = useClientActivity(clientId!);
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
          className="text-sm font-semibold px-4 py-2 rounded-none transition-colors"
          style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
        >
          Back to Clients
        </Link>
      </div>
    );
  }

  const isActive = client.status === 'ACTIVE';

  // Calculate Roll-Up Metrics
  const totalIntegrations = campaigns.reduce((acc, c) => acc + (c._count?.integrationConnections || 0), 0);
  const totalDashboards = campaigns.reduce((acc, c) => acc + (c._count?.dashboards || 0), 0);
  const totalReports = campaigns.reduce((acc, c) => acc + (c._count?.reports || 0), 0);

  // Calculate Pulse Score (0-100)
  const calculatePulse = () => {
    if (campaigns.length === 0) return 0;
    let score = 0;
    campaigns.forEach(c => {
      if (c.status === 'ACTIVE') score += 100;
      else if (c.status === 'PAUSED') score += 50;
    });
    return Math.round(score / campaigns.length);
  };
  const pulseScore = calculatePulse();
  const pulseCircumference = 2 * Math.PI * 38;
  const pulseOffset = pulseCircumference - (pulseScore / 100) * pulseCircumference;

  return (
    <div className="p-5 lg:p-7 space-y-6 pb-12 max-w-[1600px] mx-auto">
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

      {/* Client Hero Command Center (Full Width) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="bg-white rounded-xl overflow-hidden w-full animate-in fade-in slide-in-from-top-4"
        style={{ border: '1px solid #ECECE6' }}
      >
            {/* Top section with client details and pulse score */}
            <div className="px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-custom-gradient border-b border-gray-200">
              <style dangerouslySetInnerHTML={{__html: `
                .bg-custom-gradient {
                  background: linear-gradient(to right, #1f2937 0%, #374151 40%, #e5e7eb 75%, #ffffff 100%);
                }
              `}} />
              <div className="flex items-center gap-6 relative z-10">
                <div
                  className="size-[84px] rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-sm shrink-0 border border-zinc-650 relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-90" style={{ background: 'linear-gradient(135deg, #4f46e5, #ec4899)' }} />
                  {client.logoUrl ? (
                    <img src={client.logoUrl} alt={client.name} className="relative z-10 size-full object-cover" />
                  ) : (
                    <span className="relative z-10">{client.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-heading font-bold text-2xl text-white tracking-tight">{client.name}</h1>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-none border border-transparent"
                      style={isActive
                        ? { background: '#10b981', color: '#ffffff' }
                        : { background: '#4b5563', color: '#f3f4f6' }
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
                      className="flex items-center gap-1 mt-1 text-xs w-fit transition-colors group text-zinc-300"
                    >
                      <Globe className="size-3.5 group-hover:text-white transition-colors" />
                      <span className="group-hover:text-white transition-colors">{client.website}</span>
                      <ArrowUpRight className="size-3 group-hover:text-white transition-colors" />
                    </a>
                  )}

                  {canEdit && (
                    <div className="flex items-center gap-2 mt-3">
                      <Link
                        to={`/clients/${clientId}/team`}
                        className="inline-flex items-center gap-1.5 px-3 h-7 rounded-none text-[11px] font-semibold transition-colors bg-[#5B47E0] hover:bg-[#4F39D0] text-white shadow-sm border border-transparent"
                      >
                        <Users className="size-3" />
                        Manage Team
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Pulse Score Gauge */}
              <div className="flex items-center gap-5 shrink-0 bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-lg relative z-10">
                <div className="relative size-20 flex items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="38"
                      fill="transparent"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50" cy="50" r="38"
                      fill="transparent"
                      stroke={pulseScore >= 80 ? "#10D9A0" : pulseScore >= 50 ? "#F5A524" : "#f43f5e"}
                      strokeWidth="8"
                      strokeDasharray={pulseCircumference}
                      strokeDashoffset={pulseOffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white tracking-tight">{pulseScore}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 max-w-[100px]">
                  <span className="text-sm font-bold text-white">Client Pulse</span>
                  <span className="text-xs leading-tight text-slate-400">
                    Based on active campaigns & integrations
                  </span>
                </div>
              </div>
            </div>

            {/* Roll-Up Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0" style={{ borderColor: '#ECECE6' }}>
              {[
                { icon: Rocket, color: '#5B47E0', label: 'Total Campaigns', value: client._count.campaigns },
                { icon: Plug, color: '#F5A524', label: 'Connected Integrations', value: totalIntegrations },
                { icon: BarChart2, color: '#10D9A0', label: 'Active Dashboards', value: totalDashboards },
                { icon: FileText, color: '#0ea5e9', label: 'Automated Reports', value: totalReports },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="flex items-center gap-4 px-6 py-5">
                  <div className="size-10 rounded-none flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                    <Icon className="size-5" style={{ color }} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-foreground leading-none mb-1">{value}</span>
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Two-Column Layout below Hero Card */}
          <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
            {/* LEFT COLUMN: Campaigns */}
            <div className="flex-1 w-full space-y-6">
              <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                Campaigns
                <span className="text-xs px-2 py-0.5 rounded-none bg-primary/10 text-primary font-bold">
                  {total}
                </span>
              </h2>
              {canEdit && (
                <button
                  onClick={() => setFormOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-none text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                >
                  <Plus className="size-4" />
                  Add Campaign
                </button>
              )}
            </div>

            {campaignsLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-none p-5 border border-[#ECECE6] animate-pulse h-24" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white rounded-none border border-[#ECECE6] py-16 flex flex-col items-center gap-4 text-center">
                <div className="size-14 rounded-none flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.08)' }}>
                  <Rocket className="size-7" style={{ color: '#5B47E0' }} />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">No campaigns yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create the first campaign for {client.name}.</p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setFormOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-none text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                  >
                    <Plus className="size-3.5" />
                    Create first campaign
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {campaigns.map((campaign, i) => {
                  const gradient = CAMPAIGN_GRADIENTS[i % CAMPAIGN_GRADIENTS.length];
                  const statusStyle = STATUS_STYLES[campaign.status] ?? STATUS_STYLES['INACTIVE'];
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
                      className="group bg-white rounded-none p-5 hover:shadow-lg transition-all duration-300 relative border border-[#ECECE6] hover:border-primary/40 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="size-12 rounded-none flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0" style={{ background: gradient }}>
                          {campaign.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link to={`/clients/${clientId}/campaigns/${campaign.id}`} className="group/link flex flex-col">
                            <h3 className="font-bold text-foreground text-[16px] group-hover/link:text-primary transition-colors line-clamp-1 leading-tight mb-1">
                              {campaign.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {campaign.description || 'No description provided'}
                            </p>
                          </Link>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2.5 shrink-0 items-center">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-slate-50 border border-slate-100 min-w-[95px] justify-center">
                          <BarChart2 className="size-3.5 text-emerald-500" />
                          <span className="text-[11px] font-semibold text-muted-foreground">Dashboards</span>
                          <span className="text-xs font-bold text-foreground ml-auto">{campaign._count?.dashboards || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-slate-50 border border-slate-100 min-w-[95px] justify-center">
                          <FileText className="size-3.5 text-sky-500" />
                          <span className="text-[11px] font-semibold text-muted-foreground">Reports</span>
                          <span className="text-xs font-bold text-foreground ml-auto">{campaign._count?.reports || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-slate-50 border border-slate-100 min-w-[95px] justify-center">
                          <Plug className="size-3.5 text-orange-500" />
                          <span className="text-[11px] font-semibold text-muted-foreground">Integrations</span>
                          <span className="text-xs font-bold text-foreground ml-auto">{campaign._count?.integrationConnections || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#ECECE6]/60">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-none tracking-wide"
                          style={{ background: statusStyle.bg, color: statusStyle.color, border: statusStyle.border }}
                        >
                          {statusStyle.label}
                        </span>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/clients/${clientId}/campaigns/${campaign.id}`}
                            className="h-8 px-3 rounded-none text-xs font-semibold bg-[#FAFAF7] hover:bg-[#ECECE6] text-foreground transition-colors border border-[#ECECE6] flex items-center gap-1"
                          >
                            Open
                            <ChevronRight className="size-3" />
                          </Link>

                          {canEdit && (
                            <CampaignMenu
                              campaign={campaign}
                              clientId={clientId!}
                              onEdit={() => setEditingCampaign(campaign)}
                              onDelete={() => setDeletingId(campaign.id)}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Global Activity Feed */}
        <div className="w-full xl:w-80 shrink-0">
          <div className="bg-white rounded-none border border-[#ECECE6] overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-[#ECECE6] flex items-center gap-2 bg-[#FAFAF7]/50">
              <Activity className="size-4 text-primary" />
              <h3 className="font-heading font-semibold text-sm text-foreground">Global Activity</h3>
            </div>
            
            <div className="p-5">
              {activityLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="size-6 rounded-none bg-muted shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded-none w-3/4" />
                        <div className="h-2 bg-muted rounded-none w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !activityData || activityData.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <Clock className="size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium text-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-1">Actions across all campaigns will appear here.</p>
                </div>
              ) : (() => {
                const itemsPerPage = 5;
                const paginatedActivity = activityData.slice((activityPage - 1) * itemsPerPage, activityPage * itemsPerPage);
                const totalPages = Math.ceil(activityData.length / itemsPerPage);

                return (
                  <div className="space-y-5">
                    <div className="space-y-7 relative py-2 px-1">
                      {/* Vertical line connecting timeline */}
                      {paginatedActivity.length > 1 && (
                        <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-100 rounded-none" />
                      )}
                      
                      {paginatedActivity.map((activity) => {
                        let formattedAction = activity.action;
                        let campaignBadge = null;
                        const match = activity.action.match(/^\[(.*?)\] (.*)$/);
                        if (match) {
                          campaignBadge = match[1];
                          formattedAction = match[2];
                        }

                        return (
                          <div key={activity.id} className="flex gap-4 relative z-10 group/activity">
                            <div className="size-8 rounded-none bg-white flex items-center justify-center border-2 shrink-0 shadow-sm transition-transform group-hover/activity:scale-110" 
                                 style={{ borderColor: activity.type === 'alert' ? '#f43f5e' : activity.type === 'note' ? '#0ea5e9' : activity.type === 'integration' ? '#f97316' : '#5B47E0' }}>
                              {activity.type === 'alert' && <Bell className="size-3.5 text-rose-500" />}
                              {activity.type === 'note' && <MessageSquare className="size-3.5 text-sky-500" />}
                              {activity.type === 'integration' && <Plug className="size-3.5 text-orange-500" />}
                              {activity.type !== 'alert' && activity.type !== 'note' && activity.type !== 'integration' && <Activity className="size-3.5 text-primary" />}
                            </div>
                            <div className="flex flex-col pt-1.5 min-w-0 pb-1">
                              {campaignBadge && (
                                <span className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">
                                  {campaignBadge}
                                </span>
                              )}
                              <span className="text-[13px] font-medium text-foreground leading-snug">
                                {formattedAction}
                              </span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1.5 font-medium">
                                <Clock className="size-3 opacity-70" />
                                {activity.time}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6] mt-4">
                        <button
                          disabled={activityPage === 1}
                          onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                          className="text-xs px-2.5 py-1.5 rounded-none border border-[#ECECE6] hover:bg-[#FAFAF7] disabled:opacity-40 transition-colors font-medium text-foreground"
                        >
                          Prev
                        </button>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Page {activityPage} of {totalPages}
                        </span>
                        <button
                          disabled={activityPage === totalPages}
                          onClick={() => setActivityPage(p => Math.min(totalPages, p + 1))}
                          className="text-xs px-2.5 py-1.5 rounded-none border border-[#ECECE6] hover:bg-[#FAFAF7] disabled:opacity-40 transition-colors font-medium text-foreground"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

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
