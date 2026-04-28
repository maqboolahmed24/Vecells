import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const TODAY = new Date().toISOString().slice(0, 10);

const TASK_ID =
  "seq_311_phase5_freeze_network_coordination_contract_org_boundaries_and_acting_context_rules";
const SHORT_TASK_ID = "seq_311";
const CONTRACT_VERSION = "311.phase5.hub-core-freeze.v1";
const VISUAL_MODE = "Phase5_Hub_State_And_Scope_Atlas";

const SOURCE_REFS = {
  phase5Hub:
    "blueprint/phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine",
  phase5Identity:
    "blueprint/phase-5-the-network-horizon.md#5B. Staff identity, organisation boundaries, and acting context",
  phaseCards: "blueprint/phase-cards.md#Card-6",
  phase4HubFallback:
    "blueprint/phase-4-the-booking-engine.md#hub-fallback-and-lineage-carry-forward",
  phase0Lineage: "blueprint/phase-0-the-foundation-protocol.md#1.1C LineageCaseLink",
  phase0Lease: "blueprint/phase-0-the-foundation-protocol.md#1.10 RequestLifecycleLease",
  phase0Command: "blueprint/phase-0-the-foundation-protocol.md#1.22 CommandActionRecord",
  phase0Settlement: "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord",
  patientPortalShell:
    "blueprint/patient-portal-experience-architecture-blueprint.md#Portal-shell-family-ownership-is-explicit",
  staffShell:
    "blueprint/staff-workspace-interface-architecture.md#route-family-and-shell-ownership-contracts",
};

type StateFamily = {
  familyId: string;
  label: string;
  summary: string;
  accent: string;
  states: string[];
};

type StateDefinition = {
  stateId: string;
  label: string;
  familyId: string;
  familyLabel: string;
  summary: string;
  dominantAuthority: string;
  entryPredicateSummary: string;
  routeCue: string;
  allowedCommandIds: string[];
  activeBlockerIds: string[];
  truthNotes: string[];
};

type TransitionDefinition = {
  transitionId: string;
  from: string;
  to: string;
  predicateId: string;
  predicate: string;
  controllingObject: string;
  commandScope: string;
  truthPredicate: string;
  ownerTask: string;
  sourceRef: string;
};

type CommandDefinition = {
  commandId: string;
  label: string;
  method: string;
  path: string;
  actionScope: string;
  purpose: string;
  dominantStates: string[];
  requiredEnvelope: string[];
  commandRecords: string[];
  ownerTask: string;
  sourceRefs: string[];
};

type ApiSurfaceDefinition = {
  method: string;
  path: string;
  actionScope: string;
  purpose: string;
  requiredEnvelope: string[];
};

type RouteDefinition = {
  routeId: string;
  path: string;
  projectionRef: string;
  transitionType: string;
  historyPolicy: string;
  objectAnchor: string;
  dominantAction: string;
  supportedStates: string[];
  commandIds: string[];
  audienceTierRefs: string[];
  sameShell: boolean;
  ownershipClaim: string;
  selectedAnchorPolicy: string;
  publicationControls: string[];
  sourceRefs: string[];
};

type BlockerDefinition = {
  blockerId: string;
  label: string;
  description: string;
  closeImpact: string;
};

