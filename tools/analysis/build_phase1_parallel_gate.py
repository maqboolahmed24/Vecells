#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST_PATH = ROOT / "prompt" / "checklist.md"

DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DOCS_PROGRAMME_DIR = ROOT / "docs" / "programme"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"

TRACK_MATRIX_PATH = DATA_ANALYSIS_DIR / "143_phase1_parallel_track_matrix.csv"
GATE_JSON_PATH = DATA_ANALYSIS_DIR / "143_phase1_parallel_gate.json"
SEAMS_JSON_PATH = DATA_ANALYSIS_DIR / "143_phase1_shared_interface_seams.json"

GATE_DOC_PATH = DOCS_PROGRAMME_DIR / "143_phase1_parallel_intake_gate.md"
MATRIX_DOC_PATH = DOCS_PROGRAMME_DIR / "143_phase1_track_dependency_matrix.md"
CLAIM_PROTOCOL_DOC_PATH = DOCS_PROGRAMME_DIR / "143_phase1_parallel_claim_protocol.md"
BOARD_HTML_PATH = DOCS_FRONTEND_DIR / "143_phase1_gate_board.html"

EVENT_CATALOG_PATH = DATA_CONTRACTS_DIR / "139_intake_event_catalog.json"
DRAFT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_draft_view.schema.json"
SUBMIT_SETTLEMENT_PATH = DATA_CONTRACTS_DIR / "139_intake_submit_settlement.schema.json"
OUTCOME_ARTIFACT_PATH = DATA_CONTRACTS_DIR / "139_intake_outcome_presentation_artifact.schema.json"
REQUEST_TYPE_TAXONOMY_PATH = DATA_CONTRACTS_DIR / "140_request_type_taxonomy.json"
QUESTION_DEFINITIONS_PATH = DATA_CONTRACTS_DIR / "140_question_definitions.json"
QUESTION_DECISION_TABLES_PATH = DATA_CONTRACTS_DIR / "140_questionnaire_decision_tables.yaml"
ATTACHMENT_POLICY_PATH = DATA_CONTRACTS_DIR / "141_attachment_acceptance_policy.json"
RED_FLAG_RULEBOOK_PATH = DATA_CONTRACTS_DIR / "142_red_flag_decision_tables.yaml"
OUTCOME_COPY_PATH = DATA_CONTRACTS_DIR / "142_outcome_copy_contract.json"

TASK_ID = "seq_143"
VISUAL_MODE = "Phase1_Parallel_Gate_Board"
GATE_PACK_REF = "P1PG_143_PHASE1_PARALLEL_INTAKE_GATE_V1"
GATE_VERDICT = "parallel_block_open"
CAPTURED_ON = "2026-04-14"
MAX_WIDTH_PX = 1620
LEFT_RAIL_WIDTH_PX = 300
RIGHT_INSPECTOR_WIDTH_PX = 404
MASTHEAD_HEIGHT_PX = 72

SOURCE_PRECEDENCE = [
    "prompt/143.md",
    "prompt/shared_operating_contract_136_to_145.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-cards.md#card-2-phase-1-the-red-flag-gate",
    "blueprint/phase-1-the-red-flag-gate.md#1A. Journey contract and intake schema lock",
    "blueprint/phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine",
    "blueprint/phase-1-the-red-flag-gate.md#1C. Validation and required-field discipline",
    "blueprint/phase-1-the-red-flag-gate.md#1D. Attachment ingestion pipeline",
    "blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine",
    "blueprint/forensic-audit-findings.md#Finding 61",
    "blueprint/forensic-audit-findings.md#Finding 62",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "blueprint/forensic-audit-findings.md#Finding 119",
    "blueprint/forensic-audit-findings.md#Finding 120",
    "data/contracts/139_intake_draft_view.schema.json",
    "data/contracts/139_intake_submit_settlement.schema.json",
    "data/contracts/139_intake_outcome_presentation_artifact.schema.json",
    "data/contracts/139_intake_event_catalog.json",
    "data/contracts/140_request_type_taxonomy.json",
    "data/contracts/140_question_definitions.json",
    "data/contracts/140_questionnaire_decision_tables.yaml",
    "data/contracts/141_attachment_acceptance_policy.json",
    "data/contracts/142_red_flag_decision_tables.yaml",
    "data/contracts/142_outcome_copy_contract.json",
]

HARD_PREREQUISITES = [
    {
        "taskId": "seq_139",
        "label": "Phase 1 journey contract and event freeze",
        "requiredRefs": [
            "data/contracts/139_intake_draft_view.schema.json",
            "data/contracts/139_intake_submit_settlement.schema.json",
            "data/contracts/139_intake_outcome_presentation_artifact.schema.json",
            "data/contracts/139_intake_event_catalog.json",
            "docs/architecture/139_web_intake_journey_contract.md",
            "docs/frontend/139_intake_journey_atlas.html",
        ],
    },
    {
        "taskId": "seq_140",
        "label": "Request-type taxonomy and questionnaire freeze",
        "requiredRefs": [
            "data/contracts/140_request_type_taxonomy.json",
            "data/contracts/140_question_definitions.json",
            "data/contracts/140_questionnaire_decision_tables.yaml",
            "docs/architecture/140_request_type_taxonomy.md",
            "docs/frontend/140_request_type_questionnaire_atlas.html",
        ],
    },
    {
        "taskId": "seq_141",
        "label": "Attachment acceptance and quarantine freeze",
        "requiredRefs": [
            "data/contracts/141_attachment_acceptance_policy.json",
            "docs/security/141_attachment_acceptance_policy.md",
            "docs/frontend/141_attachment_evidence_lab.html",
        ],
    },
    {
        "taskId": "seq_142",
        "label": "Safety rulebook and outcome copy freeze",
        "requiredRefs": [
            "data/contracts/142_red_flag_decision_tables.yaml",
            "data/contracts/142_outcome_copy_contract.json",
            "docs/clinical-safety/142_red_flag_rulebook.md",
            "docs/frontend/142_urgent_pathway_atlas.html",
        ],
    },
]

TRACK_FAMILY_METADATA = {
    "backend_foundation": {
        "label": "Backend Foundation",
        "description": "Draft, validation, attachment, contact, promotion, and normalization foundations.",
        "color": "#2F6FED",
    },
    "backend_outcome": {
        "label": "Backend Outcome",
        "description": "Safety, settlement, triage, confirmation, and supersession outcome backplane.",
        "color": "#5B61F6",
    },
    "frontend_capture": {
        "label": "Frontend Capture",
        "description": "Mission-frame and capture surfaces inside the patient shell.",
        "color": "#117A55",
    },
    "frontend_outcome": {
        "label": "Frontend Outcome",
        "description": "Outcome, receipt, status, and resume postures in the same shell.",
        "color": "#B7791F",
    },
}

MERGE_GATES = [
    {
        "mergeGateId": "MG_143_BACKEND_CONTRACT",
        "label": "Backend contract merge gate",
        "type": "contract",
        "accent": "#5B61F6",
        "summary": "Protects draft, submit, validation, attachment, safety, and promotion semantics from per-track drift.",
        "tracks": [
            "par_144",
            "par_145",
            "par_146",
            "par_147",
            "par_148",
            "par_149",
            "par_150",
            "par_151",
            "par_152",
            "par_154",
        ],
        "verificationRules": [
            "No new public schema names outside the frozen Phase 1 seam set.",
            "No duplicate event names for request.submitted or urgent-diversion transitions.",
            "Required-field meaning remains bound to seq_140 question definitions.",
        ],
        "sourceRefs": [
            "data/contracts/139_intake_draft_view.schema.json",
            "data/contracts/139_intake_submit_settlement.schema.json",
            "data/contracts/140_question_definitions.json",
            "data/contracts/141_attachment_acceptance_policy.json",
            "data/contracts/142_red_flag_decision_tables.yaml",
        ],
    },
    {
        "mergeGateId": "MG_143_RUNTIME_PUBLICATION",
        "label": "Runtime/publication merge gate",
        "type": "runtime",
        "accent": "#2F6FED",
        "summary": "Keeps simulator-first storage, notification, outcome publication, and runtime tuple publication aligned.",
        "tracks": [
            "par_144",
            "par_146",
            "par_148",
            "par_151",
            "par_152",
            "par_153",
            "par_158",
            "par_161",
            "par_162",
            "par_163",
        ],
        "verificationRules": [
            "Simulator-backed runtime tuples remain the only allowed baseline in Mock_now_execution.",
            "Outcome/receipt/status publication uses frozen seq_139/142 artifacts rather than local UI inference.",
            "Later live-provider bindings must supersede this gate pack instead of bypassing it.",
        ],
        "sourceRefs": [
            "docs/api/139_phase1_submission_schema_lock.md",
            "data/contracts/141_attachment_acceptance_policy.json",
            "data/contracts/142_outcome_copy_contract.json",
        ],
    },
    {
        "mergeGateId": "MG_143_PATIENT_SHELL_INTEGRATION",
        "label": "Patient-shell integration merge gate",
        "type": "shell",
        "accent": "#117A55",
        "summary": "Prevents backend/frontend divergence on same-shell continuity, route-state adapters, and outcome surface routing.",
        "tracks": [
            "par_145",
            "par_146",
            "par_147",
            "par_151",
            "par_152",
            "par_153",
            "par_154",
            "par_155",
            "par_156",
            "par_157",
            "par_158",
            "par_159",
            "par_160",
            "par_161",
            "par_162",
            "par_163",
        ],
        "verificationRules": [
            "Patient shell route/state adapters stay bound to the single seq_139 journey contract.",
            "Urgent_diversion_required and urgent_diverted stay distinct across backend and shell surfaces.",
            "Save-state meaning, stale recovery, and resume blocking remain identical across backend and frontend tracks.",
        ],
        "sourceRefs": [
            "docs/architecture/139_web_intake_journey_contract.md",
            "docs/frontend/139_patient_intake_experience_spec.md",
            "data/contracts/142_outcome_copy_contract.json",
        ],
    },
    {
        "mergeGateId": "MG_143_TEST_ACCESSIBILITY",
        "label": "Test and accessibility merge gate",
        "type": "quality",
        "accent": "#B7791F",
        "summary": "Requires end-to-end proof, keyboard continuity, and diagram/table parity across the implementation block.",
        "tracks": [
            "par_145",
            "par_146",
            "par_150",
            "par_151",
            "par_152",
            "par_153",
            "par_154",
            "par_155",
            "par_156",
            "par_157",
            "par_158",
            "par_159",
            "par_160",
            "par_161",
            "par_162",
            "par_163",
        ],
        "verificationRules": [
            "Each track must publish objective machine proof or browser proof aligned to its seam owners.",
            "The patient shell must remain keyboard-traversable with reduced-motion parity.",
            "No surface may invent alternate copy or labels that contradict the frozen ruleset.",
        ],
        "sourceRefs": [
            "docs/frontend/139_intake_journey_atlas.html",
            "docs/frontend/140_request_type_questionnaire_atlas.html",
            "docs/frontend/141_attachment_evidence_lab.html",
            "docs/frontend/142_urgent_pathway_atlas.html",
        ],
    },
]

PARALLEL_INTERFACE_GAPS = [
    {
        "gapId": "PARALLEL_INTERFACE_GAP_143_AUTH_AND_EMBEDDED_ROUTE_ADAPTERS_DEFERRED",
        "summary": "Authenticated uplift and embedded route-state adapters remain explicitly deferred. They may narrow chrome later, but they may not fork the draft, submit, or outcome semantics in this block.",
        "state": "bounded_non_blocking",
        "relatedTrackIds": ["par_155", "par_157", "par_160", "par_161", "par_163"],
        "sourceRefs": [
            "docs/architecture/139_web_intake_journey_contract.md",
            "prompt/143.md",
        ],
    },
    {
        "gapId": "PARALLEL_INTERFACE_GAP_143_LIVE_PROVIDER_TRIAGE_BINDING_DEFERRED",
        "summary": "Real downstream provider routing, live ETA accuracy, and non-simulator notification transport remain later superseding work. Current tracks must publish simulator-first runtime truth only.",
        "state": "bounded_non_blocking",
        "relatedTrackIds": ["par_152", "par_153", "par_161", "par_162"],
        "sourceRefs": [
            "prompt/143.md",
            "docs/api/139_phase1_submission_schema_lock.md",
            "docs/clinical-safety/142_red_flag_rulebook.md",
        ],
    },
    {
        "gapId": "PARALLEL_INTERFACE_GAP_143_REAL_AUTH_IDENTITY_LINKAGE_DEFERRED",
        "summary": "Later sign-in uplift may add identity linkage and protected status retrieval, but it must reuse the same draft/public IDs, supersession rules, and resume postures frozen here.",
        "state": "bounded_non_blocking",
        "relatedTrackIds": ["par_154", "par_162", "par_163"],
        "sourceRefs": [
            "prompt/143.md",
            "docs/architecture/139_web_intake_journey_contract.md",
        ],
    },
]

PROHIBITIONS = [
    "No new public schema names outside the seq_139-seq_143 frozen Phase 1 seam set.",
    "No duplicate event names for request.submitted, safety.urgent_diversion.required, or safety.urgent_diversion.completed.",
    "No per-track redefinition of required-field meaning, request-type meaning, attachment scan state meaning, or save-state meaning.",
    "No backend/frontend divergence on same-shell outcome routing, stale recovery, or promoted-draft supersession posture.",
]

