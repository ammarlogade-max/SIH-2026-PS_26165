"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
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
} from "lucide-react";
import { useAIAssistant } from "@/context/AIAssistantContext";
import type {
  PatternCallout,
  ReportWithClassification,
  SiteActivityAggregate,
} from "@/lib/types";

type RuleDistribution = { rule: string; count: number; percentage: number };

type Aggregates = {
  totalReports: number;
  sifReportsCount: number;
  nonSifReportsCount: number;
  overallPrecursorDensity: number;
  siteAggregates: SiteActivityAggregate[];
  ruleDistribution: RuleDistribution[];
  patternCallouts: PatternCallout[];
  topRiskSite: string | null;
  highestRiskDensity: number;
};

type TrendPoint = { date: string; reports: number; sif: number };

const emptyAggregates: Aggregates = {
  totalReports: 0,
  sifReportsCount: 0,
  nonSifReportsCount: 0,
  overallPrecursorDensity: 0,
  siteAggregates: [],
  ruleDistribution: [],
  patternCallouts: [],
  topRiskSite: null,
  highestRiskDensity: 0,
};

function safetyLevel(density: number) {
  if (density >= 35) return { label: "Critical", className: "border-rose-400/25 bg-rose-500/10 text-rose-400" };
  if (density >= 20) return { label: "Elevated", className: "border-amber-400/25 bg-amber-500/10 text-amber-400" };
  return { label: "Controlled", className: "border-emerald-400/25 bg-emerald-500/10 text-emerald-400" };
}

function reportPriority(report: ReportWithClassification) {
  if (!report.classification?.is_sif_potential) return "Low";
  return report.classification.confidence >= 80 ? "Critical" : "High";
}

