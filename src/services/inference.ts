/**
 * Inference service interface. The prototype ships a MOCK adapter only.
 * A real OpenAI-compatible adapter (vLLM `/v1/chat/completions`) should be implemented
 * server-side behind an authenticated gateway so no API key ever reaches the browser.
 */
export interface ChatRequest {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature: number;
  top_p: number;
  max_tokens: number;
  stream: boolean;
}
export interface ChatResult { content: string; promptTokens: number; completionTokens: number; latencyMs: number; ttftMs: number; simulated: true }
export interface InferenceAdapter {
  readonly name: string;
  chat(req: ChatRequest, onToken: (chunk: string) => void, signal?: AbortSignal): Promise<ChatResult>;
}

export const estimateTokens = (s: string) => Math.max(1, Math.ceil(s.length / 4));

function composeMock(req: ChatRequest): string {
  const q = req.messages.filter((m) => m.role === "user").pop()?.content ?? "";
  const lower = q.toLowerCase();
  const head = `> _Simulated response from the local mock adapter — no model was called. Target model: \`${req.model}\`._\n\n`;
  if (/code|python|function|typescript|bug|refactor/.test(lower)) {
    return head + "Here is an illustrative example of how this could look:\n\n```python\nimport time\n\ndef retry(fn, attempts: int = 3, backoff: float = 0.5):\n    for i in range(attempts):\n        try:\n            return fn()\n        except Exception:\n            if i == attempts - 1:\n                raise\n            time.sleep(backoff * 2 ** i)\n```\n\n**Notes**\n- Exponential backoff avoids hammering a failing dependency.\n- Consider catching only retryable exceptions.";
  }
  if (/policy|security|complian|access/.test(lower)) {
    return head + "### Summary\n\nBased on the (simulated) policy corpus:\n\n1. **Data classification** — Restricted data must not leave the security workspace.\n2. **Access** — Model access is granted per workspace and reviewed quarterly.\n3. **Audit** — All agent tool invocations are logged.\n\n| Control | Owner | Status |\n|---|---|---|\n| MFA enforcement | IAM | Enabled |\n| Egress deny | Platform | Enabled |";
  }
  return head + `You asked: **"${q.slice(0, 120)}"**\n\nIn a connected deployment this request would be sent to an OpenAI-compatible vLLM endpoint with temperature \`${req.temperature}\`, top_p \`${req.top_p}\` and max_tokens \`${req.max_tokens}\`.\n\n- The mock adapter echoes structure, not intelligence.\n- Switch the inference mode in **Settings → API connection** once a gateway is available.`;
}

export const mockAdapter: InferenceAdapter = {
  name: "mock",
  async chat(req, onToken, signal) {
    const started = performance.now();
    if (req.messages.some((m) => m.role === "user" && m.content.trim().toLowerCase() === "/error")) {
      await new Promise((r) => setTimeout(r, 600));
      throw new Error("Simulated 503: upstream vLLM replica unavailable (triggered by /error)");
    }
    const full = composeMock(req);
    const ttft = 150 + Math.random() * 200;
    await new Promise((r) => setTimeout(r, ttft));
    const words = full.split(/(\s+)/);
    if (req.stream) {
      for (let i = 0; i < words.length; i += 3) {
        if (signal?.aborted) break;
        onToken(words.slice(i, i + 3).join(""));
        await new Promise((r) => setTimeout(r, 18));
      }
    } else onToken(full);
    return {
      content: full,
      promptTokens: req.messages.reduce((a, m) => a + estimateTokens(m.content), 0),
      completionTokens: estimateTokens(full),
      latencyMs: Math.round(performance.now() - started),
      ttftMs: Math.round(ttft),
      simulated: true,
    };
  },
};

export const getInferenceAdapter = (): InferenceAdapter => mockAdapter;
