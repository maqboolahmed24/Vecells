import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  collectTrackedSecretRefs,
  containsSensitiveLeak,
  redactSensitiveText,
  transitionSandboxRequestState,
  verifyUpdateRecordAndTransportSandboxReadiness,
} from "../../scripts/pharmacy/367_update_record_transport_sandbox_lib.ts";

describe("367 transport sandbox redaction and readiness", () => {
  it("redacts tracked secret locators and raw credential tokens", async () => {
    const secretRefs = await collectTrackedSecretRefs();
    const raw = `${secretRefs[0]} client_secret=abc password=test`;

    expect(containsSensitiveLeak(raw, secretRefs)).toBe(true);

    const redacted = redactSensitiveText(raw, secretRefs);
    expect(redacted).toContain("[redacted:");
    expect(containsSensitiveLeak(redacted, secretRefs)).toBe(false);
  });

  it("keeps manual-stop rows explicit and submits rehearsal rows safely", async () => {
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "vecells-367-readiness-"),
    );

    const manualStop = await transitionSandboxRequestState({
      requestId: "update_record_367_integration_pairing",
      action: "submit_request",
      outputDir,
    });
    const submitted = await transitionSandboxRequestState({
      requestId: "transport_367_mesh_training_mailbox",
      action: "submit_request",
      outputDir,
    });
    const summary = await verifyUpdateRecordAndTransportSandboxReadiness(
      outputDir,
    );

    expect(manualStop.action).toBe("manual_stop_required");
    expect(manualStop.nextState).toBe("drafted");
    expect(submitted.action).toBe("submitted");
    expect(
      summary.transportChecks.find(
        (entry) => entry.requestId === "transport_367_mesh_training_mailbox",
      )?.decisionClasses,
    ).toContain("request_state:submitted");
    expect(
      summary.transportChecks.find(
        (entry) =>
          entry.requestId === "transport_367_nhsmail_deployment_safetynet",
      )?.decisionClasses,
    ).toContain("purpose:urgent_return_safety_net");
    expect(
      summary.updateRecordChecks.find(
        (entry) => entry.requestId === "update_record_367_integration_pairing",
      )?.decisionClasses,
    ).toContain("urgent_return_forbidden");
    expect(
      fs.existsSync(
        path.join(outputDir, "367_sandbox_readiness_summary.json"),
      ),
    ).toBe(true);
  });
});
