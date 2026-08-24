import { LABELED_TRAINING_DATASET, LabeledObservation } from "./ml-training-dataset";
import { LifeSavingRule, IOGP_LIFE_SAVING_RULES } from "./types";

// ─── Mathematical Types ─────────────────────────────────────────────────────

export interface TrainedModelArtifact {
  vocabulary: string[];
  vocabIndexMap: Map<string, number>;
  idf: number[];
  weights: number[]; // Learned binary logistic regression weights w_j
  intercept: number; // Learned bias b
  ruleCentroids: Record<LifeSavingRule, number[]>; // Multi-class rule weight vectors in TF-IDF space
  featureCoefficients: { term: string; coefficient: number }[];
  trainSize: number;
  testSize: number;
  trainedAt: string;
}

// ─── 1. Tokenization & N-Gram Extractor ──────────────────────────────────────

export function extractTokensAndNgrams(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s/.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(" ").filter((w) => w.length > 1);
  const ngrams: string[] = [...words];

  // 2-grams
  for (let i = 0; i < words.length - 1; i++) {
    ngrams.push(`${words[i]} ${words[i + 1]}`);
  }

  // 3-grams
  for (let i = 0; i < words.length - 2; i++) {
    ngrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }

  return ngrams;
}

// ─── 2. Sigmoid Activation ──────────────────────────────────────────────────

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-12, Math.min(12, z))));
}

// ─── 3. Mathematical Model Trainer (TF-IDF + L2-Regularized Logistic Regression)

