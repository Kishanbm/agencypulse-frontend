import React from "react";
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
  GripHorizontal,
  Clock,
} from "lucide-react";
import { motion, Reorder } from "motion/react";
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

function useIntegrations(clientId: string, campaignId: string) {
  return useQuery<{ status: string }[]>({
    queryKey: ["integrations", campaignId],
    queryFn: () => api.get<{ status: string }[]>(`/clients/${clientId}/campaigns/${campaignId}/integrations`).then((r) => r.data),
    staleTime: 60_000,
  });
}

function useCampaignActivity(clientId: string, campaignId: string) {
  return useQuery<{ id: string; action: string; time: string; type: string }[]>({
    queryKey: ["campaign-activity", campaignId],
    queryFn: () => api.get<{ id: string; action: string; time: string; type: string }[]>(`/clients/${clientId}/campaigns/${campaignId}/activity`).then((r) => r.data),
    staleTime: 10_000,
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
  const { data: integrations } = useIntegrations(clientId!, campaignId!);
  const { data: activityData, isLoading: activityLoading } = useCampaignActivity(clientId!, campaignId!);

  const connectedCount = integrations?.filter((i) => i.status === "CONNECTED").length ?? 0;
  const errorCount = integrations?.filter((i) => i.status === "ERROR").length ?? 0;

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

  const [cards, setCards] = React.useState<NavCard[]>(navCards);

  React.useEffect(() => {
    if (campaign?.toolsLayout && Array.isArray(campaign.toolsLayout)) {
      const savedCards = campaign.toolsLayout.map((label: string) => navCards.find(c => c.label === label)).filter(Boolean) as NavCard[];
      if (savedCards.length === navCards.length) {
        setCards(savedCards);
      } else {
        setCards(navCards);
      }
    } else {
      setCards(navCards);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.toolsLayout]);

  const handleReorder = (newCards: NavCard[]) => {
    setCards(newCards);
    const layout = newCards.map(c => c.label);
    // Optimistic backend save
    api.patch(`/clients/${clientId}/campaigns/${campaignId}`, { toolsLayout: layout }).catch(() => {
      // Revert if error? For now simple optimistic fire-and-forget is fine
    });
  };

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
        className="bg-white rounded-none overflow-hidden relative"
        style={{ 
          border: '1px solid #ECECE6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 10px 24px rgba(0,0,0,0.04)' 
        }}
      >
        <div className="px-8 py-8 flex items-center justify-start gap-x-24 gap-y-6 flex-wrap relative z-10">
          <div className="flex items-center gap-6">
            <div
              className="size-16 rounded-none flex items-center justify-center text-2xl font-bold shrink-0"
              style={{ background: 'rgba(91,71,224,0.08)', color: '#5B47E0' }}
            >
              {campaign.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading font-bold text-2xl text-foreground tracking-tight">
                  {campaign.name}
                </h1>
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-none"
                  style={{ background: statusStyle.bg, color: statusStyle.color }}
                >
                  {statusStyle.label}
                </span>
              </div>
              {campaign.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {campaign.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><Calendar className="size-3" /> Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Activity className="size-3" /> Updated {new Date(campaign.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-10 items-center border-l border-[#ECECE6] pl-10 hidden lg:flex ml-20 lg:ml-40 xl:ml-52">
             <div className="flex flex-col">
               <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Connected Integrations</span>
               <span className="text-xl font-bold text-foreground">
                  {connectedCount} <span className="text-sm font-medium text-muted-foreground">Active</span>
               </span>
             </div>
             <div className="flex flex-col border-l border-[#ECECE6] pl-10">
               <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Sync Issues</span>
               <span className="text-xl font-bold" style={{ color: errorCount > 0 ? '#f43f5e' : 'inherit' }}>
                  {errorCount} <span className="text-sm font-medium" style={{ color: errorCount > 0 ? 'rgba(244,63,94,0.7)' : 'var(--muted-foreground)' }}>Errors</span>
               </span>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid and Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Nav cards grid (Drag and Drop) */}
        <div className="xl:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Campaign Tools</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <GripHorizontal className="size-3" /> Drag to reorder
            </span>
          </div>
          <Reorder.Group 
            axis="y" 
            values={cards} 
            onReorder={handleReorder} 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {cards.map((card, i) => (
              <Reorder.Item
                key={card.label}
                value={card}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" as const }}
                style={{ y: 0 }} // Required for Framer Motion Reorder grid bug fix sometimes, but usually fine
                className="relative"
              >
                <div
                  className={`group flex flex-col bg-white rounded-none p-6 transition-all duration-300 relative overflow-hidden h-full cursor-grab active:cursor-grabbing ${card.label === 'AI Assistant' ? 'ring-1 ring-purple-400 shadow-md' : ''}`}
                  style={{ 
                    border: card.label === 'AI Assistant' ? 'none' : '1px solid #ECECE6',
                    boxShadow: card.label === 'AI Assistant' ? '0 4px 14px rgba(139,92,246,0.15)' : '0 1px 3px rgba(0,0,0,0.02), 0 10px 24px rgba(0,0,0,0.06)'
                  }}
                >
                  {card.label === 'AI Assistant' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-50" />
                  )}
                  <Link to={card.href} className="absolute inset-0 z-10" draggable={false} />
                  
                  <div
                    className="size-12 rounded-none flex items-center justify-center mb-5 transition-transform group-hover:scale-110 relative z-20"
                    style={{ background: card.iconBg }}
                  >
                    <card.icon className="size-6" style={{ color: card.iconColor }} />
                  </div>
                  <h3
                    className="font-heading font-semibold text-sm text-foreground transition-colors relative z-20 flex items-center justify-between"
                  >
                    {card.label}
                    <GripHorizontal className="size-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed flex-1 relative z-20 pr-4">
                    {card.description}
                  </p>
                  <div
                    className="mt-3 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity relative z-20"
                    style={{ color: card.iconColor }}
                  >
                    Open <ArrowRight className="size-3" />
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        {/* Recent Activity Feed Sidebar */}
        <div className="xl:col-span-1">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="bg-white rounded-none p-5 relative overflow-hidden" style={{ border: '1px solid #ECECE6', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div className="space-y-5">
              {activityLoading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin mr-2" /> <span className="text-xs">Loading activity...</span>
                </div>
              ) : activityData?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No recent activity.</p>
              ) : (
                activityData?.map((activity, i) => (
                  <div key={activity.id} className="flex gap-3 relative">
                    {i !== activityData.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-[-10px] w-px bg-border" />
                    )}
                    <div className="size-6 rounded-full bg-slate-50 flex items-center justify-center border-2 border-white relative z-10 shrink-0 shadow-sm" style={{ borderColor: '#ECECE6' }}>
                      {activity.type === 'alert' && <Bell className="size-3 text-rose-500" />}
                      {activity.type === 'note' && <MessageSquare className="size-3 text-sky-500" />}
                      {activity.type === 'integration' && <Plug className="size-3 text-orange-500" />}
                      {activity.type !== 'alert' && activity.type !== 'note' && activity.type !== 'integration' && <Activity className="size-3 text-primary" />}
                    </div>
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <span className="text-xs font-medium text-foreground leading-tight">
                        {activity.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> {activity.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-6 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              View Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <InsightsPanel clientId={clientId!} campaignId={campaignId!} />
    </div>
  );
}
