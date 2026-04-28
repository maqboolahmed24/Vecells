import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const TODAY = new Date().toISOString().slice(0, 10);

const TASK_ID =
  "seq_312_phase5_freeze_enhanced_access_policy_capacity_ingestion_and_candidate_ranking_contracts";
const SHORT_TASK_ID = "seq_312";
const CONTRACT_VERSION = "312.phase5.policy-capacity-ranking-freeze.v1";
const VISUAL_MODE = "Phase5_Policy_Tuple_And_Capacity_Atlas";
const RANK_PLAN_VERSION = "312.rank-plan.network-candidate.v1";
const UNCERTAINTY_MODEL_VERSION = "312.uncertainty-model.network-candidate.v1";

const SOURCE_REFS = {
  phase5Policy:
    "blueprint/phase-5-the-network-horizon.md#5C. Enhanced Access policy engine and network capacity ingestion",
  phase5Queue:
    "blueprint/phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine",
  phaseCards: "blueprint/phase-cards.md#Card-6",
  phase4Ranking:
    "blueprint/phase-4-the-booking-engine.md#ranking-order-and-visible-cues-must-derive-from-persisted-proof",
  phase0TupleHash:
    "blueprint/phase-0-the-foundation-protocol.md#publication-and-bundle-discipline",
  phase0Assurance:
    "blueprint/phase-0-the-foundation-protocol.md#assurance-and-trust-carry-forward",
  phase311Hub:
    "docs/architecture/311_phase5_hub_case_and_acting_context_contract.md",
};

type PolicyFamily = {
  familyId: string;
  label: string;
  contractFile: string;
  accent: string;
  tupleFieldIds: string[];
  permittedOutputs: string[];
  mayChangePatientOfferable: boolean;
  mayChangeDirectCommit: boolean;
  mayRescoreRank: boolean;
  mayMintLedger: boolean;
  mayCreateAckDebt: boolean;
  blockedEffects: string[];
  formulaRefs: string[];
  lawSummary: string;
};

type FormulaDefinition = {
  formulaId: string;
  name: string;
  expression: string;
  units: string;
  range: string;
  variables: Array<{
    name: string;
    units: string;
    description: string;
    domain?: string;
  }>;
  notes: string[];
};

type Candidate = {
  candidateId: string;
  label: string;
  siteId: string;
  siteLabel: string;
  sourceRef: string;
  sourceTrustRef: string;
  sourceTrustState: "trusted" | "degraded" | "quarantined";
  sourceTrustTier: 2 | 1 | 0;
  sourceFreshnessState: "fresh" | "aging" | "stale";
  startAt: string;
  endAt: string;
  timezone: string;
  modality: string;
  clinicianType: string;
  capacityUnitRef: string;
  manageCapabilityState: "network_manage_ready" | "read_only" | "blocked";
  accessibilityFitScore: number;
  travelMinutes: number;
  waitMinutes: number;
  stalenessMinutes: number;
  requiredWindowFit: 2 | 1 | 0;
  offerabilityState:
    | "direct_commit"
    | "patient_offerable"
    | "callback_only_reasoning"
    | "diagnostic_only";
  baseUtility: number;
  uncertaintyRadius: number;
  robustFit: number;
  patientOfferable: boolean;
  directCommitEligible: boolean;
  rank: number;
  explanationRef: string;
  patientReasonCueRefs: string[];
  staffReasonRefs: string[];
  blockedBy: string[];
  formulaValues: Record<string, number>;
};

type GapSeam = {
  seamId: string;
  fileName: string;
  ownerTask: string;
  area: string;
  purpose: string;
  consumerRefs: string[];
  requiredObjects: Array<{
    objectName: string;
    status: string;
    requiredFields: string[];
  }>;
};

function repoPath(relative: string): string {
  return path.join(ROOT, relative);
}

function writeText(relative: string, content: string): void {
  const filePath = repoPath(relative);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trimEnd()}\n`, "utf8");
}

function writeJson(relative: string, payload: unknown): void {
  writeText(relative, JSON.stringify(payload, null, 2));
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(
  relative: string,
  rows: Array<Record<string, unknown>>,
  fieldnames: string[],
): void {
  const header = fieldnames.join(",");
  const body = rows.map((row) => fieldnames.map((field) => escapeCsvCell(row[field])).join(","));
  writeText(relative, [header, ...body].join("\n"));
}

function mdTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const rule = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`,
  );
  return [head, rule, ...body].join("\n");
}

function hashOf(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function refField(description: string, nullable = false): Record<string, unknown> {
  return {
    type: nullable ? ["string", "null"] : "string",
    minLength: nullable ? 0 : 1,
    description,
  };
}

function dateTimeField(description: string, nullable = false): Record<string, unknown> {
  return {
    type: nullable ? ["string", "null"] : "string",
    format: "date-time",
    description,
  };
}

function integerField(description: string, minimum?: number): Record<string, unknown> {
  return {
    type: "integer",
    ...(typeof minimum === "number" ? { minimum } : {}),
    description,
  };
}

function numberField(
  description: string,
  minimum?: number,
  maximum?: number,
): Record<string, unknown> {
  return {
    type: "number",
    ...(typeof minimum === "number" ? { minimum } : {}),
    ...(typeof maximum === "number" ? { maximum } : {}),
    description,
  };
}

function enumField(values: readonly string[], description: string): Record<string, unknown> {
  return {
    type: "string",
    enum: [...values],
    description,
  };
}

function booleanField(description: string): Record<string, unknown> {
  return { type: "boolean", description };
}

function stringArrayField(description: string, minItems = 0): Record<string, unknown> {
  return {
    type: "array",
    minItems,
    items: { type: "string", minLength: 1 },
    description,
  };
}

function schemaDocument(
  fileName: string,
  title: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[],
): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://vecells.local/contracts/${fileName}`,
    title,
    description,
    type: "object",
    additionalProperties: false,
    required,
    properties,
    "x-taskId": SHORT_TASK_ID,
    "x-contractVersion": CONTRACT_VERSION,
    "x-sourceRefs": Object.values(SOURCE_REFS),
  };
}

const POLICY_FAMILIES: PolicyFamily[] = [
  {
    familyId: "routing",
    label: "Routing pack",
    contractFile: "data/contracts/312_hub_routing_policy_pack.schema.json",
    accent: "#3158E0",
    tupleFieldIds: [
      "routingPolicyPackRef",
      "eligibleSiteRefs[]",
      "serviceFamilyRefs[]",
      "routeReasonCode",
    ],
    permittedOutputs: [
      "routingDisposition",
      "eligibleSiteRefs[]",
      "serviceFamilyRefs[]",
      "routeReasonCode",
    ],
    mayChangePatientOfferable: true,
    mayChangeDirectCommit: true,
    mayRescoreRank: false,
    mayMintLedger: false,
    mayCreateAckDebt: false,
    blockedEffects: [
      "Must not re-score candidates inside the same admissible frontier.",
      "Must not hide candidates for practice-visibility reasons.",
    ],
    formulaRefs: ["windowClass", "dominance_frontier", "lexicographic_order"],
    lawSummary:
      "Routing chooses whether the case belongs in the network horizon and which sites or service families enter candidate construction. It may gate frontier membership, but it may not rewrite utility math.",
  },
  {
    familyId: "variance",
    label: "Variance window pack",
    contractFile: "data/contracts/312_hub_variance_window_policy.schema.json",
    accent: "#3158E0",
    tupleFieldIds: [
      "requiredWindowRule",
      "approvedVarianceBeforeMinutes",
      "approvedVarianceAfterMinutes",
      "outsideWindowVisibleByPolicy",
    ],
    permittedOutputs: [
      "varianceDisposition",
      "requiredWindowStartAt",
      "requiredWindowEndAt",
      "approvedVarianceStartAt",
      "approvedVarianceEndAt",
    ],
    mayChangePatientOfferable: true,
    mayChangeDirectCommit: true,
    mayRescoreRank: false,
    mayMintLedger: false,
    mayCreateAckDebt: false,
    blockedEffects: [
      "Window fit is a hard band, not a hidden term inside `baseUtility`.",
      "Window fit may not be counted twice through convenience scoring.",
    ],
    formulaRefs: ["windowClass", "lexicographic_order"],
    lawSummary:
      "Variance resolves the clinical band boundary. It defines `windowClass(c,s)` and the approved outer limits, but it does not modify source trust or practice visibility.",
  },
  {
    familyId: "service_obligation",
    label: "Service obligation pack",
    contractFile: "data/contracts/312_hub_service_obligation_policy.schema.json",
    accent: "#3158E0",
    tupleFieldIds: [
      "weeklyMinutesPer1000AdjustedPopulation",
      "bankHolidayMakeUpRule",
      "comparableOfferRule",
      "ledgerMode",
    ],
    permittedOutputs: [
      "serviceObligationDisposition",
      "minutesLedgerRequired",
      "cancellationMakeUpRequired",
      "exceptionDebtState",
    ],
    mayChangePatientOfferable: false,
    mayChangeDirectCommit: false,
    mayRescoreRank: false,
    mayMintLedger: true,
    mayCreateAckDebt: false,
    blockedEffects: [
      "May create ledgers or exception records only.",
      "May not quietly hide, demote, or reorder candidates.",
    ],
    formulaRefs: [],
    lawSummary:
      "Service-obligation rules track capacity promises such as minutes-per-1,000 and cancellation make-up. They govern operational debt, never the candidate order or frontier math.",
  },
  {
    familyId: "practice_visibility",
    label: "Practice visibility pack",
    contractFile: "data/contracts/312_hub_practice_visibility_policy.schema.json",
    accent: "#3158E0",
    tupleFieldIds: [
      "originPracticeVisibleFieldRefs[]",
      "visibilityDeltaRule",
      "ackGenerationMode",
      "minimumNecessaryContractRef",
    ],
    permittedOutputs: [
      "practiceVisibilityDisposition",
      "visibilityDeltaRequired",
      "ackGenerationRequired",
      "minimumNecessaryFieldRefs[]",
    ],
    mayChangePatientOfferable: false,
    mayChangeDirectCommit: false,
    mayRescoreRank: false,
    mayMintLedger: false,
    mayCreateAckDebt: true,
    blockedEffects: [
      "May mint acknowledgement debt or visibility deltas only.",
      "May not suppress patient-offerable or direct-commit candidates.",
    ],
    formulaRefs: [],
    lawSummary:
      "Practice-visibility rules define minimum-necessary origin-practice disclosure and acknowledgement debt. They never participate in candidate ordering or source admission.",
  },
  {
    familyId: "capacity_ingestion",
    label: "Capacity ingestion pack",
    contractFile: "data/contracts/312_hub_capacity_ingestion_policy.schema.json",
    accent: "#3158E0",
    tupleFieldIds: [
      "freshnessThresholdMinutes",
      "quarantineTriggers[]",
      "degradedVisibilityModes[]",
      "patientOfferableTrustStates[]",
    ],
    permittedOutputs: [
      "capacityAdmissionDisposition",
      "sourceTrustState",
      "sourceTrustTier",
      "freshnessBand",
    ],
    mayChangePatientOfferable: true,
    mayChangeDirectCommit: true,
    mayRescoreRank: false,
    mayMintLedger: false,
    mayCreateAckDebt: false,
    blockedEffects: [
      "Quarantined supply may never become bookable or patient-offerable.",
      "Degraded supply may remain visible only for diagnostic or callback reasoning.",
    ],
    formulaRefs: ["u_fresh", "uncertaintyRadius", "robustFit", "lexicographic_order"],
    lawSummary:
      "Capacity ingestion is the only policy family that can convert live source trust and freshness into admission posture. It governs whether a candidate is trusted, degraded, or quarantined before ranking is surfaced.",
  },
];

