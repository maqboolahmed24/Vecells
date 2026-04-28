import { describe, expect, it } from "vitest";
import { build486ScenarioRecords } from "../../tools/channel/enable_486_nhs_app_channel";

function routeFor(scenario: ReturnType<typeof build486ScenarioRecords>, routeFamilyRef: string) {
  const found = scenario.routeVerdicts.find((route) => route.routeFamilyRef === routeFamilyRef);
  if (!found) throw new Error(`missing route ${routeFamilyRef}`);
  return found;
}

describe("486 embedded coverage gate", () => {
  it("requires exact route coverage for start, status, booking, pharmacy, secure-link, and artifact routes", () => {
    const approved = build486ScenarioRecords("approved_embedded", []);

    expect(approved.routeVerdicts.map((route) => route.routeFamilyRef)).toEqual([
      "start_request",
      "request_status",
      "booking",
      "pharmacy",
      "secure_link_recovery",
      "artifact_view",
    ]);
    expect(
      approved.routeVerdicts.every(
        (route) =>
          route.embeddedSurfaceCoverageState === "exact" &&
          route.routeContractState === "exact" &&
          route.safeReturnState === "exact",
      ),
    ).toBe(true);
    expect(approved.postureProof.mobileLayoutProfile).toBe("mission_stack");
    expect(approved.postureProof.headerHidden).toBe(true);
    expect(approved.postureProof.footerHidden).toBe(true);
  });

  it("blocks when coverage is exact for start request but missing for status and pharmacy", () => {
    const missing = build486ScenarioRecords("route_coverage_missing_pharmacy_status", []);

    expect(routeFor(missing, "start_request").embeddedSurfaceCoverageState).toBe("exact");
    expect(routeFor(missing, "request_status").embeddedSurfaceCoverageState).toBe("missing");
    expect(routeFor(missing, "pharmacy").embeddedSurfaceCoverageState).toBe("missing");
    expect(missing.settlement.result).toBe("blocked_coverage");
    expect(missing.settlement.enabled).toBe(false);
  });

  it("allows unsupported bridge behavior only with governed fallback and no exposed dead actions", () => {
    const governed = build486ScenarioRecords("unsupported_bridge", []);
    const missing = build486ScenarioRecords("unsupported_download_no_fallback", []);

    expect(governed.unsupportedBridgeFallback.fallbackState).toBe("governed");
    expect(governed.unsupportedBridgeFallback.deadLinkExposed).toBe(false);
    expect(routeFor(governed, "artifact_view").downloadActionExposed).toBe(false);
    expect(routeFor(governed, "artifact_view").printActionExposed).toBe(false);
    expect(governed.settlement.result).toBe("applied_with_fallback");

    expect(missing.unsupportedBridgeFallback.fallbackState).toBe("missing");
    expect(missing.unsupportedBridgeFallback.deadLinkExposed).toBe(true);
    expect(missing.settlement.result).toBe("blocked_fallback");
  });

  it("blocks when supplier chrome hiding or safe return is not enforced", () => {
    const chrome = build486ScenarioRecords("chrome_hiding_not_enforced", []);
    const safeReturn = build486ScenarioRecords("safe_return_broken", []);

    expect(chrome.postureProof.supplierChromeState).toBe("not_enforced");
    expect(chrome.postureProof.headerHidden).toBe(false);
    expect(chrome.postureProof.footerHidden).toBe(false);
    expect(chrome.settlement.result).toBe("blocked_chrome");

    expect(routeFor(safeReturn, "secure_link_recovery").safeReturnState).toBe("broken");
    expect(safeReturn.settlement.result).toBe("blocked_safe_return");
    expect(safeReturn.settlement.enabled).toBe(false);
  });
});
