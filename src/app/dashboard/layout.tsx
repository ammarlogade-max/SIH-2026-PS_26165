"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  FileSpreadsheet,
  FileText,
  Layers,
  LayoutDashboard,
  Moon,
  ShieldAlert,
  Sparkles,
  Sun,
  UploadCloud,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/components/ThemeProvider";

const navSections = [
  {
    label: "Safety intelligence",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview & KPIs", exact: true },
      { href: "/dashboard/density", icon: BarChart3, label: "Precursor density" },
      { href: "/dashboard/reports", icon: FileSpreadsheet, label: "Safety reports" },
      { href: "/dashboard/patterns", icon: AlertTriangle, label: "Pattern callouts" },
    ],
  },
  {
    label: "Ingestion & analysis",
    items: [
      { href: "/dashboard/ingest", icon: UploadCloud, label: "Ingest reports" },
      { href: "/dashboard/digest", icon: FileText, label: "Weekly HSE digest" },
      { href: "/dashboard/models", icon: Layers, label: "Model metrics & A/B" },
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
              HSSE Serious Injury & Fatality Intelligence
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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
