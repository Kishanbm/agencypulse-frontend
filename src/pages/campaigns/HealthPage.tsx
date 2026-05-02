import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2, AlertTriangle, XCircle, MinusCircle,
  Activity, ExternalLink, AlertCircle, ChevronRight, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntegrationHealth {
  platform: string;
  status: "CONNECTED" | "EXPIRED" | "ERROR" | "DISCONNECTED";
  lastSyncAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  externalAccountId: string | null;
}

interface CampaignHealth {
  campaignId: string;
  campaignName: string;
  integrations: IntegrationHealth[];
  summary: {
    total: number;
    connected: number;
    expired: number;
    error: number;
    disconnected: number;
  };
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
  barColor: string;
}> = {
  CONNECTED: {
    icon: CheckCircle2,
    label: "Connected",
    color: '#10D9A0',
    bg: 'rgba(16,217,160,0.08)',
    border: '1px solid rgba(16,217,160,0.25)',
    barColor: '#10D9A0',
  },
  EXPIRED: {
    icon: AlertTriangle,
    label: "Expired",
    color: '#d97706',
    bg: 'rgba(245,165,36,0.08)',
    border: '1px solid rgba(245,165,36,0.25)',
    barColor: '#F5A524',
  },
  ERROR: {
    icon: XCircle,
    label: "Error",
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.08)',
    border: '1px solid rgba(244,63,94,0.25)',
    barColor: '#f43f5e',
  },
  DISCONNECTED: {
    icon: MinusCircle,
    label: "Disconnected",
    color: '#9CA3AF',
    bg: 'rgba(0,0,0,0.03)',
    border: '1px solid #ECECE6',
    barColor: 'rgba(0,0,0,0.08)',
  },
};

