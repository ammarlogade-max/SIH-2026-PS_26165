import { NextResponse } from "next/server";
import { getSafetySnapshot } from "@/lib/safety-store";
import { computeAggregates } from "@/lib/aggregation-engine";
import { FacilitySummary, LifeSavingRule } from "@/lib/types";

// Standard facility directory for Oil India Limited operations
const KNOWN_FACILITIES: { name: string; code: string; type: string; location: string }[] = [
  { name: "Duliajan Rig 7", code: "DUL-RIG07", type: "Drilling Rig", location: "Duliajan, Dibrugarh, Assam" },
  { name: "Moran GGS", code: "MRN-GGS01", type: "Gas Gathering Station", location: "Moran, Charaideo, Assam" },
  { name: "Naharkatiya Rig 4", code: "NHK-RIG04", type: "Drilling Rig", location: "Naharkatiya, Dibrugarh, Assam" },
  { name: "Digboi Tank Farm", code: "DGB-TKF02", type: "Crude Storage & Dispatch", location: "Digboi, Tinsukia, Assam" },
  { name: "Jorajan CTF", code: "JRJ-CTF01", type: "Central Tank Farm", location: "Jorajan, Tinsukia, Assam" },
  { name: "Shalmari Wellsite", code: "SHL-WST03", type: "Exploration Wellsite", location: "Shalmari, Dibrugarh, Assam" },
  { name: "Tinsukia Pipeline Header", code: "TSK-PLH01", type: "Pipeline Transmission Hub", location: "Tinsukia Junction, Assam" },
  { name: "Dikom Gas Compressor", code: "DKM-GCS01", type: "Gas Compression Station", location: "Dikom, Dibrugarh, Assam" },
  { name: "Kusijan Wellsite", code: "KSJ-WST08", type: "Development Wellsite", location: "Kusijan, Tinsukia, Assam" },
];

