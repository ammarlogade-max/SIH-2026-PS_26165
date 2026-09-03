"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Cpu,
  Layers,
  BrainCircuit,
  ClipboardCheck,
  UserCheck,
  Check,
  FileText,
  RotateCcw,
} from "lucide-react";
import { ReportWithClassification, LifeSavingRule, IOGP_LIFE_SAVING_RULES, HumanReview } from "@/lib/types";

function ReportsTriagePageContent() {
  const searchParams = useSearchParams();
  const initialSite = searchParams.get("site") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialSif = searchParams.get("sif") === "sif" || searchParams.get("sif") === "non_sif"
    ? searchParams.get("sif")!
    : "all";

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportWithClassification[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportWithClassification | null>(null);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [siteFilter, setSiteFilter] = useState(initialSite);
  const [sifFilter, setSifFilter] = useState(initialSif);
  const [ruleFilter, setRuleFilter] = useState("all");

  // Local human reviews cache
  const [reviews, setReviews] = useState<Record<string, HumanReview>>({});
  const [reviewNoteInput, setReviewNoteInput] = useState("");
  const [reviewSavedMsg, setReviewSavedMsg] = useState(false);

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
        const loadedReports: ReportWithClassification[] = data.reports || [];
        setReports(loadedReports);

        // Check if query had a specific report ID to auto-open
        if (initialSearch.startsWith("rep-")) {
          const match = loadedReports.find((r) => r.id === initialSearch);
          if (match) {
            setSelectedReport(match);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, [siteFilter, sifFilter, ruleFilter, search, initialSearch]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Sync selected report review notes
  useEffect(() => {
    if (selectedReport) {
      const existing = reviews[selectedReport.id];
      setReviewNoteInput(existing?.notes || selectedReport.human_review?.notes || "");
      setReviewSavedMsg(false);
    }
  }, [selectedReport, reviews]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleUpdateReview = (status: "Confirmed" | "Overridden", overrideSif?: boolean) => {
    if (!selectedReport) return;
    const updatedReview: HumanReview = {
      status,
      reviewed_by: "HSE Officer (OIL HQ)",
      reviewed_at: new Date().toISOString(),
      notes: reviewNoteInput.trim() || undefined,
      override_sif: overrideSif !== undefined ? overrideSif : selectedReport.classification?.is_sif_potential,
      override_rule: selectedReport.classification?.life_saving_rule,
    };

    setReviews((prev) => ({
      ...prev,
      [selectedReport.id]: updatedReview,
    }));

    setSelectedReport((prev) => prev ? { ...prev, human_review: updatedReview } : null);
    setReports((prev) =>
      prev.map((r) => (r.id === selectedReport.id ? { ...r, human_review: updatedReview } : r))
    );
    setReviewSavedMsg(true);
    setTimeout(() => setReviewSavedMsg(false), 3000);
  };

  const getRuleDetails = (ruleName: string | null | undefined) => {
    if (!ruleName) return null;
    return IOGP_LIFE_SAVING_RULES.find((r) => r.id === ruleName) || null;
  };

  const uniqueSites = Array.from(new Set(reports.map((r) => r.site))).filter(Boolean);

  const activeFilterCount =
    (sifFilter !== "all" ? 1 : 0) +
    (ruleFilter !== "all" ? 1 : 0) +
    (siteFilter !== "all" ? 1 : 0) +
    (search.trim() ? 1 : 0);

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">
            <span className="text-amber-400">SIF SENTINEL</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">OBSERVATION TRIAGE REGISTER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
            Safety Observations & SIF Precursor Triage
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, filter, and inspect individual reports with real Layer A term weights, IOGP rule mapping, and HSE human verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-surface-border bg-surface px-2.5 text-[11px] font-medium text-slate-300 transition hover:bg-surface-hover hover:text-white"
            title="Refresh reports"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            href="/dashboard/ingest?tab=manual"
            className="inline-flex h-8 items-center gap-1.5 rounded bg-amber-500 px-3 text-[11px] font-bold text-slate-950 transition hover:bg-amber-400"
          >
            + Ingest Report
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-card border border-surface-border rounded p-3 sm:p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by observation text, facility, activity, or keyword (e.g., 'harness', 'flange', 'loto', 'wellhead')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-surface-border rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" /> Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border/50 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium font-mono text-[10px]">
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            FILTERS:
          </div>

          {/* SIF Status */}
          <select
            value={sifFilter}
            onChange={(e) => setSifFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="all">Verdict: All</option>
            <option value="sif">SIF-Potential Precursors Only</option>
            <option value="non_sif">Non-SIF Observations Only</option>
          </select>

          {/* Life-Saving Rule */}
          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="all">Rule: All IOGP Rules</option>
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
            className="bg-surface border border-surface-border rounded px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="all">Facility: All Sites</option>
            {uniqueSites.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSifFilter("all");
                setRuleFilter("all");
                setSiteFilter("all");
                setSearch("");
              }}
              className="text-[11px] font-mono text-amber-400 hover:text-amber-300 font-medium ml-auto inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Reports Table & Slide-Over Drawer */}
      <div className="relative">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading safety observations...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 rounded bg-surface-card border border-surface-border text-center text-slate-400 text-xs space-y-2">
            <p className="font-semibold text-slate-200">No safety observations match the selected criteria.</p>
            <p className="text-slate-500">
              Submit a manual observation or adjust filters to view matching records.
            </p>
          </div>
        ) : (
          <div className="bg-surface-card border border-surface-border rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="font-mono text-[10px] text-slate-400 border-b border-surface-border bg-surface/50">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold w-28">REPORT ID / DATE</th>
                    <th className="py-2.5 px-3 font-semibold">OBSERVATION TEXT</th>
                    <th className="py-2.5 px-3 font-semibold">FACILITY</th>
                    <th className="py-2.5 px-3 font-semibold">ACTIVITY</th>
                    <th className="py-2.5 px-3 font-semibold">SIF VERDICT</th>
                    <th className="py-2.5 px-3 font-semibold">IOGP RULE</th>
                    <th className="py-2.5 px-3 font-semibold font-mono">CONFIDENCE</th>
                    <th className="py-2.5 px-3 font-semibold">HUMAN REVIEW</th>
                    <th className="py-2.5 px-3 font-semibold text-right">INSPECTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-slate-300">
                  {reports.map((report) => {
                    const isSif = report.classification?.is_sif_potential;
                    const isSelected = selectedReport?.id === report.id;
                    const review = reviews[report.id] || report.human_review;
                    const reviewStatus = review?.status || "Pending";

                    return (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`hover:bg-surface-hover/80 transition-colors cursor-pointer ${
                          isSelected ? "bg-amber-500/10 border-l-2 border-l-amber-500" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          <span className="font-bold text-slate-200 block">{report.id}</span>
                          <span>{report.reported_date}</span>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs md:max-w-md">
                          <p className="line-clamp-2 font-normal text-slate-100 leading-relaxed">
                            {report.raw_text}
                          </p>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            Submitting Role: {report.submitting_role || "Field Observer"}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-200 whitespace-nowrap">{report.site}</td>
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{report.activity}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isSif ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <ShieldAlert className="w-3 h-3 text-rose-400" />
                              SIF Precursor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                              <CheckCircle2 className="w-3 h-3 text-slate-400" />
                              Non-SIF
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {report.classification?.life_saving_rule ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                              {report.classification.life_saving_rule}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                          {report.classification ? (
                            <span className={report.classification.confidence >= 75 ? "text-amber-400" : "text-slate-300"}>
                              {report.classification.confidence}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                              reviewStatus === "Confirmed"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : reviewStatus === "Overridden"
                                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                            }`}
                          >
                            {reviewStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                            }}
                            className="font-mono text-[11px] text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1"
                          >
                            INSPECT <ChevronRight className="w-3 h-3" />
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

        {/* Explainability & 4-Part Inspection Slide-Over Drawer */}
        {selectedReport && (
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-surface-card border-l border-surface-border shadow-2xl z-50 p-5 overflow-y-auto space-y-5">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber-400">
                  <span>REPORT INSPECTION</span>
                  <span className="text-slate-600">/</span>
                  <span>FOUR-TIER EVIDENCE</span>
                </div>
                <h3 className="font-bold text-white text-base flex items-center gap-2 mt-0.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Observation Inspection & Explainability
                </h3>
                <div className="text-[10px] text-slate-400 font-mono">
                  ID: {selectedReport.id} · {selectedReport.reported_date}
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: OBSERVED */}
            <div className="space-y-2 rounded border border-surface-border bg-surface/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-slate-400" /> 1. OBSERVED DATA (FIELD INPUT)
                </span>
                <span className="font-mono text-[9px] text-slate-500 uppercase">SOURCE: {selectedReport.source}</span>
              </div>
              <div className="p-2.5 rounded bg-surface border border-surface-border text-xs text-slate-200 leading-relaxed font-sans">
                {selectedReport.raw_text}
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[10px] pt-1">
                <div>
                  <span className="text-slate-500 block">FACILITY:</span>
                  <span className="text-slate-200 font-bold">{selectedReport.site}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ACTIVITY:</span>
                  <span className="text-slate-200 font-bold">{selectedReport.activity}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SUBMITTING ROLE:</span>
                  <span className="text-slate-200 font-bold">{selectedReport.submitting_role || "Field Observer"}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: MODEL SIGNAL */}
            <div className="space-y-3 rounded border border-surface-border bg-surface/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-amber-400" /> 2. MODEL SIGNAL (LAYER A ENGINE)
                </span>
                <span className="font-mono text-[9px] text-slate-500">TF-IDF + LOGISTIC REGRESSION</span>
              </div>

              {/* Classification Verdict & Confidence */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded bg-surface border border-surface-border">
                  <span className="text-[10px] text-slate-500 font-mono block">VERDICT</span>
                  <div className="text-sm font-bold mt-0.5">
                    {selectedReport.classification?.is_sif_potential ? (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> SIF Precursor
                      </span>
                    ) : (
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Non-SIF
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-surface border border-surface-border">
                  <span className="text-[10px] text-slate-500 font-mono block">CONFIDENCE</span>
                  <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                    {selectedReport.classification?.confidence || 0}%
                  </div>
                </div>
              </div>

              {/* Assigned IOGP Life-Saving Rule */}
              {selectedReport.classification?.life_saving_rule && (
                <div className="p-2.5 rounded bg-amber-500/[0.04] border border-amber-500/30 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    IOGP Rule: {selectedReport.classification.life_saving_rule}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {getRuleDetails(selectedReport.classification.life_saving_rule)?.description}
                  </p>
                </div>
              )}

              {/* Feature Attribution Horizontal Bars */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>KEY EVIDENCE WEIGHTS</span>
                  <span>COEFFICIENT MAGNITUDE</span>
                </div>

                {selectedReport.classification?.reasoning_terms && selectedReport.classification.reasoning_terms.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedReport.classification.reasoning_terms.map((item, idx) => (
                      <div key={idx} className="p-2 rounded bg-surface border border-surface-border text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-slate-200">
                            &quot;{item.term}&quot;
                          </span>
                          <span
                            className={`font-mono font-bold text-[11px] ${
                              item.positive ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {item.positive ? `+${item.weight}` : `${item.weight}`}
                          </span>
                        </div>
                        <div className="w-full bg-surface-card rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.positive ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, Math.abs(item.weight) * 28)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic p-2.5 bg-surface rounded">
                    Baseline threshold triggered. No dominant vocabulary tokens.
                  </div>
                )}
              </div>

              {/* Narrative Summary */}
              {selectedReport.classification?.reasoning_narrative && (
                <div className="p-2.5 rounded bg-surface border border-surface-border text-[11px] text-slate-300 leading-relaxed">
                  <span className="font-mono text-[9px] text-amber-400 uppercase block font-bold mb-1">
                    EXPLAINABILITY SUMMARY
                  </span>
                  {selectedReport.classification.reasoning_narrative}
                </div>
              )}
            </div>

            {/* SECTION 3: HUMAN REVIEW */}
            <div className="space-y-3 rounded border border-surface-border bg-surface/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3 text-emerald-400" /> 3. HSE OFFICER HUMAN REVIEW
                </span>
                <span
                  className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                    (reviews[selectedReport.id]?.status || selectedReport.human_review?.status || "Pending") === "Confirmed"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : (reviews[selectedReport.id]?.status || selectedReport.human_review?.status) === "Overridden"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                  }`}
                >
                  {reviews[selectedReport.id]?.status || selectedReport.human_review?.status || "Pending Review"}
                </span>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-slate-400 block">
                  HSE OFFICER REVIEW NOTES &amp; RATIONALE:
                </label>
                <textarea
                  rows={2}
                  value={reviewNoteInput}
                  onChange={(e) => setReviewNoteInput(e.target.value)}
                  placeholder="Record barrier condition, contractor verification, or override justification..."
                  className="w-full p-2 bg-surface border border-surface-border rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateReview("Confirmed")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold transition"
                >
                  <Check className="w-3 h-3" /> Confirm Model Signal
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReview("Overridden", !selectedReport.classification?.is_sif_potential)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold transition"
                >
                  <RotateCcw className="w-3 h-3" /> Override SIF Verdict
                </button>
              </div>

              {reviewSavedMsg && (
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Human review recorded to audit log.
                </div>
              )}
            </div>

            {/* SECTION 4: ACTION STATUS */}
            <div className="space-y-2.5 rounded border border-surface-border bg-surface/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3 h-3 text-amber-400" /> 4. CAPA GOVERNANCE &amp; DISPATCH
                </span>
                <span className="font-mono text-[9px] text-slate-400">
                  STATUS: {selectedReport.action_status || "No Action"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/dashboard/investigate?site=${encodeURIComponent(selectedReport.site)}&rule=${encodeURIComponent(selectedReport.classification?.life_saving_rule || "")}`}
                  className="flex items-center justify-center gap-1.5 rounded border border-surface-border bg-surface px-3 py-2 font-mono text-[11px] font-bold text-slate-200 transition hover:bg-surface-hover hover:text-white"
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                  AI Investigation
                </Link>
                <Link
                  href={`/dashboard/actions?site=${encodeURIComponent(selectedReport.site)}&rule=${encodeURIComponent(selectedReport.classification?.life_saving_rule || "")}`}
                  className="flex items-center justify-center gap-1.5 rounded bg-amber-500 px-3 py-2 font-mono text-[11px] font-bold text-slate-950 transition hover:bg-amber-400"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Dispatch CAPA
                </Link>
              </div>
            </div>

            {/* Technical Metadata Footer */}
            <div className="pt-2 border-t border-surface-border text-[10px] text-slate-500 space-y-1 font-mono">
              <div>MODEL VERSION: {selectedReport.classification?.model_version || "SIF-Sentinel-LayerA-TFIDF-v1.0"}</div>
              <div>INGEST TIMESTAMP: {selectedReport.created_at}</div>
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
        <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading safety observations triage...
        </div>
      }
    >
      <ReportsTriagePageContent />
    </Suspense>
  );
}

