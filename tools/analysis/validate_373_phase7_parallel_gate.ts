import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T extends JsonRecord>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

function readCsv(relativePath: string): JsonRecord[] {
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  invariant(headers.length > 1, `${relativePath} must include a CSV header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} has malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function asArray<T = unknown>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

const REQUIRED_FILES = [
  "docs/architecture/373_post_phase6_deferred_channel_gate_and_dependency_map.md",
  "docs/release/373_phase7_open_gate.md",
  "docs/frontend/373_deferred_channel_parallel_tracks_gate_board.html",
  "docs/api/373_phase7_track_interface_registry.md",
  "docs/strategy/373_assistive_and_assurance_future_preconditions.md",
  "data/contracts/373_phase7_track_readiness_registry.json",
  "data/contracts/373_phase7_dependency_interface_map.yaml",
  "data/contracts/373_parallel_assistive_assurance_preconditions.json",
  "data/contracts/373_future_phase_dependency_reserve.json",
  "data/analysis/373_external_reference_notes.json",
  "data/analysis/373_phase7_contract_consistency_matrix.csv",
  "data/analysis/373_phase7_track_owner_matrix.csv",
  "data/analysis/373_phase7_parallel_gap_log.csv",
  "data/launchpacks/373_track_launch_packet_374.json",
  "data/launchpacks/373_track_launch_packet_375.json",
  "data/launchpacks/373_track_launch_packet_376.json",
  "data/launchpacks/373_track_launch_packet_377.json",
  "data/launchpacks/373_track_launch_packet_378.json",
  "data/launchpacks/373_track_launch_packet_379.json",
  "tools/analysis/validate_373_phase7_parallel_gate.ts",
  "tests/playwright/373_phase7_parallel_tracks_gate_board.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:373-phase7-parallel-gate"] ===
    "pnpm exec tsx ./tools/analysis/validate_373_phase7_parallel_gate.ts",
  "package.json missing validate:373-phase7-parallel-gate script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] seq_372_/m.test(checklist), "Checklist task 372 must be complete.");
invariant(
  /^- \[(?:-|X)\] seq_373_/m.test(checklist),
  "Checklist task 373 must be claimed or complete while validator runs.",
);

const phase6Verdict = readJson<{
  verdict?: string;
  blockingDefectCount?: number;
  carryForwardCount?: number;
  carryForwardRefs?: string[];
}>("data/contracts/372_phase6_exit_verdict.json");
invariant(
  phase6Verdict.verdict === "go_with_constraints",
  "372 verdict must be go_with_constraints.",
);
invariant(phase6Verdict.blockingDefectCount === 0, "372 must have zero blockers.");
invariant(phase6Verdict.carryForwardCount === 6, "372 must have six carry-forward rows.");

const phase6Handoff = readJson<{
  phase7LaunchCondition?: string;
  phase7MustInheritAsConstrained?: string[];
}>("data/contracts/372_phase6_to_phase7_handoff_contract.json");
invariant(
  phase6Handoff.phase7LaunchCondition === "open_only_through_seq_373_with_constraints",
  "372 handoff must require the 373 constrained gate.",
);
for (const inherited of [
  "live_directory_dispatch_and_transport_approval",
  "nhs_app_scal_clinical_safety_and_connection_agreement",
  "manual_assistive_technology_and_device_lab_assessment",
] as const) {
  invariant(
    asArray<string>(
      phase6Handoff.phase7MustInheritAsConstrained,
      "phase6Handoff.phase7MustInheritAsConstrained",
    ).includes(inherited),
    `372 handoff missing inherited constraint ${inherited}.`,
  );
}

const registry = readJson<{
  taskId?: string;
  schemaVersion?: string;
  launchVerdict?: string;
  launchClass?: string;
  summary?: JsonRecord;
  inheritedConstraintRefs?: string[];
  launchConditionRefs?: string[];
  tracks?: JsonRecord[];
}>("data/contracts/373_phase7_track_readiness_registry.json");
invariant(registry.taskId === "seq_373", "Registry must belong to seq_373.");
invariant(
  registry.schemaVersion === "373.phase7.parallel-gate.v1",
  "Registry schema version drifted.",
);
invariant(registry.launchVerdict === "open_phase7_with_constraints", "Registry verdict drifted.");
invariant(
  registry.launchClass === "deferred_nhs_app_first_wave_open_without_live_go_live_claim",
  "Registry launch class drifted.",
);

const tracks = asArray<JsonRecord>(registry.tracks, "registry.tracks");
invariant(tracks.length === 29, "Registry must include 29 Phase 7 track rows.");
const summary = registry.summary ?? {};
invariant(summary.trackCount === 29, "Summary track count drifted.");
invariant(summary.readyCount === 6, "Summary ready count drifted.");
invariant(summary.blockedCount === 15, "Summary blocked count drifted.");
invariant(summary.deferredCount === 8, "Summary deferred count drifted.");
invariant(
  asArray<string>(registry.inheritedConstraintRefs, "registry.inheritedConstraintRefs").join(
    "|",
  ) === "CF372_001|CF372_002|CF372_003|CF372_004|CF372_005|CF372_006",
  "Registry inherited constraints drifted.",
);
invariant(
  asArray<string>(registry.launchConditionRefs, "registry.launchConditionRefs").length === 6,
  "Registry must include six launch conditions.",
);

const trackMap = new Map(tracks.map((track) => [String(track.trackId), track]));
for (let task = 374; task <= 402; task += 1) {
  invariant(trackMap.has(`par_${task}`), `Registry missing par_${task}.`);
}

for (const readyTrack of [
  "par_374",
  "par_375",
  "par_376",
  "par_377",
  "par_378",
  "par_379",
] as const) {
  const track = trackMap.get(readyTrack);
  invariant(track?.readinessState === "ready", `${readyTrack} must be ready.`);
  invariant(
    typeof track.launchPacketRef === "string" &&
      fs.existsSync(path.join(ROOT, track.launchPacketRef)),
    `${readyTrack} must point to an existing launch packet.`,
  );
  invariant(
    asArray(track.blockingRefs, `${readyTrack}.blockingRefs`).length === 0,
    `${readyTrack} blockers must be empty.`,
  );
}

for (const blockedTrack of [
  "par_380",
  "par_381",
  "par_382",
  "par_383",
  "par_384",
  "par_385",
  "par_386",
  "par_387",
  "par_388",
  "par_389",
  "par_390",
  "par_391",
  "par_392",
  "par_393",
  "par_397",
] as const) {
  const track = trackMap.get(blockedTrack);
  invariant(track?.readinessState === "blocked", `${blockedTrack} must be blocked.`);
  invariant(
    asArray(track.blockingRefs, `${blockedTrack}.blockingRefs`).length > 0,
    `${blockedTrack} needs blocking refs.`,
  );
  invariant(track.launchPacketRef === null, `${blockedTrack} must not have a launch packet yet.`);
}

for (const deferredTrack of [
  "par_394",
  "par_395",
  "par_396",
  "par_398",
  "par_399",
  "par_400",
  "par_401",
  "par_402",
] as const) {
  const track = trackMap.get(deferredTrack);
  invariant(track?.readinessState === "deferred", `${deferredTrack} must be deferred.`);
  invariant(
    asArray(track.blockingRefs, `${deferredTrack}.blockingRefs`).length > 0,
    `${deferredTrack} needs deferral refs.`,
  );
}

for (const task of ["374", "375", "376", "377", "378", "379"] as const) {
  const packet = readJson<{
    packetId?: string;
    targetTrack?: string;
    launchState?: string;
    sourceGateRef?: string;
    mustProduce?: string[];
    requiredInputs?: string[];
    constraints?: string[];
  }>(`data/launchpacks/373_track_launch_packet_${task}.json`);
  invariant(
    packet.packetId === `373_track_launch_packet_${task}`,
    `Launch packet ${task} id drifted.`,
  );
  invariant(packet.targetTrack === `par_${task}`, `Launch packet ${task} target drifted.`);
  invariant(packet.launchState === "ready", `Launch packet ${task} must be ready.`);
  invariant(
    packet.sourceGateRef === "data/contracts/373_phase7_track_readiness_registry.json",
    `Launch packet ${task} source gate drifted.`,
  );
  invariant(
    asArray(packet.mustProduce, `${task}.mustProduce`).length >= 5,
    `Launch packet ${task} must name outputs.`,
  );
  invariant(
    asArray(packet.requiredInputs, `${task}.requiredInputs`).length >= 2,
    `Launch packet ${task} must name inputs.`,
  );
  invariant(
    asArray(packet.constraints, `${task}.constraints`).length >= 3,
    `Launch packet ${task} must name constraints.`,
  );
}

const yamlMap = readText("data/contracts/373_phase7_dependency_interface_map.yaml");
for (const needle of [
  "launchVerdict: open_phase7_with_constraints",
  "trackId: par_374",
  "trackId: par_379",
  "par_380_to_par_393: blocked_until_freeze_or_runtime_owner_completes",
  "phase8: inherits_after_phase7_guardrail_pack_or_exit_only",
]) {
  requireIncludes(yamlMap, needle, "Dependency interface map");
}

const preconditions = readJson<{ rows?: JsonRecord[] }>(
  "data/contracts/373_parallel_assistive_assurance_preconditions.json",
);
const preconditionRows = asArray<JsonRecord>(preconditions.rows, "preconditions.rows");
invariant(
  preconditionRows.length === 6,
  "Parallel assistive assurance preconditions must include six rows.",
);
for (const gate of [
  "after_phase7_guardrail_pack",
  "after_phase7_exit",
  "blocked_on_new_freeze",
] as const) {
  invariant(
    preconditionRows.some((row) => row.inheritanceGate === gate),
    `Preconditions missing inheritance gate ${gate}.`,
  );
}

const reserve = readJson<{ reserveRows?: JsonRecord[] }>(
  "data/contracts/373_future_phase_dependency_reserve.json",
);
const reserveRows = asArray<JsonRecord>(reserve.reserveRows, "reserve.reserveRows");
invariant(reserveRows.length === 9, "Future phase dependency reserve must include nine rows.");
invariant(
  reserveRows.some((row) => row.requiredArtifact === "AssuranceEvidenceGraphSnapshot"),
  "Future reserve must include AssuranceEvidenceGraphSnapshot.",
);

const consistencyRows = readCsv("data/analysis/373_phase7_contract_consistency_matrix.csv");
invariant(consistencyRows.length === 10, "Contract consistency matrix must include 10 rows.");
invariant(
  consistencyRows.every((row) => row.release_interpretation !== "missing"),
  "Contract consistency matrix must not contain missing rows.",
);
for (const family of [
  "manifest_and_jump_off",
  "embedded_context_and_navigation",
  "artifact_and_webview_limitations",
  "release_and_scal_guardrails",
] as const) {
  invariant(
    consistencyRows.some((row) => row.contract_family === family),
    `Contract consistency matrix missing ${family}.`,
  );
}

const ownerRows = readCsv("data/analysis/373_phase7_track_owner_matrix.csv");
invariant(ownerRows.length === 29, "Track owner matrix must include 29 rows.");
for (let task = 374; task <= 402; task += 1) {
  invariant(
    ownerRows.some((row) => row.track_id === `par_${task}`),
    `Owner matrix missing par_${task}.`,
  );
}
invariant(
  ownerRows.filter((row) => row.readiness_state === "ready").length === 6,
  "Owner matrix ready count drifted.",
);
invariant(
  ownerRows.filter((row) => row.readiness_state === "blocked").length === 15,
  "Owner matrix blocked count drifted.",
);
invariant(
  ownerRows.filter((row) => row.readiness_state === "deferred").length === 8,
  "Owner matrix deferred count drifted.",
);

const gapRows = readCsv("data/analysis/373_phase7_parallel_gap_log.csv");
invariant(gapRows.length === 8, "Parallel gap log must include eight rows.");
invariant(
  gapRows.every((row) => row.blocks_phase7_open === "false"),
  "Gap log must not block the first Phase 7 opening wave.",
);
invariant(
  gapRows.some((row) => row.blocks_live_release === "true"),
  "Gap log must preserve live-release blockers.",
);

const externalRefs = readJson<{ sources?: JsonRecord[] }>(
  "data/analysis/373_external_reference_notes.json",
);
const urls = asArray<JsonRecord>(externalRefs.sources, "externalRefs.sources").map((source) =>
  String(source.url),
);
for (const url of [
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-integration-expression-of-interest-form",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://nhsconnect.github.io/nhslogin/single-sign-on/",
  "https://playwright.dev/docs/trace-viewer",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/accessibility-testing",
  "https://playwright.dev/docs/aria-snapshots",
] as const) {
  invariant(urls.includes(url), `External references missing ${url}.`);
}

const board = readText("docs/frontend/373_deferred_channel_parallel_tracks_gate_board.html");
for (const testId of [
  "Phase7ParallelGateBoard",
  "GateMasthead",
  "SummaryStrip",
  "TrackRailPanel",
  "TrackRail",
  "TrackCount",
  "ReadinessCanvas",
  "SelectedTrackTitle",
  "SelectedReadiness",
  "GateFilters",
  "TrackFamilyFilter",
  "ReadinessFilter",
  "OwnerFilter",
  "EnvironmentFilter",
  "RiskClassFilter",
  "DependencyRows",
  "InspectorPanel",
  "OwnerList",
  "UpstreamContractRows",
  "BlockerRows",
  "LaunchPacketRows",
  "FuturePreconditionRows",
  "TrackEvidenceTable",
  "GapTable",
  "FuturePreconditionTable",
] as const) {
  requireIncludes(board, `data-testid="${testId}"`, "Phase 7 gate board");
}
for (const cssNeedle of [
  "max-width: 1760px",
  "height: 72px",
  "grid-template-columns: 320px minmax(0, 1fr) 420px",
  "@media (prefers-reduced-motion: reduce)",
  "Readiness mix: 6 ready, 15 blocked, 8 deferred",
] as const) {
  requireIncludes(board, cssNeedle, "Phase 7 gate board");
}
for (let task = 374; task <= 402; task += 1) {
  requireIncludes(board, `"par_${task}"`, "Phase 7 gate board track data");
}

const boardSpec = readText("tests/playwright/373_phase7_parallel_tracks_gate_board.spec.ts");
for (const needle of [
  "Phase7ParallelGateBoard",
  "open_phase7_with_constraints",
  "TrackButton-par_375",
  "ReadinessFilter",
  '=== "15"',
] as const) {
  requireIncludes(boardSpec, needle, "373 Playwright spec");
}

for (const docPath of [
  "docs/architecture/373_post_phase6_deferred_channel_gate_and_dependency_map.md",
  "docs/release/373_phase7_open_gate.md",
  "docs/api/373_phase7_track_interface_registry.md",
  "docs/strategy/373_assistive_and_assurance_future_preconditions.md",
] as const) {
  const doc = readText(docPath);
  requireIncludes(doc, "open_phase7_with_constraints", docPath);
}

console.log(
  JSON.stringify(
    {
      taskId: "seq_373",
      launchVerdict: registry.launchVerdict,
      trackCount: tracks.length,
      readyCount: summary.readyCount,
      blockedCount: summary.blockedCount,
      deferredCount: summary.deferredCount,
      futureReserveCount: reserveRows.length,
      status: "passed",
    },
    null,
    2,
  ),
);