export async function GET() {
  try {
    const snapshot = await getSafetySnapshot();
    const reports = snapshot.reports || [];
    const classifications = snapshot.classifications || [];
    const actions = snapshot.actions || [];

    const aggregates = computeAggregates(reports, classifications);
    const siteAggMap = new Map(aggregates.siteAggregates.map((s) => [s.site.toLowerCase(), s]));

    // Map patterns by site
    const patternCountMap = new Map<string, number>();
    for (const pat of aggregates.patternCallouts) {
      const k = pat.site.toLowerCase();
      patternCountMap.set(k, (patternCountMap.get(k) || 0) + 1);
    }

    // Map open actions by site
    const actionCountMap = new Map<string, number>();
    for (const act of actions) {
      if (act.status === "open" || act.status === "in_progress" || act.status === "overdue") {
        const k = act.site.toLowerCase();
        actionCountMap.set(k, (actionCountMap.get(k) || 0) + 1);
      }
    }

    // Combine known facilities and any dynamic sites from reports
    const facilityMap = new Map<string, FacilitySummary>();
    const ceiMap = new Map(aggregates.facilityCeiSummaries.map((c) => [c.site.toLowerCase(), c]));

    for (const fac of KNOWN_FACILITIES) {
      const agg = siteAggMap.get(fac.name.toLowerCase());
      const total = agg?.total_reports || 0;
      const sif = agg?.sif_reports || 0;
      const density = agg?.precursor_density || 0;
      const patCount = patternCountMap.get(fac.name.toLowerCase()) || 0;
      const openActs = actionCountMap.get(fac.name.toLowerCase()) || 0;
      const ceiInfo = ceiMap.get(fac.name.toLowerCase());

      // Risk score: 100 is best, penalize high density, CEI, and recurring patterns
      const ceiScore = ceiInfo?.cei || 0;
      const rawScore = Math.max(15, Math.min(100, Math.round(100 - (density * 0.7 + ceiScore * 0.4) - patCount * 6)));
      const riskLevel: "critical" | "elevated" | "controlled" =
        density >= 35 || patCount >= 2 || ceiScore >= 65 ? "critical" : density >= 15 || ceiScore >= 35 ? "elevated" : "controlled";

      facilityMap.set(fac.name.toLowerCase(), {
        id: `fac-${fac.code.toLowerCase()}`,
        name: fac.name,
        code: fac.code,
        type: fac.type,
        location: fac.location,
        total_reports: total,
        sif_reports: sif,
        precursor_density: density,
        primary_rule: (agg?.primary_rule as LifeSavingRule) || null,
        active_patterns_count: patCount,
        open_actions_count: openActs,
        safety_score: rawScore,
        risk_level: riskLevel,
        trend_direction: (agg?.trend_delta ?? 0) > 1.0 ? "increasing" : (agg?.trend_delta ?? 0) < -1.0 ? "decreasing" : "stable",
        cumulative_exposure_index: ceiScore,
        cei: ceiScore,
        cei_status: ceiInfo?.status || "controlled",
        velocity_14d: ceiInfo?.velocity14d || 0,
        precursor_cluster_storm: ceiInfo?.clusterStorm || false,
        cluster_storm: ceiInfo?.clusterStorm || false,
        dominant_energy_category: ceiInfo?.dominantEnergy || null,
        dominant_energy: ceiInfo?.dominantEnergy || null,
        direct_barrier_failure_rate: ceiInfo?.directBarrierFailureRate || 0,
      });
    }

    // If there are sites in reports that weren't in KNOWN_FACILITIES
    for (const siteAgg of aggregates.siteAggregates) {
      const k = siteAgg.site.toLowerCase();
      if (!facilityMap.has(k)) {
        const patCount = patternCountMap.get(k) || 0;
        const openActs = actionCountMap.get(k) || 0;
        const density = siteAgg.precursor_density;
        const ceiInfo = ceiMap.get(k);
        const ceiScore = ceiInfo?.cei || 0;
        const rawScore = Math.max(15, Math.min(100, Math.round(100 - (density * 0.7 + ceiScore * 0.4) - patCount * 6)));
        const riskLevel: "critical" | "elevated" | "controlled" =
          density >= 35 || patCount >= 2 || ceiScore >= 65 ? "critical" : density >= 15 || ceiScore >= 35 ? "elevated" : "controlled";

        facilityMap.set(k, {
          id: `fac-${k.replace(/\s+/g, "-")}`,
          name: siteAgg.site,
          code: `OIL-${siteAgg.site.slice(0, 3).toUpperCase()}`,
          type: "Operational Facility",
          location: "Assam Asset, India",
          total_reports: siteAgg.total_reports,
          sif_reports: siteAgg.sif_reports,
          precursor_density: density,
          primary_rule: siteAgg.primary_rule || null,
          active_patterns_count: patCount,
          open_actions_count: openActs,
          safety_score: rawScore,
          risk_level: riskLevel,
          trend_direction: (siteAgg.trend_delta ?? 0) > 1.0 ? "increasing" : (siteAgg.trend_delta ?? 0) < -1.0 ? "decreasing" : "stable",
          cumulative_exposure_index: ceiScore,
          cei: ceiScore,
          cei_status: ceiInfo?.status || "controlled",
          velocity_14d: ceiInfo?.velocity14d || 0,
          precursor_cluster_storm: ceiInfo?.clusterStorm || false,
          cluster_storm: ceiInfo?.clusterStorm || false,
          dominant_energy_category: ceiInfo?.dominantEnergy || null,
          dominant_energy: ceiInfo?.dominantEnergy || null,
          direct_barrier_failure_rate: ceiInfo?.directBarrierFailureRate || 0,
        });
      }
    }

    const facilities = Array.from(facilityMap.values()).sort(
      (a, b) => b.precursor_density - a.precursor_density || a.safety_score - b.safety_score
    );

    return NextResponse.json({
      facilities,
      total_facilities: facilities.length,
      critical_count: facilities.filter((f) => f.risk_level === "critical").length,
      elevated_count: facilities.filter((f) => f.risk_level === "elevated").length,
      controlled_count: facilities.filter((f) => f.risk_level === "controlled").length,
    });
  } catch (error) {
    console.error("Failed to load facility intelligence:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load facilities" },
      { status: 500 }
    );
  }
}
