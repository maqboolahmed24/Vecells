import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

const requiredFiles = [
  "data/readiness/478_external_dependency_readiness_matrix.json",
  "data/readiness/478_essential_function_dependency_map.json",
  "data/readiness/478_manual_fallback_runbook_bundle.json",
  "data/readiness/478_dependency_contact_and_escalation_ledger.json",
  "data/readiness/478_dependency_degradation_profiles.json",
  "data/readiness/478_fallback_rehearsal_evidence.json",
  "data/contracts/478_dependency_readiness.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_478_FALLBACK_ACTIVATION_SETTLEMENT.json",
  "data/analysis/478_algorithm_alignment_notes.md",
  "data/analysis/478_external_reference_notes.json",
  "docs/runbooks/478_external_dependency_and_manual_fallback_runbook.md",
  "docs/architecture/478_dependency_constellation.mmd",
] as const;

const forbiddenRawSensitivePattern =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

type JsonObject = Record<string, unknown>;

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize((value as JsonObject)[key])}`)
    .join(",")}}`;
}

function hashValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function assertFileExists(relativePath: string): void {
  assert(fs.existsSync(path.join(ROOT, relativePath)), `${relativePath} must exist`);
}

function assertNoSensitiveSerialized(value: unknown, label: string): void {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  assert(!forbiddenRawSensitivePattern.test(serialized), `${label} contains raw sensitive marker`);
}

function assertHashRecord(value: unknown, pathLabel = "record"): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertHashRecord(entry, `${pathLabel}[${index}]`));
    return;
  }
  const record = value as JsonObject;
  if (typeof record.recordHash === "string") {
    const { recordHash, ...withoutHash } = record;
    assert.equal(
      recordHash,
      hashValue(withoutHash),
      `${pathLabel} recordHash must be deterministic`,
    );
  }
  for (const [key, nested] of Object.entries(record)) {
    if (key !== "recordHash") assertHashRecord(nested, `${pathLabel}.${key}`);
  }
}

function asArray(value: unknown, label: string): JsonObject[] {
  assert(Array.isArray(value), `${label} must be an array`);
  return value as JsonObject[];
}

