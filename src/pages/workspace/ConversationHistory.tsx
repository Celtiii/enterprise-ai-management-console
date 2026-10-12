import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ExternalLink } from "lucide-react";
import { useApp, modelName } from "@/services/store";
import { PageHeader, Panel, SearchInput, EmptyState, useConfirm, th, td, Pager, usePaged } from "@/components/common";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";

export default function ConversationHistory() {
  const { conversations, models, remove } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [model, setModel] = useState("all");
  const { ask, node } = useConfirm();
  const rows = useMemo(() => conversations
    .filter((c) => (model === "all" || c.modelId === model) && (c.title + c.messages.map((m) => m.content).join(" ")).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [conversations, q, model]);
  const p = usePaged(rows, 10);
  return (
    <div>
      {node}
      <PageHeader title="Conversation history" description="Chat sessions stored locally in this browser for the prototype." simulated={false} />
      <Panel bodyClass="p-0">
        <div className="flex flex-wrap gap-2 border-b p-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search titles and messages…" className="w-72" />
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-8 w-48 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All models</SelectItem>{models.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {rows.length === 0 ? <EmptyState title="No conversations found" body="Try a different search or start a new chat." action={<Button size="sm" onClick={() => nav("/workspace/chat")}>Open Chat Playground</Button>} /> : (
          <table className="w-full">
            <thead><tr className="border-b"><th className={th}>Title</th><th className={th}>Model</th><th className={th}>Messages</th><th className={th}>Updated</th><th className={th} /></tr></thead>
            <tbody>{p.slice.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-accent/30 cursor-pointer" onClick={() => nav(`/workspace/chat?c=${c.id}`)}>
                <td className={td}>{c.title}</td>
                <td className={td}>{modelName(models, c.modelId)}</td>
                <td className={`${td} tabular-nums`}>{c.messages.length}</td>
                <td className={`${td} text-muted-foreground`}>{timeAgo(c.updatedAt)}</td>
                <td className={`${td} text-right`} onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => nav(`/workspace/chat?c=${c.id}`)} aria-label="Open"><ExternalLink className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-300" aria-label="Delete" onClick={() => ask("Delete conversation?", `"${c.title}" will be removed.`, () => { remove("conversations", c.id); toast.success("Conversation deleted"); })}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
        <div className="px-3 pb-3"><Pager {...p} onPage={p.setPage} /></div>
      </Panel>
    </div>
  );
}
