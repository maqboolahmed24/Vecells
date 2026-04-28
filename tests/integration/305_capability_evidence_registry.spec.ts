import path from "node:path";
import fs from "node:fs";

import { describe, expect, it } from "vitest";

import { resetProviderSandboxes } from "../../scripts/providers/304_provider_sandbox_lib.ts";
import {
  buildProviderCapabilityEvidenceRegistry,
  buildProviderPrerequisiteRegistry,
  buildProviderTestCredentialManifest,
  captureProviderCapabilityEvidence,
  validateProviderCapabilityEvidence,
} from "../../scripts/providers/305_provider_capability_evidence_lib.ts";

const TEST_OUTPUT_DIR = path.resolve(
  process.cwd(),
  ".artifacts",
  "provider-evidence",
  "305-integration",
);
const SANDBOX_OUTPUT_DIR = path.resolve(
  process.cwd(),
  ".artifacts",
  "provider-sandboxes",
  "304-for-305-integration",
);

describe("305 capability evidence registry", () => {
  it("binds capability claims to the current provider binding, prerequisites, and masked credentials", async () => {
    await resetProviderSandboxes({ outputDir: SANDBOX_OUTPUT_DIR });

    const firstCapture = await captureProviderCapabilityEvidence({
      outputDir: TEST_OUTPUT_DIR,
      sandboxOutputDir: SANDBOX_OUTPUT_DIR,
    });
    const secondCapture = await captureProviderCapabilityEvidence({
      outputDir: TEST_OUTPUT_DIR,
      sandboxOutputDir: SANDBOX_OUTPUT_DIR,
    });
    const registry = await buildProviderCapabilityEvidenceRegistry();
    const credentials = await buildProviderTestCredentialManifest();
    const prerequisites = await buildProviderPrerequisiteRegistry();
    const validation = await validateProviderCapabilityEvidence({ outputDir: TEST_OUTPUT_DIR });

    expect(registry.coverageSummary).toMatchObject({
      sandboxCount: 7,
      uniqueProviderRowCount: 6,
      evidenceRowCount: 105,
      statusCounts: {
        current: 30,
        review_required: 60,
        manual_attested: 15,
      },
      observationMethodCounts: {
        browser_observed: 30,
        document_observed: 60,
        manual_attested: 15,
      },
    });

    expect(credentials.credentials).toHaveLength(19);
    expect(prerequisites.prerequisites).toHaveLength(21);
    expect(firstCapture.observationFiles).toHaveLength(7);
    expect(secondCapture.observationFiles).toHaveLength(7);
    expect(firstCapture.automatedSandboxIds).toEqual([
      "sandbox_304_vecells_local_gateway_local_twin",
      "sandbox_304_vecells_local_gateway_sandbox_twin",
    ]);
    expect([...firstCapture.reviewRequiredSandboxIds].sort()).toEqual([
      "sandbox_304_gp_connect_integration_candidate",
      "sandbox_304_optum_im1_supported_test",
      "sandbox_304_tpp_im1_patient_supported_test",
      "sandbox_304_tpp_im1_transaction_supported_test",
    ]);
    expect(
      secondCapture.callbackVerification.callbackChecks.find(
        (row) => row.callbackId === "callback_304_vecells_local_gateway_local_twin",
      ),
    ).toMatchObject({
      state: "verified",
      receiptDecisionClasses: ["accepted_new", "semantic_replay", "stale_ignored"],
    });
    expect(
      secondCapture.callbackVerification.callbackChecks.find(
        (row) => row.callbackId === "callback_304_tpp_im1_transaction_supported_test",
      ),
    ).toMatchObject({
      state: "manual_bridge_required",
      receiptDecisionClasses: [],
    });
    expect(validation.valid).toBe(true);

    const localGatewaySearch = registry.evidenceRows.find(
      (row) =>
        row.sandboxId === "sandbox_304_vecells_local_gateway_local_twin" &&
        row.capabilityClaimRef === "search_slots_support",
    );
    const localGatewayReschedule = registry.evidenceRows.find(
      (row) =>
        row.sandboxId === "sandbox_304_vecells_local_gateway_local_twin" &&
        row.capabilityClaimRef === "reschedule_appointment_support",
    );
    const optumRow = registry.evidenceRows.find(
      (row) =>
        row.sandboxId === "sandbox_304_optum_im1_supported_test" &&
        row.capabilityClaimRef === "patient_self_service_posture",
    );

    expect(localGatewaySearch).toMatchObject({
      claimOutcome: "supported",
      claimValue: true,
      evidenceStatus: "current",
    });
    expect(localGatewayReschedule).toMatchObject({
      claimOutcome: "unsupported",
      claimValue: false,
      evidenceStatus: "current",
    });
    expect(optumRow).toMatchObject({
      claimOutcome: "supported",
      claimValue: true,
      evidenceStatus: "review_required",
    });

    for (const credential of credentials.credentials) {
      expect(credential.secretRef).toMatch(/^(secret|vault|env):\/\//);
      expect(credential.maskedFingerprint).toMatch(/^sha256:/);
    }

    for (const row of registry.evidenceRows) {
      expect(row.bookingCapabilityResolutionRef).toMatch(/^booking_capability_resolution_/);
      expect(row.capabilityTupleHash).toMatch(/^[a-f0-9]{64}$/);
      expect(row.staleAfter > row.observedAt).toBe(true);
    }

    for (const observationPath of firstCapture.observationFiles) {
      expect(fs.existsSync(observationPath)).toBe(true);
    }
  });
});
