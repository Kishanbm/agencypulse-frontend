import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Mail, Clock, ShieldCheck, Crown, User, 
  Briefcase, Activity, CalendarDays, ExternalLink, Globe, Trash2, Loader2,
  Edit2, RefreshCw, Camera
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRole } from "@/hooks/useRole";

type StaffProfileData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  jobTitle: string | null;
  description: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  assignedClients: Array<{ id: string; name: string; logoUrl: string | null; website: string | null }>;
  auditLogs: Array<{ id: string; action: string; resourceType: string; resourceName: string; createdAt: string }>;
};

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string; border: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  AGENCY_OWNER: { label: 'Owner', bg: 'rgba(91,71,224,0.10)', color: '#5B47E0', border: '1px solid rgba(91,71,224,0.20)', icon: Crown },
  AGENCY_ADMIN: { label: 'Admin', bg: 'rgba(16,217,160,0.10)', color: '#059669', border: '1px solid rgba(16,217,160,0.22)', icon: ShieldCheck },
  AGENCY_STAFF: { label: 'Staff', bg: 'rgba(156,163,175,0.10)', color: '#6B7280', border: '1px solid rgba(156,163,175,0.18)', icon: User },
};

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Remove confirm modal ─────────────────────────────────────────────────────

function RemoveModal({ profile, onClose, onConfirm, isPending }: { profile: StaffProfileData; onClose: () => void; onConfirm: () => void; isPending: boolean }) {
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
        className="bg-white rounded-md overflow-hidden w-full max-w-sm mx-auto"
        style={{ border: '1px solid rgba(244,63,94,0.20)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#e11d48)' }} />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(244,63,94,0.10)' }}>
              <Trash2 className="size-4" style={{ color: '#f43f5e' }} />
            </div>
            <h2 className="font-heading font-bold text-base text-foreground">Remove Member?</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{profile.firstName} {profile.lastName}</span> will immediately lose access to all clients and campaigns. Their sessions will be revoked.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold rounded-md transition-colors"
              style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-md text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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

function EditModal({
  profile,
  onClose,
  onSave,
  isPending
}: {
  profile: StaffProfileData;
  onClose: () => void;
  onSave: (values: { jobTitle: string; description: string }) => Promise<void>;
  isPending: boolean;
}) {
  const [jobTitle, setJobTitle] = useState(profile.jobTitle || "");
  const [description, setDescription] = useState(profile.description || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ jobTitle, description });
  };

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
        className="bg-white rounded-md overflow-hidden w-full max-w-lg mx-auto"
        style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#7C3AED)' }} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-[#ECECE6]">
            <div className="size-9 rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
              <Edit2 className="size-4" style={{ color: '#5B47E0' }} />
            </div>
            <h2 className="font-heading font-bold text-base text-foreground">Edit Staff Member Details</h2>
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="jobTitle" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Job Title
              </label>
              <input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior SEO Specialist"
                className="w-full px-3.5 py-2 text-sm rounded-md bg-white border border-[#ECECE6] text-foreground focus:outline-none transition-all placeholder:text-muted-foreground/50"
                style={{ fontFamily: 'inherit' }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#5B47E0';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#ECECE6';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description / Bio
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief description of their role or bio..."
                className="w-full px-3.5 py-2 text-sm rounded-md bg-white border border-[#ECECE6] text-foreground focus:outline-none transition-all placeholder:text-muted-foreground/50 resize-none"
                style={{ fontFamily: 'inherit' }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#5B47E0';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#ECECE6';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-[#ECECE6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold rounded-md transition-colors"
              style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--foreground)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-md text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function StaffProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading } = useQuery<StaffProfileData>({
    queryKey: ["team", id],
    queryFn: () => api.get<StaffProfileData>(`/team/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const currentRole = useRole();
  const isOwner = currentRole === "AGENCY_OWNER";

  const remove = useMutation({
    mutationFn: () => api.delete(`/team/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: ["team"] });
      navigate("/team");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const editProfile = useMutation({
    mutationFn: (values: { jobTitle: string; description: string }) =>
      api.patch(`/team/${id}`, values).then((r) => r.data),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["team", id] });
      qc.invalidateQueries({ queryKey: ["team"] });
      setShowEditModal(false);
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const resendInvite = useMutation({
    mutationFn: () =>
      api.post("/team/resend-invite", { email: profile?.email }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Invitation link sent successfully");
    },
    onError: () => {
      toast.error("Failed to resend invitation");
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post(`/team/${id}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }).then((r) => r.data);
    },
    onSuccess: () => {
      toast.success("Profile photo updated");
      qc.invalidateQueries({ queryKey: ["team", id] });
      qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to upload profile photo";
      toast.error(msg);
    }
  });

  const handleAvatarClick = () => {
    if (currentRole === "AGENCY_ADMIN" || currentRole === "AGENCY_OWNER") {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file);
    }
  };

  function canRemove() {
    if (!profile) return false;
    if (!isOwner) return false;
    if (profile.id === currentUser?.id) return false;
    if (profile.role === "AGENCY_OWNER") return false;
    return true;
  }

  if (isLoading) {
    return (
      <div className="flex-1 w-full flex flex-col pt-10 pb-20 px-6 sm:px-10 lg:px-16 min-h-full">
        <div className="w-full max-w-4xl mx-auto mb-6">
          <div className="h-4 w-24 bg-[#ECECE6] rounded animate-pulse" />
        </div>
        <div className="w-full max-w-4xl mx-auto h-48 bg-white rounded-md border border-[#ECECE6] animate-pulse mb-8" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-full px-4">
        <h2 className="text-xl font-bold">Staff member not found</h2>
        <Link to="/team" className="text-[#5B47E0] hover:underline mt-2">Return to Team</Link>
      </div>
    );
  }

  const roleConf = ROLE_CONFIG[profile.role] || ROLE_CONFIG.AGENCY_STAFF;
  const RoleIcon = roleConf.icon;

  return (
    <div className="flex-1 w-full flex flex-col pt-10 pb-20 px-6 sm:px-10 lg:px-16 min-h-full bg-[#FAFAF7]">
      <div className="w-full max-w-4xl mx-auto mb-6">
        <Link 
          to="/team"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-max"
        >
          <ArrowLeft className="size-4" />
          Back to Team
        </Link>
      </div>

      <div className="w-full max-w-4xl mx-auto space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-md p-6 border border-[#ECECE6] flex flex-col sm:flex-row gap-6 items-start sm:items-center relative">
          
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {(currentRole === "AGENCY_ADMIN" || currentRole === "AGENCY_OWNER") && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors rounded-md bg-white border border-[#ECECE6] hover:bg-gray-50 text-foreground"
              >
                <Edit2 className="size-3.5" />
                Edit
              </button>
            )}

            {!profile.emailVerifiedAt && (currentRole === "AGENCY_ADMIN" || currentRole === "AGENCY_OWNER") && (
              <button
                onClick={() => resendInvite.mutate()}
                disabled={resendInvite.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors rounded-md bg-white border border-[#ECECE6] hover:bg-gray-50 text-foreground disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${resendInvite.isPending ? 'animate-spin' : ''}`} />
                {resendInvite.isPending ? "Resending..." : "Resend Invite"}
              </button>
            )}

            {canRemove() && (
              <button
                onClick={() => setShowRemoveModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors rounded-md text-[#f43f5e] hover:bg-rose-50"
                style={{ border: '1px solid rgba(244,63,94,0.20)' }}
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <div 
              onClick={handleAvatarClick}
              className={`relative size-20 rounded-md overflow-hidden group/avatar border border-[#ECECE6] ${
                (currentRole === "AGENCY_ADMIN" || currentRole === "AGENCY_OWNER") 
                  ? "cursor-pointer" 
                  : ""
              }`}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.firstName} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center bg-[#F3F4F6]">
                  <span className="text-3xl font-bold text-muted-foreground">{getInitials(profile.firstName, profile.lastName)}</span>
                </div>
              )}
              
              {/* Hover overlay for upload (only if Admin/Owner) */}
              {(currentRole === "AGENCY_ADMIN" || currentRole === "AGENCY_OWNER") && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  {uploadAvatar.isPending ? (
                    <Loader2 className="size-5 text-white animate-spin" />
                  ) : (
                    <Camera className="size-5 text-white" />
                  )}
                </div>
              )}
            </div>

            {!profile.emailVerifiedAt && (
              <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase bg-amber-100 text-amber-700 border border-amber-200 z-10">
                Pending
              </div>
            )}
            
            {/* Hidden File Input */}
            {(currentRole === "AGENCY_ADMIN" || currentRole === "AGENCY_OWNER") && (
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                className="hidden"
              />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading font-bold text-3xl text-foreground">
                {profile.firstName} {profile.lastName}
              </h1>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                style={{ background: roleConf.bg, border: roleConf.border }}
              >
                <RoleIcon className="size-3.5" style={{ color: roleConf.color }} />
                <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: roleConf.color }}>
                  {roleConf.label}
                </span>
              </div>
            </div>
            
            {profile.jobTitle && (
              <p className="text-sm font-medium text-muted-foreground mb-3">{profile.jobTitle}</p>
            )}

            {profile.description && (
              <p className="text-sm text-muted-foreground/80 max-w-2xl mb-4 leading-relaxed">
                {profile.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="size-4" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                <span>Joined {formatDate(profile.createdAt)}</span>
              </div>
              {profile.lastLoginAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <span>Last active {formatDate(profile.lastLoginAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Clients (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-md border border-[#ECECE6] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#ECECE6] flex items-center justify-between bg-[#FAFAF7]/50">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="size-5 text-muted-foreground" />
                  <h3 className="font-heading font-semibold text-lg">Assigned Clients</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAFAF7] border border-[#ECECE6] text-xs font-semibold text-muted-foreground">
                  {profile.assignedClients.length}
                </span>
              </div>

              {profile.assignedClients.length > 0 ? (
                <div className="divide-y divide-[#ECECE6]">
                  {profile.assignedClients.map((client) => (
                    <div key={client.id} className="p-4 flex items-center justify-between hover:bg-[#FAFAF7] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#FAFAF7] border border-[#ECECE6] flex items-center justify-center shrink-0">
                          {client.logoUrl ? (
                            <img src={client.logoUrl} alt={client.name} className="size-6 object-contain" />
                          ) : (
                            <Globe className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{client.name}</p>
                          {client.website && (
                            <a href={client.website} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors flex items-center gap-1 mt-0.5">
                              {client.website.replace(/^https?:\/\//, '')}
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/clients/${client.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#ECECE6] hover:bg-[#FAFAF7] transition-colors"
                      >
                        View Client
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="size-10 rounded-full bg-[#FAFAF7] border border-[#ECECE6] flex items-center justify-center mb-3">
                    <Briefcase className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No assigned clients</p>
                  <p className="text-xs text-muted-foreground mt-1">This staff member hasn't been assigned to any clients yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline (Right Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-md border border-[#ECECE6] overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-[#ECECE6] flex items-center gap-2.5 bg-[#FAFAF7]/50 shrink-0">
                <Activity className="size-5 text-muted-foreground" />
                <h3 className="font-heading font-semibold text-lg">Recent Activity</h3>
              </div>
              
              {profile.auditLogs.length > 0 ? (
                <>
                  <div className="p-6 relative max-h-[400px] overflow-y-auto">
                    <div className="absolute left-[33px] top-8 bottom-8 w-px bg-[#ECECE6]" />
                    <div className="space-y-6 relative z-10">
                      {profile.auditLogs.map((log) => (
                        <div key={log.id} className="flex gap-4">
                          <div className="size-5 rounded-full bg-white border-[3px] border-[#FAFAF7] shadow-sm flex items-center justify-center shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              <span className="font-medium">{log.action}</span> {log.resourceType.toLowerCase()}
                            </p>
                            <p className="text-sm font-medium text-foreground truncate mt-0.5">{log.resourceName}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">{formatDate(log.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 border-t border-[#ECECE6] bg-[#FAFAF7]/50 shrink-0">
                    <Link
                      to={`/team/${profile.id}/activity`}
                      className="flex items-center justify-center w-full py-2 text-sm font-semibold text-foreground bg-white border border-[#ECECE6] rounded-lg hover:bg-muted transition-colors"
                    >
                      View All Activity
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="size-10 rounded-full bg-[#FAFAF7] border border-[#ECECE6] flex items-center justify-center mb-3">
                    <Activity className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-1">No recorded actions found for this user.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {showRemoveModal && (
          <RemoveModal
            profile={profile}
            isPending={remove.isPending}
            onClose={() => setShowRemoveModal(false)}
            onConfirm={async () => {
              await remove.mutateAsync();
              setShowRemoveModal(false);
            }}
          />
        )}
        {showEditModal && (
          <EditModal
            profile={profile}
            isPending={editProfile.isPending}
            onClose={() => setShowEditModal(false)}
            onSave={async (values) => {
              await editProfile.mutateAsync(values);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
