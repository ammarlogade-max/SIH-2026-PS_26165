import {
  EnergyCategory,
  CSRA_ENERGY_WHEEL,
  ControlHierarchyLevel,
  BarrierAssessment,
  CampbellGateEvaluation,
  ShiftTiming,
  CircadianRiskTier,
  LifeSavingRule,
  Report,
  Classification,
} from "./types";

// ─── Keyword maps for the CSRA Energy Wheel Categories ───────────────────

const ENERGY_KEYWORD_MAP: Record<Exclude<EnergyCategory, "UNKNOWN">, { highEnergyKeywords: string[]; generalKeywords: string[] }> = {
  Gravity: {
    highEnergyKeywords: [
      "fall from height", "working at height", "above 1.8", "above 2", "scaffold", "scaffolding",
      "derrick", "mast", "monkey board", "harness unclipped", "fall arrest", "dropped object",
      "suspended load", "falling pipe", "crane hook", "hoist", "unsecured grating", "floor opening"
    ],
    generalKeywords: ["ladder", "staircase", "slip", "trip", "stairs", "stepping", "handrail", "platform"]
  },
  Pressure: {
    highEnergyKeywords: [
      "high pressure", "100 psi", "bar", "hydraulic line", "burst hose", "pressurized",
      "relief valve", "pop-off", "manifold", "choke manifold", "gas cylinder", "compressor discharge",
      "whipping hose", "accumulator", "blowout", "steam line", "boiler", "bleed off"
    ],
    generalKeywords: ["hose", "air line", "pneumatic", "gauge", "valve", "pressure test", "bleed"]
  },
  Motion: {
    highEnergyKeywords: [
      "crane boom", "crane swing", "forklift", "pipe hauler", "heavy truck", "vehicle rollover",
      "overspeeding", "blind spot", "pedestrian", "transit", "rig move", "skid move", "suspended pipe"
    ],
    generalKeywords: ["vehicle", "driving", "driving seatbelt", "cart", "pickup", "moving equipment"]
  },
  Mechanical: {
    highEnergyKeywords: [
      "rotary table", "cathead", "winch drum", "rescue winch", "winch", "drawworks", "rotating shaft", "pinch point",
      "draw in", "entanglement", "crushing", "unguarded pulley", "drive belt", "sprocket", "chain block"
    ],
    generalKeywords: ["gear", "lever", "lathe", "grinder", "mechanical", "power tool", "hand tool", "coupling"]
  },
  Electrical: {
    highEnergyKeywords: [
      "high voltage", "415v", "11kv", "33kv", "arc flash", "substation", "transformer",
      "mcc panel", "switchgear", "live wire", "energized busbar", "breaker trip", "loto bypass"
    ],
    generalKeywords: ["electrical", "cable", "breaker", "socket", "earthing", "grounding", "lighting", "plug"]
  },
  Temperature: {
    highEnergyKeywords: [
      "steam leak", "flare header", "flare tip", "welding torch", "hot slag", "cryogenic",
      "liquid nitrogen", "thermal burn", "molten metal", "open flame near tank", "hot surface > 70"
    ],
    generalKeywords: ["hot work", "welding", "cutting", "grinding", "heater", "exhaust", "heat exhaustion"]
  },
  Chemical: {
    highEnergyKeywords: [
      "h2s", "sour gas", "lel", "hydrocarbon gas", "gas leak", "flammable atmosphere",
      "toxic vapor", "acid wash", "corrosive spill", "benzene", "confined space gas", "oxygen deficiency",
      "atmospheric gas", "crude storage", "crude tank", "gas testing", "toxic gas"
    ],
    generalKeywords: ["chemical", "drilling mud", "solvent", "cleaning fluid", "fuel", "diesel spill", "lubricant", "crude"]
  },
  Radiation: {
    highEnergyKeywords: [
      "radiography", "gamma source", "ir-192", "co-60", "x-ray crawl", "wireline source",
      "norm scale", "radioactive isotope", "dosimeter alarm"
    ],
    generalKeywords: ["ndt inspection", "radiation badge", "pipe inspection", "norm survey"]
  },
  Sound: {
    highEnergyKeywords: [
      "emergency blowdown", "acoustic rupture", "high noise >115", "compressor scream",
      "steam vent explosion noise", "unmuffled exhaust"
    ],
    generalKeywords: ["noisy", "hearing protection", "earplugs", "generator noise", "loud area"]
  },
  Biological: {
    highEnergyKeywords: [
      "venomous snake", "viper", "cobra at wellsite", "swamp pit contaminated", "sewage overflow"
    ],
    generalKeywords: ["insect", "mosquito", "jungle vegetation", "camp food", "water filter"]
  }
};

// ─── 1. Detect Energy Wheel Category & Magnitude ────────────────────────────