export function validate478DependencyReadinessArtifacts(): void {
  requiredFiles.forEach(assertFileExists);

  const matrix = readJson<JsonObject>(
    "data/readiness/478_external_dependency_readiness_matrix.json",
  );
  const essentialMap = readJson<JsonObject>(
    "data/readiness/478_essential_function_dependency_map.json",
  );
  const runbookBundle = readJson<JsonObject>(
    "data/readiness/478_manual_fallback_runbook_bundle.json",
  );
  const contactLedger = readJson<JsonObject>(
    "data/readiness/478_dependency_contact_and_escalation_ledger.json",
  );
  const profiles = readJson<JsonObject>("data/readiness/478_dependency_degradation_profiles.json");
  const rehearsalBundle = readJson<JsonObject>(
    "data/readiness/478_fallback_rehearsal_evidence.json",
  );
  const interfaceGap = readJson<JsonObject>(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_478_FALLBACK_ACTIVATION_SETTLEMENT.json",
  );
  const externalRefs = readJson<JsonObject>("data/analysis/478_external_reference_notes.json");

  for (const [label, value] of Object.entries({
    matrix,
    essentialMap,
    runbookBundle,
    contactLedger,
    profiles,
    rehearsalBundle,
    interfaceGap,
    externalRefs,
  })) {
    assertNoSensitiveSerialized(value, label);
    assertHashRecord(value, label);
  }
  assertNoSensitiveSerialized(
    fs.readFileSync(
      path.join(ROOT, "docs/runbooks/478_external_dependency_and_manual_fallback_runbook.md"),
      "utf8",
    ),
    "runbook markdown",
  );

  assert.equal(matrix.taskId, "seq_478");
  assert.equal(matrix.schemaVersion, "478.programme.dependency-readiness.v1");
  assert(
    matrix.overallReadinessState === "ready" ||
      matrix.overallReadinessState === "ready_with_constraints",
    "default matrix must be launchable or constrained launchable",
  );

  const verdicts = asArray(matrix.dependencyVerdicts, "dependencyVerdicts");
  assert(verdicts.length >= 10, "all dependency classes must be enumerated");
  const launchCriticalVerdicts = verdicts.filter((verdict) => verdict.launchCritical === true);
  assert(
    launchCriticalVerdicts.length >= 8,
    "core launch-critical dependencies must be represented",
  );

  const serviceLevelBindings = new Set(
    asArray((profiles as any).degradationProfiles, "profiles").map(
      (profile) => profile.dependencyRef,
    ),
  );
  const contacts = asArray(contactLedger.contacts, "contacts");
  const runbooks = asArray(runbookBundle.runbooks, "runbooks");
  const rehearsals = asArray(rehearsalBundle.rehearsals, "rehearsals");
  const fallbackModes = asArray(profiles.fallbackModes, "fallbackModes");

  for (const verdict of launchCriticalVerdicts) {
    assert.notEqual(
      verdict.readinessState,
      "blocked",
      `${verdict.dependencyRef} must not block default launch`,
    );
    assert(
      typeof verdict.serviceLevelBindingRef === "string",
      `${verdict.dependencyRef} needs SLO binding`,
    );
    assert(
      serviceLevelBindings.has(String(verdict.dependencyRef)),
      `${verdict.dependencyRef} needs a degradation profile`,
    );
    assert(
      asArray(verdict.fallbackModeRefs, `${verdict.dependencyRef}.fallbackModeRefs`).every(
        (modeRef) => fallbackModes.some((mode) => mode.fallbackModeId === modeRef),
      ),
      `${verdict.dependencyRef} needs fallback mode records`,
    );
    assert(
      asArray(verdict.runbookRefs, `${verdict.dependencyRef}.runbookRefs`).every((runbookRef) =>
        runbooks.some((runbook) => runbook.runbookId === runbookRef),
      ),
      `${verdict.dependencyRef} needs runbook records`,
    );
    assert(
      asArray(
        verdict.rehearsalEvidenceRefs,
        `${verdict.dependencyRef}.rehearsalEvidenceRefs`,
      ).every((rehearsalRef) =>
        rehearsals.some((rehearsal) => rehearsal.rehearsalEvidenceId === rehearsalRef),
      ),
      `${verdict.dependencyRef} needs rehearsal records`,
    );
    const verdictContacts = asArray(
      verdict.escalationContactRefs,
      `${verdict.dependencyRef}.escalationContactRefs`,
    ).map((contactRef) => contacts.find((contact) => contact.contactId === contactRef));
    assert(verdictContacts.every(Boolean), `${verdict.dependencyRef} must resolve contact refs`);
    assert(
      verdictContacts.some((contact) => contact?.outOfHoursCoverage === true),
      `${verdict.dependencyRef} must have an internal or supplier OOH route`,
    );
  }

  const nhsAppVerdict = verdicts.find(
    (verdict) => verdict.dependencyRef === "dep_478_nhs_app_channel",
  );
  assert(nhsAppVerdict, "NHS App channel dependency must exist");
  assert.equal(
    nhsAppVerdict?.launchCritical,
    false,
    "NHS App channel must not block Wave 1 core web",
  );
  assert.equal(
    nhsAppVerdict?.readinessState,
    "not_applicable",
    "NHS App channel is deferred for Wave 1",
  );

  const pharmacyVerdict = verdicts.find(
    (verdict) => verdict.dependencyRef === "dep_478_pharmacy_eps_provider_directory",
  );
  assert(pharmacyVerdict, "pharmacy provider dependency must exist");
  assert.equal(pharmacyVerdict?.launchCritical, false, "pharmacy provider must not block Wave 1");

  const commandRecords = asArray(
    runbookBundle.fallbackActivationCommands,
    "fallbackActivationCommands",
  );
  assert(
    commandRecords.length >= fallbackModes.length,
    "every fallback mode needs an activation command",
  );
  assert(
    commandRecords.every(
      (command) =>
        command.settlementState === "pending_backend_command_settlement" &&
        command.completionClaimPermitted === false,
    ),
    "fallback activation commands must not claim completion before settlement",
  );
  assert.equal(
    (interfaceGap as any).commandRequirements?.settlementRequiredBeforeCompletionClaim,
    true,
    "interface gap must require settlement before completion claim",
  );

  const requiredEdgeCases = [
    "edge_478_business_hours_ready_no_ooh",
    "edge_478_nhs_app_deferred_core_web_launch",
    "edge_478_pharmacy_manual_path_untested",
    "edge_478_monitoring_configured_no_owner_rota",
    "edge_478_backup_ready_no_restore_report_channel",
    "edge_478_supplier_contact_expired_unverified",
    "edge_478_manual_fallback_privacy_retention_violation",
  ];
  const edgeCaseIds = new Set(
    asArray(rehearsalBundle.edgeCaseProofs, "edgeCaseProofs").map((edge) => edge.edgeCaseId),
  );
  requiredEdgeCases.forEach((edgeCaseId) => {
    assert(edgeCaseIds.has(edgeCaseId), `${edgeCaseId} must be covered`);
  });

  assert(
    asArray(essentialMap.essentialFunctions, "essentialFunctions").every(
      (entry) =>
        asArray(entry.dependencyRefs, "essentialFunction.dependencyRefs").length > 0 &&
        asArray(entry.fallbackModeRefs, "essentialFunction.fallbackModeRefs").length > 0,
    ),
    "every essential function must map to dependencies and fallback modes",
  );

  assert(
    asArray(externalRefs.notes, "externalRefs.notes").some((note) =>
      String(note.url).includes("digital.nhs.uk/services/nhs-app"),
    ),
    "external references must include NHS App official guidance",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validate478DependencyReadinessArtifacts();
  console.log("478 dependency readiness artifacts validated.");
}
