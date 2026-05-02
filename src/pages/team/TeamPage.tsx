import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, MoreHorizontal, Trash2, Loader2, UsersRound,
  RefreshCw, ShieldCheck, Clock, Crown, User, AlertCircle,
  Mail, UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRole } from "@/hooks/useRole";
import type { TeamMember, InviteStaffDto } from "@/types/team";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName:  z.string().min(1, "Last name is required").max(100),
  email:     z.string().email("Valid email required").max(100),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

// ─── Queries / mutations ───────────────────────────────────────────────────────

function useTeam() {
  return useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: () => api.get<TeamMember[]>("/team").then((r) => r.data),
    staleTime: 30_000,
  });
}

function useInviteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: InviteStaffDto) => api.post("/team/invite", dto).then((r) => r.data),
    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey: ["team"] });
      const prev = qc.getQueryData<TeamMember[]>(["team"]);
      qc.setQueryData<TeamMember[]>(["team"], (old) => [
        ...(old ?? []),
        {
          id: `optimistic-${Date.now()}`,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          role: "AGENCY_STAFF",
          isActive: false,
          emailVerifiedAt: null,
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
        },
      ]);
      return { prev };
    },
    onError: (_err, _dto, ctx) => {
      if (ctx?.prev) qc.setQueryData(["team"], ctx.prev);
      toast.error("Failed to send invite");
    },
    onSuccess: () => toast.success("Invite sent"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

function useResendInvite() {
  return useMutation({
    mutationFn: (email: string) => api.post("/team/resend-invite", { email }).then((r) => r.data),
    onSuccess: () => toast.success("Invite resent"),
    onError: () => toast.error("Failed to resend invite"),
  });
}

function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/team/${userId}`).then((r) => r.data),
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: ["team"] });
      const prev = qc.getQueryData<TeamMember[]>(["team"]);
      qc.setQueryData<TeamMember[]>(["team"], (old) => (old ?? []).filter((m) => m.id !== userId));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["team"], ctx.prev);
      toast.error("Failed to remove member");
    },
    onSuccess: () => toast.success("Member removed"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPending(member: TeamMember) {
  return member.emailVerifiedAt === null;
}

function formatRelativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function inputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
}
function inputBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string; border: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  AGENCY_OWNER: { label: 'Owner', bg: 'rgba(91,71,224,0.10)', color: '#5B47E0', border: '1px solid rgba(91,71,224,0.20)', icon: Crown },
  AGENCY_ADMIN: { label: 'Admin', bg: 'rgba(16,217,160,0.10)', color: '#059669', border: '1px solid rgba(16,217,160,0.22)', icon: ShieldCheck },
  AGENCY_STAFF: { label: 'Staff', bg: 'rgba(156,163,175,0.10)', color: '#6B7280', border: '1px solid rgba(156,163,175,0.18)', icon: User },
};

const MEMBER_GRADIENTS = [
  'linear-gradient(135deg, #5B47E0, #8B5CF6)',
  'linear-gradient(135deg, #FF7A59, #FF9A76)',
  'linear-gradient(135deg, #10D9A0, #34d399)',
  'linear-gradient(135deg, #F5A524, #fbbf24)',
  'linear-gradient(135deg, #5B47E0, #FF7A59)',
  'linear-gradient(135deg, #10D9A0, #5B47E0)',
];

// ─── Member action dropdown ────────────────────────────────────────────────────

function MemberMenu({
  member,
  onResend,
  onRemove,
  resendPending,
}: {
  member: TeamMember;
  onResend: () => void;
  onRemove: () => void;
  resendPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const showResend = isPending(member);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.04)' }}
      >
        <MoreHorizontal className="size-3.5 text-muted-foreground" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" as const }}
            className="absolute right-0 top-9 z-50 w-44 bg-white rounded-xl overflow-hidden py-1"
            style={{ border: '1px solid #ECECE6', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
          >
            {showResend && (
              <button
                onClick={() => { setOpen(false); onResend(); }}
                disabled={resendPending}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-[#FAFAF7] transition-colors disabled:opacity-50"
              >
                <RefreshCw className="size-3.5 text-muted-foreground" />
                Resend invite
              </button>
            )}
            <button
              onClick={() => { setOpen(false); onRemove(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors"
              style={{ color: '#f43f5e' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244,63,94,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Trash2 className="size-3.5" />
              Remove
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const invite = useInviteStaff();
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { firstName: "", lastName: "", email: "" },
  });

  const onSubmit = async (values: InviteFormValues) => {
    await invite.mutateAsync(values);
    onClose();
    form.reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden w-full max-w-md mx-auto"
        style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED)' }} />
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
              <UserPlus className="size-4" style={{ color: '#5B47E0' }} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-foreground">Invite Staff Member</h2>
              <p className="text-xs text-muted-foreground mt-0.5">They'll receive an email to set their password. Invites expire after 48h.</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">First Name</label>
                <input
                  autoFocus
                  placeholder="Jane"
                  className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white"
                  style={{ border: '1px solid #ECECE6' }}
                  onFocus={inputFocus} onBlur={inputBlur}
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <p className="text-[10px]" style={{ color: '#f43f5e' }}>{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Last Name</label>
                <input
                  placeholder="Smith"
                  className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white"
                  style={{ border: '1px solid #ECECE6' }}
                  onFocus={inputFocus} onBlur={inputBlur}
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-[10px]" style={{ color: '#f43f5e' }}>{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="jane@agency.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-all bg-white"
                  style={{ border: '1px solid #ECECE6' }}
                  onFocus={inputFocus} onBlur={inputBlur}
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-[10px]" style={{ color: '#f43f5e' }}>{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={invite.isPending}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
              >
                {invite.isPending && <Loader2 className="size-3.5 animate-spin" />}
                {invite.isPending ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Remove confirm modal ─────────────────────────────────────────────────────

function RemoveModal({ member, onClose, onConfirm, isPending }: { member: TeamMember; onClose: () => void; onConfirm: () => void; isPending: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden w-full max-w-sm mx-auto"
        style={{ border: '1px solid rgba(244,63,94,0.20)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#e11d48)' }} />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(244,63,94,0.10)' }}>
              <Trash2 className="size-4" style={{ color: '#f43f5e' }} />
            </div>
            <h2 className="font-heading font-bold text-base text-foreground">Remove Member?</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{member.firstName} {member.lastName}</span> will immediately lose access to all clients and campaigns. Their sessions will be revoked.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors"
              style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isPending ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const currentUser = useAuthStore((s) => s.user);
  const currentRole = useRole();
  const isOwner = currentRole === "AGENCY_OWNER";

  const { data: members, isLoading } = useTeam();
  const resend = useResendInvite();
  const remove = useRemoveMember();

  function canRemove(member: TeamMember) {
    if (!isOwner) return false;
    if (member.id === currentUser?.id) return false;
    if (member.role === "AGENCY_OWNER") return false;
    return true;
  }

  const removingMember = members?.find((m) => m.id === removingId) ?? null;
  const activeCount  = (members ?? []).filter((m) => !isPending(m)).length;
  const pendingCount = (members ?? []).filter((m) =>  isPending(m)).length;

  return (
    <div className="p-5 lg:p-7 space-y-6 pb-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-tight text-foreground">Team</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${activeCount} active · ${pendingCount} pending`}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
          >
            <Plus className="size-3.5" />
            Invite Staff
          </button>
        )}
      </motion.div>

      {/* Members card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED)' }} />
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
              <UsersRound className="size-3.5" style={{ color: '#5B47E0' }} />
            </div>
            <span className="font-heading font-semibold text-sm">Members</span>
            {!isLoading && members && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(91,71,224,0.08)', color: '#5B47E0' }}>
                {members.length}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
                <div className="size-10 rounded-xl animate-pulse bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : !members || members.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.08)' }}>
              <UsersRound className="size-7" style={{ color: '#5B47E0' }} />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground">No team members yet</p>
              <p className="text-sm text-muted-foreground mt-1">Invite staff to collaborate on client campaigns.</p>
            </div>
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <Plus className="size-3.5" />
              Invite your first staff member
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#ECECE6' }}>
            {members.map((member, i) => {
              const pending   = isPending(member);
              const isMe      = member.id === currentUser?.id;
              const roleCfg   = ROLE_CONFIG[member.role] ?? ROLE_CONFIG['AGENCY_STAFF'];
              const RoleIcon  = roleCfg.icon;
              const gradient  = MEMBER_GRADIENTS[i % MEMBER_GRADIENTS.length];
              const initials  = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
              const showMenu  = pending || canRemove(member);

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" as const }}
                  className="group flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAF7] transition-colors"
                >
                  <div
                    className="size-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: gradient }}
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground">
                        {member.firstName} {member.lastName}
                      </p>
                      {isMe && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.05)', color: '#9CA3AF' }}>
                          you
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>

                  <div className="hidden sm:flex items-center shrink-0">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-xl"
                      style={{ background: roleCfg.bg, color: roleCfg.color, border: roleCfg.border }}
                    >
                      <RoleIcon className="size-2.5" />
                      {roleCfg.label}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center shrink-0 min-w-[100px]">
                    {pending ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-xl w-fit" style={{ background: 'rgba(245,165,36,0.12)', color: '#d97706', border: '1px solid rgba(245,165,36,0.20)' }}>
                          <Clock className="size-2.5" />Pending
                        </span>
                        <span className="text-[10px] text-muted-foreground">Invited {formatRelativeDate(member.createdAt)}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-xl" style={{ background: 'rgba(16,217,160,0.10)', color: '#059669', border: '1px solid rgba(16,217,160,0.22)' }}>
                        Active
                      </span>
                    )}
                  </div>

                  <div className="hidden lg:block shrink-0 text-xs text-muted-foreground min-w-[90px] text-right">
                    {formatDate(member.lastLoginAt)}
                  </div>

                  <div className="flex items-center justify-end shrink-0 w-8">
                    {showMenu && (
                      <MemberMenu
                        member={member}
                        onResend={() => resend.mutate(member.email)}
                        onRemove={() => setRemovingId(member.id)}
                        resendPending={resend.isPending}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {removingMember && (
          <RemoveModal
            member={removingMember}
            onClose={() => setRemovingId(null)}
            onConfirm={() => { remove.mutate(removingMember.id); setRemovingId(null); }}
            isPending={remove.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