export function analyzeEnergyWheel(text: string, rule: LifeSavingRule | null): {
  category: EnergyCategory;
  magnitude: "High-Energy" | "Low-Energy" | "UNKNOWN";
  sourceDetails: string;
  thresholdExceeded: boolean;
  confidence: number;
  energy_evidence: string | null;
  energy_detected: boolean;
} {
  const lower = text.toLowerCase();
  const scores: { category: Exclude<EnergyCategory, "UNKNOWN">; score: number; isHigh: boolean; matchedKeyword: string }[] = [];

  for (const item of CSRA_ENERGY_WHEEL) {
    if (item.id === "UNKNOWN") continue;
    const map = ENERGY_KEYWORD_MAP[item.id as Exclude<EnergyCategory, "UNKNOWN">];
    if (!map) continue;
    let catScore = 0;
    let highTriggered = false;
    let topWord = "";

    // Check high-energy keywords (weight 3.5)
    for (const kw of map.highEnergyKeywords) {
      if (lower.includes(kw)) {
        catScore += 3.5;
        highTriggered = true;
        if (!topWord) topWord = kw;
      }
    }

    // Check general keywords (weight 1.0)
    for (const kw of map.generalKeywords) {
      if (lower.includes(kw)) {
        catScore += 1.0;
        if (!topWord) topWord = kw;
      }
    }

    if (catScore > 0) {
      scores.push({ category: item.id as Exclude<EnergyCategory, "UNKNOWN">, score: catScore, isHigh: highTriggered, matchedKeyword: topWord });
    }
  }

  // If no explicit energy keywords or concepts exist in text:
  // Strictly return UNKNOWN. Never infer high energy solely because a Life-Saving Rule was mapped.
  if (scores.length === 0) {
    return {
      category: "UNKNOWN",
      magnitude: "UNKNOWN",
      sourceDetails: "Energy source undetermined from narrative",
      thresholdExceeded: false,
      confidence: 0,
      energy_evidence: null,
      energy_detected: false,
    };
  }

  // Pick highest scoring energy category
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const itemDef = CSRA_ENERGY_WHEEL.find((w) => w.id === best.category);

  const magnitude: "High-Energy" | "Low-Energy" = best.isHigh || best.score >= 3.0 ? "High-Energy" : "Low-Energy";
  const sourceDetails = best.matchedKeyword
    ? `${itemDef?.name || best.category} hazard detected via "${best.matchedKeyword}" (${itemDef?.highThreshold || "threshold"})`
    : `Identified ${itemDef?.name || best.category} energy source`;

  let energyEvidence: string | null = null;
  if (best.matchedKeyword) {
    const idx = lower.indexOf(best.matchedKeyword);
    if (idx !== -1) {
      energyEvidence = text.substring(idx, idx + best.matchedKeyword.length);
    }
  }

  return {
    category: best.category,
    magnitude,
    sourceDetails,
    thresholdExceeded: magnitude === "High-Energy",
    confidence: Math.min(98, Math.round(75 + best.score * 5)),
    energy_evidence: energyEvidence,
    energy_detected: true,
  };
}

// ─── 2. Evaluate Control Hierarchy & Direct Barrier Status ───────────────────
// Independently extracts barrier conditions from textual evidence WITHOUT circular dependency on SIF status.

