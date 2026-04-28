import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const REVIEWED_ON = "2026-04-23";

const TASK_ID = "seq_345_phase6_open_parallel_pharmacy_tracks_gate";
const SHORT_TASK_ID = "seq_345";
const CONTRACT_VERSION = "345.phase6.parallel-gate.v1";
const VISUAL_MODE = "Phase6_Parallel_Tracks_Gate_Board";
const GATE_VERDICT = "wave_1_open_with_constraints";
const FIRST_WAVE_TRACK_IDS = ["par_346", "par_347"] as const;

type Readiness = "ready" | "blocked" | "deferred";
type Domain = "backend" | "frontend" | "ops" | "integration" | "testing";
type Wave = "wave_1" | "wave_2" | "wave_3" | "ops" | "integration" | "proof";
type ArtifactKind =
  | "object"
  | "projection"
  | "surface"
  | "service"
  | "workflow"
  | "proof_battery";

type FilterFamily =
  | "case"
  | "policy"
  | "directory"
  | "choice"
  | "package"
  | "dispatch"
  | "status"
  | "outcome"
  | "return"
  | "visibility"
  | "console"
  | "environment"
  | "integration"
  | "proof";

type TruthFamily =
  | "lineage"
  | "eligibility"
  | "choice_truth"
  | "package_truth"
  | "dispatch_truth"
  | "status_truth"
  | "outcome_truth"
  | "return_truth"
  | "visibility_truth"
  | "console_truth"
  | "environment_truth"
  | "integration_truth"
  | "proof_truth";

type AudienceFamily =
  | "patient"
  | "staff"
  | "practice"
  | "operations"
  | "pharmacy_console"
  | "integration"
  | "operator"
  | "release";

type ExternalSource = {
  sourceId: string;
  title: string;
  url: string;
  publisher: string;
  observedOn: string;
  borrowedInto: string[];
  rejectedOrConstrained: string[];
};

type Track = {
  trackId: string;
  seq: number;
  title: string;
  shortMission: string;
  domain: Domain;
  wave: Wave;
  readiness: Readiness;
  promptRef: string;
  ownedArtifacts: string[];
  nonOwnedArtifacts: string[];
  producedInterfaces: string[];
  dependsOnTracks: string[];
  dependsOnContracts: string[];
  readinessReason: string;
  unlockRule: string;
  mergeCriteria: string[];
  guardrails: string[];
  blockerRefs: string[];
  carryForwardRefs: string[];
  collisionSeamRefs: string[];
  launchPacketRef?: string;
  ownerFamily: FilterFamily;
  objectFamilies: FilterFamily[];
  truthFamilies: TruthFamily[];
  audienceFamilies: AudienceFamily[];
  expectedSurfaceRoots: string[];
  validationRefs: string[];
  testRefs: string[];
  currentGapIds: string[];
  expectedDownstreamDependents: string[];
};

type ArtifactEntry = {
  artifactId: string;
  kind: ArtifactKind;
  objectFamily: FilterFamily;
  truthFamily: TruthFamily;
  audienceFamilies: AudienceFamily[];
  canonicalOwnerTrack: string;
  consumerTracks: string[];
  authorityRefs: string[];
  notes: string;
};

type DependencyEdge = {
  interfaceId: string;
  producerTrack: string;
  consumerTrack: string;
  interfaceName: string;
  artifactRefs: string[];
  readinessStatus: "launch_ready" | "blocked_until_upstream" | "deferred";
  notes: string;
  seamRef?: string;
};

type InvalidationChain = {
  chainId: string;
  trigger: string;
  invalidates: string[];
  blockedOutcome: string;
  canonicalOwnerTracks: string[];
  proofLaw: string;
  refs: string[];
};

type GapEntry = {
  gapId: string;
  area: string;
  severity: "high" | "medium";
  status: "resolved_by_345" | "carried_forward" | "launch_blocked" | "launch_deferred";
  summary: string;
  tracksInvolved: string[];
  canonicalOwner: string;
  machineReadableRef?: string;
  blockerRefs: string[];
  carryForwardRefs: string[];
};

type LaunchPacket = {
  trackId: string;
  objective: string;
  authoritativeSourceSections: string[];
  objectOwnershipList: string[];
  inputContracts: string[];
  forbiddenShortcuts: string[];
  expectedFileOrModuleGlobs: string[];
  mandatoryTests: string[];
  expectedDownstreamDependents: string[];
  failClosedConditions: string[];
  currentGapsAndTemporarySeams: string[];
  hardMergeCriteria: string[];
};

type SeamFile = {
  fileName: string;
  payload: Record<string, unknown>;
};

function repoPath(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8")) as T;
}

function writeText(relativePath: string, content: string): void {
  const absolutePath = repoPath(relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${content.trimEnd()}\n`, "utf8");
}

function writeJson(relativePath: string, payload: unknown): void {
  writeText(relativePath, JSON.stringify(payload, null, 2));
}

function csvEscape(value: unknown): string {
  const text =
    value === undefined || value === null
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(relativePath: string, headers: string[], rows: Record<string, unknown>[]): void {
  const body = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  writeText(relativePath, body);
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
    if (value.length === 0) return `${prefix}[]`;
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
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return `${prefix}{}`;
    return entries
      .map(([key, entryValue]) => {
        if (Array.isArray(entryValue) || (typeof entryValue === "object" && entryValue !== null)) {
          return `${prefix}${key}:\n${toYaml(entryValue, indent + 2)}`;
        }
        return `${prefix}${key}: ${yamlScalar(entryValue)}`;
      })
      .join("\n");
  }
  return `${prefix}${yamlScalar(value)}`;
}

function markdownTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`);
  return [head, divider, ...body].join("\n");
}

function unique<T>(items: Iterable<T>): T[] {
  return Array.from(new Set(items));
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function embedJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function titleCaseFamily(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const blockerLedger = readJson<any[]>("data/analysis/341_phase5_blocker_ledger.json");
const carryForwardLedger = readJson<any[]>("data/analysis/341_phase5_carry_forward_ledger.json");
const phase6Handoff = readJson<any>("data/contracts/341_phase5_to_phase6_handoff_contract.json");
const caseStateMachine = readJson<any>("data/contracts/342_phase6_case_state_machine.yaml");
const apiSurface = readJson<any>("data/contracts/342_phase6_api_surface.yaml");
const eventRegistry342 = readJson<any>("data/contracts/342_phase6_event_registry.json");
const explanationBundleSchema = readJson<any>("data/contracts/342_phase6_explanation_bundle_schema.json");
const pathwayRegistry = readJson<any>("data/contracts/342_phase6_pathway_registry.json");
const thresholdRegistry = readJson<any>("data/contracts/342_phase6_threshold_family_registry.json");
const directoryChoiceContracts = readJson<any>("data/contracts/343_phase6_directory_choice_schema.json");
const dispatchContracts = readJson<any>("data/contracts/343_phase6_dispatch_schema.json");
const dispatchTruthSchema = readJson<any>("data/contracts/343_phase6_dispatch_truth_projection_schema.json");
const outcomeContracts = readJson<any>("data/contracts/343_phase6_outcome_reconciliation_schema.json");
const outcomeTruthSchema = readJson<any>("data/contracts/343_phase6_outcome_truth_projection_schema.json");
const bounceBackContracts = readJson<any>("data/contracts/344_phase6_bounce_back_schema.json");
const patientStatusContracts = readJson<any>("data/contracts/344_phase6_patient_status_schema.json");
const practiceVisibilityContracts = readJson<any>("data/contracts/344_phase6_practice_visibility_schema.json");
const projectionRegistry344 = readJson<any>("data/contracts/344_phase6_projection_registry.json");

const externalSources: ExternalSource[] = [
  {
    sourceId: "playwright_trace_viewer",
    title: "Trace viewer | Playwright",
    url: "https://playwright.dev/docs/trace-viewer-intro",
    publisher: "Playwright",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "The 345 gate board proof keeps trace capture as a first-class operator artifact for skeptical release review.",
    ],
    rejectedOrConstrained: [
      "Trace availability was not treated as sufficient launch proof by itself; the board still depends on typed readiness rows, seam files, and launch packets.",
    ],
  },
  {
    sourceId: "playwright_aria_snapshots",
    title: "ARIA snapshots | Playwright",
    url: "https://playwright.dev/docs/aria-snapshots",
    publisher: "Playwright",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "The board proof keeps accessibility assertions machine-auditable instead of relying on screenshots only.",
    ],
    rejectedOrConstrained: [
      "ARIA snapshot support did not replace explicit keyboard-navigation and parity-table checks for the gate board.",
    ],
  },
  {
    sourceId: "playwright_accessibility",
    title: "Accessibility testing | Playwright",
    url: "https://playwright.dev/docs/accessibility-testing",
    publisher: "Playwright",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "345 treats keyboard order, deterministic test ids, and same-screen accessibility as launch-gate proof rather than optional polish.",
    ],
    rejectedOrConstrained: [
      "Generic accessibility guidance was not allowed to soften the local requirement for adjacent table parity and reduced-motion support on the gate board.",
    ],
  },
  {
    sourceId: "playwright_emulation",
    title: "Emulation | Playwright",
    url: "https://playwright.dev/docs/emulation",
    publisher: "Playwright",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "The gate proof explicitly includes reduced-motion and narrow-screen behavior as part of readiness evidence.",
    ],
    rejectedOrConstrained: [
      "Device emulation guidance did not justify claiming wider frontend readiness for tracks that still lack executable pharmacy UI surfaces.",
    ],
  },
  {
    sourceId: "nhs_minor_illness_referral",
    title: "Referring lower acuity minor illness patients for a Pharmacy First consultation with a community pharmacist",
    url: "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/",
    publisher: "NHS England",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "Readiness notes for 347 keep the first-production pathway set aligned with current NHS referral context and community-pharmacy routing language.",
    ],
    rejectedOrConstrained: [
      "The NHS service page did not override the locally frozen pathway precedence, thresholds, or fallback law from 342.",
    ],
  },
  {
    sourceId: "nhs_pharmacy_first_service_spec",
    title: "Community Pharmacy advanced service specification: NHS Pharmacy First service",
    url: "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/",
    publisher: "NHS England",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "The launch packet for 347 references the current seven-condition production set as a support check on pathway terminology and service-lane naming.",
    ],
    rejectedOrConstrained: [
      "The service specification did not replace the repository's frozen contracts for immutable pack structure or deterministic evaluation formulas.",
    ],
  },
  {
    sourceId: "gp_connect_update_record_service",
    title: "GP Connect Update Record",
    url: "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
    publisher: "NHS England Digital",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "Track 367 remains deferred because Update Record onboarding and transport readiness stay environment-governed and business-hour constrained rather than repo-local facts.",
    ],
    rejectedOrConstrained: [
      "Availability of Update Record in production and limited supported services was not interpreted as permission for Vecells to send arbitrary outbound pharmacy updates.",
    ],
  },
  {
    sourceId: "gp_connect_update_record_api",
    title: "GP Connect Update Record API",
    url: "https://digital.nhs.uk/developer/api-catalogue/gp-connect-update-record",
    publisher: "NHS England Digital",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "The deferred status for 367 keeps secure-transport and supported-environment assumptions explicit instead of overclaiming live-ready observation proof.",
    ],
    rejectedOrConstrained: [
      "Developer API framing did not override the local distinction between outcome observation, urgent return, and other direct professional communication channels.",
    ],
  },
  {
    sourceId: "nhs_table_component",
    title: "Table",
    url: "https://service-manual.nhs.uk/design-system/components/table",
    publisher: "NHS digital service manual",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "The gate board uses dense but scannable table structure for parity views, evidence rows, and gap rows.",
    ],
    rejectedOrConstrained: [
      "Generic table guidance did not override the prompt's premium three-column operational layout or the need for adjacent graph/list parity.",
    ],
  },
  {
    sourceId: "nhs_summary_list_component",
    title: "Summary list",
    url: "https://service-manual.nhs.uk/design-system/components/summary-list",
    publisher: "NHS digital service manual",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "Inspector content is grouped as compact labeled rows so launch-packet facts remain reviewable without prose hunting.",
    ],
    rejectedOrConstrained: [
      "The summary-list pattern was not used as a justification for collapsing dependency or gap evidence into static prose blocks.",
    ],
  },
  {
    sourceId: "nhs_details_component",
    title: "Details",
    url: "https://service-manual.nhs.uk/design-system/components/details",
    publisher: "NHS digital service manual",
    observedOn: REVIEWED_ON,
    borrowedInto: [
      "The board keeps lower-priority explanatory notes collapsible while preserving critical launch criteria and blockers in the default view.",
    ],
    rejectedOrConstrained: [
      "The details component was not allowed to hide readiness reasons, blockers, or launch-packet essentials behind closed accordions by default.",
    ],
  },
];

