import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const REQUIRED_FILES = [
  "docs/architecture/345_phase6_parallel_track_gate_and_dependency_map.md",
  "docs/release/345_phase6_parallel_open_gate.md",
  "docs/api/345_phase6_track_interface_registry.md",
  "docs/frontend/345_phase6_parallel_tracks_gate_board.html",
  "data/contracts/345_phase6_track_readiness_registry.json",
  "data/contracts/345_phase6_dependency_interface_map.yaml",
  "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
  "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
  "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
  "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
  "data/analysis/345_external_reference_notes.json",
  "data/analysis/345_phase6_contract_consistency_matrix.csv",
  "data/analysis/345_phase6_track_owner_matrix.csv",
  "data/analysis/345_phase6_parallel_gap_log.json",
  "data/launchpacks/345_track_launch_packet_346.json",
  "data/launchpacks/345_track_launch_packet_347.json",
  "tools/analysis/build_345_phase6_parallel_gate.ts",
  "tools/analysis/validate_phase6_parallel_gate.ts",
  "tests/playwright/345_phase6_parallel_tracks_gate_board.spec.ts",
  "data/analysis/341_phase5_blocker_ledger.json",
  "data/analysis/341_phase5_carry_forward_ledger.json",
  "data/contracts/341_phase5_to_phase6_handoff_contract.json",
  "data/contracts/342_phase6_pharmacy_case_schema.json",
  "data/contracts/342_phase6_rule_pack_schema.json",
  "data/contracts/343_phase6_directory_choice_schema.json",
  "data/contracts/343_phase6_dispatch_schema.json",
  "data/contracts/343_phase6_outcome_reconciliation_schema.json",
  "data/contracts/344_phase6_bounce_back_schema.json",
  "data/contracts/344_phase6_patient_status_schema.json",
  "data/contracts/344_phase6_practice_visibility_schema.json",
] as const;

const REQUIRED_SCRIPT =
  '"validate:345-phase6-parallel-gate": "pnpm exec tsx ./tools/analysis/validate_phase6_parallel_gate.ts"';

const REQUIRED_OWNER_MAP = {
  PharmacyCase: "par_346",
  "LineageCaseLink(caseFamily = pharmacy)": "par_346",
  ServiceTypeDecision: "par_347",
  PathwayEligibilityEvaluation: "par_347",
  PharmacyRulePack: "par_347",
  PathwayDefinition: "par_347",
  PathwayTimingGuardrail: "par_347",
  EligibilityExplanationBundle: "par_347",
  PharmacyDirectorySnapshot: "par_348",
  PharmacyDirectorySourceSnapshot: "par_348",
  PharmacyProviderCapabilitySnapshot: "par_348",
  PharmacyChoiceProof: "par_348",
  PharmacyChoiceSession: "par_348",
  PharmacyConsentRecord: "par_348",
  PharmacyConsentCheckpoint: "par_348",
  PharmacyReferralPackage: "par_349",
  PharmacyDispatchPlan: "par_350",
  PharmacyDispatchAttempt: "par_350",
  DispatchProofEnvelope: "par_350",
  PharmacyDispatchTruthProjection: "par_350",
  OutcomeEvidenceEnvelope: "par_352",
  PharmacyOutcomeReconciliationGate: "par_352",
  PharmacyOutcomeTruthProjection: "par_352",
  PharmacyBounceBackRecord: "par_353",
  PharmacyReachabilityPlan: "par_353",
  PharmacyPracticeVisibilityProjection: "par_354",
  PharmacyOperationsQueueProjection: "par_354",
} as const;

const REQUIRED_GAP_IDS = [
  "GAP345_001",
  "GAP345_002",
  "GAP345_003",
  "GAP345_004",
  "GAP345_005",
  "GAP345_006",
] as const;

const REQUIRED_CHAIN_IDS = [
  "INV345_001",
  "INV345_002",
  "INV345_003",
  "INV345_004",
  "INV345_005",
] as const;

