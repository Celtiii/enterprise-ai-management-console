import type {
  AccessPolicy, Agent, ApiKey, AuditEvent, Conversation, Deployment, DocumentEntry, Environment,
  ExecutionRun, KnowledgeBase, ModelEntry, PlatformNotification, ToolIntegration, User, Workflow,
} from "@/types";

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const seedModels: ModelEntry[] = [
  { id: "qwen3-0.6b", name: "Qwen3-0.6B", provider: "Alibaba Qwen", family: "Qwen3", params: "0.6B", quantization: "BF16", format: "safetensors", contextLength: 32768, artifactPath: "/srv/models/qwen/Qwen3-0.6B", status: "deployed", vramGb: 2, compatibility: "cpu-only", version: "2025.04", license: "Apache-2.0", tags: ["small", "edge", "cpu"], illustrative: true },
  { id: "qwen3-8b", name: "Qwen3-8B", provider: "Alibaba Qwen", family: "Qwen3", params: "8B", quantization: "AWQ INT4", format: "safetensors", contextLength: 131072, artifactPath: "/srv/models/qwen/Qwen3-8B-AWQ", status: "deployed", vramGb: 8, compatibility: "compatible", version: "2025.04", license: "Apache-2.0", tags: ["general", "reasoning"], illustrative: true },
  { id: "qwen3-coder-30b", name: "Qwen3-Coder-30B-A3B", provider: "Alibaba Qwen", family: "Qwen3-Coder", params: "30B (A3B MoE)", quantization: "FP8", format: "safetensors", contextLength: 262144, artifactPath: "/srv/models/qwen/Qwen3-Coder-30B-A3B-FP8", status: "deployed", vramGb: 34, compatibility: "needs-gpu", version: "2025.07", license: "Apache-2.0", tags: ["code", "moe"], illustrative: true },
  { id: "llama-3.1-8b", name: "Llama-3.1-8B-Instruct", provider: "Meta", family: "Llama 3.1", params: "8B", quantization: "BF16", format: "safetensors", contextLength: 131072, artifactPath: "/srv/models/meta/Llama-3.1-8B-Instruct", status: "available", vramGb: 17, compatibility: "compatible", version: "3.1", license: "Llama 3.1 Community", tags: ["general"], illustrative: true },
  { id: "mistral-small-24b", name: "Mistral-Small-24B-Instruct", provider: "Mistral AI", family: "Mistral Small", params: "24B", quantization: "GPTQ INT4", format: "safetensors", contextLength: 32768, artifactPath: "/srv/models/mistral/Mistral-Small-24B-GPTQ", status: "available", vramGb: 15, compatibility: "compatible", version: "2501", license: "Apache-2.0", tags: ["general", "multilingual"], illustrative: true },
  { id: "bge-m3", name: "BGE-M3", provider: "BAAI", family: "BGE", params: "568M", quantization: "FP16", format: "safetensors", contextLength: 8192, artifactPath: "/srv/models/baai/bge-m3", status: "deployed", vramGb: 2, compatibility: "compatible", version: "1.0", license: "MIT", tags: ["embedding"], illustrative: true },
  { id: "llama-3.3-70b", name: "Llama-3.3-70B-Instruct", provider: "Meta", family: "Llama 3.3", params: "70B", quantization: "AWQ INT4", format: "safetensors", contextLength: 131072, artifactPath: "/srv/models/meta/Llama-3.3-70B-AWQ", status: "importing", vramGb: 42, compatibility: "needs-gpu", version: "3.3", license: "Llama 3.3 Community", tags: ["large"], illustrative: true },
  { id: "phi-3-mini", name: "Phi-3-mini-4k", provider: "Microsoft", family: "Phi-3", params: "3.8B", quantization: "GGUF Q4_K_M", format: "gguf", contextLength: 4096, artifactPath: "/srv/models/microsoft/phi-3-mini-q4.gguf", status: "deprecated", vramGb: 3, compatibility: "unsupported", version: "2024.04", license: "MIT", tags: ["legacy"], illustrative: true },
];

