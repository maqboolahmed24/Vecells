import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const TASK_ID = "seq_473";
const GENERATED_AT = "2026-04-28T00:00:00.000Z";
const SCHEMA_VERSION = "473.programme.phase7-channel-reconciliation.v1";
const MASTER_SCORECARD_REF = "data/conformance/472_cross_phase_conformance_scorecard.json";
const PHASE_ROWS_REF = "data/conformance/472_phase_conformance_rows.json";
const DEFERRED_NOTE_REF = "data/conformance/472_deferred_scope_and_phase7_dependency_note.json";

export type Phase7ChannelReadinessState =
  | "deferred"
  | "ready_to_reconcile"
  | "blocked"
  | "stale"
  | "superseded"
  | "not_applicable";

type RouteCoverageState = "exact" | "blocked" | "stale" | "not_applicable";

export interface Phase7ChannelBlocker {
  readonly blockerId: string;
  readonly blockerState: Exclude<Phase7ChannelReadinessState, "ready_to_reconcile">;
  readonly reasonCode: string;
  readonly owner: string;
  readonly sourceRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly nextSafeAction: string;
  readonly blockerHash: string;
}

export interface Phase7EmbeddedRouteCoverageRow {
  readonly coverageRowId: string;
  readonly routeFamily:
    | "status"
    | "start_request"
    | "booking"
    | "pharmacy"
    | "secure_link_recovery"
    | "artifact_handoff"
    | "unsupported_bridge_capability";
  readonly journeyPathRefs: readonly string[];
  readonly coverageState: RouteCoverageState;
  readonly manifestRef: string;
  readonly routeContractRefs: readonly string[];
  readonly embeddedSurfaceContractCoverageRef: string;
  readonly routeFreezeDispositionRefs: readonly string[];
  readonly fallbackRefs: readonly string[];
  readonly proofRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly rowHash: string;
}

export interface Phase7ChannelConformancePatch {
  readonly schemaVersion: "473.programme.phase7-row-patch.v1";
  readonly taskId: typeof TASK_ID;
  readonly patchId: string;
  readonly patchState:
    | "deferred_preserved"
    | "ready_to_reconcile"
    | "blocked"
    | "stale"
    | "not_applicable";
  readonly targetScorecardRef: typeof MASTER_SCORECARD_REF;
  readonly targetPhaseRowId: "phase_7_deferred_nhs_app_channel_scope";
  readonly priorRowHash: string;
  readonly rowStateAfterPatch: "deferred_scope" | "exact" | "blocked" | "stale" | "not_applicable";
  readonly mandatoryForCurrentCoreReleaseAfterPatch: boolean;
  readonly channelActivationPermitted: boolean;
  readonly manifestVersionRef: string;
  readonly environmentProfileRefs: readonly string[];
  readonly scalBundleRef: string | null;
  readonly routeCoverageMatrixRef: "data/conformance/473_phase7_embedded_surface_coverage_matrix.json";
  readonly deferredScopeNoteRef: typeof DEFERRED_NOTE_REF;
  readonly blockerRefs: readonly string[];
  readonly rowHash: string;
  readonly nextSafeAction: string;
}

export interface Phase7ChannelReadinessReconciliation {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly generatedAt: typeof GENERATED_AT;
  readonly reconciliationId: string;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly channelScope: "nhs_app_web_integration";
  readonly readinessPredicate: {
    readonly predicateId: string;
    readonly state: Phase7ChannelReadinessState;
    readonly manifestVersionRef: string;
    readonly owner: string;
    readonly reason: string;
    readonly sourceRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly optionalFutureInputStates: readonly {
      readonly taskId: string;
      readonly expectedArtifactRef: string;
      readonly availabilityState: "available" | "not_yet_available";
    }[];
    readonly predicateHash: string;
  };
  readonly deferredScopeNote: {
    readonly tenantScope: string;
    readonly channelScope: "nhs_app_web_integration";
    readonly manifestVersionRef: string;
    readonly reason: string;
    readonly owner: string;
    readonly dueEvidenceRefs: readonly string[];
    readonly nextSafeAction: string;
    readonly sourceRefs: readonly string[];
    readonly noteHash: string;
  };
  readonly rowPatchRef: "data/conformance/473_phase7_phase_conformance_row_patch.json";
  readonly routeCoverageMatrixRef: "data/conformance/473_phase7_embedded_surface_coverage_matrix.json";
  readonly blockersRef: "data/conformance/473_phase7_deferred_scope_blockers.json";
  readonly masterScorecardAfterRef: "data/conformance/473_master_scorecard_after_phase7_reconciliation.json";
  readonly scenarioExamples: Record<Phase7ChannelReadinessState, unknown>;
  readonly sourceFileHashes: readonly { readonly ref: string; readonly sha256: string }[];
  readonly reconciliationHash: string;
}

type BuildMode =
  | "default_deferred"
  | "ready_to_reconcile"
  | "blocked_manifest_route_withdrawn"
  | "stale_manifest_runtime_tuple"
  | "superseded_manifest"
  | "not_applicable_tenant";

