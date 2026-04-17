import { describe, expect, it } from "vitest";
import {
  createIdentityBindingAuthorityApplication,
  createInMemoryIdentityBindingAuthorityRepository,
  identityBindingAuthorityMigrationPlanRefs,
  identityBindingAuthorityParallelInterfaceGaps,
  identityBindingAuthorityPersistenceTables,
} from "../src/identity-binding-authority.ts";

function confidence(overrides = {}) {
  return {
    P_link: 0.994,
    LCB_link_alpha: 0.982,
    P_subject: 0.992,
    LCB_subject_alpha: 0.981,
    runnerUpProbabilityUpperBound: 0.009,
    gap_logit: 5.48,
    confidenceModelState: "calibrated",
    ...overrides,
  };
}

function createHarness() {
  const repository = createInMemoryIdentityBindingAuthorityRepository();
  const application = createIdentityBindingAuthorityApplication({ repository });
  return { application, repository };
}

describe("identity binding authority", () => {
  it("settles verified bind as append-only authority and advances derived lineage refs transactionally", async () => {
    const { application, repository } = createHarness();

    const result = await application.identityBindingAuthority.settleIdentityBindingCommand({
      commandId: "iba_command_179_verified",
      idempotencyKey: "idem_179_verified",
      subjectRef: "nhs_login_subject_179",
      intentType: "verified_bind",
      expectedCurrentBindingVersionRef: null,
      patientLinkDecisionRef: "pld_179_verified",
      candidatePatientRef: "patient_ref_179_a",
      confidence: confidence(),
      provenanceRefs: ["iev_auth_claim_179", "pld_179_verified"],
      derivedLineageRefs: [
        { lineageKind: "request", lineageRef: "request_179_a" },
        { lineageKind: "episode", lineageRef: "episode_179_a" },
      ],
      actorRef: "patient_linker",
      observedAt: "2026-04-15T12:00:00Z",
    });
    const snapshots = repository.snapshots();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/094_phase2_identity_binding_authority.sql",
    );
    expect(application.migrationPlanRefs).toEqual(identityBindingAuthorityMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(identityBindingAuthorityPersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(
      identityBindingAuthorityParallelInterfaceGaps,
    );
    expect(result.settlement.decision).toBe("accepted");
    expect(result.binding?.bindingState).toBe("verified_patient");
    expect(result.binding?.patientRef).toBe("patient_ref_179_a");
    expect(result.binding?.createdByAuthority).toBe("IdentityBindingAuthority");
    expect(result.currentPointer?.currentBindingVersionRef).toBe(result.binding?.bindingVersionRef);
    expect(result.derivedPatientRefSettlements).toHaveLength(2);
    expect(result.derivedPatientRefSettlements[0]?.updatedByAuthority).toBe(
      "IdentityBindingAuthority",
    );
    expect(result.settlement.reasonCodes).toContain("BINDING_179_ACCEPTED_APPEND_ONLY");
    expect(result.settlement.reasonCodes).toContain("BINDING_179_CURRENT_POINTER_CAS");
    expect(result.settlement.reasonCodes).toContain("BINDING_179_DERIVED_PATIENT_REF_ADVANCED");
    expect(snapshots.bindings).toHaveLength(1);
    expect(snapshots.currentPointers[0]?.pointerEpoch).toBe(1);
    expect(snapshots.derivedPatientRefs.map((entry) => entry.nextPatientRef)).toEqual([
      "patient_ref_179_a",
      "patient_ref_179_a",
    ]);
    expect(JSON.stringify(snapshots)).not.toContain(".patientRef =");
  });

  it("returns idempotent replay without creating a second binding version", async () => {
    const { application, repository } = createHarness();
    const command = {
      commandId: "iba_command_179_replay",
      idempotencyKey: "idem_179_replay",
      subjectRef: "nhs_login_subject_179_replay",
      intentType: "candidate_refresh",
      expectedCurrentBindingVersionRef: null,
      patientLinkDecisionRef: "pld_179_candidate",
      confidence: confidence({ LCB_link_alpha: 0.62, P_link: 0.72 }),
      provenanceRefs: ["pld_179_candidate"],
      actorRef: "patient_linker",
      observedAt: "2026-04-15T12:01:00Z",
    };

    const first = await application.identityBindingAuthority.settleIdentityBindingCommand(command);
    const second = await application.identityBindingAuthority.settleIdentityBindingCommand(command);

    expect(first.settlement.decision).toBe("accepted");
    expect(second.replayed).toBe(true);
    expect(second.settlement.decision).toBe("replayed");
    expect(second.settlement.reasonCodes).toContain("BINDING_179_REPLAY_RETURNED");
    expect(repository.snapshots().bindings).toHaveLength(1);
    expect(repository.snapshots().commandSettlements).toHaveLength(1);
  });

  it("rejects stale compare-and-set commands instead of overwriting current binding truth", async () => {
    const { application, repository } = createHarness();
    const first = await application.identityBindingAuthority.settleIdentityBindingCommand({
      commandId: "iba_command_179_first",
      idempotencyKey: "idem_179_first",
      subjectRef: "nhs_login_subject_179_cas",
      intentType: "verified_bind",
      expectedCurrentBindingVersionRef: null,
      patientLinkDecisionRef: "pld_179_first",
      candidatePatientRef: "patient_ref_179_a",
      confidence: confidence(),
      provenanceRefs: ["pld_179_first"],
      derivedLineageRefs: [{ lineageKind: "request", lineageRef: "request_179_cas" }],
      actorRef: "patient_linker",
      observedAt: "2026-04-15T12:02:00Z",
    });

    const stale = await application.identityBindingAuthority.settleIdentityBindingCommand({
      commandId: "iba_command_179_stale",
      idempotencyKey: "idem_179_stale",
      subjectRef: "nhs_login_subject_179_cas",
      intentType: "claim_confirmed",
      expectedCurrentBindingVersionRef: null,
      patientLinkDecisionRef: "pld_179_stale",
      targetPatientRef: "patient_ref_179_b",
      confidence: confidence(),
      provenanceRefs: ["pld_179_stale"],
      actorRef: "support_console",
      observedAt: "2026-04-15T12:03:00Z",
    });

    expect(first.binding?.bindingVersion).toBe(1);
    expect(stale.binding).toBeNull();
    expect(stale.settlement.decision).toBe("cas_conflict");
    expect(stale.settlement.reasonCodes).toContain("BINDING_179_STALE_EXPECTED_VERSION");
    expect(repository.snapshots().bindings).toHaveLength(1);
    expect(repository.snapshots().currentPointers[0]?.currentPatientRef).toBe("patient_ref_179_a");
  });

  it("applies correction under repair authorization and supersedes the previous version", async () => {
    const { application, repository } = createHarness();
    const first = await application.identityBindingAuthority.settleIdentityBindingCommand({
      commandId: "iba_command_179_before_correction",
      idempotencyKey: "idem_179_before_correction",
      subjectRef: "nhs_login_subject_179_repair",
      intentType: "verified_bind",
      expectedCurrentBindingVersionRef: null,
      patientLinkDecisionRef: "pld_179_before_correction",
      candidatePatientRef: "patient_ref_179_a",
      confidence: confidence(),
      provenanceRefs: ["pld_179_before_correction"],
      derivedLineageRefs: [{ lineageKind: "request", lineageRef: "request_179_repair" }],
      actorRef: "patient_linker",
      observedAt: "2026-04-15T12:04:00Z",
    });
    await application.identityBindingAuthority.createFreezeHold({
      subjectRef: "nhs_login_subject_179_repair",
      reasonCodes: ["BINDING_179_IDENTITY_REPAIR_ACTIVE"],
      actorRef: "identity_repair",
      observedAt: "2026-04-15T12:05:00Z",
    });

    const correction = await application.identityBindingAuthority.settleIdentityBindingCommand({
      commandId: "iba_command_179_correction",
      idempotencyKey: "idem_179_correction",
      subjectRef: "nhs_login_subject_179_repair",
      intentType: "correction_applied",
      expectedCurrentBindingVersionRef: first.binding?.bindingVersionRef,
      patientLinkDecisionRef: "pld_179_correction",
      targetPatientRef: "patient_ref_179_corrected",
      confidence: confidence({ gap_logit: 7.91 }),
      provenanceRefs: ["pld_179_correction", "repair_release_179"],
      derivedLineageRefs: [{ lineageKind: "request", lineageRef: "request_179_repair" }],
      actorRef: "identity_repair",
      repairAuthorized: true,
      observedAt: "2026-04-15T12:06:00Z",
    });

    expect(correction.settlement.decision).toBe("accepted");
    expect(correction.binding?.bindingState).toBe("corrected");
    expect(correction.binding?.supersedesBindingVersionRef).toBe(first.binding?.bindingVersionRef);
    expect(correction.currentPointer?.currentPatientRef).toBe("patient_ref_179_corrected");
    expect(correction.derivedPatientRefSettlements[0]?.previousPatientRef).toBe(
      "patient_ref_179_a",
    );
    expect(correction.settlement.reasonCodes).toContain("BINDING_179_REPAIR_AUTHORITY_RELEASED");
    expect(repository.snapshots().bindings).toHaveLength(2);
  });

  it("blocks ordinary commands while a repair freeze is active", async () => {
    const { application, repository } = createHarness();
    await application.identityBindingAuthority.createFreezeHold({
      subjectRef: "nhs_login_subject_179_frozen",
      reasonCodes: ["BINDING_179_IDENTITY_REPAIR_ACTIVE"],
      actorRef: "support_console",
      observedAt: "2026-04-15T12:07:00Z",
    });

    const blocked = await application.identityBindingAuthority.settleIdentityBindingCommand({
      commandId: "iba_command_179_freeze_block",
      idempotencyKey: "idem_179_freeze_block",
      subjectRef: "nhs_login_subject_179_frozen",
      intentType: "verified_bind",
      expectedCurrentBindingVersionRef: null,
      patientLinkDecisionRef: "pld_179_freeze_block",
      candidatePatientRef: "patient_ref_179_a",
      confidence: confidence(),
      provenanceRefs: ["pld_179_freeze_block"],
      actorRef: "patient_linker",
      observedAt: "2026-04-15T12:08:00Z",
    });

    expect(blocked.settlement.decision).toBe("freeze_blocked");
    expect(blocked.binding).toBeNull();
    expect(blocked.settlement.reasonCodes).toContain("BINDING_179_FREEZE_ACTIVE_REFUSED");
    expect(repository.snapshots().bindings).toHaveLength(0);
  });

  it("revokes the current binding and clears derived patient refs through the authority transaction", async () => {
    const { application } = createHarness();
    const first = await application.identityBindingAuthority.settleIdentityBindingCommand({
      commandId: "iba_command_179_before_revocation",
      idempotencyKey: "idem_179_before_revocation",
      subjectRef: "nhs_login_subject_179_revoke",
      intentType: "verified_bind",
      expectedCurrentBindingVersionRef: null,
      patientLinkDecisionRef: "pld_179_before_revocation",
      candidatePatientRef: "patient_ref_179_a",
      confidence: confidence(),
      provenanceRefs: ["pld_179_before_revocation"],
      derivedLineageRefs: [{ lineageKind: "episode", lineageRef: "episode_179_revoke" }],
      actorRef: "patient_linker",
      observedAt: "2026-04-15T12:09:00Z",
    });

    const revoked = await application.identityBindingAuthority.settleIdentityBindingCommand({
      commandId: "iba_command_179_revoked",
      idempotencyKey: "idem_179_revoked",
      subjectRef: "nhs_login_subject_179_revoke",
      intentType: "revoked",
      expectedCurrentBindingVersionRef: first.binding?.bindingVersionRef,
      patientLinkDecisionRef: "pld_179_revoked",
      confidence: confidence({ P_link: 0, LCB_link_alpha: 0, P_subject: 0, LCB_subject_alpha: 0 }),
      provenanceRefs: ["repair_signal_179_revoked"],
      derivedLineageRefs: [{ lineageKind: "episode", lineageRef: "episode_179_revoke" }],
      actorRef: "identity_repair",
      observedAt: "2026-04-15T12:10:00Z",
    });

    expect(revoked.binding?.bindingState).toBe("revoked");
    expect(revoked.currentPointer?.currentPatientRef).toBeNull();
    expect(revoked.derivedPatientRefSettlements[0]?.nextPatientRef).toBeNull();
    expect(revoked.settlement.reasonCodes).toContain("BINDING_179_REVOKED");
  });
});
