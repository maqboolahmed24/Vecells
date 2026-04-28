import { describe, expect, it } from "vitest";
import { createAssistiveFreezePlane } from "../../packages/domains/assistive_freeze/src/index.ts";
import { actor, fixedClock, freezeCommand } from "./416_test_helpers.ts";

describe("416 freeze record and in-place recovery", () => {
  it("opens current freeze truth and resolves exact governed disposition modes", () => {
    const plane = createAssistiveFreezePlane({ clock: fixedClock });

    const freeze = plane.freezeRecords.openFreezeRecord(
      freezeCommand({
        triggerType: "trust_degraded",
        triggerRef: "trust-projection:degraded:v1",
      }),
      actor("release_freeze_service"),
    );
    const disposition = plane.freezeDispositions.resolveDisposition(
      {
        freezeRecordRef: freeze.assistiveReleaseFreezeRecordId,
        trustState: "degraded",
        policyFreshnessState: "current",
        publicationFreshnessState: "current",
        runtimePublicationState: "current",
        staffMessageRef: "staff-message:assistive-degraded",
        recoveryActionRef: "recovery-action:regenerate-in-place",
      },
      actor("freeze_disposition_resolver"),
    );
    const binding = plane.recoveryBindings.bindRecoveryDisposition(
      {
        assistiveSessionRef: "assistive-session:case-001",
        freezeRecordRef: freeze.assistiveReleaseFreezeRecordId,
        freezeDispositionRef: disposition.assistiveFreezeDispositionId,
        releaseRecoveryDispositionRef: "release-recovery:assistive:v1",
        routeFamilyRef: "clinical-workspace",
        shellFamilyRef: "staff-workspace-shell",
        dominantRecoveryActionRef: "recovery-action:regenerate-in-place",
        operatorMessageRef: "operator-message:degraded",
        clinicianMessageRef: "clinician-message:degraded",
        preservedArtifactRefs: ["assistive-artifact:case-001"],
        preservedProvenanceEnvelopeRefs: ["provenance-envelope:case-001"],
      },
      actor("recovery_disposition_binder"),
    );

    expect(freeze.freezeState).toBe("monitoring");
    expect(disposition.freezeMode).toBe("read_only_provenance");
    expect(disposition.suppressAccept).toBe(true);
    expect(disposition.suppressInsert).toBe(true);
    expect(disposition.preserveVisibleArtifacts).toBe(true);
    expect(binding.sameShellRequired).toBe(true);
    expect(binding.preservedArtifactRefs).toEqual(["assistive-artifact:case-001"]);
  });

  it("blocks stale controls while preserving provenance under read-only recovery", () => {
    const plane = createAssistiveFreezePlane({ clock: fixedClock });
    const freeze = plane.freezeRecords.openFreezeRecord(
      freezeCommand({
        triggerType: "trust_degraded",
        triggerRef: "trust-projection:degraded:v1",
      }),
      actor("release_freeze_service"),
    );
    const disposition = plane.freezeDispositions.resolveDisposition(
      {
        freezeRecordRef: freeze.assistiveReleaseFreezeRecordId,
        trustState: "degraded",
        staffMessageRef: "staff-message:assistive-degraded",
        recoveryActionRef: "recovery-action:regenerate-in-place",
      },
      actor("freeze_disposition_resolver"),
    );
    const binding = plane.recoveryBindings.bindRecoveryDisposition(
      {
        assistiveSessionRef: "assistive-session:case-001",
        freezeRecordRef: freeze.assistiveReleaseFreezeRecordId,
        freezeDispositionRef: disposition.assistiveFreezeDispositionId,
        releaseRecoveryDispositionRef: "release-recovery:assistive:v1",
        routeFamilyRef: "clinical-workspace",
        shellFamilyRef: "staff-workspace-shell",
        dominantRecoveryActionRef: "recovery-action:regenerate-in-place",
        operatorMessageRef: "operator-message:degraded",
        clinicianMessageRef: "clinician-message:degraded",
        preservedArtifactRefs: ["assistive-artifact:case-001"],
        preservedProvenanceEnvelopeRefs: ["provenance-envelope:case-001"],
      },
      actor("recovery_disposition_binder"),
    );

    const blockedInsert = plane.actionabilityGuard.guardAction(
      {
        assistiveSessionRef: "assistive-session:case-001",
        requestedAction: "insert",
        freezeRecordRef: freeze.assistiveReleaseFreezeRecordId,
        freezeDispositionRef: disposition.assistiveFreezeDispositionId,
        recoveryBindingRef: binding.recoveryBindingId,
      },
      actor("actionability_freeze_guard"),
    );
    const provenance = plane.actionabilityGuard.guardAction(
      {
        assistiveSessionRef: "assistive-session:case-001",
        requestedAction: "view_provenance",
        freezeRecordRef: freeze.assistiveReleaseFreezeRecordId,
        freezeDispositionRef: disposition.assistiveFreezeDispositionId,
        recoveryBindingRef: binding.recoveryBindingId,
      },
      actor("actionability_freeze_guard"),
    );

    expect(blockedInsert.allowed).toBe(false);
    expect(blockedInsert.blockingReasonCodes).toEqual(
      expect.arrayContaining(["freeze_disposition_suppresses_insert"]),
    );
    expect(provenance.decisionState).toBe("observe_only");
    expect(provenance.preserveProvenanceFooter).toBe(true);
  });
});
