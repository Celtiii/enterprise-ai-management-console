import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Send, Copy, Trash2, Square, Bot, User, AlertCircle, Settings2, FlaskConical, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useApp, uid, modelName } from "@/services/store";
import { getInferenceAdapter, estimateTokens } from "@/services/inference";
import type { ChatMessage, Conversation } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/Markdown";
import { KV, SimBadge, useConfirm } from "@/components/common";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export default function ChatPlayground() {
  const { conversations, models, settings, add, update, remove } = useApp();
  const [params, setParams] = useSearchParams();
  const chatModels = models.filter((m) => !m.tags.includes("embedding") && m.status !== "deprecated");
  const [activeId, setActiveId] = useState<string>(params.get("c") ?? conversations[0]?.id ?? "");
  const conv = conversations.find((c) => c.id === activeId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [temperature, setTemperature] = useState(settings.temperature);
  const [topP, setTopP] = useState(settings.topP);
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens);
  const [stream, setStream] = useState(settings.streaming);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { ask, node } = useConfirm();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv?.messages.length, streamText]);
  useEffect(() => { if (activeId) setParams({ c: activeId }, { replace: true }); }, [activeId, setParams]);

  const newConversation = () => {
    const c: Conversation = { id: uid("c"), title: "New conversation", modelId: settings.defaultModelId, systemPrompt: "You are a helpful enterprise assistant. Answer concisely and cite sources when available.", messages: [], updatedAt: new Date().toISOString() };
    add("conversations", c);
    setActiveId(c.id);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    let c = conv;
    if (!c) {
      c = { id: uid("c"), title: text.slice(0, 48), modelId: settings.defaultModelId, systemPrompt: "You are a helpful enterprise assistant.", messages: [], updatedAt: new Date().toISOString() };
      add("conversations", c);
      setActiveId(c.id);
    }
    const userMsg: ChatMessage = { id: uid("m"), role: "user", content: text, createdAt: new Date().toISOString() };
    const msgs = [...c.messages, userMsg];
    const cid = c.id;
    update("conversations", cid, { messages: msgs, title: c.messages.length === 0 ? text.slice(0, 48) : c.title, updatedAt: userMsg.createdAt });
    setInput("");
    setBusy(true);
    setStreamText("");
    abortRef.current = new AbortController();
    let acc = "";
    try {
      const res = await getInferenceAdapter().chat(
        { model: c.modelId, temperature, top_p: topP, max_tokens: maxTokens, stream, messages: [{ role: "system", content: c.systemPrompt }, ...msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))] },
        (chunk) => { acc += chunk; setStreamText(acc); },
        abortRef.current.signal,
      );
      const aborted = abortRef.current.signal.aborted;
      const asst: ChatMessage = { id: uid("m"), role: "assistant", content: aborted ? acc + "\n\n_[generation stopped]_" : res.content, createdAt: new Date().toISOString(), meta: { model: c.modelId, promptTokens: res.promptTokens, completionTokens: estimateTokens(acc || res.content), latencyMs: res.latencyMs, ttftMs: res.ttftMs, simulated: true } };
      update("conversations", cid, { messages: [...msgs, asst], updatedAt: asst.createdAt });
    } catch (e) {
      const err: ChatMessage = { id: uid("m"), role: "assistant", content: "", createdAt: new Date().toISOString(), meta: { model: c.modelId, promptTokens: 0, completionTokens: 0, latencyMs: 0, ttftMs: 0, simulated: true, error: (e as Error).message } };
      update("conversations", cid, { messages: [...msgs, err] });
      toast.error("Request failed", { description: (e as Error).message });
    } finally {
      setBusy(false);
      setStreamText("");
    }
  };

  const lastMeta = [...(conv?.messages ?? [])].reverse().find((m) => m.meta)?.meta;
  const promptPreview = conv ? estimateTokens(conv.systemPrompt) + conv.messages.reduce((a, m) => a + estimateTokens(m.content), 0) + estimateTokens(input) : 0;

  return (
    <div className="-m-4 lg:-m-6 flex h-[calc(100vh-4.6rem)]">
      {node}
      {/* Conversations */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r">
        <div className="p-3 border-b"><Button className="w-full" size="sm" onClick={newConversation}><Plus className="mr-1.5 h-4 w-4" /> New conversation</Button></div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {[...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)} className={cn("group w-full rounded-md px-2.5 py-2 text-left", c.id === activeId ? "bg-accent" : "hover:bg-accent/50")}>
              <div className="truncate text-sm">{c.title}</div>
              <div className="text-[11px] text-muted-foreground">{modelName(models, c.modelId)} · {timeAgo(c.updatedAt)}</div>
            </button>
          ))}
          {conversations.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">No conversations yet.</p>}
        </div>
      </aside>

      {/* Chat */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <Select value={conv?.modelId ?? settings.defaultModelId} onValueChange={(v) => conv && update("conversations", conv.id, { modelId: v })} disabled={!conv}>
            <SelectTrigger className="h-8 w-[230px] text-sm" aria-label="Model"><SelectValue /></SelectTrigger>
            <SelectContent>{chatModels.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} <span className="text-muted-foreground text-xs">· {m.params}</span></SelectItem>)}</SelectContent>
          </Select>
          <SimBadge label="Mock inference" />
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={newConversation}><Plus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" disabled={!conv || conv.messages.length === 0} onClick={() => conv && ask("Clear conversation?", "All messages in this conversation will be removed.", () => update("conversations", conv.id, { messages: [] }), "Clear")}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
            {(!conv || conv.messages.length === 0) && !busy && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border bg-muted/40"><MessageSquare className="h-5 w-5 text-primary" /></div>
                <p className="font-medium">Start a conversation</p>
                <p className="mt-1 text-sm text-muted-foreground">Responses come from a local mock adapter — no model is called. Type <code className="text-cyan-300">/error</code> to preview the error state.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["Summarise our data classification policy", "Write a Python retry helper with backoff", "What vLLM settings fit an 8B model on one H100?"].map((s) => (
                    <button key={s} onClick={() => setInput(s)} className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {conv?.messages.map((m) => <MessageRow key={m.id} m={m} />)}
            {busy && (
              <div className="flex gap-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-500/15"><Bot className="h-4 w-4 text-violet-300" /></div>
                <div className="min-w-0 flex-1">
                  {streamText ? <Markdown text={streamText} /> : <div className="flex gap-1 pt-2">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground pulse-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}</div>}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t p-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-lg border bg-card p-2 focus-within:ring-1 focus-within:ring-ring">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message the model… (Enter to send, Shift+Enter for new line)"
                className="min-h-[44px] max-h-48 resize-none border-0 bg-transparent p-1.5 shadow-none focus-visible:ring-0"
                aria-label="Message"
              />
              {busy ? (
                <Button size="icon" variant="secondary" onClick={() => abortRef.current?.abort()} aria-label="Stop"><Square className="h-4 w-4" /></Button>
              ) : (
                <Button size="icon" onClick={send} disabled={!input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
              )}
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>≈{promptPreview} prompt tokens (estimated)</span>
              <span>Mock adapter · OpenAI-compatible request shape</span>
            </div>
          </div>
        </div>
      </section>

      {/* Settings */}
      <aside className="hidden xl:flex w-80 shrink-0 flex-col border-l overflow-y-auto">
        <Tabs defaultValue="params" className="flex-1">
          <TabsList className="m-3 grid grid-cols-2"><TabsTrigger value="params"><Settings2 className="mr-1.5 h-3.5 w-3.5" />Parameters</TabsTrigger><TabsTrigger value="details">Request</TabsTrigger></TabsList>
          <TabsContent value="params" className="px-4 pb-4 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs">System prompt</Label>
              <Textarea value={conv?.systemPrompt ?? ""} disabled={!conv} onChange={(e) => conv && update("conversations", conv.id, { systemPrompt: e.target.value })} className="min-h-[110px] text-xs" />
            </div>
            <ParamSlider label="Temperature" value={temperature} min={0} max={2} step={0.05} onChange={setTemperature} />
            <ParamSlider label="Top-p" value={topP} min={0} max={1} step={0.01} onChange={setTopP} />
            <div className="space-y-1.5">
              <Label className="text-xs">Max tokens</Label>
              <Input type="number" min={1} max={32768} value={maxTokens} onChange={(e) => setMaxTokens(Math.max(1, Number(e.target.value)))} className="h-8" />
            </div>
            <div className="flex items-center justify-between"><Label className="text-xs">Stream response</Label><Switch checked={stream} onCheckedChange={setStream} /></div>
          </TabsContent>
          <TabsContent value="details" className="px-4 pb-4">
            <div className="mb-3 flex items-center gap-1.5 text-xs text-violet-300"><FlaskConical className="h-3.5 w-3.5" /> Values below are simulated</div>
            {lastMeta ? (
              <div>
                <KV k="Model" v={modelName(models, lastMeta.model)} />
                <KV k="Endpoint" v="POST /v1/chat/completions" mono />
                <KV k="Adapter" v="mock (local)" />
                <KV k="Prompt tokens" v={lastMeta.promptTokens} />
                <KV k="Completion tokens" v={lastMeta.completionTokens} />
                <KV k="Time to first token" v={`${lastMeta.ttftMs} ms`} />
                <KV k="Total latency" v={`${lastMeta.latencyMs} ms`} />
                <KV k="Status" v={lastMeta.error ? <span className="text-red-400">error</span> : <span className="text-emerald-400">ok</span>} />
                <pre className="mt-3 rounded-md border bg-muted/30 p-2 text-[11px] overflow-x-auto">{JSON.stringify({ model: lastMeta.model, temperature, top_p: topP, max_tokens: maxTokens, stream }, null, 2)}</pre>
              </div>
            ) : <p className="text-xs text-muted-foreground">Send a message to see request details.</p>}
            {conv && <Button variant="outline" size="sm" className="mt-4 w-full text-red-300" onClick={() => ask("Delete conversation?", `"${conv.title}" will be permanently removed.`, () => { remove("conversations", conv.id); setActiveId(conversations.find((c) => c.id !== conv.id)?.id ?? ""); })}>Delete conversation</Button>}
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}

function ParamSlider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs"><Label className="text-xs">{label}</Label><span className="tabular-nums text-muted-foreground">{value.toFixed(2)}</span></div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </div>
  );
}

function MessageRow({ m }: { m: ChatMessage }) {
  const isUser = m.role === "user";
  return (
    <div className="group flex gap-3">
      <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md", isUser ? "bg-sky-500/15" : "bg-violet-500/15")}>
        {isUser ? <User className="h-4 w-4 text-sky-300" /> : <Bot className="h-4 w-4 text-violet-300" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-xs font-medium text-muted-foreground">{isUser ? "You" : "Assistant"}</div>
        {m.meta?.error ? (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{m.meta.error}</div>
        ) : isUser ? <p className="whitespace-pre-wrap text-sm">{m.content}</p> : <Markdown text={m.content} />}
        {!isUser && m.meta && !m.meta.error && (
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{m.meta.completionTokens} tokens</span><span>{m.meta.latencyMs} ms</span><span className="text-violet-300/80">simulated</span>
            <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 hover:text-foreground" onClick={() => { navigator.clipboard?.writeText(m.content); toast.success("Copied to clipboard"); }}><Copy className="h-3 w-3" /> Copy</button>
          </div>
        )}
      </div>
    </div>
  );
}
