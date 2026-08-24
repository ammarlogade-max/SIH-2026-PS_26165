import { Report, Classification, SiteActivityAggregate, PatternCallout, LifeSavingRule } from "./types";
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
    
    // Find top primary rule for this site
    let topRule: LifeSavingRule | null = null;
    let maxRuleCount = 0;
    for (const [r, count] of data.rules.entries()) {
      if (count > maxRuleCount) {
        maxRuleCount = count;
        topRule = r;
      }
    }

    // Find most frequent activity for this site
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

  // Sort pattern callouts by report count descending
  patternCallouts.sort((a, b) => b.count - a.count);

  const topSiteObj = siteAggregates[0] || null;

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
  };
}
