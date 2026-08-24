"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { PatternCallout, LifeSavingRule, IOGP_LIFE_SAVING_RULES } from "@/lib/types";

export default function PatternsPage() {
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<PatternCallout[]>([]);
  const [selectedRule, setSelectedRule] = useState<string>("all");

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/patterns");
      const data = await res.json();
      if (data.success) {
        setPatterns(data.patterns || []);
      }
    } catch (err) {
      console.error("Failed to fetch pattern callouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const filteredPatterns = patterns.filter(
    (p) => selectedRule === "all" || p.life_saving_rule === selectedRule
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Recurring Precursor Pattern Callouts
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
              {patterns.length} Active Clusters
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated clustering of repeated high-potential precursor observations by site and IOGP Life-Saving Rule.
          </p>
        </div>

        <button
          onClick={fetchPatterns}
          className="p-2 text-slate-400 hover:text-white rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover transition-colors self-start md:self-auto"
          title="Refresh pattern clusters"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pattern Detection Methodology Banner */}
      <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-xs space-y-1.5">
        <div className="font-semibold text-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          Precursor Cluster Detection Criteria:
        </div>
        <p className="text-slate-400 leading-relaxed">
          The engine groups SIF-flagged observations by location and IOGP Life-Saving Rule. When &ge; 2 separate precursor reports occur within the same site and rule category, a high-priority pattern callout is triggered to alert HSE officers before an actual fatal event occurs.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Filter by IOGP Rule:</span>
          <select
            value={selectedRule}
            onChange={(e) => setSelectedRule(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
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

      {/* Main Pattern Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Detecting recurring precursor clusters...
        </div>
      ) : filteredPatterns.length === 0 ? (
        <div className="p-16 rounded-xl bg-surface-card border border-surface-border text-center text-slate-400 text-sm space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="font-semibold text-white">No Recurring Precursor Clusters Detected</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No single facility currently exceeds the recurring precursor threshold (&ge;2 SIF reports under the same IOGP rule).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatterns.map((pat) => {
            const isCritical = pat.count >= 4;
            const isHigh = pat.count >= 3;

            return (
              <div
                key={pat.id}
                className="bg-surface-card border border-surface-border hover:border-orange-500/40 rounded-xl p-5 space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      {pat.site}
                    </div>
                    <div className="text-xs font-semibold text-amber-300 mt-0.5">
                      {pat.life_saving_rule}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                      isCritical
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : isHigh
                        ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {pat.count} Flagged Precursors
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-surface p-3.5 rounded-lg border border-surface-border">
                  {pat.narrative}
                </p>

                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">Activities Affected:</span>
                    <span>{pat.activity_summary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">Detection Timestamp:</span>
                    <span className="font-mono text-slate-500">{new Date(pat.detected_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                  <Link
                    href={`/dashboard/reports?site=${encodeURIComponent(pat.site)}&rule=${encodeURIComponent(pat.life_saving_rule)}`}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    Inspect {pat.count} Linked Observations <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <span className="text-[11px] text-slate-500">
                    Recommended Action: Supervisor Stand-down
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
