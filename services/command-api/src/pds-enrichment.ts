import { createHash } from "node:crypto";
import {
  PDS_ENRICHMENT_SEAM_REF,
  type PdsEnrichmentOutcome as PatientLinkerPdsEnrichmentOutcome,
  type PdsEnrichmentProvider,
  type PdsEnrichmentRequest as PatientLinkerPdsEnrichmentRequest,
  type RouteSensitivityFamily,
} from "./patient-linker";

export const PDS_ADAPTER_PORT_NAME = "PdsAdapter";
export const PDS_ENRICHMENT_ORCHESTRATOR_NAME = "PdsEnrichmentOrchestrator";
export const PDS_ENRICHMENT_SCHEMA_VERSION = "183.phase2.pds.v1";
export const PDS_ENRICHMENT_POLICY_VERSION = "phase2-pds-enrichment-v1";

export const pdsEnrichmentPersistenceTables = [
  "phase2_pds_gating_decisions",
  "phase2_pds_enrichment_requests",
  "phase2_pds_normalized_snapshots",
  "phase2_pds_enrichment_outcomes",
  "phase2_pds_change_signals",
  "phase2_pds_adapter_events",
] as const;

export const pdsEnrichmentMigrationPlanRefs = [
  "services/command-api/migrations/098_phase2_pds_enrichment.sql",
] as const;

export const pdsEnrichmentParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_PDS_PROVIDER_PORT_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PDS_FEATURE_FLAG_GATING_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PDS_ONBOARDING_LEGAL_BASIS_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PDS_DATA_CLASS_SEPARATION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PDS_NO_DIRECT_BINDING_AUTHORITY_BYPASS_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PDS_STALE_CACHE_FALLBACK_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_PDS_CHANGE_NOTIFICATION_SEAM_V1",
] as const;

export const PDS_ENRICHMENT_REASON_CODES = [
  "PDS_183_DISABLED_BY_DEFAULT",
  "PDS_183_ENVIRONMENT_NOT_ENABLED",
  "PDS_183_TENANT_NOT_ENABLED",
  "PDS_183_ONBOARDING_INCOMPLETE",
  "PDS_183_LEGAL_BASIS_MISSING",
  "PDS_183_SECRETS_OR_ENDPOINT_MISSING",
  "PDS_183_ROUTE_NOT_APPROVED",
  "PDS_183_CIRCUIT_OPEN_FAIL_LOCAL_ONLY",
  "PDS_183_PROVIDER_TIMEOUT_FAIL_LOCAL_ONLY",
  "PDS_183_PROVIDER_FAILURE_FAIL_LOCAL_ONLY",
  "PDS_183_RESPONSE_PARSING_DRIFT_FAIL_LOCAL_ONLY",
  "PDS_183_LOCAL_MATCHING_CONTINUES",
  "PDS_183_NORMALIZED_PROVENANCE_PRESERVED",
  "PDS_183_DATA_CLASSES_SEPARATED",
  "PDS_183_NO_DIRECT_BINDING_MUTATION",
  "PDS_183_NHS_LOGIN_CONTACT_CLAIMS_SEPARATED",
  "PDS_183_STALE_CACHE_NOT_FRESH_EVIDENCE",
  "PDS_183_CHANGE_SIGNAL_QUEUED_NOT_MUTATED",
] as const;

export type PdsEnvironment = "local" | "development" | "test" | "staging" | "production";
export type PdsAccessMode = "disabled" | "sandbox" | "live";
export type PdsLegalBasisMode = "direct_care" | "service_relationship" | "manual_review" | "none";
export type PdsLookupOperation =
  | "search_patient"
  | "retrieve_by_nhs_number"
  | "notification_refresh";
export type PdsGatingDecisionState =
  | "allowed"
  | "disabled"
  | "denied"
  | "legal_basis_missing"
  | "circuit_open";
export type PdsAdapterResultState =
  | "matched"
  | "not_found"
  | "timeout"
  | "provider_error"
  | "parse_error"
  | "not_configured";
export type PdsEnrichmentOutcomeState =
  | "disabled"
  | "policy_denied"
  | "legal_basis_missing"
  | "provider_unavailable"
  | "parse_error"
  | "cache_fresh"
  | "stale_cache_used"
  | "enriched";
export type PdsFreshnessState = "fresh" | "stale" | "not_available";
export type PdsChangeSignalState = "ignored_disabled" | "queued_refresh" | "manual_review_only";

export interface PdsOnboardingReadiness {
  readonly pdsFhirDigitalOnboardingComplete: boolean;
  readonly pdsAccessApproved: boolean;
  readonly dsptComplete: boolean;
  readonly secureNetworkApproved: boolean;
  readonly purposeUseCaseRef: string | null;
  readonly notificationsOnboarded: boolean;
}

export interface PdsCircuitBreakerPolicy {
  readonly state: "closed" | "open";
  readonly failureCount: number;
  readonly openedAt: string | null;
}

export interface PdsEnrichmentPolicy {
  readonly accessMode: PdsAccessMode;
  readonly enabledByDefault: false;
  readonly allowedEnvironments: readonly PdsEnvironment[];
  readonly enabledTenants: readonly string[];
  readonly approvedRouteFamilies: readonly RouteSensitivityFamily[];
  readonly allowedLegalBasisModes: readonly PdsLegalBasisMode[];
  readonly onboarding: PdsOnboardingReadiness;
  readonly endpointRef: string | null;
  readonly credentialSecretRef: string | null;
  readonly timeoutMs: number;
  readonly cacheTtlSeconds: number;
  readonly staleCacheGraceSeconds: number;
  readonly notificationsEnabled: boolean;
  readonly circuitBreaker: PdsCircuitBreakerPolicy;
}

export interface PdsEnrichmentQueryAttributes {
  readonly nhsNumberHash?: string | null;
  readonly dateOfBirthHash?: string | null;
  readonly familyNameDigest?: string | null;
  readonly givenNameDigest?: string | null;
  readonly postcodePrefixDigest?: string | null;
  readonly addressDigest?: string | null;
}

export interface PdsGatingDecisionRecord {
  readonly gatingDecisionRef: string;
  readonly schemaVersion: typeof PDS_ENRICHMENT_SCHEMA_VERSION;
  readonly policyVersion: typeof PDS_ENRICHMENT_POLICY_VERSION;
  readonly subjectRef: string;
  readonly tenantRef: string;
  readonly environment: PdsEnvironment;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly requestedOperation: PdsLookupOperation;
  readonly decisionState: PdsGatingDecisionState;
  readonly accessMode: PdsAccessMode;
  readonly featureFlagEnabled: boolean;
  readonly onboardingReady: boolean;
  readonly legalBasisSatisfied: boolean;
  readonly endpointConfigured: boolean;
  readonly routeApproved: boolean;
  readonly localFlowContinuation: "local_matching_only" | "pds_enrichment_allowed";
  readonly reasonCodes: readonly string[];
  readonly decidedAt: string;
  readonly createdByAuthority: typeof PDS_ENRICHMENT_ORCHESTRATOR_NAME;
}

