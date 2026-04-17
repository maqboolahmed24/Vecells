import {
  stableDigest,
  type BuildArtifactDescriptor,
  type BuildGateEvidenceRecord,
  type DependencyPolicyVerdictRecord,
} from "./build-provenance";

export type SupplyChainVerificationState =
  | "pending"
  | "verified"
  | "quarantined"
  | "revoked"
  | "superseded";

export type SupplyChainRuntimeConsumptionState =
  | "publishable"
  | "blocked"
  | "withdrawn";

export type SupplyChainDecisionState =
  | "approved"
  | "quarantined"
  | "revoked"
  | "superseded";

export type SupplyChainPublicationEligibilityState =
  | "publishable"
  | "blocked"
  | "withdrawn";

export type SupplyChainSourceTreeState =
  | "clean_tagged"
  | "clean_commit"
  | "dirty_rejected";

export type SupplyChainReproducibilityClass =
  | "reproducible"
  | "replayable_with_attestation"
  | "non_reproducible_blocked";

export type SupplyChainMaterialInputType =
  | "source_tree"
  | "base_image"
  | "toolchain"
  | "dependency_lock"
  | "resolved_dependency_set"
  | "build_parameter_envelope"
  | "policy_bundle"
  | "runtime_binding";

export type SupplyChainAttestationType =
  | "build_provenance"
  | "runtime_binding"
  | "sbom_binding";

export type SupplyChainIssueSeverity = "error" | "warning";

export type SupplyChainAuditAction =
  | "generated"
  | "verified"
  | "quarantined"
  | "revoked"
  | "superseded"
  | "runtime_consumption_blocked";

export interface SupplyChainBaseImageDigest {
  imageRef: string;
  digest: string;
  role: string;
}

export interface SupplyChainToolchainDigest {
  toolchainRef: string;
  digest: string;
  role: string;
  version: string;
}

export interface SupplyChainMaterialInputDescriptor {
  materialInputId: string;
  materialType: SupplyChainMaterialInputType;
  ref: string;
  digest: string;
  required: boolean;
}

export interface SupplyChainRuntimeBindingProof {
  runtimeTopologyManifestRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  targetRuntimeManifestRefs: readonly string[];
  targetSurfaceSchemaSetRef: string;
  targetWorkloadFamilyRefs: readonly string[];
  targetTrustZoneBoundaryRefs: readonly string[];
  targetGatewaySurfaceRefs: readonly string[];
  targetTopologyTupleHash: string;
  bundleTupleHash: string;
  publicationBundleDigest: string;
  parityDigest: string;
  bindingDigest: string;
}

export interface SupplyChainAttestationEnvelope {
  attestationEnvelopeId: string;
  attestationType: SupplyChainAttestationType;
  predicateType: "vecells.build-provenance";
  subjectDigest: string;
  predicateDigest: string;
  builderIdentityRef: string;
  buildInvocationRef: string;
  signingSecretClassRef: string;
  verifiedBy: string;
  attestedAt: string;
  signatureAlgorithm: "hmac-sha256-mock-safe-v2";
  signature: string;
}

export interface SupplyChainProvenanceRecord {
  provenanceId: string;
  buildProvenanceRecordId: string;
  buildFamilyRef: string;
  buildSystemRef: string;
  builderIdentityRef: string;
  buildInvocationRef: string;
  sourceTreeState: SupplyChainSourceTreeState;
  sourceCommitRef: string;
  buildRecipeRef: string;
  buildEnvironmentRef: string;
  ephemeralWorkerRef: string;
  artifactDigests: readonly BuildArtifactDescriptor[];
  artifactSetDigest: string;
  baseImageDigests: readonly SupplyChainBaseImageDigest[];
  toolchainDigests: readonly SupplyChainToolchainDigest[];
  dependencyLockRefs: readonly string[];
  resolvedDependencySetRef: string;
  buildParameterEnvelopeRef: string;
  materialInputDigests: readonly SupplyChainMaterialInputDescriptor[];
  sbomRef: string;
  sbomDigest: string;
  targetRuntimeManifestRefs: readonly string[];
  targetSurfaceSchemaSetRef: string;
  targetWorkloadFamilyRefs: readonly string[];
  targetTrustZoneBoundaryRefs: readonly string[];
  targetGatewaySurfaceRefs: readonly string[];
  targetTopologyTupleHash: string;
  runtimeBindingProof: SupplyChainRuntimeBindingProof;
  reproducibilityClass: SupplyChainReproducibilityClass;
  rebuildChallengeEvidenceRef: string;
  attestationEnvelopeRefs: readonly string[];
  releaseRef: string;
  verificationScenarioRef: string;
  environmentRing: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  verificationState: SupplyChainVerificationState;
  runtimeConsumptionState: SupplyChainRuntimeConsumptionState;
  signedAt: string;
  verifiedBy: string;
  verifiedAt: string | null;
  verificationIssues: readonly string[];
  quarantineReasonRefs: readonly string[];
  revokedAt: string | null;
  revocationReasonRef: string | null;
  supersededByProvenanceRef: string | null;
  supersededAt: string | null;
  canonicalDigest: string;
  signatureAlgorithm: "hmac-sha256-mock-safe-v2";
  signature: string;
}

export type UnsignedSupplyChainProvenanceRecord = Omit<
  SupplyChainProvenanceRecord,
  "canonicalDigest" | "signatureAlgorithm" | "signature"
>;

