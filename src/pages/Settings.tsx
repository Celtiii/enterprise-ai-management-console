import { toast } from "sonner";
import { useApp } from "@/services/store";
import type { Environment } from "@/types";
import { PageHeader, Panel, KV, useConfirm } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const { settings: s, updateSettings: up, models, environment, setEnvironment, resetDemo, audit_ } = useApp();
  const { ask, node } = useConfirm();
  const row = (label: string, el: React.ReactNode, hint?: string) => (
    <div className="grid items-center gap-2 border-b border-border/50 py-3 last:border-0 md:grid-cols-[240px_1fr]"><div><Label className="text-sm">{label}</Label>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div><div>{el}</div></div>);
  return (
    <div>
      {node}
      <PageHeader title="Settings" description="Console preferences. Changes save automatically to this browser." />
      <Tabs defaultValue="general">
        <TabsList className="mb-3 flex-wrap h-auto">{["general", "environment", "inference", "notifications", "api", "workspace", "about"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === "api" ? "API connection" : t}</TabsTrigger>)}</TabsList>
        <TabsContent value="general"><Panel>
          {row("Organization name", <Input value={s.orgName} onChange={(e) => up({ orgName: e.target.value })} className="max-w-sm" />)}
          {row("Theme", <Select value={s.theme} onValueChange={(v) => { up({ theme: v as typeof s.theme }); if (v !== "dark") toast.info("Only the dark theme is designed for this prototype"); }}><SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dark">Dark (default)</SelectItem><SelectItem value="system">System</SelectItem></SelectContent></Select>)}
        </Panel></TabsContent>
        <TabsContent value="environment"><Panel>
          {row("Active environment", <Select value={environment} onValueChange={(v) => setEnvironment(v as Environment)}><SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="development">Development</SelectItem><SelectItem value="staging">Staging</SelectItem><SelectItem value="production">Production</SelectItem></SelectContent></Select>, "Also available in the top header.")}
          {row("Air-gapped mode", <Switch checked={s.airGapped} onCheckedChange={(v) => { up({ airGapped: v }); audit_("settings.airgap", v ? "enabled" : "disabled"); }} />, "Marks the deployment as having no external network egress.")}
        </Panel></TabsContent>
        <TabsContent value="inference"><Panel>
          {row("Default model", <Select value={s.defaultModelId} onValueChange={(v) => up({ defaultModelId: v })}><SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger><SelectContent>{models.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>)}
          {row(`Temperature (${s.temperature.toFixed(2)})`, <Slider className="max-w-sm" min={0} max={2} step={0.05} value={[s.temperature]} onValueChange={([v]) => up({ temperature: v })} />)}
          {row(`Top-p (${s.topP.toFixed(2)})`, <Slider className="max-w-sm" min={0} max={1} step={0.01} value={[s.topP]} onValueChange={([v]) => up({ topP: v })} />)}
          {row("Max tokens", <Input type="number" className="max-w-sm" value={s.maxTokens} onChange={(e) => up({ maxTokens: Math.max(1, Number(e.target.value) || 1) })} />)}
          {row("Streaming", <Switch checked={s.streaming} onCheckedChange={(v) => up({ streaming: v })} />)}
        </Panel></TabsContent>
        <TabsContent value="notifications"><Panel>
          {([["notifyEmail", "Email notifications"], ["notifyDeployments", "Deployment events"], ["notifySecurity", "Security alerts"], ["notifyDigest", "Weekly usage digest"]] as const).map(([k, l]) => <div key={k}>{row(l, <Switch checked={s[k]} onCheckedChange={(v) => up({ [k]: v })} />)}</div>)}
        </Panel></TabsContent>
        <TabsContent value="api"><Panel>
          {row("Inference mode", <Select value={s.inferenceMode} onValueChange={(v) => up({ inferenceMode: v as typeof s.inferenceMode })}><SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mock">Local mock adapter</SelectItem><SelectItem value="openai-compatible">OpenAI-compatible (vLLM)</SelectItem></SelectContent></Select>, "Mock is the default and requires no backend.")}
          {row("API base URL", <Input className="max-w-sm font-mono text-xs" value={s.apiBaseUrl} onChange={(e) => up({ apiBaseUrl: e.target.value })} placeholder="https://gateway.ai.corp.internal/v1" />, "Requests go to {base}/chat/completions. Credentials should be attached by a server-side gateway, never stored in the browser.")}
          {row("Connection", <Button size="sm" variant="outline" onClick={async () => {
            if (s.inferenceMode === "mock") { toast.info("Mock mode — nothing to test"); return; }
            try { const r = await fetch(`${s.apiBaseUrl.replace(/\/$/, "")}/models`); toast[r.ok ? "success" : "error"](r.ok ? "Endpoint reachable" : `Endpoint returned ${r.status}`); } catch { toast.error("Endpoint unreachable from this browser"); }
          }}>Test connection</Button>)}
        </Panel></TabsContent>
        <TabsContent value="workspace"><Panel>
          {row("Workspace name", <Input className="max-w-sm" value={s.workspaceName} onChange={(e) => up({ workspaceName: e.target.value })} />)}
          {row("Conversation retention (days)", <Input type="number" className="max-w-sm" value={s.dataRetentionDays} onChange={(e) => up({ dataRetentionDays: Number(e.target.value) || 0 })} />)}
          {row("Reset demo data", <Button size="sm" variant="destructive" onClick={() => ask("Reset all demo data?", "Restores every model, agent, document and setting to the seeded sample state.", () => { resetDemo(); toast.success("Demo data reset"); }, "Reset")}>Reset</Button>, "Clears local changes in this browser.")}
        </Panel></TabsContent>
        <TabsContent value="about"><Panel>
          <div className="max-w-md space-y-1"><KV k="Product" v="Enterprise AI Management Console" /><KV k="Build" v="Prototype 0.1.0" mono /><KV k="Data" v="Local mock data (browser storage)" /><KV k="Inference" v={s.inferenceMode === "mock" ? "Mock adapter" : "OpenAI-compatible"} /><KV k="Target runtime" v="vLLM ≥ 0.9" /></div>
          <p className="mt-4 text-xs text-muted-foreground">This is a UI prototype. Metrics, deployments, security controls and AI responses are simulated unless a real backend is connected.</p>
        </Panel></TabsContent>
      </Tabs>
    </div>
  );
}
