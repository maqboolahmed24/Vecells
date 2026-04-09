#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
BLUEPRINT_DIR = ROOT / "blueprint"
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "analysis"

REQUIREMENT_FIELD_ORDER = [
    "requirement_id",
    "requirement_title",
    "requirement_type",
    "canonicality",
    "source_file",
    "source_heading_or_logical_block",
    "direct_quote_or_precise_paraphrase",
    "rationale",
    "affected_phases",
    "affected_domains",
    "actors_personas",
    "audience_tiers",
    "channels",
    "primary_objects",
    "preconditions",
    "trigger",
    "expected_behavior",
    "failure_or_degraded_behavior",
    "closure_blockers_or_guards",
    "external_dependencies",
    "FHIR_or_representation_implications",
    "security_privacy_implications",
    "observability_implications",
    "acceptance_test_hint",
    "related_requirement_ids",
    "status",
    "notes",
]

SOURCE_PRECEDENCE_POLICY = {
    "policy_id": "vecells_source_precedence_v1",
    "description": (
        "Deterministic conflict-resolution policy for the Vecells blueprint corpus. "
        "Higher-ranked tiers win when statements disagree, except that forensic "
        "findings may add mandatory patch rows and anti-regression guardrails but "
        "may not weaken higher-tier canonical contracts."
    ),
    "resolution_order": [
        "canonical_phase0_foundation",
        "relevant_phase_blueprint",
        "specialized_cross_cutting_blueprint",
        "programme_phase_cards",
        "audited_flow_baseline",
        "forensic_patch_guidance",
        "orientation_summary",
        "supporting_design_reference",
    ],
    "tiers": [
        {
            "rank": 1,
            "tier": "canonical_phase0_foundation",
            "sources": ["phase-0-the-foundation-protocol.md"],
            "wins_on": [
                "canonical objects",
                "state axes",
                "closure rules",
                "mutation fences",
                "release and trust tuples",
                "platform invariants",
            ],
            "conflict_rule": (
                "This tier is the canonical foundation for object shape, invariants, "
                "lifecycle control, route intent, release freeze, and assurance trust."
            ),
        },
        {
            "rank": 2,
            "tier": "relevant_phase_blueprint",
            "sources": ["phase-1-the-red-flag-gate.md", "phase-2-identity-and-echoes.md", "phase-3-the-human-checkpoint.md", "phase-4-the-booking-engine.md", "phase-5-the-network-horizon.md", "phase-6-the-pharmacy-loop.md", "phase-7-inside-the-nhs-app.md", "phase-8-the-assistive-layer.md", "phase-9-the-assurance-ledger.md"],
            "wins_on": [
                "phase-local workflow behavior",
                "phase-local tests",
                "phase-local backend and frontend obligations",
            ],
            "conflict_rule": (
                "Relevant phase files refine workflow behavior for their own phase but "
                "must remain compatible with Phase 0 invariants and cross-cutting shell/runtime law."
            ),
        },
        {
            "rank": 3,
            "tier": "specialized_cross_cutting_blueprint",
            "sources": [
                "platform-frontend-blueprint.md",
                "canonical-ui-contract-kernel.md",
                "design-token-foundation.md",
                "accessibility-and-content-system-contract.md",
                "patient-portal-experience-architecture-blueprint.md",
                "patient-account-and-communications-blueprint.md",
                "staff-operations-and-support-blueprint.md",
                "staff-workspace-interface-architecture.md",
                "pharmacy-console-frontend-architecture.md",
                "operations-console-frontend-blueprint.md",
                "platform-admin-and-config-blueprint.md",
                "governance-admin-console-frontend-blueprint.md",
                "platform-runtime-and-release-blueprint.md",
                "callback-and-clinician-messaging-loop.md",
                "self-care-content-and-admin-resolution-blueprint.md",
            ],
            "wins_on": [
                "frontend shell law",
                "runtime topology and release rules",
                "admin and governance contracts",
                "communications and support behavior",
            ],
            "conflict_rule": (
                "Cross-cutting blueprints define canonical UI, runtime, admin, support, "
                "and specialist operating law whenever a summary layer is broader than the concrete contract."
            ),
        },
        {
            "rank": 4,
            "tier": "programme_phase_cards",
            "sources": ["phase-cards.md"],
            "wins_on": [
                "programme sequencing",
                "cross-phase conformance alignment",
                "summary-layer task ordering",
            ],
            "conflict_rule": (
                "Phase cards align summary language and sequencing but must not override "
                "Phase 0, relevant phase files, or specialized blueprints."
            ),
        },
        {
            "rank": 5,
            "tier": "audited_flow_baseline",
            "sources": [
                "vecells-complete-end-to-end-flow.md",
                "vecells-complete-end-to-end-flow.mmd",
            ],
            "wins_on": [
                "top-level end-to-end flow visibility",
                "baseline continuity and control-plane tuple visibility",
            ],
            "conflict_rule": (
                "The audited flow is a supporting baseline. If it diverges from Phase 0 "
                "or a relevant phase blueprint, the canonical blueprint wins and the flow must be corrected."
            ),
        },
        {
            "rank": 6,
            "tier": "forensic_patch_guidance",
            "sources": ["forensic-audit-findings.md"],
            "wins_on": [
                "mandatory gap closures",
                "anti-regression guardrails",
                "defect-specific patch direction",
            ],
            "conflict_rule": (
                "Forensic findings must be represented as patch requirements, exclusions, "
                "or anti-regression rules; they tighten the corpus but do not authorize weaker semantics."
            ),
        },
        {
            "rank": 7,
            "tier": "orientation_summary",
            "sources": ["blueprint-init.md"],
            "wins_on": [
                "orientation only",
            ],
            "conflict_rule": (
                "The bootstrap summary orients later work but never overrides canonical or "
                "specialized sources."
            ),
        },
        {
            "rank": 8,
            "tier": "supporting_design_reference",
            "sources": [
                "uiux-skill.md",
                "ux-quiet-clarity-redesign.md",
            ],
            "wins_on": [
                "design reinforcement",
                "interaction heuristics",
            ],
            "conflict_rule": (
                "Supporting design references help interpret the front-end direction but do "
                "not override explicit shell, accessibility, runtime, or phase contracts."
            ),
        },
    ],
    "global_rules": [
        {
            "rule_id": "PRECEDENCE_001",
            "statement": "Preserve the orthogonality of submissionEnvelopeState, workflowState, safetyState, and identityState.",
        },
        {
            "rule_id": "PRECEDENCE_002",
            "statement": "LifecycleCoordinator is the sole cross-domain authority for request closure and governed reopen decisions.",
        },
        {
            "rule_id": "PRECEDENCE_003",
            "statement": "Web, NHS App jump-off, telephony, secure-link continuation, and support-assisted capture are one governed intake lineage, not separate back-office workflows.",
        },
        {
            "rule_id": "PRECEDENCE_004",
            "statement": "Supplier-specific behavior belongs behind adapter capability contracts rather than domain-local business logic.",
        },
        {
            "rule_id": "PRECEDENCE_005",
            "statement": "Degraded, fallback, repair, and ambiguity states are first-class outputs and must not be flattened into optimistic milestone prose.",
        },
    ],
}

SUPPORTING_SOURCE_FILES = {
    "blueprint-init.md",
    "phase-cards.md",
    "vecells-complete-end-to-end-flow.md",
    "vecells-complete-end-to-end-flow.mmd",
    "uiux-skill.md",
    "ux-quiet-clarity-redesign.md",
}

