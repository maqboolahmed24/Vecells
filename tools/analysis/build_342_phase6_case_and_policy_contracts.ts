import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const TASK_ID = "seq_342_phase6_freeze_pharmacy_case_model_eligibility_and_policy_pack_contracts";
const CONTRACT_VERSION = "342.phase6.pharmacy-case-policy-freeze.v1";
const GENERATED_AT = new Date().toISOString();

const OUTPUTS = {
  architectureDoc: "docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md",
  apiDoc: "docs/api/342_phase6_pharmacy_case_and_rules_api.md",
  policyDoc: "docs/policy/342_phase6_rule_pack_change_control.md",
  caseSchema: "data/contracts/342_phase6_pharmacy_case_schema.json",
  stateMachine: "data/contracts/342_phase6_case_state_machine.yaml",
  eventRegistry: "data/contracts/342_phase6_event_registry.json",
  apiSurface: "data/contracts/342_phase6_api_surface.yaml",
  rulePackSchema: "data/contracts/342_phase6_rule_pack_schema.json",
  pathwayRegistry: "data/contracts/342_phase6_pathway_registry.json",
  thresholdRegistry: "data/contracts/342_phase6_threshold_family_registry.json",
  explanationBundleSchema: "data/contracts/342_phase6_explanation_bundle_schema.json",
  rulePackFixture: "data/fixtures/342_phase6_rule_pack_example.json",
  transitionFixture: "data/fixtures/342_phase6_case_transition_examples.json",
  externalNotes: "data/analysis/342_external_reference_notes.json",
  transitionMatrix: "data/analysis/342_phase6_state_transition_matrix.csv",
  decisionTable: "data/analysis/342_phase6_pathway_decision_table.csv",
} as const;

type FieldDef = {
  name: string;
  schema: Record<string, unknown>;
  description: string;
  mutability: "immutable" | "mutable" | "system_only" | "derived";
  ownerTask: string;
  sourceSection: string;
  downstreamDependents: string[];
};

type ThresholdFamily = {
  thresholdId: string;
  parameterForm: "vector" | "scalar";
  semanticPurpose: string;
  unitOrRange: string;
  packOwnership: "eligibility" | "fallback" | "timing";
  replayRequired: boolean;
};

type PathwayDef = {
  pathwayCode: string;
  displayName: string;
  serviceLane: "clinical_pathway_consultation";
  ageMin: number;
  ageMax?: number;
  sexGate: "any" | "female_only";
  precedenceRank: number;
  materialityLevel: "high" | "medium" | "low";
  allowedEscalationModes: string[];
  supplyModes: string[];
  timingGuardrailCode: string;
};

type StateDef = {
  stateId: string;
  stateFamily:
    | "intake"
    | "evaluation"
    | "choice"
    | "consent"
    | "dispatch"
    | "outcome"
    | "return"
    | "closure";
  summary: string;
};

type TransitionDef = {
  transitionId: string;
  from: string;
  event: string;
  to: string;
  preconditions: string[];
  prohibitedWhen: string[];
  blockerFamilies: string[];
  sideEffectFamilies: string[];
};

type EventDef = {
  eventName: string;
  eventFamily: "case" | "eligibility" | "choice" | "consent" | "dispatch" | "outcome" | "reachability" | "closure";
  producer: string;
  aggregate: string;
  summary: string;
};

type ApiCommand = {
  operationId: string;
  method: "POST" | "GET";
  path: string;
  statePreconditions: string[];
  stateExits: string[];
  idempotencyExpectation: string;
  failureClasses: string[];
  lineageAndLeaseChecks: string[];
  staleWriteBehavior: string;
  auditAppends: string[];
};

