import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  FileSecretStoreBackend,
  bootstrapSecretStore,
  loadSecretClassManifest,
  type EnvironmentRing,
} from "../../packages/runtime-secrets/src/index.ts";
import {
  stableDigest,
  type BuildArtifactDescriptor,
  type BuildGateEvidenceRecord,
  type DependencyPolicyVerdictRecord,
} from "../../packages/release-controls/src/build-provenance.ts";
import {
  applySupplyChainVerificationResult,
  createAttestationEnvelopeId,
  createRuntimeBindingProof,
  issueSupplyChainAttestation,
  signSupplyChainProvenanceRecord,
  verifySupplyChainProvenance,
  type SupplyChainAttestationEnvelope,
  type SupplyChainBaseImageDigest,
  type SupplyChainMaterialInputDescriptor,
  type SupplyChainProvenanceRecord,
  type SupplyChainRuntimeBindingProof,
  type SupplyChainToolchainDigest,
  type SupplyChainVerificationResult,
  type SupplyChainSourceTreeState,
  type UnsignedSupplyChainProvenanceRecord,
} from "../../packages/release-controls/src/supply-chain-provenance.ts";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

export interface CliArgs {
  [key: string]: string;
}

export interface BuildParameterEnvelope {
  envelopeId: string;
  buildFamilyRef: string;
  environmentRing: EnvironmentRing;
  releaseRef: string;
  verificationScenarioRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  buildSystemRef: string;
  builderIdentityRef: string;
  sourceCommitRef: string;
  sourceTreeState: SupplyChainSourceTreeState;
  artifactRootRefs: readonly string[];
  featureToggleRefs: readonly string[];
  compileTimePartitionRefs: readonly string[];
  schemaGenerationSwitchRefs: readonly string[];
  watchlistHash: string;
  digest: string;
}

export interface RehearsalOutputs {
  record: SupplyChainProvenanceRecord;
  gateEvidence: BuildGateEvidenceRecord[];
  dependencyPolicyVerdict: DependencyPolicyVerdictRecord;
  verification: SupplyChainVerificationResult;
  artifactDigests: BuildArtifactDescriptor[];
  sbom: Record<string, unknown>;
  buildParameterEnvelope: BuildParameterEnvelope;
  runtimeBindingProof: SupplyChainRuntimeBindingProof;
  materialInputs: SupplyChainMaterialInputDescriptor[];
  attestations: SupplyChainAttestationEnvelope[];
}

interface BuildFamilyManifestRow {
  buildFamilyRef: string;
  artifactRoots: string[];
  surfaceRefs?: string[];
  runtimePublicationBundleRef?: string;
}

interface VerificationScenarioRow {
  ringCode: string;
  verificationScenarioId: string;
  releaseRef: string;
  runtimePublicationBundleRef: string;
}

interface RuntimePublicationBundleRow {
  runtimePublicationBundleId: string;
  environmentRing: string;
  runtimeTopologyManifestRef: string;
  workloadFamilyRefs: string[];
  trustZoneBoundaryRefs: string[];
  gatewaySurfaceRefs: string[];
  frontendContractManifestRefs: string[];
  routeContractDigestRefs: string[];
  designContractPublicationBundleRefs: string[];
  designContractDigestRefs: string[];
  projectionCompatibilityDigestRefs: string[];
  bundleTupleHash: string;
}

interface ReleasePublicationParityRecordRow {
  publicationParityRecordId: string;
  environmentRing: string;
  runtimePublicationBundleRef: string;
  releaseRef: string;
  routeContractDigestRefs: string[];
  frontendContractDigestRefs: string[];
  surfacePublicationRefs: string[];
  surfaceRuntimeBindingRefs: string[];
  parityState: string;
  bundleTupleHash: string;
}

interface RuntimeTopologyManifest {
  runtime_workload_families: Array<{
    runtime_workload_family_ref: string;
    gateway_surface_refs: string[];
    allowed_downstream_family_refs: string[];
  }>;
  trust_zone_boundaries: Array<{
    boundary_id: string;
    source_workload_family_refs: string[];
    target_workload_family_refs: string[];
  }>;
  manifest_tuple_hash: string;
}

interface GatewaySurfaceManifest {
  gateway_surfaces: Array<{
    surfaceId: string;
    allowedDownstreamWorkloadFamilyRefs: string[];
    trustZoneBoundaryRefs: string[];
  }>;
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index];
    if (!key) {
      continue;
    }
    args[key] = argv[index + 1] ?? "true";
  }
  return args;
}

export function readJson<TValue>(filePath: string): TValue {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as TValue;
}

