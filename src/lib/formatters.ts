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

export function formatValue(value: number, metricKey: string): string {
  if (typeof value !== "number") return value;
  
  const key = metricKey.toLowerCase();
  if (key.includes("revenue") || key.includes("aov") || key.includes("spend") || key.includes("cost")) {
    return formatCurrency(value);
  }
  if (key.includes("rate") || key.includes("percent") || key.includes("roas")) {
    return formatPercent(value);
  }
  return formatNumber(value);
}
