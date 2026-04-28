import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const REQUIRED_FILES = [
  path.join(
    ROOT,
    "docs",
    "architecture",
    "313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
  ),
  path.join(
    ROOT,
    "docs",
    "api",
    "313_phase5_commit_and_practice_visibility_api_contract.md",
  ),
  path.join(
    ROOT,
    "docs",
    "security",
    "313_phase5_truth_tuple_ack_generation_and_minimum_necessary_rules.md",
  ),
  path.join(
    ROOT,
    "docs",
    "frontend",
    "313_phase5_confirmation_and_practice_visibility_atlas.html",
  ),
  path.join(ROOT, "data", "contracts", "313_alternative_offer_session.schema.json"),
  path.join(ROOT, "data", "contracts", "313_alternative_offer_entry.schema.json"),
  path.join(ROOT, "data", "contracts", "313_alternative_offer_fallback_card.schema.json"),
  path.join(ROOT, "data", "contracts", "313_hub_commit_attempt.schema.json"),
  path.join(ROOT, "data", "contracts", "313_hub_booking_evidence_bundle.schema.json"),
  path.join(ROOT, "data", "contracts", "313_hub_appointment_record.schema.json"),
  path.join(
    ROOT,
    "data",
    "contracts",
    "313_hub_offer_to_confirmation_truth_projection.schema.json",
  ),
  path.join(ROOT, "data", "contracts", "313_practice_continuity_message.schema.json"),
  path.join(ROOT, "data", "contracts", "313_practice_acknowledgement_record.schema.json"),
  path.join(ROOT, "data", "contracts", "313_practice_visibility_projection.schema.json"),
  path.join(ROOT, "data", "contracts", "313_network_manage_capabilities.schema.json"),
  path.join(ROOT, "data", "contracts", "313_practice_visibility_delta_record.schema.json"),
  path.join(ROOT, "data", "contracts", "313_commit_and_visibility_event_catalog.json"),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_MESH_DISPATCH_AND_DELIVERY.json",
  ),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_REMINDERS_AND_MANAGE_REFRESH.json",
  ),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_RECONCILIATION_AND_SUPPLIER_MIRROR.json",
  ),
  path.join(ROOT, "data", "analysis", "313_external_reference_notes.json"),
  path.join(ROOT, "data", "analysis", "313_truth_tuple_and_ack_generation_matrix.csv"),
  path.join(ROOT, "data", "analysis", "313_commit_visibility_gap_log.json"),
  path.join(ROOT, "tools", "analysis", "build_313_phase5_commit_visibility_contracts.ts"),
  path.join(ROOT, "tools", "analysis", "validate_phase5_commit_and_visibility_contracts.ts"),
  path.join(ROOT, "tests", "playwright", "313_confirmation_and_practice_visibility_atlas.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:313-phase5-commit-and-visibility-contracts": "pnpm exec tsx ./tools/analysis/validate_phase5_commit_and_visibility_contracts.ts"';

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseJson(filePath: string) {
  return JSON.parse(read(filePath));
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  requireCondition(lines.length > 1, "CSV_MISSING_ROWS");

  const parseLine = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function validateChecklist() {
  const checklist = read(CHECKLIST_PATH);
  requireCondition(
    checklist.includes(
      "- [-] seq_313_phase5_freeze_cross_org_booking_commit_and_practice_visibility_contracts",
    ) ||
      checklist.includes(
        "- [X] seq_313_phase5_freeze_cross_org_booking_commit_and_practice_visibility_contracts",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:seq_313",
  );
}

function validatePackageScript() {
  const packageJson = read(PACKAGE_JSON_PATH);
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:313-phase5-commit-and-visibility-contracts",
  );
}

function validateSchemas() {
  const commitAttempt = parseJson(path.join(ROOT, "data", "contracts", "313_hub_commit_attempt.schema.json"));
  const evidence = parseJson(
    path.join(ROOT, "data", "contracts", "313_hub_booking_evidence_bundle.schema.json"),
  );
  const appointment = parseJson(
    path.join(ROOT, "data", "contracts", "313_hub_appointment_record.schema.json"),
  );
  const truthProjection = parseJson(
    path.join(ROOT, "data", "contracts", "313_hub_offer_to_confirmation_truth_projection.schema.json"),
  );
  const continuity = parseJson(
    path.join(ROOT, "data", "contracts", "313_practice_continuity_message.schema.json"),
  );
  const acknowledgement = parseJson(
    path.join(ROOT, "data", "contracts", "313_practice_acknowledgement_record.schema.json"),
  );
  const visibility = parseJson(
    path.join(ROOT, "data", "contracts", "313_practice_visibility_projection.schema.json"),
  );
  const manage = parseJson(
    path.join(ROOT, "data", "contracts", "313_network_manage_capabilities.schema.json"),
  );
  const delta = parseJson(
    path.join(ROOT, "data", "contracts", "313_practice_visibility_delta_record.schema.json"),
  );
  const fallback = parseJson(
    path.join(ROOT, "data", "contracts", "313_alternative_offer_fallback_card.schema.json"),
  );

  for (const field of [
    "commitAttemptId",
    "hubCoordinationCaseId",
    "reservationFenceToken",
    "providerAdapterBindingHash",
    "truthTupleHash",
    "attemptState",
  ]) {
    requireCondition(commitAttempt.required.includes(field), `COMMIT_ATTEMPT_REQUIRED_FIELD_MISSING:${field}`);
  }

  for (const field of [
    "evidenceBundleId",
    "hubCoordinationCaseId",
    "commitMode",
    "independentConfirmationState",
    "truthTupleHash",
  ]) {
    requireCondition(evidence.required.includes(field), `EVIDENCE_BUNDLE_REQUIRED_FIELD_MISSING:${field}`);
  }

  for (const field of [
    "hubAppointmentId",
    "hubCoordinationCaseId",
    "sourceBookingReference",
    "externalConfirmationState",
    "practiceAcknowledgementState",
    "truthTupleHash",
  ]) {
    requireCondition(appointment.required.includes(field), `APPOINTMENT_REQUIRED_FIELD_MISSING:${field}`);
  }

  for (const field of [
    "hubOfferToConfirmationTruthProjectionId",
    "hubCoordinationCaseId",
    "offerState",
    "confirmationTruthState",
    "practiceVisibilityState",
    "closureState",
    "truthTupleHash",
  ]) {
    requireCondition(
      truthProjection.required.includes(field),
      `TRUTH_PROJECTION_REQUIRED_FIELD_MISSING:${field}`,
    );
  }

  for (const field of [
    "transportState",
    "deliveryState",
    "deliveryRiskState",
    "acknowledgementEvidenceState",
    "ackGeneration",
    "truthTupleHash",
  ]) {
    requireCondition(continuity.required.includes(field), `CONTINUITY_REQUIRED_FIELD_MISSING:${field}`);
  }

  for (const field of [
    "acknowledgementId",
    "hubCoordinationCaseId",
    "ackGeneration",
    "ackState",
    "truthTupleHash",
    "causalToken",
  ]) {
    requireCondition(
      acknowledgement.required.includes(field),
      `ACKNOWLEDGEMENT_REQUIRED_FIELD_MISSING:${field}`,
    );
  }

  for (const field of [
    "visibilityEnvelopeVersionRef",
    "policyTupleHash",
    "ackGeneration",
    "practiceAcknowledgementState",
    "truthTupleHash",
    "visibleFieldRefs",
    "hiddenFieldRefs",
  ]) {
    requireCondition(visibility.required.includes(field), `VISIBILITY_REQUIRED_FIELD_MISSING:${field}`);
  }

  for (const field of [
    "capabilityState",
    "readOnlyMode",
    "policyTupleHash",
    "truthTupleHash",
    "appointmentVersionRef",
  ]) {
    requireCondition(manage.required.includes(field), `MANAGE_REQUIRED_FIELD_MISSING:${field}`);
  }

  requireCondition(
    delta.required.includes("priorAckGeneration") &&
      delta.required.includes("nextAckGeneration") &&
      delta.required.includes("monotoneValidation"),
    "DELTA_MONOTONE_FIELDS_MISSING",
  );

  requireCondition(
    fallback.properties.displayMode?.enum?.includes("separate_card"),
    "FALLBACK_CARD_NOT_SEPARATE",
  );
  requireCondition(
    Array.isArray(fallback.properties.rankOrdinal?.type) &&
      fallback.properties.rankOrdinal.type.includes("null"),
    "FALLBACK_CARD_RANK_ORDINAL_MUST_ALLOW_NULL_ONLY",
  );
}

function validateEventCatalog() {
  const catalog = parseJson(path.join(ROOT, "data", "contracts", "313_commit_and_visibility_event_catalog.json"));
  requireCondition(catalog.taskId === "seq_313", "EVENT_CATALOG_TASK_ID_DRIFT");

  const eventNames = catalog.events.map((event: { eventName: string }) => event.eventName);
  for (const name of [
    "hub.commit.authoritatively_confirmed",
    "hub.practice.transport_accepted",
    "hub.practice.acknowledged_current_generation",
    "hub.manage.capabilities_degraded",
    "hub.truth.projection_advanced",
  ]) {
    requireCondition(eventNames.includes(name), `EVENT_MISSING:${name}`);
  }

  requireCondition(
    catalog.vocabularies.commitModes.join("|") ===
      "native_api|manual_pending_confirmation|imported_confirmation",
    "COMMIT_MODE_VOCABULARY_DRIFT",
  );
}

function validateExternalReferences() {
  const notes = parseJson(path.join(ROOT, "data", "analysis", "313_external_reference_notes.json"));
  const ids = new Set(notes.sources.map((source: { sourceId: string }) => source.sourceId));
  for (const id of [
    "hl7_appointment_r4",
    "hl7_slot_r4",
    "nhs_mesh_service",
    "nhs_question_pages",
    "nhs_check_answers",
    "nhs_back_link",
    "nhs_confirmation_page",
    "playwright_best_practices",
    "linear_peek",
    "vercel_observability",
    "carbon_data_table",
  ]) {
    requireCondition(ids.has(id), `EXTERNAL_REFERENCE_MISSING:${id}`);
  }

  const linear = notes.sources.find((source: { sourceId: string }) => source.sourceId === "linear_peek");
  requireCondition(
    Array.isArray(linear.rejectedOrConstrained) && linear.rejectedOrConstrained.length > 0,
    "LINEAR_REFERENCE_SHOULD_BE_EXPLICITLY_CONSTRAINED",
  );
}

function validateTruthMatrix() {
  const rows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "313_truth_tuple_and_ack_generation_matrix.csv")),
  );
  requireCondition(rows.length >= 6, "TRUTH_MATRIX_TOO_SMALL");

  const byScenario = new Map(rows.map((row) => [row.scenarioId, row]));
  requireCondition(
    byScenario.get("transport_only_current_generation")?.clearsCurrentDebt === "no" &&
      byScenario.get("transport_only_current_generation")?.resultingPracticeVisibilityState === "transport_pending",
    "TRANSPORT_ONLY_ROW_DRIFT",
  );
  requireCondition(
    byScenario.get("current_generation_explicit_ack")?.clearsCurrentDebt === "yes" &&
      byScenario.get("current_generation_explicit_ack")?.resultingPracticeVisibilityState === "acknowledged",
    "CURRENT_GENERATION_ACK_ROW_DRIFT",
  );
  requireCondition(
    byScenario.get("superseded_generation_ack")?.clearsCurrentDebt === "no",
    "SUPERSEDED_GENERATION_ROW_DRIFT",
  );
  requireCondition(
    byScenario.get("stale_tuple_ack")?.clearsCurrentDebt === "no" &&
      byScenario.get("stale_tuple_ack")?.truthTupleStatus === "stale",
    "STALE_TUPLE_ROW_DRIFT",
  );
}

