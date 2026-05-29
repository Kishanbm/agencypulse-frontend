import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload, Loader2, Palette, Globe, Mail,
  Image as ImageIcon, Save, Sparkles, Paintbrush,
  CheckCircle2, Clock, AlertCircle, Copy,
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
  customDomainStatus: "pending" | "active" | "failed" | null;
  emailFromName: string;
  emailFromAddress: string | null;
}

interface DomainStatusData {
  customDomain: string | null;
  status: "pending" | "active" | "failed" | null;
  cnameTarget: string;
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

const inputStyle = { border: '1px solid #ECECE6', borderRadius: 0 };
const onFocusSlate = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.08)';
  e.currentTarget.style.borderColor = '#0f172a';
};
const onBlurReset = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = '#ECECE6';
};

// ─── Custom Domain Section ────────────────────────────────────────────────────

function CustomDomainSection({
  register, errors, savedDomain, savedStatus,
}: {
  register: any;
  errors: any;
  savedDomain: string | null;
  savedStatus: "pending" | "active" | "failed" | null;
}) {
  const api = getApiClient();

  const { data: statusData, refetch: refetchStatus } = useQuery<DomainStatusData>({
    queryKey: ["custom-domain-status"],
    queryFn: () =>
      api.get<DomainStatusData>("/agencies/me/branding/custom-domain/status").then((r) => r.data),
    enabled: !!savedDomain,
    // Poll every 10s while pending, stop once active or failed
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "pending" ? 10_000 : false;
    },
  });

  const status = statusData?.status ?? savedStatus;
  const cnameTarget = statusData?.cnameTarget ?? "custom.agencypulse.com";
  const domainToShow = statusData?.customDomain ?? savedDomain;

  function StatusBadge() {
    if (!domainToShow) return null;
    if (status === "active") return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
        style={{ background: "rgba(16,217,160,0.10)", color: "#059669", border: "1px solid rgba(16,217,160,0.25)" }}>
        <CheckCircle2 className="size-3" /> Active
      </span>
    );
    if (status === "failed") return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
        style={{ background: "rgba(244,63,94,0.08)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.20)" }}>
        <AlertCircle className="size-3" /> Verification failed
      </span>
    );
    if (status === "pending") return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
        style={{ background: "rgba(245,165,36,0.10)", color: "#d97706", border: "1px solid rgba(245,165,36,0.25)" }}>
        <Clock className="size-3" /> Pending DNS
      </span>
    );
    return null;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Globe className="size-4 text-slate-500" />
          Custom Domain
        </h3>
        <p className="text-xs text-slate-500 mt-1">Serve your client portal from your own domain with full SSL.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="customDomain" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Domain
          </label>
          <StatusBadge />
        </div>
        <input
          id="customDomain"
          {...register("customDomain")}
          placeholder="reports.acme.com"
          className="w-full h-10 px-3 text-sm outline-none bg-white transition-shadow placeholder:text-slate-400"
          style={inputStyle}
          onFocus={onFocusSlate}
          onBlur={onBlurReset}
        />
        {errors.customDomain && (
          <p className="text-xs text-red-500">{errors.customDomain.message}</p>
        )}
      </div>

      {/* CNAME instructions — shown once domain is saved */}
      {domainToShow && status !== null && (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-700">
              {status === "active"
                ? "Your custom domain is live"
                : "Add this DNS record at your domain registrar"}
            </p>
          </div>
          <div className="p-4 space-y-3">
            {status !== "active" && (
              <>
                <div className="grid grid-cols-[80px_1fr_1fr] gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Type</span><span>Name</span><span>Value</span>
                </div>
                <div className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center">
                  <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">CNAME</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <code className="text-xs font-mono text-slate-800 truncate">
                      {domainToShow.split(".").slice(0, -2).join(".") || domainToShow}
                    </code>
                    <button type="button" onClick={() => copyToClipboard(domainToShow.split(".").slice(0, -2).join(".") || domainToShow)}
                      className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors">
                      <Copy className="size-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <code className="text-xs font-mono text-slate-800 truncate">{cnameTarget}</code>
                    <button type="button" onClick={() => copyToClipboard(cnameTarget)}
                      className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors">
                      <Copy className="size-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {status === "pending"
                    ? "DNS propagation usually takes 1–5 minutes. SSL is issued automatically once your CNAME is detected. This page will update automatically."
                    : "Verification failed. Check that your CNAME record is correctly set, then save the domain again to retry."}
                </p>
              </>
            )}
            {status === "active" && (
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong className="text-slate-800">{domainToShow}</strong> is verified and serving traffic with a valid SSL certificate.
                Your clients can now access the portal at <strong>{domainToShow}</strong>.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hint when no domain is set yet */}
      {!domainToShow && (
        <p className="text-xs text-slate-500">
          Enter a subdomain you control (e.g. <code className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-700 rounded">reports.acme.com</code>).
          After saving, you'll be shown the exact DNS record to add. SSL is provisioned automatically.
        </p>
      )}
    </div>
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
      <div className="min-h-screen bg-slate-50 w-full flex flex-col">
        <div className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full">
          <div className="h-8 bg-slate-100 animate-pulse w-64 mb-4" />
          <div className="h-4 bg-slate-100 animate-pulse w-96" />
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="h-[600px] bg-slate-100 animate-pulse w-full border border-slate-200" />
        </div>
      </div>
    );
  }

  const cacheBust = `?v=${Date.now()}`;
  const isPrimaryValid = /^#[0-9A-Fa-f]{6}$/.test(primaryColor);
  const isSecondaryValid = /^#[0-9A-Fa-f]{6}$/.test(secondaryColor);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 w-full flex flex-col">
      {/* Top Banner / Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 py-10">
            <div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight flex items-center gap-3">
                <Paintbrush className="size-8 text-slate-800" />
                White-label Branding
              </h1>
              <p className="text-slate-500 mt-2 text-lg max-w-2xl">
                Customise your agency's look across dashboards, reports, and the client portal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
          
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
                <Sparkles className="size-4 text-slate-800" />
                Branding Preferences
              </h2>
              <button
                type="submit"
                disabled={!isDirty || !isValid || saveMutation.isPending}
                className="inline-flex items-center gap-2 px-5 h-9 rounded-none text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 border border-slate-900 bg-slate-900"
              >
                {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saveMutation.isPending ? "Saving…" : "Save Branding"}
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-12">
              
              {/* Logo & Colors Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Logo & Favicon Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ImageIcon className="size-4 text-slate-500" />
                      Logo & Favicon
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Shown in the sidebar, reports, and client portal.</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Logo row */}
                    <div className="flex items-center gap-4">
                      <div
                        className="size-16 flex items-center justify-center overflow-hidden shrink-0 rounded-lg"
                        style={{ border: "1px solid #ECECE6", background: "rgba(0,0,0,0.02)" }}
                      >
                        {logoUrl ? (
                          <img src={`${logoUrl}${cacheBust}`} alt="Agency logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-slate-400">
                            {branding?.agencyName?.charAt(0) ?? "A"}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Agency logo</p>
                        <p className="text-xs text-slate-500 mb-2">PNG, JPEG, SVG, or WebP. Max 2 MB.</p>
                        <input ref={logoInputRef} type="file" accept={LOGO_ACCEPT} className="hidden" onChange={handleLogoUpload} />
                        <button
                          type="button"
                          disabled={logoUploading}
                          onClick={() => logoInputRef.current?.click()}
                          className="inline-flex items-center justify-center gap-1.5 px-3 h-8 text-xs font-semibold transition-colors disabled:opacity-50 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          {logoUploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                          {logoUploading ? "Uploading…" : "Upload logo"}
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-[#ECECE6] w-full" />

                    {/* Favicon row */}
                    <div className="flex items-center gap-4">
                      <div
                        className="size-10 flex items-center justify-center overflow-hidden shrink-0 rounded-lg"
                        style={{ border: "1px solid #ECECE6", background: "rgba(0,0,0,0.02)" }}
                      >
                        {faviconUrl ? (
                          <img src={`${faviconUrl}${cacheBust}`} alt="Favicon" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400">ICO</span>
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Favicon</p>
                        <p className="text-xs text-slate-500 mb-2">ICO or PNG. Max 512 KB. Tab icon.</p>
                        <input ref={faviconInputRef} type="file" accept={FAVICON_ACCEPT} className="hidden" onChange={handleFaviconUpload} />
                        <button
                          type="button"
                          disabled={faviconUploading}
                          onClick={() => faviconInputRef.current?.click()}
                          className="inline-flex items-center justify-center gap-1.5 px-3 h-8 text-xs font-semibold transition-colors disabled:opacity-50 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          {faviconUploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                          {faviconUploading ? "Uploading…" : "Upload favicon"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand Colors Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Palette className="size-4 text-slate-500" />
                      Brand Colors
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Applied across dashboards, reports, and the client portal.</p>
                  </div>
                  
                  <div className="space-y-5">
                    {/* Primary */}
                    <div className="space-y-2">
                      <label htmlFor="primaryColor" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Primary color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={isPrimaryValid ? primaryColor : "#3B82F6"}
                          onChange={(e) => setValue("primaryColor", e.target.value, { shouldDirty: true, shouldValidate: true })}
                          className="size-10 cursor-pointer border p-0.5 bg-transparent shrink-0"
                          style={{ borderColor: "#ECECE6", borderRadius: 0 }}
                        />
                        <input
                          id="primaryColor"
                          {...register("primaryColor")}
                          placeholder="#3B82F6"
                          className="flex-1 font-mono h-10 text-sm px-3 outline-none bg-white transition-shadow"
                          style={inputStyle}
                          onFocus={onFocusSlate}
                          onBlur={onBlurReset}
                        />
                      </div>
                      {errors.primaryColor && <p className="text-xs text-red-500">{errors.primaryColor.message}</p>}
                    </div>

                    {/* Secondary */}
                    <div className="space-y-2">
                      <label htmlFor="secondaryColor" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Secondary color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={isSecondaryValid ? secondaryColor : "#1E40AF"}
                          onChange={(e) => setValue("secondaryColor", e.target.value, { shouldDirty: true, shouldValidate: true })}
                          className="size-10 cursor-pointer border p-0.5 bg-transparent shrink-0"
                          style={{ borderColor: "#ECECE6", borderRadius: 0 }}
                        />
                        <input
                          id="secondaryColor"
                          {...register("secondaryColor")}
                          placeholder="#1E40AF"
                          className="flex-1 font-mono h-10 text-sm px-3 outline-none bg-white transition-shadow"
                          style={inputStyle}
                          onFocus={onFocusSlate}
                          onBlur={onBlurReset}
                        />
                      </div>
                      {errors.secondaryColor && <p className="text-xs text-red-500">{errors.secondaryColor.message}</p>}
                    </div>

                    {/* Preview strip */}
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Preview</p>
                      <div className="flex gap-2 overflow-hidden" style={{ border: "1px solid #ECECE6", borderRadius: 0 }}>
                        <div className="h-10 flex-1 transition-colors" style={{ background: isPrimaryValid ? primaryColor : "#3B82F6" }} title="Primary" />
                        <div className="h-10 flex-1 transition-colors" style={{ background: isSecondaryValid ? secondaryColor : "#1E40AF" }} title="Secondary" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="h-px bg-[#ECECE6] w-full" />

              {/* Domain & Email Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Custom Domain Section */}
                <CustomDomainSection
                  register={register}
                  errors={errors}
                  savedDomain={branding?.customDomain ?? null}
                  savedStatus={branding?.customDomainStatus ?? null}
                />

                {/* Email Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Mail className="size-4 text-slate-500" />
                      Email Sending
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Customise the sender shown on outgoing emails (reports, alerts).</p>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="emailFromName" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        From name
                      </label>
                      <input
                        id="emailFromName"
                        {...register("emailFromName")}
                        placeholder={branding?.agencyName ?? "Your Agency"}
                        className="w-full h-10 px-3 text-sm outline-none bg-white transition-shadow placeholder:text-slate-400"
                        style={inputStyle}
                        onFocus={onFocusSlate}
                        onBlur={onBlurReset}
                      />
                      <p className="text-xs text-slate-500">Defaults to your agency name if left blank.</p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="emailFromAddress" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        From address
                      </label>
                      <input
                        id="emailFromAddress"
                        type="email"
                        {...register("emailFromAddress")}
                        placeholder="noreply@acme.com"
                        className="w-full h-10 px-3 text-sm outline-none bg-white transition-shadow placeholder:text-slate-400"
                        style={inputStyle}
                        onFocus={onFocusSlate}
                        onBlur={onBlurReset}
                      />
                      {errors.emailFromAddress ? (
                        <p className="text-xs text-red-500">{errors.emailFromAddress.message}</p>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Ensure SPF and DKIM records are configured for your domain to avoid spam filtering.
                        </p>
                      )}
                    </div>
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