export function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function ensureSecretState(environmentRing: EnvironmentRing, stateDir: string): string {
  const masterKeyBase64 = Buffer.alloc(32, environmentRing.length + 17).toString("base64");
  bootstrapSecretStore({
    environmentRing,
    stateDir,
    masterKeyBase64,
  });
  return path.join(stateDir, "master-key.json");
}

export function loadSigningKey(environmentRing: EnvironmentRing, stateDir: string): string {
  const masterKeyPath = ensureSecretState(environmentRing, stateDir);
  const backend = new FileSecretStoreBackend({
    environmentRing,
    env: {
      VECELLS_SECRET_STATE_DIR: stateDir,
      VECELLS_KMS_MASTER_KEY_PATH: masterKeyPath,
    },
  });
  return backend.loadSecret({
    secretClassRef: "RELEASE_PROVENANCE_SIGNING_KEY_REF",
    actorRef: "ci_release_attestation",
  }).value;
}

function listFiles(rootPath: string): string[] {
  const entries: string[] = [];
  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) {
      continue;
    }
    const stat = fs.statSync(current);
    if (stat.isFile()) {
      entries.push(current);
      continue;
    }
    if (stat.isDirectory()) {
      const names = fs.readdirSync(current).filter((name) => !name.startsWith(".tmp"));
      names
        .sort()
        .reverse()
        .forEach((name) => stack.push(path.join(current, name)));
    }
  }
  return entries
    .filter(
      (filePath) =>
        /\.(ts|tsx|js|mjs|json|yaml|yml|md|sql|css|html|csv)$/i.test(filePath) ||
        /package\.json$/.test(filePath) ||
        /pnpm-lock\.yaml$/.test(filePath),
    )
    .sort();
}

export function collectArtifactDigests(buildFamilyRef: string, roots: readonly string[]) {
  const artifactId = `${buildFamilyRef}::bundle`;
  const fileDigests = roots.flatMap((relativeRoot) => {
    const absoluteRoot = path.join(ROOT, relativeRoot);
    return listFiles(absoluteRoot).map((filePath) => {
      const relativePath = path.relative(ROOT, filePath);
      const digest = stableDigest(fs.readFileSync(filePath, "utf8"));
      return { relativePath, digest };
    });
  });
  return {
    artifactDigests: [
      {
        artifactId,
        artifactKind: "workspace_bundle_manifest",
        artifactDigest: stableDigest(fileDigests),
        artifactRoots: roots,
      },
    ] satisfies BuildArtifactDescriptor[],
    fileDigests,
  };
}

function parsePackageJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}

export function generateSbom(buildFamilyRef: string, roots: readonly string[]) {
  const components: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  roots.forEach((relativeRoot) => {
    const packageJsonPath = path.join(ROOT, relativeRoot, "package.json");
    const maybePackage = parsePackageJson(packageJsonPath);
    if (!maybePackage?.name) {
      return;
    }
    if (!seen.has(maybePackage.name)) {
      seen.add(maybePackage.name);
      components.push({
        type: "application",
        name: maybePackage.name,
        version: maybePackage.version ?? "0.0.0",
        scope: "required",
      });
    }
    const dependencies = {
      ...(maybePackage.dependencies ?? {}),
      ...(maybePackage.devDependencies ?? {}),
    };
    Object.entries(dependencies)
      .sort(([left], [right]) => left.localeCompare(right))
      .forEach(([name, version]) => {
        const dependencyKey = `${name}@${version}`;
        if (seen.has(dependencyKey)) {
          return;
        }
        seen.add(dependencyKey);
        components.push({
          type: name.startsWith("@vecells/") ? "framework" : "library",
          name,
          version,
          scope: name.startsWith("@vecells/") ? "required" : "optional",
        });
      });
  });
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber: `urn:vecells:${buildFamilyRef}:${stableDigest(components)}`,
    metadata: {
      component: {
        type: "application",
        name: buildFamilyRef,
        version: "0.0.0",
      },
      properties: [
        {
          name: "vecells.sbom.format_resolution",
          value: "GAP_RESOLUTION_PROVENANCE_FORMAT_CYCLONEDX_JSON_V1",
        },
      ],
    },
    components,
  };
}

