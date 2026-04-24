import { AlertCircle } from "lucide-react";

interface WidgetEmptyStateProps {
  message?: string;
}

export function WidgetEmptyState({
  message = "No data available for this date range",
}: WidgetEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
