import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Target, Trash2, Edit2, CheckCircle2, AlertCircle, X, ChevronRight, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import { hasRole } from "@/lib/rbac";
import { useConnectedPlatforms } from "@/hooks/useConnectedPlatforms";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import type { GoalProgress, GoalPeriodType, GoalStatus } from "@/types/goals";
import type { IntegrationPlatform } from "@/types/dashboard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<GoalStatus, { color: string; bg: string; label: string; barColor: string }> = {
  ACHIEVED: { color: '#10D9A0', bg: 'rgba(16,217,160,0.10)',  label: 'Achieved', barColor: '#10D9A0' },
  ON_TRACK: { color: '#5B47E0', bg: 'rgba(91,71,224,0.10)',   label: 'On Track', barColor: '#5B47E0' },
  AT_RISK:  { color: '#d97706', bg: 'rgba(245,165,36,0.10)',  label: 'At Risk',  barColor: '#F5A524' },
  BEHIND:   { color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',   label: 'Behind',   barColor: '#f43f5e' },
};

function deriveStatus(pct: number): GoalStatus {
  if (pct >= 100) return "ACHIEVED";
  if (pct >= 70) return "ON_TRACK";
  if (pct >= 40) return "AT_RISK";
  return "BEHIND";
}

function formatValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value % 1 === 0 ? String(value) : value.toFixed(2);
}

