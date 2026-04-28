#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from privacy_threat_model import (  # noqa: E402
    BACKLOG_ITEMS,
    BACKLOG_PATH,
    CONTROL_CATALOG,
    DOC_BACKLOG_PATH,
    DOC_FLOW_PATH,
    DOC_RULES_PATH,
    DOC_THREAT_MODEL_PATH,
    DOC_TRACEABILITY_PATH,
    DOC_TRACKS_PATH,
    DOC_TRIGGERS_PATH,
    FLOW_INVENTORY_PATH,
    GAP_RESOLUTIONS,
    HTML_ATLAS_PATH,
    MOCK_TRACK,
    PREREQUISITE_GAPS,
    PROCESSING_ACTIVITIES,
    REVIEW_TRIGGER_CATALOG,
    RISK_STATES,
    ROLE_CATALOG,
    ROLE_MATRIX_PATH,
    SOURCE_PRECEDENCE,
    TASK_ID,
    THREATS,
    THREAT_REGISTER_PATH,
    TRACEABILITY_PATH,
    TRACKS,
    VISUAL_MODE,
)
from root_script_updates import ROOT_SCRIPT_UPDATES  # noqa: E402


PACKAGE_JSON_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = ROOT / "tests" / "playwright" / "package.json"
PLAYWRIGHT_SPEC_PATH = ROOT / "tests" / "playwright" / "privacy-threat-atlas.spec.js"

