import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  XCircle, Clock, TrendingDown, TrendingUp,
  WifiOff, ShieldAlert, ArrowRight, Lightbulb,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import type {
  AgencyHealthResponse, CampaignRankingItem,
  Insight, InsightSeverity,
} from '../overview.types';
import { METRIC_LABELS } from '../overview.utils';

const SEVERITY_ORDER: Record<InsightSeverity, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };

const SEVERITY_STYLES: Record<InsightSeverity, {
  barColor: string; cardBg: string; cardBorder: string;
  iconBg: string; iconColor: string;
  badgeBg: string; badgeColor: string; label: string;
}> = {
  CRITICAL: {
    barColor:    '#f43f5e',
    cardBg:      'rgba(244,63,94,0.03)',
    cardBorder:  'rgba(244,63,94,0.15)',
    iconBg:      'rgba(244,63,94,0.10)',
    iconColor:   '#f43f5e',
    badgeBg:     'rgba(244,63,94,0.10)',
    badgeColor:  '#f43f5e',
    label:       'Critical',
  },
  WARNING: {
    barColor:    '#F5A524',
    cardBg:      'rgba(245,165,36,0.03)',
    cardBorder:  'rgba(245,165,36,0.18)',
    iconBg:      'rgba(245,165,36,0.10)',
    iconColor:   '#d97706',
    badgeBg:     'rgba(245,165,36,0.12)',
    badgeColor:  '#d97706',
    label:       'Warning',
  },
  INFO: {
    barColor:    '#10D9A0',
    cardBg:      'rgba(16,217,160,0.03)',
    cardBorder:  'rgba(16,217,160,0.18)',
    iconBg:      'rgba(16,217,160,0.12)',
    iconColor:   '#10D9A0',
    badgeBg:     'rgba(16,217,160,0.12)',
    badgeColor:  '#10D9A0',
    label:       'Info',
  },
};

function buildInsights(
  health: AgencyHealthResponse | undefined,
  ranking: CampaignRankingItem[] | undefined,
  rankingMetric: string,
): Insight[] {
  const insights: Insight[] = [];
  const metricLabel = METRIC_LABELS[rankingMetric]?.label ?? rankingMetric;
  const campaignClientMap = new Map<string, string>();
  for (const item of ranking ?? []) campaignClientMap.set(item.campaignId, item.clientId);

  for (const c of health?.campaigns ?? []) {
    if (c.errorCount > 0) {
      const clientId = campaignClientMap.get(c.campaignId);
      insights.push({
        id: `health-error-${c.campaignId}`, severity: 'CRITICAL', icon: XCircle,
        title: `Integration error — ${c.campaignName}`,
        description: `${c.errorCount} integration${c.errorCount > 1 ? 's' : ''} stopped working in ${c.clientName}. Data may be stale.`,
        actionLabel: 'Fix now',
        actionPath: clientId ? `/clients/${clientId}/campaigns/${c.campaignId}/integrations` : '/clients',
      });
    }
  }
  for (const c of health?.campaigns ?? []) {
    if (c.expiredCount > 0) {
      const clientId = campaignClientMap.get(c.campaignId);
      insights.push({
        id: `health-expired-${c.campaignId}`, severity: 'CRITICAL', icon: Clock,
        title: `Token expired — ${c.campaignName}`,
        description: `${c.expiredCount} integration${c.expiredCount > 1 ? 's' : ''} need re-authorization in ${c.clientName}.`,
        actionLabel: 'Re-authorize',
        actionPath: clientId ? `/clients/${clientId}/campaigns/${c.campaignId}/integrations` : '/clients',
      });
    }
  }
  for (const item of ranking ?? []) {
    if (item.delta !== null && item.delta < -30) {
      insights.push({
        id: `drop-critical-${item.campaignId}`, severity: 'CRITICAL', icon: ShieldAlert,
        title: `${metricLabel} collapsed in ${item.campaignName}`,
        description: `Down ${Math.abs(item.delta).toFixed(1)}% vs prior period. Client: ${item.clientName}.`,
        actionLabel: 'View campaign',
        actionPath: `/clients/${item.clientId}/campaigns/${item.campaignId}`,
      });
    }
  }
  for (const item of ranking ?? []) {
    if (item.delta !== null && item.delta <= -10 && item.delta >= -30) {
      insights.push({
        id: `drop-warning-${item.campaignId}`, severity: 'WARNING', icon: TrendingDown,
        title: `${metricLabel} declining — ${item.campaignName}`,
        description: `Down ${Math.abs(item.delta).toFixed(1)}% vs prior period. Client: ${item.clientName}.`,
        actionLabel: 'View campaign',
        actionPath: `/clients/${item.clientId}/campaigns/${item.campaignId}`,
      });
    }
  }
  const summary = health?.summary;
  if (summary && summary.totalCampaigns > 0 && summary.connected === 0) {
    insights.push({
      id: 'no-integrations', severity: 'WARNING', icon: WifiOff,
      title: 'No integrations connected',
      description: `You have ${summary.totalCampaigns} campaign${summary.totalCampaigns > 1 ? 's' : ''} but no data sources connected.`,
      actionLabel: 'Connect data', actionPath: '/clients',
    });
  }
  for (const item of ranking ?? []) {
    if (item.delta !== null && item.delta > 20) {
      insights.push({
        id: `gain-${item.campaignId}`, severity: 'INFO', icon: TrendingUp,
        title: `${metricLabel} up ${item.delta.toFixed(1)}% — ${item.campaignName}`,
        description: `Strong growth for ${item.clientName}. Great candidate for a case study.`,
        actionLabel: 'View campaign',
        actionPath: `/clients/${item.clientId}/campaigns/${item.campaignId}`,
      });
    }
  }
  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, 8);
}

