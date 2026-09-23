// ─── SIF Sentinel Core Types & Data Schema (SRS v3) ─────────────────────────

export type LifeSavingRule =
  | "Energy Isolation"
  | "Hot Work"
  | "Confined Space"
  | "Working at Height"
  | "Line of Fire"
  | "Driving"
  | "Safe Mechanical Lifting"
  | "Bypassing Safety Controls"
  | "Work Authorization";

export const IOGP_LIFE_SAVING_RULES: {
  id: LifeSavingRule;
  title: string;
  description: string;
  icon: string;
  keywords: string[];
}[] = [
  {
    id: "Energy Isolation",
    title: "Energy Isolation",
    description: "Verify isolation and zero energy before work begins. Apply Lockout/Tagout (LOTO) on all electrical, mechanical, and pressure systems.",
    icon: "ZapOff",
    keywords: ["isolation", "loto", "lockout", "tagout", "de-energized", "energized", "live wire", "breaker", "valve closed", "zero energy", "high voltage", "switchgear", "circuit breaker", "bleed off", "residual pressure", "hazardous energy"]
  },
  {
    id: "Hot Work",
    title: "Hot Work",
    description: "Control flammables and ignition sources. Test atmospheric gas levels continuously during cutting, welding, and grinding operations.",
    icon: "Flame",
    keywords: ["welding", "cutting", "grinding", "spark", "hot work", "flammable", "gas test", "lel", "hydrocarbon gas", "gas leak", "combustible", "fire watch", "torch", "brazing", "explosion risk", "flash fire", "fire blanket"]
  },
  {
    id: "Confined Space",
    title: "Confined Space",
    description: "Obtain authorization to enter a confined space. Verify gas testing, continuous ventilation, and dedicated standby person stationed at entry.",
    icon: "Maximize2",
    keywords: ["confined space", "tank entry", "manhole", "vessel entry", "oxygen deficiency", "toxic gas", "h2s", "standby person", "ventilation", "atmosphere test", "entrant", "pit", "sump", "column entry", "sewer", "duct"]
  },
  {
    id: "Working at Height",
    title: "Working at Height",
    description: "Protect yourself against a fall when working at height (above 1.8m). Use 100% tie-off safety harness and inspected scaffolding.",
    icon: "ArrowUpRight",
    keywords: ["working at height", "fall", "harness", "safety harness", "lanyard", "scaffold", "scaffolding", "ladder", "edge protection", "handrail", "toe board", "elevated", "rig floor", "derrick", "monkey board", "fall arrest", "tie-off", "manbasket", "fragile roof"]
  },
  {
    id: "Line of Fire",
    title: "Line of Fire",
    description: "Keep yourself and others out of the line of fire. Position away from moving machinery, pressurized discharge, tensioned lines, and dropped objects.",
    icon: "ShieldAlert",
    keywords: ["line of fire", "dropped object", "under load", "pinch point", "crushed", "flying debris", "pressurized hose", "whipping hose", "snapping line", "winch line", "kelly bushing", "rotary table", "forklift path", "swing radius", "stored energy", "projectile"]
  },
  {
    id: "Driving",
    title: "Driving",
    description: "Follow safe driving rules. Wear seatbelts, respect speed limits, avoid mobile phone usage, and verify vehicle pre-trip inspection.",
    icon: "Truck",
    keywords: ["driving", "vehicle", "seatbelt", "speed limit", "overspeeding", "driver fatigue", "tanker", "convoy", "rollover", "brake failure", "mobile while driving", "journey management", "crane transit", "mud road", "heavy truck", "rough terrain"]
  },
  {
    id: "Safe Mechanical Lifting",
    title: "Safe Mechanical Lifting",
    description: "Plan lifting operations and control the area. Never walk under a suspended load, verify crane capacity, rigging certification, and taglines.",
    icon: "Anchor",
    keywords: ["lifting", "crane", "rigging", "sling", "wire rope", "shackle", "suspended load", "hoist", "crane boom", "lifting plan", "tagline", "rigger", "overloading crane", "chain block", "winch", "pad eye", "spreader bar"]
  },
  {
    id: "Bypassing Safety Controls",
    title: "Bypassing Safety Controls",
    description: "Obtain authorization before overriding or disabling safety controls. Never tamper with ESD trips, relief valves, or interlocks.",
    icon: "AlertTriangle",
    keywords: ["bypass", "interlock", "overriding", "tampering", "esd bypass", "relief valve gag", "safety device bypassed", "override", "jumper wire", "fire alarm disabled", "sensor defeated", "gas detector isolated", "trip defeat", "bridging switch"]
  },
  {
    id: "Work Authorization",
    title: "Work Authorization",
    description: "Work with a valid permit when required (PTW). Confirm that all hazards are assessed and control measures are explained before starting.",
    icon: "FileCheck",
    keywords: ["work permit", "ptw", "permit to work", "unauthorized work", "expired permit", "no permit", "job safety analysis", "jsa", "toolbox talk", "tbt", "risk assessment", "hazard identification", "unauthorized entry", "scope deviation"]
  }
];