// ─── Integration card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  base,
  index,
}: {
  integration: IntegrationHealth;
  base: string;
  index: number;
}) {
  const [errorExpanded, setErrorExpanded] = useState(false);
  const config = STATUS_CONFIG[integration.status] ?? STATUS_CONFIG.DISCONNECTED;
  const StatusIcon = config.icon;
  const isProblematic = integration.status === "EXPIRED" || integration.status === "ERROR";
  const errMsg = integration.lastErrorMessage ?? "";
  const errTruncated = errMsg.length > 120;
  const platformName = PLATFORM_DISPLAY[integration.platform] ?? integration.platform;
  const initials = platformName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{ border: config.border, boxShadow: integration.status === "CONNECTED" ? '0 0 0 3px rgba(16,217,160,0.06)' : undefined }}
    >
      {/* Status top bar */}
      <div className="h-1 w-full" style={{ background: config.barColor }} />

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="size-10 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm"
              style={{ background: config.bg, color: config.color }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-heading font-semibold text-sm text-foreground truncate">{platformName}</p>
              {integration.externalAccountId && (
                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
                  {integration.externalAccountId}
                </p>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span
            className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: config.bg, color: config.color }}
          >
            <StatusIcon className="size-2.5" />
            {config.label}
          </span>
        </div>

        {/* Sync time */}
        <div
          className="text-xs rounded-xl px-3 py-2 flex items-center gap-1.5"
          style={{ background: integration.status === "CONNECTED" ? 'rgba(16,217,160,0.06)' : 'rgba(0,0,0,0.03)' }}
        >
          {integration.lastSyncAt ? (
            <>
              <Activity className="size-3 shrink-0" style={{ color: config.color }} />
              <span className="text-muted-foreground" title={absoluteTime(integration.lastSyncAt)}>
                Synced <span className="font-medium text-foreground">{timeAgo(integration.lastSyncAt)}</span>
              </span>
            </>
          ) : (
            <span style={{ color: '#d97706' }}>First sync pending…</span>
          )}
        </div>

        {/* Error message */}
        {isProblematic && errMsg && (
          <div
            className="text-xs rounded-xl px-3 py-2 space-y-1"
            style={{ background: config.bg }}
          >
            <p className="leading-snug" style={{ color: config.color }}>
              {errorExpanded || !errTruncated ? errMsg : `${errMsg.slice(0, 120)}…`}
            </p>
            {errTruncated && (
              <button
                onClick={() => setErrorExpanded((v) => !v)}
                className="font-semibold hover:underline text-[11px]"
                style={{ color: config.color }}
              >
                {errorExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1">
          {integration.status === "CONNECTED" ? (
            <Link
              to={`${base}/dashboards`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ color: '#5B47E0' }}
            >
              <ExternalLink className="size-3" />
              View dashboards
            </Link>
          ) : (
            <Link
              to={`${base}/integrations`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ color: '#f43f5e' }}
            >
              <ExternalLink className="size-3" />
              {integration.status === "DISCONNECTED" ? "Connect" : "Reconnect"}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Summary tile ─────────────────────────────────────────────────────────────

function SummaryTile({
  label, value, color, bg, icon: Icon, index,
}: {
  label: string; value: number; color: string; bg: string; icon: React.ElementType; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.05, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${bg.replace('0.08', '0.20').replace('0.03', '#ECECE6')}` }}
    >
      <div className="h-1 w-full" style={{ background: color }} />
      <div className="px-4 py-3.5 flex items-center gap-3">
        <div
          className="size-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <Icon className="size-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold font-mono leading-none" style={{ color }}>{value}</p>
          <p className="text-xs font-medium text-muted-foreground mt-1">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HealthPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const api = getApiClient();
  const base = `/clients/${clientId}/campaigns/${campaignId}`;

  const { data, isLoading, error, refetch, isFetching } = useQuery<CampaignHealth>({
    queryKey: ["campaignHealth", clientId, campaignId],
    queryFn: async () => {
      const res = await api.get<CampaignHealth>(
        `/clients/${clientId}/campaigns/${campaignId}/health`,
      );
      return res.data;
    },
    enabled: !!clientId && !!campaignId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const summaryTiles = data ? [
    { label: "Connected",    value: data.summary.connected,    color: '#10D9A0', bg: 'rgba(16,217,160,0.08)',   icon: CheckCircle2 },
    { label: "Expired",      value: data.summary.expired,      color: '#d97706', bg: 'rgba(245,165,36,0.08)',   icon: AlertTriangle },
    { label: "Error",        value: data.summary.error,        color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',    icon: XCircle },
    { label: "Disconnected", value: data.summary.disconnected, color: '#9CA3AF', bg: 'rgba(0,0,0,0.03)',        icon: MinusCircle },
  ] : [];

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[1200px] mx-auto">
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
        <span className="text-foreground font-semibold">Data Health</span>
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
            style={{ background: 'rgba(16,217,160,0.10)' }}
          >
            <Activity className="size-5" style={{ color: '#10D9A0' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Data Health</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time integration status monitoring</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ border: '1px solid #ECECE6', background: '#fff', color: 'var(--foreground)' }}
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} style={{ color: '#10D9A0' }} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
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
          <p className="text-sm font-semibold text-foreground mb-1">Failed to load health data</p>
          <button
            onClick={() => refetch()}
            className="text-sm font-semibold mt-1 hover:underline"
            style={{ color: '#5B47E0' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Data */}
      <AnimatePresence>
        {!isLoading && data && (
          <>
            {/* Summary tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summaryTiles.map((tile, i) => (
                <SummaryTile key={tile.label} {...tile} index={i} />
              ))}
            </div>

            {/* Integration cards */}
            {data.integrations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" as const }}
                className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 text-center"
                style={{ border: '1px solid #ECECE6' }}
              >
                <div
                  className="mb-4 size-16 flex items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(16,217,160,0.08)' }}
                >
                  <Activity className="size-8" style={{ color: '#10D9A0' }} />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No integrations connected yet</p>
                <p className="text-xs text-muted-foreground mb-4">Connect a platform to start monitoring data health</p>
                <Link
                  to={`${base}/integrations`}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
                >
                  Connect a platform
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.integrations.map((integration, i) => (
                  <IntegrationCard
                    key={integration.platform}
                    integration={integration}
                    base={base}
                    index={i}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
