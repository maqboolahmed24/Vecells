import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "docs/architecture/403_post_phase7_assistive_gate_and_dependency_map.md",
  "docs/release/403_phase8_open_gate.md",
  "docs/frontend/403_phase8_parallel_tracks_gate_board.html",
  "docs/api/403_phase8_track_interface_registry.md",
  "docs/strategy/403_phase9_future_preconditions.md",
  "data/contracts/403_phase8_track_readiness_registry.json",
  "data/contracts/403_phase8_dependency_interface_map.yaml",
  "data/contracts/403_parallel_assistive_and_assurance_preconditions.json",
  "data/contracts/403_phase9_dependency_reserve.json",
  "data/analysis/403_external_reference_notes.json",
  "data/analysis/403_phase8_track_owner_matrix.csv",
  "data/analysis/403_phase8_parallel_gap_log.json",
  "data/launchpacks/403_track_launch_packet_404.json",
  "data/launchpacks/403_track_launch_packet_405.json",
  "data/launchpacks/403_track_launch_packet_406.json",
  "data/launchpacks/403_track_launch_packet_407.json",
  "data/launchpacks/403_track_launch_packet_408.json",
  "data/launchpacks/403_track_launch_packet_409.json",
  "tools/analysis/validate_403_phase8_parallel_gate.ts",
  "tests/playwright/403_phase8_parallel_tracks_gate_board.spec.ts",
] as const;

