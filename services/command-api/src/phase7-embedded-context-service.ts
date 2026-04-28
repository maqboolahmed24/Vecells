import { createHash, createHmac } from "node:crypto";
import {
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_EMBEDDED_NAV_ELIGIBILITY_REF,
  PHASE7_MANIFEST_VERSION,
  PHASE7_MINIMUM_BRIDGE_REF,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  createDefaultPhase7NhsAppManifestApplication,
  type JourneyPathDefinition,
  type ManifestBlockedReason,
  type NhsAppEnvironment,
  type Phase7NhsAppManifestApplication,
} from "./phase7-nhs-app-manifest-service";

export const PHASE7_EMBEDDED_CONTEXT_SERVICE_NAME =
  "Phase7EmbeddedContextResolverAndSessionProjection";
export const PHASE7_EMBEDDED_CONTEXT_SCHEMA_VERSION = "378.phase7.embedded-context-resolution.v1";

const RECORDED_AT = "2026-04-27T00:10:15.000Z";
const DEFAULT_STALE_AT = "2026-04-27T00:15:15.000Z";
const DEFAULT_SIGNING_KEY = "local-nonprod-phase7-embedded-context-key";
const TRUSTED_CONTEXT_EVIDENCE_REF = "ChannelContextEvidence:trusted-server-context-v1";
const UNAVAILABLE_BRIDGE_MATRIX_REF = "BridgeCapabilityMatrix:future-381-unavailable";

export type ChannelType = "standalone_web" | "nhs_app_webview" | "secure_link" | "unknown";
export type EntryMode =
  | "jump_off"
  | "site_link"
  | "deep_link"
  | "post_auth_return"
  | "direct_browser"
  | "recovery";
export type TrustTier =
  | "trusted_embedded"
  | "verified_sso_embedded"
  | "hinted_embedded"
  | "standalone_or_unknown";
export type ResolutionDisposition =
  | "embedded_live"
  | "embedded_revalidate_only"
  | "embedded_styling_only"
  | "standalone"
  | "safe_browser_handoff"
  | "bounded_recovery"
  | "blocked";
export type SignatureState = "valid" | "missing" | "invalid" | "expired" | "not_applicable";
export type RequestedShell = "embedded" | "standalone" | "recovery";
export type EvidenceSource =
  | "signed_entry_token"
  | "validated_sso"
  | "user_agent"
  | "query_hint"
  | "bridge_detection";
export type ShellState = "live" | "revalidate_only" | "recovery_only" | "blocked";
export type ProjectionTrustState = "trusted" | "degraded" | "hint_only" | "blocked";
export type CausalConsistencyState = "current" | "stale" | "conflict" | "unknown";
export type EmbeddedEligibilityState =
  | "live"
  | "read_only"
  | "placeholder_only"
  | "safe_browser_handoff"
  | "recovery_required"
  | "blocked";
export type ChannelReleaseFreezeState =
  | "monitoring"
  | "frozen"
  | "kill_switch_active"
  | "rollback_recommended"
  | "released";
export type BridgeCapabilityState = "verified" | "stale" | "unavailable";

export type EmbeddedContextBlockedReason =
  | "query_hint_not_trusted"
  | "user_agent_not_trusted"
  | "signed_context_missing"
  | "signed_context_invalid"
  | "signed_context_expired"
  | "embedded_entry_token_missing"
  | "embedded_entry_token_invalid"
  | "embedded_entry_token_expired"
  | "embedded_entry_token_replayed"
  | "expected_route_mismatch"
  | "cohort_mismatch"
  | "manifest_drift"
  | "session_missing"
  | "session_inactive"
  | "subject_binding_mismatch"
  | "bridge_capability_unavailable"
  | "bridge_capability_stale"
  | "continuity_evidence_not_trusted"
  | "route_freeze_active"
  | "hydration_conflict";

export interface ChannelContextEvidence {
  evidenceId: string;
  source: EvidenceSource;
  observedAt: string;
  expiresAt: string;
  nonce: string;
  signatureState: SignatureState;
  requestedShell: RequestedShell;
  expectedJourneyPath: string;
  cohortRef: string;
  signature?: string;
}

export interface EmbeddedEntryToken {
  entryTokenId: string;
  journeyPathId: string;
  issuedAt: string;
  expiresAt: string;
  cohortRef: string;
  intendedChannel: "nhs_app_webview";
  contextClaims: {
    environment: NhsAppEnvironment;
    expectedManifestVersion: string;
    expectedConfigFingerprint: string;
    expectedRoutePattern?: string;
    patientShellContinuityKey?: string;
    entityContinuityKey?: string;
  };
  nonce: string;
  signature: string;
}

export interface ChannelContext {
  channelType: ChannelType;
  entryMode: EntryMode;
  trustTier: TrustTier;
  resolutionDisposition: ResolutionDisposition;
  isEmbedded: boolean;
  userAgentEvidence: {
    marker: string | null;
    platform: "ios" | "android" | "none";
    authority: "evidence_only" | "none";
  };
  queryEvidence: Record<string, string>;
  signedContextEvidence: ChannelContextEvidence | null;
  assertedIdentityPresent: boolean;
  deepLinkPresent: boolean;
  jumpOffSource: string | null;
  channelConfidence: number;
}

export interface ShellPolicy {
  shellPolicyId: string;
  channelType: ChannelType;
  showHeader: boolean;
  showFooter: boolean;
  showBackLink: boolean;
  safeAreaInsetsMode: "browser_default" | "native_safe_area" | "compact_embedded";
  externalLinkMode: "standard_browser" | "outbound_grant_required" | "blocked";
  downloadMode: "browser_default" | "bridge_byte_grant_required" | "summary_only" | "blocked";
}

