import {
  stableDigest,
  type BuildProvenanceState,
  type RuntimeConsumptionState,
} from "./build-provenance";

export type RuntimePublicationState = "published" | "stale" | "conflict" | "withdrawn";
export type ReleasePublicationParityState = "exact" | "stale" | "conflict" | "withdrawn";
export type RouteExposureState = "publishable" | "constrained" | "frozen" | "withdrawn";
export type PublicationMatrixGroupState = "exact" | "stale" | "conflict" | "withdrawn";
export type PublicationIssueSeverity = "error" | "warning";

export interface PublicationIssue {
  code: string;
  severity: PublicationIssueSeverity;
  message: string;
  memberRefs: readonly string[];
}

export interface RuntimePublicationBundleTuple {
  runtimeTopologyManifestRef: string;
  workloadFamilyRefs: readonly string[];
  trustZoneBoundaryRefs: readonly string[];
  gatewaySurfaceRefs: readonly string[];
  routeContractDigestRefs: readonly string[];
  frontendContractManifestRefs: readonly string[];
  frontendContractDigestRefs: readonly string[];
  designContractPublicationBundleRefs: readonly string[];
  designContractDigestRefs: readonly string[];
  designContractLintVerdictRefs: readonly string[];
  projectionContractFamilyRefs: readonly string[];
  projectionContractVersionRefs: readonly string[];
  projectionContractVersionSetRefs: readonly string[];
  projectionCompatibilityDigestRefs: readonly string[];
  projectionQueryContractDigestRefs: readonly string[];
  mutationCommandContractDigestRefs: readonly string[];
  liveUpdateChannelDigestRefs: readonly string[];
  clientCachePolicyDigestRefs: readonly string[];
  releaseContractVerificationMatrixRef: string;
  releaseContractMatrixHash: string;
  commandSettlementSchemaSetRef: string;
  transitionEnvelopeSchemaSetRef: string;
  recoveryDispositionSetRef: string;
  routeFreezeDispositionRefs: readonly string[];
  continuityEvidenceContractRefs: readonly string[];
  surfacePublicationRefs: readonly string[];
  surfaceRuntimeBindingRefs: readonly string[];
  buildProvenanceRef: string;
  provenanceVerificationState: BuildProvenanceState;
  provenanceConsumptionState: RuntimeConsumptionState;
  allowedLiveChannelAbsenceReasonRefs?: readonly string[];
}

export interface RuntimePublicationBundleContract extends RuntimePublicationBundleTuple {
  runtimePublicationBundleId: string;
  releaseRef: string;
  releaseApprovalFreezeRef: string;
  watchTupleHash: string;
  publicationParityRef: string;
  topologyTupleHash: string;
  bundleTupleHash: string;
  publicationState: RuntimePublicationState;
  publishedAt: string;
  sourceRefs: readonly string[];
}

export interface ReleasePublicationParityTuple {
  releaseContractVerificationMatrixRef: string;
  releaseContractMatrixHash: string;
  routeContractDigestRefs: readonly string[];
  frontendContractDigestRefs: readonly string[];
  projectionCompatibilityDigestRefs: readonly string[];
  surfacePublicationRefs: readonly string[];
  surfaceRuntimeBindingRefs: readonly string[];
  activeChannelFreezeRefs: readonly string[];
  recoveryDispositionRefs: readonly string[];
  continuityEvidenceDigestRefs: readonly string[];
  provenanceVerificationState: BuildProvenanceState;
  provenanceConsumptionState: RuntimeConsumptionState;
  bundleTupleHash: string;
  matrixGroupStates: Readonly<Record<string, PublicationMatrixGroupState>>;
  driftReasonIds: readonly string[];
  bindingCeilingReasons: readonly string[];
}

export interface ReleasePublicationParityRecordContract extends ReleasePublicationParityTuple {
  publicationParityRecordId: string;
  releaseRef: string;
  releaseApprovalFreezeRef: string;
  promotionIntentRef: string | null;
  watchTupleHash: string;
  waveEligibilitySnapshotRef: string | null;
  runtimePublicationBundleRef: string;
  parityState: ReleasePublicationParityState;
  routeExposureState: RouteExposureState;
  evaluatedAt: string;
  sourceRefs: readonly string[];
}

export interface RuntimePublicationBundleValidationResult {
  valid: boolean;
  publicationState: RuntimePublicationState;
  issues: readonly PublicationIssue[];
  refusalReasonRefs: readonly string[];
  topologyTupleHash: string;
  bundleTupleHash: string;
}

export interface ReleasePublicationParityValidationResult {
  valid: boolean;
  parityState: ReleasePublicationParityState;
  routeExposureState: RouteExposureState;
  issues: readonly PublicationIssue[];
  refusalReasonRefs: readonly string[];
}

export interface RuntimePublicationAuthorityVerdict {
  publishable: boolean;
  runtimePublicationBundleId: string;
  publicationParityRecordId: string;
  publicationState: RuntimePublicationState;
  parityState: ReleasePublicationParityState;
  routeExposureState: RouteExposureState;
  refusalReasonRefs: readonly string[];
  warningReasonRefs: readonly string[];
}