const requiredSourceRefs = [
  "prompt/473.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-7-inside-the-nhs-app.md",
  "blueprint/phase-9-the-assurance-ledger.md",
  "blueprint/platform-runtime-and-release-blueprint.md",
  "blueprint/platform-frontend-blueprint.md",
  MASTER_SCORECARD_REF,
  PHASE_ROWS_REF,
  DEFERRED_NOTE_REF,
  "data/contracts/374_phase7_journey_path_registry.json",
  "data/fixtures/374_phase7_manifest_example.json",
  "data/config/396_nhs_app_environment_profile_manifest.example.json",
  "data/config/396_scal_submission_bundle_manifest.example.json",
  "data/config/397_channel_release_cohort_manifest.example.json",
  "data/config/397_route_freeze_disposition_manifest.example.json",
  "data/contracts/396_nhs_app_onboarding_contract.json",
  "data/contracts/397_nhs_app_release_control_contract.json",
  "data/contracts/402_phase7_exit_verdict.json",
  "data/contracts/402_phase7_capability_readiness_registry.json",
  "data/contracts/402_phase7_carry_forward_registry.json",
  "data/test/399_suite_results.json",
  "data/test/400_suite_results.json",
  "data/test/401_suite_results.json",
] as const;

const optionalFutureInputs = [
  {
    taskId: "seq_476",
    expectedArtifactRef: "data/release/476_release_wave_manifest.json",
  },
  {
    taskId: "seq_477",
    expectedArtifactRef:
      "data/signoff/477_security_clinical_safety_privacy_regulatory_signoffs.json",
  },
  {
    taskId: "seq_481",
    expectedArtifactRef: "data/evidence/481_disaster_recovery_go_live_smoke_results.json",
  },
  {
    taskId: "seq_482",
    expectedArtifactRef: "data/release/482_wave1_promotion_settlement.json",
  },
  {
    taskId: "seq_483",
    expectedArtifactRef: "data/release/483_release_watch_tuple_wave1_observation.json",
  },
  {
    taskId: "seq_486",
    expectedArtifactRef: "data/channel/486_nhs_app_channel_enablement_manifest.json",
  },
] as const;

function toAbsolute(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(toAbsolute(relativePath), "utf8")) as T;
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortValue(child)]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertFile(relativePath: string): void {
  if (!fs.existsSync(toAbsolute(relativePath))) {
    throw new Error(`Missing required Phase 7 reconciliation input: ${relativePath}`);
  }
}

function fileHash(relativePath: string): string {
  assertFile(relativePath);
  return sha256(fs.readFileSync(toAbsolute(relativePath)));
}

function hashObject<T extends object>(value: T): T & { readonly hash: string } {
  return {
    ...value,
    hash: sha256(stableStringify(value)),
  };
}

function rowHash<T extends object>(value: T): string {
  return sha256(stableStringify(value));
}

function optionalInputStates(mode: BuildMode) {
  return optionalFutureInputs.map((input) => ({
    ...input,
    availabilityState:
      mode === "ready_to_reconcile" ? ("available" as const) : ("not_yet_available" as const),
  }));
}

function createBlocker(
  reasonCode: string,
  blockerState: Exclude<Phase7ChannelReadinessState, "ready_to_reconcile">,
  owner: string,
  sourceRefs: readonly string[],
  evidenceRefs: readonly string[],
  nextSafeAction: string,
): Phase7ChannelBlocker {
  const blockerBase = {
    blockerState,
    reasonCode,
    owner,
    sourceRefs,
    evidenceRefs,
    nextSafeAction,
  };
  const blockerHash = rowHash(blockerBase);
  return {
    blockerId: `p7crb_473_${blockerHash.slice(0, 16)}`,
    ...blockerBase,
    blockerHash,
  };
}

function blockersForMode(mode: BuildMode): readonly Phase7ChannelBlocker[] {
  if (mode === "ready_to_reconcile" || mode === "not_applicable_tenant") {
    return [];
  }
  if (mode === "blocked_manifest_route_withdrawn") {
    return [
      createBlocker(
        "manifest_approved_but_route_contract_withdrawn",
        "blocked",
        "release-governance",
        [
          "blueprint/phase-7-inside-the-nhs-app.md#7i",
          "data/contracts/374_phase7_journey_path_registry.json",
        ],
        ["route-contract:jp_manage_local_appointment:withdrawn"],
        "Keep Phase 7 deferred and republish the manifest with an exact route contract tuple.",
      ),
    ];
  }
  if (mode === "stale_manifest_runtime_tuple") {
    return [
      createBlocker(
        "stale_manifest_runtime_tuple",
        "stale",
        "release-governance",
        [
          "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
          "data/fixtures/374_phase7_manifest_example.json",
        ],
        ["RuntimePublicationBundle:phase7:stale-example"],
        "Freeze reconcile-as-complete until the manifest, runtime bundle, route contracts, and release freeze share one current tuple.",
      ),
    ];
  }
  if (mode === "superseded_manifest") {
    return [
      createBlocker(
        "superseded_manifest",
        "superseded",
        "release-governance",
        ["data/fixtures/374_phase7_manifest_example.json"],
        ["nhsapp-manifest-v0.1.0-freeze-374:superseded-example"],
        "Create a new channel conformance patch from the superseding manifest only.",
      ),
    ];
  }
  return [
    createBlocker(
      "future_channel_enablement_authority_not_yet_available",
      "deferred",
      "release-governance",
      ["prompt/473.md#Implementation-algorithm", "prompt/486.md"],
      optionalFutureInputs.map((input) => input.expectedArtifactRef),
      "Keep the 472 Phase 7 row deferred until task 486 publishes an approved manifest-version enablement authority.",
    ),
    createBlocker(
      "channel_exposure_flag_must_stay_off",
      "deferred",
      "release-operations",
      [
        "blueprint/phase-7-inside-the-nhs-app.md#7i",
        "data/config/397_channel_release_cohort_manifest.example.json",
      ],
      ["ChannelExposureFlag:nhs-app:off-required"],
      "Leave NHS App jump-off exposure disabled for the core release while future wave and channel authority inputs are absent.",
    ),
    createBlocker(
      "external_nhs_app_approval_not_claimed_by_local_exit_gate",
      "deferred",
      "programme-governance",
      [
        "data/fixtures/374_phase7_manifest_example.json",
        "data/contracts/402_phase7_exit_verdict.json",
      ],
      ["ExternalApprovalDisclaimer:374", "Phase7ExitVerdict:402:local-approved"],
      "Treat local Phase 7 proof as repository readiness only; do not claim NHS App live-channel completion without external activation evidence.",
    ),
  ];
}