export function evaluateDependencyPolicy(): DependencyPolicyVerdictRecord {
  const policy = readJson<{
    policyId: string;
    requiredRootPackageManager: string;
    requiredLockfilePath: string;
    requiredWorkspaceInternalSpecifier: string;
    watchlistHash: string;
  }>(path.join(ROOT, "infra", "build-provenance", "local", "dependency-policy.json"));
  const rootPackage = readJson<{ packageManager?: string }>(path.join(ROOT, "package.json"));
  const lockfileExists = fs.existsSync(path.join(ROOT, policy.requiredLockfilePath));
  const blockedReasonRefs: string[] = [];
  if (rootPackage.packageManager !== policy.requiredRootPackageManager) {
    blockedReasonRefs.push("ROOT_PACKAGE_MANAGER_DRIFT");
  }
  if (!lockfileExists) {
    blockedReasonRefs.push("LOCKFILE_MISSING");
  }
  const secretManifest = loadSecretClassManifest(ROOT);
  if (
    !secretManifest.secret_classes.some(
      (row) => row.secret_class_ref === "RELEASE_PROVENANCE_SIGNING_KEY_REF",
    )
  ) {
    blockedReasonRefs.push("CI_SIGNING_SECRET_CLASS_MISSING");
  }
  return {
    dependencyPolicyVerdictId: "dep-policy::runtime",
    policyRef: policy.policyId,
    decisionState: blockedReasonRefs.length === 0 ? "passed" : "blocked",
    blockedReasonRefs,
    watchlistHash: policy.watchlistHash,
    evaluatedAt: new Date().toISOString(),
  };
}

export function createGateEvidence(
  runId: string,
  failedGateRef?: string,
): BuildGateEvidenceRecord[] {
  const gates = readJson<{ gateDefinitions: Array<{ gateRef: string; label: string }> }>(
    path.join(ROOT, "data", "analysis", "build_provenance_manifest.json"),
  ).gateDefinitions;
  return gates.map((gate) => {
    const state = failedGateRef && gate.gateRef === failedGateRef ? "blocked" : "passed";
    return {
      gateEvidenceRef: `gate-evidence::${runId}::${gate.gateRef}`,
      gateRef: gate.gateRef,
      gateLabel: gate.label,
      state,
      evidenceDigest: stableDigest({ runId, gate: gate.gateRef, state }),
    } satisfies BuildGateEvidenceRecord;
  });
}

function resolveSourceCommitRef(): string {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown-commit";
  }
}

function loadBuildFamily(buildFamilyRef: string): BuildFamilyManifestRow {
  const manifest = readJson<{ buildFamilies: BuildFamilyManifestRow[] }>(
    path.join(ROOT, "data", "analysis", "build_provenance_manifest.json"),
  );
  const family = manifest.buildFamilies.find((row) => row.buildFamilyRef === buildFamilyRef);
  if (!family) {
    throw new Error(`Unknown build family ${buildFamilyRef}.`);
  }
  return family;
}

function loadVerificationScenario(environmentRing: EnvironmentRing): VerificationScenarioRow {
  const manifest = readJson<{ verificationScenarios: VerificationScenarioRow[] }>(
    path.join(ROOT, "data", "analysis", "verification_scenarios.json"),
  );
  const scenario = manifest.verificationScenarios.find((row) => row.ringCode === environmentRing);
  if (!scenario) {
    throw new Error(`Missing verification scenario for ${environmentRing}.`);
  }
  return scenario;
}

function resolveBundle(environmentRing: EnvironmentRing): RuntimePublicationBundleRow {
  const bundles = readJson<{ runtimePublicationBundles: RuntimePublicationBundleRow[] }>(
    path.join(ROOT, "data", "analysis", "runtime_publication_bundles.json"),
  ).runtimePublicationBundles;
  const bundle = bundles.find((row) => row.environmentRing === environmentRing);
  if (!bundle) {
    throw new Error(`Missing runtime publication bundle for ${environmentRing}.`);
  }
  return bundle;
}

function resolveParity(environmentRing: EnvironmentRing): ReleasePublicationParityRecordRow {
  const records = readJson<{
    releasePublicationParityRecords: ReleasePublicationParityRecordRow[];
  }>(path.join(ROOT, "data", "analysis", "release_publication_parity_records.json"))
    .releasePublicationParityRecords;
  const record = records.find((row) => row.environmentRing === environmentRing);
  if (!record) {
    throw new Error(`Missing release publication parity record for ${environmentRing}.`);
  }
  return record;
}

function resolveBuildWorkloadFamilies(
  buildFamilyRef: string,
  bundle: RuntimePublicationBundleRow,
): string[] {
  const explicitMappings: Record<string, string[]> = {
    bf_foundation_monorepo_full: bundle.workloadFamilyRefs,
    bf_published_gateway_bundle: [
      "wf_public_edge_ingress",
      "wf_shell_delivery_published_gateway",
    ],
    bf_command_runtime_bundle: ["wf_command_orchestration"],
    bf_projection_runtime_bundle: ["wf_projection_read_models"],
    bf_notification_runtime_bundle: ["wf_integration_dispatch"],
    bf_adapter_simulator_bundle: ["wf_integration_simulation_lab"],
    bf_browser_contract_bundle: [
      "wf_shell_delivery_static_publication",
      "wf_shell_delivery_published_gateway",
    ],
    bf_release_control_bundle: bundle.workloadFamilyRefs,
  };
  return explicitMappings[buildFamilyRef] ?? bundle.workloadFamilyRefs;
}

