import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, FileText, Eye, Edit2, Trash2, ChevronRight,
  Loader2, Calendar, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { getApiClient } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import { hasRole } from "@/lib/rbac";
import type { Report } from "@/types/reports";

export default function ReportsList() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const role = useRole();
  const api = getApiClient();
  const canEdit = hasRole(role, "AGENCY_ADMIN");

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["reports", campaignId],
    queryFn: async () => {
      const res = await api.get<Report[]>(`/campaigns/${campaignId}/reports`);
      return res.data;
    },
    enabled: !!campaignId,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post<Report>(`/campaigns/${campaignId}/reports`, { name });
      return res.data;
    },
    onSuccess: (report) => {
      qc.invalidateQueries({ queryKey: ["reports", campaignId] });
      setCreateOpen(false);
      setCreateName("");
      navigate(`/clients/${clientId}/campaigns/${campaignId}/reports/${report.id}`);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Failed to create report");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/campaigns/${campaignId}/reports/${reportId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports", campaignId] });
      setDeleteTarget(null);
      toast.success("Report deleted");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Failed to delete report");
    },
  });

  const handleCreate = () => {
    if (!createName.trim() || createMutation.isPending) return;
    createMutation.mutate(createName.trim());
  };

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[1200px]">
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
        <Link to={`/clients/${clientId}/campaigns/${campaignId}`} className="hover:text-foreground transition-colors font-medium">Campaign</Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-foreground font-semibold">Reports</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Reports</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            Build and share performance reports with your clients.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
          >
            <Plus className="size-4" />
            New Report
          </button>
        )}
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="bg-white rounded-2xl py-16 text-center px-4"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div
            className="mx-auto mb-4 size-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(91,71,224,0.08)' }}
          >
            <FileText className="size-7" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-sm font-semibold text-foreground">No reports yet</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            {canEdit
              ? "Create your first report to share performance data with clients."
              : "No reports have been created for this campaign yet."}
          </p>
          {canEdit && (
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <Plus className="size-3.5" />
              Create First Report
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {reports.map((report, i) => {
            const isPublished = report.status === "PUBLISHED";
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" as const }}
                className="bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-shadow"
                style={{ border: '1px solid #ECECE6' }}
              >
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  {/* Icon */}
                  <div
                    className="size-10 sm:size-11 rounded-xl shrink-0 flex items-center justify-center"
                    style={{
                      background: isPublished ? 'rgba(16,217,160,0.10)' : 'rgba(91,71,224,0.08)',
                    }}
                  >
                    <FileText
                      className="size-5"
                      style={{ color: isPublished ? '#10D9A0' : '#5B47E0' }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/clients/${clientId}/campaigns/${campaignId}/reports/${report.id}`}
                        className="font-heading font-semibold text-sm text-foreground hover:underline truncate"
                      >
                        {report.name}
                      </Link>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                        style={isPublished
                          ? { background: 'rgba(16,217,160,0.12)', color: '#10D9A0' }
                          : { background: 'rgba(0,0,0,0.06)', color: '#6b7280' }
                        }
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Layers className="size-3" />
                        {report.sections?.length ?? 0} section{(report.sections?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      to={`/clients/${clientId}/campaigns/${campaignId}/reports/${report.id}`}
                      className="p-2 rounded-xl transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="View"
                    >
                      <Eye className="size-3.5" />
                    </Link>
                    {canEdit && (
                      <>
                        <Link
                          to={`/clients/${clientId}/campaigns/${campaignId}/reports/${report.id}/edit`}
                          className="p-2 rounded-xl transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Edit2 className="size-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(report)}
                          className="p-2 rounded-xl transition-colors text-muted-foreground hover:text-red-500"
                          style={{ ':hover': { background: 'rgba(244,63,94,0.06)' } } as any}
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => { setCreateOpen(false); setCreateName(""); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              style={{ border: '1px solid #ECECE6' }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #5B47E0, #7C3AED)' }} />
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
                    <FileText className="size-4" style={{ color: '#5B47E0' }} />
                  </div>
                  <h2 className="font-heading font-semibold text-base text-foreground">Create Report</h2>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Report name</label>
                  <input
                    autoFocus
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="e.g. Monthly Performance Report"
                    className="w-full h-10 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none transition-shadow"
                    style={{ border: '1px solid #ECECE6', boxShadow: '0 0 0 0 transparent' }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.15)'; e.currentTarget.style.borderColor = '#5B47E0'; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#ECECE6'; }}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => { setCreateOpen(false); setCreateName(""); }}
                    className="h-9 px-4 rounded-xl text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
                    style={{ border: '1px solid #ECECE6' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!createName.trim() || createMutation.isPending}
                    className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                  >
                    {createMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                    {createMutation.isPending ? 'Creating…' : 'Create Report'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              style={{ border: '1px solid rgba(244,63,94,0.25)' }}
            >
              <div className="h-1 w-full" style={{ background: '#f43f5e' }} />
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.10)' }}>
                    <Trash2 className="size-4" style={{ color: '#f43f5e' }} />
                  </div>
                  <h2 className="font-heading font-semibold text-base text-foreground">Delete Report?</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">"{deleteTarget.name}"</span> will be permanently deleted and cannot be recovered.
                </p>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="h-9 px-4 rounded-xl text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
                    style={{ border: '1px solid #ECECE6' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(deleteTarget.id)}
                    disabled={deleteMutation.isPending}
                    className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #f43f5e, #fb7185)' }}
                  >
                    {deleteMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                    {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
