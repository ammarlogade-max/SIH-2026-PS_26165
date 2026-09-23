// ─── POST /api/reports/ingest/parse ─────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { parseUploadedDocument } from "@/lib/ingestion/ingestion-pipeline";
import { FileIngestionResult } from "@/lib/ingestion/types";
import { getSafetySnapshot } from "@/lib/safety-store";

export async function POST(req: NextRequest) {
  try {
    const snapshot = await getSafetySnapshot();
    const existingFingerprints = new Set<string>();
    const existingNarratives: string[] = [];

    for (const r of snapshot.reports) {
      existingNarratives.push(r.raw_text);
      if ((r as any).canonical_event?.fingerprint) {
        existingFingerprints.add((r as any).canonical_event.fingerprint);
      }
    }

    const contentType = req.headers.get("content-type") || "";
    const results: FileIngestionResult[] = [];

    // 1. Multipart Form Data (File uploads from browser or API)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("files") as (File | Blob)[];

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: "No files uploaded. Please attach at least one safety report." },
          { status: 400 }
        );
      }

      for (const item of files) {
        const fileObj = item as File;
        const filename = fileObj.name || "uploaded_report";
        const arrayBuffer = await fileObj.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await parseUploadedDocument(buffer, filename, {
          existingFingerprints,
          existingNarratives,
        });

        // Add to batch fingerprint set so duplicates within the same batch are detected
        existingFingerprints.add(result.fingerprint);
        results.push(result);
      }
    }
    // 2. JSON Payload (Base64 file or raw text array)
    else if (contentType.includes("application/json")) {
      const body = await req.json();
      const files = Array.isArray(body.files) ? body.files : [body];

      for (const item of files) {
        const filename = item.filename || "safety_report.txt";
        let buffer: Buffer;

        if (item.content_base64) {
          buffer = Buffer.from(item.content_base64, "base64");
        } else if (item.text) {
          buffer = Buffer.from(item.text, "utf-8");
        } else {
          continue;
        }

        const result = await parseUploadedDocument(buffer, filename, {
          forcedSheetName: item.sheet_name,
          overrideColumnMapping: item.override_columns,
          existingFingerprints,
          existingNarratives,
        });

        existingFingerprints.add(result.fingerprint);
        results.push(result);
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type. Use multipart/form-data or application/json." },
        { status: 415 }
      );
    }

    return NextResponse.json({
      success: true,
      total_files: results.length,
      results,
    });
  } catch (err: any) {
    console.error("[API Ingest Parse] Error:", err);
    return NextResponse.json(
      { error: "Document parsing failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
