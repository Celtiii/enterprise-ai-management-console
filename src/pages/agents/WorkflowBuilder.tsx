import { useRef, useState } from "react";
import { Play, Trash2, Link2, MessageSquare, Brain, Bot, Database, Wrench, GitBranch, UserCheck, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid } from "@/services/store";
import type { NodeKind, Workflow, WorkflowNode, ExecutionRun } from "@/types";
import { PageHeader, Panel, Tag, SimBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const KINDS: Record<NodeKind, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; defaults: Record<string, string> }> = {
  input: { label: "User Input", icon: MessageSquare, color: "text-sky-300 border-sky-500/40", defaults: { schema: "{ question: string }" } },
  llm: { label: "LLM", icon: Brain, color: "text-blue-300 border-blue-500/40", defaults: { model: "qwen3-8b", temperature: "0.3", prompt: "Answer using the context." } },
  agent: { label: "Agent", icon: Bot, color: "text-violet-300 border-violet-500/40", defaults: { agent: "Research Agent", maxHops: "3" } },
  retriever: { label: "Retriever", icon: Database, color: "text-cyan-300 border-cyan-500/40", defaults: { knowledgeBase: "Corporate Policies", topK: "5", threshold: "0.7" } },
  tool: { label: "MCP Tool", icon: Wrench, color: "text-amber-300 border-amber-500/40", defaults: { tool: "jira.search", timeoutMs: "10000" } },
  router: { label: "Conditional Router", icon: GitBranch, color: "text-pink-300 border-pink-500/40", defaults: { condition: "confidence > 0.8" } },
  approval: { label: "Human Approval", icon: UserCheck, color: "text-orange-300 border-orange-500/40", defaults: { approvers: "security-leads", timeout: "4h" } },
  output: { label: "Output", icon: LogOut, color: "text-emerald-300 border-emerald-500/40", defaults: { format: "markdown" } },
};
const W = 168, H = 56;
type RunState = Record<string, "pending" | "running" | "done" | "failed">;