function validateGapLogAndSeams() {
  const gapLog = parseJson(path.join(ROOT, "data", "analysis", "313_commit_visibility_gap_log.json"));
  requireCondition(
    gapLog.discharges.some(
      (entry: { sourceGapFile: string; closedObjects: string[] }) =>
        entry.sourceGapFile.includes("PHASE5_INTERFACE_GAP_HUB_CORE_FALLBACK_AND_VISIBILITY") &&
        entry.closedObjects.includes("PracticeAcknowledgementRecord") &&
        entry.closedObjects.includes("PracticeVisibilityProjection"),
    ),
    "GAP_LOG_SHOULD_DISCHARGE_311_ACK_VISIBILITY_PORTION",
  );

  const seamFiles = [
    parseJson(
      path.join(
        ROOT,
        "data",
        "contracts",
        "PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_MESH_DISPATCH_AND_DELIVERY.json",
      ),
    ),
    parseJson(
      path.join(
        ROOT,
        "data",
        "contracts",
        "PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_REMINDERS_AND_MANAGE_REFRESH.json",
      ),
    ),
    parseJson(
      path.join(
        ROOT,
        "data",
        "contracts",
        "PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_RECONCILIATION_AND_SUPPLIER_MIRROR.json",
      ),
    ),
  ];

  const owners = seamFiles.map((seam) => seam.ownerTask).sort();
  requireCondition(
    owners.join("|") === "par_322|par_324|par_325",
    `SEAM_OWNER_DRIFT:${owners.join("|")}`,
  );
}

