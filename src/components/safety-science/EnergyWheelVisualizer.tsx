"use client";

import React, { useState } from "react";
import {
  Zap,
  Flame,
  Gauge,
  Volume2,
  Radio,
  Biohazard,
  Activity,
  Layers,
  ArrowDown,
  Cog,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Info,
  HelpCircle,
} from "lucide-react";
import { CSRA_ENERGY_WHEEL, EnergyCategory } from "@/lib/types";

interface EnergyWheelVisualizerProps {
  distribution?: {
    category: EnergyCategory;
    count: number;
    percentage: number;
    highEnergyCount: number;
    color: string;
  }[];
  activeCategory?: EnergyCategory | null;
  onSelectCategory?: (category: EnergyCategory | null) => void;
  interactive?: boolean;
}

const categoryIcons: Record<EnergyCategory, React.ComponentType<{ className?: string }>> = {
  Gravity: ArrowDown,
  Motion: Activity,
  Mechanical: Cog,
  Electrical: Zap,
  Pressure: Gauge,
  Temperature: Flame,
  Chemical: AlertCircle,
  Sound: Volume2,
  Radiation: Radio,
  Biological: Biohazard,
  UNKNOWN: HelpCircle,
};

export default function EnergyWheelVisualizer({
  distribution = [],
  activeCategory = null,
  onSelectCategory,
  interactive = true,
}: EnergyWheelVisualizerProps) {
  const [hoveredCategory, setHoveredCategory] = useState<EnergyCategory | null>(null);

  const selectedOrHovered = hoveredCategory || activeCategory;
  const selectedWheelItem = CSRA_ENERGY_WHEEL.find((w) => w.id === selectedOrHovered);
  const selectedDistItem = distribution.find((d) => d.category === selectedOrHovered);

  const totalTagged = distribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-4 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/20 text-amber-400">
              <Layers className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              CSRA Energy Wheel Classifier
            </h3>
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400">
              Hallowell et al.
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Systematic physical energy hazard mapping across 10 release types
          </p>
        </div>
        {activeCategory && onSelectCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="rounded border border-slate-700 bg-surface-raised px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-slate-500 hover:text-white"
          >
            Clear Energy Filter
          </button>
        )}
      </div>

      {/* Grid of 10 Energy Categories */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {CSRA_ENERGY_WHEEL.map((wheel) => {
          const Icon = categoryIcons[wheel.id] || Layers;
          const dist = distribution.find((d) => d.category === wheel.id);
          const count = dist?.count || 0;
          const pct = dist?.percentage || 0;
          const highCount = dist?.highEnergyCount || 0;
          const isSelected = activeCategory === wheel.id;
          const isHovered = hoveredCategory === wheel.id;

          return (
            <button
              key={wheel.id}
              onClick={() => {
                if (!interactive || !onSelectCategory) return;
                onSelectCategory(isSelected ? null : wheel.id);
              }}
              onMouseEnter={() => setHoveredCategory(wheel.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`group relative flex flex-col justify-between rounded-md border p-2.5 text-left transition-all ${
                isSelected
                  ? "border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400"
                  : isHovered
                  ? "border-slate-500 bg-surface-raised"
                  : "border-surface-border bg-surface/50 hover:border-slate-600 hover:bg-surface-raised/50"
              }`}
            >
              {/* Category indicator bar */}
              <div
                className="absolute left-0 top-0 h-1 w-full rounded-t-md"
                style={{ backgroundColor: wheel.color }}
              />

              <div className="flex items-start justify-between gap-1 pt-1">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                  style={{
                    backgroundColor: `${wheel.color}20`,
                    color: wheel.color,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="font-mono text-xs font-bold text-slate-100">
                  {count}
                </span>
              </div>

              <div className="mt-2 min-w-0">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {wheel.name}
                </p>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{pct}%</span>
                  {highCount > 0 && (
                    <span className="font-mono text-[9px] font-bold text-rose-400" title="High-energy observations">
                      {highCount} HE
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected / Hovered Detail Inspector */}
      {selectedWheelItem && (
        <div className="mt-4 rounded-md border border-slate-700/80 bg-surface-raised p-3 transition-all animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold"
                style={{
                  backgroundColor: `${selectedWheelItem.color}30`,
                  color: selectedWheelItem.color,
                }}
              >
                {React.createElement(categoryIcons[selectedWheelItem.id] || Layers, { className: "h-3 w-3" })}
              </span>
              <span className="text-xs font-bold text-slate-100">
                {selectedWheelItem.name} Energy Profile
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">
                Frequency:{" "}
                <strong className="text-slate-100">
                  {selectedDistItem?.count || 0} observations ({selectedDistItem?.percentage || 0}%)
                </strong>
              </span>
              <span className="text-rose-400">
                High-Energy:{" "}
                <strong>{selectedDistItem?.highEnergyCount || 0} critical</strong>
              </span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                High-Energy Threshold Criteria
              </p>
              <p className="mt-0.5 font-mono text-[11px] font-medium text-amber-300">
                {selectedWheelItem.highThreshold || selectedWheelItem.highEnergyThreshold}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Typical Energy Release Sources
              </p>
              <p className="mt-0.5 text-[11px] text-slate-300">
                {selectedWheelItem.typicalSources.join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Benchmark Note */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-slate-500" />
          Based on Construction Safety Research Alliance (CSRA) SIF taxonomy.
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          Total Observations Tagged: {totalTagged}
        </span>
      </div>
    </div>
  );
}