FLOW_REQUIRED_TOKENS = [
    "SubmissionEnvelope",
    "EvidenceSnapshot",
    "RequestLineage",
    "LineageCaseLink",
    "DuplicateCluster",
    "FallbackReviewCase",
    "IdentityRepairCase",
    "RouteIntentBinding",
    "CommandActionRecord",
    "CommandSettlementRecord",
    "ReleaseApprovalFreeze",
    "ChannelReleaseFreezeRecord",
    "AssuranceSliceTrustRecord",
    "PatientNavUrgencyDigest",
    "PatientNavReturnContract",
    "RecordActionContextToken",
    "RecoveryContinuationToken",
    "PatientConversationPreviewDigest",
    "PatientReceiptEnvelope",
    "ConversationCommandSettlement",
    "SupportReplayRestoreSettlement",
    "urgent_diversion_required",
    "urgent_diverted",
]

MANDATORY_EDGE_CASE_ROWS = [
    {
        "requirement_id": "REQ-EDGE-ACCEPTED-RETRY-RETURNS-PRIOR-RESULT",
        "requirement_title": "Accepted retry must return the prior accepted result",
        "source_file": "phase-0-the-foundation-protocol.md",
        "source_heading_or_logical_block": "6.3B Replay return rule",
        "direct_quote_or_precise_paraphrase": "Accepted retries resolve through replay-safe settlement instead of creating a second durable outcome.",
        "requirement_type": "invariant",
    },
    {
        "requirement_id": "REQ-EDGE-DUPLICATE-CLUSTER-REVIEW",
        "requirement_title": "Duplicate review must materialize as DuplicateCluster review work instead of silent merge",
        "source_file": "phase-0-the-foundation-protocol.md",
        "source_heading_or_logical_block": "8.6 Review-required cluster handling",
        "direct_quote_or_precise_paraphrase": "Review-required duplicate clusters open explicit review work and may not silently collapse into routine attach semantics.",
        "requirement_type": "workflow",
    },
    {
        "requirement_id": "REQ-EDGE-IDENTITY-REPAIR-CASE",
        "requirement_title": "Wrong-patient correction must route through IdentityRepairCase",
        "source_file": "phase-0-the-foundation-protocol.md",
        "source_heading_or_logical_block": "5.6 Wrong-patient correction algorithm",
        "direct_quote_or_precise_paraphrase": "Wrong-patient correction uses immutable repair signals, freeze records, branch dispositions, and release settlement rather than rewriting workflow state.",
        "requirement_type": "workflow",
    },
    {
        "requirement_id": "REQ-EDGE-MATERIAL-DELTA-RE-SAFETY",
        "requirement_title": "Material delta evidence must trigger canonical re-safety",
        "source_file": "phase-0-the-foundation-protocol.md",
        "source_heading_or_logical_block": "7.1B Canonical evidence assimilation and material-delta gate",
        "direct_quote_or_precise_paraphrase": "Material changes in safety, triage, delivery, or patient-visible meaning require a new immutable snapshot and a rerun of the owning safety gate.",
        "requirement_type": "invariant",
    },
    {
        "requirement_id": "REQ-EDGE-URGENT-STATE-SEPARATION",
        "requirement_title": "urgent_diversion_required and urgent_diverted must remain distinct safety states",
        "source_file": "phase-0-the-foundation-protocol.md",
        "source_heading_or_logical_block": "7.4 Safety outcomes",
        "direct_quote_or_precise_paraphrase": "The platform distinguishes urgent diversion being required from urgent advice being durably issued.",
        "requirement_type": "state_machine",
    },
    {
        "requirement_id": "REQ-EDGE-FALLBACK-AFTER-ACCEPTED-PROGRESS",
        "requirement_title": "Accepted progress that later degrades must open fallback review instead of disappearing",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "source_heading_or_logical_block": "Audited baseline introduction",
        "direct_quote_or_precise_paraphrase": "Accepted progress that later fails opens FallbackReviewCase or exception handling rather than disappearing from the same request shell.",
        "requirement_type": "workflow",
    },
    {
        "requirement_id": "REQ-EDGE-ROUTE-INTENT-AND-SETTLEMENT",
        "requirement_title": "Post-submit mutation requires RouteIntentBinding plus authoritative command settlement",
        "source_file": "phase-0-the-foundation-protocol.md",
        "source_heading_or_logical_block": "6.6 Scoped mutation gate",
        "direct_quote_or_precise_paraphrase": "Writable post-submit actions bind one live route intent and yield one authoritative command settlement record before UI calmness may advance.",
        "requirement_type": "backend",
    },
    {
        "requirement_id": "REQ-EDGE-RELEASE-CHANNEL-TRUST-FENCE",
        "requirement_title": "Writable posture requires release freeze, channel freeze, and assurance trust compatibility",
        "source_file": "phase-0-the-foundation-protocol.md",
        "source_heading_or_logical_block": "14.5 Promotion gate",
        "direct_quote_or_precise_paraphrase": "ReleaseApprovalFreeze, ChannelReleaseFreezeRecord, and AssuranceSliceTrustRecord fence writable posture and automation trust.",
        "requirement_type": "runtime_release",
    },
    {
        "requirement_id": "REQ-EDGE-VISIBILITY-PROJECTION-BEFORE-MATERIALIZATION",
        "requirement_title": "VisibilityProjectionPolicy must bind before patient or staff projections materialize",
        "source_file": "phase-0-the-foundation-protocol.md",
        "source_heading_or_logical_block": "12.2 Field-level projection materialization rule",
        "direct_quote_or_precise_paraphrase": "Visibility, masking, and section posture are governed before calm surface truth is materialized.",
        "requirement_type": "frontend",
    },
    {
        "requirement_id": "REQ-EDGE-CHILD-CASE-AMBIGUITY-BLOCKS-CLOSURE",
        "requirement_title": "Child-case ambiguity must not prematurely close the parent request",
        "source_file": "phase-0-the-foundation-protocol.md",
        "source_heading_or_logical_block": "9.6 Closure evaluation algorithm",
        "direct_quote_or_precise_paraphrase": "Unresolved confirmation, outcome reconciliation, identity repair, duplicate review, fallback recovery, and reachability repair remain blocker facts rather than closure-safe workflow milestones.",
        "requirement_type": "invariant",
    },
]

PHASE_TASK_BANDS = {
    "phase-0-the-foundation-protocol.md": [
        "seq_001-020 programme analysis and architecture freeze",
        "seq_041-138 Phase 0 foundation build, merge, and test gates",
        "all later phases that consume the foundation control plane",
    ],
    "phase-1-the-red-flag-gate.md": [
        "seq_139-169 Phase 1 implementation and exit gate",
    ],
    "phase-2-identity-and-echoes.md": [
        "seq_170-208 Phase 2 identity and telephony implementation",
    ],
    "phase-3-the-human-checkpoint.md": [
        "seq_226-258 Phase 3 triage, review, and decision orchestration",
    ],
    "phase-4-the-booking-engine.md": [
        "Phase 4 booking implementation and validation tasks",
    ],
    "phase-5-the-network-horizon.md": [
        "Phase 5 hub coordination and network booking tasks",
    ],
    "phase-6-the-pharmacy-loop.md": [
        "Phase 6 pharmacy routing, dispatch, and reconciliation tasks",
    ],
    "phase-7-inside-the-nhs-app.md": [
        "Phase 7 NHS App embedded-channel expansion tasks",
    ],
    "phase-8-the-assistive-layer.md": [
        "Phase 8 assistive capability, evaluation, and safety tasks",
    ],
    "phase-9-the-assurance-ledger.md": [
        "Phase 9 assurance, records lifecycle, recovery, and BAU transfer tasks",
    ],
}


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return slug or "value"


