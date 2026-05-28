import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, Copy, AlertCircle, X,
  Search, Filter, Loader2, Maximize
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import type { DashboardTemplate, ReportTemplate, CloneDashboardResponse, CloneReportResponse } from "@/types/templates";
import type { ClientsListResponse, CampaignsListResponse } from "@/types/clients";

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateKind = "dashboard" | "report";

interface AgencyDashboardTemplate extends DashboardTemplate {
  sourceCampaignName?: string;
}
interface AgencyReportTemplate extends ReportTemplate {
  sourceCampaignName?: string;
}

// Unified template type for rendering
interface UnifiedTemplate {
  id: string;
  name: string;
  description: string;
  kind: TemplateKind;
  previewImageUrl?: string | null;
  count: number;
  countLabel: string;
  cloneCount: number;
  sourceCampaignName?: string;
  isAgencyTemplate: boolean;
}

function pluralise(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// ─── Input style helpers ──────────────────────────────────────────────────────

const inputStyle = { border: '1px solid #E2E8F0', borderRadius: '0px' };
const onFocusPrimary = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = '0 0 0 1px #0F172A';
  e.currentTarget.style.borderColor = '#0F172A';
};
const onBlurReset = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = '#E2E8F0';
};

// ─── Clone Modal ──────────────────────────────────────────────────────────────

interface CloneModalProps {
  templateId: string;
  templateName: string;
  kind: TemplateKind;
  isAgencyTemplate?: boolean;
  onClose: () => void;
  onCloned: (campaignId: string, clientId: string, resultId: string, resultName: string) => void;
}

function CloneModal({ templateId, templateName, kind, onClose, onCloned }: CloneModalProps) {
  const api = getApiClient();
  const [clientId, setClientId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [customName, setCustomName] = useState(templateName);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: clientsData } = useQuery<ClientsListResponse>({
    queryKey: ["clients", "clone-selector"],
    queryFn: () => api.get<ClientsListResponse>("/clients?limit=100").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: campaignsData } = useQuery<CampaignsListResponse>({
    queryKey: ["campaigns", "clone-selector", clientId],
    queryFn: () =>
      api.get<CampaignsListResponse>(`/clients/${clientId}/campaigns?limit=100`).then((r) => r.data),
    enabled: !!clientId,
    staleTime: 60_000,
  });

  const clients = clientsData?.data ?? [];
  const campaigns = campaignsData?.data ?? [];

  const handleClone = async () => {
    if (!campaignId) { setError("Select a target campaign"); return; }
    setError(null);
    setCloning(true);
    try {
      const endpoint = kind === "dashboard"
        ? `/templates/dashboards/${templateId}/clone`
        : `/templates/reports/${templateId}/clone`;
      const res = await api.post<CloneDashboardResponse | CloneReportResponse>(endpoint, {
        campaignId,
        name: customName.trim() || undefined,
      });
      onCloned(campaignId, clientId, res.data.id, res.data.name);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to clone template");
    } finally {
      setCloning(false);
    }
  };

  const KindIcon = kind === "dashboard" ? LayoutDashboard : FileText;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" as const }}
        className="relative bg-white w-full max-w-md shadow-2xl"
        style={{ border: '1px solid #E2E8F0', borderRadius: '0px' }}
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <KindIcon className="size-5 text-slate-800" />
              <h2 className="font-heading font-bold text-lg text-slate-900">Use Template</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 transition-colors text-slate-500">
              <X className="size-5" />
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Template Selected</span>
            <div className="flex items-center gap-2">
              <KindIcon className="size-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-900 truncate">{templateName}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Client</label>
            <select
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setCampaignId(""); }}
              className="w-full h-10 px-3 text-sm bg-white text-slate-900 focus:outline-none appearance-none"
              style={inputStyle}
              onFocus={onFocusPrimary}
              onBlur={onBlurReset}
            >
              <option value="">Select a client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Campaign</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              disabled={!clientId || campaigns.length === 0}
              className="w-full h-10 px-3 text-sm bg-white text-slate-900 focus:outline-none appearance-none disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
              style={inputStyle}
              onFocus={onFocusPrimary}
              onBlur={onBlurReset}
            >
              <option value="">
                {!clientId ? "Select client first…" : campaigns.length === 0 ? "No campaigns" : "Select a campaign…"}
              </option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              New Name <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={templateName}
              className="w-full h-10 px-3 text-sm bg-white text-slate-900 focus:outline-none"
              style={inputStyle}
              onFocus={onFocusPrimary}
              onBlur={onBlurReset}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-medium">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="h-10 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleClone}
              disabled={cloning || !campaignId}
              className="h-10 px-6 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {cloning && <Loader2 className="size-4 animate-spin" />}
              {cloning ? "Creating…" : "Use Template"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Template Card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: UnifiedTemplate;
  index: number;
  onUse: () => void;
}

