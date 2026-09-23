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
  SafetyEventType,
  PrecursorTrajectory,
  CorrectiveAction,
  TemporalDirection,
  CAPAEffectiveness,
} from "./types";
import { calculateFacilityCEI } from "./safety-science-engine";
import { v4 as uuidv4 } from "uuid";

// ─── Mathematical Temporal Direction & Trend Determination ───────────────────

export function calculateTemporalDirection(
  timestamps: number[],
  minObservationsPerWindow = 2
): TemporalDirection {
  if (!timestamps || timestamps.length < 4) {
    return "INSUFFICIENT_DATA";
  }
  const sorted = [...timestamps].sort((a, b) => a - b);
  const minTime = sorted[0];
  const maxTime = sorted[sorted.length - 1];
  const spanMs = maxTime - minTime;
  if (spanMs < 1000 * 60 * 60 * 24) {
    return "INSUFFICIENT_DATA";
  }
  const midpoint = minTime + spanMs / 2;
  const previousWindow = sorted.filter((t) => t < midpoint);
  const currentWindow = sorted.filter((t) => t >= midpoint);

  if (previousWindow.length < minObservationsPerWindow || currentWindow.length < minObservationsPerWindow) {
    return "INSUFFICIENT_DATA";
  }

  const prevCount = previousWindow.length;
  const currCount = currentWindow.length;

  if (currCount > prevCount * 1.25) {
    return "INCREASING";
  } else if (currCount < prevCount * 0.8) {
    return "DECREASING";
  } else {
    return "STABLE";
  }
}

// ─── Post-Closure CAPA Effectiveness Evaluation ──────────────────────────────

export function evaluateCAPAEffectiveness(
  action: CorrectiveAction,
  subsequentObservations: { site: string; rule: LifeSavingRule; dateMs: number }[],
  monitoringDays = 30
): {
  status: CAPAEffectiveness;
  evidence: string;
  recurrence_detected: boolean;
} {
  const closureTime = action.verified_at || action.completed_at;
  if (!closureTime) {
    if (action.status === "in_progress" || action.status === "open") {
      return {
        status: "IMPLEMENTED",
        evidence: "Action is currently implemented or in progress pending verification.",
        recurrence_detected: false,
      };
    }
    return {
      status: "PROPOSED",
      evidence: "Action is proposed and awaiting implementation.",
      recurrence_detected: false,
    };
  }

  const closureMs = new Date(closureTime).getTime();
  const now = Date.now();
  const daysSinceClosure = Math.max(0, (now - closureMs) / (1000 * 60 * 60 * 24));

  const recurringObs = subsequentObservations.filter(
    (obs) => obs.site === action.site && obs.rule === action.life_saving_rule && obs.dateMs > closureMs
  );

  if (recurringObs.length > 0) {
    return {
      status: "INEFFECTIVE_RECURRENCE_DETECTED",
      evidence: `Ineffective: ${recurringObs.length} recurring precursor events detected after closure date ${closureTime.slice(0, 10)}.`,
      recurrence_detected: true,
    };
  }

  if (daysSinceClosure < monitoringDays) {
    return {
      status: "MONITORING",
      evidence: `Active monitoring window: ${Math.round(daysSinceClosure)}/${monitoringDays} days elapsed without recurrence.`,
      recurrence_detected: false,
    };
  }

  return {
    status: "EFFECTIVE",
    evidence: `Verified effective: Full ${monitoringDays}-day monitoring window completed with 0 recurring precursor events.`,
    recurrence_detected: false,
  };
}

// ─── Time-Bound Facility SIF Profile ─────────────────────────────────────────

export interface FacilitySIFProfile {
  site: string;
  window_start: string;
  window_end: string;
  observation_count: number;
  sif_count: number;
  density: {
    numerator: number;
    denominator: number;
    ratio: number;
    percentage: number;
    sample_size_warning: boolean;
  };
  trend: TemporalDirection;
}

