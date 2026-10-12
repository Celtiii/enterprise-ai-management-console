import { useState } from "react";
import { Upload, Download, ShieldCheck, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/services/store";
import { gpuInventory, computeNodes, services, storageVolumes, artifacts as seedArtifacts } from "@/mocks/data";
import { PageHeader, Panel, Kpi, KpiStrip, StatusBadge, Tag, Meter, th, td } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Compute() {
  const [mode, setMode] = useState<"gpu" | "cpu">("gpu");
  const avg = Math.round(gpuInventory.reduce((a, g) => a + g.util, 0) / gpuInventory.length);
  const vram = gpuInventory.reduce((a, g) => a + g.memUsed, 0), vramT = gpuInventory.reduce((a, g) => a + g.memTotal, 0);
  return (
    <div className="space-y-4">
      <PageHeader title="Compute & GPUs" description="Cluster nodes and accelerator inventory. Metrics are simulated until connected to DCGM / node exporters." simulated />
      <KpiStrip cols={4}>
        <Kpi label="Nodes" value={String(computeNodes.length)} sub={`${computeNodes.filter((n) => n.type === "GPU").length} GPU · ${computeNodes.filter((n) => n.type !== "GPU").length} CPU`} />
        <Kpi label="GPUs" value={String(gpuInventory.length)} />
        <Kpi label="Avg GPU util" value={`${avg}%`} />
        <Kpi label="VRAM in use" value={`${vram} / ${vramT} GB`} />
      </KpiStrip>
      <Panel title="Compute nodes" bodyClass="p-0"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b"><th className={th}>Node</th><th className={th}>Type</th><th className={th}>Zone</th><th className={th}>CPU</th><th className={th}>RAM</th><th className={th}>GPUs</th><th className={th}>Status</th></tr></thead>
        <tbody>{computeNodes.map((n) => <tr key={n.name} className="border-b border-border/50"><td className={`${td} font-mono text-xs`}>{n.name}</td><td className={td}><Tag tone={n.type === "GPU" ? "violet" : "gray"}>{n.type}</Tag></td><td className={`${td} text-xs`}>{n.zone}</td>
          <td className={`${td} w-40`}><div className="text-[11px] text-muted-foreground">{n.cpu}</div><Meter value={n.cpuUtil} /></td><td className={`${td} w-40`}><div className="text-[11px] text-muted-foreground">{n.ram}</div><Meter value={n.ramUtil} /></td>
          <td className={`${td} tabular-nums`}>{n.gpus}</td><td className={td}><StatusBadge status={n.status} /></td></tr>)}</tbody></table></div></Panel>
      <Panel title="GPU inventory" bodyClass="p-0"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b"><th className={th}>GPU</th><th className={th}>Node</th><th className={th}>Model</th><th className={th}>Utilization</th><th className={th}>Memory</th><th className={th}>Temp</th><th className={th}>Power</th><th className={th}>Assigned to</th></tr></thead>
        <tbody>{gpuInventory.map((g) => <tr key={g.id} className="border-b border-border/50"><td className={`${td} font-mono text-xs`}>{g.id}</td><td className={`${td} font-mono text-xs`}>{g.node}</td><td className={`${td} text-xs`}>{g.model}</td>
          <td className={`${td} w-36`}><Meter value={g.util} /></td><td className={`${td} w-40`}><div className="text-[11px] text-muted-foreground">{g.memUsed}/{g.memTotal} GB</div><Meter value={(g.memUsed / g.memTotal) * 100} /></td>
          <td className={`${td} tabular-nums text-xs`}>{g.temp}°C</td><td className={`${td} tabular-nums text-xs`}>{g.power} W</td><td className={`${td} text-xs`}>{g.assigned || <span className="text-muted-foreground">idle</span>}</td></tr>)}</tbody></table></div></Panel>
      <Panel title="Execution profile (sample environment)" actions={<Select value={mode} onValueChange={(v) => setMode(v as "gpu" | "cpu")}><SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gpu">GPU-enabled</SelectItem><SelectItem value="cpu">CPU-only</SelectItem></SelectContent></Select>}>
        <pre className="overflow-x-auto rounded bg-[hsl(224_32%_6%)] p-3 font-mono text-xs text-slate-300">{mode === "gpu"
          ? `runtime: vllm/vllm-openai:v0.9.2\nresources:\n  nvidia.com/gpu: 1\n  memory: 48Gi\nargs: [--gpu-memory-utilization=0.90, --dtype=bfloat16]\nsuited for: Qwen3-8B, Qwen3-Coder-30B (AWQ)`
          : `runtime: vllm/vllm-openai-cpu:v0.9.2\nresources:\n  cpu: "32"\n  memory: 64Gi\nenv: { VLLM_CPU_KVCACHE_SPACE: "16" }\nsuited for: Qwen3-0.6B, embedding models (low throughput)`}</pre>
      </Panel>
    </div>
  );
}

export function Services() {
  const { deployments } = useApp();
  return (
    <div className="space-y-4">
      <PageHeader title="Runtime services" description="Platform services, vLLM instances and their dependencies (simulated)." simulated />
      <Panel title="Platform services" bodyClass="p-0"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b"><th className={th}>Service</th><th className={th}>Version</th><th className={th}>Replicas</th><th className={th}>Latency</th><th className={th}>Depends on</th><th className={th}>Status</th></tr></thead>
        <tbody>{services.map((s) => <tr key={s.name} className="border-b border-border/50"><td className={`${td} font-medium`}>{s.name}</td><td className={`${td} font-mono text-xs`}>{s.version}</td><td className={`${td} tabular-nums`}>{s.replicas}</td><td className={`${td} tabular-nums text-xs`}>{s.latency}</td>
          <td className={td}><div className="flex flex-wrap gap-1">{s.deps.length ? s.deps.map((d) => <Tag key={d} tone="blue">{d}</Tag>) : <span className="text-xs text-muted-foreground">—</span>}</div></td><td className={td}><StatusBadge status={s.status} /></td></tr>)}</tbody></table></div></Panel>
      <Panel title="vLLM instances" bodyClass="p-0"><table className="w-full"><thead><tr className="border-b"><th className={th}>Deployment</th><th className={th}>Environment</th><th className={th}>Replicas</th><th className={th}>Status</th></tr></thead>
        <tbody>{deployments.map((d) => <tr key={d.id} className="border-b border-border/50"><td className={`${td} font-mono text-xs`}>{d.name}</td><td className={`${td} text-xs capitalize`}>{d.environment}</td><td className={`${td} tabular-nums`}>{d.replicas}</td><td className={td}><StatusBadge status={d.status} /></td></tr>)}</tbody></table></Panel>
    </div>
  );
}

export function Storage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Storage" description="Model stores, vector indexes, object storage and databases (simulated usage)." simulated />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{storageVolumes.map((v) => { const pct = (v.used / v.total) * 100; return (
        <Panel key={v.name}><div className="flex items-start gap-3"><HardDrive className="mt-0.5 h-5 w-5 text-cyan-400" /><div className="flex-1">
          <div className="flex justify-between"><span className="font-medium">{v.name}</span><Tag>{v.type}</Tag></div>
          <p className="font-mono text-[11px] text-muted-foreground">{v.mount}</p>
          <div className="mt-3 flex justify-between text-xs"><span>{v.used} / {v.total} {v.unit}</span><span className={pct > 85 ? "text-red-400" : "text-muted-foreground"}>{pct.toFixed(0)}%</span></div>
          <Progress value={pct} className="mt-1 h-1.5" /></div></div></Panel>); })}</div>
    </div>
  );
}

