import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight, Plus, Trash2, Loader2, Users,
  UserPlus, Globe, Mail, RefreshCw, X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/lib/api";
import { useHasRole } from "@/hooks/useRole";
import type { TeamMember, StaffAssignment } from "@/types/team";
import type { Client } from "@/types/clients";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortalUser {
  id: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    emailVerifiedAt: string | null;
  };
}

// ─── Gradient helpers ─────────────────────────────────────────────────────────

const MEMBER_GRADIENTS = [
  'linear-gradient(135deg, #5B47E0, #8B5CF6)',
  'linear-gradient(135deg, #FF7A59, #F5A524)',
  'linear-gradient(135deg, #10D9A0, #06b6d4)',
  'linear-gradient(135deg, #f43f5e, #ec4899)',
  'linear-gradient(135deg, #8B5CF6, #6366f1)',
];

function getGradient(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return MEMBER_GRADIENTS[Math.abs(hash) % MEMBER_GRADIENTS.length];
}

function Avatar({ name, size = 9 }: { name: string; size?: number }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2);
  const sizeClass = `size-${size}`;
  return (
    <div
      className={`${sizeClass} rounded-none shrink-0 flex items-center justify-center text-white text-xs font-bold`}
      style={{ background: getGradient(name) }}
    >
      {initials.toUpperCase()}
    </div>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useClient(clientId: string) {
  return useQuery<Client>({
    queryKey: ["client", clientId],
    queryFn: () => api.get<Client>(`/clients/${clientId}`).then((r) => r.data),
    staleTime: 60_000,
  });
}

function useAssignments(clientId: string) {
  return useQuery<StaffAssignment[]>({
    queryKey: ["assignments", clientId],
    queryFn: () => api.get<StaffAssignment[]>(`/clients/${clientId}/assignments`).then((r) => r.data),
    staleTime: 30_000,
  });
}

function useTeam() {
  return useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: () => api.get<TeamMember[]>("/team").then((r) => r.data),
    staleTime: 60_000,
  });
}

function usePortalUsers(clientId: string) {
  return useQuery<PortalUser[]>({
    queryKey: ["portal-users", clientId],
    queryFn: () => api.get<PortalUser[]>(`/clients/${clientId}/portal-users`).then((r) => r.data),
    staleTime: 30_000,
  });
}

function useAssignStaff(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<StaffAssignment>(`/clients/${clientId}/assignments`, { userId }).then((r) => r.data),
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: ["assignments", clientId] });
      const prev = qc.getQueryData<StaffAssignment[]>(["assignments", clientId]);
      const allMembers = qc.getQueryData<TeamMember[]>(["team"]);
      const user = allMembers?.find((m) => m.id === userId);
      if (user) {
        qc.setQueryData<StaffAssignment[]>(["assignments", clientId], (old) => [
          ...(old ?? []),
          { id: `optimistic-${Date.now()}`, createdAt: new Date().toISOString(),
            user: { id: user.id, firstName: user.firstName, lastName: user.lastName,
              email: user.email, role: user.role, isActive: user.isActive } },
        ]);
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["assignments", clientId], ctx.prev);
      toast.error("Failed to assign staff");
    },
    onSuccess: () => toast.success("Staff assigned"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["assignments", clientId] }),
  });
}