export function computeFacilitySIFProfile(
  reports: Report[],
  classifications: Classification[],
  siteName: string
): FacilitySIFProfile {
  const siteReports = reports.filter((r) => (r.site || "General Facility") === siteName);
  const clsMap = new Map<string, Classification>();
  for (const c of classifications) {
    clsMap.set(c.report_id, c);
  }

  const timestamps = siteReports.map((r) => {
    const t = new Date(r.reported_date || r.created_at).getTime();
    return isNaN(t) ? Date.now() : t;
  }).sort((a, b) => a - b);

  const total = siteReports.length;
  const sifCount = siteReports.filter((r) => clsMap.get(r.id)?.is_sif_potential).length;
  const ratio = total > 0 ? sifCount / total : 0;
  const percentage = Number((ratio * 100).toFixed(1));

  const window_start = timestamps.length > 0
    ? new Date(timestamps[0]).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const window_end = timestamps.length > 0
    ? new Date(timestamps[timestamps.length - 1]).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const trend = calculateTemporalDirection(timestamps);

  return {
    site: siteName,
    window_start,
    window_end,
    observation_count: total,
    sif_count: sifCount,
    density: {
      numerator: sifCount,
      denominator: total,
      ratio: Number(ratio.toFixed(4)),
      percentage,
      sample_size_warning: total < 10,
    },
    trend,
  };
}

