import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, Zap } from "lucide-react";
import { getApiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { fetchMe } from "@/lib/auth-service";
import { roleHome } from "@/lib/rbac";
import { toastError } from "@/lib/http-errors";

const acceptSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Must contain uppercase, lowercase, and a number",
      ),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof acceptSchema>;

const STRENGTH_CHECKS = [
  { label: "8+ characters",     test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter",  test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter",  test: (p: string) => /[a-z]/.test(p) },
  { label: "Number",            test: (p: string) => /\d/.test(p) },
];

export function AcceptInvitePage() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get("token") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const setToken    = useAuthStore((s) => s.setToken);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const pwValue = watch("password");
  const passedChecks = STRENGTH_CHECKS.filter((c) => c.test(pwValue ?? "")).length;

  useEffect(() => {
    if (!token) toast.error("Missing invitation token");
  }, [token]);

  async function onSubmit(values: FormValues) {
    if (!token) return;
    setIsLoading(true);
    try {
      const api = getApiClient();
      const { data } = await api.post<{ accessToken: string }>(
        "/team/accept-invite",
        { token, password: values.password },
      );
      setToken(data.accessToken);
      const me = await fetchMe();
      if (!me) throw new Error("Could not load user profile after accepting invite");
      toast.success(`Welcome, ${me.firstName} — your account is active`);
      navigate(roleHome(me.role), { replace: true });
    } catch (err) {
      toastError(err, "Could not accept invitation");
    } finally {
      setIsLoading(false);
    }
  }

  const strengthColor =
    passedChecks <= 1 ? '#f43f5e' :
    passedChecks <= 2 ? '#F5A524' :
    passedChecks <= 3 ? '#5B47E0' : '#10D9A0';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #FAFAF7 0%, #F0EFF9 100%)' }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 size-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #5B47E0, transparent)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 size-96 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #10D9A0, transparent)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" as const }}
        className="relative w-full max-w-md mx-auto"
      >
        {/* Logo / Brand */}
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-3 size-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #111827, #1f2937)', boxShadow: '0 8px 24px rgba(91,71,224,0.30)' }}
          >
            <Zap className="size-6 text-white" />
          </div>
          <h1 className="font-heading font-bold text-xl text-foreground tracking-tight">AgencyPulse</h1>
        </div>

        <div
          className="bg-white rounded-3xl overflow-hidden"
          style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
        >
          {/* Gradient header */}
          <div
            className="px-6 pt-6 pb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(91,71,224,0.06), rgba(124,58,237,0.03))',
              borderBottom: '1px solid #ECECE6',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(91,71,224,0.10)' }}
              >
                <Lock className="size-4" style={{ color: '#5B47E0' }} />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-foreground">Accept your invitation</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Set a password to activate your account.</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {!token ? (
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.20)' }}
              >
                <Lock className="mt-0.5 size-4 shrink-0" style={{ color: '#f43f5e' }} />
                <p className="text-sm text-muted-foreground">
                  This link is missing its invitation token. Please use the link from your invitation email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      {...register("password")}
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full h-10 rounded-xl px-3 pr-10 text-sm outline-none bg-white"
                      style={{
                        border: errors.password ? '1px solid #f43f5e' : '1px solid #ECECE6',
                        boxShadow: errors.password ? '0 0 0 3px rgba(244,63,94,0.08)' : 'none',
                      }}
                      onFocus={(e) => {
                        if (!errors.password) {
                          e.currentTarget.style.borderColor = '#5B47E0';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.password) {
                          e.currentTarget.style.borderColor = '#ECECE6';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs" style={{ color: '#f43f5e' }}>{errors.password.message}</p>
                  )}

                  {/* Strength indicators */}
                  {pwValue && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 pt-1"
                    >
                      <div className="flex gap-1">
                        {STRENGTH_CHECKS.map((_, i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: i < passedChecks ? strengthColor : 'rgba(0,0,0,0.08)' }}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {STRENGTH_CHECKS.map((check) => {
                          const ok = check.test(pwValue);
                          return (
                            <span key={check.label} className="flex items-center gap-1 text-[10px]" style={{ color: ok ? '#10D9A0' : '#9CA3AF' }}>
                              <CheckCircle2 className="size-3" />
                              {check.label}
                            </span>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      {...register("confirm")}
                      type={showCf ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full h-10 rounded-xl px-3 pr-10 text-sm outline-none bg-white"
                      style={{
                        border: errors.confirm ? '1px solid #f43f5e' : '1px solid #ECECE6',
                        boxShadow: errors.confirm ? '0 0 0 3px rgba(244,63,94,0.08)' : 'none',
                      }}
                      onFocus={(e) => {
                        if (!errors.confirm) {
                          e.currentTarget.style.borderColor = '#5B47E0';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.confirm) {
                          e.currentTarget.style.borderColor = '#ECECE6';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCf((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCf ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.confirm && (
                    <p className="text-xs" style={{ color: '#f43f5e' }}>{errors.confirm.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-sm font-bold text-white mt-2 transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #111827, #1f2937)', boxShadow: '0 4px 16px rgba(91,71,224,0.30)' }}
                >
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  {isLoading ? "Activating account…" : "Activate account"}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-semibold hover:underline underline-offset-2"
            style={{ color: '#5B47E0' }}
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
}
