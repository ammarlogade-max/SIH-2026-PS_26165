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

// ─── Keyword maps for the 10 CSRA Energy Wheel Categories ───────────────────

const ENERGY_KEYWORD_MAP: Record<EnergyCategory, { highEnergyKeywords: string[]; generalKeywords: string[] }> = {
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
      "rotary table", "cathead", "winch drum", "drawworks", "rotating shaft", "pinch point",
      "draw in", "entanglement", "crushing", "unguarded pulley", "drive belt", "sprocket", "chain block"
    ],
    generalKeywords: ["gear", "lever", "lathe", "grinder", "mechanical", "tool", "coupling"]
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
      "toxic vapor", "acid wash", "corrosive spill", "benzene", "confined space gas", "oxygen deficiency"
    ],
    generalKeywords: ["chemical", "drilling mud", "solvent", "cleaning fluid", "fuel", "diesel spill", "lubricant"]
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
  magnitude: "High-Energy" | "Low-Energy";
  sourceDetails: string;
  thresholdExceeded: boolean;
  confidence: number;
} {
  const lower = text.toLowerCase();
  const scores: { category: EnergyCategory; score: number; isHigh: boolean; matchedKeyword: string }[] = [];

  for (const item of CSRA_ENERGY_WHEEL) {
    const map = ENERGY_KEYWORD_MAP[item.id];
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
      scores.push({ category: item.id, score: catScore, isHigh: highTriggered, matchedKeyword: topWord });
    }
  }

  // Fallback heuristic based on Life-Saving Rule if no explicit energy keywords
  if (scores.length === 0) {
    if (rule === "Working at Height") {
      return {
        category: "Gravity",
        magnitude: "High-Energy",
        sourceDetails: "Fall from elevated work surface (>1.8m height)",
        thresholdExceeded: true,
        confidence: 88,
      };
    }
    if (rule === "Energy Isolation") {
      return {
        category: "Electrical",
        magnitude: "High-Energy",
        sourceDetails: "Energized system without positive LOTO isolation",
        thresholdExceeded: true,
        confidence: 85,
      };
    }
    if (rule === "Hot Work") {
      return {
        category: "Temperature",
        magnitude: "High-Energy",
        sourceDetails: "Ignition energy in presence of combustible/hydrocarbon environment",
        thresholdExceeded: true,
        confidence: 85,
      };
    }
    if (rule === "Confined Space") {
      return {
        category: "Chemical",
        magnitude: "High-Energy",
        sourceDetails: "Enclosed vessel toxic/asphyxiating atmospheric hazard",
        thresholdExceeded: true,
        confidence: 87,
      };
    }
    if (rule === "Safe Mechanical Lifting") {
      return {
        category: "Gravity",
        magnitude: "High-Energy",
        sourceDetails: "Overhead suspended crane/hoist load",
        thresholdExceeded: true,
        confidence: 89,
      };
    }
    if (rule === "Driving") {
      return {
        category: "Motion",
        magnitude: "High-Energy",
        sourceDetails: "Kinetic vehicular motion or mobile plant transit",
        thresholdExceeded: true,
        confidence: 84,
      };
    }
    if (rule === "Line of Fire") {
      return {
        category: "Mechanical",
        magnitude: "High-Energy",
        sourceDetails: "Pinch point, tensioned line, or pressurized release trajectory",
        thresholdExceeded: true,
        confidence: 82,
      };
    }

    // Default neutral/routine
    return {
      category: "Gravity",
      magnitude: "Low-Energy",
      sourceDetails: "Low-magnitude routine operational condition",
      thresholdExceeded: false,
      confidence: 65,
    };
  }

  // Pick highest scoring energy category
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const itemDef = CSRA_ENERGY_WHEEL.find((w) => w.id === best.category)!;

  const magnitude: "High-Energy" | "Low-Energy" = best.isHigh || best.score >= 3.0 ? "High-Energy" : "Low-Energy";
  const sourceDetails = best.matchedKeyword
    ? `${itemDef.name} hazard detected via "${best.matchedKeyword}" (${itemDef.highThreshold})`
    : `Identified ${itemDef.name} energy source: ${itemDef.description}`;

  return {
    category: best.category,
    magnitude,
    sourceDetails,
    thresholdExceeded: magnitude === "High-Energy",
    confidence: Math.min(98, Math.round(75 + best.score * 5)),
  };
}

