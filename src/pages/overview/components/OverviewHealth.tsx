import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, WifiOff, Activity, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import type { AgencyHealthResponse, CampaignRankingItem } from '../overview.types';

function StatusPill({ connected, expired, error }: { connected: number; expired: number; error: number }) {
  if (error > 0) return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)', color: '#f43f5e' }}
    >
      <XCircle className="size-2.5" />Error
    </span>
  );
  if (expired > 0) return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: 'rgba(245,165,36,0.08)', border: '1px solid rgba(245,165,36,0.20)', color: '#d97706' }}
    >
      <Clock className="size-2.5" />Expired
    </span>
  );
  if (connected > 0) return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: 'rgba(16,217,160,0.10)', border: '1px solid rgba(16,217,160,0.20)', color: '#10D9A0' }}
    >
      <CheckCircle2 className="size-2.5" />Healthy
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
      <WifiOff className="size-2.5" />No data
    </span>
  );
}

interface Props { rankingData?: CampaignRankingItem[]; }

export function OverviewHealth({ rankingData }: Props) {
  const navigate = useNavigate();

  const { data: health, isLoading } = useQuery<AgencyHealthResponse>({
    queryKey: ['overview', 'health'],
    queryFn:  () => api.get('/agencies/health').then((r) => r.data),
    staleTime: 30_000, refetchInterval: 60_000,
  });

  const campaignClientMap = new Map<string, string>();
  for (const item of rankingData ?? []) campaignClientMap.set(item.campaignId, item.clientId);

  const summary    = health?.summary;
  const campaigns  = health?.campaigns ?? [];
  const atRisk     = campaigns.filter((c) => c.errorCount > 0 || c.expiredCount > 0);
  const healthy    = campaigns.filter((c) => c.errorCount === 0 && c.expiredCount === 0);
  const sorted     = [...atRisk, ...healthy];
  const healthScore = summary
    ? Math.round((summary.connected / Math.max(summary.totalIntegrations, 1)) * 100)
    : null;

  return (
    <div className="rounded-sm overflow-hidden flex flex-col bg-white" style={{ border: '1px solid #E5E7EB' }}>
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ borderBottom: '1px solid #E5E7EB' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="size-4" style={{ color: '#5B47E0' }} />
              <h3 className="font-heading font-semibold text-sm text-foreground">Integration Health</h3>
              {atRisk.length > 0 && (
                <span
                  className="size-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: '#f43f5e' }}
                >
                  {atRisk.length}
                </span>
              )}
            </div>
            {healthScore !== null && (
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span
                  className="font-bold text-sm"
                  style={{ color: healthScore === 100 ? '#10D9A0' : healthScore >= 60 ? '#F5A524' : '#f43f5e' }}
                >
                  {healthScore}% healthy
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className="size-1.5 rounded-full" style={{ background: '#10D9A0' }} />
                  {summary?.connected} OK
                </span>
                {(summary?.expired ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className="size-1.5 rounded-full" style={{ background: '#F5A524' }} />
                    {summary?.expired} exp.
                  </span>
                )}
                {(summary?.error ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className="size-1.5 rounded-full" style={{ background: '#f43f5e' }} />
                    {summary?.error} err.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* List — white bg */}
      <div className="bg-white flex-1 overflow-y-auto divide-y max-h-[420px]" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="size-8 animate-pulse rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            </div>
          ))
        ) : sorted.length === 0 ? (
          <div className="py-14 text-center">
            <WifiOff className="mx-auto mb-3 size-10 text-muted-foreground/20" />
            <p className="text-sm font-medium text-foreground">No integrations connected</p>
            <p className="mt-1 text-xs text-muted-foreground">Connect data sources to start monitoring health.</p>
            <button
              onClick={() => navigate('/clients')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ border: '1px solid #ECECE6', color: '#5B47E0' }}
            >
              Connect integrations
            </button>
          </div>
        ) : (
          sorted.map((campaign, i) => {
            const hasIssue   = campaign.errorCount > 0 || campaign.expiredCount > 0;
            const clientId   = campaignClientMap.get(campaign.campaignId);
            const actionPath = clientId
              ? `/clients/${clientId}/campaigns/${campaign.campaignId}/integrations`
              : '/clients';

            return (
              <motion.div
                key={campaign.campaignId}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-center gap-3 px-5 py-3.5"
                style={hasIssue ? { background: 'rgba(244,63,94,0.02)' } : {}}
              >
                <div
                  className="size-8 shrink-0 rounded-xl flex items-center justify-center"
                  style={{
                    background: campaign.errorCount > 0
                      ? 'rgba(244,63,94,0.10)'
                      : campaign.expiredCount > 0
                        ? 'rgba(245,165,36,0.10)'
                        : 'rgba(16,217,160,0.10)',
                  }}
                >
                  {campaign.errorCount > 0 ? (
                    <XCircle className="size-4" style={{ color: '#f43f5e' }} />
                  ) : campaign.expiredCount > 0 ? (
                    <Clock className="size-4" style={{ color: '#d97706' }} />
                  ) : (
                    <CheckCircle2 className="size-4" style={{ color: '#10D9A0' }} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{campaign.campaignName}</p>
                  <p className="truncate text-xs text-muted-foreground">{campaign.clientName}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill
                    connected={campaign.connectedCount}
                    expired={campaign.expiredCount}
                    error={campaign.errorCount}
                  />
                  {hasIssue && (
                    <button
                      onClick={() => navigate(actionPath)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                      style={{
                        background: 'rgba(244,63,94,0.08)',
                        border: '1px solid rgba(244,63,94,0.20)',
                        color: '#f43f5e',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.14)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.08)'; }}
                    >
                      <ExternalLink className="size-2.5" />Fix
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
