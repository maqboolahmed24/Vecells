export type ProvenanceArtifactState =
  | "packaged"
  | "publishable"
  | "quarantined"
  | "revoked"
  | "superseded"
  | "blocked";

export type BuildProvenanceState =
  | "verified"
  | "quarantined"
  | "revoked"
  | "superseded"
  | "drifted";

export type RuntimeConsumptionState =
  | "publishable"
  | "quarantined"
  | "revoked"
  | "superseded"
  | "blocked";

export type BuildGateState = "passed" | "blocked" | "quarantined";
export type PublishDecisionState =
  | "approved"
  | "quarantined"
  | "revoked"
  | "superseded"
  | "blocked";

export interface BuildArtifactDescriptor {
  artifactId: string;
  artifactKind: string;
  artifactDigest: string;
  artifactRoots: readonly string[];
}

export interface BuildGateEvidenceRecord {
  gateEvidenceRef: string;
  gateRef: string;
  gateLabel: string;
  state: BuildGateState;
  evidenceDigest: string;
}

export interface DependencyPolicyVerdictRecord {
  dependencyPolicyVerdictId: string;
  policyRef: string;
  decisionState: "passed" | "blocked";
  blockedReasonRefs: readonly string[];
  watchlistHash: string;
  evaluatedAt: string;
}

export interface ArtifactQuarantineRule {
  ruleRef: string;
  triggerRef: string;
  artifactState: ProvenanceArtifactState;
  runtimeConsumptionState: RuntimeConsumptionState;
  publishDecisionState: PublishDecisionState;
  supersessionAllowed: boolean;
  operatorAction: string;
}

export interface UnsignedBuildProvenanceRecord {
  buildProvenanceRecordId: string;
  buildFamilyRef: string;
  releaseRef: string;
  verificationScenarioRef: string;
  environmentRing: string;
  runtimeTopologyManifestRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  artifactDigests: readonly BuildArtifactDescriptor[];
  artifactSetDigest: string;
  sbomDigest: string;
  sbomRef: string;
  dependencyPolicyVerdictRef: string;
  gateEvidenceRefs: readonly string[];
  signingSecretClassRef: string;
  provenanceState: BuildProvenanceState;
  runtimeConsumptionState: RuntimeConsumptionState;
  artifactState: ProvenanceArtifactState;
  quarantineReasonRefs: readonly string[];
  revokedAt: string | null;
  revocationReasonRef: string | null;
  supersededByBuildProvenanceRecordRef: string | null;
  signedAt: string;
}

export interface SignedBuildProvenanceRecord extends UnsignedBuildProvenanceRecord {
  signatureAlgorithm: "hmac-sha256-mock-safe-v1";
  canonicalDigest: string;
  signature: string;
}

export interface BuildProvenanceVerificationResult {
  verified: boolean;
  canonicalDigest: string;
  issues: readonly { code: string; message: string }[];
  artifactState: ProvenanceArtifactState;
  runtimeConsumptionState: RuntimeConsumptionState;
}

export interface ArtifactPublishDecision {
  decisionState: PublishDecisionState;
  artifactState: ProvenanceArtifactState;
  runtimeConsumptionState: RuntimeConsumptionState;
  blockerRefs: readonly string[];
  quarantineRuleRef: string | null;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function fnv64(value: string, seed: bigint): string {
  let hash = seed;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = (hash * 1099511628211n) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, "0");
}

export function stableDigest(value: unknown): string {
  const encoded = stableStringify(value);
  return [
    fnv64(encoded, 1469598103934665603n),
    fnv64(`${encoded}::vecells`, 1099511628211n),
    fnv64(encoded.split("").reverse().join(""), 7809847782465536322n),
    fnv64(`sig::${encoded.length}`, 11400714785074694791n),
  ].join("");
}