export function evaluateBarrierStatus(text: string, ruleHint?: LifeSavingRule | null): BarrierAssessment {
  const lower = text.toLowerCase();

  // Check for physical / engineered bypass
  const bypassKeywords = ["bypass", "override", "disabled", "jumper", "disconnected", "defeated", "gagged", "tampered"];
  const matchedBypass = bypassKeywords.find((kw) => lower.includes(kw));
  if (matchedBypass) {
    const idx = lower.indexOf(matchedBypass);
    const evidence_span = idx !== -1 ? text.substring(idx, idx + matchedBypass.length) : null;
    return {
      compromised_level: "Engineering / Direct Control",
      direct_control_status: "bypassed",
      barrier_state: "FAILED",
      identified_barrier: "Engineered Interlock / Pressure Relief / Trip System",
      barrier_description: "Physical safety interlock, relief device, or engineered protection intentionally bypassed",
      reliability_score: 15,
      hierarchy_rank: 3,
      weak_control_flag: false,
      recommended_direct_control: "Enforce Management of Change (MOC) protocol and restore hardwired interlocks",
      evidence_span,
      evidence_status: "SUPPORTED",
    };
  }

  // Check for absent engineered control (scaffolding missing rails, uninsulated cables, no barrier)
  const absentKeywords = [
    "no guardrail", "missing toe board", "no lock", "no loto", "missing barricade",
    "no gas detector", "without atmospheric", "without gas", "no rescue winch",
    "without rescue winch", "no whip check", "without whip check", "unsecured",
    "no tether", "without harness", "no harness", "without tie-off", "unclipped"
  ];
  const matchedAbsent = absentKeywords.find((kw) => lower.includes(kw));
  if (matchedAbsent) {
    const idx = lower.indexOf(matchedAbsent);
    const evidence_span = idx !== -1 ? text.substring(idx, idx + matchedAbsent.length) : null;
    
    // Tailor barrier identification specifically to the matched safeguard
    let specificBarrier = "Physical Safeguard / Barrier";
    if (matchedAbsent.includes("guardrail") || matchedAbsent.includes("toe board") || matchedAbsent.includes("barricade")) {
      specificBarrier = "Guardrail / Edge Barricade";
    } else if (matchedAbsent.includes("lock") || matchedAbsent.includes("loto")) {
      specificBarrier = "LOTO Lockout Isolation";
    } else if (matchedAbsent.includes("gas") || matchedAbsent.includes("atmospheric")) {
      specificBarrier = "Atmospheric Gas Detection";
    } else if (matchedAbsent.includes("rescue winch")) {
      specificBarrier = "Confined Space Rescue System";
    } else if (matchedAbsent.includes("whip check")) {
      specificBarrier = "Hose Whip Check Safety Cable";
    } else if (matchedAbsent.includes("harness") || matchedAbsent.includes("tie-off") || matchedAbsent.includes("tether") || matchedAbsent.includes("unclipped") || matchedAbsent.includes("unsecured")) {
      specificBarrier = "Fall Arrest Harness / Tie-Off";
    }

    return {
      compromised_level: "Engineering / Direct Control",
      direct_control_status: "absent",
      barrier_state: "MISSING",
      identified_barrier: specificBarrier,
      barrier_description: `Physical barrier (${specificBarrier}) was completely absent at work location`,
      reliability_score: 10,
      hierarchy_rank: 3,
      weak_control_flag: false,
      recommended_direct_control: "Install certified physical containment barriers or 100% positive mechanical isolations",
      evidence_span,
      evidence_status: "SUPPORTED",
    };
  }

  // Check for mechanical/equipment failure or physical degradation
  const degradedKeywords = [
    "frayed", "corroded", "cracked", "failed", "malfunction", "leaking", "broken",
    "damaged sling", "worn", "pinhole"
  ];
  const matchedDegraded = degradedKeywords.find((kw) => lower.includes(kw));
  if (matchedDegraded) {
    const idx = lower.indexOf(matchedDegraded);
    const evidence_span = idx !== -1 ? text.substring(idx, idx + matchedDegraded.length) : null;

    let specificDegradedBarrier = "Engineered Safeguard";
    if (matchedDegraded.includes("sling")) {
      specificDegradedBarrier = "Lifting Sling / Rigging Hardware";
    } else if (matchedDegraded.includes("leaking") || matchedDegraded.includes("pinhole")) {
      specificDegradedBarrier = "Pressure Piping / Seal Containment";
    } else if (matchedDegraded.includes("frayed")) {
      specificDegradedBarrier = "Wireline / Hoisting Cable";
    } else {
      specificDegradedBarrier = "Mechanical Equipment / Safeguard";
    }

    return {
      compromised_level: "Engineering / Direct Control",
      direct_control_status: "failed",
      barrier_state: "DEGRADED",
      identified_barrier: specificDegradedBarrier,
      barrier_description: `Engineered barrier (${specificDegradedBarrier}) degraded or structurally failed during operation`,
      reliability_score: 25,
      hierarchy_rank: 3,
      weak_control_flag: false,
      recommended_direct_control: "Perform immediate non-destructive testing (NDT), tag out and replace defective equipment",
      evidence_span,
      evidence_status: "SUPPORTED",
    };
  }

  // Administrative / Permit deficiencies
  const adminKeywords = [
    "expired permit", "permit", "ptw", "unauthorized", "toolbox", "jsa", "briefing", "procedure"
  ];
  const matchedAdmin = adminKeywords.find((kw) => lower.includes(kw));
  if (matchedAdmin) {
    const idx = lower.indexOf(matchedAdmin);
    const evidence_span = idx !== -1 ? text.substring(idx, idx + matchedAdmin.length) : null;
    return {
      compromised_level: "Administrative",
      direct_control_status: "failed",
      barrier_state: "DEGRADED",
      identified_barrier: "Work Authorization (PTW) / JSA Risk Assessment",
      barrier_description: "Administrative PTW, procedural sign-off, or risk assessment discrepancy",
      reliability_score: 45,
      hierarchy_rank: 4,
      weak_control_flag: true,
      recommended_direct_control: "Elevate to physical lockout or automated permit interlock rather than administrative reliance alone",
      evidence_span,
      evidence_status: "SUPPORTED",
    };
  }

  // PPE deficiencies
  const ppeKeywords = ["ppe", "gloves", "safety glasses", "helmet", "earplugs", "boots"];
  const matchedPpe = ppeKeywords.find((kw) => lower.includes(kw));
  if (matchedPpe) {
    const idx = lower.indexOf(matchedPpe);
    const evidence_span = idx !== -1 ? text.substring(idx, idx + matchedPpe.length) : null;
    return {
      compromised_level: "PPE",
      direct_control_status: "failed",
      barrier_state: "DEGRADED",
      identified_barrier: "Personal Protective Equipment",
      barrier_description: "Personal Protective Equipment compliance issue (lowest control hierarchy tier)",
      reliability_score: 20,
      hierarchy_rank: 5,
      weak_control_flag: true,
      recommended_direct_control: "Implement engineering elimination or physical machine guarding to eliminate worker exposure at source",
      evidence_span,
      evidence_status: "SUPPORTED",
    };
  }

  // Check for explicitly verified effective barriers reported in observation text
  const intactKeywords = [
    "barrier intact", "guardrail intact", "scaffolding inspected", "barricade in place",
    "interlock functioned", "relief valve popped as designed", "safely contained",
    "esd activated correctly", "loto verified"
  ];
  const matchedIntact = intactKeywords.find((kw) => lower.includes(kw));
  if (matchedIntact) {
    const idx = lower.indexOf(matchedIntact);
    const evidence_span = idx !== -1 ? text.substring(idx, idx + matchedIntact.length) : null;
    return {
      compromised_level: "Engineering / Direct Control",
      direct_control_status: "intact",
      barrier_state: "EFFECTIVE",
      identified_barrier: "Verified Engineered Safeguard",
      barrier_description: "Engineered safeguards and containment verified active during operation",
      reliability_score: 90,
      hierarchy_rank: 3,
      weak_control_flag: false,
      evidence_span,
      evidence_status: "SUPPORTED",
    };
  }

  // If no barrier evidence was reported: state MUST be UNKNOWN, identified_barrier MUST be null
  return {
    compromised_level: "Engineering / Direct Control",
    direct_control_status: "unknown",
    barrier_state: "UNKNOWN",
    identified_barrier: null,
    barrier_description: "No explicit barrier condition reported in observation text",
    reliability_score: 50,
    hierarchy_rank: 3,
    weak_control_flag: false,
    recommended_direct_control: "Verify barrier integrity and physical controls for this task",
    evidence_span: null,
    evidence_status: "UNKNOWN",
  };
}