export interface AggregationResult {
  totalReports: number;
  sifReportsCount: number;
  nonSifReportsCount: number;
  overallPrecursorDensity: number;
  // SIH Mandatory Event Breakdown:
  unsafeActsCount: number;
  unsafeConditionsCount: number;
  nearMissesCount: number;
  incidentsCount: number;
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
  sifDecisionGateSummary: {
    gate1HighEnergy: number;
    gate2BarrierFailed: number;
    gate3LineOfFire: number;
    actualSif: number;
    precursorSif: number;
    nonSif: number;
  };
  /** @deprecated Use sifDecisionGateSummary */
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
 * Computes deterministic precursor density rankings and multi-dimensional recurring pattern callouts
 * from real reports and their classifications.
 */
export function computeAggregates(
  reports: Report[],
  classifications: Classification[],
  existingActions: CorrectiveAction[] = []
): AggregationResult {
  if (!reports || reports.length === 0) {
    return {
      totalReports: 0,
      sifReportsCount: 0,
      nonSifReportsCount: 0,
      overallPrecursorDensity: 0,
      unsafeActsCount: 0,
      unsafeConditionsCount: 0,
      nearMissesCount: 0,
      incidentsCount: 0,
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
      sifDecisionGateSummary: {
        gate1HighEnergy: 0,
        gate2BarrierFailed: 0,
        gate3LineOfFire: 0,
        actualSif: 0,
        precursorSif: 0,
        nonSif: 0,
      },
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

  // Map classifications by report_id
  const classificationMap = new Map<string, Classification>();
  for (const cls of classifications) {
    if (!classificationMap.has(cls.report_id) || cls.layer === "A") {
      classificationMap.set(cls.report_id, cls);
    }
  }

  let totalSif = 0;
  let unsafeActsCount = 0;
  let unsafeConditionsCount = 0;
  let nearMissesCount = 0;
  let incidentsCount = 0;

  // Site map records all observations with timestamps for real trend calculation
  const siteMap = new Map<
    string,
    {
      total: number;
      sif: number;
      rules: Map<LifeSavingRule, number>;
      activities: Map<string, number>;
      history: { date: number; isSif: boolean }[];
    }
  >();

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
    ["standard", { total: 0, sif: 0 }],
  ]);

  const campbellGateCounters = {
    gate1HighEnergy: 0,
    gate2BarrierFailed: 0,
    gate3LineOfFire: 0,
    actualSif: 0,
    precursorSif: 0,
    nonSif: 0,
  };

  // Multi-dimensional pattern detection tracker:
  // Key = [Site + Activity + BarrierCompromised + Rule]
  interface ClusterRecord {
    site: string;
    activity: string;
    barrier: string;
    rule: LifeSavingRule;
    reports: { id: string; date: string; timeMs: number; eventType: SafetyEventType; text: string }[];
  }
  const multiDimensionalClusters = new Map<string, ClusterRecord>();

  for (const report of reports) {
    const cls = classificationMap.get(report.id);
    const isSif = cls?.is_sif_potential ?? false;
    const rule = cls?.life_saving_rule ?? null;

    // Tally event types
    const eventType = report.event_type || "Unsafe Condition";
    if (eventType === "Unsafe Act") unsafeActsCount++;
    else if (eventType === "Unsafe Condition") unsafeConditionsCount++;
    else if (eventType === "Near-Miss") nearMissesCount++;
    else if (eventType === "Incident") incidentsCount++;

    const dateMs = new Date(report.reported_date || report.created_at).getTime();
    const validDateMs = isNaN(dateMs) ? Date.now() : dateMs;

    if (isSif) {
      totalSif++;
      if (rule) {
        ruleCounts.set(rule, (ruleCounts.get(rule) || 0) + 1);

        // Multi-dimensional cluster key: site + activity + energy + barrier + failure_mode + rule
        const barrierName = cls?.barrier_assessment?.identified_barrier || "Engineered Barrier";
        const failureMode = cls?.barrier_assessment?.direct_control_status || cls?.barrier_assessment?.barrier_state || "unspecified";
        const energyCat = cls?.energy_category || "UNKNOWN";
        const clusterKey = `${report.site}:::${report.activity || "General"}:::${energyCat}:::${barrierName}:::${failureMode}:::${rule}`;

        if (!multiDimensionalClusters.has(clusterKey)) {
          multiDimensionalClusters.set(clusterKey, {
            site: report.site,
            activity: report.activity || "General Operations",
            barrier: barrierName,
            rule,
            reports: [],
          });
        }
        multiDimensionalClusters.get(clusterKey)!.reports.push({
          id: report.id,
          date: report.reported_date || report.created_at,
          timeMs: validDateMs,
          eventType,
          text: report.raw_text,
        });
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

      if (cls.campbell_gates.decision_verdict === "Diagnostic: High Exposure / Major Event") campbellGateCounters.actualSif++;
      else if (cls.campbell_gates.decision_verdict === "Diagnostic: SIF Precursor") campbellGateCounters.precursorSif++;
      else campbellGateCounters.nonSif++;
    } else {
      if (isSif) campbellGateCounters.precursorSif++;
      else campbellGateCounters.nonSif++;
    }

    // Site aggregation
    const siteKey = report.site || "General Facility";
    if (!siteMap.has(siteKey)) {
      siteMap.set(siteKey, {
        total: 0,
        sif: 0,
        rules: new Map(),
        activities: new Map(),
        history: [],
      });
    }
    const siteData = siteMap.get(siteKey)!;
    siteData.total++;
    siteData.history.push({ date: validDateMs, isSif });
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

  // Build ranked site aggregates with REAL mathematical trend delta
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

    // Compute real empirical trend delta:
    // Split chronological history into first half vs second half
    let calculatedDelta = 0.0;
    if (data.history.length >= 4) {
      const sortedHistory = [...data.history].sort((a, b) => a.date - b.date);
      const midpoint = Math.floor(sortedHistory.length / 2);
      const priorSlice = sortedHistory.slice(0, midpoint);
      const recentSlice = sortedHistory.slice(midpoint);

      const priorSif = priorSlice.filter((h) => h.isSif).length;
      const priorDensity = priorSlice.length > 0 ? (priorSif / priorSlice.length) * 100 : 0;

      const recentSif = recentSlice.filter((h) => h.isSif).length;
      const recentDensity = recentSlice.length > 0 ? (recentSif / recentSlice.length) * 100 : 0;

      calculatedDelta = Number((recentDensity - priorDensity).toFixed(1));
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
      trend_delta: calculatedDelta,
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

  // Build Multi-Dimensional Recurring Pattern Callouts & Trajectory
  const patternCallouts: PatternCallout[] = [];

  for (const [, cluster] of multiDimensionalClusters.entries()) {
    if (cluster.reports.length >= 2) {
      // Sort reports in cluster by time
      const sortedCluster = [...cluster.reports].sort((a, b) => a.timeMs - b.timeMs);
      const count = sortedCluster.length;
      const firstObs = sortedCluster[0].date;
      const lastObs = sortedCluster[sortedCluster.length - 1].date;
      const timeSpanDays = Math.max(
        1,
        Math.round((sortedCluster[sortedCluster.length - 1].timeMs - sortedCluster[0].timeMs) / (1000 * 60 * 60 * 24))
      );

      // Trajectory determination via statistical temporal direction
      const clusterTimestamps = sortedCluster.map((r) => r.timeMs);
      const temporalDir = calculateTemporalDirection(clusterTimestamps);
      let trajectory: PrecursorTrajectory = "RECURRING";
      if (temporalDir === "INCREASING") {
        trajectory = "ESCALATING";
      } else if (timeSpanDays > 30) {
        trajectory = "PERSISTENT";
      }

      // Check for Post-CAPA recurrence:
      // Is there a closed or completed action for this site + rule + activity where events occurred post-closure?
      const latestClusterTime = sortedCluster[sortedCluster.length - 1].timeMs;
      const matchingClosedCapa = existingActions.find((a) => {
        if (a.site !== cluster.site) return false;
        if (a.life_saving_rule !== cluster.rule) return false;
        if (a.status !== "completed" && a.status !== "verified") return false;
        const closureTime = new Date(a.completed_at || a.verified_at || a.created_at).getTime();
        return !isNaN(closureTime) && !isNaN(latestClusterTime) && latestClusterTime >= closureTime;
      });

      let hasRecurrenceAlert = false;
      let linkedCapaId: string | undefined = undefined;
      if (matchingClosedCapa) {
        trajectory = "POST_CAPA_RECURRENCE";
        hasRecurrenceAlert = true;
        linkedCapaId = matchingClosedCapa.id;
      }

      const severity: "critical" | "high" | "medium" =
        trajectory === "POST_CAPA_RECURRENCE" || trajectory === "ESCALATING" || count >= 3
          ? "critical"
          : count === 2
          ? "high"
          : "medium";

      const eventTypes = Array.from(new Set(sortedCluster.map((r) => r.eventType)));

      patternCallouts.push({
        id: `pat-${uuidv4().slice(0, 8)}`,
        site: cluster.site,
        facility: cluster.site,
        activity: cluster.activity,
        barrier_compromised: cluster.barrier,
        life_saving_rule: cluster.rule,
        event_types: eventTypes,
        report_ids: sortedCluster.map((r) => r.id),
        detected_at: new Date().toISOString(),
        first_observed_at: firstObs,
        last_observed_at: lastObs,
        time_window_days: timeSpanDays,
        narrative: hasRecurrenceAlert
          ? `CRITICAL POST-CAPA RECURRENCE: ${count} precursor events under ${cluster.rule} recurred at ${cluster.site} during ${cluster.activity} despite CAPA ${matchingClosedCapa?.title} closure.`
          : `Precursor cluster (${trajectory}) detected at ${cluster.site}: ${count} observations compromising ${cluster.barrier} during ${cluster.activity} under ${cluster.rule} within a ${timeSpanDays}-day window.`,
        count,
        sif_count: count,
        activity_summary: cluster.activity,
        severity,
        trajectory,
        temporal_trend: `${count} events across ${timeSpanDays} days (${trajectory})`,
        recommended_intervention: `Conduct targeted verification of ${cluster.barrier} on site with area supervisor prior to next operational shift.`,
        linked_capa_id: linkedCapaId,
        has_recurrence_alert: hasRecurrenceAlert,
      });
    }
  }

  patternCallouts.sort((a, b) => {
    if (a.trajectory === "POST_CAPA_RECURRENCE") return -1;
    if (b.trajectory === "POST_CAPA_RECURRENCE") return 1;
    return b.count - a.count;
  });

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
    standard: "Standard Operational Window",
  };
  const shiftMultipliers: Record<ShiftTiming, number> = {
    morning_handover: 1.35,
    evening_handover: 1.35,
    night_shift: 1.4,
    day_shift: 1.0,
    standard: 1.0,
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
    unsafeActsCount,
    unsafeConditionsCount,
    nearMissesCount,
    incidentsCount,
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
    sifDecisionGateSummary: campbellGateCounters,
    campbellGateSummary: campbellGateCounters,
    facilityCeiSummaries,
  };
}
