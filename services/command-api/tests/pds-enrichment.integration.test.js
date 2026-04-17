import { describe, expect, it } from "vitest";
import {
  PDS_ENRICHMENT_POLICY_VERSION,
  PdsAdapterTimeoutError,
  createPdsEnrichmentApplication,
  createPdsFhirAdapter,
  pdsEnrichmentMigrationPlanRefs,
  pdsEnrichmentParallelInterfaceGaps,
  pdsEnrichmentPersistenceTables,
} from "../src/pds-enrichment.ts";

function enabledPolicy(overrides = {}) {
  return {
    accessMode: "sandbox",
    enabledByDefault: false,
    allowedEnvironments: ["test", "staging"],
    enabledTenants: ["tenant_183"],
    approvedRouteFamilies: ["signed_in_draft_start", "authenticated_request_status"],
    allowedLegalBasisModes: ["direct_care", "service_relationship"],
    onboarding: {
      pdsFhirDigitalOnboardingComplete: true,
      pdsAccessApproved: true,
      dsptComplete: true,
      secureNetworkApproved: true,
      purposeUseCaseRef: "pds_use_case_183",
      notificationsOnboarded: true,
    },
    endpointRef: "secret-ref:pds-endpoint-183",
    credentialSecretRef: "secret-ref:pds-credential-183",
    timeoutMs: 100,
    cacheTtlSeconds: 60,
    staleCacheGraceSeconds: 3600,
    notificationsEnabled: true,
    circuitBreaker: {
      state: "closed",
      failureCount: 0,
      openedAt: null,
    },
    ...overrides,
  };
}

function enrichmentInput(overrides = {}) {
  return {
    idempotencyKey: "pds_183_enrich",
    subjectRef: "nhs_subject_183",
    tenantRef: "tenant_183",
    environment: "test",
    routeSensitivityFamily: "authenticated_request_status",
    requestedOperation: "search_patient",
    localEvidenceRefs: ["iev_local_183"],
    nhsLoginSubjectClaimRefs: ["nhs_login_claim_ref_183"],
    legalBasisEvidenceRef: "legal_basis_183_direct_care",
    legalBasisMode: "direct_care",
    queryAttributes: {
      nhsNumberHash: "sha256:local-nhs-number-hash-183",
      dateOfBirthHash: "sha256:dob-hash-183",
      familyNameDigest: "sha256:name-hash-183",
      postcodePrefixDigest: "sha256:postcode-hash-183",
    },
    featureFlagEnabled: true,
    observedAt: "2026-04-15T08:00:00.000Z",
    ...overrides,
  };
}

function patientResource(overrides = {}) {
  return {
    resourceType: "Patient",
    id: "raw-pds-record-183",
    identifier: [
      {
        system: "https://fhir.nhs.uk/Id/nhs-number",
        value: "9999999999",
      },
    ],
    birthDate: "1985-02-20",
    name: [
      {
        family: "Rawfamily",
        given: ["Rawgiven"],
      },
    ],
    address: [
      {
        postalCode: "ZZ1 1ZZ",
        line: ["1 Raw Street"],
      },
    ],
    generalPractitioner: [
      {
        identifier: {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: "A12345",
        },
      },
    ],
    meta: {
      versionId: "version-183",
      lastUpdated: "2026-04-14T10:00:00.000Z",
    },
    ...overrides,
  };
}

function createAdapterHarness(transportBehavior) {
  const calls = [];
  const adapter = createPdsFhirAdapter({
    async fetchPatient(input) {
      calls.push(input);
      return transportBehavior(input);
    },
  });
  return { adapter, calls };
}