// ─── 3. SIF Decision Gates (Energy–Barrier–Exposure Analysis) ──────────────
// Decoupled diagnostic evaluation of energy, barrier, and line-of-fire presence.

export function evaluateSIFDecisionGates(
  arg1: any,
  arg2: any,
  arg3?: any,
  arg4?: any
): import("@/lib/types").SIFDecisionGateEvaluation & {
  gate2_direct_control: boolean;
  is_sif_potential: boolean;
} {
  // Pattern detection:
  // Pattern A (Test 4): (ruleOrText, magnitude: "High-Energy"|"Low-Energy", barrierStatusStr, text)
  // Pattern B (layer-a-classifier): (text, energyCategory, energyMagnitude, barrierAssessmentObj)
  let text = "";
  let energyCategory: EnergyCategory = "UNKNOWN";
  let energyMagnitude: "High-Energy" | "Low-Energy" | "UNKNOWN" = "UNKNOWN";
  let isCompromised = false;
  let isUnknownBarrier = false;
  let barrierAssessment: BarrierAssessment | null = null;

  if (arg2 === "High-Energy" || arg2 === "Low-Energy" || arg2 === "UNKNOWN") {
    // Pattern A
    energyMagnitude = arg2;
    text = typeof arg4 === "string" ? arg4 : typeof arg1 === "string" ? arg1 : "";
    if (typeof arg1 === "string" && CSRA_ENERGY_WHEEL.some((w) => w.id === arg1)) {
      energyCategory = arg1 as EnergyCategory;
    } else {
      energyCategory = "Working at Height" === arg1 ? "Gravity" : "UNKNOWN";
    }

    if (typeof arg3 === "string") {
      const lowerArg3 = arg3.toLowerCase();
      isCompromised =
        lowerArg3.includes("compromis") ||
        lowerArg3.includes("ineffective") ||
        lowerArg3.includes("fail") ||
        lowerArg3.includes("miss") ||
        lowerArg3.includes("bypass") ||
        lowerArg3.includes("absent") ||
        lowerArg3.includes("degraded");
      isUnknownBarrier = lowerArg3.includes("unknown");
    } else if (arg3 && typeof arg3 === "object") {
      barrierAssessment = arg3;
    }
  } else {
    // Pattern B
    text = typeof arg1 === "string" ? arg1 : "";
    energyCategory = arg2 || "UNKNOWN";
    energyMagnitude = arg3 || "UNKNOWN";
    barrierAssessment = arg4 || null;
  }

  if (barrierAssessment) {
    isCompromised =
      barrierAssessment.barrier_state === "FAILED" ||
      barrierAssessment.barrier_state === "MISSING" ||
      barrierAssessment.barrier_state === "DEGRADED" ||
      barrierAssessment.direct_control_status === "bypassed" ||
      barrierAssessment.direct_control_status === "absent" ||
      barrierAssessment.direct_control_status === "failed";
    isUnknownBarrier =
      barrierAssessment.barrier_state === "UNKNOWN" ||
      barrierAssessment.direct_control_status === "unknown";
  }

  const lower = text.toLowerCase();

  // Gate 1: High Energy Present?
  const isHighEnergy = energyMagnitude === "High-Energy";
  const isUnknownEnergy = energyMagnitude === "UNKNOWN" || energyCategory === "UNKNOWN";
  const gate1_status: "SUPPORTED" | "INFERRED" | "UNKNOWN" | "NOT_FOUND" = isHighEnergy
    ? "SUPPORTED"
    : isUnknownEnergy
    ? "UNKNOWN"
    : "SUPPORTED";
  let gate1_evidence: string | null = null;
  if (isHighEnergy && energyCategory !== "UNKNOWN") {
    const map = ENERGY_KEYWORD_MAP[energyCategory as Exclude<EnergyCategory, "UNKNOWN">];
    if (map) {
      const allKws = [...map.highEnergyKeywords, ...map.generalKeywords];
      const matchedKw = allKws.find((k) => lower.includes(k));
      if (matchedKw) {
        const idx = lower.indexOf(matchedKw);
        gate1_evidence = idx !== -1 ? text.substring(idx, idx + matchedKw.length) : matchedKw;
      }
    }
  }
  const gate1_details = isHighEnergy
    ? `Verified high-magnitude energy source: ${energyCategory}`
    : isUnknownEnergy
    ? `Energy source not established from narrative`
    : `Energy level below SIF threshold (routine low-energy activity)`;

  // Gate 2: Direct Barrier Compromised?
  const gate2_status: "SUPPORTED" | "INFERRED" | "UNKNOWN" | "NOT_FOUND" = isCompromised
    ? "SUPPORTED"
    : isUnknownBarrier
    ? "UNKNOWN"
    : "SUPPORTED";
  const gate2_evidence = (isCompromised && barrierAssessment?.evidence_span) ? barrierAssessment.evidence_span : null;
  const gate2_details = isCompromised
    ? `Direct control status '${barrierAssessment?.direct_control_status || "compromised"}': ${barrierAssessment?.barrier_description || "Direct barrier compromised or ineffective"}`
    : isUnknownBarrier
    ? `Direct barrier status is unknown from observation narrative`
    : `Primary engineered barrier remained verified intact in narrative`;

  // Gate 3: Person entered line-of-fire / lethal envelope of danger?
  const lineOfFireKeywords = [
    "struck", "hit", "caught", "fell", "fall", "standing under", "in path", "pinched", "injured", "hospitalized", "contact with", "exposed to", "unsecured at height", "line of fire", "under load", "pinch point", "crushed"
  ];
  const safeStandoffKeywords = [
    "safe distance", "standoff distance", "stood clear", "stand clear", "exclusion zone maintained", "outside line of fire", "barricaded area evacuated", "no personnel in area", "no workers present", "area was clear", "maintained standoff"
  ];

  let matchedLofKw: string | null = null;
  for (const kw of lineOfFireKeywords) {
    if (lower.includes(kw)) {
      matchedLofKw = kw;
      break;
    }
  }

  let matchedStandoffKw: string | null = null;
  if (!matchedLofKw) {
    for (const kw of safeStandoffKeywords) {
      if (lower.includes(kw)) {
        matchedStandoffKw = kw;
        break;
      }
    }
  }

  let gate3 = false;
  let gate3_status: "SUPPORTED" | "INFERRED" | "UNKNOWN" | "NOT_FOUND" = "UNKNOWN";
  let gate3_evidence: string | null = null;
  let gate3_details = "Line-of-fire exposure / standoff condition not established from narrative";

  if (matchedLofKw) {
    gate3 = true;
    gate3_status = "SUPPORTED";
    const idx = lower.indexOf(matchedLofKw);
    gate3_evidence = idx !== -1 ? text.substring(idx, idx + matchedLofKw.length) : matchedLofKw;
    gate3_details = "Personnel entered the direct line-of-fire or hazard exposure envelope";
  } else if (matchedStandoffKw) {
    gate3 = false;
    gate3_status = "SUPPORTED";
    const idx = lower.indexOf(matchedStandoffKw);
    gate3_evidence = idx !== -1 ? text.substring(idx, idx + matchedStandoffKw.length) : matchedStandoffKw;
    gate3_details = "Personnel explicitly maintained safe standoff distance or remained outside hazard zone";
  } else {
    gate3 = false;
    gate3_status = "UNKNOWN";
    gate3_evidence = null;
    gate3_details = "Line-of-fire exposure / standoff condition not established from narrative";
  }

  let decision_verdict: "Diagnostic: Non-SIF Precursor" | "Diagnostic: SIF Precursor" | "Diagnostic: High Exposure / Major Event" = "Diagnostic: Non-SIF Precursor";
  if (isHighEnergy && isCompromised && gate3) {
    decision_verdict = "Diagnostic: High Exposure / Major Event";
  } else if (isHighEnergy && isCompromised) {
    decision_verdict = "Diagnostic: SIF Precursor";
  } else {
    decision_verdict = "Diagnostic: Non-SIF Precursor";
  }

  const is_sif_potential = isHighEnergy && isCompromised;

  return {
    gate1_high_energy: isHighEnergy,
    gate1_status,
    gate1_evidence,
    gate1_details,
    gate2_direct_control: !isCompromised,
    gate2_direct_control_compromised: isCompromised,
    gate2_status,
    gate2_evidence,
    gate2_details,
    gate3_line_of_fire_intersected: gate3,
    gate3_status,
    gate3_evidence,
    gate3_details,
    is_sif_potential,
    decision_verdict,
  };
}

