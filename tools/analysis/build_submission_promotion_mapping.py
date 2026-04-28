#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

TASK_ID = "par_066"
VISUAL_MODE = "Promotion_Mapping_Atlas"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Freeze the exact-once SubmissionEnvelope to Request promotion boundary so duplicate submit, "
    "cross-tab races, auth-return re-entry, support resume, and delayed retries all resolve "
    "through one immutable SubmissionPromotionRecord plus authoritative request-shell handoff."
)

MANIFEST_PATH = DATA_DIR / "submission_promotion_record_manifest.json"
MAPPING_MATRIX_PATH = DATA_DIR / "envelope_to_request_mapping_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "promotion_replay_casebook.json"

DESIGN_DOC_PATH = DOCS_DIR / "66_submission_promotion_boundary_design.md"
ALGORITHM_DOC_PATH = DOCS_DIR / "66_exactly_once_promotion_algorithm.md"
ATLAS_PATH = DOCS_DIR / "66_promotion_mapping_atlas.html"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_submission_promotion_mapping.py"
SPEC_PATH = TESTS_DIR / "submission-promotion-atlas.spec.js"

SOURCE_PRECEDENCE = [
    "prompt/066.md",
    "prompt/shared_operating_contract_066_to_075.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
    "blueprint/phase-0-the-foundation-protocol.md#1.1A SubmissionPromotionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.1B RequestLineage",
    "blueprint/phase-0-the-foundation-protocol.md#4. Canonical ingest, pre-submission capture, promotion, and episode formation",
    "blueprint/phase-1-the-red-flag-gate.md#Governed submit promotion",
    "blueprint/vecells-complete-end-to-end-flow.md#I_ENVELOPE",
    "blueprint/vecells-complete-end-to-end-flow.md#I_SUBMIT",
    "blueprint/forensic-audit-findings.md#Finding-01",
    "blueprint/forensic-audit-findings.md#Finding-02",
    "blueprint/forensic-audit-findings.md#Finding-03",
    "blueprint/forensic-audit-findings.md#Finding-04",
    "blueprint/forensic-audit-findings.md#Finding-07",
    "data/analysis/submission_and_lineage_aggregate_manifest.json",
]

PROMOTION_BOUNDARIES = [
    {
        "promotionMappingId": "PM_066_BROWSER_PRIMARY_V1",
        "envelopeId": "env_066_browser_primary_v1",
        "envelopeState": "promoted",
        "promotionRecordId": "promotion_066_browser_primary_v1",
        "requestId": "request_066_browser_primary_v1",
        "requestLineageId": "lineage_066_browser_primary_v1",
        "sourceLineageRef": "source_lineage_066_browser_primary_v1",
        "receiptConsistencyKey": "receipt_consistency::env_066_browser_primary_v1",
        "statusConsistencyKey": "status_consistency::env_066_browser_primary_v1",
        "patientJourneyLineageRef": "patient_journey::lineage_066_browser_primary_v1",
        "channelProfile": "browser",
        "replayClass": "duplicate_submit_same_tab",
        "recordStatus": "committed",
        "anomalyStatus": "clear",
        "requestShellHandoff": "request_shell_redirect",
        "supersededAccessGrantRefs": [
            "grant_066_browser_primary_v1",
            "grant_066_browser_primary_v2",
        ],
        "supersededDraftLeaseRefs": ["lease_066_browser_primary_v1"],
        "notes": "Primary self-service submit with same-tab replay collapse through the envelope bridge.",
    },
    {
        "promotionMappingId": "PM_066_BROWSER_CROSSTAB_V1",
        "envelopeId": "env_066_browser_crosstab_v1",
        "envelopeState": "promoted",
        "promotionRecordId": "promotion_066_browser_crosstab_v1",
        "requestId": "request_066_browser_crosstab_v1",
        "requestLineageId": "lineage_066_browser_crosstab_v1",
        "sourceLineageRef": "source_lineage_066_browser_crosstab_v1",
        "receiptConsistencyKey": "receipt_consistency::env_066_browser_crosstab_v1",
        "statusConsistencyKey": "status_consistency::env_066_browser_crosstab_v1",
        "patientJourneyLineageRef": "patient_journey::lineage_066_browser_crosstab_v1",
        "channelProfile": "browser",
        "replayClass": "duplicate_submit_cross_tab",
        "recordStatus": "committed",
        "anomalyStatus": "clear",
        "requestShellHandoff": "request_shell_redirect",
        "supersededAccessGrantRefs": ["grant_066_browser_crosstab_v1"],
        "supersededDraftLeaseRefs": ["lease_066_browser_crosstab_v1"],
        "notes": "Cross-tab contention is serialized behind one promotion boundary and one request.",
    },
    {
        "promotionMappingId": "PM_066_AUTH_RETURN_V1",
        "envelopeId": "env_066_auth_return_v1",
        "envelopeState": "promoted",
        "promotionRecordId": "promotion_066_auth_return_v1",
        "requestId": "request_066_auth_return_v1",
        "requestLineageId": "lineage_066_auth_return_v1",
        "sourceLineageRef": "source_lineage_066_auth_return_v1",
        "receiptConsistencyKey": "receipt_consistency::env_066_auth_return_v1",
        "statusConsistencyKey": "status_consistency::env_066_auth_return_v1",
        "patientJourneyLineageRef": "patient_journey::lineage_066_auth_return_v1",
        "channelProfile": "embedded_auth_return",
        "replayClass": "auth_return_replay",
        "recordStatus": "committed",
        "anomalyStatus": "clear",
        "requestShellHandoff": "request_shell_redirect",
        "supersededAccessGrantRefs": ["grant_066_auth_return_v1"],
        "supersededDraftLeaseRefs": ["lease_066_auth_return_v1"],
        "notes": "Callback re-entry resolves through status and receipt keys without inferring identity from session success.",
    },
    {
        "promotionMappingId": "PM_066_SUPPORT_RESUME_V1",
        "envelopeId": "env_066_support_resume_v1",
        "envelopeState": "promoted",
        "promotionRecordId": "promotion_066_support_resume_v1",
        "requestId": "request_066_support_resume_v1",
        "requestLineageId": "lineage_066_support_resume_v1",
        "sourceLineageRef": "source_lineage_066_support_resume_v1",
        "receiptConsistencyKey": "receipt_consistency::env_066_support_resume_v1",
        "statusConsistencyKey": "status_consistency::env_066_support_resume_v1",
        "patientJourneyLineageRef": "patient_journey::lineage_066_support_resume_v1",
        "channelProfile": "support_console",
        "replayClass": "support_resume_replay",
        "recordStatus": "committed",
        "anomalyStatus": "clear",
        "requestShellHandoff": "request_shell_redirect",
        "supersededAccessGrantRefs": ["grant_066_support_resume_v1"],
        "supersededDraftLeaseRefs": ["lease_066_support_resume_v1"],
        "notes": "Support-assisted continuation skips draft reopening and lands on the authoritative request shell.",
    },
    {
        "promotionMappingId": "PM_066_DELAYED_RETRY_V1",
        "envelopeId": "env_066_delayed_retry_v1",
        "envelopeState": "promoted",
        "promotionRecordId": "promotion_066_delayed_retry_v1",
        "requestId": "request_066_delayed_retry_v1",
        "requestLineageId": "lineage_066_delayed_retry_v1",
        "sourceLineageRef": "source_lineage_066_delayed_retry_v1",
        "receiptConsistencyKey": "receipt_consistency::env_066_delayed_retry_v1",
        "statusConsistencyKey": "status_consistency::env_066_delayed_retry_v1",
        "patientJourneyLineageRef": "patient_journey::lineage_066_delayed_retry_v1",
        "channelProfile": "browser",
        "replayClass": "delayed_network_retry",
        "recordStatus": "committed",
        "anomalyStatus": "clear",
        "requestShellHandoff": "request_shell_redirect",
        "supersededAccessGrantRefs": ["grant_066_delayed_retry_v1"],
        "supersededDraftLeaseRefs": ["lease_066_delayed_retry_v1"],
        "notes": "Lost first response and delayed retry still return the already-committed request truth.",
    },
    {
        "promotionMappingId": "PM_066_READY_NO_RECORD_ANOMALY_V1",
        "envelopeId": "env_066_ready_no_record_anomaly_v1",
        "envelopeState": "ready_to_promote",
        "promotionRecordId": "",
        "requestId": "",
        "requestLineageId": "",
        "sourceLineageRef": "source_lineage_066_ready_no_record_anomaly_v1",
        "receiptConsistencyKey": "receipt_consistency::env_066_ready_no_record_anomaly_v1",
        "statusConsistencyKey": "status_consistency::env_066_ready_no_record_anomaly_v1",
        "patientJourneyLineageRef": "",
        "channelProfile": "browser",
        "replayClass": "duplicate_submit_cross_tab",
        "recordStatus": "blocked",
        "anomalyStatus": "missing_promotion_record",
        "requestShellHandoff": "blocked_until_promotion_record",
        "supersededAccessGrantRefs": ["grant_066_ready_no_record_anomaly_v1"],
        "supersededDraftLeaseRefs": ["lease_066_ready_no_record_anomaly_v1"],
        "notes": "Fail-closed anomaly row: an envelope must not advertise promoted continuity without an immutable record.",
    },
]

