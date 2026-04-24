import { AlertCircle } from "lucide-react";

interface WidgetErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function WidgetError({
  title = "Error loading widget",
  message,
  onRetry,
}: WidgetErrorProps) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-6 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="font-semibold text-red-900">{title}</p>
      </div>
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-700 hover:text-red-900 font-medium hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
