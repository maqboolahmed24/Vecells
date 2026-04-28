import {
  createInitialContinuitySnapshot,
  createUiTelemetryEnvelope,
  getPersistentShellRouteClaim,
  navigateWithinShell,
  selectAnchorInSnapshot,
  type ContinuitySnapshot,
  type RuntimeScenario,
  type UiTelemetryEnvelopeExample,
  type UiTelemetryEventClass,
} from "@vecells/persistent-shell";
import type { CasePulseContract, StatusTruthInput } from "@vecells/design-system";

export const PHARMACY_SHELL_TASK_ID = "par_356";
export const PHARMACY_SHELL_VISUAL_MODE = "Pharmacy_Mission_Frame";
export const PHARMACY_MISSION_FRAME_VISUAL_MODE = PHARMACY_SHELL_VISUAL_MODE;
export const PHARMACY_SOURCE_SURFACE = "shell_gallery";
export const PHARMACY_TELEMETRY_SCENARIO_ID =
  "SCN_PATIENT_SEED_SURROGATE_HOME";
export const PHARMACY_DEFAULT_PATH = "/workspace/pharmacy";
export const PHARMACY_SHELL_SLUG = "pharmacy-console";

export type PharmacyRouteKey =
  | "lane"
  | "case"
  | "validate"
  | "inventory"
  | "resolve"
  | "handoff"
  | "assurance";
export type PharmacyChildRouteKey =
  | "validate"
  | "inventory"
  | "resolve"
  | "handoff"
  | "assurance";
export type PharmacyCaseScenario =
  | "ready_to_dispatch"
  | "proof_pending"
  | "contradictory_proof"
  | "partial_supply"
  | "clarification_required"
  | "urgent_return"
  | "weak_match_outcome"
  | "manual_review_debt"
  | "unmatched_outcome";
export type PharmacyQueueTone = "watch" | "caution" | "critical" | "success";
export type PharmacyCheckpointState =
  | "satisfied"
  | "pending"
  | "watch"
  | "blocked"
  | "review_required";
export type PharmacyLineItemPosture =
  | "ready"
  | "partial_supply"
  | "clarification_required"
  | "blocked"
  | "manual_review";
export type PharmacyInventoryPosture =
  | "live"
  | "partial_supply"
  | "stale_review"
  | "blocked";
export type PharmacyProofState =
  | "ready_to_dispatch"
  | "proof_pending"
  | "contradictory_proof";
export type PharmacyOutcomeTruthState =
  | "outcome_pending"
  | "settled_resolved"
  | "weak_match"
  | "manual_review_debt"
  | "urgent_return"
  | "unmatched_review";
export type PharmacyConsentState =
  | "satisfied"
  | "clarification_required"
  | "drifted"
  | "revoked";
export type PharmacyWorkbenchPosture =
  | "ready"
  | "guarded"
  | "read_only"
  | "reopen_for_safety";
export type PharmacyVisualizationMode =
  | "chart_plus_table"
  | "table_only"
  | "summary_only";
export type PharmacyLayoutMode = "two_plane" | "mission_stack";
export type PharmacyRouteShellPosture =
  | "shell_live"
  | "shell_read_only"
  | "shell_recovery";
export type PharmacyOperationsStateRef =
  | "active_case"
  | "waiting_for_patient_choice"
  | "waiting_for_outcome"
  | "bounce_back"
  | "transport_failure"
  | "provider_outage"
  | "validation_due"
  | "stock_risk"
  | "handoff_blocked";
export type PharmacyProviderHealthState = "nominal" | "degraded" | "outage";
export type PharmacyWatchWindowState = "clear" | "watch" | "blocked";

export interface PharmacyLocation {
  pathname: string;
  routeKey: PharmacyRouteKey;
  routeFamilyRef: "rf_pharmacy_console";
  pharmacyCaseId: string | null;
  childRouteKey: PharmacyChildRouteKey | null;
}

export interface PharmacyCheckpoint {
  checkpointId: string;
  label: string;
  state: PharmacyCheckpointState;
  summary: string;
  evidenceLabel: string;
}

export interface PharmacyLineItem {
  lineItemId: string;
  medicationLabel: string;
  instructionLabel: string;
  requestedUnits: number;
  reservedUnits: number;
  availableUnits: number;
  posture: PharmacyLineItemPosture;
  summary: string;
  reconciliationLabel: string;
}

export interface PharmacyDispatchTruthProjection {
  transportAcceptanceState: "ready" | "pending" | "disputed";
  providerAcceptanceState: "ready" | "pending" | "disputed";
  authoritativeProofState: PharmacyProofState;
  deadlineRisk: "stable" | "watch" | "breach_risk";
  summary: string;
}

export interface PharmacyOutcomeTruthProjection {
  outcomeTruthState: PharmacyOutcomeTruthState;
  matchConfidenceLabel: string;
  manualReviewState: "clear" | "pending" | "required";
  summary: string;
}

export interface PharmacyCaseSeed {
  pharmacyCaseId: string;
  patientLabel: string;
  scenario: PharmacyCaseScenario;
  queueLane: string;
  queueTone: PharmacyQueueTone;
  queueSummary: string;
  caseSummary: string;
  consentState: PharmacyConsentState;
  consentSummary: string;
  inventoryPosture: PharmacyInventoryPosture;
  inventorySummary: string;
  proofState: PharmacyProofState;
  proofSummary: string;
  outcomeTruth: PharmacyOutcomeTruthProjection;
  dispatchTruth: PharmacyDispatchTruthProjection;
  workbenchPosture: PharmacyWorkbenchPosture;
  dominantActionLabel: string;
  checkpointQuestion: string;
  watchWindowSummary: string;
  reopenSummary: string;
  supportSummary: string;
  providerLabel: string;
  pathwayLabel: string;
  dueLabel: string;
  defaultCheckpointId: string;
  defaultLineItemId: string;
  checkpoints: readonly PharmacyCheckpoint[];
  lineItems: readonly PharmacyLineItem[];
  operationsStateRefs?: readonly PharmacyOperationsStateRef[];
  providerHealthState?: PharmacyProviderHealthState;
  watchWindowState?: PharmacyWatchWindowState;
  blockingReasonCodes?: readonly string[];
  recoveryOwnerLabel?: string;
  gapRefs: readonly string[];
}

export interface PharmacyReturnToken {
  returnTokenId: string;
  originPath: string;
  pharmacyCaseId: string;
  lineItemId: string;
  checkpointId: string;
  issuedAt: string;
}

export interface PharmacyShellState {
  location: PharmacyLocation;
  continuitySnapshot: ContinuitySnapshot;
  selectedCaseId: string;
  activeCheckpointId: string;
  activeLineItemId: string;
  returnToken: PharmacyReturnToken | null;
  runtimeScenario: RuntimeScenario;
  telemetry: readonly UiTelemetryEnvelopeExample[];
}

export interface PharmacyShellSnapshot {
  location: PharmacyLocation;
  currentCase: PharmacyCaseSeed;
  activeCheckpoint: PharmacyCheckpoint;
  activeLineItem: PharmacyLineItem;
  queueCases: readonly PharmacyCaseSeed[];
  layoutMode: PharmacyLayoutMode;
  visualizationMode: PharmacyVisualizationMode;
  recoveryPosture: "live" | "read_only" | "recovery_only" | "blocked";
  routeShellPosture: PharmacyRouteShellPosture;
  actionEnabled: boolean;
  summarySentence: string;
  statusInput: StatusTruthInput;
  casePulse: CasePulseContract;
}

export interface PharmacyMockProjectionExample {
  exampleId: string;
  path: string;
  pharmacyCaseId: string;
  scenario: PharmacyCaseScenario;
  summary: string;
}

export interface PharmacyRouteContractSeedRow {
  path: string;
  routeFamilyRef: "rf_pharmacy_console";
  routeKey: PharmacyRouteKey;
  continuityKey: string;
  selectedAnchorPolicy: string;
  summary: string;
}

export interface PharmacyCheckpointAndProofMatrixRow {
  pharmacyCaseId: string;
  scenario: PharmacyCaseScenario;
  consentState: PharmacyConsentState;
  proofState: PharmacyProofState;
  inventoryPosture: PharmacyInventoryPosture;
  outcomeTruthState: PharmacyOutcomeTruthState;
  dominantAction: string;
  gapRefs: readonly string[];
}

const pharmacyClaim = getPersistentShellRouteClaim("rf_pharmacy_console");

const providerSpecificGap = "GAP_PHARMACY_PROVIDER_SPECIFIC_DISPATCH_BINDING_V1";
const futureFlowGap = "GAP_FUTURE_PHARMACY_FLOW_DIRECTORY_RESELECTION_V1";
const truthfulConsentGap = "GAP_TRUTHFUL_PHARMACY_POSTURE_CONSENT_DRIFT_V1";
const truthfulProofGap = "GAP_TRUTHFUL_PHARMACY_POSTURE_PROOF_DISPUTE_V1";
const truthfulOutcomeGap = "GAP_TRUTHFUL_PHARMACY_POSTURE_WEAK_MATCH_V1";
const truthfulReopenGap = "GAP_TRUTHFUL_PHARMACY_POSTURE_REOPEN_SAFETY_V1";

