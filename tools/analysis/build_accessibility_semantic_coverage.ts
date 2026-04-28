import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACCESSIBILITY_HARNESS_PUBLICATION_PATH,
  ASSISTIVE_ANNOUNCEMENT_EXAMPLES_PATH,
  FOCUS_TRANSITION_CONTRACT_MATRIX_PATH,
  KEYBOARD_INTERACTION_CONTRACT_MATRIX_PATH,
  accessibilityHarnessPublication,
  assistiveAnnouncementExampleArtifact,
  focusTransitionContractRows,
  keyboardInteractionContractRows,
} from "../../packages/design-system/src/accessibility-harness";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

function writeText(relativePath: string, value: string): void {
  const outputPath = path.join(ROOT, relativePath);
  fs.writeFileSync(outputPath, value, "utf8");
}

function writeJson(relativePath: string, value: unknown): void {
  writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function buildCsv(
  rows: readonly Record<string, string>[],
  headers: readonly string[],
): string {
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header] ?? "")).join(","),
    ),
  ]
    .join("\n")
    .concat("\n");
}

writeJson(ACCESSIBILITY_HARNESS_PUBLICATION_PATH, accessibilityHarnessPublication);
writeJson(ASSISTIVE_ANNOUNCEMENT_EXAMPLES_PATH, assistiveAnnouncementExampleArtifact);
writeText(
  FOCUS_TRANSITION_CONTRACT_MATRIX_PATH,
  buildCsv(
    focusTransitionContractRows.map((row) => ({
      contract_id: row.contractId,
      route_family_ref: row.routeFamilyRef,
      keyboard_model: row.keyboardModel,
      focus_transition_scope: row.focusTransitionScope,
      trigger: row.trigger,
      current_target_ref: row.currentTargetRef,
      previous_target_ref: row.previousTargetRef,
      next_target_ref: row.nextTargetRef,
      disposition: row.disposition,
      contract_state: row.contractState,
      motion_equivalence_ref: row.motionEquivalenceRef,
      zoom_reflow_ref: row.zoomReflowRef,
      dom_marker_ref: row.domMarkerRef,
      coverage_state: row.coverageState,
      design_contract_publication_bundle_ref: row.designContractPublicationBundleRef,
      rationale: row.rationale,
      source_refs: row.source_refs.join("; "),
    })),
    [
      "contract_id",
      "route_family_ref",
      "keyboard_model",
      "focus_transition_scope",
      "trigger",
      "current_target_ref",
      "previous_target_ref",
      "next_target_ref",
      "disposition",
      "contract_state",
      "motion_equivalence_ref",
      "zoom_reflow_ref",
      "dom_marker_ref",
      "coverage_state",
      "design_contract_publication_bundle_ref",
      "rationale",
      "source_refs",
    ],
  ),
);
writeText(
  KEYBOARD_INTERACTION_CONTRACT_MATRIX_PATH,
  buildCsv(
    keyboardInteractionContractRows.map((row) => ({
      contract_id: row.contractId,
      route_family_ref: row.routeFamilyRef,
      keyboard_model: row.keyboardModel,
      focus_transition_scope: row.focusTransitionScope,
      traversal_keys: row.traversalKeyRefs.join(" | "),
      activation_keys: row.activationKeyRefs.join(" | "),
      dismissal_keys: row.dismissalKeyRefs.join(" | "),
      optional_keys: row.optionalKeyRefs.join(" | "),
      landmarks: row.landmarkRefs.join(" | "),
      verification_narrative: row.verificationNarrative,
      contract_state: row.contractState,
      gap_resolution_ref: row.gapResolutionRef ?? "",
      coverage_state: row.coverageState,
      design_contract_publication_bundle_ref: row.designContractPublicationBundleRef,
      source_refs: row.source_refs.join("; "),
    })),
    [
      "contract_id",
      "route_family_ref",
      "keyboard_model",
      "focus_transition_scope",
      "traversal_keys",
      "activation_keys",
      "dismissal_keys",
      "optional_keys",
      "landmarks",
      "verification_narrative",
      "contract_state",
      "gap_resolution_ref",
      "coverage_state",
      "design_contract_publication_bundle_ref",
      "source_refs",
    ],
  ),
);
