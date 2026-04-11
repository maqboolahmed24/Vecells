#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-evidence-gate-lab"
TRANSCRIPTION_SERVICE_DIR = ROOT / "services" / "mock-transcription-engine"
SCAN_SERVICE_DIR = ROOT / "services" / "mock-artifact-scan-gateway"
TESTS_DIR = ROOT / "tests" / "playwright"
BROWSER_AUTOMATION_DIR = ROOT / "tools" / "browser-automation"

REQUIRED_INPUTS = {
    "vendor_shortlist": DATA_DIR / "34_vendor_shortlist.json",
    "external_account_inventory": DATA_DIR / "external_account_inventory.csv",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
}

DELIVERABLES = [
    DATA_DIR / "35_evidence_processing_lab_pack.json",
    DATA_DIR / "35_evidence_processing_field_map.json",
    DATA_DIR / "35_transcript_job_profiles.csv",
    DATA_DIR / "35_scan_and_quarantine_policy_matrix.csv",
    DATA_DIR / "35_evidence_processing_live_gate_checklist.json",
    DOCS_DIR / "35_local_evidence_processing_lab_spec.md",
    DOCS_DIR / "35_transcription_and_scanning_project_field_map.md",
    DOCS_DIR / "35_webhook_retention_and_region_strategy.md",
    DOCS_DIR / "35_live_gate_and_spend_controls.md",
    APP_DIR / "README.md",
    APP_DIR / "package.json",
    APP_DIR / "tsconfig.json",
    APP_DIR / "vite.config.ts",
    APP_DIR / "index.html",
    APP_DIR / "src" / "App.tsx",
    APP_DIR / "src" / "main.tsx",
    APP_DIR / "src" / "styles.css",
    APP_DIR / "src" / "generated" / "evidenceGateLabPack.ts",
    APP_DIR / "public" / "evidence-gate-lab-pack.json",
    TRANSCRIPTION_SERVICE_DIR / "README.md",
    TRANSCRIPTION_SERVICE_DIR / "package.json",
    TRANSCRIPTION_SERVICE_DIR / "src" / "transcriptionCore.js",
    TRANSCRIPTION_SERVICE_DIR / "src" / "server.js",
    SCAN_SERVICE_DIR / "README.md",
    SCAN_SERVICE_DIR / "package.json",
    SCAN_SERVICE_DIR / "src" / "scanCore.js",
    SCAN_SERVICE_DIR / "src" / "server.js",
    TESTS_DIR / "mock-evidence-gate-lab.spec.js",
    TESTS_DIR / "mock-transcript-and-scan-states.spec.js",
    BROWSER_AUTOMATION_DIR / "evidence-processing-project-dry-run.spec.js",
    ROOT / "tools" / "analysis" / "build_evidence_processing_lab_pack.py",
]

EXPECTED_GUIDANCE_IDS = {
    "assemblyai_webhooks",
    "assemblyai_region_selection",
    "assemblyai_delete_transcript",
    "assemblyai_pricing",
    "deepgram_managing_projects",
    "deepgram_api_keys",
    "deepgram_callbacks",
    "deepgram_deployment_options",
    "deepgram_pricing",
    "guardduty_enable_plan",
    "guardduty_how_it_works",
    "guardduty_eventbridge",
    "guardduty_results",
    "guardduty_pricing",
    "opswat_public_apis",
    "opswat_private_processing",
    "opswat_webhooks",
    "opswat_locations",
    "opswat_usage_limits",
}

EXPECTED_VENDOR_IDS = {
    "assemblyai_transcription",
    "deepgram_transcription",
    "aws_guardduty_s3_scan",
    "opswat_metadefender_cloud",
}

