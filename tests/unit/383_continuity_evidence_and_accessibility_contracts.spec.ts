import { describe, expect, it } from "vitest";
import {
  createDefaultPhase7RouteReadinessApplication,
  ContinuityEvidenceRegistry,
  PHASE7_ROUTE_READINESS_SCHEMA_VERSION,
  type NHSAppContinuityEvidenceBundle,
} from "../../services/command-api/src/phase7-route-readiness-service.ts";
import {
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

function continuityBundle(
  input?: Partial<NHSAppContinuityEvidenceBundle>,
): NHSAppContinuityEvidenceBundle {
  return {
    bundleId: "ContinuityEvidence:383:unit",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    journeyPathRef: "jp_unit",
    continuityControlCode: "unit_control",
    governingContractRef: "RouteContinuityEvidenceContract:unit",
    experienceContinuityEvidenceRefs: ["ExperienceContinuityControlEvidence:unit"],
    validationState: "trusted",
    blockingRefs: [],
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    capturedAt: "2026-04-27T01:05:15.000Z",
    supersededByRef: null,
    source: "route_readiness_registry",
    ...input,
  };
}

describe("383 continuity evidence and accessibility contracts", () => {
  it("validates trusted continuity and fails closed for missing, stale, or blocked bundles", () => {
    const registry = new ContinuityEvidenceRegistry([continuityBundle()]);

    expect(registry.validate(registry.get(PHASE7_MANIFEST_VERSION, "jp_unit")).state).toBe("valid");
    expect(registry.validate(null).failureReasons).toContain("continuity_evidence_missing");
    expect(
      registry.validate(continuityBundle({ capturedAt: "2025-01-01T00:00:00.000Z" }))
        .failureReasons,
    ).toContain("continuity_evidence_stale");
    expect(
      registry.validate(
        continuityBundle({
          validationState: "degraded",
          blockingRefs: ["manual-regression-required"],
        }),
      ).failureReasons,
    ).toContain("continuity_evidence_stale");
  });

  it("keeps accessibility audit evidence explicit in route verdicts", () => {
    const application = createDefaultPhase7RouteReadinessApplication();

    const ready = application.evaluateRouteReadiness({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
    });
    const missing = application.evaluateRouteReadiness({
      environment: "sandpit",
      journeyPathId: "jp_request_status",
    });

    expect(ready.verdict).toBe("ready");
    expect(ready.evidence.accessibleContentVariant?.wcagLevel).toBe("WCAG2.2-AA");
    expect(ready.evidence.accessibilityAudit?.state).toBe("current");
    expect(missing.verdict).toBe("evidence_missing");
    expect(missing.failureReasons).toContain("accessibility_audit_missing");
  });

  it("synthesizes UI state and bridge support into hard blockers", () => {
    const application = createDefaultPhase7RouteReadinessApplication();

    const blocked = application.evaluateRouteReadiness({
      environment: "sandpit",
      journeyPathId: "jp_waitlist_offer_response",
    });

    expect(blocked.schemaVersion).toBe(PHASE7_ROUTE_READINESS_SCHEMA_VERSION);
    expect(blocked.verdict).toBe("blocked");
    expect(blocked.failureReasons).toContain("bridge_support_mismatch");
    expect(blocked.failureReasons).toContain("incompatible_ui_state");
    expect(blocked.evidence.uiStateContract?.requiredBridgeActionRefs).toContain("addToCalendar");
  });

  it("returns evidence_missing for unknown journey paths without inventing readiness", () => {
    const application = createDefaultPhase7RouteReadinessApplication();

    const result = application.evaluateRouteReadiness({
      environment: "sandpit",
      journeyPathId: "jp_unknown",
    });

    expect(result.verdict).toBe("evidence_missing");
    expect(result.failureReasons).toEqual(
      expect.arrayContaining([
        "manifest_route_missing",
        "continuity_evidence_missing",
        "accessibility_audit_missing",
        "ui_state_contract_missing",
      ]),
    );
  });
});
