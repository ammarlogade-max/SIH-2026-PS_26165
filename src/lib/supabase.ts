import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { Report, Classification, SiteActivityAggregate, PatternCallout, WeeklyHseDigest } from "./types";

// ─── Clean In-Memory Database Store (Starts Empty per SRS Hard Rule) ───────────

class InMemoryDatabase {
  reports: Report[] = [];
  classifications: Classification[] = [];
  site_activity_aggregates: SiteActivityAggregate[] = [];
  pattern_callouts: PatternCallout[] = [];
  weekly_digests: WeeklyHseDigest[] = [];

  getTable(tableName: string): Record<string, unknown>[] {
    const table = (this as Record<string, unknown>)[tableName];
    if (Array.isArray(table)) {
      return table as Record<string, unknown>[];
    }
    const newTable: Record<string, unknown>[] = [];
    (this as Record<string, unknown>)[tableName] = newTable;
    return newTable;
  }
}

export const memoryDb = new InMemoryDatabase();

// ─── Fluent Query Builder for In-Memory Database ─────────────────────────────

interface FilterPredicate {
  (row: Record<string, unknown>): boolean;
}

class InMemoryQueryBuilder {
  private tableName: string;
  private selectedColumns = "*";
  private predicates: FilterPredicate[] = [];
  private orderConfig?: { column: string; ascending: boolean };
  private limitCount?: number;
  private isSingle = false;
  private mutationData?: Record<string, unknown> | Record<string, unknown>[];
  private mutationType?: "insert" | "update" | "upsert" | "delete";

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns = "*") {
    this.selectedColumns = columns;
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]) {
    this.mutationType = "insert";
    this.mutationData = data;
    return this;
  }

  update(data: Record<string, unknown>) {
    this.mutationType = "update";
    this.mutationData = data;
    return this;
  }

  upsert(data: Record<string, unknown> | Record<string, unknown>[]) {
    this.mutationType = "upsert";
    this.mutationData = data;
    return this;
  }

  delete() {
    this.mutationType = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.predicates.push((row) => {
      if (column.includes(".")) {
        const [rel, field] = column.split(".");
        const relData = row[rel];
        if (relData && typeof relData === "object") {
          return (relData as Record<string, unknown>)[field] === value;
        }
        return false;
      }
      return row[column] === value;
    });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.predicates.push((row) => {
      const val = row[column];
      return Array.isArray(values) && values.includes(val);
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = {
      column,
      ascending: options?.ascending !== false,
    };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  private execute(): { data: any; error: any } {
    const table = memoryDb.getTable(this.tableName);

    if (this.mutationType === "insert") {
      const items = Array.isArray(this.mutationData) ? this.mutationData : [this.mutationData!];
      const inserted = items.map((item) => {
        const now = new Date().toISOString();
        const record = {
          id: item.id || uuidv4(),
          created_at: item.created_at || now,
          updated_at: item.updated_at || now,
          ...item,
        };
        table.push(record);
        return record;
      });
      const resData = Array.isArray(this.mutationData) ? inserted : inserted[0];
      return { data: resData, error: null };
    }

    if (this.mutationType === "upsert") {
      const items = Array.isArray(this.mutationData) ? this.mutationData : [this.mutationData!];
      const result = items.map((item) => {
        const now = new Date().toISOString();
        const existingIdx = table.findIndex((row) => item.id && row.id === item.id);
        if (existingIdx >= 0) {
          table[existingIdx] = { ...table[existingIdx], ...item, updated_at: now };
          return table[existingIdx];
        } else {
          const record = { id: item.id || uuidv4(), created_at: item.created_at || now, updated_at: now, ...item };
          table.push(record);
          return record;
        }
      });
      return { data: Array.isArray(this.mutationData) ? result : result[0], error: null };
    }

    if (this.mutationType === "update") {
      const updated: Record<string, unknown>[] = [];
      for (let i = 0; i < table.length; i++) {
        const matches = this.predicates.every((p) => p(table[i]));
        if (matches) {
          table[i] = { ...table[i], ...(this.mutationData as Record<string, unknown>), updated_at: new Date().toISOString() };
          updated.push(table[i]);
        }
      }
      return { data: this.isSingle ? updated[0] || null : updated, error: null };
    }

    if (this.mutationType === "delete") {
      for (let i = table.length - 1; i >= 0; i--) {
        if (this.predicates.every((p) => p(table[i]))) {
          table.splice(i, 1);
        }
      }
      return { data: null, error: null };
    }

    // Default SELECT
    let rows = [...table];

    // Automatic relational joins for reports with classifications
    if (this.tableName === "reports" && this.selectedColumns.includes("classifications")) {
      rows = rows.map((report) => {
        const classifications = memoryDb.classifications.filter((c) => c.report_id === report.id);
        return { ...report, classifications };
      });
    }

    // Apply filter predicates
    for (const predicate of this.predicates) {
      rows = rows.filter(predicate);
    }

    // Apply sorting
    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      rows.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === "string" && typeof valB === "string") {
          return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return ascending ? (valA < valB ? -1 : 1) : (valA < valB ? 1 : -1);
      });
    }

    // Apply limit
    if (this.limitCount !== undefined) {
      rows = rows.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      return { data: rows[0] || null, error: rows[0] ? null : { message: "Row not found" } };
    }

    return { data: rows, error: null };
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

// ─── In-Memory Client Facade ──────────────────────────────────────────────────

function createInMemoryClient(): any {
  return {
    from(tableName: string) {
      return new InMemoryQueryBuilder(tableName);
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    }
  };
}

// ─── Client Initialization ───────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith("http") &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 10
);

export const supabase: any = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createInMemoryClient();

export const supabaseAdmin: any = isSupabaseConfigured && supabaseServiceKey
  ? createClient(supabaseUrl!, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : createInMemoryClient();
