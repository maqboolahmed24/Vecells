import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const PROFILES_PATH = path.join(ROOT, "data", "analysis", "automation_anchor_profile_examples.json");
const VOCABULARY_PATH = path.join(ROOT, "data", "analysis", "ui_telemetry_vocabulary.json");
const ENVELOPES_PATH = path.join(ROOT, "data", "analysis", "ui_event_envelope_examples.json");

export const automationTelemetryProfiles = JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8"));
export const automationTelemetryVocabulary = JSON.parse(
  fs.readFileSync(VOCABULARY_PATH, "utf8"),
);
export const automationTelemetryEnvelopes = JSON.parse(
  fs.readFileSync(ENVELOPES_PATH, "utf8"),
);

export function getScenario(scenarioId) {
  return automationTelemetryProfiles.diagnosticScenarios.find(
    (scenario) => scenario.scenarioId === scenarioId,
  );
}

export function getRouteProfile(routeFamilyRef) {
  return automationTelemetryProfiles.routeProfiles.find(
    (profile) => profile.routeFamilyRef === routeFamilyRef,
  );
}

export function resolveSharedMarkerSelector(routeFamilyRef, markerClass) {
  if (markerClass === "landmark") {
    return `[data-automation-surface='${routeFamilyRef}']`;
  }
  return `[data-automation-surface='${routeFamilyRef}'] [data-automation-anchor-class='${markerClass}']`;
}

export async function assertSharedMarker(page, routeFamilyRef, markerClass) {
  const selector = resolveSharedMarkerSelector(routeFamilyRef, markerClass);
  await page.locator(selector).waitFor();
  return selector;
}

export function eventCodesForScenario(scenarioId) {
  return automationTelemetryEnvelopes.eventEnvelopes
    .filter((envelope) => envelope.scenarioId === scenarioId)
    .map((envelope) => envelope.eventCode);
}

export function findEnvelope(scenarioId, eventClass) {
  return automationTelemetryEnvelopes.eventEnvelopes.find(
    (envelope) =>
      envelope.scenarioId === scenarioId && envelope.eventClass === eventClass,
  );
}