interface Props { from: string; to: string; rankingMetric: string; }

export function OverviewInsights({ from, to, rankingMetric }: Props) {
  const navigate = useNavigate();

  const { data: health } = useQuery<AgencyHealthResponse>({
    queryKey: ['overview', 'health'],
    queryFn:  () => api.get('/agencies/health').then((r) => r.data),
    staleTime: 30_000, refetchInterval: 60_000,
  });
  const { data: ranking } = useQuery<CampaignRankingItem[]>({
    queryKey: ['overview', 'ranking', rankingMetric, from, to, 50, 'desc'],
    queryFn:  () => api.get(`/agencies/me/campaigns/ranking?metric=${rankingMetric}&from=${from}&to=${to}&limit=50`).then((r) => r.data),
    staleTime: 60_000,
  });

  const insights = useMemo(() => buildInsights(health, ranking, rankingMetric), [health, ranking, rankingMetric]);
  if (insights.length === 0) return null;

  const criticalCount = insights.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount  = insights.filter((i) => i.severity === 'WARNING').length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div
          className="size-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(91,71,224,0.10)' }}
        >
          <Lightbulb className="size-3.5" style={{ color: '#5B47E0' }} />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Intelligence</h2>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
              style={{ background: '#f43f5e' }}
            >
              {criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
              style={{ background: '#F5A524' }}
            >
              {warningCount}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight, i) => {
          const s    = SEVERITY_STYLES[insight.severity];
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="relative flex gap-3 rounded-2xl p-4 overflow-hidden hover:shadow-md transition-shadow"
              style={{
                background: s.cardBg,
                border: `1px solid ${s.cardBorder}`,
              }}
            >
              {/* Left accent bar — 4px bold */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ background: s.barColor }}
              />

              <div
                className="size-9 shrink-0 rounded-xl flex items-center justify-center ml-1"
                style={{ background: s.iconBg }}
              >
                <Icon className="size-4" style={{ color: s.iconColor }} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1 flex-1">
                    {insight.title}
                  </p>
                  <span
                    className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ background: s.badgeBg, color: s.badgeColor }}
                  >
                    {s.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {insight.description}
                </p>
                {insight.actionLabel && insight.actionPath && (
                  <button
                    onClick={() => navigate(insight.actionPath!)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline underline-offset-2"
                    style={{ color: s.iconColor }}
                  >
                    {insight.actionLabel}
                    <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
