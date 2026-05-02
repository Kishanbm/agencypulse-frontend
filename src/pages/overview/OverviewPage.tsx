import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Layers, Wifi, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { OverviewInsights } from './components/OverviewInsights';
import { OverviewKpis }     from './components/OverviewKpis';
import { OverviewRanking }  from './components/OverviewRanking';
import { OverviewHealth }   from './components/OverviewHealth';
import { OverviewClients }  from './components/OverviewClients';
import type { AgencyHealthResponse, CampaignRankingItem } from './overview.types';
import { getDateRange, DATE_PRESETS } from './overview.utils';

const TILE_CONFIG = [
  {
    key: 'clients',
    label: 'Active Clients',
    icon: Users,
    accentColor: '#5B47E0',
    iconBg: 'rgba(91,71,224,0.10)',
    gradient: 'linear-gradient(135deg,rgba(91,71,224,0.12),rgba(91,71,224,0.04))',
  },
  {
    key: 'campaigns',
    label: 'Campaigns',
    icon: Layers,
    accentColor: '#FF7A59',
    iconBg: 'rgba(255,122,89,0.10)',
    gradient: 'linear-gradient(135deg,rgba(255,122,89,0.12),rgba(255,122,89,0.04))',
  },
  {
    key: 'health',
    label: 'Integration Health',
    icon: Wifi,
    accentColor: '#10D9A0',
    iconBg: 'rgba(16,217,160,0.10)',
    gradient: 'linear-gradient(135deg,rgba(16,217,160,0.12),rgba(16,217,160,0.04))',
  },
  {
    key: 'integrations',
    label: 'Integrations',
    icon: Zap,
    accentColor: '#F5A524',
    iconBg: 'rgba(245,165,36,0.10)',
    gradient: 'linear-gradient(135deg,rgba(245,165,36,0.12),rgba(245,165,36,0.04))',
  },
] as const;

function ScorecardStrip() {
  const { data: health, isLoading: healthLoading } = useQuery<AgencyHealthResponse>({
    queryKey: ['overview', 'health'],
    queryFn:  () => api.get('/agencies/health').then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', 'list'],
    queryFn:  () => api.get('/clients?limit=50').then((r) => r.data?.data ?? r.data?.items ?? r.data),
    staleTime: 120_000,
  });

  const summary       = health?.summary;
  const atRiskCount   = (summary?.error ?? 0) + (summary?.expired ?? 0);
  const healthScore   = summary
    ? Math.round((summary.connected / Math.max(summary.totalIntegrations, 1)) * 100)
    : null;
  const activeClients = ((clients as { status: string }[]) ?? []).filter((c) => c.status === 'ACTIVE').length;

  const values: Record<string, { display: string; sub?: string; bad?: boolean } | null> = {
    clients:      clientsLoading ? null : { display: String(activeClients) },
    campaigns:    healthLoading  ? null : { display: String(summary?.totalCampaigns ?? 0) },
    health:       healthLoading  ? null : {
      display: healthScore !== null ? `${healthScore}%` : '—',
      sub:     atRiskCount > 0 ? `${atRiskCount} issue${atRiskCount > 1 ? 's' : ''}` : 'All healthy',
      bad:     atRiskCount > 0,
    },
    integrations: healthLoading  ? null : {
      display: String(summary?.connected ?? 0),
      sub:     `/ ${summary?.totalIntegrations ?? 0} total`,
    },
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {TILE_CONFIG.map(({ key, label, icon: Icon, accentColor, iconBg }, i) => {
        const val = values[key];
        const isHealth = key === 'health';
        const isBad = isHealth && val?.bad;
        const effectiveAccent = isBad ? '#f43f5e' : accentColor;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" as const }}
            className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow relative"
            style={{ border: '1px solid #ECECE6' }}
          >
            {/* Coloured top bar */}
            <div className="h-1 w-full" style={{ background: effectiveAccent }} />

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className="size-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: iconBg }}
                >
                  <Icon className="size-4" style={{ color: effectiveAccent }} />
                </div>

                {/* Values */}
                <div className="min-w-0 flex-1">
                  {val === null ? (
                    <div className="space-y-1.5">
                      <div className="h-6 w-14 animate-pulse rounded-lg bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </div>
                  ) : (
                    <>
                      <div
                        className="font-heading font-bold text-2xl tabular tracking-tight leading-none"
                        style={{ color: effectiveAccent }}
                      >
                        {val.display}
                      </div>
                      <div className="mt-1 text-xs font-medium text-muted-foreground truncate">{label}</div>
                      {val.sub && (
                        <div
                          className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold"
                          style={{ color: val.bad ? '#f43f5e' : '#10D9A0' }}
                        >
                          {val.bad
                            ? <TrendingDown className="size-2.5" />
                            : (key === 'health' ? <TrendingUp className="size-2.5" /> : null)
                          }
                          {val.sub}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function OverviewPage() {
  const [datePreset,    setDatePreset]    = useState('30d');
  const [rankingMetric, setRankingMetric] = useState('sessions');

  const { from, to } = useMemo(() => getDateRange(datePreset), [datePreset]);

  const { data: rankingForMap } = useQuery<CampaignRankingItem[]>({
    queryKey: ['overview', 'ranking', rankingMetric, from, to, 50, 'desc'],
    queryFn:  () =>
      api.get(`/agencies/me/campaigns/ranking?metric=${rankingMetric}&from=${from}&to=${to}&limit=50`).then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[1400px] mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-center justify-between gap-3 flex-wrap"
      >
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Overview</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">All campaigns, all channels, one view.</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDatePreset(p.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={
                datePreset === p.value
                  ? { background: 'white', color: '#5B47E0', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #ECECE6' }
                  : { color: 'var(--muted-foreground)', border: '1px solid transparent' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      <ScorecardStrip />

      <OverviewInsights from={from} to={to} rankingMetric={rankingMetric} />

      <OverviewKpis from={from} to={to} datePreset={datePreset} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <OverviewRanking from={from} to={to} metric={rankingMetric} onMetricChange={setRankingMetric} />
        <OverviewHealth rankingData={rankingForMap} />
      </div>

      <OverviewClients />
    </div>
  );
}
