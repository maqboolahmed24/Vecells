export const FRONTEND_MANIFEST_RUNTIME_TASK_ID = "par_113";
export const FRONTEND_MANIFEST_RUNTIME_VISUAL_MODE = "Manifest_Observatory";

export type BrowserPostureState =
  | "publishable_live"
  | "read_only"
  | "recovery_only"
  | "blocked";
export type AccessibilityCoverageState = "complete" | "degraded" | "blocked";
export type ManifestDigestVerdict = "exact" | "drifted" | "missing";
export type ManifestDriftState =
  | "current"
  | "stale_design_tuple"
  | "stale_accessibility_tuple"
  | "stale_runtime_binding"
  | "digest_mismatch"
  | "blocked";
export type RuntimeBindingState = "exact" | "stale" | "blocked";
export type DesignContractLintState = "pass" | "drifted" | "blocked";
export type ProjectionCompatibilityState =
  | "exact"
  | "additive_compatible"
  | "constrained"
  | "recovery_only"
  | "blocked";
export type RuntimePublicationState = "published" | "stale" | "conflict" | "withdrawn";
export type PublicationParityState = "exact" | "stale" | "conflict" | "withdrawn";
export type ManifestState = "current" | "drifted" | "rejected";
export type ManifestValidationState = "valid" | "degraded" | "rejected";
export type ManifestIssueSeverity = "error" | "warning";

export interface FrontendManifestGenerationInput {
  readonly frontendContractManifestId: string;
  readonly audienceSurface: string;
  readonly routeFamilyRefs: readonly string[];
  readonly gatewaySurfaceRef: string;
  readonly gatewaySurfaceRefs?: readonly string[];
  readonly surfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly audienceSurfaceRuntimeBindingRef: string;
  readonly designContractPublicationBundleRef: string;
  readonly tokenKernelLayeringPolicyRef: string;
  readonly profileSelectionResolutionRefs: readonly string[];
  readonly surfaceStateKernelBindingRefs: readonly string[];
  readonly projectionContractVersionSetRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly projectionQueryContractRefs: readonly string[];
  readonly projectionQueryContractDigestRefs: readonly string[];
  readonly mutationCommandContractRefs: readonly string[];
  readonly mutationCommandContractDigestRefs: readonly string[];
  readonly liveUpdateChannelContractRefs: readonly string[];
  readonly liveUpdateChannelDigestRefs: readonly string[];
  readonly clientCachePolicyRef: string;
  readonly clientCachePolicyRefs?: readonly string[];
  readonly clientCachePolicyDigestRefs: readonly string[];
  readonly commandSettlementSchemaRef: string;
  readonly commandSettlementSchemaRefs?: readonly string[];
  readonly transitionEnvelopeSchemaRef: string;
  readonly transitionEnvelopeSchemaRefs?: readonly string[];
  readonly releaseRecoveryDispositionRef: string;
  readonly releaseRecoveryDispositionRefs?: readonly string[];
  readonly routeFreezeDispositionRef: string;
  readonly routeFreezeDispositionRefs?: readonly string[];
  readonly browserPostureState: BrowserPostureState;
  readonly designContractLintVerdictRef: string;
  readonly designContractLintState: DesignContractLintState;
  readonly profileLayeringDigestRef: string;
  readonly kernelPropagationDigestRef: string;
  readonly accessibilitySemanticCoverageProfileRefs: readonly string[];
  readonly automationAnchorProfileRefs: readonly string[];
  readonly surfaceStateSemanticsProfileRefs: readonly string[];
  readonly accessibilityCoverageDigestRef: string;
  readonly accessibilityCoverageState: AccessibilityCoverageState;
  readonly projectionCompatibilityDigestRef: string;
  readonly projectionCompatibilityState: ProjectionCompatibilityState;
  readonly runtimeBindingState: RuntimeBindingState;
  readonly runtimePublicationState: RuntimePublicationState;
  readonly publicationParityState: PublicationParityState;
  readonly manifestState: ManifestState;
  readonly frontendContractDigestRef?: string;
  readonly designContractDigestRef?: string;
  readonly surfaceAuthorityTupleHash?: string;
  readonly frontendContractDigestVerdict?: ManifestDigestVerdict;
  readonly designContractDigestVerdict?: ManifestDigestVerdict;
  readonly surfaceAuthorityTupleVerdict?: ManifestDigestVerdict;
  readonly driftState?: ManifestDriftState;
  readonly generatedAt?: string;
  readonly source_refs: readonly string[];
}