def split_csv_list(values: list[str]) -> str:
    return "|".join(values)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_markdown_sections(text: str) -> tuple[list[str], list[dict[str, Any]]]:
    lines = text.splitlines()
    sections: list[dict[str, Any]] = []
    for idx, line in enumerate(lines, start=1):
        match = re.match(r"^(#{1,6})\s+(.*)$", line)
        if not match:
            continue
        sections.append(
            {
                "level": len(match.group(1)),
                "heading": normalize_space(match.group(2)),
                "line": idx,
            }
        )
    for idx, section in enumerate(sections):
        section["end_line"] = (
            sections[idx + 1]["line"] - 1 if idx + 1 < len(sections) else len(lines)
        )
    return lines, sections


def section_body(lines: list[str], section: dict[str, Any]) -> list[str]:
    start = section["line"]
    end = section["end_line"]
    return lines[start:end]


def extract_first_paragraph(lines: list[str]) -> str:
    paragraph: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if paragraph:
                break
            continue
        if stripped.startswith("```"):
            break
        if re.match(r"^\s*[-*]\s+", line) or re.match(r"^\s*\d+\.\s+", line):
            cleaned = re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", line).strip()
            paragraph.append(cleaned)
            continue
        paragraph.append(stripped)
    return normalize_space(" ".join(paragraph))


def extract_list_items(lines: list[str]) -> list[str]:
    items: list[str] = []
    current: list[str] = []
    for line in lines:
        stripped = line.rstrip()
        if not stripped.strip():
            if current:
                items.append(normalize_space(" ".join(current)))
                current = []
            continue
        bullet_match = re.match(r"^\s*(?:[-*]|\d+\.)\s+(.*)$", stripped)
        if bullet_match:
            if current:
                items.append(normalize_space(" ".join(current)))
            current = [bullet_match.group(1).strip()]
            continue
        if current:
            current.append(stripped.strip())
    if current:
        items.append(normalize_space(" ".join(current)))
    return items


def choose_intro_excerpt(path: Path, lines: list[str], sections: list[dict[str, Any]]) -> tuple[str, str]:
    for section in sections:
        heading_lower = section["heading"].lower()
        if "purpose" in heading_lower:
            excerpt = extract_first_paragraph(section_body(lines, section))
            if excerpt:
                return section["heading"], excerpt
    if len(sections) >= 2:
        first = sections[0]
        intro_lines = lines[first["line"] : sections[1]["line"] - 1]
        excerpt = extract_first_paragraph(intro_lines)
        if excerpt:
            return "Document introduction", excerpt
    if sections:
        excerpt = extract_first_paragraph(section_body(lines, sections[0]))
        if excerpt:
            return sections[0]["heading"], excerpt
    if path.suffix == ".mmd":
        return (
            "Mermaid flow baseline",
            "The standalone Mermaid flow is a machine-readable baseline for intake convergence, triage, endpoint routing, and continuity control semantics.",
        )
    return ("Document body", "")


def infer_source_role(filename: str) -> str:
    if filename == "phase-0-the-foundation-protocol.md":
        return "canonical_foundation"
    if re.match(r"phase-\d-", filename):
        return "phase_blueprint"
    if filename == "phase-cards.md":
        return "programme_summary"
    if filename in {"vecells-complete-end-to-end-flow.md", "vecells-complete-end-to-end-flow.mmd"}:
        return "audited_flow_baseline"
    if filename == "forensic-audit-findings.md":
        return "audit_patch_register"
    if filename == "blueprint-init.md":
        return "orientation_summary"
    if filename in {"uiux-skill.md", "ux-quiet-clarity-redesign.md"}:
        return "supporting_design_reference"
    if any(
        token in filename
        for token in [
            "frontend",
            "portal",
            "communications",
            "workspace",
            "pharmacy-console",
            "operations-console",
            "governance-admin",
            "accessibility",
            "canonical-ui",
            "design-token",
        ]
    ):
        return "cross_cutting_frontend_blueprint"
    if any(token in filename for token in ["runtime", "admin-and-config"]):
        return "cross_cutting_runtime_blueprint"
    return "cross_cutting_specialist_blueprint"


def infer_authority(filename: str, role: str) -> tuple[int, str]:
    if filename == "phase-0-the-foundation-protocol.md":
        return (1, "canonical_phase0_foundation")
    if re.match(r"phase-\d-", filename):
        return (2, "relevant_phase_blueprint")
    if role in {
        "cross_cutting_frontend_blueprint",
        "cross_cutting_runtime_blueprint",
        "cross_cutting_specialist_blueprint",
    }:
        return (3, "specialized_cross_cutting_blueprint")
    if filename == "phase-cards.md":
        return (4, "programme_phase_cards")
    if filename in {"vecells-complete-end-to-end-flow.md", "vecells-complete-end-to-end-flow.mmd"}:
        return (5, "audited_flow_baseline")
    if filename == "forensic-audit-findings.md":
        return (6, "forensic_patch_guidance")
    if filename == "blueprint-init.md":
        return (7, "orientation_summary")
    return (8, "supporting_design_reference")


def infer_likely_consumers(filename: str, role: str) -> list[str]:
    if filename in PHASE_TASK_BANDS:
        return PHASE_TASK_BANDS[filename]
    if role == "programme_summary":
        return [
            "seq_001-020 corpus analysis, reconciliation, and conformance planning",
            "later phase completion reviews and Phase 9 conformance proof",
        ]
    if role == "audited_flow_baseline":
        return [
            "seq_001-005 corpus analysis and summary reconciliation",
            "all downstream phase tasks that need one end-to-end baseline",
        ]
    if role == "audit_patch_register":
        return [
            "seq_001-005 gap closure and anti-regression work",
            "all later tasks that need explicit defect-closure requirements",
        ]
    if role == "orientation_summary":
        return [
            "seq_001-003 programme scope and orientation tasks",
            "summary-layer alignment and non-goal definition tasks",
        ]
    if role == "cross_cutting_frontend_blueprint":
        return [
            "seq_014 frontend stack selection and shell law decisions",
            "phase 0 frontend tasks par_103-120",
            "later patient, staff, support, operations, governance, and pharmacy frontend tracks",
        ]
    if role == "cross_cutting_runtime_blueprint":
        return [
            "seq_015 release and runtime tooling decisions",
            "phase 0 runtime tasks par_084-102",
            "later governance, runtime, and Phase 9 assurance tasks",
        ]
    return [
        "seq_001-020 corpus analysis and architecture alignment",
        "cross-phase specialist tracks that depend on the domain-specific contract",
    ]


def meaningful_headings(sections: list[dict[str, Any]]) -> list[str]:
    ignored = {
        "Purpose",
        "Linked documents",
        "System after Phase 7",
        "System after Phase 8",
        "System after Phase 9",
        "System after Phase 6",
    }
    results: list[str] = []
    for section in sections:
        if section["level"] not in {2, 3}:
            continue
        heading = section["heading"]
        if heading in ignored:
            continue
        if heading.lower() in {"purpose", "goal"}:
            continue
        results.append(heading)
    return results[:4]


def infer_primary_concerns(filename: str, sections: list[dict[str, Any]]) -> list[str]:
    if filename == "vecells-complete-end-to-end-flow.mmd":
        return [
            "audited end-to-end channel convergence",
            "triage and downstream routing semantics",
            "continuity and recovery transitions",
            "control-plane tuple visibility",
        ]
    concerns = meaningful_headings(sections)
    if concerns:
        return concerns
    return ["document-level contract summary"]