export const pharmacyCases: readonly PharmacyCaseSeed[] = [
  {
    pharmacyCaseId: "PHC-2048",
    patientLabel: "Case 2048 / topical review referral",
    scenario: "ready_to_dispatch",
    queueLane: "Ready to dispatch",
    queueTone: "success",
    queueSummary:
      "Consent, inventory, and proof lanes are aligned; the case can advance once the current checkpoint is confirmed.",
    caseSummary:
      "A stable referral package is assembled and the workbench stays calm because proof is ready but not yet cosmetically final.",
    consentState: "satisfied",
    consentSummary:
      "Consent is satisfied for the selected provider, current scope, and frozen package hash.",
    inventoryPosture: "live",
    inventorySummary:
      "Inventory comparison is fresh and the reserved pack matches the current validation line items.",
    proofState: "ready_to_dispatch",
    proofSummary:
      "Transport and provider acceptance are aligned; authoritative proof is ready for the governed handoff step.",
    outcomeTruth: {
      outcomeTruthState: "outcome_pending",
      matchConfidenceLabel: "Outcome pending",
      manualReviewState: "clear",
      summary:
        "No outcome has landed yet, so the case stays procedural rather than resolved.",
    },
    dispatchTruth: {
      transportAcceptanceState: "ready",
      providerAcceptanceState: "ready",
      authoritativeProofState: "ready_to_dispatch",
      deadlineRisk: "stable",
      summary:
        "Dispatch can proceed because the current proof chain is complete for this seed tuple.",
    },
    workbenchPosture: "ready",
    dominantActionLabel: "Confirm the governed handoff",
    checkpointQuestion:
      "Does the frozen pack still match the current provider, pathway, and stock reservation?",
    watchWindowSummary:
      "Watch window remains routine; no reopen or clarification debt is active.",
    reopenSummary:
      "No reopen-for-safety posture is active while proof and consent remain aligned.",
    supportSummary:
      "Promoted support region shows dispatch readiness and provider acceptance without overclaiming closure.",
    providerLabel: "North Quay Pharmacy",
    pathwayLabel: "Minor skin condition pathway",
    dueLabel: "Dispatch window 14:20",
    defaultCheckpointId: "dispatch",
    defaultLineItemId: "PHC-2048-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "satisfied",
        summary: "Consent tuple matches the selected provider and referral scope.",
        evidenceLabel: "Satisfied for provider and package hash",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "satisfied",
        summary: "Clinical validation notes and package composition are aligned.",
        evidenceLabel: "Validated against current pathway",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "satisfied",
        summary: "Comparison is fresh and reserved stock is still held.",
        evidenceLabel: "Fresh comparison / reservation held",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "satisfied",
        summary: "Proof chain is ready for the governed handoff.",
        evidenceLabel: "Authoritative proof ready",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "pending",
        summary: "Outcome remains pending until the external result arrives.",
        evidenceLabel: "Pending outcome",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2048-L1",
        medicationLabel: "Hydrocortisone 1% cream",
        instructionLabel: "15g tube / one pack",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 3,
        posture: "ready",
        summary: "Reserved stock and validation notes match the requested pack.",
        reconciliationLabel: "No inventory delta remains on this line item.",
      },
      {
        lineItemId: "PHC-2048-L2",
        medicationLabel: "Emollient gel",
        instructionLabel: "250ml / one bottle",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 5,
        posture: "ready",
        summary: "Supportive item remains in the same ready-to-dispatch posture.",
        reconciliationLabel: "Comparison tuple remains fresh.",
      },
    ],
    gapRefs: [providerSpecificGap, futureFlowGap],
  },
  {
    pharmacyCaseId: "PHC-2057",
    patientLabel: "Case 2057 / cough treatment confirmation",
    scenario: "proof_pending",
    queueLane: "Proof pending",
    queueTone: "caution",
    queueSummary:
      "The referral is prepared, but the current proof chain is still waiting on external confirmation and must not read as settled.",
    caseSummary:
      "This case is the calm default: ready enough to validate, not ready enough to imply completed dispatch.",
    consentState: "satisfied",
    consentSummary:
      "Consent is satisfied, so the blocker is proof timing rather than scope drift.",
    inventoryPosture: "live",
    inventorySummary:
      "Inventory truth is fresh and reserved, but release remains gated by the proof timeline.",
    proofState: "proof_pending",
    proofSummary:
      "Transport acceptance is pending and provider confirmation has not yet crossed the authoritative threshold.",
    outcomeTruth: {
      outcomeTruthState: "outcome_pending",
      matchConfidenceLabel: "Outcome pending",
      manualReviewState: "clear",
      summary:
        "Outcome stays pending because dispatch proof has not converged yet.",
    },
    dispatchTruth: {
      transportAcceptanceState: "pending",
      providerAcceptanceState: "pending",
      authoritativeProofState: "proof_pending",
      deadlineRisk: "watch",
      summary:
        "Proof remains provisional. Local acknowledgement may not tint the row as released.",
    },
    workbenchPosture: "guarded",
    dominantActionLabel: "Verify the proof watch window",
    checkpointQuestion:
      "Which proof signal is still missing before the case can move from pending to governed handoff?",
    watchWindowSummary:
      "Proof watch window is open for another 18 minutes; the shell keeps the current case pinned while waiting.",
    reopenSummary:
      "No reopen posture is active, but the shell stays guarded until proof converges.",
    supportSummary:
      "Promoted support region shows proof timing, not false completion.",
    providerLabel: "Harbour Pharmacy Group",
    pathwayLabel: "Acute cough pathway",
    dueLabel: "Proof deadline 14:38",
    defaultCheckpointId: "dispatch",
    defaultLineItemId: "PHC-2057-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "satisfied",
        summary: "Consent remains current.",
        evidenceLabel: "Satisfied",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "satisfied",
        summary: "Validation board is ready to proceed.",
        evidenceLabel: "Validated",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "satisfied",
        summary: "Reserved inventory is aligned with the package.",
        evidenceLabel: "Fresh comparison",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "watch",
        summary: "Proof remains pending and the handoff stays guarded.",
        evidenceLabel: "Awaiting authoritative proof",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "pending",
        summary: "Outcome cannot start until the current proof lane converges.",
        evidenceLabel: "Pending",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2057-L1",
        medicationLabel: "Linctus pack",
        instructionLabel: "200ml / one bottle",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 2,
        posture: "ready",
        summary: "Stock is ready; proof is the gating step.",
        reconciliationLabel: "No stock delta on the selected line.",
      },
      {
        lineItemId: "PHC-2057-L2",
        medicationLabel: "Spacer leaflet pack",
        instructionLabel: "Counselling attachment",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 12,
        posture: "ready",
        summary: "Supporting counselling pack is ready.",
        reconciliationLabel: "Ancillary item remains attached to the same package.",
      },
    ],
    gapRefs: [providerSpecificGap],
  },
  {
    pharmacyCaseId: "PHC-2072",
    patientLabel: "Case 2072 / contradictory dispatch proof",
    scenario: "contradictory_proof",
    queueLane: "Contradictory proof",
    queueTone: "critical",
    queueSummary:
      "Transport and provider evidence disagree, so the shell freezes the handoff plane in place.",
    caseSummary:
      "This case proves that disputed proof remains explicit and never looks settled.",
    consentState: "satisfied",
    consentSummary:
      "Consent remains valid; the blocker is proof contradiction, not scope drift.",
    inventoryPosture: "live",
    inventorySummary:
      "Inventory is still present, but release remains blocked by contradictory proof.",
    proofState: "contradictory_proof",
    proofSummary:
      "Transport accepted one attempt while the provider acknowledgement points to a mismatched payload reference.",
    outcomeTruth: {
      outcomeTruthState: "outcome_pending",
      matchConfidenceLabel: "Outcome pending",
      manualReviewState: "pending",
      summary:
        "Outcome remains pending until proof contradiction is resolved.",
    },
    dispatchTruth: {
      transportAcceptanceState: "disputed",
      providerAcceptanceState: "disputed",
      authoritativeProofState: "contradictory_proof",
      deadlineRisk: "breach_risk",
      summary:
        "The case remains on the last safe summary because proof is contradictory.",
    },
    workbenchPosture: "read_only",
    dominantActionLabel: "Record the proof intervention",
    checkpointQuestion:
      "Which evidence lane is contradictory and what must be reconciled before dispatch can continue?",
    watchWindowSummary:
      "Proof reconciliation watch window is active and blocks release.",
    reopenSummary:
      "If contradiction persists, the shell remains read-only and can reopen for safety without losing the case context.",
    supportSummary:
      "Promoted support region is a contradiction summary, not a release confirmation.",
    providerLabel: "Southside Community Pharmacy",
    pathwayLabel: "ENT urgent advice pathway",
    dueLabel: "Proof review overdue by 7m",
    defaultCheckpointId: "dispatch",
    defaultLineItemId: "PHC-2072-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "satisfied",
        summary: "Consent remains current for the selected provider.",
        evidenceLabel: "Satisfied",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "satisfied",
        summary: "Validation packet is still the current source of truth.",
        evidenceLabel: "Validated",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "satisfied",
        summary: "Inventory remains held while proof is disputed.",
        evidenceLabel: "Held stock",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "blocked",
        summary: "Contradictory proof blocks dispatch and freezes the action plane.",
        evidenceLabel: "Proof disputed",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "review_required",
        summary: "Outcome must wait until proof is reconciled.",
        evidenceLabel: "Review required",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2072-L1",
        medicationLabel: "Ear infection pack",
        instructionLabel: "One governed pack",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 2,
        posture: "blocked",
        summary: "The pack remains held, but the release lane is blocked by proof contradiction.",
        reconciliationLabel: "Held stock cannot convert into release posture yet.",
      },
      {
        lineItemId: "PHC-2072-L2",
        medicationLabel: "Safety-net advice sheet",
        instructionLabel: "Attached evidence",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 9,
        posture: "manual_review",
        summary: "Supporting artifact remains visible while contradiction is reviewed.",
        reconciliationLabel: "Supporting note stays summary-first.",
      },
    ],
    gapRefs: [truthfulProofGap, providerSpecificGap],
  },
  {
    pharmacyCaseId: "PHC-2081",
    patientLabel: "Case 2081 / partial supply comparison",
    scenario: "partial_supply",
    queueLane: "Partial supply",
    queueTone: "caution",
    queueSummary:
      "Inventory truth is current but the selected pack can only be partially supplied without an explicit intervention.",
    caseSummary:
      "This case proves the inventory panel can stay calm while still freezing release truthfully.",
    consentState: "satisfied",
    consentSummary:
      "Consent remains valid for the chosen provider and package scope.",
    inventoryPosture: "partial_supply",
    inventorySummary:
      "Comparison is fresh, but one line item is under-held and requires a partial-supply intervention.",
    proofState: "proof_pending",
    proofSummary:
      "Proof stays pending because the package cannot release until inventory is reconciled.",
    outcomeTruth: {
      outcomeTruthState: "outcome_pending",
      matchConfidenceLabel: "Outcome pending",
      manualReviewState: "clear",
      summary:
        "Outcome posture remains pending behind inventory reconciliation.",
    },
    dispatchTruth: {
      transportAcceptanceState: "pending",
      providerAcceptanceState: "pending",
      authoritativeProofState: "proof_pending",
      deadlineRisk: "watch",
      summary:
        "Dispatch remains pending because a partial supply decision is still unresolved.",
    },
    workbenchPosture: "guarded",
    dominantActionLabel: "Review the partial-supply intervention",
    checkpointQuestion:
      "Which line item can still release and which one must stay fenced until supply delta is resolved?",
    watchWindowSummary:
      "Inventory review window is active while the current line-item delta stays unresolved.",
    reopenSummary:
      "No reopen posture is active yet, but release cannot proceed from partial supply alone.",
    supportSummary:
      "Promoted support region shows source truth, comparison truth, and held posture together.",
    providerLabel: "Park View Pharmacy",
    pathwayLabel: "UTI advice pathway",
    dueLabel: "Inventory watch 15:00",
    defaultCheckpointId: "inventory",
    defaultLineItemId: "PHC-2081-L2",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "satisfied",
        summary: "Consent remains valid.",
        evidenceLabel: "Satisfied",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "satisfied",
        summary: "Validation reasoning is still current.",
        evidenceLabel: "Validated",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "watch",
        summary: "Partial supply is explicit and freezes release action until reviewed.",
        evidenceLabel: "Fresh delta / partial supply",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "pending",
        summary: "Dispatch is waiting on the inventory fence.",
        evidenceLabel: "Waiting on supply delta",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "pending",
        summary: "Outcome remains pending.",
        evidenceLabel: "Pending",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2081-L1",
        medicationLabel: "Trimethoprim 200mg",
        instructionLabel: "6 tablets available / 6 requested",
        requestedUnits: 6,
        reservedUnits: 6,
        availableUnits: 8,
        posture: "ready",
        summary: "Primary pack is fully held and may remain visible as the stable component.",
        reconciliationLabel: "This line item has no current delta.",
      },
      {
        lineItemId: "PHC-2081-L2",
        medicationLabel: "Supportive sachet pack",
        instructionLabel: "1 pack held / 2 requested",
        requestedUnits: 2,
        reservedUnits: 1,
        availableUnits: 1,
        posture: "partial_supply",
        summary: "One pack is missing, so the case stays in partial-supply posture.",
        reconciliationLabel: "Release fence stays active until the missing unit is resolved.",
      },
    ],
    gapRefs: [futureFlowGap],
  },
  {
    pharmacyCaseId: "PHC-2090",
    patientLabel: "Case 2090 / clarification required",
    scenario: "clarification_required",
    queueLane: "Clarification required",
    queueTone: "critical",
    queueSummary:
      "Consent checkpoint drift is explicit and blocks action safely inside the same shell.",
    caseSummary:
      "This case proves that consent ambiguity stays procedural and visible rather than silently downgraded.",
    consentState: "clarification_required",
    consentSummary:
      "Consent checkpoint drifted because the selected provider explanation no longer matches the current scope.",
    inventoryPosture: "blocked",
    inventorySummary:
      "Inventory remains visible but frozen because the consent checkpoint is not satisfied.",
    proofState: "proof_pending",
    proofSummary:
      "Proof is held behind consent clarification and may not advance.",
    outcomeTruth: {
      outcomeTruthState: "outcome_pending",
      matchConfidenceLabel: "Outcome pending",
      manualReviewState: "pending",
      summary:
        "Outcome remains pending while clarification is requested.",
    },
    dispatchTruth: {
      transportAcceptanceState: "pending",
      providerAcceptanceState: "pending",
      authoritativeProofState: "proof_pending",
      deadlineRisk: "watch",
      summary:
        "No release signal may appear while consent is unclear.",
    },
    workbenchPosture: "read_only",
    dominantActionLabel: "Request clarification on the consent tuple",
    checkpointQuestion:
      "Which consent or provider explanation detail drifted and what clarification is required before action can resume?",
    watchWindowSummary:
      "Clarification watch window is active and keeps the case in read-only posture.",
    reopenSummary:
      "If clarification fails, the case can reopen for safety without leaving the shell.",
    supportSummary:
      "Promoted support region is a consent checkpoint summary with bounded next steps.",
    providerLabel: "High Street Pharmacy",
    pathwayLabel: "Allergy advice pathway",
    dueLabel: "Clarification due 15:12",
    defaultCheckpointId: "consent",
    defaultLineItemId: "PHC-2090-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "blocked",
        summary: "Consent drift blocks action safely until clarification lands.",
        evidenceLabel: "Clarification required",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "watch",
        summary: "Validation notes remain visible but not action-authoritative.",
        evidenceLabel: "Visible / fenced",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "blocked",
        summary: "Inventory release is blocked behind consent clarification.",
        evidenceLabel: "Frozen by consent drift",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "blocked",
        summary: "Dispatch is blocked because the consent tuple is incomplete.",
        evidenceLabel: "Blocked",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "review_required",
        summary: "Outcome stays pending behind clarification.",
        evidenceLabel: "Review required",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2090-L1",
        medicationLabel: "Cetirizine 10mg",
        instructionLabel: "14 tablets / one pack",
        requestedUnits: 1,
        reservedUnits: 0,
        availableUnits: 4,
        posture: "clarification_required",
        summary: "Line item remains visible, but release and reservation stay fenced.",
        reconciliationLabel: "Consent clarification must settle before stock can be reserved.",
      },
      {
        lineItemId: "PHC-2090-L2",
        medicationLabel: "Advice leaflet",
        instructionLabel: "One attached note",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 20,
        posture: "manual_review",
        summary: "Supporting advice stays attached as the current safe artifact.",
        reconciliationLabel: "Supplementary note remains visible during clarification.",
      },
    ],
    gapRefs: [truthfulConsentGap],
  },
  {
    pharmacyCaseId: "PHC-2103",
    patientLabel: "Case 2103 / urgent return",
    scenario: "urgent_return",
    queueLane: "Urgent return",
    queueTone: "critical",
    queueSummary:
      "Urgent return has reopened the case for safety; quiet closure is forbidden until the return path settles.",
    caseSummary:
      "This case proves reopen-for-safety posture stays explicit and same-shell.",
    consentState: "revoked",
    consentSummary:
      "Consent no longer supports the current dispatch path after the urgent return signal.",
    inventoryPosture: "blocked",
    inventorySummary:
      "Held inventory remains visible for context, but release posture is gone until safety review settles.",
    proofState: "contradictory_proof",
    proofSummary:
      "The current proof chain is no longer safe to rely on after the urgent return.",
    outcomeTruth: {
      outcomeTruthState: "urgent_return",
      matchConfidenceLabel: "Urgent return / manual review",
      manualReviewState: "required",
      summary:
        "Outcome has reopened for safety and cannot be rendered as resolved.",
    },
    dispatchTruth: {
      transportAcceptanceState: "disputed",
      providerAcceptanceState: "disputed",
      authoritativeProofState: "contradictory_proof",
      deadlineRisk: "breach_risk",
      summary:
        "The shell preserves the last safe summary and directs all action into reopen-for-safety posture.",
    },
    workbenchPosture: "reopen_for_safety",
    dominantActionLabel: "Reopen this case for safety review",
    checkpointQuestion:
      "What changed in the return signal, and which safe route reopens the case without dropping evidence?",
    watchWindowSummary:
      "Urgent return watch window is active and has authority over ordinary dispatch posture.",
    reopenSummary:
      "Reopen-for-safety is the dominant posture and must remain visible until the return path is settled.",
    supportSummary:
      "Promoted support region becomes a reopen-and-assurance summary rather than a release panel.",
    providerLabel: "Riverside Pharmacy",
    pathwayLabel: "Chest infection urgent pathway",
    dueLabel: "Immediate safety review",
    defaultCheckpointId: "outcome",
    defaultLineItemId: "PHC-2103-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "blocked",
        summary: "Consent no longer supports the current release path.",
        evidenceLabel: "Revoked after urgent return",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "review_required",
        summary: "Validation must be revisited under the return posture.",
        evidenceLabel: "Safety review required",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "blocked",
        summary: "Inventory stays visible but frozen.",
        evidenceLabel: "Frozen under reopen posture",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "blocked",
        summary: "Dispatch posture is no longer actionable.",
        evidenceLabel: "Blocked by urgent return",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "blocked",
        summary: "Outcome reopened for safety and cannot look settled.",
        evidenceLabel: "Urgent return",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2103-L1",
        medicationLabel: "Antibiotic starter pack",
        instructionLabel: "One starter pack held",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 2,
        posture: "blocked",
        summary: "The line item stays visible, but reopen posture blocks release.",
        reconciliationLabel: "Held pack remains reference-only while safety review proceeds.",
      },
      {
        lineItemId: "PHC-2103-L2",
        medicationLabel: "Escalation note",
        instructionLabel: "Safety note attached",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 10,
        posture: "manual_review",
        summary: "Safety note remains the current trustworthy artifact.",
        reconciliationLabel: "Escalation note stays attached through reopen.",
      },
    ],
    gapRefs: [truthfulReopenGap],
  },
  {
    pharmacyCaseId: "PHC-2204",
    patientLabel: "Case 2204 / routine reopen",
    scenario: "urgent_return",
    queueLane: "Routine reopen",
    queueTone: "caution",
    queueSummary:
      "Routine return has reopened the original request; the shell must stay explicit until the reopened route settles.",
    caseSummary:
      "This case proves routine bounce-back recovery stays in the same shell without splitting away from the original request frame.",
    consentState: "satisfied",
    consentSummary:
      "Consent still supports review, but it does not restore quiet continuation while the reopen is active.",
    inventoryPosture: "blocked",
    inventorySummary:
      "Held stock remains reference-only while the original request is reacquired and reviewed.",
    proofState: "contradictory_proof",
    proofSummary:
      "Previous dispatch proof remains visible, but it is no longer the current safe path after the return.",
    outcomeTruth: {
      outcomeTruthState: "urgent_return",
      matchConfidenceLabel: "Routine return / reopen active",
      manualReviewState: "pending",
      summary:
        "Outcome posture is reopened and cannot read as settled while the original request is reacquired.",
    },
    dispatchTruth: {
      transportAcceptanceState: "disputed",
      providerAcceptanceState: "pending",
      authoritativeProofState: "contradictory_proof",
      deadlineRisk: "watch",
      summary:
        "The shell keeps the last proof visible for context, then routes action back through the original request frame.",
    },
    workbenchPosture: "reopen_for_safety",
    dominantActionLabel: "Return to the original request and review what changed",
    checkpointQuestion:
      "Which part of the previous route is no longer valid, and what must stay visible when the original request reopens?",
    watchWindowSummary:
      "Routine return watch window is active and keeps quiet closure suppressed until the reopen settles.",
    reopenSummary:
      "Original request reacquisition is the dominant posture and must stay same-shell until the recovery completes.",
    supportSummary:
      "Promoted support region becomes a routine-return recovery board with diff and message preview instead of a calm completion surface.",
    providerLabel: "Canal Street Pharmacy",
    pathwayLabel: "Minor illness routine follow-up",
    dueLabel: "Reopen today",
    defaultCheckpointId: "validation",
    defaultLineItemId: "PHC-2204-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "watch",
        summary: "Consent supports review only while the reopen is active.",
        evidenceLabel: "Recovery-only posture",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "review_required",
        summary: "Validation must reopen on the original request frame.",
        evidenceLabel: "Diff review required",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "blocked",
        summary: "Inventory remains reference-only until the reopened route settles.",
        evidenceLabel: "Held for context",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "blocked",
        summary: "Dispatch continuation is frozen while the case re-enters review.",
        evidenceLabel: "Frozen by routine return",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "review_required",
        summary: "Outcome stays open because the return removed quiet settlement posture.",
        evidenceLabel: "Routine reopen active",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2204-L1",
        medicationLabel: "Hay fever relief pack",
        instructionLabel: "One pack previously prepared",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 3,
        posture: "blocked",
        summary: "Prepared stock stays visible but cannot be quietly released after the return.",
        reconciliationLabel:
          "Original request must be reviewed before the held pack can become actionable again.",
      },
      {
        lineItemId: "PHC-2204-L2",
        medicationLabel: "Patient follow-up note",
        instructionLabel: "Return message draft",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 12,
        posture: "manual_review",
        summary: "The patient message draft remains the current recovery artifact.",
        reconciliationLabel:
          "Message preview is tied to the reopen contract and remains review-only until emitted.",
      },
    ],
    gapRefs: [truthfulReopenGap],
  },
  {
    pharmacyCaseId: "PHC-2215",
    patientLabel: "Case 2215 / loop-risk escalation",
    scenario: "urgent_return",
    queueLane: "Escalated reopen",
    queueTone: "critical",
    queueSummary:
      "Repeated returns have escalated loop risk; supervisor review and contact repair now block any automatic continuation.",
    caseSummary:
      "This case proves repeat bounce-backs stay explicit, escalated, and same-shell instead of becoming silent retry debt.",
    consentState: "satisfied",
    consentSummary:
      "Consent still supports review, but supervisor escalation and contact-repair debt remain the blocking posture.",
    inventoryPosture: "blocked",
    inventorySummary:
      "Inventory is preserved for reference only while the escalated recovery path is resolved.",
    proofState: "contradictory_proof",
    proofSummary:
      "Historic proof remains visible for comparison, but it cannot authorize another automatic retry.",
    outcomeTruth: {
      outcomeTruthState: "urgent_return",
      matchConfidenceLabel: "Loop-risk escalation / recovery blocked",
      manualReviewState: "required",
      summary:
        "Outcome posture stays reopened and blocked until supervisor review and contact repair both clear.",
    },
    dispatchTruth: {
      transportAcceptanceState: "disputed",
      providerAcceptanceState: "disputed",
      authoritativeProofState: "contradictory_proof",
      deadlineRisk: "breach_risk",
      summary:
        "The shell keeps every proof and return signal explicit, but auto-redispatch and auto-close remain blocked.",
    },
    workbenchPosture: "reopen_for_safety",
    dominantActionLabel: "Resolve loop-risk escalation before continuing recovery",
    checkpointQuestion:
      "What repeated recovery pattern triggered escalation, and which debt must clear before the case can continue again?",
    watchWindowSummary:
      "Loop-risk watch window is active and now outranks ordinary routine-reopen posture.",
    reopenSummary:
      "Supervisor review and contact repair are the dominant recovery posture until the escalation is settled.",
    supportSummary:
      "Promoted support region becomes a loop-risk recovery board with escalation, reopen diff, and suppressed patient messaging.",
    providerLabel: "Riverside Pharmacy",
    pathwayLabel: "Respiratory follow-up escalation",
    dueLabel: "Supervisor review now",
    defaultCheckpointId: "outcome",
    defaultLineItemId: "PHC-2215-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "watch",
        summary: "Consent is current, but it does not clear the escalated recovery debt.",
        evidenceLabel: "Escalation active",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "review_required",
        summary: "Validation must reopen with escalation and contact repair still visible.",
        evidenceLabel: "Supervisor route required",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "blocked",
        summary: "Inventory remains frozen during the escalated reopen.",
        evidenceLabel: "Reference only",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "blocked",
        summary: "Another automatic dispatch attempt is forbidden.",
        evidenceLabel: "Loop-risk blocked",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "blocked",
        summary: "Outcome remains unresolved until escalation settles.",
        evidenceLabel: "Loop risk high",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2215-L1",
        medicationLabel: "Bronchodilator review pack",
        instructionLabel: "One pack previously held",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 1,
        posture: "blocked",
        summary: "The held pack remains reference-only while supervisor review blocks recovery.",
        reconciliationLabel:
          "No release or redispatch can occur while loop risk and contact-route repair remain active.",
      },
      {
        lineItemId: "PHC-2215-L2",
        medicationLabel: "Contact repair script",
        instructionLabel: "Reachability repair note",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 10,
        posture: "manual_review",
        summary: "The repair script is now the dominant operational artifact for this case.",
        reconciliationLabel:
          "The patient message remains suppressed until the repair path is confirmed.",
      },
    ],
    gapRefs: [truthfulReopenGap],
  },
  {
    pharmacyCaseId: "PHC-2124",
    patientLabel: "Case 2124 / weak-match outcome",
    scenario: "weak_match_outcome",
    queueLane: "Weak-match outcome",
    queueTone: "critical",
    queueSummary:
      "Outcome evidence is present but weakly matched, so the case remains review-required rather than resolved.",
    caseSummary:
      "This case proves weak-match outcomes stay explicit and never tint the queue as complete.",
    consentState: "satisfied",
    consentSummary:
      "Consent remains current, so the review debt is anchored in the outcome lane.",
    inventoryPosture: "stale_review",
    inventorySummary:
      "Inventory proof is stale enough that the route falls back to table-first review.",
    proofState: "proof_pending",
    proofSummary:
      "Dispatch is already visible historically, but current closure truth is blocked by weak-match outcome evidence.",
    outcomeTruth: {
      outcomeTruthState: "weak_match",
      matchConfidenceLabel: "Weak match / 0.54 confidence",
      manualReviewState: "required",
      summary:
        "Outcome stays review-required because the best current match is weak and contradicted by timing context.",
    },
    dispatchTruth: {
      transportAcceptanceState: "ready",
      providerAcceptanceState: "ready",
      authoritativeProofState: "proof_pending",
      deadlineRisk: "watch",
      summary:
        "Historical dispatch exists, but present closure truth is not settled.",
    },
    workbenchPosture: "read_only",
    dominantActionLabel: "Review the weak-match outcome",
    checkpointQuestion:
      "Which outcome evidence is strong enough to support closure, and which parts remain weak or contradictory?",
    watchWindowSummary:
      "Outcome reconciliation watch window is active and keeps closure frozen.",
    reopenSummary:
      "If the weak match degrades further, the case can reopen rather than silently closing.",
    supportSummary:
      "Promoted support region becomes an outcome-reconciliation summary with explicit confidence.",
    providerLabel: "Canal Street Pharmacy",
    pathwayLabel: "Sinus treatment pathway",
    dueLabel: "Review by 15:24",
    defaultCheckpointId: "outcome",
    defaultLineItemId: "PHC-2124-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "satisfied",
        summary: "Consent remains current.",
        evidenceLabel: "Satisfied",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "satisfied",
        summary: "Validation packet remains current.",
        evidenceLabel: "Validated",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "watch",
        summary: "Inventory data is stale enough to require table-first review.",
        evidenceLabel: "Table-only parity",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "watch",
        summary: "Dispatch history is visible but not enough for closure.",
        evidenceLabel: "Historical dispatch only",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "review_required",
        summary: "Weak-match outcome blocks resolved posture.",
        evidenceLabel: "Weak match",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2124-L1",
        medicationLabel: "Nasal steroid spray",
        instructionLabel: "One spray pack",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 1,
        posture: "manual_review",
        summary: "Line item remains available, but outcome truth is not strong enough to settle.",
        reconciliationLabel: "Outcome review, not stock, is the current blocker.",
      },
      {
        lineItemId: "PHC-2124-L2",
        medicationLabel: "Aftercare note",
        instructionLabel: "Reference note",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 14,
        posture: "manual_review",
        summary: "Aftercare note stays visible as the current safe artifact.",
        reconciliationLabel: "Supporting evidence remains summary-first.",
      },
    ],
    gapRefs: [truthfulOutcomeGap],
  },
  {
    pharmacyCaseId: "PHC-2146",
    patientLabel: "Case 2146 / manual-review debt",
    scenario: "manual_review_debt",
    queueLane: "Manual-review debt",
    queueTone: "caution",
    queueSummary:
      "The case remains open because manual review debt still blocks quiet release or closure.",
    caseSummary:
      "This case proves a calm workbench can stay intentional while remaining observe-only.",
    consentState: "drifted",
    consentSummary:
      "Consent remains mostly aligned but needs renewal before final dispatch closure.",
    inventoryPosture: "stale_review",
    inventorySummary:
      "Inventory comparison is stale and has fallen back to table-first review.",
    proofState: "proof_pending",
    proofSummary:
      "Proof remains incomplete and the queue row stays explicitly pending.",
    outcomeTruth: {
      outcomeTruthState: "manual_review_debt",
      matchConfidenceLabel: "Manual review debt",
      manualReviewState: "required",
      summary:
        "Outcome remains open because the manual-review queue still owns the final decision.",
    },
    dispatchTruth: {
      transportAcceptanceState: "pending",
      providerAcceptanceState: "pending",
      authoritativeProofState: "proof_pending",
      deadlineRisk: "watch",
      summary:
        "Proof and review debt keep the case in observe-only posture.",
    },
    workbenchPosture: "read_only",
    dominantActionLabel: "Record the review debt intervention",
    checkpointQuestion:
      "What remains unresolved, and which safe intervention keeps the queue row truthful without implying closure?",
    watchWindowSummary:
      "Manual-review debt is visible and must remain part of the same continuity frame.",
    reopenSummary:
      "The case is already open; no quiet completion may appear while debt remains.",
    supportSummary:
      "Promoted support region shows review debt, not success posture.",
    providerLabel: "Station Road Pharmacy",
    pathwayLabel: "Conjunctivitis pathway",
    dueLabel: "Manual review queue / 16:00 target",
    defaultCheckpointId: "validation",
    defaultLineItemId: "PHC-2146-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "watch",
        summary: "Consent needs renewal before final closure.",
        evidenceLabel: "Renewal watch",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "review_required",
        summary: "Validation remains open under manual-review debt.",
        evidenceLabel: "Manual review required",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "watch",
        summary: "Inventory is visible in table-first review mode.",
        evidenceLabel: "Stale review",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "pending",
        summary: "Dispatch remains pending behind review debt.",
        evidenceLabel: "Pending",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "review_required",
        summary: "Outcome remains open because manual review is still owed.",
        evidenceLabel: "Manual-review debt",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2146-L1",
        medicationLabel: "Chloramphenicol drops",
        instructionLabel: "One bottle",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 1,
        posture: "manual_review",
        summary: "The line item is stable but still inside a manual-review queue.",
        reconciliationLabel: "No release or closure posture may appear yet.",
      },
      {
        lineItemId: "PHC-2146-L2",
        medicationLabel: "Observation note",
        instructionLabel: "One note",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 7,
        posture: "manual_review",
        summary: "Observation note remains the current safe explanation surface.",
        reconciliationLabel: "Summary-first note remains visible.",
      },
    ],
    gapRefs: [truthfulConsentGap, truthfulOutcomeGap],
  },
  {
    pharmacyCaseId: "PHC-2168",
    patientLabel: "Case 2168 / unmatched outcome",
    scenario: "unmatched_outcome",
    queueLane: "Unmatched outcome",
    queueTone: "critical",
    queueSummary:
      "Incoming outcome evidence could not be matched to a trusted case tuple, so the case stays visibly review-required.",
    caseSummary:
      "This case proves unmatched pharmacy outcomes stay explicit and cannot quietly dissolve into closure posture.",
    consentState: "satisfied",
    consentSummary:
      "Consent remains current for the chosen pharmacy, so the current blocker is unmatched outcome evidence rather than consent drift.",
    inventoryPosture: "stale_review",
    inventorySummary:
      "Inventory context is preserved for reference, but the assurance route falls back to evidence-first review until the outcome tuple is clarified.",
    proofState: "proof_pending",
    proofSummary:
      "Historical handoff proof remains visible, but unmatched outcome evidence keeps closure and reassurance frozen.",
    outcomeTruth: {
      outcomeTruthState: "unmatched_review",
      matchConfidenceLabel: "Unmatched / 0.18 confidence",
      manualReviewState: "required",
      summary:
        "Outcome remains unmatched and review-required because no trusted case tuple currently satisfies the reconciliation thresholds.",
    },
    dispatchTruth: {
      transportAcceptanceState: "ready",
      providerAcceptanceState: "ready",
      authoritativeProofState: "proof_pending",
      deadlineRisk: "watch",
      summary:
        "Prior dispatch proof is visible for context, but unmatched outcome evidence keeps the case explicitly non-calm.",
    },
    workbenchPosture: "read_only",
    dominantActionLabel: "Clarify or record the unmatched outcome",
    checkpointQuestion:
      "Which incoming outcome fields are trustworthy enough to reconcile, and which mismatches must stay explicit until reviewed?",
    watchWindowSummary:
      "Outcome reconciliation watch window remains active until the unmatched evidence is clarified or formally recorded.",
    reopenSummary:
      "Closure remains frozen while the outcome is unmatched; the same shell keeps the latest safe context visible.",
    supportSummary:
      "Promoted support region becomes an unmatched-outcome assurance summary with explicit confidence and close blockers.",
    providerLabel: "Harbour Pharmacy",
    pathwayLabel: "UTI treatment pathway",
    dueLabel: "Clarify by 15:40",
    defaultCheckpointId: "outcome",
    defaultLineItemId: "PHC-2168-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "satisfied",
        summary: "Consent remains current for the chosen pharmacy.",
        evidenceLabel: "Satisfied",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "watch",
        summary: "Validation remains reference-only while the outcome tuple is clarified.",
        evidenceLabel: "Clarification watch",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "watch",
        summary: "Inventory evidence stays visible in table-first review mode.",
        evidenceLabel: "Reference inventory only",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "watch",
        summary: "Dispatch history remains visible but cannot settle the unmatched outcome.",
        evidenceLabel: "Historical proof only",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "review_required",
        summary: "No trusted case tuple currently supports closure.",
        evidenceLabel: "Unmatched",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2168-L1",
        medicationLabel: "Nitrofurantoin 100mg",
        instructionLabel: "One course held for reference",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 2,
        posture: "manual_review",
        summary: "Medication context remains visible, but the unmatched outcome is the current blocker.",
        reconciliationLabel: "Outcome clarification, not stock, is the governing blocker.",
      },
      {
        lineItemId: "PHC-2168-L2",
        medicationLabel: "Outcome note",
        instructionLabel: "Imported summary note",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 12,
        posture: "manual_review",
        summary: "The imported note stays visible as provenance until the unmatched evidence is resolved.",
        reconciliationLabel: "Imported note remains explicit as read-only evidence.",
      },
    ],
    gapRefs: [truthfulOutcomeGap],
  },
  {
    pharmacyCaseId: "PHC-2232",
    patientLabel: "Case 2232 / waiting for patient choice",
    scenario: "clarification_required",
    queueLane: "Waiting for patient choice",
    queueTone: "watch",
    queueSummary:
      "The ranked provider set is still valid, but the warned-choice acknowledgement has not yet been confirmed, so the case must stay operationally open.",
    caseSummary:
      "This case proves the console can hold a genuine waiting-for-choice posture without collapsing back into a vague pending queue.",
    consentState: "clarification_required",
    consentSummary:
      "Consent checkpoint is waiting for the warned-choice acknowledgement and may not silently drift into a calm state.",
    inventoryPosture: "live",
    inventorySummary:
      "Inventory truth remains current for the shortlisted provider, but no release work may start until the choice contract is affirmed.",
    proofState: "proof_pending",
    proofSummary:
      "Dispatch proof remains intentionally pending while the patient-choice contract is unfinished.",
    outcomeTruth: {
      outcomeTruthState: "outcome_pending",
      matchConfidenceLabel: "Outcome pending",
      manualReviewState: "clear",
      summary:
        "Outcome remains pending because the case is still upstream of provider confirmation and release.",
    },
    dispatchTruth: {
      transportAcceptanceState: "pending",
      providerAcceptanceState: "pending",
      authoritativeProofState: "proof_pending",
      deadlineRisk: "watch",
      summary:
        "The workbench preserves queue position and ranked-provider truth while waiting for the patient-choice burden to clear.",
    },
    workbenchPosture: "guarded",
    dominantActionLabel: "Confirm the warned-choice acknowledgement",
    checkpointQuestion:
      "Which warning or override acknowledgement is still outstanding before the ranked provider can become the governed choice?",
    watchWindowSummary:
      "Choice acknowledgement watch window stays open for another 22 minutes and keeps the case pinned to the same shell.",
    reopenSummary:
      "No reopen posture is active, but the queue must stay explicit while the patient-choice contract is incomplete.",
    supportSummary:
      "Promoted support region keeps the current inventory truth visible while the case waits on choice, not transport.",
    providerLabel: "City Quays Pharmacy",
    pathwayLabel: "Minor illness choice pathway",
    dueLabel: "Choice acknowledgement by 15:52",
    defaultCheckpointId: "consent",
    defaultLineItemId: "PHC-2232-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Choice checkpoint",
        state: "review_required",
        summary: "Warned-choice acknowledgement is still missing.",
        evidenceLabel: "Acknowledgement pending",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "watch",
        summary: "Clinical validation is ready to continue once the choice contract is confirmed.",
        evidenceLabel: "Awaiting patient choice",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "satisfied",
        summary: "Current stock tuple stays visible for the shortlisted provider.",
        evidenceLabel: "Fresh inventory truth",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "pending",
        summary: "Dispatch cannot progress while the provider choice is unfinished.",
        evidenceLabel: "Pending choice contract",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "pending",
        summary: "Outcome remains upstream of dispatch and provider selection.",
        evidenceLabel: "Pending",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2232-L1",
        medicationLabel: "Sore throat relief pack",
        instructionLabel: "One course held for the recommended provider",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 3,
        posture: "clarification_required",
        summary: "The pack is currently held, but release remains fenced until the warned-choice contract is confirmed.",
        reconciliationLabel:
          "Choice acknowledgement, not stock, is the active blocker on this line.",
      },
      {
        lineItemId: "PHC-2232-L2",
        medicationLabel: "Choice explanation note",
        instructionLabel: "Provider warning summary",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 8,
        posture: "manual_review",
        summary: "The explanation note remains the visible safe artifact while the patient confirms the choice.",
        reconciliationLabel:
          "The warning copy stays pinned to the same case and line anchor.",
      },
    ],
    operationsStateRefs: [
      "active_case",
      "waiting_for_patient_choice",
      "validation_due",
    ],
    providerHealthState: "nominal",
    watchWindowState: "watch",
    blockingReasonCodes: [
      "warned_choice_acknowledgement_required",
      "consent_checkpoint_pending",
    ],
    recoveryOwnerLabel: "Practice coordination desk",
    gapRefs: [truthfulConsentGap, futureFlowGap],
  },
  {
    pharmacyCaseId: "PHC-2244",
    patientLabel: "Case 2244 / provider outage hold",
    scenario: "proof_pending",
    queueLane: "Provider outage",
    queueTone: "critical",
    queueSummary:
      "The chosen provider is in a temporary outage posture, so the case stays visible in one bounded queue row instead of disappearing behind a silent retry.",
    caseSummary:
      "This case proves provider-health failure can stay legible in the same shell without tearing the operator into a second outage tool.",
    consentState: "satisfied",
    consentSummary:
      "Consent remains valid for the chosen provider, but the outage blocks any new handoff release work.",
    inventoryPosture: "live",
    inventorySummary:
      "Inventory truth is current and ready, yet the case stays gated by provider-health posture rather than local stock.",
    proofState: "proof_pending",
    proofSummary:
      "Transport proof stays provisional because the provider outage pauses the governed handoff window.",
    outcomeTruth: {
      outcomeTruthState: "outcome_pending",
      matchConfidenceLabel: "Outcome pending",
      manualReviewState: "pending",
      summary:
        "Outcome remains pending because the case cannot leave the outage hold posture yet.",
    },
    dispatchTruth: {
      transportAcceptanceState: "pending",
      providerAcceptanceState: "pending",
      authoritativeProofState: "proof_pending",
      deadlineRisk: "breach_risk",
      summary:
        "Provider-health outage keeps settlement and handoff posture explicit while the queue row remains operationally visible.",
    },
    workbenchPosture: "guarded",
    dominantActionLabel: "Review the provider outage hold",
    checkpointQuestion:
      "Which provider-health or transport condition still blocks the current handoff window, and what is the safest next action while the outage holds?",
    watchWindowSummary:
      "Handoff watch window is blocked by provider-health outage and remains pinned to the current case.",
    reopenSummary:
      "No reopen posture is active, but quiet continuation is forbidden while the outage hold persists.",
    supportSummary:
      "Promoted support region becomes a handoff-readiness board with explicit outage and settlement posture.",
    providerLabel: "Marina East Pharmacy",
    pathwayLabel: "Respiratory support pathway",
    dueLabel: "Outage review in 12m",
    defaultCheckpointId: "dispatch",
    defaultLineItemId: "PHC-2244-L1",
    checkpoints: [
      {
        checkpointId: "consent",
        label: "Consent",
        state: "satisfied",
        summary: "Consent remains current for the chosen provider.",
        evidenceLabel: "Satisfied",
      },
      {
        checkpointId: "validation",
        label: "Validation",
        state: "satisfied",
        summary: "Validation packet is still current and ready when the outage clears.",
        evidenceLabel: "Ready / outage gated",
      },
      {
        checkpointId: "inventory",
        label: "Inventory",
        state: "satisfied",
        summary: "Held stock remains current for the active line item.",
        evidenceLabel: "Fresh stock held",
      },
      {
        checkpointId: "dispatch",
        label: "Dispatch",
        state: "blocked",
        summary: "Provider outage blocks handoff and keeps the queue row explicit.",
        evidenceLabel: "Provider outage hold",
      },
      {
        checkpointId: "outcome",
        label: "Outcome",
        state: "pending",
        summary: "Outcome remains pending until the outage posture clears.",
        evidenceLabel: "Pending",
      },
    ],
    lineItems: [
      {
        lineItemId: "PHC-2244-L1",
        medicationLabel: "Salbutamol relief pack",
        instructionLabel: "One pack fully held",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 4,
        posture: "ready",
        summary: "Stock and validation are ready, but the outage keeps the line inside release hold.",
        reconciliationLabel:
          "Provider-health posture, not stock, is the current blocker.",
      },
      {
        lineItemId: "PHC-2244-L2",
        medicationLabel: "Outage contingency note",
        instructionLabel: "Transport contingency plan",
        requestedUnits: 1,
        reservedUnits: 1,
        availableUnits: 9,
        posture: "manual_review",
        summary: "The contingency note remains visible while the chosen provider is unavailable.",
        reconciliationLabel:
          "Escalation guidance stays attached to the same case and line anchor.",
      },
    ],
    operationsStateRefs: [
      "active_case",
      "provider_outage",
      "handoff_blocked",
    ],
    providerHealthState: "outage",
    watchWindowState: "blocked",
    blockingReasonCodes: [
      "provider_connectivity_outage",
      "handoff_window_paused",
    ],
    recoveryOwnerLabel: "Pharmacy operations supervisor",
    gapRefs: [providerSpecificGap],
  },
] as const;