// ─── Research-Backed Energy Wheel (CSRA / Dr. Matthew Hallowell) ────────────

export type EnergyCategory =
  | "Gravity"
  | "Motion"
  | "Mechanical"
  | "Electrical"
  | "Pressure"
  | "Temperature"
  | "Chemical"
  | "Radiation"
  | "Sound"
  | "Biological"
  | "UNKNOWN";

export interface EnergyAnalysisResult {
  energy_detected: boolean;
  category: EnergyCategory;
  magnitude: "High-Energy" | "Low-Energy" | "UNKNOWN";
  sourceDetails: string;
  thresholdExceeded: boolean;
  confidence: number;
  energy_evidence: string | null;
}

export interface EnergyWheelItem {
  id: EnergyCategory;
  name: string;
  description: string;
  icon: string;
  highThreshold: string;
  highEnergyThreshold?: string;
  color: string;
  typicalSources: string[];
}

export const CSRA_ENERGY_WHEEL: EnergyWheelItem[] = [
  {
    id: "Gravity",
    name: "Gravity",
    description: "Elevation falls (>1.8m), dropped drill collars, scaffold structural collapse, elevated rigging loads.",
    icon: "ArrowDownCircle",
    highThreshold: "Elevation > 1.8m (6 ft) or suspended objects > 20 kg overhead",
    color: "#f43f5e",
    typicalSources: ["Scaffolding", "Rig mast", "Crane hook", "Elevated grating", "Ladders", "Derrick", "Monkey board"]
  },
  {
    id: "Pressure",
    name: "Pressure",
    description: "High-pressure mud lines (>100 psi), pneumatic hoses, compressed gas cylinders, steam discharge.",
    icon: "Gauge",
    highThreshold: "Piping or hoses > 100 psi, steam lines, or compressed gas cylinders",
    color: "#ec4899",
    typicalSources: ["Mud pumps", "Manifold piping", "Gas cylinders", "Choke lines", "Hydraulic accumulators", "Test separators"]
  },
  {
    id: "Motion",
    name: "Motion",
    description: "Mobile cranes, forklift traffic, pipe haulers, drill stem movement, equipment transit in blind spots.",
    icon: "Activity",
    highThreshold: "Moving vehicles > 5 km/h, mobile crane swing radius, pipe transfer in transit",
    color: "#f97316",
    typicalSources: ["Pipe haulers", "Forklifts", "Crane booms", "Rig trucks", "Supply vehicles", "Mud agitators"]
  },
  {
    id: "Mechanical",
    name: "Mechanical",
    description: "Rotary table draw-in, cathead winches, unguarded drive belts, reciprocating pumps, pinch points.",
    icon: "Cog",
    highThreshold: "Rotating equipment with draw-in pinch hazard or stored mechanical tension",
    color: "#eab308",
    typicalSources: ["Rotary table", "Cathead winch", "Drive belts", "Agitators", "Drawworks", "Kelly bushing"]
  },
  {
    id: "Electrical",
    name: "Electrical",
    description: "High-voltage switchgear, arc flash boundaries, energized MCC panels, damaged feeder cables.",
    icon: "Zap",
    highThreshold: "AC voltage > 50V, DC > 100V, or potential arc flash boundary",
    color: "#8b5cf6",
    typicalSources: ["MCC room", "Substation panels", "Generator skids", "High-voltage cabling", "Transformers"]
  },
  {
    id: "Temperature",
    name: "Temperature",
    description: "Thermal extremes, uninsulated steam lines, flare tip radiation, molten slag, cryogenic fluids.",
    icon: "Flame",
    highThreshold: "Surfaces > 60°C (140°F) or < -20°C (cryogenic), flare thermal radiation",
    color: "#ef4444",
    typicalSources: ["Boiler lines", "Turbine exhausts", "Flare headers", "Steam purges", "Welding arcs"]
  },
  {
    id: "Chemical",
    name: "Chemical",
    description: "Toxic H2S sour gas, hydrocarbon vapor (LEL), acid stimulation fluid, caustic drilling mud.",
    icon: "FlaskConical",
    highThreshold: "Atmospheric LEL > 10%, H2S > 10 ppm, or corrosive acid splashing",
    color: "#10b981",
    typicalSources: ["Separator gas", "Drilling fluid tanks", "H2S sour wells", "Solvents", "Corrosion inhibitors"]
  },
  {
    id: "Radiation",
    name: "Radiation",
    description: "Pipeline weld radiography (Ir-192/Co-60), wireline logging sources, NORM scale deposits.",
    icon: "Radio",
    highThreshold: "Industrial radiography gamma sources or unshielded NORM scale in vessels",
    color: "#06b6d4",
    typicalSources: ["Pipeline X-ray NDT", "Wireline logging tools", "Separator vessel scale"]
  },
  {
    id: "Sound",
    name: "Sound",
    description: "Acoustic trauma, high-pressure emergency depressurization vents, gas compressor manifolds.",
    icon: "Volume2",
    highThreshold: "Acoustic pressure > 115 dB peak or continuous > 85 dB without suppression",
    color: "#6366f1",
    typicalSources: ["Emergency blowdown vents", "Gas compressors", "Turbines", "Grit blasting"]
  },
  {
    id: "Biological",
    name: "Biological",
    description: "Remote jungle wellhead fauna (venomous snakes), waterborne vectors in remote Assam fields.",
    icon: "ShieldAlert",
    highThreshold: "Venomous fauna in jungle wellhead perimeters or potable water contamination",
    color: "#84cc16",
    typicalSources: ["Remote Assam jungle wellheads", "Camp water supply", "Sewage treatment units"]
  }
];