export function trainLayerAModel(trainingSet: LabeledObservation[]): TrainedModelArtifact {
  const N = trainingSet.length;
  if (N === 0) {
    throw new Error("Cannot train on empty dataset");
  }

  // Step A: Build vocabulary and compute document frequencies (df) from training documents
  const docTokensList: string[][] = trainingSet.map((doc) => extractTokensAndNgrams(doc.text));
  const dfMap = new Map<string, number>();

  for (const docTokens of docTokensList) {
    const uniqueInDoc = new Set(docTokens);
    for (const token of uniqueInDoc) {
      dfMap.set(token, (dfMap.get(token) || 0) + 1);
    }
  }

  // Select vocabulary: filter out rare tokens with df < 1, prioritize informative terms
  const vocabulary: string[] = [];
  for (const [term, df] of dfMap.entries()) {
    if (df >= 1 && term.length >= 2) {
      vocabulary.push(term);
    }
  }

  // Deterministic sorting of vocabulary for reproducible index mapping
  vocabulary.sort((a, b) => a.localeCompare(b));
  const vocabIndexMap = new Map<string, number>();
  vocabulary.forEach((term, idx) => vocabIndexMap.set(term, idx));
  const M = vocabulary.length;

  // Step B: Calculate smoothed IDF vector: idf_j = ln((1 + N) / (1 + df_j)) + 1
  const idf: number[] = new Array(M);
  for (let j = 0; j < M; j++) {
    const term = vocabulary[j];
    const df = dfMap.get(term) || 1;
    idf[j] = Math.log((1 + N) / (1 + df)) + 1.0;
  }

  // Step C: Compute L2-normalized TF-IDF vectors for all training documents
  // X_train is an N x M matrix
  const X_train: number[][] = new Array(N);
  const y_train: number[] = new Array(N);

  for (let i = 0; i < N; i++) {
    const docTokens = docTokensList[i];
    const tfMap = new Map<string, number>();
    for (const t of docTokens) {
      tfMap.set(t, (tfMap.get(t) || 0) + 1);
    }

    const vec = new Array(M).fill(0);
    let normSq = 0;

    for (const [term, count] of tfMap.entries()) {
      const j = vocabIndexMap.get(term);
      if (j !== undefined) {
        // TF-IDF with sublinear TF scaling
        const tf = 1 + Math.log(count);
        const tfidf = tf * idf[j];
        vec[j] = tfidf;
        normSq += tfidf * tfidf;
      }
    }

    // L2 Normalization
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let j = 0; j < M; j++) {
        vec[j] /= norm;
      }
    }

    X_train[i] = vec;
    y_train[i] = trainingSet[i].is_sif ? 1.0 : 0.0;
  }

  // Step D: Train Logistic Regression via Gradient Descent with L2 Regularization
  // Loss: J(w, b) = -1/N * sum[ y_i * ln(p_i) + (1 - y_i) * ln(1 - p_i) ] + (lambda / (2*N)) * ||w||^2
  const weights: number[] = new Array(M).fill(0);
  let intercept = -1.0; // Initial prior bias

  const epochs = 500;
  const learningRate = 0.45;
  const lambda = 0.25; // L2 regularization penalty

  for (let epoch = 0; epoch < epochs; epoch++) {
    // Gradient accumulators
    const gradW = new Array(M).fill(0);
    let gradB = 0;

    for (let i = 0; i < N; i++) {
      const xi = X_train[i];
      const yi = y_train[i];

      // Compute dot product w * x + b
      let z = intercept;
      for (let j = 0; j < M; j++) {
        if (xi[j] !== 0) {
          z += weights[j] * xi[j];
        }
      }

      const pi = sigmoid(z);
      const error = pi - yi;

      // Accumulate gradients
      for (let j = 0; j < M; j++) {
        if (xi[j] !== 0) {
          gradW[j] += error * xi[j];
        }
      }
      gradB += error;
    }

    // Apply L2 regularization to weight gradients and update parameters
    for (let j = 0; j < M; j++) {
      const totalGradW = gradW[j] / N + (lambda / N) * weights[j];
      weights[j] -= learningRate * totalGradW;
    }
    intercept -= learningRate * (gradB / N);
  }

  // Step E: Train Multi-Class IOGP Rule Centroids in normalized TF-IDF space
  const ruleCentroids: Record<LifeSavingRule, number[]> = {
    "Energy Isolation": new Array(M).fill(0),
    "Hot Work": new Array(M).fill(0),
    "Confined Space": new Array(M).fill(0),
    "Working at Height": new Array(M).fill(0),
    "Line of Fire": new Array(M).fill(0),
    "Driving": new Array(M).fill(0),
    "Safe Mechanical Lifting": new Array(M).fill(0),
    "Bypassing Safety Controls": new Array(M).fill(0),
    "Work Authorization": new Array(M).fill(0),
  };

  const ruleCounts: Record<LifeSavingRule, number> = {
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

  for (let i = 0; i < N; i++) {
    const doc = trainingSet[i];
    if (doc.is_sif && doc.rule) {
      ruleCounts[doc.rule]++;
      const xi = X_train[i];
      for (let j = 0; j < M; j++) {
        ruleCentroids[doc.rule][j] += xi[j];
      }
    }
  }

  // Add domain keyword seeds to rule centroids and normalize
  for (const ruleDef of IOGP_LIFE_SAVING_RULES) {
    const ruleId = ruleDef.id;
    for (const kw of ruleDef.keywords) {
      const j = vocabIndexMap.get(kw.toLowerCase());
      if (j !== undefined) {
        ruleCentroids[ruleId][j] += 1.5;
      }
    }

    // L2 Normalize rule centroid vector
    let sumSq = 0;
    for (let j = 0; j < M; j++) {
      sumSq += ruleCentroids[ruleId][j] * ruleCentroids[ruleId][j];
    }
    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let j = 0; j < M; j++) {
        ruleCentroids[ruleId][j] /= norm;
      }
    }
  }

  // Extract feature coefficients sorted by learned weight
  const featureCoefficients = vocabulary.map((term, j) => ({
    term,
    coefficient: Number(weights[j].toFixed(3)),
  }));

  return {
    vocabulary,
    vocabIndexMap,
    idf,
    weights,
    intercept,
    ruleCentroids,
    featureCoefficients,
    trainSize: N,
    testSize: 0,
    trainedAt: new Date().toISOString(),
  };
}

// ─── 4. Deterministic Stratified Train/Test Split (80/20) & Global Model Artifact ───

const trainItems: LabeledObservation[] = [];
const testItems: LabeledObservation[] = [];

// Stratify per IOGP Life-Saving Rule
for (const ruleDef of IOGP_LIFE_SAVING_RULES) {
  const ruleObs = LABELED_TRAINING_DATASET.filter((d) => d.is_sif && d.rule === ruleDef.id);
  const trainCount = Math.floor(ruleObs.length * 0.8);
  trainItems.push(...ruleObs.slice(0, trainCount));
  testItems.push(...ruleObs.slice(trainCount));
}

// Stratify Non-SIF negative observations
const nonSifObs = LABELED_TRAINING_DATASET.filter((d) => !d.is_sif);
const nonSifTrainCount = Math.floor(nonSifObs.length * 0.8);
trainItems.push(...nonSifObs.slice(0, nonSifTrainCount));
testItems.push(...nonSifObs.slice(nonSifTrainCount));

export const TRAIN_SPLIT = trainItems;
export const TEST_SPLIT = testItems;

// Train global Layer A model artifact strictly on the training partition
export const TRAINED_LAYER_A_MODEL: TrainedModelArtifact = trainLayerAModel(TRAIN_SPLIT);
TRAINED_LAYER_A_MODEL.testSize = TEST_SPLIT.length;
