"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Filter,
  Shield,
  Layers,
  ChevronRight,
  BrainCircuit,
  ClipboardCheck,
  Calendar,
  Building,
  Activity,
  FileText,
  ExternalLink,
  Flame,
  Zap,
  Maximize2,
  Truck,
  Anchor,
  HelpCircle,
} from "lucide-react";
import { PatternCallout, LifeSavingRule, IOGP_LIFE_SAVING_RULES, ReportWithClassification } from "@/lib/types";

export default function PatternsPage() {
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<PatternCallout[]>([]);
  const [reports, setReports] = useState<ReportWithClassification[]>([]);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [patRes, repRes] = await Promise.all([
        fetch("/api/patterns"),
        fetch("/api/reports?limit=500"),
      ]);
      const patData = await patRes.json();
      const repData = await repRes.json();

      if (patData.success) {
        const loadedPatterns: PatternCallout[] = patData.patterns || [];
        setPatterns(loadedPatterns);
        if (loadedPatterns.length > 0 && !selectedPatternId) {
          setSelectedPatternId(loadedPatterns[0].id);
        }
      }
      if (repData.success) {
        setReports(repData.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch pattern callouts:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPatternId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPatterns = patterns.filter(
    (p) => selectedRule === "all" || p.life_saving_rule === selectedRule
  );

  const selectedPattern = patterns.find((p) => p.id === selectedPatternId) || filteredPatterns[0] || null;

  // Contributing reports for the selected pattern
  const contributingReports = selectedPattern
    ? reports.filter((r) => Array.isArray(selectedPattern.report_ids) && selectedPattern.report_ids.includes(r.id))
    : [];

  const getRuleDetails = (ruleName: string | null | undefined) => {
    if (!ruleName) return null;
    return IOGP_LIFE_SAVING_RULES.find((r) => r.id === ruleName) || null;
  };

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">
            <span className="text-amber-400">SIF SENTINEL</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">PRECURSOR PATTERN DISCOVERY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2.5">
            Recurring SIF Precursor Pattern Clusters
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
              {patterns.length} ACTIVE CLUSTERS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated cluster discovery grouping multiple field observations by facility and IOGP Life-Saving Rule before catastrophic escalation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-surface-border bg-surface px-2.5 text-[11px] font-medium text-slate-300 transition hover:bg-surface-hover hover:text-white"
            title="Refresh clusters"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Methodology Banner */}
      <div className="p-3 rounded border border-surface-border bg-surface-card text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span>
            <strong className="text-white font-mono text-[11px]">EVIDENCE CHAIN ARCHITECTURE:</strong> Multiple Raw Field Observations &rarr; Recurring Pattern Detection &rarr; Root Cause Narrative &rarr; Preventative CAPA Barrier.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-slate-500 font-mono text-[10px]">FILTER RULE:</span>
          <select
            value={selectedRule}
            onChange={(e) => setSelectedRule(e.target.value)}
            className="bg-surface border border-surface-border rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="all">All IOGP Rules ({patterns.length})</option>
            {IOGP_LIFE_SAVING_RULES.map((rule) => {
              const count = patterns.filter((p) => p.life_saving_rule === rule.id).length;
              return (
                <option key={rule.id} value={rule.id}>
                  {rule.title} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Main Workspace: Master-Detail Layout */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Discovering recurring precursor clusters...
        </div>
      ) : filteredPatterns.length === 0 ? (
        <div className="p-16 rounded bg-surface-card border border-surface-border text-center text-slate-400 text-xs space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="font-semibold text-white">No Recurring Precursor Clusters Detected</p>
          <p className="text-slate-500 max-w-md mx-auto">
            No single facility currently exceeds the recurring precursor threshold (&ge;2 SIF observations under the same IOGP rule).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT: Ranked recurring patterns list (5 columns) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="font-mono text-[10px] font-bold text-slate-400 tracking-wider flex items-center justify-between px-1">
              <span>RANKED CLUSTERS ({filteredPatterns.length})</span>
              <span>EXPOSURE INTENSITY</span>
            </div>

            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {filteredPatterns.map((pat) => {
                const isSelected = selectedPattern?.id === pat.id;
                const isCritical = pat.count >= 4;
                const isHigh = pat.count >= 3;

                return (
                  <div
                    key={pat.id}
                    onClick={() => setSelectedPatternId(pat.id)}
                    className={`p-3 rounded border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-surface-hover border-amber-500/60 shadow-lg"
                        : "bg-surface-card border-surface-border hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? "bg-rose-500" : isHigh ? "bg-orange-500" : "bg-amber-400"
                            }`}
                          />
                          {pat.site}
                        </div>
                        <div className="text-[11px] font-semibold text-amber-300 mt-0.5">
                          {pat.life_saving_rule}
                        </div>
                      </div>

                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                          isCritical
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : isHigh
                            ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {pat.count} SIF Reports
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                      {pat.narrative}
                    </p>

                    <div className="flex items-center justify-between font-mono text-[9px] text-slate-500 pt-2 mt-2 border-t border-surface-border/50">
                      <span>ACT: {pat.activity_summary}</span>
                      <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                        VIEW EVIDENCE &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Selected pattern analysis & Evidence Chain (7 columns) */}
          <div className="lg:col-span-7">
            {selectedPattern ? (
              <div className="bg-surface-card border border-surface-border rounded p-4 space-y-4">
                {/* Cluster Detail Header */}
                <div className="border-b border-surface-border pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-400">
                        <span>CLUSTER ID: {selectedPattern.id}</span>
                        <span className="text-slate-600">/</span>
                        <span>SEVERITY: {selectedPattern.severity.toUpperCase()}</span>
                      </div>
                      <h2 className="text-lg font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
                        <Building className="w-4 h-4 text-amber-400" />
                        {selectedPattern.site}
                      </h2>
                      <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mt-0.5">
                        <Shield className="w-3.5 h-3.5" />
                        IOGP Rule: {selectedPattern.life_saving_rule}
                      </div>
                    </div>

                    {/* Action Link & Workbench Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/investigate?site=${encodeURIComponent(selectedPattern.site)}&rule=${encodeURIComponent(selectedPattern.life_saving_rule)}`}
                        className="inline-flex items-center gap-1.5 rounded border border-surface-border bg-surface px-2.5 py-1.5 font-mono text-[11px] font-bold text-slate-300 transition hover:bg-surface-hover hover:text-white"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                        Investigate
                      </Link>
                      <Link
                        href={`/dashboard/actions?site=${encodeURIComponent(selectedPattern.site)}&rule=${encodeURIComponent(selectedPattern.life_saving_rule)}&pattern_id=${encodeURIComponent(selectedPattern.id)}`}
                        className="inline-flex items-center gap-1.5 rounded bg-amber-500 px-3 py-1.5 font-mono text-[11px] font-bold text-slate-950 transition hover:bg-amber-400"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Dispatch CAPA
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Key Cluster Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded bg-surface border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">OCCURRENCES</span>
                    <span className="text-sm font-bold text-rose-400">{selectedPattern.count} Reports</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">TIME WINDOW</span>
                    <span className="text-sm font-bold text-slate-200">Last 30 Days</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">SEVERITY LEVEL</span>
                    <span className="text-sm font-bold text-orange-400">{selectedPattern.severity.toUpperCase()}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">RECOMMENDATION</span>
                    <span className="text-xs font-bold text-amber-300 block truncate">Safety Stand-down</span>
                  </div>
                </div>

                {/* Root Cause Narrative & Synthesis */}
                <div className="p-3 rounded bg-surface border border-surface-border space-y-1.5">
                  <div className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> ROOT CAUSE &amp; CLUSTER SYNTHESIS
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {selectedPattern.narrative}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                    Affected Operations: {selectedPattern.activity_summary}
                  </div>
                </div>

                {/* IOGP Life-Saving Rule Governance Context */}
                {selectedPattern.life_saving_rule && (
                  <div className="p-3 rounded bg-amber-500/[0.04] border border-amber-500/30 space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      IOGP Mandate: {selectedPattern.life_saving_rule}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {getRuleDetails(selectedPattern.life_saving_rule)?.description}
                    </p>
                  </div>
                )}

                {/* Contributing Raw Reports (Evidence Chain) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span className="font-bold text-slate-300">
                      CONTRIBUTING FIELD OBSERVATIONS ({contributingReports.length || selectedPattern.report_ids.length})
                    </span>
                    <Link
                      href={`/dashboard/reports?site=${encodeURIComponent(selectedPattern.site)}&rule=${encodeURIComponent(selectedPattern.life_saving_rule)}`}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                    >
                      Open in Triage Register &rarr;
                    </Link>
                  </div>

                  {contributingReports.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {contributingReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-2.5 rounded bg-surface border border-surface-border text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                            <span className="font-bold text-slate-300">{report.id}</span>
                            <span>{report.reported_date} · {report.submitting_role || "Field Observer"}</span>
                          </div>
                          <p className="text-slate-200 line-clamp-2 leading-relaxed">
                            {report.raw_text}
                          </p>
                          <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                            <span className="text-slate-400">Activity: {report.activity}</span>
                            <Link
                              href={`/dashboard/reports?search=${encodeURIComponent(report.id)}`}
                              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5"
                            >
                              Inspect Feature Attribution &rarr;
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded bg-surface border border-surface-border text-xs text-slate-400 space-y-1">
                      <p>
                        Cluster is linked to {selectedPattern.report_ids.length} observation records:
                      </p>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        {selectedPattern.report_ids.map((id) => (
                          <Link
                            key={id}
                            href={`/dashboard/reports?search=${encodeURIComponent(id)}`}
                            className="px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-amber-300 hover:border-amber-500"
                          >
                            {id}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

