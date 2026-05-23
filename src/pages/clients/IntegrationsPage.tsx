import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2, AlertCircle, Unplug, RefreshCw, Search,
  ChevronRight, Loader2, AlertTriangle, X, Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import * as si from "simple-icons";
import { Icon } from "@iconify/react";
import { getApiClient } from "@/lib/api";
import { useHasRole } from "@/hooks/useRole";
import type { IntegrationConnection } from "@/types/integrations";
import {
  PLATFORM_CATALOG,
  PLATFORM_CATEGORY_FILTERS,
  getPlatformInitials,
  type PlatformCategoryFilter,
  type PlatformEntry,
} from "@/lib/platform-catalog";
import ApiKeyConnectModal from "@/components/integrations/ApiKeyConnectModal";

// ─── Logo sources ─────────────────────────────────────────────────────────────
// ICONIFY_MAP  → @iconify/logos collection (colored SVGs, verified available)
// SI_MAP       → simple-icons (flat branded SVGs, verified available)
// Platforms in neither → styled colored initials fallback

const ICONIFY_MAP: Record<string, string> = {
  // Google family
  GA4:                       'logos:google-analytics',
  GOOGLE_ADS:                'logos:google-ads',
  GOOGLE_SEARCH_CONSOLE:     'logos:google-search-console',
  GOOGLE_AD_MANAGER:         'logos:google-adsense',
  GOOGLE_DV360:              'logos:google-marketing-platform',
  GOOGLE_LOCAL_SERVICES_ADS: 'logos:google-ads',
  GOOGLE_BUSINESS_PROFILE:   'logos:google-maps',
  GOOGLE_SHEETS:             'logos:google-drive',
  GOOGLE_BIGQUERY:           'logos:google-cloud',
  GOOGLE_PAGESPEED:          'logos:google',
  GOOGLE_TAG_MANAGER:        'logos:google-tag-manager',
  // Social
  META_ADS:                  'logos:meta',
  INSTAGRAM_ADS:             'logos:instagram',
  INSTAGRAM_ORGANIC:         'logos:instagram',
  FACEBOOK_ORGANIC:          'logos:facebook',
  YOUTUBE_ANALYTICS:         'logos:youtube',
  TIKTOK_ADS:                'logos:tiktok',
  TIKTOK_ORGANIC:            'logos:tiktok',
  PINTEREST_ADS:             'logos:pinterest',
  PINTEREST_ORGANIC:         'logos:pinterest',
  X_ADS:                     'logos:twitter',
  X_ORGANIC:                 'logos:twitter',
  REDDIT_ADS:                'logos:reddit',
  LINKEDIN_ADS:              'logos:linkedin',
  VIMEO:                     'logos:vimeo',
  SPOTIFY_ADS:               'logos:spotify',
  ADROLL:                    'logos:adroll',
  // PPC / Display
  AMAZON_ADS:                'logos:aws',
  MICROSOFT_ADS:             'logos:bing',
  BING_WEBMASTER_TOOLS:      'logos:bing',
  // Email
  MAILCHIMP:                 'logos:mailchimp',
  CAMPAIGN_MONITOR:          'logos:campaignmonitor',
  DRIP:                      'logos:drip',
  // Ecommerce
  SHOPIFY:                   'logos:shopify',
  WOOCOMMERCE:               'logos:woocommerce',
  STRIPE_ECOMMERCE:          'logos:stripe',
  // Analytics / CRM
  HUBSPOT:                   'logos:hubspot',
  MATOMO:                    'logos:matomo',
  SALESFORCE:                'logos:salesforce',
  UNBOUNCE:                  'logos:unbounce',
  // Database
  MYSQL_DB:                  'logos:mysql',
  SNOWFLAKE:                 'logos:snowflake',
  AMAZON_REDSHIFT:           'logos:aws-redshift',
  TWILIO:                    'logos:twilio',
};

const SI_MAP: Record<string, string> = {
  // These exist in simple-icons but not in @iconify/logos
  GOOGLE_LIGHTHOUSE:         'siLighthouse',
  SNAPCHAT_ADS:              'siSnapchat',
  BREVO:                     'siBrevo',
  BIGCOMMERCE:               'siBigcommerce',
  SEMRUSH:                   'siSemrush',
  TRUSTPILOT:                'siTrustpilot',
  YELP:                      'siYelp',
  YELP_ADS:                  'siYelp',
  CONVERTKIT:                'siKit',
};