const FORMULAS: FormulaDefinition[] = [
  {
    formulaId: "windowClass",
    name: "windowClass(c,s)",
    expression: "requiredWindowFit(c,s)",
    units: "ordinal band",
    range: "{2,1,0}",
    variables: [
      {
        name: "requiredWindowFit(c,s)",
        units: "ordinal band",
        description:
          "Resolved window fit where 2 = inside required window, 1 = inside approved variance window, 0 = outside window but still visible by policy.",
      },
    ],
    notes: [
      "This band is ordered before all convenience terms.",
      "It must not be reintroduced into `baseUtility(c,s)`.",
    ],
  },
  {
    formulaId: "u_modality",
    name: "u_modality(c,s)",
    expression: "1 when modality is compatible, otherwise 0",
    units: "unitless",
    range: "{0,1}",
    variables: [
      {
        name: "modalityCompatibility",
        units: "binary",
        description: "Whether the candidate modality is clinically and operationally compatible.",
      },
    ],
    notes: ["The compatibility check is explicit, not inferred from route-local copy."],
  },
  {
    formulaId: "u_access",
    name: "u_access(c,s)",
    expression: "accessibilityFit(c,s)",
    units: "unitless",
    range: "[0,1]",
    variables: [
      {
        name: "accessibilityFit(c,s)",
        units: "unitless",
        description: "Normalized patient accessibility and burden fit under the current case constraints.",
      },
    ],
    notes: ["Accessibility fit is a normalized feature and remains visible in the explanation tuple."],
  },
  {
    formulaId: "u_travel",
    name: "u_travel(c,s)",
    expression: "exp(-travelMinutes(c,s) / tau_travel)",
    units: "unitless",
    range: "(0,1]",
    variables: [
      {
        name: "travelMinutes(c,s)",
        units: "minutes",
        description: "Estimated travel burden for the patient.",
      },
      {
        name: "tau_travel",
        units: "minutes",
        description: "Travel-time decay constant versioned in the rank plan.",
      },
    ],
    notes: ["Travel convenience cannot outrank the window class band."],
  },
  {
    formulaId: "u_wait",
    name: "u_wait(c,s)",
    expression: "exp(-waitMinutes(s) / tau_wait)",
    units: "unitless",
    range: "(0,1]",
    variables: [
      {
        name: "waitMinutes(s)",
        units: "minutes",
        description: "Time from current evaluation to the candidate start time.",
      },
      {
        name: "tau_wait",
        units: "minutes",
        description: "Wait-time decay constant versioned in the rank plan.",
      },
    ],
    notes: ["Wait fit is within-band only and does not replace the required-window rule."],
  },
  {
    formulaId: "u_fresh",
    name: "u_fresh(c,s)",
    expression: "exp(-stalenessMinutes(s) / tau_fresh)",
    units: "unitless",
    range: "(0,1]",
    variables: [
      {
        name: "stalenessMinutes(s)",
        units: "minutes",
        description: "Age of the source snapshot at evaluation time.",
      },
      {
        name: "tau_fresh",
        units: "minutes",
        description: "Freshness decay constant versioned in the rank plan.",
      },
    ],
    notes: [
      "Freshness contributes to utility and separately informs source admission and uncertainty.",
    ],
  },
  {
    formulaId: "baseUtility",
    name: "baseUtility(c,s)",
    expression:
      "w_modality * u_modality(c,s) + w_access * u_access(c,s) + w_travel * u_travel(c,s) + w_wait * u_wait(c,s) + w_fresh * u_fresh(c,s)",
    units: "unitless",
    range: "[0,1]",
    variables: [
      {
        name: "w_modality,w_access,w_travel,w_wait,w_fresh",
        units: "unitless",
        description: "Rank-plan weights with `sum w_* = 1`.",
      },
    ],
    notes: [
      "Window fit is deliberately excluded to prevent double-counting.",
      "Weights version with the persisted rank plan.",
    ],
  },
  {
    formulaId: "uncertaintyRadius",
    name: "uncertaintyRadius(c,s)",
    expression: "epsilon_alpha(c,s)",
    units: "unitless risk radius",
    range: "[0,+inf)",
    variables: [
      {
        name: "epsilon_alpha(c,s)",
        units: "unitless risk radius",
        description:
          "Calibrated uncertainty from trust class, staleness, duplicate-capacity collision risk, and recent adapter drift.",
      },
    ],
    notes: [
      "Uncertainty is persisted as proof, not hidden in copy.",
      "The uncertainty model versions separately from the rank plan.",
    ],
  },
  {
    formulaId: "robustFit",
    name: "robustFit(c,s)",
    expression: "baseUtility(c,s) - lambda_uncertainty * uncertaintyRadius(c,s)",
    units: "unitless",
    range: "(-inf,1]",
    variables: [
      {
        name: "lambda_uncertainty",
        units: "unitless",
        description: "Penalty multiplier versioned in the same rank plan.",
      },
    ],
    notes: [
      "Robust fit is the within-band score used after window class and trust tier.",
    ],
  },
];

const SOURCE_TRUST_ROWS = [
  {
    sourceTrustState: "trusted",
    sourceTrustTier: 2,
    patientOfferable: "yes",
    directCommit: "yes",
    diagnosticVisible: "yes",
    notes:
      "Trusted supply may join patient-offerable and direct-commit frontiers when routing and variance also allow it.",
  },
  {
    sourceTrustState: "degraded",
    sourceTrustTier: 1,
    patientOfferable: "no",
    directCommit: "no",
    diagnosticVisible: "callback_only_or_diagnostic_only",
    notes:
      "Degraded supply may remain visible only for diagnostic or callback-fallback reasoning. It is never ordinary direct-booking truth.",
  },
  {
    sourceTrustState: "quarantined",
    sourceTrustTier: 0,
    patientOfferable: "no",
    directCommit: "no",
    diagnosticVisible: "ops_only_diagnostic",
    notes:
      "Quarantined supply is excluded from bookable and patient-offerable frontiers. It survives only as diagnostic evidence or a typed policy exception.",
  },
];

const POLICY_TUPLE = {
  enhancedAccessPolicyRef: "policy_312_enhanced_access_default",
  routingPolicyPackRef: "routing_pack_312_default",
  varianceWindowPolicyRef: "variance_pack_312_default",
  serviceObligationPolicyRef: "service_obligation_pack_312_default",
  practiceVisibilityPolicyRef: "practice_visibility_pack_312_default",
  capacityIngestionPolicyRef: "capacity_ingestion_pack_312_default",
  rankPlanVersionRef: RANK_PLAN_VERSION,
  uncertaintyModelVersionRef: UNCERTAINTY_MODEL_VERSION,
};

const POLICY_TUPLE_HASH = hashOf(POLICY_TUPLE);

const CANDIDATES: Candidate[] = [
  {
    candidateId: "candidate_trusted_required_001",
    label: "18:45 Riverside Hub (video capable)",
    siteId: "hub_site_riverside",
    siteLabel: "Riverside Hub",
    sourceRef: "source_gp_connect_riverside",
    sourceTrustRef: "trust_slice_riverside_trusted",
    sourceTrustState: "trusted",
    sourceTrustTier: 2,
    sourceFreshnessState: "fresh",
    startAt: "2026-04-22T17:45:00Z",
    endAt: "2026-04-22T18:05:00Z",
    timezone: "Europe/London",
    modality: "video",
    clinicianType: "gp",
    capacityUnitRef: "capacity_unit_riverside_video_1845",
    manageCapabilityState: "network_manage_ready",
    accessibilityFitScore: 0.93,
    travelMinutes: 18,
    waitMinutes: 45,
    stalenessMinutes: 8,
    requiredWindowFit: 2,
    offerabilityState: "direct_commit",
    baseUtility: 0.89,
    uncertaintyRadius: 0.04,
    robustFit: 0.85,
    patientOfferable: true,
    directCommitEligible: true,
    rank: 1,
    explanationRef: "rank_explanation_candidate_trusted_required_001",
    patientReasonCueRefs: ["cue_inside_required_window", "cue_trusted_fastest_fit"],
    staffReasonRefs: [
      "required_window=true",
      "trusted_source=true",
      "travel_minutes=18",
      "staleness_minutes=8",
    ],
    blockedBy: [],
    formulaValues: {
      u_modality: 1,
      u_access: 0.93,
      u_travel: 0.74,
      u_wait: 0.86,
      u_fresh: 0.88,
    },
  },
  {
    candidateId: "candidate_degraded_required_002",
    label: "18:35 Northway Clinic (phone only)",
    siteId: "hub_site_northway",
    siteLabel: "Northway Clinic",
    sourceRef: "source_partner_feed_northway",
    sourceTrustRef: "trust_slice_northway_degraded",
    sourceTrustState: "degraded",
    sourceTrustTier: 1,
    sourceFreshnessState: "aging",
    startAt: "2026-04-22T17:35:00Z",
    endAt: "2026-04-22T17:55:00Z",
    timezone: "Europe/London",
    modality: "phone",
    clinicianType: "gp",
    capacityUnitRef: "capacity_unit_northway_phone_1835",
    manageCapabilityState: "read_only",
    accessibilityFitScore: 0.82,
    travelMinutes: 22,
    waitMinutes: 35,
    stalenessMinutes: 48,
    requiredWindowFit: 2,
    offerabilityState: "callback_only_reasoning",
    baseUtility: 0.77,
    uncertaintyRadius: 0.19,
    robustFit: 0.64,
    patientOfferable: false,
    directCommitEligible: false,
    rank: 2,
    explanationRef: "rank_explanation_candidate_degraded_required_002",
    patientReasonCueRefs: ["cue_visible_for_callback_only"],
    staffReasonRefs: [
      "required_window=true",
      "trust_state=degraded",
      "direct_commit=false",
      "callback_reasoning_only=true",
    ],
    blockedBy: ["degraded_source_not_normal_booking_truth"],
    formulaValues: {
      u_modality: 0,
      u_access: 0.82,
      u_travel: 0.69,
      u_wait: 0.89,
      u_fresh: 0.45,
    },
  },
  {
    candidateId: "candidate_trusted_variance_003",
    label: "19:40 Central Hub (face to face)",
    siteId: "hub_site_central",
    siteLabel: "Central Hub",
    sourceRef: "source_gp_connect_central",
    sourceTrustRef: "trust_slice_central_trusted",
    sourceTrustState: "trusted",
    sourceTrustTier: 2,
    sourceFreshnessState: "fresh",
    startAt: "2026-04-22T18:40:00Z",
    endAt: "2026-04-22T19:00:00Z",
    timezone: "Europe/London",
    modality: "face_to_face",
    clinicianType: "advanced_practice_clinician",
    capacityUnitRef: "capacity_unit_central_f2f_1940",
    manageCapabilityState: "network_manage_ready",
    accessibilityFitScore: 0.88,
    travelMinutes: 31,
    waitMinutes: 100,
    stalenessMinutes: 6,
    requiredWindowFit: 1,
    offerabilityState: "patient_offerable",
    baseUtility: 0.81,
    uncertaintyRadius: 0.05,
    robustFit: 0.76,
    patientOfferable: true,
    directCommitEligible: true,
    rank: 3,
    explanationRef: "rank_explanation_candidate_trusted_variance_003",
    patientReasonCueRefs: ["cue_inside_approved_variance", "cue_trusted_alternative"],
    staffReasonRefs: [
      "approved_variance_window=true",
      "trusted_source=true",
      "travel_minutes=31",
      "staleness_minutes=6",
    ],
    blockedBy: [],
    formulaValues: {
      u_modality: 1,
      u_access: 0.88,
      u_travel: 0.60,
      u_wait: 0.66,
      u_fresh: 0.90,
    },
  },
  {
    candidateId: "candidate_quarantined_required_004",
    label: "18:50 Southbank Outreach (frozen feed)",
    siteId: "hub_site_southbank",
    siteLabel: "Southbank Outreach",
    sourceRef: "source_partner_feed_southbank",
    sourceTrustRef: "trust_slice_southbank_quarantined",
    sourceTrustState: "quarantined",
    sourceTrustTier: 0,
    sourceFreshnessState: "stale",
    startAt: "2026-04-22T17:50:00Z",
    endAt: "2026-04-22T18:10:00Z",
    timezone: "Europe/London",
    modality: "face_to_face",
    clinicianType: "gp",
    capacityUnitRef: "capacity_unit_southbank_f2f_1850",
    manageCapabilityState: "blocked",
    accessibilityFitScore: 0.84,
    travelMinutes: 16,
    waitMinutes: 50,
    stalenessMinutes: 180,
    requiredWindowFit: 2,
    offerabilityState: "diagnostic_only",
    baseUtility: 0.80,
    uncertaintyRadius: 0.41,
    robustFit: 0.39,
    patientOfferable: false,
    directCommitEligible: false,
    rank: 4,
    explanationRef: "rank_explanation_candidate_quarantined_required_004",
    patientReasonCueRefs: [],
    staffReasonRefs: [
      "quarantined_source=true",
      "bookable=false",
      "patient_offerable=false",
      "diagnostic_visibility_only=true",
    ],
    blockedBy: ["quarantined_source_excluded_from_frontier"],
    formulaValues: {
      u_modality: 1,
      u_access: 0.84,
      u_travel: 0.77,
      u_wait: 0.85,
      u_fresh: 0.05,
    },
  },
  {
    candidateId: "candidate_trusted_outside_window_005",
    label: "20:30 West Hub (explanation only)",
    siteId: "hub_site_west",
    siteLabel: "West Hub",
    sourceRef: "source_gp_connect_west",
    sourceTrustRef: "trust_slice_west_trusted",
    sourceTrustState: "trusted",
    sourceTrustTier: 2,
    sourceFreshnessState: "fresh",
    startAt: "2026-04-22T19:30:00Z",
    endAt: "2026-04-22T19:50:00Z",
    timezone: "Europe/London",
    modality: "video",
    clinicianType: "gp",
    capacityUnitRef: "capacity_unit_west_video_2030",
    manageCapabilityState: "read_only",
    accessibilityFitScore: 0.79,
    travelMinutes: 12,
    waitMinutes: 150,
    stalenessMinutes: 10,
    requiredWindowFit: 0,
    offerabilityState: "callback_only_reasoning",
    baseUtility: 0.71,
    uncertaintyRadius: 0.07,
    robustFit: 0.64,
    patientOfferable: false,
    directCommitEligible: false,
    rank: 5,
    explanationRef: "rank_explanation_candidate_trusted_outside_window_005",
    patientReasonCueRefs: [],
    staffReasonRefs: [
      "outside_window_but_visible_by_policy=true",
      "trusted_source=true",
      "explanation_only=true",
    ],
    blockedBy: ["outside_required_and_variance_windows"],
    formulaValues: {
      u_modality: 1,
      u_access: 0.79,
      u_travel: 0.82,
      u_wait: 0.53,
      u_fresh: 0.85,
    },
  },
];

const DOMINANCE_DECISIONS = [
  {
    winnerCandidateRef: "candidate_trusted_required_001",
    loserCandidateRef: "candidate_quarantined_required_004",
    weaklyDominatedOn: ["windowClass", "sourceTrustState", "robustFit", "startAt"],
    strictCoordinates: ["sourceTrustState", "robustFit"],
    persistedEffect:
      "Removed from patient-offerable and direct-commit frontiers; retained as diagnostic-only evidence.",
  },
];

const DIRECT_COMMIT_FRONTIER = [
  "candidate_trusted_required_001",
  "candidate_trusted_variance_003",
];

const PATIENT_OFFERABLE_FRONTIER = [
  "candidate_trusted_required_001",
  "candidate_trusted_variance_003",
];

