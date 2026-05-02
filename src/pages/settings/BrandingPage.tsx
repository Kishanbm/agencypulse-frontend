import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload, Loader2, Palette, Globe, Mail,
  Image as ImageIcon, Save,
} from "lucide-react";
import { motion } from "motion/react";
import { getApiClient } from "@/lib/api";
import { useBranding } from "@/contexts/BrandingContext";

interface BrandingData {
  agencyName: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string | null;
  emailFromName: string;
  emailFromAddress: string | null;
}

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #3B82F6)"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #1E40AF)"),
  customDomain: z.string().max(255).refine(
    (v) => v === "" || /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(v),
    "Enter a valid domain (e.g. reports.acme.com)",
  ),
  emailFromName: z.string().max(100),
  emailFromAddress: z.string().max(255).refine(
    (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Must be a valid email address",
  ),
});

type BrandingForm = z.infer<typeof brandingSchema>;

const LOGO_ACCEPT = "image/png,image/jpeg,image/svg+xml,image/webp";
const FAVICON_ACCEPT = "image/x-icon,image/vnd.microsoft.icon,image/png";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const FAVICON_MAX_BYTES = 512 * 1024;

function extractMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) return msg[0] as string;
  return "Failed to save branding";
}

function SectionCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: "1px solid #ECECE6" }}
    >
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #ECECE6" }}>
        <div className="flex items-center gap-2">
          <div
            className="size-7 rounded-lg flex items-center justify-center"
            style={{ background: iconBg }}
          >
            <Icon className="size-3.5" style={{ color: iconColor }} />
          </div>
          <h2 className="font-heading font-semibold text-sm">{title}</h2>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground ml-9">{description}</p>
      </div>
      <div className="px-5 py-5">{children}</div>
    </motion.div>
  );
}

