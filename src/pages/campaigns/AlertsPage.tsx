import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Bell, ChevronDown, ChevronRight, Trash2, Edit2, AlertCircle, X,
  Zap, Clock, Users, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import { hasRole } from "@/lib/rbac";
import { useConnectedPlatforms } from "@/hooks/useConnectedPlatforms";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import type { Alert, AlertCondition, AlertSeverity, AlertPeriodType, AlertEvent } from "@/types/alerts";
import type { IntegrationPlatform } from "@/types/dashboard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; label: string; barColor: string }> = {
  INFO:     { color: '#5B47E0', bg: 'rgba(91,71,224,0.10)',   label: 'Info',     barColor: '#5B47E0' },
  WARNING:  { color: '#d97706', bg: 'rgba(245,165,36,0.10)',  label: 'Warning',  barColor: '#F5A524' },
  CRITICAL: { color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',   label: 'Critical', barColor: '#f43f5e' },
};

const CONDITION_LABELS: Record<AlertCondition, string> = {
  ABOVE: "above",
  BELOW: "below",
  PERCENT_CHANGE_ABOVE: "% change ↑ above",
  PERCENT_CHANGE_BELOW: "% change ↓ below",
};

function conditionSummary(alert: Alert): string {
  const cond = CONDITION_LABELS[alert.condition] ?? alert.condition;
  const period = alert.periodType.toLowerCase();
  return `${alert.metricKey} ${cond} ${alert.threshold} (${period})`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmails(raw: string): { emails: string[]; error: string | null } {
  const emails = raw.split(/[,\n]+/).map((e) => e.trim()).filter(Boolean);
  if (emails.length === 0) return { emails: [], error: "At least one recipient email is required" };
  if (emails.length > 20) return { emails, error: "Maximum 20 emails" };
  const invalid = emails.find((e) => !EMAIL_RE.test(e));
  if (invalid) return { emails, error: `Invalid email: ${invalid}` };
  return { emails, error: null };
}

// ─── Input helpers ────────────────────────────────────────────────────────────

function inputFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}

const inputBase = "w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white";
const inputStyle = { border: '1px solid #ECECE6' };

// ─── Alert form modal ─────────────────────────────────────────────────────────

interface AlertFormState {
  name: string;
  platform: IntegrationPlatform | "";
  metricKey: string;
  condition: AlertCondition;
  threshold: string;
  periodType: AlertPeriodType;
  severity: AlertSeverity;
  recipientEmails: string;
  cooldownHours: string;
}

