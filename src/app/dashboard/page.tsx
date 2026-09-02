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
};

const emptyAggregates: Aggregates = {
  totalReports: 0,
  sifReportsCount: 0,
  overallPrecursorDensity: 0,
  siteAggregates: [],
  ruleDistribution: [],
  patternCallouts: [],
};

function riskProfile(density: number, hasData: boolean) {
  if (!hasData) return {
    label: "Awaiting data",
    description: "Add an observation to establish the first safety baseline.",
    badge: "border-slate-400/20 bg-slate-400/10 text-slate-300",
    color: "#94a3b8",
  };
  if (density >= 35) return {
    label: "Critical exposure",
    description: "The current SIF precursor density needs immediate review.",
    badge: "border-rose-400/25 bg-rose-500/10 text-rose-400",
    color: "#fb7185",
  };
  if (density >= 20) return {
    label: "Elevated exposure",
    description: "Prioritise the SIF queue and targeted site intervention.",
    badge: "border-amber-400/25 bg-amber-500/10 text-amber-400",
    color: "#fbbf24",
  };
  return {
    label: "Controlled exposure",
    description: "Keep monitoring new observations and recurring patterns.",
    badge: "border-emerald-400/25 bg-emerald-500/10 text-emerald-400",
    color: "#34d399",
  };
}

function reportPriority(report: ReportWithClassification) {
  if (!report.classification?.is_sif_potential) return "Low";
  return (report.classification.confidence || 0) >= 80 ? "Critical" : "High";
}

function priorityStyle(priority: string) {
  if (priority === "Critical") return "border-rose-400/25 bg-rose-500/10 text-rose-400";
  if (priority === "High") return "border-amber-400/25 bg-amber-500/10 text-amber-400";
  return "border-sky-400/25 bg-sky-500/10 text-sky-400";
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
    <div className="flex min-w-0 items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 font-display text-lg font-bold text-slate-100">{title}</h2>
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
    <div className={compact ? "flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface/40 px-5 py-4 text-center" : "flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface/40 px-5 py-7 text-center"}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-raised">
        <Icon className="h-4 w-4 text-slate-500" />
      </span>
      <p className="mt-3 text-xs font-semibold text-slate-300">{title}</p>
      <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">{detail}</p>
      {action && <div className="mt-3">{action}</div>}
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
    <article className="group rounded-2xl border border-surface-border bg-surface-card p-4 transition hover:-translate-y-0.5 hover:border-sky-400/30">
      <div className="flex items-start justify-between">
        <span className={"flex h-9 w-9 items-center justify-center rounded-xl border border-current/15 bg-current/[0.08] " + tone}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-surface-border transition group-hover:bg-sky-400" />
      </div>
      <p className="mt-5 text-2xl font-bold tracking-tight text-slate-100">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-300">{label}</p>
      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{detail}</p>
    </article>
  );
}

function ExposureGauge({ density, hasData, color }: { density: number; hasData: boolean; color: string }) {
  const safeDensity = Math.min(Math.max(density, 0), 100);
  const background = hasData
    ? "conic-gradient(" + color + " " + String(safeDensity) + "%, rgb(var(--surface-raised)) 0)"
    : "rgb(var(--surface-raised))";

  return (
    <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full p-2" style={{ background }} aria-label={hasData ? "SIF precursor density " + String(density) + "%" : "No precursor density available"}>
      <div className="grid h-full w-full place-items-center rounded-full bg-surface-card text-center">
        <p className="font-display text-2xl font-bold text-slate-100">{hasData ? String(density) + "%" : "-"}</p>
        <p className="mt-[-0.3rem] text-[9px] font-bold uppercase tracking-[0.13em] text-slate-500">SIF density</p>
      </div>
    </div>
  );
}

