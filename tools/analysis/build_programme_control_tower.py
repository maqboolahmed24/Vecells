#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import textwrap
from collections import defaultdict, deque
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
PROMPT_DIR = ROOT / "prompt"
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "programme"

CHECKLIST_PATH = PROMPT_DIR / "checklist.md"
PHASE_CARDS_PATH = ROOT / "blueprint" / "phase-cards.md"
PHASE0_PATH = ROOT / "blueprint" / "phase-0-the-foundation-protocol.md"
RUNTIME_PATH = ROOT / "blueprint" / "platform-runtime-and-release-blueprint.md"
ASSURANCE_PATH = ROOT / "blueprint" / "phase-9-the-assurance-ledger.md"

REQUIRED_INPUTS = {
    "requirement_registry": DATA_DIR / "requirement_registry.jsonl",
    "product_scope": DATA_DIR / "product_scope_matrix.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "external_assurance_obligations": DATA_DIR / "external_assurance_obligations.csv",
    "regulatory_workstreams": DATA_DIR / "regulatory_workstreams.json",
    "safety_hazards": DATA_DIR / "safety_hazard_register_seed.csv",
    "change_control_matrix": DATA_DIR / "change_control_trigger_matrix.csv",
    "cross_phase_conformance_seed": DATA_DIR / "cross_phase_conformance_seed.json",
    "adr_index": DATA_DIR / "adr_index.json",
    "release_gate_matrix": DATA_DIR / "release_gate_matrix.csv",
    "tooling_scorecard": DATA_DIR / "tooling_scorecard.csv",
}

PROGRAMME_JSON_PATH = DATA_DIR / "programme_milestones.json"
TASK_MAP_PATH = DATA_DIR / "task_to_milestone_map.csv"
EDGE_PATH = DATA_DIR / "milestone_dependency_edges.csv"
TRACK_PATH = DATA_DIR / "parallel_track_matrix.csv"
GATE_PATH = DATA_DIR / "merge_gate_matrix.csv"
CRITICAL_PATH_PATH = DATA_DIR / "critical_path_summary.json"

MILESTONE_DOC_PATH = DOCS_DIR / "17_programme_milestones_and_gate_model.md"
PARALLEL_DOC_PATH = DOCS_DIR / "17_parallel_track_plan.md"
GATE_DOC_PATH = DOCS_DIR / "17_merge_gate_policy.md"
PHASE0_DOC_PATH = DOCS_DIR / "17_phase0_subphase_execution_plan.md"
CRITICAL_DOC_PATH = DOCS_DIR / "17_critical_path_and_long_lead_plan.md"
DECISION_LOG_DOC_PATH = DOCS_DIR / "17_programme_decision_log.md"
CONTROL_TOWER_HTML_PATH = DOCS_DIR / "17_programme_control_tower.html"
DEPENDENCY_GRAPH_PATH = DOCS_DIR / "17_programme_dependency_graph.mmd"
TIMELINE_GRAPH_PATH = DOCS_DIR / "17_programme_timeline.mmd"

PROGRAMME_ID = "programme_milestones_v1"
PROGRAMME_TITLE = "Vecells Programme Control Tower"
PROGRAMME_MISSION = (
    "Turn the serialized checklist roadmap into one executable milestone graph with "
    "strict sequence, scoped exceptions, parallel blocks, merge gates, long-lead "
    "dependency visibility, and current-baseline critical-path truth."
)

SOURCE_PRECEDENCE = [
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "prompt/017.md",
    "prompt/shared_operating_contract_016_to_020.md",
    "blueprint/phase-cards.md#Programme Baseline Update (NHS App Deferred)",
    "blueprint/phase-cards.md#Cross-Phase Conformance Scorecard",
    "blueprint/phase-cards.md#Programme Summary-Layer Alignment",
    "blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol",
    "blueprint/phase-0-the-foundation-protocol.md#The detailed Phase 0 development algorithm",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
    "blueprint/platform-admin-and-config-blueprint.md#Production promotion gate",
    "blueprint/phase-9-the-assurance-ledger.md#CrossPhaseConformanceScorecard",
    "blueprint/phase-9-the-assurance-ledger.md#9I. Full-program exercises, BAU transfer, and formal exit gate",
    "blueprint/forensic-audit-findings.md#Findings 91, 95, 104-120",
]

PHASE_ORDER = [
    "planning",
    "external_readiness",
    "phase_0",
    "phase_1",
    "phase_2",
    "cross_phase_controls",
    "phase_3",
    "phase_4",
    "phase_5",
    "phase_6",
    "phase_7",
    "phase_8",
    "phase_9",
    "programme_release",
]

PHASE_TITLES = {
    "planning": "Planning And Gate Foundation",
    "external_readiness": "External Readiness",
    "phase_0": "Phase 0 - The Foundation Protocol",
    "phase_1": "Phase 1 - The Red Flag Gate",
    "phase_2": "Phase 2 - Identity And Echoes",
    "cross_phase_controls": "Cross-Phase Portal And Support Controls",
    "phase_3": "Phase 3 - The Human Checkpoint",
    "phase_4": "Phase 4 - The Booking Engine",
    "phase_5": "Phase 5 - The Network Horizon",
    "phase_6": "Phase 6 - The Pharmacy Loop",
    "phase_7": "Phase 7 - Inside The NHS App",
    "phase_8": "Phase 8 - The Assistive Layer",
    "phase_9": "Phase 9 - The Assurance Ledger",
    "programme_release": "Programme Release And BAU",
}

RULE_TEXT = {
    "RULE_SEQ_SCOPE_AWARE_ORDER": (
        "No later current-baseline sequence milestone may advance ahead of an earlier "
        "current-baseline sequence milestone. Deferred and optional sequence rows stay "
        "inventoried, but they do not block current-baseline advancement."
    ),
    "RULE_PAR_BLOCK_COMPLETE": (
        "No merge or later sequence gate may advance until the active contiguous parallel "
        "block and its declared long-lead companion tracks are complete."
    ),
    "RULE_CONFORMANCE_ROW_FRESH": (
        "No phase exit or programme completion claim is valid while the bound phase "
        "conformance row or cross-phase scorecard is stale or blocked."
    ),
    "RULE_DEFERRED_PHASE7_NO_PROXY": (
        "Deferred Phase 7 artifacts may not be used as proxy evidence for current-baseline "
        "milestones, gates, release readiness, or BAU closure."
    ),
    "RULE_LONG_LEAD_VISIBLE": (
        "Long-lead approvals and assurance workstreams must be named as first-class "
        "milestones or tracks rather than hidden inside implementation milestones."
    ),
    "RULE_RUNTIME_PUBLICATION_AND_OPS_PROOF": (
        "Final promotion and BAU readiness require runtime publication, verification, "
        "governance proof, operational proof, and recovery readiness on the same tuple."
    ),
    "RULE_WAVE_TUPLE_CURRENT": (
        "Wave execution requires the current ReleaseWatchTuple, WaveObservationPolicy, "
        "and OperationalReadinessSnapshot for the exact blast radius in scope."
    ),
}

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_017_SCOPE_AWARE_SEQUENCE",
        "decision": (
            "Deferred or optional sequence milestones stay visible in canonical order, but "
            "the current-baseline dependency graph bypasses them so the NHS App deferred "
            "channel and optional assistive enablement do not become hidden blockers."
        ),
        "source_refs": [
            "blueprint/phase-cards.md#Programme Baseline Update (NHS App Deferred)",
            "prompt/017.md#Non-negotiable programme rules",
        ],
    },
    {
        "assumption_id": "ASSUMPTION_017_PHASE0_BRIDGING_SUBPHASE_NAMES",
        "decision": (
            "Phase 0 source text explicitly names 0A, 0B, and 0G and states there are seven "
            "hard-gated internal sub-phases. The intermediate 0C-0F titles are derived "
            "bridging labels over the runtime, control-plane, verification, and shell "
            "obligations already present in the source algorithm."
        ),
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#The detailed Phase 0 development algorithm",
            "blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol",
        ],
    },
    {
        "assumption_id": "ASSUMPTION_017_LONG_LEAD_SPLIT",
        "decision": (
            "External onboarding milestones and Phase 0 assurance tracks are modeled as "
            "separate long-lead milestones so gates can bind concrete dependency evidence "
            "instead of hiding approvals inside generic implementation status."
        ),
        "source_refs": [
            "prompt/017.md#Execution steps",
            "blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol",
        ],
    },
]

CHECKLIST_PATTERN = re.compile(r"- \[(.| )\] (seq|par)_(\d{3})_(.+?) \(prompt/(\d+)\.md\)$")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    headers: list[str] = []
    for row in rows:
        for key in row:
            if key not in headers:
                headers.append(key)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    separator = ["---"] * len(headers)
    body = [headers, separator]
    body.extend([[str(cell) for cell in row] for row in rows])
    return "\n".join("| " + " | ".join(row) + " |" for row in body)


def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def flatten(values: list[list[str]]) -> list[str]:
    flattened: list[str] = []
    for value in values:
        flattened.extend(value)
    return flattened


def phase_for_task(num: int, slug: str) -> str:
    if num <= 20:
        return "planning"
    if num <= 40:
        return "external_readiness"
    if slug.startswith("phase0_") or 41 <= num <= 138:
        return "phase_0"
    if slug.startswith("phase1_") or 139 <= num <= 169:
        return "phase_1"
    if slug.startswith("phase2_") or 170 <= num <= 208:
        return "phase_2"
    if slug.startswith("crosscutting_") or 209 <= num <= 225:
        return "cross_phase_controls"
    if slug.startswith("phase3_") or 226 <= num <= 277:
        return "phase_3"
    if slug.startswith("phase4_") or 278 <= num <= 310:
        return "phase_4"
    if slug.startswith("phase5_") or 311 <= num <= 341:
        return "phase_5"
    if slug.startswith("phase6_") or 342 <= num <= 372:
        return "phase_6"
    if slug.startswith("phase7_") or 373 <= num <= 402:
        return "phase_7"
    if slug.startswith("phase8_") or 403 <= num <= 431:
        return "phase_8"
    if slug.startswith("phase9_") or 432 <= num <= 471:
        return "phase_9"
    return "programme_release"


def status_for_marker(marker: str) -> str:
    if marker == "X":
        return "complete"
    if marker == "-":
        return "in_progress"
    return "not_started"


def parse_checklist() -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    for line in CHECKLIST_PATH.read_text().splitlines():
        match = CHECKLIST_PATTERN.match(line)
        if not match:
            continue
        marker, kind, number, slug, prompt_number = match.groups()
        num = int(number)
        task_ref = f"{kind}_{num:03d}"
        tasks.append(
            {
                "task_ref": task_ref,
                "task_id": task_ref,
                "kind": kind,
                "num": num,
                "slug": slug,
                "status_marker": marker,
                "status": status_for_marker(marker),
                "prompt_ref": f"prompt/{prompt_number}.md",
                "phase_ref": phase_for_task(num, slug),
                "title": slug.replace("_", " "),
            }
        )
    if len(tasks) != 489:
        raise SystemExit(f"PREREQUISITE_GAP_CHECKLIST_COUNT: expected 489 tasks, found {len(tasks)}")
    return tasks


def ensure_prerequisites() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    if missing:
        raise SystemExit("PREREQUISITE_GAP_MISSING_INPUTS: " + ", ".join(missing))

    product_scope = load_json(REQUIRED_INPUTS["product_scope"])
    baseline = set(product_scope.get("baseline_phases", []))
    deferred = set(product_scope.get("deferred_phases", []))
    if "phase_7" in baseline:
        raise SystemExit("PREREQUISITE_GAP_SCOPE_BASELINE: phase_7 must not be in the current baseline")
    if "phase_7" not in deferred:
        raise SystemExit("PREREQUISITE_GAP_SCOPE_DEFERRED: phase_7 must remain deferred")

    tasks = parse_checklist()

    requirement_rows = load_jsonl(REQUIRED_INPUTS["requirement_registry"])
    requirement_index = []
    for row in requirement_rows:
        search_blob = json.dumps(row, sort_keys=True).lower()
        requirement_index.append((row["requirement_id"], search_blob))

    dependencies_payload = load_json(REQUIRED_INPUTS["external_dependencies"])
    dependencies = dependencies_payload["dependencies"]
    dependency_ids = {row["dependency_id"] for row in dependencies}

    workstreams_payload = load_json(REQUIRED_INPUTS["regulatory_workstreams"])
    workstream_ids = {row["workstream_id"] for row in workstreams_payload["workstreams"]}

    hazard_rows = load_csv(REQUIRED_INPUTS["safety_hazards"])
    hazard_ids = {row["hazard_id"] for row in hazard_rows}

    conformance_payload = load_json(REQUIRED_INPUTS["cross_phase_conformance_seed"])
    conformance_rows = conformance_payload["rows"]

    adr_payload = load_json(REQUIRED_INPUTS["adr_index"])
    release_gate_rows = load_csv(REQUIRED_INPUTS["release_gate_matrix"])

    return {
        "tasks": tasks,
        "product_scope": product_scope,
        "requirement_index": requirement_index,
        "dependencies_payload": dependencies_payload,
        "dependency_ids": dependency_ids,
        "workstream_ids": workstream_ids,
        "hazard_rows": hazard_rows,
        "hazard_ids": hazard_ids,
        "conformance_rows": conformance_rows,
        "adr_payload": adr_payload,
        "release_gate_rows": release_gate_rows,
    }


def task_refs(tasks_by_num: dict[int, dict[str, Any]], ranges: list[tuple[int, int]]) -> list[str]:
    refs: list[str] = []
    for start, end in ranges:
        for num in range(start, end + 1):
            refs.append(tasks_by_num[num]["task_ref"])
    return refs


def first_task_ref(refs: list[str]) -> str:
    return refs[0] if refs else ""


def last_task_ref(refs: list[str]) -> str:
    return refs[-1] if refs else ""


def range_label(refs: list[str]) -> str:
    if not refs:
        return ""
    return refs[0] if len(refs) == 1 else f"{refs[0]} -> {refs[-1]}"


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def resolve_requirement_ids(requirement_index: list[tuple[str, str]], tokens: list[str], limit: int = 6) -> list[str]:
    resolved: list[str] = []
    for token in tokens:
        needle = normalize(token)
        matches = [req_id for req_id, blob in requirement_index if needle and needle in normalize(blob)]
        resolved.extend(matches[:2])
    return unique(resolved)[:limit]


def conformance_row_ref(phase_id: str) -> str:
    return f"PHASE_CONFORMANCE_ROW_{phase_id.upper()}"


def scorecard_ref(scope: str) -> str:
    return f"CROSS_PHASE_CONFORMANCE_SCORECARD_{scope.upper()}"


def phase_risk_map(conformance_rows: list[dict[str, Any]]) -> dict[str, list[str]]:
    risk_map: dict[str, list[str]] = {}
    for row in conformance_rows:
        risk_map[row["phase_id"]] = [entry.split()[0] for entry in row.get("open_risks", [])]
    return risk_map


def milestone_spec(
    milestone_id: str,
    title: str,
    milestone_class: str,
    baseline_scope: str,
    phase_refs: list[str],
    task_ranges: list[tuple[int, int]],
    merge_gate_ref: str,
    gate_owner_role: str,
    requirement_tokens: list[str],
    source_refs: list[str],
    entry_condition_refs: list[str],
    exit_condition_refs: list[str],
    required_artifact_refs: list[str],
    required_dependency_refs: list[str] | None = None,
    required_risk_ids: list[str] | None = None,
    allowed_parallel_track_refs: list[str] | None = None,
    conformance_row_refs: list[str] | None = None,
    notes: str = "",
) -> dict[str, Any]:
    return {
        "milestone_id": milestone_id,
        "milestone_title": title,
        "milestone_class": milestone_class,
        "baseline_scope": baseline_scope,
        "phase_refs": phase_refs,
        "task_ranges": task_ranges,
        "merge_gate_ref": merge_gate_ref,
        "gate_owner_role": gate_owner_role,
        "requirement_tokens": requirement_tokens,
        "source_refs": source_refs,
        "entry_condition_refs": entry_condition_refs,
        "exit_condition_refs": exit_condition_refs,
        "required_artifact_refs": required_artifact_refs,
        "required_dependency_refs": required_dependency_refs or [],
        "required_risk_ids": required_risk_ids or [],
        "allowed_parallel_track_refs": allowed_parallel_track_refs or [],
        "conformance_row_refs": conformance_row_refs or [],
        "notes": notes,
    }


def gate_spec(
    gate_id: str,
    title: str,
    gate_type: str,
    baseline_scope: str,
    incoming_milestone_refs: list[str],
    required_artifact_refs: list[str],
    required_dependency_refs: list[str],
    required_risk_posture_refs: list[str],
    required_conformance_refs: list[str],
    blocking_rule_refs: list[str],
    owner_role: str,
    failure_mode_if_skipped: str,
    notes: str,
) -> dict[str, Any]:
    return {
        "merge_gate_id": gate_id,
        "gate_title": title,
        "gate_type": gate_type,
        "baseline_scope": baseline_scope,
        "incoming_milestone_refs": incoming_milestone_refs,
        "required_artifact_refs": required_artifact_refs,
        "required_dependency_refs": required_dependency_refs,
        "required_risk_posture_refs": required_risk_posture_refs,
        "required_conformance_refs": required_conformance_refs,
        "blocking_rule_refs": blocking_rule_refs,
        "gate_owner_role": owner_role,
        "failure_mode_if_skipped": failure_mode_if_skipped,
        "notes": notes,
    }


def track_spec(
    track_id: str,
    track_title: str,
    phase_ref: str,
    baseline_scope: str,
    milestone_ref: str,
    task_ranges: list[tuple[int, int]],
    track_class: str,
    long_lead_state: str,
    dependency_refs: list[str],
    notes: str,
) -> dict[str, Any]:
    return {
        "track_id": track_id,
        "track_title": track_title,
        "phase_ref": phase_ref,
        "baseline_scope": baseline_scope,
        "milestone_ref": milestone_ref,
        "task_ranges": task_ranges,
        "track_class": track_class,
        "long_lead_state": long_lead_state,
        "dependency_refs": dependency_refs,
        "notes": notes,
    }


