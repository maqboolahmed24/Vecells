import { describe, expect, it } from "vitest";

import {
  attach351IdentityFreeze,
  attach351ReachabilityBlocker,
  create351PatientStatusHarness,
  project351PatientStatus,
  seed351DispatchPendingCase,
} from "./351_pharmacy_patient_status.helpers.ts";

describe("351 reachability repair and identity hold", () => {
  it("lets contact-route repair dominate patient actionability when pharmacy contact reachability is degraded", async () => {
    const harness = create351PatientStatusHarness();
    const seeded = await seed351DispatchPendingCase({
      harness,
      seed: "351_repair",
    });
    await attach351ReachabilityBlocker({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      dependencySuffix: "351_repair",
      purpose: "pharmacy_contact",
      withRepairJourney: true,
    });

    const projected = await project351PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T16:45:00.000Z",
    });

    expect(projected.patientStatusProjection.staleOrBlockedPosture).toBe("repair_required");
    expect(projected.patientStatusProjection.currentMacroState).toBe("reviewing_next_steps");
    expect(projected.reachabilityRepairProjection.repairProjectionState).toBe(
      "awaiting_verification",
    );
    expect(projected.reachabilityRepairProjection.nextRepairAction).toBe(
      "verify_candidate_route",
    );
    expect(projected.instructionPanel.headlineText).toBe("Update or confirm how we can contact you.");
  });

  it("keeps provider detail and live CTAs suppressed while wrong-patient repair is still active", async () => {
    const harness = create351PatientStatusHarness();
    const seeded = await seed351DispatchPendingCase({
      harness,
      seed: "351_identity",
    });
    await attach351IdentityFreeze({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      suffix: "351_identity",
    });

    const projected = await project351PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T16:50:00.000Z",
    });

    expect(projected.patientStatusProjection.staleOrBlockedPosture).toBe("identity_frozen");
    expect(projected.patientStatusProjection.currentMacroState).toBe("reviewing_next_steps");
    expect(projected.providerSummary.detailVisibilityState).toBe("provenance_only");
    expect(projected.referralReferenceSummary.displayMode).toBe("suppressed");
    expect(projected.instructionPanel.warningText).toContain("read-only background context");
    expect(projected.patientStatusProjection.calmCopyAllowed).toBe(false);
  });
});