export interface EmbeddedShellConsistencyProjection {
  consistencyId: string;
  journeyPathId: string;
  patientShellContinuityKey: string;
  entityContinuityKey: string;
  bundleVersion: string;
  audienceTier: string;
  governingObjectVersionRefs: string[];
  selectedAnchorRef: string;
  returnContractRef: string;
  placeholderContractRefs: string[];
  continuityEvidenceRefs: string[];
  currentBridgeCapabilityMatrixRef: string;
  patientEmbeddedNavEligibilityRef: string;
  shellState: ShellState;
  computedAt: string;
  staleAt: string;
  causalConsistencyState: CausalConsistencyState;
  projectionTrustState: ProjectionTrustState;
}

export interface PatientEmbeddedSessionProjection {
  patientEmbeddedSessionProjectionId: string;
  subjectRef: string;
  identityBindingRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  manifestVersionRef: string;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: ChannelReleaseFreezeState;
  minimumBridgeCapabilitiesRef: string;
  currentBridgeCapabilityMatrixRef: string;
  routeFreezeDispositionRef: string;
  experienceContinuityEvidenceRef: string;
  eligibilityState: EmbeddedEligibilityState;
  recoveryRouteRef: string;
  computedAt: string;
}

export interface PatientEmbeddedNavEligibility {
  embeddedNavEligibilityId: string;
  journeyPathRef: string;
  routeFamilyRef: string;
  patientEmbeddedSessionProjectionRef: string;
  bridgeCapabilityMatrixRef: string;
  minimumBridgeCapabilitiesRef: string;
  requiredBridgeActionRefs: string[];
  allowedBridgeActionRefs: string[];
  fallbackActionRefs: string[];
  routeFreezeDispositionRef: string;
  continuityEvidenceRef: string;
  eligibilityState: EmbeddedEligibilityState;
  evaluatedAt: string;
}

export interface LocalSessionBinding {
  subjectRef: string;
  identityBindingRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  sessionState: "active" | "expired" | "missing";
  patientShellContinuityKey: string;
  entityContinuityKey: string;
  selectedAnchorRef: string;
  returnContractRef: string;
}

export interface BridgeCapabilitySnapshot {
  bridgeCapabilityMatrixRef: string;
  capabilityState: BridgeCapabilityState;
  supportedBridgeActionRefs: string[];
  detectedPlatform: "ios" | "android" | "none";
}

export interface ResolveEmbeddedContextInput {
  environment: NhsAppEnvironment;
  journeyPathId: string;
  routePath: string;
  userAgent?: string;
  query?: Record<string, string | undefined>;
  signedContextEvidence?: ChannelContextEvidence | null;
  embeddedEntryToken?: EmbeddedEntryToken | null;
  ssoHandoffState?: "none" | "pending" | "validated";
  localSession?: LocalSessionBinding | null;
  bridgeCapability?: BridgeCapabilitySnapshot | null;
  channelReleaseFreezeState?: ChannelReleaseFreezeState;
  expectedManifestVersion?: string;
  expectedConfigFingerprint?: string;
  releaseCohortRef?: string;
  hydrationContext?: Pick<
    ChannelContext,
    "trustTier" | "resolutionDisposition" | "channelType"
  > | null;
  now?: string;
}

export interface ContextResolutionAuditRecord {
  auditId: string;
  eventType:
    | "channel_context_resolved"
    | "embedded_entry_token_issued"
    | "embedded_entry_token_verified"
    | "shell_policy_resolved"
    | "embedded_session_projected"
    | "embedded_nav_eligibility_evaluated"
    | "ssr_hydration_bound";
  journeyPathRef: string;
  manifestVersionRef: string | null;
  configFingerprintRef: string | null;
  trustTier: TrustTier | null;
  resolutionDisposition: ResolutionDisposition | null;
  blockedReasons: EmbeddedContextBlockedReason[];
  rawQueryKeys: string[];
  recordedAt: string;
}

export interface EmbeddedContextResolutionResult {
  channelContext: ChannelContext;
  shellPolicy: ShellPolicy;
  embeddedShellConsistencyProjection: EmbeddedShellConsistencyProjection;
  patientEmbeddedSessionProjection: PatientEmbeddedSessionProjection;
  patientEmbeddedNavEligibility: PatientEmbeddedNavEligibility;
  blockedReasons: EmbeddedContextBlockedReason[];
  manifestBlockedReasons: ManifestBlockedReason[];
  hydrationBinding: {
    serverContextRef: string;
    rehydrateFromServerOnly: true;
    clientMayRecomputeTrust: false;
    conflictDisposition: ResolutionDisposition;
  };
  auditRecords: ContextResolutionAuditRecord[];
}

