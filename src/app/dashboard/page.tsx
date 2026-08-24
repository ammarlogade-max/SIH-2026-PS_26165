"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  ArrowUpRight,
  TrendingUp,
  UploadCloud,
  ChevronRight,
  CheckCircle2,
  Zap,
  Flame,
  Maximize2,
  Shield,
  Truck,
  Anchor,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import { ReportWithClassification, SiteActivityAggregate, PatternCallout, LifeSavingRule } from "@/lib/types";

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState<{
    totalReports: number;
    sifReportsCount: number;
    nonSifReportsCount: number;
    overallPrecursorDensity: number;
    siteAggregates: SiteActivityAggregate[];
    ruleDistribution: { rule: LifeSavingRule; count: number; percentage: number }[];
    patternCallouts: PatternCallout[];
    topRiskSite: string | null;
    highestRiskDensity: number;
  } | null>(null);

  const [recentReports, setRecentReports] = useState<ReportWithClassification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [aggRes, repRes] = await Promise.all([
        fetch("/api/aggregates"),
        fetch("/api/reports?limit=8"),
      ]);

      const aggData = await aggRes.json();
      const repData = await repRes.json();

      if (aggData.success) {
        setAggregates(aggData.data);
      } else {
        throw new Error(aggData.error || "Failed to load aggregate statistics");
      }

      if (repData.success) {
        setRecentReports(repData.reports.slice(0, 6));
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRuleIcon = (rule: string | null | undefined) => {
    switch (rule) {
      case "Working at Height":
        return <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />;
      case "Energy Isolation":
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case "Hot Work":
        return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case "Confined Space":
        return <Maximize2 className="w-3.5 h-3.5 text-red-400" />;
      case "Line of Fire":
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case "Driving":
        return <Truck className="w-3.5 h-3.5 text-blue-400" />;
      case "Safe Mechanical Lifting":
        return <Anchor className="w-3.5 h-3.5 text-purple-400" />;
      case "Bypassing Safety Controls":
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
      case "Work Authorization":
        return <FileCheck className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <div className="text-slate-400 text-sm font-medium">Computing precursor densities & evaluating Layer A classifications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 max-w-2xl mx-auto my-12">
        <div className="flex items-center gap-3 font-semibold text-base mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Service Error
        </div>
        <p className="text-sm text-red-200/80 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const isEmpty = !aggregates || aggregates.totalReports === 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            SIF Precursor Command Center
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Layer A Active
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time classification of Oil India safety observations into SIF-precursors and IOGP Life-Saving Rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-slate-400 hover:text-white rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/dashboard/ingest"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Ingest Observations
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reports */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Reports Ingested</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {aggregates?.totalReports || 0}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">{aggregates?.nonSifReportsCount || 0} non-SIF</span>
            <span>·</span>
            <span>100% processed</span>
          </div>
        </div>

        {/* SIF Potential Count & Density */}
        <div className="bg-surface-card border border-amber-500/30 rounded-xl p-5 relative overflow-hidden bg-amber-500/[0.02]">
          <div className="flex items-center justify-between text-amber-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">SIF Precursor Density</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-amber-300">
              {aggregates?.overallPrecursorDensity || 0}%
            </div>
            <div className="text-xs text-amber-400 font-medium">
              ({aggregates?.sifReportsCount || 0} flagged)
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Target fatal precursor threshold: &lt; 25%
          </div>
        </div>

        {/* Top Risk Site */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Risk Facility</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white truncate">
            {aggregates?.topRiskSite || "—"}
          </div>
          <div className="text-xs text-rose-400 mt-2 font-medium">
            {aggregates?.topRiskSite ? `${aggregates.highestRiskDensity}% Precursor Density` : "No risk concentration"}
          </div>
        </div>

        {/* Active Pattern Callouts */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pattern Clusters</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {aggregates?.patternCallouts.length || 0}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Frequency threshold &ge; 2 recurring SIFs
          </div>
        </div>
      </div>

      {/* Honest Empty State if 0 Reports */}
      {isEmpty ? (
        <div className="p-12 rounded-2xl bg-surface-card border border-surface-border text-center max-w-3xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Safety Reports Ingested Yet</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
            SIF Sentinel operates on real submitted safety observations. Upload a batch of Oil India safety observation reports (CSV) or enter a manual observation to generate instant precursor classifications, IOGP rule tagging, and precursor density rankings.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/ingest"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Safety Reports (CSV)
            </Link>
            <Link
              href="/dashboard/ingest?tab=manual"
              className="w-full sm:w-auto border border-surface-border hover:border-amber-500/50 bg-surface-hover text-slate-300 hover:text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              Enter Manual Observation
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Main Grid: Precursor Density Table & IOGP Rule Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ranked Site Precursor Density (2 cols) */}
            <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Facility Precursor Density Ranking</h3>
                  <p className="text-xs text-slate-400">
                    Calculated as (SIF Reports / Total Reports) &times; 100%
                  </p>
                </div>
                <Link
                  href="/dashboard/density"
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                >
                  Full Analysis <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-surface-border pb-2">
                    <tr>
                      <th className="py-2.5 font-semibold">Facility / Site</th>
                      <th className="py-2.5 font-semibold">Primary Activity</th>
                      <th className="py-2.5 font-semibold">Total Reports</th>
                      <th className="py-2.5 font-semibold">SIF Precursors</th>
                      <th className="py-2.5 font-semibold">Precursor Density</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-300">
                    {aggregates.siteAggregates.slice(0, 5).map((site) => (
                      <tr key={site.site} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-3 font-medium text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          {site.site}
                        </td>
                        <td className="py-3 text-slate-400">{site.activity}</td>
                        <td className="py-3 font-mono">{site.total_reports}</td>
                        <td className="py-3 font-mono text-amber-400 font-semibold">{site.sif_reports}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-24 bg-surface rounded-full h-2 overflow-hidden border border-surface-border">
                              <div
                                className={`h-full rounded-full ${
                                  site.precursor_density >= 35
                                    ? "bg-rose-500"
                                    : site.precursor_density >= 20
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, site.precursor_density)}%` }}
                              />
                            </div>
                            <span className="font-mono font-semibold text-slate-200">
                              {site.precursor_density}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* IOGP Life-Saving Rules Breakdown (1 col) */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
              <div>
                <h3 className="font-bold text-white text-base">IOGP Rule Distribution</h3>
                <p className="text-xs text-slate-400">Categorization of SIF-potential observations</p>
              </div>

              {aggregates.ruleDistribution.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-6 text-center">
                  No SIF precursors detected to categorize.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {aggregates.ruleDistribution.map((item) => (
                    <div
                      key={item.rule}
                      className="p-2.5 rounded-lg bg-surface border border-surface-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 font-medium text-slate-200 truncate mr-2">
                        {getRuleIcon(item.rule)}
                        <span className="truncate">{item.rule}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono flex-shrink-0">
                        <span className="text-amber-400 font-semibold">{item.count}</span>
                        <span className="text-slate-500 text-[11px]">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Pattern Callouts Banner */}
          {aggregates.patternCallouts.length > 0 && (
            <div className="bg-surface-card border border-orange-500/30 rounded-xl p-5 space-y-3 bg-orange-500/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-orange-300 text-base">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Active Recurring Precursor Pattern Alerts
                </div>
                <Link
                  href="/dashboard/patterns"
                  className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
                >
                  View All Patterns ({aggregates.patternCallouts.length}) <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aggregates.patternCallouts.slice(0, 2).map((pat) => (
                  <div
                    key={pat.id}
                    className="p-3.5 rounded-lg bg-surface border border-surface-border text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{pat.site}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {pat.count} Observations
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{pat.narrative}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Ingested Observations */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Recent Ingested Safety Observations</h3>
                <p className="text-xs text-slate-400">Classified live by Layer A ML Classifier</p>
              </div>
              <Link
                href="/dashboard/reports"
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                View All Reports <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentReports.map((r) => {
                const isSif = r.classification?.is_sif_potential;
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-lg bg-surface border border-surface-border hover:border-surface-border/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-400 font-mono">{r.site}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">{r.activity}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-500">{r.reported_date}</span>
                      </div>
                      <p className="text-slate-200 line-clamp-2 leading-relaxed">{r.raw_text}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isSif ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            SIF Precursor ({r.classification?.confidence}%)
                          </span>
                          <div className="text-[11px] text-amber-400 mt-1 font-medium">
                            {r.classification?.life_saving_rule}
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                            Non-SIF ({r.classification?.confidence}%)
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1">General Safety / Housekeeping</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
