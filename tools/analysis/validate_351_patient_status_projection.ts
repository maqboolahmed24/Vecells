import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const repoRoot = resolve("/Users/test/Code/V");

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-patient-status-engine.ts",
  "packages/domains/pharmacy/tests/public-api.test.ts",
  "packages/domains/pharmacy/tests/phase6-pharmacy-patient-status-engine.test.ts",
  "tests/integration/351_pharmacy_patient_status.helpers.ts",
  "tests/integration/351_pharmacy_macro_state_and_copy.spec.ts",
  "tests/integration/351_reachability_repair_and_identity_hold.spec.ts",
  "tests/integration/351_review_completion_and_reference_visibility.spec.ts",
  "tests/property/351_patient_status_monotonicity.spec.ts",
  "services/command-api/migrations/159_phase6_pharmacy_patient_status_and_instruction_projection.sql",
  "docs/architecture/351_patient_instruction_generation_and_status_projection.md",
  "docs/api/351_patient_pharmacy_status_api.md",
  "docs/content/351_pharmacy_status_and_instruction_copy_rules.md",
  "data/analysis/351_external_reference_notes.md",
  "data/analysis/351_patient_macro_state_matrix.csv",
  "data/analysis/351_reachability_blocker_and_repair_matrix.csv",
  "data/analysis/351_wrong_patient_and_identity_hold_matrix.csv",
  "data/fixtures/351_patient_status_examples.json",
  "data/contracts/PHASE6_BATCH_348_355_INTERFACE_GAP_PATIENT_STATUS_CONTINUITY_AND_OUTCOME_RUNTIME.json",
];

for (const relativePath of requiredFiles) {
  readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const macroRows = readFileSync(
  resolve(repoRoot, "data/analysis/351_patient_macro_state_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(macroRows.length === 5, "351 macro-state matrix must publish five canonical state rows.");
for (const state of [
  "choose_or_confirm",
  "action_in_progress",
  "reviewing_next_steps",
  "completed",
  "urgent_action",
]) {
  assert(
    macroRows.some((row) => row.includes(`,${state},`)),
    `351 macro-state matrix must include ${state}.`,
  );
}

const blockerRows = readFileSync(
  resolve(repoRoot, "data/analysis/351_reachability_blocker_and_repair_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

for (const purpose of ["pharmacy_contact", "outcome_confirmation", "urgent_return"]) {
  assert(
    blockerRows.some((row) => row.startsWith(`${purpose},`)),
    `351 reachability matrix must include ${purpose}.`,
  );
}

const identityRows = readFileSync(
  resolve(repoRoot, "data/analysis/351_wrong_patient_and_identity_hold_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(
  identityRows.some((row) => row.startsWith("quarantined,false,provenance_only,suppressed,false")),
  "351 identity-hold matrix must include the active wrong-patient freeze posture.",
);

const fixtureExamples = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/351_patient_status_examples.json"), "utf8"),
) as {
  examples: Array<{ macroState: string; nextStepText: string }>;
};

assert(
  fixtureExamples.examples.length === 5,
  "351 patient-status fixtures must cover all five macro states.",
);
assert(
  fixtureExamples.examples.some(
    (example) =>
      example.macroState === "action_in_progress" &&
      example.nextStepText.includes("not a booked appointment"),
  ),
  "351 fixtures must explicitly prove referral wording does not imply a booked appointment.",
);

const externalNotes = readFileSync(
  resolve(repoRoot, "data/analysis/351_external_reference_notes.md"),
  "utf8",
);

for (const url of [
  "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/",
  "https://www.england.nhs.uk/long-read/update-on-the-pharmacy-first-service/",
  "https://service-manual.nhs.uk/content/writing-nhs-messages",
  "https://service-manual.nhs.uk/content/health-literacy",
  "https://service-manual.nhs.uk/accessibility/content",
]) {
  assert(
    externalNotes.includes(url),
    `351 external reference notes must cite ${url}.`,
  );
}

const engineSource = readFileSync(
  resolve(repoRoot, "packages/domains/pharmacy/src/phase6-pharmacy-patient-status-engine.ts"),
  "utf8",
);

for (const needle of [
  "export interface PharmacyPatientStatusProjectionSnapshot",
  "export interface Phase6PharmacyPatientStatusService",
  "async projectPatientStatus(command)",
  "function mapMacroState(",
  "function buildInstructionCopy(",
]) {
  assert(
    engineSource.includes(needle),
    `351 engine must include ${needle}.`,
  );
}

console.log("validate_351_patient_status_projection: ok");