const REQUIRED_NOTES_URLS = [
  "https://playwright.dev/docs/trace-viewer-intro",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/accessibility-testing",
  "https://playwright.dev/docs/emulation",
  "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/",
  "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/",
  "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
  "https://digital.nhs.uk/developer/api-catalogue/gp-connect-update-record",
  "https://service-manual.nhs.uk/design-system/components/table",
  "https://service-manual.nhs.uk/design-system/components/summary-list",
  "https://service-manual.nhs.uk/design-system/components/details",
] as const;

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  const filePath = path.join(ROOT, relativePath);
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${relativePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function parseCsv(relativePath: string): Record<string, string>[] {
  const text = read(relativePath).trim();
  requireCondition(text.length > 0, `CSV_EMPTY:${relativePath}`);
  const lines = text.split(/\r?\n/).filter(Boolean);
  requireCondition(lines.length >= 2, `CSV_MISSING_ROWS:${relativePath}`);

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function checklistStateByNumber(taskNumber: number): string {
  const checklist = fs.readFileSync(CHECKLIST_PATH, "utf8");
  const match = checklist.match(new RegExp(`^- \\[([ Xx-])\\] (?:seq|par)_${taskNumber}(?:_|\\b)`, "m"));
  requireCondition(match, `CHECKLIST_ROW_MISSING:${taskNumber}`);
  return match[1]!.toUpperCase();
}

function ensureRepoRefExists(ref: string, context: string): void {
  if (!ref || /^https?:\/\//.test(ref) || /^[A-Z]{3}\d/.test(ref)) return;
  const targetPath = path.join(ROOT, ref);
  requireCondition(fs.existsSync(targetPath), `REFERENCE_MISSING:${context}:${ref}`);
}

function ensureRepoRefsExist(refs: Iterable<string>, context: string): void {
  for (const ref of refs) ensureRepoRefExists(ref, context);
}

function validateChecklist(): void {
  for (let taskNumber = 341; taskNumber <= 344; taskNumber += 1) {
    requireCondition(checklistStateByNumber(taskNumber) === "X", `DEPENDENCY_INCOMPLETE:${taskNumber}`);
  }
  requireCondition(["-", "X"].includes(checklistStateByNumber(345)), "TASK_NOT_CLAIMED:345");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

function validatePackageScript(): void {
  requireCondition(read("package.json").includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:345-phase6-parallel-gate");
}

function validateRegistry(): void {
  const registry = readJson<any>("data/contracts/345_phase6_track_readiness_registry.json");
  requireCondition(registry.taskId === "seq_345", "REGISTRY_TASK_ID_DRIFT");
  requireCondition(registry.contractVersion === "345.phase6.parallel-gate.v1", "REGISTRY_CONTRACT_VERSION_DRIFT");
  requireCondition(registry.gateVerdict === "wave_1_open_with_constraints", "REGISTRY_VERDICT_DRIFT");
  requireCondition(
    JSON.stringify(registry.firstWaveTrackIds) === JSON.stringify(["par_346", "par_347"]),
    "FIRST_WAVE_TRACKS_DRIFT",
  );
  requireCondition(registry.summary.readyCount === 2, "READY_COUNT_DRIFT");
  requireCondition(registry.summary.blockedCount === 22, "BLOCKED_COUNT_DRIFT");
  requireCondition(registry.summary.deferredCount === 2, "DEFERRED_COUNT_DRIFT");
  requireCondition(registry.summary.trackCount === 26, "TRACK_COUNT_DRIFT");
  requireCondition(registry.tracks.length === 26, "TRACK_ARRAY_LENGTH_DRIFT");

  const trackMap = new Map(registry.tracks.map((track: any) => [track.trackId, track]));
  requireCondition(trackMap.get("par_346")?.readiness === "ready", "TRACK_STATUS_DRIFT:par_346");
  requireCondition(trackMap.get("par_347")?.readiness === "ready", "TRACK_STATUS_DRIFT:par_347");
  requireCondition(trackMap.get("par_356")?.readiness === "blocked", "TRACK_STATUS_DRIFT:par_356");
  requireCondition(trackMap.get("seq_366")?.readiness === "deferred", "TRACK_STATUS_DRIFT:seq_366");
  requireCondition(trackMap.get("seq_367")?.readiness === "deferred", "TRACK_STATUS_DRIFT:seq_367");
  requireCondition(trackMap.get("seq_371")?.readiness === "blocked", "TRACK_STATUS_DRIFT:seq_371");

  requireCondition(
    trackMap.get("par_356")?.title === "Pharmacy shell route family and console mission frame",
    "TRACK_TITLE_DRIFT:par_356",
  );
  requireCondition(
    trackMap.get("par_363")?.title === "Practice visibility operations panel and pharmacy-console workbench",
    "TRACK_TITLE_DRIFT:par_363",
  );

  const artifactMap = new Map(registry.artifactRegistry.map((artifact: any) => [artifact.artifactId, artifact]));
  for (const [artifactId, ownerTrack] of Object.entries(REQUIRED_OWNER_MAP)) {
    const artifact = artifactMap.get(artifactId);
    requireCondition(artifact, `ARTIFACT_MISSING:${artifactId}`);
    requireCondition(artifact.canonicalOwnerTrack === ownerTrack, `ARTIFACT_OWNER_DRIFT:${artifactId}`);
    ensureRepoRefsExist(artifact.authorityRefs ?? [], `artifact:${artifactId}`);
  }

  requireCondition(registry.invalidationChains.length === 5, "INVALIDATION_CHAIN_COUNT_DRIFT");
  for (const chainId of REQUIRED_CHAIN_IDS) {
    const chain = registry.invalidationChains.find((entry: any) => entry.chainId === chainId);
    requireCondition(chain, `INVALIDATION_CHAIN_MISSING:${chainId}`);
    ensureRepoRefsExist(chain.refs ?? [], `invalidation-chain:${chainId}`);
  }

  const gapIds = new Set(registry.gapRefs);
  for (const gapId of REQUIRED_GAP_IDS) {
    requireCondition(gapIds.has(gapId), `GAP_REF_MISSING:${gapId}`);
  }

  const seamRefs = new Set(registry.seamRefs);
  for (const seamRef of [
    "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json",
    "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json",
    "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json",
    "data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json",
  ]) {
    requireCondition(seamRefs.has(seamRef), `SEAM_REF_MISSING:${seamRef}`);
  }

  requireCondition(
    registry.inheritedPhase5ConstraintRefs.blockerRefs.length === 4,
    "INHERITED_BLOCKER_COUNT_DRIFT",
  );
  requireCondition(
    registry.inheritedPhase5ConstraintRefs.carryForwardRefs.length === 6,
    "INHERITED_CARRY_FORWARD_COUNT_DRIFT",
  );

  requireCondition(registry.codeSurfaceRegistry.length >= 20, "CODE_SURFACE_REGISTRY_TOO_SMALL");
}

function validateLaunchPackets(): void {
  for (const trackId of ["346", "347"]) {
    const packet = readJson<any>(`data/launchpacks/345_track_launch_packet_${trackId}.json`);
    requireCondition(packet.taskId === "seq_345_phase6_open_parallel_pharmacy_tracks_gate", `LAUNCH_PACKET_TASK_DRIFT:${trackId}`);
    requireCondition(packet.readinessVerdict === "wave_1_open_with_constraints", `LAUNCH_PACKET_VERDICT_DRIFT:${trackId}`);
    requireCondition(Array.isArray(packet.authoritativeSourceSections) && packet.authoritativeSourceSections.length >= 4, `LAUNCH_PACKET_SOURCES_DRIFT:${trackId}`);
    requireCondition(Array.isArray(packet.objectOwnershipList) && packet.objectOwnershipList.length >= 2, `LAUNCH_PACKET_OWNERSHIP_DRIFT:${trackId}`);
    requireCondition(Array.isArray(packet.expectedFileOrModuleGlobs) && packet.expectedFileOrModuleGlobs.length >= 4, `LAUNCH_PACKET_FILES_DRIFT:${trackId}`);
    requireCondition(Array.isArray(packet.mandatoryTests) && packet.mandatoryTests.length >= 4, `LAUNCH_PACKET_TESTS_DRIFT:${trackId}`);
    requireCondition(Array.isArray(packet.failClosedConditions) && packet.failClosedConditions.length >= 3, `LAUNCH_PACKET_FAIL_CLOSED_DRIFT:${trackId}`);
    requireCondition(Array.isArray(packet.hardMergeCriteria) && packet.hardMergeCriteria.length >= 5, `LAUNCH_PACKET_MERGE_CRITERIA_DRIFT:${trackId}`);
  }
}

function validateSeamFiles(): void {
  const ownershipSeam = readJson<any>("data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json");
  requireCondition(ownershipSeam.expectedOwnerTask === "par_350 / par_352 / par_353", "OWNERSHIP_SEAM_OWNER_DRIFT");
  requireCondition(Array.isArray(ownershipSeam.ownershipDiscipline) && ownershipSeam.ownershipDiscipline.length === 3, "OWNERSHIP_SEAM_DISCIPLINE_DRIFT");

  const frontendSeam = readJson<any>("data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json");
  requireCondition(frontendSeam.expectedOwnerTask === "par_356", "FRONTEND_SEAM_OWNER_DRIFT");
  requireCondition(Array.isArray(frontendSeam.allowedProjectionConsumers) && frontendSeam.allowedProjectionConsumers.length >= 6, "FRONTEND_SEAM_CONSUMERS_DRIFT");

  const invalidationSeam = readJson<any>("data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json");
  requireCondition(invalidationSeam.expectedOwnerTask === "par_349", "INVALIDATION_SEAM_OWNER_DRIFT");
  requireCondition(Array.isArray(invalidationSeam.invalidationChains) && invalidationSeam.invalidationChains.length === 5, "INVALIDATION_SEAM_CHAINS_DRIFT");

  const envSeam = readJson<any>("data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json");
  requireCondition(envSeam.expectedOwnerTask === "seq_366 / seq_367", "ENV_SEAM_OWNER_DRIFT");
  requireCondition(
    JSON.stringify(envSeam.inheritedBlockers) === JSON.stringify(["BLK341_004"]),
    "ENV_SEAM_BLOCKER_DRIFT",
  );
}

function validateMatrices(): void {
  const consistencyRows = parseCsv("data/analysis/345_phase6_contract_consistency_matrix.csv");
  requireCondition(consistencyRows.length >= 20, "CONSISTENCY_MATRIX_TOO_SMALL");
  const categories = new Set(consistencyRows.map((row) => row.category));
  for (const category of [
    "object_names",
    "state_vocabularies",
    "event_names",
    "threshold_families",
    "algorithm_names",
    "binding_hashes_and_tuple_refs",
    "audience_safe_projection_rules",
    "reserved_later_seams",
  ]) {
    requireCondition(categories.has(category), `CONSISTENCY_CATEGORY_MISSING:${category}`);
  }

  const ownerRows = parseCsv("data/analysis/345_phase6_track_owner_matrix.csv");
  for (const artifactId of Object.keys(REQUIRED_OWNER_MAP)) {
    const matches = ownerRows.filter((row) => row.artifactId === artifactId);
    requireCondition(matches.length === 1, `OWNER_MATRIX_ROW_COUNT_DRIFT:${artifactId}`);
    requireCondition(matches[0]!.canonicalOwnerTrack === REQUIRED_OWNER_MAP[artifactId as keyof typeof REQUIRED_OWNER_MAP], `OWNER_MATRIX_OWNER_DRIFT:${artifactId}`);
  }
}

function validateExternalNotes(): void {
  const notes = readJson<any>("data/analysis/345_external_reference_notes.json");
  requireCondition(notes.taskId === "seq_345_phase6_open_parallel_pharmacy_tracks_gate", "NOTES_TASK_ID_DRIFT");
  const urlSet = new Set((notes.sources ?? []).map((entry: any) => entry.url));
  for (const url of REQUIRED_NOTES_URLS) {
    requireCondition(urlSet.has(url), `EXTERNAL_REFERENCE_URL_MISSING:${url}`);
  }
}

function validateGapLog(): void {
  const gapLog = readJson<any>("data/analysis/345_phase6_parallel_gap_log.json");
  requireCondition(gapLog.taskId === "seq_345_phase6_open_parallel_pharmacy_tracks_gate", "GAP_LOG_TASK_ID_DRIFT");
  requireCondition(Array.isArray(gapLog.gaps) && gapLog.gaps.length === REQUIRED_GAP_IDS.length, "GAP_LOG_COUNT_DRIFT");
  for (const gapId of REQUIRED_GAP_IDS) {
    requireCondition(gapLog.gaps.some((entry: any) => entry.gapId === gapId), `GAP_LOG_ENTRY_MISSING:${gapId}`);
  }
}

function validateBoardHtml(): void {
  const html = read("docs/frontend/345_phase6_parallel_tracks_gate_board.html");
  for (const marker of [
    "data-testid=\"Phase6ParallelGateBoard\"",
    "data-testid=\"Phase6SummaryStrip\"",
    "data-testid=\"Phase6TrackRail\"",
    "data-testid=\"Phase6DependencyCanvas\"",
    "data-testid=\"Phase6LaunchInspector\"",
    "data-testid=\"Phase6EvidenceTable\"",
    "data-testid=\"Phase6GapTable\"",
    "data-testid=\"Phase6TrackParityTable\"",
    "data-testid=\"Phase6DependencyParityTable\"",
    "window.__phase6ParallelGateData",
    "data-ready-count=\"2\"",
    "data-blocked-count=\"22\"",
    "data-deferred-count=\"2\"",
  ]) {
    requireCondition(html.includes(marker), `BOARD_MARKER_MISSING:${marker}`);
  }
}

function validateDependencyMapYaml(): void {
  const yaml = read("data/contracts/345_phase6_dependency_interface_map.yaml");
  for (const snippet of [
    "taskId: seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    "contractVersion: 345.phase6.parallel-gate.v1",
    "producerTrack: par_346",
    "consumerTrack: par_348",
    "producerTrack: par_350",
    "consumerTrack: seq_367",
  ]) {
    requireCondition(yaml.includes(snippet), `DEPENDENCY_MAP_SNIPPET_MISSING:${snippet}`);
  }
}

function validateDocs(): void {
  const architectureDoc = read("docs/architecture/345_phase6_parallel_track_gate_and_dependency_map.md");
  requireCondition(architectureDoc.includes("GAP345_006"), "ARCHITECTURE_DOC_MISSING_CHECKLIST_FIX");
  requireCondition(architectureDoc.includes("par_346"), "ARCHITECTURE_DOC_MISSING_READY_TRACK");

  const releaseDoc = read("docs/release/345_phase6_parallel_open_gate.md");
  requireCondition(releaseDoc.includes("346") && releaseDoc.includes("347"), "RELEASE_DOC_MISSING_FIRST_WAVE");
  requireCondition(releaseDoc.includes("366") && releaseDoc.includes("367"), "RELEASE_DOC_MISSING_DEFERRED_TRACKS");

  const apiDoc = read("docs/api/345_phase6_track_interface_registry.md");
  requireCondition(apiDoc.includes("Track interface map"), "API_DOC_MISSING_INTERFACE_MAP");
  requireCondition(apiDoc.includes("par_363"), "API_DOC_MISSING_FRONTEND_TRACK");
}

function main(): void {
  validateChecklist();
  validateRequiredFiles();
  validatePackageScript();
  validateRegistry();
  validateLaunchPackets();
  validateSeamFiles();
  validateMatrices();
  validateExternalNotes();
  validateGapLog();
  validateBoardHtml();
  validateDependencyMapYaml();
  validateDocs();
  console.log("validate_phase6_parallel_gate: ok");
}

main();