export interface FrontendContractManifestRuntime
  extends Omit<
    FrontendManifestGenerationInput,
    | "gatewaySurfaceRefs"
    | "clientCachePolicyRefs"
    | "commandSettlementSchemaRefs"
    | "transitionEnvelopeSchemaRefs"
    | "releaseRecoveryDispositionRefs"
    | "routeFreezeDispositionRefs"
  > {
  readonly gatewaySurfaceRefs: readonly string[];
  readonly clientCachePolicyRefs: readonly string[];
  readonly commandSettlementSchemaRefs: readonly string[];
  readonly transitionEnvelopeSchemaRefs: readonly string[];
  readonly releaseRecoveryDispositionRefs: readonly string[];
  readonly routeFreezeDispositionRefs: readonly string[];
  readonly frontendContractDigestRef: string;
  readonly designContractDigestRef: string;
  readonly surfaceAuthorityTupleHash: string;
  readonly frontendContractDigestVerdict: ManifestDigestVerdict;
  readonly designContractDigestVerdict: ManifestDigestVerdict;
  readonly surfaceAuthorityTupleVerdict: ManifestDigestVerdict;
  readonly driftState: ManifestDriftState;
  readonly generatedAt: string;
}

export interface FrontendManifestValidationIssue {
  readonly code: string;
  readonly severity: ManifestIssueSeverity;
  readonly message: string;
  readonly field: string | null;
}

export interface FrontendManifestValidationOptions {
  readonly routeFamilyRef?: string;
  readonly surfacePublicationRef?: string;
  readonly audienceSurfaceRuntimeBindingRef?: string;
  readonly designContractPublicationBundleRef?: string;
  readonly runtimePublicationBundleRef?: string;
  readonly expectPublishableLive?: boolean;
}

export interface FrontendManifestValidationVerdict {
  readonly manifestRef: string;
  readonly routeFamilyRefs: readonly string[];
  readonly validationState: ManifestValidationState;
  readonly safeToConsume: boolean;
  readonly declaredBrowserPosture: BrowserPostureState;
  readonly effectiveBrowserPosture: BrowserPostureState;
  readonly driftState: ManifestDriftState;
  readonly frontendContractDigestVerdict: ManifestDigestVerdict;
  readonly designContractDigestVerdict: ManifestDigestVerdict;
  readonly surfaceAuthorityTupleVerdict: ManifestDigestVerdict;
  readonly issueCodes: readonly string[];
  readonly issues: readonly FrontendManifestValidationIssue[];
  readonly generatedAt: string;
}

export interface ValidatedFrontendContractManifest {
  readonly manifest: FrontendContractManifestRuntime;
  readonly verdict: FrontendManifestValidationVerdict;
}

export interface FrontendManifestValidationExample {
  readonly scenarioId: string;
  readonly label: string;
  readonly manifest: FrontendContractManifestRuntime;
  readonly expected: {
    readonly validationState: ManifestValidationState;
    readonly effectiveBrowserPosture: BrowserPostureState;
    readonly safeToConsume: boolean;
    readonly issueCodes: readonly string[];
  };
}

export interface SeedRouteManifestSpecimen {
  readonly specimenId: string;
  readonly manifestRef: string;
  readonly routeFamilyRef: string;
  readonly shellLabel: string;
  readonly selectedAnchor: string;
  readonly requiredDomMarkers: readonly string[];
  readonly source_refs: readonly string[];
}

function uniqueOrdered(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    ordered.push(value);
  }
  return ordered;
}

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function normalizeRecord(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeRecord(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeRecord(entry)]),
    );
  }
  return value;
}

function deterministicHashHex(value: string): string {
  let left = 0x811c9dc5 ^ value.length;
  let right = 0x9e3779b9 ^ value.length;
  let upper = 0xc2b2ae35 ^ value.length;
  let lower = 0x27d4eb2f ^ value.length;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ ((code << (index % 8)) >>> 0), 0x85ebca6b);
    upper = Math.imul(upper ^ (code + index), 0x165667b1);
    lower = Math.imul(lower ^ (code + value.length - index), 0xd3a2646c);
  }

  return [left >>> 0, right >>> 0, upper >>> 0, lower >>> 0]
    .map((part) => part.toString(16).padStart(8, "0"))
    .join("");
}

export function stableDigest(value: unknown): string {
  return deterministicHashHex(JSON.stringify(normalizeRecord(value))).slice(0, 16);
}

function digestRef(prefix: string, value: unknown): string {
  return `${prefix}::${stableDigest(value)}`;
}

