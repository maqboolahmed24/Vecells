import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPERATIONAL_DESTINATION_SCHEMA_VERSION,
  createDestinationSyntheticPayload,
  createOperationalDestinationBinding,
  createOperationalDestinationRegistryProjection,
  requiredOperationalDestinationClasses,
  upsertOperationalDestinationBinding,
  verifyOperationalDestinationBinding,
} from "../../packages/domains/operations/src/index";

describe("task 461 operational destination registry", () => {
  it("covers every required destination class with secret refs and fail-closed policy", () => {
    const projection = createOperationalDestinationRegistryProjection();
    expect(projection.schemaVersion).toBe(OPERATIONAL_DESTINATION_SCHEMA_VERSION);
    expect(projection.bindings).toHaveLength(10);
    expect(projection.bindings.map((binding) => binding.destinationClass)).toEqual(
      requiredOperationalDestinationClasses,
    );
    for (const binding of projection.bindings) {
      expect(binding.secretMaterialInline).toBe(false);
      expect(binding.secretRef).toMatch(/^vault-ref\//);
      expect(binding.endpointLabel).not.toMatch(/https?:\/\//);
      expect(binding.redactionPolicyHash).toMatch(/^sha256:/);
      expect(binding.failClosedPolicy).toEqual({
        staleSecret: true,
        staleRedactionPolicy: true,
        staleRuntimePublication: true,
        missingVerification: true,
      });
    }
  });

  it("upserts by natural key and preserves tenant/environment isolation", () => {
    const projection = createOperationalDestinationRegistryProjection();
    const candidate = createOperationalDestinationBinding(
      {
        destinationClass: "service_level_breach_risk_alert",
        label: "Service-level breach-risk alerts",
        audience: "Operations duty lead",
        purpose: "Replay idempotency candidate",
        eventClass: "ops.slo.breach_risk",
        severityThreshold: "caution",
        routeFamily: "service_breach",
        consumedBy: ["operations", "incident"],
      },
      {
        tenantRef: projection.tenantRef,
        environmentRef: projection.environmentRef,
        selected: true,
      },
    );
    const replay = upsertOperationalDestinationBinding(projection.bindings, candidate);
    expect(replay).toHaveLength(projection.bindings.length);
    expect(replay.filter((binding) => binding.destinationClass === candidate.destinationClass))
      .toHaveLength(1);

    const otherTenant = createOperationalDestinationRegistryProjection({
      tenantRef: "tenant-assurance-lab",
      environmentRef: "preview",
    });
    expect(otherTenant.bindings[0]?.idempotencyStrategy.naturalKey).not.toBe(
      projection.bindings[0]?.idempotencyStrategy.naturalKey,
    );
  });

  it("settles verification and emits only redacted synthetic fake receiver payloads", () => {
    const projection = createOperationalDestinationRegistryProjection();
    const selected = projection.selectedBinding;
    const verification = verifyOperationalDestinationBinding(selected);
    expect(verification.verification.status).toBe("verified");
    expect(verification.settlement.result).toBe("delivered");
    expect(verification.fakeReceiverRecord.accepted).toBe(true);

    const payload = createDestinationSyntheticPayload(selected);
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toMatch(/https?:\/\//);
    expect(serialized).not.toMatch(/accessToken|credential|rawWebhookUrl|inlineSecret/);
    expect(Object.keys(payload).sort()).toEqual(
      [
        "correlationId",
        "destinationClass",
        "environmentRef",
        "eventClass",
        "idempotencyKey",
        "receiverRef",
        "redactionPolicyHash",
        "safeDescriptorHash",
        "schemaVersion",
        "scopeTupleHash",
        "severityThreshold",
        "syntheticSummary",
        "tenantRef",
      ].sort(),
    );
  });

  it("fails closed for missing secret, denied scope, stale destination, delivery failure, and permission denial", () => {
    const expectations = [
      ["missing_secret", "missing_secret", "blocked"],
      ["denied_scope", "denied_scope", "blocked"],
      ["stale_destination", "stale", "stale"],
      ["delivery_failed", "failed", "failed"],
      ["permission_denied", "permission_denied", "permission_denied"],
    ] as const;
    for (const [scenarioState, verificationState, settlementResult] of expectations) {
      const projection = createOperationalDestinationRegistryProjection({ scenarioState });
      expect(projection.selectedBinding.lastVerification.status).toBe(verificationState);
      expect(projection.selectedBinding.settlement.result).toBe(settlementResult);
      expect(projection.downstreamReadiness.some((readiness) => readiness.readinessState !== "ready"))
        .toBe(true);
    }
    const deliveryFailed = createOperationalDestinationRegistryProjection({
      scenarioState: "delivery_failed",
    });
    expect(deliveryFailed.selectedBinding.settlement.fallbackTriggered).toBe(true);
    expect(deliveryFailed.selectedBinding.settlement.fallbackBindingId).toBe(
      "dest-destination-delivery-failure-fallback",
    );
  });

  it("keeps generated schema and gap artifacts available", () => {
    const root = process.cwd();
    expect(
      fs.existsSync(path.join(root, "data/contracts/461_operational_destination_binding.schema.json")),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          root,
          "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_461_DESTINATION_REGISTRY.json",
        ),
      ),
    ).toBe(true);
  });
});