function useUnassignStaff(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/clients/${clientId}/assignments/${userId}`),
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: ["assignments", clientId] });
      const prev = qc.getQueryData<StaffAssignment[]>(["assignments", clientId]);
      qc.setQueryData<StaffAssignment[]>(["assignments", clientId], (old) =>
        (old ?? []).filter((a) => a.user.id !== userId)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["assignments", clientId], ctx.prev);
      toast.error("Failed to remove assignment");
    },
    onSuccess: () => toast.success("Staff unassigned"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["assignments", clientId] }),
  });
}

function useInvitePortalUser(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { firstName: string; lastName: string; email: string }) =>
      api.post("/team/invite-client", { ...dto, clientId }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Invite sent — they'll receive an email to set up their login");
      qc.invalidateQueries({ queryKey: ["portal-users", clientId] });
    },
    onError: () => toast.error("Failed to send invite"),
  });
}

function useResendClientInvite(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api.post("/team/resend-client-invite", { email }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Invite resent");
      qc.invalidateQueries({ queryKey: ["portal-users", clientId] });
    },
    onError: () => toast.error("Failed to resend invite"),
  });
}

function useRevokePortalUser(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/clients/${clientId}/portal-users/${userId}`),
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: ["portal-users", clientId] });
      const prev = qc.getQueryData<PortalUser[]>(["portal-users", clientId]);
      qc.setQueryData<PortalUser[]>(["portal-users", clientId], (old) =>
        (old ?? []).filter((p) => p.user.id !== userId)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["portal-users", clientId], ctx.prev);
      toast.error("Failed to revoke access");
    },
    onSuccess: () => toast.success("Portal access revoked"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["portal-users", clientId] }),
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  icon: Icon, iconColor, iconBg, title, count, action, children, delay,
}: {
  icon: React.ElementType; iconColor: string; iconBg: string;
  title: string; count?: number; action?: React.ReactNode; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay ?? 0, ease: "easeOut" as const }}
      className="bg-white rounded-none overflow-hidden"
      style={{ border: '1px solid #ECECE6' }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-none flex items-center justify-center" style={{ background: iconBg }}>
            <Icon className="size-3.5" style={{ color: iconColor }} />
          </div>
          <h2 className="font-heading font-semibold text-sm text-foreground">{title}</h2>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground">{count} {count !== 1 ? "members" : "member"}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Assign staff dialog ──────────────────────────────────────────────────────

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: string;
  assignedUserIds: Set<string>;
}