function createMockSignature(signingKey: string, canonicalDigest: string): string {
  return stableDigest({
    signingKey,
    canonicalDigest,
    purpose: "vecells-build-provenance",
  });
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

function toUnsignedBuildProvenanceRecord(
  record: UnsignedBuildProvenanceRecord | SignedBuildProvenanceRecord,
): UnsignedBuildProvenanceRecord {
  return {
    buildProvenanceRecordId: record.buildProvenanceRecordId,
    buildFamilyRef: record.buildFamilyRef,
    releaseRef: record.releaseRef,
    verificationScenarioRef: record.verificationScenarioRef,
    environmentRing: record.environmentRing,
    runtimeTopologyManifestRef: record.runtimeTopologyManifestRef,
    runtimePublicationBundleRef: record.runtimePublicationBundleRef,
    releasePublicationParityRef: record.releasePublicationParityRef,
    artifactDigests: record.artifactDigests,
    artifactSetDigest: record.artifactSetDigest,
    sbomDigest: record.sbomDigest,
    sbomRef: record.sbomRef,
    dependencyPolicyVerdictRef: record.dependencyPolicyVerdictRef,
    gateEvidenceRefs: record.gateEvidenceRefs,
    signingSecretClassRef: record.signingSecretClassRef,
    provenanceState: record.provenanceState,
    runtimeConsumptionState: record.runtimeConsumptionState,
    artifactState: record.artifactState,
    quarantineReasonRefs: record.quarantineReasonRefs,
    revokedAt: record.revokedAt,
    revocationReasonRef: record.revocationReasonRef,
    supersededByBuildProvenanceRecordRef: record.supersededByBuildProvenanceRecordRef,
    signedAt: record.signedAt,
  };
}

export function signBuildProvenanceRecord(input: {
  record: UnsignedBuildProvenanceRecord | SignedBuildProvenanceRecord;
  signingKey: string;
}): SignedBuildProvenanceRecord {
  const unsignedRecord = toUnsignedBuildProvenanceRecord(input.record);
  const canonicalDigest = stableDigest(unsignedRecord);
  const signature = createMockSignature(input.signingKey, canonicalDigest);
  return {
    ...unsignedRecord,
    signatureAlgorithm: "hmac-sha256-mock-safe-v1",
    canonicalDigest,
    signature,
  };
}

export function verifyBuildProvenanceRecord(input: {
  record: SignedBuildProvenanceRecord;
  signingKey: string;
  dependencyPolicyVerdict: DependencyPolicyVerdictRecord;
  gateEvidence: readonly BuildGateEvidenceRecord[];
}): BuildProvenanceVerificationResult {
  const unsignedRecord = toUnsignedBuildProvenanceRecord(input.record);
  const canonicalDigest = stableDigest(unsignedRecord);
  const expectedSignature = createMockSignature(input.signingKey, canonicalDigest);
  const issues: { code: string; message: string }[] = [];

  if (input.record.canonicalDigest !== canonicalDigest) {
    issues.push({
      code: "CANONICAL_DIGEST_DRIFT",
      message: "Canonical digest drifted from the unsigned record.",
    });
  }

  if (!timingSafeCompare(expectedSignature, input.record.signature)) {
    issues.push({
      code: "SIGNATURE_MISMATCH",
      message: "Build provenance signature verification failed.",
    });
  }

  if (input.dependencyPolicyVerdict.decisionState !== "passed") {
    issues.push({
      code: "DEPENDENCY_POLICY_BLOCKED",
      message: "Dependency policy verdict is not passed.",
    });
  }

  if (input.gateEvidence.some((row) => row.state !== "passed")) {
    issues.push({
      code: "PIPELINE_GATE_BLOCKED",
      message: "One or more pipeline gates are not passed.",
    });
  }

  if (input.record.artifactState === "revoked" || input.record.provenanceState === "revoked") {
    issues.push({
      code: "PROVENANCE_REVOKED",
      message: "The build provenance record has been revoked.",
    });
  }

  if (
    input.record.artifactState === "superseded" ||
    input.record.provenanceState === "superseded"
  ) {
    issues.push({
      code: "PROVENANCE_SUPERSEDED",
      message: "The build provenance record has been superseded.",
    });
  }

  if (
    input.record.artifactState === "blocked" ||
    input.record.provenanceState === "drifted" ||
    input.record.runtimeConsumptionState === "blocked"
  ) {
    issues.push({
      code: "SCHEMA_SET_DRIFT",
      message: "The build provenance record is blocked by drift or blocked runtime posture.",
    });
  }

  let artifactState: ProvenanceArtifactState = input.record.artifactState;
  let runtimeConsumptionState: RuntimeConsumptionState = input.record.runtimeConsumptionState;

  if (issues.some((issue) => issue.code === "SIGNATURE_MISMATCH")) {
    artifactState = "quarantined";
    runtimeConsumptionState = "quarantined";
  } else if (issues.some((issue) => issue.code === "DEPENDENCY_POLICY_BLOCKED")) {
    artifactState = "quarantined";
    runtimeConsumptionState = "quarantined";
  } else if (issues.some((issue) => issue.code === "PROVENANCE_REVOKED")) {
    artifactState = "revoked";
    runtimeConsumptionState = "revoked";
  } else if (issues.some((issue) => issue.code === "PROVENANCE_SUPERSEDED")) {
    artifactState = "superseded";
    runtimeConsumptionState = "superseded";
  } else if (issues.some((issue) => issue.code === "SCHEMA_SET_DRIFT")) {
    artifactState = "blocked";
    runtimeConsumptionState = "blocked";
  }

  return {
    verified: issues.length === 0,
    canonicalDigest,
    issues,
    artifactState,
    runtimeConsumptionState,
  };
}

export function evaluateArtifactPublication(input: {
  verification: BuildProvenanceVerificationResult;
  quarantineRules: readonly ArtifactQuarantineRule[];
}): ArtifactPublishDecision {
  if (input.verification.verified) {
    return {
      decisionState: "approved",
      artifactState: "publishable",
      runtimeConsumptionState: "publishable",
      blockerRefs: [],
      quarantineRuleRef: null,
    };
  }

  const issueCode = input.verification.issues[0]?.code ?? "PIPELINE_GATE_BLOCKED";
  const matchedRule = input.quarantineRules.find((rule) => rule.triggerRef === issueCode);
  if (!matchedRule) {
    return {
      decisionState: "blocked",
      artifactState: input.verification.artifactState,
      runtimeConsumptionState: input.verification.runtimeConsumptionState,
      blockerRefs: input.verification.issues.map((issue) => issue.code),
      quarantineRuleRef: null,
    };
  }

  return {
    decisionState: matchedRule.publishDecisionState,
    artifactState: matchedRule.artifactState,
    runtimeConsumptionState: matchedRule.runtimeConsumptionState,
    blockerRefs: input.verification.issues.map((issue) => issue.code),
    quarantineRuleRef: matchedRule.ruleRef,
  };
}

export function revokeBuildProvenanceRecord(input: {
  record: SignedBuildProvenanceRecord;
  reasonRef: string;
  revokedAt: string;
}): SignedBuildProvenanceRecord {
  return {
    ...input.record,
    artifactState: "revoked",
    provenanceState: "revoked",
    runtimeConsumptionState: "revoked",
    revokedAt: input.revokedAt,
    revocationReasonRef: input.reasonRef,
    quarantineReasonRefs: Array.from(
      new Set([...input.record.quarantineReasonRefs, input.reasonRef]),
    ),
  };
}

export function supersedeBuildProvenanceRecord(input: {
  record: SignedBuildProvenanceRecord;
  supersededByBuildProvenanceRecordRef: string;
}): SignedBuildProvenanceRecord {
  return {
    ...input.record,
    artifactState: "superseded",
    provenanceState: "superseded",
    runtimeConsumptionState: "superseded",
    supersededByBuildProvenanceRecordRef: input.supersededByBuildProvenanceRecordRef,
    quarantineReasonRefs: Array.from(
      new Set([...input.record.quarantineReasonRefs, "PROVENANCE_SUPERSEDED"]),
    ),
  };
}

export function createBuildProvenanceSimulationHarness() {
  const dependencyPolicyVerdict: DependencyPolicyVerdictRecord = {
    dependencyPolicyVerdictId: "dep-policy::simulated",
    policyRef: "dependency_policy_091_foundation_v1",
    decisionState: "passed",
    blockedReasonRefs: [],
    watchlistHash: stableDigest({ watchlist: "current" }),
    evaluatedAt: "2026-04-12T00:00:00+00:00",
  };
  const gateEvidence: BuildGateEvidenceRecord[] = [
    {
      gateEvidenceRef: "gate::build",
      gateRef: "build_package",
      gateLabel: "Deterministic build package",
      state: "passed",
      evidenceDigest: stableDigest({ gate: "build_package", state: "passed" }),
    },
    {
      gateEvidenceRef: "gate::verify",
      gateRef: "provenance_verify",
      gateLabel: "Provenance verify",
      state: "passed",
      evidenceDigest: stableDigest({ gate: "provenance_verify", state: "passed" }),
    },
  ];
  const record = signBuildProvenanceRecord({
    signingKey: "mock-safe-provenance-key",
    record: {
      buildProvenanceRecordId: "bpr::simulated",
      buildFamilyRef: "bf_release_control_bundle",
      releaseRef: "RC_CI_PREVIEW_V1",
      verificationScenarioRef: "VS_058_CI_PREVIEW_V1",
      environmentRing: "ci-preview",
      runtimeTopologyManifestRef: "data/analysis/runtime_topology_manifest.json",
      runtimePublicationBundleRef: "RPB_CI_PREVIEW_V1",
      releasePublicationParityRef: "parity::rc_ci_preview_v1",
      artifactDigests: [
        {
          artifactId: "bf_release_control_bundle::bundle",
          artifactKind: "control_plane_manifest",
          artifactDigest: stableDigest("bf_release_control_bundle"),
          artifactRoots: ["packages/release-controls", ".github/workflows"],
        },
      ],
      artifactSetDigest: stableDigest("bf_release_control_bundle::artifact-set"),
      sbomDigest: stableDigest("bf_release_control_bundle::sbom"),
      sbomRef: "sbom::simulated",
      dependencyPolicyVerdictRef: dependencyPolicyVerdict.dependencyPolicyVerdictId,
      gateEvidenceRefs: gateEvidence.map((row) => row.gateEvidenceRef),
      signingSecretClassRef: "RELEASE_PROVENANCE_SIGNING_KEY_REF",
      provenanceState: "verified",
      runtimeConsumptionState: "publishable",
      artifactState: "publishable",
      quarantineReasonRefs: [],
      revokedAt: null,
      revocationReasonRef: null,
      supersededByBuildProvenanceRecordRef: null,
      signedAt: "2026-04-12T00:00:00+00:00",
    },
  });
  const quarantineRules: ArtifactQuarantineRule[] = [
    {
      ruleRef: "qr_signature_invalid",
      triggerRef: "SIGNATURE_MISMATCH",
      artifactState: "quarantined",
      runtimeConsumptionState: "quarantined",
      publishDecisionState: "quarantined",
      supersessionAllowed: false,
      operatorAction: "quarantine_and_rebuild",
    },
  ];
  const verification = verifyBuildProvenanceRecord({
    record,
    signingKey: "mock-safe-provenance-key",
    dependencyPolicyVerdict,
    gateEvidence,
  });
  return {
    record,
    verification,
    publishDecision: evaluateArtifactPublication({ verification, quarantineRules }),
  };
}