function periodLabel(periodType: GoalPeriodType, start: string, end: string): string {
  const type = periodType.charAt(0) + periodType.slice(1).toLowerCase();
  const s = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${type} · ${s} – ${e}`;
}

function suggestDateRange(periodType: GoalPeriodType): { start: string; end: string } {
  const today = new Date();
  if (periodType === "WEEKLY") {
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday.toISOString().split("T")[0], end: sunday.toISOString().split("T")[0] };
  }
  if (periodType === "MONTHLY") {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: s.toISOString().split("T")[0], end: e.toISOString().split("T")[0] };
  }
  const q = Math.floor(today.getMonth() / 3);
  const s = new Date(today.getFullYear(), q * 3, 1);
  const e = new Date(today.getFullYear(), q * 3 + 3, 0);
  return { start: s.toISOString().split("T")[0], end: e.toISOString().split("T")[0] };
}

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

// ─── Input helpers ────────────────────────────────────────────────────────────

function inputFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}
const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white";
const inputStyle = { border: '1px solid #ECECE6' };

// ─── Goal form modal ──────────────────────────────────────────────────────────

interface GoalFormState {
  name: string;
  platform: IntegrationPlatform | "";
  metricKey: string;
  targetValue: string;
  periodType: GoalPeriodType;
  periodStart: string;
  periodEnd: string;
}

function GoalModal({
  initial, connectedPlatforms, campaignId, clientId, onClose,
}: {
  initial?: GoalProgress;
  connectedPlatforms: IntegrationPlatform[];
  campaignId: string;
  clientId: string;
  onClose: () => void;
}) {
  const api = getApiClient();
  const qc = useQueryClient();
  const isEditing = !!initial;
  const defaultRange = suggestDateRange("MONTHLY");

  const [form, setForm] = useState<GoalFormState>({
    name: initial?.goal.name ?? "",
    platform: (initial?.goal.platform as IntegrationPlatform) ?? "",
    metricKey: initial?.goal.metricKey ?? "",
    targetValue: initial?.goal.targetValue != null ? String(initial.goal.targetValue) : "",
    periodType: initial?.goal.periodType ?? "MONTHLY",
    periodStart: initial?.goal.periodStart ?? defaultRange.start,
    periodEnd: initial?.goal.periodEnd ?? defaultRange.end,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { metrics, isLoading: metricsLoading } = useMetricDefinitions(
    form.platform ? (form.platform as IntegrationPlatform) : undefined,
  );

  const handlePeriodTypeChange = (t: GoalPeriodType) => {
    const range = suggestDateRange(t);
    setForm((p) => ({ ...p, periodType: t, periodStart: range.start, periodEnd: range.end }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.platform) { setError("Platform is required"); return; }
    if (!form.metricKey) { setError("Metric is required"); return; }
    const target = parseFloat(form.targetValue);
    if (isNaN(target) || target < 0) { setError("Target value must be >= 0"); return; }
    if (!form.periodStart || !form.periodEnd) { setError("Period dates are required"); return; }
    if (new Date(form.periodStart) >= new Date(form.periodEnd)) {
      setError("Period start must be before period end"); return;
    }
    setError(null);
    setSaving(true);
    const body = {
      name: form.name.trim(), platform: form.platform, metricKey: form.metricKey,
      targetValue: target, periodType: form.periodType,
      periodStart: form.periodStart, periodEnd: form.periodEnd,
    };
    try {
      if (isEditing) {
        await api.patch(`/clients/${clientId}/campaigns/${campaignId}/goals/${initial.goalId}`, body);
        toast.success("Goal updated");
      } else {
        await api.post(`/clients/${clientId}/campaigns/${campaignId}/goals`, body);
        toast.success("Goal created");
      }
      qc.invalidateQueries({ queryKey: ["goalsProgress", clientId, campaignId] });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to save goal");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #F5F5F0' }}>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
              <Target className="size-4" style={{ color: '#5B47E0' }} />
            </div>
            <h2 className="font-heading font-bold text-base text-foreground">{isEditing ? "Edit Goal" : "Create Goal"}</h2>
          </div>
          <button onClick={onClose} className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <X className="size-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Goal Name</label>
            <input autoFocus type="text" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Monthly Sessions Target"
              className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
            />
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Platform</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {PLATFORM_OPTIONS.map((p) => {
                const isConnected = connectedPlatforms.includes(p.id);
                const isSelected = form.platform === p.id;
                return (
                  <button key={p.id} type="button" disabled={!isConnected}
                    onClick={() => { if (isConnected) setForm((prev) => ({ ...prev, platform: p.id, metricKey: "" })); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={
                      isSelected
                        ? { background: 'rgba(91,71,224,0.08)', border: '1px solid rgba(91,71,224,0.30)', color: '#5B47E0' }
                        : isConnected
                        ? { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }
                        : { background: 'rgba(0,0,0,0.02)', border: '1px solid #ECECE6', color: '#9CA3AF', opacity: 0.5, cursor: 'not-allowed' }
                    }
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
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

          {/* Metric */}
          {form.platform && (
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Metric</label>
              {metricsLoading ? (
                <div className="h-10 bg-muted rounded-xl animate-pulse" />
              ) : (
                <select value={form.metricKey}
                  onChange={(e) => setForm((p) => ({ ...p, metricKey: e.target.value }))}
                  className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                >
                  <option value="">Select metric…</option>
                  {metrics.map((m) => <option key={m.metricKey} value={m.metricKey}>{m.label}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Target value */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Target Value</label>
            <input type="number" min={0} step="any" value={form.targetValue}
              onChange={(e) => setForm((p) => ({ ...p, targetValue: e.target.value }))}
              placeholder="e.g. 10000"
              className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
            />
          </div>

          {/* Period type */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Period</label>
            <div className="flex gap-1.5">
              {(["WEEKLY", "MONTHLY", "QUARTERLY"] as GoalPeriodType[]).map((t) => (
                <button key={t} type="button" onClick={() => handlePeriodTypeChange(t)}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl capitalize transition-all"
                  style={
                    form.periodType === t
                      ? { background: 'rgba(91,71,224,0.10)', border: '1px solid rgba(91,71,224,0.30)', color: '#5B47E0' }
                      : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }
                  }
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Period dates */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Start Date", key: "periodStart" as const, min: undefined },
              { label: "End Date", key: "periodEnd" as const, min: form.periodStart },
            ].map(({ label, key, min }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">{label}</label>
                <input type="date" value={form[key]} min={min}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>
              <AlertCircle className="size-4 shrink-0" />{error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 shrink-0" style={{ borderTop: '1px solid #F5F5F0', background: 'rgba(0,0,0,0.01)' }}>
          <button onClick={onClose} className="h-9 px-4 rounded-xl text-sm font-semibold transition-colors" style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
          >
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Goal"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard({
  gp, canEdit, onEdit, onDelete, index,
}: {
  gp: GoalProgress; canEdit: boolean; onEdit: () => void; onDelete: () => void; index: number;
}) {
  const pct = Math.min(100, gp.percentComplete ?? 0);
  const status = gp.status ?? deriveStatus(pct);
  const sc = STATUS_CONFIG[status];
  const isAchieved = status === "ACHIEVED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{
        border: `1px solid ${isAchieved ? 'rgba(16,217,160,0.30)' : '#ECECE6'}`,
        boxShadow: isAchieved ? '0 0 0 3px rgba(16,217,160,0.06)' : undefined,
      }}
    >
      {/* Status bar */}
      <div className="h-1 w-full" style={{ background: sc.barColor }} />

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl shrink-0 flex items-center justify-center" style={{ background: sc.bg }}>
              {isAchieved
                ? <CheckCircle2 className="size-4" style={{ color: sc.color }} />
                : <TrendingUp className="size-4" style={{ color: sc.color }} />}
            </div>
            <div className="min-w-0">
              <p className="font-heading font-semibold text-sm text-foreground truncate">{gp.goal.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {gp.goal.metricKey} · {gp.goal.platform}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
            {sc.label}
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: sc.barColor }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              <span className="font-bold font-mono tabular-nums text-foreground">{formatValue(gp.currentValue ?? 0)}</span>
              <span className="text-muted-foreground/60"> / {formatValue(gp.targetValue)}</span>
            </span>
            <span className="font-bold font-mono tabular-nums" style={{ color: sc.color }}>{Math.round(pct)}%</span>
          </div>
        </div>

        {/* Period */}
        <p className="text-[11px] text-muted-foreground">
          {periodLabel(gp.goal.periodType, gp.goal.periodStart, gp.goal.periodEnd)}
        </p>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center justify-between pt-2 mt-auto" style={{ borderTop: '1px solid #F5F5F0' }}>
            {!isAchieved ? (
              <button onClick={onEdit}
                className="inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#5B47E0' }}
              >
                <Edit2 className="size-3" /> Edit
              </button>
            ) : (
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: '#10D9A0' }}>
                <CheckCircle2 className="size-3" /> Completed
              </span>
            )}
            <button onClick={onDelete}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              <Trash2 className="size-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GoalsPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const api = getApiClient();
  const qc = useQueryClient();
  const role = useRole();
  const canEdit = hasRole(role, "AGENCY_ADMIN");

  const { connectedPlatforms } = useConnectedPlatforms(clientId, campaignId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GoalProgress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoalProgress | null>(null);

  const { data: progress = [], isLoading } = useQuery<GoalProgress[]>({
    queryKey: ["goalsProgress", clientId, campaignId],
    queryFn: async () => {
      const res = await api.get<GoalProgress[]>(`/clients/${clientId}/campaigns/${campaignId}/goals/progress`);
      return res.data;
    },
    enabled: !!clientId && !!campaignId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (goalId: string) => {
      await api.delete(`/clients/${clientId}/campaigns/${campaignId}/goals/${goalId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goalsProgress", clientId, campaignId] });
      setDeleteTarget(null);
      toast.success("Goal deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to delete goal"),
  });

  const achievedCount = progress.filter((g) => (g.status ?? deriveStatus(g.percentComplete ?? 0)) === "ACHIEVED").length;
  const onTrackCount = progress.filter((g) => (g.status ?? deriveStatus(g.percentComplete ?? 0)) === "ON_TRACK").length;

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[1100px] mx-auto">
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
        <span className="text-foreground font-semibold">Goals</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
            <Target className="size-5" style={{ color: '#5B47E0' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">
              Goals
              {progress.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({progress.length})</span>}
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              {achievedCount > 0 && (
                <span className="text-xs font-semibold" style={{ color: '#10D9A0' }}>{achievedCount} achieved</span>
              )}
              {onTrackCount > 0 && (
                <span className="text-xs font-semibold" style={{ color: '#5B47E0' }}>{onTrackCount} on track</span>
              )}
              {achievedCount === 0 && onTrackCount === 0 && (
                <p className="text-xs text-muted-foreground">Track metric performance over time</p>
              )}
            </div>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)', boxShadow: '0 2px 8px rgba(91,71,224,0.30)' }}
          >
            <Plus className="size-4" /> New Goal
          </button>
        )}
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && progress.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 text-center"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="mb-4 size-16 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(91,71,224,0.08)' }}>
            <Target className="size-8" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No goals set yet</p>
          <p className="text-xs text-muted-foreground mb-5">
            {canEdit ? "Set a goal to track metric performance over time." : "No goals have been configured yet."}
          </p>
          {canEdit && (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
            >
              <Plus className="size-4" /> Create first goal
            </button>
          )}
        </motion.div>
      )}

      {/* Grid */}
      {!isLoading && progress.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {progress.map((gp, i) => (
            <GoalCard
              key={gp.goalId}
              gp={gp}
              canEdit={canEdit}
              onEdit={() => setEditTarget(gp)}
              onDelete={() => setDeleteTarget(gp)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {createOpen && (
          <GoalModal connectedPlatforms={connectedPlatforms} campaignId={campaignId!} clientId={clientId!} onClose={() => setCreateOpen(false)} />
        )}
        {editTarget && (
          <GoalModal initial={editTarget} connectedPlatforms={connectedPlatforms} campaignId={campaignId!} clientId={clientId!} onClose={() => setEditTarget(null)} />
        )}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" as const }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: '1px solid #ECECE6' }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#fb7185)' }} />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.10)' }}>
                    <AlertCircle className="size-5" style={{ color: '#f43f5e' }} />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground">Delete Goal?</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">This cannot be undone</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">"{deleteTarget.goal.name}"</span> will be permanently deleted.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setDeleteTarget(null)} className="h-9 px-4 rounded-xl text-sm font-semibold" style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}>Cancel</button>
                  <button
                    onClick={() => deleteMutation.mutate(deleteTarget.goalId)}
                    disabled={deleteMutation.isPending}
                    className="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#f43f5e,#fb7185)' }}
                  >
                    {deleteMutation.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
