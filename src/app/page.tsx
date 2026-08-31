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
    <div className="landing-page min-h-screen overflow-x-hidden bg-[#070b13] text-slate-100">
      <header className="landing-header fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#070b13]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="SIF Sentinel home">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/[0.10] shadow-lg shadow-amber-500/10">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-bold tracking-tight text-white sm:text-base">SIF Sentinel</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-amber-400">Oil India Limited</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.035] px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-sky-400/25 hover:bg-sky-400/[0.08] hover:text-white sm:inline-flex"
            >
              Command Center
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.035] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero relative isolate flex min-h-[680px] items-center overflow-hidden border-b border-white/[0.08] pt-[76px] sm:min-h-[720px]">
          <video
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            src="/SIH.mp4"
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
          />
          <div className="absolute inset-0 -z-10 bg-[#06101f]/30" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06101f]/95 via-[#06101f]/65 to-[#06101f]/20" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#06101f]/75 via-transparent to-[#06101f]/35" />

          <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-3xl animate-fade-in">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/[0.10] px-4 py-2 text-xs font-semibold text-amber-200 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                Serious Injury &amp; Fatality Intelligence Platform
              </div>

              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200/80">
                Safety intelligence for Oil India Limited
              </p>
              <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Predict &amp; Prevent Fatalities
                <span className="mt-2 block text-amber-400">Before High-Risk Incidents Occur</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
                SIF Sentinel transforms safety observations, near misses and plant hazard reports into explainable precursor intelligence, helping teams identify serious risk before it becomes an incident.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-400 hover:shadow-amber-500/30"
                >
                  Launch Safety Command Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/ingest"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.14]"
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload / Ingest Reports
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1440px] gap-4 px-5 py-10 sm:grid-cols-3 sm:px-8 lg:px-12 xl:px-16">
          {capabilities.map((capability) => (
            <article key={capability.title} className="premium-card rounded-2xl border border-white/[0.07] bg-[#0b111d]/80 p-5">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[0.09]">
                <capability.icon className="h-5 w-5 text-sky-400" />
              </span>
              <h2 className="font-display text-sm font-bold text-white">{capability.title}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">{capability.description}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-5 py-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            SIF Sentinel · Oil India Limited
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">Safety intelligence · SIH26165</span>
        </div>
      </footer>
    </div>
  );
}