const tracks: Track[] = [
  {
    trackId: "par_346",
    seq: 346,
    title: "Pharmacy case state machine and lineage linkage",
    shortMission:
      "Implement the canonical pharmacy case kernel, lineage child link, fencing, stale-owner recovery, and governed lifecycle commands.",
    domain: "backend",
    wave: "wave_1",
    readiness: "ready",
    promptRef: "prompt/346.md",
    ownedArtifacts: ["PharmacyCase", "LineageCaseLink(caseFamily = pharmacy)"],
    nonOwnedArtifacts: [
      "ServiceTypeDecision",
      "PathwayEligibilityEvaluation",
      "PharmacyChoiceSession",
      "PharmacyDispatchPlan",
      "PharmacyOutcomeTruthProjection",
      "PharmacyBounceBackRecord",
    ],
    producedInterfaces: [
      "PharmacyCaseKernel",
      "PharmacyCaseTransitionGuard",
      "PharmacyLineageLinkMaterializer",
      "PharmacyMutationAuthorityVerifier",
    ],
    dependsOnTracks: [],
    dependsOnContracts: [
      "data/contracts/341_phase5_to_phase6_handoff_contract.json",
      "data/contracts/342_phase6_pharmacy_case_schema.json",
      "data/contracts/342_phase6_case_state_machine.yaml",
      "data/contracts/342_phase6_api_surface.yaml",
      "docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md",
    ],
    readinessReason:
      "Ready because 342 froze the canonical pharmacy case, state machine, lineage-law, blocker-law, and command surface already. No later track needs to redefine those semantics before executable work begins.",
    unlockRule: "Ready now. Merge only after the 345 validator, 346 validator, migration proof, and replay-safe stale-write tests pass together.",
    mergeCriteria: [
      "Keep the 342 status vocabulary, event names, and closure-authority law unchanged.",
      "Persist lineage fence, ownership epoch, and stale-owner recovery before exposing downstream mutation hooks.",
      "Materialize the pharmacy LineageCaseLink on the canonical RequestLineage instead of creating a detached referral identity.",
    ],
    guardrails: [
      "Do not inline eligibility rules, provider choice semantics, or bounce-back detail that belongs to later tracks.",
      "Do not bypass LifecycleCoordinator as the only request-closure authority.",
    ],
    blockerRefs: ["BLK341_001", "BLK341_002"],
    carryForwardRefs: [],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json"],
    launchPacketRef: "data/launchpacks/345_track_launch_packet_346.json",
    ownerFamily: "case",
    objectFamilies: ["case"],
    truthFamilies: ["lineage"],
    audienceFamilies: ["staff", "operations", "integration", "release"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts",
      "packages/domains/pharmacy/tests/phase6-pharmacy-case-kernel.test.ts",
      "services/command-api/migrations/",
    ],
    validationRefs: ["tools/analysis/validate_346_pharmacy_case_kernel.ts"],
    testRefs: [
      "packages/domains/pharmacy/tests/public-api.test.ts",
      "tests/integration/346_*",
      "tests/property/346_*",
    ],
    currentGapIds: ["GAP345_003"],
    expectedDownstreamDependents: ["par_348", "par_349", "par_350", "par_352", "seq_368"],
  },
  {
    trackId: "par_347",
    seq: 347,
    title: "Eligibility engine and versioned policy-pack compiler",
    shortMission:
      "Implement immutable Pharmacy First policy packs, deterministic pathway evaluation, explanation bundles, and replayable historical rule execution.",
    domain: "backend",
    wave: "wave_1",
    readiness: "ready",
    promptRef: "prompt/347.md",
    ownedArtifacts: [
      "ServiceTypeDecision",
      "PathwayEligibilityEvaluation",
      "PharmacyRulePack",
      "PathwayDefinition",
      "PathwayTimingGuardrail",
      "EligibilityExplanationBundle",
    ],
    nonOwnedArtifacts: ["PharmacyCase", "PharmacyChoiceProof", "PharmacyReferralPackage"],
    producedInterfaces: [
      "PharmacyRulePackCompiler",
      "PharmacyEligibilityEvaluationService",
      "EligibilityReplayService",
      "GoldenCaseRegressionHarness",
    ],
    dependsOnTracks: [],
    dependsOnContracts: [
      "data/contracts/342_phase6_rule_pack_schema.json",
      "data/contracts/342_phase6_pathway_registry.json",
      "data/contracts/342_phase6_threshold_family_registry.json",
      "data/contracts/342_phase6_explanation_bundle_schema.json",
      "docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md",
    ],
    readinessReason:
      "Ready because 342 already froze the seven-pathway set, threshold-family registry, immutable pack law, and explanation-bundle contract. The engine can start in parallel with 346 without hidden ownership collisions.",
    unlockRule: "Ready now. Merge only after deterministic replay, golden-case regression, compile-hash stability, and stale-pack rejection proof all pass.",
    mergeCriteria: [
      "Keep all threshold families, fallback law, and pathway precedence sourced from pack data rather than code defaults.",
      "Promotion must fail closed when compile hash, explanation availability, or threshold completeness drift.",
      "Persist staff-safe and patient-safe explanation references from the same evaluation evidence hash.",
    ],
    guardrails: [
      "Do not mutate active packs in place.",
      "Do not let controller-local conditionals redefine pathway truth or minor-illness fallback.",
    ],
    blockerRefs: ["BLK341_001", "BLK341_002"],
    carryForwardRefs: [],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json"],
    launchPacketRef: "data/launchpacks/345_track_launch_packet_347.json",
    ownerFamily: "policy",
    objectFamilies: ["policy"],
    truthFamilies: ["eligibility"],
    audienceFamilies: ["staff", "patient", "integration", "release"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-eligibility-policy-engine.ts",
      "packages/domains/pharmacy/tests/phase6-eligibility-policy-engine.test.ts",
      "data/fixtures/347_*",
    ],
    validationRefs: ["tools/analysis/validate_347_rule_pack_and_evaluation.ts"],
    testRefs: [
      "packages/domains/pharmacy/tests/public-api.test.ts",
      "tests/integration/347_*",
      "tests/property/347_*",
    ],
    currentGapIds: ["GAP345_003"],
    expectedDownstreamDependents: ["par_348", "par_349", "par_357", "seq_369"],
  },
  {
    trackId: "par_348",
    seq: 348,
    title: "Directory abstraction and provider choice pipeline",
    shortMission:
      "Build normalized directory discovery, deterministic provider ranking, full valid-choice exposure, warned-choice acknowledgement, and consent truth.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/348.md",
    ownedArtifacts: [
      "PharmacyDirectorySnapshot",
      "PharmacyDirectorySourceSnapshot",
      "PharmacyProviderCapabilitySnapshot",
      "PharmacyChoiceProof",
      "PharmacyChoiceSession",
      "PharmacyConsentRecord",
      "PharmacyConsentCheckpoint",
    ],
    nonOwnedArtifacts: ["PharmacyCase", "PharmacyRulePack", "PharmacyReferralPackage"],
    producedInterfaces: [
      "PharmacyDiscoveryAdapterRegistry",
      "PharmacyChoiceTruthProjection",
      "ConsentCheckpointService",
    ],
    dependsOnTracks: ["par_346", "par_347"],
    dependsOnContracts: [
      "data/contracts/343_phase6_directory_choice_schema.json",
      "docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md",
      "data/launchpacks/345_track_launch_packet_346.json",
      "data/launchpacks/345_track_launch_packet_347.json",
    ],
    readinessReason:
      "Blocked until the executable pharmacy case kernel and immutable evaluation engine exist. 348 cannot safely normalize directory truth or bind consent without the canonical case identity and selected-pathway source.",
    unlockRule: "Unblock only after 346 and 347 complete, their validators pass, and the 345 gate is rerun.",
    mergeCriteria: [
      "Keep no-hidden-top-k and full-choice visibility law from 343 unchanged.",
      "Invalidate stale consent and stale provider selections when pathway, capability, or source-trust facts drift.",
      "Expose patient-safe and staff-safe choice truth from the server, not UI-local ranking booleans.",
    ],
    guardrails: [
      "Do not suppress valid providers outside the frozen unsafe and invalid-hidden laws.",
      "Do not let transport or dispatch concerns leak into directory choice ownership.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "choice",
    objectFamilies: ["directory", "choice"],
    truthFamilies: ["choice_truth"],
    audienceFamilies: ["patient", "staff", "operations", "integration"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-directory-choice-pipeline.ts",
      "packages/domains/pharmacy/tests/phase6-directory-choice-pipeline.test.ts",
    ],
    validationRefs: ["future:validate_348_directory_choice_pipeline"],
    testRefs: ["tests/integration/348_*", "tests/property/348_*"],
    currentGapIds: ["GAP345_002", "GAP345_003"],
    expectedDownstreamDependents: ["par_349", "par_351", "par_358", "seq_366", "seq_369"],
  },
  {
    trackId: "par_349",
    seq: 349,
    title: "Referral package composer and content governance",
    shortMission:
      "Freeze immutable referral packages with canonical hashes, FHIR representation sets, redaction law, and correlation seed binding.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/349.md",
    ownedArtifacts: ["PharmacyReferralPackage"],
    nonOwnedArtifacts: ["PharmacyChoiceSession", "PharmacyConsentRecord", "PharmacyDispatchPlan"],
    producedInterfaces: [
      "PharmacyReferralPackageComposer",
      "ReferralContentGovernancePolicy",
      "ReferralCorrelationSeedService",
    ],
    dependsOnTracks: ["par_348"],
    dependsOnContracts: [
      "data/contracts/343_phase6_dispatch_schema.json",
      "docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    readinessReason:
      "Blocked because immutable package truth must bind real chosen-provider and consent facts from 348; otherwise dispatch tracks would inherit an ungrounded package boundary.",
    unlockRule: "Unblock after 348 is complete and 345 confirms stale-consent and stale-provider invalidation remain explicit.",
    mergeCriteria: [
      "Freeze package hash and fingerprint from authoritative provider, pathway, consent, and content facts.",
      "Invalidate package readiness on provider, pathway, or consent drift before any dispatch attempt starts.",
      "Keep transport-neutral artifact governance here so 350 cannot improvise package truth.",
    ],
    guardrails: [
      "Do not dispatch or collect proof from this track.",
      "Do not mutate frozen package content in place.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "package",
    objectFamilies: ["package"],
    truthFamilies: ["package_truth"],
    audienceFamilies: ["staff", "integration", "release"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-referral-package-composer.ts",
      "packages/domains/pharmacy/tests/phase6-referral-package-composer.test.ts",
    ],
    validationRefs: ["future:validate_349_referral_package_composer"],
    testRefs: ["tests/integration/349_*", "tests/property/349_*"],
    currentGapIds: ["GAP345_001", "GAP345_003"],
    expectedDownstreamDependents: ["par_350", "par_359", "seq_369"],
  },
  {
    trackId: "par_350",
    seq: 350,
    title: "Dispatch adapter, transport contract, and retry or expiry logic",
    shortMission:
      "Bind immutable referral packages to governed transport plans, live attempts, proof envelopes, retry logic, and authoritative dispatch truth.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/350.md",
    ownedArtifacts: [
      "PharmacyDispatchPlan",
      "PharmacyDispatchAttempt",
      "DispatchProofEnvelope",
      "PharmacyDispatchTruthProjection",
    ],
    nonOwnedArtifacts: [
      "PharmacyReferralPackage",
      "PharmacyConsentCheckpoint",
      "PharmacyOutcomeReconciliationGate",
      "PharmacyBounceBackRecord",
    ],
    producedInterfaces: [
      "PharmacyDispatchAdapter",
      "TransportAssuranceProfileRegistry",
      "DispatchProofAggregator",
      "DispatchRetryAndExpiryService",
    ],
    dependsOnTracks: ["par_348", "par_349"],
    dependsOnContracts: [
      "data/contracts/343_phase6_dispatch_schema.json",
      "data/contracts/343_phase6_dispatch_truth_projection_schema.json",
      "docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md",
    ],
    readinessReason:
      "Blocked because dispatch truth depends on a real chosen provider and immutable package. Until 348 and 349 land, any transport plan would be detached from the frozen package and consent invalidation law.",
    unlockRule: "Unblock after 348 and 349 complete and 345 confirms package drift invalidates dispatch readiness.",
    mergeCriteria: [
      "Keep proof state, proof risk state, and continuity evidence distinct from outcome truth.",
      "Fail closed on stale consent, stale package, contradiction, timeout, or proof expiry.",
      "Persist one authoritative dispatch-truth projection instead of per-adapter status booleans.",
    ],
    guardrails: [
      "Do not let proof satisfaction imply completed outcome or calm completion.",
      "Do not rewrite package content or provider choice from within dispatch adapters.",
    ],
    blockerRefs: ["BLK341_004"],
    carryForwardRefs: ["CF341_002", "CF341_003", "CF341_004", "CF341_005"],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "dispatch",
    objectFamilies: ["dispatch"],
    truthFamilies: ["dispatch_truth"],
    audienceFamilies: ["staff", "practice", "operations", "integration", "operator"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-dispatch-engine.ts",
      "packages/domains/pharmacy/tests/phase6-dispatch-engine.test.ts",
      "scripts/messaging/",
    ],
    validationRefs: ["future:validate_350_dispatch_and_proof"],
    testRefs: ["tests/integration/350_*", "tests/property/350_*"],
    currentGapIds: ["GAP345_001", "GAP345_004"],
    expectedDownstreamDependents: ["par_351", "par_352", "par_359", "seq_366", "seq_367", "seq_369"],
  },
  {
    trackId: "par_351",
    seq: 351,
    title: "Patient instruction generation and referral status projections",
    shortMission:
      "Generate patient-safe pharmacy status truth, next-step copy, and calmness boundaries without reusing appointment semantics.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/351.md",
    ownedArtifacts: ["PharmacyPatientStatusProjection"],
    nonOwnedArtifacts: [
      "PharmacyDispatchTruthProjection",
      "PharmacyOutcomeTruthProjection",
      "PharmacyBounceBackRecord",
      "PharmacyReachabilityPlan",
    ],
    producedInterfaces: ["PatientPharmacyStatusProjector", "PatientInstructionGenerator"],
    dependsOnTracks: ["par_348", "par_350"],
    dependsOnContracts: [
      "data/contracts/344_phase6_patient_status_schema.json",
      "data/contracts/344_phase6_bounce_back_schema.json",
      "docs/architecture/344_phase6_bounce_back_and_visibility_contracts.md",
    ],
    readinessReason:
      "Blocked because patient-safe status cannot be grounded until real choice, dispatch, and reachability inputs exist. The frozen 344 macro-state law must be consumed from server truth, not invented early.",
    unlockRule: "Unblock after 348 and 350 complete and before any patient UI track consumes pharmacy status.",
    mergeCriteria: [
      "Keep patient macro states exactly as frozen in 344.",
      "Block calm completion while dispatch, outcome, return, reachability, or identity repair debt remains open.",
      "Publish server-derived wording inputs so frontend tracks never infer state from booleans.",
    ],
    guardrails: [
      "Do not imply booked-appointment semantics.",
      "Do not hard-code patient copy in browser routes before this projection exists.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "status",
    objectFamilies: ["status"],
    truthFamilies: ["status_truth"],
    audienceFamilies: ["patient", "integration"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-patient-status-projections.ts",
      "packages/domains/pharmacy/tests/phase6-patient-status-projections.test.ts",
    ],
    validationRefs: ["future:validate_351_patient_status_projections"],
    testRefs: ["tests/integration/351_*", "tests/property/351_*"],
    currentGapIds: ["GAP345_002", "GAP345_003"],
    expectedDownstreamDependents: ["par_356", "par_360", "seq_368", "seq_371"],
  },
  {
    trackId: "par_352",
    seq: 352,
    title: "Outcome ingest, Update Record observation, and reconciliation pipeline",
    shortMission:
      "Normalize pharmacy outcome evidence, replay-safe ingest, Update Record observation, strong and weak match handling, and closure-safe outcome truth.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/352.md",
    ownedArtifacts: [
      "OutcomeEvidenceEnvelope",
      "PharmacyOutcomeReconciliationGate",
      "PharmacyOutcomeTruthProjection",
    ],
    nonOwnedArtifacts: ["PharmacyDispatchTruthProjection", "PharmacyBounceBackRecord", "PharmacyPatientStatusProjection"],
    producedInterfaces: [
      "OutcomeIngestPipeline",
      "OutcomeReplayClassifier",
      "OutcomeMatchAndSettlementService",
    ],
    dependsOnTracks: ["par_346", "par_349", "par_350"],
    dependsOnContracts: [
      "data/contracts/343_phase6_outcome_reconciliation_schema.json",
      "data/contracts/343_phase6_outcome_truth_projection_schema.json",
      "docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md",
    ],
    readinessReason:
      "Blocked until dispatch truth and immutable package truth exist. Outcome evidence cannot be matched or reconciled safely without the authoritative case, package, transport, and proof anchors.",
    unlockRule: "Unblock after 346, 349, and 350 complete and after 367 readiness remains clearly deferred rather than overclaimed.",
    mergeCriteria: [
      "Keep outcome source families, replay postures, and weak-match review law exactly as frozen in 343.",
      "Block closure on ambiguity, contradiction, or unmatched outcome truth.",
      "Emit patient-safe, staff-safe, and console-safe projections from one settlement family.",
    ],
    guardrails: [
      "Do not equate silent transport success with resolved outcome.",
      "Do not bypass manual review thresholds when posterior confidence is weak.",
    ],
    blockerRefs: ["BLK341_004"],
    carryForwardRefs: ["CF341_003"],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "outcome",
    objectFamilies: ["outcome"],
    truthFamilies: ["outcome_truth"],
    audienceFamilies: ["patient", "staff", "operations", "integration", "operator"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-outcome-reconciliation.ts",
      "packages/domains/pharmacy/tests/phase6-outcome-reconciliation.test.ts",
    ],
    validationRefs: ["future:validate_352_outcome_reconciliation"],
    testRefs: ["tests/integration/352_*", "tests/property/352_*"],
    currentGapIds: ["GAP345_001", "GAP345_004"],
    expectedDownstreamDependents: ["par_353", "par_354", "par_361", "seq_367", "seq_369", "seq_370"],
  },
  {
    trackId: "par_353",
    seq: 353,
    title: "Bounce-back, urgent return, and reopen mechanics",
    shortMission:
      "Implement typed bounce-back evidence, urgent-return law, reopen priority, loop prevention, reachability repair, and same-lineage reacquisition.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/353.md",
    ownedArtifacts: ["PharmacyBounceBackRecord", "PharmacyReachabilityPlan"],
    nonOwnedArtifacts: ["PharmacyOutcomeTruthProjection", "PharmacyPatientStatusProjection"],
    producedInterfaces: [
      "PharmacyBounceBackClassifier",
      "UrgentReturnCoordinator",
      "ReopenPriorityService",
      "ReachabilityRepairPlanner",
    ],
    dependsOnTracks: ["par_346", "par_352"],
    dependsOnContracts: [
      "data/contracts/344_phase6_bounce_back_schema.json",
      "data/contracts/344_phase6_patient_status_schema.json",
      "docs/architecture/344_phase6_bounce_back_and_visibility_contracts.md",
    ],
    readinessReason:
      "Blocked until executable outcome truth exists. 353 must keep urgent return, routine return, and no-contact return distinct, and that split depends on authoritative outcome and reconciliation posture from 352.",
    unlockRule: "Unblock after 346 and 352 complete and after the invalidation-chain seam still proves calm posture is blocked by return debt.",
    mergeCriteria: [
      "Keep urgent return distinct from routine return and no-contact return.",
      "Persist loop-risk and reopen-priority calculations from the 344 threshold family rather than UI-local heuristics.",
      "Invalidate calm patient and practice posture when urgent return or reachability repair remains open.",
    ],
    guardrails: [
      "Do not let redispatch or close proceed automatically when loop-risk review is active.",
      "Do not hide urgent return behind generic review states.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "return",
    objectFamilies: ["return"],
    truthFamilies: ["return_truth"],
    audienceFamilies: ["patient", "staff", "practice", "operations", "integration"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-bounce-back-engine.ts",
      "packages/domains/pharmacy/tests/phase6-bounce-back-engine.test.ts",
    ],
    validationRefs: ["future:validate_353_bounce_back_and_reopen"],
    testRefs: ["tests/integration/353_*", "tests/property/353_*"],
    currentGapIds: ["GAP345_001", "GAP345_003"],
    expectedDownstreamDependents: ["par_354", "par_360", "par_362", "seq_370"],
  },
  {
    trackId: "par_354",
    seq: 354,
    title: "Practice visibility, operations queue, and exception handling views API",
    shortMission:
      "Publish authoritative practice visibility, operations queues, provider health posture, and pharmacy exception APIs from server truth.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/354.md",
    ownedArtifacts: ["PharmacyPracticeVisibilityProjection", "PharmacyOperationsQueueProjection"],
    nonOwnedArtifacts: [
      "PharmacyPatientStatusProjection",
      "PharmacyDispatchTruthProjection",
      "PharmacyOutcomeTruthProjection",
      "PharmacyBounceBackRecord",
    ],
    producedInterfaces: [
      "PracticeVisibilityProjector",
      "PharmacyOperationsQueueApi",
      "ProviderHealthProjectionApi",
      "PharmacyExceptionViewApi",
    ],
    dependsOnTracks: ["par_350", "par_352", "par_353"],
    dependsOnContracts: [
      "data/contracts/344_phase6_practice_visibility_schema.json",
      "data/contracts/344_phase6_projection_registry.json",
      "docs/architecture/344_phase6_bounce_back_and_visibility_contracts.md",
    ],
    readinessReason:
      "Blocked because queue meaning and minimum-necessary practice visibility require real dispatch, outcome, and return truth first. 354 may not backfill those semantics from frontend state.",
    unlockRule: "Unblock after 350, 352, and 353 complete and after 345 confirms one owner for practice visibility and operations projections.",
    mergeCriteria: [
      "Keep minimum-necessary audience views server-derived and client-side hiding forbidden.",
      "Expose provider health, queue counts, and exception posture without letting the browser synthesize queue meaning.",
      "Preserve close blockers, confirmation gates, and urgent return debt in practice-facing projections.",
    ],
    guardrails: [
      "Do not shift queue ranking or calmness synthesis into the browser.",
      "Do not let console-only stock truth leak into practice visibility ownership.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "visibility",
    objectFamilies: ["visibility"],
    truthFamilies: ["visibility_truth"],
    audienceFamilies: ["practice", "operations", "staff", "integration"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-practice-visibility.ts",
      "packages/domains/pharmacy/tests/phase6-practice-visibility.test.ts",
    ],
    validationRefs: ["future:validate_354_practice_visibility_and_ops"],
    testRefs: ["tests/integration/354_*", "tests/property/354_*"],
    currentGapIds: ["GAP345_002", "GAP345_003"],
    expectedDownstreamDependents: ["par_356", "par_363", "seq_368", "seq_370"],
  },
  {
    trackId: "par_355",
    seq: 355,
    title: "Pharmacy console support region and stock truth API",
    shortMission:
      "Define the backend workbench, validation, inventory truth, comparison, handoff readiness, and support-region contracts for the future pharmacy console.",
    domain: "backend",
    wave: "wave_2",
    readiness: "blocked",
    promptRef: "prompt/355.md",
    ownedArtifacts: [
      "PharmacyConsoleWorklistProjection",
      "PharmacyCaseWorkbenchProjection",
      "InventoryTruthPanelProjection",
      "HandoffReadinessProjection",
    ],
    nonOwnedArtifacts: [
      "PharmacyPracticeVisibilityProjection",
      "PharmacyDispatchTruthProjection",
      "PharmacyOutcomeTruthProjection",
      "PharmacyBounceBackRecord",
    ],
    producedInterfaces: [
      "PharmacyConsoleWorkbenchApi",
      "InventoryComparisonApi",
      "SupplyComputationApi",
      "HandoffReadinessBoardApi",
    ],
    dependsOnTracks: ["par_350", "par_352", "par_353", "par_354"],
    dependsOnContracts: [
      "blueprint/pharmacy-console-frontend-architecture.md",
      "data/contracts/344_phase6_projection_registry.json",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    readinessReason:
      "Blocked because the console workbench must sit on top of settled dispatch, outcome, return, and practice-visibility truth. Launching 355 early would force frontend-owned queue or inventory semantics.",
    unlockRule: "Unblock after 350, 352, 353, and 354 complete and after the frontend truth-consumption seam remains explicit.",
    mergeCriteria: [
      "Keep inventory freshness, comparison fencing, and support-region readiness server-derived.",
      "Preserve same-shell continuity evidence and blocked posture so the console cannot calm early.",
      "Keep stock-truth APIs separate from practice visibility ownership while remaining dependency-compatible.",
    ],
    guardrails: [
      "Do not build UI-local supply computation or handoff readiness booleans.",
      "Do not merge practice visibility ownership into console-specific projections.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json"],
    ownerFamily: "console",
    objectFamilies: ["console"],
    truthFamilies: ["console_truth"],
    audienceFamilies: ["pharmacy_console", "operations", "staff", "integration"],
    expectedSurfaceRoots: [
      "packages/domains/pharmacy/src/phase6-console-support-region.ts",
      "packages/domains/pharmacy/tests/phase6-console-support-region.test.ts",
    ],
    validationRefs: ["future:validate_355_console_support_region"],
    testRefs: ["tests/integration/355_*", "tests/property/355_*"],
    currentGapIds: ["GAP345_002"],
    expectedDownstreamDependents: ["par_356", "par_363", "seq_371"],
  },
  {
    trackId: "par_356",
    seq: 356,
    title: "Pharmacy shell route family and console mission frame",
    shortMission:
      "Build the same-shell pharmacy route family, mission frame, checkpoint rail, decision dock host, and support-region hosts for later UI work.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/356.md",
    ownedArtifacts: ["PharmacyShellFrame", "PharmacyWorkspaceShell", "PharmacyPatientShell"],
    nonOwnedArtifacts: [
      "PharmacyPatientStatusProjection",
      "PharmacyPracticeVisibilityProjection",
      "PharmacyConsoleWorklistProjection",
    ],
    producedInterfaces: ["PharmacyShellRouteFamily", "PharmacyMissionFrame", "PharmacyDecisionDockHost"],
    dependsOnTracks: ["par_351", "par_354", "par_355"],
    dependsOnContracts: [
      "blueprint/pharmacy-console-frontend-architecture.md",
      "prompt/shared_operating_contract_356_to_363.md",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    readinessReason:
      "Blocked because the shell family must consume real patient-status, practice-visibility, and console-workbench truth. Starting before 351, 354, and 355 would force the browser to invent anchor and queue meaning.",
    unlockRule: "Unblock after 351, 354, and 355 complete and after the frontend truth-consumption seam remains closed.",
    mergeCriteria: [
      "Keep one pharmacy shell family across patient, staff, and console routes.",
      "Preserve chosen-provider anchor, request-lineage anchor, and DecisionDock host across same-shell navigation.",
      "Provide deterministic Playwright handles for shell regions and continuity anchors from day one.",
    ],
    guardrails: [
      "Do not build a detached admin shell for pharmacy.",
      "Do not infer queue or status truth in the browser.",
    ],
    blockerRefs: ["BLK341_003"],
    carryForwardRefs: ["CF341_006"],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json"],
    ownerFamily: "console",
    objectFamilies: ["console", "visibility"],
    truthFamilies: ["console_truth", "status_truth", "visibility_truth"],
    audienceFamilies: ["patient", "staff", "practice", "operations", "pharmacy_console"],
    expectedSurfaceRoots: ["apps/pharmacy-console/src/", "apps/patient-web/src/"],
    validationRefs: ["future:validate_356_pharmacy_shell_family"],
    testRefs: ["tests/playwright/356_*"],
    currentGapIds: ["GAP345_002", "GAP345_005"],
    expectedDownstreamDependents: ["par_357", "par_358", "par_359", "par_360", "par_361", "par_362", "par_363", "seq_371"],
  },
  {
    trackId: "par_357",
    seq: 357,
    title: "Eligibility explainer and unsuitable-return views",
    shortMission:
      "Render staff-safe rule explainers and patient-safe unsuitable-return states from one explanation bundle and one decision tuple.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/357.md",
    ownedArtifacts: ["EligibilityExplainerView", "PatientUnsuitableReturnView"],
    nonOwnedArtifacts: ["EligibilityExplanationBundle", "PathwayEligibilityEvaluation", "PharmacyPatientStatusProjection"],
    producedInterfaces: ["EligibilityExplainerScreen", "PatientUnsuitableReturnScreen"],
    dependsOnTracks: ["par_347", "par_356"],
    dependsOnContracts: [
      "data/contracts/342_phase6_explanation_bundle_schema.json",
      "prompt/shared_operating_contract_356_to_363.md",
    ],
    readinessReason:
      "Blocked because 357 must read real explanation bundles and shell hosts; otherwise staff and patient views would drift from the frozen eligibility truth.",
    unlockRule: "Unblock after 347 and 356 complete and after the shared explanation-bundle law remains unchanged.",
    mergeCriteria: [
      "Derive patient and staff views from the same explanation bundle and policy-pack version.",
      "Keep unsuitable-return states short, clear, and non-technical while preserving decision truth.",
    ],
    guardrails: [
      "Do not duplicate rule evaluation in the browser.",
      "Do not leak internal threshold tuning or unsupported detail to patient views.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json"],
    ownerFamily: "policy",
    objectFamilies: ["policy", "status"],
    truthFamilies: ["eligibility", "status_truth"],
    audienceFamilies: ["patient", "staff"],
    expectedSurfaceRoots: ["apps/pharmacy-console/src/", "apps/patient-web/src/"],
    validationRefs: ["future:validate_357_eligibility_explainer_views"],
    testRefs: ["tests/playwright/357_*"],
    currentGapIds: ["GAP345_002"],
    expectedDownstreamDependents: ["par_365", "seq_371"],
  },
  {
    trackId: "par_358",
    seq: 358,
    title: "Patient pharmacy chooser ranked list, map, and warned-choice flow",
    shortMission:
      "Build the list-first pharmacy chooser, optional map, reason chips, warned-choice acknowledgement, and stale-choice recovery from one choice proof.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/358.md",
    ownedArtifacts: ["PatientPharmacyChooserView"],
    nonOwnedArtifacts: ["PharmacyChoiceProof", "PharmacyChoiceSession", "PharmacyConsentCheckpoint"],
    producedInterfaces: ["PharmacyChooserScreen", "WarnedChoiceAcknowledgementFlow"],
    dependsOnTracks: ["par_348", "par_356"],
    dependsOnContracts: [
      "data/contracts/343_phase6_directory_choice_schema.json",
      "prompt/shared_operating_contract_356_to_363.md",
    ],
    readinessReason:
      "Blocked because the chooser must consume the full valid-choice set, warned-choice posture, and consent truth from 348. Starting before that would recreate hidden-top-k drift in the browser.",
    unlockRule: "Unblock after 348 and 356 complete and after the full-choice law remains machine-auditable.",
    mergeCriteria: [
      "Recommend without funneling and keep the full valid choice set visible.",
      "Bind list and map views to the same ranking, warnings, and explanation chips.",
      "Fail closed on stale or superseded choice proof rather than replaying obsolete recommendations.",
    ],
    guardrails: [
      "Do not suppress valid providers outside the frozen unsafe and invalid-hidden rules.",
      "Do not treat warned-choice acknowledgement as dispatch or consent completion.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json"],
    ownerFamily: "choice",
    objectFamilies: ["choice", "directory"],
    truthFamilies: ["choice_truth"],
    audienceFamilies: ["patient"],
    expectedSurfaceRoots: ["apps/patient-web/src/"],
    validationRefs: ["future:validate_358_patient_pharmacy_chooser"],
    testRefs: ["tests/playwright/358_*"],
    currentGapIds: ["GAP345_002"],
    expectedDownstreamDependents: ["par_359", "par_365", "seq_371"],
  },
  {
    trackId: "par_359",
    seq: 359,
    title: "Referral confirmation, dispatch posture, and consent continuity views",
    shortMission:
      "Render staff-safe dispatch posture, patient-safe referral confirmation, and explicit consent continuity without collapsing transport truth into calm reassurance.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/359.md",
    ownedArtifacts: ["ReferralConfirmationView", "DispatchPostureView"],
    nonOwnedArtifacts: [
      "PharmacyReferralPackage",
      "PharmacyDispatchTruthProjection",
      "PharmacyConsentCheckpoint",
    ],
    producedInterfaces: ["ReferralConfirmationScreen", "DispatchPostureInspector"],
    dependsOnTracks: ["par_349", "par_350", "par_356"],
    dependsOnContracts: [
      "data/contracts/343_phase6_dispatch_schema.json",
      "data/contracts/343_phase6_dispatch_truth_projection_schema.json",
      "prompt/shared_operating_contract_356_to_363.md",
    ],
    readinessReason:
      "Blocked because confirmation and dispatch posture need real package, proof, and consent continuity anchors. Without 349 and 350 the UI would be inventing transport truth.",
    unlockRule: "Unblock after 349, 350, and 356 complete and after the dispatch/package invalidation chain remains explicit.",
    mergeCriteria: [
      "Keep consent checkpoint, dispatch proof, and chosen-provider anchor as separate authorities.",
      "Render omitted or redacted artifact summaries without leaking transport-only jargon to patient views.",
      "Keep continuity warnings visible when consent, proof, or anchor validity drifts.",
    ],
    guardrails: [
      "Do not treat local click acknowledgement as transport acceptance.",
      "Do not imply calm referred posture until proof and consent continuity are satisfied.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "dispatch",
    objectFamilies: ["package", "dispatch"],
    truthFamilies: ["package_truth", "dispatch_truth"],
    audienceFamilies: ["patient", "staff"],
    expectedSurfaceRoots: ["apps/pharmacy-console/src/", "apps/patient-web/src/"],
    validationRefs: ["future:validate_359_dispatch_posture_views"],
    testRefs: ["tests/playwright/359_*"],
    currentGapIds: ["GAP345_002", "GAP345_003"],
    expectedDownstreamDependents: ["par_360", "par_365", "seq_371"],
  },
  {
    trackId: "par_360",
    seq: 360,
    title: "Chosen-pharmacy instructions, status tracker, and outcome pages",
    shortMission:
      "Build the patient instruction journey, status tracker, chosen-pharmacy anchor, and non-calm review pages for unresolved closure or bounce-back.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/360.md",
    ownedArtifacts: ["ChosenPharmacyInstructionsView", "PharmacyStatusTrackerView"],
    nonOwnedArtifacts: ["PharmacyPatientStatusProjection", "PharmacyBounceBackRecord"],
    producedInterfaces: ["ChosenPharmacyInstructionScreen", "PatientPharmacyStatusTracker"],
    dependsOnTracks: ["par_351", "par_353", "par_356", "par_359"],
    dependsOnContracts: [
      "data/contracts/344_phase6_patient_status_schema.json",
      "prompt/shared_operating_contract_356_to_363.md",
    ],
    readinessReason:
      "Blocked because the patient journey must consume authoritative pharmacy status, return posture, and shell continuity. Without 351 and 353 it would drift into appointment-like calmness or generic review copy.",
    unlockRule: "Unblock after 351, 353, 356, and 359 complete and after calm-completion law stays explicit.",
    mergeCriteria: [
      "Keep the chosen-provider anchor visually persistent across confirmation, tracker, outcome, and review pages.",
      "Reuse the 344 patient macro states and calmness rules without appointment semantics.",
      "Render return and review states as explicit next-step postures, not quiet success pages.",
    ],
    guardrails: [
      "Do not synthesize patient status from URL or timer heuristics.",
      "Do not hide unresolved closure or urgent return behind generic completion copy.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json"],
    ownerFamily: "status",
    objectFamilies: ["status", "return"],
    truthFamilies: ["status_truth", "return_truth"],
    audienceFamilies: ["patient"],
    expectedSurfaceRoots: ["apps/patient-web/src/"],
    validationRefs: ["future:validate_360_patient_pharmacy_journey"],
    testRefs: ["tests/playwright/360_*"],
    currentGapIds: ["GAP345_002"],
    expectedDownstreamDependents: ["par_365", "seq_368", "seq_371"],
  },
  {
    trackId: "par_361",
    seq: 361,
    title: "Outcome assurance, reconciliation, and manual review views",
    shortMission:
      "Render the assurance child state for outcome ingest, reconciliation confidence, manual review, and closure blockers inside the same shell.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/361.md",
    ownedArtifacts: ["OutcomeAssuranceView"],
    nonOwnedArtifacts: ["PharmacyOutcomeTruthProjection", "OutcomeEvidenceEnvelope"],
    producedInterfaces: ["OutcomeAssuranceScreen", "OutcomeEvidenceDrawer"],
    dependsOnTracks: ["par_352", "par_356"],
    dependsOnContracts: [
      "data/contracts/343_phase6_outcome_truth_projection_schema.json",
      "prompt/shared_operating_contract_356_to_363.md",
    ],
    readinessReason:
      "Blocked because assurance views depend on real outcome truth, evidence matches, and shell hosts. Starting earlier would recreate manual-review heuristics in the browser.",
    unlockRule: "Unblock after 352 and 356 complete and after outcome ambiguity still blocks closure.",
    mergeCriteria: [
      "Keep outcome evidence, confidence, manual review, and close blockers legible from the same truth projection.",
      "Centralize decisive assurance actions in one DecisionDock rather than detached admin routes.",
    ],
    guardrails: [
      "Do not recalculate match confidence or closure eligibility in the browser.",
      "Do not collapse weak review into calm completion copy.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "outcome",
    objectFamilies: ["outcome"],
    truthFamilies: ["outcome_truth"],
    audienceFamilies: ["staff", "pharmacy_console"],
    expectedSurfaceRoots: ["apps/pharmacy-console/src/"],
    validationRefs: ["future:validate_361_outcome_assurance_views"],
    testRefs: ["tests/playwright/361_*"],
    currentGapIds: ["GAP345_002", "GAP345_003"],
    expectedDownstreamDependents: ["par_363", "par_365", "seq_370", "seq_371"],
  },
  {
    trackId: "par_362",
    seq: 362,
    title: "Bounce-back, urgent-return, and reopen recovery views",
    shortMission:
      "Render same-shell bounce-back, urgent-return, reopen diff, and loop-risk recovery views without creating a detached emergency UI.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/362.md",
    ownedArtifacts: ["BounceBackRecoveryView", "UrgentReturnView"],
    nonOwnedArtifacts: ["PharmacyBounceBackRecord", "PharmacyReachabilityPlan"],
    producedInterfaces: ["BounceBackRecoveryScreen", "UrgentReturnRecoveryScreen"],
    dependsOnTracks: ["par_353", "par_356"],
    dependsOnContracts: [
      "data/contracts/344_phase6_bounce_back_schema.json",
      "prompt/shared_operating_contract_356_to_363.md",
    ],
    readinessReason:
      "Blocked because recovery views must preserve real bounce-back evidence, urgent-return law, and reopen priority from 353. Starting earlier would hide return safety behind UI convention.",
    unlockRule: "Unblock after 353 and 356 complete and after loop-risk and urgent-return distinctions remain explicit.",
    mergeCriteria: [
      "Keep urgent return visually distinct from routine return and no-contact review.",
      "Preserve evidence anchors, changed-since-seen diffs, and one-click reopen actions inside the same shell.",
    ],
    guardrails: [
      "Do not calm unresolved return debt.",
      "Do not create a detached emergency micro-product for urgent return.",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    collisionSeamRefs: [
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
    ownerFamily: "return",
    objectFamilies: ["return"],
    truthFamilies: ["return_truth"],
    audienceFamilies: ["patient", "staff", "practice", "operations"],
    expectedSurfaceRoots: ["apps/pharmacy-console/src/", "apps/patient-web/src/"],
    validationRefs: ["future:validate_362_bounce_back_views"],
    testRefs: ["tests/playwright/362_*"],
    currentGapIds: ["GAP345_002", "GAP345_003"],
    expectedDownstreamDependents: ["par_363", "par_364", "par_365", "seq_370", "seq_371"],
  },
  {
    trackId: "par_363",
    seq: 363,
    title: "Practice visibility operations panel and pharmacy-console workbench",
    shortMission:
      "Build the dense operations panel and same-shell pharmacy-console workbench from authoritative practice, queue, inventory, and handoff truth.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/363.md",
    ownedArtifacts: ["PharmacyConsoleWorkbenchView", "PracticeVisibilityOperationsPanel"],
    nonOwnedArtifacts: [
      "PharmacyPracticeVisibilityProjection",
      "PharmacyConsoleWorklistProjection",
      "InventoryTruthPanelProjection",
      "HandoffReadinessProjection",
    ],
    producedInterfaces: ["PharmacyConsoleWorkbenchScreen", "PracticeOperationsQueueScreen"],
    dependsOnTracks: ["par_354", "par_355", "par_356", "par_361", "par_362"],
    dependsOnContracts: [
      "blueprint/pharmacy-console-frontend-architecture.md",
      "prompt/shared_operating_contract_356_to_363.md",
    ],
    readinessReason:
      "Blocked because the workbench is the densest consumer of server truth across visibility, console support-region, assurance, and recovery layers. It must wait for 354, 355, 356, 361, and 362.",
    unlockRule: "Unblock after 354, 355, 356, 361, and 362 complete and after frontend truth-consumption remains server-derived.",
    mergeCriteria: [
      "Keep queue scanning, inventory comparison, substitution, and handoff work inside the same shell.",
      "Render row-to-mission morphing without detached detail pages.",
      "Keep stock risk, outage, validation due, and handoff blockers tied to server truth.",
    ],
    guardrails: [
      "Do not compute operations status or queue meaning in the browser.",
      "Do not separate console workbench from the shared pharmacy shell family.",
    ],
    blockerRefs: ["BLK341_003"],
    carryForwardRefs: ["CF341_006"],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json"],
    ownerFamily: "console",
    objectFamilies: ["console", "visibility"],
    truthFamilies: ["console_truth", "visibility_truth", "outcome_truth", "return_truth"],
    audienceFamilies: ["practice", "operations", "pharmacy_console", "staff"],
    expectedSurfaceRoots: ["apps/pharmacy-console/src/"],
    validationRefs: ["future:validate_363_console_workbench_views"],
    testRefs: ["tests/playwright/363_*"],
    currentGapIds: ["GAP345_002", "GAP345_005"],
    expectedDownstreamDependents: ["par_364", "par_365", "seq_368", "seq_371"],
  },
  {
    trackId: "par_364",
    seq: 364,
    title: "Narrow-screen and recovery postures for pharmacy console",
    shortMission:
      "Finish mission-stack folding, narrow-screen same-shell recovery, and continuity-preserving reopen behavior for the pharmacy console.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/364.md",
    ownedArtifacts: ["PharmacyMissionStackLayout"],
    nonOwnedArtifacts: ["PharmacyConsoleWorkbenchView", "BounceBackRecoveryView"],
    producedInterfaces: ["PharmacyMissionStackResponsiveLayout"],
    dependsOnTracks: ["par_356", "par_363"],
    dependsOnContracts: [
      "prompt/shared_operating_contract_364_to_371.md",
      "blueprint/pharmacy-console-frontend-architecture.md",
    ],
    readinessReason:
      "Blocked because 364 hardens the real console shell and workbench for narrow screens; there is no meaningful responsive proof until 356 and 363 exist.",
    unlockRule: "Unblock after 356 and 363 complete and after the same-shell continuity model is already proved on desktop.",
    mergeCriteria: [
      "Keep one shell family across desktop, tablet, and phone widths.",
      "Preserve dominant action, chosen anchor, and current-case continuity under fold and unfold.",
      "Provide safe-area and reduced-motion support for sticky action regions.",
    ],
    guardrails: [
      "Do not invent a separate mobile information architecture.",
      "Do not hide recovery posture when the shell folds.",
    ],
    blockerRefs: ["BLK341_003"],
    carryForwardRefs: ["CF341_006"],
    collisionSeamRefs: [],
    ownerFamily: "console",
    objectFamilies: ["console"],
    truthFamilies: ["console_truth"],
    audienceFamilies: ["pharmacy_console", "operations", "staff"],
    expectedSurfaceRoots: ["apps/pharmacy-console/src/"],
    validationRefs: ["future:validate_364_console_responsive_posture"],
    testRefs: ["tests/playwright/364_*"],
    currentGapIds: ["GAP345_005"],
    expectedDownstreamDependents: ["par_365", "seq_371"],
  },
  {
    trackId: "par_365",
    seq: 365,
    title: "Accessibility and micro-interaction refinements for pharmacy flows",
    shortMission:
      "Finish semantics, focus, keyboard, assistive announcements, reduced motion, and micro-interactions across the pharmacy loop UI.",
    domain: "frontend",
    wave: "wave_3",
    readiness: "blocked",
    promptRef: "prompt/365.md",
    ownedArtifacts: ["PharmacyAccessibilityAndInteractionPolish"],
    nonOwnedArtifacts: [
      "PharmacyShellFrame",
      "PatientPharmacyChooserView",
      "PharmacyStatusTrackerView",
      "PharmacyConsoleWorkbenchView",
    ],
    producedInterfaces: ["PharmacyAccessibilityRegressionHarness"],
    dependsOnTracks: ["par_357", "par_358", "par_359", "par_360", "par_361", "par_362", "par_363", "par_364"],
    dependsOnContracts: [
      "prompt/shared_operating_contract_364_to_371.md",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    readinessReason:
      "Blocked because accessibility and micro-interaction refinement are product behavior over the full pharmacy UI family, not a speculative overlay. The underlying surfaces must exist first.",
    unlockRule: "Unblock after 357 to 364 complete and after the shell and status truth remain stable.",
    mergeCriteria: [
      "Keep semantic structure, focus order, focus return, and assistive announcements in the real product DOM.",
      "Preserve keyboard operation and reduced-motion behavior across chooser, status, recovery, and console surfaces.",
    ],
    guardrails: [
      "Do not bolt on overlay widgets as a substitute for real accessibility work.",
      "Do not reinterpret unresolved review or urgent return states as calm announcements.",
    ],
    blockerRefs: ["BLK341_003"],
    carryForwardRefs: ["CF341_006"],
    collisionSeamRefs: [],
    ownerFamily: "console",
    objectFamilies: ["console", "status", "choice", "return"],
    truthFamilies: ["choice_truth", "status_truth", "return_truth", "console_truth"],
    audienceFamilies: ["patient", "staff", "practice", "operations", "pharmacy_console"],
    expectedSurfaceRoots: ["apps/pharmacy-console/src/", "apps/patient-web/src/"],
    validationRefs: ["future:validate_365_pharmacy_accessibility_and_micro_interactions"],
    testRefs: ["tests/playwright/365_*"],
    currentGapIds: ["GAP345_005"],
    expectedDownstreamDependents: ["seq_371"],
  },
  {
    trackId: "seq_366",
    seq: 366,
    title: "Directory and dispatch provider credential configuration",
    shortMission:
      "Operationalize non-production directory-source and dispatch-provider credentials with governed browser automation, redaction, and verification artifacts.",
    domain: "ops",
    wave: "ops",
    readiness: "deferred",
    promptRef: "prompt/366.md",
    ownedArtifacts: ["PharmacyDirectoryCredentialManifest", "PharmacyDispatchProviderCredentialManifest"],
    nonOwnedArtifacts: ["PharmacyDiscoveryAdapterRegistry", "PharmacyDispatchAdapter"],
    producedInterfaces: ["NonProdProviderCredentialSetupFlow", "ProviderBindingVerificationRun"],
    dependsOnTracks: ["par_348", "par_350"],
    dependsOnContracts: [
      "data/analysis/341_phase5_carry_forward_ledger.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
      "prompt/shared_operating_contract_364_to_371.md",
    ],
    readinessReason:
      "Deferred, not ready. The task is valid only after 348 and 350 exist, and even then live or supported-test onboarding remains bounded by manual-bridge and operator-controlled credential governance inherited from 341.",
    unlockRule:
      "Advance from deferred only after 348 and 350 complete, operator-owned credential approval exists, and 345 is rerun with updated environment evidence.",
    mergeCriteria: [
      "Keep raw secrets out of repo and publish only masked manifests and verification results.",
      "Treat provider onboarding as environment-bound control-plane truth, not product-level completion evidence.",
    ],
    guardrails: [
      "Never commit live secrets or browser session tokens.",
      "Do not relabel manual-bridge or review-required onboarding as live-ready parity.",
    ],
    blockerRefs: ["BLK341_004"],
    carryForwardRefs: ["CF341_003", "CF341_004", "CF341_005"],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json"],
    ownerFamily: "environment",
    objectFamilies: ["environment", "directory", "dispatch"],
    truthFamilies: ["environment_truth", "dispatch_truth", "choice_truth"],
    audienceFamilies: ["operator", "release"],
    expectedSurfaceRoots: ["scripts/", "ops/"],
    validationRefs: ["future:validate_366_provider_credentials"],
    testRefs: ["tests/playwright/366_*"],
    currentGapIds: ["GAP345_004"],
    expectedDownstreamDependents: ["seq_368", "seq_369"],
  },
  {
    trackId: "seq_367",
    seq: 367,
    title: "Update Record and referral transport sandbox readiness",
    shortMission:
      "Operationalize supported sandbox request packs, mailbox and endpoint manifests, and browser automation for Update Record observation and referral transports.",
    domain: "ops",
    wave: "ops",
    readiness: "deferred",
    promptRef: "prompt/367.md",
    ownedArtifacts: ["UpdateRecordSandboxRequestPack", "ReferralTransportSandboxManifest"],
    nonOwnedArtifacts: ["OutcomeIngestPipeline", "PharmacyDispatchAdapter"],
    producedInterfaces: ["UpdateRecordReadinessRequestFlow", "TransportSandboxVerificationRun"],
    dependsOnTracks: ["par_350", "par_352"],
    dependsOnContracts: [
      "data/analysis/341_phase5_blocker_ledger.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
      "prompt/shared_operating_contract_364_to_371.md",
    ],
    readinessReason:
      "Deferred, not ready. 367 is lawful only after dispatch and outcome pipelines exist, and current NHS onboarding boundaries keep Update Record and transport sandbox readiness environment-controlled instead of repo-local.",
    unlockRule:
      "Advance from deferred only after 350 and 352 complete, supported sandbox or PTL approvals exist, and updated operator evidence replaces manual-bridge assumptions.",
    mergeCriteria: [
      "Keep Update Record observation separate from outbound urgent-return communication law.",
      "Publish operator handoff packs and verification evidence for steps that cannot be automated end-to-end.",
    ],
    guardrails: [
      "Do not claim Vecells can send arbitrary Update Record traffic because sandbox docs exist.",
      "Do not collapse transport sandbox readiness into completed dispatch truth.",
    ],
    blockerRefs: ["BLK341_004"],
    carryForwardRefs: ["CF341_002", "CF341_003"],
    collisionSeamRefs: ["data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json"],
    ownerFamily: "environment",
    objectFamilies: ["environment", "dispatch", "outcome"],
    truthFamilies: ["environment_truth", "dispatch_truth", "outcome_truth"],
    audienceFamilies: ["operator", "release"],
    expectedSurfaceRoots: ["scripts/", "ops/"],
    validationRefs: ["future:validate_367_update_record_and_transport_readiness"],
    testRefs: ["tests/playwright/367_*"],
    currentGapIds: ["GAP345_004"],
    expectedDownstreamDependents: ["seq_368", "seq_369", "seq_370"],
  },
  {
    trackId: "seq_368",
    seq: 368,
    title: "Merge pharmacy loop with triage, portal, operations, and notifications",
    shortMission:
      "Integrate pharmacy cases into triage entry, request detail, patient account, operations views, and notification triggers without rewriting pharmacy truth.",
    domain: "integration",
    wave: "integration",
    readiness: "blocked",
    promptRef: "prompt/368.md",
    ownedArtifacts: ["PharmacyLoopMergeIntegration"],
    nonOwnedArtifacts: [
      "PharmacyCase",
      "PharmacyPatientStatusProjection",
      "PharmacyPracticeVisibilityProjection",
      "PharmacyConsoleWorkbenchView",
    ],
    producedInterfaces: ["PharmacyLoopProductMerge"],
    dependsOnTracks: ["par_346", "par_351", "par_354", "par_360", "par_363", "seq_366", "seq_367"],
    dependsOnContracts: [
      "prompt/shared_operating_contract_364_to_371.md",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    readinessReason:
      "Blocked because the merge is the first cross-family consumer of nearly every pharmacy truth surface. It cannot begin safely until backend truth, frontend routes, and bounded environment setup all exist.",
    unlockRule: "Unblock only after 346, 351, 354, 360, 363, 366, and 367 are complete and the gate is rerun.",
    mergeCriteria: [
      "Preserve request-lineage anchor and changed-since-seen continuity across triage, patient account, request detail, and operations surfaces.",
      "Integrate notifications and visibility without rewriting pharmacy business rules.",
    ],
    guardrails: [
      "Do not create a second merged pharmacy model.",
      "Do not treat the pharmacy loop as a detached subsystem or bypass its settled truth projections.",
    ],
    blockerRefs: ["BLK341_001", "BLK341_002", "BLK341_004"],
    carryForwardRefs: ["CF341_002", "CF341_003", "CF341_004", "CF341_006"],
    collisionSeamRefs: [],
    ownerFamily: "integration",
    objectFamilies: ["integration", "status", "visibility", "console"],
    truthFamilies: ["integration_truth", "status_truth", "visibility_truth", "console_truth"],
    audienceFamilies: ["patient", "staff", "practice", "operations", "release"],
    expectedSurfaceRoots: ["apps/", "packages/", "services/"],
    validationRefs: ["future:validate_368_pharmacy_loop_merge"],
    testRefs: ["tests/playwright/368_*", "tests/integration/368_*"],
    currentGapIds: ["GAP345_004"],
    expectedDownstreamDependents: ["seq_369", "seq_370", "seq_371"],
  },
  {
    trackId: "seq_369",
    seq: 369,
    title: "Eligibility, directory, dispatch, and outcome reconciliation suites",
    shortMission:
      "Run the authoritative Phase 6 proof battery for eligibility, provider choice, dispatch, and outcome reconciliation with machine-readable evidence.",
    domain: "testing",
    wave: "proof",
    readiness: "blocked",
    promptRef: "prompt/369.md",
    ownedArtifacts: ["Phase6EligibilityDispatchOutcomeProofBattery"],
    nonOwnedArtifacts: [
      "PathwayEligibilityEvaluation",
      "PharmacyChoiceProof",
      "PharmacyDispatchTruthProjection",
      "PharmacyOutcomeTruthProjection",
    ],
    producedInterfaces: ["Phase6TestEvidencePack_369"],
    dependsOnTracks: ["par_347", "par_348", "par_350", "par_352", "seq_368"],
    dependsOnContracts: [
      "prompt/shared_operating_contract_364_to_371.md",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    readinessReason:
      "Blocked because the proof battery is only meaningful after the executable pharmacy loop exists and is integrated into the product entry points.",
    unlockRule: "Unblock after 347, 348, 350, 352, and 368 complete.",
    mergeCriteria: [
      "Run real repository suites, fix repo-owned failures where feasible, and publish machine-readable evidence.",
      "Keep browser proof and backend truth chain aligned for eligibility, choice, dispatch, and outcomes.",
    ],
    guardrails: [
      "Do not downgrade the battery into a paper review or static checklist.",
      "Do not skip Playwright for browser-visible proof.",
    ],
    blockerRefs: ["BLK341_003", "BLK341_004"],
    carryForwardRefs: ["CF341_002", "CF341_003", "CF341_006"],
    collisionSeamRefs: [],
    ownerFamily: "proof",
    objectFamilies: ["proof", "policy", "choice", "dispatch", "outcome"],
    truthFamilies: ["proof_truth", "eligibility", "choice_truth", "dispatch_truth", "outcome_truth"],
    audienceFamilies: ["release", "operator", "staff", "patient"],
    expectedSurfaceRoots: ["tests/", "docs/testing/", "data/test-reports/"],
    validationRefs: ["future:validate_369_phase6_proof_battery"],
    testRefs: ["tests/integration/369_*", "tests/playwright/369_*"],
    currentGapIds: ["GAP345_004"],
    expectedDownstreamDependents: ["seq_370", "seq_371"],
  },
  {
    trackId: "seq_370",
    seq: 370,
    title: "Bounce-back, urgent return, practice visibility, and exception suites",
    shortMission:
      "Run the authoritative failure-safety proof battery for bounce-back, urgent return, practice visibility, provider health, and exceptions.",
    domain: "testing",
    wave: "proof",
    readiness: "blocked",
    promptRef: "prompt/370.md",
    ownedArtifacts: ["Phase6ReturnAndVisibilityProofBattery"],
    nonOwnedArtifacts: ["PharmacyBounceBackRecord", "PharmacyPracticeVisibilityProjection"],
    producedInterfaces: ["Phase6TestEvidencePack_370"],
    dependsOnTracks: ["par_353", "par_354", "seq_368"],
    dependsOnContracts: [
      "prompt/shared_operating_contract_364_to_371.md",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    readinessReason:
      "Blocked because safety failure proof requires executable bounce-back, return, visibility, and product merge behavior. There is nothing truthful to certify yet.",
    unlockRule: "Unblock after 353, 354, and 368 complete.",
    mergeCriteria: [
      "Keep urgent return and routine return visibly distinct in both browser and backend proof.",
      "Publish machine-readable defect logs and blocker rows for unresolved repo-owned failures.",
    ],
    guardrails: [
      "Do not reduce urgent-return proof to static screenshots.",
      "Do not treat exception visibility as a UI-only concern divorced from backend queue truth.",
    ],
    blockerRefs: ["BLK341_003", "BLK341_004"],
    carryForwardRefs: ["CF341_002", "CF341_003", "CF341_006"],
    collisionSeamRefs: [],
    ownerFamily: "proof",
    objectFamilies: ["proof", "return", "visibility"],
    truthFamilies: ["proof_truth", "return_truth", "visibility_truth"],
    audienceFamilies: ["release", "practice", "operations", "patient", "staff"],
    expectedSurfaceRoots: ["tests/", "docs/testing/", "data/test-reports/"],
    validationRefs: ["future:validate_370_phase6_return_visibility_battery"],
    testRefs: ["tests/integration/370_*", "tests/playwright/370_*"],
    currentGapIds: ["GAP345_004"],
    expectedDownstreamDependents: ["seq_371"],
  },
  {
    trackId: "seq_371",
    seq: 371,
    title: "Pharmacy console, patient status, and responsive accessibility suites",
    shortMission:
      "Run the final browser-proof battery for the pharmacy console, patient pharmacy routes, responsive fold behavior, and accessibility posture.",
    domain: "testing",
    wave: "proof",
    readiness: "blocked",
    promptRef: "prompt/371.md",
    ownedArtifacts: ["Phase6UiQualityProofBattery"],
    nonOwnedArtifacts: ["PharmacyConsoleWorkbenchView", "PharmacyStatusTrackerView", "PharmacyMissionStackLayout"],
    producedInterfaces: ["Phase6TestEvidencePack_371"],
    dependsOnTracks: ["par_356", "par_357", "par_358", "par_359", "par_360", "par_361", "par_362", "par_363", "par_364", "par_365", "seq_368"],
    dependsOnContracts: [
      "prompt/shared_operating_contract_364_to_371.md",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    readinessReason:
      "Blocked because the final UI proof battery depends on the completed shell family, patient routes, responsive hardening, and merged product continuity.",
    unlockRule: "Unblock only after 356 to 365 and 368 complete.",
    mergeCriteria: [
      "Run Playwright-driven responsive, accessibility, keyboard, and visual proof for the full pharmacy UI family.",
      "Keep same-shell continuity, reduced motion, and parity views explicit across calm and degraded states.",
    ],
    guardrails: [
      "Do not treat screenshot baselines alone as sufficient proof.",
      "Do not hide unresolved review or recovery states in calm visual snapshots.",
    ],
    blockerRefs: ["BLK341_003"],
    carryForwardRefs: ["CF341_006"],
    collisionSeamRefs: [],
    ownerFamily: "proof",
    objectFamilies: ["proof", "console", "status"],
    truthFamilies: ["proof_truth", "console_truth", "status_truth"],
    audienceFamilies: ["release", "patient", "staff", "practice", "operations", "pharmacy_console"],
    expectedSurfaceRoots: ["tests/", "docs/testing/", "data/test-reports/"],
    validationRefs: ["future:validate_371_phase6_ui_quality_battery"],
    testRefs: ["tests/playwright/371_*"],
    currentGapIds: ["GAP345_005"],
    expectedDownstreamDependents: [],
  },
];

const artifacts: ArtifactEntry[] = [
  {
    artifactId: "PharmacyCase",
    kind: "object",
    objectFamily: "case",
    truthFamily: "lineage",
    audienceFamilies: ["staff", "operations", "integration"],
    canonicalOwnerTrack: "par_346",
    consumerTracks: ["par_347", "par_348", "par_349", "par_350", "par_352", "seq_368"],
    authorityRefs: ["data/contracts/342_phase6_pharmacy_case_schema.json"],
    notes: "Canonical durable pharmacy aggregate and lifecycle root.",
  },
  {
    artifactId: "LineageCaseLink(caseFamily = pharmacy)",
    kind: "object",
    objectFamily: "case",
    truthFamily: "lineage",
    audienceFamilies: ["staff", "operations", "integration"],
    canonicalOwnerTrack: "par_346",
    consumerTracks: ["par_348", "par_352", "seq_368"],
    authorityRefs: ["data/contracts/342_phase6_pharmacy_case_schema.json", "data/contracts/342_phase6_case_state_machine.yaml"],
    notes: "Canonical child lineage registration for the pharmacy branch.",
  },
  {
    artifactId: "ServiceTypeDecision",
    kind: "object",
    objectFamily: "policy",
    truthFamily: "eligibility",
    audienceFamilies: ["staff", "integration"],
    canonicalOwnerTrack: "par_347",
    consumerTracks: ["par_346", "par_348", "par_349"],
    authorityRefs: ["data/contracts/342_phase6_pharmacy_case_schema.json"],
    notes: "Service lane and candidate pathway resolution result.",
  },
  {
    artifactId: "PathwayEligibilityEvaluation",
    kind: "object",
    objectFamily: "policy",
    truthFamily: "eligibility",
    audienceFamilies: ["staff", "patient", "integration"],
    canonicalOwnerTrack: "par_347",
    consumerTracks: ["par_346", "par_348", "par_357", "seq_369"],
    authorityRefs: ["data/contracts/342_phase6_pharmacy_case_schema.json", "data/contracts/342_phase6_rule_pack_schema.json"],
    notes: "Replay-safe eligibility record with matched rules and explanation refs.",
  },
  {
    artifactId: "PharmacyRulePack",
    kind: "object",
    objectFamily: "policy",
    truthFamily: "eligibility",
    audienceFamilies: ["staff", "release"],
    canonicalOwnerTrack: "par_347",
    consumerTracks: ["par_348", "par_349", "seq_369"],
    authorityRefs: ["data/contracts/342_phase6_rule_pack_schema.json"],
    notes: "Immutable effective-dated policy pack.",
  },
  {
    artifactId: "PathwayDefinition",
    kind: "object",
    objectFamily: "policy",
    truthFamily: "eligibility",
    audienceFamilies: ["staff", "release"],
    canonicalOwnerTrack: "par_347",
    consumerTracks: ["par_348", "seq_369"],
    authorityRefs: ["data/contracts/342_phase6_rule_pack_schema.json", "data/contracts/342_phase6_pathway_registry.json"],
    notes: "Single named pathway contract inside the pack.",
  },
  {
    artifactId: "PathwayTimingGuardrail",
    kind: "object",
    objectFamily: "policy",
    truthFamily: "eligibility",
    audienceFamilies: ["staff", "patient"],
    canonicalOwnerTrack: "par_347",
    consumerTracks: ["par_348", "par_349", "par_359"],
    authorityRefs: ["data/contracts/342_phase6_rule_pack_schema.json"],
    notes: "Delay and safety envelope attached to the selected pathway.",
  },
  {
    artifactId: "EligibilityExplanationBundle",
    kind: "object",
    objectFamily: "policy",
    truthFamily: "eligibility",
    audienceFamilies: ["patient", "staff"],
    canonicalOwnerTrack: "par_347",
    consumerTracks: ["par_357"],
    authorityRefs: ["data/contracts/342_phase6_explanation_bundle_schema.json"],
    notes: "Shared explanation family for patient and staff variants.",
  },
  {
    artifactId: "PharmacyDirectorySnapshot",
    kind: "object",
    objectFamily: "directory",
    truthFamily: "choice_truth",
    audienceFamilies: ["patient", "staff", "operations"],
    canonicalOwnerTrack: "par_348",
    consumerTracks: ["par_349", "par_358", "seq_366", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_directory_choice_schema.json"],
    notes: "Canonical normalized directory snapshot.",
  },
  {
    artifactId: "PharmacyDirectorySourceSnapshot",
    kind: "object",
    objectFamily: "directory",
    truthFamily: "choice_truth",
    audienceFamilies: ["staff", "operations", "operator"],
    canonicalOwnerTrack: "par_348",
    consumerTracks: ["seq_366", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_directory_choice_schema.json"],
    notes: "One source observation from a directory adapter execution.",
  },
  {
    artifactId: "PharmacyProviderCapabilitySnapshot",
    kind: "object",
    objectFamily: "directory",
    truthFamily: "choice_truth",
    audienceFamilies: ["patient", "staff", "operations"],
    canonicalOwnerTrack: "par_348",
    consumerTracks: ["par_349", "par_358", "seq_366", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_directory_choice_schema.json"],
    notes: "Normalized provider capability and availability posture.",
  },
  {
    artifactId: "PharmacyChoiceProof",
    kind: "object",
    objectFamily: "choice",
    truthFamily: "choice_truth",
    audienceFamilies: ["patient", "staff"],
    canonicalOwnerTrack: "par_348",
    consumerTracks: ["par_349", "par_358", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_directory_choice_schema.json"],
    notes: "Full valid-choice set plus advisory recommendation frontier.",
  },
  {
    artifactId: "PharmacyChoiceSession",
    kind: "object",
    objectFamily: "choice",
    truthFamily: "choice_truth",
    audienceFamilies: ["patient", "staff"],
    canonicalOwnerTrack: "par_348",
    consumerTracks: ["par_349", "par_358", "par_359"],
    authorityRefs: ["data/contracts/343_phase6_directory_choice_schema.json"],
    notes: "Durable selection and replay anchor for provider choice.",
  },
  {
    artifactId: "PharmacyConsentRecord",
    kind: "object",
    objectFamily: "choice",
    truthFamily: "choice_truth",
    audienceFamilies: ["patient", "staff"],
    canonicalOwnerTrack: "par_348",
    consumerTracks: ["par_349", "par_359"],
    authorityRefs: ["data/contracts/343_phase6_directory_choice_schema.json"],
    notes: "Durable consent capture and supersession truth.",
  },
  {
    artifactId: "PharmacyConsentCheckpoint",
    kind: "object",
    objectFamily: "choice",
    truthFamily: "choice_truth",
    audienceFamilies: ["patient", "staff"],
    canonicalOwnerTrack: "par_348",
    consumerTracks: ["par_349", "par_350", "par_359"],
    authorityRefs: ["data/contracts/343_phase6_directory_choice_schema.json"],
    notes: "Current consent checkpoint posture bound to choice truth.",
  },
  {
    artifactId: "PharmacyReferralPackage",
    kind: "object",
    objectFamily: "package",
    truthFamily: "package_truth",
    audienceFamilies: ["staff", "integration"],
    canonicalOwnerTrack: "par_349",
    consumerTracks: ["par_350", "par_359", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_dispatch_schema.json"],
    notes: "Immutable transport-neutral referral package.",
  },
  {
    artifactId: "PharmacyDispatchPlan",
    kind: "object",
    objectFamily: "dispatch",
    truthFamily: "dispatch_truth",
    audienceFamilies: ["staff", "practice", "operations", "operator"],
    canonicalOwnerTrack: "par_350",
    consumerTracks: ["par_351", "par_352", "par_359", "seq_366", "seq_367", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_dispatch_schema.json"],
    notes: "Governed dispatch plan bound to one frozen package.",
  },
  {
    artifactId: "PharmacyDispatchAttempt",
    kind: "object",
    objectFamily: "dispatch",
    truthFamily: "dispatch_truth",
    audienceFamilies: ["staff", "operations", "operator"],
    canonicalOwnerTrack: "par_350",
    consumerTracks: ["par_352", "par_359", "seq_367", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_dispatch_schema.json"],
    notes: "Live attempt family and retry/expiry truth.",
  },
  {
    artifactId: "DispatchProofEnvelope",
    kind: "object",
    objectFamily: "dispatch",
    truthFamily: "dispatch_truth",
    audienceFamilies: ["staff", "operations", "operator"],
    canonicalOwnerTrack: "par_350",
    consumerTracks: ["par_352", "par_359", "seq_367", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_dispatch_schema.json"],
    notes: "Authoritative proof aggregation and contradiction anchor.",
  },
  {
    artifactId: "PharmacyDispatchTruthProjection",
    kind: "projection",
    objectFamily: "dispatch",
    truthFamily: "dispatch_truth",
    audienceFamilies: ["patient", "staff", "practice", "operations"],
    canonicalOwnerTrack: "par_350",
    consumerTracks: ["par_351", "par_352", "par_354", "par_355", "par_359", "seq_368", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_dispatch_truth_projection_schema.json"],
    notes: "Patient-safe and staff-safe dispatch posture source.",
  },
  {
    artifactId: "PharmacyPatientStatusProjection",
    kind: "projection",
    objectFamily: "status",
    truthFamily: "status_truth",
    audienceFamilies: ["patient"],
    canonicalOwnerTrack: "par_351",
    consumerTracks: ["par_354", "par_356", "par_360", "seq_368", "seq_371"],
    authorityRefs: ["data/contracts/344_phase6_patient_status_schema.json"],
    notes: "Patient-safe macro-state and next-action truth.",
  },
  {
    artifactId: "OutcomeEvidenceEnvelope",
    kind: "object",
    objectFamily: "outcome",
    truthFamily: "outcome_truth",
    audienceFamilies: ["staff", "operations", "operator"],
    canonicalOwnerTrack: "par_352",
    consumerTracks: ["par_361", "seq_367", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_outcome_reconciliation_schema.json"],
    notes: "Normalized immutable pharmacy outcome evidence.",
  },
  {
    artifactId: "PharmacyOutcomeReconciliationGate",
    kind: "object",
    objectFamily: "outcome",
    truthFamily: "outcome_truth",
    audienceFamilies: ["staff", "operations"],
    canonicalOwnerTrack: "par_352",
    consumerTracks: ["par_353", "par_361", "seq_369"],
    authorityRefs: ["data/contracts/343_phase6_outcome_reconciliation_schema.json"],
    notes: "Closure-safe gate for strong match, weak review, and ambiguous outcomes.",
  },
  {
    artifactId: "PharmacyOutcomeTruthProjection",
    kind: "projection",
    objectFamily: "outcome",
    truthFamily: "outcome_truth",
    audienceFamilies: ["patient", "staff", "practice", "operations"],
    canonicalOwnerTrack: "par_352",
    consumerTracks: ["par_353", "par_354", "par_355", "par_361", "seq_368", "seq_369", "seq_370"],
    authorityRefs: ["data/contracts/343_phase6_outcome_truth_projection_schema.json"],
    notes: "Outcome truth projection for patient, staff, and console consumers.",
  },
  {
    artifactId: "PharmacyBounceBackRecord",
    kind: "object",
    objectFamily: "return",
    truthFamily: "return_truth",
    audienceFamilies: ["patient", "staff", "practice", "operations"],
    canonicalOwnerTrack: "par_353",
    consumerTracks: ["par_354", "par_360", "par_362", "seq_368", "seq_370"],
    authorityRefs: ["data/contracts/344_phase6_bounce_back_schema.json"],
    notes: "Typed bounce-back, urgent return, and reopen evidence root.",
  },
  {
    artifactId: "PharmacyReachabilityPlan",
    kind: "object",
    objectFamily: "return",
    truthFamily: "return_truth",
    audienceFamilies: ["patient", "staff", "practice", "operations"],
    canonicalOwnerTrack: "par_353",
    consumerTracks: ["par_351", "par_354", "par_360", "par_362", "seq_370"],
    authorityRefs: ["data/contracts/344_phase6_bounce_back_schema.json"],
    notes: "Reachability repair and contact-route revalidation plan.",
  },
  {
    artifactId: "PharmacyPracticeVisibilityProjection",
    kind: "projection",
    objectFamily: "visibility",
    truthFamily: "visibility_truth",
    audienceFamilies: ["practice", "operations"],
    canonicalOwnerTrack: "par_354",
    consumerTracks: ["par_356", "par_363", "seq_368", "seq_370"],
    authorityRefs: ["data/contracts/344_phase6_practice_visibility_schema.json"],
    notes: "Minimum-necessary practice-facing visibility model.",
  },
  {
    artifactId: "PharmacyOperationsQueueProjection",
    kind: "projection",
    objectFamily: "visibility",
    truthFamily: "visibility_truth",
    audienceFamilies: ["operations", "pharmacy_console"],
    canonicalOwnerTrack: "par_354",
    consumerTracks: ["par_356", "par_363", "seq_368", "seq_370"],
    authorityRefs: ["data/contracts/344_phase6_projection_registry.json"],
    notes: "Operations queue and exception view truth.",
  },
  {
    artifactId: "PharmacyConsoleWorklistProjection",
    kind: "projection",
    objectFamily: "console",
    truthFamily: "console_truth",
    audienceFamilies: ["pharmacy_console", "operations"],
    canonicalOwnerTrack: "par_355",
    consumerTracks: ["par_356", "par_363", "par_364", "seq_371"],
    authorityRefs: ["blueprint/pharmacy-console-frontend-architecture.md"],
    notes: "Dense console worklist and mission-entry projection.",
  },
  {
    artifactId: "PharmacyCaseWorkbenchProjection",
    kind: "projection",
    objectFamily: "console",
    truthFamily: "console_truth",
    audienceFamilies: ["pharmacy_console", "operations"],
    canonicalOwnerTrack: "par_355",
    consumerTracks: ["par_363", "par_364", "seq_371"],
    authorityRefs: ["blueprint/pharmacy-console-frontend-architecture.md"],
    notes: "Single-case mission frame projection for the console.",
  },
  {
    artifactId: "InventoryTruthPanelProjection",
    kind: "projection",
    objectFamily: "console",
    truthFamily: "console_truth",
    audienceFamilies: ["pharmacy_console", "operations"],
    canonicalOwnerTrack: "par_355",
    consumerTracks: ["par_363", "par_364"],
    authorityRefs: ["blueprint/pharmacy-console-frontend-architecture.md"],
    notes: "Inventory comparison and stock-truth projection family.",
  },
  {
    artifactId: "HandoffReadinessProjection",
    kind: "projection",
    objectFamily: "console",
    truthFamily: "console_truth",
    audienceFamilies: ["pharmacy_console", "operations"],
    canonicalOwnerTrack: "par_355",
    consumerTracks: ["par_363", "seq_371"],
    authorityRefs: ["blueprint/pharmacy-console-frontend-architecture.md"],
    notes: "Handoff readiness and support-region continuity truth.",
  },
];

const dependencyEdges: DependencyEdge[] = [
  {
    interfaceId: "EDGE345_001",
    producerTrack: "par_346",
    consumerTrack: "par_348",
    interfaceName: "PharmacyCaseKernel -> Choice Pipeline",
    artifactRefs: ["PharmacyCase", "LineageCaseLink(caseFamily = pharmacy)"],
    readinessStatus: "launch_ready",
    notes: "348 needs canonical case identity, fence, and lineage registration before binding provider choice.",
  },
  {
    interfaceId: "EDGE345_002",
    producerTrack: "par_347",
    consumerTrack: "par_348",
    interfaceName: "Eligibility Engine -> Choice Pipeline",
    artifactRefs: ["ServiceTypeDecision", "PathwayEligibilityEvaluation", "PathwayTimingGuardrail"],
    readinessStatus: "launch_ready",
    notes: "348 must consume selected pathway and timing guardrail instead of re-evaluating rules.",
  },
  {
    interfaceId: "EDGE345_003",
    producerTrack: "par_348",
    consumerTrack: "par_349",
    interfaceName: "Choice Truth -> Referral Package Composer",
    artifactRefs: ["PharmacyChoiceSession", "PharmacyConsentCheckpoint"],
    readinessStatus: "blocked_until_upstream",
    notes: "349 freezes package content only after real provider choice and consent truth exist.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
  },
  {
    interfaceId: "EDGE345_004",
    producerTrack: "par_349",
    consumerTrack: "par_350",
    interfaceName: "Immutable Package -> Dispatch Engine",
    artifactRefs: ["PharmacyReferralPackage"],
    readinessStatus: "blocked_until_upstream",
    notes: "350 may bind one frozen package to one plan, but may not mutate package truth.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
  },
  {
    interfaceId: "EDGE345_005",
    producerTrack: "par_350",
    consumerTrack: "par_351",
    interfaceName: "Dispatch Truth -> Patient Status",
    artifactRefs: ["PharmacyDispatchTruthProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "351 derives patient-safe next steps from dispatch truth and may not infer them locally.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_006",
    producerTrack: "par_350",
    consumerTrack: "par_352",
    interfaceName: "Dispatch Truth -> Outcome Reconciliation",
    artifactRefs: ["PharmacyDispatchPlan", "DispatchProofEnvelope", "PharmacyDispatchTruthProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "352 matches outcome evidence against canonical dispatch and proof anchors.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
  },
  {
    interfaceId: "EDGE345_007",
    producerTrack: "par_352",
    consumerTrack: "par_353",
    interfaceName: "Outcome Truth -> Bounce-back Engine",
    artifactRefs: ["PharmacyOutcomeReconciliationGate", "PharmacyOutcomeTruthProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "353 needs authoritative outcome ambiguity and settlement posture before return routing.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
  },
  {
    interfaceId: "EDGE345_008",
    producerTrack: "par_353",
    consumerTrack: "par_354",
    interfaceName: "Return Truth -> Practice Visibility",
    artifactRefs: ["PharmacyBounceBackRecord", "PharmacyReachabilityPlan"],
    readinessStatus: "blocked_until_upstream",
    notes: "354 must keep urgent return and reachability debt visible in operations and practice projections.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
  },
  {
    interfaceId: "EDGE345_009",
    producerTrack: "par_354",
    consumerTrack: "par_356",
    interfaceName: "Practice/Ops Projections -> Shell Hosts",
    artifactRefs: ["PharmacyPracticeVisibilityProjection", "PharmacyOperationsQueueProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "356 depends on server truth for queue-spine and attention surfaces.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_010",
    producerTrack: "par_355",
    consumerTrack: "par_356",
    interfaceName: "Console Support Region -> Shell Hosts",
    artifactRefs: ["PharmacyConsoleWorklistProjection", "PharmacyCaseWorkbenchProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "356 cannot host the mission frame truthfully before console support-region APIs exist.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_011",
    producerTrack: "par_347",
    consumerTrack: "par_357",
    interfaceName: "Explanation Bundle -> Explainer Views",
    artifactRefs: ["EligibilityExplanationBundle", "PathwayEligibilityEvaluation"],
    readinessStatus: "blocked_until_upstream",
    notes: "357 must read the same explanation bundle for patient and staff views.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_012",
    producerTrack: "par_348",
    consumerTrack: "par_358",
    interfaceName: "Choice Truth -> Patient Chooser",
    artifactRefs: ["PharmacyChoiceProof", "PharmacyChoiceSession"],
    readinessStatus: "blocked_until_upstream",
    notes: "358 consumes the full choice set and warned-choice truth from the server.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_013",
    producerTrack: "par_350",
    consumerTrack: "par_359",
    interfaceName: "Dispatch Truth -> Confirmation Views",
    artifactRefs: ["PharmacyDispatchTruthProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "359 shows authoritative transport and proof posture without inventing transport truth.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_014",
    producerTrack: "par_351",
    consumerTrack: "par_360",
    interfaceName: "Patient Status -> Instruction Journey",
    artifactRefs: ["PharmacyPatientStatusProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "360 uses patient-safe macro-state and next-step wording inputs from 351.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_015",
    producerTrack: "par_352",
    consumerTrack: "par_361",
    interfaceName: "Outcome Truth -> Assurance Views",
    artifactRefs: ["PharmacyOutcomeTruthProjection", "OutcomeEvidenceEnvelope"],
    readinessStatus: "blocked_until_upstream",
    notes: "361 needs authoritative confidence, manual-review, and close-block truth.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_016",
    producerTrack: "par_353",
    consumerTrack: "par_362",
    interfaceName: "Bounce-back Truth -> Recovery Views",
    artifactRefs: ["PharmacyBounceBackRecord", "PharmacyReachabilityPlan"],
    readinessStatus: "blocked_until_upstream",
    notes: "362 keeps urgent return, reopen diff, and loop-risk driven by server truth.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_017",
    producerTrack: "par_354",
    consumerTrack: "par_363",
    interfaceName: "Practice/Ops Truth -> Workbench UI",
    artifactRefs: ["PharmacyPracticeVisibilityProjection", "PharmacyOperationsQueueProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "363 scans active cases, waiting states, failures, and outages from server projections.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_018",
    producerTrack: "par_355",
    consumerTrack: "par_363",
    interfaceName: "Console Support Region -> Workbench UI",
    artifactRefs: ["PharmacyConsoleWorklistProjection", "InventoryTruthPanelProjection", "HandoffReadinessProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "363 renders stock truth, comparison, and handoff readiness from 355.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_019",
    producerTrack: "par_363",
    consumerTrack: "par_364",
    interfaceName: "Workbench UI -> Responsive Hardening",
    artifactRefs: ["PharmacyConsoleWorkbenchView"],
    readinessStatus: "blocked_until_upstream",
    notes: "364 hardens the real workbench under narrow-screen constraints.",
  },
  {
    interfaceId: "EDGE345_020",
    producerTrack: "par_356",
    consumerTrack: "par_365",
    interfaceName: "Shell Family -> Accessibility Hardening",
    artifactRefs: ["PharmacyShellFrame"],
    readinessStatus: "blocked_until_upstream",
    notes: "365 must refine real shell and route behavior rather than placeholders.",
  },
  {
    interfaceId: "EDGE345_021",
    producerTrack: "par_348",
    consumerTrack: "seq_366",
    interfaceName: "Choice Pipeline -> Credential Setup",
    artifactRefs: ["PharmacyDirectorySnapshot", "PharmacyProviderCapabilitySnapshot"],
    readinessStatus: "deferred",
    notes: "366 becomes actionable only after 348 exists and operator-controlled credentials are available.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_022",
    producerTrack: "par_350",
    consumerTrack: "seq_366",
    interfaceName: "Dispatch Engine -> Provider Credential Setup",
    artifactRefs: ["PharmacyDispatchPlan", "DispatchProofEnvelope"],
    readinessStatus: "deferred",
    notes: "366 configures provider credentials against the real dispatch adapter contract.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_023",
    producerTrack: "par_350",
    consumerTrack: "seq_367",
    interfaceName: "Dispatch Engine -> Transport Sandbox Readiness",
    artifactRefs: ["PharmacyDispatchPlan", "PharmacyDispatchAttempt"],
    readinessStatus: "deferred",
    notes: "367 requests transport sandboxes only for transport modes the repo actually supports.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_024",
    producerTrack: "par_352",
    consumerTrack: "seq_367",
    interfaceName: "Outcome Pipeline -> Update Record Readiness",
    artifactRefs: ["OutcomeEvidenceEnvelope", "PharmacyOutcomeReconciliationGate"],
    readinessStatus: "deferred",
    notes: "367 prepares observation-readiness packs around the real outcome ingest boundary.",
    seamRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
  },
  {
    interfaceId: "EDGE345_025",
    producerTrack: "par_351",
    consumerTrack: "seq_368",
    interfaceName: "Patient Status -> Product Merge",
    artifactRefs: ["PharmacyPatientStatusProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "368 needs patient-safe pharmacy status before merging patient account and request-detail continuity.",
  },
  {
    interfaceId: "EDGE345_026",
    producerTrack: "par_354",
    consumerTrack: "seq_368",
    interfaceName: "Practice/Ops Truth -> Product Merge",
    artifactRefs: ["PharmacyPracticeVisibilityProjection", "PharmacyOperationsQueueProjection"],
    readinessStatus: "blocked_until_upstream",
    notes: "368 integrates operations and changed-since-seen behavior against authoritative server truth.",
  },
  {
    interfaceId: "EDGE345_027",
    producerTrack: "seq_368",
    consumerTrack: "seq_369",
    interfaceName: "Merged Pharmacy Loop -> Proof Battery 369",
    artifactRefs: ["PharmacyLoopMergeIntegration"],
    readinessStatus: "blocked_until_upstream",
    notes: "369 certifies the merged eligibility, choice, dispatch, and outcome path, not detached subsystems.",
  },
  {
    interfaceId: "EDGE345_028",
    producerTrack: "seq_368",
    consumerTrack: "seq_370",
    interfaceName: "Merged Pharmacy Loop -> Proof Battery 370",
    artifactRefs: ["PharmacyLoopMergeIntegration"],
    readinessStatus: "blocked_until_upstream",
    notes: "370 proves return, visibility, and exception behavior in the actual product context.",
  },
  {
    interfaceId: "EDGE345_029",
    producerTrack: "seq_368",
    consumerTrack: "seq_371",
    interfaceName: "Merged Pharmacy Loop -> Final UI Proof Battery",
    artifactRefs: ["PharmacyLoopMergeIntegration"],
    readinessStatus: "blocked_until_upstream",
    notes: "371 is only meaningful after the merged pharmacy loop is visible across product routes.",
  },
];

const invalidationChains: InvalidationChain[] = [
  {
    chainId: "INV345_001",
    trigger: "Provider change, provider capability drift, or pathway change",
    invalidates: ["PharmacyConsentRecord", "PharmacyConsentCheckpoint", "PharmacyReferralPackage"],
    blockedOutcome: "Dispatch readiness must fail closed until choice and package truth are refreshed.",
    canonicalOwnerTracks: ["par_348", "par_349", "par_350"],
    proofLaw:
      "Provider or pathway change invalidates stale consent and stale package assumptions before dispatch can proceed.",
    refs: [
      "data/contracts/343_phase6_directory_choice_schema.json",
      "data/contracts/343_phase6_dispatch_schema.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
  },
  {
    chainId: "INV345_002",
    trigger: "Consent supersession, package supersession, or package hash drift",
    invalidates: ["PharmacyDispatchPlan", "PharmacyDispatchAttempt", "DispatchProofEnvelope"],
    blockedOutcome: "Any in-flight or pending dispatch must be treated as stale and non-authoritative.",
    canonicalOwnerTracks: ["par_349", "par_350"],
    proofLaw: "Stale consent or package drift invalidates dispatch readiness and current proof posture.",
    refs: [
      "data/contracts/343_phase6_dispatch_schema.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
  },
  {
    chainId: "INV345_003",
    trigger: "Outcome ambiguity, contradiction, or weak match review",
    invalidates: ["PharmacyOutcomeTruthProjection.closeEligibilityState", "PharmacyCase closure path"],
    blockedOutcome: "Closure and calm completion stay blocked until reconciliation settles.",
    canonicalOwnerTracks: ["par_352"],
    proofLaw: "Outcome ambiguity blocks closure and calm completion.",
    refs: [
      "data/contracts/343_phase6_outcome_reconciliation_schema.json",
      "data/contracts/343_phase6_outcome_truth_projection_schema.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
  },
  {
    chainId: "INV345_004",
    trigger: "Urgent return, no-contact return, or reachability repair failure",
    invalidates: ["PharmacyPatientStatusProjection.calmCopyAllowed", "PharmacyPracticeVisibilityProjection.calmCopyAllowed"],
    blockedOutcome: "Patient and practice posture must remain visibly non-calm while return debt or reachability repair stays open.",
    canonicalOwnerTracks: ["par_351", "par_353", "par_354"],
    proofLaw: "Urgent return or reachability failure invalidates calm patient or practice posture.",
    refs: [
      "data/contracts/344_phase6_bounce_back_schema.json",
      "data/contracts/344_phase6_patient_status_schema.json",
      "data/contracts/344_phase6_practice_visibility_schema.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
  },
  {
    chainId: "INV345_005",
    trigger: "Loop-risk escalation or reopen-review debt",
    invalidates: ["Automatic redispatch", "Close command"],
    blockedOutcome: "Automatic redispatch or close remains blocked until supervisor or review authority settles the case.",
    canonicalOwnerTracks: ["par_353", "par_350", "par_352"],
    proofLaw: "Loop-risk review blocks automatic redispatch or close.",
    refs: [
      "data/contracts/344_phase6_bounce_back_schema.json",
      "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    ],
  },
];

const gaps: GapEntry[] = [
  {
    gapId: "GAP345_001",
    area: "dispatch_outcome_bounce_back_boundary",
    severity: "high",
    status: "resolved_by_345",
    summary:
      "345 closes the repository-owned collision where dispatch, outcome, and bounce-back could otherwise appear to share one canonical owner. Ownership is now split across 350, 352, and 353 with an explicit seam file.",
    tracksInvolved: ["par_350", "par_352", "par_353"],
    canonicalOwner: "par_350",
    machineReadableRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
    blockerRefs: [],
    carryForwardRefs: [],
  },
  {
    gapId: "GAP345_002",
    area: "frontend_truth_consumption",
    severity: "high",
    status: "resolved_by_345",
    summary:
      "345 closes the repo-owned assumption that frontend tracks could infer backend truth vocabularies later. The dependency map and launch packets now pin every pharmacy UI surface to exact backend truth projections.",
    tracksInvolved: ["par_351", "par_354", "par_355", "par_356", "par_357", "par_358", "par_359", "par_360", "par_361", "par_362", "par_363"],
    canonicalOwner: "par_356",
    machineReadableRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
    blockerRefs: [],
    carryForwardRefs: [],
  },
  {
    gapId: "GAP345_003",
    area: "invalidation_chain_authority",
    severity: "high",
    status: "resolved_by_345",
    summary:
      "345 closes the repo-owned ambiguity around stale consent, stale package, outcome ambiguity, urgent return, and loop-risk invalidation chains. Those chains are now explicit and machine-readable.",
    tracksInvolved: ["par_348", "par_349", "par_350", "par_351", "par_352", "par_353", "par_354"],
    canonicalOwner: "par_349",
    machineReadableRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    blockerRefs: [],
    carryForwardRefs: [],
  },
  {
    gapId: "GAP345_004",
    area: "environment_onboarding_boundaries",
    severity: "medium",
    status: "launch_deferred",
    summary:
      "366 and 367 remain deferred because provider credential onboarding, Update Record readiness, and transport sandbox setup stay environment-controlled and inherit 341 manual-bridge constraints.",
    tracksInvolved: ["seq_366", "seq_367"],
    canonicalOwner: "seq_366",
    machineReadableRef: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
    blockerRefs: ["BLK341_004"],
    carryForwardRefs: ["CF341_002", "CF341_003", "CF341_004", "CF341_005"],
  },
  {
    gapId: "GAP345_005",
    area: "phase5_frontend_performance_hygiene",
    severity: "medium",
    status: "carried_forward",
    summary:
      "Phase 5 left large Vite chunk warnings open. They do not block 346 or 347, but they remain visible for the later pharmacy frontend and final proof tasks.",
    tracksInvolved: ["par_356", "par_363", "par_364", "par_365", "seq_371"],
    canonicalOwner: "par_356",
    blockerRefs: ["BLK341_003"],
    carryForwardRefs: ["CF341_006"],
  },
  {
    gapId: "GAP345_006",
    area: "readiness_row_label_drift",
    severity: "medium",
    status: "resolved_by_345",
    summary:
      "The checklist rows for 356 to 363 had drifted from the actual prompt files and shared contract. 345 corrected the labels so the gate board and registry do not launch the wrong frontend tracks.",
    tracksInvolved: ["par_356", "par_357", "par_358", "par_359", "par_360", "par_361", "par_362", "par_363"],
    canonicalOwner: SHORT_TASK_ID,
    blockerRefs: [],
    carryForwardRefs: [],
  },
];

const seamFiles: SeamFile[] = [
  {
    fileName: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
    payload: {
      taskId: TASK_ID,
      contractVersion: CONTRACT_VERSION,
      seamId: "PH6_GAP_OWNERSHIP_001",
      missingSurface: "Canonical owner split between dispatch proof, outcome reconciliation, and bounce-back return truth.",
      expectedOwnerTask: "par_350 / par_352 / par_353",
      temporaryFallback: "Fail closed and route all downstream consumers through the owner registry published by 345.",
      riskIfUnresolved: "A later track could collapse proof, outcome, and return into one calmer state or perform illegal writes to the wrong object family.",
      followUpAction: "All downstream tracks must consume the owner registry and may mutate only the families explicitly assigned here.",
      ownershipDiscipline: [
        {
          ownerTrack: "par_350",
          canonicalObjectFamilies: ["PharmacyDispatchPlan", "PharmacyDispatchAttempt", "DispatchProofEnvelope", "PharmacyDispatchTruthProjection"],
          mayWrite: true,
          mayConsume: ["PharmacyReferralPackage", "PharmacyConsentCheckpoint"],
        },
        {
          ownerTrack: "par_352",
          canonicalObjectFamilies: ["OutcomeEvidenceEnvelope", "PharmacyOutcomeReconciliationGate", "PharmacyOutcomeTruthProjection"],
          mayWrite: true,
          mayConsume: ["PharmacyDispatchTruthProjection"],
        },
        {
          ownerTrack: "par_353",
          canonicalObjectFamilies: ["PharmacyBounceBackRecord", "PharmacyReachabilityPlan"],
          mayWrite: true,
          mayConsume: ["PharmacyOutcomeTruthProjection", "PharmacyDispatchTruthProjection"],
        },
      ],
      sourceRefs: [
        "data/contracts/343_phase6_dispatch_schema.json",
        "data/contracts/343_phase6_outcome_reconciliation_schema.json",
        "data/contracts/344_phase6_bounce_back_schema.json",
      ],
    },
  },
  {
    fileName: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
    payload: {
      taskId: TASK_ID,
      contractVersion: CONTRACT_VERSION,
      seamId: "PH6_GAP_FRONTEND_001",
      missingSurface: "Explicit browser-consumption law for pharmacy truth projections.",
      expectedOwnerTask: "par_356",
      temporaryFallback: "Keep every frontend readiness row blocked until its owning backend truth projection exists and is named here.",
      riskIfUnresolved: "Frontend tracks could invent status, queue, or calmness semantics locally and diverge from the frozen contracts.",
      followUpAction: "All frontend prompts 356 to 365 must consume only the projection families listed here and must not derive truth from timers or browser-local booleans.",
      allowedProjectionConsumers: [
        {
          consumerTrack: "par_356",
          requiredTruth: ["PharmacyPatientStatusProjection", "PharmacyPracticeVisibilityProjection", "PharmacyConsoleWorklistProjection"],
        },
        {
          consumerTrack: "par_358",
          requiredTruth: ["PharmacyChoiceProof", "PharmacyChoiceSession"],
        },
        {
          consumerTrack: "par_359",
          requiredTruth: ["PharmacyDispatchTruthProjection", "PharmacyReferralPackage", "PharmacyConsentCheckpoint"],
        },
        {
          consumerTrack: "par_360",
          requiredTruth: ["PharmacyPatientStatusProjection", "PharmacyBounceBackRecord"],
        },
        {
          consumerTrack: "par_361",
          requiredTruth: ["PharmacyOutcomeTruthProjection", "OutcomeEvidenceEnvelope"],
        },
        {
          consumerTrack: "par_362",
          requiredTruth: ["PharmacyBounceBackRecord", "PharmacyReachabilityPlan"],
        },
        {
          consumerTrack: "par_363",
          requiredTruth: ["PharmacyPracticeVisibilityProjection", "PharmacyConsoleWorklistProjection", "InventoryTruthPanelProjection"],
        },
      ],
      sourceRefs: [
        "prompt/shared_operating_contract_356_to_363.md",
        "prompt/shared_operating_contract_364_to_371.md",
        "data/contracts/344_phase6_patient_status_schema.json",
        "data/contracts/344_phase6_practice_visibility_schema.json",
      ],
    },
  },
  {
    fileName: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    payload: {
      taskId: TASK_ID,
      contractVersion: CONTRACT_VERSION,
      seamId: "PH6_GAP_INVALIDATION_001",
      missingSurface: "Machine-readable invalidation-chain authority across choice, package, dispatch, outcome, and return truth.",
      expectedOwnerTask: "par_349",
      temporaryFallback: "Keep the invalidation chains published by 345 authoritative until downstream kernels land.",
      riskIfUnresolved: "Stale consent, stale packages, ambiguous outcomes, or urgent return debt could be treated as calm or current by later tracks.",
      followUpAction: "Tracks 348 to 354 must prove they consume these invalidation chains before merge.",
      invalidationChains: invalidationChains,
      sourceRefs: [
        "data/contracts/343_phase6_directory_choice_schema.json",
        "data/contracts/343_phase6_dispatch_schema.json",
        "data/contracts/343_phase6_outcome_reconciliation_schema.json",
        "data/contracts/344_phase6_bounce_back_schema.json",
        "data/contracts/344_phase6_patient_status_schema.json",
        "data/contracts/344_phase6_practice_visibility_schema.json",
      ],
    },
  },
  {
    fileName: "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
    payload: {
      taskId: TASK_ID,
      contractVersion: CONTRACT_VERSION,
      seamId: "PH6_GAP_ENV_001",
      missingSurface: "Environment-owned operator evidence for provider credentials, Update Record readiness, and referral transport sandboxes.",
      expectedOwnerTask: "seq_366 / seq_367",
      temporaryFallback: "Hold both tracks in deferred status and inherit the manual-bridge or review-required posture from 341.",
      riskIfUnresolved: "The repo could overclaim live-ready provider, transport, or Update Record parity that is not actually supported by current lawful operator evidence.",
      followUpAction: "Only reroute these tracks to ready when named operator evidence replaces the bounded carry-forward rows from 341.",
      inheritedBlockers: ["BLK341_004"],
      inheritedCarryForwardRefs: ["CF341_002", "CF341_003", "CF341_004", "CF341_005"],
      sourceRefs: [
        "data/analysis/341_phase5_blocker_ledger.json",
        "data/analysis/341_phase5_carry_forward_ledger.json",
      ],
    },
  },
];

const launchPackets: LaunchPacket[] = [
  {
    trackId: "par_346",
    objective:
      "Build the canonical Phase 6 pharmacy case kernel, lineage-case-link materialization, transition guard, fencing, and stale-owner recovery in production-shaped backend code.",
    authoritativeSourceSections: [
      "blueprint/phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine",
      "blueprint/phase-0-the-foundation-protocol.md#RequestLineage",
      "blueprint/phase-0-the-foundation-protocol.md#RequestLifecycleLease",
      "blueprint/phase-0-the-foundation-protocol.md#ScopedMutationGate",
      "docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md",
      "data/contracts/342_phase6_pharmacy_case_schema.json",
      "data/contracts/342_phase6_case_state_machine.yaml",
      "data/contracts/342_phase6_api_surface.yaml",
    ],
    objectOwnershipList: ["PharmacyCase", "LineageCaseLink(caseFamily = pharmacy)"],
    inputContracts: [
      "data/contracts/341_phase5_to_phase6_handoff_contract.json",
      "data/contracts/342_phase6_pharmacy_case_schema.json",
      "data/contracts/342_phase6_case_state_machine.yaml",
      "data/contracts/342_phase6_api_surface.yaml",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    forbiddenShortcuts: [
      "Do not create a detached pharmacy referral identifier outside canonical RequestLineage.",
      "Do not allow controller-local transition legality or stale-write checks.",
      "Do not bypass LifecycleCoordinator as the only request-closure authority.",
    ],
    expectedFileOrModuleGlobs: [
      "packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts",
      "packages/domains/pharmacy/src/index.ts",
      "packages/domains/pharmacy/tests/phase6-pharmacy-case-kernel.test.ts",
      "services/command-api/migrations/*pharmacy_case*.sql",
      "tests/integration/346_*",
      "tests/property/346_*",
      "tools/analysis/validate_346_pharmacy_case_kernel.ts",
    ],
    mandatoryTests: [
      "Typecheck the pharmacy domain package with no emit.",
      "Unit tests for state-transition legality, fence checks, and stale-owner recovery.",
      "Integration tests for create, evaluate entry, reopen, close-blocker enforcement, and migration replay.",
      "Property or replay tests for idempotency and stale-write rejection.",
    ],
    expectedDownstreamDependents: ["par_348", "par_349", "par_350", "par_352", "seq_368"],
    failClosedConditions: [
      "If the active ownership epoch or lineage fence is stale, reject mutation and preserve recovery posture.",
      "If closure blockers remain, close must fail even when case-local status appears resolved.",
      "If the pharmacy child link cannot be materialized canonically, case creation must fail rather than inventing an external identity.",
    ],
    currentGapsAndTemporarySeams: [
      "Consume the invalidation-chain seam from data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json.",
      "Keep dispatch, outcome, and bounce-back detail as typed refs only until 350, 352, and 353 land.",
    ],
    hardMergeCriteria: [
      "Schema compatibility: preserve every frozen PharmacyCase field and state value from 342.",
      "Migration safety: migration must be additive and replay-safe for stale-owner and transition history rows.",
      "Event and audit: append CommandActionRecord, IdempotencyRecord, and frozen event vocabulary without renaming.",
      "Stale-write and replay: prove idempotent create/evaluate/reopen/close handling under repeated commands.",
      "Redaction and telemetry: redact patient-sensitive payloads in audit or logs while preserving ref ids and state movement.",
    ],
  },
  {
    trackId: "par_347",
    objective:
      "Build the immutable Pharmacy First rule-pack compiler, deterministic eligibility evaluation engine, explanation bundle emission, and historical replay tooling.",
    authoritativeSourceSections: [
      "blueprint/phase-6-the-pharmacy-loop.md#6B. Eligibility engine, pathway rules, and versioned policy packs",
      "docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md",
      "data/contracts/342_phase6_rule_pack_schema.json",
      "data/contracts/342_phase6_pathway_registry.json",
      "data/contracts/342_phase6_threshold_family_registry.json",
      "data/contracts/342_phase6_explanation_bundle_schema.json",
    ],
    objectOwnershipList: [
      "ServiceTypeDecision",
      "PathwayEligibilityEvaluation",
      "PharmacyRulePack",
      "PathwayDefinition",
      "PathwayTimingGuardrail",
      "EligibilityExplanationBundle",
    ],
    inputContracts: [
      "data/contracts/341_phase5_to_phase6_handoff_contract.json",
      "data/contracts/342_phase6_rule_pack_schema.json",
      "data/contracts/342_phase6_pathway_registry.json",
      "data/contracts/342_phase6_threshold_family_registry.json",
      "data/contracts/342_phase6_explanation_bundle_schema.json",
      "data/contracts/345_phase6_track_readiness_registry.json",
    ],
    forbiddenShortcuts: [
      "Do not hard-code pack thresholds or fallback rules in service code.",
      "Do not mutate active packs in place.",
      "Do not generate separate patient and staff truth from different evaluation evidence.",
    ],
    expectedFileOrModuleGlobs: [
      "packages/domains/pharmacy/src/phase6-eligibility-policy-engine.ts",
      "packages/domains/pharmacy/src/index.ts",
      "packages/domains/pharmacy/tests/phase6-eligibility-policy-engine.test.ts",
      "services/command-api/migrations/*rule_pack*.sql",
      "data/fixtures/347_*",
      "tests/integration/347_*",
      "tests/property/347_*",
      "tools/analysis/validate_347_rule_pack_and_evaluation.ts",
    ],
    mandatoryTests: [
      "Typecheck the pharmacy domain package with no emit.",
      "Unit tests for pack compilation, linting, promotion, and retirement.",
      "Integration tests for deterministic pathway evaluation, fallback gating, and effective-date replay.",
      "Golden-case regression and pack-version comparison over the seven-pathway initial pack.",
    ],
    expectedDownstreamDependents: ["par_348", "par_349", "par_357", "seq_369"],
    failClosedConditions: [
      "If any threshold family, explanation reference, or timing guardrail binding is missing, compile and promotion must fail.",
      "If global-block conditions fire, evaluation must return ineligible immediately and may not bypass into fallback.",
      "If historical replay inputs cannot resolve the correct pack version, evaluation must fail instead of using code defaults.",
    ],
    currentGapsAndTemporarySeams: [
      "Consume the invalidation-chain seam from data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json.",
      "Expose typed outputs for 348 and 357 rather than allowing browser or controller-local recomputation.",
    ],
    hardMergeCriteria: [
      "Schema compatibility: preserve pathway, threshold, explanation, and promotion metadata from 342 exactly.",
      "Migration safety: create additive tables for packs, golden cases, evaluations, and compile hashes only.",
      "Event and audit: emit frozen pharmacy.pathway.evaluated and related audit evidence without redefining vocabulary.",
      "Stale-write and replay: prove deterministic evaluation for identical evidence snapshot + pack inputs.",
      "Redaction and telemetry: logs may expose rule ids and pack ids, but not raw patient symptom narratives beyond governed evidence refs.",
    ],
  },
];

const summary = {
  readyCount: tracks.filter((track) => track.readiness === "ready").length,
  blockedCount: tracks.filter((track) => track.readiness === "blocked").length,
  deferredCount: tracks.filter((track) => track.readiness === "deferred").length,
  trackCount: tracks.length,
};

const hardMergeCriteria = [
  "Only par_346 may canonically mutate PharmacyCase and the pharmacy LineageCaseLink; later tracks consume refs or emit typed deltas only.",
  "Only par_347 may canonically mutate ServiceTypeDecision, PathwayEligibilityEvaluation, PharmacyRulePack, PathwayDefinition, PathwayTimingGuardrail, and EligibilityExplanationBundle.",
  "Provider or pathway drift must invalidate consent and package truth before dispatch can proceed; no downstream track may bypass that invalidation chain.",
  "Dispatch proof, outcome reconciliation, and bounce-back return truth remain separate owners across par_350, par_352, and par_353.",
  "Frontend tracks 356 to 365 may consume only the pharmacy truth projections explicitly mapped here; they may not derive state from browser-local timers or booleans.",
  "seq_366 and seq_367 remain deferred until lawful operator evidence replaces the inherited manual-bridge boundaries from 341.",
  "Large Vite bundle warnings remain visible carry-forward debt for frontend and final proof tracks; do not reinterpret them as release clearance.",
  "No blocked or deferred track may be reclassified without rerunning the 345 validator against the new upstream state.",
];

const ownerMatrixRows = artifacts.map((artifact) => ({
  artifactId: artifact.artifactId,
  kind: artifact.kind,
  objectFamily: artifact.objectFamily,
  truthFamily: artifact.truthFamily,
  canonicalOwnerTrack: artifact.canonicalOwnerTrack,
  consumerTracks: artifact.consumerTracks.join("; "),
  authorityRefs: artifact.authorityRefs.join("; "),
  notes: artifact.notes,
}));

const consistencyRows: Record<string, unknown>[] = [
  {
    checkId: "CC345_001",
    category: "object_names",
    contractRef: "data/contracts/342_phase6_pharmacy_case_schema.json",
    subject: "PharmacyCase aggregate",
    evidence: "PharmacyCase title and required linkage refs remain frozen in 342 and are handed to 346 only.",
    ownerTrack: "par_346",
    status: "consistent",
  },
  {
    checkId: "CC345_002",
    category: "object_names",
    contractRef: "data/contracts/342_phase6_rule_pack_schema.json",
    subject: "Rule-pack object family",
    evidence: "PharmacyRulePack, PathwayDefinition, PathwayTimingGuardrail, and explanation bundle remain frozen together for 347.",
    ownerTrack: "par_347",
    status: "consistent",
  },
  {
    checkId: "CC345_003",
    category: "object_names",
    contractRef: "data/contracts/343_phase6_directory_choice_schema.json",
    subject: "Directory and choice object family",
    evidence: "Directory snapshots, capability snapshots, choice proof, consent record, and consent checkpoint are grouped under 348.",
    ownerTrack: "par_348",
    status: "consistent",
  },
  {
    checkId: "CC345_004",
    category: "object_names",
    contractRef: "data/contracts/343_phase6_dispatch_schema.json",
    subject: "Package and dispatch object family",
    evidence: "Immutable package ownership stays with 349; dispatch plan, attempt, proof, and truth stay with 350.",
    ownerTrack: "par_349/par_350",
    status: "consistent",
  },
  {
    checkId: "CC345_005",
    category: "object_names",
    contractRef: "data/contracts/343_phase6_outcome_reconciliation_schema.json",
    subject: "Outcome reconciliation object family",
    evidence: "Outcome evidence, reconciliation gate, and outcome truth projection stay grouped under 352.",
    ownerTrack: "par_352",
    status: "consistent",
  },
  {
    checkId: "CC345_006",
    category: "object_names",
    contractRef: "data/contracts/344_phase6_bounce_back_schema.json",
    subject: "Bounce-back object family",
    evidence: "Bounce-back record and reachability plan remain separated from outcome and dispatch truth for 353.",
    ownerTrack: "par_353",
    status: "consistent",
  },
  {
    checkId: "CC345_007",
    category: "state_vocabularies",
    contractRef: "data/contracts/342_phase6_case_state_machine.yaml",
    subject: "PharmacyCase.status",
    evidence: `342 freezes ${caseStateMachine.states.length} state ids from candidate_received to closed with additive-only law.`,
    ownerTrack: "par_346",
    status: "consistent",
  },
  {
    checkId: "CC345_008",
    category: "event_names",
    contractRef: "data/contracts/342_phase6_event_registry.json",
    subject: "Phase 6 pharmacy event vocabulary",
    evidence: `342 freezes ${eventRegistry342.events.length} event names and 344 adds return-specific events without renaming existing events.`,
    ownerTrack: "par_346/par_347/par_353",
    status: "consistent",
  },
  {
    checkId: "CC345_009",
    category: "threshold_families",
    contractRef: "data/contracts/342_phase6_threshold_family_registry.json",
    subject: "Eligibility threshold families",
    evidence: `342 freezes ${thresholdRegistry.thresholdFamilies.length} threshold families and forbids code defaults.`,
    ownerTrack: "par_347",
    status: "consistent",
  },
  {
    checkId: "CC345_010",
    category: "threshold_families",
    contractRef: "data/contracts/344_phase6_bounce_back_schema.json",
    subject: "Bounce-back threshold family",
    evidence: "344 freezes B_loop, tau_loop, tau_reopen_secondary, tau_contact_return, and nu_* weights for return law.",
    ownerTrack: "par_353",
    status: "consistent",
  },
  {
    checkId: "CC345_011",
    category: "algorithm_names",
    contractRef: "data/contracts/342_phase6_threshold_family_registry.json",
    subject: "Eligibility confidence and fallback formulas",
    evidence: "342 locks eligibilityConfidence(p,x) and fallbackScore(x) into immutable pack-owned evaluation law.",
    ownerTrack: "par_347",
    status: "consistent",
  },
  {
    checkId: "CC345_012",
    category: "algorithm_names",
    contractRef: "data/contracts/343_phase6_outcome_reconciliation_schema.json",
    subject: "Outcome matching formulas",
    evidence:
      "343 locks rawMatch(c,e), matchScore(c,e), and posterior(c | e) with explicit threshold values for strong and weak match handling.",
    ownerTrack: "par_352",
    status: "consistent",
  },
  {
    checkId: "CC345_013",
    category: "algorithm_names",
    contractRef: "data/contracts/344_phase6_bounce_back_schema.json",
    subject: "Bounce-back reopen formulas",
    evidence: "344 locks materialChange, loopRisk, reopenSignal, and reopenPriorityBand for return routing.",
    ownerTrack: "par_353",
    status: "consistent",
  },
  {
    checkId: "CC345_014",
    category: "binding_hashes_and_tuple_refs",
    contractRef: "data/contracts/343_phase6_dispatch_schema.json",
    subject: "Package and dispatch binding hashes",
    evidence:
      "PackageHash, packageFingerprint, and dispatchPlanHash remain explicit binding facts; downstream tracks may consume but not redefine them.",
    ownerTrack: "par_349/par_350",
    status: "consistent",
  },
  {
    checkId: "CC345_015",
    category: "binding_hashes_and_tuple_refs",
    contractRef: "data/contracts/342_phase6_api_surface.yaml",
    subject: "Evaluation idempotency tuple",
    evidence:
      "evaluatePharmacyCase remains idempotent on pharmacyCaseId + rulePackId + evidenceSnapshotHash; choose-provider remains idempotent on selectionBindingHash.",
    ownerTrack: "par_346/par_347",
    status: "consistent",
  },
  {
    checkId: "CC345_016",
    category: "audience_safe_projection_rules",
    contractRef: "data/contracts/344_phase6_patient_status_schema.json",
    subject: "Patient-safe status law",
    evidence:
      "344 keeps patient macro states server-derived and forbids frontend boolean inference or calm copy under weak review.",
    ownerTrack: "par_351",
    status: "consistent",
  },
  {
    checkId: "CC345_017",
    category: "audience_safe_projection_rules",
    contractRef: "data/contracts/344_phase6_practice_visibility_schema.json",
    subject: "Practice visibility law",
    evidence:
      "344 keeps minimum-necessary audience views server-enforced and forbids client-side hiding and calm completion copy while blocked.",
    ownerTrack: "par_354",
    status: "consistent",
  },
  {
    checkId: "CC345_018",
    category: "audience_safe_projection_rules",
    contractRef: "data/contracts/343_phase6_directory_choice_schema.json",
    subject: "Full-choice visibility law",
    evidence:
      "343 keeps noHiddenTopKLaw true and fullChoiceVisibilityLaw fixed as recommended_frontier_must_be_subset_of_full_visible_set.",
    ownerTrack: "par_348",
    status: "consistent",
  },
  {
    checkId: "CC345_019",
    category: "reserved_later_seams",
    contractRef: "docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md",
    subject: "342 reserved later-owned interfaces",
    evidence:
      "342 reserves choice, dispatch, and outcome detail for 343 and bounce-back, reachability, and visibility detail for 344 without flattening those owners into 346 or 347.",
    ownerTrack: SHORT_TASK_ID,
    status: "consistent",
  },
  {
    checkId: "CC345_020",
    category: "reserved_later_seams",
    contractRef: "data/contracts/344_phase6_projection_registry.json",
    subject: "Projection registry reserved owners",
    evidence:
      "344 already reserves PharmacyPatientStatusProjection for 351 and PharmacyPracticeVisibilityProjection for 354, which 345 now turns into readiness boundaries.",
    ownerTrack: SHORT_TASK_ID,
    status: "consistent",
  },
  {
    checkId: "CC345_021",
    category: "state_vocabularies",
    contractRef: "data/contracts/344_phase6_patient_status_schema.json",
    subject: "Patient macro states",
    evidence:
      "344 freezes five patient macro states and forbids timer-derived calmness, matching 351 and 360 ownership boundaries.",
    ownerTrack: "par_351/par_360",
    status: "consistent",
  },
  {
    checkId: "CC345_022",
    category: "state_vocabularies",
    contractRef: "data/contracts/344_phase6_practice_visibility_schema.json",
    subject: "Minimum-necessary audience views",
    evidence:
      "344 freezes summary_only, clinical_action_required, and operations_attention as the minimum-necessary audience tiers for 354 and 363 consumers.",
    ownerTrack: "par_354/par_363",
    status: "consistent",
  },
  {
    checkId: "CC345_023",
    category: "event_names",
    contractRef: "data/contracts/344_phase6_bounce_back_schema.json",
    subject: "Return-event vocabulary",
    evidence:
      "344 adds pharmacy.return.urgent_activated, pharmacy.return.routine_activated, pharmacy.reachability.plan.refreshed, and pharmacy.loop_risk.escalated under 353 ownership.",
    ownerTrack: "par_353",
    status: "consistent",
  },
];

const registry = {
  taskId: SHORT_TASK_ID,
  contractVersion: CONTRACT_VERSION,
  reviewedOn: REVIEWED_ON,
  gateVerdict: GATE_VERDICT,
  decisionStatement:
    "345 opens only the first executable Phase 6 backend wave. par_346 and par_347 are launch-ready now; every later track is blocked or deferred until upstream truth, UI, or environment boundaries become real.",
  firstWaveTrackIds: Array.from(FIRST_WAVE_TRACK_IDS),
  summary,
  inheritedPhase5ConstraintRefs: {
    blockerRefs: blockerLedger.map((entry) => entry.blockerId),
    carryForwardRefs: carryForwardLedger.map((entry) => entry.carryForwardId),
  },
  handoffRef: "data/contracts/341_phase5_to_phase6_handoff_contract.json",
  firstWaveObjective:
    "Stand up the executable pharmacy case kernel and immutable eligibility engine without semantic collisions around lineage, closure, or policy-pack authority.",
  hardMergeCriteria,
  seamRefs: seamFiles.map((entry) => entry.fileName),
  gapRefs: gaps.map((gap) => gap.gapId),
  tracks,
  artifactRegistry: artifacts,
  dependencyEdges,
  invalidationChains,
  codeSurfaceRegistry: tracks.flatMap((track) =>
    track.expectedSurfaceRoots.map((surfaceRoot) => ({
      surfaceRoot,
      canonicalOwnerTrack: track.trackId,
      readiness: track.readiness,
      domain: track.domain,
    })),
  ),
};

const launchPacketMap = new Map(launchPackets.map((packet) => [packet.trackId, packet]));
const trackMap = new Map(tracks.map((track) => [track.trackId, track]));

for (const seamFile of seamFiles) {
  writeJson(seamFile.fileName, seamFile.payload);
}

writeJson("data/contracts/345_phase6_track_readiness_registry.json", registry);
writeText(
  "data/contracts/345_phase6_dependency_interface_map.yaml",
  toYaml({
    taskId: TASK_ID,
    contractVersion: CONTRACT_VERSION,
    firstWaveTrackIds: Array.from(FIRST_WAVE_TRACK_IDS),
    dependencyEdges,
  }),
);
writeJson("data/analysis/345_external_reference_notes.json", {
  taskId: TASK_ID,
  reviewedOn: REVIEWED_ON,
  accessedOn: REVIEWED_ON,
  localSourceOfTruth: [
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/phase-cards.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/patient-portal-experience-architecture-blueprint.md",
    "blueprint/pharmacy-console-frontend-architecture.md",
    "blueprint/staff-operations-and-support-blueprint.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "data/contracts/341_phase5_to_phase6_handoff_contract.json",
    "docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md",
    "docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md",
    "docs/architecture/344_phase6_bounce_back_and_visibility_contracts.md",
  ],
  summary:
    "Accessed on 2026-04-23. External references were used only to calibrate current Playwright evidence patterns, current NHS pharmacy routing and Update Record boundary assumptions, and current NHS design-system guidance for dense operational boards. The repository blueprints and frozen 342 to 344 contract packs remained authoritative for product law.",
  sources: externalSources,
});
writeCsv(
  "data/analysis/345_phase6_contract_consistency_matrix.csv",
  ["checkId", "category", "contractRef", "subject", "evidence", "ownerTrack", "status"],
  consistencyRows,
);
writeCsv(
  "data/analysis/345_phase6_track_owner_matrix.csv",
  ["artifactId", "kind", "objectFamily", "truthFamily", "canonicalOwnerTrack", "consumerTracks", "authorityRefs", "notes"],
  ownerMatrixRows,
);
writeJson("data/analysis/345_phase6_parallel_gap_log.json", {
  taskId: TASK_ID,
  contractVersion: CONTRACT_VERSION,
  reviewedOn: REVIEWED_ON,
  gaps,
});

for (const launchPacket of launchPackets) {
  writeJson(
    `data/launchpacks/345_track_launch_packet_${launchPacket.trackId.replace("par_", "")}.json`,
    {
      taskId: TASK_ID,
      contractVersion: CONTRACT_VERSION,
      readinessVerdict: GATE_VERDICT,
      ...launchPacket,
    },
  );
}

const readyTrackRows = tracks
  .filter((track) => track.readiness === "ready")
  .map((track) => [
    track.trackId,
    track.title,
    track.shortMission,
    track.launchPacketRef ?? "n/a",
    track.dependsOnTracks.length === 0 ? "none" : track.dependsOnTracks.join(", "),
  ]);

const blockedTrackRows = tracks
  .filter((track) => track.readiness === "blocked")
  .map((track) => [
    track.trackId,
    track.title,
    track.dependsOnTracks.join(", ") || "none",
    track.unlockRule,
  ]);

const deferredTrackRows = tracks
  .filter((track) => track.readiness === "deferred")
  .map((track) => [
    track.trackId,
    track.title,
    track.dependsOnTracks.join(", ") || "none",
    unique([...track.blockerRefs, ...track.carryForwardRefs]).join(", "),
  ]);

const ownerRows = artifacts.map((artifact) => [
  artifact.artifactId,
  artifact.canonicalOwnerTrack,
  artifact.objectFamily,
  artifact.truthFamily,
  artifact.consumerTracks.join(", "),
]);

const invalidationRows = invalidationChains.map((entry) => [
  entry.chainId,
  entry.trigger,
  entry.invalidates.join(", "),
  entry.blockedOutcome,
  entry.canonicalOwnerTracks.join(", "),
]);

writeText(
  "docs/architecture/345_phase6_parallel_track_gate_and_dependency_map.md",
  `# 345 Phase 6 Parallel Track Gate And Dependency Map

Contract version: \`${CONTRACT_VERSION}\`

## Verdict

\`${GATE_VERDICT}\`

Only \`par_346\` and \`par_347\` are safe to open now.
They consume only the frozen Phase 6 contracts from \`342\` and the carried-forward Phase 5 foundation from \`341\`.
Every later track remains blocked or deferred until executable upstream truth exists or environment-owned operator evidence replaces the inherited manual bridge boundaries.

## Summary

- Ready now: ${summary.readyCount}
- Blocked: ${summary.blockedCount}
- Deferred: ${summary.deferredCount}
- Total tracked rows: ${summary.trackCount}

## Why the first wave is limited

- \`par_346\` owns the canonical pharmacy case kernel, lineage child link, and request-fence law.
- \`par_347\` owns immutable pack compilation, deterministic evaluation, and explanation bundles.
- \`par_348\` onward depend on executable outputs from that first wave, not just frozen schemas.
- \`seq_366\` and \`seq_367\` also inherit the explicit operator and manual-bridge boundaries carried from \`341\`.

## Launch-ready first wave

${markdownTable(["Track", "Title", "Mission", "Launch Packet", "Upstream Tracks"], readyTrackRows)}

## Blocked rows

${markdownTable(["Track", "Title", "Depends On", "Unlock Rule"], blockedTrackRows)}

## Deferred rows

${markdownTable(["Track", "Title", "Depends On", "Inherited Boundaries"], deferredTrackRows)}

## Exact object-to-owner registry

${markdownTable(["Artifact", "Owner", "Object Family", "Truth Family", "Consumers"], ownerRows)}

## Invalidation chains that 345 proves explicitly

${markdownTable(["Chain", "Trigger", "Invalidates", "Blocked Outcome", "Canonical Owners"], invalidationRows)}

## Hard merge criteria for the first wave

${hardMergeCriteria.map((line) => `- ${line}`).join("\n")}

## Repository-owned collisions resolved by 345

- \`GAP345_001\`: dispatch, outcome, and bounce-back now have distinct typed owners.
- \`GAP345_002\`: frontend tracks now have explicit backend truth dependencies instead of inferred booleans.
- \`GAP345_003\`: invalidation chains are now explicit and machine-readable.
- \`GAP345_006\`: frontend checklist labels for \`356\` to \`363\` were corrected to match the actual prompt files and shared contract.

## Still-open inherited constraints

${blockerLedger.map((entry) => `- ${entry.blockerId}: ${entry.title}`).join("\n")}

${carryForwardLedger.map((entry) => `- ${entry.carryForwardId}: ${entry.title}`).join("\n")}
`,
);

writeText(
  "docs/release/345_phase6_parallel_open_gate.md",
  `# 345 Phase 6 Parallel Open Gate

Gate verdict: \`${GATE_VERDICT}\`

## Decision

Phase 6 may start now, but only through the narrow first backend wave:

- \`par_346\` pharmacy case state machine and lineage linkage
- \`par_347\` eligibility engine and versioned policy-pack compiler

Everything else is held:

- \`348\` to \`365\`: \`blocked\`
- \`366\` and \`367\`: \`deferred\`
- \`368\` to \`371\`: \`blocked\`

## Why 345 fails closed

- package truth cannot start before real provider-choice and consent truth
- dispatch proof cannot start before immutable package truth
- outcome reconciliation cannot start before dispatch truth
- urgent return and reopen cannot start before outcome truth
- pharmacy UI cannot start before patient, practice, and console truth projections exist
- environment onboarding cannot overrule inherited manual-bridge and review-required boundaries

## Launch packets

- [345_track_launch_packet_346.json](/Users/test/Code/V/data/launchpacks/345_track_launch_packet_346.json)
- [345_track_launch_packet_347.json](/Users/test/Code/V/data/launchpacks/345_track_launch_packet_347.json)

## Machine-readable gate assets

- [345_phase6_track_readiness_registry.json](/Users/test/Code/V/data/contracts/345_phase6_track_readiness_registry.json)
- [345_phase6_dependency_interface_map.yaml](/Users/test/Code/V/data/contracts/345_phase6_dependency_interface_map.yaml)
- [345_phase6_parallel_gap_log.json](/Users/test/Code/V/data/analysis/345_phase6_parallel_gap_log.json)

## Explicit non-negotiables

- Do not let later tracks redefine \`PharmacyCase\`, \`PharmacyRulePack\`, \`PharmacyDispatchTruthProjection\`, \`PharmacyOutcomeTruthProjection\`, or \`PharmacyBounceBackRecord\`.
- Do not let frontend tracks infer truth vocabularies later.
- Do not let environment setup tasks overclaim readiness that still depends on operator-owned approvals.
- Do not reinterpret inherited Phase 5 blockers as resolved by narrative optimism.
`,
);

const interfaceRows = tracks.map((track) => [
  track.trackId,
  track.title,
  track.producedInterfaces.join(", "),
  track.dependsOnTracks.join(", ") || "none",
  track.expectedDownstreamDependents.join(", ") || "none",
]);

writeText(
  "docs/api/345_phase6_track_interface_registry.md",
  `# 345 Phase 6 Track Interface Registry

Contract version: \`${CONTRACT_VERSION}\`

This registry maps each Phase 6 track to the interfaces it is allowed to produce and the upstream tracks it must consume.

## Track interface map

${markdownTable(["Track", "Title", "Produced Interfaces", "Depends On Tracks", "Downstream Dependents"], interfaceRows)}

## Machine-readable ownership seams

${seamFiles.map((entry) => `- ${entry.fileName}`).join("\n")}

## Why this registry exists

- it prevents \`dispatch\`, \`outcome\`, and \`bounce-back\` from sharing one accidental owner
- it prevents frontend tracks from fabricating truth families later
- it prevents environment setup tasks from hiding operator-owned readiness boundaries
`,
);

function renderBoardHtml(): string {
  const boardData = {
    taskId: TASK_ID,
    visualMode: VISUAL_MODE,
    gateVerdict: GATE_VERDICT,
    summary,
    firstWaveTrackIds: Array.from(FIRST_WAVE_TRACK_IDS),
    tracks,
    artifacts,
    dependencyEdges,
    invalidationChains,
    gaps,
    blockers: blockerLedger,
    carryForward: carryForwardLedger,
    launchPackets,
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>345 Phase 6 Parallel Tracks Gate Board</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #F7F8FA;
        --shell: #EEF2F6;
        --panel: #FFFFFF;
        --inset: #E8EEF3;
        --text-strong: #0F172A;
        --text-default: #334155;
        --text-muted: #64748B;
        --ready: #0F766E;
        --blocked: #B42318;
        --deferred: #B7791F;
        --dependency: #3158E0;
        --risk: #5B61F6;
        --border: rgba(15, 23, 42, 0.09);
        --shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: linear-gradient(180deg, #f4f6f9 0%, var(--canvas) 100%);
        color: var(--text-default);
        font: 14px/1.55 "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      button,
      select {
        font: inherit;
      }

      .page-shell {
        max-width: 1760px;
        margin: 0 auto;
        padding: 24px;
      }

      .masthead {
        min-height: 72px;
        display: grid;
        gap: 14px;
        padding: 22px 24px;
        border: 1px solid var(--border);
        border-radius: 28px;
        background: linear-gradient(135deg, #ffffff 0%, #eef2f7 100%);
        box-shadow: var(--shadow);
      }

      .eyebrow {
        color: var(--dependency);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
        font-weight: 700;
      }

      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.2;
        color: var(--text-strong);
      }

      .masthead-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .meta-pill,
      .summary-band,
      .filter-pill,
      .track-chip,
      .dependency-chip,
      .audience-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        border: 1px solid rgba(49, 88, 224, 0.1);
        color: var(--text-default);
        white-space: nowrap;
      }

      .summary-strip {
        margin-top: 18px;
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .summary-band {
        min-width: 0;
        width: 100%;
        justify-content: space-between;
        padding: 16px 18px;
        background: var(--panel);
        border-radius: 22px;
        border: 1px solid var(--border);
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
      }

      .summary-band[data-tone="ready"] {
        border-color: rgba(15, 118, 110, 0.2);
      }

      .summary-band[data-tone="blocked"] {
        border-color: rgba(180, 35, 24, 0.18);
      }

      .summary-band[data-tone="deferred"] {
        border-color: rgba(183, 121, 31, 0.2);
      }

      .summary-band[data-tone="constraints"] {
        border-color: rgba(91, 97, 246, 0.2);
      }

      .summary-band strong {
        color: var(--text-strong);
        font-size: 24px;
        font-variant-numeric: tabular-nums;
      }

      .summary-band .label {
        display: grid;
        gap: 4px;
      }

      .summary-band small {
        color: var(--text-muted);
        font-size: 12px;
      }

      .toolbar {
        margin-top: 18px;
        padding: 16px 18px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: var(--panel);
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
        display: grid;
        gap: 14px;
      }

      .toolbar-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: end;
      }

      .filter-field {
        min-width: 180px;
        display: grid;
        gap: 6px;
      }

      .filter-field label {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 600;
      }

      .filter-field select {
        width: 100%;
        min-width: 0;
        padding: 11px 12px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: #f8fafc;
        color: var(--text-strong);
      }

      .board-grid {
        margin-top: 18px;
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr) 420px;
        gap: 16px;
        align-items: start;
      }

      .panel {
        min-width: 0;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--shadow);
      }

      .panel-header {
        padding: 18px 20px 0;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: baseline;
      }

      .panel-header h2 {
        margin: 0;
        font-size: 18px;
        color: var(--text-strong);
      }

      .panel-header small {
        color: var(--text-muted);
        font-size: 12px;
      }

      .track-list {
        padding: 16px 16px 18px;
        display: grid;
        gap: 10px;
      }

      .track-button,
      .graph-card-button,
      .parity-track-button {
        width: 100%;
        min-width: 0;
        border: 1px solid transparent;
        border-radius: 18px;
        background: var(--shell);
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
      }

      .track-button {
        padding: 14px 14px 14px 16px;
        display: grid;
        gap: 8px;
      }

      .track-button[data-active="true"],
      .graph-card-button[data-active="true"],
      .parity-track-button[data-active="true"] {
        border-color: rgba(49, 88, 224, 0.26);
        background: linear-gradient(135deg, #ffffff 0%, #eef3ff 100%);
      }

      .track-button:focus-visible,
      .graph-card-button:focus-visible,
      .parity-track-button:focus-visible,
      .filter-field select:focus-visible,
      .inspector-link:focus-visible,
      .toggle-button:focus-visible {
        outline: 3px solid rgba(49, 88, 224, 0.24);
        outline-offset: 2px;
      }

      .track-topline {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: baseline;
      }

      .track-title {
        color: var(--text-strong);
        font-weight: 700;
      }

      .track-id {
        color: var(--text-muted);
        font-size: 12px;
        font-variant-numeric: tabular-nums;
      }

      .track-mission {
        color: var(--text-default);
      }

      .track-meta-row,
      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        background: #fff;
        border: 1px solid rgba(15, 23, 42, 0.08);
        color: var(--text-muted);
        white-space: nowrap;
      }

      .chip[data-tone="ready"] { color: var(--ready); border-color: rgba(15, 118, 110, 0.16); }
      .chip[data-tone="blocked"] { color: var(--blocked); border-color: rgba(180, 35, 24, 0.16); }
      .chip[data-tone="deferred"] { color: var(--deferred); border-color: rgba(183, 121, 31, 0.18); }
      .chip[data-tone="dependency"] { color: var(--dependency); border-color: rgba(49, 88, 224, 0.18); }
      .chip[data-tone="risk"] { color: var(--risk); border-color: rgba(91, 97, 246, 0.16); }

      .canvas-content {
        padding: 16px 18px 18px;
        display: grid;
        gap: 14px;
      }

      .graph-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .graph-card-button {
        padding: 14px 16px;
        display: grid;
        gap: 10px;
        background: linear-gradient(135deg, #fbfdff 0%, #eef4fb 100%);
      }

      .graph-card-button[data-readiness="ready"] {
        box-shadow: inset 4px 0 0 rgba(15, 118, 110, 0.9);
      }

      .graph-card-button[data-readiness="blocked"] {
        box-shadow: inset 4px 0 0 rgba(180, 35, 24, 0.9);
      }

      .graph-card-button[data-readiness="deferred"] {
        box-shadow: inset 4px 0 0 rgba(183, 121, 31, 0.9);
      }

      .graph-card-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: start;
      }

      .graph-card-header strong {
        color: var(--text-strong);
      }

      .graph-card-meta {
        display: grid;
        gap: 6px;
      }

      .graph-card-meta small {
        font-size: 12px;
        color: var(--text-muted);
      }

      .graph-card-summary {
        color: var(--text-default);
      }

      .table-wrap {
        overflow-x: auto;
        border-radius: 18px;
        border: 1px solid rgba(15, 23, 42, 0.08);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 620px;
        table-layout: fixed;
      }

      th,
      td {
        padding: 12px 12px;
        vertical-align: top;
        text-align: left;
        border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      th {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
        background: #f9fbfd;
      }

      .parity-track-button {
        padding: 10px 12px;
        background: transparent;
        border-radius: 14px;
        text-align: left;
      }

      .inspector-body {
        padding: 16px 18px 18px;
        display: grid;
        gap: 16px;
      }

      .inspector-block {
        display: grid;
        gap: 10px;
        padding: 16px;
        border-radius: 18px;
        background: #f9fbfd;
        border: 1px solid rgba(15, 23, 42, 0.06);
      }

      .inspector-block h3 {
        margin: 0;
        font-size: 15px;
        color: var(--text-strong);
      }

      .inspector-list {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 8px;
      }

      .inspector-link {
        color: var(--dependency);
        text-decoration: none;
        word-break: break-word;
      }

      .toggle-button {
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 999px;
        background: white;
        padding: 8px 12px;
        cursor: pointer;
      }

      .lower-grid {
        margin-top: 16px;
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
        gap: 16px;
      }

      .empty-state {
        padding: 18px;
        border-radius: 18px;
        background: #fafbfd;
        border: 1px dashed rgba(15, 23, 42, 0.12);
        color: var(--text-muted);
      }

      [data-reduced-motion="true"] * {
        scroll-behavior: auto !important;
        animation-duration: 0ms !important;
        transition-duration: 0ms !important;
      }

      @media (max-width: 1540px) {
        .board-grid {
          grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
        }
        .board-grid > :last-child {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 1180px) {
        .summary-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .board-grid,
        .lower-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .page-shell {
          padding: 16px;
        }
        .summary-strip {
          grid-template-columns: 1fr;
        }
        .graph-grid {
          grid-template-columns: 1fr;
        }
        .panel-header,
        .toolbar-row {
          flex-direction: column;
          align-items: stretch;
        }
      }
    </style>
  </head>
  <body>
    <div
      class="page-shell"
      data-testid="Phase6ParallelGateBoard"
      data-visual-mode="${VISUAL_MODE}"
      data-ready-count="${summary.readyCount}"
      data-blocked-count="${summary.blockedCount}"
      data-deferred-count="${summary.deferredCount}"
    >
      <section class="masthead">
        <div class="eyebrow">Phase 6 Implementation Gate</div>
        <h1>Pharmacy loop launch board: exact owners, dependencies, and first-wave approval</h1>
        <div class="masthead-meta">
          <span class="meta-pill">Verdict: ${GATE_VERDICT}</span>
          <span class="meta-pill">Ready now: ${summary.readyCount}</span>
          <span class="meta-pill">Blocked: ${summary.blockedCount}</span>
          <span class="meta-pill">Deferred: ${summary.deferredCount}</span>
        </div>
      </section>

      <section class="summary-strip" data-testid="Phase6SummaryStrip"></section>

      <section class="toolbar panel" data-testid="Phase6Filters">
        <div class="toolbar-row" id="filter-row"></div>
        <div class="toolbar-row">
          <button class="toggle-button" type="button" id="reduced-motion-toggle">Reduced motion</button>
          <span class="chip" data-tone="dependency">All graph cards have adjacent table parity.</span>
          <span class="chip" data-tone="risk">Inherited Phase 5 constraints remain visible.</span>
        </div>
      </section>

      <section class="board-grid">
        <section class="panel" data-testid="Phase6TrackRail">
          <div class="panel-header">
            <h2>Track rail</h2>
            <small id="track-rail-count"></small>
          </div>
          <div class="track-list" id="track-list"></div>
        </section>

        <section class="panel" data-testid="Phase6DependencyCanvas">
          <div class="panel-header">
            <h2>Dependency and readiness canvas</h2>
            <small>Graph cards + parity table</small>
          </div>
          <div class="canvas-content">
            <div class="graph-grid" id="graph-grid"></div>
            <div class="table-wrap">
              <table data-testid="Phase6TrackParityTable">
                <thead>
                  <tr>
                    <th scope="col">Track</th>
                    <th scope="col">Readiness</th>
                    <th scope="col">Depends on</th>
                    <th scope="col">Unlock rule</th>
                  </tr>
                </thead>
                <tbody id="track-parity-body"></tbody>
              </table>
            </div>
            <div class="table-wrap">
              <table data-testid="Phase6DependencyParityTable">
                <thead>
                  <tr>
                    <th scope="col">Producer</th>
                    <th scope="col">Consumer</th>
                    <th scope="col">Interface</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody id="dependency-parity-body"></tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="panel" data-testid="Phase6LaunchInspector">
          <div class="panel-header">
            <h2 id="inspector-title">Inspector</h2>
            <small id="inspector-subtitle"></small>
          </div>
          <div class="inspector-body" id="inspector-body"></div>
        </section>
      </section>

      <section class="lower-grid">
        <section class="panel" data-testid="Phase6EvidenceTable">
          <div class="panel-header">
            <h2>Selected track evidence</h2>
            <small>Contracts, validators, tests, and inherited boundaries</small>
          </div>
          <div class="canvas-content">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Reference</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody id="evidence-body"></tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="panel" data-testid="Phase6GapTable">
          <div class="panel-header">
            <h2>Selected track gaps</h2>
            <small>Current seam files, blockers, and carry-forward rows</small>
          </div>
          <div class="canvas-content">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Gap or issue</th>
                    <th scope="col">Status</th>
                    <th scope="col">Summary</th>
                  </tr>
                </thead>
                <tbody id="gap-body"></tbody>
              </table>
            </div>
          </div>
        </section>
      </section>
    </div>

    <script>
      const boardData = ${embedJson(boardData)};
      const root = document.querySelector("[data-testid='Phase6ParallelGateBoard']");
      window.__phase6ParallelGateData = { loaded: false, data: boardData };

      const trackMap = new Map(boardData.tracks.map((track) => [track.trackId, track]));
      const gapMap = new Map(boardData.gaps.map((gap) => [gap.gapId, gap]));
      const launchPacketMap = new Map(boardData.launchPackets.map((packet) => [packet.trackId, packet]));

      const state = {
        activeTrackId: boardData.firstWaveTrackIds[0],
        filters: {
          status: "all",
          owner: "all",
          objectFamily: "all",
          truthFamily: "all",
          audienceFamily: "all",
        },
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      };

      const summaryContainer = document.querySelector("[data-testid='Phase6SummaryStrip']");
      const filterRow = document.getElementById("filter-row");
      const trackList = document.getElementById("track-list");
      const graphGrid = document.getElementById("graph-grid");
      const trackParityBody = document.getElementById("track-parity-body");
      const dependencyParityBody = document.getElementById("dependency-parity-body");
      const inspectorBody = document.getElementById("inspector-body");
      const evidenceBody = document.getElementById("evidence-body");
      const gapBody = document.getElementById("gap-body");
      const reducedMotionToggle = document.getElementById("reduced-motion-toggle");

      function toneFor(readiness) {
        if (readiness === "ready") return "ready";
        if (readiness === "deferred") return "deferred";
        return "blocked";
      }

      function optionsForFilters() {
        return {
          status: [
            ["all", "All statuses"],
            ["ready", "Ready"],
            ["blocked", "Blocked"],
            ["deferred", "Deferred"],
          ],
          owner: [["all", "All owners"], ...boardData.tracks.map((track) => [track.trackId, track.trackId + " " + track.title])],
          objectFamily: [["all", "All object families"], ...Array.from(new Set(boardData.tracks.flatMap((track) => track.objectFamilies))).sort().map((value) => [value, value.replaceAll("_", " ")])],
          truthFamily: [["all", "All truth families"], ...Array.from(new Set(boardData.tracks.flatMap((track) => track.truthFamilies))).sort().map((value) => [value, value.replaceAll("_", " ")])],
          audienceFamily: [["all", "All audience families"], ...Array.from(new Set(boardData.tracks.flatMap((track) => track.audienceFamilies))).sort().map((value) => [value, value.replaceAll("_", " ")])],
        };
      }

      function renderSummary() {
        summaryContainer.innerHTML = "";
        const bands = [
          ["ready", "Ready now", String(boardData.summary.readyCount), "Only the first executable backend wave is open."],
          ["blocked", "Blocked", String(boardData.summary.blockedCount), "These rows need executable upstream truth before any launch."],
          ["deferred", "Deferred", String(boardData.summary.deferredCount), "These rows depend on operator-controlled onboarding evidence."],
          ["constraints", "Inherited constraints", String(boardData.blockers.length + boardData.carryForward.length), "Phase 5 blockers and carry-forward items remain visible here."],
        ];
        for (const [tone, label, count, note] of bands) {
          const band = document.createElement("div");
          band.className = "summary-band";
          band.dataset.tone = tone;
          band.innerHTML =
            '<div class="label"><span>' +
            label +
            "</span><small>" +
            note +
            "</small></div><strong>" +
            count +
            "</strong>";
          summaryContainer.appendChild(band);
        }
      }

      function renderFilters() {
        filterRow.innerHTML = "";
        const optionMap = optionsForFilters();
        for (const [key, label] of [
          ["status", "Status"],
          ["owner", "Owner"],
          ["objectFamily", "Object family"],
          ["truthFamily", "Truth family"],
          ["audienceFamily", "Audience family"],
        ]) {
          const field = document.createElement("div");
          field.className = "filter-field";
          const select = document.createElement("select");
          select.name = key;
          select.setAttribute("aria-label", label);
          for (const [value, text] of optionMap[key]) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = text;
            if (state.filters[key] === value) option.selected = true;
            select.appendChild(option);
          }
          select.addEventListener("change", (event) => {
            state.filters[key] = event.target.value;
            ensureActiveTrack();
            render();
          });
          const fieldLabel = document.createElement("label");
          fieldLabel.textContent = label;
          field.appendChild(fieldLabel);
          field.appendChild(select);
          filterRow.appendChild(field);
        }
      }

      function filteredTracks() {
        return boardData.tracks.filter((track) => {
          if (state.filters.status !== "all" && track.readiness !== state.filters.status) return false;
          if (state.filters.owner !== "all" && track.trackId !== state.filters.owner) return false;
          if (state.filters.objectFamily !== "all" && !track.objectFamilies.includes(state.filters.objectFamily)) return false;
          if (state.filters.truthFamily !== "all" && !track.truthFamilies.includes(state.filters.truthFamily)) return false;
          if (state.filters.audienceFamily !== "all" && !track.audienceFamilies.includes(state.filters.audienceFamily)) return false;
          return true;
        });
      }

      function ensureActiveTrack() {
        const visibleTracks = filteredTracks();
        if (!visibleTracks.some((track) => track.trackId === state.activeTrackId)) {
          state.activeTrackId = visibleTracks[0]?.trackId ?? boardData.tracks[0].trackId;
        }
      }

      function activeTrack() {
        return trackMap.get(state.activeTrackId);
      }

      function activeEdges() {
        return boardData.dependencyEdges.filter(
          (edge) => edge.producerTrack === state.activeTrackId || edge.consumerTrack === state.activeTrackId,
        );
      }

      function setActiveTrack(trackId) {
        state.activeTrackId = trackId;
        render();
      }

      function renderTrackRail() {
        const visibleTracks = filteredTracks();
        document.getElementById("track-rail-count").textContent = visibleTracks.length + " visible rows";
        trackList.innerHTML = "";
        visibleTracks.forEach((track, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "track-button";
          button.dataset.id = track.trackId;
          button.dataset.readiness = track.readiness;
          button.dataset.active = String(track.trackId === state.activeTrackId);
          button.dataset.rovingGroup = "track-list";
          button.dataset.rovingIndex = String(index);
          button.innerHTML =
            '<div class="track-topline">' +
            '<span class="track-title">' +
            track.title +
            "</span>" +
            '<span class="track-id">' +
            track.trackId +
            "</span>" +
            "</div>" +
            '<div class="track-mission">' +
            track.shortMission +
            "</div>" +
            '<div class="track-meta-row">' +
            '<span class="chip" data-tone="' +
            toneFor(track.readiness) +
            '">' +
            track.readiness +
            "</span>" +
            '<span class="chip" data-tone="dependency">' +
            track.domain +
            "</span>" +
            '<span class="chip" data-tone="risk">' +
            track.objectFamilies.join(", ") +
            "</span>" +
            "</div>";
          button.addEventListener("click", () => setActiveTrack(track.trackId));
          button.addEventListener("keydown", handleRoving);
          trackList.appendChild(button);
        });
      }

      function renderGraphGrid() {
        const visibleTracks = filteredTracks();
        graphGrid.innerHTML = "";
        visibleTracks.forEach((track, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "graph-card-button";
          button.dataset.id = track.trackId;
          button.dataset.readiness = track.readiness;
          button.dataset.active = String(track.trackId === state.activeTrackId);
          button.dataset.rovingGroup = "graph-grid";
          button.dataset.rovingIndex = String(index);
          button.innerHTML =
            '<div class="graph-card-header">' +
            '<div class="graph-card-meta">' +
            "<strong>" +
            track.trackId +
            "</strong>" +
            "<small>" +
            track.title +
            "</small>" +
            "</div>" +
            '<span class="chip" data-tone="' +
            toneFor(track.readiness) +
            '">' +
            track.readiness +
            "</span>" +
            "</div>" +
            '<div class="graph-card-summary">' +
            track.shortMission +
            "</div>" +
            '<div class="chip-row">' +
            '<span class="chip" data-tone="dependency">' +
            track.dependsOnTracks.length +
            " deps</span>" +
            '<span class="chip" data-tone="risk">' +
            track.validationRefs.length +
            " validators</span>" +
            "</div>";
          button.addEventListener("click", () => setActiveTrack(track.trackId));
          button.addEventListener("keydown", handleRoving);
          graphGrid.appendChild(button);
        });
      }

      function renderTrackParityTable() {
        const visibleTracks = filteredTracks();
        trackParityBody.innerHTML = "";
        visibleTracks.forEach((track, index) => {
          const row = document.createElement("tr");
          row.innerHTML =
            '<td><button type="button" class="parity-track-button" data-id="' +
            track.trackId +
            '" data-active="' +
            String(track.trackId === state.activeTrackId) +
            '" data-roving-group="track-table" data-roving-index="' +
            index +
            '">' +
            track.trackId +
            " · " +
            track.title +
            "</button></td>" +
            '<td><span class="chip" data-tone="' +
            toneFor(track.readiness) +
            '">' +
            track.readiness +
            "</span></td>" +
            "<td>" +
            (track.dependsOnTracks.join(", ") || "none") +
            "</td>" +
            "<td>" +
            track.unlockRule +
            "</td>";
          trackParityBody.appendChild(row);
        });
        trackParityBody.querySelectorAll(".parity-track-button").forEach((button) => {
          button.addEventListener("click", () => setActiveTrack(button.dataset.id));
          button.addEventListener("keydown", handleRoving);
        });
      }

      function renderDependencyTable() {
        const edges = activeEdges();
        dependencyParityBody.innerHTML = "";
        if (edges.length === 0) {
          const row = document.createElement("tr");
          row.innerHTML = '<td colspan="4">No active dependency edges for this filtered selection.</td>';
          dependencyParityBody.appendChild(row);
          return;
        }
        edges.forEach((edge) => {
          const row = document.createElement("tr");
          row.innerHTML =
            "<td>" +
            edge.producerTrack +
            "</td><td>" +
            edge.consumerTrack +
            "</td><td>" +
            edge.interfaceName +
            "</td><td>" +
            edge.notes +
            "</td>";
          dependencyParityBody.appendChild(row);
        });
      }

      function renderInspector() {
        const track = activeTrack();
        const packet = launchPacketMap.get(track.trackId);
        document.getElementById("inspector-title").textContent = track.trackId + " · " + track.title;
        document.getElementById("inspector-subtitle").textContent =
          track.readiness + " · " + track.domain + " · " + track.wave;
        inspectorBody.innerHTML = "";

        const summaryBlock = document.createElement("section");
        summaryBlock.className = "inspector-block";
        summaryBlock.innerHTML =
          "<h3>Readiness</h3>" +
          '<div class="chip-row">' +
          '<span class="chip" data-tone="' +
          toneFor(track.readiness) +
          '">' +
          track.readiness +
          "</span>" +
          '<span class="chip" data-tone="dependency">' +
          track.ownerFamily +
          "</span>" +
          '<span class="chip" data-tone="risk">' +
          track.objectFamilies.join(", ") +
          "</span>" +
          "</div>" +
          "<div>" +
          track.readinessReason +
          "</div>" +
          "<div><strong>Unlock rule:</strong> " +
          track.unlockRule +
          "</div>";
        inspectorBody.appendChild(summaryBlock);

        const ownershipBlock = document.createElement("section");
        ownershipBlock.className = "inspector-block";
        ownershipBlock.innerHTML =
          "<h3>Ownership and interfaces</h3>" +
          "<div><strong>Owns:</strong> " +
          track.ownedArtifacts.join(", ") +
          "</div>" +
          "<div><strong>Consumes:</strong> " +
          (track.nonOwnedArtifacts.join(", ") || "none") +
          "</div>" +
          "<div><strong>Produces:</strong> " +
          track.producedInterfaces.join(", ") +
          "</div>" +
          "<div><strong>Surface roots:</strong> " +
          track.expectedSurfaceRoots.join(", ") +
          "</div>";
        inspectorBody.appendChild(ownershipBlock);

        const launchBlock = document.createElement("section");
        launchBlock.className = "inspector-block";
        if (packet) {
          launchBlock.innerHTML =
            "<h3>Launch packet</h3>" +
            "<div>" +
            packet.objective +
            "</div>" +
            "<div><strong>Downstream dependents:</strong> " +
            packet.expectedDownstreamDependents.join(", ") +
            "</div>" +
            "<div><strong>Fail-closed conditions:</strong></div>" +
            '<ul class="inspector-list">' +
            packet.failClosedConditions.map((line) => "<li>" + line + "</li>").join("") +
            "</ul>" +
            '<a class="inspector-link" href="/' +
            track.launchPacketRef +
            '" target="_blank" rel="noreferrer">Open launch packet</a>';
        } else {
          launchBlock.innerHTML =
            "<h3>Launch packet posture</h3>" +
            "<div>This track does not get a launch packet yet because it is not genuinely ready.</div>" +
            "<div><strong>Blocked by:</strong> " +
            (track.dependsOnTracks.join(", ") || "no upstream tracks") +
            "</div>";
        }
        inspectorBody.appendChild(launchBlock);

        const criteriaBlock = document.createElement("section");
        criteriaBlock.className = "inspector-block";
        criteriaBlock.innerHTML =
          "<h3>Merge criteria and guardrails</h3>" +
          '<ul class="inspector-list">' +
          track.mergeCriteria.map((line) => "<li>" + line + "</li>").join("") +
          "</ul>" +
          "<div><strong>Guardrails:</strong></div>" +
          '<ul class="inspector-list">' +
          track.guardrails.map((line) => "<li>" + line + "</li>").join("") +
          "</ul>";
        inspectorBody.appendChild(criteriaBlock);
      }

      function renderEvidenceTable() {
        const track = activeTrack();
        const evidenceRows = [
          ...track.dependsOnContracts.map((ref) => ["contract", ref, "Required frozen contract or source section."]),
          ...track.validationRefs.map((ref) => ["validator", ref, "Mandatory validator or future validator slot."]),
          ...track.testRefs.map((ref) => ["test", ref, "Required proof surface or future test family."]),
          ...track.blockerRefs.map((ref) => ["blocker", ref, "Inherited Phase 5 blocker still relevant to this track."]),
          ...track.carryForwardRefs.map((ref) => ["carry-forward", ref, "Inherited Phase 5 carry-forward boundary."]),
          ...track.collisionSeamRefs.map((ref) => ["seam", ref, "Machine-readable collision or dependency seam."]),
        ];
        evidenceBody.innerHTML = "";
        evidenceRows.forEach(([kind, ref, note]) => {
          const row = document.createElement("tr");
          row.innerHTML = "<td>" + kind + "</td><td><span>" + ref + "</span></td><td>" + note + "</td>";
          evidenceBody.appendChild(row);
        });
        if (evidenceRows.length === 0) {
          const row = document.createElement("tr");
          row.innerHTML = '<td colspan="3">No additional evidence rows for this track.</td>';
          evidenceBody.appendChild(row);
        }
      }

      function renderGapTable() {
        const track = activeTrack();
        const rows = [];
        for (const gapId of track.currentGapIds) {
          const gap = gapMap.get(gapId);
          if (gap) rows.push([gap.gapId, gap.status, gap.summary]);
        }
        for (const ref of track.blockerRefs) {
          const blocker = boardData.blockers.find((entry) => entry.blockerId === ref);
          if (blocker) rows.push([blocker.blockerId, blocker.status, blocker.summary]);
        }
        for (const ref of track.carryForwardRefs) {
          const carry = boardData.carryForward.find((entry) => entry.carryForwardId === ref);
          if (carry) rows.push([carry.carryForwardId, carry.status, carry.summary]);
        }
        gapBody.innerHTML = "";
        if (rows.length === 0) {
          const row = document.createElement("tr");
          row.innerHTML = '<td colspan="3">No active gap rows for this track.</td>';
          gapBody.appendChild(row);
          return;
        }
        rows.forEach(([id, status, summary]) => {
          const row = document.createElement("tr");
          row.innerHTML = "<td>" + id + "</td><td>" + status + "</td><td>" + summary + "</td>";
          gapBody.appendChild(row);
        });
      }

      function handleRoving(event) {
        const target = event.currentTarget;
        const group = target.dataset.rovingGroup;
        const index = Number(target.dataset.rovingIndex);
        const items = Array.from(document.querySelectorAll('[data-roving-group="' + group + '"]'));
        if (!items.length) return;
        let nextIndex = index;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = Math.min(items.length - 1, index + 1);
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = Math.max(0, index - 1);
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = items.length - 1;
        if (nextIndex !== index) {
          event.preventDefault();
          items[nextIndex].focus();
          items[nextIndex].click();
        }
      }

      function render() {
        ensureActiveTrack();
        root.setAttribute("data-active-track", state.activeTrackId);
        root.setAttribute("data-filter-status", state.filters.status);
        root.setAttribute("data-filter-owner", state.filters.owner);
        root.setAttribute("data-filter-object-family", state.filters.objectFamily);
        root.setAttribute("data-filter-truth-family", state.filters.truthFamily);
        root.setAttribute("data-filter-audience-family", state.filters.audienceFamily);
        root.setAttribute("data-reduced-motion", String(state.reducedMotion));
        reducedMotionToggle.textContent = state.reducedMotion ? "Reduced motion: on" : "Reduced motion: off";

        renderSummary();
        renderFilters();
        renderTrackRail();
        renderGraphGrid();
        renderTrackParityTable();
        renderDependencyTable();
        renderInspector();
        renderEvidenceTable();
        renderGapTable();
      }

      reducedMotionToggle.addEventListener("click", () => {
        state.reducedMotion = !state.reducedMotion;
        render();
      });

      render();
      window.__phase6ParallelGateData.loaded = true;
    </script>
  </body>
</html>`;
}

writeText("docs/frontend/345_phase6_parallel_tracks_gate_board.html", renderBoardHtml());
