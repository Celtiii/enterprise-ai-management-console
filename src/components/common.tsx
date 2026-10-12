import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { FlaskConical, Inbox, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function PageHeader({ title, description, actions, simulated = true }: { title: string; description?: string; actions?: ReactNode; simulated?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {simulated && <SimBadge />}
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function SimBadge({ label = "Simulated data" }: { label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300">
          <FlaskConical className="h-3 w-3" /> {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>Prototype: values come from local mock data, not live telemetry or services.</TooltipContent>
    </Tooltip>
  );
}

const toneMap: Record<string, string> = {
  green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  blue: "bg-sky-500/10 text-sky-300 border-sky-500/25",
  amber: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  red: "bg-red-500/10 text-red-300 border-red-500/25",
  gray: "bg-slate-500/10 text-slate-300 border-slate-500/25",
  violet: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
};
const statusTone: Record<string, keyof typeof toneMap> = {
  running: "green", deployed: "green", active: "green", connected: "green", indexed: "green", healthy: "green", succeeded: "green", success: "green", verified: "green", allow: "green", Ready: "green",
  available: "blue", processing: "blue", starting: "blue", restarting: "blue", importing: "blue", invited: "blue", queued: "blue", draft: "gray", info: "blue",
  degraded: "amber", "awaiting-approval": "amber", "require-approval": "amber", warning: "amber", WARN: "amber", Cordoned: "amber", "cpu-only": "cyan", "needs-gpu": "violet", compatible: "green",
  error: "red", failed: "red", failure: "red", denied: "red", deny: "red", revoked: "red", suspended: "red", ERROR: "red", "signature-mismatch": "red", unsupported: "red", incompatible: "red",
  stopped: "gray", disabled: "gray", deprecated: "gray", skipped: "gray", running_: "green", INFO: "blue", DEBUG: "gray",
};

export function StatusBadge({ status, tone, className }: { status: string; tone?: keyof typeof toneMap; className?: string }) {
  const t = tone ?? statusTone[status] ?? "gray";
  const pulse = ["running", "processing", "starting", "restarting", "importing"].includes(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium capitalize whitespace-nowrap", toneMap[t], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", pulse && "pulse-dot")} />
      {status.replace(/-/g, " ")}
    </span>
  );
}

export function Tag({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof toneMap }) {
  return <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap", toneMap[tone])}>{children}</span>;
}

export function Panel({ title, actions, children, className, bodyClass }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <h3 className="text-sm font-medium">{title}</h3>
          {actions}
        </div>
      )}
      <div className={cn("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, sub, icon: Icon, trend }: { label: string; value: ReactNode; sub?: ReactNode; icon?: React.ComponentType<{ className?: string }>; trend?: { v: string; good: boolean } }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5" />}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        {trend && <span className={trend.good ? "text-emerald-400" : "text-red-400"}>{trend.v}</span>}
        {sub}
      </div>
    </div>
  );
}

export function KpiStrip({ children, cols = 4 }: { children: ReactNode; cols?: number }) {
  const c = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" }[cols] ?? "lg:grid-cols-4";
  return <div className={cn("grid grid-cols-2 rounded-lg border bg-card divide-x divide-y lg:divide-y-0 [&>*]:border-border", c)}>{children}</div>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 rounded-full border bg-muted/40 p-3"><Inbox className="h-5 w-5 text-muted-foreground" /></div>
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="mt-1 text-xs text-muted-foreground max-w-sm">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-8 pl-8 text-sm" />
    </div>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", onConfirm, destructive = true }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; confirmLabel?: string; onConfirm: () => void; destructive?: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""} onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Small hook + control for confirm-before-destroy flows. */
export function useConfirm() {
  const [state, setState] = useState<{ title: string; description: string; label: string; fn: () => void } | null>(null);
  const ask = (title: string, description: string, fn: () => void, label = "Delete") => setState({ title, description, fn, label });
  const node = (
    <ConfirmDialog open={!!state} onOpenChange={(o) => !o && setState(null)} title={state?.title ?? ""} description={state?.description ?? ""} confirmLabel={state?.label} onConfirm={() => { state?.fn(); setState(null); }} />
  );
  return { ask, node };
}

export function Pager({ page, pages, onPage, total }: { page: number; pages: number; onPage: (p: number) => void; total: number }) {
  return (
    <div className="flex items-center justify-between px-1 pt-3 text-xs text-muted-foreground">
      <span>{total} result{total === 1 ? "" : "s"}</span>
      <div className="flex items-center gap-2">
        <span>Page {page + 1} of {Math.max(1, pages)}</span>
        <Button size="icon" variant="outline" className="h-7 w-7" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export function usePaged<T>(rows: T[], size = 10) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(page, pages - 1);
  return { slice: rows.slice(p * size, p * size + size), page: p, pages, setPage, total: rows.length };
}

export function Meter({ value, className }: { value: number; className?: string }) {
  const c = value > 85 ? "bg-red-400" : value > 70 ? "bg-amber-400" : "bg-sky-400";
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-muted overflow-hidden", className)}>
      <div className={cn("h-full rounded-full transition-all", c)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function KV({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm border-b border-border/60 last:border-0">
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className={cn("text-right break-all", mono && "font-mono text-xs")}>{v}</span>
    </div>
  );
}

export const th = "h-9 px-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
export const td = "px-3 py-2.5 text-sm";