export function derivePharmacyOperationsStateRefs(
  caseSeed: PharmacyCaseSeed,
): readonly PharmacyOperationsStateRef[] {
  if (caseSeed.operationsStateRefs?.length) {
    return caseSeed.operationsStateRefs;
  }

  const states = new Set<PharmacyOperationsStateRef>(["active_case"]);
  switch (caseSeed.scenario) {
    case "proof_pending":
      states.add("waiting_for_outcome");
      break;
    case "contradictory_proof":
      states.add("transport_failure");
      states.add("handoff_blocked");
      break;
    case "partial_supply":
      states.add("stock_risk");
      break;
    case "clarification_required":
      states.add("validation_due");
      break;
    case "urgent_return":
      states.add("bounce_back");
      states.add("handoff_blocked");
      break;
    case "weak_match_outcome":
    case "manual_review_debt":
    case "unmatched_outcome":
      states.add("waiting_for_outcome");
      states.add("validation_due");
      break;
    case "ready_to_dispatch":
    default:
      break;
  }

  if (caseSeed.inventoryPosture === "partial_supply" || caseSeed.inventoryPosture === "blocked") {
    states.add("stock_risk");
  }
  if (caseSeed.dispatchTruth.authoritativeProofState === "contradictory_proof") {
    states.add("handoff_blocked");
  }
  return [...states];
}