REPLAY_CASEBOOK = [
    {
        "caseId": "CASE_066_SAME_TAB_DOUBLE_SUBMIT",
        "promotionMappingId": "PM_066_BROWSER_PRIMARY_V1",
        "scenarioId": "same_tab_double_submit",
        "channelProfile": "browser",
        "replayClass": "duplicate_submit_same_tab",
        "lookupField": "submissionEnvelopeRef",
        "expectedOutcome": "return_existing_promotion_result",
        "transactionEvents": [
            "intake.promotion.started",
            "intake.promotion.superseded_grants_applied",
            "intake.promotion.committed",
            "intake.promotion.settled",
            "request.created",
            "request.submitted",
        ],
        "replayEvents": ["intake.promotion.replay_returned"],
        "sourceRefs": [
            "prompt/066.md",
            "services/command-api/src/submission-promotion-simulator.ts",
        ],
    },
    {
        "caseId": "CASE_066_CROSSTAB_RACE",
        "promotionMappingId": "PM_066_BROWSER_CROSSTAB_V1",
        "scenarioId": "cross_tab_submit_race",
        "channelProfile": "browser",
        "replayClass": "duplicate_submit_cross_tab",
        "lookupField": "submissionEnvelopeRef",
        "expectedOutcome": "serialize_and_return_existing_result",
        "transactionEvents": [
            "intake.promotion.started",
            "intake.promotion.superseded_grants_applied",
            "intake.promotion.committed",
            "intake.promotion.settled",
            "request.created",
            "request.submitted",
        ],
        "replayEvents": ["intake.promotion.replay_returned"],
        "sourceRefs": [
            "prompt/066.md",
            "packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
        ],
    },
    {
        "caseId": "CASE_066_AUTH_RETURN_REPLAY",
        "promotionMappingId": "PM_066_AUTH_RETURN_V1",
        "scenarioId": "auth_return_replay_after_commit",
        "channelProfile": "embedded_auth_return",
        "replayClass": "auth_return_replay",
        "lookupField": "statusConsistencyKey",
        "expectedOutcome": "return_existing_promotion_result",
        "transactionEvents": [
            "intake.promotion.started",
            "intake.promotion.superseded_grants_applied",
            "intake.promotion.committed",
            "intake.promotion.settled",
            "request.created",
            "request.submitted",
        ],
        "replayEvents": ["intake.promotion.replay_returned"],
        "sourceRefs": [
            "prompt/066.md",
            "services/command-api/src/submission-promotion-simulator.ts",
        ],
    },
    {
        "caseId": "CASE_066_SUPPORT_RESUME",
        "promotionMappingId": "PM_066_SUPPORT_RESUME_V1",
        "scenarioId": "support_resume_promoted_lineage",
        "channelProfile": "support_console",
        "replayClass": "support_resume_replay",
        "lookupField": "sourceLineageRef",
        "expectedOutcome": "redirect_to_authoritative_request_shell",
        "transactionEvents": [
            "intake.promotion.started",
            "intake.promotion.superseded_grants_applied",
            "intake.promotion.committed",
            "intake.promotion.settled",
            "request.created",
            "request.submitted",
        ],
        "replayEvents": ["authoritative_request_shell"],
        "sourceRefs": [
            "prompt/066.md",
            "packages/domains/identity_access/src/submission-lineage-backbone.ts",
        ],
    },
    {
        "caseId": "CASE_066_DELAYED_NETWORK_RETRY",
        "promotionMappingId": "PM_066_DELAYED_RETRY_V1",
        "scenarioId": "delayed_network_retry_after_lost_response",
        "channelProfile": "browser",
        "replayClass": "delayed_network_retry",
        "lookupField": "receiptConsistencyKey",
        "expectedOutcome": "return_existing_promotion_result",
        "transactionEvents": [
            "intake.promotion.started",
            "intake.promotion.superseded_grants_applied",
            "intake.promotion.committed",
            "intake.promotion.settled",
            "request.created",
            "request.submitted",
        ],
        "replayEvents": ["intake.promotion.replay_returned"],
        "sourceRefs": [
            "prompt/066.md",
            "services/command-api/src/submission-promotion-simulator.ts",
        ],
    },
]

