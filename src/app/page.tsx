"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const capabilities = [
  {
    icon: BrainCircuit,
    title: "Explainable intelligence",
    description: "Turns safety observations into clear, reviewable precursor insight.",
  },
  {
    icon: ShieldCheck,
    title: "IOGP aligned",
    description: "Maps reports to Life-Saving Rules for consistent action.",
  },
  {
    icon: Sparkles,
    title: "Built for prevention",
    description: "Surfaces early warning signals before high-risk incidents occur.",
  },
];

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="landing-page min-h-screen lg:h-screen lg:overflow-hidden flex flex-col justify-between bg-[#070b13] text-slate-100 relative isolate">
      {/* Background Video & Overlays covering the full landing canvas */}
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        src="/SIH.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-[#06101f]/75 backdrop-blur-[1px]" />
      <div className="absolute inset-0 -z-10 bg-radial-[at_center_center] from-transparent via-[#06101f]/60 to-[#070b13]/95" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#070b13]/90 via-transparent to-[#070b13]" />

      {/* Header */}
      <header className="landing-header z-50 border-b border-white/[0.08] bg-[#070b13]/80 backdrop-blur-2xl shrink-0">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="SIF Sentinel home">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/[0.10] shadow-lg shadow-amber-500/10">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold tracking-tight text-white sm:text-[15px]">SIF Sentinel</span>
              <span className="mt-0.5 block text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.16em] text-amber-400">Oil India Limited</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-sky-400/25 hover:bg-sky-400/[0.08] hover:text-white sm:inline-flex"
            >
              Command Center
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.035] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-4 max-w-[1440px] mx-auto w-full">
        {/* Hero Section Centered */}
        <section className="flex flex-col items-center text-center animate-fade-in max-w-4xl mx-auto my-auto">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/[0.10] px-3.5 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
            Serious Injury &amp; Fatality Intelligence Platform
          </div>

          <p className="mb-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-sky-200/85">
            Safety intelligence for Oil India Limited
          </p>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-[62px] font-bold leading-[1.08] tracking-tight text-white max-w-3xl">
            Predict &amp; Prevent Fatalities
            <span className="mt-1.5 block text-amber-400">Before High-Risk Incidents Occur</span>
          </h1>

          <p className="mt-4 sm:mt-5 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed text-slate-200">
            SIF Sentinel transforms safety observations, near misses and plant hazard reports into explainable precursor intelligence, helping teams identify serious risk before it becomes an incident.
          </p>

          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-400 hover:shadow-amber-500/30"
            >
              Launch Safety Command Center
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/ingest"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-5 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.14]"
            >
              <UploadCloud className="h-4 w-4" />
              Upload / Ingest Reports
            </Link>
          </div>
        </section>

        {/* Feature Cards Grid (Compact & neat on desktop) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 lg:mt-6 pt-4 border-t border-white/[0.08]">
          {capabilities.map((capability) => (
            <article
              key={capability.title}
              className="premium-card rounded-xl border border-white/[0.07] bg-[#0b111d]/75 p-3.5 sm:p-4 text-center sm:text-left flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0"
            >
              <span className="sm:mb-2.5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/[0.09]">
                <capability.icon className="h-4 w-4 text-sky-400" />
              </span>
              <div>
                <h2 className="font-display text-xs sm:text-sm font-bold text-white">{capability.title}</h2>
                <p className="mt-1 text-[11px] sm:text-xs leading-4 sm:leading-5 text-slate-400">{capability.description}</p>
              </div>
            </article>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#070b13]/60 px-4 sm:px-6 lg:px-8 py-3 shrink-0">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <span className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            SIF Sentinel · Oil India Limited
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Safety intelligence · SIH26165</span>
        </div>
      </footer>
    </div>
  );
}
