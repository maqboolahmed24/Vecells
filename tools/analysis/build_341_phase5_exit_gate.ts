import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

type Verdict = "approved" | "go_with_constraints" | "withheld";
type EvidenceStatus = "proved" | "proved_with_constraints" | "not_proved" | "missing_evidence";
type Severity = "sev1" | "sev2" | "sev3";

interface BlockerEntry {
  blockerId: string;
  title: string;
  severity: Severity;
  status: "open";
  scope: string;
  effectOnVerdict: "blocks_approved" | "blocks_widened_release";
  ownerTask: string;
  nextTrack: string;
  summary: string;
  unblockingCriteria: string;
  affectedCapabilityIds: string[];
  evidenceRefs: string[];
}

interface CarryForwardEntry {
  carryForwardId: string;
  title: string;
  classification:
    | "bounded_interface_gap"
    | "live_onboarding_boundary"
    | "operational_review"
    | "explicitly_unsupported"
    | "frontend_performance_hygiene";
  status: "open";
  ownerTask: string;
  nextTrack: string;
  summary: string;
  guardrail: string;
  affectedCapabilityIds: string[];
  evidenceRefs: string[];
}

interface CapabilityEntry {
  capabilityId: string;
  title: string;
  contractFamily: string;
  audience: string;
  environmentClass: string;
  evidenceStatus: EvidenceStatus;
  releaseInterpretation: Exclude<Verdict, "withheld">;
  ownerTasks: string[];
  phaseRefs: string[];
  frozenContractRefs: string[];
  executableRefs: string[];
  proofRefs: string[];
  blockerRefs: string[];
  carryForwardRefs: string[];
  summary: string;
  releaseNotes: string;
}

