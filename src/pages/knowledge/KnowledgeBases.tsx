import { useState } from "react";
import { Plus, Database, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid } from "@/services/store";
import type { Classification, KnowledgeBase } from "@/types";
import { PageHeader, Panel, Tag, KV, useConfirm, SimBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export const classTone = (c: Classification) => (c === "Restricted" ? "red" : c === "Confidential" ? "amber" : c === "Internal" ? "blue" : "gray") as "red" | "amber" | "blue" | "gray";

export default function KnowledgeBases() {
  const { knowledgeBases, documents, add, update, remove, audit_ } = useApp();
  const [selId, setSelId] = useState(knowledgeBases[0]?.id);
  const sel = knowledgeBases.find((k) => k.id === selId);
  const [draft, setDraft] = useState<KnowledgeBase | undefined>(sel);
  const [last, setLast] = useState(selId);
  if (last !== selId) { setLast(selId); setDraft(sel); }
  const { ask, node } = useConfirm();
  const docs = (id: string) => documents.filter((d) => d.kbId === id);
  const create = () => { const kb: KnowledgeBase = { id: uid("kb"), name: "New knowledge base", description: "", embeddingModel: "bge-m3", vectorStore: "Qdrant · collection new_kb", chunkSize: 512, chunkOverlap: 64, topK: 5, threshold: 0.7, classification: "Internal", updatedAt: new Date().toISOString() }; add("knowledgeBases", kb); setSelId(kb.id); audit_("kb.create", `kb/${kb.name}`); };

  return (
    <div>
      {node}
      <PageHeader title="Knowledge bases" description="Collections of enterprise documents indexed for retrieval. Indexing and vector search are simulated." actions={<Button size="sm" onClick={create}><Plus className="mr-1.5 h-4 w-4" />New knowledge base</Button>} />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {knowledgeBases.map((kb) => { const d = docs(kb.id); return (
            <button key={kb.id} onClick={() => setSelId(kb.id)} className={cn("w-full rounded-lg border p-3 text-left transition-colors", kb.id === selId ? "border-primary/50 bg-accent/50" : "bg-card hover:bg-accent/30")}>
              <div className="flex items-center gap-2"><Database className="h-4 w-4 text-cyan-300" /><span className="flex-1 text-sm font-medium">{kb.name}</span><Tag tone={classTone(kb.classification)}>{kb.classification}</Tag></div>
              <div className="mt-1.5 text-[11px] text-muted-foreground">{d.length} docs · {d.reduce((a, x) => a + x.chunks, 0).toLocaleString()} chunks · {kb.embeddingModel}</div>
            </button>); })}
        </div>
        {draft && (
          <Panel title={draft.name} actions={<div className="flex gap-1.5">
            <Button size="sm" variant="ghost" className="text-red-300" onClick={() => ask("Delete knowledge base?", "Its documents and vector index (simulated) will be removed.", () => { remove("knowledgeBases", draft.id); docs(draft.id).forEach((d) => remove("documents", d.id)); audit_("kb.delete", `kb/${draft.name}`); setSelId(knowledgeBases.find((k) => k.id !== draft.id)?.id ?? ""); })}><Trash2 className="h-3.5 w-3.5" /></Button>
            <Button size="sm" onClick={() => { update("knowledgeBases", draft.id, { ...draft, updatedAt: new Date().toISOString() }); audit_("kb.update", `kb/${draft.name}`); toast.success("Configuration saved", { description: "A real platform would schedule re-indexing." }); }}><Save className="mr-1.5 h-3.5 w-3.5" />Save</Button></div>}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">General</p>
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Data classification</Label><Select value={draft.classification} onValueChange={(v) => setDraft({ ...draft, classification: v as Classification })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Public", "Internal", "Confidential", "Restricted"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <p className="pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Embedding & index</p>
                <div className="space-y-1"><Label className="text-xs">Embedding model</Label><Select value={draft.embeddingModel} onValueChange={(v) => setDraft({ ...draft, embeddingModel: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["bge-m3", "e5-mistral-7b", "nomic-embed-text-v1.5", "gte-large-en-v1.5"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label className="text-xs">Vector index</Label><Input value={draft.vectorStore} onChange={(e) => setDraft({ ...draft, vectorStore: e.target.value })} className="font-mono text-xs" /></div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Chunking & retrieval</p>
                {([["chunkSize", "Chunk size (tokens)", 128, 2048, 64], ["chunkOverlap", "Chunk overlap", 0, 256, 16], ["topK", "Top-k", 1, 20, 1], ["threshold", "Similarity threshold", 0.3, 0.95, 0.01]] as const).map(([key, label, min, max, step]) => (
                  <div key={key} className="space-y-2"><div className="flex justify-between text-xs"><Label className="text-xs">{label}</Label><span className="tabular-nums">{draft[key]}</span></div>
                    <Slider value={[draft[key]]} min={min} max={max} step={step} onValueChange={([v]) => setDraft({ ...draft, [key]: v })} /></div>
                ))}
                <div className="rounded-md border p-3"><div className="mb-1 flex items-center justify-between text-xs font-medium">Index stats <SimBadge label="Simulated" /></div>
                  <KV k="Documents" v={docs(draft.id).length} /><KV k="Vectors" v={docs(draft.id).reduce((a, x) => a + x.chunks, 0).toLocaleString()} /><KV k="Dimensions" v={draft.embeddingModel === "bge-m3" ? 1024 : 768} /><KV k="Updated" v={timeAgo(draft.updatedAt)} /></div>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
