import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

type Verdict = "approved" | "go_with_constraints" | "withheld";

type ConformanceRow = {
  rowId: string;
  capabilityFamily: string;
  phaseRefs: string[];
  status: Verdict;
  proofMode: string;
  sourceSections: string[];
  owningTasks: string[];
  summary: string;
  blockingRationale: string;
  currentIssueRefs: string[];
  implementationEvidence: string[];
  automatedProofArtifacts: string[];
};

type OpenIssue = {
  issueId: string;
  title: string;
  priority: "high" | "medium";
  status: "open";
  blockingScope: string;
  carryForwardCategory:
    | "phase5_contract_freeze"
    | "phase5_gate"
    | "phase5_execution"
    | "future_live_boundary";
  ownerTask: string;
  followOnTasks: string[];
  affectedRows: string[];
  summary: string;
  nextAction: string;
  evidenceRefs: string[];
};

type BoundaryItem = {
  ownerTask: string;
  title: string;
  category:
    | "phase5_contract_freeze"
    | "phase5_gate"
    | "phase5_execution"
    | "future_live_boundary";
  risk: string;
  nextAction: string;
};

type FreshnessRow = {
  evidenceId: string;
  evidenceFamily: string;
  rowId: string;
  capturedAt: string;
  freshnessState: "fresh" | "follow_up_required" | "missing" | "future_live";
  resultStatus: "passed" | "failed" | "missing" | "future_live";
  proofClass:
    | "local_browser_and_service"
    | "mixed_local_and_sandbox"
    | "local_with_support_follow_up"
    | "missing_required_release_evidence"
    | "future_live_or_future_network";
  requiredForPhase4Exit: "yes" | "no";
  blockingOnApproved: "yes" | "no";
  ownerTask: string;
  artifactRef: string;
  notes: string;
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
  fs.writeFileSync(absolutePath, `${content.trimEnd()}\n`);
}

function writeJson(relativePath: string, payload: unknown): void {
  writeText(relativePath, JSON.stringify(payload, null, 2));
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function writeCsv(relativePath: string, headers: string[], rows: Record<string, string>[]): void {
  const body = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ].join("\n");
  writeText(relativePath, body);
}