/**
 * Backward compatibility alias for Campbell gates.
 */
export const evaluateCampbellGates = evaluateSIFDecisionGates;

// ─── 4. Shift Handover & Circadian Risk Calculation ──────────────────────────

export function detectShiftAndCircadianRisk(dateStr?: string | null): {
  shift_timing: ShiftTiming;
  circadian_risk_tier: CircadianRiskTier;
  risk_multiplier: number;
  shift: string;
  circadianTier: string;
  multiplier: number;
} {
  if (!dateStr || typeof dateStr !== "string") {
    return {
      shift_timing: "standard",
      circadian_risk_tier: "standard",
      risk_multiplier: 1.0,
      shift: "day_shift",
      circadianTier: "low",
      multiplier: 1.0,
    };
  }

  // Check if timestamp contains a time component (e.g. "T14:30:00" or " 14:30")
  const hasTimeComponent = dateStr.includes("T") || dateStr.includes(":") || dateStr.includes(" ");
  if (!hasTimeComponent) {
    // Only date provided (e.g., YYYY-MM-DD); do not assume execution time
    return {
      shift_timing: "standard",
      circadian_risk_tier: "standard",
      risk_multiplier: 1.0,
      shift: "day_shift",
      circadianTier: "low",
      multiplier: 1.0,
    };
  }

  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    return {
      shift_timing: "standard",
      circadian_risk_tier: "standard",
      risk_multiplier: 1.0,
      shift: "day_shift",
      circadianTier: "low",
      multiplier: 1.0,
    };
  }

  // If timestamp specifies UTC (ends with 'Z' or contains offset), extract UTC hour
  const hours = dateStr.includes("Z") || (dateStr.includes("+") && dateStr.includes("T"))
    ? dateObj.getUTCHours()
    : dateObj.getHours();

  // 00:00 - 05:59: Graveyard shift / Circadian low
  if (hours >= 0 && hours < 6) {
    return {
      shift_timing: "night_shift",
      circadian_risk_tier: "circadian_low",
      risk_multiplier: 1.4,
      shift: "graveyard_shift",
      circadianTier: hours >= 2 && hours <= 4 ? "critical" : "elevated",
      multiplier: 1.4,
    };
  }

  // Shift handover windows: 06:00 - 08:00
  if (hours >= 6 && hours < 8) {
    return {
      shift_timing: "morning_handover",
      circadian_risk_tier: "handover_window",
      risk_multiplier: 1.35,
      shift: "morning_handover",
      circadianTier: "elevated",
      multiplier: 1.35,
    };
  }

  // Evening handover: 18:00 - 20:00
  if (hours >= 18 && hours < 20) {
    return {
      shift_timing: "evening_handover",
      circadian_risk_tier: "handover_window",
      risk_multiplier: 1.35,
      shift: "evening_handover",
      circadianTier: "elevated",
      multiplier: 1.35,
    };
  }

  // Late evening / night: 20:00 - 24:00
  if (hours >= 20) {
    return {
      shift_timing: "night_shift",
      circadian_risk_tier: "standard",
      risk_multiplier: 1.25,
      shift: "night_shift",
      circadianTier: "elevated",
      multiplier: 1.25,
    };
  }

  // Standard day shift: 08:00 - 18:00
  return {
    shift_timing: "day_shift",
    circadian_risk_tier: "standard",
    risk_multiplier: 1.0,
    shift: "day_shift",
    circadianTier: "low",
    multiplier: 1.0,
  };
}

