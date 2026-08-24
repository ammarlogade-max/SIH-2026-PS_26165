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

export interface Report {
  id: string;
  raw_text: string;
  site: string;
  activity: string;
  reported_date: string;
  submitting_role: string | null;
  source: "manual" | "bulk_upload";
  embedding?: number[];
  created_at: string;
}

export interface Classification {
  id: string;
  report_id: string;
  layer: "A" | "B";
  is_sif_potential: boolean;
  confidence: number; // 0 to 100
  life_saving_rule: LifeSavingRule | null;
  reasoning_terms: { term: string; weight: number; positive: boolean }[];
  reasoning_narrative?: string | null;
  model_version: string;
  created_at: string;
}

export interface ReportWithClassification extends Report {
  classification?: Classification;
  layer_b_classification?: Classification;
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
  life_saving_rule: LifeSavingRule;
  report_ids: string[];
  detected_at: string;
  narrative: string;
  count: number;
  activity_summary: string;
  severity: "critical" | "high" | "medium";
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
