"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useAIAssistant } from "@/context/AIAssistantContext";
import type { PatternCallout, ReportWithClassification, SiteActivityAggregate } from "@/lib/types";

type RuleDistribution = { rule: string; count: number; percentage: number };
type TrendPoint = { date: string; reports: number; sif: number };

type Aggregates = {
  totalReports: number;
  sifReportsCount: number;
  overallPrecursorDensity: number;
  siteAggregates: SiteActivityAggregate[];
  ruleDistribution: RuleDistribution[];
  patternCallouts: PatternCallout[];
  openActionsCount?: number;
  verifiedActionsCount?: number;
  totalActionsCount?: number;
  totalAuditLogsCount?: number;
};

const emptyAggregates: Aggregates = {
  totalReports: 0,
  sifReportsCount: 0,
  overallPrecursorDensity: 0,
  siteAggregates: [],
  ruleDistribution: [],
  patternCallouts: [],
  openActionsCount: 0,
  verifiedActionsCount: 0,
  totalActionsCount: 0,
  totalAuditLogsCount: 0,
};

function riskProfile(density: number, hasData: boolean) {
  if (!hasData) return {
    label: "Awaiting Baseline",
    description: "Submit observations to establish real-time baseline exposure.",
    badge: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    color: "#94a3b8",
  };
  if (density >= 35) return {
    label: "Critical Precursor Density",
    description: "SIF precursor concentration exceeds 35% threshold. Mandatory supervisor intervention required.",
    badge: "border-rose-500/40 bg-rose-500/15 text-rose-400 font-bold",
    color: "#fb7185",
  };
  if (density >= 20) return {
    label: "Elevated SIF Risk",
    description: "Elevated precursor signals across operating facilities. Prioritize Life-Saving Rule audits.",
    badge: "border-amber-500/40 bg-amber-500/15 text-amber-400 font-bold",
    color: "#fbbf24",
  };
  return {
    label: "Controlled Posture",
    description: "Precursor density within standard operating parameters (<20%). Active monitoring engaged.",
    badge: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-bold",
    color: "#34d399",
  };
}

function reportPriority(report: ReportWithClassification) {
  if (!report.classification?.is_sif_potential) return "Non-SIF";
  return (report.classification.confidence || 0) >= 80 ? "Critical SIF" : "High SIF";
}

function priorityStyle(priority: string) {
  if (priority.includes("Critical")) return "border-rose-500/40 bg-rose-500/15 text-rose-400 font-bold";
  if (priority.includes("High")) return "border-amber-500/40 bg-amber-500/15 text-amber-400 font-bold";
  return "border-slate-600/40 bg-slate-600/10 text-slate-300";
}

function buildTrend(reports: ReportWithClassification[]): TrendPoint[] {
  const dates = reports
    .map((report) => report.reported_date)
    .filter((date): date is string => Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date)));

  if (!dates.length) return [];
  const lastDate = new Date(dates.sort().at(-1) + "T00:00:00");
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(lastDate);
    day.setDate(lastDate.getDate() - 6 + index);
    const date = day.toISOString().slice(0, 10);
    const daily = reports.filter((report) => report.reported_date === date);
    return {
      date,
      reports: daily.length,
      sif: daily.filter((report) => report.classification?.is_sif_potential).length,
    };
  });
}

function formatDate(date: string) {
  const parsed = new Date(date + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(parsed);
}

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 border-b border-surface-border pb-2.5">
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-amber-400/90">{eyebrow}</p>
        <h2 className="mt-0.5 text-sm font-bold tracking-tight text-slate-100">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
  action,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex min-h-24 flex-col items-center justify-center rounded border border-dashed border-surface-border bg-surface/30 px-4 py-3 text-center" : "flex min-h-36 flex-col items-center justify-center rounded border border-dashed border-surface-border bg-surface/30 px-4 py-6 text-center"}>
      <span className="flex h-8 w-8 items-center justify-center rounded border border-surface-border bg-surface-raised">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
      </span>
      <p className="mt-2 text-xs font-semibold text-slate-300">{title}</p>
      <p className="mt-0.5 max-w-sm text-[10px] leading-relaxed text-slate-400">{detail}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  detail,
  tone,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  detail: string;
  tone: string;
}) {
  return (
    <article className="group rounded border border-surface-border bg-surface-card p-3.5 transition-colors hover:border-amber-400/40">
      <div className="flex items-start justify-between">
        <span className={"flex h-7 w-7 items-center justify-center rounded border border-current/25 bg-current/[0.08] " + tone}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="font-mono text-[9px] text-slate-400 uppercase">TELEMETRY</span>
      </div>
      <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-slate-100">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-300">{label}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{detail}</p>
    </article>
  );
}

