import { useState } from "react";
import { Search, FileText } from "lucide-react";
import { useApp } from "@/services/store";
import { PageHeader, Panel, Tag, SimBadge, EmptyState } from "@/components/common";
import { seeded } from "@/mocks/metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Hit { doc: string; score: number; text: string; page: number }

export default function RetrievalPlayground() {
  const { knowledgeBases, documents } = useApp();
  const [kb, setKb] = useState(knowledgeBases[0]?.id ?? "");
  const cfg = knowledgeBases.find((k) => k.id === kb);
  const [topK, setTopK] = useState(cfg?.topK ?? 5);
  const [thr, setThr] = useState(cfg?.threshold ?? 0.7);
  const [rerank, setRerank] = useState(true);
  const [q, setQ] = useState("What is the password rotation policy for service accounts?");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [ms, setMs] = useState(0);

  const search = () => {
    const docs = documents.filter((d) => d.kbId === kb && d.status === "indexed");
    setBusy(true); setHits(null);
    setTimeout(() => {
      const rnd = seeded(q.length * 31 + kb.length);
      const words = q.split(/\s+/).filter((w) => w.length > 3).slice(0, 4);
      const all: Hit[] = docs.flatMap((d) => [0, 1].map(() => ({ doc: d.name, page: 1 + Math.floor(rnd() * 40), score: Math.round((0.55 + rnd() * 0.4) * 1000) / 1000,
        text: `…${words.length ? `regarding **${words.join(" ")}**, ` : ""}section ${1 + Math.floor(rnd() * 9)}.${1 + Math.floor(rnd() * 9)} states that controls must be reviewed by the owning team and exceptions recorded in the governance register…` })));
      setHits(all.sort((a, b) => b.score - a.score).filter((h) => h.score >= thr).slice(0, topK));
      setMs(Math.round(20 + rnd() * 80)); setBusy(false);
    }, 600);
  };

  return (
    <div>
      <PageHeader title="Retrieval playground" description="Test retrieval settings against a knowledge base. Results are deterministic mock passages, not real vector search." />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Panel title="Settings" className="self-start"><div className="space-y-4">
          <div className="space-y-1"><Label className="text-xs">Knowledge base</Label><Select value={kb} onValueChange={(v) => { setKb(v); const c = knowledgeBases.find((k) => k.id === v); if (c) { setTopK(c.topK); setThr(c.threshold); } }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{knowledgeBases.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><div className="flex justify-between text-xs"><Label className="text-xs">Top-k</Label><span>{topK}</span></div><Slider value={[topK]} min={1} max={20} step={1} onValueChange={([v]) => setTopK(v)} /></div>
          <div className="space-y-2"><div className="flex justify-between text-xs"><Label className="text-xs">Similarity threshold</Label><span>{thr.toFixed(2)}</span></div><Slider value={[thr]} min={0.3} max={0.95} step={0.01} onValueChange={([v]) => setThr(v)} /></div>
          <label className="flex items-center justify-between text-sm">Cross-encoder rerank <Switch checked={rerank} onCheckedChange={setRerank} /></label>
          {cfg && <div className="text-[11px] text-muted-foreground">Embedding: {cfg.embeddingModel}<br />Index: {cfg.vectorStore}</div>}
        </div></Panel>
        <div className="space-y-4">
          <Panel><div className="flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Enter a query…" /><Button onClick={search} disabled={busy || !q.trim()}><Search className="mr-1.5 h-4 w-4" />{busy ? "Searching…" : "Retrieve"}</Button></div></Panel>
          <Panel title={<span className="flex items-center gap-2">Results {hits && <span className="text-xs font-normal text-muted-foreground">{hits.length} passages · {ms} ms</span>}<SimBadge label="Simulated" /></span>}>
            {!hits ? <EmptyState title={busy ? "Searching…" : "Run a query"} body="Retrieved passages and source citations appear here." />
              : hits.length === 0 ? <EmptyState title="No passages above threshold" body="Lower the similarity threshold, or index documents into this knowledge base." />
              : <div className="space-y-2">{hits.map((h, i) => (
                <div key={i} className="rounded-md border p-3">
                  <div className="mb-1.5 flex items-center gap-2 text-xs"><span className="grid h-5 w-5 place-items-center rounded bg-primary/15 text-primary font-medium">{i + 1}</span><FileText className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium">{h.doc}</span><span className="text-muted-foreground">p.{h.page}</span><span className="ml-auto"><Tag tone={h.score > 0.85 ? "green" : "blue"}>score {h.score.toFixed(3)}</Tag></span></div>
                  <p className="text-sm text-muted-foreground">{h.text.split("**").map((part, j) => (j % 2 ? <mark key={j} className="rounded bg-amber-400/20 px-0.5 text-amber-100">{part}</mark> : part))}</p>
                </div>))}</div>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
