import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Classification, Report, CorrectiveAction, AuditLogEntry, UserRole } from "@/lib/types";
import { isSupabasePersistenceConfigured, supabaseAdmin } from "@/lib/supabase";
import { buildBenchmarkDataset } from "@/lib/benchmark-seeder";
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

declare global {
  // eslint-disable-next-line no-var
  var sifLocalStoreCache: LocalStoreDocument | undefined;
  // eslint-disable-next-line no-var
  var sifLocalStoreLoad: Promise<LocalStoreDocument> | undefined;
  // eslint-disable-next-line no-var
  var sifLocalStoreWriteQueue: Promise<void> | undefined;
}

const localStorePath = path.join(process.cwd(), ".data", "sif-sentinel.json");

function localStorageInfo(): SafetyStorageInfo {
  return {
    kind: "local-file",
    persistent: !process.env.VERCEL,
    deploymentSafe: false,
    label: "Persisted local workspace (development)",
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
      const raw = await readFile(localStorePath, "utf8");
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
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        const document = emptyLocalDocument();
        await writeLocalDocument(document);
        globalThis.sifLocalStoreCache = document;
        return document;
      }
      throw error;
    } finally {
      globalThis.sifLocalStoreLoad = undefined;
    }
  })();

  return globalThis.sifLocalStoreLoad;
}

async function writeLocalDocument(document: LocalStoreDocument) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  const temporaryPath = `${localStorePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(document, null, 2), "utf8");
  await rename(temporaryPath, localStorePath);
  globalThis.sifLocalStoreCache = document;
}

function cloneSnapshot(document: LocalStoreDocument): SafetySnapshot {
  return {
    reports: [...document.reports],
    classifications: [...document.classifications],
    actions: [...(document.actions || [])],
    auditLogs: [...(document.auditLogs || [])],
    storage: localStorageInfo(),
  };
}

function asStoreError(operation: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : "Unknown storage error";
  return new Error(`Safety data ${operation} failed: ${message}`);
}

async function loadSupabaseSnapshot(): Promise<SafetySnapshot> {
  const [reportsResult, classificationsResult] = await Promise.all([
    supabaseAdmin.from("sif_reports").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("sif_classifications").select("*").order("created_at", { ascending: false }),
  ]);

  if (reportsResult.error) throw asStoreError("read", reportsResult.error);
  if (classificationsResult.error) throw asStoreError("read", classificationsResult.error);

  // For Supabase, actions and audit logs fallback gracefully if tables don't exist yet
  const localDoc = await loadLocalDocument();

  return {
    reports: (reportsResult.data || []) as Report[],
    classifications: (classificationsResult.data || []) as Classification[],
    actions: localDoc.actions || [],
    auditLogs: localDoc.auditLogs || [],
    storage: supabaseStorageInfo(),
  };
}

export function getSafetyStorageInfo(): SafetyStorageInfo {
  return isSupabasePersistenceConfigured ? supabaseStorageInfo() : localStorageInfo();
}

export async function getSafetySnapshot(): Promise<SafetySnapshot> {
  if (isSupabasePersistenceConfigured) return loadSupabaseSnapshot();
  return cloneSnapshot(await loadLocalDocument());
}

export async function appendSafetyRecords(
  reports: Report[],
  classifications: Classification[],
  auditEvent?: { actor_name: string; actor_role: UserRole; details: string }
): Promise<SafetySnapshot> {
  if (!reports.length) return getSafetySnapshot();

  if (isSupabasePersistenceConfigured) {
    const reportsInsert = await supabaseAdmin.from("sif_reports").insert(reports);
    if (reportsInsert.error) throw asStoreError("write", reportsInsert.error);

    const classificationsInsert = await supabaseAdmin.from("sif_classifications").insert(classifications);
    if (classificationsInsert.error) {
      await supabaseAdmin.from("sif_reports").delete().in("id", reports.map((report) => report.id));
      throw asStoreError("write", classificationsInsert.error);
    }
  }

  let result: SafetySnapshot | undefined;
  const pendingWrite = (globalThis.sifLocalStoreWriteQueue || Promise.resolve()).then(async () => {
    const current = await loadLocalDocument();
    
    const newAuditLogs: AuditLogEntry[] = [...(current.auditLogs || [])];
    if (auditEvent) {
      newAuditLogs.unshift({
        id: `aud-${uuidv4().slice(0, 8)}`,
        timestamp: new Date().toISOString(),
        actor_name: auditEvent.actor_name,
        actor_role: auditEvent.actor_role,
        action: "OBSERVATION_INGESTED",
        entity_type: "observation",
        entity_id: reports[0]?.id || "batch",
        details: auditEvent.details,
        status: "success",
      });
    }

    const next: LocalStoreDocument = {
      version: 1,
      updated_at: new Date().toISOString(),
      reports: [...reports, ...current.reports],
      classifications: [...classifications, ...current.classifications],
      actions: current.actions || [],
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
  const nextActions = [action, ...(current.actions || [])];
  
  const auditEntry: AuditLogEntry = {
    id: `aud-${uuidv4().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    actor_name: actor.name,
    actor_role: actor.role,
    action: "CAPA_CREATED",
    entity_type: "action",
    entity_id: action.id,
    details: `Created CAPA '${action.title}' for ${action.site} (${action.life_saving_rule}, Priority: ${action.priority}). Assigned to ${action.assigned_to}.`,
    status: "success",
  };

  const next: LocalStoreDocument = {
    ...current,
    updated_at: new Date().toISOString(),
    actions: nextActions,
    auditLogs: [auditEntry, ...(current.auditLogs || [])],
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
  }
  if (updates.status === "verified") {
    if (!updated.verified_at) updated.verified_at = new Date().toISOString();
    if (!updated.verified_by) updated.verified_by = `${actor.name} (${actor.role})`;
  }

  actions[index] = updated;

  const auditEntry: AuditLogEntry = {
    id: `aud-${uuidv4().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    actor_name: actor.name,
    actor_role: actor.role,
    action: updates.status === "verified" ? "CAPA_VERIFIED" : updates.status === "completed" ? "CAPA_COMPLETED" : "CAPA_UPDATED",
    entity_type: "action",
    entity_id: id,
    details: `Updated action '${updated.title}' to status '${updated.status}'. ${updates.evidence_notes ? `Notes: ${updates.evidence_notes}` : ""}`,
    status: "success",
  };

  const next: LocalStoreDocument = {
    ...current,
    updated_at: new Date().toISOString(),
    actions: [...actions],
    auditLogs: [auditEntry, ...(current.auditLogs || [])],
  };

  await writeLocalDocument(next);
  return updated;
}

export async function logAuditEvent(
  entry: Omit<AuditLogEntry, "id" | "timestamp">
): Promise<AuditLogEntry> {
  const current = await loadLocalDocument();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `aud-${uuidv4().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
  };

  const next: LocalStoreDocument = {
    ...current,
    updated_at: new Date().toISOString(),
    auditLogs: [newEntry, ...(current.auditLogs || [])],
  };

  await writeLocalDocument(next);
  return newEntry;
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
      auditLogs: [
        {
          id: `aud-${uuidv4().slice(0, 8)}`,
          timestamp: new Date().toISOString(),
          actor_name: "Admin User",
          actor_role: "Admin",
          action: "BENCHMARK_RESET",
          entity_type: "system",
          entity_id: "reset",
          details: "Restored authentic synthetic industrial safety benchmark dataset (48 observations, 8 CAPA actions).",
          status: "success",
        },
        ...benchmark.auditLogs,
      ],
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
