import type { Environment } from "@/types";
import { seeded } from "./metrics";

export interface TraceRow { id: string; time: string; model: string; endpoint: string; status: number; latencyMs: number; promptTokens: number; completionTokens: number; user: string; environment: Environment; spans: { name: string; start: number; dur: number }[] }
export interface LogRow { id: string; time: string; level: "INFO" | "WARN" | "ERROR" | "DEBUG"; service: string; message: string; environment: Environment }

const models = ["qwen3-8b", "qwen3-coder-30b", "qwen3-0.6b", "bge-m3"];
const users = ["portal-backend", "ci-review-bot", "soc-automation", "ali.moradi", "priya.nair", "hr-portal"];
const envs: Environment[] = ["production", "staging", "development"];

export function generateTraces(n = 120): TraceRow[] {
  const r = seeded(77);
  return Array.from({ length: n }, (_, i) => {
    const model = models[Math.floor(r() * models.length)];
    const err = r() < 0.06;
    const lat = Math.round(model === "bge-m3" ? 20 + r() * 60 : 300 + r() * (model.includes("coder") ? 4000 : 2200));
    const queue = Math.round(r() * 40);
    const prefill = Math.round(lat * 0.15);
    return {
      id: `tr-${(0x9a00 + i).toString(16)}${Math.floor(r() * 9999)}`,
      time: new Date(Date.now() - i * 47_000 - Math.floor(r() * 30_000)).toISOString(),
      model,
      endpoint: model === "bge-m3" ? "/v1/embeddings" : "/v1/chat/completions",
      status: err ? (r() < 0.5 ? 503 : 429) : 200,
      latencyMs: lat,
      promptTokens: Math.round(50 + r() * 3000),
      completionTokens: model === "bge-m3" ? 0 : Math.round(20 + r() * 800),
      user: users[Math.floor(r() * users.length)],
      environment: envs[i % 5 === 0 ? 1 : i % 7 === 0 ? 2 : 0],
      spans: [
        { name: "gateway.auth", start: 0, dur: 6 },
        { name: "router.select_replica", start: 6, dur: 3 },
        { name: "vllm.queue", start: 9, dur: queue },
        { name: "vllm.prefill", start: 9 + queue, dur: prefill },
        { name: "vllm.decode", start: 9 + queue + prefill, dur: Math.max(5, lat - 9 - queue - prefill) },
      ],
    };
  });
}

const logTemplates: [LogRow["level"], string, string][] = [
  ["INFO", "vllm-qwen3-8b", "Avg prompt throughput: 1843.2 tokens/s, Avg generation throughput: 612.4 tokens/s, Running: 41 reqs"],
  ["INFO", "api-gateway", "POST /v1/chat/completions 200 key=sk-ent-4f2a**** 812ms"],
  ["WARN", "mcp-gateway", "siem-server call siem.search exceeded 2000ms (4211ms)"],
  ["ERROR", "vllm-qwen3-8b-staging", "torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 2.00 GiB"],
  ["INFO", "ingestion-worker", "Chunked Platform-API-Reference.html → 94 chunks (size=768, overlap=96)"],
  ["DEBUG", "retriever", "hybrid search kb=policies_v3 k=5 bm25=0.3 vec=0.7 took 41ms"],
  ["INFO", "agent-runtime", "run-8812 step Orchestrator delegated to Knowledge Retrieval Agent"],
  ["WARN", "auth-service", "Login without MFA for daniel.reyes — policy grace period"],
  ["ERROR", "erp-connector", "TLS handshake failed: x509 certificate has expired"],
  ["INFO", "inference-router", "Replica qwen3-coder-0 healthy; KV cache usage 71%"],
  ["INFO", "audit-store", "Flushed 312 audit events to WORM partition 2026-10"],
];

export function generateLogs(n = 200): LogRow[] {
  const r = seeded(99);
  return Array.from({ length: n }, (_, i) => {
    const [level, service, message] = logTemplates[Math.floor(r() * logTemplates.length)];
    return { id: `lg-${i}`, time: new Date(Date.now() - i * 19_000).toISOString(), level, service, message, environment: envs[i % 4 === 0 ? 1 : i % 9 === 0 ? 2 : 0] };
  });
}