export const phase7EmbeddedContextRoutes = [
  {
    routeId: "phase7_embedded_context_resolve",
    method: "POST",
    path: "/internal/v1/nhs-app/context:resolve",
    contractFamily: "ChannelContextResolutionContract",
    purpose:
      "Resolve one authoritative server-side ChannelContext for NHS App, hinted, and standalone traffic.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_embedded_shell_policy_resolve",
    method: "POST",
    path: "/internal/v1/nhs-app/shell-policy:resolve",
    contractFamily: "ShellPolicyResolutionContract",
    purpose:
      "Resolve embedded or standalone shell policy from server-owned context truth so route components do not guess.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_embedded_session_projection_current",
    method: "POST",
    path: "/internal/v1/nhs-app/embedded-session:project",
    contractFamily: "PatientEmbeddedSessionProjectionContract",
    purpose:
      "Materialize PatientEmbeddedSessionProjection bound to manifest, release, session, bridge, continuity, and route-freeze posture.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_embedded_nav_eligibility_evaluate",
    method: "POST",
    path: "/internal/v1/nhs-app/nav-eligibility:evaluate",
    contractFamily: "PatientEmbeddedNavEligibilityContract",
    purpose:
      "Evaluate route-scoped embedded CTA and bridge action eligibility with deterministic downgrade reasons.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_embedded_context_hydration_envelope",
    method: "POST",
    path: "/internal/v1/nhs-app/context:ssr-hydration-envelope",
    contractFamily: "EmbeddedSsrHydrationConsistencyContract",
    purpose:
      "Return the server-owned context envelope clients must hydrate instead of recomputing trust locally.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
] as const;

interface NavigationContractSeed {
  journeyPathRef: string;
  routeFamilyRef: string;
  requiredBridgeActionRefs: string[];
  fallbackActionRefs: string[];
}

const NAVIGATION_CONTRACTS: NavigationContractSeed[] = [
  {
    journeyPathRef: "jp_start_medical_request",
    routeFamilyRef: "medical_request_intake",
    requiredBridgeActionRefs: ["navigation.setBackAction", "navigation.clearBackAction"],
    fallbackActionRefs: ["return_to_services", "preserve_draft_browser_recovery"],
  },
  {
    journeyPathRef: "jp_start_admin_request",
    routeFamilyRef: "admin_request_intake",
    requiredBridgeActionRefs: ["navigation.setBackAction", "navigation.clearBackAction"],
    fallbackActionRefs: ["return_to_services", "preserve_draft_browser_recovery"],
  },
  {
    journeyPathRef: "jp_continue_draft",
    routeFamilyRef: "draft_resume",
    requiredBridgeActionRefs: ["navigation.setBackAction", "navigation.clearBackAction"],
    fallbackActionRefs: ["return_to_requests", "restore_or_claim_recovery"],
  },
  {
    journeyPathRef: "jp_request_status",
    routeFamilyRef: "request_status",
    requiredBridgeActionRefs: ["navigation.goToPage", "navigation.setBackAction"],
    fallbackActionRefs: ["return_to_services", "summary_only_status"],
  },
  {
    journeyPathRef: "jp_respond_more_info",
    routeFamilyRef: "more_info_response",
    requiredBridgeActionRefs: ["navigation.setBackAction", "navigation.clearBackAction"],
    fallbackActionRefs: ["return_to_request_status", "checkpoint_recovery"],
  },
  {
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    requiredBridgeActionRefs: [
      "navigation.setBackAction",
      "storage.addEventToCalendar",
      "navigation.openBrowserOverlay",
    ],
    fallbackActionRefs: ["return_to_appointments", "summary_only_manage"],
  },
  {
    journeyPathRef: "jp_pharmacy_choice",
    routeFamilyRef: "pharmacy_choice",
    requiredBridgeActionRefs: ["navigation.setBackAction", "navigation.clearBackAction"],
    fallbackActionRefs: ["return_to_request_status", "choice_set_summary"],
  },
  {
    journeyPathRef: "jp_pharmacy_status",
    routeFamilyRef: "pharmacy_status",
    requiredBridgeActionRefs: ["navigation.goToPage", "navigation.setBackAction"],
    fallbackActionRefs: ["return_to_request_status", "pharmacy_summary_only"],
  },
];

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function hmac(value: unknown, signingKey: string): string {
  return `sha256:${createHmac("sha256", signingKey).update(stableStringify(value)).digest("hex")}`;
}

function appendUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`INVALID_TIME:${value}`);
  }
  return parsed;
}

function normalizeQuery(query: ResolveEmbeddedContextInput["query"]): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (typeof value === "string") {
      normalized[key] = key === "assertedLoginIdentity" ? "redacted" : value;
    }
  }
  return normalized;
}

function detectNhsAppUserAgent(userAgent: string | undefined): ChannelContext["userAgentEvidence"] {
  const marker = userAgent?.match(/nhsapp-(ios|android)\/[A-Za-z0-9._-]+/)?.[0] ?? null;
  if (!marker) {
    return { marker: null, platform: "none", authority: "none" };
  }
  return {
    marker,
    platform: marker.includes("ios") ? "ios" : "android",
    authority: "evidence_only",
  };
}

function tokenSigningPayload(token: Omit<EmbeddedEntryToken, "signature">): unknown {
  return {
    entryTokenId: token.entryTokenId,
    journeyPathId: token.journeyPathId,
    issuedAt: token.issuedAt,
    expiresAt: token.expiresAt,
    cohortRef: token.cohortRef,
    intendedChannel: token.intendedChannel,
    contextClaims: token.contextClaims,
    nonce: token.nonce,
  };
}

function evidenceSigningPayload(evidence: Omit<ChannelContextEvidence, "signature">): unknown {
  return {
    evidenceId: evidence.evidenceId,
    source: evidence.source,
    observedAt: evidence.observedAt,
    expiresAt: evidence.expiresAt,
    nonce: evidence.nonce,
    signatureState: "unsigned_payload",
    requestedShell: evidence.requestedShell,
    expectedJourneyPath: evidence.expectedJourneyPath,
    cohortRef: evidence.cohortRef,
  };
}

function fallbackBridgeCapability(input: ResolveEmbeddedContextInput): BridgeCapabilitySnapshot {
  if (input.bridgeCapability) {
    return input.bridgeCapability;
  }
  return {
    bridgeCapabilityMatrixRef: UNAVAILABLE_BRIDGE_MATRIX_REF,
    capabilityState: "unavailable",
    supportedBridgeActionRefs: [],
    detectedPlatform: "none",
  };
}

