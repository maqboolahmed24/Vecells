import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const TODAY = new Date().toISOString().slice(0, 10);

const TASK_ID = "seq_314_phase5_open_parallel_network_tracks_gate";
const SHORT_TASK_ID = "seq_314";
const CONTRACT_VERSION = "314.phase5.parallel-gate.v1";
const VISUAL_MODE = "Phase5_Parallel_Tracks_Gate_Board";
const GATE_VERDICT = "wave_1_open_with_constraints";

const SOURCE_REFS = {
  phase5Hub:
    "blueprint/phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine",
  phase5Identity:
    "blueprint/phase-5-the-network-horizon.md#5B. Staff identity, organisation boundaries, and acting context",
  phase5Policy:
    "blueprint/phase-5-the-network-horizon.md#5C. Enhanced Access policy engine and network capacity ingestion",
  phase5Queue:
    "blueprint/phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine",
  phase5Offers:
    "blueprint/phase-5-the-network-horizon.md#5E. Alternative offer generation, open choice, callback fallback, and patient continuity",
  phase5Commit:
    "blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging",
  phase5Visibility:
    "blueprint/phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility",
  phaseCards: "blueprint/phase-cards.md#Card-6",
  phase4Exit: "docs/governance/310_phase4_go_no_go_decision.md",
  phase311Architecture: "docs/architecture/311_phase5_hub_case_and_acting_context_contract.md",
  phase311Api: "docs/api/311_phase5_hub_route_and_command_contract.md",
  phase311Security: "docs/security/311_phase5_org_boundary_and_visibility_rules.md",
  phase312Architecture:
    "docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md",
  phase312Api: "docs/api/312_phase5_candidate_snapshot_and_rank_contract.md",
  phase313Architecture:
    "docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
  phase313Api: "docs/api/313_phase5_commit_and_practice_visibility_api_contract.md",
  phase313Security:
    "docs/security/313_phase5_truth_tuple_ack_generation_and_minimum_necessary_rules.md",
};

type Readiness = "ready" | "blocked" | "deferred";
type Domain = "backend" | "frontend" | "ops" | "integration" | "testing";
type Wave = "wave_1" | "wave_2" | "wave_3" | "ops" | "integration" | "proof";
type ArtifactKind =
  | "object"
  | "projection"
  | "surface"
  | "operation"
  | "service"
  | "proof_battery";

type CarryForwardIssue = {
  issueId: string;
  title: string;
  summary: string;
  nextAction: string;
  ownerTask: string;
  followOnTasks: string[];
};

type Track = {
  trackId: string;
  seq: number;
  title: string;
  shortMission: string;
  domain: Domain;
  wave: Wave;
  readiness: Readiness;
  promptRef: string;
  ownedArtifacts: string[];
  nonOwnedArtifacts: string[];
  producedInterfaces: string[];
  dependsOnTracks: string[];
  dependsOnContracts: string[];
  readinessReason: string;
  mergeCriteria: string[];
  guardrails: string[];
  carryForwardIssueRefs: string[];
  collisionSeamRefs: string[];
  launchPacketRef?: string;
  unlockRule?: string;
};

type Artifact = {
  artifactId: string;
  kind: ArtifactKind;
  canonicalOwnerTrack: string;
  readinessGate: Readiness;
  authorityRefs: string[];
  consumerTracks: string[];
  notes: string;
  facetOwners?: Array<{
    facetId: string;
    ownerTrack: string;
    mode:
      | "canonical_writer"
      | "delta_only"
      | "bootstrap_request_only"
      | "worker_outcome_only"
      | "surface_extension_only"
      | "repair_only";
    allowedFields: string[];
  }>;
};

type DependencyEdge = {
  interfaceId: string;
  producerTrack: string;
  consumerTrack: string;
  interfaceName: string;
  artifactRefs: string[];
  status: "launch_ready" | "blocked_until_upstream" | "deferred";
  notes: string;
  seamRef?: string;
};

type GapEntry = {
  gapId: string;
  area: string;
  severity: "high" | "medium";
  status: "resolved_by_314" | "carried_from_310";
  tracksInvolved: string[];
  canonicalOwner: string;
  resolution: string;
  seamRef?: string;
  carryForwardIssueRef?: string;
};

type SeamFile = {
  taskId: string;
  contractVersion: string;
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
  discipline: Array<{
    trackId: string;
    responsibility: string;
    mayPersistCanonicalObject: "yes" | "no";
    mustEmitOrConsume: string;
  }>;
  xSourceRefs: string[];
};

function repoPath(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8")) as T;
}

function writeText(relativePath: string, content: string): void {
  const absolutePath = repoPath(relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${content.trimEnd()}\n`, "utf8");
}

function writeJson(relativePath: string, payload: unknown): void {
  writeText(relativePath, JSON.stringify(payload, null, 2));
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(
  relativePath: string,
  rows: Array<Record<string, unknown>>,
  fieldnames: string[],
): void {
  const lines = [
    fieldnames.join(","),
    ...rows.map((row) => fieldnames.map((field) => escapeCsvCell(row[field])).join(",")),
  ];
  writeText(relativePath, lines.join("\n"));
}

function yamlScalar(value: unknown): string {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "number") return String(value);
  const text = String(value ?? "");
  if (text === "" || /[:#{}\[\],\n]/.test(text) || text.trim() !== text) {
    return JSON.stringify(text);
  }
  return text;
}

function toYaml(value: unknown, indent = 0): string {
  const prefix = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${prefix}[]`;
    }
    return value
      .map((entry) => {
        if (typeof entry === "object" && entry !== null) {
          const rendered = toYaml(entry, indent + 2).split("\n");
          return [
            `${prefix}- ${rendered[0].trimStart()}`,
            ...rendered.slice(1).map((line) => `${" ".repeat(indent + 2)}${line.trimStart()}`),
          ].join("\n");
        }
        return `${prefix}- ${yamlScalar(entry)}`;
      })
      .join("\n");
  }
  if (typeof value === "object" && value !== null) {
    if (Object.keys(value).length === 0) return `${prefix}{}`;
    return Object.entries(value)
      .map(([key, entry]) => {
        if (typeof entry === "object" && entry !== null) {
          return `${prefix}${key}:\n${toYaml(entry, indent + 2)}`;
        }
        return `${prefix}${key}: ${yamlScalar(entry)}`;
      })
      .join("\n");
  }
  return `${prefix}${yamlScalar(value)}`;
}

function mdTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`,
  );
  return [head, divider, ...body].join("\n");
}

const carryForwardIssues = readJson<CarryForwardIssue[]>(
  "data/analysis/310_phase4_open_issues_and_carry_forward.json",
);
const issueById = new Map(carryForwardIssues.map((issue) => [issue.issueId, issue]));

const PARALLEL_SEAMS: SeamFile[] = [
  {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    seamId: "PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE",
    fileName:
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
    ownerTask: "par_321",
    area: "truth_projection_write_discipline",
    purpose:
      "Resolve the multi-track write collision on HubOfferToConfirmationTruthProjection by locking par_321 as the only canonical projection writer while adjacent tracks publish typed deltas only.",
    consumerRefs: [
      "HubOfferToConfirmationTruthProjection.offerState",
      "HubOfferToConfirmationTruthProjection.confirmationTruthState",
      "HubOfferToConfirmationTruthProjection.practiceVisibilityState",
      "HubOfferToConfirmationTruthProjection.closureState",
      "PracticeVisibilityDeltaRecord.deltaReason",
    ],
    requiredObjects: [
      {
        objectName: "HubOfferToConfirmationTruthProjection",
        status: "canonical_owner_locked",
        requiredFields: [
          "hubOfferToConfirmationTruthProjectionId",
          "hubCoordinationCaseId",
          "offerState",
          "confirmationTruthState",
          "practiceVisibilityState",
          "closureState",
          "truthTupleHash",
        ],
      },
      {
        objectName: "HubTruthProjectionDeltaEnvelope",
        status: "typed_seam_only",
        requiredFields: [
          "deltaEnvelopeId",
          "hubCoordinationCaseId",
          "deltaFamily",
          "truthTupleHash",
          "causalEventRef",
          "requestedByTrack",
        ],
      },
    ],
    discipline: [
      {
        trackId: "par_320",
        responsibility: "Own offer-selection and offer-expiry deltas only.",
        mayPersistCanonicalObject: "no",
        mustEmitOrConsume: "Emit HubTruthProjectionDeltaEnvelope entries for offer_facet changes.",
      },
      {
        trackId: "par_321",
        responsibility: "Own the reducer and persisted projection row.",
        mayPersistCanonicalObject: "yes",
        mustEmitOrConsume: "Consume delta envelopes and persist the canonical truth projection.",
      },
      {
        trackId: "par_322",
        responsibility: "Own message and acknowledgement deltas only.",
        mayPersistCanonicalObject: "no",
        mustEmitOrConsume:
          "Emit practice_visibility delta envelopes; do not upsert HubOfferToConfirmationTruthProjection directly.",
      },
      {
        trackId: "par_323",
        responsibility: "Own fallback and reopen deltas only.",
        mayPersistCanonicalObject: "no",
        mustEmitOrConsume:
          "Emit fallback_linkage delta envelopes; do not overwrite calmer truth states.",
      },
      {
        trackId: "par_324",
        responsibility: "Own manage-capability and practice-visibility deltas only.",
        mayPersistCanonicalObject: "no",
        mustEmitOrConsume:
          "Emit manage_visibility delta envelopes and consume current projection snapshots.",
      },
      {
        trackId: "par_325",
        responsibility: "Own replay and repair through the same reducer only.",
        mayPersistCanonicalObject: "no",
        mustEmitOrConsume:
          "Replay delta envelopes or dispatch repair requests; never fork a second persisted projection writer.",
      },
    ],
    xSourceRefs: Object.values(SOURCE_REFS),
  },
  {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    seamId: "PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP",
    fileName: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
    ownerTask: "par_325",
    area: "supplier_mirror_bootstrap",
    purpose:
      "Resolve the mirror-state ownership split by making par_325 the sole owner of HubSupplierMirrorState while par_321 may emit a typed bootstrap request after commit.",
    consumerRefs: [
      "HubSupplierMirrorState.driftState",
      "HubSupplierMirrorState.supplierObservationRevision",
      "HubCommitAttempt.attemptState",
      "HubAppointmentRecord.hubAppointmentId",
    ],
    requiredObjects: [
      {
        objectName: "HubSupplierMirrorState",
        status: "canonical_owner_locked",
        requiredFields: [
          "hubSupplierMirrorStateId",
          "hubAppointmentId",
          "supplierObservationRevision",
          "driftState",
          "truthTupleHash",
        ],
      },
      {
        objectName: "HubSupplierMirrorBootstrapRequest",
        status: "typed_seam_only",
        requiredFields: [
          "bootstrapRequestId",
          "hubAppointmentId",
          "truthTupleHash",
          "commitEvidenceRef",
          "requestedByTrack",
        ],
      },
    ],
    discipline: [
      {
        trackId: "par_321",
        responsibility: "Emit a mirror bootstrap request when authoritative commit evidence becomes available.",
        mayPersistCanonicalObject: "no",
        mustEmitOrConsume: "Emit HubSupplierMirrorBootstrapRequest only.",
      },
      {
        trackId: "par_325",
        responsibility: "Create and maintain HubSupplierMirrorState.",
        mayPersistCanonicalObject: "yes",
        mustEmitOrConsume: "Consume bootstrap requests and own all supplier-observation revisions.",
      },
      {
        trackId: "par_324",
        responsibility: "Observe mirror drift via read-only deltas for manage posture.",
        mayPersistCanonicalObject: "no",
        mustEmitOrConsume: "Consume mirror-state reads only; no direct writes.",
      },
    ],
    xSourceRefs: Object.values(SOURCE_REFS),
  },
  {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    seamId: "PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF",
    fileName: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
    ownerTask: "par_323",
    area: "exception_lifecycle_handoff",
    purpose:
      "Resolve the HubCoordinationException ownership split by locking par_323 as schema and creation owner while par_325 appends worker outcomes and retry transitions through a typed handoff.",
    consumerRefs: [
      "HubCoordinationException.exceptionClass",
      "HubCoordinationException.retryState",
      "PracticeVisibilityDeltaRecord.deltaReason",
      "HubOfferToConfirmationTruthProjection.closureState",
    ],
    requiredObjects: [
      {
        objectName: "HubCoordinationException",
        status: "canonical_owner_locked",
        requiredFields: [
          "exceptionId",
          "hubCoordinationCaseId",
          "exceptionClass",
          "retryState",
          "truthTupleHash",
        ],
      },
      {
        objectName: "HubExceptionWorkerOutcome",
        status: "typed_seam_only",
        requiredFields: [
          "workerOutcomeId",
          "exceptionId",
          "retryState",
          "escalationState",
          "truthTupleHash",
          "processedByTrack",
        ],
      },
    ],
    discipline: [
      {
        trackId: "par_323",
        responsibility: "Create, classify, reopen, and close HubCoordinationException records.",
        mayPersistCanonicalObject: "yes",
        mustEmitOrConsume: "Consume worker outcomes and remain the only creator of canonical exception rows.",
      },
      {
        trackId: "par_325",
        responsibility: "Process exceptions in background workers.",
        mayPersistCanonicalObject: "no",
        mustEmitOrConsume: "Emit HubExceptionWorkerOutcome handoffs only.",
      },
    ],
    xSourceRefs: Object.values(SOURCE_REFS),
  },
];

const TRACKS: Track[] = [
  {
    trackId: "par_315",
    seq: 315,
    title: "Network coordination case kernel and lineage links",
    shortMission:
      "Build NetworkBookingRequest, HubCoordinationCase, transition guards, ownership fences, and Phase 4 fallback lineage carry-forward.",
    domain: "backend",
    wave: "wave_1",
    readiness: "ready",
    promptRef: "prompt/315.md",
    ownedArtifacts: ["NetworkBookingRequest", "HubCoordinationCase", "HubCoordinationStateMachine"],
    nonOwnedArtifacts: [
      "StaffIdentityContext",
      "EnhancedAccessPolicy",
      "HubCommitAttempt",
      "HubOfferToConfirmationTruthProjection",
    ],
    producedInterfaces: [
      "HubCaseKernel",
      "HubCaseTransitionGuard",
      "Phase4FallbackLineageAdapter",
      "OpenCaseBlockerContract",
    ],
    dependsOnTracks: [],
    dependsOnContracts: [
      "data/contracts/311_network_booking_request.schema.json",
      "data/contracts/311_hub_coordination_case.schema.json",
      "data/contracts/311_hub_coordination_state_machine.json",
      "docs/architecture/311_phase5_hub_case_and_acting_context_contract.md",
    ],
    readinessReason:
      "Ready because 311 already froze the canonical case, state, lineage, and close-blocker law. No sibling implementation track needs to redefine those semantics before work can begin.",
    mergeCriteria: [
      "Do not rename or collapse any 311 state identifiers, blockers, or lineage references.",
      "Preserve Phase 4 fallback lineage so reopen and return-to-practice flows still reference existing Booking Engine truth.",
      "Persist ownership fence and ownership epoch at the case level before exposing downstream mutation hooks.",
    ],
    guardrails: [
      "Treat rollback-rehearsal hooks as mandatory carry-forward work from ISSUE310_002.",
      "Do not embed acting-context or policy logic that belongs to par_316 or par_317.",
    ],
    carryForwardIssueRefs: ["ISSUE310_002"],
    collisionSeamRefs: [],
    launchPacketRef: "data/launchpacks/314_track_launch_packet_315.json",
  },
  {
    trackId: "par_316",
    seq: 316,
    title: "Staff identity, acting context, and visibility enforcement",
    shortMission:
      "Build StaffIdentityContext, ActingContext, ActingScopeTuple issuance and drift handling, and CrossOrganisationVisibilityEnvelope enforcement.",
    domain: "backend",
    wave: "wave_1",
    readiness: "ready",
    promptRef: "prompt/316.md",
    ownedArtifacts: [
      "StaffIdentityContext",
      "ActingContext",
      "ActingScopeTuple",
      "CrossOrganisationVisibilityEnvelope",
    ],
    nonOwnedArtifacts: [
      "HubCoordinationCase",
      "EnhancedAccessPolicy",
      "HubQueueWorkbenchProjection",
      "PracticeVisibilityProjection",
    ],
    producedInterfaces: [
      "ActingContextEnvelope",
      "VisibilityTierEnforcement",
      "MinimumNecessaryProjectionGuard",
    ],
    dependsOnTracks: [],
    dependsOnContracts: [
      "data/contracts/311_staff_identity_context.schema.json",
      "data/contracts/311_acting_context.schema.json",
      "data/contracts/311_cross_org_visibility_envelope.schema.json",
      "data/contracts/311_hub_visibility_tier_contract.json",
      "data/contracts/311_hub_route_family_registry.yaml",
      "docs/security/311_phase5_org_boundary_and_visibility_rules.md",
    ],
    readinessReason:
      "Ready because 311 already froze the identity, audience-tier, and route-family contracts. The implementation can start against those frozen seams without waiting for par_315 internals.",
    mergeCriteria: [
      "Keep 311 field names, tier identifiers, and minimum-necessary placeholders unchanged.",
      "Freeze writable posture on acting-scope drift before any case mutation path proceeds.",
      "Expose a reusable envelope that downstream backend and frontend tracks consume rather than redefine.",
    ],
    guardrails: [
      "Do not redefine queue ordering, policy tuple calculation, or route-family shell ownership.",
      "Treat CIS2 and organisation-assurance dependencies as environment facts, not local role aliases.",
    ],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    launchPacketRef: "data/launchpacks/314_track_launch_packet_316.json",
  },
  {
    trackId: "par_317",
    seq: 317,
    title: "Enhanced Access policy compiler and replayable evaluation engine",
    shortMission:
      "Build the versioned Enhanced Access policy compiler, deterministic policyTupleHash generation, and replayable evaluation outputs without redefining ranking law.",
    domain: "backend",
    wave: "wave_1",
    readiness: "ready",
    promptRef: "prompt/317.md",
    ownedArtifacts: [
      "EnhancedAccessPolicy",
      "HubRoutingPolicyPack",
      "HubVarianceWindowPolicy",
      "HubServiceObligationPolicy",
      "HubPracticeVisibilityPolicy",
      "HubCapacityIngestionPolicy",
      "NetworkCoordinationPolicyEvaluation",
    ],
    nonOwnedArtifacts: [
      "HubCoordinationCase",
      "NetworkSlotCandidate",
      "HubQueueWorkbenchProjection",
      "NetworkManageCapabilities",
    ],
    producedInterfaces: [
      "PolicyTupleCompiler",
      "PolicyEvaluationResult",
      "PolicyTupleHashDeterminismContract",
    ],
    dependsOnTracks: [],
    dependsOnContracts: [
      "data/contracts/312_enhanced_access_policy.schema.json",
      "data/contracts/312_hub_routing_policy_pack.schema.json",
      "data/contracts/312_hub_variance_window_policy.schema.json",
      "data/contracts/312_hub_service_obligation_policy.schema.json",
      "data/contracts/312_hub_practice_visibility_policy.schema.json",
      "data/contracts/312_hub_capacity_ingestion_policy.schema.json",
      "data/contracts/312_network_coordination_policy_evaluation.schema.json",
      "data/contracts/312_capacity_rank_proof_contract.json",
      "docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md",
    ],
    readinessReason:
      "Ready because 312 already froze tuple fields, frontier law, and deterministic ranking formulas. par_317 can implement compiler and evaluation logic in parallel without waiting for downstream capacity or queue code.",
    mergeCriteria: [
      "Keep policyTupleHash deterministic for identical typed inputs.",
      "Do not let service obligation or practice visibility change candidate order; preserve 312 separation law.",
      "Expose a replayable evaluation output that par_318 can consume without re-deriving policy semantics.",
    ],
    guardrails: [
      "Do not implement capacity ingestion, candidate normalization, or queue ranking inside par_317.",
      "Do not rename formula identifiers or lexicographic order keys from 312.",
    ],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    launchPacketRef: "data/launchpacks/314_track_launch_packet_317.json",
  },
  {
    trackId: "par_318",
    seq: 318,
    title: "Capacity ingestion, normalization, and candidate snapshot pipeline",
    shortMission:
      "Normalize feed inputs into durable NetworkSlotCandidate rows, candidate snapshots, decision plans, and ranking-proof artifacts.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/318.md",
    ownedArtifacts: [
      "HubCapacityAdapter",
      "NetworkSlotCandidate",
      "NetworkCandidateSnapshot",
      "CrossSiteDecisionPlan",
      "CapacityRankProof",
      "CapacityRankExplanation",
      "EnhancedAccessMinutesLedger",
      "CancellationMakeUpLedger",
    ],
    nonOwnedArtifacts: ["EnhancedAccessPolicy", "HubQueueWorkbenchProjection"],
    producedInterfaces: [
      "CandidateSnapshotBundle",
      "SourceTrustAdmission",
      "DecisionPlanFrontier",
      "RankingExplanationFeed",
    ],
    dependsOnTracks: ["par_315", "par_317"],
    dependsOnContracts: [
      "data/contracts/312_network_slot_candidate.schema.json",
      "data/contracts/312_network_candidate_snapshot.schema.json",
      "data/contracts/312_cross_site_decision_plan.schema.json",
      "data/contracts/312_capacity_rank_proof_contract.json",
      "data/contracts/312_capacity_rank_explanation_contract.json",
    ],
    readinessReason:
      "Blocked until par_315 exposes the case kernel anchor and par_317 exposes the policy-evaluation engine used to admit, score, and freeze candidate snapshots.",
    mergeCriteria: [
      "Consume par_317 outputs rather than recomputing tuple law locally.",
      "Persist candidate, proof, and explanation rows as first-class artifacts for par_319 and par_320.",
    ],
    guardrails: ["Do not start before the wave-1 contracts are implemented and validated."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    unlockRule: "Unlock after par_315 and par_317 pass their own validator and integration proof.",
  },
  {
    trackId: "par_319",
    seq: 319,
    title: "Coordination queue, workbench projections, and SLA timer engine",
    shortMission:
      "Build deterministic hub queue ranking, breach-risk estimation, and staff workbench projections.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/319.md",
    ownedArtifacts: [
      "HubQueueWorkbenchProjection",
      "HubConsoleConsistencyProjection",
      "HubCaseConsoleProjection",
      "HubOptionCardProjection",
      "HubPostureProjection",
      "HubEscalationBannerProjection",
    ],
    nonOwnedArtifacts: ["HubCoordinationCase", "NetworkCandidateSnapshot", "AlternativeOfferSession"],
    producedInterfaces: ["QueueWorkbenchFeed", "SLATimerFeed", "CandidateWorkbenchProjection"],
    dependsOnTracks: ["par_315", "par_317", "par_318"],
    dependsOnContracts: [
      "docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md",
      "prompt/319.md",
    ],
    readinessReason:
      "Blocked because queue order depends on the actual case kernel plus persisted candidate snapshots and proofs from par_318.",
    mergeCriteria: [
      "Read queue order from persisted proofs only; never infer new rank semantics in projection code.",
      "Keep fairness merge limited to non-critical bands.",
    ],
    guardrails: ["Do not begin before par_318 publishes stable snapshot and proof contracts."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    unlockRule: "Unlock after par_318 exposes stable candidate snapshot and proof outputs.",
  },
  {
    trackId: "par_320",
    seq: 320,
    title: "Alternative-offer optimisation and secure patient choice",
    shortMission:
      "Build alternative-offer optimisation, governed patient choice, callback fallback, and offer-regeneration settlement.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/320.md",
    ownedArtifacts: [
      "AlternativeOfferOptimisationPlan",
      "AlternativeOfferSession",
      "AlternativeOfferEntry",
      "AlternativeOfferFallbackCard",
      "AlternativeOfferRegenerationSettlement",
    ],
    nonOwnedArtifacts: ["HubOfferToConfirmationTruthProjection", "HubCommitAttempt"],
    producedInterfaces: ["OfferSelectionDelta", "PatientChoiceEnvelope", "CallbackFallbackTrigger"],
    dependsOnTracks: ["par_315", "par_318", "par_319"],
    dependsOnContracts: [
      "docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
      "prompt/320.md",
    ],
    readinessReason:
      "Blocked because patient choice must sit on top of actual ranked candidates and queue posture from par_318 and par_319.",
    mergeCriteria: [
      "Treat selected offers as typed deltas into the truth-projection reducer, not direct projection writes.",
      "Keep callback fallback governed by persisted lead-time rules.",
    ],
    guardrails: ["Do not write HubOfferToConfirmationTruthProjection directly."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
    ],
    unlockRule: "Unlock after par_318 and par_319 publish stable candidate and queue feeds.",
  },
  {
    trackId: "par_321",
    seq: 321,
    title: "Native hub booking commit attempts and appointment records",
    shortMission:
      "Build fenced commit attempts, action records, commit settlement, evidence bundles, appointment records, and the canonical truth-projection reducer.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/321.md",
    ownedArtifacts: [
      "HubCommitAttempt",
      "HubActionRecord",
      "HubCommitSettlement",
      "HubBookingEvidenceBundle",
      "HubAppointmentRecord",
      "HubOfferToConfirmationTruthProjection",
    ],
    nonOwnedArtifacts: ["HubSupplierMirrorState", "HubCoordinationException"],
    producedInterfaces: [
      "CommitEvidenceBundle",
      "TruthProjectionReducer",
      "SupplierMirrorBootstrapRequest",
    ],
    dependsOnTracks: ["par_315", "par_316", "par_318", "par_320"],
    dependsOnContracts: [
      "data/contracts/313_hub_commit_attempt.schema.json",
      "data/contracts/313_hub_booking_evidence_bundle.schema.json",
      "data/contracts/313_hub_appointment_record.schema.json",
      "data/contracts/313_hub_offer_to_confirmation_truth_projection.schema.json",
    ],
    readinessReason:
      "Blocked because commit cannot begin until case, visibility enforcement, ranked candidates, and patient choice are implemented.",
    mergeCriteria: [
      "Remain the sole canonical writer for HubOfferToConfirmationTruthProjection.",
      "Emit supplier-mirror bootstrap requests rather than creating mirror-state rows directly.",
      "Do not claim live provider parity beyond the frozen 313 boundary.",
    ],
    guardrails: [
      "Keep live, sandbox, unsupported, and future-network evidence classes separated.",
      "Consume choice deltas and visibility envelopes rather than recomputing them locally.",
    ],
    carryForwardIssueRefs: ["ISSUE310_004"],
    collisionSeamRefs: [
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
    ],
    unlockRule: "Unlock after par_315, par_316, par_318, and par_320 are validated together.",
  },
  {
    trackId: "par_322",
    seq: 322,
    title: "Practice continuity routing, dispatch, and acknowledgement evidence",
    shortMission:
      "Build practice continuity messages, idempotent dispatch chains, delivery evidence, and current-generation acknowledgement handling.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/322.md",
    ownedArtifacts: [
      "PracticeContinuityMessage",
      "PracticeAcknowledgementRecord",
      "PracticeContinuityDispatchAttempt",
      "PracticeContinuityReceiptCheckpoint",
    ],
    nonOwnedArtifacts: ["HubOfferToConfirmationTruthProjection", "NetworkManageCapabilities"],
    producedInterfaces: ["PracticeVisibilityDelta", "AckGenerationDelta", "MeshDispatchEvidence"],
    dependsOnTracks: ["par_316", "par_321"],
    dependsOnContracts: [
      "data/contracts/313_practice_continuity_message.schema.json",
      "data/contracts/313_practice_acknowledgement_record.schema.json",
      "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_MESH_DISPATCH_AND_DELIVERY.json",
    ],
    readinessReason:
      "Blocked because continuity routing depends on authoritative commit evidence and visibility envelopes.",
    mergeCriteria: [
      "Keep transport, delivery, and acknowledgement states separate.",
      "Emit typed visibility deltas rather than persisting the canonical truth projection.",
    ],
    guardrails: ["Do not collapse MESH transport acceptance into practice acknowledgement."],
    carryForwardIssueRefs: ["ISSUE310_004"],
    collisionSeamRefs: [
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
    ],
    unlockRule: "Unlock after par_321 exposes authoritative commit and truth-projection reducer outputs.",
  },
  {
    trackId: "par_323",
    seq: 323,
    title: "No-slot, callback, return-to-practice, and reopen workflows",
    shortMission:
      "Build fallback records, callback fallback, urgent bounce-back, and canonical coordination exceptions.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/323.md",
    ownedArtifacts: [
      "HubFallbackRecord",
      "CallbackFallbackRecord",
      "HubReturnToPracticeRecord",
      "HubCoordinationException",
    ],
    nonOwnedArtifacts: ["HubOfferToConfirmationTruthProjection", "HubSupplierMirrorState"],
    producedInterfaces: ["FallbackDelta", "ReopenRequest", "HubExceptionRecord"],
    dependsOnTracks: ["par_315", "par_320", "par_322"],
    dependsOnContracts: [
      "data/contracts/PHASE5_INTERFACE_GAP_HUB_CORE_FALLBACK_AND_VISIBILITY.json",
      "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_RECONCILIATION_AND_SUPPLIER_MIRROR.json",
      "prompt/323.md",
    ],
    readinessReason:
      "Blocked because fallback and reopen flows must integrate live offer posture and current acknowledgement debt.",
    mergeCriteria: [
      "Remain the sole canonical creator and classifier of HubCoordinationException.",
      "Emit fallback deltas into the truth-projection reducer rather than patching projection rows directly.",
    ],
    guardrails: ["Do not let worker repair code redefine exception classes or creation semantics."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
    ],
    unlockRule: "Unlock after par_320 and par_322 publish offer and acknowledgement signals.",
  },
  {
    trackId: "par_324",
    seq: 324,
    title: "Network reminders, manage flows, and practice visibility projections",
    shortMission:
      "Build reminders, manage capabilities, and diff-first practice-visibility projections that remain tied to current truth.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/324.md",
    ownedArtifacts: [
      "NetworkReminderPlan",
      "PracticeVisibilityProjection",
      "NetworkManageCapabilities",
      "HubManageSettlement",
      "PracticeVisibilityDeltaRecord",
    ],
    nonOwnedArtifacts: ["HubOfferToConfirmationTruthProjection", "HubSupplierMirrorState"],
    producedInterfaces: ["ManageCapabilityDelta", "PracticeVisibilityView", "ReminderPlanFeed"],
    dependsOnTracks: ["par_316", "par_321", "par_322"],
    dependsOnContracts: [
      "data/contracts/313_practice_visibility_projection.schema.json",
      "data/contracts/313_network_manage_capabilities.schema.json",
      "data/contracts/313_practice_visibility_delta_record.schema.json",
      "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_REMINDERS_AND_MANAGE_REFRESH.json",
    ],
    readinessReason:
      "Blocked because manage posture and reminder lanes depend on current commit evidence plus live acknowledgement and visibility deltas.",
    mergeCriteria: [
      "Keep manage capability tied to current truthTupleHash and visibility posture.",
      "Emit deltas and read models only; do not take ownership of the canonical truth projection or mirror state.",
    ],
    guardrails: ["Do not overstate live manage posture while acknowledgement debt or drift is open."],
    carryForwardIssueRefs: ["ISSUE310_004"],
    collisionSeamRefs: [
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
    ],
    unlockRule: "Unlock after par_321 and par_322 expose stable truth and continuity feeds.",
  },
  {
    trackId: "par_325",
    seq: 325,
    title: "Supplier mirror, commit reconciler, and exception worker",
    shortMission:
      "Build background integrity workers for supplier mirror, reconciliation, replay-safe truth repair, and exception processing.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/325.md",
    ownedArtifacts: [
      "HubSupplierMirrorState",
      "HubBookingReconcilerService",
      "HubExceptionWorkerOutcome",
    ],
    nonOwnedArtifacts: ["HubOfferToConfirmationTruthProjection", "HubCoordinationException"],
    producedInterfaces: ["MirrorDriftDelta", "TruthRepairRequest", "ExceptionWorkerOutcome"],
    dependsOnTracks: ["par_321", "par_322", "par_323", "par_324"],
    dependsOnContracts: [
      "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_RECONCILIATION_AND_SUPPLIER_MIRROR.json",
      "prompt/325.md",
    ],
    readinessReason:
      "Blocked because the worker layer requires real commit, continuity, fallback, and manage artifacts to consume.",
    mergeCriteria: [
      "Own HubSupplierMirrorState exclusively.",
      "Repair truth through the canonical par_321 reducer instead of creating a second projection writer.",
      "Emit worker outcomes for canonical exception rows owned by par_323.",
    ],
    guardrails: ["Do not mint calmer truth from stale supplier evidence."],
    carryForwardIssueRefs: ["ISSUE310_004"],
    collisionSeamRefs: [
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
    ],
    unlockRule:
      "Unlock after par_321 through par_324 provide the canonical evidence, continuity, fallback, and manage feeds.",
  },
  {
    trackId: "par_326",
    seq: 326,
    title: "Hub desk shell family and start-of-day views",
    shortMission:
      "Build the real hub shell, route family chrome, and start-of-day landing surfaces with Playwright-led proof from the start.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/326.md",
    ownedArtifacts: ["HubDeskShell", "HubStartOfDayLandingView"],
    nonOwnedArtifacts: ["HubQueueWorkbenchProjection", "ActingContext"],
    producedInterfaces: ["HubShellSlots", "DecisionDockContract", "StartOfDaySummaryView"],
    dependsOnTracks: ["par_315", "par_316", "par_319", "par_325"],
    dependsOnContracts: [
      "data/contracts/311_hub_route_family_registry.yaml",
      "prompt/326.md",
    ],
    readinessReason:
      "Blocked because the shell must mount real queue, exception, and visibility posture instead of placeholders, and because ISSUE310_003 keeps performance visible on all shell work.",
    mergeCriteria: [
      "Keep shell ownership aligned to the 311 route-family contract.",
      "Expose mount points for queue, commit, reminder, recovery, and acting-context surfaces without redefining their semantics.",
    ],
    guardrails: ["Treat the 200ms interaction issue as an explicit UI carry-forward constraint."],
    carryForwardIssueRefs: ["ISSUE310_003"],
    collisionSeamRefs: [],
    unlockRule: "Unlock after backend queue and exception projections are stable enough to mount in a real shell.",
  },
  {
    trackId: "par_327",
    seq: 327,
    title: "Queue workbench, candidate ranking, and SLA visualization",
    shortMission:
      "Build the operational queue heart: ranked candidate presentation, breach-risk cues, and trustable explanation surfaces.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/327.md",
    ownedArtifacts: ["HubQueueWorkbenchView", "CandidateRankingWorkbenchView", "SLARiskView"],
    nonOwnedArtifacts: ["HubDeskShell", "AlternativeOfferSession"],
    producedInterfaces: ["QueueWorkbenchUI", "CandidateExplanationSurface"],
    dependsOnTracks: ["par_318", "par_319", "par_326"],
    dependsOnContracts: [
      "docs/api/312_phase5_candidate_snapshot_and_rank_contract.md",
      "prompt/327.md",
    ],
    readinessReason:
      "Blocked because the frontend workbench depends on the actual snapshot, proof, and queue projections from par_318 and par_319.",
    mergeCriteria: [
      "Render rank order and reasons from persisted proofs only.",
      "Keep SLA severity aligned to projection data, not client-side heuristics.",
    ],
    guardrails: ["Maintain performance discipline from ISSUE310_003 when building dense operational surfaces."],
    carryForwardIssueRefs: ["ISSUE310_003"],
    collisionSeamRefs: [],
    unlockRule: "Unlock after par_318 and par_319 publish stable candidate and queue feeds.",
  },
  {
    trackId: "par_328",
    seq: 328,
    title: "Patient network alternatives and callback-fallback views",
    shortMission:
      "Build the patient-facing alternative-choice route and callback-fallback views for governed network choice.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/328.md",
    ownedArtifacts: ["PatientNetworkAlternativesView", "PatientCallbackFallbackView"],
    nonOwnedArtifacts: ["AlternativeOfferSession", "HubOfferToConfirmationTruthProjection"],
    producedInterfaces: ["PatientChoiceRoute", "CallbackFallbackUI"],
    dependsOnTracks: ["par_320", "par_323", "par_326"],
    dependsOnContracts: [
      "docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
      "prompt/328.md",
    ],
    readinessReason:
      "Blocked because truthful choice depends on real offer sessions, fallback rules, and shell continuity.",
    mergeCriteria: [
      "Render full-set governed choice rather than recommendation-only cards.",
      "Keep patient-facing choice states aligned to persisted offer-session truth.",
    ],
    guardrails: ["Do not imply commit certainty before authoritative confirmation evidence exists."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    unlockRule: "Unlock after par_320 and par_323 publish stable patient-choice and fallback feeds.",
  },
  {
    trackId: "par_329",
    seq: 329,
    title: "Cross-org commit, confirmation, and practice-visibility surfaces",
    shortMission:
      "Build the staff commit surfaces, patient confirmation view, and origin-practice visibility panel around lawful evidence.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/329.md",
    ownedArtifacts: [
      "HubCommitConfirmationWorkspace",
      "PatientNetworkConfirmationView",
      "OriginPracticeVisibilityPanel",
    ],
    nonOwnedArtifacts: ["HubCommitAttempt", "PracticeVisibilityProjection"],
    producedInterfaces: ["CommitConfirmationUI", "PracticeVisibilityPanelUI"],
    dependsOnTracks: ["par_321", "par_322", "par_324", "par_326"],
    dependsOnContracts: [
      "docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
      "prompt/329.md",
    ],
    readinessReason:
      "Blocked because the surfaces must read real commit evidence, message timeline posture, and manage-capability projections.",
    mergeCriteria: [
      "Keep calm confirmation posture strictly behind authoritative confirmation truth.",
      "Show acknowledgement debt and practice visibility as separate lanes.",
    ],
    guardrails: ["Preserve the same evidence-class boundaries carried forward in ISSUE310_004."],
    carryForwardIssueRefs: ["ISSUE310_004"],
    collisionSeamRefs: [
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
    ],
    unlockRule: "Unlock after par_321, par_322, and par_324 expose stable confirmation and visibility feeds.",
  },
  {
    trackId: "par_330",
    seq: 330,
    title: "Network reminders, manage flows, and message timeline views",
    shortMission:
      "Build patient manage surfaces, reminder views, and unified message timeline behavior for network appointments.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/330.md",
    ownedArtifacts: ["NetworkManageView", "NetworkReminderView", "MessageTimelineView"],
    nonOwnedArtifacts: ["NetworkManageCapabilities", "PracticeContinuityMessage"],
    producedInterfaces: ["ManageTimelineUI", "ReminderTimelineUI"],
    dependsOnTracks: ["par_322", "par_324", "par_329"],
    dependsOnContracts: [
      "data/contracts/313_network_manage_capabilities.schema.json",
      "prompt/330.md",
    ],
    readinessReason:
      "Blocked because manage and reminder UX depend on current continuity evidence and commit/visibility shell anchors.",
    mergeCriteria: [
      "Keep reminder and manage actions causally aligned with current truth and contact-route repair state.",
      "Render message-timeline evidence as one route family, not a detached notification center.",
    ],
    guardrails: ["Do not present interactive manage posture when the backend says stale, blocked, or expired."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    unlockRule: "Unlock after par_322, par_324, and par_329 are stable together.",
  },
  {
    trackId: "par_331",
    seq: 331,
    title: "No-slot, reopen, and urgent bounce-back recovery views",
    shortMission:
      "Build the deliberate recovery layer for no-slot, callback transfer, urgent bounce-back, reopen, and hub-exception cases.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/331.md",
    ownedArtifacts: ["HubRecoveryWorkspace", "NoSlotRecoveryView", "UrgentBounceBackView"],
    nonOwnedArtifacts: ["HubCoordinationException", "HubFallbackRecord"],
    producedInterfaces: ["RecoveryRouteFamily", "ReopenDecisionUI"],
    dependsOnTracks: ["par_323", "par_325", "par_326"],
    dependsOnContracts: ["prompt/331.md"],
    readinessReason:
      "Blocked because the recovery UI depends on real canonical exceptions plus worker outcomes and shell context.",
    mergeCriteria: [
      "Keep provenance, rationale, and same-shell context visible for every recovery branch.",
      "Render reopen posture from canonical exception and fallback objects only.",
    ],
    guardrails: ["Do not hide exception lineage behind generic error states."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
    ],
    unlockRule: "Unlock after par_323 and par_325 publish stable exception and worker-outcome feeds.",
  },
  {
    trackId: "par_332",
    seq: 332,
    title: "Org-aware access controls and acting-context switcher",
    shortMission:
      "Build the live staff control plane for organisation, site, role, purpose of use, and acting-scope switching.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/332.md",
    ownedArtifacts: ["ActingContextSwitcherSurface", "OrgAwareAccessControlPlane"],
    nonOwnedArtifacts: ["ActingContext", "HubDeskShell"],
    producedInterfaces: ["ActingScopeSwitcherUI", "MinimumNecessaryBannerUI"],
    dependsOnTracks: ["par_316", "par_326"],
    dependsOnContracts: [
      "docs/security/311_phase5_org_boundary_and_visibility_rules.md",
      "prompt/332.md",
    ],
    readinessReason:
      "Blocked because the staff control plane needs the real acting-context backend plus shell mount points.",
    mergeCriteria: [
      "Expose current organisation, site, role, and purpose-of-use without downgrading minimum-necessary rules.",
      "Freeze writable posture visibly when acting scope is stale or superseded.",
    ],
    guardrails: ["Do not hide acting-context drift behind silent route reloads."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    unlockRule: "Unlock after par_316 and par_326 expose stable acting-context and shell contracts.",
  },
  {
    trackId: "par_333",
    seq: 333,
    title: "Mobile and narrow-screen hub workflows",
    shortMission:
      "Build the canonical folded-shell contract for narrow-screen and mobile-safe hub workflows.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/333.md",
    ownedArtifacts: ["MissionStackFoldedShell", "NarrowScreenHubWorkflowFamily"],
    nonOwnedArtifacts: ["HubDeskShell", "HubQueueWorkbenchView"],
    producedInterfaces: ["FoldedShellContract", "MobileDecisionDock"],
    dependsOnTracks: ["par_326", "par_327", "par_329", "par_332"],
    dependsOnContracts: ["prompt/333.md"],
    readinessReason:
      "Blocked because the mobile-safe contract is a refinement of real shell, queue, confirmation, and acting-context surfaces, and because ISSUE310_003 makes performance part of the exit condition.",
    mergeCriteria: [
      "Preserve anchors, DecisionDock meaning, and recovery posture while folding the shell.",
      "Prove no responsive collapse under the 200ms interaction follow-up constraint.",
    ],
    guardrails: ["Treat the Phase 4 interaction-budget miss as a hard responsive follow-up."],
    carryForwardIssueRefs: ["ISSUE310_003"],
    collisionSeamRefs: [],
    unlockRule: "Unlock after shell, queue, confirmation, and acting-context surfaces are already stable on desktop.",
  },
  {
    trackId: "par_334",
    seq: 334,
    title: "Cross-org accessibility, content, and artifact handoff refinements",
    shortMission:
      "Refine the Phase 5 frontend family so copy, accessibility, and artifact behavior remain lawful across hub, patient, and practice surfaces.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/334.md",
    ownedArtifacts: ["CrossOrgContentRefinementPack", "ArtifactHandoffRefinementPack"],
    nonOwnedArtifacts: ["PatientNetworkConfirmationView", "NetworkManageView"],
    producedInterfaces: ["AccessibleContentRules", "ArtifactSummaryBehavior"],
    dependsOnTracks: ["par_329", "par_330", "par_331", "par_332", "par_333"],
    dependsOnContracts: ["prompt/334.md"],
    readinessReason:
      "Blocked because refinement work must land on top of the actual frontend family, not placeholders.",
    mergeCriteria: [
      "Keep content summary-first and minimum-necessary across every audience surface.",
      "Preserve artifact behavior parity across hub, patient, and practice views.",
    ],
    guardrails: ["Do not turn refinement work into semantic re-ownership of underlying objects."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    unlockRule: "Unlock after the wave-3 frontend family exists and is Playwright-proven.",
  },
  {
    trackId: "seq_335",
    seq: 335,
    title: "Configure MESH mailboxes and cross-org message routes",
    shortMission:
      "Configure deterministic non-production MESH mailboxes, partner routes, and route manifests under change control.",
    domain: "ops",
    wave: "ops",
    readiness: "deferred",
    promptRef: "prompt/335.md",
    ownedArtifacts: ["MeshMailboxConfigurationPack", "CrossOrgMessageRouteManifest"],
    nonOwnedArtifacts: ["PracticeContinuityMessage", "NetworkManageCapabilities"],
    producedInterfaces: ["MeshEnvironmentBinding", "MailboxRouteVerificationEvidence"],
    dependsOnTracks: ["par_322", "par_324", "par_329", "par_334"],
    dependsOnContracts: [
      "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_MESH_DISPATCH_AND_DELIVERY.json",
      "prompt/335.md",
    ],
    readinessReason:
      "Deferred because it is operationally sensitive and depends on later-owned continuity and visibility surfaces plus non-production credentials and partner onboarding state that are intentionally outside the current repo freeze.",
    mergeCriteria: [
      "Keep mailbox identities, credentials, and route manifests under change control.",
      "Prove route verification against deterministic non-production partners only.",
    ],
    guardrails: ["Do not open until code consumers and non-production credentials are ready together."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    unlockRule:
      "Unlock after par_322, par_324, par_329, and par_334 are merged and a non-production credential window is approved.",
  },
  {
    trackId: "seq_336",
    seq: 336,
    title: "Configure network capacity feeds and partner credentials",
    shortMission:
      "Configure deterministic non-production supplier feeds, partner credentials, mappings, and trust-admission settings.",
    domain: "ops",
    wave: "ops",
    readiness: "deferred",
    promptRef: "prompt/336.md",
    ownedArtifacts: ["CapacityFeedBindingPack", "PartnerCredentialReferenceSet"],
    nonOwnedArtifacts: ["HubCapacityAdapter", "NetworkSlotCandidate"],
    producedInterfaces: ["CapacityFeedEnvironmentBinding", "PartnerTrustAdmissionConfig"],
    dependsOnTracks: ["par_317", "par_318", "par_319", "par_333"],
    dependsOnContracts: ["prompt/336.md"],
    readinessReason:
      "Deferred because it is operationally sensitive and depends on later capacity-ingestion code, partner mappings, and non-production credentials that are intentionally not opened in the first executable wave.",
    mergeCriteria: [
      "Keep partner endpoints, credentials, ODS mappings, and schedules under change control.",
      "Separate supplier onboarding from runtime trust semantics so live claims remain constrained.",
    ],
    guardrails: ["Do not open until capacity-ingestion code and non-production credential windows are both ready."],
    carryForwardIssueRefs: ["ISSUE310_004"],
    collisionSeamRefs: [],
    unlockRule:
      "Unlock after par_317, par_318, and par_319 are merged and a non-production partner credential window is approved.",
  },
  {
    trackId: "seq_337",
    seq: 337,
    title: "Merge network coordination with local booking and manage flows",
    shortMission:
      "Integrate the Phase 5 network family with the existing local-booking and patient-manage experience without collapsing authoritative objects.",
    domain: "integration",
    wave: "integration",
    readiness: "blocked",
    promptRef: "prompt/337.md",
    ownedArtifacts: ["CrossFamilyNetworkIntegrationGate"],
    nonOwnedArtifacts: ["HubDeskShell", "PatientNetworkConfirmationView"],
    producedInterfaces: ["CrossFamilyShellIntegration", "NetworkManageEntryIntegration"],
    dependsOnTracks: [
      "par_326",
      "par_327",
      "par_328",
      "par_329",
      "par_330",
      "par_331",
      "par_332",
      "par_333",
      "par_334",
      "seq_335",
      "seq_336",
    ],
    dependsOnContracts: ["prompt/337.md"],
    readinessReason:
      "Blocked until the backend family, frontend family, and operational bindings all exist together.",
    mergeCriteria: [
      "Preserve distinct authoritative objects while making the shell experience coherent.",
      "Keep same-shell manage entry and fallback continuity aligned across local and network cases.",
    ],
    guardrails: ["Do not attempt integration against placeholders or deferred ops configuration."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    unlockRule: "Unlock only after wave-2, wave-3, and operational tasks are complete.",
  },
  {
    trackId: "seq_338",
    seq: 338,
    title: "Run org-boundary, capacity, ranking, and SLA proof suites",
    shortMission:
      "Build and run the first release-grade Phase 5 proof battery covering boundaries, capacity admission, queue order, and SLA posture before commit begins.",
    domain: "testing",
    wave: "proof",
    readiness: "blocked",
    promptRef: "prompt/338.md",
    ownedArtifacts: ["Phase5PreCommitProofBattery"],
    nonOwnedArtifacts: ["HubQueueWorkbenchProjection", "CrossOrganisationVisibilityEnvelope"],
    producedInterfaces: ["PreCommitProofResults"],
    dependsOnTracks: ["par_315", "par_316", "par_317", "par_318", "par_319", "par_326", "par_327", "par_332", "seq_337"],
    dependsOnContracts: ["prompt/338.md"],
    readinessReason:
      "Blocked until the relevant backend, shell, and integration surfaces exist together for release-grade proof.",
    mergeCriteria: [
      "Prove boundary enforcement, ranking order, and SLA posture from integrated code rather than frozen docs alone.",
      "Capture machine-readable artifacts suitable for later exit gates.",
    ],
    guardrails: ["Do not call the battery complete before the integration track exists."],
    carryForwardIssueRefs: [],
    collisionSeamRefs: [],
    unlockRule: "Unlock after the pre-commit backend and frontend family is integrated by seq_337.",
  },
  {
    trackId: "seq_339",
    seq: 339,
    title: "Run commit, MESH dispatch, no-slot, and reopen proof suites",
    shortMission:
      "Build and run the release-grade battery for commit truth, continuity routing, patient confirmation, no-slot recovery, and reopen behavior.",
    domain: "testing",
    wave: "proof",
    readiness: "blocked",
    promptRef: "prompt/339.md",
    ownedArtifacts: ["Phase5PostSelectionProofBattery"],
    nonOwnedArtifacts: ["HubCommitAttempt", "PracticeContinuityMessage"],
    producedInterfaces: ["PostSelectionProofResults"],
    dependsOnTracks: [
      "par_320",
      "par_321",
      "par_322",
      "par_323",
      "par_324",
      "par_325",
      "par_328",
      "par_329",
      "par_330",
      "par_331",
      "seq_335",
      "seq_337",
      "seq_338",
    ],
    dependsOnContracts: ["prompt/339.md"],
    readinessReason:
      "Blocked because it exercises the later commit, continuity, and recovery family plus operational MESH routing.",
    mergeCriteria: [
      "Keep false-calmness and hidden fallback debt as explicit failure conditions.",
      "Use real route verification effects from seq_335 once operationally opened.",
    ],
    guardrails: ["Do not claim practice acknowledgement or route success from transport evidence alone."],
    carryForwardIssueRefs: ["ISSUE310_004"],
    collisionSeamRefs: [],
    unlockRule: "Unlock after the post-selection backend, frontend, and MESH route tracks are complete.",
  },
  {
    trackId: "seq_340",
    seq: 340,
    title: "Run patient-choice, cross-org visibility, and responsive regression suites",
    shortMission:
      "Build and run the final browser-visible proof battery for patient choice truthfulness, visibility discipline, acting-context drift, and responsive stability.",
    domain: "testing",
    wave: "proof",
    readiness: "blocked",
    promptRef: "prompt/340.md",
    ownedArtifacts: ["Phase5BrowserVisibilityRegressionBattery"],
    nonOwnedArtifacts: ["PatientNetworkAlternativesView", "MissionStackFoldedShell"],
    producedInterfaces: ["BrowserVisibilityRegressionResults"],
    dependsOnTracks: ["par_328", "par_329", "par_330", "par_332", "par_333", "par_334", "seq_337", "seq_339"],
    dependsOnContracts: ["prompt/340.md"],
    readinessReason:
      "Blocked until patient choice, visibility, responsive shell, and post-selection proof surfaces are all complete.",
    mergeCriteria: [
      "Prove patient choice is explanation-backed, stable under refresh, and responsive-safe.",
      "Use this battery to close the carry-forward interaction-budget issue before any widened rollout claim.",
    ],
    guardrails: ["Treat ISSUE310_003 as an explicit proof target, not a background note."],
    carryForwardIssueRefs: ["ISSUE310_003"],
    collisionSeamRefs: [],
    unlockRule:
      "Unlock after seq_337 and seq_339 are complete and the responsive frontend family is stable.",
  },
];

const ARTIFACTS: Artifact[] = [
  {
    artifactId: "NetworkBookingRequest",
    kind: "object",
    canonicalOwnerTrack: "par_315",
    readinessGate: "ready",
    authorityRefs: ["data/contracts/311_network_booking_request.schema.json", "prompt/315.md"],
    consumerTracks: ["par_318", "par_319", "par_320", "par_321", "par_323"],
    notes: "Canonical intake object for Phase 5 network coordination.",
  },
  {
    artifactId: "HubCoordinationCase",
    kind: "object",
    canonicalOwnerTrack: "par_315",
    readinessGate: "ready",
    authorityRefs: ["data/contracts/311_hub_coordination_case.schema.json", "prompt/315.md"],
    consumerTracks: ["par_318", "par_319", "par_320", "par_321", "par_323", "par_326"],
    notes: "Canonical hub case aggregate; ownership fence and lineage live here.",
  },
  {
    artifactId: "HubCoordinationStateMachine",
    kind: "object",
    canonicalOwnerTrack: "par_315",
    readinessGate: "ready",
    authorityRefs: ["data/contracts/311_hub_coordination_state_machine.json", "prompt/315.md"],
    consumerTracks: ["par_319", "par_323", "par_331"],
    notes: "Transition law stays coupled to the canonical case kernel.",
  },
  {
    artifactId: "StaffIdentityContext",
    kind: "object",
    canonicalOwnerTrack: "par_316",
    readinessGate: "ready",
    authorityRefs: ["data/contracts/311_staff_identity_context.schema.json", "prompt/316.md"],
    consumerTracks: ["par_321", "par_322", "par_324", "par_332"],
    notes: "Identity source of truth for authenticated staff context.",
  },
  {
    artifactId: "ActingContext",
    kind: "object",
    canonicalOwnerTrack: "par_316",
    readinessGate: "ready",
    authorityRefs: ["data/contracts/311_acting_context.schema.json", "prompt/316.md"],
    consumerTracks: ["par_321", "par_322", "par_324", "par_332"],
    notes: "Current acting posture for cross-organisation work.",
  },
  {
    artifactId: "ActingScopeTuple",
    kind: "object",
    canonicalOwnerTrack: "par_316",
    readinessGate: "ready",
    authorityRefs: ["prompt/316.md"],
    consumerTracks: ["par_321", "par_332"],
    notes: "Issued and superseded with acting-context drift handling.",
  },
  {
    artifactId: "CrossOrganisationVisibilityEnvelope",
    kind: "object",
    canonicalOwnerTrack: "par_316",
    readinessGate: "ready",
    authorityRefs: [
      "data/contracts/311_cross_org_visibility_envelope.schema.json",
      "prompt/316.md",
    ],
    consumerTracks: ["par_321", "par_322", "par_324", "par_326", "par_329"],
    notes: "Minimum-necessary audience contract used by backend and frontend surfaces.",
  },
  {
    artifactId: "EnhancedAccessPolicy",
    kind: "object",
    canonicalOwnerTrack: "par_317",
    readinessGate: "ready",
    authorityRefs: ["data/contracts/312_enhanced_access_policy.schema.json", "prompt/317.md"],
    consumerTracks: ["par_318", "seq_336"],
    notes: "Versioned root policy object.",
  },
  {
    artifactId: "HubRoutingPolicyPack",
    kind: "object",
    canonicalOwnerTrack: "par_317",
    readinessGate: "ready",
    authorityRefs: [
      "data/contracts/312_hub_routing_policy_pack.schema.json",
      "prompt/317.md",
    ],
    consumerTracks: ["par_318", "par_319"],
    notes: "Routing disposition component of the policy tuple.",
  },
  {
    artifactId: "HubVarianceWindowPolicy",
    kind: "object",
    canonicalOwnerTrack: "par_317",
    readinessGate: "ready",
    authorityRefs: [
      "data/contracts/312_hub_variance_window_policy.schema.json",
      "prompt/317.md",
    ],
    consumerTracks: ["par_318"],
    notes: "Window-fit ownership remains inside par_317.",
  },
  {
    artifactId: "HubServiceObligationPolicy",
    kind: "object",
    canonicalOwnerTrack: "par_317",
    readinessGate: "ready",
    authorityRefs: [
      "data/contracts/312_hub_service_obligation_policy.schema.json",
      "prompt/317.md",
    ],
    consumerTracks: ["par_318"],
    notes: "May mint ledgers but never rescore rank order.",
  },
  {
    artifactId: "HubPracticeVisibilityPolicy",
    kind: "object",
    canonicalOwnerTrack: "par_317",
    readinessGate: "ready",
    authorityRefs: [
      "data/contracts/312_hub_practice_visibility_policy.schema.json",
      "prompt/317.md",
    ],
    consumerTracks: ["par_318", "par_324"],
    notes: "Visibility policy contributes posture, not ordering.",
  },
  {
    artifactId: "HubCapacityIngestionPolicy",
    kind: "object",
    canonicalOwnerTrack: "par_317",
    readinessGate: "ready",
    authorityRefs: [
      "data/contracts/312_hub_capacity_ingestion_policy.schema.json",
      "prompt/317.md",
    ],
    consumerTracks: ["par_318", "seq_336"],
    notes: "Feed admission and trust semantics freeze here.",
  },
  {
    artifactId: "NetworkCoordinationPolicyEvaluation",
    kind: "object",
    canonicalOwnerTrack: "par_317",
    readinessGate: "ready",
    authorityRefs: [
      "data/contracts/312_network_coordination_policy_evaluation.schema.json",
      "prompt/317.md",
    ],
    consumerTracks: ["par_318"],
    notes: "Replayable output consumed by candidate ingestion and decision planning.",
  },
  {
    artifactId: "HubCapacityAdapter",
    kind: "service",
    canonicalOwnerTrack: "par_318",
    readinessGate: "blocked",
    authorityRefs: ["prompt/318.md"],
    consumerTracks: ["seq_336"],
    notes: "Adapter seam for source modes; blocked on wave 1.",
  },
  {
    artifactId: "NetworkSlotCandidate",
    kind: "object",
    canonicalOwnerTrack: "par_318",
    readinessGate: "blocked",
    authorityRefs: ["data/contracts/312_network_slot_candidate.schema.json", "prompt/318.md"],
    consumerTracks: ["par_319", "par_320", "seq_338"],
    notes: "Normalized candidate row blocked until wave-1 implementation exists.",
  },
  {
    artifactId: "NetworkCandidateSnapshot",
    kind: "object",
    canonicalOwnerTrack: "par_318",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/312_network_candidate_snapshot.schema.json",
      "prompt/318.md",
    ],
    consumerTracks: ["par_319", "par_320", "par_327"],
    notes: "Snapshot bundle for queue, offer, and UI consumption.",
  },
  {
    artifactId: "CrossSiteDecisionPlan",
    kind: "object",
    canonicalOwnerTrack: "par_318",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/312_cross_site_decision_plan.schema.json",
      "prompt/318.md",
    ],
    consumerTracks: ["par_319", "par_320", "seq_338"],
    notes: "Direct-commit and patient-offerable frontier plan.",
  },
  {
    artifactId: "CapacityRankProof",
    kind: "object",
    canonicalOwnerTrack: "par_318",
    readinessGate: "blocked",
    authorityRefs: ["data/contracts/312_capacity_rank_proof_contract.json", "prompt/318.md"],
    consumerTracks: ["par_319", "par_327", "seq_338"],
    notes: "Persisted proof for ranking order and explanation stability.",
  },
  {
    artifactId: "CapacityRankExplanation",
    kind: "object",
    canonicalOwnerTrack: "par_318",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/312_capacity_rank_explanation_contract.json",
      "prompt/318.md",
    ],
    consumerTracks: ["par_320", "par_327", "seq_340"],
    notes: "Patient-safe and staff-safe reason cues from persisted proof.",
  },
  {
    artifactId: "EnhancedAccessMinutesLedger",
    kind: "object",
    canonicalOwnerTrack: "par_318",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/312_enhanced_access_minutes_ledger.schema.json",
      "prompt/318.md",
    ],
    consumerTracks: ["seq_338"],
    notes: "Service-obligation evidence stays in the candidate pipeline.",
  },
  {
    artifactId: "CancellationMakeUpLedger",
    kind: "object",
    canonicalOwnerTrack: "par_318",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/312_cancellation_make_up_ledger.schema.json",
      "prompt/318.md",
    ],
    consumerTracks: ["seq_338"],
    notes: "Make-up obligation evidence stays in the candidate pipeline.",
  },
  {
    artifactId: "HubQueueWorkbenchProjection",
    kind: "projection",
    canonicalOwnerTrack: "par_319",
    readinessGate: "blocked",
    authorityRefs: ["prompt/319.md"],
    consumerTracks: ["par_326", "par_327", "par_333", "seq_338"],
    notes: "Queue projection blocked until candidate snapshots exist.",
  },
  {
    artifactId: "HubConsoleConsistencyProjection",
    kind: "projection",
    canonicalOwnerTrack: "par_319",
    readinessGate: "blocked",
    authorityRefs: ["prompt/319.md"],
    consumerTracks: ["par_326", "par_327"],
    notes: "Consistency cues for staff console surfaces.",
  },
  {
    artifactId: "HubCaseConsoleProjection",
    kind: "projection",
    canonicalOwnerTrack: "par_319",
    readinessGate: "blocked",
    authorityRefs: ["prompt/319.md"],
    consumerTracks: ["par_326", "par_327"],
    notes: "Case row projection for desk workbench.",
  },
  {
    artifactId: "HubOptionCardProjection",
    kind: "projection",
    canonicalOwnerTrack: "par_319",
    readinessGate: "blocked",
    authorityRefs: ["prompt/319.md"],
    consumerTracks: ["par_327"],
    notes: "Option-card projection for staff review of ranked candidates.",
  },
  {
    artifactId: "HubPostureProjection",
    kind: "projection",
    canonicalOwnerTrack: "par_319",
    readinessGate: "blocked",
    authorityRefs: ["prompt/319.md"],
    consumerTracks: ["par_326", "par_327", "par_333"],
    notes: "Operational posture summary for shell and queue views.",
  },
  {
    artifactId: "HubEscalationBannerProjection",
    kind: "projection",
    canonicalOwnerTrack: "par_319",
    readinessGate: "blocked",
    authorityRefs: ["prompt/319.md"],
    consumerTracks: ["par_326", "par_327", "par_331"],
    notes: "Escalation banner state for staff surfaces.",
  },
  {
    artifactId: "AlternativeOfferOptimisationPlan",
    kind: "object",
    canonicalOwnerTrack: "par_320",
    readinessGate: "blocked",
    authorityRefs: ["prompt/320.md"],
    consumerTracks: ["par_328"],
    notes: "Offer-planning artifact owned exclusively by par_320.",
  },
  {
    artifactId: "AlternativeOfferSession",
    kind: "object",
    canonicalOwnerTrack: "par_320",
    readinessGate: "blocked",
    authorityRefs: ["data/contracts/313_alternative_offer_session.schema.json", "prompt/320.md"],
    consumerTracks: ["par_321", "par_328", "seq_340"],
    notes: "Canonical offer session for patient choice.",
  },
  {
    artifactId: "AlternativeOfferEntry",
    kind: "object",
    canonicalOwnerTrack: "par_320",
    readinessGate: "blocked",
    authorityRefs: ["data/contracts/313_alternative_offer_entry.schema.json", "prompt/320.md"],
    consumerTracks: ["par_328"],
    notes: "Entry rows inside governed patient-choice sessions.",
  },
  {
    artifactId: "AlternativeOfferFallbackCard",
    kind: "object",
    canonicalOwnerTrack: "par_320",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/313_alternative_offer_fallback_card.schema.json",
      "prompt/320.md",
    ],
    consumerTracks: ["par_323", "par_328"],
    notes: "Fallback posture surfaced to patients when an offer set is insufficient.",
  },
  {
    artifactId: "AlternativeOfferRegenerationSettlement",
    kind: "object",
    canonicalOwnerTrack: "par_320",
    readinessGate: "blocked",
    authorityRefs: ["prompt/320.md"],
    consumerTracks: ["par_321"],
    notes: "Settlement artifact for regenerated offer sessions.",
  },
  {
    artifactId: "HubCommitAttempt",
    kind: "object",
    canonicalOwnerTrack: "par_321",
    readinessGate: "blocked",
    authorityRefs: ["data/contracts/313_hub_commit_attempt.schema.json", "prompt/321.md"],
    consumerTracks: ["par_322", "par_325", "par_329", "seq_339"],
    notes: "Canonical commit attempt row for fenced booking execution.",
  },
  {
    artifactId: "HubActionRecord",
    kind: "object",
    canonicalOwnerTrack: "par_321",
    readinessGate: "blocked",
    authorityRefs: ["prompt/321.md"],
    consumerTracks: ["par_329"],
    notes: "Same-shell action audit for staff mutation steps.",
  },
  {
    artifactId: "HubCommitSettlement",
    kind: "object",
    canonicalOwnerTrack: "par_321",
    readinessGate: "blocked",
    authorityRefs: ["prompt/321.md"],
    consumerTracks: ["par_329"],
    notes: "Settlement summary for commit attempts.",
  },
  {
    artifactId: "HubBookingEvidenceBundle",
    kind: "object",
    canonicalOwnerTrack: "par_321",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/313_hub_booking_evidence_bundle.schema.json",
      "prompt/321.md",
    ],
    consumerTracks: ["par_322", "par_324", "par_325", "par_329", "seq_339"],
    notes: "Authoritative evidence bundle consumed by continuity and manage tracks.",
  },
  {
    artifactId: "HubAppointmentRecord",
    kind: "object",
    canonicalOwnerTrack: "par_321",
    readinessGate: "blocked",
    authorityRefs: ["data/contracts/313_hub_appointment_record.schema.json", "prompt/321.md"],
    consumerTracks: ["par_322", "par_324", "par_325", "par_329", "seq_339"],
    notes: "Network appointment row created by successful commit.",
  },
  {
    artifactId: "HubOfferToConfirmationTruthProjection",
    kind: "projection",
    canonicalOwnerTrack: "par_321",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/313_hub_offer_to_confirmation_truth_projection.schema.json",
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
      "prompt/321.md",
    ],
    consumerTracks: ["par_322", "par_323", "par_324", "par_325", "par_329", "par_330"],
    notes:
      "Canonical truth projection survives the collision only because 314 locks par_321 as sole persisted writer.",
    facetOwners: [
      {
        facetId: "offer_facet",
        ownerTrack: "par_320",
        mode: "delta_only",
        allowedFields: ["offerState", "offerSelectionState", "offerExpiryState"],
      },
      {
        facetId: "commit_facet",
        ownerTrack: "par_321",
        mode: "canonical_writer",
        allowedFields: ["confirmationTruthState", "closureState", "truthTupleHash"],
      },
      {
        facetId: "practice_visibility_facet",
        ownerTrack: "par_322",
        mode: "delta_only",
        allowedFields: ["practiceVisibilityState", "practiceAckGeneration"],
      },
      {
        facetId: "fallback_facet",
        ownerTrack: "par_323",
        mode: "delta_only",
        allowedFields: ["fallbackLinkageState", "closureState"],
      },
      {
        facetId: "manage_visibility_facet",
        ownerTrack: "par_324",
        mode: "delta_only",
        allowedFields: ["practiceVisibilityState", "manageCapabilityState"],
      },
      {
        facetId: "repair_replay_facet",
        ownerTrack: "par_325",
        mode: "repair_only",
        allowedFields: ["repairRequestRef", "replayReason"],
      },
    ],
  },
  {
    artifactId: "PracticeContinuityMessage",
    kind: "object",
    canonicalOwnerTrack: "par_322",
    readinessGate: "blocked",
    authorityRefs: ["data/contracts/313_practice_continuity_message.schema.json", "prompt/322.md"],
    consumerTracks: ["par_324", "par_330", "seq_335", "seq_339"],
    notes: "Canonical continuity message chain for hub-to-practice routing.",
  },
  {
    artifactId: "PracticeAcknowledgementRecord",
    kind: "object",
    canonicalOwnerTrack: "par_322",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/313_practice_acknowledgement_record.schema.json",
      "prompt/322.md",
    ],
    consumerTracks: ["par_323", "par_324", "par_329", "seq_339"],
    notes: "Generation-bound acknowledgement evidence.",
  },
  {
    artifactId: "PracticeContinuityDispatchAttempt",
    kind: "object",
    canonicalOwnerTrack: "par_322",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_MESH_DISPATCH_AND_DELIVERY.json",
      "prompt/322.md",
    ],
    consumerTracks: ["seq_335", "seq_339"],
    notes: "Typed dispatch-attempt seam owned by continuity routing.",
  },
  {
    artifactId: "PracticeContinuityReceiptCheckpoint",
    kind: "object",
    canonicalOwnerTrack: "par_322",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_MESH_DISPATCH_AND_DELIVERY.json",
      "prompt/322.md",
    ],
    consumerTracks: ["par_324", "seq_335", "seq_339"],
    notes: "Typed receipt checkpoint seam owned by continuity routing.",
  },
  {
    artifactId: "HubFallbackRecord",
    kind: "object",
    canonicalOwnerTrack: "par_323",
    readinessGate: "blocked",
    authorityRefs: ["data/contracts/PHASE5_INTERFACE_GAP_HUB_CORE_FALLBACK_AND_VISIBILITY.json", "prompt/323.md"],
    consumerTracks: ["par_324", "par_331", "seq_339"],
    notes: "Canonical fallback record for no-slot and reopen behavior.",
  },
  {
    artifactId: "CallbackFallbackRecord",
    kind: "object",
    canonicalOwnerTrack: "par_323",
    readinessGate: "blocked",
    authorityRefs: ["prompt/323.md"],
    consumerTracks: ["par_331", "seq_339"],
    notes: "Callback-specific fallback record stays with the recovery track.",
  },
  {
    artifactId: "HubReturnToPracticeRecord",
    kind: "object",
    canonicalOwnerTrack: "par_323",
    readinessGate: "blocked",
    authorityRefs: ["prompt/323.md"],
    consumerTracks: ["par_331", "seq_339"],
    notes: "Return-to-practice record owned by the recovery track.",
  },
  {
    artifactId: "HubCoordinationException",
    kind: "object",
    canonicalOwnerTrack: "par_323",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_RECONCILIATION_AND_SUPPLIER_MIRROR.json",
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
      "prompt/323.md",
    ],
    consumerTracks: ["par_325", "par_331", "seq_339"],
    notes:
      "Canonical exception row survives the collision only because 314 locks par_323 as creator and schema owner.",
    facetOwners: [
      {
        facetId: "exception_creation",
        ownerTrack: "par_323",
        mode: "canonical_writer",
        allowedFields: ["exceptionClass", "retryState", "truthTupleHash"],
      },
      {
        facetId: "worker_outcomes",
        ownerTrack: "par_325",
        mode: "worker_outcome_only",
        allowedFields: ["retryState", "escalationState", "workerOutcomeRef"],
      },
    ],
  },
  {
    artifactId: "NetworkReminderPlan",
    kind: "object",
    canonicalOwnerTrack: "par_324",
    readinessGate: "blocked",
    authorityRefs: ["prompt/324.md"],
    consumerTracks: ["par_330", "seq_339"],
    notes: "Reminder planning object owned by the manage/visibility track.",
  },
  {
    artifactId: "PracticeVisibilityProjection",
    kind: "projection",
    canonicalOwnerTrack: "par_324",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/313_practice_visibility_projection.schema.json",
      "prompt/324.md",
    ],
    consumerTracks: ["par_329", "par_330", "seq_339"],
    notes: "Practice-facing visibility view stays distinct from commit truth.",
  },
  {
    artifactId: "NetworkManageCapabilities",
    kind: "object",
    canonicalOwnerTrack: "par_324",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/313_network_manage_capabilities.schema.json",
      "prompt/324.md",
    ],
    consumerTracks: ["par_330", "seq_339"],
    notes: "Manage capability projection tied to current truth.",
  },
  {
    artifactId: "HubManageSettlement",
    kind: "object",
    canonicalOwnerTrack: "par_324",
    readinessGate: "blocked",
    authorityRefs: ["prompt/324.md"],
    consumerTracks: ["par_330"],
    notes: "Manage mutation settlement owned by the manage track.",
  },
  {
    artifactId: "PracticeVisibilityDeltaRecord",
    kind: "object",
    canonicalOwnerTrack: "par_324",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/313_practice_visibility_delta_record.schema.json",
      "prompt/324.md",
    ],
    consumerTracks: ["par_325", "seq_339"],
    notes: "Delta record between continuity evidence and practice visibility read models.",
  },
  {
    artifactId: "HubSupplierMirrorState",
    kind: "object",
    canonicalOwnerTrack: "par_325",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_RECONCILIATION_AND_SUPPLIER_MIRROR.json",
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
      "prompt/325.md",
    ],
    consumerTracks: ["par_324", "seq_339"],
    notes:
      "Canonical supplier mirror state is owned exclusively by par_325; par_321 may only bootstrap it.",
    facetOwners: [
      {
        facetId: "bootstrap_request",
        ownerTrack: "par_321",
        mode: "bootstrap_request_only",
        allowedFields: ["hubAppointmentId", "truthTupleHash", "commitEvidenceRef"],
      },
      {
        facetId: "mirror_state",
        ownerTrack: "par_325",
        mode: "canonical_writer",
        allowedFields: ["supplierObservationRevision", "driftState", "truthTupleHash"],
      },
    ],
  },
  {
    artifactId: "HubExceptionWorkerOutcome",
    kind: "object",
    canonicalOwnerTrack: "par_325",
    readinessGate: "blocked",
    authorityRefs: [
      "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
      "prompt/325.md",
    ],
    consumerTracks: ["par_323", "par_331"],
    notes: "Worker outcome handoff emitted by par_325 and consumed by canonical exception owner par_323.",
  },
  {
    artifactId: "HubBookingReconcilerService",
    kind: "service",
    canonicalOwnerTrack: "par_325",
    readinessGate: "blocked",
    authorityRefs: ["prompt/325.md"],
    consumerTracks: ["seq_339"],
    notes: "Background reconciler service for truth repair and drift detection.",
  },
  {
    artifactId: "HubDeskShell",
    kind: "surface",
    canonicalOwnerTrack: "par_326",
    readinessGate: "blocked",
    authorityRefs: ["data/contracts/311_hub_route_family_registry.yaml", "prompt/326.md"],
    consumerTracks: ["par_327", "par_329", "par_330", "par_331", "par_332", "par_333", "seq_337"],
    notes: "Canonical staff shell that later frontend tracks mount into.",
  },
  {
    artifactId: "HubStartOfDayLandingView",
    kind: "surface",
    canonicalOwnerTrack: "par_326",
    readinessGate: "blocked",
    authorityRefs: ["prompt/326.md"],
    consumerTracks: ["seq_337"],
    notes: "Start-of-day landing inside the hub shell family.",
  },
  {
    artifactId: "HubQueueWorkbenchView",
    kind: "surface",
    canonicalOwnerTrack: "par_327",
    readinessGate: "blocked",
    authorityRefs: ["prompt/327.md"],
    consumerTracks: ["par_333", "seq_337", "seq_338"],
    notes: "Operational queue workbench UI.",
  },
  {
    artifactId: "CandidateRankingWorkbenchView",
    kind: "surface",
    canonicalOwnerTrack: "par_327",
    readinessGate: "blocked",
    authorityRefs: ["prompt/327.md"],
    consumerTracks: ["par_333", "seq_338"],
    notes: "Candidate-ranking UI aligned to persisted proofs.",
  },
  {
    artifactId: "SLARiskView",
    kind: "surface",
    canonicalOwnerTrack: "par_327",
    readinessGate: "blocked",
    authorityRefs: ["prompt/327.md"],
    consumerTracks: ["seq_338"],
    notes: "SLA and breach-risk visualization surface.",
  },
  {
    artifactId: "PatientNetworkAlternativesView",
    kind: "surface",
    canonicalOwnerTrack: "par_328",
    readinessGate: "blocked",
    authorityRefs: ["prompt/328.md"],
    consumerTracks: ["seq_337", "seq_340"],
    notes: "Patient choice UI for governed network alternatives.",
  },
  {
    artifactId: "PatientCallbackFallbackView",
    kind: "surface",
    canonicalOwnerTrack: "par_328",
    readinessGate: "blocked",
    authorityRefs: ["prompt/328.md"],
    consumerTracks: ["seq_339", "seq_340"],
    notes: "Patient-facing callback fallback view.",
  },
  {
    artifactId: "HubCommitConfirmationWorkspace",
    kind: "surface",
    canonicalOwnerTrack: "par_329",
    readinessGate: "blocked",
    authorityRefs: ["prompt/329.md"],
    consumerTracks: ["par_330", "par_334", "seq_337", "seq_339"],
    notes: "Staff commit and confirmation UI.",
  },
  {
    artifactId: "PatientNetworkConfirmationView",
    kind: "surface",
    canonicalOwnerTrack: "par_329",
    readinessGate: "blocked",
    authorityRefs: ["prompt/329.md"],
    consumerTracks: ["par_330", "par_334", "seq_337", "seq_339", "seq_340"],
    notes: "Patient-facing network confirmation view.",
  },
  {
    artifactId: "OriginPracticeVisibilityPanel",
    kind: "surface",
    canonicalOwnerTrack: "par_329",
    readinessGate: "blocked",
    authorityRefs: ["prompt/329.md"],
    consumerTracks: ["par_334", "seq_339", "seq_340"],
    notes: "Origin-practice visibility panel.",
  },
  {
    artifactId: "NetworkManageView",
    kind: "surface",
    canonicalOwnerTrack: "par_330",
    readinessGate: "blocked",
    authorityRefs: ["prompt/330.md"],
    consumerTracks: ["par_334", "seq_337", "seq_339", "seq_340"],
    notes: "Patient manage surface for network appointments.",
  },
  {
    artifactId: "NetworkReminderView",
    kind: "surface",
    canonicalOwnerTrack: "par_330",
    readinessGate: "blocked",
    authorityRefs: ["prompt/330.md"],
    consumerTracks: ["par_334", "seq_337", "seq_339"],
    notes: "Reminder surface aligned to manage timeline truth.",
  },
  {
    artifactId: "MessageTimelineView",
    kind: "surface",
    canonicalOwnerTrack: "par_330",
    readinessGate: "blocked",
    authorityRefs: ["prompt/330.md"],
    consumerTracks: ["par_334", "seq_339"],
    notes: "Unified message timeline surface.",
  },
  {
    artifactId: "HubRecoveryWorkspace",
    kind: "surface",
    canonicalOwnerTrack: "par_331",
    readinessGate: "blocked",
    authorityRefs: ["prompt/331.md"],
    consumerTracks: ["par_334", "seq_337", "seq_339"],
    notes: "Recovery workspace for no-slot, reopen, and exception cases.",
  },
  {
    artifactId: "NoSlotRecoveryView",
    kind: "surface",
    canonicalOwnerTrack: "par_331",
    readinessGate: "blocked",
    authorityRefs: ["prompt/331.md"],
    consumerTracks: ["seq_339"],
    notes: "No-slot and callback-transfer view.",
  },
  {
    artifactId: "UrgentBounceBackView",
    kind: "surface",
    canonicalOwnerTrack: "par_331",
    readinessGate: "blocked",
    authorityRefs: ["prompt/331.md"],
    consumerTracks: ["seq_339"],
    notes: "Urgent bounce-back recovery surface.",
  },
  {
    artifactId: "ActingContextSwitcherSurface",
    kind: "surface",
    canonicalOwnerTrack: "par_332",
    readinessGate: "blocked",
    authorityRefs: ["prompt/332.md"],
    consumerTracks: ["par_333", "seq_337", "seq_338", "seq_340"],
    notes: "Live acting-context control surface for staff.",
  },
  {
    artifactId: "OrgAwareAccessControlPlane",
    kind: "surface",
    canonicalOwnerTrack: "par_332",
    readinessGate: "blocked",
    authorityRefs: ["prompt/332.md"],
    consumerTracks: ["seq_338", "seq_340"],
    notes: "Org-aware access surface for minimum-necessary posture.",
  },
  {
    artifactId: "MissionStackFoldedShell",
    kind: "surface",
    canonicalOwnerTrack: "par_333",
    readinessGate: "blocked",
    authorityRefs: ["prompt/333.md"],
    consumerTracks: ["par_334", "seq_337", "seq_340"],
    notes: "Canonical narrow-screen shell contract.",
  },
  {
    artifactId: "NarrowScreenHubWorkflowFamily",
    kind: "surface",
    canonicalOwnerTrack: "par_333",
    readinessGate: "blocked",
    authorityRefs: ["prompt/333.md"],
    consumerTracks: ["seq_340"],
    notes: "Responsive and narrow-screen workflows for hub tasks.",
  },
  {
    artifactId: "CrossOrgContentRefinementPack",
    kind: "surface",
    canonicalOwnerTrack: "par_334",
    readinessGate: "blocked",
    authorityRefs: ["prompt/334.md"],
    consumerTracks: ["seq_337", "seq_340"],
    notes: "Cross-org content refinement and accessibility copy rules.",
  },
  {
    artifactId: "ArtifactHandoffRefinementPack",
    kind: "surface",
    canonicalOwnerTrack: "par_334",
    readinessGate: "blocked",
    authorityRefs: ["prompt/334.md"],
    consumerTracks: ["seq_337", "seq_340"],
    notes: "Artifact behavior and summary-first handoff rules.",
  },
  {
    artifactId: "MeshMailboxConfigurationPack",
    kind: "operation",
    canonicalOwnerTrack: "seq_335",
    readinessGate: "deferred",
    authorityRefs: ["prompt/335.md"],
    consumerTracks: ["seq_339"],
    notes: "Operational mailbox and route configuration pack.",
  },
  {
    artifactId: "CrossOrgMessageRouteManifest",
    kind: "operation",
    canonicalOwnerTrack: "seq_335",
    readinessGate: "deferred",
    authorityRefs: ["prompt/335.md"],
    consumerTracks: ["seq_339"],
    notes: "Deterministic non-production route manifest for practice continuity messaging.",
  },
  {
    artifactId: "CapacityFeedBindingPack",
    kind: "operation",
    canonicalOwnerTrack: "seq_336",
    readinessGate: "deferred",
    authorityRefs: ["prompt/336.md"],
    consumerTracks: ["seq_338"],
    notes: "Operational supplier-feed binding pack.",
  },
  {
    artifactId: "PartnerCredentialReferenceSet",
    kind: "operation",
    canonicalOwnerTrack: "seq_336",
    readinessGate: "deferred",
    authorityRefs: ["prompt/336.md"],
    consumerTracks: ["seq_338"],
    notes: "Non-production partner-credential reference set.",
  },
  {
    artifactId: "CrossFamilyNetworkIntegrationGate",
    kind: "operation",
    canonicalOwnerTrack: "seq_337",
    readinessGate: "blocked",
    authorityRefs: ["prompt/337.md"],
    consumerTracks: ["seq_338", "seq_339", "seq_340"],
    notes: "Integration ownership across local and network flows.",
  },
  {
    artifactId: "Phase5PreCommitProofBattery",
    kind: "proof_battery",
    canonicalOwnerTrack: "seq_338",
    readinessGate: "blocked",
    authorityRefs: ["prompt/338.md"],
    consumerTracks: [],
    notes: "First release-grade Phase 5 proof battery.",
  },
  {
    artifactId: "Phase5PostSelectionProofBattery",
    kind: "proof_battery",
    canonicalOwnerTrack: "seq_339",
    readinessGate: "blocked",
    authorityRefs: ["prompt/339.md"],
    consumerTracks: [],
    notes: "Second release-grade Phase 5 proof battery.",
  },
  {
    artifactId: "Phase5BrowserVisibilityRegressionBattery",
    kind: "proof_battery",
    canonicalOwnerTrack: "seq_340",
    readinessGate: "blocked",
    authorityRefs: ["prompt/340.md"],
    consumerTracks: [],
    notes: "Final browser-visible Phase 5 proof battery.",
  },
];

const DEPENDENCY_EDGES: DependencyEdge[] = [
  {
    interfaceId: "EDGE_315_318_CASE_KERNEL",
    producerTrack: "par_315",
    consumerTrack: "par_318",
    interfaceName: "Hub case kernel and lineage anchor",
    artifactRefs: ["NetworkBookingRequest", "HubCoordinationCase"],
    status: "blocked_until_upstream",
    notes: "par_318 must attach candidate snapshots to the canonical case kernel.",
  },
  {
    interfaceId: "EDGE_315_319_QUEUE_ELIGIBILITY",
    producerTrack: "par_315",
    consumerTrack: "par_319",
    interfaceName: "Queue eligibility and open-case blockers",
    artifactRefs: ["HubCoordinationCase", "HubCoordinationStateMachine"],
    status: "blocked_until_upstream",
    notes: "Queue projections need durable case and blocker posture.",
  },
  {
    interfaceId: "EDGE_315_321_CASE_OWNERSHIP",
    producerTrack: "par_315",
    consumerTrack: "par_321",
    interfaceName: "Ownership fence and lineage-carry-forward contract",
    artifactRefs: ["HubCoordinationCase"],
    status: "blocked_until_upstream",
    notes: "Commit cannot proceed without the case kernel's ownership fence.",
  },
  {
    interfaceId: "EDGE_316_321_VISIBILITY_ENVELOPE",
    producerTrack: "par_316",
    consumerTrack: "par_321",
    interfaceName: "Acting context and visibility envelope",
    artifactRefs: ["ActingContext", "CrossOrganisationVisibilityEnvelope"],
    status: "blocked_until_upstream",
    notes: "Commit auth and write posture must consume canonical acting context.",
  },
  {
    interfaceId: "EDGE_316_322_MINIMUM_NECESSARY",
    producerTrack: "par_316",
    consumerTrack: "par_322",
    interfaceName: "Minimum-necessary routing posture",
    artifactRefs: ["CrossOrganisationVisibilityEnvelope"],
    status: "blocked_until_upstream",
    notes: "Continuity routing must observe audience-specific visibility law.",
  },
  {
    interfaceId: "EDGE_316_326_SHELL_SCOPE",
    producerTrack: "par_316",
    consumerTrack: "par_326",
    interfaceName: "Acting-scope shell controls",
    artifactRefs: ["ActingContext", "CrossOrganisationVisibilityEnvelope"],
    status: "blocked_until_upstream",
    notes: "The shell needs canonical acting context controls.",
  },
  {
    interfaceId: "EDGE_317_318_POLICY_EVALUATION",
    producerTrack: "par_317",
    consumerTrack: "par_318",
    interfaceName: "Replayable policy evaluation and policyTupleHash",
    artifactRefs: ["EnhancedAccessPolicy", "NetworkCoordinationPolicyEvaluation"],
    status: "launch_ready",
    notes: "Wave-1 readiness exists because 312 already froze the tuple and evaluation law.",
  },
  {
    interfaceId: "EDGE_317_319_RANKING_LAW",
    producerTrack: "par_317",
    consumerTrack: "par_319",
    interfaceName: "Ranking frontier and SLA posture inputs",
    artifactRefs: ["NetworkCoordinationPolicyEvaluation"],
    status: "blocked_until_upstream",
    notes: "Queue order depends on implemented policy outputs plus candidate proofs.",
  },
  {
    interfaceId: "EDGE_317_336_FEED_TRUST",
    producerTrack: "par_317",
    consumerTrack: "seq_336",
    interfaceName: "Partner feed trust-admission settings",
    artifactRefs: ["HubCapacityIngestionPolicy"],
    status: "deferred",
    notes: "Operational feed configuration is deferred until policy code and partner windows exist.",
  },
  {
    interfaceId: "EDGE_318_319_CANDIDATE_PROOF",
    producerTrack: "par_318",
    consumerTrack: "par_319",
    interfaceName: "Candidate snapshots and ranking proofs",
    artifactRefs: ["NetworkCandidateSnapshot", "CapacityRankProof"],
    status: "blocked_until_upstream",
    notes: "Queue projections consume persisted candidate and proof artifacts.",
  },
  {
    interfaceId: "EDGE_318_320_OFFER_FRONTIER",
    producerTrack: "par_318",
    consumerTrack: "par_320",
    interfaceName: "Patient-offerable frontier and explanation feed",
    artifactRefs: ["CrossSiteDecisionPlan", "CapacityRankExplanation"],
    status: "blocked_until_upstream",
    notes: "Offer generation depends on persisted frontier and explanation artifacts.",
  },
  {
    interfaceId: "EDGE_319_320_QUEUE_CONTEXT",
    producerTrack: "par_319",
    consumerTrack: "par_320",
    interfaceName: "Queue posture and callback threshold context",
    artifactRefs: ["HubQueueWorkbenchProjection", "HubPostureProjection"],
    status: "blocked_until_upstream",
    notes: "Offer generation must align to queue and SLA posture.",
  },
  {
    interfaceId: "EDGE_320_321_OFFER_SELECTION",
    producerTrack: "par_320",
    consumerTrack: "par_321",
    interfaceName: "Selected offer and choice settlement",
    artifactRefs: ["AlternativeOfferSession", "AlternativeOfferRegenerationSettlement"],
    status: "blocked_until_upstream",
    notes: "Commit consumes selected offers and regeneration settlements.",
    seamRef: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
  },
  {
    interfaceId: "EDGE_320_323_FALLBACK_TRIGGER",
    producerTrack: "par_320",
    consumerTrack: "par_323",
    interfaceName: "Offer expiry and callback-fallback trigger",
    artifactRefs: ["AlternativeOfferFallbackCard", "AlternativeOfferSession"],
    status: "blocked_until_upstream",
    notes: "Recovery flows depend on offer-session outcomes.",
    seamRef: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
  },
  {
    interfaceId: "EDGE_321_322_CONTINUITY_CHAIN",
    producerTrack: "par_321",
    consumerTrack: "par_322",
    interfaceName: "Authoritative booking evidence to continuity routing",
    artifactRefs: ["HubBookingEvidenceBundle", "HubAppointmentRecord"],
    status: "blocked_until_upstream",
    notes: "Practice continuity only starts from authoritative commit evidence.",
  },
  {
    interfaceId: "EDGE_321_324_MANAGE_TRUTH",
    producerTrack: "par_321",
    consumerTrack: "par_324",
    interfaceName: "Commit truth and appointment identity for manage posture",
    artifactRefs: ["HubAppointmentRecord", "HubOfferToConfirmationTruthProjection"],
    status: "blocked_until_upstream",
    notes: "Manage posture must read the canonical truth projection.",
    seamRef: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
  },
  {
    interfaceId: "EDGE_321_325_MIRROR_BOOTSTRAP",
    producerTrack: "par_321",
    consumerTrack: "par_325",
    interfaceName: "Supplier-mirror bootstrap request",
    artifactRefs: ["HubAppointmentRecord", "HubBookingEvidenceBundle", "HubSupplierMirrorState"],
    status: "blocked_until_upstream",
    notes: "par_321 may bootstrap, but par_325 owns mirror state.",
    seamRef: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
  },
  {
    interfaceId: "EDGE_322_324_ACK_DEBT",
    producerTrack: "par_322",
    consumerTrack: "par_324",
    interfaceName: "Acknowledgement debt and continuity timeline",
    artifactRefs: ["PracticeContinuityMessage", "PracticeAcknowledgementRecord"],
    status: "blocked_until_upstream",
    notes: "Manage and visibility posture depend on current acknowledgement debt.",
  },
  {
    interfaceId: "EDGE_323_325_EXCEPTION_HANDOFF",
    producerTrack: "par_323",
    consumerTrack: "par_325",
    interfaceName: "Canonical exception rows for worker processing",
    artifactRefs: ["HubCoordinationException", "HubExceptionWorkerOutcome"],
    status: "blocked_until_upstream",
    notes: "par_325 consumes canonical exceptions and emits worker outcomes only.",
    seamRef: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
  },
  {
    interfaceId: "EDGE_324_325_MANAGE_DELTA",
    producerTrack: "par_324",
    consumerTrack: "par_325",
    interfaceName: "Manage capability and visibility deltas for repair workers",
    artifactRefs: ["NetworkManageCapabilities", "PracticeVisibilityDeltaRecord"],
    status: "blocked_until_upstream",
    notes: "Repair workers consume visibility and manage deltas for drift response.",
  },
  {
    interfaceId: "EDGE_325_326_EXCEPTION_SURFACES",
    producerTrack: "par_325",
    consumerTrack: "par_326",
    interfaceName: "Exception and reconciliation posture for shell start-of-day",
    artifactRefs: ["HubSupplierMirrorState", "HubExceptionWorkerOutcome"],
    status: "blocked_until_upstream",
    notes: "Shell start-of-day surfaces need real drift and exception posture.",
  },
  {
    interfaceId: "EDGE_326_327_SHELL_SLOTS",
    producerTrack: "par_326",
    consumerTrack: "par_327",
    interfaceName: "Queue workbench shell slots",
    artifactRefs: ["HubDeskShell"],
    status: "blocked_until_upstream",
    notes: "Queue workbench mounts inside the canonical shell family.",
  },
  {
    interfaceId: "EDGE_326_329_CONFIRMATION_SHELL",
    producerTrack: "par_326",
    consumerTrack: "par_329",
    interfaceName: "Commit and visibility shell anchors",
    artifactRefs: ["HubDeskShell"],
    status: "blocked_until_upstream",
    notes: "Commit and practice-visibility surfaces mount inside the hub shell.",
  },
  {
    interfaceId: "EDGE_326_332_SCOPE_SWITCHER_SLOT",
    producerTrack: "par_326",
    consumerTrack: "par_332",
    interfaceName: "Acting-context control-plane mount point",
    artifactRefs: ["HubDeskShell"],
    status: "blocked_until_upstream",
    notes: "Acting-context switcher extends the canonical shell rather than replacing it.",
  },
  {
    interfaceId: "EDGE_326_333_FOLDED_SHELL",
    producerTrack: "par_326",
    consumerTrack: "par_333",
    interfaceName: "Folded-shell base contract",
    artifactRefs: ["HubDeskShell"],
    status: "blocked_until_upstream",
    notes: "Mobile shell refines the canonical shell rather than forking it.",
  },
  {
    interfaceId: "EDGE_327_333_NARROW_QUEUE",
    producerTrack: "par_327",
    consumerTrack: "par_333",
    interfaceName: "Queue workbench narrow-screen priority order",
    artifactRefs: ["HubQueueWorkbenchView"],
    status: "blocked_until_upstream",
    notes: "Responsive queue work follows the desktop queue semantics.",
  },
  {
    interfaceId: "EDGE_329_330_MESSAGE_TIMELINE",
    producerTrack: "par_329",
    consumerTrack: "par_330",
    interfaceName: "Confirmation anchor to manage and message timeline",
    artifactRefs: ["PatientNetworkConfirmationView", "HubCommitConfirmationWorkspace"],
    status: "blocked_until_upstream",
    notes: "Manage surfaces extend confirmed appointment posture.",
  },
  {
    interfaceId: "EDGE_329_334_ARTIFACT_REFINEMENT",
    producerTrack: "par_329",
    consumerTrack: "par_334",
    interfaceName: "Confirmation and visibility content baseline",
    artifactRefs: ["PatientNetworkConfirmationView", "OriginPracticeVisibilityPanel"],
    status: "blocked_until_upstream",
    notes: "Content and artifact refinement sits on top of real confirmation surfaces.",
  },
  {
    interfaceId: "EDGE_335_339_MESH_ROUTES",
    producerTrack: "seq_335",
    consumerTrack: "seq_339",
    interfaceName: "Non-production MESH route verification evidence",
    artifactRefs: ["MeshMailboxConfigurationPack", "CrossOrgMessageRouteManifest"],
    status: "deferred",
    notes: "Operational route verification is deferred until the MESH task opens.",
  },
  {
    interfaceId: "EDGE_336_338_FEED_BINDINGS",
    producerTrack: "seq_336",
    consumerTrack: "seq_338",
    interfaceName: "Non-production capacity-feed binding evidence",
    artifactRefs: ["CapacityFeedBindingPack", "PartnerCredentialReferenceSet"],
    status: "deferred",
    notes: "Operational feed verification is deferred until the capacity-feed task opens.",
  },
  {
    interfaceId: "EDGE_337_338_INTEGRATED_PRECOMMIT",
    producerTrack: "seq_337",
    consumerTrack: "seq_338",
    interfaceName: "Integrated shell and routing surface for pre-commit proof",
    artifactRefs: ["CrossFamilyNetworkIntegrationGate"],
    status: "blocked_until_upstream",
    notes: "Proof suites require integrated staff and patient surfaces.",
  },
  {
    interfaceId: "EDGE_337_340_INTEGRATED_BROWSER_VISIBILITY",
    producerTrack: "seq_337",
    consumerTrack: "seq_340",
    interfaceName: "Integrated network/local shell family",
    artifactRefs: ["CrossFamilyNetworkIntegrationGate"],
    status: "blocked_until_upstream",
    notes: "Final browser-visible regression must operate on the integrated product.",
  },
];

const GAP_LOG: GapEntry[] = [
  {
    gapId: "G314_001",
    area: "truth_projection_write_discipline",
    severity: "high",
    status: "resolved_by_314",
    tracksInvolved: ["par_320", "par_321", "par_322", "par_323", "par_324", "par_325"],
    canonicalOwner: "par_321",
    resolution:
      "par_321 is the sole persisted writer for HubOfferToConfirmationTruthProjection; neighboring tracks emit typed deltas only.",
    seamRef: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
  },
  {
    gapId: "G314_002",
    area: "supplier_mirror_bootstrap",
    severity: "high",
    status: "resolved_by_314",
    tracksInvolved: ["par_321", "par_324", "par_325"],
    canonicalOwner: "par_325",
    resolution:
      "par_321 may emit bootstrap requests, but par_325 alone owns HubSupplierMirrorState and supplier observation revisions.",
    seamRef: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
  },
  {
    gapId: "G314_003",
    area: "exception_lifecycle_handoff",
    severity: "high",
    status: "resolved_by_314",
    tracksInvolved: ["par_323", "par_325"],
    canonicalOwner: "par_323",
    resolution:
      "par_323 owns canonical HubCoordinationException creation and schema; par_325 emits worker outcomes only.",
    seamRef: "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
  },
  {
    gapId: "G314_004",
    area: "phase4_safety_delta",
    severity: "high",
    status: "carried_from_310",
    tracksInvolved: ["seq_314", "seq_341"],
    canonicalOwner: "seq_314",
    resolution: "Keep widened rollout and unconditional exit withheld until a release-scoped hazard delta exists.",
    carryForwardIssueRef: "ISSUE310_001",
  },
  {
    gapId: "G314_005",
    area: "phase4_rollback_rehearsal",
    severity: "high",
    status: "carried_from_310",
    tracksInvolved: ["seq_314", "par_315", "seq_341"],
    canonicalOwner: "seq_314",
    resolution: "Bind rollback-rehearsal evidence into future exit criteria before any unconditional Phase 5 claim.",
    carryForwardIssueRef: "ISSUE310_002",
  },
  {
    gapId: "G314_006",
    area: "phase4_interaction_budget",
    severity: "medium",
    status: "carried_from_310",
    tracksInvolved: ["seq_314", "par_326", "par_327", "par_333", "seq_340"],
    canonicalOwner: "seq_314",
    resolution:
      "Carry the 200ms interaction-support miss into shell, queue, narrow-screen, and final regression work.",
    carryForwardIssueRef: "ISSUE310_003",
  },
  {
    gapId: "G314_007",
    area: "provider_evidence_class_boundaries",
    severity: "medium",
    status: "carried_from_310",
    tracksInvolved: ["seq_314", "par_321", "par_322", "par_324", "par_325"],
    canonicalOwner: "seq_314",
    resolution:
      "Keep live, sandbox, unsupported, and future-network claims explicitly separated across commit and visibility work.",
    carryForwardIssueRef: "ISSUE310_004",
  },
];

const READY_TRACK_IDS = TRACKS.filter((track) => track.readiness === "ready").map((track) => track.trackId);
const SUMMARY = {
  readyCount: TRACKS.filter((track) => track.readiness === "ready").length,
  blockedCount: TRACKS.filter((track) => track.readiness === "blocked").length,
  deferredCount: TRACKS.filter((track) => track.readiness === "deferred").length,
  trackCount: TRACKS.length,
};

const HARD_MERGE_CRITERIA = [
  "No track may rename frozen 311 to 313 object names, enums, route families, audience tiers, tuple hashes, or truth-state vocabulary.",
  "par_321 is the only canonical persisted writer for HubOfferToConfirmationTruthProjection; sibling tracks must emit typed deltas only.",
  "par_325 is the only owner of HubSupplierMirrorState; par_321 may emit bootstrap requests but may not persist mirror state.",
  "par_323 is the only owner and creator of canonical HubCoordinationException rows; par_325 may emit worker outcomes only.",
  "par_317 may not change rank order or frontier law that 312 already froze; service obligation and practice visibility remain non-ordering dimensions.",
  "par_326 through seq_340 must inherit ISSUE310_003 until browser-visible evidence proves the 200ms interaction support target.",
  "par_321 through par_325 must keep live, sandbox, unsupported, and future-network provider claims visibly separated.",
  "No blocked or deferred track may be marked ready until all of its upstream tracks are complete and the 314 validator is rerun.",
];

function launchPacket(trackId: string, targetRoots: string[], proofFocus: string[]): Record<string, unknown> {
  const track = TRACKS.find((entry) => entry.trackId === trackId);
  if (!track) throw new Error(`Unknown track ${trackId}`);

  return {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    launchedOn: TODAY,
    gateVerdict: GATE_VERDICT,
    launchTrackId: track.trackId,
    title: track.title,
    readiness: track.readiness,
    mission: track.shortMission,
    promptRef: track.promptRef,
    targetRoots,
    frozenInputs: track.dependsOnContracts,
    explicitDependencies: track.dependsOnTracks,
    ownedArtifacts: track.ownedArtifacts,
    explicitNonOwnership: track.nonOwnedArtifacts,
    producedInterfaces: track.producedInterfaces,
    mergeCriteria: track.mergeCriteria,
    guardrails: track.guardrails,
    carryForwardIssues: track.carryForwardIssueRefs.map((issueId) => issueById.get(issueId)).filter(Boolean),
    seamRefs: track.collisionSeamRefs,
    proofFocus,
    unlockStatement:
      "This launch packet authorizes implementation against frozen contracts only. Downstream tracks remain blocked until the emitted interfaces are real and validated.",
  };
}

function buildArchitectureDoc(): string {
  const readyRows = TRACKS.filter((track) => track.readiness === "ready").map((track) => [
    track.trackId,
    track.title,
    track.ownedArtifacts.join(", "),
    track.launchPacketRef ?? "",
    track.readinessReason,
  ]);
  const collisionRows = GAP_LOG.filter((entry) => entry.status === "resolved_by_314").map((entry) => [
    entry.gapId,
    entry.area,
    entry.canonicalOwner,
    entry.seamRef ?? "",
    entry.resolution,
  ]);
  const carryRows = carryForwardIssues.map((issue) => [
    issue.issueId,
    issue.title,
    issue.ownerTask,
    issue.followOnTasks.join(", "),
    issue.nextAction,
  ]);

  return `# 314 Phase 5 Parallel Track Gate And Dependency Map