// ─── 4b. SIF Pathway Graph Construction ────────────────────────────────────
// Connects: Hazard → Energy → Critical Barrier → Barrier Status → Worker Exposure → Consequence
// Every stage explicitly carries: value, evidence (text span or null), and status (SUPPORTED | INFERRED | UNKNOWN)

export function buildSIFPathway(
  text: string,
  energyCategory: EnergyCategory,
  energyMagnitude: "High-Energy" | "Low-Energy" | "UNKNOWN",
  barrier: BarrierAssessment,
  rule: LifeSavingRule | null
): import("@/lib/types").SIFPathway {
  const lower = text.toLowerCase();

  const hazardMap: Record<EnergyCategory, string> = {
    Gravity: "Elevated work location / suspended overhead mass",
    Pressure: "High-pressure fluid / gas containment boundary",
    Motion: "Heavy mobile equipment / rotating rig machinery in transit",
    Mechanical: "Rotating drawworks / cathead winches / pinch points",
    Electrical: "Energized high-voltage conductors / switchgear arc boundary",
    Temperature: "Thermal extremes / uninsulated process piping / hot flare line",
    Chemical: "Toxic H2S sour gas release / volatile hydrocarbon vapor",
    Radiation: "Industrial radiography gamma source / NORM scale",
    Sound: "High-pressure emergency blowdown acoustic discharge",
    Biological: "Wild fauna / waterborne vectors in remote wellhead locations",
    UNKNOWN: "Unknown / undetermined operational hazard",
  };

  let matchedExposureWord: string | null = null;
  let matchedExposureIdx = -1;
  let exposureDescription: string | null = null;
  if (lower.includes("fell") || lower.includes("fall")) {
    exposureDescription = "Worker positioned at elevated edge without verified 100% fall protection arrest";
    matchedExposureWord = lower.includes("fell") ? "fell" : "fall";
    matchedExposureIdx = lower.indexOf(matchedExposureWord);
  } else if (lower.includes("under") || lower.includes("line of fire")) {
    exposureDescription = "Worker positioned directly within equipment swing radius or dropped object footprint";
    matchedExposureWord = lower.includes("line of fire") ? "line of fire" : "under";
    matchedExposureIdx = lower.indexOf(matchedExposureWord);
  } else if (lower.includes("leak") || lower.includes("gas")) {
    exposureDescription = "Personnel working downwind or in proximity to uncontained atmospheric gas release";
    matchedExposureWord = lower.includes("leak") ? "leak" : "gas";
    matchedExposureIdx = lower.indexOf(matchedExposureWord);
  } else if (lower.includes("energized") || lower.includes("live")) {
    exposureDescription = "Personnel in physical proximity to un-isolated live electrical circuit";
    matchedExposureWord = lower.includes("energized") ? "energized" : "live";
    matchedExposureIdx = lower.indexOf(matchedExposureWord);
  }

  const consequenceMap: Record<EnergyCategory, string> = {
    Gravity: "Fatal blunt-force trauma from elevation impact",
    Pressure: "Fatal penetrative injury / blast rupture",
    Motion: "Fatal struck-by / crush injury by heavy vehicle",
    Mechanical: "Severe body entrapment / traumatic amputation",
    Electrical: "Fatal electrocution / full-thickness arc flash burns",
    Temperature: "Severe thermal flash burn / respiratory tract damage",
    Chemical: "Acute toxic H2S asphyxiation / flammable hydrocarbon explosion",
    Radiation: "High-dose ionizing radiation exposure",
    Sound: "Permanent acoustic trauma",
    Biological: "Severe envenomation / tropical systemic infection",
    UNKNOWN: "Potential consequence undetermined due to unconfirmed energy source",
  };

  // Stage 1: Hazard & Stage 2: Energy
  let energyEvidenceSpan: string | null = null;
  if (energyCategory !== "UNKNOWN") {
    const catLower = energyCategory.toLowerCase();
    const idx = lower.indexOf(catLower);
    if (idx !== -1) {
      energyEvidenceSpan = text.substring(idx, idx + catLower.length);
    }
  }

  const hazardStage: import("@/lib/types").SIFPathwayStage = energyCategory === "UNKNOWN"
    ? { value: null, evidence: null, status: "UNKNOWN" }
    : {
        value: hazardMap[energyCategory] || "Industrial operational hazard",
        evidence: energyEvidenceSpan,
        status: energyEvidenceSpan ? "SUPPORTED" : "INFERRED",
      };

  const energyStage: import("@/lib/types").SIFPathwayStage = energyCategory === "UNKNOWN"
    ? { value: null, evidence: null, status: "UNKNOWN" }
    : {
        value: `${energyCategory} (${energyMagnitude})`,
        evidence: energyEvidenceSpan,
        status: energyEvidenceSpan ? "SUPPORTED" : "INFERRED",
      };

  // Stage 3: Critical Barrier
  const barrierStage: import("@/lib/types").SIFPathwayStage = barrier.identified_barrier
    ? {
        value: barrier.identified_barrier,
        evidence: barrier.evidence_span || null,
        status: barrier.evidence_span ? "SUPPORTED" : "INFERRED",
      }
    : {
        value: null,
        evidence: null,
        status: "UNKNOWN",
      };

  // Stage 4: Barrier State
  const barrierStateStage: import("@/lib/types").SIFPathwayStage = (barrier.barrier_state && barrier.barrier_state !== "UNKNOWN")
    ? {
        value: barrier.barrier_state,
        evidence: barrier.evidence_span || null,
        status: barrier.evidence_span ? "SUPPORTED" : "INFERRED",
      }
    : {
        value: null,
        evidence: null,
        status: "UNKNOWN",
      };

  // Stage 5: Worker Exposure (Grounded in text without fabrication)
  const workerMentionWords = ["worker", "personnel", "technician", "operator", "crew", "employee", "contractor", "team", "engineer"];
  const hasWorkerMention = workerMentionWords.some((w) => lower.includes(w));

  let exposureStage: import("@/lib/types").SIFPathwayStage;
  if (matchedExposureWord && matchedExposureIdx !== -1) {
    exposureStage = {
      value: exposureDescription,
      evidence: text.substring(matchedExposureIdx, matchedExposureIdx + matchedExposureWord.length),
      status: "SUPPORTED",
    };
  } else if (hasWorkerMention) {
    exposureStage = {
      value: "Worker presence noted in vicinity of operational area",
      evidence: null,
      status: "INFERRED",
    };
  } else {
    exposureStage = {
      value: null,
      evidence: null,
      status: "UNKNOWN",
    };
  }

  // Stage 6: Potential Consequence
  const consequenceStage: import("@/lib/types").SIFPathwayStage = energyCategory === "UNKNOWN"
    ? { value: null, evidence: null, status: "UNKNOWN" }
    : {
        value: consequenceMap[energyCategory] || "Serious irreversible injury or fatality",
        evidence: null,
        status: "INFERRED",
      };

  return {
    hazard: hazardStage,
    energy: energyStage,
    critical_barrier: barrierStage,
    barrier_state: barrierStateStage,
    worker_exposure: exposureStage,
    potential_consequence: consequenceStage,
    credible_sif_scenario: energyCategory !== "UNKNOWN"
      ? `${energyCategory} energy release (${energyMagnitude}) coupled with ${barrier.direct_control_status} barrier defense under ${rule || "operational"} envelope.`
      : "Insufficient evidence to construct credible SIF energy release scenario.",
    evidence_text: text.slice(0, 240),
    hazard_val: hazardStage.value || undefined,
    energy_category: energyCategory,
    energy_magnitude: energyMagnitude,
    critical_barrier_val: barrierStage.value || undefined,
    barrier_state_val: barrier.barrier_state || "UNKNOWN",
  };
}

