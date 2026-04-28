import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type SimulatorFamilyCode = "nhs_login" | "im1_gp" | "mesh" | "telephony" | "notifications";
export type FailureMode =
  | "healthy"
  | "delay"
  | "duplicate"
  | "drift"
  | "timeout"
  | "weak_confirmation"
  | "blocked";
export type ReplayClass =
  | "none"
  | "exact_replay"
  | "duplicate_delivery"
  | "stale_callback"
  | "timeout_resume";
export type CallbackTimingClass =
  | "inline"
  | "delayed_short"
  | "delayed_long"
  | "out_of_order"
  | "expired";
export type SimulatorStatus = "running" | "stopped" | "degraded";
export type ReceiptStatus =
  | "accepted"
  | "pending"
  | "duplicate"
  | "settled"
  | "blocked"
  | "expired";
export type TimelineTone = "default" | "success" | "review" | "blocked" | "caution";

export interface AdapterDispatchAttempt {
  readonly dispatchAttemptRef: string;
  readonly family: SimulatorFamilyCode;
  readonly operation: string;
  readonly adapterContractProfileRef: string;
  readonly simulatorContractRef: string;
  readonly routeFamilyRef: string;
  readonly governingObjectRef: string;
  readonly replayKey: string;
  readonly replayClass: ReplayClass;
  readonly callbackTimingClass: CallbackTimingClass;
  readonly effectDigest: string;
  readonly dispatchedAt: string;
  readonly sourceRefs: readonly string[];
}

export interface AdapterReceiptCheckpoint {
  readonly receiptCheckpointRef: string;
  readonly dispatchAttemptRef: string;
  readonly family: SimulatorFamilyCode;
  readonly receiptStatus: ReceiptStatus;
  readonly authoritativeTruthState: string;
  readonly ambiguityState: string;
  readonly receiptDigest: string;
  readonly settledAt: string;
}

export interface TimelineEvent {
  readonly eventId: string;
  readonly family: SimulatorFamilyCode;
  readonly eventType: string;
  readonly label: string;
  readonly detail: string;
  readonly scenarioRef: string | null;
  readonly correlationKey: string;
  readonly tone: TimelineTone;
  readonly at: string;
}

export interface ScenarioSeed {
  readonly seedId: string;
  readonly family: SimulatorFamilyCode;
  readonly label: string;
  readonly description: string;
  readonly routeFamilyRefs: readonly string[];
  readonly replayClass: ReplayClass;
  readonly failureMode: FailureMode;
  readonly sourceRefs: readonly string[];
}

export interface FamilyControlState {
  readonly family: SimulatorFamilyCode;
  readonly label: string;
  readonly accent: string;
  readonly adapterContractProfileRef: string;
  readonly simulatorContractRef: string;
  readonly routeFamilyRefs: readonly string[];
  running: boolean;
  failureMode: FailureMode;
}

export interface NhsLoginAuthSession {
  readonly authSessionRef: string;
  readonly scenarioId: string;
  readonly routeBindingId: string;
  readonly routeFamilyRef: string;
  readonly clientId: string;
  readonly userId: string;
  readonly returnIntent: string;
  readonly stateDigest: string;
  readonly nonceDigest: string;
  readonly pkceDigest: string;
  readonly authCode: string | null;
  readonly callbackPayload: Record<string, unknown>;
  readonly subjectClaims: Record<string, unknown>;
  readonly createdAt: string;
  callbackDeliveredAt: string | null;
  tokenIdempotencyKey: string | null;
  tokenPayload: Record<string, unknown> | null;
}

export interface Im1Slot {
  readonly slotRef: string;
  readonly providerSupplierId: string;
  readonly siteRef: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly mode: "video" | "telephone" | "in_person";
  holdRef: string | null;
}

export interface Im1Hold {
  readonly holdRef: string;
  readonly slotRef: string;
  readonly patientRef: string;
  readonly providerSupplierId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  state: "held" | "committed" | "released" | "expired";
}

export interface Im1Appointment {
  readonly appointmentRef: string;
  readonly providerSupplierId: string;
  readonly slotRef: string;
  readonly holdRef: string;
  readonly patientRef: string;
  readonly confirmationTruthState: "confirmed" | "pending_external_confirmation" | "cancelled";
  readonly externalConfirmationGateState: "none" | "open";
  readonly createdAt: string;
  readonly lastAction: "commit" | "reschedule" | "cancel";
}

export interface MeshMessage {
  readonly messageRef: string;
  readonly workflowId: string;
  readonly fromMailboxKey: string;
  readonly toMailboxKey: string;
  readonly scenarioId: string;
  readonly correlationDigest: string;
  readonly hashDigest: string;
  readonly createdAt: string;
  receiptState: "accepted" | "delayed_ack" | "duplicate_delivery" | "picked_up" | "dead_letter";
  events: TimelineEvent[];
}

export interface TelephonyCallSession {
  readonly callRef: string;
  readonly scenarioId: string;
  readonly numberId: string;
  readonly createdAt: string;
  status: string;
  transcriptState: string;
  recordingState: string;
  continuationState: string;
  urgentState: string;
  webhookState: string;
  canAdvance: boolean;
  canRetryWebhook: boolean;
}

export interface NotificationDelivery {
  readonly messageRef: string;
  readonly scenarioId: string;
  readonly templateId: string;
  readonly recipientRef: string;
  readonly createdAt: string;
  channel: string;
  deliveryEvidenceState: string;
  deliveryRiskState: string;
  authoritativeOutcomeState: string;
  repairState: string;
  webhookSignatureState: string;
  disputeState: string;
  canRetryWebhook: boolean;
  canRepair: boolean;
  canSettle: boolean;
}

export interface ReachabilityObservation {
  readonly observationRef: string;
  readonly dependencyRef: string;
  readonly messageRef: string;
  readonly observationType: string;
  readonly routeAuthorityRef: string;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
}

export interface SimulatorDeckSummary {
  readonly generatedAt: string;
  readonly simulatorHealth: number;
  readonly seededScenarios: number;
  readonly replayInjections: number;
  readonly blockedFlows: number;
}

export interface SimulatorDeckRow {
  readonly family: SimulatorFamilyCode;
  readonly label: string;
  readonly status: SimulatorStatus;
  readonly failureMode: FailureMode;
  readonly running: boolean;
  readonly routeFamilyRefs: readonly string[];
  readonly adapterContractProfileRef: string;
  readonly simulatorContractRef: string;
  readonly activeObjects: number;
  readonly blockedFlows: number;
  readonly replayCount: number;
  readonly accent: string;
}

export interface SimulatorDeckSnapshot {
  readonly summary: SimulatorDeckSummary;
  readonly families: readonly SimulatorDeckRow[];
  readonly scenarioSeeds: readonly ScenarioSeed[];
  readonly timeline: readonly TimelineEvent[];
  readonly reachabilityObservations: readonly ReachabilityObservation[];
}

export interface RuntimeStateSnapshot {
  readonly families: readonly SimulatorDeckRow[];
  readonly timeline: readonly TimelineEvent[];
  readonly nhsLoginSessions: readonly NhsLoginAuthSession[];
  readonly im1Slots: readonly Im1Slot[];
  readonly im1Holds: readonly Im1Hold[];
  readonly im1Appointments: readonly Im1Appointment[];
  readonly meshMessages: readonly MeshMessage[];
  readonly telephonyCalls: readonly TelephonyCallSession[];
  readonly notifications: readonly NotificationDelivery[];
  readonly reachabilityObservations: readonly ReachabilityObservation[];
}

export interface NhsLoginFlowInput {
  readonly scenarioId: string;
  readonly routeBindingId: string;
  readonly clientId: string;
  readonly userId: string;
  readonly returnIntent: string;
}

export interface Im1SearchInput {
  readonly providerSupplierId: string;
  readonly patientRef: string;
}

export interface Im1HoldInput {
  readonly slotRef: string;
  readonly patientRef: string;
}

export interface Im1CommitInput {
  readonly holdRef: string;
  readonly patientRef: string;
  readonly scenarioId: "confirmed" | "ambiguous_confirmation" | "timeout_recovery";
}

export interface Im1ManageInput {
  readonly appointmentRef: string;
  readonly action: "reschedule" | "cancel";
  readonly replacementSlotRef?: string;
}

export interface MeshDispatchInput {
  readonly workflowId: string;
  readonly fromMailboxKey: string;
  readonly toMailboxKey: string;
  readonly scenarioId: string;
  readonly summary: string;
}

export interface TelephonyStartInput {
  readonly scenarioId: string;
  readonly numberId: string;
  readonly callerRef: string;
}

export interface NotificationSendInput {
  readonly scenarioId: string;
  readonly templateId: string;
  readonly recipientRef: string;
}

export interface SimulatorOperationResult<TPayload> {
  readonly dispatchAttempt: AdapterDispatchAttempt;
  readonly receiptCheckpoint: AdapterReceiptCheckpoint;
  readonly payload: TPayload;
  readonly exactReplay: boolean;
}

interface OperationLedgerEntry<TPayload> {
  readonly replayKey: string;
  readonly dispatchAttempt: AdapterDispatchAttempt;
  readonly receiptCheckpoint: AdapterReceiptCheckpoint;
  readonly payload: TPayload;
}

interface NhsLoginPack {
  readonly task_id: string;
  readonly visual_mode: string;
  readonly route_bindings: readonly {
    readonly route_binding_id: string;
    readonly route_family_id: string;
    readonly display_name: string;
    readonly return_intent_key: string;
  }[];
  readonly test_users: readonly {
    readonly user_id: string;
    readonly alias: string;
    readonly email: string;
    readonly verification_level: string;
    readonly vot: string;
    readonly im1_ready: boolean;
  }[];
  readonly auth_scenarios: readonly {
    readonly scenario_id: string;
    readonly label: string;
    readonly outcome: string;
    readonly return_state: string;
    readonly reason_code: string;
  }[];
  readonly mock_clients: readonly {
    readonly client_id: string;
    readonly friendly_name: string;
    readonly route_binding_ids: readonly string[];
    readonly test_user_ids: readonly string[];
  }[];
}