Generated on ${TODAY}. This document opens the first executable Phase 5 wave against the frozen 311 to 313 contracts and refuses to open later tracks until their upstream implementation surfaces exist.

## Gate Verdict

The gate verdict is ${GATE_VERDICT}.

Only par_315, par_316, and par_317 are ready to begin immediately. Every later track is either blocked on upstream implementation or deferred because it depends on operational credentials and non-production partner setup that should not be opened yet.

${mdTable(
    ["Metric", "Value"],
    [
      ["Ready tracks", String(SUMMARY.readyCount)],
      ["Blocked tracks", String(SUMMARY.blockedCount)],
      ["Deferred tracks", String(SUMMARY.deferredCount)],
      ["Total tracks", String(SUMMARY.trackCount)],
    ],
  )}

## First Wave

${mdTable(["Track", "Title", "Owned artifacts", "Launch packet", "Why ready"], readyRows)}

## Collision Resolutions

${mdTable(["Gap", "Area", "Canonical owner", "Seam", "Resolution"], collisionRows)}

## Carry-Forward Constraints

These Phase 4 issues are still in force and now explicitly constrain Phase 5 opening.

${mdTable(["Issue", "Summary", "Owner", "Follow-on", "Required action"], carryRows)}

## Hard Merge Criteria

${HARD_MERGE_CRITERIA.map((criterion) => `- ${criterion}`).join("\n")}
`;
}

function buildReleaseDoc(): string {
  const readinessRows = TRACKS.map((track) => [
    track.trackId,
    track.domain,
    track.wave,
    track.readiness,
    track.dependsOnTracks.join(", ") || "frozen_contracts_only",
    track.unlockRule ?? "ready_now",
  ]);

  return `# 314 Phase 5 Parallel Open Gate