export interface PdsEnrichmentRequestRecord {
  readonly pdsEnrichmentRequestRef: string;
  readonly idempotencyKey: string;
  readonly schemaVersion: typeof PDS_ENRICHMENT_SCHEMA_VERSION;
  readonly policyVersion: typeof PDS_ENRICHMENT_POLICY_VERSION;
  readonly subjectRef: string;
  readonly tenantRef: string;
  readonly environment: PdsEnvironment;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly requestedOperation: PdsLookupOperation;
  readonly localEvidenceRefs: readonly string[];
  readonly legalBasisEvidenceRef: string | null;
  readonly legalBasisMode: PdsLegalBasisMode;
  readonly queryDigest: string;
  readonly gatingDecisionRef: string;
  readonly requestedAt: string;
  readonly createdByAuthority: typeof PDS_ENRICHMENT_ORCHESTRATOR_NAME;
}

export interface PdsNormalizedDemographicSnapshot {
  readonly pdsDemographicsRef: string;
  readonly schemaVersion: typeof PDS_ENRICHMENT_SCHEMA_VERSION;
  readonly policyVersion: typeof PDS_ENRICHMENT_POLICY_VERSION;
  readonly subjectRef: string;
  readonly tenantRef: string;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly pdsRecordRef: string;
  readonly pdsRecordVersionRef: string | null;
  readonly pdsSourceLastUpdatedAt: string | null;
  readonly cachedAt: string;
  readonly expiresAt: string;
  readonly staleAfter: string;
  readonly freshnessState: PdsFreshnessState;
  readonly normalizedDemographicDigest: string;
  readonly demographicEvidence: {
    readonly nhsNumberHash: string | null;
    readonly dateOfBirthHash: string | null;
    readonly nameDigest: string | null;
    readonly addressDigest: string | null;
    readonly postcodePrefixDigest: string | null;
    readonly registeredGpPracticeRef: string | null;
  };
  readonly provenance: {
    readonly provider: "pds_fhir";
    readonly accessMode: PdsAccessMode;
    readonly legalBasisEvidenceRef: string;
    readonly endpointRef: string;
    readonly sourceRefs: readonly string[];
    readonly retrievedAt: string;
  };
  readonly dataClassSeparation: {
    readonly authoritativeLocalBindingStateRef: null;
    readonly localMatchEvidenceRefs: readonly string[];
    readonly nhsLoginSubjectClaimRefs: readonly string[];
    readonly pdsDemographicEvidenceRef: string;
    readonly communicationPreferenceRef: null;
    readonly changeNotificationRefs: readonly string[];
  };
  readonly createdByAuthority: typeof PDS_ENRICHMENT_ORCHESTRATOR_NAME;
}

export interface PdsEnrichmentOutcomeRecord {
  readonly pdsEnrichmentOutcomeRef: string;
  readonly pdsEnrichmentRequestRef: string;
  readonly gatingDecisionRef: string;
  readonly outcomeState: PdsEnrichmentOutcomeState;
  readonly pdsLookupOutcome:
    | "not_called"
    | "provider_unavailable"
    | "cache_returned"
    | "reference_returned";
  readonly pdsDemographicsRef: string | null;
  readonly freshnessState: PdsFreshnessState;
  readonly pdsProvenancePenalty: number;
  readonly bindingMutationProhibited: true;
  readonly localFlowContinuation: "local_matching_only" | "pds_enrichment_available";
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
  readonly createdByAuthority: typeof PDS_ENRICHMENT_ORCHESTRATOR_NAME;
}

export interface PdsAdapterPatientDemographics {
  readonly pdsRecordRef: string;
  readonly pdsRecordVersionRef: string | null;
  readonly pdsSourceLastUpdatedAt: string | null;
  readonly nhsNumberHash: string | null;
  readonly dateOfBirthHash: string | null;
  readonly nameDigest: string | null;
  readonly addressDigest: string | null;
  readonly postcodePrefixDigest: string | null;
  readonly registeredGpPracticeRef: string | null;
  readonly sourceRefs: readonly string[];
}

export interface PdsAdapterLookupInput {
  readonly requestRef: string;
  readonly subjectRef: string;
  readonly tenantRef: string;
  readonly environment: PdsEnvironment;
  readonly endpointRef: string;
  readonly credentialSecretRef: string;
  readonly requestedOperation: PdsLookupOperation;
  readonly queryAttributes: PdsEnrichmentQueryAttributes;
  readonly timeoutMs: number;
  readonly observedAt: string;
}

export interface PdsAdapterLookupResult {
  readonly adapterResultRef: string;
  readonly state: PdsAdapterResultState;
  readonly providerRequestRef: string | null;
  readonly patient: PdsAdapterPatientDemographics | null;
  readonly reasonCodes: readonly string[];
  readonly observedAt: string;
}

export interface PdsAdapter {
  readonly lookupDemographics: (input: PdsAdapterLookupInput) => Promise<PdsAdapterLookupResult>;
}

export interface PdsFhirPatientResource {
  readonly resourceType?: string;
  readonly id?: string;
  readonly identifier?: readonly {
    readonly system?: string;
    readonly value?: string;
  }[];
  readonly birthDate?: string;
  readonly name?: readonly {
    readonly family?: string;
    readonly given?: readonly string[];
  }[];
  readonly address?: readonly {
    readonly postalCode?: string;
    readonly line?: readonly string[];
  }[];
  readonly generalPractitioner?: readonly {
    readonly identifier?: {
      readonly system?: string;
      readonly value?: string;
    };
    readonly reference?: string;
  }[];
  readonly meta?: {
    readonly versionId?: string;
    readonly lastUpdated?: string;
  };
}

export interface PdsFhirTransport {
  readonly fetchPatient: (input: {
    readonly endpointRef: string;
    readonly credentialSecretRef: string;
    readonly requestedOperation: PdsLookupOperation;
    readonly queryAttributes: PdsEnrichmentQueryAttributes;
    readonly requestRef: string;
    readonly timeoutMs: number;
  }) => Promise<PdsFhirPatientResource | null>;
}

export interface PdsChangeSignalRecord {
  readonly changeSignalRef: string;
  readonly idempotencyKey: string;
  readonly pdsRecordRef: string;
  readonly tenantRef: string;
  readonly environment: PdsEnvironment;
  readonly changeEventType: "birth" | "death" | "address_change" | "gp_change" | "record_change";
  readonly notificationRef: string;
  readonly signalState: PdsChangeSignalState;
  readonly queuedRefreshRef: string | null;
  readonly mutationProhibited: true;
  readonly reasonCodes: readonly string[];
  readonly receivedAt: string;
  readonly createdByAuthority: typeof PDS_ENRICHMENT_ORCHESTRATOR_NAME;
}

