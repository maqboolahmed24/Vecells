#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DOCS_ARCHITECTURE_DIR = ROOT / "docs" / "architecture"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"
DOCS_API_DIR = ROOT / "docs" / "api"
TOOLS_ANALYSIS_DIR = ROOT / "tools" / "analysis"
TESTS_PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

DRAFT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_draft_view.schema.json"
SURFACE_BINDING_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_surface_runtime_binding.schema.json"
SUBMIT_SETTLEMENT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_submit_settlement.schema.json"
OUTCOME_ARTIFACT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_outcome_presentation_artifact.schema.json"
EVENT_CATALOG_PATH = DATA_CONTRACTS_DIR / "139_intake_event_catalog.json"
JOURNEY_MATRIX_PATH = DATA_ANALYSIS_DIR / "139_journey_step_matrix.csv"
JOURNEY_CONTRACT_DOC_PATH = DOCS_ARCHITECTURE_DIR / "139_web_intake_journey_contract.md"
EXPERIENCE_SPEC_DOC_PATH = DOCS_FRONTEND_DIR / "139_patient_intake_experience_spec.md"
API_CONTRACT_DOC_PATH = DOCS_API_DIR / "139_phase1_public_intake_api_contracts.md"
SCHEMA_LOCK_DOC_PATH = DOCS_API_DIR / "139_phase1_submission_schema_lock.md"
EVENT_CATALOG_DOC_PATH = DOCS_ARCHITECTURE_DIR / "139_intake_event_catalog.md"
ATLAS_HTML_PATH = DOCS_FRONTEND_DIR / "139_intake_journey_atlas.html"
PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_ANALYSIS_DIR / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_JSON_PATH = TESTS_PLAYWRIGHT_DIR / "package.json"
PLAYWRIGHT_SPEC_PATH = TESTS_PLAYWRIGHT_DIR / "139_intake_journey_atlas.spec.js"

REQUIRED_STEP_KEYS = {
    "landing",
    "request_type",
    "details",
    "supporting_files",
    "contact_preferences",
    "review_submit",
    "resume_recovery",
    "urgent_outcome",
    "receipt_outcome",
    "request_status",
}
REQUIRED_EVENT_NAMES = {
    "request.submitted",
    "intake.draft.created",
    "intake.draft.updated",
    "intake.attachment.added",
    "intake.normalized",
    "safety.screened",
    "safety.urgent_diversion.required",
    "safety.urgent_diversion.completed",
    "triage.task.created",
    "patient.receipt.issued",
    "communication.queued",
}
RESERVED_EVENT_NAMES = {"intake.attachment.quarantined"}
REQUIRED_DRAFT_FIELDS = {
    "draftPublicId",
    "ingressChannel",
    "surfaceChannelProfile",
    "intakeConvergenceContractRef",
    "identityContext",
    "requestType",
    "structuredAnswers",
    "freeTextNarrative",
    "attachmentRefs",
    "contactPreferences",
    "channelCapabilityCeiling",
    "draftVersion",
    "lastSavedAt",
    "resumeToken",
    "uiJourneyState",
    "draftSchemaVersion",
}
REQUIRED_BINDING_FIELDS = {
    "intakeSurfaceRuntimeBindingId",
    "routeFamilyRef",
    "audienceSurfaceRuntimeBindingRef",
    "surfaceRouteContractRef",
    "surfacePublicationRef",
    "runtimePublicationBundleRef",
    "releasePublicationParityRef",
    "patientShellConsistencyProjectionRef",
    "patientEmbeddedSessionProjectionRef",
    "routeFreezeDispositionRef",
    "releaseRecoveryDispositionRef",
    "bindingState",
    "validatedAt",
}
REQUIRED_ATLAS_MARKERS = [
    'data-testid="patient-intake-mission-frame"',
    'data-testid="journey-header"',
    'data-testid="emergency-strip"',
    'data-testid="step-rail"',
    'data-testid="detail-panel"',
    'data-testid="quiet-status-strip"',
    'data-testid="recap-column"',
    'data-testid="peek-drawer-button"',
    'data-testid="sticky-footer"',
    'data-testid="journey-spine"',
    'data-testid="journey-table"',
    'data-testid="schema-table"',
    'data-testid="binding-table"',
    'data-testid="event-table"',
]
FORBIDDEN_INTERNAL_ID_FIELDS = {
    "aggregateId",
    "requestId",
    "submissionEnvelopeId",
    "internalRequestId",
    "internalAggregateId",
}


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path) -> dict:
    return json.loads(path.read_text())


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def extract_json_script(html: str, script_id: str) -> object:
    match = re.search(
        rf'<script type="application/json" id="{re.escape(script_id)}">\s*(.*?)\s*</script>',
        html,
        flags=re.DOTALL,
    )
    ensure(match is not None, f"Atlas is missing script payload {script_id}.")
    return json.loads(match.group(1))


