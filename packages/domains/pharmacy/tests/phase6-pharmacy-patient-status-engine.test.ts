import { describe, expect, it } from "vitest";

import {
  attach351ReachabilityBlocker,
  create351PatientStatusHarness,
  project351PatientStatus,
  seed351DispatchPendingCase,
} from "../../../../tests/integration/351_pharmacy_patient_status.helpers.ts";

describe("phase6 pharmacy patient status engine", () => {
  it("appends audit evidence when macro-state or dominant blocker changes materially", async () => {
    const harness = create351PatientStatusHarness();
    const seeded = await seed351DispatchPendingCase({
      harness,
      seed: "351_unit_audit",
    });

    const initial = await project351PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T16:00:00.000Z",
    });

    expect(initial.patientStatusProjection.currentMacroState).toBe("action_in_progress");
    const initialAudit = await harness.patientStatusRepositories.listPatientStatusAuditEventsForCase(
      seeded.currentCase.pharmacyCaseId,
    );
    expect(initialAudit).toHaveLength(1);

    await attach351ReachabilityBlocker({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      dependencySuffix: "351_unit_audit",
      purpose: "pharmacy_contact",
      withRepairJourney: true,
    });

    const repaired = await project351PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T16:10:00.000Z",
    });

    expect(repaired.patientStatusProjection.currentMacroState).toBe("reviewing_next_steps");
    expect(repaired.patientStatusProjection.staleOrBlockedPosture).toBe("repair_required");

    const auditTrail = await harness.patientStatusRepositories.listPatientStatusAuditEventsForCase(
      seeded.currentCase.pharmacyCaseId,
    );
    expect(auditTrail).toHaveLength(2);
    const latest = auditTrail.at(-1)?.toSnapshot();
    expect(latest?.previousMacroState).toBe("action_in_progress");
    expect(latest?.nextMacroState).toBe("reviewing_next_steps");
    expect(latest?.nextStaleOrBlockedPosture).toBe("repair_required");
  });
});