type AudienceDefinition = {
  tierId: string;
  label: string;
  summary: string;
  visibilityProjectionPolicyRef: string;
  minimumNecessaryContractRef: string;
  sectionContracts: string[];
  previewContracts: string[];
  artifactContracts: string[];
  visibleFieldRefs: string[];
  hiddenFieldRefs: string[];
  placeholderContractRef: string;
  commandGuards: string[];
  driftResponse: string;
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
    if (Object.keys(value).length === 0) {
      return `${prefix}{}`;
    }
    return Object.entries(value)
      .map(([key, entry]) => {
        if (Array.isArray(entry) && entry.length === 0) {
          return `${prefix}${key}: []`;
        }
        if (
          typeof entry === "object" &&
          entry !== null &&
          !Array.isArray(entry) &&
          Object.keys(entry).length === 0
        ) {
          return `${prefix}${key}: {}`;
        }
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
  const rule = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`,
  );
  return [head, rule, ...body].join("\n");
}

function refField(description: string, nullable = true): Record<string, unknown> {
  return {
    type: nullable ? ["string", "null"] : "string",
    minLength: nullable ? 0 : 1,
    description,
  };
}

function isoDateTimeField(description: string, nullable = false): Record<string, unknown> {
  return {
    type: nullable ? ["string", "null"] : "string",
    format: "date-time",
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

const TOP_LEVEL_STATUSES = [
  "hub_requested",
  "intake_validated",
  "queued",
  "claimed",
  "candidate_searching",
  "candidates_ready",
  "coordinator_selecting",
  "candidate_revalidating",
  "native_booking_pending",
  "confirmation_pending",
  "booked_pending_practice_ack",
  "booked",
  "closed",
] as const;

const BRANCH_STATUSES = [
  "alternatives_offered",
  "patient_choice_pending",
  "callback_transfer_pending",
  "callback_offered",
  "escalated_back",
] as const;

const ALL_STATUSES = [...TOP_LEVEL_STATUSES, ...BRANCH_STATUSES] as const;

const STATE_FAMILIES: StateFamily[] = [
  {
    familyId: "intake",
    label: "Intake and Queue",
    summary:
      "The network request is being validated, policy-scoped, and admitted into the hub queue under preserved booking lineage.",
    accent: "lineage",
    states: ["hub_requested", "intake_validated", "queued"],
  },
  {
    familyId: "coordination",
    label: "Coordination",
    summary:
      "Ownership, candidate discovery, and coordinator decision-making are active inside the hub shell.",
    accent: "current",
    states: ["claimed", "candidate_searching", "candidates_ready", "coordinator_selecting"],
  },
  {
    familyId: "choice",
    label: "Patient Choice",
    summary:
      "A governed offer pack exists, the full open-choice set is visible, and stale mutations are blocked by tuple drift.",
    accent: "visibility",
    states: ["alternatives_offered", "patient_choice_pending"],
  },
  {
    familyId: "commit",
    label: "Commit and Truth",
    summary:
      "A selected candidate is revalidated, committed, and then held in acknowledgement debt until origin-practice visibility is satisfied.",
    accent: "current",
    states: [
      "candidate_revalidating",
      "native_booking_pending",
      "confirmation_pending",
      "booked_pending_practice_ack",
      "booked",
    ],
  },
  {
    familyId: "fallback",
    label: "Fallback and Return",
    summary:
      "The hub has switched from direct coordination to callback or return-to-practice continuity, but the case stays supervised until linkage is durable.",
    accent: "warning",
    states: ["callback_transfer_pending", "callback_offered", "escalated_back"],
  },
  {
    familyId: "completion",
    label: "Completion",
    summary:
      "Closure is permitted only after ownership, truth, fallback, and acknowledgement blockers are all clear.",
    accent: "blocked",
    states: ["closed"],
  },
];

const BLOCKERS: BlockerDefinition[] = [
  {
    blockerId: "lineage_child_link_missing",
    label: "Hub lineage child link missing",
    description:
      "The hub case may not become live until a child LineageCaseLink(caseFamily = hub) exists beneath the origin booking branch.",
    closeImpact: "Blocks entry and blocks all writable posture.",
  },
  {
    blockerId: "ownership_lease_live",
    label: "Active ownership lease",
    description:
      "One RequestLifecycleLease-derived ownership lease remains live on the case and must be explicitly released, transferred, or superseded.",
    closeImpact: "Always blocks close while active or stale recovery is unresolved.",
  },
  {
    blockerId: "ownership_transition_open",
    label: "Ownership transition open",
    description:
      "A claim, release, transfer, or supervisor takeover is still pending acceptance or recovery.",
    closeImpact: "Blocks close and blocks new ownership-changing commands.",
  },
  {
    blockerId: "policy_tuple_stale",
    label: "Policy tuple stale",
    description:
      "The current compiled policy bundle, policy evaluation, or scope tuple no longer names the same admissible candidate or visibility posture.",
    closeImpact: "Blocks fresh mutations until the case is re-read under the current tuple.",
  },
  {
    blockerId: "selected_candidate_not_revalidated",
    label: "Selected candidate not freshly revalidated",
    description:
      "The selected candidate, source version, and reservation fence have not yet been rechecked against live capacity and policy truth.",
    closeImpact: "Blocks native booking and any calm booked copy.",
  },
  {
    blockerId: "offer_truth_blocks_close",
    label: "Offer truth still open",
    description:
      "HubOfferToConfirmationTruthProjection still reports blocked_by_offer or live patient choice posture.",
    closeImpact: "Blocks close and blocks any attempt to present the case as finished.",
  },
  {
    blockerId: "confirmation_truth_pending",
    label: "Confirmation truth pending",
    description:
      "Native booking proof exists or is in flight, but authoritative confirmation has not yet cleared the hard-match gate.",
    closeImpact: "Blocks final booked posture and request closure.",
  },
  {
    blockerId: "practice_ack_debt_open",
    label: "Origin-practice acknowledgement debt open",
    description:
      "The current ackGeneration has not been satisfied by current-generation acknowledgement evidence or an audited policy exception.",
    closeImpact: "Blocks close and keeps the case visible in hub oversight.",
  },
  {
    blockerId: "callback_linkage_pending",
    label: "Callback linkage pending",
    description:
      "The active HubFallbackRecord points to callback, but the linked CallbackCase or CallbackExpectationEnvelope is not yet durable and patient-visible.",
    closeImpact: "Blocks close and keeps callback transfer in the same shell.",
  },
  {
    blockerId: "return_linkage_pending",
    label: "Return-to-practice linkage pending",
    description:
      "The case has been escalated back, but the return workflow has not yet been durably attached to the same request lineage.",
    closeImpact: "Blocks close until the return task is materially linked.",
  },
  {
    blockerId: "continuity_evidence_degraded",
    label: "Continuity evidence degraded",
    description:
      "TransitionEnvelope or continuity evidence no longer validates the same route family, anchor, publication tuple, or active case version.",
    closeImpact: "Blocks new writes and demotes the shell to read-only or recovery posture.",
  },
  {
    blockerId: "identity_repair_active",
    label: "Identity repair still active",
    description:
      "The hub lineage is quarantined, in compensation, or otherwise unreleased by identity repair.",
    closeImpact: "Blocks calm patient, practice, and close posture until released.",
  },
  {
    blockerId: "cross_org_visibility_stale",
    label: "Cross-organisation visibility envelope stale",
    description:
      "The current acting context, minimum-necessary contract, or visibility envelope no longer names the same organisation scope or purpose of use.",
    closeImpact: "Blocks writes and forces a same-shell read-only refresh.",
  },
];

const COMMANDS: CommandDefinition[] = [
  {
    commandId: "create_hub_request",
    label: "Create network request",
    method: "POST",
    path: "/v1/hub/requests",
    actionScope: "hub.request.create",
    purpose:
      "Create one executable NetworkBookingRequest handoff while preserving booking lineage and origin-practice identity.",
    dominantStates: ["hub_requested"],
    requiredEnvelope: [
      "requestLineageRef",
      "originBookingCaseId",
      "originLineageCaseLinkRef",
      "reasonForHubRouting",
      "sourceDecisionEpochRef or equivalent lineage proof",
    ],
    commandRecords: ["CommandActionRecord", "CommandSettlementRecord"],
    ownerTask: SHORT_TASK_ID,
    sourceRefs: [
      SOURCE_REFS.phase5Hub,
      SOURCE_REFS.phase4HubFallback,
      SOURCE_REFS.phase0Command,
      SOURCE_REFS.phase0Settlement,
    ],
  },
  {
    commandId: "claim_case",
    label: "Claim hub case",
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}:claim",
    actionScope: "hub.case.claim",
    purpose:
      "Acquire the active ownership lease and mint a fresh ownership fence for active coordination.",
    dominantStates: ["queued", "claimed"],
    requiredEnvelope: [
      "ActingContext",
      "StaffIdentityContext",
      "ownershipEpoch expectation",
      "current visibility contract",
      "request lineage fence",
    ],
    commandRecords: ["CommandActionRecord", "CommandSettlementRecord"],
    ownerTask: SHORT_TASK_ID,
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.phase5Identity, SOURCE_REFS.phase0Lease],
  },
  {
    commandId: "transfer_ownership",
    label: "Transfer ownership",
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}:transfer-ownership",
    actionScope: "hub.case.transfer_ownership",
    purpose:
      "Start or accept a supervised ownership handoff without losing the same-shell case anchor.",
    dominantStates: ["claimed", "candidate_searching", "candidates_ready", "coordinator_selecting"],
    requiredEnvelope: [
      "ActingContext",
      "ownershipFenceToken",
      "ownershipEpoch",
      "current visibility contract",
      "continuity message ref",
    ],
    commandRecords: ["CommandActionRecord", "CommandSettlementRecord"],
    ownerTask: SHORT_TASK_ID,
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.phase5Identity, SOURCE_REFS.phase0Lease],
  },
  {
    commandId: "refresh_candidates",
    label: "Refresh candidates",
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}:refresh-candidates",
    actionScope: "hub.case.refresh_candidates",
    purpose:
      "Resolve one current NetworkCandidateSnapshot plus CrossSiteDecisionPlan under the active policy tuple.",
    dominantStates: ["claimed", "candidate_searching", "candidates_ready"],
    requiredEnvelope: [
      "ActingContext",
      "ownershipFenceToken",
      "ownershipEpoch",
      "policyTupleHash",
      "CrossOrganisationVisibilityEnvelope when cross-org work applies",
    ],
    commandRecords: ["CommandActionRecord", "CommandSettlementRecord"],
    ownerTask: SHORT_TASK_ID,
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.phase5Identity, SOURCE_REFS.phase0Command],
  },
  {
    commandId: "offer_alternatives",
    label: "Offer alternatives",
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}:offer-alternatives",
    actionScope: "hub.case.offer_alternatives",
    purpose:
      "Package one governed AlternativeOfferSession from the current clinically acceptable, trusted frontier.",
    dominantStates: [
      "candidates_ready",
      "coordinator_selecting",
      "alternatives_offered",
      "patient_choice_pending",
    ],
    requiredEnvelope: [
      "ActingContext",
      "ownershipFenceToken",
      "policyTupleHash",
      "current candidate snapshot ref",
      "current visibility contract",
    ],
    commandRecords: ["CommandActionRecord", "CommandSettlementRecord"],
    ownerTask: SHORT_TASK_ID,
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.phase5Identity, SOURCE_REFS.phase0Command],
  },
  {
    commandId: "commit_native_booking",
    label: "Commit native booking",
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}:commit-native-booking",
    actionScope: "hub.case.commit_native_booking",
    purpose:
      "Start one fenced HubCommitAttempt that alone may talk to the native booking adapter or imported confirmation gate.",
    dominantStates: [
      "coordinator_selecting",
      "candidate_revalidating",
      "native_booking_pending",
      "confirmation_pending",
    ],
    requiredEnvelope: [
      "ActingContext",
      "ownershipFenceToken",
      "ownershipEpoch",
      "policyTupleHash",
      "current truthTupleHash",
      "CrossOrganisationVisibilityEnvelope when cross-org work applies",
      "idempotency key",
    ],
    commandRecords: ["CommandActionRecord", "CommandSettlementRecord"],
    ownerTask: SHORT_TASK_ID,
    sourceRefs: [
      SOURCE_REFS.phase5Hub,
      SOURCE_REFS.phase5Identity,
      SOURCE_REFS.phase0Command,
      SOURCE_REFS.phase0Settlement,
    ],
  },
  {
    commandId: "return_to_practice",
    label: "Return to practice",
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}:return-to-practice",
    actionScope: "hub.case.return_to_practice",
    purpose:
      "Create the governed return workflow, preserve urgency carry, and keep the case open until the lineage link is durable.",
    dominantStates: [
      "queued",
      "claimed",
      "candidate_searching",
      "candidates_ready",
      "coordinator_selecting",
      "alternatives_offered",
      "patient_choice_pending",
      "candidate_revalidating",
      "native_booking_pending",
      "confirmation_pending",
      "booked_pending_practice_ack",
      "callback_transfer_pending",
      "escalated_back",
    ],
    requiredEnvelope: [
      "ActingContext",
      "ownershipFenceToken",
      "ownershipEpoch",
      "current visibility contract",
      "reason-coded fallback rationale",
    ],
    commandRecords: ["CommandActionRecord", "CommandSettlementRecord"],
    ownerTask: SHORT_TASK_ID,
    sourceRefs: [
      SOURCE_REFS.phase5Hub,
      SOURCE_REFS.phase5Identity,
      SOURCE_REFS.phase0Command,
      SOURCE_REFS.phase0Settlement,
    ],
  },
  {
    commandId: "close_case",
    label: "Close hub case",
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}:close",
    actionScope: "hub.case.close",
    purpose:
      "Ask LifecycleCoordinator to close the hub branch only after OpenCaseBlockers(h) is empty and fallback linkage is durable.",
    dominantStates: ["booked", "callback_offered", "escalated_back", "closed"],
    requiredEnvelope: [
      "ActingContext",
      "ownershipFenceToken",
      "ownershipEpoch",
      "current visibility contract",
      "LifecycleCoordinator close decision proof",
      "openCaseBlockerRefs[] = empty",
    ],
    commandRecords: ["CommandActionRecord", "CommandSettlementRecord"],
    ownerTask: SHORT_TASK_ID,
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.phase5Identity, SOURCE_REFS.phase0Settlement],
  },
];

const API_SURFACE: ApiSurfaceDefinition[] = [
  {
    method: "POST",
    path: "/v1/hub/requests",
    actionScope: "hub.request.create",
    purpose:
      "Create one executable NetworkBookingRequest handoff while preserving booking lineage and origin-practice identity.",
    requiredEnvelope: [
      "requestLineageRef",
      "originBookingCaseId",
      "originLineageCaseLinkRef",
      "reasonForHubRouting",
      "sourceDecisionEpochRef or equivalent lineage proof",
    ],
  },
  {
    method: "GET",
    path: "/v1/hub/cases/{hubCoordinationCaseId}",
    actionScope: "hub.case.read",
    purpose:
      "Read one authoritative HubCoordinationCase plus current same-shell posture, acting-scope, and close-blocker summary.",
    requiredEnvelope: [
      "ActingContext",
      "current visibility contract",
      "CrossOrganisationVisibilityEnvelope when cross-org scope applies",
    ],
  },
  ...COMMANDS.filter(
    (command) => !(command.method === "POST" && command.path === "/v1/hub/requests"),
  ).map((command) => ({
    method: command.method,
    path: command.path,
    actionScope: command.actionScope,
    purpose: command.purpose,
    requiredEnvelope: command.requiredEnvelope,
  })),
] as const;

const ROUTES: RouteDefinition[] = [
  {
    routeId: "hub_queue",
    path: "/hub/queue",
    projectionRef: "HubQueueProjection",
    transitionType: "same_shell_section_switch",
    historyPolicy: "push",
    objectAnchor: "queue_lane_or_case_row",
    dominantAction: "claim_or_monitor",
    supportedStates: [
      "intake_validated",
      "queued",
      "claimed",
      "candidate_searching",
      "candidates_ready",
      "booked_pending_practice_ack",
      "escalated_back",
    ],
    commandIds: ["claim_case", "refresh_candidates"],
    audienceTierRefs: ["hub_desk_visibility"],
    sameShell: true,
    ownershipClaim: "hub_shell_root",
    selectedAnchorPolicy: "preserve_last_safe_case_row",
    publicationControls: [
      "FrontendContractManifest",
      "ProjectionContractVersionSet",
      "projectionCompatibilityDigestRef",
      "RouteFreezeDisposition",
      "ReleaseRecoveryDisposition",
    ],
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.staffShell, SOURCE_REFS.patientPortalShell],
  },
  {
    routeId: "hub_case_detail",
    path: "/hub/case/:hubCoordinationCaseId",
    projectionRef: "HubCaseConsoleProjection",
    transitionType: "same_family_root",
    historyPolicy: "push",
    objectAnchor: "hub_coordination_case",
    dominantAction: "coordinate_or_resume",
    supportedStates: [...ALL_STATUSES],
    commandIds: [
      "claim_case",
      "transfer_ownership",
      "refresh_candidates",
      "offer_alternatives",
      "commit_native_booking",
      "return_to_practice",
      "close_case",
    ],
    audienceTierRefs: ["hub_desk_visibility", "origin_practice_visibility"],
    sameShell: true,
    ownershipClaim: "hub_shell_root",
    selectedAnchorPolicy: "preserve_case_pulse_and_decision_dock",
    publicationControls: [
      "FrontendContractManifest",
      "ProjectionContractVersionSet",
      "projectionCompatibilityDigestRef",
      "RouteFreezeDisposition",
      "ReleaseRecoveryDisposition",
    ],
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.staffShell, SOURCE_REFS.patientPortalShell],
  },
  {
    routeId: "hub_alternatives",
    path: "/hub/alternatives/:offerSessionId",
    projectionRef: "HubAlternativeOfferProjection",
    transitionType: "same_object_child",
    historyPolicy: "push",
    objectAnchor: "offer_session",
    dominantAction: "deliver_or_review_choices",
    supportedStates: [
      "alternatives_offered",
      "patient_choice_pending",
      "callback_transfer_pending",
    ],
    commandIds: ["offer_alternatives", "return_to_practice"],
    audienceTierRefs: ["hub_desk_visibility"],
    sameShell: true,
    ownershipClaim: "hub_same_case_child",
    selectedAnchorPolicy: "preserve_offer_entry_and_fallback_card",
    publicationControls: [
      "FrontendContractManifest",
      "ProjectionContractVersionSet",
      "projectionCompatibilityDigestRef",
      "RouteFreezeDisposition",
      "ReleaseRecoveryDisposition",
    ],
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.staffShell],
  },
  {
    routeId: "hub_exceptions",
    path: "/hub/exceptions",
    projectionRef: "HubExceptionWorkbenchProjection",
    transitionType: "same_shell_section_switch",
    historyPolicy: "push",
    objectAnchor: "exception_lane",
    dominantAction: "recover_or_supervise",
    supportedStates: [
      "claimed",
      "candidate_revalidating",
      "confirmation_pending",
      "callback_transfer_pending",
      "escalated_back",
      "booked_pending_practice_ack",
    ],
    commandIds: ["transfer_ownership", "return_to_practice", "close_case"],
    audienceTierRefs: ["hub_desk_visibility"],
    sameShell: true,
    ownershipClaim: "hub_same_case_peer",
    selectedAnchorPolicy: "preserve_recovery_task_anchor",
    publicationControls: [
      "FrontendContractManifest",
      "ProjectionContractVersionSet",
      "projectionCompatibilityDigestRef",
      "RouteFreezeDisposition",
      "ReleaseRecoveryDisposition",
    ],
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.staffShell],
  },
  {
    routeId: "hub_audit",
    path: "/hub/audit/:hubCoordinationCaseId",
    projectionRef: "HubAuditTrailProjection",
    transitionType: "same_object_child",
    historyPolicy: "push",
    objectAnchor: "audit_record_anchor",
    dominantAction: "review_proof",
    supportedStates: [...ALL_STATUSES],
    commandIds: [],
    audienceTierRefs: ["hub_desk_visibility", "origin_practice_visibility"],
    sameShell: true,
    ownershipClaim: "hub_same_case_child",
    selectedAnchorPolicy: "preserve_audit_filter_and_case_anchor",
    publicationControls: [
      "FrontendContractManifest",
      "ProjectionContractVersionSet",
      "projectionCompatibilityDigestRef",
      "RouteFreezeDisposition",
      "ReleaseRecoveryDisposition",
    ],
    sourceRefs: [SOURCE_REFS.phase5Hub, SOURCE_REFS.staffShell, SOURCE_REFS.patientPortalShell],
  },
];

const AUDIENCES: AudienceDefinition[] = [
  {
    tierId: "origin_practice_visibility",
    label: "Origin practice visibility",
    summary:
      "Operational macro truth for the originating practice without exposing hub-internal narrative, raw proof, or cross-site capacity detail.",
    visibilityProjectionPolicyRef: "HubPracticeVisibilityPolicy",
    minimumNecessaryContractRef: "MinimumNecessaryContract.origin_practice",
    sectionContracts: [
      "PracticeVisibilityProjection.summary",
      "PracticeContinuityMessage.delta",
      "PracticeAcknowledgementStatusStrip",
    ],
    previewContracts: ["OriginPracticeCasePreview", "PracticeAckDebtPreview"],
    artifactContracts: ["PracticeVisibilityProjection", "PracticeAcknowledgementRecord"],
    visibleFieldRefs: [
      "requestLineageRef",
      "macro_booking_status",
      "fallback_reason_code",
      "patient_communication_state",
      "latest_continuity_delta",
      "ack_generation_state",
    ],
    hiddenFieldRefs: [
      "hub_internal_free_text",
      "cross_site_capacity_detail",
      "raw_native_booking_proof",
    ],
    placeholderContractRef: "HubOutOfScopePlaceholder.origin_practice",
    commandGuards: [
      "Current CrossOrganisationVisibilityEnvelope",
      "Current ackGeneration",
      "No reinterpretation from frontend state",
    ],
    driftResponse:
      "Demote to read-only or recovery posture when organisation, purpose-of-use, or envelope drift invalidates the current scope.",
  },
  {
    tierId: "hub_desk_visibility",
    label: "Hub desk visibility",
    summary:
      "Minimum necessary routing, timing, access, and governed proof required for safe coordination across organisations.",
    visibilityProjectionPolicyRef: "HubDeskVisibilityProjectionPolicy",
    minimumNecessaryContractRef: "MinimumNecessaryContract.hub_desk",
    sectionContracts: [
      "HubCaseConsoleProjection",
      "HubAlternativeOfferProjection",
      "HubOperationalEvidencePanel",
    ],
    previewContracts: ["HubQueuePreview", "HubCasePulse"],
    artifactContracts: [
      "NetworkBookingRequest",
      "HubCoordinationCase",
      "HubOfferToConfirmationTruthProjection",
    ],
    visibleFieldRefs: [
      "clinical_routing_summary",
      "operational_timing_needs",
      "travel_access_constraints",
      "governed_coordination_evidence",
      "requestLineageRef",
      "selected_candidate_ref",
    ],
    hiddenFieldRefs: [
      "broad_narrative_without_promotion",
      "attachment_payload_without_break_glass",
    ],
    placeholderContractRef: "HubOutOfScopePlaceholder.hub_desk",
    commandGuards: [
      "ActingContext.scopeTupleHash",
      "ownershipFenceToken + ownershipEpoch",
      "current visibility contract",
      "reason-coded break-glass when promoted",
    ],
    driftResponse:
      "Freeze writable controls in place and require a same-shell re-read under the new acting context.",
  },
  {
    tierId: "servicing_site_visibility",
    label: "Servicing site visibility",
    summary:
      "Encounter-delivery and site-local capacity facts only, with no origin triage notes, callback rationale, or other-site alternatives.",
    visibilityProjectionPolicyRef: "HubServicingSiteVisibilityPolicy",
    minimumNecessaryContractRef: "MinimumNecessaryContract.servicing_site",
    sectionContracts: ["ServicingSiteDeliveryProjection", "SiteCapacityManagePanel"],
    previewContracts: ["ServicingSiteAppointmentPreview"],
    artifactContracts: ["HubAppointmentRecord", "NetworkManageCapabilities"],
    visibleFieldRefs: [
      "encounter_delivery_brief",
      "site_local_capacity",
      "confirmed_slot_summary",
      "manage_capability_state",
    ],
    hiddenFieldRefs: [
      "origin_practice_triage_notes",
      "callback_rationale",
      "alternative_options_other_sites",
    ],
    placeholderContractRef: "HubOutOfScopePlaceholder.servicing_site",
    commandGuards: [
      "Purpose of use = site delivery",
      "Current CrossOrganisationVisibilityEnvelope",
      "No access to origin-practice-only fields",
    ],
    driftResponse:
      "Keep the case anchor visible but downgrade to read-only delivery posture until the servicing-site envelope is regenerated.",
  },
];

const GAP_SEAMS: GapSeam[] = [
  {
    seamId: "PHASE5_INTERFACE_GAP_HUB_CORE_POLICY_AND_CAPACITY",
    fileName: "data/contracts/PHASE5_INTERFACE_GAP_HUB_CORE_POLICY_AND_CAPACITY.json",
    ownerTask: "seq_312",
    area: "policy_and_capacity",
    purpose:
      "Freeze the later-owned policy tuple, candidate snapshot, and ranking inputs already referenced by HubCoordinationCase without backfilling them with informal placeholders.",
    consumerRefs: [
      "HubCoordinationCase.compiledPolicyBundleRef",
      "HubCoordinationCase.policyEvaluationRef",
      "HubCoordinationCase.candidateSnapshotRef",
      "HubCoordinationCase.crossSiteDecisionPlanRef",
    ],
    requiredObjects: [
      {
        objectName: "EnhancedAccessPolicy",
        status: "typed_seam_only",
        requiredFields: [
          "policyId",
          "compiledPolicyBundleRef",
          "policyTupleHash",
          "policyState",
          "effectiveAt",
        ],
      },
      {
        objectName: "NetworkCoordinationPolicyEvaluation",
        status: "typed_seam_only",
        requiredFields: [
          "policyEvaluationId",
          "hubCoordinationCaseId",
          "evaluationScope",
          "routingDisposition",
          "varianceDisposition",
          "policyTupleHash",
          "evaluatedAt",
        ],
      },
      {
        objectName: "NetworkCandidateSnapshot",
        status: "typed_seam_only",
        requiredFields: [
          "snapshotId",
          "hubCoordinationCaseId",
          "fetchedAt",
          "expiresAt",
          "policyTupleHash",
          "capacityRankProofRef",
        ],
      },
      {
        objectName: "CrossSiteDecisionPlan",
        status: "typed_seam_only",
        requiredFields: [
          "decisionPlanId",
          "hubCoordinationCaseId",
          "snapshotId",
          "rankedCandidateRefs[]",
          "policyTupleHash",
          "generatedAt",
        ],
      },
    ],
  },
  {
    seamId: "PHASE5_INTERFACE_GAP_HUB_CORE_CANDIDATE_AND_OFFER",
    fileName: "data/contracts/PHASE5_INTERFACE_GAP_HUB_CORE_CANDIDATE_AND_OFFER.json",
    ownerTask: "seq_312",
    area: "candidate_and_offer",
    purpose:
      "Freeze the alternative-offer and direct-candidate references consumed by the 311 state machine and route family without inventing surrogate status names.",
    consumerRefs: [
      "HubCoordinationCase.activeAlternativeOfferSessionRef",
      "HubCoordinationCase.activeOfferOptimisationPlanRef",
      "HubCoordinationCase.selectedCandidateRef",
      "HubCoordinationCase.latestOfferRegenerationSettlementRef",
    ],
    requiredObjects: [
      {
        objectName: "NetworkSlotCandidate",
        status: "typed_seam_only",
        requiredFields: [
          "candidateId",
          "siteId",
          "capacityUnitRef",
          "sourceTrustState",
          "requiredWindowFit",
          "robustFit",
        ],
      },
      {
        objectName: "AlternativeOfferSession",
        status: "typed_seam_only",
        requiredFields: [
          "offerSessionId",
          "hubCoordinationCaseId",
          "offerSetHash",
          "patientChoiceState",
          "truthTupleHash",
          "expiresAt",
        ],
      },
      {
        objectName: "AlternativeOfferOptimisationPlan",
        status: "typed_seam_only",
        requiredFields: [
          "optimisationPlanId",
          "hubCoordinationCaseId",
          "offerSetHash",
          "callbackFallbackEligibilityState",
          "planState",
        ],
      },
      {
        objectName: "AlternativeOfferRegenerationSettlement",
        status: "typed_seam_only",
        requiredFields: [
          "regenerationSettlementId",
          "hubCoordinationCaseId",
          "triggerClass",
          "resultState",
          "recordedAt",
        ],
      },
    ],
  },
  {
    seamId: "PHASE5_INTERFACE_GAP_HUB_CORE_COMMIT_AND_CONFIRMATION",
    fileName: "data/contracts/PHASE5_INTERFACE_GAP_HUB_CORE_COMMIT_AND_CONFIRMATION.json",
    ownerTask: "seq_313",
    area: "commit_and_confirmation",
    purpose:
      "Freeze the commit-attempt and monotone confirmation-truth seams so 313 must implement the same names and fences already referenced by 311.",
    consumerRefs: [
      "HubCoordinationCase.bookingEvidenceRef",
      "HubCoordinationCase.networkAppointmentRef",
      "HubCoordinationCase.offerToConfirmationTruthRef",
      "HubCoordinationCase.externalConfirmationState",
    ],
    requiredObjects: [
      {
        objectName: "HubCommitAttempt",
        status: "typed_seam_only",
        requiredFields: [
          "commitAttemptId",
          "hubCoordinationCaseId",
          "reservationFenceToken",
          "providerAdapterBindingHash",
          "truthTupleHash",
          "attemptState",
        ],
      },
      {
        objectName: "HubBookingEvidenceBundle",
        status: "typed_seam_only",
        requiredFields: [
          "evidenceBundleId",
          "hubCoordinationCaseId",
          "commitMode",
          "independentConfirmationState",
          "truthTupleHash",
        ],
      },
      {
        objectName: "HubAppointmentRecord",
        status: "typed_seam_only",
        requiredFields: [
          "hubAppointmentId",
          "hubCoordinationCaseId",
          "sourceBookingReference",
          "externalConfirmationState",
          "practiceAcknowledgementState",
          "truthTupleHash",
        ],
      },
      {
        objectName: "HubOfferToConfirmationTruthProjection",
        status: "typed_seam_only",
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
    ],
  },
  {
    seamId: "PHASE5_INTERFACE_GAP_HUB_CORE_FALLBACK_AND_VISIBILITY",
    fileName: "data/contracts/PHASE5_INTERFACE_GAP_HUB_CORE_FALLBACK_AND_VISIBILITY.json",
    ownerTask: "seq_313",
    area: "fallback_and_visibility",
    purpose:
      "Freeze the practice-visibility and fallback-linkage objects that already block close in 311 while leaving implementation depth to later Phase 5 tracks.",
    consumerRefs: [
      "HubCoordinationCase.activeFallbackRef",
      "HubCoordinationCase.callbackExpectationRef",
      "HubCoordinationCase.practiceAckGeneration",
      "HubCoordinationCase.practiceAckDueAt",
    ],
    requiredObjects: [
      {
        objectName: "HubFallbackRecord",
        status: "typed_seam_only",
        requiredFields: [
          "fallbackId",
          "hubCoordinationCaseId",
          "fallbackType",
          "fallbackLinkState",
          "state",
          "truthProjectionRef",
        ],
      },
      {
        objectName: "PracticeAcknowledgementRecord",
        status: "typed_seam_only",
        requiredFields: [
          "acknowledgementId",
          "hubCoordinationCaseId",
          "ackGeneration",
          "ackState",
          "truthTupleHash",
          "causalToken",
        ],
      },
      {
        objectName: "PracticeVisibilityProjection",
        status: "typed_seam_only",
        requiredFields: [
          "hubCoordinationCaseId",
          "visibilityEnvelopeVersionRef",
          "policyTupleHash",
          "ackGeneration",
          "practiceAcknowledgementState",
          "truthTupleHash",
        ],
      },
      {
        objectName: "CallbackExpectationEnvelope",
        status: "typed_seam_only",
        requiredFields: [
          "callbackExpectationEnvelopeId",
          "callbackCaseId",
          "patientVisibleState",
          "expectedByAt",
          "continuityEvidenceRef",
        ],
      },
    ],
  },
];

const STATE_DEFINITIONS: StateDefinition[] = [
  {
    stateId: "hub_requested",
    label: "Hub requested",
    familyId: "intake",
    familyLabel: "Intake and Queue",
    summary:
      "The booking branch has asked for hub coordination, but the network request has not yet been validated into a queue-admissible child lineage.",
    dominantAuthority: "NetworkBookingRequest + LineageCaseLink(parent = booking)",
    entryPredicateSummary:
      "A NetworkBookingRequest exists for the same requestLineageRef, origin booking refs are preserved, and the hub child link has not yet been admitted into active queue posture.",
    routeCue:
      "Read-only provenance in the same shell with a lineage mini-diagram and no live coordination actions.",
    allowedCommandIds: ["create_hub_request"],
    activeBlockerIds: ["lineage_child_link_missing", "policy_tuple_stale"],
    truthNotes: [
      "Operational state only; no patient or practice reassurance may be inferred.",
      "Hub entry cannot overwrite BookingCase.lineageCaseLinkRef.",
    ],
  },
  {
    stateId: "intake_validated",
    label: "Intake validated",
    familyId: "intake",
    familyLabel: "Intake and Queue",
    summary:
      "The hub handoff has passed lineage, origin-practice, and policy admission checks and is ready to join the queue.",
    dominantAuthority:
      "NetworkBookingRequest + NetworkCoordinationPolicyEvaluation(evaluationScope = candidate_snapshot)",
    entryPredicateSummary:
      "Lineage, origin booking, patient constraints, and reason-for-routing fields are complete, and the current policy evaluation admits the case to hub coordination.",
    routeCue:
      "Queue-ready card inside the hub shell with explicit origin practice and routing summary.",
    allowedCommandIds: ["claim_case"],
    activeBlockerIds: ["ownership_lease_live", "policy_tuple_stale"],
    truthNotes: [
      "Still not patient-visible booked truth.",
      "Queue posture is independent from future offer and confirmation truth.",
    ],
  },
  {
    stateId: "queued",
    label: "Queued",
    familyId: "intake",
    familyLabel: "Intake and Queue",
    summary:
      "The case is in the hub work queue but not yet actively claimed by one coordinator lease.",
    dominantAuthority: "HubCoordinationCase.ownerState + RequestLifecycleLease",
    entryPredicateSummary:
      "Queue entry time is recorded, ownership is unclaimed, and the same-shell queue family is the authoritative view of the active work item.",
    routeCue: "Queue lane row with claim, monitor, or supervised return controls.",
    allowedCommandIds: ["claim_case", "return_to_practice"],
    activeBlockerIds: ["ownership_lease_live", "policy_tuple_stale"],
    truthNotes: [
      "Queue admission does not imply candidate search has started.",
      "Escalated return remains legal directly from queue if policy or urgency requires it.",
    ],
  },
  {
    stateId: "claimed",
    label: "Claimed",
    familyId: "coordination",
    familyLabel: "Coordination",
    summary:
      "One coordinator holds the current ownership fence and may advance the case under the active acting context.",
    dominantAuthority: "CoordinationOwnership + ActingContext + RequestLifecycleLease",
    entryPredicateSummary:
      "Claim succeeded under the current acting scope, ownership fence token, and visibility contract, and the case is now writable by exactly one active lease.",
    routeCue: "Case console with live DecisionDock and coordination timers.",
    allowedCommandIds: ["transfer_ownership", "refresh_candidates", "return_to_practice"],
    activeBlockerIds: [
      "ownership_lease_live",
      "ownership_transition_open",
      "cross_org_visibility_stale",
    ],
    truthNotes: [
      "Claimed status is operational ownership only.",
      "No candidate or offer truth is implied yet.",
    ],
  },
  {
    stateId: "candidate_searching",
    label: "Candidate searching",
    familyId: "coordination",
    familyLabel: "Coordination",
    summary:
      "The coordinator is resolving or refreshing the clinically acceptable, trusted frontier under the current policy tuple.",
    dominantAuthority: "NetworkCandidateSnapshot + CrossSiteDecisionPlan",
    entryPredicateSummary:
      "One active ownership fence exists and the current policy evaluation allows candidate discovery against trusted capacity sources.",
    routeCue: "Case console with candidate refresh in progress and stale tuple guardrails visible.",
    allowedCommandIds: ["refresh_candidates", "return_to_practice"],
    activeBlockerIds: [
      "ownership_lease_live",
      "policy_tuple_stale",
      "continuity_evidence_degraded",
    ],
    truthNotes: [
      "Candidate search is not patient-choice posture.",
      "Degraded or quarantined sources may inform diagnostics only, never patient offerability.",
    ],
  },
  {
    stateId: "candidates_ready",
    label: "Candidates ready",
    familyId: "coordination",
    familyLabel: "Coordination",
    summary:
      "The current candidate snapshot and ranked plan are stable enough for coordinator review or alternative packaging.",
    dominantAuthority: "NetworkCandidateSnapshot + CrossSiteDecisionPlan + policyTupleHash",
    entryPredicateSummary:
      "A fresh candidate snapshot, rank proof, and current policy tuple all agree on the same offerable frontier for this case version.",
    routeCue: "Case console with ranked candidates and explicit choose-offer-or-return posture.",
    allowedCommandIds: ["offer_alternatives", "refresh_candidates", "return_to_practice"],
    activeBlockerIds: [
      "ownership_lease_live",
      "policy_tuple_stale",
      "continuity_evidence_degraded",
    ],
    truthNotes: [
      "Candidates-ready remains pre-selection.",
      "Any future patient-choice route must bind the same offer set hash and truth tuple.",
    ],
  },
  {
    stateId: "coordinator_selecting",
    label: "Coordinator selecting",
    familyId: "coordination",
    familyLabel: "Coordination",
    summary:
      "A coordinator is choosing a direct candidate or moving the case into a governed alternative-offer flow.",
    dominantAuthority: "HubCoordinationCase.selectedCandidateRef + current CrossSiteDecisionPlan",
    entryPredicateSummary:
      "Exactly one governing case, one active acting context, one policy tuple, and one candidate plan are current for the selection action.",
    routeCue:
      "DecisionDock prioritizes commit, offer, callback, or return while keeping the case pulse fixed.",
    allowedCommandIds: [
      "offer_alternatives",
      "commit_native_booking",
      "return_to_practice",
      "transfer_ownership",
    ],
    activeBlockerIds: ["ownership_lease_live", "policy_tuple_stale", "cross_org_visibility_stale"],
    truthNotes: [
      "Selection is not commit.",
      "Callback and return transitions are first-class legal exits, not exception-only side paths.",
    ],
  },
  {
    stateId: "alternatives_offered",
    label: "Alternatives offered",
    familyId: "choice",
    familyLabel: "Patient Choice",
    summary:
      "A real AlternativeOfferSession exists and the full patient-offerable set is packaged under one offerSetHash.",
    dominantAuthority:
      "AlternativeOfferSession + AlternativeOfferOptimisationPlan + HubOfferToConfirmationTruthProjection",
    entryPredicateSummary:
      "A governed offer pack exists, callback remains a separate fallback card, and the active truth projection blocks close by offer.",
    routeCue:
      "Alternative-offer child route inside the same hub shell with pinned provenance and no hidden top-K funnel.",
    allowedCommandIds: ["offer_alternatives", "return_to_practice"],
    activeBlockerIds: [
      "offer_truth_blocks_close",
      "continuity_evidence_degraded",
      "policy_tuple_stale",
    ],
    truthNotes: [
      "Offer recommendation is advisory only.",
      "Offer availability does not imply booking confirmation or practice visibility.",
    ],
  },
  {
    stateId: "patient_choice_pending",
    label: "Patient choice pending",
    familyId: "choice",
    familyLabel: "Patient Choice",
    summary:
      "At least one live alternative has been delivered and the case is now waiting for patient choice, decline, callback, expiry, or regeneration.",
    dominantAuthority:
      "AlternativeOfferSession.patientChoiceState + HubOfferToConfirmationTruthProjection.offerState",
    entryPredicateSummary:
      "Offer delivery or phone read-back has started, patient-visible choice state is live, and callback is still modeled outside the ranked options.",
    routeCue:
      "Same-shell offer route with live patient-choice posture and stale mutation blocking.",
    allowedCommandIds: ["offer_alternatives", "return_to_practice"],
    activeBlockerIds: [
      "offer_truth_blocks_close",
      "continuity_evidence_degraded",
      "policy_tuple_stale",
    ],
    truthNotes: [
      "Choice pending is still open-choice, not commit.",
      "Expiry, embedded drift, or subject drift must preserve provenance but disable stale accept and callback actions.",
    ],
  },
  {
    stateId: "candidate_revalidating",
    label: "Candidate revalidating",
    familyId: "commit",
    familyLabel: "Commit and Truth",
    summary:
      "The chosen candidate is being rechecked against live capacity, source version, reservation fence, and current policy outputs.",
    dominantAuthority: "HubCommitAttempt preflight + reservation fence + current policy evaluation",
    entryPredicateSummary:
      "A chosen candidate exists, current tuples still match, and the system is executing the last safe check before any native side effect occurs.",
    routeCue:
      "Case console or commit route with selected candidate pinned and fresh revalidation blockers visible.",
    allowedCommandIds: ["commit_native_booking", "offer_alternatives", "return_to_practice"],
    activeBlockerIds: [
      "selected_candidate_not_revalidated",
      "policy_tuple_stale",
      "continuity_evidence_degraded",
    ],
    truthNotes: [
      "Revalidation failure returns the case to search or choice, not quiet failure.",
      "No booked or calm manage posture is legal here.",
    ],
  },
  {
    stateId: "native_booking_pending",
    label: "Native booking pending",
    familyId: "commit",
    familyLabel: "Commit and Truth",
    summary:
      "A fenced HubCommitAttempt is in flight and may be the only object allowed to talk to the native booking surface.",
    dominantAuthority: "HubCommitAttempt + CommandActionRecord + reservation fence",
    entryPredicateSummary:
      "Revalidation passed, a commit intent was durably journaled, and any external side effect is bound to one idempotent attempt.",
    routeCue: "Commit route with authoritative pending wording and no false exclusivity claims.",
    allowedCommandIds: ["commit_native_booking", "return_to_practice"],
    activeBlockerIds: [
      "confirmation_truth_pending",
      "ownership_lease_live",
      "continuity_evidence_degraded",
    ],
    truthNotes: [
      "Pending native booking is not confirmation.",
      "Partial failure must route to reconciliation, not a second parallel attempt.",
    ],
  },
  {
    stateId: "confirmation_pending",
    label: "Confirmation pending",
    familyId: "commit",
    familyLabel: "Commit and Truth",
    summary:
      "Some booking proof exists, but the monotone confirmation gate has not yet cleared final booked truth.",
    dominantAuthority:
      "ExternalConfirmationGate + HubOfferToConfirmationTruthProjection.confirmationTruthState",
    entryPredicateSummary:
      "The active commit attempt has not yet met hard-match and confidence thresholds, so only pending confirmation posture is legal.",
    routeCue:
      "Pending confirmation strip with explicit proof status, not calm appointment reassurance.",
    allowedCommandIds: ["commit_native_booking", "return_to_practice"],
    activeBlockerIds: [
      "confirmation_truth_pending",
      "continuity_evidence_degraded",
      "ownership_lease_live",
    ],
    truthNotes: [
      "Patient confirmation may be provisional only.",
      "Practice acknowledgement cannot start from stale or disputed truth.",
    ],
  },
  {
    stateId: "booked_pending_practice_ack",
    label: "Booked pending practice acknowledgement",
    familyId: "commit",
    familyLabel: "Commit and Truth",
    summary:
      "Authoritative hub confirmation exists, but the origin practice still owes acknowledgement for the current generation.",
    dominantAuthority:
      "HubAppointmentRecord + PracticeAcknowledgementRecord + HubOfferToConfirmationTruthProjection.practiceVisibilityState",
    entryPredicateSummary:
      "The appointment is confirmed for the active tuple, patient-facing confirmation may render, and ackGeneration has been minted but not yet satisfied.",
    routeCue:
      "Case stays in active oversight with current acknowledgement debt, due time, and continuity messaging evidence.",
    allowedCommandIds: ["return_to_practice", "close_case"],
    activeBlockerIds: [
      "practice_ack_debt_open",
      "ownership_lease_live",
      "continuity_evidence_degraded",
    ],
    truthNotes: [
      "Patient confirmation and practice acknowledgement are orthogonal facets.",
      "Transport acceptance alone may not clear acknowledgement debt.",
    ],
  },
  {
    stateId: "booked",
    label: "Booked",
    familyId: "commit",
    familyLabel: "Commit and Truth",
    summary:
      "Confirmed hub appointment truth and current-generation practice acknowledgement both exist for the live truth tuple.",
    dominantAuthority: "HubOfferToConfirmationTruthProjection.confirmationTruthState = confirmed",
    entryPredicateSummary:
      "Authoritative confirmation, current tuple agreement, and current-generation practice acknowledgement all align.",
    routeCue:
      "Booked case summary with closure eligibility explicitly tied to open blocker emptiness.",
    allowedCommandIds: ["close_case"],
    activeBlockerIds: ["ownership_lease_live"],
    truthNotes: [
      "Booked still is not closed.",
      "Close remains a LifecycleCoordinator decision gated by empty blocker set.",
    ],
  },
  {
    stateId: "callback_transfer_pending",
    label: "Callback transfer pending",
    familyId: "fallback",
    familyLabel: "Fallback and Return",
    summary:
      "Callback fallback has been chosen, but the callback case or expectation envelope is not yet durably linked and patient-visible.",
    dominantAuthority:
      "HubFallbackRecord(fallbackType = callback_request) + CallbackExpectationEnvelope linkage",
    entryPredicateSummary:
      "The fallback card or callback path was selected, but callback continuity is not yet durable for the current fence and lineage.",
    routeCue: "Same-shell fallback card stays visible as provenance while linkage completes.",
    allowedCommandIds: ["return_to_practice"],
    activeBlockerIds: [
      "callback_linkage_pending",
      "continuity_evidence_degraded",
      "ownership_lease_live",
    ],
    truthNotes: [
      "The prior offer context remains visible as read-only provenance.",
      "This state exists to prevent silent callback handoff gaps.",
    ],
  },
  {
    stateId: "callback_offered",
    label: "Callback offered",
    familyId: "fallback",
    familyLabel: "Fallback and Return",
    summary:
      "Callback linkage is durable and the patient-facing CallbackExpectationEnvelope is now the governing continuity object.",
    dominantAuthority: "HubFallbackRecord + CallbackCase + CallbackExpectationEnvelope",
    entryPredicateSummary:
      "The linked callback workflow and expectation envelope exist and are current for the same request lineage and fallback fence.",
    routeCue:
      "Read-only callback provenance inside the same shell until the hub branch can legally close.",
    allowedCommandIds: ["close_case"],
    activeBlockerIds: ["ownership_lease_live"],
    truthNotes: [
      "Callback-offered is not a hidden close.",
      "Hub tooling may observe or repair callback continuity, but may not reinterpret the patient state from stale local waitlist truth.",
    ],
  },
  {
    stateId: "escalated_back",
    label: "Escalated back",
    familyId: "fallback",
    familyLabel: "Fallback and Return",
    summary:
      "The case has been returned to origin practice or duty-clinician workflow with preserved urgency carry and linked return proof.",
    dominantAuthority: "HubFallbackRecord(return_to_practice) + HubReturnToPracticeRecord",
    entryPredicateSummary:
      "No clinically acceptable trusted offer exists, or the lead-time inequality fails, and return workflow linkage has been created or is being finalized.",
    routeCue:
      "Urgent return panel stays in the same case console with rationale and linked practice task preview.",
    allowedCommandIds: ["close_case"],
    activeBlockerIds: ["return_linkage_pending", "ownership_lease_live"],
    truthNotes: [
      "Escalated-back is a durable operational branch state, not an exception note.",
      "The practice task must be materially linked before close can succeed.",
    ],
  },
  {
    stateId: "closed",
    label: "Closed",
    familyId: "completion",
    familyLabel: "Completion",
    summary:
      "The hub branch is durably finished and no remaining OpenCaseBlockers(h) keep it in live oversight.",
    dominantAuthority: "LifecycleCoordinator close decision + OpenCaseBlockers(h) = empty",
    entryPredicateSummary:
      "LifecycleCoordinator persisted the close decision, fallback linkage is durable, and all ownership, continuity, confirmation, and visibility blockers are clear.",
    routeCue: "Audit-first review posture inside the same shell family.",
    allowedCommandIds: [],
    activeBlockerIds: [],
    truthNotes: [
      "Closed is the only legal finished state for the hub branch.",
      "Closure may not be inferred from booked, callback, or return states alone.",
    ],
  },
];

const TRANSITIONS: TransitionDefinition[] = [
  {
    transitionId: "H311_001",
    from: "hub_requested",
    to: "intake_validated",
    predicateId: "P311_REQUEST_LINEAGE_BOUND",
    predicate:
      "NetworkBookingRequest exists, origin booking refs are preserved, and a child hub LineageCaseLink has been created under the origin booking link for the same request lineage.",
    controllingObject: "NetworkBookingRequest + LineageCaseLink",
    commandScope: "hub.request.create",
    truthPredicate:
      "The booking branch remains the parent lineage owner and the hub branch is admitted as a child, not a replacement.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_002",
    from: "intake_validated",
    to: "queued",
    predicateId: "P311_QUEUE_ADMISSION_CLEAR",
    predicate:
      "Current NetworkCoordinationPolicyEvaluation admits the case to hub workflow and queue entry metadata is persisted.",
    controllingObject: "NetworkCoordinationPolicyEvaluation + HubCoordinationCase.queueEnteredAt",
    commandScope: "hub.request.create",
    truthPredicate:
      "Queue posture is legal only after lineaged intake validation and policy admission both hold.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_003",
    from: "queued",
    to: "claimed",
    predicateId: "P311_LEASE_CLAIMED",
    predicate:
      "A current ownership lease, fence token, and epoch have been minted for one acting context under the current visibility contract.",
    controllingObject: "CoordinationOwnership + RequestLifecycleLease + ActingContext",
    commandScope: "hub.case.claim",
    truthPredicate: "Only one live claim may hold the writable fence for the hub case.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_004",
    from: "queued",
    to: "escalated_back",
    predicateId: "P311_QUEUE_RETURN_REQUIRED",
    predicate:
      "Policy, urgency carry, or supervisor decision requires direct return before active coordination starts, and the return workflow is being or has been linked.",
    controllingObject: "HubFallbackRecord(return_to_practice) + HubReturnToPracticeRecord",
    commandScope: "hub.case.return_to_practice",
    truthPredicate:
      "Return is lawful directly from queue when hub coordination itself is not the safe continuation.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_005",
    from: "claimed",
    to: "candidate_searching",
    predicateId: "P311_SEARCH_STARTED",
    predicate:
      "A coordinator with the current ownership fence requests or resumes candidate discovery under the current policy tuple.",
    controllingObject:
      "ActingContext + CoordinationOwnership + NetworkCoordinationPolicyEvaluation",
    commandScope: "hub.case.refresh_candidates",
    truthPredicate: "Search starts only under one current acting scope and fence pair.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_006",
    from: "claimed",
    to: "callback_transfer_pending",
    predicateId: "P311_CALLBACK_REQUIRED_AT_CLAIM",
    predicate:
      "Policy or patient preference requires callback immediately and the callback continuity objects have not yet been durably linked.",
    controllingObject: "HubFallbackRecord(callback_request) + CallbackExpectationEnvelope",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Callback transfer remains open until linkage is durable.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_007",
    from: "claimed",
    to: "escalated_back",
    predicateId: "P311_RETURN_REQUIRED_AT_CLAIM",
    predicate:
      "Direct return to practice or supervised back-escalation is required before discovery proceeds.",
    controllingObject: "HubFallbackRecord(return_to_practice)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Hub coordination may fail safely before candidate search starts.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_008",
    from: "candidate_searching",
    to: "candidates_ready",
    predicateId: "P311_FRESH_SNAPSHOT_READY",
    predicate:
      "One current candidate snapshot and cross-site decision plan agree on a trusted, policy-valid frontier.",
    controllingObject: "NetworkCandidateSnapshot + CrossSiteDecisionPlan",
    commandScope: "hub.case.refresh_candidates",
    truthPredicate: "The active policy tuple and rank proof still name the same candidates.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_009",
    from: "candidate_searching",
    to: "callback_transfer_pending",
    predicateId: "P311_CALLBACK_REQUIRED_AFTER_SEARCH",
    predicate:
      "The search result shows callback is the only safe continuation and callback linkage is not yet durable.",
    controllingObject: "HubFallbackRecord(callback_request)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate:
      "Degraded or no-slot discovery may choose callback, but only through the governed fallback branch.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_010",
    from: "candidate_searching",
    to: "escalated_back",
    predicateId: "P311_RETURN_REQUIRED_AFTER_SEARCH",
    predicate:
      "No clinically acceptable trusted frontier remains or lead-time policy fails, so return-to-practice linkage must govern.",
    controllingObject: "HubFallbackRecord(return_to_practice) + HubReturnToPracticeRecord",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "No-slot return is a governed continuation, not an implicit search failure.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_011",
    from: "candidates_ready",
    to: "coordinator_selecting",
    predicateId: "P311_COORDINATOR_SELECTING",
    predicate:
      "A current candidate frontier exists and the coordinator is choosing direct commit versus alternative packaging under one acting scope and tuple.",
    controllingObject: "CrossSiteDecisionPlan + ActingContext",
    commandScope: "hub.case.refresh_candidates",
    truthPredicate:
      "Selection remains in the case shell and may not infer permission from cached rows or frontend-only state.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_012",
    from: "candidates_ready",
    to: "alternatives_offered",
    predicateId: "P311_ALTERNATIVE_SESSION_CREATED",
    predicate:
      "A real AlternativeOfferSession plus optimisation plan has been persisted from the current clinically acceptable trusted frontier.",
    controllingObject: "AlternativeOfferSession + AlternativeOfferOptimisationPlan",
    commandScope: "hub.case.offer_alternatives",
    truthPredicate:
      "Patient choice may start only from a governed offer session, not raw top-K rows.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_013",
    from: "candidates_ready",
    to: "callback_transfer_pending",
    predicateId: "P311_CALLBACK_PENDING_FROM_READY",
    predicate:
      "Callback is the selected continuation and the linked callback objects are not yet durable.",
    controllingObject: "HubFallbackRecord(callback_request)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Fallback stays explicit and open until linked.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_014",
    from: "candidates_ready",
    to: "escalated_back",
    predicateId: "P311_RETURN_FROM_READY",
    predicate:
      "Return-to-practice becomes the safe continuation before any selection or offer packaging completes.",
    controllingObject: "HubFallbackRecord(return_to_practice)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Escalation remains a direct governed branch from candidates-ready.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_015",
    from: "alternatives_offered",
    to: "patient_choice_pending",
    predicateId: "P311_OFFER_DELIVERED",
    predicate:
      "The offer set is actually delivered or a structured phone read-back session begins for the current offerSetHash.",
    controllingObject:
      "AlternativeOfferSession.patientChoiceState + HubOfferToConfirmationTruthProjection.offerState",
    commandScope: "hub.case.offer_alternatives",
    truthPredicate: "Patient choice opens only after deliverable offer posture exists.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_016",
    from: "alternatives_offered",
    to: "coordinator_selecting",
    predicateId: "P311_DIRECT_SELECTION_RESUMED",
    predicate:
      "The offer pack is not delivered as the active branch and the coordinator resumes direct candidate selection under the same current tuple.",
    controllingObject:
      "HubCoordinationCase.selectedCandidateRef + AlternativeOfferRegenerationSettlement",
    commandScope: "hub.case.offer_alternatives",
    truthPredicate:
      "Choice packaging may return to coordinator selection without pretending delivery occurred.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_017",
    from: "alternatives_offered",
    to: "callback_transfer_pending",
    predicateId: "P311_CALLBACK_SELECTED_FROM_FALLBACK_CARD",
    predicate:
      "The separate AlternativeOfferFallbackCard was selected and callback linkage is not yet durable.",
    controllingObject: "AlternativeOfferFallbackCard + HubFallbackRecord(callback_request)",
    commandScope: "hub.case.offer_alternatives",
    truthPredicate:
      "Callback remains outside ranked slot ordinals and becomes its own branch state.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_018",
    from: "alternatives_offered",
    to: "escalated_back",
    predicateId: "P311_RETURN_AFTER_OFFER_GENERATION",
    predicate:
      "Offer generation proves no safe or lawful patient-offerable path remains, so return-to-practice takes over.",
    controllingObject: "HubFallbackRecord(return_to_practice)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate:
      "Generated offer provenance may remain visible, but active workflow changes to return.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_019",
    from: "patient_choice_pending",
    to: "coordinator_selecting",
    predicateId: "P311_PATIENT_SELECTED_ENTRY",
    predicate:
      "The patient or assisted read-back path explicitly selected one current offer entry and it still matches the active offerSetHash and truthTupleHash.",
    controllingObject: "AlternativeOfferEntry + HubOfferToConfirmationTruthProjection",
    commandScope: "hub.case.offer_alternatives",
    truthPredicate:
      "Choice acceptance must still re-enter coordinator or commit posture under the same current truth tuple.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_020",
    from: "patient_choice_pending",
    to: "callback_transfer_pending",
    predicateId: "P311_PATIENT_REQUESTED_CALLBACK",
    predicate:
      "The patient explicitly requests callback from the separate fallback card and callback linkage remains pending.",
    controllingObject: "HubFallbackRecord(callback_request) + CallbackFallbackRecord",
    commandScope: "hub.case.offer_alternatives",
    truthPredicate:
      "Choice does not silently collapse into callback; the fallback link must still be durable.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_021",
    from: "patient_choice_pending",
    to: "escalated_back",
    predicateId: "P311_CHOICE_WINDOW_EXPIRED_TO_RETURN",
    predicate:
      "Offer expiry, regenerated supply, or lead-time exhaustion makes return-to-practice the only safe continuation.",
    controllingObject:
      "AlternativeOfferRegenerationSettlement + HubFallbackRecord(return_to_practice)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate:
      "Expired or drifted offer sets preserve provenance only and cannot stay quietly actionable.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_022",
    from: "coordinator_selecting",
    to: "candidate_revalidating",
    predicateId: "P311_SELECTED_CANDIDATE_PRECHECK",
    predicate:
      "Exactly one governing case, selected candidate, acting scope, and policy tuple are current, so revalidation may begin.",
    controllingObject: "HubCoordinationCase.selectedCandidateRef + ActingContext + policyTupleHash",
    commandScope: "hub.case.commit_native_booking",
    truthPredicate:
      "Commit may start only from a persisted selection, never from UI-local highlight state.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_023",
    from: "coordinator_selecting",
    to: "callback_transfer_pending",
    predicateId: "P311_CALLBACK_CHOSEN_BY_COORDINATOR",
    predicate: "The coordinator intentionally chooses callback and linkage is not yet durable.",
    controllingObject: "HubFallbackRecord(callback_request)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Coordinator choice still routes through governed callback continuity.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_024",
    from: "coordinator_selecting",
    to: "escalated_back",
    predicateId: "P311_RETURN_CHOSEN_BY_COORDINATOR",
    predicate:
      "The coordinator or supervisor chooses return-to-practice and the return workflow is being linked.",
    controllingObject: "HubFallbackRecord(return_to_practice)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Return remains a first-class controlled branch from coordinator selection.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_025",
    from: "candidate_revalidating",
    to: "native_booking_pending",
    predicateId: "P311_REVALIDATION_PASSED",
    predicate:
      "Selected candidate, source version, policy tuple, and reservation fence still align, and commit intent has been durably journaled.",
    controllingObject: "HubCommitAttempt + reservation fence + current truthTupleHash",
    commandScope: "hub.case.commit_native_booking",
    truthPredicate:
      "Native booking begins only after successful revalidation against the current tuple.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_026",
    from: "candidate_revalidating",
    to: "alternatives_offered",
    predicateId: "P311_REVALIDATION_FALLBACK_TO_OFFER",
    predicate:
      "The direct candidate became stale or unavailable, but a fresh governed alternative offer set remains clinically acceptable.",
    controllingObject: "AlternativeOfferSession + AlternativeOfferRegenerationSettlement",
    commandScope: "hub.case.offer_alternatives",
    truthPredicate:
      "Direct commit failure may reopen governed open choice rather than loose local search.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_027",
    from: "candidate_revalidating",
    to: "callback_transfer_pending",
    predicateId: "P311_REVALIDATION_FALLBACK_TO_CALLBACK",
    predicate:
      "The candidate can no longer be booked safely and callback continuity is now the only lawful continuation, pending durable linkage.",
    controllingObject: "HubFallbackRecord(callback_request)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate:
      "Revalidation failure may move to callback only through the governed fallback branch.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_028",
    from: "candidate_revalidating",
    to: "escalated_back",
    predicateId: "P311_REVALIDATION_FALLBACK_TO_RETURN",
    predicate:
      "The candidate is stale, unavailable, policy-invalid, or trust-invalid and no governed offer or callback path remains sufficient.",
    controllingObject: "HubFallbackRecord(return_to_practice)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Unsafe revalidation outcomes must route to governed return, not silent retry.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_029",
    from: "native_booking_pending",
    to: "confirmation_pending",
    predicateId: "P311_PENDING_CONFIRMATION_ONLY",
    predicate:
      "The native or manual path produced provisional proof, but the confirmation gate has not yet passed hard-match and confidence thresholds.",
    controllingObject: "HubCommitAttempt + ExternalConfirmationGate",
    commandScope: "hub.case.commit_native_booking",
    truthPredicate:
      "Pending confirmation is the only legal state when booked truth is not yet authoritative.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_030",
    from: "native_booking_pending",
    to: "booked_pending_practice_ack",
    predicateId: "P311_CONFIRMED_PENDING_ACK",
    predicate:
      "Authoritative hub confirmation exists for the active attempt and current tuple, and the new ackGeneration has been minted for origin-practice visibility.",
    controllingObject:
      "HubAppointmentRecord + PracticeAcknowledgementRecord + HubOfferToConfirmationTruthProjection",
    commandScope: "hub.case.commit_native_booking",
    truthPredicate:
      "Booked truth may advance before practice acknowledgement only into the explicit pending-ack state.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_031",
    from: "native_booking_pending",
    to: "callback_transfer_pending",
    predicateId: "P311_COMMIT_MOVED_TO_CALLBACK_RECOVERY",
    predicate:
      "Commit outcome or external uncertainty forces callback continuity and the callback linkage is not yet durable.",
    controllingObject: "HubFallbackRecord(callback_request) + HubCommitSettlement",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Commit failure recovery remains same-shell and governed.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_032",
    from: "native_booking_pending",
    to: "escalated_back",
    predicateId: "P311_COMMIT_RETURN_REQUIRED",
    predicate:
      "Commit outcome, policy drift, or unresolved supplier truth requires explicit return-to-practice continuity.",
    controllingObject: "HubFallbackRecord(return_to_practice) + HubCommitSettlement",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Commit-side recovery may not bypass governed return linkage.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_033",
    from: "confirmation_pending",
    to: "booked_pending_practice_ack",
    predicateId: "P311_CONFIRMATION_GATE_CLEARED",
    predicate:
      "The active confirmation gate now passes all hard matches for the current tuple and the appointment plus practice continuity message are durably committed.",
    controllingObject:
      "ExternalConfirmationGate + HubAppointmentRecord + PracticeContinuityMessage",
    commandScope: "hub.case.commit_native_booking",
    truthPredicate:
      "Pending confirmation becomes booked-pending-ack only after authoritative confirmation and new practice visibility generation exist together.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_034",
    from: "confirmation_pending",
    to: "callback_transfer_pending",
    predicateId: "P311_CONFIRMATION_PENDING_TO_CALLBACK",
    predicate:
      "Confirmation ambiguity or expiry forces callback continuity and callback linkage is still pending.",
    controllingObject: "HubFallbackRecord(callback_request) + HubCommitSettlement",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Callback remains explicit recovery from pending confirmation.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_035",
    from: "confirmation_pending",
    to: "escalated_back",
    predicateId: "P311_CONFIRMATION_PENDING_TO_RETURN",
    predicate:
      "Confirmation dispute or expiry requires return-to-practice continuity and the return branch is being or has been linked.",
    controllingObject: "HubFallbackRecord(return_to_practice)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate:
      "Pending confirmation cannot silently die; it returns through a governed branch.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_036",
    from: "booked_pending_practice_ack",
    to: "booked",
    predicateId: "P311_ACK_GENERATION_SATISFIED",
    predicate:
      "Current-generation acknowledgement evidence or audited no-ack-required policy exception satisfies the live ackGeneration and truth tuple.",
    controllingObject: "PracticeAcknowledgementRecord + PracticeVisibilityProjection",
    commandScope: "hub.case.commit_native_booking",
    truthPredicate: "Only current-generation evidence may clear practice acknowledgement debt.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_037",
    from: "booked_pending_practice_ack",
    to: "escalated_back",
    predicateId: "P311_ACK_FAILURE_ESCALATES",
    predicate:
      "Practice visibility or continuity risk requires governed return or supervised escalation before booked closure can proceed.",
    controllingObject: "PracticeAcknowledgementRecord + HubFallbackRecord(return_to_practice)",
    commandScope: "hub.case.return_to_practice",
    truthPredicate:
      "Unmet acknowledgement duty may reopen escalation instead of falsely completing the case.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_038",
    from: "booked",
    to: "closed",
    predicateId: "P311_OPEN_BLOCKERS_EMPTY",
    predicate:
      "OpenCaseBlockers(h) is empty and LifecycleCoordinator persisted the governing close decision.",
    controllingObject: "LifecycleCoordinator + HubOfferToConfirmationTruthProjection.closureState",
    commandScope: "hub.case.close",
    truthPredicate:
      "Booked truth alone never closes the case; close needs empty blockers and coordinator decision proof.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_039",
    from: "callback_transfer_pending",
    to: "callback_offered",
    predicateId: "P311_CALLBACK_LINKED",
    predicate:
      "The active HubFallbackRecord is now linked to the current CallbackCase and a fresh CallbackExpectationEnvelope for the same fallback fence.",
    controllingObject: "HubFallbackRecord + CallbackCase + CallbackExpectationEnvelope",
    commandScope: "hub.case.return_to_practice",
    truthPredicate: "Callback-offered is legal only after durable callback linkage.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_040",
    from: "callback_transfer_pending",
    to: "escalated_back",
    predicateId: "P311_CALLBACK_LINKAGE_ABORTED_TO_RETURN",
    predicate:
      "Callback is no longer sufficient or lawful and return-to-practice becomes the governing continuation.",
    controllingObject: "HubFallbackRecord(return_to_practice) + HubReturnToPracticeRecord",
    commandScope: "hub.case.return_to_practice",
    truthPredicate:
      "Callback-pending may still switch to governed return without hidden loss of provenance.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_041",
    from: "callback_offered",
    to: "closed",
    predicateId: "P311_CALLBACK_CONTINUATION_DURABLE",
    predicate:
      "Callback continuity is durable, fallback state is transferred or completed, and no other open blocker remains.",
    controllingObject: "HubFallbackRecord.state + LifecycleCoordinator close decision",
    commandScope: "hub.case.close",
    truthPredicate: "Hub close waits for durable callback linkage, not just callback selection.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
  {
    transitionId: "H311_042",
    from: "escalated_back",
    to: "closed",
    predicateId: "P311_RETURN_CONTINUATION_DURABLE",
    predicate:
      "Return-to-practice workflow is durably linked on the request lineage, fallback state is transferred or completed, and open blockers are empty.",
    controllingObject: "HubReturnToPracticeRecord + LifecycleCoordinator close decision",
    commandScope: "hub.case.close",
    truthPredicate:
      "Escalated-back remains open until the linked return workflow is real and current.",
    ownerTask: SHORT_TASK_ID,
    sourceRef: SOURCE_REFS.phase5Hub,
  },
];

const EVENTS = [
  "hub.request.created",
  "hub.case.created",
  "hub.case.claimed",
  "hub.case.released",
  "hub.case.transfer_started",
  "hub.case.transfer_accepted",
  "hub.capacity.snapshot.created",
  "hub.candidates.rank_completed",
  "hub.offer.created",
  "hub.offer.accepted",
  "hub.booking.native_started",
  "hub.booking.confirmation_pending",
  "hub.booking.externally_confirmed",
  "hub.practice.notified",
  "hub.practice.acknowledged",
  "hub.patient.notified",
  "hub.callback.transfer_pending",
  "hub.callback.offered",
  "hub.escalated.back",
  "hub.queue.overload_critical",
  "hub.case.closed",
] as const;

function buildNetworkBookingRequestSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/311_network_booking_request.schema.json",
    title: "311 NetworkBookingRequest",
    description:
      "Executable booking-to-hub handoff contract. This preserves booking lineage and origin-practice identity while moving responsibility into the Phase 5 hub branch.",
    type: "object",
    additionalProperties: false,
    required: [
      "networkBookingRequestId",
      "episodeRef",
      "requestLineageRef",
      "originLineageCaseLinkRef",
      "originBookingCaseId",
      "originRequestId",
      "originPracticeOds",
      "patientRef",
      "priorityBand",
      "clinicalTimeframe",
      "modalityPreference",
      "clinicianType",
      "continuityPreference",
      "accessNeeds",
      "travelConstraints",
      "reasonForHubRouting",
      "requestedAt",
    ],
    properties: {
      networkBookingRequestId: refField("Stable NetworkBookingRequest identifier.", false),
      episodeRef: refField(
        "Episode reference preserved from the originating booking lineage.",
        false,
      ),
      requestLineageRef: refField(
        "Canonical RequestLineage identifier shared with the origin booking branch.",
        false,
      ),
      originLineageCaseLinkRef: refField(
        "The current booking LineageCaseLink that remains the parent of the new hub branch.",
        false,
      ),
      originBookingCaseId: refField(
        "Current BookingCase identifier for the branch that routed to hub.",
        false,
      ),
      originRequestId: refField(
        "Canonical request identifier that the hub branch continues.",
        false,
      ),
      originPracticeOds: {
        type: "string",
        minLength: 1,
        description: "Origin-practice ODS code or equivalent organisation identifier.",
      },
      patientRef: refField("Bound patient identifier or canonical subject ref.", false),
      priorityBand: enumField(
        ["routine", "priority", "urgent", "same_day", "safety_escalation"],
        "Operational priority band carried into the hub queue.",
      ),
      clinicalTimeframe: {
        type: "object",
        additionalProperties: false,
        required: ["windowClass", "dueAt", "urgencyCarryFloor"],
        properties: {
          windowClass: enumField(
            ["within_required_window", "approved_variance_allowed", "outside_window_with_warning"],
            "Clinical or contractual time-window class for hub routing.",
          ),
          dueAt: isoDateTimeField("Latest clinically safe completion point for hub coordination."),
          latestSafeOfferAt: isoDateTimeField(
            "Optional latest time at which an open choice offer is still lawful.",
            true,
          ),
          urgencyCarryFloor: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description:
              "Normalized urgency carry floor preserved if the case must return to practice.",
          },
        },
      },
      modalityPreference: {
        type: "object",
        additionalProperties: false,
        required: ["preferredModes", "allowsInPerson", "allowsRemote"],
        properties: {
          preferredModes: {
            type: "array",
            items: enumField(
              ["in_person", "telephone", "video", "asynchronous"],
              "Preferred modality.",
            ),
            minItems: 1,
            uniqueItems: true,
            description: "Ordered allowed modality set for hub coordination.",
          },
          allowsInPerson: {
            type: "boolean",
            description: "Whether in-person care remains lawful for this request.",
          },
          allowsRemote: {
            type: "boolean",
            description: "Whether remote modalities remain lawful for this request.",
          },
        },
      },
      clinicianType: {
        type: "string",
        minLength: 1,
        description:
          "Clinician or clinician-type requirement carried from the governing triage or booking decision.",
      },
      continuityPreference: {
        type: "object",
        additionalProperties: false,
        required: ["continuityMode"],
        properties: {
          continuityMode: enumField(
            [
              "same_clinician_preferred",
              "same_site_preferred",
              "network_any",
              "first_safe_available",
            ],
            "Continuity preference for network coordination.",
          ),
          preferredSiteRefs: {
            type: "array",
            items: { type: "string", minLength: 1 },
            uniqueItems: true,
            description: "Optional ordered list of preferred sites or organisations.",
          },
        },
      },
      accessNeeds: {
        type: "object",
        additionalProperties: false,
        required: ["needsSummary"],
        properties: {
          needsSummary: {
            type: "string",
            minLength: 1,
            description: "Short minimum-necessary summary of access or communication needs.",
          },
          accessibilityRequirementRefs: {
            type: "array",
            items: { type: "string", minLength: 1 },
            uniqueItems: true,
            description: "Typed accessibility or accommodation references.",
          },
          communicationSupportRefs: {
            type: "array",
            items: { type: "string", minLength: 1 },
            uniqueItems: true,
            description: "Typed communication-support references.",
          },
        },
      },
      travelConstraints: {
        type: "object",
        additionalProperties: false,
        required: ["travelMode"],
        properties: {
          travelMode: enumField(
            ["any", "public_transport", "car_required", "walking_only", "assisted_travel"],
            "Declared travel mode constraint for network offers.",
          ),
          maxTravelMinutes: {
            type: ["integer", "null"],
            minimum: 0,
            description: "Optional travel-time ceiling for candidate generation.",
          },
          locationConstraintRefs: {
            type: "array",
            items: { type: "string", minLength: 1 },
            uniqueItems: true,
            description: "Typed geographic or site-eligibility constraints.",
          },
        },
      },
      reasonForHubRouting: enumField(
        [
          "policy_required",
          "no_local_capacity",
          "waitlist_breach_risk",
          "patient_requested_network",
          "supervisor_return",
          "callback_reentry",
        ],
        "Durable reason why the booking branch routed to the hub.",
      ),
      requestedAt: isoDateTimeField("Timestamp at which the network handoff was created."),
    },
  };
}

function buildHubCoordinationCaseSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/311_hub_coordination_case.schema.json",
    title: "311 HubCoordinationCase",
    description:
      "Durable Phase 5 hub aggregate. Operational state remains distinct from patient assurance, practice visibility, and closeability.",
    type: "object",
    additionalProperties: false,
    required: [
      "hubCoordinationCaseId",
      "episodeRef",
      "requestLineageRef",
      "lineageCaseLinkRef",
      "parentLineageCaseLinkRef",
      "networkBookingRequestId",
      "servingPcnId",
      "status",
      "ownerState",
      "claimedBy",
      "actingOrg",
      "ownershipLeaseRef",
      "activeOwnershipTransitionRef",
      "ownershipFenceToken",
      "ownershipEpoch",
      "compiledPolicyBundleRef",
      "enhancedAccessPolicyRef",
      "policyEvaluationRef",
      "policyTupleHash",
      "candidateSnapshotRef",
      "crossSiteDecisionPlanRef",
      "activeAlternativeOfferSessionRef",
      "activeOfferOptimisationPlanRef",
      "latestOfferRegenerationSettlementRef",
      "selectedCandidateRef",
      "bookingEvidenceRef",
      "networkAppointmentRef",
      "offerToConfirmationTruthRef",
      "activeFallbackRef",
      "callbackExpectationRef",
      "activeIdentityRepairCaseRef",
      "identityRepairBranchDispositionRef",
      "identityRepairReleaseSettlementRef",
      "externalConfirmationState",
      "practiceAckGeneration",
      "practiceAckDueAt",
      "openCaseBlockerRefs",
      "lastProgressAt",
      "slaTargetAt",
      "queueEnteredAt",
      "lastMaterialReturnAt",
      "expectedCoordinationMinutes",
      "urgencyCarry",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      hubCoordinationCaseId: refField("Stable HubCoordinationCase identifier.", false),
      episodeRef: refField("Episode reference preserved from the originating branch.", false),
      requestLineageRef: refField(
        "Canonical RequestLineage identifier shared across booking and hub branches.",
        false,
      ),
      lineageCaseLinkRef: refField("Current hub LineageCaseLink(caseFamily = hub).", false),
      parentLineageCaseLinkRef: refField(
        "Parent booking LineageCaseLink from which the hub child was opened.",
        false,
      ),
      networkBookingRequestId: refField("Owning NetworkBookingRequest identifier.", false),
      servingPcnId: refField(
        "PCN or equivalent network coordination domain responsible for the case.",
        false,
      ),
      status: enumField(
        ALL_STATUSES,
        "Durable operational state vocabulary for HubCoordinationCase.",
      ),
      ownerState: enumField(
        [
          "unclaimed",
          "claimed_active",
          "release_pending",
          "transfer_pending",
          "supervisor_override",
          "stale_owner_recovery",
        ],
        "Ownership posture for the case. This is distinct from HubCoordinationCase.status.",
      ),
      claimedBy: refField("Current coordinating staff user, if one owns the active lease.", true),
      actingOrg: {
        type: ["object", "null"],
        description: "Organisation or site currently acting under the live ownership fence.",
        additionalProperties: false,
        required: ["organisationRef", "organisationKind"],
        properties: {
          organisationRef: refField("Acting organisation or site ref.", false),
          organisationKind: enumField(
            ["practice", "hub", "pcn", "site", "platform"],
            "Kind of acting organisation.",
          ),
          siteRef: refField(
            "Optional site ref when the acting organisation resolves to a site.",
            true,
          ),
        },
      },
      ownershipLeaseRef: refField(
        "Live ownership lease ref derived from RequestLifecycleLease.",
        true,
      ),
      activeOwnershipTransitionRef: refField(
        "Current HubOwnershipTransition ref, if a claim or transfer is still open.",
        true,
      ),
      ownershipFenceToken: refField(
        "Current ownership fence token required by all writable commands.",
        true,
      ),
      ownershipEpoch: {
        type: "integer",
        minimum: 0,
        description:
          "Monotonic ownership epoch that changes on every successful claim or takeover.",
      },
      compiledPolicyBundleRef: refField("Compiled policy bundle ref frozen by seq_312 seam.", true),
      enhancedAccessPolicyRef: refField("EnhancedAccessPolicy ref frozen by seq_312 seam.", true),
      policyEvaluationRef: refField("Current NetworkCoordinationPolicyEvaluation ref.", true),
      policyTupleHash: refField(
        "Stable hash naming the current policy tuple and evaluation inputs.",
        true,
      ),
      candidateSnapshotRef: refField("Current NetworkCandidateSnapshot ref.", true),
      crossSiteDecisionPlanRef: refField("Current CrossSiteDecisionPlan ref.", true),
      activeAlternativeOfferSessionRef: refField("Current AlternativeOfferSession ref.", true),
      activeOfferOptimisationPlanRef: refField(
        "Current AlternativeOfferOptimisationPlan ref.",
        true,
      ),
      latestOfferRegenerationSettlementRef: refField(
        "Most recent AlternativeOfferRegenerationSettlement ref.",
        true,
      ),
      selectedCandidateRef: refField("Currently selected NetworkSlotCandidate ref.", true),
      bookingEvidenceRef: refField("Current HubBookingEvidenceBundle ref.", true),
      networkAppointmentRef: refField("Current HubAppointmentRecord ref.", true),
      offerToConfirmationTruthRef: refField(
        "Current HubOfferToConfirmationTruthProjection ref.",
        true,
      ),
      activeFallbackRef: refField("Current HubFallbackRecord ref.", true),
      callbackExpectationRef: refField("Current CallbackExpectationEnvelope ref.", true),
      activeIdentityRepairCaseRef: refField(
        "Current identity repair case ref, if the hub branch is quarantined or compensating.",
        true,
      ),
      identityRepairBranchDispositionRef: refField(
        "Current identity repair disposition for the hub lineage branch.",
        true,
      ),
      identityRepairReleaseSettlementRef: refField(
        "Current identity repair release settlement ref.",
        true,
      ),
      externalConfirmationState: enumField(
        ["not_started", "pending", "confirmed", "disputed", "expired", "recovery_required"],
        "Supplier or imported confirmation posture for the active commit tuple.",
      ),
      practiceAckGeneration: {
        type: "integer",
        minimum: 0,
        description:
          "Current origin-practice acknowledgement generation that must be satisfied before close is legal.",
      },
      practiceAckDueAt: isoDateTimeField(
        "Current due time for origin-practice acknowledgement.",
        true,
      ),
      openCaseBlockerRefs: {
        type: "array",
        items: { type: "string", minLength: 1 },
        uniqueItems: true,
        description:
          "Current open blocker refs. This must represent the union of live ownership lease, ownership transition, truth blockers, fallback linkage blockers, supplier drift, continuity evidence, and identity repair blockers.",
      },
      lastProgressAt: isoDateTimeField(
        "Last timestamp at which meaningful hub progress occurred.",
        true,
      ),
      slaTargetAt: isoDateTimeField(
        "Current SLA target for hub coordination or acknowledgement handling.",
        true,
      ),
      queueEnteredAt: isoDateTimeField("Timestamp at which the case joined the queue.", true),
      lastMaterialReturnAt: isoDateTimeField(
        "Timestamp at which the case last materially returned to practice or supervisor control.",
        true,
      ),
      expectedCoordinationMinutes: {
        type: "integer",
        minimum: 0,
        description: "Estimated coordination effort in minutes for queue and workload planning.",
      },
      urgencyCarry: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Normalized urgency carry passed into return-to-practice or fallback logic.",
      },
      createdAt: isoDateTimeField("Case creation time."),
      updatedAt: isoDateTimeField("Last case update time."),
    },
  };
}

function buildStaffIdentityContextSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/311_staff_identity_context.schema.json",
    title: "311 StaffIdentityContext",
    description:
      "Authenticated staff identity context. 311 freezes CIS2 as the governing auth provider and keeps organisation switching separate from raw role names.",
    type: "object",
    additionalProperties: false,
    required: [
      "staffIdentityContextId",
      "staffUserId",
      "authProvider",
      "homeOrganisation",
      "affiliatedOrganisationRefs",
      "tenantGrantRefs",
      "activeOrganisation",
      "rbacClaims",
      "nationalRbacRef",
      "localRoleRefs",
      "sessionAssurance",
      "identityState",
      "authenticatedAt",
      "expiresAt",
    ],
    properties: {
      staffIdentityContextId: refField("Stable StaffIdentityContext identifier.", false),
      staffUserId: refField("Canonical staff user ref.", false),
      authProvider: {
        type: "string",
        const: "cis2",
        description: "311 freezes CIS2 as the authentication provider for hub staff flows.",
      },
      homeOrganisation: refField("Home organisation or employer record.", false),
      affiliatedOrganisationRefs: {
        type: "array",
        items: { type: "string", minLength: 1 },
        uniqueItems: true,
        description: "Other organisations or sites the user may be permitted to act within.",
      },
      tenantGrantRefs: {
        type: "array",
        items: { type: "string", minLength: 1 },
        uniqueItems: true,
        description: "Tenant-scope grants attached to the authenticated staff identity.",
      },
      activeOrganisation: refField(
        "Organisation or site currently active for shell rendering and acting-context derivation.",
        false,
      ),
      rbacClaims: {
        type: "array",
        items: { type: "string", minLength: 1 },
        uniqueItems: true,
        description:
          "Resolved RBAC claims. These are necessary but never sufficient without acting context and visibility contracts.",
      },
      nationalRbacRef: refField("National RBAC profile or entitlement ref.", true),
      localRoleRefs: {
        type: "array",
        items: { type: "string", minLength: 1 },
        uniqueItems: true,
        description:
          "Local role refs bound to the staff identity in the active or affiliated organisations.",
      },
      sessionAssurance: enumField(
        ["aal2", "aal3"],
        "Assurance level for the authenticated staff session.",
      ),
      identityState: enumField(
        ["authenticated", "reauth_required", "revoked"],
        "Current trust state of the staff identity session.",
      ),
      authenticatedAt: isoDateTimeField("Authentication time."),
      expiresAt: isoDateTimeField("Session expiry time."),
    },
  };
}

function buildActingContextSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/311_acting_context.schema.json",
    title: "311 ActingContext",
    description:
      "Current acting scope for hub commands and projections. This is the multi-factor command envelope that closes the 'cross-org access is a role check' gap.",
    type: "object",
    additionalProperties: false,
    required: [
      "actingContextId",
      "staffIdentityContextRef",
      "staffUserId",
      "homePracticeOds",
      "activeOrganisationRef",
      "activePcnId",
      "activeHubSiteId",
      "tenantScopeMode",
      "tenantScopeRefs",
      "purposeOfUse",
      "actingRoleRef",
      "audienceTierRef",
      "visibilityCoverageRef",
      "minimumNecessaryContractRef",
      "elevationState",
      "breakGlassState",
      "contextState",
      "scopeTupleHash",
      "switchGeneration",
      "issuedAt",
      "expiresAt",
    ],
    properties: {
      actingContextId: refField("Stable ActingContext identifier.", false),
      staffIdentityContextRef: refField("Owning StaffIdentityContext ref.", false),
      staffUserId: refField("Staff user ref repeated for command and audit convenience.", false),
      homePracticeOds: {
        type: "string",
        minLength: 1,
        description: "Home-practice ODS code or equivalent organisation code for the acting user.",
      },
      activeOrganisationRef: refField("Current acting organisation or site ref.", false),
      activePcnId: refField(
        "Current acting PCN ref when the case is coordinated at PCN level.",
        true,
      ),
      activeHubSiteId: refField(
        "Current acting hub site ref when coordination is site-bound.",
        true,
      ),
      tenantScopeMode: enumField(
        ["single_tenant", "organisation_group", "multi_tenant", "platform"],
        "Breadth of tenant scope currently granted to the acting context.",
      ),
      tenantScopeRefs: {
        type: "array",
        items: { type: "string", minLength: 1 },
        uniqueItems: true,
        description: "Tenant or organisation refs that define the active scope.",
      },
      purposeOfUse: enumField(
        [
          "direct_care_network_coordination",
          "direct_care_site_delivery",
          "practice_continuity",
          "supervisor_recovery",
          "break_glass_patient_safety",
        ],
        "Purpose of use for this acting scope.",
      ),
      actingRoleRef: refField(
        "Resolved acting role ref for this context. Role names alone never authorize access.",
        false,
      ),
      audienceTierRef: enumField(
        AUDIENCES.map((entry) => entry.tierId),
        "Visibility audience tier for projections and commands.",
      ),
      visibilityCoverageRef: refField(
        "Coverage row set or compiled visibility coverage ref for the acting scope.",
        false,
      ),
      minimumNecessaryContractRef: refField(
        "MinimumNecessaryContract applied to this context.",
        false,
      ),
      elevationState: enumField(
        ["none", "requested", "active", "expiring", "revoked"],
        "Elevation or supervisor override posture.",
      ),
      breakGlassState: enumField(
        ["none", "requested", "active", "revoked"],
        "Break-glass posture for the acting context.",
      ),
      contextState: enumField(
        ["current", "stale", "blocked", "superseded"],
        "Current validity state of the acting context.",
      ),
      scopeTupleHash: refField(
        "Hash of the exact acting-scope tuple used for command and projection checks.",
        false,
      ),
      switchGeneration: {
        type: "integer",
        minimum: 0,
        description:
          "Monotonic generation that increments when organisation or scope switching occurs.",
      },
      issuedAt: isoDateTimeField("Acting-context issue time."),
      expiresAt: isoDateTimeField("Acting-context expiry time."),
    },
  };
}

function buildCrossOrgVisibilityEnvelopeSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/311_cross_org_visibility_envelope.schema.json",
    title: "311 CrossOrganisationVisibilityEnvelope",
    description:
      "Materialized minimum-necessary visibility contract for cross-organisation hub work.",
    type: "object",
    additionalProperties: false,
    required: [
      "crossOrganisationVisibilityEnvelopeId",
      "actingContextRef",
      "actingScopeTupleRef",
      "sourceOrganisationRef",
      "targetOrganisationRef",
      "audienceTierRef",
      "purposeOfUseRef",
      "minimumNecessaryContractRef",
      "requiredCoverageRowRefs",
      "visibleFieldRefs",
      "placeholderContractRef",
      "envelopeState",
      "generatedAt",
    ],
    properties: {
      crossOrganisationVisibilityEnvelopeId: refField(
        "Stable visibility envelope identifier.",
        false,
      ),
      actingContextRef: refField("Owning ActingContext ref.", false),
      actingScopeTupleRef: refField(
        "Scope tuple hash or ref from the acting context used to mint this envelope.",
        false,
      ),
      sourceOrganisationRef: refField(
        "Organisation that owns the underlying record or continuity duty.",
        false,
      ),
      targetOrganisationRef: refField(
        "Organisation currently receiving the projection or write permission.",
        false,
      ),
      audienceTierRef: enumField(
        AUDIENCES.map((entry) => entry.tierId),
        "Audience tier bound to the envelope.",
      ),
      purposeOfUseRef: refField("Purpose-of-use ref carried into the envelope.", false),
      minimumNecessaryContractRef: refField(
        "MinimumNecessaryContract applied to the envelope.",
        false,
      ),
      requiredCoverageRowRefs: {
        type: "array",
        items: { type: "string", minLength: 1 },
        minItems: 1,
        uniqueItems: true,
        description: "Visibility matrix rows this envelope must satisfy.",
      },
      visibleFieldRefs: {
        type: "array",
        items: { type: "string", minLength: 1 },
        minItems: 1,
        uniqueItems: true,
        description: "Exact fields allowed to render under this envelope.",
      },
      placeholderContractRef: refField(
        "Placeholder or out-of-scope contract used where richer data is intentionally withheld.",
        false,
      ),
      envelopeState: enumField(
        ["current", "stale", "blocked", "superseded"],
        "Current validity state of the envelope.",
      ),
      generatedAt: isoDateTimeField("Envelope generation time."),
    },
  };
}

function buildStateMachine() {
  return {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    visualMode: VISUAL_MODE,
    aggregate: "HubCoordinationCase",
    closureAuthority: "LifecycleCoordinator",
    stateFamilies: STATE_FAMILIES,
    states: STATE_DEFINITIONS,
    truthAxes: [
      {
        axisId: "hub_operational_state",
        label: "Hub workflow state",
        governingField: "HubCoordinationCase.status",
        notes:
          "Operational state only. This must not be used as a shortcut for patient reassurance or practice visibility.",
      },
      {
        axisId: "offer_confirmation_truth",
        label: "Offer to confirmation truth",
        governingField: "HubOfferToConfirmationTruthProjection",
        notes:
          "Patient-visible offer, provisional receipt, booked truth, practice visibility, and closeability all derive here.",
      },
      {
        axisId: "ownership_fence",
        label: "Ownership lease and fence",
        governingField: "CoordinationOwnership + RequestLifecycleLease",
        notes: "All writable commands require the current fence token and epoch.",
      },
      {
        axisId: "acting_scope_and_visibility",
        label: "Acting scope and visibility",
        governingField: "ActingContext + CrossOrganisationVisibilityEnvelope",
        notes: "Cross-org access is a first-class command envelope, not a UI-local role check.",
      },
    ],
    branchStates: [...BRANCH_STATUSES],
    transitions: TRANSITIONS,
    openCaseBlockersRule: {
      definition:
        "OpenCaseBlockers(h) is the set of active refs among live ownership lease, live HubOwnershipTransition, every blockingRef named by current HubOfferToConfirmationTruthProjection, unresolved supplier drift, unresolved callback expectation publication, continuity-evidence blocks on writable routes, and any active identity repair disposition.",
      blockerCatalogRefs: BLOCKERS.map((entry) => entry.blockerId),
    },
    typedSeamRefs: GAP_SEAMS.map((entry) => repoPath(entry.fileName)),
    sourceRefs: Object.values(SOURCE_REFS),
  };
}

function buildVisibilityTierContract() {
  return {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    identityContracts: [
      "StaffIdentityContext",
      "ActingContext",
      "CrossOrganisationVisibilityEnvelope",
    ],
    audienceTiers: AUDIENCES,
    commandEnvelopeRequirements: [
      "Every writable command carries ActingContext.",
      "Every writable command carries ownershipFenceToken and ownershipEpoch.",
      "Every writable command carries the active minimum-necessary visibility contract.",
      "Cross-organisation commands also carry CrossOrganisationVisibilityEnvelope.",
      "Every mutation appends audit context with actor, acting organisation, purpose of use, break-glass state, and drift rejection reason when denied.",
    ],
    driftResponses: [
      "Organisation switch revokes writable posture until the same case is re-read under the new acting context.",
      "Stale visibility envelope demotes the shell to read-only or recovery posture in place.",
      "Purpose-of-use drift may not be inferred from frontend navigation or cached role names.",
    ],
  };
}

function buildRouteFamilyRegistry() {
  return {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    visualMode: VISUAL_MODE,
    shellType: "hub",
    rootRouteId: "hub_case_detail",
    routeFamilies: ROUTES.map((route) => ({
      routeId: route.routeId,
      path: route.path,
      sameShell: route.sameShell,
      transitionType: route.transitionType,
      historyPolicy: route.historyPolicy,
      projectionRef: route.projectionRef,
      objectAnchor: route.objectAnchor,
      dominantAction: route.dominantAction,
      supportedStates: route.supportedStates,
      commandRefs: route.commandIds,
      audienceTierRefs: route.audienceTierRefs,
      ownershipClaim: route.ownershipClaim,
      selectedAnchorPolicy: route.selectedAnchorPolicy,
      publicationControls: route.publicationControls,
      returnContractRequired: true,
      sourceRefs: route.sourceRefs,
    })),
  };
}

function buildEventCatalog() {
  return {
    taskId: SHORT_TASK_ID,
    catalogId: "311_hub_event_catalog",
    catalogVersion: CONTRACT_VERSION,
    aggregate: "HubCoordinationCase",
    events: EVENTS.map((eventName) => ({
      eventName,
      canonicalEventContractRef: eventName.toUpperCase().replace(/\./g, "_"),
      schemaPath: null,
      governingAggregate: eventName.startsWith("hub.request")
        ? "NetworkBookingRequest"
        : eventName.startsWith("hub.capacity") || eventName.startsWith("hub.candidates")
          ? "NetworkCandidateSnapshot"
          : eventName.startsWith("hub.offer")
            ? "AlternativeOfferSession"
            : eventName.startsWith("hub.booking")
              ? "HubCommitAttempt"
              : eventName.startsWith("hub.practice")
                ? "PracticeAcknowledgementRecord"
                : eventName.startsWith("hub.callback") || eventName.startsWith("hub.escalated")
                  ? "HubFallbackRecord"
                  : "HubCoordinationCase",
      freezeOwnerTask: SHORT_TASK_ID,
      implementationOwnerTask:
        eventName.includes("capacity") || eventName.includes("offer")
          ? "seq_312"
          : eventName.includes("booking") || eventName.includes("practice")
            ? "seq_313"
            : "seq_311",
      notes:
        "Concrete event implementation may arrive later, but downstream tasks must not rename this event or change the governing aggregate without superseding the 311 freeze pack.",
    })),
    apiSurface: API_SURFACE,
  };
}

function buildExternalReferenceNotes() {
  return {
    taskId: TASK_ID,
    reviewedOn: TODAY,
    localSourceOfTruth: [
      SOURCE_REFS.phase5Hub,
      SOURCE_REFS.phase5Identity,
      SOURCE_REFS.phaseCards,
      SOURCE_REFS.phase4HubFallback,
      SOURCE_REFS.phase0Lineage,
      SOURCE_REFS.phase0Lease,
      SOURCE_REFS.phase0Command,
      SOURCE_REFS.phase0Settlement,
      SOURCE_REFS.patientPortalShell,
      SOURCE_REFS.staffShell,
    ],
    sourcesReviewed: [
      {
        url: "https://digital.nhs.uk/services/care-identity-service",
        title: "Care Identity Service (CIS) - NHS England Digital",
        borrowedInto: [
          "StaffIdentityContext auth provider freeze",
          "organisation-scoped staff identity framing",
        ],
        rejectedOrNotImported: [
          "No NHS page dictated local acting-context field names; the blueprint remains authoritative.",
        ],
      },
      {
        url: "https://digital.nhs.uk/services/care-identity-service/applications-and-services/cis2-authentication/authenticators",
        title: "Care Identity Service authenticators - NHS England Digital",
        borrowedInto: ["sessionAssurance terminology", "CIS2 authenticator and assurance framing"],
        rejectedOrNotImported: [
          "Authenticator menu or product-specific UX was not copied into the atlas.",
        ],
      },
      {
        url: "https://digital.nhs.uk/services/care-identity-service/setting-up-and-troubleshooting",
        title: "Setting up and troubleshooting in Care Identity Service - NHS England Digital",
        borrowedInto: [
          "Operational note that CIS2 workstation readiness is an environment dependency, not a role check.",
        ],
        rejectedOrNotImported: [
          "Troubleshooting step lists were not imported into product contracts.",
        ],
      },
      {
        url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html",
        title: "Understanding SC 2.4.11: Focus Not Obscured (Minimum) - W3C",
        borrowedInto: [
          "Atlas focus-safe shell transitions",
          "no obscured focus for sticky rails and inspectors",
        ],
        rejectedOrNotImported: ["No WCAG language replaced the local shell continuity law."],
      },
      {
        url: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
        title: "Tabs Pattern - WAI ARIA Authoring Practices",
        borrowedInto: ["Keyboard traversal model for grouped state and audience selectors"],
        rejectedOrNotImported: [
          "The atlas is not modeled as a full tabbed application; only the keyboard interaction cue was borrowed.",
        ],
      },
      {
        url: "https://service-manual.nhs.uk/design-system/components/table",
        title: "Table - NHS digital service manual",
        borrowedInto: [
          "Adjacent table parity beside every diagram",
          "caption and responsive table discipline",
        ],
        rejectedOrNotImported: [
          "The NHS table component shape did not override the atlas layout contract.",
        ],
      },
      {
        url: "https://service-manual.nhs.uk/design-system/components/tabs",
        title: "Tabs - NHS digital service manual",
        borrowedInto: [
          "Guidance to avoid overloaded tab counts and to keep labels clear and keyboard-friendly",
        ],
        rejectedOrNotImported: [
          "We did not adopt NHS tabs as the primary atlas layout because the contract requires a persistent left rail and right inspector.",
        ],
      },
      {
        url: "https://playwright.dev/docs/best-practices",
        title: "Best Practices - Playwright",
        borrowedInto: [
          "Locator-first browser proof",
          "user-facing assertions for atlas verification",
        ],
        rejectedOrNotImported: [
          "No test isolation or staging guidance altered local verification scope.",
        ],
      },
      {
        url: "https://playwright.dev/docs/aria-snapshots",
        title: "Snapshot testing - Playwright",
        borrowedInto: ["ARIA snapshot capture for the browser-visible atlas proof"],
        rejectedOrNotImported: [
          "Snapshot files were used as evidence only, not as a source of contract semantics.",
        ],
      },
      {
        url: "https://linear.app/docs/triage",
        title: "Triage - Linear Docs",
        borrowedInto: ["Dense operational board ergonomics for queue and exception views"],
        rejectedOrNotImported: [
          "Linear issue workflow semantics were not imported into clinical hub states.",
        ],
      },
      {
        url: "https://vercel.com/docs/dashboard-features",
        title: "Dashboard Overview - Vercel",
        borrowedInto: [
          "Scope selector and command-surface inspiration for keeping active scope explicit in operational dashboards",
        ],
        rejectedOrNotImported: [
          "No Vercel deployment or project semantics were imported into case routing.",
        ],
      },
      {
        url: "https://carbondesignsystem.com/components/data-table/usage/",
        title: "Data table - Carbon Design System",
        borrowedInto: ["Table-first parity for route, command, and audience matrices"],
        rejectedOrNotImported: [
          "Carbon row-toolbar conventions did not replace NHS-oriented accessibility rules.",
        ],
      },
      {
        url: "https://carbondesignsystem.com/community/patterns/create-flows/",
        title: "Create flows - Carbon Design System",
        borrowedInto: [
          "Use of a side panel when page context must remain visible during structured action review",
        ],
        rejectedOrNotImported: [
          "We rejected side-panel-only flow ownership because the hub shell contract already defines a permanent right inspector.",
        ],
      },
    ],
    synthesis: [
      "External sources informed accessibility, dense-board ergonomics, and visible scope patterns only.",
      "All state names, route names, blocker law, visibility tiers, and lineage rules come from the local blueprint and validated Phase 4 outputs.",
      "Where external UI patterns implied looser workflow semantics, those ideas were rejected in favor of explicit hub lineage and acting-context contracts.",
    ],
  };
}

function buildGapLog() {
  return {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    summary:
      "311 freezes only the hub-core aggregate, identity law, visibility law, state vocabulary, route family, and event names. Later candidate, offer, commit, fallback, and practice-visibility implementations must extend these typed seams rather than replace them.",
    gaps: GAP_SEAMS.map((seam) => ({
      seamId: seam.seamId,
      ownerTask: seam.ownerTask,
      area: seam.area,
      purpose: seam.purpose,
      filePath: repoPath(seam.fileName),
      consumerRefs: seam.consumerRefs,
      requiredObjectNames: seam.requiredObjects.map((entry) => entry.objectName),
    })),
  };
}

function buildTransitionMatrixRows() {
  return TRANSITIONS.map((transition) => ({
    transitionId: transition.transitionId,
    fromStatus: transition.from,
    toStatus: transition.to,
    predicateId: transition.predicateId,
    controllingObject: transition.controllingObject,
    commandScope: transition.commandScope,
    truthPredicate: transition.truthPredicate,
    sourceRef: transition.sourceRef,
  }));
}

function buildVisibilityMatrixRows() {
  return AUDIENCES.flatMap((audience) => {
    const visibleRows = audience.visibleFieldRefs.map((fieldRef) => ({
      tierId: audience.tierId,
      tierLabel: audience.label,
      fieldRef,
      visibility: "visible",
      placeholderContractRef: "",
      minimumNecessaryContractRef: audience.minimumNecessaryContractRef,
      policyRef: audience.visibilityProjectionPolicyRef,
      driftResponse: audience.driftResponse,
    }));
    const hiddenRows = audience.hiddenFieldRefs.map((fieldRef) => ({
      tierId: audience.tierId,
      tierLabel: audience.label,
      fieldRef,
      visibility: "withheld",
      placeholderContractRef: audience.placeholderContractRef,
      minimumNecessaryContractRef: audience.minimumNecessaryContractRef,
      policyRef: audience.visibilityProjectionPolicyRef,
      driftResponse: audience.driftResponse,
    }));
    return [...visibleRows, ...hiddenRows];
  });
}

function buildArchitectureDoc() {
  const aggregateTable = mdTable(
    ["Contract", "Purpose", "Non-negotiable law"],
    [
      [
        "`NetworkBookingRequest`",
        "Single executable booking-to-hub handoff.",
        "Must preserve `requestLineageRef`, origin booking refs, origin practice identity, patient constraints, and `reasonForHubRouting`.",
      ],
      [
        "`HubCoordinationCase`",
        "Durable hub aggregate and state machine root.",
        "Must open one child `LineageCaseLink(caseFamily = hub)` under the booking branch and never overwrite the booking lineage link.",
      ],
      [
        "`StaffIdentityContext`",
        "Authenticated staff identity frame.",
        "Freezes `authProvider = cis2`; raw RBAC claims remain necessary but insufficient.",
      ],
      [
        "`ActingContext`",
        "Current organisation, purpose-of-use, and audience envelope for commands.",
        "Every write carries `scopeTupleHash`, audience tier, minimum-necessary contract, and drift state.",
      ],
      [
        "`CrossOrganisationVisibilityEnvelope`",
        "Materialized minimum-necessary visibility contract.",
        "Cross-org visibility may never be inferred from frontend state or role labels alone.",
      ],
      [
        "`CoordinationOwnership`",
        "Live ownership fence and lease posture.",
        "Only one live ownership lease may exist per case; stale-owner recovery is explicit and blocks close.",
      ],
    ],
  );

  const familyTable = mdTable(
    ["Family", "States", "Meaning"],
    STATE_FAMILIES.map((family) => [
      family.label,
      family.states.map((state) => `\`${state}\``).join(", "),
      family.summary,
    ]),
  );

  const seamTable = mdTable(
    ["Typed seam file", "Owner", "Why it exists"],
    GAP_SEAMS.map((seam) => [path.basename(seam.fileName), `\`${seam.ownerTask}\``, seam.purpose]),
  );

  return `# 311 Phase 5 Hub Case And Acting Context Contract

Contract version: \`${CONTRACT_VERSION}\`

This document freezes the opening Phase 5 hub-domain contract pack. The hub is not a loose Phase 4 booking exception. It is a child lineage branch with its own durable aggregate, state machine, ownership fence, and acting-context law.

## Aggregate boundary

${aggregateTable}

## Lineage carry-forward

1. \`BookingCase.lineageCaseLinkRef\` remains the canonical Phase 4 booking branch.
2. Hub entry opens one child \`LineageCaseLink(caseFamily = hub, parentLineageCaseLinkRef = origin booking link)\`.
3. \`NetworkBookingRequest\`, \`HubCoordinationCase\`, fallback linkage, patient visibility, and practice acknowledgement all bind the same \`requestLineageRef\`.
4. Hub fallback may never overwrite the booking lineage link or infer continuity from foreign keys alone.

## Operational state families

${familyTable}

Operational status is intentionally narrower than cross-surface truth:

- Patient reassurance comes from \`HubOfferToConfirmationTruthProjection.patientVisibilityState\`, not raw \`HubCoordinationCase.status\`.
- Practice visibility comes from \`HubOfferToConfirmationTruthProjection.practiceVisibilityState\` plus current-generation acknowledgement evidence.
- Closeability comes from \`HubOfferToConfirmationTruthProjection.closureState\` plus \`OpenCaseBlockers(h) = empty\`, not from booked or callback posture alone.

## Ownership and close law

1. Hub ownership is lease-based and fenced. Every claim, transfer, supervisor takeover, commit, return, and close must present the current \`ownershipFenceToken\` and \`ownershipEpoch\`.
2. Lease expiry does not silently close or reassign the case. It creates governed stale-owner recovery and keeps the case visible.
3. \`OpenCaseBlockers(h)\` must include live ownership lease, live ownership transition, truth blockers, callback or return linkage blockers, continuity-evidence blockers, unresolved supplier drift, and active identity-repair blockers.
4. \`HubCoordinationCase.status = closed\` is legal only when \`OpenCaseBlockers(h)\` is empty and \`LifecycleCoordinator\` has persisted the governing close decision.

## Same-shell continuity law

1. \`/hub/queue\`, \`/hub/case/:hubCoordinationCaseId\`, \`/hub/alternatives/:offerSessionId\`, \`/hub/exceptions\`, and \`/hub/audit/:hubCoordinationCaseId\` are one hub shell family.
2. Case detail is the same-shell root. Alternatives and audit are bounded child routes; exceptions is a same-shell peer workbench.
3. Deep links, refresh, and back-forward navigation must reopen the current hub shell and selected case anchor rather than reconstructing detached booking or callback pages.
4. Every hub route family must publish one \`FrontendContractManifest\`, one exact \`ProjectionContractVersionSet\`, and one \`projectionCompatibilityDigestRef\`.

## Typed later-owned seams

${seamTable}

These seam files exist so later Phase 5 tasks extend the 311 vocabulary instead of inventing substitute state names or placeholder case fields.
`;
}

