"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ClipboardCheck,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  User,
  Building2,
  Calendar,
  Download,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { CorrectiveAction, LifeSavingRule, UserRole, IOGP_LIFE_SAVING_RULES } from "@/lib/types";

export default function CorrectiveActionsPage() {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newAction, setNewAction] = useState({
    title: "",
    description: "",
    site: "Duliajan Rig 7",
    life_saving_rule: "Working at Height" as LifeSavingRule,
    assigned_to: "",
    assigned_role: "Supervisor" as UserRole,
    priority: "high" as "immediate" | "high" | "medium" | "low",
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
  });

  // Complete / Verify modal
  const [selectedActionForUpdate, setSelectedActionForUpdate] = useState<CorrectiveAction | null>(null);
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateSubmitting, setUpdateSubmitting] = useState(false);

  // Active role synced with layout
  const [activeRole, setActiveRole] = useState<UserRole>("HSE Officer");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sif_user_role") as UserRole | null;
      if (saved) setActiveRole(saved);
      const handleRoleUpdate = () => {
        const updated = localStorage.getItem("sif_user_role") as UserRole | null;
        if (updated) setActiveRole(updated);
      };
      window.addEventListener("sif_role_changed", handleRoleUpdate);
      window.addEventListener("storage", handleRoleUpdate);
      return () => {
        window.removeEventListener("sif_role_changed", handleRoleUpdate);
        window.removeEventListener("storage", handleRoleUpdate);
      };
    } catch (_) {}
  }, []);

  const getActorDetails = (role: UserRole) => {
    switch (role) {
      case "HSE Officer":
        return { name: "Pooja Saikia", role: "HSE Officer" };
      case "Supervisor":
        return { name: "Rajesh Bora", role: "Supervisor" };
      case "Plant Manager":
        return { name: "Devendra Nath", role: "Plant Manager" };
      case "Field Observer":
        return { name: "Bikash Gogoi", role: "Field Observer" };
      case "Admin":
        return { name: "Admin Lead", role: "Admin" };
      default:
        return { name: "Pooja Saikia", role: "HSE Officer" };
    }
  };

  const canVerify = activeRole === "HSE Officer" || activeRole === "Plant Manager" || activeRole === "Admin";
  const canExecute = activeRole === "Supervisor" || canVerify;

  const fetchActions = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/actions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load corrective actions");
      setActions(data.actions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching actions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.title.trim() || !newAction.assigned_to.trim()) {
      setFormError("Title and Assignee are required.");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      const actor = getActorDetails(activeRole);
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAction,
          actor_name: actor.name,
          actor_role: actor.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create action");
      setIsCreateModalOpen(false);
      setNewAction({
        title: "",
        description: "",
        site: "Duliajan Rig 7",
        life_saving_rule: "Working at Height",
        assigned_to: "",
        assigned_role: "Supervisor",
        priority: "high",
        due_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      });
      fetchActions(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error creating action");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: CorrectiveAction["status"], notes?: string) => {
    setUpdateSubmitting(true);
    try {
      const actor = getActorDetails(activeRole);
      const res = await fetch(`/api/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          evidence_notes: notes,
          actor_name: actor.name,
          actor_role: actor.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update action");
      setSelectedActionForUpdate(null);
      setUpdateNotes("");
      fetchActions(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const filteredActions = useMemo(() => {
    return actions.filter((act) => {
      if (statusFilter !== "all" && act.status !== statusFilter) return false;
      if (priorityFilter !== "all" && act.priority !== priorityFilter) return false;
      if (siteFilter !== "all" && act.site.toLowerCase() !== siteFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDesc = act.description?.toLowerCase().includes(q);
        const matchesAssignee = act.assigned_to.toLowerCase().includes(q);
        const matchesRule = act.life_saving_rule.toLowerCase().includes(q);
        const matchesSite = act.site.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesAssignee || matchesRule || matchesSite;
      }
      return true;
    });
  }, [actions, statusFilter, priorityFilter, siteFilter, searchQuery]);

  // Unique sites
  const sites = useMemo(() => {
    const set = new Set(actions.map((a) => a.site));
    return Array.from(set).sort();
  }, [actions]);

  // Counts
  const counts = useMemo(() => {
    return {
      total: actions.length,
      open: actions.filter((a) => a.status === "open").length,
      in_progress: actions.filter((a) => a.status === "in_progress").length,
      overdue: actions.filter((a) => a.status === "overdue").length,
      completed: actions.filter((a) => a.status === "completed").length,
      verified: actions.filter((a) => a.status === "verified").length,
    };
  }, [actions]);

  const exportCSV = () => {
    if (!actions.length) return;
    const headers = ["ID", "Title", "Site", "Life-Saving Rule", "Priority", "Status", "Assigned To", "Role", "Due Date", "Created At", "Evidence Notes"];
    const rows = filteredActions.map((a) => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.site}"`,
      `"${a.life_saving_rule}"`,
      a.priority,
      a.status,
      `"${a.assigned_to}"`,
      `"${a.assigned_role}"`,
      a.due_date,
      a.created_at,
      `"${(a.evidence_notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SIF_Sentinel_CAPA_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <ClipboardCheck className="h-4 w-4" />
            Corrective &amp; Preventive Action Management
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            CAPA Action Register
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Track, assign, enforce and verify critical barrier restoration actions across Oil India Limited operational sites.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchActions(true)}
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
            Export CSV
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            New Action
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button
          onClick={() => setStatusFilter("all")}
          className={clsx(
            "flex flex-col justify-between rounded-2xl border p-4 text-left transition",
            statusFilter === "all"
              ? "border-sky-400/40 bg-sky-500/[0.08] shadow-sm"
              : "border-surface-border bg-surface-card/75 hover:bg-surface-card"
          )}
        >
          <span className="text-[11px] font-semibold text-slate-400">Total Actions</span>
          <span className="font-display text-2xl font-bold text-slate-100">{counts.total}</span>
        </button>

        <button
          onClick={() => setStatusFilter("open")}
          className={clsx(
            "flex flex-col justify-between rounded-2xl border p-4 text-left transition",
            statusFilter === "open"
              ? "border-amber-400/40 bg-amber-500/[0.08] shadow-sm"
              : "border-surface-border bg-surface-card/75 hover:bg-surface-card"
          )}
        >
          <span className="text-[11px] font-semibold text-amber-400">Open / Pending</span>
          <span className="font-display text-2xl font-bold text-amber-400">{counts.open}</span>
        </button>

        <button
          onClick={() => setStatusFilter("in_progress")}
          className={clsx(
            "flex flex-col justify-between rounded-2xl border p-4 text-left transition",
            statusFilter === "in_progress"
              ? "border-sky-400/40 bg-sky-500/[0.08] shadow-sm"
              : "border-surface-border bg-surface-card/75 hover:bg-surface-card"
          )}
        >
          <span className="text-[11px] font-semibold text-sky-400">In Progress</span>
          <span className="font-display text-2xl font-bold text-sky-400">{counts.in_progress}</span>
        </button>

        <button
          onClick={() => setStatusFilter("overdue")}
          className={clsx(
            "flex flex-col justify-between rounded-2xl border p-4 text-left transition",
            statusFilter === "overdue"
              ? "border-red-400/40 bg-red-500/[0.08] shadow-sm"
              : "border-surface-border bg-surface-card/75 hover:bg-surface-card"
          )}
        >
          <span className="text-[11px] font-semibold text-red-400">Overdue (Critical)</span>
          <span className="font-display text-2xl font-bold text-red-400">{counts.overdue}</span>
        </button>

        <button
          onClick={() => setStatusFilter("completed")}
          className={clsx(
            "flex flex-col justify-between rounded-2xl border p-4 text-left transition",
            statusFilter === "completed"
              ? "border-emerald-400/40 bg-emerald-500/[0.08] shadow-sm"
              : "border-surface-border bg-surface-card/75 hover:bg-surface-card"
          )}
        >
          <span className="text-[11px] font-semibold text-emerald-400">Completed</span>
          <span className="font-display text-2xl font-bold text-emerald-400">{counts.completed}</span>
        </button>

        <button
          onClick={() => setStatusFilter("verified")}
          className={clsx(
            "flex flex-col justify-between rounded-2xl border p-4 text-left transition",
            statusFilter === "verified"
              ? "border-violet-400/40 bg-violet-500/[0.08] shadow-sm"
              : "border-surface-border bg-surface-card/75 hover:bg-surface-card"
          )}
        >
          <span className="text-[11px] font-semibold text-violet-400">Verified by HSE</span>
          <span className="font-display text-2xl font-bold text-violet-400">{counts.verified}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface-card/85 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actions by title, site, assignee, or Life-Saving Rule..."
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="h-10 rounded-xl border border-surface-border bg-surface/75 px-3 text-xs font-medium text-slate-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">All Facilities</option>
            {sites.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 rounded-xl border border-surface-border bg-surface/75 px-3 text-xs font-medium text-slate-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="immediate">Immediate</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Action Cards List */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-surface-border bg-surface-card">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
          <p className="text-xs text-slate-400">Loading corrective action register...</p>
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-card/50 p-6 text-center">
          <ClipboardCheck className="h-8 w-8 text-slate-500" />
          <p className="text-sm font-medium text-slate-300">No corrective actions match your filters</p>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or create a new action.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredActions.map((action) => {
            const isOverdue = action.status === "overdue" || (action.status !== "completed" && action.status !== "verified" && new Date(action.due_date) < new Date());
            return (
              <div
                key={action.id}
                className={clsx(
                  "group relative overflow-hidden rounded-2xl border transition-all duration-200",
                  action.status === "verified"
                    ? "border-violet-500/25 bg-violet-500/[0.02]"
                    : action.status === "completed"
                    ? "border-emerald-500/25 bg-emerald-500/[0.02]"
                    : isOverdue
                    ? "border-red-500/35 bg-red-500/[0.03]"
                    : "border-surface-border bg-surface-card/85 hover:border-surface-border-strong"
                )}
              >
                <div className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            action.priority === "immediate"
                              ? "border border-red-400/30 bg-red-500/10 text-red-400"
                              : action.priority === "high"
                              ? "border border-orange-400/30 bg-orange-500/10 text-orange-400"
                              : "border border-amber-400/30 bg-amber-500/10 text-amber-400"
                          )}
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {action.priority}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            action.status === "verified"
                              ? "border border-violet-400/30 bg-violet-500/15 text-violet-300"
                              : action.status === "completed"
                              ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                              : isOverdue
                              ? "border border-red-400/30 bg-red-500/15 text-red-300"
                              : action.status === "in_progress"
                              ? "border border-sky-400/30 bg-sky-500/15 text-sky-300"
                              : "border border-amber-400/30 bg-amber-500/15 text-amber-300"
                          )}
                        >
                          {action.status === "verified" ? (
                            <ShieldCheck className="h-3 w-3 text-violet-400" />
                          ) : action.status === "completed" ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {action.status.replace("_", " ")}
                        </span>

                        {/* Life Saving Rule Tag */}
                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          {action.life_saving_rule}
                        </span>

                        {/* Site Tag */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Building2 className="h-3 w-3" />
                          {action.site}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-slate-100">{action.title}</h3>
                      {action.description && (
                        <p className="text-xs leading-relaxed text-slate-300">{action.description}</p>
                      )}
                    </div>

                    {/* Meta & Assignee */}
                    <div className="flex shrink-0 flex-col items-start sm:items-end gap-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium text-slate-200">
                        <User className="h-3.5 w-3.5 text-sky-400" />
                        {action.assigned_to}
                        <span className="rounded bg-surface-border/60 px-1 py-0.2 text-[10px] text-slate-400">
                          {action.assigned_role}
                        </span>
                      </span>

                      <span className={clsx("flex items-center gap-1 font-mono text-[11px]", isOverdue ? "text-red-400 font-semibold" : "text-slate-400")}>
                        <Calendar className="h-3 w-3" />
                        Due {action.due_date} {isOverdue && "(Overdue)"}
                      </span>
                    </div>
                  </div>

                  {/* Evidence Notes if present */}
                  {action.evidence_notes && (
                    <div className="mt-3 rounded-xl border border-surface-border bg-surface/50 p-3 text-xs text-slate-300">
                      <span className="font-semibold text-slate-200">Verification &amp; Evidence Notes: </span>
                      {action.evidence_notes}
                      {action.verified_by && (
                        <span className="mt-1 block text-[10px] text-violet-400">
                          Verified by {action.verified_by} on {action.verified_at ? new Date(action.verified_at).toLocaleDateString() : ""}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Status update actions */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border/60 pt-3">
                    <span className="text-[10px] text-slate-500">Action ID: {action.id}</span>

                    <div className="flex items-center gap-2">
                      {action.status === "open" && (
                        <button
                          onClick={() => handleStatusUpdate(action.id, "in_progress")}
                          disabled={updateSubmitting}
                          className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
                        >
                          Start Execution
                        </button>
                      )}

                      {action.status === "in_progress" && (
                        <button
                          onClick={() => {
                            setSelectedActionForUpdate(action);
                            setUpdateNotes("");
                          }}
                          disabled={updateSubmitting}
                          className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          Mark Completed
                        </button>
                      )}

                      {action.status === "completed" && (
                        canVerify ? (
                          <button
                            onClick={() => {
                              setSelectedActionForUpdate(action);
                              setUpdateNotes("");
                            }}
                            disabled={updateSubmitting}
                            className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
                          >
                            HSE Verification
                          </button>
                        ) : (
                          <span
                            className="rounded-lg border border-violet-400/20 bg-violet-500/5 px-2 py-1 text-[10px] text-violet-300/80"
                            title="Formal barrier sign-off requires HSE Officer, Plant Manager, or Admin authority."
                          >
                            Awaiting HSE Sign-off ({activeRole} view)
                          </span>
                        )
                      )}

                      {action.status === "verified" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Barrier Restored &amp; Closed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl border border-surface-border bg-surface-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-100">Create Corrective Action (CAPA)</h3>
                <p className="text-xs text-slate-400">Assign barrier restoration or engineering control</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-hover hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300">Action Title *</label>
                <input
                  type="text"
                  required
                  value={newAction.title}
                  onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                  placeholder="e.g. Conduct LOTO isolation audit on Transfer Pump 101"
                  className="mt-1.5 h-10 w-full rounded-xl border border-surface-border bg-surface/75 px-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Facility / Site *</label>
                  <select
                    value={newAction.site}
                    onChange={(e) => setNewAction({ ...newAction, site: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-surface-border bg-surface/75 px-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Duliajan Rig 7">Duliajan Rig 7</option>
                    <option value="Moran GGS">Moran GGS</option>
                    <option value="Naharkatiya Rig 4">Naharkatiya Rig 4</option>
                    <option value="Digboi Tank Farm">Digboi Tank Farm</option>
                    <option value="Jorajan CTF">Jorajan CTF</option>
                    <option value="Shalmari Wellsite">Shalmari Wellsite</option>
                    <option value="Tinsukia Pipeline Header">Tinsukia Pipeline Header</option>
                    <option value="Dikom Gas Compressor">Dikom Gas Compressor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Life-Saving Rule *</label>
                  <select
                    value={newAction.life_saving_rule}
                    onChange={(e) => setNewAction({ ...newAction, life_saving_rule: e.target.value as LifeSavingRule })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-surface-border bg-surface/75 px-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    {IOGP_LIFE_SAVING_RULES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Assigned To *</label>
                  <input
                    type="text"
                    required
                    value={newAction.assigned_to}
                    onChange={(e) => setNewAction({ ...newAction, assigned_to: e.target.value })}
                    placeholder="e.g. Rajesh Baruah"
                    className="mt-1.5 h-10 w-full rounded-xl border border-surface-border bg-surface/75 px-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Assignee Role</label>
                  <select
                    value={newAction.assigned_role}
                    onChange={(e) => setNewAction({ ...newAction, assigned_role: e.target.value as UserRole })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-surface-border bg-surface/75 px-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Supervisor">Supervisor</option>
                    <option value="HSE Officer">HSE Officer</option>
                    <option value="Plant Manager">Plant Manager</option>
                    <option value="Field Observer">Field Observer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Priority</label>
                  <select
                    value={newAction.priority}
                    onChange={(e) => setNewAction({ ...newAction, priority: e.target.value as "immediate" | "high" | "medium" | "low" })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-surface-border bg-surface/75 px-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="immediate">Immediate (24 hrs)</option>
                    <option value="high">High (3-5 days)</option>
                    <option value="medium">Medium (7-14 days)</option>
                    <option value="low">Low (Routine)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Target Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newAction.due_date}
                    onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-surface-border bg-surface/75 px-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Scope of Action / Remediation Plan</label>
                <textarea
                  rows={3}
                  value={newAction.description}
                  onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                  placeholder="Describe required hardware changes, retraining, permit restrictions, or barrier inspections..."
                  className="mt-1.5 w-full rounded-xl border border-surface-border bg-surface/75 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-surface-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-surface-hover hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50"
                >
                  {formSubmitting ? "Creating..." : "Save Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update / Verification Modal */}
      {selectedActionForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSelectedActionForUpdate(null)} />
          <div className="relative w-full max-w-md rounded-3xl border border-surface-border bg-surface-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-100">
                  {selectedActionForUpdate.status === "in_progress" ? "Complete Action" : "HSE Verification"}
                </h3>
                <p className="text-xs text-slate-400">Record barrier verification evidence notes</p>
              </div>
              <button
                onClick={() => setSelectedActionForUpdate(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-hover hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-surface-border bg-surface/50 p-3">
                <p className="text-xs font-semibold text-slate-200">{selectedActionForUpdate.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {selectedActionForUpdate.site} · {selectedActionForUpdate.life_saving_rule}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Evidence Notes / Inspection Observations *
                </label>
                <textarea
                  rows={4}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Detail how the barrier was physically restored, tests performed, or new SOP verified..."
                  className="mt-1.5 w-full rounded-xl border border-surface-border bg-surface/75 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-surface-border pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedActionForUpdate(null)}
                  className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-surface-hover hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const nextStatus = selectedActionForUpdate.status === "in_progress" ? "completed" : "verified";
                    handleStatusUpdate(selectedActionForUpdate.id, nextStatus, updateNotes);
                  }}
                  disabled={updateSubmitting || !updateNotes.trim()}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50"
                >
                  {updateSubmitting ? "Saving..." : selectedActionForUpdate.status === "in_progress" ? "Mark as Completed" : "Sign Off & Verify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