export default function BrandingPage() {
  const api = getApiClient();
  const { refresh } = useBranding();

  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const { data: branding, isLoading, refetch } = useQuery<BrandingData>({
    queryKey: ["branding-settings"],
    queryFn: () => api.get<BrandingData>("/agencies/me/branding").then((r) => r.data),
  });

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isDirty, isValid },
  } = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: "#3B82F6", secondaryColor: "#1E40AF",
      customDomain: "", emailFromName: "", emailFromAddress: "",
    },
  });

  useEffect(() => {
    if (branding) {
      reset({
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        customDomain: branding.customDomain ?? "",
        emailFromName: branding.emailFromName ?? "",
        emailFromAddress: branding.emailFromAddress ?? "",
      });
      setLogoUrl(branding.logoUrl);
      setFaviconUrl(branding.faviconUrl);
    }
  }, [branding, reset]);

  const primaryColor = watch("primaryColor");
  const secondaryColor = watch("secondaryColor");

  const saveMutation = useMutation({
    mutationFn: (data: BrandingForm) =>
      api.patch<BrandingData>("/agencies/me/branding", {
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        ...(data.customDomain ? { customDomain: data.customDomain } : {}),
        ...(data.emailFromName ? { emailFromName: data.emailFromName } : {}),
        ...(data.emailFromAddress ? { emailFromAddress: data.emailFromAddress } : {}),
      }).then((r) => r.data),
    onSuccess: async (saved) => {
      toast.success("Branding saved");
      reset({
        primaryColor: saved.primaryColor, secondaryColor: saved.secondaryColor,
        customDomain: saved.customDomain ?? "", emailFromName: saved.emailFromName ?? "",
        emailFromAddress: saved.emailFromAddress ?? "",
      });
      await refresh();
    },
    onError: (err) => toast.error(extractMessage(err)),
  });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) { toast.error("Logo must be under 2 MB"); return; }
    const allowed = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Logo must be PNG, JPEG, SVG, or WebP"); return; }
    if (file.type === "image/svg+xml") toast.warning("SVG logos should come from trusted sources only");
    const form = new FormData();
    form.append("file", file);
    setLogoUploading(true);
    try {
      const { data } = await api.post<{ logoUrl: string }>("/agencies/me/branding/logo", form, { headers: { "Content-Type": "multipart/form-data" } });
      setLogoUrl(data.logoUrl);
      await refetch(); await refresh();
      toast.success("Logo updated");
    } catch { toast.error("Failed to upload logo"); }
    finally { setLogoUploading(false); if (logoInputRef.current) logoInputRef.current.value = ""; }
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > FAVICON_MAX_BYTES) { toast.error("Favicon must be under 512 KB"); return; }
    const allowed = ["image/x-icon", "image/vnd.microsoft.icon", "image/png"];
    if (!allowed.includes(file.type)) { toast.error("Favicon must be ICO or PNG"); return; }
    const form = new FormData();
    form.append("file", file);
    setFaviconUploading(true);
    try {
      const { data } = await api.post<{ faviconUrl: string }>("/agencies/me/branding/favicon", form, { headers: { "Content-Type": "multipart/form-data" } });
      setFaviconUrl(data.faviconUrl);
      await refetch(); await refresh();
      toast.success("Favicon updated — browser tab will refresh shortly");
    } catch { toast.error("Failed to upload favicon"); }
    finally { setFaviconUploading(false); if (faviconInputRef.current) faviconInputRef.current.value = ""; }
  }

  if (isLoading) {
    return (
      <div className="p-5 lg:p-7 space-y-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[3, 4].map((i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  const cacheBust = `?v=${Date.now()}`;
  const isPrimaryValid = /^#[0-9A-Fa-f]{6}$/.test(primaryColor);
  const isSecondaryValid = /^#[0-9A-Fa-f]{6}$/.test(secondaryColor);

  return (
    <div className="p-4 sm:p-5 lg:p-7 pb-12 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="mb-6"
      >
        <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">
          White-label Branding
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
          Customise your agency's look across dashboards, reports, and the client portal.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5">

        {/* Row 1: Logo+Favicon | Brand Colors — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Logo & Favicon */}
          <SectionCard
            icon={ImageIcon} iconColor="#5B47E0" iconBg="rgba(91,71,224,0.10)"
            title="Logo & Favicon" description="Shown in the sidebar, reports, and client portal."
            delay={0.05}
          >
            <div className="space-y-5">
              {/* Logo row */}
              <div className="flex items-center gap-4">
                <div
                  className="size-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ border: "1px solid #ECECE6", background: "rgba(0,0,0,0.03)" }}
                >
                  {logoUrl ? (
                    <img src={`${logoUrl}${cacheBust}`} alt="Agency logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">
                      {branding?.agencyName?.charAt(0) ?? "A"}
                    </span>
                  )}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Agency logo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPEG, SVG, or WebP. Max 2 MB.</p>
                  <input ref={logoInputRef} type="file" accept={LOGO_ACCEPT} className="hidden" onChange={handleLogoUpload} />
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                    style={{ border: "1px solid #ECECE6", color: "#5B47E0", background: "rgba(91,71,224,0.05)" }}
                  >
                    {logoUploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                    {logoUploading ? "Uploading…" : "Upload logo"}
                  </button>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #ECECE6" }} className="pt-5">
                {/* Favicon row */}
                <div className="flex items-center gap-4">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                    style={{ border: "1px solid #ECECE6", background: "rgba(0,0,0,0.03)" }}
                  >
                    {faviconUrl ? (
                      <img src={`${faviconUrl}${cacheBust}`} alt="Favicon" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[9px] font-bold text-muted-foreground">ICO</span>
                    )}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Favicon</p>
                    <p className="text-xs text-muted-foreground">ICO or PNG. Max 512 KB. Updates the browser tab icon.</p>
                    <input ref={faviconInputRef} type="file" accept={FAVICON_ACCEPT} className="hidden" onChange={handleFaviconUpload} />
                    <button
                      type="button"
                      disabled={faviconUploading}
                      onClick={() => faviconInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                      style={{ border: "1px solid #ECECE6", color: "#5B47E0", background: "rgba(91,71,224,0.05)" }}
                    >
                      {faviconUploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                      {faviconUploading ? "Uploading…" : "Upload favicon"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Brand Colors */}
          <SectionCard
            icon={Palette} iconColor="#FF7A59" iconBg="rgba(255,122,89,0.10)"
            title="Brand colors" description="Applied across dashboards, reports, and the client portal."
            delay={0.1}
          >
            <div className="space-y-4">
              {/* Primary */}
              <div className="space-y-2">
                <label htmlFor="primaryColor" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Primary color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={isPrimaryValid ? primaryColor : "#3B82F6"}
                    onChange={(e) => setValue("primaryColor", e.target.value, { shouldDirty: true, shouldValidate: true })}
                    className="size-9 rounded-xl cursor-pointer border p-0.5 bg-transparent shrink-0"
                    style={{ borderColor: "#ECECE6" }}
                  />
                  <input
                    id="primaryColor"
                    {...register("primaryColor")}
                    placeholder="#3B82F6"
                    className="flex-1 font-mono rounded-xl h-9 text-sm px-3 outline-none bg-white"
                    style={{ border: '1px solid #ECECE6' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#5B47E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.primaryColor && <p className="text-xs" style={{ color: '#f43f5e' }}>{errors.primaryColor.message}</p>}
              </div>

              {/* Secondary */}
              <div className="space-y-2">
                <label htmlFor="secondaryColor" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Secondary color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={isSecondaryValid ? secondaryColor : "#1E40AF"}
                    onChange={(e) => setValue("secondaryColor", e.target.value, { shouldDirty: true, shouldValidate: true })}
                    className="size-9 rounded-xl cursor-pointer border p-0.5 bg-transparent shrink-0"
                    style={{ borderColor: "#ECECE6" }}
                  />
                  <input
                    id="secondaryColor"
                    {...register("secondaryColor")}
                    placeholder="#1E40AF"
                    className="flex-1 font-mono rounded-xl h-9 text-sm px-3 outline-none bg-white"
                    style={{ border: '1px solid #ECECE6' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#5B47E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.secondaryColor && <p className="text-xs" style={{ color: '#f43f5e' }}>{errors.secondaryColor.message}</p>}
              </div>

              {/* Preview strip */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <div className="flex gap-2 rounded-xl overflow-hidden" style={{ border: "1px solid #ECECE6" }}>
                  <div className="h-10 flex-1 transition-colors" style={{ background: isPrimaryValid ? primaryColor : "#3B82F6" }} title="Primary" />
                  <div className="h-10 flex-1 transition-colors" style={{ background: isSecondaryValid ? secondaryColor : "#1E40AF" }} title="Secondary" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Row 2: Custom Domain | Email — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Custom Domain */}
          <SectionCard
            icon={Globe} iconColor="#10D9A0" iconBg="rgba(16,217,160,0.10)"
            title="Custom domain" description="Serve your client portal from your own domain."
            delay={0.15}
          >
          <div className="space-y-2">
            <label htmlFor="customDomain" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Domain
            </label>
            <input
              id="customDomain"
              {...register("customDomain")}
              placeholder="reports.acme.com"
              className="w-full rounded-xl h-10 px-3 text-sm outline-none bg-white"
              style={{ border: '1px solid #ECECE6' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#5B47E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.customDomain ? (
              <p className="text-xs" style={{ color: '#f43f5e' }}>{errors.customDomain.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Add a CNAME record pointing to{" "}
                <code className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(91,71,224,0.08)", color: "#5B47E0" }}>
                  app.agencypulse.com
                </code>{" "}
                in your DNS settings.
              </p>
            )}
          </div>
        </SectionCard>

          {/* Email */}
          <SectionCard
            icon={Mail} iconColor="#F5A524" iconBg="rgba(245,165,36,0.10)"
            title="Email sending" description="Customise the sender shown on outgoing emails — reports, invites, and alerts."
            delay={0.2}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="emailFromName" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                From name
              </label>
              <input
                id="emailFromName"
                {...register("emailFromName")}
                placeholder={branding?.agencyName ?? "Your Agency"}
                className="w-full rounded-xl h-10 px-3 text-sm outline-none bg-white"
                style={{ border: '1px solid #ECECE6' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#5B47E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p className="text-xs text-muted-foreground">Defaults to your agency name if left blank.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="emailFromAddress" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                From address
              </label>
              <input
                id="emailFromAddress"
                type="email"
                {...register("emailFromAddress")}
                placeholder="noreply@acme.com"
                className="w-full rounded-xl h-10 px-3 text-sm outline-none bg-white"
                style={{ border: '1px solid #ECECE6' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#5B47E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {errors.emailFromAddress ? (
                <p className="text-xs" style={{ color: '#f43f5e' }}>{errors.emailFromAddress.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Ensure SPF and DKIM records are configured for your domain to avoid spam filtering.
                </p>
              )}
            </div>
          </div>
          </SectionCard>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!isDirty || !isValid || saveMutation.isPending}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #111827, #1f2937)" }}
          >
            {saveMutation.isPending
              ? <><Loader2 className="size-3.5 animate-spin" />Saving…</>
              : <><Save className="size-3.5" />Save branding</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
