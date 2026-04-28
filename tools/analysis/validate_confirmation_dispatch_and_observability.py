#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
MIGRATION_PATH = (
    ROOT / "services" / "command-api" / "migrations" / "089_phase1_confirmation_dispatch_and_observability.sql"
)

COMMUNICATION_RUNTIME_PATH = (
    ROOT / "packages" / "domains" / "communications" / "src" / "phase1-confirmation-dispatch.ts"
)
COMMUNICATION_INDEX_PATH = ROOT / "packages" / "domains" / "communications" / "src" / "index.ts"
COMMUNICATION_TEST_PATH = (
    ROOT / "packages" / "domains" / "communications" / "tests" / "phase1-confirmation-dispatch.test.ts"
)
COMMUNICATION_PUBLIC_API_TEST_PATH = (
    ROOT / "packages" / "domains" / "communications" / "tests" / "public-api.test.ts"
)

COMMAND_API_CONFIRMATION_PATH = ROOT / "services" / "command-api" / "src" / "confirmation-dispatch.ts"
INTAKE_SUBMIT_PATH = ROOT / "services" / "command-api" / "src" / "intake-submit.ts"
INTAKE_SUBMIT_TEST_PATH = (
    ROOT / "services" / "command-api" / "tests" / "intake-submit.integration.test.js"
)

WORKER_CONFIRMATION_PATH = ROOT / "services" / "notification-worker" / "src" / "confirmation-dispatch.ts"
WORKER_SERVICE_DEFINITION_PATH = (
    ROOT / "services" / "notification-worker" / "src" / "service-definition.ts"
)
WORKER_RUNTIME_TEST_PATH = (
    ROOT / "services" / "notification-worker" / "tests" / "runtime.integration.test.js"
)
WORKER_WEBHOOK_TEST_PATH = (
    ROOT / "services" / "notification-worker" / "tests" / "dependency-degradation.integration.test.js"
)

