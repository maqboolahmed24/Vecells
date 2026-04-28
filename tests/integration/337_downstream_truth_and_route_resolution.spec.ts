import { describe, expect, it } from "vitest";

import {
  UnifiedAppointmentFamilyResolver,
  appointmentsWorkspaceHref337,
} from "../../apps/patient-web/src/patient-appointment-family-workspace.model.ts";

describe("337 downstream truth and route resolution", () => {
  it("uses equivalent confirmed wording for local and network rows while keeping their authorities distinct", () => {
    const workspace = UnifiedAppointmentFamilyResolver({ variant: "default" });
    const local = workspace.rows.find((row) => row.familyRef === "family_local_confirmed");
    const network = workspace.rows.find((row) => row.familyRef === "family_network_live");

    expect(local?.truthSource).toBe("BookingConfirmationTruthProjection");
    expect(network?.truthSource).toBe("HubOfferToConfirmationTruthProjection");
    expect(local?.status.primaryLabel).toBe("Appointment confirmed");
    expect(network?.status.primaryLabel).toBe("Appointment confirmed");
    expect(network?.status.secondaryLabel).toContain("Practice informed");
  });

  it("suppresses stale network calmness and routes provisional work to read-only network status", () => {
    const workspace = UnifiedAppointmentFamilyResolver({
      variant: "pending",
      selectedFamilyRef: "family_network_live",
    });

    expect(workspace.selectedRow.status.primaryLabel).toBe("Confirmation pending");
    expect(workspace.selectedRow.manageEntry.resolutionKind).toBe("read_only");
    expect(workspace.selectedRow.manageEntry.staleCtaSuppressed).toBe(true);
    expect(workspace.selectedRow.manageEntry.routeRef).toContain(
      "/bookings/network/manage/network_manage_330_read_only",
    );
  });

  it("moves local fallback due rows into hub follow-on routes while preserving the family anchor in workspace links", () => {
    const workspace = UnifiedAppointmentFamilyResolver({ variant: "default" });
    const waitlist = workspace.rows.find((row) => row.familyRef === "family_waitlist_fallback_due");

    expect(waitlist?.manageEntry.resolutionKind).toBe("network_choice");
    expect(waitlist?.manageEntry.routeRef).toContain("/bookings/network/offer_session_328_live");
    expect(waitlist?.fallback?.headline).toContain("Fallback");
    expect(
      appointmentsWorkspaceHref337({
        familyRef: waitlist?.familyRef,
        entrySource: "request_detail",
        requestContextRef: "request_211_a",
      }),
    ).toContain("family_waitlist_fallback_due");
  });
});
