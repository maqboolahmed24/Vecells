import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";

describe("PatientSupportPhase2Bridge", () => {
  it("renders patient-facing request status copy without support workflow language", () => {
    const html = renderToStaticMarkup(
      <PatientSupportPhase2Bridge
        context={resolvePortalSupportPhase2Context({ pathname: "/requests" })}
      />,
    );
    const normalized = html.toLowerCase();

    expect(html).toContain("Request update");
    expect(html).toContain("Next step");
    expect(html).toContain("Reply with more information");
    expect(html).toContain("Contact preference");
    expect(html).toContain("Privacy");

    [
      "Support next action",
      "Support has the same request summary",
      "support reachability",
      "session current",
      "truth",
      "lineage",
      "fixture",
      "callback-safe",
      "governed",
      "PDS",
      "demographic",
    ].forEach((internalText) => {
      expect(normalized).not.toContain(internalText.toLowerCase());
    });
  });

  it("can render as a compact collapsible update", () => {
    const html = renderToStaticMarkup(
      <PatientSupportPhase2Bridge
        context={resolvePortalSupportPhase2Context({ pathname: "/bookings/booking_case_293_live/select" })}
        collapsible
        defaultCollapsed
      />,
    );

    expect(html).toContain('data-collapsible="true"');
    expect(html).toContain('data-collapsed="true"');
    expect(html).toContain('data-testid="patient-request-status-toggle"');
    expect(html).toContain("Show details");
    expect(html).not.toContain('data-testid="PatientRequestStatusDetails"');
  });

  it("can render an accessible dismiss button when used as a notification", () => {
    const html = renderToStaticMarkup(
      <PatientSupportPhase2Bridge
        context={resolvePortalSupportPhase2Context({ pathname: "/home" })}
        dismissible
      />,
    );

    expect(html).toContain('data-dismissible="true"');
    expect(html).toContain('data-testid="patient-request-status-dismiss"');
    expect(html).toContain('aria-label="Close request update"');
  });
});