// ─── 2. Evaluate Control Hierarchy & Direct Barrier Status ───────────────────

export function evaluateBarrierStatus(text: string, isSif: boolean): BarrierAssessment {
  const lower = text.toLowerCase();

  // Check for physical / engineered bypass
  if (
    lower.includes("bypass") ||
    lower.includes("override") ||
    lower.includes("disabled") ||
    lower.includes("jumper") ||
    lower.includes("disconnected") ||
    lower.includes("defeated") ||
    lower.includes("gagged")
  ) {
    return {
      compromised_level: "Engineering / Direct Control",
      direct_control_status: "bypassed",
      barrier_description: "Physical safety interlock, relief device, or engineered protection intentionally bypassed",
      reliability_score: 15,
      hierarchy_rank: 3,
    };
  }

  // Check for absent engineered control (scaffolding missing rails, uninsulated cables, no barrier)
  if (
    lower.includes("no guardrail") ||
    lower.includes("missing toe board") ||
    lower.includes("no lock") ||
    lower.includes("no loto") ||
    lower.includes("missing barricade") ||
    lower.includes("no gas detector") ||
    lower.includes("unsecured") ||
    lower.includes("no tether")
  ) {
    return {
      compromised_level: "Engineering / Direct Control",
      direct_control_status: "absent",
      barrier_description: "Physical barrier or engineered safeguard was completely absent at work location",
      reliability_score: 10,
      hierarchy_rank: 3,
    };
  }

  // Check for mechanical/equipment failure
  if (
    lower.includes("frayed") ||
    lower.includes("corroded") ||
    lower.includes("cracked") ||
    lower.includes("failed") ||
    lower.includes("malfunction") ||
    lower.includes("leaking") ||
    lower.includes("broken")
  ) {
    return {
      compromised_level: "Engineering / Direct Control",
      direct_control_status: "failed",
      barrier_description: "Engineered physical barrier degraded or structurally failed during operation",
      reliability_score: 25,
      hierarchy_rank: 3,
    };
  }

  // Administrative / Permit deficiencies
  if (
    lower.includes("permit") ||
    lower.includes("ptw") ||
    lower.includes("unauthorized") ||
    lower.includes("toolbox") ||
    lower.includes("jsa") ||
    lower.includes("briefing") ||
    lower.includes("procedure")
  ) {
    return {
      compromised_level: "Administrative",
      direct_control_status: isSif ? "failed" : "intact",
      barrier_description: "Administrative PTW, procedural sign-off, or risk assessment discrepancy",
      reliability_score: 45,
      hierarchy_rank: 4,
    };
  }

  // PPE deficiencies
  if (
    lower.includes("ppe") ||
    lower.includes("gloves") ||
    lower.includes("safety glasses") ||
    lower.includes("helmet") ||
    lower.includes("earplugs")
  ) {
    return {
      compromised_level: "PPE",
      direct_control_status: isSif ? "absent" : "intact",
      barrier_description: "Personal Protective Equipment compliance issue (lowest control hierarchy tier)",
      reliability_score: 20,
      hierarchy_rank: 5,
    };
  }

  // Default
  if (isSif) {
    return {
      compromised_level: "Engineering / Direct Control",
      direct_control_status: "absent",
      barrier_description: "High-potential exposure occurred without verified physical barrier containment",
      reliability_score: 30,
      hierarchy_rank: 3,
    };
  }

  return {
    compromised_level: "Engineering / Direct Control",
    direct_control_status: "intact",
    barrier_description: "Engineered safeguards and containment verified active during routine task",
    reliability_score: 90,
    hierarchy_rank: 3,
  };
}

// ─── 3. Campbell Institute 3-Gate SIF Model ─────────────────────────────────