// ─── Mandatory SIH26165 Safety Event Types ─────────────────────────────────

export type SafetyEventType =
  | "Unsafe Act"
  | "Unsafe Condition"
  | "Near-Miss"
  | "Incident"
  | "Unknown";

/**
 * Controlled normalization for safety event types.
 * Avoids broad substring matches that trigger false positives on normal words (e.g. "act" matching "activity" or "contact").
 * Fallback is explicitly "Unknown" unless specified otherwise.
 */
export function normalizeSafetyEventType(input?: string | null, fallback: SafetyEventType = "Unknown"): SafetyEventType {
  if (!input) return fallback;
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // Controlled exact or standard token comparisons
  if (
    lower === "ua" ||
    lower === "unsafe act" ||
    lower === "unsafe-act" ||
    lower === "unsafe_act" ||
    lower === "unsafe action"
  ) {
    return "Unsafe Act";
  }

  if (
    lower === "uc" ||
    lower === "unsafe condition" ||
    lower === "unsafe-condition" ||
    lower === "unsafe_condition"
  ) {
    return "Unsafe Condition";
  }

  if (
    lower === "near miss" ||
    lower === "near-miss" ||
    lower === "near_miss" ||
    lower === "nearmiss" ||
    lower === "nm"
  ) {
    return "Near-Miss";
  }

  if (
    lower === "incident" ||
    lower === "accident" ||
    lower === "incident report" ||
    lower === "incident_report" ||
    lower === "actual incident"
  ) {
    return "Incident";
  }

  // Word-boundary phrase checks for narrative fallback inference
  if (/\b(unsafe[\s_-]?act|bypassed safety|failed to wear|unauthorized operation|tampered with)\b/i.test(trimmed)) {
    return "Unsafe Act";
  }
  if (/\b(unsafe[\s_-]?condition|corroded pipe|spill on floor|missing handrail|fume leak|defective valve)\b/i.test(trimmed)) {
    return "Unsafe Condition";
  }
  if (/\b(near[\s_-]?miss|narrowly missed|almost hit|dropped object caught|close call)\b/i.test(trimmed)) {
    return "Near-Miss";
  }
  if (/\b(incident|accident|injury|first aid|medical treatment|lost time|rupture occurred|fire erupted)\b/i.test(trimmed)) {
    return "Incident";
  }

  return fallback;
}