function markdownTable(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function summarizeSuites(results: any) {
  return {
    suiteCount: Array.isArray(results.suiteResults) ? results.suiteResults.length : 0,
    caseCount: Array.isArray(results.caseResults) ? results.caseResults.length : 0,
    overallStatus: String(results.overallStatus),
    fixedDefectIds: Array.isArray(results.fixedDefectIds) ? results.fixedDefectIds.length : 0,
  };
}

const results307 = readJson<any>("data/test-reports/307_booking_core_matrix_results.json");
const results308 = readJson<any>("data/test-reports/308_manage_waitlist_assisted_results.json");
const results309 = readJson<any>("data/test-reports/309_phase4_e2e_results.json");
const performance309 = readJson<any>("data/test-reports/309_phase4_performance_results.json");
const clusters309 = readJson<any>("data/test-reports/309_phase4_e2e_failure_clusters.json");

const generatedAt = "2026-04-22";
const taskId = "seq_310_phase4_exit_gate";
const visualMode = "Phase4_Booking_Exit_Board";

const decisiveSuites = [
  {
    taskId: "seq_307",
    suiteResultRef: repoPath("data/test-reports/307_booking_core_matrix_results.json"),
    visualMode: "Phase4_Booking_Core_Matrix",
    suiteVerdict: "passed_with_repository_fix",
    summary: summarizeSuites(results307),
  },
  {
    taskId: "seq_308",
    suiteResultRef: repoPath("data/test-reports/308_manage_waitlist_assisted_results.json"),
    visualMode: "Phase4_Manage_Waitlist_Assisted_Matrix",
    suiteVerdict: "passed_without_repository_fix",
    summary: summarizeSuites(results308),
  },
  {
    taskId: "seq_309",
    suiteResultRef: repoPath("data/test-reports/309_phase4_e2e_results.json"),
    visualMode: "Phase4_Local_Booking_E2E_Suite",
    suiteVerdict: "passed_with_performance_follow_up",
    summary: summarizeSuites(results309),
  },
  {
    taskId: "seq_309_load",
    suiteResultRef: repoPath("data/test-reports/309_phase4_performance_results.json"),
    visualMode: "Phase4_Local_Booking_Load_Probe",
    suiteVerdict: "support_target_failed",
    summary: {
      overallStatus: performance309.overallStatus,
      scenarioCount: Array.isArray(performance309.scenarioResults)
        ? performance309.scenarioResults.length
        : 0,
      supportTargets: performance309.supportTargets,
    },
  },
];

const openIssues: OpenIssue[] = [
  {
    issueId: "ISSUE310_001",
    title: "Phase 4 release safety delta is not published as a release-specific artifact",
    priority: "high",
    status: "open",
    blockingScope: "expanded_rollout_and_unconditional_exit",
    carryForwardCategory: "phase5_gate",
    ownerTask: "seq_314",
    followOnTasks: ["seq_341"],
    affectedRows: ["PH4_ROW_10"],
    summary:
      "The blueprint requires an updated hazard log and safety evidence for the release candidate. The repository shows baseline safety material and booking hazard seeds, but no Phase 4-specific hazard-log delta packet or release-scoped safety evidence bundle was found for the 307 to 309 candidate.",
    nextAction:
      "Carry the missing safety delta into the Phase 5 readiness gate, keep widened rollout withheld, and require a release-scoped hazard delta and safety case refresh before any later exit gate clears it.",
    evidenceRefs: [
      repoPath("blueprint/phase-4-the-booking-engine.md"),
      repoPath("data/analysis/safety_hazard_register_seed.csv"),
      repoPath("docs/analysis/09_clinical_safety_workstreams.md"),
    ],
  },
  {
    issueId: "ISSUE310_002",
    title: "Rollback rehearsal evidence is absent from the Phase 4 exit candidate",
    priority: "high",
    status: "open",
    blockingScope: "expanded_rollout_and_unconditional_exit",
    carryForwardCategory: "phase5_gate",
    ownerTask: "seq_314",
    followOnTasks: ["par_315", "seq_341"],
    affectedRows: ["PH4_ROW_09", "PH4_ROW_10"],
    summary:
      "The Phase 4 algorithm names rollback rehearsal as a required pre-Phase-5 test. Repository evidence proves recovery, stale-route disposition, and fallback behaviour, but no release-scoped rollback rehearsal artifact was found for the Booking Engine candidate.",
    nextAction:
      "Keep rollout posture withheld, bind rollback readiness explicitly into the Phase 5 track gate, and require a captured rehearsal artifact before a future exit gate calls the booking engine unconditionally approved.",
    evidenceRefs: [
      repoPath("blueprint/phase-4-the-booking-engine.md"),
      repoPath("data/analysis/release_watch_required_evidence.csv"),
      repoPath("data/test-reports/309_phase4_e2e_results.json"),
    ],
  },
  {
    issueId: "ISSUE310_003",
    title: "Local booking load probe misses the 200ms interaction support target",
    priority: "medium",
    status: "open",
    blockingScope: "expanded_rollout",
    carryForwardCategory: "phase5_gate",
    ownerTask: "seq_314",
    followOnTasks: ["par_326", "par_327", "par_333", "seq_340"],
    affectedRows: ["PH4_ROW_09"],
    summary:
      "All three realistic load scenarios in seq_309 exceeded the interaction support budget even though LCP and CLS stayed within their targets. The engine is viable as a Phase 5 foundation, but not as a widened performance-cleared rollout candidate.",
    nextAction:
      "Propagate the performance constraint into the Phase 5 readiness registry, route UI and responsive remediation to the Phase 5 shell tracks, and require the later regression suites to prove the interaction target before widening.",
    evidenceRefs: [
      repoPath("data/test-reports/309_phase4_performance_results.json"),
      repoPath("data/test-reports/309_phase4_e2e_failure_clusters.json"),
    ],
  },
  {
    issueId: "ISSUE310_004",
    title: "Live, sandbox, unsupported, and future-network provider claims must remain separated",
    priority: "medium",
    status: "open",
    blockingScope: "live_provider_parity_claims",
    carryForwardCategory: "future_live_boundary",
    ownerTask: "seq_313",
    followOnTasks: ["par_321", "par_322", "par_324", "par_325"],
    affectedRows: ["PH4_ROW_02"],
    summary:
      "The local booking core proves capability enforcement and unsupported-path fencing, but one 307 capability row is explicitly unsupported and the stronger provider evidence is sandbox-bound. Phase 4 must not relabel this as live multi-provider parity.",
    nextAction:
      "Carry the unsupported and sandbox-bound edges into the Phase 5 commit and visibility freeze pack so later network work expands capability truth without collapsing evidence classes.",
    evidenceRefs: [
      repoPath("data/test-reports/307_booking_core_matrix_results.json"),
      repoPath(".artifacts/provider-evidence/307-capability/305_capability_evidence_capture_summary.json"),
      repoPath(".artifacts/provider-sandboxes/307-capability/304_provider_sandbox_runtime_state.json"),
    ],
  },
];

const rows: ConformanceRow[] = [
  {
    rowId: "PH4_ROW_01",
    capabilityFamily: "Local booking core invariants and commit fencing",
    phaseRefs: ["4B", "4C", "4D", "4E"],
    status: "approved",
    proofMode: "local_verified",
    sourceSections: [
      `${repoPath("blueprint/phase-cards.md")}#Card 5: Phase 4 - The Booking Engine`,
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4B. Provider capability matrix and adapter seam`,
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4C. Slot search, ranking, and patient choice`,
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4E. Commit path, confirmation truth, and failure recovery`,
    ],
    owningTasks: ["seq_307", "par_283", "par_284", "par_285", "par_286", "par_287"],
    summary:
      "Capability resolution, slot snapshots, reservation truth, stale-slot fencing, double-book resistance, and commit replay law are all proven in the current repository for the local-first booking engine.",
    blockingRationale: "",
    currentIssueRefs: [],
    implementationEvidence: [
      repoPath("packages/domains/booking/src/phase4-booking-commit-engine.ts"),
      repoPath("tests/integration/307_capability_matrix.spec.ts"),
      repoPath("tests/integration/307_slot_snapshot_truth.spec.ts"),
      repoPath("tests/integration/307_reservation_and_hold_truth.spec.ts"),
      repoPath("tests/integration/307_commit_replay_and_fencing.spec.ts"),
    ],
    automatedProofArtifacts: [
      repoPath("data/test-reports/307_booking_core_matrix_results.json"),
      repoPath("tools/analysis/validate_307_phase4_booking_core_matrix.ts"),
      repoPath("tests/load/307_booking_core_contention_probe.ts"),
    ],
  },
  {
    rowId: "PH4_ROW_02",
    capabilityFamily: "Provider capability boundary, unsupported paths, and evidence-class honesty",
    phaseRefs: ["4B", "4I"],
    status: "go_with_constraints",
    proofMode: "mixed_local_and_sandbox",
    sourceSections: [
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4B. Provider capability matrix and adapter seam`,
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#Tests that must all pass before Phase 5`,
      `${repoPath("blueprint/platform-runtime-and-release-blueprint.md")}#AdapterContractProfile`,
    ],
    owningTasks: ["seq_307", "seq_310", "seq_313"],
    summary:
      "The booking engine correctly enforces capability law and exposes unsupported supplier paths as unsupported instead of silently widening them, but the stronger provider evidence remains sandbox-bound and one manual-assist network path is still explicitly unsupported.",
    blockingRationale:
      "This is sufficient for local-first foundation truth, but not for live or cross-organisation provider parity claims.",
    currentIssueRefs: ["ISSUE310_004"],
    implementationEvidence: [
      repoPath("tests/integration/307_capability_matrix.spec.ts"),
      repoPath(".artifacts/provider-evidence/307-capability/305_capability_evidence_capture_summary.json"),
      repoPath(".artifacts/provider-sandboxes/307-capability/304_provider_sandbox_runtime_state.json"),
    ],
    automatedProofArtifacts: [
      repoPath("data/test-reports/307_booking_core_matrix_results.json"),
      repoPath("data/test-reports/307_booking_core_failure_clusters.json"),
    ],
  },
  {
    rowId: "PH4_ROW_03",
    capabilityFamily: "Ambiguous confirmation, compensation, and recovery truth",
    phaseRefs: ["4E", "4G"],
    status: "approved",
    proofMode: "local_verified",
    sourceSections: [
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4E. Commit path, confirmation truth, and failure recovery`,
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4G. Reconciliation, reminders, artifacts, and recovery`,
      `${repoPath("blueprint/phase-0-the-foundation-protocol.md")}#CommandSettlementRecord`,
    ],
    owningTasks: ["seq_307", "seq_308", "par_292", "seq_309"],
    summary:
      "Ambiguous commit reconciliation, duplicate callback handling, compensation, dispute recovery, and cross-surface truth alignment are all proven with executable browser and service evidence.",
    blockingRationale: "",
    currentIssueRefs: [],
    implementationEvidence: [
      repoPath("tests/integration/307_callback_reorder_and_ambiguous_confirmation.spec.ts"),
      repoPath("tests/integration/307_compensation_and_recovery.spec.ts"),
      repoPath("tests/integration/308_reconciliation_and_dispute_truth.spec.ts"),
      repoPath("tests/integration/309_end_to_end_lifecycle_and_notification_truth.spec.ts"),
    ],
    automatedProofArtifacts: [
      repoPath("data/test-reports/307_booking_core_matrix_results.json"),
      repoPath("data/test-reports/308_manage_waitlist_assisted_results.json"),
      repoPath("data/test-reports/309_phase4_e2e_results.json"),
    ],
  },
  {
    rowId: "PH4_ROW_04",
    capabilityFamily: "Manage commands, waitlist continuation, assisted booking, and reconciliation parity",
    phaseRefs: ["4F", "4G"],
    status: "approved",
    proofMode: "local_verified",
    sourceSections: [
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4F. Manage flows, waitlist, and assisted booking`,
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4G. Reconciliation, reminders, artifacts, and recovery`,
      `${repoPath("blueprint/patient-portal-experience-architecture-blueprint.md")}#Route family`,
    ],
    owningTasks: ["seq_308", "par_288", "par_290", "par_291", "par_292"],
    summary:
      "Patient manage flows, waitlist offer and fallback law, staff-assisted booking, review-action lease behaviour, and reconciliation status parity are all proven and consistent across domain and browser suites.",
    blockingRationale: "",
    currentIssueRefs: [],
    implementationEvidence: [
      repoPath("tests/integration/308_manage_command_truth.spec.ts"),
      repoPath("tests/integration/308_waitlist_deadline_and_fallback.spec.ts"),
      repoPath("tests/integration/308_assisted_booking_handoff_and_lease.spec.ts"),
      repoPath("tests/integration/308_reconciliation_and_dispute_truth.spec.ts"),
    ],
    automatedProofArtifacts: [
      repoPath("data/test-reports/308_manage_waitlist_assisted_results.json"),
      repoPath("docs/testing/308_phase4_manage_waitlist_truth_lab.html"),
      repoPath("tools/analysis/validate_308_phase4_manage_waitlist_assisted_matrix.ts"),
    ],
  },
  {
    rowId: "PH4_ROW_05",
    capabilityFamily: "Patient and staff shell continuity, route publication, and embedded parity",
    phaseRefs: ["4A", "4I"],
    status: "approved",
    proofMode: "local_browser_and_service",
    sourceSections: [
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#Booking surface-control priorities`,
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#Tests that must all pass before Phase 5`,
      `${repoPath("blueprint/patient-portal-experience-architecture-blueprint.md")}#Route family`,
    ],
    owningTasks: ["seq_308", "seq_309", "par_296", "par_297", "par_298"],
    summary:
      "Patient and staff booking routes now prove same-shell continuity, route-contract and recovery-disposition behaviour, responsive parity, and embedded-mode freeze-safe behaviour for the local-first surface family.",
    blockingRationale: "",
    currentIssueRefs: [],
    implementationEvidence: [
      repoPath("tests/playwright/308_patient_manage_truth.spec.ts"),
      repoPath("tests/playwright/309_patient_staff_local_booking_e2e.spec.ts"),
      repoPath("tests/playwright/309_mobile_tablet_desktop_embedded_parity.spec.ts"),
    ],
    automatedProofArtifacts: [
      repoPath("data/test-reports/308_manage_waitlist_assisted_results.json"),
      repoPath("data/test-reports/309_phase4_e2e_results.json"),
      repoPath("output/playwright/309-booking-embedded-host-mobile.png"),
    ],
  },
  {
    rowId: "PH4_ROW_06",
    capabilityFamily: "Artifact presentation, print-export parity, and outbound navigation policy",
    phaseRefs: ["4F", "4G", "4I"],
    status: "approved",
    proofMode: "local_browser_and_service",
    sourceSections: [
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#Booking surface-control priorities`,
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4G. Reconciliation, reminders, artifacts, and recovery`,
      `${repoPath("blueprint/accessibility-and-content-system-contract.md")}#Route-family semantic coverage`,
    ],
    owningTasks: ["seq_308", "seq_309", "par_299"],
    summary:
      "Appointment summaries, confirmation artifacts, print/export states, browser handoff, and recovery-only artifact posture are all represented accurately and proven in browser-visible evidence.",
    blockingRationale: "",
    currentIssueRefs: [],
    implementationEvidence: [
      repoPath("tests/playwright/308_reconciliation_status_and_artifact_parity.spec.ts"),
      repoPath("tests/playwright/309_artifact_print_and_export_parity.spec.ts"),
    ],
    automatedProofArtifacts: [
      repoPath("output/playwright/308-reconciliation-artifact-parity.png"),
      repoPath("output/playwright/309-booking-artifact-print-ready.png"),
      repoPath("output/playwright/309-booking-artifact-recovery-only.png"),
    ],
  },
  {
    rowId: "PH4_ROW_07",
    capabilityFamily: "Accessibility, keyboard flow, reduced motion, and visual parity",
    phaseRefs: ["4I"],
    status: "approved",
    proofMode: "local_browser_and_service",
    sourceSections: [
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#Tests that must all pass before Phase 5`,
      `${repoPath("blueprint/accessibility-and-content-system-contract.md")}#Route-family semantic coverage`,
      `${repoPath("blueprint/patient-portal-experience-architecture-blueprint.md")}#Protected composition`,
    ],
    owningTasks: ["seq_307", "seq_308", "seq_309"],
    summary:
      "The booking surface family has passing accessibility matrices, ARIA snapshots, reduced-motion parity, visual-regression proof, and mobile through desktop evidence across patient and staff contexts.",
    blockingRationale: "",
    currentIssueRefs: [],
    implementationEvidence: [
      repoPath("tests/playwright/307_booking_core_accessibility_and_status.spec.ts"),
      repoPath("tests/playwright/309_accessibility_matrix.spec.ts"),
      repoPath("tests/playwright/309_visual_regression.spec.ts"),
    ],
    automatedProofArtifacts: [
      repoPath("data/test-reports/309_phase4_accessibility_results.json"),
      repoPath("output/playwright/309-visual-regression-manifest.json"),
      repoPath("output/playwright/309-a11y-workspace-aria.yml"),
    ],
  },
  {
    rowId: "PH4_ROW_08",
    capabilityFamily: "Lifecycle, reminders, notifications, and quiet re-entry",
    phaseRefs: ["4G", "4I"],
    status: "approved",
    proofMode: "local_browser_and_service",
    sourceSections: [
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#4G. Reconciliation, reminders, artifacts, and recovery`,
      `${repoPath("blueprint/patient-account-and-communications-blueprint.md")}#Notification entry and return`,
      `${repoPath("blueprint/phase-cards.md")}#Card 5: Phase 4 - The Booking Engine`,
    ],
    owningTasks: ["par_289", "seq_309"],
    summary:
      "The repository proves lifecycle and notification truth for local booking entry, reopen-safe re-entry, record-origin continuity, and reminder-adjacent artifact states without contradicting the Phase 4 reminder scheduler boundary.",
    blockingRationale: "",
    currentIssueRefs: [],
    implementationEvidence: [
      repoPath("tests/integration/309_end_to_end_lifecycle_and_notification_truth.spec.ts"),
      repoPath("tests/playwright/309_notification_and_record_origin_reentry.spec.ts"),
      repoPath("packages/domains/booking/src/phase4-reminder-scheduler.ts"),
    ],
    automatedProofArtifacts: [
      repoPath("data/test-reports/309_phase4_e2e_results.json"),
      repoPath("output/playwright/309-notification-and-record-origin-reentry.png"),
    ],
  },
  {
    rowId: "PH4_ROW_09",
    capabilityFamily: "Performance budgets and release-watch support posture",
    phaseRefs: ["4I"],
    status: "go_with_constraints",
    proofMode: "local_verified_with_follow_up",
    sourceSections: [
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#Tests that must all pass before Phase 5`,
      `${repoPath("blueprint/platform-runtime-and-release-blueprint.md")}#ReleaseWatchEvidenceCockpit`,
      `${repoPath("blueprint/platform-runtime-and-release-blueprint.md")}#WaveObservationPolicy`,
    ],
    owningTasks: ["seq_309", "seq_314"],
    summary:
      "The release-grade browser suite passed and the evidence bundle is fresh, but the local booking load probe exceeded the interaction support target in all realistic scenarios, so widened rollout posture must stay constrained.",
    blockingRationale:
      "The load probe recorded p75 interaction times of 334.42ms, 744.8ms, and 1648.76ms against the 200ms support target.",
    currentIssueRefs: ["ISSUE310_002", "ISSUE310_003"],
    implementationEvidence: [
      repoPath("tests/load/309_phase4_local_booking_load_probe.ts"),
      repoPath("tests/playwright/309_patient_staff_local_booking_e2e.spec.ts"),
    ],
    automatedProofArtifacts: [
      repoPath("data/test-reports/309_phase4_performance_results.json"),
      repoPath("data/test-reports/309_phase4_e2e_failure_clusters.json"),
    ],
  },
  {
    rowId: "PH4_ROW_10",
    capabilityFamily: "Release safety evidence and rollback rehearsal completeness",
    phaseRefs: ["4I"],
    status: "withheld",
    proofMode: "release_evidence_missing",
    sourceSections: [
      `${repoPath("blueprint/phase-4-the-booking-engine.md")}#Tests that must all pass before Phase 5`,
      `${repoPath("blueprint/phase-cards.md")}#Card 5: Phase 4 - The Booking Engine`,
      `${repoPath("docs/analysis/09_clinical_safety_workstreams.md")}#Clinical safety workstreams`,
    ],
    owningTasks: ["seq_310", "seq_314", "seq_341"],
    summary:
      "The candidate shows mature booking truth and browser parity, but the required Phase 4 release-scoped hazard-log delta and rollback rehearsal artifacts are not present as machine-auditable exit evidence in the current repository.",
    blockingRationale:
      "These evidence families are mandatory in the Phase 4 algorithm. Their absence blocks an `approved` exit and blocks any widened rollout claim.",
    currentIssueRefs: ["ISSUE310_001", "ISSUE310_002"],
    implementationEvidence: [
      repoPath("docs/analysis/09_clinical_safety_workstreams.md"),
      repoPath("data/analysis/evidence_artifact_schedule.csv"),
      repoPath("data/analysis/release_watch_required_evidence.csv"),
    ],
    automatedProofArtifacts: [
      repoPath("data/test-reports/309_phase4_e2e_results.json"),
      repoPath("data/test-reports/309_phase4_performance_results.json"),
    ],
  },
];

const boundaryItems: BoundaryItem[] = [
  {
    ownerTask: "seq_311",
    title: "Freeze hub case, acting context, and organisation-boundary law from Phase 4 fallback truth",
    category: "phase5_contract_freeze",
    risk: "Without a frozen handoff contract, Phase 5 could reinterpret local fallback and lose the exact BookingCase lineage that 307 to 309 proved.",
    nextAction:
      "Carry forward BookingCase lineage, fallback reasons, and same-shell continuity rules into the HubCoordinationCase freeze pack.",
  },
  {
    ownerTask: "seq_312",
    title: "Freeze policy tuple, capacity trust, and candidate-ranking formulas",
    category: "phase5_contract_freeze",
    risk: "Network candidate ranking could drift away from the deterministic local-first ordering and capability evidence that Phase 4 proved.",
    nextAction:
      "Bind robust-fit, uncertainty, and source-trust formulas to one policy tuple without loosening Phase 4 proof law.",
  },
  {
    ownerTask: "seq_313",
    title: "Freeze cross-organisation commit, practice visibility, and manage-capability boundaries",
    category: "phase5_contract_freeze",
    risk: "Unsupported or sandbox-only provider paths could be mislabeled as confirmed network truth if commit and visibility contracts are not frozen next.",
    nextAction:
      "Publish the cross-org confirmation and visibility pack with explicit evidence-class separation and minimum-necessary practice visibility.",
  },
  {
    ownerTask: "seq_314",
    title: "Launch Phase 5 only with inherited Phase 4 constraints still live in the readiness registry",
    category: "phase5_gate",
    risk: "Performance, safety, and rollback gaps could disappear into prose unless the first network gate inherits them as named blockers.",
    nextAction:
      "Mark safety delta, rollback rehearsal, and performance budget follow-up as explicit readiness rows before opening downstream tracks.",
  },
  {
    ownerTask: "par_315",
    title: "Implement the hub case kernel without redefining booking lineage, rollback posture, or recovery semantics",
    category: "phase5_execution",
    risk: "Phase 5 backend work could bypass the proven BookingCase recovery and lineage model if the first hub kernel is implemented loosely.",
    nextAction:
      "Implement HubCoordinationCase as a faithful consumer of Phase 4 fallback and recovery truth, not as a detached rewrite.",
  },
  {
    ownerTask: "par_321",
    title: "Expand provider commit and practice continuity only after Phase 4 unsupported edges stay explicit",
    category: "future_live_boundary",
    risk: "Cross-org commit work could overstate supplier and practice confirmation certainty if unsupported Phase 4 edges are forgotten.",
    nextAction:
      "Preserve the unsupported and sandbox-only boundaries when native hub commit and practice continuity messaging land.",
  },
];

const freshnessRows: FreshnessRow[] = [
  {
    evidenceId: "E310_001",
    evidenceFamily: "307 booking core matrix",
    rowId: "PH4_ROW_01",
    capturedAt: String(results307.generatedAt),
    freshnessState: "fresh",
    resultStatus: "passed",
    proofClass: "local_browser_and_service",
    requiredForPhase4Exit: "yes",
    blockingOnApproved: "no",
    ownerTask: "seq_307",
    artifactRef: repoPath("data/test-reports/307_booking_core_matrix_results.json"),
    notes: "Fresh same-day core battery proving capability, slot, hold, commit, compensation, accessibility, and contention behaviour.",
  },
  {
    evidenceId: "E310_002",
    evidenceFamily: "307 provider capability evidence capture",
    rowId: "PH4_ROW_02",
    capturedAt: String(results307.generatedAt),
    freshnessState: "fresh",
    resultStatus: "passed",
    proofClass: "mixed_local_and_sandbox",
    requiredForPhase4Exit: "yes",
    blockingOnApproved: "no",
    ownerTask: "seq_307",
    artifactRef: repoPath(".artifacts/provider-evidence/307-capability/305_capability_evidence_capture_summary.json"),
    notes: "Useful for capability honesty, but still sandbox-bound and not equivalent to live multi-provider rollout proof.",
  },
  {
    evidenceId: "E310_003",
    evidenceFamily: "308 manage waitlist assisted matrix",
    rowId: "PH4_ROW_04",
    capturedAt: String(results308.generatedAt),
    freshnessState: "fresh",
    resultStatus: "passed",
    proofClass: "local_browser_and_service",
    requiredForPhase4Exit: "yes",
    blockingOnApproved: "no",
    ownerTask: "seq_308",
    artifactRef: repoPath("data/test-reports/308_manage_waitlist_assisted_results.json"),
    notes: "Fresh same-day matrix proving manage, waitlist, assisted booking, and reconciliation parity.",
  },
  {
    evidenceId: "E310_004",
    evidenceFamily: "309 local booking e2e suite",
    rowId: "PH4_ROW_05",
    capturedAt: String(results309.generatedAt),
    freshnessState: "fresh",
    resultStatus: "passed",
    proofClass: "local_browser_and_service",
    requiredForPhase4Exit: "yes",
    blockingOnApproved: "no",
    ownerTask: "seq_309",
    artifactRef: repoPath("data/test-reports/309_phase4_e2e_results.json"),
    notes: "Fresh same-day release-grade browser and service evidence across patient, staff, artifact, responsive, and accessibility surfaces.",
  },
  {
    evidenceId: "E310_005",
    evidenceFamily: "309 load probe support budgets",
    rowId: "PH4_ROW_09",
    capturedAt: String(performance309.generatedAt),
    freshnessState: "follow_up_required",
    resultStatus: "failed",
    proofClass: "local_with_support_follow_up",
    requiredForPhase4Exit: "yes",
    blockingOnApproved: "yes",
    ownerTask: "seq_314",
    artifactRef: repoPath("data/test-reports/309_phase4_performance_results.json"),
    notes: "LCP and CLS stayed within target, but all realistic scenarios exceeded the 200ms interaction support target.",
  },
  {
    evidenceId: "E310_006",
    evidenceFamily: "Phase 4 release safety delta",
    rowId: "PH4_ROW_10",
    capturedAt: "",
    freshnessState: "missing",
    resultStatus: "missing",
    proofClass: "missing_required_release_evidence",
    requiredForPhase4Exit: "yes",
    blockingOnApproved: "yes",
    ownerTask: "seq_314",
    artifactRef: "",
    notes: "Required by the Phase 4 algorithm, but no release-scoped hazard-log delta or safety evidence pack was found for the 307 to 309 candidate.",
  },
  {
    evidenceId: "E310_007",
    evidenceFamily: "Phase 4 rollback rehearsal",
    rowId: "PH4_ROW_10",
    capturedAt: "",
    freshnessState: "missing",
    resultStatus: "missing",
    proofClass: "missing_required_release_evidence",
    requiredForPhase4Exit: "yes",
    blockingOnApproved: "yes",
    ownerTask: "seq_314",
    artifactRef: "",
    notes: "Recovery and fallback are proven, but no release-scoped rollback rehearsal artifact was found for the booking engine exit candidate.",
  },
  {
    evidenceId: "E310_008",
    evidenceFamily: "Future live and cross-organisation provider parity",
    rowId: "PH4_ROW_02",
    capturedAt: "",
    freshnessState: "future_live",
    resultStatus: "future_live",
    proofClass: "future_live_or_future_network",
    requiredForPhase4Exit: "no",
    blockingOnApproved: "no",
    ownerTask: "seq_313",
    artifactRef: "",
    notes: "This remains a later Phase 5 or future-live boundary and may not be implied by the local-first Phase 4 evidence bundle.",
  },
];

const liveBoundaryRows = [
  {
    boundaryId: "B310_001",
    surface: "Local booking core engine",
    claimStrength: "local_executable_proof",
    currentEvidence: "Local integration, property, load, and browser suites from 307 to 309",
    acceptedNow: "yes",
    notEquivalentTo: "Network or live multi-provider rollout readiness",
    carryForwardOwner: "seq_311",
  },
  {
    boundaryId: "B310_002",
    surface: "Provider capability capture for practice-local booking",
    claimStrength: "mixed_local_and_sandbox",
    currentEvidence: "307 capability matrix plus sandbox capture artifacts",
    acceptedNow: "yes_with_constraints",
    notEquivalentTo: "Live parity across unsupported or network-assisted paths",
    carryForwardOwner: "seq_313",
  },
  {
    boundaryId: "B310_003",
    surface: "Manual-assist network path",
    claimStrength: "unsupported",
    currentEvidence: "CAP307_002 is explicitly unsupported",
    acceptedNow: "no",
    notEquivalentTo: "Cross-organisation commit or practice continuity truth",
    carryForwardOwner: "seq_313",
  },
  {
    boundaryId: "B310_004",
    surface: "Patient and staff e2e route family",
    claimStrength: "local_browser_proof",
    currentEvidence: "309 release-grade browser suite and accessibility matrix",
    acceptedNow: "yes",
    notEquivalentTo: "Expanded rollout approval while safety, rollback, and performance gaps remain open",
    carryForwardOwner: "seq_314",
  },
  {
    boundaryId: "B310_005",
    surface: "Cross-organisation booking and practice visibility",
    claimStrength: "future_phase5",
    currentEvidence: "Not in Phase 4 scope",
    acceptedNow: "no",
    notEquivalentTo: "Any current booking confirmation or practice acknowledgement claim",
    carryForwardOwner: "seq_311",
  },
];

const scorecardSummary = rows.reduce(
  (summary, row) => {
    if (row.status === "approved") summary.approvedCount += 1;
    if (row.status === "go_with_constraints") summary.goWithConstraintsCount += 1;
    if (row.status === "withheld") summary.withheldCount += 1;
    summary.rowCount += 1;
    return summary;
  },
  {
    approvedCount: 0,
    goWithConstraintsCount: 0,
    withheldCount: 0,
    deferredNonBlockingCount: 0,
    rowCount: 0,
  },
);

const decision = {
  taskId,
  repoRoot: ROOT,
  generatedAt,
  visualMode,
  phase: "phase_4_booking_engine",
  verdict: "go_with_constraints" as Verdict,
  phase5EntryVerdict: "approved" as Verdict,
  widenedRolloutVerdict: "withheld" as Verdict,
  liveProviderParityVerdict: "withheld" as Verdict,
  scorecardSummary,
  phaseBraid: [
    { phaseId: "4B", label: "Capability boundary", status: "go_with_constraints" },
    { phaseId: "4C", label: "Search and ranking", status: "approved" },
    { phaseId: "4D", label: "Reservation truth", status: "approved" },
    { phaseId: "4E", label: "Commit and recovery", status: "approved" },
    { phaseId: "4F", label: "Manage and waitlist", status: "approved" },
    { phaseId: "4G", label: "Reconciliation and artifacts", status: "approved" },
    { phaseId: "4I", label: "Hardening and exit gate", status: "go_with_constraints" },
  ],
  decisionStatement:
    "The Booking Engine is fit to become the local-first foundation for Phase 5, but not for an unconditional Phase 4 approval. The decisive 307 to 309 suites prove local booking truth, manage and waitlist behaviour, same-shell continuity, accessibility, and artifact parity; the exit remains constrained because performance follow-up is open and the release-scoped safety-delta and rollback-rehearsal artifacts are not present as machine-auditable evidence.",
  allowedNextSteps: [
    "Proceed to seq_311 through seq_313 to freeze the network coordination, policy, and cross-organisation commit contracts from the proven local-first booking baseline.",
    "Proceed to seq_314 only if the readiness registry inherits the Phase 4 safety, rollback, and performance constraints instead of hiding them.",
    "Treat BookingCase truth, fallback lineage, artifact law, and same-shell continuity as stable carry-forward inputs for Phase 5 work.",
  ],
  withheldClaims: [
    "Do not claim an unconditional Phase 4 approval for widened rollout or pilot widening.",
    "Do not claim that sandbox capability evidence or unsupported edges are equivalent to live multi-provider parity.",
    "Do not claim that the required release-scoped hazard-log delta or rollback rehearsal is complete for this candidate.",
  ],
  constraints: openIssues.map((issue) => ({
    constraintId: issue.issueId.replace("ISSUE", "C"),
    summary: issue.title,
    scope: issue.blockingScope,
    phase5Blocker: issue.priority === "high",
    ownerTask: issue.ownerTask,
    followOnTasks: issue.followOnTasks,
    nextAction: issue.nextAction,
    evidenceRefs: issue.evidenceRefs,
  })),
  decisiveSuites,
  mandatoryQuestions: [
    {
      questionId: "Q310_001",
      question: "Are the decisive evidence bundles from seq_307 to seq_309 present, fresh, and internally coherent?",
      answerStatus: "approved",
      answer:
        "Yes. The repository contains fresh same-day machine-readable outputs for 307, 308, and 309, and their browser, service, accessibility, and artifact proof families are internally coherent.",
      evidenceRowRefs: ["PH4_ROW_01", "PH4_ROW_04", "PH4_ROW_05", "PH4_ROW_07"],
    },
    {
      questionId: "Q310_002",
      question: "Is the local booking engine itself proven for deterministic search, reservation, commit, manage, waitlist, assisted booking, reconciliation, and artifact truth?",
      answerStatus: "approved",
      answer:
        "Yes for current repository truth. The local-first booking engine is implemented and proven across the full 307 to 309 battery for patient and staff flows.",
      evidenceRowRefs: ["PH4_ROW_01", "PH4_ROW_03", "PH4_ROW_04", "PH4_ROW_06"],
    },
    {
      questionId: "Q310_003",
      question: "Are live, sandbox, unsupported, and future-network claims clearly separated?",
      answerStatus: "go_with_constraints",
      answer:
        "Mostly. The gate now separates them explicitly, but the underlying evidence still includes sandbox-bound provider proof and an unsupported manual-assist edge that must remain visibly constrained.",
      evidenceRowRefs: ["PH4_ROW_02"],
    },
    {
      questionId: "Q310_004",
      question: "Can the Phase 4 exit be called `approved` with the current evidence candidate?",
      answerStatus: "withheld",
      answer:
        "No. The performance support target is currently missed and the release-scoped safety-delta and rollback-rehearsal artifacts are absent, so an unconditional approval would overstate repository truth.",
      evidenceRowRefs: ["PH4_ROW_09", "PH4_ROW_10"],
    },
    {
      questionId: "Q310_005",
      question: "Is the booking engine fit to become the local-first foundation for the network horizon?",
      answerStatus: "go_with_constraints",
      answer:
        "Yes, with explicit constraints. Phase 5 may start from this foundation only if it inherits the performance, safety, rollback, and provider-boundary constraints without relabeling them as solved.",
      evidenceRowRefs: ["PH4_ROW_01", "PH4_ROW_04", "PH4_ROW_05", "PH4_ROW_09", "PH4_ROW_10"],
    },
  ],
  rows,
  boundaryItems,
  liveBoundaryRows,
  conformanceMatrixRef: repoPath("data/analysis/310_phase4_conformance_matrix.csv"),
  freshnessMatrixRef: repoPath("data/analysis/310_phase4_evidence_freshness_matrix.csv"),
  openIssuesRef: repoPath("data/analysis/310_phase4_open_issues_and_carry_forward.json"),
};

const externalReferences = {
  taskId,
  generatedAt,
  decisionUse: "support_only_local_blueprint_remains_authoritative",
  sourcesReviewed: [
    {
      sourceId: "SRC310_NHS_DIGITAL_APPLICABILITY",
      title: "Applicability of DCB 0129 and DCB 0160 - Step by step guidance",
      url: "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
      publisher: "NHS England Digital",
      borrowedFor: [
        "Scoping whether DCB0129 and DCB0160 apply to a product that influences direct care in England",
        "Making the gate pack fail closed on missing release safety evidence instead of treating safety as optional narrative",
      ],
      decision: "accepted",
      notes:
        "Used as current support for the applicability posture. Kept secondary to the local Phase 4 blueprint, which already makes safety evidence mandatory for this exit.",
    },
    {
      sourceId: "SRC310_NHS_ENGLAND_SAFETY_ASSURANCE",
      title: "Digital clinical safety assurance",
      url: "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
      publisher: "NHS England",
      lastUpdated: "2025-03-04",
      borrowedFor: [
        "Separating manufacturer-facing DCB0129 and deployment-facing DCB0160 responsibilities",
        "Treating the Clinical Safety Officer, hazard log, and clinical safety case as concrete evidence families rather than soft governance prose",
      ],
      decision: "accepted",
      notes:
        "Used to support the conclusion that the missing release-scoped hazard delta is real evidence debt, not a cosmetic doc gap.",
    },
    {
      sourceId: "SRC310_PLAYWRIGHT_TRACE",
      title: "Trace viewer",
      url: "https://playwright.dev/docs/trace-viewer",
      publisher: "Playwright",
      borrowedFor: [
        "Keeping trace-backed evidence as the primary browser proof surface",
        "Ensuring the board spec asks for screenshots, DOM snapshots, and metadata-backed review rather than static screenshots alone",
      ],
      decision: "accepted",
      notes:
        "Used to justify trace-backed board proof and to keep the Playwright verification aligned with official trace-review practice.",
    },
    {
      sourceId: "SRC310_PLAYWRIGHT_VISUAL",
      title: "Visual comparisons",
      url: "https://playwright.dev/docs/test-snapshots",
      publisher: "Playwright",
      borrowedFor: [
        "Documenting that screenshot baselines need a stable environment",
        "Framing the board screenshots as proof of rendering states, not as environment-agnostic pixel guarantees",
      ],
      decision: "accepted",
      notes:
        "Used to keep screenshot expectations conservative and environment-specific.",
    },
    {
      sourceId: "SRC310_NHS_TABLES",
      title: "Table component",
      url: "https://service-manual.nhs.uk/design-system/components/table",
      publisher: "NHS digital service manual",
      borrowedFor: [
        "Table-first evidence scanability",
        "Captions, scope usage, and responsive behaviour that reduces horizontal scrolling on narrow screens",
      ],
      decision: "accepted",
      notes:
        "Applied directly to the board layout so every evidence-heavy region has a tabular parity surface.",
    },
    {
      sourceId: "SRC310_NHS_CHECK_ANSWERS",
      title: "Check answers pattern",
      url: "https://service-manual.nhs.uk/design-system/patterns/check-answers",
      publisher: "NHS digital service manual",
      borrowedFor: [
        "Quiet high-trust summary layout before a final decision statement",
        "Dense but readable two-thirds style content framing for the ribbon and decision copy",
      ],
      decision: "accepted",
      notes:
        "Used as a presentation influence only; the board remains a governance surface rather than a transactional confirmation screen.",
    },
    {
      sourceId: "SRC310_CARBON_DATA_TABLE",
      title: "Carbon Design System data table usage",
      url: "https://carbondesignsystem.com/components/data-table/usage/",
      publisher: "IBM Carbon Design System",
      borrowedFor: [
        "Dense table-led evidence browsing",
        "Avoiding decorative cards when the user needs to navigate to specific evidence",
      ],
      decision: "accepted",
      notes:
        "Used to justify a table-first centre canvas and issue inspector.",
    },
    {
      sourceId: "SRC310_VERCEL_DASHBOARD",
      title: "Navigating the Dashboard",
      url: "https://vercel.com/docs/dashboard-features/overview",
      publisher: "Vercel",
      borrowedFor: [
        "Quiet hierarchy with saved list-view bias for operational scanability",
        "Dense dashboard framing without celebratory marketing treatment",
      ],
      decision: "accepted",
      notes:
        "Used as lightweight visual support for the board structure, especially the list-first evidence view.",
    },
    {
      sourceId: "SRC310_LINEAR_TRIAGE",
      title: "Triage",
      url: "https://linear.app/docs/triage",
      publisher: "Linear",
      borrowedFor: [
        "Right-rail issue inspection and ownership-oriented triage framing",
        "Inbox-style treatment of unresolved items rather than burying them in prose",
      ],
      decision: "accepted",
      notes:
        "Used to shape the open-issue inspector and make ownership prominent.",
    },
    {
      sourceId: "SRC310_LINEAR_DISPLAY",
      title: "Display options",
      url: "https://linear.app/docs/display-options",
      publisher: "Linear",
      borrowedFor: [
        "Saved list-vs-board preference thinking",
        "Ordering and grouping controls for dense evidence views",
      ],
      decision: "accepted",
      notes:
        "Used as support for the conformance-family selector and filtered evidence tables.",
    },
  ],
  rejectedOrNotAdopted: [
    {
      sourceId: "REJ310_NHS_REVIEW_DATE_PATTERN",
      url: "https://service-manual.nhs.uk/design-system/patterns/know-that-a-page-is-up-to-date",
      reason:
        "Rejected for the board UI because the service manual explicitly says the pattern should not be used in transactional services. The exit board needs explicit evidence freshness tables instead of passive review dates.",
    },
    {
      sourceId: "REJ310_VERCEL_GRID_VIEW",
      url: "https://vercel.com/docs/dashboard-features/overview",
      reason:
        "Grid treatment was rejected because the prompt requires quiet hierarchy, no decorative KPI cards, and table-first scanability.",
    },
    {
      sourceId: "REJ310_CARBON_COMPLEX_TABLE_VARIANTS",
      url: "https://carbondesignsystem.com/components/data-table/usage/",
      reason:
        "Expansion-heavy and batch-action-heavy variants were rejected because the board needs direct evidence reading more than secondary row actions.",
    },
  ],
};

function buildPackMarkdown(): string {
  const scorecardRows = rows.map((row) => [
    row.rowId,
    row.capabilityFamily,
    row.status,
    row.proofMode,
    row.owningTasks.join(", "),
  ]);

  const suiteRows = decisiveSuites.map((suite) => [
    suite.taskId,
    suite.visualMode,
    suite.suiteVerdict,
    JSON.stringify(suite.summary),
  ]);

  return `# 310 Phase 4 Exit Gate Pack

## Verdict

- Phase 4 exit verdict: \`${decision.verdict}\`
- Phase 5 contract-freeze entry verdict: \`${decision.phase5EntryVerdict}\`
- Widened rollout verdict: \`${decision.widenedRolloutVerdict}\`
- Live-provider parity verdict: \`${decision.liveProviderParityVerdict}\`

${decision.decisionStatement}

## Evidence posture

The exit is evidence-led, not narrative-led. This pack binds the verdict to:

1. the local Phase 4 and Phase 5 blueprint corpus
2. the validated outputs from seq_307, seq_308, and seq_309
3. explicit separation of local, sandbox, unsupported, and future-live proof
4. machine-readable carry-forward rows for every unresolved constraint

## Conformance scorecard summary

${markdownTable(
    ["Row", "Capability family", "Status", "Proof mode", "Owning tasks"],
    scorecardRows,
  )}

## Decisive suite summary

${markdownTable(["Task", "Visual mode", "Suite verdict", "Summary"], suiteRows)}

## Constraints carried by the verdict

${openIssues
    .map(
      (issue) =>
        `- \`${issue.issueId.replace("ISSUE", "C")}\`: ${issue.title}. Owner: \`${issue.ownerTask}\`. Follow-on: ${issue.followOnTasks.map((task) => `\`${task}\``).join(", ")}.`,
    )
    .join("\n")}

## Carry-forward boundary

Phase 4 is strong enough to open the Phase 5 freeze and readiness work, but it is not allowed to over-claim:

- local booking truth, manage truth, waitlist truth, artifact law, and same-shell continuity are real and carry forward
- widened rollout, live provider parity, release safety completion, and rollback rehearsal completion do not carry forward as solved facts
- Phase 5 must consume the proven BookingCase lineage and constraints instead of rebuilding booking semantics from scratch

## Machine-auditable artifacts

- Decision file: [310_phase4_exit_gate_decision.json](${repoPath("data/analysis/310_phase4_exit_gate_decision.json")})
- Conformance matrix: [310_phase4_conformance_matrix.csv](${repoPath("data/analysis/310_phase4_conformance_matrix.csv")})
- Freshness matrix: [310_phase4_evidence_freshness_matrix.csv](${repoPath("data/analysis/310_phase4_evidence_freshness_matrix.csv")})
- Open issues: [310_phase4_open_issues_and_carry_forward.json](${repoPath("data/analysis/310_phase4_open_issues_and_carry_forward.json")})
- Board: [310_phase4_exit_board.html](${repoPath("docs/frontend/310_phase4_exit_board.html")})
`;
}

