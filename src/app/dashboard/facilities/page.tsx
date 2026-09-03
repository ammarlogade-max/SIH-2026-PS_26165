"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ClipboardCheck,
  BrainCircuit,
  MapPin,
  X,
} from "lucide-react";
import clsx from "clsx";
import { FacilitySummary, LifeSavingRule, Report, Classification, CorrectiveAction } from "@/lib/types";

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<FacilitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  // Drilldown Drawer
  const [selectedFacility, setSelectedFacility] = useState<FacilitySummary | null>(null);
  const [facilityReports, setFacilityReports] = useState<Report[]>([]);
  const [facilityActions, setFacilityActions] = useState<CorrectiveAction[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

  const fetchFacilities = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/facilities");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load facilities");
      setFacilities(data.facilities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching facilities");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const openFacilityDrilldown = async (facility: FacilitySummary) => {
    setSelectedFacility(facility);
    setDrillLoading(true);
    try {
      const [repRes, actRes] = await Promise.all([
        fetch(`/api/reports?site=${encodeURIComponent(facility.name)}`),
        fetch(`/api/actions?site=${encodeURIComponent(facility.name)}`),
      ]);
      const repData = await repRes.json();
      const actData = await actRes.json();
      setFacilityReports(repData.reports || []);
      setFacilityActions(actData.actions || []);
    } catch (err) {
      console.error("Failed to load drilldown details:", err);
    } finally {
      setDrillLoading(false);
    }
  };

  const filteredFacilities = useMemo(() => {
    return facilities.filter((fac) => {
      if (riskFilter !== "all" && fac.risk_level !== riskFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          fac.name.toLowerCase().includes(q) ||
          fac.code.toLowerCase().includes(q) ||
          fac.type.toLowerCase().includes(q) ||
          fac.location.toLowerCase().includes(q) ||
          (fac.primary_rule && fac.primary_rule.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [facilities, riskFilter, searchQuery]);

  const summary = useMemo(() => {
    return {
      total: facilities.length,
      critical: facilities.filter((f) => f.risk_level === "critical").length,
      elevated: facilities.filter((f) => f.risk_level === "elevated").length,
      controlled: facilities.filter((f) => f.risk_level === "controlled").length,
    };
  }, [facilities]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Building2 className="h-4 w-4" />
            Asset &amp; Production Site Intelligence
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Facility Risk Matrix
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time precursor density rankings, safety scores, and active barrier integrity across Oil India Limited assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchFacilities(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-3 text-xs font-semibold text-slate-300 transition hover:bg-surface-hover hover:text-white"
          >
            <RefreshCw className={clsx("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
          <Link
            href="/dashboard/investigate"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-400"
          >
            <BrainCircuit className="h-4 w-4" />
            Investigate High-Risk Site
          </Link>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-4">
          <span className="text-[11px] font-semibold text-slate-400">Monitored Facilities</span>
          <p className="font-display text-2xl font-bold text-slate-100 mt-1">{summary.total}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Assam asset exploration &amp; production</p>
        </div>

        <button
          onClick={() => setRiskFilter(riskFilter === "critical" ? "all" : "critical")}
          className={clsx(
            "rounded-2xl border p-4 text-left transition",
            riskFilter === "critical"
              ? "border-red-400/40 bg-red-500/10 shadow-sm"
              : "border-surface-border bg-surface-card/80 hover:bg-surface-card"
          )}
        >
          <span className="text-[11px] font-semibold text-red-400">Critical Risk Sites</span>
          <p className="font-display text-2xl font-bold text-red-400 mt-1">{summary.critical}</p>
          <p className="text-[10px] text-red-300/80 mt-0.5">SIF density &gt; 35% or active pattern</p>
        </button>

        <button
          onClick={() => setRiskFilter(riskFilter === "elevated" ? "all" : "elevated")}
          className={clsx(
            "rounded-2xl border p-4 text-left transition",
            riskFilter === "elevated"
              ? "border-amber-400/40 bg-amber-500/10 shadow-sm"
              : "border-surface-border bg-surface-card/80 hover:bg-surface-card"
          )}
        >
          <span className="text-[11px] font-semibold text-amber-400">Elevated Risk Sites</span>
          <p className="font-display text-2xl font-bold text-amber-400 mt-1">{summary.elevated}</p>
          <p className="text-[10px] text-amber-300/80 mt-0.5">Precursor density 15% - 35%</p>
        </button>

        <button
          onClick={() => setRiskFilter(riskFilter === "controlled" ? "all" : "controlled")}
          className={clsx(
            "rounded-2xl border p-4 text-left transition",
            riskFilter === "controlled"
              ? "border-emerald-400/40 bg-emerald-500/10 shadow-sm"
              : "border-surface-border bg-surface-card/80 hover:bg-surface-card"
          )}
        >
          <span className="text-[11px] font-semibold text-emerald-400">Controlled Operations</span>
          <p className="font-display text-2xl font-bold text-emerald-400 mt-1">{summary.controlled}</p>
          <p className="text-[10px] text-emerald-300/80 mt-0.5">Precursor density &lt; 15%</p>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-surface-border bg-surface-card/85 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter facilities by name, code, type, or Life-Saving Rule..."
            className="h-10 w-full rounded-xl border border-surface-border bg-surface/75 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="h-10 rounded-xl border border-surface-border bg-surface/75 px-3 text-xs font-medium text-slate-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical Risk</option>
            <option value="elevated">Elevated Risk</option>
            <option value="controlled">Controlled</option>
          </select>
        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-surface-border bg-surface-card">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
          <p className="text-xs text-slate-400">Loading facility intelligence...</p>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-card/50 p-6 text-center">
          <Building2 className="h-8 w-8 text-slate-500" />
          <p className="text-sm font-medium text-slate-300">No facilities found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFacilities.map((fac) => {
            return (
              <div
                key={fac.id}
                onClick={() => openFacilityDrilldown(fac)}
                className={clsx(
                  "group cursor-pointer rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl",
                  fac.risk_level === "critical"
                    ? "border-red-500/35 bg-surface-card/95 hover:border-red-500/60"
                    : fac.risk_level === "elevated"
                    ? "border-amber-500/35 bg-surface-card/95 hover:border-amber-500/60"
                    : "border-surface-border bg-surface-card/90 hover:border-emerald-500/50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{fac.code}</span>
                      <span
                        className={clsx(
                          "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          fac.risk_level === "critical"
                            ? "bg-red-500/15 text-red-300 border border-red-500/30"
                            : fac.risk_level === "elevated"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        )}
                      >
                        {fac.risk_level}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-100 mt-1 group-hover:text-amber-400 transition-colors">
                      {fac.name}
                    </h3>
                    <p className="text-xs text-slate-400">{fac.type}</p>
                  </div>

                  {/* Safety Score Dial */}
                  <div className="flex flex-col items-center">
                    <div
                      className={clsx(
                        "flex h-12 w-12 items-center justify-center rounded-2xl font-display text-base font-bold shadow-md",
                        fac.safety_score < 60
                          ? "border border-red-500/40 bg-red-500/15 text-red-300"
                          : fac.safety_score < 80
                          ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                          : "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      )}
                    >
                      {fac.safety_score}
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 mt-1">Safety Score</span>
                  </div>
                </div>

                {/* Precursor Density Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">SIF Precursor Density</span>
                    <span
                      className={clsx(
                        "font-mono font-bold",
                        fac.precursor_density >= 35
                          ? "text-red-400"
                          : fac.precursor_density >= 15
                          ? "text-amber-400"
                          : "text-emerald-400"
                      )}
                    >
                      {fac.precursor_density.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
                    <div
                      className={clsx(
                        "h-full rounded-full transition-all duration-500",
                        fac.precursor_density >= 35
                          ? "bg-red-500"
                          : fac.precursor_density >= 15
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(100, fac.precursor_density)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{fac.sif_reports} SIF precursors</span>
                    <span>{fac.total_reports} total observations</span>
                  </div>
                </div>

                {/* Tags & Drilldown preview */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-surface-border/60 pt-3">
                  {fac.primary_rule && (
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      Rule: {fac.primary_rule}
                    </span>
                  )}
                  {fac.active_patterns_count > 0 && (
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      {fac.active_patterns_count} Patterns
                    </span>
                  )}
                  {fac.open_actions_count > 0 && (
                    <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                      {fac.open_actions_count} Open CAPA
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-amber-400/90 group-hover:text-amber-300">
                  <span>Inspect facility details</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Facility Drilldown Drawer */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setSelectedFacility(null)}
          />
          <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-surface-border bg-surface-card shadow-2xl overflow-y-auto p-6 sm:p-8">
            <div className="flex items-start justify-between border-b border-surface-border pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">{selectedFacility.code}</span>
                  <span
                    className={clsx(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      selectedFacility.risk_level === "critical"
                        ? "bg-red-500/15 text-red-300 border border-red-500/30"
                        : selectedFacility.risk_level === "elevated"
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    )}
                  >
                    {selectedFacility.risk_level} risk
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-100 mt-1">{selectedFacility.name}</h2>
                <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  {selectedFacility.location} · {selectedFacility.type}
                </p>
              </div>

              <button
                onClick={() => setSelectedFacility(null)}
                className="rounded-xl border border-surface-border p-2 text-slate-400 hover:bg-surface-hover hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href={`/dashboard/investigate?site=${encodeURIComponent(selectedFacility.name)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400"
              >
                <BrainCircuit className="h-4 w-4" />
                Run AI Precursor Investigation
              </Link>
              <Link
                href={`/dashboard/actions?site=${encodeURIComponent(selectedFacility.name)}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface/75 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-surface-hover"
              >
                <ClipboardCheck className="h-4 w-4" />
                View &amp; Create CAPA Actions
              </Link>
            </div>

            {/* Metrics Breakdown */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-surface-border bg-surface/50 p-3.5">
                <span className="text-[10px] text-slate-400">Precursor Density</span>
                <p className="font-display text-xl font-bold text-amber-400 mt-1">
                  {selectedFacility.precursor_density.toFixed(1)}%
                </p>
                <p className="text-[10px] text-slate-500">{selectedFacility.sif_reports} SIF / {selectedFacility.total_reports} total</p>
              </div>

              <div className="rounded-xl border border-surface-border bg-surface/50 p-3.5">
                <span className="text-[10px] text-slate-400">Facility Safety Score</span>
                <p
                  className={clsx(
                    "font-display text-xl font-bold mt-1",
                    selectedFacility.safety_score < 60
                      ? "text-red-400"
                      : selectedFacility.safety_score < 80
                      ? "text-amber-400"
                      : "text-emerald-400"
                  )}
                >
                  {selectedFacility.safety_score} / 100
                </p>
                <p className="text-[10px] text-slate-500">Calculated safety baseline</p>
              </div>

              <div className="rounded-xl border border-surface-border bg-surface/50 p-3.5">
                <span className="text-[10px] text-slate-400">Primary Vulnerability</span>
                <p className="font-display text-xs font-bold text-slate-200 mt-1 truncate">
                  {selectedFacility.primary_rule || "None Identified"}
                </p>
                <p className="text-[10px] text-slate-500">{selectedFacility.active_patterns_count} active clusters</p>
              </div>
            </div>

            {/* Observations at this facility */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-slate-200">
                  Recent Observations at {selectedFacility.name}
                </h3>
                <span className="text-xs text-slate-400">{facilityReports.length} records</span>
              </div>

              {drillLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
                </div>
              ) : facilityReports.length === 0 ? (
                <p className="text-xs text-slate-500">No field observations recorded for this facility.</p>
              ) : (
                <div className="space-y-2.5">
                  {facilityReports.slice(0, 6).map((rep) => (
                    <div key={rep.id} className="rounded-xl border border-surface-border bg-surface/50 p-3 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>{rep.activity}</span>
                        <span>{rep.reported_date}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{rep.raw_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active CAPA actions */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-slate-200">
                  Assigned CAPA Actions at this Facility
                </h3>
                <span className="text-xs text-slate-400">{facilityActions.length} actions</span>
              </div>

              {facilityActions.length === 0 ? (
                <p className="text-xs text-slate-500">No corrective actions currently assigned to this facility.</p>
              ) : (
                <div className="space-y-2.5">
                  {facilityActions.map((act) => (
                    <div key={act.id} className="rounded-xl border border-surface-border bg-surface/50 p-3 text-xs">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-semibold text-amber-400 uppercase">{act.priority} priority</span>
                        <span className="text-slate-400">Due {act.due_date} · {act.status}</span>
                      </div>
                      <p className="font-semibold text-slate-200">{act.title}</p>
                      {act.description && <p className="text-slate-400 text-[11px] mt-0.5">{act.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
