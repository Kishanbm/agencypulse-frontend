import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
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
import { forgotPassword } from "@/lib/auth-service";
import { toastError } from "@/lib/http-errors";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setIsLoading(true);
    try {
      await forgotPassword(values.email);
      setSubmitted(true);
    } catch (err) {
      toastError(err, "Could not send reset email");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      tone="cool"
      variant="stats"
      panelHeadline="Reset your password and get back to your dashboards."
      panelSub="We'll email you a secure link to choose a new password. Links expire in 1 hour for your protection."
    >
      <div className="space-y-2 mb-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Back to sign in
        </Link>
        <h1 className="display-md">
          {submitted ? (
            <>Check your <span className="text-gradient-violet">inbox</span></>
          ) : (
            <>Forgot your <span className="text-gradient-violet">password</span>?</>
          )}
        </h1>
        <p className="text-muted-foreground">
          {submitted
            ? "If an account exists for that email, we've sent a reset link. It may take a minute to arrive."
            : "Enter your email and we'll send you a link to reset your password."}
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-mint/10 border border-mint/30">
            <CheckCircle2 className="size-5 text-mint shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Reset link sent</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Check your spam folder if you don't see it within a few minutes. The link expires in 1 hour.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xl"
            className="w-full"
            onClick={() => { setSubmitted(false); form.reset(); }}
          >
            Try a different email
          </Button>
        </div>
      ) : (
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
                    Sending…
                  </span>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </Form>
      )}

      <div className="mt-8 pt-6 border-t border-border/60 text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link to="/login" className="text-violet font-medium hover:text-violet/80">
          Sign in
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