function coverageRowsForMode(
  mode: BuildMode,
  manifestVersionRef: string,
  blockers: readonly Phase7ChannelBlocker[],
): readonly Phase7EmbeddedRouteCoverageRow[] {
  const routeFreezeRefs = readJson<any>(
    "data/config/397_route_freeze_disposition_manifest.example.json",
  ).dispositions.map((disposition: any) => disposition.dispositionTemplateId) as string[];
  const blockedRouteRef =
    mode === "blocked_manifest_route_withdrawn" ? "jp_manage_local_appointment" : null;
  const staleRouteRef = mode === "stale_manifest_runtime_tuple" ? "jp_request_status" : null;
  const missingFreezeRoutes =
    mode === "blocked_manifest_route_withdrawn"
      ? ["jp_manage_local_appointment", "jp_pharmacy_status"]
      : [];

  const inputs = [
    {
      routeFamily: "status",
      journeyPathRefs: ["jp_request_status", "jp_respond_more_info"],
      routeContractRefs: ["data/contracts/390_embedded_request_status_contract.json"],
      proofRefs: ["data/test/399_suite_results.json"],
    },
    {
      routeFamily: "start_request",
      journeyPathRefs: ["jp_start_medical_request", "jp_start_admin_request", "jp_continue_draft"],
      routeContractRefs: ["data/contracts/389_embedded_start_request_contract.json"],
      proofRefs: ["data/test/399_suite_results.json"],
    },
    {
      routeFamily: "booking",
      journeyPathRefs: ["jp_manage_local_appointment"],
      routeContractRefs: ["data/contracts/391_embedded_booking_contract.json"],
      proofRefs: ["data/test/400_suite_results.json"],
    },
    {
      routeFamily: "pharmacy",
      journeyPathRefs: ["jp_pharmacy_choice", "jp_pharmacy_status"],
      routeContractRefs: ["data/contracts/392_embedded_pharmacy_contract.json"],
      proofRefs: ["data/test/400_suite_results.json"],
    },
    {
      routeFamily: "secure_link_recovery",
      journeyPathRefs: ["jp_continue_draft", "jp_request_status"],
      routeContractRefs: ["data/contracts/388_embedded_entry_corridor_contract.json"],
      proofRefs: ["data/test/399_suite_results.json"],
    },
    {
      routeFamily: "artifact_handoff",
      journeyPathRefs: ["jp_manage_local_appointment", "jp_pharmacy_status"],
      routeContractRefs: ["data/contracts/393_embedded_recovery_and_artifact_contract.json"],
      proofRefs: ["data/test/400_suite_results.json"],
    },
    {
      routeFamily: "unsupported_bridge_capability",
      journeyPathRefs: ["browser_print", "conventional_download"],
      routeContractRefs: ["data/contracts/376_phase7_channel_degraded_mode_schema.json"],
      proofRefs: ["data/test/400_artifact_and_fallback_cases.csv"],
    },
  ] as const;

  return inputs.map((input) => {
    const familyHasWithdrawnRoute =
      blockedRouteRef !== null && input.journeyPathRefs.includes(blockedRouteRef);
    const familyHasStaleRoute =
      staleRouteRef !== null && input.journeyPathRefs.includes(staleRouteRef);
    const familyMissingFreeze = input.journeyPathRefs.some((routeRef) =>
      missingFreezeRoutes.includes(routeRef),
    );
    const coverageState: RouteCoverageState =
      mode === "not_applicable_tenant"
        ? "not_applicable"
        : familyHasWithdrawnRoute || familyMissingFreeze
          ? "blocked"
          : familyHasStaleRoute
            ? "stale"
            : "exact";
    const blockerRefs =
      coverageState === "blocked" || coverageState === "stale"
        ? blockers.map((blocker) => blocker.blockerId)
        : [];
    const base = {
      routeFamily: input.routeFamily,
      journeyPathRefs: input.journeyPathRefs,
      coverageState,
      manifestRef: manifestVersionRef,
      routeContractRefs: input.routeContractRefs,
      embeddedSurfaceContractCoverageRef: `EmbeddedSurfaceContractCoverageRecord:473:${input.routeFamily}`,
      routeFreezeDispositionRefs: routeFreezeRefs.filter((freezeRef) =>
        input.journeyPathRefs.some((routeRef) => freezeRef.includes(routeRef)),
      ),
      fallbackRefs:
        input.routeFamily === "unsupported_bridge_capability"
          ? [
              "ArtifactByteGrant:fallback-download-bytes",
              "BrowserPrintFallback:withhold-and-explain",
            ]
          : ["same-shell-safe-route", "continuity-return-token"],
      proofRefs: input.proofRefs,
      blockerRefs,
    };
    const hash = rowHash(base);
    return {
      coverageRowId: `p7crr_473_${hash.slice(0, 16)}`,
      ...base,
      rowHash: hash,
    };
  });
}

