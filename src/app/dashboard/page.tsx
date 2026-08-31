"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
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
  Activity,
  Sun,
  Moon,
  Bot,
  BarChart3,
  Building2,
  CircleAlert,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

import {
  ReportWithClassification,
  SiteActivityAggregate,
  PatternCallout,
  LifeSavingRule,
} from "@/lib/types";

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  const [aggregates, setAggregates] = useState<{
    totalReports: number;
    sifReportsCount: number;
    nonSifReportsCount: number;
    overallPrecursorDensity: number;
    siteAggregates: SiteActivityAggregate[];
    ruleDistribution: {
      rule: LifeSavingRule;
      count: number;
      percentage: number;
    }[];
    patternCallouts: PatternCallout[];
    topRiskSite: string | null;
    highestRiskDensity: number;
  } | null>(null);

  const [recentReports, setRecentReports] = useState<
    ReportWithClassification[]
  >([]);

  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------
     FETCH DATA
  --------------------------------------------------------- */

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [aggRes, repRes] = await Promise.all([
        fetch("/api/aggregates"),
        fetch("/api/reports?limit=8"),
      ]);

      if (!aggRes.ok) {
        throw new Error("Failed to connect to aggregate service");
      }

      if (!repRes.ok) {
        throw new Error("Failed to connect to report service");
      }

      const aggData = await aggRes.json();
      const repData = await repRes.json();

      if (aggData.success) {
        setAggregates(aggData.data);
      } else {
        throw new Error(
          aggData.error || "Failed to load aggregate statistics"
        );
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

  /* ---------------------------------------------------------
     ICONS
  --------------------------------------------------------- */

  const getRuleIcon = (rule: string | null | undefined) => {
    switch (rule) {
      case "Working at Height":
        return <ArrowUpRight className="w-4 h-4" />;

      case "Energy Isolation":
        return <Zap className="w-4 h-4" />;

      case "Hot Work":
        return <Flame className="w-4 h-4" />;

      case "Confined Space":
        return <Maximize2 className="w-4 h-4" />;

      case "Line of Fire":
        return <ShieldAlert className="w-4 h-4" />;

      case "Driving":
        return <Truck className="w-4 h-4" />;

      case "Safe Mechanical Lifting":
        return <Anchor className="w-4 h-4" />;

      case "Bypassing Safety Controls":
        return <AlertTriangle className="w-4 h-4" />;

      case "Work Authorization":
        return <FileCheck className="w-4 h-4" />;

      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  /* ---------------------------------------------------------
     DERIVED DATA
  --------------------------------------------------------- */

  const facilityCount = aggregates?.siteAggregates?.length || 0;
  const ruleCount = aggregates?.ruleDistribution?.length || 0;

  const sifPercentage = useMemo(() => {
    if (!aggregates?.totalReports) return 0;

    return Math.round(
      (aggregates.sifReportsCount / aggregates.totalReports) * 100
    );
  }, [aggregates]);

  const densityLevel = useMemo(() => {
    const density = aggregates?.overallPrecursorDensity || 0;

    if (density >= 35) return "High";
    if (density >= 20) return "Medium";
    return "Low";
  }, [aggregates]);

  const riskColor = (density: number) => {
    if (density >= 35) return "bg-red-500";
    if (density >= 20) return "bg-amber-400";
    return "bg-emerald-400";
  };

  const riskTextColor = (density: number) => {
    if (density >= 35) return "text-red-400";
    if (density >= 20) return "text-amber-400";
    return "text-emerald-400";
  };

  const isEmpty = !aggregates || aggregates.totalReports === 0;

  /* ---------------------------------------------------------
     THEME CLASSES
  --------------------------------------------------------- */

  const pageBg = isDark
    ? "bg-[#070b14] text-slate-100"
    : "bg-slate-100 text-slate-900";

  const cardBg = isDark
    ? "bg-[#0d1422] border-white/[0.07]"
    : "bg-white border-slate-200";

  const muted = isDark ? "text-slate-400" : "text-slate-500";

  const subtle = isDark ? "text-slate-500" : "text-slate-400";

  const divider = isDark ? "border-white/[0.07]" : "border-slate-200";

  /* ---------------------------------------------------------
     LOADING
  --------------------------------------------------------- */

  if (loading) {
    return (
      <div
        className={`min-h-[80vh] flex flex-col items-center justify-center gap-4 ${pageBg}`}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
        </div>

        <div className="text-center">
          <p className="font-semibold">
            Loading Safety Intelligence
          </p>

          <p className={`text-sm mt-1 ${muted}`}>
            Connecting to SIF Sentinel analytics engine...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------
     ERROR
  --------------------------------------------------------- */

  if (error) {
    return (
      <div
        className={`min-h-[80vh] flex items-center justify-center px-6 ${pageBg}`}
      >
        <div
          className={`w-full max-w-lg rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-8`}
        >
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-5">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>

          <h2 className="text-xl font-bold">
            Dashboard Connection Error
          </h2>

          <p className={`text-sm mt-2 ${muted}`}>
            {error}
          </p>

          <button
            onClick={fetchData}
            className="mt-6 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------
     EMPTY STATE
  --------------------------------------------------------- */

  if (isEmpty) {
    return (
      <div className={`min-h-[80vh] ${pageBg} px-6 py-10`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-end mb-6">
            <button
              onClick={toggleTheme}
              className={`w-11 h-11 rounded-xl border ${divider} ${
                isDark ? "bg-slate-900" : "bg-white"
              } flex items-center justify-center`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>

          <div
            className={`rounded-3xl border ${cardBg} p-12 text-center shadow-2xl`}
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-9 h-9 text-amber-400" />
            </div>

            <h1 className="text-3xl font-bold mt-6">
              No Safety Reports Yet
            </h1>

            <p className={`max-w-xl mx-auto mt-3 ${muted}`}>
              Upload Oil India safety observations to generate
              SIF precursor classifications, IOGP rule tagging and
              facility risk intelligence.
            </p>

            <Link
              href="/dashboard/ingest"
              className="inline-flex items-center gap-2 mt-7 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Safety Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------
     MAIN DASHBOARD
  --------------------------------------------------------- */

  return (
    <div className={`min-h-screen ${pageBg} transition-colors duration-300`}>
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-7">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-7">

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Safety Command Center
              </h1>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Layer A Active
              </span>

            </div>

            <p className={`text-sm mt-1.5 ${muted}`}>
              Real-time SIF precursor intelligence for Oil India
              safety observations.
            </p>

          </div>

          <div className="flex items-center gap-2">

            {/* AI BUTTON */}

            <button
              onClick={() => window.dispatchEvent(new Event("open-ai-assistant"))}
              className={`h-10 px-4 rounded-xl border ${
                isDark
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15"
                  : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
              } flex items-center gap-2 text-sm font-semibold transition`}
              title="AI Safety Assistant"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">
                AI Assistant
              </span>
              <Sparkles className="w-3 h-3" />
            </button>

            {/* THEME */}

            <button
              onClick={toggleTheme}
              className={`h-10 w-10 rounded-xl border ${divider} ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800"
                  : "bg-white hover:bg-slate-50"
              } flex items-center justify-center transition`}
              title="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* REFRESH */}

            <button
              onClick={fetchData}
              className={`h-10 w-10 rounded-xl border ${divider} ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800"
                  : "bg-white hover:bg-slate-50"
              } flex items-center justify-center transition`}
              title="Refresh dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${muted}`} />
            </button>

            {/* INGEST */}

            <Link
              href="/dashboard/ingest"
              className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-amber-500/10"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">
                Ingest Reports
              </span>
            </Link>

          </div>
        </header>


        {/* =====================================================
            KPI GRID
        ===================================================== */}

        <section id="today-overview" aria-labelledby="today-overview-heading" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 scroll-mt-6">

          <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap items-end justify-between gap-2 mb-0.5">
            <div>
              <h2 id="today-overview-heading" className="font-display text-lg font-bold">Today&apos;s Overview</h2>
              <p className={`text-xs mt-1 ${subtle}`}>Live operational summary from processed safety observations.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live data
            </span>
          </div>

          {/* REPORTS */}

          <div
            className={`relative overflow-hidden rounded-2xl border ${cardBg} p-4 shadow-sm`}
          >
            <div className="flex items-start justify-between">

              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              </div>

              <span className="text-[10px] font-bold text-emerald-400">
                +100%
              </span>

            </div>

            <div className="mt-5">
              <div className="text-2xl font-bold">
                {aggregates?.totalReports?.toLocaleString() || 0}
              </div>

              <p className={`text-sm mt-1 ${muted}`}>
                Reports Processed
              </p>

              <p className={`text-[11px] mt-1.5 ${subtle}`}>
                {aggregates?.nonSifReportsCount || 0} non-SIF observations
              </p>
            </div>
          </div>


          {/* SIF */}

          <div
            className={`relative overflow-hidden rounded-2xl border border-red-500/20 ${
              isDark ? "bg-[#0d1422]" : "bg-white"
            } p-4 shadow-sm`}
          >
            <div className="flex items-start justify-between">

              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>

              <span className="text-[10px] font-bold text-red-400">
                HIGH PRIORITY
              </span>

            </div>

            <div className="mt-5">
              <div className="text-2xl font-bold">
                {aggregates?.sifReportsCount || 0}
              </div>

              <p className={`text-sm mt-1 ${muted}`}>
                SIF Precursors
              </p>

              <p className={`text-[11px] mt-1.5 ${subtle}`}>
                {sifPercentage}% of processed reports
              </p>
            </div>
          </div>


          {/* RULES */}

          <div
            className={`rounded-2xl border border-emerald-500/20 ${cardBg} p-4 shadow-sm`}
          >
            <div className="flex items-start justify-between">

              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>

              <span className="text-[10px] font-bold text-emerald-400">
                IOGP
              </span>

            </div>

            <div className="mt-5">
              <div className="text-2xl font-bold">
                {ruleCount}
              </div>

              <p className={`text-sm mt-1 ${muted}`}>
                Life-Saving Rules
              </p>

              <p className={`text-[11px] mt-1.5 ${subtle}`}>
                Active classifications
              </p>
            </div>
          </div>


          {/* FACILITIES */}

          <div
            className={`rounded-2xl border border-cyan-500/20 ${cardBg} p-4 shadow-sm`}
          >
            <div className="flex items-start justify-between">

              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>

              <span className="text-[10px] font-bold text-cyan-400">
                MONITORED
              </span>

            </div>

            <div className="mt-5">
              <div className="text-2xl font-bold">
                {facilityCount}
              </div>

              <p className={`text-sm mt-1 ${muted}`}>
                Facilities
              </p>

              <p className={`text-[11px] mt-1.5 ${subtle}`}>
                Operational sites
              </p>
            </div>
          </div>


          {/* DENSITY */}

          <div
            className={`rounded-2xl border border-amber-500/20 ${cardBg} p-4 shadow-sm`}
          >
            <div className="flex items-start justify-between">

              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>

              <span
                className={`text-[10px] font-bold ${
                  densityLevel === "High"
                    ? "text-red-400"
                    : densityLevel === "Medium"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {densityLevel.toUpperCase()}
              </span>

            </div>

            <div className="mt-5">
              <div className="text-2xl font-bold text-amber-400">
                {aggregates?.overallPrecursorDensity || 0}%
              </div>

              <p className={`text-sm mt-1 ${muted}`}>
                Precursor Density
              </p>

              <p className={`text-[11px] mt-1.5 ${subtle}`}>
                Overall facility risk
              </p>
            </div>
          </div>

        </section>


        {/* =====================================================
            INTELLIGENCE ROW
        ===================================================== */}

        <section id="risk-intelligence" className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr_1fr] gap-4 mb-5 items-start scroll-mt-6">

          {/* FACILITY RISK */}

          <div
            className={`rounded-2xl border ${cardBg} overflow-hidden`}
          >

            <div className={`px-5 py-4 border-b ${divider}`}>
              <div className="flex items-center justify-between">

                <div>
                  <h2 className="font-bold">
                    Facility Risk Overview
                  </h2>

                  <p className={`text-xs mt-1 ${subtle}`}>
                    Precursor density by operational facility
                  </p>
                </div>

                <Link
                  href="/dashboard/density"
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

              </div>
            </div>


            <div className="p-3">

              <div className="space-y-1">

                {aggregates?.siteAggregates
                  ?.slice()
                  .sort(
                    (a, b) =>
                      b.precursor_density - a.precursor_density
                  )
                  .slice(0, 6)
                  .map((site, index) => (

                    <div
                      key={site.site}
                      className={`grid grid-cols-[minmax(0,1fr)_70px_80px] items-center gap-3 rounded-xl px-3 py-3 ${
                        isDark
                          ? "hover:bg-white/[0.025]"
                          : "hover:bg-slate-50"
                      } transition`}
                    >

                      {/* SITE */}

                      <div className="min-w-0 flex items-center gap-3">

                        <div
                          className={`w-7 h-7 rounded-lg ${
                            site.precursor_density >= 35
                              ? "bg-red-500/10"
                              : site.precursor_density >= 20
                              ? "bg-amber-500/10"
                              : "bg-emerald-500/10"
                          } flex items-center justify-center shrink-0`}
                        >
                          <span className="text-[10px] font-bold">
                            {index + 1}
                          </span>
                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-semibold truncate">
                            {site.site}
                          </p>

                          <p className={`text-[10px] truncate mt-0.5 ${subtle}`}>
                            {site.activity || "Operational activity"}
                          </p>

                        </div>

                      </div>


                      {/* SIF */}

                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-400">
                          {site.sif_reports}
                        </p>

                        <p className={`text-[9px] ${subtle}`}>
                          SIF
                        </p>
                      </div>


                      {/* DENSITY */}

                      <div className="text-right">

                        <p
                          className={`text-sm font-bold ${riskTextColor(
                            site.precursor_density
                          )}`}
                        >
                          {site.precursor_density}%
                        </p>

                        <div className="mt-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${riskColor(
                              site.precursor_density
                            )}`}
                            style={{
                              width: `${Math.min(
                                100,
                                site.precursor_density
                              )}%`,
                            }}
                          />
                        </div>

                      </div>

                    </div>

                  ))}

              </div>

            </div>
          </div>


          {/* RISK DISTRIBUTION */}

          <div
            className={`rounded-2xl border ${cardBg} p-5`}
          >

            <div className="flex items-center justify-between mb-4">

              <div>
                <h2 className="font-bold">
                  Risk Distribution
                </h2>

                <p className={`text-xs mt-1 ${subtle}`}>
                  Current precursor severity
                </p>
              </div>

              <BarChart3 className="w-5 h-5 text-amber-400" />

            </div>


            {/* COMPACT DONUT */}

            <div className="flex items-center gap-6">

              <div
                className="relative w-36 h-36 rounded-full shrink-0"
                style={{
                  background: `conic-gradient(
                    #ef4444 0% ${Math.max(8, sifPercentage)}%,
                    #f59e0b ${Math.max(8, sifPercentage)}% 58%,
                    #10b981 58% 100%
                  )`,
                }}
              >

                <div
                  className={`absolute inset-[14px] rounded-full ${
                    isDark
                      ? "bg-[#0d1422]"
                      : "bg-white"
                  } flex flex-col items-center justify-center`}
                >

                  <span className="text-3xl font-bold">
                    {aggregates?.sifReportsCount || 0}
                  </span>

                  <span className={`text-[9px] uppercase tracking-wider ${subtle}`}>
                    SIF Alerts
                  </span>

                </div>

              </div>


              <div className="flex-1 space-y-3">

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className={`text-xs ${muted}`}>
                      SIF Precursors
                    </span>
                  </div>

                  <span className="text-xs font-bold">
                    {aggregates?.sifReportsCount || 0}
                  </span>
                </div>


                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className={`text-xs ${muted}`}>
                      Active Rules
                    </span>
                  </div>

                  <span className="text-xs font-bold">
                    {ruleCount}
                  </span>
                </div>


                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className={`text-xs ${muted}`}>
                      Facilities
                    </span>
                  </div>

                  <span className="text-xs font-bold">
                    {facilityCount}
                  </span>
                </div>

              </div>

            </div>


            <div className={`mt-5 pt-4 border-t ${divider}`}>

              <div className="flex items-center justify-between">

                <span className={`text-xs ${muted}`}>
                  Highest risk facility
                </span>

                <span className="text-xs font-semibold text-amber-400 truncate max-w-[150px]">
                  {aggregates?.topRiskSite || "No data"}
                </span>

              </div>

            </div>

          </div>


          {/* AI / RISK INTELLIGENCE */}

          <div
            className={`rounded-2xl border ${
              isDark
                ? "border-purple-500/20 bg-gradient-to-br from-purple-500/[0.08] to-slate-900"
                : "border-purple-200 bg-gradient-to-br from-purple-50 to-white"
            } p-5`}
          >

            <div className="flex items-start justify-between">

              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>

            </div>

            <h2 className="text-lg font-bold mt-5">
              AI Risk Intelligence
            </h2>

            <p className={`text-xs leading-relaxed mt-2 ${muted}`}>
              Layer A continuously analyzes observations,
              identifies recurring SIF precursor patterns and
              maps them against IOGP Life-Saving Rules.
            </p>


            <div className="grid grid-cols-2 gap-2 mt-5">

              <div
                className={`rounded-xl p-3 ${
                  isDark
                    ? "bg-black/20 border border-white/5"
                    : "bg-white border border-slate-200"
                }`}
              >
                <p className="text-lg font-bold text-purple-400">
                  91.8%
                </p>

                <p className={`text-[10px] mt-1 ${subtle}`}>
                  Classifier precision
                </p>
              </div>


              <div
                className={`rounded-xl p-3 ${
                  isDark
                    ? "bg-black/20 border border-white/5"
                    : "bg-white border border-slate-200"
                }`}
              >
                <p className="text-lg font-bold text-emerald-400">
                  LIVE
                </p>

                <p className={`text-[10px] mt-1 ${subtle}`}>
                  Intelligence engine
                </p>
              </div>

            </div>


            <button
              onClick={() => window.dispatchEvent(new Event("open-ai-assistant"))}
              className="w-full mt-4 h-10 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Bot className="w-4 h-4" />
              Open AI Safety Assistant
            </button>

          </div>

        </section>


        {/* =====================================================
            RULES + PATTERNS
        ===================================================== */}

        <section id="life-saving-rules" className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5 scroll-mt-6">

          {/* RULES */}

          <div
            className={`rounded-2xl border ${cardBg} overflow-hidden`}
          >

            <div className={`px-5 py-4 border-b ${divider}`}>

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="font-bold">
                    Life-Saving Rules
                  </h2>

                  <p className={`text-xs mt-1 ${subtle}`}>
                    Current precursor classification
                  </p>
                </div>

                <Shield className="w-5 h-5 text-emerald-400" />

              </div>

            </div>


            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">

              {aggregates?.ruleDistribution
                ?.slice(0, 6)
                .map((item) => (

                  <div
                    key={item.rule}
                    className={`flex items-center gap-3 rounded-xl p-3 ${
                      isDark
                        ? "bg-slate-950/50 border border-white/5"
                        : "bg-slate-50 border border-slate-200"
                    }`}
                  >

                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      {getRuleIcon(item.rule)}
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center justify-between gap-2">

                        <span className="text-xs font-medium truncate">
                          {item.rule}
                        </span>

                        <span className="text-xs font-bold text-amber-400 shrink-0">
                          {item.percentage}%
                        </span>

                      </div>

                      <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">

                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{
                            width: `${Math.min(
                              100,
                              item.percentage
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>

                ))}

            </div>

          </div>


          {/* PATTERNS */}

          <div
            className={`rounded-2xl border ${
              aggregates?.patternCallouts?.length
                ? "border-orange-500/20"
                : divider
            } ${cardBg} overflow-hidden`}
          >

            <div className={`px-5 py-4 border-b ${divider}`}>

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <CircleAlert className="w-4 h-4 text-orange-400" />
                  </div>

                  <div>

                    <h2 className="font-bold">
                      Recurring Precursor Patterns
                    </h2>

                    <p className={`text-xs mt-1 ${subtle}`}>
                      Repeated safety risks requiring attention
                    </p>

                  </div>

                </div>

                <Link
                  href="/dashboard/patterns"
                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

              </div>

            </div>


            <div className="p-4">

              {aggregates?.patternCallouts?.length ? (

                <div className="space-y-2">

                  {aggregates.patternCallouts
                    .slice(0, 3)
                    .map((pat) => (

                      <div
                        key={pat.id}
                        className={`rounded-xl p-3.5 ${
                          isDark
                            ? "bg-orange-500/[0.04] border border-orange-500/10"
                            : "bg-orange-50 border border-orange-100"
                        }`}
                      >

                        <div className="flex items-center justify-between gap-3">

                          <span className="text-sm font-semibold truncate">
                            {pat.site}
                          </span>

                          <span className="shrink-0 px-2 py-1 rounded-md bg-orange-500/10 text-[10px] font-bold text-orange-400">
                            {pat.count}
                          </span>

                        </div>

                        <p className={`text-xs mt-1.5 line-clamp-2 ${muted}`}>
                          {pat.narrative}
                        </p>

                      </div>

                    ))}

                </div>

              ) : (

                <div className="py-8 text-center">

                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />

                  <p className="text-sm font-semibold mt-3">
                    No recurring patterns detected
                  </p>

                  <p className={`text-xs mt-1 ${subtle}`}>
                    Current observations show no significant repeated precursor.
                  </p>

                </div>

              )}

            </div>

          </div>

        </section>


        {/* =====================================================
            RECENT OBSERVATIONS
        ===================================================== */}

        <section
          className={`rounded-2xl border ${cardBg} overflow-hidden`}
        >

          <div className={`px-5 py-4 border-b ${divider}`}>

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-bold">
                  Active &amp; High-Priority Reports
                </h2>

                <p className={`text-xs mt-1 ${subtle}`}>
                  Latest safety observations classified by Layer A
                </p>

              </div>

              <Link
                href="/dashboard/reports"
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

            </div>

          </div>


          <div className="divide-y divide-white/[0.05]">

            {recentReports.map((report) => {

              const isSif =
                report.classification?.is_sif_potential;
              const lifeSavingRule = report.classification?.life_saving_rule;

              return (

                <div
                  key={report.id}
                  className={`px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4 ${
                    isDark
                      ? "hover:bg-white/[0.02]"
                      : "hover:bg-slate-50"
                  } transition`}
                >

                  {/* LEFT */}

                  <div className="flex items-start gap-3 min-w-0 flex-1">

                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSif
                          ? "bg-red-500/10 border border-red-500/20"
                          : "bg-emerald-500/10 border border-emerald-500/20"
                      }`}
                    >

                      {isSif ? (
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}

                    </div>


                    <div className="min-w-0 flex-1">

                      <p className="text-sm font-semibold truncate mb-1">
                        {report.activity || "Safety observation"}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mb-1">

                        <span className="text-xs font-semibold">
                          {report.site}
                        </span>

                        <span className={subtle}>•</span>

                        <span className={`text-[11px] ${muted}`}>
                          {report.activity}
                        </span>

                        <span className={subtle}>•</span>

                        <span className={`text-[11px] ${subtle}`}>
                          {report.reported_date}
                        </span>

                      </div>


                      <p
                        className={`text-xs leading-relaxed line-clamp-2 ${muted}`}
                      >
                        {report.raw_text}
                      </p>

                    </div>

                  </div>


                  {/* RIGHT */}

                  <div className="lg:w-[220px] shrink-0">

                    <div className="flex lg:flex-col lg:items-end gap-2">

                      {isSif ? (

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400">
                          <ShieldAlert className="w-3 h-3" />
                          SIF Precursor
                        </span>

                      ) : (

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Non-SIF
                        </span>

                      )}

                      {lifeSavingRule && (
                        <span className="inline-flex max-w-full truncate px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-bold text-sky-400">
                          {lifeSavingRule}
                        </span>
                      )}

                      <span className={`text-[10px] ${subtle}`}>
                        Confidence:{" "}
                        {report.classification?.confidence ?? 0}%
                      </span>

                    </div>

                  </div>

                </div>

              );
            })}

          </div>

        </section>

      </div>


      {/* =======================================================
          FLOATING AI BUTTON
      ======================================================= */}

      <button
        onClick={() => window.dispatchEvent(new Event("open-ai-assistant"))}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-purple-500 hover:bg-purple-400 text-white shadow-2xl shadow-purple-500/30 flex items-center justify-center transition-all hover:scale-105"
        title="AI Safety Assistant"
      >
        <Bot className="w-6 h-6" />

        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#070b14]" />
      </button>

    </div>
  );
}
