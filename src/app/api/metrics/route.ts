import { NextResponse } from "next/server";
import { calculateHeldOutMetrics } from "@/lib/model-evaluation";
import { ModelMetrics } from "@/lib/types";

export async function GET() {
  try {
    const rawMetrics = calculateHeldOutMetrics();

    const layerAMetrics: ModelMetrics = {
      model_name: "SIF Sentinel Baseline Classifier (Layer A)",
      layer: "A",
      framework: "Deterministic TF-IDF Vectorizer + L2 Logistic Regression (TypeScript CPU Engine)",
      architecture: "TF-IDF (1-3 N-Grams) + L2 Regularized Logistic Regression (Cross-Entropy Gradient Optimization, <10ms CPU)",
      ...rawMetrics,
    };

    // Layer B is honestly marked as not started pending Layer A gate sign-off per SRS v3 & Build Brief
    const layerBStatus = {
      status: "not_started",
      model_name: "SIF Sentinel Fine-Tuned Transformer (Layer B)",
      layer: "B",
      architecture: "DistilBERT (distilbert-base-uncased) with 9-Class Multi-Head Rule Tagging",
      compute_target: "Camber Cloud GPU / Student Developer Pack",
      message: "Layer B work is paused pending Layer A gate approval. No models or metrics are active.",
    };

    return NextResponse.json({
      success: true,
      layerA: layerAMetrics,
      layerB: layerBStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}
