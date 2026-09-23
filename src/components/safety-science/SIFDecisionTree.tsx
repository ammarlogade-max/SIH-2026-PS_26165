"use client";

import React, { useState } from "react";
import {
  GitFork,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Lock,
  Crosshair,
  ArrowRight,
  Info,
} from "lucide-react";
import { SIFDecisionGateEvaluation } from "@/lib/types";

export interface SIFDecisionTreeProps {
  evaluation?: SIFDecisionGateEvaluation | null;
  compact?: boolean;
}

export default function SIFDecisionTree({
  evaluation,
  compact = false,
}: SIFDecisionTreeProps) {
  const [activeGate, setActiveGate] = useState<1 | 2 | 3 | null>(null);

  if (!evaluation) {
    return (
      <div className="rounded-lg border border-dashed border-surface-border bg-surface/30 p-4 text-center">
        <GitFork className="mx-auto h-6 w-6 text-slate-500" />
        <p className="mt-2 text-xs font-semibold text-slate-300">
          SIF Decision Gate Tree (Energy – Barrier – Exposure)
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Run observation through Layer A classifier to evaluate diagnostic gates.
        </p>
      </div>
    );
  }

  const {
    gate1_high_energy,
    gate1_details,
    gate2_direct_control_compromised,
    gate2_details,
    gate3_line_of_fire_intersected,
    gate3_details,
    decision_verdict,
    diagnostic_confidence,
  } = evaluation;

  const isPrecursor = decision_verdict === "Diagnostic: SIF Precursor";
  const isActual = decision_verdict === "Diagnostic: High Exposure / Major Event";
  const isSifEvent = isPrecursor || isActual;

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-4 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-sky-500/20 text-sky-400">
              <GitFork className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              SIF Decision Gate Tree
            </h3>
            <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-sky-400">
              Energy · Barrier · Exposure
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Three-gate audit diagnostic protocol separating true SIF precursors from minor deviations
          </p>
        </div>

        {/* Verdict Badge */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold ${
            isActual
              ? "border-rose-500/50 bg-rose-500/20 text-rose-300 ring-1 ring-rose-500"
              : isPrecursor
              ? "border-amber-500/50 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500"
              : "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {isSifEvent ? (
            <ShieldAlert className="h-3.5 w-3.5" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          <span>{decision_verdict}</span>
          {diagnostic_confidence !== undefined && (
            <span className="ml-1 opacity-70">({diagnostic_confidence}%)</span>
          )}
        </div>
      </div>

      {/* 3-Gate Diagnostic Flowchart */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Gate 1 */}
        <div
          onClick={() => setActiveGate(activeGate === 1 ? null : 1)}
          className={`cursor-pointer rounded-md border p-3 transition-all ${
            gate1_high_energy
              ? "border-rose-500/40 bg-rose-500/10 hover:border-rose-400"
              : "border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400"
          } ${activeGate === 1 ? "ring-2 ring-sky-400" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Zap className="h-3 w-3 text-amber-400" />
              Gate 1: High Energy
            </span>
            {gate1_high_energy ? (
              <span className="flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                <CheckCircle2 className="h-3 w-3" /> Exceeded
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <XCircle className="h-3 w-3" /> Low Energy
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-200">
            Physical release threshold present?
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
            {gate1_details}
          </p>
        </div>

        {/* Gate 2 */}
        <div
          onClick={() => setActiveGate(activeGate === 2 ? null : 2)}
          className={`cursor-pointer rounded-md border p-3 transition-all ${
            gate2_direct_control_compromised
              ? "border-rose-500/40 bg-rose-500/10 hover:border-rose-400"
              : "border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400"
          } ${activeGate === 2 ? "ring-2 ring-sky-400" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Lock className="h-3 w-3 text-sky-400" />
              Gate 2: Direct Barrier
            </span>
            {gate2_direct_control_compromised ? (
              <span className="flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                <CheckCircle2 className="h-3 w-3" /> Compromised
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <XCircle className="h-3 w-3" /> Intact
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-200">
            Engineered control absent or failed?
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
            {gate2_details}
          </p>
        </div>

        {/* Gate 3 */}
        <div
          onClick={() => setActiveGate(activeGate === 3 ? null : 3)}
          className={`cursor-pointer rounded-md border p-3 transition-all ${
            gate3_line_of_fire_intersected
              ? "border-rose-500/40 bg-rose-500/10 hover:border-rose-400"
              : "border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400"
          } ${activeGate === 3 ? "ring-2 ring-sky-400" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Crosshair className="h-3 w-3 text-rose-400" />
              Gate 3: Line of Fire
            </span>
            {gate3_line_of_fire_intersected ? (
              <span className="flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                <CheckCircle2 className="h-3 w-3" /> Intersected
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <XCircle className="h-3 w-3" /> Cleared
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-200">
            Worker in release envelope?
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
            {gate3_details}
          </p>
        </div>
      </div>

      {/* Interactive Gate Inspector */}
      {activeGate && (
        <div className="mt-3 rounded-md border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">
          <p className="font-bold text-sky-100">
            Gate {activeGate} Audit Diagnostic Analysis:
          </p>
          <p className="mt-1 text-[11px] leading-relaxed">
            {activeGate === 1 && gate1_details}
            {activeGate === 2 && gate2_details}
            {activeGate === 3 && gate3_details}
          </p>
        </div>
      )}

      {/* Footnote */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-slate-500" />
          SIF Precursor is verified when High Energy meets a Compromised Direct Barrier.
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          Diagnostic Gate Protocol: Energy · Barrier · Line-of-Fire
        </span>
      </div>
    </div>
  );
}