export interface PdsAdapterEventRecord {
  readonly eventRef: string;
  readonly eventName:
    | "pds.gating_decision.recorded"
    | "pds.enrichment.completed"
    | "pds.enrichment.fallback"
    | "pds.change_signal.recorded";
  readonly subjectRef: string | null;
  readonly occurredAt: string;
  readonly payloadHash: string;
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof PDS_ENRICHMENT_ORCHESTRATOR_NAME;
}

export interface PdsEnrichmentRepositorySnapshots {
  readonly gatingDecisions: readonly PdsGatingDecisionRecord[];
  readonly requests: readonly PdsEnrichmentRequestRecord[];
  readonly normalizedSnapshots: readonly PdsNormalizedDemographicSnapshot[];
  readonly outcomes: readonly PdsEnrichmentOutcomeRecord[];
  readonly changeSignals: readonly PdsChangeSignalRecord[];
  readonly adapterEvents: readonly PdsAdapterEventRecord[];
}

export interface PdsEnrichmentRepository {
  readonly getOutcomeByIdempotencyKey: (idempotencyKey: string) => {
    readonly request: PdsEnrichmentRequestRecord;
    readonly gatingDecision: PdsGatingDecisionRecord;
    readonly outcome: PdsEnrichmentOutcomeRecord;
    readonly normalizedSnapshot: PdsNormalizedDemographicSnapshot | null;
  } | null;
  readonly saveGatingDecision: (decision: PdsGatingDecisionRecord) => void;
  readonly saveRequest: (request: PdsEnrichmentRequestRecord) => void;
  readonly saveSnapshot: (snapshot: PdsNormalizedDemographicSnapshot) => void;
  readonly saveOutcome: (outcome: PdsEnrichmentOutcomeRecord) => void;
  readonly findSnapshotByCacheKey: (cacheKey: string) => PdsNormalizedDemographicSnapshot | null;
  readonly saveChangeSignal: (signal: PdsChangeSignalRecord) => void;
  readonly getChangeSignalByIdempotencyKey: (
    idempotencyKey: string,
  ) => PdsChangeSignalRecord | null;
  readonly appendEvent: (event: PdsAdapterEventRecord) => void;
  readonly snapshots: () => PdsEnrichmentRepositorySnapshots;
}

export interface EvaluatePdsEnrichmentInput {
  readonly idempotencyKey: string;
  readonly subjectRef: string;
  readonly tenantRef: string;
  readonly environment: PdsEnvironment;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly requestedOperation: PdsLookupOperation;
  readonly localEvidenceRefs: readonly string[];
  readonly nhsLoginSubjectClaimRefs?: readonly string[];
  readonly legalBasisEvidenceRef?: string | null;
  readonly legalBasisMode?: PdsLegalBasisMode;
  readonly queryAttributes: PdsEnrichmentQueryAttributes;
  readonly featureFlagEnabled?: boolean;
  readonly observedAt?: string;
}

export interface EvaluatePdsEnrichmentResult {
  readonly request: PdsEnrichmentRequestRecord;
  readonly gatingDecision: PdsGatingDecisionRecord;
  readonly normalizedSnapshot: PdsNormalizedDemographicSnapshot | null;
  readonly outcome: PdsEnrichmentOutcomeRecord;
  readonly replayed: boolean;
}

export interface RecordPdsChangeSignalInput {
  readonly idempotencyKey: string;
  readonly pdsRecordRef: string;
  readonly tenantRef: string;
  readonly environment: PdsEnvironment;
  readonly changeEventType: PdsChangeSignalRecord["changeEventType"];
  readonly notificationRef: string;
  readonly featureFlagEnabled?: boolean;
  readonly observedAt?: string;
}

export interface PdsEnrichmentOrchestrator {
  readonly evaluateEnrichment: (
    input: EvaluatePdsEnrichmentInput,
  ) => Promise<EvaluatePdsEnrichmentResult>;
  readonly recordChangeSignal: (input: RecordPdsChangeSignalInput) => Promise<{
    readonly changeSignal: PdsChangeSignalRecord;
    readonly replayed: boolean;
  }>;
}

