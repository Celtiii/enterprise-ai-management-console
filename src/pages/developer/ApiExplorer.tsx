import { useState } from "react";
import { Play, Copy } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/services/store";
import { PageHeader, Panel, Tag, SimBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const endpoints = [
  { method: "POST", path: "/v1/chat/completions", desc: "Create a chat completion (OpenAI-compatible, served by vLLM).", body: (m: string) => ({ model: m, messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Summarise our VPN policy." }], temperature: 0.7, max_tokens: 512, stream: false }) },
  { method: "POST", path: "/v1/completions", desc: "Legacy text completion.", body: (m: string) => ({ model: m, prompt: "def fibonacci(n):", max_tokens: 128 }) },
  { method: "POST", path: "/v1/embeddings", desc: "Create embeddings for retrieval.", body: () => ({ model: "bge-m3", input: ["Remote access requires MFA."] }) },
  { method: "GET", path: "/v1/models", desc: "List models served by the gateway.", body: () => null },
  { method: "POST", path: "/v1/agents/{agent_id}/runs", desc: "Platform extension: invoke an agent.", body: () => ({ input: "Triage alert SIEM-4411", stream: true }) },
  { method: "POST", path: "/v1/retrieval/query", desc: "Platform extension: query a knowledge base.", body: () => ({ knowledge_base: "kb-policies", query: "password rotation", top_k: 5, threshold: 0.72 }) },
];

export default function ApiExplorer() {
  const { deployments } = useApp();
  const model = deployments.find((d) => d.status === "running")?.name ?? "qwen3-8b-chat";
  const [i, setI] = useState(0);
  const [resp, setResp] = useState<string | null>(null);
  const ep = endpoints[i];
  const body = ep.body(model);
  const base = "https://ai-gateway.corp.internal";
  const curl = `curl ${base}${ep.path} \\\n  -H "Authorization: Bearer $AI_PLATFORM_API_KEY" \\\n  -H "Content-Type: application/json"${body ? ` \\\n  -d '${JSON.stringify(body, null, 2)}'` : ""}`;
  const py = `from openai import OpenAI\n\nclient = OpenAI(base_url="${base}/v1", api_key=os.environ["AI_PLATFORM_API_KEY"])\n\nresp = client.chat.completions.create(\n    model="${model}",\n    messages=[{"role": "user", "content": "Summarise our VPN policy."}],\n)\nprint(resp.choices[0].message.content)`;
  const ts = `const res = await fetch("${base}${ep.path}", {\n  method: "${ep.method}",\n  headers: { Authorization: \`Bearer \${process.env.AI_PLATFORM_API_KEY}\`, "Content-Type": "application/json" },${body ? `\n  body: JSON.stringify(${JSON.stringify(body)}),` : ""}\n});\nconsole.log(await res.json());`;
  const mockResp = () => ep.path === "/v1/models" ? { object: "list", data: deployments.filter((d) => d.status === "running").map((d) => ({ id: d.name, object: "model", owned_by: "ai-platform" })) }
    : ep.path.includes("chat") ? { id: "chatcmpl-mock-7f3a", object: "chat.completion", model, choices: [{ index: 0, message: { role: "assistant", content: "[MOCK] The VPN policy requires MFA and managed devices…" }, finish_reason: "stop" }], usage: { prompt_tokens: 31, completion_tokens: 18, total_tokens: 49 }, x_simulated: true }
    : ep.path.includes("embeddings") ? { object: "list", data: [{ object: "embedding", index: 0, embedding: [0.0123, -0.0456, 0.0789, "…1021 more"] }], model: "bge-m3", x_simulated: true }
    : { status: "accepted", id: "mock-req-001", x_simulated: true };
  const copy = (s: string) => { navigator.clipboard?.writeText(s); toast.success("Copied"); };

  return (
    <div>
      <PageHeader title="API explorer" description="OpenAI-compatible API reference. 'Try it' returns mock responses generated in the browser." />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Panel bodyClass="p-1.5" className="self-start">{endpoints.map((e, j) => (
          <button key={e.path} onClick={() => { setI(j); setResp(null); }} className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left", j === i ? "bg-accent" : "hover:bg-accent/50")}>
            <span className={cn("w-11 text-[10px] font-bold", e.method === "GET" ? "text-emerald-400" : "text-sky-400")}>{e.method}</span><span className="font-mono text-xs truncate">{e.path}</span></button>))}
        </Panel>
        <div className="space-y-4">
          <Panel title={<span className="flex items-center gap-2"><Tag tone={ep.method === "GET" ? "green" : "blue"}>{ep.method}</Tag><span className="font-mono">{ep.path}</span></span>} actions={<Button size="sm" onClick={() => setResp(JSON.stringify(mockResp(), null, 2))}><Play className="mr-1.5 h-3.5 w-3.5" />Try it (mock)</Button>}>
            <p className="mb-3 text-sm text-muted-foreground">{ep.desc}</p>
            <Tabs defaultValue="curl"><TabsList><TabsTrigger value="curl">cURL</TabsTrigger><TabsTrigger value="py">Python</TabsTrigger><TabsTrigger value="ts">TypeScript</TabsTrigger></TabsList>
              {[["curl", curl], ["py", py], ["ts", ts]].map(([k, code]) => (
                <TabsContent key={k} value={k}><div className="relative"><Button size="icon" variant="ghost" className="absolute right-2 top-2 h-7 w-7" onClick={() => copy(code)} aria-label="Copy"><Copy className="h-3.5 w-3.5" /></Button>
                  <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-[11.5px] leading-relaxed">{code}</pre></div></TabsContent>))}
            </Tabs>
          </Panel>
          <Panel title={<span className="flex items-center gap-2">Response <SimBadge label="Mock" /></span>}>
            {resp ? <pre className="overflow-x-auto text-[11.5px] text-emerald-100/90">{resp}</pre> : <p className="text-sm text-muted-foreground">Click "Try it" to see an example response.</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
