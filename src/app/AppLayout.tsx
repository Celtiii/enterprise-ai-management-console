import { Outlet } from "react-router-dom";
import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { FlaskConical } from "lucide-react";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onToggle={() => setCollapsed((c) => !c)} />
        <div className="flex items-center gap-2 border-b border-violet-500/15 bg-violet-500/[0.05] px-4 py-1 text-[11px] text-violet-200/80">
          <FlaskConical className="h-3 w-3" />
          Prototype console — all metrics, inference, and operations are simulated locally. No models, services, or security controls are connected.
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-4 lg:p-6"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