export interface PdsEnrichmentApplication {
  readonly pdsEnrichmentOrchestrator: PdsEnrichmentOrchestrator;
  readonly repository: PdsEnrichmentRepository;
  readonly adapter: PdsAdapter;
  readonly policy: PdsEnrichmentPolicy;
  readonly patientLinkerProvider: PdsEnrichmentProvider;
  readonly migrationPlanRef: (typeof pdsEnrichmentMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof pdsEnrichmentMigrationPlanRefs;
  readonly persistenceTables: typeof pdsEnrichmentPersistenceTables;
  readonly parallelInterfaceGaps: typeof pdsEnrichmentParallelInterfaceGaps;
  readonly policyVersion: typeof PDS_ENRICHMENT_POLICY_VERSION;
}

export class PdsAdapterTimeoutError extends Error {
  constructor(message = "PDS adapter timeout") {
    super(message);
    this.name = "PdsAdapterTimeoutError";
  }
}

export const defaultPdsEnrichmentPolicy: PdsEnrichmentPolicy = Object.freeze({
  accessMode: "disabled",
  enabledByDefault: false,
  allowedEnvironments: Object.freeze([]),
  enabledTenants: Object.freeze([]),
  approvedRouteFamilies: Object.freeze([]),
  allowedLegalBasisModes: Object.freeze(["direct_care", "service_relationship"] as const),
  onboarding: Object.freeze({
    pdsFhirDigitalOnboardingComplete: false,
    pdsAccessApproved: false,
    dsptComplete: false,
    secureNetworkApproved: false,
    purposeUseCaseRef: null,
    notificationsOnboarded: false,
  }),
  endpointRef: null,
  credentialSecretRef: null,
  timeoutMs: 1500,
  cacheTtlSeconds: 900,
  staleCacheGraceSeconds: 86_400,
  notificationsEnabled: false,
  circuitBreaker: Object.freeze({
    state: "closed",
    failureCount: 0,
    openedAt: null,
  }),
});

export function createInMemoryPdsEnrichmentRepository(): PdsEnrichmentRepository {
  const gatingDecisions = new Map<string, PdsGatingDecisionRecord>();
  const requests = new Map<string, PdsEnrichmentRequestRecord>();
  const requestRefsByIdempotency = new Map<string, string>();
  const snapshotsByRef = new Map<string, PdsNormalizedDemographicSnapshot>();
  const snapshotRefsByCacheKey = new Map<string, string>();
  const outcomes = new Map<string, PdsEnrichmentOutcomeRecord>();
  const outcomeRefsByRequest = new Map<string, string>();
  const changeSignals = new Map<string, PdsChangeSignalRecord>();
  const changeSignalRefsByIdempotency = new Map<string, string>();
  const adapterEvents: PdsAdapterEventRecord[] = [];

  function resultForRequest(requestRef: string): {
    readonly request: PdsEnrichmentRequestRecord;
    readonly gatingDecision: PdsGatingDecisionRecord;
    readonly outcome: PdsEnrichmentOutcomeRecord;
    readonly normalizedSnapshot: PdsNormalizedDemographicSnapshot | null;
  } | null {
    const request = requests.get(requestRef);
    if (!request) {
      return null;
    }
    const outcomeRef = outcomeRefsByRequest.get(requestRef);
    const outcome = outcomeRef ? outcomes.get(outcomeRef) : undefined;
    const gatingDecision = gatingDecisions.get(request.gatingDecisionRef);
    if (!outcome || !gatingDecision) {
      return null;
    }
    return {
      request,
      gatingDecision,
      outcome,
      normalizedSnapshot: outcome.pdsDemographicsRef
        ? (snapshotsByRef.get(outcome.pdsDemographicsRef) ?? null)
        : null,
    };
  }

  return {
    getOutcomeByIdempotencyKey(idempotencyKey) {
      const requestRef = requestRefsByIdempotency.get(idempotencyKey);
      return requestRef ? resultForRequest(requestRef) : null;
    },
    saveGatingDecision(decision) {
      gatingDecisions.set(decision.gatingDecisionRef, decision);
    },
    saveRequest(request) {
      requests.set(request.pdsEnrichmentRequestRef, request);
      requestRefsByIdempotency.set(request.idempotencyKey, request.pdsEnrichmentRequestRef);
    },
    saveSnapshot(snapshot) {
      snapshotsByRef.set(snapshot.pdsDemographicsRef, snapshot);
      snapshotRefsByCacheKey.set(
        cacheKeyFor({
          subjectRef: snapshot.subjectRef,
          tenantRef: snapshot.tenantRef,
          routeSensitivityFamily: snapshot.routeSensitivityFamily,
          queryDigest: snapshot.normalizedDemographicDigest,
        }),
        snapshot.pdsDemographicsRef,
      );
    },
    saveOutcome(outcome) {
      outcomes.set(outcome.pdsEnrichmentOutcomeRef, outcome);
      outcomeRefsByRequest.set(outcome.pdsEnrichmentRequestRef, outcome.pdsEnrichmentOutcomeRef);
    },
    findSnapshotByCacheKey(cacheKey) {
      const snapshotRef = snapshotRefsByCacheKey.get(cacheKey);
      return snapshotRef ? (snapshotsByRef.get(snapshotRef) ?? null) : null;
    },
    saveChangeSignal(signal) {
      changeSignals.set(signal.changeSignalRef, signal);
      changeSignalRefsByIdempotency.set(signal.idempotencyKey, signal.changeSignalRef);
    },
    getChangeSignalByIdempotencyKey(idempotencyKey) {
      const signalRef = changeSignalRefsByIdempotency.get(idempotencyKey);
      return signalRef ? (changeSignals.get(signalRef) ?? null) : null;
    },
    appendEvent(event) {
      adapterEvents.push(event);
    },
    snapshots() {
      return {
        gatingDecisions: [...gatingDecisions.values()],
        requests: [...requests.values()],
        normalizedSnapshots: [...snapshotsByRef.values()],
        outcomes: [...outcomes.values()],
        changeSignals: [...changeSignals.values()],
        adapterEvents: [...adapterEvents],
      };
    },
  };
}

export function createPdsFhirAdapter(transport: PdsFhirTransport): PdsAdapter {
  return {
    async lookupDemographics(input) {
      try {
        const patient = await transport.fetchPatient({
          endpointRef: input.endpointRef,
          credentialSecretRef: input.credentialSecretRef,
          requestedOperation: input.requestedOperation,
          queryAttributes: input.queryAttributes,
          requestRef: input.requestRef,
          timeoutMs: input.timeoutMs,
        });
        if (!patient) {
          return adapterResult(input, "not_found", null, [
            "PDS_183_PROVIDER_FAILURE_FAIL_LOCAL_ONLY",
          ]);
        }
        if (patient.resourceType !== "Patient") {
          return adapterResult(input, "parse_error", null, [
            "PDS_183_RESPONSE_PARSING_DRIFT_FAIL_LOCAL_ONLY",
          ]);
        }
        const normalized = normalizeFhirPatient(patient);
        return adapterResult(input, "matched", normalized, [
          "PDS_183_NORMALIZED_PROVENANCE_PRESERVED",
          "PDS_183_DATA_CLASSES_SEPARATED",
        ]);
      } catch (error) {
        if (error instanceof PdsAdapterTimeoutError) {
          return adapterResult(input, "timeout", null, [
            "PDS_183_PROVIDER_TIMEOUT_FAIL_LOCAL_ONLY",
          ]);
        }
        return adapterResult(input, "provider_error", null, [
          "PDS_183_PROVIDER_FAILURE_FAIL_LOCAL_ONLY",
        ]);
      }
    },
  };
}

export function createDisabledPdsAdapter(): PdsAdapter {
  return {
    async lookupDemographics(input) {
      return adapterResult(input, "not_configured", null, ["PDS_183_DISABLED_BY_DEFAULT"]);
    },
  };
}

export function createPdsEnrichmentApplication(options?: {
  readonly repository?: PdsEnrichmentRepository;
  readonly adapter?: PdsAdapter;
  readonly policy?: PdsEnrichmentPolicy;
}): PdsEnrichmentApplication {
  const repository = options?.repository ?? createInMemoryPdsEnrichmentRepository();
  const adapter = options?.adapter ?? createDisabledPdsAdapter();
  const policy = options?.policy ?? defaultPdsEnrichmentPolicy;
  const pdsEnrichmentOrchestrator = createPdsEnrichmentOrchestrator({
    repository,
    adapter,
    policy,
  });
  const patientLinkerProvider = createPatientLinkerPdsEnrichmentProvider({
    orchestrator: pdsEnrichmentOrchestrator,
  });
  return {
    pdsEnrichmentOrchestrator,
    repository,
    adapter,
    policy,
    patientLinkerProvider,
    migrationPlanRef: pdsEnrichmentMigrationPlanRefs[0],
    migrationPlanRefs: pdsEnrichmentMigrationPlanRefs,
    persistenceTables: pdsEnrichmentPersistenceTables,
    parallelInterfaceGaps: pdsEnrichmentParallelInterfaceGaps,
    policyVersion: PDS_ENRICHMENT_POLICY_VERSION,
  };
}

export function createPdsEnrichmentOrchestrator(options: {
  readonly repository: PdsEnrichmentRepository;
  readonly adapter: PdsAdapter;
  readonly policy: PdsEnrichmentPolicy;
}): PdsEnrichmentOrchestrator {
  const repository = options.repository;
  const adapter = options.adapter;
  const policy = options.policy;

  return {
    async evaluateEnrichment(input) {
      const replay = repository.getOutcomeByIdempotencyKey(input.idempotencyKey);
      if (replay) {
        return {
          ...replay,
          replayed: true,
        };
      }

      const observedAt = input.observedAt ?? new Date().toISOString();
      const queryDigest = digest(input.queryAttributes);
      const gatingDecision = evaluatePdsPolicy({
        input,
        policy,
        observedAt,
      });
      repository.saveGatingDecision(gatingDecision);
      const request: PdsEnrichmentRequestRecord = {
        pdsEnrichmentRequestRef: stableRef("pds_request", input.idempotencyKey),
        idempotencyKey: input.idempotencyKey,
        schemaVersion: PDS_ENRICHMENT_SCHEMA_VERSION,
        policyVersion: PDS_ENRICHMENT_POLICY_VERSION,
        subjectRef: input.subjectRef,
        tenantRef: input.tenantRef,
        environment: input.environment,
        routeSensitivityFamily: input.routeSensitivityFamily,
        requestedOperation: input.requestedOperation,
        localEvidenceRefs: [...input.localEvidenceRefs],
        legalBasisEvidenceRef: input.legalBasisEvidenceRef ?? null,
        legalBasisMode: input.legalBasisMode ?? "none",
        queryDigest,
        gatingDecisionRef: gatingDecision.gatingDecisionRef,
        requestedAt: observedAt,
        createdByAuthority: PDS_ENRICHMENT_ORCHESTRATOR_NAME,
      };
      repository.saveRequest(request);
      repository.appendEvent(
        createEvent("pds.gating_decision.recorded", input.subjectRef, gatingDecision),
      );

      const cacheKey = cacheKeyFor({
        subjectRef: input.subjectRef,
        tenantRef: input.tenantRef,
        routeSensitivityFamily: input.routeSensitivityFamily,
        queryDigest,
      });
      const cachedSnapshot = repository.findSnapshotByCacheKey(cacheKey);
      if (gatingDecision.decisionState !== "allowed") {
        const outcome = buildFallbackOutcome({
          request,
          gatingDecision,
          outcomeState:
            gatingDecision.decisionState === "legal_basis_missing"
              ? "legal_basis_missing"
              : gatingDecision.decisionState === "disabled"
                ? "disabled"
                : "policy_denied",
          settledAt: observedAt,
          reasonCodes: gatingDecision.reasonCodes,
        });
        repository.saveOutcome(outcome);
        repository.appendEvent(createEvent("pds.enrichment.fallback", input.subjectRef, outcome));
        return {
          request,
          gatingDecision,
          normalizedSnapshot: null,
          outcome,
          replayed: false,
        };
      }

      if (cachedSnapshot && snapshotFreshness(cachedSnapshot, observedAt) === "fresh") {
        const outcome = buildCacheOutcome({
          request,
          gatingDecision,
          snapshot: cachedSnapshot,
          outcomeState: "cache_fresh",
          settledAt: observedAt,
          reasonCodes: [
            "PDS_183_NORMALIZED_PROVENANCE_PRESERVED",
            "PDS_183_DATA_CLASSES_SEPARATED",
          ],
        });
        repository.saveOutcome(outcome);
        repository.appendEvent(createEvent("pds.enrichment.completed", input.subjectRef, outcome));
        return {
          request,
          gatingDecision,
          normalizedSnapshot: cachedSnapshot,
          outcome,
          replayed: false,
        };
      }

      const adapterResultValue = await adapter.lookupDemographics({
        requestRef: request.pdsEnrichmentRequestRef,
        subjectRef: input.subjectRef,
        tenantRef: input.tenantRef,
        environment: input.environment,
        endpointRef: policy.endpointRef ?? "missing_endpoint_ref",
        credentialSecretRef: policy.credentialSecretRef ?? "missing_secret_ref",
        requestedOperation: input.requestedOperation,
        queryAttributes: input.queryAttributes,
        timeoutMs: policy.timeoutMs,
        observedAt,
      });

      if (adapterResultValue.state === "matched" && adapterResultValue.patient) {
        const normalizedSnapshot = snapshotFromAdapterPatient({
          input,
          policy,
          request,
          patient: adapterResultValue.patient,
          queryDigest,
          observedAt,
        });
        repository.saveSnapshot(normalizedSnapshot);
        const outcome = buildCacheOutcome({
          request,
          gatingDecision,
          snapshot: normalizedSnapshot,
          outcomeState: "enriched",
          settledAt: observedAt,
          reasonCodes: [
            ...adapterResultValue.reasonCodes,
            "PDS_183_NO_DIRECT_BINDING_MUTATION",
            "PDS_183_NHS_LOGIN_CONTACT_CLAIMS_SEPARATED",
          ],
        });
        repository.saveOutcome(outcome);
        repository.appendEvent(createEvent("pds.enrichment.completed", input.subjectRef, outcome));
        return {
          request,
          gatingDecision,
          normalizedSnapshot,
          outcome,
          replayed: false,
        };
      }

      if (cachedSnapshot && snapshotFreshness(cachedSnapshot, observedAt) === "stale") {
        const staleSnapshot: PdsNormalizedDemographicSnapshot = {
          ...cachedSnapshot,
          freshnessState: "stale",
        };
        const outcome = buildCacheOutcome({
          request,
          gatingDecision,
          snapshot: staleSnapshot,
          outcomeState: "stale_cache_used",
          settledAt: observedAt,
          reasonCodes: [
            ...adapterResultValue.reasonCodes,
            "PDS_183_STALE_CACHE_NOT_FRESH_EVIDENCE",
            "PDS_183_LOCAL_MATCHING_CONTINUES",
          ],
        });
        repository.saveOutcome(outcome);
        repository.appendEvent(createEvent("pds.enrichment.fallback", input.subjectRef, outcome));
        return {
          request,
          gatingDecision,
          normalizedSnapshot: staleSnapshot,
          outcome,
          replayed: false,
        };
      }

      const outcome = buildFallbackOutcome({
        request,
        gatingDecision,
        outcomeState:
          adapterResultValue.state === "parse_error" ? "parse_error" : "provider_unavailable",
        settledAt: observedAt,
        reasonCodes: [...adapterResultValue.reasonCodes, "PDS_183_LOCAL_MATCHING_CONTINUES"],
      });
      repository.saveOutcome(outcome);
      repository.appendEvent(createEvent("pds.enrichment.fallback", input.subjectRef, outcome));
      return {
        request,
        gatingDecision,
        normalizedSnapshot: null,
        outcome,
        replayed: false,
      };
    },

    async recordChangeSignal(input) {
      const existing = repository.getChangeSignalByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        return {
          changeSignal: existing,
          replayed: true,
        };
      }
      const observedAt = input.observedAt ?? new Date().toISOString();
      const featureFlagEnabled = input.featureFlagEnabled ?? policy.enabledByDefault;
      const notificationsAllowed =
        featureFlagEnabled &&
        policy.notificationsEnabled &&
        policy.onboarding.notificationsOnboarded &&
        policy.enabledTenants.includes(input.tenantRef) &&
        policy.allowedEnvironments.includes(input.environment);
      const signalState: PdsChangeSignalState = notificationsAllowed
        ? "queued_refresh"
        : featureFlagEnabled
          ? "manual_review_only"
          : "ignored_disabled";
      const queuedRefreshRef =
        signalState === "queued_refresh"
          ? stableRef("pds_refresh", `${input.idempotencyKey}:${input.pdsRecordRef}`)
          : null;
      const changeSignal: PdsChangeSignalRecord = {
        changeSignalRef: stableRef("pds_change_signal", input.idempotencyKey),
        idempotencyKey: input.idempotencyKey,
        pdsRecordRef: input.pdsRecordRef,
        tenantRef: input.tenantRef,
        environment: input.environment,
        changeEventType: input.changeEventType,
        notificationRef: input.notificationRef,
        signalState,
        queuedRefreshRef,
        mutationProhibited: true,
        reasonCodes:
          signalState === "queued_refresh"
            ? ["PDS_183_CHANGE_SIGNAL_QUEUED_NOT_MUTATED"]
            : ["PDS_183_DISABLED_BY_DEFAULT", "PDS_183_LOCAL_MATCHING_CONTINUES"],
        receivedAt: observedAt,
        createdByAuthority: PDS_ENRICHMENT_ORCHESTRATOR_NAME,
      };
      repository.saveChangeSignal(changeSignal);
      repository.appendEvent(createEvent("pds.change_signal.recorded", null, changeSignal));
      return {
        changeSignal,
        replayed: false,
      };
    },
  };
}