const GAP_SEAMS: GapSeam[] = [
  {
    seamId: "PHASE5_INTERFACE_GAP_POLICY_CAPACITY_QUEUE_AND_SLA",
    fileName: "data/contracts/PHASE5_INTERFACE_GAP_POLICY_CAPACITY_QUEUE_AND_SLA.json",
    ownerTask: "future_phase5_queue_and_sla_track",
    area: "queue_and_sla",
    purpose:
      "Freeze the later-owned queue risk and workbench consumers that must reuse the persisted 312 candidate proof instead of re-ranking cases from raw candidate fields.",
    consumerRefs: [
      "HubQueueWorkbenchProjection.visibleRowRefs[]",
      "HubOptionCardProjection.capacityRankProofRef",
      "HubOptionCardProjection.rankExplanationRef",
      "HubOptionCardProjection.offerabilityState",
    ],
    requiredObjects: [
      {
        objectName: "HubQueueRiskEnvelope",
        status: "typed_seam_only",
        requiredFields: [
          "hubCoordinationCaseId",
          "bestTrustedFit",
          "trustGap",
          "degradedOnly",
          "capacityRankProofRef",
          "policyTupleHash",
        ],
      },
      {
        objectName: "HubOptionCardProjection",
        status: "typed_seam_only",
        requiredFields: [
          "candidateRef",
          "windowClass",
          "sourceTrustState",
          "offerabilityState",
          "capacityRankProofRef",
          "rankExplanationRef",
        ],
      },
    ],
  },
  {
    seamId: "PHASE5_INTERFACE_GAP_POLICY_CAPACITY_PATIENT_CHOICE_AND_DISCLOSURE",
    fileName:
      "data/contracts/PHASE5_INTERFACE_GAP_POLICY_CAPACITY_PATIENT_CHOICE_AND_DISCLOSURE.json",
    ownerTask: "seq_313",
    area: "patient_choice_and_disclosure",
    purpose:
      "Freeze the later-owned patient-choice and disclosure consumers that must preserve the same ordered frontier and explanation tuple produced by 312.",
    consumerRefs: [
      "AlternativeOfferOptimisationPlan.candidateRefs[]",
      "AlternativeOfferEntry.capacityRankProofRef",
      "AlternativeOfferEntry.rankExplanationRef",
      "CapacityRankDisclosurePolicy.patientSafeFields[]",
    ],
    requiredObjects: [
      {
        objectName: "AlternativeOfferOptimisationPlan",
        status: "typed_seam_only",
        requiredFields: [
          "optimisationPlanId",
          "hubCoordinationCaseId",
          "candidateRefs[]",
          "offerSetHash",
          "capacityRankProofRef",
        ],
      },
      {
        objectName: "CapacityRankDisclosurePolicy",
        status: "typed_seam_only",
        requiredFields: [
          "capacityRankDisclosurePolicyId",
          "patientSafeFields[]",
          "staffReplayFields[]",
          "operationsFields[]",
          "policyTupleHash",
        ],
      },
    ],
  },
];

function buildEnhancedAccessPolicySchema() {
  return schemaDocument(
    "312_enhanced_access_policy.schema.json",
    "EnhancedAccessPolicy",
    "Compiled Phase 5 Enhanced Access policy tuple root carrying all five policy-family packs plus the current ranking plan refs.",
    {
      policyId: refField("Stable EnhancedAccessPolicy identifier."),
      policyVersion: refField("Versioned policy identifier."),
      policyState: enumField(["draft", "active", "superseded"], "Lifecycle state."),
      compiledPolicyBundleRef: refField("CompiledPolicyBundle ref."),
      policyTupleHash: refField("Hash of the exact five-family tuple plus ranking versions."),
      effectiveAt: dateTimeField("Policy effective start."),
      effectiveUntil: dateTimeField("Policy effective end.", true),
      pcnRef: refField("Owning PCN or network scope."),
      weeklyMinutesPer1000AdjustedPopulation: integerField(
        "Required Enhanced Access minutes per 1,000 adjusted population per week.",
        0,
      ),
      networkStandardHours: {
        type: "object",
        additionalProperties: false,
        required: ["weekdayStartLocal", "weekdayEndLocal", "saturdayStartLocal", "saturdayEndLocal"],
        properties: {
          weekdayStartLocal: refField("Weekday network standard hour start."),
          weekdayEndLocal: refField("Weekday network standard hour end."),
          saturdayStartLocal: refField("Saturday network standard hour start."),
          saturdayEndLocal: refField("Saturday network standard hour end."),
        },
        description: "Published network standard hours carried as policy facts.",
      },
      sameDayOnlineBookingRule: refField(
        "Human-readable rule ref for same-day online booking when no triage is required.",
      ),
      comparableOfferRule: refField("Rule ref that every PCN patient receives a comparable offer."),
      routingPolicyPackRef: refField("Routing policy pack ref."),
      varianceWindowPolicyRef: refField("Variance policy pack ref."),
      serviceObligationPolicyRef: refField("Service-obligation policy pack ref."),
      practiceVisibilityPolicyRef: refField("Practice-visibility policy pack ref."),
      capacityIngestionPolicyRef: refField("Capacity-ingestion policy pack ref."),
      rankPlanVersionRef: refField("Current rank-plan version ref."),
      uncertaintyModelVersionRef: refField("Current uncertainty-model version ref."),
      sourceRefs: stringArrayField("Local blueprint refs that grounded the compiled tuple.", 1),
    },
    [
      "policyId",
      "policyVersion",
      "policyState",
      "compiledPolicyBundleRef",
      "policyTupleHash",
      "effectiveAt",
      "pcnRef",
      "weeklyMinutesPer1000AdjustedPopulation",
      "networkStandardHours",
      "routingPolicyPackRef",
      "varianceWindowPolicyRef",
      "serviceObligationPolicyRef",
      "practiceVisibilityPolicyRef",
      "capacityIngestionPolicyRef",
      "rankPlanVersionRef",
      "uncertaintyModelVersionRef",
      "sourceRefs",
    ],
  );
}

function buildRoutingPolicyPackSchema() {
  return schemaDocument(
    "312_hub_routing_policy_pack.schema.json",
    "HubRoutingPolicyPack",
    "Policy family that decides whether a case routes into network coordination and which sites or service families are eligible for candidate construction.",
    {
      routingPolicyPackId: refField("Routing pack identifier."),
      policyVersion: refField("Routing pack version."),
      policyTupleHash: refField("Compiled tuple hash that names this pack."),
      routeReasonCode: refField("Reason code for using the hub path."),
      routingDisposition: enumField(
        ["route_to_network", "retain_local", "bounce_back_urgent", "blocked"],
        "Resolved routing disposition vocabulary.",
      ),
      eligibleSiteRefs: stringArrayField("Sites allowed to contribute capacity under this pack.", 1),
      serviceFamilyRefs: stringArrayField("Clinical or service families allowed in the current route."),
      sourceNamespaceRefs: stringArrayField("Source namespaces eligible for ingestion."),
      commissionerApprovalRef: refField("Optional commissioner approval or override ref.", true),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "routingPolicyPackId",
      "policyVersion",
      "policyTupleHash",
      "routingDisposition",
      "eligibleSiteRefs",
      "sourceRefs",
    ],
  );
}

function buildVariancePolicySchema() {
  return schemaDocument(
    "312_hub_variance_window_policy.schema.json",
    "HubVarianceWindowPolicy",
    "Policy family that resolves the required clinical window, approved variance window, and whether outside-window candidates remain visible only as governed explanations.",
    {
      varianceWindowPolicyId: refField("Variance pack identifier."),
      policyVersion: refField("Variance pack version."),
      policyTupleHash: refField("Compiled tuple hash."),
      requiredWindowRule: refField("Rule ref for case-derived required window."),
      approvedVarianceBeforeMinutes: integerField("Allowed variance before the required window.", 0),
      approvedVarianceAfterMinutes: integerField("Allowed variance after the required window.", 0),
      outsideWindowVisibleByPolicy: booleanField(
        "Whether outside-window candidates may remain visible as governed explanation rows.",
      ),
      varianceDisposition: enumField(
        [
          "inside_required_window",
          "inside_approved_variance_window",
          "outside_window_visible_by_policy",
          "outside_window_blocked",
        ],
        "Resolved variance vocabulary.",
      ),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "varianceWindowPolicyId",
      "policyVersion",
      "policyTupleHash",
      "requiredWindowRule",
      "approvedVarianceBeforeMinutes",
      "approvedVarianceAfterMinutes",
      "outsideWindowVisibleByPolicy",
      "varianceDisposition",
      "sourceRefs",
    ],
  );
}

function buildServiceObligationSchema() {
  return schemaDocument(
    "312_hub_service_obligation_policy.schema.json",
    "HubServiceObligationPolicy",
    "Policy family that governs minutes-per-1,000 tracking, comparable offer obligations, and cancellation make-up without influencing candidate order.",
    {
      serviceObligationPolicyId: refField("Service-obligation policy identifier."),
      policyVersion: refField("Policy version."),
      policyTupleHash: refField("Compiled tuple hash."),
      weeklyMinutesPer1000AdjustedPopulation: integerField(
        "Required weekly Enhanced Access minutes per 1,000 adjusted population.",
        0,
      ),
      bankHolidayMakeUpWindowHours: integerField(
        "Time allowed to re-provide cancelled capacity unless commissioner agrees otherwise.",
        0,
      ),
      comparableOfferRule: refField("Rule ref for comparable service offer across all PCN patients."),
      ledgerMode: enumField(
        ["minutes_ledger_required", "minutes_ledger_optional"],
        "Whether minutes and make-up ledgers are mandatory.",
      ),
      serviceObligationDisposition: enumField(
        ["within_obligation", "make_up_required", "obligation_risk", "commissioner_exception_active"],
        "Resolved service-obligation posture.",
      ),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "serviceObligationPolicyId",
      "policyVersion",
      "policyTupleHash",
      "weeklyMinutesPer1000AdjustedPopulation",
      "bankHolidayMakeUpWindowHours",
      "comparableOfferRule",
      "ledgerMode",
      "serviceObligationDisposition",
      "sourceRefs",
    ],
  );
}

function buildPracticeVisibilitySchema() {
  return schemaDocument(
    "312_hub_practice_visibility_policy.schema.json",
    "HubPracticeVisibilityPolicy",
    "Policy family that freezes minimum-necessary origin-practice visibility and acknowledgement-debt generation without touching candidate order.",
    {
      practiceVisibilityPolicyId: refField("Practice-visibility policy identifier."),
      policyVersion: refField("Policy version."),
      policyTupleHash: refField("Compiled tuple hash."),
      minimumNecessaryContractRef: refField("Ref to the minimum-necessary contract."),
      originPracticeVisibleFieldRefs: stringArrayField("Fields visible to the origin practice.", 1),
      hiddenFieldRefs: stringArrayField("Fields that must remain hidden from the origin practice."),
      visibilityDeltaRule: refField("Rule ref for visibility delta generation."),
      ackGenerationMode: enumField(
        ["generation_bound", "generation_bound_with_exception"],
        "Generation model for acknowledgement debt.",
      ),
      practiceVisibilityDisposition: enumField(
        [
          "standard_origin_visibility",
          "visibility_restricted",
          "ack_debt_open",
          "delta_required",
        ],
        "Resolved practice-visibility posture.",
      ),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "practiceVisibilityPolicyId",
      "policyVersion",
      "policyTupleHash",
      "minimumNecessaryContractRef",
      "originPracticeVisibleFieldRefs",
      "visibilityDeltaRule",
      "ackGenerationMode",
      "practiceVisibilityDisposition",
      "sourceRefs",
    ],
  );
}

function buildCapacityIngestionSchema() {
  return schemaDocument(
    "312_hub_capacity_ingestion_policy.schema.json",
    "HubCapacityIngestionPolicy",
    "Policy family that turns feed freshness, assurance slices, duplicate-capacity collision risk, and supplier drift into trusted, degraded, or quarantined admission posture.",
    {
      capacityIngestionPolicyId: refField("Capacity-ingestion policy identifier."),
      policyVersion: refField("Policy version."),
      policyTupleHash: refField("Compiled tuple hash."),
      freshnessThresholdMinutes: integerField("Minutes after which a feed leaves the `fresh` band.", 0),
      staleThresholdMinutes: integerField("Minutes after which a feed becomes stale.", 0),
      quarantineTriggers: stringArrayField("Conditions that force quarantined admission.", 1),
      degradedTriggers: stringArrayField("Conditions that force degraded admission.", 1),
      duplicateCapacityCollisionPolicy: refField("Rule ref for overlapping-slot deduplication."),
      degradedVisibilityModes: {
        type: "array",
        minItems: 1,
        items: {
          type: "string",
          enum: ["callback_only_reasoning", "diagnostic_only"],
        },
        description: "The only visibility modes allowed for degraded supply.",
      },
      patientOfferableTrustStates: {
        type: "array",
        minItems: 1,
        items: { type: "string", enum: ["trusted"] },
        description: "Trust states allowed into the patient-offerable frontier.",
      },
      directCommitTrustStates: {
        type: "array",
        minItems: 1,
        items: { type: "string", enum: ["trusted"] },
        description: "Trust states allowed into the direct-commit frontier.",
      },
      capacityAdmissionDisposition: enumField(
        [
          "trusted_admitted",
          "degraded_callback_only",
          "degraded_diagnostic_only",
          "quarantined_excluded",
          "stale_capacity",
          "missing_capacity",
        ],
        "Resolved admission posture vocabulary.",
      ),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "capacityIngestionPolicyId",
      "policyVersion",
      "policyTupleHash",
      "freshnessThresholdMinutes",
      "staleThresholdMinutes",
      "quarantineTriggers",
      "degradedTriggers",
      "duplicateCapacityCollisionPolicy",
      "degradedVisibilityModes",
      "patientOfferableTrustStates",
      "directCommitTrustStates",
      "capacityAdmissionDisposition",
      "sourceRefs",
    ],
  );
}