function buildTrend(reports: ReportWithClassification[]): TrendPoint[] {
  const reportDates = reports
    .map((report) => report.reported_date)
    .filter((date): date is string => Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date)));

  if (!reportDates.length) return [];

  const endDate = new Date(`${reportDates.sort().at(-1)}T00:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const pointDate = new Date(endDate);
    pointDate.setDate(endDate.getDate() - 6 + index);
    const date = pointDate.toISOString().slice(0, 10);
    const dailyReports = reports.filter((report) => report.reported_date === date);
    return {
      date,
      reports: dailyReports.length,
      sif: dailyReports.filter((report) => report.classification?.is_sif_potential).length,
    };
  });
}

function SectionHeading({
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
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 font-display text-lg font-bold text-slate-100">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: typeof ClipboardCheck;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface/35 px-5 py-6 text-center">
      <Icon className="h-5 w-5 text-slate-500" />
      <p className="mt-2 text-xs font-semibold text-slate-300">{title}</p>
      <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">{detail}</p>
      {action && <div className="mt-3">{action}</div>}
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
      const [aggregateResponse, reportResponse] = await Promise.all([
        fetch("/api/aggregates"),
        fetch("/api/reports"),
      ]);
      if (!aggregateResponse.ok || !reportResponse.ok) {
        throw new Error("Safety intelligence could not be loaded.");
      }

      const [aggregatePayload, reportPayload] = await Promise.all([
        aggregateResponse.json(),
        reportResponse.json(),
      ]);
      if (!aggregatePayload.success || !reportPayload.success) {
        throw new Error(aggregatePayload.error || reportPayload.error || "Safety intelligence could not be loaded.");
      }

      setAggregates(aggregatePayload.data || emptyAggregates);
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

  const highPriority = useMemo(
    () => reports
      .filter((report) => report.classification?.is_sif_potential)
      .sort((a, b) => (b.classification?.confidence || 0) - (a.classification?.confidence || 0)),
    [reports]
  );
  const trend = useMemo(() => buildTrend(reports), [reports]);
  const trendMaximum = Math.max(1, ...trend.map((point) => Math.max(point.reports, point.sif)));
  const hasData = aggregates.totalReports > 0;

  const metrics = [
    {
      label: "Reports processed",
      value: aggregates.totalReports.toString(),
      hint: hasData ? "Classified observations" : "No observation data received",
      icon: FileText,
      tone: "text-sky-400",
    },
    {
      label: "SIF precursors",
      value: aggregates.sifReportsCount.toString(),
      hint: hasData ? "Requires safety review" : "Awaiting classification data",
      icon: ShieldAlert,
      tone: "text-rose-400",
    },
    {
      label: "Precursor density",
      value: hasData ? `${aggregates.overallPrecursorDensity}%` : "—",
      hint: hasData ? "SIF reports / all reports" : "Requires a report sample",
      icon: TrendingUp,
      tone: "text-amber-400",
    },
    {
      label: "Facilities monitored",
      value: aggregates.siteAggregates.length.toString(),
      hint: hasData ? "Active reporting locations" : "No facilities in session data",
      icon: Building2,
      tone: "text-emerald-400",
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center gap-2 px-6 text-sm text-slate-400">
        <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
        Loading command center intelligence…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-5">
          <p className="font-semibold text-rose-400">Unable to load safety intelligence</p>
          <p className="mt-1 text-sm text-slate-400">{error}</p>
          <button onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-white">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="command-summary rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              <span className="inline-flex items-center gap-1.5 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Classifier online</span>
              <span className={hasData ? "text-sky-400" : "text-slate-500"}>{hasData ? "Observation data available" : "No observation data received"}</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-slate-100 sm:text-3xl">Safety Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Operational intelligence for SIF precursor detection, facility exposure, IOGP rules and focused HSE action.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => void load()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 text-xs font-semibold text-slate-300 transition hover:bg-surface-hover">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <Link href="/dashboard/ingest?tab=manual" className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-500 px-3 text-xs font-bold text-slate-950 transition hover:bg-amber-400">
              Classify an observation <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-surface-border bg-surface/55 p-3.5">
              <metric.icon className={`h-4 w-4 ${metric.tone}`} />
              <p className="mt-3 text-xl font-bold text-slate-100">{metric.value}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-300">{metric.label}</p>
              <p className="mt-1 text-[10px] text-slate-500">{metric.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-surface-border bg-surface-card p-4 sm:grid-cols-[1.15fr_.85fr] sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10"><ClipboardCheck className="h-4 w-4 text-amber-400" /></span>
          <div><p className="text-xs font-bold text-slate-200">Data readiness</p><p className="mt-1 text-[11px] leading-relaxed text-slate-400">Source: {storageLabel}. New observations activate every command-center module after classification.</p></div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-surface-border pt-3 text-[10px] sm:justify-end sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <span className="text-slate-500">Last refresh</span><span className="font-mono font-semibold text-slate-300">{refreshedAt ? refreshedAt.toLocaleTimeString() : "—"}</span>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <article className="rounded-2xl border border-surface-border bg-surface-card p-5">
          <SectionHeading eyebrow="High-priority safety intelligence" title="Seven-day risk trend" action={<span className="rounded-lg border border-sky-400/20 bg-sky-400/[0.08] px-2 py-1 text-[10px] font-bold text-sky-400">Daily reporting window</span>} />
          {trend.length ? (
            <>
              <div className="mt-6 flex h-40 items-end gap-3">
                {trend.map((point) => (
                  <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-28 w-full items-end justify-center gap-1">
                      <div title={`${point.reports} reports`} className="w-3 rounded-t bg-sky-400/70" style={{ height: `${Math.max(point.reports ? 8 : 0, (point.reports / trendMaximum) * 100)}%` }} />
                      <div title={`${point.sif} SIF precursors`} className="w-3 rounded-t bg-rose-400" style={{ height: `${Math.max(point.sif ? 8 : 0, (point.sif / trendMaximum) * 100)}%` }} />
                    </div>
                    <span className="w-full truncate text-center text-[9px] text-slate-500">{point.date.slice(5)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4 text-[10px] text-slate-400"><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-sky-400" /> All reports</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-rose-400" /> SIF precursors</span></div>
            </>
          ) : <EmptyPanel icon={TrendingUp} title="No reporting trend yet" detail="The trend uses actual calendar-day report volumes after observations are ingested." />}
        </article>

        <article className="rounded-2xl border border-surface-border bg-surface-card p-5">
          <SectionHeading eyebrow="Active alert center" title="Immediate attention" action={<Link href="/dashboard/reports?sif=sif" className="text-xs font-bold text-amber-400 hover:text-amber-300">View all</Link>} />
          <div className="mt-4 space-y-2">
            {highPriority.slice(0, 3).map((report) => (
              <Link href={`/dashboard/reports?search=${encodeURIComponent(report.id)}`} key={report.id} className="block rounded-xl border border-surface-border bg-surface/45 p-3 transition hover:border-rose-400/30">
                <div className="flex items-start justify-between gap-3"><p className="min-w-0 truncate text-xs font-semibold text-slate-200">{report.site}</p><span className="rounded-md border border-rose-400/20 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-400">{reportPriority(report)}</span></div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{report.raw_text}</p>
              </Link>
            ))}
            {!highPriority.length && <EmptyPanel icon={CheckCircle2} title="No high-priority alerts" detail={hasData ? "The current report set has no SIF precursor alert requiring immediate attention." : "High-priority alerts appear when a SIF precursor is classified."} />}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-surface-border bg-surface-card p-5">
          <SectionHeading eyebrow="Facility risk intelligence" title="Facility risk ranking" action={<Link href="/dashboard/density" className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">Detailed ranking <ChevronRight className="h-3.5 w-3.5" /></Link>} />
          <div className="mt-4 space-y-2">
            {aggregates.siteAggregates.slice(0, 5).map((site, index) => {
              const level = safetyLevel(site.precursor_density);
              return <div key={site.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-surface-border bg-surface/45 p-3"><span className="font-mono text-xs font-bold text-slate-500">{index + 1}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-200">{site.site}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{site.sif_reports}/{site.total_reports} SIF reports · {site.primary_rule || "No rule mapped"}</p></div><span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${level.className}`}>{site.precursor_density}%</span></div>;
            })}
            {!aggregates.siteAggregates.length && <EmptyPanel icon={Building2} title="No facilities ranked" detail="Facility rankings appear once reports include a facility or location." action={<Link href="/dashboard/ingest?tab=manual" className="text-xs font-bold text-amber-400">Classify a report</Link>} />}
          </div>
        </article>

        <article id="life-saving-rules" className="scroll-mt-5 rounded-2xl border border-surface-border bg-surface-card p-5">
          <SectionHeading eyebrow="IOGP analysis" title="Life-Saving Rule distribution" action={<ShieldCheck className="h-5 w-5 text-amber-400" />} />
          <div className="mt-5 space-y-3">
            {aggregates.ruleDistribution.slice(0, 5).map((rule) => <div key={rule.rule}><div className="flex justify-between gap-4 text-xs"><span className="truncate font-semibold text-slate-300">{rule.rule}</span><span className="font-mono text-amber-400">{rule.count} · {rule.percentage}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-raised"><div className="h-full rounded-full bg-amber-400" style={{ width: `${rule.percentage}%` }} /></div></div>)}
            {!aggregates.ruleDistribution.length && <EmptyPanel icon={ShieldCheck} title="No rule classifications yet" detail="Rule distribution is calculated from actual SIF precursor classifications." />}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <article className="rounded-2xl border border-surface-border bg-surface-card p-5">
          <SectionHeading eyebrow="Recurring precursor patterns" title="Repeat-risk intelligence" action={<BrainCircuit className="h-5 w-5 text-violet-400" />} />
          {aggregates.patternCallouts[0] ? (
            <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-100">{aggregates.patternCallouts[0].site}</p><p className="mt-1 text-xs font-semibold text-violet-300">{aggregates.patternCallouts[0].life_saving_rule}</p></div><span className="rounded-md bg-violet-500/15 px-2 py-1 text-[10px] font-bold text-violet-300">{aggregates.patternCallouts[0].count} observations</span></div><p className="mt-3 text-xs leading-relaxed text-slate-400">{aggregates.patternCallouts[0].narrative}</p><Link href="/dashboard/patterns" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-300">Investigate pattern <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          ) : <div className="mt-4"><EmptyPanel icon={BrainCircuit} title="No recurring precursor pattern" detail={hasData ? "No site-and-rule cluster currently meets the repeated-risk threshold." : "Patterns are detected from repeated SIF precursor observations at the same facility and rule."} /></div>}
        </article>

        <article className="rounded-2xl border border-surface-border bg-surface-card p-5">
          <SectionHeading eyebrow="Explainable AI" title="Why the system flagged it" action={<Link href="/dashboard/ingest?tab=manual" className="text-xs font-bold text-amber-400">Classify new</Link>} />
          {highPriority[0] ? <div className="mt-4"><p className="line-clamp-2 text-xs leading-relaxed text-slate-300">{highPriority[0].raw_text}</p><div className="mt-4 flex flex-wrap gap-2">{highPriority[0].classification?.reasoning_terms?.slice(0, 6).map((term) => <span key={term.term} className={term.positive ? "rounded-md border border-rose-400/20 bg-rose-500/10 px-2 py-1 font-mono text-[10px] text-rose-400" : "rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-400"}>{term.positive ? "+" : ""}{term.weight} {term.term}</span>)}</div><p className="mt-4 rounded-xl border border-surface-border bg-surface/45 p-3 text-xs leading-relaxed text-slate-400">{highPriority[0].classification?.reasoning_narrative || "The Layer A model flagged this observation from the displayed TF-IDF contributing terms and the mapped Life-Saving Rule."}</p></div> : <div className="mt-4"><EmptyPanel icon={Sparkles} title="No explainability record yet" detail="Important terms, confidence and safety-rule reasoning appear after a SIF precursor classification." action={<Link href="/dashboard/ingest?tab=manual" className="text-xs font-bold text-amber-400">Try a real observation</Link>} /></div>}
        </article>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-card p-5">
        <SectionHeading eyebrow="Recent high-priority observations" title="Observation review queue" action={<Link href="/dashboard/reports" className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">Open report triage <ChevronRight className="h-3.5 w-3.5" /></Link>} />
        <div className="mt-4 divide-y divide-surface-border">
          {highPriority.slice(0, 5).map((report) => <Link key={report.id} href={`/dashboard/reports?search=${encodeURIComponent(report.id)}`} className="flex min-w-0 flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-400/20 bg-rose-500/10"><AlertTriangle className="h-4 w-4 text-rose-400" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-200">{report.site} · {report.activity}</p><p className="mt-1 line-clamp-1 text-[11px] text-slate-400">{report.raw_text}</p></div><div className="flex shrink-0 items-center gap-2"><span className="text-[10px] text-slate-500">{report.reported_date}</span><span className="rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-400">{report.classification?.confidence}%</span></div></Link>)}
          {!highPriority.length && <EmptyPanel icon={FileText} title="Review queue is clear" detail={hasData ? "No SIF precursor reports are awaiting high-priority review." : "Classified high-priority reports will appear here with a direct link to report triage."} />}
        </div>
      </section>

      <section className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-5 sm:flex sm:items-center sm:justify-between">
        <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10"><Bot className="h-5 w-5 text-violet-400" /></span><div><h2 className="font-display text-base font-bold text-slate-100">AI safety intelligence</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">Ask the connected AI service about this prototype, its classification workflow, safety controls and recommended HSE actions.</p></div></div>
        <button onClick={openAssistant} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-bold text-white transition hover:bg-violet-500 sm:mt-0"><Sparkles className="h-3.5 w-3.5" /> Ask AI assistant</button>
      </section>
    </div>
  );
}