function repoPath(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function ensureDir(relativePath: string): void {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
}

function writeText(relativePath: string, content: string): void {
  ensureDir(relativePath);
  fs.writeFileSync(repoPath(relativePath), `${content.trimEnd()}\n`);
}

function writeJson(relativePath: string, payload: unknown): void {
  writeText(relativePath, JSON.stringify(payload, null, 2));
}

function writeYamlAsJson(relativePath: string, payload: unknown): void {
  writeText(relativePath, JSON.stringify(payload, null, 2));
}

function csvEscape(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(relativePath: string, headers: string[], rows: Array<Record<string, unknown>>): void {
  const body = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  writeText(relativePath, body);
}

function markdownTable(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function primitiveString(description: string): Record<string, unknown> {
  return { type: "string", minLength: 1, description };
}

function isoDateTime(description: string): Record<string, unknown> {
  return { type: "string", format: "date-time", description };
}

function typedRefSchema(
  targetFamily: string,
  ownerTask: string,
  description: string,
  nullable = false,
): Record<string, unknown> {
  const schema = {
    type: "object",
    additionalProperties: false,
    description,
    properties: {
      targetFamily: { const: targetFamily },
      refId: { type: "string", minLength: 1 },
      ownerTask: { const: ownerTask },
    },
    required: ["targetFamily", "refId", "ownerTask"],
  };
  return nullable ? { oneOf: [schema, { type: "null" }] } : schema;
}

function typedRefArraySchema(
  targetFamily: string,
  ownerTask: string,
  description: string,
): Record<string, unknown> {
  return {
    type: "array",
    description,
    items: typedRefSchema(targetFamily, ownerTask, `${description} item`, false),
  };
}

function applyFieldMetadata(propertySchema: Record<string, unknown>, field: FieldDef): Record<string, unknown> {
  return {
    ...propertySchema,
    description: field.description,
    "x-vecells-mutability": field.mutability,
    "x-vecells-owner-task": field.ownerTask,
    "x-vecells-source-section": field.sourceSection,
    "x-vecells-downstream-dependents": field.downstreamDependents,
  };
}

function buildObjectSchema(
  title: string,
  description: string,
  fields: FieldDef[],
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title,
    description,
    type: "object",
    additionalProperties: false,
    required: fields.map((field) => field.name),
    properties: Object.fromEntries(
      fields.map((field) => [field.name, applyFieldMetadata(field.schema, field)]),
    ),
    ...extra,
  };
}

const later343Owner = "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts";
const later344Owner = "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts";

const pathways: PathwayDef[] = [
  {
    pathwayCode: "uncomplicated_uti_female_16_64",
    displayName: "Uncomplicated UTI",
    serviceLane: "clinical_pathway_consultation",
    ageMin: 16,
    ageMax: 64,
    sexGate: "female_only",
    precedenceRank: 1,
    materialityLevel: "high",
    allowedEscalationModes: ["return_to_general_practice", "urgent_return_if_red_flags_present"],
    supplyModes: ["pgd_or_protocol_supply", "self_care_only_if_thresholds_not_met"],
    timingGuardrailCode: "uti_high_materiality",
  },
  {
    pathwayCode: "shingles_18_plus",
    displayName: "Shingles",
    serviceLane: "clinical_pathway_consultation",
    ageMin: 18,
    sexGate: "any",
    precedenceRank: 2,
    materialityLevel: "high",
    allowedEscalationModes: ["return_to_general_practice", "urgent_return_if_eye_or_immunosuppression_risk"],
    supplyModes: ["pgd_or_protocol_supply", "self_care_support"],
    timingGuardrailCode: "shingles_high_materiality",
  },
  {
    pathwayCode: "acute_otitis_media_1_17",
    displayName: "Acute otitis media",
    serviceLane: "clinical_pathway_consultation",
    ageMin: 1,
    ageMax: 17,
    sexGate: "any",
    precedenceRank: 3,
    materialityLevel: "high",
    allowedEscalationModes: ["return_to_general_practice", "urgent_return_if_red_flags_present"],
    supplyModes: ["otc_first_line", "pgd_or_protocol_supply"],
    timingGuardrailCode: "aom_high_materiality",
  },
  {
    pathwayCode: "acute_sore_throat_5_plus",
    displayName: "Acute sore throat",
    serviceLane: "clinical_pathway_consultation",
    ageMin: 5,
    sexGate: "any",
    precedenceRank: 4,
    materialityLevel: "medium",
    allowedEscalationModes: ["return_to_general_practice", "urgent_return_if_airway_or_systemic_risk"],
    supplyModes: ["self_care_only", "pgd_or_protocol_supply"],
    timingGuardrailCode: "sore_throat_medium_materiality",
  },
  {
    pathwayCode: "acute_sinusitis_12_plus",
    displayName: "Acute sinusitis",
    serviceLane: "clinical_pathway_consultation",
    ageMin: 12,
    sexGate: "any",
    precedenceRank: 5,
    materialityLevel: "medium",
    allowedEscalationModes: ["return_to_general_practice", "urgent_return_if_orbital_or_neurological_risk"],
    supplyModes: ["self_care_only", "pgd_or_protocol_supply"],
    timingGuardrailCode: "sinusitis_medium_materiality",
  },
  {
    pathwayCode: "impetigo_1_plus",
    displayName: "Impetigo",
    serviceLane: "clinical_pathway_consultation",
    ageMin: 1,
    sexGate: "any",
    precedenceRank: 6,
    materialityLevel: "low",
    allowedEscalationModes: ["return_to_general_practice"],
    supplyModes: ["topical_or_oral_pgd_supply", "self_care_support"],
    timingGuardrailCode: "impetigo_low_materiality",
  },
  {
    pathwayCode: "infected_insect_bites_1_plus",
    displayName: "Infected insect bites",
    serviceLane: "clinical_pathway_consultation",
    ageMin: 1,
    sexGate: "any",
    precedenceRank: 7,
    materialityLevel: "low",
    allowedEscalationModes: ["return_to_general_practice"],
    supplyModes: ["self_care_support", "pgd_or_protocol_supply"],
    timingGuardrailCode: "infected_bites_low_materiality",
  },
];

const thresholdFamilies: ThresholdFamily[] = [
  {
    thresholdId: "alpha_required_symptom_weight",
    parameterForm: "vector",
    semanticPurpose: "Relative weight for each required symptom signal within s_req and s_comp.",
    unitOrRange: "[0,+inf)",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "eta_excl",
    parameterForm: "scalar",
    semanticPurpose: "Penalty exponent applied to pathway-specific exclusion strength.",
    unitOrRange: "[0,+inf)",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "eta_global",
    parameterForm: "scalar",
    semanticPurpose: "Penalty exponent applied to global exclusion or red-flag bridge strength.",
    unitOrRange: "[0,+inf)",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "eta_contra",
    parameterForm: "scalar",
    semanticPurpose: "Penalty exponent applied to contradictory evidence strength.",
    unitOrRange: "[0,+inf)",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "tau_global_block",
    parameterForm: "scalar",
    semanticPurpose: "Immediate pharmacy-block threshold for global exclusions or red-flag bridges.",
    unitOrRange: "[0,1]",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "tau_path_block",
    parameterForm: "scalar",
    semanticPurpose: "Pathway-specific hard-fail threshold for exclusion strength.",
    unitOrRange: "[0,1]",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "tau_contra_block",
    parameterForm: "scalar",
    semanticPurpose: "Pathway-specific hard-fail threshold for contradiction strength.",
    unitOrRange: "[0,1]",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "tau_req_pass",
    parameterForm: "scalar",
    semanticPurpose: "Minimum required-symptom support for a pathway to remain eligible.",
    unitOrRange: "[0,1]",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "tau_min_complete",
    parameterForm: "scalar",
    semanticPurpose: "Minimum evidence completeness required before the pathway may pass.",
    unitOrRange: "[0,1]",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "tau_eligible",
    parameterForm: "scalar",
    semanticPurpose: "Minimum overall eligibilityConfidence needed for pharmacy progression.",
    unitOrRange: "[0,1]",
    packOwnership: "eligibility",
    replayRequired: true,
  },
  {
    thresholdId: "xi_minor_feature_weight",
    parameterForm: "vector",
    semanticPurpose: "Weight vector for the fallbackScore feature family m_h(x).",
    unitOrRange: "[0,+inf)",
    packOwnership: "fallback",
    replayRequired: true,
  },
  {
    thresholdId: "tau_minor_eligible",
    parameterForm: "scalar",
    semanticPurpose: "Minimum fallbackScore needed to enter minor-illness handling after pathway-only failures.",
    unitOrRange: "[0,1]",
    packOwnership: "fallback",
    replayRequired: true,
  },
];

const states: StateDef[] = [
  {
    stateId: "candidate_received",
    stateFamily: "intake",
    summary: "A pharmacy-eligible branch has been created and lineage has been acknowledged, but rules have not yet begun.",
  },
  {
    stateId: "rules_evaluating",
    stateFamily: "evaluation",
    summary: "The case is actively being evaluated against the frozen pathway and fallback pack.",
  },
  {
    stateId: "ineligible_returned",
    stateFamily: "evaluation",
    summary: "Pharmacy suitability has been denied and the work returns to a non-pharmacy route.",
  },
  {
    stateId: "eligible_choice_pending",
    stateFamily: "choice",
    summary: "Eligibility passed and the case waits on provider-choice truth under the current pack.",
  },
  {
    stateId: "provider_selected",
    stateFamily: "choice",
    summary: "A single provider has been durably selected but consent and package posture still govern onward progress.",
  },
  {
    stateId: "consent_pending",
    stateFamily: "consent",
    summary: "Selection exists, but referral consent or checkpoint posture is not currently satisfied.",
  },
  {
    stateId: "package_ready",
    stateFamily: "dispatch",
    summary: "The canonical package is frozen and the current consent checkpoint is satisfied.",
  },
  {
    stateId: "dispatch_pending",
    stateFamily: "dispatch",
    summary: "A fenced dispatch attempt exists and transport proof is still being gathered.",
  },
  {
    stateId: "referred",
    stateFamily: "dispatch",
    summary: "Dispatch proof satisfies the current assurance profile and the referral is live with the selected provider.",
  },
  {
    stateId: "consultation_outcome_pending",
    stateFamily: "outcome",
    summary: "The referral is live and the branch waits for an authoritative pharmacy outcome.",
  },
  {
    stateId: "outcome_reconciliation_pending",
    stateFamily: "outcome",
    summary: "Weak or contradictory outcome truth blocks ordinary settlement pending case-local review.",
  },
  {
    stateId: "resolved_by_pharmacy",
    stateFamily: "outcome",
    summary: "Outcome truth is strong enough to settle the pharmacy branch locally, but closure still requires blocker clearance.",
  },
  {
    stateId: "unresolved_returned",
    stateFamily: "return",
    summary: "The pharmacy branch has not resolved and is returning to practice or triage under routine return law.",
  },
  {
    stateId: "urgent_bounce_back",
    stateFamily: "return",
    summary: "Urgent return dominates ordinary branch messaging and requires direct safety handling.",
  },
  {
    stateId: "no_contact_return_pending",
    stateFamily: "return",
    summary: "No-contact return has been made explicit and cannot auto-close.",
  },
  {
    stateId: "closed",
    stateFamily: "closure",
    summary: "LifecycleCoordinator has accepted closure because no confirmation, reachability, consent, or outcome blockers remain open.",
  },
];

const transitions: TransitionDef[] = [
  {
    transitionId: "PH6_TX_001",
    from: "candidate_received",
    event: "pharmacy.service_type.resolved",
    to: "rules_evaluating",
    preconditions: [
      "A current LineageCaseLink(caseFamily = pharmacy) is present on the active RequestLineage.",
      "ScopedMutationGate admits the evaluation command for the active ownership epoch.",
    ],
    prohibitedWhen: ["Identity repair branch is active and unresolved."],
    blockerFamilies: ["identity_repair_freeze", "stale_owner_recovery"],
    sideEffectFamilies: ["service_type_decision_persisted", "evidence_snapshot_frozen"],
  },
  {
    transitionId: "PH6_TX_002",
    from: "rules_evaluating",
    event: "pharmacy.pathway.evaluated",
    to: "ineligible_returned",
    preconditions: [
      "The current PharmacyRulePack and threshold families are resolved and attached to the evaluation record.",
      "s_global(x) >= tau_global_block or all candidate pathways fail without lawful fallback.",
    ],
    prohibitedWhen: ["Rule-pack version is missing or mutable in place."],
    blockerFamilies: ["pack_mutation_rejected"],
    sideEffectFamilies: ["eligibility_explanation_created", "return_route_required"],
  },
  {
    transitionId: "PH6_TX_003",
    from: "rules_evaluating",
    event: "pharmacy.pathway.evaluated",
    to: "eligible_choice_pending",
    preconditions: [
      "At least one pathway is eligible under the frozen threshold family registry or minor-illness fallback is lawfully satisfied.",
      "Matched rules, completeness, contradiction, confidence, and timing guardrail are persisted.",
    ],
    prohibitedWhen: ["Fallback is being used to bypass a global block or hard-failed contradiction."],
    blockerFamilies: ["illegal_fallback_bypass"],
    sideEffectFamilies: ["eligibility_explanation_created", "choice_session_refresh_required"],
  },
  {
    transitionId: "PH6_TX_004",
    from: "eligible_choice_pending",
    event: "pharmacy.provider.selected",
    to: "provider_selected",
    preconditions: [
      "A current PharmacyChoiceSession exists with a full visible provider set and deterministic frontier ordering.",
      "The selected provider remains present in the current choice proof and any override acknowledgement requirement is met.",
    ],
    prohibitedWhen: ["Choice proof has been superseded or stale provider capability evidence is being reused."],
    blockerFamilies: ["choice_proof_superseded", "provider_capability_stale"],
    sideEffectFamilies: ["provider_selection_persisted", "consent_checkpoint_refresh_required"],
  },
  {
    transitionId: "PH6_TX_005",
    from: "provider_selected",
    event: "pharmacy.consent.checkpoint.updated",
    to: "consent_pending",
    preconditions: [
      "Selection exists but the current checkpointState is not satisfied.",
      "The checkpoint binds the selected provider, pathway, referral scope, selectionBindingHash, and package fingerprint candidate.",
    ],
    prohibitedWhen: ["A withdrawn or revoked consent row is being treated as still usable."],
    blockerFamilies: ["consent_invalid", "selection_binding_drift"],
    sideEffectFamilies: ["patient_reassurance_blocked", "same_shell_renewal_required"],
  },
  {
    transitionId: "PH6_TX_006",
    from: "provider_selected",
    event: "pharmacy.package.composed",
    to: "package_ready",
    preconditions: [
      "The current consent checkpoint is satisfied.",
      "The package is frozen against the current selected provider, pathway, scope, and package fingerprint.",
    ],
    prohibitedWhen: ["The package fingerprint does not match the selectionBindingHash."],
    blockerFamilies: ["package_lineage_mismatch", "consent_invalid"],
    sideEffectFamilies: ["package_frozen", "dispatch_plan_refresh_enabled"],
  },
  {
    transitionId: "PH6_TX_007",
    from: "consent_pending",
    event: "pharmacy.consent.checkpoint.updated",
    to: "package_ready",
    preconditions: [
      "A refreshed consent record, explanation binding, and selected provider tuple are current.",
      "The consent checkpointState has become satisfied without stale-write drift.",
    ],
    prohibitedWhen: ["The consent update was written under an expired ownership epoch."],
    blockerFamilies: ["stale_owner_recovery", "consent_invalid"],
    sideEffectFamilies: ["consent_checkpoint_satisfied", "package_frozen"],
  },
  {
    transitionId: "PH6_TX_008",
    from: "package_ready",
    event: "pharmacy.consent.revoked",
    to: "consent_pending",
    preconditions: [
      "Provider, pathway, scope, proof, or package lineage changed materially; or consent was withdrawn or revoked.",
      "A PharmacyConsentRevocationRecord or equivalent checkpoint drift signal was persisted.",
    ],
    prohibitedWhen: ["Revocation is ignored because package_ready is being treated as calmer than consent truth."],
    blockerFamilies: ["consent_invalid", "package_lineage_mismatch"],
    sideEffectFamilies: ["checkpoint_unsatisfied", "dispatch_blocked"],
  },
  {
    transitionId: "PH6_TX_009",
    from: "package_ready",
    event: "pharmacy.dispatch.started",
    to: "dispatch_pending",
    preconditions: [
      "The current consent checkpoint remains satisfied.",
      "Route intent, lineage fence, ownership epoch, and idempotency tuple all match the current plan.",
    ],
    prohibitedWhen: ["RequestLifecycleLease is stale or the active identity-repair branch is unresolved."],
    blockerFamilies: ["stale_owner_recovery", "identity_repair_freeze", "consent_invalid"],
    sideEffectFamilies: ["dispatch_attempt_created", "confirmation_gate_created_or_refreshed"],
  },
  {
    transitionId: "PH6_TX_010",
    from: "dispatch_pending",
    event: "pharmacy.dispatch.confirmed",
    to: "referred",
    preconditions: [
      "Dispatch proof satisfies the active TransportAssuranceProfile.",
      "The authoritative proof source or confirmation gate is attached to the dispatch attempt.",
    ],
    prohibitedWhen: ["Proof is still pending, expired, or disputed under the active confidence threshold."],
    blockerFamilies: ["confirmation_gate_open", "dispatch_proof_disputed"],
    sideEffectFamilies: ["dispatch_truth_projection_refreshed", "patient_instruction_ready"],
  },
  {
    transitionId: "PH6_TX_011",
    from: "referred",
    event: "pharmacy.dispatch.confirmed",
    to: "consultation_outcome_pending",
    preconditions: [
      "The referral remains bound to the same provider, pathway, package, and continuity evidence tuple.",
      "Dispatch truth remains sufficient for patient and staff reassurance.",
    ],
    prohibitedWhen: ["A dispatch-plan supersession or consent revocation has invalidated the live tuple."],
    blockerFamilies: ["consent_invalid", "dispatch_tuple_drift"],
    sideEffectFamilies: ["await_outcome_projection_started"],
  },
  {
    transitionId: "PH6_TX_012",
    from: "consultation_outcome_pending",
    event: "pharmacy.case.resolved",
    to: "resolved_by_pharmacy",
    preconditions: [
      "Outcome evidence is strongly correlated and no reconciliation gate remains open.",
      "Closure blockers other than lifecycle-close remain empty or explicitly settled.",
    ],
    prohibitedWhen: ["Weak, ambiguous, or contradictory outcome truth is being auto-applied."],
    blockerFamilies: ["outcome_reconciliation_gate_open"],
    sideEffectFamilies: ["outcome_settlement_persisted", "closure_eligibility_recomputed"],
  },
  {
    transitionId: "PH6_TX_013",
    from: "consultation_outcome_pending",
    event: "pharmacy.case.bounce_back",
    to: "unresolved_returned",
    preconditions: [
      "Outcome evidence or return signal is strong enough for a routine unresolved return.",
      "The return pathway does not meet urgent or no-contact thresholds.",
    ],
    prohibitedWhen: ["Urgent return is being flattened into routine unresolved return."],
    blockerFamilies: ["return_route_pending"],
    sideEffectFamilies: ["bounce_back_record_created", "request_reopen_signal_emitted"],
  },
  {
    transitionId: "PH6_TX_014",
    from: "consultation_outcome_pending",
    event: "pharmacy.case.bounce_back",
    to: "urgent_bounce_back",
    preconditions: [
      "Urgent return evidence meets the carry-floor and direct-safety route threshold.",
      "Urgent communication routing is available or an explicit monitored fallback route is active.",
    ],
    prohibitedWhen: ["Update Record or routine messaging is being treated as the urgent return mechanism."],
    blockerFamilies: ["urgent_route_unacknowledged", "reachability_dependency_open"],
    sideEffectFamilies: ["bounce_back_record_created", "direct_urgent_route_started"],
  },
  {
    transitionId: "PH6_TX_015",
    from: "consultation_outcome_pending",
    event: "pharmacy.reachability.blocked",
    to: "no_contact_return_pending",
    preconditions: [
      "No-contact return threshold or reachability dependency failure has been met.",
      "The branch has not been resolved or urgently bounced back.",
    ],
    prohibitedWhen: ["No-contact return is being auto-closed or hidden behind general unresolved text."],
    blockerFamilies: ["reachability_dependency_open"],
    sideEffectFamilies: ["reachability_plan_refreshed", "return_review_required"],
  },
  {
    transitionId: "PH6_TX_016",
    from: "consultation_outcome_pending",
    event: "pharmacy.outcome.received",
    to: "outcome_reconciliation_pending",
    preconditions: [
      "Outcome evidence is weak, ambiguous, contradictory, or below the strong-match threshold.",
      "A case-local reconciliation gate has been created or refreshed.",
    ],
    prohibitedWhen: ["Weak outcome evidence is being treated as final settlement."],
    blockerFamilies: ["outcome_reconciliation_gate_open"],
    sideEffectFamilies: ["outcome_reconciliation_gate_created", "closure_blocker_added"],
  },
  {
    transitionId: "PH6_TX_017",
    from: "outcome_reconciliation_pending",
    event: "pharmacy.outcome.reconciled",
    to: "resolved_by_pharmacy",
    preconditions: ["The reconciliation gate has been explicitly settled in favor of pharmacy resolution."],
    prohibitedWhen: ["The reconciliation gate is still blocking closure."],
    blockerFamilies: ["outcome_reconciliation_gate_open"],
    sideEffectFamilies: ["outcome_settlement_persisted", "closure_eligibility_recomputed"],
  },
  {
    transitionId: "PH6_TX_018",
    from: "outcome_reconciliation_pending",
    event: "pharmacy.outcome.reconciled",
    to: "unresolved_returned",
    preconditions: ["The reconciliation gate has been explicitly settled in favor of routine return to practice."],
    prohibitedWhen: ["The gate resolution still requires urgent handling."],
    blockerFamilies: ["outcome_reconciliation_gate_open"],
    sideEffectFamilies: ["bounce_back_record_created", "request_reopen_signal_emitted"],
  },
  {
    transitionId: "PH6_TX_019",
    from: "outcome_reconciliation_pending",
    event: "pharmacy.outcome.reconciled",
    to: "urgent_bounce_back",
    preconditions: ["The reconciliation gate has been explicitly settled in favor of urgent return handling."],
    prohibitedWhen: ["Urgent handling route is unresolved."],
    blockerFamilies: ["outcome_reconciliation_gate_open", "urgent_route_unacknowledged"],
    sideEffectFamilies: ["bounce_back_record_created", "direct_urgent_route_started"],
  },
  {
    transitionId: "PH6_TX_020",
    from: "outcome_reconciliation_pending",
    event: "pharmacy.outcome.reconciled",
    to: "no_contact_return_pending",
    preconditions: ["The reconciliation gate has been explicitly settled in favor of no-contact return handling."],
    prohibitedWhen: ["Reachability remediation is still unresolved."],
    blockerFamilies: ["outcome_reconciliation_gate_open", "reachability_dependency_open"],
    sideEffectFamilies: ["reachability_plan_refreshed", "return_review_required"],
  },
  {
    transitionId: "PH6_TX_021",
    from: "resolved_by_pharmacy",
    event: "pharmacy.case.closed",
    to: "closed",
    preconditions: [
      "LifecycleCoordinator remains the only request-closure authority.",
      "All currentConfirmationGateRefs, currentClosureBlockerRefs, and activeReachabilityDependencyRefs are empty or settled.",
    ],
    prohibitedWhen: ["Any closure blocker, reachability blocker, or unresolved urgent return remains active."],
    blockerFamilies: ["closure_blocker_open", "reachability_dependency_open"],
    sideEffectFamilies: ["request_closure_record_written", "lineage_link_settled"],
  },
];

const events: EventDef[] = [
  {
    eventName: "pharmacy.case.created",
    eventFamily: "case",
    producer: "POST /v1/pharmacy/cases",
    aggregate: "PharmacyCase",
    summary: "A new governed pharmacy branch has been created on the active request lineage.",
  },
  {
    eventName: "pharmacy.service_type.resolved",
    eventFamily: "eligibility",
    producer: "POST /v1/pharmacy/cases/{pharmacyCaseId}:evaluate",
    aggregate: "ServiceTypeDecision",
    summary: "The service lane and candidate pathway set were resolved before pathway scoring.",
  },
  {
    eventName: "pharmacy.pathway.evaluated",
    eventFamily: "eligibility",
    producer: "POST /v1/pharmacy/cases/{pharmacyCaseId}:evaluate",
    aggregate: "PathwayEligibilityEvaluation",
    summary: "A replayable pathway evaluation bundle has been persisted.",
  },
  {
    eventName: "pharmacy.choice.session.created",
    eventFamily: "choice",
    producer: "Future 343 choice session creation under the 342 frozen API contract",
    aggregate: "PharmacyChoiceSession",
    summary: "A full visible provider set and advisory frontier were materialized for the case.",
  },
  {
    eventName: "pharmacy.provider.selected",
    eventFamily: "choice",
    producer: "POST /v1/pharmacy/cases/{pharmacyCaseId}:choose-provider",
    aggregate: "PharmacyCase",
    summary: "A provider selection is durably bound to the current choice proof and override posture.",
  },
  {
    eventName: "pharmacy.consent.checkpoint.updated",
    eventFamily: "consent",
    producer: "POST /v1/pharmacy/cases/{pharmacyCaseId}:choose-provider and consent refresh flows",
    aggregate: "PharmacyConsentCheckpoint",
    summary: "The current consent checkpoint was refreshed for provider, pathway, scope, and package lineage.",
  },
  {
    eventName: "pharmacy.package.composed",
    eventFamily: "dispatch",
    producer: "POST /v1/pharmacy/cases/{pharmacyCaseId}:dispatch",
    aggregate: "PharmacyReferralPackage",
    summary: "A canonical referral package was frozen for the selected provider and current scope.",
  },
  {
    eventName: "pharmacy.dispatch.started",
    eventFamily: "dispatch",
    producer: "POST /v1/pharmacy/cases/{pharmacyCaseId}:dispatch",
    aggregate: "PharmacyDispatchAttempt",
    summary: "A fenced dispatch attempt was created under the active route-intent and lease tuple.",
  },
  {
    eventName: "pharmacy.dispatch.confirmed",
    eventFamily: "dispatch",
    producer: "Transport proof and confirmation-gate settlement",
    aggregate: "PharmacyDispatchAttempt",
    summary: "Dispatch proof is sufficient for referral handoff under the active assurance profile.",
  },
  {
    eventName: "pharmacy.dispatch.proof_missing",
    eventFamily: "dispatch",
    producer: "Transport proof deadline and contradiction monitoring",
    aggregate: "PharmacyDispatchAttempt",
    summary: "Dispatch proof is missing, expired, or contradicted under the active assurance profile.",
  },
  {
    eventName: "pharmacy.consent.revoked",
    eventFamily: "consent",
    producer: "Consent withdrawal or provider/pathway/scope drift",
    aggregate: "PharmacyConsentRecord",
    summary: "The current consent row is no longer valid for onward dispatch or calm reassurance.",
  },
  {
    eventName: "pharmacy.consent.revocation.recorded",
    eventFamily: "consent",
    producer: "Post-dispatch revocation handling",
    aggregate: "PharmacyConsentRevocationRecord",
    summary: "A pre-dispatch or post-dispatch consent revocation record was appended.",
  },
  {
    eventName: "pharmacy.outcome.received",
    eventFamily: "outcome",
    producer: "POST /v1/pharmacy/cases/{pharmacyCaseId}:capture-outcome",
    aggregate: "PharmacyOutcomeSettlement",
    summary: "Outcome evidence has been ingested and correlated to the governing pharmacy case.",
  },
  {
    eventName: "pharmacy.outcome.reconciled",
    eventFamily: "outcome",
    producer: "Outcome reconciliation settlement",
    aggregate: "PharmacyOutcomeSettlement",
    summary: "A weak or disputed outcome has been explicitly reconciled to a final branch decision.",
  },
  {
    eventName: "pharmacy.reachability.blocked",
    eventFamily: "reachability",
    producer: "Reachability dependency monitoring",
    aggregate: "PharmacyCase",
    summary: "A no-contact return or urgent routing dependency is blocking ordinary completion.",
  },
  {
    eventName: "pharmacy.reachability.repaired",
    eventFamily: "reachability",
    producer: "Reachability dependency repair",
    aggregate: "PharmacyCase",
    summary: "An active reachability dependency has been explicitly repaired and revalidated.",
  },
  {
    eventName: "pharmacy.case.resolved",
    eventFamily: "closure",
    producer: "Outcome settlement and branch resolution",
    aggregate: "PharmacyCase",
    summary: "The case has been settled strongly enough to enter resolved_by_pharmacy.",
  },
  {
    eventName: "pharmacy.case.bounce_back",
    eventFamily: "closure",
    producer: "Return-to-practice and urgent return routing",
    aggregate: "PharmacyCase",
    summary: "The case has entered a typed bounce-back or return posture instead of calm completion.",
  },
  {
    eventName: "pharmacy.case.reopened",
    eventFamily: "closure",
    producer: "POST /v1/pharmacy/cases/{pharmacyCaseId}:reopen",
    aggregate: "PharmacyCase",
    summary: "The case or originating workflow has been reopened for further action.",
  },
  {
    eventName: "pharmacy.case.closed",
    eventFamily: "closure",
    producer: "POST /v1/pharmacy/cases/{pharmacyCaseId}:close",
    aggregate: "PharmacyCase",
    summary: "LifecycleCoordinator accepted final closure with no remaining blocker debt.",
  },
];

const apiCommands: ApiCommand[] = [
  {
    operationId: "createPharmacyCase",
    method: "POST",
    path: "/v1/pharmacy/cases",
    statePreconditions: [
      "A pharmacy-suitable source decision exists on the current request lineage.",
      "A new or reused pharmacy LineageCaseLink(caseFamily = pharmacy) can be acknowledged without violating lineage fences.",
    ],
    stateExits: ["candidate_received"],
    idempotencyExpectation: "Idempotent on originRequestId + pharmacyIntentId + sourceDecisionEpochRef.",
    failureClasses: ["duplicate_case_conflict", "lineage_fence_violation", "identity_repair_branch_active"],
    lineageAndLeaseChecks: ["Create or reuse lineage child link", "Establish RequestLifecycleLease and ownership epoch"],
    staleWriteBehavior: "Reject and emit stale-owner recovery if the claimed ownership epoch is not current.",
    auditAppends: ["CommandActionRecord", "IdempotencyRecord", "pharmacy.case.created"],
  },
  {
    operationId: "getPharmacyCase",
    method: "GET",
    path: "/v1/pharmacy/cases/{pharmacyCaseId}",
    statePreconditions: ["The caller has a minimum-necessary audience view for the pharmacy case."],
    stateExits: [],
    idempotencyExpectation: "Read-only; no idempotency key required.",
    failureClasses: ["not_found", "visibility_denied"],
    lineageAndLeaseChecks: ["Read the current lineage and blocker posture without mutating state"],
    staleWriteBehavior: "Not applicable; read surfaces must render current blocker and stale posture explicitly.",
    auditAppends: ["Audit read trail where policy requires"],
  },
  {
    operationId: "evaluatePharmacyCase",
    method: "POST",
    path: "/v1/pharmacy/cases/{pharmacyCaseId}:evaluate",
    statePreconditions: [
      "Current status is candidate_received or rules_evaluating.",
      "The active PharmacyRulePack and threshold family registry are resolvable for the evaluation instant.",
    ],
    stateExits: ["rules_evaluating", "ineligible_returned", "eligible_choice_pending"],
    idempotencyExpectation: "Idempotent on pharmacyCaseId + rulePackId + evidenceSnapshotHash.",
    failureClasses: ["illegal_transition", "missing_threshold_family", "pack_mutation_rejected", "stale_write"],
    lineageAndLeaseChecks: ["ScopedMutationGate", "RequestLifecycleLease ownership epoch", "LineageFence current epoch"],
    staleWriteBehavior: "Reject stale writes and keep the case visibly blocked until the current owner reacquires or transfers.",
    auditAppends: ["CommandActionRecord", "PathwayEligibilityEvaluation", "pharmacy.service_type.resolved", "pharmacy.pathway.evaluated"],
  },
  {
    operationId: "choosePharmacyProvider",
    method: "POST",
    path: "/v1/pharmacy/cases/{pharmacyCaseId}:choose-provider",
    statePreconditions: [
      "Current status is eligible_choice_pending or consent_pending.",
      "The selected provider is still present in the current choice proof and any override acknowledgement requirement is satisfied.",
    ],
    stateExits: ["provider_selected", "consent_pending", "package_ready"],
    idempotencyExpectation: "Idempotent on pharmacyCaseId + choiceProofRef + selectionBindingHash.",
    failureClasses: ["illegal_transition", "choice_proof_superseded", "override_ack_missing", "stale_write"],
    lineageAndLeaseChecks: ["ScopedMutationGate", "RequestLifecycleLease ownership epoch", "LineageFence current epoch"],
    staleWriteBehavior: "Reject and preserve the current selected anchor rather than replaying stale recommendations.",
    auditAppends: ["CommandActionRecord", "pharmacy.provider.selected", "pharmacy.consent.checkpoint.updated"],
  },
  {
    operationId: "dispatchPharmacyReferral",
    method: "POST",
    path: "/v1/pharmacy/cases/{pharmacyCaseId}:dispatch",
    statePreconditions: [
      "Current status is package_ready or consent_pending.",
      "The current PharmacyConsentCheckpoint.checkpointState is satisfied at command time.",
    ],
    stateExits: ["dispatch_pending", "referred", "consent_pending"],
    idempotencyExpectation: "Idempotent on pharmacyCaseId + packageFingerprint + dispatchPlanHash + routeIntentTupleHash.",
    failureClasses: ["consent_invalid", "route_intent_drift", "confirmation_gate_open", "stale_write"],
    lineageAndLeaseChecks: ["ScopedMutationGate", "RequestLifecycleLease ownership epoch", "LineageFence current epoch", "RouteIntent binding"],
    staleWriteBehavior: "Reject and force same-shell consent or package renewal when the current tuple no longer matches.",
    auditAppends: ["CommandActionRecord", "pharmacy.package.composed", "pharmacy.dispatch.started", "pharmacy.dispatch.confirmed or pharmacy.dispatch.proof_missing"],
  },
  {
    operationId: "capturePharmacyOutcome",
    method: "POST",
    path: "/v1/pharmacy/cases/{pharmacyCaseId}:capture-outcome",
    statePreconditions: [
      "Current status is referred, consultation_outcome_pending, or outcome_reconciliation_pending.",
      "The governing dispatch tuple and continuity evidence remain current for the case.",
    ],
    stateExits: [
      "consultation_outcome_pending",
      "outcome_reconciliation_pending",
      "resolved_by_pharmacy",
      "unresolved_returned",
      "urgent_bounce_back",
      "no_contact_return_pending",
    ],
    idempotencyExpectation: "Idempotent on pharmacyCaseId + outcomeEvidenceHash + sourceCorrelationTupleHash.",
    failureClasses: ["dispatch_tuple_drift", "outcome_match_ambiguous", "illegal_transition", "stale_write"],
    lineageAndLeaseChecks: ["ScopedMutationGate", "RequestLifecycleLease ownership epoch", "LineageFence current epoch"],
    staleWriteBehavior: "Reject stale owner writes and materialize explicit review or recovery posture instead of mutating silently.",
    auditAppends: ["CommandActionRecord", "pharmacy.outcome.received", "pharmacy.outcome.reconciled or pharmacy.case.bounce_back"],
  },
  {
    operationId: "reopenPharmacyCase",
    method: "POST",
    path: "/v1/pharmacy/cases/{pharmacyCaseId}:reopen",
    statePreconditions: [
      "Current status is unresolved_returned, urgent_bounce_back, no_contact_return_pending, or outcome_reconciliation_pending.",
      "Any reopened branch binds back to the same RequestLineage and current pharmacy child link.",
    ],
    stateExits: ["candidate_received", "rules_evaluating", "consent_pending"],
    idempotencyExpectation: "Idempotent on pharmacyCaseId + reopenReasonHash + ownershipEpoch.",
    failureClasses: ["illegal_transition", "closure_blocker_open", "stale_write"],
    lineageAndLeaseChecks: ["ScopedMutationGate", "RequestLifecycleLease ownership epoch", "LineageFence current epoch", "LifecycleCoordinator close veto"],
    staleWriteBehavior: "Reject and emit stale-owner recovery instead of reopening under a superseded epoch.",
    auditAppends: ["CommandActionRecord", "pharmacy.case.reopened"],
  },
  {
    operationId: "closePharmacyCase",
    method: "POST",
    path: "/v1/pharmacy/cases/{pharmacyCaseId}:close",
    statePreconditions: [
      "Current status is resolved_by_pharmacy.",
      "currentConfirmationGateRefs, currentClosureBlockerRefs, and activeReachabilityDependencyRefs are all empty or settled.",
    ],
    stateExits: ["closed"],
    idempotencyExpectation: "Idempotent on pharmacyCaseId + closureDecisionHash + ownershipEpoch.",
    failureClasses: ["illegal_transition", "closure_blocker_open", "reachability_dependency_open", "stale_write"],
    lineageAndLeaseChecks: ["ScopedMutationGate", "RequestLifecycleLease ownership epoch", "LifecycleCoordinator approval", "LineageFence current epoch"],
    staleWriteBehavior: "Reject stale close attempts and keep closure blockers visible until authoritative settlement.",
    auditAppends: ["CommandActionRecord", "RequestClosureRecord", "pharmacy.case.closed"],
  },
];

const pharmacyCaseFields: FieldDef[] = [
  {
    name: "pharmacyCaseId",
    schema: primitiveString("Stable pharmacy case identifier."),
    description: "Stable identifier for the governed pharmacy branch.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["346", "347", "343", "344"],
  },
  {
    name: "episodeRef",
    schema: typedRefSchema("Episode", "seq_342", "Episode anchor for the case.", false),
    description: "Episode anchor for the case.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["346"],
  },
  {
    name: "originRequestId",
    schema: primitiveString("Originating request identifier."),
    description: "Originating request identifier from the canonical Request aggregate.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["346", "345"],
  },
  {
    name: "requestLineageRef",
    schema: typedRefSchema("RequestLineage", "seq_342", "Canonical request-lineage reference.", false),
    description: "Canonical request-lineage reference.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#RequestLineage",
    downstreamDependents: ["346", "343", "344"],
  },
  {
    name: "lineageCaseLinkRef",
    schema: typedRefSchema("LineageCaseLink", "seq_342", "Pharmacy child lineage link reference.", false),
    description: "Pharmacy child lineage link reference.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["346", "345"],
  },
  {
    name: "originTaskId",
    schema: primitiveString("Originating task identifier."),
    description: "The upstream task or workflow that produced the pharmacy branch candidate.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Canonical objects",
    downstreamDependents: ["346"],
  },
  {
    name: "pharmacyIntentId",
    schema: primitiveString("Reference to the preserved Phase 3 or gateway pharmacy intent."),
    description: "Reference to the preserved pre-case pharmacy intent record.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["346", "migration"],
  },
  {
    name: "sourceDecisionEpochRef",
    schema: typedRefSchema("DecisionEpoch", "seq_342", "Source clinical-decision epoch reference.", false),
    description: "Source clinical-decision epoch reference.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#DecisionEpoch",
    downstreamDependents: ["346", "347"],
  },
  {
    name: "sourceDecisionSupersessionRef",
    schema: typedRefSchema("DecisionSupersession", "seq_342", "Supersession evidence for the source decision.", true),
    description: "Supersession evidence for the source decision when present.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["346"],
  },
  {
    name: "patientRef",
    schema: typedRefSchema("Patient", "seq_342", "Patient anchor.", false),
    description: "Patient anchor for the pharmacy case.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#Patient",
    downstreamDependents: ["346", "344"],
  },
  {
    name: "tenantId",
    schema: primitiveString("Tenant identifier."),
    description: "Tenant identifier for isolation and routing.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#TenantIsolation",
    downstreamDependents: ["346", "345"],
  },
  {
    name: "serviceType",
    schema: {
      type: "string",
      enum: ["clinical_pathway_consultation", "minor_illness_fallback"],
    },
    description: "Resolved pharmacy service lane.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory eligibility and policy-pack contract",
    downstreamDependents: ["347", "343"],
  },
  {
    name: "candidatePathway",
    schema: {
      oneOf: [
        { type: "string", enum: [...pathways.map((pathway) => pathway.pathwayCode), "minor_illness_fallback"] },
        { type: "null" },
      ],
    },
    description: "Current candidate pathway or fallback lane selected by eligibility.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory eligibility and policy-pack contract",
    downstreamDependents: ["347", "343"],
  },
  {
    name: "eligibilityRef",
    schema: typedRefSchema("PathwayEligibilityEvaluation", "seq_342", "Current eligibility evaluation record.", true),
    description: "Current eligibility evaluation record.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["347", "343"],
  },
  {
    name: "choiceSessionRef",
    schema: typedRefSchema("PharmacyChoiceSession", later343Owner, "Later-owned provider choice session reference.", true),
    description: "Later-owned provider choice session reference reserved for seq_343.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Interface boundaries",
    downstreamDependents: ["343", "348", "351"],
  },
  {
    name: "selectedProviderRef",
    schema: typedRefSchema("PharmacyProvider", later343Owner, "Later-owned selected provider reference.", true),
    description: "Later-owned selected provider reference reserved for seq_343.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Interface boundaries",
    downstreamDependents: ["343", "348", "349", "350", "351"],
  },
  {
    name: "activeConsentRef",
    schema: typedRefSchema("PharmacyConsentRecord", later343Owner, "Later-owned consent record reference.", true),
    description: "Later-owned consent record reference reserved for seq_343.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Interface boundaries",
    downstreamDependents: ["343", "349", "350"],
  },
  {
    name: "activeConsentCheckpointRef",
    schema: typedRefSchema("PharmacyConsentCheckpoint", later343Owner, "Later-owned consent checkpoint reference.", true),
    description: "Later-owned consent checkpoint reference reserved for seq_343.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Interface boundaries",
    downstreamDependents: ["343", "349", "350", "351"],
  },
  {
    name: "latestConsentRevocationRef",
    schema: typedRefSchema("PharmacyConsentRevocationRecord", later343Owner, "Latest consent revocation reference.", true),
    description: "Latest consent revocation reference reserved for seq_343.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["343", "350", "351"],
  },
  {
    name: "activeDispatchAttemptRef",
    schema: typedRefSchema("PharmacyDispatchAttempt", later343Owner, "Current dispatch attempt reference.", true),
    description: "Current dispatch attempt reference reserved for seq_343.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Interface boundaries",
    downstreamDependents: ["343", "349", "350", "352"],
  },
  {
    name: "correlationRef",
    schema: typedRefSchema("CorrelationRecord", later343Owner, "Current dispatch or outcome correlation reference.", true),
    description: "Current dispatch or outcome correlation reference reserved for seq_343.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#CorrelationRecord",
    downstreamDependents: ["343", "352"],
  },
  {
    name: "outcomeRef",
    schema: typedRefSchema("PharmacyOutcomeSettlement", later343Owner, "Current authoritative outcome settlement reference.", true),
    description: "Current authoritative outcome settlement reference reserved for seq_343.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Interface boundaries",
    downstreamDependents: ["343", "352", "344"],
  },
  {
    name: "bounceBackRef",
    schema: typedRefSchema("PharmacyBounceBackRecord", later344Owner, "Current bounce-back or urgent-return reference.", true),
    description: "Current bounce-back or urgent-return reference reserved for seq_344.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Interface boundaries",
    downstreamDependents: ["344", "353"],
  },
  {
    name: "leaseRef",
    schema: typedRefSchema("RequestLifecycleLease", "seq_342", "Active lifecycle lease reference.", false),
    description: "Active lifecycle lease reference.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#RequestLifecycleLease",
    downstreamDependents: ["346"],
  },
  {
    name: "ownershipEpoch",
    schema: { type: "integer", minimum: 0 },
    description: "Current ownership epoch used for fenced mutations.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#ScopedMutationGate",
    downstreamDependents: ["346", "350", "352", "353"],
  },
  {
    name: "staleOwnerRecoveryRef",
    schema: typedRefSchema("StaleOwnershipRecoveryRecord", "seq_342", "Stale owner recovery reference.", true),
    description: "Stale owner recovery reference.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#StaleOwnershipRecoveryRecord",
    downstreamDependents: ["346", "354"],
  },
  {
    name: "lineageFenceRef",
    schema: typedRefSchema("LineageFence", "seq_342", "Current lineage fence reference.", false),
    description: "Current lineage fence reference.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#LineageFence",
    downstreamDependents: ["346", "350", "352", "353"],
  },
  {
    name: "currentConfirmationGateRefs",
    schema: typedRefArraySchema("ExternalConfirmationGate", later343Owner, "Current confirmation gate references."),
    description: "Current confirmation gate references reserved for seq_343 detail.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Canonical objects",
    downstreamDependents: ["343", "350", "352", "345"],
  },
  {
    name: "currentClosureBlockerRefs",
    schema: typedRefArraySchema("ClosureBlocker", later344Owner, "Current closure blocker references."),
    description: "Current closure blocker references including outcome, urgent-return, and practice-visibility debt.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#LifecycleCoordinator",
    downstreamDependents: ["344", "345", "346"],
  },
  {
    name: "activeReachabilityDependencyRefs",
    schema: typedRefArraySchema("ReachabilityDependency", later344Owner, "Current reachability dependency references."),
    description: "Current reachability dependency references reserved for seq_344 detail.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#ReachabilityDependencies",
    downstreamDependents: ["344", "351", "353", "345"],
  },
  {
    name: "activeIdentityRepairCaseRef",
    schema: typedRefSchema("IdentityRepairCase", "seq_342", "Active identity repair case reference.", true),
    description: "Active identity repair case reference.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#IdentityRepair",
    downstreamDependents: ["346", "345"],
  },
  {
    name: "identityRepairBranchDispositionRef",
    schema: typedRefSchema("IdentityRepairBranchDisposition", "seq_342", "Identity-repair branch disposition reference.", true),
    description: "Identity-repair branch disposition reference.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#IdentityRepair",
    downstreamDependents: ["346", "352", "353"],
  },
  {
    name: "identityRepairReleaseSettlementRef",
    schema: typedRefSchema("IdentityRepairReleaseSettlement", "seq_342", "Identity-repair release settlement reference.", true),
    description: "Identity-repair release settlement reference.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#IdentityRepair",
    downstreamDependents: ["346", "345"],
  },
  {
    name: "status",
    schema: { type: "string", enum: states.map((state) => state.stateId) },
    description: "Current PharmacyCase.status value.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory state machine contract",
    downstreamDependents: ["346", "351", "353", "345"],
  },
  {
    name: "slaTargetAt",
    schema: isoDateTime("Current SLA target timestamp."),
    description: "Current SLA target timestamp derived from the governing service lane and urgency posture.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["346", "354", "355"],
  },
  {
    name: "createdAt",
    schema: isoDateTime("Creation timestamp."),
    description: "Creation timestamp.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#Audit",
    downstreamDependents: ["346", "345"],
  },
  {
    name: "updatedAt",
    schema: isoDateTime("Last update timestamp."),
    description: "Last update timestamp.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "phase-0-the-foundation-protocol.md#Audit",
    downstreamDependents: ["346", "345"],
  },
];

const serviceTypeDecisionFields: FieldDef[] = [
  {
    name: "decisionId",
    schema: primitiveString("ServiceTypeDecision identifier."),
    description: "ServiceTypeDecision identifier.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["347"],
  },
  {
    name: "pharmacyCaseRef",
    schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false),
    description: "Owning pharmacy case.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["346", "347"],
  },
  {
    name: "lane",
    schema: {
      type: "string",
      enum: ["clinical_pathway_consultation", "minor_illness_fallback", "non_pharmacy_return"],
    },
    description: "Resolved service lane.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory eligibility and policy-pack contract",
    downstreamDependents: ["347"],
  },
  {
    name: "candidatePathways",
    schema: { type: "array", items: { type: "string", enum: pathways.map((pathway) => pathway.pathwayCode) } },
    description: "Candidate clinical pathways considered for the case.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["347"],
  },
  {
    name: "gatewayResult",
    schema: { type: "string", enum: ["pharmacy_candidate", "non_pharmacy_return"] },
    description: "High-level gateway result for pharmacy entry.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["347"],
  },
  {
    name: "exclusionFlags",
    schema: { type: "array", items: primitiveString("Exclusion flag code.") },
    description: "Exclusion flags resolved before pathway scoring.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["347"],
  },
  {
    name: "redFlagState",
    schema: { type: "string", enum: ["none", "watch", "global_block"] },
    description: "Global red-flag state for the candidate.",
    mutability: "system_only",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347"],
  },
  {
    name: "evidenceSufficiency",
    schema: { type: "number", minimum: 0, maximum: 1 },
    description: "Summary evidence sufficiency score before pathway selection.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["347"],
  },
  {
    name: "decisionConfidence",
    schema: { type: "number", minimum: 0, maximum: 1 },
    description: "Confidence in the lane decision.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["347"],
  },
  {
    name: "rulePackVersion",
    schema: primitiveString("Rule pack version used at decision time."),
    description: "Rule pack version used at decision time.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["347", "replay"],
  },
];

const eligibilityFields: FieldDef[] = [
  {
    name: "evaluationId",
    schema: primitiveString("PathwayEligibilityEvaluation identifier."),
    description: "PathwayEligibilityEvaluation identifier.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "pharmacyCaseRef",
    schema: typedRefSchema("PharmacyCase", "seq_342", "Owning pharmacy case.", false),
    description: "Owning pharmacy case.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6A",
    downstreamDependents: ["346", "347"],
  },
  {
    name: "rulePackRef",
    schema: typedRefSchema("PharmacyRulePack", "seq_342", "Resolved immutable rule-pack reference.", false),
    description: "Resolved immutable rule-pack reference.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "pathwayCode",
    schema: {
      oneOf: [
        { type: "string", enum: pathways.map((pathway) => pathway.pathwayCode) },
        { type: "null" },
      ],
    },
    description: "Selected clinical pathway code when a named pathway is being evaluated.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "343"],
  },
  {
    name: "evaluatedPathways",
    schema: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "pathwayCode",
          "ageSexGatePass",
          "requiredSymptomSupport",
          "evidenceCompleteness",
          "pathwayExclusionScore",
          "globalExclusionScore",
          "contradictionScore",
          "eligibilityConfidence",
          "hardFailReasonCodes",
        ],
        properties: {
          pathwayCode: {
            type: "string",
            enum: pathways.map((pathway) => pathway.pathwayCode),
          },
          ageSexGatePass: { type: "boolean" },
          requiredSymptomSupport: { type: "number", minimum: 0, maximum: 1 },
          evidenceCompleteness: { type: "number", minimum: 0, maximum: 1 },
          pathwayExclusionScore: { type: "number", minimum: 0, maximum: 1 },
          globalExclusionScore: { type: "number", minimum: 0, maximum: 1 },
          contradictionScore: { type: "number", minimum: 0, maximum: 1 },
          eligibilityConfidence: { type: "number", minimum: 0, maximum: 1 },
          hardFailReasonCodes: {
            type: "array",
            items: primitiveString("Hard-fail reason code."),
          },
        },
      },
    },
    description: "Per-pathway replay snapshot for all named pathways considered at evaluation time.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory eligibility and policy-pack contract",
    downstreamDependents: ["347", "replay", "golden_case_regression"],
  },
  {
    name: "matchedRuleIds",
    schema: {
      type: "array",
      items: primitiveString("Matched rule identifier."),
    },
    description: "Matched rule identifiers persisted with the replayable evaluation record.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "staff_explainer", "replay"],
  },
  {
    name: "thresholdSnapshot",
    schema: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["thresholdId", "serializedValue"],
        properties: {
          thresholdId: {
            type: "string",
            enum: thresholdFamilies.map((threshold) => threshold.thresholdId),
          },
          serializedValue: primitiveString("Serialized threshold or weight-set value."),
        },
      },
    },
    description: "Frozen threshold and exponent snapshot used for historical replay.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory rule-pack versioning rules",
    downstreamDependents: ["347", "replay", "assurance"],
  },
  {
    name: "rulePackVersion",
    schema: primitiveString("Frozen rule-pack version used at evaluation time."),
    description: "Frozen rule-pack version used at evaluation time.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "ageSexGateResult",
    schema: { type: "string", enum: ["pass", "fail"] },
    description: "Outcome of the hard age and sex gate.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "staff_explainer"],
  },
  {
    name: "pathwayGateResult",
    schema: { type: "string", enum: ["eligible", "hard_failed", "fallback_only", "global_blocked"] },
    description: "Pathway gate result after thresholds and exclusions.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "patient_explainer"],
  },
  {
    name: "exclusionMatches",
    schema: { type: "array", items: primitiveString("Matched exclusion rule identifier.") },
    description: "Matched pathway-specific exclusions.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "safety_review"],
  },
  {
    name: "pathwayExclusionScore",
    schema: { type: "number", minimum: 0, maximum: 1 },
    description: "Computed s_excl(p,x) value.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "staff_explainer"],
  },
  {
    name: "globalExclusionScore",
    schema: { type: "number", minimum: 0, maximum: 1 },
    description: "Computed s_global(x) value.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "staff_explainer", "patient_explainer"],
  },
  {
    name: "requiredSymptomSupport",
    schema: { type: "number", minimum: 0, maximum: 1 },
    description: "Computed s_req(p,x) value.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "staff_explainer"],
  },
  {
    name: "evidenceCompleteness",
    schema: { type: "number", minimum: 0, maximum: 1 },
    description: "Computed s_comp(p,x) value.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "staff_explainer"],
  },
  {
    name: "contradictionScore",
    schema: { type: "number", minimum: 0, maximum: 1 },
    description: "Computed s_contra(p,x) value.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "staff_explainer"],
  },
  {
    name: "eligibilityConfidence",
    schema: { type: "number", minimum: 0, maximum: 1 },
    description: "Computed eligibilityConfidence(p,x) value.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "343", "staff_explainer"],
  },
  {
    name: "recommendedLane",
    schema: {
      type: "string",
      enum: ["clinical_pathway_consultation", "minor_illness_fallback", "non_pharmacy_return"],
    },
    description: "Recommended lane after pathway and fallback evaluation.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "343"],
  },
  {
    name: "finalDisposition",
    schema: {
      type: "string",
      enum: ["eligible_choice_pending", "minor_illness_fallback", "ineligible_returned"],
    },
    description: "Final eligibility disposition emitted by the evaluation record.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "343", "replay"],
  },
  {
    name: "unsafeFallbackReasonCode",
    schema: {
      oneOf: [
        primitiveString("Reason code explaining why fallback was blocked or unsafe."),
        { type: "null" },
      ],
    },
    description: "Reason code explaining why fallback was blocked or unsafe when applicable.",
    mutability: "derived",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory gap closures",
    downstreamDependents: ["347", "patient_explainer"],
  },
  {
    name: "explanationBundleRef",
    schema: typedRefSchema("EligibilityExplanationBundle", "seq_342", "Eligibility explanation bundle reference.", false),
    description: "Eligibility explanation bundle reference.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "patient_explainer", "staff_explainer"],
  },
];