export function createPatientLinkerPdsEnrichmentProvider(options: {
  readonly orchestrator: PdsEnrichmentOrchestrator;
  readonly tenantRef?: string;
  readonly environment?: PdsEnvironment;
  readonly defaultLegalBasisMode?: PdsLegalBasisMode;
}): PdsEnrichmentProvider {
  return {
    async enrich(
      input: PatientLinkerPdsEnrichmentRequest,
    ): Promise<PatientLinkerPdsEnrichmentOutcome> {
      const result = await options.orchestrator.evaluateEnrichment({
        idempotencyKey: stableRef("patient_linker_pds", {
          subjectRef: input.subjectRef,
          routeSensitivityFamily: input.routeSensitivityFamily,
          observedAt: input.observedAt,
          localEvidenceRefs: input.localEvidenceRefs,
        }),
        subjectRef: input.subjectRef,
        tenantRef: options.tenantRef ?? "tenant_default",
        environment: options.environment ?? "local",
        routeSensitivityFamily: input.routeSensitivityFamily,
        requestedOperation: "search_patient",
        localEvidenceRefs: input.localEvidenceRefs,
        legalBasisEvidenceRef: input.legalBasisEvidenceRef ?? null,
        legalBasisMode: input.legalBasisEvidenceRef
          ? (options.defaultLegalBasisMode ?? "direct_care")
          : "none",
        queryAttributes: {
          nhsNumberHash: null,
          dateOfBirthHash: null,
          familyNameDigest: null,
          givenNameDigest: null,
          postcodePrefixDigest: null,
          addressDigest: digest(input.localEvidenceRefs),
        },
        featureFlagEnabled: input.featureFlagEnabled,
        observedAt: input.observedAt,
      });
      return {
        seamRef: PDS_ENRICHMENT_SEAM_REF,
        status: mapOutcomeToPatientLinkerStatus(result.outcome),
        pdsDemographicsRef:
          result.outcome.outcomeState === "enriched" ||
          result.outcome.outcomeState === "cache_fresh"
            ? result.outcome.pdsDemographicsRef
            : null,
        pdsLookupOutcome:
          result.outcome.outcomeState === "enriched" ||
          result.outcome.outcomeState === "cache_fresh"
            ? "reference_returned"
            : result.outcome.outcomeState === "disabled" ||
                result.outcome.outcomeState === "legal_basis_missing" ||
                result.outcome.outcomeState === "policy_denied"
              ? "not_called"
              : "not_available",
        pdsProvenancePenalty: result.outcome.pdsProvenancePenalty,
        reasonCodes: result.outcome.reasonCodes,
      };
    },
  };
}