interface Im1Pack {
  readonly task_id: string;
  readonly visual_mode: string;
  readonly provider_register: {
    readonly providers: readonly {
      readonly provider_supplier_id: string;
      readonly provider_supplier_name: string;
      readonly supplier_code: string;
      readonly targeted_for_vecells: boolean;
    }[];
  };
}

interface MeshPack {
  readonly task_id: string;
  readonly visual_mode: string;
  readonly mailboxes: readonly {
    readonly mailbox_key: string;
    readonly display_name: string;
  }[];
  readonly workflow_rows: readonly {
    readonly workflow_id: string;
    readonly bounded_route_refs: string;
  }[];
  readonly mock_service: {
    readonly scenarios: readonly {
      readonly scenario_id: string;
      readonly label: string;
      readonly description: string;
    }[];
    readonly seeded_messages: readonly {
      readonly message_id: string;
      readonly workflow_id: string;
      readonly from_mailbox_key: string;
      readonly to_mailbox_key: string;
      readonly scenario_id: string;
      readonly created_at: string;
      readonly summary: string;
    }[];
  };
}

interface TelephonyPack {
  readonly task_id: string;
  readonly visual_mode: string;
  readonly number_inventory: readonly {
    readonly number_id: string;
    readonly e164_or_placeholder: string;
  }[];
  readonly call_scenarios: readonly {
    readonly scenario_id: string;
    readonly label: string;
    readonly terminal_state: string;
    readonly summary: string;
    readonly recording_state: string;
    readonly transcript_state: string;
    readonly continuation_state: string;
    readonly urgent_state: string;
    readonly webhook_state: string;
  }[];
  readonly seeded_calls: readonly {
    readonly call_id: string;
    readonly scenario_id: string;
    readonly number_id: string;
    readonly created_at: string;
    readonly status: string;
    readonly transcript_state: string;
    readonly recording_state: string;
    readonly continuation_state: string;
    readonly urgent_state: string;
    readonly webhook_state: string;
    readonly can_advance: boolean;
    readonly can_retry_webhook: boolean;
  }[];
}

interface NotificationPack {
  readonly task_id: string;
  readonly visual_mode: string;
  readonly template_registry: readonly {
    readonly template_id: string;
    readonly channel: string;
  }[];
  readonly delivery_scenarios: readonly {
    readonly scenario_id: string;
    readonly channel: string;
    readonly default_template_id: string;
    readonly delivery_evidence_state: string;
    readonly delivery_risk_state: string;
    readonly authoritative_outcome_state: string;
    readonly repair_state: string;
    readonly webhook_signature_state: string;
    readonly dispute_state: string;
    readonly can_retry_webhook: boolean;
    readonly can_repair: boolean;
    readonly can_settle: boolean;
  }[];
  readonly seeded_messages: readonly {
    readonly message_id: string;
    readonly scenario_id: string;
    readonly template_id: string;
    readonly recipient_ref: string;
    readonly created_at: string;
    readonly channel: string;
    readonly delivery_evidence_state: string;
    readonly delivery_risk_state: string;
    readonly authoritative_outcome_state: string;
    readonly repair_state: string;
    readonly webhook_signature_state: string;
    readonly dispute_state: string;
    readonly can_retry_webhook: boolean;
    readonly can_repair: boolean;
    readonly can_settle: boolean;
  }[];
}

interface FixtureCatalog {
  readonly auth: {
    readonly routes: NhsLoginPack["route_bindings"];
    readonly users: NhsLoginPack["test_users"];
    readonly scenarios: NhsLoginPack["auth_scenarios"];
    readonly clients: NhsLoginPack["mock_clients"];
  };
  readonly im1: {
    readonly providers: Im1Pack["provider_register"]["providers"];
  };
  readonly mesh: {
    readonly mailboxes: MeshPack["mailboxes"];
    readonly workflows: MeshPack["workflow_rows"];
    readonly scenarios: MeshPack["mock_service"]["scenarios"];
    readonly seededMessages: MeshPack["mock_service"]["seeded_messages"];
  };
  readonly telephony: {
    readonly numbers: TelephonyPack["number_inventory"];
    readonly scenarios: TelephonyPack["call_scenarios"];
    readonly seededCalls: TelephonyPack["seeded_calls"];
  };
  readonly notifications: {
    readonly templates: NotificationPack["template_registry"];
    readonly scenarios: NotificationPack["delivery_scenarios"];
    readonly seededMessages: NotificationPack["seeded_messages"];
  };
}

interface RuntimeMutableState {
  readonly families: Record<SimulatorFamilyCode, FamilyControlState>;
  readonly operationLedger: Map<string, OperationLedgerEntry<unknown>>;
  readonly timeline: TimelineEvent[];
  readonly nhsLoginSessions: Map<string, NhsLoginAuthSession>;
  readonly authCodes: Map<string, string>;
  readonly im1Slots: Map<string, Im1Slot>;
  readonly im1Holds: Map<string, Im1Hold>;
  readonly im1Appointments: Map<string, Im1Appointment>;
  readonly meshMessages: Map<string, MeshMessage>;
  readonly telephonyCalls: Map<string, TelephonyCallSession>;
  readonly notifications: Map<string, NotificationDelivery>;
  readonly reachabilityObservations: Map<string, ReachabilityObservation>;
  readonly replayCounts: Record<SimulatorFamilyCode, number>;
  readonly blockedCounts: Record<SimulatorFamilyCode, number>;
}

const FIXED_CLOCK_START = "2026-04-12T08:00:00.000Z";
const FAMILY_ORDER: readonly SimulatorFamilyCode[] = [
  "nhs_login",
  "im1_gp",
  "mesh",
  "telephony",
  "notifications",
];
const FAMILY_METADATA: Record<
  SimulatorFamilyCode,
  {
    readonly label: string;
    readonly accent: string;
    readonly adapterContractProfileRef: string;
    readonly simulatorContractRef: string;
    readonly routeFamilyRefs: readonly string[];
    readonly sourceRefs: readonly string[];
  }
> = {
  nhs_login: {
    label: "NHS login-like redirect",
    accent: "#2563EB",
    adapterContractProfileRef: "ACP_083_NHS_LOGIN_REDIRECT_V1",
    simulatorContractRef: "sim_nhs_login_auth_session_twin",
    routeFamilyRefs: [
      "rf_intake_self_service",
      "rf_patient_requests",
      "rf_patient_secure_link_recovery",
    ],
    sourceRefs: [
      "data/analysis/nhs_login_capture_pack.json",
      "docs/external/25_nhs_login_mock_service_spec.md",
    ],
  },
  im1_gp: {
    label: "IM1 / GP integration",
    accent: "#0EA5A4",
    adapterContractProfileRef: "ACP_083_IM1_GP_PROVIDER_V1",
    simulatorContractRef: "sim_im1_principal_system_emis_twin",
    routeFamilyRefs: ["rf_patient_appointments", "rf_staff_workspace"],
    sourceRefs: [
      "data/analysis/im1_pairing_pack.json",
      "docs/external/26_im1_pairing_rehearsal_strategy.md",
    ],
  },
  mesh: {
    label: "MESH-style mailbox transport",
    accent: "#7C3AED",
    adapterContractProfileRef: "ACP_083_MESH_MAILBOX_TRANSPORT_V1",
    simulatorContractRef: "sim_mesh_message_path_twin",
    routeFamilyRefs: ["rf_hub_case_management", "rf_pharmacy_console", "rf_support_replay_observe"],
    sourceRefs: [
      "data/analysis/mesh_execution_pack.json",
      "docs/external/28_mesh_mock_mailroom_spec.md",
    ],
  },
  telephony: {
    label: "Telephony / IVR / transcript",
    accent: "#D97706",
    adapterContractProfileRef: "ACP_083_TELEPHONY_INGRESS_CALLBACK_V1",
    simulatorContractRef: "sim_telephony_ivr_twin",
    routeFamilyRefs: ["rf_intake_telephony_capture", "rf_patient_secure_link_recovery"],
    sourceRefs: [
      "data/analysis/32_telephony_lab_pack.json",
      "docs/external/32_local_telephony_lab_spec.md",
    ],
  },
  notifications: {
    label: "SMS / email delivery",
    accent: "#059669",
    adapterContractProfileRef: "ACP_083_NOTIFICATION_DELIVERY_V1",
    simulatorContractRef: "sim_sms_delivery_twin",
    routeFamilyRefs: ["rf_patient_messages", "rf_support_ticket_workspace"],
    sourceRefs: [
      "data/analysis/33_notification_studio_pack.json",
      "docs/external/33_local_notification_studio_spec.md",
    ],
  },
};

const PARALLEL_INTERFACE_GAPS = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_IM1_RECORD_LOOKUP_BOUNDARY",
    title: "IM1 record lookup and update remains bounded to booking-adjacent seams only",
    boundedFallback:
      "par_083 simulates capability, slot, hold, commit, reschedule, and cancel flows now; broader patient-record mutation stays out of scope until a canonical adapter profile exists.",
  },
] as const;

export class SimulatorError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hashParts(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("::")).digest("hex");
}

function repoRootFrom(importMetaUrl: string): string {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), "..", "..", "..");
}

function readJson<T>(rootDir: string, relativePath: string): T {
  const targetPath = path.join(rootDir, relativePath);
  return JSON.parse(fs.readFileSync(targetPath, "utf8")) as T;
}

function statusForFamily(control: FamilyControlState): SimulatorStatus {
  if (!control.running) {
    return "stopped";
  }
  return control.failureMode === "healthy" ? "running" : "degraded";
}

function toneForFailureMode(mode: FailureMode): TimelineTone {
  if (mode === "blocked" || mode === "timeout") {
    return "blocked";
  }
  if (mode === "duplicate" || mode === "drift" || mode === "weak_confirmation") {
    return "caution";
  }
  if (mode === "delay") {
    return "review";
  }
  return "default";
}