const pathwayDefinitionFields: FieldDef[] = [
  {
    name: "pathwayCode",
    schema: { type: "string", enum: pathways.map((pathway) => pathway.pathwayCode) },
    description: "Pathway code.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "displayName",
    schema: primitiveString("Display name."),
    description: "Display name.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "staff_explainer", "patient_explainer"],
  },
  {
    name: "ageSexGate",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["ageMinYears", "sexGate"],
      properties: {
        ageMinYears: { type: "integer", minimum: 0 },
        ageMaxYears: { oneOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
        sexGate: { type: "string", enum: ["any", "female_only"] },
      },
    },
    description: "Hard age and sex gate.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "requiredSymptoms",
    schema: { type: "array", items: primitiveString("Required symptom code.") },
    description: "Required symptom set.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "golden_case_regression"],
  },
  {
    name: "requiredSymptomWeights",
    schema: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["symptomCode", "thresholdFamilyId"],
        properties: {
          symptomCode: primitiveString("Symptom code."),
          thresholdFamilyId: { type: "string", const: "alpha_required_symptom_weight" },
        },
      },
    },
    description: "Required symptom weights bound to the threshold family registry.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "exclusionRules",
    schema: { type: "array", items: primitiveString("Pathway-specific exclusion rule code.") },
    description: "Pathway-specific exclusion rules.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "safety_review"],
  },
  {
    name: "redFlagRules",
    schema: { type: "array", items: primitiveString("Pathway-specific red-flag rule code.") },
    description: "Pathway-specific red-flag rules.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "safety_review"],
  },
  {
    name: "minorIllnessFallbackRules",
    schema: { type: "array", items: primitiveString("Fallback rule code.") },
    description: "Minor-illness fallback rules that apply only after pathway-specific failure.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory gap closures",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "timingGuardrailRef",
    schema: typedRefSchema("PathwayTimingGuardrail", "seq_342", "Timing guardrail reference.", false),
    description: "Timing guardrail reference.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "343"],
  },
  {
    name: "allowedEscalationModes",
    schema: { type: "array", items: primitiveString("Allowed escalation mode.") },
    description: "Allowed escalation modes.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "344"],
  },
  {
    name: "supplyModes",
    schema: { type: "array", items: primitiveString("Supply mode.") },
    description: "Supply modes allowed under the pathway definition.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "patient_explainer"],
  },
];