const REQUIRED_LIST_FIELDS = [
  ["workloadFamilyRefs", "WORKLOAD_FAMILY"],
  ["trustZoneBoundaryRefs", "TRUST_ZONE_BOUNDARY"],
  ["gatewaySurfaceRefs", "GATEWAY_SURFACE"],
  ["routeContractDigestRefs", "ROUTE_CONTRACT_DIGEST"],
  ["frontendContractManifestRefs", "FRONTEND_MANIFEST"],
  ["frontendContractDigestRefs", "FRONTEND_CONTRACT_DIGEST"],
  ["designContractPublicationBundleRefs", "DESIGN_PUBLICATION_BUNDLE"],
  ["designContractDigestRefs", "DESIGN_CONTRACT_DIGEST"],
  ["projectionContractFamilyRefs", "PROJECTION_CONTRACT_FAMILY"],
  ["projectionContractVersionRefs", "PROJECTION_CONTRACT_VERSION"],
  ["projectionContractVersionSetRefs", "PROJECTION_CONTRACT_VERSION_SET"],
  ["projectionCompatibilityDigestRefs", "PROJECTION_COMPATIBILITY_DIGEST"],
  ["projectionQueryContractDigestRefs", "PROJECTION_QUERY_DIGEST"],
  ["mutationCommandContractDigestRefs", "MUTATION_COMMAND_DIGEST"],
  ["clientCachePolicyDigestRefs", "CLIENT_CACHE_POLICY_DIGEST"],
  ["routeFreezeDispositionRefs", "ROUTE_FREEZE_DISPOSITION"],
  ["continuityEvidenceContractRefs", "CONTINUITY_EVIDENCE"],
  ["surfacePublicationRefs", "SURFACE_PUBLICATION"],
  ["surfaceRuntimeBindingRefs", "SURFACE_RUNTIME_BINDING"],
] as const;

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function arraysEqualAsSets(left: readonly string[], right: readonly string[]): boolean {
  const normalizedLeft = uniqueSorted(left);
  const normalizedRight = uniqueSorted(right);
  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }
  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function createIssue(
  code: string,
  message: string,
  memberRefs: readonly string[] = [],
  severity: PublicationIssueSeverity = "error",
): PublicationIssue {
  return { code, severity, message, memberRefs };
}

function deriveTopologyTupleHash(
  tuple: Pick<
    RuntimePublicationBundleTuple,
    | "runtimeTopologyManifestRef"
    | "workloadFamilyRefs"
    | "trustZoneBoundaryRefs"
    | "gatewaySurfaceRefs"
  >,
): string {
  return stableDigest({
    runtimeTopologyManifestRef: tuple.runtimeTopologyManifestRef,
    workloadFamilyRefs: uniqueSorted(tuple.workloadFamilyRefs),
    trustZoneBoundaryRefs: uniqueSorted(tuple.trustZoneBoundaryRefs),
    gatewaySurfaceRefs: uniqueSorted(tuple.gatewaySurfaceRefs),
  });
}

function deriveBundleTupleHash(
  tuple: RuntimePublicationBundleTuple,
  topologyTupleHash: string,
): string {
  return stableDigest({
    topologyTupleHash,
    routeContractDigestRefs: uniqueSorted(tuple.routeContractDigestRefs),
    frontendContractManifestRefs: uniqueSorted(tuple.frontendContractManifestRefs),
    frontendContractDigestRefs: uniqueSorted(tuple.frontendContractDigestRefs),
    designContractPublicationBundleRefs: uniqueSorted(tuple.designContractPublicationBundleRefs),
    designContractDigestRefs: uniqueSorted(tuple.designContractDigestRefs),
    designContractLintVerdictRefs: uniqueSorted(tuple.designContractLintVerdictRefs),
    projectionContractFamilyRefs: uniqueSorted(tuple.projectionContractFamilyRefs),
    projectionContractVersionRefs: uniqueSorted(tuple.projectionContractVersionRefs),
    projectionContractVersionSetRefs: uniqueSorted(tuple.projectionContractVersionSetRefs),
    projectionCompatibilityDigestRefs: uniqueSorted(tuple.projectionCompatibilityDigestRefs),
    projectionQueryContractDigestRefs: uniqueSorted(tuple.projectionQueryContractDigestRefs),
    mutationCommandContractDigestRefs: uniqueSorted(tuple.mutationCommandContractDigestRefs),
    liveUpdateChannelDigestRefs: uniqueSorted(tuple.liveUpdateChannelDigestRefs),
    clientCachePolicyDigestRefs: uniqueSorted(tuple.clientCachePolicyDigestRefs),
    releaseContractVerificationMatrixRef: tuple.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: tuple.releaseContractMatrixHash,
    commandSettlementSchemaSetRef: tuple.commandSettlementSchemaSetRef,
    transitionEnvelopeSchemaSetRef: tuple.transitionEnvelopeSchemaSetRef,
    recoveryDispositionSetRef: tuple.recoveryDispositionSetRef,
    routeFreezeDispositionRefs: uniqueSorted(tuple.routeFreezeDispositionRefs),
    continuityEvidenceContractRefs: uniqueSorted(tuple.continuityEvidenceContractRefs),
    surfacePublicationRefs: uniqueSorted(tuple.surfacePublicationRefs),
    surfaceRuntimeBindingRefs: uniqueSorted(tuple.surfaceRuntimeBindingRefs),
    buildProvenanceRef: tuple.buildProvenanceRef,
    provenanceVerificationState: tuple.provenanceVerificationState,
    provenanceConsumptionState: tuple.provenanceConsumptionState,
    allowedLiveChannelAbsenceReasonRefs: uniqueSorted(
      tuple.allowedLiveChannelAbsenceReasonRefs ?? [],
    ),
  });
}