function navigationContractFor(journeyPathId: string, journeyPath: JourneyPathDefinition | null) {
  return (
    NAVIGATION_CONTRACTS.find((contract) => contract.journeyPathRef === journeyPathId) ?? {
      journeyPathRef: journeyPathId,
      routeFamilyRef: journeyPath?.journeyType ?? "unknown_route_family",
      requiredBridgeActionRefs: [],
      fallbackActionRefs: ["bounded_recovery"],
    }
  );
}

function mapEligibilityToShellState(state: EmbeddedEligibilityState): ShellState {
  if (state === "live") {
    return "live";
  }
  if (state === "read_only" || state === "placeholder_only" || state === "safe_browser_handoff") {
    return "revalidate_only";
  }
  if (state === "recovery_required") {
    return "recovery_only";
  }
  return "blocked";
}

function projectionTrustFrom(
  trustTier: TrustTier,
  eligibilityState: EmbeddedEligibilityState,
): ProjectionTrustState {
  if (eligibilityState === "blocked") {
    return "blocked";
  }
  if (trustTier === "trusted_embedded" || trustTier === "verified_sso_embedded") {
    return eligibilityState === "live" ? "trusted" : "degraded";
  }
  if (trustTier === "hinted_embedded") {
    return "hint_only";
  }
  return "blocked";
}

function dispositionFromEligibility(
  trustTier: TrustTier,
  eligibilityState: EmbeddedEligibilityState,
  blockedReasons: readonly EmbeddedContextBlockedReason[],
): ResolutionDisposition {
  if (blockedReasons.includes("hydration_conflict")) {
    return "bounded_recovery";
  }
  if (
    eligibilityState === "blocked" &&
    (blockedReasons.includes("signed_context_invalid") ||
      blockedReasons.includes("embedded_entry_token_invalid") ||
      blockedReasons.includes("embedded_entry_token_replayed") ||
      blockedReasons.includes("expected_route_mismatch") ||
      blockedReasons.includes("cohort_mismatch") ||
      blockedReasons.includes("route_freeze_active"))
  ) {
    return "blocked";
  }
  if (trustTier === "standalone_or_unknown") {
    return "standalone";
  }
  if (trustTier === "hinted_embedded") {
    return blockedReasons.includes("user_agent_not_trusted")
      ? "embedded_revalidate_only"
      : "embedded_styling_only";
  }
  if (eligibilityState === "live") {
    return "embedded_live";
  }
  if (eligibilityState === "read_only" || eligibilityState === "placeholder_only") {
    return "embedded_revalidate_only";
  }
  if (eligibilityState === "safe_browser_handoff") {
    return "safe_browser_handoff";
  }
  if (eligibilityState === "blocked") {
    return "blocked";
  }
  return "bounded_recovery";
}

function chooseEligibilityState(input: {
  trustTier: TrustTier;
  blockedReasons: readonly EmbeddedContextBlockedReason[];
  manifestBlockedReasons: readonly ManifestBlockedReason[];
  channelReleaseFreezeState: ChannelReleaseFreezeState;
  bridgeCapabilityState: BridgeCapabilityState;
  continuityTrusted: boolean;
  allRequiredBridgeActionsSupported: boolean;
}): EmbeddedEligibilityState {
  if (
    input.channelReleaseFreezeState === "kill_switch_active" ||
    input.blockedReasons.includes("subject_binding_mismatch")
  ) {
    return "blocked";
  }
  if (input.channelReleaseFreezeState === "frozen") {
    return "read_only";
  }
  if (
    input.trustTier === "standalone_or_unknown" ||
    input.blockedReasons.includes("signed_context_invalid") ||
    input.blockedReasons.includes("embedded_entry_token_invalid") ||
    input.blockedReasons.includes("embedded_entry_token_replayed")
  ) {
    return "blocked";
  }
  if (input.trustTier === "hinted_embedded") {
    return "placeholder_only";
  }
  if (
    input.manifestBlockedReasons.includes("not_in_manifest") ||
    input.manifestBlockedReasons.includes("requires_embedded_adaptation")
  ) {
    return "placeholder_only";
  }
  if (input.blockedReasons.includes("manifest_drift")) {
    return "recovery_required";
  }
  if (
    !input.continuityTrusted ||
    input.manifestBlockedReasons.includes("pending_continuity_validation")
  ) {
    return "recovery_required";
  }
  if (input.bridgeCapabilityState === "unavailable") {
    return "read_only";
  }
  if (input.bridgeCapabilityState === "stale" || !input.allRequiredBridgeActionsSupported) {
    return "recovery_required";
  }
  if (
    input.blockedReasons.includes("session_missing") ||
    input.blockedReasons.includes("session_inactive")
  ) {
    return "recovery_required";
  }
  return "live";
}

export class EmbeddedEntryTokenService {
  private readonly redeemedNonces = new Set<string>();

  constructor(private readonly signingKey = DEFAULT_SIGNING_KEY) {}

  issue(input: {
    entryTokenId: string;
    journeyPathId: string;
    issuedAt: string;
    expiresAt: string;
    cohortRef: string;
    environment: NhsAppEnvironment;
    patientShellContinuityKey?: string;
    entityContinuityKey?: string;
  }): EmbeddedEntryToken {
    const unsigned: Omit<EmbeddedEntryToken, "signature"> = {
      entryTokenId: input.entryTokenId,
      journeyPathId: input.journeyPathId,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      cohortRef: input.cohortRef,
      intendedChannel: "nhs_app_webview",
      contextClaims: {
        environment: input.environment,
        expectedManifestVersion: PHASE7_MANIFEST_VERSION,
        expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
        patientShellContinuityKey: input.patientShellContinuityKey,
        entityContinuityKey: input.entityContinuityKey,
      },
      nonce: `nonce:${hashString(`${input.entryTokenId}:${input.issuedAt}`).slice(7, 23)}`,
    };
    return {
      ...unsigned,
      signature: hmac(tokenSigningPayload(unsigned), this.signingKey),
    };
  }

