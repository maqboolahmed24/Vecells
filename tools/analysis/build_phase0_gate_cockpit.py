#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
import textwrap
import ast
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "programme"

REQUIRED_INPUTS = {
    "requirement_registry": DATA_DIR / "requirement_registry.jsonl",
    "source_manifest": DATA_DIR / "source_manifest.json",
    "summary_reconciliation_matrix": DATA_DIR / "summary_reconciliation_matrix.csv",
    "canonical_aliases": DATA_DIR / "canonical_term_aliases.json",
    "conformance_seed": DATA_DIR / "cross_phase_conformance_seed.json",
    "product_scope": DATA_DIR / "product_scope_matrix.json",
    "persona_catalog": DATA_DIR / "persona_catalog.json",
    "channel_inventory": DATA_DIR / "channel_inventory.json",
    "audience_surface_inventory": DATA_DIR / "audience_surface_inventory.csv",
    "request_lineage": DATA_DIR / "request_lineage_transitions.json",
    "object_catalog": DATA_DIR / "object_catalog.json",
    "state_machines": DATA_DIR / "state_machines.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "external_assurance_obligations": DATA_DIR / "external_assurance_obligations.csv",
    "dependency_simulator_strategy": DATA_DIR / "dependency_simulator_strategy.json",
    "regulatory_workstreams": DATA_DIR / "regulatory_workstreams.json",
    "safety_hazard_register_seed": DATA_DIR / "safety_hazard_register_seed.csv",
    "field_sensitivity_catalog": DATA_DIR / "field_sensitivity_catalog.json",
    "audit_event_disclosure_matrix": DATA_DIR / "audit_event_disclosure_matrix.csv",
    "runtime_topology": DATA_DIR / "runtime_workload_families.json",
    "service_runtime_matrix": DATA_DIR / "service_runtime_matrix.csv",
    "gateway_surface_matrix": DATA_DIR / "gateway_surface_matrix.csv",
    "async_effect_proof_matrix": DATA_DIR / "async_effect_proof_matrix.csv",
    "frontend_stack_scorecard": DATA_DIR / "frontend_stack_scorecard.csv",
    "ui_contract_publication_matrix": DATA_DIR / "ui_contract_publication_matrix.csv",
    "playwright_coverage_matrix": DATA_DIR / "playwright_coverage_matrix.csv",
    "tooling_scorecard": DATA_DIR / "tooling_scorecard.csv",
    "release_gate_matrix": DATA_DIR / "release_gate_matrix.csv",
    "security_control_matrix": DATA_DIR / "security_control_matrix.csv",
    "incident_and_alert_routing_matrix": DATA_DIR / "incident_and_alert_routing_matrix.csv",
    "supply_chain_and_provenance_matrix": DATA_DIR / "supply_chain_and_provenance_matrix.json",
    "adr_index": DATA_DIR / "adr_index.json",
    "architecture_gap_register": DATA_DIR / "architecture_gap_register.json",
    "programme_milestones": DATA_DIR / "programme_milestones.json",
    "merge_gate_matrix": DATA_DIR / "merge_gate_matrix.csv",
    "critical_path_summary": DATA_DIR / "critical_path_summary.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "dependency_watchlist": DATA_DIR / "dependency_watchlist.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "requirement_task_traceability": DATA_DIR / "requirement_task_traceability.csv",
}

ENTRY_MATRIX_CSV = DATA_DIR / "phase0_entry_criteria_matrix.csv"
BLOCKERS_CSV = DATA_DIR / "phase0_gate_blockers.csv"
EVIDENCE_JSON = DATA_DIR / "phase0_evidence_index.json"
VERDICT_JSON = DATA_DIR / "phase0_gate_verdict.json"
SUBPHASE_GATE_CSV = DATA_DIR / "phase0_subphase_gate_map.csv"

ENTRY_MD = DOCS_DIR / "20_phase0_entry_criteria_and_foundation_gate.md"
READINESS_MD = DOCS_DIR / "20_phase0_readiness_matrix.md"
VERDICT_MD = DOCS_DIR / "20_phase0_gate_verdict_and_blockers.md"
EVIDENCE_MD = DOCS_DIR / "20_phase0_evidence_pack_index.md"
RUNBOOK_MD = DOCS_DIR / "20_phase0_foundation_gate_runbook.md"
COCKPIT_HTML = DOCS_DIR / "20_phase0_foundation_gate_cockpit.html"
SEQUENCE_MMD = DOCS_DIR / "20_phase0_foundation_gate_sequence.mmd"

CURRENT_PHASE0_GATE_ID = "GATE_P0_FOUNDATION_ENTRY"
PLANNING_READY_STATE = "ready_for_external_readiness"
VISUAL_MODE = "Foundation_Gateboard"

CLASS_ORDER = [
    "source_truth",
    "scope",
    "architecture",
    "dependency_readiness",
    "assurance_readiness",
    "privacy_security",
    "runtime_baseline",
    "frontend_baseline",
    "tooling_baseline",
    "risk_posture",
    "traceability",
    "conformance",
]

CLASS_LABELS = {
    "source_truth": "Source Truth",
    "scope": "Scope",
    "architecture": "Architecture",
    "dependency_readiness": "Dependency",
    "assurance_readiness": "Assurance",
    "privacy_security": "Privacy/Security",
    "runtime_baseline": "Runtime",
    "frontend_baseline": "Frontend",
    "tooling_baseline": "Tooling",
    "risk_posture": "Risk",
    "traceability": "Traceability",
    "conformance": "Conformance",
}

STATUS_ORDER = {"blocked": 0, "review_required": 1, "pass": 2}
VERDICT_ORDER = {"withheld": 0, "conditional": 1, "approved": 2}

REQUIREMENT_LIBRARY = {
    "lifecycle": [
        "REQ-OBJ-lifecyclecoordinator",
        "REQ-INV-012",
        "GAP-FINDING-045",
    ],
    "route_settlement": [
        "REQ-OBJ-routeintentbinding",
        "REQ-OBJ-commandactionrecord",
        "REQ-OBJ-commandsettlementrecord",
        "REQ-EDGE-ROUTE-INTENT-AND-SETTLEMENT",
        "REQ-INV-025",
        "REQ-INV-035",
        "REQ-INV-036",
        "REQ-INV-037",
    ],
    "publication": [
        "REQ-OBJ-runtimepublicationbundle",
        "REQ-OBJ-designcontractpublicationbundle",
        "REQ-OBJ-designcontractlintverdict",
        "REQ-INV-059",
        "REQ-INV-061",
    ],
    "shell": [
        "REQ-OBJ-persistentshell",
        "REQ-OBJ-audiencesurfaceruntimebinding",
        "REQ-INV-044",
        "REQ-INV-062",
    ],
    "adapter": [
        "REQ-OBJ-adapterdispatchattempt",
        "REQ-OBJ-adapterreceiptcheckpoint",
        "REQ-INV-028",
    ],
    "continuity": [
        "REQ-INV-053",
        "REQ-TEST-phase-9-the-assurance-ledger-md-132",
    ],
    "source": [
        "REQ-SRC-vecells-complete-end-to-end-flow-md",
        "REQ-OBJ-lifecyclecoordinator",
        "REQ-OBJ-runtimepublicationbundle",
        "REQ-OBJ-designcontractpublicationbundle",
    ],
}

SOURCE_PRECEDENCE = [
    "prompt/020.md",
    "prompt/shared_operating_contract_016_to_020.md",
    "blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol",
    "blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
    "blueprint/phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
    "blueprint/phase-0-the-foundation-protocol.md#0G. Observability, security plumbing, and operational controls",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
    "blueprint/platform-admin-and-config-blueprint.md#Config compilation pipeline",
    "blueprint/platform-admin-and-config-blueprint.md#Production promotion gate",
    "blueprint/phase-9-the-assurance-ledger.md#PhaseConformanceRow",
    "blueprint/phase-9-the-assurance-ledger.md#CrossPhaseConformanceScorecard",
    "blueprint/forensic-audit-findings.md#Findings 95, 104-120",
]

MANDATORY_CONTROL_PLANE_OBLIGATIONS = [
    "LifecycleCoordinator",
    "RouteIntentBinding",
    "CommandSettlementRecord",
    "RuntimePublicationBundle",
    "DesignContractPublicationBundle",
    "ReleasePublicationParityRecord",
    "AudienceSurfaceRuntimeBinding",
    "ReleaseWatchTuple",
    "AssuranceSliceTrustRecord",
    "ExperienceContinuityControlEvidence",
]


@dataclass(frozen=True)
class EvidenceSpec:
    artifact_ref: str
    path: Path
    artifact_class: str
    title: str
    upstream_task_ref: str
    baseline_scope: str
    source_refs: list[str]
    notes: str


@dataclass
class CriterionResult:
    criterion_id: str
    criterion_title: str
    criterion_class: str
    required_artifact_refs: list[str]
    required_requirement_ids: list[str]
    required_task_refs: list[str]
    required_dependency_refs: list[str]
    required_risk_refs: list[str]
    required_conformance_refs: list[str]
    auto_check_rule: str
    manual_review_rule: str
    status: str
    blocker_if_failed: str
    notes: str
    gate_impact: str
    source_refs: list[str]
    waiver_ref: str = ""

    def to_csv_row(self) -> dict[str, Any]:
        return {
            "criterion_id": self.criterion_id,
            "criterion_title": self.criterion_title,
            "criterion_class": self.criterion_class,
            "required_artifact_refs": json.dumps(self.required_artifact_refs),
            "required_requirement_ids": json.dumps(self.required_requirement_ids),
            "required_task_refs": json.dumps(self.required_task_refs),
            "required_dependency_refs": json.dumps(self.required_dependency_refs),
            "required_risk_refs": json.dumps(self.required_risk_refs),
            "required_conformance_refs": json.dumps(self.required_conformance_refs),
            "auto_check_rule": self.auto_check_rule,
            "manual_review_rule": self.manual_review_rule,
            "status": self.status,
            "blocker_if_failed": self.blocker_if_failed,
            "notes": self.notes,
            "gate_impact": self.gate_impact,
            "source_refs": json.dumps(self.source_refs),
            "waiver_ref": self.waiver_ref,
        }


@dataclass
class BlockerRow:
    blocker_id: str
    criterion_id: str
    criterion_title: str
    criterion_class: str
    blocker_state: str
    severity: str
    summary: str
    required_action: str
    linked_artifact_refs: list[str]
    linked_dependency_refs: list[str]
    linked_risk_refs: list[str]
    required_task_refs: list[str]
    due_gate_ref: str
    notes: str

    def to_csv_row(self) -> dict[str, Any]:
        return {
            "blocker_id": self.blocker_id,
            "criterion_id": self.criterion_id,
            "criterion_title": self.criterion_title,
            "criterion_class": self.criterion_class,
            "blocker_state": self.blocker_state,
            "severity": self.severity,
            "summary": self.summary,
            "required_action": self.required_action,
            "linked_artifact_refs": json.dumps(self.linked_artifact_refs),
            "linked_dependency_refs": json.dumps(self.linked_dependency_refs),
            "linked_risk_refs": json.dumps(self.linked_risk_refs),
            "required_task_refs": json.dumps(self.required_task_refs),
            "due_gate_ref": self.due_gate_ref,
            "notes": self.notes,
        }