export default function WorkflowBuilder() {
  const { workflows, update, add, audit_ } = useApp();
  const [wfId, setWfId] = useState(workflows[0]?.id ?? "");
  const wf = workflows.find((w) => w.id === wfId) ?? workflows[0];
  const [sel, setSel] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [run, setRun] = useState<RunState>({});
  const [trace, setTrace] = useState<string[]>([]);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const canvas = useRef<HTMLDivElement>(null);

  if (!wf) return <div><PageHeader title="Workflow builder" /><Button onClick={() => { const w: Workflow = { id: uid("wf"), name: "Untitled workflow", nodes: [], edges: [] }; add("workflows", w); setWfId(w.id); }}>Create workflow</Button></div>;

  const save = (patch: Partial<Workflow>) => update("workflows", wf.id, patch);
  const node = wf.nodes.find((n) => n.id === sel);
  const addNode = (kind: NodeKind) => {
    const n: WorkflowNode = { id: uid("n"), kind, label: KINDS[kind].label, x: 60 + (wf.nodes.length % 5) * 60, y: 320 + (wf.nodes.length % 3) * 30, config: { ...KINDS[kind].defaults } };
    save({ nodes: [...wf.nodes, n] }); setSel(n.id);
  };
  const removeNode = (id: string) => { save({ nodes: wf.nodes.filter((n) => n.id !== id), edges: wf.edges.filter((e) => e.from !== id && e.to !== id) }); setSel(null); };
  const clickNode = (id: string) => {
    if (connectFrom && connectFrom !== id) {
      if (!wf.edges.some((e) => e.from === connectFrom && e.to === id)) save({ edges: [...wf.edges, { id: uid("e"), from: connectFrom, to: id }] });
      setConnectFrom(null); toast.success("Nodes connected");
    } else setSel(id);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !canvas.current) return;
    const r = canvas.current.getBoundingClientRect();
    const { id, dx, dy } = drag.current;
    save({ nodes: wf.nodes.map((n) => (n.id === id ? { ...n, x: Math.max(0, e.clientX - r.left - dx + canvas.current!.scrollLeft), y: Math.max(0, e.clientY - r.top - dy + canvas.current!.scrollTop) } : n)) });
  };

  const execute = () => {
    const starts = wf.nodes.filter((n) => !wf.edges.some((e) => e.to === n.id));
    if (!starts.length) { toast.error("Workflow needs a start node with no incoming edges"); return; }
    const order: WorkflowNode[] = []; const seen = new Set<string>(); const queue = [...starts];
    while (queue.length) { const n = queue.shift()!; if (seen.has(n.id)) continue; seen.add(n.id); order.push(n); wf.edges.filter((e) => e.from === n.id).forEach((e) => { const t = wf.nodes.find((x) => x.id === e.to); if (t) queue.push(t); }); }
    const st: RunState = {}; wf.nodes.forEach((n) => (st[n.id] = "pending")); setRun(st); setTrace([`[sim] run started · ${order.length} reachable nodes`]);
    const steps: ExecutionRun["steps"] = []; const t0 = Date.now();
    order.forEach((n, i) => {
      setTimeout(() => setRun((r) => ({ ...r, [n.id]: "running" })), i * 700);
      setTimeout(() => {
        const ms = Math.round(50 + Math.random() * 900);
        const detail = n.kind === "retriever" ? `${n.config.topK ?? 5} chunks ≥ ${n.config.threshold ?? 0.7}` : n.kind === "approval" ? "auto-approved (simulation)" : n.kind === "llm" || n.kind === "agent" ? `${Math.round(100 + Math.random() * 400)} tokens (mock)` : "ok";
        steps.push({ node: n.label, status: "succeeded", ms, detail });
        setRun((r) => ({ ...r, [n.id]: "done" })); setTrace((t) => [...t, `[sim] ✓ ${n.label} — ${detail} · ${ms}ms`]);
        if (i === order.length - 1) {
          add("runs", { id: `run-${Math.floor(9000 + Math.random() * 999)}`, workflowName: wf.name, status: "succeeded", startedAt: new Date(t0).toISOString(), durationMs: Date.now() - t0, trigger: "Console · ali.moradi", steps });
          audit_("workflow.execute", `workflow/${wf.name}`); toast.success("Simulated run complete", { description: "Recorded in Execution History." });
        }
      }, i * 700 + 600);
    });
  };

  const center = (n: WorkflowNode) => ({ x: n.x + W / 2, y: n.y + H / 2 });

  return (
    <div>
      <PageHeader title="Workflow builder" description="Compose multi-agent workflows. Drag to move, use Connect to link nodes. Execution is simulated." actions={<>
        <Select value={wf.id} onValueChange={setWfId}><SelectTrigger className="h-8 w-56 text-sm"><SelectValue /></SelectTrigger><SelectContent>{workflows.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" variant="outline" onClick={() => { const w: Workflow = { id: uid("wf"), name: "Untitled workflow", nodes: [], edges: [] }; add("workflows", w); setWfId(w.id); setSel(null); }}><Plus className="mr-1 h-4 w-4" />New</Button>
        <Button size="sm" onClick={execute}><Play className="mr-1.5 h-4 w-4" />Run simulation</Button>
      </>} />
      <div className="grid gap-4 xl:grid-cols-[180px_1fr_300px]">
        <Panel title="Nodes" bodyClass="p-2 space-y-1">
          {(Object.keys(KINDS) as NodeKind[]).map((k) => { const K = KINDS[k]; return (
            <button key={k} onClick={() => addNode(k)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"><K.icon className={cn("h-4 w-4", K.color.split(" ")[0])} />{K.label}</button>
          ); })}
        </Panel>

        <div className="space-y-3">
          <div className="flex items-center gap-2"><Input value={wf.name} onChange={(e) => save({ name: e.target.value })} className="h-8 max-w-xs" />{connectFrom && <Tag tone="amber">Click a target node to connect…</Tag>}</div>
          <div ref={canvas} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onClick={(e) => e.target === e.currentTarget && (setSel(null), setConnectFrom(null))}
            className="relative h-[480px] overflow-auto rounded-lg border bg-[radial-gradient(circle,hsl(222_20%_20%)_1px,transparent_1px)] [background-size:20px_20px]">
            <svg className="pointer-events-none absolute left-0 top-0" width={1400} height={700}>
              <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="hsl(216 14% 55%)" /></marker></defs>
              {wf.edges.map((e) => { const a = wf.nodes.find((n) => n.id === e.from), b = wf.nodes.find((n) => n.id === e.to); if (!a || !b) return null;
                const p = center(a), q = center(b); const sx = p.x + W / 2, tx = q.x - W / 2; const active = run[a.id] === "done" && run[b.id] && run[b.id] !== "pending";
                return <path key={e.id} d={`M${sx},${p.y} C${sx + 60},${p.y} ${tx - 60},${q.y} ${tx},${q.y}`} fill="none" stroke={active ? "hsl(152 55% 52%)" : "hsl(216 14% 40%)"} strokeWidth={1.5} markerEnd="url(#arr)" />; })}
            </svg>
            {wf.nodes.map((n) => { const K = KINDS[n.kind]; const s = run[n.id]; return (
              <div key={n.id} style={{ left: n.x, top: n.y, width: W, height: H }}
                onPointerDown={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); drag.current = { id: n.id, dx: e.clientX - r.left, dy: e.clientY - r.top }; }}
                onClick={(e) => { e.stopPropagation(); clickNode(n.id); }}
                className={cn("absolute flex cursor-grab select-none items-center gap-2 rounded-lg border bg-card px-3 shadow-md transition-shadow active:cursor-grabbing", K.color.split(" ")[1],
                  sel === n.id && "ring-2 ring-primary", s === "running" && "ring-2 ring-amber-400 pulse-dot", s === "done" && "ring-1 ring-emerald-400", connectFrom === n.id && "ring-2 ring-amber-400")}>
                <K.icon className={cn("h-4 w-4 shrink-0", K.color.split(" ")[0])} />
                <div className="min-w-0"><div className="truncate text-[13px] font-medium">{n.label}</div><div className="truncate text-[10px] text-muted-foreground">{K.label}</div></div>
              </div>
            ); })}
            {wf.nodes.length === 0 && <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Add nodes from the palette to start.</p>}
          </div>
          <Panel title={<span className="flex items-center gap-2">Execution trace <SimBadge label="Simulated" /></span>} bodyClass="p-0">
            <pre className="max-h-40 overflow-auto p-3 text-[11px] text-slate-300">{trace.length ? trace.join("\n") : "Run the workflow to see a trace."}</pre>
          </Panel>
        </div>

        <Panel title="Configuration" className="self-start">
          {!node ? <p className="text-sm text-muted-foreground">Select a node to configure it.</p> : (
            <div className="space-y-3">
              <Tag tone="violet">{KINDS[node.kind].label}</Tag>
              <div className="space-y-1"><Label className="text-xs">Label</Label><Input value={node.label} onChange={(e) => save({ nodes: wf.nodes.map((n) => (n.id === node.id ? { ...n, label: e.target.value } : n)) })} /></div>
              {Object.entries(node.config).map(([k, v]) => (
                <div key={k} className="space-y-1"><Label className="text-xs capitalize">{k}</Label><Input value={v} className="font-mono text-xs" onChange={(e) => save({ nodes: wf.nodes.map((n) => (n.id === node.id ? { ...n, config: { ...n.config, [k]: e.target.value } } : n)) })} /></div>
              ))}
              <div className="text-xs text-muted-foreground">Outgoing: {wf.edges.filter((e) => e.from === node.id).map((e) => wf.nodes.find((n) => n.id === e.to)?.label).join(", ") || "none"}</div>
              {wf.edges.filter((e) => e.from === node.id).map((e) => (
                <button key={e.id} className="block text-xs text-red-300 hover:underline" onClick={() => save({ edges: wf.edges.filter((x) => x.id !== e.id) })}>Remove link → {wf.nodes.find((n) => n.id === e.to)?.label}</button>
              ))}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setConnectFrom(node.id)}><Link2 className="mr-1 h-3.5 w-3.5" />Connect</Button>
                <Button size="sm" variant="outline" className="text-red-300" onClick={() => removeNode(node.id)} aria-label="Delete node"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
