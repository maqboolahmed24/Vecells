import { startTransition, useEffect, useState } from "react";
import type { ShellSlug } from "@vecells/api-contracts";
import type { ReleaseTrustFreezeVerdictContract } from "@vecells/release-controls";
import { getPersistentShellRouteClaim } from "./contracts";

export const ROUTE_GUARD_TASK_ID = "par_112";
export const ROUTE_GUARD_VISUAL_MODE = "Route_Guard_Lab";

export type RouteGuardPosture = "live" | "read_only" | "recovery_only" | "blocked";
export type RouteGuardHydrationState =
  | "binding_pending"
  | "binding_ready"
  | "binding_invalid";
export type RouteGuardChannelProfile =
  | "browser"
  | "constrained_browser"
  | "embedded"
  | "assistive_sidecar";
export type EmbeddedCapability =
  | "signed_identity_bridge"
  | "host_return"
  | "secure_storage"
  | "file_handoff";
export type CapabilitySwitchKind =
  | "route_entry"
  | "projection_query"
  | "mutation_command"
  | "live_update_channel"
  | "cache_reuse"
  | "recovery_action"
  | "embedded_bridge";
export type CapabilitySwitchExposure = "route" | "action";
export type GuardCapabilityState =
  | "enabled"
  | "read_only"
  | "recovery_only"
  | "blocked"
  | "hidden";
export type SameShellDisposition =
  | "render_live"
  | "downgrade_read_only"
  | "downgrade_recovery_only"
  | "downgrade_blocked";
export type SelectedAnchorDisposition = "preserve" | "freeze" | "reset_to_route_default";
export type RouteFreezeState = "normal" | "read_only" | "recovery_only" | "blocked";
export type ReleaseRecoveryMode =
  | "refresh_tuple"
  | "resume_return_contract"
  | "browser_handoff"
  | "review_summary";
export type RouteGuardPrecedenceStage =
  | "ownership_and_eligibility"
  | "runtime_binding"
  | "release_channel_trust"
  | "capability_switches"
  | "route_freeze_and_recovery";

export interface FrontendContractManifestLike {
  frontendContractManifestId: string;
  manifestState: string;
  audienceSurface: string;
  audienceSurfaceLabel?: string;
  shellType: string;
  routeFamilyRefs: readonly string[];
  gatewaySurfaceRef?: string;
  gatewaySurfaceRefs: readonly string[];
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  runtimePublicationBundleRef: string;
  designContractPublicationBundleRef: string;
  projectionQueryContractRefs: readonly string[];
  mutationCommandContractRefs: readonly string[];
  liveUpdateChannelContractRefs: readonly string[];
  clientCachePolicyRef: string;
  clientCachePolicyRefs: readonly string[];
  releaseRecoveryDispositionRef: string;
  releaseRecoveryDispositionRefs: readonly string[];
  routeFreezeDispositionRef: string;
  routeFreezeDispositionRefs: readonly string[];
  browserPostureState?: RouteGuardPosture;
  source_refs?: readonly string[];
}

export interface AudienceSurfaceRuntimeBindingLike {
  audienceSurfaceRuntimeBindingId: string;
  audienceSurface: string;
  routeFamilyRefs: readonly string[];
  gatewaySurfaceRefs: readonly string[];
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  designContractPublicationBundleRef: string;
  bindingState: RouteGuardPosture;
  surfaceAuthorityState: string;
  releaseRecoveryDispositionRefs: readonly string[];
  routeFreezeDispositionRefs: readonly string[];
  surfaceTupleHash: string;
  generatedAt: string;
  source_refs?: readonly string[];
}

export interface ReleaseTrustFreezeVerdictLike
  extends Pick<
    ReleaseTrustFreezeVerdictContract,
    | "releaseTrustFreezeVerdictId"
    | "audienceSurface"
    | "routeFamilyRef"
    | "surfaceAuthorityState"
    | "calmTruthState"
    | "mutationAuthorityState"
    | "blockerRefs"
    | "evaluatedAt"
  > {}

export interface RouteFreezeDispositionLike {
  routeFreezeDispositionId: string;
  routeFamilyRef: string;
  freezeState: RouteFreezeState;
  sameShellDisposition: SameShellDisposition;
  recoveryActionLabel: string;
  reasonRefs: readonly string[];
}

export interface ReleaseRecoveryDispositionLike {
  releaseRecoveryDispositionId: string;
  posture: Exclude<RouteGuardPosture, "live">;
  label: string;
  summary: string;
  actionLabel: string;
  continuityMode: ReleaseRecoveryMode;
  reasonRefs: readonly string[];
}

export interface RouteGuardAudienceContext {
  audienceSurface?: string;
  channelProfile: RouteGuardChannelProfile;
  embeddedCapabilities?: readonly EmbeddedCapability[];
}

export interface CapabilitySwitchDefinition {
  capabilityId: string;
  routeFamilyRef: string;
  manifestRef: string | null;
  capabilityKind: CapabilitySwitchKind;
  exposure: CapabilitySwitchExposure;
  label: string;
  inspectorLabel: string;
  requiredPosture: RouteGuardPosture;
  sourceRefs: readonly string[];
}

export interface ResolvedCapabilitySwitch extends CapabilitySwitchDefinition {
  presentInManifest: boolean;
  enabledForRoute: boolean;
  state: GuardCapabilityState;
  reasonRefs: readonly string[];
}

export interface RouteGuardPrecedenceStep {
  stage: RouteGuardPrecedenceStage;
  posture: RouteGuardPosture;
  reasonRefs: readonly string[];
}