const timingGuardrailFields: FieldDef[] = [
  {
    name: "guardrailId",
    schema: primitiveString("Guardrail identifier."),
    description: "Guardrail identifier.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "343"],
  },
  {
    name: "rulePackVersion",
    schema: primitiveString("Owning rule-pack version."),
    description: "Owning rule-pack version.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "pathwayCode",
    schema: { type: "string", enum: pathways.map((pathway) => pathway.pathwayCode) },
    description: "Bound pathway code.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "343"],
  },
  {
    name: "materialityLevel",
    schema: { type: "string", enum: ["high", "medium", "low"] },
    description: "Materiality level.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["343", "351"],
  },
  {
    name: "maxRecommendedDelayMinutes",
    schema: { type: "integer", minimum: 0 },
    description: "Maximum recommended delay in minutes.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["343"],
  },
  {
    name: "maxAllowedDelayMinutes",
    schema: { type: "integer", minimum: 0 },
    description: "Maximum allowed delay in minutes.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["343", "344"],
  },
  {
    name: "latestSafeOpeningDeltaMinutes",
    schema: { type: "integer", minimum: 0 },
    description: "Latest safe opening delta in minutes.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["343"],
  },
  {
    name: "suppressionPolicy",
    schema: {
      type: "string",
      enum: ["warn_only", "suppress_from_recommended_frontier", "suppress_unsafe", "return_to_practice"],
    },
    description: "How timing risk changes visible choice posture.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["343", "351"],
  },
  {
    name: "warningCopyRef",
    schema: primitiveString("Warning copy reference."),
    description: "Warning copy reference.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["343", "351"],
  },
];

