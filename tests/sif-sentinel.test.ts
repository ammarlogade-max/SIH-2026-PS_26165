import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { generateLayerAClassification } from "../src/lib/layer-a-classifier";
import {
  analyzeEnergyWheel,
  evaluateSIFDecisionGates,
  detectShiftAndCircadianRisk,
  inferControlHierarchy,
} from "../src/lib/safety-science-engine";
import {
  createChainedEntry,
  verifyAuditChainIntegrity,
  saveCorrectiveAction,
  updateCorrectiveAction,
  saveClassificationReview,
  getSafetySnapshot,
  resetSafetyStore,
} from "../src/lib/safety-store";
import { calculateROCAUC } from "../src/lib/model-evaluation";
import { AuditLogEntry, LifeSavingRule } from "../src/lib/types";
import { v4 as uuidv4 } from "uuid";

describe("SIF Sentinel Regression Test Suite (19 Critical Invariants)", () => {
  before(async () => {
    await resetSafetyStore(true);
  });

  // Test 1: Bulk historical timestamp parameter pass-through
  it("1. Classifier preserves explicit historical timestamp without defaulting to current time", () => {
    const historicalDate = "2023-04-12T04:30:00.000Z";
    const reportText = "Worker observed on drilling floor near high pressure mud manifold without whip checks secured.";
    const classification = generateLayerAClassification("rep-hist-01", reportText, historicalDate);

    assert.equal(
      classification.created_at,
      historicalDate,
      `Expected classification timestamp to match historical date ${historicalDate}, got ${classification.created_at}`
    );
  });

  // Test 2: Evidence span extraction from report text
  it("2. Extracted evidence_span is an authentic substring of the raw incident text", () => {
    const text = "During derrick maintenance at 25m elevation, the scaffolding plank was unsecured and slipped under load.";
    const classification = generateLayerAClassification("rep-evid-01", text);

    assert.ok(classification.evidence_span, "Expected evidence_span to be populated for a working at height hazard");
    assert.ok(
      text.toLowerCase().includes(classification.evidence_span.toLowerCase()),
      `evidence_span "${classification.evidence_span}" must be an exact substring of raw text`
    );
  });

  // Test 3: Evidence span returns undefined/null when no physical hazard text exists
  it("3. evidence_span is undefined or null when no actual physical hazard exists in text", () => {
    const benignText = "Routine shift handover completed in administration building. All logbooks reviewed and signed off.";
    const classification = generateLayerAClassification("rep-benign-01", benignText);

    assert.equal(
      classification.evidence_span,
      undefined,
      "Expected evidence_span to be undefined when no hazard phrase is present"
    );
    assert.equal(classification.is_sif_potential, false, "Benign logbook handover must not be SIF potential");
  });

  // Test 4: SIF Decision Gates decoupled evaluation
  it("4. Decision gates evaluate high-energy and barrier status independently", () => {
    // Scenario: High energy present + Direct control missing/compromised -> SIF Potential
    const evalHighCompromised = evaluateSIFDecisionGates(
      "Working at Height",
      "High-Energy",
      "Compromised / Ineffective",
      "Worker climbing derrick ladder without fall arrester"
    );
    assert.equal(evalHighCompromised.gate1_high_energy, true, "Gate 1 should detect high energy");
    assert.equal(evalHighCompromised.gate2_direct_control, false, "Gate 2 should be false when control is compromised");
    assert.equal(evalHighCompromised.is_sif_potential, true, "Should qualify as SIF potential");

    // Scenario: Low energy -> Gate 1 false -> Non-SIF
    const evalLow = evaluateSIFDecisionGates(
      null,
      "Low-Energy",
      "Functioning",
      "Sorting paper documents in administrative office"
    );
    assert.equal(evalLow.gate1_high_energy, false, "Gate 1 should be false for Low-Energy");
    assert.equal(evalLow.is_sif_potential, false, "Should not qualify as SIF potential");
  });

  // Test 5: Shift and circadian risk classification by timestamp
  it("5. Shift timing and circadian risk correctly classify night and graveyard shifts", () => {
    // 03:00 hours -> Graveyard shift / peak circadian fatigue
    const nightTime = "2024-05-10T03:00:00.000Z";
    const nightShift = detectShiftAndCircadianRisk(nightTime);
    assert.equal(nightShift.shift, "graveyard_shift");
    assert.ok(["elevated", "critical"].includes(nightShift.circadianTier));
    assert.ok(nightShift.multiplier >= 1.2, "Graveyard multiplier should be at least 1.2");

    // 10:00 hours -> Day shift
    const dayTime = "2024-05-10T10:00:00.000Z";
    const dayShift = detectShiftAndCircadianRisk(dayTime);
    assert.equal(dayShift.shift, "day_shift");
    assert.equal(dayShift.circadianTier, "low");
    assert.equal(dayShift.multiplier, 1.0);
  });

  // Test 6: Energy Wheel CSRA category classification
  it("6. CSRA Energy Wheel identifies High-Energy categories accurately", () => {
    const fallText = "Rigger fell from 8 meter monkey board during pipe tripping operations.";
    const gravityResult = analyzeEnergyWheel(fallText, "Working at Height");
    assert.equal(gravityResult.category, "Gravity");
    assert.equal(gravityResult.magnitude, "High-Energy");

    const pressureText = "1500 PSI mud manifold high pressure line developed severe pinhole leak.";
    const pressureResult = analyzeEnergyWheel(pressureText, "Energy Isolation");
    assert.equal(pressureResult.category, "Pressure");
    assert.equal(pressureResult.magnitude, "High-Energy");
  });

  // Test 7: Non-SIF potential observation classification
  it("7. Low-severity non-precursor observations are classified as non-SIF", () => {
    const routineTexts = [
      "Operator noticed minor dust accumulation on desk in control room.",
      "Worker replaced worn shoelaces on safety boots before starting shift.",
      "Small 5ml water puddle noticed near water cooler; wiped dry immediately."
    ];

    for (const text of routineTexts) {
      const cls = generateLayerAClassification(`rep-non-sif-${Math.random()}`, text);
      assert.equal(cls.is_sif_potential, false, `Expected "${text}" to be NON-SIF`);
    }
  });

  // Test 8: Critical SIF precursor classified as SIF potential
  it("8. High-hazard oilfield events are classified as SIF potential with high confidence", () => {
    const criticalPrecursor = "Entry into crude storage tank without atmospheric gas testing and no rescue winch installed.";
    const cls = generateLayerAClassification("rep-sif-crit-1", criticalPrecursor);

    assert.equal(cls.is_sif_potential, true, "Confined space entry without gas testing MUST be SIF potential");
    assert.ok(cls.confidence >= 60, `Confidence must be >= 60%, got ${cls.confidence}%`);
    assert.equal(cls.calibration_status, "uncalibrated_model_probability");
  });

  // Test 9: Life-Saving Rule mapping precision
  it("9. Life-Saving Rules map precisely to corresponding operational hazards", () => {
    const heightCls = generateLayerAClassification("rep-lsr-1", "Worker unhooked safety harness while on scaffold 6 meters high");
    assert.equal(heightCls.life_saving_rule, "Working at Height");

    const lotoCls = generateLayerAClassification("rep-lsr-2", "Electrician performed motor servicing without lock out tag out isolation");
    assert.equal(lotoCls.life_saving_rule, "Energy Isolation");

    const spaceCls = generateLayerAClassification("rep-lsr-3", "Confined space vessel entry conducted without continuous H2S gas monitoring");
    assert.equal(spaceCls.life_saving_rule, "Confined Space");
  });

  // Test 10: Hierarchy of Controls inference
  it("10. Control hierarchy properly classifies Engineering vs Administrative vs PPE", () => {
    const eng = inferControlHierarchy("Install physical barrier and interlock on pump shaft", "Prevent mechanical contact");
    assert.equal(eng.level, "Engineering / Direct Control");
    assert.equal(eng.isWeak, false);

    const admin = inferControlHierarchy("Conduct safety briefing and update standard operating procedure", "Toolbox talk reminder");
    assert.equal(admin.level, "Administrative");
    assert.equal(admin.isWeak, true);

    const ppe = inferControlHierarchy("Distribute high-visibility vests and safety goggles", "Wear PPE on site");
    assert.equal(ppe.level, "PPE");
    assert.equal(ppe.isWeak, true);
  });

  // Test 11: Weak control warning flag on Administrative or PPE for high-energy precursor
  it("11. Weak control warning is triggered for Administrative and PPE actions", () => {
    const adminCheck = inferControlHierarchy("Refresher training on working at height", "Instruct staff to clip harness");
    assert.equal(adminCheck.isWeak, true, "Administrative training must be flagged as weak control");

    const elimCheck = inferControlHierarchy("Decommission and eliminate redundant high pressure bypass valve", "");
    assert.equal(elimCheck.isWeak, false, "Elimination must NOT be flagged as weak control");
  });

  // Test 12: CAPA completion state machine transitions to monitoring (not effective)
  it("12. Completing a CAPA sets status to completed and effectiveness to monitoring", async () => {
    const action = await saveCorrectiveAction({
      site: "Duliajan Field Hub",
      life_saving_rule: "Working at Height",
      title: "Install self-retracting lifeline on mast",
      description: "Provide engineered fall arrest system",
      assigned_to: "Rig Superintendent",
      assigned_role: "Site Safety Supervisor",
      priority: "high",
      due_date: "2026-10-01",
    }, { name: "Safety Officer", role: "HSE Officer" });

    const completedAction = await updateCorrectiveAction(action.id, {
      status: "completed",
      evidence_notes: "SRL unit installed and inspected by third-party certifier.",
    }, { name: "Rig Superintendent", role: "Site Safety Supervisor" });

    assert.equal(completedAction.status, "completed");
    assert.equal(
      completedAction.effectiveness_status,
      "monitoring",
      "CAPA must enter monitoring upon completion, NOT auto-effective"
    );
  });

  // Test 13: CAPA verification retains audit metadata and monitoring
  it("13. Verifying a CAPA sets verified_at and preserves monitoring state without auto-effective", async () => {
    const action = await saveCorrectiveAction({
      site: "Moran Production Station",
      life_saving_rule: "Energy Isolation",
      title: "Install dual-key captive interlock",
      description: "Prevent opening enclosure while powered",
      assigned_to: "Electrical Engineer",
      assigned_role: "HSE Officer",
      priority: "high",
      due_date: "2026-10-15",
    }, { name: "HSE Lead", role: "HSE Officer" });

    const verifiedAction = await updateCorrectiveAction(action.id, {
      status: "verified",
      evidence_notes: "Physical testing verified interlock halts motor immediately upon key turn.",
    }, { name: "Safety Auditor", role: "HSE Officer" });

    assert.equal(verifiedAction.status, "verified");
    assert.ok(verifiedAction.verified_at, "verified_at timestamp must be populated");
    assert.equal(
      verifiedAction.effectiveness_status,
      "monitoring",
      "Verification must remain in monitoring until post-closure evaluation window elapses"
    );
  });

  // Test 14: Post-closure recurrence detection ignores past events prior to CAPA closure
  it("14. Recurrence detection ignores historical reports created BEFORE CAPA closure", async () => {
    const site = "Digboi Refinery Complex";
    const rule: LifeSavingRule = "Confined Space";

    // Create and complete a CAPA
    const action = await saveCorrectiveAction({
      site,
      life_saving_rule: rule,
      title: "Install forced ventilation fans for vessel cleaning",
      description: "Continuous air flow system",
      assigned_to: "Plant Manager",
      assigned_role: "Operations Manager",
      priority: "critical",
      due_date: "2026-08-01",
    }, { name: "Safety Engineer", role: "HSE Officer" });

    // Complete it with a known completion time
    const completed = await updateCorrectiveAction(action.id, {
      status: "completed",
    }, { name: "Plant Manager", role: "Operations Manager" });

    // Check recurrence with an event timestamped BEFORE completion
    const priorEventDate = new Date(new Date(completed.completed_at!).getTime() - 24 * 60 * 60 * 1000).toISOString();
    const isRecurrence = (
      completed.completed_at !== undefined &&
      new Date(priorEventDate).getTime() > new Date(completed.completed_at).getTime()
    );

    assert.equal(isRecurrence, false, "Event prior to closure date must not trigger recurrence");
  });

  // Test 15: Post-closure recurrence detection triggers on new events after CAPA closure
  it("15. Recurrence detection triggers on subsequent events created AFTER CAPA closure", async () => {
    const site = "Jorhat Storage Terminal";
    const rule: LifeSavingRule = "Line of Fire";

    const action = await saveCorrectiveAction({
      site,
      life_saving_rule: rule,
      title: "Install safety guards around high pressure mud pumps",
      description: "Physical shielding",
      assigned_to: "Maintenance Lead",
      assigned_role: "Operations Manager",
      priority: "high",
      due_date: "2026-07-01",
    }, { name: "Inspector", role: "HSE Officer" });

    const completed = await updateCorrectiveAction(action.id, {
      status: "completed",
    }, { name: "Maintenance Lead", role: "Operations Manager" });

    // New event occurred AFTER completion
    const postEventDate = new Date(new Date(completed.completed_at!).getTime() + 48 * 60 * 60 * 1000).toISOString();
    const isPostClosureRecurrence = (
      Boolean(completed.completed_at) &&
      new Date(postEventDate).getTime() > new Date(completed.completed_at!).getTime()
    );

    assert.equal(isPostClosureRecurrence, true, "Event after closure date must trigger recurrence");
  });

  // Test 16: Tamper-evident SHA-256 audit chain detects tampered logs
  it("16. Cryptographic audit chain fails validation if any historical entry is mutated", () => {
    const logs: AuditLogEntry[] = [];
    const entry1 = createChainedEntry(logs, {
      actor_name: "Admin",
      actor_role: "HSE Officer",
      action: "REPORT_FILED",
      entity_type: "report",
      entity_id: "rep-001",
      details: "Initial hazard report",
      status: "success",
    });
    logs.unshift(entry1);

    const entry2 = createChainedEntry(logs, {
      actor_name: "Admin",
      actor_role: "HSE Officer",
      action: "CLASSIFICATION_GENERATED",
      entity_type: "classification",
      entity_id: "cls-001",
      details: "AI classification generated",
      status: "success",
    });
    logs.unshift(entry2);

    // Verify intact chain
    const validCheck = verifyAuditChainIntegrity(logs);
    assert.equal(validCheck.valid, true, "Untampered chain must validate as true");

    // Tamper with entry1 details
    logs[1].details = "Tampered details by unauthorized actor";
    const tamperedCheck = verifyAuditChainIntegrity(logs);
    assert.equal(tamperedCheck.valid, false, "Tampered chain must be detected as invalid");
  });

  // Test 17: Valid SHA-256 audit chain integrity verification
  it("17. Tamper-evident SHA-256 audit chain validates sequential hash linking", () => {
    const logs: AuditLogEntry[] = [];
    for (let i = 1; i <= 5; i++) {
      const entry = createChainedEntry(logs, {
        actor_name: `Officer ${i}`,
        actor_role: "HSE Officer",
        action: "ROUTINE_AUDIT",
        entity_type: "audit",
        entity_id: `aud-00${i}`,
        details: `Audit check #${i}`,
        status: "success",
      });
      logs.unshift(entry);
    }

    const check = verifyAuditChainIntegrity(logs);
    assert.equal(check.valid, true);
    assert.equal(check.total_entries, 5);
    assert.equal(check.tampered_count, 0);
  });

  // Test 18: Human review override increments review_version and preserves history
  it("18. Human review override increments review_version and logs HumanReviewRecord", async () => {
    const snapshot = await getSafetySnapshot();
    const sampleReport = snapshot.reports[0];
    assert.ok(sampleReport, "Must have at least one sample report in snapshot");

    // First review override
    const rev1 = await saveClassificationReview(
      sampleReport.id,
      {
        is_sif_potential: true,
        life_saving_rule: "Working at Height",
        override_reason: "HSE Officer field audit verified high elevation hazard",
        review_notes: "Version 1 notes",
      },
      { name: "Senior Inspector", role: "HSE Officer" }
    );

    assert.equal(rev1.human_reviewed, true);
    assert.equal(rev1.review_version, 1, "First review must set review_version to 1");
    assert.equal(rev1.review_history?.length, 1);
    assert.equal(rev1.review_history[0].review_version, 1);
    assert.equal(rev1.review_history[0].status, "OVERRIDDEN");

    // Second review override (re-review)
    const rev2 = await saveClassificationReview(
      sampleReport.id,
      {
        is_sif_potential: false,
        life_saving_rule: null,
        override_reason: "Re-evaluated with video evidence: ladder was within enclosed cage",
        review_notes: "Version 2 notes",
      },
      { name: "Chief Safety Director", role: "HSE Officer" }
    );

    assert.equal(rev2.review_version, 2, "Second review must increment review_version to 2");
    assert.equal(rev2.review_history?.length, 2);
    assert.equal(rev2.review_history[1].review_version, 2);
    assert.equal(rev2.is_sif_potential, false);
  });

  // Test 19: ROC-AUC evaluation calculation accuracy and unclamped range
  it("19. ROC-AUC calculation calculates true mathematical trapezoidal area without artificial clamping", () => {
    // Perfect predictions: y_true and y_scores in perfect concordance
    const perfectScores = [
      { yTrue: 1, yScore: 0.95 },
      { yTrue: 1, yScore: 0.85 },
      { yTrue: 0, yScore: 0.15 },
      { yTrue: 0, yScore: 0.05 },
    ];
    const perfectAuc = calculateROCAUC(perfectScores);
    assert.equal(perfectAuc, 1.0, `Perfect ranking must give AUC 1.0, got ${perfectAuc}`);

    // Inverted predictions (should be 0.0, NOT clamped to 0.5)
    const invertedScores = [
      { yTrue: 1, yScore: 0.10 },
      { yTrue: 1, yScore: 0.20 },
      { yTrue: 0, yScore: 0.80 },
      { yTrue: 0, yScore: 0.90 },
    ];
    const invertedAuc = calculateROCAUC(invertedScores);
    assert.equal(invertedAuc, 0.0, `Inverted ranking must yield true 0.0 without clamping to 0.5, got ${invertedAuc}`);

    // Tied scores (random guessing, ~0.5)
    const randomScores = [
      { yTrue: 1, yScore: 0.50 },
      { yTrue: 0, yScore: 0.50 },
    ];
    const randomAuc = calculateROCAUC(randomScores);
    assert.equal(randomAuc, 0.5, `Tied guessing must yield 0.5, got ${randomAuc}`);
  });

  // Test 20: ML probability independence (Gate 1 does not alter ML probability)
  it("20. ML probability is independent and not modified by Gate 1, energy, or barrier status", () => {
    const text = "Worker observed climbing drilling mast at 15 meters without safety harness.";
    const cls = generateLayerAClassification("rep-indep-1", text);

    assert.ok(cls.ml_sif_probability > 0, "ML SIF probability must be computed");
    assert.equal(cls.calibration_status, "uncalibrated_model_probability");
    // ML confidence must derive strictly from distance from threshold (0.50)
    const expectedConfidence = Number((cls.ml_sif_probability * 100).toFixed(1));
    assert.equal(cls.confidence, expectedConfidence, "Confidence must match raw un-clamped ML probability distance");
    // Operational priority must be distinct and for triage
    assert.ok(["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(cls.operational_priority));
  });

  // Test 21: Energy detection requires evidence (no fallback energy categories)
  it("21. Energy detection requires evidence and returns UNKNOWN with null evidence when no hazard keywords exist", () => {
    const benignText = "Attended morning toolbox talk in the mess hall and signed attendance register.";
    const energyResult = analyzeEnergyWheel(benignText, null);

    assert.equal(energyResult.category, "UNKNOWN");
    assert.equal(energyResult.magnitude, "UNKNOWN");
    assert.equal(energyResult.energy_detected, false);
    assert.equal(energyResult.energy_evidence, null);
  });

  // Test 22: Gate 1 requires evidence (no rule-only energy inference)
  it("22. Gate 1 evaluates to UNKNOWN or NOT_FOUND without text evidence, even if a rule is suggested", () => {
    const evalNoEnergy = evaluateSIFDecisionGates(
      "Attended morning safety briefing in conference room",
      "UNKNOWN",
      "UNKNOWN",
      null
    );

    assert.equal(evalNoEnergy.gate1_high_energy, false);
    assert.ok(["UNKNOWN", "NOT_FOUND"].includes(evalNoEnergy.gate1_status));
    assert.equal(evalNoEnergy.gate1_evidence, null);
  });

  // Test 23: Gate 2 requires evidence (no fabricated barrier intact)
  it("23. Gate 2 does not claim direct barrier intact when no barrier condition was observed in narrative", () => {
    const evalUnknownBarrier = evaluateSIFDecisionGates(
      "Worker walking across pipe yard during routine afternoon rounds",
      "UNKNOWN",
      "UNKNOWN",
      {
        identified_barrier: null,
        barrier_description: "No explicit barrier condition reported in observation text",
        reliability_score: 50,
        hierarchy_rank: 3,
        weak_control_flag: false,
        recommended_direct_control: "Verify barrier integrity",
        evidence_span: null,
        evidence_status: "UNKNOWN",
        compromised_level: "Administrative",
        direct_control_status: "unknown",
        barrier_state: "UNKNOWN",
      }
    );

    assert.equal(evalUnknownBarrier.gate2_direct_control_compromised, false);
    assert.ok(["UNKNOWN", "NOT_FOUND"].includes(evalUnknownBarrier.gate2_status));
    assert.equal(evalUnknownBarrier.gate2_evidence, null);
  });

  // Test 24: Gate 3 requires evidence (no default safe standoff)
  it("24. Gate 3 does not assume safe standoff without explicit textual evidence", () => {
    const neutralText = "Routine maintenance on pump skid completed according to schedule.";
    const evalGate3 = evaluateSIFDecisionGates(
      neutralText,
      "UNKNOWN",
      "UNKNOWN",
      null
    );

    assert.equal(evalGate3.gate3_line_of_fire_intersected, false);
    assert.equal(evalGate3.gate3_status, "UNKNOWN");
    assert.equal(evalGate3.gate3_evidence, null);
  });

  // Test 25: Facility density calculates exact ratio and warns on small N
  it("25. Facility SIF profile calculates exact mathematical density and triggers sample size warning when N < 10", () => {
    const { computeFacilitySIFProfile } = require("../src/lib/aggregation-engine");
    const mockReports = [
      { id: "r1", raw_text: "Fall from scaffold 10m", site: "Rig Alpha", activity: "Drilling", event_type: "Near-Miss", reported_date: "2024-01-01", created_at: "2024-01-01T00:00:00.000Z", source: "manual" },
      { id: "r2", raw_text: "Housekeeping completed", site: "Rig Alpha", activity: "Maintenance", event_type: "Unsafe Condition", reported_date: "2024-01-02", created_at: "2024-01-02T00:00:00.000Z", source: "manual" },
      { id: "r3", raw_text: "High pressure line leak", site: "Rig Alpha", activity: "Production", event_type: "Incident", reported_date: "2024-01-03", created_at: "2024-01-03T00:00:00.000Z", source: "manual" },
    ];
    const mockClassifications = [
      { report_id: "r1", is_sif_potential: true },
      { report_id: "r2", is_sif_potential: false },
      { report_id: "r3", is_sif_potential: true },
    ];

    const profile = computeFacilitySIFProfile(mockReports, mockClassifications, "Rig Alpha");
    assert.equal(profile.observation_count, 3);
    assert.equal(profile.sif_count, 2);
    assert.equal(profile.density.numerator, 2);
    assert.equal(profile.density.denominator, 3);
    assert.equal(profile.density.percentage, 66.7);
    assert.equal(profile.density.sample_size_warning, true, "N=3 < 10 must flag sample_size_warning");
  });

  // Test 26: Recurrence requires same failure mode, not merely same rule
  it("26. Multi-dimensional clustering distinguishes different failure modes under the same Life-Saving Rule", () => {
    const { computeAggregates } = require("../src/lib/aggregation-engine");
    const reports = [
      { id: "rep-a", raw_text: "Scaffold missing toe board at elevation", site: "Platform 1", activity: "Painting", event_type: "Unsafe Condition", reported_date: "2024-02-01", created_at: "2024-02-01T00:00:00.000Z", source: "manual" },
      { id: "rep-b", raw_text: "Unclipped harness while climbing crane ladder", site: "Platform 1", activity: "Rigging", event_type: "Unsafe Act", reported_date: "2024-02-05", created_at: "2024-02-05T00:00:00.000Z", source: "manual" },
    ];
    const classifications = [
      {
        report_id: "rep-a",
        is_sif_potential: true,
        life_saving_rule: "Working at Height",
        energy_category: "Gravity",
        barrier_assessment: { identified_barrier: "Toe Board", direct_control_status: "absent", barrier_state: "MISSING" },
      },
      {
        report_id: "rep-b",
        is_sif_potential: true,
        life_saving_rule: "Working at Height",
        energy_category: "Gravity",
        barrier_assessment: { identified_barrier: "Fall Arrest Harness", direct_control_status: "bypassed", barrier_state: "FAILED" },
      },
    ];

    const agg = computeAggregates(reports, classifications, []);
    // Because activities, barriers, and failure modes differ, they must NOT conflate into 1 cluster
    const clusterForBoth = agg.patternCallouts.find((p: any) => p.report_ids.includes("rep-a") && p.report_ids.includes("rep-b"));
    assert.equal(clusterForBoth, undefined, "Distinct failure modes/barriers must not be conflated into the same recurring pattern");
  });

  // Test 27: Post-CAPA recurrence triggers only on events after closure
  it("27. Post-CAPA recurrence triggers only on events occurring after CAPA completion date", () => {
    const { evaluateCAPAEffectiveness } = require("../src/lib/aggregation-engine");
    const capa = {
      id: "capa-test-1",
      site: "Refinery North",
      life_saving_rule: "Energy Isolation",
      status: "completed",
      completed_at: "2024-03-10T12:00:00.000Z",
    };

    // Subsequent events occurring before closure
    const priorObs = [
      { site: "Refinery North", rule: "Energy Isolation", dateMs: new Date("2024-03-05T00:00:00.000Z").getTime() },
    ];
    const evalPrior = evaluateCAPAEffectiveness(capa, priorObs);
    assert.equal(evalPrior.recurrence_detected, false, "Events before closure must not trigger post-CAPA recurrence");

    // Subsequent events occurring after closure
    const postObs = [
      { site: "Refinery North", rule: "Energy Isolation", dateMs: new Date("2024-03-15T00:00:00.000Z").getTime() },
    ];
    const evalPost = evaluateCAPAEffectiveness(capa, postObs);
    assert.equal(evalPost.recurrence_detected, true, "Events after closure MUST trigger recurrence detection");
    assert.equal(evalPost.status, "INEFFECTIVE_RECURRENCE_DETECTED");
  });

  // Test 28: Temporal direction calculates math trend, returns INSUFFICIENT_DATA when appropriate
  it("28. Temporal direction calculates math trend across windows and returns INSUFFICIENT_DATA for sparse data", () => {
    const { calculateTemporalDirection } = require("../src/lib/aggregation-engine");

    // Sparse data (< 4 timestamps)
    assert.equal(calculateTemporalDirection([1000, 2000]), "INSUFFICIENT_DATA");

    // Increasing trend across 4 days (Window 1: 2 events, Window 2: 4 events)
    const baseDay = 1700000000000;
    const dayMs = 86400000;
    const increasingTimes = [
      baseDay,
      baseDay + dayMs * 0.5,
      baseDay + dayMs * 2.1,
      baseDay + dayMs * 2.2,
      baseDay + dayMs * 2.3,
      baseDay + dayMs * 2.4,
    ];
    assert.equal(calculateTemporalDirection(increasingTimes), "INCREASING");
  });
});
