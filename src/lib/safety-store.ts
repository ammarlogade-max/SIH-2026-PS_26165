import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { Classification, Report, CorrectiveAction, AuditLogEntry, UserRole, LifeSavingRule, HumanReviewRecord } from "@/lib/types";
import { isSupabasePersistenceConfigured, supabaseAdmin } from "@/lib/supabase";
import { buildBenchmarkDataset } from "@/lib/benchmark-seeder";
import {
  analyzeEnergyWheel,
  evaluateBarrierStatus,
  evaluateCampbellGates,
  detectShiftAndCircadianRisk,
} from "@/lib/safety-science-engine";
import { v4 as uuidv4 } from "uuid";

export type SafetyStorageKind = "supabase" | "local-file";

export type SafetyStorageInfo = {
  kind: SafetyStorageKind;
  persistent: boolean;
  deploymentSafe: boolean;
  label: string;
};

export type SafetySnapshot = {
  reports: Report[];
  classifications: Classification[];
  actions: CorrectiveAction[];
  auditLogs: AuditLogEntry[];
  storage: SafetyStorageInfo;
};

type LocalStoreDocument = {
  version: 1;
  updated_at: string;
  reports: Report[];
  classifications: Classification[];
  actions: CorrectiveAction[];
  auditLogs: AuditLogEntry[];
};

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export function computeAuditHash(
  sequence_number: number,
  previous_hash: string,
  timestamp: string,
  actor_name: string,
  action: string,
  entity_id: string,
  details: string
): string {
  return createHash("sha256")
    .update(`${previous_hash}|${sequence_number}|${timestamp}|${actor_name}|${action}|${entity_id}|${details}`)
    .digest("hex");
}

export function createChainedEntry(
  currentAuditLogs: AuditLogEntry[],
  entryData: {
    actor_name: string;
    actor_role: UserRole;
    action: string;
    entity_type: AuditLogEntry["entity_type"];
    entity_id: string;
    details: string;
    status: "success" | "warning" | "error";
  }
): AuditLogEntry {
  // Find highest sequence number
  const maxSeq = currentAuditLogs.reduce((max, e) => Math.max(max, e.sequence_number || 0), 0);
  const nextSeq = maxSeq + 1;
  // The immediate predecessor in sequence is the one with sequence_number == maxSeq
  const prevEntry = currentAuditLogs.find((e) => e.sequence_number === maxSeq);
  const prevHash = prevEntry?.current_hash || GENESIS_HASH;
  const timestamp = new Date().toISOString();
  const currentHash = computeAuditHash(
    nextSeq,
    prevHash,
    timestamp,
    entryData.actor_name,
    entryData.action,
    entryData.entity_id,
    entryData.details
  );

  return {
    id: `aud-${uuidv4().slice(0, 8)}`,
    sequence_number: nextSeq,
    previous_hash: prevHash,
    current_hash: currentHash,
    timestamp,
    ...entryData,
  };
}

export function verifyAuditChainIntegrity(logs: AuditLogEntry[]): {
  valid: boolean;
  total_entries: number;
  tampered_count: number;
} {
  if (!logs || logs.length === 0) {
    return { valid: true, total_entries: 0, tampered_count: 0 };
  }

  // Sort by sequence_number ascending (1, 2, 3...)
  const sorted = [...logs].sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
  let tamperedCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const expectedPrevHash = i === 0 ? GENESIS_HASH : sorted[i - 1].current_hash;

    const prevHashMatches = entry.previous_hash === expectedPrevHash;
    const computedHash = computeAuditHash(
      entry.sequence_number || 0,
      entry.previous_hash || "",
      entry.timestamp,
      entry.actor_name,
      entry.action,
      entry.entity_id,
      entry.details
    );
    const currentHashMatches = entry.current_hash === computedHash;

    if (!prevHashMatches || !currentHashMatches) {
      tamperedCount++;
    }
  }

  return {
    valid: tamperedCount === 0,
    total_entries: sorted.length,
    tampered_count: tamperedCount,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var sifLocalStoreCache: LocalStoreDocument | undefined;
  // eslint-disable-next-line no-var
  var sifLocalStoreLoad: Promise<LocalStoreDocument> | undefined;
  // eslint-disable-next-line no-var
  var sifLocalStoreWriteQueue: Promise<void> | undefined;
}

