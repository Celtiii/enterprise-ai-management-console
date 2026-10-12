import { useState } from "react";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/services/store";
import { PageHeader, Panel, StatusBadge, th, td } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export default function ExecutionHistory() {
  const { runs, update, audit_ } = useApp();
  const [status, setStatus] = useState("all");
  const rows = runs.filter((r) => status === "all" || r.status === status);
  const [selId, setSelId] = useState(rows[0]?.id);
  const sel = runs.find((r) => r.id === selId);
  const decide = (approve: boolean) => {
    if (!sel) return;
    update("runs", sel.id, { status: approve ? "succeeded" : "failed", steps: sel.steps.map((s) => (s.node === "Human Approval" ? { ...s, status: approve ? "succeeded" : "failed", detail: approve ? "Approved by ali.moradi" : "Rejected by ali.moradi" } : s)) });
    audit_(approve ? "workflow.approve" : "workflow.reject", `run/${sel.id}`); toast.success(approve ? "Run approved (simulated)" : "Run rejected");
  };
  return (
    <div>
      <PageHeader title="Execution history" description="Workflow runs, including those started from the Workflow Builder simulation." actions={
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger><SelectContent>{["all", "succeeded", "failed", "running", "awaiting-approval"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All statuses" : s}</SelectItem>)}</SelectContent></Select>} />
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" bodyClass="p-0">
          <table className="w-full"><thead><tr className="border-b"><th className={th}>Run</th><th className={th}>Workflow</th><th className={th}>Trigger</th><th className={th}>Duration</th><th className={th}>Status</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} onClick={() => setSelId(r.id)} className={cn("border-b border-border/50 cursor-pointer", r.id === selId ? "bg-accent/50" : "hover:bg-accent/30")}>
                <td className={`${td} font-mono text-xs`}>{r.id}<div className="text-[11px] text-muted-foreground font-sans">{timeAgo(r.startedAt)}</div></td>
                <td className={td}>{r.workflowName}</td><td className={`${td} text-xs text-muted-foreground`}>{r.trigger}</td>
                <td className={`${td} tabular-nums`}>{(r.durationMs / 1000).toFixed(1)}s</td><td className={td}><StatusBadge status={r.status} /></td>
              </tr>))}
              {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No runs match.</td></tr>}</tbody>
          </table>
        </Panel>
        <Panel className="xl:col-span-2" title={sel ? `Run ${sel.id}` : "Run details"}>
          {sel ? (
            <div>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {sel.steps.map((s, i) => { const I = s.status === "succeeded" ? CheckCircle2 : s.status === "failed" ? XCircle : MinusCircle; return (
                  <li key={i} className="relative"><I className={cn("absolute -left-[27px] h-4 w-4 bg-card", s.status === "succeeded" ? "text-emerald-400" : s.status === "failed" ? "text-red-400" : "text-muted-foreground")} />
                    <div className="flex justify-between text-sm"><span className="font-medium">{s.node}</span><span className="tabular-nums text-xs text-muted-foreground">{s.ms} ms</span></div>
                    <div className="text-xs text-muted-foreground">{s.detail}</div></li>); })}
              </ol>
              {sel.status === "awaiting-approval" && <div className="mt-5 flex gap-2"><Button size="sm" onClick={() => decide(true)}>Approve</Button><Button size="sm" variant="outline" onClick={() => decide(false)}>Reject</Button></div>}
            </div>
          ) : <p className="text-sm text-muted-foreground">Select a run.</p>}
        </Panel>
      </div>
    </div>
  );
}
