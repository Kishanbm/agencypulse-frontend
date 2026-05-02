import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Megaphone,
  FileText,
  Zap,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

const CHART_DATA = [
  { day: "Mon", sessions: 4200, conversions: 310 },
  { day: "Tue", sessions: 3800, conversions: 280 },
  { day: "Wed", sessions: 5100, conversions: 420 },
  { day: "Thu", sessions: 4700, conversions: 390 },
  { day: "Fri", sessions: 5600, conversions: 510 },
  { day: "Sat", sessions: 3200, conversions: 240 },
  { day: "Sun", sessions: 3900, conversions: 295 },
];

const SPEND_DATA = [
  { day: "Mon", spend: 1200 },
  { day: "Tue", spend: 980 },
  { day: "Wed", spend: 1450 },
  { day: "Thu", spend: 1320 },
  { day: "Fri", spend: 1680 },
  { day: "Sat", spend: 890 },
  { day: "Sun", spend: 1100 },
];

const KPI_CARDS = [
  { label: "Active Clients", value: "24", delta: "+3", up: true, icon: Users, color: "violet" },
  { label: "Live Campaigns", value: "61", delta: "+8", up: true, icon: Megaphone, color: "coral" },
  { label: "Reports this month", value: "312", delta: "+18%", up: true, icon: FileText, color: "mint" },
  { label: "Active Integrations", value: "148", delta: "2 errors", up: false, icon: Zap, color: "amber" },
];

const CAMPAIGNS = [
  { id: 1, name: "Summer Sale 2025", client: "Nike", platform: "GA4", status: "healthy", spend: "$4,200", roas: "4.8x", syncedAt: "2m ago" },
  { id: 2, name: "Brand Awareness Q2", client: "Apple", platform: "Meta", status: "healthy", spend: "$8,100", roas: "3.2x", syncedAt: "14m ago" },
  { id: 3, name: "Lead Gen — EMEA", client: "Tesla", platform: "Google Ads", status: "warning", spend: "$6,750", roas: "2.1x", syncedAt: "5h ago" },
  { id: 4, name: "Product Launch", client: "Samsung", platform: "TikTok", status: "healthy", spend: "$2,900", roas: "5.4x", syncedAt: "8m ago" },
  { id: 5, name: "Retargeting Funnel", client: "Adidas", platform: "Meta", status: "error", spend: "$1,400", roas: "—", syncedAt: "2d ago" },
];

const INSIGHTS = [
  { type: "critical", text: "Tesla › Lead Gen EMEA: sync stale 5h — reconnect Google Ads", cta: "Fix now" },
  { type: "warning", text: "Adidas › Retargeting: Meta token expired 2 days ago", cta: "Reconnect" },
  { type: "positive", text: "Samsung › Product Launch ROAS up 22% this week", cta: "View" },
];

const COLOR = {
  violet: { bg: "bg-violet/10", text: "text-violet", icon: "text-violet" },
  coral: { bg: "bg-coral/10", text: "text-coral", icon: "text-coral" },
  mint: { bg: "bg-mint/10", text: "text-mint", icon: "text-mint" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
};

const INSIGHT_STYLES = {
  critical: { bar: "bg-rose-500", badge: "bg-rose-50 text-rose-600 border-rose-100", icon: AlertTriangle, iconColor: "text-rose-500" },
  warning: { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock, iconColor: "text-amber-500" },
  positive: { bar: "bg-mint", badge: "bg-mint/10 text-mint border-mint/20", icon: CheckCircle2, iconColor: "text-mint" },
};

const STATUS_DOT: Record<string, string> = {
  healthy: "bg-mint",
  warning: "bg-amber-400",
  error: "bg-rose-500",
};

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: "easeOut" as const },
  };
}