def expected_schema_summary(
    draft_schema: dict,
    surface_binding_schema: dict,
    submit_settlement_schema: dict,
    outcome_artifact_schema: dict,
) -> list[dict[str, object]]:
    return [
        {
            "schemaName": "IntakeDraftView",
            "artifactPath": "data/contracts/139_intake_draft_view.schema.json",
            "requiredFieldCount": len(draft_schema["required"]),
            "idPattern": "^dft_[a-z0-9]{10,32}$",
            "purpose": "Pre-submit draft lineage rendered through one IntakeConvergenceContract.",
        },
        {
            "schemaName": "IntakeSurfaceRuntimeBinding",
            "artifactPath": "data/contracts/139_intake_surface_runtime_binding.schema.json",
            "requiredFieldCount": len(surface_binding_schema["required"]),
            "idPattern": "ISRB_139_*",
            "purpose": "Adapter from patient routes into published runtime, parity, freeze, and recovery truth.",
        },
        {
            "schemaName": "IntakeSubmitSettlement",
            "artifactPath": "data/contracts/139_intake_submit_settlement.schema.json",
            "requiredFieldCount": len(submit_settlement_schema["required"]),
            "idPattern": "ISS_139_*",
            "purpose": "Authoritative submit outcome chain; local browser success never substitutes for this record.",
        },
        {
            "schemaName": "IntakeOutcomePresentationArtifact",
            "artifactPath": "data/contracts/139_intake_outcome_presentation_artifact.schema.json",
            "requiredFieldCount": len(outcome_artifact_schema["required"]),
            "idPattern": "IOPA_139_*",
            "purpose": "Summary-first urgent guidance, receipt, and status artifact contract.",
        },
    ]


