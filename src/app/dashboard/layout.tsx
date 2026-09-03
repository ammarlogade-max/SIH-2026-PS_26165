"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Flame,
  History,
  Layers,
  LayoutDashboard,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Sun,
  TrendingUp,
  TriangleAlert,
  UploadCloud,
  User,
  X,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/components/ThemeProvider";
import { useAIAssistant } from "@/context/AIAssistantContext";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";
import { UserRole } from "@/lib/types";

const navSections = [
  {
    label: "Safety Intelligence",
    items: [
      { id: "01", href: "/dashboard", icon: LayoutDashboard, label: "Command Center", exact: true },
      { id: "02", href: "/dashboard/reports", icon: FileText, label: "Report Intelligence", exact: true },
      { id: "03", href: "/dashboard/reports?status=sif", icon: ShieldAlert, label: "SIF Exposures" },
      { id: "04", href: "/dashboard/patterns", icon: BrainCircuit, label: "Precursor Patterns" },
      { id: "05", href: "/dashboard/rules", icon: ShieldCheck, label: "Life-Saving Rules" },
      { id: "06", href: "/dashboard/actions", icon: ClipboardCheck, label: "Corrective Actions" },
    ],
  },
  {
    label: "Analytics & ML",
    items: [
      { id: "07", href: "/dashboard/density", icon: BarChart3, label: "Precursor Density" },
      { id: "08", href: "/dashboard/models", icon: Layers, label: "Model Performance" },
      { id: "09", href: "/dashboard/investigate", icon: Search, label: "Investigation" },
      { id: "10", href: "/dashboard/digest", icon: TrendingUp, label: "Executive Digest" },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "11", href: "/dashboard/facilities", icon: Building2, label: "Facilities" },
      { id: "12", href: "/dashboard/ingest", icon: UploadCloud, label: "Ingest Reports" },
    ],
  },
  {
    label: "System & Governance",
    items: [
      { id: "13", href: "/dashboard/audit", icon: History, label: "Audit Trail" },
      { id: "14", href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
];

type EmergencyResponseStatus = {
  incidentId: string;
  mode: "demo" | "live";
  ambulanceEtaMinutes: number;
  fireBrigadeEtaMinutes: number;
  createdAt: string;
  lastUpdatedAt: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { openAssistant } = useAIAssistant();
  const [activeRole, setActiveRole] = useState<UserRole>("HSE Officer");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyResponseStatus | null>(null);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyPanelOpen, setEmergencyPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sif_user_role") as UserRole | null;
      if (saved) setActiveRole(saved);

      const handleRoleUpdate = () => {
        const updated = localStorage.getItem("sif_user_role") as UserRole | null;
        if (updated) setActiveRole(updated);
      };

      window.addEventListener("sif_role_changed", handleRoleUpdate);
      window.addEventListener("storage", handleRoleUpdate);
      return () => {
        window.removeEventListener("sif_role_changed", handleRoleUpdate);
        window.removeEventListener("storage", handleRoleUpdate);
      };
    } catch (_) {}
  }, []);

  const switchRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    try {
      localStorage.setItem("sif_user_role", newRole);
      window.dispatchEvent(new Event("sif_role_changed"));
    } catch (_) {}
    setRoleMenuOpen(false);
  };
  const ambulanceProgress = emergencyStatus ? Math.max(0, Math.min(100, (1 - emergencyStatus.ambulanceEtaMinutes / 8) * 100)) : 0;
  const fireBrigadeProgress = emergencyStatus ? Math.max(0, Math.min(100, (1 - emergencyStatus.fireBrigadeEtaMinutes / 11) * 100)) : 0;

  const triggerEmergencyResponse = async () => {
    setEmergencyLoading(true);
    setEmergencyError(null);
    try {
      const response = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Emergency dispatch could not be started.");
      setEmergencyStatus(payload.status);
    } catch (error) {
      setEmergencyError(error instanceof Error ? error.message : "Emergency dispatch could not be started.");
    } finally {
      setEmergencyLoading(false);
    }
  };

  const refreshEmergencyResponse = async () => {
    if (!emergencyStatus) return;
    setEmergencyLoading(true);
    setEmergencyError(null);
    try {
      const response = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh", incidentId: emergencyStatus.incidentId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Response times could not be refreshed.");
      setEmergencyStatus(payload.status);
    } catch (error) {
      setEmergencyError(error instanceof Error ? error.message : "Response times could not be refreshed.");
    } finally {
      setEmergencyLoading(false);
    }
  };

  const endTrainingResponse = async () => {
    if (!emergencyStatus) return;
    setEmergencyLoading(true);
    setEmergencyError(null);
    try {
      const response = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", incidentId: emergencyStatus.incidentId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Training alert could not be ended.");
      setEmergencyStatus(null);
    } catch (error) {
      setEmergencyError(error instanceof Error ? error.message : "Training alert could not be ended.");
    } finally {
      setEmergencyLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const restoreEmergencyResponse = async () => {
      try {
        const response = await fetch("/api/emergency");
        if (response.status === 404) return;
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Emergency status could not be restored.");
        if (active) setEmergencyStatus(payload.status);
      } catch (error) {
        if (active) setEmergencyError(error instanceof Error ? error.message : "Emergency status could not be restored.");
      }
    };
    void restoreEmergencyResponse();
    return () => { active = false; };
  }, []);

  return (
    <div className="dashboard-frame flex h-screen min-w-0 overflow-hidden">
      <aside className="hidden w-64 shrink-0 border-r border-surface-border bg-surface-card lg:flex lg:flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
          {/* Industrial Brand Header */}
          <Link
            href="/dashboard"
            className="mb-4 flex items-center gap-2.5 border-b border-surface-border/80 px-2 pb-3.5 transition hover:bg-surface-hover rounded-sm"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-amber-500/40 bg-amber-500/10 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  SIF Sentinel
                </span>
                <span className="font-mono rounded border border-amber-500/40 bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold text-amber-400">
                  OIL
                </span>
              </div>
              <span className="block text-[10px] font-medium tracking-tight text-slate-400">
                Oil India Limited · HSE Command
              </span>
            </div>
          </Link>

          {/* Industrial Numbered Nav */}
          <nav className="space-y-4" aria-label="Dashboard navigation">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const routeHref = item.href.split(/[?#]/)[0];
                    const isActive = item.exact
                      ? pathname === routeHref
                      : pathname.startsWith(routeHref);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "group flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
                          isActive
                            ? "border-l-2 border-amber-400 bg-surface-raised font-semibold text-amber-400"
                            : "border-l-2 border-transparent text-slate-400 hover:bg-surface-hover hover:text-slate-100"
                        )}
                      >
                        <span className="font-mono text-[10px] font-bold opacity-60 group-hover:opacity-100">
                          {item.id}
                        </span>
                        <item.icon
                          className={clsx(
                            "h-3.5 w-3.5 shrink-0 transition-colors",
                            isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Operational Engine Telemetry Panel */}
        <div className="border-t border-surface-border p-2.5">
          <div className="rounded border border-surface-border bg-surface-raised/80 p-2 text-[10px] space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Activity className="h-3 w-3 text-emerald-400" />
                Inference Engine
              </span>
              <span className="font-mono flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-mono text-[9px]">
              <span>Layer A:</span>
              <span className="text-slate-300">TF-IDF + LR (CPU)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-mono text-[9px]">
              <span>Taxonomy:</span>
              <span className="text-amber-400 font-medium">9 IOGP Rules</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border bg-surface-card px-3 sm:px-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded border border-surface-border bg-surface text-slate-400 transition hover:bg-surface-hover hover:text-slate-100 lg:hidden"
              aria-label={mobileNavOpen ? "Close dashboard navigation" : "Open dashboard navigation"}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight text-slate-100 truncate">
                  OIL INDIA LIMITED
                </span>
                <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono">/</span>
                <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium truncate">
                  Safety Intelligence Command Center
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* System Status Telemetry */}
            <div className="hidden xl:flex items-center gap-2 border-r border-surface-border pr-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-mono text-[10px] text-slate-400">TELEMETRY: LIVE</span>
            </div>

            {/* Active Role Selector */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen((prev) => !prev)}
                className="inline-flex h-7 items-center gap-1.5 rounded border border-surface-border bg-surface px-2 text-[11px] font-semibold text-slate-200 transition hover:border-amber-400/40 hover:bg-surface-hover"
                title="Switch active user role simulation"
                aria-label="Switch active user role simulation"
                aria-expanded={roleMenuOpen}
              >
                <User className="h-3 w-3 text-amber-400" />
                <span className="hidden md:inline text-slate-400 font-normal">Role:</span>
                <span className="font-bold text-slate-100 truncate max-w-[80px] sm:max-w-none">{activeRole}</span>
                <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
                  <div className="absolute right-0 top-9 z-50 w-52 rounded border border-surface-border bg-surface-card p-1.5 shadow-xl">
                    <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-surface-border mb-1">
                      Select User Persona
                    </div>
                    {(["HSE Officer", "Supervisor", "Plant Manager", "Field Observer", "Admin"] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => switchRole(r)}
                        className={clsx(
                          "flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs transition text-left",
                          activeRole === r
                            ? "bg-amber-500/15 text-amber-300 font-bold"
                            : "text-slate-300 hover:bg-surface-hover hover:text-white"
                        )}
                      >
                        <span>{r}</span>
                        {activeRole === r && <CheckCircle2 className="h-3 w-3 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={openAssistant}
              className="inline-flex h-7 items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              <Bot className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Safety Assistant</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-7 w-7 items-center justify-center rounded border border-surface-border bg-surface text-slate-400 transition hover:bg-surface-hover hover:text-slate-100"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </header>

        {mobileNavOpen && (
          <nav className="absolute left-2 right-2 top-14 z-50 max-h-[calc(100vh-4.5rem)] overflow-y-auto rounded border border-surface-border bg-surface-card p-2.5 shadow-2xl lg:hidden" aria-label="Mobile dashboard navigation">
            {navSections.map((section) => (
              <div key={section.label} className="mb-3 last:mb-0">
                <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const routeHref = item.href.split(/[?#]/)[0];
                    const isActive = item.exact ? pathname === routeHref : pathname.startsWith(routeHref);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={clsx(
                          "flex items-center gap-2.5 rounded-sm px-2 py-2 text-xs transition",
                          isActive ? "border-l-2 border-amber-400 bg-surface-raised font-bold text-amber-400" : "text-slate-300 hover:bg-surface-hover"
                        )}
                      >
                        <span className="font-mono text-[10px] text-slate-500">{item.id}</span>
                        <item.icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        )}

        <div className="flex-1 overflow-y-auto">
          {pathname !== "/dashboard" && (
            <div className="flex h-14 items-end px-4 pb-2 sm:px-6">
              <button
                onClick={() => router.back()}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-surface-border bg-surface-card/95 px-2.5 text-[11px] font-semibold text-slate-400 shadow-sm transition hover:bg-surface-hover hover:text-slate-100"
                aria-label="Go back"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          )}
          <div className="dashboard-content">{children}</div>
        </div>
      </main>

      <section
        className="fixed bottom-4 left-4 z-[60] w-[min(20rem,calc(100vw-2rem))]"
        aria-live="polite"
        aria-label="Emergency response control"
      >
        <button
          onClick={() => setEmergencyPanelOpen((open) => !open)}
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/50 bg-red-600 text-amber-200 shadow-[0_12px_28px_rgb(127_29_29_/_0.48)] transition hover:scale-105 hover:bg-red-500 focus-visible:outline-red-200"
          aria-label={emergencyPanelOpen ? "Close emergency response panel" : "Open emergency response panel"}
          aria-expanded={emergencyPanelOpen}
          title="Emergency response"
        >
          <TriangleAlert className="h-6 w-6 stroke-[2.75]" />
          {emergencyStatus && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-red-700 bg-emerald-300" />}
        </button>

        {emergencyPanelOpen && (!emergencyStatus ? (
          <div className="mt-3">
          <button
            onClick={triggerEmergencyResponse}
            disabled={emergencyLoading}
            className="group flex h-14 items-center gap-3 rounded-2xl border border-amber-200/50 bg-red-600 px-4 text-left text-white shadow-[0_12px_32px_rgb(127_29_29_/_0.45)] transition hover:bg-red-500 focus-visible:outline-red-200 disabled:cursor-wait disabled:opacity-80"
            aria-label="Trigger emergency response demo"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-300 text-slate-950 shadow-sm transition group-hover:scale-105">
              <TriangleAlert className="h-5 w-5 stroke-[2.75]" />
            </span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-red-100">Critical incident</span>
              <span className="block text-sm font-bold">{emergencyLoading ? "Contacting dispatch..." : "Emergency response"}</span>
            </span>
          </button>
          {emergencyError && <p className="mt-2 rounded-lg border border-red-400/30 bg-slate-950/95 px-3 py-2 text-[10px] font-medium text-red-200">{emergencyError}</p>}
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-red-400/35 bg-slate-950/95 shadow-[0_18px_45px_rgb(127_29_29_/_0.42)] backdrop-blur-xl">
            <div className="h-1 bg-gradient-to-r from-red-500 via-orange-400 to-amber-300" />
            <div className="flex items-center justify-between border-b border-red-400/20 bg-red-500/15 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 text-white">
                  <Siren className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-300">Emergency response</p>
                  <p className="text-xs font-semibold text-white">{emergencyStatus.mode === "live" ? "Dispatch acknowledged · teams en route" : "Training alert active · teams en route"}</p>
                </div>
              </div>
              <button
                onClick={() => setEmergencyPanelOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-300/25 bg-red-500/10 text-red-100 transition hover:bg-red-500/25"
                aria-label="Close emergency response panel"
                title="Close panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3 p-3">
              <div className="rounded-xl border border-sky-400/20 bg-sky-400/[0.07] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                    <Ambulance className="h-4 w-4 text-sky-400" />
                    Ambulance
                  </span>
                  <span className="font-mono text-xs font-bold text-sky-300">{emergencyStatus.ambulanceEtaMinutes === 0 ? "Arrived" : `${emergencyStatus.ambulanceEtaMinutes} min`}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400"><span>{emergencyStatus.ambulanceEtaMinutes === 0 ? "Arrived at incident" : "En route to incident"}</span><span>ETA</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sky-950/80"><div className="h-full rounded-full bg-sky-400 transition-all duration-500" style={{ width: `${ambulanceProgress}%` }} /></div>
              </div>
              <div className="rounded-xl border border-orange-400/20 bg-orange-400/[0.07] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                    <Flame className="h-4 w-4 text-orange-400" />
                    Fire brigade
                  </span>
                  <span className="font-mono text-xs font-bold text-orange-300">{emergencyStatus.fireBrigadeEtaMinutes === 0 ? "Arrived" : `${emergencyStatus.fireBrigadeEtaMinutes} min`}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400"><span>{emergencyStatus.fireBrigadeEtaMinutes === 0 ? "Arrived at incident" : "En route to incident"}</span><span>ETA</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-950/80"><div className="h-full rounded-full bg-orange-400 transition-all duration-500" style={{ width: `${fireBrigadeProgress}%` }} /></div>
              </div>
              <div className="flex items-center justify-between gap-3 px-1">
                <button onClick={() => void refreshEmergencyResponse()} disabled={emergencyLoading} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.08] px-2 py-1.5 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-400/[0.16] disabled:cursor-wait disabled:opacity-60">
                  <RefreshCw className="h-3 w-3" />
                  {emergencyLoading ? "Updating..." : "Refresh ETA"}
                </button>
                <p className="text-right text-[10px] leading-relaxed text-slate-400">{emergencyStatus.mode === "live" ? "Dispatcher acknowledgement recorded." : "Use Refresh ETA for the latest update."}</p>
                {emergencyStatus.mode === "demo" && <button onClick={endTrainingResponse} disabled={emergencyLoading} className="shrink-0 text-[10px] font-bold text-red-300 transition hover:text-red-200 disabled:opacity-60">End drill</button>}
              </div>
              {emergencyError && <p className="px-1 text-[10px] font-medium text-red-300">{emergencyError}</p>}
              <p className="px-1 text-[10px] font-medium text-emerald-400">Last synced {new Date(emergencyStatus.lastUpdatedAt).toLocaleTimeString()} · incident logged</p>
            </div>
          </div>
        ))}
      </section>

      {/* Global AI Safety Assistant Drawer */}
      <AIAssistantDrawer />
    </div>
  );
}
