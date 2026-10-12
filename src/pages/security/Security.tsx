import { useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid } from "@/services/store";
import type { AccessPolicy, RoleName, User } from "@/types";
import { PageHeader, Panel, StatusBadge, Tag, SearchInput, useConfirm, th, td, Pager, usePaged } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { timeAgo, fmtTime } from "@/lib/format";

const ROLES: RoleName[] = ["Administrator", "Platform Engineer", "AI Developer", "Security Analyst", "Read-Only Auditor"];
const PERMS = ["Manage users & roles", "Edit access policies", "Register / deploy models", "Create & edit agents", "Run workflows", "Manage knowledge bases", "Create API keys", "View audit logs", "View metrics & traces", "Access Restricted data"];
const MATRIX: Record<RoleName, boolean[]> = {
  Administrator: [true, true, true, true, true, true, true, true, true, true],
  "Platform Engineer": [false, false, true, true, true, true, true, false, true, false],
  "AI Developer": [false, false, false, true, true, true, true, false, true, false],
  "Security Analyst": [false, true, false, false, true, false, false, true, true, true],
  "Read-Only Auditor": [false, false, false, false, false, false, false, true, true, false],
};
const WORKSPACES = ["Platform", "Security", "Engineering", "Finance", "HR"];

export function UsersRoles() {
  const { users, add, update, remove, audit_ } = useApp();
  const [q, setQ] = useState(""); const [role, setRole] = useState("all");
  const [open, setOpen] = useState(false); const [f, setF] = useState({ name: "", email: "", role: "AI Developer" as RoleName, ws: ["Engineering"] });
  const { ask, node } = useConfirm();
  const rows = users.filter((u) => (role === "all" || u.role === role) && (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  const invite = () => {
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) { toast.error("Valid name and email required"); return; }
    const u: User = { id: uid("u"), name: f.name, email: f.email, role: f.role, workspaces: f.ws, status: "invited", lastActive: new Date().toISOString(), mfa: false };
    add("users", u); audit_("user.invite", `user/${f.email}`); toast.success("Invitation recorded (simulated — no email sent)"); setOpen(false); setF({ ...f, name: "", email: "" });
  };
  return (
    <div>
      {node}
      <PageHeader title="Users & roles" description="Role-based access configuration. In production identities come from your IdP (OIDC / LDAP); this prototype does not enforce permissions." actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Invite user</Button>} />
      <Tabs defaultValue="users">
        <TabsList className="mb-3"><TabsTrigger value="users">Users</TabsTrigger><TabsTrigger value="matrix">Permission matrix</TabsTrigger><TabsTrigger value="ws">Workspaces</TabsTrigger></TabsList>
        <TabsContent value="users"><Panel bodyClass="p-0">
          <div className="flex flex-wrap gap-2 border-b p-3"><SearchInput value={q} onChange={setQ} className="w-64" />
            <Select value={role} onValueChange={setRole}><SelectTrigger className="h-8 w-48 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className={th}>User</th><th className={th}>Role</th><th className={th}>Workspaces</th><th className={th}>MFA</th><th className={th}>Last active</th><th className={th}>Status</th><th className={th} /></tr></thead>
            <tbody>{rows.map((u) => <tr key={u.id} className="border-b border-border/50">
              <td className={td}><div className="font-medium">{u.name}</div><div className="text-[11px] text-muted-foreground">{u.email}</div></td>
              <td className={td}><Select value={u.role} onValueChange={(v) => { update("users", u.id, { role: v as RoleName }); audit_("user.role_change", `user/${u.email}`); toast.success(`${u.name} → ${v}`); }}><SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></td>
              <td className={td}><div className="flex flex-wrap gap-1">{u.workspaces.map((w) => <Tag key={w}>{w}</Tag>)}</div></td>
              <td className={td}>{u.mfa ? <Tag tone="green">on</Tag> : <Tag tone="amber">off</Tag>}</td>
              <td className={`${td} text-xs text-muted-foreground`}>{timeAgo(u.lastActive)}</td><td className={td}><StatusBadge status={u.status} /></td>
              <td className={`${td} text-right whitespace-nowrap`}>
                <Button size="sm" variant="ghost" onClick={() => { const s = u.status === "suspended" ? "active" : "suspended"; update("users", u.id, { status: s }); audit_(`user.${s === "active" ? "reactivate" : "suspend"}`, `user/${u.email}`); }}>{u.status === "suspended" ? "Reactivate" : "Suspend"}</Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-300" aria-label="Remove user" onClick={() => ask("Remove user?", `${u.name} will lose access to all workspaces.`, () => { remove("users", u.id); audit_("user.delete", `user/${u.email}`); })}><Trash2 className="h-3.5 w-3.5" /></Button></td>
            </tr>)}</tbody></table></div>
        </Panel></TabsContent>
        <TabsContent value="matrix"><Panel bodyClass="p-0"><div className="overflow-x-auto"><table className="w-full">
          <thead><tr className="border-b"><th className={th}>Permission</th>{ROLES.map((r) => <th key={r} className={`${th} text-center`}>{r}</th>)}</tr></thead>
          <tbody>{PERMS.map((p, i) => <tr key={p} className="border-b border-border/50"><td className={td}>{p}</td>{ROLES.map((r) => <td key={r} className={`${td} text-center`}>{MATRIX[r][i] ? <span className="text-emerald-400">●</span> : <span className="text-muted-foreground/40">○</span>}</td>)}</tr>)}</tbody>
        </table></div></Panel></TabsContent>
        <TabsContent value="ws"><div className="grid gap-3 md:grid-cols-3">{WORKSPACES.map((w) => { const m = users.filter((u) => u.workspaces.includes(w)); return (
          <Panel key={w} title={w} actions={<Tag>{m.length} members</Tag>}>{m.length ? m.map((u) => <div key={u.id} className="flex justify-between py-1 text-sm"><span>{u.name}</span><span className="text-xs text-muted-foreground">{u.role}</span></div>) : <p className="text-sm text-muted-foreground">No members.</p>}</Panel>); })}</div></TabsContent>
      </Tabs>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent>
        <DialogHeader><DialogTitle>Invite user</DialogTitle><DialogDescription>Adds a pending user record. No email is sent in the prototype.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Full name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@corp.internal" /></div>
          <div className="space-y-1"><Label className="text-xs">Role</Label><Select value={f.role} onValueChange={(v) => setF({ ...f, role: v as RoleName })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-xs">Workspaces</Label><div className="mt-2 flex flex-wrap gap-3">{WORKSPACES.map((w) => <label key={w} className="flex items-center gap-1.5 text-sm"><Checkbox checked={f.ws.includes(w)} onCheckedChange={() => setF({ ...f, ws: f.ws.includes(w) ? f.ws.filter((x) => x !== w) : [...f.ws, w] })} />{w}</label>)}</div></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={invite}>Invite</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}

const PTYPES: AccessPolicy["type"][] = ["Model Access", "Agent Tool", "Data", "Network", "Session"];
export function Policies() {
  const { policies, add, update, remove, audit_ } = useApp();
  const [type, setType] = useState("all"); const [open, setOpen] = useState(false);
  const [f, setF] = useState<Omit<AccessPolicy, "id" | "updatedAt" | "enabled">>({ name: "", type: "Model Access", subject: "", resource: "", effect: "allow" });
  const { ask, node } = useConfirm();
  const rows = policies.filter((p) => type === "all" || p.type === type);
  const save = () => { if (!f.name || !f.subject || !f.resource) { toast.error("All fields are required"); return; } add("policies", { ...f, id: uid("p"), enabled: true, updatedAt: new Date().toISOString() }); audit_("policy.create", `policy/${f.name}`); toast.success("Policy saved (not enforced in prototype)"); setOpen(false); setF({ ...f, name: "", subject: "", resource: "" }); };
  return (
    <div>
      {node}
      <PageHeader title="Access policies" description="Model access, agent tool permissions, data, network and session policies. Configuration only — the frontend does not enforce them." actions={<>
        <Select value={type} onValueChange={setType}><SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{PTYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />New policy</Button></>} />
      <Panel bodyClass="p-0"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b"><th className={th}>Policy</th><th className={th}>Type</th><th className={th}>Subject</th><th className={th}>Resource</th><th className={th}>Effect</th><th className={th}>Enabled</th><th className={th} /></tr></thead>
        <tbody>{rows.map((p) => <tr key={p.id} className="border-b border-border/50">
          <td className={td}><div className="font-medium">{p.name}</div><div className="text-[11px] text-muted-foreground">updated {timeAgo(p.updatedAt)}</div></td>
          <td className={td}><Tag tone="violet">{p.type}</Tag></td><td className={`${td} font-mono text-xs`}>{p.subject}</td><td className={`${td} font-mono text-xs`}>{p.resource}</td>
          <td className={td}><Tag tone={p.effect === "allow" ? "green" : p.effect === "deny" ? "red" : "amber"}>{p.effect}</Tag></td>
          <td className={td}><Switch checked={p.enabled} onCheckedChange={(v) => { update("policies", p.id, { enabled: v, updatedAt: new Date().toISOString() }); audit_("policy.update", `policy/${p.name}`); }} /></td>
          <td className={`${td} text-right`}><Button size="icon" variant="ghost" className="h-7 w-7 text-red-300" aria-label="Delete policy" onClick={() => ask("Delete policy?", p.name, () => { remove("policies", p.id); audit_("policy.delete", `policy/${p.name}`); })}><Trash2 className="h-3.5 w-3.5" /></Button></td>
        </tr>)}</tbody></table></div></Panel>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent>
        <DialogHeader><DialogTitle>New access policy</DialogTitle><DialogDescription>Subjects/resources use prefixes like role:, workspace:, agent:, model:, tool:.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1"><Label className="text-xs">Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Type</Label><Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as AccessPolicy["type"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PTYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Effect</Label><Select value={f.effect} onValueChange={(v) => setF({ ...f, effect: v as AccessPolicy["effect"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="allow">allow</SelectItem><SelectItem value="deny">deny</SelectItem><SelectItem value="require-approval">require-approval</SelectItem></SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Subject</Label><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="role:AI Developer" className="font-mono text-xs" /></div>
          <div className="space-y-1"><Label className="text-xs">Resource</Label><Input value={f.resource} onChange={(e) => setF({ ...f, resource: e.target.value })} placeholder="model:qwen3-8b" className="font-mono text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}

export function AuditLogs() {
  const { audit, environment } = useApp();
  const [q, setQ] = useState(""); const [result, setResult] = useState("all"); const [scope, setScope] = useState<"env" | "all">("all");
  const rows = audit.filter((a) => (scope === "all" || a.environment === environment) && (result === "all" || a.result === result) && (a.actor + a.action + a.resource).toLowerCase().includes(q.toLowerCase()));
  const p = usePaged(rows, 15);
  const exportCsv = () => {
    const csv = ["time,actor,action,resource,result,ip,environment", ...rows.map((a) => [a.time, a.actor, a.action, a.resource, a.result, a.ip, a.environment].map((v) => `"${v}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const el = document.createElement("a"); el.href = url; el.download = "audit-log.csv"; el.click(); URL.revokeObjectURL(url);
  };
  return (
    <div>
      <PageHeader title="Audit logs" description="Every action taken in this console is recorded here locally, alongside seeded sample events." actions={<Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" />Export CSV</Button>} />
      <Panel bodyClass="p-0">
        <div className="flex flex-wrap gap-2 border-b p-3"><SearchInput value={q} onChange={setQ} placeholder="Actor, action, resource…" className="w-72" />
          <Select value={result} onValueChange={setResult}><SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All results</SelectItem>{["success", "denied", "failure"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
          <Select value={scope} onValueChange={(v) => setScope(v as "env" | "all")}><SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All environments</SelectItem><SelectItem value="env">Env: {environment}</SelectItem></SelectContent></Select></div>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className={th}>Time</th><th className={th}>Actor</th><th className={th}>Action</th><th className={th}>Resource</th><th className={th}>Result</th><th className={th}>Source IP</th><th className={th}>Env</th></tr></thead>
          <tbody>{p.slice.map((a) => <tr key={a.id} className="border-b border-border/50">
            <td className={`${td} text-xs text-muted-foreground whitespace-nowrap`}>{fmtTime(a.time)}</td><td className={`${td} text-xs`}>{a.actor}</td><td className={`${td} font-mono text-xs`}>{a.action}</td>
            <td className={`${td} font-mono text-xs`}>{a.resource}</td><td className={td}><Tag tone={a.result === "success" ? "green" : a.result === "denied" ? "amber" : "red"}>{a.result}</Tag></td>
            <td className={`${td} font-mono text-xs text-muted-foreground`}>{a.ip}</td><td className={`${td} text-xs capitalize`}>{a.environment}</td></tr>)}</tbody></table></div>
        <div className="px-3 pb-3"><Pager {...p} onPage={p.setPage} /></div>
      </Panel>
    </div>
  );
}

export function DataProtection() {
  const { audit_ } = useApp();
  const [cfg, setCfg] = useState({ piiRedaction: true, secretScan: true, promptLogging: false, encryptAtRest: true, retention: "365", sessionTimeout: "30", mfaRequired: true, sso: "OIDC (Keycloak)", maxSession: "12" });
  const [detectors, setDetectors] = useState({ Email: true, "Phone number": true, "National ID": true, "IBAN / card number": true, "API keys / tokens": true, "Personal names": false });
  const labels = [{ n: "Public", d: "Approved for external release", t: "gray" }, { n: "Internal", d: "Default for employee content", t: "blue" }, { n: "Confidential", d: "Need-to-know; logged access", t: "amber" }, { n: "Restricted", d: "Security / legal only; no external models", t: "red" }] as const;
  const set = <K extends keyof typeof cfg>(k: K, v: (typeof cfg)[K]) => setCfg({ ...cfg, [k]: v });
  return (
    <div className="space-y-4">
      <PageHeader title="Data protection" description="Sensitive-data handling, classification and authentication settings. Saved as configuration only; nothing is enforced by this prototype." actions={<Button size="sm" onClick={() => { audit_("dataprotection.update", "settings/data-protection"); toast.success("Configuration saved (not enforced)"); }}>Save changes</Button>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Data classification labels">{labels.map((l) => <div key={l.n} className="flex items-center gap-3 border-b border-border/50 py-2 last:border-0"><Tag tone={l.t}>{l.n}</Tag><span className="text-sm text-muted-foreground">{l.d}</span></div>)}</Panel>
        <Panel title="Sensitive-data protection"><div className="space-y-3">
          {([["piiRedaction", "Redact PII in prompts and responses"], ["secretScan", "Block secrets in model input"], ["promptLogging", "Store full prompt text in logs"], ["encryptAtRest", "Encrypt conversations at rest"]] as const).map(([k, l]) => <label key={k} className="flex items-center justify-between text-sm">{l}<Switch checked={cfg[k]} onCheckedChange={(v) => set(k, v)} /></label>)}
          <div className="pt-2"><p className="mb-2 text-xs text-muted-foreground">PII detectors</p><div className="grid grid-cols-2 gap-2">{Object.entries(detectors).map(([k, v]) => <label key={k} className="flex items-center gap-2 text-sm"><Checkbox checked={v} onCheckedChange={(c) => setDetectors({ ...detectors, [k]: !!c })} />{k}</label>)}</div></div>
        </div></Panel>
        <Panel title="Session & authentication"><div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Identity provider</Label><Select value={cfg.sso} onValueChange={(v) => set("sso", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["OIDC (Keycloak)", "SAML 2.0 (ADFS)", "LDAP", "Local accounts"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Idle timeout (min)</Label><Input type="number" value={cfg.sessionTimeout} onChange={(e) => set("sessionTimeout", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Max session (hours)</Label><Input type="number" value={cfg.maxSession} onChange={(e) => set("maxSession", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Retention (days)</Label><Input type="number" value={cfg.retention} onChange={(e) => set("retention", e.target.value)} /></div>
          <label className="col-span-2 flex items-center justify-between text-sm">Require MFA for all users<Switch checked={cfg.mfaRequired} onCheckedChange={(v) => set("mfaRequired", v)} /></label>
        </div></Panel>
        <Panel title="Model access by classification" bodyClass="p-0"><table className="w-full"><thead><tr className="border-b"><th className={th}>Classification</th><th className={th}>Allowed models</th><th className={th}>Agent tools</th></tr></thead>
          <tbody>{[["Public", "All", "All"], ["Internal", "All self-hosted", "All approved"], ["Confidential", "Qwen3-8B, Qwen3-Coder", "Read-only tools"], ["Restricted", "Qwen3-8B (prod only)", "Requires approval"]].map(([a, b, c]) => <tr key={a} className="border-b border-border/50"><td className={td}>{a}</td><td className={`${td} text-xs`}>{b}</td><td className={`${td} text-xs`}>{c}</td></tr>)}</tbody></table></Panel>
      </div>
    </div>
  );
}