function buildPolicyEvaluationSchema() {
  return schemaDocument(
    "312_network_coordination_policy_evaluation.schema.json",
    "NetworkCoordinationPolicyEvaluation",
    "Bound evaluation record that carries the five-family policy tuple, separate disposition vocabularies, and the exact `policyTupleHash` used for candidate normalization.",
    {
      policyEvaluationId: refField("Evaluation identifier."),
      hubCoordinationCaseId: refField("Owning hub case ref."),
      evaluationScope: enumField(["candidate_snapshot"], "Current supported evaluation scope."),
      compiledPolicyBundleRef: refField("CompiledPolicyBundle ref."),
      policyTupleHash: refField("Hash of the exact five-family pack refs plus rank versions."),
      routingPolicyPackRef: refField("Routing policy ref."),
      varianceWindowPolicyRef: refField("Variance policy ref."),
      serviceObligationPolicyRef: refField("Service-obligation policy ref."),
      practiceVisibilityPolicyRef: refField("Practice-visibility policy ref."),
      capacityIngestionPolicyRef: refField("Capacity-ingestion policy ref."),
      routingDisposition: enumField(
        ["route_to_network", "retain_local", "bounce_back_urgent", "blocked"],
        "Routing result.",
      ),
      varianceDisposition: enumField(
        [
          "inside_required_window",
          "inside_approved_variance_window",
          "outside_window_visible_by_policy",
          "outside_window_blocked",
        ],
        "Variance result.",
      ),
      serviceObligationDisposition: enumField(
        ["within_obligation", "make_up_required", "obligation_risk", "commissioner_exception_active"],
        "Service-obligation result.",
      ),
      practiceVisibilityDisposition: enumField(
        [
          "standard_origin_visibility",
          "visibility_restricted",
          "ack_debt_open",
          "delta_required",
        ],
        "Practice-visibility result.",
      ),
      capacityAdmissionDisposition: enumField(
        [
          "trusted_admitted",
          "degraded_callback_only",
          "degraded_diagnostic_only",
          "quarantined_excluded",
          "stale_capacity",
          "missing_capacity",
        ],
        "Capacity-admission result.",
      ),
      sourceAdmissionSummary: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["sourceRef", "sourceTrustState", "candidateCount"],
          properties: {
            sourceRef: refField("Capacity source ref."),
            sourceTrustState: enumField(
              ["trusted", "degraded", "quarantined"],
              "Admission trust state for the source.",
            ),
            candidateCount: integerField("Candidates seen from this source.", 0),
          },
        },
        description: "Per-source admission summary.",
      },
      evaluatedAt: dateTimeField("Evaluation timestamp."),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "policyEvaluationId",
      "hubCoordinationCaseId",
      "evaluationScope",
      "compiledPolicyBundleRef",
      "policyTupleHash",
      "routingPolicyPackRef",
      "varianceWindowPolicyRef",
      "serviceObligationPolicyRef",
      "practiceVisibilityPolicyRef",
      "capacityIngestionPolicyRef",
      "routingDisposition",
      "varianceDisposition",
      "serviceObligationDisposition",
      "practiceVisibilityDisposition",
      "capacityAdmissionDisposition",
      "sourceAdmissionSummary",
      "evaluatedAt",
      "sourceRefs",
    ],
  );
}

function buildSlotCandidateSchema() {
  return schemaDocument(
    "312_network_slot_candidate.schema.json",
    "NetworkSlotCandidate",
    "Normalized network slot candidate contract carrying site, trust, freshness, window fit, manage capability, accessibility fit, and persisted ranking-proof fields.",
    {
      candidateId: refField("Candidate identifier."),
      networkCandidateSnapshotRef: refField("Owning snapshot ref."),
      siteId: refField("Servicing site ref."),
      siteLabel: refField("Human-readable site label."),
      sourceRef: refField("Capacity source ref."),
      sourceTrustRef: refField("AssuranceSliceTrustRecord or equivalent trust evidence ref."),
      sourceTrustState: enumField(
        ["trusted", "degraded", "quarantined"],
        "Current source-trust state.",
      ),
      sourceTrustTier: integerField("Trust tier where 2 = trusted, 1 = degraded, 0 = quarantined.", 0),
      sourceFreshnessState: enumField(["fresh", "aging", "stale"], "Freshness band."),
      startAt: dateTimeField("Candidate start time."),
      endAt: dateTimeField("Candidate end time."),
      timezone: refField("Site-local timezone."),
      modality: refField("Offered modality."),
      clinicianType: refField("Servicing clinician type."),
      capacityUnitRef: refField("Canonical capacity unit ref."),
      manageCapabilityState: enumField(
        ["network_manage_ready", "read_only", "blocked"],
        "Current network-manage capability state.",
      ),
      accessibilityFitScore: numberField("Normalized accessibility fit.", 0, 1),
      travelMinutes: integerField("Estimated travel burden.", 0),
      waitMinutes: integerField("Estimated wait until start.", 0),
      stalenessMinutes: integerField("Age of the source snapshot.", 0),
      requiredWindowFit: integerField("Resolved window fit as 2, 1, or 0.", 0),
      windowClass: integerField("Persisted window class value.", 0),
      offerabilityState: enumField(
        [
          "direct_commit",
          "patient_offerable",
          "callback_only_reasoning",
          "diagnostic_only",
        ],
        "Current surfaced offerability state.",
      ),
      baseUtility: numberField("Persisted within-band base utility."),
      uncertaintyRadius: numberField("Persisted uncertainty radius.", 0),
      robustFit: numberField("Persisted robust-fit score."),
      capacityRankExplanationRef: refField("Linked explanation ref."),
      patientReasonCueRefs: stringArrayField("Patient-safe explanation cue refs."),
      staffReasonRefs: stringArrayField("Staff replay reason refs."),
      blockedByPolicyReasonRefs: stringArrayField("Reason refs for blocked or demoted exposure."),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "candidateId",
      "networkCandidateSnapshotRef",
      "siteId",
      "sourceRef",
      "sourceTrustRef",
      "sourceTrustState",
      "sourceTrustTier",
      "sourceFreshnessState",
      "startAt",
      "endAt",
      "timezone",
      "modality",
      "clinicianType",
      "capacityUnitRef",
      "manageCapabilityState",
      "accessibilityFitScore",
      "travelMinutes",
      "waitMinutes",
      "stalenessMinutes",
      "requiredWindowFit",
      "windowClass",
      "offerabilityState",
      "baseUtility",
      "uncertaintyRadius",
      "robustFit",
      "capacityRankExplanationRef",
      "sourceRefs",
    ],
  );
}

function buildCandidateSnapshotSchema() {
  return schemaDocument(
    "312_network_candidate_snapshot.schema.json",
    "NetworkCandidateSnapshot",
    "Persisted candidate snapshot that binds normalized candidates, rank-proof refs, and the active policy tuple under one durable snapshot ref.",
    {
      snapshotId: refField("Snapshot identifier."),
      hubCoordinationCaseId: refField("Owning hub case ref."),
      policyEvaluationRef: refField("Bound policy evaluation ref."),
      compiledPolicyBundleRef: refField("Compiled bundle ref."),
      policyTupleHash: refField("Hash of the tuple used for this snapshot."),
      rankPlanVersionRef: refField("Rank-plan version ref."),
      uncertaintyModelVersionRef: refField("Uncertainty-model version ref."),
      fetchedAt: dateTimeField("Fetch timestamp."),
      expiresAt: dateTimeField("Snapshot expiry timestamp."),
      candidateRefs: stringArrayField("All normalized candidate refs.", 1),
      candidateCount: integerField("Count of normalized candidates.", 0),
      trustedCandidateCount: integerField("Trusted candidate count.", 0),
      degradedCandidateCount: integerField("Degraded candidate count.", 0),
      quarantinedCandidateCount: integerField("Quarantined candidate count.", 0),
      capacityRankProofRef: refField("Rank proof ref."),
      capacityRankExplanationRefs: stringArrayField("Explanation refs.", 1),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "snapshotId",
      "hubCoordinationCaseId",
      "policyEvaluationRef",
      "policyTupleHash",
      "rankPlanVersionRef",
      "uncertaintyModelVersionRef",
      "fetchedAt",
      "expiresAt",
      "candidateRefs",
      "candidateCount",
      "trustedCandidateCount",
      "degradedCandidateCount",
      "quarantinedCandidateCount",
      "capacityRankProofRef",
      "capacityRankExplanationRefs",
      "sourceRefs",
    ],
  );
}

function buildDecisionPlanSchema() {
  return schemaDocument(
    "312_cross_site_decision_plan.schema.json",
    "CrossSiteDecisionPlan",
    "Persisted cross-site decision plan carrying dominance removals, ordered candidate refs, and the patient-offerable or direct-commit frontiers.",
    {
      decisionPlanId: refField("Decision plan identifier."),
      hubCoordinationCaseId: refField("Owning hub case ref."),
      snapshotId: refField("Source snapshot ref."),
      policyEvaluationRef: refField("Bound policy evaluation ref."),
      policyTupleHash: refField("Active policy tuple hash."),
      orderedCandidateRefs: stringArrayField("Stable lexicographic order across all normalized candidates.", 1),
      patientOfferableFrontierRefs: stringArrayField("Candidates allowed into patient-offerable surfaces."),
      directCommitFrontierRefs: stringArrayField("Candidates allowed into direct-commit surfaces."),
      callbackReasoningRefs: stringArrayField("Candidates visible only for callback reasoning."),
      diagnosticOnlyRefs: stringArrayField("Candidates retained only for diagnostic visibility."),
      dominanceDecisions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "winnerCandidateRef",
            "loserCandidateRef",
            "weaklyDominatedOn",
            "strictCoordinates",
            "persistedEffect",
          ],
          properties: {
            winnerCandidateRef: refField("Dominating candidate ref."),
            loserCandidateRef: refField("Removed candidate ref."),
            weaklyDominatedOn: stringArrayField("Coordinates used for weak dominance.", 1),
            strictCoordinates: stringArrayField("Coordinates with strict improvement.", 1),
            persistedEffect: refField("Material frontier effect."),
          },
        },
        description: "Persisted dominance decisions.",
      },
      generatedAt: dateTimeField("Decision-plan generation timestamp."),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "decisionPlanId",
      "hubCoordinationCaseId",
      "snapshotId",
      "policyEvaluationRef",
      "policyTupleHash",
      "orderedCandidateRefs",
      "patientOfferableFrontierRefs",
      "directCommitFrontierRefs",
      "callbackReasoningRefs",
      "diagnosticOnlyRefs",
      "dominanceDecisions",
      "generatedAt",
      "sourceRefs",
    ],
  );
}

function buildMinutesLedgerSchema() {
  return schemaDocument(
    "312_enhanced_access_minutes_ledger.schema.json",
    "EnhancedAccessMinutesLedger",
    "Operational ledger that tracks required, delivered, available, cancelled, and make-up minutes against the current minutes-per-1,000 obligation.",
    {
      enhancedAccessMinutesLedgerId: refField("Ledger identifier."),
      pcnRef: refField("PCN or network ref."),
      policyTupleHash: refField("Current policy tuple hash."),
      weekStartAt: dateTimeField("Start of the obligation week."),
      weekEndAt: dateTimeField("End of the obligation week."),
      adjustedPopulation: integerField("Adjusted population for the obligation week.", 0),
      minutesPer1000Required: integerField("Required minutes per 1,000 adjusted population.", 0),
      requiredMinutes: integerField("Resolved required minutes for the week.", 0),
      deliveredMinutes: integerField("Delivered minutes counted toward the obligation.", 0),
      availableMinutes: integerField("Available bookable minutes published.", 0),
      cancelledMinutes: integerField("Cancelled minutes in the same week.", 0),
      replacementMinutes: integerField("Replacement or make-up minutes provided.", 0),
      ledgerState: enumField(
        ["on_track", "at_risk", "make_up_required", "completed"],
        "Current ledger posture.",
      ),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "enhancedAccessMinutesLedgerId",
      "pcnRef",
      "policyTupleHash",
      "weekStartAt",
      "weekEndAt",
      "adjustedPopulation",
      "minutesPer1000Required",
      "requiredMinutes",
      "deliveredMinutes",
      "availableMinutes",
      "cancelledMinutes",
      "replacementMinutes",
      "ledgerState",
      "sourceRefs",
    ],
  );
}

function buildCancellationLedgerSchema() {
  return schemaDocument(
    "312_cancellation_make_up_ledger.schema.json",
    "CancellationMakeUpLedger",
    "Operational ledger that tracks cancelled network time, replacement capacity, and the current make-up obligation window.",
    {
      cancellationMakeUpLedgerId: refField("Ledger identifier."),
      pcnRef: refField("PCN or network ref."),
      policyTupleHash: refField("Current policy tuple hash."),
      serviceDate: dateTimeField("Date or timestamp of the cancelled service block."),
      cancelledMinutes: integerField("Cancelled minutes.", 0),
      replacementMinutes: integerField("Replacement minutes delivered.", 0),
      makeUpDueAt: dateTimeField("Deadline for replacement capacity."),
      commissionerExceptionRef: refField("Optional commissioner exception or override.", true),
      makeUpState: enumField(
        ["replacement_due", "replacement_provided", "exception_granted", "expired"],
        "Current make-up posture.",
      ),
      sourceRefs: stringArrayField("Grounding refs.", 1),
    },
    [
      "cancellationMakeUpLedgerId",
      "pcnRef",
      "policyTupleHash",
      "serviceDate",
      "cancelledMinutes",
      "replacementMinutes",
      "makeUpDueAt",
      "makeUpState",
      "sourceRefs",
    ],
  );
}