function callbackTimingClassForFailureMode(mode: FailureMode): CallbackTimingClass {
  switch (mode) {
    case "delay":
      return "delayed_short";
    case "timeout":
      return "delayed_long";
    case "drift":
      return "out_of_order";
    case "blocked":
      return "expired";
    default:
      return "inline";
  }
}

function replayClassForFailureMode(mode: FailureMode): ReplayClass {
  switch (mode) {
    case "duplicate":
      return "duplicate_delivery";
    case "drift":
      return "stale_callback";
    case "timeout":
      return "timeout_resume";
    default:
      return "exact_replay";
  }
}

function buildFixtureCatalog(rootDir: string): FixtureCatalog {
  const nhsLogin = readJson<NhsLoginPack>(rootDir, "data/analysis/nhs_login_capture_pack.json");
  const im1 = readJson<Im1Pack>(rootDir, "data/analysis/im1_pairing_pack.json");
  const mesh = readJson<MeshPack>(rootDir, "data/analysis/mesh_execution_pack.json");
  const telephony = readJson<TelephonyPack>(rootDir, "data/analysis/32_telephony_lab_pack.json");
  const notifications = readJson<NotificationPack>(
    rootDir,
    "data/analysis/33_notification_studio_pack.json",
  );

  return {
    auth: {
      routes: nhsLogin.route_bindings,
      users: nhsLogin.test_users,
      scenarios: nhsLogin.auth_scenarios,
      clients: nhsLogin.mock_clients,
    },
    im1: {
      providers: im1.provider_register.providers.filter((row) => row.targeted_for_vecells),
    },
    mesh: {
      mailboxes: mesh.mailboxes,
      workflows: mesh.workflow_rows,
      scenarios: mesh.mock_service.scenarios,
      seededMessages: mesh.mock_service.seeded_messages,
    },
    telephony: {
      numbers: telephony.number_inventory,
      scenarios: telephony.call_scenarios,
      seededCalls: telephony.seeded_calls,
    },
    notifications: {
      templates: notifications.template_registry,
      scenarios: notifications.delivery_scenarios,
      seededMessages: notifications.seeded_messages,
    },
  };
}

function buildScenarioSeeds(): readonly ScenarioSeed[] {
  return [
    {
      seedId: "seed_web_auth_uplift",
      family: "nhs_login",
      label: "Web intake auth uplift",
      description:
        "Redirect, state, nonce, PKCE, and callback replay stay exact while the post-auth return intent remains attached to the same patient shell.",
      routeFamilyRefs: ["rf_intake_self_service", "rf_patient_requests"],
      replayClass: "exact_replay",
      failureMode: "healthy",
      sourceRefs: ["prompt/083.md", "data/analysis/nhs_login_capture_pack.json"],
    },
    {
      seedId: "seed_callback_replay",
      family: "nhs_login",
      label: "OIDC callback replay fence",
      description:
        "One code redemption settles once, then exact replay returns the prior settlement while foreign reuse remains blocked.",
      routeFamilyRefs: ["rf_patient_secure_link_recovery"],
      replayClass: "exact_replay",
      failureMode: "duplicate",
      sourceRefs: ["prompt/083.md", "docs/external/24_nhs_login_manual_checkpoint_register.md"],
    },
    {
      seedId: "seed_im1_booking_ambiguity",
      family: "im1_gp",
      label: "IM1 ambiguous booking commit",
      description:
        "Capability search, hold, and commit run locally while weak confirmation still opens an explicit ExternalConfirmationGate instead of implying booked calmness.",
      routeFamilyRefs: ["rf_patient_appointments"],
      replayClass: "timeout_resume",
      failureMode: "weak_confirmation",
      sourceRefs: ["prompt/083.md", "data/analysis/im1_pairing_pack.json"],
    },
    {
      seedId: "seed_mesh_duplicate_receipt",
      family: "mesh",
      label: "MESH delayed acknowledgement and duplicate receipt",
      description:
        "Mailbox transport preserves correlation digests, pickup delay, duplicate correlation, and replay-safe proof debt.",
      routeFamilyRefs: ["rf_hub_case_management", "rf_pharmacy_console"],
      replayClass: "duplicate_delivery",
      failureMode: "delay",
      sourceRefs: ["prompt/083.md", "data/analysis/mesh_execution_pack.json"],
    },
    {
      seedId: "seed_phone_continuation",
      family: "telephony",
      label: "Phone continuation with webhook drift",
      description:
        "Call capture, urgent-live flags, recording, transcript readiness, and continuation eligibility remain canonical even when callbacks arrive late or duplicated.",
      routeFamilyRefs: ["rf_intake_telephony_capture"],
      replayClass: "stale_callback",
      failureMode: "drift",
      sourceRefs: ["prompt/083.md", "data/analysis/32_telephony_lab_pack.json"],
    },
    {
      seedId: "seed_reachability_repair",
      family: "notifications",
      label: "Notification reachability repair",
      description:
        "SMS and email delivery, dispute, opt-out, and repair emit ReachabilityObservation shapes that the canonical repair path can consume later without translation.",
      routeFamilyRefs: ["rf_patient_messages", "rf_support_ticket_workspace"],
      replayClass: "exact_replay",
      failureMode: "blocked",
      sourceRefs: ["prompt/083.md", "data/analysis/33_notification_studio_pack.json"],
    },
  ];
}

export class SimulatorBackplaneRuntime {
  private readonly rootDir: string;
  private readonly fixtureCatalog: FixtureCatalog;
  private readonly scenarioSeeds: readonly ScenarioSeed[];
  private clockTick = 0;
  private counters = new Map<string, number>();
  private state: RuntimeMutableState;

  constructor(options?: { readonly rootDir?: string }) {
    this.rootDir = options?.rootDir ?? repoRootFrom(import.meta.url);
    this.fixtureCatalog = buildFixtureCatalog(this.rootDir);
    this.scenarioSeeds = buildScenarioSeeds();
    this.state = this.makeEmptyState();
    this.reset();
  }

  getParallelInterfaceGaps() {
    return clone(PARALLEL_INTERFACE_GAPS);
  }

  reset(): RuntimeStateSnapshot {
    this.clockTick = 0;
    this.counters.clear();
    this.state = this.makeEmptyState();
    this.seedMeshMessages();
    this.seedTelephonyCalls();
    this.seedNotificationMessages();
    this.seedIm1Slots();
    this.pushTimeline({
      family: "nhs_login",
      eventType: "stack_reset",
      label: "Stack reset",
      detail: "Unified simulator backplane reset to the deterministic fixture pack.",
      scenarioRef: null,
      correlationKey: "stack::reset",
      tone: "success",
    });
    return this.getStateSnapshot();
  }

  reseed(seedId?: string): RuntimeStateSnapshot {
    this.reset();
    if (seedId) {
      this.runScenarioSeed(seedId);
    }
    return this.getStateSnapshot();
  }

  start(family?: SimulatorFamilyCode): SimulatorDeckSnapshot {
    this.forEachFamily(family, (control) => {
      control.running = true;
      control.failureMode = control.failureMode === "blocked" ? "healthy" : control.failureMode;
      this.pushTimeline({
        family: control.family,
        eventType: "simulator_started",
        label: `${control.label} started`,
        detail: "The simulator family is running and ready for deterministic replay.",
        scenarioRef: null,
        correlationKey: `${control.family}::start`,
        tone: "success",
      });
    });
    return this.getDeckSnapshot();
  }

  stop(family?: SimulatorFamilyCode): SimulatorDeckSnapshot {
    this.forEachFamily(family, (control) => {
      control.running = false;
      this.pushTimeline({
        family: control.family,
        eventType: "simulator_stopped",
        label: `${control.label} stopped`,
        detail: "The simulator family is now fenced and will reject new control-plane actions.",
        scenarioRef: null,
        correlationKey: `${control.family}::stop`,
        tone: "blocked",
      });
    });
    return this.getDeckSnapshot();
  }

  setFailureMode(family: SimulatorFamilyCode, failureMode: FailureMode): SimulatorDeckSnapshot {
    const control = this.state.families[family];
    control.failureMode = failureMode;
    this.pushTimeline({
      family,
      eventType: "failure_mode_changed",
      label: `${control.label} set to ${failureMode}`,
      detail:
        failureMode === "healthy"
          ? "Failure injection cleared."
          : `Failure injection now simulates ${failureMode} behavior for adapter receipts and callbacks.`,
      scenarioRef: null,
      correlationKey: `${family}::${failureMode}`,
      tone: toneForFailureMode(failureMode),
    });
    return this.getDeckSnapshot();
  }

