"use client";

import { useState, Suspense } from "react";
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
} from "lucide-react";
import { classifyReportLayerA } from "@/lib/layer-a-classifier";
import { LifeSavingRule } from "@/lib/types";

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

function IngestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "manual" ? "manual" : "bulk";

  const [tab, setTab] = useState<"bulk" | "manual">(initialTab);

  // Manual Form State
  const [text, setText] = useState("");
  const [site, setSite] = useState(OIL_INDIA_SITES[0]);
  const [customSite, setCustomSite] = useState("");
  const [activity, setActivity] = useState(OIL_INDIA_ACTIVITIES[0]);
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().split("T")[0]);
  const [role, setRole] = useState("Field HSE Observer");
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Bulk Upload State
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Real-time live prediction for manual entry
  const livePrediction = text.trim().length > 10 ? classifyReportLayerA(text) : null;

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

  // Parse CSV function
  const parseCsvContent = (content: string) => {
    setParseError(null);
    setBulkResult(null);

    try {
      const lines = content.trim().split("\n");
      if (lines.length < 2) {
        setParseError("CSV must contain at least a header row and one data row.");
        return;
      }

      // Simple robust CSV line parser handling quotes
      const parseLine = (line: string) => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map((col) => col.replace(/^"(.*)"$/, "$1").replace(/""/g, '"'));
      };

      const header = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
      const textIdx = header.findIndex((h) => h.includes("text") || h.includes("obs") || h.includes("report"));
      const siteIdx = header.findIndex((h) => h.includes("site") || h.includes("location") || h.includes("facility"));
      const actIdx = header.findIndex((h) => h.includes("activity") || h.includes("job"));
      const dateIdx = header.findIndex((h) => h.includes("date"));
      const roleIdx = header.findIndex((h) => h.includes("role") || h.includes("observer") || h.includes("submit"));

      if (textIdx === -1) {
        setParseError("Could not find an observation text column (expected 'raw_text', 'text', or 'observation').");
        return;
      }

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseLine(line);
        const raw_text = cols[textIdx];
        if (!raw_text || raw_text.length < 5) continue;

        rows.push({
          raw_text,
          site: siteIdx !== -1 && cols[siteIdx] ? cols[siteIdx] : "General Facility",
          activity: actIdx !== -1 && cols[actIdx] ? cols[actIdx] : "General Operations",
          reported_date: dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : new Date().toISOString().split("T")[0],
          submitting_role: roleIdx !== -1 && cols[roleIdx] ? cols[roleIdx] : "Field Staff",
        });
      }

      if (rows.length === 0) {
        setParseError("No valid rows could be parsed from the CSV file.");
      } else {
        setParsedRows(rows);
      }
    } catch (err: any) {
      setParseError(`CSV Parsing Error: ${err.message}`);
    }
  };

  // Handle File Drop / Select
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || "");
      setCsvText(content);
      parseCsvContent(content);
    };
    reader.readAsText(file);
  };

  // Download Empty Template CSV
  const downloadSampleCsv = () => {
    const templateContent = `raw_text,site,activity,reported_date,submitting_role\n`;
    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Oil_India_Safety_Observations_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit bulk batch
  const handleBulkSubmit = async () => {
    if (parsedRows.length === 0) return;

    try {
      setSubmittingBulk(true);
      setBulkResult(null);

      const res = await fetch("/api/reports/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports: parsedRows }),
      });

      const data = await res.json();
      if (data.success) {
        setBulkResult(data.batchSummary);
        setParsedRows([]);
        setCsvText("");
      } else {
        throw new Error(data.error || "Failed to process bulk upload");
      }
    } catch (err: any) {
      alert(`Bulk Ingestion Error: ${err.message}`);
    } finally {
      setSubmittingBulk(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-surface-border pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          Ingest Safety Observations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Submit individual safety reports or batch upload historical Oil India CSV data for instant Layer A classification.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border gap-2 text-sm font-semibold">
        <button
          onClick={() => setTab("bulk")}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            tab === "bulk"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Bulk CSV Import
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

      {/* TAB 1: BULK CSV UPLOAD */}
      {tab === "bulk" && (
        <div className="space-y-6">
          {/* Quick Start Card with Sample Data CTA */}
          <div className="p-5 rounded-xl bg-amber-500/[0.04] border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Standard Oil India CSV Upload Specification
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                Supports CSV/Excel with columns for <code className="bg-surface px-1 py-0.5 rounded text-amber-300 font-mono">raw_text</code>, <code className="bg-surface px-1 py-0.5 rounded text-amber-300 font-mono">site</code>, <code className="bg-surface px-1 py-0.5 rounded text-amber-300 font-mono">activity</code>, and <code className="bg-surface px-1 py-0.5 rounded text-amber-300 font-mono">reported_date</code>.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={downloadSampleCsv}
                className="px-3.5 py-2 bg-surface border border-surface-border hover:bg-surface-hover text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Download blank CSV template file"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV Template
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-surface-border hover:border-amber-500/50 rounded-2xl p-8 bg-surface-card text-center transition-colors">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer block space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Click to choose a CSV file</span>
                <span className="text-slate-400 text-sm"> or drag and drop here</span>
              </div>
              <p className="text-xs text-slate-500">Supports standard UTF-8 encoded comma-separated safety logs</p>
            </label>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              {parseError}
            </div>
          )}

          {/* Bulk Ingestion Success Summary */}
          {bulkResult && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <CheckCircle2 className="w-5 h-5" />
                Batch Ingestion Complete & Classified
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface border border-surface-border">
                  <div className="text-slate-400">Total Ingested</div>
                  <div className="text-xl font-bold text-white font-mono mt-0.5">{bulkResult.totalIngested}</div>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-surface-border">
                  <div className="text-slate-400">SIF Precursors Flagged</div>
                  <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">{bulkResult.sifCount}</div>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-surface-border">
                  <div className="text-slate-400">Precursor Density</div>
                  <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">{bulkResult.precursorDensity}%</div>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-surface-border">
                  <div className="text-slate-400">Active Patterns</div>
                  <div className="text-xl font-bold text-orange-400 font-mono mt-0.5">{bulkResult.activePatternsDetected}</div>
                </div>
              </div>

              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                View Updated Command Center <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Parsed Preview Table & Submission */}
          {parsedRows.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Parsed Observations Ready for Ingestion ({parsedRows.length} rows)</h3>
                  <p className="text-xs text-slate-400">Review rows before executing Layer A ML classification</p>
                </div>

                <button
                  onClick={handleBulkSubmit}
                  disabled={submittingBulk}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingBulk ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Classifying & Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Ingest & Classify All {parsedRows.length} Reports
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto max-h-80 border border-surface-border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 bg-surface border-b border-surface-border sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">#</th>
                      <th className="py-2.5 px-3 font-semibold">Observation Text</th>
                      <th className="py-2.5 px-3 font-semibold">Facility</th>
                      <th className="py-2.5 px-3 font-semibold">Activity</th>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-300">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/50">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 max-w-md line-clamp-1">{row.raw_text}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-200">{row.site}</td>
                        <td className="py-2.5 px-3 text-slate-400">{row.activity}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{row.reported_date}</td>
                        <td className="py-2.5 px-3 text-slate-500">{row.submitting_role}</td>
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

              {/* Date & Submitting Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Date of Observation</label>
                  <input
                    type="date"
                    value={reportedDate}
                    onChange={(e) => setReportedDate(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                  </input>
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
                    <RefreshCw className="w-4 h-4 animate-spin" /> Classifying & Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Ingest & Execute Layer A Classification
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
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading ingestion interface...
        </div>
      }
    >
      <IngestPageContent />
    </Suspense>
  );
}