function buildApiDoc() {
  const routeTable = mdTable(
    ["Route", "Projection", "Transition type", "Dominant action", "Notes"],
    ROUTES.map((route) => [
      `\`${route.path}\``,
      route.projectionRef,
      route.transitionType,
      route.dominantAction,
      route.sameShell ? "Same shell family" : "Boundary",
    ]),
  );

  const commandTable = mdTable(
    ["Method", "Path", "Action scope", "Primary states", "Required envelope"],
    [
      [
        `\`${API_SURFACE[1].method}\``,
        `\`${API_SURFACE[1].path}\``,
        `\`${API_SURFACE[1].actionScope}\``,
        ALL_STATUSES.map((state) => `\`${state}\``).join(", "),
        API_SURFACE[1].requiredEnvelope.join("; "),
      ],
      ...COMMANDS.map((command) => [
        `\`${command.method}\``,
        `\`${command.path}\``,
        `\`${command.actionScope}\``,
        command.dominantStates.map((state) => `\`${state}\``).join(", "),
        command.requiredEnvelope.join("; "),
      ]),
    ],
  );

  const eventTable = mdTable(
    ["Event", "Aggregate", "Implementation owner", "Note"],
    buildEventCatalog().events.map((event) => [
      `\`${event.eventName}\``,
      event.governingAggregate,
      `\`${event.implementationOwnerTask}\``,
      "Frozen here so later work may implement without renaming.",
    ]),
  );

  return `# 311 Phase 5 Hub Route And Command Contract

This document freezes the route family, API surface, and command-envelope law for the first Phase 5 hub shell.

## Route-family registry

${routeTable}

### Governing route rules

1. The hub remains one same-shell family. Queue, case detail, alternatives, exceptions, and audit are never detached mini-products.
2. Case detail is the root ownership route for an active coordination case.
3. Child routes preserve the selected case anchor, current acting context, and last safe continuity evidence where that evidence is still valid.
4. Publication drift, manifest drift, or scope drift freezes or downgrades the current shell in place through \`RouteFreezeDisposition\` or \`ReleaseRecoveryDisposition\`; it does not silently leave stale controls armed.

## API surface skeleton

${commandTable}

### Command-envelope law

Every writable hub command must carry:

1. \`ActingContext\`
2. the current ownership fence token and epoch
3. the active minimum-necessary visibility contract
4. the current \`CrossOrganisationVisibilityEnvelope\` whenever cross-organisation work applies
5. one immutable \`CommandActionRecord\`
6. one authoritative \`CommandSettlementRecord\`

URL params, detached projection fragments, copied CTA state, or client-local cache may not supply missing authority.

## Event catalog

${eventTable}
`;
}