def build_specs(prereqs: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    phase_risks = phase_risk_map(prereqs["conformance_rows"])
    planning_risks = unique(phase_risks["phase_0"][:4] + ["RISK_ASSURANCE_001"])
    current_scorecard = scorecard_ref("current_baseline")
    full_scorecard = scorecard_ref("full_programme")

    tracks = [
        track_spec("TRK_P0_BACKEND_DOMAIN_KERNEL", "Phase 0 backend domain kernel", "phase_0", "current", "MS_P0_0B_DOMAIN_KERNEL", [(62, 82)], "backend", "near_path", [], "Canonical aggregate and coordinator buildout."),
        track_spec("TRK_P0_RUNTIME_RELEASE", "Phase 0 runtime and release substrate", "phase_0", "current", "MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE", [(83, 94)], "runtime", "near_path", [], "Runtime publication, release tuple, and topology work."),
        track_spec("TRK_P0_RUNTIME_CONTROL", "Phase 0 control-plane hardening", "phase_0", "current", "MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW", [(95, 102)], "runtime", "near_path", [], "Control-plane governance, mutation, trust, and resilience substrate."),
        track_spec("TRK_P0_FRONTEND_CONTRACTS", "Phase 0 frontend contract and design kernel", "phase_0", "current", "MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS", [(103, 114)], "frontend", "near_path", [], "Design-token, contract-manifest, and shell contract publication."),
        track_spec("TRK_P0_FRONTEND_SHELLS", "Phase 0 seed shells and mock projections", "phase_0", "current", "MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW", [(115, 120)], "frontend", "near_path", [], "Persistent shells and seed routes for every audience family."),
        track_spec("TRK_P0_ASSURANCE_DCB0129", "DCB0129 safety case and hazard log", "phase_0", "current", "MS_P0_0G_DCB0129_SAFETY_CASE", [(121, 121)], "assurance", "on_path", ["dep_nhs_assurance_and_standards_sources"], "Named long-lead safety case track."),
        track_spec("TRK_P0_ASSURANCE_DSPT", "DSPT readiness evidence plan", "phase_0", "current", "MS_P0_0G_DSPT_READINESS", [(122, 122)], "assurance", "on_path", ["dep_nhs_assurance_and_standards_sources"], "Named long-lead privacy and security readiness track."),
        track_spec("TRK_P0_ASSURANCE_IM1", "IM1 prerequisites and SCAL readiness", "phase_0", "current", "MS_P0_0G_IM1_SCAL_ASSURANCE", [(123, 123)], "assurance", "on_path", ["dep_im1_pairing_programme"], "Named long-lead interoperability and approval track."),
        track_spec("TRK_P0_ASSURANCE_NHS_LOGIN", "NHS login onboarding evidence pack", "phase_0", "current", "MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE", [(124, 124)], "assurance", "on_path", ["dep_nhs_login_rail"], "Named long-lead identity approval track."),
        track_spec("TRK_P0_ASSURANCE_PRIVACY", "Clinical risk cadence and DPIA backlog", "phase_0", "current", "MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE", [(125, 126)], "assurance", "near_path", [], "Parallel review cadence and privacy threat modeling."),
        track_spec("TRK_P1_BACKEND_INTAKE", "Phase 1 backend intake stack", "phase_1", "current", "MS_P1_PARALLEL_INTAKE_IMPLEMENTATION", [(144, 154)], "backend", "near_path", [], "Drafts, promotion, safety screening, and receipts."),
        track_spec("TRK_P1_FRONTEND_INTAKE", "Phase 1 patient intake surfaces", "phase_1", "current", "MS_P1_PARALLEL_INTAKE_IMPLEMENTATION", [(155, 163)], "frontend", "near_path", [], "Patient intake and same-shell receipt journey."),
        track_spec("TRK_P2_IDENTITY", "Phase 2 identity authority track", "phase_2", "current", "MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY", [(175, 186)], "backend", "near_path", ["dep_nhs_login_rail", "dep_pds_fhir_enrichment"], "Identity authority and session model."),
        track_spec("TRK_P2_TELEPHONY", "Phase 2 telephony convergence track", "phase_2", "current", "MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY", [(187, 194)], "backend", "near_path", ["dep_telephony_ivr_recording_provider", "dep_transcription_processing_provider"], "Telephony, continuation, and callback evidence."),
        track_spec("TRK_P2_FRONTEND", "Phase 2 authenticated patient surfaces", "phase_2", "current", "MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY", [(195, 201)], "frontend", "near_path", [], "Sign-in, claim, and channel parity surfaces."),
        track_spec("TRK_XC_PATIENT_ACCOUNT", "Cross-phase patient account projections", "cross_phase_controls", "current", "MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT", [(210, 217)], "cross_phase", "near_path", [], "Patient account, record, and thread continuity."),
        track_spec("TRK_XC_SUPPORT", "Cross-phase support workspace spine", "cross_phase_controls", "current", "MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT", [(218, 222)], "cross_phase", "near_path", [], "Support replay, masking, and support shell continuity."),
        track_spec("TRK_P3_TRIAGE_CORE", "Phase 3 triage and queue core", "phase_3", "current", "MS_P3_PARALLEL_TRIAGE_AND_CALLBACK", [(231, 242)], "backend", "near_path", [], "Triage queue, decision, and next-task settlement."),
        track_spec("TRK_P3_CALLBACK", "Phase 3 callback and messaging", "phase_3", "current", "MS_P3_PARALLEL_TRIAGE_AND_CALLBACK", [(243, 248)], "backend", "near_path", ["dep_telephony_ivr_recording_provider", "dep_sms_notification_provider"], "Callback and clinician messaging repair loops."),
        track_spec("TRK_P3_SELFCARE", "Phase 3 self-care and admin resolution", "phase_3", "current", "MS_P3_PARALLEL_TRIAGE_AND_CALLBACK", [(249, 254)], "backend", "near_path", [], "Advice, admin resolution, and reopen flows."),
        track_spec("TRK_P3_WORKSPACE", "Phase 3 workspace and support UI", "phase_3", "current", "MS_P3_PARALLEL_TRIAGE_AND_CALLBACK", [(255, 269)], "frontend", "near_path", [], "Clinical workspace and continuity-aware support surfaces."),
        track_spec("TRK_P4_BOOKING_BACKEND", "Phase 4 local booking backend", "phase_4", "current", "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION", [(282, 292)], "backend", "near_path", ["dep_local_booking_supplier_adapters"], "Booking authority, holds, commit, waitlist, and reconciliation."),
        track_spec("TRK_P4_BOOKING_FRONTEND", "Phase 4 local booking frontend", "phase_4", "current", "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION", [(293, 303)], "frontend", "near_path", [], "Patient and staff booking flows with truthful hold posture."),
        track_spec("TRK_P5_NETWORK_BACKEND", "Phase 5 network coordination backend", "phase_5", "current", "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION", [(315, 325)], "backend", "near_path", ["dep_network_capacity_partner_feeds", "dep_cross_org_secure_messaging_mesh"], "Hub coordination, cross-org booking, messaging, and bounce-back."),
        track_spec("TRK_P5_NETWORK_FRONTEND", "Phase 5 network coordination frontend", "phase_5", "current", "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION", [(326, 334)], "frontend", "near_path", [], "Hub desk, patient alternatives, and org-aware controls."),
        track_spec("TRK_P6_PHARMACY_BACKEND", "Phase 6 pharmacy backend", "phase_6", "current", "MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION", [(346, 356)], "backend", "near_path", ["dep_pharmacy_directory_dohs", "dep_pharmacy_referral_transport", "dep_pharmacy_outcome_observation"], "Eligibility, dispatch, outcome, and urgent return loop."),
        track_spec("TRK_P6_PHARMACY_FRONTEND", "Phase 6 pharmacy frontend", "phase_6", "current", "MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION", [(357, 365)], "frontend", "near_path", [], "Pharmacy console, patient visibility, and exception handling."),
        track_spec("TRK_P7_EMBEDDED_BACKEND", "Phase 7 NHS App backend", "phase_7", "deferred", "MS_P7_PARALLEL_EMBEDDED_CHANNEL", [(377, 385)], "backend", "off_path", ["dep_nhs_app_embedded_channel_ecosystem"], "Deferred embedded-channel backend services."),
        track_spec("TRK_P7_EMBEDDED_FRONTEND", "Phase 7 NHS App frontend", "phase_7", "deferred", "MS_P7_PARALLEL_EMBEDDED_CHANNEL", [(386, 393)], "frontend", "off_path", [], "Deferred embedded shell and bridge behaviors."),
        track_spec("TRK_P7_EMBEDDED_ONBOARDING", "Phase 7 NHS App onboarding and validation", "phase_7", "deferred", "MS_P7_PARALLEL_EMBEDDED_CHANNEL", [(394, 396)], "dependency", "off_path", ["dep_nhs_app_embedded_channel_ecosystem"], "Deferred manifest, site link, and bridge validation."),
        track_spec("TRK_P8_ASSISTIVE_BACKEND", "Phase 8 assistive backend", "phase_8", "current", "MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION", [(406, 417)], "backend", "near_path", ["dep_assistive_model_vendor_family"], "Assistive corpus, trust envelope, kill switch, and feedback chain."),
        track_spec("TRK_P8_ASSISTIVE_FRONTEND", "Phase 8 assistive frontend", "phase_8", "current", "MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION", [(418, 424)], "frontend", "near_path", [], "Assistive panel, diff, provenance, and freeze surfaces."),
        track_spec("TRK_P8_ASSISTIVE_VENDOR", "Phase 8 assistive vendor onboarding", "phase_8", "optional", "MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION", [(425, 426)], "dependency", "off_path", ["dep_assistive_model_vendor_family"], "Provisioning and vendor safety settings."),
        track_spec("TRK_P9_ASSURANCE_BACKEND", "Phase 9 assurance backend", "phase_9", "current", "MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION", [(435, 449)], "backend", "on_path", [], "Evidence graph, resilience tuple, governance, and conformance APIs."),
        track_spec("TRK_P9_ASSURANCE_FRONTEND", "Phase 9 assurance frontend", "phase_9", "current", "MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION", [(450, 460)], "frontend", "on_path", [], "Operations, governance, assurance, and conformance boards."),
        track_spec("TRK_P9_PLATFORM_BINDINGS", "Phase 9 platform bindings", "phase_9", "current", "MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION", [(461, 463)], "dependency", "on_path", [], "Alerting, backups, and compliance destinations."),
    ]

    milestones = [
        milestone_spec(
            "MS_PLAN_DISCOVERY_BASELINE",
            "Discovery corpus, architecture baselines, and ADR freeze",
            "planning",
            "current",
            ["planning"],
            [(1, 16)],
            "GATE_PLAN_EXTERNAL_ENTRY",
            "ROLE_PROGRAMME_ARCHITECT",
            ["LifecycleCoordinator", "RuntimePublicationBundle", "DesignContractPublicationBundle", "ReleaseWatchTuple"],
            ["prompt/checklist.md#Tasks 001-016", "prompt/016.md"],
            ["ENTRY_DISCOVERY_TASKS_COMPLETE"],
            ["EXIT_ADR_SET_AND_BASELINES_FROZEN"],
            ["requirement_registry.jsonl", "adr_index.json", "architecture_contract_binding_matrix.csv"],
            required_risk_ids=planning_risks,
            conformance_row_refs=[conformance_row_ref("phase_0"), current_scorecard],
            notes="Complete discovery and baseline-freeze pack produced by seq_001 to seq_016.",
        ),
        milestone_spec(
            "MS_PLAN_EXECUTION_GRAPH",
            "Programme graph and merge-gate model",
            "planning",
            "current",
            ["planning"],
            [(17, 17)],
            "GATE_PLAN_EXTERNAL_ENTRY",
            "ROLE_PROGRAMME_DIRECTOR",
            ["CrossPhaseConformanceScorecard", "WaveObservationPolicy", "OperationalReadinessSnapshot"],
            ["prompt/017.md"],
            ["ENTRY_ADR_SET_READY"],
            ["EXIT_EXECUTION_GRAPH_PUBLISHED"],
            ["programme_milestones.json", "milestone_dependency_edges.csv", "merge_gate_matrix.csv"],
            required_risk_ids=planning_risks,
            conformance_row_refs=[current_scorecard],
            notes="This task materializes the executable roadmap model and current-baseline critical path.",
        ),
        milestone_spec(
            "MS_PLAN_RISK_AND_TRACEABILITY_FOUNDATION",
            "Master risk, watchlist, traceability, and Phase 0 gate foundation",
            "planning",
            "current",
            ["planning"],
            [(18, 20)],
            "GATE_PLAN_EXTERNAL_ENTRY",
            "ROLE_PROGRAMME_DIRECTOR",
            ["CrossPhaseConformanceScorecard", "OperationalReadinessSnapshot", "RouteIntentBinding"],
            ["prompt/018.md", "prompt/019.md", "prompt/020.md"],
            ["ENTRY_EXECUTION_GRAPH_READY"],
            ["EXIT_PHASE0_GATE_PACK_DEFINED"],
            [
                "master_risk_register.json",
                "dependency_watchlist.json",
                "requirement_task_traceability.csv",
                "phase0_gate_verdict.json",
            ],
            required_risk_ids=planning_risks,
            conformance_row_refs=[current_scorecard, conformance_row_ref("phase_0")],
            notes="Planning only ends when risk, traceability, and the evidence-driven Phase 0 gate are defined.",
        ),
        milestone_spec(
            "MS_EXT_STRATEGY_AND_ACCOUNT_PLAN",
            "External inventory, provider scorecards, and account strategy",
            "dependency_readiness",
            "current",
            ["external_readiness"],
            [(21, 23)],
            "GATE_EXTERNAL_TO_FOUNDATION",
            "ROLE_DEPENDENCY_LEAD",
            ["AdapterContractProfile", "DependencyDegradationProfile", "IdentityBinding"],
            ["prompt/021.md", "prompt/022.md", "prompt/023.md"],
            ["ENTRY_PLAN_GATE_PASS"],
            ["EXIT_EXTERNAL_STRATEGY_FROZEN"],
            ["external_dependencies.json", "external_assurance_obligations.csv", "provider_scorecard_pack"],
            required_risk_ids=["HZ_WRONG_PATIENT_BINDING", "HZ_TELEPHONY_EVIDENCE_INADEQUACY"],
            notes="This defines the external account and supplier posture for current-baseline dependencies.",
        ),
        milestone_spec(
            "MS_EXT_NHS_LOGIN_ONBOARDING",
            "NHS login partner access requests and credential capture",
            "dependency_readiness",
            "current",
            ["external_readiness", "phase_2"],
            [(24, 25)],
            "GATE_EXTERNAL_TO_FOUNDATION",
            "ROLE_IDENTITY_PARTNER_MANAGER",
            ["IdentityBinding", "AccessGrant", "AdapterContractProfile"],
            ["prompt/024.md", "prompt/025.md"],
            ["ENTRY_EXTERNAL_STRATEGY_READY"],
            ["EXIT_NHS_LOGIN_ONBOARDING_VISIBLE"],
            ["NHSLoginOnboardingPack", "redirect_uri_inventory", "auth_callback_contract_pack"],
            required_dependency_refs=["dep_nhs_login_rail"],
            required_risk_ids=["HZ_WRONG_PATIENT_BINDING", "RISK_STATE_004"],
            notes="Long-lead identity approval remains visible before Phase 2 implementation begins.",
        ),
        milestone_spec(
            "MS_EXT_IM1_SCAL_READINESS",
            "IM1 prerequisite forms and SCAL artifact plan",
            "dependency_readiness",
            "current",
            ["external_readiness", "phase_0"],
            [(26, 26)],
            "GATE_EXTERNAL_TO_FOUNDATION",
            "ROLE_INTEROPERABILITY_LEAD",
            ["FhirRepresentationContract", "AdapterContractProfile", "CrossPhaseConformanceScorecard"],
            ["prompt/026.md"],
            ["ENTRY_EXTERNAL_STRATEGY_READY"],
            ["EXIT_IM1_SCAL_PATH_VISIBLE"],
            ["IM1PrerequisitePack", "SCALReadinessPack"],
            required_dependency_refs=["dep_im1_pairing_programme"],
            required_risk_ids=["HZ_WRONG_PATIENT_BINDING"],
            notes="IM1 and SCAL readiness is a current-baseline long-lead dependency, not a hidden future task.",
        ),
        milestone_spec(
            "MS_EXT_OPTIONAL_PDS_ENRICHMENT",
            "Optional PDS enrichment sandbox request and flag plan",
            "dependency_readiness",
            "optional",
            ["external_readiness", "phase_2"],
            [(27, 27)],
            "GATE_OPTIONAL_PDS_ENABLEMENT",
            "ROLE_GOVERNANCE_LEAD",
            ["IdentityBindingAuthority", "IdentityBinding"],
            ["prompt/027.md"],
            ["ENTRY_IM1_PATH_DEFINED"],
            ["EXIT_OPTIONAL_PDS_REQUEST_CAPTURED"],
            ["PDSSandboxRequest", "PDSFeatureFlagPlan"],
            required_dependency_refs=["dep_pds_fhir_enrichment"],
            required_risk_ids=["RISK_STATE_004"],
            notes="Optional enrichment is inventoried without becoming a current-baseline blocker.",
        ),
        milestone_spec(
            "MS_EXT_MESH_ACCESS",
            "MESH mailbox and message workflow access requests",
            "dependency_readiness",
            "current",
            ["external_readiness", "phase_5"],
            [(28, 28)],
            "GATE_EXTERNAL_TO_FOUNDATION",
            "ROLE_INTEROPERABILITY_LEAD",
            ["Communication", "AdapterContractProfile", "CommandSettlementRecord"],
            ["prompt/028.md"],
            ["ENTRY_IM1_PATH_DEFINED"],
            ["EXIT_MESH_ONBOARDING_VISIBLE"],
            ["MeshMailboxRequest", "MeshRoutingPack"],
            required_dependency_refs=["dep_cross_org_secure_messaging_mesh"],
            required_risk_ids=["HZ_DUPLICATE_SUPPRESSION_OR_MERGE"],
            notes="Current-baseline messaging rail readiness is visible before later network and hub work.",
        ),
        milestone_spec(
            "MS_EXT_DEFERRED_NHSAPP_ECOSYSTEM",
            "Deferred NHS App sandpit and site-link onboarding",
            "deferred_channel",
            "deferred",
            ["external_readiness", "phase_7"],
            [(29, 30)],
            "GATE_DEFERRED_NHSAPP_ENABLEMENT",
            "ROLE_EMBEDDED_CHANNEL_LEAD",
            ["AudienceSurfaceRuntimeBinding", "ReleaseApprovalFreeze", "ChannelReleaseFreezeRecord"],
            ["prompt/029.md", "prompt/030.md"],
            ["ENTRY_MESH_READINESS_VISIBLE"],
            ["EXIT_DEFERRED_NHSAPP_REQUESTS_CAPTURED"],
            ["NHSSandpitRequest", "SiteLinkMetadataPlaceholderSet"],
            required_dependency_refs=["dep_nhs_app_embedded_channel_ecosystem"],
            required_risk_ids=["RISK_UI_002"],
            notes="Deferred channel inventory stays visible but does not block the current baseline.",
        ),
        milestone_spec(
            "MS_EXT_COMMS_AND_SCAN_VENDORS",
            "Telephony, notifications, transcription, and malware-scanning vendor setup",
            "dependency_readiness",
            "current",
            ["external_readiness", "phase_1", "phase_2"],
            [(31, 35)],
            "GATE_EXTERNAL_TO_FOUNDATION",
            "ROLE_DEPENDENCY_LEAD",
            ["AdapterContractProfile", "DependencyDegradationProfile", "EvidenceCaptureBundle"],
            ["prompt/031.md", "prompt/032.md", "prompt/033.md", "prompt/034.md", "prompt/035.md"],
            ["ENTRY_MESH_READINESS_VISIBLE"],
            ["EXIT_COMMS_AND_SCAN_PROJECTS_VISIBLE"],
            ["TelephonyAccountPack", "NotificationProjectPack", "TranscriptProviderPack", "MalwareScannerProjectPack"],
            required_dependency_refs=[
                "dep_telephony_ivr_recording_provider",
                "dep_sms_notification_provider",
                "dep_email_notification_provider",
                "dep_transcription_processing_provider",
                "dep_malware_scanning_provider",
            ],
            required_risk_ids=["HZ_TELEPHONY_EVIDENCE_INADEQUACY", "HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE"],
            notes="Current-baseline transport and artifact providers must be visible before Phase 0 simulators and later channels can converge.",
        ),
        milestone_spec(
            "MS_EXT_PROVIDER_PATHS_AND_EVIDENCE",
            "GP, booking, and pharmacy provider path evidence",
            "dependency_readiness",
            "current",
            ["external_readiness", "phase_4", "phase_6"],
            [(36, 37)],
            "GATE_EXTERNAL_TO_FOUNDATION",
            "ROLE_DEPENDENCY_LEAD",
            ["AdapterContractProfile", "ExternalConfirmationGate", "PharmacyDispatchSettlement"],
            ["prompt/036.md", "prompt/037.md"],
            ["ENTRY_VENDOR_PROJECTS_VISIBLE"],
            ["EXIT_PROVIDER_PATHS_VISIBLE"],
            ["BookingCapabilityEvidencePack", "PharmacyDirectoryAccessPlan"],
            required_dependency_refs=[
                "dep_gp_system_supplier_paths",
                "dep_local_booking_supplier_adapters",
                "dep_pharmacy_directory_dohs",
            ],
            required_risk_ids=["RISK_BOOKING_001", "RISK_PHARMACY_001"],
            notes="Local booking and pharmacy rails need explicit partner-path evidence before implementation work can assume capability.",
        ),
        milestone_spec(
            "MS_EXT_SIMULATOR_AND_MANUAL_GATE_FREEZE",
            "Simulator backlog, manual checkpoints, and degraded-mode defaults",
            "dependency_readiness",
            "current",
            ["external_readiness", "phase_0"],
            [(38, 40)],
            "GATE_EXTERNAL_TO_FOUNDATION",
            "ROLE_DEPENDENCY_LEAD",
            ["DependencyDegradationProfile", "RouteIntentBinding", "ReleaseRecoveryDisposition"],
            ["prompt/038.md", "prompt/039.md", "prompt/040.md"],
            ["ENTRY_PROVIDER_PATHS_VISIBLE"],
            ["EXIT_EXTERNAL_READINESS_FROZEN"],
            ["dependency_simulator_strategy.json", "manual_approval_checkpoint_log", "integration_assumption_freeze"],
            required_risk_ids=["RISK_RUNTIME_001", "HZ_TELEPHONY_EVIDENCE_INADEQUACY"],
            conformance_row_refs=[conformance_row_ref("phase_0")],
            notes="This closes the external-readiness block with explicit simulator and manual fallback posture.",
        ),
        milestone_spec(
            "MS_P0_0A_DELIVERY_SKELETON",
            "Phase 0A delivery skeleton and repository architecture",
            "foundation",
            "current",
            ["phase_0"],
            [(41, 45)],
            "GATE_P0_0A_TO_0B",
            "ROLE_PLATFORM_ARCHITECT",
            ["LifecycleCoordinator", "FrontendContractManifest", "RuntimeTopologyManifest"],
            ["blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture"],
            ["ENTRY_FOUNDATION_SCOPE_AND_DEPENDENCY_READINESS"],
            ["EXIT_REPOSITORY_AND_BOOTSTRAP_READY"],
            ["monorepo_boundary_rules", "bootstrap_runbooks", "ci_pipeline_bootstrap"],
            required_risk_ids=phase_risks["phase_0"][:3],
            notes="Hard gate into Phase 0A repository, package, and delivery skeleton readiness.",
        ),
        milestone_spec(
            "MS_P0_0B_DOMAIN_KERNEL",
            "Phase 0B canonical domain kernel and state machine",
            "foundation",
            "current",
            ["phase_0"],
            [(46, 49), (62, 82)],
            "GATE_P0_0B_TO_0C",
            "ROLE_FOUNDATION_DOMAIN_OWNER",
            ["Request", "EvidenceSnapshot", "LifecycleCoordinator", "RouteIntentBinding", "CommandSettlementRecord"],
            ["blueprint/phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine"],
            ["ENTRY_0A_BUILD_SYSTEM_READY"],
            ["EXIT_DOMAIN_KERNEL_AND_COORDINATORS_READY"],
            ["canonical_domain_glossary.csv", "state_machines.json", "service_runtime_matrix.csv"],
            required_risk_ids=phase_risks["phase_0"],
            allowed_parallel_track_refs=["TRK_P0_BACKEND_DOMAIN_KERNEL"],
            notes="0B combines the source-named kernel definition with the backend kernel implementation track.",
        ),
        milestone_spec(
            "MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE",
            "Phase 0C runtime topology, publication, and release substrate",
            "foundation",
            "current",
            ["phase_0"],
            [(50, 52), (83, 94)],
            "GATE_P0_0C_TO_0D",
            "ROLE_RUNTIME_RELEASE_OWNER",
            ["RuntimePublicationBundle", "ReleaseApprovalFreeze", "AudienceSurfaceRuntimeBinding", "ReleaseWatchTuple"],
            ["blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple"],
            ["ENTRY_0B_DOMAIN_KERNEL_READY"],
            ["EXIT_RUNTIME_PUBLICATION_TUPLE_READY"],
            ["runtime_workload_families.json", "gateway_surface_matrix.csv", "release_gate_matrix.csv"],
            required_risk_ids=["RISK_RUNTIME_001"] + phase_risks["phase_0"][:2],
            allowed_parallel_track_refs=["TRK_P0_RUNTIME_RELEASE"],
            notes="0C operationalizes the release and runtime tuple obligations that later phases depend on.",
        ),
        milestone_spec(
            "MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW",
            "Phase 0D control governors, tenant scope, and mutation law",
            "foundation",
            "current",
            ["phase_0"],
            [(53, 57), (95, 102)],
            "GATE_P0_0D_TO_0E",
            "ROLE_CONTROL_PLANE_OWNER",
            ["ActingScopeTuple", "ScopedMutationGate", "CommandSettlementRecord", "DependencyDegradationProfile"],
            ["blueprint/phase-cards.md#Programme Summary-Layer Alignment"],
            ["ENTRY_0C_RUNTIME_PUBLICATION_READY"],
            ["EXIT_CONTROL_PLANE_GOVERNORS_READY"],
            ["acting_scope_tuple_matrix.csv", "idempotency_and_replay_rules.json", "dependency_truth_and_fallback_matrix.csv"],
            required_risk_ids=phase_risks["phase_0"][:6],
            allowed_parallel_track_refs=["TRK_P0_RUNTIME_CONTROL"],
            notes="0D keeps tenant scope, mutation gating, and degraded-mode governance inside the shared control plane.",
        ),
        milestone_spec(
            "MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS",
            "Phase 0E verification ladder, simulators, and frontend contract kernel",
            "foundation",
            "current",
            ["phase_0"],
            [(58, 61), (103, 114)],
            "GATE_P0_PARALLEL_FOUNDATION_OPEN",
            "ROLE_FOUNDATION_PROGRAMME_OWNER",
            ["VerificationScenario", "FrontendContractManifest", "DesignContractPublicationBundle", "RouteIntentBinding"],
            ["blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            ["ENTRY_0D_CONTROL_PLANE_READY"],
            ["EXIT_PARALLEL_FOUNDATION_GATE_READY"],
            ["playwright_coverage_matrix.csv", "ui_contract_publication_matrix.csv", "dependency_simulator_strategy.json"],
            required_risk_ids=phase_risks["phase_0"][:5],
            allowed_parallel_track_refs=["TRK_P0_FRONTEND_CONTRACTS"],
            notes="0E is the hard gate that opens the Phase 0 parallel foundation tracks with verification and contract publication already pinned.",
        ),
        milestone_spec(
            "MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW",
            "Phase 0F seed shells, audience bindings, and synthetic flow integration",
            "foundation",
            "current",
            ["phase_0"],
            [(115, 120), (127, 131)],
            "GATE_P0_0F_TO_0G",
            "ROLE_FOUNDATION_EXPERIENCE_OWNER",
            ["AudienceSurfaceRuntimeBinding", "DesignContractPublicationBundle", "CommandSettlementRecord"],
            ["blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            ["ENTRY_PARALLEL_FOUNDATION_GATE_PASS"],
            ["EXIT_SYNTHETIC_FLOW_AND_PARITY_READY"],
            ["audience_surface_inventory.csv", "gateway_surface_matrix.csv", "release_publication_parity_pack"],
            required_risk_ids=["RISK_RUNTIME_001", "RISK_MUTATION_003", "RISK_ASSURANCE_001"],
            allowed_parallel_track_refs=["TRK_P0_FRONTEND_SHELLS"],
            notes="0F proves the synthetic end-to-end flow and same-shell parity before assurance signoff closes Phase 0.",
        ),
        milestone_spec(
            "MS_P0_0G_DCB0129_SAFETY_CASE",
            "Phase 0G DCB0129 safety case and hazard-log lane",
            "dependency_readiness",
            "current",
            ["phase_0"],
            [(121, 121)],
            "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
            "ROLE_MANUFACTURER_CSO",
            ["SafetyDecisionRecord", "CrossPhaseConformanceScorecard"],
            ["blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            ["ENTRY_PARALLEL_FOUNDATION_GATE_PASS"],
            ["EXIT_DCB0129_TRACK_VISIBLE"],
            ["safety_hazard_register_seed.csv", "clinical_safety_workstreams_pack"],
            required_dependency_refs=["dep_nhs_assurance_and_standards_sources"],
            required_risk_ids=["HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE"],
            allowed_parallel_track_refs=["TRK_P0_ASSURANCE_DCB0129"],
            notes="Named long-lead assurance milestone carried into the Phase 0 exit gate.",
        ),
        milestone_spec(
            "MS_P0_0G_DSPT_READINESS",
            "Phase 0G DSPT readiness lane",
            "dependency_readiness",
            "current",
            ["phase_0"],
            [(122, 122)],
            "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
            "ROLE_DPO",
            ["OperationalReadinessSnapshot", "AuditRecord"],
            ["blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            ["ENTRY_PARALLEL_FOUNDATION_GATE_PASS"],
            ["EXIT_DSPT_TRACK_VISIBLE"],
            ["dspt_gap_assessment_pack", "data_classification_matrix.csv"],
            required_dependency_refs=["dep_nhs_assurance_and_standards_sources"],
            required_risk_ids=["HZ_WRONG_PATIENT_BINDING"],
            allowed_parallel_track_refs=["TRK_P0_ASSURANCE_DSPT"],
            notes="Named long-lead privacy and security readiness milestone carried into the Phase 0 exit gate.",
        ),
        milestone_spec(
            "MS_P0_0G_IM1_SCAL_ASSURANCE",
            "Phase 0G IM1 and SCAL readiness lane",
            "dependency_readiness",
            "current",
            ["phase_0"],
            [(123, 123)],
            "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
            "ROLE_INTEROPERABILITY_LEAD",
            ["FhirRepresentationContract", "AdapterContractProfile"],
            ["blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            ["ENTRY_PARALLEL_FOUNDATION_GATE_PASS"],
            ["EXIT_IM1_SCAL_TRACK_VISIBLE"],
            ["im1_scal_readiness_pack"],
            required_dependency_refs=["dep_im1_pairing_programme"],
            required_risk_ids=["HZ_DUPLICATE_SUPPRESSION_OR_MERGE"],
            allowed_parallel_track_refs=["TRK_P0_ASSURANCE_IM1"],
            notes="Named long-lead interoperability track carried into the Phase 0 exit gate.",
        ),
        milestone_spec(
            "MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE",
            "Phase 0G NHS login onboarding evidence lane",
            "dependency_readiness",
            "current",
            ["phase_0"],
            [(124, 124)],
            "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
            "ROLE_IDENTITY_PARTNER_MANAGER",
            ["IdentityBinding", "AccessGrant", "AdapterContractProfile"],
            ["blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            ["ENTRY_PARALLEL_FOUNDATION_GATE_PASS"],
            ["EXIT_NHS_LOGIN_TRACK_VISIBLE"],
            ["nhs_login_onboarding_evidence_pack"],
            required_dependency_refs=["dep_nhs_login_rail"],
            required_risk_ids=["HZ_WRONG_PATIENT_BINDING"],
            allowed_parallel_track_refs=["TRK_P0_ASSURANCE_NHS_LOGIN"],
            notes="Named long-lead identity onboarding track carried into the Phase 0 exit gate.",
        ),
        milestone_spec(
            "MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE",
            "Phase 0G clinical review cadence and DPIA backlog",
            "assurance_gate",
            "current",
            ["phase_0"],
            [(125, 126)],
            "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
            "ROLE_GOVERNANCE_LEAD",
            ["CrossPhaseConformanceScorecard", "OperationalReadinessSnapshot"],
            ["blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            ["ENTRY_PARALLEL_FOUNDATION_GATE_PASS"],
            ["EXIT_CLINICAL_AND_PRIVACY_REVIEW_VISIBLE"],
            ["clinical_risk_review_matrix", "dpia_backlog_pack"],
            required_risk_ids=["HZ_WRONG_PATIENT_BINDING", "HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE"],
            allowed_parallel_track_refs=["TRK_P0_ASSURANCE_PRIVACY"],
            conformance_row_refs=[conformance_row_ref("phase_0")],
            notes="Clinical review cadence and privacy threat modeling complete the non-engineering Phase 0 long-lead tracks.",
        ),
        milestone_spec(
            "MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF",
            "Phase 0G observability, security, and foundation exit proof",
            "release_gate",
            "current",
            ["phase_0"],
            [(132, 138)],
            "GATE_P0_EXIT",
            "ROLE_FOUNDATION_PROGRAMME_OWNER",
            ["ReleaseWatchTuple", "WaveObservationPolicy", "OperationalReadinessSnapshot", "CrossPhaseConformanceScorecard"],
            ["blueprint/phase-0-the-foundation-protocol.md#0G. Observability, security plumbing, and operational controls"],
            ["ENTRY_0F_AND_LONG_LEAD_TRACKS_COMPLETE"],
            ["EXIT_PHASE0_SIGNED_OFF"],
            ["release_candidate_freeze_pack", "foundation_exit_evidence_pack", "backup_restore_rehearsal_pack"],
            required_risk_ids=unique(phase_risks["phase_0"] + ["HZ_WRONG_PATIENT_BINDING", "HZ_TELEPHONY_EVIDENCE_INADEQUACY"]),
            conformance_row_refs=[conformance_row_ref("phase_0"), current_scorecard],
            notes="Phase 0 closes only after synthetic flow proof, long-lead assurance tracks, release tuple, and hardening evidence align.",
        ),
        milestone_spec(
            "MS_P1_DEFINITION_AND_ENTRY",
            "Phase 1 contract freeze and intake entry gate",
            "phase_delivery",
            "current",
            ["phase_1"],
            [(139, 143)],
            "GATE_P1_PARALLEL_MERGE",
            "ROLE_PHASE1_OWNER",
            ["SubmissionIngressRecord", "NormalizedSubmission", "SafetyDecisionRecord"],
            ["prompt/139.md", "prompt/143.md"],
            ["ENTRY_PHASE0_EXIT_COMPLETE"],
            ["EXIT_PHASE1_PARALLEL_WINDOW_OPEN"],
            ["phase1_intake_contract_pack"],
            required_risk_ids=phase_risks["phase_1"],
            notes="Phase 1 freezes the intake contract and then opens the intake parallel block.",
        ),
        milestone_spec(
            "MS_P1_PARALLEL_INTAKE_IMPLEMENTATION",
            "Phase 1 parallel intake implementation",
            "phase_delivery",
            "current",
            ["phase_1"],
            [(144, 163)],
            "GATE_P1_PARALLEL_MERGE",
            "ROLE_PHASE1_OWNER",
            ["SubmissionIngressRecord", "EvidenceCaptureBundle", "UrgentDiversionSettlement"],
            ["prompt/144.md", "prompt/163.md"],
            ["ENTRY_PHASE1_PARALLEL_WINDOW_OPEN"],
            ["EXIT_PHASE1_BACKEND_AND_FRONTEND_LANES_COMPLETE"],
            ["patient_intake_surface_pack", "submission_promotion_pack"],
            required_risk_ids=phase_risks["phase_1"],
            allowed_parallel_track_refs=["TRK_P1_BACKEND_INTAKE", "TRK_P1_FRONTEND_INTAKE"],
            notes="Backend and patient-shell intake work runs in one contiguous Phase 1 parallel block.",
        ),
        milestone_spec(
            "MS_P1_MERGE_AND_PROOF",
            "Phase 1 merge, resilience proof, and end-to-end evidence",
            "phase_delivery",
            "current",
            ["phase_1"],
            [(164, 168)],
            "GATE_P1_EXIT",
            "ROLE_PHASE1_OWNER",
            ["PatientReceiptConsistencyEnvelope", "ExperienceContinuityControlEvidence", "CommandSettlementRecord"],
            ["prompt/164.md", "prompt/168.md"],
            ["ENTRY_PHASE1_PARALLEL_BLOCK_COMPLETE"],
            ["EXIT_PHASE1_PROOF_PACK_READY"],
            ["phase1_end_to_end_evidence_pack", "phase1_resilience_test_pack"],
            required_risk_ids=phase_risks["phase_1"],
            conformance_row_refs=[conformance_row_ref("phase_1")],
            notes="Merge, test, and prove the first patient flow before Phase 1 can exit.",
        ),
        milestone_spec(
            "MS_P1_EXIT_GATE",
            "Phase 1 red-flag gate exit approval",
            "release_gate",
            "current",
            ["phase_1"],
            [(169, 169)],
            "GATE_P1_EXIT",
            "ROLE_PHASE1_OWNER",
            ["ControlStatusSnapshot", "PatientReceiptConsistencyEnvelope", "AudienceSurfaceRuntimeBinding"],
            ["prompt/169.md"],
            ["ENTRY_PHASE1_PROOF_PACK_READY"],
            ["EXIT_PHASE1_COMPLETE"],
            ["phase1_exit_verdict"],
            required_risk_ids=phase_risks["phase_1"],
            conformance_row_refs=[conformance_row_ref("phase_1"), current_scorecard],
            notes="Phase 1 exit cannot outrun conformance-row freshness or same-shell continuity proof.",
        ),
        milestone_spec(
            "MS_P2_DEFINITION_AND_ENTRY",
            "Phase 2 trust, identity, and telephony contract freeze",
            "phase_delivery",
            "current",
            ["phase_2"],
            [(170, 174)],
            "GATE_P2_PARALLEL_MERGE",
            "ROLE_PHASE2_OWNER",
            ["IdentityBinding", "AccessGrant", "SessionEstablishmentDecision", "CallSession"],
            ["prompt/170.md", "prompt/174.md"],
            ["ENTRY_PHASE1_EXIT_COMPLETE"],
            ["EXIT_PHASE2_PARALLEL_WINDOW_OPEN"],
            ["phase2_trust_contract_pack"],
            required_risk_ids=phase_risks["phase_2"],
            required_dependency_refs=["dep_nhs_login_rail", "dep_telephony_ivr_recording_provider"],
            notes="Phase 2 freezes trust, auth, linkage, and telephony authority before its parallel block opens.",
        ),
        milestone_spec(
            "MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY",
            "Phase 2 identity, telephony, and signed-in patient implementation",
            "phase_delivery",
            "current",
            ["phase_2"],
            [(175, 201)],
            "GATE_P2_PARALLEL_MERGE",
            "ROLE_PHASE2_OWNER",
            ["IdentityBinding", "AccessGrant", "SessionEstablishmentDecision", "EvidenceCaptureBundle"],
            ["prompt/175.md", "prompt/201.md"],
            ["ENTRY_PHASE2_PARALLEL_WINDOW_OPEN"],
            ["EXIT_PHASE2_PARALLEL_TRACKS_COMPLETE"],
            ["phase2_identity_and_echoes_pack"],
            required_risk_ids=phase_risks["phase_2"],
            required_dependency_refs=["dep_nhs_login_rail", "dep_telephony_ivr_recording_provider", "dep_transcription_processing_provider"],
            allowed_parallel_track_refs=["TRK_P2_IDENTITY", "TRK_P2_TELEPHONY", "TRK_P2_FRONTEND"],
            notes="Identity, telephony, and signed-in patient surfaces converge through one parallel block.",
        ),
        milestone_spec(
            "MS_P2_EXTERNAL_CONFIG",
            "Phase 2 partner and webhook configuration",
            "dependency_readiness",
            "current",
            ["phase_2"],
            [(202, 203)],
            "GATE_P2_EXIT",
            "ROLE_PHASE2_OWNER",
            ["AdapterContractProfile", "AccessGrant", "CommandSettlementRecord"],
            ["prompt/202.md", "prompt/203.md"],
            ["ENTRY_PHASE2_PARALLEL_TRACKS_COMPLETE"],
            ["EXIT_PHASE2_PARTNER_CONFIG_FROZEN"],
            ["phase2_partner_configuration_pack"],
            required_dependency_refs=["dep_nhs_login_rail", "dep_sms_notification_provider", "dep_email_notification_provider"],
            required_risk_ids=["HZ_WRONG_PATIENT_BINDING", "HZ_TELEPHONY_EVIDENCE_INADEQUACY"],
            notes="Auth, SMS, email, and webhook settings stay visible as their own dependency milestone.",
        ),
        milestone_spec(
            "MS_P2_PROOF_AND_REGRESSION",
            "Phase 2 proof and regression suites",
            "phase_delivery",
            "current",
            ["phase_2"],
            [(204, 207)],
            "GATE_P2_EXIT",
            "ROLE_PHASE2_OWNER",
            ["IdentityRepairEvidenceBundle", "ExperienceContinuityControlEvidence", "ControlStatusSnapshot"],
            ["prompt/204.md", "prompt/207.md"],
            ["ENTRY_PHASE2_PARTNER_CONFIG_FROZEN"],
            ["EXIT_PHASE2_PROOF_PACK_READY"],
            ["phase2_regression_evidence_pack"],
            required_risk_ids=phase_risks["phase_2"],
            conformance_row_refs=[conformance_row_ref("phase_2")],
            notes="Phase 2 proves wrong-patient repair, auth replay, telephony continuity, and parity before exit.",
        ),
        milestone_spec(
            "MS_P2_EXIT_GATE",
            "Phase 2 identity and echoes exit approval",
            "release_gate",
            "current",
            ["phase_2"],
            [(208, 208)],
            "GATE_P2_EXIT",
            "ROLE_PHASE2_OWNER",
            ["IdentityRepairEvidenceBundle", "ReleaseApprovalFreeze", "AudienceSurfaceRuntimeBinding"],
            ["prompt/208.md"],
            ["ENTRY_PHASE2_PROOF_PACK_READY"],
            ["EXIT_PHASE2_COMPLETE"],
            ["phase2_exit_verdict"],
            required_risk_ids=phase_risks["phase_2"],
            conformance_row_refs=[conformance_row_ref("phase_2"), current_scorecard],
            notes="Phase 2 exit binds identity authority, telephony truth, and conformance-row freshness.",
        ),
        milestone_spec(
            "MS_XC_ENTRY_GATE",
            "Cross-phase patient account and support entry gate",
            "cross_phase_control",
            "current",
            ["cross_phase_controls"],
            [(209, 209)],
            "GATE_XC_PARALLEL_MERGE",
            "ROLE_CROSS_PHASE_OWNER",
            ["PatientSpotlightDecisionProjection", "SupportReplayRestoreSettlement", "AudienceSurfaceRuntimeBinding"],
            ["prompt/209.md"],
            ["ENTRY_PHASE2_EXIT_COMPLETE"],
            ["EXIT_CROSS_PHASE_PARALLEL_WINDOW_OPEN"],
            ["cross_phase_surface_contract_pack"],
            required_risk_ids=["RISK_ASSURANCE_001", "RISK_UI_001"],
            notes="Cross-phase portal and support work opens as its own control-family block after Phase 2.",
        ),
        milestone_spec(
            "MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT",
            "Cross-phase patient account and support implementation",
            "cross_phase_control",
            "current",
            ["cross_phase_controls"],
            [(210, 222)],
            "GATE_XC_PARALLEL_MERGE",
            "ROLE_CROSS_PHASE_OWNER",
            ["PatientSpotlightDecisionProjection", "ConversationThreadProjection", "SupportReplayRestoreSettlement"],
            ["prompt/210.md", "prompt/222.md"],
            ["ENTRY_CROSS_PHASE_PARALLEL_WINDOW_OPEN"],
            ["EXIT_CROSS_PHASE_PATIENT_AND_SUPPORT_TRACKS_COMPLETE"],
            ["patient_account_surface_pack", "support_workspace_pack"],
            required_risk_ids=["RISK_ASSURANCE_001", "RISK_UI_001"],
            allowed_parallel_track_refs=["TRK_XC_PATIENT_ACCOUNT", "TRK_XC_SUPPORT"],
            notes="Patient account continuity and support replay work stay visible as one cross-phase parallel block.",
        ),
        milestone_spec(
            "MS_XC_MERGE_AND_PROOF",
            "Cross-phase patient account and support merge and proof",
            "cross_phase_control",
            "current",
            ["cross_phase_controls"],
            [(223, 224)],
            "GATE_XC_EXIT",
            "ROLE_CROSS_PHASE_OWNER",
            ["ExperienceContinuityControlEvidence", "GovernanceContinuityEvidenceBundle", "PatientActionRecoveryEnvelope"],
            ["prompt/223.md", "prompt/224.md"],
            ["ENTRY_CROSS_PHASE_PARALLEL_BLOCK_COMPLETE"],
            ["EXIT_CROSS_PHASE_PROOF_PACK_READY"],
            ["cross_phase_continuity_pack"],
            required_risk_ids=["RISK_ASSURANCE_001", "RISK_UI_001"],
            conformance_row_refs=[scorecard_ref("cross_phase_controls")],
            notes="Patient/support continuity proof closes before the later workspace phases begin.",
        ),
        milestone_spec(
            "MS_XC_EXIT_GATE",
            "Cross-phase portal and support baseline exit approval",
            "release_gate",
            "current",
            ["cross_phase_controls"],
            [(225, 225)],
            "GATE_XC_EXIT",
            "ROLE_CROSS_PHASE_OWNER",
            ["ExperienceContinuityControlEvidence", "ControlStatusSnapshot", "AudienceSurfaceRuntimeBinding"],
            ["prompt/225.md"],
            ["ENTRY_CROSS_PHASE_PROOF_PACK_READY"],
            ["EXIT_CROSS_PHASE_CONTROLS_COMPLETE"],
            ["cross_phase_exit_verdict"],
            required_risk_ids=["RISK_ASSURANCE_001", "RISK_UI_001"],
            conformance_row_refs=[scorecard_ref("cross_phase_controls"), current_scorecard],
            notes="Cross-phase portal and support proof becomes a first-class programme control family, not a phase-local note.",
        ),
    ]

    phase_specs = [
        {
            "prefix": "P3",
            "phase_ref": "phase_3",
            "entry_id": "MS_P3_DEFINITION_AND_ENTRY",
            "entry_title": "Phase 3 contract freeze and triage entry gate",
            "entry_ranges": [(226, 230)],
            "parallel_id": "MS_P3_PARALLEL_TRIAGE_AND_CALLBACK",
            "parallel_title": "Phase 3 parallel triage, callback, and workspace implementation",
            "parallel_ranges": [(231, 269)],
            "merge_id": "MS_P3_MERGE_AND_PROOF",
            "merge_title": "Phase 3 merge and regression proof",
            "merge_ranges": [(270, 276)],
            "exit_id": "MS_P3_EXIT_GATE",
            "exit_title": "Phase 3 human checkpoint exit approval",
            "exit_ranges": [(277, 277)],
            "merge_gate": "GATE_P3_PARALLEL_MERGE",
            "exit_gate": "GATE_P3_EXIT",
            "requirement_tokens": ["LifecycleCoordinator", "QueueRankSnapshot", "DecisionDock", "CallbackAttemptRecord"],
            "risk_ids": phase_risks["phase_3"],
            "parallel_tracks": ["TRK_P3_TRIAGE_CORE", "TRK_P3_CALLBACK", "TRK_P3_SELFCARE", "TRK_P3_WORKSPACE"],
            "dependencies": [],
            "owner_role": "ROLE_PHASE3_OWNER",
        },
        {
            "prefix": "P4",
            "phase_ref": "phase_4",
            "entry_id": "MS_P4_DEFINITION_AND_ENTRY",
            "entry_title": "Phase 4 booking contract freeze and entry gate",
            "entry_ranges": [(278, 281)],
            "parallel_id": "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION",
            "parallel_title": "Phase 4 parallel booking implementation",
            "parallel_ranges": [(282, 303)],
            "merge_id": "MS_P4_MERGE_CONFIG_AND_PROOF",
            "merge_title": "Phase 4 booking provider configuration and proof",
            "merge_ranges": [(304, 309)],
            "exit_id": "MS_P4_EXIT_GATE",
            "exit_title": "Phase 4 booking engine exit approval",
            "exit_ranges": [(310, 310)],
            "merge_gate": "GATE_P4_PARALLEL_MERGE",
            "exit_gate": "GATE_P4_EXIT",
            "requirement_tokens": ["CapacityReservation", "ExternalConfirmationGate", "ReleaseRecoveryDisposition"],
            "risk_ids": phase_risks["phase_4"],
            "parallel_tracks": ["TRK_P4_BOOKING_BACKEND", "TRK_P4_BOOKING_FRONTEND"],
            "dependencies": ["dep_local_booking_supplier_adapters", "dep_gp_system_supplier_paths"],
            "owner_role": "ROLE_PHASE4_OWNER",
        },
        {
            "prefix": "P5",
            "phase_ref": "phase_5",
            "entry_id": "MS_P5_DEFINITION_AND_ENTRY",
            "entry_title": "Phase 5 network horizon contract freeze and entry gate",
            "entry_ranges": [(311, 314)],
            "parallel_id": "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION",
            "parallel_title": "Phase 5 parallel network coordination implementation",
            "parallel_ranges": [(315, 334)],
            "merge_id": "MS_P5_MERGE_CONFIG_AND_PROOF",
            "merge_title": "Phase 5 network partner configuration and proof",
            "merge_ranges": [(335, 340)],
            "exit_id": "MS_P5_EXIT_GATE",
            "exit_title": "Phase 5 network horizon exit approval",
            "exit_ranges": [(341, 341)],
            "merge_gate": "GATE_P5_PARALLEL_MERGE",
            "exit_gate": "GATE_P5_EXIT",
            "requirement_tokens": ["ActingScopeTuple", "HubContinuityEvidenceProjection", "CommandSettlementRecord"],
            "risk_ids": phase_risks["phase_5"],
            "parallel_tracks": ["TRK_P5_NETWORK_BACKEND", "TRK_P5_NETWORK_FRONTEND"],
            "dependencies": ["dep_network_capacity_partner_feeds", "dep_cross_org_secure_messaging_mesh"],
            "owner_role": "ROLE_PHASE5_OWNER",
        },
        {
            "prefix": "P6",
            "phase_ref": "phase_6",
            "entry_id": "MS_P6_DEFINITION_AND_ENTRY",
            "entry_title": "Phase 6 pharmacy loop contract freeze and entry gate",
            "entry_ranges": [(342, 345)],
            "parallel_id": "MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION",
            "parallel_title": "Phase 6 parallel pharmacy implementation",
            "parallel_ranges": [(346, 365)],
            "merge_id": "MS_P6_MERGE_CONFIG_AND_PROOF",
            "merge_title": "Phase 6 pharmacy dependency configuration and proof",
            "merge_ranges": [(366, 371)],
            "exit_id": "MS_P6_EXIT_GATE",
            "exit_title": "Phase 6 pharmacy loop exit approval",
            "exit_ranges": [(372, 372)],
            "merge_gate": "GATE_P6_PARALLEL_MERGE",
            "exit_gate": "GATE_P6_EXIT",
            "requirement_tokens": ["PharmacyDispatchSettlement", "PharmacyOutcomeSettlement", "ReleaseRecoveryDisposition"],
            "risk_ids": phase_risks["phase_6"],
            "parallel_tracks": ["TRK_P6_PHARMACY_BACKEND", "TRK_P6_PHARMACY_FRONTEND"],
            "dependencies": ["dep_pharmacy_directory_dohs", "dep_pharmacy_referral_transport", "dep_pharmacy_outcome_observation"],
            "owner_role": "ROLE_PHASE6_OWNER",
        },
    ]

    for cfg in phase_specs:
        milestones.extend(
            [
                milestone_spec(
                    cfg["entry_id"],
                    cfg["entry_title"],
                    "phase_delivery",
                    "current",
                    [cfg["phase_ref"]],
                    cfg["entry_ranges"],
                    cfg["merge_gate"],
                    cfg["owner_role"],
                    cfg["requirement_tokens"],
                    [f"prompt/{cfg['entry_ranges'][0][0]:03d}.md"],
                    [f"ENTRY_{cfg['prefix']}_PREDECESSOR_COMPLETE"],
                    [f"EXIT_{cfg['prefix']}_PARALLEL_WINDOW_OPEN"],
                    [f"{cfg['prefix'].lower()}_contract_pack"],
                    required_dependency_refs=cfg["dependencies"],
                    required_risk_ids=cfg["risk_ids"],
                    notes=f"{cfg['prefix']} defines the contract and opens the contiguous parallel block.",
                ),
                milestone_spec(
                    cfg["parallel_id"],
                    cfg["parallel_title"],
                    "phase_delivery",
                    "current",
                    [cfg["phase_ref"]],
                    cfg["parallel_ranges"],
                    cfg["merge_gate"],
                    cfg["owner_role"],
                    cfg["requirement_tokens"],
                    [f"prompt/{cfg['parallel_ranges'][0][0]:03d}.md"],
                    [f"ENTRY_{cfg['prefix']}_PARALLEL_WINDOW_OPEN"],
                    [f"EXIT_{cfg['prefix']}_PARALLEL_TRACKS_COMPLETE"],
                    [f"{cfg['prefix'].lower()}_implementation_pack"],
                    required_dependency_refs=cfg["dependencies"],
                    required_risk_ids=cfg["risk_ids"],
                    allowed_parallel_track_refs=cfg["parallel_tracks"],
                    notes=f"{cfg['prefix']} keeps backend and frontend lanes explicit inside one contiguous parallel block.",
                ),
                milestone_spec(
                    cfg["merge_id"],
                    cfg["merge_title"],
                    "phase_delivery",
                    "current",
                    [cfg["phase_ref"]],
                    cfg["merge_ranges"],
                    cfg["exit_gate"],
                    cfg["owner_role"],
                    cfg["requirement_tokens"],
                    [f"prompt/{cfg['merge_ranges'][0][0]:03d}.md"],
                    [f"ENTRY_{cfg['prefix']}_PARALLEL_TRACKS_COMPLETE"],
                    [f"EXIT_{cfg['prefix']}_PROOF_PACK_READY"],
                    [f"{cfg['prefix'].lower()}_proof_pack"],
                    required_dependency_refs=cfg["dependencies"],
                    required_risk_ids=cfg["risk_ids"],
                    conformance_row_refs=[conformance_row_ref(cfg["phase_ref"])],
                    notes=f"{cfg['prefix']} merge, configuration, and proof tasks feed the phase exit gate.",
                ),
                milestone_spec(
                    cfg["exit_id"],
                    cfg["exit_title"],
                    "release_gate",
                    "current",
                    [cfg["phase_ref"]],
                    cfg["exit_ranges"],
                    cfg["exit_gate"],
                    cfg["owner_role"],
                    cfg["requirement_tokens"],
                    [f"prompt/{cfg['exit_ranges'][0][0]:03d}.md"],
                    [f"ENTRY_{cfg['prefix']}_PROOF_PACK_READY"],
                    [f"EXIT_{cfg['prefix']}_COMPLETE"],
                    [f"{cfg['prefix'].lower()}_exit_verdict"],
                    required_dependency_refs=cfg["dependencies"],
                    required_risk_ids=cfg["risk_ids"],
                    conformance_row_refs=[conformance_row_ref(cfg["phase_ref"]), current_scorecard],
                    notes=f"{cfg['prefix']} exit approval remains blocked unless the phase conformance row stays exact.",
                ),
            ]
        )

    milestones.extend(
        [
            milestone_spec(
                "MS_POST6_SCOPE_SPLIT_GATE",
                "Post-Phase-6 split gate for deferred NHS App and parallel assistive-assurance work",
                "cross_phase_control",
                "current",
                ["phase_6", "phase_7", "phase_8", "phase_9"],
                [(373, 373)],
                "GATE_POST6_SCOPE_SPLIT",
                "ROLE_PROGRAMME_DIRECTOR",
                ["CrossPhaseConformanceScorecard", "ReleaseWatchTuple", "AssuranceSliceTrustRecord"],
                ["prompt/373.md", "blueprint/phase-cards.md#Programme Baseline Update (NHS App Deferred)"],
                ["ENTRY_PHASE6_EXIT_COMPLETE"],
                ["EXIT_CURRENT_AND_DEFERRED_LANES_EXPLICIT"],
                ["scope_split_gate_pack"],
                required_risk_ids=["RISK_ASSURANCE_001", "RISK_UI_002"],
                notes="This gate is the explicit split between current-baseline Phase 8/9 work and the deferred Phase 7 channel branch.",
            ),
            milestone_spec(
                "MS_P7_DEFINITION_AND_ENTRY",
                "Phase 7 deferred embedded-channel contract freeze",
                "deferred_channel",
                "deferred",
                ["phase_7"],
                [(374, 376)],
                "GATE_P7_DEFERRED_MERGE",
                "ROLE_PHASE7_OWNER",
                ["AudienceSurfaceRuntimeBinding", "ChannelReleaseFreezeRecord", "ReleaseApprovalFreeze"],
                ["prompt/374.md", "prompt/376.md"],
                ["ENTRY_POST6_SCOPE_SPLIT"],
                ["EXIT_P7_PARALLEL_WINDOW_OPEN"],
                ["phase7_contract_pack"],
                required_dependency_refs=["dep_nhs_app_embedded_channel_ecosystem"],
                required_risk_ids=phase_risks["phase_7"],
                notes="Deferred branch remains explicitly modeled and quarantined from the current baseline.",
            ),
            milestone_spec(
                "MS_P7_PARALLEL_EMBEDDED_CHANNEL",
                "Phase 7 deferred embedded-channel implementation",
                "deferred_channel",
                "deferred",
                ["phase_7"],
                [(377, 396)],
                "GATE_P7_DEFERRED_MERGE",
                "ROLE_PHASE7_OWNER",
                ["AudienceSurfaceRuntimeBinding", "ReleaseApprovalFreeze", "ChannelReleaseFreezeRecord"],
                ["prompt/377.md", "prompt/396.md"],
                ["ENTRY_P7_PARALLEL_WINDOW_OPEN"],
                ["EXIT_P7_PARALLEL_TRACKS_COMPLETE"],
                ["phase7_embedded_channel_pack"],
                required_dependency_refs=["dep_nhs_app_embedded_channel_ecosystem"],
                required_risk_ids=phase_risks["phase_7"],
                allowed_parallel_track_refs=["TRK_P7_EMBEDDED_BACKEND", "TRK_P7_EMBEDDED_FRONTEND", "TRK_P7_EMBEDDED_ONBOARDING"],
                notes="The deferred embedded channel keeps backend, frontend, and onboarding tracks visible but off the current critical path.",
            ),
            milestone_spec(
                "MS_P7_MERGE_AND_PROOF",
                "Phase 7 deferred embedded-channel merge and proof",
                "deferred_channel",
                "deferred",
                ["phase_7"],
                [(397, 401)],
                "GATE_P7_EXIT",
                "ROLE_PHASE7_OWNER",
                ["ExperienceContinuityControlEvidence", "AudienceSurfaceRuntimeBinding", "ChannelReleaseFreezeRecord"],
                ["prompt/397.md", "prompt/401.md"],
                ["ENTRY_P7_PARALLEL_TRACKS_COMPLETE"],
                ["EXIT_P7_PROOF_PACK_READY"],
                ["phase7_proof_pack"],
                required_dependency_refs=["dep_nhs_app_embedded_channel_ecosystem"],
                required_risk_ids=phase_risks["phase_7"],
                conformance_row_refs=[conformance_row_ref("phase_7")],
                notes="Deferred-channel proof stays explicit without becoming current-baseline completion evidence.",
            ),
            milestone_spec(
                "MS_P7_EXIT_GATE",
                "Phase 7 deferred channel exit approval",
                "deferred_channel",
                "deferred",
                ["phase_7"],
                [(402, 402)],
                "GATE_P7_EXIT",
                "ROLE_PHASE7_OWNER",
                ["ExperienceContinuityControlEvidence", "ReleaseApprovalFreeze", "ChannelReleaseFreezeRecord"],
                ["prompt/402.md"],
                ["ENTRY_P7_PROOF_PACK_READY"],
                ["EXIT_P7_DEFERRED_READY"],
                ["phase7_exit_verdict"],
                required_dependency_refs=["dep_nhs_app_embedded_channel_ecosystem"],
                required_risk_ids=phase_risks["phase_7"],
                conformance_row_refs=[conformance_row_ref("phase_7"), full_scorecard],
                notes="Deferred channel stays in inventory and can reconcile into the wider programme when explicitly ready.",
            ),
            milestone_spec(
                "MS_P8_DEFINITION_AND_ENTRY",
                "Phase 8 assistive boundary and policy freeze",
                "phase_delivery",
                "current",
                ["phase_8"],
                [(403, 405)],
                "GATE_P8_PARALLEL_MERGE",
                "ROLE_PHASE8_OWNER",
                ["AssuranceSliceTrustRecord", "ReleaseRecoveryDisposition", "CrossPhaseConformanceScorecard"],
                ["prompt/403.md", "prompt/405.md"],
                ["ENTRY_POST6_SCOPE_SPLIT"],
                ["EXIT_P8_PARALLEL_WINDOW_OPEN"],
                ["phase8_policy_envelope_pack"],
                required_dependency_refs=["dep_assistive_model_vendor_family"],
                required_risk_ids=phase_risks["phase_8"],
                notes="Phase 8 is current baseline in architecture, while visible rollout remains optional later in the programme.",
            ),
            milestone_spec(
                "MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION",
                "Phase 8 assistive implementation",
                "phase_delivery",
                "current",
                ["phase_8"],
                [(406, 426)],
                "GATE_P8_PARALLEL_MERGE",
                "ROLE_PHASE8_OWNER",
                ["AssuranceSliceTrustRecord", "ReleaseRecoveryDisposition", "AssistiveFeedbackChain"],
                ["prompt/406.md", "prompt/426.md"],
                ["ENTRY_P8_PARALLEL_WINDOW_OPEN"],
                ["EXIT_P8_PARALLEL_TRACKS_COMPLETE"],
                ["phase8_assistive_pack"],
                required_dependency_refs=["dep_assistive_model_vendor_family"],
                required_risk_ids=phase_risks["phase_8"],
                allowed_parallel_track_refs=["TRK_P8_ASSISTIVE_BACKEND", "TRK_P8_ASSISTIVE_FRONTEND", "TRK_P8_ASSISTIVE_VENDOR"],
                notes="Assistive backend, frontend, and vendor tracks remain visible and bounded by the trust envelope.",
            ),
            milestone_spec(
                "MS_P8_MERGE",
                "Phase 8 assistive merge",
                "phase_delivery",
                "current",
                ["phase_8"],
                [(427, 427)],
                "GATE_P8_EXIT",
                "ROLE_PHASE8_OWNER",
                ["AssuranceSliceTrustRecord", "AssistiveFeedbackChain", "ReleaseRecoveryDisposition"],
                ["prompt/427.md"],
                ["ENTRY_P8_PARALLEL_TRACKS_COMPLETE"],
                ["EXIT_P8_MERGE_COMPLETE"],
                ["phase8_merge_pack"],
                required_dependency_refs=["dep_assistive_model_vendor_family"],
                required_risk_ids=phase_risks["phase_8"],
                conformance_row_refs=[conformance_row_ref("phase_8")],
                notes="Assistive merge stays separate from the later optional visible rollout milestone.",
            ),
            milestone_spec(
                "MS_P8_PROOF_AND_EXIT_PACK",
                "Phase 8 assistive proof pack",
                "phase_delivery",
                "current",
                ["phase_8"],
                [(428, 430)],
                "GATE_P8_EXIT",
                "ROLE_PHASE8_OWNER",
                ["AssuranceSliceTrustRecord", "AssistiveFeedbackChain", "ExperienceContinuityControlEvidence"],
                ["prompt/428.md", "prompt/430.md"],
                ["ENTRY_P8_MERGE_COMPLETE"],
                ["EXIT_P8_PROOF_PACK_READY"],
                ["phase8_proof_pack"],
                required_dependency_refs=["dep_assistive_model_vendor_family"],
                required_risk_ids=phase_risks["phase_8"],
                conformance_row_refs=[conformance_row_ref("phase_8")],
                notes="Assistive proof packs precede exit and remain separate from later optional cohort enablement.",
            ),
            milestone_spec(
                "MS_P8_EXIT_GATE",
                "Phase 8 assistive exit approval",
                "assurance_gate",
                "current",
                ["phase_8"],
                [(431, 431)],
                "GATE_P8_EXIT",
                "ROLE_PHASE8_OWNER",
                ["AssuranceSliceTrustRecord", "ExperienceContinuityControlEvidence", "ReleaseRecoveryDisposition"],
                ["prompt/431.md"],
                ["ENTRY_P8_PROOF_PACK_READY"],
                ["EXIT_P8_COMPLETE"],
                ["phase8_exit_verdict"],
                required_dependency_refs=["dep_assistive_model_vendor_family"],
                required_risk_ids=phase_risks["phase_8"],
                conformance_row_refs=[conformance_row_ref("phase_8"), current_scorecard],
                notes="Phase 8 completes architecturally before any optional visible cohort enablement is attempted.",
            ),
            milestone_spec(
                "MS_P9_DEFINITION_AND_ENTRY",
                "Phase 9 assurance-ledger contract freeze",
                "phase_delivery",
                "current",
                ["phase_9"],
                [(432, 434)],
                "GATE_P9_PARALLEL_MERGE",
                "ROLE_PHASE9_OWNER",
                ["CrossPhaseConformanceScorecard", "OperationalReadinessSnapshot", "RecoveryControlPosture"],
                ["prompt/432.md", "prompt/434.md"],
                ["ENTRY_POST6_SCOPE_SPLIT"],
                ["EXIT_P9_PARALLEL_WINDOW_OPEN"],
                ["phase9_assurance_contract_pack"],
                required_risk_ids=phase_risks["phase_9"],
                notes="Phase 9 freezes assurance, resilience, and governance truth before its implementation block opens.",
            ),
            milestone_spec(
                "MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION",
                "Phase 9 assurance-ledger implementation",
                "phase_delivery",
                "current",
                ["phase_9"],
                [(435, 463)],
                "GATE_P9_PARALLEL_MERGE",
                "ROLE_PHASE9_OWNER",
                ["CrossPhaseConformanceScorecard", "OperationalReadinessSnapshot", "ReleaseWatchTuple", "RecoveryControlPosture"],
                ["prompt/435.md", "prompt/463.md"],
                ["ENTRY_P9_PARALLEL_WINDOW_OPEN"],
                ["EXIT_P9_PARALLEL_TRACKS_COMPLETE"],
                ["phase9_assurance_pack"],
                required_risk_ids=phase_risks["phase_9"],
                allowed_parallel_track_refs=["TRK_P9_ASSURANCE_BACKEND", "TRK_P9_ASSURANCE_FRONTEND", "TRK_P9_PLATFORM_BINDINGS"],
                notes="Assurance backend, frontend, and platform bindings run as one contiguous current-baseline block.",
            ),
            milestone_spec(
                "MS_P9_MERGE",
                "Phase 9 assurance merge",
                "phase_delivery",
                "current",
                ["phase_9"],
                [(464, 464)],
                "GATE_P9_EXIT",
                "ROLE_PHASE9_OWNER",
                ["AssuranceEvidenceGraphSnapshot", "OperationalReadinessSnapshot", "CrossPhaseConformanceScorecard"],
                ["prompt/464.md"],
                ["ENTRY_P9_PARALLEL_TRACKS_COMPLETE"],
                ["EXIT_P9_MERGE_COMPLETE"],
                ["phase9_merge_pack"],
                required_risk_ids=phase_risks["phase_9"],
                conformance_row_refs=[conformance_row_ref("phase_9")],
                notes="Phase 9 merge binds assurance, governance, and operations surfaces back to live domain event streams.",
            ),
            milestone_spec(
                "MS_P9_PROOF_AND_EXIT_PACK",
                "Phase 9 resilience and conformance proof pack",
                "phase_delivery",
                "current",
                ["phase_9"],
                [(465, 470)],
                "GATE_P9_EXIT",
                "ROLE_PHASE9_OWNER",
                ["OperationalReadinessSnapshot", "RecoveryControlPosture", "CrossPhaseConformanceScorecard"],
                ["prompt/465.md", "prompt/470.md"],
                ["ENTRY_P9_MERGE_COMPLETE"],
                ["EXIT_P9_PROOF_PACK_READY"],
                ["phase9_proof_pack"],
                required_risk_ids=phase_risks["phase_9"],
                conformance_row_refs=[conformance_row_ref("phase_9")],
                notes="Phase 9 proves resilience, audit, and conformance before formal exit.",
            ),
            milestone_spec(
                "MS_P9_EXIT_GATE",
                "Phase 9 assurance-ledger exit approval",
                "assurance_gate",
                "current",
                ["phase_9"],
                [(471, 471)],
                "GATE_P9_EXIT",
                "ROLE_PHASE9_OWNER",
                ["CrossPhaseConformanceScorecard", "OperationalReadinessSnapshot", "ReleaseWatchTuple"],
                ["prompt/471.md"],
                ["ENTRY_P9_PROOF_PACK_READY"],
                ["EXIT_P9_COMPLETE"],
                ["phase9_exit_verdict"],
                required_risk_ids=phase_risks["phase_9"],
                conformance_row_refs=[conformance_row_ref("phase_9"), current_scorecard],
                notes="Phase 9 exit is the proof-bearing closure point for operations, governance, and resilience.",
            ),
            milestone_spec(
                "MS_PRG_CURRENT_BASELINE_CONFORMANCE",
                "Current-baseline conformance scorecard reconciliation",
                "assurance_gate",
                "current",
                ["programme_release"],
                [(472, 472)],
                "GATE_CURRENT_BASELINE_CONFORMANCE",
                "ROLE_PROGRAMME_DIRECTOR",
                ["CrossPhaseConformanceScorecard", "PhaseConformanceRow", "OperationalReadinessSnapshot"],
                ["prompt/472.md", "blueprint/phase-9-the-assurance-ledger.md#CrossPhaseConformanceScorecard"],
                ["ENTRY_P6_P8_P9_EXIT_COMPLETE"],
                ["EXIT_CURRENT_BASELINE_SCORECARD_EXACT"],
                ["cross_phase_conformance_scorecard_current_baseline"],
                required_risk_ids=["RISK_ASSURANCE_001", "RISK_RUNTIME_001"],
                conformance_row_refs=[
                    conformance_row_ref("phase_0"),
                    conformance_row_ref("phase_1"),
                    conformance_row_ref("phase_2"),
                    scorecard_ref("cross_phase_controls"),
                    conformance_row_ref("phase_3"),
                    conformance_row_ref("phase_4"),
                    conformance_row_ref("phase_5"),
                    conformance_row_ref("phase_6"),
                    conformance_row_ref("phase_8"),
                    conformance_row_ref("phase_9"),
                    current_scorecard,
                ],
                notes="This is the current-baseline completion line defined by the phase cards: phases 0-6, 8, and 9.",
            ),
            milestone_spec(
                "MS_PRG_DEFERRED_PHASE7_CONFORMANCE",
                "Deferred Phase 7 reconciliation into the master scorecard",
                "deferred_channel",
                "deferred",
                ["programme_release", "phase_7"],
                [(473, 473)],
                "GATE_DEFERRED_NHSAPP_ENABLEMENT",
                "ROLE_PROGRAMME_DIRECTOR",
                ["CrossPhaseConformanceScorecard", "PhaseConformanceRow", "AudienceSurfaceRuntimeBinding"],
                ["prompt/473.md"],
                ["ENTRY_P7_EXIT_COMPLETE"],
                ["EXIT_DEFERRED_PHASE7_SCORECARD_READY"],
                ["cross_phase_conformance_scorecard_deferred_phase7"],
                required_risk_ids=["RISK_UI_002"],
                conformance_row_refs=[conformance_row_ref("phase_7"), full_scorecard],
                notes="Deferred reconciliation remains visible but does not block current-baseline release readiness.",
            ),
            milestone_spec(
                "MS_PRG_RELEASE_READINESS",
                "Release readiness, signoff, dress rehearsal, and final verification",
                "release_gate",
                "current",
                ["programme_release"],
                [(474, 481)],
                "GATE_RELEASE_READINESS",
                "ROLE_RELEASE_MANAGER",
                ["ReleaseWatchTuple", "WaveObservationPolicy", "OperationalReadinessSnapshot", "CrossPhaseConformanceScorecard"],
                ["prompt/474.md", "prompt/481.md"],
                ["ENTRY_CURRENT_BASELINE_SCORECARD_EXACT"],
                ["EXIT_RELEASE_READINESS_PACK_READY"],
                ["production_readiness_pack", "dress_rehearsal_pack", "final_verification_pack"],
                required_risk_ids=["RISK_ASSURANCE_001", "RISK_RUNTIME_001"],
                conformance_row_refs=[current_scorecard],
                notes="Current-baseline release readiness does not wait on deferred Phase 7 or optional visible assistive enablement.",
            ),
            milestone_spec(
                "MS_PRG_WAVE1_PROMOTION_AND_OBSERVATION",
                "Wave 1 promotion and observation window",
                "release_gate",
                "current",
                ["programme_release"],
                [(482, 483)],
                "GATE_WAVE1_OBSERVATION",
                "ROLE_RELEASE_MANAGER",
                ["ReleaseWatchTuple", "WaveObservationPolicy", "OperationalReadinessSnapshot"],
                ["prompt/482.md", "prompt/483.md"],
                ["ENTRY_RELEASE_READINESS_PACK_READY"],
                ["EXIT_WAVE1_OBSERVATION_SATISFIED"],
                ["wave1_watch_tuple_pack", "wave1_observation_pack"],
                required_risk_ids=["RISK_ASSURANCE_001"],
                conformance_row_refs=[current_scorecard],
                notes="Wave 1 must publish and observe the watch tuple before widening or BAU handover continues.",
            ),
            milestone_spec(
                "MS_PRG_MULTIWAVE_RELEASE",
                "Guardrailed widening for remaining current-baseline waves",
                "release_gate",
                "current",
                ["programme_release"],
                [(484, 484)],
                "GATE_BAU_TRANSFER",
                "ROLE_RELEASE_MANAGER",
                ["ReleaseWatchTuple", "WaveObservationPolicy", "OperationalReadinessSnapshot"],
                ["prompt/484.md"],
                ["ENTRY_WAVE1_OBSERVATION_SATISFIED"],
                ["EXIT_CURRENT_BASELINE_WAVES_STABLE"],
                ["widening_wave_pack"],
                required_risk_ids=["RISK_ASSURANCE_001"],
                conformance_row_refs=[current_scorecard],
                notes="Current-baseline widening closes before optional or deferred channel enablement branches are considered.",
            ),
            milestone_spec(
                "MS_PRG_OPTIONAL_ASSISTIVE_VISIBLE_ENABLEMENT",
                "Optional visible assistive enablement for approved cohorts",
                "release_gate",
                "optional",
                ["programme_release", "phase_8"],
                [(485, 485)],
                "GATE_OPTIONAL_ASSISTIVE_ENABLEMENT",
                "ROLE_PHASE8_OWNER",
                ["AssuranceSliceTrustRecord", "ReleaseWatchTuple", "WaveObservationPolicy"],
                ["prompt/485.md"],
                ["ENTRY_CURRENT_BASELINE_WAVES_STABLE"],
                ["EXIT_OPTIONAL_ASSISTIVE_COHORTS_ENABLED"],
                ["assistive_visible_cohort_pack"],
                required_risk_ids=phase_risks["phase_8"],
                conformance_row_refs=[conformance_row_ref("phase_8")],
                notes="Visible assistive enablement is optional and never blocks current-baseline BAU handover.",
            ),
            milestone_spec(
                "MS_PRG_DEFERRED_NHSAPP_ENABLEMENT",
                "Deferred NHS App enablement for approved manifest versions",
                "deferred_channel",
                "deferred",
                ["programme_release", "phase_7"],
                [(486, 486)],
                "GATE_DEFERRED_NHSAPP_ENABLEMENT",
                "ROLE_PHASE7_OWNER",
                ["ReleaseApprovalFreeze", "ChannelReleaseFreezeRecord", "AudienceSurfaceRuntimeBinding"],
                ["prompt/486.md"],
                ["ENTRY_P7_SCORECARD_AND_WIDENING_READY"],
                ["EXIT_DEFERRED_NHSAPP_ENABLED"],
                ["nhsapp_manifest_enablement_pack"],
                required_dependency_refs=["dep_nhs_app_embedded_channel_ecosystem"],
                required_risk_ids=phase_risks["phase_7"],
                conformance_row_refs=[conformance_row_ref("phase_7")],
                notes="Deferred channel enablement stays explicit and separate from the current-baseline closure path.",
            ),
            milestone_spec(
                "MS_PRG_BAU_HANDOVER_AND_ARCHIVE",
                "BAU handover, evidence archive, and watchlist closeout",
                "assurance_gate",
                "current",
                ["programme_release"],
                [(487, 489)],
                "GATE_BAU_TRANSFER",
                "ROLE_PROGRAMME_DIRECTOR",
                ["CrossPhaseConformanceScorecard", "BAUReadinessPack", "ReleaseToBAURecord", "OperationalReadinessSnapshot"],
                ["prompt/487.md", "prompt/489.md"],
                ["ENTRY_CURRENT_BASELINE_WAVES_STABLE"],
                ["EXIT_PROGRAMME_INTO_BAU"],
                ["bau_readiness_pack", "release_to_bau_record", "launch_evidence_archive"],
                required_risk_ids=["RISK_ASSURANCE_001", "RISK_RUNTIME_001"],
                conformance_row_refs=[current_scorecard, full_scorecard],
                notes="BAU transfer closes the current baseline without waiting on optional or deferred enablement branches.",
            ),
        ]
    )

    gates = [
        gate_spec(
            "GATE_PLAN_EXTERNAL_ENTRY",
            "Planning and gate-foundation entry into external readiness",
            "phase_entry",
            "current",
            ["MS_PLAN_DISCOVERY_BASELINE", "MS_PLAN_EXECUTION_GRAPH", "MS_PLAN_RISK_AND_TRACEABILITY_FOUNDATION"],
            ["programme_milestones.json", "master_risk_register.json", "requirement_task_traceability.csv", "phase0_gate_verdict.json"],
            [],
            planning_risks,
            [current_scorecard, conformance_row_ref("phase_0")],
            ["RULE_SEQ_SCOPE_AWARE_ORDER", "RULE_LONG_LEAD_VISIBLE"],
            "ROLE_PROGRAMME_DIRECTOR",
            "External onboarding starts without an execution graph, risk posture, or traceability foundation and later gates become title-driven instead of evidence-driven.",
            "Planning only completes when programme graph, risk/watch posture, traceability, and Phase 0 gate foundation are published.",
        ),
        gate_spec(
            "GATE_EXTERNAL_TO_FOUNDATION",
            "External readiness entry into Phase 0 foundation work",
            "external_readiness",
            "current",
            [
                "MS_EXT_STRATEGY_AND_ACCOUNT_PLAN",
                "MS_EXT_NHS_LOGIN_ONBOARDING",
                "MS_EXT_IM1_SCAL_READINESS",
                "MS_EXT_MESH_ACCESS",
                "MS_EXT_COMMS_AND_SCAN_VENDORS",
                "MS_EXT_PROVIDER_PATHS_AND_EVIDENCE",
                "MS_EXT_SIMULATOR_AND_MANUAL_GATE_FREEZE",
            ],
            ["external_dependencies.json", "external_assurance_obligations.csv", "dependency_simulator_strategy.json", "integration_assumption_freeze"],
            ["dep_nhs_login_rail", "dep_im1_pairing_programme", "dep_cross_org_secure_messaging_mesh"],
            ["HZ_WRONG_PATIENT_BINDING", "HZ_TELEPHONY_EVIDENCE_INADEQUACY"],
            [conformance_row_ref("phase_0")],
            ["RULE_LONG_LEAD_VISIBLE", "RULE_DEFERRED_PHASE7_NO_PROXY"],
            "ROLE_DEPENDENCY_LEAD",
            "Phase 0 begins without partner-path visibility, simulator posture, or manual checkpoint truth and later merge gates discover hidden approvals too late.",
            "Optional PDS and deferred NHS App onboarding stay inventoried but are not required for current-baseline Phase 0 entry.",
        ),
        gate_spec(
            "GATE_OPTIONAL_PDS_ENABLEMENT",
            "Optional PDS enablement gate",
            "external_readiness",
            "optional",
            ["MS_EXT_OPTIONAL_PDS_ENRICHMENT"],
            ["PDSSandboxRequest", "PDSFeatureFlagPlan"],
            ["dep_pds_fhir_enrichment"],
            ["RISK_STATE_004"],
            [conformance_row_ref("phase_2")],
            ["RULE_DEFERRED_PHASE7_NO_PROXY"],
            "ROLE_GOVERNANCE_LEAD",
            "Optional PDS work silently mutates baseline identity truth without governed legal-basis and feature-flag posture.",
            "Optional PDS remains outside the current baseline unless later explicitly enabled.",
        ),
        gate_spec(
            "GATE_P0_0A_TO_0B",
            "Phase 0A hard gate into 0B domain kernel",
            "phase_entry",
            "current",
            ["MS_P0_0A_DELIVERY_SKELETON"],
            ["monorepo_boundary_rules", "bootstrap_runbooks", "ci_pipeline_bootstrap"],
            [],
            phase_risks["phase_0"][:2],
            [],
            ["RULE_SEQ_SCOPE_AWARE_ORDER"],
            "ROLE_PLATFORM_ARCHITECT",
            "Domain kernel work starts before repository boundaries, startup, and delivery controls are hard-gated.",
            "This is the first hard gate in the Phase 0 internal sub-phase map.",
        ),
        gate_spec(
            "GATE_P0_0B_TO_0C",
            "Phase 0B hard gate into 0C runtime publication substrate",
            "phase_entry",
            "current",
            ["MS_P0_0B_DOMAIN_KERNEL"],
            ["canonical_domain_glossary.csv", "state_machines.json", "service_runtime_matrix.csv"],
            [],
            phase_risks["phase_0"],
            [],
            ["RULE_SEQ_SCOPE_AWARE_ORDER"],
            "ROLE_FOUNDATION_DOMAIN_OWNER",
            "Runtime and release work starts without the canonical kernel, state axes, and coordinator-owned closure law frozen enough for later phases.",
            "0B must finish before runtime publication and release tuples are treated as meaningful.",
        ),
        gate_spec(
            "GATE_P0_0C_TO_0D",
            "Phase 0C hard gate into 0D control governors",
            "phase_entry",
            "current",
            ["MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE"],
            ["runtime_workload_families.json", "gateway_surface_matrix.csv", "release_gate_matrix.csv"],
            [],
            ["RISK_RUNTIME_001"],
            [],
            ["RULE_SEQ_SCOPE_AWARE_ORDER"],
            "ROLE_RUNTIME_RELEASE_OWNER",
            "Control-plane work begins without runtime publication, watch, and release tuple law frozen.",
            "0C makes runtime publication a foundation concern rather than late hardening.",
        ),
        gate_spec(
            "GATE_P0_0D_TO_0E",
            "Phase 0D hard gate into 0E verification and contract publication",
            "phase_entry",
            "current",
            ["MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW"],
            ["acting_scope_tuple_matrix.csv", "idempotency_and_replay_rules.json", "dependency_truth_and_fallback_matrix.csv"],
            [],
            phase_risks["phase_0"][:5],
            [],
            ["RULE_SEQ_SCOPE_AWARE_ORDER"],
            "ROLE_CONTROL_PLANE_OWNER",
            "Verification and shell work starts before tenant scope, mutation law, and degraded-mode control tuples are authoritative.",
            "0D freezes control-plane law before later shells and tests can rely on it.",
        ),
        gate_spec(
            "GATE_P0_PARALLEL_FOUNDATION_OPEN",
            "Phase 0 parallel foundation open gate",
            "phase_entry",
            "current",
            ["MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS"],
            ["playwright_coverage_matrix.csv", "ui_contract_publication_matrix.csv", "dependency_simulator_strategy.json"],
            [],
            phase_risks["phase_0"][:5],
            [],
            ["RULE_SEQ_SCOPE_AWARE_ORDER", "RULE_PAR_BLOCK_COMPLETE"],
            "ROLE_FOUNDATION_PROGRAMME_OWNER",
            "Parallel implementation opens without verification, simulator, and contract-publication law already pinned.",
            "This is the explicit gate that opens the Phase 0 parallel foundation tracks named by the checklist.",
        ),
        gate_spec(
            "GATE_P0_0F_TO_0G",
            "Phase 0 hard gate from 0F synthetic flow into 0G assurance closeout",
            "phase_entry",
            "current",
            ["MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW"],
            ["audience_surface_inventory.csv", "gateway_surface_matrix.csv", "release_publication_parity_pack"],
            [],
            ["RISK_MUTATION_003", "RISK_ASSURANCE_001"],
            [conformance_row_ref("phase_0")],
            ["RULE_SEQ_SCOPE_AWARE_ORDER"],
            "ROLE_FOUNDATION_EXPERIENCE_OWNER",
            "Phase 0 closeout starts before same-shell parity, synthetic flow, and publication parity are proven.",
            "0F must complete before assurance and exit signoff close the foundation.",
        ),
        gate_spec(
            "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
            "Phase 0 long-lead assurance merge gate",
            "par_block_merge",
            "current",
            [
                "MS_P0_0G_DCB0129_SAFETY_CASE",
                "MS_P0_0G_DSPT_READINESS",
                "MS_P0_0G_IM1_SCAL_ASSURANCE",
                "MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE",
                "MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE",
            ],
            ["safety_hazard_register_seed.csv", "dspt_gap_assessment_pack", "im1_scal_readiness_pack", "nhs_login_onboarding_evidence_pack", "dpia_backlog_pack"],
            ["dep_nhs_login_rail", "dep_im1_pairing_programme", "dep_nhs_assurance_and_standards_sources"],
            ["HZ_WRONG_PATIENT_BINDING", "HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE"],
            [conformance_row_ref("phase_0")],
            ["RULE_LONG_LEAD_VISIBLE", "RULE_PAR_BLOCK_COMPLETE"],
            "ROLE_MANUFACTURER_CSO",
            "Foundation exit proceeds while long-lead safety, privacy, and partner approvals remain invisible or stale.",
            "All named long-lead tracks must be visible before Phase 0 exit proof can settle.",
        ),
        gate_spec(
            "GATE_P0_EXIT",
            "Phase 0 exit gate",
            "phase_exit",
            "current",
            ["MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF"],
            ["release_candidate_freeze_pack", "foundation_exit_evidence_pack", "backup_restore_rehearsal_pack", "cross_phase_conformance_scorecard_current_baseline"],
            ["dep_nhs_login_rail", "dep_im1_pairing_programme"],
            unique(phase_risks["phase_0"] + ["HZ_WRONG_PATIENT_BINDING"]),
            [conformance_row_ref("phase_0"), current_scorecard],
            ["RULE_CONFORMANCE_ROW_FRESH", "RULE_RUNTIME_PUBLICATION_AND_OPS_PROOF"],
            "ROLE_FOUNDATION_PROGRAMME_OWNER",
            "Feature phases start while release tuple, recovery posture, or long-lead assurance evidence is still stale.",
            "Phase 0 exit freezes the spine before later phases may build on it.",
        ),
    ]

    later_gate_configs = [
        ("GATE_P1_PARALLEL_MERGE", "Phase 1 intake parallel merge", "MS_P1_PARALLEL_INTAKE_IMPLEMENTATION", "current", ["phase1_end_to_end_evidence_pack"], [], phase_risks["phase_1"], [conformance_row_ref("phase_1")], "ROLE_PHASE1_OWNER"),
        ("GATE_P1_EXIT", "Phase 1 exit gate", "MS_P1_MERGE_AND_PROOF", "current", ["phase1_exit_verdict", "phase1_end_to_end_evidence_pack"], [], phase_risks["phase_1"], [conformance_row_ref("phase_1"), current_scorecard], "ROLE_PHASE1_OWNER"),
        ("GATE_P2_PARALLEL_MERGE", "Phase 2 identity and telephony parallel merge", "MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY", "current", ["phase2_identity_and_echoes_pack"], ["dep_nhs_login_rail", "dep_telephony_ivr_recording_provider"], phase_risks["phase_2"], [conformance_row_ref("phase_2")], "ROLE_PHASE2_OWNER"),
        ("GATE_P2_EXIT", "Phase 2 exit gate", "MS_P2_PROOF_AND_REGRESSION", "current", ["phase2_exit_verdict", "phase2_regression_evidence_pack"], ["dep_nhs_login_rail"], phase_risks["phase_2"], [conformance_row_ref("phase_2"), current_scorecard], "ROLE_PHASE2_OWNER"),
        ("GATE_XC_PARALLEL_MERGE", "Cross-phase portal/support parallel merge", "MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT", "current", ["patient_account_surface_pack", "support_workspace_pack"], [], ["RISK_ASSURANCE_001", "RISK_UI_001"], [scorecard_ref("cross_phase_controls")], "ROLE_CROSS_PHASE_OWNER"),
        ("GATE_XC_EXIT", "Cross-phase portal/support exit gate", "MS_XC_MERGE_AND_PROOF", "current", ["cross_phase_exit_verdict", "cross_phase_continuity_pack"], [], ["RISK_ASSURANCE_001", "RISK_UI_001"], [scorecard_ref("cross_phase_controls"), current_scorecard], "ROLE_CROSS_PHASE_OWNER"),
        ("GATE_P3_PARALLEL_MERGE", "Phase 3 triage parallel merge", "MS_P3_PARALLEL_TRIAGE_AND_CALLBACK", "current", ["p3_implementation_pack"], [], phase_risks["phase_3"], [conformance_row_ref("phase_3")], "ROLE_PHASE3_OWNER"),
        ("GATE_P3_EXIT", "Phase 3 exit gate", "MS_P3_MERGE_AND_PROOF", "current", ["p3_exit_verdict", "p3_proof_pack"], [], phase_risks["phase_3"], [conformance_row_ref("phase_3"), current_scorecard], "ROLE_PHASE3_OWNER"),
        ("GATE_P4_PARALLEL_MERGE", "Phase 4 booking parallel merge", "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION", "current", ["p4_implementation_pack"], ["dep_local_booking_supplier_adapters"], phase_risks["phase_4"], [conformance_row_ref("phase_4")], "ROLE_PHASE4_OWNER"),
        ("GATE_P4_EXIT", "Phase 4 exit gate", "MS_P4_MERGE_CONFIG_AND_PROOF", "current", ["p4_exit_verdict", "p4_proof_pack"], ["dep_local_booking_supplier_adapters"], phase_risks["phase_4"], [conformance_row_ref("phase_4"), current_scorecard], "ROLE_PHASE4_OWNER"),
        ("GATE_P5_PARALLEL_MERGE", "Phase 5 network parallel merge", "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION", "current", ["p5_implementation_pack"], ["dep_network_capacity_partner_feeds", "dep_cross_org_secure_messaging_mesh"], phase_risks["phase_5"], [conformance_row_ref("phase_5")], "ROLE_PHASE5_OWNER"),
        ("GATE_P5_EXIT", "Phase 5 exit gate", "MS_P5_MERGE_CONFIG_AND_PROOF", "current", ["p5_exit_verdict", "p5_proof_pack"], ["dep_network_capacity_partner_feeds"], phase_risks["phase_5"], [conformance_row_ref("phase_5"), current_scorecard], "ROLE_PHASE5_OWNER"),
        ("GATE_P6_PARALLEL_MERGE", "Phase 6 pharmacy parallel merge", "MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION", "current", ["p6_implementation_pack"], ["dep_pharmacy_directory_dohs", "dep_pharmacy_referral_transport"], phase_risks["phase_6"], [conformance_row_ref("phase_6")], "ROLE_PHASE6_OWNER"),
        ("GATE_P6_EXIT", "Phase 6 exit gate", "MS_P6_MERGE_CONFIG_AND_PROOF", "current", ["p6_exit_verdict", "p6_proof_pack"], ["dep_pharmacy_directory_dohs"], phase_risks["phase_6"], [conformance_row_ref("phase_6"), current_scorecard], "ROLE_PHASE6_OWNER"),
        ("GATE_POST6_SCOPE_SPLIT", "Post-Phase-6 scope split gate", "programme_conformance", "current", "MS_POST6_SCOPE_SPLIT_GATE", ["scope_split_gate_pack"], [], ["RISK_ASSURANCE_001", "RISK_UI_002"], [current_scorecard], "ROLE_PROGRAMME_DIRECTOR"),
        ("GATE_P7_DEFERRED_MERGE", "Phase 7 deferred parallel merge", "par_block_merge", "deferred", "MS_P7_PARALLEL_EMBEDDED_CHANNEL", ["phase7_embedded_channel_pack"], ["dep_nhs_app_embedded_channel_ecosystem"], phase_risks["phase_7"], [conformance_row_ref("phase_7")], "ROLE_PHASE7_OWNER"),
        ("GATE_P7_EXIT", "Phase 7 deferred exit gate", "phase_exit", "deferred", "MS_P7_MERGE_AND_PROOF", ["phase7_exit_verdict", "phase7_proof_pack"], ["dep_nhs_app_embedded_channel_ecosystem"], phase_risks["phase_7"], [conformance_row_ref("phase_7"), full_scorecard], "ROLE_PHASE7_OWNER"),
        ("GATE_P8_PARALLEL_MERGE", "Phase 8 assistive parallel merge", "par_block_merge", "current", "MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION", ["phase8_assistive_pack"], ["dep_assistive_model_vendor_family"], phase_risks["phase_8"], [conformance_row_ref("phase_8")], "ROLE_PHASE8_OWNER"),
        ("GATE_P8_EXIT", "Phase 8 assistive exit gate", "phase_exit", "current", "MS_P8_PROOF_AND_EXIT_PACK", ["phase8_exit_verdict", "phase8_proof_pack"], ["dep_assistive_model_vendor_family"], phase_risks["phase_8"], [conformance_row_ref("phase_8"), current_scorecard], "ROLE_PHASE8_OWNER"),
        ("GATE_P9_PARALLEL_MERGE", "Phase 9 assurance parallel merge", "par_block_merge", "current", "MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION", ["phase9_assurance_pack"], [], phase_risks["phase_9"], [conformance_row_ref("phase_9")], "ROLE_PHASE9_OWNER"),
        ("GATE_P9_EXIT", "Phase 9 assurance exit gate", "phase_exit", "current", "MS_P9_PROOF_AND_EXIT_PACK", ["phase9_exit_verdict", "phase9_proof_pack"], [], phase_risks["phase_9"], [conformance_row_ref("phase_9"), current_scorecard], "ROLE_PHASE9_OWNER"),
        ("GATE_CURRENT_BASELINE_CONFORMANCE", "Current-baseline conformance gate", "programme_conformance", "current", "MS_PRG_CURRENT_BASELINE_CONFORMANCE", ["cross_phase_conformance_scorecard_current_baseline"], [], ["RISK_ASSURANCE_001", "RISK_RUNTIME_001"], [current_scorecard], "ROLE_PROGRAMME_DIRECTOR"),
        ("GATE_RELEASE_READINESS", "Release readiness gate", "seq_release", "current", "MS_PRG_RELEASE_READINESS", ["production_readiness_pack", "dress_rehearsal_pack", "final_verification_pack"], [], ["RISK_ASSURANCE_001", "RISK_RUNTIME_001"], [current_scorecard], "ROLE_RELEASE_MANAGER"),
        ("GATE_WAVE1_OBSERVATION", "Wave 1 observation gate", "seq_release", "current", "MS_PRG_WAVE1_PROMOTION_AND_OBSERVATION", ["wave1_watch_tuple_pack", "wave1_observation_pack"], [], ["RISK_ASSURANCE_001"], [current_scorecard], "ROLE_RELEASE_MANAGER"),
        ("GATE_OPTIONAL_ASSISTIVE_ENABLEMENT", "Optional assistive visible-mode gate", "programme_conformance", "optional", "MS_PRG_OPTIONAL_ASSISTIVE_VISIBLE_ENABLEMENT", ["assistive_visible_cohort_pack"], ["dep_assistive_model_vendor_family"], phase_risks["phase_8"], [conformance_row_ref("phase_8")], "ROLE_PHASE8_OWNER"),
        ("GATE_DEFERRED_NHSAPP_ENABLEMENT", "Deferred NHS App enablement gate", "programme_conformance", "deferred", ["MS_PRG_DEFERRED_PHASE7_CONFORMANCE", "MS_PRG_DEFERRED_NHSAPP_ENABLEMENT"], ["nhsapp_manifest_enablement_pack"], ["dep_nhs_app_embedded_channel_ecosystem"], phase_risks["phase_7"], [conformance_row_ref("phase_7"), full_scorecard], "ROLE_PHASE7_OWNER"),
        ("GATE_BAU_TRANSFER", "BAU transfer gate", "programme_conformance", "current", ["MS_PRG_MULTIWAVE_RELEASE", "MS_PRG_BAU_HANDOVER_AND_ARCHIVE"], ["bau_readiness_pack", "release_to_bau_record", "launch_evidence_archive"], [], ["RISK_ASSURANCE_001", "RISK_RUNTIME_001"], [current_scorecard, full_scorecard], "ROLE_PROGRAMME_DIRECTOR"),
    ]

    def gate_type_for(gate_id: str) -> str:
        if "PARALLEL_MERGE" in gate_id or gate_id == "GATE_P7_DEFERRED_MERGE":
            return "par_block_merge"
        if gate_id in {"GATE_RELEASE_READINESS", "GATE_WAVE1_OBSERVATION"}:
            return "seq_release"
        if gate_id in {
            "GATE_P1_EXIT",
            "GATE_P2_EXIT",
            "GATE_P3_EXIT",
            "GATE_P4_EXIT",
            "GATE_P5_EXIT",
            "GATE_P6_EXIT",
            "GATE_P7_EXIT",
            "GATE_P8_EXIT",
            "GATE_P9_EXIT",
        }:
            return "phase_exit"
        return "programme_conformance"

    for config in later_gate_configs:
        if len(config) == 10:
            gate_id, title, gate_type, scope, incoming, artifacts, deps, risks, conformance, owner = config
        elif len(config) == 9:
            gate_id, title, incoming, scope, artifacts, deps, risks, conformance, owner = config
            gate_type = gate_type_for(gate_id)
        else:
            raise SystemExit(f"GATE_CONFIG_ARITY_ERROR: {config}")
        incoming_refs = incoming if isinstance(incoming, list) else [incoming]
        gates.append(
            gate_spec(
                gate_id,
                title,
                gate_type,
                scope,
                incoming_refs,
                artifacts,
                deps,
                risks,
                conformance,
                ["RULE_PAR_BLOCK_COMPLETE" if gate_type == "par_block_merge" else "RULE_CONFORMANCE_ROW_FRESH", "RULE_DEFERRED_PHASE7_NO_PROXY" if scope in {"current", "optional"} else "RULE_LONG_LEAD_VISIBLE"],
                owner,
                f"{title} is skipped and later sequence work outruns the required evidence tuple or conformance posture.",
                f"{title} keeps its evidence tuple explicit and scope-aware in the programme graph.",
            )
        )

    phase0_subphases = [
        {
            "subphase_code": "0A",
            "subphase_title": "Delivery skeleton and repository architecture",
            "milestone_refs": ["MS_P0_0A_DELIVERY_SKELETON"],
            "hard_gate_ref": "GATE_P0_0A_TO_0B",
            "source_refs": ["blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture"],
            "notes": "Source-named sub-phase.",
        },
        {
            "subphase_code": "0B",
            "subphase_title": "Canonical domain kernel and state machine",
            "milestone_refs": ["MS_P0_0B_DOMAIN_KERNEL"],
            "hard_gate_ref": "GATE_P0_0B_TO_0C",
            "source_refs": ["blueprint/phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine"],
            "notes": "Source-named sub-phase.",
        },
        {
            "subphase_code": "0C",
            "subphase_title": "Runtime topology, publication tuple, and release substrate",
            "milestone_refs": ["MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE"],
            "hard_gate_ref": "GATE_P0_0C_TO_0D",
            "source_refs": ["blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple", "blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            "notes": "Derived bridging sub-phase for the source-required runtime and release substrate.",
        },
        {
            "subphase_code": "0D",
            "subphase_title": "Control governors, tenant scope, and mutation law",
            "milestone_refs": ["MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW"],
            "hard_gate_ref": "GATE_P0_0D_TO_0E",
            "source_refs": ["blueprint/phase-cards.md#Programme Summary-Layer Alignment", "blueprint/phase-0-the-foundation-protocol.md#The detailed Phase 0 development algorithm"],
            "notes": "Derived bridging sub-phase for control-plane and scope tuples that later phases assume.",
        },
        {
            "subphase_code": "0E",
            "subphase_title": "Verification ladder, simulators, and contract-publication kernel",
            "milestone_refs": ["MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS"],
            "hard_gate_ref": "GATE_P0_PARALLEL_FOUNDATION_OPEN",
            "source_refs": ["blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract", "blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            "notes": "Derived bridging sub-phase for the open-parallel foundation gate.",
        },
        {
            "subphase_code": "0F",
            "subphase_title": "Seed shells, audience bindings, and synthetic flow integration",
            "milestone_refs": ["MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW"],
            "hard_gate_ref": "GATE_P0_0F_TO_0G",
            "source_refs": ["blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol"],
            "notes": "Derived bridging sub-phase for seed-shell integration and same-shell continuity proof.",
        },
        {
            "subphase_code": "0G",
            "subphase_title": "Observability, security plumbing, operational controls, and long-lead assurance closeout",
            "milestone_refs": [
                "MS_P0_0G_DCB0129_SAFETY_CASE",
                "MS_P0_0G_DSPT_READINESS",
                "MS_P0_0G_IM1_SCAL_ASSURANCE",
                "MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE",
                "MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE",
                "MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF",
            ],
            "hard_gate_ref": "GATE_P0_EXIT",
            "source_refs": ["blueprint/phase-0-the-foundation-protocol.md#0G. Observability, security plumbing, and operational controls"],
            "notes": "Source-named sub-phase expanded into explicit long-lead assurance and exit-proof milestones.",
        },
    ]

    return milestones, gates, tracks, phase0_subphases


def expand_milestones(
    tasks: list[dict[str, Any]],
    requirement_index: list[tuple[str, str]],
    milestone_specs: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, list[str]], dict[str, str]]:
    tasks_by_num = {task["num"]: task for task in tasks}
    milestones: list[dict[str, Any]] = []
    milestone_task_map: dict[str, list[str]] = {}
    task_to_milestone: dict[str, str] = {}

    for index, spec in enumerate(milestone_specs, start=1):
        refs = task_refs(tasks_by_num, spec["task_ranges"])
        if not refs:
            raise SystemExit(f"MILESTONE_RANGE_EMPTY: {spec['milestone_id']}")
        for task_ref in refs:
            if task_ref in task_to_milestone:
                raise SystemExit(f"MILESTONE_RANGE_OVERLAP: {task_ref} already mapped to {task_to_milestone[task_ref]}")
            task_to_milestone[task_ref] = spec["milestone_id"]
        milestone_task_map[spec["milestone_id"]] = refs

        milestones.append(
            {
                "ordinal": index,
                "milestone_id": spec["milestone_id"],
                "milestone_title": spec["milestone_title"],
                "milestone_class": spec["milestone_class"],
                "baseline_scope": spec["baseline_scope"],
                "source_task_refs": refs,
                "source_phase_refs": spec["phase_refs"],
                "entry_condition_refs": spec["entry_condition_refs"],
                "exit_condition_refs": spec["exit_condition_refs"],
                "required_artifact_refs": spec["required_artifact_refs"],
                "required_requirement_ids": resolve_requirement_ids(requirement_index, spec["requirement_tokens"]),
                "required_risk_ids": spec["required_risk_ids"],
                "required_dependency_refs": spec["required_dependency_refs"],
                "allowed_parallel_track_refs": spec["allowed_parallel_track_refs"],
                "merge_gate_ref": spec["merge_gate_ref"],
                "gate_owner_role": spec["gate_owner_role"],
                "conformance_row_refs": spec["conformance_row_refs"],
                "critical_path_state": "off_path",
                "status_model": "blocked",
                "notes": spec["notes"],
                "source_refs": spec["source_refs"],
                "task_span_label": range_label(refs),
                "first_task_ref": first_task_ref(refs),
                "last_task_ref": last_task_ref(refs),
            }
        )

    if len(task_to_milestone) != len(tasks):
        missing = [task["task_ref"] for task in tasks if task["task_ref"] not in task_to_milestone]
        raise SystemExit("MILESTONE_COVERAGE_GAP: " + ", ".join(missing[:20]))

    return milestones, milestone_task_map, task_to_milestone


def build_edges() -> list[dict[str, Any]]:
    edges: list[dict[str, Any]] = []

    def add(edge_id: str, from_ref: str, to_ref: str, dependency_mode: str, baseline_scope: str, reason: str, gate_ref: str = "") -> None:
        edges.append(
            {
                "edge_id": edge_id,
                "from_milestone_id": from_ref,
                "to_milestone_id": to_ref,
                "dependency_mode": dependency_mode,
                "baseline_scope": baseline_scope,
                "gate_ref": gate_ref,
                "reason": reason,
            }
        )

    add("EDGE_001", "MS_PLAN_DISCOVERY_BASELINE", "MS_PLAN_EXECUTION_GRAPH", "strict_sequence", "current", "ADR freeze and baseline decisions must exist before the executable programme graph can be published.")
    add("EDGE_002", "MS_PLAN_EXECUTION_GRAPH", "MS_PLAN_RISK_AND_TRACEABILITY_FOUNDATION", "strict_sequence", "current", "Risk, watch, traceability, and gate-foundation work consume the milestone graph.")
    add("EDGE_003", "MS_PLAN_RISK_AND_TRACEABILITY_FOUNDATION", "MS_EXT_STRATEGY_AND_ACCOUNT_PLAN", "strict_sequence", "current", "External readiness starts only after planning, risk, and traceability foundations are ready.", "GATE_PLAN_EXTERNAL_ENTRY")

    add("EDGE_004", "MS_EXT_STRATEGY_AND_ACCOUNT_PLAN", "MS_EXT_NHS_LOGIN_ONBOARDING", "strict_sequence", "current", "Strategy and account ownership freeze before partner access requests.")
    add("EDGE_005", "MS_EXT_NHS_LOGIN_ONBOARDING", "MS_EXT_IM1_SCAL_READINESS", "strict_sequence", "current", "Identity rail onboarding informs IM1 and SCAL readiness.")
    add("EDGE_006", "MS_EXT_IM1_SCAL_READINESS", "MS_EXT_OPTIONAL_PDS_ENRICHMENT", "optional_branch", "optional", "Optional PDS work branches from the current-baseline external chain.")
    add("EDGE_007", "MS_EXT_IM1_SCAL_READINESS", "MS_EXT_MESH_ACCESS", "strict_sequence", "current", "Current-baseline external work continues with messaging access after IM1 visibility is established.")
    add("EDGE_008", "MS_EXT_MESH_ACCESS", "MS_EXT_DEFERRED_NHSAPP_ECOSYSTEM", "deferred_branch", "deferred", "Deferred NHS App onboarding branches from the current external chain without blocking it.")
    add("EDGE_009", "MS_EXT_MESH_ACCESS", "MS_EXT_COMMS_AND_SCAN_VENDORS", "strict_sequence", "current", "Current-baseline vendor provisioning continues without waiting on deferred NHS App work.")
    add("EDGE_010", "MS_EXT_COMMS_AND_SCAN_VENDORS", "MS_EXT_PROVIDER_PATHS_AND_EVIDENCE", "strict_sequence", "current", "Provider project setup precedes provider-path evidence capture.")
    add("EDGE_011", "MS_EXT_PROVIDER_PATHS_AND_EVIDENCE", "MS_EXT_SIMULATOR_AND_MANUAL_GATE_FREEZE", "strict_sequence", "current", "Simulator backlog and manual checkpoints close the current external block.")
    add("EDGE_012", "MS_EXT_SIMULATOR_AND_MANUAL_GATE_FREEZE", "MS_P0_0A_DELIVERY_SKELETON", "strict_sequence", "current", "Foundation work may only start after current external readiness is frozen.", "GATE_EXTERNAL_TO_FOUNDATION")

    add("EDGE_013", "MS_P0_0A_DELIVERY_SKELETON", "MS_P0_0B_DOMAIN_KERNEL", "strict_sequence", "current", "0A hard gate into 0B.", "GATE_P0_0A_TO_0B")
    add("EDGE_014", "MS_P0_0B_DOMAIN_KERNEL", "MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE", "strict_sequence", "current", "0B hard gate into 0C.", "GATE_P0_0B_TO_0C")
    add("EDGE_015", "MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE", "MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW", "strict_sequence", "current", "0C hard gate into 0D.", "GATE_P0_0C_TO_0D")
    add("EDGE_016", "MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW", "MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS", "strict_sequence", "current", "0D hard gate into 0E.", "GATE_P0_0D_TO_0E")
    add("EDGE_017", "MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS", "MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW", "phase_gate", "current", "0E opens the parallel foundation tracks and seed-shell integration work.", "GATE_P0_PARALLEL_FOUNDATION_OPEN")
    add("EDGE_018", "MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW", "MS_P0_0G_DCB0129_SAFETY_CASE", "parallel_dependency", "current", "0G assurance closeout depends on 0F synthetic-flow proof.")
    add("EDGE_019", "MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW", "MS_P0_0G_DSPT_READINESS", "parallel_dependency", "current", "0G assurance closeout depends on 0F synthetic-flow proof.")
    add("EDGE_020", "MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW", "MS_P0_0G_IM1_SCAL_ASSURANCE", "parallel_dependency", "current", "0G assurance closeout depends on 0F synthetic-flow proof.")
    add("EDGE_021", "MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW", "MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE", "parallel_dependency", "current", "0G assurance closeout depends on 0F synthetic-flow proof.")
    add("EDGE_022", "MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW", "MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE", "parallel_dependency", "current", "0G assurance closeout depends on 0F synthetic-flow proof.")
    add("EDGE_023", "MS_P0_0G_DCB0129_SAFETY_CASE", "MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF", "par_block_merge", "current", "Named long-lead safety track merges into Phase 0 exit proof.", "GATE_P0_LONG_LEAD_ASSURANCE_MERGE")
    add("EDGE_024", "MS_P0_0G_DSPT_READINESS", "MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF", "par_block_merge", "current", "Named long-lead DSPT track merges into Phase 0 exit proof.", "GATE_P0_LONG_LEAD_ASSURANCE_MERGE")
    add("EDGE_025", "MS_P0_0G_IM1_SCAL_ASSURANCE", "MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF", "par_block_merge", "current", "Named long-lead IM1 and SCAL track merges into Phase 0 exit proof.", "GATE_P0_LONG_LEAD_ASSURANCE_MERGE")
    add("EDGE_026", "MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE", "MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF", "par_block_merge", "current", "Named long-lead NHS login onboarding track merges into Phase 0 exit proof.", "GATE_P0_LONG_LEAD_ASSURANCE_MERGE")
    add("EDGE_027", "MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE", "MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF", "par_block_merge", "current", "Clinical review cadence and DPIA backlog merge into Phase 0 exit proof.", "GATE_P0_LONG_LEAD_ASSURANCE_MERGE")
    add("EDGE_028", "MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF", "MS_P1_DEFINITION_AND_ENTRY", "strict_sequence", "current", "Phase 1 starts only after Phase 0 exit proof is complete.", "GATE_P0_EXIT")

    chain = [
        ("MS_P1_DEFINITION_AND_ENTRY", "MS_P1_PARALLEL_INTAKE_IMPLEMENTATION", "strict_sequence", "current"),
        ("MS_P1_PARALLEL_INTAKE_IMPLEMENTATION", "MS_P1_MERGE_AND_PROOF", "par_block_merge", "current"),
        ("MS_P1_MERGE_AND_PROOF", "MS_P1_EXIT_GATE", "strict_sequence", "current"),
        ("MS_P1_EXIT_GATE", "MS_P2_DEFINITION_AND_ENTRY", "strict_sequence", "current"),
        ("MS_P2_DEFINITION_AND_ENTRY", "MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY", "strict_sequence", "current"),
        ("MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY", "MS_P2_EXTERNAL_CONFIG", "par_block_merge", "current"),
        ("MS_P2_EXTERNAL_CONFIG", "MS_P2_PROOF_AND_REGRESSION", "strict_sequence", "current"),
        ("MS_P2_PROOF_AND_REGRESSION", "MS_P2_EXIT_GATE", "strict_sequence", "current"),
        ("MS_P2_EXIT_GATE", "MS_XC_ENTRY_GATE", "strict_sequence", "current"),
        ("MS_XC_ENTRY_GATE", "MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT", "strict_sequence", "current"),
        ("MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT", "MS_XC_MERGE_AND_PROOF", "par_block_merge", "current"),
        ("MS_XC_MERGE_AND_PROOF", "MS_XC_EXIT_GATE", "strict_sequence", "current"),
        ("MS_XC_EXIT_GATE", "MS_P3_DEFINITION_AND_ENTRY", "strict_sequence", "current"),
        ("MS_P3_DEFINITION_AND_ENTRY", "MS_P3_PARALLEL_TRIAGE_AND_CALLBACK", "strict_sequence", "current"),
        ("MS_P3_PARALLEL_TRIAGE_AND_CALLBACK", "MS_P3_MERGE_AND_PROOF", "par_block_merge", "current"),
        ("MS_P3_MERGE_AND_PROOF", "MS_P3_EXIT_GATE", "strict_sequence", "current"),
        ("MS_P3_EXIT_GATE", "MS_P4_DEFINITION_AND_ENTRY", "strict_sequence", "current"),
        ("MS_P4_DEFINITION_AND_ENTRY", "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION", "strict_sequence", "current"),
        ("MS_P4_PARALLEL_BOOKING_IMPLEMENTATION", "MS_P4_MERGE_CONFIG_AND_PROOF", "par_block_merge", "current"),
        ("MS_P4_MERGE_CONFIG_AND_PROOF", "MS_P4_EXIT_GATE", "strict_sequence", "current"),
        ("MS_P4_EXIT_GATE", "MS_P5_DEFINITION_AND_ENTRY", "strict_sequence", "current"),
        ("MS_P5_DEFINITION_AND_ENTRY", "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION", "strict_sequence", "current"),
        ("MS_P5_PARALLEL_NETWORK_IMPLEMENTATION", "MS_P5_MERGE_CONFIG_AND_PROOF", "par_block_merge", "current"),
        ("MS_P5_MERGE_CONFIG_AND_PROOF", "MS_P5_EXIT_GATE", "strict_sequence", "current"),
        ("MS_P5_EXIT_GATE", "MS_P6_DEFINITION_AND_ENTRY", "strict_sequence", "current"),
        ("MS_P6_DEFINITION_AND_ENTRY", "MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION", "strict_sequence", "current"),
        ("MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION", "MS_P6_MERGE_CONFIG_AND_PROOF", "par_block_merge", "current"),
        ("MS_P6_MERGE_CONFIG_AND_PROOF", "MS_P6_EXIT_GATE", "strict_sequence", "current"),
        ("MS_P6_EXIT_GATE", "MS_POST6_SCOPE_SPLIT_GATE", "strict_sequence", "current"),
    ]
    for index, (from_ref, to_ref, mode, scope) in enumerate(chain, start=29):
        add(f"EDGE_{index:03d}", from_ref, to_ref, mode, scope, f"{from_ref} must settle before {to_ref}.")

    add("EDGE_058", "MS_POST6_SCOPE_SPLIT_GATE", "MS_P7_DEFINITION_AND_ENTRY", "deferred_branch", "deferred", "Deferred Phase 7 branch opens explicitly from the post-Phase-6 split gate.", "GATE_POST6_SCOPE_SPLIT")
    add("EDGE_059", "MS_POST6_SCOPE_SPLIT_GATE", "MS_P8_DEFINITION_AND_ENTRY", "strict_sequence", "current", "Current-baseline Phase 8 branch opens from the post-Phase-6 split gate.", "GATE_POST6_SCOPE_SPLIT")
    add("EDGE_060", "MS_POST6_SCOPE_SPLIT_GATE", "MS_P9_DEFINITION_AND_ENTRY", "strict_sequence", "current", "Current-baseline Phase 9 branch opens from the post-Phase-6 split gate.", "GATE_POST6_SCOPE_SPLIT")

    add("EDGE_061", "MS_P7_DEFINITION_AND_ENTRY", "MS_P7_PARALLEL_EMBEDDED_CHANNEL", "strict_sequence", "deferred", "Deferred Phase 7 contract freeze precedes its parallel implementation.")
    add("EDGE_062", "MS_P7_PARALLEL_EMBEDDED_CHANNEL", "MS_P7_MERGE_AND_PROOF", "par_block_merge", "deferred", "Deferred Phase 7 parallel block must merge before exit.", "GATE_P7_DEFERRED_MERGE")
    add("EDGE_063", "MS_P7_MERGE_AND_PROOF", "MS_P7_EXIT_GATE", "strict_sequence", "deferred", "Deferred Phase 7 proof pack precedes exit.")

    add("EDGE_064", "MS_P8_DEFINITION_AND_ENTRY", "MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION", "strict_sequence", "current", "Phase 8 policy freeze precedes assistive implementation.")
    add("EDGE_065", "MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION", "MS_P8_MERGE", "par_block_merge", "current", "Phase 8 parallel block merges before proof.", "GATE_P8_PARALLEL_MERGE")
    add("EDGE_066", "MS_P8_MERGE", "MS_P8_PROOF_AND_EXIT_PACK", "strict_sequence", "current", "Phase 8 merge precedes proof.")
    add("EDGE_067", "MS_P8_PROOF_AND_EXIT_PACK", "MS_P8_EXIT_GATE", "strict_sequence", "current", "Phase 8 proof precedes exit.", "GATE_P8_EXIT")

    add("EDGE_068", "MS_P9_DEFINITION_AND_ENTRY", "MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION", "strict_sequence", "current", "Phase 9 contract freeze precedes assurance implementation.")
    add("EDGE_069", "MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION", "MS_P9_MERGE", "par_block_merge", "current", "Phase 9 parallel block merges before proof.", "GATE_P9_PARALLEL_MERGE")
    add("EDGE_070", "MS_P9_MERGE", "MS_P9_PROOF_AND_EXIT_PACK", "strict_sequence", "current", "Phase 9 merge precedes proof.")
    add("EDGE_071", "MS_P9_PROOF_AND_EXIT_PACK", "MS_P9_EXIT_GATE", "strict_sequence", "current", "Phase 9 proof precedes exit.", "GATE_P9_EXIT")

    add("EDGE_072", "MS_P6_EXIT_GATE", "MS_PRG_CURRENT_BASELINE_CONFORMANCE", "strict_sequence", "current", "Current-baseline conformance waits for Phase 6 exit.")
    add("EDGE_073", "MS_P8_EXIT_GATE", "MS_PRG_CURRENT_BASELINE_CONFORMANCE", "strict_sequence", "current", "Current-baseline conformance waits for Phase 8 exit.")
    add("EDGE_074", "MS_P9_EXIT_GATE", "MS_PRG_CURRENT_BASELINE_CONFORMANCE", "strict_sequence", "current", "Current-baseline conformance waits for Phase 9 exit.")
    add("EDGE_075", "MS_P7_EXIT_GATE", "MS_PRG_DEFERRED_PHASE7_CONFORMANCE", "strict_sequence", "deferred", "Deferred scorecard reconciliation waits for Phase 7 exit.")
    add("EDGE_076", "MS_PRG_CURRENT_BASELINE_CONFORMANCE", "MS_PRG_RELEASE_READINESS", "strict_sequence", "current", "Release readiness starts from the current-baseline scorecard, not from deferred or optional branches.", "GATE_CURRENT_BASELINE_CONFORMANCE")
    add("EDGE_077", "MS_PRG_RELEASE_READINESS", "MS_PRG_WAVE1_PROMOTION_AND_OBSERVATION", "strict_sequence", "current", "Wave 1 waits for the release-readiness pack.", "GATE_RELEASE_READINESS")
    add("EDGE_078", "MS_PRG_WAVE1_PROMOTION_AND_OBSERVATION", "MS_PRG_MULTIWAVE_RELEASE", "strict_sequence", "current", "Widening waits for Wave 1 observation.", "GATE_WAVE1_OBSERVATION")
    add("EDGE_079", "MS_PRG_MULTIWAVE_RELEASE", "MS_PRG_OPTIONAL_ASSISTIVE_VISIBLE_ENABLEMENT", "optional_branch", "optional", "Optional visible assistive enablement branches from current-baseline widening.", "GATE_OPTIONAL_ASSISTIVE_ENABLEMENT")
    add("EDGE_080", "MS_PRG_MULTIWAVE_RELEASE", "MS_PRG_BAU_HANDOVER_AND_ARCHIVE", "strict_sequence", "current", "BAU handover starts once current-baseline waves stabilize.", "GATE_BAU_TRANSFER")
    add("EDGE_081", "MS_PRG_DEFERRED_PHASE7_CONFORMANCE", "MS_PRG_DEFERRED_NHSAPP_ENABLEMENT", "deferred_branch", "deferred", "Deferred NHS App enablement waits for deferred scorecard reconciliation.", "GATE_DEFERRED_NHSAPP_ENABLEMENT")
    add("EDGE_082", "MS_PRG_MULTIWAVE_RELEASE", "MS_PRG_DEFERRED_NHSAPP_ENABLEMENT", "deferred_branch", "deferred", "Deferred NHS App enablement also waits for the current baseline to widen and stabilize.", "GATE_DEFERRED_NHSAPP_ENABLEMENT")

    return edges


def topological_order(node_ids: list[str], edges: list[dict[str, Any]]) -> list[str]:
    incoming: dict[str, int] = {node_id: 0 for node_id in node_ids}
    outgoing: dict[str, list[str]] = {node_id: [] for node_id in node_ids}
    for edge in edges:
        if edge["from_milestone_id"] not in incoming or edge["to_milestone_id"] not in incoming:
            continue
        incoming[edge["to_milestone_id"]] += 1
        outgoing[edge["from_milestone_id"]].append(edge["to_milestone_id"])
    queue = deque(sorted([node_id for node_id, count in incoming.items() if count == 0]))
    order: list[str] = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for target in outgoing[node]:
            incoming[target] -= 1
            if incoming[target] == 0:
                queue.append(target)
    if len(order) != len(node_ids):
        raise SystemExit("PROGRAMME_GRAPH_CYCLE: milestone dependency graph is cyclic")
    return order


def mark_critical_path(milestones: list[dict[str, Any]], edges: list[dict[str, Any]]) -> dict[str, Any]:
    current_nodes = [row["milestone_id"] for row in milestones if row["baseline_scope"] == "current"]
    current_edges = [edge for edge in edges if edge["baseline_scope"] == "current"]
    order = topological_order(current_nodes, current_edges)

    predecessors: dict[str, list[str]] = defaultdict(list)
    successors: dict[str, list[str]] = defaultdict(list)
    for edge in current_edges:
        predecessors[edge["to_milestone_id"]].append(edge["from_milestone_id"])
        successors[edge["from_milestone_id"]].append(edge["to_milestone_id"])

    forward: dict[str, int] = {}
    for node in order:
        base = max((forward[pred] for pred in predecessors[node]), default=0)
        forward[node] = base + 1

    reverse: dict[str, int] = {}
    for node in reversed(order):
        base = max((reverse[succ] for succ in successors[node]), default=0)
        reverse[node] = base + 1

    sink = "MS_PRG_BAU_HANDOVER_AND_ARCHIVE"
    critical_length = forward[sink]
    critical_nodes = [
        node
        for node in order
        if forward[node] + reverse[node] - 1 == critical_length
    ]
    near_nodes = [
        node
        for node in order
        if node not in critical_nodes and forward[node] + reverse[node] - 1 >= critical_length - 2
    ]

    for row in milestones:
        if row["milestone_id"] in critical_nodes:
            row["critical_path_state"] = "on_path"
        elif row["milestone_id"] in near_nodes and row["baseline_scope"] == "current":
            row["critical_path_state"] = "near_path"
        else:
            row["critical_path_state"] = "off_path"

    return {
        "critical_path_length": critical_length,
        "critical_path_milestone_ids": critical_nodes,
        "near_path_milestone_ids": near_nodes,
        "long_lead_milestone_ids": [
            "MS_EXT_NHS_LOGIN_ONBOARDING",
            "MS_EXT_IM1_SCAL_READINESS",
            "MS_EXT_MESH_ACCESS",
            "MS_EXT_COMMS_AND_SCAN_VENDORS",
            "MS_EXT_PROVIDER_PATHS_AND_EVIDENCE",
            "MS_P0_0G_DCB0129_SAFETY_CASE",
            "MS_P0_0G_DSPT_READINESS",
            "MS_P0_0G_IM1_SCAL_ASSURANCE",
            "MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE",
        ],
        "critical_gate_ids": [
            "GATE_PLAN_EXTERNAL_ENTRY",
            "GATE_EXTERNAL_TO_FOUNDATION",
            "GATE_P0_PARALLEL_FOUNDATION_OPEN",
            "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
            "GATE_P0_EXIT",
            "GATE_P1_EXIT",
            "GATE_P2_EXIT",
            "GATE_XC_EXIT",
            "GATE_P3_EXIT",
            "GATE_P4_EXIT",
            "GATE_P5_EXIT",
            "GATE_P6_EXIT",
            "GATE_P8_EXIT",
            "GATE_P9_EXIT",
            "GATE_CURRENT_BASELINE_CONFORMANCE",
            "GATE_RELEASE_READINESS",
            "GATE_WAVE1_OBSERVATION",
            "GATE_BAU_TRANSFER",
        ],
        "critical_path_digest": (
            "Current baseline runs planning -> current external readiness -> Phase 0 spine -> "
            "Phases 1-6 -> post-Phase-6 split -> Phase 8 and Phase 9 -> current-baseline "
            "conformance -> release readiness -> wave 1 -> widening -> BAU handover."
        ),
    }


def derive_gate_status(
    gates: list[dict[str, Any]],
    milestone_index: dict[str, dict[str, Any]],
    milestone_task_map: dict[str, list[str]],
    task_index: dict[str, dict[str, Any]],
) -> dict[str, str]:
    statuses: dict[str, str] = {}
    for gate in gates:
        scope = gate["baseline_scope"]
        incoming_rows = [milestone_index[row_id] for row_id in gate["incoming_milestone_refs"]]
        if scope == "deferred":
            statuses[gate["merge_gate_id"]] = "deferred"
            continue
        if scope == "optional":
            statuses[gate["merge_gate_id"]] = "optional"
            continue
        if all(all(task_index[task_ref]["status"] == "complete" for task_ref in milestone_task_map[row["milestone_id"]]) for row in incoming_rows):
            statuses[gate["merge_gate_id"]] = "ready"
        elif any(any(task_index[task_ref]["status"] == "in_progress" for task_ref in milestone_task_map[row["milestone_id"]]) for row in incoming_rows):
            statuses[gate["merge_gate_id"]] = "in_progress"
        else:
            statuses[gate["merge_gate_id"]] = "blocked"
    return statuses


def derive_milestone_status(
    milestones: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    gate_status: dict[str, str],
    milestone_task_map: dict[str, list[str]],
    task_index: dict[str, dict[str, Any]],
) -> None:
    predecessors: dict[str, list[str]] = defaultdict(list)
    for edge in edges:
        predecessors[edge["to_milestone_id"]].append(edge["from_milestone_id"])
    milestone_index = {row["milestone_id"]: row for row in milestones}

    for row in milestones:
        refs = milestone_task_map[row["milestone_id"]]
        task_statuses = [task_index[task_ref]["status"] for task_ref in refs]
        all_complete = all(status == "complete" for status in task_statuses)
        any_started = any(status in {"complete", "in_progress"} for status in task_statuses)
        any_in_progress = any(status == "in_progress" for status in task_statuses)

        if all_complete:
            if row["milestone_class"] in {"release_gate", "assurance_gate"}:
                row["status_model"] = "complete"
            elif row["merge_gate_ref"] and gate_status.get(row["merge_gate_ref"]) != "ready":
                row["status_model"] = "merge_ready"
            else:
                row["status_model"] = "complete"
            continue

        if row["baseline_scope"] in {"deferred", "optional"} and not any_started:
            row["status_model"] = "not_started"
            continue

        preds = predecessors[row["milestone_id"]]
        preds_complete = all(milestone_index[pred]["status_model"] in {"complete", "merge_ready"} for pred in preds)
        if any_in_progress or preds_complete:
            row["status_model"] = "enabled"
        else:
            row["status_model"] = "blocked"


def finalize_gates(
    gates: list[dict[str, Any]],
    milestone_task_map: dict[str, list[str]],
    milestone_index: dict[str, dict[str, Any]],
    gate_status: dict[str, str],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for gate in gates:
        incoming_task_refs = flatten([milestone_task_map[row_id] for row_id in gate["incoming_milestone_refs"]])
        rows.append(
            {
                **gate,
                "incoming_task_refs": incoming_task_refs,
                "required_completed_task_refs": incoming_task_refs,
                "required_conformance_refs": gate["required_conformance_refs"],
                "gate_status": gate_status[gate["merge_gate_id"]],
                "incoming_task_span": range_label(incoming_task_refs),
                "baseline_scope": gate["baseline_scope"],
            }
        )
    return rows


def expand_tracks(tasks_by_num: dict[int, dict[str, Any]], tracks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for track in tracks:
        refs = task_refs(tasks_by_num, track["task_ranges"])
        rows.append(
            {
                **track,
                "source_task_refs": refs,
                "task_span_label": range_label(refs),
                "first_task_ref": first_task_ref(refs),
                "last_task_ref": last_task_ref(refs),
            }
        )
    return rows


def build_task_map_rows(tasks: list[dict[str, Any]], task_to_milestone: dict[str, str], milestone_index: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for task in tasks:
        milestone = milestone_index[task_to_milestone[task["task_ref"]]]
        rows.append(
            {
                "task_order": task["num"],
                "task_id": task["task_ref"],
                "task_kind": task["kind"],
                "task_status": task["status"],
                "task_prompt_ref": task["prompt_ref"],
                "task_title": task["title"],
                "phase_ref": task["phase_ref"],
                "milestone_id": milestone["milestone_id"],
                "milestone_title": milestone["milestone_title"],
                "milestone_class": milestone["milestone_class"],
                "baseline_scope": milestone["baseline_scope"],
                "critical_path_state": milestone["critical_path_state"],
                "merge_gate_ref": milestone["merge_gate_ref"],
            }
        )
    return rows


def build_phase0_subphase_rows(phase0_subphases: list[dict[str, Any]], milestone_index: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for subphase in phase0_subphases:
        task_refs_for_subphase = flatten([milestone_index[ref]["source_task_refs"] for ref in subphase["milestone_refs"]])
        rows.append(
            {
                **subphase,
                "task_span_label": range_label(task_refs_for_subphase),
                "task_refs": task_refs_for_subphase,
            }
        )
    return rows


def build_programme_payload(
    prereqs: dict[str, Any],
    milestones: list[dict[str, Any]],
    gates: list[dict[str, Any]],
    tracks: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    critical_path: dict[str, Any],
    phase0_subphases: list[dict[str, Any]],
) -> dict[str, Any]:
    current_count = sum(1 for row in milestones if row["baseline_scope"] == "current")
    deferred_count = sum(1 for row in milestones if row["baseline_scope"] == "deferred")
    optional_count = sum(1 for row in milestones if row["baseline_scope"] == "optional")
    return {
        "programme_id": PROGRAMME_ID,
        "title": PROGRAMME_TITLE,
        "mission": PROGRAMME_MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "assumptions": ASSUMPTIONS,
        "summary": {
            "milestone_count": len(milestones),
            "gate_count": len(gates),
            "parallel_track_count": len(tracks),
            "current_baseline_milestone_count": current_count,
            "deferred_milestone_count": deferred_count,
            "optional_milestone_count": optional_count,
            "critical_path_length": critical_path["critical_path_length"],
            "critical_path_digest": critical_path["critical_path_digest"],
        },
        "current_baseline": prereqs["product_scope"]["baseline_phases"],
        "deferred_baseline": prereqs["product_scope"]["deferred_phases"],
        "upstream_inputs": {
            "adr_count": len(prereqs["adr_payload"]["adrs"]),
            "dependency_count": len(prereqs["dependencies_payload"]["dependencies"]),
            "workstream_count": len(load_json(REQUIRED_INPUTS["regulatory_workstreams"])["workstreams"]),
            "release_gate_count": len(prereqs["release_gate_rows"]),
        },
        "milestones": milestones,
        "merge_gates": gates,
        "parallel_tracks": tracks,
        "dependency_edges": edges,
        "phase0_subphases": phase0_subphases,
        "critical_path": critical_path,
    }


def build_dependency_graph_mermaid(milestones: list[dict[str, Any]], edges: list[dict[str, Any]]) -> str:
    rows = ["flowchart LR"]
    milestone_index = {row["milestone_id"]: row for row in milestones}
    for phase_ref in PHASE_ORDER:
        phase_rows = [row for row in milestones if phase_ref in row["source_phase_refs"]]
        if not phase_rows:
            continue
        rows.append(f'  subgraph {phase_ref}["{PHASE_TITLES[phase_ref]}"]')
        for row in phase_rows:
            label = f"{row['milestone_id']} {row['task_span_label']}"
            rows.append(f'    {row["milestone_id"]}["{label}"]')
        rows.append("  end")
    for edge in edges:
        if edge["dependency_mode"] == "deferred_branch":
            connector = "-.->"
        elif edge["dependency_mode"] == "optional_branch":
            connector = "-.->"
        else:
            connector = "-->"
        rows.append(f'  {edge["from_milestone_id"]} {connector} {edge["to_milestone_id"]}')
    return "\n".join(rows) + "\n"


def build_timeline_mermaid(milestones: list[dict[str, Any]]) -> str:
    rows = [
        "gantt",
        "  title Vecells Programme Timeline (synthetic sequence anchors, not calendar commitments)",
        "  dateFormat  YYYY-MM-DD",
        "  axisFormat  %W",
        "  todayMarker off",
    ]
    current_date = [2026, 1, 5]

    def date_string(offset_weeks: int) -> str:
        year, month, day = current_date
        day_value = day + (offset_weeks * 7)
        month_value = month
        year_value = year
        while day_value > 28:
            day_value -= 28
            month_value += 1
            if month_value > 12:
                month_value = 1
                year_value += 1
        return f"{year_value:04d}-{month_value:02d}-{day_value:02d}"

    for phase_index, phase_ref in enumerate(PHASE_ORDER):
        phase_rows = [row for row in milestones if phase_ref in row["source_phase_refs"]]
        if not phase_rows:
            continue
        rows.append(f"  section {PHASE_TITLES[phase_ref]}")
        for ordinal, row in enumerate(phase_rows):
            start = date_string((phase_index * 5) + ordinal)
            duration = max(1, len(row["source_task_refs"]) // 6)
            crit = "crit, " if row["critical_path_state"] == "on_path" else ""
            rows.append(f"  {row['milestone_id']} :{crit}{row['milestone_id']}, {start}, {duration}w")
    return "\n".join(rows) + "\n"


def build_markdown_docs(
    payload: dict[str, Any],
    task_rows: list[dict[str, Any]],
    gate_rows: list[dict[str, Any]],
    track_rows: list[dict[str, Any]],
    phase0_rows: list[dict[str, Any]],
) -> None:
    milestone_rows = payload["milestones"]
    critical = payload["critical_path"]
    current_baseline_line = ", ".join(payload["current_baseline"])
    deferred_line = ", ".join(payload["deferred_baseline"])

    milestone_table = render_table(
        ["Milestone", "Phase", "Class", "Scope", "Tasks", "Path", "Gate"],
        [
            [
                row["milestone_id"],
                ", ".join(row["source_phase_refs"]),
                row["milestone_class"],
                row["baseline_scope"],
                row["task_span_label"],
                row["critical_path_state"],
                row["merge_gate_ref"],
            ]
            for row in milestone_rows
        ],
    )

    write_text(
        MILESTONE_DOC_PATH,
        textwrap.dedent(
            f"""
            # 17 Programme Milestones And Gate Model

            Mission: {PROGRAMME_MISSION}

            Current baseline: {current_baseline_line}
            Deferred baseline: {deferred_line}

            Summary:
            - Milestones: {payload['summary']['milestone_count']}
            - Merge gates: {payload['summary']['gate_count']}
            - Parallel tracks: {payload['summary']['parallel_track_count']}
            - Current baseline milestones: {payload['summary']['current_baseline_milestone_count']}
            - Deferred milestones: {payload['summary']['deferred_milestone_count']}
            - Optional milestones: {payload['summary']['optional_milestone_count']}

            Execution law:
            - `{RULE_TEXT['RULE_SEQ_SCOPE_AWARE_ORDER']}`
            - `{RULE_TEXT['RULE_PAR_BLOCK_COMPLETE']}`
            - `{RULE_TEXT['RULE_CONFORMANCE_ROW_FRESH']}`
            - `{RULE_TEXT['RULE_DEFERRED_PHASE7_NO_PROXY']}`

            ## Milestone Matrix

            {milestone_table}
            """
        ),
    )

    parallel_table = render_table(
        ["Track", "Phase", "Scope", "Milestone", "Tasks", "Class", "Long Lead"],
        [
            [
                row["track_id"],
                row["phase_ref"],
                row["baseline_scope"],
                row["milestone_ref"],
                row["task_span_label"],
                row["track_class"],
                row["long_lead_state"],
            ]
            for row in track_rows
        ],
    )
    write_text(
        PARALLEL_DOC_PATH,
        textwrap.dedent(
            f"""
            # 17 Parallel Track Plan

            The checklist contains these contiguous parallel windows:
            - `062-126`
            - `144-163`
            - `175-201`
            - `210-222`
            - `231-269`
            - `282-303`
            - `315-334`
            - `346-365`
            - `374-471`

            Parallel-track law:
            - `{RULE_TEXT['RULE_PAR_BLOCK_COMPLETE']}`
            - `{RULE_TEXT['RULE_LONG_LEAD_VISIBLE']}`

            ## Track Matrix

            {parallel_table}
            """
        ),
    )

    gate_table = render_table(
        ["Gate", "Type", "Scope", "Incoming", "Status", "Artifacts", "Rules"],
        [
            [
                row["merge_gate_id"],
                row["gate_type"],
                row["baseline_scope"],
                ", ".join(row["incoming_milestone_refs"]),
                row["gate_status"],
                "; ".join(row["required_artifact_refs"]),
                "; ".join(row["blocking_rule_refs"]),
            ]
            for row in gate_rows
        ],
    )
    write_text(
        GATE_DOC_PATH,
        textwrap.dedent(
            f"""
            # 17 Merge Gate Policy

            Merge gates are evidence-driven, not title-driven. A gate is only ready when its incoming milestone work is complete and the bound artifact, dependency, risk-posture, and conformance refs are current.

            Gate rules:
            - `{RULE_TEXT['RULE_SEQ_SCOPE_AWARE_ORDER']}`
            - `{RULE_TEXT['RULE_PAR_BLOCK_COMPLETE']}`
            - `{RULE_TEXT['RULE_CONFORMANCE_ROW_FRESH']}`
            - `{RULE_TEXT['RULE_RUNTIME_PUBLICATION_AND_OPS_PROOF']}`

            ## Gate Matrix

            {gate_table}
            """
        ),
    )

    phase0_table = render_table(
        ["Subphase", "Milestones", "Tasks", "Hard Gate", "Notes"],
        [
            [
                row["subphase_code"],
                "; ".join(row["milestone_refs"]),
                row["task_span_label"],
                row["hard_gate_ref"],
                row["notes"],
            ]
            for row in phase0_rows
        ],
    )
    write_text(
        PHASE0_DOC_PATH,
        textwrap.dedent(
            f"""
            # 17 Phase0 Subphase Execution Plan

            The source algorithm states that Phase 0 runs as seven internal sub-phases with hard gates. The source explicitly names `0A`, `0B`, and `0G`; the intermediate `0C-0F` labels below are derived bridging names over the runtime, control-plane, verification, and shell obligations already present in the corpus.

            ## Phase 0A-0G Map

            {phase0_table}

            Long-lead closeout lanes inside `0G`:
            - `MS_P0_0G_DCB0129_SAFETY_CASE`
            - `MS_P0_0G_DSPT_READINESS`
            - `MS_P0_0G_IM1_SCAL_ASSURANCE`
            - `MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE`
            - `MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE`
            """
        ),
    )

    critical_table = render_table(
        ["Critical Path Order", "Milestone", "Tasks", "Scope", "Notes"],
        [
            [index + 1, milestone_id, next(row for row in milestone_rows if row["milestone_id"] == milestone_id)["task_span_label"], next(row for row in milestone_rows if row["milestone_id"] == milestone_id)["baseline_scope"], next(row for row in milestone_rows if row["milestone_id"] == milestone_id)["milestone_title"]]
            for index, milestone_id in enumerate(critical["critical_path_milestone_ids"])
        ],
    )
    long_lead_table = render_table(
        ["Long Lead Milestone", "Tasks", "Scope", "Dependencies"],
        [
            [
                row["milestone_id"],
                row["task_span_label"],
                row["baseline_scope"],
                "; ".join(row["required_dependency_refs"]),
            ]
            for row in milestone_rows
            if row["milestone_id"] in critical["long_lead_milestone_ids"]
        ],
    )
    write_text(
        CRITICAL_DOC_PATH,
        textwrap.dedent(
            f"""
            # 17 Critical Path And Long Lead Plan

            Critical-path digest:
            {critical['critical_path_digest']}

            ## Current-Baseline Critical Path

            {critical_table}

            ## Long-Lead Dependencies

            {long_lead_table}
            """
        ),
    )

    assumption_table = render_table(
        ["Assumption", "Decision", "Sources"],
        [[row["assumption_id"], row["decision"], "; ".join(row["source_refs"])] for row in ASSUMPTIONS],
    )
    decision_table = render_table(
        ["Decision", "Closure"],
        [
            ["Deferred Phase 7 handling", "Represented as deferred-channel milestones and branches that never proxy current-baseline completion evidence."],
            ["Optional PDS handling", "Represented as an optional branch from external readiness so Phase 2 baseline can proceed without it."],
            ["Optional assistive visible rollout", "Represented as an optional post-wave branch after Phase 8 completes architecturally."],
            ["Phase 0 internal sub-phases", "Operationalized as seven hard-gated subphases with 0G expanded into named long-lead assurance lanes."],
        ],
    )
    write_text(
        DECISION_LOG_DOC_PATH,
        textwrap.dedent(
            f"""
            # 17 Programme Decision Log

            ## Assumptions

            {assumption_table}

            ## Gap-Closure Decisions

            {decision_table}
            """
        ),
    )

    write_text(DEPENDENCY_GRAPH_PATH, build_dependency_graph_mermaid(milestone_rows, payload["dependency_edges"]))
    write_text(TIMELINE_GRAPH_PATH, build_timeline_mermaid(milestone_rows))


def build_html(payload: dict[str, Any]) -> str:
    safe_json = json.dumps(payload, separators=(",", ":")).replace("</", "<\\/")
    template = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vecells Programme Control Tower</title>
  <link rel="icon" href="data:," />
  <style>
    :root {{
      --canvas: #F5F7FA;
      --shell: #FFFFFF;
      --inset: #EEF2F6;
      --text-strong: #101828;
      --text-default: #1D2939;
      --text-muted: #475467;
      --border-subtle: #E4E7EC;
      --border-default: #D0D5DD;
      --milestone: #335CFF;
      --parallel: #0F8B8D;
      --gate: #6E59D9;
      --caution: #C98900;
      --critical: #C24141;
      --complete: #0F9D58;
      --shadow: 0 10px 28px rgba(16, 24, 40, 0.08);
      --radius-lg: 22px;
      --radius-md: 16px;
      --radius-sm: 12px;
      --chip-h: 28px;
      --row-h: 40px;
      --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
      --focus: 2px solid #335CFF;
      --rail-width: 296px;
      --inspector-width: 380px;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: var(--font-sans);
      color: var(--text-default);
      background:
        radial-gradient(circle at top left, rgba(51, 92, 255, 0.08), transparent 26%),
        radial-gradient(circle at bottom right, rgba(15, 139, 141, 0.06), transparent 20%),
        var(--canvas);
    }}
    button, select, input {{ font: inherit; }}
    :focus-visible {{
      outline: var(--focus);
      outline-offset: 2px;
    }}
    .page {{
      max-width: 1440px;
      margin: 0 auto;
      padding: 20px;
    }}
    .workspace {{
      display: grid;
      grid-template-columns: var(--rail-width) minmax(0, 1fr) minmax(320px, var(--inspector-width));
      gap: 18px;
      min-height: calc(100vh - 40px);
    }}
    .panel {{
      background: var(--shell);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      overflow: hidden;
    }}
    .rail {{
      padding: 20px;
      display: grid;
      gap: 18px;
      align-self: start;
      position: sticky;
      top: 20px;
    }}
    .wordmark {{
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-strong);
      font-weight: 700;
      letter-spacing: 0.02em;
    }}
    .wordmark svg {{
      width: 36px;
      height: 36px;
    }}
    .wordmark small {{
      display: block;
      color: var(--text-muted);
      font-weight: 500;
      letter-spacing: 0;
    }}
    .filter-group {{
      display: grid;
      gap: 8px;
    }}
    .filter-group label {{
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-strong);
    }}
    .filter-group select {{
      width: 100%;
      height: 44px;
      border-radius: 12px;
      border: 1px solid var(--border-default);
      background: var(--inset);
      padding: 0 14px;
      color: var(--text-default);
    }}
    .main {{
      display: grid;
      gap: 18px;
      min-width: 0;
    }}
    .summary-band {{
      display: grid;
      gap: 18px;
      padding: 20px;
    }}
    .summary-top {{
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }}
    .summary-top h1 {{
      margin: 0;
      color: var(--text-strong);
      font-size: 1.5rem;
    }}
    .summary-top p {{
      margin: 6px 0 0;
      max-width: 720px;
      color: var(--text-muted);
    }}
    .stats {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }}
    .stat {{
      background: var(--inset);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      min-height: 90px;
    }}
    .stat strong {{
      display: block;
      font-size: 1.35rem;
      color: var(--text-strong);
    }}
    .stat span {{
      display: block;
      color: var(--text-muted);
      margin-top: 6px;
      font-size: 0.92rem;
    }}
    .canvas-grid {{
      display: grid;
      gap: 18px;
    }}
    .canvas-panel {{
      padding: 20px;
      display: grid;
      gap: 16px;
    }}
    .canvas-header {{
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }}
    .canvas-header h2 {{
      margin: 0;
      color: var(--text-strong);
      font-size: 1.15rem;
    }}
    .canvas-header p {{
      margin: 6px 0 0;
      color: var(--text-muted);
    }}
    .chip-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}
    .chip {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: var(--chip-h);
      padding: 0 12px;
      border-radius: 999px;
      border: 1px solid var(--border-default);
      background: var(--shell);
      color: var(--text-default);
      font-size: 0.82rem;
      font-weight: 600;
      white-space: nowrap;
    }}
    .chip.path-on {{ color: var(--critical); border-color: rgba(194, 65, 65, 0.28); background: rgba(194, 65, 65, 0.08); }}
    .chip.scope-current {{ color: var(--complete); border-color: rgba(15, 157, 88, 0.28); background: rgba(15, 157, 88, 0.08); }}
    .chip.scope-deferred {{ color: var(--gate); border-color: rgba(110, 89, 217, 0.28); background: rgba(110, 89, 217, 0.08); }}
    .chip.scope-optional {{ color: var(--caution); border-color: rgba(201, 137, 0, 0.28); background: rgba(201, 137, 0, 0.08); }}
    .timeline-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
      min-height: 520px;
      align-content: start;
    }}
    .phase-column {{
      background: var(--inset);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px;
      display: grid;
      gap: 10px;
      align-content: start;
    }}
    .phase-column h3 {{
      margin: 0;
      color: var(--text-strong);
      font-size: 0.98rem;
    }}
    .phase-column p {{
      margin: 0;
      color: var(--text-muted);
      font-size: 0.86rem;
    }}
    .milestone-card {{
      width: 100%;
      text-align: left;
      border-radius: 14px;
      border: 1px solid var(--border-default);
      background: var(--shell);
      padding: 12px 14px;
      display: grid;
      gap: 8px;
      transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
      min-width: 280px;
    }}
    .milestone-card:hover,
    .milestone-card.is-selected {{
      transform: translateY(-1px);
      border-color: rgba(51, 92, 255, 0.38);
      box-shadow: 0 10px 22px rgba(51, 92, 255, 0.10);
    }}
    .milestone-card strong {{
      color: var(--text-strong);
      font-size: 0.94rem;
    }}
    .milestone-card .meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }}
    .milestone-card .meta span {{
      font-size: 0.76rem;
      color: var(--text-muted);
      background: var(--inset);
      border-radius: 999px;
      padding: 4px 8px;
    }}
    .milestone-card .span {{
      font-family: var(--font-mono);
      font-size: 0.76rem;
      color: var(--text-muted);
    }}
    .graph-wrap {{
      min-height: 480px;
      overflow: auto;
      background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(238,242,246,0.8));
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px;
    }}
    svg {{
      width: 100%;
      height: 100%;
      min-height: 480px;
    }}
    .graph-node {{
      cursor: pointer;
    }}
    .graph-node rect {{
      fill: var(--shell);
      stroke: var(--border-default);
      stroke-width: 1.25;
      rx: 14;
    }}
    .graph-node.is-selected rect {{
      stroke: var(--milestone);
      stroke-width: 2;
      fill: rgba(51, 92, 255, 0.06);
    }}
    .graph-node text {{
      fill: var(--text-default);
      font-size: 12px;
      font-family: var(--font-sans);
    }}
    .graph-edge {{
      stroke: rgba(71, 84, 103, 0.55);
      stroke-width: 1.4;
      fill: none;
    }}
    .table-grid {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }}
    .table-card {{
      padding: 16px 18px 18px;
      display: grid;
      gap: 12px;
    }}
    .table-card h2 {{
      margin: 0;
      color: var(--text-strong);
      font-size: 1rem;
    }}
    .table-wrap {{
      overflow: auto;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      min-width: 720px;
      background: var(--shell);
    }}
    thead {{
      background: var(--inset);
    }}
    th, td {{
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
      vertical-align: top;
      font-size: 0.88rem;
    }}
    th {{
      color: var(--text-strong);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    tr:last-child td {{
      border-bottom: 0;
    }}
    .row-button {{
      width: 100%;
      text-align: left;
      border: 0;
      background: transparent;
      color: inherit;
      padding: 0;
    }}
    .row-button.is-selected {{
      color: var(--milestone);
      font-weight: 600;
    }}
    .inspector {{
      align-self: start;
      position: sticky;
      top: 20px;
      padding: 20px;
      display: grid;
      gap: 14px;
      transition: transform 240ms ease, opacity 240ms ease;
    }}
    .inspector h2 {{
      margin: 0;
      color: var(--text-strong);
      font-size: 1.1rem;
    }}
    .inspector p {{
      margin: 0;
      color: var(--text-muted);
    }}
    .detail-grid {{
      display: grid;
      gap: 10px;
    }}
    .detail-row {{
      padding: 10px 12px;
      background: var(--inset);
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      display: grid;
      gap: 6px;
    }}
    .detail-row strong {{
      color: var(--text-strong);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .detail-row code {{
      font-family: var(--font-mono);
      font-size: 0.8rem;
      word-break: break-word;
    }}
    .selection-strip {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }}
    .selection-strip span {{
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--text-muted);
      background: var(--inset);
      border-radius: 999px;
      padding: 6px 10px;
    }}
    .empty {{
      color: var(--text-muted);
      padding: 16px;
      text-align: center;
    }}
    @media (max-width: 1180px) {{
      .workspace {{
        grid-template-columns: 1fr;
      }}
      .rail,
      .inspector {{
        position: static;
      }}
      .table-grid {{
        grid-template-columns: 1fr;
      }}
      .stats {{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}
    }}
    @media (max-width: 800px) {{
      .page {{
        padding: 14px;
      }}
      .summary-top {{
        flex-direction: column;
        align-items: flex-start;
      }}
      .stats {{
        grid-template-columns: 1fr;
      }}
      .timeline-grid {{
        grid-template-columns: 1fr;
      }}
    }}
    @media (prefers-reduced-motion: reduce) {{
      *, *::before, *::after {{
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }}
    }}
  </style>
</head>
<body>
  <div class="page">
    <div class="workspace">
      <aside class="panel rail" data-testid="milestone-filter-rail" aria-label="Programme filters">
        <div class="wordmark">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <rect x="4" y="4" width="40" height="40" rx="14" fill="#335CFF"></rect>
            <path d="M16 17h15.5c4.1 0 7.5 3.4 7.5 7.5S35.6 32 31.5 32H20.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M16 17v15" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"></path>
          </svg>
          <div>
            Vecells
            <small>Programme_Control_Tower</small>
          </div>
        </div>
        <div class="filter-group">
          <label for="filter-phase">Phase</label>
          <select id="filter-phase">
            <option value="all">All phases</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-class">Milestone class</label>
          <select id="filter-class">
            <option value="all">All classes</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-scope">Baseline scope</label>
          <select id="filter-scope">
            <option value="all">All scopes</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-path">Critical path</label>
          <select id="filter-path">
            <option value="all">All path states</option>
            <option value="on_path">On path</option>
            <option value="near_path">Near path</option>
            <option value="off_path">Off path</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-status">Milestone status</label>
          <select id="filter-status">
            <option value="all">All statuses</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-gate-status">Gate status</label>
          <select id="filter-gate-status">
            <option value="all">All gate states</option>
          </select>
        </div>
      </aside>

      <main class="main">
        <section class="panel summary-band" data-testid="programme-summary-band">
          <div class="summary-top">
            <div>
              <h1>Programme control tower</h1>
              <p id="summary-copy"></p>
            </div>
            <div class="chip-row" id="summary-chips"></div>
          </div>
          <div class="stats" id="summary-stats"></div>
        </section>

        <section class="canvas-grid">
          <div class="panel canvas-panel">
            <div class="canvas-header">
              <div>
                <h2>Timeline view</h2>
                <p>All milestones stay filterable by phase, class, scope, path, and status. Deferred and optional branches remain visible without silently blocking current-baseline work.</p>
              </div>
            </div>
            <div class="timeline-grid" id="timeline-canvas" data-testid="timeline-canvas"></div>
          </div>

          <div class="panel canvas-panel">
            <div class="canvas-header">
              <div>
                <h2>Dependency graph</h2>
                <p>Scope-aware dependencies turn the serialized checklist into one executable graph with explicit skips for optional PDS, deferred Phase 7, and optional visible assistive enablement.</p>
              </div>
            </div>
            <div class="graph-wrap" data-testid="dependency-graph-canvas">
              <svg id="graph-svg" role="img" aria-label="Programme dependency graph"></svg>
            </div>
          </div>
        </section>

        <section class="table-grid">
          <div class="panel table-card">
            <h2>Milestones</h2>
            <div class="table-wrap">
              <table data-testid="milestone-table">
                <thead>
                  <tr>
                    <th>Milestone</th>
                    <th>Phase</th>
                    <th>Scope</th>
                    <th>Tasks</th>
                    <th>Status</th>
                    <th>Path</th>
                    <th>Gate</th>
                  </tr>
                </thead>
                <tbody id="milestone-table-body"></tbody>
              </table>
            </div>
          </div>

          <div class="panel table-card">
            <h2>Merge gates</h2>
            <div class="table-wrap">
              <table data-testid="merge-gate-table">
                <thead>
                  <tr>
                    <th>Gate</th>
                    <th>Type</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Incoming</th>
                    <th>Artifacts</th>
                  </tr>
                </thead>
                <tbody id="gate-table-body"></tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <aside class="panel inspector" data-testid="programme-inspector" id="programme-inspector">
        <h2>Inspector</h2>
        <p>Select a milestone card, graph node, milestone row, or gate row.</p>
        <div class="selection-strip" id="selection-strip"></div>
        <div class="detail-grid" id="inspector-body"></div>
      </aside>
    </div>
  </div>

  <script id="programme-data" type="application/json">__SAFE_JSON__</script>
  <script>
    const DATA = JSON.parse(document.getElementById("programme-data").textContent);
    const milestones = DATA.milestones;
    const gates = DATA.merge_gates;
    const edges = DATA.dependency_edges;
    const phaseTitles = __PHASE_TITLES__;

    const state = {{
      phase: "all",
      milestoneClass: "all",
      scope: "all",
      path: "all",
      status: "all",
      gateStatus: "all",
      selectedType: "milestone",
      selectedId: milestones[0]?.milestone_id || ""
    }};

    const dom = {{
      phase: document.getElementById("filter-phase"),
      milestoneClass: document.getElementById("filter-class"),
      scope: document.getElementById("filter-scope"),
      path: document.getElementById("filter-path"),
      status: document.getElementById("filter-status"),
      gateStatus: document.getElementById("filter-gate-status"),
      summaryCopy: document.getElementById("summary-copy"),
      summaryChips: document.getElementById("summary-chips"),
      summaryStats: document.getElementById("summary-stats"),
      timelineCanvas: document.getElementById("timeline-canvas"),
      graph: document.getElementById("graph-svg"),
      milestoneTableBody: document.getElementById("milestone-table-body"),
      gateTableBody: document.getElementById("gate-table-body"),
      inspectorBody: document.getElementById("inspector-body"),
      selectionStrip: document.getElementById("selection-strip")
    }};

    function uniqueValues(rows, field) {{
      return Array.from(new Set(rows.map((row) => row[field]).filter(Boolean))).sort();
    }}

    function initFilters() {{
      uniqueValues(milestones, "milestone_class").forEach((value) => {{
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        dom.milestoneClass.appendChild(option);
      }});
      uniqueValues(milestones, "baseline_scope").forEach((value) => {{
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        dom.scope.appendChild(option);
      }});
      uniqueValues(milestones, "status_model").forEach((value) => {{
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        dom.status.appendChild(option);
      }});
      uniqueValues(gates, "gate_status").forEach((value) => {{
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        dom.gateStatus.appendChild(option);
      }});
      Object.entries(phaseTitles).forEach(([phase, title]) => {{
        const option = document.createElement("option");
        option.value = phase;
        option.textContent = title;
        dom.phase.appendChild(option);
      }});
      [dom.phase, dom.milestoneClass, dom.scope, dom.path, dom.status, dom.gateStatus].forEach((select) => {{
        select.addEventListener("change", () => {{
          state.phase = dom.phase.value;
          state.milestoneClass = dom.milestoneClass.value;
          state.scope = dom.scope.value;
          state.path = dom.path.value;
          state.status = dom.status.value;
          state.gateStatus = dom.gateStatus.value;
          render();
        }});
      }});
    }}

    function filteredMilestones() {{
      return milestones.filter((row) => {{
        if (state.phase !== "all" && !row.source_phase_refs.includes(state.phase)) return false;
        if (state.milestoneClass !== "all" && row.milestone_class !== state.milestoneClass) return false;
        if (state.scope !== "all" && row.baseline_scope !== state.scope) return false;
        if (state.path !== "all" && row.critical_path_state !== state.path) return false;
        if (state.status !== "all" && row.status_model !== state.status) return false;
        return true;
      }});
    }}

    function visibleMilestoneIds() {{
      return new Set(filteredMilestones().map((row) => row.milestone_id));
    }}

    function filteredGates() {{
      const visible = visibleMilestoneIds();
      return gates.filter((row) => {{
        if (state.gateStatus !== "all" && row.gate_status !== state.gateStatus) return false;
        if (state.scope !== "all" && row.baseline_scope !== state.scope) return false;
        if (state.phase !== "all") {{
          const gateVisible = row.incoming_milestone_refs.some((ref) => {{
            const milestone = milestones.find((item) => item.milestone_id === ref);
            return milestone && milestone.source_phase_refs.includes(state.phase);
          }});
          if (!gateVisible) return false;
        }}
        if (visible.size && !row.incoming_milestone_refs.some((ref) => visible.has(ref))) return false;
        return true;
      }});
    }}

    function selectedMilestone() {{
      return milestones.find((row) => row.milestone_id === state.selectedId) || filteredMilestones()[0] || null;
    }}

    function selectedGate() {{
      return gates.find((row) => row.merge_gate_id === state.selectedId) || filteredGates()[0] || null;
    }}

    function setSelection(type, id) {{
      state.selectedType = type;
      state.selectedId = id;
      renderInspector();
      syncSelectedClasses();
    }}

    function syncSelectedClasses() {{
      document.querySelectorAll(".is-selected").forEach((node) => node.classList.remove("is-selected"));
      const selector = state.selectedType === "milestone"
        ? `[data-milestone-id="${{CSS.escape(state.selectedId)}}"]`
        : `[data-gate-id="${{CSS.escape(state.selectedId)}}"]`;
      document.querySelectorAll(selector).forEach((node) => node.classList.add("is-selected"));
      document.querySelectorAll(`.graph-node[data-node-id="${{CSS.escape(state.selectedId)}}"]`).forEach((node) => node.classList.add("is-selected"));
    }}

    function renderSummary() {{
      dom.summaryCopy.textContent = DATA.summary.critical_path_digest;
      dom.summaryChips.innerHTML = `
        <span class="chip scope-current">current baseline: ${{DATA.summary.current_baseline_milestone_count}}</span>
        <span class="chip scope-deferred">deferred: ${{DATA.summary.deferred_milestone_count}}</span>
        <span class="chip scope-optional">optional: ${{DATA.summary.optional_milestone_count}}</span>
        <span class="chip path-on">critical length: ${{DATA.summary.critical_path_length}}</span>
      `;
      const stats = [
        ["Visible milestones", filteredMilestones().length.toString()],
        ["Visible gates", filteredGates().length.toString()],
        ["Critical milestones", DATA.critical_path.critical_path_milestone_ids.length.toString()],
        ["Long-lead lanes", DATA.critical_path.long_lead_milestone_ids.length.toString()]
      ];
      dom.summaryStats.innerHTML = stats.map(([label, value]) => `
        <div class="stat">
          <strong>${{value}}</strong>
          <span>${{label}}</span>
        </div>
      `).join("");
    }}

    function renderTimeline() {{
      const rows = filteredMilestones();
      const grouped = Object.keys(phaseTitles).map((phase) => [phase, rows.filter((row) => row.source_phase_refs.includes(phase))]).filter(([, items]) => items.length);
      dom.timelineCanvas.dataset.visibleCount = String(rows.length);
      dom.timelineCanvas.innerHTML = grouped.map(([phase, items]) => `
        <section class="phase-column">
          <div>
            <h3>${{phaseTitles[phase]}}</h3>
            <p>${{items.length}} visible milestone${{items.length === 1 ? "" : "s"}}</p>
          </div>
          ${items.map((row) => `
            <button
              type="button"
              class="milestone-card"
              data-milestone-id="${{row.milestone_id}}"
              data-critical-path="${{row.critical_path_state}}"
              data-baseline-scope="${{row.baseline_scope}}"
              aria-label="${{row.milestone_title}}"
            >
              <strong>${{row.milestone_title}}</strong>
              <div class="meta">
                <span>${{row.milestone_class}}</span>
                <span>${{row.status_model}}</span>
                <span>${{row.critical_path_state}}</span>
              </div>
              <div class="span">${{row.task_span_label}}</div>
            </button>
          `).join("")}
        </section>
      `).join("");
      dom.timelineCanvas.querySelectorAll("[data-milestone-id]").forEach((button) => {{
        button.addEventListener("click", () => setSelection("milestone", button.dataset.milestoneId));
      }});
    }}

    function renderGraph() {{
      const visible = filteredMilestones();
      const visibleIds = new Set(visible.map((row) => row.milestone_id));
      const visibleEdges = edges.filter((edge) => visibleIds.has(edge.from_milestone_id) && visibleIds.has(edge.to_milestone_id));
      const phaseSlots = [];
      Object.keys(phaseTitles).forEach((phase) => {{
        const items = visible.filter((row) => row.source_phase_refs.includes(phase));
        if (items.length) phaseSlots.push([phase, items]);
      }});
      const nodeWidth = 220;
      const nodeHeight = 74;
      const columnGap = 80;
      const rowGap = 26;
      const phaseGap = 42;
      let x = 30;
      const positions = {{}};
      let svgWidth = 300;
      let svgHeight = 520;
      phaseSlots.forEach(([phase, items]) => {{
        let y = 40;
        items.forEach((item) => {{
          positions[item.milestone_id] = {{ x, y }};
          y += nodeHeight + rowGap;
          svgHeight = Math.max(svgHeight, y + 40);
        }});
        x += nodeWidth + columnGap;
        svgWidth = Math.max(svgWidth, x + 40);
      }});
      const edgeSvg = visibleEdges.map((edge) => {{
        const from = positions[edge.from_milestone_id];
        const to = positions[edge.to_milestone_id];
        if (!from || !to) return "";
        const startX = from.x + nodeWidth;
        const startY = from.y + nodeHeight / 2;
        const endX = to.x;
        const endY = to.y + nodeHeight / 2;
        const curve = `M ${{startX}} ${{startY}} C ${{startX + 36}} ${{startY}}, ${{endX - 36}} ${{endY}}, ${{endX}} ${{endY}}`;
        return `<path class="graph-edge" d="${{curve}}" />`;
      }}).join("");
      const nodeSvg = visible.map((item) => {{
        const pos = positions[item.milestone_id];
        const tags = `${{item.milestone_class}} · ${{item.status_model}}`;
        return `
          <g class="graph-node" tabindex="0" role="button" data-node-id="${{item.milestone_id}}" data-milestone-id="${{item.milestone_id}}" data-critical-path="${{item.critical_path_state}}" data-baseline-scope="${{item.baseline_scope}}">
            <rect x="${{pos.x}}" y="${{pos.y}}" width="${{nodeWidth}}" height="${{nodeHeight}}"></rect>
            <text x="${{pos.x + 14}}" y="${{pos.y + 24}}">${{item.milestone_id}}</text>
            <text x="${{pos.x + 14}}" y="${{pos.y + 44}}">${{item.milestone_title.slice(0, 28)}}</text>
            <text x="${{pos.x + 14}}" y="${{pos.y + 62}}">${{tags.slice(0, 32)}}</text>
          </g>
        `;
      }}).join("");
      dom.graph.setAttribute("viewBox", `0 0 ${{svgWidth}} ${{svgHeight}}`);
      dom.graph.dataset.visibleCount = String(visible.length);
      dom.graph.dataset.edgeCount = String(visibleEdges.length);
      dom.graph.innerHTML = `<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="rgba(71,84,103,0.55)"></path></marker></defs>${{edgeSvg.replace(/class="graph-edge"/g, 'class="graph-edge" marker-end="url(#arrow)"')}}${{nodeSvg}}`;
      dom.graph.querySelectorAll(".graph-node").forEach((node) => {{
        node.addEventListener("click", () => setSelection("milestone", node.dataset.nodeId));
        node.addEventListener("keydown", (event) => {{
          if (event.key === "Enter" || event.key === " ") {{
            event.preventDefault();
            setSelection("milestone", node.dataset.nodeId);
          }}
        }});
      }});
    }}

    function renderMilestoneTable() {{
      const rows = filteredMilestones();
      dom.milestoneTableBody.innerHTML = rows.map((row) => `
        <tr data-milestone-id="${{row.milestone_id}}" data-critical-path="${{row.critical_path_state}}" data-baseline-scope="${{row.baseline_scope}}">
          <td><button type="button" class="row-button" data-milestone-id="${{row.milestone_id}}">${{row.milestone_title}}</button></td>
          <td>${{row.source_phase_refs.join(", ")}}</td>
          <td>${{row.baseline_scope}}</td>
          <td><code>${{row.task_span_label}}</code></td>
          <td>${{row.status_model}}</td>
          <td>${{row.critical_path_state}}</td>
          <td><code>${{row.merge_gate_ref || "-"}}</code></td>
        </tr>
      `).join("");
      dom.milestoneTableBody.querySelectorAll("[data-milestone-id]").forEach((button) => {{
        button.addEventListener("click", () => setSelection("milestone", button.dataset.milestoneId));
      }});
    }}

    function renderGateTable() {{
      const rows = filteredGates();
      dom.gateTableBody.innerHTML = rows.map((row) => `
        <tr data-gate-id="${{row.merge_gate_id}}">
          <td><button type="button" class="row-button" data-gate-id="${{row.merge_gate_id}}">${{row.gate_title}}</button></td>
          <td>${{row.gate_type}}</td>
          <td>${{row.baseline_scope}}</td>
          <td>${{row.gate_status}}</td>
          <td>${{row.incoming_milestone_refs.length}}</td>
          <td>${{row.required_artifact_refs.slice(0, 2).join(", ")}}</td>
        </tr>
      `).join("");
      dom.gateTableBody.querySelectorAll("[data-gate-id]").forEach((button) => {{
        button.addEventListener("click", () => setSelection("gate", button.dataset.gateId));
      }});
    }}

    function listToHtml(values) {{
      if (!values || !values.length) return '<span class="empty">None</span>';
      return values.map((value) => `<code>${{value}}</code>`).join("<br />");
    }}

    function renderInspector() {{
      dom.selectionStrip.innerHTML = "";
      if (state.selectedType === "gate") {{
        const gate = selectedGate();
        if (!gate) {{
          dom.inspectorBody.innerHTML = '<div class="empty">No gate matches the current filters.</div>';
          return;
        }}
        dom.selectionStrip.innerHTML = `
          <span>${{gate.merge_gate_id}}</span>
          <span>${{gate.gate_status}}</span>
          <span>${{gate.baseline_scope}}</span>
        `;
        dom.inspectorBody.innerHTML = `
          <div class="detail-row"><strong>Gate</strong><span>${{gate.gate_title}}</span></div>
          <div class="detail-row"><strong>Incoming milestones</strong><span>${{gate.incoming_milestone_refs.join(", ")}}</span></div>
          <div class="detail-row"><strong>Incoming tasks</strong><code>${{gate.incoming_task_span}}</code></div>
          <div class="detail-row"><strong>Required artifacts</strong>${{listToHtml(gate.required_artifact_refs)}}</div>
          <div class="detail-row"><strong>Required dependencies</strong>${{listToHtml(gate.required_dependency_refs)}}</div>
          <div class="detail-row"><strong>Required risks</strong>${{listToHtml(gate.required_risk_posture_refs)}}</div>
          <div class="detail-row"><strong>Conformance refs</strong>${{listToHtml(gate.required_conformance_refs)}}</div>
          <div class="detail-row"><strong>Blocking rules</strong>${{listToHtml(gate.blocking_rule_refs)}}</div>
          <div class="detail-row"><strong>Failure mode if skipped</strong><span>${{gate.failure_mode_if_skipped}}</span></div>
          <div class="detail-row"><strong>Notes</strong><span>${{gate.notes}}</span></div>
        `;
      }} else {{
        const milestone = selectedMilestone();
        if (!milestone) {{
          dom.inspectorBody.innerHTML = '<div class="empty">No milestone matches the current filters.</div>';
          return;
        }}
        dom.selectionStrip.innerHTML = `
          <span>${{milestone.milestone_id}}</span>
          <span>${{milestone.status_model}}</span>
          <span>${{milestone.critical_path_state}}</span>
          <span>${{milestone.baseline_scope}}</span>
        `;
        dom.inspectorBody.innerHTML = `
          <div class="detail-row"><strong>Milestone</strong><span>${{milestone.milestone_title}}</span></div>
          <div class="detail-row"><strong>Tasks</strong><code>${{milestone.task_span_label}}</code></div>
          <div class="detail-row"><strong>Phase refs</strong><span>${{milestone.source_phase_refs.join(", ")}}</span></div>
          <div class="detail-row"><strong>Artifacts</strong>${{listToHtml(milestone.required_artifact_refs)}}</div>
          <div class="detail-row"><strong>Requirement IDs</strong>${{listToHtml(milestone.required_requirement_ids)}}</div>
          <div class="detail-row"><strong>Risk IDs</strong>${{listToHtml(milestone.required_risk_ids)}}</div>
          <div class="detail-row"><strong>Dependency refs</strong>${{listToHtml(milestone.required_dependency_refs)}}</div>
          <div class="detail-row"><strong>Parallel track refs</strong>${{listToHtml(milestone.allowed_parallel_track_refs)}}</div>
          <div class="detail-row"><strong>Conformance refs</strong>${{listToHtml(milestone.conformance_row_refs)}}</div>
          <div class="detail-row"><strong>Entry conditions</strong>${{listToHtml(milestone.entry_condition_refs)}}</div>
          <div class="detail-row"><strong>Exit conditions</strong>${{listToHtml(milestone.exit_condition_refs)}}</div>
          <div class="detail-row"><strong>Merge gate</strong><code>${{milestone.merge_gate_ref || "-"}}</code></div>
          <div class="detail-row"><strong>Notes</strong><span>${{milestone.notes}}</span></div>
        `;
      }}
      syncSelectedClasses();
    }}

    function render() {{
      if (state.selectedType === "milestone" && !filteredMilestones().find((row) => row.milestone_id === state.selectedId)) {{
        state.selectedId = filteredMilestones()[0]?.milestone_id || "";
      }}
      if (state.selectedType === "gate" && !filteredGates().find((row) => row.merge_gate_id === state.selectedId)) {{
        state.selectedId = filteredGates()[0]?.merge_gate_id || "";
      }}
      renderSummary();
      renderTimeline();
      renderGraph();
      renderMilestoneTable();
      renderGateTable();
      renderInspector();
    }}

    initFilters();
    render();
  </script>
</body>
</html>
"""
    return (
        template.replace("{{", "{")
        .replace("}}", "}")
        .replace("__SAFE_JSON__", safe_json)
        .replace("__PHASE_TITLES__", json.dumps(PHASE_TITLES))
    )


def main() -> None:
    prereqs = ensure_prerequisites()
    tasks = prereqs["tasks"]
    tasks_by_num = {task["num"]: task for task in tasks}
    task_index = {task["task_ref"]: task for task in tasks}

    milestone_specs, gate_specs, track_specs, phase0_subphases = build_specs(prereqs)
    milestones, milestone_task_map, task_to_milestone = expand_milestones(tasks, prereqs["requirement_index"], milestone_specs)
    edges = build_edges()
    critical_path = mark_critical_path(milestones, edges)
    milestone_index = {row["milestone_id"]: row for row in milestones}
    gate_status = derive_gate_status(gate_specs, milestone_index, milestone_task_map, task_index)
    derive_milestone_status(milestones, edges, gate_status, milestone_task_map, task_index)
    gate_rows = finalize_gates(gate_specs, milestone_task_map, milestone_index, gate_status)
    track_rows = expand_tracks(tasks_by_num, track_specs)
    phase0_rows = build_phase0_subphase_rows(phase0_subphases, milestone_index)
    task_rows = build_task_map_rows(tasks, task_to_milestone, milestone_index)

    payload = build_programme_payload(prereqs, milestones, gate_rows, track_rows, edges, critical_path, phase0_rows)
    write_json(PROGRAMME_JSON_PATH, payload)
    write_csv(TASK_MAP_PATH, task_rows)
    write_csv(EDGE_PATH, edges)
    write_csv(TRACK_PATH, track_rows)
    write_csv(GATE_PATH, gate_rows)
    write_json(CRITICAL_PATH_PATH, critical_path)
    build_markdown_docs(payload, task_rows, gate_rows, track_rows, phase0_rows)
    write_text(CONTROL_TOWER_HTML_PATH, build_html(payload))


if __name__ == "__main__":
    main()
