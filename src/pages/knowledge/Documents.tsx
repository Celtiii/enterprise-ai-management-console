import { useRef, useState } from "react";
import { Upload, Trash2, RotateCw, FileText } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid } from "@/services/store";
import type { Classification, DocumentEntry } from "@/types";
import { PageHeader, Panel, StatusBadge, Tag, SearchInput, useConfirm, th, td, Pager, usePaged } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classTone } from "./KnowledgeBases";
import { timeAgo } from "@/lib/format";

const samples = ["Remote Access Standard v2.pdf", "Data Retention Schedule 2026.xlsx", "Kubernetes Runbook - GPU Nodes.md", "Supplier Code of Conduct.docx", "Incident Response Playbook.pdf"];

export default function Documents() {
  const { documents, knowledgeBases, add, update, remove, audit_ } = useApp();
  const [q, setQ] = useState(""); const [kb, setKb] = useState("all"); const [target, setTarget] = useState(knowledgeBases[0]?.id ?? ""); const [cls, setCls] = useState<Classification>("Internal");
  const fileRef = useRef<HTMLInputElement>(null);
  const { ask, node } = useConfirm();
  const rows = documents.filter((d) => (kb === "all" || d.kbId === kb) && d.name.toLowerCase().includes(q.toLowerCase()));
  const p = usePaged(rows, 10);

  const ingest = (name: string, sizeKb: number) => {
    if (!target) { toast.error("Create a knowledge base first"); return; }
    const d: DocumentEntry = { id: uid("doc"), kbId: target, name, type: name.split(".").pop()?.toUpperCase() ?? "TXT", sizeKb, chunks: 0, status: "queued", progress: 0, uploadedBy: "ali.moradi", uploadedAt: new Date().toISOString(), classification: cls };
    add("documents", d); audit_("document.upload", `doc/${name}`);
    let pr = 0;
    const iv = setInterval(() => {
      pr += 12 + Math.random() * 18;
      if (pr >= 100) { clearInterval(iv); const fail = name.toLowerCase().includes("scan"); update("documents", d.id, fail ? { status: "failed", progress: 100 } : { status: "indexed", progress: 100, chunks: Math.max(1, Math.round(sizeKb / 3)) }); fail ? toast.error(`${name}: OCR failed (simulated)`) : toast.success(`${name} indexed (simulated)`); }
      else update("documents", d.id, { status: "processing", progress: Math.round(pr) });
    }, 600);
  };
  const onFiles = (files: FileList | null) => { Array.from(files ?? []).forEach((f) => ingest(f.name, Math.max(1, Math.round(f.size / 1024)))); toast.info("File contents stay in your browser; only metadata is recorded."); };

  return (
    <div>
      {node}
      <PageHeader title="Documents" description="Upload and track document ingestion. Parsing, chunking and embedding are simulated; file contents are not uploaded anywhere." />
      <Panel className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1"><span className="text-xs text-muted-foreground">Target knowledge base</span><Select value={target} onValueChange={setTarget}><SelectTrigger className="h-9 w-56"><SelectValue placeholder="Choose…" /></SelectTrigger><SelectContent>{knowledgeBases.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><span className="text-xs text-muted-foreground">Classification</span><Select value={cls} onValueChange={(v) => setCls(v as Classification)}><SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger><SelectContent>{["Public", "Internal", "Confidential", "Restricted"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          <Button onClick={() => fileRef.current?.click()}><Upload className="mr-1.5 h-4 w-4" />Upload files</Button>
          <Button variant="outline" onClick={() => ingest(samples[Math.floor(Math.random() * samples.length)], Math.round(100 + Math.random() * 2000))}><FileText className="mr-1.5 h-4 w-4" />Add sample document</Button>
        </div>
      </Panel>
      <Panel bodyClass="p-0">
        <div className="flex flex-wrap gap-2 border-b p-3"><SearchInput value={q} onChange={setQ} className="w-64" />
          <Select value={kb} onValueChange={setKb}><SelectTrigger className="h-8 w-52 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All knowledge bases</SelectItem>{knowledgeBases.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="overflow-x-auto"><table className="w-full">
          <thead><tr className="border-b"><th className={th}>Document</th><th className={th}>Knowledge base</th><th className={th}>Size</th><th className={th}>Chunks</th><th className={th}>Class</th><th className={th}>Ingestion</th><th className={th} /></tr></thead>
          <tbody>{p.slice.map((d) => (
            <tr key={d.id} className="border-b border-border/50">
              <td className={td}><div className="font-medium">{d.name}</div><div className="text-[11px] text-muted-foreground">{d.type} · {d.uploadedBy} · {timeAgo(d.uploadedAt)}</div></td>
              <td className={`${td} text-xs`}>{knowledgeBases.find((k) => k.id === d.kbId)?.name ?? "—"}</td>
              <td className={`${td} tabular-nums text-xs`}>{d.sizeKb >= 1024 ? `${(d.sizeKb / 1024).toFixed(1)} MB` : `${d.sizeKb} KB`}</td>
              <td className={`${td} tabular-nums`}>{d.chunks || "—"}</td>
              <td className={td}><Tag tone={classTone(d.classification)}>{d.classification}</Tag></td>
              <td className={`${td} w-40`}>{d.status === "processing" ? <div className="space-y-1"><Progress value={d.progress} className="h-1.5" /><span className="text-[11px] text-muted-foreground">{d.progress}%</span></div> : <StatusBadge status={d.status} />}</td>
              <td className={`${td} text-right whitespace-nowrap`}>
                {d.status === "failed" && <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Retry" onClick={() => { update("documents", d.id, { status: "indexed", progress: 100, chunks: Math.round(d.sizeKb / 3) }); toast.success("Re-ingested (simulated)"); }}><RotateCw className="h-3.5 w-3.5" /></Button>}
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-300" aria-label="Delete" onClick={() => ask("Delete document?", `${d.name} and its chunks will be removed from the index.`, () => { remove("documents", d.id); audit_("document.delete", `doc/${d.name}`); })}><Trash2 className="h-3.5 w-3.5" /></Button>
              </td>
            </tr>))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No documents.</td></tr>}</tbody>
        </table></div>
        <div className="px-3 pb-3"><Pager {...p} onPage={p.setPage} /></div>
      </Panel>
    </div>
  );
}
