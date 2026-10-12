import { useMemo, useState } from "react";
import { useApp } from "@/services/store";
import { timeSeries, latencyHistogram, modelUsage, sumBy } from "@/mocks/metrics";
import { generateTraces, generateLogs, type TraceRow } from "@/mocks/logs";
import { services } from "@/mocks/data";
import { PageHeader, Panel, Kpi, KpiStrip, StatusBadge, Tag, SearchInput, th, td, Pager, usePaged, EmptyState } from "@/components/common";
import { AreaSeries, LineSeries, Bars, C } from "@/components/charts";
import { TimeRangeTabs } from "@/components/TimeRangeTabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { fmtNum, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Monitoring() {
  const { environment, timeRange } = useApp();
  const ts = useMemo(() => timeSeries(environment, timeRange), [environment, timeRange]);
  const hist = useMemo(() => latencyHistogram(environment), [environment]);
  const usage = useMemo(() => modelUsage(environment), [environment]);
  const req = sumBy(ts, (p) => p.requests), err = sumBy(ts, (p) => p.errors);
  const incidents = [
    { t: "45m ago", title: "qwen3-8b-staging CrashLoopBackOff (CUDA OOM)", sev: "high", state: "open" },
    { t: "5h ago", title: "Finance ERP connector TLS certificate expired", sev: "medium", state: "open" },
    { t: "2d ago", title: "Elevated p95 latency on gateway (GPU node drain)", sev: "low", state: "resolved" },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="System monitoring" description={`Platform metrics for ${environment}. All values are simulated until telemetry (Prometheus / OpenTelemetry) is connected.`} actions={<TimeRangeTabs />} />
      <KpiStrip cols={4}>
        <Kpi label="Requests" value={fmtNum(req)} sub={`over ${timeRange}`} />
        <Kpi label="Error rate" value={`${((err / Math.max(req, 1)) * 100).toFixed(2)}%`} />
        <Kpi label="p95 latency" value={`${Math.round(sumBy(ts, (p) => p.latencyP95) / ts.length)} ms`} />
        <Kpi label="Tokens generated" value={fmtNum(sumBy(ts, (p) => p.tokens))} />
      </KpiStrip>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Request volume & errors"><AreaSeries data={ts as never} keys={[{ key: "requests", color: C.blue, name: "Requests" }, { key: "errors", color: C.red, name: "Errors" }]} /></Panel>
        <Panel title="Latency (p50 / p95)"><LineSeries data={ts as never} unit=" ms" keys={[{ key: "latencyP50", color: C.cyan, name: "p50" }, { key: "latencyP95", color: C.violet, name: "p95" }]} /></Panel>
        <Panel title="Latency distribution"><Bars data={hist as never} k="count" x="bucket" color={C.violet} /></Panel>
        <Panel title="Token throughput"><AreaSeries data={ts as never} keys={[{ key: "tokens", color: C.cyan, name: "Tokens" }]} /></Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Model-level metrics" bodyClass="p-0">
          <table className="w-full"><thead><tr className="border-b"><th className={th}>Model</th><th className={th}>Share</th><th className={th}>Requests</th></tr></thead>
            <tbody>{usage.map((u) => { const tot = sumBy(usage, (x) => x.share); return <tr key={u.model} className="border-b border-border/50"><td className={td}>{u.model}</td><td className={`${td} tabular-nums`}>{((u.share / tot) * 100).toFixed(1)}%</td><td className={`${td} tabular-nums`}>{fmtNum(Math.round((u.share / tot) * req))}</td></tr>; })}</tbody></table>
        </Panel>
        <Panel title="Service health & incidents">
          <div className="mb-4 grid grid-cols-2 gap-1.5">{services.slice(0, 8).map((s) => <div key={s.name} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs"><span>{s.name}</span><StatusBadge status={s.status} /></div>)}</div>
          {incidents.map((i) => <div key={i.title} className="flex items-center gap-2 border-t py-2 text-sm"><Tag tone={i.sev === "high" ? "red" : i.sev === "medium" ? "amber" : "gray"}>{i.sev}</Tag><span className="flex-1">{i.title}</span><span className="text-xs text-muted-foreground">{i.t}</span><StatusBadge status={i.state} /></div>)}
        </Panel>
      </div>
    </div>
  );
}

const allTraces = generateTraces(240);
export function Traces() {
  const { environment } = useApp();
  const [q, setQ] = useState(""); const [model, setModel] = useState("all"); const [status, setStatus] = useState("all"); const [scope, setScope] = useState<"env" | "all">("env");
  const [sel, setSel] = useState<TraceRow | null>(null);
  const models = [...new Set(allTraces.map((t) => t.model))];
  const rows = allTraces.filter((t) => (scope === "all" || t.environment === environment) && (model === "all" || t.model === model) && (status === "all" || (status === "ok" ? t.status < 400 : t.status >= 400)) && (t.id + t.user).toLowerCase().includes(q.toLowerCase()));
  const p = usePaged(rows, 15);
  return (
    <div>
      <PageHeader title="Request traces" description="Distributed traces of inference requests (simulated)." />
      <Panel bodyClass="p-0">
        <div className="flex flex-wrap gap-2 border-b p-3">
          <SearchInput value={q} onChange={setQ} placeholder="Trace ID or user…" className="w-60" />
          <Select value={model} onValueChange={setModel}><SelectTrigger className="h-8 w-48 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All models</SelectItem>{models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="ok">Success</SelectItem><SelectItem value="err">Errors</SelectItem></SelectContent></Select>
          <Select value={scope} onValueChange={(v) => setScope(v as "env" | "all")}><SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="env">Env: {environment}</SelectItem><SelectItem value="all">All environments</SelectItem></SelectContent></Select>
        </div>
        {rows.length === 0 ? <EmptyState title="No traces match" /> : <div className="overflow-x-auto"><table className="w-full">
          <thead><tr className="border-b"><th className={th}>Time</th><th className={th}>Trace</th><th className={th}>Model</th><th className={th}>Endpoint</th><th className={th}>Status</th><th className={th}>Latency</th><th className={th}>Tokens</th><th className={th}>User</th></tr></thead>
          <tbody>{p.slice.map((t) => <tr key={t.id} onClick={() => setSel(t)} className="border-b border-border/50 cursor-pointer hover:bg-accent/30">
            <td className={`${td} text-xs text-muted-foreground`}>{fmtTime(t.time)}</td><td className={`${td} font-mono text-xs`}>{t.id}</td><td className={td}>{t.model}</td>
            <td className={`${td} font-mono text-xs`}>{t.endpoint}</td><td className={td}><Tag tone={t.status < 400 ? "green" : "red"}>{t.status}</Tag></td>
            <td className={`${td} tabular-nums`}>{t.latencyMs} ms</td><td className={`${td} tabular-nums text-xs`}>{t.promptTokens}/{t.completionTokens}</td><td className={`${td} text-xs`}>{t.user}</td></tr>)}</tbody></table></div>}
        <div className="px-3 pb-3"><Pager {...p} onPage={p.setPage} /></div>
      </Panel>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}><SheetContent className="w-full sm:max-w-xl">
        {sel && <><SheetHeader><SheetTitle className="font-mono">{sel.id}</SheetTitle><SheetDescription>{sel.model} · {sel.endpoint} · {sel.latencyMs} ms · simulated</SheetDescription></SheetHeader>
          <div className="mt-6 space-y-2">{sel.spans.map((s) => { const total = Math.max(sel.latencyMs, 1); return (
            <div key={s.name}><div className="flex justify-between text-xs"><span className="font-mono">{s.name}</span><span className="text-muted-foreground">{s.dur} ms</span></div>
              <div className="relative h-2 rounded bg-muted"><div className="absolute h-2 rounded bg-primary/70" style={{ left: `${(s.start / total) * 100}%`, width: `${Math.max(1, (s.dur / total) * 100)}%` }} /></div></div>); })}</div></>}
      </SheetContent></Sheet>
    </div>
  );
}