def infer_definition_flags(filename: str, role: str) -> dict[str, bool]:
    lowered = filename.lower()
    return {
        "defines_canonical_objects": role
        in {
            "canonical_foundation",
            "phase_blueprint",
            "cross_cutting_frontend_blueprint",
            "cross_cutting_runtime_blueprint",
            "cross_cutting_specialist_blueprint",
        },
        "defines_ui_rules": any(
            token in lowered
            for token in [
                "frontend",
                "portal",
                "workspace",
                "operations",
                "pharmacy-console",
                "accessibility",
                "ui",
                "ux",
                "design-token",
                "canonical-ui",
                "staff-operations",
                "patient-account",
            ]
        ),
        "defines_runtime_rules": any(
            token in lowered
            for token in [
                "runtime",
                "release",
                "admin",
                "governance",
                "phase-0",
                "phase-9",
            ]
        ),
        "defines_defect_corrections": filename == "forensic-audit-findings.md",
    }


def infer_requirement_type(text: str, filename: str, default: str = "functional") -> str:
    lowered = f"{filename} {text}".lower()
    if "test" in lowered or "verification" in lowered:
        return "test"
    if any(token in lowered for token in ["screen-reader", "keyboard", "aria", "landmark", "assistive", "accessibility"]):
        return "accessibility"
    if any(token in lowered for token in ["microcopy", "content", "self-care advice", "copy", "language clarity"]):
        return "content"
    if any(token in lowered for token in ["runtime", "release", "deployment", "rollback", "watch tuple", "migration", "canary", "provenance"]):
        return "runtime_release"
    if any(token in lowered for token in ["hazard", "assurance", "audit", "dspt", "dcb0129", "evidence graph", "conformance"]):
        return "assurance"
    if any(token in lowered for token in ["privacy", "consent", "dpia", "masking"]):
        return "privacy"
    if any(token in lowered for token in ["security", "auth", "scope", "rbac", "break-glass", "session"]):
        return "security"
    if any(
        token in lowered
        for token in [
            "shell",
            "frontend",
            "portal",
            "route",
            "ui",
            "console",
            "navigation",
            "artifact presentation",
            "selectedanchor",
        ]
    ):
        return "frontend"
    if any(token in lowered for token in ["adapter", "mesh", "im1", "nhs login", "gp connect", "telephony", "directory"]):
        return "integration"
    if any(token in lowered for token in ["state model", "state machine", "workflowstate", "identitystate", "safetystate"]):
        return "state_machine"
    if any(token in lowered for token in ["invariant", "must not", "forbidden", "sole authority", "only may"]):
        return "invariant"
    if any(token in lowered for token in ["record", "projection", "contract", "case", "bundle", "lineage", "object"]):
        return "domain_object"
    if any(token in lowered for token in ["worker", "service", "coordinator", "governor", "orchestrator", "event"]):
        return "backend"
    if any(token in lowered for token in ["journey", "workflow", "loop", "handoff", "routing"]):
        return "workflow"
    return default


def infer_phases(filename: str, text: str) -> list[str]:
    phase_match = re.match(r"phase-(\d)-", filename)
    if phase_match:
        phase = f"phase_{phase_match.group(1)}"
        if phase == "phase_0":
            return ["phase_0", "cross_phase"]
        return [phase]
    lowered = text.lower()
    found = []
    for number in range(0, 10):
        token = f"phase {number}"
        if token in lowered or f"phase_{number}" in lowered:
            found.append(f"phase_{number}")
    return found or ["cross_phase"]


def infer_domains(filename: str, text: str) -> list[str]:
    lowered = f"{filename} {text}".lower()
    domains = []
    mapping = {
        "intake": ["submission", "intake", "draft", "promotion"],
        "identity": ["identity", "claim", "session", "auth", "nhs login"],
        "safety": ["safety", "urgent", "risk", "triage"],
        "triage": ["triage", "review", "queue"],
        "booking": ["booking", "reservation", "waitlist"],
        "hub": ["hub", "network"],
        "pharmacy": ["pharmacy"],
        "patient_portal": ["patient", "portal", "request detail", "home contract"],
        "staff_workspace": ["workspace", "clinician", "staff"],
        "support": ["support"],
        "operations": ["operations"],
        "governance": ["governance", "admin", "compliance"],
        "runtime": ["runtime", "release", "deployment", "topology"],
        "frontend": ["shell", "route", "frontend", "artifact", "selectedanchor"],
        "assurance": ["assurance", "audit", "resilience", "retention"],
    }
    for domain, tokens in mapping.items():
        if any(token in lowered for token in tokens):
            domains.append(domain)
    return domains or ["cross_phase"]


def infer_personas(text: str) -> list[str]:
    lowered = text.lower()
    personas = []
    mapping = {
        "patient": ["patient"],
        "clinician": ["clinician", "clinical"],
        "staff": ["staff", "workspace"],
        "support_advisor": ["support"],
        "operations_lead": ["operations", "ops"],
        "governance_lead": ["governance", "compliance"],
        "pharmacy_user": ["pharmacy"],
        "hub_coordinator": ["hub", "network"],
        "practice_admin": ["admin", "practice"],
    }
    for persona, tokens in mapping.items():
        if any(token in lowered for token in tokens):
            personas.append(persona)
    return personas or ["cross_programme"]


def infer_audience_tiers(text: str) -> list[str]:
    lowered = text.lower()
    audiences = []
    mapping = {
        "patient": ["patient"],
        "staff": ["staff", "clinician", "workspace"],
        "support": ["support"],
        "operations": ["operations", "ops"],
        "governance": ["governance", "compliance", "admin"],
        "pharmacy": ["pharmacy"],
        "hub": ["hub", "network"],
    }
    for audience, tokens in mapping.items():
        if any(token in lowered for token in tokens):
            audiences.append(audience)
    return audiences or ["cross_audience"]


def infer_channels(text: str) -> list[str]:
    lowered = text.lower()
    channels = []
    mapping = {
        "web": ["web", "portal", "browser"],
        "nhs_app": ["nhs app", "embedded"],
        "telephony": ["telephony", "phone", "ivr", "callback"],
        "secure_link": ["sms", "secure-link", "continuation"],
        "support_console": ["support"],
        "staff_console": ["workspace", "operations", "governance", "pharmacy console"],
    }
    for channel, tokens in mapping.items():
        if any(token in lowered for token in tokens):
            channels.append(channel)
    return channels or ["cross_channel"]


def infer_external_dependencies(text: str) -> list[str]:
    lowered = text.lower()
    dependencies = []
    mapping = {
        "NHS login": ["nhs login"],
        "IM1": ["im1"],
        "GP Connect": ["gp connect"],
        "MESH": ["mesh"],
        "NHS App": ["nhs app"],
        "telephony vendor": ["telephony", "ivr"],
        "notification provider": ["notification", "email", "sms"],
        "directory service": ["directory", "service search"],
    }
    for dependency, tokens in mapping.items():
        if any(token in lowered for token in tokens):
            dependencies.append(dependency)
    return dependencies


def infer_fhir_implications(text: str) -> str:
    lowered = text.lower()
    if any(token in lowered for token in ["fhir", "task", "servicerequest", "documentreference", "communication", "consent", "auditevent", "provenance"]):
        return "Map or validate this requirement through the governed FHIR representation set rather than treating a FHIR resource as the hidden write model."
    return "Use the Vecells-first internal model and expose FHIR representations only through governed mapping contracts when this requirement crosses a clinical boundary."


def infer_security_privacy_implications(text: str) -> str:
    lowered = text.lower()
    if any(token in lowered for token in ["identity", "patient", "scope", "consent", "phi", "mask", "privacy", "reachability", "embedded"]):
        return "This requirement affects PHI exposure, subject binding, masking, or consent posture and must fail closed on ambiguous trust or scope."
    return "No extra security or privacy implication was stated beyond the default requirement to preserve auditability and minimum-necessary access."


def infer_observability_implications(text: str) -> str:
    lowered = text.lower()
    if any(token in lowered for token in ["event", "projection", "watch", "parity", "verification", "audit", "continuity evidence"]):
        return "Emit explicit events, projection freshness, parity, or continuity proof so operators can observe the requirement rather than infer it from UI calmness."
    return "Record enough audit and projection evidence to prove the requirement remains true after replay, recovery, and release drift."


