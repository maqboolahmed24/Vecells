import { createHash } from "node:crypto";
import {
  createDefaultPhase7NhsAppManifestApplication,
  PHASE7_BEHAVIOR_CONTRACT_SET_REF,
  PHASE7_COMPATIBILITY_EVIDENCE_REF,
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  PHASE7_RELEASE_CANDIDATE_REF,
  PHASE7_SURFACE_SCHEMA_SET_REF,
  type NhsAppEnvironment,
  type Phase7NhsAppManifestApplication,
} from "./phase7-nhs-app-manifest-service";
import {
  createDefaultPhase7RouteReadinessApplication,
  type Phase7RouteReadinessApplication,
  type RouteReadinessResult,
  type RouteReadinessVerdict,
} from "./phase7-route-readiness-service";

export const PHASE7_ENVIRONMENT_TELEMETRY_SERVICE_NAME =
  "Phase7NHSAppEnvironmentTelemetryAndSCALDeliveryService";
export const PHASE7_ENVIRONMENT_TELEMETRY_SCHEMA_VERSION = "384.phase7.environment-telemetry.v1";

const RECORDED_AT = "2026-04-27T01:20:15.000Z";

export type NHSAppEnvironmentProfileState = "profile_ready" | "profile_draft" | "profile_blocked";
export type EnvironmentParityState = "matching" | "drift" | "blocked";
export type DemoDatasetState = "seeded" | "reset_complete" | "invalid";
export type DemoJourneyKind = "request" | "booking" | "waitlist" | "pharmacy" | "status";
export type TelemetryValidationState = "accepted" | "quarantined";
export type SCALSubmissionState =
  | "draft"
  | "ready_for_submission"
  | "submitted"
  | "accepted"
  | "blocked";
export type RetentionClass = "monthly_aggregate" | "operational_30_days" | "security_90_days";

export type EnvironmentProfileFailureReason =
  | "profile_missing"
  | "manifest_tuple_drift"
  | "base_url_mismatch"
  | "manifest_route_mismatch"
  | "readiness_not_current"
  | "telemetry_contract_missing"
  | "demo_dataset_missing"
  | "demo_dataset_invalid"
  | "scal_evidence_missing";

export type TelemetryValidationFailureReason =
  | "contract_missing"
  | "unknown_field"
  | "required_field_missing"
  | "prohibited_field_present"
  | "raw_jwt_detected"
  | "grant_identifier_detected"
  | "patient_identifier_detected"
  | "phi_query_string_detected"
  | "release_tuple_drift";

export interface ReleaseTuplePin {
  readonly manifestVersionRef: string;
  readonly configFingerprint: string;
  readonly releaseCandidateRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly behaviorContractSetRef: string;
  readonly surfaceSchemaSetRef: string;
  readonly compatibilityEvidenceRef: string;
}

export interface NHSAppEnvironmentProfile extends ReleaseTuplePin {
  readonly profileId: string;
  readonly environment: NhsAppEnvironment;
  readonly environmentStage:
    | "local_preview"
    | "sandpit"
    | "aos"
    | "limited_release"
    | "full_release";
  readonly baseUrl: string;
  readonly journeyPaths: readonly string[];
  readonly ssoConfigRef: string;
  readonly siteLinkConfigRef: string;
  readonly telemetryNamespace: string;
  readonly telemetryPlanRef: string;
  readonly allowedCohorts: readonly string[];
  readonly watchTupleHash: string;
  readonly guardrailPolicyRef: string;
  readonly stabilizationCriteriaRef: string;
  readonly demoDatasetRef: string;
  readonly scalBundleRef: string;
  readonly profileState: NHSAppEnvironmentProfileState;
  readonly evidenceRefs: readonly string[];
  readonly updatedAt: string;
}

export interface DemoJourneyCoverage {
  readonly journeyKind: DemoJourneyKind;
  readonly journeyPathRef: string;
  readonly scenarioRef: string;
  readonly coverageState: "covered";
}

export interface SyntheticPatientSeed {
  readonly syntheticPatientRef: string;
  readonly personaSegment: "adult_repeat_user" | "carer_context" | "accessibility_needs";
  readonly loginAssuranceRef: string;
  readonly registeredPracticeOds: string;
}

export interface SyntheticRequestSeed {
  readonly syntheticRequestRef: string;
  readonly syntheticPatientRef: string;
  readonly journeyPathRef: string;
  readonly requestType: "medical" | "admin" | "status";
  readonly currentState: "draft" | "submitted" | "awaiting_more_info" | "closed";
  readonly summaryRef: string;
}

export interface SyntheticAppointmentSeed {
  readonly syntheticAppointmentRef: string;
  readonly syntheticPatientRef: string;
  readonly journeyPathRef: string;
  readonly appointmentState: "booked" | "reschedule_available" | "waitlist_offer_pending";
  readonly providerRef: string;
  readonly artifactRef: string;
}

export interface SyntheticWaitlistSeed {
  readonly syntheticWaitlistRef: string;
  readonly syntheticPatientRef: string;
  readonly journeyPathRef: string;
  readonly offerState: "pending_response" | "expired_recovery" | "accepted";
  readonly deadlineRef: string;
}

export interface SyntheticPharmacySeed {
  readonly syntheticPharmacyCaseRef: string;
  readonly syntheticPatientRef: string;
  readonly journeyPathRef: string;
  readonly pharmacyState: "choice_needed" | "sent_to_pharmacy" | "ready_to_collect";
  readonly pharmacyRef: string;
}

export interface IntegrationDemoDataset {
  readonly datasetId: string;
  readonly environment: NhsAppEnvironment;
  readonly manifestVersionRef: string;
  readonly journeyCoverage: readonly DemoJourneyCoverage[];
  readonly syntheticPatients: readonly SyntheticPatientSeed[];
  readonly syntheticRequests: readonly SyntheticRequestSeed[];
  readonly syntheticAppointments: readonly SyntheticAppointmentSeed[];
  readonly syntheticWaitlistOffers: readonly SyntheticWaitlistSeed[];
  readonly syntheticPharmacyCases: readonly SyntheticPharmacySeed[];
  readonly syntheticStatusViews: readonly SyntheticRequestSeed[];
  readonly resetOrdinal: number;
  readonly lastResetAt: string;
  readonly datasetState: DemoDatasetState;
  readonly datasetHash: string;
}

export interface DemoDatasetIntegrityResult {
  readonly datasetId: string;
  readonly environment: NhsAppEnvironment;
  readonly integrityState: "valid" | "invalid";
  readonly missingJourneyKinds: readonly DemoJourneyKind[];
  readonly unsafeFieldRefs: readonly string[];
  readonly datasetHash: string;
}