function buildDecisionMarkdown(): string {
  const questionRows = decision.mandatoryQuestions.map((entry) => [
    entry.questionId,
    entry.answerStatus,
    entry.question,
    entry.answer,
  ]);

  return `# 310 Phase 4 Go/No-Go Decision

## Decision

The authoritative verdict is \`${decision.verdict}\`.

This is a **go** for:

- opening the Phase 5 freeze tasks \`311\` to \`313\`
- treating the Booking Engine as the local-first foundation that the Network Horizon must consume
- carrying forward BookingCase lineage, same-shell continuity, manage truth, waitlist truth, and artifact law into Phase 5
- opening the Phase 5 readiness gate \`314\` with explicit inherited blockers

This is a **no-go** for:

- calling the Phase 4 exit \`approved\`
- widening rollout while the 309 interaction support target remains failed
- claiming that the release-scoped hazard-log delta or rollback rehearsal is complete
- implying that sandbox-bound or unsupported provider edges are equivalent to live multi-provider parity

## Why the verdict is not \`approved\`

The current repository proves the Booking Engine itself. Seq_307, seq_308, and seq_309 give coherent evidence for booking core truth, manage and waitlist behaviour, assisted booking, reconciliation, artifacts, accessibility, and same-shell continuity. The verdict remains constrained because the current candidate still has three material gaps:

- the local booking load probe misses the 200ms interaction support target in all realistic scenarios
- no release-scoped Phase 4 hazard-log delta or safety evidence bundle was found for the candidate
- no release-scoped rollback rehearsal artifact was found for the candidate

## Mandatory question ledger

${markdownTable(["Id", "Status", "Question", "Answer"], questionRows)}
`;
}

