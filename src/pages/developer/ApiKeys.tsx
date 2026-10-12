import { useState } from "react";
import { Plus, Ban, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid } from "@/services/store";
import type { ApiKey } from "@/types";
import { PageHeader, Panel, StatusBadge, Tag, useConfirm, th, td } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { timeAgo } from "@/lib/format";

const scopes = ["chat:invoke", "embeddings:invoke", "agents:invoke", "retrieval:query", "models:read", "admin"];

export default function ApiKeys() {
  const { apiKeys, add, update, audit_ } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [sel, setSel] = useState<string[]>(["chat:invoke"]); const [days, setDays] = useState("90");
  const [created, setCreated] = useState<string | null>(null);
  const { ask, node } = useConfirm();
  const create = () => {
    if (!name.trim() || !sel.length) { toast.error("Name and at least one scope required"); return; }
    const prefix = `sk-demo-${Math.random().toString(36).slice(2, 6)}`;
    const k: ApiKey = { id: uid("key"), name, prefix, scopes: sel, createdAt: new Date().toISOString(), lastUsed: "", owner: "ali.moradi", status: "active", expiresAt: new Date(Date.now() + Number(days) * 864e5).toISOString() };
    add("apiKeys", k); audit_("apikey.create", `apikey/${name}`); setCreated(`${prefix}••••••••••••••••  (placeholder — not a real credential)`); setOpen(false); setName("");
  };
  return (
    <div>
      {node}
      <PageHeader title="API keys" description="Key inventory with masked placeholder values. No real credentials are generated or stored." actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Create key</Button>} />
      {created && <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm"><ShieldAlert className="h-5 w-5 text-amber-300" /><div className="flex-1"><p className="font-medium text-amber-100">Key created (simulated)</p><p className="font-mono text-xs mt-1">{created}</p><p className="mt-1 text-xs text-muted-foreground">In production the secret would be shown once and stored only as a hash on the server.</p></div><Button size="sm" variant="ghost" onClick={() => setCreated(null)}>Dismiss</Button></div>}
      <Panel bodyClass="p-0"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b"><th className={th}>Name</th><th className={th}>Key</th><th className={th}>Scopes</th><th className={th}>Owner</th><th className={th}>Last used</th><th className={th}>Expires</th><th className={th}>Status</th><th className={th} /></tr></thead>
        <tbody>{apiKeys.map((k) => (
          <tr key={k.id} className="border-b border-border/50">
            <td className={`${td} font-medium`}>{k.name}</td><td className={`${td} font-mono text-xs text-muted-foreground`}>{k.prefix}••••••••</td>
            <td className={td}><div className="flex flex-wrap gap-1">{k.scopes.map((s) => <Tag key={s} tone={s === "admin" ? "red" : "blue"}>{s}</Tag>)}</div></td>
            <td className={`${td} text-xs`}>{k.owner}</td><td className={`${td} text-xs text-muted-foreground`}>{k.lastUsed ? timeAgo(k.lastUsed) : "never"}</td>
            <td className={`${td} text-xs text-muted-foreground`}>{new Date(k.expiresAt).toLocaleDateString()}</td><td className={td}><StatusBadge status={k.status} /></td>
            <td className={`${td} text-right`}>{k.status === "active" && <Button size="sm" variant="ghost" className="text-red-300" onClick={() => ask("Revoke API key?", `Clients using "${k.name}" will receive 401 responses (simulated).`, () => { update("apiKeys", k.id, { status: "revoked" }); audit_("apikey.revoke", `apikey/${k.name}`); toast.success("Key revoked"); }, "Revoke")}><Ban className="mr-1 h-3.5 w-3.5" />Revoke</Button>}</td>
          </tr>))}</tbody>
      </table></div></Panel>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent>
        <DialogHeader><DialogTitle>Create API key</DialogTitle><DialogDescription>Generates a placeholder key for the prototype.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ci-pipeline" /></div>
          <div><Label className="text-xs">Scopes</Label><div className="mt-2 grid grid-cols-2 gap-2">{scopes.map((s) => <label key={s} className="flex items-center gap-2 text-sm"><Checkbox checked={sel.includes(s)} onCheckedChange={() => setSel(sel.includes(s) ? sel.filter((x) => x !== s) : [...sel, s])} /><span className="font-mono text-xs">{s}</span></label>)}</div></div>
          <div className="space-y-1"><Label className="text-xs">Expires in</Label><Select value={days} onValueChange={setDays}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["30", "90", "180", "365"].map((d) => <SelectItem key={d} value={d}>{d} days</SelectItem>)}</SelectContent></Select></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