function resolveTargetGatewaySurfaceRefs(input: {
  buildFamily: BuildFamilyManifestRow;
  bundle: RuntimePublicationBundleRow;
  workloadFamilyRefs: readonly string[];
}): string[] {
  if (input.buildFamily.surfaceRefs && input.buildFamily.surfaceRefs.length > 0) {
    return input.buildFamily.surfaceRefs
      .filter((surfaceId) => input.bundle.gatewaySurfaceRefs.includes(surfaceId))
      .sort();
  }
  if (
    input.buildFamily.buildFamilyRef === "bf_foundation_monorepo_full" ||
    input.buildFamily.buildFamilyRef === "bf_browser_contract_bundle" ||
    input.buildFamily.buildFamilyRef === "bf_release_control_bundle"
  ) {
    return [...input.bundle.gatewaySurfaceRefs].sort();
  }
  const gateway = readJson<GatewaySurfaceManifest>(
    path.join(ROOT, "data", "analysis", "gateway_surface_manifest.json"),
  );
  return gateway.gateway_surfaces
    .filter(
      (surface) =>
        input.bundle.gatewaySurfaceRefs.includes(surface.surfaceId) &&
        surface.allowedDownstreamWorkloadFamilyRefs.some((workloadFamilyRef) =>
          input.workloadFamilyRefs.includes(workloadFamilyRef),
        ),
    )
    .map((surface) => surface.surfaceId)
    .sort();
}

function resolveTargetTrustBoundaries(
  bundle: RuntimePublicationBundleRow,
  workloadFamilyRefs: readonly string[],
): string[] {
  const topology = readJson<RuntimeTopologyManifest>(
    path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json"),
  );
  const filtered = topology.trust_zone_boundaries
    .filter(
      (boundary) =>
        bundle.trustZoneBoundaryRefs.includes(boundary.boundary_id) &&
        (boundary.source_workload_family_refs.some((familyRef) =>
          workloadFamilyRefs.includes(familyRef),
        ) ||
          boundary.target_workload_family_refs.some((familyRef) =>
            workloadFamilyRefs.includes(familyRef),
          )),
    )
    .map((boundary) => boundary.boundary_id)
    .sort();
  return filtered.length > 0 ? filtered : [...bundle.trustZoneBoundaryRefs].sort();
}

function deriveSurfaceSchemaSetRef(bundle: RuntimePublicationBundleRow): string {
  return `surface-schema-set::${bundle.runtimePublicationBundleId}::${stableDigest({
    frontendContractManifestRefs: bundle.frontendContractManifestRefs,
    routeContractDigestRefs: bundle.routeContractDigestRefs,
    designContractPublicationBundleRefs: bundle.designContractPublicationBundleRefs,
  }).slice(0, 16)}`;
}

