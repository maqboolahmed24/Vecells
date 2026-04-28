import { describe, expect, it } from "vitest";
import { build475BAUArtifacts } from "../../tools/bau/plan_475_training_runbooks";

describe("task 475 runbook bundle manifest", () => {
  it("binds each runbook to owner, review cadence, current release tuple, rehearsal proof, and accessible artifact controls", () => {
    const { runbookBundleManifest, supportEscalationPaths, governanceCadenceCalendar } =
      build475BAUArtifacts();

    expect(runbookBundleManifest.bundleHash).toMatch(/^[a-f0-9]{64}$/);
    expect(runbookBundleManifest.readinessState).toBe("complete_with_constraints");
    expect(runbookBundleManifest.runbookBindingRecords.length).toBeGreaterThanOrEqual(8);

    for (const runbook of runbookBundleManifest.runbookBindingRecords) {
      expect(runbook.owner).toBeTruthy();
      expect(runbook.reviewCadenceDays).toBeGreaterThan(0);
      expect(runbook.releaseCandidateRef).toBe(runbookBundleManifest.releaseCandidateRef);
      expect(runbook.runtimePublicationBundleRef).toBe(
        runbookBundleManifest.runtimePublicationBundleRef,
      );
      expect(runbook.evidenceRequirementRefs.length).toBeGreaterThan(0);
      expect(runbook.rehearsalProofRef).toMatch(/^rde_475_/);
      expect(runbook.escalationPathRef).toMatch(/^ep_475_/);
      expect(runbook.artifactPresentationContractRef).toMatch(/^artifact-presentation:475:/);
      expect(runbook.accessibleAlternativeRef).toMatch(/^accessible-alt:475:/);
      expect(runbook.bindingHash).toMatch(/^[a-f0-9]{64}$/);
    }

    expect(runbookBundleManifest.runbookDrillEvidence).toHaveLength(
      runbookBundleManifest.runbookBindingRecords.length,
    );
    expect(
      runbookBundleManifest.runbookVersionApprovals.every((approval: any) =>
        approval.approvalHash.match(/^[a-f0-9]{64}$/),
      ),
    ).toBe(true);

    expect(supportEscalationPaths.escalationPaths.every((path: any) => path.outOfHoursCoverage)).toBe(
      true,
    );
    expect(
      governanceCadenceCalendar.events.some(
        (event: any) => event.cadenceEventId === "gce_475_monthly_nhs_app_data_pack_ready",
      ),
    ).toBe(true);
  });

  it("publishes blocked edge guards for owner gaps, superseded runbooks, out-of-hours gaps, and inaccessible materials", () => {
    const { runbookBundleManifest } = build475BAUArtifacts();
    const edgeCases = runbookBundleManifest.edgeCaseGuards.map((guard: any) => guard.edgeCaseId);
    expect(edgeCases).toEqual(
      expect.arrayContaining([
        "support_runbook_exists_without_owner_or_review_cadence",
        "runbook_link_points_to_superseded_release_tuple",
        "non_html_material_lacks_accessible_alternative_or_presentation_contract",
      ]),
    );

    const superseded = build475BAUArtifacts("superseded_runbook");
    const rollbackRunbook = superseded.runbookBundleManifest.runbookBindingRecords.find(
      (runbook: any) => runbook.runbookId === "rb_475_rollback_cutover_rehearsal",
    );
    expect(superseded.runbookBundleManifest.readinessState).toBe("blocked");
    expect(rollbackRunbook.releaseCandidateRef).toBe("SUPERSEDED_RC");
    expect(rollbackRunbook.blockerRefs).toContain("blocker:475:runbook-release-tuple-superseded");

    const blocked = build475BAUArtifacts("blocked");
    const outOfHoursPath = blocked.supportEscalationPaths.escalationPaths.find(
      (path: any) => path.escalationPathId === "ep_475_support_ops_out_of_hours",
    );
    expect(blocked.supportEscalationPaths.readinessState).toBe("blocked");
    expect(outOfHoursPath.outOfHoursCoverage).toBe(false);
    expect(outOfHoursPath.blockerRefs).toContain(
      "blocker:475:incident-escalation-out-of-hours-gap",
    );
  });
});
