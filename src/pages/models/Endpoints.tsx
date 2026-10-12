import { useState } from "react";
import { Copy, Zap } from "lucide-react";
import { toast } from "sonner";
import { useApp, modelName } from "@/services/store";
import { PageHeader, Panel, StatusBadge, th, td, Tag } from "@/components/common";
import { Button } from "@/components/ui/button";

export default function Endpoints() {
  const { deployments, models, environment } = useApp();
  const rows = deployments.filter((d) => d.environment === environment);
  const [probing, setProbing] = useState<string | null>(null);
  const probe = (id: string, name: string, status: string) => {
    setProbing(id);
    setTimeout(() => {
      setProbing(null);
      if (status === "running") toast.success(`Simulated probe: ${name} healthy`, { description: `GET /health 200 · ${Math.round(8 + Math.random() * 20)} ms (mock)` });
      else toast.error(`Simulated probe: ${name} unreachable`, { description: `Deployment status is "${status}".` });
    }, 900);
  };
  return (
    <div>
      <PageHeader title="Inference endpoints" description={`OpenAI-compatible endpoints exposed by deployments in ${environment}. Clients call the gateway, which routes to vLLM replicas.`} />
      <Panel title="Gateway" className="mb-4">
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <div><div className="text-xs text-muted-foreground">Base URL</div><div className="font-mono text-xs mt-1">https://ai-gateway.corp.internal/v1</div></div>
          <div><div className="text-xs text-muted-foreground">Auth</div><div className="mt-1">Bearer API key · OIDC tokens</div></div>
          <div><div className="text-xs text-muted-foreground">Routes</div><div className="mt-1 flex flex-wrap gap-1"><Tag tone="blue">/v1/chat/completions</Tag><Tag tone="blue">/v1/completions</Tag><Tag tone="blue">/v1/embeddings</Tag><Tag tone="blue">/v1/models</Tag></div></div>
        </div>
      </Panel>
      <Panel bodyClass="p-0">
        <div className="overflow-x-auto"><table className="w-full">
          <thead><tr className="border-b"><th className={th}>Served model name</th><th className={th}>Backing model</th><th className={th}>Internal URL</th><th className={th}>Status</th><th className={th} /></tr></thead>
          <tbody>{rows.map((d) => (
            <tr key={d.id} className="border-b border-border/50">
              <td className={`${td} font-mono text-[13px]`}>{d.name}</td>
              <td className={td}>{modelName(models, d.modelId)}</td>
              <td className={`${td} font-mono text-xs text-muted-foreground`}>{d.endpoint}</td>
              <td className={td}><StatusBadge status={d.status} /></td>
              <td className={`${td} text-right whitespace-nowrap`}>
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(d.endpoint); toast.success("URL copied"); }}><Copy className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" disabled={probing === d.id} onClick={() => probe(d.id, d.name, d.status)}><Zap className="mr-1 h-3.5 w-3.5" />{probing === d.id ? "Probing…" : "Test"}</Button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No endpoints in this environment.</td></tr>}</tbody>
        </table></div>
      </Panel>
    </div>
  );
}
