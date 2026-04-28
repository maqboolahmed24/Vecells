import type {
  ClaimHubExceptionWorkInput,
  ClaimHubExceptionWorkResult,
  OpenHubExceptionWorkInput,
  OpenHubExceptionWorkResult,
  Phase5HubBackgroundIntegrityService,
  ProcessHubExceptionWorkInput,
  ProcessHubExceptionWorkResult,
} from "@vecells/domain-hub-coordination";

export interface ServiceRouteDefinition {
  routeId: string;
  method: "GET" | "POST";
  path: string;
  purpose: string;
  bodyRequired: boolean;
  idempotencyRequired: boolean;
}

export const serviceDefinition = {
  service: "hub-exception-worker",
  packageName: "@vecells/hub-exception-worker",
  ownerContext: "hub_coordination",
  workloadFamily: "hub_exception_processing",
  purpose:
    "Own typed exception backlog work for hub coordination, including retry fences, escalation state, audit rows, and replay-safe resolution.",
  truthBoundary:
    "Exception work exposes risk and recovery. It cannot quietly clear supplier drift, stale leases, or disputed imported evidence without an explicit typed action.",
  adminRoutes: ["/health", "/ready", "/manifest"],
  routeCatalog: [
    {
      routeId: "open_hub_exception_work",
      method: "POST",
      path: "/exceptions/open",
      purpose: "Open or replay one typed hub exception work item.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "claim_hub_exception_work",
      method: "POST",
      path: "/exceptions/claim",
      purpose: "Claim one exception work item for retry, escalation, or governed resolution.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "process_hub_exception_work",
      method: "POST",
      path: "/exceptions/process",
      purpose: "Apply a typed retry, escalate, resolve, or suppress action to one claimed exception work item.",
      bodyRequired: true,
      idempotencyRequired: true,
    }
  ] as const satisfies readonly ServiceRouteDefinition[],
  topics: {
    consumes: ["hub.exception.opened", "hub.exception.retry-due"],
    publishes: ["hub.exception.updated", "hub.exception.resolved"]
  },
  persistenceTables: [
    "phase5_hub_exception_work_items",
    "phase5_hub_exception_audit_rows"
  ] as const,
  readinessChecks: [
    {
      name: "retry_and_escalation_state",
      detail: "Retry count, retry-after, and escalation posture survive worker restart or replay."
    },
    {
      name: "stale_owner_guard",
      detail: "Expired leases raise a stale-owner exception instead of letting a second worker overwrite live work."
    }
  ] as const
} as const;

export interface HubExceptionWorkerApplication {
  integrity: Phase5HubBackgroundIntegrityService;
  open(input: OpenHubExceptionWorkInput): Promise<OpenHubExceptionWorkResult>;
  claim(input: ClaimHubExceptionWorkInput): Promise<ClaimHubExceptionWorkResult>;
  process(input: ProcessHubExceptionWorkInput): Promise<ProcessHubExceptionWorkResult>;
}

export function createHubExceptionWorkerApplication(
  integrity: Phase5HubBackgroundIntegrityService,
): HubExceptionWorkerApplication {
  return {
    integrity,
    open(input) {
      return integrity.openExceptionWork(input);
    },
    claim(input) {
      return integrity.claimExceptionWork(input);
    },
    process(input) {
      return integrity.processExceptionWork(input);
    },
  };
}