  runScenarioSeed(seedId: string): SimulatorDeckSnapshot {
    const seed = this.scenarioSeeds.find((item) => item.seedId === seedId);
    if (!seed) {
      throw new SimulatorError(404, "UNKNOWN_SCENARIO_SEED", `Unknown scenario seed ${seedId}.`);
    }

    const originalMode = this.state.families[seed.family].failureMode;
    this.state.families[seed.family].failureMode = seed.failureMode;
    try {
      switch (seed.seedId) {
        case "seed_web_auth_uplift": {
          const started = this.beginAuthFlow({
            scenarioId: "happy_path",
            routeBindingId: this.fixtureCatalog.auth.routes[0]!.route_binding_id,
            clientId: this.fixtureCatalog.auth.clients[0]!.client_id,
            userId: this.fixtureCatalog.auth.users[0]!.user_id,
            returnIntent: "patient.intake.upgrade",
          });
          this.deliverAuthCallback(started.payload.authSessionRef);
          this.redeemAuthCode({
            authSessionRef: started.payload.authSessionRef,
            idempotencyKey: "redeem::seed_web_auth_uplift",
          });
          break;
        }
        case "seed_callback_replay": {
          const started = this.beginAuthFlow({
            scenarioId: "happy_path",
            routeBindingId: this.fixtureCatalog.auth.routes[1]!.route_binding_id,
            clientId: this.fixtureCatalog.auth.clients[0]!.client_id,
            userId: this.fixtureCatalog.auth.users[1]!.user_id,
            returnIntent: "patient.requests.resume",
          });
          this.deliverAuthCallback(started.payload.authSessionRef);
          this.redeemAuthCode({
            authSessionRef: started.payload.authSessionRef,
            idempotencyKey: "redeem::seed_callback_replay",
          });
          this.redeemAuthCode({
            authSessionRef: started.payload.authSessionRef,
            idempotencyKey: "redeem::seed_callback_replay",
          });
          break;
        }
        case "seed_im1_booking_ambiguity": {
          const search = this.searchIm1Slots({
            providerSupplierId: this.fixtureCatalog.im1.providers[0]!.provider_supplier_id,
            patientRef: "PATIENT:IM1:SEED",
          });
          const firstSlot = search.payload.slots[0];
          if (!firstSlot) {
            throw new SimulatorError(
              409,
              "NO_SLOT_AVAILABLE",
              "No IM1 slot was available to seed.",
            );
          }
          const hold = this.holdIm1Slot({
            slotRef: firstSlot.slotRef,
            patientRef: "PATIENT:IM1:SEED",
          });
          this.commitIm1Booking({
            holdRef: hold.payload.hold.holdRef,
            patientRef: "PATIENT:IM1:SEED",
            scenarioId: "ambiguous_confirmation",
          });
          break;
        }
        case "seed_mesh_duplicate_receipt": {
          const message = this.dispatchMeshMessage({
            workflowId: this.fixtureCatalog.mesh.workflows[0]!.workflow_id,
            fromMailboxKey: this.fixtureCatalog.mesh.mailboxes[0]!.mailbox_key,
            toMailboxKey: this.fixtureCatalog.mesh.mailboxes[1]!.mailbox_key,
            scenarioId: "duplicate_delivery",
            summary: "Seeded duplicate receipt transport message",
          });
          this.acknowledgeMeshMessage(message.payload.message.messageRef);
          break;
        }
        case "seed_phone_continuation": {
          const call = this.startTelephonyCall({
            scenarioId: "webhook_signature_retry",
            numberId: this.fixtureCatalog.telephony.numbers[0]!.number_id,
            callerRef: "caller:seed:continuation",
          });
          this.emitTelephonyWebhook(call.payload.call.callRef);
          this.retryTelephonyWebhook(call.payload.call.callRef);
          break;
        }
        case "seed_reachability_repair": {
          const message = this.sendNotification({
            scenarioId: "sms_wrong_recipient_disputed",
            templateId: this.fixtureCatalog.notifications.templates.find(
              (row) => row.channel === "sms",
            )!.template_id,
            recipientRef: "synthetic:recipient:repair",
          });
          this.repairNotification(message.payload.message.messageRef);
          break;
        }
        default:
          break;
      }
    } finally {
      this.state.families[seed.family].failureMode = originalMode;
    }

    this.pushTimeline({
      family: seed.family,
      eventType: "scenario_seed_completed",
      label: `${seed.label} reseeded`,
      detail: seed.description,
      scenarioRef: seed.seedId,
      correlationKey: seed.seedId,
      tone: "success",
    });
    return this.getDeckSnapshot();
  }

  beginAuthFlow(input: NhsLoginFlowInput): SimulatorOperationResult<{
    authSessionRef: string;
    callbackPayload: Record<string, unknown>;
  }> {
    this.ensureFamilyRunning("nhs_login");
    const routeBinding = this.fixtureCatalog.auth.routes.find(
      (row) => row.route_binding_id === input.routeBindingId,
    );
    const scenario = this.fixtureCatalog.auth.scenarios.find(
      (row) => row.scenario_id === input.scenarioId,
    );
    const client = this.fixtureCatalog.auth.clients.find((row) => row.client_id === input.clientId);
    const user = this.fixtureCatalog.auth.users.find((row) => row.user_id === input.userId);

    if (!routeBinding || !scenario || !client || !user) {
      throw new SimulatorError(422, "OIDC_INPUT_INVALID", "Auth flow references unknown fixtures.");
    }

    const authSessionRef = this.nextId("AUTH");
    const callbackPayload =
      scenario.outcome === "success" || scenario.outcome === "conditional_success"
        ? {
            code: `${authSessionRef}-CODE`,
            state: hashParts([authSessionRef, "state"]).slice(0, 24),
            return_intent: input.returnIntent,
            reason_code: scenario.reason_code,
          }
        : {
            error: scenario.reason_code,
            error_description: scenario.label,
            return_state: scenario.return_state,
            return_intent: input.returnIntent,
          };
    const authCode = "code" in callbackPayload ? String(callbackPayload.code) : null;
    const session: NhsLoginAuthSession = {
      authSessionRef,
      scenarioId: scenario.scenario_id,
      routeBindingId: routeBinding.route_binding_id,
      routeFamilyRef: routeBinding.route_family_id,
      clientId: client.client_id,
      userId: user.user_id,
      returnIntent: input.returnIntent,
      stateDigest: hashParts([authSessionRef, routeBinding.route_binding_id, "state"]).slice(0, 24),
      nonceDigest: hashParts([authSessionRef, "nonce"]).slice(0, 24),
      pkceDigest: hashParts([authSessionRef, "pkce"]).slice(0, 32),
      authCode,
      callbackPayload,
      subjectClaims: {
        subject_ref: hashParts([user.user_id, client.client_id]).slice(0, 20),
        nhs_number_like: `999${hashParts([user.user_id]).slice(0, 7)}`,
        age_band: user.verification_level === "P9" ? "adult_verified" : "adult_basic",
        email: user.email,
        contact_claim: `${user.alias}@contact.mock.vecells.local`,
        im1_ready: user.im1_ready,
      },
      createdAt: this.nextIso(),
      callbackDeliveredAt: null,
      tokenIdempotencyKey: null,
      tokenPayload: null,
    };
    this.state.nhsLoginSessions.set(authSessionRef, session);
    if (authCode) {
      this.state.authCodes.set(authCode, authSessionRef);
    }
    const result = this.recordOperation({
      family: "nhs_login",
      operation: "authorize",
      replayKey: `oidc::authorize::${authSessionRef}`,
      routeFamilyRef: routeBinding.route_family_id,
      governingObjectRef: authSessionRef,
      status: "accepted",
      ambiguityState: scenario.return_state,
      authoritativeTruthState:
        scenario.outcome === "success" ? "callback_pending" : "callback_error_pending",
      payload: { authSessionRef, callbackPayload },
    });
    this.pushTimeline({
      family: "nhs_login",
      eventType: "auth_flow_started",
      label: "Auth flow started",
      detail: `${scenario.label} opened for ${routeBinding.display_name}.`,
      scenarioRef: scenario.scenario_id,
      correlationKey: authSessionRef,
      tone: "default",
    });
    return result;
  }

  deliverAuthCallback(authSessionRef: string): SimulatorOperationResult<{
    authSessionRef: string;
    callbackPayload: Record<string, unknown>;
  }> {
    this.ensureFamilyRunning("nhs_login");
    const session = this.state.nhsLoginSessions.get(authSessionRef);
    if (!session) {
      throw new SimulatorError(404, "AUTH_SESSION_NOT_FOUND", "Unknown auth session.");
    }
    session.callbackDeliveredAt ??= this.nextIso();
    const scenario = this.fixtureCatalog.auth.scenarios.find(
      (row) => row.scenario_id === session.scenarioId,
    );
    const failureMode = this.state.families.nhs_login.failureMode;
    const result = this.recordOperation({
      family: "nhs_login",
      operation: "callback",
      replayKey: `oidc::callback::${authSessionRef}`,
      routeFamilyRef: session.routeFamilyRef,
      governingObjectRef: authSessionRef,
      status:
        scenario?.outcome === "success" || scenario?.outcome === "conditional_success"
          ? "settled"
          : "blocked",
      ambiguityState: scenario?.return_state ?? "unknown",
      authoritativeTruthState:
        scenario?.outcome === "success" || scenario?.outcome === "conditional_success"
          ? "callback_received"
          : "callback_denied",
      payload: { authSessionRef: session.authSessionRef, callbackPayload: session.callbackPayload },
      callbackTimingClass: callbackTimingClassForFailureMode(failureMode),
      replayClass: "exact_replay",
    });
    this.pushTimeline({
      family: "nhs_login",
      eventType: "auth_callback_delivered",
      label: "Callback delivered",
      detail: `Callback for ${session.authSessionRef} returned ${scenario?.reason_code ?? "unknown_reason"}.`,
      scenarioRef: session.scenarioId,
      correlationKey: session.authSessionRef,
      tone:
        scenario?.outcome === "success" || scenario?.outcome === "conditional_success"
          ? "success"
          : "blocked",
    });
    return result;
  }

  replayAuthCallback(authSessionRef: string): SimulatorOperationResult<{
    authSessionRef: string;
    callbackPayload: Record<string, unknown>;
  }> {
    return this.deliverAuthCallback(authSessionRef);
  }

  redeemAuthCode(input: {
    readonly authSessionRef: string;
    readonly idempotencyKey: string;
  }): SimulatorOperationResult<{ accessToken: string; subjectClaims: Record<string, unknown> }> {
    this.ensureFamilyRunning("nhs_login");
    const session = this.state.nhsLoginSessions.get(input.authSessionRef);
    if (!session || !session.authCode) {
      throw new SimulatorError(
        404,
        "AUTH_CODE_NOT_FOUND",
        "No redeemable auth code exists for this session.",
      );
    }
    if (!session.callbackDeliveredAt) {
      throw new SimulatorError(
        409,
        "AUTH_CALLBACK_MISSING",
        "Callback must be delivered before token redemption.",
      );
    }
    if (session.tokenPayload && session.tokenIdempotencyKey !== input.idempotencyKey) {
      throw new SimulatorError(
        409,
        "AUTH_CODE_ALREADY_REDEEMED",
        "The auth code was already redeemed under a different idempotency key.",
      );
    }
    const replayKey = `oidc::token::${session.authSessionRef}::${input.idempotencyKey}`;
    const accessToken = hashParts([session.authCode, input.idempotencyKey]).slice(0, 32);
    const payload = {
      accessToken,
      subjectClaims: session.subjectClaims,
    };
    session.tokenIdempotencyKey = input.idempotencyKey;
    session.tokenPayload = payload;
    const result = this.recordOperation({
      family: "nhs_login",
      operation: "token",
      replayKey,
      routeFamilyRef: session.routeFamilyRef,
      governingObjectRef: session.authSessionRef,
      status: "settled",
      ambiguityState: "none",
      authoritativeTruthState: "local_session_read_only",
      payload,
      replayClass: "exact_replay",
    });
    this.pushTimeline({
      family: "nhs_login",
      eventType: "token_redeemed",
      label: result.exactReplay ? "Token exact replay returned" : "Token redeemed",
      detail:
        "Auth redemption returns a read-only local session posture until canonical identity and grants settle.",
      scenarioRef: session.scenarioId,
      correlationKey: session.authSessionRef,
      tone: result.exactReplay ? "review" : "success",
    });
    return result;
  }

