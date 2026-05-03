import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmail, fetchMe } from "@/lib/auth-service";
import { useAuthStore } from "@/lib/store";
import { roleHome } from "@/lib/rbac";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification link is missing the token. Try the link from your email again.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await verifyEmail(token);
        if (cancelled) return;
        setStatus("success");
        setMessage(res.message);
        // Refresh /auth/me so the verified state propagates if user is logged in
        if (user) await fetchMe();
      } catch (err: unknown) {
        if (cancelled) return;
        setStatus("error");
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? "Verification failed";
        setMessage(msg);
      }
    })();

    return () => { cancelled = true; };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthSplitLayout
      tone="cool"
      variant="stats"
      panelHeadline="Verifying your email…"
      panelSub="Verifying confirms ownership and unlocks features like inviting team members and sending client reports."
    >
      <div className="space-y-6">
        {status === "verifying" && (
          <div className="flex flex-col items-center text-center py-8">
            <Loader2 className="size-12 text-violet animate-spin mb-4" />
            <h1 className="display-md mb-2">
              Verifying your <span className="text-gradient-violet">email</span>…
            </h1>
            <p className="text-muted-foreground text-sm">Just a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-6">
              <div className="size-14 rounded-full bg-mint/15 flex items-center justify-center mb-4">
                <CheckCircle2 className="size-8 text-mint" />
              </div>
              <h1 className="display-md mb-2">
                Email <span className="text-gradient-violet">verified</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
            </div>
            <Button
              size="xl"
              variant="gradient"
              className="w-full"
              onClick={() => navigate(user ? roleHome(user.role) : "/login", { replace: true })}
            >
              {user ? "Continue to dashboard" : "Sign in"}
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-6">
              <div className="size-14 rounded-full bg-coral/15 flex items-center justify-center mb-4">
                <AlertTriangle className="size-8 text-coral" />
              </div>
              <h1 className="display-md mb-2">Verification failed</h1>
              <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
            </div>
            <Link to={user ? roleHome(user.role) : "/login"}>
              <Button size="xl" variant="outline" className="w-full">
                {user ? "Go to dashboard" : "Sign in"}
              </Button>
            </Link>
            {user && (
              <p className="text-xs text-muted-foreground text-center">
                You can request a new verification email from the banner in your dashboard.
              </p>
            )}
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}