function getLocalStorePath(): string {
  // In Vercel and AWS Lambda, the root project directory (/var/task) is read-only.
  // os.tmpdir() (/tmp) is the only writable directory in serverless functions.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION) {
    return path.join(os.tmpdir(), "sif-sentinel.json");
  }
  return path.join(process.cwd(), ".data", "sif-sentinel.json");
}

function localStorageInfo(): SafetyStorageInfo {
  return {
    kind: "local-file",
    persistent: !process.env.VERCEL,
    deploymentSafe: false,
    label: process.env.VERCEL
      ? "Ephemeral serverless store (/tmp)"
      : "Persisted local workspace (development)",
  };
}

function supabaseStorageInfo(): SafetyStorageInfo {
  return {
    kind: "supabase",
    persistent: true,
    deploymentSafe: true,
    label: "Supabase workspace",
  };
}

function emptyLocalDocument(): LocalStoreDocument {
  const benchmark = buildBenchmarkDataset();
  return {
    version: 1,
    updated_at: new Date().toISOString(),
    reports: benchmark.reports,
    classifications: benchmark.classifications,
    actions: benchmark.actions,
    auditLogs: benchmark.auditLogs,
  };
}

function isLocalDocument(value: unknown): value is LocalStoreDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<LocalStoreDocument>;
  return (
    document.version === 1 &&
    Array.isArray(document.reports) &&
    Array.isArray(document.classifications)
  );
}

async function loadLocalDocument(): Promise<LocalStoreDocument> {
  if (globalThis.sifLocalStoreCache) return globalThis.sifLocalStoreCache;
  if (globalThis.sifLocalStoreLoad) return globalThis.sifLocalStoreLoad;

  globalThis.sifLocalStoreLoad = (async () => {
    try {
      const storePath = getLocalStorePath();
      const raw = await readFile(storePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!isLocalDocument(parsed)) {
        throw new Error("The local safety data file has an unsupported format.");
      }
      // Ensure actions and auditLogs arrays exist if migrating an older file
      if (!Array.isArray(parsed.actions)) {
        parsed.actions = buildBenchmarkDataset().actions;
      }
      if (!Array.isArray(parsed.auditLogs)) {
        parsed.auditLogs = buildBenchmarkDataset().auditLogs;
      }
      globalThis.sifLocalStoreCache = parsed;
      return parsed;
    } catch {
      // If the file does not exist, cannot be read, or directory is read-only:
      // initialize in-memory store with the comprehensive benchmark safety dataset.
      const document = emptyLocalDocument();
      globalThis.sifLocalStoreCache = document;
      // Best-effort write to disk (/tmp in Vercel, .data locally)
      await writeLocalDocument(document);
      return document;
    } finally {
      globalThis.sifLocalStoreLoad = undefined;
    }
  })();

  return globalThis.sifLocalStoreLoad;
}

