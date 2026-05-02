import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, FileText, Home, ArrowRight,
  Wifi, WifiOff, Clock, Layers, ChevronLeft,
  CheckCircle2, TrendingUp, TrendingDown,
  Minus, CalendarClock, Sparkles, RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useBranding } from '@/contexts/BrandingContext';
import { useAuthStore } from '@/lib/store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortalClient {
  id: string;
  name: string;
  logoUrl: string | null;
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface PortalDashboard {
  id: string;
  name: string;
  isDefault: boolean;
  _count: { widgets: number };
}

interface PortalReport {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignHealth {
  summary: { total: number; connected: number; expired: number; error: number };
}

interface KpiCard {
  metricKey: string;
  label: string;
  format: 'number' | 'currency' | 'percent';
  current: number;
  delta: number | null;
}

interface PortalSummary {
  kpi: KpiCard[];
  nextReport: { reportName: string; nextRunAt: string; cronExpression: string } | null;
  aiNarrative: { snippet: string; generatedAt: string } | null;
  lastSyncAt: string | null;
}

interface GoalProgress {
  id: string;
  metricKey: string;
  targetValue: number;
  progress: number;
  status: 'ACHIEVED' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND';
}

type Tab = 'overview' | 'dashboards' | 'reports';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

function formatMetric(value: number, format: 'number' | 'currency' | 'percent'): string {
  if (format === 'currency') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }
  if (format === 'percent') return `${value.toFixed(1)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function cronToHuman(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return expr;
  const [min, hour, , , dow] = parts;
  const h = parseInt(hour, 10);
  const m = parseInt(min, 10);
  const timeStr = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (dow === '*') return `Daily at ${timeStr}`;
  if (!dow.includes(',')) {
    const dayName = days[parseInt(dow, 10)] ?? dow;
    return `Every ${dayName} at ${timeStr}`;
  }
  const dayNames = dow.split(',').map((d) => days[parseInt(d, 10)] ?? d).join(', ');
  return `Every ${dayNames} at ${timeStr}`;
}

const PLACEHOLDER_KPI: Array<{ key: string; label: string }> = [
  { key: 'sessions',    label: 'Sessions'    },
  { key: 'clicks',      label: 'Clicks'      },
  { key: 'impressions', label: 'Impressions' },
  { key: 'conversions', label: 'Conversions' },
];

// ─── KPI mini-cards ───────────────────────────────────────────────────────────

function KpiCards({ kpi, isLoading }: { kpi: KpiCard[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  if (kpi.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {PLACEHOLDER_KPI.map((p) => (
          <div key={p.key} className="rounded-xl px-3 py-2.5" style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{p.label}</p>
            <p className="text-base font-bold leading-none text-muted-foreground/40">—</p>
            <p className="mt-1 text-[10px] text-muted-foreground/50">No data yet</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
      {kpi.map((k) => (
        <div key={k.metricKey} className="rounded-xl px-3 py-2.5" style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{k.label}</p>
          <p className="text-base font-bold text-foreground leading-none">{formatMetric(k.current, k.format)}</p>
          {k.delta !== null && (
            <p
              className="mt-1 flex items-center gap-0.5 text-[11px] font-semibold"
              style={{ color: k.delta > 0 ? '#10D9A0' : k.delta < 0 ? '#f43f5e' : '#9CA3AF' }}
            >
              {k.delta > 0 ? <TrendingUp className="size-3" /> : k.delta < 0 ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
              {k.delta > 0 ? '+' : ''}{k.delta}%
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Goals summary strip ──────────────────────────────────────────────────────

function GoalsSummary({ goals, isLoading }: { goals: GoalProgress[]; isLoading: boolean }) {
  if (isLoading) return <div className="mt-3 h-8 rounded-xl bg-muted animate-pulse" />;
  if (goals.length === 0) return null;

  const achieved = goals.filter((g) => g.status === 'ACHIEVED').length;
  const onTrack  = goals.filter((g) => g.status === 'ON_TRACK').length;
  const atRisk   = goals.filter((g) => g.status === 'AT_RISK' || g.status === 'BEHIND').length;
  const avgPct   = Math.max(0, Math.min(100, Math.round(
    goals.reduce((s, g) => s + Math.min(100, Number(g.progress) || 0), 0) / goals.length,
  )));

  const barColor = avgPct >= 70 ? '#10D9A0' : avgPct >= 40 ? '#F5A524' : '#f43f5e';

  return (
    <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-foreground">Goals — {avgPct}% avg progress</p>
        <div className="flex items-center gap-2 text-[10px]">
          {achieved > 0 && <span className="font-semibold" style={{ color: '#10D9A0' }}>{achieved} achieved</span>}
          {onTrack > 0  && <span className="font-semibold" style={{ color: '#5B47E0' }}>{onTrack} on track</span>}
          {atRisk > 0   && <span className="font-semibold" style={{ color: '#F5A524' }}>{atRisk} at risk</span>}
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#ECECE6' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${avgPct}%`, background: barColor }} />
      </div>
    </div>
  );
}