function buildScorecardMarkdown(): string {
  const tableRows = rows.map((row) => [
    row.rowId,
    row.capabilityFamily,
    row.status,
    row.proofMode,
    row.phaseRefs.join("; "),
    row.blockingRationale || "None",
  ]);

  const notes = rows
    .map(
      (row) => `### ${row.rowId} ${row.capabilityFamily}
- Summary: ${row.summary}
- Source sections: ${row.sourceSections.join(", ")}
- Owning tasks: ${row.owningTasks.join(", ")}
- Implementation evidence: ${row.implementationEvidence.join(", ")}
- Automated proof: ${row.automatedProofArtifacts.join(", ")}
`,
    )
    .join("\n");

  return `# 310 Phase 4 Conformance Scorecard

${markdownTable(
    ["Row", "Capability family", "Status", "Proof mode", "Phase refs", "Blocking rationale"],
    tableRows,
  )}

## Row notes

${notes}`;
}

function buildBoundaryMarkdown(): string {
  const tableRows = boundaryItems.map((item) => [
    item.ownerTask,
    item.title,
    item.category,
    item.risk,
    item.nextAction,
  ]);

  return `# 310 Phase 4 To Phase 5 Boundary

Phase 4 closes as a constrained but valid local-first foundation. Phase 5 starts from that proven foundation and must not reopen BookingCase truth casually.

## Phase 5 consumes from Phase 4

- deterministic capability resolution, slot ranking, reservation truth, commit fencing, and ambiguous-confirmation law from seq_307
- patient manage, waitlist, assisted booking, reconciliation, and artifact truth from seq_308
- patient and staff end-to-end shell continuity, accessibility, responsive parity, and artifact parity from seq_309
- the explicit open-issue and evidence-boundary rows from this exit gate

## Phase 5 must not redefine

- the distinction between local executable proof and sandbox or future-live proof
- the rule that BookingCase truth is local-first and authoritative before any hub fallback begins
- same-shell continuity and route-publication recovery law
- the requirement that widened rollout remains blocked until safety, rollback, and performance gaps are closed

## Carry-forward items

${markdownTable(["Owner task", "Work item", "Category", "Risk if absent", "Next action"], tableRows)}
`;
}