export interface RouteGuardDecision {
  routeFamilyRef: string;
  shellSlug: ShellSlug;
  audienceSurface: string;
  requestedAudienceSurface: string;
  channelProfile: RouteGuardChannelProfile;
  manifestRef: string | null;
  runtimeBindingRef: string | null;
  surfaceTupleHash: string | null;
  hydrationState: RouteGuardHydrationState;
  effectivePosture: RouteGuardPosture;
  sameShellDisposition: SameShellDisposition;
  selectedAnchorDisposition: SelectedAnchorDisposition;
  preserveHeader: boolean;
  preserveLastSafeSummary: boolean;
  lastSafeSummary: string;
  dominantRecoveryAction:
    | {
        label: string;
        continuityMode: ReleaseRecoveryMode;
      }
    | null;
  capabilitySwitches: readonly ResolvedCapabilitySwitch[];
  reasonRefs: readonly string[];
  precedenceTrail: readonly RouteGuardPrecedenceStep[];
}

export interface ActionGuardDecision {
  routeFamilyRef: string;
  capabilityId: string;
  capabilityKind: CapabilitySwitchKind;
  label: string;
  state: GuardCapabilityState;
  shouldRender: boolean;
  reasonRefs: readonly string[];
}

export interface RouteGuardHydrationSnapshot {
  routeFamilyRef: string;
  audienceSurface: string;
  hydrationState: RouteGuardHydrationState;
  effectivePosture: RouteGuardPosture;
  runtimeBinding: AudienceSurfaceRuntimeBindingLike | null;
  reasonRefs: readonly string[];
  observedAt: string;
}

export interface HydrateRuntimeBindingOptions {
  routeFamilyRef: string;
  manifest: FrontendContractManifestLike | null;
  audienceSurface?: string;
  loader: () =>
    | AudienceSurfaceRuntimeBindingLike
    | null
    | Promise<AudienceSurfaceRuntimeBindingLike | null>;
  observedAt?: string;
}

export interface UseRouteGuardBindingHydrationOptions
  extends Omit<HydrateRuntimeBindingOptions, "observedAt"> {}

export interface UseRouteAuthorityGuardOptions {
  routeFamilyRef: string;
  manifest: FrontendContractManifestLike | null;
  audienceContext: RouteGuardAudienceContext;
  releaseVerdict: ReleaseTrustFreezeVerdictLike | null;
  routeFreezeDisposition?: RouteFreezeDispositionLike | null;
  releaseRecoveryDisposition?: ReleaseRecoveryDispositionLike | null;
  loader: () =>
    | AudienceSurfaceRuntimeBindingLike
    | null
    | Promise<AudienceSurfaceRuntimeBindingLike | null>;
}

export interface RouteGuardSurfaceProps {
  decision: RouteGuardDecision;
  selectedAnchor?: string;
  className?: string;
}

interface RouteAuthoritySeed {
  routeFamilyRef: string;
  audienceSurface: string;
  allowedChannelProfiles: readonly RouteGuardChannelProfile[];
  requiredEmbeddedCapabilities: readonly EmbeddedCapability[];
  supportsMutation: boolean;
  supportsLiveUpdates: boolean;
  supportsArtifactSummary: boolean;
  sourceRefs: readonly string[];
}

export interface RouteAuthorityProfile {
  routeFamilyRef: string;
  routeLabel: string;
  shellSlug: ShellSlug;
  audienceSurface: string;
  allowedChannelProfiles: readonly RouteGuardChannelProfile[];
  requiredEmbeddedCapabilities: readonly EmbeddedCapability[];
  supportsMutation: boolean;
  supportsLiveUpdates: boolean;
  supportsArtifactSummary: boolean;
  lastSafeSummary: string;
  sourceRefs: readonly string[];
}