export function derivePharmacyProviderHealthState(
  caseSeed: PharmacyCaseSeed,
): PharmacyProviderHealthState {
  if (caseSeed.providerHealthState) {
    return caseSeed.providerHealthState;
  }
  if (
    caseSeed.scenario === "contradictory_proof" ||
    caseSeed.scenario === "urgent_return"
  ) {
    return "degraded";
  }
  return "nominal";
}

export function derivePharmacyWatchWindowState(
  caseSeed: PharmacyCaseSeed,
): PharmacyWatchWindowState {
  if (caseSeed.watchWindowState) {
    return caseSeed.watchWindowState;
  }
  switch (caseSeed.workbenchPosture) {
    case "ready":
      return "clear";
    case "guarded":
      return "watch";
    case "read_only":
    case "reopen_for_safety":
      return "blocked";
  }
}

export function derivePharmacyBlockingReasonCodes(
  caseSeed: PharmacyCaseSeed,
): readonly string[] {
  if (caseSeed.blockingReasonCodes?.length) {
    return caseSeed.blockingReasonCodes;
  }
  switch (caseSeed.scenario) {
    case "proof_pending":
      return ["authoritative_proof_pending"];
    case "contradictory_proof":
      return ["transport_confirmation_drift", "authoritative_proof_disputed"];
    case "partial_supply":
      return ["inventory_partial_supply"];
    case "clarification_required":
      return ["provider_choice_clarification_required"];
    case "urgent_return":
      return ["bounce_back_return_signal_active", "quiet_closure_suppressed"];
    case "weak_match_outcome":
      return ["outcome_match_confidence_low"];
    case "manual_review_debt":
      return ["manual_review_debt_open"];
    case "unmatched_outcome":
      return ["outcome_unmatched_review"];
    case "ready_to_dispatch":
    default:
      return [];
  }
}

