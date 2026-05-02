import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, ChevronRight, ExternalLink,
} from "lucide-react";
import { motion } from "motion/react";
import { getApiClient } from "@/lib/api";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { useConnectedPlatforms } from "@/hooks/useConnectedPlatforms";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import type { IntegrationPlatform } from "@/types/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ForecastInsufficient {
  insufficient_data: true;
  dataPoints: number;
  minimumRequired: number;
  metricKey: string;
  platform: string;
}

interface ForecastPoint { date: string; projected: number; lower: number; upper: number }
interface HistoricalPoint { date: string; actual: number }

interface ForecastSuccess {
  insufficient_data: false;
  metricKey: string;
  platform: string;
  trend: {
    slope: number;
    r2: number;
    direction: "UP" | "DOWN" | "FLAT";
    lowConfidence: boolean;
    confidenceNote: string | null;
  };
  currentPeriod: { from: string; to: string };
  forecastPeriod: { from: string; to: string; days: number };
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  forecastSummary: {
    projectedTotal: number;
    projectedEndValue: number;
    confidenceLevel: number;
  };
}

type ForecastResponse = ForecastInsufficient | ForecastSuccess;

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

function formatValue(value: number, metricKey: string): string {
  const key = metricKey.toLowerCase();
  if (key.includes("cost") || key.includes("spend") || key.includes("cpc") || key.includes("cpm")) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (key === "ctr" || key.includes("rate")) return `${(value * 100).toFixed(2)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}

function defaultDateRange() {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0];
  return { from, to };
}

function r2Config(r2: number): { label: string; color: string; bg: string } {
  if (r2 >= 0.7) return { label: "Good",     color: '#10D9A0', bg: 'rgba(16,217,160,0.10)' };
  if (r2 >= 0.4) return { label: "Moderate", color: '#d97706', bg: 'rgba(245,165,36,0.10)' };
  return             { label: "Weak",       color: '#f43f5e', bg: 'rgba(244,63,94,0.10)' };
}

interface ChartPoint {
  date: string;
  actual: number | null;
  projected: number | null;
  lowerBound: number | null;
  bandHeight: number | null;
}

function buildChartData(historical: HistoricalPoint[], forecast: ForecastPoint[]): ChartPoint[] {
  return [
    ...historical.map((d) => ({ date: d.date, actual: d.actual, projected: null, lowerBound: null, bandHeight: null })),
    ...forecast.map((d) => ({ date: d.date, actual: null, projected: d.projected, lowerBound: d.lower, bandHeight: d.upper - d.lower })),
  ];
}

function formatXTick(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function inputFocus(e: React.FocusEvent<HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, bg, index }: {
  label: string; value: string; sub: string; color: string; bg: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.05, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid #ECECE6' }}
    >
      <div className="h-0.5 w-full" style={{ background: color }} />
      <div className="px-4 py-4">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1.5">{label}</p>
        <p className="text-2xl font-bold font-mono tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ForecastPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const api = getApiClient();
  const base = `/clients/${clientId}/campaigns/${campaignId}`;

  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [selectedPlatform, setSelectedPlatform] = useState<IntegrationPlatform | "">("");
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [forecastDays, setForecastDays] = useState(30);

  const { connectedPlatforms, isLoading: platformsLoading } = useConnectedPlatforms(clientId, campaignId);
  const platform = selectedPlatform || connectedPlatforms[0] || "";
  const { metrics: metricDefs } = useMetricDefinitions(platform as IntegrationPlatform || undefined);
  const metric = selectedMetric || metricDefs[0]?.metricKey || "";
  const metricLabel = metricDefs.find((m) => m.metricKey === metric)?.label ?? metric;
  const canRun = !!platform && !!metric;

  const { data, isLoading, error } = useQuery<ForecastResponse>({
    queryKey: ["forecast", clientId, campaignId, platform, metric, dateRange.from, dateRange.to, forecastDays],
    queryFn: async () => {
      const res = await api.get<ForecastResponse>(
        `/clients/${clientId}/campaigns/${campaignId}/forecast`,
        { params: { platform, metricKey: metric, from: dateRange.from, to: dateRange.to, forecastDays } },
      );
      return res.data;
    },
    enabled: canRun && !!clientId && !!campaignId,
    staleTime: 60 * 60 * 1000,
  });

  const successData = data && !data.insufficient_data ? (data as ForecastSuccess) : null;
  const chartData = successData ? buildChartData(successData.historical, successData.forecast) : [];

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
        <span className="text-foreground font-semibold">Forecast</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-center gap-3"
      >
        <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
          <TrendingUp className="size-5" style={{ color: '#5B47E0' }} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">ROI Forecast</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Linear trend forecast with 95% confidence bands</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="px-5 py-4 flex flex-wrap items-end gap-4">
          {/* Platform */}
          <div className="space-y-1.5 min-w-[160px]">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Platform</p>
            <select
              value={platform}
              onChange={(e) => { setSelectedPlatform(e.target.value as IntegrationPlatform); setSelectedMetric(""); }}
              disabled={platformsLoading || connectedPlatforms.length === 0}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-all disabled:opacity-50 bg-white"
              style={{ border: '1px solid #ECECE6' }}
              onFocus={inputFocus}
              onBlur={inputBlur}
            >
              {connectedPlatforms.length === 0
                ? <option value="">No platforms connected</option>
                : connectedPlatforms.map((p) => <option key={p} value={p}>{PLATFORM_DISPLAY[p] ?? p}</option>)}
            </select>
          </div>

          {/* Metric */}
          <div className="space-y-1.5 min-w-[180px]">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Metric</p>
            <select
              value={metric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              disabled={metricDefs.length === 0}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-all disabled:opacity-50 bg-white"
              style={{ border: '1px solid #ECECE6' }}
              onFocus={inputFocus}
              onBlur={inputBlur}
            >
              {metricDefs.length === 0
                ? <option value="">Select a platform first</option>
                : metricDefs.map((m) => <option key={m.metricKey} value={m.metricKey}>{m.label}</option>)}
            </select>
          </div>

          {/* Historical window */}
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Historical Window</p>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>

          {/* Forecast horizon */}
          <div className="space-y-1.5 min-w-[180px]">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
              Forecast Horizon: <span className="font-bold" style={{ color: '#5B47E0' }}>{forecastDays} days</span>
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={7}
                max={90}
                step={7}
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#5B47E0' }}
              />
              <span className="text-xs font-bold font-mono tabular-nums w-10 text-right" style={{ color: '#5B47E0' }}>{forecastDays}d</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* No platform */}
      {!platformsLoading && connectedPlatforms.length === 0 && (
        <div
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="mb-4 size-14 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(91,71,224,0.08)' }}>
            <TrendingUp className="size-7" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No platforms connected</p>
          <p className="text-xs text-muted-foreground mb-4">Connect a platform to run a forecast</p>
          <Link
            to={`${base}/integrations`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
          >
            <ExternalLink className="size-3.5" /> Connect a platform
          </Link>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-80 rounded-2xl bg-muted animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-14 text-center"
          style={{ border: '1px solid rgba(244,63,94,0.20)' }}
        >
          <div className="mb-3 size-12 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(244,63,94,0.08)' }}>
            <AlertCircle className="size-6" style={{ color: '#f43f5e' }} />
          </div>
          <p className="text-sm font-semibold text-foreground">Failed to load forecast</p>
          <p className="text-xs mt-1" style={{ color: '#f43f5e' }}>
            {(error as any)?.response?.data?.message ?? "Something went wrong. Please try again."}
          </p>
        </div>
      )}

      {/* Insufficient data */}
      {!isLoading && data?.insufficient_data && (
        <div
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-14 text-center"
          style={{ border: '1px solid rgba(245,165,36,0.25)' }}
        >
          <div className="mb-3 size-12 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(245,165,36,0.10)' }}>
            <AlertTriangle className="size-6" style={{ color: '#d97706' }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Not enough data to forecast</p>
          <p className="text-xs text-muted-foreground">
            {data.dataPoints} day{data.dataPoints !== 1 ? "s" : ""} available — need at least {data.minimumRequired}.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try expanding the historical window or wait for more data to sync.
          </p>
        </div>
      )}

      {/* Results */}
      {!isLoading && successData && (
        <>
          {/* Low confidence warning */}
          {successData.trend.lowConfidence && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
              className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: 'rgba(245,165,36,0.08)', border: '1px solid rgba(245,165,36,0.25)' }}
            >
              <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#d97706' }}>Trend fit is weak</p>
                <p className="text-xs mt-0.5 text-muted-foreground">
                  {successData.trend.confidenceNote ?? `R² = ${successData.trend.r2.toFixed(2)} — the data doesn't follow a consistent trend. Forecast may not be reliable.`}
                </p>
              </div>
            </motion.div>
          )}

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" as const }}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #ECECE6' }}
          >
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-1">
                <h3 className="font-heading font-semibold text-sm text-foreground">{metricLabel}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-8 h-0.5 rounded" style={{ background: '#5B47E0' }} />
                    Historical
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-8 h-px border-t-2 border-dashed" style={{ borderColor: 'rgba(91,71,224,0.55)' }} />
                    Projected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-3 rounded" style={{ background: 'rgba(91,71,224,0.12)' }} />
                    95% CI
                  </span>
                </div>
              </div>
            </div>
            <div className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECECE6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXTick}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#ECECE6' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={(v) => formatValue(v, metric)}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip
                    formatter={(value: number | null, name: string) => {
                      if (value == null) return [null, null];
                      const labels: Record<string, string> = { actual: "Actual", projected: "Projected" };
                      return [formatValue(value, metric), labels[name] ?? name];
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #ECECE6', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  />
                  <Area dataKey="lowerBound" stackId="ci" stroke="none" fill="transparent" connectNulls={false} legendType="none" isAnimationActive={false} />
                  <Area dataKey="bandHeight" stackId="ci" stroke="none" fill="rgba(91,71,224,0.10)" connectNulls={false} legendType="none" isAnimationActive={false} />
                  <Line dataKey="actual" stroke="#5B47E0" strokeWidth={2.5} dot={false} connectNulls={false} name="actual" legendType="none" isAnimationActive={false} />
                  <Line dataKey="projected" stroke="rgba(91,71,224,0.55)" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} name="projected" legendType="none" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Projected Total"
              value={formatValue(successData.forecastSummary.projectedTotal, metric)}
              sub={`Next ${successData.forecastPeriod.days} days`}
              color="#5B47E0"
              bg="rgba(91,71,224,0.08)"
              index={0}
            />
            <StatCard
              label="Projected End Value"
              value={formatValue(successData.forecastSummary.projectedEndValue, metric)}
              sub={`On ${successData.forecastPeriod.to}`}
              color="#10D9A0"
              bg="rgba(16,217,160,0.08)"
              index={1}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" as const }}
              className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid #ECECE6' }}
            >
              {(() => {
                const dir = successData.trend.direction;
                const dirColor = dir === "UP" ? '#10D9A0' : dir === "DOWN" ? '#f43f5e' : '#9CA3AF';
                const DirIcon = dir === "UP" ? TrendingUp : dir === "DOWN" ? TrendingDown : Minus;
                const r2c = r2Config(successData.trend.r2);
                return (
                  <>
                    <div className="h-0.5 w-full" style={{ background: dirColor }} />
                    <div className="px-4 py-4">
                      <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Trend & Model Fit</p>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `${dirColor}18` }}>
                          <DirIcon className="size-4" style={{ color: dirColor }} />
                        </div>
                        <span className="text-base font-bold" style={{ color: dirColor }}>
                          {dir}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">R² score:</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: r2c.bg, color: r2c.color }}
                        >
                          {successData.trend.r2.toFixed(2)} — {r2c.label}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