const allLogs = generateLogs(400);
export function Logs() {
  const { environment } = useApp();
  const [q, setQ] = useState(""); const [level, setLevel] = useState("all"); const [svc, setSvc] = useState("all");
  const svcs = [...new Set(allLogs.map((l) => l.service))];
  const rows = allLogs.filter((l) => l.environment === environment && (level === "all" || l.level === level) && (svc === "all" || l.service === svc) && l.message.toLowerCase().includes(q.toLowerCase()));
  const p = usePaged(rows, 25);
  const lc = { INFO: "text-sky-300", WARN: "text-amber-300", ERROR: "text-red-400", DEBUG: "text-muted-foreground" };
  return (
    <div>
      <PageHeader title="Application logs" description={`Structured logs from platform services in ${environment} (simulated).`} />
      <Panel bodyClass="p-0">
        <div className="flex flex-wrap gap-2 border-b p-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search messages…" className="w-72" />
          <Select value={level} onValueChange={setLevel}><SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All levels</SelectItem>{["ERROR", "WARN", "INFO", "DEBUG"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
          <Select value={svc} onValueChange={setSvc}><SelectTrigger className="h-8 w-48 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All services</SelectItem>{svcs.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="bg-[hsl(224_32%_6%)] p-2 font-mono text-[11.5px]">
          {p.slice.length === 0 ? <p className="p-6 text-center text-muted-foreground">No log lines match.</p> : p.slice.map((l) => (
            <div key={l.id} className="flex gap-3 px-2 py-0.5 hover:bg-white/5"><span className="text-muted-foreground shrink-0">{fmtTime(l.time)}</span><span className={cn("w-12 shrink-0", lc[l.level])}>{l.level}</span><span className="w-36 shrink-0 truncate text-violet-300">{l.service}</span><span className="text-slate-300">{l.message}</span></div>))}
        </div>
        <div className="px-3 pb-3"><Pager {...p} onPage={p.setPage} /></div>
      </Panel>
    </div>
  );
}
