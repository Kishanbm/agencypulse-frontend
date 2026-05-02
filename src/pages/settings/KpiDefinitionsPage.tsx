import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calculator, Plus, Trash2, Play, ChevronDown, X, AlertCircle, Info, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import type { IntegrationPlatform } from "@/types/dashboard";
import type { KpiDefinition, KpiEvaluationResponse, CreateKpiDefinitionDto } from "@/types/kpi";
import type { ClientsListResponse, CampaignsListResponse } from "@/types/clients";

// ─── Constants ────────────────────────────────────────────────────────────────

const SS_CLIENT = "kpi_selected_client";
const SS_CAMPAIGN = "kpi_selected_campaign";

const BUILT_IN_KPIS = [
  { label: "CTR", formula: "clicks / impressions * 100", description: "Click-through rate as a percentage", color: '#5B47E0', bg: 'rgba(91,71,224,0.08)' },
  { label: "CPC", formula: "cost / clicks", description: "Cost per click", color: '#FF7A59', bg: 'rgba(255,122,89,0.08)' },
  { label: "ROAS", formula: "revenue / cost", description: "Return on ad spend", color: '#10D9A0', bg: 'rgba(16,217,160,0.08)' },
  { label: "CPM", formula: "cost / impressions * 1000", description: "Cost per 1,000 impressions", color: '#F5A524', bg: 'rgba(245,165,36,0.08)' },
];

const PLATFORM_OPTIONS = [
  { value: "GA4", label: "Google Analytics 4" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "META_ADS", label: "Meta Ads" },
  { value: "GOOGLE_SEARCH_CONSOLE", label: "Search Console" },
  { value: "YOUTUBE_ANALYTICS", label: "YouTube Analytics" },
  { value: "LINKEDIN_ADS", label: "LinkedIn Ads" },
  { value: "TIKTOK_ADS", label: "TikTok Ads" },
  { value: "AMAZON_ADS", label: "Amazon Ads" },
];

const PLATFORM_DISPLAY: Record<string, string> = Object.fromEntries(
  PLATFORM_OPTIONS.map((p) => [p.value, p.label])
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEvalValue(value: number | null): string {
  if (value === null) return "—";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(4).replace(/\.?0+$/, "");
}

function humanizeError(e: any): string {
  const raw = e?.response?.data?.message;
  if (!raw) return "Something went wrong. Please try again.";
  const msg = Array.isArray(raw) ? raw[0] : raw;
  if (typeof msg !== "string") return "Something went wrong. Please try again.";
  if (msg.includes("already exists") || msg.includes("unique constraint"))
    return "A KPI with this name already exists.";
  if (msg.includes("not found") || msg.includes("NOT_FOUND"))
    return "KPI not found — it may have been deleted.";
  if (msg.includes("Unauthorized") || msg.includes("403"))
    return "You don't have permission to perform this action.";
  return msg.charAt(0).toUpperCase() + msg.slice(1);
}

// ─── Input style helpers ──────────────────────────────────────────────────────

const inputStyle = { border: '1px solid #ECECE6' };
const onFocusViolet = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
  e.currentTarget.style.borderColor = '#5B47E0';
};
const onBlurReset = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = '#ECECE6';
};

// ─── Built-in KPI card ────────────────────────────────────────────────────────

function BuiltInKpiCard({ kpi }: { kpi: typeof BUILT_IN_KPIS[0] }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
      <div className="h-0.5 w-full" style={{ background: kpi.color }} />
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
              <Calculator className="size-3.5" style={{ color: kpi.color }} />
            </div>
            <span className="text-sm font-bold text-foreground" style={{ color: kpi.color }}>{kpi.label}</span>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: kpi.bg, color: kpi.color }}
          >
            Built-in
          </span>
        </div>
        <code className="text-xs font-mono text-muted-foreground block rounded-xl px-2.5 py-2" style={{ background: 'rgba(0,0,0,0.03)' }}>
          {kpi.formula}
        </code>
        <p className="text-xs text-muted-foreground">{kpi.description}</p>
      </div>
    </div>
  );
}

