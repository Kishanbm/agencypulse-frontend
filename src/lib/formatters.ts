export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return value.toLocaleString();
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return "$" + (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (value >= 1_000) {
    return "$" + (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + "%";
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTrendPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return sign + value.toFixed(1) + "%";
}

// Formats seconds into "Xh Ym Zs", dropping leading zero units.
// e.g. 1800 → "30m", 3661 → "1h 1m", 45 → "45s"
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
  return `${sec}s`;
}

export function formatValue(value: number, metricKey: string): string {
  if (typeof value !== "number") return String(value);

  const key = metricKey.toLowerCase();

  if (key.includes("revenue") || key.includes("aov") || key.includes("spend") || key.includes("cost") || key.includes("cpa")) {
    return formatCurrency(value);
  }
  if (key === "roas" || key.includes("roas")) {
    return value.toFixed(1) + "x";
  }
  // Duration metrics stored in seconds (GA4: averageSessionDuration, avgSessionDuration)
  if (key.includes("duration") || key.includes("watchtime") || key.includes("watch_time")) {
    return formatDuration(value);
  }
  // GA4 stores these as 0–1 decimals (0.33 = 33%) — multiply by 100 before display
  if (key === "bouncerate" || key === "engagementrate" || key === "bounce_rate" || key === "engagement_rate") {
    return (value * 100).toFixed(1) + "%";
  }
  // All other rate/percent metrics stored as whole-number percentages (e.g. 2.88 = 2.88%)
  if (key.includes("rate") || key.includes("percent") || key.includes("ctr")) {
    return value.toFixed(2) + "%";
  }
  return formatNumber(value);
}
