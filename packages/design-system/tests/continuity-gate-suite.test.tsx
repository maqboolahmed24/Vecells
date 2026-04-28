import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  SharedStatusStrip,
  composeStatusSentence,
  statusTruthSpecimens,
  validateStatusTruthInput,
} from "../src/index.tsx";

const suite = JSON.parse(
  fs.readFileSync(
    new URL("../../../data/test/continuity_gate_suite_results.json", import.meta.url),
    "utf8",
  ),
);

function buildStatusInput(caseId: string) {
  const freshnessCase = suite.projectionFreshnessCases.find(
    (row: { case_id: string }) => row.case_id === caseId,
  );
  const base = statusTruthSpecimens[0].statusInput;

  return {
    ...base,
    dominantActionLabel: freshnessCase.next_safe_action_label,
    freshnessEnvelope: {
      ...base.freshnessEnvelope,
      projectionFreshnessState: freshnessCase.projection_freshness_state,
      transportState: freshnessCase.transport_state,
      actionabilityState: freshnessCase.actionability_state,
      scope: freshnessCase.scope,
    },
  };
}

describe("seq_134 continuity gate suite data", () => {
  it("covers the required case families and keeps browser specimen gaps explicit", () => {
    const caseFamilies = new Set(
      suite.continuityScenarios.map((row: { caseFamily: string }) => row.caseFamily),
    );

    expect([...caseFamilies]).toEqual(
      expect.arrayContaining([
        "stale_governing_object_version",
        "stale_identity_binding_or_subject_version",
        "stale_release_publication_runtime_binding",
        "channel_or_embedded_capability_drift",
        "transport_live_but_freshness_not_authoritative",
        "reachability_or_contact_repair_suppresses_mutation",
        "acting_scope_or_break_glass_drift",
        "same_shell_recovery_preserves_selected_anchor",
      ]),
    );

    expect(
      suite.continuityScenarios.find(
        (row: { routeFamilyRef: string; gapRef: string; browserSpecimenState: string }) =>
          row.routeFamilyRef === "rf_support_ticket_workspace",
      ),
    ).toMatchObject({
      browserSpecimenState: "gap",
      gapRef: "GAP_BROWSER_SPECIMEN_RF_SUPPORT_TICKET_WORKSPACE",
    });
    expect(
      suite.continuityScenarios.find(
        (row: { routeFamilyRef: string; gapRef: string; browserSpecimenState: string }) =>
          row.routeFamilyRef === "rf_intake_telephony_capture",
      ),
    ).toMatchObject({
      browserSpecimenState: "gap",
      gapRef: "GAP_BROWSER_SPECIMEN_RF_INTAKE_TELEPHONY_CAPTURE",
    });
  });

  it("keeps a current tuple distinct from current writable authority", () => {
    const routeTuple = suite.routeIntentCases.find(
      (row: { case_id: string }) => row.case_id === "CG_134_PATIENT_MESSAGE_CURRENT",
    );
    const continuity = suite.continuityScenarios.find(
      (row: { caseId: string }) => row.caseId === "CG_134_PATIENT_MESSAGE_CURRENT",
    );

    expect(routeTuple.expected_decision).toBe("allow");
    expect(continuity.mutationDecision).toBe("blocked");
    expect(continuity.effectiveShellPosture).toBe("read_only");
  });
});

describe("seq_134 projection freshness semantics", () => {
  it("proves transport-live cases remain non-live until authoritative truth converges", () => {
    const liveButGuardedCases = suite.projectionFreshnessCases.filter(
      (row: { transport_state: string; expected_shell_posture: string }) =>
        row.transport_state === "live" && row.expected_shell_posture !== "live",
    );

    expect(liveButGuardedCases.length).toBeGreaterThanOrEqual(2);
    expect(
      liveButGuardedCases.map((row: { case_id: string }) => row.case_id),
    ).toEqual(
      expect.arrayContaining([
        "CG_134_PATIENT_REQUESTS_PENDING_BINDING",
        "CG_134_STAFF_LIVE_TRANSPORT_STALE_TRUTH",
      ]),
    );
  });

  it("renders guarded live transport without claiming fresh truth", () => {
    const input = buildStatusInput("CG_134_PATIENT_REQUESTS_PENDING_BINDING");
    const html = renderToStaticMarkup(<SharedStatusStrip input={input} />);

    expect(validateStatusTruthInput(input)).toEqual([]);
    expect(html).toContain('data-freshness-state="updating"');
    expect(html).toContain('data-transport-state="live"');
    expect(html).toContain('data-actionability-state="guarded"');
    expect(html).not.toContain("Fresh truth");
  });

  it("keeps stale review language explicit when actionability is frozen", () => {
    const sentence = composeStatusSentence(buildStatusInput("CG_134_STAFF_LIVE_TRANSPORT_STALE_TRUTH"));

    expect(sentence.stateSummary.toLowerCase()).toContain("needs review");
    expect(sentence.stateSummary.toLowerCase()).toContain("before you act");
    expect(sentence.ribbonLabel).toContain("Review");
  });
});
