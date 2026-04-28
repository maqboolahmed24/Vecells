import { describe, expect, it } from "vitest";
import {
  buildSummaryChips,
  defaultIntakeMissionFrameMemory,
  formatPatientIntakeMissionPath,
  parsePatientIntakeMissionLocation,
  requestPublicIdForDraft,
  resolveMissionFrameView,
  selectedAnchorForRoute,
  synchronizeMissionFrameSnapshot,
  createInitialMissionFrameSnapshot,
} from "./patient-intake-mission-frame.model";

describe("patient intake mission frame model", () => {
  it("parses the required /start-request alias routes into the intake route family", () => {
    const location = parsePatientIntakeMissionLocation("/start-request/dft_7k49m2v8pq41/details");

    expect(location.routeFamilyRef).toBe("rf_intake_self_service");
    expect(location.routeKey).toBe("details");
    expect(location.stepKey).toBe("details");
    expect(location.continuityKey).toBe("patient.portal.requests");
  });

  it("keeps the seq_139 contract aliases available alongside the start-request path", () => {
    const location = parsePatientIntakeMissionLocation("/intake/requests/req_qc_2049/receipt");

    expect(location.aliasSource).toBe("seq_139_contract");
    expect(location.routeKey).toBe("receipt_outcome");
    expect(formatPatientIntakeMissionPath(location)).toBe("/intake/requests/req_qc_2049/receipt");
  });

  it("uses the route-aware selected anchor policy for start, proof, and return anchors", () => {
    expect(selectedAnchorForRoute("request_type")).toBe("request-start");
    expect(selectedAnchorForRoute("details")).toBe("request-proof");
    expect(selectedAnchorForRoute("receipt_outcome")).toBe("request-return");
  });

  it("keeps the same route family while the selected anchor changes with the step", () => {
    const requestType = parsePatientIntakeMissionLocation(
      "/start-request/dft_7k49m2v8pq41/request-type",
    );
    const details = parsePatientIntakeMissionLocation("/start-request/dft_7k49m2v8pq41/details");
    const snapshot = synchronizeMissionFrameSnapshot(
      createInitialMissionFrameSnapshot(requestType),
      details,
    );

    expect(snapshot.activeRouteFamilyRef).toBe("rf_intake_self_service");
    expect(snapshot.selectedAnchor.anchorKey).toBe("request-proof");
  });

  it("derives the seeded request public id from the same draft lineage for placeholder outcomes", () => {
    expect(requestPublicIdForDraft("dft_7k49m2v8pq41")).toBe("req_qc_2049");
  });

  it("keeps the summary chip masked even when raw contact routes exist in the draft memory", () => {
    const memory = defaultIntakeMissionFrameMemory();
    const chip = buildSummaryChips({
      ...memory,
      contactPreferences: {
        ...memory.contactPreferences,
        preferredChannel: "email",
        destinations: {
          ...memory.contactPreferences.destinations,
          email: "masked.summary@example.test",
        },
      },
    }).find((entry) => entry.label === "Contact");

    expect(chip?.value).toContain("@");
    expect(chip?.value).not.toContain("masked.summary@example.test");
  });

  it("exposes urgent-required view state without collapsing it into urgent-diverted", () => {
    const memory = defaultIntakeMissionFrameMemory();
    const view = resolveMissionFrameView({
      location: parsePatientIntakeMissionLocation(
        "/start-request/dft_7k49m2v8pq41/urgent-guidance",
      ),
      memory,
    });

    expect(view.urgentSurface?.variant).toBe("urgent_required_pending");
    expect(view.urgentSurface?.requestSafetyState).toBe("urgent_diversion_required");
    expect(view.urgentSurface?.urgentDiversionSettlementState).toBe("pending");
  });

  it("builds a routine receipt surface from the canonical consistency envelope shape", () => {
    const memory = defaultIntakeMissionFrameMemory();
    const view = resolveMissionFrameView({
      location: parsePatientIntakeMissionLocation("/start-request/dft_7k49m2v8pq41/receipt"),
      memory,
    });

    expect(view.receiptSurface?.contractId).toBe("PHASE1_SAME_SHELL_RECEIPT_SURFACE_V1");
    expect(view.receiptSurface?.receiptBucket).toBe("within_2_working_days");
    expect(view.receiptSurface?.promiseState).toBe("on_track");
    expect(view.receiptSurface?.trackRequestAction.targetPathname).toBe(
      "/intake/requests/req_qc_2049/status",
    );
  });

  it("builds a minimal request-status surface from the same receipt consistency envelope", () => {
    const memory = defaultIntakeMissionFrameMemory();
    const view = resolveMissionFrameView({
      location: parsePatientIntakeMissionLocation("/intake/requests/req_qc_2049/status"),
      memory,
    });

    expect(view.requestStatusSurface?.contractId).toBe("PHASE1_MINIMAL_TRACK_REQUEST_SURFACE_V1");
    expect(view.requestStatusSurface?.receiptConsistencyKey).toBe(
      "receipt_consistency::req_qc_2049",
    );
    expect(view.requestStatusSurface?.statusConsistencyKey).toBe(
      "status_consistency::req_qc_2049",
    );
    expect(view.requestStatusSurface?.returnLink?.targetPathname).toBe(
      "/intake/requests/req_qc_2049/receipt",
    );
  });

  it("preserves same-shell sign-in uplift without exposing summary chips early", () => {
    const memory = {
      ...defaultIntakeMissionFrameMemory(),
      accessSimulation: { scenarioId: "sign_in_uplift_pending" as const },
    };
    const view = resolveMissionFrameView({
      location: parsePatientIntakeMissionLocation("/start-request/dft_7k49m2v8pq41/details"),
      memory,
    });

    expect(view.accessPosture?.postureKind).toBe("uplift_pending");
    expect(view.accessPosture?.summaryVisibility).toBe("hidden");
    expect(view.summaryChips).toHaveLength(0);
    expect(view.draftView?.identityContext.claimResumeState).toBe("pending");
  });

  it("masks the last-safe summary when auth return narrows to read-only", () => {
    const memory = {
      ...defaultIntakeMissionFrameMemory(),
      contactPreferences: {
        ...defaultIntakeMissionFrameMemory().contactPreferences,
        preferredChannel: "email" as const,
        destinations: {
          ...defaultIntakeMissionFrameMemory().contactPreferences.destinations,
          email: "patient.readonly@example.test",
        },
      },
      accessSimulation: { scenarioId: "auth_return_read_only" as const },
    };
    const view = resolveMissionFrameView({
      location: parsePatientIntakeMissionLocation("/start-request/dft_7k49m2v8pq41/contact"),
      memory,
    });

    expect(view.accessPosture?.postureKind).toBe("read_only_return");
    expect(view.summaryChips.some((chip) => chip.value.includes("patient.readonly@example.test"))).toBe(false);
    expect(view.draftView?.channelCapabilityCeiling.mutatingResumeState).toBe("read_only");
  });

  it("maps stale draft presentation to the authoritative receipt route instead of mutable draft editing", () => {
    const memory = {
      ...defaultIntakeMissionFrameMemory(),
      accessSimulation: { scenarioId: "stale_draft_promoted" as const },
    };
    const view = resolveMissionFrameView({
      location: parsePatientIntakeMissionLocation("/start-request/dft_7k49m2v8pq41/review"),
      memory,
    });

    expect(view.accessPosture?.postureKind).toBe("stale_draft_mapped_to_request");
    expect(view.accessPosture?.autoMapTargetPathname).toBe("/start-request/dft_7k49m2v8pq41/receipt");
  });

  it("treats embedded drift as a same-shell recovery posture instead of resetting the request", () => {
    const memory = {
      ...defaultIntakeMissionFrameMemory(),
      accessSimulation: { scenarioId: "embedded_drift_recovery" as const },
    };
    const view = resolveMissionFrameView({
      location: parsePatientIntakeMissionLocation("/start-request/dft_7k49m2v8pq41/details"),
      memory,
    });

    expect(view.accessPosture?.postureKind).toBe("embedded_drift");
    expect(view.accessPosture?.primaryAction.targetPathname).toBe(
      "/start-request/dft_7k49m2v8pq41/details",
    );
    expect(view.draftView?.channelCapabilityCeiling.mutatingResumeState).toBe("embedded_recovery");
  });
});
