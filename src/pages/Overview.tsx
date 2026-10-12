import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Boxes, Rocket, Bot, Activity, Users, Timer, Zap, AlertTriangle } from "lucide-react";
import { useApp } from "@/services/store";
import { timeSeries, modelUsage, sumBy, envScaleFactor } from "@/mocks/metrics";
import { generateTraces } from "@/mocks/logs";
import { services } from "@/mocks/data";
import { Kpi, KpiStrip, PageHeader, Panel, StatusBadge, Meter, th, td } from "@/components/common";
import { AreaSeries, Donut, LineSeries, C } from "@/components/charts";
import { TimeRangeTabs } from "@/components/TimeRangeTabs";
import { fmtNum, timeAgo } from "@/lib/format";

const traces = generateTraces(40);

export default function Overview() {
  const { environment, timeRange, models, deployments, agents, audit, users } = useApp();
  const series = useMemo(() => timeSeries(environment, timeRange), [environment, timeRange]);
  const usage = useMemo(() => modelUsage(environment), [environment]);
  const totalReq = sumBy(series, (p) => p.requests);
  const totalErr = sumBy(series, (p) => p.errors);
  const tokens = sumBy(series, (p) => p.tokens);
  const last = series[series.length - 1];
  const avgLat = Math.round(sumBy(series, (p) => p.latencyP50) / series.length);
  const rangeSec = { "1h": 3600, "24h": 86400, "7d": 604800, "30d": 2592000 }[timeRange];
  const envDeps = deployments.filter((d) => d.environment === environment);
  const recent = traces.filter((t) => t.environment === environment).slice(0, 7);
  const events = audit.filter((a) => a.environment === environment).slice(0, 7);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Platform overview"
        description={`Operational summary for the ${environment} environment. All figures are generated from deterministic mock data.`}
        actions={<TimeRangeTabs />}
      />

      <KpiStrip cols={4}>
        <Kpi label="Registered models" value={models.length} icon={Boxes} sub={`${models.filter((m) => m.status === "deployed").length} deployed`} />
        <Kpi label="Running deployments" value={`${envDeps.filter((d) => d.status === "running").length}/${envDeps.length}`} icon={Rocket} sub={`in ${environment}`} />
        <Kpi label="Active agents" value={agents.filter((a) => a.status === "active").length} icon={Bot} sub={`${agents.length} defined`} />
        <Kpi label={`Requests (${timeRange})`} value={fmtNum(totalReq)} icon={Activity} trend={{ v: "+8.2%", good: true }} sub="vs prev. period" />
      </KpiStrip>
      <KpiStrip cols={4}>
        <Kpi label="Active users" value={Math.max(1, Math.round(users.filter((u) => u.status === "active").length * 40 * envScaleFactor[environment]))} icon={Users} sub="unique, simulated" />
        <Kpi label="Avg inference latency (p50)" value={`${avgLat} ms`} icon={Timer} trend={{ v: "-3.1%", good: true }} />
        <Kpi label="Token throughput" value={`${fmtNum(tokens / rangeSec)}/s`} icon={Zap} sub={`${fmtNum(tokens)} tokens total`} />
        <Kpi label="Error rate" value={`${((totalErr / Math.max(1, totalReq)) * 100).toFixed(2)}%`} icon={AlertTriangle} trend={{ v: "+0.1pp", good: false }} />
      </KpiStrip>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Request volume" className="xl:col-span-2" actions={<span className="text-[11px] text-muted-foreground">requests · errors</span>}>
          <AreaSeries data={series as never} keys={[{ key: "requests", color: C.blue }, { key: "errors", color: C.red }]} />
        </Panel>
        <Panel title="Model usage distribution">
          <Donut data={usage} nameKey="model" valueKey="share" />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Resource utilization" className="xl:col-span-2" actions={<span className="text-[11px] text-muted-foreground">% · simulated telemetry</span>}>
          <LineSeries data={series as never} unit="%" keys={[{ key: "gpu", color: C.violet, name: "GPU" }, { key: "vram", color: C.cyan, name: "VRAM" }, { key: "cpu", color: C.blue, name: "CPU" }, { key: "ram", color: C.amber, name: "RAM" }]} />
        </Panel>
        <Panel title="Current utilization">
          <div className="space-y-4">
            {[["GPU utilization", last.gpu], ["VRAM utilization", last.vram], ["CPU usage", last.cpu], ["RAM usage", last.ram]].map(([k, v]) => (
              <div key={k as string}>
                <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="tabular-nums">{v}%</span></div>
                <Meter value={v as number} />
              </div>
            ))}
            <Link to="/infra/compute" className="block text-xs text-primary hover:underline">View GPU inventory →</Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel title="Recent inference requests" className="xl:col-span-3" bodyClass="p-0" actions={<Link to="/observability/traces" className="text-xs text-primary hover:underline">All traces</Link>}>
          <table className="w-full">
            <thead><tr className="border-b"><th className={th}>Trace</th><th className={th}>Model</th><th className={th}>Status</th><th className={th}>Latency</th><th className={th}>Tokens</th><th className={th}>When</th></tr></thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30">
                  <td className={`${td} font-mono text-xs`}>{t.id}</td>
                  <td className={td}>{t.model}</td>
                  <td className={td}><StatusBadge status={t.status === 200 ? "success" : "failed"} /> <span className="text-xs text-muted-foreground ml-1">{t.status}</span></td>
                  <td className={`${td} tabular-nums`}>{t.latencyMs} ms</td>
                  <td className={`${td} tabular-nums`}>{t.promptTokens + t.completionTokens}</td>
                  <td className={`${td} text-muted-foreground text-xs`}>{timeAgo(t.time)}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">No requests in this environment.</td></tr>}
            </tbody>
          </table>
        </Panel>
        <Panel title="Recent platform events" className="xl:col-span-2" actions={<Link to="/security/audit" className="text-xs text-primary hover:underline">Audit log</Link>}>
          <ol className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${e.result === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate"><span className="font-mono text-xs text-cyan-300">{e.action}</span> <span className="text-muted-foreground">on</span> {e.resource}</div>
                  <div className="text-[11px] text-muted-foreground">{e.actor} · {timeAgo(e.time)}</div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title="Service health" bodyClass="p-0" actions={<Link to="/infra/services" className="text-xs text-primary hover:underline">Services</Link>}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 divide-x divide-y divide-border/60">
          {services.map((s) => (
            <div key={s.name} className="p-3">
              <div className="flex items-center justify-between"><span className="text-sm">{s.name}</span><StatusBadge status={s.status} /></div>
              <div className="mt-1 text-[11px] text-muted-foreground">v{s.version} · {s.replicas} replicas</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