function buildFormulaManifest() {
  return {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    rankPlanVersionRef: RANK_PLAN_VERSION,
    uncertaintyModelVersionRef: UNCERTAINTY_MODEL_VERSION,
    policyTupleHashField: "policyTupleHash",
    formulas: FORMULAS.map((formula) => ({
      formulaId: formula.formulaId,
      name: formula.name,
      expression: formula.expression,
      units: formula.units,
      range: formula.range,
      variables: formula.variables,
      notes: formula.notes,
    })),
    dominanceFrontierRule: {
      comparatorTuple: ["windowClass", "sourceTrustState", "robustFit", "startAt"],
      weakDominanceDefinition:
        "If s1 weakly dominates s2 on the comparator tuple and strictly improves at least one coordinate, s2 is removed from patient-offerable and direct-commit frontiers.",
      persistedIn: "CrossSiteDecisionPlan.dominanceDecisions[]",
    },
    lexicographicOrder: [
      { position: 1, key: "windowClass", direction: "desc" },
      { position: 2, key: "sourceTrustTier", direction: "desc" },
      { position: 3, key: "robustFit", direction: "desc" },
      { position: 4, key: "travelMinutes", direction: "asc" },
      { position: 5, key: "startAt", direction: "asc" },
      { position: 6, key: "candidateId", direction: "asc" },
    ],
    sourceTrustTiers: SOURCE_TRUST_ROWS,
    separationLaws: [
      "Routing, approved variance, and capacity admission decide patient-offerable and direct-commit frontiers.",
      "Service-obligation and practice-visibility rules may mint ledgers, exceptions, and acknowledgement debt but may not silently re-score, hide, or reorder candidates.",
      "Window fit remains a separate hard band and may not be double-counted inside utility.",
      "Uncertainty remains a persisted proof field rather than a route-local copy heuristic.",
    ],
    xSourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildCapacityRankProofContract() {
  const orderedCandidateRefs = CANDIDATES.sort((left, right) => left.rank - right.rank).map(
    (candidate) => candidate.candidateId,
  );
  const sampleProof = {
    capacityRankProofId: "capacity_rank_proof_312_network_default",
    networkCandidateSnapshotRef: "snapshot_312_network_default",
    rankPlanVersionRef: RANK_PLAN_VERSION,
    uncertaintyModelVersionRef: UNCERTAINTY_MODEL_VERSION,
    policyTupleHash: POLICY_TUPLE_HASH,
    proofChecksum: hashOf({ POLICY_TUPLE_HASH, orderedCandidateRefs }),
    generatedAt: "2026-04-22T10:30:00Z",
    orderedCandidateRefs,
    rankedCandidates: CANDIDATES.map((candidate) => ({
      candidateRank: candidate.rank,
      candidateRef: candidate.candidateId,
      windowClass: candidate.requiredWindowFit,
      sourceTrustState: candidate.sourceTrustState,
      sourceTrustTier: candidate.sourceTrustTier,
      baseUtility: candidate.baseUtility,
      uncertaintyRadius: candidate.uncertaintyRadius,
      robustFit: candidate.robustFit,
      travelMinutes: candidate.travelMinutes,
      startAt: candidate.startAt,
      offerabilityState: candidate.offerabilityState,
      patientOfferable: candidate.patientOfferable,
      directCommitEligible: candidate.directCommitEligible,
      capacityRankExplanationRef: candidate.explanationRef,
      patientReasonCueRefs: candidate.patientReasonCueRefs,
    })),
  };

  return {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    definitions: {
      CapacityRankProof: {
        requiredFields: [
          "capacityRankProofId",
          "networkCandidateSnapshotRef",
          "rankPlanVersionRef",
          "uncertaintyModelVersionRef",
          "policyTupleHash",
          "proofChecksum",
          "orderedCandidateRefs",
          "generatedAt",
        ],
        perCandidateProofFields: [
          "windowClass",
          "sourceTrustState",
          "sourceTrustTier",
          "baseUtility",
          "uncertaintyRadius",
          "robustFit",
          "travelMinutes",
          "startAt",
          "offerabilityState",
          "patientOfferable",
          "directCommitEligible",
          "capacityRankExplanationRef",
        ],
        stableOrderingRule: [
          "windowClass desc",
          "sourceTrustTier desc",
          "robustFit desc",
          "travelMinutes asc",
          "startAt asc",
          "candidateId asc",
        ],
        frontierLaw: [
          "Only routing, variance, and capacity admission decide patient-offerable and direct-commit frontiers.",
          "Service-obligation and practice-visibility do not affect order.",
          "Degraded and quarantined supply never becomes ordinary direct-booking truth.",
        ],
      },
    },
    sampleCapacityRankProof: sampleProof,
    xSourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildCapacityRankExplanationContract() {
  return {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    definitions: {
      CapacityRankExplanation: {
        requiredFields: [
          "capacityRankExplanationId",
          "candidateRef",
          "policyTupleHash",
          "windowClass",
          "sourceTrustState",
          "baseUtility",
          "uncertaintyRadius",
          "robustFit",
          "patientReasonCueRefs",
          "staffReasonRefs",
        ],
        disclosureLaw: [
          "Patient copy reads only patient-safe reason cues from the persisted explanation tuple.",
          "Staff replay and operational drill paths reuse the same persisted explanation and must not recalculate reasons from raw fields.",
        ],
      },
    },
    sampleCapacityRankExplanation: {
      capacityRankExplanationId: "rank_explanation_candidate_trusted_required_001",
      candidateRef: "candidate_trusted_required_001",
      policyTupleHash: POLICY_TUPLE_HASH,
      windowClass: 2,
      sourceTrustState: "trusted",
      baseUtility: 0.89,
      uncertaintyRadius: 0.04,
      robustFit: 0.85,
      patientReasonCueRefs: ["cue_inside_required_window", "cue_trusted_fastest_fit"],
      staffReasonRefs: [
        "required_window=true",
        "trusted_source=true",
        "travel_minutes=18",
        "staleness_minutes=8",
      ],
    },
    xSourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildExternalReferenceNotes() {
  return {
    taskId: TASK_ID,
    reviewedOn: TODAY,
    localSourceOfTruth: [
      SOURCE_REFS.phase5Policy,
      SOURCE_REFS.phase5Queue,
      SOURCE_REFS.phaseCards,
      SOURCE_REFS.phase4Ranking,
      SOURCE_REFS.phase0TupleHash,
      SOURCE_REFS.phase0Assurance,
      SOURCE_REFS.phase311Hub,
    ],
    sourcesReviewed: [
      {
        url: "https://www.england.nhs.uk/gp/investment/gp-contract/network-contract-directed-enhanced-service-des/",
        title: "Network Contract Directed Enhanced Service (DES) - NHS England",
        borrowedInto: [
          "Current publication anchor for 2026/27 Network Contract DES artifacts",
          "Support reference that Enhanced Access remains a distinct PCN policy surface",
        ],
        rejectedOrNotImported: [
          "Publication index structure did not override local tuple or ranking semantics.",
        ],
      },
      {
        url: "https://www.england.nhs.uk/gp/investment/gp-contract/network-contract-directed-enhanced-service-des/enhanced-access-faqs/",
        title:
          "Enhanced Access to General Practice services through the network contract DES – Frequently asked questions",
        borrowedInto: [
          "Standard-hours framing for weekday evenings and Saturdays",
          "Comparable all-patient PCN offer expectations",
          "Support for minutes-per-1,000 and cancellation make-up ledger wording",
        ],
        rejectedOrNotImported: [
          "FAQ wording did not replace local policy-family separation rules.",
        ],
      },
      {
        url: "https://www.england.nhs.uk/publication/how-to-align-capacity-with-demand-in-general-practice/",
        title: "How to align capacity with demand in general practice - NHS England",
        borrowedInto: [
          "Operational note that demand and rota data should be used to align capacity to need",
          "Support framing for the capacity-ingestion realism narrative",
        ],
        rejectedOrNotImported: [
          "No spreadsheet or local rota heuristic was imported into candidate ranking formulas.",
        ],
      },
      {
        url: "https://www.england.nhs.uk/publication/demand-and-capacity-models-core-model/",
        title: "Demand and capacity models – core model - NHS England",
        borrowedInto: [
          "Support reference that formal demand and capacity models are used for planning and timely care decisions",
        ],
        rejectedOrNotImported: [
          "The elective core-model math did not replace the local robust-fit or uncertainty formulas.",
        ],
      },
      {
        url: "https://hl7.org/fhir/R4/slot.html",
        title: "Slot - FHIR v4.0.1",
        borrowedInto: [
          "Slot remains the free or busy bookable interval rather than the appointment itself",
          "Support for overbooked and free/busy semantics in candidate normalization",
        ],
        rejectedOrNotImported: [
          "FHIR slot semantics did not change the local policy tuple or frontier law.",
        ],
      },
      {
        url: "https://hl7.org/fhir/R4/appointment.html",
        title: "Appointment - FHIR v4.0.1",
        borrowedInto: [
          "Appointment remains the booked artifact rather than the source slot",
          "Support for not overstating what candidate normalization proves before authoritative confirmation",
        ],
        rejectedOrNotImported: [
          "FHIR appointment status flow did not replace local monotone confirmation-truth rules.",
        ],
      },
      {
        url: "https://www.hl7.org/fhir/schedule.html",
        title: "Schedule - HL7 FHIR",
        borrowedInto: [
          "Schedule remains the container for slots of time that may be available for booking",
        ],
        rejectedOrNotImported: [
          "Schedule presentation was not copied into the atlas as a calendar-centric interface.",
        ],
      },
      {
        url: "https://playwright.dev/docs/best-practices",
        title: "Best Practices - Playwright",
        borrowedInto: [
          "Locator-first browser proof",
          "User-facing assertions and isolated verification for the atlas",
        ],
        rejectedOrNotImported: [
          "General CI recommendations did not change contract semantics.",
        ],
      },
      {
        url: "https://linear.app/docs/triage",
        title: "Triage - Linear Docs",
        borrowedInto: [
          "Dense triage-board ergonomics for the left policy rail and candidate scan order",
        ],
        rejectedOrNotImported: [
          "Linear issue workflow semantics were not imported into network policy or clinical ranking logic.",
        ],
      },
      {
        url: "https://vercel.com/docs/observability",
        title: "Observability - Vercel",
        borrowedInto: [
          "Project-dashboard pattern for explicit scope strips and dense summary panels",
        ],
        rejectedOrNotImported: [
          "No Vercel deployment or observability semantics were imported into operational policy rules.",
        ],
      },
      {
        url: "https://carbondesignsystem.com/components/data-table/usage/",
        title: "Data table - Carbon Design System",
        borrowedInto: [
          "Dense table-first parity for candidate, source-admission, and ledger rows",
        ],
        rejectedOrNotImported: [
          "Carbon toolbar conventions did not override NHS-oriented accessibility and content discipline.",
        ],
      },
      {
        url: "https://service-manual.nhs.uk/design-system/components/table",
        title: "Table - NHS digital service manual",
        borrowedInto: [
          "Adjacent table parity beside each visual region",
          "Caption and header-scope discipline for lower parity tables",
        ],
        rejectedOrNotImported: [
          "The NHS table component did not dictate the higher-level three-region atlas layout.",
        ],
      },
    ],
    synthesis: [
      "External sources informed current Enhanced Access obligations, FHIR scheduling semantics, and the browser-visible atlas surface only.",
      "The local blueprint remains authoritative for policy-family separation, ranking formulas, source trust law, and typed seam ownership.",
      "Where external dashboard or design-system guidance implied looser semantics, those ideas were rejected in favor of persisted proof and explicit tuple law.",
    ],
  };
}

function buildPolicyBoundaryRows() {
  return POLICY_FAMILIES.map((family) => ({
    familyId: family.familyId,
    label: family.label,
    contractFile: family.contractFile,
    permittedOutputs: family.permittedOutputs.join(" | "),
    mayChangePatientOfferable: family.mayChangePatientOfferable ? "yes" : "no",
    mayChangeDirectCommit: family.mayChangeDirectCommit ? "yes" : "no",
    mayRescoreRank: family.mayRescoreRank ? "yes" : "no",
    mayMintLedger: family.mayMintLedger ? "yes" : "no",
    mayCreateAckDebt: family.mayCreateAckDebt ? "yes" : "no",
    formulaRefs: family.formulaRefs.join(" | "),
    blockedEffects: family.blockedEffects.join(" | "),
  }));
}

function buildGapLog() {
  return {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    gaps: GAP_SEAMS.map((seam) => ({
      seamId: seam.seamId,
      ownerTask: seam.ownerTask,
      area: seam.area,
      purpose: seam.purpose,
      consumerRefs: seam.consumerRefs,
      requiredObjects: seam.requiredObjects,
      riskIfUnresolved:
        seam.area === "queue_and_sla"
          ? "Future queue work may recompute trust-gap or fit scores locally instead of consuming the persisted 312 proof."
          : "Future patient-choice work may collapse the open-choice set into a covert top-K funnel or invent new disclosure semantics.",
      followUpAction:
        seam.area === "queue_and_sla"
          ? "Require later queue track to bind every risk and option projection to `CapacityRankProof` and `CapacityRankExplanation`."
          : "Require 313 to reuse `orderedCandidateRefs`, `offerabilityState`, and patient-safe explanation fields directly.",
    })),
  };
}

function buildDocsArchitecture() {
  return `# 312 Phase 5 Policy Capacity And Candidate Ranking Contract

Contract version: \`${CONTRACT_VERSION}\`

This document freezes the Phase 5 policy tuple, source-admission, and candidate-ranking contract pack. The tuple exists to stop policy and ranking drift from hiding inside search code, practice-visibility rules, or stale-feed copy.

## Compiled policy tuple

One explicit compiled tuple carries:

1. \`HubRoutingPolicyPack\`
2. \`HubVarianceWindowPolicy\`
3. \`HubServiceObligationPolicy\`
4. \`HubPracticeVisibilityPolicy\`
5. \`HubCapacityIngestionPolicy\`
6. the current \`rankPlanVersionRef\`
7. the current \`uncertaintyModelVersionRef\`

The tuple is identified by one \`policyTupleHash\`. All candidate normalization, frontiers, rank proofs, and later offer or queue consumers must bind that exact hash.

## Policy-family boundary matrix

${mdTable(
    [
      "Family",
      "May change patient-offerable?",
      "May change direct commit?",
      "May rescore rank?",
      "May mint ledger?",
      "May create ack debt?",
    ],
    POLICY_FAMILIES.map((family) => [
      family.label,
      family.mayChangePatientOfferable ? "Yes" : "No",
      family.mayChangeDirectCommit ? "Yes" : "No",
      family.mayRescoreRank ? "Yes" : "No",
      family.mayMintLedger ? "Yes" : "No",
      family.mayCreateAckDebt ? "Yes" : "No",
    ]),
  )}

## Non-negotiable policy law

1. Routing, approved variance, and capacity admission decide patient-offerable and direct-commit frontiers.
2. Service-obligation and practice-visibility rules may mint ledgers, exception records, visibility deltas, and acknowledgement debt, but they may not silently re-score, hide, or reorder candidates.
3. Quarantined-source candidates may never become bookable or patient-offerable.
4. Degraded-source candidates may remain visible only for diagnostic or callback reasoning, not ordinary direct-booking truth.

## Ranking formula pack

${mdTable(
    ["Formula", "Expression", "Units", "Range"],
    FORMULAS.map((formula) => [
      `\`${formula.name}\``,
      `\`${formula.expression}\``,
      formula.units,
      formula.range,
    ]),
  )}

Persisted ordering law:

1. \`windowClass\` descending
2. source trust tier descending
3. \`robustFit\` descending
4. \`travelMinutes\` ascending
5. \`startAt\` ascending
6. \`candidateId\` ascending

## Source-trust and admission law

${mdTable(
    ["Trust state", "Tier", "Patient-offerable", "Direct commit", "Diagnostic visibility"],
    SOURCE_TRUST_ROWS.map((row) => [
      row.sourceTrustState,
      String(row.sourceTrustTier),
      row.patientOfferable,
      row.directCommit,
      row.diagnosticVisible,
    ]),
  )}

## Snapshot, decision plan, and ledgers

- \`NetworkCoordinationPolicyEvaluation\` binds the five-family pack refs and separate disposition vocabularies under one \`policyTupleHash\`.
- \`NetworkCandidateSnapshot\` binds all normalized candidates, the current rank plan, the uncertainty model, and the generated proof refs.
- \`CrossSiteDecisionPlan\` persists ordered candidates, dominance removals, and the direct-commit, patient-offerable, callback-only, and diagnostic-only frontier slices.
- \`EnhancedAccessMinutesLedger\` and \`CancellationMakeUpLedger\` track operational obligations without altering rank.

## Later-owned typed seams

${mdTable(
    ["Typed seam file", "Owner", "Purpose"],
    GAP_SEAMS.map((seam) => [path.basename(seam.fileName), `\`${seam.ownerTask}\``, seam.purpose]),
  )}
