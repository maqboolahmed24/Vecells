import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { createSimulatorBackplaneRuntime } from "../src/index";

const suite = JSON.parse(
  fs.readFileSync(
    new URL("../../../data/test/exception_path_suite_results.json", import.meta.url),
    "utf8",
  ),
);
const adapterValidation = JSON.parse(
  fs.readFileSync(
    new URL("../../../data/integration/adapter_validation_results.json", import.meta.url),
    "utf8",
  ),
);

function findCase(caseId: string) {
  const row = suite.exceptionCases.find((entry: { caseId: string }) => entry.caseId === caseId);
  if (!row) {
    throw new Error(`Missing seq_135 case ${caseId}.`);
  }
  return row;
}

describe("seq_135 adapter replay and fallback suite", () => {
  it("matches exact replay runtime behavior with zero duplicate deltas in the suite", () => {
    const runtime = createSimulatorBackplaneRuntime();
    const begin = runtime.beginAuthFlow({
      scenarioId: "happy_path",
      routeBindingId: "rb_patient_intake_upgrade",
      clientId: "mc_patient_portal",
      userId: "usr_basic_p0",
      returnIntent: "patient.intake.upgrade",
    });
    runtime.deliverAuthCallback(begin.payload.authSessionRef);

    const first = runtime.redeemAuthCode({
      authSessionRef: begin.payload.authSessionRef,
      idempotencyKey: "seq135-exact-replay",
    });
    const second = runtime.redeemAuthCode({
      authSessionRef: begin.payload.authSessionRef,
      idempotencyKey: "seq135-exact-replay",
    });
    const exactCase = findCase("CASE_135_EXACT_SUBMIT_REPLAY");

    expect(first.exactReplay).toBe(false);
    expect(second.exactReplay).toBe(true);
    expect(second.payload).toEqual(first.payload);
    expect(exactCase.caseFamily).toBe("exact_submit_replay");
    expect(exactCase.duplicateRequestDelta).toBe(0);
    expect(exactCase.duplicateSideEffectDelta).toBe(0);
    expect(exactCase.duplicateClosureSideEffectDelta).toBe(0);
  });

  it("keeps callback-safe replay rows and scanner-runtime gaps explicit instead of quietly green", () => {
    const callbackCases = suite.exceptionCases.filter(
      (entry: { caseFamily: string }) => entry.caseFamily === "adapter_callback_replay_safe",
    );
    const unsupportedScanner = findCase("CASE_135_UNSUPPORTED_SCANNER_RUNTIME_GAP");
    const validationRow = adapterValidation.rows.find(
      (entry: { adapterId: string }) => entry.adapterId === "adp_malware_artifact_scanning",
    );

    expect(callbackCases).toHaveLength(2);
    callbackCases.forEach(
      (entry: {
        duplicateRequestDelta: number;
        duplicateSideEffectDelta: number;
        duplicateClosureSideEffectDelta: number;
      }) => {
        expect(entry.duplicateRequestDelta).toBe(0);
        expect(entry.duplicateSideEffectDelta).toBe(0);
        expect(entry.duplicateClosureSideEffectDelta).toBe(0);
      },
    );

    expect(validationRow).toMatchObject({
      currentValidationState: "blocked",
      runtimeCoverage: "missing_runtime",
      unsupportedCapabilityVisible: true,
      degradedTruthVisible: true,
    });
    expect(unsupportedScanner.caseFamily).toBe("fallback_review_stays_explicit");
    expect(unsupportedScanner.closureBlocked).toBe(true);
    expect(unsupportedScanner.gapRefs).toContain(
      "GAP_MISSING_SIMULATOR_RUNTIME_ADP_MALWARE_ARTIFACT_SCANNING_V1",
    );
  });
});