const rulePackFields: FieldDef[] = [
  {
    name: "rulePackId",
    schema: primitiveString("Rule-pack identifier."),
    description: "Immutable pharmacy rule-pack identifier.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "replay", "assurance"],
  },
  {
    name: "effectiveFrom",
    schema: isoDateTime("Effective-from timestamp."),
    description: "Effective-from timestamp.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory rule-pack versioning rules",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "effectiveTo",
    schema: { oneOf: [isoDateTime("Effective-to timestamp."), { type: "null" }] },
    description: "Effective-to timestamp or null when still active.",
    mutability: "mutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory rule-pack versioning rules",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "serviceSpecVersion",
    schema: primitiveString("Service specification alignment version."),
    description: "Service specification alignment version.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory eligibility and policy-pack contract",
    downstreamDependents: ["347", "assurance"],
  },
  {
    name: "pathwayDefinitions",
    schema: { type: "array" },
    description: "Pathway definitions bound into the pack.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "minorIllnessPolicy",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["entryCondition", "fallbackScoreFormula", "thresholdFamilyRefs"],
      properties: {
        entryCondition: primitiveString("Condition under which fallback may start."),
        fallbackScoreFormula: primitiveString("Frozen fallback score formula identifier."),
        thresholdFamilyRefs: { type: "array", items: { type: "string", enum: ["xi_minor_feature_weight", "tau_minor_eligible"] } },
      },
    },
    description: "Minor-illness fallback policy.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "eligibilityThresholds",
    schema: { type: "array", items: { type: "string", enum: thresholdFamilies.map((family) => family.thresholdId) } },
    description: "Eligibility threshold families attached to the pack.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory evaluation algorithm",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "reconciliationThresholds",
    schema: { type: "array", items: primitiveString("Future outcome reconciliation threshold family identifier.") },
    description: "Reserved threshold hooks for later-owned outcome reconciliation, versioned with the same pack.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Interface boundaries",
    downstreamDependents: ["343", "347"],
  },
  {
    name: "globalExclusions",
    schema: { type: "array", items: primitiveString("Global exclusion rule code.") },
    description: "Global exclusion rules.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "safety_review"],
  },
  {
    name: "redFlagBridges",
    schema: { type: "array", items: primitiveString("Red-flag bridge rule code.") },
    description: "Global red-flag bridge rules.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "safety_review"],
  },
  {
    name: "timingGuardrails",
    schema: { type: "array" },
    description: "Timing guardrails bound to the pack.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "343"],
  },
  {
    name: "displayTextRefs",
    schema: { type: "array", items: primitiveString("Display text reference.") },
    description: "Versioned display text references for explanation bundles.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory rule-pack versioning rules",
    downstreamDependents: ["347", "patient_explainer", "staff_explainer"],
  },
  {
    name: "immutabilityState",
    schema: { type: "string", const: "immutable_once_promoted" },
    description: "Pack immutability posture after promotion.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory rule-pack versioning rules",
    downstreamDependents: ["347", "assurance"],
  },
  {
    name: "promotionPolicy",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["goldenCaseRegressionRequired", "hazardTraceabilityRequired", "inPlaceMutationForbidden"],
      properties: {
        goldenCaseRegressionRequired: { type: "boolean", const: true },
        hazardTraceabilityRequired: { type: "boolean", const: true },
        inPlaceMutationForbidden: { type: "boolean", const: true },
      },
    },
    description: "Promotion policy embedded into the pack contract.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory rule-pack versioning rules",
    downstreamDependents: ["347", "assurance"],
  },
];

