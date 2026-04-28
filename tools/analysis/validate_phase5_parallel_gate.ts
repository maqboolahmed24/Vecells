import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const REQUIRED_FILES = [
  path.join(ROOT, "docs", "architecture", "314_phase5_parallel_track_gate_and_dependency_map.md"),
  path.join(ROOT, "docs", "release", "314_phase5_parallel_open_gate.md"),
  path.join(ROOT, "docs", "api", "314_phase5_track_interface_registry.md"),
  path.join(ROOT, "docs", "frontend", "314_phase5_parallel_tracks_gate_board.html"),
  path.join(ROOT, "data", "contracts", "314_phase5_track_readiness_registry.json"),
  path.join(ROOT, "data", "contracts", "314_phase5_dependency_interface_map.yaml"),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
  ),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
  ),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
  ),
  path.join(ROOT, "data", "analysis", "314_external_reference_notes.json"),
  path.join(ROOT, "data", "analysis", "314_phase5_contract_consistency_matrix.csv"),
  path.join(ROOT, "data", "analysis", "314_phase5_track_owner_matrix.csv"),
  path.join(ROOT, "data", "analysis", "314_phase5_parallel_gap_log.json"),
  path.join(ROOT, "data", "launchpacks", "314_track_launch_packet_315.json"),
  path.join(ROOT, "data", "launchpacks", "314_track_launch_packet_316.json"),
  path.join(ROOT, "data", "launchpacks", "314_track_launch_packet_317.json"),
  path.join(ROOT, "tools", "analysis", "build_314_phase5_parallel_gate.ts"),
  path.join(ROOT, "tools", "analysis", "validate_phase5_parallel_gate.ts"),
  path.join(ROOT, "tests", "playwright", "314_phase5_parallel_tracks_gate_board.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:314-phase5-parallel-gate": "pnpm exec tsx ./tools/analysis/validate_phase5_parallel_gate.ts"';

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseJson<T>(filePath: string): T {
  return JSON.parse(read(filePath)) as T;
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  requireCondition(lines.length > 1, "CSV_MISSING_ROWS");

  const parseLine = (line: string) => {
    const cells: string[] = [];
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
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function validateChecklist() {
  const checklist = read(CHECKLIST_PATH);
  requireCondition(
    checklist.includes("- [-] seq_314_phase5_open_parallel_network_tracks_gate") ||
      checklist.includes("- [X] seq_314_phase5_open_parallel_network_tracks_gate"),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:seq_314",
  );
}

function validatePackageScript() {
  const packageJson = read(PACKAGE_JSON_PATH);
  requireCondition(packageJson.includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:314");
}

function validateRegistry() {
  const registry = parseJson<any>(
    path.join(ROOT, "data", "contracts", "314_phase5_track_readiness_registry.json"),
  );
  requireCondition(registry.taskId === "seq_314", "REGISTRY_TASK_ID_DRIFT");
  requireCondition(
    registry.contractVersion === "314.phase5.parallel-gate.v1",
    "REGISTRY_CONTRACT_VERSION_DRIFT",
  );
  requireCondition(
    registry.gateVerdict === "wave_1_open_with_constraints",
    "REGISTRY_GATE_VERDICT_DRIFT",
  );

  const expectedFirstWave = ["par_315", "par_316", "par_317"];
  requireCondition(
    JSON.stringify(registry.firstWaveTrackIds) === JSON.stringify(expectedFirstWave),
    "FIRST_WAVE_TRACK_IDS_DRIFT",
  );

  requireCondition(registry.summary.readyCount === 3, "READY_COUNT_DRIFT");
  requireCondition(registry.summary.blockedCount === 21, "BLOCKED_COUNT_DRIFT");
  requireCondition(registry.summary.deferredCount === 2, "DEFERRED_COUNT_DRIFT");
  requireCondition(registry.summary.trackCount === 26, "TRACK_COUNT_DRIFT");

  const trackMap = new Map(registry.tracks.map((track: any) => [track.trackId, track]));
  requireCondition(trackMap.size === 26, "TRACK_MAP_SIZE_DRIFT");
  requireCondition(trackMap.get("par_315")?.readiness === "ready", "TRACK_READY_DRIFT:par_315");
  requireCondition(trackMap.get("par_316")?.readiness === "ready", "TRACK_READY_DRIFT:par_316");
  requireCondition(trackMap.get("par_317")?.readiness === "ready", "TRACK_READY_DRIFT:par_317");
  requireCondition(trackMap.get("seq_335")?.readiness === "deferred", "TRACK_DEFERRED_DRIFT:seq_335");
  requireCondition(trackMap.get("seq_336")?.readiness === "deferred", "TRACK_DEFERRED_DRIFT:seq_336");
  requireCondition(trackMap.get("seq_340")?.readiness === "blocked", "TRACK_BLOCKED_DRIFT:seq_340");

  const deferredTracks = registry.tracks.filter((track: any) => track.readiness === "deferred");
  requireCondition(
    deferredTracks.length === 2 &&
      deferredTracks.every((track: any) => ["seq_335", "seq_336"].includes(track.trackId)),
    "DEFERRED_TRACK_SET_DRIFT",
  );

  const artifactMap = new Map(
    registry.artifactRegistry.map((artifact: any) => [artifact.artifactId, artifact]),
  );
  const truthProjection = artifactMap.get("HubOfferToConfirmationTruthProjection");
  requireCondition(
    truthProjection?.canonicalOwnerTrack === "par_321",
    "TRUTH_PROJECTION_OWNER_DRIFT",
  );
  requireCondition(
    Array.isArray(truthProjection?.facetOwners) &&
      truthProjection.facetOwners.length === 6 &&
      truthProjection.facetOwners.some((entry: any) => entry.ownerTrack === "par_320") &&
      truthProjection.facetOwners.some((entry: any) => entry.ownerTrack === "par_325"),
    "TRUTH_PROJECTION_FACET_OWNERS_DRIFT",
  );

  const mirrorState = artifactMap.get("HubSupplierMirrorState");
  requireCondition(
    mirrorState?.canonicalOwnerTrack === "par_325",
    "SUPPLIER_MIRROR_OWNER_DRIFT",
  );
  requireCondition(
    Array.isArray(mirrorState?.facetOwners) &&
      mirrorState.facetOwners.some(
        (entry: any) =>
          entry.ownerTrack === "par_321" && entry.mode === "bootstrap_request_only",
      ) &&
      mirrorState.facetOwners.some(
        (entry: any) => entry.ownerTrack === "par_325" && entry.mode === "canonical_writer",
      ),
    "SUPPLIER_MIRROR_FACET_OWNERS_DRIFT",
  );

  const exception = artifactMap.get("HubCoordinationException");
  requireCondition(
    exception?.canonicalOwnerTrack === "par_323",
    "HUB_EXCEPTION_OWNER_DRIFT",
  );
  requireCondition(
    Array.isArray(exception?.facetOwners) &&
      exception.facetOwners.some(
        (entry: any) => entry.ownerTrack === "par_325" && entry.mode === "worker_outcome_only",
      ),
    "HUB_EXCEPTION_FACET_OWNERS_DRIFT",
  );

  const seamRefs = new Set(registry.seamRefs);
  for (const seamRef of [
    "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
    "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
    "data/contracts/PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
  ]) {
    requireCondition(seamRefs.has(seamRef), `SEAM_REF_MISSING:${seamRef}`);
  }
}

function validateSeams() {
  const truthProjectionSeam = parseJson<any>(
    path.join(
      ROOT,
      "data",
      "contracts",
      "PHASE5_PARALLEL_INTERFACE_GAP_TRUTH_PROJECTION_WRITE_DISCIPLINE.json",
    ),
  );
  const mirrorSeam = parseJson<any>(
    path.join(
      ROOT,
      "data",
      "contracts",
      "PHASE5_PARALLEL_INTERFACE_GAP_SUPPLIER_MIRROR_BOOTSTRAP.json",
    ),
  );
  const exceptionSeam = parseJson<any>(
    path.join(
      ROOT,
      "data",
      "contracts",
      "PHASE5_PARALLEL_INTERFACE_GAP_EXCEPTION_LIFECYCLE_HANDOFF.json",
    ),
  );

  requireCondition(
    truthProjectionSeam.ownerTask === "par_321",
    "TRUTH_PROJECTION_SEAM_OWNER_DRIFT",
  );
  requireCondition(
    truthProjectionSeam.discipline.length === 6,
    "TRUTH_PROJECTION_SEAM_DISCIPLINE_COUNT_DRIFT",
  );
  requireCondition(mirrorSeam.ownerTask === "par_325", "MIRROR_SEAM_OWNER_DRIFT");
  requireCondition(exceptionSeam.ownerTask === "par_323", "EXCEPTION_SEAM_OWNER_DRIFT");
}

function validateLaunchPackets() {
  const packet315 = parseJson<any>(
    path.join(ROOT, "data", "launchpacks", "314_track_launch_packet_315.json"),
  );
  const packet316 = parseJson<any>(
    path.join(ROOT, "data", "launchpacks", "314_track_launch_packet_316.json"),
  );
  const packet317 = parseJson<any>(
    path.join(ROOT, "data", "launchpacks", "314_track_launch_packet_317.json"),
  );

  for (const [expectedTrackId, packet] of [
    ["par_315", packet315],
    ["par_316", packet316],
    ["par_317", packet317],
  ] as const) {
    requireCondition(packet.taskId === "seq_314", `LAUNCH_PACKET_TASK_ID_DRIFT:${expectedTrackId}`);
    requireCondition(
      packet.launchTrackId === expectedTrackId,
      `LAUNCH_PACKET_TRACK_ID_DRIFT:${expectedTrackId}`,
    );
    requireCondition(packet.readiness === "ready", `LAUNCH_PACKET_READINESS_DRIFT:${expectedTrackId}`);
  }
}

function validateDependencyMap() {
  const yaml = read(path.join(ROOT, "data", "contracts", "314_phase5_dependency_interface_map.yaml"));
  for (const requiredPattern of [
    "EDGE_317_318_POLICY_EVALUATION",
    "EDGE_321_325_MIRROR_BOOTSTRAP",
    "EDGE_323_325_EXCEPTION_HANDOFF",
    "producerTrack: par_315",
    "consumerTrack: seq_340",
  ]) {
    requireCondition(yaml.includes(requiredPattern), `DEPENDENCY_MAP_PATTERN_MISSING:${requiredPattern}`);
  }
}

function validateMatrices() {
  const consistencyRows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "314_phase5_contract_consistency_matrix.csv")),
  );
  requireCondition(consistencyRows.length === 12, "CONSISTENCY_MATRIX_ROW_COUNT_DRIFT");
  const consistencyByArea = new Map(consistencyRows.map((row) => [row.lawArea, row]));
  requireCondition(
    consistencyByArea.get("truth_projection_writer")?.ownerTrack === "par_321" &&
      consistencyByArea.get("truth_projection_writer")?.collisionStatus === "resolved_by_314",
    "CONSISTENCY_MATRIX_TRUTH_PROJECTION_DRIFT",
  );
  requireCondition(
    consistencyByArea.get("supplier_mirror_bootstrap")?.ownerTrack === "par_325" &&
      consistencyByArea.get("supplier_mirror_bootstrap")?.collisionStatus === "resolved_by_314",
    "CONSISTENCY_MATRIX_SUPPLIER_MIRROR_DRIFT",
  );
  requireCondition(
    consistencyByArea.get("exception_lifecycle")?.ownerTrack === "par_323" &&
      consistencyByArea.get("exception_lifecycle")?.collisionStatus === "resolved_by_314",
    "CONSISTENCY_MATRIX_EXCEPTION_DRIFT",
  );
  requireCondition(
    consistencyByArea.get("phase4_performance_carry_forward")?.collisionStatus === "carried_forward",
    "CONSISTENCY_MATRIX_PHASE4_PERFORMANCE_DRIFT",
  );

  const ownerRows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "314_phase5_track_owner_matrix.csv")),
  );
  requireCondition(ownerRows.length === 26, "TRACK_OWNER_MATRIX_ROW_COUNT_DRIFT");
  const ownerByTrack = new Map(ownerRows.map((row) => [row.trackId, row]));
  requireCondition(ownerByTrack.get("par_315")?.readiness === "ready", "TRACK_OWNER_ROW_DRIFT:par_315");
  requireCondition(ownerByTrack.get("seq_335")?.readiness === "deferred", "TRACK_OWNER_ROW_DRIFT:seq_335");
  requireCondition(ownerByTrack.get("seq_340")?.readiness === "blocked", "TRACK_OWNER_ROW_DRIFT:seq_340");
}

