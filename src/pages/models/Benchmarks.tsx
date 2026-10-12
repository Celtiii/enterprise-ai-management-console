import { useState } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/services/store";
import { PageHeader, Panel, th, td, Tag } from "@/components/common";
import { Bars, C } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface Bench { model: string; suite: string; score: number; tps: number; ttft: number; date: string }
const initial: Bench[] = [
  { model: "Qwen3-8B", suite: "Internal Policy QA", score: 81.4, tps: 612, ttft: 180, date: "2026-10-02" },
  { model: "Qwen3-Coder-30B-A3B", suite: "Internal Code Review", score: 76.9, tps: 405, ttft: 260, date: "2026-10-03" },
  { model: "Qwen3-0.6B", suite: "Internal Policy QA", score: 52.2, tps: 95, ttft: 140, date: "2026-10-01" },
  { model: "Llama-3.1-8B-Instruct", suite: "Internal Policy QA", score: 77.8, tps: 580, ttft: 175, date: "2026-09-28" },
  { model: "Mistral-Small-24B-Instruct", suite: "Internal Policy QA", score: 83.1, tps: 310, ttft: 240, date: "2026-09-25" },
];

export default function Benchmarks() {
  const { models } = useApp();
  const [rows, setRows] = useState(initial);
  const [model, setModel] = useState(models[0]?.name ?? "");
  const [suite, setSuite] = useState("Internal Policy QA");
  const [progress, setProgress] = useState<number | null>(null);
  const run = () => {
    setProgress(0);
    const iv = setInterval(() => setProgress((p) => {
      const n = (p ?? 0) + 10;
      if (n >= 100) {
        clearInterval(iv);
        setRows((r) => [{ model, suite, score: Math.round((50 + Math.random() * 35) * 10) / 10, tps: Math.round(100 + Math.random() * 600), ttft: Math.round(120 + Math.random() * 200), date: new Date().toISOString().slice(0, 10) }, ...r]);
        toast.success("Simulated benchmark complete", { description: "Scores are randomly generated for the prototype." });
        setTimeout(() => setProgress(null), 400);
      }
      return n;
    }), 250);
  };
  const latest = Object.values(rows.filter((r) => r.suite === "Internal Policy QA").reduce<Record<string, Bench>>((a, r) => (a[r.model] ? a : { ...a, [r.model]: r }), {}));
  return (
    <div className="space-y-4">
      <PageHeader title="Benchmarks" description="Model evaluation against internal suites. Results here are illustrative." />
      <Panel title="Run evaluation">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={model} onValueChange={setModel}><SelectTrigger className="h-9 w-64"><SelectValue /></SelectTrigger><SelectContent>{models.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}</SelectContent></Select>
          <Select value={suite} onValueChange={setSuite}><SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger><SelectContent>{["Internal Policy QA", "Internal Code Review", "RAG Faithfulness", "Latency Soak (512 concurrency)"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Button onClick={run} disabled={progress !== null}><Play className="mr-1.5 h-4 w-4" />Run (simulated)</Button>
          {progress !== null && <div className="flex-1 min-w-40"><Progress value={progress} /></div>}
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Policy QA accuracy (latest)"><Bars data={latest as never} k="score" x="model" layout="vertical" color={C.violet} height={240} /></Panel>
        <Panel title="Generation throughput (tok/s)"><Bars data={latest as never} k="tps" x="model" layout="vertical" color={C.cyan} height={240} /></Panel>
      </div>
      <Panel title="Results" bodyClass="p-0">
        <table className="w-full"><thead><tr className="border-b"><th className={th}>Model</th><th className={th}>Suite</th><th className={th}>Score</th><th className={th}>Throughput</th><th className={th}>TTFT</th><th className={th}>Date</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border/50"><td className={td}>{r.model}</td><td className={td}><Tag>{r.suite}</Tag></td><td className={`${td} tabular-nums font-medium`}>{r.score}</td><td className={`${td} tabular-nums`}>{r.tps} tok/s</td><td className={`${td} tabular-nums`}>{r.ttft} ms</td><td className={`${td} text-muted-foreground`}>{r.date}</td></tr>)}</tbody>
        </table>
      </Panel>
    </div>
  );
}
