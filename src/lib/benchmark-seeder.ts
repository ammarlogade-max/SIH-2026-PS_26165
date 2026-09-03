import { Report, Classification, CorrectiveAction, AuditLogEntry, LifeSavingRule, UserRole } from "./types";
import { LABELED_TRAINING_DATASET } from "./ml-training-dataset";
import { classifyReportLayerA } from "./layer-a-classifier";
import { v4 as uuidv4 } from "uuid";

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

  // Take a curated selection of 45 observations from LABELED_TRAINING_DATASET
  // (both SIF precursors and non-SIF safe observations across all 9 rules)
  const selectedObservations = LABELED_TRAINING_DATASET.slice(0, 48);

  const now = Date.now();
  const ONE_DAY_MS = 86400000;

  selectedObservations.forEach((obs, index) => {
    // Spread dates over the last 14 days
    const dayOffset = (index % 14);
    const dateObj = new Date(now - dayOffset * ONE_DAY_MS - (index * 3600000));
    const dateStr = dateObj.toISOString().split("T")[0];
    const timestamp = dateObj.toISOString();

    const reportId = `rep-${uuidv4().slice(0, 8)}`;
    
    // Classify using real Layer A model
    const clsResult = classifyReportLayerA(obs.text);

    const report: Report = {
      id: reportId,
      raw_text: obs.text,
      site: obs.site || "Duliajan Rig 7",
      activity: obs.activity || "General Maintenance",
      reported_date: dateStr,
      submitting_role: index % 3 === 0 ? "Safety Steward" : index % 3 === 1 ? "Rig Mechanic" : "HSE Officer",
      source: index % 5 === 0 ? "bulk_upload" : "manual",
      created_at: timestamp,
    };

    const classification: Classification = {
      id: `cls-${uuidv4().slice(0, 8)}`,
      report_id: reportId,
      layer: "A",
      is_sif_potential: clsResult.is_sif_potential,
      confidence: clsResult.confidence,
      life_saving_rule: clsResult.life_saving_rule,
      reasoning_terms: clsResult.reasoning_terms,
      reasoning_narrative: clsResult.is_sif_potential
        ? `Layer A flagged fatal risk precursor under '${clsResult.life_saving_rule}'. Key risk drivers: ${clsResult.reasoning_terms.map(t => t.term).join(", ")}.`
        : `Routine operational observation. No fatal risk precursor detected (${clsResult.confidence.toFixed(1)}% safe confidence).`,
      model_version: clsResult.model_version,
      created_at: timestamp,
    };

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
      due_date: new Date(now + 2 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 3 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Scaffolding contractor inspected. Replacement inertia reel PO #OIL-DUL-491 dispatched.",
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
      due_date: new Date(now + 1 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 1 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Permit #HW-2026-081 revoked pending fire-watch reassignment.",
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
      due_date: new Date(now + 3 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 4 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Temporary stanchions placed. Whip checks inspected on hose #2 and #3.",
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
      due_date: new Date(now - 1 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 7 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Supervisor was on emergency shutdown duty; audit rescheduled for morning inspection.",
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
      due_date: new Date(now - 3 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 9 * ONE_DAY_MS).toISOString(),
      completed_at: new Date(now - 4 * ONE_DAY_MS).toISOString(),
      verified_by: "Nayan Moni Phukan (Lead Auditor)",
      verified_at: new Date(now - 3 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Forced air blower installed. H2S recorded at 0.0 ppm. Rescue tripod and harness inspected.",
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
      due_date: new Date(now - 2 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 6 * ONE_DAY_MS).toISOString(),
      completed_at: new Date(now - 2 * ONE_DAY_MS).toISOString(),
      evidence_notes: "4 condemned wire slings scrapped. New certified web slings placed in tool store.",
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
      due_date: new Date(now - 5 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 12 * ONE_DAY_MS).toISOString(),
      completed_at: new Date(now - 6 * ONE_DAY_MS).toISOString(),
      verified_by: "Dr. K. Kalita (Head of Safety, OIL)",
      verified_at: new Date(now - 5 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Jumper removed. Valve stroke test confirmed automatic closure in 1.8 seconds upon signal loss.",
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
      due_date: new Date(now + 5 * ONE_DAY_MS).toISOString().split("T")[0],
      created_at: new Date(now - 2 * ONE_DAY_MS).toISOString(),
      evidence_notes: "Terminal software configured. Field test planned for next tripping schedule.",
    },
  ];

  // Generate realistic initial Audit Log entries
  const auditLogs: AuditLogEntry[] = [
    {
      id: `aud-${uuidv4().slice(0, 8)}`,
      timestamp: new Date(now - 15 * 60000).toISOString(),
      actor_name: "Pooja Saikia",
      actor_role: "HSE Officer",
      action: "CAPA_STATUS_UPDATE",
      entity_type: "action",
      entity_id: actions[1].id,
      details: "Updated status of Hot Work CAPA at Moran GGS to Open; requested atmospheric meter calibration certificate.",
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
      details: "Mathematically classified observation as SIF Precursor (Working at Height, Confidence: 94.2%) via TF-IDF logit scoring.",
      status: "warning",
    },
    {
      id: `aud-${uuidv4().slice(0, 8)}`,
      timestamp: new Date(now - 2 * 3600000).toISOString(),
      actor_name: "Rajesh Baruah",
      actor_role: "Supervisor",
      action: "OBSERVATION_INGESTION",
      entity_type: "observation",
      entity_id: reports[0].id,
      details: "Field observation logged for Duliajan Rig 7 mast scaffolding.",
      status: "success",
    },
    {
      id: `aud-${uuidv4().slice(0, 8)}`,
      timestamp: new Date(now - 5 * 3600000).toISOString(),
      actor_name: "Nayan Moni Phukan",
      actor_role: "HSE Officer",
      action: "CAPA_VERIFICATION",
      entity_type: "action",
      entity_id: actions[4].id,
      details: "Verified Confined Space Tank 3 blower controls at Jorajan CTF. Barrier restored.",
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
      timestamp: new Date(now - 24 * 3600000).toISOString(),
      actor_name: "Dr. K. Kalita",
      actor_role: "Plant Manager",
      action: "DIGEST_GENERATION",
      entity_type: "system",
      entity_id: "weekly-digest-latest",
      details: "Generated and reviewed weekly executive HSE precursor briefing for Oil India Limited management.",
      status: "success",
    },
  ];

  return {
    reports,
    classifications,
    actions,
    auditLogs,
  };
}
