import {
  LayoutDashboard, MessageSquare, History, Boxes, Rocket, Plug, Gauge, Bot, Workflow, ListChecks, Wrench,
  Library, FileText, SearchCode, BookOpen, KeyRound, Code2, Activity, Waypoints, ScrollText, Users, ShieldCheck,
  FileClock, Lock, Cpu, Server, HardDrive, PackageOpen, Settings, LucideIcon,
} from "lucide-react";

export interface NavItem { label: string; path: string; icon: LucideIcon }
export interface NavGroup { label: string; icon: LucideIcon; items: NavItem[] }

export const navTop: NavItem = { label: "Overview", path: "/", icon: LayoutDashboard };
export const navGroups: NavGroup[] = [
  { label: "AI Workspace", icon: MessageSquare, items: [
    { label: "Chat Playground", path: "/workspace/chat", icon: MessageSquare },
    { label: "Conversation History", path: "/workspace/history", icon: History },
  ] },
  { label: "Models", icon: Boxes, items: [
    { label: "Model Registry", path: "/models/registry", icon: Boxes },
    { label: "Deployments", path: "/models/deployments", icon: Rocket },
    { label: "Inference Endpoints", path: "/models/endpoints", icon: Plug },
    { label: "Benchmarks", path: "/models/benchmarks", icon: Gauge },
  ] },
  { label: "Agents & Automation", icon: Bot, items: [
    { label: "Agent Studio", path: "/agents/studio", icon: Bot },
    { label: "Workflow Builder", path: "/agents/workflows", icon: Workflow },
    { label: "Execution History", path: "/agents/executions", icon: ListChecks },
    { label: "Tools & MCP", path: "/agents/tools", icon: Wrench },
  ] },
  { label: "Knowledge & RAG", icon: Library, items: [
    { label: "Knowledge Bases", path: "/knowledge/bases", icon: Library },
    { label: "Documents", path: "/knowledge/documents", icon: FileText },
    { label: "Retrieval Playground", path: "/knowledge/retrieval", icon: SearchCode },
  ] },
  { label: "Developer Platform", icon: Code2, items: [
    { label: "API Explorer", path: "/developer/api", icon: BookOpen },
    { label: "API Keys", path: "/developer/keys", icon: KeyRound },
    { label: "Code Assistant", path: "/developer/code", icon: Code2 },
  ] },
  { label: "Observability", icon: Activity, items: [
    { label: "System Monitoring", path: "/observability/monitoring", icon: Activity },
    { label: "Request Traces", path: "/observability/traces", icon: Waypoints },
    { label: "Application Logs", path: "/observability/logs", icon: ScrollText },
  ] },
  { label: "Security & Governance", icon: ShieldCheck, items: [
    { label: "Users & Roles", path: "/security/users", icon: Users },
    { label: "Access Policies", path: "/security/policies", icon: ShieldCheck },
    { label: "Audit Logs", path: "/security/audit", icon: FileClock },
    { label: "Data Protection", path: "/security/data", icon: Lock },
  ] },
  { label: "Infrastructure", icon: Server, items: [
    { label: "Compute & GPUs", path: "/infra/compute", icon: Cpu },
    { label: "Services", path: "/infra/services", icon: Server },
    { label: "Storage", path: "/infra/storage", icon: HardDrive },
    { label: "Offline Artifacts", path: "/infra/artifacts", icon: PackageOpen },
  ] },
];
export const navSettings: NavItem = { label: "Settings", path: "/settings", icon: Settings };

export const allNavItems: (NavItem & { group?: string })[] = [
  navTop, ...navGroups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))), navSettings,
];
