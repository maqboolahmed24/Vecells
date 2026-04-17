import { describe, expect, it } from "vitest";
import {
  CONTACT_PREFERENCE_SEPARATION_RULESET_REF,
  createInMemoryIdentityBindingAuthorityIntentPort,
  createInMemoryPatientLinkerRepository,
  createPatientLinkerApplication,
  createReferenceOnlyPdsEnrichmentProvider,
  patientLinkerMigrationPlanRefs,
  patientLinkerParallelInterfaceGaps,
  patientLinkerPersistenceTables,
} from "../src/patient-linker.ts";

function createPatientIndex(overrides = []) {
  return [
    {
      candidatePatientRef: "patient_ref_178_a",
      candidateLabel: "Candidate A",
      localPatientReferenceFixtureRef: "local_patient_reference_fixture_178_a",
      rawEvidenceRefs: ["iev_patient_fixture_178_a"],
      patientPreferredCommsRef: "patient_preferred_comms_ref_178_a",
      searchAttributes: {
        nhsNumberHashExact: "sha256:nhs-number-hash-178-a",
        dateOfBirth: "1980-04-15",
        normalizedFamilyName: "atlas",
        normalizedGivenName: "casey",
        postcodePrefix: "ab12",
        addressTokenSet: ["north", "practice", "lane"],
        contactClaimDigest: "sha256:contact-claim-178-a",
        pdsDemographicRef: "pds_demo_ref_178_a",
      },
    },
    ...overrides,
  ];
}

function createSubjectEvidence(overrides = {}) {
  return {
    subjectRef: "nhs_login_subject_178",
    rawEvidenceRefs: ["iev_auth_claim_178", "iev_userinfo_178"],
    provenanceSources: ["nhs_login_claim_digest"],
    sourceReliability: 0.99,
    stepUpEvidenceRefs: ["session_step_up_178"],
    contactPreferenceSeparationRef: CONTACT_PREFERENCE_SEPARATION_RULESET_REF,
    searchAttributes: {
      nhsNumberHashExact: "sha256:nhs-number-hash-178-a",
      dateOfBirth: "1980-04-15",
      normalizedFamilyName: "atlas",
      normalizedGivenName: "casey",
      postcodePrefix: "ab12",
      addressTokenSet: ["north", "practice", "lane"],
      contactClaimDigest: "sha256:contact-claim-178-a",
      pdsDemographicRef: "pds_demo_ref_178_a",
    },
    ...overrides,
  };
}

function createHarness(options = {}) {
  const repository = createInMemoryPatientLinkerRepository({
    patientIndex: options.patientIndex ?? createPatientIndex(),
  });
  const bindingAuthorityIntentPort = createInMemoryIdentityBindingAuthorityIntentPort();
  const application = createPatientLinkerApplication({
    repository,
    bindingAuthorityIntentPort,
    pdsProvider: options.pdsProvider,
    calibrationRepository: options.calibrationRepository,
  });
  return { application, repository, bindingAuthorityIntentPort };
}

