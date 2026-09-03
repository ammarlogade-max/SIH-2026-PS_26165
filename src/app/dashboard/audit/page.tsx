"use client";

import { useEffect, useState, useMemo } from "react";
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ClipboardCheck,
  RotateCcw,
  X,
  Calendar,
} from "lucide-react";
import clsx from "clsx";
import { AuditLogEntry } from "@/lib/types";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audit?limit=200");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load audit trail");
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching audit logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "all") {
        const actLower = (log.action || "").toLowerCase();
        const filtLower = actionFilter.toLowerCase();
        if (filtLower === "capa_verified" && !actLower.includes("verif")) return false;
        if (filtLower === "capa_created" && !actLower.includes("creat")) return false;
        if (filtLower === "capa_updated" && !actLower.includes("updat") && !actLower.includes("status")) return false;
        if (filtLower === "observation_ingested" && !actLower.includes("ingest") && !actLower.includes("observ")) return false;
        if (filtLower === "pattern_flagged" && !actLower.includes("pattern") && !actLower.includes("precursor")) return false;
        if (filtLower === "system_reset" && !actLower.includes("reset") && !actLower.includes("clear")) return false;
      }
      if (roleFilter !== "all" && log.actor_role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.actor_name.toLowerCase().includes(q) ||
          log.actor_role.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          (log.entity_id && log.entity_id.toLowerCase().includes(q)) ||
          log.details.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, actionFilter, roleFilter, searchQuery]);

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ["Timestamp", "Action", "Actor Name", "Actor Role", "Entity Type", "Entity ID", "Details"];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.action,
      `"${l.actor_name}"`,
      `"${l.actor_role}"`,
      l.entity_type || "",
      l.entity_id || "",
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SIF_Sentinel_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    const act = (action || "").toLowerCase();
    if (act.includes("verif")) {
      return {
        label: "CAPA Verified",
        icon: ShieldCheck,
        className: "bg-violet-500/15 text-violet-300 border-violet-500/30",
      };
    }
    if (act.includes("creat")) {
      return {
        label: "CAPA Created",
        icon: ClipboardCheck,
        className: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      };
    }
    if (act.includes("complet")) {
      return {
        label: "CAPA Completed",
        icon: CheckCircle2,
        className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      };
    }
    if (act.includes("updat") || act.includes("status")) {
      return {
        label: "CAPA Updated",
        icon: Clock,
        className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      };
    }
    if (act.includes("ingest") || act.includes("observ")) {
      return {
        label: "Observation Logged",
        icon: UploadCloud,
        className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      };
    }
    if (act.includes("precursor") || act.includes("pattern") || act.includes("flag")) {
      return {
        label: "Precursor Flagged",
        icon: AlertTriangle,
        className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      };
    }
    if (act.includes("reset") || act.includes("clear")) {
      return {
        label: "System Reset",
        icon: RotateCcw,
        className: "bg-slate-500/15 text-slate-300 border-slate-500/30",
      };
    }
    return {
      label: action.replace(/_/g, " "),
      icon: History,
      className: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <History className="h-4 w-4" />
            Regulatory Compliance &amp; Governance
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Immutable Audit Trail
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Complete cryptographic event ledger of observations, classification changes, CAPA updates, and HSE sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-3 text-xs font-semibold text-slate-300 transition hover:bg-surface-hover hover:text-white"
          >
            <RefreshCw className={clsx("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-3 text-xs font-semibold text-slate-300 transition hover:bg-surface-hover hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export Audit Log (CSV)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface-card/85 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by actor, role, event, or target ID..."
            className="h-10 w-full rounded-xl border border-surface-border bg-surface/75 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 rounded-xl border border-surface-border bg-surface/75 px-3 text-xs font-medium text-slate-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">All Events</option>
            <option value="capa_verified">CAPA Verified</option>
            <option value="capa_created">CAPA Created</option>
            <option value="capa_updated">CAPA Updated</option>
            <option value="observation_ingested">Observation Ingested</option>
            <option value="pattern_flagged">Pattern Flagged</option>
            <option value="system_reset">System Reset</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-xl border border-surface-border bg-surface/75 px-3 text-xs font-medium text-slate-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="HSE Officer">HSE Officer</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Plant Manager">Plant Manager</option>
            <option value="Field Observer">Field Observer</option>
            <option value="System">System Automated</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-surface-border bg-surface-card">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
          <p className="text-xs text-slate-400">Loading audit trail entries...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-card/50 p-6 text-center">
          <History className="h-8 w-8 text-slate-500" />
          <p className="text-sm font-medium text-slate-300">No audit events match your criteria</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-border bg-surface/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 pl-5 pr-3">Timestamp (UTC)</th>
                  <th className="px-3 py-3.5">Event Action</th>
                  <th className="px-3 py-3.5">Actor &amp; Role</th>
                  <th className="px-3 py-3.5">Target Entity</th>
                  <th className="py-3.5 pl-3 pr-5">Event Details &amp; Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;

                  return (
                    <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors">
                      {/* Timestamp */}
                      <td className="whitespace-nowrap py-3.5 pl-5 pr-3 font-mono text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            badge.className
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{log.actor_name}</span>
                          <span className="text-[10px] text-slate-500">{log.actor_role}</span>
                        </div>
                      </td>

                      {/* Target */}
                      <td className="whitespace-nowrap px-3 py-3.5">
                        {log.entity_id ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px] text-slate-300">
                              {log.entity_type || "Entity"}: {log.entity_id.slice(0, 12)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 pl-3 pr-5">
                        <div className="max-w-md truncate text-slate-300 font-mono text-[11px]">
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
