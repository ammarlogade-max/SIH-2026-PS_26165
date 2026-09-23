"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
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
  Sun,
  TrendingUp,
  UploadCloud,
  User,
  X,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/components/ThemeProvider";
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [activeRole, setActiveRole] = useState<UserRole>("HSE Officer");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    </div>
  );
}
