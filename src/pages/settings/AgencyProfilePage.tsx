import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Building2, Link2, Save } from "lucide-react";
import { motion } from "motion/react";
import { getApiClient } from "@/lib/api";

interface Agency {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  logoUrl: string | null;
  primaryColor: string;
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
});

type ProfileForm = z.infer<typeof profileSchema>;

function extractMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) return msg[0] as string;
  return "Failed to save profile";
}

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
    formState: { errors, isDirty, isValid },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (agency) reset({ name: agency.name, slug: agency.slug ?? "" });
  }, [agency, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      api.patch<Agency>("/agencies/me", data).then((r) => r.data),
    onSuccess: (updated) => {
      toast.success("Agency profile saved");
      reset({ name: updated.name, slug: updated.slug ?? "" });
      void queryClient.invalidateQueries({ queryKey: ["agency-me"] });
    },
    onError: (err) => toast.error(extractMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="p-5 lg:p-7 space-y-4 max-w-2xl mx-auto">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-7 pb-12 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="space-y-6"
      >
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-tight text-foreground">Agency Profile</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your agency's public identity and URL settings.
          </p>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          {/* General card */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
              <div className="flex items-center gap-2">
                <div
                  className="size-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(91,71,224,0.10)' }}
                >
                  <Building2 className="size-3.5" style={{ color: '#5B47E0' }} />
                </div>
                <h2 className="font-heading font-semibold text-sm">General</h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground ml-9">
                Your agency's name and short identifier.
              </p>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Agency name
                </label>
                <input
                  id="name"
                  {...register("name")}
                  placeholder="Acme Marketing"
                  className="w-full rounded-xl h-10 px-3 text-sm outline-none bg-white"
                  style={{ border: '1px solid #ECECE6' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#5B47E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                {errors.name && (
                  <p className="text-xs" style={{ color: '#f43f5e' }}>{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="slug" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  URL slug
                </label>
                <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
                  <span
                    className="text-xs text-muted-foreground px-3 h-10 flex items-center whitespace-nowrap shrink-0"
                    style={{ background: 'rgba(0,0,0,0.02)', borderRight: '1px solid #ECECE6' }}
                  >
                    app.agencypulse.com/
                  </span>
                  <input
                    id="slug"
                    {...register("slug")}
                    placeholder="acme-marketing"
                    className="flex-1 h-10 px-3 text-sm outline-none bg-white"
                    style={{ border: 'none' }}
                  />
                </div>
                {errors.slug ? (
                  <p className="text-xs" style={{ color: '#f43f5e' }}>{errors.slug.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only. Must be unique.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* URL card — info */}
          {agency && (
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(91,71,224,0.04)', border: '1px solid rgba(91,71,224,0.15)' }}
            >
              <div
                className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(91,71,224,0.10)' }}
              >
                <Link2 className="size-4" style={{ color: '#5B47E0' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#5B47E0' }}>Client portal URL</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your clients access their dashboards at:
                </p>
                <code
                  className="text-xs font-mono mt-1 block"
                  style={{ color: '#5B47E0' }}
                >
                  app.agencypulse.com/{agency.slug}
                </code>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || !isValid || mutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              {mutation.isPending
                ? <><Loader2 className="size-3.5 animate-spin" />Saving…</>
                : <><Save className="size-3.5" />Save changes</>
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
