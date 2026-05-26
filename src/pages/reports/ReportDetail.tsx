import { useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  Edit2, FileDown, Share2, Copy, Check, Trash2,
  Calendar, Mail, Clock, AlertCircle, CheckCircle2, XCircle,
  Sparkles, RefreshCw, Loader2, Layers, ChevronRight,
  BarChart2, FileText, Hash, Link2, Send,
} from "lucide-react";
import { toast } from "sonner";
import { getApiClient } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import { hasRole } from "@/lib/rbac";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import type { Report, ReportSection, ReportSchedule, ShareLink, DeliveryRecord } from "@/types/reports";
import type { AiSummaryResponse } from "@/types/ai";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateRangeToDays(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

function defaultDateRange() {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  return { from, to };
}

function cronToHuman(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;
  const [minStr, hourStr, dom, , dow] = parts;
  const h = parseInt(hourStr, 10);
  const m = parseInt(minStr, 10);
  if (isNaN(h) || isNaN(m)) return cron;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const time = `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (dom !== "*" && !isNaN(parseInt(dom, 10))) {
    const d = parseInt(dom, 10);
    const suffix = d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th";
    return `Monthly on the ${d}${suffix} at ${time}`;
  }
  if (dow !== "*") {
    const d = parseInt(dow, 10);
    return `Every ${isNaN(d) ? dow : days[d] ?? dow} at ${time}`;
  }
  return `Daily at ${time}`;
}

const SECTION_TYPE_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  METRICS: { color: '#5B47E0', bg: 'rgba(91,71,224,0.10)', label: 'Metrics', icon: Hash },
  CHART:   { color: '#FF7A59', bg: 'rgba(255,122,89,0.10)', label: 'Chart',   icon: BarChart2 },
  TEXT:    { color: '#10D9A0', bg: 'rgba(16,217,160,0.10)', label: 'Text',    icon: FileText },
};

const CHART_TYPE_LABEL: Record<string, string> = {
  LINE_CHART: "Line Chart",
  BAR_CHART: "Bar Chart",
  PIE_CHART: "Pie Chart",
};

const PLATFORM_DISPLAY: Record<string, string> = {
  GA4: "Google Analytics 4",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  GOOGLE_SEARCH_CONSOLE: "Search Console",
  YOUTUBE_ANALYTICS: "YouTube Analytics",
  LINKEDIN_ADS: "LinkedIn Ads",
  TIKTOK_ADS: "TikTok Ads",
  AMAZON_ADS: "Amazon Ads",
};

// ─── Section card (read-only) ─────────────────────────────────────────────────

function SectionCard({ section, index }: { section: ReportSection; index: number }) {
  const cfg = SECTION_TYPE_CONFIG[section.type] ?? { color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)', label: section.type, icon: FileText };
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid #ECECE6' }}
    >
      <div className="h-0.5 w-full" style={{ background: cfg.color }} />
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg }}>
          <Icon className="size-4" style={{ color: cfg.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg" style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
            {section.chartType && (
              <span className="text-xs text-muted-foreground font-medium">{CHART_TYPE_LABEL[section.chartType]}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground mt-1">{section.title}</p>
          {section.platform && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {PLATFORM_DISPLAY[section.platform] ?? section.platform}
              {section.metricKeys && section.metricKeys.length > 0 && (
                <> · <span className="text-foreground/60">{section.metricKeys.join(", ")}</span></>
              )}
            </p>
          )}
          {section.type === "TEXT" && section.content && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{section.content}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add Schedule Modal ────────────────────────────────────────────────────────

type Frequency = "daily" | "weekly" | "monthly";

interface ScheduleFormState {
  frequency: Frequency;
  dayOfWeek: number;
  dayOfMonth: number;
  hour: number;
  minute: number;
  recipientEmails: string;
  dateRangeDays: number;
}

function buildCron(form: ScheduleFormState): string {
  const { frequency, dayOfWeek, dayOfMonth, hour, minute } = form;
  if (frequency === "daily") return `${minute} ${hour} * * *`;
  if (frequency === "weekly") return `${minute} ${hour} * * ${dayOfWeek}`;
  return `${minute} ${hour} ${dayOfMonth} * *`;
}

function parseEmails(raw: string): string[] {
  return raw.split(/[,\n]+/).map((e) => e.trim()).filter((e) => e.length > 0);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmails(emails: string[]): string | null {
  if (emails.length === 0) return "At least one recipient email is required";
  if (emails.length > 20) return "Maximum 20 recipient emails";
  const invalid = emails.find((e) => !EMAIL_RE.test(e));
  if (invalid) return `Invalid email: ${invalid}`;
  return null;
}

function inputFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}

function AddScheduleModal({ campaignId, reportId, onClose }: { campaignId: string; reportId: string; onClose: () => void }) {
  const api = getApiClient();
  const qc = useQueryClient();

  const { data: agency } = useQuery<{ timezone?: string }>({
    queryKey: ["agency-me"],
    queryFn: () => api.get("/agencies/me").then((r) => r.data),
  });
  const tz = agency?.timezone || "UTC";

  const [form, setForm] = useState<ScheduleFormState>({
    frequency: "weekly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    hour: 8,
    minute: 0,
    recipientEmails: "",
    dateRangeDays: 30,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const emails = parseEmails(form.recipientEmails);
    const validationError = validateEmails(emails);
    if (validationError) { setError(validationError); return; }
    setError(null);
    setSaving(true);
    try {
      await api.post(`/campaigns/${campaignId}/reports/${reportId}/schedules`, {
        cronExpression: buildCron(form),
        recipientEmails: emails,
        dateRangeDays: form.dateRangeDays,
      });
      qc.invalidateQueries({ queryKey: ["reportSchedules", reportId] });
      toast.success("Schedule created");
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to create schedule");
    } finally {
      setSaving(false);
    }
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
        className="bg-white rounded-2xl overflow-hidden w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED)' }} />
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
              <Calendar className="size-4" style={{ color: '#5B47E0' }} />
            </div>
            <h2 className="font-heading font-bold text-base text-foreground">Add Schedule</h2>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Frequency</p>
            <div className="flex gap-1.5">
              {(["daily", "weekly", "monthly"] as Frequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setForm((p) => ({ ...p, frequency: f }))}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl capitalize transition-all"
                  style={
                    form.frequency === f
                      ? { background: 'rgba(91,71,224,0.10)', border: '1px solid rgba(91,71,224,0.30)', color: '#5B47E0' }
                      : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Day of week */}
          {form.frequency === "weekly" && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Day of Week</p>
              <div className="flex flex-wrap gap-1.5">
                {days.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setForm((p) => ({ ...p, dayOfWeek: i }))}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl transition-all"
                    style={
                      form.dayOfWeek === i
                        ? { background: 'rgba(91,71,224,0.10)', border: '1px solid rgba(91,71,224,0.30)', color: '#5B47E0' }
                        : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }
                    }
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of month */}
          {form.frequency === "monthly" && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Day of Month (1–28)</p>
              <input
                type="number" min={1} max={28}
                value={form.dayOfMonth}
                onChange={(e) => setForm((p) => ({ ...p, dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value))) }))}
                className="w-28 px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white"
                style={{ border: '1px solid #ECECE6' }}
                onFocus={inputFocus} onBlur={inputBlur}
              />
            </div>
          )}

          {/* Time */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Time ({tz})</p>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={23}
                value={form.hour}
                onChange={(e) => setForm((p) => ({ ...p, hour: Math.min(23, Math.max(0, Number(e.target.value))) }))}
                className="w-20 px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white text-center"
                style={{ border: '1px solid #ECECE6' }}
                onFocus={inputFocus} onBlur={inputBlur}
              />
              <span className="text-muted-foreground font-bold">:</span>
              <input
                type="number" min={0} max={59} step={5}
                value={form.minute}
                onChange={(e) => setForm((p) => ({ ...p, minute: Math.min(59, Math.max(0, Number(e.target.value))) }))}
                className="w-20 px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white text-center"
                style={{ border: '1px solid #ECECE6' }}
                onFocus={inputFocus} onBlur={inputBlur}
              />
            </div>
            <p className="text-xs text-muted-foreground">Preview: <span className="font-semibold text-foreground">{cronToHuman(buildCron(form))}</span></p>
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Report Date Range (days)</p>
            <input
              type="number" min={1} max={365}
              value={form.dateRangeDays}
              onChange={(e) => setForm((p) => ({ ...p, dateRangeDays: Math.min(365, Math.max(1, Number(e.target.value))) }))}
              className="w-28 px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white"
              style={{ border: '1px solid #ECECE6' }}
              onFocus={inputFocus} onBlur={inputBlur}
            />
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Recipient Emails</p>
            <textarea
              value={form.recipientEmails}
              onChange={(e) => setForm((p) => ({ ...p, recipientEmails: e.target.value }))}
              placeholder="email@example.com, another@example.com"
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white resize-none"
              style={{ border: '1px solid #ECECE6' }}
              onFocus={inputFocus} onBlur={inputBlur}
            />
            <p className="text-xs text-muted-foreground">Comma-separated, max 20</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl" style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.20)' }}>
              <AlertCircle className="size-3.5 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors"
              style={{ border: '1px solid #ECECE6', background: '#FAFAF7', color: 'var(--foreground)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
            >
              {saving ? "Creating…" : "Create Schedule"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = "sections" | "schedule" | "links" | "history" | "ai";

const TAB_META: Record<Tab, { label: string; icon?: React.ElementType }> = {
  sections: { label: "Sections" },
  schedule: { label: "Schedule", icon: Calendar },
  links:    { label: "Share Links", icon: Link2 },
  history:  { label: "Delivery History", icon: Send },
  ai:       { label: "AI Summary", icon: Sparkles },
};

export default function ReportDetail() {
  const { clientId, campaignId, reportId } = useParams<{
    clientId: string;
    campaignId: string;
    reportId: string;
  }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const api = getApiClient();
  const role = useRole();
  const canEdit = hasRole(role, "AGENCY_ADMIN");

  const [activeTab, setActiveTab] = useState<Tab>("sections");
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateNamePrompt, setTemplateNamePrompt] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const [aiSummaryData, setAiSummaryData] = useState<AiSummaryResponse | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [aiRegenerating, setAiRegenerating] = useState(false);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: report, isLoading, error: reportError } = useQuery<Report>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const res = await api.get<Report>(`/campaigns/${campaignId}/reports/${reportId}`);
      return res.data;
    },
    enabled: !!campaignId && !!reportId,
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<ReportSchedule[]>({
    queryKey: ["reportSchedules", reportId],
    queryFn: async () => {
      const res = await api.get<ReportSchedule[]>(`/campaigns/${campaignId}/reports/${reportId}/schedules`);
      return res.data;
    },
    enabled: !!reportId && activeTab === "schedule",
  });

  const { data: shareLinks = [], isLoading: linksLoading } = useQuery<ShareLink[]>({
    queryKey: ["reportShareLinks", reportId],
    queryFn: async () => {
      const res = await api.get<ShareLink[]>(`/campaigns/${campaignId}/reports/${reportId}/share-links`);
      return res.data;
    },
    enabled: !!reportId && activeTab === "links",
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<DeliveryRecord[]>({
    queryKey: ["reportDeliveries", reportId],
    queryFn: async () => {
      const res = await api.get<DeliveryRecord[]>(`/campaigns/${campaignId}/reports/${reportId}/deliveries`);
      return res.data;
    },
    enabled: !!reportId && activeTab === "history",
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/campaigns/${campaignId}/reports/${reportId}`, { status: "PUBLISHED" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report", reportId] });
      qc.invalidateQueries({ queryKey: ["reports", campaignId] });
      toast.success("Report published");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to publish report"),
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, isActive }: { scheduleId: string; isActive: boolean }) => {
      await api.patch(`/campaigns/${campaignId}/reports/${reportId}/schedules/${scheduleId}`, { isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reportSchedules", reportId] }),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update schedule"),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      await api.delete(`/campaigns/${campaignId}/reports/${reportId}/schedules/${scheduleId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reportSchedules", reportId] });
      toast.success("Schedule deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to delete schedule"),
  });

  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ShareLink>(`/campaigns/${campaignId}/reports/${reportId}/share-links`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reportShareLinks", reportId] });
      toast.success("Share link created");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to create share link"),
  });

  const revokeLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await api.delete(`/campaigns/${campaignId}/reports/${reportId}/share-links/${linkId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reportShareLinks", reportId] });
      setRevokeTarget(null);
      toast.success("Link revoked");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to revoke link"),
  });

  // ─── Generate PDF ────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!report || report.status === "DRAFT") return;
    setGenerating(true);
    setPdfUrl(null);
    try {
      const days = dateRangeToDays(dateRange.from, dateRange.to);
      const res = await api.post<{ url?: string; pdfUrl?: string; downloadUrl?: string }>(
        `/campaigns/${campaignId}/reports/${reportId}/generate?days=${days}`,
      );
      const url = res.data.downloadUrl ?? res.data.url ?? null;
      if (url) {
        setPdfUrl(url);
        toast.success("Report generated", { action: { label: "Download", onClick: () => window.open(url, "_blank") } });
      } else {
        toast.success("Report generated — check your downloads");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Copy share link ─────────────────────────────────────────────────────────

  const handleCopyLink = useCallback(async (link: ShareLink) => {
    const url = `${window.location.origin}/r/${link.token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedLinkId(link.id);
    setTimeout(() => setCopiedLinkId((prev) => (prev === link.id ? null : prev)), 2000);
  }, []);

  // ─── AI Summary ───────────────────────────────────────────────────────────────

  const handleGenerateSummary = useCallback(async (force = false) => {
    if (!report) return;
    if (force) setAiRegenerating(true);
    else { setAiSummaryLoading(true); setAiSummaryError(null); }
    try {
      const res = await api.post<AiSummaryResponse>(
        `/clients/${clientId}/campaigns/${campaignId}/reports/${reportId}/ai-summary${force ? "?force=true" : ""}`,
      );
      setAiSummaryData(res.data);
      setAiSummaryError(null);
    } catch (e: any) {
      const status = e?.response?.status;
      setAiSummaryError(
        status === 503
          ? "AI service is currently unavailable. Please try again later."
          : (e?.response?.data?.message ?? "Failed to generate summary"),
      );
    } finally {
      setAiSummaryLoading(false);
      setAiRegenerating(false);
    }
  }, [report, clientId, campaignId, reportId, api]);

  // ─── Save as template ─────────────────────────────────────────────────────────

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    setTemplateNamePrompt(false);
    try {
      await api.post(
        `/clients/${clientId}/campaigns/${campaignId}/reports/${reportId}/save-as-template`,
        { templateName: templateName.trim() },
      );
      toast.success("Report saved as template", {
        description: "Find it under Templates → My Agency.",
        action: { label: "View Templates", onClick: () => window.open("/templates", "_blank") },
      });
      setTemplateName("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to save as template");
    } finally {
      setSavingTemplate(false);
    }
  };

  // ─── Loading / error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 space-y-6">
        <div className="h-4 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="h-8 w-80 rounded-xl bg-muted animate-pulse" />
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="p-4 sm:p-5 lg:p-7 flex flex-col items-center justify-center py-24 text-center">
        <div className="size-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(244,63,94,0.08)' }}>
          <AlertCircle className="size-7" style={{ color: '#f43f5e' }} />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">Report not found</p>
        <button
          onClick={() => navigate(`/clients/${clientId}/campaigns/${campaignId}/reports`)}
          className="text-sm mt-2 font-semibold transition-opacity hover:opacity-70"
          style={{ color: '#5B47E0' }}
        >
          Back to reports
        </button>
      </div>
    );
  }

  const sortedSections = [...(report.sections ?? [])].sort((a, b) => a.order - b.order);
  const isPublished = report.status === "PUBLISHED";

  const visibleTabs: Tab[] = ["sections", ...(!hasRole(role, "AGENCY_STAFF") ? [] : ["schedule" as Tab, "links" as Tab]), "history", "ai"];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12">
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
        <span className="text-foreground font-semibold">{report.name}</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
            <FileDown className="size-5" style={{ color: '#5B47E0' }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground truncate">{report.name}</h1>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-widest shrink-0"
                style={
                  isPublished
                    ? { background: 'rgba(16,217,160,0.12)', color: '#059669', border: '1px solid rgba(16,217,160,0.25)' }
                    : { background: 'rgba(156,163,175,0.12)', color: '#6B7280', border: '1px solid rgba(156,163,175,0.25)' }
                }
              >
                {isPublished ? <CheckCircle2 className="size-3 mr-1" /> : <Clock className="size-3 mr-1" />}
                {report.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && !isPublished && (
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'rgba(16,217,160,0.12)', color: '#059669', border: '1px solid rgba(16,217,160,0.30)' }}
            >
              <CheckCircle2 className="size-3.5" />
              {publishMutation.isPending ? "Publishing…" : "Publish"}
            </button>
          )}
          {canEdit && (
            <>
              <Link
                to={`/clients/${clientId}/campaigns/${campaignId}/reports/${reportId}/edit`}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
              >
                <Edit2 className="size-3.5" />
                Edit
              </Link>
              <button
                onClick={() => { setTemplateName(report?.name ?? ""); setTemplateNamePrompt(true); }}
                disabled={savingTemplate}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
              >
                <Layers className="size-3.5" />
                {savingTemplate ? "Saving…" : "Save as Template"}
              </button>
            </>
          )}
          <div className="h-9 flex items-center">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !isPublished}
            title={!isPublished ? "Publish the report before generating a PDF" : "Generate PDF"}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
          >
            {generating ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
            {generating ? "Generating…" : "Generate PDF"}
          </button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'rgba(16,217,160,0.10)', color: '#059669', border: '1px solid rgba(16,217,160,0.25)' }}
            >
              <FileDown className="size-3.5" />
              Download
            </a>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" as const }}
        className="flex gap-0 overflow-x-auto"
        style={{ borderBottom: '1px solid #ECECE6' }}
      >
        {visibleTabs.map((tab) => {
          const meta = TAB_META[tab];
          const TabIcon = meta.icon;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap -mb-px transition-colors relative"
              style={
                isActive
                  ? { color: '#5B47E0', borderBottom: '2px solid #5B47E0' }
                  : { color: 'var(--muted-foreground)', borderBottom: '2px solid transparent' }
              }
            >
              {TabIcon && <TabIcon className="size-3.5" />}
              {meta.label}
            </button>
          );
        })}
      </motion.div>

      {/* ── Sections tab ── */}
      {activeTab === "sections" && (
        <div className="space-y-3">
          {sortedSections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
              style={{ border: '1.5px dashed #ECECE6' }}
            >
              <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
                <FileText className="size-7" style={{ color: '#5B47E0' }} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No sections yet</p>
              {canEdit && (
                <Link
                  to={`/clients/${clientId}/campaigns/${campaignId}/reports/${reportId}/edit`}
                  className="text-sm font-semibold mt-1 transition-opacity hover:opacity-70"
                  style={{ color: '#5B47E0' }}
                >
                  Open builder to add sections
                </Link>
              )}
            </motion.div>
          ) : (
            sortedSections.map((section, i) => (
              <SectionCard key={section.id} section={section} index={i} />
            ))
          )}
        </div>
      )}

      {/* ── Schedule tab ── */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Schedules deliver a generated PDF to recipients on a recurring basis.</p>
            {canEdit && (
              <button
                onClick={() => setAddScheduleOpen(true)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
              >
                <Calendar className="size-3.5" />
                Add Schedule
              </button>
            )}
          </div>

          {schedulesLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : schedules.length === 0 ? (
            <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center" style={{ border: '1.5px dashed #ECECE6' }}>
              <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
                <Clock className="size-7" style={{ color: '#5B47E0' }} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No schedules configured</p>
              <p className="text-xs text-muted-foreground">Automated delivery will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule, i) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" as const }}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  <div className="h-0.5 w-full" style={{ background: schedule.isActive ? '#10D9A0' : '#9CA3AF' }} />
                  <div className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{cronToHuman(schedule.cronExpression)}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{schedule.recipientEmails.join(", ")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Last {schedule.dateRangeDays} days of data</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-xl"
                        style={
                          schedule.isActive
                            ? { background: 'rgba(16,217,160,0.10)', color: '#059669', border: '1px solid rgba(16,217,160,0.25)' }
                            : { background: 'rgba(156,163,175,0.10)', color: '#6B7280', border: '1px solid rgba(156,163,175,0.25)' }
                        }
                      >
                        {schedule.isActive ? "Active" : "Paused"}
                      </span>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => toggleScheduleMutation.mutate({ scheduleId: schedule.id, isActive: !schedule.isActive })}
                            className="h-8 px-3 text-xs font-semibold rounded-xl transition-colors"
                            style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
                          >
                            {schedule.isActive ? "Pause" : "Resume"}
                          </button>
                          <button
                            onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                            className="size-8 flex items-center justify-center rounded-xl transition-colors"
                            style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}
                            title="Delete schedule"
                          >
                            <Trash2 className="size-3.5 text-muted-foreground" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {addScheduleOpen && (
              <AddScheduleModal
                campaignId={campaignId!}
                reportId={reportId!}
                onClose={() => setAddScheduleOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Share Links tab ── */}
      {activeTab === "links" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Share links let anyone view this report without logging in.</p>
            {canEdit && (
              <button
                onClick={() => createLinkMutation.mutate()}
                disabled={createLinkMutation.isPending}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 shrink-0"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
              >
                <Share2 className="size-3.5" />
                {createLinkMutation.isPending ? "Creating…" : "Create Link"}
              </button>
            )}
          </div>

          {linksLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : shareLinks.length === 0 ? (
            <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center" style={{ border: '1.5px dashed #ECECE6' }}>
              <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
                <Share2 className="size-7" style={{ color: '#5B47E0' }} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No active share links</p>
              <p className="text-xs text-muted-foreground">Create a link to share this report publicly</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shareLinks.map((link, i) => {
                const url = `${window.location.origin}/r/${link.token}`;
                const isCopied = copiedLinkId === link.id;
                const expired = link.expiresAt && new Date(link.expiresAt) < new Date();
                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" as const }}
                    className="bg-white rounded-2xl overflow-hidden"
                    style={{ border: expired ? '1px solid rgba(244,63,94,0.25)' : '1px solid #ECECE6' }}
                  >
                    <div className="h-0.5 w-full" style={{ background: expired ? '#f43f5e' : '#10D9A0' }} />
                    <div className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground truncate">{url}</p>
                        {link.expiresAt ? (
                          <p className="text-xs font-medium" style={{ color: expired ? '#f43f5e' : 'var(--muted-foreground)' }}>
                            {expired ? "Expired" : "Expires"}{" "}
                            {new Date(link.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">No expiry</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopyLink(link)}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl transition-all"
                          style={
                            isCopied
                              ? { background: 'rgba(16,217,160,0.12)', color: '#059669', border: '1px solid rgba(16,217,160,0.30)' }
                              : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }
                          }
                        >
                          {isCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                          {isCopied ? "Copied!" : "Copy"}
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => setRevokeTarget(link.id)}
                            className="h-8 px-3 text-xs font-semibold rounded-xl transition-colors"
                            style={{ background: 'rgba(244,63,94,0.06)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.20)' }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {revokeTarget && (
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
                  style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                >
                  <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#e11d48)' }} />
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(244,63,94,0.10)' }}>
                        <XCircle className="size-4" style={{ color: '#f43f5e' }} />
                      </div>
                      <h2 className="font-heading font-bold text-base text-foreground">Revoke Link?</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Anyone using this link will no longer be able to view the report. This cannot be undone.</p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setRevokeTarget(null)}
                        className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                        style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => revokeLinkMutation.mutate(revokeTarget)}
                        disabled={revokeLinkMutation.isPending}
                        className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}
                      >
                        {revokeLinkMutation.isPending ? "Revoking…" : "Revoke"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Delivery History tab ── */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {deliveriesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : deliveries.length === 0 ? (
            <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center" style={{ border: '1.5px dashed #ECECE6' }}>
              <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
                <Send className="size-7" style={{ color: '#5B47E0' }} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No deliveries recorded yet</p>
              <p className="text-xs text-muted-foreground">Delivery history will appear here after the first scheduled send</p>
            </div>
          ) : (
            deliveries.map((d, i) => {
              const isDelivered = d.status === "DELIVERED";
              const isFailed = d.status === "FAILED";
              const statusColor = isDelivered ? '#10D9A0' : isFailed ? '#f43f5e' : '#9CA3AF';
              const StatusIcon = isDelivered ? CheckCircle2 : isFailed ? XCircle : Clock;
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" as const }}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  <div className="h-0.5 w-full" style={{ background: statusColor }} />
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="size-3.5 shrink-0" style={{ color: statusColor }} />
                        <span className="text-sm font-semibold" style={{ color: statusColor }}>
                          {d.status}
                        </span>
                        {d.errorMessage && (
                          <span className="text-xs text-muted-foreground">— {d.errorMessage}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{d.recipientEmails.join(", ")}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(d.deliveredAt).toLocaleString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ── AI Summary tab ── */}
      {activeTab === "ai" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {sortedSections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
              style={{ border: '1.5px dashed #ECECE6' }}
            >
              <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
                <Sparkles className="size-7" style={{ color: '#5B47E0' }} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Add sections to generate a summary</p>
              {canEdit && (
                <Link
                  to={`/clients/${clientId}/campaigns/${campaignId}/reports/${reportId}/edit`}
                  className="text-sm font-semibold mt-1 transition-opacity hover:opacity-70"
                  style={{ color: '#5B47E0' }}
                >
                  Open builder
                </Link>
              )}
            </motion.div>
          ) : (
            <>
              {/* Summary header */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" as const }}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ border: '1px solid #ECECE6' }}
              >
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED,#FF7A59)' }} />
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
                      <Sparkles className="size-4" style={{ color: '#5B47E0' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">AI Executive Summary</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Generated by Claude · based on your report sections</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      {aiSummaryData && (
                        <button
                          onClick={() => handleGenerateSummary(true)}
                          disabled={aiSummaryLoading || aiRegenerating}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                          style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
                        >
                          <RefreshCw className={`size-3.5 ${aiRegenerating ? "animate-spin" : ""}`} />
                          Regenerate
                        </button>
                      )}
                      {!aiSummaryData && (
                        <button
                          onClick={() => handleGenerateSummary(false)}
                          disabled={aiSummaryLoading}
                          className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
                        >
                          {aiSummaryLoading
                            ? <Loader2 className="size-3.5 animate-spin" />
                            : <Sparkles className="size-3.5" />}
                          {aiSummaryLoading ? "Generating…" : "Generate Summary"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Error */}
              {aiSummaryError && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" as const }}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
                  style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)' }}
                >
                  <AlertCircle className="size-4 shrink-0 mt-0.5" style={{ color: '#f43f5e' }} />
                  <p className="text-sm" style={{ color: '#f43f5e' }}>{aiSummaryError}</p>
                </motion.div>
              )}

              {/* First-load skeleton */}
              {aiSummaryLoading && !aiSummaryData && (
                <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid #ECECE6' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-3.5 rounded-full bg-muted animate-pulse ${i === 4 ? "w-3/5" : "w-full"}`} />
                  ))}
                </div>
              )}

              {/* Summary content */}
              {aiSummaryData && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" as const }}
                  className="relative"
                >
                  {aiRegenerating && (
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10" style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(3px)' }}>
                      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#5B47E0' }}>
                        <Loader2 className="size-4 animate-spin" />
                        Regenerating…
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
                    <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />
                    <div className="p-5 space-y-4">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiSummaryData.summary}</p>
                      <div className="flex items-center gap-2.5 pt-3 flex-wrap" style={{ borderTop: '1px solid #ECECE6' }}>
                        <span className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}>
                          {aiSummaryData.model}
                        </span>
                        {aiSummaryData.cached && (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg" style={{ background: 'rgba(245,165,36,0.10)', color: '#F5A524', border: '1px solid rgba(245,165,36,0.20)' }}>
                            Cached (24h)
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          Last generated:{" "}
                          {new Date(aiSummaryData.generatedAt).toLocaleString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                            hour: "numeric", minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Prompt to generate */}
              {!aiSummaryData && !aiSummaryLoading && !aiSummaryError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" as const }}
                  className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
                  style={{ border: '1.5px dashed #ECECE6' }}
                >
                  <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
                    <Sparkles className="size-7" style={{ color: '#5B47E0' }} />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">No summary yet</p>
                  <p className="text-xs text-muted-foreground">
                    {canEdit
                      ? "Click \"Generate Summary\" above to create an AI executive summary."
                      : "An admin can generate an AI summary for this report."}
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      )}

      {/* Save as template modal */}
      <AnimatePresence>
        {templateNamePrompt && (
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
              style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED)' }} />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
                    <Layers className="size-4" style={{ color: '#5B47E0' }} />
                  </div>
                  <h2 className="font-heading font-bold text-base text-foreground">Save as Template</h2>
                </div>
                <input
                  autoFocus
                  type="text"
                  className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white"
                  style={{ border: '1px solid #ECECE6' }}
                  placeholder="e.g. Monthly SEO Report"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onFocus={inputFocus as any}
                  onBlur={inputBlur as any}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveAsTemplate();
                    if (e.key === "Escape") setTemplateNamePrompt(false);
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setTemplateNamePrompt(false)}
                    className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                    style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAsTemplate}
                    disabled={!templateName.trim()}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
