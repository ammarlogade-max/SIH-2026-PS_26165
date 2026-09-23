// ─── PDF Parser & Scanned PDF OCR Engine ──────────────────────────────────

import { FileIngestionResult, FieldProvenance } from "./types";
import { recognizeImageBuffer } from "./ocr-engine";
import { computeDocumentFingerprint } from "./fingerprint";
import { createCanonicalSafetyEvent, extractMetadataFromNarrative } from "./normalizer";
import sharp from "sharp";

interface PageData {
  pageNumber: number;
  text: string;
}

/**
 * Attempts to extract text per page using modern pdfjs-dist.
 */
async function extractTextWithPdfjs(buffer: Buffer): Promise<{ pages: PageData[]; rawPdfDoc?: any }> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pages: PageData[] = [];

  for (let p = 1; p <= pdfDoc.numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({ pageNumber: p, text: pageText });
  }

  return { pages, rawPdfDoc: pdfDoc };
}

/**
 * Fallback to legacy pdf-parse if needed.
 */
async function extractTextWithPdfParse(buffer: Buffer): Promise<{ pages: PageData[]; fullText: string }> {
  const pdf = require("pdf-parse");
  const data = await pdf(buffer);
  const text = (data.text || "").replace(/\s+/g, " ").trim();
  const numPages = data.numpages || 1;
  const pages: PageData[] = [{ pageNumber: 1, text }];
  return { pages, fullText: text };
}

/**
 * Extracts embedded images from a PDF page and OCRs them.
 */
async function ocrImagesFromPdfDoc(pdfDoc: any): Promise<{ text: string; confidence: number; pagesProcessed: number }> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const paintImgOp = (pdfjsLib as any).OPS?.paintImageXObject ?? 85;
  const pageTexts: string[] = [];
  let totalConfidence = 0;
  let ocrCount = 0;

  for (let p = 1; p <= pdfDoc.numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const ops = await page.getOperatorList();
    let pageHasImage = false;

    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === paintImgOp) {
        const imgName = ops.argsArray[i][0];
        try {
          const imgObj: any = await new Promise((resolve) => {
            page.objs.get(imgName, (obj: any) => resolve(obj));
          });

          if (imgObj && imgObj.data && imgObj.width > 20 && imgObj.height > 20) {
            pageHasImage = true;
            const channels = imgObj.data.length === imgObj.width * imgObj.height * 4 ? 4 : (imgObj.data.length === imgObj.width * imgObj.height * 3 ? 3 : 1);
            const pngBuf = await sharp(Buffer.from(imgObj.data), {
              raw: { width: imgObj.width, height: imgObj.height, channels },
            }).png().toBuffer();

            const ocrRes = await recognizeImageBuffer(pngBuf);
            if (ocrRes.text.length > 0) {
              pageTexts.push(`[Page ${p} (OCR)]: ${ocrRes.text}`);
              totalConfidence += ocrRes.confidence;
              ocrCount++;
            }
          }
        } catch (imgErr) {
          console.warn(`[PDF OCR] Error reading image ${imgName} on page ${p}:`, imgErr);
        }
      }
    }
  }

  const avgConfidence = ocrCount > 0 ? Math.round(totalConfidence / ocrCount) : 0;
  return {
    text: pageTexts.join("\n\n"),
    confidence: avgConfidence,
    pagesProcessed: pdfDoc.numPages,
  };
}

/**
 * Parses PDF documents, detecting text vs. scanned layouts.
 */
