import { formatValue } from "@/lib/formatters";

interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface TableRow {
  [key: string]: string | number;
}

interface TableWidgetProps {
  columns: TableColumn[];
  rows: TableRow[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function TableWidget({
  columns,
  rows,
  isLoading,
  error,
  onRetry,
}: TableWidgetProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error}</p>
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

  if (!rows || rows.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        No data available
      </div>
    );
  }

  const alignClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-sm font-semibold text-foreground ${alignClass(col.align)}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-border hover:bg-muted/50 transition-colors last:border-b-0"
            >
              {columns.map((col) => (
                <td
                  key={`${idx}-${col.key}`}
                  className={`px-4 py-3 text-sm text-foreground ${alignClass(col.align)}`}
                >
                  {typeof row[col.key] === "number" 
                    ? formatValue(row[col.key] as number, col.key)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
