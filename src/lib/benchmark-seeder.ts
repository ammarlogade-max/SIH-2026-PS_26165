import { Report, Classification, CorrectiveAction, AuditLogEntry, LifeSavingRule, UserRole, SafetyEventType } from "./types";
import { LABELED_TRAINING_DATASET } from "./ml-training-dataset";
import { generateLayerAClassification } from "./layer-a-classifier";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "node:crypto";

function computeAuditHash(
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

export interface BenchmarkSeedPayload {
  reports: Report[];
  classifications: Classification[];
  actions: CorrectiveAction[];
  auditLogs: AuditLogEntry[];
}

/**
 * Generates an authentic, fully classified synthetic industrial safety benchmark dataset
 * for Oil India Limited operations.
 * Every observation is classified through the actual mathematical Layer A model.
 */
export function buildBenchmarkDataset(): BenchmarkSeedPayload {
  const reports: Report[] = [];
  const classifications: Classification[] = [];

  // Take a curated selection of 48 observations from LABELED_TRAINING_DATASET
  // (both SIF precursors and non-SIF safe observations across all 9 rules)
  const selectedObservations = LABELED_TRAINING_DATASET.slice(0, 48);

  const now = Date.now();
  const ONE_DAY_MS = 86400000;

  // Distribute across the 4 mandatory event types
  const eventTypes: SafetyEventType[] = [
    "Unsafe Act",
    "Unsafe Condition",
    "Near-Miss",
    "Incident",
  ];

  selectedObservations.forEach((obs, index) => {
    // Spread dates over the last 14 days
    const dayOffset = (index % 14);
    const dateObj = new Date(now - dayOffset * ONE_DAY_MS - (index * 3600000));
    const dateStr = dateObj.toISOString().split("T")[0];
    const timestamp = dateObj.toISOString();

    const reportId = `rep-${uuidv4().slice(0, 8)}`;
    
    // Realistic event type assignment
    let eventType: SafetyEventType = eventTypes[index % 4];
    if (obs.text.toLowerCase().includes("bypassed") || obs.text.toLowerCase().includes("failed to") || obs.text.toLowerCase().includes("without")) {
      eventType = "Unsafe Act";
    } else if (obs.text.toLowerCase().includes("corroded") || obs.text.toLowerCase().includes("leaking") || obs.text.toLowerCase().includes("damaged")) {
      eventType = "Unsafe Condition";
    } else if (obs.text.toLowerCase().includes("dropped") || obs.text.toLowerCase().includes("deflected") || obs.text.toLowerCase().includes("narrowly")) {
      eventType = "Near-Miss";
    } else if (obs.text.toLowerCase().includes("ruptured") || obs.text.toLowerCase().includes("flash fire") || obs.text.toLowerCase().includes("injury")) {
      eventType = "Incident";
    }

    const report: Report = {
      id: reportId,
      raw_text: obs.text,
      site: obs.site || "Duliajan Rig 7",
      activity: obs.activity || "General Maintenance",
      reported_date: dateStr,
      event_type: eventType,
      submitting_role: index % 3 === 0 ? "Safety Steward" : index % 3 === 1 ? "Rig Mechanic" : "HSE Officer",
      source: index % 5 === 0 ? "bulk_upload" : "manual",
      created_at: timestamp,
    };

    const classification = generateLayerAClassification(reportId, obs.text, dateStr);
    classification.created_at = timestamp;
    classification.reasoning_narrative = classification.is_sif_potential
      ? `Layer A flagged fatal risk precursor under '${classification.life_saving_rule}'. Pathway: [${classification.sif_pathway?.hazard || "Uncontrolled Hazard"}] -> [${classification.sif_pathway?.energy_category || "Kinetic"}] -> [Barrier: ${classification.sif_pathway?.critical_barrier || "Engineering Control"}] (${classification.sif_pathway?.barrier_state || "FAILED"}). Key risk drivers: ${classification.reasoning_terms.map(t => t.term).join(", ")}.`
      : `Routine operational observation. No fatal risk precursor detected (${(classification.sif_probability * 100).toFixed(1)}% SIF probability).`;

    reports.push(report);
    classifications.push(classification);
  });

  // Generate realistic initial CAPA Corrective Actions
  const actions: CorrectiveAction[] = [
    {
      id: `act-${uuidv4().slice(0, 8)}`,
      site: "Duliajan Rig 7",
      life_saving_rule: "Working at Height",
      title: "Replace frayed mast inertia reels & retrain scaffold crew",
      description: "Replace fall arrest inertia reel #4 on rig mast. Conduct mandatory 100% tie-off toolbox talk with 3rd-party scaffolding contractors before shift resumption.",
      assigned_to: "Rajesh Baruah",
      assigned_role: "Supervisor",
      priority: "immediate",
      status: "in_progress",
      hierarchy_level: "Engineering / Direct Control",
      due_date: new Date(now + 2 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 3 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Scaffolding contractor inspected. Replacement inertia reel PO #OIL-DUL-491 dispatched.",
      monitoring_window_days: 30,
      post_closure_monitoring_active: false,
      recurrence_detected: false,
      effectiveness_status: "pending_verification",
    },
    {
      id: `act-${uuidv4().slice(0, 8)}`,
      site: "Moran GGS",
      life_saving_rule: "Hot Work",
      title: "Enforce continuous LEL gas detector calibration during manifold welding",
      description: "Perform certified recalibration of portable 4-gas atmospheric monitors. Station a dedicated HSE fire-watch with charged AFFF extinguisher at separator manifold.",
      assigned_to: "Pooja Saikia",
      assigned_role: "HSE Officer",
      priority: "immediate",
      status: "open",
      hierarchy_level: "Engineering / Direct Control",
      due_date: new Date(now + 1 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 1 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Permit #HW-2026-081 revoked pending fire-watch reassignment.",
      monitoring_window_days: 30,
      post_closure_monitoring_active: false,
      recurrence_detected: false,
      effectiveness_status: "pending_verification",
    },
    {
      id: `act-${uuidv4().slice(0, 8)}`,
      site: "Naharkatiya Rig 4",
      life_saving_rule: "Line of Fire",
      title: "Establish 15m exclusion zone around high-pressure mud pump discharge",
      description: "Install rigid physical barriers and high-visibility danger tape around high-pressure standpipe manifold. Test whip-checks on all 4-inch discharge hoses.",
      assigned_to: "Bikash Gogoi",
      assigned_role: "Supervisor",
      priority: "high",
      status: "in_progress",
      hierarchy_level: "Engineering / Direct Control",
      due_date: new Date(now + 3 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 4 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Temporary stanchions placed. Whip checks inspected on hose #2 and #3.",
      monitoring_window_days: 30,
      post_closure_monitoring_active: false,
      recurrence_detected: false,
      effectiveness_status: "pending_verification",
    },
    {
      id: `act-${uuidv4().slice(0, 8)}`,
      site: "Digboi Tank Farm",
      life_saving_rule: "Energy Isolation",
      title: "Audit LOTO lock box protocols on crude transfer pumps 101-A/B",
      description: "Verify physical padlock verification on 415V switchgear feeder breakers. Ensure zero energy test is documented on PTW before maintenance starts.",
      assigned_to: "Debojit Hazarika",
      assigned_role: "Plant Manager",
      priority: "high",
      status: "overdue",
      hierarchy_level: "Administrative",
      due_date: new Date(now - 1 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 7 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Supervisor was on emergency shutdown duty; audit rescheduled for morning inspection.",
      monitoring_window_days: 30,
      post_closure_monitoring_active: false,
      recurrence_detected: false,
      effectiveness_status: "pending_verification",
    },
    {
      id: `act-${uuidv4().slice(0, 8)}`,
      site: "Jorajan CTF",
      life_saving_rule: "Confined Space",
      title: "Install forced air mechanical blower & calibrated H2S monitor for Tank 3",
      description: "Prior to sludge cleaning entry, verify 24hr continuous mechanical forced ventilation and calibrated multi-gas detector log. Standby rescuer required.",
      assigned_to: "Anup Dutta",
      assigned_role: "HSE Officer",
      priority: "immediate",
      status: "verified",
      hierarchy_level: "Engineering / Direct Control",
      due_date: new Date(now - 3 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 9 * ONE_DAY_MS).toISOString(),
      completed_at: new Date(now - 4 * ONE_DAY_MS).toISOString(),
      verified_by: "Nayan Moni Phukan (Lead Auditor)",
      verified_at: new Date(now - 3 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Forced air blower installed. H2S recorded at 0.0 ppm. Rescue tripod and harness inspected.",
      monitoring_window_days: 30,
      post_closure_monitoring_active: true,
      recurrence_detected: false,
      effectiveness_status: "effective",
    },
    {
      id: `act-${uuidv4().slice(0, 8)}`,
      site: "Shalmari Wellsite",
      life_saving_rule: "Safe Mechanical Lifting",
      title: "Decommission worn wire rope slings and re-certify 25T hydraulic crane",
      description: "All wire rope slings showing broken strands or kinked eye thimbles must be tagged out and physically cut. Verify third-party test certificate for spreader beam.",
      assigned_to: "Tarun Sonowal",
      assigned_role: "Supervisor",
      priority: "high",
      status: "completed",
      hierarchy_level: "Elimination",
      due_date: new Date(now - 2 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 6 * ONE_DAY_MS).toISOString(),
      completed_at: new Date(now - 2 * ONE_DAY_MS).toISOString(),
      evidence_notes: "4 condemned wire slings scrapped. New certified web slings placed in tool store.",
      monitoring_window_days: 30,
      post_closure_monitoring_active: true,
      recurrence_detected: false,
      effectiveness_status: "effective",
    },
    {
      id: `act-${uuidv4().slice(0, 8)}`,
      site: "Tinsukia Pipeline Header",
      life_saving_rule: "Bypassing Safety Controls",
      title: "Remove unauthorized jumper wire on ESD valve XV-204 and test telemetry trip",
      description: "Conduct electrical inspection of bypass switches in marshaling cabinet. Enforce strict MOC (Management of Change) sign-off for any interlock bypass.",
      assigned_to: "Pranab Chetia",
      assigned_role: "HSE Officer",
      priority: "immediate",
      status: "verified",
      hierarchy_level: "Engineering / Direct Control",
      due_date: new Date(now - 5 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 12 * ONE_DAY_MS).toISOString(),
      completed_at: new Date(now - 6 * ONE_DAY_MS).toISOString(),
      verified_by: "Dr. K. Kalita (Head of Safety, OIL)",
      verified_at: new Date(now - 5 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Jumper removed. Valve stroke test confirmed automatic closure in 1.8 seconds upon signal loss.",
      monitoring_window_days: 30,
      post_closure_monitoring_active: true,
      recurrence_detected: false,
      effectiveness_status: "effective",
    },
    {
      id: `act-${uuidv4().slice(0, 8)}`,
      site: "Duliajan Rig 7",
      life_saving_rule: "Work Authorization",
      title: "Implement digital PTW sign-off verification on rig doghouse terminal",
      description: "Require simultaneous electronic authorization from Rig Superintendent and Lead Rigger before hoisting drill collars.",
      assigned_to: "Rajesh Baruah",
      assigned_role: "Supervisor",
      priority: "medium",
      status: "open",
      hierarchy_level: "Administrative",
      due_date: new Date(now + 5 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 2 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Terminal software configured. Field test planned for next tripping schedule.",
      monitoring_window_days: 30,
      post_closure_monitoring_active: false,
      recurrence_detected: false,
      effectiveness_status: "pending_verification",
    },
  ];

  // Raw initial audit log records (in chronological order for hash chaining)
  const rawAuditRecords: Omit<AuditLogEntry, "current_hash" | "previous_hash" | "sequence_number">[] = [
    {
      id: `aud-${uuidv4().slice(0, 8)}`,
      timestamp: new Date(now - 24 * 3600000).toISOString(),
      actor_name: "Dr. K. Kalita",
      actor_role: "Plant Manager",
      action: "DIGEST_GENERATION",
      entity_type: "system",
      entity_id: "weekly-digest-latest",
      details: "Generated and reviewed weekly executive HSE precursor briefing for Oil India Limited management.",
      status: "success",
    },
    {
      id: `aud-${uuidv4().slice(0, 8)}`,
      timestamp: new Date(now - 12 * 3600000).toISOString(),
      actor_name: "System Pattern Engine",
      actor_role: "Admin",
      action: "PATTERN_ALERT_GENERATED",
      entity_type: "pattern",
      entity_id: "pat-cluster-dul-wah",
      details: "Critical cluster detected: 4 recurring Working at Height observations at Duliajan Rig 7.",
      status: "warning",
    },
    {
      id: `aud-${uuidv4().slice(0, 8)}`,
      timestamp: new Date(now - 5 * 3600000).toISOString(),
      actor_name: "Nayan Moni Phukan",
      actor_role: "HSE Officer",
      action: "CAPA_VERIFIED",
      entity_type: "action",
      entity_id: actions[4].id,
      details: "Verified Confined Space Tank 3 blower controls at Jorajan CTF. Direct barrier restored and active monitoring initiated.",
      status: "success",
    },
    {
      id: `aud-${uuidv4().slice(0, 8)}`,
      timestamp: new Date(now - 2 * 3600000).toISOString(),
      actor_name: "Rajesh Baruah",
      actor_role: "Supervisor",
      action: "OBSERVATION_INGESTED",
      entity_type: "observation",
      entity_id: reports[0].id,
      details: "Field observation logged for Duliajan Rig 7 mast scaffolding.",
      status: "success",
    },
    {
      id: `aud-${uuidv4().slice(0, 8)}`,
      timestamp: new Date(now - 45 * 60000).toISOString(),
      actor_name: "Layer A Classifier Engine",
      actor_role: "Admin",
      action: "PRECURSOR_DETECTION",
      entity_type: "classification",
      entity_id: reports[0].id,
      details: "Mathematically classified observation as SIF Precursor (Working at Height, SIF Probability: 94.2%) via TF-IDF logit scoring.",
      status: "warning",
    },
    {
      id: `aud-${uuidv4().slice(0, 8)}`,
      timestamp: new Date(now - 15 * 60000).toISOString(),
      actor_name: "Pooja Saikia",
      actor_role: "HSE Officer",
      action: "CAPA_UPDATED",
      entity_type: "action",
      entity_id: actions[1].id,
      details: "Updated status of Hot Work CAPA at Moran GGS to Open; requested atmospheric meter calibration certificate.",
      status: "success",
    },
  ];

  // Cryptographically chain audit log entries (SHA-256 genesis block & continuous chaining)
  const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
  let prevHash = GENESIS_HASH;

  const chainedAuditLogs: AuditLogEntry[] = rawAuditRecords.map((item, idx) => {
    const seq = idx + 1;
    const currHash = computeAuditHash(seq, prevHash, item.timestamp, item.actor_name, item.action, item.entity_id, item.details);
    const entry: AuditLogEntry = {
      ...item,
      sequence_number: seq,
      previous_hash: prevHash,
      current_hash: currHash,
    };
    prevHash = currHash;
    return entry;
  }).reverse(); // Most recent first for UI

  return {
    reports,
    classifications,
    actions,
    auditLogs: chainedAuditLogs,
  };
}
