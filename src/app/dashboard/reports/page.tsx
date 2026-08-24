"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  Flame,
  Maximize2,
  Truck,
  Anchor,
  FileCheck,
  Shield,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Cpu,
  Layers,
} from "lucide-react";
import { ReportWithClassification, LifeSavingRule, IOGP_LIFE_SAVING_RULES } from "@/lib/types";

function ReportsTriagePageContent() {
  const searchParams = useSearchParams();
  const initialSite = searchParams.get("site") || "all";

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportWithClassification[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportWithClassification | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState(initialSite);
  const [sifFilter, setSifFilter] = useState("all");
  const [ruleFilter, setRuleFilter] = useState("all");

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (siteFilter !== "all") params.set("site", siteFilter);
      if (sifFilter !== "all") params.set("sif", sifFilter);
      if (ruleFilter !== "all") params.set("rule", ruleFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, [siteFilter, sifFilter, ruleFilter, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const getRuleDetails = (ruleName: string | null | undefined) => {
    if (!ruleName) return null;
    return IOGP_LIFE_SAVING_RULES.find((r) => r.id === ruleName) || null;
  };

  const uniqueSites = Array.from(new Set(reports.map((r) => r.site))).filter(Boolean);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Safety Observations & SIF Triage
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, and inspect individual reports with real model-level term weights and IOGP rule tagging.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="p-2 text-slate-400 hover:text-white rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover transition-colors self-start md:self-auto"
          title="Refresh reports"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by observation text, activity, or keyword (e.g., 'harness', 'flange', 'loto')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-surface-border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" /> Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-surface-border/50 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            Filters:
          </div>

          {/* SIF Status */}
          <select
            value={sifFilter}
            onChange={(e) => setSifFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Verdicts</option>
            <option value="sif">SIF-Potential Precursor Only</option>
            <option value="non_sif">Non-SIF Only</option>
          </select>

          {/* Life-Saving Rule */}
          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All IOGP Rules</option>
            {IOGP_LIFE_SAVING_RULES.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.title}
              </option>
            ))}
          </select>

          {/* Site */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Facilities</option>
            {uniqueSites.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>

          {(sifFilter !== "all" || ruleFilter !== "all" || siteFilter !== "all" || search.trim()) && (
            <button
              onClick={() => {
                setSifFilter("all");
                setRuleFilter("all");
                setSiteFilter("all");
                setSearch("");
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Reports Table & Slide-Over Drawer */}
      <div className="relative">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading safety observations...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 rounded-xl bg-surface-card border border-surface-border text-center text-slate-400 text-sm space-y-3">
            <p>No safety observations match the selected criteria.</p>
            <p className="text-xs text-slate-500">
              Submit a manual observation or upload bulk CSV records to populate this triage list.
            </p>
          </div>
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-surface-border bg-surface/50">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Observation Text</th>
                    <th className="py-3 px-4 font-semibold">Facility / Location</th>
                    <th className="py-3 px-4 font-semibold">Activity</th>
                    <th className="py-3 px-4 font-semibold">SIF Verdict</th>
                    <th className="py-3 px-4 font-semibold">IOGP Life-Saving Rule</th>
                    <th className="py-3 px-4 font-semibold">Confidence</th>
                    <th className="py-3 px-4 font-semibold text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-slate-300">
                  {reports.map((report) => {
                    const isSif = report.classification?.is_sif_potential;
                    const isSelected = selectedReport?.id === report.id;

                    return (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`hover:bg-surface-hover/80 transition-colors cursor-pointer ${
                          isSelected ? "bg-amber-500/10 border-l-2 border-l-amber-500" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                          <p className="line-clamp-2 font-normal text-slate-200 leading-relaxed">
                            {report.raw_text}
                          </p>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            {report.reported_date} · {report.submitting_role || "Field Observer"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">{report.site}</td>
                        <td className="py-3.5 px-4 text-slate-400">{report.activity}</td>
                        <td className="py-3.5 px-4">
                          {isSif ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <ShieldAlert className="w-3 h-3 text-rose-400" />
                              SIF Precursor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                              <CheckCircle2 className="w-3 h-3 text-slate-400" />
                              Non-SIF
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {report.classification?.life_saving_rule ? (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-300">
                              {report.classification.life_saving_rule}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {report.classification ? `${report.classification.confidence}%` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
                          >
                            Explain <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Explainability Slide-Over Drawer */}
        {selectedReport && (
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-surface-card border-l border-surface-border shadow-2xl z-50 p-6 overflow-y-auto space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Observation Inspection & Explainability
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedReport.id} · {selectedReport.reported_date}
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Raw Observation Text */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Raw Safety Observation Text
              </div>
              <div className="p-4 rounded-xl bg-surface border border-surface-border text-xs text-slate-200 leading-relaxed font-sans">
                {selectedReport.raw_text}
              </div>
            </div>

            {/* Classification Verdict & Model Score */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                <div className="text-[11px] text-slate-400 font-medium">SIF Decision</div>
                <div className="text-base font-bold">
                  {selectedReport.classification?.is_sif_potential ? (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> SIF Precursor
                    </span>
                  ) : (
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" /> Non-SIF
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                <div className="text-[11px] text-slate-400 font-medium">Model Confidence</div>
                <div className="text-base font-bold font-mono text-amber-300">
                  {selectedReport.classification?.confidence}%
                </div>
              </div>
            </div>

            {/* Assigned IOGP Life-Saving Rule */}
            {selectedReport.classification?.life_saving_rule && (
              <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/30 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Assigned IOGP Life-Saving Rule
                </div>
                <div className="text-sm font-bold text-white">
                  {selectedReport.classification.life_saving_rule}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {getRuleDetails(selectedReport.classification.life_saving_rule)?.description}
                </p>
              </div>
            )}

            {/* REAL Explainability: Exact TF-IDF Term Weights */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  Model Feature Attribution (Layer A Weights)
                </div>
                <span className="text-[10px] text-slate-500 font-mono">TF-IDF &times; LogReg Coeff</span>
              </div>

              {selectedReport.classification?.reasoning_terms && selectedReport.classification.reasoning_terms.length > 0 ? (
                <div className="space-y-2">
                  {selectedReport.classification.reasoning_terms.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-surface border border-surface-border text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium text-slate-200">
                          &quot;{item.term}&quot;
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            item.positive ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {item.positive ? `+${item.weight}` : `${item.weight}`}
                        </span>
                      </div>
                      <div className="w-full bg-surface-card rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.positive ? "bg-rose-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, Math.abs(item.weight) * 28)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-surface rounded-lg">
                  No dominant vocabulary weights triggered. Decision based on baseline threshold.
                </div>
              )}
            </div>

            {/* Narrative Explanation */}
            {selectedReport.classification?.reasoning_narrative && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  HSE Officer Narrative Summary
                </div>
                <div className="p-3.5 rounded-xl bg-surface border border-surface-border text-xs text-slate-300 leading-relaxed">
                  {selectedReport.classification.reasoning_narrative}
                </div>
              </div>
            )}

            {/* Metadata Footer */}
            <div className="pt-4 border-t border-surface-border text-xs text-slate-500 space-y-1 font-mono">
              <div>Facility: {selectedReport.site}</div>
              <div>Activity: {selectedReport.activity}</div>
              <div>Submitting Role: {selectedReport.submitting_role || "Field Observer"}</div>
              <div>Model: {selectedReport.classification?.model_version || "SIF-Sentinel-LayerA-TFIDF-v1.0"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsTriagePage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading safety observations triage...
        </div>
      }
    >
      <ReportsTriagePageContent />
    </Suspense>
  );
}
