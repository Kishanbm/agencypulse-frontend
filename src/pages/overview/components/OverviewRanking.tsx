import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTip,
} from 'recharts';
import type { CampaignRankingItem } from '../overview.types';
import { formatNumber, formatCurrency, RANKING_METRICS } from '../overview.utils';

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return (
    <span className="text-[11px] text-white/40 flex items-center gap-0.5">
      <Minus className="size-3" />—
    </span>
  );
  const up = delta >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
      style={{ color: up ? '#10D9A0' : '#f43f5e' }}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

const MEDALS = [
  { bg: 'rgba(245,165,36,0.18)', color: '#d97706' },
  { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
];

type Order = 'desc' | 'asc';

function MetricSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = RANKING_METRICS.find((m) => m.value === value)?.label ?? value;

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-medium"
        style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)', color: '#fff' }}
      >
        {label}
        <ChevronDown className="size-3 opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' as const }}
            className="absolute right-0 top-full mt-1.5 z-50 min-w-[130px] rounded-xl overflow-hidden bg-white py-1"
            style={{ border: '1px solid #ECECE6', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
          >
            {RANKING_METRICS.map((m) => (
              <button
                key={m.value}
                onClick={() => { onChange(m.value); setOpen(false); }}
                className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-muted/40 transition-colors"
                style={{ color: m.value === value ? '#5B47E0' : 'var(--foreground)', fontWeight: m.value === value ? 700 : undefined }}
              >
                {m.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props { from: string; to: string; metric: string; onMetricChange: (m: string) => void; }

export function OverviewRanking({ from, to, metric, onMetricChange }: Props) {
  const navigate   = useNavigate();
  const [order, setOrder] = useState<Order>('desc');
  const isBottom   = order === 'asc';
  const isCurrency = metric === 'cost' || metric === 'revenue';
  const metricLabel = RANKING_METRICS.find((m) => m.value === metric)?.label ?? metric;

  const { data: ranking, isLoading } = useQuery<CampaignRankingItem[]>({
    queryKey: ['overview', 'ranking', metric, from, to, 10, order],
    queryFn:  () => api.get(`/agencies/me/campaigns/ranking?metric=${metric}&from=${from}&to=${to}&limit=10&order=${order}`).then((r) => r.data),
    staleTime: 60_000,
  });

  const chartData = (ranking ?? []).map((r) => ({
    name:  r.campaignName.length > 12 ? `${r.campaignName.slice(0, 10)}…` : r.campaignName,
    value: r.value,
  }));

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ border: '1px solid #ECECE6' }}>
      {/* Dark header */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ background: '#0F0D1F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Trophy className="size-4" style={{ color: isBottom ? '#f43f5e' : '#F5A524' }} />
            <h3 className="font-heading font-semibold text-sm text-white">Campaign Ranking</h3>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex rounded-xl p-0.5"
              style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.05)' }}
            >
              {(['desc', 'asc'] as Order[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setOrder(o)}
                  className="rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                  style={order === o
                    ? { background: 'rgba(255,255,255,0.12)', color: '#fff' }
                    : { color: 'rgba(255,255,255,0.45)' }
                  }
                >
                  {o === 'desc' ? 'Top' : 'Bottom'}
                </button>
              ))}
            </div>
            <MetricSelect value={metric} onChange={onMetricChange} />
          </div>
        </div>
        <p className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {isBottom ? `Lowest ${metricLabel} — identify underperformers` : `Top ${metricLabel} — your best performers`}
        </p>
      </div>

      {/* Chart area — white bg */}
      <div className="bg-white">
        {chartData.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#E5E5E0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9C9C96' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9C9C96' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => isCurrency
                    ? (v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`)
                    : (v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v))}
                />
                <RechartsTip
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E5E5E0', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                  formatter={(v: number) => [isCurrency ? formatCurrency(v) : formatNumber(v), metricLabel]}
                />
                <Bar dataKey="value" fill={isBottom ? '#FF7A59' : '#5B47E0'} radius={[5, 5, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="size-6 animate-pulse rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-4 w-14 animate-pulse rounded bg-muted" />
              </div>
            ))
          ) : (ranking ?? []).length === 0 ? (
            <div className="py-12 text-center">
              <Target className="mx-auto mb-2 size-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No {metricLabel.toLowerCase()} data yet</p>
            </div>
          ) : (
            (ranking ?? []).map((item, idx) => {
              const isRisky = isBottom && item.delta !== null && item.delta < -10;
              const medalStyle = isBottom
                ? { bg: 'rgba(244,63,94,0.10)', color: '#f43f5e' }
                : (MEDALS[idx] ?? { bg: 'rgba(0,0,0,0.06)', color: '#6b7280' });
              return (
                <motion.button
                  key={item.campaignId}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  onClick={() => navigate(`/clients/${item.clientId}/campaigns/${item.campaignId}`)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
                  style={isRisky ? { background: 'rgba(244,63,94,0.03)' } : {}}
                >
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ background: medalStyle.bg, color: medalStyle.color }}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.campaignName}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.clientName}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular">
                      {isCurrency ? formatCurrency(item.value) : formatNumber(item.value)}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <DeltaBadge delta={item.delta} />
                      {isRisky && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                          style={{ background: 'rgba(244,63,94,0.10)', color: '#f43f5e' }}
                        >
                          At risk
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        {(ranking ?? []).length > 0 && (
          <div className="px-5 py-3" style={{ borderTop: '1px solid #ECECE6' }}>
            <button
              onClick={() => navigate('/clients')}
              className="w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isBottom ? 'Review all campaigns →' : 'View all campaigns →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
