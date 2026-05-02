import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, BarChart3, AlertCircle, ChevronRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { useConnectedPlatforms } from "@/hooks/useConnectedPlatforms";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import type { IntegrationPlatform } from "@/types/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScorecardMetric {
  metricKey: string;
  currentValue: number;
  priorValue: number;
  changeAbsolute: number;
  changePct: number | null;
  status: "UP" | "DOWN" | "FLAT" | "NO_CHANGE";
}

interface ScorecardResponse {
  campaignId: string;
  platform: string;
  currentPeriod: { from: string; to: string };
  priorPeriod: { from: string; to: string };
  metrics: ScorecardMetric[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const PLATFORM_SHORT: Record<string, string> = {
  GA4: "GA4",
  GOOGLE_ADS: "G Ads",
  META_ADS: "Meta",
  GOOGLE_SEARCH_CONSOLE: "GSC",
  YOUTUBE_ANALYTICS: "YouTube",
  LINKEDIN_ADS: "LinkedIn",
  TIKTOK_ADS: "TikTok",
  AMAZON_ADS: "Amazon",
};

function formatValue(value: number, metricKey: string): string {
  const key = metricKey.toLowerCase();
  if (key.includes("cost") || key.includes("spend") || key.includes("cpc") || key.includes("cpm") || key.includes("cpp")) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (key === "ctr" || key.includes("rate")) {
    return `${(value * 100).toFixed(2)}%`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}

function formatPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function defaultDateRange() {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  return { from, to };
}

// ─── Metric row card ──────────────────────────────────────────────────────────

function MetricRow({ metric, label, index }: { metric: ScorecardMetric; label: string; index: number }) {
  const isUp = metric.status === "UP";
  const isDown = metric.status === "DOWN";
  const isFlat = !isUp && !isDown;

  const trendColor = isUp ? '#10D9A0' : isDown ? '#f43f5e' : '#9CA3AF';
  const trendBg = isUp ? 'rgba(16,217,160,0.08)' : isDown ? 'rgba(244,63,94,0.08)' : 'rgba(0,0,0,0.04)';
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const barWidth = metric.changePct != null
    ? Math.min(Math.abs(metric.changePct) / 50 * 100, 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-shadow"
      style={{ border: '1px solid #ECECE6' }}
    >
      {/* Status top strip */}
      <div className="h-0.5 w-full" style={{ background: trendColor }} />

      <div className="px-4 py-3.5 flex items-center gap-4">
        {/* Trend icon */}
        <div
          className="size-9 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: trendBg }}
        >
          <TrendIcon className="size-4" style={{ color: trendColor }} />
        </div>

        {/* Metric name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate" title={metric.metricKey}>{label}</p>
          {/* Mini change bar */}
          {metric.changePct != null && (
            <div className="mt-1.5 h-1 w-full max-w-[120px] rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${barWidth}%`, background: trendColor }}
              />
            </div>
          )}
        </div>

        {/* Current value */}
        <div className="text-right shrink-0 min-w-[80px]">
          <p className="text-base font-bold font-mono tabular-nums text-foreground">
            {formatValue(metric.currentValue, metric.metricKey)}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono tabular-nums mt-0.5">
            {formatValue(metric.priorValue, metric.metricKey)} prior
          </p>
        </div>

        {/* Change % pill */}
        <div
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
          style={{ background: trendBg, minWidth: 72 }}
        >
          <TrendIcon className="size-3 shrink-0" style={{ color: trendColor }} />
          <span className="text-xs font-bold font-mono tabular-nums" style={{ color: trendColor }}>
            {metric.changePct != null ? formatPct(metric.changePct) : '—'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScorecardPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const api = getApiClient();
  const base = `/clients/${clientId}/campaigns/${campaignId}`;

  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [selectedPlatform, setSelectedPlatform] = useState<IntegrationPlatform | "">("");

  const { connectedPlatforms, isLoading: platformsLoading } = useConnectedPlatforms(clientId, campaignId);
  const platform = (selectedPlatform || connectedPlatforms[0] || "") as IntegrationPlatform | "";
  const { metrics: metricDefs } = useMetricDefinitions(platform as IntegrationPlatform || undefined);

  const { data, isLoading, error } = useQuery<ScorecardResponse>({
    queryKey: ["scorecard", clientId, campaignId, platform, dateRange.from, dateRange.to],
    queryFn: async () => {
      const res = await api.get<ScorecardResponse>(
        `/clients/${clientId}/campaigns/${campaignId}/scorecard`,
        { params: { platform, from: dateRange.from, to: dateRange.to } },
      );
      return res.data;
    },
    enabled: !!platform && !!clientId && !!campaignId,
    staleTime: 60_000,
  });

  const sortedMetrics = useMemo(() => {
    if (!data?.metrics) return [];
    return [...data.metrics].sort((a, b) => {
      const pa = a.changePct != null ? Math.abs(a.changePct) : 0;
      const pb = b.changePct != null ? Math.abs(b.changePct) : 0;
      return pb - pa;
    });
  }, [data]);

  const metricLabelMap = useMemo(
    () => Object.fromEntries(metricDefs.map((m) => [m.metricKey, m.label])),
    [metricDefs],
  );

  // Summary stats
  const upCount = sortedMetrics.filter((m) => m.status === "UP").length;
  const downCount = sortedMetrics.filter((m) => m.status === "DOWN").length;

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
        <Link to={base} className="hover:text-foreground transition-colors font-medium">Campaign</Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-foreground font-semibold">Scorecard</span>
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
            style={{ background: 'rgba(91,71,224,0.10)' }}
          >
            <BarChart3 className="size-5" style={{ color: '#5B47E0' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Scorecard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Period-over-period metric comparison</p>
          </div>
        </div>

        {/* Summary pills */}
        <AnimatePresence>
          {data && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className="flex items-center gap-2 flex-wrap"
            >
              {upCount > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(16,217,160,0.12)', color: '#10D9A0' }}
                >
                  <TrendingUp className="size-3" />
                  {upCount} up
                </span>
              )}
              {downCount > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(244,63,94,0.10)', color: '#f43f5e' }}
                >
                  <TrendingDown className="size-3" />
                  {downCount} down
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" as const }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Platform pills */}
        {!platformsLoading && connectedPlatforms.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {connectedPlatforms.map((p) => {
              const isSelected = (platform || connectedPlatforms[0]) === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={
                    isSelected
                      ? { background: 'linear-gradient(135deg,#111827,#1f2937)', color: '#fff', boxShadow: '0 2px 8px rgba(91,71,224,0.30)' }
                      : { background: '#fff', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }
                  }
                >
                  {PLATFORM_SHORT[p] ?? p}
                </button>
              );
            })}
          </div>
        )}

        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </motion.div>

      {/* No platform */}
      {!platformsLoading && connectedPlatforms.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 text-center"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div
            className="mb-4 size-16 flex items-center justify-center rounded-2xl"
            style={{ background: 'rgba(91,71,224,0.08)' }}
          >
            <BarChart3 className="size-8" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No platforms connected</p>
          <p className="text-xs text-muted-foreground mb-4">Connect a platform to view your scorecard</p>
          <Link
            to={`${base}/integrations`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
          >
            Connect a platform
          </Link>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[70px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
          style={{ border: '1px solid rgba(244,63,94,0.20)' }}
        >
          <div className="mb-3 size-12 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(244,63,94,0.08)' }}>
            <AlertCircle className="size-6" style={{ color: '#f43f5e' }} />
          </div>
          <p className="text-sm font-semibold text-foreground">Failed to load scorecard</p>
          <p className="text-xs mt-1" style={{ color: '#f43f5e' }}>
            {(error as any)?.response?.data?.message ?? "Something went wrong. Please try again."}
          </p>
        </div>
      )}

      {/* Period labels + metrics */}
      {!isLoading && data && (
        <>
          {/* Period comparison banner */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #ECECE6' }}
          >
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#FF7A59,#10D9A0)' }} />
            <div className="px-5 py-3.5 flex flex-wrap items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2.5">
                <Calendar className="size-4 shrink-0" style={{ color: '#5B47E0' }} />
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Current period</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {formatDate(data.currentPeriod.from)} – {formatDate(data.currentPeriod.to)}
                  </p>
                </div>
              </div>
              <div className="w-px h-8 hidden sm:block" style={{ background: '#ECECE6' }} />
              <div className="flex items-center gap-2.5">
                <Calendar className="size-4 shrink-0 opacity-40" style={{ color: '#5B47E0' }} />
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Prior period</p>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">
                    {formatDate(data.priorPeriod.from)} – {formatDate(data.priorPeriod.to)}
                  </p>
                </div>
              </div>
              <div className="ml-auto hidden sm:block">
                <span className="text-xs text-muted-foreground">{sortedMetrics.length} metrics</span>
              </div>
            </div>
          </motion.div>

          {sortedMetrics.length === 0 ? (
            <div
              className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
              style={{ border: '1px solid #ECECE6' }}
            >
              <div className="mb-3 size-12 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(91,71,224,0.08)' }}>
                <BarChart3 className="size-6" style={{ color: '#5B47E0' }} />
              </div>
              <p className="text-sm font-semibold text-foreground">No metric data for this period</p>
              <p className="text-xs text-muted-foreground mt-1">Try selecting a different date range</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedMetrics.map((metric, i) => (
                <MetricRow
                  key={metric.metricKey}
                  metric={metric}
                  label={metricLabelMap[metric.metricKey] ?? metric.metricKey}
                  index={i}
                />
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground pl-1">
            Sorted by largest absolute % change first.
          </p>
        </>
      )}
    </div>
  );
}
