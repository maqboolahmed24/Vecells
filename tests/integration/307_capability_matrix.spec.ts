import path from "node:path";

import { describe, expect, it } from "vitest";

import { createPhase4BookingCapabilityApplication } from "../../services/command-api/src/phase4-booking-capability.ts";
import { prepareProviderEvidence } from "./307_booking_core.helpers.ts";

function findEvidence(
  rows: Awaited<ReturnType<typeof prepareProviderEvidence>>["registry"]["evidenceRows"],
  matcher: {
    providerCapabilityMatrixRef: string;
    claimRef: "search_slots_support" | "book_slot_support";
  },
) {
  return rows.find(
    (row) =>
      row.providerCapabilityMatrixRef === matcher.providerCapabilityMatrixRef &&
      row.capabilityClaimRef === matcher.claimRef,
  );
}

async function resolveCapability(input: {
  bookingCaseId: string;
  supplierRef: string;
  integrationMode: string;
  deploymentType: string;
  selectionAudience: "patient" | "staff";
  requestedActionScope: "search_slots" | "book_slot";
  gpLinkageStatus?: "linked" | "not_required";
  localConsumerStatus?: "ready" | "not_required";
}) {
  const application = createPhase4BookingCapabilityApplication();
  return application.resolveBookingCaseCapability({
    bookingCaseId: input.bookingCaseId,
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: input.supplierRef,
    integrationMode: input.integrationMode,
    deploymentType: input.deploymentType,
    selectionAudience: input.selectionAudience,
    requestedActionScope: input.requestedActionScope,
    gpLinkageCheckpointRef:
      input.gpLinkageStatus === "linked"
        ? `gp_linkage_checkpoint_${input.bookingCaseId}`
        : null,
    gpLinkageStatus: input.gpLinkageStatus ?? "not_required",
    localConsumerCheckpointRef:
      input.localConsumerStatus === "ready"
        ? `local_consumer_checkpoint_${input.bookingCaseId}`
        : null,
    localConsumerStatus: input.localConsumerStatus ?? "not_required",
    supplierDegradationStatus: "nominal",
    publicationState: "published",
    assuranceTrustState: "writable",
    routeIntentBindingRef: `route_intent_${input.bookingCaseId}`,
    surfaceRouteContractRef: `surface_route_${input.bookingCaseId}`,
    surfacePublicationRef: `surface_publication_${input.bookingCaseId}`,
    runtimePublicationBundleRef: `runtime_publication_${input.bookingCaseId}`,
    governingObjectDescriptorRef: "BookingCase",
    governingObjectRef: input.bookingCaseId,
    governingObjectVersionRef: `${input.bookingCaseId}_v1`,
    parentAnchorRef: `booking_anchor_${input.bookingCaseId}`,
    commandActionRecordRef: `resolve_capability_${input.bookingCaseId}`,
    commandSettlementRecordRef: `resolve_capability_settlement_${input.bookingCaseId}`,
    subjectRef: `${input.selectionAudience}_actor_${input.bookingCaseId}`,
    evaluatedAt: "2026-04-22T12:00:00.000Z",
  });
}

describe("307 phase4 capability matrix", () => {
  it("proves current, review-required, and manual-attested provider rows from evidence capture", async () => {
    const evidence = await prepareProviderEvidence({
      outputDir: path.resolve(process.cwd(), ".artifacts", "provider-evidence", "307-capability"),
      sandboxOutputDir: path.resolve(process.cwd(), ".artifacts", "provider-sandboxes", "307-capability"),
    });
    expect(evidence.validation.valid).toBe(true);
    expect(evidence.capture.automatedSandboxIds.length).toBeGreaterThan(0);

    const rows = evidence.registry.evidenceRows;
    const vecellsSearch = findEvidence(rows, {
      providerCapabilityMatrixRef: "PCM_279_LOCAL_GATEWAY_COMPONENT_V1",
      claimRef: "search_slots_support",
    });
    const vecellsBook = findEvidence(rows, {
      providerCapabilityMatrixRef: "PCM_279_LOCAL_GATEWAY_COMPONENT_V1",
      claimRef: "book_slot_support",
    });
    const tppSearch = findEvidence(rows, {
      providerCapabilityMatrixRef: "PCM_279_TPP_IM1_TRANSACTION_V1",
      claimRef: "search_slots_support",
    });
    const tppBook = findEvidence(rows, {
      providerCapabilityMatrixRef: "PCM_279_TPP_IM1_TRANSACTION_V1",
      claimRef: "book_slot_support",
    });
    const manualSearch = findEvidence(rows, {
      providerCapabilityMatrixRef: "PCM_279_MANUAL_ASSIST_ONLY_V1",
      claimRef: "search_slots_support",
    });
    const manualBook = findEvidence(rows, {
      providerCapabilityMatrixRef: "PCM_279_MANUAL_ASSIST_ONLY_V1",
      claimRef: "book_slot_support",
    });

    expect(vecellsSearch).toMatchObject({
      supplierRef: "vecells_local_gateway",
      claimOutcome: "supported",
      evidenceStatus: "current",
    });
    expect(vecellsBook).toMatchObject({
      supplierRef: "vecells_local_gateway",
      claimOutcome: "supported",
      evidenceStatus: "current",
    });
    expect(tppSearch).toMatchObject({
      supplierRef: "tpp_systmone",
      claimOutcome: "supported",
      evidenceStatus: "review_required",
    });
    expect(tppBook).toMatchObject({
      supplierRef: "tpp_systmone",
      claimOutcome: "unsupported",
      evidenceStatus: "review_required",
    });
    expect(manualSearch).toMatchObject({
      supplierRef: "manual_assist_network",
      claimOutcome: "unsupported",
      evidenceStatus: "manual_attested",
    });
    expect(manualBook).toMatchObject({
      supplierRef: "manual_assist_network",
      claimOutcome: "unsupported",
      evidenceStatus: "manual_attested",
    });
  });

  it("maps evidence-backed rows onto live, staff-assist, and blocked capability states", async () => {
    const liveSelfService = await resolveCapability({
      bookingCaseId: "booking_case_307_live",
      supplierRef: "optum_emis_web",
      integrationMode: "im1_patient_api",
      deploymentType: "internet_patient_shell",
      selectionAudience: "patient",
      requestedActionScope: "book_slot",
      gpLinkageStatus: "linked",
    });
    const liveStaffAssist = await resolveCapability({
      bookingCaseId: "booking_case_307_staff_assist",
      supplierRef: "tpp_systmone",
      integrationMode: "im1_transaction_api",
      deploymentType: "practice_local_component",
      selectionAudience: "staff",
      requestedActionScope: "search_slots",
      localConsumerStatus: "ready",
    });
    const blocked = await resolveCapability({
      bookingCaseId: "booking_case_307_blocked",
      supplierRef: "manual_assist_network",
      integrationMode: "manual_assist_only",
      deploymentType: "ops_manual_assist",
      selectionAudience: "staff",
      requestedActionScope: "search_slots",
    });

    expect(liveSelfService.resolution.capabilityState).toBe("live_self_service");
    expect(liveSelfService.projection.surfaceState).toBe("self_service_live");
    expect(liveStaffAssist.resolution.capabilityState).toBe("live_staff_assist");
    expect(liveStaffAssist.projection.surfaceState).toBe("staff_assist_live");
    expect(blocked.resolution.capabilityState).toBe("blocked");
    expect(blocked.projection.surfaceState).toBe("blocked");
    expect(blocked.resolution.blockedActionReasonCodes).toEqual(
      expect.arrayContaining(["reason_action_scope_not_supported", "reason_policy_blocked"]),
    );
  });
});
