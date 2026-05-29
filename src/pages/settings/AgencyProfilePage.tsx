import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Building2, Link2, Save, Globe, Clock, Users, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { getApiClient } from "@/lib/api";

interface Agency {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  logoUrl: string | null;
  primaryColor: string;
  website: string | null;
  timezone: string | null;
  country: string | null;
  size: string | null;
  createdAt: string;
}

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{3,}$/,
      "Lowercase letters, numbers, hyphens only. Cannot start or end with a hyphen.",
    )
    .refine((v) => !v.includes("--"), "Consecutive hyphens are not allowed"),
  website: z.string()
    .transform((val) => {
      const trimmed = val.trim();
      if (!trimmed) return trimmed;
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    })
    .pipe(z.union([z.string().url("Must be a valid URL (e.g., https://example.com)"), z.literal("")]))
    .optional(),
  timezone: z.string().optional(),
  country: z.string().optional(),
  size: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

function extractMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) return msg[0] as string;
  return "Failed to save profile";
}

const inputStyle = { border: '1px solid #ECECE6', borderRadius: 0 };
const onFocusSlate = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.08)';
  e.currentTarget.style.borderColor = '#0f172a';
};
const onBlurReset = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = '#ECECE6';
};

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Kolkata", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney", "Australia/Melbourne"
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ZA", name: "South Africa" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "OT", name: "Other" }
];

const SIZES = ["1", "2-10", "11-50", "51-200", "201-500", "501+"];

