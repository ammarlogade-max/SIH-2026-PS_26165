import { TEST_SPLIT, TRAIN_SPLIT, TRAINED_LAYER_A_MODEL } from "./model-trainer";
import { classifyReportLayerA, vectorizeText } from "./layer-a-classifier";
import { LifeSavingRule, IOGP_LIFE_SAVING_RULES } from "./types";
import { LABELED_TRAINING_DATASET } from "./ml-training-dataset";

export interface EvaluationReport {
  dataset_size: number;
  train_size: number;
  test_size: number;
  sif_base_rate_percent: number;
  dataset_note: string;
  metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    f2_score: number;
    accuracy: number;
    specificity: number;
    roc_auc: number;
  };
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
  rule_classification_metrics: {
    macro_precision: number | null;
    macro_recall: number | null;
    macro_f1: number | null;
    rules: {
      rule: LifeSavingRule;
      precision: number | null;
      recall: number | null;
      f1_score: number | null;
      support: number;
      insufficient_test_data?: boolean;
    }[];
  };
  top_sif_features: { term: string; coefficient: number }[];
  top_non_sif_features: { term: string; coefficient: number }[];
  last_evaluated_at: string;
}

/**
 * Mathematically evaluates the deployed Layer A classifier strictly against the held-out test split.
 * Uses un-clamped continuous SIF probabilities for precision ROC-AUC and PR integration.
 */
/**
 * Numerical trapezoidal integration for ROC-AUC without artificial clamping.
 */
export function calculateROCAUC(pairs: { yTrue: number | boolean; yScore: number }[]): number {
  if (pairs.length === 0) return 0.5;
  const totalActualPositives = pairs.filter((p) => Boolean(p.yTrue)).length;
  const totalActualNegatives = pairs.filter((p) => !Boolean(p.yTrue)).length;
  if (totalActualPositives === 0 || totalActualNegatives === 0) return 0.5;

  const rocPoints: { fpr: number; tpr: number }[] = [];
  const thresholds: number[] = [];
  for (let t = 0; t <= 100; t += 2) {
    thresholds.push(t / 100);
  }

  for (const threshold of thresholds) {
    let t_tp = 0;
    let t_fp = 0;

    for (const p of pairs) {
      const predPositive = p.yScore >= threshold;
      const actual = Boolean(p.yTrue);
      if (predPositive && actual) t_tp++;
      if (predPositive && !actual) t_fp++;
    }

    const tpr = totalActualPositives > 0 ? t_tp / totalActualPositives : 0;
    const fpr = totalActualNegatives > 0 ? t_fp / totalActualNegatives : 0;
    rocPoints.push({ fpr, tpr });
  }

  rocPoints.push({ fpr: 0, tpr: 0 });
  rocPoints.push({ fpr: 1, tpr: 1 });
  rocPoints.sort((a, b) => (a.fpr !== b.fpr ? a.fpr - b.fpr : a.tpr - b.tpr));

  const uniqueRocPoints: { fpr: number; tpr: number }[] = [];
  for (const pt of rocPoints) {
    const last = uniqueRocPoints[uniqueRocPoints.length - 1];
    if (!last || last.fpr !== pt.fpr || last.tpr !== pt.tpr) {
      uniqueRocPoints.push(pt);
    }
  }

  let roc_auc = 0;
  for (let i = 1; i < uniqueRocPoints.length; i++) {
    const xDiff = uniqueRocPoints[i].fpr - uniqueRocPoints[i - 1].fpr;
    const yAvg = (uniqueRocPoints[i].tpr + uniqueRocPoints[i - 1].tpr) / 2;
    roc_auc += xDiff * yAvg;
  }
  return Math.max(0.0, Math.min(1.0, Math.round(roc_auc * 1000) / 1000));
}