export interface DemoDatasetResetResult {
  readonly resetRunId: string;
  readonly dataset: IntegrationDemoDataset;
  readonly beforeHash: string | null;
  readonly afterHash: string;
  readonly integrity: DemoDatasetIntegrityResult;
}

export interface TelemetryEventContract {
  readonly contractId: string;
  readonly eventName: string;
  readonly allowedFields: readonly string[];
  readonly requiredFields: readonly string[];
  readonly prohibitedFields: readonly string[];
  readonly pseudonymousJoinKey: string;
  readonly retentionClass: RetentionClass;
  readonly monthlyPackFieldMap: Readonly<Record<string, string>>;
}

export interface ChannelTelemetryPlan {
  readonly planId: string;
  readonly environment: NhsAppEnvironment;
  readonly manifestVersionRef: string;
  readonly configFingerprint: string;
  readonly telemetryNamespace: string;
  readonly trackedJourneys: readonly string[];
  readonly eventContractRefs: readonly string[];
  readonly successMetrics: readonly string[];
  readonly failureMetrics: readonly string[];
  readonly dropOffMetrics: readonly string[];
  readonly alertThresholdRefs: readonly string[];
  readonly monthlyPackMappings: Readonly<Record<string, readonly string[]>>;
  readonly cohortBreakdowns: readonly string[];
  readonly planHash: string;
  readonly generatedAt: string;
}

export interface TelemetryEventValidationInput {
  readonly eventName: string;
  readonly environment: NhsAppEnvironment;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly expectedManifestVersion?: string;
  readonly expectedConfigFingerprint?: string;
  readonly expectedReleaseApprovalFreezeRef?: string;
}

export interface TelemetryEventValidationResult {
  readonly validationId: string;
  readonly eventName: string;
  readonly environment: NhsAppEnvironment;
  readonly validationState: TelemetryValidationState;
  readonly failureReasons: readonly TelemetryValidationFailureReason[];
  readonly acceptedFieldRefs: readonly string[];
  readonly quarantinedFieldRefs: readonly string[];
  readonly contractRef: string | null;
  readonly payloadHash: string;
  readonly validatedAt: string;
}

export interface SCALBundle {
  readonly bundleId: string;
  readonly environment: NhsAppEnvironment;
  readonly manifestVersionRef: string;
  readonly configFingerprint: string;
  readonly releaseApprovalFreezeRef: string;
  readonly evidenceRefs: readonly string[];
  readonly owner: string;
  readonly submissionState: SCALSubmissionState;
  readonly environmentProfileRef: string;
  readonly telemetryPlanRef: string;
  readonly demoDatasetRef: string;
  readonly routeReadinessRefs: readonly string[];
  readonly accessibilityEvidenceRefs: readonly string[];
  readonly clinicalSafetyRefs: readonly string[];
  readonly privacyEvidenceRefs: readonly string[];
  readonly incidentRehearsalRef: string;
  readonly failureReasons: readonly EnvironmentProfileFailureReason[];
  readonly assembledAt: string;
  readonly bundleHash: string;
}

export interface EnvironmentProfileValidationResult {
  readonly environment: NhsAppEnvironment;
  readonly parityState: EnvironmentParityState;
  readonly failureReasons: readonly EnvironmentProfileFailureReason[];
  readonly profile: NHSAppEnvironmentProfile | null;
  readonly routeReadiness: readonly RouteReadinessResult[];
  readonly checkedAt: string;
  readonly watchTupleHash: string | null;
}

export interface EnvironmentParityValidationResult {
  readonly parityState: EnvironmentParityState;
  readonly environments: readonly NhsAppEnvironment[];
  readonly failureReasons: readonly EnvironmentProfileFailureReason[];
  readonly profileResults: readonly EnvironmentProfileValidationResult[];
  readonly comparedTupleHash: string | null;
  readonly checkedAt: string;
}

export interface Phase7EnvironmentTelemetryInventory {
  readonly schemaVersion: typeof PHASE7_ENVIRONMENT_TELEMETRY_SCHEMA_VERSION;
  readonly environmentProfiles: readonly NHSAppEnvironmentProfile[];
  readonly demoDatasets: readonly IntegrationDemoDataset[];
  readonly telemetryEventContracts: readonly TelemetryEventContract[];
  readonly telemetryPlans: readonly ChannelTelemetryPlan[];
}