export const seedDeployments: Deployment[] = [
  { id: "dep-1", name: "qwen3-8b-chat", modelId: "qwen3-8b", runtime: "vLLM", endpoint: "http://vllm-qwen3-8b.ai-platform.svc:8000/v1", replicas: 2, gpus: ["gpu-node-01/GPU0", "gpu-node-01/GPU1"], cpu: 8, memoryGb: 32, maxModelLen: 32768, maxNumSeqs: 128, gpuMemoryUtilization: 0.9, tensorParallel: 1, status: "running", environment: "production", updatedAt: ago(320) },
  { id: "dep-2", name: "qwen3-coder", modelId: "qwen3-coder-30b", runtime: "vLLM", endpoint: "http://vllm-qwen3-coder.ai-platform.svc:8000/v1", replicas: 1, gpus: ["gpu-node-02/GPU0", "gpu-node-02/GPU1"], cpu: 16, memoryGb: 64, maxModelLen: 65536, maxNumSeqs: 64, gpuMemoryUtilization: 0.92, tensorParallel: 2, status: "running", environment: "production", updatedAt: ago(1440) },
  { id: "dep-3", name: "qwen3-0.6b-cpu", modelId: "qwen3-0.6b", runtime: "vLLM (CPU)", endpoint: "http://vllm-qwen3-small.ai-platform.svc:8000/v1", replicas: 1, gpus: [], cpu: 16, memoryGb: 24, maxModelLen: 8192, maxNumSeqs: 16, gpuMemoryUtilization: 0, tensorParallel: 1, status: "running", environment: "development", updatedAt: ago(90) },
  { id: "dep-4", name: "bge-m3-embeddings", modelId: "bge-m3", runtime: "vLLM", endpoint: "http://vllm-bge-m3.ai-platform.svc:8000/v1", replicas: 1, gpus: ["gpu-node-01/GPU2"], cpu: 4, memoryGb: 16, maxModelLen: 8192, maxNumSeqs: 256, gpuMemoryUtilization: 0.4, tensorParallel: 1, status: "running", environment: "production", updatedAt: ago(4000) },
  { id: "dep-5", name: "llama-8b-eval", modelId: "llama-3.1-8b", runtime: "vLLM", endpoint: "http://vllm-llama-8b.ai-staging.svc:8000/v1", replicas: 1, gpus: ["gpu-node-03/GPU0"], cpu: 8, memoryGb: 32, maxModelLen: 16384, maxNumSeqs: 64, gpuMemoryUtilization: 0.88, tensorParallel: 1, status: "stopped", environment: "staging", updatedAt: ago(9000) },
  { id: "dep-6", name: "qwen3-8b-staging", modelId: "qwen3-8b", runtime: "vLLM", endpoint: "http://vllm-qwen3-8b.ai-staging.svc:8000/v1", replicas: 1, gpus: ["gpu-node-03/GPU1"], cpu: 8, memoryGb: 32, maxModelLen: 32768, maxNumSeqs: 64, gpuMemoryUtilization: 0.9, tensorParallel: 1, status: "error", environment: "staging", updatedAt: ago(45) },
];

export const seedAgents: Agent[] = [
  { id: "ag-orch", name: "Orchestrator Agent", description: "Plans multi-step tasks and routes sub-tasks to specialist agents.", role: "Planner / router", instructions: "Decompose the user request into steps. Delegate retrieval to the Knowledge Retrieval Agent and analysis to specialists. Merge results into a single cited answer.", modelId: "qwen3-8b", tools: ["agent.delegate", "workflow.state"], knowledgeBases: [], memory: "session", guardrails: ["PII redaction", "Max 8 delegation hops"], status: "active", version: "v1.4.0", updatedAt: ago(600), owner: "Sara Kim" },
  { id: "ag-research", name: "Research Agent", description: "Synthesises internal reports and policy documents into briefings.", role: "Analyst", instructions: "Answer using only retrieved sources. Cite every claim with [doc:chunk]. State uncertainty explicitly.", modelId: "qwen3-8b", tools: ["docsearch.query", "docsearch.fetch"], knowledgeBases: ["kb-policy", "kb-eng"], memory: "long-term", guardrails: ["Citations required", "Classification ≤ Confidential"], status: "active", version: "v2.1.3", updatedAt: ago(2000), owner: "Daniel Reyes" },
  { id: "ag-code", name: "Coding Agent", description: "Reviews merge requests, explains code, and drafts fixes.", role: "Software engineer", instructions: "Review diffs for correctness, security and style. Suggest minimal patches. Never execute code outside the sandbox.", modelId: "qwen3-coder-30b", tools: ["gitlab.get_mr", "gitlab.comment", "sandbox.run_tests"], knowledgeBases: ["kb-eng"], memory: "session", guardrails: ["Sandbox-only execution", "No secret output"], status: "active", version: "v1.2.0", updatedAt: ago(300), owner: "Priya Nair" },
  { id: "ag-sec", name: "Security Analyst", description: "Triages SIEM alerts and maps findings to internal controls.", role: "SOC analyst", instructions: "Classify alert severity, correlate with recent audit events, and draft an incident summary. Require human approval before any containment action.", modelId: "qwen3-8b", tools: ["siem.search", "audit.query", "ticket.create"], knowledgeBases: ["kb-sec"], memory: "long-term", guardrails: ["Human approval for actions", "Restricted data access logged"], status: "active", version: "v0.9.1", updatedAt: ago(5000), owner: "Marcus Chen" },
  { id: "ag-kr", name: "Knowledge Retrieval Agent", description: "Hybrid search over enterprise knowledge bases with reranking.", role: "Retriever", instructions: "Rewrite the query, run hybrid retrieval, rerank, and return the top passages with metadata.", modelId: "qwen3-0.6b", tools: ["docsearch.query"], knowledgeBases: ["kb-policy", "kb-eng", "kb-hr"], memory: "none", guardrails: ["Respect document ACLs"], status: "active", version: "v1.0.5", updatedAt: ago(800), owner: "Sara Kim" },
  { id: "ag-hr", name: "HR Policy Assistant", description: "Answers employee questions about leave and benefits.", role: "Assistant", instructions: "Answer HR policy questions from the HR knowledge base only.", modelId: "qwen3-0.6b", tools: ["docsearch.query"], knowledgeBases: ["kb-hr"], memory: "session", guardrails: ["PII redaction"], status: "draft", version: "v0.2.0", updatedAt: ago(12000), owner: "Lena Fischer" },
];

