import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  atMinute,
  buildCompleteFallbackInput,
  buildLinkCallbackInput,
  buildLinkReturnInput,
  buildResolveNoSlotInput,
  openFallbackOfferSession,
  setupHubFallbackHarness,
} from "../../tests/integration/323_hub_fallback.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "src",
    "phase5-hub-fallback-engine.ts",
  ),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-hub-fallback-engine.test.ts",
  ),
  path.join(ROOT, "tests", "integration", "323_hub_fallback.helpers.ts"),
  path.join(ROOT, "tests", "integration", "323_no_slot_callback_and_provenance.spec.ts"),
  path.join(ROOT, "tests", "integration", "323_return_reopen_and_loop_prevention.spec.ts"),
  path.join(ROOT, "tests", "integration", "323_hub_fallback_replay_and_migration.spec.ts"),
  path.join(ROOT, "tests", "property", "323_hub_fallback_decision_properties.spec.ts"),
  path.join(
    ROOT,
    "docs",
    "architecture",
    "323_no_slot_callback_return_and_reopen_workflows.md",
  ),
  path.join(ROOT, "docs", "api", "323_hub_fallback_and_reopen_api.md"),
  path.join(
    ROOT,
    "docs",
    "security",
    "323_urgent_return_callback_and_loop_prevention_rules.md",
  ),
  path.join(ROOT, "data", "analysis", "323_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "323_fallback_decision_examples.csv"),
  path.join(ROOT, "data", "analysis", "323_bounce_and_novelty_cases.csv"),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_BATCH_316_323_INTERFACE_GAP_FALLBACK_REOPEN_LIFECYCLE_COORDINATOR.json",
  ),
  path.join(
    ROOT,
    "services",
    "command-api",
    "migrations",
    "151_phase5_hub_fallback_workflows.sql",
  ),
];

const REQUIRED_SCRIPT =
  '"validate:323-hub-fallback-workflows": "pnpm exec tsx ./tools/analysis/validate_323_hub_fallback_workflows.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(
    fs.existsSync(filePath),
    `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`,
  );
  return fs.readFileSync(filePath, "utf8");
}

function validateFiles() {
  for (const filePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_323_phase5_track_backend_build_no_slot_urgent_bounce_back_callback_fallback_and_reopen_workflows",
    ) ||
      checklist.includes(
        "- [X] par_323_phase5_track_backend_build_no_slot_urgent_bounce_back_callback_fallback_and_reopen_workflows",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_323",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:323-hub-fallback-workflows",
  );
}