function deriveParityFingerprint(tuple: ReleasePublicationParityTuple): string {
  return stableDigest({
    releaseContractVerificationMatrixRef: tuple.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: tuple.releaseContractMatrixHash,
    routeContractDigestRefs: uniqueSorted(tuple.routeContractDigestRefs),
    frontendContractDigestRefs: uniqueSorted(tuple.frontendContractDigestRefs),
    projectionCompatibilityDigestRefs: uniqueSorted(tuple.projectionCompatibilityDigestRefs),
    surfacePublicationRefs: uniqueSorted(tuple.surfacePublicationRefs),
    surfaceRuntimeBindingRefs: uniqueSorted(tuple.surfaceRuntimeBindingRefs),
    activeChannelFreezeRefs: uniqueSorted(tuple.activeChannelFreezeRefs),
    recoveryDispositionRefs: uniqueSorted(tuple.recoveryDispositionRefs),
    continuityEvidenceDigestRefs: uniqueSorted(tuple.continuityEvidenceDigestRefs),
    provenanceVerificationState: tuple.provenanceVerificationState,
    provenanceConsumptionState: tuple.provenanceConsumptionState,
    bundleTupleHash: tuple.bundleTupleHash,
    matrixGroupStates: Object.fromEntries(
      Object.entries(tuple.matrixGroupStates).sort(([left], [right]) => left.localeCompare(right)),
    ),
  });
}

function deriveBundleState(
  issues: readonly PublicationIssue[],
  current: RuntimePublicationBundleTuple,
) {
  const errorCodes = new Set(
    issues.filter((issue) => issue.severity === "error").map((issue) => issue.code),
  );
  if (
    current.provenanceVerificationState === "revoked" ||
    current.provenanceConsumptionState === "revoked"
  ) {
    return "withdrawn" satisfies RuntimePublicationState;
  }
  if (
    current.provenanceVerificationState === "quarantined" ||
    current.provenanceConsumptionState === "quarantined" ||
    errorCodes.has("PROVENANCE_QUARANTINED")
  ) {
    return "conflict" satisfies RuntimePublicationState;
  }
  if (
    current.provenanceVerificationState === "drifted" ||
    current.provenanceVerificationState === "superseded" ||
    current.provenanceConsumptionState === "blocked" ||
    current.provenanceConsumptionState === "superseded" ||
    Array.from(errorCodes).some((code) => code.startsWith("DRIFT_"))
  ) {
    return "stale" satisfies RuntimePublicationState;
  }
  if (errorCodes.size > 0) {
    return "conflict" satisfies RuntimePublicationState;
  }
  return "published" satisfies RuntimePublicationState;
}

function deriveParityState(
  issues: readonly PublicationIssue[],
  tuple: ReleasePublicationParityTuple,
): ReleasePublicationParityState {
  if (
    tuple.provenanceVerificationState === "revoked" ||
    tuple.provenanceConsumptionState === "revoked"
  ) {
    return "withdrawn";
  }
  if (
    tuple.provenanceVerificationState === "drifted" ||
    tuple.provenanceVerificationState === "superseded" ||
    tuple.provenanceConsumptionState === "blocked" ||
    tuple.provenanceConsumptionState === "superseded" ||
    tuple.driftReasonIds.length > 0 ||
    Object.values(tuple.matrixGroupStates).some((value) => value === "stale")
  ) {
    return "stale";
  }
  if (
    tuple.provenanceVerificationState === "quarantined" ||
    tuple.provenanceConsumptionState === "quarantined" ||
    Object.values(tuple.matrixGroupStates).some(
      (value) => value === "conflict" || value === "withdrawn",
    ) ||
    issues.length > 0
  ) {
    return "conflict";
  }
  return "exact";
}

function deriveRouteExposureState(
  parityState: ReleasePublicationParityState,
  bindingCeilingReasons: readonly string[],
): RouteExposureState {
  if (parityState === "withdrawn") {
    return "withdrawn";
  }
  if (parityState !== "exact") {
    return "frozen";
  }
  return bindingCeilingReasons.length > 0 ? "constrained" : "publishable";
}

