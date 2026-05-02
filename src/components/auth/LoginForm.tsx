import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react";
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
import { login } from "@/lib/auth-service";
import { roleHome } from "@/lib/rbac";
import { toastError } from "@/lib/http-errors";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const res = await login(values);
      toast.success(`Welcome back, ${res.user.firstName}`);
      navigate(roleHome(res.user.role), { replace: true });
    } catch (err) {
      toastError(err, "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      tone="cool"
      variant="stats"
      panelHeadline="Welcome back. Your dashboards missed you."
      panelSub="Connect every channel, build branded reports, send them while you sleep. The reporting platform agencies actually love."
    >
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet/10 text-violet text-xs font-medium mb-3">
          <span className="size-1.5 rounded-full bg-violet" />
          Sign in
        </div>
        <h1 className="display-md">
          Welcome back to{" "}
          <span className="text-gradient-violet">AgencyPulse</span>
        </h1>
        <p className="text-muted-foreground">
          Sign in to access your agency workspace.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email</FormLabel>
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
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Password</FormLabel>
                  <a
                    href="#"
                    className="text-xs text-violet hover:text-violet/80 font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                <FormMessage />
              </FormItem>
            )}
          />

          <motion.div whileTap={{ scale: 0.99 }}>
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
                  Signing in…
                </span>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-5" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      <div className="mt-8 pt-6 border-t border-border/60 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-violet font-medium hover:text-violet/80"
        >
          Start free trial
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
