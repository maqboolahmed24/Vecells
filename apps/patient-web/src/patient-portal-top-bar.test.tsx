import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PatientPortalTopBar } from "./patient-portal-top-bar";

describe("PatientPortalTopBar", () => {
  it("renders the shared patient portal links and current state", () => {
    const html = renderToStaticMarkup(<PatientPortalTopBar current="appointments" />);

    expect(html).toContain('href="/home"');
    expect(html).toContain('href="/requests"');
    expect(html).toContain('href="/appointments"');
    expect(html).toContain('href="/records"');
    expect(html).toContain('href="/messages"');
    expect(html).toContain('href="/portal/account"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Appointments");
  });
});
