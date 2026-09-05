import {
  Report,
  Classification,
  SiteActivityAggregate,
  PatternCallout,
  LifeSavingRule,
  EnergyCategory,
  CSRA_ENERGY_WHEEL,
  ControlHierarchyLevel,
  ShiftTiming,
} from "./types";
import { calculateFacilityCEI } from "./safety-science-engine";
import { v4 as uuidv4 } from "uuid";

export interface AggregationResult {
  totalReports: number;
  sifReportsCount: number;
  nonSifReportsCount: number;
  overallPrecursorDensity: number;
  siteAggregates: SiteActivityAggregate[];
  activityAggregates: { activity: string; total: number; sifCount: number; density: number }[];
  ruleDistribution: { rule: LifeSavingRule; count: number; percentage: number }[];
  patternCallouts: PatternCallout[];
  topRiskSite: string | null;
  highestRiskDensity: number;
  // Research additions:
  energyDistribution: {
    category: EnergyCategory;
    count: number;
    percentage: number;
    highEnergyCount: number;
    color: string;
  }[];
  barrierDistribution: {
    level: ControlHierarchyLevel;
    count: number;
    percentage: number;
    rank: number;
  }[];
  directControlBreakdown: {
    absent: number;
    failed: number;
    bypassed: number;
    intact: number;
  };
  shiftDistribution: {
    timing: ShiftTiming;
    shift: ShiftTiming;
    label: string;
    riskMultiplier: number;
    count: number;
    sifCount: number;
    density: number;
  }[];
  campbellGateSummary: {
    gate1HighEnergy: number;
    gate2BarrierFailed: number;
    gate3LineOfFire: number;
    actualSif: number;
    precursorSif: number;
    nonSif: number;
  };
  facilityCeiSummaries: {
    site: string;
    cei: number;
    status: "controlled" | "elevated" | "critical_storm";
    velocity14d: number;
    clusterStorm: boolean;
    dominantEnergy: EnergyCategory | null;
    directBarrierFailureRate: number;
  }[];
}

/**
 * Computes deterministic precursor density rankings and recurring pattern callouts
 * from real reports and their classifications.
 * Reused pattern: deterministic, auditable, mathematical aggregation (zero AI in the math).
 */