export const seedTools: ToolIntegration[] = [
  { id: "t-docsearch", name: "Enterprise Doc Search", type: "Document Search", description: "Hybrid BM25 + vector search over indexed knowledge bases.", status: "connected", transport: "Internal gRPC", endpoint: "grpc://retriever.ai-platform.svc:50051", permissions: ["read:documents"], tools: ["docsearch.query", "docsearch.fetch"], lastExecution: ago(2) },
  { id: "t-gitlab", name: "GitLab (self-hosted)", type: "MCP Server", description: "Merge request, issue and repository tools via MCP.", status: "connected", transport: "MCP · streamable HTTP", endpoint: "https://mcp-gitlab.corp.internal/mcp", permissions: ["read:repo", "write:comments"], tools: ["gitlab.get_mr", "gitlab.comment", "gitlab.search_code"], lastExecution: ago(14) },
  { id: "t-siem", name: "SIEM Connector", type: "MCP Server", description: "Read-only alert and log search against the SOC SIEM.", status: "degraded", transport: "MCP · stdio (sidecar)", endpoint: "stdio:///opt/mcp/siem-server", permissions: ["read:alerts"], tools: ["siem.search", "siem.get_alert"], lastExecution: ago(38), error: "p95 latency 4.2s exceeds 2s threshold" },
  { id: "t-ticket", name: "ServiceDesk API", type: "REST API", description: "Create and update tickets in the internal service desk.", status: "connected", transport: "HTTPS REST · OAuth2 client credentials", endpoint: "https://servicedesk.corp.internal/api/v2", permissions: ["write:tickets"], tools: ["ticket.create", "ticket.update"], lastExecution: ago(120) },
  { id: "t-sandbox", name: "Code Sandbox", type: "Code Execution", description: "Isolated gVisor sandbox for running tests (no network).", status: "connected", transport: "Internal HTTP", endpoint: "http://sandbox.ai-platform.svc:8080", permissions: ["execute:sandbox"], tools: ["sandbox.run_tests", "sandbox.exec"], lastExecution: ago(9) },
  { id: "t-erp", name: "Finance ERP (read)", type: "Database", description: "Read-only SQL views for finance reporting.", status: "error", transport: "PostgreSQL wire", endpoint: "postgres://erp-ro.corp.internal:5432/reporting", permissions: ["read:finance"], tools: ["erp.query"], lastExecution: ago(1500), error: "TLS handshake failed: certificate expired 2026-10-01" },
];

