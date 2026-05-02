import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, ArrowUp, ArrowDown, Trash2, Edit2,
  BarChart2, TrendingUp, PieChart, AlignLeft, AlertCircle, X, FileText, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import { useConnectedPlatforms } from "@/hooks/useConnectedPlatforms";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import type { Report, ReportSection, SectionType, ChartType } from "@/types/reports";
import type { IntegrationPlatform } from "@/types/dashboard";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_OPTIONS: { id: IntegrationPlatform; name: string }[] = [
  { id: "GA4", name: "Google Analytics 4" },
  { id: "GOOGLE_ADS", name: "Google Ads" },
  { id: "META_ADS", name: "Meta Ads" },
  { id: "GOOGLE_SEARCH_CONSOLE", name: "Search Console" },
  { id: "YOUTUBE_ANALYTICS", name: "YouTube Analytics" },
  { id: "LINKEDIN_ADS", name: "LinkedIn Ads" },
  { id: "TIKTOK_ADS", name: "TikTok Ads" },
  { id: "AMAZON_ADS", name: "Amazon Ads" },
];

const CHART_OPTIONS: { value: ChartType; label: string }[] = [
  { value: "LINE_CHART", label: "Line Chart" },
  { value: "BAR_CHART", label: "Bar Chart" },
  { value: "PIE_CHART", label: "Pie Chart" },
];

const SECTION_TYPE_CONFIG: Record<SectionType, { color: string; bg: string; label: string }> = {
  METRICS: { color: '#5B47E0', bg: 'rgba(91,71,224,0.10)',  label: 'Metrics' },
  CHART:   { color: '#FF7A59', bg: 'rgba(255,122,89,0.10)', label: 'Chart'   },
  TEXT:    { color: '#10D9A0', bg: 'rgba(16,217,160,0.10)', label: 'Text'    },
};

function inputFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}
const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white";
const inputStyle = { border: '1px solid #ECECE6' };

// ─── Section icon ─────────────────────────────────────────────────────────────

function SectionIcon({ type, chartType, color }: { type: SectionType; chartType?: ChartType; color: string }) {
  const cls = "size-4";
  const style = { color };
  if (type === "TEXT") return <AlignLeft className={cls} style={style} />;
  if (type === "CHART") {
    if (chartType === "LINE_CHART") return <TrendingUp className={cls} style={style} />;
    if (chartType === "PIE_CHART") return <PieChart className={cls} style={style} />;
    return <BarChart2 className={cls} style={style} />;
  }
  return <BarChart2 className={cls} style={style} />;
}

// ─── Platform metric picker ───────────────────────────────────────────────────

