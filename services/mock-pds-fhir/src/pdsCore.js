import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "pds_access_pack.json"), "utf8"),
);

const ACCESS_PROFILE_INDEX = new Map(
  PACK.mock_service.access_profiles.map((row) => [row.access_mode, row]),
);
const PATIENT_INDEX = new Map(PACK.mock_service.patients.map((row) => [row.patient_id, row]));
const SCENARIO_INDEX = new Map(PACK.mock_service.scenarios.map((row) => [row.scenario_id, row]));
const AUDIT_LOG = [];

function now() {
  return new Date().toISOString();
}

function mask(value) {
  if (!value) {
    return "";
  }
  if (value.length <= 4) {
    return "*".repeat(value.length);
  }
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function appendAudit(entry) {
  AUDIT_LOG.unshift({
    auditId: `audit-${Date.now()}-${AUDIT_LOG.length + 1}`,
    timestamp: now(),
    ...entry,
  });
  if (AUDIT_LOG.length > 30) {
    AUDIT_LOG.length = 30;
  }
}

function operationOutcome(status, code, diagnostics) {
  return {
    status,
    headers: {},
    body: {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: status >= 500 ? "error" : "warning",
          code,
          diagnostics,
        },
      ],
    },
  };
}

function mockScenarioOutcome(scenarioId, diagnostics, mockStatus) {
  return {
    status: 200,
    headers: {
      "X-Mock-Trace-Class": scenarioId,
      "X-Mock-Upstream-Status": String(mockStatus),
    },
    body: {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: mockStatus >= 500 ? "error" : "warning",
          code: scenarioId,
          diagnostics,
        },
      ],
      extension: [
        {
          url: "https://vecells.example/mock-pds/StructureDefinition/result-class",
          valueCode: scenarioId,
        },
        {
          url: "https://vecells.example/mock-pds/StructureDefinition/mock-upstream-status",
          valueInteger: mockStatus,
        },
      ],
    },
  };
}

function findPatientsForScenario(scenarioId, query) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  const allPatients = PACK.mock_service.patients;

  if (scenarioId === "ambiguous") {
    return allPatients.filter((row) => row.match_key === "meridian-alex-1985");
  }
  if (scenarioId === "low_confidence") {
    return [PATIENT_INDEX.get("pds_pt_sable_003")];
  }
  if (scenarioId === "stale_demographics") {
    return [PATIENT_INDEX.get("pds_pt_quarry_004")];
  }
  if (scenarioId === "contradictory_detail") {
    return [PATIENT_INDEX.get("pds_pt_ember_005")];
  }
  if (scenarioId === "partial_field_policy") {
    return [PATIENT_INDEX.get("pds_pt_meridian_001")];
  }
  if (scenarioId === "matched") {
    if (normalizedQuery && normalizedQuery.includes("harbour")) {
      return [PATIENT_INDEX.get("pds_pt_harbour_006")];
    }
    return [PATIENT_INDEX.get("pds_pt_meridian_001")];
  }
  if (scenarioId === "no_match") {
    return [];
  }

  return allPatients.filter((row) => {
    const haystack = [
      row.patient_id,
      row.match_key,
      row.display_name,
      row.identifier_value,
      row.nominated_pharmacy,
      row.registered_gp,
    ]
      .join(" ")
      .toLowerCase();
    return !normalizedQuery || haystack.includes(normalizedQuery);
  });
}

function buildPatientResource(patient, scenarioId, accessMode, readView = "full") {
  const partial = scenarioId === "partial_field_policy" || readView === "minimum";
  const resource = {
    resourceType: "Patient",
    id: patient.patient_id,
    meta: {
      profile: ["https://vecells.example/mock-pds/StructureDefinition/MockPatient"],
      tag: [
        { system: "https://vecells.example/mock-pds/access-mode", code: accessMode },
        { system: "https://vecells.example/mock-pds/scenario", code: scenarioId },
      ],
      lastUpdated: now(),
    },
    identifier: [
      {
        system: "https://vecells.example/mock-pds/identifier",
        value: patient.identifier_value,
      },
    ],
    name: [
      {
        use: "official",
        text: patient.display_name,
        family: patient.display_name.split(" ").slice(-1)[0],
        given: patient.display_name.split(" ").slice(0, -1),
      },
    ],
    birthDate: patient.birth_date,
    gender: patient.gender,
    generalPractitioner: [
      {
        display: patient.registered_gp,
        identifier: {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: patient.registered_gp_ods,
        },
      },
    ],
    extension: [
      {
        url: "https://vecells.example/mock-pds/StructureDefinition/nominated-pharmacy",
        valueReference: {
          display: patient.nominated_pharmacy,
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: patient.nominated_pharmacy_ods,
          },
        },
      },
      {
        url: "https://vecells.example/mock-pds/StructureDefinition/staleness-state",
        valueCode: patient.staleness_state,
      },
    ],
  };

  if (!partial) {
    resource.address = [
      {
        use: "home",
        line: [patient.address_line],
        city: patient.city,
        postalCode: patient.postcode,
      },
    ];
    resource.telecom = [
      {
        system: "phone",
        value: patient.telecom,
        use: "mobile",
      },
    ];
  }

  if (scenarioId === "low_confidence") {
    resource.extension.push({
      url: "https://vecells.example/mock-pds/StructureDefinition/match-confidence",
      valueDecimal: 0.62,
    });
  }

  if (scenarioId === "contradictory_detail") {
    resource.extension.push({
      url: "https://vecells.example/mock-pds/StructureDefinition/contradiction-note",
      valueString: patient.contradiction_note,
    });
  }

  if (partial) {
    resource.extension.push({
      url: "https://vecells.example/mock-pds/StructureDefinition/partial-field-policy",
      valueString: "minimum_necessary_projection_only",
    });
  }

  return resource;
}

