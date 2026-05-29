import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2, AlertCircle, Unplug, RefreshCw, Search,
  ChevronRight, Loader2, AlertTriangle, X, Zap,
  BarChart3, Lock, LayoutDashboard,
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
import { CreateDashboardModal } from "@/components/dashboard/CreateDashboardModal";

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

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  platform,
  index,
  connection,
  canManage,
  isPendingAuth,
  isPendingSync,
  onConnectOAuth,
  onConnectApiKey,
  onSync,
  onDisconnect,
  isFlipped,
  onToggleFlip,
}: {
  platform: PlatformEntry;
  index: number;
  connection?: IntegrationConnection;
  canManage: boolean;
  isPendingAuth: boolean;
  isPendingSync: boolean;
  onConnectOAuth: (slug: string, requiresShopDomain?: boolean) => void;
  onConnectApiKey: (platform: PlatformEntry) => void;
  onSync: (key: string) => void;
  onDisconnect: (key: string, name: string) => void;
  isFlipped: boolean;
  onToggleFlip: () => void;
}) {


  const status = connection?.status ?? "DISCONNECTED";
  const isConn = status === "CONNECTED";
  const isError = status === "ERROR";

  return (
    <div 
      className="relative" 
      style={{ perspective: "1000px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, delay: Math.min(index * 0.015, 0.3), ease: 'easeOut' as const }}
        className="relative w-full h-[160px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT FACE */}
        <div 
          onClick={onToggleFlip}
          className="absolute inset-0 flex flex-col bg-white rounded-none overflow-hidden cursor-pointer"
          style={{
            backfaceVisibility: "hidden",
            border: isConn
              ? '1px solid rgba(16,217,160,0.35)'
              : isError
              ? '1px solid rgba(244,63,94,0.28)'
              : '1px solid #ECECE6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* Top-right corner dot */}
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

          <div className="flex flex-row items-center gap-5 p-5 h-full">
            {/* Logo — large and prominent on left */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <PlatformLogo platform={platform} size={72} />
            </div>

            {/* Content right */}
            <div className="flex flex-col flex-1 min-w-0 justify-center">
              <h3 className="font-semibold text-base text-foreground leading-tight truncate">
                {platform.name}
              </h3>
              
              {/* Sync Status */}
              <div className="mt-1 h-[20px]">
                {isConn && connection ? (
                  connection.lastSyncAt ? (
                    <div className="flex items-center gap-1 text-[11px] font-medium" style={{ color: '#059669' }}>
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span className="truncate">
                        Synced {formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })}
                      </span>
                    </div>
                  ) : platform.key === 'GOOGLE_SHEETS' || platform.key === 'GOOGLE_BIGQUERY' ? (
                    <div className="flex items-center gap-1 text-[11px] font-medium" style={{ color: '#059669' }}>
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span>Connected — data loads on-demand</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#10D9A0' }}>
                      <RefreshCw className="size-3.5 animate-spin shrink-0" />
                      <span>Syncing...</span>
                    </div>
                  )
                ) : isError && connection?.lastErrorMessage ? (
                  <div className="text-[11px] font-medium truncate" style={{ color: '#f43f5e' }}>
                    {connection.lastErrorMessage}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground truncate">
                    {platform.authLabel}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                {canManage && (
                  <>
                    {!isConn ? (
                      <button
                        onClick={() => {
                          if (platform.authType === "OAUTH") {
                            onConnectOAuth(platform.slug, platform.requiresShopDomain);
                          } else {
                            onConnectApiKey(platform);
                          }
                        }}
                        disabled={isPendingAuth}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 h-8 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        style={isError ? {
                          background: 'rgba(244,63,94,0.1)',
                          color: '#f43f5e',
                          border: '1px solid rgba(244,63,94,0.25)',
                        } : {
                          background: 'rgba(91,71,224,0.08)',
                          color: '#5B47E0',
                          border: '1px solid rgba(91,71,224,0.2)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isError 
                            ? 'rgba(244,63,94,0.15)' 
                            : 'rgba(91,71,224,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isError 
                            ? 'rgba(244,63,94,0.1)' 
                            : 'rgba(91,71,224,0.08)';
                        }}
                      >
                        {isPendingAuth ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : isError ? (
                          <RefreshCw className="size-3" />
                        ) : (
                          <Zap className="size-3" />
                        )}
                        {isError ? "Reconnect" : "Connect"}
                      </button>
                    ) : (
                      <>
                        {platform.key !== 'GOOGLE_SHEETS' && platform.key !== 'GOOGLE_BIGQUERY' && (
                          <button
                            onClick={() => onSync(platform.key)}
                            disabled={isPendingSync}
                            className="flex-[2] inline-flex items-center justify-center gap-1 h-8 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                            style={{ background: 'rgba(91,71,224,0.08)', color: '#5B47E0', border: '1px solid rgba(91,71,224,0.2)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(91,71,224,0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(91,71,224,0.08)'; }}
                          >
                            {isPendingSync ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                            Sync
                          </button>
                        )}
                        <button
                          onClick={() => onDisconnect(platform.key, platform.name)}
                          className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-xl text-xs font-medium transition-all"
                          style={{ color: 'var(--muted-foreground)', border: '1px solid #ECECE6', background: 'transparent' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)';
                            e.currentTarget.style.color = '#f43f5e';
                            e.currentTarget.style.background = 'rgba(244,63,94,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#ECECE6';
                            e.currentTarget.style.color = 'var(--muted-foreground)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Unplug className="size-3" />
                        </button>
                      </>
                    )}
                  </>
                )}
                {!canManage && !isConn && (
                  <div
                    className="w-full flex items-center justify-center h-8 rounded-xl text-[11px] font-medium"
                    style={{ background: 'rgba(0,0,0,0.03)', color: '#9CA3AF' }}
                  >
                    Not connected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          onClick={onToggleFlip}
          className="absolute inset-0 flex flex-col bg-white rounded-none overflow-hidden cursor-pointer p-5"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: '1px solid #ECECE6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <PlatformLogo platform={platform} size={24} />
               <span className="font-semibold text-sm">{platform.name}</span>
             </div>
             <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-none" style={{ background: 'rgba(91,71,224,0.08)', color: '#5B47E0' }}>
               {platform.category}
             </div>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {platform.description || `Connect ${platform.name} to import data seamlessly and enrich your reporting dashboards.`}
          </p>

          <div className="mt-auto flex items-center justify-between">
             <span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">
               Auth: {platform.authType}
             </span>
          </div>
        </div>
      </motion.div>
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
  const [gbpLocationPicker, setGbpLocationPicker] = useState(false);
  const [bigQueryProjectPicker, setBigQueryProjectPicker] = useState(false);
  const [linkedInAdsAccountPicker, setLinkedInAdsAccountPicker] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState<{ platformKey: string; platformName: string } | null>(null);
  const [shopDomainInput, setShopDomainInput] = useState("");
  const [flippedCardKey, setFlippedCardKey] = useState<string | null>(null);

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
    } else if (connected.toLowerCase() === "google-business-profile") {
      setGbpLocationPicker(true);
    } else if (connected.toLowerCase() === "google-sheets") {
      setConnectionSuccess({ platformKey: "GOOGLE_SHEETS", platformName: "Google Sheets" });
    } else if (connected.toLowerCase() === "google-bigquery") {
      setBigQueryProjectPicker(true);
    } else if (connected.toLowerCase() === "linkedin-ads") {
      setLinkedInAdsAccountPicker(true);
    } else {
      const entry = PLATFORM_CATALOG.find(
        (p) => p.slug === connected || p.key.toLowerCase() === connected.toLowerCase(),
      );
      setConnectionSuccess({ platformKey: entry?.key ?? connected.toUpperCase(), platformName: entry?.name ?? connected });
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

  const { data: agency } = useQuery<any>({
    queryKey: ["agency", "me"],
    queryFn: () => api.get("/agencies/me").then((r) => r.data),
    staleTime: 60_000,
  });

  const servicesParam = searchParams.get("services");
  const urlServices = useMemo(() => servicesParam ? servicesParam.split(',') : [], [servicesParam]);

  // Automatically select the first interest/service as the active category if none is selected yet
  useEffect(() => {
    const preferences = urlServices.length > 0 ? urlServices : agency?.interests;
    if (preferences?.length > 0 && activeCategory === "ALL" && !search) {
      const firstPref = preferences[0];
      // Only set if it's a valid category
      if (PLATFORM_CATEGORY_FILTERS.some(f => f.value === firstPref)) {
        setActiveCategory(firstPref as PlatformCategoryFilter);
      }
    }
  }, [agency?.interests, urlServices]);

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
      
      const preferences = urlServices.length > 0 ? urlServices : agency?.interests;
      if (rank(sa) === 2 && preferences) {
        const aMatches = preferences.includes(a.category) || (a.altCategories?.some(c => preferences.includes(c)) ?? false);
        const bMatches = preferences.includes(b.category) || (b.altCategories?.some(c => preferences.includes(c)) ?? false);
        
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [activeCategory, search, connections, agency?.interests, urlServices]);

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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {filtered.map((platform, i) => {
            const conn      = connectionFor(platform.key);
            const status    = conn?.status ?? "DISCONNECTED";
            const isPending = connectOAuthMutation.isPending && connectOAuthMutation.variables?.slug === platform.slug;

            return (
              <IntegrationCard
                key={platform.key}
                platform={platform}
                index={i}
                connection={conn}
                canManage={canManage}
                isPendingAuth={isPending}
                isPendingSync={syncNowMutation.isPending && syncNowMutation.variables === platform.key}
                isFlipped={flippedCardKey === platform.key}
                onToggleFlip={() => setFlippedCardKey(flippedCardKey === platform.key ? null : platform.key)}
                onConnectOAuth={(slug, requiresShopDomain) => {
                  if (requiresShopDomain) {
                    setShopDomainInput("");
                    setShopDomainTarget(platform);
                  } else {
                    connectOAuthMutation.mutate({ slug });
                  }
                }}
                onConnectApiKey={(plat) => setApiKeyTarget(plat)}
                onSync={(key) => syncNowMutation.mutate(key)}
                onDisconnect={(key, name) => setDisconnectTarget({ platformKey: key, name })}
              />
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
            setConnectionSuccess({ platformKey: "GA4", platformName: "Google Analytics 4" });
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
            setConnectionSuccess({ platformKey: "GOOGLE_SEARCH_CONSOLE", platformName: "Google Search Console" });
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
            setConnectionSuccess({ platformKey: "YOUTUBE_ANALYTICS", platformName: "YouTube Analytics" });
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
            setConnectionSuccess({ platformKey: "GOOGLE_ADS", platformName: "Google Ads" });
          }}
        />
      )}

      {/* GBP Location Picker */}
      {gbpLocationPicker && (
        <GbpLocationPickerModal
          campaignId={campaignId ?? ""}
          onClose={() => setGbpLocationPicker(false)}
          onSaved={() => {
            setGbpLocationPicker(false);
            void queryClient.invalidateQueries({ queryKey });
            setConnectionSuccess({ platformKey: "GOOGLE_BUSINESS_PROFILE", platformName: "Google Business Profile" });
          }}
        />
      )}

      {/* BigQuery Project Picker */}
      {bigQueryProjectPicker && (
        <BigQueryProjectPickerModal
          campaignId={campaignId ?? ""}
          onClose={() => setBigQueryProjectPicker(false)}
          onSaved={() => {
            setBigQueryProjectPicker(false);
            void queryClient.invalidateQueries({ queryKey });
            setConnectionSuccess({ platformKey: "GOOGLE_BIGQUERY", platformName: "Google BigQuery" });
          }}
        />
      )}

      {/* LinkedIn Ads Account Picker */}
      {linkedInAdsAccountPicker && (
        <LinkedInAdsAccountPickerModal
          campaignId={campaignId ?? ""}
          onClose={() => setLinkedInAdsAccountPicker(false)}
          onSaved={() => {
            setLinkedInAdsAccountPicker(false);
            void queryClient.invalidateQueries({ queryKey });
            setConnectionSuccess({ platformKey: "LINKEDIN_ADS", platformName: "LinkedIn Ads" });
          }}
        />
      )}

      {/* Connection success modal */}
      {connectionSuccess && (
        <ConnectionSuccessModal
          platformKey={connectionSuccess.platformKey}
          platformName={connectionSuccess.platformName}
          clientId={clientId ?? ""}
          campaignId={campaignId ?? ""}
          onClose={() => setConnectionSuccess(null)}
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
              className="relative w-full max-w-md rounded-none overflow-hidden bg-white z-10"
              style={{ border: '1px solid #ECECE6', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg,#5B47E0,#7C6FF7)' }} />
              <div className="px-5 pt-5 pb-4 flex items-start gap-3" style={{ borderBottom: '1px solid #ECECE6' }}>
                <div className="size-9 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
                  <Zap className="size-4" style={{ color: '#5B47E0' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading font-bold text-base">Connect {shopDomainTarget.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Enter your Shopify store domain to begin.</p>
                </div>
                <button
                  onClick={() => setShopDomainTarget(null)}
                  className="size-7 rounded-none flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <label className="block text-xs font-semibold text-foreground">
                  Store domain
                </label>
                <div className="flex items-center rounded-none overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
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
                  className="px-4 h-9 rounded-none text-sm font-semibold transition-colors hover:bg-muted/40"
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
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-none text-sm font-bold text-white disabled:opacity-50"
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
              className="relative w-full max-w-md rounded-none overflow-hidden bg-white z-10"
              style={{ border: '1px solid #ECECE6', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg,#f43f5e,#fb7185)' }} />
              <div className="px-5 pt-5 pb-4 flex items-start gap-3" style={{ borderBottom: '1px solid #ECECE6' }}>
                <div className="size-9 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(244,63,94,0.10)' }}>
                  <AlertTriangle className="size-4" style={{ color: '#f43f5e' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading font-bold text-base">Disconnect {disconnectTarget.name}?</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">This will stop data syncing for this platform.</p>
                </div>
                <button
                  onClick={() => setDisconnectTarget(null)}
                  className="size-7 rounded-none flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
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
                  className="px-4 h-9 rounded-none text-sm font-semibold transition-colors hover:bg-muted/40"
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
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-none text-sm font-bold text-white disabled:opacity-60"
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
        className="bg-card border border-border rounded-none shadow-2xl w-full max-w-md overflow-hidden"
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
                <div key={i} className="h-14 bg-muted rounded-none animate-pulse" />
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
                className={`w-full text-left px-4 py-3 rounded-none border transition-colors ${
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
            className="px-4 py-2 text-sm rounded-none border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 py-2 text-sm rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Connect Channel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── GBP Location Picker Modal ───────────────────────────────────────────────

interface GbpLocation {
  accountId: string;
  accountName: string;
  locationId: string;
  locationName: string;
  address: string;
}

function GbpLocationPickerModal({
  campaignId,
  onClose,
  onSaved,
}: {
  campaignId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = getApiClient();
  const [selected, setSelected] = useState<GbpLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualAccountId, setManualAccountId] = useState("");
  const [manualLocationId, setManualLocationId] = useState("");

  const { data: locations = [], isLoading, error } = useQuery<GbpLocation[]>({
    queryKey: ["gbp-locations", campaignId],
    queryFn: () =>
      api
        .get<GbpLocation[]>("/integrations/google-business-profile/locations", { params: { campaignId } })
        .then((r) => r.data),
    retry: false,
  });

  // Auto-switch to manual mode when API quota is exhausted
  const isQuotaError = !!error;

  const handleSave = async () => {
    setSaving(true);
    try {
      let accountId: string;
      let locationId: string;

      if (manualMode || isQuotaError) {
        // Normalise: strip leading/trailing spaces, ensure "accounts/" and "locations/" prefixes
        accountId = manualAccountId.trim().startsWith("accounts/")
          ? manualAccountId.trim()
          : `accounts/${manualAccountId.trim()}`;
        locationId = manualLocationId.trim().startsWith("locations/")
          ? manualLocationId.trim()
          : `locations/${manualLocationId.trim()}`;
      } else {
        if (!selected) return;
        accountId = selected.accountId;
        locationId = selected.locationId;
      }

      await api.post("/integrations/google-business-profile/select-location", {
        campaignId,
        accountId,
        locationId,
      });
      onSaved();
    } catch {
      toast.error("Failed to save Business Profile location — try again");
    } finally {
      setSaving(false);
    }
  };

  const canSave = manualMode || isQuotaError
    ? manualAccountId.trim().length > 0 && manualLocationId.trim().length > 0
    : !!selected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-card border border-border rounded-none shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Icon icon="logos:google-icon" className="size-5" />
            <h2 className="font-heading font-bold text-base">Select Business Location</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Auto-list mode */}
          {!manualMode && !isQuotaError && (
            <>
              <p className="text-sm text-muted-foreground">
                Choose which Google Business Profile location to sync reviews and ratings from.
              </p>

              {isLoading && (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded-none animate-pulse" />
                  ))}
                </div>
              )}

              {!isLoading && locations.length === 0 && !error && (
                <p className="text-sm text-muted-foreground">
                  No Business Profile locations found on this Google account.
                </p>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {locations.map((loc) => (
                  <button
                    key={loc.locationId}
                    onClick={() => setSelected(loc)}
                    className={`w-full text-left px-4 py-3 rounded-none border transition-colors ${
                      selected?.locationId === loc.locationId
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-sm font-medium text-foreground">{loc.locationName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {loc.address ? `${loc.address} · ` : ""}{loc.accountName}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setManualMode(true)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Enter IDs manually instead
              </button>
            </>
          )}

          {/* Manual entry mode (also shown automatically when API quota is exceeded) */}
          {(manualMode || isQuotaError) && (
            <>
              {isQuotaError && (
                <div className="rounded-none bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3.5 py-3 text-xs text-amber-800 dark:text-amber-300">
                  The Google Business Profile Accounts API has a quota limit on this project. Enter your Account ID and Location ID manually — find them in your GBP dashboard URL at{" "}
                  <span className="font-mono">business.google.com</span>.
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={manualAccountId}
                    onChange={(e) => setManualAccountId(e.target.value)}
                    placeholder="e.g. 123456789  or  accounts/123456789"
                    className="w-full px-3 py-2 text-sm rounded-none border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Found in the URL when managing your business on business.google.com
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Location ID
                  </label>
                  <input
                    type="text"
                    value={manualLocationId}
                    onChange={(e) => setManualLocationId(e.target.value)}
                    placeholder="e.g. 987654321  or  locations/987654321"
                    className="w-full px-3 py-2 text-sm rounded-none border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Found in the URL when viewing a specific location on business.google.com
                  </p>
                </div>
              </div>

              {!isQuotaError && (
                <button
                  onClick={() => setManualMode(false)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  ← Back to location list
                </button>
              )}
            </>
          )}
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-none border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-4 py-2 text-sm rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Connect Location
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
        className="bg-card border border-border rounded-none shadow-2xl w-full max-w-md overflow-hidden"
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
                <div key={i} className="h-14 bg-muted rounded-none animate-pulse" />
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
                className={`w-full text-left px-4 py-3 rounded-none border transition-colors ${
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
            className="px-4 py-2 text-sm rounded-none border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 py-2 text-sm rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
        className="bg-card border border-border rounded-none shadow-2xl w-full max-w-md overflow-hidden"
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
                <div key={i} className="h-12 bg-muted rounded-none animate-pulse" />
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
                className={`w-full text-left px-4 py-3 rounded-none border transition-colors ${
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
            className="px-4 h-9 rounded-none text-sm font-medium border border-border text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 h-9 rounded-none text-sm font-bold text-white disabled:opacity-50"
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
        className="bg-card border border-border rounded-none shadow-2xl w-full max-w-md overflow-hidden"
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
                <div key={i} className="h-12 bg-muted rounded-none animate-pulse" />
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
                className={`w-full text-left px-4 py-3 rounded-none border transition-colors ${
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
            className="px-4 h-9 rounded-none text-sm font-medium border border-border text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 h-9 rounded-none text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Connect Property"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── LinkedIn Ads Account Picker Modal ───────────────────────────────────────

interface LinkedInAdAccount {
  id: string;
  name: string;
  status: string;
  type: string;
}

function LinkedInAdsAccountPickerModal({
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

  const { data: accounts = [], isLoading, error } = useQuery<LinkedInAdAccount[]>({
    queryKey: ["linkedin-ads-accounts", campaignId],
    queryFn: () =>
      api
        .get<LinkedInAdAccount[]>("/integrations/linkedin-ads/ad-accounts", { params: { campaignId } })
        .then((r) => r.data),
  });

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post("/integrations/linkedin-ads/select-account", { campaignId, accountId: selected });
      onSaved();
    } catch {
      toast.error("Failed to save LinkedIn Ads account — try again");
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
        className="bg-card border border-border rounded-none shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Icon icon="logos:linkedin" className="size-5" />
            <h2 className="font-heading font-bold text-base">Select LinkedIn Ad Account</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose which LinkedIn Campaign Manager account to sync impressions, clicks, spend, and conversions from.
          </p>

          {isLoading && (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-none animate-pulse" />
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

          {!isLoading && accounts.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">
              No LinkedIn ad accounts found. Make sure your LinkedIn account has access to at least one Campaign Manager account.
            </p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelected(acc.id)}
                className={`w-full text-left px-4 py-3 rounded-none border transition-colors ${
                  selected === acc.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-sm font-medium text-foreground">{acc.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Account ID: {acc.id} · {acc.type} · {acc.status}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-none border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 py-2 text-sm rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Connect Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── BigQuery Project Picker Modal ───────────────────────────────────────────

interface BQProject {
  id: string;
  friendlyName: string;
}

function BigQueryProjectPickerModal({
  campaignId,
  onClose,
  onSaved,
}: {
  campaignId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = getApiClient();
  const [selected, setSelected] = useState<BQProject | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: projects = [], isLoading, error } = useQuery<BQProject[]>({
    queryKey: ["bigquery-projects", campaignId],
    queryFn: () =>
      api
        .get<BQProject[]>("/integrations/google-bigquery/projects", { params: { campaignId } })
        .then((r) => r.data),
    retry: false,
  });

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post("/integrations/google-bigquery/project", {
        campaignId,
        projectId: selected.id,
      });
      onSaved();
    } catch {
      toast.error("Failed to save BigQuery project — try again");
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
        className="bg-card border border-border rounded-none shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Icon icon="logos:google-cloud" className="size-5" />
            <h2 className="font-heading font-bold text-base">Select BigQuery Project</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose the GCP project that contains your BigQuery datasets. Each dashboard widget
            will have its own SQL query — configure them in the dashboard editor.
          </p>

          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-none bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>
                {(error as { response?: { data?: { message?: string } } })?.response?.data?.message
                  ?? "Could not load projects — ensure BigQuery API is enabled in your GCP project."}
              </span>
            </div>
          )}

          {!isLoading && !error && projects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No BigQuery-enabled projects found for this Google account.
            </p>
          )}

          {!isLoading && projects.length > 0 && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => setSelected(proj)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-none border text-left transition-colors ${
                    selected?.id === proj.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{proj.friendlyName}</div>
                    <div className="text-xs text-muted-foreground truncate">{proj.id}</div>
                  </div>
                  {selected?.id === proj.id && (
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-none border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="px-4 h-9 rounded-none text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Connect Project"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Connection Success Modal ─────────────────────────────────────────────────

// Platforms that have PLATFORM_DEFAULT_WIDGETS defined — "Explore" card shown only for these
const PLATFORMS_WITH_DEFAULT_WIDGETS = new Set([
  'GA4', 'GOOGLE_ADS', 'META_ADS', 'GOOGLE_SEARCH_CONSOLE', 'SE_RANKING',
  'MAILCHIMP', 'KLAVIYO', 'ACTIVECAMPAIGN', 'BREVO', 'CONSTANT_CONTACT',
  'CONVERTKIT', 'CAMPAIGN_MONITOR', 'DRIP', 'SHOPIFY', 'YOUTUBE_ANALYTICS',
  'VIMEO', 'BING_WEBMASTER_TOOLS', 'HUBSPOT', 'TWILIO', 'GATHERUP',
  'STRIPE_ECOMMERCE', 'MATOMO', 'LINKEDIN_ADS',
]);

function ConnectionSuccessModal({
  platformKey,
  platformName,
  clientId,
  campaignId,
  onClose,
}: {
  platformKey: string;
  platformName: string;
  clientId: string;
  campaignId: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const api = getApiClient();
  const platform = PLATFORM_CATALOG.find((p) => p.key === platformKey);
  const hasDefaultWidgets = PLATFORMS_WITH_DEFAULT_WIDGETS.has(platformKey);

  // 'cards' = action list, 'naming' = inline blank-dashboard name input
  const [view, setView] = useState<'cards' | 'naming'>('cards');
  const [dashName, setDashName] = useState('');

  // Fetch this platform's template so "Explore" can clone it directly
  const { data: templateData, isLoading: templateLoading } = useQuery<{ items: { id: string; name: string }[] }>({
    queryKey: ['templates', 'dashboards', 'platform', platformKey],
    queryFn: () =>
      api
        .get<{ items: { id: string; name: string }[] }>(`/templates/dashboards?platform=${platformKey}`)
        .then((r) => r.data),
    enabled: hasDefaultWidgets,
    staleTime: 60_000,
  });
  const platformTemplate = templateData?.items?.[0] ?? null;

  // Clone platform template → navigate to new dashboard
  const cloneMutation = useMutation({
    mutationFn: (args: { templateId: string; name: string }) =>
      api
        .post<{ id: string; name: string }>(`/templates/dashboards/${args.templateId}/clone`, {
          campaignId,
          name: args.name,
        })
        .then((r) => r.data),
    onSuccess: (cloned) => {
      onClose();
      navigate(`/clients/${clientId}/campaigns/${campaignId}/dashboards/${cloned.id}`);
    },
    onError: () => toast.error('Failed to create dashboard — please try again'),
  });

  // Create blank dashboard → navigate to it
  const createBlankMutation = useMutation({
    mutationFn: (name: string) =>
      api
        .post<{ id: string; name: string }>(`/campaigns/${campaignId}/dashboards`, { name })
        .then((r) => r.data),
    onSuccess: (created) => {
      onClose();
      navigate(`/clients/${clientId}/campaigns/${campaignId}/dashboards/${created.id}`);
    },
    onError: () => toast.error('Failed to create dashboard — please try again'),
  });

  function handleExplore() {
    if (!platformTemplate) return;
    cloneMutation.mutate({ templateId: platformTemplate.id, name: platformTemplate.name });
  }

  function handleCreateBlank() {
    const name = dashName.trim();
    if (!name) return;
    createBlankMutation.mutate(name);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white rounded-none w-full max-w-3xl overflow-hidden grid grid-cols-1 md:grid-cols-5 min-h-[420px]"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid #ECECE6' }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Column - Success Splash Panel (Slate-900 background) */}
        <div className="col-span-1 md:col-span-2 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-slate-800">
          <div className="space-y-6">
            <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Active Connection
            </span>
            
            <div className="flex flex-col items-start gap-4">
              <div className="size-16 rounded-none bg-slate-800/80 border border-slate-700 flex items-center justify-center p-3 shadow-inner">
                {platform && <PlatformLogo platform={platform} size={40} />}
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg leading-tight text-white">
                  {platformName}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Integration added successfully
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-none bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="size-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}>
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Live Sync Online · Connected Successfully</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Live metrics are now configured and will feed directly into your dashboards and automated client reports.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-500">
            <Lock className="size-3 shrink-0" />
            <span>Encrypted Credentials at Rest</span>
          </div>
        </div>

        {/* Right Column - Navigation & Next Steps (Slate-50/70 background) */}
        <div className="col-span-1 md:col-span-3 p-6 sm:p-8 flex flex-col justify-between relative bg-slate-55 bg-slate-50/70 border-l border-slate-100">
          {/* Close button top right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 size-7 rounded-none flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
            style={{ border: '1px solid #ECECE6' }}
          >
            <X className="size-3.5" />
          </button>

          <div className="space-y-6">
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">What's Next?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Choose how you want to build and structure your client's visual reporting.
              </p>
            </div>

            {/* ── Card view ── */}
            {view === 'cards' && (
              <div className="space-y-4">
                {hasDefaultWidgets && (
                  <button
                    onClick={handleExplore}
                    disabled={templateLoading || cloneMutation.isPending || !platformTemplate}
                    className="w-full group text-left p-5 rounded-none border transition-all duration-300 hover:-translate-y-1 relative flex items-start gap-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    style={{ border: '1px solid #ECECE6', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', background: '#ffffff' }}
                    onMouseEnter={(e) => {
                      if (!cloneMutation.isPending && platformTemplate) {
                        e.currentTarget.style.borderColor = '#5B47E0';
                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(91,71,224,0.14)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#ECECE6';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                    }}
                  >
                    <div className="size-8 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(234,88,12,0.08)' }}>
                      {cloneMutation.isPending
                        ? <Loader2 className="size-4 animate-spin" style={{ color: '#EA580C' }} />
                        : <BarChart3 className="size-5" style={{ color: '#EA580C' }} />
                      }
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                        {cloneMutation.isPending ? 'Creating dashboard…' : `Explore ${platformName} Template`}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        Create a pre-built dashboard loaded with standard {platformName} KPIs.
                      </p>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => { setDashName(''); setView('naming'); }}
                  className="w-full group text-left p-5 rounded-none border transition-all duration-300 hover:-translate-y-1 relative flex items-start gap-4"
                  style={{ border: '1px solid #ECECE6', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', background: '#ffffff' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#5B47E0';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(91,71,224,0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ECECE6';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  }}
                >
                  <div className="size-8 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.08)' }}>
                    <LayoutDashboard className="size-5" style={{ color: '#5B47E0' }} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                      Create a Board
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Start with a blank dashboard and add widgets manually.
                    </p>
                  </div>
                </button>

                <button
                  onClick={onClose}
                  className="w-full group text-left p-5 rounded-none border transition-all duration-300 hover:-translate-y-1 relative flex items-start gap-4"
                  style={{ border: '1px solid #ECECE6', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', background: '#ffffff' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#5B47E0';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(91,71,224,0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ECECE6';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  }}
                >
                  <div className="size-8 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.08)' }}>
                    <Zap className="size-5" style={{ color: '#5B47E0' }} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                      Connect Another Source
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Keep adding more marketing integrations to build a multi-channel report.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* ── Naming view (Create a Board) ── */}
            {view === 'naming' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dashboard name</label>
                  <input
                    autoFocus
                    type="text"
                    value={dashName}
                    onChange={(e) => setDashName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBlank()}
                    placeholder="e.g. GA4 Overview"
                    className="w-full h-10 px-3 text-sm rounded-none bg-background text-foreground focus:outline-none transition-shadow"
                    style={{ border: '1px solid #ECECE6' }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.15)'; e.currentTarget.style.borderColor = '#5B47E0'; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#ECECE6'; }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('cards')}
                    className="h-9 px-4 rounded-none text-sm font-medium text-muted-foreground transition-colors hover:bg-muted flex-1"
                    style={{ border: '1px solid #ECECE6' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateBlank}
                    disabled={!dashName.trim() || createBlankMutation.isPending}
                    className="h-9 px-4 rounded-none text-sm font-semibold text-white inline-flex items-center justify-center gap-1.5 flex-1 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                  >
                    {createBlankMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                    {createBlankMutation.isPending ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors rounded-none"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
