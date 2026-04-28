import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const repoRoot = resolve("/Users/test/Code/V");

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-referral-package-engine.ts",
  "packages/domains/pharmacy/tests/public-api.test.ts",
  "packages/domains/pharmacy/tests/phase6-pharmacy-referral-package-engine.test.ts",
  "tests/integration/349_pharmacy_referral_package.helpers.ts",
  "tests/integration/349_referral_package_freeze_and_replay.spec.ts",
  "tests/integration/349_referral_package_supersession_and_invalidation.spec.ts",
  "tests/property/349_referral_package_determinism.spec.ts",
  "services/command-api/migrations/157_phase6_pharmacy_referral_package_composer.sql",
  "docs/architecture/349_referral_package_composer_and_governance_binding.md",
  "docs/api/349_pharmacy_referral_package_api.md",
  "docs/security/349_package_content_redaction_and_provenance_rules.md",
  "data/analysis/349_external_reference_notes.md",
  "data/analysis/349_package_content_matrix.csv",
  "data/analysis/349_package_supersession_trigger_matrix.csv",
  "data/analysis/349_fhir_representation_replay_matrix.csv",
  "data/fixtures/349_referral_package_examples.json",
  "data/fixtures/349_representation_examples.json",
];

for (const relativePath of requiredFiles) {
  readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const packageExamples = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/349_referral_package_examples.json"), "utf8"),
) as {
  packages: Array<{ packageState: string; packageFingerprint: string; packageHash: string }>;
  governanceDecisions: Array<{ decisionState: string }>;
  correlationRecords: Array<{ authoritativeDispatchProofState: string; acknowledgementState: string }>;
};

assert(packageExamples.packages.length > 0, "349 must publish at least one package fixture.");
assert(
  packageExamples.packages.every(
    (entry) =>
      entry.packageState === "frozen" &&
      entry.packageFingerprint.length > 0 &&
      entry.packageHash.length > 0,
  ),
  "349 package fixtures must include frozen immutable tuple examples.",
);
assert(
  packageExamples.governanceDecisions.some(
    (decision) => decision.decisionState === "included_redaction_required",
  ),
  "349 governance fixtures must include a redaction-required example.",
);
assert(
  packageExamples.governanceDecisions.some(
    (decision) => decision.decisionState === "unavailable",
  ),
  "349 governance fixtures must include an unavailable example.",
);
assert(
  packageExamples.correlationRecords.every(
    (entry) =>
      entry.authoritativeDispatchProofState === "pending" &&
      entry.acknowledgementState === "awaiting_dispatch",
  ),
  "349 correlation fixtures must seed pending dispatch and awaiting acknowledgement.",
);

const representationExamples = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/349_representation_examples.json"), "utf8"),
) as {
  resourceTypes: string[];
  replayLaw: { sameTupleRematerializesSameRepresentationSet: boolean };
};
assert(
  representationExamples.resourceTypes.includes("Provenance") &&
    representationExamples.resourceTypes.includes("DocumentReference"),
  "349 representation fixtures must include Provenance and DocumentReference.",
);
assert(
  representationExamples.replayLaw.sameTupleRematerializesSameRepresentationSet,
  "349 replay law must require deterministic rematerialization.",
);

const notes = readFileSync(
  resolve(repoRoot, "data/analysis/349_external_reference_notes.md"),
  "utf8",
);
assert(
  notes.includes("https://digital.nhs.uk/services/booking-and-referral-standard"),
  "349 external notes must cite Booking and Referral Standard.",
);
assert(
  notes.includes("https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh"),
  "349 external notes must cite MESH.",
);
assert(
  notes.includes("https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/"),
  "349 external notes must cite the Pharmacy First service specification.",
);

console.log("validate_349_referral_package_and_governance: ok");