function evaluatePdsPolicy(input: {
  readonly input: EvaluatePdsEnrichmentInput;
  readonly policy: PdsEnrichmentPolicy;
  readonly observedAt: string;
}): PdsGatingDecisionRecord {
  const featureFlagEnabled = input.input.featureFlagEnabled ?? input.policy.enabledByDefault;
  const onboardingReady =
    input.policy.onboarding.pdsFhirDigitalOnboardingComplete &&
    input.policy.onboarding.pdsAccessApproved &&
    input.policy.onboarding.dsptComplete &&
    input.policy.onboarding.secureNetworkApproved &&
    Boolean(input.policy.onboarding.purposeUseCaseRef);
  const legalBasisMode = input.input.legalBasisMode ?? "none";
  const legalBasisSatisfied =
    Boolean(input.input.legalBasisEvidenceRef) &&
    input.policy.allowedLegalBasisModes.includes(legalBasisMode);
  const endpointConfigured = Boolean(input.policy.endpointRef && input.policy.credentialSecretRef);
  const environmentApproved = input.policy.allowedEnvironments.includes(input.input.environment);
  const tenantApproved = input.policy.enabledTenants.includes(input.input.tenantRef);
  const routeApproved = input.policy.approvedRouteFamilies.includes(
    input.input.routeSensitivityFamily,
  );

  let decisionState: PdsGatingDecisionState = "allowed";
  const reasonCodes: string[] = [];
  if (!featureFlagEnabled || input.policy.accessMode === "disabled") {
    decisionState = "disabled";
    reasonCodes.push("PDS_183_DISABLED_BY_DEFAULT");
  } else if (!environmentApproved) {
    decisionState = "denied";
    reasonCodes.push("PDS_183_ENVIRONMENT_NOT_ENABLED");
  } else if (!tenantApproved) {
    decisionState = "denied";
    reasonCodes.push("PDS_183_TENANT_NOT_ENABLED");
  } else if (!onboardingReady) {
    decisionState = "denied";
    reasonCodes.push("PDS_183_ONBOARDING_INCOMPLETE");
  } else if (!legalBasisSatisfied) {
    decisionState = "legal_basis_missing";
    reasonCodes.push("PDS_183_LEGAL_BASIS_MISSING");
  } else if (!endpointConfigured) {
    decisionState = "denied";
    reasonCodes.push("PDS_183_SECRETS_OR_ENDPOINT_MISSING");
  } else if (!routeApproved) {
    decisionState = "denied";
    reasonCodes.push("PDS_183_ROUTE_NOT_APPROVED");
  } else if (input.policy.circuitBreaker.state === "open") {
    decisionState = "circuit_open";
    reasonCodes.push("PDS_183_CIRCUIT_OPEN_FAIL_LOCAL_ONLY");
  } else {
    reasonCodes.push(
      "PDS_183_NORMALIZED_PROVENANCE_PRESERVED",
      "PDS_183_DATA_CLASSES_SEPARATED",
      "PDS_183_NO_DIRECT_BINDING_MUTATION",
    );
  }

  if (decisionState !== "allowed") {
    reasonCodes.push("PDS_183_LOCAL_MATCHING_CONTINUES");
  }

  return {
    gatingDecisionRef: stableRef("pds_gating", {
      subjectRef: input.input.subjectRef,
      tenantRef: input.input.tenantRef,
      routeSensitivityFamily: input.input.routeSensitivityFamily,
      observedAt: input.observedAt,
      decisionState,
    }),
    schemaVersion: PDS_ENRICHMENT_SCHEMA_VERSION,
    policyVersion: PDS_ENRICHMENT_POLICY_VERSION,
    subjectRef: input.input.subjectRef,
    tenantRef: input.input.tenantRef,
    environment: input.input.environment,
    routeSensitivityFamily: input.input.routeSensitivityFamily,
    requestedOperation: input.input.requestedOperation,
    decisionState,
    accessMode: input.policy.accessMode,
    featureFlagEnabled,
    onboardingReady,
    legalBasisSatisfied,
    endpointConfigured,
    routeApproved,
    localFlowContinuation:
      decisionState === "allowed" ? "pds_enrichment_allowed" : "local_matching_only",
    reasonCodes,
    decidedAt: input.observedAt,
    createdByAuthority: PDS_ENRICHMENT_ORCHESTRATOR_NAME,
  };
}