## Decision

Phase 5 implementation opens in a controlled way: the first backend wave (315 to 317) may start now, later backend and frontend work remains blocked until those implementations land, and operational tracks (335, 336) remain deferred until code consumers and non-production credential windows are both ready.

## Readiness Registry

${mdTable(
    ["Track", "Domain", "Wave", "Status", "Depends on", "Unlock rule"],
    readinessRows,
  )}

## Operational Posture

- seq_335 is deferred because MESH route wiring is security-sensitive and should only open once continuity code, visibility surfaces, and a non-production credential window are ready together.
- seq_336 is deferred because partner capacity feeds and credentials are likewise security-sensitive and should only open once policy, ingestion, and mapping code exist.
- seq_337 to seq_340 remain blocked because integration and proof work only become meaningful after the backend, frontend, and operational layers exist together.

## Merge Law

${HARD_MERGE_CRITERIA.map((criterion) => `- ${criterion}`).join("\n")}
`;
}

function buildApiDoc(): string {
  const artifactRows = ARTIFACTS.map((artifact) => [
    artifact.artifactId,
    artifact.kind,
    artifact.canonicalOwnerTrack,
    artifact.readinessGate,
    artifact.authorityRefs.join(", "),
  ]);
  const edgeRows = DEPENDENCY_EDGES.map((edge) => [
    edge.interfaceId,
    `${edge.producerTrack} -> ${edge.consumerTrack}`,
    edge.interfaceName,
    edge.artifactRefs.join(", "),
    edge.status,
    edge.seamRef ?? "",
  ]);
  const seamRows = PARALLEL_SEAMS.map((seam) => [
    seam.seamId,
    seam.ownerTask,
    seam.area,
    seam.fileName,
    seam.purpose,
  ]);

  return `# 314 Phase 5 Track Interface Registry

