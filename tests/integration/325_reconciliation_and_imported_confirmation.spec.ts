import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildImportedCorrelationInput,
  setupReconciliationIntegrityHarness,
} from "./325_hub_background_integrity.helpers.ts";

describe("325 reconciliation and imported confirmation", () => {
  it("resolves a reconciliation-required native attempt through imported evidence without leaving two live attempts", async () => {
    const harness = await setupReconciliationIntegrityHarness("325_reconcile_accept");
    const claimed = await harness.integrityService.claimReconciliationAttempt({
      commitAttemptId: harness.reconciliationResult.commitAttempt.commitAttemptId,
      workerRef: "reconciler",
      workerRunRef: "reconciler_run_1",
      claimedAt: atMinute(25),
    });

    const resolved = await harness.integrityService.resolveReconciliationAttempt({
      commitAttemptId: harness.reconciliationResult.commitAttempt.commitAttemptId,
      workerRef: "reconciler",
      workerRunRef: "reconciler_run_1",
      recordedAt: atMinute(30),
      resolutionKind: "confirmed_from_imported_evidence",
      importedCorrelation: await buildImportedCorrelationInput(harness, {
        recordedAt: atMinute(30),
      }),
    });

    expect(claimed.workLease?.leaseState).toBe("active");
    expect(resolved.workLease.leaseState).toBe("completed");
    expect(resolved.workLease.outcomeState).toBe("resolved");
    expect(resolved.correlation?.correlationState).toBe("accepted");
    expect(resolved.resultingCommitState.appointment?.appointmentState).toBe(
      "confirmed_pending_practice_ack",
    );
    expect(resolved.resultingCommitState.truthProjection?.confirmationTruthState).toBe(
      "confirmed_pending_practice_ack",
    );

    const allAttempts = (
      await harness.commitRepositories.listCommitAttemptsForCase(
        harness.reconciliationResult.commitAttempt.hubCoordinationCaseId,
      )
    ).map((document) => document.toSnapshot());
    expect(allAttempts.filter((attempt) => attempt.attemptState === "reconciliation_required")).toHaveLength(0);
    expect(allAttempts.filter((attempt) => attempt.commitMode === "imported_confirmation")).toHaveLength(1);
  });

  it("keeps imported confirmation as auditable evidence only when the provider binding hash drifts", async () => {
    const harness = await setupReconciliationIntegrityHarness("325_reconcile_binding");
    const wrongBinding = {
      ...harness.providerAdapterBinding,
      sourceIdentity: `${harness.providerAdapterBinding.sourceIdentity}_drifted`,
    };

    const correlation = await harness.integrityService.correlateImportedConfirmation(
      await buildImportedCorrelationInput(harness, {
        providerAdapterBinding: wrongBinding,
        recordedAt: atMinute(31),
        idempotencyKey: "worker_import_binding_drift",
      }),
    );

    expect(correlation.replayed).toBe(false);
    expect(correlation.commitResult).toBeNull();
    expect(correlation.correlation.correlationState).toBe("evidence_only");
    expect(correlation.correlation.reasonRefs).toContain("provider_binding_mismatch");
    expect(correlation.exception?.exceptionClass).toBe("imported_confirmation_disputed");
    expect(correlation.exceptionWorkItem?.workState).toBe("open");

    const currentState = await harness.commitService.queryCurrentCommitState(
      harness.reconciliationResult.commitAttempt.hubCoordinationCaseId,
    );
    expect(currentState.appointment).toBeNull();
    expect(currentState.truthProjection?.confirmationTruthState).toBe("disputed");
  });
});
