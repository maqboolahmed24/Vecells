import fs from "node:fs";
import path from "node:path";
import { write475BAUArtifacts } from "./plan_475_training_runbooks";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertFile(relativePath: string): void {
  assertCondition(fs.existsSync(path.join(root, relativePath)), `Missing ${relativePath}`);
}

function assertIncludes(relativePath: string, fragment: string): void {
  assertCondition(read(relativePath).includes(fragment), `${relativePath} missing ${fragment}`);
}

write475BAUArtifacts();

const requiredFiles = [
  "data/bau/475_operating_model.json",
  "data/bau/475_role_responsibility_matrix.json",
  "data/bau/475_training_curriculum_manifest.json",
  "data/bau/475_competency_evidence_ledger.json",
  "data/bau/475_runbook_bundle_manifest.json",
  "data/bau/475_governance_cadence_calendar.json",
  "data/bau/475_support_escalation_paths.json",
  "data/contracts/475_bau_training_runbooks.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_475_COMPETENCY_COMPLETION_AUTHORITY.json",
  "docs/runbooks/475_bau_operating_model.md",
  "docs/training/475_launch_training_pack.md",
  "docs/training/475_assistive_layer_human_review_training.md",
  "docs/training/475_nhs_app_channel_support_training.md",
  "data/analysis/475_algorithm_alignment_notes.md",
  "data/analysis/475_external_reference_notes.json",
  "tools/bau/plan_475_training_runbooks.ts",
  "tools/bau/validate_475_training_runbooks.ts",
  "tests/bau/475_role_responsibility_matrix.test.ts",
  "tests/bau/475_runbook_bundle_manifest.test.ts",
  "tests/playwright/475_training_runbook_centre.spec.ts",
  "apps/ops-console/src/training-runbook-centre-475.model.ts",
];

for (const requiredFile of requiredFiles) {
  assertFile(requiredFile);
}

const operatingModel = readJson<any>("data/bau/475_operating_model.json");
const roleMatrix = readJson<any>("data/bau/475_role_responsibility_matrix.json");
const curriculum = readJson<any>("data/bau/475_training_curriculum_manifest.json");
const ledger = readJson<any>("data/bau/475_competency_evidence_ledger.json");
const runbooks = readJson<any>("data/bau/475_runbook_bundle_manifest.json");
const cadence = readJson<any>("data/bau/475_governance_cadence_calendar.json");
const escalation = readJson<any>("data/bau/475_support_escalation_paths.json");
const gap = readJson<any>(
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_475_COMPETENCY_COMPLETION_AUTHORITY.json",
);

assertCondition(operatingModel.schemaVersion === "475.programme.bau-training-runbooks.v1", "Bad schema version");
assertCondition(operatingModel.operatingModelHash.match(/^[a-f0-9]{64}$/), "Operating model hash missing");
assertCondition(operatingModel.readinessState === "complete_with_constraints", "Unexpected operating readiness");
assertCondition(roleMatrix.launchRoles.length === 13, "All 13 launch roles must be present");
assertCondition(
  roleMatrix.launchRoles.every((role: any) => role.trainingModuleRefs.length > 0),
  "Every role must have training modules",
);
assertCondition(
  curriculum.assistiveReviewResponsibilityNotice.requiredMessage.includes("review, revise, and approve"),
  "Assistive review responsibility missing",
);
assertCondition(
  curriculum.assistiveReviewResponsibilityNotice.requiredMessage.includes("No model output is final authority"),
  "Assistive final-authority warning missing",
);
assertCondition(
  curriculum.channelSupportResponsibilityNotice.channelActivationPermitted === false &&
    curriculum.channelSupportResponsibilityNotice.requiredMessage.includes("not live"),
  "NHS App deferred-channel notice missing",
);
assertCondition(
  ledger.entries.every((entry: any) => entry.releaseCandidateRef === operatingModel.releaseCandidateRef),
  "Competency evidence must bind current release candidate",
);
assertCondition(
  runbooks.runbookBindingRecords.every(
    (runbook: any) =>
      runbook.owner &&
      runbook.reviewCadenceDays > 0 &&
      runbook.artifactPresentationContractRef &&
      runbook.accessibleAlternativeRef,
  ),
  "Runbooks must have owner, cadence, presentation contract, and accessible alternative",
);
assertCondition(
  runbooks.edgeCaseGuards.some(
    (guard: any) => guard.edgeCaseId === "runbook_link_points_to_superseded_release_tuple",
  ),
  "Superseded runbook edge guard missing",
);
assertCondition(
  escalation.edgeCaseGuards.some(
    (guard: any) => guard.edgeCaseId === "incident_escalation_path_has_out_of_hours_gap",
  ),
  "Out-of-hours escalation edge guard missing",
);
assertCondition(
  cadence.events.some((event: any) => event.cadenceEventId === "gce_475_monthly_nhs_app_data_pack_ready"),
  "NHS App monthly data cadence missing",
);
assertCondition(gap.failClosedBridge.privilegedMutationPermitted === false, "Gap bridge must fail closed");

for (const anchor of [
  'data-testid="training-475-centre"',
  'data-testid="training-475-readiness-strip"',
  'data-testid="training-475-role-grid"',
  'data-testid="training-475-runbook-drawer"',
  'data-testid="training-475-evidence-ledger"',
  'data-testid="training-475-cadence-calendar"',
  'data-testid="training-475-support-rail"',
  'data-testid="training-475-mark-complete"',
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", anchor);
}

assertIncludes("package.json", "test:programme:475-bau-training-runbooks");
assertIncludes("package.json", "validate:475-bau-training-runbooks");
assertIncludes("prompt/checklist.md", "seq_475_programme_prepare_training_runbooks");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}/i;
for (const artifact of [
  "data/bau/475_operating_model.json",
  "data/bau/475_role_responsibility_matrix.json",
  "data/bau/475_training_curriculum_manifest.json",
  "data/bau/475_competency_evidence_ledger.json",
  "data/bau/475_runbook_bundle_manifest.json",
  "data/bau/475_governance_cadence_calendar.json",
  "data/bau/475_support_escalation_paths.json",
]) {
  assertCondition(!read(artifact).match(forbiddenSurfacePatterns), `${artifact} leaked sensitive text`);
}

console.log("Task 475 BAU training and runbooks validation passed.");
