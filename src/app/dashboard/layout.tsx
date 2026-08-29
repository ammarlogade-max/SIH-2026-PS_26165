"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  Layers,
  UploadCloud,
  FileText,
  Activity,
  AlertTriangle,
  Sun,
  Moon,
  Bot,
  X,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

const navSections = [
  {
    label: "Safety Intelligence",
    items: [
      {
        href: "/dashboard",
        icon: LayoutDashboard,
        label: "Overview & KPIs",
        exact: true,
      },
      {
        href: "/dashboard/density",
        icon: BarChart3,
        label: "Precursor Density",
      },
      {
        href: "/dashboard/reports",
        icon: FileSpreadsheet,
        label: "Safety Reports",
      },
      {
        href: "/dashboard/patterns",
        icon: AlertTriangle,
        label: "Pattern Callouts",
      },
    ],
  },
  {
    label: "Ingestion & Analysis",
    items: [
      {
        href: "/dashboard/ingest",
        icon: UploadCloud,
        label: "Ingest Reports",
      },
      {
        href: "/dashboard/digest",
        icon: FileText,
        label: "Weekly HSE Digest",
      },
      {
        href: "/dashboard/models",
        icon: Layers,
        label: "Model Metrics & A/B",
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [aiOpen, setAiOpen] = useState(false);

  /* ---------------------------------------------
     GLOBAL THEME
  --------------------------------------------- */

  useEffect(() => {
    const saved = localStorage.getItem("sif-theme");

    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sif-theme", theme);

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );
  }, [theme]);

  const isDark = theme === "dark";

  /* ---------------------------------------------
     THEME CLASSES
  --------------------------------------------- */

  const pageBg = isDark
    ? "bg-[#070b14] text-slate-100"
    : "bg-[#f5f7fb] text-slate-900";

  const sidebarBg = isDark
    ? "bg-[#0b111d] border-white/[0.07]"
    : "bg-white border-slate-200";

  const headerBg = isDark
    ? "bg-[#0b111d]/90 border-white/[0.07]"
    : "bg-white/90 border-slate-200";

  /* ---------------------------------------------
     RENDER
  --------------------------------------------- */

  return (
    <div
      className={`flex h-screen overflow-hidden ${pageBg} transition-colors duration-300`}
    >
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`w-64 flex-shrink-0 border-r ${sidebarBg} flex flex-col justify-between`}
      >
        <div className="min-h-0">

          {/* LOGO */}

          <div className="p-5 border-b border-inherit">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center transition-transform group-hover:scale-105">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>

              <div>
                <div className="font-bold text-base tracking-tight flex items-center gap-1.5">
                  SIF Sentinel

                  <span className="text-[9px] bg-amber-500/15 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/25">
                    OIL
                  </span>
                </div>

                <div
                  className={`text-[11px] ${
                    isDark
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  SIH26165 · Safety AI
                </div>
              </div>
            </Link>
          </div>

          {/* NAVIGATION */}

          <nav className="p-3 space-y-7 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.label}>
                <div
                  className={`text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-2 ${
                    isDark
                      ? "text-slate-600"
                      : "text-slate-400"
                  }`}
                >
                  {section.label}
                </div>

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
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          isActive
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : isDark
                            ? "text-slate-400 hover:text-slate-200 hover:bg-white/[0.035]"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        <item.icon
                          className={clsx(
                            "w-4 h-4",
                            isActive
                              ? "text-amber-400"
                              : isDark
                              ? "text-slate-500"
                              : "text-slate-400"
                          )}
                        />

                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* =================================================
            SIDEBAR FOOTER
        ================================================= */}

        <div
          className={`p-3 border-t ${
            isDark
              ? "border-white/[0.07]"
              : "border-slate-200"
          }`}
        >
          <div
            className={`rounded-xl p-3 border ${
              isDark
                ? "bg-[#080d17] border-white/[0.06]"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Layer A Engine
              </span>

              <span className="text-[9px] text-emerald-400 font-mono font-bold">
                ACTIVE
              </span>
            </div>

            <div
              className={`flex justify-between mt-2 text-[10px] ${
                isDark
                  ? "text-slate-600"
                  : "text-slate-400"
              }`}
            >
              <span>Classifier</span>
              <span>TF-IDF + LogReg</span>
            </div>

            <div
              className={`flex justify-between mt-1 text-[10px] ${
                isDark
                  ? "text-slate-600"
                  : "text-slate-400"
              }`}
            >
              <span>Standard</span>
              <span className="text-amber-400">
                IOGP 9-Rules
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* TOP BAR */}

        <header
          className={`h-16 flex-shrink-0 px-6 flex items-center justify-between border-b backdrop-blur-xl ${headerBg}`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">
                Oil India Limited
              </span>

              <span className="text-slate-500">/</span>

              <span className="text-amber-400 truncate">
                HSSE Serious Injury & Fatality Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* AI */}

            <button
              onClick={() => setAiOpen(true)}
              className={`h-10 px-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition ${
                isDark
                  ? "border-purple-500/25 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15"
                  : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">
                AI Assistant
              </span>
              <Sparkles className="w-3 h-3" />
            </button>

            {/* THEME */}

            <button
              onClick={() =>
                setTheme(isDark ? "light" : "dark")
              }
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${
                isDark
                  ? "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
              title={
                isDark
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* LIVE */}

            <div
              className={`hidden md:flex items-center gap-2 ml-2 pl-3 border-l ${
                isDark
                  ? "border-white/[0.07]"
                  : "border-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

              <span
                className={`text-xs ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Live System
              </span>
            </div>
          </div>
        </header>

        {/* VIEWPORT */}

        <div
          className={`flex-1 overflow-y-auto ${
            isDark
              ? "bg-[#070b14]"
              : "bg-[#f5f7fb]"
          } transition-colors duration-300`}
        >
          {children}
        </div>
      </main>

      {/* =================================================
          AI ASSISTANT
      ================================================= */}

      {aiOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none">

          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-auto"
            onClick={() => setAiOpen(false)}
          />

          <div
            className={`absolute right-6 top-20 w-[380px] max-w-[calc(100vw-32px)] rounded-2xl border shadow-2xl pointer-events-auto overflow-hidden ${
              isDark
                ? "bg-[#0d1422] border-purple-500/20"
                : "bg-white border-purple-200"
            }`}
          >

            {/* AI HEADER */}

            <div className="p-4 border-b border-inherit flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>

                <div>
                  <h3 className="font-bold text-sm">
                    AI Safety Assistant
                  </h3>

                  <p className="text-[10px] text-emerald-400">
                    ● Intelligence engine online
                  </p>
                </div>

              </div>

              <button
                onClick={() => setAiOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            {/* AI BODY */}

            <div className="p-5">

              <div
                className={`rounded-xl p-4 ${
                  isDark
                    ? "bg-purple-500/[0.06]"
                    : "bg-purple-50"
                }`}
              >
                <div className="flex gap-3">

                  <Bot className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />

                  <p
                    className={`text-xs leading-relaxed ${
                      isDark
                        ? "text-slate-300"
                        : "text-slate-600"
                    }`}
                  >
                    I can analyze SIF precursor trends,
                    identify recurring safety patterns and
                    explain high-risk observations.
                  </p>

                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-4">

                <button className="text-left p-3 rounded-xl border border-inherit text-xs hover:bg-purple-500/5 transition">
                  🔎 Analyze current risk
                </button>

                <button className="text-left p-3 rounded-xl border border-inherit text-xs hover:bg-purple-500/5 transition">
                  📊 Explain precursor trends
                </button>

                <button className="text-left p-3 rounded-xl border border-inherit text-xs hover:bg-purple-500/5 transition">
                  ⚠️ Find recurring safety patterns
                </button>

              </div>

              <div
                className={`mt-4 text-[10px] ${
                  isDark
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                AI recommendations are generated from
                current SIF Sentinel dashboard intelligence.
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}