export function evaluateCampbellGates(
  text: string,
  isSif: boolean,
  energyCategory: EnergyCategory,
  energyMagnitude: "High-Energy" | "Low-Energy",
  barrierAssessment: BarrierAssessment
): CampbellGateEvaluation {
  const lower = text.toLowerCase();

  // Gate 1: High Energy Present?
  const gate1 = energyMagnitude === "High-Energy";
  const gate1_details = gate1
    ? `Verified high-magnitude energy source: ${energyCategory} (${CSRA_ENERGY_WHEEL.find((w) => w.id === energyCategory)?.highThreshold})`
    : `Energy level below SIF threshold (routine low-energy operational activity)`;

  // Gate 2: Direct Barrier Compromised?
  const gate2 = barrierAssessment.direct_control_status !== "intact";
  const gate2_details = gate2
    ? `Direct control status '${barrierAssessment.direct_control_status}': ${barrierAssessment.barrier_description}`
    : `Primary engineered barrier remained fully verified and intact`;

  // Gate 3: Person entered line-of-fire / envelope of danger?
  const hasLineOfFireMarkers =
    lower.includes("struck") ||
    lower.includes("hit") ||
    lower.includes("caught") ||
    lower.includes("fell") ||
    lower.includes("standing under") ||
    lower.includes("in path") ||
    lower.includes("pinched") ||
    lower.includes("injured") ||
    lower.includes("hospitalized") ||
    lower.includes("contact with");

  const gate3 = isSif && hasLineOfFireMarkers;
  const gate3_details = gate3
    ? `Personnel entered the direct line-of-fire / release trajectory during exposure`
    : `Luck, timing, or distance prevented worker from intersecting the lethal envelope`;

  let decision_verdict: "Non-SIF" | "SIF Precursor" | "Actual SIF / Major Event" = "Non-SIF";
  if (gate1 && gate2 && gate3) {
    decision_verdict = "Actual SIF / Major Event";
  } else if (gate1 && gate2) {
    decision_verdict = "SIF Precursor";
  } else {
    decision_verdict = "Non-SIF";
  }

  return {
    gate1_high_energy: gate1,
    gate1_details,
    gate2_direct_control_compromised: gate2,
    gate2_details,
    gate3_line_of_fire_intersected: gate3,
    gate3_details,
    decision_verdict,
  };
}

// ─── 4. Shift Handover & Circadian Risk Calculation ──────────────────────────

export function detectShiftAndCircadianRisk(dateStr: string): {
  shift_timing: ShiftTiming;
  circadian_risk_tier: CircadianRiskTier;
  risk_multiplier: number;
} {
  const dateObj = new Date(dateStr);
  const hours = isNaN(dateObj.getHours()) ? 10 : dateObj.getHours();

  // Shift handover windows: 06:00 - 08:00 and 18:00 - 20:00
  if (hours >= 6 && hours < 8) {
    return {
      shift_timing: "morning_handover",
      circadian_risk_tier: "handover_window",
      risk_multiplier: 1.35,
    };
  }
  if (hours >= 18 && hours < 20) {
    return {
      shift_timing: "evening_handover",
      circadian_risk_tier: "handover_window",
      risk_multiplier: 1.35,
    };
  }

  // Circadian low window: 02:00 - 04:30
  if (hours >= 2 && hours <= 4) {
    return {
      shift_timing: "night_shift",
      circadian_risk_tier: "circadian_low",
      risk_multiplier: 1.40,
    };
  }

  // Night shift remainder
  if (hours >= 20 || hours < 6) {
    return {
      shift_timing: "night_shift",
      circadian_risk_tier: "standard",
      risk_multiplier: 1.15,
    };
  }

  // Standard day shift
  return {
    shift_timing: "day_shift",
    circadian_risk_tier: "standard",
    risk_multiplier: 1.0,
  };
}

// ─── 5. Cumulative Exposure Index (CEI) & 14-Day Velocity Gauge ───────────────
// Based on EPRI and Campbell Institute Cumulative Precursor Clustering Research

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
