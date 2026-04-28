import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ACCESSIBILITY_HARNESS_TASK_ID,
  accessibilityHarnessCatalog,
  accessibilityHarnessPublication,
  assistiveAnnouncementExampleArtifact,
  arbitrateAssistiveAnnouncements,
  evaluateVisualizationParity,
  focusTransitionContractRows,
  keyboardInteractionContractRows,
  resolveFocusTransition,
  verifyKeyboardInteraction,
} from "../src/accessibility-harness.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function readCsv(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("accessibility harness", () => {
  it("matches the committed par_111 artifact extensions and matrices", () => {
    const accessibility = readJson<typeof accessibilityHarnessPublication>(
      "data/analysis/accessibility_semantic_coverage_profiles.json",
    );
    const announcements = readJson<typeof assistiveAnnouncementExampleArtifact>(
      "data/analysis/assistive_announcement_examples.json",
    );
    const focusCsv = readCsv("data/analysis/focus_transition_contract_matrix.csv");
    const keyboardCsv = readCsv("data/analysis/keyboard_interaction_contract_matrix.csv");

    expect(accessibility.summary).toEqual({
      accessibility_profile_count: 19,
      complete_count: 15,
      degraded_count: 4,
      blocked_count: 0,
    });
    expect(accessibility.harness_task_id).toBe("par_111");
    expect(accessibility.harness_visual_mode).toBe("Accessibility_Control_Deck");
    expect(accessibility.harness_summary).toEqual(
      accessibilityHarnessPublication.harness_summary,
    );
    expect(accessibility.focusTransitionContracts).toEqual(focusTransitionContractRows);
    expect(accessibility.keyboardInteractionContracts).toEqual(
      keyboardInteractionContractRows,
    );
    expect(accessibility.harnessScenarios).toEqual(
      accessibilityHarnessPublication.harnessScenarios,
    );
    expect(announcements.summary).toEqual(assistiveAnnouncementExampleArtifact.summary);
    expect(announcements.assistiveAnnouncementExamples).toEqual(
      assistiveAnnouncementExampleArtifact.assistiveAnnouncementExamples,
    );
    expect(focusCsv.trim().split("\n")).toHaveLength(
      focusTransitionContractRows.length + 1,
    );
    expect(keyboardCsv.trim().split("\n")).toHaveLength(
      keyboardInteractionContractRows.length + 1,
    );
  });

  it("keeps same-shell refresh stable and moves focus only on contracted invalidation or recovery", () => {
    const preserved = resolveFocusTransition({
      trigger: "buffered_update",
      focusTransitionScope: "detail_child_return",
      currentTargetRef: "focus.current.patient_requests",
      previousTargetRef: "focus.selected_anchor.patient_requests",
      selectedAnchorTargetRef: "focus.selected_anchor.patient_requests",
      summaryTargetRef: "focus.summary.patient_requests",
      recoveryStubTargetRef: "focus.stub.patient_requests",
    });
    expect(preserved.disposition).toBe("preserve");
    expect(preserved.nextTargetRef).toBe("focus.current.patient_requests");

    const invalidated = resolveFocusTransition({
      trigger: "invalidation",
      focusTransitionScope: "same_shell_recovery",
      currentTargetRef: "focus.current.governance_shell",
      previousTargetRef: "focus.selected_anchor.governance_shell",
      selectedAnchorTargetRef: "focus.selected_anchor.governance_shell",
      summaryTargetRef: "focus.summary.governance_shell",
      recoveryStubTargetRef: "focus.stub.governance_shell",
    });
    expect(invalidated.disposition).toBe("move_recovery_stub");
    expect(invalidated.nextTargetRef).toBe("focus.stub.governance_shell");

    const recovered = resolveFocusTransition({
      trigger: "recovery_return",
      focusTransitionScope: "surface_root",
      currentTargetRef: "focus.stub.governance_shell",
      previousTargetRef: "focus.selected_anchor.governance_shell",
      selectedAnchorTargetRef: "focus.selected_anchor.governance_shell",
      summaryTargetRef: "focus.summary.governance_shell",
      recoveryStubTargetRef: "focus.stub.governance_shell",
    });
    expect(recovered.disposition).toBe("restore_previous");
    expect(recovered.nextTargetRef).toBe("focus.selected_anchor.governance_shell");
  });

  it("deduplicates announcements on causal tuple and suppresses chrome restore narration", () => {
    const processed = arbitrateAssistiveAnnouncements([
      {
        announcementId: "chrome",
        scenarioId: "scenario",
        routeFamilyRef: "rf_staff_workspace",
        trigger: "restore",
        scopeRef: "restore",
        causalTuple: "restore::chrome",
        authority: "chrome_restore",
        intent: "restore",
        politeness: "polite",
        text: "Restored.",
        sequence: 1,
      },
      {
        announcementId: "pending",
        scenarioId: "scenario",
        routeFamilyRef: "rf_patient_messages",
        trigger: "buffered_update",
        scopeRef: "thread",
        causalTuple: "thread::pending",
        authority: "pending",
        intent: "pending",
        politeness: "polite",
        text: "Pending.",
        sequence: 2,
      },
      {
        announcementId: "pending-dup",
        scenarioId: "scenario",
        routeFamilyRef: "rf_patient_messages",
        trigger: "buffered_update",
        scopeRef: "thread",
        causalTuple: "thread::pending",
        authority: "pending",
        intent: "pending",
        politeness: "polite",
        text: "Pending.",
        sequence: 3,
      },
      {
        announcementId: "settled",
        scenarioId: "scenario",
        routeFamilyRef: "rf_patient_messages",
        trigger: "restore",
        scopeRef: "thread",
        causalTuple: "thread::settled",
        authority: "authoritative_settlement",
        intent: "settled",
        politeness: "polite",
        text: "Settled.",
        sequence: 4,
      },
    ]);

    expect(processed.map((row) => row.status)).toEqual([
      "suppressed",
      "superseded",
      "deduplicated",
      "current",
    ]);
  });

  it("downgrades visualization parity without losing summary truth", () => {
    expect(
      evaluateVisualizationParity({
        visualMeaningState: "verified",
        tableAvailable: true,
        summaryAvailable: true,
        fallbackReason: "verified",
      }),
    ).toEqual({
      parityState: "visual_table_summary",
      explanation: "verified",
      authorityTarget: "visual",
    });

    expect(
      evaluateVisualizationParity({
        visualMeaningState: "stale",
        tableAvailable: true,
        summaryAvailable: true,
        fallbackReason: "table first",
      }),
    ).toEqual({
      parityState: "table_only",
      explanation: "table first",
      authorityTarget: "table",
    });

    expect(
      evaluateVisualizationParity({
        visualMeaningState: "blocked",
        tableAvailable: false,
        summaryAvailable: true,
        fallbackReason: "summary only",
      }),
    ).toEqual({
      parityState: "summary_only",
      explanation: "summary only",
      authorityTarget: "summary",
    });
  });

  it("verifies key sequences against the published keyboard model", () => {
    const gridContract = keyboardInteractionContractRows.find(
      (row) => row.routeFamilyRef === "rf_operations_board",
    );
    expect(gridContract).toBeDefined();
    const valid = verifyKeyboardInteraction(gridContract!, [
      "ArrowRight",
      "ArrowDown",
      "Enter",
    ]);
    expect(valid.valid).toBe(true);

    const invalid = verifyKeyboardInteraction(gridContract!, ["Tab", "A"]);
    expect(invalid.valid).toBe(false);
    expect(invalid.invalidKeys).toEqual(["A"]);
    expect(invalid.missingTraversalKey).toBe(true);
    expect(invalid.missingActivationKey).toBe(true);
  });

  it("publishes the expected route and contract counts", () => {
    expect(ACCESSIBILITY_HARNESS_TASK_ID).toBe("par_111");
    expect(accessibilityHarnessCatalog.routeProfileCount).toBe(19);
    expect(accessibilityHarnessCatalog.scenarioCount).toBe(6);
    expect(accessibilityHarnessCatalog.focusTransitionContractCount).toBe(133);
    expect(accessibilityHarnessCatalog.keyboardInteractionContractCount).toBe(19);
    expect(accessibilityHarnessCatalog.exactKeyboardContractCount).toBe(12);
    expect(accessibilityHarnessCatalog.provisionalKeyboardContractCount).toBe(6);
    expect(accessibilityHarnessCatalog.blockedKeyboardContractCount).toBe(1);
    expect(accessibilityHarnessCatalog.announcementExampleCount).toBe(14);
  });
});