export const seedKnowledgeBases: KnowledgeBase[] = [
  { id: "kb-policy", name: "Corporate Policies", description: "Security, compliance and IT acceptable-use policies.", embeddingModel: "bge-m3", vectorStore: "Qdrant · policies_v3", chunkSize: 512, chunkOverlap: 64, topK: 5, threshold: 0.72, classification: "Internal", updatedAt: ago(300) },
  { id: "kb-eng", name: "Engineering Handbook", description: "Architecture decision records, runbooks and API docs.", embeddingModel: "bge-m3", vectorStore: "Qdrant · eng_handbook", chunkSize: 768, chunkOverlap: 96, topK: 6, threshold: 0.7, classification: "Internal", updatedAt: ago(90) },
  { id: "kb-sec", name: "SOC Playbooks", description: "Incident response playbooks and threat intel summaries.", embeddingModel: "bge-m3", vectorStore: "pgvector · soc", chunkSize: 512, chunkOverlap: 64, topK: 4, threshold: 0.75, classification: "Restricted", updatedAt: ago(2400) },
  { id: "kb-hr", name: "HR & Benefits", description: "Leave, benefits and onboarding guidance.", embeddingModel: "bge-m3", vectorStore: "Qdrant · hr", chunkSize: 384, chunkOverlap: 48, topK: 5, threshold: 0.7, classification: "Confidential", updatedAt: ago(7000) },
];

export const seedDocuments: DocumentEntry[] = [
  { id: "d1", kbId: "kb-policy", name: "Information-Security-Policy-v4.2.pdf", type: "PDF", sizeKb: 1840, chunks: 212, status: "indexed", progress: 100, uploadedBy: "Marcus Chen", uploadedAt: ago(9000), classification: "Internal" },
  { id: "d2", kbId: "kb-policy", name: "Acceptable-Use-Policy-2026.docx", type: "DOCX", sizeKb: 420, chunks: 48, status: "indexed", progress: 100, uploadedBy: "Marcus Chen", uploadedAt: ago(8000), classification: "Internal" },
  { id: "d3", kbId: "kb-policy", name: "Data-Classification-Standard.pdf", type: "PDF", sizeKb: 960, chunks: 103, status: "indexed", progress: 100, uploadedBy: "Lena Fischer", uploadedAt: ago(5000), classification: "Internal" },
  { id: "d4", kbId: "kb-eng", name: "ADR-031-vLLM-serving.md", type: "Markdown", sizeKb: 38, chunks: 12, status: "indexed", progress: 100, uploadedBy: "Priya Nair", uploadedAt: ago(1200), classification: "Internal" },
  { id: "d5", kbId: "kb-eng", name: "Runbook-GPU-Node-Recovery.md", type: "Markdown", sizeKb: 22, chunks: 8, status: "indexed", progress: 100, uploadedBy: "Sara Kim", uploadedAt: ago(700), classification: "Internal" },
  { id: "d6", kbId: "kb-eng", name: "Platform-API-Reference.html", type: "HTML", sizeKb: 640, chunks: 94, status: "processing", progress: 62, uploadedBy: "Daniel Reyes", uploadedAt: ago(8), classification: "Internal" },
  { id: "d7", kbId: "kb-sec", name: "IR-Playbook-Ransomware.pdf", type: "PDF", sizeKb: 1220, chunks: 140, status: "indexed", progress: 100, uploadedBy: "Marcus Chen", uploadedAt: ago(3000), classification: "Restricted" },
  { id: "d8", kbId: "kb-sec", name: "ThreatIntel-Q3-2026.pdf", type: "PDF", sizeKb: 3100, chunks: 0, status: "failed", progress: 0, uploadedBy: "Marcus Chen", uploadedAt: ago(200), classification: "Restricted" },
  { id: "d9", kbId: "kb-hr", name: "Parental-Leave-Policy.pdf", type: "PDF", sizeKb: 310, chunks: 34, status: "indexed", progress: 100, uploadedBy: "Lena Fischer", uploadedAt: ago(10000), classification: "Confidential" },
];

export const seedApiKeys: ApiKey[] = [
  { id: "k1", name: "Internal portal backend", prefix: "sk-ent-4f2a", scopes: ["chat:write", "models:read"], createdAt: ago(60000), lastUsed: ago(3), owner: "Daniel Reyes", status: "active", expiresAt: "2027-03-01" },
  { id: "k2", name: "CI code-review bot", prefix: "sk-ent-9c71", scopes: ["chat:write", "agents:invoke"], createdAt: ago(30000), lastUsed: ago(40), owner: "Priya Nair", status: "active", expiresAt: "2027-01-15" },
  { id: "k3", name: "SOC automation", prefix: "sk-ent-b03e", scopes: ["agents:invoke"], createdAt: ago(20000), lastUsed: ago(400), owner: "Marcus Chen", status: "active", expiresAt: "2026-12-31" },
  { id: "k4", name: "Legacy analytics export", prefix: "sk-ent-11d8", scopes: ["models:read"], createdAt: ago(200000), lastUsed: ago(90000), owner: "Sara Kim", status: "revoked", expiresAt: "2026-06-01" },
];

