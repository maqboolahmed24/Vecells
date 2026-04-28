import type {
  IngestHubSupplierMirrorObservationInput,
  IngestHubSupplierMirrorObservationResult,
  Phase5HubBackgroundIntegrityService,
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
  service: "hub-supplier-mirror",
  packageName: "@vecells/hub-supplier-mirror",
  ownerContext: "hub_coordination",
  workloadFamily: "hub_supplier_mirroring",
  purpose:
    "Own supplier-side observation polling or callback adaptation, monotone checkpointing, drift classification, and governed downstream recovery triggers for booked hub appointments.",
  truthBoundary:
    "Supplier observations may freeze or dispute manage posture. Replayed, stale, or weaker booked payloads may not thaw a more severe drift state.",
  adminRoutes: ["/health", "/ready", "/manifest"],
  routeCatalog: [
    {
      routeId: "ingest_supplier_observation",
      method: "POST",
      path: "/mirror/observations",
      purpose: "Ingest one supplier observation payload through the monotone mirror worker.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "query_supplier_checkpoint",
      method: "GET",
      path: "/mirror/checkpoints/current",
      purpose: "Expose the latest drift posture, freeze reason, and checkpoint state for a hub appointment.",
      bodyRequired: false,
      idempotencyRequired: false,
    }
  ] as const satisfies readonly ServiceRouteDefinition[],
  topics: {
    consumes: ["hub.supplier.poll.requested", "hub.supplier.callback.received"],
    publishes: ["hub.supplier.drift-detected", "hub.supplier.checkpoint.recorded"]
  },
  persistenceTables: [
    "phase5_hub_supplier_observations",
    "phase5_hub_supplier_mirror_checkpoints"
  ] as const,
  readinessChecks: [
    {
      name: "observation_dedupe",
      detail: "Supplier payload IDs replay safely and cannot duplicate drift side effects."
    },
    {
      name: "monotone_freeze",
      detail: "A replayed or lower-confidence booked observation cannot thaw a frozen mirror."
    }
  ] as const
} as const;

export interface HubSupplierMirrorApplication {
  integrity: Phase5HubBackgroundIntegrityService;
  ingest(
    input: IngestHubSupplierMirrorObservationInput,
  ): Promise<IngestHubSupplierMirrorObservationResult>;
}

export function createHubSupplierMirrorApplication(
  integrity: Phase5HubBackgroundIntegrityService,
): HubSupplierMirrorApplication {
  return {
    integrity,
    ingest(input) {
      return integrity.ingestSupplierMirrorObservation(input);
    },
  };
}