function ExposureGauge({ density, hasData, color }: { density: number; hasData: boolean; color: string }) {
  const safeDensity = Math.min(Math.max(density, 0), 100);
  const background = hasData
    ? "conic-gradient(" + color + " " + String(safeDensity) + "%, rgb(var(--surface-raised)) 0)"
    : "rgb(var(--surface-raised))";

  return (
    <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full p-1.5" style={{ background }} aria-label={hasData ? "SIF precursor density " + String(density) + "%" : "No precursor density available"}>
      <div className="grid h-full w-full place-items-center rounded-full bg-surface-card text-center">
        <p className="font-mono text-xl font-bold text-slate-100">{hasData ? String(density) + "%" : "-"}</p>
        <p className="mt-[-0.2rem] font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">SIF DENSITY</p>
      </div>
    </div>
  );
}

function Trend({ trend }: { trend: TrendPoint[] }) {
  const maximum = Math.max(1, ...trend.map((point) => Math.max(point.reports, point.sif)));
  return (
    <div className="mt-3">
      <div className="chart-shell grid h-40 grid-cols-7 items-end gap-2 overflow-hidden rounded border border-surface-border px-3 pb-6 pt-4 sm:gap-3">
        {trend.map((point) => (
          <div key={point.date} className="relative flex h-full min-w-0 items-end justify-center gap-1">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-surface-border/70" />
            <div title={String(point.reports) + " total reports"} className="relative z-10 w-2.5 rounded-t-sm bg-slate-400/60 sm:w-3.5" style={{ height: String(Math.max(point.reports ? 6 : 0, (point.reports / maximum) * 100)) + "%" }} />
            <div title={String(point.sif) + " SIF precursors"} className="relative z-10 w-2.5 rounded-t-sm bg-amber-400 sm:w-3.5" style={{ height: String(Math.max(point.sif ? 6 : 0, (point.sif / maximum) * 100)) + "%" }} />
            <span className="absolute -bottom-5 left-1/2 w-12 -translate-x-1/2 truncate text-center font-mono text-[8px] text-slate-400">{formatDate(point.date)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[9px] text-slate-400">
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-xs bg-slate-400" /> TOTAL OBSERVATIONS</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-xs bg-amber-400" /> SIF PRECURSORS</span>
        <span className="ml-auto text-slate-500">PAST 7 ACTIVE DATES</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { openAssistant } = useAIAssistant();
  const [aggregates, setAggregates] = useState<Aggregates>(emptyAggregates);
  const [reports, setReports] = useState<ReportWithClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [storageLabel, setStorageLabel] = useState("Safety data workspace");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all([fetch("/api/aggregates"), fetch("/api/reports")]);
      const payloads = await Promise.all([responses[0].json(), responses[1].json()]);
      const aggregatePayload = payloads[0];
      const reportPayload = payloads[1];
      if (!responses[0].ok || !responses[1].ok || !aggregatePayload.success || !reportPayload.success) {
        throw new Error(aggregatePayload.error || reportPayload.error || "Safety intelligence could not be loaded.");
      }
      setAggregates({
        ...emptyAggregates,
        ...aggregatePayload.data,
        openActionsCount: aggregatePayload.openActionsCount ?? 0,
        verifiedActionsCount: aggregatePayload.verifiedActionsCount ?? 0,
        totalActionsCount: aggregatePayload.totalActionsCount ?? 0,
        totalAuditLogsCount: aggregatePayload.totalAuditLogsCount ?? 0,
      });
      setReports(reportPayload.reports || []);
      setStorageLabel(aggregatePayload.storage?.label || reportPayload.storage?.label || "Safety data workspace");
      setRefreshedAt(new Date());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Safety intelligence could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const highPriority = useMemo(() => reports
    .filter((report) => report.classification?.is_sif_potential)
    .sort((left, right) => (right.classification?.confidence || 0) - (left.classification?.confidence || 0)), [reports]);
  const recentReports = useMemo(() => [...reports]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 5), [reports]);
  const trend = useMemo(() => buildTrend(reports), [reports]);
  const hasData = aggregates.totalReports > 0;
  const profile = riskProfile(aggregates.overallPrecursorDensity, hasData);
  const highestRiskSite = aggregates.siteAggregates[0];

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center gap-2 px-6 text-xs text-slate-400 font-mono">
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" /> LOADING HSSE COMMAND TELEMETRY...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="rounded border border-rose-500/40 bg-rose-500/[0.06] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-rose-400">TELEMETRY FAILURE</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{error}</p>
          <button onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/30">
            <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const metrics = [
    { icon: FileText, value: String(aggregates.totalReports), label: "Observations Logged", detail: hasData ? "Classified source observations" : "Awaiting observations", tone: "text-slate-300" },
    { icon: ShieldAlert, value: String(aggregates.sifReportsCount), label: "SIF Precursors Detected", detail: hasData ? `${aggregates.overallPrecursorDensity}% precursor exposure` : "No signals flagged", tone: "text-rose-400" },
    { icon: Building2, value: String(aggregates.siteAggregates.length), label: "Operating Facilities", detail: hasData ? "Active installations monitored" : "No sites recorded", tone: "text-emerald-400" },
    { icon: ClipboardCheck, value: String(aggregates.openActionsCount ?? 0), label: "Open CAPA Actions", detail: `${aggregates.verifiedActionsCount ?? 0} verified of ${aggregates.totalActionsCount ?? 0} total`, tone: "text-amber-400" },
    { icon: BrainCircuit, value: String(aggregates.patternCallouts.length), label: "Recurring Patterns", detail: hasData ? "Clusters requiring intervention" : "Requires repeated observations", tone: "text-amber-300" },
  ];

  return (
    <main className="mx-auto max-w-[1440px] space-y-4 px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
      {/* 1. Header: Industrial Operations Console */}
      <header className="rounded border border-surface-border bg-surface-card p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">
              <span className="text-amber-400">SIF SENTINEL</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">SAFETY INTELLIGENCE COMMAND CENTER</span>
              <span className="text-slate-600">|</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM OPERATIONAL
              </span>
            </div>
            <h1 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-white">
              Oil India Limited · HSE Safety Intelligence & Precursor Triage
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-slate-400">
              <span>DATA WINDOW: <strong className="text-slate-200">Active Pipeline & Rigs</strong></span>
              <span className="text-slate-600">•</span>
              <span>LAST ANALYSIS: <strong className="text-slate-200">{refreshedAt ? refreshedAt.toLocaleTimeString() : "Synchronized"}</strong></span>
              <span className="text-slate-600">•</span>
              <span>ACTIVE MODEL: <strong className="text-amber-400">Layer A (TF-IDF + LR)</strong></span>
              <span className="text-slate-600">•</span>
              <span>STORAGE: <strong className="text-slate-300 truncate max-w-[200px] inline-block align-bottom">{storageLabel}</strong></span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => void load()} className="inline-flex h-8 items-center gap-1.5 rounded border border-surface-border bg-surface px-2.5 text-[11px] font-medium text-slate-300 transition hover:bg-surface-hover hover:text-white">
              <RefreshCw className="h-3 w-3" /> Refresh Telemetry
            </button>
            <Link href="/dashboard/investigate" className="inline-flex h-8 items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/20">
              <BrainCircuit className="h-3 w-3" /> Safety Workbench
            </Link>
            <Link href="/dashboard/ingest?tab=manual" className="inline-flex h-8 items-center gap-1.5 rounded bg-amber-500 px-3 text-[11px] font-bold text-slate-950 transition hover:bg-amber-400">
              Ingest Observation <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Primary Operational Signal & Density Exposure Split */}
      <section className="grid gap-3 lg:grid-cols-12">
        <article className="lg:col-span-8 rounded border border-surface-border bg-surface-card p-4">
          <SectionTitle eyebrow="PRIMARY OPERATIONAL SIGNAL" title="Field SIF Exposure & Precursor Concentration" />
          <div className="mt-3.5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-4xl font-extrabold tracking-tight text-white">
                  {aggregates.sifReportsCount}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-rose-400 font-bold">
                  SIF Precursors Detected
                </span>
                <span className="text-slate-500 text-xs font-mono">/ {aggregates.totalReports} total</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={"rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase " + profile.badge}>
                  {profile.label}
                </span>
                <span className="text-xs text-slate-300 leading-relaxed">
                  {profile.description}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                <span className="text-slate-400">Highest Risk Site:</span>
                <span className="font-bold text-slate-200">{highestRiskSite?.site || "None"}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Peak Precursor Ratio:</span>
                <span className="font-bold text-amber-400">{highestRiskSite ? `${highestRiskSite.precursor_density}%` : "0%"}</span>
              </div>
            </div>
            <ExposureGauge density={aggregates.overallPrecursorDensity} hasData={hasData} color={profile.color} />
          </div>
        </article>

        <article className="lg:col-span-4 rounded border border-surface-border bg-surface-card p-4 flex flex-col justify-between">
          <div>
            <SectionTitle eyebrow="SAFETY CAPA STATUS" title="Corrective Barrier Governance" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded border border-surface-border bg-surface/60 p-2.5">
                <span className="font-mono text-[9px] uppercase text-slate-400">Open Actions</span>
                <p className="font-mono text-xl font-bold text-amber-400 mt-0.5">{aggregates.openActionsCount ?? 0}</p>
                <span className="text-[10px] text-slate-400">Barrier restorations</span>
              </div>
              <div className="rounded border border-surface-border bg-surface/60 p-2.5">
                <span className="font-mono text-[9px] uppercase text-slate-400">Verified Closed</span>
                <p className="font-mono text-xl font-bold text-emerald-400 mt-0.5">{aggregates.verifiedActionsCount ?? 0}</p>
                <span className="text-[10px] text-slate-400">HSE confirmed</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-surface-border flex items-center justify-between font-mono text-[10px]">
            <Link href="/dashboard/actions" className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1">
              OPEN CAPA REGISTER <ChevronRight className="h-3 w-3" />
            </Link>
            <button onClick={openAssistant} className="text-slate-400 hover:text-white inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" /> HSE Assistant
            </button>
          </div>
        </article>
      </section>

      {/* 3. VISUAL CENTER: Priority Exposures Ranked Operational Table */}
      <section className="rounded border border-surface-border bg-surface-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-rose-400">
              IMMEDIATE ATTENTION REQUIRED
            </p>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Priority SIF Precursor Exposure Queue
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                {highPriority.length} Flagged
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/reports?sif=sif" className="font-mono text-[11px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1">
              FULL TRIAGE QUEUE <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {highPriority.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-200">No Pending SIF Precursors</p>
            <p className="text-slate-500 mt-0.5">All incoming observations have been triaged or have Non-SIF classification.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="font-mono text-[10px] text-slate-400 border-b border-surface-border bg-surface/50">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-12">RANK</th>
                  <th className="py-2.5 px-3 font-semibold">REPORT DESCRIPTION</th>
                  <th className="py-2.5 px-3 font-semibold">FACILITY</th>
                  <th className="py-2.5 px-3 font-semibold">ACTIVITY</th>
                  <th className="py-2.5 px-3 font-semibold">LIFE-SAVING RULE</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">CONFIDENCE</th>
                  <th className="py-2.5 px-3 font-semibold">STATUS</th>
                  <th className="py-2.5 px-3 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-slate-300">
                {highPriority.slice(0, 6).map((report, idx) => {
                  const priority = reportPriority(report);
                  const isCritical = priority.includes("Critical");

                  return (
                    <tr
                      key={report.id}
                      className={`hover:bg-surface-hover/80 transition-colors ${
                        isCritical ? "bg-rose-500/[0.04]" : ""
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3 max-w-xs md:max-w-md">
                        <p className="line-clamp-2 font-normal text-slate-100 leading-relaxed">
                          {report.raw_text}
                        </p>
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          ID: {report.id} · {report.reported_date} · {report.submitting_role || "Observer"}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-200 whitespace-nowrap">
                        {report.site}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {report.activity}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {report.classification?.life_saving_rule ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                            {report.classification.life_saving_rule}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                        <span className={isCritical ? "text-rose-400" : "text-amber-400"}>
                          {report.classification?.confidence || 0}%
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`font-mono text-[9px] px-2 py-0.5 rounded uppercase ${priorityStyle(priority)}`}>
                          {priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/dashboard/reports?search=${encodeURIComponent(report.id)}`}
                          className="font-mono text-[11px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                        >
                          EXPLAIN <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Recurring Precursor Signals & Velocity Movement */}
      <section className="grid gap-3 lg:grid-cols-12">
        <article className="lg:col-span-7 rounded border border-surface-border bg-surface-card p-4">
          <SectionTitle
            eyebrow="RECURRING SIGNALS"
            title="Precursor Pattern Clusters"
            action={
              <Link href="/dashboard/patterns" className="font-mono text-[10px] text-amber-400 hover:text-amber-300">
                EXPLORE ALL PATTERNS <ChevronRight className="h-3 w-3 inline" />
              </Link>
            }
          />
          {aggregates.patternCallouts.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="font-mono text-[10px] text-slate-400 border-b border-surface-border bg-surface/50">
                  <tr>
                    <th className="py-2 px-3 font-semibold">LOCATION</th>
                    <th className="py-2 px-3 font-semibold">LIFE-SAVING RULE</th>
                    <th className="py-2 px-3 font-semibold font-mono">COUNT</th>
                    <th className="py-2 px-3 font-semibold">AFFECTED ACTIVITY</th>
                    <th className="py-2 px-3 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-slate-300">
                  {aggregates.patternCallouts.slice(0, 4).map((pat) => (
                    <tr key={pat.id} className="hover:bg-surface-hover/60">
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                        {pat.site}
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-medium whitespace-nowrap">
                        {pat.life_saving_rule}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-400 whitespace-nowrap">
                        {pat.count} SIFs
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-[160px]">
                        {pat.activity_summary}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/dashboard/reports?site=${encodeURIComponent(pat.site)}&rule=${encodeURIComponent(pat.life_saving_rule)}`}
                          className="font-mono text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
                        >
                          INSPECT
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 py-8 text-center text-slate-500 text-xs">
              No multi-incident precursor clusters detected currently.
            </div>
          )}
        </article>

        <article className="lg:col-span-5 rounded border border-surface-border bg-surface-card p-4">
          <SectionTitle
            eyebrow="PRECURSOR VELOCITY"
            title="Seven-Day Observation Flow"
            action={<span className="font-mono rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-400">TELEMETRY</span>}
          />
          {trend.length ? (
            <Trend trend={trend} />
          ) : (
            <div className="mt-3">
              <EmptyState icon={TrendingUp} title="No Movement Recorded" detail="Movement renders once observation dates are registered." />
            </div>
          )}
        </article>
      </section>

      {/* 5. Facility Precursor Density Ranking Table */}
      <section className="rounded border border-surface-border bg-surface-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-amber-400">
              FACILITY CONCENTRATION ANALYSIS
            </p>
            <h2 className="text-sm font-bold tracking-tight text-white">
              Site Precursor Density &amp; Hazard Ranking
            </h2>
          </div>
          <Link href="/dashboard/density" className="font-mono text-[10px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1">
            VIEW FULL STATISTICAL DENSITY REGISTER <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {aggregates.siteAggregates.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No facility records available. Ingest observations to compute density.
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="font-mono text-[10px] text-slate-400 border-b border-surface-border bg-surface/50">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-12">RANK</th>
                  <th className="py-2.5 px-3 font-semibold">FACILITY / LOCATION</th>
                  <th className="py-2.5 px-3 font-semibold">PRIMARY ACTIVITY</th>
                  <th className="py-2.5 px-3 font-semibold">DOMINANT RULE</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">TOTAL REPORTS</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">SIF PRECURSORS</th>
                  <th className="py-2.5 px-3 font-semibold">PRECURSOR DENSITY</th>
                  <th className="py-2.5 px-3 font-semibold text-right">DRILLDOWN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-slate-300">
                {aggregates.siteAggregates.slice(0, 5).map((site, idx) => {
                  const siteProfile = riskProfile(site.precursor_density, true);

                  return (
                    <tr key={site.site} className="hover:bg-surface-hover/60">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                        {site.site}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {site.activity}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {site.primary_rule ? (
                          <span className="font-medium text-amber-300">{site.primary_rule}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {site.total_reports}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        {site.sif_reports}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-surface rounded-full h-1.5 overflow-hidden border border-surface-border">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, site.precursor_density)}%`, backgroundColor: siteProfile.color }}
                            />
                          </div>
                          <span className={"font-mono font-bold text-[11px] " + (site.precursor_density >= 35 ? "text-rose-400" : site.precursor_density >= 20 ? "text-amber-400" : "text-emerald-400")}>
                            {site.precursor_density}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/dashboard/facilities`}
                          className="font-mono text-[10px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                        >
                          FACILITY VIEW <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Industrial Telemetry Footer */}
      <footer className="flex flex-col gap-2 rounded border border-surface-border bg-surface-card px-4 py-2.5 font-mono text-[9px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          DATABASE CONNECTED: {storageLabel}
        </span>
        <span>LAST TELEMETRY SYNC: <span className="font-bold text-slate-300">{refreshedAt ? refreshedAt.toLocaleTimeString() : "-"}</span></span>
      </footer>
    </main>
  );
}