export function derivePharmacyRecoveryOwnerLabel(
  caseSeed: PharmacyCaseSeed,
): string {
  if (caseSeed.recoveryOwnerLabel) {
    return caseSeed.recoveryOwnerLabel;
  }
  switch (caseSeed.scenario) {
    case "contradictory_proof":
      return "Dispatch proof steward";
    case "urgent_return":
      return "Pharmacy recovery lead";
    case "weak_match_outcome":
    case "manual_review_debt":
    case "unmatched_outcome":
      return "Outcome assurance desk";
    case "clarification_required":
      return "Pharmacy validation desk";
    case "partial_supply":
      return "Stock reconciliation pharmacist";
    case "proof_pending":
      return "On-duty pharmacist";
    case "ready_to_dispatch":
    default:
      return "Pharmacy console";
  }
}

const casesById = new Map(
  pharmacyCases.map((caseSeed) => [caseSeed.pharmacyCaseId, caseSeed] as const),
);

function normalizeChildRoute(segment: string | undefined): PharmacyChildRouteKey | null {
  switch (segment) {
    case "validate":
    case "inventory":
    case "resolve":
    case "handoff":
    case "assurance":
      return segment;
    default:
      return null;
  }
}

export function rootPathForPharmacy(): string {
  return PHARMACY_DEFAULT_PATH;
}

export function casePathForPharmacy(pharmacyCaseId: string): string {
  return `/workspace/pharmacy/${pharmacyCaseId}`;
}

export function childPathForPharmacy(
  pharmacyCaseId: string,
  childRouteKey: PharmacyChildRouteKey,
): string {
  return `${casePathForPharmacy(pharmacyCaseId)}/${childRouteKey}`;
}

export function parsePharmacyPath(pathname: string): PharmacyLocation {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "workspace" || segments[1] !== "pharmacy") {
    return {
      pathname: PHARMACY_DEFAULT_PATH,
      routeKey: "lane",
      routeFamilyRef: "rf_pharmacy_console",
      pharmacyCaseId: null,
      childRouteKey: null,
    };
  }

  const pharmacyCaseId = segments[2] ?? null;
  const childRouteKey = normalizeChildRoute(segments[3]);
  let routeKey: PharmacyRouteKey = "lane";
  if (pharmacyCaseId && childRouteKey) {
    routeKey = childRouteKey;
  } else if (pharmacyCaseId) {
    routeKey = "case";
  }

  return {
    pathname:
      pharmacyCaseId && childRouteKey
        ? childPathForPharmacy(pharmacyCaseId, childRouteKey)
        : pharmacyCaseId
          ? casePathForPharmacy(pharmacyCaseId)
          : PHARMACY_DEFAULT_PATH,
    routeKey,
    routeFamilyRef: "rf_pharmacy_console",
    pharmacyCaseId,
    childRouteKey,
  };
}

export function caseForPharmacyId(
  pharmacyCaseId: string | null | undefined,
): PharmacyCaseSeed {
  return casesById.get(pharmacyCaseId ?? "") ?? pharmacyCases[1]!;
}