def generic_preconditions(requirement_type: str) -> list[str]:
    if requirement_type == "test":
        return ["The relevant implementation and fixtures exist for the referenced phase or control surface."]
    if requirement_type == "runtime_release":
        return ["A candidate release tuple, route contract, or environment binding is present for validation."]
    return ["The governed intake, request, or audience surface context referenced by the source exists."]


def generic_trigger(requirement_type: str) -> str:
    if requirement_type == "test":
        return "Run the referenced verification suite or release gate."
    if requirement_type in {"invariant", "state_machine"}:
        return "Advance workflow, safety, identity, or release state in the referenced control plane."
    return "Consume or implement the referenced source contract in downstream delivery work."


def generic_failure_behavior(requirement_type: str) -> str:
    if requirement_type == "test":
        return "Block the matching phase gate or release promotion until the suite passes."
    if requirement_type == "runtime_release":
        return "Freeze writable posture, widening, or promotion and degrade to recovery or read-only posture."
    if requirement_type == "frontend":
        return "Degrade the surface to bounded recovery, explicit placeholder, or read-only posture instead of inventing local truth."
    return "Fail closed to review, blocker, or governed recovery rather than inventing local state or silently dropping continuity."


def generic_acceptance_hint(requirement_type: str, title: str) -> str:
    if requirement_type == "test":
        return title
    if requirement_type in {"invariant", "state_machine"}:
        return "Prove the state transition or guard in a deterministic contract test and confirm it remains orthogonal to blocker state."
    if requirement_type == "frontend":
        return "Verify the route or shell behavior in browser automation with stable landmarks, calm fallback, and selected-anchor continuity."
    if requirement_type == "runtime_release":
        return "Prove the exact publication tuple, recovery posture, and watch evidence before enabling writable posture."
    return "Trace one end-to-end example through command, projection, and recovery paths without bypassing the stated guardrails."


def make_requirement(
    *,
    requirement_id: str,
    requirement_title: str,
    requirement_type: str,
    canonicality: str,
    source_file: str,
    source_heading_or_logical_block: str,
    direct_quote_or_precise_paraphrase: str,
    rationale: str,
    expected_behavior: str | None = None,
    notes: str = "",
) -> dict[str, Any]:
    text = " ".join(
        [
            requirement_title,
            source_heading_or_logical_block,
            direct_quote_or_precise_paraphrase,
            rationale,
            expected_behavior or "",
            notes,
        ]
    )
    return {
        "requirement_id": requirement_id,
        "requirement_title": requirement_title,
        "requirement_type": requirement_type,
        "canonicality": canonicality,
        "source_file": source_file,
        "source_heading_or_logical_block": source_heading_or_logical_block,
        "direct_quote_or_precise_paraphrase": direct_quote_or_precise_paraphrase,
        "rationale": rationale,
        "affected_phases": infer_phases(source_file, text),
        "affected_domains": infer_domains(source_file, text),
        "actors_personas": infer_personas(text),
        "audience_tiers": infer_audience_tiers(text),
        "channels": infer_channels(text),
        "primary_objects": [],
        "preconditions": generic_preconditions(requirement_type),
        "trigger": generic_trigger(requirement_type),
        "expected_behavior": expected_behavior or direct_quote_or_precise_paraphrase,
        "failure_or_degraded_behavior": generic_failure_behavior(requirement_type),
        "closure_blockers_or_guards": [],
        "external_dependencies": infer_external_dependencies(text),
        "FHIR_or_representation_implications": infer_fhir_implications(text),
        "security_privacy_implications": infer_security_privacy_implications(text),
        "observability_implications": infer_observability_implications(text),
        "acceptance_test_hint": generic_acceptance_hint(requirement_type, requirement_title),
        "related_requirement_ids": [],
        "status": "normalized" if canonicality == "canonical" else "gap_resolved" if canonicality == "derived_from_canonical_gap_closure" else "extracted",
        "notes": notes,
    }


def build_source_manifest() -> list[dict[str, Any]]:
    manifest: list[dict[str, Any]] = []
    for path in sorted(BLUEPRINT_DIR.iterdir()):
        if path.suffix not in {".md", ".mmd"}:
            continue
        text = read_text(path)
        lines, sections = parse_markdown_sections(text if path.suffix == ".md" else "")
        role = infer_source_role(path.name)
        rank, authority_label = infer_authority(path.name, role)
        manifest.append(
            {
                "source_file": path.name,
                "relative_path": f"blueprint/{path.name}",
                "line_count": len(text.splitlines()),
                "file_role": role,
                "authority_rank": rank,
                "authority_label": authority_label,
                "document_title": sections[0]["heading"] if sections else path.stem.replace("-", " "),
                "primary_concerns": infer_primary_concerns(path.name, sections),
                "dependent_task_bands": infer_likely_consumers(path.name, role),
                "definition_flags": infer_definition_flags(path.name, role),
                "headings": [section["heading"] for section in sections],
            }
        )
    return manifest


def build_source_core_requirements(manifest: list[dict[str, Any]]) -> list[dict[str, Any]]:
    requirements = []
    for entry in manifest:
        path = BLUEPRINT_DIR / entry["source_file"]
        text = read_text(path)
        lines, sections = parse_markdown_sections(text if path.suffix == ".md" else "")
        heading, excerpt = choose_intro_excerpt(path, lines, sections)
        if not excerpt:
            continue
        canonicality = (
            "supporting"
            if entry["source_file"] in SUPPORTING_SOURCE_FILES
            else "canonical"
        )
        if entry["source_file"] == "forensic-audit-findings.md":
            canonicality = "supporting"
        requirement_type = infer_requirement_type(
            excerpt, entry["source_file"], default="functional"
        )
        requirements.append(
            make_requirement(
                requirement_id=f"REQ-SRC-{slugify(entry['source_file'])}",
                requirement_title=f"{entry['document_title']} must govern downstream implementation decisions",
                requirement_type=requirement_type,
                canonicality=canonicality,
                source_file=entry["source_file"],
                source_heading_or_logical_block=heading,
                direct_quote_or_precise_paraphrase=excerpt,
                rationale=(
                    "Each source contributes at least one directly traceable requirement so "
                    "later tasks can locate the owning document without rereading the full corpus."
                ),
                notes=f"source_role={entry['file_role']}; authority_label={entry['authority_label']}",
            )
        )
    return requirements


def build_control_priority_requirements(manifest: list[dict[str, Any]]) -> list[dict[str, Any]]:
    patterns = [
        "bootstrap priorities",
        "control priorities",
        "additional control priorities",
        "high-priority",
        "implementation rules",
        "must prove",
        "programme summary-layer alignment",
        "extended summary-layer alignment",
        "cross-layer control priorities",
        "release-guardrail priorities",
    ]
    requirements = []
    for entry in manifest:
        path = BLUEPRINT_DIR / entry["source_file"]
        if path.suffix != ".md":
            continue
        lines, sections = parse_markdown_sections(read_text(path))
        for section in sections:
            heading_lower = section["heading"].lower()
            if not any(pattern in heading_lower for pattern in patterns):
                continue
            items = extract_list_items(section_body(lines, section))
            for index, item in enumerate(items, start=1):
                requirement_type = infer_requirement_type(item, entry["source_file"])
                canonicality = (
                    "supporting"
                    if entry["source_file"] in SUPPORTING_SOURCE_FILES
                    else "canonical"
                )
                if entry["source_file"] == "forensic-audit-findings.md":
                    canonicality = "supporting"
                requirements.append(
                    make_requirement(
                        requirement_id=f"REQ-CTRL-{slugify(entry['source_file'])}-{index:03d}-{slugify(section['heading'])}",
                        requirement_title=f"{entry['document_title']}: {item}",
                        requirement_type=requirement_type,
                        canonicality=canonicality,
                        source_file=entry["source_file"],
                        source_heading_or_logical_block=section["heading"],
                        direct_quote_or_precise_paraphrase=item,
                        rationale="Control priorities, implementation rules, and summary-alignment bullets become explicit downstream requirements.",
                        notes=f"source_role={entry['file_role']}; authority_label={entry['authority_label']}",
                    )
                )
    return requirements