function postureRank(state: BrowserPostureState): number {
  switch (state) {
    case "publishable_live":
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
  current: BrowserPostureState,
  next: BrowserPostureState,
): BrowserPostureState {
  return postureRank(next) > postureRank(current) ? next : current;
}

export function deriveFrontendContractDigest(
  manifest: Pick<
    FrontendContractManifestRuntime,
    | "routeFamilyRefs"
    | "gatewaySurfaceRefs"
    | "projectionQueryContractDigestRefs"
    | "mutationCommandContractDigestRefs"
    | "liveUpdateChannelDigestRefs"
    | "clientCachePolicyDigestRefs"
  >,
): string {
  return digestRef("frontend-contract-digest", {
    routeFamilyRefs: uniqueSorted(manifest.routeFamilyRefs),
    gatewaySurfaceRefs: uniqueSorted(manifest.gatewaySurfaceRefs),
    projectionQueryContractDigestRefs: uniqueSorted(manifest.projectionQueryContractDigestRefs),
    mutationCommandContractDigestRefs: uniqueSorted(manifest.mutationCommandContractDigestRefs),
    liveUpdateChannelDigestRefs: uniqueSorted(manifest.liveUpdateChannelDigestRefs),
    clientCachePolicyDigestRefs: uniqueSorted(manifest.clientCachePolicyDigestRefs),
  });
}

export function deriveDesignContractDigest(
  manifest: Pick<
    FrontendContractManifestRuntime,
    | "designContractPublicationBundleRef"
    | "tokenKernelLayeringPolicyRef"
    | "profileSelectionResolutionRefs"
    | "surfaceStateKernelBindingRefs"
    | "accessibilitySemanticCoverageProfileRefs"
    | "automationAnchorProfileRefs"
    | "surfaceStateSemanticsProfileRefs"
    | "designContractLintVerdictRef"
  >,
): string {
  return digestRef("design-contract-digest", {
    designContractPublicationBundleRef: manifest.designContractPublicationBundleRef,
    tokenKernelLayeringPolicyRef: manifest.tokenKernelLayeringPolicyRef,
    profileSelectionResolutionRefs: uniqueSorted(manifest.profileSelectionResolutionRefs),
    surfaceStateKernelBindingRefs: uniqueSorted(manifest.surfaceStateKernelBindingRefs),
    accessibilitySemanticCoverageProfileRefs: uniqueSorted(
      manifest.accessibilitySemanticCoverageProfileRefs,
    ),
    automationAnchorProfileRefs: uniqueSorted(manifest.automationAnchorProfileRefs),
    surfaceStateSemanticsProfileRefs: uniqueSorted(manifest.surfaceStateSemanticsProfileRefs),
    designContractLintVerdictRef: manifest.designContractLintVerdictRef,
  });
}

export function deriveSurfaceAuthorityTupleHash(
  manifest: Pick<
    FrontendContractManifestRuntime,
    | "surfaceRouteContractRef"
    | "surfacePublicationRef"
    | "audienceSurfaceRuntimeBindingRef"
    | "designContractPublicationBundleRef"
    | "runtimePublicationBundleRef"
    | "profileLayeringDigestRef"
    | "kernelPropagationDigestRef"
    | "accessibilityCoverageDigestRef"
    | "projectionCompatibilityDigestRef"
    | "browserPostureState"
  >,
): string {
  return digestRef("surface-authority-tuple", {
    surfaceRouteContractRef: manifest.surfaceRouteContractRef,
    surfacePublicationRef: manifest.surfacePublicationRef,
    audienceSurfaceRuntimeBindingRef: manifest.audienceSurfaceRuntimeBindingRef,
    designContractPublicationBundleRef: manifest.designContractPublicationBundleRef,
    runtimePublicationBundleRef: manifest.runtimePublicationBundleRef,
    profileLayeringDigestRef: manifest.profileLayeringDigestRef,
    kernelPropagationDigestRef: manifest.kernelPropagationDigestRef,
    accessibilityCoverageDigestRef: manifest.accessibilityCoverageDigestRef,
    projectionCompatibilityDigestRef: manifest.projectionCompatibilityDigestRef,
    browserPostureState: manifest.browserPostureState,
  });
}

function deriveDriftStateFromInputs(
  input: Pick<
    FrontendContractManifestRuntime,
    | "manifestState"
    | "runtimeBindingState"
    | "designContractLintState"
    | "accessibilityCoverageState"
    | "projectionCompatibilityState"
    | "runtimePublicationState"
    | "publicationParityState"
  >,
  digests: {
    frontend: ManifestDigestVerdict;
    design: ManifestDigestVerdict;
    surface: ManifestDigestVerdict;
  },
): ManifestDriftState {
  if (
    digests.frontend !== "exact" ||
    digests.design !== "exact" ||
    digests.surface !== "exact"
  ) {
    return "digest_mismatch";
  }
  if (
    input.manifestState === "rejected" ||
    input.runtimeBindingState === "blocked" ||
    input.designContractLintState === "blocked" ||
    input.accessibilityCoverageState === "blocked" ||
    input.projectionCompatibilityState === "blocked" ||
    input.runtimePublicationState === "conflict" ||
    input.runtimePublicationState === "withdrawn" ||
    input.publicationParityState === "conflict" ||
    input.publicationParityState === "withdrawn"
  ) {
    return "blocked";
  }
  if (input.runtimeBindingState === "stale") {
    return "stale_runtime_binding";
  }
  if (input.accessibilityCoverageState === "degraded") {
    return "stale_accessibility_tuple";
  }
  if (
    input.designContractLintState === "drifted" ||
    input.runtimePublicationState === "stale" ||
    input.publicationParityState === "stale" ||
    input.projectionCompatibilityState === "constrained" ||
    input.projectionCompatibilityState === "recovery_only" ||
    input.manifestState === "drifted"
  ) {
    return "stale_design_tuple";
  }
  return "current";
}

export function generateFrontendContractManifest(
  input: FrontendManifestGenerationInput,
): FrontendContractManifestRuntime {
  const gatewaySurfaceRefs = uniqueOrdered([input.gatewaySurfaceRef, ...(input.gatewaySurfaceRefs ?? [])]);
  const clientCachePolicyRefs = uniqueOrdered([
    input.clientCachePolicyRef,
    ...(input.clientCachePolicyRefs ?? []),
  ]);
  const commandSettlementSchemaRefs = uniqueOrdered([
    input.commandSettlementSchemaRef,
    ...(input.commandSettlementSchemaRefs ?? []),
  ]);
  const transitionEnvelopeSchemaRefs = uniqueOrdered([
    input.transitionEnvelopeSchemaRef,
    ...(input.transitionEnvelopeSchemaRefs ?? []),
  ]);
  const releaseRecoveryDispositionRefs = uniqueOrdered([
    input.releaseRecoveryDispositionRef,
    ...(input.releaseRecoveryDispositionRefs ?? []),
  ]);
  const routeFreezeDispositionRefs = uniqueOrdered([
    input.routeFreezeDispositionRef,
    ...(input.routeFreezeDispositionRefs ?? []),
  ]);

  const baseManifest = {
    ...input,
    gatewaySurfaceRefs,
    clientCachePolicyRefs,
    commandSettlementSchemaRefs,
    transitionEnvelopeSchemaRefs,
    releaseRecoveryDispositionRefs,
    routeFreezeDispositionRefs,
    routeFamilyRefs: uniqueOrdered(input.routeFamilyRefs),
    profileSelectionResolutionRefs: uniqueOrdered(input.profileSelectionResolutionRefs),
    surfaceStateKernelBindingRefs: uniqueOrdered(input.surfaceStateKernelBindingRefs),
    projectionQueryContractRefs: uniqueOrdered(input.projectionQueryContractRefs),
    projectionQueryContractDigestRefs: uniqueOrdered(input.projectionQueryContractDigestRefs),
    mutationCommandContractRefs: uniqueOrdered(input.mutationCommandContractRefs),
    mutationCommandContractDigestRefs: uniqueOrdered(input.mutationCommandContractDigestRefs),
    liveUpdateChannelContractRefs: uniqueOrdered(input.liveUpdateChannelContractRefs),
    liveUpdateChannelDigestRefs: uniqueOrdered(input.liveUpdateChannelDigestRefs),
    clientCachePolicyDigestRefs: uniqueOrdered(input.clientCachePolicyDigestRefs),
    accessibilitySemanticCoverageProfileRefs: uniqueOrdered(
      input.accessibilitySemanticCoverageProfileRefs,
    ),
    automationAnchorProfileRefs: uniqueOrdered(input.automationAnchorProfileRefs),
    surfaceStateSemanticsProfileRefs: uniqueOrdered(input.surfaceStateSemanticsProfileRefs),
    generatedAt: input.generatedAt ?? "2026-04-13T16:00:00Z",
  } satisfies Omit<
    FrontendContractManifestRuntime,
    | "frontendContractDigestRef"
    | "designContractDigestRef"
    | "surfaceAuthorityTupleHash"
    | "frontendContractDigestVerdict"
    | "designContractDigestVerdict"
    | "surfaceAuthorityTupleVerdict"
    | "driftState"
  >;

  const frontendContractDigestRef =
    input.frontendContractDigestRef ?? deriveFrontendContractDigest(baseManifest);
  const designContractDigestRef =
    input.designContractDigestRef ?? deriveDesignContractDigest(baseManifest);
  const surfaceAuthorityTupleHash =
    input.surfaceAuthorityTupleHash ?? deriveSurfaceAuthorityTupleHash(baseManifest);

  const digests = {
    frontend: input.frontendContractDigestVerdict ?? "exact",
    design: input.designContractDigestVerdict ?? "exact",
    surface: input.surfaceAuthorityTupleVerdict ?? "exact",
  } as const;

  return {
    ...baseManifest,
    frontendContractDigestRef,
    designContractDigestRef,
    surfaceAuthorityTupleHash,
    frontendContractDigestVerdict: digests.frontend,
    designContractDigestVerdict: digests.design,
    surfaceAuthorityTupleVerdict: digests.surface,
    driftState:
      input.driftState ??
      deriveDriftStateFromInputs(baseManifest, {
        frontend: digests.frontend,
        design: digests.design,
        surface: digests.surface,
      }),
  };
}

function createIssue(
  code: string,
  severity: ManifestIssueSeverity,
  message: string,
  field: string | null,
): FrontendManifestValidationIssue {
  return { code, severity, message, field };
}

function ensureRequiredString(
  issues: FrontendManifestValidationIssue[],
  value: string,
  field: string,
): void {
  if (!value) {
    issues.push(createIssue(`missing_${field}`, "error", `${field} is required.`, field));
  }
}

function ensureRequiredArray(
  issues: FrontendManifestValidationIssue[],
  values: readonly string[],
  field: string,
): void {
  if (!values.length) {
    issues.push(
      createIssue(`missing_${field}`, "error", `${field} must contain at least one ref.`, field),
    );
  }
}

function digestVerdict(actual: string, expected: string): ManifestDigestVerdict {
  if (!actual) {
    return "missing";
  }
  return actual === expected ? "exact" : "drifted";
}

function requiredPostureFromState(
  manifest: FrontendContractManifestRuntime,
  issues: readonly FrontendManifestValidationIssue[],
): BrowserPostureState {
  if (issues.some((issue) => issue.severity === "error")) {
    return "blocked";
  }
  if (
    manifest.runtimeBindingState === "blocked" ||
    manifest.designContractLintState === "blocked" ||
    manifest.accessibilityCoverageState === "blocked" ||
    manifest.projectionCompatibilityState === "blocked" ||
    manifest.runtimePublicationState === "conflict" ||
    manifest.runtimePublicationState === "withdrawn" ||
    manifest.publicationParityState === "conflict" ||
    manifest.publicationParityState === "withdrawn" ||
    manifest.manifestState === "rejected"
  ) {
    return "blocked";
  }
  if (
    manifest.runtimeBindingState === "stale" ||
    manifest.accessibilityCoverageState === "degraded"
  ) {
    return "recovery_only";
  }
  if (
    manifest.designContractLintState === "drifted" ||
    manifest.runtimePublicationState === "stale" ||
    manifest.publicationParityState === "stale" ||
    manifest.projectionCompatibilityState === "constrained" ||
    manifest.projectionCompatibilityState === "recovery_only" ||
    manifest.manifestState === "drifted"
  ) {
    return "read_only";
  }
  return "publishable_live";
}

export function validateFrontendContractManifest(
  manifest: FrontendContractManifestRuntime,
  options: FrontendManifestValidationOptions = {},
): FrontendManifestValidationVerdict {
  const issues: FrontendManifestValidationIssue[] = [];

  for (const field of [
    "frontendContractManifestId",
    "audienceSurface",
    "gatewaySurfaceRef",
    "surfaceRouteContractRef",
    "surfacePublicationRef",
    "audienceSurfaceRuntimeBindingRef",
    "designContractPublicationBundleRef",
    "tokenKernelLayeringPolicyRef",
    "projectionContractVersionSetRef",
    "runtimePublicationBundleRef",
    "clientCachePolicyRef",
    "commandSettlementSchemaRef",
    "transitionEnvelopeSchemaRef",
    "releaseRecoveryDispositionRef",
    "routeFreezeDispositionRef",
    "designContractLintVerdictRef",
    "profileLayeringDigestRef",
    "kernelPropagationDigestRef",
    "accessibilityCoverageDigestRef",
    "projectionCompatibilityDigestRef",
  ] as const) {
    ensureRequiredString(issues, manifest[field], field);
  }

  for (const field of [
    "routeFamilyRefs",
    "gatewaySurfaceRefs",
    "profileSelectionResolutionRefs",
    "surfaceStateKernelBindingRefs",
    "projectionQueryContractRefs",
    "projectionQueryContractDigestRefs",
    "mutationCommandContractRefs",
    "mutationCommandContractDigestRefs",
    "clientCachePolicyRefs",
    "clientCachePolicyDigestRefs",
    "commandSettlementSchemaRefs",
    "transitionEnvelopeSchemaRefs",
    "releaseRecoveryDispositionRefs",
    "routeFreezeDispositionRefs",
    "accessibilitySemanticCoverageProfileRefs",
    "automationAnchorProfileRefs",
    "surfaceStateSemanticsProfileRefs",
  ] as const) {
    ensureRequiredArray(issues, manifest[field], field);
  }

  if (!manifest.gatewaySurfaceRefs.includes(manifest.gatewaySurfaceRef)) {
    issues.push(
      createIssue(
        "gateway_surface_primary_missing",
        "error",
        "gatewaySurfaceRef must appear inside gatewaySurfaceRefs.",
        "gatewaySurfaceRefs",
      ),
    );
  }

  if (!manifest.clientCachePolicyRefs.includes(manifest.clientCachePolicyRef)) {
    issues.push(
      createIssue(
        "client_cache_primary_missing",
        "error",
        "clientCachePolicyRef must appear inside clientCachePolicyRefs.",
        "clientCachePolicyRefs",
      ),
    );
  }

  if (!manifest.commandSettlementSchemaRefs.includes(manifest.commandSettlementSchemaRef)) {
    issues.push(
      createIssue(
        "command_settlement_primary_missing",
        "error",
        "commandSettlementSchemaRef must appear inside commandSettlementSchemaRefs.",
        "commandSettlementSchemaRefs",
      ),
    );
  }

  if (!manifest.transitionEnvelopeSchemaRefs.includes(manifest.transitionEnvelopeSchemaRef)) {
    issues.push(
      createIssue(
        "transition_envelope_primary_missing",
        "error",
        "transitionEnvelopeSchemaRef must appear inside transitionEnvelopeSchemaRefs.",
        "transitionEnvelopeSchemaRefs",
      ),
    );
  }

  if (!manifest.releaseRecoveryDispositionRefs.includes(manifest.releaseRecoveryDispositionRef)) {
    issues.push(
      createIssue(
        "release_recovery_primary_missing",
        "error",
        "releaseRecoveryDispositionRef must appear inside releaseRecoveryDispositionRefs.",
        "releaseRecoveryDispositionRefs",
      ),
    );
  }

  if (!manifest.routeFreezeDispositionRefs.includes(manifest.routeFreezeDispositionRef)) {
    issues.push(
      createIssue(
        "route_freeze_primary_missing",
        "error",
        "routeFreezeDispositionRef must appear inside routeFreezeDispositionRefs.",
        "routeFreezeDispositionRefs",
      ),
    );
  }

  if (options.routeFamilyRef && !manifest.routeFamilyRefs.includes(options.routeFamilyRef)) {
    issues.push(
      createIssue(
        "route_family_not_published",
        "error",
        `Route family ${options.routeFamilyRef} is not published by this manifest.`,
        "routeFamilyRefs",
      ),
    );
  }

  for (const [field, expected] of [
    ["surfacePublicationRef", options.surfacePublicationRef],
    ["audienceSurfaceRuntimeBindingRef", options.audienceSurfaceRuntimeBindingRef],
    ["designContractPublicationBundleRef", options.designContractPublicationBundleRef],
    ["runtimePublicationBundleRef", options.runtimePublicationBundleRef],
  ] as const) {
    if (expected && manifest[field] !== expected) {
      issues.push(
        createIssue(
          `${field}_mismatch`,
          "error",
          `${field} drifted from the expected joined authority ref.`,
          field,
        ),
      );
    }
  }

  const expectedFrontendDigest = deriveFrontendContractDigest(manifest);
  const expectedDesignDigest = deriveDesignContractDigest(manifest);
  const expectedSurfaceHash = deriveSurfaceAuthorityTupleHash(manifest);

  const frontendContractDigestVerdict = digestVerdict(
    manifest.frontendContractDigestRef,
    expectedFrontendDigest,
  );
  const designContractDigestVerdict = digestVerdict(
    manifest.designContractDigestRef,
    expectedDesignDigest,
  );
  const surfaceAuthorityTupleVerdict = digestVerdict(
    manifest.surfaceAuthorityTupleHash,
    expectedSurfaceHash,
  );

  if (frontendContractDigestVerdict !== "exact") {
    issues.push(
      createIssue(
        "frontend_contract_digest_drift",
        "error",
        "Frontend contract digest no longer matches the published read/write/cache tuple.",
        "frontendContractDigestRef",
      ),
    );
  }
  if (designContractDigestVerdict !== "exact") {
    issues.push(
      createIssue(
        "design_contract_digest_drift",
        "error",
        "Design contract digest no longer matches the published design tuple.",
        "designContractDigestRef",
      ),
    );
  }
  if (surfaceAuthorityTupleVerdict !== "exact") {
    issues.push(
      createIssue(
        "surface_authority_tuple_drift",
        "error",
        "Surface authority tuple hash no longer matches the published runtime/design join.",
        "surfaceAuthorityTupleHash",
      ),
    );
  }

  if (manifest.designContractLintState === "drifted") {
    issues.push(
      createIssue(
        "design_contract_lint_drifted",
        "warning",
        "Design-contract publication drifted and must demote the surface from live posture.",
        "designContractLintState",
      ),
    );
  }
  if (manifest.designContractLintState === "blocked") {
    issues.push(
      createIssue(
        "design_contract_lint_blocked",
        "error",
        "Design-contract publication is blocked and the surface must fail closed.",
        "designContractLintState",
      ),
    );
  }

  if (manifest.accessibilityCoverageState === "degraded") {
    issues.push(
      createIssue(
        "accessibility_coverage_degraded",
        "warning",
        "Accessibility coverage drifted and the surface must preserve recovery posture only.",
        "accessibilityCoverageState",
      ),
    );
  }
  if (manifest.accessibilityCoverageState === "blocked") {
    issues.push(
      createIssue(
        "accessibility_coverage_blocked",
        "error",
        "Accessibility coverage is blocked and the manifest is not safe to consume.",
        "accessibilityCoverageState",
      ),
    );
  }

  if (manifest.runtimeBindingState === "stale") {
    issues.push(
      createIssue(
        "runtime_binding_stale",
        "warning",
        "AudienceSurfaceRuntimeBinding drifted and the surface must demote to recovery-only posture.",
        "runtimeBindingState",
      ),
    );
  }
  if (manifest.runtimeBindingState === "blocked") {
    issues.push(
      createIssue(
        "runtime_binding_blocked",
        "error",
        "AudienceSurfaceRuntimeBinding is blocked and browser authority must fail closed.",
        "runtimeBindingState",
      ),
    );
  }

  if (manifest.runtimePublicationState === "stale") {
    issues.push(
      createIssue(
        "runtime_publication_stale",
        "warning",
        "Runtime publication bundle is stale and live posture is no longer allowed.",
        "runtimePublicationState",
      ),
    );
  }
  if (manifest.runtimePublicationState === "conflict") {
    issues.push(
      createIssue(
        "runtime_publication_conflict",
        "error",
        "Runtime publication bundle is in conflict and the manifest must fail closed.",
        "runtimePublicationState",
      ),
    );
  }
  if (manifest.runtimePublicationState === "withdrawn") {
    issues.push(
      createIssue(
        "runtime_publication_withdrawn",
        "error",
        "Runtime publication bundle was withdrawn and the manifest must fail closed.",
        "runtimePublicationState",
      ),
    );
  }

  if (manifest.publicationParityState === "stale") {
    issues.push(
      createIssue(
        "publication_parity_stale",
        "warning",
        "Release publication parity drifted and writable posture is no longer allowed.",
        "publicationParityState",
      ),
    );
  }
  if (manifest.publicationParityState === "conflict") {
    issues.push(
      createIssue(
        "publication_parity_conflict",
        "error",
        "Release publication parity is in conflict and browser authority must fail closed.",
        "publicationParityState",
      ),
    );
  }
  if (manifest.publicationParityState === "withdrawn") {
    issues.push(
      createIssue(
        "publication_parity_withdrawn",
        "error",
        "Release publication parity was withdrawn and browser authority must fail closed.",
        "publicationParityState",
      ),
    );
  }

  if (
    manifest.projectionCompatibilityState === "constrained" ||
    manifest.projectionCompatibilityState === "recovery_only"
  ) {
    issues.push(
      createIssue(
        "projection_compatibility_constrained",
        "warning",
        "Projection compatibility narrowed and the surface must demote below publishable_live.",
        "projectionCompatibilityState",
      ),
    );
  }
  if (manifest.projectionCompatibilityState === "blocked") {
    issues.push(
      createIssue(
        "projection_compatibility_blocked",
        "error",
        "Projection compatibility is blocked and browser authority must fail closed.",
        "projectionCompatibilityState",
      ),
    );
  }

  if (manifest.manifestState === "drifted") {
    issues.push(
      createIssue(
        "manifest_state_drifted",
        "warning",
        "Manifest state is drifted and must not remain fully live.",
        "manifestState",
      ),
    );
  }
  if (manifest.manifestState === "rejected") {
    issues.push(
      createIssue(
        "manifest_state_rejected",
        "error",
        "Manifest state is rejected and the route may not consume it.",
        "manifestState",
      ),
    );
  }

  const requiredPosture = requiredPostureFromState(manifest, issues);
  const effectiveBrowserPosture = worsenPosture(manifest.browserPostureState, requiredPosture);

  if (options.expectPublishableLive && effectiveBrowserPosture !== "publishable_live") {
    issues.push(
      createIssue(
        "publishable_live_unavailable",
        "error",
        "A live specimen requested publishable_live posture but the manifest failed closed.",
        "browserPostureState",
      ),
    );
  }

  const driftState = deriveDriftStateFromInputs(manifest, {
    frontend: frontendContractDigestVerdict,
    design: designContractDigestVerdict,
    surface: surfaceAuthorityTupleVerdict,
  });

  const safeToConsume = !issues.some((issue) => issue.severity === "error");
  const validationState: ManifestValidationState = safeToConsume
    ? effectiveBrowserPosture === "publishable_live"
      ? "valid"
      : "degraded"
    : "rejected";

  return {
    manifestRef: manifest.frontendContractManifestId,
    routeFamilyRefs: manifest.routeFamilyRefs,
    validationState,
    safeToConsume,
    declaredBrowserPosture: manifest.browserPostureState,
    effectiveBrowserPosture,
    driftState,
    frontendContractDigestVerdict,
    designContractDigestVerdict,
    surfaceAuthorityTupleVerdict,
    issueCodes: issues.map((issue) => issue.code),
    issues,
    generatedAt: manifest.generatedAt,
  };
}

export function consumeValidatedFrontendContractManifest(
  manifest: FrontendContractManifestRuntime,
  options: FrontendManifestValidationOptions = {},
): ValidatedFrontendContractManifest {
  const verdict = validateFrontendContractManifest(manifest, options);
  if (!verdict.safeToConsume) {
    throw new Error(
      `FRONTEND_MANIFEST_REJECTED:${manifest.frontendContractManifestId}:${verdict.issueCodes.join(",")}`,
    );
  }
  return { manifest, verdict };
}

export class FrontendContractManifestStore {
  private readonly manifestsById = new Map<string, FrontendContractManifestRuntime>();
  private readonly manifestIdsByRouteFamily = new Map<string, string>();

  constructor(manifests: readonly FrontendContractManifestRuntime[]) {
    for (const manifest of manifests) {
      if (this.manifestsById.has(manifest.frontendContractManifestId)) {
        throw new Error(
          `FRONTEND_MANIFEST_DUPLICATE_ID:${manifest.frontendContractManifestId}`,
        );
      }
      this.manifestsById.set(manifest.frontendContractManifestId, manifest);
      for (const routeFamilyRef of manifest.routeFamilyRefs) {
        if (this.manifestIdsByRouteFamily.has(routeFamilyRef)) {
          throw new Error(`FRONTEND_MANIFEST_DUPLICATE_ROUTE:${routeFamilyRef}`);
        }
        this.manifestIdsByRouteFamily.set(routeFamilyRef, manifest.frontendContractManifestId);
      }
    }
  }

  listManifests(): readonly FrontendContractManifestRuntime[] {
    return Array.from(this.manifestsById.values());
  }

  getManifestById(manifestId: string): FrontendContractManifestRuntime {
    const manifest = this.manifestsById.get(manifestId);
    if (!manifest) {
      throw new Error(`FRONTEND_MANIFEST_UNKNOWN:${manifestId}`);
    }
    return manifest;
  }

  findManifestForRoute(routeFamilyRef: string): FrontendContractManifestRuntime | null {
    const manifestId = this.manifestIdsByRouteFamily.get(routeFamilyRef);
    return manifestId ? this.getManifestById(manifestId) : null;
  }

  validateRoute(
    routeFamilyRef: string,
    options: Omit<FrontendManifestValidationOptions, "routeFamilyRef"> = {},
  ): FrontendManifestValidationVerdict | null {
    const manifest = this.findManifestForRoute(routeFamilyRef);
    if (!manifest) {
      return null;
    }
    return validateFrontendContractManifest(manifest, {
      ...options,
      routeFamilyRef,
    });
  }

  consumeRoute(
    routeFamilyRef: string,
    options: Omit<FrontendManifestValidationOptions, "routeFamilyRef"> = {},
  ): ValidatedFrontendContractManifest {
    const manifest = this.findManifestForRoute(routeFamilyRef);
    if (!manifest) {
      throw new Error(`FRONTEND_MANIFEST_ROUTE_UNPUBLISHED:${routeFamilyRef}`);
    }
    return consumeValidatedFrontendContractManifest(manifest, {
      ...options,
      routeFamilyRef,
    });
  }
}

export function createFrontendContractManifestStore(
  manifests: readonly FrontendContractManifestRuntime[],
): FrontendContractManifestStore {
  return new FrontendContractManifestStore(manifests);
}