export function createRuntimePublicationBundle(
  input: Omit<
    RuntimePublicationBundleContract,
    "topologyTupleHash" | "bundleTupleHash" | "publicationState"
  > & {
    publicationState?: RuntimePublicationState;
  },
): RuntimePublicationBundleContract {
  const tuple: RuntimePublicationBundleTuple = {
    runtimeTopologyManifestRef: input.runtimeTopologyManifestRef,
    workloadFamilyRefs: input.workloadFamilyRefs,
    trustZoneBoundaryRefs: input.trustZoneBoundaryRefs,
    gatewaySurfaceRefs: input.gatewaySurfaceRefs,
    routeContractDigestRefs: input.routeContractDigestRefs,
    frontendContractManifestRefs: input.frontendContractManifestRefs,
    frontendContractDigestRefs: input.frontendContractDigestRefs,
    designContractPublicationBundleRefs: input.designContractPublicationBundleRefs,
    designContractDigestRefs: input.designContractDigestRefs,
    designContractLintVerdictRefs: input.designContractLintVerdictRefs,
    projectionContractFamilyRefs: input.projectionContractFamilyRefs,
    projectionContractVersionRefs: input.projectionContractVersionRefs,
    projectionContractVersionSetRefs: input.projectionContractVersionSetRefs,
    projectionCompatibilityDigestRefs: input.projectionCompatibilityDigestRefs,
    projectionQueryContractDigestRefs: input.projectionQueryContractDigestRefs,
    mutationCommandContractDigestRefs: input.mutationCommandContractDigestRefs,
    liveUpdateChannelDigestRefs: input.liveUpdateChannelDigestRefs,
    clientCachePolicyDigestRefs: input.clientCachePolicyDigestRefs,
    releaseContractVerificationMatrixRef: input.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: input.releaseContractMatrixHash,
    commandSettlementSchemaSetRef: input.commandSettlementSchemaSetRef,
    transitionEnvelopeSchemaSetRef: input.transitionEnvelopeSchemaSetRef,
    recoveryDispositionSetRef: input.recoveryDispositionSetRef,
    routeFreezeDispositionRefs: input.routeFreezeDispositionRefs,
    continuityEvidenceContractRefs: input.continuityEvidenceContractRefs,
    surfacePublicationRefs: input.surfacePublicationRefs,
    surfaceRuntimeBindingRefs: input.surfaceRuntimeBindingRefs,
    buildProvenanceRef: input.buildProvenanceRef,
    provenanceVerificationState: input.provenanceVerificationState,
    provenanceConsumptionState: input.provenanceConsumptionState,
    allowedLiveChannelAbsenceReasonRefs: input.allowedLiveChannelAbsenceReasonRefs,
  };
  const topologyTupleHash = deriveTopologyTupleHash(tuple);
  const bundleTupleHash = deriveBundleTupleHash(tuple, topologyTupleHash);
  const validation = validateRuntimePublicationBundle({
    bundle: {
      ...input,
      topologyTupleHash,
      bundleTupleHash,
      publicationState: "published",
    },
    current: tuple,
  });
  return {
    ...input,
    topologyTupleHash,
    bundleTupleHash,
    publicationState: input.publicationState ?? validation.publicationState,
  };
}