export const seedUsers: User[] = [
  { id: "u1", name: "Ali Moradi", email: "ali.moradi@corp.internal", role: "Administrator", workspaces: ["Platform", "Security", "Engineering"], status: "active", lastActive: ago(1), mfa: true },
  { id: "u2", name: "Sara Kim", email: "sara.kim@corp.internal", role: "Platform Engineer", workspaces: ["Platform"], status: "active", lastActive: ago(12), mfa: true },
  { id: "u3", name: "Priya Nair", email: "priya.nair@corp.internal", role: "AI Developer", workspaces: ["Engineering"], status: "active", lastActive: ago(30), mfa: true },
  { id: "u4", name: "Marcus Chen", email: "marcus.chen@corp.internal", role: "Security Analyst", workspaces: ["Security"], status: "active", lastActive: ago(80), mfa: true },
  { id: "u5", name: "Daniel Reyes", email: "daniel.reyes@corp.internal", role: "AI Developer", workspaces: ["Engineering", "Platform"], status: "active", lastActive: ago(200), mfa: false },
  { id: "u6", name: "Lena Fischer", email: "lena.fischer@corp.internal", role: "Read-Only Auditor", workspaces: ["Security"], status: "active", lastActive: ago(3000), mfa: true },
  { id: "u7", name: "Omar Haddad", email: "omar.haddad@corp.internal", role: "AI Developer", workspaces: ["Engineering"], status: "invited", lastActive: ago(9000), mfa: false },
  { id: "u8", name: "Jonas Berg", email: "jonas.berg@corp.internal", role: "Platform Engineer", workspaces: ["Platform"], status: "suspended", lastActive: ago(40000), mfa: true },
];

export const seedPolicies: AccessPolicy[] = [
  { id: "p1", name: "Coder model restricted to Engineering", type: "Model Access", subject: "workspace:Engineering", resource: "model:qwen3-coder-30b", effect: "allow", enabled: true, updatedAt: ago(5000) },
  { id: "p2", name: "Block Restricted data for non-security roles", type: "Data", subject: "role:!Security Analyst", resource: "classification:Restricted", effect: "deny", enabled: true, updatedAt: ago(9000) },
  { id: "p3", name: "Ticket creation requires approval", type: "Agent Tool", subject: "agent:Security Analyst", resource: "tool:ticket.create", effect: "require-approval", enabled: true, updatedAt: ago(1200) },
  { id: "p4", name: "Sandbox exec for Coding Agent only", type: "Agent Tool", subject: "agent:Coding Agent", resource: "tool:sandbox.*", effect: "allow", enabled: true, updatedAt: ago(3000) },
  { id: "p5", name: "Deny all egress from inference pods", type: "Network", subject: "namespace:ai-platform", resource: "egress:0.0.0.0/0", effect: "deny", enabled: true, updatedAt: ago(40000) },
  { id: "p6", name: "Session timeout 30 min idle", type: "Session", subject: "all-users", resource: "session", effect: "allow", enabled: true, updatedAt: ago(20000) },
  { id: "p7", name: "70B model staging-only", type: "Model Access", subject: "env:production", resource: "model:llama-3.3-70b", effect: "deny", enabled: false, updatedAt: ago(800) },
];

const actions = ["model.deploy", "apikey.create", "agent.update", "policy.update", "user.login", "document.upload", "workflow.execute", "deployment.restart", "data.access", "user.role_change"];
const actors = ["ali.moradi", "sara.kim", "priya.nair", "marcus.chen", "daniel.reyes", "svc-ci-bot", "lena.fischer"];
const resources = ["deployment/qwen3-8b-chat", "apikey/sk-ent-9c71", "agent/Research Agent", "policy/p3", "console", "kb/Engineering Handbook", "workflow/Policy Q&A", "deployment/qwen3-coder", "kb/SOC Playbooks", "user/omar.haddad"];
const envs: Environment[] = ["production", "staging", "development"];
export const seedAudit: AuditEvent[] = Array.from({ length: 60 }, (_, i) => {
  const a = (i * 7) % actions.length;
  return {
    id: `ae-${i}`,
    time: ago(i * 23 + (i % 5)),
    actor: actors[(i * 3) % actors.length],
    action: actions[a],
    resource: resources[a],
    result: i % 11 === 3 ? "denied" : i % 17 === 5 ? "failure" : "success",
    ip: `10.20.${(i * 13) % 255}.${(i * 29) % 255}`,
    environment: envs[i % 3],
  };
});