// ─── 5. Cumulative Exposure Index (CEI) & 14-Day Velocity Gauge ───────────────
// Cumulative Precursor Clustering Research (Energy-Barrier Evaluation)

export function calculateFacilityCEI(
  reports: Report[],
  classifications: Classification[],
  facilityName: string
): {
  cei: number;
  status: "controlled" | "elevated" | "critical_storm";
  velocity14d: number;
  clusterStorm: boolean;
  dominantEnergy: EnergyCategory | null;
  directBarrierFailureRate: number;
} {
  const now = Date.now();
  const FOURTEEN_DAYS_MS = 14 * 86400000;

  const classMap = new Map(classifications.map((c) => [c.report_id, c]));
  const facilityReports = reports.filter((r) => r.site.toLowerCase() === facilityName.toLowerCase());

  let totalPrecursorsIn14d = 0;
  let totalBypassedDirectControls = 0;
  let rawWeightedExposure = 0;

  const energyCounts = new Map<EnergyCategory, number>();

  for (const rep of facilityReports) {
    const cls = classMap.get(rep.id);
    if (!cls || !cls.is_sif_potential) continue;

    const repDate = new Date(rep.reported_date || rep.created_at).getTime();
    const ageMs = Math.max(0, now - repDate);

    // Only consider trailing 14-day window for velocity and CEI
    if (ageMs <= FOURTEEN_DAYS_MS) {
      totalPrecursorsIn14d++;

      // Recency decay factor: 1.0 (today) down to ~0.4 (14 days ago)
      const daysOld = ageMs / 86400000;
      const recencyFactor = Math.exp(-0.065 * daysOld);

      // Energy multiplier: High energy = 1.8x, Low energy = 1.0x
      const isHighEnergy = cls.energy_magnitude === "High-Energy" || cls.campbell_gates?.gate1_high_energy;
      const energyMultiplier = isHighEnergy ? 1.8 : 1.0;

      // Barrier multiplier: bypassed or absent direct control = 2.0x
      const isDirectFailed =
        cls.barrier_assessment?.direct_control_status === "bypassed" ||
        cls.barrier_assessment?.direct_control_status === "absent" ||
        cls.campbell_gates?.gate2_direct_control_compromised;
      if (isDirectFailed) totalBypassedDirectControls++;
      const barrierMultiplier = isDirectFailed ? 2.0 : 1.2;

      // Shift multiplier
      const shiftMult = cls.shift_risk_multiplier || 1.0;

      rawWeightedExposure += 15 * recencyFactor * energyMultiplier * barrierMultiplier * shiftMult;

      if (cls.energy_category) {
        energyCounts.set(cls.energy_category, (energyCounts.get(cls.energy_category) || 0) + 1);
      }
    }
  }

  // Precursor cluster storm: >= 3 SIF precursors in 14 days
  const clusterStorm = totalPrecursorsIn14d >= 3;
  if (clusterStorm) {
    rawWeightedExposure *= 1.35; // Exponential cluster surge
  }

  // Clamp CEI score to 0 - 100
  const cei = Math.min(100, Math.round(rawWeightedExposure));

  const status: "controlled" | "elevated" | "critical_storm" =
    cei >= 65 || clusterStorm ? "critical_storm" : cei >= 35 ? "elevated" : "controlled";

  // Find dominant energy
  let dominantEnergy: EnergyCategory | null = null;
  let maxEnergyCount = 0;
  for (const [cat, count] of energyCounts.entries()) {
    if (count > maxEnergyCount) {
      maxEnergyCount = count;
      dominantEnergy = cat;
    }
  }

  const directBarrierFailureRate =
    totalPrecursorsIn14d > 0 ? Math.round((totalBypassedDirectControls / totalPrecursorsIn14d) * 100) : 0;

  return {
    cei,
    status,
    velocity14d: totalPrecursorsIn14d,
    clusterStorm,
    dominantEnergy,
    directBarrierFailureRate,
  };
}

