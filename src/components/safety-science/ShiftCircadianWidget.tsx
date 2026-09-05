"use client";

import React from "react";
import {
  Clock,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  AlertTriangle,
  Activity,
  Info,
} from "lucide-react";
import { ShiftTiming, CircadianRiskTier } from "@/lib/types";

interface ShiftCircadianWidgetProps {
  shiftTiming?: ShiftTiming;
  circadianTier?: CircadianRiskTier | "low" | "medium" | "high" | "critical";
  riskMultiplier?: number;
  reportedDate?: string;
  compact?: boolean;
}

const shiftDetails: Record<
  ShiftTiming,
  {
    label: string;
    window: string;
    icon: React.ComponentType<{ className?: string }>;
    riskTier: "low" | "medium" | "high" | "critical";
    multiplier: number;
    description: string;
    color: string;
  }
> = {
  morning_handover: {
    label: "Morning Handover Window",
    window: "06:00 - 08:00 hrs",
    icon: Sunrise,
    riskTier: "high",
    multiplier: 1.35,
    description: "Peak communication breakdown risk between outgoing night shift and incoming crew. Critical LOTO verification window.",
    color: "#f59e0b",
  },
  day_shift: {
    label: "Standard Day Shift",
    window: "08:00 - 18:00 hrs",
    icon: Sun,
    riskTier: "low",
    multiplier: 1.0,
    description: "High physiological alertness and peak engineering supervision active.",
    color: "#10b981",
  },
  evening_handover: {
    label: "Evening Handover Window",
    window: "18:00 - 20:00 hrs",
    icon: Sunset,
    riskTier: "medium",
    multiplier: 1.25,
    description: "Shift turnover transition. Incomplete permit sign-offs and verbal turnover gaps are common.",
    color: "#f59e0b",
  },
  night_shift: {
    label: "Night & Circadian Window",
    window: "20:00 - 06:00 hrs",
    icon: Moon,
    riskTier: "critical",
    multiplier: 1.5,
    description: "Biological circadian nadir (02:00-05:00). Reduced cognitive reaction time and micro-sleep precursor frequency peak.",
    color: "#f43f5e",
  },
};

export default function ShiftCircadianWidget({
  shiftTiming = "day_shift",
  circadianTier,
  riskMultiplier,
  reportedDate,
  compact = false,
}: ShiftCircadianWidgetProps) {
  const info = shiftDetails[shiftTiming] || shiftDetails.day_shift;
  const multiplier = riskMultiplier || info.multiplier;
  const tier = circadianTier || info.riskTier;
  const Icon = info.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
          tier === "critical"
            ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
            : tier === "high" || tier === "medium"
            ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
            : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
        }`}
      >
        <Icon className="h-3 w-3" />
        <span>{info.label.split(" ")[0]}</span>
        <span>({multiplier}x Risk)</span>
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-4 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded"
            style={{ backgroundColor: `${info.color}20`, color: info.color }}
          >
            <Clock className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Shift Handover & Circadian Risk
            </h3>
            <p className="text-xs text-slate-400">
              BSEE Offshore & OSHA circadian fatigue hazard modeling
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-bold`}
          style={{
            borderColor: `${info.color}60`,
            backgroundColor: `${info.color}15`,
            color: info.color,
          }}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{info.label}</span>
          <span className="opacity-80">({multiplier}x Multiplier)</span>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2.5 text-xs">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: info.color }}
        />
        <div>
          <p className="font-semibold text-slate-200">
            Window: {info.window} | Risk Tier: {tier.toUpperCase()}
          </p>
          <p className="mt-0.5 leading-relaxed text-slate-300">
            {info.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2 text-[11px] text-slate-400">
        <span>Fatigue & handover communication multiplier</span>
        <span className="font-mono text-[10px] text-slate-400">
          Weight: {multiplier}x
        </span>
      </div>
    </div>
  );
}
