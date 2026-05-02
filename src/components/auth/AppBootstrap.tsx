import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/lib/store";
import { fetchMe } from "@/lib/auth-service";

/**
 * On app boot, if a persisted access token exists, hydrate the latest user
 * profile from /auth/me (interceptor will try one refresh-on-401). This
 * prevents a flash of "logged in" state backed by a stale or revoked token.
 */
export function AppBootstrap({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const [ready, setReady] = useState(!token);

  useEffect(() => {
    let active = true;
    if (!token) {
      setReady(true);
      return;
    }
    void (async () => {
      await fetchMe();
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
    // Intentionally only run once on mount. Token changes post-mount come from
    // user-initiated login/logout which already drive navigation on their own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
