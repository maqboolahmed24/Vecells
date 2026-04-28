#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from build_backend_runtime_baseline import (
    ASYNC_DOC_PATH,
    ASYNC_EFFECT_PROOF_MATRIX_PATH,
    ATLAS_HTML_PATH,
    ATLAS_MARKERS,
    CANONICAL_NAMESPACE_CODES,
    DATA_CLASSIFICATION_PATH,
    ENDPOINT_MATRIX_PATH,
    EVENT_DOC_PATH,
    EVENT_NAMESPACE_MATRIX_PATH,
    EXTERNAL_DEPENDENCIES_PATH,
    FHIR_DOC_PATH,
    IDEMPOTENCY_RULES_PATH,
    MERMAID_PATH,
    REPLAY_DOC_PATH,
    SERVICE_DOC_PATH,
    SERVICE_RUNTIME_MATRIX_PATH,
    SOURCE_PRECEDENCE,
    STORAGE_DOC_PATH,
    STORE_RETENTION_MATRIX_PATH,
    TIMER_MATRIX_PATH,
    build_bundle,
    csv_ready,
    ensure_prerequisites,
    load_csv,
    load_json,
)


DELIVERABLES = [
    SERVICE_DOC_PATH,
    EVENT_DOC_PATH,
    STORAGE_DOC_PATH,
    ASYNC_DOC_PATH,
    REPLAY_DOC_PATH,
    FHIR_DOC_PATH,
    ATLAS_HTML_PATH,
    MERMAID_PATH,
    SERVICE_RUNTIME_MATRIX_PATH,
    EVENT_NAMESPACE_MATRIX_PATH,
    STORE_RETENTION_MATRIX_PATH,
    ASYNC_EFFECT_PROOF_MATRIX_PATH,
    TIMER_MATRIX_PATH,
    IDEMPOTENCY_RULES_PATH,
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def canonicalize(value):
    return json.loads(json.dumps(value))


def load_text(path: Path) -> str:
    assert_true(path.exists(), f"Missing text artifact: {path}")
    return path.read_text()


def validate_deliverables() -> None:
    for path in DELIVERABLES:
        assert_true(path.exists(), f"Missing seq_013 deliverable: {path}")


def validate_payload(payload: dict[str, object]) -> None:
    assert_true(payload["backend_runtime_baseline_id"] == "vecells_backend_runtime_baseline_v1", "Unexpected backend_runtime_baseline_id.")
    assert_true(payload["source_precedence"] == SOURCE_PRECEDENCE, "Source precedence drifted.")
    assert_true(payload["upstream_inputs"] == ensure_prerequisites(), "Prerequisite summary drifted.")

    summary = payload["summary"]
    runtime_components = payload["runtime_components"]
    namespaces = payload["event_namespaces"]
    stores = payload["store_matrix"]
    effects = payload["async_effects"]
    timers = payload["timer_families"]
    endpoint_coverage = payload["endpoint_coverage"]

    assert_true(payload["chosen_service_decomposition"] == "OPT_SMALL_EXECUTABLES_STRONG_MODULES", "Service decomposition choice drifted.")
    assert_true(payload["chosen_store_topology"] == "OPT_SEPARATE_DOMAIN_EVENT_PROJECTION_AUDIT", "Store topology choice drifted.")
    assert_true(payload["chosen_event_backbone"] == "OPT_CANONICAL_EVENT_SPINE", "Event backbone choice drifted.")
    assert_true(summary["unresolved_gap_count"] == 0, "Unexpected gaps present.")
    assert_true(summary["runtime_component_count"] == len(runtime_components), "Runtime component summary mismatch.")
    assert_true(summary["namespace_count"] == len(namespaces), "Namespace summary mismatch.")
    assert_true(summary["store_row_count"] == len(stores), "Store summary mismatch.")
    assert_true(summary["async_effect_count"] == len(effects), "Async effect summary mismatch.")
    assert_true(summary["timer_family_count"] == len(timers), "Timer summary mismatch.")
    assert_true(summary["endpoint_coverage_count"] == len(endpoint_coverage), "Endpoint coverage summary mismatch.")

    component_ids = {row["runtime_component_id"] for row in runtime_components}
    store_ids = {row["store_id"] for row in stores}
    timer_ids = {row["timer_family_id"] for row in timers}
    namespace_codes = [row["namespace_code"] for row in namespaces]

    assert_true(len(component_ids) == len(runtime_components), "Runtime component ids are not unique.")
    assert_true(len(store_ids) == len(stores), "Store ids are not unique.")
    assert_true(len(timer_ids) == len(timers), "Timer ids are not unique.")
    assert_true(namespace_codes == CANONICAL_NAMESPACE_CODES, "Canonical namespace set or order drifted.")

    for row in runtime_components:
        assert_true(row["component_kind"] in {"service", "worker", "queue", "stream", "store", "object_prefix", "cache", "timer_engine", "audit_sink"}, f"Unexpected component_kind: {row['runtime_component_id']}")
        assert_true(row["runtime_workload_family_ref"].startswith("wf_"), f"Runtime workload family ref should stay template-based: {row['runtime_component_id']}")
        assert_true(row["store_class"] in {"transactional_domain", "fhir_representation", "projection_read", "object_artifact", "cache", "event_log", "worm_audit", "feature_store", "timer_state"}, f"Unexpected store class: {row['runtime_component_id']}")
        assert_true(row["idempotency_strategy_ref"], f"Missing idempotency strategy: {row['runtime_component_id']}")
        assert_true(row["replay_strategy_ref"], f"Missing replay strategy: {row['runtime_component_id']}")
        assert_true(row["source_refs"], f"Missing source refs: {row['runtime_component_id']}")
        if row["store_class"] == "fhir_representation":
            assert_true("Derived" in row["authoritative_truth_role"], "FHIR store drifted into primary truth.")
        if row["store_class"] == "projection_read":
            assert_true("Derived" in row["authoritative_truth_role"], "Projection store drifted into primary truth.")
        if row["store_class"] == "feature_store":
            assert_true("Deferred" in row["authoritative_truth_role"] or "non-authoritative" in row["authoritative_truth_role"], "Feature store drifted into baseline truth.")
        if row["external_proof_class"] != "none":
            assert_true(row["external_proof_class"] in {"projection_visible", "external_confirmation", "review_disposition", "recovery_disposition"}, f"Unexpected proof class: {row['runtime_component_id']}")

    for row in stores:
        assert_true(row["runtime_component_ref"] in component_ids, f"Store references missing component: {row['store_id']}")
        assert_true(row["store_class"], f"Store class missing: {row['store_id']}")
        assert_true(row["rebuild_source"], f"Rebuild source missing: {row['store_id']}")
        assert_true(row["source_refs"], f"Store source refs missing: {row['store_id']}")
        if row["store_class"] == "transactional_domain":
            assert_true("Vecells-first" in row["authoritative_truth_role"] or "lifecycle" in row["authoritative_truth_role"], "Transactional domain truth role drifted.")
        if row["store_class"] == "fhir_representation":
            assert_true("Derived" in row["authoritative_truth_role"], "FHIR store role drifted.")
        if row["store_class"] == "projection_read":
            assert_true("Derived" in row["authoritative_truth_role"], "Projection store role drifted.")

    for row in namespaces:
        assert_true(row["compatibility_mode_default"] == "additive_only", f"Namespace compatibility drifted: {row['namespace_code']}")
        assert_true(row["normalization_rule_required"] == "yes", f"Normalization rule missing: {row['namespace_code']}")
        assert_true(row["quarantine_component_ref"] == "queue_event_normalization_quarantine", f"Namespace quarantine drifted: {row['namespace_code']}")
        assert_true(row["payload_privacy_rule"] == "artifact_ref_or_masked_descriptor_only", f"Namespace privacy posture drifted: {row['namespace_code']}")

    for row in timers:
        assert_true(row["checkpoint_object_ref"], f"Timer checkpoint missing: {row['timer_family_id']}")
        assert_true(row["settlement_ref"], f"Timer settlement missing: {row['timer_family_id']}")
        assert_true(row["proof_class"] in {"projection_visible", "external_confirmation", "review_disposition", "recovery_disposition"}, f"Timer proof class invalid: {row['timer_family_id']}")
        assert_true(row["owning_runtime_component_id"] in component_ids, f"Timer owner missing: {row['timer_family_id']}")
        assert_true(row["timer_state_component_ref"] == "store_timer_state", f"Timer state ref drifted: {row['timer_family_id']}")
        assert_true(row["user_visible_posture_change"] == "yes", f"Timer unexpectedly lost user-visible posture flag: {row['timer_family_id']}")

    effect_ids = set()
    seen_dependencies = set()
    for row in effects:
        effect_ids.add(row["effect_row_id"])
        seen_dependencies.add(row["dependency_id"])
        assert_true(row["runtime_component_id"] in component_ids, f"Async effect references missing component: {row['effect_row_id']}")
        assert_true(row["idempotency_strategy_ref"], f"Async effect missing idempotency strategy: {row['effect_row_id']}")
        assert_true(row["replay_strategy_ref"], f"Async effect missing replay strategy: {row['effect_row_id']}")
        assert_true(row["external_proof_class"] in {"none", "projection_visible", "external_confirmation", "review_disposition", "recovery_disposition"}, f"Async effect proof class invalid: {row['effect_row_id']}")

        applicability = row["effect_applicability"]
        if applicability == "full_duplex" or applicability == "outbound_then_inbound_derivation":
            assert_true(row["outbox_component_ref"] == "queue_command_outbox", f"Outbox lane missing for effectful dependency: {row['effect_row_id']}")
            assert_true(row["inbox_component_ref"] == "queue_adapter_receipt_inbox", f"Inbox lane missing for effectful dependency: {row['effect_row_id']}")
            assert_true(row["receipt_checkpoint_object_ref"], f"Receipt checkpoint missing for effectful dependency: {row['effect_row_id']}")
        elif applicability == "inbound_only":
            assert_true(not row["outbox_component_ref"], f"Inbound-only dependency should not declare outbox: {row['effect_row_id']}")
            assert_true(row["inbox_component_ref"] == "queue_adapter_receipt_inbox", f"Inbox lane missing for inbound-only dependency: {row['effect_row_id']}")
            assert_true(row["receipt_checkpoint_object_ref"], f"Receipt checkpoint missing for inbound-only dependency: {row['effect_row_id']}")
        elif applicability == "callback_only_non_outbox":
            assert_true(row["inbox_component_ref"] == "queue_adapter_receipt_inbox", f"Callback-only dependency missing inbox: {row['effect_row_id']}")
            assert_true(row["receipt_checkpoint_object_ref"], f"Callback-only dependency missing receipt checkpoint: {row['effect_row_id']}")
            assert_true(row["non_applicable_reason"], f"Callback-only dependency should explain why outbox is not primary: {row['effect_row_id']}")
        elif applicability.startswith("non_applicable"):
            assert_true(row["non_applicable_reason"], f"Non-applicable dependency missing explanation: {row['effect_row_id']}")
        else:
            raise SystemExit(f"Unexpected effect_applicability: {row['effect_row_id']} -> {applicability}")

    assert_true(len(effect_ids) == len(effects), "Async effect ids are not unique.")

    dependency_ids = {row["dependency_id"] for row in load_json(EXTERNAL_DEPENDENCIES_PATH)["dependencies"]}
    assert_true(seen_dependencies == dependency_ids, "Not every external dependency is represented in the async effect matrix.")

    endpoint_ids = {row["endpoint_id"] for row in load_csv(Path(ENDPOINT_MATRIX_PATH))}
    coverage_ids = {row["endpoint_id"] for row in endpoint_coverage}
    assert_true(endpoint_ids == coverage_ids, "Endpoint coverage set drifted.")
    for row in endpoint_coverage:
        assert_true(row["owning_service_refs"], f"Endpoint missing owning services: {row['endpoint_id']}")
        assert_true(row["authoritative_store_classes"], f"Endpoint missing authoritative store classes: {row['endpoint_id']}")
        assert_true(row["proof_classes"], f"Endpoint missing proof classes: {row['endpoint_id']}")
        for service_id in row["owning_service_refs"]:
            assert_true(service_id in component_ids, f"Endpoint coverage references unknown service: {row['endpoint_id']} -> {service_id}")


def validate_csv_and_json_outputs(payload: dict[str, object]) -> None:
    runtime_csv = load_csv(SERVICE_RUNTIME_MATRIX_PATH)
    namespace_csv = load_csv(EVENT_NAMESPACE_MATRIX_PATH)
    store_csv = load_csv(STORE_RETENTION_MATRIX_PATH)
    effect_csv = load_csv(ASYNC_EFFECT_PROOF_MATRIX_PATH)
    timer_csv = load_csv(TIMER_MATRIX_PATH)
    rules_json = load_json(IDEMPOTENCY_RULES_PATH)

    assert_true(canonicalize(runtime_csv) == canonicalize(csv_ready(payload["runtime_components"])), "Runtime component CSV drifted.")
    assert_true(canonicalize(namespace_csv) == canonicalize(csv_ready(payload["event_namespaces"])), "Namespace CSV drifted.")
    assert_true(canonicalize(store_csv) == canonicalize(csv_ready(payload["store_matrix"])), "Store matrix CSV drifted.")
    assert_true(canonicalize(effect_csv) == canonicalize(csv_ready(payload["async_effects"])), "Async effect CSV drifted.")
    assert_true(canonicalize(timer_csv) == canonicalize(csv_ready(payload["timer_families"])), "Timer CSV drifted.")
    assert_true(canonicalize(rules_json) == canonicalize(payload["idempotency_and_replay_rules"]), "Idempotency rules JSON drifted.")

    assert_true(rules_json["summary"]["unresolved_gap_count"] == 0, "Unexpected idempotency/replay gaps present.")
    assert_true(len(rules_json["idempotency_strategies"]) >= 8, "Idempotency strategy count drifted.")
    assert_true(len(rules_json["replay_rules"]) >= 8, "Replay rule count drifted.")


def validate_docs_and_assets(payload: dict[str, object]) -> None:
    docs = [
        SERVICE_DOC_PATH,
        EVENT_DOC_PATH,
        STORAGE_DOC_PATH,
        ASYNC_DOC_PATH,
        REPLAY_DOC_PATH,
        FHIR_DOC_PATH,
    ]
    for path in docs:
        text = load_text(path)
        assert_true(text.startswith("# "), f"Documentation file missing heading: {path}")
        assert_true("Vecells" in text or "baseline" in text.lower(), f"Documentation file looks empty: {path}")

    service_text = load_text(SERVICE_DOC_PATH)
    event_text = load_text(EVENT_DOC_PATH)
    storage_text = load_text(STORAGE_DOC_PATH)
    async_text = load_text(ASYNC_DOC_PATH)
    replay_text = load_text(REPLAY_DOC_PATH)
    fhir_text = load_text(FHIR_DOC_PATH)

    assert_true("OPT_SMALL_EXECUTABLES_STRONG_MODULES" in service_text, "Service decision missing from service baseline doc.")
    assert_true("CanonicalEventNamespace" in event_text or "canonical event spine" in event_text.lower(), "Event baseline doc missing canonical event framing.")
    assert_true("Vecells-first" in fhir_text or "Vecells-first domain truth" in fhir_text, "FHIR boundary doc missing Vecells-first boundary.")
    assert_true("queue_command_outbox" in replay_text, "Replay doc missing outbox reference.")
    assert_true("WaitlistDeadlineEvaluation" in async_text, "Async doc missing waitlist timer coverage.")
    assert_true("feature_store" in storage_text, "Storage doc missing feature-store posture.")

    mermaid_text = load_text(MERMAID_PATH)
    assert_true("Command API" in mermaid_text, "Mermaid flow missing Command API.")
    assert_true("Canonical Event Spine" in mermaid_text, "Mermaid flow missing canonical event spine.")
    assert_true("WORM Audit Ledger" in mermaid_text, "Mermaid flow missing WORM audit ledger.")

    html_text = load_text(ATLAS_HTML_PATH)
    for marker in ATLAS_MARKERS:
        assert_true(marker in html_text, f"Missing atlas marker: {marker}")
    assert_true("__EMBEDDED_JSON__" not in html_text, "Atlas still contains unresolved JSON placeholder.")
    assert_true("Vecells Backend Runtime Atlas" in html_text, "Atlas title missing.")
    assert_true(payload["backend_runtime_baseline_id"] in html_text, "Atlas does not embed the backend runtime payload.")
    assert_true('data-selected-service' in html_text, "Atlas missing selected-service DOM marker.")
    assert_true('data-selected-store' in html_text, "Atlas missing selected-store DOM marker.")
    assert_true('data-selected-proof' in html_text, "Atlas missing selected-proof DOM marker.")
    assert_true('data-selected-timer' in html_text, "Atlas missing selected-timer DOM marker.")

    forbidden_asset_markers = [
        'src="http://',
        'src="https://',
        'href="http://',
        'href="https://',
        "url(http://",
        "url(https://",
    ]
    assert_true(not any(marker in html_text for marker in forbidden_asset_markers), "Atlas references remote assets.")


def main() -> None:
    validate_deliverables()
    payload = build_bundle()
    validate_payload(payload)
    validate_csv_and_json_outputs(payload)
    validate_docs_and_assets(payload)


if __name__ == "__main__":
    main()
