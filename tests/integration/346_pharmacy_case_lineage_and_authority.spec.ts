import { describe, expect, it } from "vitest";

import {
  buildCloseCommand,
  progressCaseToResolved,
} from "./346_pharmacy_case.helpers.ts";

describe("346 pharmacy case lineage and authority", () => {
  it("keeps pharmacy routing on the canonical request lineage and closes through the same child link", async () => {
    const { service, created, resolved } = await progressCaseToResolved("346_integration_close");

    expect(created.pharmacyCase.requestLineageRef.refId).toBe("request_lineage_346_integration_close");
    expect(created.lineageCaseLink.caseFamily).toBe("pharmacy");
    expect(created.lineageCaseLink.requestLineageRef).toBe(
      created.pharmacyCase.requestLineageRef.refId,
    );
    expect(created.lineageCaseLink.parentLineageCaseLinkRef).toBe(
      "triage_lineage_346_integration_close",
    );

    const closed = await service.closePharmacyCase(
      buildCloseCommand(resolved.pharmacyCase, "346_integration_close"),
    );

    expect(closed.pharmacyCase.status).toBe("closed");
    expect(closed.lineageCaseLink.ownershipState).toBe("closed");
    expect(closed.lineageCaseLink.lineageCaseLinkId).toBe(
      created.lineageCaseLink.lineageCaseLinkId,
    );
    expect(closed.emittedEvents.map((event) => event.eventType)).toContain("pharmacy.case.closed");
  });
});
