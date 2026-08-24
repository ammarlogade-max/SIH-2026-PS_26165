"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  Layers,
  Sparkles,
  UploadCloud,
  FileText,
  HelpCircle,
  Activity,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";

const navSections = [
  {
    label: "Safety Intelligence",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview & KPIs", exact: true },
      { href: "/dashboard/density", icon: BarChart3, label: "Precursor Density" },
      { href: "/dashboard/reports", icon: FileSpreadsheet, label: "Safety Reports" },
      { href: "/dashboard/patterns", icon: AlertTriangle, label: "Pattern Callouts" },
    ],
  },
  {
    label: "Ingestion & Analysis",
    items: [
      { href: "/dashboard/ingest", icon: UploadCloud, label: "Ingest Reports" },
      { href: "/dashboard/digest", icon: FileText, label: "Weekly HSE Digest" },
      { href: "/dashboard/models", icon: Layers, label: "Model Metrics & A/B" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-surface overflow-hidden text-slate-100">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-surface-border bg-surface-card flex flex-col justify-between">
        <div>
          {/* Logo & Header */}
          <div className="p-4 border-b border-surface-border">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
                  SIF Sentinel
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                    OIL
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">SIH26165 · Safety AI</div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-6 overflow-y-auto">
            {navSections.map((sec) => (
              <div key={sec.label} className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1.5">
                  {sec.label}
                </div>
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                            : "text-slate-400 hover:text-slate-200 hover:bg-surface-hover"
                        )}
                      >
                        <item.icon className={clsx("w-4 h-4 flex-shrink-0", isActive ? "text-amber-400" : "text-slate-400")} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-surface-border bg-surface/50">
          <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Layer A Engine
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">Active (CPU)</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Classifier:</span>
              <span className="text-slate-400 font-mono">TF-IDF + LogReg</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Rule Standard:</span>
              <span className="text-amber-400/90 font-medium">IOGP 9-Rules</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-surface-border bg-surface-card/60 backdrop-blur-sm px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-slate-200 font-medium">Oil India Limited</span>
            <span>/</span>
            <span className="text-amber-400 font-medium">HSSE Serious Injury & Fatality Precursor Intelligence</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/ingest"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Ingest Reports
            </Link>
            <div className="h-4 w-px bg-surface-border" />
            <div className="text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
              Live System
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface">
          {children}
        </div>
      </main>
    </div>
  );
}