const OPEN_TRACK_IDS = ["par_404", "par_405", "par_406", "par_407", "par_408", "par_409"];
const PHASE7_CONDITION_IDS = [
  "LC402_001",
  "LC402_002",
  "LC402_003",
  "LC402_004",
  "LC402_005",
  "LC402_006",
];

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  for (const relativePath of REQUIRED_FILES) {
    invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:403-phase8-parallel-gate"] ===
      "pnpm exec tsx ./tools/analysis/validate_403_phase8_parallel_gate.ts",
    "package.json missing validate:403-phase8-parallel-gate script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(/^- \[X\] par_402_phase7_exit_gate_/m.test(checklist), "Checklist task 402 must be complete.");
  invariant(
    /^- \[(?:-|X)\] par_403_phase8_track_gate_freeze_assistive_capability_boundaries_policy_envelope_and_human_control_rules/m.test(
      checklist,
    ),
    "Checklist task 403 must be claimed or complete while this validator runs.",
  );

  const phase7Verdict = readJson<{
    verdict?: string;
    blockingRefs?: unknown[];
    carryForwardRefs?: unknown[];
    phase8LaunchConditionRefs?: string[];
  }>("data/contracts/402_phase7_exit_verdict.json");
  invariant(phase7Verdict.verdict === "approved", "403 requires the 402 verdict to be approved.");
  invariant(asArray(phase7Verdict.blockingRefs, "phase7Verdict.blockingRefs").length === 0, "402 blockers remain.");
  invariant(
    asArray(phase7Verdict.carryForwardRefs, "phase7Verdict.carryForwardRefs").length === 0,
    "402 carry-forward refs remain.",
  );
  invariant(
    PHASE7_CONDITION_IDS.every((id) =>
      asArray<string>(phase7Verdict.phase8LaunchConditionRefs, "phase7Verdict.phase8LaunchConditionRefs").includes(id),
    ),
    "402 verdict must hand off all six Phase 8 launch conditions.",
  );

  const registry = readJson<{
    taskId?: string;
    launchVerdict?: string;
    sourcePhase7VerdictRef?: string;
    summary?: JsonRecord;
    phase7LaunchConditionInterpretation?: JsonRecord[];
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.taskId === "seq_403", "403 registry task id drifted.");
  invariant(registry.launchVerdict === "open_phase8_now", "403 registry verdict must open Phase 8 now.");
  invariant(
    registry.sourcePhase7VerdictRef === "data/contracts/402_phase7_exit_verdict.json",
    "403 registry must reference the 402 verdict.",
  );
  invariant(registry.summary?.readyCount === 6, "403 registry ready count must be six.");
  invariant(registry.summary?.blockedCount === 9, "403 registry blocked count must be nine.");
  invariant(registry.summary?.deferredCount === 3, "403 registry deferred count must be three.");

  const conditionRows = asArray<JsonRecord>(
    registry.phase7LaunchConditionInterpretation,
    "registry.phase7LaunchConditionInterpretation",
  );
  for (const conditionId of PHASE7_CONDITION_IDS) {
    invariant(
      conditionRows.some((row) => row.conditionRef === conditionId),
      `403 registry missing ${conditionId} interpretation.`,
    );
  }

  const tracks = asArray<JsonRecord>(registry.tracks, "registry.tracks");
  invariant(tracks.length === 18, "403 registry must list projected Phase 8 tracks 404-421.");
  for (const track of tracks) {
    const trackId = String(track.trackId);
    invariant(/^par_4\d\d$/.test(trackId), `Invalid track id ${trackId}.`);
    for (const key of [
      "trackId",
      "readinessState",
      "ownerLane",
      "blockingRefs",
      "upstreamContractRefs",
      "launchPacketRef",
      "futurePhaseDependencyRefs",
    ] as const) {
      invariant(key in track, `${trackId} missing ${key}.`);
    }
    invariant(
      ["ready", "blocked", "deferred"].includes(String(track.readinessState)),
      `${trackId} has invalid readiness state.`,
    );
    asArray(track.blockingRefs, `${trackId}.blockingRefs`);
    invariant(
      asArray(track.upstreamContractRefs, `${trackId}.upstreamContractRefs`).length >= 1,
      `${trackId} missing upstream refs.`,
    );
    invariant(
      asArray(track.futurePhaseDependencyRefs, `${trackId}.futurePhaseDependencyRefs`).length >= 1,
      `${trackId} missing Phase 9 reserve refs.`,
    );
  }

  for (const openTrackId of OPEN_TRACK_IDS) {
    const track = tracks.find((entry) => entry.trackId === openTrackId);
    invariant(track, `Missing open track ${openTrackId}.`);
    invariant(track.readinessState === "ready", `${openTrackId} must be ready.`);
    invariant(asArray(track.blockingRefs, `${openTrackId}.blockingRefs`).length === 0, `${openTrackId} has blockers.`);
    invariant(
      track.launchPacketRef === `data/launchpacks/403_track_launch_packet_${openTrackId.replace("par_", "")}.json`,
      `${openTrackId} launch packet ref drifted.`,
    );
  }
  invariant(
    tracks
      .filter((track) => !OPEN_TRACK_IDS.includes(String(track.trackId)))
      .every((track) => track.readinessState !== "ready" && track.launchPacketRef === null),
    "Later tracks must remain non-ready without launch packets.",
  );

  for (const openTrackId of OPEN_TRACK_IDS) {
    const suffix = openTrackId.replace("par_", "");
    const packet = readJson<{
      taskId?: string;
      trackId?: string;
      readyToLaunch?: boolean;
      launchState?: string;
      ownedInterfaces?: unknown[];
      guardrails?: unknown[];
      nonGoals?: unknown[];
      futurePhaseDependencyRefs?: unknown[];
    }>(`data/launchpacks/403_track_launch_packet_${suffix}.json`);
    invariant(packet.taskId === "seq_403", `${openTrackId} packet task id drifted.`);
    invariant(packet.trackId === openTrackId, `${openTrackId} packet track id drifted.`);
    invariant(packet.readyToLaunch === true, `${openTrackId} packet must be ready.`);
    invariant(packet.launchState === "open_now", `${openTrackId} packet must be open_now.`);
    invariant(asArray(packet.ownedInterfaces, `${openTrackId}.ownedInterfaces`).length >= 5, `${openTrackId} packet lacks owned interfaces.`);
    invariant(asArray(packet.guardrails, `${openTrackId}.guardrails`).length >= 3, `${openTrackId} packet lacks guardrails.`);
    invariant(asArray(packet.nonGoals, `${openTrackId}.nonGoals`).length >= 3, `${openTrackId} packet lacks non-goals.`);
    invariant(
      asArray(packet.futurePhaseDependencyRefs, `${openTrackId}.futurePhaseDependencyRefs`).length >= 2,
      `${openTrackId} packet lacks future refs.`,
    );
  }

  const dependencyMap = readText("data/contracts/403_phase8_dependency_interface_map.yaml");
  for (const needle of [
    "launchVerdict: open_phase8_now",
    "PHASE8_FOUNDATION_WAVE_403",
    "par_404",
    "par_409",
    "par_421",
    "P9RES403_008",
    ...PHASE7_CONDITION_IDS,
  ]) {
    requireIncludes(dependencyMap, needle, "403 dependency map");
  }

  const preconditions = readJson<{
    launchVerdict?: string;
    parallelWaveOpen?: boolean;
    laterAssuranceOpen?: boolean;
    phase7LaunchConditions?: JsonRecord[];
    openPreconditions?: JsonRecord[];
    humanControlBoundaries?: unknown[];
  }>("data/contracts/403_parallel_assistive_and_assurance_preconditions.json");
  invariant(preconditions.launchVerdict === "open_phase8_now", "403 preconditions verdict drifted.");
  invariant(preconditions.parallelWaveOpen === true, "403 parallel wave must be open.");
  invariant(preconditions.laterAssuranceOpen === false, "403 later assurance must stay closed.");
  invariant(
    asArray<JsonRecord>(preconditions.phase7LaunchConditions, "preconditions.phase7LaunchConditions").every(
      (entry) => entry.preconditionState === "satisfied",
    ),
    "All Phase 7 launch conditions must be satisfied for the first wave.",
  );
  invariant(
    asArray(preconditions.openPreconditions, "preconditions.openPreconditions").length >= 4,
    "403 preconditions missing open rows.",
  );
  invariant(
    asArray(preconditions.humanControlBoundaries, "preconditions.humanControlBoundaries").length >= 3,
    "403 preconditions missing human-control boundaries.",
  );

  const reserve = readJson<{ phase9OpenState?: string; reserveRows?: JsonRecord[] }>(
    "data/contracts/403_phase9_dependency_reserve.json",
  );
  invariant(reserve.phase9OpenState === "not_ready_reserved_only", "Phase 9 must be reserved only.");
  const reserveRows = asArray<JsonRecord>(reserve.reserveRows, "reserve.reserveRows");
  invariant(reserveRows.length === 8, "403 Phase 9 reserve must include eight rows.");
  for (let index = 1; index <= 8; index += 1) {
    invariant(
      reserveRows.some((row) => row.reserveId === `P9RES403_00${index}`),
      `Phase 9 reserve missing P9RES403_00${index}.`,
    );
  }

  const externalNotes = readJson<{ sources?: JsonRecord[] }>("data/analysis/403_external_reference_notes.json");
  const sourceUrls = asArray<JsonRecord>(externalNotes.sources, "externalNotes.sources").map((entry) =>
    String(entry.url),
  );
  for (const url of [
    "https://www.england.nhs.uk/publication/guidance-on-the-use-of-ai-enabled-ambient-scribing-products/",
    "https://transform.england.nhs.uk/information-governance/guidance/using-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
    "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
    "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
    "https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems/",
    "https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0160-clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems/",
    "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
    "https://playwright.dev/docs/trace-viewer",
    "https://playwright.dev/docs/accessibility-testing",
    "https://playwright.dev/docs/aria-snapshots",
  ]) {
    invariant(sourceUrls.includes(url), `403 external notes missing ${url}.`);
  }

  const ownerRows = readCsv("data/analysis/403_phase8_track_owner_matrix.csv");
  invariant(ownerRows.length === 18, "403 owner matrix must include 18 tracks.");
  invariant(
    ownerRows.filter((row) => row.readiness_state === "ready").length === 6,
    "403 owner matrix must include six ready rows.",
  );
  invariant(
    ownerRows
      .filter((row) => OPEN_TRACK_IDS.includes(row.track_id))
      .every((row) => row.status === "open" && row.launch_packet_ref.includes("403_track_launch_packet")),
    "403 owner matrix open rows must have launch packets.",
  );

  const gapLog = readJson<{ immediateWaveGapCount?: number; gaps?: JsonRecord[] }>(
    "data/analysis/403_phase8_parallel_gap_log.json",
  );
  invariant(gapLog.immediateWaveGapCount === 0, "Immediate 404-409 wave must have zero gaps.");
  const gaps = asArray<JsonRecord>(gapLog.gaps, "gapLog.gaps");
  invariant(gaps.length === 12, "403 gap log must include the 12 later gaps.");
  invariant(
    gaps.every((gap) => !OPEN_TRACK_IDS.includes(String(gap.trackId))),
    "403 gap log must not gap the open wave.",
  );

  for (const docPath of [
    "docs/architecture/403_post_phase7_assistive_gate_and_dependency_map.md",
    "docs/release/403_phase8_open_gate.md",
    "docs/api/403_phase8_track_interface_registry.md",
    "docs/strategy/403_phase9_future_preconditions.md",
  ]) {
    const doc = readText(docPath);
    requireIncludes(doc, "open_phase8_now", docPath);
    requireIncludes(doc, "Phase 9", docPath);
  }

  const board = readText("docs/frontend/403_phase8_parallel_tracks_gate_board.html");
  for (const needle of [
    'data-testid="Phase8ParallelTracksGateBoard"',
    'data-testid="LaunchStrip"',
    'data-testid="TrackRail"',
    'data-testid="DependencyCanvas"',
    'data-testid="InspectorPanel"',
    'data-testid="PreconditionTables"',
    "data-verdict=\"open_phase8_now\"",
    "max-width: 1760px",
    "grid-template-columns: 320px minmax(0, 1fr) 420px",
    "height: 76px",
    "#f6f8fb",
    "#eef3f7",
    "#145c52",
    "#b42318",
    "prefers-reduced-motion",
    "TrackFamilyFilter",
    "ReadinessFilter",
    "OwnerFilter",
    "EnvironmentFilter",
    "RiskClassFilter",
  ]) {
    requireIncludes(board.toLowerCase(), needle.toLowerCase(), "403 gate board");
  }

  const playwrightSpec = readText("tests/playwright/403_phase8_parallel_tracks_gate_board.spec.ts");
  for (const needle of [
    "Phase8ParallelTracksGateBoard",
    "TrackButton-par_408",
    "ReadinessFilter",
    "OwnerFilter",
    "TrackButton-par_410",
    "--run",
  ]) {
    requireIncludes(playwrightSpec, needle, "403 Playwright proof");
  }

  console.log("validate_403_phase8_parallel_gate: ok");
}

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

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function asArray<T = unknown>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
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

function readCsv(relativePath: string): Record<string, string>[] {
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  invariant(headers.length > 1, `${relativePath} must include a header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} has a malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}