export const seedConversations: Conversation[] = [
  {
    id: "c1", title: "Summarise ADR-031 vLLM serving", modelId: "qwen3-8b", systemPrompt: "You are a helpful enterprise assistant.", updatedAt: ago(45),
    messages: [
      { id: "m1", role: "user", content: "Summarise the key decisions in ADR-031 about vLLM serving.", createdAt: ago(46) },
      { id: "m2", role: "assistant", content: "**Simulated response (mock adapter).**\n\nKey points recorded in ADR-031:\n\n1. vLLM is the default runtime for transformer models.\n2. Tensor parallelism is used for models over 24B.\n3. `gpu-memory-utilization` defaults to `0.90`.\n\n```yaml\nmax_model_len: 32768\nmax_num_seqs: 128\n```", createdAt: ago(45), meta: { model: "qwen3-8b", promptTokens: 42, completionTokens: 88, latencyMs: 1320, ttftMs: 180, simulated: true } },
    ],
  },
  { id: "c2", title: "Draft incident summary", modelId: "qwen3-8b", systemPrompt: "You are a SOC analyst assistant.", updatedAt: ago(600), messages: [{ id: "m3", role: "user", content: "Draft an incident summary template.", createdAt: ago(600) }, { id: "m4", role: "assistant", content: "**Simulated response (mock adapter).**\n\n### Incident summary\n- **Detected:** …\n- **Severity:** …\n- **Scope:** …\n- **Containment:** …", createdAt: ago(600), meta: { model: "qwen3-8b", promptTokens: 20, completionTokens: 40, latencyMs: 900, ttftMs: 150, simulated: true } }] },
  { id: "c3", title: "Refactor Python retry helper", modelId: "qwen3-coder-30b", systemPrompt: "You are a senior Python engineer.", updatedAt: ago(3000), messages: [] },
];

export const seedWorkflows: Workflow[] = [
  {
    id: "wf-1", name: "Policy Q&A with Analysis",
    nodes: [
      { id: "n1", kind: "input", label: "User Request", x: 40, y: 180, config: { schema: "{ question: string }" } },
      { id: "n2", kind: "agent", label: "Orchestrator", x: 260, y: 180, config: { agent: "Orchestrator Agent", maxHops: "8" } },
      { id: "n3", kind: "retriever", label: "Knowledge Retrieval", x: 480, y: 80, config: { knowledgeBase: "Corporate Policies", topK: "5", threshold: "0.72" } },
      { id: "n4", kind: "agent", label: "Analysis Agent", x: 700, y: 180, config: { agent: "Research Agent", maxHops: "3" } },
      { id: "n5", kind: "output", label: "Response", x: 920, y: 180, config: { format: "markdown + citations" } },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" }, { id: "e2", from: "n2", to: "n3" }, { id: "e3", from: "n3", to: "n4" }, { id: "e4", from: "n4", to: "n5" },
    ],
  },
];

export const seedRuns: ExecutionRun[] = [
  { id: "run-8812", workflowName: "Policy Q&A with Analysis", status: "succeeded", startedAt: ago(12), durationMs: 4820, trigger: "API · portal-backend", steps: [{ node: "User Request", status: "succeeded", ms: 4, detail: "Validated input" }, { node: "Orchestrator", status: "succeeded", ms: 910, detail: "Planned 2 steps" }, { node: "Knowledge Retrieval", status: "succeeded", ms: 380, detail: "5 chunks ≥ 0.72" }, { node: "Analysis Agent", status: "succeeded", ms: 3400, detail: "412 tokens" }, { node: "Response", status: "succeeded", ms: 6, detail: "Returned" }] },
  { id: "run-8811", workflowName: "MR Security Review", status: "failed", startedAt: ago(55), durationMs: 2100, trigger: "Webhook · GitLab", steps: [{ node: "User Request", status: "succeeded", ms: 3, detail: "MR !4521" }, { node: "Coding Agent", status: "failed", ms: 2090, detail: "Tool gitlab.get_mr timed out" }] },
  { id: "run-8810", workflowName: "Alert Triage", status: "awaiting-approval", startedAt: ago(90), durationMs: 6400, trigger: "Schedule · every 15m", steps: [{ node: "SIEM Search", status: "succeeded", ms: 2200, detail: "3 alerts" }, { node: "Security Analyst", status: "succeeded", ms: 4100, detail: "Severity: High" }, { node: "Human Approval", status: "skipped", ms: 0, detail: "Waiting for approver" }] },
  { id: "run-8809", workflowName: "Policy Q&A with Analysis", status: "succeeded", startedAt: ago(140), durationMs: 3900, trigger: "Console · ali.moradi", steps: [{ node: "Orchestrator", status: "succeeded", ms: 800, detail: "Planned" }, { node: "Knowledge Retrieval", status: "succeeded", ms: 300, detail: "4 chunks" }, { node: "Analysis Agent", status: "succeeded", ms: 2800, detail: "301 tokens" }] },
  { id: "run-8808", workflowName: "HR Onboarding Assistant", status: "succeeded", startedAt: ago(400), durationMs: 2200, trigger: "API · hr-portal", steps: [{ node: "Retriever", status: "succeeded", ms: 290, detail: "3 chunks" }, { node: "LLM", status: "succeeded", ms: 1900, detail: "188 tokens" }] },
];

