interface KPIWidgetProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  comparison?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function KPIWidget({
  label,
  value,
  trend,
  comparison,
  isLoading,
  error,
  onRetry,
}: KPIWidgetProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        {comparison && <div className="h-3 w-20 bg-muted rounded animate-pulse" />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="text-sm text-red-600">{error}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-primary hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const trendColor = trend?.isPositive ? "text-emerald-600" : "text-red-600";
  const trendIcon = trend?.isPositive ? "↑" : "↓";

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-black text-foreground">{value}</p>
      {trend && (
        <p className={`text-xs ${trendColor}`}>
          {trendIcon}{Math.abs(trend.value).toFixed(1)}%
        </p>
      )}
      {comparison && (
        <p className="text-xs text-muted-foreground">{comparison}</p>
      )}
    </div>
  );
}
