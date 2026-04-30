import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SignedInRequestStartRestoreApp from "./signed-in-request-start-restore";
import { SignedInRequestEntryResolver } from "./signed-in-request-start-restore.model";

describe("SignedInRequestStartRestoreApp", () => {
  it("uses the canonical patient portal chrome and patient-facing start copy", () => {
    const html = renderToStaticMarkup(<SignedInRequestStartRestoreApp />);

    expect(html).toContain('href="/home"');
    expect(html).toContain('href="/requests"');
    expect(html).toContain("NHS 943 *** 7812");
    expect(html).toContain("Start new request");
    expect(html).toContain("Saved request details");

    expect(html).not.toContain("Signed-in mission frame");
    expect(html).not.toContain("Continuity tuple");
    expect(html).not.toContain("Start a request from your account");
    expect(html).not.toContain("mission-frame intake");
  });

  it("keeps restore and mapped states in patient-facing language", () => {
    const restoreProjection = SignedInRequestEntryResolver("/portal/start-request/restore");
    const mappedProjection = SignedInRequestEntryResolver("/portal/start-request/promoted");

    expect(restoreProjection.screen.title).toBe("Return to your saved step");
    expect(restoreProjection.screen.body).not.toContain("authoritative");
    expect(mappedProjection.screen.body).toBe(
      "This saved draft has already been sent. You can view the current request status.",
    );
    expect(mappedProjection.patientPortalEntryProjection.maskedPatientRef).toBe("NHS 943 *** 7812");
  });
});