export default function AgencyProfilePage() {
  const api = getApiClient();
  const queryClient = useQueryClient();

  const { data: agency, isLoading } = useQuery<Agency>({
    queryKey: ["agency-me"],
    queryFn: () => api.get<Agency>("/agencies/me").then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isValid },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", slug: "", website: "", timezone: "", country: "", size: "" },
  });

  useEffect(() => {
    if (agency) {
      reset({ 
        name: agency.name, 
        slug: agency.slug ?? "",
        website: agency.website ?? "",
        timezone: agency.timezone ?? "",
        country: agency.country ?? "",
        size: agency.size ?? ""
      });
    }
  }, [agency, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      api.patch<Agency>("/agencies/me", data).then((r) => r.data),
    onSuccess: (updated) => {
      toast.success("Agency profile saved");
      reset({ 
        name: updated.name, 
        slug: updated.slug ?? "",
        website: updated.website ?? "",
        timezone: updated.timezone ?? "",
        country: updated.country ?? "",
        size: updated.size ?? ""
      });
      void queryClient.invalidateQueries({ queryKey: ["agency-me"] });
    },
    onError: (err) => toast.error(extractMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 w-full flex flex-col">
        <div className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full">
          <div className="h-8 bg-slate-100 animate-pulse w-64 mb-4" />
          <div className="h-4 bg-slate-100 animate-pulse w-96" />
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="h-[400px] bg-slate-100 animate-pulse w-full border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 w-full flex flex-col">
      {/* Top Banner / Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 py-10">
            <div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight flex items-center gap-3">
                <Building2 className="size-8 text-slate-800" />
                Agency Profile
              </h1>
              <p className="text-slate-500 mt-2 text-lg max-w-2xl">
                Manage your agency's public identity, localization settings, and client portal access URL.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          
          {/* Main Unified Card */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="bg-white overflow-hidden"
            style={{ border: '1px solid #ECECE6', borderRadius: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 20px 40px -10px rgba(0,0,0,0.1)' }}
          >
            {/* Save Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-[#ECECE6]">
              <h2 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                <Building2 className="size-4 text-slate-800" />
                Profile Settings
              </h2>
              <button
                type="submit"
                disabled={!isDirty || !isValid || mutation.isPending}
                className="inline-flex items-center gap-2 px-5 h-9 rounded-none text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 border border-slate-900 bg-slate-900"
              >
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {mutation.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-10">
              
              {/* General Identity Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">General Identity</h3>
                  <p className="text-xs text-slate-500 mt-1">Your agency's primary name and client portal URL slug.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Agency name
                    </label>
                    <input
                      id="name"
                      {...register("name")}
                      placeholder="Acme Marketing"
                      className="w-full h-10 px-3 text-sm outline-none bg-white transition-shadow placeholder:text-slate-400"
                      style={inputStyle}
                      onFocus={onFocusSlate}
                      onBlur={onBlurReset}
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="slug" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      URL slug
                    </label>
                    <div className="flex items-center overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-slate-900/10" style={inputStyle}>
                      <span className="text-xs text-muted-foreground px-3 h-10 flex items-center whitespace-nowrap shrink-0 bg-slate-50 border-r border-[#ECECE6]">
                        app.agencypulse.com/
                      </span>
                      <input
                        id="slug"
                        {...register("slug")}
                        placeholder="acme-marketing"
                        className="flex-1 h-10 px-3 text-sm outline-none bg-white placeholder:text-slate-400"
                      />
                    </div>
                    {errors.slug ? (
                      <p className="text-xs text-red-500">{errors.slug.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Lowercase letters, numbers, and hyphens only. Must be unique.
                      </p>
                    )}
                  </div>
                </div>

                {/* Client Portal Access Hint */}
                {agency && (
                  <div 
                    className="flex items-start gap-4 p-5 rounded-none"
                    style={{ background: 'rgba(91,71,224,0.04)', border: '1px solid rgba(91,71,224,0.15)' }}
                  >
                    <div 
                      className="size-10 flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(91,71,224,0.1)', border: '1px solid rgba(91,71,224,0.1)' }}
                    >
                      <Link2 className="size-5" style={{ color: '#5B47E0' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Client Portal Access</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Your clients can log in to view their dashboards using this dedicated link:
                      </p>
                      <code className="text-xs font-mono font-bold block px-3 py-2 mt-3 w-max" style={{ background: '#fff', border: '1px solid rgba(91,71,224,0.2)', color: '#5B47E0' }}>
                        app.agencypulse.com/{agency.slug}
                      </code>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-[#ECECE6] w-full" />

              {/* Preferences & Contact Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Localization & Contact</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure your region, timezone for reporting accuracy, and public contact info.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Website */}
                  <div className="space-y-2">
                    <label htmlFor="website" className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <Globe className="size-3" /> Agency Website
                    </label>
                    <input
                      id="website"
                      {...register("website")}
                      placeholder="https://acmemarketing.com"
                      className="w-full h-10 px-3 text-sm outline-none bg-white transition-shadow placeholder:text-slate-400"
                      style={inputStyle}
                      onFocus={onFocusSlate}
                      onBlur={(e) => {
                        onBlurReset(e);
                        let value = e.target.value.trim();
                        if (value && !/^https?:\/\//i.test(value)) {
                          value = `https://${value}`;
                          setValue("website", value, { shouldValidate: true, shouldDirty: true });
                        }
                      }}
                    />
                    {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
                  </div>

                  {/* Size */}
                  <div className="space-y-2">
                    <label htmlFor="size" className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <Users className="size-3" /> Agency Size
                    </label>
                    <select
                      id="size"
                      {...register("size")}
                      className="w-full h-10 px-3 text-sm outline-none bg-white transition-shadow text-slate-900"
                      style={inputStyle}
                      onFocus={onFocusSlate}
                      onBlur={onBlurReset}
                    >
                      <option value="">Select agency size...</option>
                      {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <label htmlFor="timezone" className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <Clock className="size-3" /> Default Timezone
                    </label>
                    <select
                      id="timezone"
                      {...register("timezone")}
                      className="w-full h-10 px-3 text-sm outline-none bg-white transition-shadow text-slate-900"
                      style={inputStyle}
                      onFocus={onFocusSlate}
                      onBlur={onBlurReset}
                    >
                      <option value="">Select timezone...</option>
                      {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
                    </select>
                    <p className="text-[11px] text-slate-500">Crucial for syncing integrations at midnight.</p>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <label htmlFor="country" className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <MapPin className="size-3" /> Country
                    </label>
                    <select
                      id="country"
                      {...register("country")}
                      className="w-full h-10 px-3 text-sm outline-none bg-white transition-shadow text-slate-900"
                      style={inputStyle}
                      onFocus={onFocusSlate}
                      onBlur={onBlurReset}
                    >
                      <option value="">Select country...</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