  searchIm1Slots(
    input: Im1SearchInput,
  ): SimulatorOperationResult<{ slots: readonly Im1Slot[]; providerSupplierId: string }> {
    this.ensureFamilyRunning("im1_gp");
    const provider = this.fixtureCatalog.im1.providers.find(
      (row) => row.provider_supplier_id === input.providerSupplierId,
    );
    if (!provider) {
      throw new SimulatorError(404, "IM1_PROVIDER_NOT_FOUND", "Unknown IM1 provider supplier.");
    }
    const slots = [...this.state.im1Slots.values()].filter(
      (slot) => slot.providerSupplierId === provider.provider_supplier_id,
    );
    const failureMode = this.state.families.im1_gp.failureMode;
    const status = failureMode === "timeout" ? "pending" : "accepted";
    const result = this.recordOperation({
      family: "im1_gp",
      operation: "slot_search",
      replayKey: `im1::search::${provider.provider_supplier_id}::${input.patientRef}`,
      routeFamilyRef: "rf_patient_appointments",
      governingObjectRef: input.patientRef,
      status,
      ambiguityState: failureMode === "drift" ? "stale_read" : "none",
      authoritativeTruthState:
        status === "pending" ? "provider_search_delayed" : "capability_snapshot_current",
      payload: { slots: clone(slots), providerSupplierId: provider.provider_supplier_id },
    });
    this.pushTimeline({
      family: "im1_gp",
      eventType: "slot_search_completed",
      label: "Slot search completed",
      detail: `Search returned ${slots.length} slots for ${provider.provider_supplier_name}.`,
      scenarioRef: null,
      correlationKey: `${provider.provider_supplier_id}::${input.patientRef}`,
      tone: status === "pending" ? "review" : "success",
    });
    return result;
  }

  holdIm1Slot(input: Im1HoldInput): SimulatorOperationResult<{ hold: Im1Hold; slot: Im1Slot }> {
    this.ensureFamilyRunning("im1_gp");
    const slot = this.state.im1Slots.get(input.slotRef);
    if (!slot) {
      throw new SimulatorError(404, "IM1_SLOT_NOT_FOUND", "Unknown IM1 slot.");
    }
    if (slot.holdRef) {
      throw new SimulatorError(409, "IM1_SLOT_ALREADY_HELD", "The slot is already held.");
    }
    const holdRef = this.nextId("HOLD");
    const createdAt = this.nextIso();
    const expiresAt = this.offsetIso(createdAt, 15);
    const hold: Im1Hold = {
      holdRef,
      slotRef: slot.slotRef,
      patientRef: input.patientRef,
      providerSupplierId: slot.providerSupplierId,
      createdAt,
      expiresAt,
      state: "held",
    };
    slot.holdRef = holdRef;
    this.state.im1Holds.set(holdRef, hold);
    const result = this.recordOperation({
      family: "im1_gp",
      operation: "slot_hold",
      replayKey: `im1::hold::${slot.slotRef}::${input.patientRef}`,
      routeFamilyRef: "rf_patient_appointments",
      governingObjectRef: holdRef,
      status: "accepted",
      ambiguityState: "none",
      authoritativeTruthState: "held_non_authoritative",
      payload: { hold: clone(hold), slot: clone(slot) },
    });
    this.pushTimeline({
      family: "im1_gp",
      eventType: "slot_held",
      label: "Slot held",
      detail: `Hold ${holdRef} now fences ${slot.slotRef} until ${expiresAt}.`,
      scenarioRef: null,
      correlationKey: holdRef,
      tone: "review",
    });
    return result;
  }

  commitIm1Booking(
    input: Im1CommitInput,
  ): SimulatorOperationResult<{ appointment: Im1Appointment; hold: Im1Hold }> {
    this.ensureFamilyRunning("im1_gp");
    const hold = this.state.im1Holds.get(input.holdRef);
    if (!hold) {
      throw new SimulatorError(404, "IM1_HOLD_NOT_FOUND", "Unknown IM1 hold.");
    }
    const replayKey = `im1::commit::${hold.holdRef}::${input.scenarioId}`;
    const replay = this.getRecordedOperation<{ appointment: Im1Appointment; hold: Im1Hold }>(
      replayKey,
      "im1_gp",
    );
    if (replay) {
      return replay;
    }
    if (hold.state !== "held") {
      throw new SimulatorError(409, "IM1_HOLD_INVALID_STATE", "The hold is no longer committable.");
    }
    const appointmentRef = this.nextId("APT");
    const appointment: Im1Appointment = {
      appointmentRef,
      providerSupplierId: hold.providerSupplierId,
      slotRef: hold.slotRef,
      holdRef: hold.holdRef,
      patientRef: input.patientRef,
      confirmationTruthState:
        input.scenarioId === "confirmed" ? "confirmed" : "pending_external_confirmation",
      externalConfirmationGateState: input.scenarioId === "confirmed" ? "none" : "open",
      createdAt: this.nextIso(),
      lastAction: "commit",
    };
    hold.state = "committed";
    this.state.im1Appointments.set(appointmentRef, appointment);
    const receiptStatus: ReceiptStatus = input.scenarioId === "confirmed" ? "settled" : "pending";
    const result = this.recordOperation({
      family: "im1_gp",
      operation: "booking_commit",
      replayKey,
      routeFamilyRef: "rf_patient_appointments",
      governingObjectRef: appointmentRef,
      status: receiptStatus,
      ambiguityState:
        input.scenarioId === "confirmed"
          ? "none"
          : input.scenarioId === "timeout_recovery"
            ? "provider_timeout"
            : "weak_confirmation",
      authoritativeTruthState:
        input.scenarioId === "confirmed" ? "confirmed" : "accepted_not_confirmed",
      payload: { appointment: clone(appointment), hold: clone(hold) },
    });
    this.pushTimeline({
      family: "im1_gp",
      eventType: "booking_commit_recorded",
      label: "Booking commit recorded",
      detail:
        appointment.externalConfirmationGateState === "open"
          ? "Commit accepted into a weak-confirmation posture with an explicit ExternalConfirmationGate."
          : "Commit confirmed without ambiguity.",
      scenarioRef: input.scenarioId,
      correlationKey: appointmentRef,
      tone: appointment.externalConfirmationGateState === "open" ? "review" : "success",
    });
    return result;
  }

  manageIm1Appointment(
    input: Im1ManageInput,
  ): SimulatorOperationResult<{ appointment: Im1Appointment | null }> {
    this.ensureFamilyRunning("im1_gp");
    const appointment = this.state.im1Appointments.get(input.appointmentRef);
    if (!appointment) {
      throw new SimulatorError(404, "IM1_APPOINTMENT_NOT_FOUND", "Unknown appointment.");
    }

    const updated: Im1Appointment =
      input.action === "cancel"
        ? {
            ...appointment,
            confirmationTruthState: "cancelled",
            externalConfirmationGateState: "open",
            lastAction: "cancel",
          }
        : (() => {
            if (!input.replacementSlotRef) {
              throw new SimulatorError(
                422,
                "IM1_REPLACEMENT_SLOT_REQUIRED",
                "Replacement slot is required.",
              );
            }
            return {
              ...appointment,
              slotRef: input.replacementSlotRef,
              confirmationTruthState: "pending_external_confirmation",
              externalConfirmationGateState: "open",
              lastAction: "reschedule",
            };
          })();
    this.state.im1Appointments.set(updated.appointmentRef, updated);
    const result = this.recordOperation({
      family: "im1_gp",
      operation: `booking_${input.action}`,
      replayKey: `im1::manage::${updated.appointmentRef}::${input.action}`,
      routeFamilyRef: "rf_patient_appointments",
      governingObjectRef: updated.appointmentRef,
      status: "pending",
      ambiguityState: "weak_confirmation",
      authoritativeTruthState:
        input.action === "cancel" ? "cancel_requested" : "reschedule_requested",
      payload: { appointment: clone(updated) },
    });
    this.pushTimeline({
      family: "im1_gp",
      eventType: "booking_manage_recorded",
      label: `Booking ${input.action} recorded`,
      detail: `Appointment ${updated.appointmentRef} moved into a governed ${input.action} posture.`,
      scenarioRef: null,
      correlationKey: updated.appointmentRef,
      tone: "review",
    });
    return result;
  }

