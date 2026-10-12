import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups, navSettings, navTop, NavItem } from "./nav";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useApp } from "@/services/store";

function Item({ item, collapsed, nested }: { item: NavItem; collapsed: boolean; nested?: boolean }) {
  const link = (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
          nested && !collapsed && "pl-8",
          isActive ? "bg-sidebar-accent text-white font-medium" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white",
          collapsed && "justify-center px-0",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />}
          <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "")} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const { pathname } = useLocation();
  const env = useApp((s) => s.environment);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((g) => [g.label, g.items.some((i) => pathname.startsWith(i.path))])),
  );
  return (
    <aside className={cn("hidden md:flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200", collapsed ? "w-14" : "w-60")}>
      <div className={cn("flex h-12 items-center gap-2 border-b border-sidebar-border px-3", collapsed && "justify-center px-0")}>
        <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-sky-500 to-violet-600"><Hexagon className="h-4 w-4 text-white" /></div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-white">Sentinel AI</div>
            <div className="text-[10px] text-muted-foreground">Management Console</div>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <Item item={navTop} collapsed={collapsed} />
        {navGroups.map((g) => {
          const activeGroup = g.items.some((i) => pathname.startsWith(i.path));
          const isOpen = collapsed || open[g.label] || activeGroup;
          return (
            <div key={g.label} className="pt-1">
              {!collapsed ? (
                <button
                  onClick={() => setOpen((o) => ({ ...o, [g.label]: !isOpen }))}
                  className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] hover:bg-sidebar-accent/50", activeGroup ? "text-white" : "text-sidebar-foreground/75")}
                  aria-expanded={isOpen}
                >
                  <g.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{g.label}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !isOpen && "-rotate-90")} />
                </button>
              ) : <div className="mx-2 my-1 border-t border-sidebar-border" />}
              {isOpen && <div className="mt-0.5 space-y-0.5">{g.items.map((i) => <Item key={i.path} item={i} collapsed={collapsed} nested />)}</div>}
            </div>
          );
        })}
        <div className="pt-2"><Item item={navSettings} collapsed={collapsed} /></div>
      </nav>
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3 text-[11px] text-muted-foreground space-y-1">
          <div className="flex justify-between"><span>Cluster</span><span className="font-mono text-sidebar-foreground/80">onprem-dc1</span></div>
          <div className="flex justify-between"><span>Environment</span><span className="capitalize text-sidebar-foreground/80">{env}</span></div>
          <div className="flex justify-between"><span>Build</span><span className="font-mono text-sidebar-foreground/80">0.4.0-proto</span></div>
        </div>
      )}
    </aside>
  );
}