def parse_phase0_named_contracts(path: Path) -> list[dict[str, Any]]:
    text = read_text(path)
    lines = text.splitlines()
    current_h3 = ""
    section_kinds = {
        "1. Required platform objects": "domain_object",
        "2. Required platform services": "backend",
        "1. Required experience topology and primitives": "frontend",
        "2. Required frontend services": "frontend",
    }
    contracts = []
    for idx, line in enumerate(lines, start=1):
        if line.startswith("### "):
            current_h3 = normalize_space(line[4:])
        match = re.match(r"^####\s+[0-9A-Za-z.]+\s+(.+)$", line)
        if not match or current_h3 not in section_kinds:
            continue
        name = normalize_space(match.group(1))
        contracts.append(
            {
                "name": name,
                "line": idx,
                "section": current_h3,
                "requirement_type": section_kinds[current_h3],
            }
        )
    return contracts


def build_phase0_contract_requirements() -> tuple[list[dict[str, Any]], list[str]]:
    path = BLUEPRINT_DIR / "phase-0-the-foundation-protocol.md"
    rows = []
    contract_names = []
    for contract in parse_phase0_named_contracts(path):
        contract_names.append(contract["name"])
        rows.append(
            make_requirement(
                requirement_id=f"REQ-OBJ-{slugify(contract['name'])}",
                requirement_title=f"{contract['name']} is a required canonical contract",
                requirement_type=contract["requirement_type"],
                canonicality="canonical",
                source_file=path.name,
                source_heading_or_logical_block=contract["section"],
                direct_quote_or_precise_paraphrase=(
                    f"{contract['name']} is explicitly named as a required contract in the canonical phase-0 algorithm."
                ),
                rationale=(
                    "Every named Phase 0 contract must have at least one deterministic "
                    "registry row so later docs cannot reference it without traceable ownership."
                ),
                expected_behavior=(
                    f"Persist and consume {contract['name']} through the canonical control plane "
                    "instead of inventing a route-local or phase-local substitute."
                ),
                notes=f"phase0_contract_section={contract['section']}; line={contract['line']}",
            )
        )
    return rows, contract_names


def build_phase0_invariant_requirements() -> list[dict[str, Any]]:
    path = BLUEPRINT_DIR / "phase-0-the-foundation-protocol.md"
    lines = read_text(path).splitlines()
    in_section = False
    current: list[str] = []
    items: list[str] = []
    for line in lines:
        if line.startswith("### 3. Non-negotiable invariants"):
            in_section = True
            continue
        if in_section and line.startswith("### 4. "):
            break
        if not in_section:
            continue
        match = re.match(r"^(\d+)\.\s+(.*)$", line)
        if match:
            if current:
                items.append(normalize_space(" ".join(current)))
            current = [match.group(2).strip()]
        elif current and line.strip():
            current.append(line.strip())
        elif current and not line.strip():
            items.append(normalize_space(" ".join(current)))
            current = []
    if current:
        items.append(normalize_space(" ".join(current)))
    rows = []
    for index, item in enumerate(items, start=1):
        rows.append(
            make_requirement(
                requirement_id=f"REQ-INV-{index:03d}",
                requirement_title=f"Phase 0 invariant {index:03d}",
                requirement_type="invariant",
                canonicality="canonical",
                source_file=path.name,
                source_heading_or_logical_block="3. Non-negotiable invariants",
                direct_quote_or_precise_paraphrase=item,
                rationale="Implied and explicit invariants must be machine-readable so later tasks can trace guardrails without rereading the foundation protocol.",
                notes="invariant_family=phase0_non_negotiable",
            )
        )
    return rows


