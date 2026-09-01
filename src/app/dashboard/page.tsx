"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
} from "lucide-react";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";
import { useTheme } from "@/components/ThemeProvider";

interface PatternCallout {
  id: string | number;
  site: string;
  count: number;
  narrative: string;
}

interface CategoryBreakdownItem {
  name: string;
  percentage: number;
}

interface Classification {
  is_sif_potential?: boolean;
  life_saving_rule?: string;
  confidence?: number;
}

interface Report {
  id: string | number;
  activity?: string;
  site?: string;
  reported_date?: string;
  raw_text?: string;
  classification?: Classification;
}

interface Aggregates {
  categoryBreakdown?: CategoryBreakdownItem[];
  patternCallouts?: PatternCallout[];
}

export default function DashboardPage() {
  const { isDark } = useTheme();
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aggregates, setAggregates] = useState<Aggregates>({
    categoryBreakdown: [
      { name: "PPE Compliance", percentage: 85 },
      { name: "Working at Heights", percentage: 62 },
      { name: "Energy Isolation (LOTO)", percentage: 74 },
      { name: "Safe Mechanical Lifting", percentage: 58 },
    ],
    patternCallouts: [],
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [aggRes, repRes] = await Promise.all([
          fetch("/api/aggregates"),
          fetch("/api/reports?limit=6"),
        ]);

        if (aggRes.ok) {
          const aggData = await aggRes.json();
          if (aggData.success && aggData.data) {
            const ruleDist = aggData.data.ruleDistribution || [];
            const breakdown =
              ruleDist.length > 0
                ? ruleDist.slice(0, 4).map((r: any) => ({
                    name: r.rule,
                    percentage: r.percentage,
                  }))
                : [
                    { name: "PPE Compliance", percentage: 85 },
                    { name: "Working at Heights", percentage: 62 },
                    { name: "Energy Isolation (LOTO)", percentage: 74 },
                    { name: "Safe Mechanical Lifting", percentage: 58 },
                  ];

            setAggregates({
              categoryBreakdown: breakdown,
              patternCallouts: aggData.data.patternCallouts || [],
            });
          }
        }

        if (repRes.ok) {
          const repData = await repRes.json();
          if (repData.success && repData.reports) {
            setRecentReports(repData.reports.slice(0, 6));
          }
        }
      } catch (err) {
        console.error("Dashboard overview data loading error:", err);
      }
    }

    loadData();
  }, []);

  const cardBg = isDark
    ? "bg-[#0b1220] text-white"
    : "bg-white text-slate-900 shadow-sm";
  const divider = isDark ? "border-white/10" : "border-slate-200";
  const subtle = isDark ? "text-slate-400" : "text-slate-500";
  const muted = isDark ? "text-slate-300" : "text-slate-600";

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#070b14]" : "bg-slate-50"}`}>
      
      {/* HEADER SECTION */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className={`text-xs mt-1 ${subtle}`}>
            Real-time safety observations &amp; risk analytics
          </p>
        </div>

        {/* Header AI Assistant Button */}
        <button
          type="button"
          onClick={() => setIsAiDrawerOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI assistant ✧</span>
        </button>
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* CATEGORY BREAKDOWN */}
          <div className={`rounded-2xl border ${divider} ${cardBg} p-5`}>
            <h2 className="font-bold mb-4">Category Analysis</h2>
            <div className="space-y-4">
              {aggregates?.categoryBreakdown?.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs font-bold text-amber-400 shrink-0">
                      {item.percentage}%
                    </span>
                  </div>

                  <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${Math.min(100, item.percentage)}%`,
                      }}
                    />
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

        {/* RECENT OBSERVATIONS */}
        <section className={`rounded-2xl border ${cardBg} overflow-hidden`}>
          <div className={`px-5 py-4 border-b ${divider}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">Active &amp; High-Priority Reports</h2>
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
              const isSif = report.classification?.is_sif_potential;
              const lifeSavingRule = report.classification?.life_saving_rule;

              return (
                <div
                  key={report.id}
                  className={`px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4 ${
                    isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50"
                  } transition`}
                >
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
                        <span className="text-xs font-semibold">{report.site}</span>
                        <span className={subtle}>•</span>
                        <span className={`text-[11px] ${muted}`}>{report.activity}</span>
                        <span className={subtle}>•</span>
                        <span className={`text-[11px] ${subtle}`}>{report.reported_date}</span>
                      </div>

                      <p className={`text-xs leading-relaxed line-clamp-2 ${muted}`}>
                        {report.raw_text}
                      </p>
                    </div>
                  </div>

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
                        Confidence: {report.classification?.confidence ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* FLOATING PURPLE AI BUTTON */}
      <button
        type="button"
        onClick={() => setIsAiDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-purple-500 hover:bg-purple-400 text-white shadow-2xl shadow-purple-500/30 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
        title="AI Safety Assistant"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#070b14]" />
      </button>

      {/* SLIDE-OVER AI INTERACTIVE DRAWER */}
      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />
    </div>
  );
}