`;
}

function buildDocsApi() {
  return `# 312 Phase 5 Candidate Snapshot And Rank Contract

This document freezes the machine-readable objects that later Phase 5 tracks must consume for network candidate reasoning.

## Core objects

${mdTable(
    ["Contract", "Purpose", "Mandatory binding"],
    [
      [
        "EnhancedAccessPolicy",
        "Compiled tuple root for the five policy families plus ranking versions.",
        "`policyTupleHash`, family refs, rank-plan version, uncertainty-model version",
      ],
      [
        "NetworkCoordinationPolicyEvaluation",
        "One bound evaluation vocabulary per candidate snapshot.",
        "`routingDisposition`, `varianceDisposition`, `serviceObligationDisposition`, `practiceVisibilityDisposition`, `capacityAdmissionDisposition`",
      ],
      [
        "NetworkSlotCandidate",
        "Normalized candidate row with proof-bearing features.",
        "`sourceTrustState`, `requiredWindowFit`, `baseUtility`, `uncertaintyRadius`, `robustFit`",
      ],
      [
        "NetworkCandidateSnapshot",
        "Durable candidate batch with proof refs.",
        "`policyTupleHash`, `rankPlanVersionRef`, `uncertaintyModelVersionRef`, `capacityRankProofRef`",
      ],
      [
        "CrossSiteDecisionPlan",
        "Ordered frontier plan across sites.",
        "`orderedCandidateRefs[]`, dominance decisions, frontier slices",
      ],
    ],
  )}

## Canonical candidate fields

${mdTable(
    ["Field", "Why it is mandatory"],
    [
      ["`siteId`", "Supports site-aware capacity reasoning and later open-choice diversity."],
      ["`modality`", "Feeds modality compatibility and patient explanation cues."],
      ["`clinicianType`", "Keeps operational suitability explicit."],
      ["`sourceTrustState`", "Governs bookability and visibility."],
      ["`sourceFreshnessState`", "Separates fresh, aging, and stale feed posture."],
      ["`requiredWindowFit`", "Defines the hard clinical band used by `windowClass(c,s)`."],
      ["`manageCapabilityState`", "Stops stale manage CTAs from remaining live."],
      ["`accessibilityFitScore`", "Preserves patient-access needs as an explicit normalized feature."],
      ["`capacityRankExplanationRef`", "Stops surfaces from inventing fresh cues locally."],
    ],
  )}

## Proof contract

The proof-bearing ranking contract persists:

- \`baseUtility\`
- \`uncertaintyRadius\`
- \`robustFit\`
- source trust tier
- dominance decisions
- the final lexicographic order

Later queue work, patient-choice work, support replay, and operations diagnostics must all reuse the same persisted proof instead of recalculating ordinals or reason cues.

## Sample ordered frontier

${mdTable(
    ["Rank", "Candidate", "Window", "Trust", "Offerability", "Robust fit"],
    CANDIDATES.sort((left, right) => left.rank - right.rank).map((candidate) => [
      String(candidate.rank),
      candidate.label,
      String(candidate.requiredWindowFit),
      candidate.sourceTrustState,
      candidate.offerabilityState,
      candidate.robustFit.toFixed(2),
    ]),
  )}
`;
}

function buildDocsSecurity() {
  return `# 312 Phase 5 Policy Tuple And Source Trust Rules

This document closes the Phase 5 gap where policy families, source trust, and ranking cues could otherwise bleed into each other.

## Tuple and disposition law

Every candidate snapshot binds one \`NetworkCoordinationPolicyEvaluation\` with separate disposition fields:

- \`routingDisposition\`
- \`varianceDisposition\`
- \`serviceObligationDisposition\`
- \`practiceVisibilityDisposition\`
- \`capacityAdmissionDisposition\`

These fields must never be collapsed into a single opaque status.

## Source-trust rules

1. Source trust is resolved before a candidate becomes bookable.
2. \`trusted\` means the candidate may participate in patient-offerable and direct-commit frontiers if routing and variance also allow it.
3. \`degraded\` means the candidate may remain visible only for diagnostic or callback reasoning.
4. \`quarantined\` means the candidate is excluded from bookable and patient-offerable frontiers.

## Ranking separation rules

1. \`windowClass\` is a hard band and remains outside the utility expression.
2. \`baseUtility\` is within-band only.
3. \`uncertaintyRadius\` is a persisted proof field rather than route-local stale-feed copy.
4. \`robustFit\` is the only within-band score used after window class and trust tier.
5. Service-obligation and practice-visibility rules may not influence rank order or frontier membership.

## Operational debt rules

${mdTable(
    ["Policy family", "What it may create", "What it may never do"],
    POLICY_FAMILIES.map((family) => [
      family.label,
      family.mayMintLedger
        ? "Ledgers or exceptions"
        : family.mayCreateAckDebt
          ? "Acknowledgement debt or visibility deltas"
          : "Frontier gating or source admission only",
      family.blockedEffects.join(" "),
    ]),
  )}

## Typed seam carry-forward

The queue and patient-choice seams published alongside this contract exist so later Phase 5 tracks cannot hide new ranking logic in UI projections, offer composition, or queue workbench code.
`;
}