This registry assigns canonical ownership for every currently named Phase 5 object, projection, surface, operation, and proof battery that the open gate must coordinate.

## Canonical Ownership

${mdTable(
    ["Artifact", "Kind", "Canonical owner", "Gate status", "Authority refs"],
    artifactRows,
  )}

## Dependency Interfaces

${mdTable(
    ["Interface", "Producer -> consumer", "Meaning", "Artifacts", "Status", "Seam"],
    edgeRows,
  )}

## Parallel Seams

${mdTable(["Seam", "Owner", "Area", "File", "Purpose"], seamRows)}
`;
}

function buildBoardHtml(boardData: Record<string, unknown>): string {
  const boardJson = JSON.stringify(boardData).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>314 Phase 5 Parallel Tracks Gate Board</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #f5f7fb;
        --panel: #ffffff;
        --inset: #eef2f7;
        --border: #d7dfea;
        --text-strong: #0f172a;
        --text-default: #334155;
        --text-muted: #64748b;
        --ready: #0f766e;
        --blocked: #b42318;
        --deferred: #946200;
        --focus: #3158e0;
        --shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        --radius: 18px;
        --transition: 160ms ease;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
      }

      @media (prefers-reduced-motion: reduce) {
        :root {
          --transition: 0ms linear;
        }
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        background: var(--canvas);
        color: var(--text-default);
      }

      body {
        padding: 16px;
      }

      button,
      input,
      select {
        font: inherit;
      }

      a {
        color: var(--focus);
      }

      .skip-link {
        position: absolute;
        left: 16px;
        top: -44px;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--text-strong);
        color: #fff;
        z-index: 20;
      }

      .skip-link:focus {
        top: 12px;
      }

      .board {
        width: min(1760px, 100%);
        margin: 0 auto;
        display: grid;
        gap: 16px;
      }

      .panel,
      .masthead,
      .verdict-ribbon {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        min-width: 0;
      }

      .masthead,
      .verdict-ribbon,
      .panel {
        padding: 18px 20px;
      }

      .masthead {
        display: grid;
        gap: 8px;
      }

      .eyebrow {
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.74rem;
        font-weight: 700;
      }

      .muted {
        color: var(--text-muted);
        line-height: 1.55;
      }

      .verdict-ribbon {
        position: sticky;
        top: 12px;
        z-index: 12;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: start;
        border-left: 6px solid var(--ready);
      }

      .chip-row,
      .filter-row,
      .filter-group,
      .inspector-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chip,
      .filter-button {
        min-height: 34px;
        border-radius: 999px;
        border: 1px solid var(--border);
        padding: 7px 12px;
        background: var(--inset);
        color: var(--text-strong);
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .chip[data-tone="ready"] {
        color: var(--ready);
        background: rgba(15, 118, 110, 0.08);
        border-color: rgba(15, 118, 110, 0.24);
      }

      .chip[data-tone="blocked"] {
        color: var(--blocked);
        background: rgba(180, 35, 24, 0.08);
        border-color: rgba(180, 35, 24, 0.2);
      }

      .chip[data-tone="deferred"] {
        color: var(--deferred);
        background: rgba(148, 98, 0, 0.1);
        border-color: rgba(148, 98, 0, 0.22);
      }

      .chip[data-tone="focus"] {
        color: var(--focus);
        background: rgba(49, 88, 224, 0.08);
        border-color: rgba(49, 88, 224, 0.24);
      }

      .filter-button {
        cursor: pointer;
        background: var(--panel);
        transition:
          border-color var(--transition),
          box-shadow var(--transition),
          background var(--transition);
      }

      .filter-button:hover,
      .filter-button:focus-visible,
      .track-button:hover,
      .track-button:focus-visible,
      .graph-card-button:hover,
      .graph-card-button:focus-visible {
        outline: none;
        border-color: var(--focus);
        box-shadow: 0 0 0 3px rgba(49, 88, 224, 0.12);
      }

      .filter-button[data-active="true"] {
        background: rgba(49, 88, 224, 0.08);
        border-color: rgba(49, 88, 224, 0.3);
        color: var(--focus);
      }

      .layout {
        display: grid;
        grid-template-columns: minmax(0, 320px) minmax(0, 1fr) minmax(0, 420px);
        gap: 16px;
        align-items: start;
      }

      .rail,
      .canvas,
      .inspector {
        display: grid;
        gap: 16px;
        min-width: 0;
      }

      .region-header {
        display: grid;
        gap: 4px;
      }

      .section-label {
        margin: 0;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.74rem;
        font-weight: 700;
      }

      .track-list,
      .graph-list,
      .summary-list {
        display: grid;
        gap: 10px;
      }

      .track-button,
      .graph-card-button {
        width: 100%;
        text-align: left;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--panel);
        color: inherit;
        cursor: pointer;
        transition:
          transform var(--transition),
          border-color var(--transition),
          box-shadow var(--transition),
          background var(--transition);
        overflow-wrap: anywhere;
      }

      .track-button {
        padding: 12px;
      }

      .graph-card-button {
        padding: 14px;
      }

      .track-button[data-active="true"],
      .graph-card-button[data-active="true"] {
        border-color: var(--focus);
        background: rgba(49, 88, 224, 0.08);
      }

      .track-button[data-active="true"] {
        transform: translateX(2px);
      }

      .button-title {
        display: block;
        font-weight: 700;
        color: var(--text-strong);
        overflow-wrap: anywhere;
      }

      .button-note,
      .button-meta {
        display: block;
        font-size: 0.82rem;
        color: var(--text-muted);
        overflow-wrap: anywhere;
      }

      .graph-grid {
        display: grid;
        gap: 14px;
      }

      .wave-section {
        display: grid;
        gap: 10px;
      }

      .wave-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .wave-title {
        margin: 0;
        color: var(--text-strong);
        font-size: 1rem;
      }

      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 12px;
      }

      .graph-card-button[data-readiness="ready"] {
        border-left: 4px solid var(--ready);
      }

      .graph-card-button[data-readiness="blocked"] {
        border-left: 4px solid var(--blocked);
      }

      .graph-card-button[data-readiness="deferred"] {
        border-left: 4px solid var(--deferred);
      }

      .card-meta,
      .inspector-list,
      .plain-list {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 8px;
      }

      .mini-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .mini-chip {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        padding: 4px 8px;
        border-radius: 999px;
        background: var(--inset);
        color: var(--text-muted);
        font-size: 0.78rem;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 0.92rem;
      }

      caption {
        text-align: left;
        margin-bottom: 8px;
        font-weight: 700;
        color: var(--text-strong);
      }

      th,
      td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--border);
        text-align: left;
        vertical-align: top;
        overflow-wrap: anywhere;
      }

      th {
        color: var(--text-muted);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--focus);
        display: inline-block;
      }

      .status-dot[data-readiness="ready"] {
        background: var(--ready);
      }

      .status-dot[data-readiness="blocked"] {
        background: var(--blocked);
      }

      .status-dot[data-readiness="deferred"] {
        background: var(--deferred);
      }

      .summary-list li,
      .plain-list li,
      .inspector-list li {
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      h1,
      h2,
      h3,
      p,
      li,
      caption {
        overflow-wrap: anywhere;
      }

      .empty-state {
        border: 1px dashed var(--border);
        border-radius: 14px;
        padding: 18px;
        color: var(--text-muted);
        background: linear-gradient(180deg, rgba(238, 242, 247, 0.8), rgba(255, 255, 255, 0.9));
      }

      @media (max-width: 1180px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to gate board</a>
    <div
      class="board"
      data-testid="Phase5ParallelGateBoard"
      data-visual-mode="${VISUAL_MODE}"
      data-active-track=""
      data-filter-readiness="all"
      data-filter-domain="all"
      data-reduced-motion="no-preference"
      data-ready-count=""
      data-blocked-count=""
      data-deferred-count=""
      data-filtered-count=""
    >
      <header class="masthead">
        <div class="eyebrow">Phase 5 Parallel Gate</div>
        <h1>Open the first executable network wave without reopening frozen semantics.</h1>
        <p class="muted">
          This board is generated from the 314 registry. It keeps object ownership, dependency edges,
          and carry-forward constraints visible in one synchronized surface.
        </p>
      </header>

      <section class="verdict-ribbon" aria-label="Gate summary">
        <div>
          <div class="eyebrow">Gate verdict</div>
          <h2 id="verdict-title">${GATE_VERDICT}</h2>
          <p class="muted">
            The first executable wave is open for <strong>315</strong>, <strong>316</strong>, and
            <strong>317</strong>. Later work remains blocked or deferred until upstream code and
            operational prerequisites are real.
          </p>
          <div class="chip-row" id="summary-chip-row"></div>
        </div>
        <div class="filter-row" aria-label="Track filters">
          <div class="filter-group" id="readiness-filter-group" aria-label="Filter by readiness"></div>
          <div class="filter-group" id="domain-filter-group" aria-label="Filter by domain"></div>
        </div>
      </section>

      <main id="main" class="layout">
        <aside class="rail">
          <section class="panel">
            <div class="region-header">
              <p class="section-label">Track list</p>
              <p class="muted" id="track-list-summary"></p>
            </div>
            <div class="track-list" id="track-list"></div>
          </section>

          <section class="panel">
            <div class="region-header">
              <p class="section-label">Carry-forward constraints</p>
              <p class="muted">These stay active even while the first wave opens.</p>
            </div>
            <ul class="summary-list" id="constraint-list"></ul>
          </section>
        </aside>

        <section class="canvas">
          <section class="panel">
            <div class="region-header">
              <p class="section-label">Dependency graph</p>
              <p class="muted">
                Graph cards and parity table always reflect the same filtered track set.
              </p>
            </div>
            <div class="graph-grid" id="graph-grid" data-testid="DependencyGraph"></div>
          </section>

          <section class="panel">
            <table data-testid="TrackParityTable">
              <caption>Filtered readiness and dependency parity table</caption>
              <thead>
                <tr>
                  <th scope="col">Track</th>
                  <th scope="col">Status</th>
                  <th scope="col">Depends on</th>
                  <th scope="col">Owned artifacts</th>
                </tr>
              </thead>
              <tbody id="parity-table-body"></tbody>
            </table>
          </section>
        </section>

        <aside class="inspector">
          <section class="panel">
            <div class="region-header">
              <p class="section-label">Inspector</p>
              <p class="muted">Selecting a track updates this inspector and the graph/list state together.</p>
            </div>
            <h2 id="inspector-title"></h2>
            <p class="muted" id="inspector-mission"></p>
            <div class="inspector-chip-row" id="inspector-chips"></div>
          </section>

          <section class="panel">
            <p class="section-label">Owned artifacts</p>
            <ul class="inspector-list" id="inspector-owned"></ul>
          </section>

          <section class="panel">
            <p class="section-label">Dependencies</p>
            <ul class="inspector-list" id="inspector-dependencies"></ul>
          </section>

          <section class="panel">
            <p class="section-label">Merge criteria</p>
            <ul class="inspector-list" id="inspector-merge"></ul>
          </section>

          <section class="panel">
            <p class="section-label">Collision seams and constraints</p>
            <ul class="inspector-list" id="inspector-risks"></ul>
          </section>
        </aside>
      </main>
    </div>

    <script id="board-data" type="application/json">${boardJson}</script>
    <script>
      (function () {
        const data = JSON.parse(document.getElementById("board-data").textContent || "{}");
        const root = document.querySelector("[data-testid='Phase5ParallelGateBoard']");
        const readinessOrder = ["all", "ready", "blocked", "deferred"];
        const domainOrder = ["all", "backend", "frontend", "ops", "integration", "testing"];
        const waveLabels = {
          wave_1: "Wave 1: Contract-independent backend start",
          wave_2: "Wave 2: Backend build after wave 1 lands",
          wave_3: "Wave 3: Frontend family after backend surfaces exist",
          ops: "Operational setup",
          integration: "Integration gate",
          proof: "Release proof batteries"
        };
        const state = {
          readiness: "all",
          domain: "all",
          activeTrackId: data.initialActiveTrackId || ""
        };

        function escapeHtml(value) {
          return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }

        function toneForReadiness(readiness) {
          if (readiness === "ready") return "ready";
          if (readiness === "deferred") return "deferred";
          return "blocked";
        }

        function filteredTracks() {
          return data.tracks.filter(function (track) {
            const readinessOkay = state.readiness === "all" || track.readiness === state.readiness;
            const domainOkay = state.domain === "all" || track.domain === state.domain;
            return readinessOkay && domainOkay;
          });
        }

        function getTrack(trackId) {
          return data.tracks.find(function (track) {
            return track.trackId === trackId;
          });
        }

        function ensureActiveTrack(tracks) {
          if (!tracks.length) {
            state.activeTrackId = "";
            return;
          }
          if (!tracks.some(function (track) { return track.trackId === state.activeTrackId; })) {
            state.activeTrackId = tracks[0].trackId;
          }
        }

        function buttonRowHtml(tracks) {
          return tracks.map(function (track) {
            return [
              '<button type="button" class="track-button" data-id="',
              escapeHtml(track.trackId),
              '" data-active="',
              track.trackId === state.activeTrackId ? "true" : "false",
              '" data-readiness="',
              escapeHtml(track.readiness),
              '">',
              '<span class="button-title">',
              escapeHtml(track.trackId + " " + track.title),
              '</span>',
              '<span class="button-note">',
              escapeHtml(track.waveLabel + " / " + track.readiness),
              '</span>',
              '<span class="button-meta">',
              escapeHtml(track.readinessReason),
              '</span>',
              "</button>"
            ].join("");
          }).join("");
        }

        function graphHtml(tracks) {
          const groups = {};
          tracks.forEach(function (track) {
            const key = track.wave;
            if (!groups[key]) groups[key] = [];
            groups[key].push(track);
          });

          return Object.keys(waveLabels)
            .filter(function (waveId) { return groups[waveId] && groups[waveId].length > 0; })
            .map(function (waveId) {
              const rows = groups[waveId]
                .map(function (track) {
                  const deps = track.dependsOnTracks.length ? track.dependsOnTracks : ["frozen_contracts_only"];
                  return [
                    '<button type="button" class="graph-card-button" data-id="',
                    escapeHtml(track.trackId),
                    '" data-active="',
                    track.trackId === state.activeTrackId ? "true" : "false",
                    '" data-readiness="',
                    escapeHtml(track.readiness),
                    '">',
                    '<span class="button-title">',
                    escapeHtml(track.trackId + " " + track.title),
                    '</span>',
                    '<span class="button-note">',
                    escapeHtml(track.domain + " / " + track.readiness),
                    '</span>',
                    '<div class="mini-row">',
                    '<span class="mini-chip">Owns ' + escapeHtml(String(track.ownedArtifacts.length)) + " artifacts</span>",
                    '<span class="mini-chip">Depends on ' + escapeHtml(String(deps.length)) + " tracks</span>",
                    "</div>",
                    '<ul class="card-meta">',
                    deps.slice(0, 3).map(function (dep) {
                      return "<li>" + escapeHtml(dep) + "</li>";
                    }).join(""),
                    "</ul>",
                    "</button>"
                  ].join("");
                })
                .join("");
              return [
                '<section class="wave-section">',
                '<div class="wave-header">',
                '<h3 class="wave-title">',
                escapeHtml(waveLabels[waveId]),
                '</h3>',
                '<span class="chip" data-tone="focus">',
                escapeHtml(String(groups[waveId].length) + " tracks"),
                '</span>',
                "</div>",
                '<div class="card-grid">',
                rows,
                "</div>",
                "</section>"
              ].join("");
            })
            .join("");
        }

        function parityTableHtml(tracks) {
          return tracks.map(function (track) {
            return [
              "<tr>",
              "<td>",
              '<span class="status-dot" data-readiness="' + escapeHtml(track.readiness) + '"></span> ',
              escapeHtml(track.trackId + " " + track.title),
              "</td>",
              "<td>",
              escapeHtml(track.readiness),
              "</td>",
              "<td>",
              escapeHtml(track.dependsOnTracks.join(", ") || "frozen_contracts_only"),
              "</td>",
              "<td>",
              escapeHtml(track.ownedArtifacts.join(", ")),
              "</td>",
              "</tr>"
            ].join("");
          }).join("");
        }

        function listHtml(values, activeValue, group) {
          return values.map(function (value) {
            const label = value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1);
            return [
              '<button type="button" class="filter-button" data-filter-group="',
              escapeHtml(group),
              '" data-value="',
              escapeHtml(value),
              '" data-active="',
              value === activeValue ? "true" : "false",
              '">',
              escapeHtml(label),
              "</button>"
            ].join("");
          }).join("");
        }

        function attachArrowNavigation(buttons, axis) {
          buttons.forEach(function (button, index) {
            button.addEventListener("keydown", function (event) {
              const isNext = axis === "horizontal" ? event.key === "ArrowRight" : event.key === "ArrowDown";
              const isPrev = axis === "horizontal" ? event.key === "ArrowLeft" : event.key === "ArrowUp";
              if (!isNext && !isPrev) return;
              event.preventDefault();
              const nextIndex = (index + (isNext ? 1 : buttons.length - 1)) % buttons.length;
              buttons[nextIndex].focus();
              buttons[nextIndex].click();
            });
          });
        }

        function renderInspector(track) {
          const owned = document.getElementById("inspector-owned");
          const deps = document.getElementById("inspector-dependencies");
          const merge = document.getElementById("inspector-merge");
          const risks = document.getElementById("inspector-risks");
          const chips = document.getElementById("inspector-chips");
          document.getElementById("inspector-title").textContent = track.trackId + " " + track.title;
          document.getElementById("inspector-mission").textContent = track.shortMission;
          chips.innerHTML = [
            '<span class="chip" data-tone="' + toneForReadiness(track.readiness) + '">' + escapeHtml(track.readiness) + "</span>",
            '<span class="chip" data-tone="focus">' + escapeHtml(track.domain) + "</span>",
            '<span class="chip" data-tone="focus">' + escapeHtml(track.waveLabel) + "</span>"
          ].join("");
          owned.innerHTML = track.ownedArtifacts.map(function (artifact) {
            return "<li>" + escapeHtml(artifact) + "</li>";
          }).join("");
          deps.innerHTML = [
            "<li><strong>Track dependencies:</strong> " + escapeHtml(track.dependsOnTracks.join(", ") || "frozen_contracts_only") + "</li>",
            "<li><strong>Contract inputs:</strong> " + escapeHtml(track.dependsOnContracts.join(", ")) + "</li>",
            "<li><strong>Produced interfaces:</strong> " + escapeHtml(track.producedInterfaces.join(", ")) + "</li>"
          ].join("");
          merge.innerHTML = track.mergeCriteria.map(function (item) {
            return "<li>" + escapeHtml(item) + "</li>";
          }).join("");
          const riskItems = []
            .concat(track.collisionSeamRefs.map(function (ref) {
              return "Seam: " + ref;
            }))
            .concat(track.carryForwardIssueRefs.map(function (issueId) {
              const issue = data.issueById[issueId];
              return issueId + ": " + (issue ? issue.title : issueId);
            }))
            .concat(track.guardrails);
          risks.innerHTML = riskItems.map(function (item) {
            return "<li>" + escapeHtml(item) + "</li>";
          }).join("");
        }

        function render() {
          const tracks = filteredTracks();
          ensureActiveTrack(tracks);
          const activeTrack = getTrack(state.activeTrackId) || tracks[0] || data.tracks[0];

          root.setAttribute("data-active-track", activeTrack ? activeTrack.trackId : "");
          root.setAttribute("data-filter-readiness", state.readiness);
          root.setAttribute("data-filter-domain", state.domain);
          root.setAttribute(
            "data-reduced-motion",
            window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "no-preference",
          );
          root.setAttribute("data-ready-count", String(data.summary.readyCount));
          root.setAttribute("data-blocked-count", String(data.summary.blockedCount));
          root.setAttribute("data-deferred-count", String(data.summary.deferredCount));
          root.setAttribute("data-filtered-count", String(tracks.length));

          document.getElementById("summary-chip-row").innerHTML = [
            '<span class="chip" data-tone="ready">' + escapeHtml(String(data.summary.readyCount) + " ready") + "</span>",
            '<span class="chip" data-tone="blocked">' + escapeHtml(String(data.summary.blockedCount) + " blocked") + "</span>",
            '<span class="chip" data-tone="deferred">' + escapeHtml(String(data.summary.deferredCount) + " deferred") + "</span>",
            '<span class="chip" data-tone="focus">' + escapeHtml(String(tracks.length) + " visible") + "</span>"
          ].join("");

          document.getElementById("readiness-filter-group").innerHTML = listHtml(readinessOrder, state.readiness, "readiness");
          document.getElementById("domain-filter-group").innerHTML = listHtml(domainOrder, state.domain, "domain");
          document.getElementById("track-list-summary").textContent =
            String(tracks.length) + " tracks in view. Active track: " + (activeTrack ? activeTrack.trackId : "none");
          document.getElementById("track-list").innerHTML = buttonRowHtml(tracks);
          document.getElementById("graph-grid").innerHTML = tracks.length
            ? graphHtml(tracks)
            : '<div class="empty-state">No tracks match the current filters.</div>';
          document.getElementById("parity-table-body").innerHTML = parityTableHtml(tracks);
          document.getElementById("constraint-list").innerHTML = data.constraints.map(function (issue) {
            return "<li><strong>" + escapeHtml(issue.issueId) + ".</strong> " + escapeHtml(issue.title) + "</li>";
          }).join("");

          if (activeTrack) {
            renderInspector(activeTrack);
          }

          const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
          filterButtons.forEach(function (button) {
            button.addEventListener("click", function () {
              const group = button.getAttribute("data-filter-group");
              const value = button.getAttribute("data-value") || "all";
              if (group === "readiness") state.readiness = value;
              if (group === "domain") state.domain = value;
              render();
            });
          });
          attachArrowNavigation(
            Array.from(document.querySelectorAll(".filter-button[data-filter-group='readiness']")),
            "horizontal",
          );
          attachArrowNavigation(
            Array.from(document.querySelectorAll(".filter-button[data-filter-group='domain']")),
            "horizontal",
          );

          const trackButtons = Array.from(document.querySelectorAll(".track-button"));
          trackButtons.forEach(function (button) {
            button.addEventListener("click", function () {
              state.activeTrackId = button.getAttribute("data-id") || "";
              render();
            });
          });
          attachArrowNavigation(trackButtons, "vertical");

          const graphButtons = Array.from(document.querySelectorAll(".graph-card-button"));
          graphButtons.forEach(function (button) {
            button.addEventListener("click", function () {
              state.activeTrackId = button.getAttribute("data-id") || "";
              render();
            });
          });
          attachArrowNavigation(graphButtons, "vertical");
        }

        window.__phase5ParallelGateData = { loaded: false, summary: data.summary };
        render();
        window.__phase5ParallelGateData = { loaded: true, summary: data.summary };
      })();
    </script>
  </body>
</html>`;
}