export function validateRuntimePublicationBundle(input: {
  bundle: RuntimePublicationBundleContract;
  current: RuntimePublicationBundleTuple;
}): RuntimePublicationBundleValidationResult {
  const issues: PublicationIssue[] = [];
  const expectedTopologyTupleHash = deriveTopologyTupleHash(input.current);
  const expectedBundleTupleHash = deriveBundleTupleHash(input.current, expectedTopologyTupleHash);

  REQUIRED_LIST_FIELDS.forEach(([fieldName, label]) => {
    const currentValues = input.current[fieldName];
    if (currentValues.length === 0) {
      issues.push(
        createIssue(
          `MISSING_${label}`,
          `Runtime publication tuple is missing required ${label.toLowerCase().replaceAll("_", " ")} members.`,
        ),
      );
    }
  });

  if (
    input.current.liveUpdateChannelDigestRefs.length === 0 &&
    (input.current.allowedLiveChannelAbsenceReasonRefs?.length ?? 0) === 0
  ) {
    issues.push(
      createIssue(
        "MISSING_LIVE_CHANNEL_DIGEST",
        "Runtime publication tuple has no live channel digests and no bounded absence reasons.",
      ),
    );
  }

  if (input.bundle.runtimeTopologyManifestRef !== input.current.runtimeTopologyManifestRef) {
    issues.push(
      createIssue(
        "DRIFT_RUNTIME_TOPOLOGY_REF",
        "Runtime topology manifest ref drifted from the authoritative tuple.",
        [input.bundle.runtimeTopologyManifestRef, input.current.runtimeTopologyManifestRef],
      ),
    );
  }

  (
    [
      ["workloadFamilyRefs", "DRIFT_WORKLOAD_FAMILIES"],
      ["trustZoneBoundaryRefs", "DRIFT_TRUST_ZONE_BOUNDARIES"],
      ["gatewaySurfaceRefs", "DRIFT_GATEWAY_SURFACES"],
      ["routeContractDigestRefs", "DRIFT_ROUTE_CONTRACT_DIGESTS"],
      ["frontendContractManifestRefs", "DRIFT_FRONTEND_MANIFESTS"],
      ["frontendContractDigestRefs", "DRIFT_FRONTEND_CONTRACT_DIGESTS"],
      ["designContractPublicationBundleRefs", "DRIFT_DESIGN_PUBLICATION_BUNDLES"],
      ["designContractDigestRefs", "DRIFT_DESIGN_CONTRACT_DIGESTS"],
      ["designContractLintVerdictRefs", "DRIFT_DESIGN_LINT_VERDICTS"],
      ["projectionContractFamilyRefs", "DRIFT_PROJECTION_CONTRACT_FAMILIES"],
      ["projectionContractVersionRefs", "DRIFT_PROJECTION_CONTRACT_VERSIONS"],
      ["projectionContractVersionSetRefs", "DRIFT_PROJECTION_CONTRACT_VERSION_SETS"],
      ["projectionCompatibilityDigestRefs", "DRIFT_PROJECTION_COMPATIBILITY_DIGESTS"],
      ["projectionQueryContractDigestRefs", "DRIFT_PROJECTION_QUERY_DIGESTS"],
      ["mutationCommandContractDigestRefs", "DRIFT_MUTATION_COMMAND_DIGESTS"],
      ["liveUpdateChannelDigestRefs", "DRIFT_LIVE_CHANNEL_DIGESTS"],
      ["clientCachePolicyDigestRefs", "DRIFT_CACHE_POLICY_DIGESTS"],
      ["routeFreezeDispositionRefs", "DRIFT_ROUTE_FREEZE_DISPOSITIONS"],
      ["continuityEvidenceContractRefs", "DRIFT_CONTINUITY_EVIDENCE_CONTRACTS"],
      ["surfacePublicationRefs", "DRIFT_SURFACE_PUBLICATIONS"],
      ["surfaceRuntimeBindingRefs", "DRIFT_SURFACE_RUNTIME_BINDINGS"],
    ] as const
  ).forEach(([fieldName, issueCode]) => {
    const bundleValues = input.bundle[fieldName as keyof RuntimePublicationBundleContract];
    const currentValues = input.current[fieldName as keyof RuntimePublicationBundleTuple];
    if (
      Array.isArray(bundleValues) &&
      Array.isArray(currentValues) &&
      !arraysEqualAsSets(bundleValues, currentValues)
    ) {
      issues.push(
        createIssue(issueCode, `${fieldName} drifted from the authoritative runtime tuple.`, [
          ...uniqueSorted(bundleValues),
          ...uniqueSorted(currentValues),
        ]),
      );
    }
  });

  (
    [
      ["releaseContractVerificationMatrixRef", "DRIFT_RELEASE_MATRIX_REF"],
      ["releaseContractMatrixHash", "DRIFT_RELEASE_MATRIX_HASH"],
      ["commandSettlementSchemaSetRef", "DRIFT_COMMAND_SETTLEMENT_SCHEMAS"],
      ["transitionEnvelopeSchemaSetRef", "DRIFT_TRANSITION_ENVELOPE_SCHEMAS"],
      ["recoveryDispositionSetRef", "DRIFT_RECOVERY_DISPOSITION_SET"],
      ["buildProvenanceRef", "DRIFT_BUILD_PROVENANCE_REF"],
      ["provenanceVerificationState", "DRIFT_PROVENANCE_VERIFICATION_STATE"],
      ["provenanceConsumptionState", "DRIFT_PROVENANCE_CONSUMPTION_STATE"],
    ] as const
  ).forEach(([fieldName, issueCode]) => {
    if (
      input.bundle[fieldName as keyof RuntimePublicationBundleContract] !==
      input.current[fieldName as keyof RuntimePublicationBundleTuple]
    ) {
      issues.push(
        createIssue(issueCode, `${fieldName} drifted from the authoritative runtime tuple.`, [
          String(input.bundle[fieldName as keyof RuntimePublicationBundleContract]),
          String(input.current[fieldName as keyof RuntimePublicationBundleTuple]),
        ]),
      );
    }
  });

  if (input.bundle.topologyTupleHash !== expectedTopologyTupleHash) {
    issues.push(
      createIssue(
        "DRIFT_TOPOLOGY_TUPLE_HASH",
        "Stored topology tuple hash no longer matches authoritative topology members.",
        [input.bundle.topologyTupleHash, expectedTopologyTupleHash],
      ),
    );
  }

  if (input.bundle.bundleTupleHash !== expectedBundleTupleHash) {
    issues.push(
      createIssue(
        "DRIFT_BUNDLE_TUPLE_HASH",
        "Stored runtime publication bundle hash no longer matches authoritative tuple members.",
        [input.bundle.bundleTupleHash, expectedBundleTupleHash],
      ),
    );
  }

  if (input.current.provenanceVerificationState !== "verified") {
    issues.push(
      createIssue(
        input.current.provenanceVerificationState === "quarantined"
          ? "PROVENANCE_QUARANTINED"
          : "PROVENANCE_NOT_VERIFIED",
        "Build provenance is not verified for runtime publication.",
        [input.current.provenanceVerificationState],
      ),
    );
  }

  if (input.current.provenanceConsumptionState !== "publishable") {
    issues.push(
      createIssue(
        "PROVENANCE_CONSUMPTION_BLOCKED",
        "Build provenance runtime consumption state is not publishable.",
        [input.current.provenanceConsumptionState],
      ),
    );
  }

  if (
    input.current.designContractLintVerdictRefs.some((ref) =>
      /(pending|failed|blocked|quarantined)/i.test(ref),
    )
  ) {
    issues.push(
      createIssue(
        "DESIGN_LINT_NOT_PASSED",
        "One or more design contract lint verdicts are not publishable.",
        input.current.designContractLintVerdictRefs,
        "warning",
      ),
    );
  }

  const publicationState = deriveBundleState(issues, input.current);
  const refusalReasonRefs = issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => issue.code);
  return {
    valid: publicationState === "published" && refusalReasonRefs.length === 0,
    publicationState,
    issues,
    refusalReasonRefs,
    topologyTupleHash: expectedTopologyTupleHash,
    bundleTupleHash: expectedBundleTupleHash,
  };
}