export const phase7EnvironmentTelemetryRoutes = [
  {
    routeId: "phase7_nhs_app_environment_profiles_list",
    method: "GET",
    path: "/internal/v1/nhs-app/environment-profiles",
    contractFamily: "NHSAppEnvironmentProfileContract",
    purpose:
      "List Sandpit, AOS, limited release, and live NHS App environment profiles pinned to one manifest and release tuple.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_environment_profile_validate",
    method: "POST",
    path: "/internal/v1/nhs-app/environment-profiles:validate",
    contractFamily: "NHSAppEnvironmentParityContract",
    purpose:
      "Validate environment profile parity against manifest, route readiness, demo dataset, and telemetry contracts.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_demo_dataset_reset",
    method: "POST",
    path: "/internal/v1/nhs-app/demo-datasets:reset",
    contractFamily: "IntegrationDemoDatasetResetContract",
    purpose:
      "Reset governed synthetic NHS App demo journeys for repeatable Sandpit and AOS walkthroughs.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_telemetry_event_validate",
    method: "POST",
    path: "/internal/v1/nhs-app/telemetry-events:validate",
    contractFamily: "TelemetryEventContractValidationContract",
    purpose:
      "Validate one NHS App channel telemetry event against privacy-minimized event contracts.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_telemetry_plan_current",
    method: "GET",
    path: "/internal/v1/nhs-app/telemetry-plan/current",
    contractFamily: "ChannelTelemetryPlanContract",
    purpose:
      "Build the route-aware telemetry plan and monthly-pack mapping for one NHS App environment.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_scal_bundle_assemble",
    method: "POST",
    path: "/internal/v1/nhs-app/scal-bundles:assemble",
    contractFamily: "SCALBundleAssemblyContract",
    purpose:
      "Assemble SCAL evidence from environment profile, demo dataset, telemetry contracts, and route readiness truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

const DEFAULT_PROFILE_JOURNEY_PATHS = ["jp_pharmacy_status"] as const;
const REQUIRED_DEMO_JOURNEY_KINDS: readonly DemoJourneyKind[] = [
  "request",
  "booking",
  "waitlist",
  "pharmacy",
  "status",
];
const COMMON_PROHIBITED_TELEMETRY_FIELDS = [
  "rawJwt",
  "assertedLoginIdentity",
  "asserted_login_identity",
  "accessToken",
  "idToken",
  "grantId",
  "artifactByteGrant",
  "patientId",
  "patientIdentifier",
  "subjectRef",
  "nhsNumber",
  "email",
  "phone",
  "queryString",
] as const;

const BASE_URL_BY_ENVIRONMENT: Record<NhsAppEnvironment, string> = {
  local_preview: "https://local.vecells.invalid/nhs-app-preview",
  sandpit: "https://sandpit.vecells.invalid/nhs-app",
  aos: "https://aos.vecells.invalid/nhs-app",
  limited_release: "https://limited-release.vecells.invalid/nhs-app",
  full_release: "https://www.vecells.invalid/nhs-app",
};

const COHORTS_BY_ENVIRONMENT: Record<NhsAppEnvironment, readonly string[]> = {
  local_preview: ["cohort:phase7-local-contract-preview"],
  sandpit: ["cohort:phase7-internal-sandpit-only"],
  aos: ["cohort:phase7-aos-assurance"],
  limited_release: ["cohort:future-nhs-app-limited-release"],
  full_release: ["cohort:future-nhs-app-full-release"],
};

const TELEMETRY_CONTRACTS: TelemetryEventContract[] = [
  telemetryContract("TelemetryEventContract:384:route-entry", "nhs_app_route_entry", {
    requiredFields: [
      "environment",
      "journeyPathId",
      "routeFamilyRef",
      "manifestVersionRef",
      "releaseApprovalFreezeRef",
      "channelSessionHash",
      "occurredAt",
    ],
    allowedFields: ["cohortRef", "platform", "entryMode"],
    monthlyPackFieldMap: {
      journeyPathId: "journey_path_id",
      routeFamilyRef: "route_family",
      cohortRef: "cohort",
      platform: "platform",
      entryMode: "entry_mode",
    },
  }),
  telemetryContract("TelemetryEventContract:384:route-readiness", "nhs_app_route_readiness", {
    requiredFields: [
      "environment",
      "journeyPathId",
      "manifestVersionRef",
      "releaseApprovalFreezeRef",
      "channelSessionHash",
      "routeReadinessVerdict",
      "occurredAt",
    ],
    allowedFields: ["failureReasonRefs", "routeFamilyRef"],
    monthlyPackFieldMap: {
      journeyPathId: "journey_path_id",
      routeReadinessVerdict: "readiness_verdict",
      failureReasonRefs: "readiness_failure_reasons",
    },
  }),
  telemetryContract("TelemetryEventContract:384:sso-result", "nhs_app_sso_result", {
    requiredFields: [
      "environment",
      "journeyPathId",
      "manifestVersionRef",
      "releaseApprovalFreezeRef",
      "channelSessionHash",
      "result",
      "occurredAt",
    ],
    allowedFields: ["failureReasonRefs", "latencyMs", "oidcErrorCode"],
    monthlyPackFieldMap: {
      result: "sso_result",
      failureReasonRefs: "sso_failure_reasons",
      latencyMs: "sso_latency_ms",
    },
  }),
  telemetryContract("TelemetryEventContract:384:bridge-action", "nhs_app_bridge_action_result", {
    requiredFields: [
      "environment",
      "journeyPathId",
      "manifestVersionRef",
      "releaseApprovalFreezeRef",
      "channelSessionHash",
      "bridgeAction",
      "result",
      "occurredAt",
    ],
    allowedFields: ["platform", "failureReasonRefs"],
    monthlyPackFieldMap: {
      bridgeAction: "bridge_action",
      result: "bridge_result",
      failureReasonRefs: "bridge_failure_reasons",
    },
  }),
  telemetryContract(
    "TelemetryEventContract:384:artifact-delivery",
    "nhs_app_artifact_delivery_result",
    {
      requiredFields: [
        "environment",
        "journeyPathId",
        "manifestVersionRef",
        "releaseApprovalFreezeRef",
        "channelSessionHash",
        "artifactType",
        "result",
        "occurredAt",
      ],
      allowedFields: ["byteCountBucket", "failureReasonRefs"],
      monthlyPackFieldMap: {
        artifactType: "artifact_type",
        result: "artifact_result",
        byteCountBucket: "byte_count_bucket",
      },
    },
  ),
  telemetryContract("TelemetryEventContract:384:route-exit", "nhs_app_route_exit", {
    requiredFields: [
      "environment",
      "journeyPathId",
      "manifestVersionRef",
      "releaseApprovalFreezeRef",
      "channelSessionHash",
      "exitReason",
      "occurredAt",
    ],
    allowedFields: ["durationBucket", "routeFamilyRef"],
    monthlyPackFieldMap: {
      journeyPathId: "journey_path_id",
      exitReason: "exit_reason",
      durationBucket: "duration_bucket",
    },
  }),
  telemetryContract("TelemetryEventContract:384:demo-reset", "nhs_app_demo_dataset_reset", {
    requiredFields: [
      "environment",
      "manifestVersionRef",
      "releaseApprovalFreezeRef",
      "channelSessionHash",
      "datasetId",
      "resetRunId",
      "occurredAt",
    ],
    allowedFields: ["result"],
    monthlyPackFieldMap: {
      datasetId: "demo_dataset_id",
      result: "demo_reset_result",
    },
  }),
];

const DEFAULT_ENVIRONMENT_PROFILES: NHSAppEnvironmentProfile[] = (
  ["local_preview", "sandpit", "aos", "limited_release", "full_release"] as const
).map((environment) => buildEnvironmentProfile(environment));

const DEFAULT_DEMO_DATASETS: IntegrationDemoDataset[] = DEFAULT_ENVIRONMENT_PROFILES.map(
  (profile) => buildDemoDataset(profile.environment),
);

export class NHSAppEnvironmentProfileRegistry {
  private readonly profiles = new Map<NhsAppEnvironment, NHSAppEnvironmentProfile>();

  constructor(seed: readonly NHSAppEnvironmentProfile[] = DEFAULT_ENVIRONMENT_PROFILES) {
    for (const profile of seed) {
      this.save(profile);
    }
  }

  save(profile: NHSAppEnvironmentProfile): NHSAppEnvironmentProfile {
    const cloned = clone(profile);
    this.profiles.set(cloned.environment, cloned);
    return clone(cloned);
  }

  get(environment: NhsAppEnvironment): NHSAppEnvironmentProfile | null {
    const profile = this.profiles.get(environment);
    return profile ? clone(profile) : null;
  }

  list(): NHSAppEnvironmentProfile[] {
    return Array.from(this.profiles.values()).map((profile) => clone(profile));
  }
}

export class IntegrationDemoDatasetStore {
  private readonly datasets = new Map<NhsAppEnvironment, IntegrationDemoDataset>();

  constructor(seed: readonly IntegrationDemoDataset[] = DEFAULT_DEMO_DATASETS) {
    for (const dataset of seed) {
      this.datasets.set(dataset.environment, clone(dataset));
    }
  }

  get(environment: NhsAppEnvironment): IntegrationDemoDataset | null {
    const dataset = this.datasets.get(environment);
    return dataset ? clone(dataset) : null;
  }

  list(): IntegrationDemoDataset[] {
    return Array.from(this.datasets.values()).map((dataset) => clone(dataset));
  }

  reset(input: {
    readonly environment: NhsAppEnvironment;
    readonly now?: string;
  }): DemoDatasetResetResult {
    const before = this.get(input.environment);
    const resetOrdinal = (before?.resetOrdinal ?? 0) + 1;
    const dataset = buildDemoDataset(input.environment, {
      resetOrdinal,
      lastResetAt: input.now ?? RECORDED_AT,
      datasetState: "reset_complete",
    });
    this.datasets.set(input.environment, clone(dataset));
    const integrity = this.validate(dataset);
    return freeze({
      resetRunId: `DemoDatasetReset:384:${input.environment}:${resetOrdinal}:${dataset.datasetHash.slice(7, 19)}`,
      dataset,
      beforeHash: before?.datasetHash ?? null,
      afterHash: dataset.datasetHash,
      integrity,
    });
  }

  validate(dataset: IntegrationDemoDataset): DemoDatasetIntegrityResult {
    const coveredKinds = new Set(dataset.journeyCoverage.map((coverage) => coverage.journeyKind));
    const missingJourneyKinds = REQUIRED_DEMO_JOURNEY_KINDS.filter(
      (kind) => !coveredKinds.has(kind),
    );
    const unsafeRefs = unsafeFieldRefs(dataset);
    return freeze({
      datasetId: dataset.datasetId,
      environment: dataset.environment,
      integrityState:
        missingJourneyKinds.length === 0 && unsafeRefs.length === 0 ? "valid" : "invalid",
      missingJourneyKinds,
      unsafeFieldRefs: unsafeRefs,
      datasetHash: dataset.datasetHash,
    });
  }
}

export class TelemetryEventContractRegistry {
  private readonly contractsByName = new Map<string, TelemetryEventContract>();
  private readonly contractsById = new Map<string, TelemetryEventContract>();

  constructor(seed: readonly TelemetryEventContract[] = TELEMETRY_CONTRACTS) {
    for (const contract of seed) {
      this.contractsByName.set(contract.eventName, clone(contract));
      this.contractsById.set(contract.contractId, clone(contract));
    }
  }

  getByName(eventName: string): TelemetryEventContract | null {
    const contract = this.contractsByName.get(eventName);
    return contract ? clone(contract) : null;
  }

  getById(contractId: string): TelemetryEventContract | null {
    const contract = this.contractsById.get(contractId);
    return contract ? clone(contract) : null;
  }

  list(): TelemetryEventContract[] {
    return Array.from(this.contractsById.values()).map((contract) => clone(contract));
  }

  validateEvent(
    input: TelemetryEventValidationInput,
    profile: NHSAppEnvironmentProfile | null,
  ): TelemetryEventValidationResult {
    const contract = this.getByName(input.eventName);
    const failures: TelemetryValidationFailureReason[] = [];
    const quarantinedFieldRefs: string[] = [];

    if (!contract) {
      appendUnique(failures, "contract_missing");
      return telemetryValidationResult(input, null, failures, [], Object.keys(input.payload));
    }

    const allowed = new Set(contract.allowedFields);
    for (const key of Object.keys(input.payload)) {
      if (!allowed.has(key)) {
        appendUnique(failures, "unknown_field");
        appendUnique(quarantinedFieldRefs, key);
      }
    }
    for (const key of contract.requiredFields) {
      if (!(key in input.payload)) {
        appendUnique(failures, "required_field_missing");
        appendUnique(quarantinedFieldRefs, key);
      }
    }
    const prohibitedRefs = prohibitedFieldRefs(input.payload, contract.prohibitedFields);
    if (prohibitedRefs.length > 0) {
      appendUnique(failures, "prohibited_field_present");
      appendAll(quarantinedFieldRefs, prohibitedRefs);
    }
    const unsafe = unsafeTelemetryRefs(input.payload);
    appendAll(quarantinedFieldRefs, unsafe.fieldRefs);
    appendAll(failures, unsafe.failureReasons);
    if (profile) {
      const tupleDrift =
        input.expectedManifestVersion !== undefined &&
        input.expectedManifestVersion !== profile.manifestVersionRef;
      const fingerprintDrift =
        input.expectedConfigFingerprint !== undefined &&
        input.expectedConfigFingerprint !== profile.configFingerprint;
      const freezeDrift =
        input.expectedReleaseApprovalFreezeRef !== undefined &&
        input.expectedReleaseApprovalFreezeRef !== profile.releaseApprovalFreezeRef;
      const payloadTupleDrift =
        input.payload.manifestVersionRef !== profile.manifestVersionRef ||
        input.payload.releaseApprovalFreezeRef !== profile.releaseApprovalFreezeRef;
      if (tupleDrift || fingerprintDrift || freezeDrift || payloadTupleDrift) {
        appendUnique(failures, "release_tuple_drift");
      }
    }
    return telemetryValidationResult(
      input,
      contract,
      failures,
      contract.allowedFields.filter((field) => field in input.payload),
      unique(quarantinedFieldRefs),
    );
  }
}

export class ChannelTelemetryPlanBuilder {
  constructor(private readonly telemetryContracts: TelemetryEventContractRegistry) {}

  build(input: {
    readonly environment: NhsAppEnvironment;
    readonly profile: NHSAppEnvironmentProfile;
    readonly trackedJourneys?: readonly string[];
  }): ChannelTelemetryPlan {
    const contracts = this.telemetryContracts.list();
    const trackedJourneys = input.trackedJourneys?.length
      ? Array.from(input.trackedJourneys)
      : Array.from(input.profile.journeyPaths);
    const monthlyPackMappings = Object.fromEntries(
      contracts.map((contract) => [
        contract.eventName,
        Object.values(contract.monthlyPackFieldMap),
      ]),
    );
    const planCore = {
      environment: input.environment,
      manifestVersionRef: input.profile.manifestVersionRef,
      configFingerprint: input.profile.configFingerprint,
      telemetryNamespace: input.profile.telemetryNamespace,
      trackedJourneys,
      eventContractRefs: contracts.map((contract) => contract.contractId),
      successMetrics: ["route_entry_count", "sso_success_rate", "route_completion_rate"],
      failureMetrics: ["sso_failure_rate", "bridge_failure_rate", "artifact_failure_rate"],
      dropOffMetrics: ["entry_to_sso_dropoff", "route_exit_before_success"],
      alertThresholdRefs: [
        "AlertThreshold:384:sso-failure-rate",
        "AlertThreshold:384:bridge-failure-rate",
        "AlertThreshold:384:missing-telemetry-window",
      ],
      monthlyPackMappings,
      cohortBreakdowns: ["environment", "cohortRef", "journeyPathId", "platform"],
    };
    const planHash = hashString(stableStringify(planCore));
    return freeze({
      planId: input.profile.telemetryPlanRef,
      ...planCore,
      planHash,
      generatedAt: RECORDED_AT,
    });
  }
}

export interface Phase7EnvironmentTelemetryApplication {
  readonly manifestApplication: Phase7NhsAppManifestApplication;
  readonly routeReadinessApplication: Phase7RouteReadinessApplication;
  readonly profileRegistry: NHSAppEnvironmentProfileRegistry;
  readonly demoDatasetStore: IntegrationDemoDatasetStore;
  readonly telemetryContractRegistry: TelemetryEventContractRegistry;
  readonly telemetryPlanBuilder: ChannelTelemetryPlanBuilder;
  getEnvironmentProfile(environment: NhsAppEnvironment): NHSAppEnvironmentProfile | null;
  validateEnvironmentProfile(input: {
    readonly environment: NhsAppEnvironment;
    readonly expectedManifestVersion?: string;
    readonly expectedConfigFingerprint?: string;
    readonly expectedReleaseApprovalFreezeRef?: string;
  }): EnvironmentProfileValidationResult;
  validateEnvironmentParity(input?: {
    readonly environments?: readonly NhsAppEnvironment[];
  }): EnvironmentParityValidationResult;
  resetDemoDataset(input: {
    readonly environment: NhsAppEnvironment;
    readonly now?: string;
  }): DemoDatasetResetResult;
  buildTelemetryPlan(input: {
    readonly environment: NhsAppEnvironment;
    readonly trackedJourneys?: readonly string[];
  }): ChannelTelemetryPlan;
  validateTelemetryEvent(input: TelemetryEventValidationInput): TelemetryEventValidationResult;
  assembleSCALBundle(input: {
    readonly environment: NhsAppEnvironment;
    readonly owner?: string;
  }): SCALBundle;
  listEvidence(): Phase7EnvironmentTelemetryInventory;
}

export function createDefaultPhase7EnvironmentTelemetryApplication(input?: {
  readonly manifestApplication?: Phase7NhsAppManifestApplication;
  readonly routeReadinessApplication?: Phase7RouteReadinessApplication;
  readonly profileRegistry?: NHSAppEnvironmentProfileRegistry;
  readonly demoDatasetStore?: IntegrationDemoDatasetStore;
  readonly telemetryContractRegistry?: TelemetryEventContractRegistry;
  readonly telemetryPlanBuilder?: ChannelTelemetryPlanBuilder;
}): Phase7EnvironmentTelemetryApplication {
  const manifestApplication =
    input?.manifestApplication ?? createDefaultPhase7NhsAppManifestApplication();
  const routeReadinessApplication =
    input?.routeReadinessApplication ??
    createDefaultPhase7RouteReadinessApplication({ manifestApplication });
  const profileRegistry = input?.profileRegistry ?? new NHSAppEnvironmentProfileRegistry();
  const demoDatasetStore = input?.demoDatasetStore ?? new IntegrationDemoDatasetStore();
  const telemetryContractRegistry =
    input?.telemetryContractRegistry ?? new TelemetryEventContractRegistry();
  const telemetryPlanBuilder =
    input?.telemetryPlanBuilder ?? new ChannelTelemetryPlanBuilder(telemetryContractRegistry);

  function getEnvironmentProfile(environment: NhsAppEnvironment): NHSAppEnvironmentProfile | null {
    return profileRegistry.get(environment);
  }

  function validateEnvironmentProfile(input: {
    readonly environment: NhsAppEnvironment;
    readonly expectedManifestVersion?: string;
    readonly expectedConfigFingerprint?: string;
    readonly expectedReleaseApprovalFreezeRef?: string;
  }): EnvironmentProfileValidationResult {
    const profile = profileRegistry.get(input.environment);
    if (!profile) {
      return freeze({
        environment: input.environment,
        parityState: "blocked",
        failureReasons: ["profile_missing"],
        profile: null,
        routeReadiness: [],
        checkedAt: RECORDED_AT,
        watchTupleHash: null,
      });
    }

    const manifestExposure = manifestApplication.getManifestExposure({
      environment: input.environment,
      expectedManifestVersion: input.expectedManifestVersion,
      expectedConfigFingerprint: input.expectedConfigFingerprint,
      expectedReleaseApprovalFreezeRef: input.expectedReleaseApprovalFreezeRef,
    });
    const failures: EnvironmentProfileFailureReason[] = [];
    const tupleMatches =
      profile.manifestVersionRef === manifestExposure.manifestVersion &&
      profile.configFingerprint === manifestExposure.configFingerprint &&
      profile.releaseCandidateRef === manifestExposure.releaseTuple.releaseCandidateRef &&
      profile.releaseApprovalFreezeRef === manifestExposure.releaseTuple.releaseApprovalFreezeRef &&
      profile.behaviorContractSetRef === manifestExposure.releaseTuple.behaviorContractSetRef &&
      profile.surfaceSchemaSetRef === manifestExposure.releaseTuple.surfaceSchemaSetRef &&
      profile.compatibilityEvidenceRef === manifestExposure.releaseTuple.compatibilityEvidenceRef;
    if (!tupleMatches) {
      appendUnique(failures, "manifest_tuple_drift");
    }
    if (manifestExposure.environment.baseUrl !== profile.baseUrl) {
      appendUnique(failures, "base_url_mismatch");
    }
    const manifestRouteIds = new Set(manifestExposure.routes.map((route) => route.journeyPathId));
    if (profile.journeyPaths.some((journeyPath) => !manifestRouteIds.has(journeyPath))) {
      appendUnique(failures, "manifest_route_mismatch");
    }
    const routeReadiness = profile.journeyPaths.map((journeyPathId) =>
      routeReadinessApplication.evaluateRouteReadiness({
        environment: input.environment,
        journeyPathId,
        expectedManifestVersion: profile.manifestVersionRef,
        expectedConfigFingerprint: profile.configFingerprint,
        expectedReleaseApprovalFreezeRef: profile.releaseApprovalFreezeRef,
      }),
    );
    if (routeReadiness.some((result) => result.verdict !== "ready")) {
      appendUnique(failures, "readiness_not_current");
    }
    const telemetryPlan = buildTelemetryPlan({ environment: input.environment });
    if (
      telemetryPlan.eventContractRefs.some(
        (contractRef) => telemetryContractRegistry.getById(contractRef) === null,
      )
    ) {
      appendUnique(failures, "telemetry_contract_missing");
    }
    const demoDataset = demoDatasetStore.get(input.environment);
    if (!demoDataset) {
      appendUnique(failures, "demo_dataset_missing");
    } else if (demoDatasetStore.validate(demoDataset).integrityState !== "valid") {
      appendUnique(failures, "demo_dataset_invalid");
    }
    const parityState: EnvironmentParityState = failures.length === 0 ? "matching" : "drift";
    return freeze({
      environment: input.environment,
      parityState,
      failureReasons: failures,
      profile,
      routeReadiness,
      checkedAt: RECORDED_AT,
      watchTupleHash: profile.watchTupleHash,
    });
  }

  function validateEnvironmentParity(input?: {
    readonly environments?: readonly NhsAppEnvironment[];
  }): EnvironmentParityValidationResult {
    const environments = input?.environments ?? (["sandpit", "aos", "full_release"] as const);
    const profileResults = environments.map((environment) =>
      validateEnvironmentProfile({ environment }),
    );
    const failures = unique(profileResults.flatMap((result) => result.failureReasons));
    const profiles = profileResults
      .map((result) => result.profile)
      .filter((profile): profile is NHSAppEnvironmentProfile => profile !== null);
    const first = profiles[0] ?? null;
    if (
      first &&
      profiles.some(
        (profile) =>
          profile.manifestVersionRef !== first.manifestVersionRef ||
          profile.configFingerprint !== first.configFingerprint ||
          profile.releaseCandidateRef !== first.releaseCandidateRef ||
          profile.releaseApprovalFreezeRef !== first.releaseApprovalFreezeRef ||
          profile.behaviorContractSetRef !== first.behaviorContractSetRef ||
          profile.surfaceSchemaSetRef !== first.surfaceSchemaSetRef ||
          profile.compatibilityEvidenceRef !== first.compatibilityEvidenceRef ||
          stableStringify(profile.journeyPaths) !== stableStringify(first.journeyPaths),
      )
    ) {
      appendUnique(failures, "manifest_tuple_drift");
    }
    const comparedTupleHash = first
      ? hashString(
          stableStringify({
            manifestVersionRef: first.manifestVersionRef,
            configFingerprint: first.configFingerprint,
            releaseCandidateRef: first.releaseCandidateRef,
            releaseApprovalFreezeRef: first.releaseApprovalFreezeRef,
            behaviorContractSetRef: first.behaviorContractSetRef,
            surfaceSchemaSetRef: first.surfaceSchemaSetRef,
            compatibilityEvidenceRef: first.compatibilityEvidenceRef,
            journeyPaths: first.journeyPaths,
          }),
        )
      : null;
    return freeze({
      parityState: failures.length === 0 ? "matching" : "drift",
      environments: Array.from(environments),
      failureReasons: failures,
      profileResults,
      comparedTupleHash,
      checkedAt: RECORDED_AT,
    });
  }

  function resetDemoDataset(input: {
    readonly environment: NhsAppEnvironment;
    readonly now?: string;
  }): DemoDatasetResetResult {
    return demoDatasetStore.reset(input);
  }

  function buildTelemetryPlan(input: {
    readonly environment: NhsAppEnvironment;
    readonly trackedJourneys?: readonly string[];
  }): ChannelTelemetryPlan {
    const profile = profileRegistry.get(input.environment);
    if (!profile) {
      throw new Error(`ENVIRONMENT_PROFILE_MISSING: ${input.environment}`);
    }
    return telemetryPlanBuilder.build({
      environment: input.environment,
      profile,
      trackedJourneys: input.trackedJourneys,
    });
  }

  function validateTelemetryEvent(
    input: TelemetryEventValidationInput,
  ): TelemetryEventValidationResult {
    return telemetryContractRegistry.validateEvent(input, profileRegistry.get(input.environment));
  }

  function assembleSCALBundle(input: {
    readonly environment: NhsAppEnvironment;
    readonly owner?: string;
  }): SCALBundle {
    const validation = validateEnvironmentProfile({ environment: input.environment });
    const profile = validation.profile;
    if (!profile) {
      return blockedSCALBundle(input.environment, input.owner ?? "phase7-channel-assurance", [
        "profile_missing",
      ]);
    }
    const telemetryPlan = buildTelemetryPlan({ environment: input.environment });
    const dataset = demoDatasetStore.get(input.environment);
    const routeReadinessRefs = validation.routeReadiness.map((result) => result.readinessId);
    const accessibilityEvidenceRefs = validation.routeReadiness
      .map((result) => result.evidence.accessibilityAudit?.auditRef ?? null)
      .filter((ref): ref is string => ref !== null);
    const failureReasons = [...validation.failureReasons];
    if (!dataset) {
      appendUnique(failureReasons, "demo_dataset_missing");
    }
    if (routeReadinessRefs.length === 0) {
      appendUnique(failureReasons, "scal_evidence_missing");
    }
    const submissionState: SCALSubmissionState =
      failureReasons.length > 0
        ? "blocked"
        : input.environment === "sandpit" || input.environment === "local_preview"
          ? "draft"
          : "ready_for_submission";
    const evidenceRefs = unique([
      profile.profileId,
      telemetryPlan.planId,
      dataset?.datasetId ?? "IntegrationDemoDataset:missing",
      ...routeReadinessRefs,
      ...accessibilityEvidenceRefs,
      "ClinicalSafety:DCB0129-phase7-nhs-app-scal",
      "ClinicalSafety:DCB0160-phase7-euo-alignment",
      "Privacy:GDPR-PECR-phase7-telemetry-minimization",
      "IncidentRehearsal:phase7-nhs-app-sandpit-aos-walkthrough",
    ]);
    const core = {
      environment: input.environment,
      manifestVersionRef: profile.manifestVersionRef,
      configFingerprint: profile.configFingerprint,
      releaseApprovalFreezeRef: profile.releaseApprovalFreezeRef,
      evidenceRefs,
      owner: input.owner ?? "phase7-channel-assurance",
      submissionState,
      environmentProfileRef: profile.profileId,
      telemetryPlanRef: telemetryPlan.planId,
      demoDatasetRef: dataset?.datasetId ?? "IntegrationDemoDataset:missing",
      routeReadinessRefs,
      accessibilityEvidenceRefs,
      clinicalSafetyRefs: [
        "ClinicalSafety:DCB0129-phase7-nhs-app-scal",
        "ClinicalSafety:DCB0160-phase7-euo-alignment",
      ],
      privacyEvidenceRefs: ["Privacy:GDPR-PECR-phase7-telemetry-minimization"],
      incidentRehearsalRef: "IncidentRehearsal:phase7-nhs-app-sandpit-aos-walkthrough",
      failureReasons,
    };
    const bundleHash = hashString(stableStringify(core));
    return freeze({
      bundleId: profile.scalBundleRef,
      ...core,
      assembledAt: RECORDED_AT,
      bundleHash,
    });
  }

  function listEvidence(): Phase7EnvironmentTelemetryInventory {
    return freeze({
      schemaVersion: PHASE7_ENVIRONMENT_TELEMETRY_SCHEMA_VERSION,
      environmentProfiles: profileRegistry.list(),
      demoDatasets: demoDatasetStore.list(),
      telemetryEventContracts: telemetryContractRegistry.list(),
      telemetryPlans: profileRegistry
        .list()
        .map((profile) => buildTelemetryPlan({ environment: profile.environment })),
    });
  }

  return {
    manifestApplication,
    routeReadinessApplication,
    profileRegistry,
    demoDatasetStore,
    telemetryContractRegistry,
    telemetryPlanBuilder,
    getEnvironmentProfile,
    validateEnvironmentProfile,
    validateEnvironmentParity,
    resetDemoDataset,
    buildTelemetryPlan,
    validateTelemetryEvent,
    assembleSCALBundle,
    listEvidence,
  };
}

function buildEnvironmentProfile(environment: NhsAppEnvironment): NHSAppEnvironmentProfile {
  const tuple = defaultReleaseTuple();
  const profileCore = {
    environment,
    environmentStage: environment,
    baseUrl: BASE_URL_BY_ENVIRONMENT[environment],
    journeyPaths: [...DEFAULT_PROFILE_JOURNEY_PATHS],
    ssoConfigRef: `NHSAppSSOConfig:384:${environment}`,
    siteLinkConfigRef: `SiteLinkConfig:384:${environment}`,
    telemetryNamespace: `nhsapp.phase7.${environment}`,
    telemetryPlanRef: `ChannelTelemetryPlan:384:${environment}`,
    allowedCohorts: COHORTS_BY_ENVIRONMENT[environment],
    ...tuple,
    guardrailPolicyRef: "ReleaseGuardrailPolicy:385:phase7-default-pending",
    stabilizationCriteriaRef: "StabilizationCriteria:384:sandpit-aos-live-green-window",
    demoDatasetRef: `IntegrationDemoDataset:384:${environment}:v1`,
    scalBundleRef: `SCALBundle:384:${environment}:current`,
    profileState:
      environment === "local_preview" ? ("profile_draft" as const) : ("profile_ready" as const),
    evidenceRefs: [
      "ManifestPromotionBundle:377:phase7-current",
      "RouteReadinessEvidence:383:current",
      "TelemetryContractSet:384:privacy-minimized",
      "IntegrationDemoDataset:384:stable-seed",
    ],
    updatedAt: RECORDED_AT,
  };
  const watchTupleHash = hashString(stableStringify(profileCore));
  return freeze({
    profileId: `NHSAppEnvironmentProfile:384:${environment}`,
    ...profileCore,
    watchTupleHash,
  });
}

function buildDemoDataset(
  environment: NhsAppEnvironment,
  input?: {
    readonly resetOrdinal?: number;
    readonly lastResetAt?: string;
    readonly datasetState?: DemoDatasetState;
  },
): IntegrationDemoDataset {
  const patientA = `SyntheticPatient:384:${environment}:A`;
  const patientB = `SyntheticPatient:384:${environment}:B`;
  const core = {
    datasetId: `IntegrationDemoDataset:384:${environment}:v1`,
    environment,
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    journeyCoverage: [
      coverage("request", "jp_start_medical_request"),
      coverage("booking", "jp_manage_local_appointment"),
      coverage("waitlist", "jp_waitlist_offer_response"),
      coverage("pharmacy", "jp_pharmacy_status"),
      coverage("status", "jp_request_status"),
    ],
    syntheticPatients: [
      {
        syntheticPatientRef: patientA,
        personaSegment: "adult_repeat_user" as const,
        loginAssuranceRef: "NHSLoginAssurance:synthetic-p9",
        registeredPracticeOds: "A83001",
      },
      {
        syntheticPatientRef: patientB,
        personaSegment: "accessibility_needs" as const,
        loginAssuranceRef: "NHSLoginAssurance:synthetic-p9",
        registeredPracticeOds: "B82001",
      },
    ],
    syntheticRequests: [
      {
        syntheticRequestRef: `SyntheticRequest:384:${environment}:medical-draft`,
        syntheticPatientRef: patientA,
        journeyPathRef: "jp_start_medical_request",
        requestType: "medical" as const,
        currentState: "draft" as const,
        summaryRef: "SyntheticSummary:384:medical-draft",
      },
      {
        syntheticRequestRef: `SyntheticRequest:384:${environment}:more-info`,
        syntheticPatientRef: patientB,
        journeyPathRef: "jp_respond_more_info",
        requestType: "admin" as const,
        currentState: "awaiting_more_info" as const,
        summaryRef: "SyntheticSummary:384:more-info",
      },
    ],
    syntheticAppointments: [
      {
        syntheticAppointmentRef: `SyntheticAppointment:384:${environment}:manage`,
        syntheticPatientRef: patientA,
        journeyPathRef: "jp_manage_local_appointment",
        appointmentState: "reschedule_available" as const,
        providerRef: "SyntheticProvider:384:local-booking",
        artifactRef: "artifact:382:appointment-letter",
      },
    ],
    syntheticWaitlistOffers: [
      {
        syntheticWaitlistRef: `SyntheticWaitlist:384:${environment}:offer`,
        syntheticPatientRef: patientA,
        journeyPathRef: "jp_waitlist_offer_response",
        offerState: "pending_response" as const,
        deadlineRef: "SyntheticDeadline:384:waitlist-offer",
      },
    ],
    syntheticPharmacyCases: [
      {
        syntheticPharmacyCaseRef: `SyntheticPharmacyCase:384:${environment}:ready`,
        syntheticPatientRef: patientB,
        journeyPathRef: "jp_pharmacy_status",
        pharmacyState: "ready_to_collect" as const,
        pharmacyRef: "SyntheticPharmacy:384:high-street",
      },
    ],
    syntheticStatusViews: [
      {
        syntheticRequestRef: `SyntheticStatusView:384:${environment}:status`,
        syntheticPatientRef: patientA,
        journeyPathRef: "jp_request_status",
        requestType: "status" as const,
        currentState: "submitted" as const,
        summaryRef: "SyntheticSummary:384:request-status",
      },
    ],
  };
  const datasetHash = hashString(stableStringify(core));
  return freeze({
    ...core,
    resetOrdinal: input?.resetOrdinal ?? 1,
    lastResetAt: input?.lastResetAt ?? RECORDED_AT,
    datasetState: input?.datasetState ?? "seeded",
    datasetHash,
  });
}

function coverage(journeyKind: DemoJourneyKind, journeyPathRef: string): DemoJourneyCoverage {
  return {
    journeyKind,
    journeyPathRef,
    scenarioRef: `DemoScenario:384:${journeyKind}`,
    coverageState: "covered",
  };
}

function telemetryContract(
  contractId: string,
  eventName: string,
  input: {
    readonly requiredFields: readonly string[];
    readonly allowedFields?: readonly string[];
    readonly monthlyPackFieldMap: Readonly<Record<string, string>>;
  },
): TelemetryEventContract {
  const commonAllowed = [
    "environment",
    "journeyPathId",
    "routeFamilyRef",
    "manifestVersionRef",
    "releaseApprovalFreezeRef",
    "channelSessionHash",
    "occurredAt",
  ];
  return {
    contractId,
    eventName,
    allowedFields: unique([
      ...commonAllowed,
      ...input.requiredFields,
      ...(input.allowedFields ?? []),
    ]),
    requiredFields: input.requiredFields,
    prohibitedFields: COMMON_PROHIBITED_TELEMETRY_FIELDS,
    pseudonymousJoinKey: "channelSessionHash",
    retentionClass: "monthly_aggregate",
    monthlyPackFieldMap: input.monthlyPackFieldMap,
  };
}

function telemetryValidationResult(
  input: TelemetryEventValidationInput,
  contract: TelemetryEventContract | null,
  failures: readonly TelemetryValidationFailureReason[],
  acceptedFieldRefs: readonly string[],
  quarantinedFieldRefs: readonly string[],
): TelemetryEventValidationResult {
  const payloadHash = hashString(stableStringify(input.payload));
  return freeze({
    validationId: `TelemetryValidation:384:${input.eventName}:${payloadHash.slice(7, 23)}`,
    eventName: input.eventName,
    environment: input.environment,
    validationState: failures.length === 0 ? "accepted" : "quarantined",
    failureReasons: unique(failures),
    acceptedFieldRefs: unique(acceptedFieldRefs),
    quarantinedFieldRefs: unique(quarantinedFieldRefs),
    contractRef: contract?.contractId ?? null,
    payloadHash,
    validatedAt: RECORDED_AT,
  });
}

function unsafeTelemetryRefs(payload: Readonly<Record<string, unknown>>): {
  readonly failureReasons: readonly TelemetryValidationFailureReason[];
  readonly fieldRefs: readonly string[];
} {
  const failures: TelemetryValidationFailureReason[] = [];
  const fieldRefs: string[] = [];
  walk(payload, [], (path, value) => {
    const fieldRef = path.join(".");
    const lowerPath = fieldRef.toLowerCase();
    if (/(patientid|subjectref|nhsnumber|email|phone)/u.test(lowerPath)) {
      appendUnique(failures, "patient_identifier_detected");
      appendUnique(fieldRefs, fieldRef);
    }
    if (/grantid|bytegrant/u.test(lowerPath)) {
      appendUnique(failures, "grant_identifier_detected");
      appendUnique(fieldRefs, fieldRef);
    }
    if (typeof value !== "string") {
      return;
    }
    if (looksLikeJwt(value)) {
      appendUnique(failures, "raw_jwt_detected");
      appendUnique(fieldRefs, fieldRef);
    }
    if (/asserted(Login|_login)_?identity=|nhsNumber=|patientId=|subjectRef=/iu.test(value)) {
      appendUnique(failures, "phi_query_string_detected");
      appendUnique(fieldRefs, fieldRef);
    }
    if (/ArtifactByteGrant:|AccessGrant:|grant_[A-Za-z0-9]/u.test(value)) {
      appendUnique(failures, "grant_identifier_detected");
      appendUnique(fieldRefs, fieldRef);
    }
  });
  return { failureReasons: failures, fieldRefs };
}

function prohibitedFieldRefs(
  payload: Readonly<Record<string, unknown>>,
  prohibitedFields: readonly string[],
): string[] {
  const prohibited = new Set(prohibitedFields.map((field) => field.toLowerCase()));
  const refs: string[] = [];
  walk(payload, [], (path) => {
    const key = path[path.length - 1]?.toLowerCase();
    if (key && prohibited.has(key)) {
      refs.push(path.join("."));
    }
  });
  return refs;
}

function unsafeFieldRefs(value: unknown): string[] {
  const refs: string[] = [];
  walk(value, [], (path, entry) => {
    const fieldRef = path.join(".");
    if (
      typeof entry === "string" &&
      (looksLikeJwt(entry) || /nhsNumber|patientId|subjectRef/u.test(entry))
    ) {
      refs.push(fieldRef);
    }
  });
  return refs;
}

function blockedSCALBundle(
  environment: NhsAppEnvironment,
  owner: string,
  failureReasons: readonly EnvironmentProfileFailureReason[],
): SCALBundle {
  const core = {
    environment,
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    evidenceRefs: [],
    owner,
    submissionState: "blocked" as const,
    environmentProfileRef: "NHSAppEnvironmentProfile:missing",
    telemetryPlanRef: "ChannelTelemetryPlan:missing",
    demoDatasetRef: "IntegrationDemoDataset:missing",
    routeReadinessRefs: [],
    accessibilityEvidenceRefs: [],
    clinicalSafetyRefs: [],
    privacyEvidenceRefs: [],
    incidentRehearsalRef: "IncidentRehearsal:missing",
    failureReasons,
  };
  return freeze({
    bundleId: `SCALBundle:384:${environment}:blocked`,
    ...core,
    assembledAt: RECORDED_AT,
    bundleHash: hashString(stableStringify(core)),
  });
}

function defaultReleaseTuple(): ReleaseTuplePin {
  return {
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseCandidateRef: PHASE7_RELEASE_CANDIDATE_REF,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    behaviorContractSetRef: PHASE7_BEHAVIOR_CONTRACT_SET_REF,
    surfaceSchemaSetRef: PHASE7_SURFACE_SCHEMA_SET_REF,
    compatibilityEvidenceRef: PHASE7_COMPATIBILITY_EVIDENCE_REF,
  };
}

function walk(
  value: unknown,
  path: readonly string[],
  visit: (path: readonly string[], value: unknown) => void,
): void {
  visit(path, value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, [...path, String(index)], visit));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      walk(entry, [...path, key], visit);
    }
  }
}

function looksLikeJwt(value: string): boolean {
  return /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/u.test(value);
}

function appendUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function appendAll<T>(values: T[], additions: readonly T[]): void {
  for (const value of additions) {
    appendUnique(values, value);
  }
}

function unique<T>(values: readonly T[]): T[] {
  const result: T[] = [];
  for (const value of values) {
    appendUnique(result, value);
  }
  return result;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(clone(value));
}
