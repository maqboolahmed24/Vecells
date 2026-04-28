#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createIntakeSubmitApplication } from "../../services/command-api/src/intake-submit.ts";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..", "..");
const RESULTS_PATH = path.join(ROOT, "data", "performance", "168_suite_results.json");

export const phase1BurstRunnerTool =
  "custom Node/tsx exact-once runner against createIntakeSubmitApplication; equally appropriate to k6/Locust/Artillery because it preserves domain transaction and side-effect repositories in-process";

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runtimeContext(overrides = {}) {
  return {
    routeFamilyRef: "rf_intake_self_service",
    actionScope: "envelope_resume",
    lineageScope: "envelope",
    routeIntentBindingRef: "RIB_148_SUBMIT_V1",
    routeIntentBindingState: "live",
    audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
    releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
    channelReleaseFreezeState: "monitoring",
    manifestVersionRef: "manifest_phase1_browser_v1",
    sessionEpochRef: "session_epoch_browser_v1",
    ...overrides,
  };
}

function runtimeContextFromLease(lease, overrides = {}) {
  const snapshot = lease.toSnapshot();
  return runtimeContext({
    routeFamilyRef: snapshot.routeFamilyRef,
    routeIntentBindingRef: snapshot.routeIntentBindingRef,
    audienceSurfaceRuntimeBindingRef: snapshot.audienceSurfaceRuntimeBindingRef,
    releaseApprovalFreezeRef: snapshot.releaseApprovalFreezeRef,
    channelReleaseFreezeState: snapshot.channelReleaseFreezeState,
    manifestVersionRef: snapshot.manifestVersionRef,
    sessionEpochRef: snapshot.sessionEpochRef,
    subjectBindingVersionRef: snapshot.subjectBindingVersionRef,
    subjectRef: snapshot.subjectRef,
    ...overrides,
  });
}

async function buildReadyDraft(application, suffix, overrides = {}) {
  const created = await application.drafts.createDraft({
    requestType: overrides.requestType ?? "Symptoms",
    surfaceChannelProfile: "browser",
    routeEntryRef: "phase1_intake_entry",
    createdAt: overrides.createdAt ?? "2026-04-15T08:00:00Z",
    sessionEpochRef: "session_epoch_browser_v1",
  });

  const structuredAnswers = {
    "symptoms.category": "general",
    "symptoms.onsetPrecision": "exact_date",
    "symptoms.onsetDate": "2026-04-10",
    "symptoms.worseningNow": false,
    "symptoms.severityClues": ["sleep_affected"],
    "symptoms.narrative": `Burst resilience fixture ${suffix} stays routine and valid.`,
    ...overrides.structuredAnswers,
  };

  await application.drafts.patchDraft(
    created.view.draftPublicId,
    {
      draftVersion: created.view.draftVersion,
      clientCommandId: `cmd_patch_168_${suffix}`,
      idempotencyKey: `idem_patch_168_${suffix}`,
      leaseId: created.lease.leaseId,
      resumeToken: created.view.resumeToken,
      structuredAnswers,
      freeTextNarrative: `Burst resilience fixture ${suffix} stays routine and valid.`,
      currentStepKey: "review_submit",
      completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
      currentPathname: `/intake/drafts/${created.view.draftPublicId}/review-submit`,
      shellContinuityKey: "patient.portal.requests",
      selectedAnchorKey: "request-proof",
      recordedAt: overrides.patchedAt ?? "2026-04-15T08:01:00Z",
    },
    runtimeContextFromLease(created.lease),
  );

  await application.contactPreferenceApp.captureContactPreferences({
    draftPublicId: created.view.draftPublicId,
    preferredChannel: "sms",
    destinations: {
      sms: "+44 7700 900123",
      phone: "+44 7700 900456",
      email: "patient@example.com",
    },
    contactWindow: "weekday_daytime",
    voicemailAllowed: true,
    followUpPermission: true,
    quietHours: {
      startLocalTime: "20:00",
      endLocalTime: "08:00",
      timezone: "Europe/London",
    },
    languagePreference: "en",
    translationRequired: false,
    accessibilityNeeds: ["large_text"],
    sourceEvidenceRef: `draft_patch::contact_pref_168_${suffix}`,
    clientCommandId: `cmd_contact_pref_168_${suffix}`,
    idempotencyKey: `idem_contact_pref_168_${suffix}`,
    recordedAt: overrides.contactAt ?? "2026-04-15T08:02:00Z",
  });

  application.validation.seedUrgentDecisionState(created.view.draftPublicId, "clear");
  application.validation.seedConvergenceState(created.view.draftPublicId, "valid");

  return created;
}