export function createReleasePublicationParityRecord(
  input: Omit<ReleasePublicationParityRecordContract, "parityState" | "routeExposureState"> & {
    parityState?: ReleasePublicationParityState;
    routeExposureState?: RouteExposureState;
  },
): ReleasePublicationParityRecordContract {
  const tuple: ReleasePublicationParityTuple = {
    releaseContractVerificationMatrixRef: input.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: input.releaseContractMatrixHash,
    routeContractDigestRefs: input.routeContractDigestRefs,
    frontendContractDigestRefs: input.frontendContractDigestRefs,
    projectionCompatibilityDigestRefs: input.projectionCompatibilityDigestRefs,
    surfacePublicationRefs: input.surfacePublicationRefs,
    surfaceRuntimeBindingRefs: input.surfaceRuntimeBindingRefs,
    activeChannelFreezeRefs: input.activeChannelFreezeRefs,
    recoveryDispositionRefs: input.recoveryDispositionRefs,
    continuityEvidenceDigestRefs: input.continuityEvidenceDigestRefs,
    provenanceVerificationState: input.provenanceVerificationState,
    provenanceConsumptionState: input.provenanceConsumptionState,
    bundleTupleHash: input.bundleTupleHash,
    matrixGroupStates: input.matrixGroupStates,
    driftReasonIds: input.driftReasonIds,
    bindingCeilingReasons: input.bindingCeilingReasons,
  };
  const validation = validateReleasePublicationParityRecord({
    parityRecord: {
      ...input,
      parityState: "exact",
      routeExposureState: "publishable",
    },
    current: tuple,
    bundleValidation: {
      valid: true,
      publicationState: "published",
      refusalReasonRefs: [],
      bundleTupleHash: input.bundleTupleHash,
    },
  });
  return {
    ...input,
    parityState: input.parityState ?? validation.parityState,
    routeExposureState: input.routeExposureState ?? validation.routeExposureState,
  };
}

export function validateReleasePublicationParityRecord(input: {
  parityRecord: ReleasePublicationParityRecordContract;
  current: ReleasePublicationParityTuple;
  bundleValidation: Pick<
    RuntimePublicationBundleValidationResult,
    "valid" | "publicationState" | "bundleTupleHash" | "refusalReasonRefs"
  >;
}): ReleasePublicationParityValidationResult {
  const issues: PublicationIssue[] = [];

  (
    [
      ["routeContractDigestRefs", "DRIFT_ROUTE_CONTRACT_DIGESTS"],
      ["frontendContractDigestRefs", "DRIFT_FRONTEND_CONTRACT_DIGESTS"],
      ["projectionCompatibilityDigestRefs", "DRIFT_PROJECTION_COMPATIBILITY_DIGESTS"],
      ["surfacePublicationRefs", "DRIFT_SURFACE_PUBLICATIONS"],
      ["surfaceRuntimeBindingRefs", "DRIFT_SURFACE_RUNTIME_BINDINGS"],
      ["activeChannelFreezeRefs", "DRIFT_CHANNEL_FREEZES"],
      ["recoveryDispositionRefs", "DRIFT_RECOVERY_DISPOSITIONS"],
      ["continuityEvidenceDigestRefs", "DRIFT_CONTINUITY_EVIDENCE_DIGESTS"],
    ] as const
  ).forEach(([fieldName, issueCode]) => {
    const recordValues =
      input.parityRecord[fieldName as keyof ReleasePublicationParityRecordContract];
    const currentValues = input.current[fieldName as keyof ReleasePublicationParityTuple];
    if (
      Array.isArray(recordValues) &&
      Array.isArray(currentValues) &&
      !arraysEqualAsSets(recordValues, currentValues)
    ) {
      issues.push(
        createIssue(
          issueCode,
          `${fieldName} drifted from the authoritative release publication tuple.`,
          [...uniqueSorted(recordValues), ...uniqueSorted(currentValues)],
        ),
      );
    }
  });

  (
    [
      ["releaseContractVerificationMatrixRef", "DRIFT_RELEASE_MATRIX_REF"],
      ["releaseContractMatrixHash", "DRIFT_RELEASE_MATRIX_HASH"],
      ["provenanceVerificationState", "DRIFT_PROVENANCE_VERIFICATION_STATE"],
      ["provenanceConsumptionState", "DRIFT_PROVENANCE_CONSUMPTION_STATE"],
      ["bundleTupleHash", "DRIFT_BUNDLE_TUPLE_HASH"],
    ] as const
  ).forEach(([fieldName, issueCode]) => {
    if (
      input.parityRecord[fieldName as keyof ReleasePublicationParityRecordContract] !==
      input.current[fieldName as keyof ReleasePublicationParityTuple]
    ) {
      issues.push(
        createIssue(
          issueCode,
          `${fieldName} drifted from the authoritative release publication tuple.`,
          [
            String(input.parityRecord[fieldName as keyof ReleasePublicationParityRecordContract]),
            String(input.current[fieldName as keyof ReleasePublicationParityTuple]),
          ],
        ),
      );
    }
  });

  const expectedFingerprint = deriveParityFingerprint(input.current);
  const recordedFingerprint = deriveParityFingerprint(input.parityRecord);
  if (recordedFingerprint !== expectedFingerprint) {
    issues.push(
      createIssue(
        "DRIFT_PARITY_FINGERPRINT",
        "Release publication parity fingerprint drifted from the authoritative tuple.",
        [recordedFingerprint, expectedFingerprint],
      ),
    );
  }

  if (!input.bundleValidation.valid) {
    issues.push(
      createIssue(
        "RUNTIME_PUBLICATION_BUNDLE_BLOCKED",
        "Runtime publication bundle did not validate cleanly, so parity cannot authorize publication.",
        input.bundleValidation.refusalReasonRefs,
      ),
    );
  }

  if (input.current.driftReasonIds.length > 0) {
    issues.push(
      createIssue(
        "PARITY_DRIFT_REASONS_PRESENT",
        "Release publication parity carries drift reasons and must fail closed.",
        input.current.driftReasonIds,
      ),
    );
  }

  const nonExactGroups = Object.entries(input.current.matrixGroupStates)
    .filter(([, state]) => state !== "exact")
    .map(([group]) => group);
  if (nonExactGroups.length > 0) {
    issues.push(
      createIssue(
        "PARITY_MATRIX_GROUP_DRIFT",
        "One or more parity matrix groups are not exact.",
        nonExactGroups,
      ),
    );
  }

  const parityState = deriveParityState(issues, input.current);
  const routeExposureState = deriveRouteExposureState(
    parityState,
    input.current.bindingCeilingReasons,
  );
  const refusalReasonRefs = issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => issue.code);
  return {
    valid: parityState === "exact" && refusalReasonRefs.length === 0,
    parityState,
    routeExposureState,
    issues,
    refusalReasonRefs,
  };
}

