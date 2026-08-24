"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Activity,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  BarChart3,
  Scale,
  GitBranch,
} from "lucide-react";
import { ModelMetrics } from "@/lib/types";

export default function ModelPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [layerA, setLayerA] = useState<ModelMetrics | null>(null);
  const [layerB, setLayerB] = useState<any | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/metrics");
      const data = await res.json();
      if (data.success) {
        setLayerA(data.layerA);
        setLayerB(data.layerB);
      }
    } catch (err) {
      console.error("Failed to load model metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Model Performance & Two-Layer Architecture
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Exact empirical precision, recall, and confusion matrix measured on a real held-out test split (SIH26165).
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="p-2 text-slate-400 hover:text-white rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover transition-colors self-start md:self-auto"
          title="Refresh metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Two-Layer Architecture Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Layer A Card */}
        <div className="p-5 rounded-2xl bg-surface-card border border-emerald-500/40 relative space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Layer A · Active in Live Production
            </span>
            <span className="text-xs text-slate-400 font-mono">CPU-Only (&lt;10ms)</span>
          </div>
          <h3 className="font-bold text-white text-base">TF-IDF Vectorizer + Logistic Regression</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Deterministic baseline classifier running locally without external network dependencies. Generates direct, mathematically verifiable feature weights for full explainability.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono pt-2 border-t border-surface-border text-slate-400">
            <div>Precision: <span className="text-emerald-400 font-bold">{layerA?.metrics.precision}%</span></div>
            <div>Recall: <span className="text-emerald-400 font-bold">{layerA?.metrics.recall}%</span></div>
            <div>F1: <span className="text-emerald-400 font-bold">{layerA?.metrics.f1_score}%</span></div>
          </div>
        </div>

        {/* Layer B Card */}
        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border relative space-y-3 opacity-80">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
              Layer B · Not Started (Gated)
            </span>
            <span className="text-xs text-slate-500 font-mono">Phase 3 Planned</span>
          </div>
          <h3 className="font-bold text-white text-base">Fine-Tuned DistilBERT Transformer</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Per SRS v3 and Build Brief gates, Layer B transformer fine-tuning on Camber GPU is paused until Layer A achieves formal sign-off.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono pt-2 border-t border-surface-border text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
            Status: <span className="text-slate-400 font-semibold">Pending Layer A Review & Approval</span>
          </div>
        </div>
      </div>

      {/* Layer A Detailed Metrics & Confusion Matrix */}
      {layerA && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              Layer A Empirical Test Split Evaluation
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Dataset: {layerA.dataset_size} items ({layerA.train_size} train / {layerA.test_size} held-out test)
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Precision</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {layerA.metrics.precision}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recall</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {layerA.metrics.recall}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">F1-Score</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {layerA.metrics.f1_score}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Accuracy</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {layerA.metrics.accuracy}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Specificity</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {layerA.metrics.specificity}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ROC-AUC</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {layerA.metrics.roc_auc}
              </div>
            </div>
          </div>

          {/* Confusion Matrix & Feature Weights Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm">Confusion Matrix (Held-Out Test Split)</h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-slate-400 text-[11px]">True Positive (TP)</div>
                  <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                    {layerA.confusion_matrix.true_positive}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">SIF Precursors Correctly Caught</div>
                </div>

                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                  <div className="text-slate-400 text-[11px]">False Positive (FP)</div>
                  <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                    {layerA.confusion_matrix.false_positive}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Non-SIF Flagged (False Alarm)</div>
                </div>

                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                  <div className="text-slate-400 text-[11px]">False Negative (FN)</div>
                  <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                    {layerA.confusion_matrix.false_negative}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Missed Precursors</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-slate-400 text-[11px]">True Negative (TN)</div>
                  <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                    {layerA.confusion_matrix.true_negative}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Non-SIF Correctly Cleared</div>
                </div>
              </div>
            </div>

            {/* Top SIF vs Non-SIF Features */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm">Top Logistic Regression Vocabulary Coefficients</h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Positive */}
                <div className="space-y-2">
                  <div className="font-semibold text-rose-400 text-[11px] uppercase tracking-wider">
                    SIF Precursor Drivers (+)
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {layerA.top_sif_features.slice(0, 5).map((f) => (
                      <div key={f.term} className="p-2 rounded bg-surface border border-surface-border flex justify-between">
                        <span className="text-slate-200 truncate">{f.term}</span>
                        <span className="text-rose-400 font-bold ml-1">+{f.coefficient}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Negative */}
                <div className="space-y-2">
                  <div className="font-semibold text-emerald-400 text-[11px] uppercase tracking-wider">
                    Non-SIF Indicators (-)
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {layerA.top_non_sif_features.slice(0, 5).map((f) => (
                      <div key={f.term} className="p-2 rounded bg-surface border border-surface-border flex justify-between">
                        <span className="text-slate-200 truncate">{f.term}</span>
                        <span className="text-emerald-400 font-bold ml-1">{f.coefficient}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* IOGP Rule Classification Breakdown Table */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    9 IOGP Life-Saving Rules Multi-Class Classification Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Evaluated strictly against held-out test split. Insufficient test support categories are honestly flagged as N/A.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Macro F1: {layerA.rule_classification_metrics.macro_f1 !== null ? `${layerA.rule_classification_metrics.macro_f1}%` : "N/A"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-surface-border pb-2">
                    <tr>
                      <th className="py-2 font-semibold">IOGP Life-Saving Rule Category</th>
                      <th className="py-2 font-semibold">Precision</th>
                      <th className="py-2 font-semibold">Recall</th>
                      <th className="py-2 font-semibold">F1-Score</th>
                      <th className="py-2 font-semibold text-right">Test Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-300">
                    {layerA.rule_classification_metrics.rules.map((r) => {
                      const isInsufficient = r.support === 0 || r.precision === null || r.recall === null;
                      return (
                        <tr key={r.rule} className="hover:bg-surface-hover/50">
                          <td className="py-2.5 font-medium text-white flex items-center gap-2">
                            <span>{r.rule}</span>
                            {r.support === 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Insufficient test data
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 font-mono">
                            {r.precision !== null ? (
                              <span className="text-emerald-400">{r.precision}%</span>
                            ) : (
                              <span className="text-slate-500 italic">N/A</span>
                            )}
                          </td>
                          <td className="py-2.5 font-mono">
                            {r.recall !== null ? (
                              <span className="text-emerald-400">{r.recall}%</span>
                            ) : (
                              <span className="text-slate-500 italic">N/A</span>
                            )}
                          </td>
                          <td className="py-2.5 font-mono font-bold">
                            {r.f1_score !== null ? (
                              <span className="text-amber-300">{r.f1_score}%</span>
                            ) : (
                              <span className="text-slate-500 italic">N/A</span>
                            )}
                          </td>
                          <td className="py-2.5 font-mono text-right">
                            {r.support > 0 ? (
                              <span className="text-slate-300">{r.support} test samples</span>
                            ) : (
                              <span className="text-slate-500">0 samples (N/A)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