const routeAuthoritySeeds: readonly RouteAuthoritySeed[] = [
  {
    routeFamilyRef: "rf_patient_home",
    audienceSurface: "audsurf_patient_authenticated_portal",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: false,
    supportsLiveUpdates: false,
    supportsArtifactSummary: true,
    sourceRefs: [
      "blueprint/patient-portal-experience-architecture-blueprint.md#Portal entry and shell topology",
    ],
  },
  {
    routeFamilyRef: "rf_patient_requests",
    audienceSurface: "audsurf_patient_authenticated_portal",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: false,
    supportsArtifactSummary: true,
    sourceRefs: [
      "blueprint/patient-account-and-communications-blueprint.md#Request detail rules",
    ],
  },
  {
    routeFamilyRef: "rf_intake_self_service",
    audienceSurface: "audsurf_patient_public_entry",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: false,
    supportsArtifactSummary: false,
    sourceRefs: ["blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface"],
  },
  {
    routeFamilyRef: "rf_patient_appointments",
    audienceSurface: "audsurf_patient_authenticated_portal",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: true,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/phase-4-the-booking-engine.md#Booking route continuity"],
  },
  {
    routeFamilyRef: "rf_patient_health_record",
    audienceSurface: "audsurf_patient_authenticated_portal",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: false,
    supportsLiveUpdates: false,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/platform-frontend-blueprint.md#Artifact rendering, preview, export"],
  },
  {
    routeFamilyRef: "rf_patient_messages",
    audienceSurface: "audsurf_patient_authenticated_portal",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: true,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/phase-0-the-foundation-protocol.md#5.5 Unified care conversation algorithm"],
  },
  {
    routeFamilyRef: "rf_patient_secure_link_recovery",
    audienceSurface: "audsurf_patient_transaction_recovery",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: false,
    supportsArtifactSummary: false,
    sourceRefs: ["blueprint/phase-2-identity-and-echoes.md#Continuation and secure-link recovery"],
  },
  {
    routeFamilyRef: "rf_patient_embedded_channel",
    audienceSurface: "audsurf_patient_transaction_recovery",
    allowedChannelProfiles: ["embedded"],
    requiredEmbeddedCapabilities: ["signed_identity_bridge", "host_return"],
    supportsMutation: false,
    supportsLiveUpdates: false,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/phase-7-inside-the-nhs-app.md#Embedded capability floor"],
  },
  {
    routeFamilyRef: "rf_intake_telephony_capture",
    audienceSurface: "audsurf_patient_public_entry",
    allowedChannelProfiles: ["constrained_browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: false,
    supportsArtifactSummary: false,
    sourceRefs: ["blueprint/phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers"],
  },
  {
    routeFamilyRef: "rf_staff_workspace",
    audienceSurface: "audsurf_clinical_workspace",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: true,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/staff-workspace-interface-architecture.md#Assistive companion presentation profile"],
  },
  {
    routeFamilyRef: "rf_staff_workspace_child",
    audienceSurface: "audsurf_clinical_workspace",
    allowedChannelProfiles: ["browser", "assistive_sidecar"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: false,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/phase-8-the-assistive-layer.md#Control priorities"],
  },
  {
    routeFamilyRef: "rf_support_ticket_workspace",
    audienceSurface: "audsurf_support_workspace",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: false,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/staff-operations-and-support-blueprint.md#Support route contract"],
  },
  {
    routeFamilyRef: "rf_support_replay_observe",
    audienceSurface: "audsurf_support_workspace",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: false,
    supportsLiveUpdates: false,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/staff-operations-and-support-blueprint.md#Support route contract"],
  },
  {
    routeFamilyRef: "rf_hub_queue",
    audienceSurface: "audsurf_hub_desk",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: false,
    supportsLiveUpdates: true,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/phase-5-the-network-horizon.md#Hub shell behavior"],
  },
  {
    routeFamilyRef: "rf_hub_case_management",
    audienceSurface: "audsurf_hub_desk",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: true,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/phase-5-the-network-horizon.md#Hub shell behavior"],
  },
  {
    routeFamilyRef: "rf_pharmacy_console",
    audienceSurface: "audsurf_pharmacy_console",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: true,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/pharmacy-console-frontend-architecture.md#Frontend route family requirements"],
  },
  {
    routeFamilyRef: "rf_operations_board",
    audienceSurface: "audsurf_operations_console",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: false,
    supportsLiveUpdates: true,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/operations-console-frontend-blueprint.md#Every operations route family"],
  },
  {
    routeFamilyRef: "rf_operations_drilldown",
    audienceSurface: "audsurf_operations_console",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: false,
    supportsLiveUpdates: false,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#Every writable or export-capable operator-facing route"],
  },
  {
    routeFamilyRef: "rf_governance_shell",
    audienceSurface: "audsurf_governance_admin",
    allowedChannelProfiles: ["browser"],
    requiredEmbeddedCapabilities: [],
    supportsMutation: true,
    supportsLiveUpdates: false,
    supportsArtifactSummary: true,
    sourceRefs: ["blueprint/governance-admin-console-frontend-blueprint.md#Route family ownership"],
  },
] as const;

export const routeAuthorityProfiles: readonly RouteAuthorityProfile[] = routeAuthoritySeeds.map(
  (seed) => {
    const route = getPersistentShellRouteClaim(seed.routeFamilyRef);
    return {
      routeFamilyRef: seed.routeFamilyRef,
      routeLabel: route.title,
      shellSlug: route.shellSlug,
      audienceSurface: seed.audienceSurface,
      allowedChannelProfiles: seed.allowedChannelProfiles,
      requiredEmbeddedCapabilities: seed.requiredEmbeddedCapabilities,
      supportsMutation: seed.supportsMutation,
      supportsLiveUpdates: seed.supportsLiveUpdates,
      supportsArtifactSummary: seed.supportsArtifactSummary,
      lastSafeSummary: route.routeSummary,
      sourceRefs: [...seed.sourceRefs, ...route.sourceRefs],
    };
  },
);

const routeAuthorityProfileByRef = new Map(
  routeAuthorityProfiles.map((profile) => [profile.routeFamilyRef, profile]),
);

function safeNowIso(value?: string): string {
  return value ?? "2026-04-13T00:00:00Z";
}

function postureRank(posture: RouteGuardPosture): number {
  switch (posture) {
    case "live":
      return 0;
    case "read_only":
      return 1;
    case "recovery_only":
      return 2;
    case "blocked":
      return 3;
  }
}

function worsenPosture(
  current: RouteGuardPosture,
  candidate: RouteGuardPosture,
): RouteGuardPosture {
  return postureRank(candidate) > postureRank(current) ? candidate : current;
}

function postureFromHydrationState(state: RouteGuardHydrationState): RouteGuardPosture {
  switch (state) {
    case "binding_pending":
      return "recovery_only";
    case "binding_ready":
      return "live";
    case "binding_invalid":
      return "recovery_only";
  }
}

function postureFromReleaseVerdict(
  verdict: ReleaseTrustFreezeVerdictLike | null,
): RouteGuardPosture {
  if (!verdict) {
    return "recovery_only";
  }
  switch (verdict.surfaceAuthorityState) {
    case "live":
      return "live";
    case "diagnostic_only":
      return "read_only";
    case "recovery_only":
      return "recovery_only";
    case "blocked":
      return "blocked";
  }
}

function postureFromRouteFreeze(
  currentPosture: RouteGuardPosture,
  freeze: RouteFreezeDispositionLike | null | undefined,
  recovery: ReleaseRecoveryDispositionLike | null | undefined,
): RouteGuardPosture {
  let posture = currentPosture;
  if (freeze && freeze.freezeState !== "normal") {
    posture = worsenPosture(posture, freeze.freezeState);
  }
  if (posture !== "live" && recovery) {
    posture = worsenPosture(posture, recovery.posture);
  }
  return posture;
}

function sameShellDispositionForPosture(posture: RouteGuardPosture): SameShellDisposition {
  switch (posture) {
    case "live":
      return "render_live";
    case "read_only":
      return "downgrade_read_only";
    case "recovery_only":
      return "downgrade_recovery_only";
    case "blocked":
      return "downgrade_blocked";
  }
}

function selectedAnchorDispositionForPosture(
  posture: RouteGuardPosture,
): SelectedAnchorDisposition {
  switch (posture) {
    case "live":
      return "preserve";
    case "read_only":
    case "recovery_only":
      return "freeze";
    case "blocked":
      return "reset_to_route_default";
  }
}

export function listRouteGuardAuthorityProfiles(): readonly RouteAuthorityProfile[] {
  return routeAuthorityProfiles;
}

export function getRouteGuardAuthorityProfile(
  routeFamilyRef: string,
): RouteAuthorityProfile {
  const profile = routeAuthorityProfileByRef.get(routeFamilyRef);
  if (!profile) {
    throw new Error(`ROUTE_GUARD_AUTHORITY_PROFILE_UNKNOWN:${routeFamilyRef}`);
  }
  return profile;
}

export function resolveManifestForRoute(
  routeFamilyRef: string,
  manifests: readonly FrontendContractManifestLike[],
): FrontendContractManifestLike | null {
  const matches = manifests.filter((manifest) =>
    manifest.routeFamilyRefs.includes(routeFamilyRef),
  );
  if (matches.length > 1) {
    throw new Error(`ROUTE_GUARD_MANIFEST_DUPLICATED:${routeFamilyRef}`);
  }
  return matches[0] ?? null;
}

export function validateRuntimeBindingJoin(input: {
  routeFamilyRef: string;
  manifest: FrontendContractManifestLike | null;
  runtimeBinding: AudienceSurfaceRuntimeBindingLike | null;
  audienceSurface?: string;
}): readonly string[] {
  const reasons: string[] = [];
  if (!input.runtimeBinding) {
    return ["runtime_binding_missing"];
  }
  if (!input.manifest) {
    reasons.push("manifest_missing");
    return reasons;
  }
  if (
    input.runtimeBinding.audienceSurfaceRuntimeBindingId !==
    input.manifest.audienceSurfaceRuntimeBindingRef
  ) {
    reasons.push("runtime_binding_ref_mismatch");
  }
  if (input.runtimeBinding.audienceSurface !== input.manifest.audienceSurface) {
    reasons.push("runtime_binding_audience_mismatch");
  }
  if (
    input.audienceSurface &&
    input.runtimeBinding.audienceSurface !== input.audienceSurface
  ) {
    reasons.push("runtime_binding_requested_audience_mismatch");
  }
  if (
    !input.runtimeBinding.routeFamilyRefs.includes(input.routeFamilyRef) ||
    !input.manifest.routeFamilyRefs.includes(input.routeFamilyRef)
  ) {
    reasons.push("runtime_binding_route_family_mismatch");
  }
  if (
    input.runtimeBinding.surfaceRouteContractRef !== input.manifest.surfaceRouteContractRef
  ) {
    reasons.push("runtime_binding_surface_route_contract_mismatch");
  }
  if (
    input.runtimeBinding.surfacePublicationRef !== input.manifest.surfacePublicationRef
  ) {
    reasons.push("runtime_binding_surface_publication_mismatch");
  }
  return reasons;
}

export async function hydrateRuntimeBindingSnapshot(
  options: HydrateRuntimeBindingOptions,
): Promise<RouteGuardHydrationSnapshot> {
  const requestedAudienceSurface =
    options.audienceSurface ?? options.manifest?.audienceSurface ?? "unknown";
  try {
    const runtimeBinding = await Promise.resolve(options.loader());
    const reasonRefs = validateRuntimeBindingJoin({
      routeFamilyRef: options.routeFamilyRef,
      manifest: options.manifest,
      runtimeBinding,
      audienceSurface: requestedAudienceSurface,
    });
    if (!runtimeBinding || reasonRefs.length > 0) {
      return {
        routeFamilyRef: options.routeFamilyRef,
        audienceSurface: requestedAudienceSurface,
        hydrationState: "binding_invalid",
        effectivePosture: "recovery_only",
        runtimeBinding,
        reasonRefs,
        observedAt: safeNowIso(options.observedAt),
      };
    }
    return {
      routeFamilyRef: options.routeFamilyRef,
      audienceSurface: requestedAudienceSurface,
      hydrationState: "binding_ready",
      effectivePosture: runtimeBinding.bindingState,
      runtimeBinding,
      reasonRefs: [],
      observedAt: safeNowIso(options.observedAt),
    };
  } catch {
    return {
      routeFamilyRef: options.routeFamilyRef,
      audienceSurface: requestedAudienceSurface,
      hydrationState: "binding_invalid",
      effectivePosture: "recovery_only",
      runtimeBinding: null,
      reasonRefs: ["runtime_binding_loader_failed"],
      observedAt: safeNowIso(options.observedAt),
    };
  }
}

function pendingHydrationSnapshot(
  routeFamilyRef: string,
  audienceSurface: string,
): RouteGuardHydrationSnapshot {
  return {
    routeFamilyRef,
    audienceSurface,
    hydrationState: "binding_pending",
    effectivePosture: "recovery_only",
    runtimeBinding: null,
    reasonRefs: ["runtime_binding_pending"],
    observedAt: safeNowIso(),
  };
}

export function useRouteGuardBindingHydration(
  options: UseRouteGuardBindingHydrationOptions,
): RouteGuardHydrationSnapshot {
  const requestedAudienceSurface =
    options.audienceSurface ?? options.manifest?.audienceSurface ?? "unknown";
  const [snapshot, setSnapshot] = useState<RouteGuardHydrationSnapshot>(() =>
    pendingHydrationSnapshot(options.routeFamilyRef, requestedAudienceSurface),
  );

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      setSnapshot(pendingHydrationSnapshot(options.routeFamilyRef, requestedAudienceSurface));
    });
    hydrateRuntimeBindingSnapshot({
      routeFamilyRef: options.routeFamilyRef,
      manifest: options.manifest,
      audienceSurface: requestedAudienceSurface,
      loader: options.loader,
    }).then((nextSnapshot) => {
      if (cancelled) {
        return;
      }
      startTransition(() => {
        setSnapshot(nextSnapshot);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    options.routeFamilyRef,
    options.manifest,
    options.loader,
    requestedAudienceSurface,
  ]);

  return snapshot;
}

function routeVisibilityPresent(
  manifest: FrontendContractManifestLike | null,
  routeFamilyRef: string,
): boolean {
  return manifest?.routeFamilyRefs.includes(routeFamilyRef) ?? false;
}

function resolveCapabilityDefinitions(
  profile: RouteAuthorityProfile,
  manifest: FrontendContractManifestLike | null,
): CapabilitySwitchDefinition[] {
  const definitions: CapabilitySwitchDefinition[] = [
    {
      capabilityId: `${profile.routeFamilyRef}::route_entry`,
      routeFamilyRef: profile.routeFamilyRef,
      manifestRef: manifest?.frontendContractManifestId ?? null,
      capabilityKind: "route_entry",
      exposure: "route",
      label: "Route access",
      inspectorLabel: "Published route access",
      requiredPosture: "live",
      sourceRefs: profile.sourceRefs,
    },
    {
      capabilityId: `${profile.routeFamilyRef}::projection_query`,
      routeFamilyRef: profile.routeFamilyRef,
      manifestRef: manifest?.frontendContractManifestId ?? null,
      capabilityKind: "projection_query",
      exposure: "route",
      label: "Current summary view",
      inspectorLabel: "Release list-declared projection view",
      requiredPosture: "read_only",
      sourceRefs: profile.sourceRefs,
    },
    {
      capabilityId: `${profile.routeFamilyRef}::cache_reuse`,
      routeFamilyRef: profile.routeFamilyRef,
      manifestRef: manifest?.frontendContractManifestId ?? null,
      capabilityKind: "cache_reuse",
      exposure: "route",
      label: "Same-shell continuity cache",
      inspectorLabel: "Release list-declared cache reuse",
      requiredPosture: "read_only",
      sourceRefs: profile.sourceRefs,
    },
  ];

  if (profile.supportsMutation) {
    definitions.push({
      capabilityId: `${profile.routeFamilyRef}::mutation_command`,
      routeFamilyRef: profile.routeFamilyRef,
      manifestRef: manifest?.frontendContractManifestId ?? null,
      capabilityKind: "mutation_command",
      exposure: "action",
      label: "Primary approved action",
      inspectorLabel: "Release list-declared mutation lane",
      requiredPosture: "live",
      sourceRefs: profile.sourceRefs,
    });
  }

  if (profile.supportsLiveUpdates) {
    definitions.push({
      capabilityId: `${profile.routeFamilyRef}::live_update_channel`,
      routeFamilyRef: profile.routeFamilyRef,
      manifestRef: manifest?.frontendContractManifestId ?? null,
      capabilityKind: "live_update_channel",
      exposure: "action",
      label: "Live watch updates",
      inspectorLabel: "Release list-declared live channel",
      requiredPosture: "live",
      sourceRefs: profile.sourceRefs,
    });
  }

  definitions.push({
    capabilityId: `${profile.routeFamilyRef}::recovery_action`,
    routeFamilyRef: profile.routeFamilyRef,
    manifestRef: manifest?.frontendContractManifestId ?? null,
    capabilityKind: "recovery_action",
    exposure: "action",
    label: "Recovery action",
    inspectorLabel: "Approved recovery action",
    requiredPosture: "recovery_only",
    sourceRefs: profile.sourceRefs,
  });

  if (profile.requiredEmbeddedCapabilities.length > 0) {
    definitions.push({
      capabilityId: `${profile.routeFamilyRef}::embedded_bridge`,
      routeFamilyRef: profile.routeFamilyRef,
      manifestRef: manifest?.frontendContractManifestId ?? null,
      capabilityKind: "embedded_bridge",
      exposure: "action",
      label: "Embedded host bridge",
      inspectorLabel: "Published embedded capability floor",
      requiredPosture: "live",
      sourceRefs: profile.sourceRefs,
    });
  }

  return definitions;
}

function capabilityPresentInManifest(
  definition: CapabilitySwitchDefinition,
  manifest: FrontendContractManifestLike | null,
  profile: RouteAuthorityProfile,
): boolean {
  if (!manifest) {
    return false;
  }
  switch (definition.capabilityKind) {
    case "route_entry":
      return routeVisibilityPresent(manifest, definition.routeFamilyRef);
    case "projection_query":
      return manifest.projectionQueryContractRefs.length > 0;
    case "mutation_command":
      return profile.supportsMutation && manifest.mutationCommandContractRefs.length > 0;
    case "live_update_channel":
      return profile.supportsLiveUpdates && manifest.liveUpdateChannelContractRefs.length > 0;
    case "cache_reuse":
      return manifest.clientCachePolicyRefs.length > 0;
    case "recovery_action":
      return manifest.releaseRecoveryDispositionRefs.length > 0;
    case "embedded_bridge":
      return manifest.gatewaySurfaceRefs.some(
        (gateway) => gateway.includes("embedded") || gateway.includes("assistive"),
      );
  }
}

function capabilityStateForDecision(
  definition: CapabilitySwitchDefinition,
  effectivePosture: RouteGuardPosture,
  presentInManifest: boolean,
  manifest: FrontendContractManifestLike | null,
  audienceContext: RouteGuardAudienceContext,
  releaseVerdict: ReleaseTrustFreezeVerdictLike | null,
  missingEmbeddedCapabilities: readonly EmbeddedCapability[],
): GuardCapabilityState {
  if (!presentInManifest) {
    return definition.capabilityKind === "recovery_action" ? "hidden" : "blocked";
  }
  switch (definition.capabilityKind) {
    case "route_entry":
      return effectivePosture === "blocked"
        ? "blocked"
        : effectivePosture === "recovery_only"
          ? "recovery_only"
          : effectivePosture === "read_only"
            ? "read_only"
            : "enabled";
    case "projection_query":
    case "cache_reuse":
      return effectivePosture === "blocked" ? "blocked" : "enabled";
    case "mutation_command":
      if (effectivePosture === "blocked") {
        return "blocked";
      }
      if (effectivePosture === "recovery_only") {
        return "recovery_only";
      }
      if (
        effectivePosture === "read_only" ||
        releaseVerdict?.mutationAuthorityState !== "enabled"
      ) {
        return "read_only";
      }
      return "enabled";
    case "live_update_channel":
      if (effectivePosture === "live" && manifest?.liveUpdateChannelContractRefs.length) {
        return "enabled";
      }
      return effectivePosture === "blocked" ? "blocked" : "read_only";
    case "recovery_action":
      return effectivePosture === "live" ? "hidden" : "enabled";
    case "embedded_bridge":
      if (audienceContext.channelProfile !== "embedded") {
        return "hidden";
      }
      if (missingEmbeddedCapabilities.length > 0) {
        return "recovery_only";
      }
      return effectivePosture === "blocked" ? "blocked" : "enabled";
  }
}

export function resolveCapabilitySwitchRegistry(input: {
  routeFamilyRef: string;
  manifest: FrontendContractManifestLike | null;
  effectivePosture: RouteGuardPosture;
  audienceContext: RouteGuardAudienceContext;
  releaseVerdict: ReleaseTrustFreezeVerdictLike | null;
}): readonly ResolvedCapabilitySwitch[] {
  const profile = getRouteGuardAuthorityProfile(input.routeFamilyRef);
  const missingEmbeddedCapabilities = profile.requiredEmbeddedCapabilities.filter(
    (capability) => !(input.audienceContext.embeddedCapabilities ?? []).includes(capability),
  );
  return resolveCapabilityDefinitions(profile, input.manifest).map((definition) => {
    const presentInManifest = capabilityPresentInManifest(definition, input.manifest, profile);
    const state = capabilityStateForDecision(
      definition,
      input.effectivePosture,
      presentInManifest,
      input.manifest,
      input.audienceContext,
      input.releaseVerdict,
      missingEmbeddedCapabilities,
    );
    const reasonRefs = [
      !presentInManifest ? "capability_absent_from_manifest" : null,
      state === "read_only" ? "capability_downgraded_read_only" : null,
      state === "recovery_only" ? "capability_downgraded_recovery_only" : null,
      state === "blocked" ? "capability_blocked" : null,
      state === "hidden" ? "capability_hidden" : null,
      missingEmbeddedCapabilities.length > 0 &&
      definition.capabilityKind === "embedded_bridge"
        ? `embedded_capability_missing:${missingEmbeddedCapabilities.join("+")}`
        : null,
    ].filter((value): value is string => Boolean(value));
    return {
      ...definition,
      presentInManifest,
      enabledForRoute: state === "enabled",
      state,
      reasonRefs,
    };
  });
}

function eligibleAudienceSurface(
  profile: RouteAuthorityProfile,
  manifest: FrontendContractManifestLike | null,
  requestedAudienceSurface: string,
): readonly string[] {
  const reasons: string[] = [];
  if (!manifest) {
    reasons.push("manifest_missing");
    return reasons;
  }
  if (!routeVisibilityPresent(manifest, profile.routeFamilyRef)) {
    reasons.push("route_not_published_in_manifest");
  }
  if (profile.audienceSurface !== requestedAudienceSurface) {
    reasons.push("route_audience_surface_mismatch");
  }
  if (manifest.audienceSurface !== requestedAudienceSurface) {
    reasons.push("manifest_audience_surface_mismatch");
  }
  return reasons;
}

function eligibleChannelProfile(
  profile: RouteAuthorityProfile,
  context: RouteGuardAudienceContext,
): readonly string[] {
  const reasons: string[] = [];
  if (!profile.allowedChannelProfiles.includes(context.channelProfile)) {
    reasons.push("route_channel_profile_ineligible");
  }
  if (context.channelProfile === "embedded") {
    const missing = profile.requiredEmbeddedCapabilities.filter(
      (capability) => !(context.embeddedCapabilities ?? []).includes(capability),
    );
    if (missing.length > 0) {
      reasons.push(`embedded_capability_floor_unmet:${missing.join("+")}`);
    }
  }
  return reasons;
}

export function resolveRouteGuardDecision(input: {
  routeFamilyRef: string;
  manifest: FrontendContractManifestLike | null;
  hydrationSnapshot?: RouteGuardHydrationSnapshot | null;
  runtimeBinding?: AudienceSurfaceRuntimeBindingLike | null;
  hydrationState?: RouteGuardHydrationState;
  audienceContext: RouteGuardAudienceContext;
  releaseVerdict: ReleaseTrustFreezeVerdictLike | null;
  routeFreezeDisposition?: RouteFreezeDispositionLike | null;
  releaseRecoveryDisposition?: ReleaseRecoveryDispositionLike | null;
}): RouteGuardDecision {
  const profile = getRouteGuardAuthorityProfile(input.routeFamilyRef);
  const requestedAudienceSurface =
    input.audienceContext.audienceSurface ?? input.manifest?.audienceSurface ?? profile.audienceSurface;
  const hydrationSnapshot =
    input.hydrationSnapshot ??
    (input.runtimeBinding || input.hydrationState
      ? {
          routeFamilyRef: input.routeFamilyRef,
          audienceSurface: requestedAudienceSurface,
          hydrationState: input.hydrationState ?? "binding_ready",
          effectivePosture:
            input.runtimeBinding?.bindingState ??
            postureFromHydrationState(input.hydrationState ?? "binding_ready"),
          runtimeBinding: input.runtimeBinding ?? null,
          reasonRefs: validateRuntimeBindingJoin({
            routeFamilyRef: input.routeFamilyRef,
            manifest: input.manifest,
            runtimeBinding: input.runtimeBinding ?? null,
            audienceSurface: requestedAudienceSurface,
          }),
          observedAt: safeNowIso(),
        }
      : pendingHydrationSnapshot(input.routeFamilyRef, requestedAudienceSurface));

  let effectivePosture: RouteGuardPosture = "live";
  const precedenceTrail: RouteGuardPrecedenceStep[] = [];
  const reasonRefs: string[] = [];

  const ownershipReasons = [
    ...eligibleAudienceSurface(profile, input.manifest, requestedAudienceSurface),
    ...eligibleChannelProfile(profile, input.audienceContext),
  ];
  const ownershipPosture =
    ownershipReasons.some((reason) => reason.startsWith("embedded_capability_floor_unmet"))
      ? "recovery_only"
      : ownershipReasons.length > 0
        ? "blocked"
        : "live";
  effectivePosture = worsenPosture(effectivePosture, ownershipPosture);
  precedenceTrail.push({
    stage: "ownership_and_eligibility",
    posture: effectivePosture,
    reasonRefs: ownershipReasons,
  });
  reasonRefs.push(...ownershipReasons);

  const runtimeReasons =
    hydrationSnapshot.hydrationState === "binding_pending"
      ? ["runtime_binding_pending"]
      : hydrationSnapshot.reasonRefs;
  const runtimePosture = worsenPosture(
    postureFromHydrationState(hydrationSnapshot.hydrationState),
    hydrationSnapshot.runtimeBinding?.bindingState ?? "live",
  );
  effectivePosture = worsenPosture(effectivePosture, runtimePosture);
  precedenceTrail.push({
    stage: "runtime_binding",
    posture: effectivePosture,
    reasonRefs: runtimeReasons,
  });
  reasonRefs.push(...runtimeReasons);

  const releaseReasons = [
    ...(input.releaseVerdict?.blockerRefs ?? []),
    !input.releaseVerdict ? "release_verdict_missing" : null,
  ].filter((value): value is string => Boolean(value));
  effectivePosture = worsenPosture(
    effectivePosture,
    postureFromReleaseVerdict(input.releaseVerdict),
  );
  precedenceTrail.push({
    stage: "release_channel_trust",
    posture: effectivePosture,
    reasonRefs: releaseReasons,
  });
  reasonRefs.push(...releaseReasons);

  const capabilitySwitchesBeforeFreeze = resolveCapabilitySwitchRegistry({
    routeFamilyRef: input.routeFamilyRef,
    manifest: input.manifest,
    effectivePosture,
    audienceContext: input.audienceContext,
    releaseVerdict: input.releaseVerdict,
  });
  const capabilityReasons = capabilitySwitchesBeforeFreeze
    .flatMap((capability) => capability.reasonRefs)
    .filter((reason) => reason !== "capability_hidden");
  if (
    capabilitySwitchesBeforeFreeze.some(
      (capability) =>
        capability.capabilityKind === "route_entry" && !capability.presentInManifest,
    )
  ) {
    effectivePosture = worsenPosture(effectivePosture, "blocked");
  }
  precedenceTrail.push({
    stage: "capability_switches",
    posture: effectivePosture,
    reasonRefs: capabilityReasons,
  });
  reasonRefs.push(...capabilityReasons);

  const preFreezePosture = effectivePosture;
  const postFreezePosture = postureFromRouteFreeze(
    effectivePosture,
    input.routeFreezeDisposition ?? null,
    input.releaseRecoveryDisposition ?? null,
  );
  const freezeReasons =
    preFreezePosture === "live" &&
    postFreezePosture === "live" &&
    (input.routeFreezeDisposition?.freezeState ?? "normal") === "normal"
      ? []
      : [
          ...(input.routeFreezeDisposition?.reasonRefs ?? []),
          ...(input.releaseRecoveryDisposition?.reasonRefs ?? []),
        ];
  effectivePosture = postFreezePosture;
  precedenceTrail.push({
    stage: "route_freeze_and_recovery",
    posture: effectivePosture,
    reasonRefs: freezeReasons,
  });
  reasonRefs.push(...freezeReasons);

  const capabilitySwitches = resolveCapabilitySwitchRegistry({
    routeFamilyRef: input.routeFamilyRef,
    manifest: input.manifest,
    effectivePosture,
    audienceContext: input.audienceContext,
    releaseVerdict: input.releaseVerdict,
  });

  return {
    routeFamilyRef: input.routeFamilyRef,
    shellSlug: profile.shellSlug,
    audienceSurface: profile.audienceSurface,
    requestedAudienceSurface,
    channelProfile: input.audienceContext.channelProfile,
    manifestRef: input.manifest?.frontendContractManifestId ?? null,
    runtimeBindingRef:
      hydrationSnapshot.runtimeBinding?.audienceSurfaceRuntimeBindingId ?? null,
    surfaceTupleHash: hydrationSnapshot.runtimeBinding?.surfaceTupleHash ?? null,
    hydrationState: hydrationSnapshot.hydrationState,
    effectivePosture,
    sameShellDisposition:
      input.routeFreezeDisposition?.sameShellDisposition ??
      sameShellDispositionForPosture(effectivePosture),
    selectedAnchorDisposition: selectedAnchorDispositionForPosture(effectivePosture),
    preserveHeader: true,
    preserveLastSafeSummary: effectivePosture !== "blocked",
    lastSafeSummary: profile.lastSafeSummary,
    dominantRecoveryAction:
      effectivePosture === "live" || !input.releaseRecoveryDisposition
        ? null
        : {
            label: input.releaseRecoveryDisposition.actionLabel,
            continuityMode: input.releaseRecoveryDisposition.continuityMode,
          },
    capabilitySwitches,
    reasonRefs: Array.from(new Set(reasonRefs)),
    precedenceTrail,
  };
}

export function resolveActionGuardDecision(input: {
  decision: RouteGuardDecision;
  capabilityId: string;
}): ActionGuardDecision {
  const capability = input.decision.capabilitySwitches.find(
    (entry) => entry.capabilityId === input.capabilityId,
  );
  if (!capability) {
    return {
      routeFamilyRef: input.decision.routeFamilyRef,
      capabilityId: input.capabilityId,
      capabilityKind: "mutation_command",
      label: "Unknown capability",
      state: "hidden",
      shouldRender: false,
      reasonRefs: ["capability_unknown"],
    };
  }
  return {
    routeFamilyRef: input.decision.routeFamilyRef,
    capabilityId: capability.capabilityId,
    capabilityKind: capability.capabilityKind,
    label: capability.label,
    state: capability.state,
    shouldRender: capability.state !== "hidden",
    reasonRefs: capability.reasonRefs,
  };
}

export function useRouteAuthorityGuard(
  options: UseRouteAuthorityGuardOptions,
): {
  hydrationSnapshot: RouteGuardHydrationSnapshot;
  decision: RouteGuardDecision;
} {
  const hydrationSnapshot = useRouteGuardBindingHydration({
    routeFamilyRef: options.routeFamilyRef,
    manifest: options.manifest,
    audienceSurface: options.audienceContext.audienceSurface,
    loader: options.loader,
  });

  const decision = resolveRouteGuardDecision({
    routeFamilyRef: options.routeFamilyRef,
    manifest: options.manifest,
    hydrationSnapshot,
    audienceContext: options.audienceContext,
    releaseVerdict: options.releaseVerdict,
    routeFreezeDisposition: options.routeFreezeDisposition,
    releaseRecoveryDisposition: options.releaseRecoveryDisposition,
  });

  return { hydrationSnapshot, decision };
}

function postureLabel(posture: RouteGuardPosture): string {
  switch (posture) {
    case "live":
      return "Live";
    case "read_only":
      return "Read-only";
    case "recovery_only":
      return "Recovery only";
    case "blocked":
      return "Blocked";
  }
}

function continuityLabel(mode: ReleaseRecoveryMode): string {
  switch (mode) {
    case "refresh_tuple":
      return "Refresh runtime tuple";
    case "resume_return_contract":
      return "Resume same-shell return";
    case "browser_handoff":
      return "Open approved handoff";
    case "review_summary":
      return "Review last safe summary";
  }
}

export function RouteGuardSurface({
  decision,
  selectedAnchor,
  className,
}: RouteGuardSurfaceProps) {
  const route = getPersistentShellRouteClaim(decision.routeFamilyRef);
  const anchor =
    selectedAnchor && route.anchors.includes(selectedAnchor)
      ? selectedAnchor
      : route.defaultAnchor;
  const recoveryActionId = decision.dominantRecoveryAction?.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <section
      className={["persistent-shell__guard-surface", className].filter(Boolean).join(" ")}
      data-testid="route-guard-surface"
      data-guard-posture={decision.effectivePosture}
      data-runtime-binding-state={decision.hydrationState}
      data-recovery-action={recoveryActionId ?? "none"}
    >
      <header className="persistent-shell__guard-header" data-testid="guard-route-header">
        <div>
          <span className="persistent-shell__eyebrow">Guarded Route</span>
          <h2>{route.title}</h2>
          <p>{decision.lastSafeSummary}</p>
        </div>
        <div className="persistent-shell__guard-meta">
          <span className="persistent-shell__meta-pill">{postureLabel(decision.effectivePosture)}</span>
          <span className="persistent-shell__meta-pill">{decision.channelProfile}</span>
          <span className="persistent-shell__meta-pill">{decision.hydrationState}</span>
        </div>
      </header>

      <div className="persistent-shell__guard-anchor-row">
        <span className="persistent-shell__anchor-chip" data-testid="guard-selected-anchor">
          Anchor: {anchor}
        </span>
        <span className="persistent-shell__meta-pill">
          Header preserved: {decision.preserveHeader ? "yes" : "no"}
        </span>
      </div>

      <article className="persistent-shell__guard-stage" data-testid="guard-stage-panel">
        {decision.effectivePosture === "live" ? (
          <>
            <h3>Route remains production-like.</h3>
            <p>
              Runtime binding, release truth, and manifest-declared capabilities all allow normal
              actionability.
            </p>
            <button className="persistent-shell__dominant-action" data-testid="guard-primary-action">
              {route.dominantActionLabel}
            </button>
          </>
        ) : (
          <>
            <h3>Downgraded in place.</h3>
            <p data-testid="guard-recovery-copy">
              Same-shell context stays visible while the route settles to {postureLabel(decision.effectivePosture).toLowerCase()}
              . The last safe summary and selected anchor remain available.
            </p>
            <div className="persistent-shell__guard-recovery-meta">
              <span className="persistent-shell__meta-pill">
                Selected anchor: {decision.selectedAnchorDisposition}
              </span>
              <span className="persistent-shell__meta-pill">
                Shell: {decision.sameShellDisposition}
              </span>
              {decision.dominantRecoveryAction ? (
                <span className="persistent-shell__meta-pill">
                  {continuityLabel(decision.dominantRecoveryAction.continuityMode)}
                </span>
              ) : null}
            </div>
            {decision.dominantRecoveryAction ? (
              <button
                className="persistent-shell__dominant-action"
                data-testid="guard-recovery-action"
              >
                {decision.dominantRecoveryAction.label}
              </button>
            ) : null}
          </>
        )}
      </article>
    </section>
  );
}

export const routeGuardCatalog = {
  taskId: ROUTE_GUARD_TASK_ID,
  visualMode: ROUTE_GUARD_VISUAL_MODE,
  routeCount: routeAuthorityProfiles.length,
  channelProfileCount: 4,
  embeddedGuardedRouteCount: routeAuthorityProfiles.filter(
    (profile) => profile.requiredEmbeddedCapabilities.length > 0,
  ).length,
  assistiveSidecarRouteCount: routeAuthorityProfiles.filter((profile) =>
    profile.allowedChannelProfiles.includes("assistive_sidecar"),
  ).length,
} as const;
