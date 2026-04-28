#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
import textwrap
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
PROMPT_DIR = ROOT / "prompt"
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "analysis"

CHECKLIST_PATH = PROMPT_DIR / "checklist.md"

REQUIRED_INPUTS = {
    "requirement_registry": DATA_DIR / "requirement_registry.jsonl",
    "canonical_aliases": DATA_DIR / "canonical_term_aliases.json",
    "scope_boundary": DATA_DIR / "product_scope_matrix.json",
    "persona_catalog": DATA_DIR / "persona_catalog.json",
    "channel_inventory": DATA_DIR / "channel_inventory.json",
    "request_lineage": DATA_DIR / "request_lineage_transitions.json",
    "object_catalog": DATA_DIR / "object_catalog.json",
    "state_machines": DATA_DIR / "state_machines.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "regulatory_workstreams": DATA_DIR / "regulatory_workstreams.json",
    "field_sensitivity_catalog": DATA_DIR / "field_sensitivity_catalog.json",
    "runtime_topology": DATA_DIR / "runtime_workload_families.json",
    "workspace_graph": DATA_DIR / "workspace_package_graph.json",
    "backend_runtime": DATA_DIR / "service_runtime_matrix.csv",
    "frontend_stack": DATA_DIR / "frontend_stack_scorecard.csv",
    "tooling_scorecard": DATA_DIR / "tooling_scorecard.csv",
    "adr_index": DATA_DIR / "adr_index.json",
    "programme_milestones": DATA_DIR / "programme_milestones.json",
    "task_to_milestone_map": DATA_DIR / "task_to_milestone_map.csv",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "risk_task_links": DATA_DIR / "risk_task_links.csv",
    "summary_reconciliation": DATA_DIR / "summary_reconciliation_matrix.csv",
    "conformance_seed": DATA_DIR / "cross_phase_conformance_seed.json",
}

TRACEABILITY_MAP_MD = DOCS_DIR / "19_requirement_to_task_traceability_map.md"
TRACEABILITY_RULES_MD = DOCS_DIR / "19_traceability_rules_and_coverage_model.md"
TRACEABILITY_GAP_MD = DOCS_DIR / "19_requirement_coverage_gap_report.md"
TRACEABILITY_LOG_MD = DOCS_DIR / "19_traceability_decision_log.md"
TRACEABILITY_EXPLORER_HTML = DOCS_DIR / "19_traceability_explorer.html"

REQ_TASK_CSV = DATA_DIR / "requirement_task_traceability.csv"
TASK_REQ_CSV = DATA_DIR / "task_requirement_traceability.csv"
COVERAGE_SUMMARY_JSON = DATA_DIR / "coverage_summary.json"
ORPHAN_REQUIREMENTS_CSV = DATA_DIR / "orphan_requirements.csv"
ORPHAN_TASKS_CSV = DATA_DIR / "orphan_tasks.csv"
COVERAGE_BY_PHASE_CSV = DATA_DIR / "coverage_by_phase.csv"
COVERAGE_BY_DOMAIN_CSV = DATA_DIR / "coverage_by_domain.csv"

CHECKLIST_PATTERN = re.compile(r"- \[(.| )\] ((seq|par)_(\d{3})_(.+?)) \(prompt/(\d+)\.md\)$")
NON_ALNUM = re.compile(r"[^a-z0-9]+")

MAPPING_TYPE_ORDER = [
    "define",
    "refine",
    "architecture_decision",
    "implement",
    "integrate",
    "frontend_surface",
    "test",
    "gate",
    "release",
    "assurance_evidence",
    "deferred_placeholder",
]

ROLE_ORDER = {role: index for index, role in enumerate(MAPPING_TYPE_ORDER)}

PHASE_SORT = {
    "planning": 0,
    "external_readiness": 1,
    "phase_0": 2,
    "phase_1": 3,
    "phase_2": 4,
    "cross_phase_controls": 5,
    "phase_3": 6,
    "phase_4": 7,
    "phase_5": 8,
    "phase_6": 9,
    "phase_7": 10,
    "phase_8": 11,
    "phase_9": 12,
    "programme_release": 13,
}

PHASE_ALIASES = {
    "planning": {"planning"},
    "phase_0": {"phase_0", "planning"},
    "phase_1": {"phase_1"},
    "phase_2": {"phase_2", "external_readiness"},
    "phase_3": {"phase_3", "cross_phase_controls"},
    "phase_4": {"phase_4"},
    "phase_5": {"phase_5"},
    "phase_6": {"phase_6"},
    "phase_7": {"phase_7"},
    "phase_8": {"phase_8"},
    "phase_9": {"phase_9", "programme_release"},
    "cross_phase": {"cross_phase_controls", "programme_release", "planning"},
    "external_readiness": {"external_readiness", "phase_2"},
}

SOURCE_PHASE_MAP = {
    "phase-0-": "phase_0",
    "phase-1-": "phase_1",
    "phase-2-": "phase_2",
    "phase-3-": "phase_3",
    "phase-4-": "phase_4",
    "phase-5-": "phase_5",
    "phase-6-": "phase_6",
    "phase-7-": "phase_7",
    "phase-8-": "phase_8",
    "phase-9-": "phase_9",
    "platform-runtime-and-release": "phase_0",
    "platform-frontend": "cross_phase",
    "patient-portal": "cross_phase",
    "patient-account-and-communications": "cross_phase",
    "staff-workspace": "cross_phase",
    "operations-console": "phase_9",
    "pharmacy-console": "phase_6",
    "governance-admin-console": "phase_9",
    "platform-admin-and-config": "phase_9",
    "callback-and-clinician-messaging-loop": "phase_3",
    "self-care-content-and-admin-resolution": "phase_3",
    "canonical-ui-contract-kernel": "cross_phase",
    "design-token-foundation": "cross_phase",
    "accessibility-and-content-system-contract": "cross_phase",
    "ux-quiet-clarity-redesign": "cross_phase",
    "phase-cards": "planning",
    "forensic-audit-findings": "cross_phase",
}

DOMAIN_KEYWORDS = {
    "identity": [
        "identity",
        "nhs login",
        "session",
        "linkage",
        "patient linkage",
        "pds",
        "trust contract",
        "access grant",
        "wrong patient",
        "telephony",
    ],
    "frontend": [
        "frontend",
        "shell",
        "route",
        "portal",
        "workspace",
        "console",
        "webview",
        "browser",
        "playwright",
        "ui",
        "journey",
        "page",
        "surface",
        "accessibility",
        "design contract",
    ],
    "runtime": [
        "runtime",
        "gateway",
        "event",
        "schema",
        "projection",
        "worker",
        "cache",
        "release candidate",
        "publication",
        "degradation",
        "backup",
        "restore",
        "topology",
        "trust zone",
    ],
    "assurance": [
        "assurance",
        "evidence",
        "safety",
        "privacy",
        "regulatory",
        "clinical risk",
        "audit",
        "retention",
        "resilience",
        "incident",
        "governance",
        "conformance",
        "threat model",
        "hazard",
    ],
    "triage": [
        "triage",
        "queue",
        "review",
        "duplicate",
        "more info",
        "callback",
        "clinician messaging",
        "admin resolution",
        "endpoint decision",
    ],
    "booking": [
        "booking",
        "slot",
        "provider capability",
        "reservation",
        "waitlist",
        "hold commit",
        "manage booking",
    ],
    "hub": [
        "network",
        "cross org",
        "enhanced access",
        "hub",
        "mesh",
        "acting context",
        "practice visibility",
        "candidate ranking",
    ],
    "pharmacy": [
        "pharmacy",
        "directory",
        "referral",
        "dispatch",
        "outcome reconciliation",
        "bounce back",
        "urgent return",
    ],
    "patient_portal": [
        "patient shell",
        "patient portal",
        "patient action",
        "track my request",
        "quiet home",
        "manage flows",
    ],
    "staff_workspace": [
        "workspace",
        "staff shell",
        "clinician",
        "ops shell",
        "governance shell",
        "pharmacy shell",
    ],
    "support": [
        "support",
        "repair",
        "handover",
        "rotas",
        "callback",
        "more info",
    ],
    "governance": [
        "governance",
        "tenant",
        "legal hold",
        "worm",
        "dependency hygiene",
        "break glass",
    ],
    "intake": [
        "intake",
        "submission",
        "questionnaire",
        "attachment",
        "malicious upload",
        "red flag",
    ],
    "operations": [
        "operations",
        "dashboard",
        "breach",
        "kpi",
        "heatmap",
        "control room",
        "slo",
        "sla",
    ],
    "cross_phase": [
        "crosscutting",
        "cross phase",
        "programme",
        "conformance",
        "release wave",
        "wave observation",
        "rollout",
        "launch",
    ],
    "safety": [
        "safety",
        "hazard",
        "dcb0129",
        "clinical risk",
    ],
}

ROLE_KEYWORDS = {
    "define": [
        "define",
        "map",
        "catalog",
        "inventory",
        "registry",
        "traceability",
        "document",
        "reconcile",
        "ingest",
        "rank required vs optional",
    ],
    "architecture_decision": [
        "freeze",
        "choose",
        "baseline",
        "strategy",
        "contract",
        "model",
        "topology",
        "boundary",
        "policy",
        "adr",
        "decision",
    ],
    "implement": [
        "implement",
        "build",
        "scaffold",
        "publish",
        "compile",
        "compiler",
        "runner",
        "service",
        "worker",
        "pipeline",
        "engine",
    ],
    "integrate": [
        "integrate",
        "external",
        "provision",
        "configure",
        "request",
        "select",
        "identify",
        "sandbox",
        "vendor",
        "provider",
        "mesh",
        "credential",
        "webhook",
    ],
    "frontend_surface": [
        "frontend",
        "shell",
        "route",
        "portal",
        "workspace",
        "console",
        "browser",
        "playwright",
        "journey",
        "page",
        "accessibility",
        "ui",
        "surface",
        "webview",
    ],
    "test": [
        "testing",
        "test ",
        "test users",
        "suite",
        "suites",
        "verify",
        "validation",
        "regression",
        "smoke",
        "rehearsal",
        "demonstration",
        "penetration",
        "visual regression",
        "user acceptance",
        "playwright",
    ],
    "gate": [
        "gate",
        "approve",
        "entry criteria",
        "signoff",
        "verdict",
        "merge ",
        "open parallel",
        "exit artifacts",
    ],
    "release": [
        "release",
        "promote",
        "wave",
        "rollout",
        "publication",
        "candidate",
        "go live",
        "launch",
        "canaries",
        "enable",
        "observation policy",
    ],
    "assurance_evidence": [
        "assurance",
        "evidence",
        "audit",
        "privacy",
        "regulatory",
        "clinical risk",
        "hazard",
        "runbook",
        "resilience",
        "incident",
        "governance",
        "archive",
        "lessons learned",
        "handover",
        "rotas",
    ],
    "deferred_placeholder": [
        "deferred",
        "phase7",
        "nhs app",
    ],
}

DEPENDENCY_ALIASES = {
    "dep_nhs_login_rail": ["nhs login", "oidc", "auth rail"],
    "dep_im1_pairing_programme": ["im1", "pairing"],
    "dep_pds_fhir_enrichment": ["pds", "demographic"],
    "dep_cross_org_secure_messaging_mesh": ["mesh", "secure messaging", "mailbox"],
    "dep_telephony_ivr_recording_provider": ["telephony", "ivr", "recording", "call session", "voice"],
    "dep_sms_notification_provider": ["sms", "text message", "notification provider", "notification delivery", "notification"],
    "dep_email_notification_provider": ["email", "mail"],
    "dep_transcription_processing_provider": ["transcription", "transcript"],
    "dep_malware_scanning_provider": ["malware", "scanning", "artifact scanning"],
    "dep_local_booking_supplier_adapter": ["booking provider", "slot supplier", "booking supplier"],
    "dep_principal_gp_supplier_paths": ["gp system", "supplier", "principal gp"],
    "dep_pharmacy_directory_provider": ["pharmacy directory", "pharmacy provider"],
}