export interface SupplyChainVerificationIssue {
  code: string;
  severity: SupplyChainIssueSeverity;
  message: string;
  memberRefs: readonly string[];
}

export interface SupplyChainAuditRecord {
  auditRecordId: string;
  provenanceRef: string;
  action: SupplyChainAuditAction;
  actorRef: string;
  recordedAt: string;
  reasonRefs: readonly string[];
  verificationStateAfter: SupplyChainVerificationState;
  runtimeConsumptionStateAfter: SupplyChainRuntimeConsumptionState;
  supersedingProvenanceRef: string | null;
  evidenceDigest: string;
}

export interface SupplyChainPolicyRule {
  triggerRef: string;
  decisionState: SupplyChainDecisionState;
  verificationState: SupplyChainVerificationState;
  runtimeConsumptionState: SupplyChainRuntimeConsumptionState;
  publicationEligibilityState: SupplyChainPublicationEligibilityState;
  operatorAction: string;
  supersessionAllowed: boolean;
}

export interface SupplyChainVerificationResult {
  verified: boolean;
  decisionState: SupplyChainDecisionState;
  verificationState: SupplyChainVerificationState;
  runtimeConsumptionState: SupplyChainRuntimeConsumptionState;
  publicationEligibilityState: SupplyChainPublicationEligibilityState;
  canonicalDigest: string;
  blockerRefs: readonly string[];
  warningRefs: readonly string[];
  issues: readonly SupplyChainVerificationIssue[];
  auditTrail: readonly SupplyChainAuditRecord[];
}

