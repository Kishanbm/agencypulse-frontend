import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, ChevronLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';

interface PortalReport {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function relativeTime(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60)  return 'just now';
  const m = Math.floor(secs / 60);
  if (m < 60)     return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)     return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

export function PortalReportsList() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const navigate = useNavigate();

  const { data: reports = [], isLoading } = useQuery<PortalReport[]>({
    queryKey: ['portal', 'reports', campaignId],
    queryFn:  () =>
      api.get(`/campaigns/${campaignId}/reports`).then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.data ?? [],
      ),
    enabled:  !!campaignId,
    staleTime: 120_000,
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-12 max-w-2xl mx-auto">
      {/* Back nav */}
      <motion.button
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" as const }}
        onClick={() => navigate(`/portal/${clientId}`)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to client home
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="flex items-center gap-3"
      >
        <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
          <FileText className="size-5" style={{ color: '#5B47E0' }} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Published reports from your agency</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
          style={{ border: '1.5px dashed #ECECE6' }}
        >
          <div className="size-14 flex items-center justify-center rounded-2xl mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
            <FileText className="size-7" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No reports yet</p>
          <p className="text-xs text-muted-foreground">Your agency will publish reports here when they're ready.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" as const }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />
          <div className="divide-y" style={{ borderColor: '#ECECE6' }}>
            {reports.map((report, i) => (
              <motion.button
                key={report.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05, ease: "easeOut" as const }}
                onClick={() => navigate(`/portal/${clientId}/campaigns/${campaignId}/reports/${report.id}`)}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#FAFAF7]"
              >
                <div
                  className="size-10 shrink-0 flex items-center justify-center rounded-xl"
                  style={{ background: 'rgba(91,71,224,0.10)' }}
                >
                  <FileText className="size-5" style={{ color: '#5B47E0' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{report.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-2.5" />
                    Updated {relativeTime(report.updatedAt)}
                  </p>
                </div>
                <div
                  className="size-8 rounded-xl flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5"
                  style={{ background: 'rgba(91,71,224,0.08)' }}
                >
                  <ArrowRight className="size-3.5" style={{ color: '#5B47E0' }} />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
