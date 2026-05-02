import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { register as registerAgency } from "@/lib/auth-service";
import { roleHome } from "@/lib/rbac";
import { toastError } from "@/lib/http-errors";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

const registerSchema = z.object({
  agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Must contain uppercase, lowercase, and a number",
    ),
});

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agencyName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const password = form.watch("password");
  const passwordChecks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      const res = await registerAgency(values);
      toast.success(`Welcome, ${res.user.firstName} — agency created`);
      navigate(roleHome(res.user.role), { replace: true });
    } catch (err) {
      toastError(err, "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      tone="warm"
      variant="features"
      panelHeadline="Build the reporting workspace your clients will brag about."
      panelSub="Spin up your agency in 30 seconds. 14 days free, every feature unlocked. No card. No catch."
    >
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-coral/10 text-coral text-xs font-medium mb-3">
          <span className="size-1.5 rounded-full bg-coral" />
          Create your agency
        </div>
        <h1 className="display-md">
          Start your{" "}
          <span className="text-gradient-violet">14-day trial</span>
        </h1>
        <p className="text-muted-foreground">
          No card required. Cancel anytime. Set up in under five minutes.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="agencyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Agency name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                    <Input
                      placeholder="Acme Marketing"
                      className="h-12 pl-11 rounded-xl text-sm bg-white"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      <Input
                        placeholder="Jane"
                        autoComplete="given-name"
                        className="h-12 pl-11 rounded-xl text-sm bg-white"
                        {...field}
                      />
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
                    <Input
                      placeholder="Doe"
                      autoComplete="family-name"
                      className="h-12 rounded-xl text-sm bg-white px-3.5"
                      {...field}
                    />
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
                    <Input
                      type="email"
                      placeholder="you@agency.com"
                      autoComplete="email"
                      className="h-12 pl-11 rounded-xl text-sm bg-white"
                      {...field}
                    />
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
                      className="h-12 pl-11 pr-11 rounded-xl text-sm bg-white"
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
                        className={`inline-flex items-center gap-1.5 text-[11px] transition-colors ${
                          c.ok ? "text-mint" : "text-muted-foreground/70"
                        }`}
                      >
                        <span
                          className={`size-3.5 rounded-full flex items-center justify-center ${
                            c.ok ? "bg-mint/15" : "bg-muted"
                          }`}
                        >
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

          <motion.div whileTap={{ scale: 0.99 }} className="pt-1">
            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating your agency…
                </span>
              ) : (
                <>
                  Create my agency
                  <ArrowRight className="size-5" />
                </>
              )}
            </Button>
          </motion.div>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            By signing up, you agree to our{" "}
            <a href="#" className="text-foreground underline underline-offset-2">Terms</a> and{" "}
            <a href="#" className="text-foreground underline underline-offset-2">Privacy Policy</a>.
          </p>
        </form>
      </Form>

      <div className="mt-7 pt-6 border-t border-border/60 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-violet font-medium hover:text-violet/80"
        >
          Sign in
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