function buildBoundaryClassMarkdown(): string {
  const tableRows = liveBoundaryRows.map((row) => [
    row.boundaryId,
    row.surface,
    row.claimStrength,
    row.currentEvidence,
    row.acceptedNow,
    row.notEquivalentTo,
    row.carryForwardOwner,
  ]);

  return `# 310 Phase 4 Live vs Sandbox vs Simulator Boundary

## Accepted now

- local executable booking truth proven in seq_307 to seq_309
- sandbox-backed capability evidence only where the board keeps that class explicit
- unsupported edges called unsupported instead of promoted into calm success copy

## Not equivalent to stronger proof

- sandbox provider evidence is not live provider parity
- local browser proof is not widened rollout approval
- recovery and fallback tests are not the same thing as a captured rollback rehearsal

## Boundary table

${markdownTable(
    ["Id", "Surface", "Claim strength", "Current evidence", "Accepted now", "Not equivalent to", "Owner"],
    tableRows,
  )}
`;
}

function main() {
  writeJson("data/analysis/310_external_reference_notes.json", externalReferences);
  writeJson("data/analysis/310_phase4_exit_gate_decision.json", decision);
  writeJson("data/analysis/310_phase4_open_issues_and_carry_forward.json", openIssues);

  writeCsv(
    "data/analysis/310_phase4_conformance_matrix.csv",
    [
      "rowId",
      "capabilityFamily",
      "status",
      "proofMode",
      "phaseRefs",
      "currentIssueRefs",
      "owningTasks",
      "blockingRationale",
      "primaryEvidenceRef",
    ],
    rows.map((row) => ({
      rowId: row.rowId,
      capabilityFamily: row.capabilityFamily,
      status: row.status,
      proofMode: row.proofMode,
      phaseRefs: row.phaseRefs.join(";"),
      currentIssueRefs: row.currentIssueRefs.join(";"),
      owningTasks: row.owningTasks.join(";"),
      blockingRationale: row.blockingRationale,
      primaryEvidenceRef: row.automatedProofArtifacts[0] ?? "",
    })),
  );

  writeCsv(
    "data/analysis/310_phase4_evidence_freshness_matrix.csv",
    [
      "evidenceId",
      "evidenceFamily",
      "rowId",
      "capturedAt",
      "freshnessState",
      "resultStatus",
      "proofClass",
      "requiredForPhase4Exit",
      "blockingOnApproved",
      "ownerTask",
      "artifactRef",
      "notes",
    ],
    freshnessRows.map((row) => ({
      evidenceId: row.evidenceId,
      evidenceFamily: row.evidenceFamily,
      rowId: row.rowId,
      capturedAt: row.capturedAt,
      freshnessState: row.freshnessState,
      resultStatus: row.resultStatus,
      proofClass: row.proofClass,
      requiredForPhase4Exit: row.requiredForPhase4Exit,
      blockingOnApproved: row.blockingOnApproved,
      ownerTask: row.ownerTask,
      artifactRef: row.artifactRef,
      notes: row.notes,
    })),
  );

  writeText("docs/governance/310_phase4_exit_gate_pack.md", buildPackMarkdown());
  writeText("docs/governance/310_phase4_go_no_go_decision.md", buildDecisionMarkdown());
  writeText("docs/governance/310_phase4_conformance_scorecard.md", buildScorecardMarkdown());
  writeText("docs/governance/310_phase4_to_phase5_boundary.md", buildBoundaryMarkdown());
  writeText(
    "docs/governance/310_phase4_live_vs_sandbox_vs_simulator_boundary.md",
    buildBoundaryClassMarkdown(),
  );

  console.log("build_310_phase4_exit_gate: wrote governance and analysis artifacts");
}

main();