PARALLEL_INTERFACE_GAPS = [
    {
        "gapId": "PARALLEL_INTERFACE_GAP_066_PROMOTION_EVENT_REGISTRY_ROWS",
        "status": "bounded_shared_contract_stub",
        "rationale": (
            "seq_048 does not yet publish the intake promotion started, committed, replay-returned, "
            "and superseded-grants-applied families, so par_066 publishes a bounded shared seam in "
            "packages/event-contracts without rewriting the canonical registry."
        ),
        "sourceRefs": [
            "prompt/066.md",
            "prompt/shared_operating_contract_066_to_075.md",
            "packages/event-contracts/src/submission-lineage-events.ts",
        ],
    }
]

IMPLEMENTATION_FILES = [
    "packages/event-contracts/src/submission-lineage-events.ts",
    "packages/event-contracts/tests/submission-lineage-events.test.ts",
    "packages/domains/identity_access/src/submission-lineage-backbone.ts",
    "packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
    "services/command-api/src/submission-backbone.ts",
    "services/command-api/src/submission-promotion-simulator.ts",
    "services/command-api/tests/submission-backbone.integration.test.js",
    "services/command-api/migrations/066_submission_promotion_exactly_once.sql",
    "tools/analysis/build_submission_promotion_mapping.py",
    "tools/analysis/validate_submission_promotion_mapping.py",
    "tests/playwright/submission-promotion-atlas.spec.js",
]


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def build_manifest() -> dict[str, Any]:
    committed = [row for row in PROMOTION_BOUNDARIES if row["recordStatus"] == "committed"]
    anomalies = [row for row in PROMOTION_BOUNDARIES if row["recordStatus"] != "committed"]
    return {
        "task_id": TASK_ID,
        "captured_on": CAPTURED_ON,
        "generated_at": TIMESTAMP,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "promotion_boundary_count": len(PROMOTION_BOUNDARIES),
            "committed_promotion_count": len(committed),
            "blocked_anomaly_count": len(anomalies),
            "replay_case_count": len(REPLAY_CASEBOOK),
            "lookup_index_count": 5,
            "parallel_interface_gap_count": len(PARALLEL_INTERFACE_GAPS),
            "implementation_file_count": len(IMPLEMENTATION_FILES),
        },
        "promotion_boundaries": PROMOTION_BOUNDARIES,
        "replay_case_ids": [row["caseId"] for row in REPLAY_CASEBOOK],
        "parallel_interface_gaps": PARALLEL_INTERFACE_GAPS,
        "implementation_files": IMPLEMENTATION_FILES,
    }


def build_mapping_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for boundary in PROMOTION_BOUNDARIES:
        rows.append(
            {
                "promotion_mapping_id": boundary["promotionMappingId"],
                "envelope_id": boundary["envelopeId"],
                "envelope_state": boundary["envelopeState"],
                "promotion_record_id": boundary["promotionRecordId"],
                "request_id": boundary["requestId"],
                "request_lineage_id": boundary["requestLineageId"],
                "source_lineage_ref": boundary["sourceLineageRef"],
                "receipt_consistency_key": boundary["receiptConsistencyKey"],
                "status_consistency_key": boundary["statusConsistencyKey"],
                "patient_journey_lineage_ref": boundary["patientJourneyLineageRef"],
                "channel_profile": boundary["channelProfile"],
                "replay_class": boundary["replayClass"],
                "record_status": boundary["recordStatus"],
                "anomaly_status": boundary["anomalyStatus"],
                "request_shell_handoff": boundary["requestShellHandoff"],
                "superseded_access_grant_refs": ";".join(boundary["supersededAccessGrantRefs"]),
                "superseded_draft_lease_refs": ";".join(boundary["supersededDraftLeaseRefs"]),
                "notes": boundary["notes"],
            }
        )
    return rows


def build_design_doc(manifest: dict[str, Any]) -> str:
    summary = manifest["summary"]
    return dedent(
        f"""
        # 66 Submission Promotion Boundary Design

        `par_066` turns submit promotion into one explicit, immutable, replay-safe backend boundary. The authoritative bridge is `SubmissionPromotionRecord`; every later continuity lookup resolves from the persisted record rather than from mutable draft state, controller cache, or session callback side effects.

        ## Boundary Summary

        - Promotion boundary rows: {summary["promotion_boundary_count"]}
        - Committed promotion rows: {summary["committed_promotion_count"]}
        - Blocked anomaly rows: {summary["blocked_anomaly_count"]}
        - Replay scenarios: {summary["replay_case_count"]}
        - Lookup indices: envelope, source lineage, request lineage, receipt consistency, status consistency

        ## Exact-Once Homes

        - `packages/domains/identity_access/src/submission-lineage-backbone.ts`
        - `packages/event-contracts/src/submission-lineage-events.ts`
        - `services/command-api/src/submission-backbone.ts`
        - `services/command-api/src/submission-promotion-simulator.ts`
        - `services/command-api/migrations/066_submission_promotion_exactly_once.sql`

        ## Storage and Replay Law

        - `withPromotionBoundary(...)` serializes promotion writes so duplicate submit and cross-tab races re-enter a single compare-and-set window.
        - `saveSubmissionPromotionRecord(...)` now enforces secondary uniqueness by `submissionEnvelopeRef`, `sourceLineageRef`, `requestLineageRef`, `receiptConsistencyKey`, and `statusConsistencyKey`.
        - `applyDraftMutabilitySupersession(...)` closes every seeded live draft grant and draft lease in the same promotion window before handoff to the request shell.
        - `resolveAuthoritativeRequestShell(...)` returns continuity truth from immutable promotion keys instead of reopening the draft lane.

        ## Event and Gap Notes

        - Promotion emits `intake.promotion.started`, `intake.promotion.committed`, `intake.promotion.settled`, `intake.promotion.replay_returned`, and `intake.promotion.superseded_grants_applied`.
        - The event helper seam is live in the shared package now; the registry-side publication gap remains explicit as `PARALLEL_INTERFACE_GAP_066_PROMOTION_EVENT_REGISTRY_ROWS`.

        ## Implementation Files

        {chr(10).join(f"- `{path}`" for path in IMPLEMENTATION_FILES)}
        """
    )