  verify(
    token: EmbeddedEntryToken | null | undefined,
    input: {
      now: string;
      expectedJourneyPath: string;
      expectedCohortRef: string;
      consume?: boolean;
    },
  ): { signatureState: SignatureState; blockedReasons: EmbeddedContextBlockedReason[] } {
    if (!token) {
      return { signatureState: "missing", blockedReasons: ["embedded_entry_token_missing"] };
    }
    const blockedReasons: EmbeddedContextBlockedReason[] = [];
    const { signature: _signature, ...unsigned } = token;
    const expectedSignature = hmac(tokenSigningPayload(unsigned), this.signingKey);
    if (token.signature !== expectedSignature || token.intendedChannel !== "nhs_app_webview") {
      appendUnique(blockedReasons, "embedded_entry_token_invalid");
      return { signatureState: "invalid", blockedReasons };
    }
    if (parseTime(token.expiresAt) <= parseTime(input.now)) {
      appendUnique(blockedReasons, "embedded_entry_token_expired");
      return { signatureState: "expired", blockedReasons };
    }
    if (token.journeyPathId !== input.expectedJourneyPath) {
      appendUnique(blockedReasons, "expected_route_mismatch");
    }
    if (token.cohortRef !== input.expectedCohortRef) {
      appendUnique(blockedReasons, "cohort_mismatch");
    }
    if (this.redeemedNonces.has(token.nonce)) {
      appendUnique(blockedReasons, "embedded_entry_token_replayed");
    }
    if (input.consume && blockedReasons.length === 0) {
      this.redeemedNonces.add(token.nonce);
    }
    return {
      signatureState: blockedReasons.length === 0 ? "valid" : "invalid",
      blockedReasons,
    };
  }
}

export class ChannelContextEvidenceVerifier {
  constructor(private readonly signingKey = DEFAULT_SIGNING_KEY) {}

  sign(evidence: Omit<ChannelContextEvidence, "signature">): ChannelContextEvidence {
    return {
      ...evidence,
      signature: hmac(evidenceSigningPayload(evidence), this.signingKey),
    };
  }

  verify(
    evidence: ChannelContextEvidence | null | undefined,
    input: { now: string; expectedJourneyPath: string; expectedCohortRef: string },
  ): { signatureState: SignatureState; blockedReasons: EmbeddedContextBlockedReason[] } {
    if (!evidence) {
      return { signatureState: "missing", blockedReasons: ["signed_context_missing"] };
    }
    const { signature: _signature, ...unsigned } = evidence;
    const expectedSignature = hmac(evidenceSigningPayload(unsigned), this.signingKey);
    if (evidence.signature !== expectedSignature || evidence.signatureState !== "valid") {
      return { signatureState: "invalid", blockedReasons: ["signed_context_invalid"] };
    }
    if (parseTime(evidence.expiresAt) <= parseTime(input.now)) {
      return { signatureState: "expired", blockedReasons: ["signed_context_expired"] };
    }
    const blockedReasons: EmbeddedContextBlockedReason[] = [];
    if (evidence.expectedJourneyPath !== input.expectedJourneyPath) {
      appendUnique(blockedReasons, "expected_route_mismatch");
    }
    if (evidence.cohortRef !== input.expectedCohortRef) {
      appendUnique(blockedReasons, "cohort_mismatch");
    }
    return {
      signatureState: blockedReasons.length === 0 ? "valid" : "invalid",
      blockedReasons,
    };
  }
}

export class ContextResolutionAuditStore {
  private readonly records: ContextResolutionAuditRecord[] = [];

  record(
    input: Omit<ContextResolutionAuditRecord, "auditId" | "recordedAt">,
  ): ContextResolutionAuditRecord {
    const auditId = `audit:378:${input.eventType}:${hashString(
      stableStringify({
        journeyPathRef: input.journeyPathRef,
        manifestVersionRef: input.manifestVersionRef,
        configFingerprintRef: input.configFingerprintRef,
        trustTier: input.trustTier,
        resolutionDisposition: input.resolutionDisposition,
        blockedReasons: [...input.blockedReasons].sort(),
        rawQueryKeys: [...input.rawQueryKeys].sort(),
      }),
    ).slice(7, 23)}`;
    const record: ContextResolutionAuditRecord = {
      ...input,
      auditId,
      recordedAt: RECORDED_AT,
    };
    this.records.push(record);
    return record;
  }

  list(): ContextResolutionAuditRecord[] {
    return this.records.map((record) => ({
      ...record,
      blockedReasons: [...record.blockedReasons],
    }));
  }
}

export interface Phase7EmbeddedContextApplication {
  tokenService: EmbeddedEntryTokenService;
  evidenceVerifier: ChannelContextEvidenceVerifier;
  auditStore: ContextResolutionAuditStore;
  issueEmbeddedEntryToken: EmbeddedEntryTokenService["issue"];
  signChannelContextEvidence: ChannelContextEvidenceVerifier["sign"];
  resolve(input: ResolveEmbeddedContextInput): EmbeddedContextResolutionResult;
  listAuditRecords(): ContextResolutionAuditRecord[];
}

