import { useState } from "react";
import { Play, Square, RotateCw, Settings2, Plus, Trash2, Cpu } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid, modelName } from "@/services/store";
import type { Deployment, DeploymentStatus } from "@/types";
import { PageHeader, Panel, StatusBadge, Tag, KV, EmptyState, useConfirm, th, td } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export function vllmCommand(d: Deployment, artifact: string) {
  return [
    `vllm serve ${artifact}`,
    `  --served-model-name ${d.name}`,
    `  --host 0.0.0.0 --port 8000`,
    `  --max-model-len ${d.maxModelLen}`,
    `  --max-num-seqs ${d.maxNumSeqs}`,
    d.runtime === "vLLM (CPU)" ? `  --device cpu` : `  --gpu-memory-utilization ${d.gpuMemoryUtilization}`,
    d.tensorParallel > 1 ? `  --tensor-parallel-size ${d.tensorParallel}` : null,
    `  --api-key $VLLM_API_KEY   # injected from secret store, never in frontend`,
  ].filter(Boolean).join(" \\\n");
}

export default function Deployments() {
  const { deployments, models, environment, update, add, remove, audit_, notify } = useApp();
  const [envFilter, setEnvFilter] = useState<"current" | "all">("current");
  const rows = deployments.filter((d) => envFilter === "all" || d.environment === environment);
  const [selId, setSelId] = useState<string | null>(rows[0]?.id ?? null);
  const sel = deployments.find((d) => d.id === selId) ?? null;
  const [cfgOpen, setCfgOpen] = useState<Deployment | "new" | null>(null);
  const { ask, node } = useConfirm();

  const transition = (d: Deployment, mid: DeploymentStatus, end: DeploymentStatus, verb: string) => {
    update("deployments", d.id, { status: mid });
    audit_(`deployment.${verb}`, `deployment/${d.name}`);
    toast.info(`Prototype action: ${verb} ${d.name}`, { description: "No real workload was changed." });
    setTimeout(() => { update("deployments", d.id, { status: end, updatedAt: new Date().toISOString() }); if (end === "running") notify({ title: "Deployment ready", body: `${d.name} is running (simulated).`, level: "success" }); }, 1800);
  };
  const artifact = (d: Deployment) => models.find((m) => m.id === d.modelId)?.artifactPath ?? d.modelId;

  return (
    <div>
      {node}
      <PageHeader title="Deployments" description="vLLM serving deployments. Start/stop/restart are simulated prototype actions." actions={<>
        <Select value={envFilter} onValueChange={(v) => setEnvFilter(v as "current" | "all")}><SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="current">Current env ({environment})</SelectItem><SelectItem value="all">All environments</SelectItem></SelectContent></Select>
        <Button size="sm" onClick={() => setCfgOpen("new")}><Plus className="mr-1.5 h-4 w-4" />New deployment</Button>
      </>} />
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" bodyClass="p-0">
          {rows.length === 0 ? <EmptyState title={`No deployments in ${environment}`} action={<Button size="sm" onClick={() => setCfgOpen("new")}>Create deployment</Button>} /> : (
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr className="border-b"><th className={th}>Name</th><th className={th}>Model</th><th className={th}>Runtime</th><th className={th}>Replicas</th><th className={th}>GPUs</th><th className={th}>Status</th><th className={th} /></tr></thead>
              <tbody>{rows.map((d) => (
                <tr key={d.id} onClick={() => setSelId(d.id)} className={cn("border-b border-border/50 cursor-pointer", d.id === selId ? "bg-accent/50" : "hover:bg-accent/30")}>
                  <td className={td}><div className="font-mono text-[13px]">{d.name}</div><div className="text-[11px] text-muted-foreground capitalize">{d.environment} · {timeAgo(d.updatedAt)}</div></td>
                  <td className={td}>{modelName(models, d.modelId)}</td>
                  <td className={td}><Tag tone={d.runtime.includes("CPU") ? "cyan" : "violet"}>{d.runtime}</Tag></td>
                  <td className={`${td} tabular-nums`}>{d.replicas}</td>
                  <td className={`${td} text-xs`}>{d.gpus.length || <span className="inline-flex items-center gap-1 text-cyan-300"><Cpu className="h-3 w-3" />CPU</span>}</td>
                  <td className={td}><StatusBadge status={d.status} /></td>
                  <td className={`${td} text-right whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                    {d.status === "running" ? <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Stop" onClick={() => ask("Stop deployment?", `${d.name} will stop serving requests (simulated).`, () => transition(d, "stopped", "stopped", "stop"), "Stop")}><Square className="h-3.5 w-3.5" /></Button>
                      : <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Start" onClick={() => transition(d, "starting", "running", "start")}><Play className="h-3.5 w-3.5" /></Button>}
                    <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Restart" onClick={() => transition(d, "restarting", "running", "restart")}><RotateCw className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Configure" onClick={() => setCfgOpen(d)}><Settings2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </Panel>
        <Panel className="xl:col-span-2" title={sel ? <span className="font-mono">{sel.name}</span> : "Details"} actions={sel && <Button size="icon" variant="ghost" className="h-7 w-7 text-red-300" aria-label="Delete deployment" onClick={() => ask("Delete deployment?", `${sel.name} will be removed (simulated).`, () => { remove("deployments", sel.id); audit_("deployment.delete", `deployment/${sel.name}`); setSelId(null); toast.success("Deployment deleted"); })}><Trash2 className="h-3.5 w-3.5" /></Button>}>
          {!sel ? <p className="text-sm text-muted-foreground">Select a deployment.</p> : (
            <Tabs defaultValue="overview">
              <TabsList className="mb-3"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="config">vLLM config</TabsTrigger><TabsTrigger value="logs">Logs</TabsTrigger></TabsList>
              <TabsContent value="overview">
                <KV k="Status" v={<StatusBadge status={sel.status} />} /><KV k="Model" v={modelName(models, sel.modelId)} />
                <KV k="Endpoint" v={sel.endpoint} mono /><KV k="Replicas" v={sel.replicas} />
                <KV k="GPU assignment" v={sel.gpus.length ? sel.gpus.join(", ") : "CPU-only"} mono />
                <KV k="Resources" v={`${sel.cpu} vCPU · ${sel.memoryGb} GiB`} /><KV k="Max model length" v={sel.maxModelLen.toLocaleString()} />
                <KV k="Max concurrent seqs" v={sel.maxNumSeqs} /><KV k="Tensor parallel" v={sel.tensorParallel} />
              </TabsContent>
              <TabsContent value="config">
                <p className="mb-2 text-xs text-muted-foreground">Preview of the command a future deployment controller would run.</p>
                <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-[11.5px] leading-relaxed text-cyan-100">{vllmCommand(sel, artifact(sel))}</pre>
              </TabsContent>
              <TabsContent value="logs">
                <pre className="max-h-80 overflow-auto rounded-md border bg-[hsl(224_32%_6%)] p-3 text-[11px] leading-relaxed text-slate-300">{mockDeployLogs(sel, artifact(sel))}</pre>
              </TabsContent>
            </Tabs>
          )}
        </Panel>
      </div>
      <DeploymentDialog value={cfgOpen} onClose={() => setCfgOpen(null)} onSave={(d, isNew) => {
        if (isNew) { add("deployments", d); setSelId(d.id); audit_("deployment.create", `deployment/${d.name}`); toast.success("Deployment created (simulated)"); }
        else { update("deployments", d.id, d); audit_("deployment.configure", `deployment/${d.name}`); toast.success("Configuration saved (simulated)"); }
      }} />
    </div>
  );
}

function mockDeployLogs(d: Deployment, artifact: string) {
  const t = (s: number) => new Date(Date.now() - s * 1000).toISOString().slice(11, 19);
  const lines = [
    `${t(600)} INFO  [simulated] Starting vLLM OpenAI-compatible server for ${d.name}`,
    `${t(598)} INFO  Loading weights from ${artifact}`,
    `${t(560)} INFO  Model weights loaded; memory profiling complete`,
    `${t(555)} INFO  KV cache configured: max_model_len=${d.maxModelLen}, max_num_seqs=${d.maxNumSeqs}`,
    `${t(550)} INFO  Started server process on 0.0.0.0:8000`,
  ];
  if (d.status === "error") lines.push(`${t(45)} ERROR torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 2.00 GiB`, `${t(44)} ERROR Readiness probe failed; container restarting (CrashLoopBackOff)`);
  else if (d.status === "stopped") lines.push(`${t(30)} INFO  Received SIGTERM, shutting down gracefully`);
  else lines.push(`${t(20)} INFO  Avg prompt throughput: 1520.4 tok/s, Avg generation throughput: 488.1 tok/s`, `${t(5)} INFO  GET /health 200`);
  return lines.join("\n");
}

function DeploymentDialog({ value, onClose, onSave }: { value: Deployment | "new" | null; onClose: () => void; onSave: (d: Deployment, isNew: boolean) => void }) {
  const { models, environment } = useApp();
  const isNew = value === "new";
  const base: Deployment = value && value !== "new" ? value : { id: uid("dep"), name: "", modelId: "qwen3-8b", runtime: "vLLM", endpoint: "", replicas: 1, gpus: ["gpu-node-01/GPU3"], cpu: 8, memoryGb: 32, maxModelLen: 32768, maxNumSeqs: 64, gpuMemoryUtilization: 0.9, tensorParallel: 1, status: "stopped", environment, updatedAt: new Date().toISOString() };
  const [d, setD] = useState<Deployment>(base);
  const [key, setKey] = useState<unknown>(null);
  if (key !== value) { setKey(value); setD(base); }
  const deployable = models.filter((m) => m.status !== "deprecated" && m.status !== "incompatible");
  const save = () => {
    if (!d.name.trim() || !/^[a-z0-9-]+$/.test(d.name)) { toast.error("Name must be lowercase letters, digits, and dashes"); return; }
    const endpoint = d.endpoint || `http://vllm-${d.name}.ai-${environment === "production" ? "platform" : environment}.svc:8000/v1`;
    onSave({ ...d, endpoint, gpus: d.runtime === "vLLM (CPU)" ? [] : d.gpus, updatedAt: new Date().toISOString() }, isNew);
    onClose();
  };
  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{isNew ? "New deployment" : `Configure ${d.name}`}</DialogTitle><DialogDescription>Prototype — saves configuration locally; no workload is scheduled.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={d.name} disabled={!isNew} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="qwen3-8b-chat" className="font-mono" /></div>
          <div className="space-y-1"><Label className="text-xs">Model</Label><Select value={d.modelId} onValueChange={(v) => setD({ ...d, modelId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{deployable.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Runtime</Label><Select value={d.runtime} onValueChange={(v) => setD({ ...d, runtime: v as Deployment["runtime"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vLLM">vLLM (GPU)</SelectItem><SelectItem value="vLLM (CPU)">vLLM (CPU)</SelectItem><SelectItem value="llama.cpp">llama.cpp</SelectItem></SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Replicas</Label><Input type="number" min={0} max={16} value={d.replicas} onChange={(e) => setD({ ...d, replicas: Number(e.target.value) })} /></div>
          <div className="space-y-1"><Label className="text-xs">vCPU</Label><Input type="number" value={d.cpu} onChange={(e) => setD({ ...d, cpu: Number(e.target.value) })} /></div>
          <div className="space-y-1"><Label className="text-xs">Memory (GiB)</Label><Input type="number" value={d.memoryGb} onChange={(e) => setD({ ...d, memoryGb: Number(e.target.value) })} /></div>
          <div className="space-y-1"><Label className="text-xs">Max model length</Label><Input type="number" value={d.maxModelLen} onChange={(e) => setD({ ...d, maxModelLen: Number(e.target.value) })} /></div>
          <div className="space-y-1"><Label className="text-xs">Max concurrent sequences</Label><Input type="number" value={d.maxNumSeqs} onChange={(e) => setD({ ...d, maxNumSeqs: Number(e.target.value) })} /></div>
          <div className="space-y-1"><Label className="text-xs">Tensor parallel size</Label><Select value={String(d.tensorParallel)} onValueChange={(v) => setD({ ...d, tensorParallel: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 4, 8].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">GPU assignment</Label><Input value={d.gpus.join(", ")} disabled={d.runtime === "vLLM (CPU)"} onChange={(e) => setD({ ...d, gpus: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="font-mono text-xs" /></div>
          <div className="col-span-2 space-y-2"><div className="flex justify-between text-xs"><Label className="text-xs">GPU memory utilization</Label><span>{d.gpuMemoryUtilization.toFixed(2)}</span></div><Slider disabled={d.runtime === "vLLM (CPU)"} value={[d.gpuMemoryUtilization]} min={0.3} max={0.98} step={0.01} onValueChange={([v]) => setD({ ...d, gpuMemoryUtilization: v })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>{isNew ? "Create" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
