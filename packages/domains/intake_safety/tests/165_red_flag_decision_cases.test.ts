import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createSynchronousSafetyServices,
  createSynchronousSafetyStore,
  createUrgentDiversionSettlementService,
  phase1SynchronousSafetyRulePackRegistry,
  type SynchronousSafetyEvidenceCut,
} from "../src/index.ts";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..", "..", "..", "..");
const CASES_PATH = path.join(ROOT, "data", "test", "165_red_flag_decision_cases.csv");

type CaseRow = Record<string, string>;

function parseCsv(text: string): CaseRow[] {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function expectedList(value: string): string[] {
  return value ? value.split("|").filter(Boolean).sort() : [];
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function baseShape(requestTypeRef: SynchronousSafetyEvidenceCut["requestTypeRef"]) {
  switch (requestTypeRef) {
    case "Meds":
      return {
        requestShape: {
          meds: {
            queryTypeCode: "repeat_supply",
            urgencyCode: "routine",
          },
        },
        activeStructuredAnswers: {
          "meds.queryType": "repeat_supply",
          "meds.urgency": "routine",
          "meds.issueDescription": "I need help with a routine repeat medication question.",
        },
        authoredNarrativeText: "I need help with a routine repeat medication question.",
        summaryFragments: ["Medication question"],
      };
    case "Admin":
      return {
        requestShape: {
          admin: {
            supportTypeCode: "general_admin",
            deadlineKnown: "no_deadline",
          },
        },
        activeStructuredAnswers: {
          "admin.supportType": "general_admin",
          "admin.deadlineKnown": "no_deadline",
          "admin.details": "I need help with a routine admin request.",
        },
        authoredNarrativeText: "I need help with a routine admin request.",
        summaryFragments: ["Admin request"],
      };
    case "Results":
      return {
        requestShape: {
          results: {
            contextCode: "blood_test",
            questionText: "Please add these results to my record.",
          },
        },
        activeStructuredAnswers: {
          "results.context": "blood_test",
          "results.dateKnown": "exact_or_approx",
          "results.question": "Please add these results to my record.",
        },
        authoredNarrativeText: "Please add these results to my record.",
        summaryFragments: ["Results question"],
      };
    case "Symptoms":
    default:
      return {
        requestShape: {
          symptoms: {
            symptomCategoryCode: "general",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-10",
            worseningNow: false,
          },
        },
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-10",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": [],
          "symptoms.narrative": "A routine concern that is not changing quickly.",
        },
        authoredNarrativeText: "A routine concern that is not changing quickly.",
        summaryFragments: ["General symptoms"],
      };
  }
}

function variantOverrides(variant: string) {
  switch (variant) {
    case "chest_breathing_hard_stop":
    case "urgent_required_not_issued":
      return {
        requestShape: {
          symptoms: {
            symptomCategoryCode: "chest_breathing",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-14",
            worseningNow: false,
          },
        },
        activeStructuredAnswers: {
          "symptoms.category": "chest_breathing",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": [],
          "symptoms.narrative": "Tight chest and struggling to breathe now.",
        },
        authoredNarrativeText: "Tight chest and struggling to breathe now.",
        summaryFragments: ["Tight chest", "Breathing concern"],
      };
    case "collapse_neuro_hard_stop":
      return {
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": [],
          "symptoms.narrative": "I passed out and had slurred speech.",
        },
        authoredNarrativeText: "I passed out and had slurred speech.",
        summaryFragments: ["Collapse signal"],
      };
    case "severe_med_reaction_hard_stop":
      return {
        requestShape: {
          meds: {
            queryTypeCode: "side_effect",
            urgencyCode: "routine",
          },
        },
        activeStructuredAnswers: {
          "meds.queryType": "side_effect",
          "meds.urgency": "routine",
          "meds.issueDescription": "Swollen tongue and difficulty breathing after medication.",
        },
        authoredNarrativeText: "Swollen tongue and difficulty breathing after medication.",
        summaryFragments: ["Medication reaction"],
      };
    case "heavy_bleeding_hard_stop":
      return {
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": [],
          "symptoms.narrative": "Pregnant and bleeding heavily today.",
        },
        authoredNarrativeText: "Pregnant and bleeding heavily today.",
        summaryFragments: ["Bleeding signal"],
      };
    case "self_harm_hard_stop":
      return {
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": [],
          "symptoms.narrative": "I feel suicidal and unsafe at home.",
        },
        authoredNarrativeText: "I feel suicidal and unsafe at home.",
        summaryFragments: ["Safeguarding signal"],
      };
    case "severe_pain_single_urgent_contributor":
      return {
        requestShape: {
          symptoms: {
            symptomCategoryCode: "pain",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-14",
            worseningNow: false,
          },
        },
        activeStructuredAnswers: {
          "symptoms.category": "pain",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["mobility_affected"],
          "symptoms.narrative": "Severe pain is limiting movement.",
        },
        authoredNarrativeText: "Severe pain is limiting movement.",
        summaryFragments: ["Severe pain"],
      };
    case "rapid_worsening_recent_onset":
      return {
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-15",
          "symptoms.worseningNow": true,
          "symptoms.severityClues": [],
          "symptoms.narrative": "The symptoms started today and are rapidly worsening.",
        },
        authoredNarrativeText: "The symptoms started today and are rapidly worsening.",
        summaryFragments: ["Recent worsening"],
      };
    case "high_risk_result_current_symptoms":
      return {
        requestShape: {
          results: {
            contextCode: "blood_test",
            questionText: "High result with current pain.",
          },
        },
        activeStructuredAnswers: {
          "results.context": "blood_test",
          "results.dateKnown": "exact_or_approx",
          "results.question": "High result with current pain.",
        },
        authoredNarrativeText: "The high result came back and I have current pain.",
        summaryFragments: ["High result with current symptoms"],
      };
    case "high_risk_med_interruption":
      return {
        requestShape: {
          meds: {
            queryTypeCode: "repeat_supply",
            urgencyCode: "urgent_today",
          },
        },
        activeStructuredAnswers: {
          "meds.queryType": "repeat_supply",
          "meds.urgency": "urgent_today",
          "meds.issueDescription": "I ran out and need this today.",
        },
        authoredNarrativeText: "I ran out of medication and need this today.",
        summaryFragments: ["Medication interruption"],
      };
    case "moderate_persistent_residual":
      return {
        requestShape: {
          symptoms: {
            symptomCategoryCode: "general",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-01",
            worseningNow: false,
          },
        },
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-01",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["sleep_affected"],
          "symptoms.narrative": "This has continued and is affecting sleep.",
        },
        authoredNarrativeText: "This has continued and is affecting sleep.",
        summaryFragments: ["Persistent symptoms"],
      };
    case "results_unclear_follow_up":
      return {
        requestShape: {
          results: {
            contextCode: "blood_test",
            questionText: "What does it mean for my follow up plan?",
          },
        },
        activeStructuredAnswers: {
          "results.context": "blood_test",
          "results.dateKnown": "unknown",
          "results.question": "What does it mean for my follow up plan?",
        },
        authoredNarrativeText: "What does it mean for my follow up plan?",
        summaryFragments: ["Unclear result meaning"],
      };
    case "admin_deadline_residual":
      return {
        requestShape: {
          admin: {
            supportTypeCode: "fit_note",
            deadlineKnown: "deadline_known",
          },
        },
        activeStructuredAnswers: {
          "admin.supportType": "fit_note",
          "admin.deadlineKnown": "deadline_known",
          "admin.deadlineDate": "2026-04-18",
          "admin.details": "I need a clinical admin form before a known deadline.",
        },
        authoredNarrativeText: "I need a clinical admin form before a known deadline.",
        summaryFragments: ["Admin deadline"],
      };
    case "blocked_contact_reachability_fail_closed":
      return {
        contactPreferencesRef: null,
        contactAuthorityState: "blocked",
      };
    case "hard_stop_with_residual_signal":
      return {
        requestShape: {
          symptoms: {
            symptomCategoryCode: "chest_breathing",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-01",
            worseningNow: false,
          },
        },
        activeStructuredAnswers: {
          "symptoms.category": "chest_breathing",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-01",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["sleep_affected"],
          "symptoms.narrative": "Tight chest has continued and is affecting sleep.",
        },
        authoredNarrativeText: "Tight chest has continued and is affecting sleep.",
        summaryFragments: ["Hard stop plus residual signal"],
      };
    case "repeated_cardio_narrative_single_fire":
      return {
        requestShape: {
          symptoms: {
            symptomCategoryCode: "chest_breathing",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-15",
            worseningNow: true,
          },
        },
        activeStructuredAnswers: {
          "symptoms.category": "chest_breathing",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-15",
          "symptoms.worseningNow": true,
          "symptoms.severityClues": ["mobility_affected", "sudden_change"],
          "symptoms.narrative":
            "Chest pain chest pain chest pain and struggling to breathe with sudden change.",
        },
        authoredNarrativeText:
          "Chest pain chest pain chest pain and struggling to breathe with sudden change.",
        summaryFragments: ["Repeated cardio evidence"],
      };
    case "degraded_attachment_parser_manual_review":
      return {
        evidenceReadinessState: "manual_review_only",
        attachmentRefs: ["att_165_degraded_parser"],
        authoredNarrativeText: "Uploaded document could not be parsed safely.",
        summaryFragments: ["Unresolved upload parser output"],
      };
    default:
      return {};
  }
}

