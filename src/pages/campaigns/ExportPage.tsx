import { useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, FileText, Table2, AlertCircle, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { getApiClient } from "@/lib/api";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { useConnectedPlatforms } from "@/hooks/useConnectedPlatforms";
import type { IntegrationPlatform } from "@/types/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportType = "timeseries" | "summary";
type ExportFormat = "csv" | "xlsx";
type Granularity = "day" | "week" | "month";

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

function defaultDateRange() {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  return { from, to };
}

function daysBetween(from: string, to: string): number {
  return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_");
}

function inputFocus(e: React.FocusEvent<HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExportPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const api = getApiClient();
  const base = `/clients/${clientId}/campaigns/${campaignId}`;

  const [exportType, setExportType] = useState<ExportType>("timeseries");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [selectedPlatform, setSelectedPlatform] = useState<IntegrationPlatform | "">("");
  const [downloading, setDownloading] = useState(false);

  const { connectedPlatforms, isLoading: platformsLoading } = useConnectedPlatforms(clientId, campaignId);
  const platform = selectedPlatform || connectedPlatforms[0] || "";

  const rangeError: string | null = (() => {
    if (!dateRange.from || !dateRange.to) return null;
    if (new Date(dateRange.from) > new Date(dateRange.to)) return "Start date must be before end date";
    const days = daysBetween(dateRange.from, dateRange.to);
    if (days > 365) return `Range too large (${days} days) — maximum is 365 days`;
    return null;
  })();

  const canDownload = !!platform && !rangeError && !downloading && !!dateRange.from && !!dateRange.to;

  const handleDownload = useCallback(async () => {
    if (!canDownload) return;
    setDownloading(true);

    const endpoint = exportType === "summary"
      ? `/clients/${clientId}/campaigns/${campaignId}/export/summary`
      : `/clients/${clientId}/campaigns/${campaignId}/export`;

    const params: Record<string, string> = { platform, from: dateRange.from, to: dateRange.to, format };
    if (exportType === "timeseries") params.granularity = granularity;

    try {
      const res = await api.get(endpoint, { params, responseType: "blob" });
      const disposition: string = res.headers["content-disposition"] ?? "";
      const match = disposition.match(/filename[^;=\n]*=([^;\n]*)/);
      const serverFilename = match ? match[1].trim().replace(/['"]/g, "") : null;
      const fallbackFilename = `${sanitizeFilename(platform)}_${exportType}_${dateRange.from}_${dateRange.to}.${format}`;
      const filename = serverFilename || fallbackFilename;
      const blobUrl = URL.createObjectURL(res.data as Blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
      toast.success("Download started", { description: filename });
    } catch (e: any) {
      const msg = e?.response?.data instanceof Blob
        ? await e.response.data.text().then((t: string) => { try { return JSON.parse(t)?.message; } catch { return t; } })
        : (e?.response?.data?.message ?? "Export failed. Please try again.");
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }, [canDownload, exportType, clientId, campaignId, platform, dateRange, format, granularity, api]);

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[700px] mx-auto">
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
        <span className="text-foreground font-semibold">Export</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-center gap-3"
      >
        <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
          <Download className="size-5" style={{ color: '#5B47E0' }} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Data Export</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Download campaign metrics as CSV or XLSX. Max 365-day range.</p>
        </div>
      </motion.div>

      {/* No platforms */}
      {!platformsLoading && connectedPlatforms.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="mb-4 size-14 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(91,71,224,0.08)' }}>
            <Download className="size-7" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No platforms connected</p>
          <p className="text-xs text-muted-foreground mb-4">Connect a platform to export its data</p>
          <Link
            to={`${base}/integrations`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
          >
            <ExternalLink className="size-3.5" /> Connect a platform
          </Link>
        </motion.div>
      )}

      {/* Form */}
      {(platformsLoading || connectedPlatforms.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" as const }}
          className="bg-white rounded-2xl overflow-hidden space-y-0"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />

          <div className="p-5 space-y-6">
            {/* Export type */}
            <Section label="Export Type">
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { id: "timeseries" as ExportType, icon: Table2, title: "Time-series", desc: "One row per period" },
                  { id: "summary" as ExportType, icon: FileText, title: "Summary", desc: "Aggregated totals" },
                ] as const).map(({ id, icon: Icon, title, desc }) => (
                  <button
                    key={id}
                    onClick={() => setExportType(id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={
                      exportType === id
                        ? { background: 'rgba(91,71,224,0.08)', border: '1px solid rgba(91,71,224,0.30)', color: '#5B47E0' }
                        : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }
                    }
                  >
                    <div
                      className="size-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: exportType === id ? 'rgba(91,71,224,0.12)' : 'rgba(0,0,0,0.06)' }}
                    >
                      <Icon className="size-4" style={{ color: exportType === id ? '#5B47E0' : 'var(--muted-foreground)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-xs" style={{ color: exportType === id ? 'rgba(91,71,224,0.70)' : 'var(--muted-foreground)' }}>{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            {/* Platform */}
            <Section label="Platform">
              <select
                value={platform}
                onChange={(e) => setSelectedPlatform(e.target.value as IntegrationPlatform)}
                disabled={platformsLoading || connectedPlatforms.length === 0}
                className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all disabled:opacity-50 bg-white"
                style={{ border: '1px solid #ECECE6' }}
                onFocus={inputFocus}
                onBlur={inputBlur}
              >
                {connectedPlatforms.length === 0
                  ? <option value="">Loading…</option>
                  : connectedPlatforms.map((p) => <option key={p} value={p}>{PLATFORM_DISPLAY[p] ?? p}</option>)}
              </select>
            </Section>

            {/* Date range */}
            <Section label="Date Range">
              <div>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                {rangeError && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: '#f43f5e' }}>
                    <AlertCircle className="size-3.5 shrink-0" />{rangeError}
                  </div>
                )}
              </div>
            </Section>

            {/* Granularity (time-series only) */}
            {exportType === "timeseries" && (
              <Section label="Granularity">
                <div className="flex gap-1.5">
                  {(["day", "week", "month"] as Granularity[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGranularity(g)}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl capitalize transition-all"
                      style={
                        granularity === g
                          ? { background: 'rgba(91,71,224,0.10)', border: '1px solid rgba(91,71,224,0.30)', color: '#5B47E0' }
                          : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* Format */}
            <Section label="File Format">
              <div>
                <div className="flex gap-1.5">
                  {(["csv", "xlsx"] as ExportFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className="flex-1 py-2.5 text-sm font-bold font-mono rounded-xl uppercase transition-all"
                      style={
                        format === f
                          ? { background: 'rgba(91,71,224,0.10)', border: '1px solid rgba(91,71,224,0.30)', color: '#5B47E0' }
                          : { background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }
                      }
                    >
                      .{f}
                    </button>
                  ))}
                </div>
                {format === "xlsx" && exportType === "timeseries" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    XLSX includes a "Summary" sheet with metric totals in addition to time-series data.
                  </p>
                )}
              </div>
            </Section>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={!canDownload}
              className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#111827,#1f2937)', boxShadow: canDownload ? '0 2px 12px rgba(91,71,224,0.30)' : undefined }}
            >
              <Download className={`size-4 ${downloading ? "animate-bounce" : ""}`} />
              {downloading ? "Preparing download…" : `Export as .${format.toUpperCase()}`}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