describe("PdsEnrichmentOrchestrator optional PDS flow", () => {
  it("keeps disabled mode local-only and does not call the adapter", async () => {
    const { adapter, calls } = createAdapterHarness(() => patientResource());
    const application = createPdsEnrichmentApplication({ adapter });

    const result = await application.pdsEnrichmentOrchestrator.evaluateEnrichment(
      enrichmentInput({
        featureFlagEnabled: false,
        legalBasisEvidenceRef: null,
        legalBasisMode: "none",
      }),
    );

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/098_phase2_pds_enrichment.sql",
    );
    expect(application.migrationPlanRefs).toEqual(pdsEnrichmentMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(pdsEnrichmentPersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(pdsEnrichmentParallelInterfaceGaps);
    expect(application.policyVersion).toBe(PDS_ENRICHMENT_POLICY_VERSION);
    expect(result.gatingDecision.decisionState).toBe("disabled");
    expect(result.outcome.outcomeState).toBe("disabled");
    expect(result.outcome.localFlowContinuation).toBe("local_matching_only");
    expect(result.outcome.bindingMutationProhibited).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("blocks missing onboarding prerequisites before any provider call", async () => {
    const { adapter, calls } = createAdapterHarness(() => patientResource());
    const application = createPdsEnrichmentApplication({
      adapter,
      policy: enabledPolicy({
        onboarding: {
          ...enabledPolicy().onboarding,
          pdsFhirDigitalOnboardingComplete: false,
        },
      }),
    });

    const result =
      await application.pdsEnrichmentOrchestrator.evaluateEnrichment(enrichmentInput());

    expect(result.gatingDecision.decisionState).toBe("denied");
    expect(result.gatingDecision.reasonCodes).toContain("PDS_183_ONBOARDING_INCOMPLETE");
    expect(result.outcome.outcomeState).toBe("policy_denied");
    expect(calls).toHaveLength(0);
  });

  it("normalizes successful PDS FHIR responses while preserving provenance and data-class separation", async () => {
    const { adapter, calls } = createAdapterHarness(() => patientResource());
    const application = createPdsEnrichmentApplication({
      adapter,
      policy: enabledPolicy(),
    });

    const result =
      await application.pdsEnrichmentOrchestrator.evaluateEnrichment(enrichmentInput());
    const snapshots = application.repository.snapshots();

    expect(result.gatingDecision.decisionState).toBe("allowed");
    expect(result.outcome.outcomeState).toBe("enriched");
    expect(result.normalizedSnapshot.freshnessState).toBe("fresh");
    expect(result.normalizedSnapshot.provenance.provider).toBe("pds_fhir");
    expect(result.normalizedSnapshot.dataClassSeparation.authoritativeLocalBindingStateRef).toBe(
      null,
    );
    expect(result.normalizedSnapshot.dataClassSeparation.localMatchEvidenceRefs).toEqual([
      "iev_local_183",
    ]);
    expect(result.normalizedSnapshot.dataClassSeparation.nhsLoginSubjectClaimRefs).toEqual([
      "nhs_login_claim_ref_183",
    ]);
    expect(result.normalizedSnapshot.dataClassSeparation.communicationPreferenceRef).toBe(null);
    expect(result.outcome.reasonCodes).toContain("PDS_183_NO_DIRECT_BINDING_MUTATION");
    expect(result.outcome.reasonCodes).toContain("PDS_183_NHS_LOGIN_CONTACT_CLAIMS_SEPARATED");
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(snapshots)).not.toContain("9999999999");
    expect(JSON.stringify(snapshots)).not.toContain("Rawfamily");
    expect(JSON.stringify(snapshots)).not.toContain(".patientRef =");
    expect(JSON.stringify(snapshots)).not.toContain(".ownershipState =");
  });

  it("fails local-only on timeout and provider failure without direct binding mutation behavior", async () => {
    const { adapter } = createAdapterHarness(() => {
      throw new PdsAdapterTimeoutError();
    });
    const application = createPdsEnrichmentApplication({
      adapter,
      policy: enabledPolicy(),
    });

    const result = await application.pdsEnrichmentOrchestrator.evaluateEnrichment(
      enrichmentInput({ idempotencyKey: "pds_183_timeout" }),
    );

    expect(result.outcome.outcomeState).toBe("provider_unavailable");
    expect(result.outcome.freshnessState).toBe("not_available");
    expect(result.outcome.localFlowContinuation).toBe("local_matching_only");
    expect(result.outcome.reasonCodes).toContain("PDS_183_PROVIDER_TIMEOUT_FAIL_LOCAL_ONLY");
    expect(result.outcome.bindingMutationProhibited).toBe(true);
  });

  it("uses stale cache only as stale evidence after provider failure", async () => {
    const { adapter, calls } = createAdapterHarness(() => {
      if (calls.length === 1) {
        return patientResource();
      }
      throw new PdsAdapterTimeoutError();
    });
    const application = createPdsEnrichmentApplication({
      adapter,
      policy: enabledPolicy({
        cacheTtlSeconds: 1,
        staleCacheGraceSeconds: 3600,
      }),
    });

    const first = await application.pdsEnrichmentOrchestrator.evaluateEnrichment(
      enrichmentInput({
        idempotencyKey: "pds_183_cache_first",
        observedAt: "2026-04-15T08:00:00.000Z",
      }),
    );
    const second = await application.pdsEnrichmentOrchestrator.evaluateEnrichment(
      enrichmentInput({
        idempotencyKey: "pds_183_cache_second",
        observedAt: "2026-04-15T08:10:00.000Z",
      }),
    );

    expect(first.outcome.outcomeState).toBe("enriched");
    expect(second.outcome.outcomeState).toBe("stale_cache_used");
    expect(second.outcome.freshnessState).toBe("stale");
    expect(second.outcome.reasonCodes).toContain("PDS_183_STALE_CACHE_NOT_FRESH_EVIDENCE");
    expect(second.outcome.pdsProvenancePenalty).toBeGreaterThan(0);
    expect(calls).toHaveLength(2);
  });

  it("records PDS notification change signals as queued refreshes rather than state mutation", async () => {
    const application = createPdsEnrichmentApplication({
      policy: enabledPolicy(),
    });

    const result = await application.pdsEnrichmentOrchestrator.recordChangeSignal({
      idempotencyKey: "pds_183_notification",
      pdsRecordRef: "pds_record_183",
      tenantRef: "tenant_183",
      environment: "test",
      changeEventType: "address_change",
      notificationRef: "nems_notification_ref_183",
      featureFlagEnabled: true,
      observedAt: "2026-04-15T08:20:00.000Z",
    });
    const replay = await application.pdsEnrichmentOrchestrator.recordChangeSignal({
      idempotencyKey: "pds_183_notification",
      pdsRecordRef: "pds_record_183",
      tenantRef: "tenant_183",
      environment: "test",
      changeEventType: "address_change",
      notificationRef: "nems_notification_ref_183",
      featureFlagEnabled: true,
      observedAt: "2026-04-15T08:21:00.000Z",
    });

    expect(result.changeSignal.signalState).toBe("queued_refresh");
    expect(result.changeSignal.mutationProhibited).toBe(true);
    expect(result.changeSignal.reasonCodes).toContain("PDS_183_CHANGE_SIGNAL_QUEUED_NOT_MUTATED");
    expect(replay.replayed).toBe(true);
  });
});