const explanationBundleFields: FieldDef[] = [
  {
    name: "bundleId",
    schema: primitiveString("EligibilityExplanationBundle identifier."),
    description: "EligibilityExplanationBundle identifier.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "patient_explainer", "staff_explainer"],
  },
  {
    name: "evaluationRef",
    schema: typedRefSchema("PathwayEligibilityEvaluation", "seq_342", "Owning evaluation reference.", false),
    description: "Owning evaluation reference.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "patientFacingReason",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summaryText", "nextStepText", "macroState"],
      properties: {
        summaryText: primitiveString("Patient summary text."),
        nextStepText: primitiveString("Patient next-step text."),
        macroState: {
          type: "string",
          enum: ["choose_or_confirm", "action_in_progress", "reviewing_next_steps", "completed", "urgent_action"],
        },
      },
    },
    description: "Patient-facing explanation surface derived from the same evaluation.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "patient_explainer", "344"],
  },
  {
    name: "staffFacingReason",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summaryText", "matchedRuleIds", "thresholdSnapshot"],
      properties: {
        summaryText: primitiveString("Staff summary text."),
        matchedRuleIds: { type: "array", items: primitiveString("Matched rule ID.") },
        thresholdSnapshot: { type: "array", items: primitiveString("Threshold family snapshot reference.") },
      },
    },
    description: "Staff-facing explanation surface derived from the same evaluation.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "staff_explainer"],
  },
  {
    name: "matchedRules",
    schema: { type: "array", items: primitiveString("Matched rule identifier.") },
    description: "Matched rule identifiers.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Canonical objects",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "nextBestEndpointSuggestion",
    schema: primitiveString("Next-best endpoint suggestion."),
    description: "Next-best endpoint suggestion when pharmacy is unsuitable.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "patient_explainer"],
  },
  {
    name: "sharedEvidenceHash",
    schema: primitiveString("Shared evaluation evidence hash."),
    description: "Shared evaluation evidence hash that binds patient and staff explanations to the same underlying evaluation.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "prompt/342.md#Mandatory gap closures",
    downstreamDependents: ["347", "replay"],
  },
  {
    name: "generatedAt",
    schema: isoDateTime("Generation timestamp."),
    description: "Generation timestamp.",
    mutability: "immutable",
    ownerTask: "seq_342",
    sourceSection: "phase-6-the-pharmacy-loop.md#6B",
    downstreamDependents: ["347", "replay"],
  },
];

const pharmacyCaseSchema = buildObjectSchema(
  "PharmacyCase",
  "Canonical Phase 6 pharmacy case aggregate freeze. Detailed provider choice, dispatch, outcome, bounce-back, and visibility payloads remain later-owned but their typed references are already frozen here.",
  pharmacyCaseFields,
  {
    "x-vecells-task-id": TASK_ID,
    "x-vecells-contract-version": CONTRACT_VERSION,
    "x-vecells-closure-authority": "LifecycleCoordinator",
    "x-vecells-embedded-field-registry": true,
    $defs: {
      ServiceTypeDecision: buildObjectSchema(
        "ServiceTypeDecision",
        "Resolved service-lane and candidate pathway decision.",
        serviceTypeDecisionFields,
      ),
      PathwayEligibilityEvaluation: buildObjectSchema(
        "PathwayEligibilityEvaluation",
        "Replayable pathway evaluation record.",
        eligibilityFields,
      ),
    },
  },
);

const rulePackSchema = buildObjectSchema(
  "PharmacyRulePack",
  "Immutable, effective-dated, replayable rule pack for Phase 6 pharmacy eligibility and timing decisions.",
  rulePackFields,
  {
    "x-vecells-task-id": TASK_ID,
    "x-vecells-contract-version": CONTRACT_VERSION,
    "x-vecells-in-place-mutation-forbidden": true,
    "x-vecells-golden-case-regression-required": true,
    $defs: {
      PathwayDefinition: buildObjectSchema(
        "PathwayDefinition",
        "Clinical pathway definition frozen by seq_342.",
        pathwayDefinitionFields,
      ),
      PathwayTimingGuardrail: buildObjectSchema(
        "PathwayTimingGuardrail",
        "Timing and safety envelope frozen by seq_342.",
        timingGuardrailFields,
      ),
    },
  },
);

const explanationBundleSchema = buildObjectSchema(
  "EligibilityExplanationBundle",
  "Shared patient-facing and staff-facing explanation contract derived from the same eligibility evaluation.",
  explanationBundleFields,
  {
    "x-vecells-task-id": TASK_ID,
    "x-vecells-contract-version": CONTRACT_VERSION,
  },
);

const stateMachine = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  aggregate: "PharmacyCase",
  closureAuthority: "LifecycleCoordinator",
  stateVocabularyLock: "additive_only",
  states,
  transitions,
  prohibitedTransitionLaw:
    "Transitions not listed in this machine are illegal unless added later as additive extensions with explicit source-backed justification.",
  blockerFamilies: [
    "identity_repair_freeze",
    "stale_owner_recovery",
    "pack_mutation_rejected",
    "illegal_fallback_bypass",
    "choice_proof_superseded",
    "provider_capability_stale",
    "consent_invalid",
    "selection_binding_drift",
    "package_lineage_mismatch",
    "confirmation_gate_open",
    "dispatch_proof_disputed",
    "dispatch_tuple_drift",
    "outcome_reconciliation_gate_open",
    "urgent_route_unacknowledged",
    "reachability_dependency_open",
    "closure_blocker_open",
  ],
};

const eventRegistry = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  eventVocabularyLock: "rename_or_replace_forbidden",
  events,
};

const apiSurface = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  basePath: "/v1/pharmacy/cases",
  commandSurfaces: apiCommands,
};

const pathwayRegistry = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  namedPathwaySetVersion: "nhs-pharmacy-first-pathways.2025-09-23",
  serviceLanes: [
    {
      laneId: "clinical_pathway_consultation",
      summary: "Named NHS Pharmacy First clinical pathways for the current seven-condition production set.",
    },
    {
      laneId: "minor_illness_fallback",
      summary:
        "Broader low-acuity or minor-illness handling allowed only when all named pathways failed for pathway-specific reasons and no global block applies.",
    },
  ],
  pathways,
  minorIllnessFallback: {
    entryCondition:
      "Only available when no clinical pathway remains eligible, s_global(x) < tau_global_block, and every rejected clinical pathway failed for pathway-specific reasons only.",
    fallbackScoreFormula: "product_h max(epsilon, m_h(x))^{xi_h}",
    thresholdFamilyRefs: ["xi_minor_feature_weight", "tau_minor_eligible"],
    prohibitedBypass:
      "Minor-illness fallback may not silently bypass global exclusion, hard age/sex failure, or contradiction thresholds.",
  },
};