function buildEvidenceCut(row: CaseRow): SynchronousSafetyEvidenceCut {
  const requestTypeRef = row.request_type as SynchronousSafetyEvidenceCut["requestTypeRef"];
  const base = baseShape(requestTypeRef);
  const overrides = variantOverrides(row.input_variant);
  return {
    requestId: `request_165_${slug(row.case_id)}`,
    submissionSnapshotFreezeRef: `freeze_165_${slug(row.case_id)}`,
    evidenceSnapshotRef: `snapshot_165_${slug(row.case_id)}`,
    normalizedSubmissionRef: `normalized_165_${slug(row.case_id)}`,
    sourceLineageRef: `submission_165_${slug(row.case_id)}`,
    requestTypeRef,
    requestShape: base.requestShape,
    activeStructuredAnswers: base.activeStructuredAnswers,
    authoredNarrativeText: base.authoredNarrativeText,
    summaryFragments: base.summaryFragments,
    attachmentRefs: [],
    contactPreferencesRef: "contact_pref_165",
    contactAuthorityState: "assumed_self_service_browser_minimum",
    contactAuthorityClass: "self_asserted",
    evidenceReadinessState: "safety_usable",
    channelCapabilityCeiling: {
      canUploadFiles: true,
      canRenderTrackStatus: true,
      canRenderEmbedded: false,
      mutatingResumeState: "allowed",
    },
    identityContext: {
      bindingState: "anonymous",
      subjectRefPresence: "none",
      claimResumeState: "not_required",
      actorBindingState: "anonymous",
    },
    frozenAt: "2026-04-15T09:00:00Z",
    ...overrides,
  } as SynchronousSafetyEvidenceCut;
}

