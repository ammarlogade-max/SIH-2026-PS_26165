import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Classification, Report } from "@/lib/types";
import { isSupabasePersistenceConfigured, supabaseAdmin } from "@/lib/supabase";

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
  storage: SafetyStorageInfo;
};

type LocalStoreDocument = {
  version: 1;
  updated_at: string;
  reports: Report[];
  classifications: Classification[];
};

declare global {
  // The cache prevents overlapping development-route requests from reading stale
  // file contents. The file remains the durable source across server restarts.
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
  return {
    version: 1,
    updated_at: new Date().toISOString(),
    reports: [],
    classifications: [],
  };
}

function isLocalDocument(value: unknown): value is LocalStoreDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<LocalStoreDocument>;
  return document.version === 1 && Array.isArray(document.reports) && Array.isArray(document.classifications);
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
      globalThis.sifLocalStoreCache = parsed;
      return parsed;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        const document = emptyLocalDocument();
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

  return {
    reports: (reportsResult.data || []) as Report[],
    classifications: (classificationsResult.data || []) as Classification[],
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
  classifications: Classification[]
): Promise<SafetySnapshot> {
  if (!reports.length) return getSafetySnapshot();

  if (isSupabasePersistenceConfigured) {
    const reportsInsert = await supabaseAdmin.from("sif_reports").insert(reports);
    if (reportsInsert.error) throw asStoreError("write", reportsInsert.error);

    const classificationsInsert = await supabaseAdmin.from("sif_classifications").insert(classifications);
    if (classificationsInsert.error) {
      // Avoid leaving orphaned reports when a classification insert fails.
      await supabaseAdmin.from("sif_reports").delete().in("id", reports.map((report) => report.id));
      throw asStoreError("write", classificationsInsert.error);
    }

    return getSafetySnapshot();
  }

  let result: SafetySnapshot | undefined;
  const pendingWrite = (globalThis.sifLocalStoreWriteQueue || Promise.resolve()).then(async () => {
    const current = await loadLocalDocument();
    const next: LocalStoreDocument = {
      version: 1,
      updated_at: new Date().toISOString(),
      reports: [...reports, ...current.reports],
      classifications: [...classifications, ...current.classifications],
    };
    await writeLocalDocument(next);
    result = cloneSnapshot(next);
  });

  globalThis.sifLocalStoreWriteQueue = pendingWrite.catch(() => undefined);
  await pendingWrite;
  return result!;
}