async function writeLocalDocument(document: LocalStoreDocument) {
  // Always update in-memory cache first so operations continue uninterrupted
  globalThis.sifLocalStoreCache = document;

  try {
    const storePath = getLocalStorePath();
    await mkdir(path.dirname(storePath), { recursive: true });
    const temporaryPath = `${storePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(document, null, 2), "utf8");
    await rename(temporaryPath, storePath);
  } catch (error) {
    // If the filesystem is read-only (e.g. Vercel serverless /var/task), catch the error
    // gracefully. The in-memory cache remains active and serves all queries and calculations.
    console.warn("Safety store disk write bypassed; running in-memory:", error);
  }
}

function enrichRecordsWithSafetyScience(
  reports: Report[],
  classifications: Classification[]
): { reports: Report[]; classifications: Classification[] } {
  const reportMap = new Map(reports.map((r) => [r.id, r]));

  const enrichedReports = reports.map((r) => {
    if (!r.shift_timing || !r.circadian_risk_tier) {
      const shift = detectShiftAndCircadianRisk(r.reported_date || r.created_at);
      return {
        ...r,
        shift_timing: r.shift_timing || shift.shift_timing,
        circadian_risk_tier: r.circadian_risk_tier || shift.circadian_risk_tier,
      };
    }
    return r;
  });

  const enrichedClassifications = classifications.map((cls) => {
    const parentReport = reportMap.get(cls.report_id);
    const text = parentReport?.raw_text || "";

    let energyCategory = cls.energy_category;
    let energyMagnitude = cls.energy_magnitude;
    let energySourceDetails = cls.energy_source_details;
    let barrierAssessment = cls.barrier_assessment;
    let campbellGates = cls.campbell_gates;
    let shiftMultiplier = cls.shift_risk_multiplier;

    if (!energyCategory || !energyMagnitude) {
      const e = analyzeEnergyWheel(text, cls.life_saving_rule);
      energyCategory = e.category;
      energyMagnitude = e.magnitude;
      energySourceDetails = e.sourceDetails;
    }

    if (!barrierAssessment) {
      barrierAssessment = evaluateBarrierStatus(text, cls.life_saving_rule);
    }

    if (!campbellGates) {
      campbellGates = evaluateCampbellGates(
        text,
        energyCategory,
        energyMagnitude,
        barrierAssessment
      );
    }

    if (!shiftMultiplier && parentReport) {
      const s = detectShiftAndCircadianRisk(parentReport.reported_date || parentReport.created_at);
      shiftMultiplier = s.risk_multiplier;
    }

    return {
      ...cls,
      energy_category: energyCategory,
      energy_magnitude: energyMagnitude,
      energy_source_details: energySourceDetails,
      barrier_assessment: barrierAssessment,
      campbell_gates: campbellGates,
      shift_risk_multiplier: shiftMultiplier || 1.0,
    };
  });

  return { reports: enrichedReports, classifications: enrichedClassifications };
}

function cloneSnapshot(document: LocalStoreDocument): SafetySnapshot {
  const enriched = enrichRecordsWithSafetyScience(document.reports, document.classifications);
  return {
    reports: [...enriched.reports],
    classifications: [...enriched.classifications],
    actions: [...(document.actions || [])],
    auditLogs: [...(document.auditLogs || [])],
    storage: localStorageInfo(),
  };
}

function asStoreError(operation: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : "Unknown storage error";
  return new Error(`Safety data ${operation} failed: ${message}`);
}

let supabaseOperational: boolean | null = null;

async function loadSupabaseSnapshot(): Promise<SafetySnapshot> {
  if (supabaseOperational === false) {
    return cloneSnapshot(await loadLocalDocument());
  }

  try {
    const [reportsResult, classificationsResult] = await Promise.all([
      supabaseAdmin.from("sif_reports").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("sif_classifications").select("*").order("created_at", { ascending: false }),
    ]);

    if (reportsResult.error || classificationsResult.error) {
      supabaseOperational = false;
      return cloneSnapshot(await loadLocalDocument());
    }

    supabaseOperational = true;
    const localDoc = await loadLocalDocument();
    const rawReports = (reportsResult.data || []) as Report[];
    const rawClassifications = (classificationsResult.data || []) as Classification[];

    // If Supabase returned empty tables, fall back to local benchmark store
    if (rawReports.length === 0) {
      return cloneSnapshot(localDoc);
    }

    const enriched = enrichRecordsWithSafetyScience(rawReports, rawClassifications);

    return {
      reports: enriched.reports,
      classifications: enriched.classifications,
      actions: localDoc.actions || [],
      auditLogs: localDoc.auditLogs || [],
      storage: supabaseStorageInfo(),
    };
  } catch {
    supabaseOperational = false;
    return cloneSnapshot(await loadLocalDocument());
  }
}

export function getSafetyStorageInfo(): SafetyStorageInfo {
  return isSupabasePersistenceConfigured && supabaseOperational !== false
    ? supabaseStorageInfo()
    : localStorageInfo();
}

export async function getSafetySnapshot(): Promise<SafetySnapshot> {
  if (isSupabasePersistenceConfigured) {
    try {
      return await loadSupabaseSnapshot();
    } catch {
      return cloneSnapshot(await loadLocalDocument());
    }
  }
  return cloneSnapshot(await loadLocalDocument());
}

export async function appendSafetyRecords(
  reports: Report[],
  classifications: Classification[],
  auditEvent?: { actor_name: string; actor_role: UserRole; details: string }
): Promise<SafetySnapshot> {
  if (!reports.length) return getSafetySnapshot();

  if (isSupabasePersistenceConfigured && supabaseOperational !== false) {
    try {
      const reportsInsert = await supabaseAdmin.from("sif_reports").insert(reports);
      if (!reportsInsert.error) {
        await supabaseAdmin.from("sif_classifications").insert(classifications);
      } else {
        supabaseOperational = false;
      }
    } catch {
      supabaseOperational = false;
    }
  }

  let result: SafetySnapshot | undefined;
  const pendingWrite = (globalThis.sifLocalStoreWriteQueue || Promise.resolve()).then(async () => {
    const current = await loadLocalDocument();
    
    // Check each newly ingested report for recurrence against closed/verified CAPAs
    const updatedActions = [...(current.actions || [])];
    const newAuditLogs: AuditLogEntry[] = [...(current.auditLogs || [])];

    for (const rep of reports) {
      const cls = classifications.find((c) => c.report_id === rep.id);
      if (cls?.is_sif_potential && cls.life_saving_rule) {
        const repTime = new Date(rep.reported_date || rep.created_at).getTime();

        const matchingActionIdx = updatedActions.findIndex((a) => {
          if (a.site !== rep.site) return false;
          if (a.life_saving_rule !== cls.life_saving_rule) return false;
          if (a.report_id === rep.id) return false;
          if (a.status !== "completed" && a.status !== "verified") return false;

          const closureTime = new Date(a.completed_at || a.verified_at || a.created_at).getTime();
          return !isNaN(repTime) && !isNaN(closureTime) && repTime >= closureTime;
        });

        if (matchingActionIdx !== -1) {
          const existingAct = updatedActions[matchingActionIdx];
          updatedActions[matchingActionIdx] = {
            ...existingAct,
            recurrence_detected: true,
            recurrence_detected_at: new Date().toISOString(),
            recurrence_report_id: rep.id,
            effectiveness_status: "recurred_post_closure",
            post_closure_event_count: (existingAct.post_closure_event_count || 0) + 1,
          };

          const recurrenceAudit = createChainedEntry(newAuditLogs, {
            actor_name: "Post-Closure Surveillance Engine",
            actor_role: "Admin",
            action: "CAPA_RECURRENCE_DETECTED",
            entity_type: "action",
            entity_id: existingAct.id,
            details: `Post-closure recurrence detected for CAPA '${existingAct.title}' at ${rep.site}: observation ${rep.id} recurred under ${cls.life_saving_rule}. Action flagged for immediate supervisor re-investigation.`,
            status: "warning",
          });
          newAuditLogs.unshift(recurrenceAudit);
        }
      }
    }

    if (auditEvent) {
      const ingestionAudit = createChainedEntry(newAuditLogs, {
        actor_name: auditEvent.actor_name,
        actor_role: auditEvent.actor_role,
        action: "OBSERVATION_INGESTED",
        entity_type: "observation",
        entity_id: reports[0]?.id || "batch",
        details: auditEvent.details,
        status: "success",
      });
      newAuditLogs.unshift(ingestionAudit);
    }

    const next: LocalStoreDocument = {
      version: 1,
      updated_at: new Date().toISOString(),
      reports: [...reports, ...current.reports],
      classifications: [...classifications, ...current.classifications],
      actions: updatedActions,
      auditLogs: newAuditLogs,
    };
    await writeLocalDocument(next);
    result = cloneSnapshot(next);
  });

  globalThis.sifLocalStoreWriteQueue = pendingWrite.catch(() => undefined);
  await pendingWrite;
  return result!;
}

export async function saveCorrectiveAction(
  action: CorrectiveAction,
  actor: { name: string; role: UserRole }
): Promise<CorrectiveAction> {
  const current = await loadLocalDocument();
  const currentAuditLogs = current.auditLogs || [];

  const auditEntry = createChainedEntry(currentAuditLogs, {
    actor_name: actor.name,
    actor_role: actor.role,
    action: "CAPA_CREATED",
    entity_type: "action",
    entity_id: action.id,
    details: `Created CAPA '${action.title}' for ${action.site} (${action.life_saving_rule}, Priority: ${action.priority}). Assigned to ${action.assigned_to}.`,
    status: "success",
  });

  const nextActions = [action, ...(current.actions || [])];

  const next: LocalStoreDocument = {
    ...current,
    updated_at: new Date().toISOString(),
    actions: nextActions,
    auditLogs: [auditEntry, ...currentAuditLogs],
  };

  await writeLocalDocument(next);
  return action;
}

export async function updateCorrectiveAction(
  id: string,
  updates: Partial<CorrectiveAction>,
  actor: { name: string; role: UserRole }
): Promise<CorrectiveAction> {
  const current = await loadLocalDocument();
  const actions = current.actions || [];
  const index = actions.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error(`Corrective Action with ID '${id}' not found.`);
  }

  const existing = actions[index];
  const updated: CorrectiveAction = {
    ...existing,
    ...updates,
  };

  if (updates.status === "completed" && !updated.completed_at) {
    updated.completed_at = new Date().toISOString();
    updated.post_closure_monitoring_active = true;
    if (!updated.effectiveness_status || updated.effectiveness_status === "pending_verification") {
      updated.effectiveness_status = "monitoring";
    }
  }
  if (updates.status === "verified") {
    if (!updated.verified_at) updated.verified_at = new Date().toISOString();
    if (!updated.verified_by) updated.verified_by = `${actor.name} (${actor.role})`;
    updated.post_closure_monitoring_active = true;
    if (updates.effectiveness_status) {
      updated.effectiveness_status = updates.effectiveness_status;
    } else if (!updated.effectiveness_status || updated.effectiveness_status === "pending_verification") {
      updated.effectiveness_status = "monitoring";
    }
  }

  actions[index] = updated;

  const currentAuditLogs = current.auditLogs || [];
  const auditEntry = createChainedEntry(currentAuditLogs, {
    actor_name: actor.name,
    actor_role: actor.role,
    action: updates.status === "verified" ? "CAPA_VERIFIED" : updates.status === "completed" ? "CAPA_COMPLETED" : "CAPA_UPDATED",
    entity_type: "action",
    entity_id: id,
    details: `Updated action '${updated.title}' to status '${updated.status}'. ${updates.evidence_notes ? `Notes: ${updates.evidence_notes}` : ""}`,
    status: "success",
  });

  const next: LocalStoreDocument = {
    ...current,
    updated_at: new Date().toISOString(),
    actions: [...actions],
    auditLogs: [auditEntry, ...currentAuditLogs],
  };

  await writeLocalDocument(next);
  return updated;
}

/**
 * Human-in-the-loop review/override of an AI classification.
 * Preserves the original ML assessment for complete audit defensibility.
 */
export async function saveClassificationReview(
  reportId: string,
  reviewData: {
    is_sif_potential: boolean;
    life_saving_rule: LifeSavingRule | null;
    override_reason: string;
    review_notes?: string;
  },
  actor: { name: string; role: UserRole }
): Promise<Classification> {
  const current = await loadLocalDocument();
  const clsIndex = current.classifications.findIndex((c) => c.report_id === reportId);
  if (clsIndex === -1) {
    throw new Error(`Classification for report '${reportId}' not found.`);
  }

  const existingCls = current.classifications[clsIndex];
  const nextVersion = (existingCls.review_version || 0) + 1;
  const originalPrediction = existingCls.original_sif_prediction || (existingCls.is_sif_potential ? "SIF_POTENTIAL" : "NON_SIF_POTENTIAL");
  const originalIsSif = existingCls.original_is_sif !== undefined ? existingCls.original_is_sif : existingCls.is_sif_potential;
  const originalRule = existingCls.original_rule !== undefined ? existingCls.original_rule : existingCls.life_saving_rule;

  const reviewRecord: HumanReviewRecord = {
    id: `hr-${uuidv4().slice(0, 8)}`,
    report_id: reportId,
    classification_id: existingCls.id,
    review_version: nextVersion,
    reviewer_name: actor.name,
    reviewer_role: actor.role,
    original_prediction: originalPrediction,
    reviewed_prediction: reviewData.is_sif_potential ? "SIF_POTENTIAL" : "NON_SIF_POTENTIAL",
    original_rule: originalRule,
    reviewed_rule: reviewData.life_saving_rule,
    original_is_sif: originalIsSif,
    reviewed_is_sif: reviewData.is_sif_potential,
    rationale: reviewData.override_reason,
    review_notes: reviewData.review_notes,
    override_flag:
      reviewData.is_sif_potential !== originalIsSif ||
      reviewData.life_saving_rule !== originalRule ||
      Boolean(reviewData.override_reason && reviewData.override_reason.trim().length > 0),
    review_timestamp: new Date().toISOString(),
    status:
      reviewData.is_sif_potential !== originalIsSif ||
      reviewData.life_saving_rule !== originalRule ||
      Boolean(reviewData.override_reason && reviewData.override_reason.trim().length > 0)
        ? "OVERRIDDEN"
        : "ACCEPTED",
    created_at: new Date().toISOString(),
  };

  const updatedCls: Classification = {
    ...existingCls,
    is_sif_potential: reviewData.is_sif_potential,
    life_saving_rule: reviewData.life_saving_rule,
    sif_prediction: reviewData.is_sif_potential ? "SIF_POTENTIAL" : "NON_SIF_POTENTIAL",
    human_reviewed: true,
    reviewed_by: `${actor.name} (${actor.role})`,
    reviewed_at: new Date().toISOString(),
    review_notes: reviewData.review_notes || reviewData.override_reason,
    override_reason: reviewData.override_reason,
    review_version: nextVersion,
    review_history: [...(existingCls.review_history || []), reviewRecord],
    original_sif_prediction: originalPrediction,
    original_is_sif: originalIsSif,
    original_rule: originalRule,
    reasoning_narrative: `[HSE REVIEW OVERRIDE v${nextVersion} by ${actor.name}]: ${reviewData.override_reason}. Original AI model reasoning preserved: ${existingCls.reasoning_narrative}`,
  };

  current.classifications[clsIndex] = updatedCls;

  const currentAuditLogs = current.auditLogs || [];
  const auditEntry = createChainedEntry(currentAuditLogs, {
    actor_name: actor.name,
    actor_role: actor.role,
    action: "CLASSIFICATION_REVIEW_OVERRIDE",
    entity_type: "classification",
    entity_id: existingCls.id,
    details: `HSE Review override v${nextVersion} on observation ${reportId}: SIF potential set to ${reviewData.is_sif_potential ? "YES" : "NO"} (${reviewData.life_saving_rule || "None"}). Reason: ${reviewData.override_reason}`,
    status: "warning",
  });

  const next: LocalStoreDocument = {
    ...current,
    updated_at: new Date().toISOString(),
    classifications: [...current.classifications],
    auditLogs: [auditEntry, ...currentAuditLogs],
  };

  await writeLocalDocument(next);
  return updatedCls;
}

export async function logAuditEvent(
  entry: Omit<AuditLogEntry, "id" | "timestamp" | "sequence_number" | "previous_hash" | "current_hash">
): Promise<AuditLogEntry> {
  const current = await loadLocalDocument();
  const currentAuditLogs = current.auditLogs || [];
  const newEntry = createChainedEntry(currentAuditLogs, entry);

  const next: LocalStoreDocument = {
    ...current,
    updated_at: new Date().toISOString(),
    auditLogs: [newEntry, ...currentAuditLogs],
  };

  await writeLocalDocument(next);
  return newEntry;
}

/**
 * Validates the cryptographic SHA-256 chain integrity across all audit ledger records.
 */
export async function verifyAuditLedger(): Promise<{
  valid: boolean;
  totalEntries: number;
  tamperedEntryId?: string;
  details: string;
}> {
  const current = await loadLocalDocument();
  const logs = current.auditLogs || [];
  if (logs.length === 0) {
    return {
      valid: true,
      totalEntries: 0,
      details: "Audit ledger is empty. Chain is clean.",
    };
  }

  // Sort ascending by sequence number
  const sorted = [...logs].sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));

  let expectedPrevHash = GENESIS_HASH;
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const expectedSeq = i + 1;

    if (entry.sequence_number !== expectedSeq) {
      return {
        valid: false,
        totalEntries: sorted.length,
        tamperedEntryId: entry.id,
        details: `Sequence break detected at block ${entry.id}: expected sequence #${expectedSeq}, got #${entry.sequence_number}.`,
      };
    }

    if (entry.previous_hash !== expectedPrevHash) {
      return {
        valid: false,
        totalEntries: sorted.length,
        tamperedEntryId: entry.id,
        details: `Broken cryptographic link at block ${entry.id}: previous_hash does not match parent current_hash.`,
      };
    }

    // Recompute hash
    const recomputedHash = computeAuditHash(
      entry.sequence_number,
      entry.previous_hash,
      entry.timestamp,
      entry.actor_name,
      entry.action,
      entry.entity_id,
      entry.details
    );

    if (recomputedHash !== entry.current_hash) {
      return {
        valid: false,
        totalEntries: sorted.length,
        tamperedEntryId: entry.id,
        details: `Hash mismatch at block ${entry.id}: stored current_hash does not match recomputed SHA-256 payload digest.`,
      };
    }

    expectedPrevHash = entry.current_hash;
  }

  return {
    valid: true,
    totalEntries: sorted.length,
    details: `All ${sorted.length} cryptographic audit ledger blocks verified. SHA-256 chain is tamper-evident and cryptographically linked.`,
  };
}