  dispatchMeshMessage(
    input: MeshDispatchInput,
  ): SimulatorOperationResult<{ message: MeshMessage }> {
    this.ensureFamilyRunning("mesh");
    const messageRef = this.nextId("MSG");
    const createdAt = this.nextIso();
    const message: MeshMessage = {
      messageRef,
      workflowId: input.workflowId,
      fromMailboxKey: input.fromMailboxKey,
      toMailboxKey: input.toMailboxKey,
      scenarioId: input.scenarioId,
      correlationDigest: hashParts([
        input.workflowId,
        input.fromMailboxKey,
        input.toMailboxKey,
        input.summary,
      ]).slice(0, 24),
      hashDigest: hashParts([messageRef, "mesh"]).slice(0, 24),
      createdAt,
      receiptState: input.scenarioId === "delayed_ack" ? "delayed_ack" : "accepted",
      events: [],
    };
    this.state.meshMessages.set(messageRef, message);
    const result = this.recordOperation({
      family: "mesh",
      operation: "dispatch",
      replayKey: `mesh::dispatch::${message.correlationDigest}`,
      routeFamilyRef: "rf_hub_case_management",
      governingObjectRef: messageRef,
      status: input.scenarioId === "delayed_ack" ? "pending" : "accepted",
      ambiguityState: input.scenarioId,
      authoritativeTruthState: "transport_only",
      payload: { message: clone(message) },
    });
    this.pushTimeline({
      family: "mesh",
      eventType: "mesh_message_dispatched",
      label: "MESH message dispatched",
      detail: `${input.workflowId} entered the local transport rail without implying downstream business truth.`,
      scenarioRef: input.scenarioId,
      correlationKey: message.correlationDigest,
      tone: result.receiptCheckpoint.receiptStatus === "pending" ? "review" : "success",
    });
    return result;
  }

  pollMeshMailbox(
    mailboxKey: string,
  ): SimulatorOperationResult<{ messages: readonly MeshMessage[]; mailboxKey: string }> {
    this.ensureFamilyRunning("mesh");
    const messages = [...this.state.meshMessages.values()].filter(
      (message) => message.fromMailboxKey === mailboxKey || message.toMailboxKey === mailboxKey,
    );
    const result = this.recordOperation({
      family: "mesh",
      operation: "poll",
      replayKey: `mesh::poll::${mailboxKey}`,
      routeFamilyRef: "rf_support_replay_observe",
      governingObjectRef: mailboxKey,
      status: "settled",
      ambiguityState: "none",
      authoritativeTruthState: "mailbox_snapshot",
      payload: { messages: clone(messages), mailboxKey },
    });
    this.pushTimeline({
      family: "mesh",
      eventType: "mesh_mailbox_polled",
      label: "Mailbox polled",
      detail: `${messages.length} messages are visible for mailbox ${mailboxKey}.`,
      scenarioRef: null,
      correlationKey: mailboxKey,
      tone: "default",
    });
    return result;
  }

  acknowledgeMeshMessage(messageRef: string): SimulatorOperationResult<{ message: MeshMessage }> {
    this.ensureFamilyRunning("mesh");
    const message = this.state.meshMessages.get(messageRef);
    if (!message) {
      throw new SimulatorError(404, "MESH_MESSAGE_NOT_FOUND", "Unknown MESH message.");
    }
    if (message.scenarioId === "duplicate_delivery") {
      message.receiptState = "duplicate_delivery";
    } else if (message.scenarioId === "delayed_ack") {
      message.receiptState = "picked_up";
    } else if (message.scenarioId === "expired_pickup") {
      message.receiptState = "dead_letter";
    } else {
      message.receiptState = "picked_up";
    }
    const result = this.recordOperation({
      family: "mesh",
      operation: "ack",
      replayKey: `mesh::ack::${message.messageRef}`,
      routeFamilyRef: "rf_hub_case_management",
      governingObjectRef: message.messageRef,
      status: message.receiptState === "dead_letter" ? "blocked" : "settled",
      ambiguityState: message.receiptState,
      authoritativeTruthState:
        message.receiptState === "duplicate_delivery"
          ? "duplicate_under_review"
          : "transport_receipt_seen",
      payload: { message: clone(message) },
      replayClass:
        message.receiptState === "duplicate_delivery" ? "duplicate_delivery" : "exact_replay",
    });
    this.pushTimeline({
      family: "mesh",
      eventType: "mesh_receipt_recorded",
      label: "Transport receipt recorded",
      detail: `Message ${message.messageRef} moved to ${message.receiptState}.`,
      scenarioRef: message.scenarioId,
      correlationKey: message.correlationDigest,
      tone:
        message.receiptState === "dead_letter"
          ? "blocked"
          : message.receiptState === "duplicate_delivery"
            ? "caution"
            : "success",
    });
    return result;
  }

  startTelephonyCall(
    input: TelephonyStartInput,
  ): SimulatorOperationResult<{ call: TelephonyCallSession }> {
    this.ensureFamilyRunning("telephony");
    const scenario = this.fixtureCatalog.telephony.scenarios.find(
      (row) => row.scenario_id === input.scenarioId,
    );
    if (!scenario) {
      throw new SimulatorError(404, "TELEPHONY_SCENARIO_NOT_FOUND", "Unknown telephony scenario.");
    }
    const callRef = this.nextId("CALL");
    const call: TelephonyCallSession = {
      callRef,
      scenarioId: scenario.scenario_id,
      numberId: input.numberId,
      createdAt: this.nextIso(),
      status: "initiated",
      transcriptState: scenario.transcript_state,
      recordingState: scenario.recording_state,
      continuationState: scenario.continuation_state,
      urgentState: scenario.urgent_state,
      webhookState: scenario.webhook_state,
      canAdvance: true,
      canRetryWebhook: scenario.webhook_state === "signature_failed",
    };
    this.state.telephonyCalls.set(callRef, call);
    const result = this.recordOperation({
      family: "telephony",
      operation: "call_start",
      replayKey: `telephony::start::${callRef}`,
      routeFamilyRef: "rf_intake_telephony_capture",
      governingObjectRef: callRef,
      status: "accepted",
      ambiguityState: scenario.scenario_id,
      authoritativeTruthState: "call_session_open",
      payload: { call: clone(call) },
    });
    this.pushTimeline({
      family: "telephony",
      eventType: "call_session_opened",
      label: "Call session opened",
      detail: `${scenario.label} opened on ${input.numberId}.`,
      scenarioRef: scenario.scenario_id,
      correlationKey: callRef,
      tone: "default",
    });
    return result;
  }

  advanceTelephonyCall(callRef: string): SimulatorOperationResult<{ call: TelephonyCallSession }> {
    this.ensureFamilyRunning("telephony");
    const call = this.state.telephonyCalls.get(callRef);
    if (!call) {
      throw new SimulatorError(404, "TELEPHONY_CALL_NOT_FOUND", "Unknown call.");
    }
    if (!call.canAdvance) {
      throw new SimulatorError(409, "TELEPHONY_CALL_TERMINAL", "The call cannot advance further.");
    }
    call.status =
      call.urgentState === "urgent_live_only"
        ? "manual_audio_review_required"
        : "continuation_sent";
    call.canAdvance = false;
    const result = this.recordOperation({
      family: "telephony",
      operation: "call_advance",
      replayKey: `telephony::advance::${call.callRef}`,
      routeFamilyRef: "rf_intake_telephony_capture",
      governingObjectRef: call.callRef,
      status: "settled",
      ambiguityState: call.status,
      authoritativeTruthState:
        call.status === "continuation_sent" ? "continuation_issued" : "urgent_live_required",
      payload: { call: clone(call) },
    });
    this.pushTimeline({
      family: "telephony",
      eventType: "call_state_advanced",
      label: "Call state advanced",
      detail: `Call ${call.callRef} now sits at ${call.status}.`,
      scenarioRef: call.scenarioId,
      correlationKey: call.callRef,
      tone: call.status === "continuation_sent" ? "success" : "blocked",
    });
    return result;
  }

  emitTelephonyWebhook(callRef: string): SimulatorOperationResult<{ call: TelephonyCallSession }> {
    this.ensureFamilyRunning("telephony");
    const call = this.state.telephonyCalls.get(callRef);
    if (!call) {
      throw new SimulatorError(404, "TELEPHONY_CALL_NOT_FOUND", "Unknown call.");
    }
    const failureMode = this.state.families.telephony.failureMode;
    const blocked = call.webhookState === "signature_failed" || failureMode === "blocked";
    const result = this.recordOperation({
      family: "telephony",
      operation: "callback_webhook",
      replayKey: `telephony::webhook::${call.callRef}`,
      routeFamilyRef: "rf_intake_telephony_capture",
      governingObjectRef: call.callRef,
      status: blocked ? "blocked" : "settled",
      ambiguityState: blocked ? "signature_failed" : call.webhookState,
      authoritativeTruthState: blocked ? "callback_recovery_required" : "callback_ingested",
      payload: { call: clone(call) },
      callbackTimingClass: callbackTimingClassForFailureMode(failureMode),
      replayClass: replayClassForFailureMode(failureMode),
    });
    if (blocked) {
      call.canRetryWebhook = true;
      this.state.blockedCounts.telephony += 1;
    }
    this.pushTimeline({
      family: "telephony",
      eventType: "callback_webhook_recorded",
      label: blocked ? "Webhook recovery required" : "Webhook accepted",
      detail: blocked
        ? "The callback remained fenced after signature or timing validation."
        : "Telephony callback was received, but remains adapter evidence until canonical settlement runs.",
      scenarioRef: call.scenarioId,
      correlationKey: call.callRef,
      tone: blocked ? "blocked" : "success",
    });
    return result;
  }

  retryTelephonyWebhook(callRef: string): SimulatorOperationResult<{ call: TelephonyCallSession }> {
    this.ensureFamilyRunning("telephony");
    const call = this.state.telephonyCalls.get(callRef);
    if (!call || !call.canRetryWebhook) {
      throw new SimulatorError(
        409,
        "TELEPHONY_WEBHOOK_NOT_RETRYABLE",
        "The webhook is not retryable.",
      );
    }
    call.canRetryWebhook = false;
    call.webhookState = "recovered";
    const result = this.recordOperation({
      family: "telephony",
      operation: "callback_retry",
      replayKey: `telephony::retry::${call.callRef}`,
      routeFamilyRef: "rf_intake_telephony_capture",
      governingObjectRef: call.callRef,
      status: "settled",
      ambiguityState: "recovered",
      authoritativeTruthState: "callback_recovered",
      payload: { call: clone(call) },
    });
    this.pushTimeline({
      family: "telephony",
      eventType: "callback_webhook_recovered",
      label: "Webhook recovered",
      detail: "Replay-safe retry cleared the telephony callback fence.",
      scenarioRef: call.scenarioId,
      correlationKey: call.callRef,
      tone: "success",
    });
    return result;
  }