MODE_BOUNDARIES = {
    "Mock_now_execution": {
        "summary": "Open the parallel block against the browser-only, simulator-backed Phase 1 baseline.",
        "allowed": [
            "Browser-only self-service intake surfaces.",
            "Simulator-backed storage, notification, and runtime tuples.",
            "Same-shell routing, receipt, and minimal status projections based on frozen seq_139-seq_142 semantics.",
        ],
        "forbidden": [
            "Live-provider dependencies as a prerequisite for track completion.",
            "Real auth or embedded work that changes route, draft, submit, or outcome semantics.",
            "Unbounded DTO or event invention outside the seam list published here.",
        ],
    },
    "Actual_production_strategy_later": {
        "summary": "Later live-provider or channel work must supersede this gate pack rather than bypassing it.",
        "allowed": [
            "Reuse the same seam ownership, merge gates, and dependency graph where semantics are unchanged.",
            "Publish explicit superseding gate packs if eligibility or merge ownership changes.",
        ],
        "forbidden": [
            "Silent replacement of simulator-first assumptions.",
            "Forking canonical submit, urgent-diversion, attachment quarantine, or receipt semantics.",
        ],
    },
}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def load_json(path: Path) -> Any:
    require(path.exists(), f"PREREQUISITE_GAP_143_MISSING::{path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    def escape_cell(value: str) -> str:
        return value.replace("|", "\\|")

    rendered = [
        "| " + " | ".join(escape_cell(header) for header in headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        rendered.append("| " + " | ".join(escape_cell(cell) for cell in row) + " |")
    return "\n".join(rendered)


def read_checklist_state(task_id: str) -> str:
    lines = CHECKLIST_PATH.read_text(encoding="utf-8").splitlines()
    pattern = re.compile(r"- \[([ X\-])\] ([^ ]+)")
    for line in lines:
        match = pattern.match(line.strip())
        if match and (match.group(2) == task_id or match.group(2).startswith(f"{task_id}_")):
            return match.group(1)
    raise RuntimeError(f"PREREQUISITE_GAP_143_CHECKLIST_ROW_MISSING::{task_id}")


def assert_hard_prerequisites() -> list[dict[str, Any]]:
    evidence_rows: list[dict[str, Any]] = []
    for prerequisite in HARD_PREREQUISITES:
        marker = read_checklist_state(prerequisite["taskId"])
        require(
            marker == "X",
            f"PREREQUISITE_GAP_143_INCOMPLETE_FREEZE_TASK::{prerequisite['taskId']}",
        )
        resolved_refs = []
        for ref in prerequisite["requiredRefs"]:
            target = ROOT / ref
            require(target.exists(), f"PREREQUISITE_GAP_143_REF_MISSING::{ref}")
            resolved_refs.append(ref)
        evidence_rows.append(
            {
                "taskId": prerequisite["taskId"],
                "label": prerequisite["label"],
                "state": "complete",
                "evidenceRefs": resolved_refs,
            }
        )
    return evidence_rows


def compute_contract_bundle_hash(bundle_paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in bundle_paths:
        digest.update(path.relative_to(ROOT).as_posix().encode("utf-8"))
        digest.update(b"\n")
        digest.update(path.read_bytes())
        digest.update(b"\n")
    return digest.hexdigest()


def validate_prerequisite_contracts() -> dict[str, Any]:
    event_catalog = load_json(EVENT_CATALOG_PATH)
    request_types = load_json(REQUEST_TYPE_TAXONOMY_PATH)
    question_defs = load_json(QUESTION_DEFINITIONS_PATH)
    question_tables = load_json(QUESTION_DECISION_TABLES_PATH)
    attachment_policy = load_json(ATTACHMENT_POLICY_PATH)
    red_flag_rules = load_json(RED_FLAG_RULEBOOK_PATH)
    outcome_copy = load_json(OUTCOME_COPY_PATH)

    require(
        event_catalog["canonicalSubmitEvent"] == "request.submitted",
        "PREREQUISITE_GAP_143_CANONICAL_SUBMIT_DRIFT",
    )
    event_names = {row["eventName"] for row in event_catalog["eventCatalog"]}
    require(
        {"safety.urgent_diversion.required", "safety.urgent_diversion.completed"}.issubset(event_names),
        "PREREQUISITE_GAP_143_URGENT_EVENT_SPLIT_MISSING",
    )
    require(
        any(row["eventName"] == "intake.attachment.quarantined" for row in attachment_policy["eventPolicy"]),
        "PREREQUISITE_GAP_143_ATTACHMENT_QUARANTINE_EVENT_MISSING",
    )
    require(
        [row["requestType"] for row in request_types["requestTypes"]] == ["Symptoms", "Meds", "Admin", "Results"],
        "PREREQUISITE_GAP_143_REQUEST_TYPE_ORDER_DRIFT",
    )
    require(
        len(question_defs["questionDefinitions"]) >= 20,
        "PREREQUISITE_GAP_143_QUESTION_SET_TOO_SMALL",
    )
    require(
        question_tables["requestTypeChangePolicy"]["confirmationRequired"] is True,
        "PREREQUISITE_GAP_143_REQUEST_TYPE_CONFIRMATION_DRIFT",
    )
    require(
        red_flag_rules["decisionBoundary"]["hardStopDominance"] is True,
        "PREREQUISITE_GAP_143_RED_FLAG_HARD_STOP_DRIFT",
    )
    safety_states = set(outcome_copy["stateMachine"]["safetyStates"])
    require(
        {"urgent_diversion_required", "urgent_diverted"}.issubset(safety_states),
        "PREREQUISITE_GAP_143_OUTCOME_STATE_SPLIT_DRIFT",
    )

    frozen_public_schema_names = [
        "IntakeDraftView",
        "IntakeSubmitSettlement",
        "IntakeOutcomePresentationArtifact",
        "Phase1RequestTypeTaxonomy",
        "Phase1QuestionDefinitionSet",
        "Phase1QuestionnaireDecisionTableSet",
        "Phase1AttachmentAcceptancePolicy",
        "Phase1RedFlagRulePack",
        "Phase1OutcomeCopyContract",
    ]
    canonical_event_names = sorted(event_names)
    return {
        "eventCatalog": event_catalog,
        "requestTypeTaxonomy": request_types,
        "questionDefinitions": question_defs,
        "questionDecisionTables": question_tables,
        "attachmentPolicy": attachment_policy,
        "redFlagRules": red_flag_rules,
        "outcomeCopy": outcome_copy,
        "frozenPublicSchemaNames": frozen_public_schema_names,
        "canonicalEventNames": canonical_event_names,
    }


def contract_ref(ref: str, source_ref: str) -> dict[str, str]:
    return {"contractRef": ref, "sourceRef": source_ref}


def artifact_ref(ref: str, intent: str) -> dict[str, str]:
    return {"artifactRef": ref, "intent": intent}


def build_tracks() -> list[dict[str, Any]]:
    return [
        {
            "taskId": "par_144",
            "checklistTaskId": "par_144",
            "promptRef": "prompt/144.md",
            "trackFamily": "backend_foundation",
            "trackLabel": "Draft session lease and autosave API",
            "waveIndex": 0,
            "eligibilityState": "open",
            "capabilityOwned": "Own the draft session lease boundary, autosave patch API, and resume-token-safe draft mutation cadence.",
            "dependsOnTasks": [],
            "requiredUpstreamContracts": [
                contract_ref("IntakeDraftView", "data/contracts/139_intake_draft_view.schema.json"),
                contract_ref("request.submitted event boundary", "data/contracts/139_intake_event_catalog.json"),
                contract_ref("Phase1QuestionDefinitionSet", "data/contracts/140_question_definitions.json"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("DraftSessionLease API surface", "lease lifecycle and optimistic concurrency"),
                artifact_ref("DraftAutosavePatchEnvelope", "stable patch/write contract for UI and resume"),
                artifact_ref("Resume token supersession hooks", "feeds par_154 and par_157"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "packages/domains/intake_request",
                "data/contracts/139_intake_draft_view.schema.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_RUNTIME_PUBLICATION",
            ],
            "allowedParallelNeighbors": ["par_145", "par_146", "par_147", "par_155"],
            "ownedInterfaceSeamRefs": ["SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PUBLIC_JOURNEY_AND_EVENT_SPINE",
                "SEAM_143_REQUEST_TYPE_AND_QUESTION_SET",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Real auth or embedded routing may reuse the lease boundary later, but may not change the draft/public ID semantics.",
        },
        {
            "taskId": "par_145",
            "checklistTaskId": "par_145",
            "promptRef": "prompt/145.md",
            "trackFamily": "backend_foundation",
            "trackLabel": "Submission envelope validation and required-field rules",
            "waveIndex": 0,
            "eligibilityState": "open",
            "capabilityOwned": "Own pre-submit readiness evaluation, required-field truth, and machine-readable validation output aligned to the frozen questionnaire contract.",
            "dependsOnTasks": ["par_144"],
            "requiredUpstreamContracts": [
                contract_ref("Phase1QuestionDefinitionSet", "data/contracts/140_question_definitions.json"),
                contract_ref("Phase1QuestionnaireDecisionTableSet", "data/contracts/140_questionnaire_decision_tables.yaml"),
                contract_ref("IntakeDraftView", "data/contracts/139_intake_draft_view.schema.json"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("SubmissionEnvelopeValidationVerdict", "canonical readiness and missing-field verdict"),
                artifact_ref("RequiredFieldMeaning map", "single meaning shared by par_156 and par_161"),
                artifact_ref("Questionnaire-to-submit readiness API", "feeds par_148"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "packages/domains/intake_request",
                "data/contracts/140_question_definitions.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_144", "par_146", "par_147", "par_155", "par_156"],
            "ownedInterfaceSeamRefs": ["SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE",
                "SEAM_143_REQUEST_TYPE_AND_QUESTION_SET",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Later auth or provider work may consume the same readiness verdicts but may not redefine required-field meaning.",
        },
        {
            "taskId": "par_146",
            "checklistTaskId": "par_146",
            "promptRef": "prompt/146.md",
            "trackFamily": "backend_foundation",
            "trackLabel": "Attachment upload, scan, quarantine, and document reference pipeline",
            "waveIndex": 0,
            "eligibilityState": "open",
            "capabilityOwned": "Own signed upload initiation, quarantine-first scan settlement, duplicate replay, and draft-safe document reference projection.",
            "dependsOnTasks": ["par_144"],
            "requiredUpstreamContracts": [
                contract_ref("Phase1AttachmentAcceptancePolicy", "data/contracts/141_attachment_acceptance_policy.json"),
                contract_ref("IntakeDraftView", "data/contracts/139_intake_draft_view.schema.json"),
                contract_ref("intake.attachment.added/quarantined events", "data/contracts/139_intake_event_catalog.json"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("AttachmentUploadSession DTO", "signed target + attachmentPublicId"),
                artifact_ref("AttachmentScanSettlement", "quarantine/clean outcome for UI and promotion"),
                artifact_ref("DocumentReference projection link", "feeds par_148 and par_158"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "services/adapter-simulators",
                "packages/domains/intake_request",
                "data/contracts/141_attachment_acceptance_policy.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_144", "par_145", "par_147", "par_155", "par_158"],
            "ownedInterfaceSeamRefs": ["SEAM_143_ATTACHMENT_UPLOAD_AND_SCAN_SETTLEMENT"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE",
                "SEAM_143_ATTACHMENT_POLICY_AND_PRESENTATION",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Live scanning or storage may replace simulator internals later, but the quarantine-first contract stays unchanged.",
        },
        {
            "taskId": "par_147",
            "checklistTaskId": "par_147",
            "promptRef": "prompt/147.md",
            "trackFamily": "backend_foundation",
            "trackLabel": "Contact preference capture and masked storage",
            "waveIndex": 0,
            "eligibilityState": "open",
            "capabilityOwned": "Own contact preference persistence, masked projection output, and confirmation-safe storage semantics.",
            "dependsOnTasks": ["par_144"],
            "requiredUpstreamContracts": [
                contract_ref("IntakeDraftView", "data/contracts/139_intake_draft_view.schema.json"),
                contract_ref("Phase1QuestionDefinitionSet", "data/contracts/140_question_definitions.json"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("ContactPreferencePatch DTO", "stored communication preference mutations"),
                artifact_ref("MaskedContactPreferenceProjection", "feeds par_153, par_159, and par_161"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "packages/domains/intake_request",
                "data/contracts/140_question_definitions.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_144", "par_145", "par_146", "par_155", "par_159"],
            "ownedInterfaceSeamRefs": ["SEAM_143_CONTACT_PREFERENCE_AND_MASKED_ROUTE"],
            "consumedInterfaceSeamRefs": ["SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE"],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Real channel providers may change delivery transport later, but not the stored contact-preference grammar.",
        },
        {
            "taskId": "par_148",
            "checklistTaskId": "par_148",
            "promptRef": "prompt/148.md",
            "trackFamily": "backend_foundation",
            "trackLabel": "Submission snapshot freeze and promotion transaction",
            "waveIndex": 1,
            "eligibilityState": "open",
            "capabilityOwned": "Own the exact promotion transaction from draft snapshot to canonical request, including settlement chain and immutable freeze record.",
            "dependsOnTasks": ["par_144", "par_145", "par_146", "par_147"],
            "requiredUpstreamContracts": [
                contract_ref("IntakeSubmitSettlement", "data/contracts/139_intake_submit_settlement.schema.json"),
                contract_ref("request.submitted event boundary", "data/contracts/139_intake_event_catalog.json"),
                contract_ref("Phase1AttachmentAcceptancePolicy", "data/contracts/141_attachment_acceptance_policy.json"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("SubmissionSnapshotFreezeRecord", "exact draft-to-request materialization"),
                artifact_ref("SubmissionPromotionTransaction", "feeds par_149 through par_154"),
                artifact_ref("request.submitted emission", "canonical durable boundary"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "packages/domains/intake_request",
                "packages/event-contracts",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
            ],
            "allowedParallelNeighbors": ["par_149", "par_150", "par_154", "par_155"],
            "ownedInterfaceSeamRefs": ["SEAM_143_PROMOTION_TRANSACTION_AND_SETTLEMENT_CHAIN"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE",
                "SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE",
                "SEAM_143_ATTACHMENT_UPLOAD_AND_SCAN_SETTLEMENT",
                "SEAM_143_CONTACT_PREFERENCE_AND_MASKED_ROUTE",
                "SEAM_143_PUBLIC_JOURNEY_AND_EVENT_SPINE",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Later downstream systems must consume the same promotion record rather than replacing the submit boundary.",
        },
        {
            "taskId": "par_149",
            "checklistTaskId": "par_149",
            "promptRef": "prompt/149.md",
            "trackFamily": "backend_foundation",
            "trackLabel": "Free-text normalization into canonical request shape",
            "waveIndex": 1,
            "eligibilityState": "open",
            "capabilityOwned": "Own deterministic normalization from questionnaire/draft text into canonical request fields without changing request-type meaning.",
            "dependsOnTasks": ["par_145", "par_146", "par_148"],
            "requiredUpstreamContracts": [
                contract_ref("Phase1RequestTypeTaxonomy", "data/contracts/140_request_type_taxonomy.json"),
                contract_ref("Phase1QuestionDefinitionSet", "data/contracts/140_question_definitions.json"),
                contract_ref("SubmissionPromotionTransaction", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_PROMOTION_TRANSACTION_AND_SETTLEMENT_CHAIN"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("CanonicalRequestNormalizationResult", "feeds par_150 and par_152"),
                artifact_ref("intake.normalized emission hook", "must reuse frozen event name"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "packages/domains/intake_request",
                "data/contracts/140_request_type_taxonomy.json",
            ],
            "blockingMergeDependencies": ["MG_143_BACKEND_CONTRACT"],
            "allowedParallelNeighbors": ["par_148", "par_150", "par_151", "par_155", "par_156"],
            "ownedInterfaceSeamRefs": ["SEAM_143_NORMALIZATION_RESULT_AND_CANONICAL_REQUEST_SHAPE"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PROMOTION_TRANSACTION_AND_SETTLEMENT_CHAIN",
                "SEAM_143_REQUEST_TYPE_AND_QUESTION_SET",
                "SEAM_143_ATTACHMENT_UPLOAD_AND_SCAN_SETTLEMENT",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Normalization may grow later, but it must continue to emit the same canonical request shape and event meaning.",
        },
        {
            "taskId": "par_150",
            "checklistTaskId": "par_150",
            "promptRef": "prompt/150.md",
            "trackFamily": "backend_outcome",
            "trackLabel": "Rule-based synchronous safety engine",
            "waveIndex": 2,
            "eligibilityState": "open",
            "capabilityOwned": "Own synchronous safety screening, rule evaluation, and explicit urgent_diversion_required versus urgent_diverted state separation.",
            "dependsOnTasks": ["par_145", "par_148", "par_149"],
            "requiredUpstreamContracts": [
                contract_ref("Phase1RedFlagRulePack", "data/contracts/142_red_flag_decision_tables.yaml"),
                contract_ref("Phase1OutcomeCopyContract", "data/contracts/142_outcome_copy_contract.json"),
                contract_ref("CanonicalRequestNormalizationResult", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_NORMALIZATION_RESULT_AND_CANONICAL_REQUEST_SHAPE"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("SafetyDecisionRecord", "feeds par_151, par_160, and par_161"),
                artifact_ref("SafetyPreemptionRecord", "fails safe without field-validation tone"),
                artifact_ref("safety.screened and safety.urgent_diversion.required hooks", "must reuse frozen event names"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "packages/domains/intake_safety",
                "data/contracts/142_red_flag_decision_tables.yaml",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_149", "par_151", "par_152", "par_155", "par_160"],
            "ownedInterfaceSeamRefs": ["SEAM_143_SAFETY_DECISION_AND_PREEMPTION_CHAIN"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_NORMALIZATION_RESULT_AND_CANONICAL_REQUEST_SHAPE",
                "SEAM_143_SAFETY_RULEBOOK_AND_OUTCOME_COPY",
                "SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Later clinical calibration may supersede thresholds, but not the canonical outcome state split or event names.",
        },
        {
            "taskId": "par_151",
            "checklistTaskId": "par_151",
            "promptRef": "prompt/151.md",
            "trackFamily": "backend_outcome",
            "trackLabel": "Urgent-diversion settlement and receipt grammar",
            "waveIndex": 3,
            "eligibilityState": "open",
            "capabilityOwned": "Own settlement records and receipt grammar selection after safety screening, including hard-stop urgent handoff truth.",
            "dependsOnTasks": ["par_148", "par_149", "par_150"],
            "requiredUpstreamContracts": [
                contract_ref("IntakeOutcomePresentationArtifact", "data/contracts/139_intake_outcome_presentation_artifact.schema.json"),
                contract_ref("Phase1OutcomeCopyContract", "data/contracts/142_outcome_copy_contract.json"),
                contract_ref("SafetyDecisionRecord", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_SAFETY_DECISION_AND_PREEMPTION_CHAIN"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("UrgentDiversionSettlement", "distinguishes required from completed diversion"),
                artifact_ref("OutcomeArtifactSelection", "feeds par_160 and par_161"),
                artifact_ref("patient.receipt.issued and safety.urgent_diversion.completed hooks", "must reuse frozen event names"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "packages/domains/intake_safety",
                "data/contracts/142_outcome_copy_contract.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_150", "par_152", "par_153", "par_155", "par_160", "par_161"],
            "ownedInterfaceSeamRefs": ["SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PROMOTION_TRANSACTION_AND_SETTLEMENT_CHAIN",
                "SEAM_143_SAFETY_DECISION_AND_PREEMPTION_CHAIN",
                "SEAM_143_SAFETY_RULEBOOK_AND_OUTCOME_COPY",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Later handoff channels may change transport, but not the issued-versus-required urgent state distinction.",
        },
        {
            "taskId": "par_152",
            "checklistTaskId": "par_152",
            "promptRef": "prompt/152.md",
            "trackFamily": "backend_outcome",
            "trackLabel": "Triage task creation, ETA engine, and minimal status tracking",
            "waveIndex": 4,
            "eligibilityState": "open",
            "capabilityOwned": "Own simulator-first triage task projection, ETA calculation, and minimal track-my-request status spine.",
            "dependsOnTasks": ["par_148", "par_149", "par_150", "par_151"],
            "requiredUpstreamContracts": [
                contract_ref("IntakeSubmitSettlement", "data/contracts/139_intake_submit_settlement.schema.json"),
                contract_ref("UrgentDiversionSettlement", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT"),
                contract_ref("SafetyDecisionRecord", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_SAFETY_DECISION_AND_PREEMPTION_CHAIN"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("TriageTaskProjection", "feeds par_161 and par_162"),
                artifact_ref("MinimalStatusProjection", "request lifecycle surface for par_162"),
                artifact_ref("triage.task.created hook", "must reuse frozen event name"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "services/projection-worker",
                "data/contracts/139_intake_submit_settlement.schema.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_151", "par_153", "par_155", "par_161", "par_162"],
            "ownedInterfaceSeamRefs": ["SEAM_143_TRIAGE_STATUS_AND_ETA_PROJECTION"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PROMOTION_TRANSACTION_AND_SETTLEMENT_CHAIN",
                "SEAM_143_SAFETY_DECISION_AND_PREEMPTION_CHAIN",
                "SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Live ETA and provider orchestration may refine estimates later, but the minimal status spine remains the same seam.",
        },
        {
            "taskId": "par_153",
            "checklistTaskId": "par_153",
            "promptRef": "prompt/153.md",
            "trackFamily": "backend_outcome",
            "trackLabel": "Confirmation notification dispatch and observability",
            "waveIndex": 4,
            "eligibilityState": "open",
            "capabilityOwned": "Own queued confirmation payload construction, channel-safe wording, and observability for dispatch attempts.",
            "dependsOnTasks": ["par_147", "par_151", "par_152"],
            "requiredUpstreamContracts": [
                contract_ref("Phase1OutcomeCopyContract", "data/contracts/142_outcome_copy_contract.json"),
                contract_ref("MaskedContactPreferenceProjection", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_CONTACT_PREFERENCE_AND_MASKED_ROUTE"),
                contract_ref("TriageTaskProjection", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_TRIAGE_STATUS_AND_ETA_PROJECTION"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("NotificationDispatchPayload", "feeds par_159 and par_161"),
                artifact_ref("communication.queued hook", "must reuse frozen event name"),
                artifact_ref("Dispatch observability ledger", "tracks simulator-first delivery attempts"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/notification-worker",
                "packages/observability",
                "data/contracts/142_outcome_copy_contract.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_151", "par_152", "par_155", "par_159", "par_161"],
            "ownedInterfaceSeamRefs": ["SEAM_143_NOTIFICATION_PAYLOAD_AND_DISPATCH_EVIDENCE"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_CONTACT_PREFERENCE_AND_MASKED_ROUTE",
                "SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT",
                "SEAM_143_TRIAGE_STATUS_AND_ETA_PROJECTION",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Real delivery channels may replace simulator transport later, but not the payload grammar or observability envelope.",
        },
        {
            "taskId": "par_154",
            "checklistTaskId": "par_154",
            "promptRef": "prompt/154.md",
            "trackFamily": "backend_outcome",
            "trackLabel": "Promoted-draft token supersession and resume blocking",
            "waveIndex": 2,
            "eligibilityState": "open",
            "capabilityOwned": "Own post-promotion draft invalidation, stale resume blocking, and replacement-token acknowledgement semantics.",
            "dependsOnTasks": ["par_144", "par_148"],
            "requiredUpstreamContracts": [
                contract_ref("SubmissionPromotionTransaction", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_PROMOTION_TRANSACTION_AND_SETTLEMENT_CHAIN"),
                contract_ref("DraftSessionLease API surface", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("PromotedDraftSupersessionRecord", "feeds par_157 and par_163"),
                artifact_ref("ResumeBlockedReason map", "single stale/superseded posture contract"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "services/command-api",
                "packages/domains/intake_request",
                "data/contracts/139_intake_draft_view.schema.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_148", "par_155", "par_157", "par_163"],
            "ownedInterfaceSeamRefs": ["SEAM_143_SUPERSESSION_AND_RESUME_BLOCKING"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE",
                "SEAM_143_PROMOTION_TRANSACTION_AND_SETTLEMENT_CHAIN",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Later authenticated uplift must reuse this supersession contract rather than inventing alternate stale-token meanings.",
        },
        {
            "taskId": "par_155",
            "checklistTaskId": "par_155",
            "promptRef": "prompt/155.md",
            "trackFamily": "frontend_capture",
            "trackLabel": "Patient intake mission frame",
            "waveIndex": 0,
            "eligibilityState": "open",
            "capabilityOwned": "Own the same-shell mission frame, route shell, persistent chrome, and shared state adapters for all Phase 1 intake child views.",
            "dependsOnTasks": [],
            "requiredUpstreamContracts": [
                contract_ref("seq_139 journey contract", "docs/architecture/139_web_intake_journey_contract.md"),
                contract_ref("Phase1RequestTypeTaxonomy", "data/contracts/140_request_type_taxonomy.json"),
                contract_ref("Phase1OutcomeCopyContract", "data/contracts/142_outcome_copy_contract.json"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("PatientIntakeMissionFrame shell", "route family foundation for par_156 through par_163"),
                artifact_ref("Patient-shell route/state adapters", "shared shell seam consumed by all frontend tracks"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "apps/patient-web",
                "packages/persistent-shell",
                "packages/design-system",
            ],
            "blockingMergeDependencies": [
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": [
                "par_144",
                "par_145",
                "par_146",
                "par_147",
                "par_148",
                "par_149",
                "par_150",
                "par_151",
                "par_152",
                "par_153",
                "par_154",
                "par_156",
                "par_157",
                "par_158",
                "par_159",
                "par_160",
                "par_161",
                "par_162",
                "par_163",
            ],
            "ownedInterfaceSeamRefs": ["SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS"],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PUBLIC_JOURNEY_AND_EVENT_SPINE",
                "SEAM_143_REQUEST_TYPE_AND_QUESTION_SET",
                "SEAM_143_SAFETY_RULEBOOK_AND_OUTCOME_COPY",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Embedded and authenticated surfaces may later narrow the shell, but they must reuse this route/state adapter seam.",
        },
        {
            "taskId": "par_156",
            "checklistTaskId": "par_156",
            "promptRef": "prompt/156.md",
            "trackFamily": "frontend_capture",
            "trackLabel": "Request-type selection and progressive question flow",
            "waveIndex": 1,
            "eligibilityState": "open",
            "capabilityOwned": "Own request-type selection, progressive question rendering, and review-safe supersession of hidden answers.",
            "dependsOnTasks": ["par_145", "par_155"],
            "requiredUpstreamContracts": [
                contract_ref("Phase1QuestionDefinitionSet", "data/contracts/140_question_definitions.json"),
                contract_ref("Phase1QuestionnaireDecisionTableSet", "data/contracts/140_questionnaire_decision_tables.yaml"),
                contract_ref("SubmissionEnvelopeValidationVerdict", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("ProgressiveQuestionFlow UI adapter", "request-type and question progression"),
                artifact_ref("Review-safe hidden-answer supersession UI", "must align with seq_140 lifecycle"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "apps/patient-web",
                "packages/design-system",
                "data/contracts/140_question_definitions.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_145", "par_155", "par_157", "par_158", "par_159"],
            "ownedInterfaceSeamRefs": [],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS",
                "SEAM_143_REQUEST_TYPE_AND_QUESTION_SET",
                "SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Later provider or auth work may not alter request-type meaning or hidden-answer supersession behavior.",
        },
        {
            "taskId": "par_157",
            "checklistTaskId": "par_157",
            "promptRef": "prompt/157.md",
            "trackFamily": "frontend_capture",
            "trackLabel": "Quiet autosave status strip and resume states",
            "waveIndex": 1,
            "eligibilityState": "open",
            "capabilityOwned": "Own quiet autosave feedback, save-state truth, and resume/stale banners inside the mission frame.",
            "dependsOnTasks": ["par_144", "par_154", "par_155"],
            "requiredUpstreamContracts": [
                contract_ref("DraftSessionLease API surface", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE"),
                contract_ref("PromotedDraftSupersessionRecord", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_SUPERSESSION_AND_RESUME_BLOCKING"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("QuietAutosaveStatusStrip", "shared save-state UI contract"),
                artifact_ref("ResumeBlocked and stale banners", "feeds par_163"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "apps/patient-web",
                "packages/persistent-shell",
                "packages/design-system",
            ],
            "blockingMergeDependencies": [
                "MG_143_BACKEND_CONTRACT",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_144", "par_154", "par_155", "par_156", "par_163"],
            "ownedInterfaceSeamRefs": [],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS",
                "SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE",
                "SEAM_143_SUPERSESSION_AND_RESUME_BLOCKING",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Real auth refresh later may reuse the same stale/resume postures but may not rename or reinterpret them.",
        },
        {
            "taskId": "par_158",
            "checklistTaskId": "par_158",
            "promptRef": "prompt/158.md",
            "trackFamily": "frontend_capture",
            "trackLabel": "File upload evidence states and error recovery",
            "waveIndex": 1,
            "eligibilityState": "open",
            "capabilityOwned": "Own file upload UX, quarantine-safe evidence states, duplicate replay messaging, and recovery actions.",
            "dependsOnTasks": ["par_146", "par_155"],
            "requiredUpstreamContracts": [
                contract_ref("Phase1AttachmentAcceptancePolicy", "data/contracts/141_attachment_acceptance_policy.json"),
                contract_ref("AttachmentUploadSession DTO", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_ATTACHMENT_UPLOAD_AND_SCAN_SETTLEMENT"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("AttachmentEvidenceRail UI", "upload/scan/quarantine evidence states"),
                artifact_ref("Duplicate replay and recovery presentation", "feeds review and receipt surfaces"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "apps/patient-web",
                "packages/design-system",
                "data/contracts/141_attachment_acceptance_policy.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_146", "par_155", "par_156", "par_157", "par_159"],
            "ownedInterfaceSeamRefs": [],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS",
                "SEAM_143_ATTACHMENT_POLICY_AND_PRESENTATION",
                "SEAM_143_ATTACHMENT_UPLOAD_AND_SCAN_SETTLEMENT",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Later external storage/scan engines may not change quarantine-first UX truth or duplicate replay semantics.",
        },
        {
            "taskId": "par_159",
            "checklistTaskId": "par_159",
            "promptRef": "prompt/159.md",
            "trackFamily": "frontend_capture",
            "trackLabel": "Contact preference editor and confirmation copy",
            "waveIndex": 1,
            "eligibilityState": "open",
            "capabilityOwned": "Own contact preference editing, masked confirmation copy, and confirmation-channel disclosure in the capture flow.",
            "dependsOnTasks": ["par_147", "par_153", "par_155"],
            "requiredUpstreamContracts": [
                contract_ref("MaskedContactPreferenceProjection", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_CONTACT_PREFERENCE_AND_MASKED_ROUTE"),
                contract_ref("NotificationDispatchPayload", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_NOTIFICATION_PAYLOAD_AND_DISPATCH_EVIDENCE"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("ContactPreferenceEditor UI", "same-shell editor for channel choice"),
                artifact_ref("Confirmation copy preview", "feeds receipt view"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "apps/patient-web",
                "packages/design-system",
                "data/contracts/142_outcome_copy_contract.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_147", "par_153", "par_155", "par_156", "par_158", "par_161"],
            "ownedInterfaceSeamRefs": [],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS",
                "SEAM_143_CONTACT_PREFERENCE_AND_MASKED_ROUTE",
                "SEAM_143_NOTIFICATION_PAYLOAD_AND_DISPATCH_EVIDENCE",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Later real delivery channels may refine labels, but not the masked copy or preference grammar.",
        },
        {
            "taskId": "par_160",
            "checklistTaskId": "par_160",
            "promptRef": "prompt/160.md",
            "trackFamily": "frontend_outcome",
            "trackLabel": "Same-shell urgent diversion surface",
            "waveIndex": 4,
            "eligibilityState": "open",
            "capabilityOwned": "Own the urgent diversion surface inside the same shell, including required-versus-completed urgency truth and safe navigation handoff.",
            "dependsOnTasks": ["par_150", "par_151", "par_155"],
            "requiredUpstreamContracts": [
                contract_ref("Phase1OutcomeCopyContract", "data/contracts/142_outcome_copy_contract.json"),
                contract_ref("UrgentDiversionSettlement", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("Same-shell urgent diversion view", "patient-facing urgent surface"),
                artifact_ref("Urgent handoff affordances", "must align with OutboundNavigationGrant"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "apps/patient-web",
                "packages/persistent-shell",
                "data/contracts/142_outcome_copy_contract.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_150", "par_151", "par_155", "par_161", "par_163"],
            "ownedInterfaceSeamRefs": [],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS",
                "SEAM_143_SAFETY_RULEBOOK_AND_OUTCOME_COPY",
                "SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Later embedded or live handoff transports may change the grant target, not the same-shell urgent truth model.",
        },
        {
            "taskId": "par_161",
            "checklistTaskId": "par_161",
            "promptRef": "prompt/161.md",
            "trackFamily": "frontend_outcome",
            "trackLabel": "Same-shell receipt and ETA surface",
            "waveIndex": 4,
            "eligibilityState": "open",
            "capabilityOwned": "Own same-shell receipt, ETA/status summary, and confirmation copy presentation after a non-urgent submit.",
            "dependsOnTasks": ["par_151", "par_152", "par_153", "par_155", "par_159"],
            "requiredUpstreamContracts": [
                contract_ref("OutcomeArtifactSelection", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT"),
                contract_ref("TriageTaskProjection", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_TRIAGE_STATUS_AND_ETA_PROJECTION"),
                contract_ref("NotificationDispatchPayload", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_NOTIFICATION_PAYLOAD_AND_DISPATCH_EVIDENCE"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("Receipt and ETA screen", "same-shell post-submit surface"),
                artifact_ref("Status summary adapter", "feeds par_162 and par_163"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "apps/patient-web",
                "packages/persistent-shell",
                "data/contracts/139_intake_outcome_presentation_artifact.schema.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_151", "par_152", "par_153", "par_155", "par_159", "par_160", "par_162"],
            "ownedInterfaceSeamRefs": [],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS",
                "SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT",
                "SEAM_143_TRIAGE_STATUS_AND_ETA_PROJECTION",
                "SEAM_143_NOTIFICATION_PAYLOAD_AND_DISPATCH_EVIDENCE",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Live ETA updates later must reuse the same receipt/ETA projection seam rather than reworking the shell route.",
        },
        {
            "taskId": "par_162",
            "checklistTaskId": "par_162",
            "promptRef": "prompt/162.md",
            "trackFamily": "frontend_outcome",
            "trackLabel": "Minimal track-my-request page",
            "waveIndex": 5,
            "eligibilityState": "open",
            "capabilityOwned": "Own the minimal track-my-request page using the simulator-first status/ETA projection and exact requestPublicId semantics.",
            "dependsOnTasks": ["par_152", "par_161"],
            "requiredUpstreamContracts": [
                contract_ref("TriageTaskProjection", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_TRIAGE_STATUS_AND_ETA_PROJECTION"),
                contract_ref("Status summary adapter", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("Minimal tracking page", "request status surface"),
                artifact_ref("Track-my-request route adapter", "feeds par_163"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "apps/patient-web",
                "packages/persistent-shell",
                "data/contracts/139_intake_submit_settlement.schema.json",
            ],
            "blockingMergeDependencies": [
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_152", "par_155", "par_161", "par_163"],
            "ownedInterfaceSeamRefs": [],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS",
                "SEAM_143_TRIAGE_STATUS_AND_ETA_PROJECTION",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "Authenticated track-my-request later may add identity checks, but it must reuse the same request/status projection seam.",
        },
        {
            "taskId": "par_163",
            "checklistTaskId": "par_163",
            "promptRef": "prompt/163.md",
            "trackFamily": "frontend_outcome",
            "trackLabel": "Sign-in uplift, refresh, and resume postures",
            "waveIndex": 5,
            "eligibilityState": "open",
            "capabilityOwned": "Own sign-in uplift messaging, refresh recovery, and resume postures without changing the simulator-first browser baseline.",
            "dependsOnTasks": ["par_154", "par_155", "par_157", "par_160", "par_162"],
            "requiredUpstreamContracts": [
                contract_ref("PromotedDraftSupersessionRecord", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_SUPERSESSION_AND_RESUME_BLOCKING"),
                contract_ref("Track-my-request route adapter", "data/analysis/143_phase1_parallel_gate.json#SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS"),
                contract_ref("Urgent/diversion and receipt shell routes", "docs/architecture/139_web_intake_journey_contract.md"),
            ],
            "producedDownstreamArtifacts": [
                artifact_ref("Authenticated uplift posture copy", "deferred but bounded same-shell posture"),
                artifact_ref("Refresh and resume posture adapter", "final continuity surface for later auth supersession"),
            ],
            "sharedPackagesOrInterfacesTouched": [
                "apps/patient-web",
                "packages/persistent-shell",
                "docs/frontend/139_patient_intake_experience_spec.md",
            ],
            "blockingMergeDependencies": [
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "allowedParallelNeighbors": ["par_154", "par_155", "par_157", "par_160", "par_162"],
            "ownedInterfaceSeamRefs": [],
            "consumedInterfaceSeamRefs": [
                "SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS",
                "SEAM_143_SUPERSESSION_AND_RESUME_BLOCKING",
            ],
            "simulatorBaselineOnly": True,
            "liveProviderLaterNote": "This track only publishes bounded placeholders for later auth/embedded work and must not make them current prerequisites.",
        },
    ]


def build_seams() -> list[dict[str, Any]]:
    return [
        {
            "seamId": "SEAM_143_PUBLIC_JOURNEY_AND_EVENT_SPINE",
            "ownerTaskId": "seq_139",
            "label": "Public journey, submit, and event spine",
            "summary": "Owns the Phase 1 public route spine, canonical submit event, outcome schema refs, and the frozen urgent-diversion event split.",
            "reservedPublicSchemaNames": [
                "IntakeDraftView",
                "IntakeSubmitSettlement",
                "IntakeOutcomePresentationArtifact",
            ],
            "reservedEventNames": [
                "request.submitted",
                "intake.draft.created",
                "intake.draft.updated",
                "intake.attachment.added",
                "intake.attachment.quarantined",
                "intake.normalized",
                "safety.screened",
                "safety.urgent_diversion.required",
                "safety.urgent_diversion.completed",
                "triage.task.created",
                "patient.receipt.issued",
                "communication.queued",
            ],
            "consumerTaskIds": [
                "par_144",
                "par_145",
                "par_146",
                "par_148",
                "par_151",
                "par_152",
                "par_155",
                "par_160",
                "par_161",
                "par_162",
                "par_163",
            ],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_PATIENT_SHELL_INTEGRATION"],
            "sourceRefs": [
                "data/contracts/139_intake_draft_view.schema.json",
                "data/contracts/139_intake_submit_settlement.schema.json",
                "data/contracts/139_intake_outcome_presentation_artifact.schema.json",
                "data/contracts/139_intake_event_catalog.json",
            ],
        },
        {
            "seamId": "SEAM_143_REQUEST_TYPE_AND_QUESTION_SET",
            "ownerTaskId": "seq_140",
            "label": "Request-type taxonomy and question set",
            "summary": "Owns request-type meaning, question definitions, progressive flow structure, and required-field semantics for the entire block.",
            "reservedPublicSchemaNames": [
                "Phase1RequestTypeTaxonomy",
                "Phase1QuestionDefinitionSet",
                "Phase1QuestionnaireDecisionTableSet",
                "Phase1IntakeExperienceBundle",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": [
                "par_144",
                "par_145",
                "par_147",
                "par_149",
                "par_155",
                "par_156",
            ],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_PATIENT_SHELL_INTEGRATION"],
            "sourceRefs": [
                "data/contracts/140_request_type_taxonomy.json",
                "data/contracts/140_question_definitions.json",
                "data/contracts/140_questionnaire_decision_tables.yaml",
            ],
        },
        {
            "seamId": "SEAM_143_ATTACHMENT_POLICY_AND_PRESENTATION",
            "ownerTaskId": "seq_141",
            "label": "Attachment policy and artifact presentation",
            "summary": "Owns acceptance policy, duplicate replay policy, quarantine-first truth, and governed preview/open/download semantics.",
            "reservedPublicSchemaNames": [
                "Phase1AttachmentAcceptancePolicy",
                "AttachmentScanStateMap",
                "AttachmentArtifactPresentationContract",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_146", "par_148", "par_149", "par_155", "par_158"],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_RUNTIME_PUBLICATION"],
            "sourceRefs": [
                "data/contracts/141_attachment_acceptance_policy.json",
                "docs/security/141_attachment_acceptance_policy.md",
            ],
        },
        {
            "seamId": "SEAM_143_SAFETY_RULEBOOK_AND_OUTCOME_COPY",
            "ownerTaskId": "seq_142",
            "label": "Safety rulebook and outcome copy",
            "summary": "Owns red-flag rule semantics, copy families, and the required-versus-diverted urgent pathway state grammar.",
            "reservedPublicSchemaNames": [
                "Phase1RedFlagRulePack",
                "Phase1OutcomeCopyContract",
                "UrgentPathwayCopyDeck",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": [
                "par_150",
                "par_151",
                "par_153",
                "par_155",
                "par_160",
                "par_161",
            ],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_PATIENT_SHELL_INTEGRATION"],
            "sourceRefs": [
                "data/contracts/142_red_flag_decision_tables.yaml",
                "data/contracts/142_outcome_copy_contract.json",
            ],
        },
        {
            "seamId": "SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE",
            "ownerTaskId": "par_144",
            "label": "Draft autosave and resume state",
            "summary": "Owns the public autosave DTOs, lease semantics, and resume-safe draft mutation cadence shared by backend and shell tracks.",
            "reservedPublicSchemaNames": [
                "DraftSessionLease",
                "DraftAutosavePatchEnvelope",
                "DraftResumeTokenState",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_145", "par_146", "par_147", "par_148", "par_154", "par_157"],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_PATIENT_SHELL_INTEGRATION"],
            "sourceRefs": ["prompt/144.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE",
            "ownerTaskId": "par_145",
            "label": "Validation and required-field discipline",
            "summary": "Owns validation verdicts, required-field truth, and the single pre-submit readiness view for both backend and shell tracks.",
            "reservedPublicSchemaNames": [
                "SubmissionEnvelopeValidationVerdict",
                "RequiredFieldMeaningMap",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_148", "par_150", "par_156"],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_TEST_ACCESSIBILITY"],
            "sourceRefs": ["prompt/145.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_ATTACHMENT_UPLOAD_AND_SCAN_SETTLEMENT",
            "ownerTaskId": "par_146",
            "label": "Attachment upload and scan settlement",
            "summary": "Owns upload-session DTOs, scan settlement records, and document reference linking for backend and UI evidence states.",
            "reservedPublicSchemaNames": [
                "AttachmentUploadSession",
                "AttachmentScanSettlement",
                "AttachmentDocumentReferenceLink",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_148", "par_149", "par_158"],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_RUNTIME_PUBLICATION"],
            "sourceRefs": ["prompt/146.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_CONTACT_PREFERENCE_AND_MASKED_ROUTE",
            "ownerTaskId": "par_147",
            "label": "Contact preference and masked route",
            "summary": "Owns masked contact preference storage and projection so notification, receipt, and editor tracks cannot diverge.",
            "reservedPublicSchemaNames": [
                "ContactPreferencePatch",
                "MaskedContactPreferenceProjection",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_148", "par_153", "par_159", "par_161"],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_PATIENT_SHELL_INTEGRATION"],
            "sourceRefs": ["prompt/147.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_PROMOTION_TRANSACTION_AND_SETTLEMENT_CHAIN",
            "ownerTaskId": "par_148",
            "label": "Promotion transaction and settlement chain",
            "summary": "Owns the immutable draft-to-request freeze record, promotion transaction, and durable settlement spine.",
            "reservedPublicSchemaNames": [
                "SubmissionSnapshotFreezeRecord",
                "SubmissionPromotionTransaction",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_149", "par_150", "par_151", "par_152", "par_154"],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_RUNTIME_PUBLICATION"],
            "sourceRefs": ["prompt/148.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_NORMALIZATION_RESULT_AND_CANONICAL_REQUEST_SHAPE",
            "ownerTaskId": "par_149",
            "label": "Normalization result and canonical request shape",
            "summary": "Owns the post-promotion normalized request shape that safety, triage, and later status work consume.",
            "reservedPublicSchemaNames": [
                "CanonicalRequestNormalizationResult",
                "CanonicalRequestShape",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_150", "par_151", "par_152"],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT"],
            "sourceRefs": ["prompt/149.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_SAFETY_DECISION_AND_PREEMPTION_CHAIN",
            "ownerTaskId": "par_150",
            "label": "Safety decision and preemption chain",
            "summary": "Owns synchronous safety decision output, preemption truth, and the required urgent-diversion decision split before receipt routing.",
            "reservedPublicSchemaNames": [
                "SafetyDecisionRecord",
                "SafetyPreemptionRecord",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_151", "par_152", "par_160", "par_161"],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_PATIENT_SHELL_INTEGRATION"],
            "sourceRefs": ["prompt/150.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT",
            "ownerTaskId": "par_151",
            "label": "Outcome artifact and urgent settlement",
            "summary": "Owns the urgent-diversion settlement result and exact outcome artifact selection for shell rendering.",
            "reservedPublicSchemaNames": [
                "UrgentDiversionSettlement",
                "OutcomeArtifactSelection",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_152", "par_153", "par_160", "par_161"],
            "mergeGateRefs": [
                "MG_143_RUNTIME_PUBLICATION",
                "MG_143_PATIENT_SHELL_INTEGRATION",
                "MG_143_TEST_ACCESSIBILITY",
            ],
            "sourceRefs": ["prompt/151.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_TRIAGE_STATUS_AND_ETA_PROJECTION",
            "ownerTaskId": "par_152",
            "label": "Triage status and ETA projection",
            "summary": "Owns simulator-first triage projections, ETA output, and the minimal status surface contract.",
            "reservedPublicSchemaNames": [
                "TriageTaskProjection",
                "MinimalStatusProjection",
                "EtaProjectionEnvelope",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_153", "par_161", "par_162"],
            "mergeGateRefs": ["MG_143_RUNTIME_PUBLICATION", "MG_143_PATIENT_SHELL_INTEGRATION"],
            "sourceRefs": ["prompt/152.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_NOTIFICATION_PAYLOAD_AND_DISPATCH_EVIDENCE",
            "ownerTaskId": "par_153",
            "label": "Notification payload and dispatch evidence",
            "summary": "Owns confirmation notification payload grammar and the simulator-first delivery evidence model.",
            "reservedPublicSchemaNames": [
                "NotificationDispatchPayload",
                "NotificationDispatchEvidence",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_159", "par_161"],
            "mergeGateRefs": ["MG_143_RUNTIME_PUBLICATION", "MG_143_TEST_ACCESSIBILITY"],
            "sourceRefs": ["prompt/153.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_SUPERSESSION_AND_RESUME_BLOCKING",
            "ownerTaskId": "par_154",
            "label": "Supersession and resume blocking",
            "summary": "Owns promoted-draft invalidation, stale recovery truth, and resume blocking reasons shared by backend and shell tracks.",
            "reservedPublicSchemaNames": [
                "PromotedDraftSupersessionRecord",
                "ResumeBlockedReasonMap",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_157", "par_163"],
            "mergeGateRefs": ["MG_143_BACKEND_CONTRACT", "MG_143_PATIENT_SHELL_INTEGRATION"],
            "sourceRefs": ["prompt/154.md", "prompt/143.md"],
        },
        {
            "seamId": "SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS",
            "ownerTaskId": "par_155",
            "label": "Patient shell route and state adapters",
            "summary": "Owns route-state adapters, shell continuity hooks, and mission-frame integration consumed by every frontend track.",
            "reservedPublicSchemaNames": [
                "PatientIntakeMissionFrameState",
                "PatientShellRouteStateAdapter",
                "PatientShellOutcomeRouteAdapter",
            ],
            "reservedEventNames": [],
            "consumerTaskIds": ["par_156", "par_157", "par_158", "par_159", "par_160", "par_161", "par_162", "par_163"],
            "mergeGateRefs": ["MG_143_PATIENT_SHELL_INTEGRATION", "MG_143_TEST_ACCESSIBILITY"],
            "sourceRefs": ["prompt/155.md", "prompt/143.md"],
        },
    ]


def ensure_unique_reserved_names(seams: list[dict[str, Any]]) -> None:
    schema_owners: dict[str, str] = {}
    event_owners: dict[str, str] = {}
    for seam in seams:
        for schema_name in seam["reservedPublicSchemaNames"]:
            if schema_name in schema_owners:
                raise RuntimeError(
                    f"PREREQUISITE_GAP_143_DUPLICATE_SCHEMA_OWNER::{schema_name}::{schema_owners[schema_name]}::{seam['seamId']}"
                )
            schema_owners[schema_name] = seam["seamId"]
        for event_name in seam["reservedEventNames"]:
            if event_name in event_owners:
                raise RuntimeError(
                    f"PREREQUISITE_GAP_143_DUPLICATE_EVENT_OWNER::{event_name}::{event_owners[event_name]}::{seam['seamId']}"
                )
            event_owners[event_name] = seam["seamId"]


def build_dependency_edges(tracks: list[dict[str, Any]]) -> list[dict[str, str]]:
    edges: list[dict[str, str]] = []
    for track in tracks:
        for dependency in track["dependsOnTasks"]:
            edges.append(
                {
                    "fromTaskId": dependency,
                    "toTaskId": track["taskId"],
                    "edgeType": "hard_dependency",
                }
            )
    return edges


def build_gate_payload(
    prerequisite_rows: list[dict[str, Any]],
    prerequisite_contracts: dict[str, Any],
    tracks: list[dict[str, Any]],
    seams: list[dict[str, Any]],
) -> dict[str, Any]:
    bundle_paths = [
        DRAFT_SCHEMA_PATH,
        SUBMIT_SETTLEMENT_PATH,
        OUTCOME_ARTIFACT_PATH,
        EVENT_CATALOG_PATH,
        REQUEST_TYPE_TAXONOMY_PATH,
        QUESTION_DEFINITIONS_PATH,
        QUESTION_DECISION_TABLES_PATH,
        ATTACHMENT_POLICY_PATH,
        RED_FLAG_RULEBOOK_PATH,
        OUTCOME_COPY_PATH,
    ]
    contract_bundle_hash = compute_contract_bundle_hash(bundle_paths)
    dependency_edges = build_dependency_edges(tracks)
    family_counts: dict[str, int] = {}
    for track in tracks:
        family_counts[track["trackFamily"]] = family_counts.get(track["trackFamily"], 0) + 1

    return {
        "taskId": TASK_ID,
        "generatedAt": now_iso(),
        "capturedOn": CAPTURED_ON,
        "visualMode": VISUAL_MODE,
        "gatePackRef": GATE_PACK_REF,
        "gateVerdict": GATE_VERDICT,
        "openTrackCount": sum(1 for track in tracks if track["eligibilityState"] == "open"),
        "blockedTrackCount": sum(1 for track in tracks if track["eligibilityState"] == "blocked"),
        "hardPrerequisiteTasks": [row["taskId"] for row in prerequisite_rows],
        "contractBundleHash": contract_bundle_hash,
        "contractBundle": {
            "bundleSourceRefs": [path.relative_to(ROOT).as_posix() for path in bundle_paths],
            "frozenPublicSchemaNames": sorted(
                {
                    schema_name
                    for seam in seams
                    for schema_name in seam["reservedPublicSchemaNames"]
                }
            ),
            "canonicalEventNames": sorted(
                {
                    event_name
                    for seam in seams
                    for event_name in seam["reservedEventNames"]
                }
            ),
        },
        "summary": {
            "trackFamilyCounts": family_counts,
            "mergeGateCount": len(MERGE_GATES),
            "seamCount": len(seams),
            "parallelInterfaceGapCount": len(PARALLEL_INTERFACE_GAPS),
            "dependencyEdgeCount": len(dependency_edges),
        },
        "hardPrerequisiteProof": prerequisite_rows,
        "prerequisiteFreezeChecks": [
            {
                "checkId": "SEQ_139_CANONICAL_SUBMIT_EVENT",
                "state": "passed",
                "summary": f"canonical submit event is {prerequisite_contracts['eventCatalog']['canonicalSubmitEvent']}",
            },
            {
                "checkId": "SEQ_140_REQUEST_TYPE_QUARTET",
                "state": "passed",
                "summary": "request-type taxonomy remains Symptoms, Meds, Admin, Results",
            },
            {
                "checkId": "SEQ_141_ATTACHMENT_QUARANTINE_FIRST",
                "state": "passed",
                "summary": "attachment policy retains quarantine-first upload + intake.attachment.quarantined",
            },
            {
                "checkId": "SEQ_142_URGENT_STATE_SPLIT",
                "state": "passed",
                "summary": "urgent_diversion_required and urgent_diverted remain distinct safety/result states",
            },
        ],
        "mergeGates": MERGE_GATES,
        "prohibitions": PROHIBITIONS,
        "modeBoundaries": MODE_BOUNDARIES,
        "parallelInterfaceGaps": PARALLEL_INTERFACE_GAPS,
        "trackRefs": [track["taskId"] for track in tracks],
        "seamRefs": [seam["seamId"] for seam in seams],
        "tracks": tracks,
        "dependencyEdges": dependency_edges,
        "assumptions": [
            {
                "assumptionId": "A_143_SIMULATOR_FIRST_ONLY",
                "summary": "Phase 1 completion in this block assumes simulator-backed runtime, storage, and notification seams only.",
            },
            {
                "assumptionId": "A_143_FROZEN_PREQREQUISITES_GOVERN_ALL_TRACKS",
                "summary": "All tracks consume seq_139-seq_142 machine-readable contracts without silent local variants.",
            },
        ],
        "risks": [
            {
                "riskId": "R_143_FRONTEND_BACKEND_ROUTE_DRIFT",
                "summary": "Receipt or urgent surfaces could drift from backend settlement truth if shell tracks bypass the shared seams.",
                "mitigation": "Bind shell tracks to MG_143_PATIENT_SHELL_INTEGRATION and the shared route/state seam.",
            },
            {
                "riskId": "R_143_RUNTIME_TRANSLATION_DRIFT",
                "summary": "Simulator-first triage, ETA, or notification details could leak into later live-provider semantics.",
                "mitigation": "Keep later provider/auth work explicitly deferred as PARALLEL_INTERFACE_GAP rows and require superseding gate packs.",
            },
        ],
        "conflicts": [
            {
                "conflictId": "C_143_NO_PER_TRACK_DTO_INVENTION",
                "summary": "Tracks may not merge new public DTO or event names unless they are already reserved by the seam list published here.",
            }
        ],
        "sourcePrecedence": SOURCE_PRECEDENCE,
    }


def track_matrix_rows(tracks: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for track in tracks:
        rows.append(
            {
                "task_id": track["taskId"],
                "track_family": track["trackFamily"],
                "track_label": track["trackLabel"],
                "eligibility_state": track["eligibilityState"],
                "capability_owned": track["capabilityOwned"],
                "depends_on_tasks": "; ".join(track["dependsOnTasks"]),
                "required_upstream_contracts": "; ".join(
                    item["contractRef"] for item in track["requiredUpstreamContracts"]
                ),
                "produced_downstream_artifacts": "; ".join(
                    item["artifactRef"] for item in track["producedDownstreamArtifacts"]
                ),
                "shared_packages_or_interfaces": "; ".join(track["sharedPackagesOrInterfacesTouched"]),
                "blocking_merge_dependencies": "; ".join(track["blockingMergeDependencies"]),
                "allowed_parallel_neighbors": "; ".join(track["allowedParallelNeighbors"]),
                "owned_interface_seams": "; ".join(track["ownedInterfaceSeamRefs"]),
                "consumed_interface_seams": "; ".join(track["consumedInterfaceSeamRefs"]),
                "simulator_baseline_only": "true" if track["simulatorBaselineOnly"] else "false",
                "live_provider_later_note": track["liveProviderLaterNote"],
            }
        )
    return rows


def build_gate_markdown(gate_payload: dict[str, Any], seams: list[dict[str, Any]]) -> str:
    prerequisite_rows = [
        [
            row["taskId"],
            row["label"],
            row["state"],
            "; ".join(row["evidenceRefs"][:3]) + ("; ..." if len(row["evidenceRefs"]) > 3 else ""),
        ]
        for row in gate_payload["hardPrerequisiteProof"]
    ]
    merge_gate_rows = [
        [
            gate["mergeGateId"],
            gate["label"],
            gate["type"],
            ", ".join(gate["tracks"]),
        ]
        for gate in gate_payload["mergeGates"]
    ]
    seam_rows = [
        [
            seam["seamId"],
            seam["ownerTaskId"],
            ", ".join(seam["consumerTaskIds"][:4]) + ("..." if len(seam["consumerTaskIds"]) > 4 else ""),
            ", ".join(seam["reservedPublicSchemaNames"][:3]) + ("..." if len(seam["reservedPublicSchemaNames"]) > 3 else ""),
        ]
        for seam in seams
    ]
    return dedent(
        f"""
        # 143 Phase 1 Parallel Intake Gate

        `seq_143` opens the Phase 1 parallel implementation block on explicit frozen contracts, not assumptions. The gate verdict is `{gate_payload["gateVerdict"]}` with `{gate_payload["openTrackCount"]}` open tracks and `{gate_payload["blockedTrackCount"]}` blocked tracks.

        The current contract bundle hash is `{gate_payload["contractBundleHash"]}`.

        ## Hard Prerequisites

        {markdown_table(["Task", "Label", "State", "Evidence"], prerequisite_rows)}

        ## Merge Gates

        {markdown_table(["Merge Gate", "Label", "Type", "Tracks"], merge_gate_rows)}

        ## Prohibitions

        {"".join(f"- {rule}\n" for rule in gate_payload["prohibitions"])}

        ## Shared Interface Seams

        {markdown_table(["Seam", "Owner", "Consumers", "Reserved Names"], seam_rows)}

        ## Parallel Interface Gaps

        {"".join(f"- `{gap['gapId']}`: {gap['summary']}\n" for gap in gate_payload["parallelInterfaceGaps"])}

        ## Mode Boundaries

        ### Mock Now Execution
        {"".join(f"- {item}\n" for item in MODE_BOUNDARIES["Mock_now_execution"]["allowed"])}

        ### Actual Production Strategy Later
        {"".join(f"- {item}\n" for item in MODE_BOUNDARIES["Actual_production_strategy_later"]["allowed"])}
        """
    ).strip()


def build_matrix_markdown(tracks: list[dict[str, Any]]) -> str:
    rows = []
    for track in tracks:
        rows.append(
            [
                track["taskId"],
                TRACK_FAMILY_METADATA[track["trackFamily"]]["label"],
                track["trackLabel"],
                ", ".join(track["dependsOnTasks"]) or "None",
                ", ".join(track["ownedInterfaceSeamRefs"]) or "Consumes only",
                ", ".join(track["blockingMergeDependencies"]),
            ]
        )
    return dedent(
        f"""
        # 143 Phase 1 Track Dependency Matrix

        This matrix is the exact dependency graph for `par_144` through `par_163`. It is the merge and coordination source of truth for the Phase 1 parallel block.

        {markdown_table(["Task", "Family", "Track", "Depends On", "Owned Seams", "Merge Gates"], rows)}

        ## Family Counts

        {"".join(f"- `{family}`: {label['label']} = {sum(1 for track in tracks if track['trackFamily'] == family)} tracks\n" for family, label in TRACK_FAMILY_METADATA.items())}
        """
    ).strip()


def build_claim_protocol_markdown(gate_payload: dict[str, Any], seams: list[dict[str, Any]]) -> str:
    claim_rules = [
        "Claim only one `par_144`-`par_163` row at a time in `prompt/checklist.md` and switch it to `[-]` before editing code.",
        "Do not create new public schema names or event names unless the seam list in seq_143 already reserves them.",
        "If a track needs a cross-track decision that is not already owned by a seam, publish it as `PARALLEL_INTERFACE_GAP_*` rather than hiding it in prose or code.",
        "Treat `seq_139`-`seq_142` as immutable prerequisites. Any semantic change requires a superseding gate pack, not an inline rewrite.",
        "Frontend tracks must consume the same seam owners as backend tracks; shell-only local variants are forbidden.",
        "Later live-provider, auth, or embedded work must supersede this gate pack rather than bypassing the dependency graph.",
    ]
    seam_rules = [
        f"`{seam['seamId']}` is owned by `{seam['ownerTaskId']}` and controls {', '.join(seam['reservedPublicSchemaNames'][:2])}{'...' if len(seam['reservedPublicSchemaNames']) > 2 else ''}."
        for seam in seams
    ]
    return dedent(
        f"""
        # 143 Phase 1 Parallel Claim Protocol

        This protocol operationalizes the `seq_143` gate for autonomous agents and human contributors.

        ## Claim Rules

        {"".join(f"- {rule}\n" for rule in claim_rules)}

        ## Merge Gates

        {"".join(f"- `{gate['mergeGateId']}`: {gate['summary']}\n" for gate in gate_payload["mergeGates"])}

        ## Seam Ownership

        {"".join(f"- {rule}\n" for rule in seam_rules)}

        ## Non-Blocking Deferred Gaps

        {"".join(f"- `{gap['gapId']}` remains `{gap['state']}` and may not be treated as current-scope completion work.\n" for gap in gate_payload["parallelInterfaceGaps"])}
        """
    ).strip()


def build_board_html(gate_payload: dict[str, Any], seams_payload: dict[str, Any]) -> str:
    gate_json = json.dumps(gate_payload)
    seams_json = json.dumps(seams_payload)
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>143 Phase 1 Parallel Gate Board</title>
          <style>
            :root {{
              color-scheme: light;
              --canvas: #F7F8FA;
              --shell: #EEF2F6;
              --panel: #FFFFFF;
              --inset: #F3F6F9;
              --text-strong: #0F1720;
              --text-default: #24313D;
              --text-muted: #5E6B78;
              --accent-open: #2F6FED;
              --accent-merge: #5B61F6;
              --accent-ready: #117A55;
              --accent-blocked: #B42318;
              --accent-caution: #B7791F;
              --border: rgba(15, 23, 32, 0.08);
              --shadow: 0 18px 42px rgba(15, 23, 32, 0.08);
              --hover-ms: 120ms;
              --selection-ms: 180ms;
              --panel-ms: 220ms;
              --max-width: {MAX_WIDTH_PX}px;
              --masthead-height: {MASTHEAD_HEIGHT_PX}px;
              --left-rail-width: {LEFT_RAIL_WIDTH_PX}px;
              --right-rail-width: {RIGHT_INSPECTOR_WIDTH_PX}px;
            }}

            * {{
              box-sizing: border-box;
            }}

            body {{
              margin: 0;
              font-family: "Inter", "Segoe UI", sans-serif;
              background: radial-gradient(circle at top right, rgba(91, 97, 246, 0.14), transparent 28%), var(--canvas);
              color: var(--text-default);
            }}

            body[data-reduced-motion="true"] * {{
              transition-duration: 0ms !important;
              animation-duration: 0ms !important;
              scroll-behavior: auto !important;
            }}

            .board-shell {{
              max-width: var(--max-width);
              margin: 0 auto;
              padding: 20px;
            }}

            .masthead {{
              position: sticky;
              top: 0;
              z-index: 10;
              min-height: var(--masthead-height);
              display: grid;
              grid-template-columns: minmax(0, 1.5fr) repeat(4, minmax(0, 1fr));
              gap: 12px;
              align-items: center;
              padding: 12px 16px;
              margin-bottom: 16px;
              background: rgba(247, 248, 250, 0.92);
              backdrop-filter: blur(16px);
              border: 1px solid var(--border);
              border-radius: 24px;
              box-shadow: var(--shadow);
            }}

            .brand-block,
            .metric-card,
            .panel,
            .table-panel {{
              background: var(--panel);
              border: 1px solid var(--border);
              border-radius: 22px;
              box-shadow: var(--shadow);
            }}

            .brand-block {{
              display: flex;
              align-items: center;
              gap: 14px;
              padding: 10px 14px;
              min-width: 0;
            }}

            .brand-block svg {{
              flex: none;
            }}

            .wordmark {{
              font-size: 1.05rem;
              font-weight: 700;
              color: var(--text-strong);
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }}

            .brand-copy {{
              min-width: 0;
            }}

            .brand-copy p,
            .metric-card p,
            .inspector-list,
            .muted {{
              margin: 0;
              color: var(--text-muted);
              font-size: 0.86rem;
              line-height: 1.45;
            }}

            .brand-copy strong,
            .metric-card strong,
            .inspector-title,
            .table-panel h2,
            .panel h2 {{
              color: var(--text-strong);
            }}

            .metric-card {{
              padding: 12px 14px;
              min-width: 0;
            }}

            .metric-value {{
              display: block;
              font-size: 1.25rem;
              font-weight: 700;
              color: var(--text-strong);
            }}

            .hash-pill {{
              display: block;
              font-family: "SFMono-Regular", "SFMono", "Menlo", monospace;
              font-size: 0.76rem;
              color: var(--accent-open);
              overflow-wrap: anywhere;
            }}

            .board-grid {{
              display: grid;
              grid-template-columns: minmax(0, var(--left-rail-width)) minmax(0, 1fr) minmax(0, var(--right-rail-width));
              gap: 16px;
              align-items: start;
            }}

            .left-rail,
            .inspector {{
              display: grid;
              gap: 16px;
            }}

            .panel,
            .table-panel {{
              padding: 16px;
              min-width: 0;
            }}

            .panel h2,
            .table-panel h2 {{
              margin: 0 0 10px;
              font-size: 1rem;
            }}

            .filter-stack {{
              display: grid;
              gap: 12px;
            }}

            label {{
              display: grid;
              gap: 6px;
              font-size: 0.86rem;
              color: var(--text-muted);
            }}

            select {{
              width: 100%;
              padding: 10px 12px;
              border-radius: 14px;
              border: 1px solid rgba(47, 111, 237, 0.16);
              background: var(--inset);
              color: var(--text-strong);
            }}

            .legend-list,
            .inspector-list {{
              display: grid;
              gap: 10px;
            }}

            .legend-pill {{
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 8px 10px;
              border-radius: 999px;
              background: var(--inset);
              font-size: 0.82rem;
            }}

            .legend-dot {{
              width: 10px;
              height: 10px;
              border-radius: 999px;
              flex: none;
            }}

            .canvas-column {{
              display: grid;
              gap: 16px;
              min-width: 0;
            }}

            .lattice-panel {{
              position: relative;
              min-height: 420px;
              overflow: hidden;
            }}

            .lattice-stage {{
              position: relative;
              display: grid;
              grid-template-columns: repeat(6, minmax(180px, 1fr));
              gap: 14px;
              align-items: start;
            }}

            .wave-column {{
              position: relative;
              display: grid;
              gap: 12px;
              align-content: start;
              min-width: 0;
            }}

            .wave-badge {{
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 999px;
              background: var(--shell);
              color: var(--text-muted);
              font-size: 0.75rem;
              padding: 6px 10px;
              width: fit-content;
            }}

            .task-card {{
              position: relative;
              display: grid;
              gap: 6px;
              width: 100%;
              text-align: left;
              padding: 14px;
              border-radius: 18px;
              border: 1px solid rgba(15, 23, 32, 0.08);
              background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 246, 249, 0.96));
              color: var(--text-strong);
              cursor: pointer;
              transition:
                transform var(--hover-ms) ease,
                border-color var(--selection-ms) ease,
                box-shadow var(--selection-ms) ease,
                background var(--selection-ms) ease;
            }}

            .task-card:hover,
            .task-card:focus-visible {{
              transform: translateY(-1px);
              border-color: rgba(47, 111, 237, 0.3);
              box-shadow: 0 10px 24px rgba(47, 111, 237, 0.12);
            }}

            .task-card[data-selected="true"] {{
              border-color: var(--accent-open);
              box-shadow: 0 14px 28px rgba(47, 111, 237, 0.14);
              background: linear-gradient(180deg, rgba(47, 111, 237, 0.12), rgba(255, 255, 255, 0.98));
            }}

            .task-chip {{
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: fit-content;
              padding: 4px 8px;
              border-radius: 999px;
              background: rgba(47, 111, 237, 0.1);
              color: var(--accent-open);
              font-size: 0.74rem;
              font-weight: 700;
            }}

            .task-title {{
              font-weight: 700;
              line-height: 1.35;
            }}

            .task-family {{
              font-size: 0.8rem;
              color: var(--text-muted);
            }}

            .task-deps {{
              font-size: 0.74rem;
              color: var(--text-muted);
            }}

            .edge-layer {{
              position: absolute;
              inset: 0;
              pointer-events: none;
            }}

            .edge-layer line {{
              stroke: rgba(91, 97, 246, 0.4);
              stroke-width: 1.5;
              vector-effect: non-scaling-stroke;
            }}

            .edge-layer line[data-highlighted="true"] {{
              stroke: rgba(47, 111, 237, 0.9);
              stroke-width: 2.4;
            }}

            .merge-strip {{
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
            }}

            .gate-card {{
              padding: 14px;
              border-radius: 18px;
              background: var(--inset);
              border: 1px solid rgba(15, 23, 32, 0.08);
              transition:
                background var(--selection-ms) ease,
                transform var(--hover-ms) ease;
            }}

            .gate-card[data-highlighted="true"] {{
              background: rgba(91, 97, 246, 0.12);
              transform: translateY(-1px);
            }}

            .gate-card strong {{
              display: block;
              margin-bottom: 6px;
            }}

            .table-grid {{
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
              margin-top: 16px;
            }}

            table {{
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }}

            th,
            td {{
              padding: 10px 8px;
              border-bottom: 1px solid rgba(15, 23, 32, 0.08);
              text-align: left;
              vertical-align: top;
              font-size: 0.83rem;
              overflow-wrap: anywhere;
            }}

            th {{
              color: var(--text-muted);
              font-weight: 600;
            }}

            .row-button {{
              width: 100%;
              text-align: left;
              border: 0;
              background: transparent;
              padding: 0;
              color: inherit;
              cursor: pointer;
            }}

            tr[data-selected="true"] {{
              background: rgba(47, 111, 237, 0.08);
            }}

            .inspector-badge {{
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 6px 10px;
              border-radius: 999px;
              background: rgba(17, 122, 85, 0.1);
              color: var(--accent-ready);
              font-size: 0.78rem;
            }}

            .inspector section {{
              padding-bottom: 14px;
              border-bottom: 1px solid rgba(15, 23, 32, 0.08);
              margin-bottom: 14px;
            }}

            .empty-state {{
              padding: 18px;
              border-radius: 18px;
              background: rgba(180, 35, 24, 0.06);
              color: var(--accent-blocked);
              font-size: 0.9rem;
            }}

            @media (max-width: 1320px) {{
              .masthead {{
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }}

              .board-grid {{
                grid-template-columns: minmax(0, 1fr);
              }}

              .table-grid {{
                grid-template-columns: minmax(0, 1fr);
              }}
            }}

            @media (max-width: 920px) {{
              .board-shell {{
                padding: 14px;
              }}

              .lattice-stage,
              .merge-strip {{
                grid-template-columns: minmax(0, 1fr);
              }}

              .masthead {{
                grid-template-columns: minmax(0, 1fr);
              }}
            }}

            @media (prefers-reduced-motion: reduce) {{
              html:focus-within {{
                scroll-behavior: auto;
              }}
            }}
          </style>
        </head>
        <body data-testid="phase1-parallel-gate-board">
          <script id="gate-json" type="application/json">{gate_json}</script>
          <script id="seams-json" type="application/json">{seams_json}</script>
          <div class="board-shell">
            <header class="masthead" data-testid="board-masthead">
              <div class="brand-block">
                <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="52" height="52" rx="16" fill="#0F1720" />
                  <path d="M14 38L27 16L40 38" stroke="#F7F8FA" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M19 30H35" stroke="#5B61F6" stroke-width="2.2" stroke-linecap="round" />
                  <path d="M23 24H31" stroke="#2F6FED" stroke-width="2.2" stroke-linecap="round" />
                </svg>
                <div class="brand-copy">
                  <div class="wordmark">Vecells</div>
                  <p><strong>track_lattice</strong> Phase 1 parallel intake orchestration board</p>
                </div>
              </div>
              <div class="metric-card">
                <p>Gate verdict</p>
                <span class="metric-value" data-testid="gate-verdict"></span>
              </div>
              <div class="metric-card">
                <p>Open tracks</p>
                <span class="metric-value" data-testid="open-track-count"></span>
              </div>
              <div class="metric-card">
                <p>Blocked tracks</p>
                <span class="metric-value" data-testid="blocked-track-count"></span>
              </div>
              <div class="metric-card">
                <p>Contract bundle hash</p>
                <span class="hash-pill" data-testid="contract-bundle-hash"></span>
              </div>
            </header>

            <div class="board-grid">
              <nav class="left-rail" data-testid="filter-rail" aria-label="Track filters">
                <section class="panel">
                  <h2>Filters</h2>
                  <div class="filter-stack">
                    <label>
                      Track family
                      <select data-testid="track-family-filter"></select>
                    </label>
                    <label>
                      Merge gate
                      <select data-testid="gate-filter"></select>
                    </label>
                    <label>
                      State
                      <select data-testid="state-filter">
                        <option value="all">All</option>
                        <option value="open">Open</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </label>
                  </div>
                </section>
                <section class="panel">
                  <h2>Family legend</h2>
                  <div class="legend-list" data-testid="family-legend"></div>
                </section>
              </nav>

              <main class="canvas-column" data-testid="board-canvas">
                <section class="panel lattice-panel">
                  <h2>Dependency lattice</h2>
                  <p class="muted">Selecting a task synchronizes the lattice, merge-gate strip, inspector, and every lower table.</p>
                  <div id="empty-state" class="empty-state" data-testid="empty-state" hidden>
                    No tracks match the current filters. The gate stays open only for rows backed by the machine-readable matrix.
                  </div>
                  <div class="lattice-stage" data-testid="dependency-lattice"></div>
                  <svg class="edge-layer" data-testid="dependency-edge-visual" aria-hidden="true"></svg>
                </section>
                <section class="panel">
                  <h2>Merge-gate strip</h2>
                  <p class="muted">Every track binds to objective merge gates before it can land.</p>
                  <div class="merge-strip" data-testid="merge-gate-strip"></div>
                </section>
              </main>

              <aside class="inspector panel" data-testid="inspector">
                <section>
                  <div class="inspector-badge" data-testid="selected-track-state">Open</div>
                  <h2 class="inspector-title" data-testid="selected-track-title"></h2>
                  <p class="muted" data-testid="selected-track-summary"></p>
                </section>
                <section>
                  <h2>Required contracts</h2>
                  <div class="inspector-list" data-testid="selected-required-contracts"></div>
                </section>
                <section>
                  <h2>Produced artifacts</h2>
                  <div class="inspector-list" data-testid="selected-produced-artifacts"></div>
                </section>
                <section>
                  <h2>Interface seams</h2>
                  <div class="inspector-list" data-testid="selected-interface-seams"></div>
                </section>
                <section>
                  <h2>Merge gates</h2>
                  <div class="inspector-list" data-testid="selected-merge-gates"></div>
                </section>
              </aside>
            </div>

            <div class="table-grid">
              <section class="table-panel">
                <h2>Track matrix</h2>
                <table data-testid="track-matrix-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Family</th>
                      <th>Depends on</th>
                      <th>Owned seams</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </section>
              <section class="table-panel">
                <h2>Shared-interface seams</h2>
                <table data-testid="shared-seam-table">
                  <thead>
                    <tr>
                      <th>Seam</th>
                      <th>Owner</th>
                      <th>Reserved names</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </section>
              <section class="table-panel">
                <h2>Dependency edge parity</h2>
                <table data-testid="dependency-edge-table">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </section>
              <section class="table-panel">
                <h2>Merge-gate parity</h2>
                <table data-testid="merge-gate-table">
                  <thead>
                    <tr>
                      <th>Merge gate</th>
                      <th>Type</th>
                      <th>Tracks</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </section>
            </div>
          </div>

          <script>
            const gateData = JSON.parse(document.getElementById("gate-json").textContent);
            const seamsData = JSON.parse(document.getElementById("seams-json").textContent);
            const familyMeta = {json.dumps(TRACK_FAMILY_METADATA)};
            const state = {{
              family: "all",
              gate: "all",
              eligibility: "all",
              selectedTaskId: gateData.trackRefs[0],
            }};

            const latticeEl = document.querySelector("[data-testid='dependency-lattice']");
            const edgeLayer = document.querySelector("[data-testid='dependency-edge-visual']");
            const mergeStripEl = document.querySelector("[data-testid='merge-gate-strip']");
            const trackMatrixBody = document.querySelector("[data-testid='track-matrix-table'] tbody");
            const seamTableBody = document.querySelector("[data-testid='shared-seam-table'] tbody");
            const edgeTableBody = document.querySelector("[data-testid='dependency-edge-table'] tbody");
            const mergeGateTableBody = document.querySelector("[data-testid='merge-gate-table'] tbody");
            const familyLegendEl = document.querySelector("[data-testid='family-legend']");
            const emptyStateEl = document.querySelector("[data-testid='empty-state']");
            const familyFilterEl = document.querySelector("[data-testid='track-family-filter']");
            const gateFilterEl = document.querySelector("[data-testid='gate-filter']");
            const stateFilterEl = document.querySelector("[data-testid='state-filter']");

            const trackById = new Map(gateData.tracks.map((track) => [track.taskId, track]));
            const seamById = new Map(seamsData.seams.map((seam) => [seam.seamId, seam]));
            const mergeGateById = new Map(gateData.mergeGates.map((gate) => [gate.mergeGateId, gate]));

            function setReducedMotion() {{
              const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              document.body.dataset.reducedMotion = reduced ? "true" : "false";
            }}

            function populateFilters() {{
              familyFilterEl.innerHTML = '<option value="all">All families</option>' +
                Object.entries(familyMeta)
                  .map(([value, meta]) => `<option value="${{value}}">${{meta.label}}</option>`)
                  .join("");
              gateFilterEl.innerHTML = '<option value="all">All merge gates</option>' +
                gateData.mergeGates
                  .map((gate) => `<option value="${{gate.mergeGateId}}">${{gate.label}}</option>`)
                  .join("");
            }}

            function renderLegend() {{
              familyLegendEl.innerHTML = Object.entries(familyMeta)
                .map(([family, meta]) => `
                  <div class="legend-pill">
                    <span class="legend-dot" style="background:${{meta.color}}"></span>
                    <span><strong>${{meta.label}}</strong><br />${{meta.description}}</span>
                  </div>
                `)
                .join("");
            }}

            function getFilteredTracks() {{
              return gateData.tracks.filter((track) => {{
                if (state.family !== "all" && track.trackFamily !== state.family) return false;
                if (state.gate !== "all" && !track.blockingMergeDependencies.includes(state.gate)) return false;
                if (state.eligibility !== "all" && track.eligibilityState !== state.eligibility) return false;
                return true;
              }});
            }}

            function ensureSelectedTrack(filteredTracks) {{
              if (!filteredTracks.length) return;
              if (!filteredTracks.some((track) => track.taskId === state.selectedTaskId)) {{
                state.selectedTaskId = filteredTracks[0].taskId;
              }}
            }}

            function taskButtonMarkup(track) {{
              const meta = familyMeta[track.trackFamily];
              const dependsText = track.dependsOnTasks.length ? track.dependsOnTasks.join(", ") : "None";
              return `
                <button
                  type="button"
                  class="task-card task-selector"
                  data-testid="task-card-${{track.taskId}}"
                  data-task-id="${{track.taskId}}"
                  data-selected="${{String(track.taskId === state.selectedTaskId)}}"
                  style="border-top: 3px solid ${{meta.color}}"
                >
                  <span class="task-chip">${{track.taskId}}</span>
                  <span class="task-title">${{track.trackLabel}}</span>
                  <span class="task-family">${{meta.label}}</span>
                  <span class="task-deps">Depends on: ${{dependsText}}</span>
                </button>
              `;
            }}

            function renderLattice(filteredTracks) {{
              const grouped = new Map();
              filteredTracks.forEach((track) => {{
                const key = String(track.waveIndex);
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key).push(track);
              }});
              const waveIndexes = [...grouped.keys()].sort((a, b) => Number(a) - Number(b));
              latticeEl.innerHTML = waveIndexes
                .map((waveIndex) => `
                  <div class="wave-column" data-wave-index="${{waveIndex}}">
                    <div class="wave-badge">Wave ${{Number(waveIndex) + 1}}</div>
                    ${{grouped.get(waveIndex).map(taskButtonMarkup).join("")}}
                  </div>
                `)
                .join("");
            }}

            function visibleEdges(filteredTracks) {{
              const visibleIds = new Set(filteredTracks.map((track) => track.taskId));
              return gateData.dependencyEdges.filter(
                (edge) => visibleIds.has(edge.fromTaskId) && visibleIds.has(edge.toTaskId),
              );
            }}

            function renderEdges(filteredTracks) {{
              const edges = visibleEdges(filteredTracks);
              const latticeRect = latticeEl.getBoundingClientRect();
              edgeLayer.setAttribute("viewBox", `0 0 ${{Math.max(latticeRect.width, 1)}} ${{Math.max(latticeRect.height, 1)}}`);
              edgeLayer.setAttribute("width", String(Math.max(latticeRect.width, 1)));
              edgeLayer.setAttribute("height", String(Math.max(latticeRect.height, 1)));
              edgeLayer.innerHTML = edges.map((edge) => {{
                const fromEl = latticeEl.querySelector(`[data-task-id="${{edge.fromTaskId}}"]`);
                const toEl = latticeEl.querySelector(`[data-task-id="${{edge.toTaskId}}"]`);
                if (!fromEl || !toEl) return "";
                const fromRect = fromEl.getBoundingClientRect();
                const toRect = toEl.getBoundingClientRect();
                const x1 = fromRect.right - latticeRect.left;
                const y1 = fromRect.top + (fromRect.height / 2) - latticeRect.top;
                const x2 = toRect.left - latticeRect.left;
                const y2 = toRect.top + (toRect.height / 2) - latticeRect.top;
                const highlighted = edge.fromTaskId === state.selectedTaskId || edge.toTaskId === state.selectedTaskId;
                return `<line data-testid="dependency-edge-${{edge.fromTaskId}}-${{edge.toTaskId}}" data-highlighted="${{String(highlighted)}}" x1="${{x1}}" y1="${{y1}}" x2="${{x2}}" y2="${{y2}}"></line>`;
              }}).join("");
            }}

            function renderMergeGateStrip(filteredTracks) {{
              mergeStripEl.innerHTML = gateData.mergeGates.map((gate) => {{
                const visibleTrackCount = filteredTracks.filter((track) =>
                  gate.tracks.includes(track.taskId),
                ).length;
                const highlighted = trackById.get(state.selectedTaskId).blockingMergeDependencies.includes(gate.mergeGateId);
                return `
                  <article class="gate-card" data-testid="merge-gate-card-${{gate.mergeGateId}}" data-highlighted="${{String(highlighted)}}">
                    <strong>${{gate.label}}</strong>
                    <p class="muted">${{gate.summary}}</p>
                    <p class="muted">${{visibleTrackCount}} visible track${{visibleTrackCount === 1 ? "" : "s"}}</p>
                  </article>
                `;
              }}).join("");
            }}

            function renderTrackMatrix(filteredTracks) {{
              trackMatrixBody.innerHTML = filteredTracks.map((track) => `
                <tr data-testid="track-row-${{track.taskId}}" data-selected="${{String(track.taskId === state.selectedTaskId)}}">
                  <td>
                    <button type="button" class="row-button task-selector" data-task-id="${{track.taskId}}">
                      <strong>${{track.taskId}}</strong><br />${{track.trackLabel}}
                    </button>
                  </td>
                  <td>${{familyMeta[track.trackFamily].label}}</td>
                  <td>${{track.dependsOnTasks.join(", ") || "None"}}</td>
                  <td>${{track.ownedInterfaceSeamRefs.join(", ") || "Consumes only"}}</td>
                </tr>
              `).join("");
            }}

            function renderSeamTable(selectedTrack) {{
              const seamIds = new Set([
                ...selectedTrack.ownedInterfaceSeamRefs,
                ...selectedTrack.consumedInterfaceSeamRefs,
              ]);
              const seams = seamsData.seams.filter((seam) => seamIds.has(seam.seamId));
              seamTableBody.innerHTML = seams.map((seam) => `
                <tr data-testid="seam-row-${{seam.seamId}}">
                  <td><strong>${{seam.seamId}}</strong><br />${{seam.label}}</td>
                  <td>${{seam.ownerTaskId}}</td>
                  <td>${{[...seam.reservedPublicSchemaNames, ...seam.reservedEventNames].join(", ") || "None"}}</td>
                </tr>
              `).join("");
            }}

            function renderEdgeTable(filteredTracks) {{
              const edges = visibleEdges(filteredTracks);
              edgeTableBody.innerHTML = edges.map((edge) => `
                <tr data-testid="dependency-edge-row-${{edge.fromTaskId}}-${{edge.toTaskId}}" data-selected="${{String(edge.fromTaskId === state.selectedTaskId || edge.toTaskId === state.selectedTaskId)}}">
                  <td>${{edge.fromTaskId}}</td>
                  <td>${{edge.toTaskId}}</td>
                  <td>${{edge.edgeType}}</td>
                </tr>
              `).join("");
            }}

            function renderMergeGateTable() {{
              mergeGateTableBody.innerHTML = gateData.mergeGates.map((gate) => `
                <tr data-testid="merge-gate-row-${{gate.mergeGateId}}" data-selected="${{String(trackById.get(state.selectedTaskId).blockingMergeDependencies.includes(gate.mergeGateId))}}">
                  <td><strong>${{gate.mergeGateId}}</strong><br />${{gate.label}}</td>
                  <td>${{gate.type}}</td>
                  <td>${{gate.tracks.join(", ")}}</td>
                </tr>
              `).join("");
            }}

            function renderInspector(selectedTrack) {{
              document.querySelector("[data-testid='selected-track-state']").textContent = selectedTrack.eligibilityState.toUpperCase();
              document.querySelector("[data-testid='selected-track-title']").textContent = `${{selectedTrack.taskId}} ${{selectedTrack.trackLabel}}`;
              document.querySelector("[data-testid='selected-track-summary']").textContent = selectedTrack.capabilityOwned;

              document.querySelector("[data-testid='selected-required-contracts']").innerHTML =
                selectedTrack.requiredUpstreamContracts
                  .map((contract) => `<div><strong>${{contract.contractRef}}</strong><br />${{contract.sourceRef}}</div>`)
                  .join("");
              document.querySelector("[data-testid='selected-produced-artifacts']").innerHTML =
                selectedTrack.producedDownstreamArtifacts
                  .map((artifact) => `<div><strong>${{artifact.artifactRef}}</strong><br />${{artifact.intent}}</div>`)
                  .join("");
              document.querySelector("[data-testid='selected-interface-seams']").innerHTML =
                [...selectedTrack.ownedInterfaceSeamRefs, ...selectedTrack.consumedInterfaceSeamRefs]
                  .map((seamId) => {{
                    const seam = seamById.get(seamId);
                    return seam ? `<div><strong>${{seam.seamId}}</strong><br />${{seam.label}}</div>` : "";
                  }})
                  .join("");
              document.querySelector("[data-testid='selected-merge-gates']").innerHTML =
                selectedTrack.blockingMergeDependencies
                  .map((gateId) => {{
                    const gate = mergeGateById.get(gateId);
                    return `<div><strong>${{gate.mergeGateId}}</strong><br />${{gate.label}}</div>`;
                  }})
                  .join("");
            }}

            function syncSelectionHandlers() {{
              document.querySelectorAll(".task-selector").forEach((button) => {{
                button.addEventListener("click", () => {{
                  state.selectedTaskId = button.dataset.taskId;
                  render();
                }});
                button.addEventListener("keydown", (event) => {{
                  if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) {{
                    return;
                  }}
                  const focusable = [...document.querySelectorAll(".task-selector")];
                  const index = focusable.indexOf(button);
                  if (index === -1) {{
                    return;
                  }}
                  event.preventDefault();
                  const delta = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
                  const nextIndex = Math.min(Math.max(index + delta, 0), focusable.length - 1);
                  const next = focusable[nextIndex];
                  if (next) {{
                    next.focus();
                    state.selectedTaskId = next.dataset.taskId;
                    render();
                  }}
                }});
              }});
            }}

            function renderMetrics() {{
              document.querySelector("[data-testid='gate-verdict']").textContent = gateData.gateVerdict;
              document.querySelector("[data-testid='open-track-count']").textContent = String(gateData.openTrackCount);
              document.querySelector("[data-testid='blocked-track-count']").textContent = String(gateData.blockedTrackCount);
              document.querySelector("[data-testid='contract-bundle-hash']").textContent = gateData.contractBundleHash;
            }}

            function render() {{
              const filteredTracks = getFilteredTracks();
              ensureSelectedTrack(filteredTracks);
              renderMetrics();

              const selectedTrack = trackById.get(state.selectedTaskId) || gateData.tracks[0];
              emptyStateEl.hidden = filteredTracks.length !== 0;
              latticeEl.hidden = filteredTracks.length === 0;
              edgeLayer.hidden = filteredTracks.length === 0;

              if (!filteredTracks.length) {{
                latticeEl.innerHTML = "";
                edgeLayer.innerHTML = "";
                mergeStripEl.innerHTML = "";
                trackMatrixBody.innerHTML = "";
                seamTableBody.innerHTML = "";
                edgeTableBody.innerHTML = "";
                mergeGateTableBody.innerHTML = "";
                return;
              }}

              renderLattice(filteredTracks);
              renderMergeGateStrip(filteredTracks);
              renderTrackMatrix(filteredTracks);
              renderSeamTable(selectedTrack);
              renderEdgeTable(filteredTracks);
              renderMergeGateTable();
              renderInspector(selectedTrack);
              syncSelectionHandlers();
              requestAnimationFrame(() => renderEdges(filteredTracks));
            }}

            familyFilterEl.addEventListener("change", (event) => {{
              state.family = event.target.value;
              render();
            }});
            gateFilterEl.addEventListener("change", (event) => {{
              state.gate = event.target.value;
              render();
            }});
            stateFilterEl.addEventListener("change", (event) => {{
              state.eligibility = event.target.value;
              render();
            }});

            window.addEventListener("resize", () => {{
              const filteredTracks = getFilteredTracks();
              if (filteredTracks.length) {{
                requestAnimationFrame(() => renderEdges(filteredTracks));
              }}
            }});

            setReducedMotion();
            populateFilters();
            renderLegend();
            render();
          </script>
        </body>
        </html>
        """
    ).strip()


def build_seams_payload(seams: list[dict[str, Any]]) -> dict[str, Any]:
    schema_names = sorted({name for seam in seams for name in seam["reservedPublicSchemaNames"]})
    event_names = sorted({name for seam in seams for name in seam["reservedEventNames"]})
    return {
        "taskId": TASK_ID,
        "generatedAt": now_iso(),
        "capturedOn": CAPTURED_ON,
        "visualMode": VISUAL_MODE,
        "ownershipRules": [
            "One seam owner controls every public schema name reserved in the Phase 1 parallel block.",
            "Canonical submit and urgent-diversion event names remain owned by seq_139 and may not be redefined by parallel tracks.",
            "Consumers may implement against a seam, but only the seam owner may redefine its public contract surface.",
        ],
        "reservedPublicSchemaNames": schema_names,
        "reservedEventNames": event_names,
        "seams": seams,
        "parallelInterfaceGaps": PARALLEL_INTERFACE_GAPS,
    }


def main() -> None:
    prerequisite_rows = assert_hard_prerequisites()
    prerequisite_contracts = validate_prerequisite_contracts()
    tracks = build_tracks()
    seams = build_seams()
    ensure_unique_reserved_names(seams)

    track_ids = {track["taskId"] for track in tracks}
    seam_ids = {seam["seamId"] for seam in seams}
    for track in tracks:
        for dependency in track["dependsOnTasks"]:
            require(dependency in track_ids, f"PREREQUISITE_GAP_143_UNKNOWN_DEPENDENCY::{track['taskId']}::{dependency}")
        for neighbor in track["allowedParallelNeighbors"]:
            require(neighbor in track_ids, f"PREREQUISITE_GAP_143_UNKNOWN_NEIGHBOR::{track['taskId']}::{neighbor}")
        for seam_id in [*track["ownedInterfaceSeamRefs"], *track["consumedInterfaceSeamRefs"]]:
            require(seam_id in seam_ids, f"PREREQUISITE_GAP_143_UNKNOWN_SEAM::{track['taskId']}::{seam_id}")
        for merge_gate_id in track["blockingMergeDependencies"]:
            require(
                any(gate["mergeGateId"] == merge_gate_id for gate in MERGE_GATES),
                f"PREREQUISITE_GAP_143_UNKNOWN_MERGE_GATE::{track['taskId']}::{merge_gate_id}",
            )

    gate_payload = build_gate_payload(prerequisite_rows, prerequisite_contracts, tracks, seams)
    seams_payload = build_seams_payload(seams)
    matrix_rows = track_matrix_rows(tracks)

    write_json(GATE_JSON_PATH, gate_payload)
    write_json(SEAMS_JSON_PATH, seams_payload)
    write_csv(
        TRACK_MATRIX_PATH,
        [
            "task_id",
            "track_family",
            "track_label",
            "eligibility_state",
            "capability_owned",
            "depends_on_tasks",
            "required_upstream_contracts",
            "produced_downstream_artifacts",
            "shared_packages_or_interfaces",
            "blocking_merge_dependencies",
            "allowed_parallel_neighbors",
            "owned_interface_seams",
            "consumed_interface_seams",
            "simulator_baseline_only",
            "live_provider_later_note",
        ],
        matrix_rows,
    )
    write_text(GATE_DOC_PATH, build_gate_markdown(gate_payload, seams))
    write_text(MATRIX_DOC_PATH, build_matrix_markdown(tracks))
    write_text(CLAIM_PROTOCOL_DOC_PATH, build_claim_protocol_markdown(gate_payload, seams))
    write_text(BOARD_HTML_PATH, build_board_html(gate_payload, seams_payload))

    print(
        json.dumps(
            {
                "taskId": TASK_ID,
                "gateVerdict": gate_payload["gateVerdict"],
                "openTrackCount": gate_payload["openTrackCount"],
                "blockedTrackCount": gate_payload["blockedTrackCount"],
                "contractBundleHash": gate_payload["contractBundleHash"],
                "generatedArtifacts": [
                    GATE_JSON_PATH.relative_to(ROOT).as_posix(),
                    SEAMS_JSON_PATH.relative_to(ROOT).as_posix(),
                    TRACK_MATRIX_PATH.relative_to(ROOT).as_posix(),
                    GATE_DOC_PATH.relative_to(ROOT).as_posix(),
                    MATRIX_DOC_PATH.relative_to(ROOT).as_posix(),
                    CLAIM_PROTOCOL_DOC_PATH.relative_to(ROOT).as_posix(),
                    BOARD_HTML_PATH.relative_to(ROOT).as_posix(),
                ],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