/**
 * Infers the Hierarchy of Controls level and determines if it is a weak control (Admin/PPE).
 */
export function inferControlHierarchy(
  title: string,
  desc: string,
  providedLevel?: ControlHierarchyLevel
): { level: ControlHierarchyLevel; isWeak: boolean } {
  if (providedLevel) {
    const isWeak = providedLevel === "Administrative" || providedLevel === "PPE";
    return { level: providedLevel, isWeak };
  }

  const combined = `${title} ${desc}`.toLowerCase();
  if (combined.includes("eliminate") || combined.includes("remove process") || combined.includes("decommission")) {
    return { level: "Elimination", isWeak: false };
  }
  if (combined.includes("substitute") || combined.includes("replace with non-hazardous")) {
    return { level: "Substitution", isWeak: false };
  }
  if (
    combined.includes("barrier") ||
    combined.includes("interlock") ||
    combined.includes("loto") ||
    combined.includes("lockout") ||
    combined.includes("isolation") ||
    combined.includes("guard") ||
    combined.includes("guardrail") ||
    combined.includes("anchor") ||
    combined.includes("relief valve") ||
    combined.includes("physical") ||
    combined.includes("engineered") ||
    combined.includes("stanchion") ||
    combined.includes("whip check")
  ) {
    return { level: "Engineering / Direct Control", isWeak: false };
  }
  if (
    combined.includes("ppe") ||
    combined.includes("gloves") ||
    combined.includes("helmet") ||
    combined.includes("glasses") ||
    combined.includes("earplugs")
  ) {
    return { level: "PPE", isWeak: true };
  }

  // Default to Administrative for instructions, training, procedures, audits
  return { level: "Administrative", isWeak: true };
}