// Local files downloaded to public/integrations/ (shown before initials fallback)
// Only include logos where the downloaded file is large enough to look crisp at 60px.
// Files < ~1.5 KB are typically 16-32 px favicons that blur badly — use initials instead.
const LOCAL_MAP: Record<string, string> = {
  AVANSER:              '/integrations/AVANSER.png',        // 1.6 KB
  BASIS_PLATFORM:       '/integrations/BASIS_PLATFORM.png', // 3.2 KB
  BIRDEYE:              '/integrations/BIRDEYE.png',        // 6.9 KB
  BRIGHTLOCAL:          '/integrations/BRIGHTLOCAL.png',    // 8.7 KB
  CALLRAIL:             '/integrations/CALLRAIL.png',       // 20 KB
  CALLTRACKING_METRICS: '/integrations/CALLTRACKING_METRICS.png', // 1.6 KB
  CHOOZLE:              '/integrations/CHOOZLE.png',        // 4.6 KB
  CONSTANT_CONTACT:     '/integrations/CONSTANT_CONTACT.png', // 46 KB
  GATHERUP:             '/integrations/GATHERUP.png',       // 2.0 KB
  GRADE_US:             '/integrations/GRADE_US.png',       // 19 KB
  GROUNDTRUTH:          '/integrations/GROUNDTRUTH.png',    // 7.6 KB
  HIGHLEVEL:            '/integrations/HIGHLEVEL.ico',
  KEAP:                 '/integrations/KEAP.png',           // 4.2 KB
  KLAVIYO:              '/integrations/KLAVIYO.png',        // 8.8 KB
  MAJESTIC_SEO:         '/integrations/MAJESTIC_SEO.png',   // 3.4 KB
  MARCHEX:              '/integrations/MARCHEX.png',        // 2.4 KB
  RANK_TRACKER:         '/integrations/RANK_TRACKER.png',   // 15 KB
  SE_RANKING:           '/integrations/SE_RANKING.png',     // 5.1 KB
  SHARPSPRING:          '/integrations/SHARPSPRING.png',    // 3.3 KB
  STACKADAPT:           '/integrations/STACKADAPT.png',     // 3.2 KB
  SYNUP:                '/integrations/SYNUP.png',          // 3.6 KB
  VENDASTA:             '/integrations/VENDASTA.png',       // 4.3 KB
  WILDJAR:              '/integrations/WILDJAR.png',        // 7.1 KB
  // Sub-1 KB files removed — initials look crisper than a scaled-up 16 px favicon:
  // ACTIVECAMPAIGN (434 b), AHREFS (827 b), CALLSOURCE (617 b),
  // MOZ (766 b), WHATCONVERTS (1236 b), YEXT (707 b)
  CONVERTKIT:           '/integrations/CONVERTKIT.png',     // 3.8 KB (siKit covers this but fallback ok)
};

// ─── Logo component ───────────────────────────────────────────────────────────

type SimpleIcon = { hex: string; path: string; title: string };

