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
  FileSpreadsheet,
  FileText,
  Flame,
  Layers,
  LayoutDashboard,
  Menu,
  Moon,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Sun,
  TrendingUp,
  TriangleAlert,
  UploadCloud,
  X,
  ArrowLeft,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/components/ThemeProvider";
import { useAIAssistant } from "@/context/AIAssistantContext";

const navSections = [
  {
    label: "Safety intelligence",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Command Center", exact: true },
      { href: "/dashboard/ingest?tab=manual", icon: ShieldAlert, label: "SIF Precursor Detection" },
      { href: "/dashboard/patterns", icon: BrainCircuit, label: "Risk Intelligence" },
      { href: "/dashboard/density", icon: BarChart3, label: "Facility Density" },
      { href: "/dashboard#life-saving-rules", icon: ShieldCheck, label: "Life-Saving Rules" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/ingest", icon: UploadCloud, label: "Report Ingestion" },
      { href: "/dashboard/reports", icon: FileText, label: "Safety Reports & Alerts" },
      { href: "/dashboard/digest", icon: TrendingUp, label: "Weekly HSE Digest" },
    ],
  },
  {
    label: "AI & system",
    items: [
      { href: "/dashboard/ingest?tab=manual", icon: Sparkles, label: "Explainable AI" },
      { href: "/dashboard/models", icon: Layers, label: "Model Metrics" },
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
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
  // Retained state keeps the legacy panel dormant while the shared assistant drawer
  // is now the single user-facing AI experience.
  const [aiOpen, setAiOpen] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyResponseStatus | null>(null);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyPanelOpen, setEmergencyPanelOpen] = useState(false);
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
      <aside className="hidden w-72 shrink-0 border-r border-surface-border bg-surface-card/95 lg:flex lg:flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <Link
            href="/dashboard"
            className="mb-8 flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-surface-hover"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 shadow-sm">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            </span>
            <span className="min-w-0">
              <span className="font-display flex items-center gap-2 text-[15px] font-bold text-slate-100">
                SIF Sentinel
                <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.16em] text-amber-400">
                  OIL
                </span>
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                SIH26165 · Safety intelligence
              </span>
            </span>
          </Link>

          <nav className="space-y-7" aria-label="Dashboard navigation">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {section.label}
                </p>
                <div className="space-y-1">
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
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
                          isActive
                            ? "border border-sky-400/20 bg-sky-400/10 text-sky-400 shadow-sm"
                            : "border border-transparent text-slate-400 hover:border-surface-border hover:bg-surface-hover hover:text-slate-100"
                        )}
                      >
                        <item.icon
                          className={clsx(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-surface-border p-3">
          <div className="rounded-2xl border border-surface-border bg-surface/55 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                Layer A engine
              </span>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.14em] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
              <span>Classifier</span>
              <span className="font-mono text-slate-400">TF-IDF + LogReg</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
              <span>Standard</span>
              <span className="font-medium text-amber-400">IOGP 9-Rules</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-surface-border bg-surface-card/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Oil India Limited
            </p>
            <p className="mt-0.5 truncate font-display text-sm font-semibold text-slate-100 sm:text-[15px]">
              SIF Sentinel · HSSE Serious Injury & Fatality Intelligence
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileNavOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface-card text-slate-400 transition hover:bg-surface-hover hover:text-slate-100 lg:hidden"
              aria-label={mobileNavOpen ? "Close dashboard navigation" : "Open dashboard navigation"}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <Link
              href="/dashboard/reports"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface-card text-slate-400 transition hover:bg-surface-hover hover:text-slate-100"
              title="Alerts and notifications"
              aria-label="Alerts and notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
            </Link>

            <button
              onClick={openAssistant}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 text-xs font-bold text-violet-300 transition hover:bg-violet-500/16"
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI assistant</span>
              <Sparkles className="hidden h-3.5 w-3.5 sm:block" />
            </button>

            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface-card text-slate-400 transition hover:bg-surface-hover hover:text-slate-100"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="hidden items-center gap-2 border-l border-surface-border pl-3 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-400">Live system</span>
            </div>
          </div>
        </header>

        {mobileNavOpen && (
          <nav className="absolute left-3 right-3 top-[84px] z-50 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-surface-border bg-surface-card p-3 shadow-2xl lg:hidden" aria-label="Mobile dashboard navigation">
            {navSections.map((section) => (
              <div key={section.label} className="mb-4 last:mb-0">
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{section.label}</p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const routeHref = item.href.split(/[?#]/)[0];
                    const isActive = item.exact ? pathname === routeHref : pathname.startsWith(routeHref);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={clsx(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                          isActive ? "bg-sky-400/10 text-sky-400" : "text-slate-300 hover:bg-surface-hover"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
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

      {false && (
        <div className="fixed inset-0 z-[100]">
          <button
            className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setAiOpen(false)}
            aria-label="Close AI assistant"
          />
          <section className="absolute right-4 top-4 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-surface-border bg-surface-card shadow-2xl sm:right-6 sm:top-6">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10">
                  <Bot className="h-5 w-5 text-violet-400" />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-100">AI safety assistant</h2>
                  <p className="mt-0.5 text-[10px] font-medium text-emerald-400">● Intelligence engine online</p>
                </div>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-surface-hover hover:text-slate-100"
                aria-label="Close AI assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border border-violet-400/15 bg-violet-500/[0.07] p-4">
                <div className="flex gap-3">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                  <p className="text-xs leading-relaxed text-slate-300">
                    I can analyze SIF precursor trends, identify recurring safety patterns, and explain high-risk observations.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {[
                  "Analyze current risk",
                  "Explain precursor trends",
                  "Find recurring safety patterns",
                ].map((label) => (
                  <button
                    key={label}
                    onClick={() => setAssistantResponse(
                      label === "Analyze current risk"
                        ? "Open Facility Density to compare current precursor exposure across sites."
                        : label === "Explain precursor trends"
                        ? "Open the overview and use the trend controls to review alert movement over time."
                        : "Open Pattern Callouts to review repeated safety risks requiring attention."
                    )}
                    className="rounded-xl border border-surface-border bg-surface/45 px-3.5 py-3 text-left text-xs font-semibold text-slate-300 transition hover:border-violet-400/25 hover:bg-violet-500/[0.06] hover:text-slate-100"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {assistantResponse && (
                <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs leading-relaxed text-slate-300">
                  {assistantResponse}
                </p>
              )}

              <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
                AI recommendations are generated from current SIF Sentinel dashboard intelligence.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