def build_algorithm_doc(casebook: list[dict[str, Any]]) -> str:
    return dedent(
        f"""
        # 66 Exactly Once Promotion Algorithm

        ## Compare-And-Set Boundary

        1. Load the envelope and derive deterministic continuity keys.
        2. Check for an existing `SubmissionPromotionRecord` by envelope, source lineage, receipt key, and status key.
        3. If any lookup hits, require all hits to collapse to the same promotion record and return that authoritative result.
        4. If no lookup hits, freeze evidence snapshot and normalized submission refs, allocate one request lineage and one request, apply draft mutability supersession, then persist the immutable promotion record plus promoted envelope.

        ## Fail-Closed Rules

        - A promoted envelope without `promotionRecordRef` or `promotedRequestRef` is invalid.
        - A promotion row may not reuse a source lineage, receipt key, or status key that already points at another promotion.
        - A promotion cannot leave seeded live draft grants or draft leases open.
        - Support, auth-return, and delayed retry flows must resolve from immutable continuity keys rather than client cache.

        ## Replay Casebook

        {chr(10).join(
            f"- `{case['caseId']}`: `{case['replayClass']}` via `{case['lookupField']}` -> `{case['expectedOutcome']}`"
            for case in casebook
        )}

        ## Bounded Registry Gap

        - `PARALLEL_INTERFACE_GAP_066_PROMOTION_EVENT_REGISTRY_ROWS` keeps the new promotion event family honest until the seq_048 canonical registry absorbs it.
        """
    )


