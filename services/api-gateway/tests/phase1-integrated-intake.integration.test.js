import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";

function answersFor(requestType) {
  switch (requestType) {
    case "Meds":
      return {
        "meds.queryType": "repeat_supply",
        "meds.nameKnown": "known",
        "meds.medicineName": "Amoxicillin",
        "meds.issueDescription": "I need help with a repeat supply before it runs out.",
        "meds.urgency": "routine",
      };
    case "Admin":
      return {
        "admin.supportType": "fit_note",
        "admin.deadlineKnown": "deadline_known",
        "admin.deadlineDate": "2026-04-20",
        "admin.referenceAvailable": "available",
        "admin.referenceNumber": "ADM-2049",
        "admin.details": "Please help with the fit note reference.",
      };
    case "Results":
      return {
        "results.context": "blood_test",
        "results.testName": "Full blood count",
        "results.dateKnown": "exact_or_approx",
        "results.resultDate": "2026-04-12",
        "results.question": "Can someone explain what these results mean?",
      };
    default:
      return {
        "symptoms.category": "general",
        "symptoms.onsetPrecision": "exact_date",
        "symptoms.onsetDate": "2026-04-10",
        "symptoms.worseningNow": false,
        "symptoms.severityClues": ["sleep_affected"],
        "symptoms.narrative": "The problem has been getting harder to ignore.",
      };
  }
}

function journeyPayload(draftPublicId, requestType, overrides = {}) {
  return {
    draftPublicId,
    requestType,
    structuredAnswers: answersFor(requestType),
    detailNarrative: `Integrated ${requestType} request from the patient shell.`,
    completedStepKeys: ["request_type", "details", "supporting_files", "contact_preferences", "review_submit"],
    currentStepKey: "review_submit",
    currentPathname: `/start-request/${draftPublicId}/review`,
    contactPreferences: {
      preferredChannel: "sms",
      destinations: {
        sms: "07700 900123",
        phone: "020 7946 0012",
        email: "patient.demo@example.test",
      },
      contactWindow: "weekday_daytime",
      voicemailAllowed: true,
      followUpPermission: "granted",
      quietHours: {
        start: "20:00",
        end: "08:00",
      },
      languagePreference: "English",
      translationRequired: false,
      accessibilityNeeds: ["large_text"],
      sourceEvidenceRef: "phase1_integrated_browser_test",
    },
    observedAt: "2026-04-15T08:30:00.000Z",
    ...overrides,
  };
}

async function post(baseUrl, path, body = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": "phase1-integrated-intake-test",
    },
    body: JSON.stringify(body),
  });
  expect(response.status).toBeLessThan(300);
  return response.json();
}

async function get(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "x-correlation-id": "phase1-integrated-intake-test" },
  });
  expect(response.status).toBe(200);
  return response.json();
}

describe("phase 1 integrated intake gateway seam", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("settles all Phase 1 request types through one route family and shared receipt/status projection", async () => {
    runtime = createRuntime(
      loadConfig({
        VECELLS_ENVIRONMENT: "test",
        API_GATEWAY_SERVICE_PORT: "0",
        API_GATEWAY_ADMIN_PORT: "0",
      }),
    );
    await runtime.start();
    const baseUrl = `http://127.0.0.1:${runtime.ports.service}`;

    const bundle = await get(baseUrl, "/phase1/intake/bundle");
    expect(bundle.contractRef).toBe("PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1");

    const settled = [];
    for (const requestType of ["Symptoms", "Meds", "Admin", "Results"]) {
      const started = await post(baseUrl, "/phase1/intake/start", { requestType });
      const draftPublicId = started.draft.draftPublicId;
      expect(started.routeMetadata.shellContinuityKey).toBe("patient.portal.requests");

      const submitted = await post(
        baseUrl,
        "/phase1/intake/submit",
        journeyPayload(draftPublicId, requestType, {
          clientCommandId: `cmd_164_${requestType}`,
          idempotencyKey: `idem_164_${requestType}`,
        }),
      );
      expect(submitted.routeMetadata.routeFamilyRef).toBe("rf_intake_self_service");
      expect(submitted.decisionClass).toBe("new_lineage");
      expect(submitted.receiptConsistencyEnvelope.promiseState).toBe("on_track");
      expect(submitted.notification.communicationEnvelope.localAckState).toBe("queued");
      expect(submitted.notification.patientCommunicationPosture).not.toBe("delivered");
      settled.push(submitted);
    }

    const first = settled[0];
    const projection = await get(
      baseUrl,
      `/phase1/intake/projection?requestPublicId=${first.requestPublicId}`,
    );
    expect(projection.receiptConsistencyEnvelope.consistencyEnvelopeId).toBe(
      first.receiptConsistencyEnvelope.consistencyEnvelopeId,
    );

    const replay = await post(
      baseUrl,
      "/phase1/intake/submit",
      journeyPayload(first.settlement.draftPublicId, "Symptoms", {
        clientCommandId: "cmd_164_Symptoms",
        idempotencyKey: "idem_164_Symptoms",
        observedAt: "2026-04-15T08:31:00.000Z",
      }),
    );
    expect(replay.replayed).toBe(true);
    expect(replay.requestPublicId).toBe(first.requestPublicId);

    const advanced = await post(baseUrl, "/phase1/intake/notifications/advance", {
      requestPublicId: first.requestPublicId,
      deliveryEvidence: true,
      recordedAt: "2026-04-15T08:32:00.000Z",
      observedAt: "2026-04-15T08:32:00.000Z",
    });
    expect(advanced.notification.patientCommunicationPosture).not.toBe("queued");
    expect(advanced.notification.truthLadder).toContain("accepted");
  });
});
