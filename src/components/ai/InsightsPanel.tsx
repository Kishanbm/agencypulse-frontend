import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getApiClient } from "@/lib/api";
import type { AiInsightsResponse, AiInsight } from "@/types/ai";

const COST_METRICS = new Set(["cost", "spend", "cpc", "avg_cpc", "cpm", "cpp"]);

function isCostMetric(metricKey: string): boolean {
  return COST_METRICS.has(metricKey.toLowerCase());
}

function formatValue(value: number, metricKey: string): string {
  const key = metricKey.toLowerCase();
  if (key.includes("cost") || key.includes("spend") || key.includes("cpc") || key.includes("cpm") || key.includes("cpp")) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (key.includes("ctr") || key.includes("rate")) {
    return `${value.toFixed(2)}%`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}

function InsightCard({ insight }: { insight: AiInsight }) {
  const isPositive = insight.sentiment === "POSITIVE";
  const isCost = isCostMetric(insight.metricKey);
  const up = insight.direction === "UP";

  const sentimentColor = isPositive
    ? "text-emerald-600 bg-emerald-500/10"
    : "text-red-500 bg-red-500/10";

  const arrowColor = isPositive ? "text-emerald-500" : "text-red-500";

  const qualityHint = isCost
    ? up ? "(worse)" : "(better)"
    : up ? "(better)" : "(worse)";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${sentimentColor}`}>
        {up
          ? <TrendingUp className={`w-3.5 h-3.5 ${arrowColor}`} />
          : <TrendingDown className={`w-3.5 h-3.5 ${arrowColor}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-snug">{insight.headline}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatValue(insight.priorValue, insight.metricKey)} → {formatValue(insight.currentValue, insight.metricKey)}
          <span className={`ml-1 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            {qualityHint}
          </span>
        </p>
      </div>
      <span className={`text-xs font-semibold shrink-0 px-1.5 py-0.5 rounded ${sentimentColor}`}>
        {up ? "+" : ""}{insight.changePct.toFixed(1)}%
      </span>
    </div>
  );
}

interface InsightsPanelProps {
  clientId: string;
  campaignId: string;
}

export function InsightsPanel({ clientId, campaignId }: InsightsPanelProps) {
  const api = getApiClient();

  const { data, isLoading } = useQuery<AiInsightsResponse>({
    queryKey: ["aiInsights", clientId, campaignId],
    queryFn: async () => {
      const res = await api.get<AiInsightsResponse>(
        `/clients/${clientId}/campaigns/${campaignId}/ai/insights`,
      );
      return res.data;
    },
    staleTime: 60 * 60 * 1000, // 1h — matches backend cache
    retry: false,
  });

  // Silently hide on error (no data), 0 insights, or loading
  if (isLoading) {
    return (
      <div className="border border-border rounded-xl p-4 space-y-2 bg-card">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const insights = data?.insights ?? [];
  if (insights.length === 0) return null;

  // Sort by absolute changePct desc (backend already returns top 3 but re-sort for safety)
  const sorted = [...insights].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
        <span className="text-xs text-muted-foreground">
          {data?.period.from} – {data?.period.to}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Last 7 days vs prior 7 days</p>
      <div>
        {sorted.map((insight, i) => (
          <InsightCard key={`${insight.platform}-${insight.metricKey}-${i}`} insight={insight} />
        ))}
      </div>
    </div>
  );
}
