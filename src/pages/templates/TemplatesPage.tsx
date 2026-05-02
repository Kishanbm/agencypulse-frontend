import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, Copy, BarChart3, AlertCircle, X,
  ChevronRight, Layers, Loader2,
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

function pluralise(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// ─── Input style helpers ──────────────────────────────────────────────────────

const inputStyle = { border: '1px solid #ECECE6' };
const onFocusViolet = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
  e.currentTarget.style.borderColor = '#5B47E0';
};
const onBlurReset = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = '#ECECE6';
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

  const kindGradient = kind === "dashboard"
    ? 'linear-gradient(90deg, #5B47E0, #7C3AED)'
    : 'linear-gradient(90deg, #FF7A59, #F5A524)';
  const kindColor = kind === "dashboard" ? '#5B47E0' : '#FF7A59';
  const kindBg = kind === "dashboard" ? 'rgba(91,71,224,0.10)' : 'rgba(255,122,89,0.10)';
  const KindIcon = kind === "dashboard" ? LayoutDashboard : FileText;

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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="h-1 w-full" style={{ background: kindGradient }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: kindBg }}>
                <KindIcon className="size-4" style={{ color: kindColor }} />
              </div>
              <h2 className="font-heading font-semibold text-base">Use Template</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X className="size-4" />
            </button>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: kindBg, border: `1px solid ${kindColor}22` }}
          >
            <KindIcon className="size-4 shrink-0" style={{ color: kindColor }} />
            <span className="text-sm font-semibold truncate" style={{ color: kindColor }}>{templateName}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Client</label>
            <select
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setCampaignId(""); }}
              className="w-full h-10 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none appearance-none"
              style={inputStyle}
              onFocus={onFocusViolet}
              onBlur={onBlurReset}
            >
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Campaign</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              disabled={!clientId || campaigns.length === 0}
              className="w-full h-10 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none appearance-none disabled:opacity-50"
              style={inputStyle}
              onFocus={onFocusViolet}
              onBlur={onBlurReset}
            >
              <option value="">
                {!clientId ? "Select client first…" : campaigns.length === 0 ? "No campaigns" : "Select campaign…"}
              </option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Name <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
            </label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={templateName}
              className="w-full h-10 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none"
              style={inputStyle}
              onFocus={onFocusViolet}
              onBlur={onBlurReset}
            />
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
              onClick={handleClone}
              disabled={cloning || !campaignId}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: kindGradient }}
            >
              {cloning && <Loader2 className="size-3.5 animate-spin" />}
              {cloning ? "Creating…" : `Create ${kind === "dashboard" ? "Dashboard" : "Report"}`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Template Card ─────────────────────────────────────────────────────────────

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #5B47E0, #8B5CF6)',
  'linear-gradient(135deg, #FF7A59, #F5A524)',
  'linear-gradient(135deg, #10D9A0, #06b6d4)',
  'linear-gradient(135deg, #f43f5e, #ec4899)',
  'linear-gradient(135deg, #8B5CF6, #6366f1)',
  'linear-gradient(135deg, #F5A524, #FF7A59)',
];

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  count: number;
  countLabel: string;
  cloneCount: number;
  kind: TemplateKind;
  previewImageUrl?: string | null;
  sourceCampaignName?: string;
  index: number;
  isAgencyTemplate?: boolean;
  onUse: () => void;
}

function TemplateCard({
  name, description, count, countLabel, cloneCount, kind,
  previewImageUrl, sourceCampaignName, index, onUse,
}: TemplateCardProps) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const KindIcon = kind === "dashboard" ? LayoutDashboard : FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden group hover:shadow-lg transition-all"
      style={{ border: '1px solid #ECECE6' }}
    >
      {/* Preview */}
      <div
        className="h-32 flex items-center justify-center overflow-hidden relative"
        style={{ background: previewImageUrl ? undefined : 'rgba(0,0,0,0.02)' }}
      >
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="size-14 rounded-2xl flex items-center justify-center opacity-25"
            style={{ background: gradient }}
          >
            <KindIcon className="size-7 text-white" />
          </div>
        )}
        {/* Gradient top strip on hover */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: gradient }}
        />
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-heading font-semibold text-sm text-foreground leading-snug">{name}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{pluralise(count, countLabel)}</span>
            {cloneCount > 0 && (
              <span className="flex items-center gap-1">
                <Copy className="size-3" />{cloneCount}
              </span>
            )}
          </div>
          {sourceCampaignName && (
            <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px] mx-auto" title={sourceCampaignName}>
              from {sourceCampaignName}
            </span>
          )}
        </div>

        <button
          onClick={onUse}
          className="w-full flex items-center justify-center gap-1.5 h-9 text-sm font-semibold rounded-xl transition-all"
          style={{ border: `1px solid rgba(91,71,224,0.20)`, color: '#5B47E0', background: 'rgba(91,71,224,0.04)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(91,71,224,0.10)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(91,71,224,0.04)';
          }}
        >
          Use Template
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type TabId = "library" | "my-agency";

interface CloneTarget {
  templateId: string;
  templateName: string;
  kind: TemplateKind;
  isAgencyTemplate: boolean;
}