function buildAtlasHtml() {
  const atlasData = {
    visualMode: VISUAL_MODE,
    policyTupleHash: POLICY_TUPLE_HASH,
    rankPlanVersionRef: RANK_PLAN_VERSION,
    uncertaintyModelVersionRef: UNCERTAINTY_MODEL_VERSION,
    families: POLICY_FAMILIES.map((family) => ({
      familyId: family.familyId,
      label: family.label,
      accent: family.accent,
      tupleFields: family.tupleFieldIds.map((fieldId) => ({
        fieldId,
        value:
          fieldId === "routingPolicyPackRef"
            ? POLICY_TUPLE.routingPolicyPackRef
            : fieldId === "varianceWindowPolicyRef"
              ? POLICY_TUPLE.varianceWindowPolicyRef
              : fieldId === "serviceObligationPolicyRef"
                ? POLICY_TUPLE.serviceObligationPolicyRef
                : fieldId === "practiceVisibilityPolicyRef"
                  ? POLICY_TUPLE.practiceVisibilityPolicyRef
                  : fieldId === "capacityIngestionPolicyRef"
                    ? POLICY_TUPLE.capacityIngestionPolicyRef
                    : fieldId === "weeklyMinutesPer1000AdjustedPopulation"
                      ? "60"
                      : fieldId === "bankHolidayMakeUpRule"
                        ? "replace_within_2_weeks_unless_commissioner_agrees_otherwise"
                        : fieldId === "comparableOfferRule"
                          ? "all_pcn_patients_comparable_offer"
                          : fieldId === "ledgerMode"
                            ? "minutes_ledger_required"
                            : fieldId === "originPracticeVisibleFieldRefs[]"
                              ? "macro_booking_status | latest_continuity_delta | ack_generation_state"
                              : fieldId === "visibilityDeltaRule"
                                ? "emit_delta_on_truth_or_generation_change"
                                : fieldId === "ackGenerationMode"
                                  ? "generation_bound"
                                  : fieldId === "minimumNecessaryContractRef"
                                    ? "min_necessary_origin_practice_v1"
                                    : fieldId === "freshnessThresholdMinutes"
                                      ? "15"
                                      : fieldId === "quarantineTriggers[]"
                                        ? "critical_adapter_drift | missing_assurance_slice | unresolved_collision"
                                        : fieldId === "degradedVisibilityModes[]"
                                          ? "callback_only_reasoning | diagnostic_only"
                                          : fieldId === "patientOfferableTrustStates[]"
                                            ? "trusted"
                                            : fieldId === "requiredWindowRule"
                                              ? "case_clinical_window"
                                              : fieldId === "approvedVarianceBeforeMinutes"
                                                ? "0"
                                                : fieldId === "approvedVarianceAfterMinutes"
                                                  ? "120"
                                                  : fieldId === "outsideWindowVisibleByPolicy"
                                                    ? "true"
                                                    : fieldId === "eligibleSiteRefs[]"
                                                      ? "Riverside | Northway | Central | Southbank | West"
                                                      : fieldId === "serviceFamilyRefs[]"
                                                        ? "enhanced_access_routine | vaccination | screening"
                                                        : fieldId === "routeReasonCode"
                                                          ? "local_unavailable_network_fallback"
                                                          : fieldId,
      })),
      permittedOutputs: family.permittedOutputs,
      blockedEffects: family.blockedEffects,
      formulaRefs: family.formulaRefs,
      lawSummary: family.lawSummary,
    })),
    siteCapacity: [
      {
        siteId: "hub_site_riverside",
        label: "Riverside Hub",
        trustState: "trusted",
        freshness: "8m",
        availableMinutes: 120,
        capacityNote: "Required-window supply is live and directly commitable.",
      },
      {
        siteId: "hub_site_northway",
        label: "Northway Clinic",
        trustState: "degraded",
        freshness: "48m",
        availableMinutes: 80,
        capacityNote: "Visible only for callback reasoning while trust remains degraded.",
      },
      {
        siteId: "hub_site_central",
        label: "Central Hub",
        trustState: "trusted",
        freshness: "6m",
        availableMinutes: 90,
        capacityNote: "Variance-window alternative remains patient-offerable.",
      },
      {
        siteId: "hub_site_southbank",
        label: "Southbank Outreach",
        trustState: "quarantined",
        freshness: "180m",
        availableMinutes: 40,
        capacityNote: "Quarantined feed retained for diagnostics only.",
      },
    ],
    candidates: CANDIDATES,
    formulas: FORMULAS,
    formulaParityRows: FORMULAS.map((formula) => ({
      formulaId: formula.formulaId,
      label: formula.name,
      expression: formula.expression,
      units: formula.units,
      range: formula.range,
    })),
    sourceAdmissionRows: SOURCE_TRUST_ROWS,
    ledgerRows: [
      {
        ledgerId: "EnhancedAccessMinutesLedger",
        purpose: "Tracks delivered, available, cancelled, and make-up minutes against minutes-per-1,000.",
        mayAffectRank: "No",
        mayCreateAckDebt: "No",
      },
      {
        ledgerId: "CancellationMakeUpLedger",
        purpose: "Tracks cancelled network time and replacement capacity windows.",
        mayAffectRank: "No",
        mayCreateAckDebt: "No",
      },
      {
        ledgerId: "Practice visibility debt",
        purpose: "Generated by practice-visibility rules when current acknowledgement or delta evidence is missing.",
        mayAffectRank: "No",
        mayCreateAckDebt: "Yes",
      },
    ],
  };

  const escapedData = JSON.stringify(atlasData).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>312 Phase 5 Policy Tuple And Capacity Atlas</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #f7f8fa;
        --panel: #ffffff;
        --inset: #e8eef3;
        --text-strong: #0f172a;
        --text-default: #334155;
        --text-muted: #64748b;
        --policy-accent: #3158e0;
        --trusted-accent: #0f766e;
        --degraded-accent: #b7791f;
        --quarantined-accent: #b42318;
        --ranking-accent: #5b61f6;
        --line: #d8e0e7;
        --shadow: 0 20px 42px rgba(15, 23, 42, 0.08);
        --radius: 12px;
        --transition: 180ms ease;
        font-family: "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif;
      }

      @media (prefers-reduced-motion: reduce) {
        :root {
          --transition: 0ms linear;
        }
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: var(--text-default);
        background:
          radial-gradient(circle at top right, rgba(49, 88, 224, 0.08), transparent 26%),
          linear-gradient(180deg, #f5f7fb 0%, var(--canvas) 42%, #eef3f8 100%);
      }

      .skip-link {
        position: absolute;
        left: 16px;
        top: -44px;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--text-strong);
        color: white;
        z-index: 10;
      }

      .skip-link:focus {
        top: 12px;
      }

      .page {
        min-height: 100vh;
        padding: 20px;
      }

      .atlas {
        max-width: 1740px;
        margin: 0 auto;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.76);
        backdrop-filter: blur(18px);
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .masthead {
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 18px 24px;
        border-bottom: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82));
      }

      .brand h1 {
        margin: 0;
        font-family: "Iowan Old Style", Georgia, serif;
        font-size: 24px;
        line-height: 1.1;
        color: var(--text-strong);
      }

      .brand p {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--text-muted);
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 11px;
        border-radius: 999px;
        font-size: 12px;
        background: var(--inset);
        color: var(--text-default);
      }

      .layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr) 440px;
        min-height: 980px;
      }

      .rail,
      .canvas,
      .inspector {
        min-width: 0;
      }

      .rail,
      .inspector {
        background: rgba(255, 255, 255, 0.86);
      }

      .rail {
        border-right: 1px solid var(--line);
        padding: 20px;
      }

      .canvas {
        padding: 20px;
      }

      .inspector {
        border-left: 1px solid var(--line);
        padding: 20px;
      }

      .section-label {
        margin: 0 0 12px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .family-list,
      .candidate-list {
        display: grid;
        gap: 8px;
      }

      .family-button,
      .candidate-button {
        width: 100%;
        padding: 12px 13px;
        border-radius: 10px;
        border: 1px solid var(--line);
        background: var(--panel);
        color: inherit;
        text-align: left;
        font: inherit;
        cursor: pointer;
        transition:
          border-color var(--transition),
          box-shadow var(--transition),
          background var(--transition),
          transform var(--transition);
      }

      .family-button:hover,
      .family-button:focus-visible,
      .candidate-button:hover,
      .candidate-button:focus-visible,
      .candidate-row-button:hover,
      .candidate-row-button:focus-visible {
        outline: none;
        border-color: var(--policy-accent);
        box-shadow: 0 0 0 3px rgba(49, 88, 224, 0.12);
      }

      .family-button[data-active="true"] {
        border-color: var(--policy-accent);
        background: rgba(49, 88, 224, 0.08);
        transform: translateX(2px);
      }

      .candidate-button[data-active="true"],
      .candidate-row-button[data-active="true"] {
        border-color: var(--ranking-accent);
        background: rgba(91, 97, 246, 0.08);
      }

      .button-title {
        display: block;
        font-weight: 600;
        color: var(--text-strong);
      }

      .button-note {
        display: block;
        margin-top: 3px;
        font-size: 12px;
        color: var(--text-muted);
      }

      .stack {
        display: grid;
        gap: 16px;
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        padding: 16px;
        min-width: 0;
      }

      .card h2,
      .card h3 {
        margin: 0 0 8px;
        color: var(--text-strong);
      }

      .card h2 {
        font-size: 18px;
      }

      .card h3 {
        font-size: 15px;
      }

      .card p,
      .card li,
      .card td,
      .card th {
        font-size: 14px;
        line-height: 1.5;
      }

      .tuple-strip {
        display: grid;
        gap: 10px;
      }

      .tuple-row {
        display: grid;
        grid-template-columns: 210px minmax(0, 1fr);
        gap: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        background: var(--inset);
      }

      .tuple-row strong {
        color: var(--text-strong);
      }

      .horizon {
        display: grid;
        gap: 10px;
      }

      .horizon-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 12px;
        align-items: center;
        padding: 12px;
        border-radius: 10px;
        background: linear-gradient(90deg, rgba(232, 238, 243, 0.9), rgba(255, 255, 255, 0.9));
      }

      .site-name {
        font-weight: 600;
        color: var(--text-strong);
      }

      .trust-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        color: white;
      }

      .trust-chip[data-state="trusted"] {
        background: var(--trusted-accent);
      }

      .trust-chip[data-state="degraded"] {
        background: var(--degraded-accent);
      }

      .trust-chip[data-state="quarantined"] {
        background: var(--quarantined-accent);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      caption {
        text-align: left;
        margin-bottom: 10px;
        color: var(--text-strong);
        font-weight: 600;
      }

      th,
      td {
        border-bottom: 1px solid var(--line);
        padding: 10px 8px;
        vertical-align: top;
        text-align: left;
      }

      th {
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .candidate-row-button {
        display: block;
        width: 100%;
        border: 1px solid transparent;
        border-radius: 8px;
        background: transparent;
        padding: 0;
        text-align: left;
        font: inherit;
        cursor: pointer;
        transition:
          border-color var(--transition),
          background var(--transition),
          box-shadow var(--transition);
      }

      .candidate-table {
        overflow-x: auto;
      }

      .formula-list,
      .effects-list,
      .reason-list {
        margin: 0;
        padding-left: 18px;
      }

      .parity-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .subdued {
        color: var(--text-muted);
      }

      @media (max-width: 1240px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .rail,
        .inspector {
          border: 0;
          border-top: 1px solid var(--line);
        }

        .parity-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .page {
          padding: 12px;
        }

        .masthead {
          padding: 16px;
        }

        .tuple-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#atlas-main">Skip to atlas</a>
    <div class="page">
      <div
        class="atlas"
        data-testid="Phase5PolicyCapacityAtlas"
        data-visual-mode="${VISUAL_MODE}"
        data-active-family="routing"
        data-active-candidate="candidate_trusted_required_001"
      >
        <header class="masthead">
          <div class="brand">
            <h1>Policy tuple and capacity atlas</h1>
            <p>312 freeze pack: policy families, source trust, and proof-bearing candidate ranking.</p>
          </div>
          <div class="meta">
            <span class="pill">Policy tuple hash <strong>${POLICY_TUPLE_HASH.slice(0, 12)}</strong></span>
            <span class="pill">Rank plan <strong>${RANK_PLAN_VERSION}</strong></span>
            <span class="pill">Uncertainty <strong>${UNCERTAINTY_MODEL_VERSION}</strong></span>
          </div>
        </header>
        <div class="layout">
          <aside class="rail">
            <div class="stack">
              <section>
                <p class="section-label">Policy families</p>
                <div class="family-list" id="family-list"></div>
              </section>
              <section>
                <p class="section-label">Candidate focus</p>
                <div class="candidate-list" id="candidate-list"></div>
              </section>
            </div>
          </aside>
          <main class="canvas" id="atlas-main">
            <div class="stack">
              <section class="card">
                <p class="section-label">Policy tuple strip</p>
                <div class="tuple-strip" id="tuple-strip"></div>
              </section>
              <section class="card">
                <p class="section-label">Site capacity horizon</p>
                <div class="horizon" id="horizon"></div>
              </section>
              <section class="card candidate-table">
                <table data-testid="CandidateTable">
                  <caption>Dense candidate table</caption>
                  <thead>
                    <tr>
                      <th scope="col">Rank</th>
                      <th scope="col">Candidate</th>
                      <th scope="col">Window</th>
                      <th scope="col">Trust</th>
                      <th scope="col">Offerability</th>
                      <th scope="col">Robust fit</th>
                    </tr>
                  </thead>
                  <tbody id="candidate-table-body"></tbody>
                </table>
              </section>
              <section class="parity-grid">
                <div class="card">
                  <table data-testid="FormulaParityTable">
                    <caption>Formula parity</caption>
                    <thead>
                      <tr>
                        <th scope="col">Formula</th>
                        <th scope="col">Units</th>
                        <th scope="col">Range</th>
                      </tr>
                    </thead>
                    <tbody id="formula-parity-body"></tbody>
                  </table>
                </div>
                <div class="card">
                  <table data-testid="SourceAdmissionParityTable">
                    <caption>Source-admission parity</caption>
                    <thead>
                      <tr>
                        <th scope="col">Trust</th>
                        <th scope="col">Patient-offerable</th>
                        <th scope="col">Direct commit</th>
                      </tr>
                    </thead>
                    <tbody id="source-parity-body"></tbody>
                  </table>
                </div>
                <div class="card">
                  <table data-testid="LedgerParityTable">
                    <caption>Ledger parity</caption>
                    <thead>
                      <tr>
                        <th scope="col">Ledger</th>
                        <th scope="col">Affects rank?</th>
                        <th scope="col">Ack debt?</th>
                      </tr>
                    </thead>
                    <tbody id="ledger-parity-body"></tbody>
                  </table>
                </div>
              </section>
            </div>
          </main>
          <aside class="inspector">
            <div class="stack">
              <section class="card">
                <p class="section-label">Active family</p>
                <h2 id="family-title"></h2>
                <p id="family-summary"></p>
                <h3 id="active-formula-tab" tabindex="0">Affected formulas</h3>
                <ul class="formula-list" id="family-formulas"></ul>
                <h3>Blocked candidate effects</h3>
                <ul class="effects-list" id="family-effects"></ul>
              </section>
              <section class="card">
                <p class="section-label">Candidate explanation</p>
                <h2 id="candidate-title"></h2>
                <p id="candidate-summary"></p>
                <table>
                  <tbody id="candidate-metrics"></tbody>
                </table>
                <h3 id="active-candidate-tab" tabindex="0">Reason cues</h3>
                <ul class="reason-list" id="candidate-reasons"></ul>
              </section>
              <section class="card">
                <p class="section-label">Trust posture</p>
                <div id="candidate-trust-posture"></div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
    <script>
      const atlasData = ${escapedData};
      const root = document.querySelector("[data-testid='Phase5PolicyCapacityAtlas']");
      const familyMap = new Map(atlasData.families.map((entry) => [entry.familyId, entry]));
      const candidateMap = new Map(atlasData.candidates.map((entry) => [entry.candidateId, entry]));
      let activeFamilyId = atlasData.families[0].familyId;
      let activeCandidateId = atlasData.candidates[0].candidateId;

      function create(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
      }

      function renderFamilyButtons() {
        const container = document.getElementById("family-list");
        container.innerHTML = "";
        atlasData.families.forEach((family) => {
          const button = create("button", "family-button");
          button.type = "button";
          button.dataset.id = family.familyId;
          button.dataset.active = String(family.familyId === activeFamilyId);
          button.setAttribute("aria-pressed", String(family.familyId === activeFamilyId));
          button.appendChild(create("span", "button-title", family.label));
          button.appendChild(create("span", "button-note", family.lawSummary));
          button.addEventListener("click", () => {
            activeFamilyId = family.familyId;
            sync();
          });
          container.appendChild(button);
        });
      }

      function renderCandidateButtons() {
        const container = document.getElementById("candidate-list");
        container.innerHTML = "";
        atlasData.candidates.forEach((candidate) => {
          const button = create("button", "candidate-button");
          button.type = "button";
          button.dataset.id = candidate.candidateId;
          button.dataset.active = String(candidate.candidateId === activeCandidateId);
          button.setAttribute("aria-pressed", String(candidate.candidateId === activeCandidateId));
          button.appendChild(create("span", "button-title", candidate.label));
          button.appendChild(
            create(
              "span",
              "button-note",
              "window " + candidate.requiredWindowFit + " | trust " + candidate.sourceTrustState,
            ),
          );
          button.addEventListener("click", () => {
            activeCandidateId = candidate.candidateId;
            sync();
          });
          container.appendChild(button);
        });
      }

      function renderTupleStrip() {
        const family = familyMap.get(activeFamilyId);
        const container = document.getElementById("tuple-strip");
        container.innerHTML = "";
        family.tupleFields.forEach((field) => {
          const row = create("div", "tuple-row");
          row.appendChild(create("strong", "", field.fieldId));
          row.appendChild(create("div", "", field.value));
          container.appendChild(row);
        });
      }

      function renderHorizon() {
        const container = document.getElementById("horizon");
        container.innerHTML = "";
        atlasData.siteCapacity.forEach((site) => {
          const row = create("div", "horizon-row");
          const info = create("div", "");
          info.appendChild(create("div", "site-name", site.label));
          info.appendChild(create("div", "subdued", site.capacityNote));
          row.appendChild(info);
          const chip = create("span", "trust-chip", site.trustState);
          chip.dataset.state = site.trustState;
          row.appendChild(chip);
          row.appendChild(create("div", "", site.availableMinutes + " min | " + site.freshness));
          container.appendChild(row);
        });
      }

      function renderCandidateTable() {
        const tbody = document.getElementById("candidate-table-body");
        tbody.innerHTML = "";
        atlasData.candidates.forEach((candidate) => {
          const tr = document.createElement("tr");
          const button = create("button", "candidate-row-button");
          button.type = "button";
          button.dataset.id = candidate.candidateId;
          button.dataset.active = String(candidate.candidateId === activeCandidateId);
          button.setAttribute("aria-pressed", String(candidate.candidateId === activeCandidateId));
          button.addEventListener("click", () => {
            activeCandidateId = candidate.candidateId;
            sync();
          });
          const rowTable = document.createElement("table");
          rowTable.innerHTML =
            "<tbody><tr>" +
            "<td>" + candidate.rank + "</td>" +
            "<td>" + candidate.label + "</td>" +
            "<td>" + candidate.requiredWindowFit + "</td>" +
            "<td>" + candidate.sourceTrustState + "</td>" +
            "<td>" + candidate.offerabilityState + "</td>" +
            "<td>" + candidate.robustFit.toFixed(2) + "</td>" +
            "</tr></tbody>";
          button.appendChild(rowTable);
          const td = document.createElement("td");
          td.colSpan = 6;
          td.style.padding = "0";
          td.appendChild(button);
          tr.appendChild(td);
          tbody.appendChild(tr);
        });
      }

      function renderParityTables() {
        const formulaBody = document.getElementById("formula-parity-body");
        formulaBody.innerHTML = "";
        atlasData.formulaParityRows.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + row.label + "</td>" +
            "<td>" + row.units + "</td>" +
            "<td>" + row.range + "</td>";
          formulaBody.appendChild(tr);
        });

        const sourceBody = document.getElementById("source-parity-body");
        sourceBody.innerHTML = "";
        atlasData.sourceAdmissionRows.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + row.sourceTrustState + "</td>" +
            "<td>" + row.patientOfferable + "</td>" +
            "<td>" + row.directCommit + "</td>";
          sourceBody.appendChild(tr);
        });

        const ledgerBody = document.getElementById("ledger-parity-body");
        ledgerBody.innerHTML = "";
        atlasData.ledgerRows.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + row.ledgerId + "</td>" +
            "<td>" + row.mayAffectRank + "</td>" +
            "<td>" + row.mayCreateAckDebt + "</td>";
          ledgerBody.appendChild(tr);
        });
      }

      function renderInspector() {
        const family = familyMap.get(activeFamilyId);
        const candidate = candidateMap.get(activeCandidateId);
        document.getElementById("family-title").textContent = family.label;
        document.getElementById("family-summary").textContent = family.lawSummary;
        const familyFormulas = document.getElementById("family-formulas");
        familyFormulas.innerHTML = "";
        if (family.formulaRefs.length === 0) {
          familyFormulas.appendChild(create("li", "", "No ranking formula ownership; this family must not rescore candidates."));
        } else {
          family.formulaRefs.forEach((formulaId) => {
            const formula = atlasData.formulas.find((entry) => entry.formulaId === formulaId);
            familyFormulas.appendChild(create("li", "", formula ? formula.name : formulaId));
          });
        }

        const familyEffects = document.getElementById("family-effects");
        familyEffects.innerHTML = "";
        family.blockedEffects.forEach((effect) => familyEffects.appendChild(create("li", "", effect)));

        document.getElementById("candidate-title").textContent = candidate.label;
        document.getElementById("candidate-summary").textContent =
          candidate.siteLabel + " | " + candidate.modality + " | " + candidate.clinicianType;

        const metrics = document.getElementById("candidate-metrics");
        metrics.innerHTML = "";
        [
          ["Window class", String(candidate.requiredWindowFit)],
          ["Trust posture", candidate.sourceTrustState + " (" + candidate.sourceTrustTier + ")"],
          ["Offerability", candidate.offerabilityState],
          ["Base utility", candidate.baseUtility.toFixed(2)],
          ["Uncertainty radius", candidate.uncertaintyRadius.toFixed(2)],
          ["Robust fit", candidate.robustFit.toFixed(2)],
        ].forEach(([label, value]) => {
          const tr = document.createElement("tr");
          tr.innerHTML = "<th scope='row'>" + label + "</th><td>" + value + "</td>";
          metrics.appendChild(tr);
        });

        const reasons = document.getElementById("candidate-reasons");
        reasons.innerHTML = "";
        const reasonItems = candidate.staffReasonRefs.length
          ? candidate.staffReasonRefs
          : ["No patient-safe explanation cues: candidate is blocked from offerable frontiers."];
        reasonItems.forEach((reason) => reasons.appendChild(create("li", "", reason)));

        const posture = document.getElementById("candidate-trust-posture");
        posture.innerHTML = "";
        const paragraph = create(
          "p",
          "",
          "Patient-offerable frontier: " +
            (candidate.patientOfferable ? "yes" : "no") +
            " | Direct commit: " +
            (candidate.directCommitEligible ? "yes" : "no"),
        );
        posture.appendChild(paragraph);
        if (candidate.blockedBy.length > 0) {
          const list = create("ul", "effects-list");
          candidate.blockedBy.forEach((reason) => list.appendChild(create("li", "", reason)));
          posture.appendChild(list);
        }
      }

      function sync() {
        root.setAttribute("data-active-family", activeFamilyId);
        root.setAttribute("data-active-candidate", activeCandidateId);
        renderFamilyButtons();
        renderCandidateButtons();
        renderTupleStrip();
        renderHorizon();
        renderCandidateTable();
        renderParityTables();
        renderInspector();
      }

      sync();
      window.__phase5PolicyCapacityAtlasData = { loaded: true, ...atlasData };
    </script>
  </body>
