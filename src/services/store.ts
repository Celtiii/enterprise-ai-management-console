import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AccessPolicy, Agent, ApiKey, AuditEvent, Conversation, Deployment, DocumentEntry, Environment, ExecutionRun,
  KnowledgeBase, ModelEntry, PlatformNotification, Settings, TimeRange, ToolIntegration, User, Workflow,
} from "@/types";
import * as seed from "@/mocks/data";

export const uid = (p = "id") => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

type Collections = {
  models: ModelEntry[];
  deployments: Deployment[];
  agents: Agent[];
  tools: ToolIntegration[];
  knowledgeBases: KnowledgeBase[];
  documents: DocumentEntry[];
  apiKeys: ApiKey[];
  users: User[];
  policies: AccessPolicy[];
  audit: AuditEvent[];
  conversations: Conversation[];
  workflows: Workflow[];
  runs: ExecutionRun[];
  notifications: PlatformNotification[];
};
type Entity<K extends keyof Collections> = Collections[K][number];

interface AppState extends Collections {
  environment: Environment;
  timeRange: TimeRange;
  settings: Settings;
  setEnvironment: (e: Environment) => void;
  setTimeRange: (r: TimeRange) => void;
  updateSettings: (s: Partial<Settings>) => void;
  add: <K extends keyof Collections>(k: K, item: Entity<K>) => void;
  update: <K extends keyof Collections>(k: K, id: string, patch: Partial<Entity<K>>) => void;
  remove: <K extends keyof Collections>(k: K, id: string) => void;
  audit_: (action: string, resource: string, result?: AuditEvent["result"]) => void;
  notify: (n: Omit<PlatformNotification, "id" | "time" | "read">) => void;
  resetDemo: () => void;
}

const defaultSettings: Settings = {
  orgName: "Contoso Enterprise", theme: "dark", defaultModelId: "qwen3-8b", temperature: 0.7, topP: 0.9, maxTokens: 1024, streaming: true,
  inferenceMode: "mock", apiBaseUrl: "http://vllm-gateway.ai-platform.svc:8000/v1", notifyEmail: true, notifyDeployments: true,
  notifySecurity: true, notifyDigest: false, workspaceName: "Platform", dataRetentionDays: 365, airGapped: true,
};

const seedState = (): Collections => ({
  models: seed.seedModels, deployments: seed.seedDeployments, agents: seed.seedAgents, tools: seed.seedTools,
  knowledgeBases: seed.seedKnowledgeBases, documents: seed.seedDocuments, apiKeys: seed.seedApiKeys, users: seed.seedUsers,
  policies: seed.seedPolicies, audit: seed.seedAudit, conversations: seed.seedConversations, workflows: seed.seedWorkflows,
  runs: seed.seedRuns, notifications: seed.seedNotifications,
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...seedState(),
      environment: "production",
      timeRange: "24h",
      settings: defaultSettings,
      setEnvironment: (environment) => { set({ environment }); get().audit_("environment.switch", `env/${environment}`); },
      setTimeRange: (timeRange) => set({ timeRange }),
      updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      add: (k, item) => set({ [k]: [item, ...(get()[k] as unknown[])] } as Partial<AppState>),
      update: (k, id, patch) =>
        set({ [k]: (get()[k] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) } as Partial<AppState>),
      remove: (k, id) => set({ [k]: (get()[k] as { id: string }[]).filter((x) => x.id !== id) } as Partial<AppState>),
      audit_: (action, resource, result = "success") =>
        set({ audit: [{ id: uid("ae"), time: now(), actor: "ali.moradi", action, resource, result, ip: "10.20.4.17", environment: get().environment }, ...get().audit].slice(0, 500) }),
      notify: (n) => set({ notifications: [{ ...n, id: uid("nt"), time: now(), read: false }, ...get().notifications].slice(0, 50) }),
      resetDemo: () => set({ ...seedState(), settings: defaultSettings, environment: "production", timeRange: "24h" }),
    }),
    { name: "eaic-prototype-state-v1" },
  ),
);

export const modelName = (models: ModelEntry[], id: string) => models.find((m) => m.id === id)?.name ?? id;
