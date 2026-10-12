import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AppLayout } from "@/app/AppLayout";
import Overview from "@/pages/Overview";
import ChatPlayground from "@/pages/workspace/ChatPlayground";
import ConversationHistory from "@/pages/workspace/ConversationHistory";
import ModelRegistry from "@/pages/models/ModelRegistry";
import Deployments from "@/pages/models/Deployments";
import Endpoints from "@/pages/models/Endpoints";
import Benchmarks from "@/pages/models/Benchmarks";
import AgentStudio from "@/pages/agents/AgentStudio";
import WorkflowBuilder from "@/pages/agents/WorkflowBuilder";
import ExecutionHistory from "@/pages/agents/ExecutionHistory";
import ToolsMcp from "@/pages/agents/ToolsMcp";
import KnowledgeBases from "@/pages/knowledge/KnowledgeBases";
import Documents from "@/pages/knowledge/Documents";
import RetrievalPlayground from "@/pages/knowledge/RetrievalPlayground";
import ApiExplorer from "@/pages/developer/ApiExplorer";
import ApiKeys from "@/pages/developer/ApiKeys";
import CodeAssistant from "@/pages/developer/CodeAssistant";
import { Monitoring, Traces, Logs } from "@/pages/observability/Observability";
import { UsersRoles, Policies, AuditLogs, DataProtection } from "@/pages/security/Security";
import { Compute, Services, Storage, Artifacts } from "@/pages/infra/Infrastructure";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Overview />} />
              <Route path="/workspace" element={<Navigate to="/workspace/chat" replace />} />
              <Route path="/workspace/chat" element={<ChatPlayground />} />
              <Route path="/workspace/history" element={<ConversationHistory />} />
              <Route path="/models/registry" element={<ModelRegistry />} />
              <Route path="/models/deployments" element={<Deployments />} />
              <Route path="/models/endpoints" element={<Endpoints />} />
              <Route path="/models/benchmarks" element={<Benchmarks />} />
              <Route path="/agents/studio" element={<AgentStudio />} />
              <Route path="/agents/workflows" element={<WorkflowBuilder />} />
              <Route path="/agents/executions" element={<ExecutionHistory />} />
              <Route path="/agents/tools" element={<ToolsMcp />} />
              <Route path="/knowledge/bases" element={<KnowledgeBases />} />
              <Route path="/knowledge/documents" element={<Documents />} />
              <Route path="/knowledge/retrieval" element={<RetrievalPlayground />} />
              <Route path="/developer/api" element={<ApiExplorer />} />
              <Route path="/developer/keys" element={<ApiKeys />} />
              <Route path="/developer/code" element={<CodeAssistant />} />
              <Route path="/observability/monitoring" element={<Monitoring />} />
              <Route path="/observability/traces" element={<Traces />} />
              <Route path="/observability/logs" element={<Logs />} />
              <Route path="/security/users" element={<UsersRoles />} />
              <Route path="/security/policies" element={<Policies />} />
              <Route path="/security/audit" element={<AuditLogs />} />
              <Route path="/security/data" element={<DataProtection />} />
              <Route path="/infra/compute" element={<Compute />} />
              <Route path="/infra/services" element={<Services />} />
              <Route path="/infra/storage" element={<Storage />} />
              <Route path="/infra/artifacts" element={<Artifacts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
