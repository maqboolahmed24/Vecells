import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  atMinute,
  buildAcknowledgementInput,
  buildEnqueuePracticeContinuityInput,
  buildReceiptInput,
  buildReopenInput,
  setupPracticeContinuityHarness,
} from "../../tests/integration/322_practice_continuity.helpers.ts";

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
    "phase5-practice-continuity-engine.ts",
  ),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-practice-continuity-engine.test.ts",
  ),
  path.join(ROOT, "tests", "integration", "322_practice_continuity.helpers.ts"),
  path.join(ROOT, "tests", "integration", "322_practice_continuity_chain_truth.spec.ts"),
  path.join(ROOT, "tests", "integration", "322_practice_continuity_adapter_and_dispute.spec.ts"),
  path.join(ROOT, "tests", "integration", "322_practice_continuity_replay_and_migration.spec.ts"),
  path.join(ROOT, "tests", "property", "322_practice_ack_generation_properties.spec.ts"),
  path.join(
    ROOT,
    "docs",
    "architecture",
    "322_practice_continuity_message_and_acknowledgement_chain.md",
  ),
  path.join(ROOT, "docs", "api", "322_practice_continuity_message_api.md"),
  path.join(
    ROOT,
    "docs",
    "security",
    "322_minimum_disclosure_delivery_evidence_and_ack_generation_rules.md",
  ),
  path.join(ROOT, "data", "analysis", "322_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "322_message_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "322_ack_generation_examples.json"),
  path.join(
    ROOT,
    "services",
    "command-api",
    "migrations",
    "150_phase5_practice_continuity_chain.sql",
  ),
];

const REQUIRED_SCRIPT =
  '"validate:322-practice-continuity-chain": "pnpm exec tsx ./tools/analysis/validate_322_practice_continuity_chain.ts"';

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

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:322-practice-continuity-chain",
  );
}

function validateMigration() {
  const sql = read(
    path.join(ROOT, "services", "command-api", "migrations", "150_phase5_practice_continuity_chain.sql"),
  );
  for (const requiredTable of [
    "phase5_practice_continuity_payload_documents",
    "phase5_practice_continuity_messages",
    "phase5_practice_continuity_dispatch_attempts",
    "phase5_practice_continuity_receipt_checkpoints",
    "phase5_practice_continuity_delivery_evidence",
    "phase5_practice_acknowledgement_records",
    "phase5_practice_visibility_delta_records",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  for (const dependency of [
    "144_phase5_staff_identity_acting_context_visibility.sql",
    "145_phase5_enhanced_access_policy_engine.sql",
    "149_phase5_hub_commit_engine.sql",
  ]) {
    requireCondition(sql.includes(dependency), `MIGRATION_DEPENDENCY_MISSING:${dependency}`);
  }
}

function validateArtifacts() {
  const notes = read(path.join(ROOT, "data", "analysis", "322_external_reference_notes.md"));
  const matrix = read(path.join(ROOT, "data", "analysis", "322_message_state_matrix.csv"));
  const examples = read(path.join(ROOT, "data", "analysis", "322_ack_generation_examples.json"));

  for (const marker of [
    "Message Exchange for Social Care and Health (MESH)",
    "Digital clinical safety assurance",
    "DCB 0129 and DCB 0160",
    "patient digital notification of diagnostic imaging reports",
  ]) {
    requireCondition(notes.includes(marker), `EXTERNAL_REFERENCE_NOTE_MISSING:${marker}`);
  }

  for (const caseId of ["msg_322_001", "msg_322_005", "msg_322_009"]) {
    requireCondition(matrix.includes(caseId), `MESSAGE_STATE_CASE_MISSING:${caseId}`);
  }

  for (const exampleId of [
    "ack_gen_322_001",
    "ack_gen_322_002",
    "ack_gen_322_003",
    "ack_gen_322_004",
  ]) {
    requireCondition(examples.includes(exampleId), `ACK_GENERATION_EXAMPLE_MISSING:${exampleId}`);
  }
}

async function validateRuntimeProof() {
  const harness = await setupPracticeContinuityHarness("322_validator_truth");
  const enqueued = await harness.continuityService.enqueuePracticeContinuityMessage(
    buildEnqueuePracticeContinuityInput(harness),
  );
  requireCondition(enqueued.message?.transportState === "queued", "RUNTIME_ENQUEUE_STATE_INVALID");

  const dispatched = await harness.continuityService.dispatchPracticeContinuityMessage({
    practiceContinuityMessageId: enqueued.message!.practiceContinuityMessageId,
    attemptedAt: atMinute(16),
    sourceRefs: ["tools/analysis/validate_322_practice_continuity_chain.ts"],
  });
  requireCondition(
    dispatched.dispatchAttempt?.dispatchState === "accepted",
    "RUNTIME_DISPATCH_STATE_INVALID",
  );

  const delivered = await harness.continuityService.recordReceiptCheckpoint(
    buildReceiptInput(enqueued.message!.practiceContinuityMessageId, "delivery_downloaded", {
      recordedAt: atMinute(17),
    }),
  );
  requireCondition(
    delivered.truthProjection.practiceVisibilityState === "ack_pending",
    "RUNTIME_DELIVERY_VISIBILITY_INVALID",
  );

  const acknowledged = await harness.continuityService.capturePracticeAcknowledgement(
    await buildAcknowledgementInput(harness, enqueued.message!.practiceContinuityMessageId, {
      recordedAt: atMinute(18),
    }),
  );
  requireCondition(
    acknowledged.truthProjection.practiceVisibilityState === "acknowledged",
    "RUNTIME_ACK_VISIBILITY_INVALID",
  );
  requireCondition(
    acknowledged.hubTransition?.hubCase.status === "booked",
    "RUNTIME_BOOKED_TRANSITION_INVALID",
  );

  const reopenHarness = await setupPracticeContinuityHarness("322_validator_reopen");
  const firstMessage = await reopenHarness.continuityService.enqueuePracticeContinuityMessage(
    buildEnqueuePracticeContinuityInput(reopenHarness),
  );
  await reopenHarness.continuityService.reopenPracticeAcknowledgementDebt(
    buildReopenInput(reopenHarness),
  );
  const reissuedMessage = await reopenHarness.continuityService.enqueuePracticeContinuityMessage(
    buildEnqueuePracticeContinuityInput(reopenHarness, {
      recordedAt: atMinute(20),
    }),
  );
  requireCondition(
    reissuedMessage.message !== null &&
      reissuedMessage.message.practiceContinuityMessageId !==
        firstMessage.message!.practiceContinuityMessageId,
    "RUNTIME_REISSUE_MESSAGE_EXPECTED",
  );
  let staleGenerationRejected = false;
  try {
    await reopenHarness.continuityService.capturePracticeAcknowledgement(
      await buildAcknowledgementInput(
        reopenHarness,
        reissuedMessage.message!.practiceContinuityMessageId,
        {
          recordedAt: atMinute(21),
          presentedAckGeneration: firstMessage.message!.ackGeneration,
        },
      ),
    );
  } catch (error) {
    staleGenerationRejected =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "PRACTICE_ACK_GENERATION_STALE";
  }
  requireCondition(staleGenerationRejected, "RUNTIME_STALE_GENERATION_NOT_REJECTED");
}

async function main() {
  validateFiles();
  validatePackageScript();
  validateMigration();
  validateArtifacts();
  await validateRuntimeProof();
  console.log("322 practice continuity chain validation passed");
}

await main();
