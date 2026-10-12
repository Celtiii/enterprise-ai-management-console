import { useState } from "react";
import { Plus, PlugZap, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid } from "@/services/store";
import type { ToolIntegration } from "@/types";
import { PageHeader, Panel, StatusBadge, Tag, KV, SearchInput, useConfirm, th, td } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

const types: ToolIntegration["type"][] = ["MCP Server", "REST API", "Document Search", "Database", "Code Execution"];

export default function ToolsMcp() {
  const { tools, add, update, remove, audit_ } = useApp();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const rows = tools.filter((t) => (type === "all" || t.type === type) && (t.name + t.description).toLowerCase().includes(q.toLowerCase()));
  const [selId, setSelId] = useState(rows[0]?.id);
  const sel = tools.find((t) => t.id === selId);
  const [edit, setEdit] = useState<ToolIntegration | "new" | null>(null);
  const [testing, setTesting] = useState(false);
  const [history, setHistory] = useState<{ time: string; tool: string; ok: boolean; ms: number }[]>([]);
  const { ask, node } = useConfirm();

  const test = () => {
    if (!sel) return; setTesting(true);
    setTimeout(() => {
      const ok = sel.status !== "error" && sel.status !== "disabled";
      const ms = Math.round(40 + Math.random() * 400);
      setHistory((h) => [{ time: new Date().toISOString(), tool: sel.tools[0] ?? "ping", ok, ms }, ...h].slice(0, 10));
      if (ok) { update("tools", sel.id, { lastExecution: new Date().toISOString() }); toast.success("Simulated connection test passed", { description: `${sel.tools.length} tools discovered · ${ms} ms (mock)` }); }
      else toast.error("Simulated connection test failed", { description: sel.error ?? "Integration is disabled." });
      setTesting(false);
    }, 1100);
  };

  return (
    <div>
      {node}
      <PageHeader title="Tools & MCP" description="Registry of tool integrations and MCP servers available to agents. All connections are mock configurations — nothing is actually connected." actions={<Button size="sm" onClick={() => setEdit("new")}><Plus className="mr-1.5 h-4 w-4" />Add integration</Button>} />
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" bodyClass="p-0">
          <div className="flex flex-wrap gap-2 border-b p-3"><SearchInput value={q} onChange={setQ} className="w-64" />
            <Select value={type} onValueChange={setType}><SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <table className="w-full"><thead><tr className="border-b"><th className={th}>Integration</th><th className={th}>Type</th><th className={th}>Tools</th><th className={th}>Last run</th><th className={th}>Status</th></tr></thead>
            <tbody>{rows.map((t) => (
              <tr key={t.id} onClick={() => setSelId(t.id)} className={cn("border-b border-border/50 cursor-pointer", t.id === selId ? "bg-accent/50" : "hover:bg-accent/30")}>
                <td className={td}><div className="font-medium">{t.name}</div><div className="text-[11px] text-muted-foreground line-clamp-1">{t.description}</div></td>
                <td className={td}><Tag tone={t.type === "MCP Server" ? "violet" : "blue"}>{t.type}</Tag></td>
                <td className={`${td} tabular-nums`}>{t.tools.length}</td><td className={`${td} text-xs text-muted-foreground`}>{timeAgo(t.lastExecution)}</td>
                <td className={td}><StatusBadge status={t.status} /></td></tr>))}</tbody>
          </table>
        </Panel>
        <Panel className="xl:col-span-2" title={sel?.name ?? "Details"} actions={sel && <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEdit(sel)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-300" aria-label="Delete" onClick={() => ask("Remove integration?", `${sel.name} will be unavailable to agents.`, () => { remove("tools", sel.id); audit_("tool.delete", `tool/${sel.name}`); setSelId(""); })}><Trash2 className="h-3.5 w-3.5" /></Button></div>}>
          {sel ? (<div className="space-y-4">
            <Tag tone="violet">Mock configuration</Tag>
            {sel.error && <div className="flex gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-200"><AlertTriangle className="h-4 w-4 shrink-0" />{sel.error}</div>}
            <div><KV k="Transport" v={sel.transport} /><KV k="Endpoint" v={sel.endpoint} mono /><KV k="Last execution" v={timeAgo(sel.lastExecution)} /></div>
            <div><p className="mb-1.5 text-xs text-muted-foreground">Permissions</p><div className="flex flex-wrap gap-1">{sel.permissions.map((p) => <Tag key={p} tone="amber">{p}</Tag>)}</div></div>
            <div><p className="mb-1.5 text-xs text-muted-foreground">Exposed tools</p><div className="flex flex-wrap gap-1">{sel.tools.map((p) => <Tag key={p} tone="cyan">{p}</Tag>)}</div></div>
            <Button size="sm" variant="outline" disabled={testing} onClick={test}><PlugZap className="mr-1.5 h-4 w-4" />{testing ? "Testing…" : "Test connection (simulated)"}</Button>
            <div><p className="mb-1.5 text-xs text-muted-foreground">Execution history (this session)</p>
              {history.length === 0 ? <p className="text-xs text-muted-foreground">No test runs yet.</p> : history.map((h, i) => <div key={i} className="flex justify-between border-b border-border/50 py-1 text-xs"><span className="font-mono">{h.tool}</span><span className={h.ok ? "text-emerald-400" : "text-red-400"}>{h.ok ? "ok" : "failed"} · {h.ms}ms</span></div>)}</div>
          </div>) : <p className="text-sm text-muted-foreground">Select an integration.</p>}
        </Panel>
      </div>
      <ToolDialog value={edit} onClose={() => setEdit(null)} onSave={(t, isNew) => { if (isNew) { add("tools", t); setSelId(t.id); } else update("tools", t.id, t); audit_(isNew ? "tool.create" : "tool.update", `tool/${t.name}`); toast.success(isNew ? "Integration added (mock)" : "Integration updated"); }} />
    </div>
  );
}

function ToolDialog({ value, onClose, onSave }: { value: ToolIntegration | "new" | null; onClose: () => void; onSave: (t: ToolIntegration, isNew: boolean) => void }) {
  const isNew = value === "new";
  const base: ToolIntegration = value && value !== "new" ? value : { id: uid("tool"), name: "", type: "MCP Server", description: "", status: "connected", transport: "Streamable HTTP", endpoint: "http://", permissions: ["read"], tools: [], lastExecution: new Date().toISOString() };
  const [t, setT] = useState(base); const [k, setK] = useState<unknown>(null);
  if (k !== value) { setK(value); setT(base); }
  const save = () => { if (!t.name.trim() || !t.endpoint.trim()) { toast.error("Name and endpoint are required"); return; } onSave(t, isNew); onClose(); };
  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isNew ? "Add integration" : `Edit ${t.name}`}</DialogTitle><DialogDescription>Stored as a mock configuration; no connection is opened.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1"><Label className="text-xs">Name</Label><Input value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Type</Label><Select value={t.type} onValueChange={(v) => setT({ ...t, type: v as ToolIntegration["type"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{types.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Transport</Label><Select value={t.transport} onValueChange={(v) => setT({ ...t, transport: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Streamable HTTP", "SSE", "stdio", "HTTPS (OpenAPI)", "gRPC", "Native"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2 space-y-1"><Label className="text-xs">Endpoint / command</Label><Input value={t.endpoint} onChange={(e) => setT({ ...t, endpoint: e.target.value })} className="font-mono text-xs" /></div>
          <div className="col-span-2 space-y-1"><Label className="text-xs">Description</Label><Textarea value={t.description} onChange={(e) => setT({ ...t, description: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Tools (comma separated)</Label><Input value={t.tools.join(", ")} onChange={(e) => setT({ ...t, tools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="font-mono text-xs" /></div>
          <div className="space-y-1"><Label className="text-xs">Permissions</Label><Input value={t.permissions.join(", ")} onChange={(e) => setT({ ...t, permissions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
          <div className="space-y-1"><Label className="text-xs">Status</Label><Select value={t.status} onValueChange={(v) => setT({ ...t, status: v as ToolIntegration["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["connected", "degraded", "error", "disabled"].map((x) => <SelectItem key={x} value={x} className="capitalize">{x}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