type Art = (typeof seedArtifacts)[number];
export function Artifacts() {
  const { audit_, settings } = useApp();
  const [list, setList] = useState<Art[]>(seedArtifacts);
  const [open, setOpen] = useState(false); const [f, setF] = useState({ name: "", kind: "model", path: "/mnt/transfer/" });
  const [progress, setProgress] = useState<number | null>(null);
  const runImport = () => {
    if (!f.name.trim()) { toast.error("Artifact name required"); return; }
    setProgress(0); let p = 0;
    const iv = setInterval(() => { p += 12 + Math.random() * 15; if (p >= 100) { clearInterval(iv); setProgress(null); setOpen(false);
      setList((l) => [{ name: f.name, kind: f.kind, size: "—", sha: "sha256:" + Math.random().toString(16).slice(2, 14), source: f.path, status: "verified" } as Art, ...l]);
      audit_("artifact.import", `artifact/${f.name}`); toast.success("Import simulated — checksum and signature marked verified (mock)"); } else setProgress(p); }, 350);
  };
  const exportBundle = () => {
    const manifest = JSON.stringify({ generated: new Date().toISOString(), note: "Prototype export manifest (no artifacts included)", artifacts: list.map(({ name, kind, sha }) => ({ name, kind, sha })) }, null, 2);
    const url = URL.createObjectURL(new Blob([manifest], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = "airgap-bundle-manifest.json"; a.click(); URL.revokeObjectURL(url);
    audit_("artifact.export_manifest", "artifacts"); toast.success("Bundle manifest exported");
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Offline artifacts" description="Air-gapped artifact management: model weights, container images and Helm charts imported via physical media or a one-way transfer." simulated actions={<>
        <Button size="sm" variant="outline" onClick={exportBundle}><Download className="mr-1.5 h-4 w-4" />Export manifest</Button>
        <Button size="sm" onClick={() => setOpen(true)}><Upload className="mr-1.5 h-4 w-4" />Import artifact</Button></>} />
      <Panel>
        <div className="grid gap-3 text-sm md:grid-cols-4">
          {["1. Stage bundle on connected side", "2. Sign & checksum (cosign / sha256)", "3. Transfer via approved media / data diode", "4. Verify & push to internal registry"].map((s, i) => <div key={s} className="rounded-md border p-3"><span className="text-xs text-cyan-400">Step {i + 1}</span><p className="mt-1">{s.slice(3)}</p></div>)}
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-400" />Air-gapped mode is {settings.airGapped ? "ON" : "OFF"} in Settings. Internal registry: registry.ai.corp.internal</p>
      </Panel>
      <Tabs defaultValue="all"><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="model">Models</TabsTrigger><TabsTrigger value="image">Container images</TabsTrigger></TabsList>
        {["all", "model", "image"].map((k) => <TabsContent key={k} value={k}><Panel bodyClass="p-0"><div className="overflow-x-auto"><table className="w-full">
          <thead><tr className="border-b"><th className={th}>Artifact</th><th className={th}>Kind</th><th className={th}>Size</th><th className={th}>Digest</th><th className={th}>Source</th><th className={th}>Status</th></tr></thead>
          <tbody>{list.filter((a) => k === "all" || a.kind === k).map((a) => <tr key={a.name + a.sha} className="border-b border-border/50"><td className={`${td} font-mono text-xs`}>{a.name}</td><td className={td}><Tag tone={a.kind === "model" ? "violet" : a.kind === "image" ? "cyan" : "gray"}>{a.kind}</Tag></td>
            <td className={`${td} text-xs`}>{a.size}</td><td className={`${td} font-mono text-[11px] text-muted-foreground`}>{a.sha}</td><td className={`${td} font-mono text-[11px]`}>{a.source}</td><td className={td}><StatusBadge status={a.status} /></td></tr>)}</tbody></table></div></Panel></TabsContent>)}
      </Tabs>
      <Dialog open={open} onOpenChange={(o) => progress === null && setOpen(o)}><DialogContent>
        <DialogHeader><DialogTitle>Import offline artifact</DialogTitle><DialogDescription>Simulates verifying and importing from local transfer media. No files are read.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Artifact name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Qwen3-14B-AWQ" /></div>
          <div className="space-y-1"><Label className="text-xs">Kind</Label><Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="model">Model weights</SelectItem><SelectItem value="image">Container image</SelectItem><SelectItem value="chart">Helm chart</SelectItem></SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Source path</Label><Input value={f.path} onChange={(e) => setF({ ...f, path: e.target.value })} className="font-mono text-xs" /></div>
          {progress !== null && <div><p className="mb-1 text-xs text-muted-foreground">{progress < 40 ? "Reading bundle…" : progress < 75 ? "Verifying checksum & signature…" : "Pushing to internal registry…"}</p><Progress value={progress} className="h-1.5" /></div>}
        </div>
        <DialogFooter><Button variant="outline" disabled={progress !== null} onClick={() => setOpen(false)}>Cancel</Button><Button disabled={progress !== null} onClick={runImport}>Start import</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
