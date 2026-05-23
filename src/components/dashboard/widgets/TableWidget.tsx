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
      <div className="space-y-2 h-full flex-1 w-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-muted/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 h-full flex-1 flex flex-col items-center justify-center w-full">
        <p className="text-sm font-medium text-red-600">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-primary font-medium hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm h-full flex-1 flex items-center justify-center w-full">
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
    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100%-20px)] w-full">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground ${alignClass(col.align)}`}
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
              className="border-b border-border/40 hover:bg-muted/20 transition-colors last:border-b-0"
            >
              {columns.map((col) => (
                <td
                  key={`${idx}-${col.key}`}
                  className={`px-3 py-2.5 font-medium text-foreground ${alignClass(col.align)}`}
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
