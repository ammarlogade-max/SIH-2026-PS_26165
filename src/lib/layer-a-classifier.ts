import {
  LifeSavingRule,
  IOGP_LIFE_SAVING_RULES,
  Classification,
  EnergyCategory,
  BarrierAssessment,
  CampbellGateEvaluation,
} from "./types";
import {
  TRAINED_LAYER_A_MODEL,
  extractTokensAndNgrams,
  sigmoid,
  TrainedModelArtifact,
} from "./model-trainer";
import {
  analyzeEnergyWheel,
  evaluateBarrierStatus,
  evaluateCampbellGates,
  detectShiftAndCircadianRisk,
} from "./safety-science-engine";
import { v4 as uuidv4 } from "uuid";

export interface LayerAClassificationResult {
  is_sif_potential: boolean;
  confidence: number; // 0 to 100
  life_saving_rule: LifeSavingRule | null;
  reasoning_terms: { term: string; weight: number; positive: boolean }[];
  raw_score: number;
  rule_scores: { rule: LifeSavingRule; score: number }[];
  model_version: string;
  // Research-backed extensions
  energy_category: EnergyCategory;
  energy_magnitude: "High-Energy" | "Low-Energy";
  energy_source_details: string;
  barrier_assessment: BarrierAssessment;
  campbell_gates: CampbellGateEvaluation;
  shift_risk_multiplier: number;
}

/**
 * Vectorizes raw text into the trained L2-normalized TF-IDF feature space.
 */
export function vectorizeText(
  text: string,
  model: TrainedModelArtifact = TRAINED_LAYER_A_MODEL
): { vector: number[]; activeTerms: { term: string; tfidf: number; index: number }[] } {
  const M = model.vocabulary.length;
  const docTokens = extractTokensAndNgrams(text);
  const tfMap = new Map<string, number>();

  for (const t of docTokens) {
    tfMap.set(t, (tfMap.get(t) || 0) + 1);
  }

  const vector = new Array(M).fill(0);
  const activeTerms: { term: string; tfidf: number; index: number }[] = [];
  let normSq = 0;

  for (const [term, count] of tfMap.entries()) {
    const j = model.vocabIndexMap.get(term);
    if (j !== undefined) {
      const tf = 1 + Math.log(count);
      const tfidf = tf * model.idf[j];
      vector[j] = tfidf;
      normSq += tfidf * tfidf;
      activeTerms.push({ term, tfidf, index: j });
    }
  }

  // L2 Normalization
  const norm = Math.sqrt(normSq);
  if (norm > 0) {
    for (let j = 0; j < M; j++) {
      vector[j] /= norm;
    }
    for (const item of activeTerms) {
      item.tfidf /= norm;
    }
  }

  return { vector, activeTerms };
}

/**
 * Executes Layer A deterministic TF-IDF + Logistic Regression classification.
 * Pure mathematical scoring using weights learned strictly from training data.
 * Operates on CPU with <10ms latency.
 */