def build_phase_test_requirements(manifest: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for entry in manifest:
        filename = entry["source_file"]
        if not re.match(r"phase-\d-", filename):
            continue
        lines, sections = parse_markdown_sections(read_text(BLUEPRINT_DIR / filename))
        test_sections = [
            section
            for section in sections
            if "tests that must pass" in section["heading"].lower()
            or "tests that must all pass" in section["heading"].lower()
        ]
        counter = 1
        for section in test_sections:
            for item in extract_list_items(section_body(lines, section)):
                rows.append(
                    make_requirement(
                        requirement_id=f"REQ-TEST-{slugify(filename)}-{counter:03d}",
                        requirement_title=item,
                        requirement_type="test",
                        canonicality="canonical",
                        source_file=filename,
                        source_heading_or_logical_block=section["heading"],
                        direct_quote_or_precise_paraphrase=item,
                        rationale="Every mandatory phase test becomes a traceable registry row so later implementation and merge tasks know the exit gate they serve.",
                        notes=f"phase_test_section={section['heading']}",
                    )
                )
                counter += 1
    return rows


def build_forensic_gap_requirements() -> list[dict[str, Any]]:
    path = BLUEPRINT_DIR / "forensic-audit-findings.md"
    lines, sections = parse_markdown_sections(read_text(path))
    rows = []
    for section in sections:
        match = re.match(r"Finding (\d+)\s*-\s*(.+)", section["heading"])
        if section["level"] != 2 or not match:
            continue
        number = int(match.group(1))
        title = normalize_space(match.group(2))
        body_lines = section_body(lines, section)
        patch_line = ""
        for line in body_lines:
            if line.strip().startswith("**Patch response.**"):
                patch_line = normalize_space(line.replace("**Patch response.**", "").strip())
                break
        excerpt = patch_line or extract_first_paragraph(body_lines)
        if not excerpt:
            excerpt = f"Represent forensic finding {number:03d} as an explicit anti-regression requirement."
        req_type = infer_requirement_type(f"{title} {excerpt}", path.name, default="invariant")
        rows.append(
            make_requirement(
                requirement_id=f"GAP-FINDING-{number:03d}",
                requirement_title=f"Resolve forensic finding {number:03d}: {title}",
                requirement_type=req_type,
                canonicality="derived_from_canonical_gap_closure",
                source_file=path.name,
                source_heading_or_logical_block=section["heading"],
                direct_quote_or_precise_paraphrase=excerpt,
                rationale=(
                    "The forensic audit identifies a defect or omission with implementation impact. "
                    "Task 001 must convert that diagnosis into a machine-readable gap-closure requirement."
                ),
                expected_behavior=(
                    f"Apply the patch direction for finding {number:03d} and keep the defect from reappearing in downstream work."
                ),
                notes="gap_family=forensic_patch_guidance",
            )
        )
    return rows


def build_edge_case_requirements() -> list[dict[str, Any]]:
    rows = []
    for entry in MANDATORY_EDGE_CASE_ROWS:
        rows.append(
            make_requirement(
                requirement_id=entry["requirement_id"],
                requirement_title=entry["requirement_title"],
                requirement_type=entry["requirement_type"],
                canonicality="canonical",
                source_file=entry["source_file"],
                source_heading_or_logical_block=entry["source_heading_or_logical_block"],
                direct_quote_or_precise_paraphrase=entry["direct_quote_or_precise_paraphrase"],
                rationale="Task 001 explicitly required this scattered edge case to become a standalone traceable requirement row.",
                notes="edge_case=true",
            )
        )
    return rows


def enrich_primary_objects(rows: list[dict[str, Any]], contract_names: list[str]) -> dict[str, str]:
    object_to_req = {
        row["requirement_title"].split(" is a required canonical contract")[0]: row["requirement_id"]
        for row in rows
        if row["requirement_id"].startswith("REQ-OBJ-")
    }
    for row in rows:
        searchable = " ".join(
            [
                row["requirement_title"],
                row["source_heading_or_logical_block"],
                row["direct_quote_or_precise_paraphrase"],
                row["expected_behavior"],
            ]
        ).lower()
        primary_objects = [
            name
            for name in contract_names
            if name.lower() in searchable
        ]
        if row["requirement_id"].startswith("REQ-OBJ-"):
            primary_objects = [row["requirement_title"].split(" is a required canonical contract")[0]]
        row["primary_objects"] = primary_objects[:8]
        guards = []
        guard_candidates = [
            "LifecycleCoordinator",
            "IdentityRepairCase",
            "DuplicateCluster",
            "FallbackReviewCase",
            "ExternalConfirmationGate",
            "RouteIntentBinding",
            "CommandSettlementRecord",
            "ReleaseApprovalFreeze",
            "ChannelReleaseFreezeRecord",
            "AssuranceSliceTrustRecord",
            "VisibilityProjectionPolicy",
        ]
        for guard in guard_candidates:
            if guard.lower() in searchable:
                guards.append(guard)
        row["closure_blockers_or_guards"] = guards
    return object_to_req


def enrich_relationships(rows: list[dict[str, Any]], object_to_req: dict[str, str]) -> None:
    for row in rows:
        related = []
        searchable = " ".join(
            [
                row["requirement_title"],
                row["source_heading_or_logical_block"],
                row["direct_quote_or_precise_paraphrase"],
                row["expected_behavior"],
            ]
        ).lower()
        for name, req_id in object_to_req.items():
            if req_id == row["requirement_id"]:
                continue
            if name.lower() in searchable:
                related.append(req_id)
        row["related_requirement_ids"] = sorted(set(related))[:12]


def ensure_flow_coverage(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    searchable_rows = [
        " ".join(
            [
                row["requirement_title"],
                row["direct_quote_or_precise_paraphrase"],
                row["expected_behavior"],
                " ".join(row["primary_objects"]),
            ]
        ).lower()
        for row in rows
    ]
    gap_rows = []
    for token in FLOW_REQUIRED_TOKENS:
        if any(token.lower() in value for value in searchable_rows):
            continue
        gap_rows.append(
            make_requirement(
                requirement_id=f"GAP-FLOW-{slugify(token)}",
                requirement_title=f"Registry coverage gap for audited flow token {token}",
                requirement_type="workflow",
                canonicality="derived_from_canonical_gap_closure",
                source_file="vecells-complete-end-to-end-flow.md",
                source_heading_or_logical_block="Audited baseline introduction",
                direct_quote_or_precise_paraphrase=(
                    f"The audited baseline names {token} as a required object, state, or control seam; "
                    "the registry must carry an explicit row for it."
                ),
                rationale="Task 001 requires every named audited-flow token to be represented or flagged explicitly.",
                notes="gap_family=audited_flow_coverage",
            )
        )
    return gap_rows


def source_sort_rank(source_file: str, manifest_lookup: dict[str, dict[str, Any]]) -> tuple[int, str]:
    entry = manifest_lookup[source_file]
    return (entry["authority_rank"], source_file)


def serialize_row_for_csv(row: dict[str, Any]) -> dict[str, str]:
    serialized = {}
    for field in REQUIREMENT_FIELD_ORDER:
        value = row[field]
        if isinstance(value, list):
            serialized[field] = split_csv_list(value)
        else:
            serialized[field] = str(value)
    return serialized


def write_registry_files(rows: list[dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    jsonl_path = DATA_DIR / "requirement_registry.jsonl"
    csv_path = DATA_DIR / "requirement_registry.csv"
    with jsonl_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=True) + "\n")
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=REQUIREMENT_FIELD_ORDER)
        writer.writeheader()
        for row in rows:
            writer.writerow(serialize_row_for_csv(row))


def write_source_files(manifest: list[dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "source_manifest.json").write_text(
        json.dumps(
            {
                "manifest_id": "vecells_blueprint_source_manifest_v1",
                "source_count": len(manifest),
                "sources": manifest,
            },
            indent=2,
            ensure_ascii=True,
        )
        + "\n",
        encoding="utf-8",
    )
    (DATA_DIR / "source_precedence_policy.json").write_text(
        json.dumps(SOURCE_PRECEDENCE_POLICY, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )


def requirement_bucket(requirement_type: str) -> str:
    if requirement_type in {"functional", "workflow"}:
        return "business capability requirements"
    if requirement_type in {"domain_object", "invariant", "state_machine", "backend", "integration"}:
        return "control-plane requirements"
    if requirement_type in {"runtime_release", "analytics", "test"}:
        return "runtime and release requirements"
    if requirement_type in {"frontend", "accessibility", "content"}:
        return "UI and continuity requirements"
    if requirement_type in {"security", "privacy"}:
        return "safety, identity, and privacy requirements"
    return "audit and assurance requirements"


def classify_gap_theme(title: str) -> str:
    lowered = title.lower()
    if any(token in lowered for token in ["lineage", "submit", "evidence", "identity", "access scope"]):
        return "intake and identity integrity"
    if any(token in lowered for token in ["urgent", "safety", "re-safety", "queue", "approval", "more-info", "closure"]):
        return "safety, triage, and closure control"
    if any(token in lowered for token in ["booking", "waitlist", "hub"]):
        return "booking and network coordination"
    if "pharmacy" in lowered:
        return "pharmacy routing and reconciliation"
    if any(token in lowered for token in ["governance", "runtime", "release", "trust", "watch", "parity", "manifest"]):
        return "runtime, release, and governance"
    if any(token in lowered for token in ["support", "conversation", "record", "continuity", "degraded", "assistive", "visual"]):
        return "continuity, support, and experience proof"
    return "cross-phase control hygiene"


def write_docs(manifest: list[dict[str, Any]], rows: list[dict[str, Any]]) -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    manifest_lookup = {entry["source_file"]: entry for entry in manifest}
    type_counts = Counter(row["requirement_type"] for row in rows)
    canonicality_counts = Counter(row["canonicality"] for row in rows)
    bucket_counts = Counter(requirement_bucket(row["requirement_type"]) for row in rows)
    source_counts = Counter(row["source_file"] for row in rows)
    finding_rows = [row for row in rows if row["requirement_id"].startswith("GAP-FINDING-")]
    edge_rows = [row for row in rows if row["requirement_id"].startswith("REQ-EDGE-")]
    gap_theme_counts = Counter(classify_gap_theme(row["requirement_title"]) for row in finding_rows)

    source_manifest_lines = [
        "# Blueprint source manifest",
        "",
        f"This manifest inventories all {len(manifest)} markdown and Mermaid sources under `blueprint/` and assigns one explicit precedence tier, source role, concern set, and downstream consumer band to each file.",
        "",
        "## Precedence summary",
        "",
        "| Rank | Tier | Conflict rule |",
        "| --- | --- | --- |",
    ]
    for tier in SOURCE_PRECEDENCE_POLICY["tiers"]:
        source_manifest_lines.append(
            f"| {tier['rank']} | `{tier['tier']}` | {tier['conflict_rule']} |"
        )
    source_manifest_lines.extend(
        [
            "",
            "## Source inventory",
            "",
            "| Source | Role | Authority | Primary concerns | Likely consumer bands | Defines |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
    )
    for entry in manifest:
        flags = ", ".join(
            key.replace("defines_", "").replace("_", " ")
            for key, value in entry["definition_flags"].items()
            if value
        )
        source_manifest_lines.append(
            f"| `{entry['relative_path']}` | `{entry['file_role']}` | `{entry['authority_label']}` | "
            f"{'<br>'.join(entry['primary_concerns'])} | {'<br>'.join(entry['dependent_task_bands'])} | {flags or 'none'} |"
        )
    (DOCS_DIR / "01_blueprint_source_manifest.md").write_text(
        "\n".join(source_manifest_lines) + "\n",
        encoding="utf-8",
    )

    overview_lines = [
        "# Requirement registry overview",
        "",
        f"The first-pass registry covers {len(rows)} traceable requirement rows across {len(manifest)} source files. "
        "It combines source-level governing statements, control-priority bullets, Phase 0 named contracts and invariants, phase test gates, audited baseline edge cases, and forensic gap-closure rows.",
        "",
        "## Composition",
        "",
        "| Dimension | Count |",
        "| --- | --- |",
        f"| Canonical requirements | {canonicality_counts.get('canonical', 0)} |",
        f"| Supporting requirements | {canonicality_counts.get('supporting', 0)} |",
        f"| Derived gap-closure requirements | {canonicality_counts.get('derived_from_canonical_gap_closure', 0)} |",
        "",
        "| Requirement type | Count |",
        "| --- | --- |",
    ]
    for req_type, count in sorted(type_counts.items()):
        overview_lines.append(f"| `{req_type}` | {count} |")
    overview_lines.extend(
        [
            "",
            "## Registry guarantees",
            "",
            "- Every markdown and Mermaid source is present in the source manifest.",
            "- Every named Phase 0 contract has a deterministic registry row.",
            "- Mandatory phase test headings are converted into `test` requirements.",
            "- Every forensic finding is represented as a derived gap-closure row.",
            "- Mandatory edge cases from the task prompt are broken out as standalone rows rather than left implied.",
            "",
            "## Highest-signal anchors",
            "",
            "- The canonical backbone remains `SubmissionEnvelope -> SubmissionPromotionRecord -> Request -> RequestLineage` with `LifecycleCoordinator`-owned closure.",
            "- Mutable post-submit behavior is fenced through `RouteIntentBinding`, `CommandActionRecord`, `CommandSettlementRecord`, `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, and `AssuranceSliceTrustRecord`.",
            "- Patient, staff, support, and governance surfaces inherit one shell, visibility, continuity, and recovery grammar instead of phase-local UI conventions.",
            "- Audit findings are treated as mandatory patch requirements, not optional commentary.",
            "",
            "## Top source contributors",
            "",
            "| Source | Registry rows |",
            "| --- | --- |",
        ]
    )
    for source_file, count in source_counts.most_common(12):
        overview_lines.append(f"| `{source_file}` | {count} |")
    (DOCS_DIR / "01_requirement_registry_overview.md").write_text(
        "\n".join(overview_lines) + "\n",
        encoding="utf-8",
    )

    taxonomy_lines = [
        "# Requirement taxonomy",
        "",
        "The registry normalizes individual rows into the six task-driven taxonomy buckets required by Prompt 001. Each bucket keeps its original source traceability and requirement type.",
        "",
        "| Taxonomy bucket | Requirement types | Count |",
        "| --- | --- | --- |",
    ]
    bucket_type_map = defaultdict(list)
    for req_type in sorted(type_counts):
        bucket_type_map[requirement_bucket(req_type)].append(req_type)
    for bucket, count in sorted(bucket_counts.items()):
        taxonomy_lines.append(
            f"| {bucket} | {', '.join(f'`{item}`' for item in sorted(bucket_type_map[bucket]))} | {count} |"
        )
    taxonomy_lines.extend(
        [
            "",
            "## Notes",
            "",
            "- `domain_object`, `invariant`, `state_machine`, `backend`, and `integration` rows form the machine-readable control plane expected by later roadmap tasks.",
            "- `frontend`, `accessibility`, and `content` rows capture shell continuity, artifact posture, semantic coverage, and user-facing communication duties.",
            "- `runtime_release`, `test`, and `assurance` rows preserve the verification ladder, release tuples, and anti-regression controls needed for promotion and conformance gates.",
            "- `derived_from_canonical_gap_closure` rows remain distinct from original prose so later tasks can tell patched requirements from directly stated canonical contracts.",
        ]
    )
    (DOCS_DIR / "01_requirement_taxonomy.md").write_text(
        "\n".join(taxonomy_lines) + "\n",
        encoding="utf-8",
    )

    gap_lines = [
        "# Derived gap register",
        "",
        f"The registry converts {len(finding_rows)} forensic findings into derived gap-closure rows and adds {len(edge_rows)} explicit edge-case rows that the task prompt required to be surfaced even when scattered across multiple documents.",
        "",
        "## Gap themes",
        "",
        "| Theme | Finding count |",
        "| --- | --- |",
    ]
    for theme, count in sorted(gap_theme_counts.items()):
        gap_lines.append(f"| {theme} | {count} |")
    gap_lines.extend(
        [
            "",
            "## Mandatory edge-case coverage",
            "",
            "| Requirement | Source block |",
            "| --- | --- |",
        ]
    )
    for row in edge_rows:
        gap_lines.append(
            f"| `{row['requirement_id']}` {row['requirement_title']} | `{row['source_file']}` / {row['source_heading_or_logical_block']} |"
        )
    gap_lines.extend(
        [
            "",
            "## Assumptions and risks",
            "",
            "- `ASSUMPTION_001`: dependent task-consumer bands in the source manifest are inferred from the current checklist ranges and file scope, because later tasks have not yet produced finer-grained consumption maps.",
            "- `ASSUMPTION_002`: supporting design references (`uiux-skill.md` and `ux-quiet-clarity-redesign.md`) inform interaction language but remain subordinate to canonical shell, accessibility, runtime, and phase contracts.",
            "- `RISK_001`: later tasks may split or rename specific requirement rows once implementation evidence reveals finer bounded-context seams, but they should preserve the current source traceability and stable IDs whenever possible.",
            "",
            "## Open conflicts",
            "",
            "- No unresolved cross-source conflict was left implicit in this first-pass registry. Conflicts that remain are expected to surface in task 002 through the summary reconciliation matrix rather than through silent precedence drift.",
        ]
    )
    (DOCS_DIR / "01_derived_gap_register.md").write_text(
        "\n".join(gap_lines) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    manifest = build_source_manifest()
    manifest_lookup = {entry["source_file"]: entry for entry in manifest}

    rows = []
    rows.extend(build_source_core_requirements(manifest))
    rows.extend(build_control_priority_requirements(manifest))
    contract_rows, contract_names = build_phase0_contract_requirements()
    rows.extend(contract_rows)
    rows.extend(build_phase0_invariant_requirements())
    rows.extend(build_phase_test_requirements(manifest))
    rows.extend(build_edge_case_requirements())
    rows.extend(build_forensic_gap_requirements())

    object_to_req = enrich_primary_objects(rows, contract_names)
    enrich_relationships(rows, object_to_req)
    rows.extend(ensure_flow_coverage(rows))
    object_to_req = enrich_primary_objects(rows, contract_names)
    enrich_relationships(rows, object_to_req)

    deduped = {}
    for row in rows:
        deduped[row["requirement_id"]] = row
    rows = sorted(
        deduped.values(),
        key=lambda row: (
            source_sort_rank(row["source_file"], manifest_lookup),
            row["source_heading_or_logical_block"],
            row["requirement_id"],
        ),
    )

    write_source_files(manifest)
    write_registry_files(rows)
    write_docs(manifest, rows)


if __name__ == "__main__":
    main()