EXPECTED_LIVE_GATES = {
    "LIVE_GATE_EVIDENCE_PHASE0_EXTERNAL_READY",
    "LIVE_GATE_EVIDENCE_SHORTLIST_APPROVED",
    "LIVE_GATE_EVIDENCE_REGION_POLICY_EXPLICIT",
    "LIVE_GATE_EVIDENCE_RETENTION_POLICY_EXPLICIT",
    "LIVE_GATE_EVIDENCE_WEBHOOK_SECURITY_READY",
    "LIVE_GATE_EVIDENCE_STORAGE_SCOPE_DEFINED",
    "LIVE_GATE_EVIDENCE_QUARANTINE_POLICY_FROZEN",
    "LIVE_GATE_EVIDENCE_NAMED_APPROVER_AND_ENV",
    "LIVE_GATE_EVIDENCE_MUTATION_FLAG",
    "LIVE_GATE_EVIDENCE_SPEND_FLAG",
    "LIVE_GATE_EVIDENCE_FINAL_OPERATOR_ACK",
}

EXPECTED_ENV_VARS = {
    "EVIDENCE_PROVIDER_VENDOR_ID",
    "EVIDENCE_PROJECT_SCOPE",
    "EVIDENCE_TARGET_ENVIRONMENT",
    "EVIDENCE_REGION_POLICY_REF",
    "EVIDENCE_RETENTION_POLICY_REF",
    "EVIDENCE_WEBHOOK_BASE_URL",
    "EVIDENCE_WEBHOOK_SECRET_REF",
    "EVIDENCE_STORAGE_BUCKET_REF",
    "EVIDENCE_SCAN_POLICY_REF",
    "EVIDENCE_NAMED_APPROVER",
    "ALLOW_REAL_PROVIDER_MUTATION",
    "ALLOW_SPEND",
}

DOC_MARKERS = [
    "Section A — `Mock_now_execution`",
    "Section B — `Actual_provider_strategy_later`",
]

APP_MARKERS = [
    'data-testid="evidence-gate-lab-shell"',
    'data-testid="job-rail"',
    'data-testid="workspace"',
    'data-testid="event-inspector"',
    'data-testid="policy-drawer"',
    'data-testid="mode-toggle-actual"',
    'data-testid="actual-submit-button"',
    "Evidence Gate Lab",
    "Real project mutation blocked",
]

TRANSCRIPTION_MARKERS = [
    'data-testid="transcription-sandbox-shell"',
    'data-testid="simulate-button"',
    'data-testid="job-json"',
    "MOCK_TRANSCRIPTION_ENGINE",
    "/api/jobs/simulate",
    "retry-webhook",
]