async function currentSubmitCommand(application, draftPublicId, suffix, overrides = {}) {
  const projection =
    await application.repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
  const snapshot = projection.toSnapshot();
  return {
    draftPublicId,
    draftVersion: snapshot.authoritativeDraftVersion,
    leaseId: snapshot.activeLeaseRef,
    resumeToken: snapshot.resumeToken,
    clientCommandId: `cmd_submit_168_${suffix}`,
    idempotencyKey: `idem_submit_168_${suffix}`,
    sourceCommandId: `source_submit_168_${suffix}`,
    transportCorrelationId: `transport_submit_168_${suffix}`,
    intentGeneration: 1,
    observedAt: "2026-04-15T08:03:00Z",
    ...overrides,
  };
}

async function countSideEffects(application) {
  const requests = await application.repositories.listRequests();
  const requestRefs = requests.map((request) => request.toSnapshot().requestId);
  const safetyRows = (
    await Promise.all(
      requestRefs.map((requestRef) =>
        application.synchronousSafety.repositories.listSafetyDecisionRecordsByRequest(requestRef),
      ),
    )
  ).flat();
  return {
    requests: requests.length,
    promotionRecords: (await application.repositories.listSubmissionPromotionRecords()).length,
    submitSettlements: (await application.transactionRepositories.listIntakeSubmitSettlements())
      .length,
    snapshotFreezes: (await application.transactionRepositories.listSubmissionSnapshotFreezes())
      .length,
    normalizationSeeds: (await application.transactionRepositories.listSubmitNormalizationSeeds())
      .length,
    safetyDecisions: safetyRows.length,
    triageTasks: (await application.triage.repositories.listTriageTasks()).length,
    communicationEnvelopes: (
      await application.confirmationDispatch.communicationRepositories.listCommunicationEnvelopes()
    ).length,
    receiptBridges: (
      await application.confirmationDispatch.communicationRepositories.listReceiptBridges()
    ).length,
  };
}

function diffCounts(after, before) {
  return Object.fromEntries(
    Object.entries(after).map(([key, value]) => [key, value - before[key]]),
  );
}

function duplicateAuthoritativeSideEffects(diff, expected) {
  return [
    ["requests", expected.authoritativeRequests],
    ["promotionRecords", expected.promotionRecords],
    ["triageTasks", expected.triageTasks],
    ["communicationEnvelopes", expected.communicationEnvelopes],
    ["receiptBridges", expected.receiptBridges],
  ].reduce((total, [key, allowed]) => total + Math.max(0, diff[key] - allowed), 0);
}

async function runDistinctSubmitBurst(expected) {
  const application = createIntakeSubmitApplication();
  const drafts = [];
  for (let index = 0; index < expected.drafts; index += 1) {
    drafts.push(await buildReadyDraft(application, `distinct_${index}`));
  }

  const commands = [];
  for (let index = 0; index < drafts.length; index += 1) {
    commands.push(
      await currentSubmitCommand(
        application,
        drafts[index].view.draftPublicId,
        `distinct_${index}`,
      ),
    );
  }

  const before = await countSideEffects(application);
  const startedAt = performance.now();
  const submissions = await Promise.all(
    commands.map((command) => application.submitDraft(command)),
  );
  const durationMs = Math.round(performance.now() - startedAt);
  const after = await countSideEffects(application);
  const diff = diffCounts(after, before);
  const requestRefs = new Set(submissions.map((submission) => submission.requestRef));

  assertCondition(
    requestRefs.size === expected.authoritativeRequests,
    "distinct burst lost requests",
  );
  assertCondition(
    submissions.every((submission) => submission.decisionClass === "new_lineage"),
    "distinct burst must create new lineages",
  );
  assertCondition(
    duplicateAuthoritativeSideEffects(diff, expected) === 0,
    `distinct burst produced duplicate authoritative side effects: ${JSON.stringify(diff)}`,
  );

  return {
    id: "distinctSubmitBurst",
    durationMs,
    decisions: submissions.map((submission) => submission.decisionClass),
    diff,
    duplicateAuthoritativeSideEffects: duplicateAuthoritativeSideEffects(diff, expected),
  };
}

