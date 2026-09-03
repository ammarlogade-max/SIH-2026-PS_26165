"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit,
  Search,
  Building2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Plus,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { InvestigationResult } from "@/app/api/investigate/route";
import { LifeSavingRule } from "@/lib/types";

function InvestigationContent() {
  const searchParams = useSearchParams();
  const initialSite = searchParams.get("site") || "Duliajan Rig 7";
  const initialRule = searchParams.get("rule") || "";

  const [targetType, setTargetType] = useState<"facility" | "rule" | "pattern">("facility");
  const [selectedSite, setSelectedSite] = useState(initialSite);
  const [selectedRule, setSelectedRule] = useState(initialRule || "Working at Height");

  const [investigating, setInvestigating] = useState(false);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // CAPA Creation from investigation
  const [savingActionIndex, setSavingActionIndex] = useState<number | null>(null);
  const [savedActionIndices, setSavedActionIndices] = useState<number[]>([]);

  const runInvestigation = async () => {
    setInvestigating(true);
    setError(null);
    setSavedActionIndices([]);
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          site: selectedSite,
          rule: selectedRule,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Investigation synthesis failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investigation failed");
    } finally {
      setInvestigating(false);
    }
  };

  useEffect(() => {
    runInvestigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCAPA = async (action: InvestigationResult["recommendedActions"][0], index: number) => {
    setSavingActionIndex(index);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: action.title,
          description: action.description,
          site: result?.targetName || selectedSite,
          life_saving_rule: result?.lifeSavingRule || "Work Authorization",
          assigned_to: "Assigned Supervisor",
          assigned_role: action.targetRole,
          priority: action.priority,
          due_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
          actor_name: "AI Investigation Lead",
          actor_role: "HSE Officer",
        }),
      });
      if (!res.ok) throw new Error("Failed to save action");
      setSavedActionIndices((prev) => [...prev, index]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving action");
    } finally {
      setSavingActionIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <BrainCircuit className="h-4 w-4" />
            AI Root Cause &amp; Barrier Investigation Mode
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Precursor Investigation Synthesis
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Synthesize multi-angle safety evidence, barrier breakdown vectors, and actionable CAPA interventions directly grounded in field observation text.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/actions"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-3 text-xs font-semibold text-slate-300 transition hover:bg-surface-hover hover:text-white"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            CAPA Register
          </Link>
        </div>
      </div>

      {/* Control Panel: Target Selection */}
      <div className="rounded-2xl border border-surface-border bg-surface-card/90 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Target Type selector */}
            <div className="flex rounded-xl border border-surface-border bg-surface/75 p-1">
              <button
                onClick={() => setTargetType("facility")}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  targetType === "facility"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Facility
              </button>
              <button
                onClick={() => setTargetType("rule")}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  targetType === "rule"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Life-Saving Rule
              </button>
            </div>

            {/* Target selector dropdown */}
            {targetType === "facility" ? (
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="h-10 rounded-xl border border-surface-border bg-surface/80 px-3 text-xs font-semibold text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="Duliajan Rig 7">Duliajan Rig 7 (Drilling Rig)</option>
                <option value="Moran GGS">Moran GGS (Gas Gathering Station)</option>
                <option value="Naharkatiya Rig 4">Naharkatiya Rig 4 (Drilling Rig)</option>
                <option value="Digboi Tank Farm">Digboi Tank Farm (Crude Storage)</option>
                <option value="Jorajan CTF">Jorajan CTF (Central Tank Farm)</option>
                <option value="Shalmari Wellsite">Shalmari Wellsite (Exploration)</option>
                <option value="Tinsukia Pipeline Header">Tinsukia Pipeline Header (Transmission)</option>
                <option value="Dikom Gas Compressor">Dikom Gas Compressor</option>
              </select>
            ) : (
              <select
                value={selectedRule}
                onChange={(e) => setSelectedRule(e.target.value)}
                className="h-10 rounded-xl border border-surface-border bg-surface/80 px-3 text-xs font-semibold text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="Working at Height">Working at Height</option>
                <option value="Energy Isolation">Energy Isolation</option>
                <option value="Hot Work">Hot Work</option>
                <option value="Confined Space">Confined Space</option>
                <option value="Line of Fire">Line of Fire</option>
                <option value="Driving">Driving</option>
                <option value="Safe Mechanical Lifting">Safe Mechanical Lifting</option>
                <option value="Bypassing Safety Controls">Bypassing Safety Controls</option>
                <option value="Work Authorization">Work Authorization</option>
              </select>
            )}
          </div>

          <button
            onClick={runInvestigation}
            disabled={investigating}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-400 disabled:opacity-50"
          >
            <Sparkles className={clsx("h-4 w-4", investigating && "animate-spin")} />
            {investigating ? "Synthesizing Evidence..." : "Run Grounded Investigation"}
          </button>
        </div>
      </div>

      {/* Investigation Results */}
      {investigating ? (
        <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-surface-border bg-surface-card/60 p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
          <h3 className="font-display text-base font-bold text-slate-200">
            Analyzing Field Evidence &amp; Barrier Integrities...
          </h3>
          <p className="max-w-md text-xs text-slate-400">
            Extracting n-gram feature tokens, computing recurring pattern matrices, and synthesizing procedural breakdown factors for {targetType === "facility" ? selectedSite : selectedRule}.
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center text-xs text-red-300">
          {error}
        </div>
      ) : result ? (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-100">
                    Investigation Dossier: {result.targetName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Grounded synthesis across {result.evidenceSourceCount} field observation sources
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-300">
                  {result.confidenceScore}% Model Confidence
                </span>
                <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                  {result.providerUsed === "grounded-llm" ? "AI Grounded Analysis" : "Deterministic Safety Engine"}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Executive Summary</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{result.executiveSummary}</p>
            </div>

            {/* Risk Signals */}
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {result.riskSignals.map((sig, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border border-surface-border bg-surface/50 p-3 text-xs text-slate-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>{sig}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Barrier Breakdowns & Contributing Factors */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Barrier Breakdowns */}
            <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                Barrier Breakdown Vectors
              </div>
              <h3 className="font-display text-base font-bold text-slate-100 mt-1">
                Failed or Bypassed Safety Controls
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical and administrative barriers showing procedural erosion
              </p>

              <div className="mt-4 space-y-3">
                {result.barrierBreakdowns.map((b, i) => (
                  <div key={i} className="rounded-xl border border-surface-border bg-surface/50 p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{b.barrier}</span>
                      <span
                        className={clsx(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          b.severity === "critical"
                            ? "bg-red-500/15 text-red-300 border border-red-500/30"
                            : b.severity === "high"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        )}
                      >
                        {b.severity}
                      </span>
                    </div>
                    <p className="mt-1.5 text-slate-300 leading-relaxed">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Layers className="h-4 w-4" />
                Contributing Factors Analysis
              </div>
              <h3 className="font-display text-base font-bold text-slate-100 mt-1">
                Multidimensional Root Cause Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Categorized industrial causality mapping
              </p>

              <div className="mt-4 space-y-3">
                {result.contributingFactors.map((f, i) => (
                  <div key={i} className="rounded-xl border border-surface-border bg-surface/50 p-3.5 text-xs">
                    <span className="font-bold text-amber-400/90">{f.category}</span>
                    <p className="mt-1 text-slate-300 leading-relaxed">{f.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grounded Evidence Reports */}
          <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-100">
                  Grounded Precursor Observations
                </h3>
                <p className="text-xs text-slate-400">
                  Direct raw field observation snippets corroborating this investigation
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-400">
                {result.recurringEvidence.length} Evidence Records
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.recurringEvidence.map((ev) => (
                <div key={ev.report_id} className="rounded-xl border border-surface-border bg-surface/50 p-3.5 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                    <span className="font-medium text-slate-300">{ev.site} · {ev.activity}</span>
                    <span className="font-mono text-amber-400">{ev.confidence.toFixed(1)}% conf</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{ev.text}</p>
                  {ev.rule && (
                    <span className="mt-2 inline-block rounded bg-surface-border/60 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                      Rule: {ev.rule}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actionable CAPA Interventions */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <ClipboardCheck className="h-4 w-4" />
                  CAPA Intervention Protocol
                </div>
                <h3 className="font-display text-lg font-bold text-slate-100 mt-0.5">
                  Recommended Barrier Restorations
                </h3>
              </div>
              <span className="text-xs text-slate-400">1-Click Action Dispatch</span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {result.recommendedActions.map((act, i) => {
                const isSaved = savedActionIndices.includes(i);
                const isSaving = savingActionIndex === i;

                return (
                  <div
                    key={i}
                    className="flex flex-col justify-between rounded-xl border border-surface-border bg-surface-card p-4 transition hover:border-amber-400/40"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase mb-2">
                        <span
                          className={clsx(
                            "rounded px-1.5 py-0.5",
                            act.priority === "immediate"
                              ? "bg-red-500/15 text-red-300 border border-red-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          )}
                        >
                          {act.priority} priority
                        </span>
                        <span className="text-slate-400">Target: {act.targetRole}</span>
                      </div>

                      <h4 className="font-display text-sm font-bold text-slate-100">{act.title}</h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{act.description}</p>
                    </div>

                    <button
                      onClick={() => handleSaveCAPA(act, i)}
                      disabled={isSaved || isSaving}
                      className={clsx(
                        "mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition",
                        isSaved
                          ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400"
                      )}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Saved to CAPA Register
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          {isSaving ? "Saving..." : "Add to CAPA Register"}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AIInvestigationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-surface-border bg-surface-card">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
          <p className="text-xs text-slate-400">Loading AI investigation workspace...</p>
        </div>
      }
    >
      <InvestigationContent />
    </Suspense>
  );
}
