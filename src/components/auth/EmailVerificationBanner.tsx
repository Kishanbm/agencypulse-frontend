import { useState } from "react";
import { Mail, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store";
import { resendVerification } from "@/lib/auth-service";
import { toastError } from "@/lib/http-errors";

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user) return null;
  if (user.emailVerifiedAt) return null;
  if (dismissed) return null;

  async function onResend() {
    setSending(true);
    try {
      const res = await resendVerification();
      toast.success(res.message);
    } catch (err) {
      toastError(err, "Could not send verification email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="px-4 py-2 flex items-center gap-3 text-xs"
      style={{
        background: "linear-gradient(90deg, rgba(245,165,36,0.10), rgba(245,165,36,0.04))",
        borderBottom: "1px solid rgba(245,165,36,0.25)",
      }}
    >
      <Mail className="size-3.5 text-amber-600 shrink-0" />
      <p className="flex-1 text-amber-900 dark:text-amber-300">
        <span className="font-semibold">Verify your email</span>
        <span className="text-amber-800/80 dark:text-amber-300/80">
          {" "}— we sent a link to <span className="font-mono text-[11px]">{user.email}</span>. Verifying unlocks team invites and report sending.
        </span>
      </p>
      <button
        onClick={onResend}
        disabled={sending}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-900 hover:bg-amber-500/10 transition-colors disabled:opacity-60"
      >
        {sending ? <Loader2 className="size-3 animate-spin" /> : null}
        {sending ? "Sending…" : "Resend email"}
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="size-6 rounded-md flex items-center justify-center text-amber-700/70 hover:bg-amber-500/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
