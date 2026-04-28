import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  atMinute,
  buildMutationFence,
  buildOpenAlternativeOfferInput,
  buildReservationBinding,
  openAndDeliverAlternativeOfferSession,
  openAlternativeOfferSession,
  setupAlternativeOfferHarness,
} from "../../tests/integration/320_alternative_offer.helpers.ts";

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
    "phase5-alternative-offer-engine.ts",
  ),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-alternative-offer-engine.test.ts",
  ),
  path.join(ROOT, "tests", "integration", "320_alternative_offer.helpers.ts"),
  path.join(ROOT, "tests", "integration", "320_offer_solver_and_grant_guards.spec.ts"),
  path.join(ROOT, "tests", "integration", "320_offer_regeneration_and_callback.spec.ts"),
  path.join(ROOT, "tests", "integration", "320_offer_replay_and_migration.spec.ts"),
  path.join(ROOT, "tests", "property", "320_offer_diversity_properties.spec.ts"),
  path.join(
    ROOT,
    "docs",
    "architecture",
    "320_alternative_offer_optimisation_and_secure_choice_backend.md",
  ),
  path.join(ROOT, "docs", "api", "320_alternative_offer_and_patient_choice_api.md"),
  path.join(
    ROOT,
    "docs",
    "security",
    "320_offer_link_subject_fence_and_regeneration_rules.md",
  ),
  path.join(ROOT, "data", "analysis", "320_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "320_offer_diversity_examples.csv"),
  path.join(ROOT, "data", "analysis", "320_offer_regeneration_cases.csv"),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_BATCH_316_323_INTERFACE_GAP_OFFERS_CALLBACK_LINKAGE.json",
  ),
  path.join(
    ROOT,
    "services",
    "command-api",
    "migrations",
    "148_phase5_alternative_offer_engine.sql",
  ),
];

const REQUIRED_SCRIPT =
  '"validate:320-offer-solver-and-choice-guards": "pnpm exec tsx ./tools/analysis/validate_320_offer_solver_and_choice_guards.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  return fs.readFileSync(filePath, "utf8");
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_320_phase5_track_backend_build_alternative_offer_generation_patient_choice_and_expiry_rules",
    ) ||
      checklist.includes(
        "- [X] par_320_phase5_track_backend_build_alternative_offer_generation_patient_choice_and_expiry_rules",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_320",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:320-offer-solver-and-choice-guards",
  );
}