function buildRuntimeBindingProofForFamily(input: {
  buildFamilyRef: string;
  environmentRing: EnvironmentRing;
}) {
  const bundle = resolveBundle(input.environmentRing);
  const parity = resolveParity(input.environmentRing);
  const buildFamily = loadBuildFamily(input.buildFamilyRef);
  const workloadFamilyRefs = resolveBuildWorkloadFamilies(input.buildFamilyRef, bundle);
  const gatewaySurfaceRefs = resolveTargetGatewaySurfaceRefs({
    buildFamily,
    bundle,
    workloadFamilyRefs,
  });
  const trustZoneBoundaryRefs = resolveTargetTrustBoundaries(bundle, workloadFamilyRefs);
  const publicationBundleDigest = stableDigest({
    runtimePublicationBundleId: bundle.runtimePublicationBundleId,
    bundleTupleHash: bundle.bundleTupleHash,
    routeContractDigestRefs: bundle.routeContractDigestRefs,
    frontendContractManifestRefs: bundle.frontendContractManifestRefs,
    designContractDigestRefs: bundle.designContractDigestRefs,
    projectionCompatibilityDigestRefs: bundle.projectionCompatibilityDigestRefs,
  });
  const parityDigest = stableDigest({
    publicationParityRecordId: parity.publicationParityRecordId,
    bundleTupleHash: parity.bundleTupleHash,
    routeContractDigestRefs: parity.routeContractDigestRefs,
    frontendContractDigestRefs: parity.frontendContractDigestRefs,
    surfacePublicationRefs: parity.surfacePublicationRefs,
    surfaceRuntimeBindingRefs: parity.surfaceRuntimeBindingRefs,
    parityState: parity.parityState,
  });
  return {
    bundle,
    parity,
    buildFamily,
    workloadFamilyRefs,
    gatewaySurfaceRefs,
    trustZoneBoundaryRefs,
    runtimeBindingProof: createRuntimeBindingProof({
      runtimeTopologyManifestRef: bundle.runtimeTopologyManifestRef,
      runtimePublicationBundleRef: bundle.runtimePublicationBundleId,
      releasePublicationParityRef: parity.publicationParityRecordId,
      targetRuntimeManifestRefs: [bundle.runtimeTopologyManifestRef],
      targetSurfaceSchemaSetRef: deriveSurfaceSchemaSetRef(bundle),
      targetWorkloadFamilyRefs: workloadFamilyRefs,
      targetTrustZoneBoundaryRefs: trustZoneBoundaryRefs,
      targetGatewaySurfaceRefs: gatewaySurfaceRefs,
      targetTopologyTupleHash: readJson<RuntimeTopologyManifest>(
        path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json"),
      ).manifest_tuple_hash,
      bundleTupleHash: bundle.bundleTupleHash,
      publicationBundleDigest,
      parityDigest,
    }),
  };
}

function buildBaseImageDigests(
  buildFamilyRef: string,
  environmentRing: EnvironmentRing,
): SupplyChainBaseImageDigest[] {
  const defaults: SupplyChainBaseImageDigest[] = [
    {
      imageRef: "oci://node:24-bookworm",
      digest: stableDigest("oci://node:24-bookworm"),
      role: "workspace-build",
    },
    {
      imageRef: "oci://python:3.12-slim",
      digest: stableDigest("oci://python:3.12-slim"),
      role: "analysis-build",
    },
  ];
  if (buildFamilyRef === "bf_browser_contract_bundle" || environmentRing === "ci-preview") {
    defaults.push({
      imageRef: "oci://mcr.microsoft.com/playwright:v1.52.0-noble",
      digest: stableDigest("oci://mcr.microsoft.com/playwright:v1.52.0-noble"),
      role: "browser-contract-checks",
    });
  }
  return defaults;
}

function buildToolchainDigests(): SupplyChainToolchainDigest[] {
  return [
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
    {
      toolchainRef: "python",
      digest: stableDigest("python@3.12"),
      role: "analysis-runtime",
      version: "3.12.0",
    },
  ];
}

function buildMaterialInputs(input: {
  sourceCommitRef: string;
  baseImageDigests: readonly SupplyChainBaseImageDigest[];
  toolchainDigests: readonly SupplyChainToolchainDigest[];
  dependencyLockRefs: readonly string[];
  resolvedDependencySetRef: string;
  buildParameterEnvelopeRef: string;
  watchlistHash: string;
  runtimeBindingProof: SupplyChainRuntimeBindingProof;
}): SupplyChainMaterialInputDescriptor[] {
  return [
    {
      materialInputId: "mi::source-tree",
      materialType: "source_tree",
      ref: `git://${input.sourceCommitRef}`,
      digest: stableDigest(`git://${input.sourceCommitRef}`),
      required: true,
    },
    ...input.baseImageDigests.map((row) => ({
      materialInputId: `mi::base-image::${row.imageRef}`,
      materialType: "base_image" as const,
      ref: row.imageRef,
      digest: row.digest,
      required: true,
    })),
    ...input.toolchainDigests.map((row) => ({
      materialInputId: `mi::toolchain::${row.toolchainRef}`,
      materialType: "toolchain" as const,
      ref: row.toolchainRef,
      digest: row.digest,
      required: true,
    })),
    ...input.dependencyLockRefs.map((lockRef) => ({
      materialInputId: `mi::dependency-lock::${lockRef}`,
      materialType: "dependency_lock" as const,
      ref: lockRef,
      digest: stableDigest(lockRef),
      required: true,
    })),
    {
      materialInputId: "mi::resolved-dependency-set",
      materialType: "resolved_dependency_set",
      ref: input.resolvedDependencySetRef,
      digest: stableDigest(input.resolvedDependencySetRef),
      required: true,
    },
    {
      materialInputId: "mi::build-parameter-envelope",
      materialType: "build_parameter_envelope",
      ref: input.buildParameterEnvelopeRef,
      digest: stableDigest(input.buildParameterEnvelopeRef),
      required: true,
    },
    {
      materialInputId: "mi::policy-bundle",
      materialType: "policy_bundle",
      ref: "policy::dependency-watchlist",
      digest: stableDigest(input.watchlistHash),
      required: true,
    },
    {
      materialInputId: "mi::runtime-binding",
      materialType: "runtime_binding",
      ref: input.runtimeBindingProof.runtimePublicationBundleRef,
      digest: input.runtimeBindingProof.bindingDigest,
      required: true,
    },
  ];
}