function buildSecurityDoc() {
  const identityTable = mdTable(
    ["Contract", "Key fields", "Security role"],
    [
      [
        "`StaffIdentityContext`",
        "`authProvider = cis2`, `sessionAssurance`, `identityState`, organisation grants",
        "Authenticates the person and their organisation affiliations.",
      ],
      [
        "`ActingContext`",
        "`purposeOfUse`, `audienceTierRef`, `scopeTupleHash`, `breakGlassState`, `contextState`",
        "Turns identity into a current, bounded, minimum-necessary action scope.",
      ],
      [
        "`CrossOrganisationVisibilityEnvelope`",
        "`sourceOrganisationRef`, `targetOrganisationRef`, `visibleFieldRefs[]`, `envelopeState`",
        "Materializes exactly which fields may be seen across org boundaries.",
      ],
    ],
  );

  const visibilityTable = mdTable(
    ["Tier", "Visible", "Never visible", "Drift response"],
    AUDIENCES.map((audience) => [
      audience.label,
      audience.visibleFieldRefs.join(", "),
      audience.hiddenFieldRefs.join(", "),
      audience.driftResponse,
    ]),
  );

  const driftTable = mdTable(
    ["Drift or denial case", "Required response"],
    [
      [
        "Organisation switch",
        "Revoke writable posture and require same-shell re-read under the new context.",
      ],
      [
        "Stale ownership fence",
        "Reject mutation, create or reuse stale-owner recovery, keep the case visible.",
      ],
      [
        "Visibility envelope stale",
        "Demote to read-only or recovery posture; do not reinterpret scope from UI state.",
      ],
      [
        "Purpose-of-use drift",
        "Block cross-org actions until the new purpose is explicitly materialized and audited.",
      ],
      [
        "Break-glass without reason",
        "Deny elevated access and require structured reason capture before retry.",
      ],
    ],
  );

  return `# 311 Phase 5 Org Boundary And Visibility Rules

This document closes the Phase 5 gap where cross-organisation access could otherwise degrade into a role check plus frontend state.

## Identity and acting-context stack

${identityTable}

Rules:

1. Raw RBAC claims are necessary but not sufficient.
2. Every write proves one exact \`ActingContext.scopeTupleHash\`.
3. Cross-org access proves one current \`CrossOrganisationVisibilityEnvelope\`.
4. Break-glass remains explicit, reason-coded, and auditable.

## Visibility tiers

${visibilityTable}

## Drift handling

${driftTable}

## Audit minimums

Every hub mutation audit record must capture:

1. who acted
2. from which organisation or site
3. against which \`HubCoordinationCase\`
4. which purpose of use and audience tier were active
5. whether break-glass was active
6. whether the command was rejected because lease, organisation, purpose-of-use, or visibility posture drifted
`;
}