function validateGapLog() {
  const gapLog = parseJson<any>(path.join(ROOT, "data", "analysis", "314_phase5_parallel_gap_log.json"));
  requireCondition(gapLog.taskId === "seq_314", "GAP_LOG_TASK_ID_DRIFT");
  requireCondition(Array.isArray(gapLog.gaps) && gapLog.gaps.length === 7, "GAP_LOG_COUNT_DRIFT");
  const gapById = new Map(gapLog.gaps.map((gap: any) => [gap.gapId, gap]));
  requireCondition(
    gapById.get("G314_001")?.status === "resolved_by_314" &&
      gapById.get("G314_001")?.canonicalOwner === "par_321",
    "GAP_LOG_TRUTH_PROJECTION_DRIFT",
  );
  requireCondition(
    gapById.get("G314_006")?.carryForwardIssueRef === "ISSUE310_003",
    "GAP_LOG_PHASE4_PERFORMANCE_DRIFT",
  );
}

function validateExternalNotes() {
  const notes = parseJson<any>(path.join(ROOT, "data", "analysis", "314_external_reference_notes.json"));
  requireCondition(notes.taskId === "seq_314", "EXTERNAL_NOTES_TASK_ID_DRIFT");
  const urls = new Set(notes.sources.map((entry: any) => entry.url));
  for (const url of [
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/trace-viewer-intro",
    "https://playwright.dev/docs/aria-snapshots",
    "https://digital.nhs.uk/services/care-identity-service",
    "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
    "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-guidance-hub/client-user-guide",
    "https://service-manual.nhs.uk/design-system/components/table",
    "https://service-manual.nhs.uk/design-system/patterns/check-answers",
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
  ]) {
    requireCondition(urls.has(url), `EXTERNAL_REFERENCE_URL_MISSING:${url}`);
  }
}

function validateBoardHtml() {
  const html = read(path.join(ROOT, "docs", "frontend", "314_phase5_parallel_tracks_gate_board.html"));
  for (const pattern of [
    "data-testid=\"Phase5ParallelGateBoard\"",
    "data-testid=\"DependencyGraph\"",
    "data-testid=\"TrackParityTable\"",
    "data-filter-readiness=\"all\"",
    "window.__phase5ParallelGateData",
    "Phase5_Parallel_Tracks_Gate_Board",
  ]) {
    requireCondition(html.includes(pattern), `BOARD_HTML_PATTERN_MISSING:${pattern}`);
  }
}

for (const filePath of REQUIRED_FILES) {
  read(filePath);
}

validateChecklist();
validatePackageScript();
validateRegistry();
validateSeams();
validateLaunchPackets();
validateDependencyMap();
validateMatrices();
validateGapLog();
validateExternalNotes();
validateBoardHtml();

console.log("314 Phase 5 parallel gate validation passed.");
