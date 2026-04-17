#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path("/Users/test/Code/V")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> object:
    return json.loads(read_text(path))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    contract_path = ROOT / "data/contracts/164_phase1_integrated_route_and_settlement_bundle.json"
    endpoint_matrix_path = ROOT / "data/analysis/164_phase1_endpoint_to_surface_binding_matrix.csv"
    transition_matrix_path = ROOT / "data/analysis/164_phase1_same_lineage_transition_matrix.csv"
    gap_log_path = ROOT / "data/analysis/164_phase1_integration_gap_log.json"
    architecture_doc_path = (
        ROOT / "docs/architecture/164_phase1_integrated_intake_backend_frontend_merge.md"
    )
    tests_doc_path = ROOT / "docs/tests/164_phase1_integrated_intake_e2e_matrix.md"
    operations_doc_path = (
        ROOT / "docs/operations/164_phase1_notification_and_receipt_integration.md"
    )
    storyboard_path = ROOT / "docs/frontend/164_phase1_integrated_flow_storyboard.html"
    gateway_source_path = ROOT / "services/api-gateway/src/phase1-integrated-intake.ts"
    runtime_source_path = ROOT / "services/api-gateway/src/runtime.ts"
    service_definition_path = ROOT / "services/api-gateway/src/service-definition.ts"
    gateway_test_path = (
        ROOT / "services/api-gateway/tests/phase1-integrated-intake.integration.test.js"
    )
    patient_client_path = ROOT / "apps/patient-web/src/phase1-integrated-intake-client.ts"
    patient_shell_path = ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx"
    playwright_spec_path = ROOT / "tests/playwright/164_phase1_integrated_intake.spec.js"
    root_package_path = ROOT / "package.json"
    playwright_package_path = ROOT / "tests/playwright/package.json"
    root_script_updates_path = ROOT / "tools/analysis/root_script_updates.py"

    for path in [
        contract_path,
        endpoint_matrix_path,
        transition_matrix_path,
        gap_log_path,
        architecture_doc_path,
        tests_doc_path,
        operations_doc_path,
        storyboard_path,
        gateway_source_path,
        runtime_source_path,
        service_definition_path,
        gateway_test_path,
        patient_client_path,
        patient_shell_path,
        playwright_spec_path,
        root_package_path,
        playwright_package_path,
        root_script_updates_path,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    contract = load_json(contract_path)
    require(contract["taskId"] == "seq_164", "PHASE1_INTEGRATED_TASK_ID_DRIFT")
    require(
        contract["contractId"] == "PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1",
        "PHASE1_INTEGRATED_CONTRACT_ID_DRIFT",
    )
    require(contract["routeFamilyRef"] == "rf_intake_self_service", "ROUTE_FAMILY_DRIFT")
    require(contract["shellContinuityKey"] == "patient.portal.requests", "CONTINUITY_KEY_DRIFT")
    require(
        contract["continuityLaw"]["requestPublicIdDerivation"]
        == "sha256_20_hex_from_request_ref",
        "REQUEST_PUBLIC_ID_DERIVATION_NOT_COLLISION_RESISTANT",
    )
    require(
        contract["notificationTruthLaw"]["transportAcceptedIsNotDeliveryEvidence"] is True,
        "TRANSPORT_ACCEPTANCE_DELIVERY_TRUTH_DRIFT",
    )
    require(
        contract["replayLaw"]["duplicateVisibleSuccessAllowed"] is False,
        "DUPLICATE_VISIBLE_SUCCESS_ALLOWED",
    )
    require(
        set(contract["canonicalRequestTypes"]) == {"Symptoms", "Meds", "Admin", "Results"},
        "CANONICAL_REQUEST_TYPES_DRIFT",
    )

    endpoint_rows = load_csv(endpoint_matrix_path)
    require(len(endpoint_rows) == 7, "ENDPOINT_MATRIX_ROW_COUNT_DRIFT")
    require(
        {row["route_id"] for row in endpoint_rows}
        == {
            "phase1_intake_get_bundle",
            "phase1_intake_start_draft",
            "phase1_intake_patch_draft",
            "phase1_intake_capture_contact",
            "phase1_intake_submit_journey",
            "phase1_intake_get_projection",
            "phase1_intake_advance_notification",
        },
        "ENDPOINT_MATRIX_ROUTE_ID_DRIFT",
    )
    require(
        all(row["route_family_ref"] == "rf_intake_self_service" for row in endpoint_rows),
        "ENDPOINT_MATRIX_ROUTE_FAMILY_DRIFT",
    )
    require(
        all(row["shell_continuity_key"] == "patient.portal.requests" for row in endpoint_rows),
        "ENDPOINT_MATRIX_CONTINUITY_KEY_DRIFT",
    )
    require(
        any("Phase1ConfirmationTransportSettlement" in row["authoritative_projection_tuple_refs"] for row in endpoint_rows),
        "ENDPOINT_MATRIX_NOTIFICATION_TRANSPORT_MISSING",
    )

    transition_rows = load_csv(transition_matrix_path)
    require(len(transition_rows) >= 10, "TRANSITION_MATRIX_TOO_SMALL")
    require(
        any(row["to_surface"] == "urgent_outcome" for row in transition_rows),
        "URGENT_TRANSITION_MISSING",
    )
    require(
        any(row["to_surface"] == "request_status" for row in transition_rows),
        "TRACKING_TRANSITION_MISSING",
    )
    require(
        all(row["duplicate_visible_success_allowed"] == "false" for row in transition_rows),
        "TRANSITION_MATRIX_DUPLICATE_SUCCESS_ALLOWED",
    )

    gap_log = load_json(gap_log_path)
    require(
        len(gap_log["gapRegister"]) >= 5,
        "INTEGRATION_GAP_REGISTER_TOO_SMALL",
    )
    require(
        all(entry["gapId"].startswith("GAP_RESOLVED_PHASE1_INTEGRATION_") for entry in gap_log["gapRegister"]),
        "GAP_REGISTER_ID_DRIFT",
    )

    architecture_doc = read_text(architecture_doc_path)
    tests_doc = read_text(tests_doc_path)
    operations_doc = read_text(operations_doc_path)
    storyboard = read_text(storyboard_path)
    gateway_source = read_text(gateway_source_path)
    runtime_source = read_text(runtime_source_path)
    service_definition = read_text(service_definition_path)
    gateway_test = read_text(gateway_test_path)
    patient_client = read_text(patient_client_path)
    patient_shell = read_text(patient_shell_path)
    playwright_spec = read_text(playwright_spec_path)
    root_package = load_json(root_package_path)
    playwright_package = load_json(playwright_package_path)
    root_script_updates = read_text(root_script_updates_path)

    for marker in [
        "PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1",
        "rf_intake_self_service",
        "patient.portal.requests",
        "services/api-gateway/src/phase1-integrated-intake.ts",
    ]:
        require(marker in architecture_doc, f"ARCHITECTURE_DOC_MARKER_MISSING:{marker}")

    for marker in [
        "full start-to-submit flows",
        "Exact replay",
        "Notification advance",
        "Mobile, tablet, and desktop",
    ]:
        require(marker in tests_doc, f"E2E_MATRIX_MARKER_MISSING:{marker}")

    for marker in [
        "Transport settlement",
        "Delivery evidence",
        "Do not promote `accepted` transport settlement to `delivered`.",
    ]:
        require(marker in operations_doc, f"OPERATIONS_DOC_MARKER_MISSING:{marker}")

    for marker in [
        'data-testid="phase1-integrated-storyboard"',
        'data-testid="journey-braid"',
        'data-testid="journey-braid-table"',
        'data-testid="shell-morph-diagram"',
        'data-testid="shell-morph-table"',
        'data-testid="route-settlement-matrix"',
        'data-testid="route-settlement-table"',
        'data-testid="notification-truth-ladder"',
        'data-testid="notification-truth-table"',
        'data-testid="storyboard-parity-list"',
    ]:
        require(marker in storyboard, f"STORYBOARD_MARKER_MISSING:{marker}")

    for marker in [
        'createHash("sha256")',
        "createNotificationDispatchApplication",
        "listTransportSettlementsForEnvelope",
        "listDeliveryEvidenceForEnvelope",
        "refreshRouteTruth",
        "latestSubmitByRequestPublicId",
        "replayed",
        "phase1IntegratedContinuityKey",
    ]:
        require(marker in gateway_source, f"GATEWAY_SOURCE_MARKER_MISSING:{marker}")
    require(
        "Buffer.from(requestRef" not in gateway_source,
        "GATEWAY_REQUEST_PUBLIC_ID_BASE64_PREFIX_COLLISION_RISK",
    )

    for marker in [
        "OPTIONS",
        "access-control-allow-origin",
        "buildPhase1IntegratedIntakeResponse",
        "isPhase1IntegratedIntakeRoute",
    ]:
        require(marker in runtime_source, f"RUNTIME_SOURCE_MARKER_MISSING:{marker}")

    for route_id in [row["route_id"] for row in endpoint_rows]:
        require(route_id in service_definition, f"SERVICE_DEFINITION_ROUTE_MISSING:{route_id}")

    for marker in [
        "VITE_PHASE1_INTAKE_API_BASE_URL",
        "startIntegratedDraft",
        "patchIntegratedDraft",
        "submitIntegratedJourney",
        "applyIntegratedSubmitResult",
        "latestNotificationPosture",
    ]:
        require(marker in patient_client, f"PATIENT_CLIENT_MARKER_MISSING:{marker}")

    for marker in [
        "data-phase1-integration",
        "data-phase1-settlement",
        "data-phase1-notification-posture",
        "submitIntegratedJourney",
        "applyIntegratedSubmitResult",
    ]:
        require(marker in patient_shell, f"PATIENT_SHELL_MARKER_MISSING:{marker}")

    for marker in [
        "settles all Phase 1 request types",
        "Symptoms",
        "Meds",
        "Admin",
        "Results",
        "replayed",
        "truthLadder",
        "accepted",
    ]:
        require(marker in gateway_test, f"GATEWAY_TEST_MARKER_MISSING:{marker}")

    for marker in [
        "--run",
        "startGateway",
        "startPatientWeb",
        "runGatewayApiChecks",
        "runBrowserShellChecks",
        "request-type-card-Meds",
        "patient-intake-mission-frame-root",
        "receipt-outcome-canvas",
        "urgent-pathway-frame",
        "track-request-surface",
        "reducedMotion",
        "keyboard",
        "delivery_pending",
        "transport accepted is not delivery",
        "Symptoms",
        "Meds",
        "Admin",
        "Results",
    ]:
        require(marker in playwright_spec, f"PLAYWRIGHT_SPEC_MARKER_MISSING:{marker}")

    scripts = root_package["scripts"]
    require(
        scripts["validate:phase1-integrated-intake"]
        == "python3 ./tools/analysis/validate_phase1_integrated_intake.py",
        "ROOT_VALIDATE_SCRIPT_MISSING",
    )
    require(
        "pnpm validate:phase1-integrated-intake" in scripts["bootstrap"],
        "ROOT_BOOTSTRAP_SCRIPT_MISSING_PHASE1_INTEGRATED_VALIDATE",
    )
    require(
        "pnpm validate:phase1-integrated-intake" in scripts["check"],
        "ROOT_CHECK_SCRIPT_MISSING_PHASE1_INTEGRATED_VALIDATE",
    )
    require(
        "validate:phase1-integrated-intake" in root_script_updates,
        "ROOT_SCRIPT_UPDATES_MISSING_PHASE1_INTEGRATED_VALIDATE",
    )

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        require(
            "164_phase1_integrated_intake.spec.js"
            in playwright_package["scripts"][script_name],
            f"PLAYWRIGHT_PACKAGE_SCRIPT_MISSING_164:{script_name}",
        )

    print("validate_phase1_integrated_intake: ok")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        print(f"VALIDATION_ERROR:{error}", file=sys.stderr)
        raise