function normalizeFhirPatient(patient: PdsFhirPatientResource): PdsAdapterPatientDemographics {
  const nhsNumber =
    patient.identifier?.find((identifier) =>
      normalizeToken(identifier.system).includes("nhs-number"),
    )?.value ??
    patient.identifier?.[0]?.value ??
    null;
  const primaryName = patient.name?.[0] ?? null;
  const primaryAddress = patient.address?.[0] ?? null;
  const gp = patient.generalPractitioner?.[0] ?? null;
  const nameDigest =
    primaryName === null
      ? null
      : digest({
          family: normalizeToken(primaryName.family),
          given: primaryName.given?.map(normalizeToken) ?? [],
        });
  const addressDigest =
    primaryAddress === null
      ? null
      : digest({
          line: primaryAddress.line?.map(normalizeToken) ?? [],
          postalCode: normalizeToken(primaryAddress.postalCode),
        });
  return {
    pdsRecordRef: patient.id
      ? `pds_patient_${digest(patient.id).slice(0, 16)}`
      : "pds_patient_unknown",
    pdsRecordVersionRef: patient.meta?.versionId
      ? `pds_version_${digest(patient.meta.versionId).slice(0, 16)}`
      : null,
    pdsSourceLastUpdatedAt: patient.meta?.lastUpdated ?? null,
    nhsNumberHash: nhsNumber ? `sha256:${digest(nhsNumber)}` : null,
    dateOfBirthHash: patient.birthDate ? `sha256:${digest(patient.birthDate)}` : null,
    nameDigest,
    addressDigest,
    postcodePrefixDigest: primaryAddress?.postalCode
      ? digest(normalizeToken(primaryAddress.postalCode).slice(0, 4))
      : null,
    registeredGpPracticeRef: gp?.identifier?.value
      ? `ods_${normalizeToken(gp.identifier.value).slice(0, 12)}`
      : gp?.reference
        ? `gp_ref_${digest(gp.reference).slice(0, 12)}`
        : null,
    sourceRefs: [
      patient.id ? `pds_record:${digest(patient.id).slice(0, 16)}` : "pds_record:unknown",
      patient.meta?.versionId
        ? `pds_version:${digest(patient.meta.versionId).slice(0, 16)}`
        : "pds_version:unknown",
    ],
  };
}

function snapshotFromAdapterPatient(input: {
  readonly input: EvaluatePdsEnrichmentInput;
  readonly policy: PdsEnrichmentPolicy;
  readonly request: PdsEnrichmentRequestRecord;
  readonly patient: PdsAdapterPatientDemographics;
  readonly queryDigest: string;
  readonly observedAt: string;
}): PdsNormalizedDemographicSnapshot {
  const expiresAt = addSeconds(input.observedAt, input.policy.cacheTtlSeconds);
  return {
    pdsDemographicsRef: stableRef("pds_demo", {
      subjectRef: input.input.subjectRef,
      tenantRef: input.input.tenantRef,
      queryDigest: input.queryDigest,
      pdsRecordRef: input.patient.pdsRecordRef,
    }),
    schemaVersion: PDS_ENRICHMENT_SCHEMA_VERSION,
    policyVersion: PDS_ENRICHMENT_POLICY_VERSION,
    subjectRef: input.input.subjectRef,
    tenantRef: input.input.tenantRef,
    routeSensitivityFamily: input.input.routeSensitivityFamily,
    pdsRecordRef: input.patient.pdsRecordRef,
    pdsRecordVersionRef: input.patient.pdsRecordVersionRef,
    pdsSourceLastUpdatedAt: input.patient.pdsSourceLastUpdatedAt,
    cachedAt: input.observedAt,
    expiresAt,
    staleAfter: addSeconds(expiresAt, input.policy.staleCacheGraceSeconds),
    freshnessState: "fresh",
    normalizedDemographicDigest: input.queryDigest,
    demographicEvidence: {
      nhsNumberHash: input.patient.nhsNumberHash,
      dateOfBirthHash: input.patient.dateOfBirthHash,
      nameDigest: input.patient.nameDigest,
      addressDigest: input.patient.addressDigest,
      postcodePrefixDigest: input.patient.postcodePrefixDigest,
      registeredGpPracticeRef: input.patient.registeredGpPracticeRef,
    },
    provenance: {
      provider: "pds_fhir",
      accessMode: input.policy.accessMode,
      legalBasisEvidenceRef: input.request.legalBasisEvidenceRef ?? "missing_legal_basis_ref",
      endpointRef: input.policy.endpointRef ?? "missing_endpoint_ref",
      sourceRefs: input.patient.sourceRefs,
      retrievedAt: input.observedAt,
    },
    dataClassSeparation: {
      authoritativeLocalBindingStateRef: null,
      localMatchEvidenceRefs: [...input.input.localEvidenceRefs],
      nhsLoginSubjectClaimRefs: [...(input.input.nhsLoginSubjectClaimRefs ?? [])],
      pdsDemographicEvidenceRef: stableRef("pds_evidence", input.patient),
      communicationPreferenceRef: null,
      changeNotificationRefs: [],
    },
    createdByAuthority: PDS_ENRICHMENT_ORCHESTRATOR_NAME,
  };
}

