"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import { SiteActivityAggregate } from "@/lib/types";

export default function PrecursorDensityPage() {
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState<SiteActivityAggregate[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSort, setSelectedSort] = useState<"density" | "reports" | "sif">("density");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/aggregates");
      const data = await res.json();
      if (data.success) {
        setAggregates(data.data.siteAggregates || []);
      }
    } catch (err) {
      console.error("Failed to load precursor density aggregates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSites = aggregates
    .filter((s) => s.site.toLowerCase().includes(search.toLowerCase()) || s.activity.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (selectedSort === "density") return b.precursor_density - a.precursor_density;
      if (selectedSort === "reports") return b.total_reports - a.total_reports;
      return b.sif_reports - a.sif_reports;
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Facility & Activity Precursor Density
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Statistical ranking of Oil India operational locations by Serious Injury or Fatality precursor concentration.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-slate-400 hover:text-white rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover transition-colors self-start md:self-auto"
          title="Refresh statistics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Formula & Explainability Callout */}
      <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="font-semibold text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Deterministic Precursor Density Metric:
          </div>
          <p className="text-slate-400">
            Density is defined as <code className="bg-surface px-1.5 py-0.5 rounded text-amber-300 font-mono">Density = (SIF_Reports / Total_Reports) &times; 100%</code>. Values &ge; 35% indicate severe precursor concentration requiring targeted HSE intervention.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 font-medium">
          <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">&ge;35% Critical</span>
          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">20-34% Elevated</span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">&lt;20% Controlled</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility name or activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-card border border-surface-border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Sort by:</span>
          <button
            onClick={() => setSelectedSort("density")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedSort === "density"
                ? "bg-amber-500 text-slate-950"
                : "bg-surface-card border border-surface-border text-slate-300 hover:text-white"
            }`}
          >
            Precursor Density
          </button>
          <button
            onClick={() => setSelectedSort("sif")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedSort === "sif"
                ? "bg-amber-500 text-slate-950"
                : "bg-surface-card border border-surface-border text-slate-300 hover:text-white"
            }`}
          >
            SIF Count
          </button>
          <button
            onClick={() => setSelectedSort("reports")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedSort === "reports"
                ? "bg-amber-500 text-slate-950"
                : "bg-surface-card border border-surface-border text-slate-300 hover:text-white"
            }`}
          >
            Total Reports
          </button>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading precursor density rankings...
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="p-12 rounded-xl bg-surface-card border border-surface-border text-center text-slate-400 text-sm">
          No facilities or activities match your query. Try adjusting your search term or upload safety reports first.
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-surface-border bg-surface/50">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Facility / Location</th>
                  <th className="py-3 px-4 font-semibold">High-Risk Activity</th>
                  <th className="py-3 px-4 font-semibold">Primary IOGP Rule</th>
                  <th className="py-3 px-4 font-semibold">Total Reports</th>
                  <th className="py-3 px-4 font-semibold">SIF Precursors</th>
                  <th className="py-3 px-4 font-semibold">Precursor Density</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-slate-300">
                {filteredSites.map((site, idx) => {
                  const isCritical = site.precursor_density >= 35;
                  const isElevated = site.precursor_density >= 20 && site.precursor_density < 35;

                  return (
                    <tr key={site.site} className="hover:bg-surface-hover/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? "bg-rose-500" : isElevated ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                          />
                          {site.site}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{site.activity}</td>
                      <td className="py-3.5 px-4">
                        {site.primary_rule ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {site.primary_rule}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{site.total_reports}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {site.sif_reports}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-28 bg-surface rounded-full h-2 overflow-hidden border border-surface-border">
                            <div
                              className={`h-full rounded-full ${
                                isCritical ? "bg-rose-500" : isElevated ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, site.precursor_density)}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              isCritical ? "text-rose-400" : isElevated ? "text-amber-300" : "text-emerald-400"
                            }`}
                          >
                            {site.precursor_density}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/reports?site=${encodeURIComponent(site.site)}`}
                          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium transition-colors"
                        >
                          Inspect Reports <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