BASE_DOMAIN_DEFAULTS = {
    "frontend": "seq_014",
    "runtime": "seq_013",
    "assurance": "seq_009",
    "identity": "seq_005",
    "triage": "seq_005",
    "booking": "seq_005",
    "hub": "seq_005",
    "pharmacy": "seq_005",
    "patient_portal": "seq_004",
    "staff_workspace": "seq_004",
    "support": "seq_004",
    "governance": "seq_009",
    "intake": "seq_005",
    "operations": "seq_009",
    "cross_phase": "seq_002",
    "safety": "seq_009",
}

SOURCE_PRECEDENCE = [
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "prompt/019.md",
    "prompt/shared_operating_contract_016_to_020.md",
    "data/analysis/requirement_registry.jsonl",
    "data/analysis/canonical_term_aliases.json",
    "data/analysis/object_catalog.json",
    "data/analysis/state_machines.json",
    "data/analysis/external_dependencies.json",
    "data/analysis/adr_index.json",
    "data/analysis/programme_milestones.json",
    "data/analysis/master_risk_register.json",
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open() as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: flatten_csv_value(row.get(key)) for key in fieldnames})


def flatten_csv_value(value: Any) -> str:
    if isinstance(value, list):
        return "|".join(str(item) for item in value)
    if value is None:
        return ""
    return str(value)


def slugify(value: str) -> str:
    return NON_ALNUM.sub("_", value.lower()).strip("_")


def normalize_text(value: str) -> str:
    return slugify(value).replace("_", " ")


def text_has_keyword(text: str, keyword: str) -> bool:
    if " " in keyword or "-" in keyword:
        return keyword in text
    return re.search(rf"\b{re.escape(keyword)}\b", text) is not None


def prompt_heading(path: Path) -> str:
    if not path.exists():
        return ""
    text = path.read_text()
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return ""


def list_from_pipe(value: str | None) -> list[str]:
    if not value:
        return []
    return [item for item in value.split("|") if item]


def normalize_requirement_domain(domain: str) -> str:
    domain = slugify(domain).replace("_", " ")
    domain = domain.replace("staff workspace", "staff_workspace")
    domain = domain.replace("patient portal", "patient_portal")
    if domain in {"safety", "privacy", "security", "content", "accessibility"}:
        return "assurance" if domain in {"content", "accessibility"} else domain
    return domain.replace(" ", "_")


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_019 prerequisites: " + ", ".join(sorted(missing)))
    return {
        "requirements": load_jsonl(REQUIRED_INPUTS["requirement_registry"]),
        "aliases": load_json(REQUIRED_INPUTS["canonical_aliases"]),
        "object_catalog": load_json(REQUIRED_INPUTS["object_catalog"]),
        "state_machines": load_json(REQUIRED_INPUTS["state_machines"]),
        "external_dependencies": load_json(REQUIRED_INPUTS["external_dependencies"]),
        "adr_index": load_json(REQUIRED_INPUTS["adr_index"]),
        "programme": load_json(REQUIRED_INPUTS["programme_milestones"]),
        "task_to_milestone": load_csv(REQUIRED_INPUTS["task_to_milestone_map"]),
        "risk_register": load_json(REQUIRED_INPUTS["master_risk_register"]),
        "risk_task_links": load_csv(REQUIRED_INPUTS["risk_task_links"]),
        "conformance_seed": load_json(REQUIRED_INPUTS["conformance_seed"]),
        "persona_catalog": load_json(REQUIRED_INPUTS["persona_catalog"]),
        "channel_inventory": load_json(REQUIRED_INPUTS["channel_inventory"]),
        "summary_reconciliation": load_csv(REQUIRED_INPUTS["summary_reconciliation"]),
    }


def build_task_catalog(task_rows: list[dict[str, str]]) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    milestone_by_task = {row["task_id"]: row for row in task_rows}
    tasks: list[dict[str, Any]] = []
    with CHECKLIST_PATH.open() as handle:
        for line in handle:
            match = CHECKLIST_PATTERN.match(line.strip())
            if not match:
                continue
            marker, slug, task_kind, ordinal, slug_tail, prompt_number = match.groups()
            task_id = f"{task_kind}_{ordinal}"
            milestone_row = milestone_by_task.get(task_id)
            assert_true(milestone_row is not None, f"Checklist task {task_id} missing from task_to_milestone_map.csv")
            prompt_path = ROOT / f"prompt/{prompt_number}.md"
            prompt_text = prompt_path.read_text() if prompt_path.exists() else ""
            heading = prompt_heading(prompt_path)
            title = milestone_row["task_title"]
            role_text = f"{title} {heading}".lower()
            searchable = f"{title} {heading} {prompt_text}".lower()
            task = {
                "task_id": task_id,
                "task_slug": slug,
                "task_order": int(ordinal),
                "task_kind": task_kind,
                "task_status": {"X": "complete", "-": "in_progress"}.get(marker, "not_started"),
                "task_title": title,
                "task_prompt_ref": milestone_row["task_prompt_ref"],
                "phase_ref": milestone_row["phase_ref"],
                "milestone_id": milestone_row["milestone_id"],
                "milestone_title": milestone_row["milestone_title"],
                "merge_gate_ref": milestone_row["merge_gate_ref"],
                "baseline_scope": milestone_row["baseline_scope"],
                "critical_path_state": milestone_row["critical_path_state"],
                "prompt_heading": heading,
                "prompt_state": "empty" if not prompt_text.strip() else "scoped",
                "prompt_size_bytes": len(prompt_text.encode("utf-8")),
                "role_text": role_text,
                "searchable_text": searchable,
            }
            task["roles"] = classify_task_roles(task)
            task["domain_tags"] = classify_task_domains(task)
            task["dependency_refs"] = infer_dependency_refs_from_text(task["role_text"])
            tasks.append(task)
    task_index = {task["task_id"]: task for task in tasks}
    return tasks, task_index


def classify_task_roles(task: dict[str, Any]) -> list[str]:
    text = task["role_text"]
    roles: set[str] = set()
    for role, keywords in ROLE_KEYWORDS.items():
        if any(text_has_keyword(text, keyword) for keyword in keywords):
            roles.add(role)
    if task["task_order"] <= 10:
        roles.update({"define"})
    if 11 <= task["task_order"] <= 16:
        roles.update({"architecture_decision"})
    if task["task_id"] in {"seq_017", "seq_018", "seq_019", "seq_020"}:
        roles.update({"gate", "assurance_evidence"})
    if task["phase_ref"] == "programme_release":
        roles.add("release")
    if task["baseline_scope"] == "deferred":
        roles.add("deferred_placeholder")
    if task["task_id"].startswith("par_") and "build" in text and "playwright" in text:
        roles.add("frontend_surface")
    if "exit gate approve" in text:
        roles.update({"gate", "release"})
    if "merge " in text and "playwright" in text:
        roles.update({"integrate", "test"})
    if not roles:
        roles.add("refine")
    if "define" in roles and task["phase_ref"] != "planning":
        roles.add("architecture_decision")
    return sorted(roles, key=lambda item: ROLE_ORDER.get(item, 99))


def classify_task_domains(task: dict[str, Any]) -> list[str]:
    text = task["role_text"]
    domains: set[str] = set()
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(text_has_keyword(text, keyword) for keyword in keywords):
            domains.add(domain)
    phase_ref = task["phase_ref"]
    if phase_ref == "phase_1":
        domains.update({"intake", "frontend"})
    elif phase_ref == "phase_2":
        domains.update({"identity"})
    elif phase_ref == "phase_3":
        domains.update({"triage", "staff_workspace"})
    elif phase_ref == "phase_4":
        domains.update({"booking"})
    elif phase_ref == "phase_5":
        domains.update({"hub"})
    elif phase_ref == "phase_6":
        domains.update({"pharmacy"})
    elif phase_ref == "phase_7":
        domains.update({"frontend", "patient_portal"})
    elif phase_ref == "phase_8":
        domains.update({"assurance"})
    elif phase_ref == "phase_9":
        domains.update({"assurance", "operations", "governance"})
    elif phase_ref == "phase_0":
        domains.update({"runtime"})
    elif phase_ref == "cross_phase_controls":
        domains.update({"cross_phase", "frontend"})
    elif phase_ref == "programme_release":
        domains.update({"cross_phase", "assurance"})
    if not domains:
        domains.add("cross_phase")
    return sorted(domains)


def infer_dependency_refs_from_text(text: str) -> list[str]:
    matches: list[str] = []
    for dependency_id, aliases in DEPENDENCY_ALIASES.items():
        if any(text_has_keyword(text, alias) for alias in aliases):
            matches.append(dependency_id)
    return sorted(set(matches))


def build_alias_lookup(payload: dict[str, Any]) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for row in payload.get("rows", []):
        lookup[slugify(row["alias"])] = row["preferred_term"]
    return lookup


def build_object_lookup(payload: dict[str, Any]) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for row in payload["objects"]:
        lookup[slugify(row["canonical_name"])] = row["object_id"]
        for alias in row.get("aliases", []):
            lookup.setdefault(slugify(alias), row["object_id"])
    return lookup


def build_state_machine_lookup(payload: dict[str, Any]) -> dict[str, list[str]]:
    lookup: dict[str, list[str]] = defaultdict(list)
    for row in payload["machines"]:
        lookup[slugify(row["canonical_name"])].append(row["machine_id"])
        lookup[slugify(row["owning_object_name"])].append(row["machine_id"])
    return dict(lookup)


def build_dependency_catalog(payload: dict[str, Any]) -> tuple[dict[str, dict[str, Any]], dict[str, str], dict[str, list[str]]]:
    dependency_index: dict[str, dict[str, Any]] = {}
    alias_lookup: dict[str, str] = {}
    task_links: dict[str, list[str]] = defaultdict(list)
    for row in payload["dependencies"]:
        dependency_index[row["dependency_id"]] = row
        alias_lookup[slugify(row["dependency_name"])] = row["dependency_id"]
        alias_lookup[slugify(row["dependency_id"])] = row["dependency_id"]
        for alias in DEPENDENCY_ALIASES.get(row["dependency_id"], []):
            alias_lookup[slugify(alias)] = row["dependency_id"]
        for task_ref in row.get("future_provisioning_task_refs", []):
            task_links[task_ref].append(row["dependency_id"])
        for task_ref in row.get("browser_automation_task_refs", []):
            task_links[task_ref].append(row["dependency_id"])
    return dependency_index, alias_lookup, {key: sorted(set(value)) for key, value in task_links.items()}


def derive_source_phase(source_file: str) -> str | None:
    lowered = source_file.lower()
    for needle, phase_ref in SOURCE_PHASE_MAP.items():
        if needle in lowered:
            return phase_ref
    return None


def derive_requirement_baseline(requirement: dict[str, Any], dependency_index: dict[str, dict[str, Any]]) -> str:
    phases = set(requirement["normalized_phases"])
    if "phase_7" in phases:
        return "deferred"
    lowered = requirement["search_text"]
    if "deferred" in lowered and "phase 7" in lowered:
        return "deferred"
    if "optional" in lowered:
        return "optional"
    dependency_scopes = {
        dependency_index[dependency_id]["baseline_scope"]
        for dependency_id in requirement["dependency_refs"]
        if dependency_id in dependency_index
    }
    if dependency_scopes and dependency_scopes.issubset({"optional_flagged", "future_optional"}):
        return "optional"
    return "current"


