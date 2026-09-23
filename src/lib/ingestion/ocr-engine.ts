// ─── Tesseract OCR Engine for Scanned Documents & Images ───────────────────

import { createWorker } from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number; // 0 to 100
  linesCount: number;
  wordsCount: number;
}

/**
 * Runs local OCR on an image buffer (PNG, JPEG, WEBP) using tesseract.js.
 */
export async function recognizeImageBuffer(imageBuffer: Buffer): Promise<OcrResult> {
  if (!imageBuffer || imageBuffer.length === 0) {
    return { text: "", confidence: 0, linesCount: 0, wordsCount: 0 };
  }

  let worker: any = null;
  try {
    worker = await createWorker("eng");
    const result = await worker.recognize(imageBuffer);
    const confidence = typeof result.data?.confidence === "number" ? result.data.confidence : 80;
    const text = result.data?.text || "";
    const linesCount = result.data?.lines?.length || text.split("\n").filter((l: string) => l.trim().length > 0).length;
    const wordsCount = result.data?.words?.length || text.split(/\s+/).filter(Boolean).length;

    return {
      text: text.trim(),
      confidence: Math.round(confidence),
      linesCount,
      wordsCount,
    };
  } catch (error: any) {
    console.error("[SIF Sentinel OCR] Error executing Tesseract OCR:", error?.message || error);
    throw new Error(`OCR processing failed: ${error?.message || "unreadable image"}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore cleanup error
      }
    }
  }
}
