import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, CircleHelp, PanelLeft, Search, LogOut, User as UserIcon, Settings, BookOpen, Keyboard, LifeBuoy, Menu, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { allNavItems, navGroups, navSettings, navTop } from "./nav";
import { useApp } from "@/services/store";
import type { Environment } from "@/types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { NavLink } from "react-router-dom";

const envStyle: Record<Environment, string> = {
  development: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  staging: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  production: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function AppHeader({ onToggle }: { onToggle: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { environment, setEnvironment, notifications, update, deployments, models, agents, resetDemo } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const current = allNavItems.find((i) => (i.path === "/" ? pathname === "/" : pathname.startsWith(i.path)));
  const unread = notifications.filter((n) => !n.read).length;
  const envDeps = deployments.filter((d) => d.environment === environment);
  const unhealthy = envDeps.filter((d) => d.status === "error").length;
  const health = unhealthy > 0 ? { label: "Degraded", cls: "bg-amber-400" } : { label: "Operational", cls: "bg-emerald-400" };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const go = (p: string) => { setSearchOpen(false); navigate(p); };
  const searchEntities = useMemo(() => [
    ...models.map((m) => ({ label: m.name, hint: "Model", path: "/models/registry" })),
    ...agents.map((a) => ({ label: a.name, hint: "Agent", path: "/agents/studio" })),
    ...deployments.map((d) => ({ label: d.name, hint: "Deployment", path: "/models/deployments" })),
  ], [models, agents, deployments]);

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur">
      <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:inline-flex" onClick={onToggle} aria-label="Toggle sidebar"><PanelLeft className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu className="h-4 w-4" /></Button>
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        {current?.group && <span className="text-muted-foreground hidden lg:inline">{current.group}</span>}
        {current?.group && <span className="text-muted-foreground/50 hidden lg:inline">/</span>}
        <span className="font-medium truncate">{current?.label ?? "Not found"}</span>
      </div>

      <button onClick={() => setSearchOpen(true)} className="ml-4 hidden md:flex h-8 w-72 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-xs text-muted-foreground hover:bg-muted/70">
        <Search className="h-3.5 w-3.5" /> Search pages, models, agents…
        <kbd className="ml-auto rounded border bg-background px-1.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <span className={cn("hidden sm:inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", envStyle[environment])}>{environment === "production" ? "PROD" : environment === "staging" ? "STAGING" : "DEV"}</span>
        <Select value={environment} onValueChange={(v) => { setEnvironment(v as Environment); toast.success(`Switched to ${v}`, { description: "Mock data updated for the selected environment." }); }}>
          <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="Environment"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <button className="hidden lg:flex h-8 items-center gap-2 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent">
              <span className={cn("h-2 w-2 rounded-full pulse-dot", health.cls)} /> {health.label}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 text-sm">
            <p className="font-medium mb-1">System health <span className="text-[10px] text-violet-300 ml-1">SIMULATED</span></p>
            <p className="text-xs text-muted-foreground mb-3">{envDeps.length} deployments in {environment}</p>
            {envDeps.map((d) => (
              <div key={d.id} className="flex justify-between py-1 text-xs"><span className="font-mono">{d.name}</span><span className={d.status === "error" ? "text-red-400" : d.status === "running" ? "text-emerald-400" : "text-muted-foreground"}>{d.status}</span></div>
            ))}
            {envDeps.length === 0 && <p className="text-xs text-muted-foreground">No deployments.</p>}
            <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => navigate("/infra/services")}>View services</Button>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">{unread}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-medium">Notifications</span>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => notifications.forEach((n) => update("notifications", n.id, { read: true }))}><CheckCheck className="h-3 w-3" /> Mark all read</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <button key={n.id} onClick={() => update("notifications", n.id, { read: true })} className={cn("w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-accent/50", !n.read && "bg-primary/5")}>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", n.level === "error" ? "bg-red-400" : n.level === "warning" ? "bg-amber-400" : n.level === "success" ? "bg-emerald-400" : "bg-sky-400")} />
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(n.time)}</span>
                  </div>
                  <p className="mt-0.5 pl-3.5 text-xs text-muted-foreground">{n.body}</p>
                </button>
              ))}
              {notifications.length === 0 && <p className="p-6 text-center text-xs text-muted-foreground">You're all caught up.</p>}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Help"><CircleHelp className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Help</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/developer/api")}><BookOpen className="mr-2 h-4 w-4" /> API documentation</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchOpen(true)}><Keyboard className="mr-2 h-4 w-4" /> Quick search (⌘K)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Prototype", { description: "Support ticketing is not connected in this prototype." })}><LifeBuoy className="mr-2 h-4 w-4" /> Contact platform team</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings?tab=about")}>About this console</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 text-xs font-semibold text-white" aria-label="Profile menu">AM</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm">Ali Moradi</div>
              <div className="text-xs font-normal text-muted-foreground">Administrator · demo identity</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/security/users")}><UserIcon className="mr-2 h-4 w-4" /> Profile & roles</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { resetDemo(); toast.success("Demo data reset"); }}>Reset demo data</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Sign-out is simulated", { description: "Enterprise SSO (OIDC/SAML) will be wired in a later phase." })}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search pages, models, agents, deployments…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Pages">
            {allNavItems.map((i) => (
              <CommandItem key={i.path} value={`${i.group ?? ""} ${i.label}`} onSelect={() => go(i.path)}><i.icon className="mr-2 h-4 w-4" />{i.label}{i.group && <span className="ml-auto text-xs text-muted-foreground">{i.group}</span>}</CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Resources">
            {searchEntities.map((e) => (
              <CommandItem key={e.hint + e.label} value={`${e.hint} ${e.label}`} onSelect={() => go(e.path)}>{e.label}<span className="ml-auto text-xs text-muted-foreground">{e.hint}</span></CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-64 p-0 overflow-y-auto">
          <SheetTitle className="px-4 py-3 text-sm">Navigation</SheetTitle>
          <nav className="px-2 pb-4 space-y-0.5">
            {[navTop, ...navGroups.flatMap((g) => g.items), navSettings].map((i) => (
              <NavLink key={i.path} to={i.path} end={i.path === "/"} onClick={() => setMobileNav(false)} className={({ isActive }) => cn("flex items-center gap-2 rounded px-2 py-1.5 text-sm", isActive ? "bg-accent text-white" : "text-muted-foreground")}>
                <i.icon className="h-4 w-4" /> {i.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