def build_atlas_html() -> str:
    return (
        dedent(
            """
            <!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>66 Promotion Mapping Atlas</title>
                <style>
                  :root {
                    color-scheme: light;
                    --canvas: #f6f8fc;
                    --panel: #ffffff;
                    --rail: #eef2f7;
                    --inset: #f3f6fb;
                    --text-strong: #0f172a;
                    --text-default: #1e293b;
                    --text-muted: #64748b;
                    --border: #e2e8f0;
                    --promotion: #3559e6;
                    --envelope: #0ea5a4;
                    --replay: #7c3aed;
                    --warning: #c98900;
                    --blocked: #c24141;
                    --shadow: 0 20px 44px rgba(15, 23, 42, 0.08);
                    --radius: 22px;
                    --mono: "SFMono-Regular", ui-monospace, monospace;
                  }
                  * { box-sizing: border-box; }
                  body {
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    background: radial-gradient(circle at top left, rgba(53, 89, 230, 0.08), transparent 28%),
                      linear-gradient(180deg, #f8faff 0%, var(--canvas) 100%);
                    color: var(--text-default);
                  }
                  body[data-reduced-motion="true"] * {
                    animation-duration: 0.01ms !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                  }
                  .shell {
                    max-width: 1520px;
                    margin: 0 auto;
                    padding: 0 24px 32px;
                  }
                  header {
                    position: sticky;
                    top: 0;
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 72px;
                    padding: 16px 0;
                    background: rgba(246, 248, 252, 0.92);
                    backdrop-filter: blur(18px);
                  }
                  .brand {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                  }
                  .brand svg {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, var(--promotion), #5f7ff0);
                    box-shadow: 0 12px 28px rgba(53, 89, 230, 0.26);
                  }
                  .brand h1 {
                    margin: 0;
                    font-size: 1.05rem;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                  }
                  .metrics {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(120px, 1fr));
                    gap: 12px;
                  }
                  .metric {
                    background: var(--panel);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 10px 14px;
                    box-shadow: var(--shadow);
                  }
                  .metric strong {
                    display: block;
                    font-size: 1.2rem;
                    color: var(--text-strong);
                  }
                  .layout {
                    display: grid;
                    grid-template-columns: 312px minmax(0, 1fr) 400px;
                    gap: 20px;
                    align-items: start;
                  }
                  .panel {
                    background: var(--panel);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    box-shadow: var(--shadow);
                  }
                  .rail,
                  .inspector {
                    position: sticky;
                    top: 96px;
                    padding: 18px;
                  }
                  .rail {
                    background: var(--rail);
                  }
                  .controls {
                    display: grid;
                    gap: 12px;
                  }
                  label {
                    display: grid;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                  }
                  select,
                  button.card,
                  button.table-row {
                    min-height: 44px;
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    font: inherit;
                  }
                  select {
                    background: var(--panel);
                    padding: 0 12px;
                    color: var(--text-default);
                  }
                  .card-list {
                    display: grid;
                    gap: 12px;
                    margin-top: 18px;
                  }
                  button.card,
                  button.table-row {
                    width: 100%;
                    text-align: left;
                    background: var(--panel);
                    padding: 14px 16px;
                    cursor: pointer;
                    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
                  }
                  button.card:hover,
                  button.card:focus-visible,
                  button.table-row:hover,
                  button.table-row:focus-visible {
                    transform: translateY(-2px);
                    border-color: var(--promotion);
                    box-shadow: 0 12px 26px rgba(53, 89, 230, 0.14);
                    outline: none;
                  }
                  button.card[data-selected="true"],
                  button.table-row[data-selected="true"] {
                    border-color: var(--promotion);
                    box-shadow: inset 0 0 0 1px rgba(53, 89, 230, 0.16), 0 14px 28px rgba(53, 89, 230, 0.16);
                  }
                  .canvas {
                    display: grid;
                    gap: 20px;
                  }
                  .bridge {
                    min-height: 260px;
                    padding: 20px;
                  }
                  .bridge-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 12px;
                    align-items: center;
                  }
                  .bridge-node {
                    background: var(--inset);
                    border: 1px solid var(--border);
                    border-radius: 18px;
                    padding: 18px;
                    min-height: 132px;
                    position: relative;
                  }
                  .bridge-node::after {
                    content: "→";
                    position: absolute;
                    top: 50%;
                    right: -18px;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                    font-size: 1.2rem;
                  }
                  .bridge-node:last-child::after { display: none; }
                  .bridge-node h3,
                  .inspector h2,
                  .matrix h2,
                  .rail h2 {
                    margin: 0 0 10px;
                    font-size: 0.92rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                  }
                  .bridge-node strong,
                  .ribbon-token strong,
                  .inspector strong {
                    display: block;
                    color: var(--text-strong);
                  }
                  .mono {
                    font-family: var(--mono);
                    word-break: break-all;
                  }
                  .parity-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 10px;
                    margin-top: 16px;
                  }
                  .parity-cell {
                    padding: 12px;
                    border-radius: 14px;
                    background: var(--inset);
                    border: 1px solid var(--border);
                    font-size: 0.9rem;
                  }
                  .ribbon {
                    padding: 18px 20px;
                  }
                  .ribbon-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 12px;
                  }
                  .ribbon-token {
                    padding: 14px;
                    border-radius: 16px;
                    background: linear-gradient(180deg, rgba(53, 89, 230, 0.06), rgba(124, 58, 237, 0.04));
                    border: 1px solid var(--border);
                  }
                  .matrix {
                    padding: 18px 20px;
                  }
                  .matrix-shell {
                    display: grid;
                    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
                    gap: 18px;
                  }
                  .table-shell {
                    background: var(--inset);
                    border-radius: 18px;
                    border: 1px solid var(--border);
                    padding: 14px;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.92rem;
                  }
                  th, td {
                    padding: 10px 8px;
                    border-bottom: 1px solid var(--border);
                    text-align: left;
                    vertical-align: top;
                  }
                  th {
                    font-size: 0.78rem;
                    letter-spacing: 0.07em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                  }
                  .chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.78rem;
                    background: rgba(53, 89, 230, 0.08);
                    color: var(--promotion);
                  }
                  .chip.blocked {
                    background: rgba(194, 65, 65, 0.12);
                    color: var(--blocked);
                  }
                  .chip.warning {
                    background: rgba(201, 137, 0, 0.12);
                    color: var(--warning);
                  }
                  ul.compact {
                    margin: 8px 0 0;
                    padding-left: 18px;
                  }
                  @media (max-width: 1200px) {
                    .layout {
                      grid-template-columns: 1fr;
                    }
                    .rail, .inspector {
                      position: static;
                    }
                    .matrix-shell {
                      grid-template-columns: 1fr;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="shell">
                  <header aria-label="Promotion atlas masthead">
                    <div class="brand">
                      <svg viewBox="0 0 40 40" aria-hidden="true">
                        <path d="M10 28V12h6.2l4.1 7.1L24.4 12H30v16h-4.4V19l-4.7 7.5h-1.2L15 19v9H10z" fill="#fff" />
                      </svg>
                      <div>
                        <div style="font-size:0.78rem;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Vecells</div>
                        <h1>Promotion Mapping Atlas</h1>
                      </div>
                    </div>
                    <div class="metrics" aria-label="Promotion metrics">
                      <div class="metric">
                        <span style="color:#64748b;font-size:0.8rem;">Promotions</span>
                        <strong data-testid="metric-promotion-total">0</strong>
                      </div>
                      <div class="metric">
                        <span style="color:#64748b;font-size:0.8rem;">Replay Returns</span>
                        <strong data-testid="metric-replay-total">0</strong>
                      </div>
                      <div class="metric">
                        <span style="color:#64748b;font-size:0.8rem;">Blocked Anomalies</span>
                        <strong data-testid="metric-anomaly-total">0</strong>
                      </div>
                    </div>
                  </header>

                  <main class="layout">
                    <aside class="panel rail" aria-label="Promotion filters">
                      <h2>Filters</h2>
                      <div class="controls">
                        <label>Envelope State
                          <select data-testid="state-filter" id="state-filter"></select>
                        </label>
                        <label>Replay Class
                          <select data-testid="replay-filter" id="replay-filter"></select>
                        </label>
                        <label>Channel Profile
                          <select data-testid="channel-filter" id="channel-filter"></select>
                        </label>
                      </div>
                      <div class="card-list" data-testid="promotion-card-list"></div>
                    </aside>

                    <section class="canvas">
                      <section class="panel bridge" data-testid="bridge-diagram" aria-labelledby="bridge-title">
                        <h2 id="bridge-title">Envelope To Request Bridge</h2>
                        <div class="bridge-grid" id="bridge-grid"></div>
                        <div class="parity-grid" data-testid="bridge-parity-table" id="bridge-parity"></div>
                      </section>

                      <section class="panel ribbon" data-testid="continuity-ribbon" aria-labelledby="continuity-title">
                        <h2 id="continuity-title">Continuity Key Ribbon</h2>
                        <div class="ribbon-grid" id="continuity-grid"></div>
                      </section>

                      <section class="panel matrix" aria-labelledby="matrix-title">
                        <h2 id="matrix-title">Mapping And Replay Tables</h2>
                        <div class="matrix-shell">
                          <div class="table-shell">
                            <table data-testid="mapping-table" id="mapping-table">
                              <thead>
                                <tr>
                                  <th>Envelope</th>
                                  <th>Promotion</th>
                                  <th>Request</th>
                                  <th>Replay</th>
                                </tr>
                              </thead>
                              <tbody id="mapping-body"></tbody>
                            </table>
                          </div>
                          <div class="table-shell">
                            <table data-testid="replay-case-table" id="replay-case-table">
                              <thead>
                                <tr>
                                  <th>Replay Case</th>
                                  <th>Lookup</th>
                                  <th>Outcome</th>
                                </tr>
                              </thead>
                              <tbody id="replay-body"></tbody>
                            </table>
                          </div>
                        </div>
                      </section>
                    </section>

                    <aside class="panel inspector" data-testid="inspector" aria-live="polite"></aside>
                  </main>
                </div>

                <script>
                  const MANIFEST_URL = "__MANIFEST_REL__";
                  const CASEBOOK_URL = "__CASEBOOK_REL__";
                  const MATRIX_URL = "__MATRIX_REL__";

                  const state = {
                    manifest: null,
                    mappingRows: [],
                    replayCases: [],
                    filters: { envelopeState: "all", replayClass: "all", channelProfile: "all" },
                    selectedMappingId: null,
                    selectedReplayCaseId: null,
                  };

                  function parseCsv(text) {
                    const rows = [];
                    let field = "";
                    let row = [];
                    let inQuotes = false;
                    for (let index = 0; index < text.length; index += 1) {
                      const character = text[index];
                      const nextCharacter = text[index + 1];
                      if (character === '"') {
                        if (inQuotes && nextCharacter === '"') {
                          field += '"';
                          index += 1;
                        } else {
                          inQuotes = !inQuotes;
                        }
                        continue;
                      }
                      if (character === "," && !inQuotes) {
                        row.push(field);
                        field = "";
                        continue;
                      }
                      if ((character === "\\n" || character === "\\r") && !inQuotes) {
                        if (character === "\\r" && nextCharacter === "\\n") {
                          index += 1;
                        }
                        if (field.length > 0 || row.length > 0) {
                          row.push(field);
                          rows.push(row);
                          row = [];
                          field = "";
                        }
                        continue;
                      }
                      field += character;
                    }
                    if (field.length > 0 || row.length > 0) {
                      row.push(field);
                      rows.push(row);
                    }
                    const [header, ...body] = rows;
                    return body.map((values) =>
                      Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""])),
                    );
                  }

                  function uniqueOptions(values) {
                    return ["all", ...Array.from(new Set(values)).sort()];
                  }

                  function applyFilters() {
                    return state.manifest.promotion_boundaries.filter((row) => {
                      if (
                        state.filters.envelopeState !== "all" &&
                        row.envelopeState !== state.filters.envelopeState
                      ) {
                        return false;
                      }
                      if (
                        state.filters.replayClass !== "all" &&
                        row.replayClass !== state.filters.replayClass
                      ) {
                        return false;
                      }
                      if (
                        state.filters.channelProfile !== "all" &&
                        row.channelProfile !== state.filters.channelProfile
                      ) {
                        return false;
                      }
                      return true;
                    });
                  }

                  function selectedBoundary(filteredRows) {
                    const match = filteredRows.find(
                      (row) => row.promotionMappingId === state.selectedMappingId,
                    );
                    if (match) {
                      return match;
                    }
                    state.selectedMappingId = filteredRows[0]?.promotionMappingId ?? null;
                    return filteredRows[0] ?? null;
                  }

                  function renderControls() {
                    const stateFilter = document.getElementById("state-filter");
                    const replayFilter = document.getElementById("replay-filter");
                    const channelFilter = document.getElementById("channel-filter");

                    const stateOptions = uniqueOptions(
                      state.manifest.promotion_boundaries.map((row) => row.envelopeState),
                    );
                    const replayOptions = uniqueOptions(
                      state.manifest.promotion_boundaries.map((row) => row.replayClass),
                    );
                    const channelOptions = uniqueOptions(
                      state.manifest.promotion_boundaries.map((row) => row.channelProfile),
                    );

                    const fill = (element, options, current) => {
                      element.innerHTML = options
                        .map((value) => {
                          const label = value === "all" ? "All" : value;
                          const selected = value === current ? " selected" : "";
                          return `<option value="${value}"${selected}>${label}</option>`;
                        })
                        .join("");
                    };

                    fill(stateFilter, stateOptions, state.filters.envelopeState);
                    fill(replayFilter, replayOptions, state.filters.replayClass);
                    fill(channelFilter, channelOptions, state.filters.channelProfile);

                    stateFilter.onchange = (event) => {
                      state.filters.envelopeState = event.target.value;
                      render();
                    };
                    replayFilter.onchange = (event) => {
                      state.filters.replayClass = event.target.value;
                      render();
                    };
                    channelFilter.onchange = (event) => {
                      state.filters.channelProfile = event.target.value;
                      render();
                    };
                  }

                  function renderMetrics() {
                    document.querySelector("[data-testid='metric-promotion-total']").textContent =
                      String(
                        state.manifest.promotion_boundaries.filter((row) => row.recordStatus === "committed")
                          .length,
                      );
                    document.querySelector("[data-testid='metric-replay-total']").textContent =
                      String(state.replayCases.length);
                    document.querySelector("[data-testid='metric-anomaly-total']").textContent =
                      String(
                        state.manifest.promotion_boundaries.filter((row) => row.recordStatus !== "committed")
                          .length,
                      );
                  }

                  function renderCards(filteredRows) {
                    const container = document.querySelector("[data-testid='promotion-card-list']");
                    container.innerHTML = "";
                    filteredRows.forEach((row, index) => {
                      const button = document.createElement("button");
                      button.className = "card";
                      button.type = "button";
                      button.dataset.testid = `promotion-card-${row.promotionMappingId}`;
                      button.dataset.selected = String(row.promotionMappingId === state.selectedMappingId);
                      button.dataset.mappingId = row.promotionMappingId;
                      button.innerHTML = `
                        <strong>${row.promotionMappingId}</strong>
                        <div style="margin-top:6px;color:#64748b;">${row.envelopeState} · ${row.channelProfile}</div>
                        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                          <span class="chip ${row.recordStatus === "blocked" ? "blocked" : ""}">${row.recordStatus}</span>
                          <span class="chip ${row.anomalyStatus !== "clear" ? "warning" : ""}">${row.replayClass}</span>
                        </div>
                      `;
                      button.setAttribute("data-testid", `promotion-card-${row.promotionMappingId}`);
                      button.addEventListener("click", () => {
                        state.selectedMappingId = row.promotionMappingId;
                        render();
                      });
                      button.addEventListener("keydown", (event) => {
                        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                          return;
                        }
                        event.preventDefault();
                        const nextIndex =
                          event.key === "ArrowDown"
                            ? Math.min(index + 1, filteredRows.length - 1)
                            : Math.max(index - 1, 0);
                        state.selectedMappingId = filteredRows[nextIndex].promotionMappingId;
                        render();
                        requestAnimationFrame(() => {
                          document
                            .querySelector(
                              `[data-testid="promotion-card-${filteredRows[nextIndex].promotionMappingId}"]`,
                            )
                            ?.focus();
                        });
                      });
                      container.appendChild(button);
                    });
                  }

                  function renderBridge(boundary) {
                    const bridgeGrid = document.getElementById("bridge-grid");
                    const bridgeParity = document.getElementById("bridge-parity");
                    const nodes = [
                      ["Envelope", boundary.envelopeId, boundary.envelopeState, "envelope"],
                      ["Promotion", boundary.promotionRecordId || "blocked", boundary.recordStatus, "promotion"],
                      ["Request Lineage", boundary.requestLineageId || "not minted", boundary.replayClass, "replay"],
                      ["Request", boundary.requestId || "not minted", boundary.requestShellHandoff, "request"],
                    ];
                    bridgeGrid.innerHTML = nodes
                      .map(
                        ([label, value, note, accent], index) => `
                          <div class="bridge-node" data-testid="bridge-node-${index}">
                            <h3>${label}</h3>
                            <strong class="mono">${value}</strong>
                            <div style="margin-top:10px;color:#64748b;">${note}</div>
                            <div style="margin-top:12px;color:${accent === "promotion" ? "var(--promotion)" : accent === "replay" ? "var(--replay)" : accent === "envelope" ? "var(--envelope)" : "var(--text-default)"};font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em;">${accent}</div>
                          </div>
                        `,
                      )
                      .join("");
                    bridgeParity.innerHTML = nodes
                      .map(
                        ([label, value, note], index) => `
                          <div class="parity-cell" data-testid="bridge-parity-row-${index}">
                            <strong>${label}</strong>
                            <div class="mono" style="margin-top:6px;">${value}</div>
                            <div style="margin-top:6px;color:#64748b;">${note}</div>
                          </div>
                        `,
                      )
                      .join("");
                  }

                  function renderContinuity(boundary) {
                    const container = document.getElementById("continuity-grid");
                    const tokens = [
                      ["sourceLineageRef", boundary.sourceLineageRef],
                      ["receiptConsistencyKey", boundary.receiptConsistencyKey],
                      ["statusConsistencyKey", boundary.statusConsistencyKey],
                      ["patientJourneyLineageRef", boundary.patientJourneyLineageRef || "blocked"],
                    ];
                    container.innerHTML = tokens
                      .map(
                        ([label, value]) => `
                          <div class="ribbon-token" data-testid="continuity-token-${label}">
                            <span style="font-size:0.76rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">${label}</span>
                            <strong class="mono" style="margin-top:8px;">${value}</strong>
                          </div>
                        `,
                      )
                      .join("");
                  }

                  function renderInspector(boundary, linkedCases) {
                    const inspector = document.querySelector("[data-testid='inspector']");
                    inspector.innerHTML = `
                      <h2>Selected Promotion Boundary</h2>
                      <strong>${boundary.promotionMappingId}</strong>
                      <div style="margin-top:14px;display:grid;gap:10px;">
                        <div><span style="color:#64748b;">Envelope</span><div class="mono">${boundary.envelopeId}</div></div>
                        <div><span style="color:#64748b;">Promotion Record</span><div class="mono">${boundary.promotionRecordId || "blocked"}</div></div>
                        <div><span style="color:#64748b;">Request</span><div class="mono">${boundary.requestId || "not minted"}</div></div>
                        <div><span style="color:#64748b;">Request Shell Handoff</span><div>${boundary.requestShellHandoff}</div></div>
                        <div><span style="color:#64748b;">Superseded Access Grants</span><div class="mono">${boundary.supersededAccessGrantRefs.join(", ") || "none"}</div></div>
                        <div><span style="color:#64748b;">Superseded Draft Leases</span><div class="mono">${boundary.supersededDraftLeaseRefs.join(", ") || "none"}</div></div>
                      </div>
                      <h2 style="margin-top:18px;">Linked Replay Cases</h2>
                      <ul class="compact">
                        ${linkedCases.map((caseRow) => `<li><strong>${caseRow.caseId}</strong> · ${caseRow.expectedOutcome}</li>`).join("")}
                      </ul>
                    `;
                  }

                  function renderTables(filteredRows, selected) {
                    const mappingBody = document.getElementById("mapping-body");
                    const replayBody = document.getElementById("replay-body");
                    const selectedCases = state.replayCases.filter(
                      (caseRow) => caseRow.promotionMappingId === selected.promotionMappingId,
                    );

                    mappingBody.innerHTML = "";
                    filteredRows.forEach((row, index) => {
                      const tableRow = document.createElement("tr");
                      const cell = document.createElement("td");
                      cell.colSpan = 4;
                      const button = document.createElement("button");
                      button.className = "table-row";
                      button.type = "button";
                      button.dataset.testid = `mapping-row-${row.promotionMappingId}`;
                      button.dataset.selected = String(row.promotionMappingId === selected.promotionMappingId);
                      button.innerHTML = `
                        <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 0.9fr;gap:10px;">
                          <span class="mono">${row.envelopeId}</span>
                          <span class="mono">${row.promotionRecordId || "blocked"}</span>
                          <span class="mono">${row.requestId || "not minted"}</span>
                          <span>${row.replayClass}</span>
                        </div>
                      `;
                      button.setAttribute("data-testid", `mapping-row-${row.promotionMappingId}`);
                      button.addEventListener("click", () => {
                        state.selectedMappingId = row.promotionMappingId;
                        render();
                      });
                      button.addEventListener("keydown", (event) => {
                        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                          return;
                        }
                        event.preventDefault();
                        const nextIndex =
                          event.key === "ArrowDown"
                            ? Math.min(index + 1, filteredRows.length - 1)
                            : Math.max(index - 1, 0);
                        state.selectedMappingId = filteredRows[nextIndex].promotionMappingId;
                        render();
                        requestAnimationFrame(() => {
                          document
                            .querySelector(
                              `[data-testid="mapping-row-${filteredRows[nextIndex].promotionMappingId}"]`,
                            )
                            ?.focus();
                        });
                      });
                      cell.appendChild(button);
                      tableRow.appendChild(cell);
                      mappingBody.appendChild(tableRow);
                    });

                    replayBody.innerHTML = "";
                    selectedCases.forEach((caseRow) => {
                      const row = document.createElement("tr");
                      row.setAttribute("data-testid", `replay-row-${caseRow.caseId}`);
                      row.dataset.linked = "true";
                      row.innerHTML = `
                        <td>${caseRow.caseId}</td>
                        <td>${caseRow.lookupField}</td>
                        <td>${caseRow.expectedOutcome}</td>
                      `;
                      replayBody.appendChild(row);
                    });
                  }

                  function render() {
                    renderMetrics();
                    renderControls();
                    const filteredRows = applyFilters();
                    renderCards(filteredRows);
                    const selected = selectedBoundary(filteredRows);
                    if (!selected) {
                      document.getElementById("bridge-grid").innerHTML = "";
                      document.getElementById("bridge-parity").innerHTML = "";
                      document.getElementById("continuity-grid").innerHTML = "";
                      document.querySelector("[data-testid='inspector']").innerHTML = "<h2>No promotion boundary matches the current filters.</h2>";
                      document.getElementById("mapping-body").innerHTML = "";
                      document.getElementById("replay-body").innerHTML = "";
                      return;
                    }
                    const linkedCases = state.replayCases.filter(
                      (caseRow) => caseRow.promotionMappingId === selected.promotionMappingId,
                    );
                    renderBridge(selected);
                    renderContinuity(selected);
                    renderInspector(selected, linkedCases);
                    renderTables(filteredRows, selected);
                  }

                  async function boot() {
                    const [manifestResponse, casebookResponse, matrixResponse] = await Promise.all([
                      fetch(MANIFEST_URL),
                      fetch(CASEBOOK_URL),
                      fetch(MATRIX_URL),
                    ]);
                    state.manifest = await manifestResponse.json();
                    state.replayCases = (await casebookResponse.json()).replayCases;
                    state.mappingRows = parseCsv(await matrixResponse.text());
                    state.selectedMappingId = state.manifest.promotion_boundaries[0].promotionMappingId;
                    state.selectedReplayCaseId = state.replayCases[0].caseId;
                    document.body.dataset.reducedMotion = String(
                      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                    );
                    render();
                  }

                  boot();
                </script>
              </body>
            </html>
            """
        )
        .replace("__MANIFEST_REL__", "../../data/analysis/submission_promotion_record_manifest.json")
        .replace("__CASEBOOK_REL__", "../../data/analysis/promotion_replay_casebook.json")
        .replace("__MATRIX_REL__", "../../data/analysis/envelope_to_request_mapping_matrix.csv")
    )


