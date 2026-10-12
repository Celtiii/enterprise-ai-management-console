import { useApp } from "@/services/store";
import type { TimeRange } from "@/types";
import { cn } from "@/lib/utils";

export function TimeRangeTabs() {
  const { timeRange, setTimeRange } = useApp();
  return (
    <div className="inline-flex rounded-md border bg-muted/30 p-0.5" role="tablist" aria-label="Time range">
      {(["1h", "24h", "7d", "30d"] as TimeRange[]).map((r) => (
        <button key={r} role="tab" aria-selected={timeRange === r} onClick={() => setTimeRange(r)} className={cn("rounded px-2.5 py-1 text-xs font-medium", timeRange === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{r}</button>
      ))}
    </div>
  );
}