function validateAtlas() {
  const atlas = read(
    path.join(ROOT, "docs", "frontend", "313_phase5_confirmation_and_practice_visibility_atlas.html"),
  );

  for (const marker of [
    "data-testid=\"Phase5CommitVisibilityAtlas\"",
    "data-testid=\"TruthStateRail\"",
    "data-testid=\"PatientChoiceLane\"",
    "data-testid=\"CommitEvidenceLane\"",
    "data-testid=\"PatientConfirmationLane\"",
    "data-testid=\"PracticeVisibilityLane\"",
    "data-testid=\"MessageChainTable\"",
    "data-testid=\"AckGenerationLadder\"",
    "data-testid=\"TruthTupleParityTable\"",
    "data-testid=\"AckGenerationParityTable\"",
    "data-testid=\"BlockerParityTable\"",
    "data-testid=\"ManageCapabilityCard\"",
    "data-testid=\"MessageDetailCard\"",
  ]) {
    requireCondition(atlas.includes(marker), `ATLAS_MARKER_MISSING:${marker}`);
  }

  requireCondition(atlas.includes("max-width: 1740px;"), "ATLAS_WIDTH_DRIFT");
  requireCondition(atlas.includes("grid-template-columns: 300px minmax(0, 1fr) 420px;"), "ATLAS_LAYOUT_DRIFT");
  requireCondition(atlas.includes("--offer-accent: #3158E0;"), "ATLAS_OFFER_PALETTE_DRIFT");
  requireCondition(atlas.includes("--practice-accent: #5B61F6;"), "ATLAS_PRACTICE_PALETTE_DRIFT");
  requireCondition(
    atlas.includes("event.key !== \"ArrowDown\" && event.key !== \"ArrowUp\""),
    "ATLAS_KEYBOARD_TRAVERSAL_MISSING",
  );
}

function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateSchemas();
  validateEventCatalog();
  validateExternalReferences();
  validateTruthMatrix();
  validateGapLogAndSeams();
  validateAtlas();
  console.log("313 commit and visibility contracts validated.");
}

main();