function validateMigration() {
  const sql = read(
    path.join(ROOT, "services", "command-api", "migrations", "148_phase5_alternative_offer_engine.sql"),
  );
  for (const requiredTable of [
    "phase5_alternative_offer_optimisation_plans",
    "phase5_alternative_offer_sessions",
    "phase5_alternative_offer_entries",
    "phase5_alternative_offer_fallback_cards",
    "phase5_alternative_offer_regeneration_settlements",
    "phase5_alternative_offer_selection_events",
    "phase5_offer_secure_link_bindings",
    "phase5_hub_offer_truth_projections",
    "phase5_alternative_offer_read_back_captures",
    "phase5_alternative_offer_replay_fixtures",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  for (const dependency of [
    "143_phase5_hub_case_kernel.sql",
    "146_phase5_network_capacity_snapshot_pipeline.sql",
    "147_phase5_hub_queue_engine.sql",
  ]) {
    requireCondition(sql.includes(dependency), `MIGRATION_DEPENDENCY_MISSING:${dependency}`);
  }
}

function validateArtifacts() {
  const notes = read(path.join(ROOT, "data", "analysis", "320_external_reference_notes.md"));
  const diversity = read(path.join(ROOT, "data", "analysis", "320_offer_diversity_examples.csv"));
  const regeneration = read(path.join(ROOT, "data", "analysis", "320_offer_regeneration_cases.csv"));
  const seam = JSON.parse(
    read(
      path.join(
        ROOT,
        "data",
        "contracts",
        "PHASE5_BATCH_316_323_INTERFACE_GAP_OFFERS_CALLBACK_LINKAGE.json",
      ),
    ),
  ) as { taskId?: string; expectedOwnerTask?: string };

  for (const marker of [
    "NHS App web integration",
    "HL7 FHIR R4 Slot",
    "HL7 FHIR R4 Appointment",
    "Digital clinical safety assurance",
    "DCB0129 / DCB0160 applicability guidance",
  ]) {
    requireCondition(notes.includes(marker), `EXTERNAL_REFERENCE_NOTE_MISSING:${marker}`);
  }

  for (const exampleId of [
    "offer_diversity_001",
    "offer_diversity_002",
    "offer_diversity_003",
    "offer_diversity_004",
    "offer_diversity_005",
  ]) {
    requireCondition(diversity.includes(exampleId), `DIVERSITY_EXAMPLE_MISSING:${exampleId}`);
  }

  for (const caseId of [
    "regen_320_001",
    "regen_320_002",
    "regen_320_003",
    "regen_320_004",
    "regen_320_005",
  ]) {
    requireCondition(regeneration.includes(caseId), `REGEN_CASE_MISSING:${caseId}`);
  }

  requireCondition(seam.taskId === "par_320", "SEAM_TASK_ID_INVALID");
  requireCondition(
    seam.expectedOwnerTask ===
      "par_323_phase5_track_backend_build_no_slot_callback_return_to_practice_and_reopen_workflows",
    "SEAM_OWNER_INVALID",
  );
}

async function validateRuntimeProof() {
  const offerHarness = await setupAlternativeOfferHarness("320_validator_offer");
  const { openResult, delivered } = await openAndDeliverAlternativeOfferSession(offerHarness);
  requireCondition(openResult.entries.length > 0, "RUNTIME_NO_VISIBLE_ENTRIES");
  requireCondition(openResult.fallbackCard?.cardType === "callback", "RUNTIME_CALLBACK_CARD_MISSING");
  const redemption = await offerHarness.offerService.redeemAlternativeOfferLink({
    alternativeOfferSessionId: openResult.session.alternativeOfferSessionId,
    presentedToken: openResult.materializedToken!,
    recordedAt: atMinute(11),
    ...buildMutationFence(openResult.session, delivered.truthProjection.truthTupleHash),
  });
  requireCondition(redemption.reasonCodes.length === 0, "RUNTIME_REDEMPTION_REASON_CODES_PRESENT");
  requireCondition(
    redemption.liveActionabilityState === "live_open_choice",
    "RUNTIME_REDEMPTION_ACTIONABILITY_INVALID",
  );

  const acceptHarness = await setupAlternativeOfferHarness("320_validator_accept");
  const acceptedOffer = await openAndDeliverAlternativeOfferSession(acceptHarness);
  const accepted = await acceptHarness.offerService.acceptAlternativeOfferEntry({
    alternativeOfferSessionId: acceptedOffer.openResult.session.alternativeOfferSessionId,
    alternativeOfferEntryId: acceptedOffer.openResult.entries[0]!.alternativeOfferEntryId,
    actorRef: "patient_accept_validator",
    routeIntentBindingRef: "route_accept_validator",
    commandActionRecordRef: "action_accept_validator",
    commandSettlementRecordRef: "settlement_accept_validator",
    recordedAt: atMinute(12),
    reservationBinding: buildReservationBinding(
      acceptedOffer.openResult.session,
      acceptedOffer.openResult.entries[0]!.candidateRef,
    ),
    ...buildMutationFence(
      acceptedOffer.openResult.session,
      acceptedOffer.delivered.truthProjection.truthTupleHash,
    ),
  });
  requireCondition(accepted.hubTransition.hubCase.status === "coordinator_selecting", "RUNTIME_ACCEPT_STATUS_INVALID");
  requireCondition(accepted.entry.selectionState === "selected", "RUNTIME_ACCEPT_ENTRY_INVALID");

  const callbackHarness = await setupAlternativeOfferHarness("320_validator_callback");
  const callbackOffer = await openAndDeliverAlternativeOfferSession(callbackHarness);
  const callback = await callbackHarness.offerService.requestCallbackFromAlternativeOffer({
    alternativeOfferSessionId: callbackOffer.openResult.session.alternativeOfferSessionId,
    actorRef: "patient_callback_validator",
    routeIntentBindingRef: "route_callback_validator",
    commandActionRecordRef: "action_callback_validator",
    commandSettlementRecordRef: "settlement_callback_validator",
    recordedAt: atMinute(12),
    activeFallbackRef: "gap_callback_validator",
    ...buildMutationFence(
      callbackOffer.openResult.session,
      callbackOffer.delivered.truthProjection.truthTupleHash,
    ),
  });
  requireCondition(
    callback.hubTransition.hubCase.status === "callback_transfer_pending",
    "RUNTIME_CALLBACK_STATUS_INVALID",
  );
  requireCondition(
    callback.truthProjection.fallbackLinkState === "callback_pending_link",
    "RUNTIME_CALLBACK_LINK_STATE_INVALID",
  );

  const replayHarness = await setupAlternativeOfferHarness("320_validator_replay");
  const replayOpened = await openAlternativeOfferSession(replayHarness);
  const replay = await replayHarness.offerService.replayAlternativeOfferSession({
    alternativeOfferSessionId: replayOpened.session.alternativeOfferSessionId,
    replayedAt: atMinute(12),
  });
  requireCondition(replay.matchesStoredSession, "RUNTIME_REPLAY_MISMATCH");
  requireCondition(replay.mismatchFields.length === 0, "RUNTIME_REPLAY_FIELDS_PRESENT");

  const regenHarness = await setupAlternativeOfferHarness("320_validator_regen");
  const regenOpened = await openAlternativeOfferSession(regenHarness);
  const regenerated = await regenHarness.offerService.regenerateAlternativeOfferSession({
    ...buildOpenAlternativeOfferInput(regenHarness, {
      actorRef: "coordinator_regen_validator",
      routeIntentBindingRef: "route_regen_validator",
      commandActionRecordRef: "action_regen_validator",
      commandSettlementRecordRef: "settlement_regen_validator",
      recordedAt: atMinute(13),
    }),
    alternativeOfferSessionId: regenOpened.session.alternativeOfferSessionId,
    triggerClass: "candidate_snapshot_superseded",
  });
  requireCondition(
    regenerated.settlement.resultState === "regenerated_in_shell",
    "RUNTIME_REGEN_RESULT_INVALID",
  );
  requireCondition(
    regenerated.nextSession?.alternativeOfferSessionId !== regenOpened.session.alternativeOfferSessionId,
    "RUNTIME_REGEN_NEXT_SESSION_INVALID",
  );
}

async function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateMigration();
  validateArtifacts();
  await validateRuntimeProof();
  console.log("320 offer solver and choice guards validation passed.");
}

await main();