function LocalLogo({ src, size, platform, initials, colorClass }: {
  src: string; size: number; platform: PlatformEntry; initials: string; colorClass: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={`rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${colorClass}`}
        style={{ width: size, height: size, fontSize: size * 0.3 }}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={platform.name}
      className="object-contain flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

function PlatformLogo({ platform, size = 52 }: { platform: PlatformEntry; size?: number }) {
  const { initials, colorClass } = getPlatformInitials(platform.name);

  // 1. @iconify/logos — colored SVG (best quality)
  const iconifyKey = ICONIFY_MAP[platform.key];
  if (iconifyKey) {
    return <Icon icon={iconifyKey} style={{ width: size, height: size, flexShrink: 0 }} />;
  }

  // 2. simple-icons — flat branded SVG
  const siKey = SI_MAP[platform.key];
  const siIcon = siKey ? (si as unknown as Record<string, SimpleIcon>)[siKey] : undefined;
  if (siIcon) {
    return (
      <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: `#${siIcon.hex}`, flexShrink: 0 }} aria-label={platform.name}>
        <path d={siIcon.path} />
      </svg>
    );
  }

  // 3. Local downloaded file (favicon/apple-touch-icon from company site)
  const localSrc = LOCAL_MAP[platform.key];
  if (localSrc) {
    return <LocalLogo src={localSrc} size={size} platform={platform} initials={initials} colorClass={colorClass} />;
  }

  // 4. Colored initials fallback
  return (
    <div
      className={`rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${colorClass}`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {initials}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const api = getApiClient();
  const canManage = useHasRole("AGENCY_ADMIN");

  const [activeCategory, setActiveCategory] = useState<PlatformCategoryFilter>("ALL");
  const [search, setSearch] = useState("");
  const [disconnectTarget, setDisconnectTarget] = useState<{ platformKey: string; name: string } | null>(null);
  const [apiKeyTarget, setApiKeyTarget] = useState<PlatformEntry | null>(null);
  const [shopDomainTarget, setShopDomainTarget] = useState<PlatformEntry | null>(null);
  const [ga4PropertyPicker, setGa4PropertyPicker] = useState(false);
  const [gscSitePicker, setGscSitePicker] = useState(false);
  const [youtubeChannelPicker, setYoutubeChannelPicker] = useState(false);
  const [googleAdsCustomerPicker, setGoogleAdsCustomerPicker] = useState(false);
  const [shopDomainInput, setShopDomainInput] = useState("");

  const queryKey = ["integrations", campaignId];

  const { data: connections = [], isLoading } = useQuery<IntegrationConnection[]>({
    queryKey,
    queryFn: () =>
      api
        .get<IntegrationConnection[]>(`/clients/${clientId}/campaigns/${campaignId}/integrations`)
        .then((r) => r.data),
  });

  useEffect(() => {
    const connected = searchParams.get("connected");
    if (!connected) return;
    setSearchParams({}, { replace: true });
    void queryClient.invalidateQueries({ queryKey });
    if (connected.toLowerCase() === "ga4") {
      setGa4PropertyPicker(true);
    } else if (connected.toLowerCase() === "google-search-console") {
      setGscSitePicker(true);
    } else if (connected.toLowerCase() === "youtube") {
      setYoutubeChannelPicker(true);
    } else if (connected.toLowerCase() === "google-ads") {
      setGoogleAdsCustomerPicker(true);
    } else {
      const entry = PLATFORM_CATALOG.find(
        (p) => p.slug === connected || p.key.toLowerCase() === connected.toLowerCase(),
      );
      toast.success(`${entry?.name ?? connected} connected successfully`);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const connectOAuthMutation = useMutation({
    mutationFn: async ({ slug, shopDomain }: { slug: string; shopDomain?: string }) => {
      const params: Record<string, string> = { campaignId: campaignId ?? "" };
      if (shopDomain) params.shopDomain = shopDomain;
      const { data } = await api.get<{ authUrl: string }>(
        `/integrations/${slug}/auth-url`,
        { params },
      );
      window.location.href = data.authUrl;
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? "Could not start connection — try again"));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (platformKey: string) =>
      api.delete(`/clients/${clientId}/campaigns/${campaignId}/integrations/${platformKey}`),
    onMutate: async (platformKey) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<IntegrationConnection[]>(queryKey);
      queryClient.setQueryData<IntegrationConnection[]>(queryKey, (old = []) =>
        old.map((c) =>
          c.platform === platformKey
            ? { ...c, status: "DISCONNECTED", externalAccountId: null }
            : c,
        ),
      );
      return { prev };
    },
    onError: (_err, _key, ctx) => {
      queryClient.setQueryData(queryKey, ctx?.prev);
      toast.error("Failed to disconnect — please try again");
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  });

  const syncNowMutation = useMutation({
    mutationFn: (platformKey: string) =>
      api.post(`/sync/trigger`, { campaignId, platform: platformKey }),
    onSuccess: () => {
      toast.success("Sync started — data will update in a few seconds");
      // Poll 4 times so the UI picks up lastSyncAt once the job completes
      [3000, 8000, 15000, 25000].forEach((ms) =>
        setTimeout(() => void queryClient.invalidateQueries({ queryKey }), ms),
      );
    },
    onError: () => toast.error("Could not start sync — try again"),
  });

  function connectionFor(platformKey: string) {
    return connections.find((c) => c.platform === platformKey);
  }

  const filtered = useMemo(() => {
    let list = PLATFORM_CATALOG;
    if (activeCategory !== "ALL") {
      list = list.filter(
        (p) =>
          p.category === activeCategory ||
          p.altCategories?.includes(activeCategory as typeof p.category),
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      const sa = connectionFor(a.key)?.status ?? "DISCONNECTED";
      const sb = connectionFor(b.key)?.status ?? "DISCONNECTED";
      const rank = (s: string) => (s === "CONNECTED" ? 0 : s === "ERROR" ? 1 : 2);
      if (rank(sa) !== rank(sb)) return rank(sa) - rank(sb);
      return a.name.localeCompare(b.name);
    });
  }, [activeCategory, search, connections]);

  const connectedCount = connections.filter((c) => c.status === "CONNECTED").length;
  const errorCount     = connections.filter((c) => c.status === "ERROR").length;

  if (isLoading) {
    return (
      <div className="p-5 lg:p-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-16 max-w-[1400px] mx-auto">

      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' as const }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap"
      >
        <Link to="/clients" className="hover:text-foreground transition-colors font-medium">Clients</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}`} className="hover:text-foreground transition-colors font-medium">Client</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}/campaigns/${campaignId}`} className="hover:text-foreground transition-colors font-medium">Campaign</Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-foreground font-semibold">Integrations</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' as const }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-tight text-foreground">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect marketing platforms to pull data into dashboards and reports.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {connectedCount > 0 && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(16,217,160,0.10)', color: '#059669', border: '1px solid rgba(16,217,160,0.25)' }}
            >
              <CheckCircle2 className="size-3.5" />
              {connectedCount} connected
            </div>
          )}
          {errorCount > 0 && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.20)' }}
            >
              <AlertCircle className="size-3.5" />
              {errorCount} error{errorCount > 1 ? "s" : ""}
            </div>
          )}
          {!canManage && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(245,165,36,0.10)', color: '#d97706', border: '1px solid rgba(245,165,36,0.25)' }}
            >
              View only
            </div>
          )}
        </div>
      </motion.div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' as const }}
        className="space-y-3"
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
          <input
            placeholder="Search platforms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-xl text-sm outline-none bg-white"
            style={{ border: '1px solid #ECECE6' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#5B47E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {PLATFORM_CATEGORY_FILTERS.map((cat) => {
            const count =
              cat.value === "ALL"
                ? PLATFORM_CATALOG.length
                : PLATFORM_CATALOG.filter(
                    (p) =>
                      p.category === cat.value ||
                      p.altCategories?.includes(cat.value as typeof p.category),
                  ).length;
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold transition-all"
                style={isActive ? {
                  background: '#5B47E0',
                  color: '#fff',
                  border: '1px solid #5B47E0',
                } : {
                  background: 'rgba(255,255,255,0.80)',
                  color: 'var(--muted-foreground)',
                  border: '1px solid #ECECE6',
                }}
              >
                {cat.label}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={isActive
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: 'rgba(0,0,0,0.06)', color: 'var(--muted-foreground)' }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
            <Search className="size-6" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-sm font-semibold text-foreground">No platforms found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search or category.</p>
          <button
            className="mt-4 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: '#5B47E0' }}
            onClick={() => { setSearch(""); setActiveCategory("ALL"); }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
        >
          {filtered.map((platform, i) => {
            const conn      = connectionFor(platform.key);
            const status    = conn?.status ?? "DISCONNECTED";
            const isConn    = status === "CONNECTED";
            const isError   = status === "ERROR";
            const isPending = connectOAuthMutation.isPending && connectOAuthMutation.variables?.slug === platform.slug;

            return (
              <motion.div
                key={platform.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.015, 0.3), ease: 'easeOut' as const }}
                className="relative flex flex-col bg-white rounded-2xl overflow-hidden"
                style={{
                  border: isConn
                    ? '1px solid rgba(16,217,160,0.35)'
                    : isError
                    ? '1px solid rgba(244,63,94,0.28)'
                    : '1px solid #ECECE6',
                  boxShadow: isConn
                    ? '0 0 0 3px rgba(16,217,160,0.08), 0 2px 10px rgba(0,0,0,0.05)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Top accent */}
                {(isConn || isError) && (
                  <div
                    className="h-[3px] w-full flex-shrink-0"
                    style={{
                      background: isConn
                        ? 'linear-gradient(90deg,#10D9A0,#34d399)'
                        : 'linear-gradient(90deg,#f43f5e,#fb7185)',
                    }}
                  />
                )}

                {/* Status dot — top-right corner only */}
                {(isConn || isError) && (
                  <div className="absolute top-3 right-3">
                    <div
                      className="size-5 rounded-full flex items-center justify-center"
                      style={{
                        background: isConn ? 'rgba(16,217,160,0.15)' : 'rgba(244,63,94,0.12)',
                      }}
                    >
                      {isConn
                        ? <CheckCircle2 className="size-3" style={{ color: '#10D9A0' }} />
                        : <AlertCircle className="size-3" style={{ color: '#f43f5e' }} />
                      }
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center gap-2.5 p-5 pb-4 flex-1">
                  {/* Logo — centered */}
                  <div className="flex items-center justify-center w-full mt-1 mb-1">
                    <PlatformLogo platform={platform} size={60} />
                  </div>

                  {/* Name + auth — centered */}
                  <div className="w-full text-center min-w-0">
                    <p className="font-semibold text-sm text-foreground leading-tight truncate px-2">
                      {platform.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {platform.authLabel}
                    </p>
                  </div>

                  {/* Sync state — below name, no overlap */}
                  {isConn && conn && (
                    conn.lastSyncAt ? (
                      <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#059669' }}>
                        <CheckCircle2 className="size-3 shrink-0" />
                        <span className="truncate max-w-[120px]">
                          {formatDistanceToNow(new Date(conn.lastSyncAt), { addSuffix: true })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#10D9A0' }}>
                        <RefreshCw className="size-3 animate-spin shrink-0" />
                        <span>Syncing</span>
                      </div>
                    )
                  )}

                  {isError && conn?.lastErrorMessage && (
                    <div
                      className="w-full rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed line-clamp-2 text-center"
                      style={{ background: 'rgba(244,63,94,0.06)', color: '#f43f5e' }}
                    >
                      {conn.lastErrorMessage}
                    </div>
                  )}

                  {/* Action — pinned to bottom */}
                  {canManage && (
                    <div className="w-full mt-auto pt-1">
                      {!isConn ? (
                        <button
                          onClick={() => {
                            if (platform.authType === "OAUTH") {
                              if (platform.requiresShopDomain) {
                                setShopDomainInput("");
                                setShopDomainTarget(platform);
                              } else {
                                connectOAuthMutation.mutate({ slug: platform.slug });
                              }
                            } else {
                              setApiKeyTarget(platform);
                            }
                          }}
                          disabled={isPending}
                          className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                          style={isError ? {
                            background: 'rgba(244,63,94,0.07)',
                            color: '#f43f5e',
                            border: '1px solid rgba(244,63,94,0.22)',
                          } : {
                            background: 'rgba(91,71,224,0.07)',
                            color: '#5B47E0',
                            border: '1px solid rgba(91,71,224,0.20)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isError
                              ? 'rgba(244,63,94,0.13)'
                              : 'rgba(91,71,224,0.14)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isError
                              ? 'rgba(244,63,94,0.07)'
                              : 'rgba(91,71,224,0.07)';
                          }}
                        >
                          {isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : isError ? (
                            <RefreshCw className="size-3" />
                          ) : (
                            <Zap className="size-3" />
                          )}
                          {isError ? "Reconnect" : "Connect"}
                        </button>
                      ) : (
                        <div className="flex gap-1.5 w-full">
                          <button
                            onClick={() => syncNowMutation.mutate(platform.key)}
                            disabled={syncNowMutation.isPending && syncNowMutation.variables === platform.key}
                            className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                            style={{ background: 'rgba(91,71,224,0.07)', color: '#5B47E0', border: '1px solid rgba(91,71,224,0.20)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(91,71,224,0.14)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(91,71,224,0.07)'; }}
                          >
                            {syncNowMutation.isPending && syncNowMutation.variables === platform.key
                              ? <Loader2 className="size-3 animate-spin" />
                              : <RefreshCw className="size-3" />}
                            Sync
                          </button>
                          <button
                            onClick={() => setDisconnectTarget({ platformKey: platform.key, name: platform.name })}
                            className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-xl text-xs font-medium transition-all"
                            style={{ color: 'var(--muted-foreground)', border: '1px solid #ECECE6' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)';
                              e.currentTarget.style.color = '#f43f5e';
                              e.currentTarget.style.background = 'rgba(244,63,94,0.04)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#ECECE6';
                              e.currentTarget.style.color = 'var(--muted-foreground)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Unplug className="size-3" />
                            Disconnect
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {!canManage && !isConn && (
                    <div
                      className="w-full mt-auto pt-1 flex items-center justify-center h-8 rounded-xl text-[11px] font-medium"
                      style={{ background: 'rgba(0,0,0,0.03)', color: '#9CA3AF' }}
                    >
                      Not connected
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* GA4 Property Picker */}
      {ga4PropertyPicker && (
        <Ga4PropertyPickerModal
          campaignId={campaignId ?? ""}
          clientId={clientId ?? ""}
          onClose={() => setGa4PropertyPicker(false)}
          onSaved={() => {
            setGa4PropertyPicker(false);
            void queryClient.invalidateQueries({ queryKey });
            toast.success("Google Analytics 4 connected successfully");
          }}
        />
      )}

      {/* GSC Site Picker */}
      {gscSitePicker && (
        <GscSitePickerModal
          campaignId={campaignId ?? ""}
          onClose={() => setGscSitePicker(false)}
          onSaved={() => {
            setGscSitePicker(false);
            void queryClient.invalidateQueries({ queryKey });
            toast.success("Google Search Console connected successfully");
          }}
        />
      )}

      {/* YouTube Channel Picker */}
      {youtubeChannelPicker && (
        <YoutubeChannelPickerModal
          campaignId={campaignId ?? ""}
          onClose={() => setYoutubeChannelPicker(false)}
          onSaved={() => {
            setYoutubeChannelPicker(false);
            void queryClient.invalidateQueries({ queryKey });
            toast.success("YouTube Analytics connected successfully");
          }}
        />
      )}

      {/* Google Ads Customer Picker */}
      {googleAdsCustomerPicker && (
        <GoogleAdsCustomerPickerModal
          campaignId={campaignId ?? ""}
          onClose={() => setGoogleAdsCustomerPicker(false)}
          onSaved={() => {
            setGoogleAdsCustomerPicker(false);
            void queryClient.invalidateQueries({ queryKey });
            toast.success("Google Ads connected successfully");
          }}
        />
      )}

      {/* API Key Modal */}
      {apiKeyTarget && (
        <ApiKeyConnectModal
          platform={apiKeyTarget}
          campaignId={campaignId ?? ""}
          open={!!apiKeyTarget}
          onOpenChange={(open) => { if (!open) setApiKeyTarget(null); }}
          queryKey={queryKey}
        />
      )}

      {/* Shop Domain Modal (Shopify per-shop OAuth) */}
      <AnimatePresence>
        {shopDomainTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShopDomainTarget(null)}
            />
            <motion.div
              className="relative w-full max-w-md rounded-2xl overflow-hidden bg-white z-10"
              style={{ border: '1px solid #ECECE6', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg,#5B47E0,#7C6FF7)' }} />
              <div className="px-5 pt-5 pb-4 flex items-start gap-3" style={{ borderBottom: '1px solid #ECECE6' }}>
                <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
                  <Zap className="size-4" style={{ color: '#5B47E0' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading font-bold text-base">Connect {shopDomainTarget.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Enter your Shopify store domain to begin.</p>
                </div>
                <button
                  onClick={() => setShopDomainTarget(null)}
                  className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <label className="block text-xs font-semibold text-foreground">
                  Store domain
                </label>
                <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
                  <span className="px-3 text-xs text-muted-foreground bg-muted/30 h-10 flex items-center border-r" style={{ borderColor: '#ECECE6' }}>
                    https://
                  </span>
                  <input
                    autoFocus
                    placeholder="your-store"
                    value={shopDomainInput}
                    onChange={(e) => setShopDomainInput(e.target.value.trim().replace(/^https?:\/\//, '').replace(/\.myshopify\.com.*/, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && shopDomainInput) {
                        connectOAuthMutation.mutate({ slug: shopDomainTarget.slug, shopDomain: `${shopDomainInput}.myshopify.com` });
                        setShopDomainTarget(null);
                      }
                    }}
                    className="flex-1 px-3 h-10 text-sm outline-none bg-white"
                  />
                  <span className="px-3 text-xs text-muted-foreground bg-muted/30 h-10 flex items-center border-l" style={{ borderColor: '#ECECE6' }}>
                    .myshopify.com
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Enter just the subdomain — e.g. <strong>my-store</strong> for <em>my-store.myshopify.com</em>
                </p>
              </div>
              <div className="px-5 pb-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShopDomainTarget(null)}
                  className="px-4 h-9 rounded-xl text-sm font-semibold transition-colors hover:bg-muted/40"
                  style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!shopDomainInput) return;
                    connectOAuthMutation.mutate({ slug: shopDomainTarget.slug, shopDomain: `${shopDomainInput}.myshopify.com` });
                    setShopDomainTarget(null);
                  }}
                  disabled={!shopDomainInput || connectOAuthMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#5B47E0,#7C6FF7)' }}
                >
                  <Zap className="size-3.5" />
                  Connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disconnect modal */}
      <AnimatePresence>
        {disconnectTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
              onClick={() => setDisconnectTarget(null)}
            />
            <motion.div
              className="relative w-full max-w-md rounded-2xl overflow-hidden bg-white z-10"
              style={{ border: '1px solid #ECECE6', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg,#f43f5e,#fb7185)' }} />
              <div className="px-5 pt-5 pb-4 flex items-start gap-3" style={{ borderBottom: '1px solid #ECECE6' }}>
                <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(244,63,94,0.10)' }}>
                  <AlertTriangle className="size-4" style={{ color: '#f43f5e' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading font-bold text-base">Disconnect {disconnectTarget.name}?</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">This will stop data syncing for this platform.</p>
                </div>
                <button
                  onClick={() => setDisconnectTarget(null)}
                  className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Historical data already stored will not be deleted. You can reconnect at any time.
                </p>
              </div>
              <div className="px-5 pb-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setDisconnectTarget(null)}
                  className="px-4 h-9 rounded-xl text-sm font-semibold transition-colors hover:bg-muted/40"
                  style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    disconnectMutation.mutate(disconnectTarget.platformKey);
                    setDisconnectTarget(null);
                  }}
                  disabled={disconnectMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#f43f5e,#fb7185)' }}
                >
                  <Unplug className="size-3.5" />
                  Disconnect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── YouTube Channel Picker Modal ─────────────────────────────────────────────

interface YoutubeChannel {
  id: string;
  title: string;
  subscriberCount: number;
  viewCount: number;
}

function YoutubeChannelPickerModal({
  campaignId,
  onClose,
  onSaved,
}: {
  campaignId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = getApiClient();
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: channels = [], isLoading, error } = useQuery<YoutubeChannel[]>({
    queryKey: ["youtube-channels", campaignId],
    queryFn: () =>
      api
        .get<YoutubeChannel[]>("/integrations/youtube/channels", { params: { campaignId } })
        .then((r) => r.data),
  });

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post("/integrations/youtube/select-channel", { campaignId, channelId: selected });
      onSaved();
    } catch {
      toast.error("Failed to save YouTube channel — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Icon icon="logos:youtube" className="size-5" />
            <h2 className="font-heading font-bold text-base">Select YouTube Channel</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose which YouTube channel to sync analytics from.
          </p>

          {isLoading && (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">
              Failed to load channels:{" "}
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                (error as Error)?.message ??
                "Unknown error"}
            </p>
          )}

          {!isLoading && channels.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">
              No YouTube channels found on this Google account.
            </p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelected(ch.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected === ch.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-sm font-medium text-foreground">{ch.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {ch.subscriberCount.toLocaleString()} subscribers · {ch.viewCount.toLocaleString()} total views
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Connect Channel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Google Ads Customer Picker Modal ────────────────────────────────────────

interface GoogleAdsCustomer {
  customerId: string;
  descriptiveName: string;
  resourceName: string;
}

function GoogleAdsCustomerPickerModal({
  campaignId,
  onClose,
  onSaved,
}: {
  campaignId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = getApiClient();
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: customers = [], isLoading, error } = useQuery<GoogleAdsCustomer[]>({
    queryKey: ["google-ads-customers", campaignId],
    queryFn: () =>
      api
        .get<GoogleAdsCustomer[]>("/integrations/google-ads/customers", { params: { campaignId } })
        .then((r) => r.data),
  });

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post("/integrations/google-ads/select-customer", { campaignId, customerId: selected });
      onSaved();
    } catch {
      toast.error("Failed to save Google Ads account — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Icon icon="logos:google-ads" className="size-5" />
            <h2 className="font-heading font-bold text-base">Select Google Ads Account</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose which Google Ads account to sync data from.
          </p>

          {isLoading && (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">
              Failed to load accounts:{" "}
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                (error as Error)?.message ??
                "Unknown error"}
            </p>
          )}

          {!isLoading && customers.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">
              No Google Ads accounts found on this Google account.
            </p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {customers.map((c) => (
              <button
                key={c.customerId}
                onClick={() => setSelected(c.customerId)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected === c.customerId
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-sm font-medium text-foreground">{c.descriptiveName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Customer ID: {c.customerId}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Connect Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── GSC Site Picker Modal ────────────────────────────────────────────────────

interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

function GscSitePickerModal({
  campaignId,
  onClose,
  onSaved,
}: {
  campaignId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = getApiClient();
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: sites = [], isLoading, error } = useQuery<GscSite[]>({
    queryKey: ["gsc-sites", campaignId],
    queryFn: () =>
      api
        .get<GscSite[]>("/integrations/google-search-console/sites", { params: { campaignId } })
        .then((r) => r.data),
  });

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post("/integrations/google-search-console/select-site", {
        campaignId,
        siteUrl: selected,
      });
      onSaved();
    } catch {
      toast.error("Failed to save Search Console site — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Icon icon="logos:google-search-console" className="size-5" />
            <h2 className="font-heading font-bold text-base">Select Search Console Property</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose which Search Console property to sync data from.
          </p>

          {isLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">
              Failed to load properties:{" "}
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                (error as Error)?.message ??
                "Unknown error"}
            </p>
          )}

          {!isLoading && sites.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">No Search Console properties found on this account.</p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sites.map((s) => (
              <button
                key={s.siteUrl}
                onClick={() => setSelected(s.siteUrl)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected === s.siteUrl
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-sm font-medium text-foreground">{s.siteUrl}</div>
                <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {s.permissionLevel.replace("site", "").replace(/([A-Z])/g, " $1").trim()}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 h-9 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Connect Property"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── GA4 Property Picker Modal ────────────────────────────────────────────────

interface Ga4Property {
  propertyId: string;
  displayName: string;
  accountDisplayName: string;
}

function Ga4PropertyPickerModal({
  campaignId,
  clientId,
  onClose,
  onSaved,
}: {
  campaignId: string;
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = getApiClient();
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: properties = [], isLoading, error } = useQuery<Ga4Property[]>({
    queryKey: ["ga4-properties", campaignId],
    queryFn: () =>
      api
        .get<Ga4Property[]>("/integrations/ga4/properties", { params: { campaignId } })
        .then((r) => r.data),
  });

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/clients/${clientId}/campaigns/${campaignId}/integrations`, {
        platform: "GA4",
        externalAccountId: selected,
      });
      onSaved();
    } catch {
      toast.error("Failed to save GA4 property — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Icon icon="logos:google-analytics" className="size-5" />
            <h2 className="font-heading font-bold text-base">Select GA4 Property</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose which Google Analytics 4 property to sync data from.
          </p>

          {isLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">
              Failed to load properties:{" "}
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                (error as Error)?.message ??
                "Unknown error"}
            </p>
          )}

          {!isLoading && properties.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">No GA4 properties found on this account.</p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {properties.map((p) => (
              <button
                key={p.propertyId}
                onClick={() => setSelected(p.propertyId)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected === p.propertyId
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-sm font-medium text-foreground">{p.displayName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.accountDisplayName} · {p.propertyId}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 h-9 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Connect Property"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
