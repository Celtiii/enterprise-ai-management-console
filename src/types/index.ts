export type Environment = "development" | "staging" | "production";
export type TimeRange = "1h" | "24h" | "7d" | "30d";

export type ModelStatus = "available" | "deployed" | "importing" | "deprecated" | "incompatible";
export interface ModelEntry {
  id: string;
  name: string;
  provider: string;
  family: string;
  params: string;
  quantization: string;
  format: string;
  contextLength: number;
  artifactPath: string;
  status: ModelStatus;
  vramGb: number;
  compatibility: "compatible" | "cpu-only" | "needs-gpu" | "unsupported";
  version: string;
  license: string;
  tags: string[];
  illustrative: boolean;
}

export type DeploymentStatus = "running" | "stopped" | "starting" | "error" | "restarting";
export interface Deployment {
  id: string;
  name: string;
  modelId: string;
  runtime: "vLLM" | "vLLM (CPU)" | "llama.cpp";
  endpoint: string;
  replicas: number;
  gpus: string[];
  cpu: number;
  memoryGb: number;
  maxModelLen: number;
  maxNumSeqs: number;
  gpuMemoryUtilization: number;
  tensorParallel: number;
  status: DeploymentStatus;
  environment: Environment;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  instructions: string;
  modelId: string;
  tools: string[];
  knowledgeBases: string[];
  memory: "none" | "session" | "long-term";
  guardrails: string[];
  status: "active" | "draft" | "disabled";
  version: string;
  updatedAt: string;
  owner: string;
}

export interface ToolIntegration {
  id: string;
  name: string;
  type: "MCP Server" | "REST API" | "Document Search" | "Database" | "Code Execution";
  description: string;
  status: "connected" | "degraded" | "error" | "disabled";
  transport: string;
  endpoint: string;
  permissions: string[];
  tools: string[];
  lastExecution: string;
  error?: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  embeddingModel: string;
  vectorStore: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  threshold: number;
  classification: Classification;
  updatedAt: string;
}

export type Classification = "Public" | "Internal" | "Confidential" | "Restricted";

export interface DocumentEntry {
  id: string;
  kbId: string;
  name: string;
  type: string;
  sizeKb: number;
  chunks: number;
  status: "indexed" | "processing" | "queued" | "failed";
  progress: number;
  uploadedBy: string;
  uploadedAt: string;
  classification: Classification;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string;
  owner: string;
  status: "active" | "revoked";
  expiresAt: string;
}

export type RoleName = "Administrator" | "Platform Engineer" | "AI Developer" | "Security Analyst" | "Read-Only Auditor";
export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  workspaces: string[];
  status: "active" | "invited" | "suspended";
  lastActive: string;
  mfa: boolean;
}

export interface AccessPolicy {
  id: string;
  name: string;
  type: "Model Access" | "Agent Tool" | "Data" | "Network" | "Session";
  subject: string;
  resource: string;
  effect: "allow" | "deny" | "require-approval";
  enabled: boolean;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  resource: string;
  result: "success" | "denied" | "failure";
  ip: string;
  environment: Environment;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  meta?: { model: string; promptTokens: number; completionTokens: number; latencyMs: number; ttftMs: number; simulated: true; error?: string };
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  systemPrompt: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export type NodeKind = "input" | "llm" | "agent" | "retriever" | "tool" | "router" | "approval" | "output";
export interface WorkflowNode {
  id: string;
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  config: Record<string, string>;
}
export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
}
export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ExecutionRun {
  id: string;
  workflowName: string;
  status: "succeeded" | "failed" | "running" | "awaiting-approval";
  startedAt: string;
  durationMs: number;
  trigger: string;
  steps: { node: string; status: "succeeded" | "failed" | "skipped"; ms: number; detail: string }[];
}

export interface PlatformNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  level: "info" | "warning" | "error" | "success";
  read: boolean;
}

export interface Settings {
  orgName: string;
  theme: "dark" | "midnight" | "system";
  defaultModelId: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  streaming: boolean;
  inferenceMode: "mock" | "openai-compatible";
  apiBaseUrl: string;
  notifyEmail: boolean;
  notifyDeployments: boolean;
  notifySecurity: boolean;
  notifyDigest: boolean;
  workspaceName: string;
  dataRetentionDays: number;
  airGapped: boolean;
}