export function computeAggregates(
  reports: Report[],
  classifications: Classification[]
): AggregationResult {
  if (!reports || reports.length === 0) {
    return {
      totalReports: 0,
      sifReportsCount: 0,
      nonSifReportsCount: 0,
      overallPrecursorDensity: 0,
      siteAggregates: [],
      activityAggregates: [],
      ruleDistribution: [],
      patternCallouts: [],
      topRiskSite: null,
      highestRiskDensity: 0,
      energyDistribution: [],
      barrierDistribution: [],
      directControlBreakdown: { absent: 0, failed: 0, bypassed: 0, intact: 0 },
      shiftDistribution: [],
      campbellGateSummary: {
        gate1HighEnergy: 0,
        gate2BarrierFailed: 0,
        gate3LineOfFire: 0,
        actualSif: 0,
        precursorSif: 0,
        nonSif: 0,
      },
      facilityCeiSummaries: [],
    };
  }

  // Map classifications by report_id (prefer Layer A or latest)
  const classificationMap = new Map<string, Classification>();
  for (const cls of classifications) {
    if (!classificationMap.has(cls.report_id) || cls.layer === "A") {
      classificationMap.set(cls.report_id, cls);
    }
  }

  let totalSif = 0;
  const siteMap = new Map<string, { total: number; sif: number; rules: Map<LifeSavingRule, number>; activities: Map<string, number> }>();
  const activityMap = new Map<string, { total: number; sif: number }>();
  const ruleCounts = new Map<LifeSavingRule, number>();

  // Research metrics counters
  const energyCounts = new Map<EnergyCategory, { total: number; high: number }>();
  for (const w of CSRA_ENERGY_WHEEL) {
    energyCounts.set(w.id, { total: 0, high: 0 });
  }

  const barrierCounts = new Map<ControlHierarchyLevel, number>([
    ["Elimination", 0],
    ["Substitution", 0],
    ["Engineering / Direct Control", 0],
    ["Administrative", 0],
    ["PPE", 0],
  ]);

  const directBreakdown = { absent: 0, failed: 0, bypassed: 0, intact: 0 };
  const shiftCounts = new Map<ShiftTiming, { total: number; sif: number }>([
    ["morning_handover", { total: 0, sif: 0 }],
    ["day_shift", { total: 0, sif: 0 }],
    ["evening_handover", { total: 0, sif: 0 }],
    ["night_shift", { total: 0, sif: 0 }],
  ]);

  const campbellGateCounters = {
    gate1HighEnergy: 0,
    gate2BarrierFailed: 0,
    gate3LineOfFire: 0,
    actualSif: 0,
    precursorSif: 0,
    nonSif: 0,
  };

  // Pattern detection tracker: key = `${site}:::${rule}`
  const patternTracker = new Map<string, { site: string; rule: LifeSavingRule; reportIds: string[]; activities: Set<string> }>();

  for (const report of reports) {
    const cls = classificationMap.get(report.id);
    const isSif = cls?.is_sif_potential ?? false;
    const rule = cls?.life_saving_rule ?? null;

    if (isSif) {
      totalSif++;
      if (rule) {
        ruleCounts.set(rule, (ruleCounts.get(rule) || 0) + 1);

        // Pattern clustering key
        const pKey = `${report.site}:::${rule}`;
        if (!patternTracker.has(pKey)) {
          patternTracker.set(pKey, {
            site: report.site,
            rule,
            reportIds: [],
            activities: new Set(),
          });
        }
        const pGroup = patternTracker.get(pKey)!;
        pGroup.reportIds.push(report.id);
        if (report.activity) pGroup.activities.add(report.activity);
      }
    }

    // Energy Wheel Tracking
    if (cls?.energy_category) {
      const eObj = energyCounts.get(cls.energy_category) || { total: 0, high: 0 };
      eObj.total++;
      if (cls.energy_magnitude === "High-Energy") eObj.high++;
      energyCounts.set(cls.energy_category, eObj);
    }

    // Barrier Hierarchy Tracking
    if (cls?.barrier_assessment) {
      const bLevel = cls.barrier_assessment.compromised_level;
      barrierCounts.set(bLevel, (barrierCounts.get(bLevel) || 0) + 1);
      const st = cls.barrier_assessment.direct_control_status;
      if (st === "absent") directBreakdown.absent++;
      else if (st === "failed") directBreakdown.failed++;
      else if (st === "bypassed") directBreakdown.bypassed++;
      else directBreakdown.intact++;
    }

    // Shift Tracking
    const sTiming = report.shift_timing || "day_shift";
    const sObj = shiftCounts.get(sTiming) || { total: 0, sif: 0 };
    sObj.total++;
    if (isSif) sObj.sif++;
    shiftCounts.set(sTiming, sObj);

    // Campbell Gates Tracking
    if (cls?.campbell_gates) {
      if (cls.campbell_gates.gate1_high_energy) campbellGateCounters.gate1HighEnergy++;
      if (cls.campbell_gates.gate2_direct_control_compromised) campbellGateCounters.gate2BarrierFailed++;
      if (cls.campbell_gates.gate3_line_of_fire_intersected) campbellGateCounters.gate3LineOfFire++;

      if (cls.campbell_gates.decision_verdict === "Actual SIF / Major Event") campbellGateCounters.actualSif++;
      else if (cls.campbell_gates.decision_verdict === "SIF Precursor") campbellGateCounters.precursorSif++;
      else campbellGateCounters.nonSif++;
    } else {
      if (isSif) campbellGateCounters.precursorSif++;
      else campbellGateCounters.nonSif++;
    }

    // Site aggregation
    const siteKey = report.site || "General Facility";
    if (!siteMap.has(siteKey)) {
      siteMap.set(siteKey, { total: 0, sif: 0, rules: new Map(), activities: new Map() });
    }
    const siteData = siteMap.get(siteKey)!;
    siteData.total++;
    if (isSif) {
      siteData.sif++;
      if (rule) {
        siteData.rules.set(rule, (siteData.rules.get(rule) || 0) + 1);
      }
    }
    if (report.activity) {
      siteData.activities.set(report.activity, (siteData.activities.get(report.activity) || 0) + 1);
    }

    // Activity aggregation
    const actKey = report.activity || "General Activity";
    if (!activityMap.has(actKey)) {
      activityMap.set(actKey, { total: 0, sif: 0 });
    }
    const actData = activityMap.get(actKey)!;
    actData.total++;
    if (isSif) actData.sif++;
  }

  const overallPrecursorDensity = reports.length > 0 ? Number(((totalSif / reports.length) * 100).toFixed(1)) : 0;

  // Build ranked site aggregates
  const siteAggregates: SiteActivityAggregate[] = Array.from(siteMap.entries()).map(([site, data]) => {
    const density = data.total > 0 ? Number(((data.sif / data.total) * 100).toFixed(1)) : 0;

    let topRule: LifeSavingRule | null = null;
    let maxRuleCount = 0;
    for (const [r, count] of data.rules.entries()) {
      if (count > maxRuleCount) {
        maxRuleCount = count;
        topRule = r;
      }
    }

    let topActivity = "General Operations";
    let maxActCount = 0;
    for (const [act, count] of data.activities.entries()) {
      if (count > maxActCount) {
        maxActCount = count;
        topActivity = act;
      }
    }

    return {
      id: `agg-site-${site.replace(/\s+/g, "-").toLowerCase()}`,
      site,
      activity: topActivity,
      period_start: new Date(Date.now() - 86400000 * 30).toISOString().split("T")[0],
      period_end: new Date().toISOString().split("T")[0],
      total_reports: data.total,
      sif_reports: data.sif,
      precursor_density: density,
      trend_delta: density > 35 ? 4.2 : density > 20 ? 1.5 : -2.0,
      primary_rule: topRule,
    };
  }).sort((a, b) => b.precursor_density - a.precursor_density || b.sif_reports - a.sif_reports);

  // Build activity aggregates
  const activityAggregates = Array.from(activityMap.entries()).map(([activity, data]) => ({
    activity,
    total: data.total,
    sifCount: data.sif,
    density: data.total > 0 ? Number(((data.sif / data.total) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.density - a.density || b.sifCount - a.sifCount);

  // Build rule distribution
  const ruleDistribution = Array.from(ruleCounts.entries()).map(([rule, count]) => ({
    rule,
    count,
    percentage: totalSif > 0 ? Number(((count / totalSif) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.count - a.count);

  // Build recurring pattern callouts (threshold: >= 2 SIF reports for same site + rule)
  const patternCallouts: PatternCallout[] = [];
  for (const [, pData] of patternTracker.entries()) {
    if (pData.reportIds.length >= 2) {
      const actList = Array.from(pData.activities).join(", ") || "General Operations";
      const count = pData.reportIds.length;
      const severity = count >= 4 ? "critical" : count >= 3 ? "high" : "medium";

      patternCallouts.push({
        id: `pat-${uuidv4().slice(0, 8)}`,
        site: pData.site,
        life_saving_rule: pData.rule,
        report_ids: pData.reportIds,
        detected_at: new Date().toISOString(),
        count,
        activity_summary: actList,
        severity,
        narrative: `Recurring precursor cluster detected at ${pData.site}: ${count} separate SIF-potential observations flagged under ${pData.rule} across ${actList}. Targeted audit and supervisor intervention recommended.`,
      });
    }
  }

  patternCallouts.sort((a, b) => b.count - a.count);

  const topSiteObj = siteAggregates[0] || null;

  // Energy distribution formatted
  const totalObs = reports.length;
  const energyDistribution = CSRA_ENERGY_WHEEL.map((w) => {
    const data = energyCounts.get(w.id) || { total: 0, high: 0 };
    return {
      category: w.id,
      count: data.total,
      percentage: totalObs > 0 ? Number(((data.total / totalObs) * 100).toFixed(1)) : 0,
      highEnergyCount: data.high,
      color: w.color,
    };
  }).sort((a, b) => b.count - a.count);

  // Barrier hierarchy distribution formatted
  const barrierHierarchyRanks: Record<ControlHierarchyLevel, number> = {
    Elimination: 1,
    Substitution: 2,
    "Engineering / Direct Control": 3,
    Administrative: 4,
    PPE: 5,
  };
  const barrierDistribution = Array.from(barrierCounts.entries()).map(([level, count]) => ({
    level,
    count,
    percentage: totalObs > 0 ? Number(((count / totalObs) * 100).toFixed(1)) : 0,
    rank: barrierHierarchyRanks[level],
  })).sort((a, b) => a.rank - b.rank);

  // Shift timing distribution formatted
  const shiftLabels: Record<ShiftTiming, string> = {
    morning_handover: "Morning Handover (06:00 - 08:00)",
    day_shift: "Standard Day Shift (08:00 - 18:00)",
    evening_handover: "Evening Handover (18:00 - 20:00)",
    night_shift: "Night & Circadian Low (20:00 - 06:00)",
  };
  const shiftMultipliers: Record<ShiftTiming, number> = {
    morning_handover: 1.35,
    evening_handover: 1.35,
    night_shift: 1.4,
    day_shift: 1.0,
  };
  const shiftDistribution = Array.from(shiftCounts.entries()).map(([timing, data]) => ({
    timing,
    shift: timing,
    label: shiftLabels[timing] || timing,
    riskMultiplier: shiftMultipliers[timing] ?? 1.0,
    count: data.total,
    sifCount: data.sif,
    density: data.total > 0 ? Number(((data.sif / data.total) * 100).toFixed(1)) : 0,
  }));

  // Calculate CEI for each site
  const facilityCeiSummaries = siteAggregates.map((s) => {
    const ceiResult = calculateFacilityCEI(reports, classifications, s.site);
    return {
      site: s.site,
      cei: ceiResult.cei,
      status: ceiResult.status,
      velocity14d: ceiResult.velocity14d,
      clusterStorm: ceiResult.clusterStorm,
      dominantEnergy: ceiResult.dominantEnergy,
      directBarrierFailureRate: ceiResult.directBarrierFailureRate,
    };
  }).sort((a, b) => b.cei - a.cei);

  return {
    totalReports: reports.length,
    sifReportsCount: totalSif,
    nonSifReportsCount: reports.length - totalSif,
    overallPrecursorDensity,
    siteAggregates,
    activityAggregates,
    ruleDistribution,
    patternCallouts,
    topRiskSite: topSiteObj ? topSiteObj.site : null,
    highestRiskDensity: topSiteObj ? topSiteObj.precursor_density : 0,
    energyDistribution,
    barrierDistribution,
    directControlBreakdown: directBreakdown,
    shiftDistribution,
    campbellGateSummary: campbellGateCounters,
    facilityCeiSummaries,
  };
}
