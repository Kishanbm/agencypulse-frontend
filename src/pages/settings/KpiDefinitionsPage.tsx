import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calculator, Plus, Trash2, Play, ChevronDown, AlertCircle, Loader2, ArrowRight, Settings2, BarChart3, LineChart
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import { CreateKpiWizard } from "./components/CreateKpiWizard";
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

const inputStyle = { border: '1px solid #ECECE6', borderRadius: 0 };
const onFocusSlate = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.08)';
  e.currentTarget.style.borderColor = '#0f172a';
};
const onBlurReset = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = '#ECECE6';
};

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
          className="flex items-center gap-2 text-sm px-3 py-2"
          style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.08)' }}
        >
          <span className="text-muted-foreground text-xs">Campaign:</span>
          <span className="font-semibold text-xs text-slate-900">{selectedClientName}</span>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="font-semibold text-xs text-slate-900">{selectedCampaignName}</span>
        </div>
        <button
          onClick={() => setPicking(true)}
          className="text-xs font-semibold flex items-center gap-1 transition-colors hover:opacity-70 text-slate-900 rounded-none"
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
          className="h-9 px-3 text-sm bg-background text-foreground focus:outline-none appearance-none min-w-[180px] rounded-none"
          style={inputStyle}
          onFocus={onFocusSlate}
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
          className="h-9 px-3 text-sm bg-background text-foreground focus:outline-none appearance-none min-w-[200px] disabled:opacity-50 rounded-none"
          style={inputStyle}
          onFocus={onFocusSlate}
          onBlur={onBlurReset}
        >
          <option value="">{localClientId ? (campaigns.length === 0 ? "No campaigns" : "Select campaign…") : "Select client first…"}</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {selectedClientId && selectedCampaignId && (
        <button
          onClick={() => setPicking(false)}
          className="h-9 px-3 text-xs font-medium hover:bg-muted transition-colors text-muted-foreground rounded-none"
          style={{ border: '1px solid #ECECE6' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function KpiDefinitionsPage() {
  const api = getApiClient();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'kpis' | 'eval'>('kpis');

  const [selectedClientId, setSelectedClientId] = useState(() => sessionStorage.getItem(SS_CLIENT) ?? "");
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => sessionStorage.getItem(SS_CAMPAIGN) ?? "");
  const [selectedClientName, setSelectedClientName] = useState(() => sessionStorage.getItem(`${SS_CLIENT}_name`) ?? "");
  const [selectedCampaignName, setSelectedCampaignName] = useState(() => sessionStorage.getItem(`${SS_CAMPAIGN}_name`) ?? "");
  
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<Partial<CreateKpiDefinitionDto> | undefined>(undefined);

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

  const openWizard = (initialData?: Partial<CreateKpiDefinitionDto>) => {
    setWizardInitialData(initialData);
    setWizardOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 w-full flex flex-col">
      
      {/* Top Banner / Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 py-10">
            <div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight flex items-center gap-3">
                <Calculator className="size-8 text-slate-800" />
                KPI Definitions
              </h1>
              <p className="text-slate-500 mt-2 text-lg max-w-2xl">
                Create and manage standard or custom formula-based KPIs for your agency. Set goals and thresholds to track campaign performance effortlessly.
              </p>
            </div>
            <button
              onClick={() => openWizard()}
              className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm shrink-0 border border-slate-900 rounded-none"
            >
              <Plus className="size-4" />
              Create Custom KPI
            </button>
          </div>

          {/* Source Tabs */}
          <div className="flex gap-6 -mb-px">
            {([
              { id: "kpis" as const, label: "Definitions" },
              { id: "eval" as const, label: "Evaluate Campaign" },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">

        {activeTab === 'kpis' && (
          <div className="space-y-6">
            {/* Built-in KPIs */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
              className="space-y-3"
            >
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="size-4" />
                Built-in KPIs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {BUILT_IN_KPIS.map((kpi) => (
                  <div key={kpi.label} className="bg-white overflow-hidden transition-shadow relative group hover:-translate-y-0.5 duration-200" style={{ border: '1px solid #ECECE6', borderRadius: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 20px 40px -10px rgba(0,0,0,0.1)' }}>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-8 flex items-center justify-center rounded-none bg-slate-100">
                            <Calculator className="size-4 text-slate-700" />
                          </div>
                          <span className="text-sm font-bold text-slate-900">{kpi.label}</span>
                        </div>
                      </div>
                      <code className="text-xs font-mono text-muted-foreground block px-3 py-2 border border-gray-100 bg-gray-50 rounded-none">
                        {kpi.formula}
                      </code>
                      <p className="text-xs text-muted-foreground leading-relaxed h-8">{kpi.description}</p>
                      
                      <button
                        onClick={() => openWizard({ name: `${kpi.label} (Custom)`, formula: kpi.formula })}
                        className="w-full mt-2 py-2 text-xs font-semibold flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-[#ECECE6] rounded-none"
                      >
                        Customize <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Custom KPIs */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
              className="bg-white overflow-hidden"
              style={{ border: '1px solid #ECECE6', borderRadius: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 20px 40px -10px rgba(0,0,0,0.1)' }}
            >
              <div className="flex items-center justify-between px-6 py-5 bg-gray-50 border-b border-[#ECECE6]">
                <h2 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                  <Settings2 className="size-4 text-slate-800" />
                  Custom KPIs
                  {definitions.length > 0 && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground px-2 py-0.5 bg-gray-200 text-gray-700">
                      {definitions.length}
                    </span>
                  )}
                </h2>
              </div>

              {isLoading ? (
                <div className="space-y-0 divide-y" style={{ borderColor: '#F5F5F0' }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 px-6 flex items-center gap-3">
                      <div className="h-4 w-32 animate-pulse bg-muted" />
                      <div className="h-4 w-48 animate-pulse bg-muted" />
                    </div>
                  ))}
                </div>
              ) : definitions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="size-16 flex items-center justify-center mb-4 bg-slate-50 text-slate-400 rounded-none border border-slate-200">
                    <Calculator className="size-8" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No custom KPIs yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">Create your own formulas tailored to your specific reporting needs.</p>
                  <button
                    onClick={() => openWizard()}
                    className="mt-6 text-sm font-semibold px-5 py-2.5 transition-colors bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-none"
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
                      transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                      className="flex items-start justify-between gap-4 px-6 py-5 hover:bg-muted/10 transition-colors"
                    >
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{def.name}</span>
                          {def.platform && (
                            <span
                              className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              {PLATFORM_DISPLAY[def.platform] ?? def.platform}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                            {def.formatType || 'NUMBER'}
                          </span>
                        </div>
                        <code className="text-xs font-mono font-semibold text-gray-600 block bg-gray-50 border border-gray-100 px-3 py-1.5 w-max rounded-none">
                          {def.formula}
                        </code>
                        {def.goalTarget && def.goalCondition && (
                          <p className="text-[11px] font-medium text-emerald-600">
                            Goal: {def.goalCondition} {def.goalTarget}
                          </p>
                        )}
                      </div>

                      {confirmDeleteId === def.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold" style={{ color: '#f43f5e' }}>Delete?</span>
                          <button
                            onClick={() => handleDelete(def.id)}
                            disabled={deletingId === def.id}
                            className="text-xs px-3 py-1.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background: '#f43f5e', border: '1px solid #be123c', borderRadius: 0 }}
                          >
                            {deletingId === def.id ? "…" : "Yes"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-3 py-1.5 font-semibold hover:bg-muted transition-colors text-muted-foreground"
                            style={{ border: '1px solid #ECECE6', background: 'white', borderRadius: 0 }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(def.id)}
                          className="shrink-0 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 rounded-none"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Evaluate section */}
        {activeTab === 'eval' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="bg-white overflow-hidden flex flex-col min-h-[400px]"
            style={{ border: '1px solid #ECECE6', borderRadius: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 20px 40px -10px rgba(0,0,0,0.1)' }}
          >
            <div className="px-6 py-5 bg-gray-50 border-b border-[#ECECE6]">
              <h2 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                <LineChart className="size-4 text-emerald-600" />
                Live Evaluation Sandbox
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Calculate current KPI values using live metric data from your active campaigns.
              </p>
            </div>
            <div className="p-6 space-y-6 flex-1">
              <div className="p-5 bg-gray-50 border border-[#ECECE6] rounded-none">
                <CampaignSelector
                  selectedClientId={selectedClientId}
                  selectedCampaignId={selectedCampaignId}
                  selectedClientName={selectedClientName}
                  selectedCampaignName={selectedCampaignName}
                  onSelect={handleCampaignSelect}
                />
                
                {selectedCampaignId && (
                  <div className="mt-4 pt-4 border-t border-[#ECECE6] flex items-end gap-3 flex-wrap">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Platform</label>
                      <select
                        value={evalPlatform}
                        onChange={(e) => { setEvalPlatform(e.target.value); setEvalResults(null); }}
                        className="h-9 px-3 text-sm bg-white border-[#ECECE6] text-foreground focus:outline-none appearance-none min-w-[180px] rounded-none"
                        style={inputStyle}
                        onFocus={onFocusSlate}
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
                        className="h-9 px-3 text-sm bg-white border-[#ECECE6] text-foreground focus:outline-none appearance-none rounded-none"
                        style={inputStyle}
                        onFocus={onFocusSlate}
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
                      className="h-9 px-5 rounded-none text-sm font-semibold text-white inline-flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 ml-auto"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    >
                      {evaluating ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                      {evaluating ? "Evaluating…" : "Run Evaluation"}
                    </button>
                  </div>
                )}
              </div>

              {/* Evaluation results */}
              {evalResults && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between border-b border-[#ECECE6] pb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Evaluation Results
                    </p>
                    <p className="text-xs font-medium text-gray-500">
                      {selectedClientName} / {selectedCampaignName} · {PLATFORM_DISPLAY[evalPlatform] ?? evalPlatform}
                    </p>
                  </div>

                  {Object.keys(evalResults.custom).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Settings2 className="size-4 text-slate-800" /> Custom KPIs
                      </p>
                      <div className="overflow-hidden border border-[#ECECE6] rounded-none">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-[#ECECE6]">
                            <tr>
                              <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                              <th className="text-right px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F5F5F0]">
                            {Object.entries(evalResults.custom).map(([name, val]) => (
                              <tr key={name} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-foreground text-sm">{name}</td>
                                <td className="px-4 py-3 text-right font-mono tabular-nums text-sm font-bold text-slate-900">
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
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <BarChart3 className="size-4 text-orange-500" /> Built-in Derived KPIs
                      </p>
                      <div className="overflow-hidden border border-[#ECECE6] rounded-none">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-[#ECECE6]">
                            <tr>
                              <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                              <th className="text-right px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F5F5F0]">
                            {Object.entries(evalResults.derived).map(([name, val]) => (
                              <tr key={name} className="hover:bg-orange-50/50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-foreground text-sm">{name}</td>
                                <td className="px-4 py-3 text-right font-mono tabular-nums text-sm font-bold text-orange-600">
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
                    <details className="group border border-[#ECECE6] rounded-none p-3 bg-gray-50">
                      <summary className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none flex items-center justify-between">
                        <span>Raw Base Metrics ({Object.keys(evalResults.base).length})</span>
                      </summary>
                      <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-[#ECECE6]">
                        {Object.entries(evalResults.base).map(([key, val]) => (
                          <div key={key} className="flex flex-col bg-white px-3 py-2 border border-[#ECECE6] rounded-none min-w-[120px]">
                            <span className="font-mono text-[10px] text-muted-foreground mb-1 break-all uppercase">{key}</span>
                            <span className="font-semibold text-foreground text-sm">{formatEvalValue(val)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {Object.keys(evalResults.custom).length === 0 && Object.keys(evalResults.derived).length === 0 && (
                    <div className="p-6 bg-orange-50 border border-orange-100 text-center rounded-none">
                      <AlertCircle className="size-6 text-orange-400 mx-auto mb-2" />
                      <p className="text-sm text-orange-800 font-semibold">No KPI results available</p>
                      <p className="text-xs text-orange-600 mt-1">Make sure you have KPI formulas defined for {PLATFORM_DISPLAY[evalPlatform] ?? evalPlatform} and that the campaign has active data in the selected date range.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {wizardOpen && (
          <CreateKpiWizard
            initialData={wizardInitialData}
            onClose={() => setWizardOpen(false)}
            onCreated={() => {
              setWizardOpen(false);
              qc.invalidateQueries({ queryKey: ["kpiDefinitions"] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