function PlatformMetricPicker({
  selectedPlatform, selectedMetrics, connectedPlatforms, onPlatformChange, onMetricsChange,
}: {
  selectedPlatform: IntegrationPlatform | "";
  selectedMetrics: string[];
  connectedPlatforms: IntegrationPlatform[];
  onPlatformChange: (p: IntegrationPlatform) => void;
  onMetricsChange: (keys: string[]) => void;
}) {
  const { metrics, isLoading } = useMetricDefinitions(
    selectedPlatform ? (selectedPlatform as IntegrationPlatform) : undefined,
  );

  const toggleMetric = (key: string) => {
    onMetricsChange(
      selectedMetrics.includes(key) ? selectedMetrics.filter((k) => k !== key) : [...selectedMetrics, key],
    );
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Platform</label>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {PLATFORM_OPTIONS.map((p) => {
            const isConnected = connectedPlatforms.includes(p.id);
            const isSelected = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                disabled={!isConnected}
                onClick={() => { if (isConnected) { onPlatformChange(p.id); onMetricsChange([]); } }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all"
                style={
                  isSelected
                    ? { background: 'rgba(91,71,224,0.08)', border: '1px solid rgba(91,71,224,0.30)', color: '#5B47E0' }
                    : isConnected
                    ? { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }
                    : { background: 'rgba(0,0,0,0.02)', border: '1px solid #ECECE6', color: '#9CA3AF', opacity: 0.5, cursor: 'not-allowed' }
                }
              >
                <span className="font-medium">{p.name}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={isConnected
                    ? { background: 'rgba(16,217,160,0.12)', color: '#10D9A0' }
                    : { background: 'rgba(0,0,0,0.06)', color: '#9CA3AF' }}
                >
                  {isConnected ? "Connected" : "Not connected"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedPlatform && (
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Metrics</label>
          {isLoading ? (
            <div className="space-y-1.5">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : (
            <div
              className="max-h-40 overflow-y-auto rounded-xl p-2 space-y-1"
              style={{ border: '1px solid #ECECE6' }}
            >
              {metrics.map((m) => {
                const checked = selectedMetrics.includes(m.metricKey);
                return (
                  <label
                    key={m.metricKey}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm transition-colors"
                    style={checked
                      ? { background: 'rgba(91,71,224,0.08)', color: '#5B47E0' }
                      : { color: 'var(--foreground)' }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMetric(m.metricKey)}
                      className="rounded"
                      style={{ accentColor: '#5B47E0' }}
                    />
                    {m.label}
                  </label>
                );
              })}
            </div>
          )}
          {selectedMetrics.length === 0 && (
            <p className="text-xs text-muted-foreground">Select at least one metric</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section modal ────────────────────────────────────────────────────────────

interface SectionFormState {
  type: SectionType;
  title: string;
  platform: IntegrationPlatform | "";
  metricKeys: string[];
  chartType: ChartType;
  content: string;
}

function SectionModal({
  initial, connectedPlatforms, onSave, onClose,
}: {
  initial?: ReportSection;
  connectedPlatforms: IntegrationPlatform[];
  onSave: (section: Omit<ReportSection, "id" | "order">) => void;
  onClose: () => void;
}) {
  const isEditing = !!initial;
  const [form, setForm] = useState<SectionFormState>({
    type: initial?.type ?? "METRICS",
    title: initial?.title ?? "",
    platform: (initial?.platform as IntegrationPlatform) ?? "",
    metricKeys: initial?.metricKeys ?? [],
    chartType: initial?.chartType ?? "LINE_CHART",
    content: initial?.content ?? "",
  });

  const canSave = (() => {
    if (!form.title.trim()) return false;
    if (form.type === "METRICS") return !!form.platform && form.metricKeys.length > 0;
    if (form.type === "CHART") return !!form.platform && form.metricKeys.length > 0;
    if (form.type === "TEXT") return form.content.trim().length > 0;
    return false;
  })();

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      type: form.type,
      title: form.title.trim(),
      platform: form.platform || undefined,
      metricKeys: form.type !== "TEXT" ? form.metricKeys : undefined,
      chartType: form.type === "CHART" ? form.chartType : undefined,
      content: form.type === "TEXT" ? form.content.trim() : undefined,
    });
  };

  const sc = SECTION_TYPE_CONFIG[form.type];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" as const }}
        className="bg-white w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="h-1 w-full shrink-0" style={{ background: `linear-gradient(90deg,${sc.color},${sc.color}99)` }} />
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #F5F5F0' }}>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: sc.bg }}>
              <FileText className="size-4" style={{ color: sc.color }} />
            </div>
            <h2 className="font-heading font-bold text-base text-foreground">
              {isEditing ? "Edit Section" : "Add Section"}
            </h2>
          </div>
          <button onClick={onClose} className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <X className="size-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Section type (new only) */}
          {!isEditing && (
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Section Type</label>
              <div className="flex gap-1.5">
                {(["METRICS", "CHART", "TEXT"] as SectionType[]).map((t) => {
                  const tc = SECTION_TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setForm((p) => ({ ...p, type: t, platform: "", metricKeys: [] }))}
                      className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all"
                      style={
                        form.type === t
                          ? { background: tc.bg, border: `1px solid ${tc.color}40`, color: tc.color }
                          : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }
                      }
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Title</label>
            <input
              autoFocus
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Traffic Overview"
              className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
            />
          </div>

          {/* Chart type */}
          {form.type === "CHART" && (
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Chart Type</label>
              <div className="flex gap-1.5">
                {CHART_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setForm((p) => ({ ...p, chartType: c.value }))}
                    className="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all"
                    style={
                      form.chartType === c.value
                        ? { background: 'rgba(255,122,89,0.10)', border: '1px solid rgba(255,122,89,0.30)', color: '#FF7A59' }
                        : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Platform + metrics */}
          {(form.type === "METRICS" || form.type === "CHART") && (
            <PlatformMetricPicker
              selectedPlatform={form.platform}
              selectedMetrics={form.metricKeys}
              connectedPlatforms={connectedPlatforms}
              onPlatformChange={(p) => setForm((prev) => ({ ...prev, platform: p }))}
              onMetricsChange={(keys) => setForm((prev) => ({ ...prev, metricKeys: keys }))}
            />
          )}

          {/* Text content */}
          {form.type === "TEXT" && (
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                placeholder="Write your text content here…"
                rows={6}
                maxLength={5000}
                className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all resize-none bg-white"
                style={inputStyle}
                onFocus={inputFocus as any}
                onBlur={inputBlur as any}
              />
              <p className="text-xs text-right text-muted-foreground">{form.content.length}/5000</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 shrink-0" style={{ borderTop: '1px solid #F5F5F0', background: 'rgba(0,0,0,0.01)' }}>
          <button onClick={onClose} className="h-9 px-4 rounded-xl text-sm font-semibold transition-colors" style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
          >
            {isEditing ? "Save Changes" : "Add Section"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportBuilder() {
  const { clientId, campaignId, reportId } = useParams<{
    clientId: string; campaignId: string; reportId: string;
  }>();
  const navigate = useNavigate();
  const api = getApiClient();

  const [sections, setSections] = useState<ReportSection[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReportSection | null>(null);

  const { data: report, isLoading, error: reportError } = useQuery<Report>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const res = await api.get<Report>(`/campaigns/${campaignId}/reports/${reportId}`);
      return res.data;
    },
    enabled: !!campaignId && !!reportId,
  });

  const { connectedPlatforms } = useConnectedPlatforms(clientId, campaignId);

  useEffect(() => {
    if (report && !dirty) {
      setSections([...(report.sections ?? [])].sort((a, b) => a.order - b.order));
    }
  }, [report, dirty]);

  const handleAddSection = (data: Omit<ReportSection, "id" | "order">) => {
    setSections((prev) => [...prev, { ...data, id: crypto.randomUUID(), order: prev.length }]);
    setDirty(true);
    setAddOpen(false);
  };

  const handleEditSection = (data: Omit<ReportSection, "id" | "order">) => {
    if (!editTarget) return;
    setSections((prev) => prev.map((s) => s.id === editTarget.id ? { ...s, ...data } : s));
    setDirty(true);
    setEditTarget(null);
  };

  const handleRemove = (id: string) => { setSections((prev) => prev.filter((s) => s.id !== id)); setDirty(true); };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSections((prev) => { const next = [...prev]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; });
    setDirty(true);
  };

  const handleMoveDown = (index: number) => {
    setSections((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/campaigns/${campaignId}/reports/${reportId}`, {
        sections: sections.map((s, i) => ({ ...s, order: i })),
      });
      setDirty(false);
      toast.success("Report saved");
      navigate(`/clients/${clientId}/campaigns/${campaignId}/reports/${reportId}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 space-y-4">
        <div className="h-5 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-10 w-72 bg-muted rounded-xl animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 flex flex-col items-center justify-center py-24">
        <div className="mb-3 size-12 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(244,63,94,0.08)' }}>
          <AlertCircle className="size-6" style={{ color: '#f43f5e' }} />
        </div>
        <p className="text-sm font-semibold text-foreground">Report not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[900px] mx-auto">
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
        <Link to={`/clients/${clientId}/campaigns/${campaignId}/reports`} className="hover:text-foreground transition-colors font-medium">Reports</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}/campaigns/${campaignId}/reports/${reportId}`} className="hover:text-foreground transition-colors font-medium">{report.name}</Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-foreground font-semibold">Edit</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">{report.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sections.length} section{sections.length !== 1 ? "s" : ""}
            {dirty && <span className="ml-2 font-semibold" style={{ color: '#F5A524' }}>· Unsaved changes</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/clients/${clientId}/campaigns/${campaignId}/reports/${reportId}`)}
            className="h-9 px-4 rounded-xl text-sm font-semibold transition-colors"
            style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)', boxShadow: dirty ? '0 2px 8px rgba(91,71,224,0.30)' : undefined }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>

      {/* Sections list */}
      <div className="space-y-2.5">
        {sections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" as const }}
            className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
            style={{ border: '2px dashed #ECECE6' }}
          >
            <div className="mb-4 size-14 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(91,71,224,0.08)' }}>
              <BarChart2 className="size-7" style={{ color: '#5B47E0' }} />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No sections yet</p>
            <p className="text-xs text-muted-foreground mb-5">Add sections to build your report layout</p>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
            >
              <Plus className="size-4" /> Add First Section
            </button>
          </motion.div>
        ) : (
          <>
            {sections.map((section, index) => {
              const sc = SECTION_TYPE_CONFIG[section.type];
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" as const }}
                  className="bg-white rounded-2xl overflow-hidden flex items-center gap-3 px-4 py-3.5 group"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="size-6 rounded-lg flex items-center justify-center text-muted-foreground transition-colors disabled:opacity-25"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      title="Move up"
                    >
                      <ArrowUp className="size-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === sections.length - 1}
                      className="size-6 rounded-lg flex items-center justify-center text-muted-foreground transition-colors disabled:opacity-25"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      title="Move down"
                    >
                      <ArrowDown className="size-3" />
                    </button>
                  </div>

                  {/* Type icon */}
                  <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: sc.bg }}>
                    <SectionIcon type={section.type} chartType={section.chartType} color={sc.color} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                      <span className="text-sm font-semibold text-foreground truncate">{section.title}</span>
                    </div>
                    {section.type !== "TEXT" && section.platform && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {section.platform}
                        {section.chartType && ` · ${section.chartType.replace("_", " ").toLowerCase()}`}
                        {section.metricKeys && section.metricKeys.length > 0 && (
                          <> · {section.metricKeys.slice(0, 3).join(", ")}{section.metricKeys.length > 3 ? ` +${section.metricKeys.length - 3}` : ""}</>
                        )}
                      </p>
                    )}
                    {section.type === "TEXT" && section.content && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{section.content}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditTarget(section)}
                      className="size-7 rounded-lg flex items-center justify-center text-muted-foreground transition-colors"
                      title="Edit"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemove(section.id)}
                      className="size-7 rounded-lg flex items-center justify-center text-muted-foreground transition-colors"
                      title="Remove"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#f43f5e'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = ''; }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            <button
              onClick={() => setAddOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-muted-foreground transition-all"
              style={{ border: '2px dashed #ECECE6' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(91,71,224,0.40)'; e.currentTarget.style.color = '#5B47E0'; e.currentTarget.style.background = 'rgba(91,71,224,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.color = ''; e.currentTarget.style.background = 'transparent'; }}
            >
              <Plus className="size-4" /> Add Section
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {addOpen && (
          <SectionModal connectedPlatforms={connectedPlatforms} onSave={handleAddSection} onClose={() => setAddOpen(false)} />
        )}
        {editTarget && (
          <SectionModal initial={editTarget} connectedPlatforms={connectedPlatforms} onSave={handleEditSection} onClose={() => setEditTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
