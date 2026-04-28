import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildEnqueuePracticeContinuityInput,
  setupPracticeContinuityHarness,
} from "./322_practice_continuity.helpers.ts";

const ROOT = "/Users/test/Code/V";

describe("322 practice continuity replay and migration artifacts", () => {
  it("appends retry attempts onto one governed message chain", async () => {
    const harness = await setupPracticeContinuityHarness("322_retry");
    const enqueued = await harness.continuityService.enqueuePracticeContinuityMessage(
      buildEnqueuePracticeContinuityInput(harness),
    );

    await harness.continuityService.dispatchPracticeContinuityMessage({
      practiceContinuityMessageId: enqueued.message!.practiceContinuityMessageId,
      attemptedAt: atMinute(16),
      sourceRefs: ["tests/integration/322_practice_continuity_replay_and_migration.spec.ts"],
    });
    await harness.continuityService.dispatchPracticeContinuityMessage({
      practiceContinuityMessageId: enqueued.message!.practiceContinuityMessageId,
      attemptedAt: atMinute(17),
      sourceRefs: ["tests/integration/322_practice_continuity_replay_and_migration.spec.ts"],
    });

    const messages = await harness.repositories.listMessagesForCase(
      enqueued.message!.hubCoordinationCaseId,
    );
    const attempts = await harness.repositories.listDispatchAttemptsForMessage(
      enqueued.message!.practiceContinuityMessageId,
    );

    expect(messages).toHaveLength(1);
    expect(attempts).toHaveLength(2);
    expect(attempts.map((row) => row.toSnapshot().attemptNumber)).toEqual([1, 2]);
  });

  it("publishes the 322 migration and review artifacts", () => {
    const migration = fs.readFileSync(
      path.join(ROOT, "services", "command-api", "migrations", "150_phase5_practice_continuity_chain.sql"),
      "utf8",
    );
    const architectureDoc = fs.readFileSync(
      path.join(ROOT, "docs", "architecture", "322_practice_continuity_message_and_acknowledgement_chain.md"),
      "utf8",
    );

    expect(migration).toContain("phase5_practice_continuity_messages");
    expect(migration).toContain("phase5_practice_acknowledgement_records");
    expect(migration).toContain("phase5_practice_visibility_delta_records");
    expect(architectureDoc).toContain("PracticeContinuityMessage");
    expect(architectureDoc).toContain("generation-bound acknowledgement");
  });
});