DOCS = [
    DOC_THREAT_MODEL_PATH,
    DOC_BACKLOG_PATH,
    DOC_FLOW_PATH,
    DOC_TRACEABILITY_PATH,
    DOC_RULES_PATH,
    DOC_TRIGGERS_PATH,
    DOC_TRACKS_PATH,
]
DELIVERABLES = [
    *DOCS,
    HTML_ATLAS_PATH,
    THREAT_REGISTER_PATH,
    FLOW_INVENTORY_PATH,
    BACKLOG_PATH,
    TRACEABILITY_PATH,
    ROLE_MATRIX_PATH,
    Path(__file__).resolve(),
    ROOT / "tools" / "assurance" / "privacy_threat_model.py",
    PLAYWRIGHT_SPEC_PATH,
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing par_126 deliverable: {path}")
    return path.read_text(encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(read_text(path))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def split_pipe(value: str | None) -> list[str]:
    if not value:
        return []
    return [part for part in value.split("|") if part]


def load_spec_manifest() -> dict[str, Any]:
    command = [
        "node",
        "--input-type=module",
        "-e",
        (
            "import { pathToFileURL } from 'node:url';"
            f"const modulePath = pathToFileURL('{PLAYWRIGHT_SPEC_PATH.as_posix()}').href;"
            "const mod = await import(modulePath);"
            "console.log(JSON.stringify({"
            "coverage: mod.privacyThreatAtlasCoverage,"
            "manifest: mod.privacyThreatAtlasManifest"
            "}));"
        ),
    ]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def validate_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    require(not missing, "Missing par_126 deliverables:\n" + "\n".join(missing))


def validate_docs() -> None:
    for path in DOCS:
        lowered = read_text(path).lower()
        require("mock_now_execution" in lowered, f"{path.name} is missing Mock_now_execution")
        require(
            "actual_production_strategy_later" in lowered,
            f"{path.name} is missing Actual_production_strategy_later",
        )

    threat_doc = read_text(DOC_THREAT_MODEL_PATH)
    require("VisibilityProjectionPolicy" in threat_doc, "Threat model doc is missing VisibilityProjectionPolicy")
    require("ScopedMutationGate" in read_text(DOC_TRACEABILITY_PATH), "Traceability doc is missing ScopedMutationGate")
    require("UITelemetryDisclosureFence" in read_text(DOC_RULES_PATH), "Rules doc is missing UITelemetryDisclosureFence")
    require(
        "PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING" in read_text(DOC_TRACKS_PATH),
        "Track strategy doc lost the par_125 prerequisite gap",
    )


def validate_package_scripts() -> None:
    package_json = read_json(PACKAGE_JSON_PATH)
    expected_validator = "python3 ./tools/assurance/validate_privacy_threat_model.py"
    expected_builder = "python3 ./tools/assurance/privacy_threat_model.py"

    require(
        package_json["scripts"].get("validate:privacy-threat-model") == expected_validator,
        "package.json is missing validate:privacy-threat-model",
    )
    require(
        ROOT_SCRIPT_UPDATES.get("validate:privacy-threat-model") == expected_validator,
        "root_script_updates.py is missing validate:privacy-threat-model",
    )
    for script_name in ["bootstrap", "check"]:
        require(
            "pnpm validate:privacy-threat-model" in package_json["scripts"].get(script_name, ""),
            f"package.json script {script_name} is missing pnpm validate:privacy-threat-model",
        )
        require(
            "pnpm validate:privacy-threat-model" in ROOT_SCRIPT_UPDATES.get(script_name, ""),
            f"root_script_updates.py script {script_name} is missing pnpm validate:privacy-threat-model",
        )
    require(
        expected_builder in package_json["scripts"].get("codegen", ""),
        "package.json codegen is missing the privacy threat builder",
    )
    require(
        expected_builder in ROOT_SCRIPT_UPDATES.get("codegen", ""),
        "root_script_updates.py codegen is missing the privacy threat builder",
    )

    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        require(
            "privacy-threat-atlas.spec.js" in playwright_package["scripts"].get(script_name, ""),
            f"tests/playwright/package.json lost privacy-threat-atlas.spec.js from {script_name}",
        )


def validate_flow_inventory(payload: dict[str, Any]) -> None:
    require(payload["task_id"] == TASK_ID, "Flow inventory task_id drifted")
    require(payload["visual_mode"] == VISUAL_MODE, "Flow inventory visual mode drifted")
    require(payload["source_precedence"] == SOURCE_PRECEDENCE, "Flow inventory source precedence drifted")
    require(
        payload["summary"]["processing_activity_count"] == len(PROCESSING_ACTIVITIES),
        "Flow inventory processing_activity_count drifted",
    )
    flows = payload["processing_activities"]
    require(len(flows) == len(PROCESSING_ACTIVITIES), "Flow inventory row count drifted")
    flow_ids = {row["flowId"] for row in flows}
    require(len(flow_ids) == len(PROCESSING_ACTIVITIES), "Duplicate flow ids detected")

    joined_families = {row["activityFamily"] for row in flows}
    expected_families = {
        "public_intake_and_draft_capture",
        "authenticated_patient_portal_and_secure_links",
        "internal_staff_workspace_and_support_replay",
        "message_callback_notification_and_contact_route_repairs",
        "local_booking_network_coordination_and_pharmacy_loops",
        "audit_observability_and_privacy_safe_telemetry",
        "frozen_bundles_evidence_quarantine_and_fallback_review",
        "embedded_or_constrained_browser_paths",
        "assistive_shadow_mode_and_visible_assistance",
    }
    require(expected_families <= joined_families, "Flow inventory lost one of the required activity families")

    valid_threat_ids = {row["threatId"] for row in THREATS}
    valid_control_ids = {row["controlId"] for row in CONTROL_CATALOG}
    for flow in flows:
        require(flow["mockOrActualState"] in TRACKS, f"Flow {flow['flowId']} has invalid track")
        require(flow["sourceBlueprintRefs"], f"Flow {flow['flowId']} has no source refs")
        require(
            set(flow["threatRefs"]) <= valid_threat_ids,
            f"Flow {flow['flowId']} references unknown threats",
        )
        require(
            set(flow["controlRefs"]) <= valid_control_ids,
            f"Flow {flow['flowId']} references unknown controls",
        )


def validate_traceability(payload: dict[str, Any]) -> None:
    require(payload["task_id"] == TASK_ID, "Traceability task_id drifted")
    require(payload["visual_mode"] == VISUAL_MODE, "Traceability visual mode drifted")
    require(payload["source_precedence"] == SOURCE_PRECEDENCE, "Traceability source precedence drifted")
    require(
        payload["summary"]["control_family_count"] == len(CONTROL_CATALOG),
        "Traceability control family count drifted",
    )
    require(
        payload["summary"]["review_trigger_count"] == len(REVIEW_TRIGGER_CATALOG),
        "Traceability review trigger count drifted",
    )

    control_ids = {row["controlId"] for row in payload["controlFamilyCatalog"]}
    require(control_ids == {row["controlId"] for row in CONTROL_CATALOG}, "Control catalog drifted")
    for control in payload["controlFamilyCatalog"]:
        lowered = f"{control['controlTitle']} {control['summary']}".lower()
        require("ui collapse" not in lowered, f"{control['controlId']} relies on UI collapse")
        require("local cache" not in lowered, f"{control['controlId']} relies on local cache")
        require("decorative shell behavior" not in lowered, f"{control['controlId']} relies on decorative shell behavior")

    gap_ids = {row["gapId"] for row in payload["prerequisite_gaps"]}
    require(
        "PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING" in gap_ids,
        "Traceability lost the par_125 prerequisite gap",
    )
    require(
        {row["gapResolutionId"] for row in payload["gap_resolutions"]}
        == {row["gapResolutionId"] for row in GAP_RESOLUTIONS},
        "Gap resolutions drifted",
    )

    valid_threat_ids = {row["threatId"] for row in THREATS}
    valid_backlog_ids = {row["backlogId"] for row in BACKLOG_ITEMS}
    valid_trigger_ids = {row["reviewTriggerId"] for row in REVIEW_TRIGGER_CATALOG}
    for row in payload["threatControlMappings"]:
        require(row["threatId"] in valid_threat_ids, "Traceability row references unknown threat")
        require(row["linkedBacklogId"] in valid_backlog_ids, "Traceability row references unknown backlog")
        all_control_refs = row["controlLayers"]["platformRuntimePublication"] + row["controlLayers"]["uiRuntimePublication"] + row["controlLayers"]["operationalGovernanceReview"]
        require(all_control_refs, f"{row['threatId']} has no control family links")
        require(set(all_control_refs) <= control_ids, f"{row['threatId']} references unknown control ids")
        require(set(row["reviewTriggerRefs"]) <= valid_trigger_ids, f"{row['threatId']} references unknown trigger ids")
        anti_patterns = " ".join(row["antiPatternReminder"]).lower()
        for token in ["ui collapse", "local cache", "decorative shell behavior"]:
            require(token in anti_patterns, f"{row['threatId']} lost anti-pattern reminder: {token}")


def validate_threat_register(rows: list[dict[str, str]]) -> None:
    require(len(rows) == len(THREATS), "Threat register row count drifted")
    valid_backlog_ids = {row["backlogId"] for row in BACKLOG_ITEMS}
    valid_control_ids = {row["controlId"] for row in CONTROL_CATALOG}
    valid_role_ids = {row["roleId"] for row in ROLE_CATALOG}
    valid_trigger_ids = {row["reviewTriggerId"] for row in REVIEW_TRIGGER_CATALOG}

    families = {row["threatFamily"] for row in rows}
    require(
        families
        == {
            "intake_over_collection_and_attachment_exposure",
            "identity_and_session_leakage",
            "stale_or_widened_visibility_projection",
            "audience_overreach_and_acting_scope_failure",
            "telemetry_event_and_debug_disclosure",
            "communications_and_contact_route_privacy_drift",
            "cross_org_and_external_adapter_disclosure",
            "frozen_bundle_legal_hold_and_break_glass_excess_access",
            "embedded_and_constrained_browser_privacy_drift",
            "assistive_and_model_backed_privacy_risk",
        },
        "Threat family coverage drifted",
    )

    for row in rows:
        for field_name in [
            "threatId",
            "processingDomain",
            "processingActivity",
            "dataSubjectClass",
            "dataClass",
            "entrySurface",
            "channelProfile",
            "audienceTier",
            "actorScope",
            "purposeOfUse",
            "storageOrTransitBoundary",
            "riskScenario",
            "sourceBlueprintRefs",
            "requiredControls",
            "linkedDpiaBacklogItemRef",
            "mockOrActualState",
            "residualRiskState",
            "ownerRole",
            "reviewTriggerRefs",
            "notes",
        ]:
            require(row[field_name], f"Threat row {row.get('threatId', '<unknown>')} is missing {field_name}")
        require(split_pipe(row["sourceBlueprintRefs"]), f"{row['threatId']} has no source refs")
        controls = split_pipe(row["requiredControls"])
        require(controls, f"{row['threatId']} has no linked control family")
        require(set(controls) <= valid_control_ids, f"{row['threatId']} references unknown controls")
        require(row["linkedDpiaBacklogItemRef"] in valid_backlog_ids, f"{row['threatId']} references unknown backlog")
        require(row["mockOrActualState"] in TRACKS, f"{row['threatId']} has invalid track")
        require(row["residualRiskState"] in RISK_STATES, f"{row['threatId']} has invalid residual risk state")
        require(row["ownerRole"] in valid_role_ids, f"{row['threatId']} references unknown owner role")
        require(
            set(split_pipe(row["reviewTriggerRefs"])) <= valid_trigger_ids,
            f"{row['threatId']} references unknown review triggers",
        )

    telemetry_row = next(row for row in rows if row["threatId"] == "PRIV-126-005")
    telemetry_controls = set(split_pipe(telemetry_row["requiredControls"]))
    require(
        "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1" in telemetry_controls,
        "Telemetry threat lost UITelemetryDisclosureFence reference",
    )
    require(
        "CTRL_126_CANONICAL_EVENT_MASKING_V1" in telemetry_controls,
        "Telemetry threat lost canonical event masking reference",
    )
    assistive_row = next(row for row in rows if row["threatId"] == "PRIV-126-010")
    require(
        "RTR_126_ASSISTIVE_OR_MODEL_DELTA" in split_pipe(assistive_row["reviewTriggerRefs"]),
        "Assistive threat lost explicit DPIA rerun trigger",
    )


def validate_backlog(rows: list[dict[str, str]]) -> None:
    require(len(rows) == len(BACKLOG_ITEMS), "Backlog row count drifted")
    valid_flow_ids = {row["flowId"] for row in PROCESSING_ACTIVITIES}
    valid_threat_ids = {row["threatId"] for row in THREATS}
    for row in rows:
        require(split_pipe(row["triggeringProcessingActivities"]), f"{row['backlogId']} has no triggering processing activities")
        require(split_pipe(row["threatRefs"]), f"{row['backlogId']} has no linked threat refs")
        require(
            set(split_pipe(row["triggeringProcessingActivities"])) <= valid_flow_ids,
            f"{row['backlogId']} references unknown processing activities",
        )
        require(
            set(split_pipe(row["threatRefs"])) <= valid_threat_ids,
            f"{row['backlogId']} references unknown threats",
        )
        if row["mockOrActualState"] == MOCK_TRACK:
            require(
                "production" not in row["currentEvidenceState"].lower(),
                f"{row['backlogId']} misrepresents mock evidence as production-ready",
            )


def validate_role_matrix(rows: list[dict[str, str]]) -> None:
    role_ids = {row["roleId"] for row in rows}
    expected_roles = {
        "ROLE_PRODUCT_OWNER",
        "ROLE_ENGINEERING_LEAD",
        "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "ROLE_CLINICAL_SAFETY_LEAD",
        "ROLE_SECURITY_LEAD",
        "ROLE_GOVERNANCE_RELEASE_APPROVER",
        "ROLE_SERVICE_OWNER_OPERATIONS_REVIEWER",
    }
    require(expected_roles <= role_ids, "Role and review matrix lost one of the required roles")
    for row in rows:
        require(row["reviewEventId"], f"{row['roleId']} is missing reviewEventId")
        require(row["responsibility"], f"{row['roleId']} is missing responsibility")
        require(row["decisionType"], f"{row['roleId']} is missing decisionType")


def validate_html() -> None:
    html = read_text(HTML_ATLAS_PATH)
    for token in [
        "Privacy_Threat_Atlas",
        "data-testid=\"privacy-threat-atlas-root\"",
        "data-testid=\"filter-rail\"",
        "data-testid=\"data-flow-diagram\"",
        "data-testid=\"threat-density-matrix\"",
        "data-testid=\"control-trace-braid\"",
        "data-testid=\"backlog-table\"",
    ]:
        require(token in html, f"Atlas HTML is missing token: {token}")
    require("tel:+" not in html, "Atlas HTML contains a phone number token")
    require("Bearer " not in html, "Atlas HTML contains a credential token")
    require("password=" not in html, "Atlas HTML contains a credential token")


def validate_spec_manifest() -> None:
    manifest_bundle = load_spec_manifest()
    require(len(manifest_bundle["coverage"]) >= 6, "Playwright coverage list drifted")
    manifest = manifest_bundle["manifest"]
    require(manifest["task"] == TASK_ID, "Spec manifest task drifted")
    require(manifest["visualMode"] == VISUAL_MODE, "Spec manifest visual mode drifted")
    require(manifest["flowCount"] == len(PROCESSING_ACTIVITIES), "Spec manifest flow count drifted")
    require(manifest["threatCount"] == len(THREATS), "Spec manifest threat count drifted")
    require(manifest["controlCount"] == len(CONTROL_CATALOG), "Spec manifest control count drifted")
    require(manifest["backlogCount"] == len(BACKLOG_ITEMS), "Spec manifest backlog count drifted")
    require(
        manifest["prerequisiteGapId"] == "PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING",
        "Spec manifest lost the par_125 prerequisite gap",
    )


def main() -> None:
    validate_deliverables()
    validate_docs()
    validate_package_scripts()
    validate_flow_inventory(read_json(FLOW_INVENTORY_PATH))
    validate_traceability(read_json(TRACEABILITY_PATH))
    validate_threat_register(read_csv(THREAT_REGISTER_PATH))
    validate_backlog(read_csv(BACKLOG_PATH))
    validate_role_matrix(read_csv(ROLE_MATRIX_PATH))
    validate_html()
    validate_spec_manifest()


if __name__ == "__main__":
    main()