def build_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(
          ROOT,
          "docs",
          "architecture",
          "66_promotion_mapping_atlas.html",
        );
        const MANIFEST_PATH = path.join(
          ROOT,
          "data",
          "analysis",
          "submission_promotion_record_manifest.json",
        );
        const CASEBOOK_PATH = path.join(
          ROOT,
          "data",
          "analysis",
          "promotion_replay_casebook.json",
        );

        const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
        const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }
        }

        function startStaticServer() {
          return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/66_promotion_mapping_atlas.html"
                  : rawUrl.split("?")[0];
              const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
              const filePath = path.join(ROOT, safePath);
              if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end("Not found");
                return;
              }
              const body = fs.readFileSync(filePath);
              const contentType = filePath.endsWith(".html")
                ? "text/html; charset=utf-8"
                : filePath.endsWith(".json")
                  ? "application/json; charset=utf-8"
                  : filePath.endsWith(".csv")
                    ? "text/csv; charset=utf-8"
                    : "text/plain; charset=utf-8";
              res.writeHead(200, { "Content-Type": contentType });
              res.end(body);
            });
            server.once("error", reject);
            server.listen(4366, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing atlas HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1480, height: 1100 } });
          const url =
            process.env.SUBMISSION_PROMOTION_ATLAS_URL ??
            "http://127.0.0.1:4366/docs/architecture/66_promotion_mapping_atlas.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='bridge-diagram']").waitFor();
            await page.locator("[data-testid='continuity-ribbon']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialCards = await page.locator("button[data-testid^='promotion-card-']").count();
            assertCondition(
              initialCards === MANIFEST.summary.promotion_boundary_count,
              `Expected ${MANIFEST.summary.promotion_boundary_count} cards, found ${initialCards}.`,
            );

            const promotionMetric = await page
              .locator("[data-testid='metric-promotion-total']")
              .textContent();
            assertCondition(
              promotionMetric === String(MANIFEST.summary.committed_promotion_count),
              "Promotion total metric drifted.",
            );

            await page.locator("[data-testid='state-filter']").selectOption("promoted");
            const promotedCards = await page.locator("button[data-testid^='promotion-card-']").count();
            assertCondition(promotedCards === 5, `Expected 5 promoted cards, found ${promotedCards}.`);

            await page.locator("[data-testid='state-filter']").selectOption("all");
            await page.locator("[data-testid='replay-filter']").selectOption("support_resume_replay");
            const supportReplayCards = await page.locator("button[data-testid^='promotion-card-']").count();
            assertCondition(
              supportReplayCards === 1,
              `Expected 1 support replay card, found ${supportReplayCards}.`,
            );

            await page.locator("[data-testid='replay-filter']").selectOption("all");
            await page.locator("[data-testid='channel-filter']").selectOption("support_console");
            const supportChannelCards = await page.locator("button[data-testid^='promotion-card-']").count();
            assertCondition(
              supportChannelCards === 1,
              `Expected 1 support console card, found ${supportChannelCards}.`,
            );

            await page.locator("[data-testid='promotion-card-PM_066_SUPPORT_RESUME_V1']").click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("request_shell_redirect") &&
                inspectorText.includes("promotion_066_support_resume_v1"),
              "Inspector lost the support resume selection.",
            );

            const replayRows = await page.locator("[data-testid^='replay-row-']").count();
            assertCondition(replayRows === 1, `Expected 1 linked replay row, found ${replayRows}.`);
            const replayLinked = await page
              .locator("[data-testid='replay-row-CASE_066_SUPPORT_RESUME']")
              .getAttribute("data-linked");
            assertCondition(replayLinked === "true", "Replay row no longer links to the selected card.");

            await page.locator("[data-testid='channel-filter']").selectOption("all");
            await page.locator("[data-testid='promotion-card-PM_066_BROWSER_PRIMARY_V1']").focus();
            await page.keyboard.press("ArrowDown");
            const selectedCard = await page
              .locator("[data-testid='promotion-card-PM_066_BROWSER_CROSSTAB_V1']")
              .getAttribute("data-selected");
            assertCondition(selectedCard === "true", "ArrowDown did not advance card selection.");

            const bridgeNodes = await page.locator("[data-testid^='bridge-node-']").count();
            const parityNodes = await page.locator("[data-testid^='bridge-parity-row-']").count();
            assertCondition(bridgeNodes === 4, `Expected 4 bridge nodes, found ${bridgeNodes}.`);
            assertCondition(bridgeNodes === parityNodes, "Bridge parity row count drifted.");

            await page.locator("[data-testid='mapping-row-PM_066_BROWSER_CROSSTAB_V1']").focus();
            await page.keyboard.press("ArrowDown");
            const nextRowSelected = await page
              .locator("[data-testid='mapping-row-PM_066_AUTH_RETURN_V1']")
              .getAttribute("data-selected");
            assertCondition(nextRowSelected === "true", "ArrowDown did not advance mapping row selection.");

            await page.setViewportSize({ width: 390, height: 844 });
            const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

            const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
            try {
              await motionPage.emulateMedia({ reducedMotion: "reduce" });
              await motionPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await motionPage.close();
            }

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 7, `Expected multiple landmarks, found ${landmarks}.`);
          } finally {
            await browser.close();
            await new Promise((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            );
          }
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const submissionPromotionAtlasManifest = {
          task: MANIFEST.task_id,
          promotionBoundaries: MANIFEST.summary.promotion_boundary_count,
          replayCases: CASEBOOK.summary.replay_case_count,
          coverage: [
            "envelope state filtering",
            "replay filtering",
            "channel filtering",
            "promotion card selection",
            "bridge and table parity",
            "keyboard navigation",
            "responsive layout",
            "reduced motion",
          ],
        };
        """
    )


def main() -> None:
    manifest = build_manifest()
    mapping_rows = build_mapping_rows()
    casebook = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "summary": {
            "replay_case_count": len(REPLAY_CASEBOOK),
            "committed_promotion_refs": [
                row["promotionMappingId"]
                for row in PROMOTION_BOUNDARIES
                if row["recordStatus"] == "committed"
            ],
        },
        "replayCases": REPLAY_CASEBOOK,
    }

    write_json(MANIFEST_PATH, manifest)
    write_csv(
        MAPPING_MATRIX_PATH,
        mapping_rows,
        [
            "promotion_mapping_id",
            "envelope_id",
            "envelope_state",
            "promotion_record_id",
            "request_id",
            "request_lineage_id",
            "source_lineage_ref",
            "receipt_consistency_key",
            "status_consistency_key",
            "patient_journey_lineage_ref",
            "channel_profile",
            "replay_class",
            "record_status",
            "anomaly_status",
            "request_shell_handoff",
            "superseded_access_grant_refs",
            "superseded_draft_lease_refs",
            "notes",
        ],
    )
    write_json(CASEBOOK_PATH, casebook)
    write_text(DESIGN_DOC_PATH, build_design_doc(manifest))
    write_text(ALGORITHM_DOC_PATH, build_algorithm_doc(REPLAY_CASEBOOK))
    write_text(ATLAS_PATH, build_atlas_html())
    write_text(SPEC_PATH, build_spec())


if __name__ == "__main__":
    main()