function createBuildParameterEnvelope(input: {
  buildFamilyRef: string;
  environmentRing: EnvironmentRing;
  releaseRef: string;
  verificationScenarioRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  buildSystemRef: string;
  builderIdentityRef: string;
  sourceCommitRef: string;
  sourceTreeState: SupplyChainSourceTreeState;
  artifactRootRefs: readonly string[];
  watchlistHash: string;
}): BuildParameterEnvelope {
  const digest = stableDigest({
    buildFamilyRef: input.buildFamilyRef,
    environmentRing: input.environmentRing,
    releaseRef: input.releaseRef,
    verificationScenarioRef: input.verificationScenarioRef,
    runtimePublicationBundleRef: input.runtimePublicationBundleRef,
    releasePublicationParityRef: input.releasePublicationParityRef,
    buildSystemRef: input.buildSystemRef,
    builderIdentityRef: input.builderIdentityRef,
    sourceCommitRef: input.sourceCommitRef,
    sourceTreeState: input.sourceTreeState,
    artifactRootRefs: input.artifactRootRefs,
    featureToggleRefs: ["feature-toggle::foundation-defaults"],
    compileTimePartitionRefs: ["compile-partition::tenant-runtime-binding"],
    schemaGenerationSwitchRefs: ["schema-gen::strict-json-schema"],
    watchlistHash: input.watchlistHash,
  });
  return {
    envelopeId: `bpe::${input.buildFamilyRef}::${input.environmentRing}::${digest.slice(0, 16)}`,
    buildFamilyRef: input.buildFamilyRef,
    environmentRing: input.environmentRing,
    releaseRef: input.releaseRef,
    verificationScenarioRef: input.verificationScenarioRef,
    runtimePublicationBundleRef: input.runtimePublicationBundleRef,
    releasePublicationParityRef: input.releasePublicationParityRef,
    buildSystemRef: input.buildSystemRef,
    builderIdentityRef: input.builderIdentityRef,
    sourceCommitRef: input.sourceCommitRef,
    sourceTreeState: input.sourceTreeState,
    artifactRootRefs: [...input.artifactRootRefs],
    featureToggleRefs: ["feature-toggle::foundation-defaults"],
    compileTimePartitionRefs: ["compile-partition::tenant-runtime-binding"],
    schemaGenerationSwitchRefs: ["schema-gen::strict-json-schema"],
    watchlistHash: input.watchlistHash,
    digest,
  };
}

