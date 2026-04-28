import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  createDefaultPhase7RouteReadinessApplication,
  phase7RouteReadinessRoutes,
} from "../../services/command-api/src/phase7-route-readiness-service.ts";
import {
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

describe("383 route readiness and promotion verifier", () => {
  it("registers route readiness routes in the command API catalog", () => {
    for (const route of phase7RouteReadinessRoutes) {
      expect(serviceDefinition.routeCatalog.some((entry) => entry.routeId === route.routeId)).toBe(
        true,
      );
    }
  });

  it("covers every required route readiness verdict in the deterministic seed", () => {
    const application = createDefaultPhase7RouteReadinessApplication();

    const results = application.listRouteReadiness({ environment: "sandpit" });
    const verdicts = new Set(results.map((result) => result.verdict));

    expect(verdicts).toEqual(
      new Set(["ready", "conditionally_ready", "evidence_missing", "placeholder_only", "blocked"]),
    );
    expect(
      results.find((result) => result.journeyPathId === "jp_records_letters_summary")?.verdict,
    ).toBe("placeholder_only");
  });

  it("promotes only fully ready routes with the pinned release tuple", () => {
    const application = createDefaultPhase7RouteReadinessApplication();

    const result = application.verifyPromotionReadiness({
      environment: "sandpit",
      journeyPathIds: ["jp_pharmacy_status"],
      expectedManifestVersion: PHASE7_MANIFEST_VERSION,
      expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
      expectedReleaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    });

    expect(result.promotionState).toBe("promotable");
    expect(result.aggregateFailureReasons).toEqual([]);
    expect(result.failureReasonsByRoute.jp_pharmacy_status).toEqual([]);
  });

  it("blocks promotion when any route is conditional, placeholder-only, blocked, or missing evidence", () => {
    const application = createDefaultPhase7RouteReadinessApplication();

    const result = application.verifyPromotionReadiness({
      environment: "sandpit",
    });

    expect(result.promotionState).toBe("blocked");
    expect(result.aggregateFailureReasons).toEqual(
      expect.arrayContaining([
        "promotion_policy_not_ready",
        "accessibility_audit_missing",
        "bridge_support_mismatch",
        "incompatible_ui_state",
        "continuity_evidence_missing",
      ]),
    );
    expect(result.failureReasonsByRoute.jp_manage_local_appointment).toContain(
      "promotion_policy_not_ready",
    );
    expect(result.failureReasonsByRoute.jp_records_letters_summary).toContain(
      "promotion_policy_not_ready",
    );
  });

  it("allows conditional routes only when explicitly requested for rehearsal", () => {
    const application = createDefaultPhase7RouteReadinessApplication();

    const blocked = application.verifyPromotionReadiness({
      environment: "sandpit",
      journeyPathIds: ["jp_manage_local_appointment"],
    });
    const allowed = application.verifyPromotionReadiness({
      environment: "sandpit",
      journeyPathIds: ["jp_manage_local_appointment"],
      allowConditionallyReadyRoutes: true,
    });

    expect(blocked.promotionState).toBe("blocked");
    expect(blocked.aggregateFailureReasons).toContain("promotion_policy_not_ready");
    expect(allowed.promotionState).toBe("promotable");
  });

  it("blocks release tuple drift even for otherwise ready routes", () => {
    const application = createDefaultPhase7RouteReadinessApplication();

    const result = application.verifyPromotionReadiness({
      environment: "sandpit",
      journeyPathIds: ["jp_pharmacy_status"],
      expectedManifestVersion: "nhsapp-manifest-v0.1.0-drift",
    });

    expect(result.promotionState).toBe("blocked");
    expect(result.routeResults[0]?.verdict).toBe("blocked");
    expect(result.aggregateFailureReasons).toContain("release_tuple_drift");
  });
});