function stateForMode(mode: BuildMode): Phase7ChannelReadinessState {
  switch (mode) {
    case "ready_to_reconcile":
      return "ready_to_reconcile";
    case "blocked_manifest_route_withdrawn":
      return "blocked";
    case "stale_manifest_runtime_tuple":
      return "stale";
    case "superseded_manifest":
      return "superseded";
    case "not_applicable_tenant":
      return "not_applicable";
    default:
      return "deferred";
  }
}

function patchStateForReadiness(
  state: Phase7ChannelReadinessState,
): Phase7ChannelConformancePatch["patchState"] {
  if (state === "ready_to_reconcile") return "ready_to_reconcile";
  if (state === "blocked" || state === "superseded") return "blocked";
  if (state === "stale") return "stale";
  if (state === "not_applicable") return "not_applicable";
  return "deferred_preserved";
}

function rowStateForReadiness(
  state: Phase7ChannelReadinessState,
): Phase7ChannelConformancePatch["rowStateAfterPatch"] {
  if (state === "ready_to_reconcile") return "exact";
  if (state === "blocked" || state === "superseded") return "blocked";
  if (state === "stale") return "stale";
  if (state === "not_applicable") return "not_applicable";
  return "deferred_scope";
}

export function buildPhase7ChannelReconciliation(mode: BuildMode = "default_deferred") {
  for (const sourceRef of requiredSourceRefs) {
    assertFile(sourceRef);
  }
  const scorecard472 = readJson<any>(MASTER_SCORECARD_REF);
  const phaseRows472 = readJson<any>(PHASE_ROWS_REF).rows as any[];
  const deferredNote472 = readJson<any>(DEFERRED_NOTE_REF);
  const manifestFixture = readJson<any>("data/fixtures/374_phase7_manifest_example.json");
  const environmentProfiles = readJson<any>(
    "data/config/396_nhs_app_environment_profile_manifest.example.json",
  );
  const scalBundle = readJson<any>("data/config/396_scal_submission_bundle_manifest.example.json");
  const phase7Row = phaseRows472.find(
    (row) => row.rowId === "phase_7_deferred_nhs_app_channel_scope",
  );
  if (!phase7Row) {
    throw new Error("Task 472 Phase 7 row is missing.");
  }

  const manifestVersionRef = manifestFixture.manifest.manifestVersion as string;
  const readinessState = stateForMode(mode);
  const blockers = blockersForMode(mode);
  const coverageRows = coverageRowsForMode(mode, manifestVersionRef, blockers);
  const sourceFileHashes = [...requiredSourceRefs].map((ref) => ({
    ref,
    sha256: fileHash(ref),
  }));
  const optionalStates = optionalInputStates(mode);
  const evidenceRefs = [
    "data/contracts/402_phase7_exit_verdict.json",
    "data/contracts/402_phase7_capability_readiness_registry.json",
    "data/config/396_nhs_app_environment_profile_manifest.example.json",
    "data/config/396_scal_submission_bundle_manifest.example.json",
    "data/config/397_channel_release_cohort_manifest.example.json",
    "data/config/397_route_freeze_disposition_manifest.example.json",
    "data/test/399_suite_results.json",
    "data/test/400_suite_results.json",
    "data/test/401_suite_results.json",
  ];
  const dueEvidenceRefs =
    readinessState === "ready_to_reconcile"
      ? []
      : optionalStates
          .filter((input) => input.availabilityState === "not_yet_available")
          .map((input) => input.expectedArtifactRef);

  const predicateBase = {
    predicateId: `Phase7ChannelReadinessPredicate:473:${readinessState}`,
    state: readinessState,
    manifestVersionRef,
    owner: readinessState === "not_applicable" ? "tenant-governance" : "release-governance",
    reason:
      readinessState === "ready_to_reconcile"
        ? "All required manifest, environment, SCAL, release, route, runtime, freeze, telemetry, governance, and channel-enable inputs are exact for the same tuple."
        : readinessState === "not_applicable"
          ? "The tenant is explicitly out of NHS App scope and no channel exposure is permitted or hidden."
          : "Phase 7 remains outside the core-web release because channel activation authority and future wave/signoff inputs are not all available and exact.",
    sourceRefs: [
      "prompt/473.md",
      "blueprint/phase-7-inside-the-nhs-app.md#7i",
      "blueprint/phase-9-the-assurance-ledger.md#9i",
      "blueprint/platform-runtime-and-release-blueprint.md",
    ],
    evidenceRefs,
    optionalFutureInputStates: optionalStates,
  };
  const readinessPredicate = {
    ...predicateBase,
    predicateHash: rowHash(predicateBase),
  };

  const deferredScopeNoteBase = {
    tenantScope:
      readinessState === "not_applicable"
        ? "tenant-demo-gp:nhs-app-channel:not-applicable"
        : scorecard472.tenantScope,
    channelScope: "nhs_app_web_integration" as const,
    manifestVersionRef,
    reason:
      readinessState === "not_applicable"
        ? "Tenant has no approved NHS App channel cohort; the scorecard must show not applicable explicitly."
        : "Current release remains core-web only until future channel-enable and release-wave authority inputs are exact.",
    owner: readinessState === "not_applicable" ? "tenant-governance" : "release-governance",
    dueEvidenceRefs,
    nextSafeAction:
      readinessState === "ready_to_reconcile"
        ? "Apply the Phase 7 exact row patch and recompute the master scorecard for the channel release scope."
        : "Keep Phase 7 deferred in the master scorecard and surface blockers until task 486 publishes approved channel activation evidence.",
    sourceRefs: [
      DEFERRED_NOTE_REF,
      "blueprint/phase-7-inside-the-nhs-app.md",
      "data/fixtures/374_phase7_manifest_example.json",
    ],
  };
  const deferredScopeNote = {
    ...deferredScopeNoteBase,
    noteHash: rowHash(deferredScopeNoteBase),
  };

  const rowStateAfterPatch = rowStateForReadiness(readinessState);
  const patchBase = {
    schemaVersion: "473.programme.phase7-row-patch.v1" as const,
    taskId: TASK_ID,
    patchState: patchStateForReadiness(readinessState),
    targetScorecardRef: MASTER_SCORECARD_REF,
    targetPhaseRowId: "phase_7_deferred_nhs_app_channel_scope" as const,
    priorRowHash: phase7Row.rowHash as string,
    rowStateAfterPatch,
    mandatoryForCurrentCoreReleaseAfterPatch: readinessState === "ready_to_reconcile",
    channelActivationPermitted: readinessState === "ready_to_reconcile",
    manifestVersionRef,
    environmentProfileRefs: environmentProfiles.environments.map(
      (environment: any) => environment.profileRef,
    ) as string[],
    scalBundleRef: readinessState === "ready_to_reconcile" ? (scalBundle.bundleId as string) : null,
    routeCoverageMatrixRef:
      "data/conformance/473_phase7_embedded_surface_coverage_matrix.json" as const,
    deferredScopeNoteRef: DEFERRED_NOTE_REF,
    blockerRefs: blockers.map((blocker) => blocker.blockerId),
    nextSafeAction:
      readinessState === "ready_to_reconcile"
        ? "Recompute the master scorecard for the NHS App channel scope and enable only the approved manifest tuple."
        : readinessState === "not_applicable"
          ? "Keep tenant scope explicit as not applicable and leave all exposure flags off."
          : "Preserve the 472 deferred row; do not reconcile Phase 7 as complete for this scorecard.",
  };
  const patchHash = rowHash(patchBase);
  const rowPatch: Phase7ChannelConformancePatch = {
    patchId: `p7crp_473_${patchHash.slice(0, 16)}`,
    ...patchBase,
    rowHash: patchHash,
  };

  const masterAfterBase = {
    schemaVersion: "473.programme.master-scorecard-after-phase7-reconciliation.v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    sourceScorecardRef: MASTER_SCORECARD_REF,
    sourceScorecardHash: scorecard472.scorecardHash,
    releaseRef: scorecard472.releaseRef,
    tenantScope:
      readinessState === "not_applicable"
        ? "tenant-demo-gp:nhs-app-channel:not-applicable"
        : scorecard472.tenantScope,
    phase7ChannelReadinessState: readinessState,
    phase7RowState: rowPatch.rowStateAfterPatch,
    scorecardState:
      readinessState === "blocked" || readinessState === "stale" || readinessState === "superseded"
        ? "blocked"
        : "exact",
    coreReleaseScorecardStillExact:
      readinessState === "deferred" ||
      readinessState === "not_applicable" ||
      readinessState === "ready_to_reconcile",
    channelActivationPermitted: rowPatch.channelActivationPermitted,
    rowPatchHash: rowPatch.rowHash,
    coverageMatrixHash: rowHash(coverageRows.map((row) => row.rowHash)),
    blockerHashes: blockers.map((blocker) => blocker.blockerHash),
    optionalFutureInputStates: optionalStates,
    preserved472DeferredScope: readinessState === "deferred",
    phase7DeferredScopeNoteHash: deferredNote472.scorecardRule
      ? sha256(stableStringify(deferredNote472))
      : deferredScopeNote.noteHash,
  };
  const masterScorecardAfter = {
    ...masterAfterBase,
    scorecardHash: rowHash(masterAfterBase),
  };

  const scenarioExample = {
    readinessState,
    scorecardState: masterScorecardAfter.scorecardState,
    rowState: rowPatch.rowStateAfterPatch,
    channelActivationPermitted: rowPatch.channelActivationPermitted,
    blockerCount: blockers.length,
    selectedRouteFamily:
      readinessState === "blocked"
        ? "booking"
        : readinessState === "stale"
          ? "status"
          : readinessState === "not_applicable"
            ? "unsupported_bridge_capability"
            : "start_request",
    reconcileActionState:
      readinessState === "ready_to_reconcile" ? "enabled" : "frozen_until_authority_exact",
  };

  const reconciliationBase = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    releaseRef: scorecard472.releaseRef,
    tenantScope: scorecard472.tenantScope,
    channelScope: "nhs_app_web_integration" as const,
    readinessPredicate,
    deferredScopeNote,
    rowPatchRef: "data/conformance/473_phase7_phase_conformance_row_patch.json" as const,
    routeCoverageMatrixRef:
      "data/conformance/473_phase7_embedded_surface_coverage_matrix.json" as const,
    blockersRef: "data/conformance/473_phase7_deferred_scope_blockers.json" as const,
    masterScorecardAfterRef:
      "data/conformance/473_master_scorecard_after_phase7_reconciliation.json" as const,
    scenarioExamples: {
      deferred:
        mode === "default_deferred" ? scenarioExample : buildScenarioExample("default_deferred"),
      ready_to_reconcile:
        mode === "ready_to_reconcile"
          ? scenarioExample
          : buildScenarioExample("ready_to_reconcile"),
      blocked:
        mode === "blocked_manifest_route_withdrawn"
          ? scenarioExample
          : buildScenarioExample("blocked_manifest_route_withdrawn"),
      stale:
        mode === "stale_manifest_runtime_tuple"
          ? scenarioExample
          : buildScenarioExample("stale_manifest_runtime_tuple"),
      superseded:
        mode === "superseded_manifest"
          ? scenarioExample
          : buildScenarioExample("superseded_manifest"),
      not_applicable:
        mode === "not_applicable_tenant"
          ? scenarioExample
          : buildScenarioExample("not_applicable_tenant"),
    },
    sourceFileHashes,
  };
  const reconciliationHash = rowHash(reconciliationBase);
  const reconciliation: Phase7ChannelReadinessReconciliation = {
    reconciliationId: `p7cr_473_${reconciliationHash.slice(0, 16)}`,
    ...reconciliationBase,
    reconciliationHash,
  };

  const edgeCaseMatrix = [
    edgeCase(
      "sandpit_exact_aos_missing",
      "blocked",
      "Sandpit proof alone cannot reconcile Phase 7; AOS environment proof is mandatory.",
      ["data/config/396_nhs_app_environment_profile_manifest.example.json"],
    ),
    edgeCase(
      "scal_submitted_not_signed",
      "blocked",
      "SCAL upload or submission is insufficient until the review/signoff state is exact.",
      ["data/config/396_scal_submission_bundle_manifest.example.json"],
    ),
    edgeCase(
      "manifest_approved_route_contract_withdrawn",
      "blocked",
      "A manifest cannot activate a withdrawn route contract.",
      ["data/contracts/374_phase7_journey_path_registry.json"],
    ),
    edgeCase(
      "limited_release_monthly_data_missing",
      "blocked",
      "Limited release cohort approval is blocked while monthly data obligations are absent.",
      ["data/contracts/397_nhs_app_release_control_contract.json"],
    ),
    edgeCase(
      "embedded_download_or_print_unsupported_without_fallback",
      "blocked",
      "Unsupported webview download or print behavior must have a governed fallback.",
      ["data/contracts/376_phase7_channel_degraded_mode_schema.json"],
    ),
    edgeCase(
      "status_freeze_present_booking_pharmacy_absent",
      "blocked",
      "Route freeze coverage must include status, booking, and pharmacy route families.",
      ["data/config/397_route_freeze_disposition_manifest.example.json"],
    ),
    edgeCase(
      "scorecard_deferred_but_exposure_flag_on",
      "blocked",
      "A deferred scorecard row and an active channel exposure flag are contradictory.",
      ["data/conformance/472_phase_conformance_rows.json"],
    ),
    edgeCase(
      "tenant_not_applicable_explicit",
      "not_applicable",
      "Tenant scope can be not applicable only when exposure is explicitly disabled and not hidden.",
      ["prompt/473.md#Required-edge-cases"],
    ),
  ];

  const schema = buildSchema();
  const gapNote = {
    taskId: TASK_ID,
    missingSurface: "future_channel_activation_authority",
    expectedOwnerTask: "seq_486",
    sourceBlueprintBlock: "prompt/473.md#Implementation-algorithm",
    temporaryFallback:
      "Task 473 publishes a fail-closed reconciliation bridge that preserves the 472 deferred row until task 486 creates the approved manifest-version channel enablement authority.",
    riskIfUnresolved:
      "The master scorecard could imply NHS App live-channel completion from local Phase 7 proof, screenshots, or narrative readiness.",
    followUpAction:
      "Task 486 must publish the channel enablement manifest and authority tuple consumed by this reconciler.",
    whyFallbackPreservesAlgorithm:
      "It keeps core-web scorecard proof exact while making channel blockers, missing future inputs, and deferred scope machine-readable.",
    status: "open_until_task_486",
  };
  const algorithmNotes = [
    "# Task 473 Algorithm Alignment Notes",
    "",
    "- Task 473 treats the 472 scorecard as prior authority and does not mutate it in place.",
    "- The authoritative output is `deferred` because the future channel-enable authority from task 486 and launch/signoff evidence from tasks 476, 477, 481, 482, and 483 are not yet available.",
    "- The local Phase 7 exit gate remains useful evidence, but it is not external NHS App live-channel approval and cannot override missing activation authority.",
    "- The row patch keeps `phase_7_deferred_nhs_app_channel_scope` as `deferred_scope` for the current core release; exact and blocked examples are generated for tests and UI state coverage.",
    "- Hashes use stable sorted JSON and include the 472 scorecard hash, Phase 7 row hash, blockers, route coverage rows, and source/proof file hashes.",
    "",
  ].join("\n");
  const externalReferenceNotes = {
    schemaVersion: "473.programme.external-reference-notes.v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    localAlgorithmPriority:
      "External references sharpen NHS App integration, webview constraints, accessibility, and Playwright proof technique; the local blueprints remain authoritative.",
    references: [
      {
        label: "NHS App web integration",
        url: "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
        borrowed:
          "Readiness distinguishes responsive-web integration, Sandpit/AOS progression, SCAL evidence, limited release, monthly data, annual assurance, incidents, and journey-change notice.",
        rejected:
          "The repository does not claim live NHS App approval from local contract evidence alone.",
      },
      {
        label: "NHS App developer web integration guidance",
        url: "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
        borrowed:
          "Webview limitations, header handling, NHS App traffic detection, and SSO query-token scrubbing remain active route-coverage concerns.",
        rejected:
          "Raw asserted-login identity values are never placed in fixtures, UI, traces, or generated reports.",
      },
      {
        label: "NHS App developer web integration overview",
        url: "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
        borrowed:
          "The NHS App channel is treated as a hosted webview over the existing patient journeys, not as a separate product fork.",
        rejected:
          "No UI client is allowed to infer channel authority from user-agent or route behavior alone.",
      },
      {
        label: "NHS App accessibility statement",
        url: "https://www.nhs.uk/nhs-app/about/nhs-app-legal-and-cookies/nhs-app-accessibility-statement/",
        borrowed:
          "The UI checks cover keyboard, screen-reader structure, 200 percent zoom expectations, mobile/browser use, and WCAG 2.2 AA alignment.",
        rejected: "Accessibility status is necessary but not sufficient for channel activation.",
      },
      {
        label: "NHS digital service manual layout",
        url: "https://service-manual.nhs.uk/design-system/styles/layout",
        borrowed:
          "Narrow and mobile-first embedded layouts must keep blockers and source trace visible.",
        rejected: "Route-specific style choices remain governed by local token contracts.",
      },
      {
        label: "WCAG 2.2 quick reference",
        url: "https://www.w3.org/WAI/WCAG22/quickref/",
        borrowed:
          "The matrix and rail are rendered with semantic controls, non-colour-only status text, and keyboard-visible focus.",
        rejected: "WCAG evidence does not change row authority state.",
      },
      {
        label: "Playwright locators and ARIA snapshots",
        url: "https://playwright.dev/docs/locators",
        borrowed:
          "Browser verification uses role-first locators where practical, ARIA snapshots, isolated contexts, screenshots, and deterministic route states.",
        rejected:
          "Browser green paths cannot reconcile Phase 7 as complete without source tuple authority.",
      },
    ],
  };
  const report = buildReport(reconciliation, rowPatch, coverageRows, blockers);
  const decisionLog = buildDecisionLog(reconciliation, blockers);

  return {
    reconciliation,
    rowPatch,
    coverageMatrix: {
      schemaVersion: "473.programme.phase7-embedded-surface-coverage.v1",
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      manifestVersionRef,
      rows: coverageRows,
      edgeCaseMatrix,
    },
    blockers: {
      schemaVersion: "473.programme.phase7-deferred-scope-blockers.v1",
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      blockers,
      edgeCaseMatrix,
    },
    masterScorecardAfter,
    schema,
    gapNote,
    algorithmNotes,
    externalReferenceNotes,
    report,
    decisionLog,
  };
}