function checkpointForId(
  caseSeed: PharmacyCaseSeed,
  checkpointId: string | null | undefined,
): PharmacyCheckpoint {
  return (
    caseSeed.checkpoints.find((checkpoint) => checkpoint.checkpointId === checkpointId) ??
    caseSeed.checkpoints.find(
      (checkpoint) => checkpoint.checkpointId === caseSeed.defaultCheckpointId,
    ) ??
    caseSeed.checkpoints[0]!
  );
}

function lineItemForId(
  caseSeed: PharmacyCaseSeed,
  lineItemId: string | null | undefined,
): PharmacyLineItem {
  return (
    caseSeed.lineItems.find((lineItem) => lineItem.lineItemId === lineItemId) ??
    caseSeed.lineItems.find(
      (lineItem) => lineItem.lineItemId === caseSeed.defaultLineItemId,
    ) ??
    caseSeed.lineItems[0]!
  );
}

function defaultCheckpointIdForLocation(
  location: PharmacyLocation,
  caseSeed: PharmacyCaseSeed,
): string {
  switch (location.routeKey) {
    case "inventory":
      return "inventory";
    case "resolve":
    case "assurance":
      return "outcome";
    case "handoff":
      return "dispatch";
    case "validate":
      return "validation";
    case "lane":
      return caseSeed.defaultCheckpointId;
    case "case":
    default:
      return caseSeed.defaultCheckpointId;
  }
}

function anchorKeyForLocation(location: PharmacyLocation): string {
  switch (location.routeKey) {
    case "lane":
      return "pharmacy-lane";
    case "resolve":
    case "handoff":
    case "assurance":
      return "pharmacy-decision";
    case "case":
    case "validate":
    case "inventory":
    default:
      return "pharmacy-validation";
  }
}

function runtimeScenarioForCase(caseSeed: PharmacyCaseSeed): RuntimeScenario {
  if (
    caseSeed.workbenchPosture === "reopen_for_safety" ||
    caseSeed.proofState === "contradictory_proof" ||
    caseSeed.consentState === "revoked"
  ) {
    return "recovery_only";
  }
  if (
    caseSeed.workbenchPosture === "read_only" ||
    caseSeed.workbenchPosture === "guarded" ||
    caseSeed.inventoryPosture === "stale_review"
  ) {
    return "read_only";
  }
  return "live";
}

function createPharmacyReturnToken(
  originPath: string,
  caseSeed: PharmacyCaseSeed,
  lineItemId: string,
  checkpointId: string,
): PharmacyReturnToken {
  return {
    returnTokenId: `PRT_${caseSeed.pharmacyCaseId}`,
    originPath,
    pharmacyCaseId: caseSeed.pharmacyCaseId,
    lineItemId,
    checkpointId,
    issuedAt: "2026-04-14T09:18:00Z",
  };
}

function createPharmacyTelemetryEnvelope(
  eventClass: UiTelemetryEventClass,
  payload: Record<string, string | number | boolean | null>,
  surfaceState?: {
    selectedAnchorRef?: string;
    dominantActionRef?: string;
    focusRestoreRef?: string;
    artifactModeState?: string;
    recoveryPosture?: "live" | "read_only" | "recovery_only" | "blocked";
    visualizationAuthority?: "visual_table_summary" | "table_only" | "summary_only";
    routeShellPosture?: string;
  },
): UiTelemetryEnvelopeExample {
  const normalizedPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, String(value ?? "")]),
  );
  return createUiTelemetryEnvelope({
    scenarioId: PHARMACY_TELEMETRY_SCENARIO_ID,
    routeFamilyRef: "rf_pharmacy_console",
    sourceSurface: PHARMACY_SOURCE_SURFACE,
    eventClass,
    payload: normalizedPayload,
    surfaceState,
  });
}

function continuitySnapshotForState(
  location: PharmacyLocation,
  caseSeed: PharmacyCaseSeed,
  snapshot?: ContinuitySnapshot,
): ContinuitySnapshot {
  const nextSnapshot =
    snapshot ??
    createInitialContinuitySnapshot({
      shellSlug: PHARMACY_SHELL_SLUG,
      routeFamilyRef: pharmacyClaim.routeFamilyRef,
      anchorKey: anchorKeyForLocation(location),
      runtimeScenario: runtimeScenarioForCase(caseSeed),
    });
  const anchorKey = anchorKeyForLocation(location);
  let resolved = nextSnapshot;
  if (resolved.activeRouteFamilyRef !== pharmacyClaim.routeFamilyRef) {
    resolved = navigateWithinShell(resolved, pharmacyClaim.routeFamilyRef, {
      runtimeScenario: runtimeScenarioForCase(caseSeed),
      timestamp: "2026-04-14T09:19:00Z",
    }).snapshot;
  }
  if (resolved.selectedAnchor.anchorKey !== anchorKey) {
    resolved = selectAnchorInSnapshot(resolved, anchorKey, "2026-04-14T09:20:00Z");
  }
  return resolved;
}

function macroStateForCase(caseSeed: PharmacyCaseSeed): StatusTruthInput["authority"]["macroStateRef"] {
  switch (caseSeed.scenario) {
    case "ready_to_dispatch":
      return "reviewing_next_steps";
    case "proof_pending":
      return "awaiting_external";
    case "partial_supply":
      return "reviewing_next_steps";
    case "clarification_required":
      return "action_required";
    case "contradictory_proof":
      return "blocked";
    case "urgent_return":
      return "recovery_required";
    case "weak_match_outcome":
    case "manual_review_debt":
    case "unmatched_outcome":
      return "in_review";
  }
}

function trustStateForCase(
  caseSeed: PharmacyCaseSeed,
): StatusTruthInput["authority"]["projectionTrustState"] {
  switch (caseSeed.scenario) {
    case "ready_to_dispatch":
      return "trusted";
    case "proof_pending":
    case "partial_supply":
      return "partial";
    case "clarification_required":
    case "weak_match_outcome":
    case "manual_review_debt":
    case "unmatched_outcome":
      return "degraded";
    case "contradictory_proof":
    case "urgent_return":
      return "blocked";
  }
}

function freshnessStateForCase(
  caseSeed: PharmacyCaseSeed,
): StatusTruthInput["freshnessEnvelope"]["projectionFreshnessState"] {
  switch (caseSeed.scenario) {
    case "ready_to_dispatch":
      return "fresh";
    case "proof_pending":
    case "partial_supply":
      return "updating";
    case "clarification_required":
    case "weak_match_outcome":
    case "manual_review_debt":
    case "unmatched_outcome":
      return "stale_review";
    case "contradictory_proof":
    case "urgent_return":
      return "blocked_recovery";
  }
}

function transportStateForCase(
  caseSeed: PharmacyCaseSeed,
): StatusTruthInput["freshnessEnvelope"]["transportState"] {
  switch (caseSeed.scenario) {
    case "ready_to_dispatch":
      return "live";
    case "proof_pending":
    case "partial_supply":
      return "reconnecting";
    case "clarification_required":
    case "weak_match_outcome":
    case "manual_review_debt":
    case "unmatched_outcome":
      return "paused";
    case "contradictory_proof":
    case "urgent_return":
      return "disconnected";
  }
}

function actionabilityStateForCase(
  caseSeed: PharmacyCaseSeed,
): StatusTruthInput["freshnessEnvelope"]["actionabilityState"] {
  switch (caseSeed.workbenchPosture) {
    case "ready":
      return "live";
    case "guarded":
      return "guarded";
    case "read_only":
      return "frozen";
    case "reopen_for_safety":
      return "recovery_only";
  }
}

function recoveryPostureForCase(
  caseSeed: PharmacyCaseSeed,
): "live" | "read_only" | "recovery_only" | "blocked" {
  if (caseSeed.scenario === "urgent_return") {
    return "recovery_only";
  }
  if (
    caseSeed.scenario === "contradictory_proof" ||
    caseSeed.scenario === "clarification_required"
  ) {
    return "read_only";
  }
  if (
    caseSeed.scenario === "weak_match_outcome" ||
    caseSeed.scenario === "unmatched_outcome" ||
    caseSeed.scenario === "manual_review_debt" ||
    caseSeed.scenario === "partial_supply" ||
    caseSeed.scenario === "proof_pending"
  ) {
    return "read_only";
  }
  return "live";
}

function visualizationModeForCase(
  caseSeed: PharmacyCaseSeed,
): PharmacyVisualizationMode {
  switch (caseSeed.inventoryPosture) {
    case "live":
    case "partial_supply":
      return "chart_plus_table";
    case "stale_review":
      return "table_only";
    case "blocked":
      return "summary_only";
  }
}

function authoritativeOutcomeForCase(
  caseSeed: PharmacyCaseSeed,
): StatusTruthInput["authoritativeOutcomeState"] {
  switch (caseSeed.outcomeTruth.outcomeTruthState) {
    case "settled_resolved":
      return "settled";
    case "weak_match":
    case "manual_review_debt":
    case "unmatched_review":
      return "review_required";
    case "urgent_return":
      return "recovery_required";
    case "outcome_pending":
    default:
      return "pending";
  }
}

function pendingExternalStateForCase(
  caseSeed: PharmacyCaseSeed,
): StatusTruthInput["pendingExternalState"] {
  switch (caseSeed.scenario) {
    case "proof_pending":
      return "awaiting_confirmation";
    case "clarification_required":
      return "awaiting_reply";
    case "manual_review_debt":
    case "weak_match_outcome":
    case "unmatched_outcome":
      return "awaiting_ack";
    default:
      return "none";
  }
}

function statusInputForCase(
  caseSeed: PharmacyCaseSeed,
  snapshot: ContinuitySnapshot,
): StatusTruthInput {
  return {
    audience: "pharmacy",
    authority: {
      authorityId: `pharmacy-status::${caseSeed.pharmacyCaseId}`,
      macroStateRef: macroStateForCase(caseSeed),
      bundleVersion: "FCM_120_PHARMACY_SHELL_SEED_V1",
      audienceTier: "professional",
      shellFreshnessEnvelopeRef: `pharmacy-freshness::${caseSeed.pharmacyCaseId}`,
      projectionTrustState: trustStateForCase(caseSeed),
      ownedSignalClasses: ["freshness", "trust", "dominant_action", "recovery"],
      localSignalSuppressionRef:
        caseSeed.scenario === "contradictory_proof" ||
        caseSeed.scenario === "urgent_return"
          ? "settled_reassurance_suppressed"
          : "none",
      degradeMode:
        caseSeed.workbenchPosture === "reopen_for_safety"
          ? "recovery_required"
          : caseSeed.workbenchPosture === "ready"
            ? "quiet_pending"
            : "refresh_required",
    },
    freshnessEnvelope: {
      projectionFreshnessEnvelopeId: `pharmacy-freshness::${caseSeed.pharmacyCaseId}`,
      continuityKey: snapshot.selectedAnchor.continuityFrameRef,
      entityScope: caseSeed.pharmacyCaseId,
      surfaceRef: pharmacyClaim.routeFamilyRef,
      selectedAnchorRef: snapshot.selectedAnchor.anchorId,
      consistencyClass: "command_following",
      scope: "shell",
      projectionFreshnessState: freshnessStateForCase(caseSeed),
      transportState: transportStateForCase(caseSeed),
      actionabilityState: actionabilityStateForCase(caseSeed),
      lastProjectionVersionRef: `pharmacy-projection::${caseSeed.pharmacyCaseId}`,
      lastCausalTokenApplied: `pharmacy-cause::${caseSeed.pharmacyCaseId}`,
      lastKnownGoodSnapshotRef: `pharmacy-snapshot::${caseSeed.pharmacyCaseId}`,
      lastKnownGoodAt: "2026-04-14T09:21:00Z",
      staleAfterAt: "2026-04-14T09:48:00Z",
      reasonRefs: [...caseSeed.gapRefs],
      localizedDegradationRefs:
        caseSeed.workbenchPosture === "ready"
          ? []
          : [`degraded::${caseSeed.pharmacyCaseId}`],
      derivedFromRefs: [
        "PharmacyConsoleSummaryProjection",
        "PharmacyDispatchTruthProjection",
        "PharmacyOutcomeTruthProjection",
      ],
      evaluatedAt: "2026-04-14T09:22:00Z",
    },
    localFeedbackState: "shown",
    processingAcceptanceState:
      caseSeed.scenario === "ready_to_dispatch"
        ? "accepted_for_processing"
        : caseSeed.workbenchPosture === "reopen_for_safety"
          ? "awaiting_external_confirmation"
          : "accepted_for_processing",
    pendingExternalState: pendingExternalStateForCase(caseSeed),
    authoritativeOutcomeState: authoritativeOutcomeForCase(caseSeed),
    saveState: "saved",
    dominantActionLabel: caseSeed.dominantActionLabel,
    lastChangedAt: "2026-04-14T09:24:00Z",
    provenanceLabel: "Seeded pharmacy console projection",
  };
}