export const seedNotifications: PlatformNotification[] = [
  { id: "nt1", title: "Deployment error", body: "qwen3-8b-staging failed readiness probe (CUDA OOM).", time: ago(45), level: "error", read: false },
  { id: "nt2", title: "Certificate expired", body: "Finance ERP connector TLS certificate expired.", time: ago(300), level: "warning", read: false },
  { id: "nt3", title: "Import in progress", body: "Llama-3.3-70B artifact import 64% complete.", time: ago(20), level: "info", read: false },
  { id: "nt4", title: "Approval requested", body: "Alert Triage run-8810 awaits human approval.", time: ago(90), level: "warning", read: true },
];

export const gpuInventory = [
  { id: "gpu-node-01/GPU0", node: "gpu-node-01", model: "NVIDIA H100 80GB", util: 82, memUsed: 71, memTotal: 80, temp: 66, power: 540, assigned: "qwen3-8b-chat" },
  { id: "gpu-node-01/GPU1", node: "gpu-node-01", model: "NVIDIA H100 80GB", util: 77, memUsed: 70, memTotal: 80, temp: 64, power: 510, assigned: "qwen3-8b-chat" },
  { id: "gpu-node-01/GPU2", node: "gpu-node-01", model: "NVIDIA H100 80GB", util: 31, memUsed: 32, memTotal: 80, temp: 51, power: 260, assigned: "bge-m3-embeddings" },
  { id: "gpu-node-01/GPU3", node: "gpu-node-01", model: "NVIDIA H100 80GB", util: 0, memUsed: 0, memTotal: 80, temp: 38, power: 70, assigned: "—" },
  { id: "gpu-node-02/GPU0", node: "gpu-node-02", model: "NVIDIA L40S 48GB", util: 91, memUsed: 44, memTotal: 48, temp: 72, power: 330, assigned: "qwen3-coder" },
  { id: "gpu-node-02/GPU1", node: "gpu-node-02", model: "NVIDIA L40S 48GB", util: 88, memUsed: 44, memTotal: 48, temp: 71, power: 320, assigned: "qwen3-coder" },
  { id: "gpu-node-03/GPU0", node: "gpu-node-03", model: "NVIDIA A100 40GB", util: 0, memUsed: 0, memTotal: 40, temp: 35, power: 55, assigned: "llama-8b-eval (stopped)" },
  { id: "gpu-node-03/GPU1", node: "gpu-node-03", model: "NVIDIA A100 40GB", util: 0, memUsed: 1, memTotal: 40, temp: 36, power: 60, assigned: "qwen3-8b-staging (error)" },
];