function Trend({ trend }: { trend: TrendPoint[] }) {
  const maximum = Math.max(1, ...trend.map((point) => Math.max(point.reports, point.sif)));
  return (
    <div className="mt-5">
      <div className="chart-shell grid h-48 grid-cols-7 items-end gap-2 overflow-hidden rounded-xl border border-surface-border px-3 pb-7 pt-5 sm:gap-4">
        {trend.map((point) => (
          <div key={point.date} className="relative flex h-full min-w-0 items-end justify-center gap-1">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-surface-border/70" />
            <div title={String(point.reports) + " reports"} className="relative z-10 w-3 rounded-t bg-sky-400/70 sm:w-4" style={{ height: String(Math.max(point.reports ? 8 : 0, (point.reports / maximum) * 100)) + "%" }} />
            <div title={String(point.sif) + " SIF precursors"} className="relative z-10 w-3 rounded-t bg-rose-400 sm:w-4" style={{ height: String(Math.max(point.sif ? 8 : 0, (point.sif / maximum) * 100)) + "%" }} />
            <span className="absolute -bottom-5 left-1/2 w-12 -translate-x-1/2 truncate text-center text-[9px] text-slate-500">{formatDate(point.date)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-sky-400" /> All observations</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-rose-400" /> SIF precursors</span>
        <span className="ml-auto text-slate-500">Latest seven observed dates</span>
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
      setAggregates({ ...emptyAggregates, ...aggregatePayload.data });
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
    return <div className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center gap-2 px-6 text-sm text-slate-400"><RefreshCw className="h-4 w-4 animate-spin text-sky-400" /> Loading safety command center...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-6">
          <p className="font-display text-lg font-bold text-rose-400">Safety intelligence is unavailable</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button onClick={() => void load()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-rose-400"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>
        </div>
      </div>
    );
  }

  const metrics = [
    { icon: FileText, value: String(aggregates.totalReports), label: "Observations processed", detail: hasData ? "Classified source reports" : "No reports received yet", tone: "text-sky-400" },
    { icon: ShieldAlert, value: String(aggregates.sifReportsCount), label: "SIF precursors", detail: hasData ? "Flagged for safety review" : "Waiting for classification", tone: "text-rose-400" },
    { icon: Building2, value: String(aggregates.siteAggregates.length), label: "Facilities monitored", detail: hasData ? "Locations in this data set" : "Locations will appear here", tone: "text-emerald-400" },
    { icon: BrainCircuit, value: String(aggregates.patternCallouts.length), label: "Recurring patterns", detail: hasData ? "Repeated site-and-rule clusters" : "Requires repeated observations", tone: "text-violet-400" },
  ];

  return (
    <main className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-surface-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
            <span className="inline-flex items-center gap-1.5 text-emerald-400"><span className="status-dot ready" /> Classifier online</span>
            <span className="text-slate-500">Dashboard / Operational overview</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-100 sm:text-3xl">SIF Sentinel Dashboard</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">A live view of SIF precursor exposure, facility concentration, and the observations that need action.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-surface-border bg-surface-card px-3.5 text-xs font-semibold text-slate-300 transition hover:border-sky-400/30 hover:bg-surface-hover"><RefreshCw className="h-3.5 w-3.5" /> Refresh data</button>
          <Link href="/dashboard/ingest?tab=manual" className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-3.5 text-xs font-bold text-slate-950 transition hover:bg-sky-400">Add observation <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,.75fr)]">
        <article className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <div className="absolute -right-24 -top-24 h-52 w-52 rounded-full bg-sky-400/[0.07] blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Current safety posture</p>
              <div className="mt-2 flex flex-wrap items-center gap-2"><h2 className="font-display text-xl font-bold text-slate-100">{profile.label}</h2><span className={"rounded-full border px-2.5 py-1 text-[10px] font-bold " + profile.badge}>{hasData ? String(aggregates.sifReportsCount) + " flagged" : "No baseline"}</span></div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{profile.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={highPriority.length ? "/dashboard/reports?sif=sif" : "/dashboard/ingest?tab=manual"} className={highPriority.length ? "inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-500/[0.07] px-3 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-500/15" : "inline-flex items-center gap-1.5 rounded-lg border border-sky-400/20 bg-sky-500/[0.07] px-3 py-2 text-xs font-bold text-sky-400 transition hover:bg-sky-500/15"}>{highPriority.length ? "Review priority queue" : "Classify first observation"} <ChevronRight className="h-3.5 w-3.5" /></Link>
                <button onClick={openAssistant} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/20 bg-violet-500/[0.07] px-3 py-2 text-xs font-bold text-violet-300 transition hover:bg-violet-500/15"><Sparkles className="h-3.5 w-3.5" /> Ask AI</button>
              </div>
            </div>
            <ExposureGauge density={aggregates.overallPrecursorDensity} hasData={hasData} color={profile.color} />
          </div>
          <div className="relative mt-5 grid gap-3 border-t border-surface-border pt-4 text-[11px] sm:grid-cols-3">
            <div><p className="text-slate-500">Highest-risk facility</p><p className="mt-1 truncate font-semibold text-slate-200">{highestRiskSite?.site || "No facility data"}</p></div>
            <div><p className="text-slate-500">Highest site density</p><p className="mt-1 font-semibold text-slate-200">{highestRiskSite ? String(highestRiskSite.precursor_density) + "%" : "-"}</p></div>
            <div><p className="text-slate-500">Data source</p><p className="mt-1 truncate font-semibold text-slate-200" title={storageLabel}>{storageLabel}</p></div>
          </div>
        </article>

        <article className="rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <SectionTitle eyebrow="Action guide" title="What to do next" />
          <div className="mt-4 space-y-3">
            <Link href="/dashboard/ingest?tab=manual" className="group flex items-start gap-3 rounded-xl border border-surface-border bg-surface/40 p-3.5 transition hover:border-sky-400/30 hover:bg-surface-hover"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-400"><ClipboardCheck className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-200">Record an observation</span><span className="mt-1 block text-[10px] leading-relaxed text-slate-500">Classify a new field observation against SIF indicators.</span></span><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-sky-400" /></Link>
            <Link href="/dashboard/reports?sif=sif" className="group flex items-start gap-3 rounded-xl border border-surface-border bg-surface/40 p-3.5 transition hover:border-rose-400/30 hover:bg-surface-hover"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-400/10 text-rose-400"><ShieldAlert className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-200">Triage flagged reports</span><span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{highPriority.length ? String(highPriority.length) + " SIF precursors available for review." : "Flagged SIF observations will appear here."}</span></span><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-rose-400" /></Link>
            <Link href="/dashboard/patterns" className="group flex items-start gap-3 rounded-xl border border-surface-border bg-surface/40 p-3.5 transition hover:border-violet-400/30 hover:bg-surface-hover"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-400"><BrainCircuit className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-200">Inspect recurring risks</span><span className="mt-1 block text-[10px] leading-relaxed text-slate-500">Check repeated site-and-rule precursor clusters.</span></span><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-violet-400" /></Link>
          </div>
        </article>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Metric key={metric.label} {...metric} />)}</section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.85fr)]">
        <article className="rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <SectionTitle eyebrow="Reporting movement" title="Seven-day safety trend" action={<span className="rounded-lg border border-sky-400/20 bg-sky-400/[0.08] px-2 py-1 text-[10px] font-bold text-sky-400">Live data</span>} />
          {trend.length ? <Trend trend={trend} /> : <div className="mt-4"><EmptyState icon={TrendingUp} title="No trend available yet" detail="The chart activates from real report dates after your first observation is classified." action={<Link href="/dashboard/ingest?tab=manual" className="text-xs font-bold text-sky-400">Add an observation</Link>} /></div>}
        </article>

        <article className="rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <SectionTitle eyebrow="Immediate attention" title="Priority review queue" action={<Link href="/dashboard/reports?sif=sif" className="text-xs font-bold text-sky-400 hover:text-sky-300">View all</Link>} />
          <div className="mt-4 space-y-2.5">
            {highPriority.slice(0, 3).map((report) => {
              const priority = reportPriority(report);
              return <Link href={"/dashboard/reports?search=" + encodeURIComponent(report.id)} key={report.id} className="block rounded-xl border border-surface-border bg-surface/40 p-3.5 transition hover:border-rose-400/30 hover:bg-surface-hover"><div className="flex items-start justify-between gap-3"><p className="min-w-0 truncate text-xs font-bold text-slate-200">{report.site}</p><span className={"shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold " + priorityStyle(priority)}>{priority}</span></div><p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{report.raw_text}</p><div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span className="truncate">{report.classification?.life_saving_rule || "Rule not mapped"}</span><span className="font-mono text-slate-300">{report.classification?.confidence || 0}%</span></div></Link>;
            })}
            {!highPriority.length && <EmptyState compact icon={CheckCircle2} title="Review queue is clear" detail={hasData ? "No current report has been flagged as a SIF precursor." : "Flagged SIF observations will enter this queue."} />}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <SectionTitle eyebrow="Facility exposure" title="Where to focus" action={<Link href="/dashboard/density" className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300">Full ranking <ChevronRight className="h-3.5 w-3.5" /></Link>} />
          <div className="mt-5 space-y-4">
            {aggregates.siteAggregates.slice(0, 4).map((site, index) => {
              const siteProfile = riskProfile(site.precursor_density, true);
              return <div key={site.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3"><span className="font-mono text-xs font-bold text-slate-500">0{index + 1}</span><div className="min-w-0"><div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-bold text-slate-200">{site.site}</p><p className="shrink-0 font-mono text-[10px] text-slate-500">{site.sif_reports}/{site.total_reports} SIF</p></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-raised"><div className="h-full rounded-full" style={{ width: String(Math.max(3, site.precursor_density)) + "%", backgroundColor: siteProfile.color }} /></div><p className="mt-1.5 truncate text-[10px] text-slate-500">{site.activity} {site.primary_rule ? "- " + site.primary_rule : ""}</p></div><span className={"rounded-lg border px-2 py-1 text-[10px] font-bold " + siteProfile.badge}>{site.precursor_density}%</span></div>;
            })}
            {!aggregates.siteAggregates.length && <EmptyState icon={Building2} title="No facility exposure data" detail="Facility ranking appears once observations include a site or location." action={<Link href="/dashboard/ingest?tab=manual" className="text-xs font-bold text-sky-400">Classify a report</Link>} />}
          </div>
        </article>

        <article id="life-saving-rules" className="scroll-mt-6 rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <SectionTitle eyebrow="IOGP analysis" title="Life-Saving Rule signals" action={<ShieldCheck className="h-5 w-5 text-amber-400" />} />
          <div className="mt-5 space-y-4">
            {aggregates.ruleDistribution.slice(0, 5).map((rule) => <div key={rule.rule}><div className="flex items-center justify-between gap-4"><p className="truncate text-xs font-semibold text-slate-300">{rule.rule}</p><span className="shrink-0 font-mono text-[10px] text-amber-400">{rule.count} / {rule.percentage}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-raised"><div className="h-full rounded-full bg-amber-400" style={{ width: String(Math.max(3, rule.percentage)) + "%" }} /></div></div>)}
            {!aggregates.ruleDistribution.length && <EmptyState icon={ShieldCheck} title="No rule signals yet" detail="This view is calculated from actual SIF precursor classifications." />}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <article className="rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <SectionTitle eyebrow="Repeat-risk intelligence" title="Pattern watch" action={<Link href="/dashboard/patterns" className="text-xs font-bold text-violet-300 hover:text-violet-200">Explore patterns</Link>} />
          {aggregates.patternCallouts[0] ? <div className="mt-5 rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-100">{aggregates.patternCallouts[0].site}</p><p className="mt-1 text-xs font-semibold text-violet-300">{aggregates.patternCallouts[0].life_saving_rule}</p></div><span className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-300">{aggregates.patternCallouts[0].count} reports</span></div><p className="mt-4 text-xs leading-relaxed text-slate-400">{aggregates.patternCallouts[0].narrative}</p><Link href="/dashboard/patterns" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-300 hover:text-violet-200">Investigate this cluster <ArrowRight className="h-3.5 w-3.5" /></Link></div> : <div className="mt-5"><EmptyState icon={BrainCircuit} title="No recurring pattern detected" detail={hasData ? "No site-and-rule cluster currently meets the repeated-risk threshold." : "Repeated SIF observations at the same site and rule will create a pattern."} /></div>}
        </article>

        <article className="rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <SectionTitle eyebrow="Report activity" title="Latest observations" action={<Link href="/dashboard/reports" className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300">Open report triage <ChevronRight className="h-3.5 w-3.5" /></Link>} />
          {recentReports.length ? <div className="mt-4 divide-y divide-surface-border">{recentReports.map((report) => { const priority = reportPriority(report); return <Link key={report.id} href={"/dashboard/reports?search=" + encodeURIComponent(report.id)} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 transition hover:bg-sky-400/[0.025]"><span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border " + priorityStyle(priority)}><AlertTriangle className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="flex min-w-0 items-center gap-2"><span className="truncate text-xs font-bold text-slate-200">{report.site}</span><span className="hidden truncate text-[10px] text-slate-500 sm:inline">{report.activity}</span></span><span className="mt-1 block truncate text-[10px] text-slate-500">{report.raw_text}</span></span><span className="shrink-0 text-right"><span className="block text-[10px] font-medium text-slate-400">{formatDate(report.reported_date)}</span><span className="mt-1 block font-mono text-[10px] text-slate-500">{report.classification?.confidence || 0}%</span></span></Link>; })}</div> : <div className="mt-4"><EmptyState icon={FileText} title="No observations to review" detail="New field reports will appear here once they have been classified." action={<Link href="/dashboard/ingest?tab=manual" className="text-xs font-bold text-sky-400">Create first report</Link>} /></div>}
        </article>
      </section>

      <footer className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface-card px-5 py-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2"><span className="status-dot ready" /> Safety intelligence connected to {storageLabel}</span>
        <span>Last refreshed: <span className="font-mono font-semibold text-slate-300">{refreshedAt ? refreshedAt.toLocaleTimeString() : "-"}</span></span>
      </footer>
    </main>
  );
}