function casePulseForCase(
  caseSeed: PharmacyCaseSeed,
  snapshot: ContinuitySnapshot,
): CasePulseContract {
  const macroState = macroStateForCase(caseSeed);
  return {
    entityRef: caseSeed.pharmacyCaseId,
    entityType: "Pharmacy case",
    audience: "pharmacy",
    macroState,
    headline: caseSeed.patientLabel,
    subheadline: caseSeed.caseSummary,
    primaryNextActionLabel: caseSeed.dominantActionLabel,
    ownershipOrActorSummary:
      "Pharmacy console continuity keeps one case, one active line item, and one dominant action in the same shell.",
    urgencyBand:
      caseSeed.queueTone === "critical"
        ? "Safety-first review"
        : caseSeed.queueTone === "caution"
          ? "Guarded review"
          : caseSeed.queueTone === "success"
            ? "Ready to proceed"
            : "Watch posture",
    confirmationPosture:
      caseSeed.scenario === "ready_to_dispatch"
        ? "Proof is ready, but the shell still waits for the governed handoff action."
        : caseSeed.scenario === "urgent_return"
          ? "Urgent return has authority over ordinary release or closure."
          : "The shell keeps the current case summary visible while truth or consent still needs review.",
    lastMeaningfulUpdateAt: "2026-04-14T09:24:00Z",
    changedSinceSeen:
      caseSeed.workbenchPosture === "reopen_for_safety"
        ? "Reopen-for-safety posture is currently active."
        : `Selected anchor ${snapshot.selectedAnchor.lastKnownLabel} remains pinned inside the pharmacy shell.`,
    stateAxes: [
      {
        key: "lifecycle",
        label: "Lifecycle",
        value: macroState.replaceAll("_", " "),
        detail: "Checkpoint posture stays subordinate to the current canonical case tuple.",
      },
      {
        key: "ownership",
        label: "Ownership",
        value: "Pharmacy console",
        detail: "One dominant action remains visible without collapsing into a generic staff shell.",
      },
      {
        key: "trust",
        label: "Trust",
        value: trustStateForCase(caseSeed),
        detail: "Consent, proof, inventory, and outcome truth stay explicit.",
      },
      {
        key: "urgency",
        label: "Urgency",
        value: caseSeed.queueLane,
        detail: "Signal grammar, not banner theatre, carries consequence.",
      },
      {
        key: "interaction",
        label: "Interaction",
        value: snapshot.selectedAnchor.lastKnownLabel,
        detail: "Selected case, line item, and checkpoint stay within one continuity frame.",
      },
    ],
  };
}

function appendTelemetry(
  state: PharmacyShellState,
  eventClass: UiTelemetryEventClass,
  payload: Record<string, string | number | boolean | null>,
): readonly UiTelemetryEnvelopeExample[] {
  return [
    ...state.telemetry,
    createPharmacyTelemetryEnvelope(eventClass, payload, {
      selectedAnchorRef: state.continuitySnapshot.selectedAnchor.anchorId,
      dominantActionRef: state.selectedCaseId,
      focusRestoreRef: state.activeLineItemId,
      artifactModeState: visualizationModeForCase(caseForPharmacyId(state.selectedCaseId)),
      recoveryPosture: recoveryPostureForCase(caseForPharmacyId(state.selectedCaseId)),
      visualizationAuthority:
        visualizationModeForCase(caseForPharmacyId(state.selectedCaseId)) === "chart_plus_table"
          ? "visual_table_summary"
          : visualizationModeForCase(caseForPharmacyId(state.selectedCaseId)) === "table_only"
            ? "table_only"
            : "summary_only",
      routeShellPosture:
        recoveryPostureForCase(caseForPharmacyId(state.selectedCaseId)) === "live"
          ? "shell_live"
          : recoveryPostureForCase(caseForPharmacyId(state.selectedCaseId)) === "read_only"
            ? "shell_read_only"
            : "shell_recovery",
    }),
  ];
}

function resolveSelectedCaseId(
  location: PharmacyLocation,
  selectedCaseId?: string,
): string {
  return caseForPharmacyId(location.pharmacyCaseId ?? selectedCaseId).pharmacyCaseId;
}

export function createInitialPharmacyShellState(
  pathname: string = PHARMACY_DEFAULT_PATH,
  options: {
    selectedCaseId?: string;
    activeCheckpointId?: string;
    activeLineItemId?: string;
  } = {},
): PharmacyShellState {
  const location = parsePharmacyPath(pathname);
  const selectedCaseId = resolveSelectedCaseId(location, options.selectedCaseId);
  const caseSeed = caseForPharmacyId(selectedCaseId);
  const activeCheckpointId =
    options.activeCheckpointId ?? defaultCheckpointIdForLocation(location, caseSeed);
  const activeLineItemId = options.activeLineItemId ?? caseSeed.defaultLineItemId;
  const continuitySnapshot = continuitySnapshotForState(location, caseSeed);
  return {
    location,
    continuitySnapshot,
    selectedCaseId,
    activeCheckpointId,
    activeLineItemId,
    returnToken:
      location.childRouteKey !== null
        ? createPharmacyReturnToken(
            casePathForPharmacy(selectedCaseId),
            caseSeed,
            activeLineItemId,
            activeCheckpointId,
          )
        : null,
    runtimeScenario: runtimeScenarioForCase(caseSeed),
    telemetry: [
      createPharmacyTelemetryEnvelope(
        "surface_enter",
        {
          pathname: location.pathname,
          pharmacyCaseId: selectedCaseId,
          checkpointId: activeCheckpointId,
          lineItemId: activeLineItemId,
          proofState: caseSeed.proofState,
        },
        {
          selectedAnchorRef: continuitySnapshot.selectedAnchor.anchorId,
          dominantActionRef: selectedCaseId,
          focusRestoreRef: activeLineItemId,
          artifactModeState: visualizationModeForCase(caseSeed),
          recoveryPosture: recoveryPostureForCase(caseSeed),
          visualizationAuthority:
            visualizationModeForCase(caseSeed) === "chart_plus_table"
              ? "visual_table_summary"
              : visualizationModeForCase(caseSeed) === "table_only"
                ? "table_only"
                : "summary_only",
          routeShellPosture:
            recoveryPostureForCase(caseSeed) === "live"
              ? "shell_live"
              : recoveryPostureForCase(caseSeed) === "read_only"
                ? "shell_read_only"
                : "shell_recovery",
        },
      ),
    ],
  };
}

export function openPharmacyCase(
  state: PharmacyShellState,
  pharmacyCaseId: string,
): PharmacyShellState {
  const location = parsePharmacyPath(casePathForPharmacy(pharmacyCaseId));
  const caseSeed = caseForPharmacyId(pharmacyCaseId);
  const activeCheckpointId = caseSeed.defaultCheckpointId;
  const activeLineItemId = caseSeed.defaultLineItemId;
  const continuitySnapshot = continuitySnapshotForState(location, caseSeed, state.continuitySnapshot);
  const nextState: PharmacyShellState = {
    ...state,
    location,
    continuitySnapshot,
    selectedCaseId: pharmacyCaseId,
    activeCheckpointId,
    activeLineItemId,
    returnToken: null,
    runtimeScenario: runtimeScenarioForCase(caseSeed),
    telemetry: state.telemetry,
  };
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, "selected_anchor_changed", {
      pathname: location.pathname,
      pharmacyCaseId,
      checkpointId: activeCheckpointId,
      lineItemId: activeLineItemId,
      proofState: caseSeed.proofState,
    }),
  };
}

export function selectPharmacyCheckpoint(
  state: PharmacyShellState,
  checkpointId: string,
): PharmacyShellState {
  const caseSeed = caseForPharmacyId(state.selectedCaseId);
  const activeCheckpoint = checkpointForId(caseSeed, checkpointId);
  const nextState: PharmacyShellState = {
    ...state,
    activeCheckpointId: activeCheckpoint.checkpointId,
    telemetry: state.telemetry,
  };
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, "selected_anchor_changed", {
      pharmacyCaseId: caseSeed.pharmacyCaseId,
      checkpointId: activeCheckpoint.checkpointId,
      lineItemId: state.activeLineItemId,
      proofState: caseSeed.proofState,
    }),
  };
}

export function selectPharmacyLineItem(
  state: PharmacyShellState,
  lineItemId: string,
): PharmacyShellState {
  const caseSeed = caseForPharmacyId(state.selectedCaseId);
  const activeLineItem = lineItemForId(caseSeed, lineItemId);
  const nextState: PharmacyShellState = {
    ...state,
    activeLineItemId: activeLineItem.lineItemId,
    telemetry: state.telemetry,
  };
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, "selected_anchor_changed", {
      pharmacyCaseId: caseSeed.pharmacyCaseId,
      checkpointId: state.activeCheckpointId,
      lineItemId: activeLineItem.lineItemId,
      proofState: caseSeed.proofState,
    }),
  };
}

export function navigatePharmacyShell(
  state: PharmacyShellState,
  pathname: string,
): PharmacyShellState {
  const location = parsePharmacyPath(pathname);
  const selectedCaseId = resolveSelectedCaseId(location, state.selectedCaseId);
  const caseSeed = caseForPharmacyId(selectedCaseId);
  const activeCheckpointId =
    location.childRouteKey === null
      ? state.activeCheckpointId
      : defaultCheckpointIdForLocation(location, caseSeed);
  const continuitySnapshot = continuitySnapshotForState(location, caseSeed, state.continuitySnapshot);
  const nextState: PharmacyShellState = {
    ...state,
    location,
    continuitySnapshot,
    selectedCaseId,
    activeCheckpointId,
    activeLineItemId:
      selectedCaseId === state.selectedCaseId
        ? state.activeLineItemId
        : caseSeed.defaultLineItemId,
    returnToken:
      location.childRouteKey !== null
        ? createPharmacyReturnToken(
            casePathForPharmacy(selectedCaseId),
            caseSeed,
            selectedCaseId === state.selectedCaseId
              ? state.activeLineItemId
              : caseSeed.defaultLineItemId,
            activeCheckpointId,
          )
        : null,
    runtimeScenario: runtimeScenarioForCase(caseSeed),
    telemetry: state.telemetry,
  };
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, "state_summary_changed", {
      pathname: location.pathname,
      pharmacyCaseId: selectedCaseId,
      checkpointId: activeCheckpointId,
      lineItemId: nextState.activeLineItemId,
      proofState: caseSeed.proofState,
    }),
  };
}

export function openPharmacyChildRoute(
  state: PharmacyShellState,
  childRouteKey: PharmacyChildRouteKey,
): PharmacyShellState {
  const caseSeed = caseForPharmacyId(state.selectedCaseId);
  const location = parsePharmacyPath(
    childPathForPharmacy(caseSeed.pharmacyCaseId, childRouteKey),
  );
  const activeCheckpointId = defaultCheckpointIdForLocation(location, caseSeed);
  const continuitySnapshot = continuitySnapshotForState(location, caseSeed, state.continuitySnapshot);
  const nextState: PharmacyShellState = {
    ...state,
    location,
    continuitySnapshot,
    activeCheckpointId,
    returnToken: createPharmacyReturnToken(
      casePathForPharmacy(caseSeed.pharmacyCaseId),
      caseSeed,
      state.activeLineItemId,
      state.activeCheckpointId,
    ),
    telemetry: state.telemetry,
  };
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, "dominant_action_changed", {
      pathname: location.pathname,
      pharmacyCaseId: caseSeed.pharmacyCaseId,
      checkpointId: activeCheckpointId,
      lineItemId: state.activeLineItemId,
      proofState: caseSeed.proofState,
      routeKey: childRouteKey,
    }),
  };
}

