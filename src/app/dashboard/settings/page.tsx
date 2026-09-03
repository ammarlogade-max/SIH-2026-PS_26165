"use client";

import { useState, useEffect } from "react";
import {
  Moon,
  Palette,
  Sun,
  RotateCcw,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  User,
  Activity,
  Layers,
  Sparkles,
  Database,
  Building2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/components/ThemeProvider";
import { UserRole } from "@/lib/types";

export default function DashboardSettingsPage() {
  const { isDark, theme, setTheme } = useTheme();
  const [currentRole, setCurrentRole] = useState<UserRole>("HSE Officer");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sif_user_role") as UserRole | null;
    if (saved) setCurrentRole(saved);
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem("sif_user_role", role);
  };

  const handleResetWorkspace = async (mode: "benchmark" | "clear") => {
    const confirmMsg =
      mode === "benchmark"
        ? "Restore standard benchmark demo dataset? This will load 20 authentic synthetic industrial safety observations and CAPA records for Oil India Limited."
        : "Clear all reports and start with a blank workspace?";
    if (!confirm(confirmMsg)) return;

    setResetting(true);
    setResetSuccess(null);
    setResetError(null);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setResetSuccess(data.message || "Workspace updated successfully");
      setTimeout(() => setResetSuccess(null), 4000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">
          Governance &amp; Configuration
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-100 sm:text-3xl">
          System Settings &amp; Roles
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Configure active user role, display appearance, and seed or reset demo benchmark data for presentations.
        </p>
      </header>

      {/* Role Switcher */}
      <section className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-400">
            <User className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-slate-100">Active User Role Simulation</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Switch role to experience role-based controls, verification authority, and action assignment across SIF Sentinel.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              role: "HSE Officer" as UserRole,
              title: "HSE Lead Officer",
              desc: "Full verification authority, barrier sign-offs, and classification management.",
            },
            {
              role: "Supervisor" as UserRole,
              title: "Site Supervisor",
              desc: "Field action execution, PTW verification, and tool-box briefing coordination.",
            },
            {
              role: "Plant Manager" as UserRole,
              title: "Asset / Plant Manager",
              desc: "Facility risk governance, executive sign-offs, and stop-work authority.",
            },
            {
              role: "Field Observer" as UserRole,
              title: "Field Operator / Observer",
              desc: "Quick observation ingestion, mobile near-miss capture, zero-barrier reporting.",
            },
            {
              role: "Admin" as UserRole,
              title: "System Administrator",
              desc: "Audit log inspection, benchmark reset, and ML pipeline oversight.",
            },
          ].map((item) => {
            const isSelected = currentRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => handleRoleSelect(item.role)}
                className={clsx(
                  "flex flex-col justify-between rounded-xl border p-4 text-left transition",
                  isSelected
                    ? "border-amber-400/50 bg-amber-500/10 shadow-sm"
                    : "border-surface-border bg-surface hover:bg-surface-hover"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-slate-100">{item.title}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{item.desc}</p>
                </div>
                <span className="mt-3 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Role: {item.role}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Demo Reset & Data Management */}
      <section className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <RotateCcw className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-slate-100">Demo Presentation Dataset</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Restore the vetted 20-observation industrial benchmark dataset for live demonstrations to judges, or clear the workspace.
            </p>
          </div>
        </div>

        {resetSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {resetError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3.5 text-xs text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{resetError}</span>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-surface-border bg-surface p-4">
            <h3 className="font-display text-sm font-bold text-slate-200">
              Restore Benchmark Demo Dataset
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Seeds 20 realistic Oil India Limited near-misses across drilling rigs, GGS, CTF, and pipeline headers, with corresponding CAPA actions and audit trails.
            </p>
            <button
              onClick={() => handleResetWorkspace("benchmark")}
              disabled={resetting}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50"
            >
              <RefreshCw className={clsx("h-3.5 w-3.5", resetting && "animate-spin")} />
              {resetting ? "Resetting..." : "Restore Benchmark Data"}
            </button>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-4">
            <h3 className="font-display text-sm font-bold text-slate-200">
              Clear Workspace (Blank Slate)
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Removes all observations, classifications, and CAPA actions so you can test live manual report ingestion and bulk CSV uploads from scratch.
            </p>
            <button
              onClick={() => handleResetWorkspace("clear")}
              disabled={resetting}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Workspace
            </button>
          </div>
        </div>
      </section>

      {/* System Architecture & Status */}
      <section className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-slate-100">System Architecture &amp; Engine Status</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Technical specifications and active operational parameters for Oil India Limited.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-surface-border bg-surface p-3.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Storage Layer</span>
            <p className="mt-1 font-display text-sm font-bold text-slate-200">Atomic File / Cloud DB</p>
            <p className="mt-0.5 text-[10px] text-emerald-400">Local Cache + Supabase Ready</p>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-3.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Layer A Classifier</span>
            <p className="mt-1 font-display text-sm font-bold text-slate-200">TF-IDF + LogReg</p>
            <p className="mt-0.5 text-[10px] text-emerald-400">Deterministic &amp; Offline Ready</p>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-3.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Safety Framework</span>
            <p className="mt-1 font-display text-sm font-bold text-slate-200">IOGP Report 459</p>
            <p className="mt-0.5 text-[10px] text-amber-400">9 Life-Saving Rules</p>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-3.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Explainable AI</span>
            <p className="mt-1 font-display text-sm font-bold text-slate-200">Directional N-Grams</p>
            <p className="mt-0.5 text-[10px] text-sky-400">Transparent Feature Weights</p>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-400">
            <Palette className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-slate-100">Appearance Mode</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Toggle between low-light industrial command center dark mode and high-contrast daylight mode.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setTheme("dark")}
            className={clsx(
              "flex items-center gap-3 rounded-xl border p-4 text-left transition",
              isDark
                ? "border-sky-400/35 bg-sky-400/10 shadow-sm"
                : "border-surface-border bg-surface hover:bg-surface-hover"
            )}
          >
            <Moon className="h-5 w-5 text-sky-400" />
            <div>
              <span className="block text-sm font-bold text-slate-100">Dark Mode</span>
              <span className="mt-0.5 block text-xs text-slate-400">Low-light industrial command center view</span>
            </div>
          </button>

          <button
            onClick={() => setTheme("light")}
            className={clsx(
              "flex items-center gap-3 rounded-xl border p-4 text-left transition",
              theme === "light"
                ? "border-amber-400/45 bg-amber-400/10 shadow-sm"
                : "border-surface-border bg-surface hover:bg-surface-hover"
            )}
          >
            <Sun className="h-5 w-5 text-amber-400" />
            <div>
              <span className="block text-sm font-bold text-slate-100">Light Mode</span>
              <span className="mt-0.5 block text-xs text-slate-400">High-clarity daylight audit view</span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
