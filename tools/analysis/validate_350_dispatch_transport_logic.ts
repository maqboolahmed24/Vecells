import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const repoRoot = resolve("/Users/test/Code/V");

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-dispatch-engine.ts",
  "packages/domains/pharmacy/tests/public-api.test.ts",
  "packages/domains/pharmacy/tests/phase6-pharmacy-dispatch-engine.test.ts",
  "tests/integration/350_pharmacy_dispatch.helpers.ts",
  "tests/integration/350_dispatch_plan_and_idempotency.spec.ts",
  "tests/integration/350_dispatch_receipt_and_truth.spec.ts",
  "tests/integration/350_dispatch_retry_expiry_and_stale_receipts.spec.ts",
  "tests/integration/350_manual_dispatch_and_contradiction.spec.ts",
  "tests/property/350_dispatch_determinism_and_retry.spec.ts",
  "services/command-api/migrations/158_phase6_pharmacy_dispatch_transport_and_retry_logic.sql",
  "docs/architecture/350_dispatch_transport_and_retry_expiry_logic.md",
  "docs/api/350_pharmacy_dispatch_and_proof_api.md",
  "docs/operations/350_transport_retry_expiry_and_manual_assistance_rules.md",
  "data/analysis/350_external_reference_notes.md",
  "data/analysis/350_transport_profile_matrix.csv",
  "data/analysis/350_retry_timeout_and_expiry_matrix.csv",
  "data/analysis/350_dispatch_proof_state_matrix.csv",
  "data/fixtures/350_dispatch_receipt_examples.json",
];

for (const relativePath of requiredFiles) {
  readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const transportProfileRows = readFileSync(
  resolve(repoRoot, "data/analysis/350_transport_profile_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => line.split(",")[0]);

assert(
  transportProfileRows.length === 5,
  "350 transport profile matrix must publish all five dispatch transport modes.",
);

const expectedTransportModes = [
  "bars_fhir",
  "supplier_interop",
  "nhsmail_shared_mailbox",
  "mesh",
  "manual_assisted_dispatch",
];

for (const transportMode of expectedTransportModes) {
  assert(
    transportProfileRows.includes(transportMode),
    `350 transport profile matrix must include ${transportMode}.`,
  );
}

const retryRows = readFileSync(
  resolve(repoRoot, "data/analysis/350_retry_timeout_and_expiry_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(retryRows.length === 5, "350 retry matrix must include five governed scenarios.");
assert(
  retryRows.some((row) => row.includes("tuple_drift_new_package") && row.includes("fresh_attempt")),
  "350 retry matrix must include tuple drift forcing a fresh attempt family.",
);
assert(
  retryRows.some((row) => row.includes("stale_consent_before_send") && row.includes("stale_choice_or_consent")),
  "350 retry matrix must include stale choice/consent fail-closed handling.",
);

const proofRows = readFileSync(
  resolve(repoRoot, "data/analysis/350_dispatch_proof_state_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(proofRows.length === 5, "350 proof-state matrix must define five proof postures.");
assert(
  proofRows.some((row) => row.includes("satisfied") && row.includes("live_referral_confirmed")),
  "350 proof-state matrix must include the calm confirmed settlement.",
);
assert(
  proofRows.some((row) => row.includes("disputed") && row.includes("reconciliation_required")),
  "350 proof-state matrix must include contradiction-driven reconciliation.",
);

const receiptExamples = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/350_dispatch_receipt_examples.json"), "utf8"),
) as {
  examples: Array<{ transportMode: string; sourceClass: string; lane: string; proofRef: string }>;
};

assert(
  receiptExamples.examples.length === 5,
  "350 receipt fixture must publish one example per transport mode.",
);
assert(
  expectedTransportModes.every((transportMode) =>
    receiptExamples.examples.some((example) => example.transportMode === transportMode),
  ),
  "350 receipt fixtures must cover every transport mode.",
);
assert(
  receiptExamples.examples.every(
    (example) => example.sourceClass.length > 0 && example.lane.length > 0 && example.proofRef.length > 0,
  ),
  "350 receipt fixtures must include source class, lane, and proof reference for every example.",
);

const externalNotes = readFileSync(
  resolve(repoRoot, "data/analysis/350_external_reference_notes.md"),
  "utf8",
);

const requiredReferenceNeedles = [
  "https://digital.nhs.uk/services/booking-and-referral-standard",
  "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
  "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
  "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/",
];

for (const referenceNeedle of requiredReferenceNeedles) {
  assert(
    externalNotes.includes(referenceNeedle),
    `350 external reference notes must cite ${referenceNeedle}.`,
  );
}

console.log("validate_350_dispatch_transport_logic: ok");
