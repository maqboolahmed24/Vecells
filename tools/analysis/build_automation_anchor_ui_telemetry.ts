import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUTOMATION_ANCHOR_MATRIX_PATH,
  AUTOMATION_ANCHOR_PROFILE_EXAMPLES_PATH,
  UI_EVENT_ENVELOPE_EXAMPLES_PATH,
  UI_TELEMETRY_VOCABULARY_PATH,
  automationAnchorMatrixRows,
  automationAnchorProfileExamplesArtifact,
  uiEventEnvelopeExamplesArtifact,
  uiTelemetryVocabularyArtifact,
} from "../../packages/persistent-shell/src/automation-telemetry";

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
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ]
    .join("\n")
    .concat("\n");
}

writeJson(AUTOMATION_ANCHOR_PROFILE_EXAMPLES_PATH, automationAnchorProfileExamplesArtifact);
writeJson(UI_TELEMETRY_VOCABULARY_PATH, uiTelemetryVocabularyArtifact);
writeJson(UI_EVENT_ENVELOPE_EXAMPLES_PATH, uiEventEnvelopeExamplesArtifact);
writeText(
  AUTOMATION_ANCHOR_MATRIX_PATH,
  buildCsv(
    automationAnchorMatrixRows.map((row) => ({
      route_family_ref: row.routeFamilyRef,
      shell_slug: row.shellSlug,
      audience_surface: row.audienceSurface,
      marker_class: row.markerClass,
      marker_ref: row.markerRef,
      dom_marker: row.domMarker,
      selector: row.selector,
      selector_attribute: row.selectorAttribute,
      selector_value: row.selectorValue,
      disclosure_fence_state: row.disclosureFenceState,
      repeated_instance_strategy: row.repeatedInstanceStrategy,
      supporting_dom_markers: row.supportingDomMarkers.join(" | "),
      supporting_event_classes: row.supportingEventClasses.join(" | "),
      contract_state: row.contractState,
      gap_resolution_ref: row.gapResolutionRef ?? "",
      source_refs: row.source_refs.join("; "),
    })),
    [
      "route_family_ref",
      "shell_slug",
      "audience_surface",
      "marker_class",
      "marker_ref",
      "dom_marker",
      "selector",
      "selector_attribute",
      "selector_value",
      "disclosure_fence_state",
      "repeated_instance_strategy",
      "supporting_dom_markers",
      "supporting_event_classes",
      "contract_state",
      "gap_resolution_ref",
      "source_refs",
    ],
  ),
);