const thresholdRegistry = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  registryPurpose:
    "All threshold families, exponents, and weight vectors are versioned data inside PharmacyRulePack. Local code defaults are forbidden.",
  thresholdFamilies,
  replayLaw: {
    activePacksImmutable: true,
    inPlaceMutationForbidden: true,
    effectiveDatingRequired: true,
    historicalReplayRequired: true,
    goldenCaseRegressionRequired: true,
    thresholdSetsVersionedTogetherWith: [
      "pathwayDefinitions",
      "timingGuardrails",
      "explanationStrings",
      "minorIllnessPolicy",
    ],
  },
};

const rulePackExample = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  examplePack: {
    rulePackId: "RPK_P6_2025_09_23_V1",
    effectiveFrom: "2025-09-23T00:00:00Z",
    effectiveTo: null,
    serviceSpecVersion: "nhs-pharmacy-first-service.2025-09-23",
    pathwayDefinitions: pathways.map((pathway) => ({
      pathwayCode: pathway.pathwayCode,
      displayName: pathway.displayName,
      ageSexGate: {
        ageMinYears: pathway.ageMin,
        ageMaxYears: pathway.ageMax ?? null,
        sexGate: pathway.sexGate,
      },
      requiredSymptoms: [
        `${pathway.pathwayCode}.core_symptom_a`,
        `${pathway.pathwayCode}.core_symptom_b`,
      ],
      requiredSymptomWeights: [
        { symptomCode: `${pathway.pathwayCode}.core_symptom_a`, thresholdFamilyId: "alpha_required_symptom_weight" },
        { symptomCode: `${pathway.pathwayCode}.core_symptom_b`, thresholdFamilyId: "alpha_required_symptom_weight" },
      ],
      exclusionRules: [`${pathway.pathwayCode}.exclusion_primary`],
      redFlagRules: [`${pathway.pathwayCode}.red_flag_primary`],
      minorIllnessFallbackRules: [`${pathway.pathwayCode}.fallback_allowed_if_pathway_specific_failure_only`],
      timingGuardrailRef: {
        targetFamily: "PathwayTimingGuardrail",
        refId: pathway.timingGuardrailCode,
        ownerTask: "seq_342",
      },
      allowedEscalationModes: pathway.allowedEscalationModes,
      supplyModes: pathway.supplyModes,
    })),
    minorIllnessPolicy: {
      entryCondition:
        "clinical_pathway_none_eligible_and_no_global_block_and_pathway_specific_failures_only",
      fallbackScoreFormula: "product_h max(epsilon, m_h(x))^{xi_h}",
      thresholdFamilyRefs: ["xi_minor_feature_weight", "tau_minor_eligible"],
    },
    eligibilityThresholds: thresholdFamilies.map((family) => family.thresholdId),
    reconciliationThresholds: [
      "reserved_for_seq_343_match_strength",
      "reserved_for_seq_343_posterior_threshold",
    ],
    globalExclusions: ["global.red_flag_bridge", "global.high_risk_exclusion"],
    redFlagBridges: ["global.red_flag_bridge"],
    timingGuardrails: pathways.map((pathway) => ({
      guardrailId: pathway.timingGuardrailCode,
      rulePackVersion: "RPK_P6_2025_09_23_V1",
      pathwayCode: pathway.pathwayCode,
      materialityLevel: pathway.materialityLevel,
      maxRecommendedDelayMinutes:
        pathway.materialityLevel === "high" ? 240 : pathway.materialityLevel === "medium" ? 480 : 1440,
      maxAllowedDelayMinutes:
        pathway.materialityLevel === "high" ? 720 : pathway.materialityLevel === "medium" ? 1440 : 2880,
      latestSafeOpeningDeltaMinutes:
        pathway.materialityLevel === "high" ? 180 : pathway.materialityLevel === "medium" ? 360 : 720,
      suppressionPolicy:
        pathway.materialityLevel === "high"
          ? "suppress_unsafe"
          : pathway.materialityLevel === "medium"
            ? "suppress_from_recommended_frontier"
            : "warn_only",
      warningCopyRef: `copy.${pathway.timingGuardrailCode}.warning`,
    })),
    displayTextRefs: [
      "copy.pharmacy.patient.unsuitable_return",
      "copy.pharmacy.staff.rule_trace_header",
      "copy.pharmacy.patient.minor_illness_fallback",
    ],
    immutabilityState: "immutable_once_promoted",
    promotionPolicy: {
      goldenCaseRegressionRequired: true,
      hazardTraceabilityRequired: true,
      inPlaceMutationForbidden: true,
    },
  },
  thresholdExamples: {
    alpha_required_symptom_weight: {
      defaultWeightLow: 0.25,
      defaultWeightMedium: 0.5,
      defaultWeightHigh: 1,
    },
    eta_excl: 1.6,
    eta_global: 2,
    eta_contra: 1.4,
    tau_global_block: 0.8,
    tau_path_block: 0.7,
    tau_contra_block: 0.7,
    tau_req_pass: 0.68,
    tau_min_complete: 0.6,
    tau_eligible: 0.58,
    xi_minor_feature_weight: {
      symptomBurden: 0.35,
      selfCareFit: 0.25,
      comorbidityPenalty: 0.2,
      escalationNeedPenalty: 0.2,
    },
    tau_minor_eligible: 0.62,
  },
};

const transitionExamples = {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  scenarios: [
    {
      scenarioId: "PH6_CASE_EXAMPLE_001",
      title: "Happy pathway to resolved pharmacy closure",
      pathwayCode: "shingles_18_plus",
      transitionSequence: [
        "candidate_received",
        "rules_evaluating",
        "eligible_choice_pending",
        "provider_selected",
        "consent_pending",
        "package_ready",
        "dispatch_pending",
        "referred",
        "consultation_outcome_pending",
        "resolved_by_pharmacy",
        "closed",
      ],
      notes: "Consent must become satisfied before package_ready and closure remains blocked until LifecycleCoordinator approves.",
    },
    {
      scenarioId: "PH6_CASE_EXAMPLE_002",
      title: "Immediate global block to ineligible return",
      pathwayCode: null,
      transitionSequence: ["candidate_received", "rules_evaluating", "ineligible_returned"],
      notes: "Minor-illness fallback is forbidden because s_global(x) >= tau_global_block.",
    },
    {
      scenarioId: "PH6_CASE_EXAMPLE_003",
      title: "Provider or scope drift reopens consent_pending",
      pathwayCode: "acute_sore_throat_5_plus",
      transitionSequence: [
        "candidate_received",
        "rules_evaluating",
        "eligible_choice_pending",
        "provider_selected",
        "package_ready",
        "consent_pending",
      ],
      notes: "Material provider, pathway, scope, or package drift invalidates prior consent and blocks dispatch.",
    },
    {
      scenarioId: "PH6_CASE_EXAMPLE_004",
      title: "Weak outcome enters reconciliation review before return",
      pathwayCode: "acute_sinusitis_12_plus",
      transitionSequence: [
        "candidate_received",
        "rules_evaluating",
        "eligible_choice_pending",
        "provider_selected",
        "consent_pending",
        "package_ready",
        "dispatch_pending",
        "referred",
        "consultation_outcome_pending",
        "outcome_reconciliation_pending",
        "unresolved_returned",
      ],
      notes: "Outcome truth remains case-local until the reconciliation gate is explicitly settled.",
    },
    {
      scenarioId: "PH6_CASE_EXAMPLE_005",
      title: "Urgent bounce-back dominates ordinary status",
      pathwayCode: "acute_otitis_media_1_17",
      transitionSequence: [
        "candidate_received",
        "rules_evaluating",
        "eligible_choice_pending",
        "provider_selected",
        "consent_pending",
        "package_ready",
        "dispatch_pending",
        "referred",
        "consultation_outcome_pending",
        "urgent_bounce_back",
      ],
      notes: "Urgent return remains typed and may not be flattened into unresolved_returned or quiet patient reassurance.",
    },
  ],
};

const externalReferenceNotes = {
  taskId: TASK_ID,
  reviewedOn: "2026-04-23",
  accessedOn: "2026-04-23",
  localSourceOfTruth: [
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-cards.md",
    "data/contracts/341_phase5_to_phase6_handoff_contract.json",
    "data/launchpacks/341_phase6_seed_packet_342.json",
  ],
  summary:
    "Accessed on 2026-04-23. External sources were used only to confirm the current named Pharmacy First pathway set, current service-lane posture, and current clinical-safety governance expectations. The local blueprint remained authoritative for all state, threshold, lifecycle, and later-owned boundary semantics.",
  sources: [
    {
      sourceId: "nhs_pharmacy_first_service_spec",
      title: "Community pharmacy advanced service specification: NHS Pharmacy First Service",
      url: "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/",
      publisher: "NHS England",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed that the live service specification and pathway documents were updated on 23 September 2025.",
        "Kept the seven named Pharmacy First pathways aligned to the current official service page and PGD set.",
      ],
      rejectedOrConstrained: [
        "The service page did not override the local state machine, lifecycle, or fallback law.",
      ],
    },
    {
      sourceId: "nhs_pharmacy_first_launch_letter",
      title: "Launch of NHS Pharmacy First advanced service",
      url: "https://www.england.nhs.uk/long-read/launch-of-nhs-pharmacy-first-advanced-service/",
      publisher: "NHS England",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed the seven-condition production set and the three-part service posture of clinical pathways, urgent repeat medicine supply, and NHS referrals for minor illness.",
        "Used the official age ranges as a support check against the local pathway registry.",
      ],
      rejectedOrConstrained: [
        "The launch letter did not decide local pathway precedence, timing guardrails, or immutable pack semantics.",
      ],
    },
    {
      sourceId: "nhs_minor_illness_referral_page",
      title: "Practices referring patients to Pharmacy First for lower acuity minor illnesses and clinical pathway consultations",
      url: "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/",
      publisher: "NHS England",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Confirmed that lower acuity/minor illness management remains a distinct service lane alongside the named clinical pathways.",
        "Kept the rule-pack contract explicit about broader minor-illness handling rather than flattening all pharmacy work into one pathway list.",
      ],
      rejectedOrConstrained: [
        "The referral page did not justify silent fallback from a globally blocked pathway into minor-illness handling.",
      ],
    },
    {
      sourceId: "nhs_digital_clinical_safety_assurance",
      title: "Digital clinical safety assurance",
      url: "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
      publisher: "NHS England",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Reinforced that DCB0129 and DCB0160 documentation, hazard logs, and safety cases remain core release controls for rule-pack change management.",
        "Kept rule-pack promotion and safety traceability explicit in the 342 change-control contract.",
      ],
      rejectedOrConstrained: [
        "The guidance did not soften the local requirement that all threshold families be versioned data rather than code defaults.",
      ],
    },
    {
      sourceId: "nhs_dcb_step_by_step",
      title: "Step by step guidance",
      url: "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
      publisher: "NHS England Digital",
      observedOn: "2026-04-23",
      borrowedInto: [
        "Kept public funding and intended-use scope visible when defining the pack promotion and replay governance posture.",
        "Reinforced that both manufacturer and deployment obligations must be considered when changing load-bearing pharmacy rules.",
      ],
      rejectedOrConstrained: [
        "Applicability guidance did not override the local blueprint's stronger immutable-pack and replay-first requirements.",
      ],
    },
  ],
};

const transitionMatrixRows = transitions.map((transition) => ({
  transitionId: transition.transitionId,
  fromState: transition.from,
  eventName: transition.event,
  toState: transition.to,
  preconditions: transition.preconditions.join(" | "),
  prohibitedWhen: transition.prohibitedWhen.join(" | "),
  blockerFamilies: transition.blockerFamilies.join(" | "),
  sideEffectFamilies: transition.sideEffectFamilies.join(" | "),
}));

