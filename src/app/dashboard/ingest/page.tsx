"use client";

import { useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UploadCloud,
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Download,
  Check,
  RefreshCw,
  ArrowRight,
  FileSpreadsheet,
  Cpu,
  File,
  FileCode,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Sliders,
  X,
  Info,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { classifyReportLayerA } from "@/lib/layer-a-classifier";
import { FileIngestionResult, CanonicalSafetyEvent, BatchIngestionCommitResult } from "@/lib/ingestion/types";

const OIL_INDIA_SITES = [
  "Duliajan Rig 7",
  "Moran GGS",
  "Naharkatiya Rig 4",
  "Digboi Tank Farm",
  "Jorajan CTF",
  "Shalmari OCS",
  "Baghjan Wellhead #5",
  "Duliajan Pipeline Corridor",
  "Central Warehouse Duliajan",
  "Central Mechanical Workshop",
  "Duliajan Central Office",
];

const OIL_INDIA_ACTIVITIES = [
  "Drilling Operations",
  "Tripping Pipe",
  "Rig Mast Maintenance",
  "High Pressure Manifold Overhaul",
  "Electrical Maintenance",
  "Flare Header Repair",
  "Tank Desludging",
  "Structural Welding",
  "Casing Operations",
  "Hydrostatic Testing",
  "Crane Lifting Operations",
  "Crude Dispatch",
  "Plant Routine Inspection",
  "Excavation & Trenching",
  "Housekeeping & Facilities",
];

const SAFETY_EVENT_TYPES = [
  "Near-Miss",
  "Observation",
  "Unsafe Act",
  "Unsafe Condition",
  "Incident",
  "Hazard Identification",
  "First Aid",
  "Medical Treatment",
  "Lost Time Incident",
  "Environmental Incident",
  "Property Damage",
  "Other",
];

function formatBadgeColor(format: string) {
  switch (format) {
    case "pdf":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    case "docx":
    case "doc":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "xlsx":
    case "xls":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "csv":
    case "tsv":
      return "bg-teal-500/10 text-teal-400 border-teal-500/30";
    case "txt":
    case "rtf":
      return "bg-slate-500/10 text-slate-300 border-slate-500/30";
    case "image":
      return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    default:
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }
}

function getFormatIcon(format: string) {
  switch (format) {
    case "pdf":
      return <File className="w-4 h-4 text-red-400" />;
    case "docx":
    case "doc":
      return <FileText className="w-4 h-4 text-blue-400" />;
    case "xlsx":
    case "xls":
    case "csv":
    case "tsv":
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    case "image":
      return <ImageIcon className="w-4 h-4 text-purple-400" />;
    default:
      return <FileCode className="w-4 h-4 text-slate-400" />;
  }
}

function IngestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "manual" ? "manual" : "multi_upload";

  const [tab, setTab] = useState<"multi_upload" | "manual">(initialTab);

  // Multi-Format Ingestion State
  const [parsingFiles, setParsingFiles] = useState(false);
  const [fileResults, setFileResults] = useState<FileIngestionResult[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<BatchIngestionCommitResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Column Mapping Override Modal State
  const [mappingFile, setMappingFile] = useState<FileIngestionResult | null>(null);
  const [columnOverrides, setColumnOverrides] = useState<{
    textCol: string;
    siteCol: string;
    actCol: string;
    typeCol: string;
    dateCol: string;
  }>({ textCol: "", siteCol: "", actCol: "", typeCol: "", dateCol: "" });

  // Manual Form State
  const [text, setText] = useState("");
  const [site, setSite] = useState(OIL_INDIA_SITES[0]);
  const [customSite, setCustomSite] = useState("");
  const [activity, setActivity] = useState(OIL_INDIA_ACTIVITIES[0]);
  const [eventType, setEventType] = useState(SAFETY_EVENT_TYPES[0]);
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().split("T")[0]);
  const [role, setRole] = useState("Field HSE Observer");
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time live prediction for manual entry
  const livePrediction = text.trim().length > 10 ? classifyReportLayerA(text) : null;

  // Flattened canonical events across all parsed files
  const allCanonicalEvents: CanonicalSafetyEvent[] = fileResults.flatMap((f) => f.canonical_events);

  // Upload and parse files via API
  const handleFilesChosen = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setCommitResult(null);
    setParsingFiles(true);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/reports/ingest/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse files");
      }

      setFileResults((prev) => [...prev, ...data.results]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload and parse documents");
    } finally {
      setParsingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Load sample fixtures bundled in demo_fixtures/
  const handleLoadDemoFixtures = async () => {
    setUploadError(null);
    setCommitResult(null);
    setParsingFiles(true);

    try {
      const res = await fetch("/api/reports/ingest/fixtures");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load demo fixtures");
      }
      setFileResults(data.results);
    } catch (err: any) {
      setUploadError(err.message || "Failed to load demo fixtures");
    } finally {
      setParsingFiles(false);
    }
  };

  // Commit all canonical safety events into the pipeline
  const handleCommitCanonicalEvents = async () => {
    if (allCanonicalEvents.length === 0) return;
    setCommitting(true);
    setUploadError(null);

    try {
      const res = await fetch("/api/reports/ingest/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: allCanonicalEvents,
          audit: {
            actor_name: "Safety Coordinator",
            actor_role: "safety_officer",
            details: `Committed ${allCanonicalEvents.length} events from multi-format upload.`,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to commit safety reports");
      }

      setCommitResult(data);
      setFileResults([]);
    } catch (err: any) {
      setUploadError(err.message || "Commit failed");
    } finally {
      setCommitting(false);
    }
  };

  // Handle manual submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setSubmittingManual(true);
      setManualSuccess(null);

      const finalSite = site === "Other" ? customSite.trim() || "General Facility" : site;

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: text,
          site: finalSite,
          activity,
          event_type: eventType,
          reported_date: reportedDate,
          submitting_role: role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setManualSuccess(
          `Observation ingested successfully! Classified as ${
            data.classification.is_sif_potential
              ? `SIF Precursor under '${data.classification.life_saving_rule}' (${data.classification.confidence}%)`
              : `Non-SIF (${data.classification.confidence}%)`
          }`
        );
        setText("");
      } else {
        throw new Error(data.error || "Failed to submit observation");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Download Empty Template CSV
  const downloadSampleCsv = () => {
    const templateContent = `observation_description,field_location,work_activity,event_date,event_type\n"High pressure mud hose vibrated violently and safety clamp parted.",Naharkatiya Well Pad 14,Mud Circulation,2026-08-14,Near-Miss\n`;
    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Oil_India_Safety_Observations_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-surface-border pb-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Multi-Format Document Ingestion Engine
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Ingest Oil &amp; Gas safety observations from realistic field documents (PDF, Word, Excel, CSV, TXT, Scanned Images) into the SIF Sentinel analysis pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemoFixtures}
              disabled={parsingFiles}
              className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Loads standard evaluation bundle: PDF, DOCX, XLSX, CSV, TXT, Scanned PNG, and Scanned PDF"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Load Evaluation Fixtures (7 Formats)
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border gap-2 text-sm font-semibold">
        <button
          onClick={() => setTab("multi_upload")}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            tab === "multi_upload"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Multi-Format Document Ingestion
        </button>

        <button
          onClick={() => setTab("manual")}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            tab === "manual"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Manual Observation Entry
        </button>
      </div>

      {/* TAB 1: MULTI-FORMAT DOCUMENT UPLOAD */}
      {tab === "multi_upload" && (
        <div className="space-y-6">
          {/* Format Specification Banner */}
          <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Accepted Safety Document Formats:
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">PDF (.pdf, scanned)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">Word (.docx, .doc)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Excel (.xlsx, .xls)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">CSV / TSV</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-500/10 text-slate-300 border border-slate-500/20">Plain Text (.txt, .rtf)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">Scanned Images (.png, .jpg, .webp)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={downloadSampleCsv}
                className="px-3 py-1.5 bg-surface border border-surface-border hover:bg-surface-hover text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Blank Template
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFilesChosen(e.dataTransfer.files);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragOver
                ? "border-amber-500 bg-amber-500/[0.05]"
                : "border-surface-border hover:border-amber-500/40 bg-surface-card"
            }`}
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt,.rtf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => e.target.files && handleFilesChosen(e.target.files)}
              className="hidden"
              id="multi-file-input"
            />
            <label htmlFor="multi-file-input" className="cursor-pointer block space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                {parsingFiles ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  {parsingFiles ? "Parsing Document Contents & Running OCR..." : "Click to select safety reports"}
                </span>
                <span className="text-slate-400 text-sm"> or drag and drop multiple files here</span>
              </div>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Documents are automatically normalized into canonical safety events with cryptographic SHA-256 fingerprinting and strict evidence provenance.
              </p>
            </label>
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{uploadError}</span>
              <button
                onClick={() => setUploadError(null)}
                className="ml-auto text-red-400 hover:text-white text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Success Summary after Committing */}
          {commitResult && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5" />
                  Multi-Format Batch Ingestion &amp; Classification Complete
                </div>
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  {commitResult.total_files} Files Processed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-surface border border-surface-border">
                  <div className="text-slate-400 text-[11px]">Total Events Ingested</div>
                  <div className="text-xl font-bold text-white font-mono mt-0.5">{commitResult.total_events}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface border border-surface-border">
                  <div className="text-slate-400 text-[11px]">SIF Precursors Flagged</div>
                  <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">{commitResult.sif_count}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface border border-surface-border">
                  <div className="text-slate-400 text-[11px]">Precursor Density</div>
                  <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">
                    {(commitResult.precursor_density * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface border border-surface-border">
                  <div className="text-slate-400 text-[11px]">Active Patterns Detected</div>
                  <div className="text-xl font-bold text-orange-400 font-mono mt-0.5">{commitResult.active_patterns_count}</div>
                </div>
              </div>

              {/* Top Life-Saving Rules mapped */}
              {Object.keys(commitResult.rule_distribution).length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    IOGP Life-Saving Rules Mapped:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(commitResult.rule_distribution).map(([rule, count]) => (
                      <span
                        key={rule}
                        className="px-2.5 py-1 rounded-md text-xs bg-surface border border-surface-border text-amber-300 font-medium flex items-center gap-1.5"
                      >
                        <span>{rule}</span>
                        <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-mono text-[10px]">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  View in Command Center <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => router.push("/dashboard/explorer")}
                  className="inline-flex items-center gap-2 bg-surface hover:bg-surface-hover text-slate-300 hover:text-white border border-surface-border text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Explore Ingested Records <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Processed Files Grid */}
          {fileResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Processed Files ({fileResults.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Extracted {allCanonicalEvents.length} canonical safety observations ready for SIF pipeline commit
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFileResults([])}
                    className="px-3 py-1.5 bg-surface hover:bg-surface-hover border border-surface-border text-slate-400 hover:text-white text-xs rounded-lg transition-colors"
                  >
                    Clear Batch
                  </button>
                  <button
                    onClick={handleCommitCanonicalEvents}
                    disabled={committing || allCanonicalEvents.length === 0}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {committing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Committing to Pipeline...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Commit All {allCanonicalEvents.length} Events
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {fileResults.map((file, idx) => (
                  <div
                    key={file.file_id || idx}
                    className={`p-4 rounded-xl border bg-surface-card transition-all space-y-2.5 ${
                      file.status === "error"
                        ? "border-red-500/40 bg-red-500/[0.02]"
                        : file.status === "warning" || file.is_duplicate
                        ? "border-amber-500/40 bg-amber-500/[0.02]"
                        : "border-surface-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-2 rounded-lg bg-surface border border-surface-border flex-shrink-0">
                          {getFormatIcon(file.format)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate" title={file.filename}>
                            {file.filename}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono border ${formatBadgeColor(file.format)}`}>
                              {file.format}
                            </span>
                            {file.is_scanned && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                OCR {file.ocr_confidence ? `${file.ocr_confidence}%` : ""}
                              </span>
                            )}
                            {file.is_duplicate && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Duplicate
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          file.status === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : file.status === "warning"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : file.status === "error"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        {file.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-1.5 rounded bg-surface border border-surface-border/50 text-slate-400">
                        <span>Records: </span>
                        <span className="text-white font-mono font-bold">{file.canonical_events.length}</span>
                      </div>
                      <div className="p-1.5 rounded bg-surface border border-surface-border/50 text-slate-400">
                        <span>Method: </span>
                        <span className="text-slate-300 font-mono text-[10px]">{file.extraction_method}</span>
                      </div>
                    </div>

                    {file.warnings.length > 0 && (
                      <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{file.warnings[0]}</span>
                      </div>
                    )}

                    {file.errors.length > 0 && (
                      <div className="text-[11px] text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{file.errors[0]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canonical Events Table Preview */}
          {allCanonicalEvents.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Extracted Canonical Safety Observations ({allCanonicalEvents.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Normalized according to SIH26165 schema. Missing fields are strictly preserved as UNKNOWN/null without fabrication.
                  </p>
                </div>

                <button
                  onClick={handleCommitCanonicalEvents}
                  disabled={committing}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
                >
                  {committing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingesting &amp; Classifying...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Ingest &amp; Classify All {allCanonicalEvents.length} Events
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto max-h-96 border border-surface-border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 bg-surface border-b border-surface-border sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">#</th>
                      <th className="py-2.5 px-3 font-semibold">Source &amp; Format</th>
                      <th className="py-2.5 px-3 font-semibold">Observation Narrative</th>
                      <th className="py-2.5 px-3 font-semibold">Facility</th>
                      <th className="py-2.5 px-3 font-semibold">Activity</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Provenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-300">
                    {allCanonicalEvents.map((event, idx) => (
                      <tr key={event.event_id || idx} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono border ${formatBadgeColor(event.source_format)}`}>
                              {event.source_format}
                            </span>
                            <span className="text-slate-300 font-mono text-[11px] truncate max-w-[120px]" title={event.source_filename}>
                              {event.source_filename}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 max-w-sm">
                          <p className="line-clamp-2 text-slate-200" title={event.raw_text}>
                            {event.raw_text}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                          {event.site ? (
                            <span className="text-slate-200">{event.site}</span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">UNKNOWN</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {event.activity ? (
                            <span className="text-slate-300">{event.activity}</span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">UNKNOWN</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-amber-400 font-medium">
                            {event.event_type || "near_miss"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-400">
                          {event.reported_date || <span className="text-slate-500 italic text-[11px]">UNKNOWN</span>}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {event.provenance && event.provenance.length > 0 ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-surface-border text-slate-400 truncate block max-w-[160px]"
                              title={event.provenance[0].source}
                            >
                              {event.provenance[0].source}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[10px]">{event.source_row_or_page || "file"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL OBSERVATION ENTRY */}
      {tab === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form (2 cols) */}
          <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-xl p-6 space-y-5">
            <h3 className="font-bold text-white text-base">New Safety Observation Form</h3>

            {manualSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                {manualSuccess}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              {/* Textarea */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Safety Observation / Near-Miss Free-Text <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Describe the unsafe act, unsafe condition, or near-miss observation in detail (e.g. 'Rigger unhooked safety harness while on crane boom 14m high...')"
                  className="w-full p-3 bg-surface border border-surface-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                />
                <div className="text-[11px] text-slate-500 text-right">
                  {text.length} characters
                </div>
              </div>

              {/* Site & Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Facility / Location</label>
                  <select
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    {OIL_INDIA_SITES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="Other">Other / Custom Location</option>
                  </select>
                </div>

                {site === "Other" && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Custom Facility Name</label>
                    <input
                      type="text"
                      value={customSite}
                      onChange={(e) => setCustomSite(e.target.value)}
                      placeholder="e.g. Moran Well #12"
                      className="w-full p-2.5 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Operational Activity</label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    {OIL_INDIA_ACTIVITIES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Event Type, Date & Submitting Role */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Safety Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    {SAFETY_EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Date of Observation</label>
                  <input
                    type="date"
                    value={reportedDate}
                    onChange={(e) => setReportedDate(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Submitting Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Field HSE Inspector, Rig Hand, Supervisor"
                    className="w-full p-2.5 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingManual || !text.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingManual ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Classifying &amp; Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Ingest &amp; Execute Layer A Classification
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Real-time Layer A Prediction Preview Panel (1 col) */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                Live Model Prediction
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Layer A Active
              </span>
            </div>

            {livePrediction ? (
              <div className="space-y-4 text-xs">
                {/* Decision */}
                <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1">
                  <div className="text-[11px] text-slate-400">Predicted Verdict:</div>
                  <div className="text-sm font-bold">
                    {livePrediction.is_sif_potential ? (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> SIF Precursor
                      </span>
                    ) : (
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-slate-400" /> Non-SIF
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono font-semibold pt-1">
                    Confidence: {livePrediction.confidence}%
                  </div>
                </div>

                {/* Life-Saving Rule */}
                {livePrediction.life_saving_rule && (
                  <div className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/30 space-y-1">
                    <div className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
                      IOGP Life-Saving Rule:
                    </div>
                    <div className="font-bold text-white">
                      {livePrediction.life_saving_rule}
                    </div>
                  </div>
                )}

                {/* Contributing Features */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Contributing Vocabulary Weights:
                  </div>
                  {livePrediction.reasoning_terms.length > 0 ? (
                    <div className="space-y-1.5">
                      {livePrediction.reasoning_terms.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded bg-surface border border-surface-border font-mono text-[11px]"
                        >
                          <span className="text-slate-200">&quot;{item.term}&quot;</span>
                          <span
                            className={`font-bold ${
                              item.positive ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {item.positive ? `+${item.weight}` : `${item.weight}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">No specific risk triggers matched.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-6 text-center bg-surface rounded-xl border border-surface-border leading-relaxed">
                Type an observation in the form to see real-time TF-IDF term activations and SIF confidence scores.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IngestPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading multi-format ingestion interface...
        </div>
      }
    >
      <IngestPageContent />
    </Suspense>
  );
}
