import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { FileDown, AlertCircle, Clock } from "lucide-react";
import { getPublicApiClient } from "@/lib/api";
import type { SharedReportData, ReportSection } from "@/types/reports";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECTION_TYPE_LABEL: Record<string, string> = {
  METRICS: "Metrics",
  CHART: "Chart",
  TEXT: "Text",
};

const CHART_TYPE_LABEL: Record<string, string> = {
  LINE_CHART: "Line Chart",
  BAR_CHART: "Bar Chart",
  PIE_CHART: "Pie Chart",
};

function SectionView({ section }: { section: ReportSection }) {
  return (
    <div className="border border-border rounded-lg p-5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {SECTION_TYPE_LABEL[section.type] ?? section.type}
        </span>
        {section.chartType && (
          <span className="text-xs text-muted-foreground">{CHART_TYPE_LABEL[section.chartType]}</span>
        )}
        <span className="text-sm font-medium text-foreground">{section.title}</span>
      </div>
      {section.platform && (
        <p className="text-xs text-muted-foreground">
          {section.platform}
          {section.metricKeys && section.metricKeys.length > 0 && (
            <> · {section.metricKeys.join(", ")}</>
          )}
        </p>
      )}
      {section.type === "TEXT" && section.content && (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{section.content}</p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const publicApi = getPublicApiClient();

  const { data, isLoading, error } = useQuery<SharedReportData>({
    queryKey: ["sharedReport", token],
    queryFn: async () => {
      const res = await publicApi.get<SharedReportData>(`/reports/shared/${token}`);
      return res.data;
    },
    enabled: !!token,
    retry: false,
  });

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-6 w-72 bg-muted rounded animate-pulse mx-auto" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error states ─────────────────────────────────────────────────────────────

  if (error || !data) {
    const status = (error as any)?.response?.status;
    const isExpiredOrRevoked = status === 404 || status === 403 || status === 410;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          {isExpiredOrRevoked ? (
            <>
              <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <h1 className="text-lg font-semibold text-foreground">Link expired or revoked</h1>
              <p className="text-sm text-muted-foreground">
                This report link is no longer active. Please contact the agency for an updated link.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <h1 className="text-lg font-semibold text-foreground">Unable to load report</h1>
              <p className="text-sm text-muted-foreground">
                Something went wrong. Please try again later or contact support.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Report view ──────────────────────────────────────────────────────────────

  const sortedSections = [...(data.report.sections ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      {/* Agency header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">Agency Report</span>
        </div>
      </header>

      {/* Report content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">{data.report.name}</h1>
          {data.downloadUrl && (
            <a
              href={data.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors shrink-0"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </a>
          )}
        </div>

        {/* Sections */}
        {sortedSections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">This report has no sections yet.</p>
        ) : (
          <div className="space-y-4">
            {sortedSections.map((section) => (
              <SectionView key={section.id} section={section} />
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
          Powered by AgencyPulse
        </p>
      </main>
    </div>
  );
}