export const inferSafetyEventType = normalizeSafetyEventType;

// ─── Critical Barrier State Model ──────────────────────────────────────────

export type BarrierState =
  | "EFFECTIVE"
  | "DEGRADED"
  | "FAILED"
  | "MISSING"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

// ─── Precursor Trajectory & Convergence ────────────────────────────────────

export type PrecursorTrajectory =
  | "ISOLATED"
  | "RECURRING"
  | "ESCALATING"
  | "PERSISTENT"
  | "POST_CAPA_RECURRENCE";

// ─── Temporal Direction & Recurrence Status ────────────────────────────────
export type TemporalDirection = "INCREASING" | "STABLE" | "DECREASING" | "INSUFFICIENT_DATA";

export type RecurrenceStatus = "NONE" | "POSSIBLE" | "CONFIRMED" | "POST_CAPA_RECURRENCE";

// ─── CAPA Effectiveness States ─────────────────────────────────────────────

export type CAPAEffectiveness =
  | "PROPOSED"
  | "IMPLEMENTED"
  | "VERIFIED_CLOSED"
  | "MONITORING"
  | "EFFECTIVE"
  | "INEFFECTIVE_RECURRENCE_DETECTED"
  | "pending_verification"
  | "monitoring"
  | "effective"
  | "verified_effective"
  | "ineffective"
  | "verified_ineffective"
  | "recurred_post_closure";

// ─── Multi-Label IOGP Rule Mapping Model ───────────────────────────────────

export interface IOGPRuleMapping {
  rule: LifeSavingRule;
  score: number;
  confidence_tier: "high" | "moderate" | "low";
  evidence_terms: string[];
  evidence_span?: string | null;
  mapping_method: "keyword" | "centroid" | "hybrid" | "manual";
  mapping_version: string;
}

// ─── Structured SIF Pathway Model ──────────────────────────────────────────

export type PathwayStageStatus = "SUPPORTED" | "INFERRED" | "UNKNOWN";

export interface SIFPathwayStage {
  stage?: string;
  value: string | null;
  evidence: string | null;
  evidence_span?: string | null;
  status: PathwayStageStatus;
}

export interface SIFPathway {
  hazard: SIFPathwayStage;
  energy: SIFPathwayStage;
  critical_barrier: SIFPathwayStage;
  barrier_state: SIFPathwayStage;
  worker_exposure: SIFPathwayStage;
  potential_consequence: SIFPathwayStage;
  credible_sif_scenario?: string | null;
  evidence_text?: string | null;
  // Top-level values for backwards-compatible views
  hazard_val?: string;
  energy_category?: EnergyCategory;
  energy_magnitude?: "High-Energy" | "Low-Energy" | "UNKNOWN";
  critical_barrier_val?: string;
  barrier_state_val?: BarrierState;
}

// ─── Hierarchy of Controls & Direct Barrier Assessment ───────────────────────

export type ControlHierarchyLevel =
  | "Elimination"
  | "Substitution"
  | "Engineering / Direct Control"
  | "Administrative"
  | "PPE";

export type DirectControlStatus = "absent" | "failed" | "bypassed" | "intact" | "unknown";

export interface BarrierAssessment {
  compromised_level: ControlHierarchyLevel;
  direct_control_status: DirectControlStatus;
  barrier_state?: BarrierState;
  barrier_description: string;
  identified_barrier?: string | null;
  reliability_score: number; // 0 to 100
  control_reliability?: number;
  hierarchy_rank: number; // 1 (best: Elimination) to 5 (weakest: PPE)
  weak_control_flag?: boolean;
  recommended_direct_control?: string;
  evidence_span?: string | null;
  evidence_status?: "SUPPORTED" | "INFERRED" | "UNKNOWN";
}