export function createPhase7EmbeddedContextApplication(input?: {
  manifestApplication?: Phase7NhsAppManifestApplication;
  tokenService?: EmbeddedEntryTokenService;
  evidenceVerifier?: ChannelContextEvidenceVerifier;
  auditStore?: ContextResolutionAuditStore;
}): Phase7EmbeddedContextApplication {
  const manifestApplication =
    input?.manifestApplication ?? createDefaultPhase7NhsAppManifestApplication();
  const tokenService = input?.tokenService ?? new EmbeddedEntryTokenService();
  const evidenceVerifier = input?.evidenceVerifier ?? new ChannelContextEvidenceVerifier();
  const auditStore = input?.auditStore ?? new ContextResolutionAuditStore();

  function buildShellPolicy(channelContext: ChannelContext): ShellPolicy {
    if (channelContext.trustTier === "standalone_or_unknown") {
      return {
        shellPolicyId: "ShellPolicy:standalone-browser-v1",
        channelType: "standalone_web",
        showHeader: true,
        showFooter: true,
        showBackLink: true,
        safeAreaInsetsMode: "browser_default",
        externalLinkMode: "standard_browser",
        downloadMode: "browser_default",
      };
    }
    if (channelContext.trustTier === "hinted_embedded") {
      return {
        shellPolicyId: "ShellPolicy:embedded-hint-styling-only-v1",
        channelType: channelContext.channelType,
        showHeader: false,
        showFooter: false,
        showBackLink: true,
        safeAreaInsetsMode: "compact_embedded",
        externalLinkMode: "blocked",
        downloadMode: "summary_only",
      };
    }
    return {
      shellPolicyId: "ShellPolicy:embedded-nhs-app-v1",
      channelType: "nhs_app_webview",
      showHeader: false,
      showFooter: false,
      showBackLink: true,
      safeAreaInsetsMode: "native_safe_area",
      externalLinkMode: "outbound_grant_required",
      downloadMode: "bridge_byte_grant_required",
    };
  }

  function resolve(input: ResolveEmbeddedContextInput): EmbeddedContextResolutionResult {
    const now = input.now ?? RECORDED_AT;
    const query = normalizeQuery(input.query);
    const rawQueryKeys = Object.keys(query).sort();
    const releaseCohortRef = input.releaseCohortRef ?? "cohort:phase7-internal-sandpit-only";
    const userAgentEvidence = detectNhsAppUserAgent(input.userAgent);
    const bridgeCapability = fallbackBridgeCapability(input);
    const signedEvidenceVerification = evidenceVerifier.verify(input.signedContextEvidence, {
      now,
      expectedJourneyPath: input.journeyPathId,
      expectedCohortRef: releaseCohortRef,
    });
    const tokenVerification = tokenService.verify(input.embeddedEntryToken, {
      now,
      expectedJourneyPath: input.journeyPathId,
      expectedCohortRef: releaseCohortRef,
      consume: true,
    });
    const blockedReasons: EmbeddedContextBlockedReason[] = [
      ...signedEvidenceVerification.blockedReasons,
      ...tokenVerification.blockedReasons,
    ].filter(
      (reason) => reason !== "signed_context_missing" && reason !== "embedded_entry_token_missing",
    );

    const manifestExposure = manifestApplication.lookupJourneyPath({
      environment: input.environment,
      journeyPathId: input.journeyPathId,
      expectedManifestVersion: input.expectedManifestVersion ?? PHASE7_MANIFEST_VERSION,
      expectedConfigFingerprint: input.expectedConfigFingerprint ?? PHASE7_CONFIG_FINGERPRINT,
    });
    const manifestBlockedReasons = [...manifestExposure.blockedReasons];
    if (
      manifestExposure.blockedReasons.includes("config_fingerprint_mismatch") ||
      manifestExposure.blockedReasons.includes("manifest_version_mismatch") ||
      manifestExposure.blockedReasons.includes("release_tuple_mismatch")
    ) {
      appendUnique(blockedReasons, "manifest_drift");
    }

    const localSession = input.localSession ?? null;
    if (!localSession) {
      appendUnique(blockedReasons, "session_missing");
    } else if (localSession.sessionState !== "active") {
      appendUnique(blockedReasons, "session_inactive");
    }

    const channelReleaseFreezeState = input.channelReleaseFreezeState ?? "monitoring";
    if (
      channelReleaseFreezeState === "frozen" ||
      channelReleaseFreezeState === "kill_switch_active"
    ) {
      appendUnique(blockedReasons, "route_freeze_active");
    }
    if (bridgeCapability.capabilityState === "unavailable") {
      appendUnique(blockedReasons, "bridge_capability_unavailable");
    } else if (bridgeCapability.capabilityState === "stale") {
      appendUnique(blockedReasons, "bridge_capability_stale");
    }

    const hasTrustedSignedEvidence = signedEvidenceVerification.signatureState === "valid";
    const hasTrustedToken = tokenVerification.signatureState === "valid";
    const hasValidatedSso = input.ssoHandoffState === "validated";
    const hasQueryHint = query.from === "nhsApp";
    const hasUserAgentMarker = userAgentEvidence.marker !== null;

    let trustTier: TrustTier = "standalone_or_unknown";
    let channelType: ChannelType = "standalone_web";
    let entryMode: EntryMode = "direct_browser";
    let isEmbedded = false;
    let channelConfidence = 0.15;

    if (hasTrustedSignedEvidence || hasTrustedToken) {
      trustTier = "trusted_embedded";
      channelType = "nhs_app_webview";
      entryMode = "jump_off";
      isEmbedded = true;
      channelConfidence = 0.99;
    } else if (hasValidatedSso) {
      trustTier = "verified_sso_embedded";
      channelType = "nhs_app_webview";
      entryMode = "post_auth_return";
      isEmbedded = true;
      channelConfidence = 0.95;
    } else if (hasUserAgentMarker || hasQueryHint) {
      trustTier = "hinted_embedded";
      channelType = hasUserAgentMarker ? "nhs_app_webview" : "unknown";
      entryMode = hasUserAgentMarker ? "direct_browser" : "direct_browser";
      isEmbedded = hasUserAgentMarker;
      channelConfidence = hasUserAgentMarker ? 0.55 : 0.35;
      appendUnique(
        blockedReasons,
        hasUserAgentMarker ? "user_agent_not_trusted" : "query_hint_not_trusted",
      );
    }

    if (input.hydrationContext && input.hydrationContext.trustTier !== trustTier) {
      appendUnique(blockedReasons, "hydration_conflict");
      trustTier = "standalone_or_unknown";
      channelType = "unknown";
      isEmbedded = false;
      channelConfidence = 0.05;
    }

    const navigationContract = navigationContractFor(
      input.journeyPathId,
      manifestExposure.journeyPath,
    );
    const allRequiredBridgeActionsSupported = navigationContract.requiredBridgeActionRefs.every(
      (action) => bridgeCapability.supportedBridgeActionRefs.includes(action),
    );
    const continuityTrusted = manifestExposure.continuityEvidence?.validationState === "trusted";
    if (!continuityTrusted) {
      appendUnique(blockedReasons, "continuity_evidence_not_trusted");
    }

    const eligibilityState = chooseEligibilityState({
      trustTier,
      blockedReasons,
      manifestBlockedReasons,
      channelReleaseFreezeState,
      bridgeCapabilityState: bridgeCapability.capabilityState,
      continuityTrusted,
      allRequiredBridgeActionsSupported,
    });
    const resolutionDisposition = dispositionFromEligibility(
      trustTier,
      eligibilityState,
      blockedReasons,
    );

    const channelContext: ChannelContext = {
      channelType,
      entryMode,
      trustTier,
      resolutionDisposition,
      isEmbedded,
      userAgentEvidence,
      queryEvidence: query,
      signedContextEvidence: input.signedContextEvidence ?? null,
      assertedIdentityPresent:
        query.assertedLoginIdentity === "redacted" || input.ssoHandoffState === "pending",
      deepLinkPresent: Boolean(query.deepLink || query.linkToken),
      jumpOffSource: query.source ?? null,
      channelConfidence,
    };

    const shellPolicy = buildShellPolicy(channelContext);
    const journeyPath = manifestExposure.journeyPath;
    const subjectRef = localSession?.subjectRef ?? "subject:unresolved";
    const identityBindingRef = localSession?.identityBindingRef ?? "IdentityBinding:unresolved";
    const sessionEpochRef = localSession?.sessionEpochRef ?? "SessionEpoch:missing";
    const subjectBindingVersionRef =
      localSession?.subjectBindingVersionRef ?? "SubjectBindingVersion:missing";
    const selectedAnchorRef =
      localSession?.selectedAnchorRef ?? `SelectedAnchor:${input.journeyPathId}:safe-placeholder`;
    const returnContractRef =
      localSession?.returnContractRef ?? "ReturnIntent:phase7-embedded-safe-recovery";
    const patientShellContinuityKey =
      input.embeddedEntryToken?.contextClaims.patientShellContinuityKey ??
      localSession?.patientShellContinuityKey ??
      "patient-shell-continuity:unresolved";
    const entityContinuityKey =
      input.embeddedEntryToken?.contextClaims.entityContinuityKey ??
      localSession?.entityContinuityKey ??
      "entity-continuity:unresolved";
    const continuityEvidenceRef =
      manifestExposure.continuityEvidence?.experienceContinuityEvidenceRefs[0] ??
      "ExperienceContinuityControlEvidence:missing";
    const routeFreezeDispositionRef =
      journeyPath?.routeFreezeDispositionRef ?? "RouteFreezeDisposition:nhs-app-freeze-in-place-v1";
    const recoveryRouteRef = journeyPath?.fallbackRoute ?? "/requests";
    const patientEmbeddedSessionProjectionId = `pesp_378_${hashString(
      `${subjectRef}:${input.journeyPathId}:${sessionEpochRef}:${eligibilityState}`,
    ).slice(7, 19)}`;

    const patientEmbeddedSessionProjection: PatientEmbeddedSessionProjection = {
      patientEmbeddedSessionProjectionId,
      subjectRef,
      identityBindingRef,
      sessionEpochRef,
      subjectBindingVersionRef,
      manifestVersionRef:
        manifestExposure.auditRecord.manifestVersionRef ?? PHASE7_MANIFEST_VERSION,
      releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
      channelReleaseFreezeState,
      minimumBridgeCapabilitiesRef: PHASE7_MINIMUM_BRIDGE_REF,
      currentBridgeCapabilityMatrixRef: bridgeCapability.bridgeCapabilityMatrixRef,
      routeFreezeDispositionRef,
      experienceContinuityEvidenceRef: continuityEvidenceRef,
      eligibilityState,
      recoveryRouteRef,
      computedAt: now,
    };

    const patientEmbeddedNavEligibility: PatientEmbeddedNavEligibility = {
      embeddedNavEligibilityId: `penav_378_${hashString(
        `${patientEmbeddedSessionProjectionId}:${input.journeyPathId}`,
      ).slice(7, 19)}`,
      journeyPathRef: input.journeyPathId,
      routeFamilyRef: navigationContract.routeFamilyRef,
      patientEmbeddedSessionProjectionRef: patientEmbeddedSessionProjectionId,
      bridgeCapabilityMatrixRef: bridgeCapability.bridgeCapabilityMatrixRef,
      minimumBridgeCapabilitiesRef: PHASE7_MINIMUM_BRIDGE_REF,
      requiredBridgeActionRefs: [...navigationContract.requiredBridgeActionRefs],
      allowedBridgeActionRefs: navigationContract.requiredBridgeActionRefs.filter((action) =>
        bridgeCapability.supportedBridgeActionRefs.includes(action),
      ),
      fallbackActionRefs: [...navigationContract.fallbackActionRefs],
      routeFreezeDispositionRef,
      continuityEvidenceRef,
      eligibilityState,
      evaluatedAt: now,
    };

    const embeddedShellConsistencyProjection: EmbeddedShellConsistencyProjection = {
      consistencyId: `escp_378_${hashString(
        `${patientShellContinuityKey}:${entityContinuityKey}:${input.journeyPathId}`,
      ).slice(7, 19)}`,
      journeyPathId: input.journeyPathId,
      patientShellContinuityKey,
      entityContinuityKey,
      bundleVersion: manifestExposure.auditRecord.manifestVersionRef ?? PHASE7_MANIFEST_VERSION,
      audienceTier: "nhs_app_patient",
      governingObjectVersionRefs: [
        `RouteIntentBinding:${navigationContract.routeFamilyRef}:current`,
        `ReleaseApprovalFreeze:${PHASE7_RELEASE_APPROVAL_FREEZE_REF}`,
      ],
      selectedAnchorRef,
      returnContractRef,
      placeholderContractRefs: journeyPath ? [journeyPath.placeholderContractRef] : [],
      continuityEvidenceRefs:
        manifestExposure.continuityEvidence?.experienceContinuityEvidenceRefs ?? [],
      currentBridgeCapabilityMatrixRef: bridgeCapability.bridgeCapabilityMatrixRef,
      patientEmbeddedNavEligibilityRef: PHASE7_EMBEDDED_NAV_ELIGIBILITY_REF,
      shellState: mapEligibilityToShellState(eligibilityState),
      computedAt: now,
      staleAt: DEFAULT_STALE_AT,
      causalConsistencyState: blockedReasons.includes("hydration_conflict")
        ? "conflict"
        : blockedReasons.includes("manifest_drift") || blockedReasons.includes("session_inactive")
          ? "stale"
          : "current",
      projectionTrustState: projectionTrustFrom(trustTier, eligibilityState),
    };

    const auditRecords = [
      auditStore.record({
        eventType: "channel_context_resolved",
        journeyPathRef: input.journeyPathId,
        manifestVersionRef: manifestExposure.auditRecord.manifestVersionRef,
        configFingerprintRef: manifestExposure.auditRecord.configFingerprintRef,
        trustTier,
        resolutionDisposition,
        blockedReasons,
        rawQueryKeys,
      }),
      auditStore.record({
        eventType: "shell_policy_resolved",
        journeyPathRef: input.journeyPathId,
        manifestVersionRef: manifestExposure.auditRecord.manifestVersionRef,
        configFingerprintRef: manifestExposure.auditRecord.configFingerprintRef,
        trustTier,
        resolutionDisposition,
        blockedReasons,
        rawQueryKeys,
      }),
      auditStore.record({
        eventType: "embedded_session_projected",
        journeyPathRef: input.journeyPathId,
        manifestVersionRef: patientEmbeddedSessionProjection.manifestVersionRef,
        configFingerprintRef: PHASE7_CONFIG_FINGERPRINT,
        trustTier,
        resolutionDisposition,
        blockedReasons,
        rawQueryKeys,
      }),
      auditStore.record({
        eventType: "embedded_nav_eligibility_evaluated",
        journeyPathRef: input.journeyPathId,
        manifestVersionRef: patientEmbeddedSessionProjection.manifestVersionRef,
        configFingerprintRef: PHASE7_CONFIG_FINGERPRINT,
        trustTier,
        resolutionDisposition,
        blockedReasons,
        rawQueryKeys,
      }),
      auditStore.record({
        eventType: "ssr_hydration_bound",
        journeyPathRef: input.journeyPathId,
        manifestVersionRef: patientEmbeddedSessionProjection.manifestVersionRef,
        configFingerprintRef: PHASE7_CONFIG_FINGERPRINT,
        trustTier,
        resolutionDisposition,
        blockedReasons,
        rawQueryKeys,
      }),
    ];

    return {
      channelContext,
      shellPolicy,
      embeddedShellConsistencyProjection,
      patientEmbeddedSessionProjection,
      patientEmbeddedNavEligibility,
      blockedReasons,
      manifestBlockedReasons,
      hydrationBinding: {
        serverContextRef: auditRecords[0]?.auditId ?? "audit:378:missing",
        rehydrateFromServerOnly: true,
        clientMayRecomputeTrust: false,
        conflictDisposition: "bounded_recovery",
      },
      auditRecords,
    };
  }

  return {
    tokenService,
    evidenceVerifier,
    auditStore,
    issueEmbeddedEntryToken: tokenService.issue.bind(tokenService),
    signChannelContextEvidence: evidenceVerifier.sign.bind(evidenceVerifier),
    resolve,
    listAuditRecords() {
      return auditStore.list();
    },
  };
}

export function createDefaultPhase7EmbeddedContextApplication(): Phase7EmbeddedContextApplication {
  return createPhase7EmbeddedContextApplication();
}

export function createTrustedContextEvidence(input: {
  journeyPathId: string;
  cohortRef?: string;
  observedAt?: string;
  expiresAt?: string;
}): ChannelContextEvidence {
  const verifier = new ChannelContextEvidenceVerifier();
  return verifier.sign({
    evidenceId: `${TRUSTED_CONTEXT_EVIDENCE_REF}:${input.journeyPathId}`,
    source: "signed_entry_token",
    observedAt: input.observedAt ?? RECORDED_AT,
    expiresAt: input.expiresAt ?? DEFAULT_STALE_AT,
    nonce: `nonce:evidence:${hashString(input.journeyPathId).slice(7, 17)}`,
    signatureState: "valid",
    requestedShell: "embedded",
    expectedJourneyPath: input.journeyPathId,
    cohortRef: input.cohortRef ?? "cohort:phase7-internal-sandpit-only",
  });
}