export async function resetSafetyStore(seedBenchmark = true): Promise<SafetySnapshot> {
  let doc: LocalStoreDocument;
  if (seedBenchmark) {
    const benchmark = buildBenchmarkDataset();
    doc = {
      version: 1,
      updated_at: new Date().toISOString(),
      reports: benchmark.reports,
      classifications: benchmark.classifications,
      actions: benchmark.actions,
      auditLogs: benchmark.auditLogs,
    };
  } else {
    doc = {
      version: 1,
      updated_at: new Date().toISOString(),
      reports: [],
      classifications: [],
      actions: [],
      auditLogs: [
        {
          id: `aud-${uuidv4().slice(0, 8)}`,
          sequence_number: 1,
          previous_hash: GENESIS_HASH,
          current_hash: computeAuditHash(
            1,
            GENESIS_HASH,
            new Date().toISOString(),
            "Admin User",
            "WORKSPACE_CLEARED",
            "clear",
            "Cleared all observations and actions. Safety workspace initialized to blank state."
          ),
          timestamp: new Date().toISOString(),
          actor_name: "Admin User",
          actor_role: "Admin",
          action: "WORKSPACE_CLEARED",
          entity_type: "system",
          entity_id: "clear",
          details: "Cleared all observations and actions. Safety workspace initialized to blank state.",
          status: "warning",
        },
      ],
    };
  }

  await writeLocalDocument(doc);
  return cloneSnapshot(doc);
}
