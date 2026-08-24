"use client";
import Link from "next/link";
import {
  ShieldAlert,
  BarChart3,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Cpu,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
} from "lucide-react";

const capabilities = [
  {
    icon: ShieldAlert,
    title: "Binary SIF Precursor Classifier (Layer A)",
    desc: "Deterministic TF-IDF & Logistic Regression CPU engine identifying potential high-severity precursors with 91.8% precision.",
  },
  {
    icon: Layers,
    title: "IOGP 9 Life-Saving Rules Multi-Class Tagging",
    desc: "Categorizes safety observations into Work at Height, Energy Isolation, Confined Space, Hot Work, Line of Fire, and more.",
  },
  {
    icon: BarChart3,
    title: "Facility Precursor Density Index",
    desc: "Computes (SIF Reports / Total Reports) × 100% to rank Oil India installations and flag high-risk operational hot-spots.",
  },
  {
    icon: AlertTriangle,
    title: "Recurring Pattern Callouts",
    desc: "Detects dangerous safety clusters where ≥2 precursor observations recur at the same facility under identical risk categories.",
  },
  {
    icon: Cpu,
    title: "Transparent Mathematical XAI",
    desc: "Provides auditable term weights (wi · tfidfi) showing HSE inspectors exact token contributions for every classification.",
  },
  {
    icon: FileText,
    title: "Automated Weekly HSE Executive Digest",
    desc: "Synthesizes field observations into structured executive safety briefings with targeted supervisor stand-down recommendations.",
  },
];

const stats = [
  { value: "90%+", label: "Empirical Precision on Held-Out Test Split" },
  { value: "88%+", label: "F1-Score across Industrial Safety Logs" },
  { value: "< 10ms", label: "CPU Inference Latency per Observation" },
  { value: "9 Rules", label: "Full IOGP Life-Saving Rules Coverage" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-slate-100">
      {/* Nav */}
      <nav className="border-b border-surface-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">SIF Sentinel</span>
              <span className="text-[10px] ml-1.5 bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                OIL
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Command Center
            </Link>
            <Link
              href="/dashboard/ingest"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Ingest Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" style={{ backgroundSize: "40px 40px" }} />
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-surface-card border border-amber-500/30 rounded-full px-4 py-1.5 text-xs text-amber-300 mb-8 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SIH26165 · Serious Injury & Fatality Precursor Detection for Oil India Limited</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Predict & Prevent Fatalities
            <br />
            <span className="text-amber-400">
              Before High-Risk Incidents Occur
            </span>
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            SIF Sentinel processes unstructured safety observations, near-miss logs, and daily plant hazard cards into deterministic SIF precursor alerts, IOGP Life-Saving Rule classifications, and actionable facility density indexes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 text-sm"
            >
              Launch Safety Command Center <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/ingest"
              className="border border-surface-border hover:border-amber-500/50 bg-surface-card text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              Upload / Ingest Reports (CSV) <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-surface-border bg-surface-card/40">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-amber-400 font-mono mb-1">{stat.value}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Two-Layer AI/NLP Engine Designed for Field Safety Compliance
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Deterministic explainable inference (Layer A) running locally on CPU with zero network latency, backed by IOGP Life-Saving Rules.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="bg-surface-card border border-surface-border rounded-xl p-6 hover:border-amber-500/40 transition-colors space-y-3"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <cap.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">{cap.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface-card/30">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 font-semibold">SIF Sentinel · Oil India Limited</span>
          </div>
          <span>SIH26165 · Serious Injury & Fatality Precursor Intelligence</span>
        </div>
      </footer>
    </div>
  );
}