def main() -> None:
    required_paths = [
        DRAFT_SCHEMA_PATH,
        SURFACE_BINDING_SCHEMA_PATH,
        SUBMIT_SETTLEMENT_SCHEMA_PATH,
        OUTCOME_ARTIFACT_SCHEMA_PATH,
        EVENT_CATALOG_PATH,
        JOURNEY_MATRIX_PATH,
        JOURNEY_CONTRACT_DOC_PATH,
        EXPERIENCE_SPEC_DOC_PATH,
        API_CONTRACT_DOC_PATH,
        SCHEMA_LOCK_DOC_PATH,
        EVENT_CATALOG_DOC_PATH,
        ATLAS_HTML_PATH,
        PACKAGE_JSON_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_PACKAGE_JSON_PATH,
        PLAYWRIGHT_SPEC_PATH,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing required seq_139 artifact: {path}")

    draft_schema = read_json(DRAFT_SCHEMA_PATH)
    surface_binding_schema = read_json(SURFACE_BINDING_SCHEMA_PATH)
    submit_settlement_schema = read_json(SUBMIT_SETTLEMENT_SCHEMA_PATH)
    outcome_artifact_schema = read_json(OUTCOME_ARTIFACT_SCHEMA_PATH)
    event_catalog = read_json(EVENT_CATALOG_PATH)
    journey_rows = read_csv_rows(JOURNEY_MATRIX_PATH)
    atlas_html = ATLAS_HTML_PATH.read_text()
    package_json = read_json(PACKAGE_JSON_PATH)
    playwright_package_json = read_json(PLAYWRIGHT_PACKAGE_JSON_PATH)
    root_script_updates_text = ROOT_SCRIPT_UPDATES_PATH.read_text()

    docs_text = "\n".join(
        path.read_text()
        for path in [
            JOURNEY_CONTRACT_DOC_PATH,
            EXPERIENCE_SPEC_DOC_PATH,
            API_CONTRACT_DOC_PATH,
            SCHEMA_LOCK_DOC_PATH,
            EVENT_CATALOG_DOC_PATH,
        ]
    )

    ensure(
        set(draft_schema["required"]) == REQUIRED_DRAFT_FIELDS,
        "IntakeDraftView required fields drifted from the frozen Phase 1 contract.",
    )
    ensure(
        draft_schema["properties"]["requestType"]["enum"] == ["Symptoms", "Meds", "Admin", "Results"],
        "Request type enum drifted from the canonical Phase 1 quartet.",
    )
    draft_property_names = set(draft_schema["properties"])
    ensure(
        FORBIDDEN_INTERNAL_ID_FIELDS.isdisjoint(draft_property_names),
        "IntakeDraftView leaked an internal identifier field into the public schema.",
    )
    ensure(
        draft_schema["properties"]["draftPublicId"]["pattern"] == "^dft_[a-z0-9]{10,32}$",
        "draftPublicId pattern drifted.",
    )

    ensure(
        set(surface_binding_schema["required"]) == REQUIRED_BINDING_FIELDS,
        "IntakeSurfaceRuntimeBinding required fields drifted.",
    )
    ensure(
        surface_binding_schema["properties"]["bindingState"]["enum"] == ["live", "recovery_only", "blocked"],
        "IntakeSurfaceRuntimeBinding.bindingState enum drifted.",
    )

    ensure(
        submit_settlement_schema["properties"]["result"]["enum"]
        == ["urgent_diversion", "triage_ready", "stale_recoverable", "denied_scope", "failed_safe"],
        "IntakeSubmitSettlement.result enum drifted.",
    )
    settlement_examples = submit_settlement_schema["examples"]
    ensure(len(settlement_examples) == 5, "Expected one IntakeSubmitSettlement example per result state.")
    ensure(
        {row["result"] for row in settlement_examples}
        == {"urgent_diversion", "triage_ready", "stale_recoverable", "denied_scope", "failed_safe"},
        "IntakeSubmitSettlement examples are incomplete.",
    )

    ensure(
        outcome_artifact_schema["properties"]["artifactState"]["enum"]
        == ["summary_only", "inline_renderable", "external_handoff_ready", "recovery_only"],
        "IntakeOutcomePresentationArtifact.artifactState enum drifted.",
    )

    event_names = {row["eventName"] for row in event_catalog["eventCatalog"]}
    ensure(REQUIRED_EVENT_NAMES.issubset(event_names), "Required Phase 1 event set is incomplete.")
    ensure(RESERVED_EVENT_NAMES.issubset(event_names), "Reserved attachment quarantine event is missing.")
    ensure(
        event_catalog["canonicalSubmitEvent"] == "request.submitted",
        "Canonical submit event drifted.",
    )
    ensure(
        any(
            row["eventName"] == "intake.submitted"
            for row in event_catalog["forbiddenSemanticDuplicates"]
        ),
        "Forbidden duplicate submit event is not declared.",
    )
    ensure(
        "intake.submitted" not in event_names,
        "The frozen event catalog illegally published intake.submitted as a canonical event.",
    )
    ensure(
        event_catalog["summary"]["active_event_count"] == 11
        and event_catalog["summary"]["reserved_follow_on_event_count"] == 1,
        "Event catalog summary counts drifted.",
    )

    ensure(len(journey_rows) == len(REQUIRED_STEP_KEYS), "Journey matrix row count drifted.")
    step_keys = {row["step_key"] for row in journey_rows}
    ensure(step_keys == REQUIRED_STEP_KEYS, "Journey matrix step coverage is incomplete or drifted.")
    expected_routes = {
        "landing": "/intake/start",
        "request_type": "/intake/drafts/:draftPublicId/request-type",
        "details": "/intake/drafts/:draftPublicId/details",
        "supporting_files": "/intake/drafts/:draftPublicId/supporting-files",
        "contact_preferences": "/intake/drafts/:draftPublicId/contact-preferences",
        "review_submit": "/intake/drafts/:draftPublicId/review",
        "resume_recovery": "/intake/drafts/:draftPublicId/recovery?resumeToken=:resumeToken",
        "urgent_outcome": "/intake/requests/:requestPublicId/urgent-guidance",
        "receipt_outcome": "/intake/requests/:requestPublicId/receipt",
        "request_status": "/intake/requests/:requestPublicId/status",
    }
    for row in journey_rows:
        ensure(
            row["route_pattern"] == expected_routes[row["step_key"]],
            f"Route pattern drifted for {row['step_key']}.",
        )
        ensure(row["same_shell_key"] == "patient.portal.requests", f"Same-shell continuity drifted for {row['step_key']}.")

    for required_phrase in [
        "Mock_now_execution",
        "Actual_production_strategy_later",
        "SubmissionEnvelope",
        "ArtifactPresentationContract",
        "OutboundNavigationGrant",
        "same-shell",
    ]:
        ensure(required_phrase in docs_text, f"Documentation lost required phrase: {required_phrase}")

    for marker in REQUIRED_ATLAS_MARKERS:
        ensure(marker in atlas_html, f"Atlas is missing required marker: {marker}")
    ensure("body data-layout=\"focus_frame\"" in atlas_html, "Atlas lost the mission-frame layout seed.")
    ensure("body.reduced-motion" in atlas_html, "Atlas lost reduced-motion posture handling.")

    atlas_steps = extract_json_script(atlas_html, "journey-steps-json")
    atlas_schema_summary = extract_json_script(atlas_html, "schema-summary-json")
    atlas_bindings = extract_json_script(atlas_html, "binding-examples-json")
    atlas_event_catalog = extract_json_script(atlas_html, "event-catalog-json")

    ensure(atlas_steps == journey_rows, "Atlas journey steps drifted from the machine-readable step matrix.")
    ensure(
        atlas_schema_summary
        == expected_schema_summary(
            draft_schema,
            surface_binding_schema,
            submit_settlement_schema,
            outcome_artifact_schema,
        ),
        "Atlas schema summary drifted from the frozen schema set.",
    )
    ensure(
        atlas_bindings == surface_binding_schema["examples"],
        "Atlas binding examples drifted from the IntakeSurfaceRuntimeBinding schema examples.",
    )
    ensure(
        atlas_event_catalog == event_catalog,
        "Atlas event catalog drifted from the machine-readable event catalog.",
    )

    scripts = package_json["scripts"]
    ensure(
        scripts.get("validate:phase1-intake-contracts")
        == "python3 ./tools/analysis/validate_phase1_intake_contracts.py",
        "Root validate:phase1-intake-contracts script is missing or drifted.",
    )
    ensure(
        "python3 ./tools/analysis/build_phase1_intake_contracts.py" in scripts["codegen"],
        "Root codegen script is missing the seq_139 builder.",
    )
    ensure(
        "pnpm validate:phase1-intake-contracts" in scripts["bootstrap"],
        "Root bootstrap script is missing seq_139 validation.",
    )
    ensure(
        "pnpm validate:phase1-intake-contracts" in scripts["check"],
        "Root check script is missing seq_139 validation.",
    )

    ensure(
        '"validate:phase1-intake-contracts": "python3 ./tools/analysis/validate_phase1_intake_contracts.py"'
        in root_script_updates_text,
        "root_script_updates.py is missing validate:phase1-intake-contracts.",
    )
    ensure(
        "python3 ./tools/analysis/build_phase1_intake_contracts.py" in root_script_updates_text,
        "root_script_updates.py is missing the seq_139 builder in codegen.",
    )
    ensure(
        "pnpm validate:phase1-intake-contracts" in root_script_updates_text,
        "root_script_updates.py is missing seq_139 validation in bootstrap/check.",
    )

    playwright_scripts = playwright_package_json["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        ensure(
            "139_intake_journey_atlas.spec.js" in playwright_scripts[script_name],
            f"Playwright package script {script_name} is missing the seq_139 spec.",
        )

    print("seq_139 Phase 1 intake contracts validation passed.")


if __name__ == "__main__":
    main()