</html>`;
}

function buildEnhancedAccessPolicySample() {
  return {
    policyId: "policy_312_enhanced_access_default",
    policyVersion: CONTRACT_VERSION,
    policyState: "active",
    compiledPolicyBundleRef: "compiled_policy_bundle_312_default",
    policyTupleHash: POLICY_TUPLE_HASH,
    effectiveAt: "2026-04-22T00:00:00Z",
    effectiveUntil: null,
    pcnRef: "pcn_river_valley",
    weeklyMinutesPer1000AdjustedPopulation: 60,
    networkStandardHours: {
      weekdayStartLocal: "18:30",
      weekdayEndLocal: "20:00",
      saturdayStartLocal: "09:00",
      saturdayEndLocal: "17:00",
    },
    sameDayOnlineBookingRule: "same_day_online_routine_when_no_triage_required",
    comparableOfferRule: "comparable_offer_for_all_pcn_patients",
    routingPolicyPackRef: POLICY_TUPLE.routingPolicyPackRef,
    varianceWindowPolicyRef: POLICY_TUPLE.varianceWindowPolicyRef,
    serviceObligationPolicyRef: POLICY_TUPLE.serviceObligationPolicyRef,
    practiceVisibilityPolicyRef: POLICY_TUPLE.practiceVisibilityPolicyRef,
    capacityIngestionPolicyRef: POLICY_TUPLE.capacityIngestionPolicyRef,
    rankPlanVersionRef: RANK_PLAN_VERSION,
    uncertaintyModelVersionRef: UNCERTAINTY_MODEL_VERSION,
    sourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildPolicyEvaluationSample() {
  return {
    policyEvaluationId: "policy_eval_312_snapshot_001",
    hubCoordinationCaseId: "hub_case_312_001",
    evaluationScope: "candidate_snapshot",
    compiledPolicyBundleRef: "compiled_policy_bundle_312_default",
    policyTupleHash: POLICY_TUPLE_HASH,
    routingPolicyPackRef: POLICY_TUPLE.routingPolicyPackRef,
    varianceWindowPolicyRef: POLICY_TUPLE.varianceWindowPolicyRef,
    serviceObligationPolicyRef: POLICY_TUPLE.serviceObligationPolicyRef,
    practiceVisibilityPolicyRef: POLICY_TUPLE.practiceVisibilityPolicyRef,
    capacityIngestionPolicyRef: POLICY_TUPLE.capacityIngestionPolicyRef,
    routingDisposition: "route_to_network",
    varianceDisposition: "inside_required_window",
    serviceObligationDisposition: "within_obligation",
    practiceVisibilityDisposition: "standard_origin_visibility",
    capacityAdmissionDisposition: "trusted_admitted",
    sourceAdmissionSummary: [
      { sourceRef: "source_gp_connect_riverside", sourceTrustState: "trusted", candidateCount: 1 },
      { sourceRef: "source_partner_feed_northway", sourceTrustState: "degraded", candidateCount: 1 },
      { sourceRef: "source_gp_connect_central", sourceTrustState: "trusted", candidateCount: 1 },
      { sourceRef: "source_partner_feed_southbank", sourceTrustState: "quarantined", candidateCount: 1 },
      { sourceRef: "source_gp_connect_west", sourceTrustState: "trusted", candidateCount: 1 },
    ],
    evaluatedAt: "2026-04-22T10:20:00Z",
    sourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildCandidateSnapshotSample() {
  return {
    snapshotId: "snapshot_312_network_default",
    hubCoordinationCaseId: "hub_case_312_001",
    policyEvaluationRef: "policy_eval_312_snapshot_001",
    compiledPolicyBundleRef: "compiled_policy_bundle_312_default",
    policyTupleHash: POLICY_TUPLE_HASH,
    rankPlanVersionRef: RANK_PLAN_VERSION,
    uncertaintyModelVersionRef: UNCERTAINTY_MODEL_VERSION,
    fetchedAt: "2026-04-22T10:20:00Z",
    expiresAt: "2026-04-22T10:35:00Z",
    candidateRefs: CANDIDATES.map((candidate) => candidate.candidateId),
    candidateCount: CANDIDATES.length,
    trustedCandidateCount: CANDIDATES.filter((candidate) => candidate.sourceTrustState === "trusted")
      .length,
    degradedCandidateCount: CANDIDATES.filter((candidate) => candidate.sourceTrustState === "degraded")
      .length,
    quarantinedCandidateCount: CANDIDATES.filter(
      (candidate) => candidate.sourceTrustState === "quarantined",
    ).length,
    capacityRankProofRef: "capacity_rank_proof_312_network_default",
    capacityRankExplanationRefs: CANDIDATES.map((candidate) => candidate.explanationRef),
    sourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildDecisionPlanSample() {
  return {
    decisionPlanId: "cross_site_decision_plan_312_default",
    hubCoordinationCaseId: "hub_case_312_001",
    snapshotId: "snapshot_312_network_default",
    policyEvaluationRef: "policy_eval_312_snapshot_001",
    policyTupleHash: POLICY_TUPLE_HASH,
    orderedCandidateRefs: CANDIDATES.sort((left, right) => left.rank - right.rank).map(
      (candidate) => candidate.candidateId,
    ),
    patientOfferableFrontierRefs: PATIENT_OFFERABLE_FRONTIER,
    directCommitFrontierRefs: DIRECT_COMMIT_FRONTIER,
    callbackReasoningRefs: [
      "candidate_degraded_required_002",
      "candidate_trusted_outside_window_005",
    ],
    diagnosticOnlyRefs: ["candidate_quarantined_required_004"],
    dominanceDecisions: DOMINANCE_DECISIONS,
    generatedAt: "2026-04-22T10:30:00Z",
    sourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildMinutesLedgerSample() {
  return {
    enhancedAccessMinutesLedgerId: "minutes_ledger_312_week_17",
    pcnRef: "pcn_river_valley",
    policyTupleHash: POLICY_TUPLE_HASH,
    weekStartAt: "2026-04-20T00:00:00Z",
    weekEndAt: "2026-04-26T23:59:59Z",
    adjustedPopulation: 42000,
    minutesPer1000Required: 60,
    requiredMinutes: 2520,
    deliveredMinutes: 2280,
    availableMinutes: 2460,
    cancelledMinutes: 120,
    replacementMinutes: 60,
    ledgerState: "make_up_required",
    sourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildCancellationLedgerSample() {
  return {
    cancellationMakeUpLedgerId: "cancellation_make_up_312_001",
    pcnRef: "pcn_river_valley",
    policyTupleHash: POLICY_TUPLE_HASH,
    serviceDate: "2026-04-25T09:00:00Z",
    cancelledMinutes: 120,
    replacementMinutes: 60,
    makeUpDueAt: "2026-05-09T23:59:59Z",
    commissionerExceptionRef: null,
    makeUpState: "replacement_due",
    sourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildSeamFiles() {
  for (const seam of GAP_SEAMS) {
    writeJson(seam.fileName, {
      taskId: SHORT_TASK_ID,
      contractVersion: CONTRACT_VERSION,
      ...seam,
      xSourceRefs: Object.values(SOURCE_REFS),
    });
  }
}

function main() {
  buildSeamFiles();

  writeJson(
    "data/contracts/312_enhanced_access_policy.schema.json",
    buildEnhancedAccessPolicySchema(),
  );
  writeJson(
    "data/contracts/312_hub_routing_policy_pack.schema.json",
    buildRoutingPolicyPackSchema(),
  );
  writeJson(
    "data/contracts/312_hub_variance_window_policy.schema.json",
    buildVariancePolicySchema(),
  );
  writeJson(
    "data/contracts/312_hub_service_obligation_policy.schema.json",
    buildServiceObligationSchema(),
  );
  writeJson(
    "data/contracts/312_hub_practice_visibility_policy.schema.json",
    buildPracticeVisibilitySchema(),
  );
  writeJson(
    "data/contracts/312_hub_capacity_ingestion_policy.schema.json",
    buildCapacityIngestionSchema(),
  );
  writeJson(
    "data/contracts/312_network_coordination_policy_evaluation.schema.json",
    buildPolicyEvaluationSchema(),
  );
  writeJson(
    "data/contracts/312_network_candidate_snapshot.schema.json",
    buildCandidateSnapshotSchema(),
  );
  writeJson(
    "data/contracts/312_cross_site_decision_plan.schema.json",
    buildDecisionPlanSchema(),
  );
  writeJson("data/contracts/312_network_slot_candidate.schema.json", buildSlotCandidateSchema());
  writeJson(
    "data/contracts/312_capacity_rank_proof_contract.json",
    buildCapacityRankProofContract(),
  );
  writeJson(
    "data/contracts/312_capacity_rank_explanation_contract.json",
    buildCapacityRankExplanationContract(),
  );
  writeJson(
    "data/contracts/312_enhanced_access_minutes_ledger.schema.json",
    buildMinutesLedgerSchema(),
  );
  writeJson(
    "data/contracts/312_cancellation_make_up_ledger.schema.json",
    buildCancellationLedgerSchema(),
  );

  writeJson("data/analysis/312_external_reference_notes.json", buildExternalReferenceNotes());
  writeJson(
    "data/analysis/312_candidate_rank_formula_manifest.json",
    buildFormulaManifest(),
  );
  writeJson("data/analysis/312_capacity_ingestion_gap_log.json", buildGapLog());
  writeCsv("data/analysis/312_policy_family_boundary_matrix.csv", buildPolicyBoundaryRows(), [
    "familyId",
    "label",
    "contractFile",
    "permittedOutputs",
    "mayChangePatientOfferable",
    "mayChangeDirectCommit",
    "mayRescoreRank",
    "mayMintLedger",
    "mayCreateAckDebt",
    "formulaRefs",
    "blockedEffects",
  ]);

  writeText(
    "docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md",
    buildDocsArchitecture(),
  );
  writeText(
    "docs/api/312_phase5_candidate_snapshot_and_rank_contract.md",
    buildDocsApi(),
  );
  writeText(
    "docs/security/312_phase5_policy_tuple_and_source_trust_rules.md",
    buildDocsSecurity(),
  );
  writeText(
    "docs/frontend/312_phase5_policy_tuple_and_capacity_atlas.html",
    buildAtlasHtml(),
  );

  writeJson("data/contracts/312_examples.enhanced_access_policy.json", buildEnhancedAccessPolicySample());
  writeJson(
    "data/contracts/312_examples.network_coordination_policy_evaluation.json",
    buildPolicyEvaluationSample(),
  );
  writeJson(
    "data/contracts/312_examples.network_candidate_snapshot.json",
    buildCandidateSnapshotSample(),
  );
  writeJson(
    "data/contracts/312_examples.cross_site_decision_plan.json",
    buildDecisionPlanSample(),
  );
  writeJson(
    "data/contracts/312_examples.enhanced_access_minutes_ledger.json",
    buildMinutesLedgerSample(),
  );
  writeJson(
    "data/contracts/312_examples.cancellation_make_up_ledger.json",
    buildCancellationLedgerSample(),
  );
}

main();