function AlertModal({
  initial,
  connectedPlatforms,
  campaignId,
  clientId,
  onClose,
}: {
  initial?: Alert;
  connectedPlatforms: IntegrationPlatform[];
  campaignId: string;
  clientId: string;
  onClose: () => void;
}) {
  const api = getApiClient();
  const qc = useQueryClient();

  const [form, setForm] = useState<AlertFormState>({
    name: initial?.name ?? "",
    platform: (initial?.platform as IntegrationPlatform) ?? "",
    metricKey: initial?.metricKey ?? "",
    condition: initial?.condition ?? "ABOVE",
    threshold: String(initial?.threshold ?? ""),
    periodType: initial?.periodType ?? "DAILY",
    severity: initial?.severity ?? "WARNING",
    recipientEmails: initial?.recipientEmails.join(", ") ?? "",
    cooldownHours: initial?.cooldownHours != null ? String(initial.cooldownHours) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { metrics, isLoading: metricsLoading } = useMetricDefinitions(
    form.platform ? (form.platform as IntegrationPlatform) : undefined,
  );

  const isEditing = !!initial;

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.platform) { setError("Platform is required"); return; }
    if (!form.metricKey) { setError("Metric is required"); return; }
    const thresholdNum = parseFloat(form.threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) { setError("Threshold must be >= 0"); return; }
    const cooldown = form.cooldownHours !== "" ? parseInt(form.cooldownHours, 10) : undefined;
    if (cooldown !== undefined && (isNaN(cooldown) || cooldown < 1 || cooldown > 168)) {
      setError("Cooldown hours must be between 1 and 168"); return;
    }
    const { emails, error: emailError } = validateEmails(form.recipientEmails);
    if (emailError) { setError(emailError); return; }

    setError(null);
    setSaving(true);
    const body = {
      name: form.name.trim(),
      platform: form.platform,
      metricKey: form.metricKey,
      condition: form.condition,
      threshold: thresholdNum,
      periodType: form.periodType,
      severity: form.severity,
      recipientEmails: emails,
      ...(cooldown !== undefined ? { cooldownHours: cooldown } : {}),
    };

    try {
      if (isEditing) {
        await api.patch(`/clients/${clientId}/campaigns/${campaignId}/alerts/${initial.id}`, body);
        toast.success("Alert updated");
      } else {
        await api.post(`/clients/${clientId}/campaigns/${campaignId}/alerts`, body);
        toast.success("Alert created");
      }
      qc.invalidateQueries({ queryKey: ["alerts", clientId, campaignId] });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to save alert");
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
        {/* Gradient top bar */}
        <div
          className="h-1 w-full shrink-0"
          style={{ background: 'linear-gradient(90deg,#5B47E0,#FF7A59)' }}
        />

        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #F5F5F0' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="size-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(91,71,224,0.10)' }}
            >
              <Bell className="size-4" style={{ color: '#5B47E0' }} />
            </div>
            <h2 className="font-heading font-bold text-base text-foreground">
              {isEditing ? "Edit Alert" : "Create Alert"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)' }}
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Alert Name</label>
            <input
              autoFocus
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Sessions drop alert"
              className={inputBase}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
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
                  <button
                    key={p.id}
                    type="button"
                    disabled={!isConnected}
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
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={
                        isConnected
                          ? { background: 'rgba(16,217,160,0.12)', color: '#10D9A0' }
                          : { background: 'rgba(0,0,0,0.06)', color: '#9CA3AF' }
                      }
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
                <select
                  value={form.metricKey}
                  onChange={(e) => setForm((p) => ({ ...p, metricKey: e.target.value }))}
                  className={inputBase}
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                >
                  <option value="">Select metric…</option>
                  {metrics.map((m) => (
                    <option key={m.metricKey} value={m.metricKey}>{m.label}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Condition + threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value as AlertCondition }))}
                className={inputBase}
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
              >
                <option value="ABOVE">Above</option>
                <option value="BELOW">Below</option>
                <option value="PERCENT_CHANGE_ABOVE">% Change Above</option>
                <option value="PERCENT_CHANGE_BELOW">% Change Below</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Threshold</label>
              <input
                type="number"
                min={0}
                step="any"
                value={form.threshold}
                onChange={(e) => setForm((p) => ({ ...p, threshold: e.target.value }))}
                placeholder="0"
                className={inputBase}
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </div>
          </div>

          {/* Period + Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Period</label>
              <div className="flex gap-1.5">
                {(["DAILY", "WEEKLY"] as AlertPeriodType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, periodType: t }))}
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
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Severity</label>
              <div className="flex gap-1">
                {(["INFO", "WARNING", "CRITICAL"] as AlertSeverity[]).map((s) => {
                  const sc = SEVERITY_CONFIG[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, severity: s }))}
                      className="flex-1 py-2.5 text-[10px] font-bold rounded-xl transition-all"
                      style={
                        form.severity === s
                          ? { background: sc.bg, border: `1px solid ${sc.color}40`, color: sc.color }
                          : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Recipients</label>
            <textarea
              value={form.recipientEmails}
              onChange={(e) => setForm((p) => ({ ...p, recipientEmails: e.target.value }))}
              placeholder="email@example.com, another@example.com"
              rows={2}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all resize-none bg-white"
              style={inputStyle}
              onFocus={inputFocus as any}
              onBlur={inputBlur as any}
            />
          </div>

          {/* Cooldown */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
              Cooldown hours <span className="normal-case font-normal">— optional, 1–168</span>
            </label>
            <input
              type="number"
              min={1}
              max={168}
              value={form.cooldownHours}
              onChange={(e) => setForm((p) => ({ ...p, cooldownHours: e.target.value }))}
              placeholder="e.g. 24"
              className="w-32 px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white"
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}
            >
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid #F5F5F0', background: 'rgba(0,0,0,0.01)' }}
        >
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-sm font-semibold transition-colors"
            style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
          >
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Alert"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({ alert, onConfirm, onClose, deleting }: {
  alert: Alert; onConfirm: () => void; onClose: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
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
              <h2 className="font-heading font-bold text-base text-foreground">Delete Alert?</h2>
              <p className="text-xs text-muted-foreground mt-0.5">This cannot be undone</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">"{alert.name}"</span> will be permanently deleted.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-sm font-semibold transition-colors"
              style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#fb7185)' }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Alert card ────────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  isActive,
  isExpanded,
  events,
  limit,
  loadingEvents,
  canEdit,
  onToggle,
  onExpand,
  onEdit,
  onDelete,
  onLoadMore,
  index,
}: {
  alert: Alert;
  isActive: boolean;
  isExpanded: boolean;
  events: AlertEvent[];
  limit: number;
  loadingEvents: boolean;
  canEdit: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLoadMore: () => void;
  index: number;
}) {
  const sc = SEVERITY_CONFIG[alert.severity];
  const shownEvents = events.slice(0, limit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${isActive ? sc.color + '30' : '#ECECE6'}`,
        boxShadow: isActive ? `0 0 0 3px ${sc.color}08` : undefined,
      }}
    >
      {/* Severity top strip */}
      <div className="h-0.5 w-full" style={{ background: isActive ? sc.barColor : 'rgba(0,0,0,0.06)' }} />

      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Expand button */}
        <button
          onClick={onExpand}
          className="size-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
          style={{ background: isExpanded ? 'rgba(91,71,224,0.08)' : 'rgba(0,0,0,0.04)', color: isExpanded ? '#5B47E0' : 'var(--muted-foreground)' }}
        >
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{alert.name}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: sc.bg, color: sc.color }}
            >
              {sc.label}
            </span>
            {!isActive && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.06)', color: '#9CA3AF' }}
              >
                Paused
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{conditionSummary(alert)}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
            {alert.lastFiredAt && (
              <span className="flex items-center gap-1">
                <Zap className="size-3" style={{ color: sc.color }} />
                Last fired {timeAgo(alert.lastFiredAt)}
              </span>
            )}
            {alert.cooldownHours != null && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {alert.cooldownHours}h cooldown
              </span>
            )}
            {alert.recipientEmails?.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {alert.recipientEmails.length} recipient{alert.recipientEmails.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={onToggle}
          className="relative w-11 h-6 rounded-full transition-colors shrink-0"
          style={{ background: isActive ? '#10D9A0' : 'rgba(0,0,0,0.12)' }}
          title={isActive ? "Pause alert" : "Resume alert"}
        >
          <span
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
            style={{ left: isActive ? '26px' : '4px' }}
          />
        </button>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onEdit}
              className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Edit2 className="size-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="size-7 rounded-lg flex items-center justify-center text-muted-foreground transition-all"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#f43f5e'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = ''; }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded history */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            style={{ borderTop: '1px solid #F5F5F0', overflow: 'hidden' }}
          >
            <div className="px-4 py-4 space-y-3" style={{ background: 'rgba(0,0,0,0.01)' }}>
              <p
                className="text-[11px] uppercase tracking-widest font-semibold"
                style={{ color: '#9CA3AF' }}
              >
                Fire History
              </p>
              {loadingEvents ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-7 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <p className="text-xs text-muted-foreground">No events recorded yet.</p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {shownEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
                        style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}
                      >
                        <span className="text-muted-foreground">
                          {new Date(ev.firedAt).toLocaleString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                            hour: "numeric", minute: "2-digit",
                          })}
                        </span>
                        <span
                          className="font-mono font-semibold"
                          style={{ color: sc.color }}
                        >
                          {ev.value} <span className="text-muted-foreground font-normal">/ {ev.threshold}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {events.length > limit && (
                    <button
                      onClick={onLoadMore}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: '#5B47E0' }}
                    >
                      Load more ({events.length - limit} remaining)
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const api = getApiClient();
  const qc = useQueryClient();
  const role = useRole();
  const canEdit = hasRole(role, "AGENCY_ADMIN");

  const { connectedPlatforms } = useConnectedPlatforms(clientId, campaignId);

  const [localActiveStates, setLocalActiveStates] = useState<Map<string, boolean>>(new Map());
  const pendingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [alertEvents, setAlertEvents] = useState<Map<string, AlertEvent[]>>(new Map());
  const [alertEventLimits, setAlertEventLimits] = useState<Map<string, number>>(new Map());
  const [loadingEvents, setLoadingEvents] = useState<Set<string>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Alert | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Alert | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timers = pendingTimers.current;
    return () => { timers.forEach(clearTimeout); };
  }, []);

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["alerts", clientId, campaignId],
    queryFn: async () => {
      const res = await api.get<Alert[]>(`/clients/${clientId}/campaigns/${campaignId}/alerts`);
      return res.data;
    },
    enabled: !!clientId && !!campaignId,
  });

  const handleToggle = (alertId: string, currentActive: boolean) => {
    const newActive = !currentActive;
    setLocalActiveStates((prev) => new Map(prev).set(alertId, newActive));
    const existing = pendingTimers.current.get(alertId);
    if (existing) clearTimeout(existing);
    pendingTimers.current.set(
      alertId,
      setTimeout(() => {
        pendingTimers.current.delete(alertId);
        api
          .patch(`/clients/${clientId}/campaigns/${campaignId}/alerts/${alertId}`, { isActive: newActive })
          .then(() => qc.invalidateQueries({ queryKey: ["alerts", clientId, campaignId] }))
          .catch(() => {
            setLocalActiveStates((prev) => { const m = new Map(prev); m.delete(alertId); return m; });
            toast.error("Failed to update alert");
          });
      }, 400),
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/clients/${clientId}/campaigns/${campaignId}/alerts/${deleteTarget.id}`);
      qc.invalidateQueries({ queryKey: ["alerts", clientId, campaignId] });
      setDeleteTarget(null);
      toast.success("Alert deleted");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to delete alert");
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpand = async (alertId: string) => {
    if (expandedAlerts.has(alertId)) {
      setExpandedAlerts((prev) => { const s = new Set(prev); s.delete(alertId); return s; });
      return;
    }
    setExpandedAlerts((prev) => new Set(prev).add(alertId));
    if (!alertEvents.has(alertId)) {
      setLoadingEvents((prev) => new Set(prev).add(alertId));
      try {
        const res = await api.get<AlertEvent[]>(
          `/clients/${clientId}/campaigns/${campaignId}/alerts/${alertId}/events`,
        );
        setAlertEvents((prev) => new Map(prev).set(alertId, res.data));
      } catch {
        toast.error("Failed to load alert history");
      } finally {
        setLoadingEvents((prev) => { const s = new Set(prev); s.delete(alertId); return s; });
      }
    }
  };

  const activeCount = alerts.filter((a) => {
    const local = localActiveStates.get(a.id);
    return local !== undefined ? local : a.isActive;
  }).length;

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
        <span className="text-foreground font-semibold">Alerts</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,165,36,0.12)' }}
          >
            <Bell className="size-5" style={{ color: '#F5A524' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">
              Alerts
              {alerts.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({alerts.length})</span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeCount > 0
                ? `${activeCount} active alert${activeCount > 1 ? 's' : ''} monitoring your metrics`
                : "Get notified when metrics cross thresholds"}
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)', boxShadow: '0 2px 8px rgba(91,71,224,0.30)' }}
          >
            <Plus className="size-4" />
            New Alert
          </button>
        )}
      </motion.div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[80px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && alerts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 text-center"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div
            className="mb-4 size-16 flex items-center justify-center rounded-2xl"
            style={{ background: 'rgba(245,165,36,0.10)' }}
          >
            <Bell className="size-8" style={{ color: '#F5A524' }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No alerts yet</p>
          <p className="text-xs text-muted-foreground mb-5">
            {canEdit
              ? "Create one to get notified when metrics cross thresholds."
              : "No alerts have been configured for this campaign."}
          </p>
          {canEdit && (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
            >
              <Plus className="size-4" />
              Create first alert
            </button>
          )}
        </motion.div>
      )}

      {/* Alerts list */}
      {!isLoading && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const isActive = localActiveStates.has(alert.id)
              ? localActiveStates.get(alert.id)!
              : alert.isActive;
            const isExpanded = expandedAlerts.has(alert.id);
            const events = alertEvents.get(alert.id) ?? [];
            const limit = alertEventLimits.get(alert.id) ?? 20;

            return (
              <AlertCard
                key={alert.id}
                alert={alert}
                isActive={isActive}
                isExpanded={isExpanded}
                events={events}
                limit={limit}
                loadingEvents={loadingEvents.has(alert.id)}
                canEdit={canEdit}
                onToggle={() => handleToggle(alert.id, isActive)}
                onExpand={() => toggleExpand(alert.id)}
                onEdit={() => setEditTarget(alert)}
                onDelete={() => setDeleteTarget(alert)}
                onLoadMore={() => setAlertEventLimits((prev) => new Map(prev).set(alert.id, limit + 20))}
                index={index}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {createOpen && (
          <AlertModal
            connectedPlatforms={connectedPlatforms}
            campaignId={campaignId!}
            clientId={clientId!}
            onClose={() => setCreateOpen(false)}
          />
        )}
        {editTarget && (
          <AlertModal
            initial={editTarget}
            connectedPlatforms={connectedPlatforms}
            campaignId={campaignId!}
            clientId={clientId!}
            onClose={() => setEditTarget(null)}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            alert={deleteTarget}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
