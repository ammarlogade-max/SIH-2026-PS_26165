"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  ZapOff,
  Flame,
  Maximize2,
  ArrowUpRight,
  Truck,
  Anchor,
  AlertTriangle,
  FileCheck,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ClipboardCheck,
  BrainCircuit,
  Building2,
} from "lucide-react";
import clsx from "clsx";
import { IOGP_LIFE_SAVING_RULES, LifeSavingRule, Report, Classification } from "@/lib/types";

// Icon mapping helper
const RULE_ICONS: Record<string, typeof ShieldCheck> = {
  ZapOff,
  Flame,
  Maximize2,
  ArrowUpRight,
  ShieldAlert,
  Truck,
  Anchor,
  AlertTriangle,
  FileCheck,
};

export default function LifeSavingRulesPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRule, setSelectedRule] = useState<LifeSavingRule | null>(null);

  const fetchRuleData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports?limit=100");
      const data = await res.json();
      setReports(data.reports || []);
      setClassifications(data.classifications || []);
    } catch (err) {
      console.error("Failed to load rule data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuleData();
  }, []);

  // Compute stats per rule
  const ruleStats = useMemo(() => {
    const classMap = new Map(classifications.map((c) => [c.report_id, c]));
    const counts: Record<LifeSavingRule, { sifCount: number; sites: Set<string>; recentReports: Report[] }> = {
      "Energy Isolation": { sifCount: 0, sites: new Set(), recentReports: [] },
      "Hot Work": { sifCount: 0, sites: new Set(), recentReports: [] },
      "Confined Space": { sifCount: 0, sites: new Set(), recentReports: [] },
      "Working at Height": { sifCount: 0, sites: new Set(), recentReports: [] },
      "Line of Fire": { sifCount: 0, sites: new Set(), recentReports: [] },
      "Driving": { sifCount: 0, sites: new Set(), recentReports: [] },
      "Safe Mechanical Lifting": { sifCount: 0, sites: new Set(), recentReports: [] },
      "Bypassing Safety Controls": { sifCount: 0, sites: new Set(), recentReports: [] },
      "Work Authorization": { sifCount: 0, sites: new Set(), recentReports: [] },
    };

    for (const rep of reports) {
      const cls = classMap.get(rep.id);
      if (cls && cls.life_saving_rule && counts[cls.life_saving_rule]) {
        const item = counts[cls.life_saving_rule];
        if (cls.is_sif_potential) {
          item.sifCount++;
          item.sites.add(rep.site);
        }
        item.recentReports.push(rep);
      }
    }

    return counts;
  }, [reports, classifications]);

  const totalSif = useMemo(() => {
    return Object.values(ruleStats).reduce((acc, curr) => acc + curr.sifCount, 0);
  }, [ruleStats]);

  const filteredRules = useMemo(() => {
    return IOGP_LIFE_SAVING_RULES.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesKw = r.keywords.some((k) => k.toLowerCase().includes(q));
        return matchesTitle || matchesDesc || matchesKw;
      }
      return true;
    });
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <ShieldCheck className="h-4 w-4" />
            International Oil &amp; Gas Producers (IOGP)
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            9 Life-Saving Rules Intelligence
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Standardized barrier taxonomy mapping observations to the global energy industry life-saving rules framework.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/investigate"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400"
          >
            <BrainCircuit className="h-4 w-4" />
            Investigate Rule Precursors
          </Link>
        </div>
      </div>

      {/* Overview Stat Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-4">
          <span className="text-[11px] font-semibold text-slate-400">Framework Standard</span>
          <p className="font-display text-lg font-bold text-slate-100 mt-1">IOGP Report 459</p>
          <p className="text-[10px] text-slate-500">Industry benchmark standard</p>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-4">
          <span className="text-[11px] font-semibold text-slate-400">Rules Monitored</span>
          <p className="font-display text-lg font-bold text-amber-400 mt-1">9 Critical Controls</p>
          <p className="text-[10px] text-slate-500">100% taxonomy coverage</p>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-4">
          <span className="text-[11px] font-semibold text-slate-400">SIF Precursors Mapped</span>
          <p className="font-display text-lg font-bold text-red-400 mt-1">{totalSif} Events</p>
          <p className="text-[10px] text-slate-500">Classified by Layer A model</p>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-4">
          <span className="text-[11px] font-semibold text-slate-400">Automated Extraction</span>
          <p className="font-display text-lg font-bold text-emerald-400 mt-1">TF-IDF N-grams</p>
          <p className="text-[10px] text-slate-500">Centroid cosine matching</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative rounded-2xl border border-surface-border bg-surface-card/85 p-3">
        <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rules by title, keywords (e.g. 'isolation', 'welding', 'harness', 'bypass', 'crane')..."
          className="h-10 w-full rounded-xl border border-surface-border bg-surface/75 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
        />
      </div>

      {/* Rules Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRules.map((rule) => {
          const stats = ruleStats[rule.id] || { sifCount: 0, sites: new Set(), recentReports: [] };
          const IconComponent = RULE_ICONS[rule.icon] || ShieldCheck;
          const siteList = Array.from(stats.sites);

          return (
            <div
              key={rule.id}
              className="flex flex-col justify-between rounded-2xl border border-surface-border bg-surface-card/90 p-5 transition-all duration-200 hover:border-surface-border-strong hover:shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400 shadow-sm">
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <div className="text-right">
                    <span
                      className={clsx(
                        "font-display text-lg font-bold",
                        stats.sifCount > 0 ? "text-amber-400" : "text-slate-500"
                      )}
                    >
                      {stats.sifCount}
                    </span>
                    <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                      SIF Precursors
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-base font-bold text-slate-100 mt-3">{rule.title}</h3>
                <p className="text-xs leading-relaxed text-slate-300 mt-1.5">{rule.description}</p>

                {/* Detected Keywords pills */}
                <div className="mt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Recognized Operational Triggers:
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {rule.keywords.slice(0, 6).map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400"
                      >
                        {kw}
                      </span>
                    ))}
                    {rule.keywords.length > 6 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{rule.keywords.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Vulnerable Sites */}
                {siteList.length > 0 && (
                  <div className="mt-3.5 border-t border-surface-border/60 pt-2.5">
                    <span className="text-[10px] font-semibold text-slate-400">Active at facilities:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {siteList.map((site) => (
                        <span
                          key={site}
                          className="inline-flex items-center gap-1 rounded bg-surface/75 px-1.5 py-0.5 text-[10px] text-slate-300"
                        >
                          <Building2 className="h-2.5 w-2.5 text-slate-500" />
                          {site}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-surface-border/60 pt-3">
                <Link
                  href={`/dashboard/reports?rule=${encodeURIComponent(rule.id)}`}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                >
                  View {stats.recentReports.length} reports
                </Link>

                <Link
                  href={`/dashboard/investigate?rule=${encodeURIComponent(rule.id)}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  Investigate
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
