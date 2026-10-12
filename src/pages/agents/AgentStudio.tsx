import { useState } from "react";
import { Bot, Plus, Send, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid, modelName } from "@/services/store";
import type { Agent } from "@/types";
import { PageHeader, Panel, StatusBadge, Tag, SearchInput, useConfirm, SimBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/Markdown";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

const bump = (v: string) => { const [a, b, c] = v.replace("v", "").split(".").map(Number); return `v${a}.${b}.${(c || 0) + 1}`; };

export default function AgentStudio() {
  const { agents, models, tools, knowledgeBases, add, update, remove, audit_ } = useApp();
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState(agents[0]?.id ?? "");
  const sel = agents.find((a) => a.id === selId);
  const [draft, setDraft] = useState<Agent | null>(sel ?? null);
  const [lastSel, setLastSel] = useState(selId);
  if (lastSel !== selId) { setLastSel(selId); setDraft(sel ?? null); }
  const { ask, node } = useConfirm();
  const allTools = tools.flatMap((t) => t.tools).concat(["agent.delegate", "workflow.state", "audit.query"]).filter((v, i, a) => a.indexOf(v) === i);
  const dirty = JSON.stringify(draft) !== JSON.stringify(sel);

  const create = () => {
    const a: Agent = { id: uid("ag"), name: "New Agent", description: "Describe what this agent does.", role: "Assistant", instructions: "", modelId: "qwen3-8b", tools: [], knowledgeBases: [], memory: "session", guardrails: ["PII redaction"], status: "draft", version: "v0.1.0", updatedAt: new Date().toISOString(), owner: "Ali Moradi" };
    add("agents", a); setSelId(a.id); audit_("agent.create", `agent/${a.name}`); toast.success("Draft agent created");
  };
  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) { toast.error("Agent name is required"); return; }
    const next = { ...draft, version: bump(draft.version), updatedAt: new Date().toISOString() };
    update("agents", draft.id, next); setDraft(next); audit_("agent.update", `agent/${draft.name}`); toast.success(`Saved ${next.version}`);
  };
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div>
      {node}
      <PageHeader title="Agent studio" description="Define specialised agents: model, tools, knowledge access, memory and guardrails. Test responses are mocked." actions={<Button size="sm" onClick={create}><Plus className="mr-1.5 h-4 w-4" />New agent</Button>} />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Panel bodyClass="p-2" className="self-start">
          <SearchInput value={q} onChange={setQ} placeholder="Filter agents…" className="mb-2" />
          <div className="space-y-0.5">
            {agents.filter((a) => a.name.toLowerCase().includes(q.toLowerCase())).map((a) => (
              <button key={a.id} onClick={() => setSelId(a.id)} className={cn("w-full rounded-md p-2.5 text-left", a.id === selId ? "bg-accent" : "hover:bg-accent/50")}>
                <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-violet-300" /><span className="text-sm font-medium flex-1 truncate">{a.name}</span><StatusBadge status={a.status} /></div>
                <div className="mt-1 pl-6 text-[11px] text-muted-foreground">{modelName(models, a.modelId)} · {a.version} · {timeAgo(a.updatedAt)}</div>
              </button>
            ))}
          </div>
        </Panel>

        {draft ? (
          <Panel title={<span className="flex items-center gap-2">{draft.name} <Tag>{draft.version}</Tag></span>} actions={<div className="flex gap-1.5">
            <Button size="sm" variant="ghost" className="text-red-300" onClick={() => ask("Delete agent?", `${draft.name} will be removed. Workflows referencing it will need updating.`, () => { remove("agents", draft.id); audit_("agent.delete", `agent/${draft.name}`); setSelId(agents.find((a) => a.id !== draft.id)?.id ?? ""); })}><Trash2 className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="outline" disabled={!dirty} onClick={() => setDraft(sel ?? null)}>Discard</Button>
            <Button size="sm" disabled={!dirty} onClick={save}><Save className="mr-1.5 h-3.5 w-3.5" />Save version</Button>
          </div>}>
            <Tabs defaultValue="config">
              <TabsList className="mb-4"><TabsTrigger value="config">Configuration</TabsTrigger><TabsTrigger value="access">Tools & knowledge</TabsTrigger><TabsTrigger value="guard">Memory & guardrails</TabsTrigger><TabsTrigger value="test">Test playground</TabsTrigger></TabsList>
              <TabsContent value="config" className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Role</Label><Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></div>
                <div className="md:col-span-2 space-y-1"><Label className="text-xs">Description</Label><Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
                <div className="md:col-span-2 space-y-1"><Label className="text-xs">Instructions</Label><Textarea value={draft.instructions} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} className="min-h-[140px] font-mono text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">Model</Label><Select value={draft.modelId} onValueChange={(v) => setDraft({ ...draft, modelId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{models.filter((m) => !m.tags.includes("embedding")).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label className="text-xs">Status</Label><Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Agent["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="disabled">Disabled</SelectItem></SelectContent></Select></div>
                <p className="md:col-span-2 text-xs text-muted-foreground">Owner {draft.owner} · last updated {timeAgo(draft.updatedAt)}</p>
              </TabsContent>
              <TabsContent value="access" className="grid gap-6 md:grid-cols-2">
                <div><p className="mb-2 text-sm font-medium">Available tools</p><div className="space-y-2">{allTools.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm"><Checkbox checked={draft.tools.includes(t)} onCheckedChange={() => setDraft({ ...draft, tools: toggle(draft.tools, t) })} /><span className="font-mono text-xs">{t}</span></label>
                ))}</div></div>
                <div><p className="mb-2 text-sm font-medium">Knowledge base access</p><div className="space-y-2">{knowledgeBases.map((kb) => (
                  <label key={kb.id} className="flex items-center gap-2 text-sm"><Checkbox checked={draft.knowledgeBases.includes(kb.id)} onCheckedChange={() => setDraft({ ...draft, knowledgeBases: toggle(draft.knowledgeBases, kb.id) })} />{kb.name}<Tag tone={kb.classification === "Restricted" ? "red" : kb.classification === "Confidential" ? "amber" : "gray"}>{kb.classification}</Tag></label>
                ))}</div></div>
              </TabsContent>
              <TabsContent value="guard" className="space-y-5">
                <div className="space-y-1 max-w-xs"><Label className="text-xs">Memory</Label><Select value={draft.memory} onValueChange={(v) => setDraft({ ...draft, memory: v as Agent["memory"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None (stateless)</SelectItem><SelectItem value="session">Session memory</SelectItem><SelectItem value="long-term">Long-term (vector memory)</SelectItem></SelectContent></Select></div>
                <div><p className="mb-2 text-sm font-medium">Guardrails</p><div className="grid gap-2 sm:grid-cols-2">{["PII redaction", "Citations required", "Human approval for actions", "Sandbox-only execution", "No secret output", "Respect document ACLs", "Classification ≤ Confidential", "Max 8 delegation hops", "Restricted data access logged"].map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm"><Checkbox checked={draft.guardrails.includes(g)} onCheckedChange={() => setDraft({ ...draft, guardrails: toggle(draft.guardrails, g) })} />{g}</label>
                ))}</div>
                <p className="mt-3 text-xs text-muted-foreground">Guardrails are configuration only in this prototype; they are not enforced by the frontend.</p></div>
              </TabsContent>
              <TabsContent value="test"><AgentTester agent={draft} /></TabsContent>
            </Tabs>
          </Panel>
        ) : <Panel><p className="text-sm text-muted-foreground">Select or create an agent.</p></Panel>}
      </div>
    </div>
  );
}

function AgentTester({ agent }: { agent: Agent }) {
  const { knowledgeBases } = useApp();
  const [msgs, setMsgs] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const send = () => {
    if (!input.trim()) return;
    const q = input; setInput(""); setMsgs((m) => [...m, { role: "user", text: q }]); setBusy(true);
    setTimeout(() => {
      const kbs = agent.knowledgeBases.map((id) => knowledgeBases.find((k) => k.id === id)?.name).filter(Boolean);
      const trace = [`plan: interpret request as "${q.slice(0, 60)}"`, ...agent.tools.slice(0, 2).map((t) => `call ${t}(…) → ok (mock)`), kbs.length ? `retrieve from ${kbs.join(", ")} → 3 passages (mock)` : null].filter(Boolean);
      setMsgs((m) => [...m, { role: "agent", text: `> _Mock response — ${agent.name} on ${agent.modelId}. No model or tool was called._\n\n**Trace**\n${trace.map((t) => `- \`${t}\``).join("\n")}\n\n**Answer**\nAs the ${agent.role.toLowerCase()}, I would address this using my configured instructions. Guardrails applied: ${agent.guardrails.join(", ") || "none"}.` }]);
      setBusy(false);
    }, 900);
  };
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b px-3 py-2 text-sm"><span>Test {agent.name}</span><div className="flex gap-2"><SimBadge label="Mock" /><Button size="sm" variant="ghost" onClick={() => setMsgs([])}>Reset</Button></div></div>
      <div className="h-72 overflow-y-auto p-3 space-y-3">
        {msgs.length === 0 && <p className="pt-20 text-center text-xs text-muted-foreground">Send a test prompt to see a simulated agent trace.</p>}
        {msgs.map((m, i) => <div key={i} className={cn("rounded-md p-2.5 text-sm", m.role === "user" ? "bg-sky-500/10 ml-12" : "bg-muted/40 mr-12")}>{m.role === "user" ? m.text : <Markdown text={m.text} />}</div>)}
        {busy && <p className="text-xs text-muted-foreground pulse-dot">Agent is thinking…</p>}
      </div>
      <div className="flex gap-2 border-t p-2"><Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask the agent…" /><Button size="icon" onClick={send} disabled={busy} aria-label="Send test"><Send className="h-4 w-4" /></Button></div>
    </div>
  );
}