function buildScenarioExample(mode: BuildMode) {
  const readinessState = stateForMode(mode);
  const blockers = blockersForMode(mode);
  return {
    readinessState,
    scorecardState:
      readinessState === "blocked" || readinessState === "stale" || readinessState === "superseded"
        ? "blocked"
        : "exact",
    rowState: rowStateForReadiness(readinessState),
    channelActivationPermitted: readinessState === "ready_to_reconcile",
    blockerCount: blockers.length,
    selectedRouteFamily:
      readinessState === "blocked"
        ? "booking"
        : readinessState === "stale"
          ? "status"
          : readinessState === "not_applicable"
            ? "unsupported_bridge_capability"
            : "start_request",
    reconcileActionState:
      readinessState === "ready_to_reconcile" ? "enabled" : "frozen_until_authority_exact",
  };
}

function edgeCase(
  edgeCaseId: string,
  expectedState: Phase7ChannelReadinessState,
  assertion: string,
  sourceRefs: readonly string[],
) {
  const base = {
    edgeCaseId,
    expectedState,
    assertion,
    sourceRefs,
  };
  return {
    ...base,
    edgeCaseHash: rowHash(base),
  };
}

function buildSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecell.local/schemas/473_phase7_channel_reconciliation.schema.json",
    title: "Task 473 Phase 7 Channel Reconciliation",
    type: "object",
    additionalProperties: false,
    required: [
      "schemaVersion",
      "taskId",
      "generatedAt",
      "reconciliationId",
      "releaseRef",
      "tenantScope",
      "channelScope",
      "readinessPredicate",
      "deferredScopeNote",
      "rowPatchRef",
      "routeCoverageMatrixRef",
      "blockersRef",
      "masterScorecardAfterRef",
      "scenarioExamples",
      "sourceFileHashes",
      "reconciliationHash",
    ],
    properties: {
      schemaVersion: { const: SCHEMA_VERSION },
      taskId: { const: TASK_ID },
      generatedAt: { type: "string" },
      reconciliationId: { type: "string" },
      releaseRef: { type: "string" },
      tenantScope: { type: "string" },
      channelScope: { const: "nhs_app_web_integration" },
      readinessPredicate: {
        type: "object",
        required: ["state", "manifestVersionRef", "predicateHash"],
        properties: {
          state: {
            enum: [
              "deferred",
              "ready_to_reconcile",
              "blocked",
              "stale",
              "superseded",
              "not_applicable",
            ],
          },
          manifestVersionRef: { type: "string" },
          predicateHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
        },
      },
      deferredScopeNote: { type: "object" },
      rowPatchRef: { type: "string" },
      routeCoverageMatrixRef: { type: "string" },
      blockersRef: { type: "string" },
      masterScorecardAfterRef: { type: "string" },
      scenarioExamples: { type: "object" },
      sourceFileHashes: { type: "array" },
      reconciliationHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    },
  };
}

