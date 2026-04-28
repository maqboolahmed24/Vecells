import fs from "node:fs";
import path from "node:path";
import {
  createOperationalDestinationRegistryProjection,
  createOperationalDestinationRegistryFixture,
} from "../../packages/domains/operations/src/index";
import { runConfigureAlertingDestinationsSuite } from "../../tests/playwright/461_configure_alerting_destinations.spec";
import { runDestinationRedactionAndSecretRefSuite } from "../../tests/playwright/461_destination_redaction_and_secret_refs.spec";

const root = process.cwd();
const outputDir = path.join(root, ".artifacts", "operational-destinations-461");

export async function configureObservabilityIncidentAlertingDestinations() {
  fs.mkdirSync(outputDir, { recursive: true });
  await runConfigureAlertingDestinationsSuite();
  await runDestinationRedactionAndSecretRefSuite();

  const fixture = createOperationalDestinationRegistryFixture();
  const projection = createOperationalDestinationRegistryProjection({ scenarioState: "normal" });
  const summary = {
    schemaVersion: "461.phase9.destination-browser-automation-summary.v1",
    generatedAt: "2026-04-28T09:46:00Z",
    route: "/ops/config/destinations",
    requiredDestinationClasses: fixture.requiredDestinationClasses,
    verifiedBindings: projection.bindings.map((binding) => ({
      bindingId: binding.bindingId,
      destinationClass: binding.destinationClass,
      verificationState: binding.lastVerification.status,
      settlementResult: binding.settlement.result,
      receiverRef: binding.receiverRef,
      secretMaterialInline: binding.secretMaterialInline,
      redactionPolicyHash: binding.redactionPolicyHash,
    })),
    downstreamReadiness: projection.downstreamReadiness,
  };
  fs.writeFileSync(
    path.join(outputDir, "destination-browser-automation-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  return summary;
}

if (process.argv.includes("--run")) {
  await configureObservabilityIncidentAlertingDestinations();
}
