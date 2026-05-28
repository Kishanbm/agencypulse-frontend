import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import type { AgencyMetricsSummaryResult } from '../overview.types';
import { formatNumber, formatCurrency, KPI_DISPLAY_KEYS, METRIC_LABELS, DATE_PRESETS } from '../overview.utils';

const KPI_ACCENT_COLORS = ['#5B47E0', '#FF7A59', '#10D9A0', '#F5A524'];

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
        <Minus className="size-3" />—
      </span>
    );
  }
  const up = delta >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
      style={up
        ? { background: 'rgba(16,217,160,0.12)', color: '#10D9A0' }
        : { background: 'rgba(244,63,94,0.10)', color: '#f43f5e' }
      }
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

function KpiCard({ label, value, delta, prior, isCurrency, index }: {
  label: string; value: number; delta: number | null; prior: number | null;
  isCurrency?: boolean; index: number;
}) {
  const formatted  = isCurrency ? formatCurrency(value) : formatNumber(value);
  const priorFmt   = prior !== null ? (isCurrency ? formatCurrency(prior) : formatNumber(prior)) : null;
  const accentColor = KPI_ACCENT_COLORS[index % KPI_ACCENT_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" as const }}
      className="bg-white rounded-sm overflow-hidden hover:shadow-md transition-all relative"
      style={{ border: `1px solid #E5E7EB` }}
    >
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 truncate">{label}</p>
        <p
          className="mt-1.5 font-heading font-bold text-xl sm:text-2xl tabular tracking-tight"
          style={{ color: accentColor }}
        >
          {formatted}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          <DeltaBadge delta={delta} />
          {priorFmt && (
            <span className="text-[10px] text-muted-foreground">vs {priorFmt}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-sm overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
      <div className="p-4 space-y-2">
        <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-14 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

interface Props { from: string; to: string; datePreset: string; }

export function OverviewKpis({ from, to, datePreset }: Props) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<AgencyMetricsSummaryResult>({
    queryKey: ['overview', 'metrics-summary', from, to],
    queryFn:  () => api.get(`/agencies/me/metrics/summary?from=${from}&to=${to}`).then((r) => r.data),
    staleTime: 60_000,
  });

  const kpiItems = KPI_DISPLAY_KEYS
    .map((key) => ({ key, meta: METRIC_LABELS[key] ?? { label: key }, data: data?.metrics[key] ?? null }))
    .filter((m) => m.data !== null);

  const presetLabel = DATE_PRESETS.find((p) => p.value === datePreset)?.label ?? datePreset;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Aggregated Metrics</h2>
          <span className="text-xs text-muted-foreground">· {presetLabel}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      ) : kpiItems.length === 0 ? (
        <div className="bg-white rounded-sm py-14 text-center px-4" style={{ border: '1px solid #E5E7EB' }}>
          <div
            className="mx-auto mb-3 size-12 rounded-sm flex items-center justify-center"
            style={{ background: 'rgba(91,71,224,0.08)' }}
          >
            <Activity className="size-6" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-sm font-semibold text-foreground">No metric data yet</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            Connect integrations and sync data to see aggregated metrics here.
          </p>
          <button
            onClick={() => navigate('/clients')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
          >
            Go to Clients
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {kpiItems.map(({ key, meta, data: d }, i) => (
            <KpiCard
              key={key}
              label={meta.label}
              value={d!.value}
              delta={d!.delta}
              prior={d!.prior}
              isCurrency={(meta as { currency?: boolean }).currency}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