// ─── SIF Decision Gates (Energy–Barrier–Exposure Diagnostic) ──────────────────

export interface SIFDecisionGateEvaluation {
  gate1_high_energy: boolean;
  gate1_status: "SUPPORTED" | "INFERRED" | "NOT_FOUND" | "UNKNOWN";
  gate1_evidence: string | null;
  gate1_details: string;
  gate2_direct_control?: boolean;
  gate2_direct_control_compromised: boolean;
  gate2_status: "SUPPORTED" | "INFERRED" | "NOT_FOUND" | "UNKNOWN";
  gate2_evidence: string | null;
  gate2_details: string;
  gate3_line_of_fire_intersected: boolean;
  gate3_status: "SUPPORTED" | "INFERRED" | "NOT_FOUND" | "UNKNOWN";
  gate3_evidence: string | null;
  gate3_details: string;
  is_sif_potential?: boolean;
  decision_verdict: "Diagnostic: Non-SIF Precursor" | "Diagnostic: SIF Precursor" | "Diagnostic: High Exposure / Major Event";
  diagnostic_confidence?: number;
}

/**
 * Backward-compatibility alias for legacy code referencing CampbellGateEvaluation.
 */
export type CampbellGateEvaluation = SIFDecisionGateEvaluation;

// ─── Shift Handover & Circadian Fatigue Risk ────────────────────────────────

export type ShiftTiming = "morning_handover" | "day_shift" | "evening_handover" | "night_shift" | "standard";
export type CircadianRiskTier = "circadian_low" | "handover_window" | "standard";

export interface Report {
  id: string;
  event_type: SafetyEventType;
  source_id?: string;
  raw_text: string;
  normalized_text?: string;
  site: string;
  facility?: string;
  area?: string;
  specific_location?: string;
  activity: string;
  task?: string;
  equipment?: string;
  work_type?: string;
  reported_date: string;
  occurred_at?: string;
  observed_at?: string;
  shift_timing?: ShiftTiming;
  circadian_risk_tier?: CircadianRiskTier;
  submitting_role: string | null;
  source: "manual" | "bulk_upload" | "historical_import";
  embedding?: number[];
  created_at: string;
  updated_at?: string;
}

export type SafetyEvent = Report; // Canonical alias

export interface Classification {
  id: string;
  report_id: string;
  layer: "A" | "B";
  is_sif_potential: boolean;
  sif_prediction: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
  sif_probability: number; // Raw float [0.0 - 1.0]
  ml_sif_probability?: number;
  ml_prediction?: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
  calibration_status?: "uncalibrated_model_probability" | "calibrated";
  review_required: boolean;
  review_reason?: string;
  review_status?: "AUTO_CLASSIFIED" | "REVIEW_REQUIRED" | "CONFIRMED_SIF" | "CONFIRMED_NON_SIF" | "OVERRIDDEN";
  confidence: number; // Percentage [0 to 100] (un-clamped)
  operational_priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  safety_science_assessment?: {
    energy_category: EnergyCategory;
    energy_magnitude: "High-Energy" | "Low-Energy" | "UNKNOWN";
    barrier_state: BarrierState;
    decision_verdict: string;
  };
  life_saving_rule: LifeSavingRule | null;
  all_rules?: any;
  rule_mappings?: IOGPRuleMapping[];
  reasoning_terms: { term: string; weight: number; positive: boolean }[];
  reasoning_narrative?: string | null;
  model_name?: string;
  model_version: string;
  feature_version?: string;
  created_at: string;
  // Research-backed features:
  barrier_status?: any;
  energy_category?: EnergyCategory | null;
  energy_magnitude?: "High-Energy" | "Low-Energy" | "UNKNOWN";
  energy_detected?: boolean;
  energy_evidence?: string | null;
  energy_source_details?: string;
  barrier_assessment?: BarrierAssessment;
  sif_pathway?: SIFPathway | any;
  sif_decision_gates?: SIFDecisionGateEvaluation;
  /** @deprecated Use sif_decision_gates */
  campbell_gates?: CampbellGateEvaluation;
  shift_risk_multiplier?: number;
  human_reviewed?: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  override_reason?: string;
  review_version?: number;
  review_history?: HumanReviewRecord[];
  evidence_span?: string;
  machine_evaluation?: {
    is_sif_potential: boolean;
    sif_prediction: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
    sif_probability?: number;
    life_saving_rule?: LifeSavingRule | null;
    rule_mappings?: IOGPRuleMapping[];
  };
  human_evaluation?: {
    is_sif_potential: boolean;
    sif_prediction: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
    life_saving_rule?: LifeSavingRule | null;
    override_reason?: string;
    review_notes?: string;
  };
  original_sif_prediction?: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
  original_sif_probability?: number;
  original_is_sif?: boolean;
  original_rule?: LifeSavingRule | null;
  original_model_version?: string;
  original_rule_mappings?: IOGPRuleMapping[];
}