function buildUnsignedRecord(input: {
  buildFamilyRef: string;
  environmentRing: EnvironmentRing;
  sourceTreeState: SupplyChainSourceTreeState;
  sourceCommitRef: string;
  artifactDigests: readonly BuildArtifactDescriptor[];
  artifactSetDigest: string;
  sbomDigest: string;
  dependencyPolicyVerdict: DependencyPolicyVerdictRecord;
  runtimeBindingProof: SupplyChainRuntimeBindingProof;
  buildParameterEnvelope: BuildParameterEnvelope;
  materialInputs: readonly SupplyChainMaterialInputDescriptor[];
  baseImageDigests: readonly SupplyChainBaseImageDigest[];
  toolchainDigests: readonly SupplyChainToolchainDigest[];
  verificationScenario: VerificationScenarioRow;
  bundle: RuntimePublicationBundleRow;
  parity: ReleasePublicationParityRecordRow;
}): UnsignedSupplyChainProvenanceRecord {
  const signedAt = new Date().toISOString();
  const buildInvocationRef = `build-invocation::${input.buildFamilyRef}::${input.environmentRing}::${stableDigest({
    artifactSetDigest: input.artifactSetDigest,
    runtimePublicationBundleRef: input.bundle.runtimePublicationBundleId,
  }).slice(0, 16)}`;
  const provenanceId = `prov::${input.buildFamilyRef}::${input.environmentRing}::${stableDigest(
    [
      input.sourceCommitRef,
      input.bundle.runtimePublicationBundleId,
      input.artifactSetDigest,
      input.sbomDigest,
    ],
  ).slice(0, 16)}`;
  return {
    provenanceId,
    buildProvenanceRecordId: provenanceId,
    buildFamilyRef: input.buildFamilyRef,
    buildSystemRef: "ci://vecells-foundation-release-pipeline",
    builderIdentityRef: "actor://ci_release_attestation",
    buildInvocationRef,
    sourceTreeState: input.sourceTreeState,
    sourceCommitRef: input.sourceCommitRef,
    buildRecipeRef: `recipe::${input.buildFamilyRef}`,
    buildEnvironmentRef: `env::${input.environmentRing}::node24-pnpm10-python312`,
    ephemeralWorkerRef: `worker::${input.environmentRing}::${stableDigest(buildInvocationRef).slice(0, 12)}`,
    artifactDigests: input.artifactDigests,
    artifactSetDigest: input.artifactSetDigest,
    baseImageDigests: input.baseImageDigests,
    toolchainDigests: input.toolchainDigests,
    dependencyLockRefs: ["pnpm-lock.yaml"],
    resolvedDependencySetRef: `depset::${input.buildFamilyRef}::${input.environmentRing}::${input.sbomDigest.slice(0, 12)}`,
    buildParameterEnvelopeRef: input.buildParameterEnvelope.envelopeId,
    materialInputDigests: input.materialInputs,
    sbomRef: `sbom::${input.buildFamilyRef}::${input.environmentRing}`,
    sbomDigest: input.sbomDigest,
    targetRuntimeManifestRefs: input.runtimeBindingProof.targetRuntimeManifestRefs,
    targetSurfaceSchemaSetRef: input.runtimeBindingProof.targetSurfaceSchemaSetRef,
    targetWorkloadFamilyRefs: input.runtimeBindingProof.targetWorkloadFamilyRefs,
    targetTrustZoneBoundaryRefs: input.runtimeBindingProof.targetTrustZoneBoundaryRefs,
    targetGatewaySurfaceRefs: input.runtimeBindingProof.targetGatewaySurfaceRefs,
    targetTopologyTupleHash: input.runtimeBindingProof.targetTopologyTupleHash,
    runtimeBindingProof: input.runtimeBindingProof,
    reproducibilityClass: "replayable_with_attestation",
    rebuildChallengeEvidenceRef: `rebuild::${provenanceId}`,
    attestationEnvelopeRefs: [
      createAttestationEnvelopeId({
        provenanceId,
        attestationType: "build_provenance",
        buildInvocationRef,
      }),
      createAttestationEnvelopeId({
        provenanceId,
        attestationType: "runtime_binding",
        buildInvocationRef,
      }),
      createAttestationEnvelopeId({
        provenanceId,
        attestationType: "sbom_binding",
        buildInvocationRef,
      }),
    ],
    releaseRef: input.verificationScenario.releaseRef,
    verificationScenarioRef: input.verificationScenario.verificationScenarioId,
    environmentRing: input.environmentRing,
    runtimePublicationBundleRef: input.bundle.runtimePublicationBundleId,
    releasePublicationParityRef: input.parity.publicationParityRecordId,
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
}

export function buildRecord(input: {
  buildFamilyRef: string;
  environmentRing: EnvironmentRing;
  artifactRoots: readonly string[];
  outputDir: string;
  failedGateRef?: string;
  sourceTreeState?: SupplyChainSourceTreeState;
}): RehearsalOutputs {
  const signingKey = loadSigningKey(
    input.environmentRing,
    path.join(input.outputDir, "secret-store"),
  );
  const sourceCommitRef = resolveSourceCommitRef();
  const dependencyPolicyVerdict = evaluateDependencyPolicy();
  const gateEvidence = createGateEvidence(
    `${input.buildFamilyRef}:${input.environmentRing}`,
    input.failedGateRef,
  );
  const artifactBundle = collectArtifactDigests(input.buildFamilyRef, input.artifactRoots);
  const sbom = generateSbom(input.buildFamilyRef, input.artifactRoots);
  const sbomDigest = stableDigest(sbom);
  const runtimeContext = buildRuntimeBindingProofForFamily({
    buildFamilyRef: input.buildFamilyRef,
    environmentRing: input.environmentRing,
  });
  const baseImageDigests = buildBaseImageDigests(input.buildFamilyRef, input.environmentRing);
  const toolchainDigests = buildToolchainDigests();
  const buildParameterEnvelope = createBuildParameterEnvelope({
    buildFamilyRef: input.buildFamilyRef,
    environmentRing: input.environmentRing,
    releaseRef: runtimeContext.parity.releaseRef,
    verificationScenarioRef: loadVerificationScenario(input.environmentRing).verificationScenarioId,
    runtimePublicationBundleRef: runtimeContext.bundle.runtimePublicationBundleId,
    releasePublicationParityRef: runtimeContext.parity.publicationParityRecordId,
    buildSystemRef: "ci://vecells-foundation-release-pipeline",
    builderIdentityRef: "actor://ci_release_attestation",
    sourceCommitRef,
    sourceTreeState: input.sourceTreeState ?? "clean_commit",
    artifactRootRefs: input.artifactRoots,
    watchlistHash: dependencyPolicyVerdict.watchlistHash,
  });
  const materialInputs = buildMaterialInputs({
    sourceCommitRef,
    baseImageDigests,
    toolchainDigests,
    dependencyLockRefs: ["pnpm-lock.yaml"],
    resolvedDependencySetRef: `depset::${input.buildFamilyRef}::${input.environmentRing}::${sbomDigest.slice(0, 12)}`,
    buildParameterEnvelopeRef: buildParameterEnvelope.envelopeId,
    watchlistHash: dependencyPolicyVerdict.watchlistHash,
    runtimeBindingProof: runtimeContext.runtimeBindingProof,
  });
  const unsignedRecord = buildUnsignedRecord({
    buildFamilyRef: input.buildFamilyRef,
    environmentRing: input.environmentRing,
    sourceTreeState: input.sourceTreeState ?? "clean_commit",
    sourceCommitRef,
    artifactDigests: artifactBundle.artifactDigests,
    artifactSetDigest: stableDigest(artifactBundle.fileDigests),
    sbomDigest,
    dependencyPolicyVerdict,
    runtimeBindingProof: runtimeContext.runtimeBindingProof,
    buildParameterEnvelope,
    materialInputs,
    baseImageDigests,
    toolchainDigests,
    verificationScenario: loadVerificationScenario(input.environmentRing),
    bundle: runtimeContext.bundle,
    parity: runtimeContext.parity,
  });
  const provisionalRecord = signSupplyChainProvenanceRecord({
    record: unsignedRecord,
    signingKey,
  });
  const attestations = [
    issueSupplyChainAttestation({
      record: provisionalRecord,
      attestationType: "build_provenance",
      signingKey,
      attestedAt: provisionalRecord.signedAt,
    }),
    issueSupplyChainAttestation({
      record: provisionalRecord,
      attestationType: "runtime_binding",
      signingKey,
      attestedAt: provisionalRecord.signedAt,
    }),
    issueSupplyChainAttestation({
      record: provisionalRecord,
      attestationType: "sbom_binding",
      signingKey,
      attestedAt: provisionalRecord.signedAt,
    }),
  ];
  const verification = verifySupplyChainProvenance({
    record: provisionalRecord,
    signingKey,
    attestations,
    dependencyPolicyVerdict,
    gateEvidence,
    expectedRuntimeBinding: runtimeContext.runtimeBindingProof,
    expectedSbomDigest: sbomDigest,
    verifiedAt: provisionalRecord.signedAt,
    verifiedBy: "svc_release_supply_chain_verifier",
  });
  const finalizedRecord = applySupplyChainVerificationResult({
    record: provisionalRecord,
    verification,
    verifiedAt: provisionalRecord.signedAt,
    verifiedBy: "svc_release_supply_chain_verifier",
  });
  return {
    record: finalizedRecord,
    gateEvidence,
    dependencyPolicyVerdict,
    verification,
    artifactDigests: artifactBundle.artifactDigests,
    sbom,
    buildParameterEnvelope,
    runtimeBindingProof: runtimeContext.runtimeBindingProof,
    materialInputs,
    attestations,
  };
}

export function writeRehearsalOutputs(outputDir: string, outputs: RehearsalOutputs) {
  writeJson(path.join(outputDir, "build-provenance-record.json"), outputs.record);
  writeJson(path.join(outputDir, "gate-evidence.json"), outputs.gateEvidence);
  writeJson(
    path.join(outputDir, "dependency-policy-verdict.json"),
    outputs.dependencyPolicyVerdict,
  );
  writeJson(path.join(outputDir, "artifact-manifest.json"), outputs.artifactDigests);
  writeJson(path.join(outputDir, "sbom.cdx.json"), outputs.sbom);
  writeJson(path.join(outputDir, "attestation-envelopes.json"), outputs.attestations);
  writeJson(path.join(outputDir, "build-parameter-envelope.json"), outputs.buildParameterEnvelope);
  writeJson(path.join(outputDir, "runtime-binding-proof.json"), outputs.runtimeBindingProof);
  writeJson(path.join(outputDir, "material-inputs.json"), outputs.materialInputs);
  writeJson(path.join(outputDir, "verification-preview.json"), outputs.verification);
}