def enrich_requirements(
    rows: list[dict[str, Any]],
    object_lookup: dict[str, str],
    state_machine_lookup: dict[str, list[str]],
    dependency_alias_lookup: dict[str, str],
    dependency_index: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    enriched: list[dict[str, Any]] = []
    for row in rows:
        phases = [phase for phase in row.get("affected_phases", []) if phase]
        source_phase = derive_source_phase(row["source_file"])
        if source_phase and source_phase not in phases:
            phases.append(source_phase)
        normalized_phases = sorted(set(phases), key=lambda item: PHASE_SORT.get(item, 99))
        normalized_domains = sorted(
            {normalize_requirement_domain(domain) for domain in row.get("affected_domains", []) if domain}
        )
        if not normalized_domains:
            normalized_domains = ["cross_phase"]
        search_text = " ".join(
            [
                row["requirement_title"],
                row.get("direct_quote_or_precise_paraphrase", ""),
                row.get("expected_behavior", ""),
                row.get("failure_or_degraded_behavior", ""),
                row.get("source_heading_or_logical_block", ""),
                row.get("source_file", ""),
                " ".join(row.get("external_dependencies", [])),
                row.get("notes", ""),
            ]
        ).lower()
        object_refs: list[str] = []
        for value in row.get("primary_objects", []):
            object_refs.append(object_lookup.get(slugify(value), value))
        dependency_refs = sorted(
            {
                dependency_alias_lookup[token]
                for value in row.get("external_dependencies", [])
                for token in [slugify(value)]
                if token in dependency_alias_lookup
            }
        )
        if not dependency_refs:
            dependency_refs = infer_dependency_refs_from_text(search_text)
        state_refs: list[str] = []
        for object_ref in row.get("primary_objects", []):
            state_refs.extend(state_machine_lookup.get(slugify(object_ref), []))
        if row["requirement_id"].startswith("REQ-INV") or row["requirement_type"] in {"invariant", "state_machine"}:
            state_refs.append(row["requirement_id"])
        requirement = {
            **row,
            "normalized_phases": normalized_phases,
            "normalized_domains": normalized_domains,
            "search_text": search_text,
            "raw_external_dependency_labels": row.get("external_dependencies", []),
            "object_refs": sorted(set(object_refs)),
            "dependency_refs": sorted(set(dependency_refs)),
            "state_or_invariant_refs": sorted(set(state_refs)),
            "requirement_prefix": row["requirement_id"].split("-", 2)[1],
        }
        requirement["baseline_scope"] = derive_requirement_baseline(requirement, dependency_index)
        enriched.append(requirement)
    return enriched


def build_task_risk_index(rows: list[dict[str, str]]) -> dict[str, list[str]]:
    mapping: dict[str, list[str]] = defaultdict(list)
    for row in rows:
        mapping[row["task_id"]].append(row["risk_id"])
    return {task_id: sorted(set(risk_ids)) for task_id, risk_ids in mapping.items()}


def requirement_needs_frontend(requirement: dict[str, Any]) -> bool:
    if requirement["requirement_type"] in {"frontend", "accessibility", "content"}:
        return True
    if set(requirement["normalized_domains"]) & {"frontend", "patient_portal", "staff_workspace", "support", "governance", "operations", "intake"}:
        return True
    channels = set(requirement.get("channels", []))
    return bool(channels - {"cross_channel"})


def requirement_needs_assurance(requirement: dict[str, Any]) -> bool:
    if requirement["requirement_type"] in {"assurance", "privacy", "security", "accessibility", "content", "runtime_release"}:
        return True
    return bool(set(requirement["normalized_domains"]) & {"assurance", "governance", "operations", "safety"})


def requirement_needs_test(requirement: dict[str, Any]) -> bool:
    if requirement["requirement_type"] in {"test", "invariant", "state_machine", "runtime_release", "workflow"}:
        return True
    return requirement["requirement_prefix"] in {"TEST", "INV", "CTRL", "EDGE", "FINDING"}


def requirement_needs_release(requirement: dict[str, Any]) -> bool:
    text = requirement["search_text"]
    release_terms = [
        "release",
        "publication",
        "freeze",
        "continuity",
        "trust",
        "wave",
        "same shell",
        "writable",
        "route intent",
        "design contract",
    ]
    return any(term in text for term in release_terms)


def required_mapping_types(requirement: dict[str, Any]) -> list[str]:
    if requirement["baseline_scope"] == "deferred":
        roles = ["define", "architecture_decision", "deferred_placeholder", "gate"]
        if requirement_needs_test(requirement):
            roles.append("test")
        return roles
    roles = ["define", "architecture_decision", "implement"]
    if requirement["dependency_refs"] or requirement["raw_external_dependency_labels"] or requirement["normalized_domains"] and set(requirement["normalized_domains"]) & {"identity", "booking", "hub", "pharmacy"}:
        roles.append("integrate")
    if requirement_needs_frontend(requirement):
        roles.append("frontend_surface")
    if requirement_needs_test(requirement):
        roles.append("test")
    roles.append("gate")
    if requirement_needs_release(requirement):
        roles.append("release")
    if requirement_needs_assurance(requirement):
        roles.append("assurance_evidence")
    return [role for role in MAPPING_TYPE_ORDER if role in roles]


def allowed_task_phases(requirement: dict[str, Any], role: str) -> set[str]:
    allowed: set[str] = set()
    phases = set(requirement["normalized_phases"])
    if not phases:
        phases = {"cross_phase"}
    for phase in phases:
        allowed.update(PHASE_ALIASES.get(phase, {phase}))
    if role in {"define", "architecture_decision", "assurance_evidence", "gate"}:
        allowed.add("planning")
    if role in {"integrate", "test"} and requirement["dependency_refs"]:
        allowed.add("external_readiness")
    if role == "release":
        allowed.update({"programme_release", "cross_phase_controls", "phase_0"})
    if role == "deferred_placeholder":
        allowed.update({"planning", "phase_7", "programme_release"})
    return allowed


def choose_default_define_task(requirement: dict[str, Any]) -> str:
    if requirement["dependency_refs"]:
        return "seq_008"
    if requirement_needs_assurance(requirement):
        return "seq_009"
    if requirement_needs_frontend(requirement):
        return "seq_004"
    domain = requirement["normalized_domains"][0]
    return BASE_DOMAIN_DEFAULTS.get(domain, "seq_001")


def choose_default_arch_task(requirement: dict[str, Any]) -> str:
    if requirement["baseline_scope"] == "deferred":
        return "seq_016"
    if "frontend" in requirement["normalized_domains"]:
        return "seq_014"
    if "runtime" in requirement["normalized_domains"]:
        return "seq_013"
    if requirement_needs_assurance(requirement):
        return "seq_015"
    return "seq_016"


def match_score(task: dict[str, Any], requirement: dict[str, Any], role: str, task_dependency_refs: dict[str, list[str]]) -> int:
    score = 0
    if role in task["roles"]:
        score += 50
    elif role == "integrate" and {"implement", "test"} & set(task["roles"]):
        score += 18
    elif role == "release" and {"gate", "assurance_evidence"} & set(task["roles"]):
        score += 12
    elif role == "define" and "architecture_decision" in task["roles"]:
        score += 16

    if task["phase_ref"] in allowed_task_phases(requirement, role):
        score += 30
    if role == "define" and task["task_id"] == choose_default_define_task(requirement):
        score += 45
    if role == "architecture_decision" and task["task_id"] == choose_default_arch_task(requirement):
        score += 40

    domain_overlap = set(task["domain_tags"]) & set(requirement["normalized_domains"])
    score += min(24, len(domain_overlap) * 12)
    if not domain_overlap and "cross_phase" in task["domain_tags"]:
        score += 6

    if requirement["baseline_scope"] == "current":
        score += 12 if task["baseline_scope"] == "current" else -35
    elif requirement["baseline_scope"] == "deferred":
        if task["baseline_scope"] == "deferred":
            score += 18
        elif role == "deferred_placeholder":
            score += 8
        else:
            score -= 8
    elif requirement["baseline_scope"] == "optional":
        if task["baseline_scope"] == "optional":
            score += 18
        elif task["baseline_scope"] == "current":
            score += 6

    dependency_overlap = set(requirement["dependency_refs"]) & (set(task["dependency_refs"]) | set(task_dependency_refs.get(task["task_id"], [])))
    score += min(30, len(dependency_overlap) * 15)
    for label in requirement["raw_external_dependency_labels"]:
        if label.lower() in task["searchable_text"]:
            score += 8

    for object_ref in requirement["object_refs"]:
        token = slugify(object_ref.split("_", 1)[-1])
        if token and token.replace("_", " ") in task["searchable_text"]:
            score += 10

    for dependency_ref in requirement["dependency_refs"]:
        token = dependency_ref.replace("dep_", "").replace("_", " ")
        if token in task["searchable_text"]:
            score += 12

    if requirement["requirement_prefix"] == "INV" and role in {"test", "gate"}:
        score += 12
    if requirement["requirement_prefix"] == "TEST" and role == "test":
        score += 16
    if requirement["requirement_prefix"] == "OBJ" and role == "implement":
        score += 10
    if requirement["requirement_prefix"] == "FINDING" and role in {"gate", "assurance_evidence"}:
        score += 10

    if task["prompt_state"] == "empty":
        score -= 4
    if role == "define":
        score += max(0, 30 - task["task_order"] // 2)
    elif role == "architecture_decision":
        score += max(0, 24 - abs(task["task_order"] - 16))
    elif role in {"implement", "integrate", "frontend_surface"}:
        score += max(0, 12 - abs((task["task_order"] % 100) - 20))
    elif role in {"test", "gate", "release"}:
        score += max(0, 10 - abs((task["task_order"] % 100) - 70))
    return score


def primary_domain_for_mapping(task: dict[str, Any], requirement: dict[str, Any]) -> str:
    overlap = sorted(set(task["domain_tags"]) & set(requirement["normalized_domains"]))
    if overlap:
        return overlap[0]
    if requirement["normalized_domains"]:
        return requirement["normalized_domains"][0]
    return task["domain_tags"][0]


def determine_coverage_strength(score: int, task: dict[str, Any]) -> str:
    if task["prompt_state"] == "empty" and score < 75:
        return "partial"
    if score >= 100:
        return "direct"
    if score >= 75:
        return "supporting"
    if score >= 50:
        return "partial"
    return "inferred_gap_closure"


def select_best_task(
    tasks: list[dict[str, Any]],
    requirement: dict[str, Any],
    role: str,
    used_task_ids: set[str],
    task_dependency_refs: dict[str, list[str]],
) -> dict[str, Any] | None:
    candidates: list[tuple[int, int, dict[str, Any]]] = []
    for task in tasks:
        roles = set(task["roles"])
        if role == "implement" and "implement" not in roles:
            continue
        if role == "integrate" and "integrate" not in roles:
            linked_dependency_refs = set(task["dependency_refs"]) | set(task_dependency_refs.get(task["task_id"], []))
            dependency_overlap = linked_dependency_refs & set(requirement["dependency_refs"])
            raw_dependency_match = any(label.lower() in task["searchable_text"] for label in requirement["raw_external_dependency_labels"])
            if not (
                "implement" in roles
                and (dependency_overlap or raw_dependency_match or task["phase_ref"] in {"external_readiness", "phase_2", "phase_4", "phase_5", "phase_6"})
            ):
                continue
        if role == "frontend_surface" and "frontend_surface" not in roles:
            continue
        if role == "test" and "test" not in roles:
            continue
        if role == "gate" and "gate" not in roles:
            continue
        if role == "release" and "release" not in roles:
            continue
        if role == "assurance_evidence" and "assurance_evidence" not in roles:
            continue
        if role == "deferred_placeholder" and "deferred_placeholder" not in roles:
            continue
        if task["task_id"] in used_task_ids and role not in {"gate", "release", "assurance_evidence"}:
            continue
        score = match_score(task, requirement, role, task_dependency_refs)
        if score > 0:
            candidates.append((score, -task["task_order"], task))
    if not candidates:
        return None
    candidates.sort(reverse=True)
    return candidates[0][2]


def top_risk_refs(
    task_id: str,
    requirement: dict[str, Any],
    task_risk_index: dict[str, list[str]],
    risk_index: dict[str, dict[str, Any]],
) -> list[str]:
    ranked: list[tuple[int, str]] = []
    for risk_id in task_risk_index.get(task_id, []):
        risk = risk_index[risk_id]
        score = 0
        if set(risk.get("affected_dependency_refs", [])) & set(requirement["dependency_refs"]):
            score += 15
        if set(risk.get("affected_phase_refs", [])) & set(requirement["normalized_phases"]):
            score += 12
        if risk["risk_class"] in requirement["normalized_domains"]:
            score += 8
        if any(domain in risk["risk_title"].lower() for domain in requirement["normalized_domains"]):
            score += 6
        ranked.append((score, risk_id))
    ranked.sort(reverse=True)
    return [risk_id for _, risk_id in ranked[:5]]


def mapping_reason(requirement: dict[str, Any], task: dict[str, Any], role: str, score: int) -> str:
    fragments = []
    if task["phase_ref"] in allowed_task_phases(requirement, role):
        fragments.append(f"phase match via {task['phase_ref']}")
    overlap = sorted(set(task["domain_tags"]) & set(requirement["normalized_domains"]))
    if overlap:
        fragments.append("domain overlap " + ", ".join(overlap[:3]))
    dependency_overlap = sorted(set(task["dependency_refs"]) & set(requirement["dependency_refs"]))
    if dependency_overlap:
        fragments.append("dependency overlap " + ", ".join(dependency_overlap[:3]))
    if not fragments:
        fragments.append("fallback grounding from checklist title and phase family")
    fragments.append(f"score={score}")
    return "; ".join(fragments)


def build_mapping_rows(
    requirements: list[dict[str, Any]],
    tasks: list[dict[str, Any]],
    task_index: dict[str, dict[str, Any]],
    task_dependency_refs: dict[str, list[str]],
    task_risk_index: dict[str, list[str]],
    risk_index: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for requirement in requirements:
        used_task_ids: set[str] = set()
        for role in required_mapping_types(requirement):
            if role == "define":
                selected = task_index.get(choose_default_define_task(requirement))
            elif role == "architecture_decision":
                selected = task_index.get(choose_default_arch_task(requirement))
            else:
                selected = select_best_task(tasks, requirement, role, used_task_ids, task_dependency_refs)
            if selected is None:
                continue
            score = match_score(selected, requirement, role, task_dependency_refs)
            traceability_id = f"TRC-{requirement['requirement_id']}-{selected['task_id']}-{role}"
            traceability_id = traceability_id.replace("/", "_")
            if traceability_id in seen_ids:
                continue
            seen_ids.add(traceability_id)
            coverage_strength = determine_coverage_strength(score, selected)
            row = {
                "traceability_id": traceability_id,
                "requirement_id": requirement["requirement_id"],
                "task_id": selected["task_id"],
                "task_title": selected["task_title"],
                "task_prompt_ref": selected["task_prompt_ref"],
                "mapping_type": role,
                "coverage_strength": coverage_strength,
                "baseline_scope": requirement["baseline_scope"] if requirement["baseline_scope"] != "current" else selected["baseline_scope"],
                "phase_ref": selected["phase_ref"],
                "domain_ref": primary_domain_for_mapping(selected, requirement),
                "persona_refs": requirement.get("actors_personas", []),
                "channel_refs": requirement.get("channels", []),
                "object_refs": requirement["object_refs"],
                "state_or_invariant_refs": requirement["state_or_invariant_refs"],
                "dependency_refs": requirement["dependency_refs"],
                "risk_refs": top_risk_refs(selected["task_id"], requirement, task_risk_index, risk_index),
                "source_requirement_refs": [requirement["requirement_id"], *requirement.get("related_requirement_ids", [])],
                "reason": mapping_reason(requirement, selected, role, score),
                "notes": (
                    f"source={requirement['source_file']}; prompt_state={selected['prompt_state']}; "
                    f"requirement_prefix={requirement['requirement_prefix']}"
                ),
            }
            rows.append(row)
            used_task_ids.add(selected["task_id"])
    return rows


def best_requirements_for_task(task: dict[str, Any], requirements: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates: list[tuple[int, dict[str, Any]]] = []
    for requirement in requirements:
        score = 0
        if task["phase_ref"] in allowed_task_phases(requirement, "implement"):
            score += 25
        score += len(set(task["domain_tags"]) & set(requirement["normalized_domains"])) * 12
        score += len(set(task["dependency_refs"]) & set(requirement["dependency_refs"])) * 14
        if requirement["baseline_scope"] == task["baseline_scope"]:
            score += 8
        if any(keyword in requirement["search_text"] for keyword in task["task_title"].split()[:3]):
            score += 5
        if score > 0:
            candidates.append((score, requirement))
    candidates.sort(key=lambda item: (-item[0], item[1]["requirement_id"]))
    return [requirement for _, requirement in candidates[:3]]


def ground_orphan_tasks(
    rows: list[dict[str, Any]],
    tasks: list[dict[str, Any]],
    requirements: list[dict[str, Any]],
    task_risk_index: dict[str, list[str]],
) -> list[dict[str, Any]]:
    mapped_task_ids = {row["task_id"] for row in rows}
    risk_refs_fallback = {task_id: risk_ids[:5] for task_id, risk_ids in task_risk_index.items()}
    for task in tasks:
        if task["task_id"] in mapped_task_ids:
            continue
        matches = best_requirements_for_task(task, requirements)
        if not matches:
            matches = requirements[:1]
        mapping_type = next((role for role in ["gate", "test", "frontend_surface", "integrate", "implement", "define"] if role in task["roles"]), "refine")
        for requirement in matches[:1]:
            rows.append(
                {
                    "traceability_id": f"TRC-{requirement['requirement_id']}-{task['task_id']}-{mapping_type}-fallback",
                    "requirement_id": requirement["requirement_id"],
                    "task_id": task["task_id"],
                    "task_title": task["task_title"],
                    "task_prompt_ref": task["task_prompt_ref"],
                    "mapping_type": mapping_type,
                    "coverage_strength": "inferred_gap_closure",
                    "baseline_scope": requirement["baseline_scope"] if requirement["baseline_scope"] != "current" else task["baseline_scope"],
                    "phase_ref": task["phase_ref"],
                    "domain_ref": primary_domain_for_mapping(task, requirement),
                    "persona_refs": requirement.get("actors_personas", []),
                    "channel_refs": requirement.get("channels", []),
                    "object_refs": requirement["object_refs"],
                    "state_or_invariant_refs": requirement["state_or_invariant_refs"],
                    "dependency_refs": sorted(set(requirement["dependency_refs"]) | set(task["dependency_refs"])),
                    "risk_refs": risk_refs_fallback.get(task["task_id"], []),
                    "source_requirement_refs": [requirement["requirement_id"], *requirement.get("related_requirement_ids", [])],
                    "reason": "Fallback task grounding to prevent checklist drift without canonical anchors.",
                    "notes": f"fallback_grounding=yes; prompt_state={task['prompt_state']}",
                }
            )
    rows.sort(key=lambda row: (row["task_id"], row["requirement_id"], ROLE_ORDER.get(row["mapping_type"], 99), row["traceability_id"]))
    return rows


def requirement_gap_rows(
    requirements: list[dict[str, Any]],
    trace_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    rows_by_requirement: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in trace_rows:
        rows_by_requirement[row["requirement_id"]].append(row)
    gaps: list[dict[str, Any]] = []
    for requirement in requirements:
        covered_roles = {row["mapping_type"] for row in rows_by_requirement[requirement["requirement_id"]]}
        required_roles = set(required_mapping_types(requirement))
        missing_roles = sorted(required_roles - covered_roles, key=lambda item: ROLE_ORDER.get(item, 99))
        if missing_roles:
            gaps.append(
                {
                    "requirement_id": requirement["requirement_id"],
                    "requirement_title": requirement["requirement_title"],
                    "baseline_scope": requirement["baseline_scope"],
                    "phase_refs": requirement["normalized_phases"],
                    "domain_refs": requirement["normalized_domains"],
                    "gap_state": "missing_" + "_".join(missing_roles),
                    "missing_mapping_types": missing_roles,
                    "notes": f"required_roles={','.join(sorted(required_roles))}; covered_roles={','.join(sorted(covered_roles))}",
                }
            )
        elif requirement["baseline_scope"] == "deferred":
            roles = {row["mapping_type"] for row in rows_by_requirement[requirement["requirement_id"]]}
            if roles == {"define", "architecture_decision", "deferred_placeholder", "gate"} or roles == {"define", "architecture_decision", "deferred_placeholder", "gate", "test"}:
                gaps.append(
                    {
                        "requirement_id": requirement["requirement_id"],
                        "requirement_title": requirement["requirement_title"],
                        "baseline_scope": requirement["baseline_scope"],
                        "phase_refs": requirement["normalized_phases"],
                        "domain_refs": requirement["normalized_domains"],
                        "gap_state": "deferred_only",
                        "missing_mapping_types": [],
                        "notes": "Deferred requirement remains represented through deferred placeholder coverage only, by design.",
                    }
                )
    return gaps


def task_summary_rows(tasks: list[dict[str, Any]], trace_rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    rows_by_task: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in trace_rows:
        rows_by_task[row["task_id"]].append(row)
    summaries: list[dict[str, Any]] = []
    orphan_rows: list[dict[str, Any]] = []
    for task in tasks:
        mapped = rows_by_task.get(task["task_id"], [])
        requirement_ids = {row["requirement_id"] for row in mapped}
        direct_requirement_count = len({row["requirement_id"] for row in mapped if row["coverage_strength"] == "direct"})
        orphan_state = "none"
        notes = []
        if not mapped:
            orphan_state = "ungrounded"
            notes.append("No requirement mappings were generated for this task.")
        elif all(row["coverage_strength"] in {"partial", "inferred_gap_closure"} for row in mapped) or task["prompt_state"] == "empty":
            orphan_state = "weakly_grounded"
            if task["prompt_state"] == "empty":
                notes.append("Prompt file is currently empty; title-level grounding only.")
            else:
                notes.append("Mappings are indirect and should be revisited when the prompt spec is enriched.")
        summary = {
            "task_id": task["task_id"],
            "task_title": task["task_title"],
            "total_requirement_count": len(requirement_ids),
            "direct_requirement_count": direct_requirement_count,
            "test_requirement_count": len({row["requirement_id"] for row in mapped if row["mapping_type"] == "test"}),
            "gate_requirement_count": len({row["requirement_id"] for row in mapped if row["mapping_type"] == "gate"}),
            "assurance_requirement_count": len({row["requirement_id"] for row in mapped if row["mapping_type"] == "assurance_evidence"}),
            "orphan_state": orphan_state,
            "notes": "; ".join(notes) if notes else "",
        }
        summaries.append(summary)
        if orphan_state != "none":
            orphan_rows.append(
                {
                    "task_id": task["task_id"],
                    "task_title": task["task_title"],
                    "phase_ref": task["phase_ref"],
                    "baseline_scope": task["baseline_scope"],
                    "orphan_state": orphan_state,
                    "notes": summary["notes"] or "Task was mapped, but the grounding strength stayed weak.",
                }
            )
    return summaries, orphan_rows


def coverage_rows_by_dimension(
    requirements: list[dict[str, Any]],
    trace_rows: list[dict[str, Any]],
    dimension: str,
) -> list[dict[str, Any]]:
    rows_by_requirement: dict[str, list[dict[str, Any]]] = defaultdict(list)
    requirement_index = {row["requirement_id"]: row for row in requirements}
    for row in trace_rows:
        rows_by_requirement[row["requirement_id"]].append(row)
    bucketed: dict[str, dict[str, Any]] = {}
    for requirement in requirements:
        if dimension == "phase":
            keys = requirement["normalized_phases"] or ["cross_phase"]
            label_field = "phase_ref"
        else:
            keys = requirement["normalized_domains"] or ["cross_phase"]
            label_field = "domain_ref"
        requirement_rows = rows_by_requirement[requirement["requirement_id"]]
        covered_roles = {row["mapping_type"] for row in requirement_rows}
        for key in keys:
            bucket = bucketed.setdefault(
                key,
                {
                    label_field: key,
                    "requirement_count": 0,
                    "mapping_row_count": 0,
                    "task_count": 0,
                    "direct_count": 0,
                    "test_requirement_count": 0,
                    "gate_requirement_count": 0,
                    "assurance_requirement_count": 0,
                    "missing_implement_count": 0,
                    "missing_test_count": 0,
                    "deferred_requirement_count": 0,
                },
            )
            bucket["requirement_count"] += 1
            bucket["mapping_row_count"] += len(requirement_rows)
            bucket["task_count"] += len({row["task_id"] for row in requirement_rows})
            bucket["direct_count"] += len({row["traceability_id"] for row in requirement_rows if row["coverage_strength"] == "direct"})
            bucket["test_requirement_count"] += 1 if "test" in covered_roles else 0
            bucket["gate_requirement_count"] += 1 if "gate" in covered_roles else 0
            bucket["assurance_requirement_count"] += 1 if "assurance_evidence" in covered_roles else 0
            bucket["missing_implement_count"] += 1 if "implement" not in covered_roles else 0
            bucket["missing_test_count"] += 1 if requirement_needs_test(requirement) and "test" not in covered_roles else 0
            bucket["deferred_requirement_count"] += 1 if requirement["baseline_scope"] == "deferred" else 0
    return sorted(bucketed.values(), key=lambda row: row.get("phase_ref") or row.get("domain_ref"))


def build_requirement_summary(requirements: list[dict[str, Any]], trace_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows_by_requirement: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in trace_rows:
        rows_by_requirement[row["requirement_id"]].append(row)
    summaries: list[dict[str, Any]] = []
    for requirement in requirements:
        rows = rows_by_requirement[requirement["requirement_id"]]
        summaries.append(
            {
                "requirement_id": requirement["requirement_id"],
                "requirement_title": requirement["requirement_title"],
                "baseline_scope": requirement["baseline_scope"],
                "phase_refs": requirement["normalized_phases"],
                "domain_refs": requirement["normalized_domains"],
                "mapping_types": sorted({row["mapping_type"] for row in rows}, key=lambda item: ROLE_ORDER.get(item, 99)),
                "task_ids": sorted({row["task_id"] for row in rows}),
                "risk_refs": sorted({risk_id for row in rows for risk_id in row["risk_refs"]}),
                "missing_mapping_types": sorted(set(required_mapping_types(requirement)) - {row["mapping_type"] for row in rows}, key=lambda item: ROLE_ORDER.get(item, 99)),
            }
        )
    return summaries


def build_coverage_summary(
    requirements: list[dict[str, Any]],
    tasks: list[dict[str, Any]],
    trace_rows: list[dict[str, Any]],
    gap_rows: list[dict[str, Any]],
    task_summaries: list[dict[str, Any]],
    phase_rows: list[dict[str, Any]],
    domain_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    requirement_summaries = build_requirement_summary(requirements, trace_rows)
    mapping_type_counts = Counter(row["mapping_type"] for row in trace_rows)
    strength_counts = Counter(row["coverage_strength"] for row in trace_rows)
    baseline_counts = Counter(row["baseline_scope"] for row in trace_rows)
    current_requirements = [row for row in requirement_summaries if row["baseline_scope"] == "current"]
    deferred_requirements = [row for row in requirement_summaries if row["baseline_scope"] == "deferred"]
    coverage = {
        "coverage_id": "seq_019_traceability_coverage",
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "requirement_count": len(requirements),
            "task_count": len(tasks),
            "traceability_row_count": len(trace_rows),
            "requirements_with_full_chain_count": sum(1 for row in requirement_summaries if not row["missing_mapping_types"]),
            "requirements_with_gaps_count": len({row["requirement_id"] for row in gap_rows if row["gap_state"] != "deferred_only"}),
            "deferred_only_requirement_count": len([row for row in gap_rows if row["gap_state"] == "deferred_only"]),
            "task_weak_or_orphan_count": sum(1 for row in task_summaries if row["orphan_state"] != "none"),
            "current_requirement_count": len(current_requirements),
            "deferred_requirement_count": len(deferred_requirements),
        },
        "mapping_type_counts": dict(mapping_type_counts),
        "coverage_strength_counts": dict(strength_counts),
        "baseline_scope_counts": dict(baseline_counts),
        "phase_summary": phase_rows,
        "domain_summary": domain_rows,
        "requirement_summaries": requirement_summaries,
        "task_summaries": task_summaries,
        "gap_rows": gap_rows,
    }
    return coverage


def write_markdown_outputs(
    coverage: dict[str, Any],
    gap_rows: list[dict[str, Any]],
    orphan_tasks: list[dict[str, Any]],
    phase_rows: list[dict[str, Any]],
    domain_rows: list[dict[str, Any]],
) -> None:
    summary = coverage["summary"]
    TRACEABILITY_MAP_MD.write_text(
        textwrap.dedent(
            f"""\
# Requirement To Task Traceability Map

## Summary

- Canonical requirements: {summary['requirement_count']}
- Roadmap tasks: {summary['task_count']}
- Traceability rows: {summary['traceability_row_count']}
- Full-chain requirements: {summary['requirements_with_full_chain_count']}
- Requirements with explicit gaps: {summary['requirements_with_gaps_count']}
- Deferred-only requirements: {summary['deferred_only_requirement_count']}
- Weakly grounded or orphan task summaries: {summary['task_weak_or_orphan_count']}

## Mapping Ontology

The traceability model treats `prompt/checklist.md` as the only live task universe, anchors every row back to a canonical requirement from task 001, and uses deterministic mapping types to distinguish definition, architecture freeze, implementation, integration, verification, gating, release, and assurance evidence work.

## Coverage Highlights

{bullet_list([f"{key}: {value}" for key, value in sorted(coverage['mapping_type_counts'].items())])}

## Phase Coverage Snapshot

| Phase | Requirements | Rows | Tasks | Missing Implement | Missing Test |
| --- | ---: | ---: | ---: | ---: | ---: |
{table_lines(phase_rows, ['phase_ref', 'requirement_count', 'mapping_row_count', 'task_count', 'missing_implement_count', 'missing_test_count'])}

## Domain Coverage Snapshot

| Domain | Requirements | Rows | Tasks | Missing Implement | Missing Test |
| --- | ---: | ---: | ---: | ---: | ---: |
{table_lines(domain_rows, ['domain_ref', 'requirement_count', 'mapping_row_count', 'task_count', 'missing_implement_count', 'missing_test_count'])}
"""
        )
    )

    TRACEABILITY_RULES_MD.write_text(
        textwrap.dedent(
            """\
            # Traceability Rules And Coverage Model

            ## Deterministic Inputs

            The explorer consumes the requirement registry, checklist-backed task inventory, milestone graph, ADR set, state and object atlases, external dependency inventory, and seq_018 risk posture. No trace row is created from checklist prose alone.

            ## Coverage Rules

            - Every requirement gets at least one trace row.
            - Invariants and test obligations must carry `test` or `gate` coverage.
            - Deferred Phase 7 requirements stay on deferred scope rows and are represented through `deferred_placeholder` coverage until their deferred implementation tasks become active.
            - External-dependency requirements prefer inventory, provisioning, simulator, configuration, and integration tasks before generic gates.
            - Frontend continuity, shell, route, accessibility, and writable-posture requirements must carry both surface and verification coverage.
            - Empty prompt files do not invalidate the roadmap task, but they downgrade grounding strength to `partial` or `inferred_gap_closure` and surface in the orphan-task export.

            ## Coverage Strength Semantics

            - `direct`: task title, phase, and domain all align with the requirement role.
            - `supporting`: task is an intended chain element, but the match is broader or shared.
            - `partial`: the task probably contributes, but the prompt spec or task title is still broad.
            - `inferred_gap_closure`: fallback mapping created to avoid ungrounded checklist drift.
            """
        )
    )

    TRACEABILITY_GAP_MD.write_text(
        textwrap.dedent(
            f"""\
            # Requirement Coverage Gap Report

            ## Requirement Gaps

            Total rows in `orphan_requirements.csv`: {len(gap_rows)}

            | Requirement | Scope | Gap State | Missing Mapping Types | Notes |
            | --- | --- | --- | --- | --- |
            {table_lines(gap_rows[:50], ['requirement_id', 'baseline_scope', 'gap_state', 'missing_mapping_types', 'notes'])}

            ## Weakly Grounded Tasks

            Total rows in `orphan_tasks.csv`: {len(orphan_tasks)}

            | Task | Phase | Scope | Orphan State | Notes |
            | --- | --- | --- | --- | --- |
            {table_lines(orphan_tasks[:50], ['task_id', 'phase_ref', 'baseline_scope', 'orphan_state', 'notes'])}
            """
        )
    )

    TRACEABILITY_LOG_MD.write_text(
        textwrap.dedent(
            """\
            # Traceability Decision Log

            ## Recorded Decisions

            - Task grounding uses `task_to_milestone_map.csv` as the authoritative task catalog because it already reconciles checklist order, milestone span, baseline scope, and gate attachment.
            - Requirement scope defaults to `current` unless the registry or source phase explicitly places it in deferred Phase 7 or optional dependency territory.
            - Empty prompt files are preserved as live roadmap entries. The generator does not invent prompt prose; it marks those tasks as weakly grounded where applicable.
            - Risk links are inherited from seq_018 task-risk associations first, then refined by dependency and phase overlap.
            - Deferred Phase 7 requirements are represented through placeholder rows without allowing those rows to count as current-baseline completion evidence.
            """
        )
    )


def bullet_list(items: list[str]) -> str:
    if not items:
        return "- None"
    return "\n".join(f"- {item}" for item in items)


def table_lines(rows: list[dict[str, Any]], fields: list[str]) -> str:
    if not rows:
        return "| _none_ | _none_ | _none_ | _none_ | _none_ | _none_ |" if len(fields) == 6 else ""
    lines = []
    for row in rows:
        parts = []
        for field in fields:
            value = row.get(field, "")
            if isinstance(value, list):
                value = ", ".join(str(item) for item in value) if value else "-"
            parts.append(str(value) if value != "" else "-")
        lines.append("| " + " | ".join(parts) + " |")
    return "\n".join(lines)


def explorer_payload(
    coverage: dict[str, Any],
    trace_rows: list[dict[str, Any]],
    tasks: list[dict[str, Any]],
    requirements: list[dict[str, Any]],
    orphan_tasks: list[dict[str, Any]],
    gap_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    requirement_cards = []
    for row in coverage["requirement_summaries"]:
        requirement_cards.append(
            {
                "requirement_id": row["requirement_id"],
                "requirement_title": next(req["requirement_title"] for req in requirements if req["requirement_id"] == row["requirement_id"]),
                "baseline_scope": row["baseline_scope"],
                "phase_refs": row["phase_refs"],
                "domain_refs": row["domain_refs"],
                "mapping_types": row["mapping_types"],
                "missing_mapping_types": row["missing_mapping_types"],
            }
        )
    task_cards = [
        {
            "task_id": task["task_id"],
            "task_title": task["task_title"],
            "phase_ref": task["phase_ref"],
            "baseline_scope": task["baseline_scope"],
            "roles": task["roles"],
            "domain_tags": task["domain_tags"],
            "prompt_state": task["prompt_state"],
        }
        for task in tasks
    ]
    return {
        "summary": coverage["summary"],
        "mapping_type_counts": coverage["mapping_type_counts"],
        "requirements": requirement_cards,
        "tasks": task_cards,
        "edges": trace_rows,
        "orphan_requirements": gap_rows,
        "orphan_tasks": orphan_tasks,
        "phase_summary": coverage["phase_summary"],
        "domain_summary": coverage["domain_summary"],
    }


def render_traceability_explorer(payload: dict[str, Any]) -> str:
    data_json = json.dumps(payload).replace("</", "<\\/")
    template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vecells Traceability Explorer</title>
  <link rel="icon" href="data:," />
  <style>
    :root {{
      color-scheme: light;
      --canvas: #F5F7FA;
      --shell: #FFFFFF;
      --inset: #EEF2F6;
      --text-strong: #101828;
      --text-default: #1D2939;
      --text-muted: #475467;
      --border-subtle: #E4E7EC;
      --border-default: #D0D5DD;
      --trace: #335CFF;
      --relation: #0F8B8D;
      --gate: #6E59D9;
      --warning: #C98900;
      --critical: #C24141;
      --shadow: 0 18px 44px rgba(16, 24, 40, 0.08);
      --ring: 0 0 0 2px rgba(51, 92, 255, 0.18);
    }}
    * {{ box-sizing: border-box; }}
    html, body {{ margin: 0; padding: 0; background: var(--canvas); color: var(--text-default); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }}
    body {{ min-height: 100vh; }}
    button, select {{ font: inherit; }}
    .page {{ max-width: 1440px; margin: 0 auto; padding: 24px; display: grid; gap: 20px; }}
    .header {{
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,251,252,0.98));
      border: 1px solid var(--border-default);
      border-radius: 28px;
      padding: 24px;
      box-shadow: var(--shadow);
      display: grid;
      gap: 16px;
    }}
    .header-top {{ display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }}
    .brand {{ display: flex; gap: 14px; align-items: center; }}
    .brand svg {{ width: 48px; height: 48px; }}
    .brand h1 {{ margin: 0; font-size: 1.75rem; color: var(--text-strong); }}
    .brand p {{ margin: 2px 0 0; color: var(--text-muted); max-width: 840px; }}
    .chip-row, .summary-grid, .tab-strip, .selection-strip, .inspector-strip, .edge-meta {{ display: flex; flex-wrap: wrap; gap: 10px; }}
    .chip, .summary-pill, .tab-button {{
      min-height: 28px;
      border-radius: 999px;
      border: 1px solid var(--border-default);
      background: var(--inset);
      padding: 6px 10px;
      color: var(--text-default);
    }}
    .chip.trace, .summary-pill.trace {{ color: var(--trace); border-color: rgba(51, 92, 255, 0.28); }}
    .chip.relation {{ color: var(--relation); border-color: rgba(15, 139, 141, 0.28); }}
    .chip.gate {{ color: var(--gate); border-color: rgba(110, 89, 217, 0.28); }}
    .chip.warning {{ color: var(--warning); border-color: rgba(201, 137, 0, 0.28); }}
    .chip.critical {{ color: var(--critical); border-color: rgba(194, 65, 65, 0.28); }}
    .summary-grid {{ display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }}
    .summary-card {{
      background: var(--shell);
      border: 1px solid var(--border-subtle);
      border-radius: 18px;
      padding: 14px 16px;
    }}
    .summary-card strong {{ display: block; color: var(--text-strong); font-size: 1.3rem; }}
    .workspace {{ display: grid; grid-template-columns: 296px minmax(0, 1fr) minmax(320px, 400px); gap: 20px; align-items: start; }}
    .panel {{
      background: var(--shell);
      border: 1px solid var(--border-default);
      border-radius: 24px;
      box-shadow: var(--shadow);
    }}
    .panel-header {{ padding: 18px 20px 0; }}
    .panel-header h2 {{ margin: 0; color: var(--text-strong); font-size: 1.05rem; }}
    .panel-header p {{ margin: 6px 0 0; color: var(--text-muted); font-size: 0.9rem; }}
    .filter-rail {{ padding: 18px; display: grid; gap: 14px; position: sticky; top: 24px; }}
    .filter-rail label {{ display: grid; gap: 6px; color: var(--text-muted); font-size: 0.85rem; }}
    .filter-rail select {{ min-height: 44px; border-radius: 14px; border: 1px solid var(--border-default); padding: 0 12px; background: var(--shell); }}
    .center-stack {{ display: grid; gap: 20px; }}
    .graph-panel {{ min-height: 520px; }}
    .graph-canvas {{
      min-height: 520px;
      padding: 20px;
      display: grid;
      grid-template-columns: minmax(220px, 0.45fr) minmax(140px, 0.18fr) minmax(260px, 0.37fr);
      gap: 14px;
      align-items: start;
    }}
    .node-column {{ display: grid; gap: 10px; align-content: start; }}
    .node-card, .edge-card, .matrix-button, .list-button, .tab-button {{
      width: 100%;
      text-align: left;
      border-radius: 18px;
      border: 1px solid var(--border-default);
      background: var(--shell);
      padding: 14px;
      display: grid;
      gap: 6px;
      cursor: pointer;
      transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
    }}
    .node-card strong, .edge-card strong, .matrix-button strong, .list-button strong {{ color: var(--text-strong); }}
    .node-card code, .edge-card code, .matrix-button code, .inspector-body code {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.82rem; }}
    .edge-column {{ display: grid; gap: 10px; align-content: start; padding-top: 28px; }}
    .edge-card {{ background: linear-gradient(180deg, rgba(238, 242, 255, 0.92), rgba(240, 247, 247, 0.92)); }}
    .matrix-panel {{ min-height: 420px; }}
    .matrix-wrap {{ padding: 12px 16px 18px; overflow: auto; }}
    table {{ width: 100%; border-collapse: collapse; min-width: 1080px; }}
    th, td {{
      padding: 12px 10px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
      vertical-align: top;
      font-size: 0.9rem;
    }}
    th {{ color: var(--text-muted); font-weight: 600; }}
    .matrix-button {{ border: 0; background: transparent; padding: 0; border-radius: 0; box-shadow: none; }}
    .lower-panel {{ padding: 14px 16px 16px; display: grid; gap: 14px; }}
    .tab-button.active {{ border-color: rgba(51, 92, 255, 0.45); box-shadow: var(--ring); }}
    .tab-panel {{ display: none; gap: 10px; }}
    .tab-panel.active {{ display: grid; }}
    .list-grid {{ display: grid; gap: 10px; max-height: 360px; overflow: auto; }}
    .inspector {{ position: sticky; top: 24px; padding: 20px; display: grid; gap: 14px; min-height: 780px; }}
    .inspector h2 {{ margin: 0; color: var(--text-strong); }}
    .inspector p {{ margin: 0; color: var(--text-muted); }}
    .inspector-body {{ display: grid; gap: 12px; }}
    .detail-row {{
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      border-radius: 18px;
      background: var(--inset);
      border: 1px solid var(--border-subtle);
    }}
    .detail-row strong {{ color: var(--text-strong); }}
    .empty {{
      color: var(--text-muted);
      padding: 16px;
      border-radius: 18px;
      border: 1px dashed var(--border-default);
      background: var(--inset);
    }}
    .is-selected {{ border-color: rgba(51, 92, 255, 0.45) !important; box-shadow: var(--ring); transform: translateY(-1px); }}
    button:focus-visible, select:focus-visible {{
      outline: none;
      border-color: rgba(51, 92, 255, 0.45);
      box-shadow: var(--ring);
    }}
    @media (max-width: 1180px) {{
      .workspace {{ grid-template-columns: 1fr; }}
      .filter-rail, .inspector {{ position: relative; top: 0; min-height: auto; }}
    }}
    @media (max-width: 980px) {{
      .summary-grid {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
      .graph-canvas {{ grid-template-columns: 1fr; }}
      .edge-column {{ padding-top: 0; }}
    }}
    @media (max-width: 800px) {{
      .page {{ padding: 16px; }}
      .header-top {{ flex-direction: column; }}
      .summary-grid {{ grid-template-columns: 1fr; }}
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
    <section class="header">
      <div class="header-top">
        <div class="brand">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <rect x="4" y="4" width="40" height="40" rx="12" fill="#EEF2F6" stroke="#D0D5DD"></rect>
            <path d="M15 17h18v4H21v6h10v4H21v10h-6V17Z" fill="#335CFF"></path>
          </svg>
          <div>
            <h1>Traceability explorer</h1>
            <p>Lineage_Loom ties canonical requirements to the live checklist tasks that define, implement, verify, gate, release, and evidence them.</p>
          </div>
        </div>
        <div class="chip-row" id="summary-chips"></div>
      </div>
      <div class="summary-grid" id="summary-grid"></div>
    </section>

    <div class="workspace">
      <aside class="panel filter-rail" data-testid="trace-filter-rail">
        <label>Phase
          <select id="filter-phase">
            <option value="all">All phases</option>
          </select>
        </label>
        <label>Domain
          <select id="filter-domain">
            <option value="all">All domains</option>
          </select>
        </label>
        <label>Mapping type
          <select id="filter-mapping">
            <option value="all">All mapping types</option>
          </select>
        </label>
        <label>Baseline scope
          <select id="filter-scope">
            <option value="all">All baseline scopes</option>
          </select>
        </label>
        <div class="empty">Filter the matrix and graph together. Requirement rows, task rows, and edge cards all stay in parity under the same filter state.</div>
      </aside>

      <div class="center-stack">
        <section class="panel graph-panel">
          <div class="panel-header">
            <h2>Requirement-task graph</h2>
            <p>Select a requirement row, task row, or edge to pivot the graph. The graph always has table parity below.</p>
          </div>
          <div class="graph-canvas" id="graph-canvas" data-testid="trace-graph-canvas"></div>
        </section>

        <section class="panel matrix-panel">
          <div class="panel-header">
            <h2>Coverage matrix</h2>
            <p>Each row is one requirement-to-task mapping. Buttons on both sides open the same inspector as the graph.</p>
          </div>
          <div class="matrix-wrap">
            <table data-testid="trace-matrix-table">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Task</th>
                  <th>Mapping</th>
                  <th>Strength</th>
                  <th>Scope</th>
                  <th>Phase</th>
                  <th>Domain</th>
                </tr>
              </thead>
              <tbody id="matrix-body"></tbody>
            </table>
          </div>
        </section>

        <section class="panel lower-panel" data-testid="coverage-summary-panel">
          <div class="tab-strip">
            <button type="button" class="tab-button active" data-tab="orphan-reqs">Orphan requirements</button>
            <button type="button" class="tab-button" data-tab="orphan-tasks">Orphan tasks</button>
            <button type="button" class="tab-button" data-tab="coverage-summary">Coverage summaries</button>
          </div>
          <div class="tab-panel active" id="tab-orphan-reqs"></div>
          <div class="tab-panel" id="tab-orphan-tasks"></div>
          <div class="tab-panel" id="tab-coverage-summary"></div>
        </section>
      </div>

      <aside class="panel inspector" data-testid="trace-inspector">
        <h2>Inspector</h2>
        <p>Open the inspector from a requirement row, task row, or graph edge.</p>
        <div class="inspector-strip" id="inspector-strip"></div>
        <div class="inspector-body" id="inspector-body"></div>
      </aside>
    </div>
  </div>

  <script id="traceability-data" type="application/json">__TRACEABILITY_DATA__</script>
  <script>
    const DATA = JSON.parse(document.getElementById("traceability-data").textContent);
    const state = {{
      phase: "all",
      domain: "all",
      mapping: "all",
      scope: "all",
      selectedKind: "requirement",
      selectedRequirementId: DATA.requirements[0]?.requirement_id || "",
      selectedTaskId: "",
      selectedEdgeId: "",
      activeTab: "orphan-reqs",
    }};

    const dom = {{
      phase: document.getElementById("filter-phase"),
      domain: document.getElementById("filter-domain"),
      mapping: document.getElementById("filter-mapping"),
      scope: document.getElementById("filter-scope"),
      summaryChips: document.getElementById("summary-chips"),
      summaryGrid: document.getElementById("summary-grid"),
      graphCanvas: document.getElementById("graph-canvas"),
      matrixBody: document.getElementById("matrix-body"),
      inspectorStrip: document.getElementById("inspector-strip"),
      inspectorBody: document.getElementById("inspector-body"),
      orphanReqTab: document.getElementById("tab-orphan-reqs"),
      orphanTaskTab: document.getElementById("tab-orphan-tasks"),
      coverageTab: document.getElementById("tab-coverage-summary"),
    }};

    function uniqueValues(rows, getter) {{
      return Array.from(new Set(rows.map(getter).filter(Boolean))).sort();
    }}

    function initFilters() {{
      uniqueValues(DATA.edges, row => row.phase_ref).forEach(value => appendOption(dom.phase, value));
      uniqueValues(DATA.edges, row => row.domain_ref).forEach(value => appendOption(dom.domain, value));
      uniqueValues(DATA.edges, row => row.mapping_type).forEach(value => appendOption(dom.mapping, value));
      uniqueValues(DATA.edges, row => row.baseline_scope).forEach(value => appendOption(dom.scope, value));
      [dom.phase, dom.domain, dom.mapping, dom.scope].forEach(select => {{
        select.addEventListener("change", () => {{
          state.phase = dom.phase.value;
          state.domain = dom.domain.value;
          state.mapping = dom.mapping.value;
          state.scope = dom.scope.value;
          render();
        }});
      }});
      document.querySelectorAll(".tab-button").forEach(button => {{
        button.addEventListener("click", () => {{
          state.activeTab = button.dataset.tab;
          renderTabs();
        }});
      }});
    }}

    function appendOption(select, value) {{
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }}

    function filteredEdges() {{
      return DATA.edges.filter(row => {{
        if (state.phase !== "all" && row.phase_ref !== state.phase) return false;
        if (state.domain !== "all" && row.domain_ref !== state.domain) return false;
        if (state.mapping !== "all" && row.mapping_type !== state.mapping) return false;
        if (state.scope !== "all" && row.baseline_scope !== state.scope) return false;
        return true;
      }});
    }}

    function selectedRequirement() {{
      return DATA.requirements.find(row => row.requirement_id === state.selectedRequirementId) || filteredRequirements()[0] || null;
    }}

    function selectedTask() {{
      return DATA.tasks.find(row => row.task_id === state.selectedTaskId) || null;
    }}

    function filteredRequirements() {{
      const ids = new Set(filteredEdges().map(row => row.requirement_id));
      return DATA.requirements.filter(row => ids.has(row.requirement_id));
    }}

    function filteredTasks() {{
      const ids = new Set(filteredEdges().map(row => row.task_id));
      return DATA.tasks.filter(row => ids.has(row.task_id));
    }}

    function syncSelectedState() {{
      document.querySelectorAll(".is-selected").forEach(node => node.classList.remove("is-selected"));
      if (state.selectedRequirementId) {{
        document.querySelectorAll(`[data-requirement-id="${CSS.escape(state.selectedRequirementId)}"]`).forEach(node => node.classList.add("is-selected"));
      }}
      if (state.selectedTaskId) {{
        document.querySelectorAll(`[data-task-id="${CSS.escape(state.selectedTaskId)}"]`).forEach(node => node.classList.add("is-selected"));
      }}
      if (state.selectedEdgeId) {{
        document.querySelectorAll(`[data-traceability-id="${CSS.escape(state.selectedEdgeId)}"]`).forEach(node => node.classList.add("is-selected"));
      }}
    }}

    function renderSummary() {{
      const edges = filteredEdges();
      const requirementCount = new Set(edges.map(row => row.requirement_id)).size;
      const taskCount = new Set(edges.map(row => row.task_id)).size;
      const gateCount = edges.filter(row => row.mapping_type === "gate").length;
      const weakCount = edges.filter(row => row.coverage_strength !== "direct").length;
      dom.summaryChips.innerHTML = `
        <span class="chip trace">visible requirements: ${requirementCount}</span>
        <span class="chip relation">visible tasks: ${taskCount}</span>
        <span class="chip gate">gate rows: ${gateCount}</span>
        <span class="chip warning">non-direct rows: ${weakCount}</span>
      `;
      dom.summaryGrid.innerHTML = [
        ["Trace rows", edges.length],
        ["Requirements", requirementCount],
        ["Tasks", taskCount],
        ["Gate mappings", gateCount],
      ].map(([label, value]) => `
        <div class="summary-card">
          <strong>${value}</strong>
          <span>${label}</span>
        </div>
      `).join("");
    }}

    function setSelection(kind, payload) {{
      state.selectedKind = kind;
      state.selectedRequirementId = payload.requirement_id || state.selectedRequirementId;
      state.selectedTaskId = payload.task_id || "";
      state.selectedEdgeId = payload.traceability_id || "";
      renderInspector();
      syncSelectedState();
    }}

    function renderGraph() {{
      const edges = filteredEdges();
      const requirement = selectedRequirement();
      if (!requirement) {{
        dom.graphCanvas.innerHTML = '<div class="empty">No requirement matches the current filter state.</div>';
        return;
      }}
      const requirementEdges = edges.filter(row => row.requirement_id === requirement.requirement_id).slice(0, 12);
      const taskIds = new Set(requirementEdges.map(row => row.task_id));
      const taskCards = DATA.tasks.filter(row => taskIds.has(row.task_id));
      dom.graphCanvas.innerHTML = `
        <div class="node-column">
          <button type="button" class="node-card" data-requirement-id="${requirement.requirement_id}">
            <strong>${escapeHtml(requirement.requirement_title)}</strong>
            <code>${requirement.requirement_id}</code>
            <div class="edge-meta">
              <span>${requirement.baseline_scope}</span>
              <span>${requirement.phase_refs.join(", ")}</span>
            </div>
          </button>
        </div>
        <div class="edge-column">
          ${requirementEdges.map(row => `
            <button
              type="button"
              class="edge-card"
              data-traceability-id="${row.traceability_id}"
              data-requirement-id="${row.requirement_id}"
              data-task-id="${row.task_id}"
              data-mapping-type="${row.mapping_type}"
              data-baseline-scope="${row.baseline_scope}"
              data-coverage-strength="${row.coverage_strength}"
            >
              <strong>${row.mapping_type}</strong>
              <code>${row.coverage_strength}</code>
              <span>${escapeHtml(row.reason)}</span>
            </button>
          `).join("") || '<div class="empty">No graph edges for the selected requirement.</div>'}
        </div>
        <div class="node-column">
          ${taskCards.map(task => `
            <button type="button" class="node-card" data-task-id="${task.task_id}">
              <strong>${escapeHtml(task.task_title)}</strong>
              <code>${task.task_id}</code>
              <div class="edge-meta">
                <span>${task.phase_ref}</span>
                <span>${task.baseline_scope}</span>
              </div>
            </button>
          `).join("")}
        </div>
      `;
      dom.graphCanvas.querySelectorAll("[data-requirement-id]").forEach(button => {{
        button.addEventListener("click", () => {{
          const requirementId = button.dataset.requirementId;
          setSelection("requirement", {{ requirement_id: requirementId }});
        }});
      }});
      dom.graphCanvas.querySelectorAll("[data-task-id]").forEach(button => {{
        button.addEventListener("click", () => {{
          const taskId = button.dataset.taskId;
          const requirementId = button.dataset.requirementId || requirement.requirement_id;
          setSelection("task", {{ requirement_id: requirementId, task_id: taskId }});
        }});
      }});
      dom.graphCanvas.querySelectorAll("[data-traceability-id]").forEach(button => {{
        button.addEventListener("click", () => {{
          setSelection("edge", {{
            requirement_id: button.dataset.requirementId,
            task_id: button.dataset.taskId,
            traceability_id: button.dataset.traceabilityId,
          }});
        }});
      }});
    }}

    function renderMatrix() {{
      const edges = filteredEdges().slice(0, 200);
      dom.matrixBody.innerHTML = edges.map(row => `
        <tr
          data-traceability-id="${row.traceability_id}"
          data-requirement-id="${row.requirement_id}"
          data-task-id="${row.task_id}"
          data-mapping-type="${row.mapping_type}"
          data-baseline-scope="${row.baseline_scope}"
          data-coverage-strength="${row.coverage_strength}"
        >
          <td>
            <button type="button" class="matrix-button" data-requirement-id="${row.requirement_id}">
              <strong>${escapeHtml(findRequirement(row.requirement_id)?.requirement_title || row.requirement_id)}</strong>
              <code>${row.requirement_id}</code>
            </button>
          </td>
          <td>
            <button type="button" class="matrix-button" data-task-id="${row.task_id}" data-requirement-id="${row.requirement_id}">
              <strong>${escapeHtml(row.task_title)}</strong>
              <code>${row.task_id}</code>
            </button>
          </td>
          <td>${row.mapping_type}</td>
          <td>${row.coverage_strength}</td>
          <td>${row.baseline_scope}</td>
          <td>${row.phase_ref}</td>
          <td>${row.domain_ref}</td>
        </tr>
      `).join("");
      dom.matrixBody.querySelectorAll("button[data-requirement-id]").forEach(button => {{
        button.addEventListener("click", () => {{
          if (button.dataset.taskId) {{
            setSelection("task", {{ requirement_id: button.dataset.requirementId, task_id: button.dataset.taskId }});
          }} else {{
            setSelection("requirement", {{ requirement_id: button.dataset.requirementId }});
          }}
        }});
      }});
      dom.matrixBody.querySelectorAll("tr[data-traceability-id]").forEach(row => {{
        row.addEventListener("dblclick", () => {{
          setSelection("edge", {{
            requirement_id: row.dataset.requirementId,
            task_id: row.dataset.taskId,
            traceability_id: row.dataset.traceabilityId,
          }});
        }});
      }});
    }}

    function renderTabs() {{
      document.querySelectorAll(".tab-button").forEach(button => {{
        button.classList.toggle("active", button.dataset.tab === state.activeTab);
      }});
      document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
      if (state.activeTab === "orphan-reqs") {{
        dom.orphanReqTab.classList.add("active");
      }} else if (state.activeTab === "orphan-tasks") {{
        dom.orphanTaskTab.classList.add("active");
      }} else {{
        dom.coverageTab.classList.add("active");
      }}
      dom.orphanReqTab.innerHTML = renderOrphanRequirements();
      dom.orphanTaskTab.innerHTML = renderOrphanTasks();
      dom.coverageTab.innerHTML = renderCoverageSummary();
      dom.orphanReqTab.querySelectorAll("[data-requirement-id]").forEach(button => {{
        button.addEventListener("click", () => setSelection("requirement", {{ requirement_id: button.dataset.requirementId }}));
      }});
      dom.orphanTaskTab.querySelectorAll("[data-task-id]").forEach(button => {{
        button.addEventListener("click", () => setSelection("task", {{ task_id: button.dataset.taskId }}));
      }});
    }}

    function renderOrphanRequirements() {{
      if (!DATA.orphan_requirements.length) {{
        return '<div class="empty">No orphan requirements or incomplete chains were detected.</div>';
      }}
      return `<div class="list-grid">${DATA.orphan_requirements.slice(0, 60).map(row => `
        <button type="button" class="list-button" data-requirement-id="${row.requirement_id}">
          <strong>${escapeHtml(findRequirement(row.requirement_id)?.requirement_title || row.requirement_id)}</strong>
          <code>${row.requirement_id}</code>
          <span>${row.gap_state}</span>
        </button>
      `).join("")}</div>`;
    }}

    function renderOrphanTasks() {{
      if (!DATA.orphan_tasks.length) {{
        return '<div class="empty">No orphan or weakly grounded tasks were detected.</div>';
      }}
      return `<div class="list-grid">${DATA.orphan_tasks.slice(0, 60).map(row => `
        <button type="button" class="list-button" data-task-id="${row.task_id}">
          <strong>${escapeHtml(row.task_title)}</strong>
          <code>${row.task_id}</code>
          <span>${row.orphan_state}</span>
        </button>
      `).join("")}</div>`;
    }}

    function renderCoverageSummary() {{
      const phaseRows = DATA.phase_summary.slice(0, 12).map(row => `
        <tr><td>${row.phase_ref}</td><td>${row.requirement_count}</td><td>${row.mapping_row_count}</td><td>${row.missing_implement_count}</td><td>${row.missing_test_count}</td></tr>
      `).join("");
      const domainRows = DATA.domain_summary.slice(0, 12).map(row => `
        <tr><td>${row.domain_ref}</td><td>${row.requirement_count}</td><td>${row.mapping_row_count}</td><td>${row.missing_implement_count}</td><td>${row.missing_test_count}</td></tr>
      `).join("");
      return `
        <div class="empty">Coverage summaries preserve list parity with the CSV outputs.</div>
        <table>
          <thead><tr><th>Phase</th><th>Requirements</th><th>Rows</th><th>Missing implement</th><th>Missing test</th></tr></thead>
          <tbody>${phaseRows}</tbody>
        </table>
        <table>
          <thead><tr><th>Domain</th><th>Requirements</th><th>Rows</th><th>Missing implement</th><th>Missing test</th></tr></thead>
          <tbody>${domainRows}</tbody>
        </table>
      `;
    }}

    function renderInspector() {{
      if (state.selectedKind === "task" && state.selectedTaskId) {{
        const task = findTask(state.selectedTaskId);
        const relatedEdges = filteredEdges().filter(row => row.task_id === state.selectedTaskId).slice(0, 12);
        dom.inspectorStrip.innerHTML = `
          <span class="summary-pill trace">${task.task_id}</span>
          <span class="summary-pill">${task.phase_ref}</span>
          <span class="summary-pill">${task.baseline_scope}</span>
        `;
        dom.inspectorBody.innerHTML = `
          <div class="detail-row"><strong>Task</strong><span>${escapeHtml(task.task_title)}</span></div>
          <div class="detail-row"><strong>Roles</strong><code>${task.roles.join(", ")}</code></div>
          <div class="detail-row"><strong>Domains</strong><code>${task.domain_tags.join(", ")}</code></div>
          <div class="detail-row"><strong>Prompt state</strong><span>${task.prompt_state}</span></div>
          <div class="detail-row"><strong>Linked requirements</strong><code>${relatedEdges.map(row => row.requirement_id).join(", ") || "-"}</code></div>
          <div class="detail-row"><strong>Linked mapping types</strong><code>${Array.from(new Set(relatedEdges.map(row => row.mapping_type))).join(", ") || "-"}</code></div>
        `;
      }} else if (state.selectedKind === "edge" && state.selectedEdgeId) {{
        const edge = DATA.edges.find(row => row.traceability_id === state.selectedEdgeId);
        if (!edge) {{
          dom.inspectorBody.innerHTML = '<div class="empty">No edge matches the current selection.</div>';
          return;
        }}
        dom.inspectorStrip.innerHTML = `
          <span class="summary-pill relation">${edge.traceability_id}</span>
          <span class="summary-pill">${edge.mapping_type}</span>
          <span class="summary-pill">${edge.coverage_strength}</span>
        `;
        dom.inspectorBody.innerHTML = `
          <div class="detail-row"><strong>Requirement</strong><code>${edge.requirement_id}</code></div>
          <div class="detail-row"><strong>Task</strong><code>${edge.task_id}</code></div>
          <div class="detail-row"><strong>Reason</strong><span>${escapeHtml(edge.reason)}</span></div>
          <div class="detail-row"><strong>Objects</strong><code>${edge.object_refs.join(", ") || "-"}</code></div>
          <div class="detail-row"><strong>State or invariants</strong><code>${edge.state_or_invariant_refs.join(", ") || "-"}</code></div>
          <div class="detail-row"><strong>Dependencies</strong><code>${edge.dependency_refs.join(", ") || "-"}</code></div>
          <div class="detail-row"><strong>Risks</strong><code>${edge.risk_refs.join(", ") || "-"}</code></div>
          <div class="detail-row"><strong>Notes</strong><span>${escapeHtml(edge.notes)}</span></div>
        `;
      }} else {{
        const requirement = selectedRequirement();
        if (!requirement) {{
          dom.inspectorBody.innerHTML = '<div class="empty">No requirement matches the current filter state.</div>';
          return;
        }}
        const relatedEdges = filteredEdges().filter(row => row.requirement_id === requirement.requirement_id);
        dom.inspectorStrip.innerHTML = `
          <span class="summary-pill trace">${requirement.requirement_id}</span>
          <span class="summary-pill">${requirement.baseline_scope}</span>
          <span class="summary-pill">${requirement.phase_refs.join(", ")}</span>
        `;
        dom.inspectorBody.innerHTML = `
          <div class="detail-row"><strong>Requirement</strong><span>${escapeHtml(requirement.requirement_title)}</span></div>
          <div class="detail-row"><strong>Domains</strong><code>${requirement.domain_refs.join(", ")}</code></div>
          <div class="detail-row"><strong>Mapping types</strong><code>${requirement.mapping_types.join(", ") || "-"}</code></div>
          <div class="detail-row"><strong>Missing mapping types</strong><code>${requirement.missing_mapping_types.join(", ") || "-"}</code></div>
          <div class="detail-row"><strong>Linked tasks</strong><code>${Array.from(new Set(relatedEdges.map(row => row.task_id))).join(", ") || "-"}</code></div>
          <div class="detail-row"><strong>Linked risks</strong><code>${Array.from(new Set(relatedEdges.flatMap(row => row.risk_refs))).join(", ") || "-"}</code></div>
        `;
      }}
      syncSelectedState();
    }}

    function findRequirement(requirementId) {{
      return DATA.requirements.find(row => row.requirement_id === requirementId) || null;
    }}

    function findTask(taskId) {{
      return DATA.tasks.find(row => row.task_id === taskId) || null;
    }}

    function escapeHtml(value) {{
      return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }}

    function render() {{
      const filteredReqs = filteredRequirements();
      if (!filteredReqs.find(row => row.requirement_id === state.selectedRequirementId)) {{
        state.selectedRequirementId = filteredReqs[0]?.requirement_id || "";
      }}
      renderSummary();
      renderGraph();
      renderMatrix();
      renderTabs();
      renderInspector();
    }}

    initFilters();
    render();
  </script>
</body>
</html>
"""
    template = template.replace("{{", "{").replace("}}", "}")
    return template.replace("__TRACEABILITY_DATA__", data_json)


def write_outputs(
    trace_rows: list[dict[str, Any]],
    task_summaries: list[dict[str, Any]],
    coverage: dict[str, Any],
    orphan_requirements: list[dict[str, Any]],
    orphan_tasks: list[dict[str, Any]],
    phase_rows: list[dict[str, Any]],
    domain_rows: list[dict[str, Any]],
    tasks: list[dict[str, Any]],
    requirements: list[dict[str, Any]],
) -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    write_csv(
        REQ_TASK_CSV,
        [
            "traceability_id",
            "requirement_id",
            "task_id",
            "task_title",
            "task_prompt_ref",
            "mapping_type",
            "coverage_strength",
            "baseline_scope",
            "phase_ref",
            "domain_ref",
            "persona_refs",
            "channel_refs",
            "object_refs",
            "state_or_invariant_refs",
            "dependency_refs",
            "risk_refs",
            "source_requirement_refs",
            "reason",
            "notes",
        ],
        trace_rows,
    )
    write_csv(
        TASK_REQ_CSV,
        [
            "task_id",
            "task_title",
            "total_requirement_count",
            "direct_requirement_count",
            "test_requirement_count",
            "gate_requirement_count",
            "assurance_requirement_count",
            "orphan_state",
            "notes",
        ],
        task_summaries,
    )
    write_csv(
        ORPHAN_REQUIREMENTS_CSV,
        [
            "requirement_id",
            "requirement_title",
            "baseline_scope",
            "phase_refs",
            "domain_refs",
            "gap_state",
            "missing_mapping_types",
            "notes",
        ],
        orphan_requirements,
    )
    write_csv(
        ORPHAN_TASKS_CSV,
        ["task_id", "task_title", "phase_ref", "baseline_scope", "orphan_state", "notes"],
        orphan_tasks,
    )
    write_csv(
        COVERAGE_BY_PHASE_CSV,
        [
            "phase_ref",
            "requirement_count",
            "mapping_row_count",
            "task_count",
            "direct_count",
            "test_requirement_count",
            "gate_requirement_count",
            "assurance_requirement_count",
            "missing_implement_count",
            "missing_test_count",
            "deferred_requirement_count",
        ],
        phase_rows,
    )
    write_csv(
        COVERAGE_BY_DOMAIN_CSV,
        [
            "domain_ref",
            "requirement_count",
            "mapping_row_count",
            "task_count",
            "direct_count",
            "test_requirement_count",
            "gate_requirement_count",
            "assurance_requirement_count",
            "missing_implement_count",
            "missing_test_count",
            "deferred_requirement_count",
        ],
        domain_rows,
    )
    COVERAGE_SUMMARY_JSON.write_text(json.dumps(coverage, indent=2))
    write_markdown_outputs(coverage, orphan_requirements, orphan_tasks, phase_rows, domain_rows)
    TRACEABILITY_EXPLORER_HTML.write_text(
        render_traceability_explorer(
            explorer_payload(coverage, trace_rows, tasks, requirements, orphan_tasks, orphan_requirements)
        )
    )


def main() -> None:
    inputs = ensure_inputs()
    tasks, task_index = build_task_catalog(inputs["task_to_milestone"])
    alias_lookup = build_alias_lookup(inputs["aliases"])
    object_lookup = build_object_lookup(inputs["object_catalog"])
    state_machine_lookup = build_state_machine_lookup(inputs["state_machines"])
    dependency_index, dependency_alias_lookup, task_dependency_refs = build_dependency_catalog(inputs["external_dependencies"])
    requirements = enrich_requirements(
        inputs["requirements"],
        object_lookup,
        state_machine_lookup,
        dependency_alias_lookup,
        dependency_index,
    )
    risk_index = {row["risk_id"]: row for row in inputs["risk_register"]["risks"]}
    task_risk_index = build_task_risk_index(inputs["risk_task_links"])
    trace_rows = build_mapping_rows(requirements, tasks, task_index, task_dependency_refs, task_risk_index, risk_index)
    trace_rows = ground_orphan_tasks(trace_rows, tasks, requirements, task_risk_index)
    task_summaries, orphan_tasks = task_summary_rows(tasks, trace_rows)
    orphan_requirements = requirement_gap_rows(requirements, trace_rows)
    phase_rows = coverage_rows_by_dimension(requirements, trace_rows, "phase")
    domain_rows = coverage_rows_by_dimension(requirements, trace_rows, "domain")
    coverage = build_coverage_summary(
        requirements,
        tasks,
        trace_rows,
        orphan_requirements,
        task_summaries,
        phase_rows,
        domain_rows,
    )
    write_outputs(
        trace_rows,
        task_summaries,
        coverage,
        orphan_requirements,
        orphan_tasks,
        phase_rows,
        domain_rows,
        tasks,
        requirements,
    )


if __name__ == "__main__":
    main()
