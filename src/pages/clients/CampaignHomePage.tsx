import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Loader2,
  LayoutDashboard,
  FileText,
  Plug,
  Bell,
  Target,
  MessageSquare,
  Activity,
  BarChart3,
  TrendingUp,
  Download,
  Bot,
  Rocket,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { InsightsPanel } from "@/components/ai/InsightsPanel";
import type { Campaign, Client } from "@/types/clients";

function useCampaign(clientId: string, campaignId: string) {
  return useQuery<Campaign>({
    queryKey: ["campaign", clientId, campaignId],
    queryFn: () =>
      api.get<Campaign>(`/clients/${clientId}/campaigns/${campaignId}`).then((r) => r.data),
    staleTime: 60_000,
  });
}

function useClient(clientId: string) {
  return useQuery<Client>({
    queryKey: ["client", clientId],
    queryFn: () => api.get<Client>(`/clients/${clientId}`).then((r) => r.data),
    staleTime: 60_000,
  });
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE:   { label: 'Active',   bg: 'rgba(16,217,160,0.12)',  color: '#10D9A0' },
  PAUSED:   { label: 'Paused',   bg: 'rgba(245,165,36,0.12)',  color: '#d97706' },
  INACTIVE: { label: 'Inactive', bg: 'rgba(156,163,175,0.12)', color: '#9CA3AF' },
};

interface NavCard {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  href: string;
  iconBg: string;
  iconColor: string;
  gradient: string;
}

export default function CampaignHomePage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();

  const { data: campaign, isLoading: campaignLoading } = useCampaign(clientId!, campaignId!);
  const { data: client } = useClient(clientId!);

  const base = `/clients/${clientId}/campaigns/${campaignId}`;

  const navCards: NavCard[] = [
    {
      label: "Dashboards",
      description: "View and manage data dashboards",
      icon: LayoutDashboard,
      href: `${base}/dashboards`,
      iconBg: 'rgba(91,71,224,0.10)',
      iconColor: '#5B47E0',
      gradient: 'linear-gradient(135deg, #5B47E0, #8B5CF6)',
    },
    {
      label: "Reports",
      description: "Scheduled and on-demand reports",
      icon: FileText,
      href: `${base}/reports`,
      iconBg: 'rgba(16,217,160,0.10)',
      iconColor: '#10D9A0',
      gradient: 'linear-gradient(135deg, #10D9A0, #34d399)',
    },
    {
      label: "Integrations",
      description: "Connect GA4, Google Ads, Meta and more",
      icon: Plug,
      href: `${base}/integrations`,
      iconBg: 'rgba(255,122,89,0.10)',
      iconColor: '#FF7A59',
      gradient: 'linear-gradient(135deg, #FF7A59, #FF9A76)',
    },
    {
      label: "Alerts",
      description: "Threshold and budget alerts",
      icon: Bell,
      href: `${base}/alerts`,
      iconBg: 'rgba(244,63,94,0.10)',
      iconColor: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)',
    },
    {
      label: "Goals",
      description: "Track progress toward campaign goals",
      icon: Target,
      href: `${base}/goals`,
      iconBg: 'rgba(16,217,160,0.10)',
      iconColor: '#10D9A0',
      gradient: 'linear-gradient(135deg, #10D9A0, #5B47E0)',
    },
    {
      label: "Notes",
      description: "Campaign notes and communication",
      icon: MessageSquare,
      href: `${base}/notes`,
      iconBg: 'rgba(14,165,233,0.10)',
      iconColor: '#0ea5e9',
      gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    },
    {
      label: "Health",
      description: "Data sync health and status",
      icon: Activity,
      href: `${base}/health`,
      iconBg: 'rgba(16,217,160,0.10)',
      iconColor: '#10D9A0',
      gradient: 'linear-gradient(135deg, #10D9A0, #059669)',
    },
    {
      label: "Scorecard",
      description: "Period-over-period performance",
      icon: BarChart3,
      href: `${base}/scorecard`,
      iconBg: 'rgba(91,71,224,0.10)',
      iconColor: '#5B47E0',
      gradient: 'linear-gradient(135deg, #5B47E0, #FF7A59)',
    },
    {
      label: "Forecast",
      description: "ROI forecasting and projections",
      icon: TrendingUp,
      href: `${base}/forecast`,
      iconBg: 'rgba(245,165,36,0.10)',
      iconColor: '#F5A524',
      gradient: 'linear-gradient(135deg, #F5A524, #fbbf24)',
    },
    {
      label: "Export",
      description: "Download data as CSV or XLSX",
      icon: Download,
      href: `${base}/export`,
      iconBg: 'rgba(100,116,139,0.10)',
      iconColor: '#64748b',
      gradient: 'linear-gradient(135deg, #64748b, #94a3b8)',
    },
    {
      label: "AI Assistant",
      description: "Chat with your campaign data",
      icon: Bot,
      href: `${base}/ai`,
      iconBg: 'rgba(139,92,246,0.10)',
      iconColor: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6, #5B47E0)',
    },
  ];

  if (campaignLoading) {
    return (
      <div className="p-5 lg:p-7 flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#5B47E0' }} />
          <span className="text-sm">Loading campaign…</span>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-5 lg:p-7 flex flex-col items-center justify-center h-64 gap-3">
        <Rocket className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium text-muted-foreground">Campaign not found.</p>
        <Link to={`/clients/${clientId}`} className="text-sm font-medium" style={{ color: '#5B47E0' }}>
          Back to client
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[campaign.status] ?? STATUS_STYLES["INACTIVE"];

  return (
    <div className="p-5 lg:p-7 space-y-6 pb-12 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap"
      >
        <Link to="/clients" className="hover:text-foreground transition-colors font-medium">Clients</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}`} className="hover:text-foreground transition-colors font-medium">
          {client?.name ?? "Client"}
        </Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-foreground font-semibold">{campaign.name}</span>
      </motion.nav>

      {/* Campaign hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div
          className="px-6 pt-6 pb-5 flex items-start gap-4 flex-wrap"
          style={{ background: '#0F0D1F' }}
        >
          <div
            className="size-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #5B47E0, #FF7A59)' }}
          >
            {campaign.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading font-bold text-xl text-white tracking-tight">
                {campaign.name}
              </h1>
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ background: statusStyle.bg, color: statusStyle.color }}
              >
                {statusStyle.label}
              </span>
            </div>
            {campaign.description && (
              <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {campaign.description}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <Calendar className="size-3" />
              Created {new Date(campaign.createdAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Nav cards grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Campaign Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {navCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" as const }}
            >
              <Link
                to={card.href}
                className="group flex flex-col bg-white rounded-2xl p-5 hover:shadow-lg transition-all relative overflow-hidden"
                style={{ border: '1px solid #ECECE6' }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: card.gradient }}
                />
                <div
                  className="size-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: card.iconBg }}
                >
                  <card.icon className="size-5" style={{ color: card.iconColor }} />
                </div>
                <h3
                  className="font-heading font-semibold text-sm text-foreground transition-colors"
                  style={{ color: 'inherit' }}
                >
                  {card.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed flex-1">
                  {card.description}
                </p>
                <div
                  className="mt-3 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: card.iconColor }}
                >
                  Open <ArrowRight className="size-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <InsightsPanel clientId={clientId!} campaignId={campaignId!} />
    </div>
  );
}