function main(): void {
  for (const seam of PARALLEL_SEAMS) {
    writeJson(seam.fileName, seam);
  }

  const launchPackets = [
    launchPacket("par_315", ["packages/domains/hub", "packages/domains/booking", "tests/integration"], [
      "Case-kernel persistence and transition guards",
      "Lineage carry-forward from Phase 4 fallback truth",
      "Ownership fence and stale-owner recovery integration tests",
    ]),
    launchPacket("par_316", ["packages/domains/hub", "packages/security", "tests/integration"], [
      "Acting-context issuance and supersession",
      "Minimum-necessary projection guards",
      "Cross-organisation write-freeze tests on drift",
    ]),
    launchPacket("par_317", ["packages/domains/policy", "packages/domains/hub", "tests/integration"], [
      "Policy compiler determinism",
      "PolicyTupleHash repeatability",
      "Frontier and separation-law replay tests",
    ]),
  ];

  for (const packet of launchPackets) {
    writeJson(`data/launchpacks/314_track_launch_packet_${String(packet.launchTrackId).slice(-3)}.json`, packet);
  }

  const registry = {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    reviewedOn: TODAY,
    gateVerdict: GATE_VERDICT,
    decisionStatement:
      "314 opens only the first executable Phase 5 backend wave. It keeps every later track blocked or deferred until upstream implementations exist and the collision seams published here remain intact.",
    firstWaveTrackIds: READY_TRACK_IDS,
    summary: SUMMARY,
    hardMergeCriteria: HARD_MERGE_CRITERIA,
    carryForwardIssueRefs: carryForwardIssues.map((issue) => issue.issueId),
    seamRefs: PARALLEL_SEAMS.map((seam) => seam.fileName),
    tracks: TRACKS,
    artifactRegistry: ARTIFACTS,
    dependencyInterfaces: DEPENDENCY_EDGES,
    collisionGapIds: GAP_LOG.map((gap) => gap.gapId),
    sourceRefs: Object.values(SOURCE_REFS),
  };

  const dependencyYaml = {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    generatedOn: TODAY,
    firstWaveTrackIds: READY_TRACK_IDS,
    tracks: TRACKS.map((track) => ({
      trackId: track.trackId,
      readiness: track.readiness,
      wave: track.wave,
      dependsOnTracks: track.dependsOnTracks,
      producedInterfaces: track.producedInterfaces,
    })),
    interfaces: DEPENDENCY_EDGES,
  };

  const externalReferenceNotes = {
    taskId: SHORT_TASK_ID,
    reviewedOn: TODAY,
    localSourceOfTruth: Object.values(SOURCE_REFS),
    summary:
      "External sources were used only to validate current NHS operational context, browser-proof technique, and dense board ergonomics. Local 311 to 313 contracts remained authoritative wherever semantics could diverge.",
    sources: [
      {
        sourceId: "playwright_browser_contexts",
        title: "Isolation | Playwright",
        url: "https://playwright.dev/docs/browser-contexts",
        publisher: "Playwright",
        observedOn: TODAY,
        borrowedInto: [
          "314 board proof uses isolated browser contexts for desktop and reduced-motion mobile passes.",
          "Parallel gate proof treats each view and filter state as a clean-slate scenario.",
        ],
        rejectedOrConstrained: [
          "No Playwright guidance changed local track readiness law or ownership semantics.",
        ],
      },
      {
        sourceId: "playwright_trace_viewer",
        title: "Trace viewer | Playwright",
        url: "https://playwright.dev/docs/trace-viewer-intro",
        publisher: "Playwright",
        observedOn: TODAY,
        borrowedInto: ["314 board proof records trace artifacts for later review."],
        rejectedOrConstrained: ["Tracing remains proof evidence only, not a source of product semantics."],
      },
      {
        sourceId: "playwright_aria_snapshots",
        title: "Snapshot testing | Playwright",
        url: "https://playwright.dev/docs/aria-snapshots",
        publisher: "Playwright",
        observedOn: TODAY,
        borrowedInto: ["314 board proof captures ARIA snapshots for the board root and parity table."],
        rejectedOrConstrained: ["Snapshot capture does not replace explicit state and parity assertions."],
      },
      {
        sourceId: "nhs_cis",
        title: "Care Identity Service (CIS) - NHS England Digital",
        url: "https://digital.nhs.uk/services/care-identity-service",
        publisher: "NHS England Digital",
        observedOn: TODAY,
        borrowedInto: [
          "314 gate keeps staff identity and acting-context work aligned to a current NHS identity boundary.",
        ],
        rejectedOrConstrained: [
          "CIS product wording did not override the frozen local field names in 311.",
        ],
      },
      {
        sourceId: "nhs_mesh_service",
        title: "Message Exchange for Social Care and Health - NHS England Digital",
        url: "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
        publisher: "NHS England Digital",
        observedOn: TODAY,
        borrowedInto: [
          "314 defers seq_335 until real continuity-routing code and non-production route configuration can be opened safely.",
        ],
        rejectedOrConstrained: [
          "MESH transport posture did not collapse local acknowledgement debt or truth-projection law.",
        ],
      },
      {
        sourceId: "nhs_mesh_client_user_guide",
        title: "Message Exchange for Social Care and Health: client user guide - NHS England Digital",
        url: "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-guidance-hub/client-user-guide",
        publisher: "NHS England Digital",
        observedOn: TODAY,
        borrowedInto: [
          "Route setup remains an operational concern, reinforcing why seq_335 is deferred rather than opened speculatively.",
        ],
        rejectedOrConstrained: [
          "Guide workflow details were not imported into product contracts or UI semantics.",
        ],
      },
      {
        sourceId: "nhs_check_answers",
        title: "Check answers – NHS digital service manual",
        url: "https://service-manual.nhs.uk/design-system/patterns/check-answers",
        publisher: "NHS digital service manual",
        observedOn: TODAY,
        borrowedInto: [
          "Inspector content stays summary-first and exposes explicit dependencies and change surfaces.",
        ],
        rejectedOrConstrained: [
          "The board is not a form wizard and does not inherit generic summary-page flow semantics.",
        ],
      },
      {
        sourceId: "nhs_confirmation_page",
        title: "Confirmation page – NHS digital service manual",
        url: "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
        publisher: "NHS digital service manual",
        observedOn: TODAY,
        borrowedInto: [
          "The gate board keeps the main verdict calm and concise while leaving detailed conditions in adjacent regions.",
        ],
        rejectedOrConstrained: [
          "The board is not a release approval surface; it remains a constrained readiness board.",
        ],
      },
      {
        sourceId: "nhs_back_link",
        title: "Back link – NHS digital service manual",
        url: "https://service-manual.nhs.uk/design-system/components/back-link",
        publisher: "NHS digital service manual",
        observedOn: TODAY,
        borrowedInto: [
          "Filter and selection changes preserve same-surface context instead of forcing route changes.",
        ],
        rejectedOrConstrained: [
          "Browser history was not treated as a substitute for explicit selected-track state.",
        ],
      },
      {
        sourceId: "nhs_table",
        title: "Table – NHS digital service manual",
        url: "https://service-manual.nhs.uk/design-system/components/table",
        publisher: "NHS digital service manual",
        observedOn: TODAY,
        borrowedInto: [
          "Graph and table parity remain visible together on the gate board.",
          "The readiness table keeps explicit column scope and concise headers.",
        ],
        rejectedOrConstrained: [
          "Table guidance did not override the three-region operational board layout.",
        ],
      },
      {
        sourceId: "carbon_data_table",
        title: "Data table usage",
        url: "https://carbondesignsystem.com/components/data-table/usage/",
        publisher: "IBM Carbon Design System",
        observedOn: TODAY,
        borrowedInto: [
          "Dense operational table ergonomics for the parity table and readiness rows.",
        ],
        rejectedOrConstrained: [
          "Carbon row-toolbar patterns were not imported into clinical or operational semantics.",
        ],
      },
      {
        sourceId: "vercel_observability",
        title: "Observability",
        url: "https://vercel.com/docs/observability",
        publisher: "Vercel",
        observedOn: TODAY,
        borrowedInto: [],
        rejectedOrConstrained: [
          "Rejected as the primary board metaphor because the 314 gate is about ownership and readiness, not telemetry-first monitoring.",
        ],
      },
      {
        sourceId: "linear_peek",
        title: "Peek preview – Linear Docs",
        url: "https://linear.app/docs/peek",
        publisher: "Linear Docs",
        observedOn: TODAY,
        borrowedInto: [],
        rejectedOrConstrained: [
          "Rejected as the main inspector model because the gate board needs a persistent synchronized right-hand inspector, not an ephemeral preview.",
        ],
      },
    ],
  };

  const consistencyMatrixRows = [
    {
      concernId: "CC314_001",
      lawArea: "hub_case_and_lineage",
      canonicalObjectOrField: "HubCoordinationCase + booking lineage",
      frozenSource: "311",
      ownerTrack: "par_315",
      collisionStatus: "clear",
      resolution: "314 opens par_315 directly against the 311 case kernel freeze.",
    },
    {
      concernId: "CC314_002",
      lawArea: "acting_context",
      canonicalObjectOrField: "ActingContext + ActingScopeTuple",
      frozenSource: "311",
      ownerTrack: "par_316",
      collisionStatus: "clear",
      resolution: "314 opens par_316 directly against the 311 acting-context freeze.",
    },
    {
      concernId: "CC314_003",
      lawArea: "minimum_necessary_visibility",
      canonicalObjectOrField: "CrossOrganisationVisibilityEnvelope + audience tiers",
      frozenSource: "311",
      ownerTrack: "par_316",
      collisionStatus: "clear",
      resolution: "Visibility enforcement stays with par_316 and is consumed read-only by later tracks.",
    },
    {
      concernId: "CC314_004",
      lawArea: "policy_tuple_hash",
      canonicalObjectOrField: "policyTupleHash",
      frozenSource: "312",
      ownerTrack: "par_317",
      collisionStatus: "clear",
      resolution: "Tuple hash remains deterministic and owned by the compiler/evaluation engine.",
    },
    {
      concernId: "CC314_005",
      lawArea: "ranking_frontier_law",
      canonicalObjectOrField: "patient-offerable and direct-commit frontier law",
      frozenSource: "312",
      ownerTrack: "par_317",
      collisionStatus: "clear",
      resolution: "314 forbids later tracks from reordering candidates outside 312 law.",
    },
    {
      concernId: "CC314_006",
      lawArea: "truth_tuple_hash",
      canonicalObjectOrField: "truthTupleHash",
      frozenSource: "313",
      ownerTrack: "par_321",
      collisionStatus: "clear",
      resolution: "Commit evidence and confirmation truth stay centered on par_321.",
    },
    {
      concernId: "CC314_007",
      lawArea: "truth_projection_writer",
      canonicalObjectOrField: "HubOfferToConfirmationTruthProjection",
      frozenSource: "313",
      ownerTrack: "par_321",
      collisionStatus: "resolved_by_314",
      resolution: "Canonical writer locked to par_321; sibling tracks emit deltas only via the 314 seam.",
    },
    {
      concernId: "CC314_008",
      lawArea: "supplier_mirror_bootstrap",
      canonicalObjectOrField: "HubSupplierMirrorState",
      frozenSource: "313 seam",
      ownerTrack: "par_325",
      collisionStatus: "resolved_by_314",
      resolution: "State ownership locked to par_325; par_321 emits bootstrap requests only.",
    },
    {
      concernId: "CC314_009",
      lawArea: "exception_lifecycle",
      canonicalObjectOrField: "HubCoordinationException",
      frozenSource: "313 seam",
      ownerTrack: "par_323",
      collisionStatus: "resolved_by_314",
      resolution: "Canonical exception creation stays with par_323; par_325 emits worker outcomes only.",
    },
    {
      concernId: "CC314_010",
      lawArea: "shell_ownership",
      canonicalObjectOrField: "HubDeskShell + folded-shell contract",
      frozenSource: "311 route family",
      ownerTrack: "par_326",
      collisionStatus: "clear",
      resolution: "Later frontend tracks extend the shell rather than forking route ownership.",
    },
    {
      concernId: "CC314_011",
      lawArea: "phase4_performance_carry_forward",
      canonicalObjectOrField: "interaction support target",
      frozenSource: "310",
      ownerTrack: "seq_314",
      collisionStatus: "carried_forward",
      resolution: "ISSUE310_003 remains active until seq_340 proves the browser-visible family under load.",
    },
    {
      concernId: "CC314_012",
      lawArea: "provider_evidence_class_boundaries",
      canonicalObjectOrField: "live vs sandbox vs unsupported vs future-network claims",
      frozenSource: "310 and 313",
      ownerTrack: "seq_314",
      collisionStatus: "carried_forward",
      resolution: "Later commit and visibility tracks must not collapse evidence classes.",
    },
  ];

  const ownerMatrixRows = TRACKS.map((track) => ({
    trackId: track.trackId,
    title: track.title,
    domain: track.domain,
    wave: track.wave,
    readiness: track.readiness,
    ownedArtifacts: track.ownedArtifacts.join(" | "),
    nonOwnedArtifacts: track.nonOwnedArtifacts.join(" | "),
    dependsOnTracks: track.dependsOnTracks.join(" | ") || "frozen_contracts_only",
    launchPacketRef: track.launchPacketRef ?? "",
    collisionSeamRefs: track.collisionSeamRefs.join(" | "),
    carryForwardIssueRefs: track.carryForwardIssueRefs.join(" | "),
  }));

  const boardData = {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    visualMode: VISUAL_MODE,
    verdict: GATE_VERDICT,
    summary: SUMMARY,
    initialActiveTrackId: READY_TRACK_IDS[0],
    tracks: TRACKS.map((track) => ({
      ...track,
      waveLabel: {
        wave_1: "Wave 1",
        wave_2: "Wave 2",
        wave_3: "Wave 3",
        ops: "Operational",
        integration: "Integration",
        proof: "Proof",
      }[track.wave],
    })),
    constraints: carryForwardIssues.map((issue) => ({
      issueId: issue.issueId,
      title: issue.title,
    })),
    issueById: Object.fromEntries(
      carryForwardIssues.map((issue) => [
        issue.issueId,
        { title: issue.title, summary: issue.summary, nextAction: issue.nextAction },
      ]),
    ),
  };

  writeJson("data/contracts/314_phase5_track_readiness_registry.json", registry);
  writeText("data/contracts/314_phase5_dependency_interface_map.yaml", toYaml(dependencyYaml));
  writeJson("data/analysis/314_external_reference_notes.json", externalReferenceNotes);
  writeCsv(
    "data/analysis/314_phase5_contract_consistency_matrix.csv",
    consistencyMatrixRows,
    ["concernId", "lawArea", "canonicalObjectOrField", "frozenSource", "ownerTrack", "collisionStatus", "resolution"],
  );
  writeCsv(
    "data/analysis/314_phase5_track_owner_matrix.csv",
    ownerMatrixRows,
    [
      "trackId",
      "title",
      "domain",
      "wave",
      "readiness",
      "ownedArtifacts",
      "nonOwnedArtifacts",
      "dependsOnTracks",
      "launchPacketRef",
      "collisionSeamRefs",
      "carryForwardIssueRefs",
    ],
  );
  writeJson("data/analysis/314_phase5_parallel_gap_log.json", {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    reviewedOn: TODAY,
    gaps: GAP_LOG,
  });

  writeText(
    "docs/architecture/314_phase5_parallel_track_gate_and_dependency_map.md",
    buildArchitectureDoc(),
  );
  writeText("docs/release/314_phase5_parallel_open_gate.md", buildReleaseDoc());
  writeText("docs/api/314_phase5_track_interface_registry.md", buildApiDoc());
  writeText(
    "docs/frontend/314_phase5_parallel_tracks_gate_board.html",
    buildBoardHtml(boardData),
  );

  console.log(
    `Generated 314 Phase 5 parallel gate pack with ${SUMMARY.readyCount} ready, ${SUMMARY.blockedCount} blocked, and ${SUMMARY.deferredCount} deferred tracks.`,
  );
}

main();