export const computeNodes = [
  { name: "gpu-node-01", type: "GPU", cpu: "2× Xeon 8480+ (112c)", cpuUtil: 46, ram: "2 TB", ramUtil: 58, gpus: "4× H100", status: "Ready", zone: "rack-a" },
  { name: "gpu-node-02", type: "GPU", cpu: "2× EPYC 9354 (64c)", cpuUtil: 61, ram: "1 TB", ramUtil: 49, gpus: "2× L40S", status: "Ready", zone: "rack-a" },
  { name: "gpu-node-03", type: "GPU", cpu: "2× Xeon 6338 (64c)", cpuUtil: 8, ram: "512 GB", ramUtil: 21, gpus: "2× A100", status: "Ready", zone: "rack-b" },
  { name: "cpu-node-01", type: "CPU-only", cpu: "2× EPYC 9654 (192c)", cpuUtil: 38, ram: "768 GB", ramUtil: 44, gpus: "—", status: "Ready", zone: "rack-b" },
  { name: "cpu-node-02", type: "CPU-only", cpu: "2× EPYC 9654 (192c)", cpuUtil: 72, ram: "768 GB", ramUtil: 67, gpus: "—", status: "Ready", zone: "rack-b" },
  { name: "cpu-node-03", type: "CPU-only", cpu: "2× Xeon 6430 (64c)", cpuUtil: 0, ram: "256 GB", ramUtil: 4, gpus: "—", status: "Cordoned", zone: "rack-c" },
];

export const services = [
  { name: "API Gateway", version: "2.4.1", status: "healthy", replicas: "3/3", deps: ["Auth Service", "Inference Router"], latency: 12 },
  { name: "Inference Router", version: "1.8.0", status: "healthy", replicas: "2/2", deps: ["vLLM instances"], latency: 4 },
  { name: "vLLM instances", version: "0.10.x", status: "degraded", replicas: "5/6", deps: ["GPU nodes"], latency: 0 },
  { name: "Agent Runtime", version: "0.9.4", status: "healthy", replicas: "3/3", deps: ["Inference Router", "MCP Gateway", "Retriever"], latency: 22 },
  { name: "MCP Gateway", version: "0.6.2", status: "degraded", replicas: "2/2", deps: ["External MCP servers"], latency: 41 },
  { name: "Retriever", version: "1.3.0", status: "healthy", replicas: "2/2", deps: ["Qdrant", "Embedding service"], latency: 18 },
  { name: "Qdrant", version: "1.12", status: "healthy", replicas: "3/3", deps: ["Object Storage"], latency: 6 },
  { name: "Ingestion Workers", version: "1.1.5", status: "healthy", replicas: "4/4", deps: ["Embedding service", "Object Storage"], latency: 0 },
  { name: "Auth Service (OIDC)", version: "3.2.0", status: "healthy", replicas: "2/2", deps: ["LDAP / Keycloak"], latency: 9 },
  { name: "Audit Log Store", version: "2.0.0", status: "healthy", replicas: "3/3", deps: ["PostgreSQL"], latency: 5 },
];

export const storageVolumes = [
  { name: "model-artifacts", type: "NFS · NetApp", used: 6.2, total: 10, unit: "TB", mount: "/srv/models" },
  { name: "vector-indexes", type: "NVMe local (Qdrant)", used: 1.1, total: 4, unit: "TB", mount: "/var/lib/qdrant" },
  { name: "documents-raw", type: "S3-compatible · MinIO", used: 3.8, total: 20, unit: "TB", mount: "s3://kb-raw" },
  { name: "container-registry", type: "Harbor (offline)", used: 0.9, total: 2, unit: "TB", mount: "harbor.corp.internal" },
  { name: "audit-logs", type: "PostgreSQL WORM", used: 240, total: 1000, unit: "GB", mount: "pg-audit" },
];

export const artifacts = [
  { name: "Qwen3-8B-AWQ", kind: "Model", size: "5.7 GB", sha: "sha256:9f3c…e12a", source: "Offline bundle 2026-09", status: "verified" },
  { name: "Qwen3-Coder-30B-A3B-FP8", kind: "Model", size: "31.2 GB", sha: "sha256:41ab…77d0", source: "Offline bundle 2026-09", status: "verified" },
  { name: "Llama-3.3-70B-AWQ", kind: "Model", size: "39.8 GB", sha: "sha256:c0de…5511", source: "USB transfer #118", status: "importing" },
  { name: "vllm/vllm-openai:v0.10.2", kind: "Container", size: "9.4 GB", sha: "sha256:77e1…0b3f", source: "Harbor mirror", status: "verified" },
  { name: "qdrant/qdrant:v1.12.4", kind: "Container", size: "210 MB", sha: "sha256:aa10…c442", source: "Harbor mirror", status: "verified" },
  { name: "ai-platform/agent-runtime:0.9.4", kind: "Container", size: "1.1 GB", sha: "sha256:5e5e…91fa", source: "Internal build", status: "verified" },
  { name: "ai-platform/mcp-gateway:0.6.2", kind: "Container", size: "380 MB", sha: "sha256:0f0f…ab12", source: "Internal build", status: "signature-mismatch" },
];