CONTRACT_PATH = ROOT / "data" / "contracts" / "153_confirmation_dispatch_contract.json"
STATE_MATRIX_PATH = ROOT / "data" / "analysis" / "153_notification_state_matrix.csv"
METRICS_ALERTS_PATH = ROOT / "data" / "analysis" / "153_notification_metrics_and_alerts.json"
DESIGN_DOC_PATH = ROOT / "docs" / "architecture" / "153_confirmation_dispatch_design.md"
OBSERVABILITY_DOC_PATH = (
    ROOT / "docs" / "architecture" / "153_notification_observability_and_alerting.md"
)


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    required_paths = [
        PACKAGE_JSON_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        MIGRATION_PATH,
        COMMUNICATION_RUNTIME_PATH,
        COMMUNICATION_INDEX_PATH,
        COMMUNICATION_TEST_PATH,
        COMMUNICATION_PUBLIC_API_TEST_PATH,
        COMMAND_API_CONFIRMATION_PATH,
        INTAKE_SUBMIT_PATH,
        INTAKE_SUBMIT_TEST_PATH,
        WORKER_CONFIRMATION_PATH,
        WORKER_SERVICE_DEFINITION_PATH,
        WORKER_RUNTIME_TEST_PATH,
        WORKER_WEBHOOK_TEST_PATH,
        CONTRACT_PATH,
        STATE_MATRIX_PATH,
        METRICS_ALERTS_PATH,
        DESIGN_DOC_PATH,
        OBSERVABILITY_DOC_PATH,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing par_153 artifact: {path}")

    package_json = read_json(PACKAGE_JSON_PATH)
    contract = read_json(CONTRACT_PATH)
    state_rows = read_csv_rows(STATE_MATRIX_PATH)
    metrics_alerts = read_json(METRICS_ALERTS_PATH)

    communication_runtime_text = COMMUNICATION_RUNTIME_PATH.read_text(encoding="utf-8")
    communication_index_text = COMMUNICATION_INDEX_PATH.read_text(encoding="utf-8")
    communication_test_text = COMMUNICATION_TEST_PATH.read_text(encoding="utf-8")
    communication_public_api_test_text = COMMUNICATION_PUBLIC_API_TEST_PATH.read_text(
        encoding="utf-8"
    )
    command_api_confirmation_text = COMMAND_API_CONFIRMATION_PATH.read_text(encoding="utf-8")
    intake_submit_text = INTAKE_SUBMIT_PATH.read_text(encoding="utf-8")
    intake_submit_test_text = INTAKE_SUBMIT_TEST_PATH.read_text(encoding="utf-8")
    worker_confirmation_text = WORKER_CONFIRMATION_PATH.read_text(encoding="utf-8")
    worker_service_definition_text = WORKER_SERVICE_DEFINITION_PATH.read_text(encoding="utf-8")
    worker_runtime_test_text = WORKER_RUNTIME_TEST_PATH.read_text(encoding="utf-8")
    worker_webhook_test_text = WORKER_WEBHOOK_TEST_PATH.read_text(encoding="utf-8")
    migration_text = MIGRATION_PATH.read_text(encoding="utf-8")
    docs_text = DESIGN_DOC_PATH.read_text(encoding="utf-8") + "\n" + OBSERVABILITY_DOC_PATH.read_text(
        encoding="utf-8"
    )

    ensure(
        package_json["scripts"].get("validate:confirmation-dispatch-observability")
        == "python3 ./tools/analysis/validate_confirmation_dispatch_and_observability.py",
        "package.json is missing validate:confirmation-dispatch-observability.",
    )
    ensure(
        ROOT_SCRIPT_UPDATES["validate:confirmation-dispatch-observability"]
        == "python3 ./tools/analysis/validate_confirmation_dispatch_and_observability.py",
        "root_script_updates.py is missing validate:confirmation-dispatch-observability.",
    )
    ensure(
        "pnpm validate:confirmation-dispatch-observability" in ROOT_SCRIPT_UPDATES["bootstrap"]
        and "pnpm validate:confirmation-dispatch-observability" in ROOT_SCRIPT_UPDATES["check"],
        "Root script update strings must include validate:confirmation-dispatch-observability.",
    )

    for required_table in [
        "phase1_confirmation_communication_envelopes",
        "phase1_confirmation_transport_settlements",
        "phase1_confirmation_delivery_evidence",
        "phase1_confirmation_receipt_bridges",
    ]:
        ensure(required_table in migration_text, f"Migration must create {required_table}.")

    for token in [
        "phase1ConfirmationDispatchContractRef",
        "Phase1ConfirmationCommunicationEnvelopeDocument",
        "Phase1ConfirmationTransportSettlementDocument",
        "Phase1ConfirmationDeliveryEvidenceDocument",
        "Phase1ConfirmationReceiptBridgeDocument",
        'makeFoundationEvent("communication.queued"',
        'makeFoundationEvent("communication.command.settled"',
        'makeFoundationEvent("communication.delivery.evidence.recorded"',
        'makeFoundationEvent("communication.callback.outcome.recorded"',
        "buildMetricsSnapshot",
        "providerAcceptanceRate",
        "deliveryEvidenceRate",
        "queueDepth",
        "receiptRecoveryRequiredCount",
    ]:
        ensure(token in communication_runtime_text, f"phase1-confirmation-dispatch.ts is missing {token}.")

    for token in [
        'export * from "./phase1-confirmation-dispatch";',
        "Phase1ConfirmationCommunicationEnvelope",
        "Phase1ConfirmationReceiptBridge",
        "Phase1NotificationMetricsSnapshot",
    ]:
        ensure(token in communication_index_text, f"communications index is missing {token}.")

    ensure(
        "communication.delivery.evidence.recorded" in communication_test_text
        and "communication.callback.outcome.recorded" in communication_test_text
        and "blocked_route_truth" in communication_test_text,
        "Communications tests must cover blocked route truth and callback evidence.",
    )
    ensure(
        "createPhase1ConfirmationDispatchStore" in communication_public_api_test_text
        and "createPhase1ConfirmationDispatchService" in communication_public_api_test_text,
        "Communications public-api test must cover par_153 exports.",
    )

    for token in [
        "createConfirmationDispatchApplication",
        'confirm_dispatch::${input.requestRef}::${input.receiptEnvelopeRef}',
        'blockedActionScopeRefs: ["status_view", "contact_route_repair"]',
        "PHASE1_TRIAGE_CONFIRMATION_NOTIFICATION_V1",
    ]:
        ensure(token in command_api_confirmation_text, f"confirmation-dispatch.ts is missing {token}.")

    for token in [
        "confirmationDispatch.queueRoutineConfirmation",
        "confirmationDispatchResult?.events",
        "089_phase1_confirmation_dispatch_and_observability.sql",
    ]:
        ensure(token in intake_submit_text, f"intake-submit.ts is missing {token}.")
    for token in [
        "confirmationEnvelopes",
        "confirmationBridges",
        '"communication.queued"',
        '"communication.receipt.enveloped"',
    ]:
        ensure(token in intake_submit_test_text, f"intake-submit integration test is missing {token}.")

    for token in [
        "createNotificationDispatchApplication",
        "recordTraceSpan",
        "recordMetricSample",
        "maskedContactField",
        "maskedRouteField",
        "notification_confirmation_dispatch_settled",
        "notification_confirmation_webhook_recorded",
        '"notification.provider_acceptance_rate"',
        '"notification.delivery_evidence_rate"',
        "refreshRouteTruth",
    ]:
        ensure(token in worker_confirmation_text, f"notification worker confirmation app is missing {token}.")

    for token in [
        "/dispatch/envelopes",
        "/dispatch/webhooks",
        "/dispatch/settlement",
        '"communication.queued"',
        '"communication.command.settled"',
        '"communication.delivery.evidence.recorded"',
        '"communication.callback.outcome.recorded"',
    ]:
        ensure(token in worker_service_definition_text, f"notification worker service definition is missing {token}.")

    ensure(
        '"communication.command.settled"' in worker_runtime_test_text,
        "notification worker runtime integration test must cover transport settlement.",
    )
    for token in [
        "freezeContactRouteSnapshot",
        "createDependency",
        '"communication.delivery.evidence.recorded"',
        '"communication.callback.outcome.recorded"',
        "maskedTelemetry?.disclosureFence.disclosureState",
    ]:
        ensure(token in worker_webhook_test_text, f"notification worker webhook test is missing {token}.")

    ensure(contract["taskId"] == "par_153", "Confirmation dispatch contract must declare taskId par_153.")
    ensure(
        contract["contractId"] == "PHASE1_CONFIRMATION_DISPATCH_CONTRACT_V1",
        "Confirmation dispatch contract ID drifted.",
    )
    ensure(
        contract["requiredUpstreamReceiptEvent"] == "communication.receipt.enveloped",
        "Confirmation dispatch must depend on the upstream receipt event.",
    )
    ensure(
        contract["routeTruthLaw"]["staleBlockedOrDisputedRoutesMustBlockDispatch"] is True,
        "Route truth law must fail closed on stale, blocked, or disputed routes.",
    )
    ensure(
        contract["routeTruthLaw"]["transportAcceptanceIsWeakEvidenceOnly"] is True,
        "Transport acceptance must stay weak evidence only.",
    )
    ensure(
        contract["retryPolicy"]["backoffSeconds"] == [60, 300, 900],
        "Retry backoff drifted.",
    )
    ensure(
        contract["observabilityLaw"]["alertRouteRef"] == "ALERT_COMMUNICATION_AND_CALLBACK_HEALTH",
        "Confirmation alert route drifted.",
    )

    ensure(state_rows, "Notification state matrix must contain rows.")
    scenario_ids = {row["scenario_id"] for row in state_rows}
    ensure(
        scenario_ids
        == {
            "blocked_route_truth_queued",
            "dispatch_accepted_pending",
            "delivery_confirmed",
            "transport_timeout_retry",
            "transport_rejected_terminal",
            "delivery_bounced_failed",
            "delivery_disputed",
            "delivery_expired",
        },
        "Notification state matrix scenarios drifted.",
    )
    ensure(
        all(bool(row["operator_rule"]) for row in state_rows),
        "Every notification state matrix row must carry an operator rule.",
    )
    ensure(
        any(row["authoritative_outcome_state"] == "delivery_confirmed" for row in state_rows),
        "State matrix must include a delivery_confirmed row.",
    )
    ensure(
        any(row["authoritative_outcome_state"] == "recovery_required" for row in state_rows),
        "State matrix must include recovery_required rows.",
    )

    required_metrics = {
        "dispatch_queued_rate",
        "provider_acceptance_rate",
        "delivery_evidence_rate",
        "bounce_failure_rate",
        "queue_depth",
        "queue_blockage",
        "end_to_end_confirmation_latency_p95_ms",
        "receipt_recovery_required_count",
    }
    metric_names = {row["metricName"] for row in metrics_alerts["metrics"]}
    ensure(required_metrics == metric_names, "Notification metric registry drifted.")
    ensure(len(metrics_alerts["alerts"]) >= 5, "Notification alert registry is incomplete.")
    ensure(
        all(alert["alertRouteRef"] == "ALERT_COMMUNICATION_AND_CALLBACK_HEALTH" for alert in metrics_alerts["alerts"]),
        "Notification alerts must stay on the communication and callback health route.",
    )
    ensure(
        metrics_alerts["telemetryLaw"]["redactionFence"] == "UITelemetryDisclosureFence",
        "Telemetry law must stay disclosure-fenced.",
    )
    ensure(
        "rawDestination" in metrics_alerts["telemetryLaw"]["forbiddenFields"],
        "Telemetry law must explicitly forbid raw destinations.",
    )

    for token in [
        "local acknowledgement",
        "transport accepted",
        "delivery evidence",
        "recovery_required",
        "communication.queued",
        "communication.receipt.enveloped",
        "status_view",
        "contact_route_repair",
        "queue blockage",
        "UITelemetryDisclosureFence",
        "ALERT_COMMUNICATION_AND_CALLBACK_HEALTH",
    ]:
        ensure(token in docs_text, f"par_153 docs are missing {token}.")

    print("validate_confirmation_dispatch_and_observability: ok")


if __name__ == "__main__":
    main()
