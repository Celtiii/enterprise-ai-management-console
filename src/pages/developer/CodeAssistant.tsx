import { useState } from "react";
import { ScanSearch, AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { PageHeader, Panel, Tag, SimBadge, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const samples: Record<string, string> = {
  python: `import subprocess, requests\n\nAPI_KEY = "sk-live-123456"\n\ndef run(cmd):\n    return subprocess.call(cmd, shell=True)\n\ndef fetch(url):\n    try:\n        return requests.get(url, verify=False).json()\n    except:\n        pass\n`,
  typescript: `export async function getUser(id: any) {\n  const res = await fetch("/api/users/" + id);\n  const data = await res.json();\n  eval(data.script);\n  console.log(data);\n  return data;\n}\n`,
  go: `func handler(w http.ResponseWriter, r *http.Request) {\n    q := "SELECT * FROM users WHERE id=" + r.URL.Query().Get("id")\n    rows, _ := db.Query(q)\n    defer rows.Close()\n}\n`,
  java: `public String read(String path) throws Exception {\n    // TODO validate path\n    return new String(Files.readAllBytes(Paths.get("/data/" + path)));\n}\n`,
};
type Sev = "critical" | "high" | "medium" | "low";
interface Finding { line: number; sev: Sev; rule: string; msg: string; fix: string }
const rules: { re: RegExp; sev: Sev; rule: string; msg: string; fix: string }[] = [
  { re: /(api[_-]?key|secret|password)\s*=\s*["'][^"']+["']/i, sev: "critical", rule: "hardcoded-secret", msg: "Hard-coded credential in source.", fix: "Load from a secret store or environment variable." },
  { re: /shell\s*=\s*True/, sev: "high", rule: "command-injection", msg: "subprocess with shell=True can enable command injection.", fix: "Pass an argument list and shell=False." },
  { re: /\beval\(/, sev: "critical", rule: "code-injection", msg: "eval() executes untrusted data.", fix: "Remove eval; parse data explicitly." },
  { re: /verify\s*=\s*False/, sev: "high", rule: "tls-verification-disabled", msg: "TLS certificate verification is disabled.", fix: "Enable verification and trust the internal CA bundle." },
  { re: /SELECT .*["']\s*\+/i, sev: "critical", rule: "sql-injection", msg: "SQL built by string concatenation.", fix: "Use parameterised queries." },
  { re: /except:\s*$/, sev: "medium", rule: "bare-except", msg: "Bare except swallows all errors.", fix: "Catch specific exceptions and log them." },
  { re: /:\s*any\b/, sev: "low", rule: "no-explicit-any", msg: "Parameter typed as any.", fix: "Use a precise type." },
  { re: /console\.log/, sev: "low", rule: "no-console", msg: "Debug logging may leak data.", fix: "Use the structured logger." },
  { re: /, _ :?= /, sev: "medium", rule: "unchecked-error", msg: "Error return value ignored.", fix: "Handle the error." },
  { re: /Paths\.get\(.*\+/, sev: "high", rule: "path-traversal", msg: "User-controlled path concatenation.", fix: "Normalise and validate against an allow-listed root." },
  { re: /TODO/, sev: "low", rule: "todo", msg: "Unresolved TODO.", fix: "Track in issue tracker." },
];
const sevStyle: Record<Sev, { tone: "red" | "amber" | "blue" | "gray"; icon: typeof Info }> = { critical: { tone: "red", icon: AlertOctagon }, high: { tone: "amber", icon: AlertTriangle }, medium: { tone: "blue", icon: AlertTriangle }, low: { tone: "gray", icon: Info } };

export default function CodeAssistant() {
  const [lang, setLang] = useState("python");
  const [code, setCode] = useState(samples.python);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [busy, setBusy] = useState(false);
  const review = () => {
    setBusy(true);
    setTimeout(() => {
      const f: Finding[] = [];
      code.split("\n").forEach((l, i) => rules.forEach((r) => r.re.test(l) && f.push({ line: i + 1, sev: r.sev, rule: r.rule, msg: r.msg, fix: r.fix })));
      const order: Sev[] = ["critical", "high", "medium", "low"];
      setFindings(f.sort((a, b) => order.indexOf(a.sev) - order.indexOf(b.sev))); setBusy(false);
    }, 700);
  };
  const flagged = new Set(findings?.map((f) => f.line));
  return (
    <div>
      <PageHeader title="Code assistant" description="Code review workspace. Findings come from a local pattern-based mock reviewer, not an LLM." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Source" actions={<div className="flex gap-2">
          <Select value={lang} onValueChange={(v) => { setLang(v); setCode(samples[v]); setFindings(null); }}><SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(samples).map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}</SelectContent></Select>
          <Button size="sm" onClick={review} disabled={busy || !code.trim()}><ScanSearch className="mr-1.5 h-4 w-4" />{busy ? "Reviewing…" : "Review"}</Button></div>}>
          <div className="flex rounded-md border bg-muted/20 font-mono text-[12px]">
            <div className="select-none border-r py-2 text-right text-muted-foreground">{code.split("\n").map((_, i) => <div key={i} className={cn("px-2 leading-5", flagged.has(i + 1) && "bg-red-500/20 text-red-300")}>{i + 1}</div>)}</div>
            <Textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} className="min-h-[380px] flex-1 resize-none rounded-none border-0 bg-transparent py-2 font-mono text-[12px] leading-5 focus-visible:ring-0" />
          </div>
        </Panel>
        <Panel title={<span className="flex items-center gap-2">Review results <SimBadge label="Mock reviewer" /></span>}>
          {!findings ? <EmptyState title="No review yet" body="Paste code and click Review." /> : findings.length === 0 ? <EmptyState title="No issues found" body="The mock reviewer found nothing matching its rules." /> : (
            <div className="space-y-2">
              <div className="mb-3 flex gap-2">{(["critical", "high", "medium", "low"] as Sev[]).map((s) => <Tag key={s} tone={sevStyle[s].tone}>{findings.filter((f) => f.sev === s).length} {s}</Tag>)}</div>
              {findings.map((f, i) => { const S = sevStyle[f.sev]; return (
                <div key={i} className="rounded-md border p-3"><div className="flex items-center gap-2 text-sm"><S.icon className="h-4 w-4" /><Tag tone={S.tone}>{f.sev}</Tag><span className="font-mono text-xs">{f.rule}</span><span className="ml-auto text-xs text-muted-foreground">line {f.line}</span></div>
                  <p className="mt-1.5 text-sm">{f.msg}</p><p className="mt-1 text-xs text-emerald-300/90">Suggested fix: {f.fix}</p></div>); })}
            </div>)}
        </Panel>
      </div>
    </div>
  );
}