SCAN_MARKERS = [
    'data-testid="scan-sandbox-shell"',
    'data-testid="simulate-button"',
    'data-testid="scan-json"',
    "MOCK_ARTIFACT_SCAN_GATEWAY",
    "/api/scans/simulate",
    "retry-webhook",
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_inputs() -> None:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_035 prerequisites: " + ", ".join(sorted(missing)))
    phase0 = load_json(REQUIRED_INPUTS["phase0_gate_verdict"])
    assert_true(
        phase0["summary"]["phase0_entry_verdict"] == "withheld",
        "seq_035 expects Phase 0 to remain withheld.",
    )


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_035 deliverables:\n" + "\n".join(missing))


def main() -> None:
    ensure_inputs()
    ensure_deliverables()

    pack = load_json(DATA_DIR / "35_evidence_processing_lab_pack.json")
    field_map = load_json(DATA_DIR / "35_evidence_processing_field_map.json")
    job_rows = load_csv(DATA_DIR / "35_transcript_job_profiles.csv")
    scan_policy_rows = load_csv(DATA_DIR / "35_scan_and_quarantine_policy_matrix.csv")
    live_gate_pack = load_json(DATA_DIR / "35_evidence_processing_live_gate_checklist.json")

    assert_true(pack["task_id"] == "seq_035", "Task id drifted.")
    assert_true(pack["visual_mode"] == "Evidence_Gate_Lab", "Visual mode drifted.")
    assert_true(pack["phase0_verdict"] == "withheld", "Phase 0 verdict drifted.")

    assert_true(pack["summary"]["field_count"] == 49, "Field count drifted.")
    assert_true(pack["summary"]["job_profile_count"] == 10, "Job profile count drifted.")
    assert_true(pack["summary"]["scan_policy_count"] == 12, "Scan policy count drifted.")
    assert_true(pack["summary"]["live_gate_count"] == 11, "Live gate count drifted.")
    assert_true(pack["summary"]["blocking_live_gate_count"] == 5, "Blocking live gate count drifted.")
    assert_true(pack["summary"]["review_live_gate_count"] == 5, "Review live gate count drifted.")
    assert_true(pack["summary"]["pass_live_gate_count"] == 1, "Pass live gate count drifted.")
    assert_true(pack["summary"]["transcript_scenario_count"] == 5, "Transcript scenario count drifted.")
    assert_true(pack["summary"]["scan_scenario_count"] == 5, "Scan scenario count drifted.")
    assert_true(pack["summary"]["seeded_transcript_job_count"] == 5, "Seeded transcript job count drifted.")
    assert_true(pack["summary"]["seeded_scan_job_count"] == 5, "Seeded scan job count drifted.")
    assert_true(pack["summary"]["shortlisted_vendor_count"] == 4, "Shortlisted vendor count drifted.")
    assert_true(pack["summary"]["official_guidance_count"] == 19, "Official guidance count drifted.")

    ports = pack["mock_service"]["ports"]
    assert_true(ports["transcription_engine"] == 4200, "Transcription service port drifted.")
    assert_true(ports["artifact_scan_gateway"] == 4201, "Scan service port drifted.")
    assert_true(ports["evidence_gate_lab"] == 4202, "App port drifted.")

    guidance_ids = {row["source_id"] for row in pack["official_vendor_guidance"]}
    assert_true(guidance_ids == EXPECTED_GUIDANCE_IDS, "Official guidance coverage drifted.")

    shortlisted_vendor_ids = {row["vendor_id"] for row in pack["shortlisted_vendors"]}
    assert_true(shortlisted_vendor_ids == EXPECTED_VENDOR_IDS, "Shortlisted vendor ids drifted.")

    gate_ids = {row["gate_id"] for row in live_gate_pack["live_gates"]}
    assert_true(gate_ids == EXPECTED_LIVE_GATES, "Live gate ids drifted.")
    assert_true(set(live_gate_pack["required_env"]) == EXPECTED_ENV_VARS, "Live env vars drifted.")

    assert_true(len(field_map["field_rows"]) == 49, "Field map rows drifted.")
    assert_true(len(job_rows) == 10, "Job profile CSV drifted.")
    assert_true(len(scan_policy_rows) == 12, "Scan policy rows drifted.")

    assert_true(
        {row["provider_family"] for row in job_rows} == {"transcription", "artifact_scanning"},
        "Job profile families drifted.",
    )

    for path in [
        DOCS_DIR / "35_local_evidence_processing_lab_spec.md",
        DOCS_DIR / "35_transcription_and_scanning_project_field_map.md",
        DOCS_DIR / "35_webhook_retention_and_region_strategy.md",
        DOCS_DIR / "35_live_gate_and_spend_controls.md",
    ]:
        content = path.read_text()
        for marker in DOC_MARKERS:
            assert_true(marker in content, f"Missing doc marker {marker} in {path.name}")

    app_content = (APP_DIR / "src" / "App.tsx").read_text()
    for marker in APP_MARKERS:
        assert_true(marker in app_content, f"Missing app marker {marker}")

    transcription_content = (TRANSCRIPTION_SERVICE_DIR / "src" / "server.js").read_text()
    for marker in TRANSCRIPTION_MARKERS:
        assert_true(marker in transcription_content, f"Missing transcription marker {marker}")

    scan_content = (SCAN_SERVICE_DIR / "src" / "server.js").read_text()
    for marker in SCAN_MARKERS:
        assert_true(marker in scan_content, f"Missing scan marker {marker}")

    print(
        json.dumps(
            {
                "task_id": pack["task_id"],
                "validated": True,
                "summary": pack["summary"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
