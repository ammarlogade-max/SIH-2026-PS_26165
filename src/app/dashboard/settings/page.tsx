"use client";

import { Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function DashboardSettingsPage() {
  const { isDark, theme, setTheme } = useTheme();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-400">Workspace</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Choose the display mode for your SIF Sentinel workspace.</p>
      </header>

      <section className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10">
            <Palette className="h-5 w-5 text-sky-400" />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold text-slate-100">Appearance</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Your preference is saved locally and applied across the landing page and every dashboard module.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              isDark ? "border-sky-400/35 bg-sky-400/10" : "border-surface-border bg-surface hover:bg-surface-hover"
            }`}
          >
            <Moon className="h-5 w-5 text-sky-400" />
            <span>
              <span className="block text-sm font-bold text-slate-100">Dark mode</span>
              <span className="mt-0.5 block text-xs text-slate-400">Low-light command center view</span>
            </span>
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              theme === "light" ? "border-amber-400/45 bg-amber-400/10" : "border-surface-border bg-surface hover:bg-surface-hover"
            }`}
          >
            <Sun className="h-5 w-5 text-amber-400" />
            <span>
              <span className="block text-sm font-bold text-slate-100">Light mode</span>
              <span className="mt-0.5 block text-xs text-slate-400">High-clarity daylight view</span>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