export function evaluateRuntimePublicationAuthority(input: {
  bundle: RuntimePublicationBundleContract;
  currentBundle: RuntimePublicationBundleTuple;
  parityRecord: ReleasePublicationParityRecordContract;
  currentParity: ReleasePublicationParityTuple;
}): RuntimePublicationAuthorityVerdict {
  const bundleValidation = validateRuntimePublicationBundle({
    bundle: input.bundle,
    current: input.currentBundle,
  });
  const parityValidation = validateReleasePublicationParityRecord({
    parityRecord: input.parityRecord,
    current: input.currentParity,
    bundleValidation,
  });
  const warningReasonRefs = input.currentParity.bindingCeilingReasons.map(
    (_, index) => `BINDING_CEILING_${index + 1}`,
  );
  return {
    publishable: bundleValidation.valid && parityValidation.valid,
    runtimePublicationBundleId: input.bundle.runtimePublicationBundleId,
    publicationParityRecordId: input.parityRecord.publicationParityRecordId,
    publicationState: bundleValidation.publicationState,
    parityState: parityValidation.parityState,
    routeExposureState: parityValidation.routeExposureState,
    refusalReasonRefs: [
      ...bundleValidation.refusalReasonRefs,
      ...parityValidation.refusalReasonRefs,
    ],
    warningReasonRefs,
  };
}