// ─── Campaign Selector ────────────────────────────────────────────────────────

interface CampaignSelectorProps {
  selectedClientId: string;
  selectedCampaignId: string;
  onSelect: (clientId: string, campaignId: string, clientName: string, campaignName: string) => void;
  selectedClientName: string;
  selectedCampaignName: string;
}

function CampaignSelector({ selectedClientId, selectedCampaignId, onSelect, selectedClientName, selectedCampaignName }: CampaignSelectorProps) {
  const api = getApiClient();
  const [picking, setPicking] = useState(!selectedClientId);
  const [localClientId, setLocalClientId] = useState(selectedClientId);

  const { data: clientsData } = useQuery<ClientsListResponse>({
    queryKey: ["clients", "selector"],
    queryFn: () => api.get<ClientsListResponse>("/clients?limit=100").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: campaignsData } = useQuery<CampaignsListResponse>({
    queryKey: ["campaigns", "selector", localClientId],
    queryFn: () =>
      api.get<CampaignsListResponse>(`/clients/${localClientId}/campaigns?limit=100`).then((r) => r.data),
    enabled: !!localClientId,
    staleTime: 60_000,
  });

  const clients = clientsData?.data ?? [];
  const campaigns = campaignsData?.data ?? [];

  if (!picking && selectedClientId && selectedCampaignId) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
          style={{ background: 'rgba(91,71,224,0.06)', border: '1px solid rgba(91,71,224,0.12)' }}
        >
          <span className="text-muted-foreground text-xs">Campaign:</span>
          <span className="font-semibold text-xs" style={{ color: '#5B47E0' }}>{selectedClientName}</span>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="font-semibold text-xs" style={{ color: '#5B47E0' }}>{selectedCampaignName}</span>
        </div>
        <button
          onClick={() => setPicking(true)}
          className="text-xs font-semibold flex items-center gap-1 transition-colors hover:opacity-70"
          style={{ color: '#5B47E0' }}
        >
          <ChevronDown className="size-3" />
          Switch
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Client</label>
        <select
          value={localClientId}
          onChange={(e) => setLocalClientId(e.target.value)}
          className="h-9 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none appearance-none min-w-[180px]"
          style={inputStyle}
          onFocus={onFocusViolet}
          onBlur={onBlurReset}
        >
          <option value="">Select client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Campaign</label>
        <select
          value=""
          onChange={(e) => {
            const cam = campaigns.find((c) => c.id === e.target.value);
            const cli = clients.find((c) => c.id === localClientId);
            if (cam && cli) { onSelect(cli.id, cam.id, cli.name, cam.name); setPicking(false); }
          }}
          disabled={!localClientId || campaigns.length === 0}
          className="h-9 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none appearance-none min-w-[200px] disabled:opacity-50"
          style={inputStyle}
          onFocus={onFocusViolet}
          onBlur={onBlurReset}
        >
          <option value="">{localClientId ? (campaigns.length === 0 ? "No campaigns" : "Select campaign…") : "Select client first…"}</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {selectedClientId && selectedCampaignId && (
        <button
          onClick={() => setPicking(false)}
          className="h-9 px-3 rounded-xl text-xs font-medium hover:bg-muted transition-colors text-muted-foreground"
          style={{ border: '1px solid #ECECE6' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

// ─── Create KPI Modal ─────────────────────────────────────────────────────────

function CreateKpiModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const api = getApiClient();
  const [name, setName] = useState("");
  const [formula, setFormula] = useState("");
  const [platform, setPlatform] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formulaRef = useRef<HTMLTextAreaElement>(null);

  const { metrics, isLoading: loadingMetrics } = useMetricDefinitions(
    platform ? (platform as IntegrationPlatform) : undefined
  );

  const insertToken = useCallback((token: string) => {
    const el = formulaRef.current;
    if (!el) { setFormula((f) => f + token); return; }
    const start = el.selectionStart ?? formula.length;
    const end = el.selectionEnd ?? formula.length;
    const newVal = formula.slice(0, start) + token + formula.slice(end);
    setFormula(newVal);
    setTimeout(() => {
      el.setSelectionRange(start + token.length, start + token.length);
      el.focus();
    }, 0);
  }, [formula]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if (!platform) { setError("Please select a platform"); return; }
    if (!formula.trim()) { setError("Formula is required"); return; }
    setError(null);
    setSaving(true);
    try {
      const dto: CreateKpiDefinitionDto = { name: name.trim(), formula: formula.trim(), platform };
      await api.post("/agencies/me/kpi-definitions", dto);
      toast.success("KPI created");
      onCreated();
    } catch (e: any) {
      setError(humanizeError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" as const }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #5B47E0, #7C3AED)' }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
                <Calculator className="size-4" style={{ color: '#5B47E0' }} />
              </div>
              <h2 className="font-heading font-semibold text-base">New Custom KPI</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engagement Rate"
              className="w-full h-10 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none"
              style={inputStyle}
              onFocus={onFocusViolet}
              onBlur={onBlurReset}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Platform</label>
            <select
              value={platform}
              onChange={(e) => { setPlatform(e.target.value); setFormula(""); }}
              className="w-full h-10 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none appearance-none"
              style={inputStyle}
              onFocus={onFocusViolet}
              onBlur={onBlurReset}
            >
              <option value="">Select platform…</option>
              {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Formula</label>
            {platform && (
              <div className="space-y-1.5">
                {loadingMetrics ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="size-3 animate-spin" />Loading metric keys…
                  </div>
                ) : metrics.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground">Click a metric key to insert it:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {metrics.map((m) => (
                        <button
                          key={m.metricKey}
                          type="button"
                          onClick={() => insertToken(m.metricKey)}
                          title={m.label}
                          className="text-xs font-mono px-2 py-1 rounded-lg transition-colors hover:opacity-80"
                          style={{ border: '1px solid rgba(91,71,224,0.30)', background: 'rgba(91,71,224,0.06)', color: '#5B47E0' }}
                        >
                          {m.metricKey}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No metric keys found for this platform.</p>
                )}
              </div>
            )}
            <textarea
              ref={formulaRef}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder={platform ? "Click a metric above or type a formula…" : "Select a platform first…"}
              disabled={!platform}
              rows={2}
              className="w-full px-3 py-2 text-sm font-mono rounded-xl bg-background text-foreground focus:outline-none resize-none disabled:opacity-50"
              style={inputStyle}
              onFocus={onFocusViolet}
              onBlur={onBlurReset}
            />
            <div
              className="flex items-start gap-2 text-xs text-muted-foreground rounded-xl px-3 py-2"
              style={{ background: 'rgba(91,71,224,0.04)', border: '1px solid rgba(91,71,224,0.10)' }}
            >
              <Info className="size-3.5 shrink-0 mt-0.5" style={{ color: '#5B47E0' }} />
              <div>
                Use metric keys as variables. Supports: <code className="font-mono">+ − * / ( )</code>
                <br />
                Example: <code className="font-mono">conversions / clicks * 100</code>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: '#f43f5e' }}>
              <AlertCircle className="size-3.5 shrink-0" /> {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
              style={{ border: '1px solid #ECECE6' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {saving ? "Creating…" : "Create KPI"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function KpiDefinitionsPage() {
  const api = getApiClient();
  const qc = useQueryClient();

  const [selectedClientId, setSelectedClientId] = useState(() => sessionStorage.getItem(SS_CLIENT) ?? "");
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => sessionStorage.getItem(SS_CAMPAIGN) ?? "");
  const [selectedClientName, setSelectedClientName] = useState(() => sessionStorage.getItem(`${SS_CLIENT}_name`) ?? "");
  const [selectedCampaignName, setSelectedCampaignName] = useState(() => sessionStorage.getItem(`${SS_CAMPAIGN}_name`) ?? "");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResults, setEvalResults] = useState<KpiEvaluationResponse | null>(null);
  const [evalPlatform, setEvalPlatform] = useState("");
  const [evalRange, setEvalRange] = useState("30");

  const handleCampaignSelect = (clientId: string, campaignId: string, clientName: string, campaignName: string) => {
    setSelectedClientId(clientId);
    setSelectedCampaignId(campaignId);
    setSelectedClientName(clientName);
    setSelectedCampaignName(campaignName);
    sessionStorage.setItem(SS_CLIENT, clientId);
    sessionStorage.setItem(SS_CAMPAIGN, campaignId);
    sessionStorage.setItem(`${SS_CLIENT}_name`, clientName);
    sessionStorage.setItem(`${SS_CAMPAIGN}_name`, campaignName);
    setEvalResults(null);
  };

  const { data: definitions = [], isLoading } = useQuery<KpiDefinition[]>({
    queryKey: ["kpiDefinitions"],
    queryFn: () => api.get<KpiDefinition[]>("/agencies/me/kpi-definitions").then((r) => r.data),
    staleTime: 30_000,
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/agencies/me/kpi-definitions/${id}`);
      qc.invalidateQueries({ queryKey: ["kpiDefinitions"] });
      toast.success("KPI deleted");
    } catch (e: any) {
      toast.error(humanizeError(e));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedClientId || !selectedCampaignId || !evalPlatform) return;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - parseInt(evalRange, 10));
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setEvaluating(true);
    try {
      const res = await api.get<KpiEvaluationResponse>(
        `/clients/${selectedClientId}/campaigns/${selectedCampaignId}/kpi`,
        { params: { platform: evalPlatform, from: fmt(from), to: fmt(to) } }
      );
      setEvalResults(res.data);
    } catch (e: any) {
      toast.error(humanizeError(e));
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[1000px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
            <Calculator className="size-5" style={{ color: '#5B47E0' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">KPI Definitions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Formula-based KPIs for your agency</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
        >
          <Plus className="size-4" />
          New KPI
        </button>
      </motion.div>

      {/* Built-in KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" as const }}
        className="space-y-3"
      >
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Built-in KPIs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BUILT_IN_KPIS.map((k) => <BuiltInKpiCard key={k.label} kpi={k} />)}
        </div>
      </motion.div>

      {/* Custom KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
          <h2 className="font-heading font-semibold text-sm text-foreground">
            Custom KPIs
            {definitions.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">({definitions.length})</span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-0 divide-y" style={{ borderColor: '#F5F5F0' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 px-5 flex items-center gap-3">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : definitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="size-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(91,71,224,0.06)' }}>
              <Calculator className="size-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">No custom KPIs yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 text-xs font-semibold transition-colors hover:opacity-70"
              style={{ color: '#5B47E0' }}
            >
              Create your first KPI
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F5F5F0' }}>
            {definitions.map((def, i) => (
              <motion.div
                key={def.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" as const }}
                className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{def.name}</span>
                    {def.platform && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(91,71,224,0.08)', color: '#5B47E0' }}
                      >
                        {PLATFORM_DISPLAY[def.platform] ?? def.platform}
                      </span>
                    )}
                  </div>
                  <code className="text-xs font-mono text-muted-foreground">{def.formula}</code>
                </div>

                {confirmDeleteId === def.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold" style={{ color: '#f43f5e' }}>Delete?</span>
                    <button
                      onClick={() => handleDelete(def.id)}
                      disabled={deletingId === def.id}
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: '#f43f5e' }}
                    >
                      {deletingId === def.id ? "…" : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium hover:bg-muted transition-colors text-muted-foreground"
                      style={{ border: '1px solid #ECECE6' }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(def.id)}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Evaluate section */}
      {definitions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" as const }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
            <h2 className="font-heading font-semibold text-sm text-foreground">Evaluate Against a Campaign</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Calculate current KPI values using live metric data.
            </p>
          </div>
          <div className="p-5 space-y-5">
            <CampaignSelector
              selectedClientId={selectedClientId}
              selectedCampaignId={selectedCampaignId}
              selectedClientName={selectedClientName}
              selectedCampaignName={selectedCampaignName}
              onSelect={handleCampaignSelect}
            />

            {selectedCampaignId && (
              <div className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Platform</label>
                  <select
                    value={evalPlatform}
                    onChange={(e) => { setEvalPlatform(e.target.value); setEvalResults(null); }}
                    className="h-9 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none appearance-none min-w-[180px]"
                    style={inputStyle}
                    onFocus={onFocusViolet}
                    onBlur={onBlurReset}
                  >
                    <option value="">Select platform…</option>
                    {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Date range</label>
                  <select
                    value={evalRange}
                    onChange={(e) => setEvalRange(e.target.value)}
                    className="h-9 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none appearance-none"
                    style={inputStyle}
                    onFocus={onFocusViolet}
                    onBlur={onBlurReset}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
                <button
                  onClick={handleEvaluate}
                  disabled={evaluating || !evalPlatform}
                  className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                >
                  {evaluating ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                  {evaluating ? "Evaluating…" : "Evaluate"}
                </button>
              </div>
            )}

            {/* Evaluation results */}
            {evalResults && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Results — {selectedClientName} / {selectedCampaignName} · {PLATFORM_DISPLAY[evalPlatform] ?? evalPlatform}
                </p>

                {Object.keys(evalResults.custom).length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">Custom KPIs</p>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
                      <table className="w-full text-sm">
                        <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid #ECECE6' }}>
                          <tr>
                            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                            <th className="text-right px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: '#F5F5F0' }}>
                          {Object.entries(evalResults.custom).map(([name, val]) => (
                            <tr key={name} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-2.5 font-medium text-foreground text-sm">{name}</td>
                              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-sm font-semibold" style={{ color: '#5B47E0' }}>
                                {val === null ? <span className="text-muted-foreground font-normal">No data</span> : formatEvalValue(val)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {Object.keys(evalResults.derived).length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">Built-in Derived KPIs</p>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
                      <table className="w-full text-sm">
                        <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid #ECECE6' }}>
                          <tr>
                            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                            <th className="text-right px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: '#F5F5F0' }}>
                          {Object.entries(evalResults.derived).map(([name, val]) => (
                            <tr key={name} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-2.5 font-medium text-foreground text-sm">{name}</td>
                              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-sm font-semibold" style={{ color: '#FF7A59' }}>
                                {val === null ? <span className="text-muted-foreground font-normal">No data</span> : formatEvalValue(val)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {Object.keys(evalResults.base).length > 0 && (
                  <details className="group">
                    <summary className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none">
                      Raw base metrics ({Object.keys(evalResults.base).length})
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(evalResults.base).map(([key, val]) => (
                        <span key={key} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid #ECECE6' }}>
                          <span className="font-mono text-muted-foreground">{key}</span>
                          <span className="font-semibold text-foreground">{formatEvalValue(val)}</span>
                        </span>
                      ))}
                    </div>
                  </details>
                )}

                {Object.keys(evalResults.custom).length === 0 && Object.keys(evalResults.derived).length === 0 && (
                  <p className="text-sm text-muted-foreground">No KPI results for this platform. Make sure your custom KPIs are set up for {PLATFORM_DISPLAY[evalPlatform] ?? evalPlatform}.</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateKpiModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              qc.invalidateQueries({ queryKey: ["kpiDefinitions"] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