function buildBundle(patients, scenarioId, accessMode, query) {
  const scenario = SCENARIO_INDEX.get(scenarioId);
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: patients.length,
    meta: {
      tag: [
        { system: "https://vecells.example/mock-pds/access-mode", code: accessMode },
        { system: "https://vecells.example/mock-pds/scenario", code: scenarioId },
      ],
      lastUpdated: now(),
    },
    entry: patients.map((patient, index) => ({
      fullUrl: `https://vecells.example/mock-pds/Patient/${patient.patient_id}`,
      search: {
        mode: "match",
        score:
          scenarioId === "matched"
            ? 0.99
            : scenarioId === "ambiguous"
              ? index === 0
                ? 0.76
                : 0.73
              : scenarioId === "low_confidence"
                ? 0.62
                : 0.88,
      },
      resource: buildPatientResource(patient, scenarioId, accessMode, "minimum"),
    })),
    link: [
      {
        relation: "self",
        url: `Patient?scenario=${encodeURIComponent(scenarioId)}&accessMode=${encodeURIComponent(accessMode)}&query=${encodeURIComponent(query ?? "")}`,
      },
    ],
    extension: [
      {
        url: "https://vecells.example/mock-pds/StructureDefinition/result-class",
        valueCode: scenario.result_class,
      },
    ],
  };
}

function ensureAccessMode(accessMode) {
  if (!ACCESS_PROFILE_INDEX.has(accessMode)) {
    return operationOutcome(400, "invalid", `Unsupported access mode: ${accessMode}`);
  }
  if (accessMode === "other_if_officially_supported") {
    return operationOutcome(
      400,
      "not-supported",
      "The placeholder access mode exists for future official labels only and is not executable in the sandbox.",
    );
  }
  return null;
}

export function metadata() {
  return {
    taskId: PACK.task_id,
    visualMode: PACK.visual_mode,
    accessProfiles: PACK.mock_service.access_profiles,
    scenarios: PACK.mock_service.scenarios,
    patients: PACK.mock_service.patients.map((patient) => ({
      patientId: patient.patient_id,
      displayName: patient.display_name,
      matchKey: patient.match_key,
      scenarioTags: patient.scenario_tags,
      identifierMask: mask(patient.identifier_value),
    })),
    rules: [
      "PDS lookup is optional and feature-flagged.",
      "PDS success never writes Request.patientRef directly.",
      "Contradictory or stale data must raise review rather than calm reassurance.",
    ],
  };
}

export function search(params) {
  const accessMode = params.accessMode ?? "application_restricted";
  const scenarioId = params.scenario ?? "matched";
  const query = params.query ?? "";
  const accessError = ensureAccessMode(accessMode);
  if (accessError) {
    return accessError;
  }
  if (!SCENARIO_INDEX.has(scenarioId)) {
    return operationOutcome(400, "invalid", `Unsupported scenario: ${scenarioId}`);
  }
  if (scenarioId === "throttled") {
    return mockScenarioOutcome("throttled", "Retry budget exceeded in the mock PDS sandbox.", 429);
  }
  if (scenarioId === "degraded") {
    return mockScenarioOutcome(
      "degraded",
      "Mock upstream PDS is degraded; continue safely without enrichment.",
      503,
    );
  }

  const patients = findPatientsForScenario(scenarioId, query);
  appendAudit({
    eventType: "search",
    accessMode,
    scenarioId,
    queryMask: mask(String(query)),
    resultCount: patients.length,
  });

  return {
    status: 200,
    headers: { "X-Mock-Trace-Class": SCENARIO_INDEX.get(scenarioId).result_class },
    body: buildBundle(patients, scenarioId, accessMode, query),
  };
}

export function read(patientId, params) {
  const accessMode = params.accessMode ?? "application_restricted";
  const scenarioId = params.scenario ?? "matched";
  const view = params.view ?? "full";
  const accessError = ensureAccessMode(accessMode);
  if (accessError) {
    return accessError;
  }
  if (!SCENARIO_INDEX.has(scenarioId)) {
    return operationOutcome(400, "invalid", `Unsupported scenario: ${scenarioId}`);
  }
  if (scenarioId === "throttled") {
    return mockScenarioOutcome("throttled", "Retry budget exceeded in the mock PDS sandbox.", 429);
  }
  if (scenarioId === "degraded") {
    return mockScenarioOutcome(
      "degraded",
      "Mock upstream PDS is degraded; continue safely without enrichment.",
      503,
    );
  }

  const patient = PATIENT_INDEX.get(patientId);
  if (!patient) {
    return operationOutcome(404, "not-found", `No mock patient exists for ${patientId}`);
  }

  appendAudit({
    eventType: "read",
    accessMode,
    scenarioId,
    patientMask: mask(patient.identifier_value),
    patientId,
  });

  return {
    status: 200,
    headers: { "X-Mock-Trace-Class": SCENARIO_INDEX.get(scenarioId).result_class },
    body: buildPatientResource(patient, scenarioId, accessMode, view),
  };
}

export function auditLog() {
  return {
    taskId: PACK.task_id,
    count: AUDIT_LOG.length,
    events: AUDIT_LOG,
  };
}

export function health() {
  return {
    taskId: PACK.task_id,
    status: "ok",
    patientCount: PACK.mock_service.patients.length,
    scenarioCount: PACK.mock_service.scenarios.length,
  };
}