function buildReport(
  reconciliation: Phase7ChannelReadinessReconciliation,
  rowPatch: Phase7ChannelConformancePatch,
  coverageRows: readonly Phase7EmbeddedRouteCoverageRow[],
  blockers: readonly Phase7ChannelBlocker[],
): string {
  return [
    "# Phase 7 Channel Reconciliation Report",
    "",
    `Readiness state: \`${reconciliation.readinessPredicate.state}\``,
    `Manifest: \`${reconciliation.readinessPredicate.manifestVersionRef}\``,
    `Row patch state: \`${rowPatch.patchState}\``,
    `Row hash: \`${rowPatch.rowHash}\``,
    "",
    "## Decision",
    "",
    reconciliation.readinessPredicate.state === "ready_to_reconcile"
      ? "The Phase 7 row can be reconciled as exact for the approved NHS App channel scope."
      : "The Phase 7 row remains deferred for the current core-web release. This is intentional and machine-readable; the master scorecard must not imply NHS App live-channel completion.",
    "",
    "## Route Coverage",
    "",
    ...coverageRows.map(
      (row) =>
        `- \`${row.routeFamily}\`: \`${row.coverageState}\` (${row.journeyPathRefs.join(", ")})`,
    ),
    "",
    "## Blockers",
    "",
    ...(blockers.length > 0
      ? blockers.map((blocker) => `- \`${blocker.reasonCode}\`: ${blocker.nextSafeAction}`)
      : ["- No blockers in this scenario."]),
    "",
  ].join("\n");
}

