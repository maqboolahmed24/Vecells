import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const repoRoot = resolve("/Users/test/Code/V");

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-directory-choice-engine.ts",
  "packages/domains/pharmacy/tests/phase6-pharmacy-directory-choice-engine.test.ts",
  "tests/integration/348_pharmacy_directory.helpers.ts",
  "tests/integration/348_pharmacy_directory_choice_and_consent.spec.ts",
  "tests/integration/348_directory_replay_and_drift.spec.ts",
  "tests/property/348_provider_ranking_and_choice_stability.spec.ts",
  "services/command-api/migrations/156_phase6_pharmacy_directory_choice_pipeline.sql",
  "docs/architecture/348_pharmacy_directory_and_provider_choice_pipeline.md",
  "docs/api/348_pharmacy_directory_choice_and_consent_api.md",
  "docs/operations/348_directory_failover_choice_supersession_and_consent_rules.md",
  "data/analysis/348_external_reference_notes.md",
  "data/analysis/348_provider_choice_truth_matrix.csv",
  "data/analysis/348_directory_source_failover_matrix.csv",
  "data/analysis/348_warned_choice_and_consent_supersession_matrix.csv",
  "data/fixtures/348_directory_source_examples.json",
  "data/fixtures/348_choice_frontier_examples.json",
  "data/contracts/PHASE6_BATCH_348_355_INTERFACE_GAP_MINOR_ILLNESS_GUARDRAIL.json",
];

for (const relativePath of requiredFiles) {
  const absolutePath = resolve(repoRoot, relativePath);
  readFileSync(absolutePath, "utf8");
}

const sources = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/348_directory_source_examples.json"), "utf8"),
) as {
  baseScenario: Record<string, { providers: Array<{ odsCode: string }> }>;
};
assert(Object.keys(sources.baseScenario).length === 4, "348 fixtures must define all four adapters.");

const frontier = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/348_choice_frontier_examples.json"), "utf8"),
) as {
  visibleProviderIds: string[];
  recommendedProviderIds: string[];
  warningVisibleProviderIds: string[];
  suppressedUnsafeProviderIds: string[];
  expectedLaws: { manualSupportedVisible: boolean; hiddenTopKUsed: boolean };
};
assert(
  frontier.recommendedProviderIds.every((providerId) =>
    frontier.visibleProviderIds.includes(providerId),
  ),
  "Recommended frontier must be a subset of the visible frontier.",
);
assert(frontier.warningVisibleProviderIds.length > 0, "348 must keep a warned visible provider.");
assert(frontier.suppressedUnsafeProviderIds.length > 0, "348 must publish a suppressed-unsafe summary.");
assert(frontier.expectedLaws.manualSupportedVisible, "Manual-supported visibility law must hold.");
assert(frontier.expectedLaws.hiddenTopKUsed === false, "Hidden top-K law must remain false.");

console.log("validate_348_choice_pipeline: ok");
