import { Construction } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StubPageProps {
  /** Slice identifier from FRONTEND_INTEGRATION_PLAN.md (e.g. "B5"). */
  sliceId: string;
  /** Human-readable feature name (e.g. "Dashboard viewer"). */
  feature: string;
  /** Optional endpoints this page will call, shown as dev breadcrumbs. */
  endpoints?: string[];
}

/**
 * Temporary placeholder used during the Phase-B rollout. Every route registered
 * in App.tsx lands on this until its slice is implemented, so navigation is
 * never dead. Backend is ready; the frontend wiring is intentionally deferred.
 */
export function StubPage({ sliceId, feature, endpoints }: StubPageProps) {
  return (
    <div className="flex items-center justify-center h-full py-16">
      <Card className="max-w-lg w-full">
        <CardHeader className="items-start">
          <Badge variant="secondary" className="mb-2 uppercase tracking-wide">
            Slice {sliceId}
          </Badge>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Construction className="w-5 h-5 text-muted-foreground" />
            {feature}
          </CardTitle>
          <CardDescription>
            This screen is next up in the build. The backend is live and
            tested — the frontend wiring will land in slice {sliceId}.
          </CardDescription>
        </CardHeader>
        {endpoints && endpoints.length > 0 && (
          <CardContent>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Endpoints this page will use
            </p>
            <ul className="space-y-1 text-sm font-mono text-muted-foreground">
              {endpoints.map((ep) => (
                <li key={ep}>{ep}</li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