export async function parsePdfDocument(
  buffer: Buffer,
  filename: string
): Promise<FileIngestionResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const fingerprint = computeDocumentFingerprint(buffer);

  // 1. Password Protection Check
  const sampleStr = buffer.toString("binary", 0, Math.min(buffer.length, 4096));
  if (sampleStr.includes("/Encrypt")) {
    return {
      file_id: `file-${Date.now()}`,
      filename,
      format: "pdf",
      status: "error",
      pages_or_sheets_count: 0,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: "direct_text",
      extraction_confidence: 0,
      is_scanned: false,
      ocr_applied: false,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings,
      errors: ["Password-protected PDF files cannot be processed. Please remove the password and re-upload."],
      fingerprint,
      canonical_events: [],
    };
  }

  let pages: PageData[] = [];
  let pdfDoc: any = null;

  try {
    const res = await extractTextWithPdfjs(buffer);
    pages = res.pages;
    pdfDoc = res.rawPdfDoc;
  } catch (pdfjsErr: any) {
    // Fallback to pdf-parse
    try {
      const fallback = await extractTextWithPdfParse(buffer);
      pages = fallback.pages;
    } catch (parseErr: any) {
      return {
        file_id: `file-${Date.now()}`,
        filename,
        format: "pdf",
        status: "error",
        pages_or_sheets_count: 0,
        rows_or_paragraphs_count: 0,
        extracted_text_length: 0,
        extraction_method: "direct_text",
        extraction_confidence: 0,
        is_scanned: false,
        ocr_applied: false,
        detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
        warnings,
        errors: [`Corrupted or unreadable PDF: ${parseErr?.message || "Invalid PDF syntax"}`],
        fingerprint,
        canonical_events: [],
      };
    }
  }

  // 2. Evaluate if text extraction is sufficient or document is a scanned PDF
  const combinedText = pages.map((p) => p.text).join("\n\n").trim();
  const printableChars = combinedText.replace(/[^a-zA-Z0-9]/g, "").length;
  const isScanned = combinedText.length < 30 || printableChars < 20;

  let finalText = combinedText;
  let ocrApplied = false;
  let ocrConfidence: number | undefined;
  let extractionMethod: "direct_text" | "ocr" = "direct_text";
  let extractionConfidence = 0.95;

  if (isScanned) {
    warnings.push("Scanned or image-based PDF detected with minimal text layer; applying Optical Character Recognition (OCR).");
    if (pdfDoc) {
      try {
        const ocrResult = await ocrImagesFromPdfDoc(pdfDoc);
        if (ocrResult.text.length > 0) {
          finalText = ocrResult.text;
          ocrApplied = true;
          ocrConfidence = ocrResult.confidence;
          extractionMethod = "ocr";
          extractionConfidence = Number((ocrResult.confidence / 100).toFixed(2));
        } else {
          warnings.push("OCR did not detect readable text in the scanned document.");
        }
      } catch (ocrErr: any) {
        warnings.push(`OCR processing warning: ${ocrErr?.message || "could not extract images from PDF"}`);
      }
    }
  }

  if (!finalText || finalText.trim().length === 0) {
    return {
      file_id: `file-${Date.now()}`,
      filename,
      format: "pdf",
      status: "warning",
      pages_or_sheets_count: pages.length,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: extractionMethod,
      extraction_confidence: 0.1,
      is_scanned: isScanned,
      ocr_applied: ocrApplied,
      ocr_confidence: ocrConfidence,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings: [...warnings, "Document contains no readable safety narrative text."],
      errors,
      fingerprint,
      canonical_events: [],
    };
  }

  // 3. Extract Metadata from narrative (never guess missing values!)
  const meta = extractMetadataFromNarrative(finalText);

  // 4. Build Canonical Safety Event
  const provenanceList: FieldProvenance[] = pages.map((p) => ({
    field: "raw_text",
    value: p.text.slice(0, 100),
    source: `page ${p.pageNumber}${ocrApplied ? " (OCR)" : ""}`,
    confidence: extractionConfidence,
  }));

  if (meta.site) {
    provenanceList.push({
      field: "site",
      value: meta.site,
      source: "PDF header/narrative",
      evidence: meta.site,
      confidence: 0.9,
    });
  }

  if (meta.activity) {
    provenanceList.push({
      field: "activity",
      value: meta.activity,
      source: "PDF header/narrative",
      evidence: meta.activity,
      confidence: 0.88,
    });
  }

  if (meta.reported_date) {
    provenanceList.push({
      field: "reported_date",
      value: meta.reported_date,
      source: "PDF header/narrative",
      evidence: meta.reported_date,
      confidence: 0.95,
    });
  }

  const canonicalEvent = createCanonicalSafetyEvent({
    source_filename: filename,
    source_format: "pdf",
    raw_text: finalText,
    reported_date: meta.reported_date,
    site: meta.site,
    facility: meta.facility,
    activity: meta.activity,
    event_type: meta.event_type,
    source_row_or_page: pages.length > 1 ? `pages 1-${pages.length}` : "page 1",
    extraction_method: extractionMethod,
    extraction_confidence: extractionConfidence,
    metadata: {
      total_pages: pages.length,
      is_scanned: isScanned,
      ocr_applied: ocrApplied,
      ocr_confidence: ocrConfidence,
    },
    provenanceList,
  });

  return {
    file_id: `file-${Date.now()}`,
    filename,
    format: "pdf",
    status: isScanned && !ocrApplied ? "warning" : "success",
    pages_or_sheets_count: pages.length,
    rows_or_paragraphs_count: pages.length,
    extracted_text_length: finalText.length,
    extraction_method: extractionMethod,
    extraction_confidence: extractionConfidence,
    is_scanned: isScanned,
    ocr_applied: ocrApplied,
    ocr_confidence: ocrConfidence,
    detected_metadata: meta,
    warnings,
    errors,
    fingerprint,
    canonical_events: [canonicalEvent],
  };
}