export function createRuntimePublicationSimulationHarness() {
  const bundle = createRuntimePublicationBundle({
    runtimePublicationBundleId: "rpb::simulation",
    releaseRef: "rc::simulation",
    releaseApprovalFreezeRef: "raf::simulation",
    watchTupleHash: "watch::simulation",
    runtimeTopologyManifestRef: "data/analysis/runtime_topology_manifest.json",
    workloadFamilyRefs: ["wf_public_edge_ingress", "wf_command_orchestration"],
    trustZoneBoundaryRefs: ["tzb_public_edge_to_published_gateway"],
    gatewaySurfaceRefs: ["gws_patient_home"],
    routeContractDigestRefs: ["route-digest::patient-home"],
    frontendContractManifestRefs: ["fcm::patient-home"],
    frontendContractDigestRefs: ["frontend-digest::patient-home"],
    designContractPublicationBundleRefs: ["dcpb::patient-home"],
    designContractDigestRefs: ["design-digest::patient-home"],
    designContractLintVerdictRefs: ["dclv::patient-home::passed"],
    projectionContractFamilyRefs: ["pcf::patient-home"],
    projectionContractVersionRefs: ["pcv::patient-home"],
    projectionContractVersionSetRefs: ["pcvs::patient-home"],
    projectionCompatibilityDigestRefs: ["projection-compat::patient-home"],
    projectionQueryContractDigestRefs: ["projection-query::patient-home"],
    mutationCommandContractDigestRefs: ["mutation-command::patient-home"],
    liveUpdateChannelDigestRefs: ["live-channel::patient-home"],
    clientCachePolicyDigestRefs: ["cache-policy::patient-home"],
    releaseContractVerificationMatrixRef: "rcvm::simulation",
    releaseContractMatrixHash: "matrix-hash::simulation",
    commandSettlementSchemaSetRef: "css::platform",
    transitionEnvelopeSchemaSetRef: "tess::platform",
    recoveryDispositionSetRef: "rds::simulation",
    routeFreezeDispositionRefs: ["rfd::patient-home"],
    continuityEvidenceContractRefs: ["cec::patient-home"],
    surfacePublicationRefs: ["surface-publication::patient-home"],
    surfaceRuntimeBindingRefs: ["surface-runtime-binding::patient-home"],
    publicationParityRef: "rpp::simulation",
    buildProvenanceRef: "bpr::simulation",
    provenanceVerificationState: "verified",
    provenanceConsumptionState: "publishable",
    publishedAt: "2026-04-13T12:00:00Z",
    sourceRefs: ["runtime-publication.ts"],
  });

  const parityRecord = createReleasePublicationParityRecord({
    publicationParityRecordId: "rpp::simulation",
    releaseRef: "rc::simulation",
    releaseApprovalFreezeRef: "raf::simulation",
    promotionIntentRef: "promotion-intent::simulation",
    watchTupleHash: bundle.watchTupleHash,
    waveEligibilitySnapshotRef: "wave-eligibility::simulation",
    runtimePublicationBundleRef: bundle.runtimePublicationBundleId,
    releaseContractVerificationMatrixRef: bundle.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: bundle.releaseContractMatrixHash,
    routeContractDigestRefs: bundle.routeContractDigestRefs,
    frontendContractDigestRefs: bundle.frontendContractDigestRefs,
    projectionCompatibilityDigestRefs: bundle.projectionCompatibilityDigestRefs,
    surfacePublicationRefs: bundle.surfacePublicationRefs,
    surfaceRuntimeBindingRefs: bundle.surfaceRuntimeBindingRefs,
    activeChannelFreezeRefs: ["channel-freeze::browser"],
    recoveryDispositionRefs: ["recovery-disposition::patient-home"],
    continuityEvidenceDigestRefs: ["continuity-digest::patient-home"],
    provenanceVerificationState: "verified",
    provenanceConsumptionState: "publishable",
    bundleTupleHash: bundle.bundleTupleHash,
    matrixGroupStates: {
      manifests: "exact",
      topology: "exact",
      design: "exact",
      provenance: "exact",
    },
    driftReasonIds: [],
    bindingCeilingReasons: [],
    evaluatedAt: "2026-04-13T12:00:00Z",
    sourceRefs: ["runtime-publication.ts"],
  });

  const verdict = evaluateRuntimePublicationAuthority({
    bundle,
    currentBundle: {
      runtimeTopologyManifestRef: bundle.runtimeTopologyManifestRef,
      workloadFamilyRefs: bundle.workloadFamilyRefs,
      trustZoneBoundaryRefs: bundle.trustZoneBoundaryRefs,
      gatewaySurfaceRefs: bundle.gatewaySurfaceRefs,
      routeContractDigestRefs: bundle.routeContractDigestRefs,
      frontendContractManifestRefs: bundle.frontendContractManifestRefs,
      frontendContractDigestRefs: bundle.frontendContractDigestRefs,
      designContractPublicationBundleRefs: bundle.designContractPublicationBundleRefs,
      designContractDigestRefs: bundle.designContractDigestRefs,
      designContractLintVerdictRefs: bundle.designContractLintVerdictRefs,
      projectionContractFamilyRefs: bundle.projectionContractFamilyRefs,
      projectionContractVersionRefs: bundle.projectionContractVersionRefs,
      projectionContractVersionSetRefs: bundle.projectionContractVersionSetRefs,
      projectionCompatibilityDigestRefs: bundle.projectionCompatibilityDigestRefs,
      projectionQueryContractDigestRefs: bundle.projectionQueryContractDigestRefs,
      mutationCommandContractDigestRefs: bundle.mutationCommandContractDigestRefs,
      liveUpdateChannelDigestRefs: bundle.liveUpdateChannelDigestRefs,
      clientCachePolicyDigestRefs: bundle.clientCachePolicyDigestRefs,
      releaseContractVerificationMatrixRef: bundle.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: bundle.releaseContractMatrixHash,
      commandSettlementSchemaSetRef: bundle.commandSettlementSchemaSetRef,
      transitionEnvelopeSchemaSetRef: bundle.transitionEnvelopeSchemaSetRef,
      recoveryDispositionSetRef: bundle.recoveryDispositionSetRef,
      routeFreezeDispositionRefs: bundle.routeFreezeDispositionRefs,
      continuityEvidenceContractRefs: bundle.continuityEvidenceContractRefs,
      surfacePublicationRefs: bundle.surfacePublicationRefs,
      surfaceRuntimeBindingRefs: bundle.surfaceRuntimeBindingRefs,
      buildProvenanceRef: bundle.buildProvenanceRef,
      provenanceVerificationState: bundle.provenanceVerificationState,
      provenanceConsumptionState: bundle.provenanceConsumptionState,
    },
    parityRecord,
    currentParity: {
      releaseContractVerificationMatrixRef: parityRecord.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: parityRecord.releaseContractMatrixHash,
      routeContractDigestRefs: parityRecord.routeContractDigestRefs,
      frontendContractDigestRefs: parityRecord.frontendContractDigestRefs,
      projectionCompatibilityDigestRefs: parityRecord.projectionCompatibilityDigestRefs,
      surfacePublicationRefs: parityRecord.surfacePublicationRefs,
      surfaceRuntimeBindingRefs: parityRecord.surfaceRuntimeBindingRefs,
      activeChannelFreezeRefs: parityRecord.activeChannelFreezeRefs,
      recoveryDispositionRefs: parityRecord.recoveryDispositionRefs,
      continuityEvidenceDigestRefs: parityRecord.continuityEvidenceDigestRefs,
      provenanceVerificationState: parityRecord.provenanceVerificationState,
      provenanceConsumptionState: parityRecord.provenanceConsumptionState,
      bundleTupleHash: parityRecord.bundleTupleHash,
      matrixGroupStates: parityRecord.matrixGroupStates,
      driftReasonIds: parityRecord.driftReasonIds,
      bindingCeilingReasons: parityRecord.bindingCeilingReasons,
    },
  });

  return {
    bundle,
    parityRecord,
    verdict,
  };
}