export interface HumanReviewRecord {
  id: string;
  report_id: string;
  classification_id: string;
  review_version: number;
  reviewer_id?: string;
  reviewer_name: string;
  reviewer_role: UserRole;
  original_prediction: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
  reviewed_prediction: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
  original_probability?: number;
  original_sif_probability?: number;
  original_rule: LifeSavingRule | null;
  reviewed_rule: LifeSavingRule | null;
  original_is_sif: boolean;
  reviewed_is_sif: boolean;
  override_flag?: boolean;
  original_model_version?: string;
  original_iogp_mappings?: IOGPRuleMapping[];
  original_rule_mappings?: IOGPRuleMapping[];
  original_reasoning?: string | null;
  final_decision?: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
  rationale: string;
  review_reason?: string;
  review_notes?: string;
  review_timestamp?: string;
  machine_evaluation?: {
    is_sif_potential: boolean;
    sif_prediction: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
    sif_probability?: number;
    life_saving_rule?: LifeSavingRule | null;
  };
  human_evaluation?: {
    is_sif_potential: boolean;
    sif_prediction: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
    life_saving_rule?: LifeSavingRule | null;
    override_reason?: string;
  };
  status: "ACCEPTED" | "OVERRIDDEN" | "ESCALATED";
  created_at: string;
}

export interface HumanReview {
  status: "Pending" | "Confirmed" | "Overridden";
  decision?: "AI_ACCEPTED" | "AI_OVERRIDDEN" | "MANUAL_CLASSIFICATION" | "NEEDS_MORE_INFORMATION";
  reviewed_by?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  notes?: string;
  original_ai_sif?: boolean;
  original_ai_rule?: LifeSavingRule | null;
  override_sif?: boolean;
  override_rule?: LifeSavingRule | null;
}

export interface ReportWithClassification extends Report {
  classification?: Classification;
  layer_b_classification?: Classification;
  human_review?: HumanReview;
  action_status?: "No Action" | "Action Drafted" | "Action Assigned" | "Verified";
}

export interface SiteActivityAggregate {
  id: string;
  site: string;
  activity: string;
  period_start: string;
  period_end: string;
  total_reports: number;
  sif_reports: number;
  precursor_density: number; // percentage: (sif_reports / total_reports) * 100
  trend_delta: number; // change in density from prior period
  primary_rule?: LifeSavingRule | null;
}

export interface PatternCallout {
  id: string;
  site: string;
  facility?: string;
  activity?: string;
  specific_location?: string;
  barrier_compromised?: string;
  barrier_state?: BarrierState;
  life_saving_rule: LifeSavingRule;
  event_types?: SafetyEventType[];
  report_ids: string[];
  detected_at: string;
  first_observed_at?: string;
  last_observed_at?: string;
  time_window_days?: number;
  narrative: string;
  count: number;
  sif_count?: number;
  activity_summary: string;
  severity: "critical" | "high" | "medium";
  trajectory?: PrecursorTrajectory;
  temporal_trend?: string;
  recommended_intervention?: string;
  linked_capa_id?: string;
  has_recurrence_alert?: boolean;
}

export type UserRole =
  | "Field Observer"
  | "HSE Officer"
  | "Supervisor"
  | "Plant Manager"
  | "Admin";