async function runSameDraftReplayStorm(expected) {
  const application = createIntakeSubmitApplication();
  const draft = await buildReadyDraft(application, "replay_storm");
  const command = await currentSubmitCommand(application, draft.view.draftPublicId, "replay_storm");
  const before = await countSideEffects(application);
  const startedAt = performance.now();
  const submissions = await Promise.all(
    Array.from({ length: expected.attempts }, (_, index) =>
      application.submitDraft({
        ...command,
        observedAt: `2026-04-15T08:03:${String(index).padStart(2, "0")}Z`,
      }),
    ),
  );
  const durationMs = Math.round(performance.now() - startedAt);
  const after = await countSideEffects(application);
  const diff = diffCounts(after, before);
  const decisions = submissions.map((submission) => submission.decisionClass).sort();
  const requestRefs = new Set(submissions.map((submission) => submission.requestRef));

  assertCondition(requestRefs.size === 1, "replay storm returned multiple request refs");
  for (const required of expected.requiredDecisionClasses) {
    assertCondition(decisions.includes(required), `replay storm missing ${required}`);
  }
  assertCondition(
    duplicateAuthoritativeSideEffects(diff, expected) === 0,
    `replay storm produced duplicate authoritative side effects: ${JSON.stringify(diff)}`,
  );

  return {
    id: "sameDraftReplayStorm",
    durationMs,
    decisions,
    diff,
    requestRefs: Array.from(requestRefs),
    duplicateAuthoritativeSideEffects: duplicateAuthoritativeSideEffects(diff, expected),
  };
}

function assertFixtureInvariants(results) {
  assertCondition(
    results.globalInvariants.duplicateAuthoritativeSideEffectsAllowed === false,
    "suite must reject duplicate authoritative side effects",
  );
  assertCondition(
    results.globalInvariants.calmWritableDuringDegradationAllowed === false,
    "suite must reject calm writable degraded browser posture",
  );
  assertCondition(
    results.globalInvariants.proseOnlyBudgetsAllowed === false,
    "suite must reject prose-only budgets",
  );
  assertCondition(
    results.serviceRunnerExpected.notificationProviderDelay.prematureReassurance === false,
    "notification delay must not become premature reassurance",
  );
}

export async function runPhase1BurstResilienceSuite() {
  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
  assertFixtureInvariants(results);
  const distinctSubmitBurst = await runDistinctSubmitBurst(
    results.serviceRunnerExpected.distinctSubmitBurst,
  );
  const sameDraftReplayStorm = await runSameDraftReplayStorm(
    results.serviceRunnerExpected.sameDraftReplayStorm,
  );
  return {
    suiteId: results.suiteId,
    tool: phase1BurstRunnerTool,
    generatedAt: new Date().toISOString(),
    scenarios: [distinctSubmitBurst, sameDraftReplayStorm],
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase1BurstResilienceSuite()
    .then((summary) => {
      if (process.argv.includes("--json")) {
        process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
      } else {
        for (const scenario of summary.scenarios) {
          process.stdout.write(
            `${scenario.id}: ${scenario.durationMs}ms, duplicates=${scenario.duplicateAuthoritativeSideEffects}, diff=${JSON.stringify(
              scenario.diff,
            )}\n`,
          );
        }
      }
    })
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