describe("patient linker pipeline", () => {
  it("creates calibrated verified PatientLinkDecision records without mutating patientRef directly", async () => {
    const { application, repository, bindingAuthorityIntentPort } = createHarness();

    const result = await application.patientLinker.evaluatePatientLink({
      subjectEvidence: createSubjectEvidence(),
      routeSensitivityFamily: "authenticated_request_status",
      actorRef: "auth_bridge",
      purpose: "patient_linker",
      observedAt: "2026-04-15T11:30:00Z",
    });
    const snapshots = repository.snapshots();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/093_phase2_patient_linker.sql",
    );
    expect(application.migrationPlanRefs).toEqual(patientLinkerMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(patientLinkerPersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(patientLinkerParallelInterfaceGaps);
    expect(result.decision.schemaVersion).toBe("172.phase2.patient-link.v1");
    expect(result.decision.linkState).toBe("verified_patient");
    expect(result.decision.decisionClass).toBe("verified_bind");
    expect(result.decision.identityBindingAuthorityIntent).toBe("submit_verified_bind");
    expect(result.decision.P_link).toBeGreaterThan(0.97);
    expect(result.decision.LCB_link_alpha).toBeGreaterThan(0.97);
    expect(result.decision.LCB_subject_alpha).toBeGreaterThan(0.97);
    expect(result.decision.runnerUpProbabilityUpperBound).toBe(0);
    expect(result.decision.autoLinkChecks.policyAllowsAutoLink).toBe(true);
    expect(result.candidateSearchSpec.searchBoundaries.freeTextRummaging).toBe("forbidden");
    expect(result.candidateSearchSpec.searchBoundaries.routeLocalHeuristics).toBe("forbidden");
    expect(result.evidenceBases[0]?.rawEvidenceRefs).toContain("iev_auth_claim_178");
    expect(snapshots.decisions).toHaveLength(1);
    expect(snapshots.authorityIntents[0]?.intentKind).toBe("submit_verified_bind");
    expect(bindingAuthorityIntentPort.snapshots().intents).toHaveLength(1);
    expect(JSON.stringify(snapshots)).not.toContain("Request.patientRef");
    expect(JSON.stringify(snapshots)).not.toContain("Episode.patientRef");
  });

  it("keeps strong draft-start matches provisional when route policy disallows auto-link", async () => {
    const { application } = createHarness();

    const result = await application.patientLinker.evaluatePatientLink({
      subjectEvidence: createSubjectEvidence(),
      routeSensitivityFamily: "signed_in_draft_start",
      actorRef: "session_governor",
      purpose: "patient_linker",
      observedAt: "2026-04-15T11:31:00Z",
    });

    expect(result.decision.linkState).toBe("provisional_verified");
    expect(result.decision.decisionClass).toBe("provisional_verify");
    expect(result.decision.identityBindingAuthorityIntent).toBe("submit_provisional_verify");
    expect(result.decision.autoLinkChecks.policyAllowsAutoLink).toBe(false);
    expect(result.patientFacingState).toBe("details_found_confirmation_needed");
    expect(result.authorityIntent.reasonCodes).toContain(
      "LINK_172_LINKER_RECOMMENDS_AUTHORITY_SETTLES",
    );
  });

  it("fails closed when a runner-up remains too competitive", async () => {
    const runnerUp = {
      candidatePatientRef: "patient_ref_178_runner",
      candidateLabel: "Candidate Runner",
      localPatientReferenceFixtureRef: "local_patient_reference_fixture_178_runner",
      rawEvidenceRefs: ["iev_patient_fixture_178_runner"],
      patientPreferredCommsRef: "patient_preferred_comms_ref_178_runner",
      searchAttributes: {
        nhsNumberHashExact: "sha256:nhs-number-hash-178-a",
        dateOfBirth: "1980-04-15",
        normalizedFamilyName: "atlas",
        normalizedGivenName: "casey",
        postcodePrefix: "ab12",
        addressTokenSet: ["north", "practice", "lane"],
        contactClaimDigest: "sha256:contact-claim-178-a",
        pdsDemographicRef: "pds_demo_ref_178_runner",
      },
    };
    const { application } = createHarness({ patientIndex: createPatientIndex([runnerUp]) });

    const result = await application.patientLinker.evaluatePatientLink({
      subjectEvidence: createSubjectEvidence(),
      routeSensitivityFamily: "authenticated_request_status",
      actorRef: "auth_bridge",
      purpose: "patient_linker",
      observedAt: "2026-04-15T11:32:00Z",
    });

    expect(result.candidates).toHaveLength(2);
    expect(result.decision.linkState).toBe("ambiguous");
    expect(result.decision.decisionClass).toBe("manual_review_required");
    expect(result.decision.identityBindingAuthorityIntent).toBe("submit_candidate_refresh");
    expect(result.decision.runnerUpProbabilityUpperBound).toBeGreaterThan(0.9);
    expect(result.decision.gap_logit).toBeLessThan(1);
    expect(result.decision.reasonCodes).toContain("LINK_172_RUNNER_UP_TOO_CLOSE");
  });

  it("treats missing calibration as out-of-domain instead of auto-linking", async () => {
    const { application } = createHarness({
      calibrationRepository: {
        async getProfile() {
          return null;
        },
      },
    });

    const result = await application.patientLinker.evaluatePatientLink({
      subjectEvidence: createSubjectEvidence(),
      routeSensitivityFamily: "authenticated_request_status",
      actorRef: "auth_bridge",
      purpose: "patient_linker",
      observedAt: "2026-04-15T11:33:00Z",
    });

    expect(result.decision.confidenceModelState).toBe("out_of_domain");
    expect(result.decision.linkState).toBe("ambiguous");
    expect(result.decision.identityBindingAuthorityIntent).toBe("submit_candidate_refresh");
    expect(result.decision.P_link).toBe(0);
    expect(result.decision.reasonCodes).toContain("LINK_172_CALIBRATION_MISSING_FAIL_CLOSED");
  });

  it("keeps PDS optional and preserves contact-claim preference separation", async () => {
    const { application, repository } = createHarness({
      pdsProvider: createReferenceOnlyPdsEnrichmentProvider("pds_demo_ref_178_a"),
    });

    const result = await application.patientLinker.evaluatePatientLink({
      subjectEvidence: createSubjectEvidence({
        searchAttributes: {
          ...createSubjectEvidence().searchAttributes,
          pdsDemographicRef: null,
        },
      }),
      routeSensitivityFamily: "signed_in_draft_start",
      actorRef: "pds_enrichment_provider",
      purpose: "patient_linker",
      enablePdsEnrichment: true,
      pdsLegalBasisEvidenceRef: "legal_basis_ref_178",
      observedAt: "2026-04-15T11:34:00Z",
    });
    const snapshots = repository.snapshots();

    expect(result.pdsOutcome.status).toBe("enriched");
    expect(result.pdsOutcome.reasonCodes).toContain("LINK_172_PDS_ENRICHMENT_REFERENCE_ONLY");
    expect(result.candidateSearchSpec.ignoredSearchKeys).toContainEqual({
      searchKey: "patientPreferredComms",
      ignoreReasonCode: "LINK_172_PATIENT_PREFS_DO_NOT_PROVE_IDENTITY",
    });
    expect(
      result.evidenceBases[0]?.provenancePenalties.map((penalty) => penalty.reasonCode),
    ).toContain("LINK_172_CONTACT_CLAIM_PROVENANCE_PENALTY");
    expect(JSON.stringify(snapshots)).not.toContain("patientPreferredCommsOverwrite");
  });

  it("emits a no-candidate candidate-refresh decision in limited mode", async () => {
    const { application } = createHarness({ patientIndex: [] });

    const result = await application.patientLinker.evaluatePatientLink({
      subjectEvidence: createSubjectEvidence(),
      routeSensitivityFamily: "sms_continuation",
      actorRef: "telephony_edge",
      purpose: "patient_linker",
      observedAt: "2026-04-15T11:35:00Z",
    });

    expect(result.candidates).toHaveLength(0);
    expect(result.decision.linkState).toBe("none");
    expect(result.decision.decisionClass).toBe("candidate_refresh");
    expect(result.decision.identityBindingAuthorityIntent).toBe("submit_candidate_refresh");
    expect(result.decision.reasonCodes).toContain("LINK_172_NO_CANDIDATE_LIMITED_MODE");
    expect(result.patientFacingState).toBe("limited_or_provisional_mode");
  });
});
