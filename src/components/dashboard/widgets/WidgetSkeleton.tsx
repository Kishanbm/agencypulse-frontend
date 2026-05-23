interface WidgetSkeletonProps {
  type?: "kpi" | "chart" | "table";
}

export function WidgetSkeleton({ type = "kpi" }: WidgetSkeletonProps) {
  if (type === "chart") {
    return <div className="h-full flex-1 w-full bg-muted/40 rounded-xl animate-pulse" />;
  }

  if (type === "table") {
    return (
      <div className="space-y-2.5 h-full flex-1 w-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-muted/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="h-2.5 w-20 rounded-full animate-pulse bg-muted/50" />
      <div className="h-8 w-24 rounded-lg animate-pulse bg-muted" />
      <div className="h-5 w-14 rounded-full animate-pulse bg-muted/50" />
    </div>
  );
}