function validateMigration() {
  const sql = read(
    path.join(ROOT, "services", "command-api", "migrations", "151_phase5_hub_fallback_workflows.sql"),
  );
  for (const requiredTable of [
    "phase5_hub_fallback_records",
    "phase5_callback_fallback_records",
    "phase5_hub_return_to_practice_records",
    "phase5_hub_fallback_cycle_counters",
    "phase5_hub_fallback_supervisor_escalations",
    "phase5_hub_coordination_exceptions",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  for (const dependency of [
    "143_phase5_hub_case_kernel.sql",
    "148_phase5_alternative_offer_engine.sql",
    "150_phase5_practice_continuity_chain.sql",
  ]) {
    requireCondition(sql.includes(dependency), `MIGRATION_DEPENDENCY_MISSING:${dependency}`);
  }
}

function validateArtifacts() {
  const notes = read(path.join(ROOT, "data", "analysis", "323_external_reference_notes.md"));
  const decisions = read(path.join(ROOT, "data", "analysis", "323_fallback_decision_examples.csv"));
  const bounce = read(path.join(ROOT, "data", "analysis", "323_bounce_and_novelty_cases.csv"));
  const gap = read(
    path.join(
      ROOT,
      "data",
      "contracts",
      "PHASE5_BATCH_316_323_INTERFACE_GAP_FALLBACK_REOPEN_LIFECYCLE_COORDINATOR.json",
    ),
  );

  for (const marker of [
    "Digital clinical safety assurance",
    "DCB 0129 / DCB 0160 applicability guidance",
    "Message Exchange for Social Care and Health (MESH)",
    "Interaction methods",
  ]) {
    requireCondition(notes.includes(marker), `EXTERNAL_REFERENCE_NOTE_MISSING:${marker}`);
  }

  for (const exampleId of [
    "decision_323_001",
    "decision_323_002",
    "decision_323_004",
    "decision_323_005",
    "decision_323_006",
  ]) {
    requireCondition(decisions.includes(exampleId), `DECISION_EXAMPLE_MISSING:${exampleId}`);
  }

  for (const caseId of [
    "bounce_323_001",
    "bounce_323_003",
    "bounce_323_004",
    "bounce_323_005",
  ]) {
    requireCondition(bounce.includes(caseId), `BOUNCE_CASE_MISSING:${caseId}`);
  }

  for (const field of [
    "\"taskId\"",
    "\"missingSurface\"",
    "\"expectedOwnerTask\"",
    "\"temporaryFallback\"",
    "\"riskIfUnresolved\"",
    "\"followUpAction\"",
  ]) {
    requireCondition(gap.includes(field), `INTERFACE_GAP_FIELD_MISSING:${field}`);
  }
}

async function validateRuntimeProof() {
  const callbackHarness = await setupHubFallbackHarness("323_validator_callback");
  const opened = await openFallbackOfferSession(callbackHarness);
  const callbackCreated = await callbackHarness.fallbackService.resolveNoSlotFallback(
    buildResolveNoSlotInput(callbackHarness, {
      callbackRequested: true,
      trustedAlternativeFrontierExists: true,
      offerLeadMinutes: 40,
      callbackLeadMinutes: 8,
      alternativeOfferSessionId: opened.openResult.session.alternativeOfferSessionId,
    }),
  );
  requireCondition(callbackCreated.route === "callback", "RUNTIME_CALLBACK_ROUTE_INVALID");
  requireCondition(
    callbackCreated.session?.openChoiceState === "read_only_provenance",
    "RUNTIME_CALLBACK_PROVENANCE_INVALID",
  );
  requireCondition(
    callbackCreated.fallbackRecord?.waitlistFallbackObligationRef?.includes(
      "waitlist_fallback_obligation",
    ) ?? false,
    "RUNTIME_WAITLIST_CARRY_FORWARD_MISSING",
  );

  const callbackLinked = await callbackHarness.fallbackService.linkCallbackFallback(
    buildLinkCallbackInput(
      callbackCreated.fallbackRecord!.hubFallbackRecordId,
      "323_validator_callback",
    ),
  );
  requireCondition(
    callbackLinked.callbackFallbackRecord.callbackExpectationEnvelopeRef !== null,
    "RUNTIME_CALLBACK_EXPECTATION_MISSING",
  );
  requireCondition(
    callbackLinked.hubTransition.hubCase.status === "callback_offered",
    "RUNTIME_CALLBACK_TRANSITION_INVALID",
  );

  const callbackCompleted = await callbackHarness.fallbackService.completeHubFallback(
    buildCompleteFallbackInput(
      callbackCreated.fallbackRecord!.hubFallbackRecordId,
      "323_validator_callback",
    ),
  );
  requireCondition(
    callbackCompleted.closedCase?.hubCase.status === "closed",
    "RUNTIME_CALLBACK_CLOSE_INVALID",
  );

  const returnHarness = await setupHubFallbackHarness("323_validator_return");
  const returnOpened = await openFallbackOfferSession(returnHarness);
  const returned = await returnHarness.fallbackService.resolveNoSlotFallback(
    buildResolveNoSlotInput(returnHarness, {
      callbackRequested: true,
      trustedAlternativeFrontierExists: true,
      offerLeadMinutes: 50,
      callbackLeadMinutes: 40,
      alternativeOfferSessionId: returnOpened.openResult.session.alternativeOfferSessionId,
      bestTrustedFit: 0.33,
      trustGap: 0.71,
      pBreach: 0.82,
    }),
  );
  requireCondition(returned.route === "return_to_practice", "RUNTIME_RETURN_ROUTE_INVALID");
  requireCondition(
    returned.returnToPracticeRecord?.urgencyCarryFloor === 0.82,
    "RUNTIME_URGENCY_CARRY_INVALID",
  );

  const returnLinked = await returnHarness.fallbackService.linkReturnToPractice(
    buildLinkReturnInput(returned.fallbackRecord!.hubFallbackRecordId, "323_validator_return"),
  );
  requireCondition(
    returnLinked.returnToPracticeRecord.reopenedWorkflowRef !== null,
    "RUNTIME_REOPEN_WORKFLOW_MISSING",
  );
  requireCondition(
    returnLinked.truthProjection.fallbackLinkState === "return_linked",
    "RUNTIME_RETURN_LINK_STATE_INVALID",
  );

  const returnCompleted = await returnHarness.fallbackService.completeHubFallback(
    buildCompleteFallbackInput(returned.fallbackRecord!.hubFallbackRecordId, "323_validator_return"),
  );
  requireCondition(
    returnCompleted.closedCase?.hubCase.status === "closed",
    "RUNTIME_RETURN_CLOSE_INVALID",
  );

  const loopHarness = await setupHubFallbackHarness("323_validator_loop");
  await loopHarness.fallbackRepositories.saveCycleCounter({
    hubFallbackCycleCounterId: "hub_cycle_counter_323_validator_loop",
    hubCoordinationCaseId: loopHarness.candidatesReady.hubCase.hubCoordinationCaseId,
    bounceCount: 2,
    previousBestTrustedFit: 0.42,
    previousPriorityBand: "priority",
    latestNoveltyScore: 0.12,
    lastReturnedAt: "2026-04-24T09:09:00.000Z",
    updatedAt: "2026-04-24T09:09:00.000Z",
    version: 1,
  });
  const escalated = await loopHarness.fallbackService.resolveNoSlotFallback(
    buildResolveNoSlotInput(loopHarness, {
      trustedAlternativeFrontierExists: false,
      degradedOnlyEvidence: true,
      callbackRequested: false,
      policyRequiresCallback: false,
      offerLeadMinutes: 60,
      callbackLeadMinutes: 50,
      bestTrustedFit: 0.44,
      trustGap: 0.55,
      pBreach: 0.76,
      newClinicalContextScore: 0.1,
      recordedAt: atMinute(11),
    }),
  );
  requireCondition(
    escalated.supervisorEscalation?.escalationState === "required",
    "RUNTIME_LOOP_ESCALATION_MISSING",
  );
  requireCondition(
    escalated.exception?.exceptionClass === "loop_prevention",
    "RUNTIME_LOOP_EXCEPTION_INVALID",
  );
  requireCondition(
    escalated.fallbackRecord?.fallbackState === "supervisor_review_required",
    "RUNTIME_LOOP_FALLBACK_STATE_INVALID",
  );
}

async function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateMigration();
  validateArtifacts();
  await validateRuntimeProof();
  console.log("323 hub fallback workflows validation passed");
}

await main();
