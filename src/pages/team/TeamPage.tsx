import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Settings, Trash2, Loader2, UsersRound,
  RefreshCw, ShieldCheck, Crown, User, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRole } from "@/hooks/useRole";
import type { TeamMember } from "@/types/team";

// ─── Queries / mutations ───────────────────────────────────────────────────────

function useTeam() {
  return useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: () => api.get<TeamMember[]>("/team").then((r) => r.data),
    staleTime: 30_000,
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

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string; border: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  AGENCY_OWNER: { label: 'Owner', bg: 'rgba(91,71,224,0.10)', color: '#5B47E0', border: '1px solid rgba(91,71,224,0.20)', icon: Crown },
  AGENCY_ADMIN: { label: 'Admin', bg: 'rgba(16,217,160,0.10)', color: '#059669', border: '1px solid rgba(16,217,160,0.22)', icon: ShieldCheck },
  AGENCY_STAFF: { label: 'Staff', bg: 'rgba(156,163,175,0.10)', color: '#6B7280', border: '1px solid rgba(156,163,175,0.18)', icon: User },
};

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// MemberMenu and RemoveModal removed (moved to profile page)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { data: members, isLoading } = useTeam();

  return (
    <div className="flex-1 w-full flex flex-col pt-10 pb-20 px-6 sm:px-10 lg:px-16 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 max-w-7xl mx-auto w-full">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
              <UsersRound className="size-5" style={{ color: '#5B47E0' }} />
            </div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Team Management</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Manage your agency staff. Admins have full platform access, while Staff can only access clients assigned to them.
          </p>
        </div>
        <Link
          to="/team/invite"
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 shadow-sm shrink-0"
          style={{ background: 'var(--foreground)' }}
        >
          <UserPlus className="size-4" />
          Invite Staff
        </Link>
      </div>

      <div className="w-full max-w-7xl mx-auto flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-md h-52 border border-[#ECECE6] animate-pulse" />
            ))}
          </div>
        ) : members && members.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map((member) => {
              const pending = isPending(member);
              const conf = ROLE_CONFIG[member.role] || ROLE_CONFIG.AGENCY_STAFF;
              const RoleIcon = conf.icon;
              const avatar = member.avatarUrl;
              const jobTitle = member.jobTitle;

              return (
                <Link
                  key={member.id}
                  to={`/team/${member.id}`}
                  className="group relative bg-white rounded-md p-5 flex flex-col items-center text-center transition-colors hover:border-[#5B47E0]"
                  style={{ border: '1px solid #d1d5db' }}
                >
                  <div className="absolute top-3 right-3 z-10 text-muted-foreground group-hover:text-foreground transition-colors">
                    <Settings className="size-4" />
                  </div>

                  <div className="relative mb-3 mt-1">
                    {avatar ? (
                      <img src={avatar} alt={member.firstName} className="size-16 rounded-md object-cover border border-[#ECECE6]" />
                    ) : (
                      <div className="size-16 rounded-md flex items-center justify-center" style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                        <span className="text-xl font-bold text-muted-foreground">{getInitials(member.firstName, member.lastName)}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-foreground mb-1">
                    {member.firstName} {member.lastName}
                  </h3>
                  
                  {jobTitle ? (
                    <p className="text-[11px] font-medium text-muted-foreground mb-3">{jobTitle}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mb-3 truncate max-w-full px-2">{member.email}</p>
                  )}

                  <div className="mt-auto flex items-center justify-center gap-2 w-full">
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                      style={{ background: conf.bg, border: conf.border }}
                    >
                      <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: conf.color }}>
                        {conf.label}
                      </span>
                    </div>
                    {pending && (
                      <div className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase bg-amber-100 text-amber-700 border border-amber-200">
                        Pending
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-md border border-[#ECECE6]">
            <UsersRound className="size-10 text-muted-foreground/50 mb-3" />
            <h3 className="font-heading font-semibold text-foreground">No team members</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">You are the only member of this agency. Invite staff to collaborate.</p>
          </div>
        )}
      </div>
    </div>
  );
}