export function returnFromPharmacyChildRoute(
  state: PharmacyShellState,
): PharmacyShellState {
  const caseSeed = caseForPharmacyId(state.selectedCaseId);
  const target = state.returnToken?.originPath ?? casePathForPharmacy(caseSeed.pharmacyCaseId);
  const nextState = navigatePharmacyShell(state, target);
  return {
    ...nextState,
    activeCheckpointId: state.returnToken?.checkpointId ?? nextState.activeCheckpointId,
    activeLineItemId: state.returnToken?.lineItemId ?? nextState.activeLineItemId,
    telemetry: appendTelemetry(nextState, "dominant_action_changed", {
      returnToken: state.returnToken?.returnTokenId ?? null,
      returnTarget: target,
      pharmacyCaseId: caseSeed.pharmacyCaseId,
    }),
  };
}

export function resolvePharmacyShellSnapshot(
  state: PharmacyShellState,
  viewportWidth: number,
): PharmacyShellSnapshot {
  const currentCase = caseForPharmacyId(state.selectedCaseId);
  const activeCheckpoint = checkpointForId(currentCase, state.activeCheckpointId);
  const activeLineItem = lineItemForId(currentCase, state.activeLineItemId);
  const layoutMode: PharmacyLayoutMode =
    viewportWidth < 1100 ? "mission_stack" : "two_plane";
  const visualizationMode = visualizationModeForCase(currentCase);
  const recoveryPosture = recoveryPostureForCase(currentCase);
  const routeShellPosture: PharmacyRouteShellPosture =
    recoveryPosture === "live"
      ? "shell_live"
      : recoveryPosture === "read_only"
        ? "shell_read_only"
        : "shell_recovery";

  let summarySentence = currentCase.queueSummary;
  switch (state.location.routeKey) {
    case "inventory":
      summarySentence = currentCase.inventorySummary;
      break;
    case "resolve":
      summarySentence = currentCase.outcomeTruth.summary;
      break;
    case "handoff":
      summarySentence = currentCase.dispatchTruth.summary;
      break;
    case "assurance":
      summarySentence = currentCase.outcomeTruth.summary;
      break;
    case "validate":
      summarySentence = currentCase.checkpointQuestion;
      break;
    case "case":
      summarySentence = currentCase.caseSummary;
      break;
    case "lane":
    default:
      break;
  }

  return {
    location: state.location,
    currentCase,
    activeCheckpoint,
    activeLineItem,
    queueCases: pharmacyCases,
    layoutMode,
    visualizationMode,
    recoveryPosture,
    routeShellPosture,
    actionEnabled: currentCase.workbenchPosture === "ready",
    summarySentence,
    statusInput: statusInputForCase(currentCase, state.continuitySnapshot),
    casePulse: casePulseForCase(currentCase, state.continuitySnapshot),
  };
}

export const pharmacyMockProjectionExamples: readonly PharmacyMockProjectionExample[] = [
  {
    exampleId: "PHARMACY_READY",
    path: "/workspace/pharmacy/PHC-2048/handoff",
    pharmacyCaseId: "PHC-2048",
    scenario: "ready_to_dispatch",
    summary: "Ready-to-dispatch case keeps the same validation shell while the governed handoff remains explicit.",
  },
  {
    exampleId: "PHARMACY_PROOF_PENDING",
    path: "/workspace/pharmacy/PHC-2057",
    pharmacyCaseId: "PHC-2057",
    scenario: "proof_pending",
    summary: "Proof-pending case keeps a calm validation board without implying settled dispatch.",
  },
  {
    exampleId: "PHARMACY_PROOF_CONTRADICTION",
    path: "/workspace/pharmacy/PHC-2072/handoff",
    pharmacyCaseId: "PHC-2072",
    scenario: "contradictory_proof",
    summary: "Contradictory proof freezes handoff posture in place and records explicit review debt.",
  },
  {
    exampleId: "PHARMACY_PARTIAL_SUPPLY",
    path: "/workspace/pharmacy/PHC-2081/inventory",
    pharmacyCaseId: "PHC-2081",
    scenario: "partial_supply",
    summary: "Inventory route distinguishes source truth, held stock, and the current supply delta without overclaiming release.",
  },
  {
    exampleId: "PHARMACY_CLARIFICATION",
    path: "/workspace/pharmacy/PHC-2090/validate",
    pharmacyCaseId: "PHC-2090",
    scenario: "clarification_required",
    summary: "Consent clarification remains explicit and keeps commands frozen in place.",
  },
  {
    exampleId: "PHARMACY_URGENT_RETURN",
    path: "/workspace/pharmacy/PHC-2103/assurance",
    pharmacyCaseId: "PHC-2103",
    scenario: "urgent_return",
    summary: "Urgent return reopens the case for safety inside the same shell.",
  },
  {
    exampleId: "PHARMACY_ROUTINE_REOPEN",
    path: "/workspace/pharmacy/PHC-2204/assurance",
    pharmacyCaseId: "PHC-2204",
    scenario: "urgent_return",
    summary: "Routine return keeps the original request anchor visible inside the same shell recovery board.",
  },
  {
    exampleId: "PHARMACY_LOOP_RISK_ESCALATION",
    path: "/workspace/pharmacy/PHC-2215/assurance",
    pharmacyCaseId: "PHC-2215",
    scenario: "urgent_return",
    summary: "Repeated bounce-backs escalate loop risk and freeze auto-retry inside the same shell recovery board.",
  },
  {
    exampleId: "PHARMACY_WEAK_MATCH_OUTCOME",
    path: "/workspace/pharmacy/PHC-2124/resolve",
    pharmacyCaseId: "PHC-2124",
    scenario: "weak_match_outcome",
    summary: "Weak-match outcome posture stays review-required and never looks resolved.",
  },
  {
    exampleId: "PHARMACY_MANUAL_REVIEW",
    path: "/workspace/pharmacy/PHC-2146/validate",
    pharmacyCaseId: "PHC-2146",
    scenario: "manual_review_debt",
    summary: "Manual-review debt keeps the case open and observe-only without degrading into generic broken UI.",
  },
  {
    exampleId: "PHARMACY_UNMATCHED_OUTCOME",
    path: "/workspace/pharmacy/PHC-2168/assurance",
    pharmacyCaseId: "PHC-2168",
    scenario: "unmatched_outcome",
    summary: "Unmatched outcome posture stays explicit inside the assurance child state instead of disappearing into closure posture.",
  },
] as const;

export const pharmacyRouteContractSeedRows: readonly PharmacyRouteContractSeedRow[] = [
  {
    path: "/workspace/pharmacy",
    routeFamilyRef: "rf_pharmacy_console",
    routeKey: "lane",
    continuityKey: pharmacyClaim.continuityKey,
    selectedAnchorPolicy: "Pin the queue lane while a case remains active in the same shell.",
    summary: "Queue spine root with one active case pinned into the validation board.",
  },
  {
    path: "/workspace/pharmacy/PHC-2057",
    routeFamilyRef: "rf_pharmacy_console",
    routeKey: "case",
    continuityKey: pharmacyClaim.continuityKey,
    selectedAnchorPolicy: "Preserve the active case, line item, and checkpoint on same-shell case entry.",
    summary: "Case workbench route keeps the validation board and decision plane in one shell.",
  },
  {
    path: "/workspace/pharmacy/PHC-2090/validate",
    routeFamilyRef: "rf_pharmacy_console",
    routeKey: "validate",
    continuityKey: pharmacyClaim.continuityKey,
    selectedAnchorPolicy: "Keep the current checkpoint and line-item anchor visible during validation review.",
    summary: "Validation route promotes checkpoint detail without detaching from the case workbench.",
  },
  {
    path: "/workspace/pharmacy/PHC-2081/inventory",
    routeFamilyRef: "rf_pharmacy_console",
    routeKey: "inventory",
    continuityKey: pharmacyClaim.continuityKey,
    selectedAnchorPolicy: "Preserve the selected line item while inventory comparison posture changes.",
    summary: "Inventory route shows supply delta, held posture, and table fallback inside the same shell.",
  },
  {
    path: "/workspace/pharmacy/PHC-2124/resolve",
    routeFamilyRef: "rf_pharmacy_console",
    routeKey: "resolve",
    continuityKey: pharmacyClaim.continuityKey,
    selectedAnchorPolicy: "Keep outcome review tied to the active case and return token.",
    summary: "Resolve route keeps weak-match and manual-review truth explicit rather than resolved-looking.",
  },
  {
    path: "/workspace/pharmacy/PHC-2072/handoff",
    routeFamilyRef: "rf_pharmacy_console",
    routeKey: "handoff",
    continuityKey: pharmacyClaim.continuityKey,
    selectedAnchorPolicy: "Freeze the current case and proof basis if handoff proof is contradictory.",
    summary: "Handoff route distinguishes transport acceptance, provider acceptance, and authoritative proof.",
  },
  {
    path: "/workspace/pharmacy/PHC-2103/assurance",
    routeFamilyRef: "rf_pharmacy_console",
    routeKey: "assurance",
    continuityKey: pharmacyClaim.continuityKey,
    selectedAnchorPolicy: "Urgent return and reopen-for-safety remain inside the same shell continuity frame.",
    summary: "Assurance route keeps reopen-for-safety and watch-window posture explicit.",
  },
  {
    path: "/workspace/pharmacy/PHC-2204/assurance",
    routeFamilyRef: "rf_pharmacy_console",
    routeKey: "assurance",
    continuityKey: pharmacyClaim.continuityKey,
    selectedAnchorPolicy:
      "Routine reopen keeps the original request anchor, line item, and return contract visible in one shell.",
    summary:
      "Assurance route keeps routine bounce-back diff, patient message preview, and original-request return action explicit.",
  },
  {
    path: "/workspace/pharmacy/PHC-2215/assurance",
    routeFamilyRef: "rf_pharmacy_console",
    routeKey: "assurance",
    continuityKey: pharmacyClaim.continuityKey,
    selectedAnchorPolicy:
      "Loop-risk escalation keeps supervisor review, contact repair, and prior proof inside the same shell.",
    summary:
      "Assurance route keeps repeated bounce-back escalation explicit instead of allowing another silent retry.",
  },
] as const;

export const pharmacyCheckpointAndProofMatrixRows: readonly PharmacyCheckpointAndProofMatrixRow[] =
  pharmacyCases.map((caseSeed) => ({
    pharmacyCaseId: caseSeed.pharmacyCaseId,
    scenario: caseSeed.scenario,
    consentState: caseSeed.consentState,
    proofState: caseSeed.proofState,
    inventoryPosture: caseSeed.inventoryPosture,
    outcomeTruthState: caseSeed.outcomeTruth.outcomeTruthState,
    dominantAction: caseSeed.dominantActionLabel,
    gapRefs: caseSeed.gapRefs,
  }));

export function createPharmacyRouteMapMermaid(): string {
  return `flowchart LR
  Queue["/workspace/pharmacy"] --> Case["/workspace/pharmacy/:pharmacyCaseId"]
  Case --> Validate["/workspace/pharmacy/:pharmacyCaseId/validate"]
  Case --> Inventory["/workspace/pharmacy/:pharmacyCaseId/inventory"]
  Case --> Resolve["/workspace/pharmacy/:pharmacyCaseId/resolve"]
  Case --> Handoff["/workspace/pharmacy/:pharmacyCaseId/handoff"]
  Case --> Assurance["/workspace/pharmacy/:pharmacyCaseId/assurance"]
  Validate --> Case
  Inventory --> Case
  Resolve --> Case
  Handoff --> Case
  Assurance --> Case`;
}

export function createPharmacyGallerySeed() {
  return pharmacyMockProjectionExamples.map((example) => {
    const state = createInitialPharmacyShellState(example.path);
    const snapshot = resolvePharmacyShellSnapshot(state, 1480);
    return {
      exampleId: example.exampleId,
      path: example.path,
      queueLane: snapshot.currentCase.queueLane,
      summary: snapshot.summarySentence,
      dominantAction: snapshot.currentCase.dominantActionLabel,
      recoveryPosture: snapshot.recoveryPosture,
      visualizationMode: snapshot.visualizationMode,
      proofState: snapshot.currentCase.proofState,
      outcomeTruthState: snapshot.currentCase.outcomeTruth.outcomeTruthState,
      inventoryPosture: snapshot.currentCase.inventoryPosture,
    };
  });
}