export interface CorrectiveAction {
  id: string;
  report_id?: string;
  pattern_id?: string;
  site: string;
  activity?: string;
  barrier_compromised?: string;
  life_saving_rule: LifeSavingRule;
  title: string;
  description: string;
  assigned_to: string;
  assigned_role: UserRole;
  priority: "immediate" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "overdue" | "closed_pending_verification" | "completed" | "verified";
  due_date: string;
  created_at: string;
  completed_at?: string;
  verified_by?: string;
  verified_at?: string;
  evidence_notes?: string;
  // Research-backed control hierarchy & barrier engineering:
  control_hierarchy?: ControlHierarchyLevel;
  hierarchy_level?: ControlHierarchyLevel;
  control_rank?: number;
  direct_control_type?: string;
  weak_control_warning?: boolean; // Set to true if SIF precursor is assigned weak Level 4/5 Administrative or PPE control
  // Post-closure recurrence tracking:
  monitoring_window_days?: number;
  post_closure_monitoring_active?: boolean;
  effectiveness_status?: CAPAEffectiveness;
  effectiveness_evidence?: string;
  effectiveness_reviewed_by?: string;
  effectiveness_reviewed_at?: string;
  recurrence_detected?: boolean;
  recurrence_detected_at?: string;
  recurrence_report_id?: string;
  post_closure_event_count?: number;
}

export interface AuditLogEntry {
  id: string;
  sequence_number?: number;
  timestamp: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  entity_type: "observation" | "classification" | "pattern" | "action" | "system" | "model" | "review";
  entity_id: string;
  details: string;
  status: "success" | "warning" | "error";
  previous_hash?: string;
  current_hash?: string;
  model_version?: string;
}

export interface FacilitySummary {
  id: string;
  name: string;
  code: string;
  type: string;
  location: string;
  total_reports: number;
  sif_reports: number;
  precursor_density: number;
  primary_rule: LifeSavingRule | null;
  active_patterns_count: number;
  open_actions_count: number;
  safety_score: number; // 0 - 100
  risk_level: "critical" | "elevated" | "controlled";
  trend_direction: "increasing" | "stable" | "decreasing" | "insufficient_data";
  is_development_fixture?: boolean;
  // Research-backed Cumulative Exposure Index (CEI - EPRI model):
  cumulative_exposure_index: number; // 0 to 100 CEI score
  cei?: number;
  cei_status: "controlled" | "elevated" | "critical_storm";
  velocity_14d: number; // Number of SIF precursor reports in rolling 14 days
  precursor_cluster_storm: boolean; // True if >= 3 precursors detected in 14 days
  cluster_storm?: boolean;
  dominant_energy_category?: EnergyCategory | null;
  dominant_energy?: EnergyCategory | null;
  direct_barrier_failure_rate?: number; // Percentage of precursors where an engineered control failed
  weak_control_count?: number;
}

export interface ModelMetrics {
  model_name: string;
  layer: "A" | "B";
  framework: string;
  architecture: string;
  dataset_size: number;
  train_size: number;
  test_size: number;
  sif_base_rate_percent: number;
  metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    accuracy: number;
    specificity: number;
    roc_auc: number;
  };
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
  rule_classification_metrics: {
    macro_precision: number | null;
    macro_recall: number | null;
    macro_f1: number | null;
    rules: {
      rule: LifeSavingRule;
      precision: number | null;
      recall: number | null;
      f1_score: number | null;
      support: number;
      insufficient_test_data?: boolean;
    }[];
  };
  top_sif_features: { term: string; coefficient: number }[];
  top_non_sif_features: { term: string; coefficient: number }[];
  last_evaluated_at: string;
}

export interface WeeklyHseDigest {
  id: string;
  period_start: string;
  period_end: string;
  total_reports: number;
  total_sif_precursors: number;
  overall_precursor_density: number;
  top_risk_sites: {
    site: string;
    sif_count: number;
    density: number;
    primary_rule: LifeSavingRule;
  }[];
  active_patterns_count: number;
  executive_summary: string;
  suggested_interventions: {
    rule: LifeSavingRule;
    site: string;
    action: string;
    priority: "immediate" | "high" | "scheduled";
  }[];
  generated_at: string;
}