interface EvidenceRow {
  evidenceId: string;
  capabilityId: string;
  title: string;
  evidenceFamily: string;
  status: "passed" | "constrained" | "open";
  audience: string;
  environmentClass: string;
  artifactRefs: string[];
  summary: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const OUTPUTS = {
  decisionDoc: "docs/release/341_phase5_exit_gate_decision.md",
  mapDoc: "docs/architecture/341_phase5_completion_and_carry_forward_map.md",
  board: "docs/frontend/341_phase5_exit_gate_board.html",
  reviewGuide: "docs/testing/341_phase5_evidence_review_guide.md",
  verdict: "data/contracts/341_phase5_exit_verdict.json",
  readiness: "data/contracts/341_phase5_release_readiness_registry.json",
  handoff: "data/contracts/341_phase5_to_phase6_handoff_contract.json",
  externalNotes: "data/analysis/341_external_reference_notes.json",
  consistencyCsv: "data/analysis/341_phase5_contract_consistency_matrix.csv",
  evidenceCsv: "data/analysis/341_phase5_evidence_matrix.csv",
  blockerLedger: "data/analysis/341_phase5_blocker_ledger.json",
  carryForwardLedger: "data/analysis/341_phase5_carry_forward_ledger.json",
  seed342: "data/launchpacks/341_phase6_seed_packet_342.json",
  seed343: "data/launchpacks/341_phase6_seed_packet_343.json",
  seed344: "data/launchpacks/341_phase6_seed_packet_344.json",
  seed345: "data/launchpacks/341_phase6_seed_packet_345.json",
} as const;

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

function markdownTable(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
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

function exec(command: string): string {
  return execSync(command, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
}

const results338 = readJson<any>("data/test-reports/338_scope_capacity_ranking_sla_results.json");
const results339 = readJson<any>("data/test-reports/339_commit_mesh_no_slot_reopen_results.json");
const results340 = readJson<any>("data/test-results/340_phase5_browser_suite_summary.json");
const phase4Exit = readJson<any>("data/analysis/310_phase4_exit_gate_decision.json");
const meshContract = readJson<any>("data/contracts/335_mesh_route_contract.json");
const meshGapRegister = readJson<any>("data/analysis/335_mesh_setup_gap_register.json");
const partnerFeedContract = readJson<any>("data/contracts/336_capacity_feed_configuration_contract.json");
const partnerFeedGapRegister = readJson<any>("data/analysis/336_partner_feed_gap_register.json");

const commitRef = exec("git rev-parse HEAD");
const shortCommitRef = exec("git rev-parse --short HEAD");
const branchRef = exec("git rev-parse --abbrev-ref HEAD");
const pnpmVersion = exec("pnpm --version");
const generatedAt = new Date().toISOString();
const decidedAt = generatedAt;
const runId = `341-${generatedAt.replaceAll(/[-:TZ.]/g, "").slice(0, 14)}-${shortCommitRef}`;
const taskId = "seq_341_phase5_exit_gate";
const verdict: Verdict = "go_with_constraints";
const releaseClass = "controlled_phase5_foundation_only";
const phase6LaunchCondition =
  "open_seq_342_to_seq_345_from_phase5_foundation_with_inherited_constraints";

const blockers: BlockerEntry[] = [
  {
    blockerId: "BLK341_001",
    title: "Release-scoped clinical-safety delta is still missing from the executable Phase 5 candidate",
    severity: "sev2",
    status: "open",
    scope: "unconditional_phase5_exit",
    effectOnVerdict: "blocks_approved",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "Seq_310 carried forward the requirement for a release-scoped hazard-log delta and refreshed safety evidence. No later Phase 5 task published a replacement artifact, so an unconditional approval would overstate current repository truth.",
    unblockingCriteria:
      "Publish a release-specific hazard-log delta and refreshed clinical-safety evidence packet that explicitly covers the final Network Horizon candidate.",
    affectedCapabilityIds: ["CAP341_00"],
    evidenceRefs: [
      "data/analysis/310_phase4_exit_gate_decision.json",
      "blueprint/phase-5-the-network-horizon.md",
      "docs/analysis/09_clinical_safety_workstreams.md",
    ],
  },
  {
    blockerId: "BLK341_002",
    title: "Rollback rehearsal evidence is still absent for the final Network Horizon candidate",
    severity: "sev2",
    status: "open",
    scope: "unconditional_phase5_exit",
    effectOnVerdict: "blocks_approved",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "The Phase 4 exit passed forward rollback rehearsal as a hard release condition. Phase 5 completed its executable wave without a machine-auditable rollback rehearsal artifact for the final candidate.",
    unblockingCriteria:
      "Capture and publish a release-scoped rollback rehearsal that covers the final Network Horizon stack and environment assumptions.",
    affectedCapabilityIds: ["CAP341_00"],
    evidenceRefs: [
      "data/analysis/310_phase4_exit_gate_decision.json",
      "data/test-reports/309_phase4_performance_results.json",
      "docs/release/314_phase5_parallel_open_gate.md",
    ],
  },
  {
    blockerId: "BLK341_003",
    title: "The inherited interaction-support target has not been re-cleared for widened rollout claims",
    severity: "sev3",
    status: "open",
    scope: "widened_rollout_claims",
    effectOnVerdict: "blocks_widened_release",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "Seq_309 failed the 200ms interaction support target, and later browser suites proved truthfulness, accessibility, and responsiveness but did not replace the missing widened-rollout performance clearance.",
    unblockingCriteria:
      "Run a final support-target proof that clears the inherited interaction budget before widening rollout posture beyond the controlled foundation.",
    affectedCapabilityIds: ["CAP341_00", "CAP341_10"],
    evidenceRefs: [
      "data/analysis/310_phase4_exit_gate_decision.json",
      "data/test-reports/309_phase4_performance_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
  },
  {
    blockerId: "BLK341_004",
    title: "Live partner onboarding remains manual-bridge or review-required for routes and feeds",
    severity: "sev3",
    status: "open",
    scope: "live_partner_release",
    effectOnVerdict: "blocks_approved",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "Seq_335 and seq_336 formalized local-twin and supported-test setup, but Path-to-Live MESH mailboxes, supplier-admin feed onboarding, and GP Connect INT promotion remain explicit manual or review boundaries.",
    unblockingCriteria:
      "Replace the manual-bridge and review-required route or feed rows with current lawful operator evidence before claiming live-ready parity.",
    affectedCapabilityIds: ["CAP341_02", "CAP341_08"],
    evidenceRefs: [
      "data/contracts/335_mesh_route_contract.json",
      "data/analysis/335_mesh_setup_gap_register.json",
      "data/contracts/336_capacity_feed_configuration_contract.json",
      "data/analysis/336_partner_feed_gap_register.json",
    ],
  },
];

const carryForwards: CarryForwardEntry[] = [
  {
    carryForwardId: "CF341_001",
    title: "Queue-side patient-choice expiry remains a typed fail-closed upstream gap",
    classification: "bounded_interface_gap",
    status: "open",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "The queue-side patient-choice expiry binding remains blocked by an explicit typed gap, but the current behavior fails closed and the browser-visible choice surfaces remain truthful.",
    guardrail:
      "Do not convert the blocked timer state into a calm or implicit live expiry claim until the upstream alternative-offer session binding is complete.",
    affectedCapabilityIds: ["CAP341_03"],
    evidenceRefs: [
      "data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_QUEUE_PATIENT_CHOICE_EXPIRY.json",
      "data/test-reports/338_scope_capacity_ranking_sla_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
  },
  {
    carryForwardId: "CF341_002",
    title: "Path-to-Live MESH mailbox administration remains a manual bridge",
    classification: "live_onboarding_boundary",
    status: "open",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "The repo proves manifest-driven local convergence and route verification, but lawful PTL mailbox creation and MOLES lookup remain NHS-admin-managed.",
    guardrail:
      "Treat PTL rows as manual_bridge_required until operator evidence replaces the masked bridge.",
    affectedCapabilityIds: ["CAP341_08"],
    evidenceRefs: [
      "data/analysis/335_mesh_setup_gap_register.json",
      "docs/ops/335_mesh_mailbox_and_route_runbook.md",
    ],
  },
  {
    carryForwardId: "CF341_003",
    title: "Supported-test supplier portal onboarding and GP Connect INT promotion remain bounded operational reviews",
    classification: "operational_review",
    status: "open",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "Supplier portal steps remain manual_bridge_required and the GP Connect INT row remains preflight-only instead of fully verified supplier truth.",
    guardrail:
      "Do not relabel supported-test or INT preflight rows as live-ready partner proof without named operator evidence.",
    affectedCapabilityIds: ["CAP341_02", "CAP341_08"],
    evidenceRefs: [
      "data/analysis/336_partner_feed_gap_register.json",
      "docs/ops/336_network_capacity_feed_setup_runbook.md",
    ],
  },
  {
    carryForwardId: "CF341_004",
    title: "Secret rotation and credential stewardship remain out-of-repo operational controls",
    classification: "operational_review",
    status: "open",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "Seq_336 keeps secrets masked and referenced, but actual live rotation ownership remains external to source control and still requires current review.",
    guardrail:
      "Never treat a masked manifest or fingerprint as proof that live secret rotation ownership is current.",
    affectedCapabilityIds: ["CAP341_02", "CAP341_08"],
    evidenceRefs: [
      "data/analysis/336_partner_feed_gap_register.json",
      "docs/security/336_partner_feed_secret_handling.md",
    ],
  },
  {
    carryForwardId: "CF341_005",
    title: "The unsupported legacy shadow feed remains explicit and must stay non-routable",
    classification: "explicitly_unsupported",
    status: "open",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "The legacy shadow feed remains deliberately unsupported and must not become an accidental live integration path during later work.",
    guardrail:
      "Keep adapter binding disabled and preserve the unsupported classification until the source is formally retired or replaced.",
    affectedCapabilityIds: ["CAP341_02", "CAP341_08"],
    evidenceRefs: [
      "data/contracts/336_capacity_feed_configuration_contract.json",
      "data/analysis/336_partner_feed_gap_register.json",
    ],
  },
  {
    carryForwardId: "CF341_006",
    title: "Large Vite bundle warnings remain open frontend hygiene debt",
    classification: "frontend_performance_hygiene",
    status: "open",
    ownerTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    nextTrack: "seq_345",
    summary:
      "Hub and patient builds still emit large post-minification chunk warnings. The 340 battery proved truth and accessibility, but code-splitting hygiene remains open.",
    guardrail:
      "Do not reinterpret the warning as a functional correctness defect, but keep it visible until bundle structure is improved.",
    affectedCapabilityIds: ["CAP341_10"],
    evidenceRefs: [
      "data/test-results/340_phase5_browser_suite_summary.json",
      "apps/hub-desk/package.json",
      "apps/patient-web/package.json",
    ],
  },
];

const capabilities: CapabilityEntry[] = [
  {
    capabilityId: "CAP341_00",
    title: "Release governance, inherited safety evidence, and rollout boundary",
    contractFamily: "governance",
    audience: "platform",
    environmentClass: "controlled_foundation",
    evidenceStatus: "proved_with_constraints",
    releaseInterpretation: "go_with_constraints",
    ownerTasks: ["seq_310", "seq_314", "seq_341"],
    phaseRefs: ["5I"],
    frozenContractRefs: [
      "blueprint/phase-5-the-network-horizon.md",
      "docs/release/314_phase5_parallel_open_gate.md",
      "data/analysis/310_phase4_exit_gate_decision.json",
    ],
    executableRefs: [
      "tools/analysis/build_341_phase5_exit_gate.ts",
      "docs/frontend/341_phase5_exit_gate_board.html",
    ],
    proofRefs: [
      "data/test-reports/338_scope_capacity_ranking_sla_results.json",
      "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
    blockerRefs: ["BLK341_001", "BLK341_002", "BLK341_003"],
    carryForwardRefs: [],
    summary:
      "Phase 5 now has a full executable and browser-proof foundation, but inherited safety, rollback, and widened-rollout constraints still prevent an unconditional approval verdict.",
    releaseNotes:
      "Phase 6 may open from the proven foundation only if these inherited release constraints remain explicit and fail closed.",
  },
  {
    capabilityId: "CAP341_01",
    title: "Acting context and cross-organisation visibility",
    contractFamily: "identity_visibility",
    audience: "staff_cross_org",
    environmentClass: "local_nonprod_foundation",
    evidenceStatus: "proved",
    releaseInterpretation: "approved",
    ownerTasks: ["seq_311", "par_316", "par_332", "seq_338", "seq_340"],
    phaseRefs: ["5B"],
    frozenContractRefs: [
      "docs/architecture/311_phase5_hub_case_and_acting_context_contract.md",
      "docs/security/316_break_glass_scope_tuple_and_minimum_necessary_rules.md",
      "data/contracts/311_hub_visibility_tier_contract.json",
      "data/analysis/316_scope_drift_cases.csv",
    ],
    executableRefs: [
      "packages/domains/hub_coordination/src/phase5-acting-context-visibility-kernel.ts",
      "apps/hub-desk/src/hub-desk-shell.tsx",
      "apps/hub-desk/src/hub-desk-shell.model.ts",
    ],
    proofRefs: [
      "tools/analysis/validate_316_acting_context_scope_and_visibility.ts",
      "tools/analysis/validate_332_acting_context_control_plane.ts",
      "data/test-reports/338_scope_capacity_ranking_sla_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    summary:
      "Acting-context drift, minimum-necessary visibility, and break-glass posture all fail closed across backend and browser-visible surfaces.",
    releaseNotes:
      "This capability is stable enough for Phase 6 to consume directly without semantic rediscovery.",
  },
  {
    capabilityId: "CAP341_02",
    title: "Capacity ingestion and source trust",
    contractFamily: "capacity_trust",
    audience: "network_ops",
    environmentClass: "controlled_partner_boundary",
    evidenceStatus: "proved_with_constraints",
    releaseInterpretation: "go_with_constraints",
    ownerTasks: ["seq_312", "par_318", "seq_336", "seq_338"],
    phaseRefs: ["5C"],
    frozenContractRefs: [
      "docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md",
      "docs/architecture/318_capacity_ingestion_and_candidate_snapshot_pipeline.md",
      "data/contracts/336_capacity_feed_configuration_contract.json",
    ],
    executableRefs: [
      "packages/domains/hub_coordination/src/phase5-network-capacity-pipeline.ts",
      "scripts/capacity/336_partner_feed_lib.ts",
      "scripts/capacity/336_bootstrap_partner_feeds.ts",
    ],
    proofRefs: [
      "tools/analysis/validate_318_capacity_snapshot_and_rank_proof.ts",
      "tools/analysis/validate_336_partner_feed_configuration.ts",
      "data/test-reports/338_scope_capacity_ranking_sla_results.json",
    ],
    blockerRefs: ["BLK341_004"],
    carryForwardRefs: ["CF341_003", "CF341_004", "CF341_005"],
    summary:
      "Source admission, degraded/quarantined handling, and local twin partner feeds are proven, but supported-test and live onboarding still remain bounded operational work.",
    releaseNotes:
      "Phase 6 may rely on the trust model and deterministic adapters, but not on live-ready partner onboarding claims.",
  },
  {
    capabilityId: "CAP341_03",
    title: "Candidate ranking and alternative-offer truth",
    contractFamily: "choice_truth",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    evidenceStatus: "proved_with_constraints",
    releaseInterpretation: "go_with_constraints",
    ownerTasks: ["seq_312", "par_319", "par_320", "par_328", "seq_338", "seq_340"],
    phaseRefs: ["5C", "5D", "5E"],
    frozenContractRefs: [
      "docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md",
      "docs/architecture/319_hub_queue_ranking_and_workbench_projection_engine.md",
      "docs/architecture/320_alternative_offer_optimisation_and_secure_choice_backend.md",
    ],
    executableRefs: [
      "packages/domains/hub_coordination/src/phase5-hub-queue-engine.ts",
      "packages/domains/hub_coordination/src/phase5-alternative-offer-engine.ts",
      "apps/patient-web/src/patient-network-alternative-choice.tsx",
    ],
    proofRefs: [
      "tools/analysis/validate_319_hub_queue_engine.ts",
      "tools/analysis/validate_320_offer_solver_and_choice_guards.ts",
      "tools/analysis/validate_328_patient_network_alternative_choice.ts",
      "data/test-reports/338_scope_capacity_ranking_sla_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
    blockerRefs: [],
    carryForwardRefs: ["CF341_001"],
    summary:
      "The visible frontier, warned-choice treatment, and cross-surface truth are proven, while the queue-side expiry timer integration remains an explicit fail-closed gap.",
    releaseNotes:
      "Phase 6 must preserve frontier truth and advisory separation and must not silently calm blocked expiry states.",
  },
  {
    capabilityId: "CAP341_04",
    title: "Hub claim, transfer, and ownership fence",
    contractFamily: "ownership_fencing",
    audience: "staff_cross_org",
    environmentClass: "local_nonprod_foundation",
    evidenceStatus: "proved",
    releaseInterpretation: "approved",
    ownerTasks: ["seq_311", "par_315", "par_319", "par_326", "par_327", "seq_338"],
    phaseRefs: ["5A", "5D"],
    frozenContractRefs: [
      "docs/architecture/311_phase5_hub_case_and_acting_context_contract.md",
      "docs/architecture/315_hub_case_kernel_and_state_machine.md",
      "docs/api/319_hub_queue_and_console_projection_api.md",
    ],
    executableRefs: [
      "packages/domains/hub_coordination/src/phase5-hub-case-kernel.ts",
      "packages/domains/hub_coordination/src/phase5-hub-queue-engine.ts",
      "apps/hub-desk/src/hub-desk-shell.model.ts",
    ],
    proofRefs: [
      "tools/analysis/validate_315_hub_case_kernel.ts",
      "tools/analysis/validate_319_hub_queue_engine.ts",
      "tools/analysis/validate_327_hub_queue_candidate_and_sla_ui.ts",
      "data/test-reports/338_scope_capacity_ranking_sla_results.json",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    summary:
      "Ownership epochs, stale-owner recovery, transfer continuity, and same-shell queue claim behavior remain materially intact.",
    releaseNotes:
      "Phase 6 case kernels may depend on the lineage and fence semantics as stable foundation law.",
  },
  {
    capabilityId: "CAP341_05",
    title: "Commit truth and confirmation evidence",
    contractFamily: "commit_confirmation",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    evidenceStatus: "proved",
    releaseInterpretation: "approved",
    ownerTasks: ["seq_313", "par_321", "par_325", "par_329", "seq_339"],
    phaseRefs: ["5F"],
    frozenContractRefs: [
      "docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
      "docs/architecture/321_hub_commit_attempts_confirmation_gates_and_appointment_truth.md",
      "docs/security/321_commit_fence_idempotency_and_confirmation_rules.md",
    ],
    executableRefs: [
      "packages/domains/hub_coordination/src/phase5-hub-commit-engine.ts",
      "packages/domains/hub_coordination/src/phase5-hub-background-integrity-engine.ts",
      "apps/patient-web/src/patient-network-confirmation.tsx",
    ],
    proofRefs: [
      "tools/analysis/validate_321_hub_commit_and_confirmation_gate.ts",
      "tools/analysis/validate_325_hub_workers_and_backfill.ts",
      "tools/analysis/validate_329_commit_confirmation_and_visibility_ui.ts",
      "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    summary:
      "Commit fencing, pending-versus-confirmed truth, imported confirmation handling, and browser confirmation surfaces are all backed by current proof.",
    releaseNotes:
      "Phase 6 must preserve the split between provisional, confirmed, and disputed truth and may not mint calmer states from weaker observations.",
  },
  {
    capabilityId: "CAP341_06",
    title: "Reminder/manage and patient timeline continuity",
    contractFamily: "manage_timeline",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    evidenceStatus: "proved",
    releaseInterpretation: "approved",
    ownerTasks: ["par_324", "par_330", "seq_337", "seq_339", "seq_340"],
    phaseRefs: ["5H"],
    frozenContractRefs: [
      "docs/architecture/324_network_reminders_manage_and_practice_visibility_backend.md",
      "docs/frontend/330_network_manage_and_message_timeline_spec.md",
      "docs/architecture/337_network_local_booking_and_patient_manage_merge.md",
    ],
    executableRefs: [
      "packages/domains/hub_coordination/src/phase5-reminders-manage-visibility-engine.ts",
      "apps/patient-web/src/patient-network-manage.tsx",
      "apps/patient-web/src/patient-appointment-family-workspace.tsx",
    ],
    proofRefs: [
      "tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts",
      "tools/analysis/validate_330_network_manage_and_message_timeline.ts",
      "tools/analysis/validate_337_appointment_family_merge.ts",
      "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    summary:
      "Manage capability settlement, reminders, and merged appointment-family continuity are all proven without misleading calmness.",
    releaseNotes:
      "Phase 6 patient flows may rely on this continuity grammar and must not fork a second appointment-truth model.",
  },
  {
    capabilityId: "CAP341_07",
    title: "Practice visibility and acknowledgement debt",
    contractFamily: "practice_visibility",
    audience: "cross_org",
    environmentClass: "local_nonprod_foundation",
    evidenceStatus: "proved",
    releaseInterpretation: "approved",
    ownerTasks: ["seq_313", "par_322", "par_324", "par_329", "seq_339", "seq_340"],
    phaseRefs: ["5F", "5H"],
    frozenContractRefs: [
      "docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
      "docs/architecture/322_practice_continuity_message_and_acknowledgement_chain.md",
      "docs/frontend/329_cross_org_commit_confirmation_and_visibility_spec.md",
    ],
    executableRefs: [
      "packages/domains/hub_coordination/src/phase5-practice-continuity-engine.ts",
      "packages/domains/hub_coordination/src/phase5-reminders-manage-visibility-engine.ts",
      "apps/hub-desk/src/hub-commit-confirmation-pane.tsx",
    ],
    proofRefs: [
      "tools/analysis/validate_322_practice_continuity_chain.ts",
      "tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts",
      "tools/analysis/validate_329_commit_confirmation_and_visibility_ui.ts",
      "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    summary:
      "Practice visibility projections and acknowledgement debt remain separate truths, and the browser-visible surfaces keep the distinction intact.",
    releaseNotes:
      "Phase 6 may rely on the debt-generation and minimum-necessary law directly.",
  },
  {
    capabilityId: "CAP341_08",
    title: "MESH continuity, route verification, and partner-route setup",
    contractFamily: "transport_onboarding",
    audience: "network_ops",
    environmentClass: "controlled_partner_boundary",
    evidenceStatus: "proved_with_constraints",
    releaseInterpretation: "go_with_constraints",
    ownerTasks: ["par_322", "seq_335", "seq_336", "seq_339"],
    phaseRefs: ["5F"],
    frozenContractRefs: [
      "docs/architecture/322_practice_continuity_message_and_acknowledgement_chain.md",
      "data/contracts/335_mesh_route_contract.json",
      "data/contracts/336_capacity_feed_configuration_contract.json",
    ],
    executableRefs: [
      "services/hub-booking-reconciler/src/service-definition.ts",
      "scripts/messaging/335_mesh_mailbox_lib.ts",
      "scripts/capacity/336_partner_feed_lib.ts",
    ],
    proofRefs: [
      "tools/analysis/validate_322_practice_continuity_chain.ts",
      "tools/analysis/validate_335_mesh_configuration.ts",
      "tools/analysis/validate_336_partner_feed_configuration.ts",
      "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
    ],
    blockerRefs: ["BLK341_004"],
    carryForwardRefs: ["CF341_002", "CF341_003", "CF341_004", "CF341_005"],
    summary:
      "Local-twin continuity, route verification, and supported environment separation are proven, but lawful live onboarding remains a controlled manual or review boundary.",
    releaseNotes:
      "Phase 6 may rely on the route and feed contracts, not on live-ready operator completion.",
  },
  {
    capabilityId: "CAP341_09",
    title: "No-slot, callback transfer, return-to-practice, and reopen recovery",
    contractFamily: "recovery",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    evidenceStatus: "proved",
    releaseInterpretation: "approved",
    ownerTasks: ["par_323", "par_331", "seq_339", "seq_340"],
    phaseRefs: ["5E", "5F"],
    frozenContractRefs: [
      "docs/architecture/323_no_slot_callback_return_and_reopen_workflows.md",
      "docs/frontend/331_hub_no_slot_reopen_and_recovery_spec.md",
      "docs/security/323_urgent_return_callback_and_loop_prevention_rules.md",
    ],
    executableRefs: [
      "packages/domains/hub_coordination/src/phase5-hub-fallback-engine.ts",
      "apps/hub-desk/src/hub-desk-shell.tsx",
    ],
    proofRefs: [
      "tools/analysis/validate_323_hub_fallback_workflows.ts",
      "tools/analysis/validate_331_hub_recovery_and_exception_ui.ts",
      "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
    blockerRefs: [],
    carryForwardRefs: [],
    summary:
      "Fallback, callback, urgent return, and reopen behavior are proven as distinct authorities rather than flattened into one recovery outcome.",
    releaseNotes:
      "Phase 6 bounce-back and urgent-return work must preserve this separation without rediscovering it.",
  },
  {
    capabilityId: "CAP341_10",
    title: "Browser accessibility, responsive parity, and content quality",
    contractFamily: "browser_quality",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    evidenceStatus: "proved",
    releaseInterpretation: "approved",
    ownerTasks: ["par_326", "par_327", "par_328", "par_329", "par_330", "par_331", "par_332", "par_333", "par_334", "seq_338", "seq_340"],
    phaseRefs: ["5E", "5H", "5I"],
    frozenContractRefs: [
      "blueprint/accessibility-and-content-system-contract.md",
      "docs/frontend/333_mobile_and_narrow_screen_hub_workflows_spec.md",
      "docs/frontend/334_cross_org_accessibility_content_and_artifact_handoff_spec.md",
      "docs/test-plans/340_phase5_patient_choice_cross_org_responsive_regression_plan.md",
    ],
    executableRefs: [
      "apps/hub-desk/src/hub-desk-shell.tsx",
      "apps/patient-web/src/patient-booking-responsive.css",
      "packages/design-system/src/cross-org-artifact-handoff.tsx",
    ],
    proofRefs: [
      "tools/analysis/validate_333_mission_stack_hub.ts",
      "tools/analysis/validate_334_cross_org_content_and_artifact_rules.ts",
      "data/test-reports/338_scope_capacity_ranking_sla_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
    blockerRefs: ["BLK341_003"],
    carryForwardRefs: ["CF341_006"],
    summary:
      "The final browser-visible wave is proved for truth, accessibility, focus order, and responsive continuity across the relevant hub and patient surfaces.",
    releaseNotes:
      "Phase 6 must treat browser proof as part of release readiness, not secondary polish.",
  },
];

const evidenceRows: EvidenceRow[] = [
  {
    evidenceId: "EV341_001",
    capabilityId: "CAP341_01",
    title: "Acting-context kernel and UI control plane",
    evidenceFamily: "contract_and_execution",
    status: "passed",
    audience: "staff_cross_org",
    environmentClass: "local_nonprod_foundation",
    artifactRefs: [
      "tools/analysis/validate_316_acting_context_scope_and_visibility.ts",
      "tools/analysis/validate_332_acting_context_control_plane.ts",
    ],
    summary: "Backend and frontend acting-context enforcement were validated before the final gate.",
  },
  {
    evidenceId: "EV341_002",
    capabilityId: "CAP341_01",
    title: "Scope, visibility, capacity, and SLA final regression battery",
    evidenceFamily: "phase5_regression_suite",
    status: "passed",
    audience: "staff_cross_org",
    environmentClass: "local_nonprod_foundation",
    artifactRefs: ["data/test-reports/338_scope_capacity_ranking_sla_results.json"],
    summary: "338 proves scope drift, visibility, queue ranking, and responsive hub continuity.",
  },
  {
    evidenceId: "EV341_003",
    capabilityId: "CAP341_03",
    title: "Patient choice and browser-visible final proof battery",
    evidenceFamily: "phase5_browser_suite",
    status: "passed",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    artifactRefs: ["data/test-results/340_phase5_browser_suite_summary.json"],
    summary: "340 proves visible frontier truth, callback separation, cross-org minimum-necessary, and responsive/browser quality.",
  },
  {
    evidenceId: "EV341_004",
    capabilityId: "CAP341_05",
    title: "Commit truth, practice acknowledgement debt, and reopen suite",
    evidenceFamily: "phase5_truth_suite",
    status: "passed",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    artifactRefs: ["data/test-reports/339_commit_mesh_no_slot_reopen_results.json"],
    summary: "339 proves commit truth, acknowledgement debt, fallback recovery, and browser-visible confirmation/manage parity.",
  },
  {
    evidenceId: "EV341_005",
    capabilityId: "CAP341_02",
    title: "Capacity snapshot pipeline and partner feed configuration",
    evidenceFamily: "capacity_and_onboarding",
    status: "constrained",
    audience: "network_ops",
    environmentClass: "controlled_partner_boundary",
    artifactRefs: [
      "tools/analysis/validate_318_capacity_snapshot_and_rank_proof.ts",
      "tools/analysis/validate_336_partner_feed_configuration.ts",
    ],
    summary: "Capacity ingestion is executable and deterministic, but supported-test and INT onboarding remain bounded reviews.",
  },
  {
    evidenceId: "EV341_006",
    capabilityId: "CAP341_08",
    title: "MESH route contract and manual-bridge register",
    evidenceFamily: "transport_boundary",
    status: "constrained",
    audience: "network_ops",
    environmentClass: "controlled_partner_boundary",
    artifactRefs: [
      "data/contracts/335_mesh_route_contract.json",
      "data/analysis/335_mesh_setup_gap_register.json",
      "tools/analysis/validate_335_mesh_configuration.ts",
    ],
    summary: "Transport proof is current for local twins and explicit for PTL manual bridges.",
  },
  {
    evidenceId: "EV341_007",
    capabilityId: "CAP341_06",
    title: "Manage, reminders, and merged appointment-family continuity",
    evidenceFamily: "patient_continuity",
    status: "passed",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    artifactRefs: [
      "tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts",
      "tools/analysis/validate_330_network_manage_and_message_timeline.ts",
      "tools/analysis/validate_337_appointment_family_merge.ts",
    ],
    summary: "The patient manage and timeline family is internally consistent and proven end to end.",
  },
  {
    evidenceId: "EV341_008",
    capabilityId: "CAP341_07",
    title: "Practice continuity chain and visibility surfaces",
    evidenceFamily: "cross_org_visibility",
    status: "passed",
    audience: "cross_org",
    environmentClass: "local_nonprod_foundation",
    artifactRefs: [
      "tools/analysis/validate_322_practice_continuity_chain.ts",
      "tools/analysis/validate_329_commit_confirmation_and_visibility_ui.ts",
    ],
    summary: "Acknowledgement debt remains separate from transport acceptance and is preserved on visible surfaces.",
  },
  {
    evidenceId: "EV341_009",
    capabilityId: "CAP341_09",
    title: "Fallback and reopen workflow contract plus UI recovery proof",
    evidenceFamily: "recovery",
    status: "passed",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    artifactRefs: [
      "tools/analysis/validate_323_hub_fallback_workflows.ts",
      "tools/analysis/validate_331_hub_recovery_and_exception_ui.ts",
    ],
    summary: "No-slot, callback, urgent return, and reopen all remain typed and independently proved.",
  },
  {
    evidenceId: "EV341_010",
    capabilityId: "CAP341_10",
    title: "Responsive and accessibility browser gate",
    evidenceFamily: "browser_quality",
    status: "passed",
    audience: "patient_staff",
    environmentClass: "local_nonprod_foundation",
    artifactRefs: [
      "data/test-reports/338_scope_capacity_ranking_sla_results.json",
      "data/test-results/340_phase5_browser_suite_summary.json",
    ],
    summary: "The final browser wave has current proof for accessibility, reflow, reduced motion, and content truth.",
  },
  {
    evidenceId: "EV341_011",
    capabilityId: "CAP341_00",
    title: "Inherited Phase 4 exit constraints",
    evidenceFamily: "release_governance",
    status: "constrained",
    audience: "platform",
    environmentClass: "controlled_foundation",
    artifactRefs: ["data/analysis/310_phase4_exit_gate_decision.json"],
    summary: "Safety delta, rollback rehearsal, and widened-rollout performance constraints still govern the final Phase 5 verdict.",
  },
];

const capabilityById = new Map(capabilities.map((capability) => [capability.capabilityId, capability]));
const blockerById = new Map(blockers.map((blocker) => [blocker.blockerId, blocker]));
const carryForwardById = new Map(carryForwards.map((entry) => [entry.carryForwardId, entry]));

const capabilitySummaries = capabilities.map((capability) => ({
  capabilityId: capability.capabilityId,
  title: capability.title,
  contractFamily: capability.contractFamily,
  audience: capability.audience,
  environmentClass: capability.environmentClass,
  evidenceStatus: capability.evidenceStatus,
  releaseInterpretation: capability.releaseInterpretation,
  ownerTasks: capability.ownerTasks,
  phaseRefs: capability.phaseRefs,
  frozenContractRefs: capability.frozenContractRefs,
  executableRefs: capability.executableRefs,
  proofRefs: capability.proofRefs,
  blockerRefs: capability.blockerRefs,
  carryForwardRefs: capability.carryForwardRefs,
  summary: capability.summary,
  releaseNotes: capability.releaseNotes,
}));

const readinessRegistry = {
  taskId,
  generatedAt,
  verdict,
  releaseClass,
  capabilityEntries: capabilitySummaries,
  blockerRefs: blockers.map((entry) => entry.blockerId),
  carryForwardRefs: carryForwards.map((entry) => entry.carryForwardId),
  sourceEvidenceRefs: [
    "data/test-reports/338_scope_capacity_ranking_sla_results.json",
    "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
    "data/test-results/340_phase5_browser_suite_summary.json",
    "data/contracts/335_mesh_route_contract.json",
    "data/contracts/336_capacity_feed_configuration_contract.json",
  ],
};

const requiredRemediations = blockers.map((blocker) => ({
  ref: blocker.blockerId,
  summary: blocker.unblockingCriteria,
  ownerTask: blocker.ownerTask,
}));

const verdictJson = {
  taskId,
  verdict,
  releaseClass,
  commitRef,
  environmentRef: "local_nonprod_foundation_with_partner_boundaries",
  decidedAt,
  blockingDefectCount: blockers.length,
  carryForwardCount: carryForwards.length,
  capabilitySummaries,
  criticalEvidenceRefs: unique([
    "data/analysis/310_phase4_exit_gate_decision.json",
    "data/test-reports/338_scope_capacity_ranking_sla_results.json",
    "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
    "data/test-results/340_phase5_browser_suite_summary.json",
    "data/contracts/335_mesh_route_contract.json",
    "data/contracts/336_capacity_feed_configuration_contract.json",
  ]),
  blockingRefs: blockers.map((blocker) => blocker.blockerId),
  carryForwardRefs: carryForwards.map((entry) => entry.carryForwardId),
  phase6LaunchCondition,
  requiredRemediations,
};

const handoffContract = {
  taskId,
  generatedAt,
  verdictRef: OUTPUTS.verdict,
  launchCondition: phase6LaunchCondition,
  allowedLaunchTasks: [
    "seq_342_phase6_freeze_pharmacy_case_model_eligibility_and_policy_pack_contracts",
    "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts",
    "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts",
    "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
  ],
  stableGuarantees: [
    "Acting-context drift and minimum-necessary visibility fail closed.",
    "Patient-choice visible frontier and callback separation stay truthful.",
    "Commit truth, acknowledgement debt, and reopen behavior remain distinct typed authorities.",
    "Browser-visible Phase 5 surfaces are currently proved for accessibility, responsive continuity, and content truth.",
  ],
  boundedDebtRefs: carryForwards.map((entry) => entry.carryForwardId),
  blockingRefs: blockers.map((blocker) => blocker.blockerId),
  nonNegotiables: [
    "Do not bypass LifecycleCoordinator as the only request-closure authority.",
    "Do not collapse provisional, confirmed, disputed, or acknowledged truth into one calmer state.",
    "Do not reinterpret manual_bridge_required or review_required partner rows as live-ready proof.",
    "Do not weaken minimum-necessary, break-glass, or stale-scope fail-closed behavior.",
    "Do not reintroduce hidden-frontier ranking or callback-inside-choice-stack behavior.",
    "Do not treat browser proof as optional to release readiness.",
  ],
  sourceRefs: [
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "data/test-reports/338_scope_capacity_ranking_sla_results.json",
    "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
    "data/test-results/340_phase5_browser_suite_summary.json",
  ],
};

const seedPackets = {
  [OUTPUTS.seed342]: {
    taskId,
    seedForTask: "seq_342_phase6_freeze_pharmacy_case_model_eligibility_and_policy_pack_contracts",
    allowedToProceed: true,
    verdictRef: OUTPUTS.verdict,
    reliedOnCapabilityIds: ["CAP341_00", "CAP341_01", "CAP341_04", "CAP341_10"],
    boundedDebtRefs: ["BLK341_001", "BLK341_002", "BLK341_003"],
    whatPhase5Proved: [
      "Lineage, ownership fences, stale-scope fail-closed behavior, and browser truth constraints are stable enough to freeze the pharmacy case backbone.",
    ],
    patternsMustNotBeRebroken: [
      "No second closure authority outside LifecycleCoordinator.",
      "No mutable active policy pack semantics.",
      "No same-shell continuity regressions under recovery or scope drift.",
    ],
    nonNegotiables: handoffContract.nonNegotiables,
  },
  [OUTPUTS.seed343]: {
    taskId,
    seedForTask: "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts",
    allowedToProceed: true,
    verdictRef: OUTPUTS.verdict,
    reliedOnCapabilityIds: ["CAP341_02", "CAP341_03", "CAP341_05", "CAP341_08"],
    boundedDebtRefs: ["BLK341_004", "CF341_001", "CF341_002", "CF341_003", "CF341_004", "CF341_005"],
    whatPhase5Proved: [
      "Capacity trust admission, visible frontier truth, commit truth, and route/feed contract separation are all now explicit and typed.",
    ],
    patternsMustNotBeRebroken: [
      "No hidden top-K frontier or callback-inside-ranked-stack behavior.",
      "No transport success interpreted as business settlement or acknowledgement.",
      "No live-ready claims from manual_bridge_required or preflight-only rows.",
    ],
    nonNegotiables: handoffContract.nonNegotiables,
  },
  [OUTPUTS.seed344]: {
    taskId,
    seedForTask: "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts",
    allowedToProceed: true,
    verdictRef: OUTPUTS.verdict,
    reliedOnCapabilityIds: ["CAP341_05", "CAP341_06", "CAP341_07", "CAP341_09", "CAP341_10"],
    boundedDebtRefs: ["CF341_002", "CF341_006"],
    whatPhase5Proved: [
      "Acknowledgement debt, patient manage continuity, and reopen or urgent return behavior are all already typed and browser-proved.",
    ],
    patternsMustNotBeRebroken: [
      "No flattening of urgent return into routine bounce-back.",
      "No patient-facing calmness beyond underlying truth.",
      "No browser regression that hides recovery or acknowledgement posture.",
    ],
    nonNegotiables: handoffContract.nonNegotiables,
  },
  [OUTPUTS.seed345]: {
    taskId,
    seedForTask: "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
    allowedToProceed: true,
    verdictRef: OUTPUTS.verdict,
    reliedOnCapabilityIds: capabilities.map((entry) => entry.capabilityId),
    boundedDebtRefs: [...blockers.map((blocker) => blocker.blockerId), ...carryForwards.map((entry) => entry.carryForwardId)],
    whatPhase5Proved: [
      "The Network Horizon is a current executable foundation with explicit boundaries, not a narrative milestone.",
    ],
    patternsMustNotBeRebroken: [
      "No hidden blocking debt inside carry-forward prose.",
      "No opening of parallel Phase 6 work without preserving these constraints in the next gate.",
    ],
    nonNegotiables: handoffContract.nonNegotiables,
  },
};

const consistencyCsvRows = capabilities.map((capability) => ({
  capabilityId: capability.capabilityId,
  title: capability.title,
  contractFamily: capability.contractFamily,
  audience: capability.audience,
  environmentClass: capability.environmentClass,
  evidenceStatus: capability.evidenceStatus,
  releaseInterpretation: capability.releaseInterpretation,
  ownerTasks: capability.ownerTasks.join(" | "),
  phaseRefs: capability.phaseRefs.join(" | "),
  frozenContractRefs: capability.frozenContractRefs.join(" | "),
  executableRefs: capability.executableRefs.join(" | "),
  proofRefs: capability.proofRefs.join(" | "),
  blockerRefs: capability.blockerRefs.join(" | "),
  carryForwardRefs: capability.carryForwardRefs.join(" | "),
  summary: capability.summary,
}));

const evidenceCsvRows = evidenceRows.map((row) => ({
  evidenceId: row.evidenceId,
  capabilityId: row.capabilityId,
  title: row.title,
  evidenceFamily: row.evidenceFamily,
  status: row.status,
  audience: row.audience,
  environmentClass: row.environmentClass,
  artifactRefs: row.artifactRefs.join(" | "),
  summary: row.summary,
}));

function renderDecisionDoc(): string {
  return `# 341 Phase 5 Exit Gate Decision

## Verdict

The authoritative verdict is \`${verdict}\`.

Release class: \`${releaseClass}\`.

Phase 6 launch condition: \`${phase6LaunchCondition}\`.

This is a **go** for:

- opening \`seq_342\` to \`seq_345\` from the proven Phase 5 foundation
- relying on the frozen Phase 5 case, visibility, choice, commit, manage, practice-visibility, and recovery semantics as stable inputs
- treating the 338 to 340 proof batteries as authoritative evidence for current executable truth

This is a **no-go** for:

- calling the final Network Horizon exit \`approved\`
- claiming widened rollout readiness while the inherited interaction-support target, safety delta, and rollback rehearsal remain unresolved
- implying that manual-bridge or review-required partner onboarding rows are equivalent to live-ready route or feed proof

## Why the verdict is not \`approved\`

Phase 5 is now executable and browser-proved. Tasks \`311\` to \`340\` materially preserved the frozen contracts, and the decisive proof batteries in \`338\`, \`339\`, and \`340\` all passed. The verdict remains constrained because four release-critical conditions remain open:

- a release-scoped clinical-safety delta has not been published for the final candidate
- a release-scoped rollback rehearsal artifact is still absent
- the inherited widened-rollout interaction-support target has not been re-cleared
- live partner onboarding for MESH and supported-test capacity feeds still depends on explicit manual or review boundaries

## Capability posture

${markdownTable(
  ["Capability", "Evidence", "Release posture", "Blocking refs", "Carry-forward refs"],
  capabilities.map((capability) => [
    `${capability.capabilityId} ${capability.title}`,
    capability.evidenceStatus,
    capability.releaseInterpretation,
    capability.blockerRefs.length > 0 ? capability.blockerRefs.join(", ") : "None",
    capability.carryForwardRefs.length > 0 ? capability.carryForwardRefs.join(", ") : "None",
  ]),
)}

## Blocking defects

${markdownTable(
  ["Id", "Severity", "Scope", "Owner", "Summary"],
  blockers.map((blocker) => [
    blocker.blockerId,
    blocker.severity,
    blocker.scope,
    blocker.ownerTask,
    blocker.summary,
  ]),
)}

## Carry-forward debt

${markdownTable(
  ["Id", "Type", "Owner", "Next track", "Guardrail"],
  carryForwards.map((entry) => [
    entry.carryForwardId,
    entry.classification,
    entry.ownerTask,
    entry.nextTrack,
    entry.guardrail,
  ]),
)}

## Critical evidence

- [338 scope, capacity, ranking, and SLA results](/Users/test/Code/V/data/test-reports/338_scope_capacity_ranking_sla_results.json)
- [339 commit, MESH, no-slot, and reopen results](/Users/test/Code/V/data/test-reports/339_commit_mesh_no_slot_reopen_results.json)
- [340 final browser suite summary](/Users/test/Code/V/data/test-results/340_phase5_browser_suite_summary.json)
- [335 MESH route contract](/Users/test/Code/V/data/contracts/335_mesh_route_contract.json)
- [336 partner feed configuration contract](/Users/test/Code/V/data/contracts/336_capacity_feed_configuration_contract.json)
- [310 inherited Phase 4 exit decision](/Users/test/Code/V/data/analysis/310_phase4_exit_gate_decision.json)
`;
}

function renderCarryForwardMapDoc(): string {
  return `# 341 Phase 5 Completion And Carry-Forward Map

## Completion map

${markdownTable(
  ["Capability family", "Frozen contract anchors", "Executable owners", "Proof anchors", "Release interpretation"],
  capabilities.map((capability) => [
    capability.title,
    capability.frozenContractRefs.slice(0, 3).join("<br>"),
    capability.executableRefs.slice(0, 3).join("<br>"),
    capability.proofRefs.slice(0, 3).join("<br>"),
    `${capability.evidenceStatus} / ${capability.releaseInterpretation}`,
  ]),
)}

## Carry-forward law

- Blocking debt is limited to release approval, widened rollout, and live-ready partner posture. It does not reopen the proven Phase 5 semantic foundation.
- Carry-forward debt is allowed only where the current behavior fails closed, stays explicit, and does not mislead patient or staff surfaces.
- Phase 6 must inherit the listed guardrails rather than rediscovering them in downstream implementation.

## Non-negotiable patterns for Phase 6

${handoffContract.nonNegotiables.map((item) => `- ${item}`).join("\n")}
`;
}

function renderReviewGuide(): string {
  return `# 341 Phase 5 Evidence Review Guide

Use this guide when auditing the final Network Horizon gate.

## Review order

1. Read [341_phase5_exit_gate_decision.md](/Users/test/Code/V/docs/release/341_phase5_exit_gate_decision.md).
2. Inspect [341_phase5_exit_verdict.json](/Users/test/Code/V/data/contracts/341_phase5_exit_verdict.json) for the formal verdict, blocker refs, carry-forward refs, and Phase 6 launch condition.
3. Open [341_phase5_exit_gate_board.html](/Users/test/Code/V/docs/frontend/341_phase5_exit_gate_board.html) and select each capability family in turn.
4. Cross-check [341_phase5_contract_consistency_matrix.csv](/Users/test/Code/V/data/analysis/341_phase5_contract_consistency_matrix.csv) and [341_phase5_evidence_matrix.csv](/Users/test/Code/V/data/analysis/341_phase5_evidence_matrix.csv).
5. Inspect the decisive proof bundles:
   - [338_scope_capacity_ranking_sla_results.json](/Users/test/Code/V/data/test-reports/338_scope_capacity_ranking_sla_results.json)
   - [339_commit_mesh_no_slot_reopen_results.json](/Users/test/Code/V/data/test-reports/339_commit_mesh_no_slot_reopen_results.json)
   - [340_phase5_browser_suite_summary.json](/Users/test/Code/V/data/test-results/340_phase5_browser_suite_summary.json)
6. Review the ledgers:
   - [341_phase5_blocker_ledger.json](/Users/test/Code/V/data/analysis/341_phase5_blocker_ledger.json)
   - [341_phase5_carry_forward_ledger.json](/Users/test/Code/V/data/analysis/341_phase5_carry_forward_ledger.json)
7. If you need to trace live-boundary assumptions, inspect:
   - [335_mesh_route_contract.json](/Users/test/Code/V/data/contracts/335_mesh_route_contract.json)
   - [335_mesh_setup_gap_register.json](/Users/test/Code/V/data/analysis/335_mesh_setup_gap_register.json)
   - [336_capacity_feed_configuration_contract.json](/Users/test/Code/V/data/contracts/336_capacity_feed_configuration_contract.json)
   - [336_partner_feed_gap_register.json](/Users/test/Code/V/data/analysis/336_partner_feed_gap_register.json)

## What should convince a skeptical reviewer

- Every capability family has a frozen contract anchor, executable owner, and current proof artifact.
- Blocking defects are clearly separated from bounded carry-forward debt.
- Browser evidence is present for the human-facing phase, not inferred from backend tests.
- Partner and environment assumptions stay explicit and do not masquerade as live-ready proof.
- The Phase 6 seed packets tell downstream work what it may rely on and what it must not weaken.
`;
}

function renderBoardHtml(): string {
  const boardData = {
    verdict,
    releaseClass,
    runId,
    commitRef,
    shortCommitRef,
    branchRef,
    environmentRef: verdictJson.environmentRef,
    generatedAt,
    phase6LaunchCondition,
    blockers,
    carryForwards,
    capabilities: capabilitySummaries,
    evidenceRows,
    links: {
      verdict: `../../${OUTPUTS.verdict}`,
      readiness: `../../${OUTPUTS.readiness}`,
      handoff: `../../${OUTPUTS.handoff}`,
      blockers: `../../${OUTPUTS.blockerLedger}`,
      carryForward: `../../${OUTPUTS.carryForwardLedger}`,
      consistencyCsv: `../../${OUTPUTS.consistencyCsv}`,
      evidenceCsv: `../../${OUTPUTS.evidenceCsv}`,
      decisionDoc: `../../${OUTPUTS.decisionDoc}`,
      mapDoc: `../../${OUTPUTS.mapDoc}`,
      reviewGuide: `../../${OUTPUTS.reviewGuide}`,
      browser340: "../../data/test-results/340_phase5_browser_suite_summary.json",
      proof338: "../../data/test-reports/338_scope_capacity_ranking_sla_results.json",
      proof339: "../../data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
    },
  };

  const encoded = JSON.stringify(boardData).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>341 Phase 5 Exit Gate Board</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #F7F8FA;
        --shell: #EEF2F6;
        --panel: #FFFFFF;
        --inset: #E8EDF4;
        --text-strong: #0F172A;
        --text-default: #334155;
        --text-muted: #64748B;
        --approved: #0F766E;
        --constrained: #B7791F;
        --withheld: #B42318;
        --dependency: #3158E0;
        --evidence: #5B61F6;
        --border: #D6DFEA;
        --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
        --font-stack: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: var(--canvas);
        color: var(--text-default);
        font-family: var(--font-stack);
        font-size: 14px;
        line-height: 1.5;
      }
      body {
        padding: 18px;
      }
      a {
        color: var(--dependency);
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      .board {
        max-width: 1760px;
        margin: 0 auto;
        display: grid;
        gap: 16px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: var(--shadow);
        min-width: 0;
      }
      .masthead {
        min-height: 76px;
        padding: 18px 24px;
        display: grid;
        gap: 6px;
      }
      .masthead h1 {
        margin: 0;
        font-size: 30px;
        line-height: 1.1;
        color: var(--text-strong);
      }
      .eyebrow {
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
        font-weight: 700;
      }
      .muted {
        color: var(--text-muted);
      }
      .verdict-strip {
        min-height: 76px;
        padding: 16px 24px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: start;
        border-left: 6px solid var(--constrained);
        position: sticky;
        top: 12px;
        z-index: 5;
      }
      .verdict-strip[data-active-verdict="approved"] { border-left-color: var(--approved); }
      .verdict-strip[data-active-verdict="go_with_constraints"] { border-left-color: var(--constrained); }
      .verdict-strip[data-active-verdict="withheld"] { border-left-color: var(--withheld); }
      .verdict-strip h2 {
        margin: 0;
        font-size: 30px;
        line-height: 1.1;
        color: var(--text-strong);
      }
      .chip-row, .filter-row, .link-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        min-height: 30px;
        border-radius: 999px;
        padding: 6px 12px;
        border: 1px solid var(--border);
        background: var(--inset);
        color: var(--text-strong);
        font-size: 12px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
        white-space: normal;
        overflow-wrap: anywhere;
      }
      .chip.approved {
        color: var(--approved);
        background: rgba(15, 118, 110, 0.08);
        border-color: rgba(15, 118, 110, 0.24);
      }
      .chip.constrained {
        color: var(--constrained);
        background: rgba(183, 121, 31, 0.1);
        border-color: rgba(183, 121, 31, 0.28);
      }
      .chip.withheld {
        color: var(--withheld);
        background: rgba(180, 35, 24, 0.08);
        border-color: rgba(180, 35, 24, 0.24);
      }
      .chip.dependency {
        color: var(--dependency);
        background: rgba(49, 88, 224, 0.08);
        border-color: rgba(49, 88, 224, 0.24);
      }
      .chip.evidence {
        color: var(--evidence);
        background: rgba(91, 97, 246, 0.08);
        border-color: rgba(91, 97, 246, 0.24);
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
      }
      .summary-card {
        padding: 14px 16px;
        border-radius: 16px;
        background: var(--panel);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        min-width: 0;
      }
      .summary-card .label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }
      .summary-card .value {
        margin-top: 10px;
        color: var(--text-strong);
        font-size: 24px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      .layout {
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr) 420px;
        gap: 16px;
        align-items: start;
      }
      .rail, .canvas, .inspector {
        min-height: 720px;
        padding: 18px;
      }
      .rail {
        background: var(--shell);
      }
      .region-title {
        margin: 0 0 12px;
        font-size: 18px;
        color: var(--text-strong);
      }
      .capability-list {
        display: grid;
        gap: 10px;
      }
      .capability-button, .filter-chip {
        width: 100%;
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: 16px;
        padding: 12px;
        color: var(--text-strong);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .capability-button[aria-selected="true"],
      .filter-chip[aria-pressed="true"] {
        border-color: var(--dependency);
        background: rgba(49, 88, 224, 0.08);
        color: var(--dependency);
      }
      .capability-button:focus-visible,
      .filter-chip:focus-visible,
      .artifact-link:focus-visible {
        outline: 3px solid rgba(49, 88, 224, 0.35);
        outline-offset: 2px;
      }
      .capability-button small {
        display: block;
        margin-top: 6px;
        color: var(--text-muted);
      }
      .filter-group {
        display: grid;
        gap: 10px;
        margin-top: 18px;
      }
      .filter-group h3 {
        margin: 0;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .filter-row {
        gap: 6px;
      }
      .filter-chip {
        width: auto;
        border-radius: 999px;
        padding: 8px 12px;
      }
      .meta-card {
        margin-top: 18px;
        padding: 14px;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.72);
        min-width: 0;
      }
      .meta-card strong {
        color: var(--text-strong);
      }
      .canvas, .inspector {
        display: grid;
        gap: 16px;
      }
      .content-card {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid var(--border);
        background: var(--panel);
        min-width: 0;
      }
      .content-card h3 {
        margin: 0 0 10px;
        font-size: 18px;
        color: var(--text-strong);
      }
      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      ul.ref-list {
        margin: 12px 0 0;
        padding-left: 18px;
      }
      .table-wrap {
        overflow: auto;
        border: 1px solid var(--border);
        border-radius: 16px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-variant-numeric: tabular-nums;
      }
      th, td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--border);
        text-align: left;
        vertical-align: top;
      }
      th {
        background: rgba(232, 237, 244, 0.7);
        color: var(--text-strong);
      }
      tr:last-child td {
        border-bottom: none;
      }
      .inspector-list {
        display: grid;
        gap: 12px;
      }
      .issue-card {
        padding: 14px;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: var(--panel);
        min-width: 0;
      }
      .verdict-strip > *,
      .summary-grid > *,
      .layout > * {
        min-width: 0;
      }
      h1, h2, h3, p, th, td, strong, small {
        overflow-wrap: anywhere;
      }
      .timeline {
        padding: 18px;
      }
      .timeline-grid {
        display: grid;
        gap: 12px;
      }
      .artifact-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--panel);
        max-width: 100%;
        overflow-wrap: anywhere;
      }
      @media (max-width: 1540px) {
        .summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .layout { grid-template-columns: 320px minmax(0, 1fr); }
        .inspector { grid-column: 1 / -1; min-height: 0; }
      }
      @media (max-width: 1024px) {
        body { padding: 12px; }
        .verdict-strip { grid-template-columns: 1fr; position: static; }
        .summary-grid, .layout { grid-template-columns: 1fr; }
        .rail, .canvas, .inspector { min-height: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="board" data-testid="Phase5ExitGateBoard">
      <header class="panel masthead" data-testid="Phase5ExitGateMasthead">
        <div class="eyebrow">Phase 5 Network Horizon exit gate</div>
        <h1>Formal release decision and Phase 6 launch boundary</h1>
        <p class="muted">The gate reconciles frozen contracts, executable ownership, decisive proof artifacts, and bounded carry-forward law.</p>
      </header>

      <section class="panel verdict-strip" data-testid="Phase5ExitVerdictStrip">
        <div>
          <div class="chip-row" id="verdict-chip-row"></div>
          <h2 id="verdict-heading" style="margin-top: 10px;"></h2>
          <p id="verdict-summary" class="muted" style="margin-top: 10px;"></p>
        </div>
        <div class="link-row" id="board-links"></div>
      </section>

      <section class="summary-grid" data-testid="Phase5ExitSummaryStrip">
        <article class="summary-card"><div class="label">Run id</div><div class="value" id="summary-run-id"></div></article>
        <article class="summary-card"><div class="label">Commit</div><div class="value" id="summary-commit"></div></article>
        <article class="summary-card"><div class="label">Environment</div><div class="value" id="summary-environment"></div></article>
        <article class="summary-card"><div class="label">Blockers</div><div class="value" id="summary-blockers"></div></article>
        <article class="summary-card"><div class="label">Carry-forward</div><div class="value" id="summary-carry-forward"></div></article>
      </section>

      <section class="layout">
        <nav class="panel rail" data-testid="Phase5CapabilityRail">
          <h2 class="region-title">Capability rail</h2>
          <div class="capability-list" id="capability-list" role="tablist" aria-label="Phase 5 capability families"></div>

          <div class="filter-group" data-testid="Phase5ExitGateFilters">
            <div>
              <h3>Contract family</h3>
              <div class="filter-row" id="filter-contract-family"></div>
            </div>
            <div>
              <h3>Release class</h3>
              <div class="filter-row" id="filter-release-class"></div>
            </div>
            <div>
              <h3>Audience</h3>
              <div class="filter-row" id="filter-audience"></div>
            </div>
            <div>
              <h3>Environment</h3>
              <div class="filter-row" id="filter-environment"></div>
            </div>
            <div>
              <h3>Blocker severity</h3>
              <div class="filter-row" id="filter-severity"></div>
            </div>
          </div>

          <div class="meta-card">
            <strong>Phase 6 launch condition</strong>
            <p class="muted" id="launch-condition" style="margin-top: 8px;"></p>
          </div>
        </nav>

        <main class="panel canvas" data-testid="Phase5EvidenceCanvas">
          <section class="content-card" id="capability-summary-card"></section>
          <section class="content-card">
            <h3>Traceability matrix</h3>
            <div class="table-wrap" data-testid="Phase5TraceabilityTables">
              <table>
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>Evidence</th>
                    <th>Release posture</th>
                    <th>Owner</th>
                    <th>Next track</th>
                  </tr>
                </thead>
                <tbody id="traceability-body"></tbody>
              </table>
            </div>
          </section>
          <section class="content-card">
            <h3>Evidence matrix</h3>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Evidence row</th>
                    <th>Family</th>
                    <th>Status</th>
                    <th>Audience</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody id="evidence-body"></tbody>
              </table>
            </div>
          </section>
        </main>

        <aside class="panel inspector" data-testid="Phase5BlockerInspector">
          <section class="content-card">
            <h3>Blocking defects</h3>
            <div class="inspector-list" id="blocker-list"></div>
          </section>
          <section class="content-card">
            <h3>Carry-forward ledger</h3>
            <div class="inspector-list" id="carry-forward-list"></div>
          </section>
        </aside>
      </section>

      <section class="panel timeline" data-testid="Phase5EvidenceTimeline">
        <h2 class="region-title">Artifact timeline</h2>
        <div class="timeline-grid" id="artifact-timeline"></div>
      </section>
    </div>

    <script>
      const boardData = ${encoded};
      const state = {
        selectedCapabilityId: boardData.capabilities[0]?.capabilityId ?? "",
        contractFamily: "all",
        releaseClass: "all",
        audience: "all",
        environment: "all",
        severity: "all",
      };

      const blockerById = Object.fromEntries(boardData.blockers.map((entry) => [entry.blockerId, entry]));
      const carryForwardById = Object.fromEntries(boardData.carryForwards.map((entry) => [entry.carryForwardId, entry]));

      function statusChipClass(value) {
        if (value === "approved") return "approved";
        if (value === "go_with_constraints") return "constrained";
        if (value === "withheld") return "withheld";
        return "dependency";
      }

      function renderVerdict() {
        const root = document.querySelector("[data-testid='Phase5ExitGateBoard']");
        const strip = document.querySelector("[data-testid='Phase5ExitVerdictStrip']");
        root.setAttribute("data-current-verdict", boardData.verdict);
        root.setAttribute("data-release-class", boardData.releaseClass);
        strip.setAttribute("data-active-verdict", boardData.verdict);
        strip.setAttribute("data-release-class", boardData.releaseClass);
        document.getElementById("verdict-heading").textContent = boardData.verdict;
        document.getElementById("verdict-summary").textContent =
          "Phase 5 is a proven foundation for Phase 6, but the gate remains constrained because inherited release evidence and live partner boundaries are not fully closed.";

        const verdictChips = document.getElementById("verdict-chip-row");
        verdictChips.innerHTML = [
          '<span class="chip ' + statusChipClass(boardData.verdict) + '">Verdict ' + boardData.verdict + '</span>',
          '<span class="chip dependency">Release class ' + boardData.releaseClass + '</span>',
          '<span class="chip evidence">Phase 6 launch ' + boardData.phase6LaunchCondition + '</span>',
        ].join("");

        const linkHost = document.getElementById("board-links");
        linkHost.innerHTML = [
          ['Verdict JSON', boardData.links.verdict],
          ['Readiness registry', boardData.links.readiness],
          ['Handoff contract', boardData.links.handoff],
          ['Decision doc', boardData.links.decisionDoc],
          ['Review guide', boardData.links.reviewGuide],
        ].map(([label, href]) => '<a class="artifact-link" href="' + href + '">' + label + '</a>').join("");

        document.getElementById("summary-run-id").textContent = boardData.runId;
        document.getElementById("summary-commit").textContent = boardData.shortCommitRef;
        document.getElementById("summary-environment").textContent = boardData.environmentRef;
        document.getElementById("summary-blockers").textContent = String(boardData.blockers.length);
        document.getElementById("summary-carry-forward").textContent = String(boardData.carryForwards.length);
        document.getElementById("launch-condition").textContent = boardData.phase6LaunchCondition;
      }

      function createFilterChip(label, value, selectedValue, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-chip";
        button.textContent = label;
        button.setAttribute("aria-pressed", value === selectedValue ? "true" : "false");
        button.addEventListener("click", onClick);
        return button;
      }

      function renderFilters() {
        const renderGroup = (hostId, items, selectedValue, setter) => {
          const host = document.getElementById(hostId);
          host.innerHTML = "";
          for (const item of items) {
            host.appendChild(createFilterChip(item.label, item.value, selectedValue, () => {
              setter(item.value);
              renderBoard();
            }));
          }
        };

        renderGroup("filter-contract-family", [
          { label: "All", value: "all" },
          ...Array.from(new Set(boardData.capabilities.map((entry) => entry.contractFamily))).map((value) => ({ label: value, value })),
        ], state.contractFamily, (value) => (state.contractFamily = value));

        renderGroup("filter-release-class", [
          { label: "All", value: "all" },
          { label: "Approved", value: "approved" },
          { label: "Constrained", value: "go_with_constraints" },
        ], state.releaseClass, (value) => (state.releaseClass = value));

        renderGroup("filter-audience", [
          { label: "All", value: "all" },
          ...Array.from(new Set(boardData.capabilities.map((entry) => entry.audience))).map((value) => ({ label: value, value })),
        ], state.audience, (value) => (state.audience = value));

        renderGroup("filter-environment", [
          { label: "All", value: "all" },
          ...Array.from(new Set(boardData.capabilities.map((entry) => entry.environmentClass))).map((value) => ({ label: value, value })),
        ], state.environment, (value) => (state.environment = value));

        renderGroup("filter-severity", [
          { label: "All", value: "all" },
          { label: "Sev1", value: "sev1" },
          { label: "Sev2", value: "sev2" },
          { label: "Sev3", value: "sev3" },
        ], state.severity, (value) => (state.severity = value));
      }

      function capabilityMatchesFilters(capability) {
        if (state.contractFamily !== "all" && capability.contractFamily !== state.contractFamily) return false;
        if (state.releaseClass !== "all" && capability.releaseInterpretation !== state.releaseClass) return false;
        if (state.audience !== "all" && capability.audience !== state.audience) return false;
        if (state.environment !== "all" && capability.environmentClass !== state.environment) return false;
        if (state.severity !== "all") {
          const blockerMatches = capability.blockerRefs.some((ref) => blockerById[ref]?.severity === state.severity);
          if (!blockerMatches) return false;
        }
        return true;
      }

      function filteredCapabilities() {
        return boardData.capabilities.filter(capabilityMatchesFilters);
      }

      function selectedCapability() {
        const filtered = filteredCapabilities();
        const exact = filtered.find((entry) => entry.capabilityId === state.selectedCapabilityId);
        if (exact) return exact;
        state.selectedCapabilityId = filtered[0]?.capabilityId ?? boardData.capabilities[0]?.capabilityId ?? "";
        return boardData.capabilities.find((entry) => entry.capabilityId === state.selectedCapabilityId);
      }

      function renderCapabilityRail() {
        const host = document.getElementById("capability-list");
        host.innerHTML = "";
        for (const capability of filteredCapabilities()) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "capability-button";
          button.setAttribute("role", "tab");
          button.setAttribute("aria-selected", capability.capabilityId === state.selectedCapabilityId ? "true" : "false");
          button.dataset.capabilityId = capability.capabilityId;
          button.dataset.testid = "Phase5CapabilityButton-" + capability.capabilityId;
          button.innerHTML =
            '<strong>' + capability.title + '</strong><small>' +
            capability.evidenceStatus + ' / ' + capability.releaseInterpretation +
            '</small>';
          button.addEventListener("click", () => {
            state.selectedCapabilityId = capability.capabilityId;
            renderBoard();
          });
          host.appendChild(button);
        }
      }

      function renderCapabilitySummary() {
        const capability = selectedCapability();
        const host = document.getElementById("capability-summary-card");
        if (!capability) {
          host.innerHTML = "<h3>No capability in filtered view</h3>";
          return;
        }
        document.querySelector("[data-testid='Phase5ExitGateBoard']").setAttribute("data-selected-capability", capability.capabilityId);
        host.innerHTML = [
          "<h3>" + capability.title + "</h3>",
          '<div class="pill-row">',
          '<span class="chip dependency">' + capability.contractFamily + "</span>",
          '<span class="chip evidence">' + capability.audience + "</span>",
          '<span class="chip evidence">' + capability.environmentClass + "</span>",
          '<span class="chip ' + statusChipClass(capability.releaseInterpretation) + '">' + capability.releaseInterpretation + "</span>",
          "</div>",
          '<p style="margin-top: 12px;">' + capability.summary + "</p>",
          '<p class="muted" style="margin-top: 8px;">' + capability.releaseNotes + "</p>",
          '<div class="table-wrap" style="margin-top: 14px;"><table><tbody>' +
            '<tr><th>Owners</th><td>' + capability.ownerTasks.join("<br>") + '</td></tr>' +
            '<tr><th>Frozen contracts</th><td>' + capability.frozenContractRefs.map((ref) => '<a href="../../' + ref + '">' + ref + '</a>').join("<br>") + '</td></tr>' +
            '<tr><th>Executable refs</th><td>' + capability.executableRefs.map((ref) => '<a href="../../' + ref + '">' + ref + '</a>').join("<br>") + '</td></tr>' +
            '<tr><th>Proof refs</th><td>' + capability.proofRefs.map((ref) => '<a href="../../' + ref + '">' + ref + '</a>').join("<br>") + '</td></tr>' +
          '</tbody></table></div>',
        ].join("");
      }

      function renderTraceability() {
        const host = document.getElementById("traceability-body");
        host.innerHTML = "";
        for (const capability of filteredCapabilities()) {
          const blockers = capability.blockerRefs.join(", ") || "None";
          const nextTrack = unique([
            ...capability.blockerRefs.map((ref) => blockerById[ref]?.nextTrack).filter(Boolean),
            ...capability.carryForwardRefs.map((ref) => carryForwardById[ref]?.nextTrack).filter(Boolean),
          ]).join(", ") || "Stable";
          const row = document.createElement("tr");
          row.innerHTML =
            "<td>" + capability.title + "</td>" +
            "<td>" + capability.evidenceStatus + "</td>" +
            "<td>" + capability.releaseInterpretation + "</td>" +
            "<td>" + capability.ownerTasks.join(", ") + "</td>" +
            "<td>" + nextTrack + "<br><span class='muted'>" + blockers + "</span></td>";
          host.appendChild(row);
        }
      }

      function renderEvidenceMatrix() {
        const capability = selectedCapability();
        const host = document.getElementById("evidence-body");
        host.innerHTML = "";
        const visibleRows = boardData.evidenceRows.filter((row) => row.capabilityId === capability.capabilityId);
        for (const row of visibleRows) {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + row.evidenceId + "<br><span class='muted'>" + row.title + "</span></td>" +
            "<td>" + row.evidenceFamily + "</td>" +
            "<td>" + row.status + "</td>" +
            "<td>" + row.audience + "</td>" +
            "<td>" + row.summary + "</td>";
          host.appendChild(tr);
        }
      }

      function renderInspector() {
        const capability = selectedCapability();
        const blockerHost = document.getElementById("blocker-list");
        const carryHost = document.getElementById("carry-forward-list");
        blockerHost.innerHTML = "";
        carryHost.innerHTML = "";

        const blockerItems = capability.blockerRefs.map((ref) => blockerById[ref]);
        if (blockerItems.length === 0) {
          blockerHost.innerHTML = '<div class="issue-card"><strong>No blocking defects bound to this capability</strong><p class="muted" style="margin-top: 8px;">This family is not the reason the overall verdict stayed constrained.</p></div>';
        } else {
          for (const blocker of blockerItems) {
            const node = document.createElement("article");
            node.className = "issue-card";
            node.innerHTML =
              "<strong>" + blocker.title + "</strong>" +
              '<div class="pill-row" style="margin-top: 10px;">' +
                '<span class="chip withheld">' + blocker.severity + "</span>" +
                '<span class="chip dependency">' + blocker.scope + "</span>" +
              "</div>" +
              '<p style="margin-top: 10px;">' + blocker.summary + "</p>" +
              '<p class="muted" style="margin-top: 8px;">Owner ' + blocker.ownerTask + " | Next " + blocker.nextTrack + "</p>";
            blockerHost.appendChild(node);
          }
        }

        const carryItems = capability.carryForwardRefs.map((ref) => carryForwardById[ref]);
        if (carryItems.length === 0) {
          carryHost.innerHTML = '<div class="issue-card"><strong>No carry-forward debt bound to this capability</strong><p class="muted" style="margin-top: 8px;">This family is currently clean enough for the controlled foundation posture.</p></div>';
        } else {
          for (const entry of carryItems) {
            const node = document.createElement("article");
            node.className = "issue-card";
            node.innerHTML =
              "<strong>" + entry.title + "</strong>" +
              '<div class="pill-row" style="margin-top: 10px;">' +
                '<span class="chip dependency">' + entry.classification + "</span>" +
              "</div>" +
              '<p style="margin-top: 10px;">' + entry.summary + "</p>" +
              '<p class="muted" style="margin-top: 8px;">Guardrail: ' + entry.guardrail + "</p>" +
              '<p class="muted" style="margin-top: 8px;">Owner ' + entry.ownerTask + " | Next " + entry.nextTrack + "</p>";
            carryHost.appendChild(node);
          }
        }
      }

      function renderTimeline() {
        const host = document.getElementById("artifact-timeline");
        host.innerHTML = "";
        const capability = selectedCapability();
        const rows = boardData.evidenceRows.filter((row) => row.capabilityId === capability.capabilityId);
        for (const row of rows) {
          const card = document.createElement("article");
          card.className = "content-card";
          card.innerHTML = "<h3>" + row.title + "</h3><p>" + row.summary + "</p>";
          const links = document.createElement("div");
          links.className = "link-row";
          links.style.marginTop = "12px";
          for (const ref of row.artifactRefs) {
            const anchor = document.createElement("a");
            anchor.className = "artifact-link";
            anchor.href = "../../" + ref;
            anchor.textContent = ref;
            links.appendChild(anchor);
          }
          card.appendChild(links);
          host.appendChild(card);
        }
      }

      function unique(values) {
        return Array.from(new Set(values));
      }

      function renderBoard() {
        const root = document.querySelector("[data-testid='Phase5ExitGateBoard']");
        root.setAttribute(
          "data-reduced-motion",
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "no-preference",
        );
        renderVerdict();
        renderFilters();
        renderCapabilityRail();
        renderCapabilitySummary();
        renderTraceability();
        renderEvidenceMatrix();
        renderInspector();
        renderTimeline();
        window.__phase5ExitBoardData = { ...boardData, loaded: true };
      }

      renderBoard();
    </script>
  </body>
</html>`;
}

function main(): void {
  writeJson(OUTPUTS.verdict, verdictJson);
  writeJson(OUTPUTS.readiness, readinessRegistry);
  writeJson(OUTPUTS.handoff, handoffContract);
  writeJson(OUTPUTS.blockerLedger, blockers);
  writeJson(OUTPUTS.carryForwardLedger, carryForwards);
  for (const [outputPath, payload] of Object.entries(seedPackets)) {
    writeJson(outputPath, payload);
  }

  writeCsv(
    OUTPUTS.consistencyCsv,
    [
      "capabilityId",
      "title",
      "contractFamily",
      "audience",
      "environmentClass",
      "evidenceStatus",
      "releaseInterpretation",
      "ownerTasks",
      "phaseRefs",
      "frozenContractRefs",
      "executableRefs",
      "proofRefs",
      "blockerRefs",
      "carryForwardRefs",
      "summary",
    ],
    consistencyCsvRows,
  );
  writeCsv(
    OUTPUTS.evidenceCsv,
    [
      "evidenceId",
      "capabilityId",
      "title",
      "evidenceFamily",
      "status",
      "audience",
      "environmentClass",
      "artifactRefs",
      "summary",
    ],
    evidenceCsvRows,
  );

  writeText(OUTPUTS.decisionDoc, renderDecisionDoc());
  writeText(OUTPUTS.mapDoc, renderCarryForwardMapDoc());
  writeText(OUTPUTS.reviewGuide, renderReviewGuide());
  writeText(OUTPUTS.board, renderBoardHtml());

  console.log(
    JSON.stringify(
      {
        verdict: OUTPUTS.verdict,
        readiness: OUTPUTS.readiness,
        handoff: OUTPUTS.handoff,
        board: OUTPUTS.board,
        blockerCount: blockers.length,
        carryForwardCount: carryForwards.length,
      },
      null,
      2,
    ),
  );
}

main();
