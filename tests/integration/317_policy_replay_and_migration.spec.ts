import fs from "node:fs";

import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildTrustedPolicyFacts,
  setupEnhancedAccessPolicyHarness,
} from "./317_enhanced_access_policy.helpers.ts";
import { phase5PolicyEvaluationScopes } from "../../packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts";

const MIGRATION_PATH =
  "/Users/test/Code/V/services/command-api/migrations/145_phase5_enhanced_access_policy_engine.sql";
const EXAMPLES_PATH = "/Users/test/Code/V/data/analysis/317_policy_tuple_examples.json";
const EXCEPTION_CATALOG_PATH =
  "/Users/test/Code/V/data/analysis/317_policy_exception_catalog.csv";
const GAP_NOTE_PATH =
  "/Users/test/Code/V/data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_POLICY_EVALUATION_SCOPE_REGISTRY.json";

describe("317 policy replay and migration", () => {
  it("publishes the durable policy tables, examples, exception catalog, and typed gap note", () => {
    const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
    const examples = fs.readFileSync(EXAMPLES_PATH, "utf8");
    const catalog = fs.readFileSync(EXCEPTION_CATALOG_PATH, "utf8");
    const gapNote = fs.readFileSync(GAP_NOTE_PATH, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_routing_policy_packs");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_variance_window_policies");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_service_obligation_policies");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_practice_visibility_policies");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_capacity_ingestion_policies");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_enhanced_access_policies");
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS phase5_enhanced_access_policy_active_bindings",
    );
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS phase5_network_coordination_policy_evaluations",
    );
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_policy_exception_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_policy_evaluation_replay_fixtures");
    expect(sql).toContain("Phase 5 Enhanced Access policy engine");

    for (const scope of phase5PolicyEvaluationScopes) {
      expect(examples).toContain(scope);
    }
    expect(catalog).toContain("POLICY_TUPLE_DRIFT");
    expect(catalog).toContain("CAPACITY_DEGRADED_CALLBACK_ONLY");
    expect(catalog).toContain("PRACTICE_VISIBILITY_RESTRICTED");
    expect(gapNote).toContain("candidate_snapshot");
    expect(gapNote).toContain("offer_generation");
    expect(gapNote).toContain("manage_exposure");
  });

  it("replays stored evaluations exactly across all declared scopes", async () => {
    const harness = await setupEnhancedAccessPolicyHarness("317_replay_all");
    for (const [index, scope] of phase5PolicyEvaluationScopes.entries()) {
      const evaluation = await harness.policyService.evaluateHubCaseAgainstPolicy({
        hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
        pcnRef: harness.claimed.hubCase.servingPcnId,
        evaluationScope: scope,
        evaluatedAt: atMinute(10 + index),
        facts: buildTrustedPolicyFacts("317_replay_all", {
          requiredWindowFit: scope === "candidate_snapshot" ? 2 : 1,
        }),
      });
      const replay = await harness.policyService.replayHistoricalEvaluation({
        policyEvaluationId: evaluation.evaluation.policyEvaluationId,
      });

      expect(replay.matchesStoredEvaluation).toBe(true);
      expect(replay.mismatchFields).toEqual([]);
      expect(replay.originalEvaluation.evaluationScope).toBe(scope);
    }
  });
});