  sendNotification(
    input: NotificationSendInput,
  ): SimulatorOperationResult<{ message: NotificationDelivery }> {
    this.ensureFamilyRunning("notifications");
    const scenario = this.fixtureCatalog.notifications.scenarios.find(
      (row) => row.scenario_id === input.scenarioId,
    );
    const template = this.fixtureCatalog.notifications.templates.find(
      (row) => row.template_id === input.templateId,
    );
    if (!scenario || !template) {
      throw new SimulatorError(
        404,
        "NOTIFICATION_FIXTURE_NOT_FOUND",
        "Unknown notification scenario or template.",
      );
    }
    const messageRef = this.nextId("NOTIFY");
    const message: NotificationDelivery = {
      messageRef,
      scenarioId: scenario.scenario_id,
      templateId: template.template_id,
      recipientRef: input.recipientRef,
      createdAt: this.nextIso(),
      channel: scenario.channel,
      deliveryEvidenceState: scenario.delivery_evidence_state,
      deliveryRiskState: scenario.delivery_risk_state,
      authoritativeOutcomeState: scenario.authoritative_outcome_state,
      repairState: scenario.repair_state,
      webhookSignatureState: scenario.webhook_signature_state,
      disputeState: scenario.dispute_state,
      canRetryWebhook: scenario.can_retry_webhook,
      canRepair: scenario.can_repair,
      canSettle: scenario.can_settle,
    };
    this.state.notifications.set(messageRef, message);
    const result = this.recordOperation({
      family: "notifications",
      operation: "send",
      replayKey: `notify::send::${template.template_id}::${input.recipientRef}::${scenario.scenario_id}`,
      routeFamilyRef: "rf_patient_messages",
      governingObjectRef: messageRef,
      status: "accepted",
      ambiguityState: scenario.scenario_id,
      authoritativeTruthState: "transport_only",
      payload: { message: clone(message) },
    });
    this.pushTimeline({
      family: "notifications",
      eventType: "notification_dispatched",
      label: "Notification dispatched",
      detail: `${template.template_id} entered the simulator delivery rail for ${input.recipientRef}.`,
      scenarioRef: scenario.scenario_id,
      correlationKey: messageRef,
      tone: "default",
    });
    return result;
  }

  emitNotificationWebhook(
    messageRef: string,
  ): SimulatorOperationResult<{ message: NotificationDelivery }> {
    this.ensureFamilyRunning("notifications");
    const message = this.state.notifications.get(messageRef);
    if (!message) {
      throw new SimulatorError(404, "NOTIFICATION_NOT_FOUND", "Unknown notification message.");
    }
    const status = message.webhookSignatureState === "signature_failed" ? "blocked" : "settled";
    const result = this.recordOperation({
      family: "notifications",
      operation: "delivery_webhook",
      replayKey: `notify::webhook::${message.messageRef}`,
      routeFamilyRef: "rf_patient_messages",
      governingObjectRef: message.messageRef,
      status,
      ambiguityState:
        message.disputeState === "none" ? message.deliveryEvidenceState : message.disputeState,
      authoritativeTruthState:
        status === "blocked" ? "webhook_recovery_required" : "delivery_evidence_observed",
      payload: { message: clone(message) },
    });
    if (status === "blocked") {
      this.state.blockedCounts.notifications += 1;
    }
    this.pushTimeline({
      family: "notifications",
      eventType: "delivery_webhook_recorded",
      label: status === "blocked" ? "Delivery webhook blocked" : "Delivery webhook accepted",
      detail:
        status === "blocked"
          ? "The provider callback failed signature validation and remained in repair posture."
          : "Delivery evidence is available for reachability and repair evaluation.",
      scenarioRef: message.scenarioId,
      correlationKey: message.messageRef,
      tone: status === "blocked" ? "blocked" : "success",
    });
    return result;
  }

  repairNotification(messageRef: string): SimulatorOperationResult<{
    message: NotificationDelivery;
    observation: ReachabilityObservation;
  }> {
    this.ensureFamilyRunning("notifications");
    const message = this.state.notifications.get(messageRef);
    if (!message) {
      throw new SimulatorError(404, "NOTIFICATION_NOT_FOUND", "Unknown notification message.");
    }
    if (!message.canRepair && message.disputeState === "none") {
      throw new SimulatorError(
        409,
        "NOTIFICATION_NOT_REPAIRABLE",
        "The message is not repairable.",
      );
    }
    message.canRepair = false;
    message.canSettle = true;
    message.deliveryRiskState = "repair_in_progress";
    message.authoritativeOutcomeState = "recovery_required";
    message.repairState = "repaired";

    const observation: ReachabilityObservation = {
      observationRef: this.nextId("REACH"),
      dependencyRef: "dep_sms_notification_provider",
      messageRef: message.messageRef,
      observationType:
        message.disputeState === "wrong_recipient_suspected"
          ? "disputed_delivery"
          : "delivery_repair",
      routeAuthorityRef: "RTA_083_NOTIFICATION_REPAIR",
      observedAt: this.nextIso(),
      sourceRefs: [
        "phase-0-the-foundation-protocol.md#2.4A ReachabilityGovernor",
        "docs/architecture/80_wrong_patient_and_contact_route_repair_rules.md",
      ],
    };
    this.state.reachabilityObservations.set(observation.observationRef, observation);

    const result = this.recordOperation({
      family: "notifications",
      operation: "repair",
      replayKey: `notify::repair::${message.messageRef}`,
      routeFamilyRef: "rf_support_ticket_workspace",
      governingObjectRef: message.messageRef,
      status: "settled",
      ambiguityState: observation.observationType,
      authoritativeTruthState: "reachability_observation_recorded",
      payload: { message: clone(message), observation: clone(observation) },
    });
    this.pushTimeline({
      family: "notifications",
      eventType: "reachability_observation_recorded",
      label: "Reachability observation recorded",
      detail: `${observation.observationType} emitted for ${message.messageRef}.`,
      scenarioRef: message.scenarioId,
      correlationKey: message.messageRef,
      tone: "review",
    });
    return result;
  }

  settleNotification(
    messageRef: string,
  ): SimulatorOperationResult<{ message: NotificationDelivery }> {
    this.ensureFamilyRunning("notifications");
    const message = this.state.notifications.get(messageRef);
    if (!message || !message.canSettle) {
      throw new SimulatorError(
        409,
        "NOTIFICATION_NOT_SETTLABLE",
        "The message is not ready for settlement.",
      );
    }
    message.canSettle = false;
    message.authoritativeOutcomeState =
      message.repairState === "repaired" ? "settled_after_repair" : "settled";
    const result = this.recordOperation({
      family: "notifications",
      operation: "settle",
      replayKey: `notify::settle::${message.messageRef}`,
      routeFamilyRef: "rf_patient_messages",
      governingObjectRef: message.messageRef,
      status: "settled",
      ambiguityState: "none",
      authoritativeTruthState: message.authoritativeOutcomeState,
      payload: { message: clone(message) },
    });
    this.pushTimeline({
      family: "notifications",
      eventType: "notification_settled",
      label: "Notification settled",
      detail: `Notification ${message.messageRef} settled with ${message.authoritativeOutcomeState}.`,
      scenarioRef: message.scenarioId,
      correlationKey: message.messageRef,
      tone: "success",
    });
    return result;
  }

  getDeckSnapshot(): SimulatorDeckSnapshot {
    const familyRows = this.getFamilyRows();
    return {
      summary: {
        generatedAt: this.nextIso(),
        simulatorHealth: familyRows.filter((row) => row.status !== "stopped").length,
        seededScenarios: this.scenarioSeeds.length,
        replayInjections: FAMILY_ORDER.reduce(
          (sum, family) => sum + this.state.replayCounts[family],
          0,
        ),
        blockedFlows: FAMILY_ORDER.reduce(
          (sum, family) => sum + this.state.blockedCounts[family],
          0,
        ),
      },
      families: familyRows,
      scenarioSeeds: clone(this.scenarioSeeds),
      timeline: clone(this.state.timeline.slice(0, 24)),
      reachabilityObservations: clone([...this.state.reachabilityObservations.values()]),
    };
  }

  getStateSnapshot(): RuntimeStateSnapshot {
    return {
      families: this.getFamilyRows(),
      timeline: clone(this.state.timeline),
      nhsLoginSessions: clone([...this.state.nhsLoginSessions.values()]),
      im1Slots: clone([...this.state.im1Slots.values()]),
      im1Holds: clone([...this.state.im1Holds.values()]),
      im1Appointments: clone([...this.state.im1Appointments.values()]),
      meshMessages: clone([...this.state.meshMessages.values()]),
      telephonyCalls: clone([...this.state.telephonyCalls.values()]),
      notifications: clone([...this.state.notifications.values()]),
      reachabilityObservations: clone([...this.state.reachabilityObservations.values()]),
    };
  }

  private getFamilyRows(): readonly SimulatorDeckRow[] {
    return FAMILY_ORDER.map((family) => {
      const control = this.state.families[family];
      return {
        family,
        label: control.label,
        status: statusForFamily(control),
        failureMode: control.failureMode,
        running: control.running,
        routeFamilyRefs: control.routeFamilyRefs,
        adapterContractProfileRef: control.adapterContractProfileRef,
        simulatorContractRef: control.simulatorContractRef,
        activeObjects: this.countObjectsForFamily(family),
        blockedFlows: this.state.blockedCounts[family],
        replayCount: this.state.replayCounts[family],
        accent: control.accent,
      };
    });
  }