// ─── Campaign card ────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  clientId,
  onNavigateDashboard,
  onNavigateReports,
  index,
}: {
  campaign: Campaign;
  clientId: string;
  onNavigateDashboard: (id: string) => void;
  onNavigateReports: () => void;
  index: number;
}) {
  const [aiExpanded, setAiExpanded] = useState(false);

  const { data: dashboards = [] } = useQuery<PortalDashboard[]>({
    queryKey: ['portal', 'dashboards', campaign.id],
    queryFn:  () => api.get(`/campaigns/${campaign.id}/dashboards`).then((r) =>
      Array.isArray(r.data) ? r.data : r.data?.data ?? [],
    ),
    staleTime: 120_000,
  });

  const { data: reports = [] } = useQuery<PortalReport[]>({
    queryKey: ['portal', 'reports', campaign.id],
    queryFn:  () => api.get(`/campaigns/${campaign.id}/reports`).then((r) =>
      Array.isArray(r.data) ? r.data : r.data?.data ?? [],
    ),
    staleTime: 120_000,
  });

  const { data: health } = useQuery<CampaignHealth>({
    queryKey: ['portal', 'health', clientId, campaign.id],
    queryFn:  () => api.get(`/clients/${clientId}/campaigns/${campaign.id}/health`).then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<PortalSummary>({
    queryKey: ['portal', 'summary', campaign.id],
    queryFn:  () => api.get(`/campaigns/${campaign.id}/portal-summary`).then((r) => r.data),
    staleTime: 120_000,
  });

  const { data: goalsRaw = [], isLoading: goalsLoading } = useQuery<GoalProgress[]>({
    queryKey: ['portal', 'goals', campaign.id],
    queryFn:  () =>
      api.get(`/clients/${clientId}/campaigns/${campaign.id}/goals/progress`)
        .then((r) => Array.isArray(r.data) ? r.data : r.data?.data ?? []),
    staleTime: 120_000,
    retry: false,
  });

  const defaultDashboard = dashboards.find((d) => d.isDefault) ?? dashboards[0];
  const h         = health?.summary;
  const hasIssue  = h && (h.error > 0 || h.expired > 0);
  const kpi       = summary?.kpi ?? [];
  const goals     = useMemo(() => goalsRaw.filter((g) => g.status !== undefined), [goalsRaw]);
  const isActive  = campaign.status === 'ACTIVE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: hasIssue ? '1px solid rgba(245,165,36,0.40)' : '1px solid #ECECE6' }}
    >
      <div className="h-0.5 w-full" style={{ background: hasIssue ? '#F5A524' : isActive ? '#10D9A0' : '#9CA3AF' }} />
      <div className="p-5 space-y-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{campaign.name}</h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {h ? (
                hasIssue ? (
                  <span className="flex items-center gap-1 font-medium" style={{ color: '#F5A524' }}>
                    <WifiOff className="size-3" />
                    {h.error + h.expired} integration issue{h.error + h.expired !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium" style={{ color: '#10D9A0' }}>
                    <CheckCircle2 className="size-3" />
                    {h.connected} platform{h.connected !== 1 ? 's' : ''} connected
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1">
                  <Wifi className="size-3" />
                  {dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''}
                </span>
              )}
              <span>·</span>
              <span>{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
              {summary?.lastSyncAt && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="size-2.5" />
                    {relativeTime(summary.lastSyncAt)}
                  </span>
                </>
              )}
            </div>
          </div>
          <span
            className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-xl shrink-0"
            style={
              isActive
                ? { background: 'rgba(16,217,160,0.10)', color: '#059669', border: '1px solid rgba(16,217,160,0.25)' }
                : { background: 'rgba(156,163,175,0.10)', color: '#6B7280', border: '1px solid rgba(156,163,175,0.20)' }
            }
          >
            {isActive ? 'Active' : (campaign.status?.toLowerCase() ?? 'inactive')}
          </span>
        </div>

        {/* KPI cards */}
        <KpiCards kpi={kpi} isLoading={summaryLoading} />

        {/* Goals progress */}
        {(goalsLoading || goals.length > 0) && (
          <GoalsSummary goals={goals} isLoading={goalsLoading} />
        )}

        {/* Next report badge */}
        {summary?.nextReport && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5 shrink-0" style={{ color: '#5B47E0' }} />
            <span>
              Next report:{' '}
              <span className="font-semibold text-foreground">{summary.nextReport.reportName}</span>
              {' · '}
              {cronToHuman(summary.nextReport.cronExpression).toLowerCase()}
            </span>
          </div>
        )}

        {/* AI narrative */}
        {summary?.aiNarrative && (
          <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(91,71,224,0.04)', border: '1px solid rgba(91,71,224,0.12)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="size-3.5 shrink-0" style={{ color: '#5B47E0' }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#5B47E0' }}>AI Performance Insight</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{relativeTime(summary.aiNarrative.generatedAt)}</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {aiExpanded
                ? summary.aiNarrative.snippet
                : summary.aiNarrative.snippet.substring(0, 140) +
                  (summary.aiNarrative.snippet.length > 140 ? '…' : '')}
            </p>
            {summary.aiNarrative.snippet.length > 140 && (
              <button
                onClick={() => setAiExpanded((v) => !v)}
                className="mt-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#5B47E0' }}
              >
                {aiExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-4 flex flex-wrap gap-2">
          {defaultDashboard ? (
            <button
              onClick={() => onNavigateDashboard(defaultDashboard.id)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
            >
              <LayoutDashboard className="size-3.5" />
              View Dashboard
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
              style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}
            >
              <LayoutDashboard className="size-3.5" />
              No dashboards yet
            </button>
          )}

          {reports.length > 0 ? (
            <button
              onClick={onNavigateReports}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
            >
              <FileText className="size-3.5" />
              View Reports
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
              style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}
            >
              <FileText className="size-3.5" />
              No reports yet
            </button>
          )}
        </div>

        {/* Additional dashboards as pills */}
        {dashboards.length > 1 && (
          <div className="pt-2 flex flex-wrap gap-1.5">
            {dashboards.slice(1).map((d) => (
              <button
                key={d.id}
                onClick={() => onNavigateDashboard(d.id)}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}
              >
                <LayoutDashboard className="size-2.5" />
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ clientId, campaigns, campaignsLoading }: { clientId: string; campaigns: Campaign[]; campaignsLoading: boolean }) {
  const navigate = useNavigate();

  if (campaignsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center" style={{ border: '1.5px dashed #ECECE6' }}>
        <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
          <Layers className="size-7" style={{ color: '#5B47E0' }} />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No campaigns yet</p>
        <p className="text-xs text-muted-foreground">Your agency will set up campaigns for you.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign, i) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          clientId={clientId}
          index={i}
          onNavigateDashboard={(id) => navigate(`/portal/${clientId}/campaigns/${campaign.id}/dashboards/${id}`)}
          onNavigateReports={() => navigate(`/portal/${clientId}/campaigns/${campaign.id}/reports`)}
        />
      ))}
    </div>
  );
}

// ─── Dashboards tab ───────────────────────────────────────────────────────────

function CampaignDashboards({ campaign, clientId, navigate }: { campaign: Campaign; clientId: string; navigate: (p: string) => void }) {
  const { data: dashboards = [], isLoading } = useQuery<PortalDashboard[]>({
    queryKey: ['portal', 'dashboards', campaign.id],
    queryFn:  () => api.get(`/campaigns/${campaign.id}/dashboards`).then((r) =>
      Array.isArray(r.data) ? r.data : r.data?.data ?? [],
    ),
    staleTime: 120_000,
  });

  if (!isLoading && dashboards.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{campaign.name}</p>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dashboards.map((d, i) => (
            <motion.button
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05, ease: "easeOut" as const }}
              onClick={() => navigate(`/portal/${clientId}/campaigns/${campaign.id}/dashboards/${d.id}`)}
              className="group bg-white rounded-2xl overflow-hidden text-left transition-shadow hover:shadow-md"
              style={{ border: '1px solid #ECECE6' }}
            >
              <div className="h-0.5 w-full" style={{ background: d.isDefault ? 'linear-gradient(90deg,#5B47E0,#10D9A0)' : '#ECECE6' }} />
              <div className="px-4 py-3.5 flex items-center gap-3">
                <div className="size-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
                  <LayoutDashboard className="size-4" style={{ color: '#5B47E0' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-foreground">{d.name}</p>
                    {d.isDefault && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-lg shrink-0" style={{ background: 'rgba(91,71,224,0.10)', color: '#5B47E0' }}>
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d._count.widgets} widget{d._count.widgets !== 1 ? 's' : ''}
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardsTab({ clientId, campaigns }: { clientId: string; campaigns: Campaign[] }) {
  const navigate = useNavigate();

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center" style={{ border: '1.5px dashed #ECECE6' }}>
        <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
          <LayoutDashboard className="size-7" style={{ color: '#5B47E0' }} />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No dashboards available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {campaigns.map((c) => (
        <CampaignDashboards key={c.id} campaign={c} clientId={clientId} navigate={navigate} />
      ))}
    </div>
  );
}

// ─── Reports tab ──────────────────────────────────────────────────────────────

function CampaignReports({ campaign, clientId, navigate }: { campaign: Campaign; clientId: string; navigate: (p: string) => void }) {
  const { data: reports = [], isLoading } = useQuery<PortalReport[]>({
    queryKey: ['portal', 'reports', campaign.id],
    queryFn:  () => api.get(`/campaigns/${campaign.id}/reports`).then((r) =>
      Array.isArray(r.data) ? r.data : r.data?.data ?? [],
    ),
    staleTime: 120_000,
  });

  if (!isLoading && reports.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{campaign.name}</p>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />
          <div className="divide-y" style={{ borderColor: '#ECECE6' }}>
            {reports.map((report, i) => (
              <motion.button
                key={report.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: i * 0.04, ease: "easeOut" as const }}
                onClick={() => navigate(`/portal/${clientId}/campaigns/${campaign.id}/reports/${report.id}`)}
                className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#FAFAF7]"
              >
                <div className="size-8 shrink-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(91,71,224,0.08)' }}>
                  <FileText className="size-4" style={{ color: '#5B47E0' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{report.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-2.5" />
                    Updated {relativeTime(report.updatedAt)}
                  </p>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsTab({ clientId, campaigns }: { clientId: string; campaigns: Campaign[] }) {
  const navigate = useNavigate();

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center" style={{ border: '1.5px dashed #ECECE6' }}>
        <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
          <FileText className="size-7" style={{ color: '#5B47E0' }} />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No reports available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {campaigns.map((c) => (
        <CampaignReports key={c.id} campaign={c} clientId={clientId} navigate={navigate} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PortalClientHome() {
  const { clientId }         = useParams<{ clientId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate             = useNavigate();
  const { branding }         = useBranding();
  const user                 = useAuthStore((s) => s.user);

  const activeTab = (searchParams.get('tab') as Tab) ?? 'overview';
  const setTab    = (t: Tab) => setSearchParams(t === 'overview' ? {} : { tab: t });
  const firstName = user?.firstName ?? user?.email?.split('@')[0] ?? 'there';

  const { data: client, isLoading: clientLoading } = useQuery<PortalClient>({
    queryKey: ['portal', 'client', clientId],
    queryFn:  () => api.get(`/clients/${clientId}`).then((r) => r.data),
    enabled:  !!clientId,
    staleTime: 120_000,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['portal', 'campaigns', clientId],
    queryFn:  () =>
      api.get(`/clients/${clientId}/campaigns`).then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.items ?? r.data?.data ?? [],
      ),
    enabled:  !!clientId,
    staleTime: 120_000,
  });

  const TABS = [
    { id: 'overview'   as Tab, label: 'Overview',   icon: Home            },
    { id: 'dashboards' as Tab, label: 'Dashboards', icon: LayoutDashboard },
    { id: 'reports'    as Tab, label: 'Reports',    icon: FileText        },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-12">
      {/* Branded hero header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED,#10D9A0)' }} />
        <div className="px-5 py-5">
          <button
            onClick={() => navigate('/portal')}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="size-3.5" />
            All clients
          </button>

          <div className="flex items-center gap-4">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.agencyName}
                className="size-12 rounded-xl object-cover shrink-0"
                style={{ border: '1px solid #ECECE6' }}
              />
            ) : (
              <div
                className="size-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
              >
                {branding.agencyName.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              {clientLoading ? (
                <div className="space-y-1.5">
                  <div className="h-5 w-40 rounded-lg bg-muted animate-pulse" />
                  <div className="h-3.5 w-56 rounded-lg bg-muted animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="font-heading font-bold text-xl tracking-tight text-foreground truncate">
                    {client?.name ?? 'Your Dashboard'}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Welcome back, {firstName} — here's your latest performance data
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quick stats strip */}
          {!campaignsLoading && campaigns.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-2.5 py-1.5 rounded-xl" style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}>
                <Layers className="size-3" />
                {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-2.5 py-1.5 rounded-xl" style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}>
                <LayoutDashboard className="size-3" />
                Dashboards available
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-2.5 py-1.5 rounded-xl" style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}>
                <FileText className="size-3" />
                Reports available
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tab navigation */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" as const }}
        className="flex gap-1 p-1 rounded-2xl w-fit"
        style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={
              activeTab === id
                ? { background: 'white', color: '#5B47E0', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #ECECE6' }
                : { color: 'var(--muted-foreground)', border: '1px solid transparent' }
            }
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" as const }}
        >
          {activeTab === 'overview' && (
            <OverviewTab clientId={clientId!} campaigns={campaigns} campaignsLoading={campaignsLoading} />
          )}
          {activeTab === 'dashboards' && (
            <DashboardsTab clientId={clientId!} campaigns={campaigns} />
          )}
          {activeTab === 'reports' && (
            <ReportsTab clientId={clientId!} campaigns={campaigns} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