const decisionTableRows = [
  {
    scenarioId: "PH6_DECISION_001",
    evidenceProfile: "Adult female, 2 urinary symptoms, no red flags, complete evidence",
    candidatePathways: "uncomplicated_uti_female_16_64",
    expectedLane: "clinical_pathway_consultation",
    expectedPathway: "uncomplicated_uti_female_16_64",
    expectedOutcomeState: "eligible_choice_pending",
    notes: "Happy pathway pass with no need for fallback.",
  },
  {
    scenarioId: "PH6_DECISION_002",
    evidenceProfile: "Sinusitis symptoms plus global red-flag bridge",
    candidatePathways: "acute_sinusitis_12_plus",
    expectedLane: "non_pharmacy_return",
    expectedPathway: "",
    expectedOutcomeState: "ineligible_returned",
    notes: "Global block prevents both pathway and fallback progression.",
  },
  {
    scenarioId: "PH6_DECISION_003",
    evidenceProfile: "Sore throat symptoms incomplete below tau_min_complete",
    candidatePathways: "acute_sore_throat_5_plus",
    expectedLane: "non_pharmacy_return",
    expectedPathway: "",
    expectedOutcomeState: "ineligible_returned",
    notes: "Incomplete evidence blocks pathway eligibility and fallback is not auto-granted.",
  },
  {
    scenarioId: "PH6_DECISION_004",
    evidenceProfile: "Otitis media candidate with contradictory symptom evidence above tau_contra_block",
    candidatePathways: "acute_otitis_media_1_17",
    expectedLane: "non_pharmacy_return",
    expectedPathway: "",
    expectedOutcomeState: "ineligible_returned",
    notes: "Hard contradiction block prevents pharmacy progression.",
  },
  {
    scenarioId: "PH6_DECISION_005",
    evidenceProfile: "No named pathway eligible, no global block, low-acuity minor illness features exceed tau_minor_eligible",
    candidatePathways: "acute_sore_throat_5_plus | acute_sinusitis_12_plus",
    expectedLane: "minor_illness_fallback",
    expectedPathway: "minor_illness_fallback",
    expectedOutcomeState: "eligible_choice_pending",
    notes: "Fallback is lawful only because every rejected named pathway failed for pathway-specific reasons only.",
  },
  {
    scenarioId: "PH6_DECISION_006",
    evidenceProfile: "Two named pathways remain eligible after scoring",
    candidatePathways: "shingles_18_plus | impetigo_1_plus",
    expectedLane: "clinical_pathway_consultation",
    expectedPathway: "shingles_18_plus",
    expectedOutcomeState: "eligible_choice_pending",
    notes: "Pathway precedence beats raw eligibilityConfidence when multiple pathways remain eligible.",
  },
];

function renderArchitectureDoc(): string {
  return `# 342 Phase 6 Pharmacy Case Model And Policy Contracts

Contract version: \`${CONTRACT_VERSION}\`

This document freezes the Phase 6 pharmacy backbone so implementation tracks can build a real pharmacy loop without reinterpreting case, eligibility, or rule-pack law.

## Why 342 exists

- Phase 6 starts from the proven Phase 5 foundation recorded in [341_phase5_to_phase6_handoff_contract.json](/Users/test/Code/V/data/contracts/341_phase5_to_phase6_handoff_contract.json).
- \`PharmacyCase\` is a governed child lineage branch, not a loose referral note.
- Eligibility and timing thresholds are versioned data inside immutable rule packs, never hidden code defaults.
- Later tracks \`343\` and \`344\` inherit typed references from this freeze instead of backfilling vague placeholders.

## Aggregate boundary

${markdownTable(
  ["Contract", "Purpose", "Non-negotiable law"],
  [
    ["PharmacyCase", "Durable Phase 6 aggregate and state root.", "Must bind RequestLineage, LineageCaseLink(caseFamily = pharmacy), lifecycle lease, fence, and blocker references directly."],
    ["ServiceTypeDecision", "Resolves the service lane and candidate pathways.", "Must keep clinical pathways, minor-illness fallback, and non-pharmacy return distinct."],
    ["PathwayEligibilityEvaluation", "Replayable eligibility record.", "Must persist matched rules, completeness, contradiction, confidence, and explanation bundle refs."],
    ["PharmacyRulePack", "Immutable effective-dated policy pack.", "Pack mutation in place is forbidden; replay and golden-case regression are mandatory."],
    ["PathwayDefinition", "Single named pathway contract.", "Age/sex gates, exclusions, fallback rules, escalation modes, and timing guardrail binding are frozen together."],
    ["PathwayTimingGuardrail", "Delay and safety envelope.", "Choice and dispatch tracks may consume it later but may not redefine it."],
    ["EligibilityExplanationBundle", "Shared patient/staff explanation family.", "Patient and staff views come from the same underlying evaluation evidence hash."],
  ],
)}

## Canonical PharmacyCase state machine

${markdownTable(
  ["State", "Family", "Meaning"],
  states.map((state) => [state.stateId, state.stateFamily, state.summary]),
)}

Closure authority remains \`LifecycleCoordinator\`. \`PharmacyCase.status\` may never close the canonical request directly.

## Transition and blocker law

- Only the transitions published in [342_phase6_case_state_machine.yaml](/Users/test/Code/V/data/contracts/342_phase6_case_state_machine.yaml) are legal.
- Dispatch, outcome, reopen, and close must all compare the active \`ownershipEpoch\`, \`RequestLifecycleLease\`, and \`LineageFence\`.
- \`minor_illness_fallback\` is lawful only when no named clinical pathway remains eligible, \`s_global(x) < tau_global_block\`, and every rejected named pathway failed for pathway-specific reasons only.
- \`urgent_bounce_back\` and \`no_contact_return_pending\` are canonical states here even though their detailed evidence and visibility models are frozen by \`344\`.

## Rule-pack immutability

${markdownTable(
  ["Rule", "Meaning"],
  [
    ["Active packs are immutable", "No in-place edits after promotion."],
    ["Effective dating is mandatory", "Every pack has a start and optional end window."],
    ["Golden-case regression is required", "Promotion requires deterministic replay across the golden-case suite."],
    ["Thresholds version together", "Thresholds, explanations, fallback rules, and timing guardrails may not drift independently."],
    ["Replay is mandatory", "Every evaluation keeps the exact pack version used at decision time."],
  ],
)}

## Reserved later-owned interfaces

${markdownTable(
  ["Later owner", "Already frozen here", "Detailed schema deferred"],
  [
    ["seq_343", "choiceSessionRef, selectedProviderRef, activeConsentRef, activeConsentCheckpointRef, latestConsentRevocationRef, activeDispatchAttemptRef, correlationRef, outcomeRef, currentConfirmationGateRefs", "Provider discovery, consent, dispatch, transport proof, and outcome reconciliation payloads."],
    ["seq_344", "bounceBackRef, activeReachabilityDependencyRefs, currentClosureBlockerRefs", "Bounce-back detail, urgent return, patient-status macros, practice visibility, and operations exception models."],
  ],
)}

The field registry is embedded directly into the machine-readable schemas through the \`x-vecells-*\` metadata on every frozen field.
`;
}

function renderApiDoc(): string {
  return `# 342 Phase 6 Pharmacy Case And Rules API

The first API surface exists to let \`346\` and \`347\` implement against one shared command vocabulary.

## Command surface

${markdownTable(
  ["Operation", "Route", "Primary preconditions", "Primary exits"],
  apiCommands.map((command) => [
    command.operationId,
    `${command.method} ${command.path}`,
    command.statePreconditions.join("<br>"),
    command.stateExits.length > 0 ? command.stateExits.join("<br>") : "read_only",
  ]),
)}

## Failure-class law

- \`duplicate_case_conflict\`
- \`illegal_transition\`
- \`missing_threshold_family\`
- \`pack_mutation_rejected\`
- \`choice_proof_superseded\`
- \`override_ack_missing\`
- \`consent_invalid\`
- \`route_intent_drift\`
- \`outcome_match_ambiguous\`
- \`closure_blocker_open\`
- \`reachability_dependency_open\`
- \`stale_write\`

## Idempotency and stale-write rules

- Every POST command binds an exact idempotency tuple to the current case, pack, selection, package, or outcome evidence hash.
- Stale writes fail closed. They may not silently overwrite the current owner epoch or calm the visible state.
- Audit append requirements are part of the command contract, not implementation detail.

See the machine-readable source of truth in [342_phase6_api_surface.yaml](/Users/test/Code/V/data/contracts/342_phase6_api_surface.yaml).
`;
}

function renderPolicyDoc(): string {
  return `# 342 Phase 6 Rule Pack Change Control

This document freezes the change-control posture for Phase 6 pharmacy policy packs.

## Promotion law

1. Draft packs may be edited only before promotion.
2. Promotion must create a new \`rulePackId\` and never mutate an active pack in place.
3. Promotion requires:
   - a complete threshold family set
   - a complete pathway set and timing guardrail binding
   - golden-case regression
   - hazard-traceability review
   - explanation-bundle text parity
4. Historical replay must always be able to resolve the exact pack version used by a case.

## Retirement law

- A pack retires only by explicit \`effectiveTo\` closure or clear supersession.
- Silent overwrite is forbidden.
- Retired packs stay replayable and queryable for audit, clinical safety, and dispute resolution.

## Safety posture

- Threshold changes are safety-relevant changes because they can alter suitability, fallback, and timing outcomes.
- DCB0129 and DCB0160 expectations therefore apply to pack change control, hazard traceability, and deployment assurance.
- The rule-pack contract is intentionally stronger than a simple clinical content spreadsheet: it is executable release law.

## What later tracks must not do

- Hard-code threshold defaults in runtime code.
- Reorder pathway precedence locally.
- Treat minor-illness fallback as a silent alternative to global blocks.
- Split patient-facing and staff-facing explanation semantics into separate uncontrolled vocabularies.
`;
}

function fieldRowsForDoc(title: string, fields: FieldDef[]): string[][] {
  return fields.map((field) => [
    `${title}.${field.name}`,
    field.mutability,
    field.ownerTask,
    field.sourceSection,
    field.downstreamDependents.join(", "),
  ]);
}

function main(): void {
  writeText(OUTPUTS.architectureDoc, renderArchitectureDoc());
  writeText(OUTPUTS.apiDoc, renderApiDoc());
  writeText(OUTPUTS.policyDoc, renderPolicyDoc());

  writeJson(OUTPUTS.caseSchema, pharmacyCaseSchema);
  writeYamlAsJson(OUTPUTS.stateMachine, stateMachine);
  writeJson(OUTPUTS.eventRegistry, eventRegistry);
  writeYamlAsJson(OUTPUTS.apiSurface, apiSurface);
  writeJson(OUTPUTS.rulePackSchema, rulePackSchema);
  writeJson(OUTPUTS.pathwayRegistry, pathwayRegistry);
  writeJson(OUTPUTS.thresholdRegistry, thresholdRegistry);
  writeJson(OUTPUTS.explanationBundleSchema, explanationBundleSchema);
  writeJson(OUTPUTS.rulePackFixture, rulePackExample);
  writeJson(OUTPUTS.transitionFixture, transitionExamples);
  writeJson(OUTPUTS.externalNotes, externalReferenceNotes);

  writeCsv(
    OUTPUTS.transitionMatrix,
    [
      "transitionId",
      "fromState",
      "eventName",
      "toState",
      "preconditions",
      "prohibitedWhen",
      "blockerFamilies",
      "sideEffectFamilies",
    ],
    transitionMatrixRows,
  );
  writeCsv(
    OUTPUTS.decisionTable,
    [
      "scenarioId",
      "evidenceProfile",
      "candidatePathways",
      "expectedLane",
      "expectedPathway",
      "expectedOutcomeState",
      "notes",
    ],
    decisionTableRows,
  );

  console.log(
    JSON.stringify(
      {
        architectureDoc: OUTPUTS.architectureDoc,
        caseSchema: OUTPUTS.caseSchema,
        rulePackSchema: OUTPUTS.rulePackSchema,
        eventCount: events.length,
        stateCount: states.length,
        transitionCount: transitions.length,
        pathwayCount: pathways.length,
      },
      null,
      2,
    ),
  );
}

main();
