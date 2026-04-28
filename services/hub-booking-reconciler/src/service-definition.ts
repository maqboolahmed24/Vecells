import type {
  ClaimHubReconciliationAttemptInput,
  ClaimHubReconciliationAttemptResult,
  Phase5HubBackgroundIntegrityService,
  ResolveHubReconciliationAttemptInput,
  ResolveHubReconciliationAttemptResult,
  RunHubProjectionBackfillInput,
  RunHubProjectionBackfillResult,
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
  service: "hub-booking-reconciler",
  packageName: "@vecells/hub-booking-reconciler",
  ownerContext: "hub_coordination",
  workloadFamily: "hub_booking_reconciliation",
  purpose:
    "Own deterministic reconciliation claims, imported evidence settlement, and open-case truth backfill for hub booking attempts that have already left the optimistic commit path.",
  truthBoundary:
    "The reconciler may resolve, dispute, or widen recovery. It may not mint a calmer booked posture from mismatched binding, stale tuple, or ambiguous lineage.",
  adminRoutes: ["/health", "/ready", "/manifest"],
  routeCatalog: [
    {
      routeId: "claim_reconciliation_attempt",
      method: "POST",
      path: "/reconciliation/claim",
      purpose: "Claim exactly one active lease for a reconciliation-required hub commit attempt.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "resolve_reconciliation_attempt",
      method: "POST",
      path: "/reconciliation/resolve",
      purpose: "Resolve a claimed reconciliation attempt with authoritative evidence or a typed retry/escalation outcome.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "backfill_open_case_truth",
      method: "POST",
      path: "/backfill/open-case-truth",
      purpose: "Rebuild one current truth projection for an open hub case from durable lineage records.",
      bodyRequired: true,
      idempotencyRequired: true,
    }
  ] as const satisfies readonly ServiceRouteDefinition[],
  topics: {
    consumes: ["hub.commit.reconciliation-required", "hub.confirmation.imported"],
    publishes: ["hub.reconciliation.resolved", "hub.truth.backfill.recorded"]
  },
  persistenceTables: [
    "phase5_hub_reconciliation_work_leases",
    "phase5_hub_imported_confirmation_correlations",
    "phase5_hub_projection_backfill_cursors"
  ] as const,
  readinessChecks: [
    {
      name: "single_owner_lease",
      detail: "Exactly one active reconciliation lease can exist per commit attempt."
    },
    {
      name: "binding_and_tuple_fence",
      detail: "Imported confirmations settle truth only when live provider binding and truth tuple still match."
    },
    {
      name: "backfill_fail_closed",
      detail: "Ambiguous lineage escalates instead of reconstructing a calmer booked state."
    }
  ] as const
} as const;

export interface HubBookingReconcilerApplication {
  integrity: Phase5HubBackgroundIntegrityService;
  claim(input: ClaimHubReconciliationAttemptInput): Promise<ClaimHubReconciliationAttemptResult>;
  resolve(
    input: ResolveHubReconciliationAttemptInput,
  ): Promise<ResolveHubReconciliationAttemptResult>;
  backfill(input: RunHubProjectionBackfillInput): Promise<RunHubProjectionBackfillResult>;
}

export function createHubBookingReconcilerApplication(
  integrity: Phase5HubBackgroundIntegrityService,
): HubBookingReconcilerApplication {
  return {
    integrity,
    claim(input) {
      return integrity.claimReconciliationAttempt(input);
    },
    resolve(input) {
      return integrity.resolveReconciliationAttempt(input);
    },
    backfill(input) {
      return integrity.runProjectionBackfill(input);
    },
  };
}