export default function Overview() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1400px]">

      {/* Page header */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-xl tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your agency at a glance</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-border/60 shadow-xs">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                period === p
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_CARDS.map((card, i) => {
          const c = COLOR[card.color as keyof typeof COLOR];
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              {...fadeUp(i * 0.06)}
              className="bg-white rounded-2xl border border-border/60 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={cn("size-9 rounded-xl flex items-center justify-center", c.bg)}>
                  <Icon className={cn("size-4", c.icon)} />
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                    card.up ? "bg-mint/10 text-mint" : "bg-rose-50 text-rose-500",
                  )}
                >
                  {card.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {card.delta}
                </span>
              </div>
              <div className="mt-4">
                <div className="font-heading font-bold text-3xl tabular tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts + Insights row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sessions / Conversions area chart */}
        <motion.div {...fadeUp(0.1)} className="lg:col-span-2 bg-white rounded-2xl border border-border/60 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-heading font-semibold text-sm">Sessions & Conversions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Agency-wide · last {period}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-violet" />
                <span className="text-xs text-muted-foreground">Sessions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-coral" />
                <span className="text-xs text-muted-foreground">Conversions</span>
              </div>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B47E0" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#5B47E0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF7A59" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#FF7A59" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#E5E5E0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9C9C96", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9C9C96", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E5E0",
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  }}
                  cursor={{ stroke: "#E5E5E0", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#5B47E0"
                  strokeWidth={2.5}
                  fill="url(#gradSessions)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#5B47E0" }}
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stroke="#FF7A59"
                  strokeWidth={2.5}
                  fill="url(#gradConversions)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#FF7A59" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Insights panel */}
        <motion.div {...fadeUp(0.15)} className="bg-white rounded-2xl border border-border/60 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm">Insights</h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-500">
              2 need attention
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {INSIGHTS.map((ins, i) => {
              const s = INSIGHT_STYLES[ins.type as keyof typeof INSIGHT_STYLES];
              const Icon = s.icon;
              return (
                <div key={i} className={cn("flex gap-3 p-3 rounded-xl border", s.badge)}>
                  <Icon className={cn("size-4 mt-0.5 flex-shrink-0", s.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">{ins.text}</p>
                    <button className="mt-1.5 text-[11px] font-semibold underline underline-offset-2">
                      {ins.cta} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SPEND_DATA} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                  <XAxis dataKey="day" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E5E0",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Ad Spend"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#10D9A0"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0, fill: "#10D9A0" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Ad spend trend · {period}</p>
          </div>
        </motion.div>
      </div>

      {/* Campaigns table */}
      <motion.div {...fadeUp(0.2)} className="bg-white rounded-2xl border border-border/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <h3 className="font-heading font-semibold text-sm">Active Campaigns</h3>
          <div className="flex items-center gap-2">
            <button className="size-7 rounded-lg hover:bg-muted/60 flex items-center justify-center transition-colors">
              <RefreshCw className="size-3.5 text-muted-foreground" />
            </button>
            <Link
              to="/clients"
              className="inline-flex items-center gap-1 text-xs font-medium text-violet hover:text-violet/80 transition-colors"
            >
              View all
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                {["Campaign", "Client", "Platform", "Spend", "ROAS", "Last Sync", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3 first:pl-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 + i * 0.04 }}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-5 py-3.5 font-medium text-foreground">{c.name}</td>
                  <td className="px-5 py-3.5 text-foreground/70">{c.client}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-foreground/70">
                      {c.platform}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm tabular">{c.spend}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "font-semibold tabular",
                        c.roas !== "—" ? "text-mint" : "text-muted-foreground",
                      )}
                    >
                      {c.roas}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">{c.syncedAt}</td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full flex-shrink-0", STATUS_DOT[c.status])} />
                      <span
                        className={cn(
                          "text-xs font-medium capitalize",
                          c.status === "healthy"
                            ? "text-mint"
                            : c.status === "warning"
                              ? "text-amber-500"
                              : "text-rose-500",
                        )}
                      >
                        {c.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="size-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted/80 flex items-center justify-center transition-all">
                      <MoreHorizontal className="size-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
