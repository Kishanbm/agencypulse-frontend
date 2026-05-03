import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Lock, Check, AlertTriangle } from "lucide-react";
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
import { resetPassword } from "@/lib/auth-service";
import { toastError } from "@/lib/http-errors";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

const schema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Must contain uppercase, lowercase, and a number",
    ),
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  });

  const password = form.watch("password");
  const passwordChecks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];

  async function onSubmit(values: z.infer<typeof schema>) {
    setIsLoading(true);
    try {
      await resetPassword(token, values.password);
      toast.success("Password reset — please sign in with your new password");
      navigate("/login", { replace: true });
    } catch (err) {
      toastError(err, "Reset failed");
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthSplitLayout tone="warm" variant="features" panelHeadline="" panelSub="">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-coral/10 border border-coral/30">
            <AlertTriangle className="size-5 text-coral shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Missing reset token</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                The reset link is incomplete. Try requesting a new password reset.
              </p>
            </div>
          </div>
          <Link to="/forgot-password">
            <Button size="xl" className="w-full" variant="gradient">
              Request new reset link
            </Button>
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      tone="warm"
      variant="features"
      panelHeadline="Choose a strong new password."
      panelSub="Use a password manager to generate something long and unique. We'll sign you out of all sessions for safety."
    >
      <div className="space-y-2 mb-8">
        <h1 className="display-md">
          Set a new <span className="text-gradient-violet">password</span>
        </h1>
        <p className="text-muted-foreground">
          Pick something only you would remember (or, better yet, that your password manager will).
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">New password</FormLabel>
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
                  Resetting…
                </span>
              ) : (
                <>
                  Reset password
                  <ArrowRight className="size-5" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </AuthSplitLayout>
  );
}