@dataclass
class GateMapRow:
    gate_id: str
    gate_title: str
    scope: str
    predecessor_ref: str
    successor_ref: str
    required_criterion_refs: list[str]
    required_artifact_refs: list[str]
    required_control_plane_obligations: list[str]
    required_task_refs: list[str]
    gate_owner_role: str
    current_verdict: str
    blocking_rule: str
    notes: str

    def to_csv_row(self) -> dict[str, Any]:
        return {
            "gate_id": self.gate_id,
            "gate_title": self.gate_title,
            "scope": self.scope,
            "predecessor_ref": self.predecessor_ref,
            "successor_ref": self.successor_ref,
            "required_criterion_refs": json.dumps(self.required_criterion_refs),
            "required_artifact_refs": json.dumps(self.required_artifact_refs),
            "required_control_plane_obligations": json.dumps(self.required_control_plane_obligations),
            "required_task_refs": json.dumps(self.required_task_refs),
            "gate_owner_role": self.gate_owner_role,
            "current_verdict": self.current_verdict,
            "blocking_rule": self.blocking_rule,
            "notes": self.notes,
        }


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
    table_rows = [headers, ["---"] * len(headers)]
    table_rows.extend([[str(cell) for cell in row] for row in rows])
    return "\n".join("| " + " | ".join(row) + " |" for row in table_rows)


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def iso_mtime(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def require_inputs() -> None:
    missing = [f"{name}: {path}" for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    if missing:
        raise SystemExit("Missing seq_020 prerequisites:\n" + "\n".join(missing))


def build_context() -> dict[str, Any]:
    require_inputs()
    context = {
        "generated_at": iso_now(),
        "requirement_rows": load_jsonl(REQUIRED_INPUTS["requirement_registry"]),
        "source_manifest": load_json(REQUIRED_INPUTS["source_manifest"]),
        "summary_reconciliation_rows": load_csv(REQUIRED_INPUTS["summary_reconciliation_matrix"]),
        "canonical_aliases": load_json(REQUIRED_INPUTS["canonical_aliases"]),
        "conformance_seed": load_json(REQUIRED_INPUTS["conformance_seed"]),
        "product_scope": load_json(REQUIRED_INPUTS["product_scope"]),
        "persona_catalog": load_json(REQUIRED_INPUTS["persona_catalog"]),
        "channel_inventory": load_json(REQUIRED_INPUTS["channel_inventory"]),
        "audience_surface_inventory": load_csv(REQUIRED_INPUTS["audience_surface_inventory"]),
        "request_lineage": load_json(REQUIRED_INPUTS["request_lineage"]),
        "object_catalog": load_json(REQUIRED_INPUTS["object_catalog"]),
        "state_machines": load_json(REQUIRED_INPUTS["state_machines"]),
        "external_dependencies": load_json(REQUIRED_INPUTS["external_dependencies"]),
        "external_assurance_obligations": load_csv(REQUIRED_INPUTS["external_assurance_obligations"]),
        "dependency_simulator_strategy": load_json(REQUIRED_INPUTS["dependency_simulator_strategy"]),
        "regulatory_workstreams": load_json(REQUIRED_INPUTS["regulatory_workstreams"]),
        "safety_hazard_rows": load_csv(REQUIRED_INPUTS["safety_hazard_register_seed"]),
        "field_sensitivity_catalog": load_json(REQUIRED_INPUTS["field_sensitivity_catalog"]),
        "audit_event_disclosure_rows": load_csv(REQUIRED_INPUTS["audit_event_disclosure_matrix"]),
        "runtime_topology": load_json(REQUIRED_INPUTS["runtime_topology"]),
        "service_runtime_rows": load_csv(REQUIRED_INPUTS["service_runtime_matrix"]),
        "gateway_surface_rows": load_csv(REQUIRED_INPUTS["gateway_surface_matrix"]),
        "async_effect_rows": load_csv(REQUIRED_INPUTS["async_effect_proof_matrix"]),
        "frontend_stack_rows": load_csv(REQUIRED_INPUTS["frontend_stack_scorecard"]),
        "ui_contract_rows": load_csv(REQUIRED_INPUTS["ui_contract_publication_matrix"]),
        "playwright_rows": load_csv(REQUIRED_INPUTS["playwright_coverage_matrix"]),
        "tooling_rows": load_csv(REQUIRED_INPUTS["tooling_scorecard"]),
        "release_gate_rows": load_csv(REQUIRED_INPUTS["release_gate_matrix"]),
        "security_control_rows": load_csv(REQUIRED_INPUTS["security_control_matrix"]),
        "alert_routing_rows": load_csv(REQUIRED_INPUTS["incident_and_alert_routing_matrix"]),
        "provenance_matrix": load_json(REQUIRED_INPUTS["supply_chain_and_provenance_matrix"]),
        "adr_index": load_json(REQUIRED_INPUTS["adr_index"]),
        "architecture_gap_register": load_json(REQUIRED_INPUTS["architecture_gap_register"]),
        "programme_milestones": load_json(REQUIRED_INPUTS["programme_milestones"]),
        "merge_gate_rows": load_csv(REQUIRED_INPUTS["merge_gate_matrix"]),
        "critical_path_summary": load_json(REQUIRED_INPUTS["critical_path_summary"]),
        "risk_register": load_json(REQUIRED_INPUTS["master_risk_register"]),
        "dependency_watchlist": load_json(REQUIRED_INPUTS["dependency_watchlist"]),
        "coverage_summary": load_json(REQUIRED_INPUTS["coverage_summary"]),
        "requirement_trace_rows": load_csv(REQUIRED_INPUTS["requirement_task_traceability"]),
    }
    context["merge_gate_by_id"] = {row["merge_gate_id"]: row for row in context["merge_gate_rows"]}
    context["risk_by_id"] = {row["risk_id"]: row for row in context["risk_register"]["risks"]}
    context["dependency_by_id"] = {row["dependency_id"]: row for row in context["dependency_watchlist"]["dependencies"]}
    return context


def build_evidence_specs() -> list[EvidenceSpec]:
    return [
        EvidenceSpec("requirement_registry.jsonl", DATA_DIR / "requirement_registry.jsonl", "source_truth", "Canonical requirement registry", "seq_001", "current", SOURCE_PRECEDENCE, "Requirement corpus frozen."),
        EvidenceSpec("source_manifest.json", DATA_DIR / "source_manifest.json", "source_truth", "Source manifest", "seq_001", "current", SOURCE_PRECEDENCE, "Blueprint source inventory and precedence."),
        EvidenceSpec("summary_reconciliation_matrix.csv", DATA_DIR / "summary_reconciliation_matrix.csv", "source_truth", "Summary reconciliation matrix", "seq_002", "current", SOURCE_PRECEDENCE, "Recorded terminology and summary-layer alignments."),
        EvidenceSpec("cross_phase_conformance_seed.json", DATA_DIR / "cross_phase_conformance_seed.json", "conformance", "Cross-phase conformance seed", "seq_002", "current", SOURCE_PRECEDENCE, "Phase 0 and cross-phase conformance seed rows."),
        EvidenceSpec("product_scope_matrix.json", DATA_DIR / "product_scope_matrix.json", "scope", "Current and deferred scope baseline", "seq_003", "current", SOURCE_PRECEDENCE, "Phase 7 stays deferred and optional PDS stays conditional."),
        EvidenceSpec("audience_surface_inventory.csv", DATA_DIR / "audience_surface_inventory.csv", "architecture", "Audience and shell inventory", "seq_004", "current", SOURCE_PRECEDENCE, "Audience, shell, and route-family freeze."),
        EvidenceSpec("request_lineage_transitions.json", DATA_DIR / "request_lineage_transitions.json", "architecture", "Request lineage model", "seq_005", "current", SOURCE_PRECEDENCE, "Canonical lineage, gap register, and endpoint matrix."),
        EvidenceSpec("object_catalog.json", DATA_DIR / "object_catalog.json", "architecture", "Canonical object catalog", "seq_006", "current", SOURCE_PRECEDENCE, "Vecells object inventory and alias freeze."),
        EvidenceSpec("state_machines.json", DATA_DIR / "state_machines.json", "architecture", "State-machine atlas", "seq_007", "current", SOURCE_PRECEDENCE, "State, transition, invariant, and conflict atlas."),
        EvidenceSpec("external_dependencies.json", DATA_DIR / "external_dependencies.json", "dependency_readiness", "External dependency inventory", "seq_008", "current", SOURCE_PRECEDENCE, "Dependencies, truth ladders, and scope posture."),
        EvidenceSpec("external_assurance_obligations.csv", DATA_DIR / "external_assurance_obligations.csv", "dependency_readiness", "External assurance obligations", "seq_008", "current", SOURCE_PRECEDENCE, "Manual blockers and future onboarding proof."),
        EvidenceSpec("dependency_simulator_strategy.json", DATA_DIR / "dependency_simulator_strategy.json", "dependency_readiness", "Simulator strategy", "seq_008", "current", SOURCE_PRECEDENCE, "Replaceable-by-simulator posture and local stubs."),
        EvidenceSpec("regulatory_workstreams.json", DATA_DIR / "regulatory_workstreams.json", "assurance_readiness", "Regulatory workstreams", "seq_009", "current", SOURCE_PRECEDENCE, "Workstreams, artifact schedule, and trigger matrix."),
        EvidenceSpec("safety_hazard_register_seed.csv", DATA_DIR / "safety_hazard_register_seed.csv", "assurance_readiness", "Safety hazard seed", "seq_009", "current", SOURCE_PRECEDENCE, "Hazard seed rows and safety gates."),
        EvidenceSpec("field_sensitivity_catalog.json", DATA_DIR / "field_sensitivity_catalog.json", "privacy_security", "Field sensitivity catalog", "seq_010", "current", SOURCE_PRECEDENCE, "Data classes, break-glass, and redaction posture."),
        EvidenceSpec("audit_event_disclosure_matrix.csv", DATA_DIR / "audit_event_disclosure_matrix.csv", "privacy_security", "Audit disclosure matrix", "seq_010", "current", SOURCE_PRECEDENCE, "Audit disclosure and minimum-necessary boundaries."),
        EvidenceSpec("runtime_workload_families.json", DATA_DIR / "runtime_workload_families.json", "runtime_baseline", "Runtime topology baseline", "seq_011", "current", SOURCE_PRECEDENCE, "Trust zones, tenant model, and workload families."),
        EvidenceSpec("service_runtime_matrix.csv", DATA_DIR / "service_runtime_matrix.csv", "runtime_baseline", "Backend runtime service matrix", "seq_013", "current", SOURCE_PRECEDENCE, "Runtime component and authoritative writer split."),
        EvidenceSpec("gateway_surface_matrix.csv", DATA_DIR / "gateway_surface_matrix.csv", "runtime_baseline", "Gateway surface split", "seq_014", "current", SOURCE_PRECEDENCE, "Route-family and surface gateway contracts."),
        EvidenceSpec("async_effect_proof_matrix.csv", DATA_DIR / "async_effect_proof_matrix.csv", "architecture", "Async effect proof matrix", "seq_013", "current", SOURCE_PRECEDENCE, "Inbox/outbox, idempotency, and replay substrate."),
        EvidenceSpec("frontend_stack_scorecard.csv", DATA_DIR / "frontend_stack_scorecard.csv", "frontend_baseline", "Frontend stack decision", "seq_014", "current", SOURCE_PRECEDENCE, "Chosen client-first React runtime."),
        EvidenceSpec("ui_contract_publication_matrix.csv", DATA_DIR / "ui_contract_publication_matrix.csv", "frontend_baseline", "UI contract publication bundle", "seq_014", "current", SOURCE_PRECEDENCE, "Design-contract publication members and route markers."),
        EvidenceSpec("playwright_coverage_matrix.csv", DATA_DIR / "playwright_coverage_matrix.csv", "frontend_baseline", "Frontend browser coverage matrix", "seq_014", "current", SOURCE_PRECEDENCE, "Shell and route automation commitments."),
        EvidenceSpec("tooling_scorecard.csv", DATA_DIR / "tooling_scorecard.csv", "tooling_baseline", "Tooling family scorecard", "seq_015", "current", SOURCE_PRECEDENCE, "Observability, security, and release tooling choices."),
        EvidenceSpec("release_gate_matrix.csv", DATA_DIR / "release_gate_matrix.csv", "tooling_baseline", "Release gate matrix", "seq_015", "current", SOURCE_PRECEDENCE, "Verification ladder and release parity laws."),
        EvidenceSpec("security_control_matrix.csv", DATA_DIR / "security_control_matrix.csv", "privacy_security", "Security control matrix", "seq_015", "current", SOURCE_PRECEDENCE, "Ingress, session, and policy controls."),
        EvidenceSpec("incident_and_alert_routing_matrix.csv", DATA_DIR / "incident_and_alert_routing_matrix.csv", "tooling_baseline", "Incident and alert routing matrix", "seq_015", "current", SOURCE_PRECEDENCE, "Alert routing and incident families."),
        EvidenceSpec("supply_chain_and_provenance_matrix.json", DATA_DIR / "supply_chain_and_provenance_matrix.json", "tooling_baseline", "Supply-chain and provenance matrix", "seq_015", "current", SOURCE_PRECEDENCE, "Provenance, SBOM, and exception law."),
        EvidenceSpec("adr_index.json", DATA_DIR / "adr_index.json", "architecture", "Architecture ADR freeze", "seq_016", "current", SOURCE_PRECEDENCE, "Accepted ADR set and contract bindings."),
        EvidenceSpec("architecture_gap_register.json", DATA_DIR / "architecture_gap_register.json", "architecture", "Architecture gap register", "seq_016", "current", SOURCE_PRECEDENCE, "Resolved and inherited architecture gaps."),
        EvidenceSpec("programme_milestones.json", DATA_DIR / "programme_milestones.json", "conformance", "Programme milestone graph", "seq_017", "current", SOURCE_PRECEDENCE, "Serialized milestone and subphase graph."),
        EvidenceSpec("merge_gate_matrix.csv", DATA_DIR / "merge_gate_matrix.csv", "conformance", "Merge gate matrix", "seq_017", "current", SOURCE_PRECEDENCE, "Merge gate rules and task spans."),
        EvidenceSpec("critical_path_summary.json", DATA_DIR / "critical_path_summary.json", "conformance", "Critical-path summary", "seq_017", "current", SOURCE_PRECEDENCE, "Current-baseline critical path and long leads."),
        EvidenceSpec("master_risk_register.json", DATA_DIR / "master_risk_register.json", "risk_posture", "Master risk register", "seq_018", "current", SOURCE_PRECEDENCE, "Blocking gate-impact risks and mitigations."),
        EvidenceSpec("dependency_watchlist.json", DATA_DIR / "dependency_watchlist.json", "risk_posture", "Dependency watchlist", "seq_018", "current", SOURCE_PRECEDENCE, "Lifecycle states for partner and internal seams."),
        EvidenceSpec("coverage_summary.json", DATA_DIR / "coverage_summary.json", "traceability", "Traceability coverage summary", "seq_019", "current", SOURCE_PRECEDENCE, "Requirement and task coverage counts."),
        EvidenceSpec("requirement_task_traceability.csv", DATA_DIR / "requirement_task_traceability.csv", "traceability", "Requirement-to-task traceability map", "seq_019", "current", SOURCE_PRECEDENCE, "Full requirement-to-task grounding."),
    ]


def build_evidence_index(context: dict[str, Any]) -> dict[str, Any]:
    product_scope = context["product_scope"]
    adr_index = context["adr_index"]
    programme = context["programme_milestones"]
    phase0_seed = next(row for row in context["conformance_seed"]["rows"] if row["phase_id"] == "phase_0")
    consistency_checks = [
        {
            "check_id": "CHECK_CURRENT_BASELINE_ALIGNMENT",
            "status": "pass"
            if set(product_scope["baseline_phases"]) == {"phase_0", "phase_1", "phase_2", "phase_3", "phase_4", "phase_5", "phase_6", "phase_8", "phase_9"}
            and adr_index["current_baseline"] == "phases 0-6, 8, and 9"
            and "phase_7" not in product_scope["baseline_phases"]
            else "fail",
            "summary": "Scope and ADR freeze agree on the current delivery baseline.",
        },
        {
            "check_id": "CHECK_PHASE7_DEFERRED_ALIGNMENT",
            "status": "pass"
            if product_scope["deferred_phases"] == ["phase_7"] and adr_index["deferred_baseline"] == "phase 7 embedded NHS App channel"
            else "fail",
            "summary": "Deferred Phase 7 posture is explicit and consistent.",
        },
        {
            "check_id": "CHECK_PHASE0_SUBPHASE_COUNT",
            "status": "pass" if len(programme["phase0_subphases"]) == 7 else "fail",
            "summary": "Programme graph still models seven hard-gated Phase 0 sub-phases.",
        },
        {
            "check_id": "CHECK_PHASE0_CONFORMANCE_SEED",
            "status": "pass"
            if phase0_seed["alignment_status"] == "aligned_with_recorded_decisions"
            and "RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT" in phase0_seed["blocking_conflicts"]
            else "fail",
            "summary": "Phase 0 conformance seed still names the required blocking conflicts and publication tuples.",
        },
        {
            "check_id": "CHECK_EXTERNAL_GATE_PRESENT",
            "status": "pass" if "GATE_EXTERNAL_TO_FOUNDATION" in context["merge_gate_by_id"] else "fail",
            "summary": "Programme gate model still contains the external-readiness entry gate.",
        },
    ]
    artifact_rows: list[dict[str, Any]] = []
    for spec in build_evidence_specs():
        artifact_rows.append(
            {
                "artifact_ref": spec.artifact_ref,
                "title": spec.title,
                "artifact_class": spec.artifact_class,
                "relative_path": spec.path.relative_to(ROOT).as_posix(),
                "upstream_task_ref": spec.upstream_task_ref,
                "baseline_scope": spec.baseline_scope,
                "freshness_state": "current" if spec.path.exists() else "missing",
                "contradiction_state": "clear",
                "sha256": file_sha256(spec.path),
                "last_modified_utc": iso_mtime(spec.path),
                "source_refs": spec.source_refs,
                "notes": spec.notes,
            }
        )
    return {
        "evidence_index_id": "phase0_foundation_gate_evidence_v1",
        "generated_at": context["generated_at"],
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "artifact_count": len(artifact_rows),
            "current_count": sum(1 for row in artifact_rows if row["freshness_state"] == "current"),
            "missing_count": sum(1 for row in artifact_rows if row["freshness_state"] == "missing"),
            "contradiction_count": sum(1 for row in consistency_checks if row["status"] != "pass"),
        },
        "consistency_checks": consistency_checks,
        "artifacts": artifact_rows,
    }


def evidence_map(evidence_index: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {row["artifact_ref"]: row for row in evidence_index["artifacts"]}


def parse_json_cell(cell: str) -> list[str]:
    if not cell:
        return []
    try:
        payload = json.loads(cell)
    except json.JSONDecodeError:
        payload = ast.literal_eval(cell)
    return payload if isinstance(payload, list) else []


def build_criteria(context: dict[str, Any], evidence_index: dict[str, Any]) -> list[CriterionResult]:
    evid = evidence_map(evidence_index)
    merge_gate_external = context["merge_gate_by_id"]["GATE_EXTERNAL_TO_FOUNDATION"]
    phase0_seed = next(row for row in context["conformance_seed"]["rows"] if row["phase_id"] == "phase_0")
    chosen_frontend = next(row for row in context["frontend_stack_rows"] if row["decision"] == "chosen")
    external_blocking_risks = [
        risk
        for risk in context["risk_register"]["risks"]
        if "GATE_EXTERNAL_TO_FOUNDATION" in risk.get("affected_gate_refs", [])
        and risk["gate_impact"] == "blocking"
    ]
    current_blocked_dependencies = [
        dep
        for dep in context["dependency_watchlist"]["dependencies"]
        if dep["baseline_scope"] == "current" and dep["lifecycle_state"] in {"blocked", "onboarding"}
    ]
    open_architecture_gaps = [
        issue["issue_id"]
        for issue in context["architecture_gap_register"]["issues"]
        if issue["status"] == "open"
    ]
    criteria = [
        CriterionResult(
            criterion_id="CRIT_SRC_001",
            criterion_title="Source algorithm ingested and summary drift reconciled",
            criterion_class="source_truth",
            required_artifact_refs=["requirement_registry.jsonl", "source_manifest.json", "summary_reconciliation_matrix.csv", "cross_phase_conformance_seed.json"],
            required_requirement_ids=REQUIREMENT_LIBRARY["source"],
            required_task_refs=["seq_001", "seq_002"],
            required_dependency_refs=[],
            required_risk_refs=["RISK_MUTATION_001", "RISK_RUNTIME_001"],
            required_conformance_refs=["PHASE_CONFORMANCE_ROW_PHASE_0"],
            auto_check_rule="Requirement registry, source manifest, reconciliation matrix, and conformance seed all exist and remain internally consistent.",
            manual_review_rule="Confirm newly added blueprint sources or late forensic findings have not bypassed the source-precedence policy.",
            status="pass",
            blocker_if_failed="No foundation gate without a reconciled source algorithm.",
            notes=(
                f"{len(context['requirement_rows'])} canonical requirements are registered across "
                f"{len(context['source_manifest']['sources'])} blueprint sources, with "
                f"{len(context['summary_reconciliation_rows'])} reconciliation rows and "
                f"{len(context['canonical_aliases']['rows'])} canonical aliases."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_SCOPE_001",
            criterion_title="Current and deferred scope baseline frozen",
            criterion_class="scope",
            required_artifact_refs=["product_scope_matrix.json", "adr_index.json", "programme_milestones.json"],
            required_requirement_ids=[],
            required_task_refs=["seq_003", "seq_016", "seq_017"],
            required_dependency_refs=[],
            required_risk_refs=[],
            required_conformance_refs=[],
            auto_check_rule="Phase 7 remains deferred in scope, ADR, and programme artifacts while phases 0-6, 8, and 9 remain current baseline.",
            manual_review_rule="If a new channel is proposed, force a scope decision before any implementation branch reuses Phase 0 authority.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while current and deferred scope are ambiguous.",
            notes=context["product_scope"]["current_delivery_baseline_statement"],
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_ARCH_001",
            criterion_title="Persona, channel, audience, and shell inventory frozen",
            criterion_class="architecture",
            required_artifact_refs=["audience_surface_inventory.csv", "gateway_surface_matrix.csv", "frontend_stack_scorecard.csv"],
            required_requirement_ids=REQUIREMENT_LIBRARY["shell"],
            required_task_refs=["seq_004", "seq_011", "seq_014"],
            required_dependency_refs=[],
            required_risk_refs=["RISK_UI_001"],
            required_conformance_refs=[],
            auto_check_rule="Persona, channel, shell, and gateway matrices still expose explicit audience and shell ownership counts.",
            manual_review_rule="If a new surface appears, bind it to an existing shell family or freeze it out of baseline scope before implementation.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while shell ownership or audience posture is implicit.",
            notes=(
                f"{len(context['persona_catalog']['personas'])} personas, "
                f"{len(context['channel_inventory']['channels'])} channels, and "
                f"{len(context['audience_surface_inventory'])} persona-surface rows keep shell ownership explicit."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_ARCH_002",
            criterion_title="Request lineage, object, state, and invariant packs are implementation-ready",
            criterion_class="architecture",
            required_artifact_refs=["request_lineage_transitions.json", "object_catalog.json", "state_machines.json"],
            required_requirement_ids=unique(REQUIREMENT_LIBRARY["lifecycle"] + REQUIREMENT_LIBRARY["route_settlement"] + REQUIREMENT_LIBRARY["continuity"]),
            required_task_refs=["seq_005", "seq_006", "seq_007"],
            required_dependency_refs=[],
            required_risk_refs=["RISK_STATE_001", "RISK_STATE_002", "RISK_STATE_003", "RISK_STATE_005"],
            required_conformance_refs=["PHASE_CONFORMANCE_ROW_PHASE_0"],
            auto_check_rule="Lineage stages, object catalog, and state-machine atlas all exist with no unresolved catalog gaps.",
            manual_review_rule="Review any new phase-local state proposal against the canonical object and invariant pack before allowing implementation.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while canonical domain truth is still partial or prose-only.",
            notes=(
                f"{len(context['request_lineage']['lineage_stages'])} lineage stages, "
                f"{len(context['object_catalog']['objects'])} canonical objects, and "
                f"{context['state_machines']['summary']['machine_count']} state machines are published."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_ARCH_003",
            criterion_title="Lifecycle ownership, route-intent binding, and command settlement are explicit",
            criterion_class="architecture",
            required_artifact_refs=["service_runtime_matrix.csv", "request_lineage_transitions.json", "cross_phase_conformance_seed.json", "adr_index.json"],
            required_requirement_ids=unique(REQUIREMENT_LIBRARY["lifecycle"] + REQUIREMENT_LIBRARY["route_settlement"]),
            required_task_refs=["seq_005", "seq_013", "seq_016"],
            required_dependency_refs=[],
            required_risk_refs=["RISK_MUTATION_001", "RISK_MUTATION_002", "RISK_MUTATION_003", "RISK_OWNERSHIP_001"],
            required_conformance_refs=["PHASE_CONFORMANCE_ROW_PHASE_0"],
            auto_check_rule="LifecycleCoordinator appears as sole cross-domain authority and Command API remains the only canonical writer while the Phase 0 conformance seed still names ownership and mutation conflicts.",
            manual_review_rule="Reject any proposed child-domain direct write or route-local authoritative mutation before it lands in a Phase 0 implementation task.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while lifecycle ownership or settlement law is implicit.",
            notes="LifecycleCoordinator, RouteIntentBinding, CommandActionRecord, and CommandSettlementRecord remain first-class foundation contracts.",
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_ARCH_004",
            criterion_title="Adapter boundaries include inbox, outbox, idempotency, replay, and degradation posture",
            criterion_class="architecture",
            required_artifact_refs=["external_dependencies.json", "async_effect_proof_matrix.csv", "service_runtime_matrix.csv"],
            required_requirement_ids=REQUIREMENT_LIBRARY["adapter"],
            required_task_refs=["seq_008", "seq_013"],
            required_dependency_refs=["dep_nhs_login_rail", "dep_cross_org_secure_messaging_mesh", "dep_pharmacy_referral_transport"],
            required_risk_refs=["RISK_BOOKING_002", "RISK_PHARMACY_001"],
            required_conformance_refs=[],
            auto_check_rule="Async effect matrix rows must continue to expose inbox/outbox, idempotency, replay, and authoritative proof upgrades for integration paths.",
            manual_review_rule="Any new external integration must add a first-class effect row before implementation may rely on it.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while adapters are only named by vendor or transport and not by proof contract.",
            notes=f"{len(context['async_effect_rows'])} async effect lanes preserve outbox, inbox, idempotency, and replay law at the integration boundary.",
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_ARCH_005",
            criterion_title="Unhappy-path invariants are planned from the start",
            criterion_class="architecture",
            required_artifact_refs=["state_machines.json", "request_lineage_transitions.json", "master_risk_register.json"],
            required_requirement_ids=REQUIREMENT_LIBRARY["continuity"],
            required_task_refs=["seq_005", "seq_007", "seq_018"],
            required_dependency_refs=[],
            required_risk_refs=["HZ_DUPLICATE_SUPPRESSION_OR_MERGE", "HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE", "HZ_WRONG_PATIENT_BINDING"],
            required_conformance_refs=[],
            auto_check_rule="State-machine and lineage packs continue to name duplicate replay, quarantine, fallback review, repair hold, and confirmation-gate blocking paths.",
            manual_review_rule="Treat any proposed 'happy-path only' foundation task as non-compliant until the unhappy-path state and proof obligations are added.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while unhappy-path invariants remain late hardening.",
            notes=(
                f"State atlas still carries {context['state_machines']['summary']['conflict_count']} conflict rows and the lineage model keeps "
                f"{len(context['request_lineage']['gap_register'])} bounded gap rows explicit instead of hiding unhappy paths."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_DEP_001",
            criterion_title="External dependency inventory and simulator strategy are defined",
            criterion_class="dependency_readiness",
            required_artifact_refs=["external_dependencies.json", "external_assurance_obligations.csv", "dependency_simulator_strategy.json"],
            required_requirement_ids=[],
            required_task_refs=["seq_008"],
            required_dependency_refs=["dep_nhs_login_rail", "dep_im1_pairing_programme", "dep_cross_org_secure_messaging_mesh"],
            required_risk_refs=["RISK_EXT_NHS_LOGIN_DELAY", "RISK_EXT_IM1_SCAL_DELAY", "RISK_EXT_COMMS_VENDOR_DELAY"],
            required_conformance_refs=[],
            auto_check_rule="Dependency inventory, assurance obligations, and simulator strategy exist and remain current-baseline aware.",
            manual_review_rule="Keep optional PDS and deferred NHS App evidence inventoried but non-blocking unless scope changes explicitly.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while dependency shape or simulator posture is undefined.",
            notes=(
                f"{len(context['external_dependencies']['dependencies'])} dependencies, "
                f"{len(context['external_assurance_obligations'])} assurance obligations, and "
                f"{len(context['external_dependencies']['future_browser_automation_backlog'])} future browser-automation rows are published."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_DEP_002",
            criterion_title="Current-baseline external-readiness gate is cleared for Phase 0 entry",
            criterion_class="dependency_readiness",
            required_artifact_refs=["external_dependencies.json", "external_assurance_obligations.csv", "dependency_simulator_strategy.json", "programme_milestones.json", "merge_gate_matrix.csv", "dependency_watchlist.json", "master_risk_register.json"],
            required_requirement_ids=[],
            required_task_refs=parse_json_cell(merge_gate_external["required_completed_task_refs"]),
            required_dependency_refs=parse_json_cell(merge_gate_external["required_dependency_refs"]),
            required_risk_refs=unique(parse_json_cell(merge_gate_external["required_risk_posture_refs"]) + [risk["risk_id"] for risk in external_blocking_risks]),
            required_conformance_refs=parse_json_cell(merge_gate_external["required_conformance_refs"]),
            auto_check_rule="GATE_EXTERNAL_TO_FOUNDATION must no longer be blocked and the current-baseline onboarding dependencies named by that gate must not remain blocked or onboarding.",
            manual_review_rule="Re-run the gate after seq_021-seq_040 and require explicit partner-path, simulator-freeze, and manual-checkpoint evidence.",
            status="blocked" if merge_gate_external["gate_status"] == "blocked" else "pass",
            blocker_if_failed="No Phase 0 entry until current-baseline external readiness and manual checkpoint truth are complete.",
            notes=(
                f"{merge_gate_external['merge_gate_id']} is still {merge_gate_external['gate_status']}; "
                f"{len(current_blocked_dependencies)} current-baseline dependencies are still blocked or onboarding, including "
                "dep_nhs_login_rail, dep_im1_pairing_programme, and dep_cross_org_secure_messaging_mesh."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_ASSURANCE_001",
            criterion_title="Safety, privacy, regulatory, and change-control workstreams are opened",
            criterion_class="assurance_readiness",
            required_artifact_refs=["regulatory_workstreams.json", "safety_hazard_register_seed.csv", "cross_phase_conformance_seed.json"],
            required_requirement_ids=REQUIREMENT_LIBRARY["continuity"],
            required_task_refs=["seq_009"],
            required_dependency_refs=["dep_nhs_assurance_and_standards_sources"],
            required_risk_refs=["HZ_WRONG_PATIENT_BINDING", "HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE"],
            required_conformance_refs=["PHASE_CONFORMANCE_ROW_PHASE_0"],
            auto_check_rule="Regulatory workstreams, evidence schedule, hazard seed, and change-control triggers must still exist with zero unresolved gaps.",
            manual_review_rule="Treat later supplier onboarding evidence as a continuation of these workstreams, not as a substitute for them.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while assurance workstreams are implicit or unowned.",
            notes=(
                f"{len(context['regulatory_workstreams']['workstreams'])} workstreams, "
                f"{len(context['regulatory_workstreams']['evidence_artifact_schedule'])} scheduled evidence artifacts, and "
                f"{len(context['safety_hazard_rows'])} seeded hazards are active."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_PRIV_001",
            criterion_title="Data-classification, disclosure, and security posture are frozen enough for implementation",
            criterion_class="privacy_security",
            required_artifact_refs=["field_sensitivity_catalog.json", "audit_event_disclosure_matrix.csv", "security_control_matrix.csv"],
            required_requirement_ids=[],
            required_task_refs=["seq_010", "seq_015"],
            required_dependency_refs=[],
            required_risk_refs=["HZ_WRONG_PATIENT_BINDING"],
            required_conformance_refs=[],
            auto_check_rule="Field sensitivity, disclosure, and baseline security control matrices still exist and have non-empty rows.",
            manual_review_rule="If new PHI or sensitive event families are added in Phase 0, extend disclosure and redaction contracts before implementation ships them.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while privacy and disclosure boundaries are undefined.",
            notes=(
                f"{len(context['field_sensitivity_catalog']['fields'])} field sensitivity rows, "
                f"{len(context['audit_event_disclosure_rows'])} audit disclosure rows, and "
                f"{len(context['security_control_rows'])} security controls define minimum-necessary posture."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_RUNTIME_001",
            criterion_title="Cloud, runtime, backend, and gateway baselines are chosen",
            criterion_class="runtime_baseline",
            required_artifact_refs=["runtime_workload_families.json", "service_runtime_matrix.csv", "gateway_surface_matrix.csv"],
            required_requirement_ids=unique(REQUIREMENT_LIBRARY["lifecycle"] + REQUIREMENT_LIBRARY["publication"]),
            required_task_refs=["seq_011", "seq_013", "seq_014"],
            required_dependency_refs=[],
            required_risk_refs=["RISK_RUNTIME_001"],
            required_conformance_refs=["PHASE_CONFORMANCE_ROW_PHASE_0"],
            auto_check_rule="Runtime topology, backend runtime matrix, and gateway surface split remain published for the current baseline.",
            manual_review_rule="Do not allow cloud, service, or gateway changes to bypass the published workload-family and tenant-scope model.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while runtime topology or authoritative service split is unresolved.",
            notes=(
                f"{len(context['runtime_topology']['runtime_workload_families'])} workload rows, "
                f"{len(context['service_runtime_rows'])} runtime components, and "
                f"{len(context['gateway_surface_rows'])} gateway surfaces are frozen."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_RUNTIME_002",
            criterion_title="Trust slices, watch tuples, recovery posture, and publication parity are foundational",
            criterion_class="runtime_baseline",
            required_artifact_refs=["release_gate_matrix.csv", "runtime_workload_families.json", "master_risk_register.json", "cross_phase_conformance_seed.json"],
            required_requirement_ids=unique(REQUIREMENT_LIBRARY["publication"] + REQUIREMENT_LIBRARY["continuity"]),
            required_task_refs=["seq_011", "seq_013", "seq_015", "seq_018"],
            required_dependency_refs=["dep_release_publication_tuple_pipeline", "dep_restore_rehearsal_evidence"],
            required_risk_refs=["RISK_RUNTIME_001", "FINDING_095", "FINDING_118", "RISK_ASSURANCE_001"],
            required_conformance_refs=["PHASE_CONFORMANCE_ROW_PHASE_0"],
            auto_check_rule="Release gate matrix must still bind runtime publication, parity, continuity, and recovery posture as one tuple.",
            manual_review_rule="If a new surface or route enters scope, extend the tuple and proof chain rather than introducing a local watch surface.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while publication parity, trust, or recovery posture are treated as later hardening.",
            notes=f"{len(context['release_gate_rows'])} release gates keep publication parity, continuity, and recovery posture in one ladder.",
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_FE_001",
            criterion_title="Shell scaffolding obeys persistent-shell and visibility law",
            criterion_class="frontend_baseline",
            required_artifact_refs=["frontend_stack_scorecard.csv", "ui_contract_publication_matrix.csv", "playwright_coverage_matrix.csv", "audience_surface_inventory.csv"],
            required_requirement_ids=unique(REQUIREMENT_LIBRARY["shell"] + REQUIREMENT_LIBRARY["publication"]),
            required_task_refs=["seq_004", "seq_014"],
            required_dependency_refs=[],
            required_risk_refs=["RISK_UI_001", "RISK_ASSURANCE_001"],
            required_conformance_refs=[],
            auto_check_rule="Chosen frontend stack, publication bundle matrix, coverage matrix, and audience inventory must still expose same-shell and visibility markers.",
            manual_review_rule="Reject any Phase 0 shell task that introduces page silos, detached mini-shells, or route-local truth.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while shell scaffolding is still prototype freedom.",
            notes=f"{chosen_frontend['label']} remains chosen with {len(context['playwright_rows'])} browser coverage rows and published route markers.",
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_FE_002",
            criterion_title="Design-contract publication is treated as a foundation contract, not a sidecar",
            criterion_class="frontend_baseline",
            required_artifact_refs=["ui_contract_publication_matrix.csv", "release_gate_matrix.csv", "adr_index.json"],
            required_requirement_ids=REQUIREMENT_LIBRARY["publication"],
            required_task_refs=["seq_014", "seq_015", "seq_016"],
            required_dependency_refs=[],
            required_risk_refs=["FINDING_118", "RISK_RUNTIME_001"],
            required_conformance_refs=["PHASE_CONFORMANCE_ROW_PHASE_0"],
            auto_check_rule="Design-contract publication members, route markers, and release-gate bundle requirements must remain part of the published runtime tuple.",
            manual_review_rule="Any token, marker, or state-semantics drift must fail publication rather than being carried by local snapshots.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while design-contract publication can drift outside runtime publication.",
            notes=f"{len(context['ui_contract_rows'])} bundle members keep token export, markers, and lint verdicts inside runtime publication.",
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_TOOL_001",
            criterion_title="Release freeze, provenance, and verification ladder are foundational",
            criterion_class="tooling_baseline",
            required_artifact_refs=["tooling_scorecard.csv", "release_gate_matrix.csv", "supply_chain_and_provenance_matrix.json"],
            required_requirement_ids=REQUIREMENT_LIBRARY["publication"],
            required_task_refs=["seq_015"],
            required_dependency_refs=["dep_hsm_signing_key_provisioning"],
            required_risk_refs=["GAP_015_HSM_SIGNING_KEY_PROVISIONING"],
            required_conformance_refs=[],
            auto_check_rule="Tooling baseline and release gate matrix must remain published, with provenance and signing law encoded into the release ladder.",
            manual_review_rule="Before 0G exit or any release candidate freeze, bind the concrete HSM-backed signing-key path and publish the owning runbook.",
            status="review_required" if "GAP_015_HSM_SIGNING_KEY_PROVISIONING" in open_architecture_gaps else "pass",
            blocker_if_failed="No Phase 0 exit or release candidate promotion without signing-key authority bound.",
            notes="Tooling baseline is chosen, but the HSM-backed signing key remains an explicit provisioning seam carried forward from seq_015/seq_016.",
            gate_impact="warning",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_TOOL_002",
            criterion_title="Operational evidence routing exists, but concrete alert destinations still need binding",
            criterion_class="tooling_baseline",
            required_artifact_refs=["incident_and_alert_routing_matrix.csv", "tooling_scorecard.csv", "master_risk_register.json"],
            required_requirement_ids=REQUIREMENT_LIBRARY["continuity"],
            required_task_refs=["seq_015", "seq_018"],
            required_dependency_refs=["dep_alert_destination_binding"],
            required_risk_refs=["GAP_015_ALERT_DESTINATION_BINDING"],
            required_conformance_refs=[],
            auto_check_rule="Alert-routing matrix and evidence-board tooling baseline exist for essential functions and incident families.",
            manual_review_rule="Before 0G exit or live operational readiness claims, bind concrete tenant and owner destinations for the named alert routes.",
            status="review_required" if "GAP_015_ALERT_DESTINATION_BINDING" in open_architecture_gaps else "pass",
            blocker_if_failed="No Phase 0 exit or operational-readiness claim without concrete alert destinations.",
            notes="Alert families and on-call routes are published, but the final tenant and service-owner binding remains intentionally open.",
            gate_impact="warning",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_RISK_001",
            criterion_title="Risk register and dependency watchlist are published with exact blocking posture",
            criterion_class="risk_posture",
            required_artifact_refs=["master_risk_register.json", "dependency_watchlist.json", "programme_milestones.json"],
            required_requirement_ids=[],
            required_task_refs=["seq_017", "seq_018"],
            required_dependency_refs=["dep_nhs_login_rail", "dep_im1_pairing_programme", "dep_cross_org_secure_messaging_mesh"],
            required_risk_refs=["RISK_EXT_NHS_LOGIN_DELAY", "RISK_EXT_IM1_SCAL_DELAY", "RISK_EXT_COMMS_VENDOR_DELAY", "HZ_WRONG_PATIENT_BINDING", "HZ_TELEPHONY_EVIDENCE_INADEQUACY"],
            required_conformance_refs=[],
            auto_check_rule="Master risk register and dependency watchlist must still expose current blocking gate-impact rows for Phase 0.",
            manual_review_rule="Do not convert open blocking risks into narrative confidence; either close them or leave the gate withheld.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while the risk posture is implicit or blocker-free by omission.",
            notes=(
                f"{len(context['risk_register']['risks'])} risks and "
                f"{len(context['dependency_watchlist']['dependencies'])} dependency watch rows keep "
                f"{len(external_blocking_risks)} external-readiness blocking risks explicit."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_TRACE_001",
            criterion_title="Requirement-to-task traceability is established before implementation",
            criterion_class="traceability",
            required_artifact_refs=["coverage_summary.json", "requirement_task_traceability.csv"],
            required_requirement_ids=[],
            required_task_refs=["seq_019"],
            required_dependency_refs=[],
            required_risk_refs=[],
            required_conformance_refs=[],
            auto_check_rule="Coverage summary must keep current-baseline requirement gaps at zero and map the full canonical corpus to tasks.",
            manual_review_rule="If new implementation tasks appear without trace rows, regenerate the map before allowing the gate to move.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while traceability is inferred from roadmap titles alone.",
            notes=(
                f"{context['coverage_summary']['summary']['requirement_count']} requirements are grounded across "
                f"{context['coverage_summary']['summary']['task_count']} tasks with "
                f"{context['coverage_summary']['summary']['requirements_with_gaps_count']} current-baseline gaps."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_CONF_001",
            criterion_title="Phase 0 conformance seed names the exact control conflicts and required tuples",
            criterion_class="conformance",
            required_artifact_refs=["cross_phase_conformance_seed.json", "summary_reconciliation_matrix.csv", "adr_index.json"],
            required_requirement_ids=unique(REQUIREMENT_LIBRARY["publication"] + REQUIREMENT_LIBRARY["route_settlement"]),
            required_task_refs=["seq_002", "seq_016"],
            required_dependency_refs=[],
            required_risk_refs=["RISK_MUTATION_001", "RISK_RUNTIME_001", "RISK_STATE_001", "RISK_STATE_002", "RISK_STATE_003", "RISK_STATE_004", "RISK_STATE_005"],
            required_conformance_refs=["PHASE_CONFORMANCE_ROW_PHASE_0", "CROSS_PHASE_CONFORMANCE_SCORECARD_CURRENT_BASELINE"],
            auto_check_rule="Phase 0 conformance seed still aligns with recorded decisions and enumerates required runtime publication tuples and blocking conflicts.",
            manual_review_rule="Treat the live PhaseConformanceRow as a later exit-proof artifact, but do not let the seed drift before implementation begins.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while conformance posture is narrative-only or missing tuple law.",
            notes=(
                f"Phase 0 seed row keeps {len(phase0_seed['blocking_conflicts'])} blocking conflicts and "
                f"{len(phase0_seed['required_runtime_publication_tuples'])} required runtime publication tuples explicit."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
        CriterionResult(
            criterion_id="CRIT_CONF_002",
            criterion_title="Programme graph operationalizes internal Phase 0 gates instead of implying them",
            criterion_class="conformance",
            required_artifact_refs=["programme_milestones.json", "merge_gate_matrix.csv", "critical_path_summary.json"],
            required_requirement_ids=[],
            required_task_refs=["seq_017"],
            required_dependency_refs=[],
            required_risk_refs=["RISK_DEPENDENCY_HYGIENE_WATCHLIST_DRIFT"],
            required_conformance_refs=["PHASE_CONFORMANCE_ROW_PHASE_0"],
            auto_check_rule="Programme graph must continue to expose seven Phase 0 sub-phases, long-lead tracks, and the later parallel-open gate.",
            manual_review_rule="Keep new Phase 0 tasks bound to the named sub-phases; do not add unofficial side paths that bypass the gate map.",
            status="pass",
            blocker_if_failed="No Phase 0 entry while internal gates are still prose-only.",
            notes=(
                f"{len(context['programme_milestones']['phase0_subphases'])} sub-phases and "
                f"{len(context['programme_milestones']['merge_gates'])} merge gates already exist; seq_020 turns the entry verdict into an evidence-backed decision."
            ),
            gate_impact="blocking",
            source_refs=SOURCE_PRECEDENCE,
        ),
    ]

    for criterion in criteria:
        for artifact_ref in criterion.required_artifact_refs:
            if artifact_ref not in evid:
                raise SystemExit(f"Criterion {criterion.criterion_id} references unknown artifact {artifact_ref}")
    return sorted(criteria, key=lambda row: (CLASS_ORDER.index(row.criterion_class), STATUS_ORDER[row.status], row.criterion_id))


def build_blockers(context: dict[str, Any], criteria: list[CriterionResult]) -> list[BlockerRow]:
    criterion_by_id = {row.criterion_id: row for row in criteria}
    merge_gate_external = context["merge_gate_by_id"]["GATE_EXTERNAL_TO_FOUNDATION"]
    blocker_rows = [
        BlockerRow(
            blocker_id="BLOCKER_P0_EXT_GATE_BLOCKED",
            criterion_id="CRIT_DEP_002",
            criterion_title=criterion_by_id["CRIT_DEP_002"].criterion_title,
            criterion_class="dependency_readiness",
            blocker_state="blocked",
            severity="high",
            summary="Current-baseline external-readiness gate is still blocked, so 0A may not start.",
            required_action="Complete seq_021-seq_040, publish the integration assumption freeze, and re-evaluate GATE_EXTERNAL_TO_FOUNDATION.",
            linked_artifact_refs=["programme_milestones.json", "merge_gate_matrix.csv", "external_dependencies.json"],
            linked_dependency_refs=parse_json_cell(merge_gate_external["required_dependency_refs"]),
            linked_risk_refs=["RISK_EXT_NHS_LOGIN_DELAY", "RISK_EXT_IM1_SCAL_DELAY", "RISK_EXT_COMMS_VENDOR_DELAY"],
            required_task_refs=parse_json_cell(merge_gate_external["required_completed_task_refs"]),
            due_gate_ref=CURRENT_PHASE0_GATE_ID,
            notes="This is the principal current-state blocker for Phase 0 entry.",
        ),
        BlockerRow(
            blocker_id="BLOCKER_P0_IDENTITY_AND_WRONG_PATIENT_PROOF",
            criterion_id="CRIT_DEP_002",
            criterion_title=criterion_by_id["CRIT_DEP_002"].criterion_title,
            criterion_class="dependency_readiness",
            blocker_state="blocked",
            severity="high",
            summary="Identity, onboarding, and wrong-patient safeguards still depend on external proof not yet captured.",
            required_action="Publish NHS login onboarding evidence, IM1 prerequisite proof, and explicit wrong-patient mitigation evidence before moving the gate.",
            linked_artifact_refs=["external_assurance_obligations.csv", "regulatory_workstreams.json", "master_risk_register.json"],
            linked_dependency_refs=["dep_nhs_login_rail", "dep_im1_pairing_programme"],
            linked_risk_refs=["HZ_WRONG_PATIENT_BINDING", "RISK_EXT_NHS_LOGIN_DELAY", "RISK_EXT_IM1_SCAL_DELAY"],
            required_task_refs=["seq_021", "seq_023", "seq_024", "seq_025", "seq_031", "seq_032", "seq_033", "seq_034", "seq_035", "seq_039", "seq_040"],
            due_gate_ref=CURRENT_PHASE0_GATE_ID,
            notes="Phase 0 entry may not outrun the explicit identity and assurance onboarding chain.",
        ),
        BlockerRow(
            blocker_id="BLOCKER_P0_TELEPHONY_AND_MESH_READINESS",
            criterion_id="CRIT_DEP_002",
            criterion_title=criterion_by_id["CRIT_DEP_002"].criterion_title,
            criterion_class="dependency_readiness",
            blocker_state="blocked",
            severity="high",
            summary="Telephony, communications, and secure-messaging partner paths are still onboarding, leaving evidence capture and callback rails incomplete.",
            required_action="Finish vendor scorecards, account strategy, simulator freeze, and secure-messaging readiness evidence before Phase 0 entry.",
            linked_artifact_refs=["external_dependencies.json", "external_assurance_obligations.csv", "dependency_watchlist.json", "master_risk_register.json"],
            linked_dependency_refs=["dep_cross_org_secure_messaging_mesh", "dep_telephony_ivr_recording_provider", "dep_sms_notification_provider", "dep_email_notification_provider", "dep_transcription_processing_provider", "dep_malware_scanning_provider"],
            linked_risk_refs=["HZ_TELEPHONY_EVIDENCE_INADEQUACY", "RISK_EXT_COMMS_VENDOR_DELAY"],
            required_task_refs=["seq_021", "seq_022", "seq_023", "seq_031", "seq_032", "seq_033", "seq_034", "seq_035", "seq_038", "seq_039", "seq_040"],
            due_gate_ref=CURRENT_PHASE0_GATE_ID,
            notes="The external-readiness gate remains evidence-driven, not supplier-optimistic.",
        ),
        BlockerRow(
            blocker_id="WARNING_P0_HSM_SIGNING_KEY",
            criterion_id="CRIT_TOOL_001",
            criterion_title=criterion_by_id["CRIT_TOOL_001"].criterion_title,
            criterion_class="tooling_baseline",
            blocker_state="warning",
            severity="medium",
            summary="HSM-backed signing key provisioning is intentionally still open.",
            required_action="Bind the concrete signing-key path before 0G exit and any release-candidate freeze.",
            linked_artifact_refs=["tooling_scorecard.csv", "release_gate_matrix.csv", "supply_chain_and_provenance_matrix.json"],
            linked_dependency_refs=["dep_hsm_signing_key_provisioning"],
            linked_risk_refs=["GAP_015_HSM_SIGNING_KEY_PROVISIONING"],
            required_task_refs=["seq_132", "seq_133", "seq_134", "seq_137"],
            due_gate_ref="GATE_P0_EXIT",
            notes="This is a bounded warning for entry, but a hard requirement later in Phase 0.",
        ),
        BlockerRow(
            blocker_id="WARNING_P0_ALERT_DESTINATION_BINDING",
            criterion_id="CRIT_TOOL_002",
            criterion_title=criterion_by_id["CRIT_TOOL_002"].criterion_title,
            criterion_class="tooling_baseline",
            blocker_state="warning",
            severity="medium",
            summary="Alert destinations and owner bindings are modeled but not yet concretely provisioned.",
            required_action="Bind tenant- and service-owner-specific alert destinations before 0G exit and live operational-readiness claims.",
            linked_artifact_refs=["incident_and_alert_routing_matrix.csv", "tooling_scorecard.csv", "master_risk_register.json"],
            linked_dependency_refs=["dep_alert_destination_binding"],
            linked_risk_refs=["GAP_015_ALERT_DESTINATION_BINDING"],
            required_task_refs=["seq_132", "seq_133", "seq_137"],
            due_gate_ref="GATE_P0_EXIT",
            notes="Bounded entry warning only; not a substitute for later operational proof.",
        ),
    ]
    return blocker_rows


def build_gate_map(context: dict[str, Any], criteria: list[CriterionResult]) -> list[GateMapRow]:
    programme = context["programme_milestones"]
    phase0_subphases = {row["subphase_code"]: row for row in programme["phase0_subphases"]}
    return [
        GateMapRow(
            gate_id="GATE_P0_ENTRY_0A",
            gate_title="Phase 0 entry into 0A delivery skeleton",
            scope="phase0_entry",
            predecessor_ref="GATE_EXTERNAL_TO_FOUNDATION",
            successor_ref="0A",
            required_criterion_refs=["CRIT_SRC_001", "CRIT_SCOPE_001", "CRIT_ARCH_001", "CRIT_ARCH_002", "CRIT_DEP_001", "CRIT_DEP_002", "CRIT_ASSURANCE_001", "CRIT_RUNTIME_001", "CRIT_FE_001", "CRIT_TOOL_001", "CRIT_RISK_001", "CRIT_TRACE_001", "CRIT_CONF_001", "CRIT_CONF_002"],
            required_artifact_refs=["phase0_gate_verdict.json", "programme_milestones.json", "merge_gate_matrix.csv"],
            required_control_plane_obligations=["LifecycleCoordinator", "RouteIntentBinding", "CommandSettlementRecord", "AudienceSurfaceRuntimeBinding"],
            required_task_refs=["seq_001", "seq_002", "seq_003", "seq_004", "seq_005", "seq_006", "seq_007", "seq_008", "seq_009", "seq_010", "seq_011", "seq_012", "seq_013", "seq_014", "seq_015", "seq_016", "seq_017", "seq_018", "seq_019", "seq_020", "seq_021", "seq_022", "seq_023", "seq_024", "seq_025", "seq_026", "seq_028", "seq_031", "seq_032", "seq_033", "seq_034", "seq_035", "seq_036", "seq_037", "seq_038", "seq_039", "seq_040"],
            gate_owner_role="ROLE_FOUNDATION_PROGRAMME_OWNER",
            current_verdict="withheld",
            blocking_rule="No Phase 0 implementation starts while GATE_EXTERNAL_TO_FOUNDATION remains blocked.",
            notes="Entry gate bridges planning freeze into executable Phase 0 work.",
        ),
        GateMapRow(
            gate_id="GATE_P0_0A_TO_0B",
            gate_title="0A exit into 0B canonical domain kernel",
            scope="phase0_internal_subphase",
            predecessor_ref="0A",
            successor_ref="0B",
            required_criterion_refs=["CRIT_ARCH_001", "CRIT_ARCH_003", "CRIT_RUNTIME_001", "CRIT_FE_001", "CRIT_CONF_002"],
            required_artifact_refs=["programme_milestones.json", "adr_index.json", "workspace_package_graph.json", "phase0_gate_verdict.json"],
            required_control_plane_obligations=["LifecycleCoordinator", "RouteIntentBinding", "AudienceSurfaceRuntimeBinding"],
            required_task_refs=phase0_subphases["0A"]["task_refs"],
            gate_owner_role="ROLE_FOUNDATION_DOMAIN_OWNER",
            current_verdict="withheld",
            blocking_rule="0A must freeze repo, boundary, and shell scaffolding law before canonical kernel work begins.",
            notes="Delivery skeleton may not grow into page silos or hidden data seams.",
        ),
        GateMapRow(
            gate_id="GATE_P0_0B_TO_0C",
            gate_title="0B exit into 0C runtime publication substrate",
            scope="phase0_internal_subphase",
            predecessor_ref="0B",
            successor_ref="0C",
            required_criterion_refs=["CRIT_ARCH_002", "CRIT_ARCH_003", "CRIT_ARCH_004", "CRIT_ARCH_005", "CRIT_CONF_001"],
            required_artifact_refs=["state_machines.json", "object_catalog.json", "request_lineage_transitions.json"],
            required_control_plane_obligations=["LifecycleCoordinator", "RouteIntentBinding", "CommandSettlementRecord", "ExperienceContinuityControlEvidence"],
            required_task_refs=phase0_subphases["0B"]["task_refs"],
            gate_owner_role="ROLE_FOUNDATION_DOMAIN_OWNER",
            current_verdict="withheld",
            blocking_rule="0B must freeze canonical ownership, mutation, and unhappy-path law before runtime publication claims are meaningful.",
            notes="This is where canonical governors stop being prose and become implementation obligations.",
        ),
        GateMapRow(
            gate_id="GATE_P0_0C_TO_0D",
            gate_title="0C exit into 0D control governors and mutation law",
            scope="phase0_internal_subphase",
            predecessor_ref="0C",
            successor_ref="0D",
            required_criterion_refs=["CRIT_RUNTIME_001", "CRIT_RUNTIME_002", "CRIT_FE_002", "CRIT_TOOL_001"],
            required_artifact_refs=["service_runtime_matrix.csv", "release_gate_matrix.csv", "ui_contract_publication_matrix.csv"],
            required_control_plane_obligations=["RuntimePublicationBundle", "DesignContractPublicationBundle", "ReleasePublicationParityRecord", "AudienceSurfaceRuntimeBinding"],
            required_task_refs=phase0_subphases["0C"]["task_refs"],
            gate_owner_role="ROLE_RUNTIME_RELEASE_OWNER",
            current_verdict="withheld",
            blocking_rule="Runtime publication, design-contract publication, and parity law must be explicit before control-plane governor work proceeds.",
            notes="0C turns runtime publication and parity into foundation concerns rather than late hardening.",
        ),
        GateMapRow(
            gate_id="GATE_P0_0D_TO_0E",
            gate_title="0D exit into 0E verification ladder and simulator kernel",
            scope="phase0_internal_subphase",
            predecessor_ref="0D",
            successor_ref="0E",
            required_criterion_refs=["CRIT_ARCH_003", "CRIT_ARCH_004", "CRIT_RUNTIME_002", "CRIT_DEP_001"],
            required_artifact_refs=["async_effect_proof_matrix.csv", "release_gate_matrix.csv", "dependency_simulator_strategy.json"],
            required_control_plane_obligations=["RouteIntentBinding", "CommandSettlementRecord", "RuntimePublicationBundle", "ReleaseWatchTuple"],
            required_task_refs=phase0_subphases["0D"]["task_refs"],
            gate_owner_role="ROLE_FOUNDATION_CONTROL_OWNER",
            current_verdict="withheld",
            blocking_rule="0D must freeze mutation law, capability boundaries, and release/watch posture before verification and simulator parallelism opens.",
            notes="The control plane must exist before tests and simulators can claim parity.",
        ),
        GateMapRow(
            gate_id="GATE_P0_PARALLEL_FOUNDATION_OPEN",
            gate_title="0E exit and parallel foundation open gate",
            scope="phase0_parallel_open",
            predecessor_ref="0E",
            successor_ref="0F",
            required_criterion_refs=["CRIT_DEP_001", "CRIT_RUNTIME_002", "CRIT_FE_001", "CRIT_FE_002", "CRIT_TOOL_001", "CRIT_CONF_001"],
            required_artifact_refs=["playwright_coverage_matrix.csv", "ui_contract_publication_matrix.csv", "release_gate_matrix.csv", "dependency_simulator_strategy.json"],
            required_control_plane_obligations=MANDATORY_CONTROL_PLANE_OBLIGATIONS,
            required_task_refs=phase0_subphases["0E"]["task_refs"],
            gate_owner_role="ROLE_FOUNDATION_PROGRAMME_OWNER",
            current_verdict="withheld",
            blocking_rule="No parallel foundation tracks open until verification, simulator posture, publication parity, trust slices, watch tuples, and continuity proof all bind to one current tuple.",
            notes="This is the explicit source-required gate that opens later parallel foundation work.",
        ),
        GateMapRow(
            gate_id="GATE_P0_0F_TO_0G",
            gate_title="0F exit into 0G assurance closeout",
            scope="phase0_internal_subphase",
            predecessor_ref="0F",
            successor_ref="0G",
            required_criterion_refs=["CRIT_FE_001", "CRIT_FE_002", "CRIT_RUNTIME_002", "CRIT_ASSURANCE_001", "CRIT_RISK_001"],
            required_artifact_refs=["gateway_surface_matrix.csv", "playwright_coverage_matrix.csv", "master_risk_register.json"],
            required_control_plane_obligations=["AudienceSurfaceRuntimeBinding", "DesignContractPublicationBundle", "ReleasePublicationParityRecord", "ExperienceContinuityControlEvidence"],
            required_task_refs=phase0_subphases["0F"]["task_refs"],
            gate_owner_role="ROLE_FOUNDATION_EXPERIENCE_OWNER",
            current_verdict="withheld",
            blocking_rule="Same-shell continuity, route publication, and trust posture must be proven before assurance closeout begins.",
            notes="0F is where shell reality meets the tuple and proof model.",
        ),
        GateMapRow(
            gate_id="GATE_P0_EXIT",
            gate_title="Phase 0 exit gate",
            scope="phase0_internal_subphase",
            predecessor_ref="0G",
            successor_ref="phase_1+",
            required_criterion_refs=["CRIT_ASSURANCE_001", "CRIT_TOOL_001", "CRIT_TOOL_002", "CRIT_RISK_001", "CRIT_CONF_001"],
            required_artifact_refs=["release_gate_matrix.csv", "master_risk_register.json", "cross_phase_conformance_seed.json", "phase0_gate_verdict.json"],
            required_control_plane_obligations=["ReleaseWatchTuple", "AssuranceSliceTrustRecord", "ExperienceContinuityControlEvidence", "RuntimePublicationBundle", "ReleasePublicationParityRecord"],
            required_task_refs=phase0_subphases["0G"]["task_refs"],
            gate_owner_role="ROLE_FOUNDATION_PROGRAMME_OWNER",
            current_verdict="withheld",
            blocking_rule="No Phase 0 exit while long-lead assurance, provenance, alert routing, or live conformance proof remain incomplete.",
            notes="Entry warnings become hard exit obligations here.",
        ),
    ]


def build_gate_verdicts(
    context: dict[str, Any],
    criteria: list[CriterionResult],
    blockers: list[BlockerRow],
    gate_map: list[GateMapRow],
    evidence_index: dict[str, Any],
) -> dict[str, Any]:
    blocked_criteria = [row for row in criteria if row.status == "blocked" and row.gate_impact == "blocking"]
    warning_criteria = [row for row in criteria if row.status == "review_required"]
    current_verdict = "withheld" if blocked_criteria else ("conditional" if warning_criteria else "approved")
    criteria_by_id = {row.criterion_id: row for row in criteria}
    gate_rows = [
        {
            "gate_id": CURRENT_PHASE0_GATE_ID,
            "gate_title": "Phase 0 foundation entry gate",
            "scope": "phase0_entry",
            "evaluated_at": context["generated_at"],
            "evaluated_artifact_refs": [
                "phase0_entry_criteria_matrix.csv",
                "phase0_gate_blockers.csv",
                "phase0_evidence_index.json",
                "programme_milestones.json",
                "merge_gate_matrix.csv",
                "master_risk_register.json",
                "dependency_watchlist.json",
            ],
            "blocking_criterion_refs": [row.criterion_id for row in blocked_criteria],
            "warning_criterion_refs": [row.criterion_id for row in warning_criteria],
            "verdict": current_verdict,
            "reason": (
                "Planning and architecture foundation are frozen enough to open external-readiness work, "
                "but actual Phase 0 entry remains withheld because the current-baseline external-readiness "
                "gate is still blocked by onboarding, assurance, and simulator-freeze dependencies."
            )
            if current_verdict == "withheld"
            else (
                "All blocking criteria pass, but bounded non-foundational warnings remain."
                if current_verdict == "conditional"
                else "All blocking criteria pass and no remaining warnings prevent entry."
            ),
            "next_required_actions": [
                "Complete seq_021-seq_040 and clear GATE_EXTERNAL_TO_FOUNDATION.",
                "Publish the integration assumption freeze, partner-path evidence, and simulator/manual-checkpoint pack.",
                "Re-run build_phase0_gate_cockpit.py and validate_phase0_foundation_gate.py before claiming Phase 0 entry.",
            ],
            "notes": [
                "This verdict is intentionally separate from the planning gate foundation. Seq_020 closes implied-readiness and prose-only approval gaps without silently opening 0A.",
                "Deferred Phase 7 artifacts remain excluded from current-baseline proof.",
            ],
        }
    ]
    for row in gate_map:
        gate_rows.append(
            {
                "gate_id": row.gate_id,
                "gate_title": row.gate_title,
                "scope": row.scope,
                "evaluated_at": context["generated_at"],
                "evaluated_artifact_refs": row.required_artifact_refs,
                "blocking_criterion_refs": [crit_id for crit_id in row.required_criterion_refs if criteria_by_id.get(crit_id, CriterionResult("", "", "", [], [], [], [], [], [], "", "", "pass", "", "", "", [])).status == "blocked"],
                "warning_criterion_refs": [crit_id for crit_id in row.required_criterion_refs if criteria_by_id.get(crit_id, CriterionResult("", "", "", [], [], [], [], [], [], "", "", "pass", "", "", "", [])).status == "review_required"],
                "verdict": row.current_verdict,
                "reason": "Future internal gate is defined now but not yet eligible because its predecessor tasks and evidence are incomplete.",
                "next_required_actions": [
                    f"Complete {', '.join(row.required_task_refs[:3])}" + (" and later tasks in the sub-phase span." if len(row.required_task_refs) > 3 else "."),
                    "Keep the named control-plane obligations bound to the same publication and trust tuple.",
                ],
                "notes": [row.notes, row.blocking_rule],
            }
        )
    evidence_summary = evidence_index["summary"]
    planning_gate_now_ready = True
    return {
        "decision_pack_id": "phase0_foundation_gate_v1",
        "generated_at": context["generated_at"],
        "visual_mode": VISUAL_MODE,
        "planning_readiness": {
            "state": PLANNING_READY_STATE if planning_gate_now_ready else "blocked",
            "notes": "Seq_020 completes the planning-side foundation gate artifact required by GATE_PLAN_EXTERNAL_ENTRY, but it does not by itself open Phase 0 implementation.",
        },
        "summary": {
            "criterion_count": len(criteria),
            "pass_count": sum(1 for row in criteria if row.status == "pass"),
            "review_required_count": sum(1 for row in criteria if row.status == "review_required"),
            "blocked_count": sum(1 for row in criteria if row.status == "blocked"),
            "blocking_row_count": sum(1 for row in blockers if row.blocker_state == "blocked"),
            "warning_row_count": sum(1 for row in blockers if row.blocker_state == "warning"),
            "phase0_entry_verdict": current_verdict,
            "evidence_current_count": evidence_summary["current_count"],
            "evidence_missing_count": evidence_summary["missing_count"],
            "evidence_contradiction_count": evidence_summary["contradiction_count"],
        },
        "gate_verdicts": gate_rows,
        "source_precedence": SOURCE_PRECEDENCE,
    }


def build_docs(
    context: dict[str, Any],
    criteria: list[CriterionResult],
    blockers: list[BlockerRow],
    evidence_index: dict[str, Any],
    gate_map: list[GateMapRow],
    verdict_payload: dict[str, Any],
) -> None:
    summary = verdict_payload["summary"]
    main_gate = verdict_payload["gate_verdicts"][0]

    criteria_rows = [
        [
            row.criterion_id,
            CLASS_LABELS[row.criterion_class],
            row.status,
            ", ".join(row.required_task_refs[:4]) + ("..." if len(row.required_task_refs) > 4 else ""),
            row.notes,
        ]
        for row in criteria
    ]
    blocker_rows = [
        [
            row.blocker_id,
            row.blocker_state,
            row.severity,
            row.summary,
            row.required_action,
        ]
        for row in blockers
    ]
    evidence_rows = [
        [
            row["artifact_ref"],
            row["artifact_class"],
            row["upstream_task_ref"],
            row["freshness_state"],
            row["relative_path"],
        ]
        for row in evidence_index["artifacts"]
    ]
    gate_rows = [
        [
            row.gate_id,
            row.scope,
            row.current_verdict,
            row.predecessor_ref,
            row.successor_ref,
            ", ".join(row.required_control_plane_obligations[:4]) + ("..." if len(row.required_control_plane_obligations) > 4 else ""),
        ]
        for row in gate_map
    ]

    write_text(
        ENTRY_MD,
        textwrap.dedent(
            f"""
            # Phase 0 Entry Criteria And Foundation Gate

            ## Outcome

            - Current Phase 0 entry verdict: `{main_gate["verdict"]}`
            - Planning posture after seq_020: `{verdict_payload["planning_readiness"]["state"]}`
            - Blocking criteria: `{summary["blocked_count"]}`
            - Warning criteria: `{summary["review_required_count"]}`
            - Evidence freshness: `{summary["evidence_current_count"]} current / {summary["evidence_missing_count"]} missing / {summary["evidence_contradiction_count"]} contradictory`

            Phase 0 may not begin yet. The planning and architecture foundation are frozen enough to drive external-readiness work, but actual entry into `0A` remains withheld until the current-baseline external gate is cleared with partner-path, simulator-freeze, and assurance evidence.

            ## Criteria Summary

            {render_table(["Criterion", "Class", "Status", "Task Refs", "Decisive Note"], criteria_rows)}
            """
        ),
    )

    write_text(
        READINESS_MD,
        textwrap.dedent(
            f"""
            # Phase 0 Readiness Matrix

            ## Matrix

            {render_table(["Criterion", "Class", "Status", "Tasks", "Note"], criteria_rows)}
            """
        ),
    )

    write_text(
        VERDICT_MD,
        textwrap.dedent(
            f"""
            # Phase 0 Gate Verdict And Blockers

            ## Primary Verdict

            - Gate: `{main_gate["gate_id"]}`
            - Verdict: `{main_gate["verdict"]}`
            - Reason: {main_gate["reason"]}

            ## Blockers And Warnings

            {render_table(["Blocker", "State", "Severity", "Summary", "Required Action"], blocker_rows)}

            ## Internal Gate Status

            {render_table(["Gate", "Scope", "Verdict", "From", "To", "Control-Plane Obligations"], gate_rows)}
            """
        ),
    )

    write_text(
        EVIDENCE_MD,
        textwrap.dedent(
            f"""
            # Phase 0 Evidence Pack Index

            ## Freshness Summary

            - Artifact rows: `{evidence_index["summary"]["artifact_count"]}`
            - Current: `{evidence_index["summary"]["current_count"]}`
            - Missing: `{evidence_index["summary"]["missing_count"]}`
            - Contradictions: `{evidence_index["summary"]["contradiction_count"]}`

            ## Evidence Table

            {render_table(["Artifact Ref", "Class", "Task", "Freshness", "Path"], evidence_rows)}
            """
        ),
    )

    write_text(
        RUNBOOK_MD,
        textwrap.dedent(
            f"""
            # Phase 0 Foundation Gate Runbook

            1. Rebuild this pack with `python3 tools/analysis/build_phase0_gate_cockpit.py`.
            2. Validate with `python3 tools/analysis/validate_phase0_foundation_gate.py`.
            3. Check the primary entry verdict in `data/analysis/phase0_gate_verdict.json`.
            4. If the verdict is `withheld`, clear every `blocked` row in `data/analysis/phase0_gate_blockers.csv` before re-running.
            5. Keep deferred Phase 7 artifacts out of the current-baseline proof chain unless an explicit waiver is added.
            6. Treat the `GATE_P0_PARALLEL_FOUNDATION_OPEN` row as the control point for release/publication/trust/continuity tuple law before parallel implementation opens.
            7. Treat the `GATE_P0_EXIT` row as the point where HSM signing and alert-destination warnings become hard obligations.
            """
        ),
    )


def build_sequence_diagram() -> str:
    return textwrap.dedent(
        """
        flowchart LR
            PLAN["Planning freeze 001-020"]
            EXT["External readiness gate\\nGATE_EXTERNAL_TO_FOUNDATION"]
            HOLD["Phase 0 entry withheld\\nuntil external gate clears"]
            A0["0A Delivery skeleton"]
            B0["0B Domain kernel"]
            C0["0C Runtime publication"]
            D0["0D Control governors"]
            E0["0E Verification and simulators"]
            PAR["Parallel foundation open"]
            F0["0F Seed shells and synthetic flow"]
            G0["0G Assurance closeout"]
            EXIT["Phase 0 exit"]

            PLAN --> EXT
            EXT -->|"currently blocked"| HOLD
            EXT -->|"when approved"| A0
            A0 --> B0 --> C0 --> D0 --> E0 --> PAR --> F0 --> G0 --> EXIT
        """
    ).strip()


def build_html_payload(
    criteria: list[CriterionResult],
    blockers: list[BlockerRow],
    evidence_index: dict[str, Any],
    gate_map: list[GateMapRow],
    verdict_payload: dict[str, Any],
) -> dict[str, Any]:
    criteria_payload = [row.to_csv_row() for row in criteria]
    blocker_payload = [row.to_csv_row() for row in blockers]
    gate_payload = [row.to_csv_row() for row in gate_map]
    for row in criteria_payload:
        row["class_label"] = CLASS_LABELS[row["criterion_class"]]
    return {
        "visualMode": VISUAL_MODE,
        "generatedAt": verdict_payload["generated_at"],
        "summary": verdict_payload["summary"],
        "planningReadiness": verdict_payload["planning_readiness"],
        "entryGate": verdict_payload["gate_verdicts"][0],
        "criteria": criteria_payload,
        "blockers": blocker_payload,
        "evidence": evidence_index["artifacts"],
        "gateMap": gate_payload,
        "classOrder": CLASS_ORDER,
        "classLabels": CLASS_LABELS,
    }


HTML_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Phase 0 Foundation Gate Cockpit</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='6' y='6' width='52' height='52' rx='16' fill='%23335CFF'/%3E%3Cpath d='M18 20 L32 44 L46 20' stroke='white' stroke-width='7' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E">
  <style>
    :root {
      --canvas: #F5F7FA;
      --shell: #FFFFFF;
      --inset: #EEF2F6;
      --text-strong: #101828;
      --text-default: #1D2939;
      --text-muted: #475467;
      --border-subtle: #E4E7EC;
      --border-default: #D0D5DD;
      --ready: #0F9D58;
      --conditional: #C98900;
      --blocked: #C24141;
      --gate: #335CFF;
      --evidence: #6E59D9;
      --focus: #335CFF;
      --shadow: 0 10px 30px rgba(16, 24, 40, 0.08);
      --radius: 18px;
      --row-radius: 14px;
      --max-width: 1440px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--canvas); color: var(--text-default); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { min-height: 100vh; }
    a { color: inherit; }
    button, select {
      font: inherit;
    }
    button {
      cursor: pointer;
      background: transparent;
      border: 0;
      color: inherit;
      text-align: left;
    }
    select {
      min-height: 44px;
      border-radius: 12px;
      border: 1px solid var(--border-default);
      background: var(--shell);
      padding: 0 12px;
      color: var(--text-default);
    }
    :focus-visible {
      outline: 2px solid var(--focus);
      outline-offset: 2px;
    }
    .app {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 24px;
      display: grid;
      gap: 24px;
    }
    .banner {
      background: linear-gradient(140deg, rgba(51, 92, 255, 0.10), rgba(110, 89, 217, 0.08), rgba(255,255,255,0.9));
      border: 1px solid var(--border-default);
      border-radius: 24px;
      box-shadow: var(--shadow);
      padding: 24px;
      display: grid;
      gap: 16px;
    }
    .banner-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .wordmark {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-strong);
    }
    .wordmark svg { width: 40px; height: 40px; }
    .banner h1 {
      margin: 0;
      font-size: clamp(1.8rem, 3vw, 2.6rem);
      line-height: 1.05;
      color: var(--text-strong);
    }
    .banner p {
      margin: 0;
      max-width: 70ch;
      color: var(--text-muted);
      font-size: 0.98rem;
      line-height: 1.6;
    }
    .summary-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .summary-card {
      background: rgba(255,255,255,0.82);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 14px 16px;
      min-height: 94px;
      display: grid;
      gap: 4px;
    }
    .summary-label {
      font-size: 0.77rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-strong);
    }
    .status-chip {
      height: 28px;
      padding: 0 12px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .status-pass, .verdict-approved { background: rgba(15, 157, 88, 0.14); color: var(--ready); }
    .status-review_required, .verdict-conditional { background: rgba(201, 137, 0, 0.14); color: var(--conditional); }
    .status-blocked, .verdict-withheld { background: rgba(194, 65, 65, 0.12); color: var(--blocked); }
    .shell-grid {
      display: grid;
      grid-template-columns: 296px minmax(0, 1fr) minmax(320px, 400px);
      gap: 24px;
      align-items: start;
    }
    .panel {
      background: var(--shell);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .panel-header {
      padding: 18px 18px 12px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      background: linear-gradient(180deg, rgba(245, 247, 250, 0.9), rgba(255,255,255,0.96));
    }
    .panel-title {
      margin: 0;
      font-size: 0.96rem;
      font-weight: 700;
      color: var(--text-strong);
    }
    .rail {
      padding: 12px;
      display: grid;
      gap: 12px;
      max-height: calc(100vh - 220px);
      overflow: auto;
    }
    .rail-group {
      display: grid;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      background: var(--inset);
    }
    .rail-group h3 {
      margin: 0;
      font-size: 0.84rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .rail-button {
      padding: 12px;
      border: 1px solid transparent;
      border-radius: 14px;
      background: rgba(255,255,255,0.85);
      display: grid;
      gap: 8px;
      transition: transform 120ms ease, border-color 120ms ease, box-shadow 180ms ease;
    }
    .rail-button:hover {
      transform: translateY(-1px);
      border-color: var(--border-default);
    }
    .rail-button[aria-pressed="true"] {
      border-color: rgba(51, 92, 255, 0.4);
      box-shadow: 0 0 0 3px rgba(51, 92, 255, 0.10);
    }
    .rail-button strong {
      color: var(--text-strong);
      font-size: 0.93rem;
      line-height: 1.35;
    }
    .rail-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .main-column {
      display: grid;
      gap: 24px;
    }
    .toolbar {
      padding: 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--shell);
    }
    .toolbar label {
      display: grid;
      gap: 6px;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .table-wrap {
      padding: 12px 18px 18px;
      overflow: auto;
      min-height: 420px;
    }
    .table-wrap.blockers { min-height: 320px; }
    .table-wrap.evidence { min-height: 320px; }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 10px;
      min-width: 760px;
    }
    th {
      text-align: left;
      color: var(--text-muted);
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0 12px 4px;
    }
    td {
      padding: 14px 12px;
      background: var(--inset);
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: top;
      line-height: 1.5;
      font-size: 0.92rem;
    }
    td:first-child {
      border-left: 1px solid var(--border-subtle);
      border-top-left-radius: var(--row-radius);
      border-bottom-left-radius: var(--row-radius);
    }
    td:last-child {
      border-right: 1px solid var(--border-subtle);
      border-top-right-radius: var(--row-radius);
      border-bottom-right-radius: var(--row-radius);
    }
    .row-button {
      display: grid;
      gap: 6px;
      width: 100%;
      color: var(--text-default);
    }
    .row-button strong {
      color: var(--text-strong);
      font-size: 0.94rem;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 0.82rem;
    }
    .subgrid {
      display: grid;
      gap: 24px;
      grid-template-columns: 1fr 1fr;
    }
    .inspector {
      position: sticky;
      top: 24px;
      min-height: 760px;
    }
    .inspector-body {
      padding: 18px;
      display: grid;
      gap: 16px;
    }
    .inspector-card {
      padding: 14px;
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      background: var(--inset);
      display: grid;
      gap: 10px;
    }
    .inspector-card h3 {
      margin: 0;
      font-size: 1rem;
      color: var(--text-strong);
    }
    .kv {
      display: grid;
      gap: 8px;
    }
    .kv div {
      display: grid;
      gap: 4px;
    }
    .kv span {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .kv strong {
      color: var(--text-strong);
      font-weight: 600;
      line-height: 1.5;
    }
    ul.meta-list {
      margin: 0;
      padding-left: 18px;
      color: var(--text-default);
    }
    @media (max-width: 1180px) {
      .shell-grid { grid-template-columns: 260px minmax(0, 1fr); }
      .inspector { grid-column: 1 / -1; position: static; min-height: 0; }
    }
    @media (max-width: 860px) {
      .app { padding: 16px; }
      .summary-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .shell-grid { grid-template-columns: 1fr; }
      .subgrid { grid-template-columns: 1fr; }
      .rail { max-height: none; }
      .table-wrap, .table-wrap.blockers, .table-wrap.evidence { min-height: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <section class="banner verdict-withheld" data-testid="gate-verdict-banner" data-verdict="withheld">
      <div class="banner-top">
        <div>
          <div class="wordmark" aria-label="Vecells">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <rect x="6" y="6" width="52" height="52" rx="16" fill="#335CFF"></rect>
              <path d="M18 20 L32 44 L46 20" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
            </svg>
            <span>Vecells Foundation Gate</span>
          </div>
          <h1 id="banner-title">Phase 0 Foundation Gate</h1>
        </div>
        <div class="status-chip verdict-withheld" id="banner-verdict">Withheld</div>
      </div>
      <p id="banner-reason"></p>
      <div class="summary-strip">
        <div class="summary-card">
          <div class="summary-label">Blocking Rows</div>
          <div class="summary-value" id="summary-blocking">0</div>
          <div class="summary-label">Exact blockers still preventing entry</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Warning Rows</div>
          <div class="summary-value" id="summary-warning">0</div>
          <div class="summary-label">Bounded later obligations already called out</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Evidence Freshness</div>
          <div class="summary-value" id="summary-evidence">0</div>
          <div class="summary-label">Current artifacts in the evidence pack</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Planning State</div>
          <div class="summary-value mono" id="summary-planning"></div>
          <div class="summary-label">Planning gate foundation is separate from 0A entry</div>
        </div>
      </div>
    </section>

    <div class="shell-grid">
      <aside class="panel" data-testid="criteria-rail">
        <div class="panel-header">
          <h2 class="panel-title">Criteria Rail</h2>
          <span class="mono" id="criteria-count"></span>
        </div>
        <div class="rail" id="criteria-rail-body"></div>
      </aside>

      <main class="main-column">
        <section class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Readiness Matrix</h2>
            <div class="status-chip" id="matrix-status-chip">Filtered</div>
          </div>
          <div class="toolbar">
            <label>
              Criterion Class
              <select id="class-filter" aria-label="Filter by criterion class"></select>
            </label>
            <label>
              Status
              <select id="status-filter" aria-label="Filter by criterion status"></select>
            </label>
          </div>
          <div class="table-wrap" data-testid="readiness-matrix">
            <table>
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Tasks / Risks</th>
                  <th>Evidence / Notes</th>
                </tr>
              </thead>
              <tbody id="criteria-table-body"></tbody>
            </table>
          </div>
        </section>

        <div class="subgrid">
          <section class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Blockers</h2>
              <span class="mono" id="blocker-count"></span>
            </div>
            <div class="table-wrap blockers" data-testid="blocker-table">
              <table>
                <thead>
                  <tr>
                    <th>Blocker</th>
                    <th>State</th>
                    <th>Severity</th>
                    <th>Summary</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="blocker-table-body"></tbody>
              </table>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Evidence Index</h2>
              <span class="mono" id="evidence-count"></span>
            </div>
            <div class="table-wrap evidence" data-testid="evidence-index-table">
              <table>
                <thead>
                  <tr>
                    <th>Artifact</th>
                    <th>Class</th>
                    <th>Task</th>
                    <th>Freshness</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody id="evidence-table-body"></tbody>
              </table>
            </div>
          </section>
        </div>

        <section class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Subphase Gate Map</h2>
            <span class="mono" id="gate-count"></span>
          </div>
          <div class="table-wrap evidence" data-testid="subphase-gate-map">
            <table>
              <thead>
                <tr>
                  <th>Gate</th>
                  <th>Scope</th>
                  <th>Verdict</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Control-Plane Obligations</th>
                </tr>
              </thead>
              <tbody id="gate-table-body"></tbody>
            </table>
          </div>
        </section>
      </main>

      <aside class="panel inspector" data-testid="gate-inspector">
        <div class="panel-header">
          <h2 class="panel-title">Inspector</h2>
          <span class="mono" id="inspector-kind">criterion</span>
        </div>
        <div class="inspector-body" id="inspector-body"></div>
      </aside>
    </div>
  </div>

  <script id="gate-data" type="application/json">%%DATA_JSON%%</script>
  <script>
    const data = JSON.parse(document.getElementById("gate-data").textContent);
    const state = {
      classFilter: "all",
      statusFilter: "all",
      selectedKind: "criterion",
      selectedId: null,
    };

    const ids = {
      classFilter: document.getElementById("class-filter"),
      statusFilter: document.getElementById("status-filter"),
      criteriaRailBody: document.getElementById("criteria-rail-body"),
      criteriaTableBody: document.getElementById("criteria-table-body"),
      blockerTableBody: document.getElementById("blocker-table-body"),
      evidenceTableBody: document.getElementById("evidence-table-body"),
      gateTableBody: document.getElementById("gate-table-body"),
      inspectorBody: document.getElementById("inspector-body"),
      inspectorKind: document.getElementById("inspector-kind"),
      bannerVerdict: document.getElementById("banner-verdict"),
      bannerReason: document.getElementById("banner-reason"),
      summaryBlocking: document.getElementById("summary-blocking"),
      summaryWarning: document.getElementById("summary-warning"),
      summaryEvidence: document.getElementById("summary-evidence"),
      summaryPlanning: document.getElementById("summary-planning"),
      criteriaCount: document.getElementById("criteria-count"),
      blockerCount: document.getElementById("blocker-count"),
      evidenceCount: document.getElementById("evidence-count"),
      gateCount: document.getElementById("gate-count"),
      matrixStatusChip: document.getElementById("matrix-status-chip"),
    };

    function statusLabel(status) {
      if (status === "review_required") return "Review Required";
      if (status === "pass") return "Pass";
      if (status === "blocked") return "Blocked";
      return status;
    }

    function verdictLabel(verdict) {
      if (verdict === "approved") return "Approved";
      if (verdict === "conditional") return "Conditional";
      if (verdict === "withheld") return "Withheld";
      return verdict;
    }

    function option(label, value) {
      const el = document.createElement("option");
      el.value = value;
      el.textContent = label;
      return el;
    }

    function parseList(value) {
      try {
        return JSON.parse(value || "[]");
      } catch (error) {
        return [];
      }
    }

    function filterCriteria() {
      return data.criteria.filter((row) => {
        const classMatch = state.classFilter === "all" || row.criterion_class === state.classFilter;
        const statusMatch = state.statusFilter === "all" || row.status === state.statusFilter;
        return classMatch && statusMatch;
      });
    }

    function relatedArtifactRefs(criteriaRows) {
      const refs = new Set();
      criteriaRows.forEach((row) => parseList(row.required_artifact_refs).forEach((ref) => refs.add(ref)));
      return refs;
    }

    function setSelection(kind, id) {
      state.selectedKind = kind;
      state.selectedId = id;
      render();
    }

    function fillFilters() {
      ids.classFilter.append(option("All classes", "all"));
      data.classOrder.forEach((key) => ids.classFilter.append(option(data.classLabels[key], key)));
      ids.statusFilter.append(option("All statuses", "all"));
      ["blocked", "review_required", "pass"].forEach((key) => ids.statusFilter.append(option(statusLabel(key), key)));
      ids.classFilter.addEventListener("change", (event) => {
        state.classFilter = event.target.value;
        ensureSelection();
        render();
      });
      ids.statusFilter.addEventListener("change", (event) => {
        state.statusFilter = event.target.value;
        ensureSelection();
        render();
      });
    }

    function ensureSelection() {
      const visible = filterCriteria();
      const validCriterion = state.selectedKind === "criterion" && visible.some((row) => row.criterion_id === state.selectedId);
      const validBlocker = state.selectedKind === "blocker" && data.blockers.some((row) => row.blocker_id === state.selectedId);
      const validEvidence = state.selectedKind === "evidence" && data.evidence.some((row) => row.artifact_ref === state.selectedId);
      const validGate = state.selectedKind === "gate" && data.gateMap.some((row) => row.gate_id === state.selectedId);
      if (!(validCriterion || validBlocker || validEvidence || validGate)) {
        state.selectedKind = "criterion";
        state.selectedId = visible[0] ? visible[0].criterion_id : data.criteria[0].criterion_id;
      }
    }

    function renderBanner() {
      ids.bannerVerdict.textContent = verdictLabel(data.entryGate.verdict);
      ids.bannerVerdict.className = "status-chip verdict-" + data.entryGate.verdict;
      document.querySelector('[data-testid="gate-verdict-banner"]').dataset.verdict = data.entryGate.verdict;
      document.querySelector('[data-testid="gate-verdict-banner"]').className = "banner verdict-" + data.entryGate.verdict;
      ids.bannerReason.textContent = data.entryGate.reason;
      ids.summaryBlocking.textContent = String(data.summary.blocking_row_count);
      ids.summaryWarning.textContent = String(data.summary.warning_row_count);
      ids.summaryEvidence.textContent = String(data.summary.evidence_current_count);
      ids.summaryPlanning.textContent = data.planningReadiness.state;
    }

    function renderRail() {
      const visible = filterCriteria();
      ids.criteriaRailBody.innerHTML = "";
      ids.criteriaCount.textContent = visible.length + " visible";
      data.classOrder.forEach((groupKey) => {
        const groupRows = visible.filter((row) => row.criterion_class === groupKey);
        if (!groupRows.length) return;
        const group = document.createElement("section");
        group.className = "rail-group";
        const title = document.createElement("h3");
        title.textContent = data.classLabels[groupKey];
        group.appendChild(title);
        groupRows.forEach((row) => {
          const button = document.createElement("button");
          button.className = "rail-button";
          button.dataset.criterionId = row.criterion_id;
          button.setAttribute("data-criterion-id", row.criterion_id);
          button.setAttribute("aria-pressed", String(state.selectedKind === "criterion" && state.selectedId === row.criterion_id));
          button.addEventListener("click", () => setSelection("criterion", row.criterion_id));
          const heading = document.createElement("strong");
          heading.textContent = row.criterion_title;
          const meta = document.createElement("div");
          meta.className = "rail-meta";
          const code = document.createElement("span");
          code.className = "mono";
          code.textContent = row.criterion_id;
          const chip = document.createElement("span");
          chip.className = "status-chip status-" + row.status;
          chip.textContent = statusLabel(row.status);
          meta.append(code, chip);
          button.append(heading, meta);
          group.appendChild(button);
        });
        ids.criteriaRailBody.appendChild(group);
      });
    }

    function renderCriteriaTable() {
      const visible = filterCriteria();
      ids.matrixStatusChip.textContent = statusLabel(state.statusFilter === "all" ? "pass" : state.statusFilter);
      ids.criteriaTableBody.innerHTML = "";
      visible.forEach((row) => {
        const tr = document.createElement("tr");
        tr.dataset.criterionId = row.criterion_id;
        tr.setAttribute("data-criterion-id", row.criterion_id);
        const tasks = parseList(row.required_task_refs);
        const risks = parseList(row.required_risk_refs);
        const artifacts = parseList(row.required_artifact_refs);
        tr.innerHTML = `
          <td>
            <button class="row-button" data-criterion-id="${row.criterion_id}">
              <strong>${row.criterion_title}</strong>
              <span class="mono">${row.criterion_id}</span>
            </button>
          </td>
          <td>${row.class_label}</td>
          <td><span class="status-chip status-${row.status}">${statusLabel(row.status)}</span></td>
          <td><span class="mono">${tasks.slice(0, 5).join(", ")}</span><br>${risks.slice(0, 3).join(", ")}</td>
          <td>${artifacts.join(", ")}<br>${row.notes}</td>
        `;
        tr.querySelector("button").addEventListener("click", () => setSelection("criterion", row.criterion_id));
        ids.criteriaTableBody.appendChild(tr);
      });
    }

    function renderBlockerTable() {
      const visibleCriteria = filterCriteria();
      const visibleCriterionIds = new Set(visibleCriteria.map((row) => row.criterion_id));
      const rows = data.blockers.filter((row) => visibleCriterionIds.has(row.criterion_id));
      ids.blockerTableBody.innerHTML = "";
      ids.blockerCount.textContent = rows.length + " rows";
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.dataset.blockerState = row.blocker_state;
        tr.setAttribute("data-blocker-state", row.blocker_state);
        tr.innerHTML = `
          <td>
            <button class="row-button">
              <strong>${row.summary}</strong>
              <span class="mono">${row.blocker_id}</span>
            </button>
          </td>
          <td><span class="status-chip status-${row.blocker_state === "warning" ? "review_required" : "blocked"}">${row.blocker_state}</span></td>
          <td>${row.severity}</td>
          <td>${row.summary}</td>
          <td>${row.required_action}</td>
        `;
        tr.querySelector("button").addEventListener("click", () => setSelection("blocker", row.blocker_id));
        ids.blockerTableBody.appendChild(tr);
      });
    }

    function renderEvidenceTable() {
      const refs = relatedArtifactRefs(filterCriteria());
      const rows = data.evidence.filter((row) => refs.has(row.artifact_ref));
      ids.evidenceTableBody.innerHTML = "";
      ids.evidenceCount.textContent = rows.length + " rows";
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.dataset.evidenceRef = row.artifact_ref;
        tr.setAttribute("data-evidence-ref", row.artifact_ref);
        tr.innerHTML = `
          <td>
            <button class="row-button" data-evidence-ref="${row.artifact_ref}">
              <strong>${row.title}</strong>
              <span class="mono">${row.artifact_ref}</span>
            </button>
          </td>
          <td>${row.artifact_class}</td>
          <td>${row.upstream_task_ref}</td>
          <td><span class="status-chip status-${row.freshness_state === "current" ? "pass" : "blocked"}">${row.freshness_state}</span></td>
          <td class="mono">${row.relative_path}</td>
        `;
        tr.querySelector("button").addEventListener("click", () => setSelection("evidence", row.artifact_ref));
        ids.evidenceTableBody.appendChild(tr);
      });
    }

    function renderGateTable() {
      ids.gateTableBody.innerHTML = "";
      ids.gateCount.textContent = data.gateMap.length + " gates";
      data.gateMap.forEach((row) => {
        const obligations = parseList(row.required_control_plane_obligations);
        const tr = document.createElement("tr");
        tr.dataset.verdict = row.current_verdict;
        tr.setAttribute("data-verdict", row.current_verdict);
        tr.innerHTML = `
          <td>
            <button class="row-button">
              <strong>${row.gate_title}</strong>
              <span class="mono">${row.gate_id}</span>
            </button>
          </td>
          <td>${row.scope}</td>
          <td><span class="status-chip verdict-${row.current_verdict}">${verdictLabel(row.current_verdict)}</span></td>
          <td class="mono">${row.predecessor_ref}</td>
          <td class="mono">${row.successor_ref}</td>
          <td>${obligations.join(", ")}</td>
        `;
        tr.querySelector("button").addEventListener("click", () => setSelection("gate", row.gate_id));
        ids.gateTableBody.appendChild(tr);
      });
    }

    function inspectorSection(label, value, mono = false) {
      const wrapper = document.createElement("div");
      const key = document.createElement("span");
      key.textContent = label;
      const val = document.createElement("strong");
      if (mono) val.className = "mono";
      val.textContent = value || "None";
      wrapper.append(key, val);
      return wrapper;
    }

    function renderInspector() {
      ids.inspectorBody.innerHTML = "";
      ids.inspectorKind.textContent = state.selectedKind;
      let payload = null;
      if (state.selectedKind === "criterion") {
        payload = data.criteria.find((row) => row.criterion_id === state.selectedId);
      } else if (state.selectedKind === "blocker") {
        payload = data.blockers.find((row) => row.blocker_id === state.selectedId);
      } else if (state.selectedKind === "evidence") {
        payload = data.evidence.find((row) => row.artifact_ref === state.selectedId);
      } else if (state.selectedKind === "gate") {
        payload = data.gateMap.find((row) => row.gate_id === state.selectedId);
      }
      if (!payload) return;

      const card = document.createElement("section");
      card.className = "inspector-card";
      const title = document.createElement("h3");
      title.textContent =
        payload.criterion_title ||
        payload.summary ||
        payload.title ||
        payload.gate_title ||
        payload.artifact_ref ||
        state.selectedId;
      card.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "kv";
      if (state.selectedKind === "criterion") {
        meta.append(
          inspectorSection("Criterion ID", payload.criterion_id, true),
          inspectorSection("Class", payload.class_label),
          inspectorSection("Status", statusLabel(payload.status)),
          inspectorSection("Auto Check", payload.auto_check_rule),
          inspectorSection("Manual Review", payload.manual_review_rule),
          inspectorSection("Blocker If Failed", payload.blocker_if_failed)
        );
        const list = document.createElement("ul");
        list.className = "meta-list";
        parseList(payload.required_artifact_refs).forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          list.appendChild(li);
        });
        card.appendChild(meta);
        card.appendChild(list);
      } else if (state.selectedKind === "blocker") {
        meta.append(
          inspectorSection("Blocker ID", payload.blocker_id, true),
          inspectorSection("State", payload.blocker_state),
          inspectorSection("Severity", payload.severity),
          inspectorSection("Action", payload.required_action),
          inspectorSection("Due Gate", payload.due_gate_ref, true),
          inspectorSection("Notes", payload.notes)
        );
        card.appendChild(meta);
      } else if (state.selectedKind === "evidence") {
        meta.append(
          inspectorSection("Artifact Ref", payload.artifact_ref, true),
          inspectorSection("Class", payload.artifact_class),
          inspectorSection("Task", payload.upstream_task_ref),
          inspectorSection("Freshness", payload.freshness_state),
          inspectorSection("Path", payload.relative_path, true),
          inspectorSection("Digest", payload.sha256, true)
        );
        card.appendChild(meta);
      } else if (state.selectedKind === "gate") {
        meta.append(
          inspectorSection("Gate ID", payload.gate_id, true),
          inspectorSection("Scope", payload.scope),
          inspectorSection("Verdict", verdictLabel(payload.current_verdict)),
          inspectorSection("Blocking Rule", payload.blocking_rule),
          inspectorSection("Owner", payload.gate_owner_role),
          inspectorSection("Notes", payload.notes)
        );
        const list = document.createElement("ul");
        list.className = "meta-list";
        parseList(payload.required_control_plane_obligations).forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          list.appendChild(li);
        });
        card.appendChild(meta);
        card.appendChild(list);
      }
      ids.inspectorBody.appendChild(card);
    }

    function render() {
      renderBanner();
      renderRail();
      renderCriteriaTable();
      renderBlockerTable();
      renderEvidenceTable();
      renderGateTable();
      renderInspector();
    }

    fillFilters();
    ensureSelection();
    render();
  </script>
</body>
</html>
"""


def write_html(payload: dict[str, Any], verdict: str) -> None:
    data_json = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/")
    html = HTML_TEMPLATE.replace("%%DATA_JSON%%", data_json).replace('data-verdict="withheld"', f'data-verdict="{verdict}"')
    write_text(COCKPIT_HTML, html)


def write_outputs(
    context: dict[str, Any],
    criteria: list[CriterionResult],
    blockers: list[BlockerRow],
    evidence_index: dict[str, Any],
    gate_map: list[GateMapRow],
    verdict_payload: dict[str, Any],
) -> None:
    write_csv(ENTRY_MATRIX_CSV, [row.to_csv_row() for row in criteria])
    write_csv(BLOCKERS_CSV, [row.to_csv_row() for row in blockers])
    write_json(EVIDENCE_JSON, evidence_index)
    write_json(VERDICT_JSON, verdict_payload)
    write_csv(SUBPHASE_GATE_CSV, [row.to_csv_row() for row in gate_map])
    build_docs(context, criteria, blockers, evidence_index, gate_map, verdict_payload)
    write_text(SEQUENCE_MMD, build_sequence_diagram())
    write_html(build_html_payload(criteria, blockers, evidence_index, gate_map, verdict_payload), verdict_payload["gate_verdicts"][0]["verdict"])


def main() -> None:
    context = build_context()
    evidence_index = build_evidence_index(context)
    criteria = build_criteria(context, evidence_index)
    blockers = build_blockers(context, criteria)
    gate_map = build_gate_map(context, criteria)
    verdict_payload = build_gate_verdicts(context, criteria, blockers, gate_map, evidence_index)
    write_outputs(context, criteria, blockers, evidence_index, gate_map, verdict_payload)


if __name__ == "__main__":
    main()