function adapterResult(
  input: PdsAdapterLookupInput,
  state: PdsAdapterResultState,
  patient: PdsAdapterPatientDemographics | null,
  reasonCodes: readonly string[],
): PdsAdapterLookupResult {
  return {
    adapterResultRef: stableRef("pds_adapter_result", {
      requestRef: input.requestRef,
      state,
      observedAt: input.observedAt,
    }),
    state,
    providerRequestRef:
      state === "not_configured" ? null : stableRef("pds_provider_request", input.requestRef),
    patient,
    reasonCodes,
    observedAt: input.observedAt,
  };
}

function buildFallbackOutcome(input: {
  readonly request: PdsEnrichmentRequestRecord;
  readonly gatingDecision: PdsGatingDecisionRecord;
  readonly outcomeState: PdsEnrichmentOutcomeState;
  readonly settledAt: string;
  readonly reasonCodes: readonly string[];
}): PdsEnrichmentOutcomeRecord {
  return {
    pdsEnrichmentOutcomeRef: stableRef("pds_outcome", {
      requestRef: input.request.pdsEnrichmentRequestRef,
      outcomeState: input.outcomeState,
    }),
    pdsEnrichmentRequestRef: input.request.pdsEnrichmentRequestRef,
    gatingDecisionRef: input.gatingDecision.gatingDecisionRef,
    outcomeState: input.outcomeState,
    pdsLookupOutcome: "not_called",
    pdsDemographicsRef: null,
    freshnessState: "not_available",
    pdsProvenancePenalty:
      input.outcomeState === "legal_basis_missing"
        ? 0.2
        : input.outcomeState === "disabled"
          ? 0.04
          : 0.12,
    bindingMutationProhibited: true,
    localFlowContinuation: "local_matching_only",
    reasonCodes: unique([
      ...input.reasonCodes,
      "PDS_183_LOCAL_MATCHING_CONTINUES",
      "PDS_183_NO_DIRECT_BINDING_MUTATION",
    ]),
    settledAt: input.settledAt,
    createdByAuthority: PDS_ENRICHMENT_ORCHESTRATOR_NAME,
  };
}

function buildCacheOutcome(input: {
  readonly request: PdsEnrichmentRequestRecord;
  readonly gatingDecision: PdsGatingDecisionRecord;
  readonly snapshot: PdsNormalizedDemographicSnapshot;
  readonly outcomeState: Extract<
    PdsEnrichmentOutcomeState,
    "cache_fresh" | "stale_cache_used" | "enriched"
  >;
  readonly settledAt: string;
  readonly reasonCodes: readonly string[];
}): PdsEnrichmentOutcomeRecord {
  return {
    pdsEnrichmentOutcomeRef: stableRef("pds_outcome", {
      requestRef: input.request.pdsEnrichmentRequestRef,
      outcomeState: input.outcomeState,
    }),
    pdsEnrichmentRequestRef: input.request.pdsEnrichmentRequestRef,
    gatingDecisionRef: input.gatingDecision.gatingDecisionRef,
    outcomeState: input.outcomeState,
    pdsLookupOutcome: input.outcomeState === "enriched" ? "reference_returned" : "cache_returned",
    pdsDemographicsRef: input.snapshot.pdsDemographicsRef,
    freshnessState: input.outcomeState === "stale_cache_used" ? "stale" : "fresh",
    pdsProvenancePenalty: input.outcomeState === "stale_cache_used" ? 0.16 : 0,
    bindingMutationProhibited: true,
    localFlowContinuation: "pds_enrichment_available",
    reasonCodes: unique([
      ...input.reasonCodes,
      "PDS_183_NORMALIZED_PROVENANCE_PRESERVED",
      "PDS_183_DATA_CLASSES_SEPARATED",
      "PDS_183_NO_DIRECT_BINDING_MUTATION",
    ]),
    settledAt: input.settledAt,
    createdByAuthority: PDS_ENRICHMENT_ORCHESTRATOR_NAME,
  };
}

function snapshotFreshness(
  snapshot: PdsNormalizedDemographicSnapshot,
  observedAt: string,
): PdsFreshnessState {
  const observed = Date.parse(observedAt);
  if (Number.isNaN(observed)) {
    return "stale";
  }
  if (observed <= Date.parse(snapshot.expiresAt)) {
    return "fresh";
  }
  if (observed <= Date.parse(snapshot.staleAfter)) {
    return "stale";
  }
  return "not_available";
}

function createEvent(
  eventName: PdsAdapterEventRecord["eventName"],
  subjectRef: string | null,
  payload: unknown,
): PdsAdapterEventRecord {
  return {
    eventRef: stableRef("pds_event", { eventName, subjectRef, payloadHash: digest(payload) }),
    eventName,
    subjectRef,
    occurredAt: new Date().toISOString(),
    payloadHash: digest(payload),
    reasonCodes:
      typeof payload === "object" && payload !== null && "reasonCodes" in payload
        ? [...((payload as { readonly reasonCodes?: readonly string[] }).reasonCodes ?? [])]
        : [],
    createdByAuthority: PDS_ENRICHMENT_ORCHESTRATOR_NAME,
  };
}

function mapOutcomeToPatientLinkerStatus(
  outcome: PdsEnrichmentOutcomeRecord,
): PatientLinkerPdsEnrichmentOutcome["status"] {
  if (outcome.outcomeState === "enriched" || outcome.outcomeState === "cache_fresh") {
    return "enriched";
  }
  if (outcome.outcomeState === "legal_basis_missing") {
    return "legal_basis_missing";
  }
  if (outcome.outcomeState === "disabled" || outcome.outcomeState === "policy_denied") {
    return "disabled";
  }
  return "unavailable";
}

function cacheKeyFor(input: {
  readonly subjectRef: string;
  readonly tenantRef: string;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly queryDigest: string;
}): string {
  return digest(input);
}

function addSeconds(iso: string, seconds: number): string {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString();
}

function normalizeToken(value: string | null | undefined): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/gu, "") ?? ""
  );
}

function digest(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function stableRef(prefix: string, value: unknown): string {
  return `${prefix}_${digest(value).slice(0, 18)}`;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}
