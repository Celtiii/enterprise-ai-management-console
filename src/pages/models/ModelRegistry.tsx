import { useMemo, useState } from "react";
import { Plus, ArrowUpDown, Info } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid } from "@/services/store";
import type { ModelEntry, ModelStatus } from "@/types";
import { PageHeader, Panel, SearchInput, StatusBadge, Tag, EmptyState, KV, th, td, useConfirm, Pager, usePaged } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const statuses: ModelStatus[] = ["available", "deployed", "importing", "deprecated", "incompatible"];
type SortKey = "name" | "vramGb" | "contextLength";

export default function ModelRegistry() {
  const { models, add, update, remove, audit_ } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [format, setFormat] = useState("all");
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "name", dir: 1 });
  const [selected, setSelected] = useState<ModelEntry | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const { ask, node } = useConfirm();

  const rows = useMemo(() => models
    .filter((m) => (status === "all" || m.status === status) && (format === "all" || m.format === format) && `${m.name} ${m.provider} ${m.family} ${m.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : -1) * sort.dir), [models, q, status, format, sort]);
  const p = usePaged(rows, 8);
  const sel = selected ? models.find((m) => m.id === selected.id) ?? null : null;
  const toggleSort = (k: SortKey) => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : 1 }));

  return (
    <div>
      {node}
      <PageHeader title="Model registry" description="Illustrative inventory of models known to the platform. Entries do not prove that artifacts are installed on disk." actions={<Button size="sm" onClick={() => setRegisterOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Register model</Button>} />
      <Panel bodyClass="p-0">
        <div className="flex flex-wrap gap-2 border-b p-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search name, provider, tag…" className="w-72" />
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
          <Select value={format} onValueChange={setFormat}><SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All formats</SelectItem><SelectItem value="safetensors">safetensors</SelectItem><SelectItem value="gguf">gguf</SelectItem></SelectContent></Select>
        </div>
        {rows.length === 0 ? <EmptyState title="No models match" body="Adjust filters or register a new model." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b">
                <th className={th}><button className="inline-flex items-center gap-1" onClick={() => toggleSort("name")}>Model <ArrowUpDown className="h-3 w-3" /></button></th>
                <th className={th}>Params</th><th className={th}>Quant / format</th>
                <th className={th}><button className="inline-flex items-center gap-1" onClick={() => toggleSort("contextLength")}>Context <ArrowUpDown className="h-3 w-3" /></button></th>
                <th className={th}><button className="inline-flex items-center gap-1" onClick={() => toggleSort("vramGb")}>VRAM <ArrowUpDown className="h-3 w-3" /></button></th>
                <th className={th}>Compatibility</th><th className={th}>Status</th>
              </tr></thead>
              <tbody>{p.slice.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-accent/30 cursor-pointer" onClick={() => setSelected(m)}>
                  <td className={td}><div className="font-medium">{m.name}</div><div className="text-[11px] text-muted-foreground">{m.provider} · {m.family}{m.illustrative && " · illustrative"}</div></td>
                  <td className={td}>{m.params}</td>
                  <td className={td}><span className="text-sm">{m.quantization}</span> <span className="text-[11px] text-muted-foreground">{m.format}</span></td>
                  <td className={`${td} tabular-nums`}>{(m.contextLength / 1024).toFixed(0)}k</td>
                  <td className={`${td} tabular-nums`}>{m.vramGb} GB</td>
                  <td className={td}><StatusBadge status={m.compatibility} /></td>
                  <td className={td}><StatusBadge status={m.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div className="px-3 pb-3"><Pager {...p} onPage={p.setPage} /></div>
      </Panel>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {sel && (
            <>
              <SheetHeader><SheetTitle>{sel.name}</SheetTitle><SheetDescription>{sel.provider} · {sel.family} · v{sel.version}</SheetDescription></SheetHeader>
              <div className="mt-4 flex flex-wrap gap-1.5">{sel.tags.map((t) => <Tag key={t} tone="blue">{t}</Tag>)}{sel.illustrative && <Tag tone="violet">illustrative entry</Tag>}</div>
              <div className="mt-4">
                <KV k="Parameters" v={sel.params} /><KV k="Quantization" v={sel.quantization} /><KV k="Format" v={sel.format} />
                <KV k="Context length" v={sel.contextLength.toLocaleString()} /><KV k="GPU memory (est.)" v={`${sel.vramGb} GB`} />
                <KV k="Artifact location" v={sel.artifactPath} mono /><KV k="License" v={sel.license} />
                <KV k="Compatibility" v={<StatusBadge status={sel.compatibility} />} />
              </div>
              <div className="mt-5 space-y-1.5">
                <Label className="text-xs">Change status (simulated)</Label>
                <Select value={sel.status} onValueChange={(v) => { update("models", sel.id, { status: v as ModelStatus }); audit_("model.status_change", `model/${sel.name}`); toast.success(`Status set to ${v}`); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-md border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-sky-200/90"><Info className="h-4 w-4 shrink-0" />Artifact verification (checksum, signature) would run against the offline artifact store once connected.</div>
              <Button variant="outline" className="mt-6 w-full text-red-300" onClick={() => ask("Remove model from registry?", `${sel.name} will be removed from the registry. Artifacts on disk are not affected.`, () => { remove("models", sel.id); audit_("model.delete", `model/${sel.name}`); setSelected(null); toast.success("Model removed"); }, "Remove")}>Remove from registry</Button>
            </>
          )}
        </SheetContent>
      </Sheet>

      <RegisterModelDialog open={registerOpen} onOpenChange={setRegisterOpen} onSubmit={(m) => { add("models", m); audit_("model.register", `model/${m.name}`); toast.success("Model registered (simulated)", { description: `${m.name} added with status "importing".` }); }} />
    </div>
  );
}

function RegisterModelDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (m: ModelEntry) => void }) {
  const [f, setF] = useState({ name: "", provider: "", family: "", params: "", quantization: "BF16", format: "safetensors", contextLength: "32768", vramGb: "16", artifactPath: "/srv/models/" });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const submit = () => {
    if (!f.name.trim() || !f.provider.trim() || !f.artifactPath.startsWith("/")) { setErr("Name, provider and an absolute artifact path are required."); return; }
    onSubmit({ id: uid("model"), name: f.name.trim(), provider: f.provider.trim(), family: f.family || f.name.split("-")[0], params: f.params || "—", quantization: f.quantization, format: f.format, contextLength: Number(f.contextLength) || 4096, artifactPath: f.artifactPath, status: "importing", vramGb: Number(f.vramGb) || 0, compatibility: "compatible", version: "1.0", license: "Unspecified", tags: ["new"], illustrative: true });
    setErr(""); onOpenChange(false);
    setF({ ...f, name: "", provider: "", family: "", params: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Register model</DialogTitle><DialogDescription>Adds an entry to the registry. Artifact import is simulated.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1"><Label className="text-xs">Model name *</Label><Input value={f.name} onChange={set("name")} placeholder="Qwen3-14B" /></div>
          <div className="space-y-1"><Label className="text-xs">Provider *</Label><Input value={f.provider} onChange={set("provider")} placeholder="Alibaba Qwen" /></div>
          <div className="space-y-1"><Label className="text-xs">Family</Label><Input value={f.family} onChange={set("family")} placeholder="Qwen3" /></div>
          <div className="space-y-1"><Label className="text-xs">Parameters</Label><Input value={f.params} onChange={set("params")} placeholder="14B" /></div>
          <div className="space-y-1"><Label className="text-xs">Quantization</Label>
            <Select value={f.quantization} onValueChange={(v) => setF({ ...f, quantization: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["BF16", "FP16", "FP8", "AWQ INT4", "GPTQ INT4", "GGUF Q4_K_M"].map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Format</Label>
            <Select value={f.format} onValueChange={(v) => setF({ ...f, format: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="safetensors">safetensors</SelectItem><SelectItem value="gguf">gguf</SelectItem></SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Context length</Label><Input type="number" value={f.contextLength} onChange={set("contextLength")} /></div>
          <div className="space-y-1"><Label className="text-xs">VRAM (GB)</Label><Input type="number" value={f.vramGb} onChange={set("vramGb")} /></div>
          <div className="col-span-2 space-y-1"><Label className="text-xs">Artifact path *</Label><Input value={f.artifactPath} onChange={set("artifactPath")} className="font-mono text-xs" /></div>
        </div>
        {err && <p className="text-xs text-red-400">{err}</p>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Register</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
