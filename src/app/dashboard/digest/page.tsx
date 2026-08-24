"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  RefreshCw,
  Building2,
  Target,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { WeeklyHseDigest } from "@/lib/types";

export default function WeeklyDigestPage() {
  const [loading, setLoading] = useState(true);
  const [digest, setDigest] = useState<WeeklyHseDigest | null>(null);

  const fetchDigest = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/digest");
      const data = await res.json();
      if (data.success) {
        setDigest(data.digest);
      }
    } catch (err) {
      console.error("Failed to load digest:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigest();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Weekly HSE Executive Digest
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated intelligence summary and targeted intervention plan for Oil India leadership.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDigest}
            className="p-2 text-slate-400 hover:text-white rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover transition-colors"
            title="Regenerate digest"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-surface-card border border-surface-border hover:bg-surface-hover text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Generating executive safety briefing...
        </div>
      ) : !digest ? (
        <div className="p-12 rounded-xl bg-surface-card border border-surface-border text-center text-slate-400 text-sm">
          No digest available. Please ingest observations first to compile briefing.
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-8 space-y-8 print:bg-white print:text-black print:p-0 print:border-none">
          {/* Document Title Header */}
          <div className="border-b border-surface-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400 print:text-amber-700">
                Oil India Limited · Corporate HSSE
              </div>
              <h2 className="text-xl font-bold text-white mt-1 print:text-black">
                Precursor Risk & Fatal Prevention Briefing
              </h2>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Reporting Period: {digest.period_start} to {digest.period_end}
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 print:border-black print:text-black">
                Official HSE Report
              </span>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Generated {new Date(digest.generated_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Executive Safety Summary
            </h3>
            <div className="p-5 rounded-xl bg-surface border border-surface-border text-sm text-slate-200 leading-relaxed font-sans print:bg-slate-100 print:text-black">
              {digest.executive_summary}
            </div>
          </div>

          {/* Key Statistical Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface border border-surface-border print:border-slate-300">
              <div className="text-slate-400">Total Observations</div>
              <div className="text-2xl font-bold font-mono text-white mt-1 print:text-black">
                {digest.total_reports}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border print:border-slate-300">
              <div className="text-slate-400">SIF-Potential Precursors</div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1 print:text-rose-700">
                {digest.total_sif_precursors}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border print:border-slate-300">
              <div className="text-slate-400">Precursor Density</div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1 print:text-amber-700">
                {digest.overall_precursor_density}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border print:border-slate-300">
              <div className="text-slate-400">Active Recurring Patterns</div>
              <div className="text-2xl font-bold font-mono text-orange-400 mt-1 print:text-orange-700">
                {digest.active_patterns_count}
              </div>
            </div>
          </div>

          {/* Top Risk Sites */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              Highest Precursor Concentration Facilities
            </h3>

            {digest.top_risk_sites.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 bg-surface rounded-lg">
                No site-specific precursor risk concentrations recorded in this period.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {digest.top_risk_sites.map((site) => (
                  <div
                    key={site.site}
                    className="p-4 rounded-xl bg-surface border border-surface-border text-xs space-y-2 print:border-slate-300"
                  >
                    <div className="font-bold text-white text-sm print:text-black">{site.site}</div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>SIF Precursors:</span>
                      <span className="font-mono font-bold text-amber-400">{site.sif_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Precursor Density:</span>
                      <span className="font-mono font-bold text-rose-400">{site.density}%</span>
                    </div>
                    <div className="pt-2 border-t border-surface-border text-[11px] text-amber-300 font-medium">
                      Primary Rule: {site.primary_rule}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Targeted Interventions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Targeted HSE Supervisor Interventions
            </h3>

            {digest.suggested_interventions.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 bg-surface rounded-lg">
                No immediate high-severity supervisory stand-downs required.
              </div>
            ) : (
              <div className="space-y-2.5">
                {digest.suggested_interventions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-surface border border-surface-border flex items-start justify-between gap-4 text-xs print:border-slate-300"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white print:text-black">
                        {action.site} · {action.rule}
                      </div>
                      <p className="text-slate-300 print:text-slate-700 leading-relaxed">
                        {action.action}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                        action.priority === "immediate"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : action.priority === "high"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {action.priority} Action
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
