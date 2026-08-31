"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  FileSpreadsheet,
  FileText,
  Layers,
  LayoutDashboard,
  Menu,
  Moon,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  UploadCloud,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/components/ThemeProvider";

const navSections = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Command Center", exact: true },
      { href: "/dashboard/ingest", icon: UploadCloud, label: "Report Ingestion" },
      { href: "/dashboard/patterns", icon: BrainCircuit, label: "Risk Intelligence" },
      { href: "/dashboard/density", icon: BarChart3, label: "Facility Density" },
      { href: "/dashboard/reports", icon: Bell, label: "Alerts & Notifications" },
    ],
  },
  {
    label: "Analysis & configuration",
    items: [
      { href: "/dashboard#life-saving-rules", icon: ShieldCheck, label: "Life-Saving Rules" },
      { href: "/dashboard/digest", icon: TrendingUp, label: "Analytics" },
      { href: "/dashboard/models", icon: Layers, label: "AI model metrics" },
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [aiOpen, setAiOpen] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [assistantAction, setAssistantAction] = useState<{ href: string; label: string } | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const openAssistant = () => setAiOpen(true);
    window.addEventListener("open-ai-assistant", openAssistant);
    return () => window.removeEventListener("open-ai-assistant", openAssistant);
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
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

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
              onClick={() => setAiOpen(true)}
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
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
          <div className="dashboard-content">{children}</div>
        </div>
      </main>

      {aiOpen && (
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
                    onClick={() => {
                      if (label === "Analyze current risk") {
                        setAssistantResponse("Facility Density shows the current precursor exposure for each operational site.");
                        setAssistantAction({ href: "/dashboard/density", label: "Open Facility Density" });
                      } else if (label === "Explain precursor trends") {
                        setAssistantResponse("The command center visualizes actual report volume and SIF precursor signals by reporting date.");
                        setAssistantAction({ href: "/dashboard#analytics", label: "Open Alert Trend" });
                      } else {
                        setAssistantResponse("Pattern Callouts identifies repeated safety risks and the facilities that need attention.");
                        setAssistantAction({ href: "/dashboard/patterns", label: "Open Pattern Callouts" });
                      }
                    }}
                    className="rounded-xl border border-surface-border bg-surface/45 px-3.5 py-3 text-left text-xs font-semibold text-slate-300 transition hover:border-violet-400/25 hover:bg-violet-500/[0.06] hover:text-slate-100"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {assistantResponse && (
                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
                  <p className="text-xs leading-relaxed text-slate-300">{assistantResponse}</p>
                  {assistantAction && (
                    <Link
                      href={assistantAction.href}
                      onClick={() => setAiOpen(false)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      {assistantAction.label} <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
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
