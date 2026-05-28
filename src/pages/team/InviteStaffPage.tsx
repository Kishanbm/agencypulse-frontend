import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, UserPlus, Mail, UploadCloud, X, ArrowLeft
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const inviteSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName:  z.string().min(1, "Last name is required").max(100),
  email:     z.string().email("Valid email required").max(100),
  jobTitle:  z.string().max(100).optional(),
  description: z.string().optional(),
  role: z.enum(["AGENCY_ADMIN", "AGENCY_STAFF"]),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteStaffPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { firstName: "", lastName: "", email: "", jobTitle: "", description: "", role: "AGENCY_STAFF" },
  });

  const invite = useMutation({
    mutationFn: async (values: InviteFormValues) => {
      const formData = new FormData();
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("email", values.email);
      if (values.jobTitle) formData.append("jobTitle", values.jobTitle);
      if (values.description) formData.append("description", values.description);
      formData.append("role", values.role);
      
      if (avatar) {
        formData.append("file", avatar);
      }
      
      const res = await api.post("/team/invite", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Invite sent successfully!");
      qc.invalidateQueries({ queryKey: ["team"] });
      navigate("/team");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send invite");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    
    setAvatar(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeAvatar = () => {
    setAvatar(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (values: InviteFormValues) => {
    invite.mutate(values);
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#5B47E0';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#ECECE6';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center pt-4 pb-6 px-4 bg-[#FAFAF7] min-h-full">
      <div className="w-full max-w-6xl mb-4">
        <button 
          onClick={() => navigate("/team")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Team
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-md w-full max-w-6xl overflow-hidden"
        style={{ border: '1px solid #ECECE6', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05), 0 20px 40px -4px rgba(0,0,0,0.08)' }}
      >
        <div className="p-6 border-b border-[#ECECE6]">
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
              <UserPlus className="size-5" style={{ color: '#5B47E0' }} />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">Invite Staff Member</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Add a new member to your agency and set their role.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Avatar */}
              <div className="w-full md:w-1/4">
                <div className="space-y-4 sticky top-8">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Profile Image</h3>
                    <p className="text-[11px] text-muted-foreground leading-normal">Recommended size: 400x400px. Max 2MB (PNG, JPG, WebP).</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 pt-2">
                    {previewUrl ? (
                      <div className="relative group size-32 rounded-md overflow-hidden shadow-sm border border-[#ECECE6]">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={removeAvatar}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="size-6 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="size-32 rounded-md bg-[#FAFAF7] border border-[#ECECE6] flex items-center justify-center border-dashed">
                        <UserPlus className="size-8 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-xs font-semibold rounded-md transition-all border border-[#ECECE6] hover:bg-[#FAFAF7] w-full max-w-[160px]"
                    >
                      <UploadCloud className="size-3.5 text-muted-foreground" />
                      Upload Image
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Fields */}
               <div className="w-full md:w-3/4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">First Name</label>
                    <input
                      autoFocus
                      placeholder="Jane"
                      className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all bg-white"
                      style={{ border: '1px solid #ECECE6' }}
                      onFocus={inputFocus} onBlur={inputBlur}
                      {...form.register("firstName")}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-[10px]" style={{ color: '#f43f5e' }}>{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Last Name</label>
                    <input
                      placeholder="Smith"
                      className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all bg-white"
                      style={{ border: '1px solid #ECECE6' }}
                      onFocus={inputFocus} onBlur={inputBlur}
                      {...form.register("lastName")}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-[10px]" style={{ color: '#f43f5e' }}>{form.formState.errors.lastName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="jane@agency.com"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none transition-all bg-white"
                        style={{ border: '1px solid #ECECE6' }}
                        onFocus={inputFocus} onBlur={inputBlur}
                        {...form.register("email")}
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-[10px]" style={{ color: '#f43f5e' }}>{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Job Title <span className="text-muted-foreground font-normal">(Optional)</span></label>
                    <input
                      placeholder="e.g. Senior SEO Specialist"
                      className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all bg-white"
                      style={{ border: '1px solid #ECECE6' }}
                      onFocus={inputFocus} onBlur={inputBlur}
                      {...form.register("jobTitle")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Platform Role</label>
                    <select
                      className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all bg-white appearance-none cursor-pointer"
                      style={{ border: '1px solid #ECECE6' }}
                      onFocus={inputFocus} onBlur={inputBlur}
                      {...form.register("role")}
                    >
                      <option value="AGENCY_STAFF">Staff (Limited access to specific clients)</option>
                      <option value="AGENCY_ADMIN">Admin (Full access to all clients and settings)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Description <span className="text-muted-foreground font-normal">(Optional)</span></label>
                    <textarea
                      placeholder="A brief note about this team member..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all bg-white resize-none"
                      style={{ border: '1px solid #ECECE6' }}
                      onFocus={inputFocus} onBlur={inputBlur}
                      {...form.register("description")}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#ECECE6] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/team")}
                    className="px-6 py-2 text-sm font-semibold rounded-md transition-colors bg-white hover:bg-[#FAFAF7]"
                    style={{ border: '1px solid #ECECE6', color: 'var(--foreground)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={invite.isPending}
                    className="flex items-center gap-2 px-8 py-2 text-sm font-semibold rounded-md text-white transition-opacity hover:opacity-90 disabled:opacity-50 shadow-sm"
                    style={{ background: 'var(--foreground)' }}
                  >
                    {invite.isPending && <Loader2 className="size-4 animate-spin" />}
                    {invite.isPending ? "Sending..." : "Send Invitation"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
