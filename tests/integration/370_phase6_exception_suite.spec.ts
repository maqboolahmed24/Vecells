import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  transitionSandboxRequestState,
  verifyUpdateRecordAndTransportSandboxReadiness,
} from "../../scripts/pharmacy/367_update_record_transport_sandbox_lib.ts";
import { seed350FrozenPackageCase, submit350Dispatch } from "./350_pharmacy_dispatch.helpers.ts";
import {
  create353BounceBackHarness,
  ingest353BounceBack,
  reopen353FromBounceBack,
  resolve353SupervisorReview,
  seed353BounceBackReadyCase,
} from "./353_pharmacy_bounce_back.helpers.ts";
import {
  create354OperationsHarness,
  force354DiscoveryUnavailable,
  seed354BounceBackCase,
  seed354DispatchFailureCase,
  seed354WaitingChoiceCase,
  seed354WaitingOutcomeCase,
} from "./354_pharmacy_operations.helpers.ts";

describe("370 phase6 bounce-back urgent-return and exception suite", () => {
  it("proves routine reopen, urgent duty-task return, loop prevention, and supervisor recovery", async () => {
    const routineHarness = create353BounceBackHarness();
    const routineSeed = await seed353BounceBackReadyCase({
      harness: routineHarness,
      seed: "370_routine_reopen",
    });
    const routine = await ingest353BounceBack({
      harness: routineHarness,
      pharmacyCaseId: routineSeed.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        routineSeed.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: routineSeed.patientContactRouteRef,
      explicitBounceBackType: "routine_gp_return",
      recordedAt: "2026-04-23T19:11:00.000Z",
      emitPatientNotification: true,
    });

    expect(routine.pharmacyCase.status).toBe("unresolved_returned");
    expect(routine.bounceBackRecord.bounceBackType).toBe("routine_gp_return");
    expect(routine.bounceBackTruthProjection.reacquisitionMode).toBe("original_request");
    expect(routine.bounceBackTruthProjection.patientNotificationState).toBe("emitted");

    const reopened = await reopen353FromBounceBack({
      harness: routineHarness,
      pharmacyCaseId: routineSeed.currentCase.pharmacyCaseId,
      bounceBackRecordId: routine.bounceBackRecord.bounceBackRecordId,
      patientShellConsistencyProjectionId:
        routineSeed.shellProjection.patientShellConsistencyProjectionId,
      reopenToStatus: "candidate_received",
      recordedAt: "2026-04-23T19:16:00.000Z",
    });
    expect(reopened.result.pharmacyCase.status).toBe("candidate_received");
    expect(reopened.triageReentryState).toBe("triage_active");

    const urgentHarness = create353BounceBackHarness();
    const urgentSeed = await seed353BounceBackReadyCase({
      harness: urgentHarness,
      seed: "370_urgent_return",
      routeKind: "voice",
    });
    const urgent = await ingest353BounceBack({
      harness: urgentHarness,
      pharmacyCaseId: urgentSeed.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        urgentSeed.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: urgentSeed.patientContactRouteRef,
      explicitBounceBackType: "urgent_gp_return",
      sourceKind: "update_record_observation",
      recordedAt: "2026-04-23T19:12:00.000Z",
      outstandingClinicalWorkRequired: true,
      emitPatientNotification: true,
    });
    expect(urgent.pharmacyCase.status).toBe("urgent_bounce_back");
    expect(urgent.bounceBackRecord.directUrgentRouteRef?.refId).toBeTruthy();
    expect(urgent.bounceBackTruthProjection.reacquisitionMode).toBe("duty_task");
    expect(urgent.bounceBackTruthProjection.reopenPriorityBand).toBe(3);
    expect(urgent.practiceVisibilityProjection.urgentReturnState).toBe("urgent_return_active");
    expect(urgent.patientStatusProjection.currentMacroState).toBe("urgent_action");

    const loopHarness = create353BounceBackHarness();
    const loopSeed = await seed353BounceBackReadyCase({
      harness: loopHarness,
      seed: "370_loop_prevention",
    });
    const firstLoop = await ingest353BounceBack({
      harness: loopHarness,
      pharmacyCaseId: loopSeed.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        loopSeed.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: loopSeed.patientContactRouteRef,
      explicitBounceBackType: "routine_gp_return",
      recordedAt: "2026-04-23T19:10:00.000Z",
      deltaClinical: 0,
      deltaContact: 0,
      deltaProvider: 0,
      deltaConsent: 0,
      deltaTiming: 0,
      emitPatientNotification: false,
    });
    const secondLoop = await ingest353BounceBack({
      harness: loopHarness,
      pharmacyCaseId: loopSeed.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        loopSeed.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: loopSeed.patientContactRouteRef,
      explicitBounceBackType: "routine_gp_return",
      recordedAt: "2026-04-23T19:11:00.000Z",
      deltaClinical: 0,
      deltaContact: 0,
      deltaProvider: 0,
      deltaConsent: 0,
      deltaTiming: 0,
      emitPatientNotification: false,
    });
    expect(firstLoop.bounceBackRecord.supervisorReviewState).toBe("not_required");
    expect(secondLoop.bounceBackRecord.supervisorReviewState).toBe("required");
    expect(secondLoop.bounceBackTruthProjection.autoRedispatchBlocked).toBe(true);
    await expect(
      reopen353FromBounceBack({
        harness: loopHarness,
        pharmacyCaseId: loopSeed.currentCase.pharmacyCaseId,
        bounceBackRecordId: secondLoop.bounceBackRecord.bounceBackRecordId,
        patientShellConsistencyProjectionId:
          loopSeed.shellProjection.patientShellConsistencyProjectionId,
        reopenToStatus: "candidate_received",
      }),
    ).rejects.toMatchObject({ code: "SUPERVISOR_REVIEW_REQUIRED" });

    const resolved = await resolve353SupervisorReview({
      harness: loopHarness,
      pharmacyCaseId: loopSeed.currentCase.pharmacyCaseId,
      bounceBackRecordId: secondLoop.bounceBackRecord.bounceBackRecordId,
      resolution: "dismiss_as_material_change",
      recordedAt: "2026-04-23T19:13:00.000Z",
    });
    expect(resolved.bounceBackRecord.supervisorReviewState).toBe("resolved");
    expect(resolved.bounceBackTruthProjection.autoRedispatchBlocked).toBe(false);
  });

  it("proves direct-channel safety net boundaries and forbids urgent return over Update Record", async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-370-readiness-"));

    const updateRecord = await transitionSandboxRequestState({
      requestId: "update_record_367_integration_pairing",
      action: "submit_request",
      outputDir,
    });
    const safetyNet = await transitionSandboxRequestState({
      requestId: "transport_367_nhsmail_deployment_safetynet",
      action: "submit_request",
      outputDir,
    });
    const summary = await verifyUpdateRecordAndTransportSandboxReadiness(outputDir);

    expect(updateRecord.action).toBe("manual_stop_required");
    expect(["manual_stop_required", "submitted"]).toContain(safetyNet.action);
    expect(
      summary.updateRecordChecks.find(
        (entry) => entry.requestId === "update_record_367_integration_pairing",
      )?.decisionClasses,
    ).toContain("urgent_return_forbidden");
    expect(
      summary.transportChecks.find(
        (entry) => entry.requestId === "transport_367_nhsmail_deployment_safetynet",
      )?.decisionClasses,
    ).toContain("purpose:urgent_return_safety_net");
  });

  it("proves practice visibility, exception classes, provider health deltas, and outage-safe worklists", async () => {
    const harness = create354OperationsHarness();

    const ackFrozen = await seed350FrozenPackageCase({
      harness,
      seed: "370_ack_missing",
    });
    await submit350Dispatch({
      harness,
      frozenState: ackFrozen,
      sourceCommandId: "370_ack_missing_submit",
      recordedAt: "2026-04-23T14:20:00.000Z",
    });
    const ackWorklist = await harness.operationsService.queryService.fetchDispatchExceptionWorklist(
      {
        recordedAt: "2026-04-23T14:25:00.000Z",
      },
    );
    expect(ackWorklist.rows[0]?.activeExceptionClasses).toContain("acknowledgement_missing");

    const waitingChoice = await seed354WaitingChoiceCase({
      harness,
      seed: "370_discovery_unavailable",
    });
    await force354DiscoveryUnavailable({
      harness,
      pharmacyCaseId: waitingChoice.pharmacyCaseId,
    });
    await seed354WaitingOutcomeCase({
      harness,
      seed: "370_no_outcome_window",
    });
    await seed354DispatchFailureCase({
      harness,
      seed: "370_dispatch_failed",
    });
    const bounceBack = await seed354BounceBackCase({
      harness,
      seed: "370_reachability_repair",
    });

    const summaries =
      await harness.operationsService.queryService.fetchQueueCountsAndAgeingSummaries({
        recordedAt: "2026-04-24T19:30:00.000Z",
      });
    expect(
      summaries.find((row) => row.worklistFamily === "pharmacy_active_cases_projection")
        ?.totalCount,
    ).toBeGreaterThanOrEqual(4);
    expect(
      summaries.find((row) => row.worklistFamily === "pharmacy_waiting_for_choice_projection")
        ?.totalCount,
    ).toBeGreaterThanOrEqual(1);
    expect(
      summaries.find(
        (row) => row.worklistFamily === "pharmacy_dispatched_waiting_outcome_projection",
      )?.totalCount,
    ).toBeGreaterThanOrEqual(1);
    expect(
      summaries.find((row) => row.worklistFamily === "pharmacy_bounce_back_projection")?.totalCount,
    ).toBeGreaterThanOrEqual(1);

    const exceptionWorklist =
      await harness.operationsService.queryService.fetchDispatchExceptionWorklist({
        recordedAt: "2026-04-24T19:30:00.000Z",
      });
    const allExceptionClasses = new Set(
      exceptionWorklist.rows.flatMap((row) => row.activeExceptionClasses),
    );
    expect([...allExceptionClasses]).toEqual(
      expect.arrayContaining([
        "discovery_unavailable",
        "no_eligible_providers_returned",
        "dispatch_failed",
        "dispatch_proof_stale",
        "no_outcome_within_configured_window",
        "reachability_repair_required",
      ]),
    );

    const bounceBackVisibility =
      await harness.operationsService.queryService.fetchPracticeVisibilityModel(
        bounceBack.pharmacyCaseId,
        {
          recordedAt: "2026-04-24T19:30:00.000Z",
        },
      );
    expect(bounceBackVisibility?.reachabilityRepairState).not.toBeNull();
    expect(bounceBackVisibility?.activeExceptionClasses).toContain("reachability_repair_required");
    expect(bounceBackVisibility?.minimumNecessaryRefs.dispatchTruthProjectionRef).toBeTruthy();
    expect(bounceBackVisibility?.currentCloseBlockerRefs.length).toBeGreaterThan(0);

    const initialHealth = await harness.operationsService.queryService.fetchProviderHealthSummary({
      recordedAt: "2026-04-24T19:30:00.000Z",
    });
    const seenRows = initialHealth.rows.map((row) => ({
      projectionId: row.pharmacyProviderHealthProjectionId,
      version: row.version,
    }));
    const secondChoice = await seed354WaitingChoiceCase({
      harness,
      seed: "370_provider_delta",
    });
    await force354DiscoveryUnavailable({
      harness,
      pharmacyCaseId: secondChoice.pharmacyCaseId,
    });
    const changedDelta = await harness.operationsService.queryService.fetchChangedSinceSeenDeltas({
      recordedAt: "2026-04-24T20:00:00.000Z",
      worklistFamily: "pharmacy_provider_health_projection",
      seenRows,
    });
    expect(changedDelta.addedCount + changedDelta.changedCount).toBeGreaterThan(0);

    const providerDetail = await harness.operationsService.queryService.fetchProviderHealthDetail(
      "A10001",
      {
        recordedAt: "2026-04-24T20:00:00.000Z",
      },
    );
    expect(providerDetail?.projection.severity).toMatch(/warning|urgent|critical/);
    expect(providerDetail?.projection.activeCaseCount).toBeGreaterThan(0);
  });
});