export interface SupplyChainVerificationInput {
  record: SupplyChainProvenanceRecord;
  signingKey: string;
  attestations: readonly SupplyChainAttestationEnvelope[];
  dependencyPolicyVerdict: DependencyPolicyVerdictRecord;
  gateEvidence: readonly BuildGateEvidenceRecord[];
  expectedRuntimeBinding: SupplyChainRuntimeBindingProof;
  expectedSbomDigest: string;
  policyRules?: readonly SupplyChainPolicyRule[];
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface SupplyChainSimulationHarness {
  record: SupplyChainProvenanceRecord;
  attestations: readonly SupplyChainAttestationEnvelope[];
  verification: SupplyChainVerificationResult;
  revokedRecord: SupplyChainProvenanceRecord;
  supersededRecord: SupplyChainProvenanceRecord;
}

export const canonicalSupplyChainPolicyRules = [
  {
    triggerRef: "CANONICAL_DIGEST_DRIFT",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "quarantine_and_rebuild",
    supersessionAllowed: false,
  },
  {
    triggerRef: "PROVENANCE_SIGNATURE_MISMATCH",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "quarantine_and_rebuild",
    supersessionAllowed: false,
  },
  {
    triggerRef: "ATTESTATION_MISSING",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "quarantine_and_rebuild",
    supersessionAllowed: false,
  },
  {
    triggerRef: "ATTESTATION_SIGNATURE_MISMATCH",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "quarantine_and_rebuild",
    supersessionAllowed: false,
  },
  {
    triggerRef: "ATTESTATION_SUBJECT_MISMATCH",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "quarantine_and_rebuild",
    supersessionAllowed: false,
  },
  {
    triggerRef: "DIRTY_SOURCE_TREE",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "reject_publish_and_rebuild_from_clean_commit",
    supersessionAllowed: false,
  },
  {
    triggerRef: "DEPENDENCY_POLICY_BLOCKED",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "quarantine_and_rebuild",
    supersessionAllowed: false,
  },
  {
    triggerRef: "PIPELINE_GATE_BLOCKED",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "hold_pipeline_and_reissue_record",
    supersessionAllowed: false,
  },
  {
    triggerRef: "SBOM_DIGEST_MISMATCH",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "regenerate_sbom_and_rebuild",
    supersessionAllowed: false,
  },
  {
    triggerRef: "MATERIAL_INPUT_MISSING",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "capture_hidden_material_inputs_and_rebuild",
    supersessionAllowed: false,
  },
  {
    triggerRef: "RUNTIME_BINDING_DRIFT",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "block_runtime_consumption_and_reverify_against_current_tuple",
    supersessionAllowed: false,
  },
  {
    triggerRef: "REPRODUCIBILITY_BLOCKED",
    decisionState: "quarantined",
    verificationState: "quarantined",
    runtimeConsumptionState: "blocked",
    publicationEligibilityState: "blocked",
    operatorAction: "reject_non_reproducible_build",
    supersessionAllowed: false,
  },
  {
    triggerRef: "PROVENANCE_REVOKED",
    decisionState: "revoked",
    verificationState: "revoked",
    runtimeConsumptionState: "withdrawn",
    publicationEligibilityState: "withdrawn",
    operatorAction: "withdraw_runtime_consumption",
    supersessionAllowed: false,
  },
  {
    triggerRef: "PROVENANCE_SUPERSEDED",
    decisionState: "superseded",
    verificationState: "superseded",
    runtimeConsumptionState: "withdrawn",
    publicationEligibilityState: "withdrawn",
    operatorAction: "consume_newer_record_only",
    supersessionAllowed: true,
  },
] as const satisfies readonly SupplyChainPolicyRule[];

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function createMockSignature(signingKey: string, digest: string, purpose: string): string {
  return stableDigest({ signingKey, digest, purpose });
}

function timingSafeCompare(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function createIssue(
  code: string,
  message: string,
  memberRefs: readonly string[] = [],
  severity: SupplyChainIssueSeverity = "error",
): SupplyChainVerificationIssue {
  return {
    code,
    severity,
    message,
    memberRefs,
  };
}

function createAuditRecord(input: {
  provenanceRef: string;
  action: SupplyChainAuditAction;
  actorRef: string;
  recordedAt: string;
  reasonRefs: readonly string[];
  verificationStateAfter: SupplyChainVerificationState;
  runtimeConsumptionStateAfter: SupplyChainRuntimeConsumptionState;
  supersedingProvenanceRef?: string | null;
}): SupplyChainAuditRecord {
  return {
    auditRecordId: `sca::${stableDigest(input).slice(0, 16)}`,
    provenanceRef: input.provenanceRef,
    action: input.action,
    actorRef: input.actorRef,
    recordedAt: input.recordedAt,
    reasonRefs: uniqueSorted(input.reasonRefs),
    verificationStateAfter: input.verificationStateAfter,
    runtimeConsumptionStateAfter: input.runtimeConsumptionStateAfter,
    supersedingProvenanceRef: input.supersedingProvenanceRef ?? null,
    evidenceDigest: stableDigest(input),
  };
}

function toCanonicalRecordSubject(
  record: UnsignedSupplyChainProvenanceRecord | SupplyChainProvenanceRecord,
) {
  return {
    provenanceId: record.provenanceId,
    buildProvenanceRecordId: record.buildProvenanceRecordId,
    buildFamilyRef: record.buildFamilyRef,
    buildSystemRef: record.buildSystemRef,
    builderIdentityRef: record.builderIdentityRef,
    buildInvocationRef: record.buildInvocationRef,
    sourceTreeState: record.sourceTreeState,
    sourceCommitRef: record.sourceCommitRef,
    buildRecipeRef: record.buildRecipeRef,
    buildEnvironmentRef: record.buildEnvironmentRef,
    ephemeralWorkerRef: record.ephemeralWorkerRef,
    artifactDigests: record.artifactDigests,
    artifactSetDigest: record.artifactSetDigest,
    baseImageDigests: record.baseImageDigests,
    toolchainDigests: record.toolchainDigests,
    dependencyLockRefs: uniqueSorted(record.dependencyLockRefs),
    resolvedDependencySetRef: record.resolvedDependencySetRef,
    buildParameterEnvelopeRef: record.buildParameterEnvelopeRef,
    materialInputDigests: record.materialInputDigests,
    sbomRef: record.sbomRef,
    sbomDigest: record.sbomDigest,
    targetRuntimeManifestRefs: uniqueSorted(record.targetRuntimeManifestRefs),
    targetSurfaceSchemaSetRef: record.targetSurfaceSchemaSetRef,
    targetWorkloadFamilyRefs: uniqueSorted(record.targetWorkloadFamilyRefs),
    targetTrustZoneBoundaryRefs: uniqueSorted(record.targetTrustZoneBoundaryRefs),
    targetGatewaySurfaceRefs: uniqueSorted(record.targetGatewaySurfaceRefs),
    targetTopologyTupleHash: record.targetTopologyTupleHash,
    runtimeBindingProof: {
      ...record.runtimeBindingProof,
      targetRuntimeManifestRefs: uniqueSorted(record.runtimeBindingProof.targetRuntimeManifestRefs),
      targetWorkloadFamilyRefs: uniqueSorted(record.runtimeBindingProof.targetWorkloadFamilyRefs),
      targetTrustZoneBoundaryRefs: uniqueSorted(
        record.runtimeBindingProof.targetTrustZoneBoundaryRefs,
      ),
      targetGatewaySurfaceRefs: uniqueSorted(record.runtimeBindingProof.targetGatewaySurfaceRefs),
    },
    reproducibilityClass: record.reproducibilityClass,
    rebuildChallengeEvidenceRef: record.rebuildChallengeEvidenceRef,
    attestationEnvelopeRefs: uniqueSorted(record.attestationEnvelopeRefs),
    releaseRef: record.releaseRef,
    verificationScenarioRef: record.verificationScenarioRef,
    environmentRing: record.environmentRing,
    runtimePublicationBundleRef: record.runtimePublicationBundleRef,
    releasePublicationParityRef: record.releasePublicationParityRef,
    signedAt: record.signedAt,
  };
}

function resolveRuleForIssues(
  issues: readonly SupplyChainVerificationIssue[],
  policyRules: readonly SupplyChainPolicyRule[],
) {
  if (issues.length === 0) {
    return {
      decisionState: "approved" as const,
      verificationState: "verified" as const,
      runtimeConsumptionState: "publishable" as const,
      publicationEligibilityState: "publishable" as const,
    };
  }

  const ruleByTrigger = new Map(policyRules.map((rule) => [rule.triggerRef, rule]));
  const issueCodes = issues.map((issue) => issue.code);
  if (issueCodes.includes("PROVENANCE_REVOKED")) {
    return ruleByTrigger.get("PROVENANCE_REVOKED")!;
  }
  if (issueCodes.includes("PROVENANCE_SUPERSEDED")) {
    return ruleByTrigger.get("PROVENANCE_SUPERSEDED")!;
  }
  for (const issue of issues) {
    const rule = ruleByTrigger.get(issue.code);
    if (rule) {
      return rule;
    }
  }
  return {
    decisionState: "quarantined" as const,
    verificationState: "quarantined" as const,
    runtimeConsumptionState: "blocked" as const,
    publicationEligibilityState: "blocked" as const,
  };
}

function runtimeBindingMatches(
  actual: SupplyChainRuntimeBindingProof,
  expected: SupplyChainRuntimeBindingProof,
) {
  return (
    actual.runtimeTopologyManifestRef === expected.runtimeTopologyManifestRef &&
    actual.runtimePublicationBundleRef === expected.runtimePublicationBundleRef &&
    actual.releasePublicationParityRef === expected.releasePublicationParityRef &&
    actual.targetSurfaceSchemaSetRef === expected.targetSurfaceSchemaSetRef &&
    actual.targetTopologyTupleHash === expected.targetTopologyTupleHash &&
    actual.bundleTupleHash === expected.bundleTupleHash &&
    actual.bindingDigest === expected.bindingDigest &&
    arraysEqualAsSets(actual.targetRuntimeManifestRefs, expected.targetRuntimeManifestRefs) &&
    arraysEqualAsSets(actual.targetWorkloadFamilyRefs, expected.targetWorkloadFamilyRefs) &&
    arraysEqualAsSets(
      actual.targetTrustZoneBoundaryRefs,
      expected.targetTrustZoneBoundaryRefs,
    ) &&
    arraysEqualAsSets(actual.targetGatewaySurfaceRefs, expected.targetGatewaySurfaceRefs)
  );
}

function arraysEqualAsSets(left: readonly string[], right: readonly string[]): boolean {
  const normalizedLeft = uniqueSorted(left);
  const normalizedRight = uniqueSorted(right);
  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }
  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

export function createRuntimeBindingProof(input: {
  runtimeTopologyManifestRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  targetRuntimeManifestRefs: readonly string[];
  targetSurfaceSchemaSetRef: string;
  targetWorkloadFamilyRefs: readonly string[];
  targetTrustZoneBoundaryRefs: readonly string[];
  targetGatewaySurfaceRefs: readonly string[];
  targetTopologyTupleHash: string;
  bundleTupleHash: string;
  publicationBundleDigest: string;
  parityDigest: string;
}): SupplyChainRuntimeBindingProof {
  const normalized = {
    runtimeTopologyManifestRef: input.runtimeTopologyManifestRef,
    runtimePublicationBundleRef: input.runtimePublicationBundleRef,
    releasePublicationParityRef: input.releasePublicationParityRef,
    targetRuntimeManifestRefs: uniqueSorted(input.targetRuntimeManifestRefs),
    targetSurfaceSchemaSetRef: input.targetSurfaceSchemaSetRef,
    targetWorkloadFamilyRefs: uniqueSorted(input.targetWorkloadFamilyRefs),
    targetTrustZoneBoundaryRefs: uniqueSorted(input.targetTrustZoneBoundaryRefs),
    targetGatewaySurfaceRefs: uniqueSorted(input.targetGatewaySurfaceRefs),
    targetTopologyTupleHash: input.targetTopologyTupleHash,
    bundleTupleHash: input.bundleTupleHash,
    publicationBundleDigest: input.publicationBundleDigest,
    parityDigest: input.parityDigest,
  };
  return {
    ...normalized,
    bindingDigest: stableDigest(normalized),
  };
}

export function createAttestationEnvelopeId(input: {
  provenanceId: string;
  attestationType: SupplyChainAttestationType;
  buildInvocationRef: string;
}): string {
  return `att::${stableDigest(input).slice(0, 16)}`;
}

export function signSupplyChainProvenanceRecord(input: {
  record: UnsignedSupplyChainProvenanceRecord | SupplyChainProvenanceRecord;
  signingKey: string;
}): SupplyChainProvenanceRecord {
  const canonicalDigest = stableDigest(toCanonicalRecordSubject(input.record));
  return {
    ...input.record,
    canonicalDigest,
    signatureAlgorithm: "hmac-sha256-mock-safe-v2",
    signature: createMockSignature(
      input.signingKey,
      canonicalDigest,
      "vecells-supply-chain-provenance",
    ),
  };
}

export function issueSupplyChainAttestation(input: {
  record: SupplyChainProvenanceRecord;
  attestationType: SupplyChainAttestationType;
  signingKey: string;
  attestedAt?: string;
}): SupplyChainAttestationEnvelope {
  const attestationEnvelopeId = createAttestationEnvelopeId({
    provenanceId: input.record.provenanceId,
    attestationType: input.attestationType,
    buildInvocationRef: input.record.buildInvocationRef,
  });
  const predicateDigest = stableDigest({
    attestationType: input.attestationType,
    artifactSetDigest: input.record.artifactSetDigest,
    sbomDigest: input.record.sbomDigest,
    runtimeBindingDigest: input.record.runtimeBindingProof.bindingDigest,
    sourceCommitRef: input.record.sourceCommitRef,
    reproducibilityClass: input.record.reproducibilityClass,
  });
  return {
    attestationEnvelopeId,
    attestationType: input.attestationType,
    predicateType: "vecells.build-provenance",
    subjectDigest: input.record.canonicalDigest,
    predicateDigest,
    builderIdentityRef: input.record.builderIdentityRef,
    buildInvocationRef: input.record.buildInvocationRef,
    signingSecretClassRef: "RELEASE_PROVENANCE_SIGNING_KEY_REF",
    verifiedBy: input.record.verifiedBy,
    attestedAt: input.attestedAt ?? input.record.signedAt,
    signatureAlgorithm: "hmac-sha256-mock-safe-v2",
    signature: createMockSignature(
      input.signingKey,
      stableDigest({
        attestationEnvelopeId,
        subjectDigest: input.record.canonicalDigest,
        predicateDigest,
      }),
      `vecells-attestation-${input.attestationType}`,
    ),
  };
}

export function verifySupplyChainProvenance(
  input: SupplyChainVerificationInput,
): SupplyChainVerificationResult {
  const issues: SupplyChainVerificationIssue[] = [];
  const policyRules = input.policyRules ?? canonicalSupplyChainPolicyRules;
  const canonicalDigest = stableDigest(toCanonicalRecordSubject(input.record));
  const expectedSignature = createMockSignature(
    input.signingKey,
    canonicalDigest,
    "vecells-supply-chain-provenance",
  );

  if (canonicalDigest !== input.record.canonicalDigest) {
    issues.push(
      createIssue(
        "CANONICAL_DIGEST_DRIFT",
        "The canonical build provenance subject drifted from the signed digest.",
        [input.record.provenanceId],
      ),
    );
  }

  if (!timingSafeCompare(expectedSignature, input.record.signature)) {
    issues.push(
      createIssue(
        "PROVENANCE_SIGNATURE_MISMATCH",
        "The build provenance signature no longer verifies against the canonical subject.",
        [input.record.provenanceId],
      ),
    );
  }

  if (input.record.sourceTreeState === "dirty_rejected") {
    issues.push(
      createIssue(
        "DIRTY_SOURCE_TREE",
        "Publishable provenance may not originate from a dirty source tree.",
        [input.record.sourceCommitRef],
      ),
    );
  }

  if (input.dependencyPolicyVerdict.decisionState !== "passed") {
    issues.push(
      createIssue(
        "DEPENDENCY_POLICY_BLOCKED",
        "Dependency policy verdict is blocked for this artifact set.",
        [input.dependencyPolicyVerdict.dependencyPolicyVerdictId],
      ),
    );
  }

  if (input.gateEvidence.some((row) => row.state !== "passed")) {
    issues.push(
      createIssue(
        "PIPELINE_GATE_BLOCKED",
        "One or more required pipeline gates did not pass.",
        input.gateEvidence.filter((row) => row.state !== "passed").map((row) => row.gateEvidenceRef),
      ),
    );
  }

  if (input.record.sbomDigest !== input.expectedSbomDigest) {
    issues.push(
      createIssue(
        "SBOM_DIGEST_MISMATCH",
        "The SBOM digest does not match the expected promoted SBOM artifact.",
        [input.record.sbomRef],
      ),
    );
  }

  const requiredMaterialTypes = new Set<SupplyChainMaterialInputType>([
    "source_tree",
    "base_image",
    "toolchain",
    "dependency_lock",
    "resolved_dependency_set",
    "build_parameter_envelope",
    "policy_bundle",
    "runtime_binding",
  ]);
  for (const materialType of requiredMaterialTypes) {
    if (!input.record.materialInputDigests.some((row) => row.materialType === materialType)) {
      issues.push(
        createIssue(
          "MATERIAL_INPUT_MISSING",
          `Missing required material input of type ${materialType}.`,
          [materialType],
        ),
      );
    }
  }

  if (input.record.reproducibilityClass === "non_reproducible_blocked") {
    issues.push(
      createIssue(
        "REPRODUCIBILITY_BLOCKED",
        "Non-reproducible artifact tuples may not remain publishable.",
        [input.record.rebuildChallengeEvidenceRef],
      ),
    );
  }

  if (!runtimeBindingMatches(input.record.runtimeBindingProof, input.expectedRuntimeBinding)) {
    issues.push(
      createIssue(
        "RUNTIME_BINDING_DRIFT",
        "The recorded runtime binding does not match the current topology and publication tuple.",
        [
          input.record.runtimeBindingProof.runtimePublicationBundleRef,
          input.expectedRuntimeBinding.runtimePublicationBundleRef,
        ],
      ),
    );
  }

  const attestationById = new Map(
    input.attestations.map((attestation) => [attestation.attestationEnvelopeId, attestation]),
  );
  for (const attestationRef of input.record.attestationEnvelopeRefs) {
    const attestation = attestationById.get(attestationRef);
    if (!attestation) {
      issues.push(
        createIssue(
          "ATTESTATION_MISSING",
          "The provenance record references an attestation that is not present.",
          [attestationRef],
        ),
      );
      continue;
    }
    const expectedAttestationSignature = createMockSignature(
      input.signingKey,
      stableDigest({
        attestationEnvelopeId: attestation.attestationEnvelopeId,
        subjectDigest: attestation.subjectDigest,
        predicateDigest: attestation.predicateDigest,
      }),
      `vecells-attestation-${attestation.attestationType}`,
    );
    if (!timingSafeCompare(expectedAttestationSignature, attestation.signature)) {
      issues.push(
        createIssue(
          "ATTESTATION_SIGNATURE_MISMATCH",
          "An attestation envelope failed signature verification.",
          [attestation.attestationEnvelopeId],
        ),
      );
    }
    if (attestation.subjectDigest !== input.record.canonicalDigest) {
      issues.push(
        createIssue(
          "ATTESTATION_SUBJECT_MISMATCH",
          "An attestation envelope does not bind to the current provenance subject digest.",
          [attestation.attestationEnvelopeId],
        ),
      );
    }
  }

  if (
    input.record.verificationState === "revoked" ||
    input.record.revocationReasonRef !== null ||
    input.record.runtimeConsumptionState === "withdrawn"
  ) {
    issues.push(
      createIssue(
        "PROVENANCE_REVOKED",
        "The build provenance record has been revoked and may not remain consumable.",
        [input.record.provenanceId],
      ),
    );
  }

  if (
    input.record.verificationState === "superseded" ||
    input.record.supersededByProvenanceRef !== null
  ) {
    issues.push(
      createIssue(
        "PROVENANCE_SUPERSEDED",
        "A newer provenance record superseded this artifact tuple.",
        [input.record.provenanceId],
      ),
    );
  }

  const rule = resolveRuleForIssues(issues, policyRules);
  const blockerRefs = uniqueSorted(
    issues.filter((issue) => issue.severity === "error").map((issue) => issue.code),
  );
  const warningRefs = uniqueSorted(
    issues.filter((issue) => issue.severity === "warning").map((issue) => issue.code),
  );
  const recordedAt = input.verifiedAt ?? new Date().toISOString();
  const actorRef = input.verifiedBy ?? input.record.verifiedBy;
  const auditTrail: SupplyChainAuditRecord[] = [
    createAuditRecord({
      provenanceRef: input.record.provenanceId,
      action: "generated",
      actorRef: input.record.builderIdentityRef,
      recordedAt: input.record.signedAt,
      reasonRefs: [],
      verificationStateAfter: "pending",
      runtimeConsumptionStateAfter: "blocked",
    }),
  ];

  if (rule.decisionState === "approved") {
    auditTrail.push(
      createAuditRecord({
        provenanceRef: input.record.provenanceId,
        action: "verified",
        actorRef,
        recordedAt,
        reasonRefs: [],
        verificationStateAfter: "verified",
        runtimeConsumptionStateAfter: "publishable",
      }),
    );
  } else if (rule.decisionState === "revoked") {
    auditTrail.push(
      createAuditRecord({
        provenanceRef: input.record.provenanceId,
        action: "revoked",
        actorRef,
        recordedAt,
        reasonRefs: blockerRefs,
        verificationStateAfter: "revoked",
        runtimeConsumptionStateAfter: "withdrawn",
      }),
    );
  } else if (rule.decisionState === "superseded") {
    auditTrail.push(
      createAuditRecord({
        provenanceRef: input.record.provenanceId,
        action: "superseded",
        actorRef,
        recordedAt,
        reasonRefs: blockerRefs,
        verificationStateAfter: "superseded",
        runtimeConsumptionStateAfter: "withdrawn",
        supersedingProvenanceRef: input.record.supersededByProvenanceRef,
      }),
    );
  } else {
    auditTrail.push(
      createAuditRecord({
        provenanceRef: input.record.provenanceId,
        action: "quarantined",
        actorRef,
        recordedAt,
        reasonRefs: blockerRefs,
        verificationStateAfter: "quarantined",
        runtimeConsumptionStateAfter: "blocked",
      }),
    );
    auditTrail.push(
      createAuditRecord({
        provenanceRef: input.record.provenanceId,
        action: "runtime_consumption_blocked",
        actorRef,
        recordedAt,
        reasonRefs: blockerRefs,
        verificationStateAfter: "quarantined",
        runtimeConsumptionStateAfter: "blocked",
      }),
    );
  }

  return {
    verified: rule.decisionState === "approved" && issues.length === 0,
    decisionState: rule.decisionState,
    verificationState: rule.verificationState,
    runtimeConsumptionState: rule.runtimeConsumptionState,
    publicationEligibilityState: rule.publicationEligibilityState,
    canonicalDigest,
    blockerRefs,
    warningRefs,
    issues,
    auditTrail,
  };
}

export function applySupplyChainVerificationResult(input: {
  record: SupplyChainProvenanceRecord;
  verification: SupplyChainVerificationResult;
  verifiedBy?: string;
  verifiedAt?: string;
}): SupplyChainProvenanceRecord {
  if (
    input.record.verificationState === "quarantined" &&
    input.verification.decisionState === "approved"
  ) {
    throw new Error(
      "A quarantined provenance record cannot be restored in place; a fresh record is required.",
    );
  }

  const verifiedAt = input.verifiedAt ?? new Date().toISOString();
  return {
    ...input.record,
    verificationState: input.verification.verificationState,
    runtimeConsumptionState: input.verification.runtimeConsumptionState,
    verifiedBy: input.verifiedBy ?? input.record.verifiedBy,
    verifiedAt,
    verificationIssues: input.verification.blockerRefs,
    quarantineReasonRefs:
      input.verification.decisionState === "quarantined"
        ? input.verification.blockerRefs
        : input.record.quarantineReasonRefs,
    revokedAt:
      input.verification.decisionState === "revoked" ? verifiedAt : input.record.revokedAt,
    revocationReasonRef:
      input.verification.decisionState === "revoked"
        ? (input.verification.blockerRefs[0] ?? "PROVENANCE_REVOKED")
        : input.record.revocationReasonRef,
    supersededAt:
      input.verification.decisionState === "superseded"
        ? verifiedAt
        : input.record.supersededAt,
  };
}

export function revokeSupplyChainProvenanceRecord(input: {
  record: SupplyChainProvenanceRecord;
  reasonRef: string;
  revokedAt: string;
  verifiedBy?: string;
}): SupplyChainProvenanceRecord {
  if (input.record.verificationState !== "verified") {
    throw new Error("Only a verified provenance record may be revoked.");
  }
  return {
    ...input.record,
    verificationState: "revoked",
    runtimeConsumptionState: "withdrawn",
    verifiedBy: input.verifiedBy ?? input.record.verifiedBy,
    verifiedAt: input.revokedAt,
    verificationIssues: uniqueSorted([...input.record.verificationIssues, "PROVENANCE_REVOKED"]),
    quarantineReasonRefs: uniqueSorted([
      ...input.record.quarantineReasonRefs,
      input.reasonRef,
      "PROVENANCE_REVOKED",
    ]),
    revokedAt: input.revokedAt,
    revocationReasonRef: input.reasonRef,
  };
}

export function supersedeSupplyChainProvenanceRecord(input: {
  record: SupplyChainProvenanceRecord;
  supersededByProvenanceRef: string;
  supersededAt: string;
  verifiedBy?: string;
}): SupplyChainProvenanceRecord {
  if (input.record.verificationState !== "verified") {
    throw new Error("Only a verified provenance record may be superseded.");
  }
  return {
    ...input.record,
    verificationState: "superseded",
    runtimeConsumptionState: "withdrawn",
    verifiedBy: input.verifiedBy ?? input.record.verifiedBy,
    verifiedAt: input.supersededAt,
    verificationIssues: uniqueSorted([
      ...input.record.verificationIssues,
      "PROVENANCE_SUPERSEDED",
    ]),
    quarantineReasonRefs: uniqueSorted([
      ...input.record.quarantineReasonRefs,
      "PROVENANCE_SUPERSEDED",
    ]),
    supersededByProvenanceRef: input.supersededByProvenanceRef,
    supersededAt: input.supersededAt,
  };
}

export function createSupplyChainVerificationSimulationHarness(): SupplyChainSimulationHarness {
  const expectedBinding = createRuntimeBindingProof({
    runtimeTopologyManifestRef: "data/analysis/runtime_topology_manifest.json",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    releasePublicationParityRef: "rpp::local::authoritative",
    targetRuntimeManifestRefs: ["data/analysis/runtime_topology_manifest.json"],
    targetSurfaceSchemaSetRef: "surface-schema-set::local",
    targetWorkloadFamilyRefs: ["wf_command_orchestration", "wf_projection_read_models"],
    targetTrustZoneBoundaryRefs: ["tzb_published_gateway_to_application_core"],
    targetGatewaySurfaceRefs: ["gws_patient_requests"],
    targetTopologyTupleHash: stableDigest("topology::local"),
    bundleTupleHash: stableDigest("bundle::local"),
    publicationBundleDigest: stableDigest("publication::local"),
    parityDigest: stableDigest("parity::local"),
  });
  const signedAt = "2026-04-13T00:00:00+00:00";
  const unsignedRecord: UnsignedSupplyChainProvenanceRecord = {
    provenanceId: "prov::simulated::local",
    buildProvenanceRecordId: "prov::simulated::local",
    buildFamilyRef: "bf_release_control_bundle",
    buildSystemRef: "ci://vecells-foundation",
    builderIdentityRef: "actor://ci_release_attestation",
    buildInvocationRef: "build-invocation::local::1",
    sourceTreeState: "clean_commit",
    sourceCommitRef: "commit::deadbeef",
    buildRecipeRef: "recipe::release-control",
    buildEnvironmentRef: "env::local::node24",
    ephemeralWorkerRef: "worker::local::1",
    artifactDigests: [
      {
        artifactId: "artifact::bundle",
        artifactKind: "workspace_bundle_manifest",
        artifactDigest: stableDigest("artifact::bundle"),
        artifactRoots: ["packages/release-controls", "services/api-gateway"],
      },
    ],
    artifactSetDigest: stableDigest("artifact-set::simulated"),
    baseImageDigests: [
      {
        imageRef: "oci://node:24-bookworm",
        digest: stableDigest("node:24-bookworm"),
        role: "workspace-build",
      },
    ],
    toolchainDigests: [
      {
        toolchainRef: "node",
        digest: stableDigest("node@24"),
        role: "typescript-runtime",
        version: "24.0.0",
      },
      {
        toolchainRef: "pnpm",
        digest: stableDigest("pnpm@10.23.0"),
        role: "workspace-package-manager",
        version: "10.23.0",
      },
    ],
    dependencyLockRefs: ["pnpm-lock.yaml"],
    resolvedDependencySetRef: "depset::simulated",
    buildParameterEnvelopeRef: "bpe::simulated",
    materialInputDigests: [
      {
        materialInputId: "mi::source",
        materialType: "source_tree",
        ref: "git://deadbeef",
        digest: stableDigest("git://deadbeef"),
        required: true,
      },
      {
        materialInputId: "mi::image",
        materialType: "base_image",
        ref: "oci://node:24-bookworm",
        digest: stableDigest("node:24-bookworm"),
        required: true,
      },
      {
        materialInputId: "mi::toolchain",
        materialType: "toolchain",
        ref: "toolchain::node24-pnpm10",
        digest: stableDigest("toolchain::node24-pnpm10"),
        required: true,
      },
      {
        materialInputId: "mi::lock",
        materialType: "dependency_lock",
        ref: "pnpm-lock.yaml",
        digest: stableDigest("pnpm-lock.yaml"),
        required: true,
      },
      {
        materialInputId: "mi::deps",
        materialType: "resolved_dependency_set",
        ref: "depset::simulated",
        digest: stableDigest("depset::simulated"),
        required: true,
      },
      {
        materialInputId: "mi::params",
        materialType: "build_parameter_envelope",
        ref: "bpe::simulated",
        digest: stableDigest("bpe::simulated"),
        required: true,
      },
      {
        materialInputId: "mi::policy",
        materialType: "policy_bundle",
        ref: "policy::dependency-watchlist",
        digest: stableDigest("policy::dependency-watchlist"),
        required: true,
      },
      {
        materialInputId: "mi::binding",
        materialType: "runtime_binding",
        ref: "binding::local",
        digest: expectedBinding.bindingDigest,
        required: true,
      },
    ],
    sbomRef: "sbom::simulated",
    sbomDigest: stableDigest("sbom::simulated"),
    targetRuntimeManifestRefs: ["data/analysis/runtime_topology_manifest.json"],
    targetSurfaceSchemaSetRef: "surface-schema-set::local",
    targetWorkloadFamilyRefs: ["wf_command_orchestration", "wf_projection_read_models"],
    targetTrustZoneBoundaryRefs: ["tzb_published_gateway_to_application_core"],
    targetGatewaySurfaceRefs: ["gws_patient_requests"],
    targetTopologyTupleHash: expectedBinding.targetTopologyTupleHash,
    runtimeBindingProof: expectedBinding,
    reproducibilityClass: "replayable_with_attestation",
    rebuildChallengeEvidenceRef: "rebuild::simulated",
    attestationEnvelopeRefs: [
      createAttestationEnvelopeId({
        provenanceId: "prov::simulated::local",
        attestationType: "build_provenance",
        buildInvocationRef: "build-invocation::local::1",
      }),
      createAttestationEnvelopeId({
        provenanceId: "prov::simulated::local",
        attestationType: "runtime_binding",
        buildInvocationRef: "build-invocation::local::1",
      }),
      createAttestationEnvelopeId({
        provenanceId: "prov::simulated::local",
        attestationType: "sbom_binding",
        buildInvocationRef: "build-invocation::local::1",
      }),
    ],
    releaseRef: "RC_LOCAL_V1",
    verificationScenarioRef: "VS_LOCAL_V1",
    environmentRing: "local",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    releasePublicationParityRef: "rpp::local::authoritative",
    verificationState: "pending",
    runtimeConsumptionState: "blocked",
    signedAt,
    verifiedBy: "svc_release_supply_chain_verifier",
    verifiedAt: null,
    verificationIssues: [],
    quarantineReasonRefs: [],
    revokedAt: null,
    revocationReasonRef: null,
    supersededByProvenanceRef: null,
    supersededAt: null,
  };
  const signingKey = "mock-safe-supply-chain-key";
  const record = signSupplyChainProvenanceRecord({ record: unsignedRecord, signingKey });
  const attestations = [
    issueSupplyChainAttestation({
      record,
      attestationType: "build_provenance",
      signingKey,
      attestedAt: signedAt,
    }),
    issueSupplyChainAttestation({
      record,
      attestationType: "runtime_binding",
      signingKey,
      attestedAt: signedAt,
    }),
    issueSupplyChainAttestation({
      record,
      attestationType: "sbom_binding",
      signingKey,
      attestedAt: signedAt,
    }),
  ] as const;
  const verification = verifySupplyChainProvenance({
    record,
    signingKey,
    attestations,
    dependencyPolicyVerdict: {
      dependencyPolicyVerdictId: "dep-policy::simulated",
      policyRef: "dependency_policy_091_foundation_v1",
      decisionState: "passed",
      blockedReasonRefs: [],
      watchlistHash: stableDigest("watchlist"),
      evaluatedAt: signedAt,
    },
    gateEvidence: [
      {
        gateEvidenceRef: "gate::dependency_resolve",
        gateRef: "dependency_resolve",
        gateLabel: "Dependency resolve",
        state: "passed",
        evidenceDigest: stableDigest("gate::dependency_resolve"),
      },
      {
        gateEvidenceRef: "gate::provenance_verify",
        gateRef: "provenance_verify",
        gateLabel: "Provenance verify",
        state: "passed",
        evidenceDigest: stableDigest("gate::provenance_verify"),
      },
    ],
    expectedRuntimeBinding: expectedBinding,
    expectedSbomDigest: record.sbomDigest,
    verifiedAt: signedAt,
    verifiedBy: "svc_release_supply_chain_verifier",
  });
  const verifiedRecord = applySupplyChainVerificationResult({
    record,
    verification,
    verifiedAt: signedAt,
    verifiedBy: "svc_release_supply_chain_verifier",
  });
  return {
    record: verifiedRecord,
    attestations,
    verification,
    revokedRecord: revokeSupplyChainProvenanceRecord({
      record: verifiedRecord,
      reasonRef: "ATTESTATION_REVOKED",
      revokedAt: "2026-04-13T01:00:00+00:00",
      verifiedBy: "svc_release_supply_chain_verifier",
    }),
    supersededRecord: supersedeSupplyChainProvenanceRecord({
      record: verifiedRecord,
      supersededByProvenanceRef: "prov::simulated::local::v2",
      supersededAt: "2026-04-13T02:00:00+00:00",
      verifiedBy: "svc_release_supply_chain_verifier",
    }),
  };
}