function AssignDialog({ open, onOpenChange, clientId, assignedUserIds }: AssignDialogProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const { data: allMembers } = useTeam();
  const assign = useAssignStaff(clientId);

  const availableStaff = (allMembers ?? []).filter(
    (m) => m.role === "AGENCY_STAFF" && m.isActive && m.emailVerifiedAt !== null && !assignedUserIds.has(m.id)
  );

  const handleAssign = async () => {
    if (!selectedId) return;
    await assign.mutateAsync(selectedId);
    setSelectedId("");
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setSelectedId(""); onOpenChange(false); }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            className="relative bg-white rounded-none shadow-2xl w-full max-w-md overflow-hidden"
            style={{ border: '1px solid #ECECE6' }}
          >
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #5B47E0, #7C3AED)' }} />
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-none flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
                    <UserPlus className="size-4" style={{ color: '#5B47E0' }} />
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-base">Assign staff to client</h2>
                    <p className="text-xs text-muted-foreground">Only active unassigned staff shown</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedId(""); onOpenChange(false); }} className="p-1.5 rounded-none hover:bg-muted transition-colors text-muted-foreground">
                  <X className="size-4" />
                </button>
              </div>

              {availableStaff.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground rounded-none" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid #ECECE6' }}>
                  All active staff are already assigned or there are no active staff yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staff member</label>
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-none bg-background text-foreground focus:outline-none appearance-none"
                    style={{ border: '1px solid #ECECE6' }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.15)'; e.currentTarget.style.borderColor = '#0F172A'; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#ECECE6'; }}
                  >
                    <option value="">Select a staff member…</option>
                    {availableStaff.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} — {m.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => { setSelectedId(""); onOpenChange(false); }}
                  className="h-9 px-4 rounded-none text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedId || assign.isPending || availableStaff.length === 0}
                  className="h-9 px-4 rounded-none text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                >
                  {assign.isPending && <Loader2 className="size-3.5 animate-spin" />}
                  Assign
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Invite portal user dialog ────────────────────────────────────────────────

function InvitePortalDialog({
  open, onOpenChange, clientId,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; clientId: string;
}) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const invite = useInvitePortalUser(clientId);

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.email.trim()) return;
    await invite.mutateAsync(form);
    setForm({ firstName: "", lastName: "", email: "" });
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setForm({ firstName: "", lastName: "", email: "" }); onOpenChange(false); }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            className="relative bg-white rounded-none shadow-2xl w-full max-w-md overflow-hidden"
            style={{ border: '1px solid #ECECE6' }}
          >
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #10D9A0, #06b6d4)' }} />
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-none flex items-center justify-center" style={{ background: 'rgba(16,217,160,0.10)' }}>
                    <Mail className="size-4" style={{ color: '#10D9A0' }} />
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-base">Invite portal user</h2>
                    <p className="text-xs text-muted-foreground">They'll receive an email to set up their login</p>
                  </div>
                </div>
                <button
                  onClick={() => { setForm({ firstName: "", lastName: "", email: "" }); onOpenChange(false); }}
                  className="p-1.5 rounded-none hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "firstName", label: "First name", placeholder: "John", required: true },
                  { key: "lastName", label: "Last name", placeholder: "Smith", required: false },
                ].map(({ key, label, placeholder, required }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      type="text"
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full h-10 px-3 text-sm rounded-none bg-background text-foreground focus:outline-none"
                      style={{ border: '1px solid #ECECE6' }}
                      onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,217,160,0.12)'; e.currentTarget.style.borderColor = '#10D9A0'; }}
                      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#ECECE6'; }}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@nike.com"
                  className="w-full h-10 px-3 text-sm rounded-none bg-background text-foreground focus:outline-none"
                  style={{ border: '1px solid #ECECE6' }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,217,160,0.12)'; e.currentTarget.style.borderColor = '#10D9A0'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#ECECE6'; }}
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => { setForm({ firstName: "", lastName: "", email: "" }); onOpenChange(false); }}
                  className="h-9 px-4 rounded-none text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.firstName.trim() || !form.email.trim() || invite.isPending}
                  className="h-9 px-4 rounded-none text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10D9A0, #06b6d4)' }}
                >
                  {invite.isPending && <Loader2 className="size-3.5 animate-spin" />}
                  {invite.isPending ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, onClose, title, description, onConfirm, confirmLabel, isPending,
}: {
  open: boolean; onClose: () => void; title: string; description: React.ReactNode;
  onConfirm: () => void; confirmLabel: string; isPending?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            className="relative bg-white rounded-none shadow-2xl w-full max-w-sm overflow-hidden"
            style={{ border: '1px solid rgba(244,63,94,0.25)' }}
          >
            <div className="h-1 w-full" style={{ background: '#f43f5e' }} />
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-none flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.10)' }}>
                  <Trash2 className="size-4" style={{ color: '#f43f5e' }} />
                </div>
                <h2 className="font-heading font-semibold text-base">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={onClose}
                  className="h-9 px-4 rounded-none text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className="h-9 px-4 rounded-none text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #fb7185)' }}
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientTeamPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [assignOpen, setAssignOpen] = useState(false);
  const [invitePortalOpen, setInvitePortalOpen] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  const canEdit = useHasRole("AGENCY_ADMIN");
  const { data: client } = useClient(clientId!);
  const { data: assignments, isLoading: staffLoading } = useAssignments(clientId!);
  const { data: portalUsers, isLoading: portalLoading } = usePortalUsers(clientId!);
  const unassign = useUnassignStaff(clientId!);
  const revoke = useRevokePortalUser(clientId!);
  const resend = useResendClientInvite(clientId!);

  const assignedUserIds = new Set(assignments?.map((a) => a.user.id) ?? []);
  const removingAssignment = assignments?.find((a) => a.user.id === removingUserId);
  const revokingPortalUser = portalUsers?.find((p) => p.user.id === revokingUserId);

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[900px] mx-auto">
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
        <span className="text-foreground font-semibold">Team</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Client Team</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
          Manage who has access to {client?.name ?? "this client"}
        </p>
      </motion.div>

      {/* ── Section 1: Staff assignments ──────────────────────────────────────── */}
      <SectionCard
        icon={Users}
        iconColor="#5B47E0"
        iconBg="rgba(91,71,224,0.10)"
        title="Assigned Staff"
        count={!staffLoading ? (assignments?.length ?? 0) : undefined}
        delay={0.05}
        action={
          canEdit ? (
            <button
              onClick={() => setAssignOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-none text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <UserPlus className="size-3.5" />
              Assign Staff
            </button>
          ) : undefined
        }
      >
        {staffLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !assignments || assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="size-10 rounded-none flex items-center justify-center mb-3" style={{ background: 'rgba(91,71,224,0.06)' }}>
              <Users className="size-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No staff assigned yet.</p>
            {canEdit && (
              <button
                onClick={() => setAssignOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-none text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
              >
                <Plus className="size-3.5" />
                Assign first member
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F5F5F0' }}>
            {assignments.map((assignment, i) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" as const }}
                className="flex items-center gap-3 px-5 py-3.5 group hover:bg-muted/30 transition-colors"
              >
                <Avatar name={`${assignment.user.firstName} ${assignment.user.lastName}`} size={9} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {assignment.user.firstName} {assignment.user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{assignment.user.email}</p>
                </div>
                <span
                  className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-none"
                  style={{ background: 'rgba(91,71,224,0.08)', color: '#5B47E0' }}
                >
                  Staff
                </span>
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{formatDate(assignment.createdAt)}</span>
                {canEdit && (
                  <button
                    onClick={() => setRemovingUserId(assignment.user.id)}
                    className="p-1.5 rounded-none opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Section 2: Portal access ──────────────────────────────────────────── */}
      <SectionCard
        icon={Globe}
        iconColor="#10D9A0"
        iconBg="rgba(16,217,160,0.10)"
        title="Portal Access"
        count={!portalLoading ? (portalUsers?.length ?? 0) : undefined}
        delay={0.1}
        action={
          canEdit ? (
            <button
              onClick={() => setInvitePortalOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-none text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #10D9A0, #06b6d4)' }}
            >
              <Mail className="size-3.5" />
              Invite User
            </button>
          ) : undefined
        }
      >
        <div className="px-5 pt-3 pb-1">
          <p className="text-xs text-muted-foreground">
            These people can log into the client portal to view dashboards and reports — read-only, no admin access.
          </p>
        </div>

        {portalLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !portalUsers || portalUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="size-10 rounded-none flex items-center justify-center mb-3" style={{ background: 'rgba(16,217,160,0.06)' }}>
              <Globe className="size-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No portal users yet.</p>
            {canEdit && (
              <button
                onClick={() => setInvitePortalOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-none text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #10D9A0, #06b6d4)' }}
              >
                <Plus className="size-3.5" />
                Invite first user
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y mt-3" style={{ borderColor: '#F5F5F0' }}>
            {portalUsers.map((pu, i) => {
              const isPending = !pu.user.emailVerifiedAt;
              return (
                <motion.div
                  key={pu.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" as const }}
                  className="flex items-center gap-3 px-5 py-3.5 group hover:bg-muted/30 transition-colors"
                >
                  <Avatar name={`${pu.user.firstName} ${pu.user.lastName}`} size={9} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {pu.user.firstName} {pu.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{pu.user.email}</p>
                  </div>
                  <span
                    className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-none"
                    style={isPending
                      ? { background: 'rgba(245,165,36,0.12)', color: '#d97706' }
                      : { background: 'rgba(16,217,160,0.12)', color: '#10D9A0' }
                    }
                  >
                    {isPending ? 'Pending' : 'Active'}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{formatDate(pu.createdAt)}</span>
                  {canEdit && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPending && (
                        <button
                          className="h-7 px-2 rounded-none text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1 disabled:opacity-50"
                          disabled={resend.isPending}
                          onClick={() => resend.mutate(pu.user.email)}
                        >
                          <RefreshCw className="size-3" />
                          Resend
                        </button>
                      )}
                      <button
                        onClick={() => setRevokingUserId(pu.user.id)}
                        className="p-1.5 rounded-none text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      {canEdit && (
        <>
          <AssignDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            clientId={clientId!}
            assignedUserIds={assignedUserIds}
          />
          <InvitePortalDialog
            open={invitePortalOpen}
            onOpenChange={setInvitePortalOpen}
            clientId={clientId!}
          />
        </>
      )}

      <ConfirmDialog
        open={!!removingUserId}
        onClose={() => setRemovingUserId(null)}
        title="Remove staff from client?"
        description={
          removingAssignment ? (
            <>
              <span className="font-medium text-foreground">
                {removingAssignment.user.firstName} {removingAssignment.user.lastName}
              </span>
              {" "}will immediately lose access to this client and its campaigns.
            </>
          ) : ""
        }
        confirmLabel="Remove"
        isPending={unassign.isPending}
        onConfirm={() => {
          if (removingUserId) { unassign.mutate(removingUserId); setRemovingUserId(null); }
        }}
      />

      <ConfirmDialog
        open={!!revokingUserId}
        onClose={() => setRevokingUserId(null)}
        title="Revoke portal access?"
        description={
          revokingPortalUser ? (
            <>
              <span className="font-medium text-foreground">
                {revokingPortalUser.user.firstName} {revokingPortalUser.user.lastName}
              </span>
              {" "}will immediately lose access to the client portal. They'll need a new invite to regain access.
            </>
          ) : ""
        }
        confirmLabel="Revoke access"
        isPending={revoke.isPending}
        onConfirm={() => {
          if (revokingUserId) { revoke.mutate(revokingUserId); setRevokingUserId(null); }
        }}
      />
    </div>
  );
}