function buildAtlasHtml() {
  const atlasData = {
    taskId: SHORT_TASK_ID,
    contractVersion: CONTRACT_VERSION,
    visualMode: VISUAL_MODE,
    stateFamilies: STATE_FAMILIES,
    states: STATE_DEFINITIONS,
    transitions: TRANSITIONS,
    commands: COMMANDS,
    blockers: BLOCKERS,
    audiences: AUDIENCES,
    routes: ROUTES,
    lineage: [
      {
        id: "booking_branch",
        label: "Booking branch",
        summary: "Phase 4 BookingCase stays the parent lineage owner.",
      },
      {
        id: "network_request",
        label: "Network request",
        summary: "One executable handoff preserves origin refs and reason for routing.",
      },
      {
        id: "hub_case",
        label: "Hub case",
        summary: "One child lineage branch owns hub coordination, fences, and close blockers.",
      },
    ],
    visibilityTableRows: buildVisibilityMatrixRows(),
  };

  const escapedData = JSON.stringify(atlasData).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>311 Phase 5 Hub State And Scope Atlas</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #f7f8fa;
        --panel: #ffffff;
        --inset: #e8eef3;
        --text-strong: #0f172a;
        --text-default: #334155;
        --text-muted: #64748b;
        --lineage-accent: #5b61f6;
        --visibility-accent: #3158e0;
        --current-accent: #0f766e;
        --warning-accent: #b7791f;
        --blocked-accent: #b42318;
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
          radial-gradient(circle at top right, rgba(91, 97, 246, 0.07), transparent 28%),
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
        max-width: 1720px;
        margin: 0 auto;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.72);
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
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.8));
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }

      .brand-mark {
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
      }

      .brand-copy h1 {
        margin: 0;
        font-family: "Iowan Old Style", Georgia, serif;
        font-size: 24px;
        line-height: 1.1;
        color: var(--text-strong);
      }

      .brand-copy p {
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
        border: 1px solid transparent;
      }

      .layout {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr) 420px;
        min-height: 980px;
      }

      .rail,
      .canvas,
      .inspector {
        min-width: 0;
      }

      .rail,
      .inspector {
        background: rgba(255, 255, 255, 0.84);
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

      .state-list,
      .audience-list {
        display: grid;
        gap: 8px;
      }

      .state-button,
      .audience-button {
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

      .state-button:hover,
      .state-button:focus-visible,
      .audience-button:hover,
      .audience-button:focus-visible {
        outline: none;
        border-color: var(--lineage-accent);
        box-shadow: 0 0 0 3px rgba(91, 97, 246, 0.12);
      }

      .state-button[data-active="true"] {
        border-color: var(--lineage-accent);
        background: rgba(91, 97, 246, 0.07);
        transform: translateX(2px);
      }

      .audience-button[data-active="true"] {
        border-color: var(--visibility-accent);
        background: rgba(49, 88, 224, 0.08);
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
        font-size: 13px;
        line-height: 1.55;
      }

      .hero-grid,
      .matrix-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .diagram {
        background: linear-gradient(180deg, rgba(232, 238, 243, 0.5), rgba(255, 255, 255, 0.92));
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 16px;
      }

      .lineage-flow {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: center;
      }

      .lineage-node {
        padding: 14px;
        border-radius: 14px;
        background: white;
        border: 1px solid rgba(91, 97, 246, 0.18);
        box-shadow: inset 0 0 0 1px rgba(91, 97, 246, 0.05);
      }

      .lineage-node strong {
        display: block;
        color: var(--text-strong);
      }

      .lineage-node span {
        display: block;
        margin-top: 4px;
        color: var(--text-muted);
      }

      .lineage-arrow {
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--lineage-accent);
        font-weight: 700;
      }

      .transition-list,
      .command-list,
      .blocker-list,
      .field-list {
        display: grid;
        gap: 8px;
      }

      .list-item {
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
      }

      .token {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 12px;
        background: var(--inset);
        color: var(--text-strong);
      }

      .token.lineage {
        color: var(--lineage-accent);
      }

      .token.visibility {
        color: var(--visibility-accent);
      }

      .token.current {
        color: var(--current-accent);
      }

      .token.warning {
        color: var(--warning-accent);
      }

      .token.blocked {
        color: var(--blocked-accent);
      }

      .muted {
        color: var(--text-muted);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      caption {
        text-align: left;
        font-weight: 600;
        color: var(--text-strong);
        margin-bottom: 8px;
      }

      th,
      td {
        padding: 10px 10px;
        vertical-align: top;
        border-top: 1px solid var(--line);
        overflow-wrap: anywhere;
      }

      thead th {
        border-top: none;
        background: var(--inset);
        color: var(--text-strong);
        font-weight: 600;
      }

      .table-shell {
        overflow-x: auto;
      }

      .lower-grid {
        display: grid;
        gap: 16px;
      }

      .visibility-grid {
        display: grid;
        gap: 10px;
      }

      .visibility-row {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .visibility-cell {
        border-radius: 10px;
        border: 1px solid var(--line);
        padding: 10px;
        background: rgba(255, 255, 255, 0.92);
      }

      .visibility-cell.visible {
        box-shadow: inset 0 0 0 1px rgba(49, 88, 224, 0.14);
        border-color: rgba(49, 88, 224, 0.24);
      }

      .visibility-cell.withheld {
        box-shadow: inset 0 0 0 1px rgba(180, 35, 24, 0.06);
      }

      .inspector-grid {
        display: grid;
        gap: 12px;
      }

      .chip-line {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      @media (max-width: 1320px) {
        .layout {
          grid-template-columns: 280px minmax(0, 1fr) 360px;
        }
      }

      @media (max-width: 1120px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .rail,
        .inspector {
          border: none;
        }
      }

      @media (max-width: 860px) {
        .page {
          padding: 14px;
        }

        .masthead {
          align-items: flex-start;
          flex-direction: column;
        }

        .hero-grid,
        .matrix-grid {
          grid-template-columns: 1fr;
        }

        .lineage-flow {
          grid-template-columns: 1fr;
        }

        .lineage-arrow {
          transform: rotate(90deg);
        }

        .visibility-row {
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
        data-testid="Phase5HubAtlas"
        data-visual-mode="${VISUAL_MODE}"
        data-active-state="hub_requested"
        data-active-tier="origin_practice_visibility"
      >
        <header class="masthead">
          <div class="brand">
            <svg class="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="40" height="40" rx="12" fill="rgba(91,97,246,0.12)" />
              <path d="M14 17h20M14 24h20M14 31h12" stroke="#5B61F6" stroke-width="3" stroke-linecap="round" />
            </svg>
            <div class="brand-copy">
              <h1>Phase 5 Hub State And Scope Atlas</h1>
              <p>One hub branch, one acting-context law, one same-shell family. Operational state never substitutes for patient or practice truth.</p>
            </div>
          </div>
          <div class="meta">
            <span class="pill"><strong>Task</strong> ${SHORT_TASK_ID}</span>
            <span class="pill"><strong>Version</strong> ${CONTRACT_VERSION}</span>
            <span class="pill"><strong>States</strong> ${ALL_STATUSES.length}</span>
            <span class="pill"><strong>Audience tiers</strong> ${AUDIENCES.length}</span>
          </div>
        </header>
        <div class="layout">
          <aside class="rail">
            <h2 class="section-label">State rail</h2>
            <div class="state-list" id="state-list" role="tablist" aria-label="Hub coordination states"></div>
          </aside>
          <main class="canvas" id="atlas-main">
            <div class="stack">
              <section class="card" data-testid="CurrentStatePanel">
                <div class="chip-line">
                  <span class="token lineage">Booking branch -> network request -> hub case</span>
                  <span class="token current" id="current-family-token"></span>
                </div>
                <h2 id="state-title"></h2>
                <p id="state-summary"></p>
                <div class="hero-grid">
                  <div class="diagram" data-testid="LineageDiagram">
                    <h3>Lineage mini-diagram</h3>
                    <div class="lineage-flow" id="lineage-flow"></div>
                  </div>
                  <div class="card" style="padding: 0; box-shadow: none;" data-testid="LineageParityTable">
                    <div class="table-shell">
                      <table>
                        <caption>Lineage parity</caption>
                        <thead>
                          <tr>
                            <th>Node</th>
                            <th>Contract</th>
                            <th>Invariant</th>
                          </tr>
                        </thead>
                        <tbody id="lineage-table-body"></tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              <section class="card" data-testid="TransitionCanvas">
                <h2>Legal exits and blockers</h2>
                <p class="muted">Selecting a state updates the legal transition graph, allowed commands, and the open blockers that must remain explicit in the shell.</p>
                <div class="hero-grid">
                  <div class="diagram">
                    <h3>Legal exits</h3>
                    <div class="transition-list" id="transition-list"></div>
                  </div>
                  <div class="diagram">
                    <h3>Allowed commands</h3>
                    <div class="command-list" id="command-list"></div>
                  </div>
                </div>
                <div class="card" style="margin-top: 14px; box-shadow: none;">
                  <h3>Required blockers</h3>
                  <div class="blocker-list" id="blocker-list"></div>
                </div>
              </section>

              <section class="card" data-testid="RouteCommandAudienceTables">
                <h2>Parity tables</h2>
                <div class="lower-grid">
                  <div class="table-shell" data-testid="RouteFamilyTable">
                    <table>
                      <caption>Hub route family</caption>
                      <thead>
                        <tr>
                          <th>Path</th>
                          <th>Projection</th>
                          <th>Supported states</th>
                          <th>Commands</th>
                        </tr>
                      </thead>
                      <tbody id="route-table-body"></tbody>
                    </table>
                  </div>
                  <div class="table-shell" data-testid="CommandTable">
                    <table>
                      <caption>Command envelope</caption>
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Scope</th>
                          <th>Required envelope</th>
                          <th>Primary states</th>
                        </tr>
                      </thead>
                      <tbody id="command-table-body"></tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          </main>
          <aside class="inspector">
            <div class="stack">
              <section class="card" data-testid="AudienceInspector">
                <h2 class="section-label" style="margin-top: 0;">Visibility tiers</h2>
                <div class="audience-list" id="audience-list" role="tablist" aria-label="Visibility audience tiers"></div>
                <div class="inspector-grid" style="margin-top: 14px;">
                  <div>
                    <h3 id="audience-title"></h3>
                    <p id="audience-summary" class="muted"></p>
                  </div>
                  <div>
                    <span class="token visibility" id="audience-policy-token"></span>
                  </div>
                  <div>
                    <h3>Visible fields</h3>
                    <div class="field-list" id="visible-field-list"></div>
                  </div>
                  <div>
                    <h3>Withheld or placeholder fields</h3>
                    <div class="field-list" id="hidden-field-list"></div>
                  </div>
                </div>
              </section>
              <section class="card" data-testid="VisibilityMatrixVisual">
                <h2>Visibility-tier matrix</h2>
                <p class="muted">Each visual row has adjacent table parity below. Selecting a tier highlights the same visible and withheld fields in both places.</p>
                <div class="visibility-grid" id="visibility-grid"></div>
              </section>
              <section class="card" data-testid="AudienceParityTable">
                <div class="table-shell">
                  <table>
                    <caption>Audience parity</caption>
                    <thead>
                      <tr>
                        <th>Tier</th>
                        <th>Field</th>
                        <th>Visibility</th>
                        <th>Placeholder</th>
                      </tr>
                    </thead>
                    <tbody id="audience-table-body"></tbody>
                  </table>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
    <script>
      const atlasData = ${escapedData};
      const stateMap = new Map(atlasData.states.map((entry) => [entry.stateId, entry]));
      const commandMap = new Map(atlasData.commands.map((entry) => [entry.commandId, entry]));
      const blockerMap = new Map(atlasData.blockers.map((entry) => [entry.blockerId, entry]));
      const audienceMap = new Map(atlasData.audiences.map((entry) => [entry.tierId, entry]));
      const root = document.querySelector("[data-testid='Phase5HubAtlas']");
      const stateList = document.getElementById("state-list");
      const audienceList = document.getElementById("audience-list");
      const stateTitle = document.getElementById("state-title");
      const stateSummary = document.getElementById("state-summary");
      const currentFamilyToken = document.getElementById("current-family-token");
      const transitionList = document.getElementById("transition-list");
      const commandList = document.getElementById("command-list");
      const blockerList = document.getElementById("blocker-list");
      const audienceTitle = document.getElementById("audience-title");
      const audienceSummary = document.getElementById("audience-summary");
      const audiencePolicyToken = document.getElementById("audience-policy-token");
      const visibleFieldList = document.getElementById("visible-field-list");
      const hiddenFieldList = document.getElementById("hidden-field-list");
      const routeTableBody = document.getElementById("route-table-body");
      const commandTableBody = document.getElementById("command-table-body");
      const audienceTableBody = document.getElementById("audience-table-body");
      const lineageFlow = document.getElementById("lineage-flow");
      const lineageTableBody = document.getElementById("lineage-table-body");
      const visibilityGrid = document.getElementById("visibility-grid");
      let activeStateId = atlasData.states[0].stateId;
      let activeTierId = atlasData.audiences[0].tierId;

      function createButton(entry, type, onSelect) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = type === "state" ? "state-button" : "audience-button";
        button.dataset.id = type === "state" ? entry.stateId : entry.tierId;
        button.dataset.active = "false";
        button.setAttribute("role", "tab");
        button.setAttribute("tabindex", "-1");
        button.innerHTML = '<span class="button-title"></span><span class="button-note"></span>';
        button.querySelector(".button-title").textContent = entry.label;
        button.querySelector(".button-note").textContent = type === "state" ? entry.familyLabel : entry.summary;
        button.addEventListener("click", () => onSelect(button.dataset.id));
        return button;
      }

      function activateRovingTab(container, activeId, idSelector) {
        const buttons = Array.from(container.querySelectorAll("button"));
        buttons.forEach((button) => {
          const isActive = button.dataset.id === activeId;
          button.removeAttribute("id");
          button.dataset.active = isActive ? "true" : "false";
          button.setAttribute("aria-selected", isActive ? "true" : "false");
          button.setAttribute("tabindex", isActive ? "0" : "-1");
        });
        const activeButton = buttons.find((button) => button.dataset.id === activeId);
        if (activeButton) {
          activeButton.id = idSelector;
        }
      }

      function wireArrowNavigation(container, getter, setter) {
        container.addEventListener("keydown", (event) => {
          const buttons = Array.from(container.querySelectorAll("button"));
          const currentIndex = buttons.findIndex((button) => button.dataset.id === getter());
          if (currentIndex < 0) return;
          let nextIndex = currentIndex;
          if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = Math.min(buttons.length - 1, currentIndex + 1);
          if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = Math.max(0, currentIndex - 1);
          if (event.key === "Home") nextIndex = 0;
          if (event.key === "End") nextIndex = buttons.length - 1;
          if (nextIndex !== currentIndex) {
            event.preventDefault();
            const nextButton = buttons[nextIndex];
            setter(nextButton.dataset.id);
            nextButton.focus();
          }
        });
      }

      function renderLineage() {
        lineageFlow.innerHTML = "";
        lineageTableBody.innerHTML = "";
        atlasData.lineage.forEach((entry, index) => {
          const node = document.createElement("div");
          node.className = "lineage-node";
          node.innerHTML = "<strong></strong><span></span>";
          node.querySelector("strong").textContent = entry.label;
          node.querySelector("span").textContent = entry.summary;
          lineageFlow.appendChild(node);
          if (index < atlasData.lineage.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "lineage-arrow";
            arrow.textContent = "→";
            lineageFlow.appendChild(arrow);
          }

          const row = document.createElement("tr");
          row.innerHTML = "<td></td><td></td><td></td>";
          row.children[0].textContent = entry.label;
          row.children[1].textContent = index === 0 ? "BookingCase" : index === 1 ? "NetworkBookingRequest" : "HubCoordinationCase";
          row.children[2].textContent =
            index === 0
              ? "Remains the parent lineage owner."
              : index === 1
                ? "Preserves origin refs and reason for routing."
                : "Owns hub status, fences, blockers, and close law.";
          lineageTableBody.appendChild(row);
        });
      }

      function renderRoutes() {
        routeTableBody.innerHTML = "";
        atlasData.routes.forEach((route) => {
          const row = document.createElement("tr");
          row.innerHTML = "<td></td><td></td><td></td><td></td>";
          row.children[0].textContent = route.path;
          row.children[1].textContent = route.projectionRef;
          row.children[2].textContent = route.supportedStates.join(", ");
          row.children[3].textContent = route.commandIds.map((commandId) => commandMap.get(commandId)?.label ?? commandId).join(", ") || "Read only";
          routeTableBody.appendChild(row);
        });
      }

      function renderCommandTable(activeState) {
        commandTableBody.innerHTML = "";
        atlasData.commands.forEach((command) => {
          const row = document.createElement("tr");
          const matches = activeState.allowedCommandIds.includes(command.commandId);
          row.style.background = matches ? "rgba(15, 118, 110, 0.06)" : "";
          row.innerHTML = "<td></td><td></td><td></td><td></td>";
          row.children[0].textContent = command.label;
          row.children[1].textContent = command.actionScope;
          row.children[2].textContent = command.requiredEnvelope.join("; ");
          row.children[3].textContent = command.dominantStates.join(", ");
          commandTableBody.appendChild(row);
        });
      }

      function renderVisibilityVisual(activeTier) {
        visibilityGrid.innerHTML = "";
        audienceTableBody.innerHTML = "";
        const fieldUniverse = Array.from(new Set(atlasData.audiences.flatMap((entry) => [...entry.visibleFieldRefs, ...entry.hiddenFieldRefs])));
        fieldUniverse.forEach((fieldRef) => {
          const row = document.createElement("div");
          row.className = "visibility-row";
          const head = document.createElement("div");
          head.className = "visibility-cell";
          head.innerHTML = "<strong></strong><div class='muted'></div>";
          head.querySelector("strong").textContent = fieldRef;
          head.querySelector(".muted").textContent = "Field visibility";
          row.appendChild(head);

          atlasData.audiences.forEach((audience) => {
            const cell = document.createElement("div");
            const visible = audience.visibleFieldRefs.includes(fieldRef);
            cell.className = "visibility-cell " + (visible ? "visible" : "withheld");
            if (audience.tierId === activeTier.tierId) {
              cell.style.borderColor = "rgba(49, 88, 224, 0.28)";
            }
            cell.innerHTML = "<strong></strong><div class='muted'></div>";
            cell.querySelector("strong").textContent = audience.label;
            cell.querySelector(".muted").textContent = visible ? "Visible" : "Withheld";
            row.appendChild(cell);

            const tableRow = document.createElement("tr");
            tableRow.dataset.tierId = audience.tierId;
            tableRow.style.background = audience.tierId === activeTier.tierId ? "rgba(49, 88, 224, 0.06)" : "";
            tableRow.innerHTML = "<td></td><td></td><td></td><td></td>";
            tableRow.children[0].textContent = audience.label;
            tableRow.children[1].textContent = fieldRef;
            tableRow.children[2].textContent = visible ? "Visible" : "Withheld";
            tableRow.children[3].textContent = visible ? "" : audience.placeholderContractRef;
            audienceTableBody.appendChild(tableRow);
          });
          visibilityGrid.appendChild(row);
        });
      }

      function renderState(stateId) {
        activeStateId = stateId;
        const state = stateMap.get(stateId);
        const family = atlasData.stateFamilies.find((entry) => entry.familyId === state.familyId);
        root.dataset.activeState = stateId;
        activateRovingTab(stateList, stateId, "active-state-tab");
        stateTitle.textContent = state.label;
        stateSummary.textContent = state.summary;
        currentFamilyToken.textContent = family ? family.label : state.familyLabel;
        transitionList.innerHTML = "";
        atlasData.transitions
          .filter((entry) => entry.from === stateId)
          .forEach((transition) => {
            const item = document.createElement("div");
            item.className = "list-item";
            item.innerHTML = "<strong></strong><div></div><div class='muted'></div>";
            item.querySelector("strong").textContent = transition.to;
            item.querySelector("div").textContent = transition.predicate;
            item.querySelector(".muted").textContent = transition.controllingObject;
            transitionList.appendChild(item);
          });
        commandList.innerHTML = "";
        state.allowedCommandIds.forEach((commandId) => {
          const command = commandMap.get(commandId);
          if (!command) return;
          const item = document.createElement("div");
          item.className = "list-item";
          item.innerHTML = "<strong></strong><div></div><div class='muted'></div>";
          item.querySelector("strong").textContent = command.label;
          item.querySelector("div").textContent = command.path;
          item.querySelector(".muted").textContent = command.requiredEnvelope.join("; ");
          commandList.appendChild(item);
        });
        blockerList.innerHTML = "";
        state.activeBlockerIds.forEach((blockerId) => {
          const blocker = blockerMap.get(blockerId);
          if (!blocker) return;
          const item = document.createElement("div");
          item.className = "list-item";
          item.innerHTML = "<strong></strong><div></div><div class='muted'></div>";
          item.querySelector("strong").textContent = blocker.label;
          item.querySelector("div").textContent = blocker.description;
          item.querySelector(".muted").textContent = blocker.closeImpact;
          blockerList.appendChild(item);
        });
        renderCommandTable(state);
      }

      function renderAudience(tierId) {
        activeTierId = tierId;
        const audience = audienceMap.get(tierId);
        root.dataset.activeTier = tierId;
        activateRovingTab(audienceList, tierId, "active-audience-tab");
        audienceTitle.textContent = audience.label;
        audienceSummary.textContent = audience.summary;
        audiencePolicyToken.textContent = audience.visibilityProjectionPolicyRef;
        visibleFieldList.innerHTML = "";
        hiddenFieldList.innerHTML = "";
        audience.visibleFieldRefs.forEach((field) => {
          const item = document.createElement("div");
          item.className = "list-item";
          item.textContent = field;
          visibleFieldList.appendChild(item);
        });
        audience.hiddenFieldRefs.forEach((field) => {
          const item = document.createElement("div");
          item.className = "list-item";
          item.innerHTML = "<strong></strong><div class='muted'></div>";
          item.querySelector("strong").textContent = field;
          item.querySelector(".muted").textContent = audience.placeholderContractRef;
          hiddenFieldList.appendChild(item);
        });
        renderVisibilityVisual(audience);
      }

      function initLists() {
        atlasData.states.forEach((state) => {
          const button = createButton(state, "state", renderState);
          stateList.appendChild(button);
        });
        atlasData.audiences.forEach((audience) => {
          const button = createButton(audience, "audience", renderAudience);
          audienceList.appendChild(button);
        });
      }

      initLists();
      renderLineage();
      renderRoutes();
      renderState(activeStateId);
      renderAudience(activeTierId);
      wireArrowNavigation(stateList, () => activeStateId, renderState);
      wireArrowNavigation(audienceList, () => activeTierId, renderAudience);
      window.__phase5HubAtlasData = { loaded: true, ...atlasData };
    </script>
  </body>
</html>`;
}

function writeGapSeams() {
  for (const seam of GAP_SEAMS) {
    writeJson(seam.fileName, {
      taskId: SHORT_TASK_ID,
      seamId: seam.seamId,
      contractVersion: CONTRACT_VERSION,
      ownerTask: seam.ownerTask,
      area: seam.area,
      purpose: seam.purpose,
      consumerRefs: seam.consumerRefs,
      requiredObjects: seam.requiredObjects,
    });
  }
}

function run() {
  writeJson(
    "data/contracts/311_network_booking_request.schema.json",
    buildNetworkBookingRequestSchema(),
  );
  writeJson(
    "data/contracts/311_hub_coordination_case.schema.json",
    buildHubCoordinationCaseSchema(),
  );
  writeJson("data/contracts/311_hub_coordination_state_machine.json", buildStateMachine());
  writeJson(
    "data/contracts/311_staff_identity_context.schema.json",
    buildStaffIdentityContextSchema(),
  );
  writeJson("data/contracts/311_acting_context.schema.json", buildActingContextSchema());
  writeJson(
    "data/contracts/311_cross_org_visibility_envelope.schema.json",
    buildCrossOrgVisibilityEnvelopeSchema(),
  );
  writeJson("data/contracts/311_hub_visibility_tier_contract.json", buildVisibilityTierContract());
  writeText(
    "data/contracts/311_hub_route_family_registry.yaml",
    toYaml(buildRouteFamilyRegistry()),
  );
  writeJson("data/contracts/311_hub_event_catalog.json", buildEventCatalog());

  writeJson("data/analysis/311_external_reference_notes.json", buildExternalReferenceNotes());
  writeCsv("data/analysis/311_hub_transition_matrix.csv", buildTransitionMatrixRows(), [
    "transitionId",
    "fromStatus",
    "toStatus",
    "predicateId",
    "controllingObject",
    "commandScope",
    "truthPredicate",
    "sourceRef",
  ]);
  writeCsv("data/analysis/311_visibility_scope_matrix.csv", buildVisibilityMatrixRows(), [
    "tierId",
    "tierLabel",
    "fieldRef",
    "visibility",
    "placeholderContractRef",
    "minimumNecessaryContractRef",
    "policyRef",
    "driftResponse",
  ]);
  writeJson("data/analysis/311_hub_case_gap_log.json", buildGapLog());

  writeText(
    "docs/architecture/311_phase5_hub_case_and_acting_context_contract.md",
    buildArchitectureDoc(),
  );
  writeText("docs/api/311_phase5_hub_route_and_command_contract.md", buildApiDoc());
  writeText("docs/security/311_phase5_org_boundary_and_visibility_rules.md", buildSecurityDoc());
  writeText("docs/frontend/311_phase5_hub_state_and_scope_atlas.html", buildAtlasHtml());

  writeGapSeams();
}

run();
