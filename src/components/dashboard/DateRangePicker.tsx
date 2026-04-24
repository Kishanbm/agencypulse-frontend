import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESET_RANGES: Record<string, DateRange> = {
  "Last 7 Days": {
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  },
  "Last 30 Days": {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  },
  "Last 90 Days": {
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  },
  "This Month": {
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  },
};

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (range: DateRange) => {
    onChange(range);
    setIsOpen(false);
  };

  const handleFromChange = (from: string) => {
    onChange({ ...value, from });
  };

  const handleToChange = (to: string) => {
    onChange({ ...value, to });
  };

  const formatDisplayDate = () => {
    const from = new Date(value.from).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const to = new Date(value.to).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${from} - ${to}`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="w-4 h-4" />
        {formatDisplayDate()}
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESET_RANGES).map(([label, range]) => (
              <button
                key={label}
                onClick={() => handlePresetClick(range)}
                className={`px-3 py-2 text-sm rounded border transition-colors ${
                  value.from === range.from && value.to === range.to
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                From
              </label>
              <input
                type="date"
                value={value.from}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                To
              </label>
              <input
                type="date"
                value={value.to}
                onChange={(e) => handleToChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground"
              onClick={() => setIsOpen(false)}
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
