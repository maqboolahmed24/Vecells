import { describe, expect, it } from "vitest";
import {
  build475BAUArtifacts,
  type LaunchRoleId,
} from "../../tools/bau/plan_475_training_runbooks";

const expectedRoles: readonly LaunchRoleId[] = [
  "clinician",
  "care_navigator",
  "admin",
  "hub_operator",
  "pharmacist",
  "support_analyst",
  "governance_admin",
  "clinical_safety_officer",
  "security_privacy_owner",
  "incident_commander",
  "service_owner",
  "release_manager",
  "supplier_contact",
];

describe("task 475 role responsibility matrix", () => {
  it("enumerates all launch roles with training, escalation, and prohibited action boundaries", () => {
    const { roleResponsibilityMatrix, trainingCurriculumManifest, competencyEvidenceLedger } =
      build475BAUArtifacts();

    expect(roleResponsibilityMatrix.matrixHash).toMatch(/^[a-f0-9]{64}$/);
    expect(roleResponsibilityMatrix.launchRoles.map((role: any) => role.roleId)).toEqual(
      expectedRoles,
    );

    for (const role of roleResponsibilityMatrix.launchRoles) {
      expect(role.launchTasks.length).toBeGreaterThan(0);
      expect(role.supportDecisions.length).toBeGreaterThan(0);
      expect(role.escalationTriggers.length).toBeGreaterThan(0);
      expect(role.assistiveResponsibilities.length).toBeGreaterThan(0);
      expect(role.channelResponsibilities.length).toBeGreaterThan(0);
      expect(role.prohibitedActions).toContain("Mark training complete without exact competency evidence.");
      expect(role.trainingModuleRefs.length).toBeGreaterThanOrEqual(2);
      expect(role.competencyEvidenceRefs.length).toBe(role.trainingModuleRefs.length);
      expect(role.assignmentHash).toMatch(/^[a-f0-9]{64}$/);
    }

    const assistiveModule = trainingCurriculumManifest.modules.find(
      (module: any) => module.moduleId === "tm_475_assistive_human_review_responsibility",
    );
    expect(assistiveModule.requiredResponsibilityAssertions.join(" ")).toContain(
      "review, revise, and approve",
    );
    expect(assistiveModule.requiredResponsibilityAssertions.join(" ")).toContain(
      "No model output is final authority",
    );

    const channelModule = trainingCurriculumManifest.modules.find(
      (module: any) => module.moduleId === "tm_475_nhs_app_deferred_channel_support",
    );
    expect(channelModule.requiredResponsibilityAssertions.join(" ")).toContain(
      "NHS App is not live",
    );
    expect(trainingCurriculumManifest.channelSupportResponsibilityNotice.channelActivationPermitted).toBe(
      false,
    );

    expect(competencyEvidenceLedger.entries.every((entry: any) => entry.evidenceState === "exact")).toBe(
      true,
    );
  });

  it("blocks support-only completion when clinical safety owner competency is missing", () => {
    const { roleResponsibilityMatrix, competencyEvidenceLedger, trainingCurriculumManifest } =
      build475BAUArtifacts("blocked");

    expect(roleResponsibilityMatrix.readinessState).toBe("blocked");
    expect(competencyEvidenceLedger.readinessState).toBe("blocked");
    expect(trainingCurriculumManifest.readinessState).toBe("blocked");

    const clinicalSafetyEvidence = competencyEvidenceLedger.entries.find(
      (entry: any) =>
        entry.roleId === "clinical_safety_officer" &&
        entry.moduleId === "tm_475_clinical_safety_dcb0160_operations",
    );
    expect(clinicalSafetyEvidence.evidenceState).toBe("missing");
    expect(clinicalSafetyEvidence.blockerRefs).toContain(
      "blocker:475:clinical-safety-owner-competency-missing",
    );

    const edgeCases = roleResponsibilityMatrix.edgeCaseGuards.map((guard: any) => guard.edgeCaseId);
    expect(edgeCases).toEqual(
      expect.arrayContaining([
        "support_training_complete_clinical_safety_owner_missing",
        "channel_training_claims_nhs_app_live_while_deferred",
      ]),
    );
  });
});