  private makeEmptyState(): RuntimeMutableState {
    return {
      families: Object.fromEntries(
        FAMILY_ORDER.map((family) => [
          family,
          {
            family,
            label: FAMILY_METADATA[family].label,
            accent: FAMILY_METADATA[family].accent,
            adapterContractProfileRef: FAMILY_METADATA[family].adapterContractProfileRef,
            simulatorContractRef: FAMILY_METADATA[family].simulatorContractRef,
            routeFamilyRefs: FAMILY_METADATA[family].routeFamilyRefs,
            running: true,
            failureMode: "healthy",
          } satisfies FamilyControlState,
        ]),
      ) as Record<SimulatorFamilyCode, FamilyControlState>,
      operationLedger: new Map<string, OperationLedgerEntry<unknown>>(),
      timeline: [],
      nhsLoginSessions: new Map<string, NhsLoginAuthSession>(),
      authCodes: new Map<string, string>(),
      im1Slots: new Map<string, Im1Slot>(),
      im1Holds: new Map<string, Im1Hold>(),
      im1Appointments: new Map<string, Im1Appointment>(),
      meshMessages: new Map<string, MeshMessage>(),
      telephonyCalls: new Map<string, TelephonyCallSession>(),
      notifications: new Map<string, NotificationDelivery>(),
      reachabilityObservations: new Map<string, ReachabilityObservation>(),
      replayCounts: {
        nhs_login: 0,
        im1_gp: 0,
        mesh: 0,
        telephony: 0,
        notifications: 0,
      },
      blockedCounts: {
        nhs_login: 0,
        im1_gp: 0,
        mesh: 0,
        telephony: 0,
        notifications: 0,
      },
    };
  }

  private countObjectsForFamily(family: SimulatorFamilyCode): number {
    switch (family) {
      case "nhs_login":
        return this.state.nhsLoginSessions.size;
      case "im1_gp":
        return (
          this.state.im1Slots.size + this.state.im1Holds.size + this.state.im1Appointments.size
        );
      case "mesh":
        return this.state.meshMessages.size;
      case "telephony":
        return this.state.telephonyCalls.size;
      case "notifications":
        return this.state.notifications.size;
      default:
        return 0;
    }
  }

  private seedMeshMessages(): void {
    for (const seed of this.fixtureCatalog.mesh.seededMessages.slice(0, 2)) {
      this.state.meshMessages.set(seed.message_id, {
        messageRef: seed.message_id,
        workflowId: seed.workflow_id,
        fromMailboxKey: seed.from_mailbox_key,
        toMailboxKey: seed.to_mailbox_key,
        scenarioId: seed.scenario_id,
        correlationDigest: hashParts([seed.message_id, "corr"]).slice(0, 24),
        hashDigest: hashParts([seed.message_id, "hash"]).slice(0, 24),
        createdAt: seed.created_at,
        receiptState: "accepted",
        events: [],
      });
    }
  }

  private seedTelephonyCalls(): void {
    for (const seed of this.fixtureCatalog.telephony.seededCalls.slice(0, 2)) {
      this.state.telephonyCalls.set(seed.call_id, {
        callRef: seed.call_id,
        scenarioId: seed.scenario_id,
        numberId: seed.number_id,
        createdAt: seed.created_at,
        status: seed.status,
        transcriptState: seed.transcript_state,
        recordingState: seed.recording_state,
        continuationState: seed.continuation_state,
        urgentState: seed.urgent_state,
        webhookState: seed.webhook_state,
        canAdvance: seed.can_advance,
        canRetryWebhook: seed.can_retry_webhook,
      });
    }
  }

  private seedNotificationMessages(): void {
    for (const seed of this.fixtureCatalog.notifications.seededMessages.slice(0, 2)) {
      this.state.notifications.set(seed.message_id, {
        messageRef: seed.message_id,
        scenarioId: seed.scenario_id,
        templateId: seed.template_id,
        recipientRef: seed.recipient_ref,
        createdAt: seed.created_at,
        channel: seed.channel,
        deliveryEvidenceState: seed.delivery_evidence_state,
        deliveryRiskState: seed.delivery_risk_state,
        authoritativeOutcomeState: seed.authoritative_outcome_state,
        repairState: seed.repair_state,
        webhookSignatureState: seed.webhook_signature_state,
        disputeState: seed.dispute_state,
        canRetryWebhook: seed.can_retry_webhook,
        canRepair: seed.can_repair,
        canSettle: seed.can_settle,
      });
    }
  }

  private seedIm1Slots(): void {
    const providers = this.fixtureCatalog.im1.providers.slice(0, 2);
    providers.forEach((provider, providerIndex) => {
      for (let slotIndex = 0; slotIndex < 2; slotIndex += 1) {
        const slotRef = `SLOT_${provider.supplier_code}_${slotIndex + 1}`;
        const startsAt = this.offsetIso(
          FIXED_CLOCK_START,
          90 + providerIndex * 60 + slotIndex * 30,
        );
        this.state.im1Slots.set(slotRef, {
          slotRef,
          providerSupplierId: provider.provider_supplier_id,
          siteRef: `SITE_${provider.supplier_code}`,
          startsAt,
          endsAt: this.offsetIso(startsAt, 20),
          mode: slotIndex % 2 === 0 ? "video" : "telephone",
          holdRef: null,
        });
      }
    });
  }

  private forEachFamily(
    family: SimulatorFamilyCode | undefined,
    callback: (control: FamilyControlState) => void,
  ): void {
    if (family) {
      callback(this.state.families[family]);
      return;
    }
    for (const familyCode of FAMILY_ORDER) {
      callback(this.state.families[familyCode]);
    }
  }

  private recordOperation<TPayload>(input: {
    readonly family: SimulatorFamilyCode;
    readonly operation: string;
    readonly replayKey: string;
    readonly routeFamilyRef: string;
    readonly governingObjectRef: string;
    readonly status: ReceiptStatus;
    readonly ambiguityState: string;
    readonly authoritativeTruthState: string;
    readonly payload: TPayload;
    readonly replayClass?: ReplayClass;
    readonly callbackTimingClass?: CallbackTimingClass;
  }): SimulatorOperationResult<TPayload> {
    const existing = this.state.operationLedger.get(input.replayKey) as
      | OperationLedgerEntry<TPayload>
      | undefined;
    if (existing) {
      this.state.replayCounts[input.family] += 1;
      return {
        dispatchAttempt: clone(existing.dispatchAttempt),
        receiptCheckpoint: clone(existing.receiptCheckpoint),
        payload: clone(existing.payload),
        exactReplay: true,
      };
    }

    const dispatchAttempt: AdapterDispatchAttempt = {
      dispatchAttemptRef: this.nextId("DISPATCH"),
      family: input.family,
      operation: input.operation,
      adapterContractProfileRef: FAMILY_METADATA[input.family].adapterContractProfileRef,
      simulatorContractRef: FAMILY_METADATA[input.family].simulatorContractRef,
      routeFamilyRef: input.routeFamilyRef,
      governingObjectRef: input.governingObjectRef,
      replayKey: input.replayKey,
      replayClass:
        input.replayClass ??
        replayClassForFailureMode(this.state.families[input.family].failureMode),
      callbackTimingClass:
        input.callbackTimingClass ??
        callbackTimingClassForFailureMode(this.state.families[input.family].failureMode),
      effectDigest: hashParts([input.replayKey, input.operation]).slice(0, 24),
      dispatchedAt: this.nextIso(),
      sourceRefs: FAMILY_METADATA[input.family].sourceRefs,
    };

    const receiptCheckpoint: AdapterReceiptCheckpoint = {
      receiptCheckpointRef: this.nextId("RECEIPT"),
      dispatchAttemptRef: dispatchAttempt.dispatchAttemptRef,
      family: input.family,
      receiptStatus: input.status,
      authoritativeTruthState: input.authoritativeTruthState,
      ambiguityState: input.ambiguityState,
      receiptDigest: hashParts([dispatchAttempt.dispatchAttemptRef, input.status]).slice(0, 24),
      settledAt: this.nextIso(),
    };

    if (input.status === "blocked") {
      this.state.blockedCounts[input.family] += 1;
    }
    const entry: OperationLedgerEntry<TPayload> = {
      replayKey: input.replayKey,
      dispatchAttempt,
      receiptCheckpoint,
      payload: clone(input.payload),
    };
    this.state.operationLedger.set(input.replayKey, entry);
    return {
      dispatchAttempt: clone(dispatchAttempt),
      receiptCheckpoint: clone(receiptCheckpoint),
      payload: clone(input.payload),
      exactReplay: false,
    };
  }

  private getRecordedOperation<TPayload>(
    replayKey: string,
    family: SimulatorFamilyCode,
  ): SimulatorOperationResult<TPayload> | null {
    const existing = this.state.operationLedger.get(replayKey) as
      | OperationLedgerEntry<TPayload>
      | undefined;
    if (!existing) {
      return null;
    }
    this.state.replayCounts[family] += 1;
    return {
      dispatchAttempt: clone(existing.dispatchAttempt),
      receiptCheckpoint: clone(existing.receiptCheckpoint),
      payload: clone(existing.payload),
      exactReplay: true,
    };
  }

  private pushTimeline(input: Omit<TimelineEvent, "eventId" | "at">): TimelineEvent {
    const event: TimelineEvent = {
      ...input,
      eventId: this.nextId("EVT"),
      at: this.nextIso(),
    };
    this.state.timeline.unshift(event);
    return event;
  }

  private ensureFamilyRunning(family: SimulatorFamilyCode): void {
    const control = this.state.families[family];
    if (!control.running) {
      throw new SimulatorError(
        409,
        "SIMULATOR_STOPPED",
        `${control.label} is currently stopped and cannot accept new operations.`,
      );
    }
  }

  private offsetIso(startIso: string, minutes: number): string {
    const value = new Date(startIso);
    value.setUTCMinutes(value.getUTCMinutes() + minutes);
    return value.toISOString();
  }

  private nextIso(): string {
    const value = new Date(FIXED_CLOCK_START);
    value.setUTCMinutes(value.getUTCMinutes() + this.clockTick);
    this.clockTick += 1;
    return value.toISOString();
  }

  private nextId(prefix: string): string {
    const current = this.counters.get(prefix) ?? 0;
    const next = current + 1;
    this.counters.set(prefix, next);
    return `${prefix}_${String(next).padStart(4, "0")}`;
  }
}

export function createSimulatorBackplaneRuntime(options?: { readonly rootDir?: string }) {
  return new SimulatorBackplaneRuntime(options);
}