export function calculateHeldOutMetrics(): EvaluationReport {
  const total = LABELED_TRAINING_DATASET.length;
  const sifTotal = LABELED_TRAINING_DATASET.filter((d) => d.is_sif).length;
  const sifBaseRate = (sifTotal / total) * 100;

  // Run the REAL deployed classifier against the held-out test set
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  // Store continuous probabilities for ROC-AUC integration
  const predictions: { actual: boolean; predicted: boolean; prob: number; rule: LifeSavingRule | null; actualRule: LifeSavingRule | null }[] = [];

  for (const item of TEST_SPLIT) {
    const result = classifyReportLayerA(item.text);
    const actual = item.is_sif;
    const predicted = result.is_sif_potential;
    const prob = result.sif_probability; // Continuous un-clamped probability [0, 1]

    predictions.push({
      actual,
      predicted,
      prob,
      rule: result.life_saving_rule,
      actualRule: item.rule,
    });

    if (predicted && actual) tp++;
    else if (predicted && !actual) fp++;
    else if (!predicted && !actual) tn++;
    else if (!predicted && actual) fn++;
  }

  const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
  const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
  const f1_score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const f2_score =
    precision > 0 && recall > 0
      ? (5 * precision * recall) / (4 * precision + recall)
      : 0;
  const accuracy = TEST_SPLIT.length > 0 ? ((tp + tn) / TEST_SPLIT.length) * 100 : 0;
  const specificity = tn + fp > 0 ? (tn / (tn + fp)) * 100 : 0;

  // ── Compute Real ROC-AUC via Threshold Sweep & Trapezoidal Integration ─────
  const totalActualPositives = predictions.filter((p) => p.actual).length;
  const totalActualNegatives = predictions.filter((p) => !p.actual).length;

  const rocPoints: { fpr: number; tpr: number }[] = [];
  const thresholds: number[] = [];
  for (let t = 0; t <= 100; t += 2) {
    thresholds.push(t / 100);
  }

  for (const threshold of thresholds) {
    let t_tp = 0;
    let t_fp = 0;

    for (const p of predictions) {
      const predPositive = p.prob >= threshold;
      if (predPositive && p.actual) t_tp++;
      if (predPositive && !p.actual) t_fp++;
    }

    const tpr = totalActualPositives > 0 ? t_tp / totalActualPositives : 0;
    const fpr = totalActualNegatives > 0 ? t_fp / totalActualNegatives : 0;
    rocPoints.push({ fpr, tpr });
  }

  // Ensure anchor points (1,1) and (0,0) are included
  rocPoints.push({ fpr: 0, tpr: 0 });
  rocPoints.push({ fpr: 1, tpr: 1 });

  // Sort by FPR ascending, then TPR ascending
  rocPoints.sort((a, b) => (a.fpr !== b.fpr ? a.fpr - b.fpr : a.tpr - b.tpr));

  // Remove duplicate FPR points
  const uniqueRocPoints: { fpr: number; tpr: number }[] = [];
  for (const pt of rocPoints) {
    const last = uniqueRocPoints[uniqueRocPoints.length - 1];
    if (!last || last.fpr !== pt.fpr || last.tpr !== pt.tpr) {
      uniqueRocPoints.push(pt);
    }
  }

  // Numerical trapezoidal integration
  let roc_auc = 0;
  for (let i = 1; i < uniqueRocPoints.length; i++) {
    const xDiff = uniqueRocPoints[i].fpr - uniqueRocPoints[i - 1].fpr;
    const yAvg = (uniqueRocPoints[i].tpr + uniqueRocPoints[i - 1].tpr) / 2;
    roc_auc += xDiff * yAvg;
  }
  // True mathematical ROC-AUC (bounded strictly [0.0, 1.0]; NEVER artificially clamped to 0.5)
  roc_auc = Math.max(0.0, Math.min(1.0, roc_auc));

  // ── Compute 9 IOGP Rule Multi-Class Metrics from Test Predictions ──────────
  const ruleMetricsList = IOGP_LIFE_SAVING_RULES.map((rDef) => {
    const ruleName = rDef.id;
    let ruleTp = 0;
    let ruleFp = 0;
    let ruleFn = 0;
    let support = 0;

    for (const p of predictions) {
      if (p.actualRule === ruleName) {
        support++;
        if (p.rule === ruleName) {
          ruleTp++;
        } else {
          ruleFn++;
        }
      } else {
        if (p.rule === ruleName) {
          ruleFp++;
        }
      }
    }

    // Mathematically exact: TP / (TP + FP) if any predicted positive, else null
    const rPrec =
      ruleTp + ruleFp > 0
        ? Number(((ruleTp / (ruleTp + ruleFp)) * 100).toFixed(1))
        : null;

    // Mathematically exact: TP / (TP + FN) if ground truth positive exists, else null
    const rRec =
      support > 0
        ? Number(((ruleTp / support) * 100).toFixed(1))
        : null;

    // Mathematically exact: 2 * P * R / (P + R) if both are non-null and sum > 0
    let rF1: number | null = null;
    if (rPrec !== null && rRec !== null) {
      if (rPrec + rRec > 0) {
        rF1 = Number(((2 * rPrec * rRec) / (rPrec + rRec)).toFixed(1));
      } else {
        rF1 = 0.0;
      }
    }

    return {
      rule: ruleName,
      precision: rPrec,
      recall: rRec,
      f1_score: rF1,
      support,
      insufficient_test_data: support === 0 || ruleTp + ruleFp === 0,
    };
  });

  const validRulesForPrec = ruleMetricsList.filter((r) => r.precision !== null);
  const validRulesForRec = ruleMetricsList.filter((r) => r.recall !== null);
  const validRulesForF1 = ruleMetricsList.filter((r) => r.f1_score !== null);

  const macroPrec =
    validRulesForPrec.length > 0
      ? Number((validRulesForPrec.reduce((sum, r) => sum + (r.precision ?? 0), 0) / validRulesForPrec.length).toFixed(1))
      : null;

  const macroRec =
    validRulesForRec.length > 0
      ? Number((validRulesForRec.reduce((sum, r) => sum + (r.recall ?? 0), 0) / validRulesForRec.length).toFixed(1))
      : null;

  const macroF1 =
    macroPrec !== null && macroRec !== null && macroPrec + macroRec > 0
      ? Number(((2 * macroPrec * macroRec) / (macroPrec + macroRec)).toFixed(1))
      : validRulesForF1.length > 0
      ? Number((validRulesForF1.reduce((sum, r) => sum + (r.f1_score ?? 0), 0) / validRulesForF1.length).toFixed(1))
      : null;

  // ── Extract Top Vocabulary Coefficients Directly from Trained Model ───────
  const sortedPositive = TRAINED_LAYER_A_MODEL.featureCoefficients
    .filter((f) => f.coefficient > 0)
    .sort((a, b) => b.coefficient - a.coefficient)
    .slice(0, 10);

  const sortedNegative = TRAINED_LAYER_A_MODEL.featureCoefficients
    .filter((f) => f.coefficient < 0)
    .sort((a, b) => a.coefficient - b.coefficient)
    .slice(0, 10);

  return {
    dataset_size: total,
    train_size: TRAIN_SPLIT.length,
    test_size: TEST_SPLIT.length,
    sif_base_rate_percent: Number(sifBaseRate.toFixed(1)),
    dataset_note: "SYNTHETIC/CURATED DEVELOPMENT DATA — Not OIL Production Data",
    metrics: {
      precision: Number(precision.toFixed(1)),
      recall: Number(recall.toFixed(1)),
      f1_score: Number(f1_score.toFixed(1)),
      f2_score: Number(f2_score.toFixed(1)),
      accuracy: Number(accuracy.toFixed(1)),
      specificity: Number(specificity.toFixed(1)),
      roc_auc: Number(roc_auc.toFixed(3)),
    },
    confusion_matrix: {
      true_positive: tp,
      false_positive: fp,
      true_negative: tn,
      false_negative: fn,
    },
    rule_classification_metrics: {
      macro_precision: macroPrec,
      macro_recall: macroRec,
      macro_f1: macroF1,
      rules: ruleMetricsList,
    },
    top_sif_features: sortedPositive,
    top_non_sif_features: sortedNegative,
    last_evaluated_at: new Date().toISOString(),
  };
}
