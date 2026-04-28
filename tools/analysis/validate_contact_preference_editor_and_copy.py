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


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    contract_path = ROOT / "data/contracts/159_contact_summary_view_contract.json"
    state_matrix_path = ROOT / "data/analysis/159_contact_preference_state_matrix.csv"
    truth_table_path = ROOT / "data/analysis/159_confirmation_copy_truth_table.csv"
    architecture_doc_path = ROOT / "docs/architecture/159_contact_preference_editor_and_masked_summary.md"
    content_doc_path = ROOT / "docs/content/159_contact_preference_and_confirmation_copy.md"
    gallery_path = ROOT / "docs/frontend/159_contact_preference_gallery.html"
    util_source_path = ROOT / "apps/patient-web/src/patient-intake-contact-preferences.ts"
    component_source_path = ROOT / "apps/patient-web/src/patient-intake-contact-preference-components.tsx"
    mission_frame_source_path = ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx"
    spec_path = ROOT / "tests/playwright/159_contact_preference_editor_and_confirmation_copy.spec.js"

    for path in [
        contract_path,
        state_matrix_path,
        truth_table_path,
        architecture_doc_path,
        content_doc_path,
        gallery_path,
        util_source_path,
        component_source_path,
        mission_frame_source_path,
        spec_path,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    contract = load_json(contract_path)
    require(contract["taskId"] == "par_159", "CONTACT_EDITOR_TASK_ID_DRIFT")
    require(
        contract["contractId"] == "PHASE1_CONTACT_SUMMARY_VIEW_CONTRACT_V1",
        "CONTACT_EDITOR_CONTRACT_ID_DRIFT",
    )
    require(
        contract["requiredComponents"]
        == [
            "ChannelPreferenceStack",
            "RouteEntryPanel",
            "RouteMaskedSummaryCard",
            "CommunicationNeedsPanel",
            "ConfirmationCopyPreview",
            "TrustBoundaryNote",
        ],
        "CONTACT_EDITOR_COMPONENT_LIST_DRIFT",
    )
    copy_states = [entry["state"] for entry in contract["confirmationCopyStates"]]
    require(
        copy_states
        == [
            "preference_incomplete",
            "confirmation_attempt_planned",
            "follow_up_declined",
            "confirmation_queued",
            "delivery_pending",
            "delivery_confirmed",
            "recovery_required",
        ],
        "CONTACT_EDITOR_COPY_STATE_LIST_DRIFT",
    )
    require(
        contract["maskedSummaryLaw"]["ordinarySurfacesMaskedOnly"] is True
        and contract["maskedSummaryLaw"]["patientEnteredPreferenceDoesNotEqualVerifiedRoute"] is True
        and contract["maskedSummaryLaw"]["deliveryTruthRequiresLaterEvidence"] is True,
        "CONTACT_EDITOR_BOUNDARY_LAW_DRIFT",
    )

    state_rows = load_csv(state_matrix_path)
    state_ids = {row["state_id"] for row in state_rows}
    require(
        {
            "sms_complete_stable",
            "email_missing_route",
            "phone_follow_up_not_set",
            "phone_follow_up_declined",
            "sms_route_delta_review",
            "email_accessibility_translation",
        }
        <= state_ids,
        "CONTACT_EDITOR_STATE_MATRIX_ROWS_MISSING",
    )
    require(
        any(
            row["review_state"] == "review"
            and "CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT"
            in row["reason_codes"]
            for row in state_rows
        ),
        "CONTACT_EDITOR_REVIEW_STATE_MISSING_ROUTE_DELTA",
    )

    truth_rows = load_csv(truth_table_path)
    truth_states = {row["copy_state"] for row in truth_rows}
    require(
        set(copy_states) <= truth_states,
        "CONTACT_EDITOR_TRUTH_TABLE_STATES_MISSING",
    )
    delivered_rows = [row for row in truth_rows if row["copy_state"] == "delivery_confirmed"]
    require(
        len(delivered_rows) == 1 and delivered_rows[0]["delivery_claim_allowed"] == "true",
        "CONTACT_EDITOR_DELIVERED_COPY_MUST_BE_SINGLE_AND_TRUE",
    )
    require(
        all(
            row["delivery_claim_allowed"] == "false"
            for row in truth_rows
            if row["copy_state"] != "delivery_confirmed"
        ),
        "CONTACT_EDITOR_NON_DELIVERED_ROWS_MUST_NOT_CLAIM_DELIVERY",
    )

    util_source = util_source_path.read_text(encoding="utf-8")
    component_source = component_source_path.read_text(encoding="utf-8")
    mission_frame_source = mission_frame_source_path.read_text(encoding="utf-8")
    gallery_html = gallery_path.read_text(encoding="utf-8")
    normalized_gallery_html = " ".join(gallery_html.split())
    spec_source = spec_path.read_text(encoding="utf-8")

    for marker in [
        "buildContactSummaryView",
        "buildConfirmationCopyPreview",
        "CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT",
        "not delivery confirmation",
    ]:
        require(marker in util_source, f"CONTACT_EDITOR_UTIL_MARKER_MISSING:{marker}")

    for marker in [
        "ChannelPreferenceStack",
        "RouteEntryPanel",
        "RouteMaskedSummaryCard",
        "CommunicationNeedsPanel",
        "ConfirmationCopyPreview",
        "TrustBoundaryNote",
        'data-testid="contact-channel-stack"',
        'data-testid="contact-route-entry-panel"',
        'data-testid="contact-masked-summary-card"',
        'data-testid="contact-communication-needs-panel"',
        'data-testid="contact-confirmation-copy-preview"',
        'data-testid="contact-trust-boundary-note"',
    ]:
        require(
            marker in component_source or marker in mission_frame_source,
            f"CONTACT_EDITOR_UI_MARKER_MISSING:{marker}",
        )

    for forbidden in [
        "we've verified this route",
        "we will definitely text you",
        "delivery confirmed",
    ]:
        require(
            forbidden not in mission_frame_source.lower(),
            f"CONTACT_EDITOR_FALSE_CERTAINTY_IN_RUNTIME:{forbidden}",
        )

    for marker in [
        'data-testid="contact-preference-gallery"',
        'data-testid="contact-gallery-components"',
        'data-testid="contact-gallery-state-matrix"',
        'data-testid="contact-gallery-copy-truth-table"',
        'data-testid="contact-trust-ladder-diagram"',
        'data-testid="contact-trust-ladder-table"',
    ]:
        require(marker in gallery_html, f"CONTACT_EDITOR_GALLERY_MARKER_MISSING:{marker}")
    require(
        "not whether the route is verified or whether a message was delivered"
        in normalized_gallery_html,
        "CONTACT_EDITOR_GALLERY_MARKER_MISSING:not whether the route is verified or whether a message was delivered",
    )

    for raw_value in [
        "07700 900123",
        "patient.demo@example.test",
        "020 7946 0012",
    ]:
        require(raw_value not in gallery_html, f"CONTACT_EDITOR_GALLERY_RAW_VALUE_LEAK:{raw_value}")

    for marker in [
        "contact-channel-card-email",
        "contact-destination-input-email",
        "contact-confirmation-copy-preview",
        "contact-review-cue",
        "contact-inline-error-follow-up",
        "reducedMotion",
    ]:
        require(marker in spec_source, f"CONTACT_EDITOR_SPEC_MARKER_MISSING:{marker}")

    print("validate_contact_preference_editor_and_copy: ok")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        print(f"VALIDATION_ERROR:{error}", file=sys.stderr)
        raise