const rows = parseCsv(fs.readFileSync(CASES_PATH, "utf8"));
const ruleRows = rows.filter((row) => row.case_family === "row_level_rule_coverage");

describe("seq_165 red-flag decision corpus", () => {
  it("covers every current frozen rule-pack row with an automated assertion", () => {
    const currentRuleIds = phase1SynchronousSafetyRulePackRegistry[0].rules
      .map((rule) => rule.ruleId)
      .sort();
    const assertedRuleIds = ruleRows.map((row) => row.source_rule_id).sort();

    expect(assertedRuleIds).toEqual(currentRuleIds);
    expect(
      rows.every((row) =>
        row.automated_assertion_ref.startsWith(
          "packages/domains/intake_safety/tests/165_red_flag_decision_cases.test.ts",
        ),
      ),
    ).toBe(true);
  });

  it.each(rows)("$case_id returns the expected safety decision chain", async (row) => {
    const repositories = createSynchronousSafetyStore();
    const services = createSynchronousSafetyServices(repositories);
    const evidenceCut = buildEvidenceCut(row);

    const result = await services.synchronousSafety.evaluateFrozenSubmission({
      episodeId: `episode_165_${slug(row.case_id)}`,
      requestId: evidenceCut.requestId,
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-15T09:00:01Z",
      evidenceCut,
      preferredRulePackVersionRef: row.source_rule_pack_ref,
    });

    expect(result.safetyDecision.decisionOutcome).toBe(row.expected_decision_outcome);
    expect(result.safetyDecision.requestedSafetyState).toBe(row.expected_requested_safety_state);
    expect(result.classification.dominantEvidenceClass).toBe(row.expected_dominant_evidence_class);
    expect(result.classification.classificationBasis).toBe(row.expected_classification_basis);
    expect(result.classification.misclassificationRiskState).toBe(
      row.expected_misclassification_risk_state,
    );
    expect(result.preemption.status).toBe(row.expected_preemption_status);
    expect(result.diagnostics.hardStopRuleRefs).toEqual(
      expectedList(row.expected_hard_stop_rule_refs),
    );
    expect(result.diagnostics.urgentContributorRuleRefs).toEqual(
      expectedList(row.expected_urgent_contributor_rule_refs),
    );
    expect(result.diagnostics.residualContributorRuleRefs).toEqual(
      expectedList(row.expected_residual_contributor_rule_refs),
    );
    expect(result.diagnostics.reachabilityContributorRuleRefs).toEqual(
      expectedList(row.expected_reachability_contributor_rule_refs),
    );
    expect(result.diagnostics.firedRuleRefs).toEqual([
      ...new Set(result.diagnostics.firedRuleRefs),
    ]);

    const latestSettlement = await repositories.findLatestUrgentDiversionSettlementForRequest(
      evidenceCut.requestId,
    );
    expect(latestSettlement).toBeNull();
  });

  it("keeps urgent-required pending, failed, issued, and superseded settlement states distinct", async () => {
    const repositories = createSynchronousSafetyStore();
    const services = createSynchronousSafetyServices(repositories);
    const settlementService = createUrgentDiversionSettlementService(repositories);
    const urgentRow = rows.find((row) => row.case_id === "165_URGENT_REQUIRED_PENDING");
    expect(urgentRow).toBeDefined();
    const evidenceCut = buildEvidenceCut(urgentRow as CaseRow);

    const result = await services.synchronousSafety.evaluateFrozenSubmission({
      episodeId: "episode_165_urgent_settlement_distinction",
      requestId: evidenceCut.requestId,
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-15T09:10:00Z",
      evidenceCut,
      preferredRulePackVersionRef: (urgentRow as CaseRow).source_rule_pack_ref,
    });

    const pending = await settlementService.issueSettlement({
      requestId: evidenceCut.requestId,
      safetyDecisionRef: result.safetyDecision.safetyDecisionId,
      actionMode: "urgent_guidance_presented",
      presentationArtifactRef: "iopa_165_pending",
      authoritativeActionRef: "action_165_pending",
      settlementState: "pending",
      settledAt: "2026-04-15T09:10:01Z",
    });
    const failed = await settlementService.issueSettlement({
      requestId: evidenceCut.requestId,
      safetyDecisionRef: result.safetyDecision.safetyDecisionId,
      actionMode: "urgent_guidance_presented",
      presentationArtifactRef: "iopa_165_failed",
      authoritativeActionRef: "action_165_failed",
      settlementState: "failed",
      settledAt: "2026-04-15T09:10:02Z",
    });
    const issued = await settlementService.issueSettlement({
      requestId: evidenceCut.requestId,
      safetyDecisionRef: result.safetyDecision.safetyDecisionId,
      actionMode: "urgent_guidance_presented",
      presentationArtifactRef: "iopa_165_issued",
      authoritativeActionRef: "action_165_issued",
      settlementState: "issued",
      issuedAt: "2026-04-15T09:10:03Z",
      settledAt: "2026-04-15T09:10:03Z",
    });

    expect(result.safetyDecision.requestedSafetyState).toBe("urgent_diversion_required");
    expect(pending.urgentDiversionSettlement.settlementState).toBe("pending");
    expect(failed.urgentDiversionSettlement.settlementState).toBe("failed");
    expect(issued.urgentDiversionSettlement.settlementState).toBe("issued");
    expect(failed.supersededSettlementRef).toBe(
      pending.urgentDiversionSettlement.urgentDiversionSettlementId,
    );
    expect(issued.supersededSettlementRef).toBe(
      failed.urgentDiversionSettlement.urgentDiversionSettlementId,
    );
  });
});