function buildDecisionLog(
  reconciliation: Phase7ChannelReadinessReconciliation,
  blockers: readonly Phase7ChannelBlocker[],
): string {
  return [
    "# Deferred NHS App Channel Decision Log",
    "",
    `Decision timestamp: \`${GENERATED_AT}\``,
    `Reconciliation hash: \`${reconciliation.reconciliationHash}\``,
    "",
    "## Decision",
    "",
    "Preserve Phase 7 as explicit deferred scope until the future channel enablement authority is published and exact. Local Phase 7 repository evidence is retained as proof input, but it is not treated as NHS App live activation.",
    "",
    "## Required Future Inputs",
    "",
    ...reconciliation.readinessPredicate.optionalFutureInputStates.map(
      (input) =>
        `- \`${input.taskId}\` / \`${input.expectedArtifactRef}\`: \`${input.availabilityState}\``,
    ),
    "",
    "## Current Blockers",
    "",
    ...(blockers.length > 0
      ? blockers.map((blocker) => `- \`${blocker.reasonCode}\` owned by ${blocker.owner}`)
      : ["- No blockers in this scenario."]),
    "",
  ].join("\n");
}

function writeJson(relativePath: string, value: unknown): void {
  const outputPath = toAbsolute(relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const outputPath = toAbsolute(relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, value.endsWith("\n") ? value : `${value}\n`);
}

export function writePhase7ChannelReconciliationArtifacts() {
  const artifacts = buildPhase7ChannelReconciliation();
  writeJson(
    "data/conformance/473_phase7_channel_readiness_reconciliation.json",
    artifacts.reconciliation,
  );
  writeJson("data/conformance/473_phase7_phase_conformance_row_patch.json", artifacts.rowPatch);
  writeJson(
    "data/conformance/473_phase7_embedded_surface_coverage_matrix.json",
    artifacts.coverageMatrix,
  );
  writeJson("data/conformance/473_phase7_deferred_scope_blockers.json", artifacts.blockers);
  writeJson(
    "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
    artifacts.masterScorecardAfter,
  );
  writeJson("data/contracts/473_phase7_channel_reconciliation.schema.json", artifacts.schema);
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_473_CHANNEL_ACTIVATION_AUTHORITY.json",
    artifacts.gapNote,
  );
  writeText("docs/programme/473_phase7_channel_reconciliation_report.md", artifacts.report);
  writeText("docs/programme/473_deferred_nhs_app_channel_decision_log.md", artifacts.decisionLog);
  writeText("data/analysis/473_algorithm_alignment_notes.md", artifacts.algorithmNotes);
  writeJson("data/analysis/473_external_reference_notes.json", artifacts.externalReferenceNotes);
  return artifacts;
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const artifacts = writePhase7ChannelReconciliationArtifacts();
  console.log(
    `Task 473 Phase 7 channel reconciliation ${artifacts.reconciliation.readinessPredicate.state}: ${artifacts.reconciliation.reconciliationHash}`,
  );
}