function TemplateCard({ template, index, onUse }: TemplateCardProps) {
  const KindIcon = template.kind === "dashboard" ? LayoutDashboard : FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5), ease: "easeOut" }}
      className="bg-white group relative flex flex-col transition-all duration-300 hover:-translate-y-1"
      style={{
        border: '1px solid #E2E8F0',
        borderRadius: '0px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(15,23,42,0.05), 0 12px 24px -4px rgba(15,23,42,0.1)';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
    >
      {/* Type Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
        <KindIcon className="size-3.5" />
        <span className="capitalize">{template.kind}</span>
      </div>

      {/* Preview Area */}
      <div
        className="h-56 sm:h-64 w-full relative overflow-hidden bg-slate-50 border-b border-slate-200"
      >
        {template.previewImageUrl ? (
          <img
            src={template.previewImageUrl}
            alt={template.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3 group-hover:scale-[1.03] transition-transform duration-500">
            <KindIcon className="size-12 opacity-50" />
            <span className="text-xs font-semibold uppercase tracking-widest opacity-50">No Preview</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
          <button
            onClick={onUse}
            className="bg-white text-slate-900 px-6 py-3 font-bold text-sm shadow-xl hover:bg-slate-50 transition-colors flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
            style={{ borderRadius: '0px' }}
          >
            <Maximize className="size-4" />
            Use Template
          </button>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-slate-900 text-base mb-1 line-clamp-1" title={template.name}>
          {template.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 flex-1 mb-4" title={template.description}>
          {template.description || "A clean, professionally designed template."}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-700">{pluralise(template.count, template.countLabel)}</span>
            {template.cloneCount > 0 && (
              <span className="flex items-center gap-1" title={`${template.cloneCount} clones`}>
                <Copy className="size-3.5" />{template.cloneCount}
              </span>
            )}
          </div>
          {template.sourceCampaignName && (
            <span className="truncate max-w-[140px] opacity-70" title={`From ${template.sourceCampaignName}`}>
              From: {template.sourceCampaignName}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type TabId = "library" | "my-agency";
type FilterType = "all" | "dashboard" | "report";

export default function TemplatesPage() {
  const api = getApiClient();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>("library");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cloneTarget, setCloneTarget] = useState<UnifiedTemplate | null>(null);

  // Queries
  const { data: publicDashboards = [], isLoading: loadingPubDash } = useQuery<DashboardTemplate[]>({
    queryKey: ["templates", "public", "dashboards"],
    queryFn: () =>
      api.get<{ items: DashboardTemplate[] }>("/templates/dashboards").then((r) => r.data.items ?? []),
    staleTime: 5 * 60_000,
  });

  const { data: publicReports = [], isLoading: loadingPubRep } = useQuery<ReportTemplate[]>({
    queryKey: ["templates", "public", "reports"],
    queryFn: () =>
      api.get<{ items: ReportTemplate[] }>("/templates/reports").then((r) => r.data.items ?? []),
    staleTime: 5 * 60_000,
  });

  const { data: agencyDashboards = [], isLoading: loadingAgDash } = useQuery<AgencyDashboardTemplate[]>({
    queryKey: ["templates", "agency", "dashboards"],
    queryFn: () => api.get<AgencyDashboardTemplate[]>("/agencies/me/templates/dashboards").then((r) => r.data),
    staleTime: 30_000,
    enabled: tab === "my-agency",
  });

  const { data: agencyReports = [], isLoading: loadingAgRep } = useQuery<AgencyReportTemplate[]>({
    queryKey: ["templates", "agency", "reports"],
    queryFn: () => api.get<AgencyReportTemplate[]>("/agencies/me/templates/reports").then((r) => r.data),
    staleTime: 30_000,
    enabled: tab === "my-agency",
  });

  const handleCloned = (campaignId: string, clientId: string, resultId: string, resultName: string) => {
    setCloneTarget(null);
    qc.invalidateQueries({ queryKey: ["templates", "agency"] });
    const kind = cloneTarget?.kind ?? "dashboard";
    const path = kind === "dashboard"
      ? `/clients/${clientId}/campaigns/${campaignId}/dashboards/${resultId}`
      : `/clients/${clientId}/campaigns/${campaignId}/reports/${resultId}`;
    toast.success(`${kind === "dashboard" ? "Dashboard" : "Report"} created: "${resultName}"`, {
      action: { label: "Open", onClick: () => navigate(path) },
    });
  };

  const loading = tab === "library" ? (loadingPubDash || loadingPubRep) : (loadingAgDash || loadingAgRep);

  // Combine and map templates to UnifiedTemplate
  const templates = useMemo<UnifiedTemplate[]>(() => {
    let combined: UnifiedTemplate[] = [];

    if (tab === "library") {
      combined = [
        ...publicDashboards.map(t => ({
          ...t, kind: "dashboard" as const, count: t.widgetCount, countLabel: "widget", isAgencyTemplate: false
        })),
        ...publicReports.map(t => ({
          ...t, kind: "report" as const, count: t.sectionCount, countLabel: "section", isAgencyTemplate: false
        }))
      ];
    } else {
      combined = [
        ...agencyDashboards.map(t => ({
          ...t, kind: "dashboard" as const, count: t.widgetCount, countLabel: "widget", isAgencyTemplate: true
        })),
        ...agencyReports.map(t => ({
          ...t, kind: "report" as const, count: t.sectionCount, countLabel: "section", isAgencyTemplate: true
        }))
      ];
    }

    // Apply filters
    return combined.filter(t => {
      const matchesType = filterType === "all" || t.kind === filterType;
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [tab, publicDashboards, publicReports, agencyDashboards, agencyReports, filterType, searchQuery]);

  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse border border-slate-200 bg-white">
          <div className="h-56 sm:h-64 bg-slate-100" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-slate-100 w-3/4" />
            <div className="h-4 bg-slate-100 w-full" />
            <div className="h-4 bg-slate-100 w-2/3" />
            <div className="pt-3 border-t border-slate-50 mt-2">
              <div className="h-3 bg-slate-100 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Banner / Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-10">
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Templates
            </h1>
            <p className="text-slate-500 mt-2 text-lg max-w-2xl">
              Start your next project with a professionally designed template. Choose from our curated library or use your agency's saved templates.
            </p>
          </div>

          {/* Source Tabs */}
          <div className="flex gap-6 -mb-px">
            {([
              { id: "library" as TabId, label: "Template Library" },
              { id: "my-agency" as TabId, label: "My Agency" },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setSearchQuery(""); setFilterType("all"); }}
                className={`py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  tab === id
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

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Type Filters */}
          <div className="flex bg-slate-200/50 p-1 w-full sm:w-auto">
            {([
              { id: "all", label: "All Templates" },
              { id: "dashboard", label: "Dashboards" },
              { id: "report", label: "Reports" },
            ] as const).map((type) => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as FilterType)}
                className={`flex-1 sm:flex-none px-6 py-2 text-sm font-semibold transition-all ${
                  filterType === type.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-900 focus:outline-none transition-shadow placeholder:text-slate-400"
              style={{ borderRadius: '0px' }}
              onFocus={onFocusPrimary}
              onBlur={onBlurReset}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <SkeletonGrid />
        ) : templates.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center bg-white border border-slate-200">
            <Filter className="size-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No templates found</h3>
            <p className="text-slate-500 text-sm max-w-sm mt-1">
              Try adjusting your search query or filters.
              {tab === "my-agency" && " Save an existing dashboard or report to see it here."}
            </p>
            {(searchQuery || filterType !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setFilterType("all"); }}
                className="mt-6 text-sm font-semibold text-slate-900 border-b border-slate-900 pb-0.5 hover:text-slate-600 hover:border-slate-600 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template, index) => (
              <TemplateCard
                key={`${template.kind}-${template.id}`}
                template={template}
                index={index}
                onUse={() => setCloneTarget(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clone modal */}
      <AnimatePresence>
        {cloneTarget && (
          <CloneModal
            templateId={cloneTarget.id}
            templateName={cloneTarget.name}
            kind={cloneTarget.kind}
            isAgencyTemplate={cloneTarget.isAgencyTemplate}
            onClose={() => setCloneTarget(null)}
            onCloned={handleCloned}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