export function classifyReportLayerA(
  text: string,
  model: TrainedModelArtifact = TRAINED_LAYER_A_MODEL
): LayerAClassificationResult {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    const energyResult = analyzeEnergyWheel("", null);
    const barrierAssessment = evaluateBarrierStatus("", false);
    const campbellGates = evaluateCampbellGates(
      "",
      false,
      energyResult.category,
      energyResult.magnitude,
      barrierAssessment
    );
    return {
      is_sif_potential: false,
      confidence: 50.0,
      life_saving_rule: null,
      reasoning_terms: [],
      raw_score: 0,
      rule_scores: [],
      model_version: "SIF-Sentinel-LayerA-TFIDF-LogReg-v1.0",
      energy_category: energyResult.category,
      energy_magnitude: energyResult.magnitude,
      energy_source_details: energyResult.sourceDetails,
      barrier_assessment: barrierAssessment,
      campbell_gates: campbellGates,
      shift_risk_multiplier: 1.0,
    };
  }

  const { vector, activeTerms } = vectorizeText(text, model);

  // Compute logit = w * x + b
  let logit = model.intercept;
  const termContributions: { term: string; weight: number; positive: boolean }[] = [];

  for (const item of activeTerms) {
    const w = model.weights[item.index];
    const contribution = w * item.tfidf * 3.5; // Scaled for explainability display
    logit += w * item.tfidf;

    if (Math.abs(contribution) > 0.01) {
      termContributions.push({
        term: item.term,
        weight: Number(contribution.toFixed(2)),
        positive: contribution > 0,
      });
    }
  }

  // Calculate SIF Probability via Sigmoid
  const sifProbability = sigmoid(logit);
  const is_sif_potential = sifProbability >= 0.45; // Calibrated operational decision boundary

  // Sort term contributions by magnitude
  termContributions.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  const topReasoningTerms = termContributions.slice(0, 5);

  // Multi-Class IOGP Rule Scoring via Centroid Cosine Similarity
  const ruleScoresMap: Record<LifeSavingRule, number> = {
    "Energy Isolation": 0,
    "Hot Work": 0,
    "Confined Space": 0,
    "Working at Height": 0,
    "Line of Fire": 0,
    "Driving": 0,
    "Safe Mechanical Lifting": 0,
    "Bypassing Safety Controls": 0,
    "Work Authorization": 0,
  };

  for (const ruleDef of IOGP_LIFE_SAVING_RULES) {
    const ruleId = ruleDef.id;
    const centroid = model.ruleCentroids[ruleId];
    if (centroid) {
      let dot = 0;
      for (const item of activeTerms) {
        dot += item.tfidf * centroid[item.index];
      }
      ruleScoresMap[ruleId] = dot;
    }
  }

  const ruleScoresList = (Object.entries(ruleScoresMap) as [LifeSavingRule, number][])
    .map(([rule, score]) => ({ rule, score: Number((score * 10).toFixed(2)) }))
    .sort((a, b) => b.score - a.score);

  let bestRule: LifeSavingRule | null = null;
  if (is_sif_potential) {
    if (ruleScoresList[0] && ruleScoresList[0].score > 0) {
      bestRule = ruleScoresList[0].rule;
    } else {
      bestRule = "Work Authorization";
    }
  }

  // Percentage confidence
  const rawConfidence = is_sif_potential ? sifProbability * 100 : (1 - sifProbability) * 100;
  const clampedConfidence = Math.max(60.0, Math.min(99.0, Number(rawConfidence.toFixed(1))));

  // Research-backed Energy Wheel analysis
  const energyResult = analyzeEnergyWheel(text, bestRule);

  // Direct vs. Administrative Barrier scoring
  const barrierAssessment = evaluateBarrierStatus(text, is_sif_potential);

  // Campbell Institute 3-Gate SIF Decision Tree
  const campbellGates = evaluateCampbellGates(
    text,
    is_sif_potential,
    energyResult.category,
    energyResult.magnitude,
    barrierAssessment
  );

  // Shift & Circadian fatigue risk
  const shiftAssessment = detectShiftAndCircadianRisk(new Date().toISOString());

  return {
    is_sif_potential,
    confidence: clampedConfidence,
    life_saving_rule: bestRule,
    reasoning_terms: topReasoningTerms,
    raw_score: Number(logit.toFixed(3)),
    rule_scores: ruleScoresList,
    model_version: "SIF-Sentinel-LayerA-TFIDF-LogReg-v1.0",
    energy_category: energyResult.category,
    energy_magnitude: energyResult.magnitude,
    energy_source_details: energyResult.sourceDetails,
    barrier_assessment: barrierAssessment,
    campbell_gates: campbellGates,
    shift_risk_multiplier: shiftAssessment.risk_multiplier,
  };
}

/**
 * Creates a Classification record for a given report.
 */
export function generateLayerAClassification(
  reportId: string,
  text: string,
  reportedDate?: string
): Classification {
  const result = classifyReportLayerA(text);
  const shiftAssessment = detectShiftAndCircadianRisk(reportedDate || new Date().toISOString());

  return {
    id: `cls-a-${uuidv4()}`,
    report_id: reportId,
    layer: "A",
    is_sif_potential: result.is_sif_potential,
    confidence: result.confidence,
    life_saving_rule: result.life_saving_rule,
    reasoning_terms: result.reasoning_terms,
    reasoning_narrative: null,
    model_version: result.model_version,
    created_at: new Date().toISOString(),
    energy_category: result.energy_category,
    energy_magnitude: result.energy_magnitude,
    energy_source_details: result.energy_source_details,
    barrier_assessment: result.barrier_assessment,
    campbell_gates: result.campbell_gates,
    shift_risk_multiplier: shiftAssessment.risk_multiplier,
  };
}
