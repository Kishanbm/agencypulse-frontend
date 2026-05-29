import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Lock, User, Building2, Phone,
  Globe, Users as UsersIcon, MapPin, Check, BarChart3, Search,
  Megaphone, Mail as MailIcon, ShoppingCart, BarChart2, PhoneCall, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { register as registerAgency } from "@/lib/auth-service";
import { roleHome } from "@/lib/rbac";
import { toastError } from "@/lib/http-errors";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { cn } from "@/lib/utils";

// ─── Schema ────────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, "Must contain uppercase, lowercase, and a number"),
  phone: z.string().optional(),
});

const step2Schema = z.object({
  agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
  website: z.string()
    .transform((val) => {
      const trimmed = val.trim();
      if (!trimmed) return trimmed;
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    })
    .pipe(z.string().url("Must be a valid URL (e.g., https://example.com)").or(z.literal("")))
    .optional(),
  size: z.string().min(1, "Please select an agency size"),
  country: z.string().min(2, "Please select a country").max(2),
  timezone: z.string().min(1, "Please select a timezone"),
});

const step3Schema = z.object({
  interests: z.array(z.string()).optional(),
  clientCountEstimate: z.string().optional(),
  referralSource: z.string().optional(),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FullValues = z.infer<typeof fullSchema>;

// ─── Constants ─────────────────────────────────────────────────────────────────

const AGENCY_SIZES = [
  { value: "1", label: "Just me" },
  { value: "2-5", label: "2–5" },
  { value: "6-10", label: "6–10" },
  { value: "11-25", label: "11–25" },
  { value: "26-50", label: "26–50" },
  { value: "51+", label: "51+" },
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "NL", label: "Netherlands" },
  { value: "IN", label: "India" },
  { value: "SG", label: "Singapore" },
  { value: "JP", label: "Japan" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "ZA", label: "South Africa" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "OT", label: "Other" },
];

const TIMEZONES = [
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Toronto", "America/Sao_Paulo", "America/Mexico_City",
  "Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Madrid",
  "Africa/Johannesburg", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore",
  "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
];

const INTERESTS = [
  { id: "SEO",            label: "SEO",             icon: Search },
  { id: "PPC",            label: "PPC / Paid Ads",  icon: Megaphone },
  { id: "SOCIAL",         label: "Social Media",    icon: BarChart3 },
  { id: "EMAIL",          label: "Email Marketing", icon: MailIcon },
  { id: "ECOMMERCE",      label: "E-commerce",      icon: ShoppingCart },
  { id: "ANALYTICS",      label: "Analytics / CRM", icon: BarChart2 },
  { id: "CALL_TRACKING",  label: "Call Tracking",   icon: PhoneCall },
  { id: "LOCAL",          label: "Local & Reviews", icon: Star },
];

const CLIENT_COUNTS = [
  { value: "1-5",   label: "1–5 clients" },
  { value: "6-15",  label: "6–15 clients" },
  { value: "16-50", label: "16–50 clients" },
  { value: "51-100",label: "51–100 clients" },
  { value: "100+",  label: "100+ clients" },
];

const REFERRAL_SOURCES = [
  { value: "SEARCH",   label: "Google / search" },
  { value: "SOCIAL",   label: "Social media" },
  { value: "REFERRAL", label: "Friend / referral" },
  { value: "PODCAST",  label: "Podcast or YouTube" },
  { value: "BLOG",     label: "Blog or article" },
  { value: "OTHER",    label: "Other" },
];

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-2 flex-1">
          <div
            className={cn(
              "size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
              s < step  && "bg-mint text-white",
              s === step && "bg-violet text-white",
              s > step  && "bg-muted text-muted-foreground",
            )}
          >
            {s < step ? <Check className="size-3.5" strokeWidth={3} /> : s}
          </div>
          {s < total && (
            <div
              className={cn(
                "h-0.5 flex-1 rounded-full transition-colors",
                s < step ? "bg-mint" : "bg-muted",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FullValues>({
    resolver: zodResolver(fullSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "", lastName: "", email: "", password: "", phone: "",
      agencyName: "", website: "", size: "", country: "", timezone: "",
      interests: [], clientCountEstimate: "", referralSource: "",
    },
  });

  const password = form.watch("password");
  const passwordChecks = [
    { label: "8+ characters",    ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number",           ok: /\d/.test(password) },
  ];

  const interests = form.watch("interests") ?? [];

  function toggleInterest(id: string) {
    const current = form.getValues("interests") ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    form.setValue("interests", next, { shouldValidate: true });
  }

  async function nextStep() {
    let valid = false;
    if (step === 1) {
      valid = await form.trigger(["firstName", "lastName", "email", "password", "phone"]);
    } else if (step === 2) {
      valid = await form.trigger(["agencyName", "website", "size", "country", "timezone"]);
    }
    if (valid) setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  }

  function prevStep() {
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  }

  async function onSubmit(values: FullValues) {
    setIsLoading(true);
    try {
      let website = values.website?.trim();
      if (website && !/^https?:\/\//i.test(website)) {
        website = `https://${website}`;
      }
      const payload = {
        ...values,
        website: website || undefined,
        phone: values.phone?.trim() || undefined,
        country: values.country || undefined,
        interests: values.interests?.length ? values.interests : undefined,
        clientCountEstimate: values.clientCountEstimate || undefined,
        referralSource: values.referralSource || undefined,
      };
      const res = await registerAgency(payload);
      toast.success(`Welcome, ${res.user.firstName} — agency created. Check your email to verify.`);
      navigate(roleHome(res.user.role), { replace: true });
    } catch (err) {
      toastError(err, "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  function skipStep3AndSubmit() {
    form.setValue("interests", []);
    form.setValue("clientCountEstimate", "");
    form.setValue("referralSource", "");
    void form.handleSubmit(onSubmit)();
  }

  return (
    <AuthSplitLayout
      tone="warm"
      variant="features"
      panelHeadline="Build the reporting workspace your clients will brag about."
      panelSub="Spin up your agency in 30 seconds. 14 days free, every feature unlocked. No card. No catch."
    >
      <div className="space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-coral/10 text-coral text-xs font-medium mb-3">
          <span className="size-1.5 rounded-full bg-coral" />
          {step === 1 && "Create your account"}
          {step === 2 && "Tell us about your agency"}
          {step === 3 && "What do you want to track?"}
        </div>
        <h1 className="display-md">
          {step === 1 && (<>Start your <span className="text-gradient-violet">14-day trial</span></>)}
          {step === 2 && (<>Tell us about your <span className="text-gradient-violet">agency</span></>)}
          {step === 3 && (<>Just a few <span className="text-gradient-violet">final details</span></>)}
        </h1>
        <p className="text-muted-foreground text-sm">
          {step === 1 && "No card required. Cancel anytime. Set up in under five minutes."}
          {step === 2 && "We'll use this to set your timezone and tailor your dashboard."}
          {step === 3 && "Optional — helps us send you the right onboarding tips. Skip if you want."}
        </p>
      </div>

      <StepIndicator step={step} total={3} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <AnimatePresence mode="wait" initial={false}>
            {/* ─── Step 1 ───────────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">First name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                            <Input placeholder="Jane" autoComplete="given-name" className="h-11 pl-11 rounded-xl text-sm bg-white" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" autoComplete="family-name" className="h-11 rounded-xl text-sm bg-white px-3.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Work email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                          <Input type="email" placeholder="you@agency.com" autoComplete="email" className="h-11 pl-11 rounded-xl text-sm bg-white" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            className="h-11 pl-11 pr-11 rounded-xl text-sm bg-white"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 size-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                      </FormControl>
                      {password.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                          {passwordChecks.map((c) => (
                            <div
                              key={c.label}
                              className={`inline-flex items-center gap-1.5 text-[11px] transition-colors ${c.ok ? "text-mint" : "text-muted-foreground/70"}`}
                            >
                              <span className={`size-3.5 rounded-full flex items-center justify-center ${c.ok ? "bg-mint/15" : "bg-muted"}`}>
                                <Check className="size-2" strokeWidth={3} />
                              </span>
                              {c.label}
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                          <Input type="tel" placeholder="+1 415 555 0100" autoComplete="tel" className="h-11 pl-11 rounded-xl text-sm bg-white" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="button" variant="gradient" size="xl" className="w-full" onClick={nextStep}>
                  Continue <ArrowRight className="size-5" />
                </Button>
              </motion.div>
            )}

            {/* ─── Step 2 ───────────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="agencyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Agency name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                          <Input placeholder="Acme Marketing" className="h-11 pl-11 rounded-xl text-sm bg-white" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Website <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                          <Input
                            type="url"
                            placeholder="https://acmemarketing.com"
                            className="h-11 pl-11 rounded-xl text-sm bg-white"
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              let value = e.target.value.trim();
                              if (value && !/^https?:\/\//i.test(value)) {
                                value = `https://${value}`;
                                form.setValue("website", value, { shouldValidate: true });
                              }
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Agency size</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {AGENCY_SIZES.map((s) => (
                          <button
                            type="button"
                            key={s.value}
                            onClick={() => field.onChange(s.value)}
                            className={cn(
                              "h-10 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5",
                              field.value === s.value
                                ? "border-violet bg-violet/10 text-violet"
                                : "border-border bg-white text-foreground hover:border-violet/40",
                            )}
                          >
                            <UsersIcon className="size-3" />
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Country</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                            <select
                              {...field}
                              className="h-11 w-full pl-11 pr-3 rounded-xl text-sm bg-white border border-border focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20 appearance-none"
                            >
                              <option value="">Select…</option>
                              {COUNTRIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Timezone</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="h-11 w-full px-3 rounded-xl text-sm bg-white border border-border focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20 appearance-none"
                          >
                            <option value="">Select…</option>
                            {TIMEZONES.map((tz) => (
                              <option key={tz} value={tz}>{tz}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="xl" className="px-4" onClick={prevStep}>
                    <ArrowLeft className="size-4" />
                  </Button>
                  <Button type="button" variant="gradient" size="xl" className="flex-1" onClick={nextStep}>
                    Continue <ArrowRight className="size-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3 ───────────────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="interests"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        What do you want to track? <span className="text-muted-foreground font-normal text-xs">(select any)</span>
                      </FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {INTERESTS.map((i) => {
                          const active = interests.includes(i.id);
                          const Icon = i.icon;
                          return (
                            <button
                              type="button"
                              key={i.id}
                              onClick={() => toggleInterest(i.id)}
                              className={cn(
                                "h-11 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-2 px-3",
                                active
                                  ? "border-violet bg-violet/10 text-violet"
                                  : "border-border bg-white text-foreground hover:border-violet/40",
                              )}
                            >
                              <Icon className="size-3.5 shrink-0" />
                              <span className="truncate">{i.label}</span>
                              {active && <Check className="size-3 ml-auto" strokeWidth={3} />}
                            </button>
                          );
                        })}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientCountEstimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">How many clients do you manage?</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {CLIENT_COUNTS.map((c) => (
                          <button
                            type="button"
                            key={c.value}
                            onClick={() => field.onChange(field.value === c.value ? "" : c.value)}
                            className={cn(
                              "h-10 rounded-xl text-[11px] font-semibold border transition-colors px-2",
                              field.value === c.value
                                ? "border-violet bg-violet/10 text-violet"
                                : "border-border bg-white text-foreground hover:border-violet/40",
                            )}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referralSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">How did you hear about us?</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="h-11 w-full px-3 rounded-xl text-sm bg-white border border-border focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20 appearance-none"
                        >
                          <option value="">Select… (optional)</option>
                          {REFERRAL_SOURCES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="xl" className="px-4" onClick={prevStep} disabled={isLoading}>
                    <ArrowLeft className="size-4" />
                  </Button>
                  <Button type="submit" variant="gradient" size="xl" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Creating your agency…
                      </span>
                    ) : (
                      <>Create my agency <ArrowRight className="size-5" /></>
                    )}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={skipStep3AndSubmit}
                  disabled={isLoading}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip and finish
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 && (
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              By signing up, you agree to our{" "}
              <a href="#" className="text-foreground underline underline-offset-2">Terms</a> and{" "}
              <a href="#" className="text-foreground underline underline-offset-2">Privacy Policy</a>.
            </p>
          )}
        </form>
      </Form>

      <div className="mt-7 pt-6 border-t border-border/60 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-violet font-medium hover:text-violet/80">
          Sign in
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