export default function TemplatesPage() {
  const api = getApiClient();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>("library");
  const [cloneTarget, setCloneTarget] = useState<CloneTarget | null>(null);

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

  const loadingLibrary = loadingPubDash || loadingPubRep;
  const loadingAgency = loadingAgDash || loadingAgRep;

  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ border: '1px solid #ECECE6' }}>
          <div className="h-32 bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-muted rounded-xl w-3/4" />
            <div className="h-3 bg-muted rounded-xl w-full" />
            <div className="h-9 bg-muted rounded-xl mt-3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-center gap-3"
      >
        <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
          <Layers className="size-5" style={{ color: '#5B47E0' }} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Templates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse and clone dashboard & report templates into any campaign.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-0" style={{ borderBottom: '1px solid #ECECE6' }}>
        {([
          { id: "library" as TabId, label: "Template Library" },
          { id: "my-agency" as TabId, label: "My Agency" },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px"
            style={tab === id
              ? { borderColor: '#5B47E0', color: '#5B47E0' }
              : { borderColor: 'transparent', color: 'var(--muted-foreground)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Library tab */}
      {tab === "library" && (
        <div className="space-y-8">
          {loadingLibrary ? (
            <SkeletonGrid />
          ) : (
            <>
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
                    <LayoutDashboard className="size-3.5" style={{ color: '#5B47E0' }} />
                  </div>
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Dashboard Templates
                    <span className="ml-1.5 font-normal">({publicDashboards.length})</span>
                  </h2>
                </div>
                {publicDashboards.length === 0 ? (
                  <div
                    className="py-12 text-center text-sm text-muted-foreground rounded-2xl"
                    style={{ border: '1px dashed #ECECE6' }}
                  >
                    No dashboard templates available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicDashboards.map((t, i) => (
                      <TemplateCard
                        key={t.id} id={t.id} name={t.name} description={t.description}
                        count={t.widgetCount} countLabel="widget" cloneCount={t.cloneCount}
                        kind="dashboard" previewImageUrl={t.previewImageUrl} index={i}
                        onUse={() => setCloneTarget({ templateId: t.id, templateName: t.name, kind: "dashboard", isAgencyTemplate: false })}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,122,89,0.10)' }}>
                    <FileText className="size-3.5" style={{ color: '#FF7A59' }} />
                  </div>
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Report Templates
                    <span className="ml-1.5 font-normal">({publicReports.length})</span>
                  </h2>
                </div>
                {publicReports.length === 0 ? (
                  <div
                    className="py-12 text-center text-sm text-muted-foreground rounded-2xl"
                    style={{ border: '1px dashed #ECECE6' }}
                  >
                    No report templates available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicReports.map((t, i) => (
                      <TemplateCard
                        key={t.id} id={t.id} name={t.name} description={t.description}
                        count={t.sectionCount} countLabel="section" cloneCount={t.cloneCount}
                        kind="report" previewImageUrl={t.previewImageUrl} index={i}
                        onUse={() => setCloneTarget({ templateId: t.id, templateName: t.name, kind: "report", isAgencyTemplate: false })}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* My Agency tab */}
      {tab === "my-agency" && (
        <div className="space-y-8">
          {loadingAgency ? (
            <SkeletonGrid />
          ) : agencyDashboards.length === 0 && agencyReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
                <BarChart3 className="size-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No saved templates yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Save an existing dashboard or report as a template from its detail page. Your templates will appear here.
              </p>
            </div>
          ) : (
            <>
              {agencyDashboards.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
                      <LayoutDashboard className="size-3.5" style={{ color: '#5B47E0' }} />
                    </div>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Dashboard Templates <span className="font-normal">({agencyDashboards.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agencyDashboards.map((t, i) => (
                      <TemplateCard
                        key={t.id} id={t.id} name={t.name} description={t.description}
                        count={t.widgetCount} countLabel="widget" cloneCount={t.cloneCount}
                        kind="dashboard" previewImageUrl={t.previewImageUrl}
                        sourceCampaignName={t.sourceCampaignName} index={i} isAgencyTemplate
                        onUse={() => setCloneTarget({ templateId: t.id, templateName: t.name, kind: "dashboard", isAgencyTemplate: true })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {agencyReports.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,122,89,0.10)' }}>
                      <FileText className="size-3.5" style={{ color: '#FF7A59' }} />
                    </div>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Report Templates <span className="font-normal">({agencyReports.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agencyReports.map((t, i) => (
                      <TemplateCard
                        key={t.id} id={t.id} name={t.name} description={t.description}
                        count={t.sectionCount} countLabel="section" cloneCount={t.cloneCount}
                        kind="report" previewImageUrl={t.previewImageUrl}
                        sourceCampaignName={t.sourceCampaignName} index={i} isAgencyTemplate
                        onUse={() => setCloneTarget({ templateId: t.id, templateName: t.name, kind: "report", isAgencyTemplate: true })}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* Clone modal */}
      <AnimatePresence>
        {cloneTarget && (
          <CloneModal
            templateId={cloneTarget.templateId}
            templateName={cloneTarget.templateName}
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
