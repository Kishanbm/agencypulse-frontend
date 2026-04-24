interface WidgetSkeletonProps {
  type?: "kpi" | "chart" | "table";
}

export function WidgetSkeleton({ type = "kpi" }: WidgetSkeletonProps) {
  if (type === "chart") {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-80 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-muted rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      <div className="h-3 w-20 bg-muted rounded animate-pulse" />
    </div>
  );
}
