#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
DESIGN_BUNDLE_PATH = DATA_DIR / "design_contract_publication_bundles.json"
EVENT_CONTRACTS_PATH = DATA_DIR / "canonical_event_contracts.json"
FHIR_CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
RELEASE_PARITY_PATH = DATA_DIR / "release_publication_parity_rules.json"
AUDIT_DISCLOSURE_PATH = DATA_DIR / "audit_event_disclosure_matrix.csv"

AUDIT_SCHEMA_PATH = DATA_DIR / "audit_record_schema.json"
AUDIT_TAXONOMY_PATH = DATA_DIR / "audit_action_taxonomy.csv"
WORM_CLASSES_PATH = DATA_DIR / "worm_retention_classes.json"
AUDIT_FHIR_MATRIX_PATH = DATA_DIR / "audit_to_fhir_companion_matrix.csv"
ADMISSIBILITY_PATH = DATA_DIR / "audit_admissibility_dependencies.json"

STRATEGY_DOC_PATH = DOCS_DIR / "53_audit_and_worm_strategy.md"
CHAIN_DOC_PATH = DOCS_DIR / "53_audit_chain_and_disclosure_model.md"
RETENTION_DOC_PATH = DOCS_DIR / "53_worm_storage_and_retention_boundary.md"
EXPLORER_PATH = DOCS_DIR / "53_audit_ledger_explorer.html"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_audit_and_worm_strategy.py"
SPEC_PATH = TESTS_DIR / "audit-ledger-explorer.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

TASK_ID = "seq_053"
VISUAL_MODE = "Audit_Ledger_Explorer"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the authoritative audit and WORM-ledger strategy so immutable audit truth, "
    "causality, disclosure posture, replay admissibility, and retention protection stay "
    "bound to one append-only audit spine from Phase 0 onward."
)

SOURCE_PRECEDENCE = [
    "prompt/053.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "docs/architecture/10_audit_posture_and_event_disclosure.md",
    "docs/architecture/10_break_glass_and_investigation_scope_rules.md",
    "docs/architecture/10_retention_and_artifact_sensitivity_matrix.md",
    "docs/architecture/15_incident_audit_and_assurance_tooling.md",
    "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
    "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
    "blueprint/phase-0-the-foundation-protocol.md#UIProjectionVisibilityReceipt",
    "blueprint/phase-0-the-foundation-protocol.md#4.5 Command-following read rule",
    "blueprint/phase-0-the-foundation-protocol.md#62H Assurance admissibility",
    "blueprint/platform-runtime-and-release-blueprint.md#immutable audit in the WORM ledger",
    "blueprint/phase-9-the-assurance-ledger.md#AssuranceEvidenceGraphSnapshot",
    "blueprint/phase-9-the-assurance-ledger.md#AssuranceGraphCompletenessVerdict",
    "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
    "blueprint/forensic-audit-findings.md#Finding 102",
    "blueprint/forensic-audit-findings.md#Finding 103",
    "blueprint/forensic-audit-findings.md#Finding 104",
    "blueprint/forensic-audit-findings.md#Finding 105",
    "blueprint/forensic-audit-findings.md#Finding 106",
    "blueprint/forensic-audit-findings.md#Finding 113",
    "blueprint/forensic-audit-findings.md#Finding 115",
    "data/analysis/audit_event_disclosure_matrix.csv",
    "data/analysis/canonical_event_contracts.json",
    "data/analysis/fhir_representation_contracts.json",
    "data/analysis/release_publication_parity_rules.json",
    "data/analysis/design_contract_publication_bundles.json",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && "
        "pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && "
        "pnpm validate:standards"
    ),
    "codegen": (
        "python3 ./tools/analysis/build_monorepo_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_service_scaffold.py && "
        "python3 ./tools/analysis/build_domain_package_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_topology_manifest.py && "
        "python3 ./tools/analysis/build_gateway_surface_map.py && "
        "python3 ./tools/analysis/build_event_registry.py && "
        "python3 ./tools/analysis/build_fhir_representation_contracts.py && "
        "python3 ./tools/analysis/build_frontend_contract_manifests.py && "
        "python3 ./tools/analysis/build_release_freeze_and_parity.py && "
        "python3 ./tools/analysis/build_design_contract_publication.py && "
        "python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",
}
ROOT_SCRIPT_UPDATES = SHARED_ROOT_SCRIPT_UPDATES

PLAYWRIGHT_SCRIPT_UPDATES = {
    "build": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && "
        "node --check audit-ledger-explorer.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js "
        "audit-ledger-explorer.spec.js"
    ),
    "test": (
        "node foundation-shell-gallery.spec.js && "
        "node runtime-topology-atlas.spec.js && "
        "node gateway-surface-studio.spec.js && "
        "node event-registry-studio.spec.js && "
        "node fhir-representation-atlas.spec.js && "
        "node frontend-contract-studio.spec.js && "
        "node release-parity-cockpit.spec.js && "
        "node design-contract-studio.spec.js && "
        "node audit-ledger-explorer.spec.js"
    ),
    "typecheck": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && "
        "node --check audit-ledger-explorer.spec.js"
    ),
    "e2e": (
        "node foundation-shell-gallery.spec.js --run && "
        "node runtime-topology-atlas.spec.js --run && "
        "node gateway-surface-studio.spec.js --run && "
        "node event-registry-studio.spec.js --run && "
        "node fhir-representation-atlas.spec.js --run && "
        "node frontend-contract-studio.spec.js --run && "
        "node release-parity-cockpit.spec.js --run && "
        "node design-contract-studio.spec.js --run && "
        "node audit-ledger-explorer.spec.js --run"
    ),
}

JOIN_REFS = [
    "edgeCorrelationId",
    "routeIntentRef",
    "commandActionRef",
    "commandSettlementRef",
    "uiEventRef",
    "uiEventCausalityFrameRef",
    "uiTransitionSettlementRef",
    "projectionVisibilityRef",
    "selectedAnchorRef",
    "disclosureFenceRef",
]

GRAPH_AUTHORITIES = [
    "AssuranceEvidenceGraphSnapshot",
    "AssuranceGraphCompletenessVerdict",
]

ROUTE_LABELS = {
    "rf_intake_self_service": "Patient self-service intake",
    "rf_intake_telephony_capture": "Telephony capture intake",
    "rf_patient_home": "Patient home",
    "rf_patient_requests": "Patient requests",
    "rf_patient_appointments": "Patient appointments",
    "rf_patient_health_record": "Patient health record",
    "rf_patient_messages": "Patient messages",
    "rf_patient_secure_link_recovery": "Secure-link recovery",
    "rf_patient_embedded_channel": "Embedded NHS App channel",
    "rf_staff_workspace": "Clinical workspace",
    "rf_staff_workspace_child": "Clinical child workspace",
    "rf_support_ticket_workspace": "Support ticket workspace",
    "rf_support_replay_observe": "Support replay observe",
    "rf_hub_queue": "Hub queue",
    "rf_hub_case_management": "Hub case management",
    "rf_pharmacy_console": "Pharmacy console",
    "rf_operations_board": "Operations board",
    "rf_operations_drilldown": "Operations drilldown",
    "rf_governance_shell": "Governance shell",
}

RETENTION_CLASSES: list[OrderedDict[str, Any]] = [
    OrderedDict(
        [
            ("wormRetentionClassId", "WRC_053_AUDIT_JOIN_SPINE"),
            ("label", "Authoritative audit join spine"),
            ("immutabilityMode", "worm_hash_chained"),
            ("wormStorageRequired", True),
            ("hashChainRequired", True),
            ("replayCritical", True),
            ("archiveDisposition", "preserve_forever"),
            ("ordinaryDeletionEligible", False),
            ("deleteReadyProhibited", True),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("coveredActionCategories", ["auth_session", "route_intent", "command_lifecycle", "ui_visibility"]),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
                    "blueprint/phase-0-the-foundation-protocol.md#4.5 Command-following read rule",
                    "prompt/053.md",
                ],
            ),
            (
                "rationale",
                "The canonical audit join must stay WORM and hash-chained because calm success, route reuse, and replay all depend on the same immutable causal tuple.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("wormRetentionClassId", "WRC_053_BREAK_GLASS_DISCLOSURE"),
            ("label", "Break-glass and disclosure widening"),
            ("immutabilityMode", "worm_hash_chained"),
            ("wormStorageRequired", True),
            ("hashChainRequired", True),
            ("replayCritical", True),
            ("archiveDisposition", "preserve_forever"),
            ("ordinaryDeletionEligible", False),
            ("deleteReadyProhibited", True),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("coveredActionCategories", ["break_glass"]),
            (
                "source_refs",
                [
                    "docs/architecture/10_break_glass_and_investigation_scope_rules.md",
                    "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
                ],
            ),
            (
                "rationale",
                "Break-glass widening is always immutable and later reviewable; it cannot fall into normal deletion or mutable activity logs.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("wormRetentionClassId", "WRC_053_RELEASE_GOVERNANCE"),
            ("label", "Release and governance control actions"),
            ("immutabilityMode", "worm_hash_chained"),
            ("wormStorageRequired", True),
            ("hashChainRequired", True),
            ("replayCritical", True),
            ("archiveDisposition", "preserve_forever"),
            ("ordinaryDeletionEligible", False),
            ("deleteReadyProhibited", True),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("coveredActionCategories", ["release_governance"]),
            (
                "source_refs",
                [
                    "blueprint/platform-runtime-and-release-blueprint.md#immutable audit in the WORM ledger",
                    "data/analysis/release_publication_parity_rules.json",
                ],
            ),
            (
                "rationale",
                "Promotion, freeze, watch, widen, and rollback controls must append immutable audit because runtime publication and release parity rely on the same proof set.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("wormRetentionClassId", "WRC_053_EXPORT_AND_REPLAY"),
            ("label", "Replay and investigation export evidence"),
            ("immutabilityMode", "hash_chained_archive_only"),
            ("wormStorageRequired", True),
            ("hashChainRequired", True),
            ("replayCritical", True),
            ("archiveDisposition", "archive_only"),
            ("ordinaryDeletionEligible", False),
            ("deleteReadyProhibited", True),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("coveredActionCategories", ["support_replay", "audit_export"]),
            (
                "source_refs",
                [
                    "docs/architecture/10_audit_posture_and_event_disclosure.md",
                    "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
                    "prompt/053.md",
                ],
            ),
            (
                "rationale",
                "Replay and export remain hash-stable, archive-only derivations of the canonical audit spine; they are never ordinary delete-ready artifacts.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("wormRetentionClassId", "WRC_053_RETENTION_PRESERVATION"),
            ("label", "Retention and preservation controls"),
            ("immutabilityMode", "worm_append_only"),
            ("wormStorageRequired", True),
            ("hashChainRequired", True),
            ("replayCritical", True),
            ("archiveDisposition", "preserve_or_archive"),
            ("ordinaryDeletionEligible", False),
            ("deleteReadyProhibited", True),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("coveredActionCategories", ["retention_governance"]),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#13.3 Conservative retention freeze for high-risk episodes",
                    "blueprint/phase-9-the-assurance-ledger.md#AssuranceEvidenceGraphSnapshot",
                ],
            ),
            (
                "rationale",
                "Freeze, archive, deletion-certificate, and legal-hold posture must retain the original preservation lineage and therefore cannot enter ordinary deletion flow.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("wormRetentionClassId", "WRC_053_RECOVERY_EVIDENCE"),
            ("label", "Recovery and resilience evidence"),
            ("immutabilityMode", "worm_hash_chained"),
            ("wormStorageRequired", True),
            ("hashChainRequired", True),
            ("replayCritical", True),
            ("archiveDisposition", "archive_only"),
            ("ordinaryDeletionEligible", False),
            ("deleteReadyProhibited", True),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("coveredActionCategories", ["recovery_evidence"]),
            (
                "source_refs",
                [
                    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
                    "blueprint/phase-0-the-foundation-protocol.md#62H Assurance admissibility",
                ],
            ),
            (
                "rationale",
                "Restore, failover, and chaos controls must remain replayable against the same audit and admissibility graph used by assurance and export.",
            ),
        ]
    ),
]

TAXONOMY_DEFINITIONS: list[OrderedDict[str, Any]] = [
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_IDENTITY_SESSION_ESTABLISHED"),
            ("actionCode", "identity_session_established"),
            ("actionLabel", "Identity session established"),
            ("actionCategory", "auth_session"),
            ("actorClass", "patient"),
            ("audienceSurface", "audsurf_patient_transaction_recovery"),
            ("routeFamilyRef", "rf_patient_secure_link_recovery"),
            ("targetType", "Session"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_AUDIT_JOIN_SPINE"),
            ("canonicalEventName", "identity.session.established"),
            ("disclosureMatrixRef", "EV_IMMUTABLE_AUDIT_LEDGER"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Session establishment is the patient-facing start of a writable or recovery-capable chain and must append immutable audit before any trusted continuity can appear.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_IDENTITY_SESSION_ROTATED"),
            ("actionCode", "identity_session_rotated"),
            ("actionLabel", "Identity session rotated"),
            ("actionCategory", "auth_session"),
            ("actorClass", "patient"),
            ("audienceSurface", "audsurf_patient_transaction_recovery"),
            ("routeFamilyRef", "rf_patient_secure_link_recovery"),
            ("targetType", "Session"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_AUDIT_JOIN_SPINE"),
            ("canonicalEventName", "identity.session.rotated"),
            ("disclosureMatrixRef", "EV_IMMUTABLE_AUDIT_LEDGER"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Rotation changes active authority and therefore stays on the same immutable audit spine rather than a session-local log.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_IDENTITY_SESSION_TERMINATED"),
            ("actionCode", "identity_session_terminated"),
            ("actionLabel", "Identity session terminated"),
            ("actionCategory", "auth_session"),
            ("actorClass", "patient"),
            ("audienceSurface", "audsurf_patient_transaction_recovery"),
            ("routeFamilyRef", "rf_patient_secure_link_recovery"),
            ("targetType", "Session"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_AUDIT_JOIN_SPINE"),
            ("canonicalEventName", "identity.session.terminated"),
            ("disclosureMatrixRef", "EV_IMMUTABLE_AUDIT_LEDGER"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Termination closes the active security chain and must remain replayable and hash-stable for investigation and reissue review.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_ROUTE_INTENT_ESTABLISHED"),
            ("actionCode", "route_intent_established"),
            ("actionLabel", "Route intent established"),
            ("actionCategory", "route_intent"),
            ("actorClass", "patient"),
            ("audienceSurface", "audsurf_patient_public_entry"),
            ("routeFamilyRef", "rf_intake_self_service"),
            ("targetType", "RouteIntentBinding"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_AUDIT_JOIN_SPINE"),
            ("canonicalEventName", "audit.recorded"),
            ("disclosureMatrixRef", "EV_IMMUTABLE_AUDIT_LEDGER"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
                    "prompt/053.md",
                ],
            ),
            (
                "rationale",
                "Every authoritative writable journey starts by binding the visible shell and route intent to the same audit join key.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_COMMAND_INGESTED"),
            ("actionCode", "command_ingested"),
            ("actionLabel", "Command ingested"),
            ("actionCategory", "command_lifecycle"),
            ("actorClass", "patient"),
            ("audienceSurface", "audsurf_patient_public_entry"),
            ("routeFamilyRef", "rf_intake_self_service"),
            ("targetType", "CommandActionRecord"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_AUDIT_JOIN_SPINE"),
            ("canonicalEventName", "audit.recorded"),
            ("disclosureMatrixRef", "EV_IMMUTABLE_AUDIT_LEDGER"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
                    "blueprint/phase-0-the-foundation-protocol.md#4.1 Command ingest and envelope creation",
                ],
            ),
            (
                "rationale",
                "Command ingestion may not rely on transport acceptance or browser acknowledgement when the authoritative join requires route intent and command refs together.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_COMMAND_SETTLED"),
            ("actionCode", "command_settled"),
            ("actionLabel", "Command settled"),
            ("actionCategory", "command_lifecycle"),
            ("actorClass", "patient"),
            ("audienceSurface", "audsurf_patient_public_entry"),
            ("routeFamilyRef", "rf_intake_self_service"),
            ("targetType", "CommandSettlementRecord"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_AUDIT_JOIN_SPINE"),
            ("canonicalEventName", "audit.recorded"),
            ("disclosureMatrixRef", "EV_IMMUTABLE_AUDIT_LEDGER"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
                    "blueprint/phase-0-the-foundation-protocol.md#4.5 Command-following read rule",
                ],
            ),
            (
                "rationale",
                "Authoritative settlement is distinct from server acceptance and therefore must append the same immutable audit join before calm outcomes are legal.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_PROJECTION_VISIBLE"),
            ("actionCode", "projection_visible"),
            ("actionLabel", "Projection visibility confirmed"),
            ("actionCategory", "ui_visibility"),
            ("actorClass", "system_service"),
            ("audienceSurface", "audsurf_patient_authenticated_portal"),
            ("routeFamilyRef", "rf_patient_requests"),
            ("targetType", "UIProjectionVisibilityReceipt"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_AUDIT_JOIN_SPINE"),
            ("canonicalEventName", "audit.recorded"),
            ("disclosureMatrixRef", "EV_IMMUTABLE_AUDIT_LEDGER"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#UIProjectionVisibilityReceipt",
                    "blueprint/phase-0-the-foundation-protocol.md#4.5 Command-following read rule",
                ],
            ),
            (
                "rationale",
                "Visible shell truth and calm success require the matching visibility receipt and audit record on the same causal chain.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_BREAK_GLASS_USED"),
            ("actionCode", "break_glass_used"),
            ("actionLabel", "Break-glass used"),
            ("actionCategory", "break_glass"),
            ("actorClass", "support_agent"),
            ("audienceSurface", "audsurf_support_workspace"),
            ("routeFamilyRef", "rf_support_replay_observe"),
            ("targetType", "BreakGlassReviewRecord"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_BREAK_GLASS_DISCLOSURE"),
            ("canonicalEventName", "audit.break_glass.used"),
            ("disclosureMatrixRef", "EV_BREAK_GLASS_REVIEW"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "docs/architecture/10_break_glass_and_investigation_scope_rules.md",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Break-glass widening must be queryable, reviewable, and inseparable from the disclosure fence and visible shell that used it.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_SUPPORT_REPLAY_RESTORE_REQUIRED"),
            ("actionCode", "support_replay_restore_required"),
            ("actionLabel", "Support replay restore required"),
            ("actionCategory", "support_replay"),
            ("actorClass", "support_agent"),
            ("audienceSurface", "audsurf_support_workspace"),
            ("routeFamilyRef", "rf_support_replay_observe"),
            ("targetType", "SupportReplaySession"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_EXPORT_AND_REPLAY"),
            ("canonicalEventName", "support.replay.restore.required"),
            ("disclosureMatrixRef", "EV_SUPPORT_REPLAY_VIEW"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Replay restore requirements must stay on the same audit join so support cannot claim a safe restore from accepted-only evidence.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_SUPPORT_REPLAY_RESTORE_SETTLED"),
            ("actionCode", "support_replay_restore_settled"),
            ("actionLabel", "Support replay restore settled"),
            ("actionCategory", "support_replay"),
            ("actorClass", "support_agent"),
            ("audienceSurface", "audsurf_support_workspace"),
            ("routeFamilyRef", "rf_support_replay_observe"),
            ("targetType", "SupportReplayRestoreSettlement"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_EXPORT_AND_REPLAY"),
            ("canonicalEventName", "support.replay.restore.settled"),
            ("disclosureMatrixRef", "EV_SUPPORT_REPLAY_VIEW"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Replay restore settlement must prove the same route-intent, mask scope, selected anchor, and authoritative audit chain that governed recovery.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_RELEASE_CANDIDATE_PUBLISHED"),
            ("actionCode", "release_candidate_published"),
            ("actionLabel", "Release candidate published"),
            ("actionCategory", "release_governance"),
            ("actorClass", "governance_reviewer"),
            ("audienceSurface", "audsurf_governance_admin"),
            ("routeFamilyRef", "rf_governance_shell"),
            ("targetType", "ReleaseCandidate"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_RELEASE_GOVERNANCE"),
            ("canonicalEventName", "release.candidate.published"),
            ("disclosureMatrixRef", "EV_ASSURANCE_LEDGER_ENTRY"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "data/analysis/release_publication_parity_rules.json",
                    "blueprint/platform-runtime-and-release-blueprint.md#immutable audit in the WORM ledger",
                ],
            ),
            (
                "rationale",
                "Publishing a release candidate is a governance control action and therefore must append immutable audit rather than relying on pipeline acknowledgements.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_RELEASE_FREEZE_OPENED"),
            ("actionCode", "release_freeze_opened"),
            ("actionLabel", "Release freeze opened"),
            ("actionCategory", "release_governance"),
            ("actorClass", "governance_reviewer"),
            ("audienceSurface", "audsurf_governance_admin"),
            ("routeFamilyRef", "rf_governance_shell"),
            ("targetType", "ReleaseApprovalFreeze"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_RELEASE_GOVERNANCE"),
            ("canonicalEventName", "release.freeze.opened"),
            ("disclosureMatrixRef", "EV_ASSURANCE_LEDGER_ENTRY"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "data/analysis/release_publication_parity_rules.json",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Freeze posture affects live publishability and therefore must stay on the same append-only audit spine used by runtime truth and governance review.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_RELEASE_WAVE_STARTED"),
            ("actionCode", "release_wave_started"),
            ("actionLabel", "Release wave started"),
            ("actionCategory", "release_governance"),
            ("actorClass", "release_manager"),
            ("audienceSurface", "audsurf_operations_console"),
            ("routeFamilyRef", "rf_operations_board"),
            ("targetType", "WaveActionRecord"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_RELEASE_GOVERNANCE"),
            ("canonicalEventName", "release.wave.started"),
            ("disclosureMatrixRef", "EV_ASSURANCE_LEDGER_ENTRY"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "data/analysis/release_publication_parity_rules.json",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Wave start is an authoritative control-plane mutation and may not rely on ops dashboards or deploy tooling alone.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_RELEASE_WAVE_WIDENED"),
            ("actionCode", "release_wave_widened"),
            ("actionLabel", "Release wave widened"),
            ("actionCategory", "release_governance"),
            ("actorClass", "release_manager"),
            ("audienceSurface", "audsurf_operations_console"),
            ("routeFamilyRef", "rf_operations_board"),
            ("targetType", "WaveActionRecord"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_RELEASE_GOVERNANCE"),
            ("canonicalEventName", "release.wave.widened"),
            ("disclosureMatrixRef", "EV_ASSURANCE_LEDGER_ENTRY"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "data/analysis/release_publication_parity_rules.json",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Widening changes blast radius and therefore must append immutable audit and retain the reviewed release tuple under the same chain.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_RELEASE_ROLLBACK_STARTED"),
            ("actionCode", "release_rollback_started"),
            ("actionLabel", "Release rollback started"),
            ("actionCategory", "release_governance"),
            ("actorClass", "release_manager"),
            ("audienceSurface", "audsurf_operations_console"),
            ("routeFamilyRef", "rf_operations_board"),
            ("targetType", "WaveActionRecord"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_RELEASE_GOVERNANCE"),
            ("canonicalEventName", "release.rollback.started"),
            ("disclosureMatrixRef", "EV_ASSURANCE_LEDGER_ENTRY"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "data/analysis/release_publication_parity_rules.json",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Rollback authority must remain replay-safe and immutable because it directly affects live continuity and recovery posture.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_AUDIT_EXPORT_GENERATED"),
            ("actionCode", "audit_export_generated"),
            ("actionLabel", "Governed audit export generated"),
            ("actionCategory", "audit_export"),
            ("actorClass", "governance_reviewer"),
            ("audienceSurface", "audsurf_operations_console"),
            ("routeFamilyRef", "rf_operations_drilldown"),
            ("targetType", "InvestigationBundleExport"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_EXPORT_AND_REPLAY"),
            ("canonicalEventName", "audit.export.generated"),
            ("disclosureMatrixRef", "EV_INVESTIGATION_EXPORT_BUNDLE"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "docs/architecture/10_audit_posture_and_event_disclosure.md",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            (
                "rationale",
                "Investigation export is authoritative only when the same audit spine and admissibility graph prove the bundle and its disclosure ceiling.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_RETENTION_FREEZE_CREATED"),
            ("actionCode", "retention_freeze_created"),
            ("actionLabel", "Retention freeze created"),
            ("actionCategory", "retention_governance"),
            ("actorClass", "governance_reviewer"),
            ("audienceSurface", "audsurf_governance_admin"),
            ("routeFamilyRef", "rf_governance_shell"),
            ("targetType", "RetentionFreezeRecord"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_RETENTION_PRESERVATION"),
            ("canonicalEventName", "audit.recorded"),
            ("disclosureMatrixRef", "EV_ASSURANCE_LEDGER_ENTRY"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#13.3 Conservative retention freeze for high-risk episodes",
                    "prompt/053.md",
                ],
            ),
            (
                "rationale",
                "Preservation controls must append immutable audit and stay tied to the same graph the archive and deletion flows later consume.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditActionTaxonomyId", "AAT_053_RESILIENCE_ACTION_APPLIED"),
            ("actionCode", "resilience_action_applied"),
            ("actionLabel", "Resilience action applied"),
            ("actionCategory", "recovery_evidence"),
            ("actorClass", "platform_operator"),
            ("audienceSurface", "audsurf_operations_console"),
            ("routeFamilyRef", "rf_operations_drilldown"),
            ("targetType", "ResilienceActionSettlement"),
            ("wormAppendRequired", True),
            ("hashChainRequired", True),
            ("replayCriticality", "high"),
            ("retentionClassRef", "WRC_053_RECOVERY_EVIDENCE"),
            ("canonicalEventName", "audit.recorded"),
            ("disclosureMatrixRef", "EV_ASSURANCE_LEDGER_ENTRY"),
            ("requiredJoinRefs", JOIN_REFS),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("canonicalTruthRule", "AuditRecord_canonical_companion_only"),
            (
                "source_refs",
                [
                    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
                    "blueprint/phase-0-the-foundation-protocol.md#62E Restore, failover, and chaos completion",
                ],
            ),
            (
                "rationale",
                "Recovery controls must bind immutable audit, the current route intent, and the same completeness graph used by resilience evidence artifacts.",
            ),
        ]
    ),
]

SAMPLE_RECORD_PLAN: list[OrderedDict[str, Any]] = [
    OrderedDict(
        [
            ("auditRecordId", "AR_053_IDENTITY_SESSION_ESTABLISHED_01"),
            ("actionCode", "identity_session_established"),
            ("actorRef", "actor://patient/nhs-login/session-claim"),
            ("actingContextRef", "ACTCTX_053_PATIENT_SECURE_LINK_RECOVERY"),
            ("actingContextLabel", "Patient secure-link recovery"),
            ("targetId", "session://patient/secure-link/0001"),
            ("reasonCode", "auth_callback_verified"),
            ("selectedAnchorRef", "anchor://patient-recovery/sign-in"),
            ("shellDecisionClass", "created"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "admissible"),
            ("defectState", "clean"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_AUDIT_TIMELINE_RECONSTRUCTION"]),
            ("note", "Patient callback establishes the first immutable join for the recovery shell."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_ROUTE_INTENT_ESTABLISHED_01"),
            ("actionCode", "route_intent_established"),
            ("actorRef", "actor://patient/public-entry/browser"),
            ("actingContextRef", "ACTCTX_053_PATIENT_PUBLIC_ENTRY"),
            ("actingContextLabel", "Patient public entry"),
            ("targetId", "route-intent://patient/intake/self-service"),
            ("reasonCode", "self_service_entry_routed"),
            ("selectedAnchorRef", "anchor://intake/request-type"),
            ("shellDecisionClass", "created"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "admissible"),
            ("defectState", "clean"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_AUDIT_TIMELINE_RECONSTRUCTION"]),
            ("note", "Route intent becomes authoritative before any calm intake state can be trusted."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_COMMAND_INGESTED_01"),
            ("actionCode", "command_ingested"),
            ("actorRef", "actor://patient/public-entry/browser"),
            ("actingContextRef", "ACTCTX_053_PATIENT_PUBLIC_ENTRY"),
            ("actingContextLabel", "Patient public entry"),
            ("targetId", "command://request/submit/0001"),
            ("reasonCode", "submission_requested"),
            ("selectedAnchorRef", "anchor://intake/review-submit"),
            ("shellDecisionClass", "reused"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "admissible"),
            ("defectState", "clean"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_AUDIT_TIMELINE_RECONSTRUCTION"]),
            ("note", "Transport acceptance is not authoritative; command ingest still binds the full audit join."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_COMMAND_SETTLED_01"),
            ("actionCode", "command_settled"),
            ("actorRef", "actor://service/command-api"),
            ("actingContextRef", "ACTCTX_053_PATIENT_PUBLIC_ENTRY"),
            ("actingContextLabel", "Patient public entry"),
            ("targetId", "settlement://request/submit/0001"),
            ("reasonCode", "submission_authoritative"),
            ("selectedAnchorRef", "anchor://intake/review-submit"),
            ("shellDecisionClass", "reused"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "admissible"),
            ("defectState", "clean"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_AUDIT_TIMELINE_RECONSTRUCTION"]),
            ("note", "Command settlement distinguishes authoritative outcome from provisional acknowledgement."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_PROJECTION_VISIBLE_01"),
            ("actionCode", "projection_visible"),
            ("actorRef", "actor://service/projection-worker"),
            ("actingContextRef", "ACTCTX_053_PATIENT_PORTAL"),
            ("actingContextLabel", "Authenticated patient portal"),
            ("targetId", "projection://patient/requests/receipt"),
            ("reasonCode", "quiet_receipt_visible"),
            ("selectedAnchorRef", "anchor://patient-requests/latest"),
            ("shellDecisionClass", "restored"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "admissible"),
            ("defectState", "clean"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_AUDIT_TIMELINE_RECONSTRUCTION"]),
            ("note", "Visible receipt proof and immutable audit now share the same causal token."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_BREAK_GLASS_USED_01"),
            ("actionCode", "break_glass_used"),
            ("actorRef", "actor://support/agent-007"),
            ("actingContextRef", "ACTCTX_053_SUPPORT_BREAK_GLASS"),
            ("actingContextLabel", "Support replay with break-glass coverage"),
            ("targetId", "break-glass://ticket/TK-2048"),
            ("reasonCode", "same_ticket_identity_dispute"),
            ("selectedAnchorRef", "anchor://support/timeline"),
            ("shellDecisionClass", "frozen"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "admissible"),
            ("defectState", "watch"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_BREAK_GLASS_REVIEW", "AUDDEP_053_SUPPORT_REPLAY_SESSION"]),
            ("note", "Heightened access stays immutable and remains tied to the exact shell and disclosure fence that widened scope."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_SUPPORT_REPLAY_RESTORE_REQUIRED_01"),
            ("actionCode", "support_replay_restore_required"),
            ("actorRef", "actor://support/agent-007"),
            ("actingContextRef", "ACTCTX_053_SUPPORT_REPLAY"),
            ("actingContextLabel", "Support replay observe"),
            ("targetId", "replay://request/REQ-2048/restore-required"),
            ("reasonCode", "continuity_revalidation_pending"),
            ("selectedAnchorRef", "anchor://support/replay"),
            ("shellDecisionClass", "recovered"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "admissible"),
            ("defectState", "clean"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_SUPPORT_REPLAY_SESSION"]),
            ("note", "Replay cannot restore live support work until the same audit and completeness graph prove the chain."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_SUPPORT_REPLAY_RESTORE_SETTLED_01"),
            ("actionCode", "support_replay_restore_settled"),
            ("actorRef", "actor://support/agent-007"),
            ("actingContextRef", "ACTCTX_053_SUPPORT_REPLAY"),
            ("actingContextLabel", "Support replay observe"),
            ("targetId", "replay://request/REQ-2048/restore-settled"),
            ("reasonCode", "continuity_revalidated"),
            ("selectedAnchorRef", "anchor://support/replay"),
            ("shellDecisionClass", "restored"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "admissible"),
            ("defectState", "clean"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_SUPPORT_REPLAY_SESSION"]),
            ("note", "Restore settlement is authoritative only after the same immutable chain confirms replay-safe continuity."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_RELEASE_CANDIDATE_PUBLISHED_01"),
            ("actionCode", "release_candidate_published"),
            ("actorRef", "actor://governance/release-reviewer"),
            ("actingContextRef", "ACTCTX_053_GOVERNANCE_RELEASE_REVIEW"),
            ("actingContextLabel", "Governance release review"),
            ("targetId", "release://candidate/RC_PREPROD_V1"),
            ("reasonCode", "preprod_candidate_published"),
            ("selectedAnchorRef", "anchor://governance/release-candidate"),
            ("shellDecisionClass", "created"),
            ("releaseCandidateRef", "RC_PREPROD_V1"),
            ("admissibilityState", "watch"),
            ("defectState", "watch"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_RELEASE_WATCH_EXCEPTION_PACK"]),
            ("note", "Release publication is immutable but still watch-bound until the same continuity and assurance graph stay exact."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_RELEASE_FREEZE_OPENED_01"),
            ("actionCode", "release_freeze_opened"),
            ("actorRef", "actor://governance/release-reviewer"),
            ("actingContextRef", "ACTCTX_053_GOVERNANCE_RELEASE_REVIEW"),
            ("actingContextLabel", "Governance release review"),
            ("targetId", "freeze://production/live-freeze"),
            ("reasonCode", "production_freeze_armed"),
            ("selectedAnchorRef", "anchor://governance/freeze"),
            ("shellDecisionClass", "frozen"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "admissible"),
            ("defectState", "clean"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_RELEASE_WATCH_EXCEPTION_PACK"]),
            ("note", "Freeze posture is stored as contract law, not as an ops-side deployment annotation."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_RELEASE_WAVE_STARTED_01"),
            ("actionCode", "release_wave_started"),
            ("actorRef", "actor://release/manager-01"),
            ("actingContextRef", "ACTCTX_053_OPERATIONS_WATCH"),
            ("actingContextLabel", "Operations release watch"),
            ("targetId", "wave://production/main"),
            ("reasonCode", "wave_watch_opened"),
            ("selectedAnchorRef", "anchor://ops/watch"),
            ("shellDecisionClass", "reused"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "watch"),
            ("defectState", "watch"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_RELEASE_WATCH_EXCEPTION_PACK"]),
            ("note", "Wave watch must reference the same continuity and admissibility proof as governance review."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_AUDIT_EXPORT_GENERATED_01"),
            ("actionCode", "audit_export_generated"),
            ("actorRef", "actor://governance/export-reviewer"),
            ("actingContextRef", "ACTCTX_053_AUDIT_EXPORT"),
            ("actingContextLabel", "Governed investigation export"),
            ("targetId", "export://audit/investigation-bundle/0001"),
            ("reasonCode", "investigation_bundle_requested"),
            ("selectedAnchorRef", "anchor://ops/audit/export"),
            ("shellDecisionClass", "reused"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "blocked"),
            ("defectState", "blocked"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_AUDIT_EXPORT_BUNDLE"]),
            ("note", "Export stays blocked whenever the completeness graph cannot prove the exact admissible cut."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_RETENTION_FREEZE_CREATED_01"),
            ("actionCode", "retention_freeze_created"),
            ("actorRef", "actor://governance/privacy-reviewer"),
            ("actingContextRef", "ACTCTX_053_RETENTION_GOVERNANCE"),
            ("actingContextLabel", "Retention governance"),
            ("targetId", "freeze://request/REQ-2048"),
            ("reasonCode", "identity_dispute_preservation"),
            ("selectedAnchorRef", "anchor://governance/preservation"),
            ("shellDecisionClass", "frozen"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "blocked"),
            ("defectState", "blocked"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_RETENTION_DECISION_CHAIN", "AUDDEP_053_ARCHIVE_MANIFEST_ADMISSIBILITY", "AUDDEP_053_DELETION_CERTIFICATE_ADMISSIBILITY"]),
            ("note", "Retention preservation blocks delete-ready posture until the same admissibility graph proves the scope and chain are complete."),
        ]
    ),
    OrderedDict(
        [
            ("auditRecordId", "AR_053_RESILIENCE_ACTION_APPLIED_01"),
            ("actionCode", "resilience_action_applied"),
            ("actorRef", "actor://ops/platform-operator"),
            ("actingContextRef", "ACTCTX_053_RECOVERY_CONTROL"),
            ("actingContextLabel", "Recovery control room"),
            ("targetId", "resilience://restore-run/RUN-0007"),
            ("reasonCode", "restore_rehearsal_applied"),
            ("selectedAnchorRef", "anchor://ops/recovery"),
            ("shellDecisionClass", "recovered"),
            ("releaseCandidateRef", "RC_PRODUCTION_V1"),
            ("admissibilityState", "watch"),
            ("defectState", "watch"),
            ("admissibilityDependencyRefs", ["AUDDEP_053_RECOVERY_EVIDENCE_BUNDLE"]),
            ("note", "Recovery evidence is recorded on the same audit spine but remains watch-bound until the evidence graph refresh completes."),
        ]
    ),
]

ADMISSIBILITY_DEFINITIONS: list[OrderedDict[str, Any]] = [
    OrderedDict(
        [
            ("auditAdmissibilityDependencyId", "AUDDEP_053_AUDIT_TIMELINE_RECONSTRUCTION"),
            ("consumerFlow", "audit_investigation"),
            ("consumerLabel", "Audit investigation timeline reconstruction"),
            ("currentState", "admissible"),
            ("linkedRecordRefs", [
                "AR_053_IDENTITY_SESSION_ESTABLISHED_01",
                "AR_053_ROUTE_INTENT_ESTABLISHED_01",
                "AR_053_COMMAND_INGESTED_01",
                "AR_053_COMMAND_SETTLED_01",
                "AR_053_PROJECTION_VISIBLE_01",
            ]),
            ("consumerRouteFamilyRefs", ["rf_operations_drilldown", "rf_support_replay_observe"]),
            ("requiredAuthoritativeRefs", ["AuditRecord", "UIProjectionVisibilityReceipt", "UITransitionSettlementRecord"]),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("requiredContinuityEvidenceRefs", ["ExperienceContinuityControlEvidence"]),
            ("requiredReleaseTupleRefs", ["RC_PRODUCTION_V1", "dcpb::patient_authenticated_shell::planned"]),
            ("requiredFhirCompanionRefs", ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"]),
            ("blockedReasonCodes", []),
            ("failureMode", "read_only_recovery"),
            (
                "source_refs",
                [
                    "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
                    "blueprint/phase-0-the-foundation-protocol.md#62H Assurance admissibility",
                ],
            ),
            (
                "rationale",
                "Audit search and timeline reconstruction consume the append-only audit chain plus the current admissibility graph rather than local joins.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditAdmissibilityDependencyId", "AUDDEP_053_SUPPORT_REPLAY_SESSION"),
            ("consumerFlow", "support_replay"),
            ("consumerLabel", "Support replay and restore"),
            ("currentState", "admissible"),
            ("linkedRecordRefs", [
                "AR_053_BREAK_GLASS_USED_01",
                "AR_053_SUPPORT_REPLAY_RESTORE_REQUIRED_01",
                "AR_053_SUPPORT_REPLAY_RESTORE_SETTLED_01",
            ]),
            ("consumerRouteFamilyRefs", ["rf_support_replay_observe"]),
            ("requiredAuthoritativeRefs", ["AuditRecord", "SupportReplaySession", "SupportReplayRestoreSettlement"]),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("requiredContinuityEvidenceRefs", ["SupportContinuityEvidenceProjection"]),
            ("requiredReleaseTupleRefs", ["RC_PRODUCTION_V1", "dcpb::support_workspace::planned"]),
            ("requiredFhirCompanionRefs", ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"]),
            ("blockedReasonCodes", []),
            ("failureMode", "read_only_recovery"),
            (
                "source_refs",
                [
                    "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
                    "blueprint/forensic-audit-findings.md#Finding 102",
                ],
            ),
            (
                "rationale",
                "Support replay restore depends on the same immutable audit join, disclosure fence, and graph completeness verdict as export and investigation.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditAdmissibilityDependencyId", "AUDDEP_053_BREAK_GLASS_REVIEW"),
            ("consumerFlow", "break_glass_review"),
            ("consumerLabel", "Break-glass adequacy review"),
            ("currentState", "watch"),
            ("linkedRecordRefs", ["AR_053_BREAK_GLASS_USED_01"]),
            ("consumerRouteFamilyRefs", ["rf_support_replay_observe", "rf_governance_shell"]),
            ("requiredAuthoritativeRefs", ["AuditRecord", "BreakGlassReviewRecord", "InvestigationScopeEnvelope"]),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("requiredContinuityEvidenceRefs", ["SupportContinuityEvidenceProjection"]),
            ("requiredReleaseTupleRefs", ["RC_PRODUCTION_V1", "dcpb::support_workspace::planned"]),
            ("requiredFhirCompanionRefs", ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"]),
            ("blockedReasonCodes", ["DRIFT_053_BREAK_GLASS_FOLLOW_UP_BURDEN_OPEN"]),
            ("failureMode", "read_only_review"),
            (
                "source_refs",
                [
                    "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
                    "docs/architecture/10_break_glass_and_investigation_scope_rules.md",
                ],
            ),
            (
                "rationale",
                "Break-glass review remains watch-bound while reviewer burden is open, but still consumes the same audit spine and admissibility graph.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditAdmissibilityDependencyId", "AUDDEP_053_RELEASE_WATCH_EXCEPTION_PACK"),
            ("consumerFlow", "release_watch"),
            ("consumerLabel", "Release watch and governance continuity pack"),
            ("currentState", "watch"),
            ("linkedRecordRefs", [
                "AR_053_RELEASE_CANDIDATE_PUBLISHED_01",
                "AR_053_RELEASE_FREEZE_OPENED_01",
                "AR_053_RELEASE_WAVE_STARTED_01",
            ]),
            ("consumerRouteFamilyRefs", ["rf_governance_shell", "rf_operations_board"]),
            ("requiredAuthoritativeRefs", ["AuditRecord", "ReleaseCandidate", "ReleasePublicationParityRecord"]),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("requiredContinuityEvidenceRefs", ["GovernanceContinuityEvidenceBundle", "OpsContinuityEvidenceSlice"]),
            ("requiredReleaseTupleRefs", ["RC_PREPROD_V1", "RC_PRODUCTION_V1", "dcpb::operations_console::planned", "dcpb::governance_admin::planned"]),
            ("requiredFhirCompanionRefs", ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"]),
            ("blockedReasonCodes", ["DRIFT_053_CONTINUITY_EVIDENCE_REFRESH_PENDING"]),
            ("failureMode", "watch_only"),
            (
                "source_refs",
                [
                    "blueprint/forensic-audit-findings.md#Finding 103",
                    "blueprint/forensic-audit-findings.md#Finding 104",
                    "blueprint/forensic-audit-findings.md#Finding 106",
                ],
            ),
            (
                "rationale",
                "Governance review and ops watch stay on one continuity-proof loop and therefore remain watch-bound until the current evidence cut is exact.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditAdmissibilityDependencyId", "AUDDEP_053_AUDIT_EXPORT_BUNDLE"),
            ("consumerFlow", "audit_export"),
            ("consumerLabel", "Governed investigation export bundle"),
            ("currentState", "blocked"),
            ("linkedRecordRefs", ["AR_053_AUDIT_EXPORT_GENERATED_01"]),
            ("consumerRouteFamilyRefs", ["rf_operations_drilldown"]),
            ("requiredAuthoritativeRefs", ["AuditRecord", "InvestigationTimelineReconstruction", "ArtifactPresentationContract"]),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("requiredContinuityEvidenceRefs", ["ExperienceContinuityControlEvidence"]),
            ("requiredReleaseTupleRefs", ["RC_PRODUCTION_V1", "dcpb::operations_console::planned"]),
            ("requiredFhirCompanionRefs", ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"]),
            ("blockedReasonCodes", ["BLOCKER_053_EXPORT_REQUIRES_COMPLETE_GRAPH"]),
            ("failureMode", "export_blocked"),
            (
                "source_refs",
                [
                    "blueprint/phase-9-the-assurance-ledger.md#AssuranceEvidenceGraphSnapshot",
                    "blueprint/phase-9-the-assurance-ledger.md#AssuranceGraphCompletenessVerdict",
                    "prompt/053.md",
                ],
            ),
            (
                "rationale",
                "Export cannot claim authoritative completeness without the same graph snapshot and verdict that govern replay and retention.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditAdmissibilityDependencyId", "AUDDEP_053_RETENTION_DECISION_CHAIN"),
            ("consumerFlow", "retention_governance"),
            ("consumerLabel", "Retention decision and freeze lineage"),
            ("currentState", "blocked"),
            ("linkedRecordRefs", ["AR_053_RETENTION_FREEZE_CREATED_01"]),
            ("consumerRouteFamilyRefs", ["rf_governance_shell"]),
            ("requiredAuthoritativeRefs", ["AuditRecord", "RetentionFreezeRecord", "FreezeBundleManifest"]),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("requiredContinuityEvidenceRefs", ["ExperienceContinuityControlEvidence"]),
            ("requiredReleaseTupleRefs", ["RC_PRODUCTION_V1", "dcpb::governance_admin::planned"]),
            ("requiredFhirCompanionRefs", ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"]),
            ("blockedReasonCodes", ["BLOCKER_053_RETENTION_GRAPH_INCOMPLETE"]),
            ("failureMode", "archive_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#13.3 Conservative retention freeze for high-risk episodes",
                    "blueprint/phase-9-the-assurance-ledger.md#AssuranceEvidenceGraphSnapshot",
                ],
            ),
            (
                "rationale",
                "Retention and freeze decisions must consume the same graph the audit, replay, export, and archive flows later validate.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditAdmissibilityDependencyId", "AUDDEP_053_ARCHIVE_MANIFEST_ADMISSIBILITY"),
            ("consumerFlow", "archive_manifest"),
            ("consumerLabel", "Archive manifest admissibility"),
            ("currentState", "blocked"),
            ("linkedRecordRefs", ["AR_053_RETENTION_FREEZE_CREATED_01"]),
            ("consumerRouteFamilyRefs", ["rf_governance_shell"]),
            ("requiredAuthoritativeRefs", ["AuditRecord", "ArchiveManifest", "RetentionDecision"]),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("requiredContinuityEvidenceRefs", ["ExperienceContinuityControlEvidence"]),
            ("requiredReleaseTupleRefs", ["RC_PRODUCTION_V1", "dcpb::governance_admin::planned"]),
            ("requiredFhirCompanionRefs", ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"]),
            ("blockedReasonCodes", ["BLOCKER_053_ARCHIVE_NEEDS_UNSUPERSEDED_GRAPH"]),
            ("failureMode", "archive_only"),
            (
                "source_refs",
                [
                    "blueprint/phase-9-the-assurance-ledger.md#AssuranceGraphCompletenessVerdict",
                    "prompt/053.md",
                ],
            ),
            (
                "rationale",
                "Archive manifests are blocked until the same completeness verdict proves the preservation lineage is unsuperseded and in scope.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditAdmissibilityDependencyId", "AUDDEP_053_DELETION_CERTIFICATE_ADMISSIBILITY"),
            ("consumerFlow", "deletion_certificate"),
            ("consumerLabel", "Deletion-certificate admissibility"),
            ("currentState", "blocked"),
            ("linkedRecordRefs", ["AR_053_RETENTION_FREEZE_CREATED_01"]),
            ("consumerRouteFamilyRefs", ["rf_governance_shell"]),
            ("requiredAuthoritativeRefs", ["AuditRecord", "DeletionCertificate", "RetentionDecision"]),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("requiredContinuityEvidenceRefs", ["ExperienceContinuityControlEvidence"]),
            ("requiredReleaseTupleRefs", ["RC_PRODUCTION_V1", "dcpb::governance_admin::planned"]),
            ("requiredFhirCompanionRefs", ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"]),
            ("blockedReasonCodes", ["BLOCKER_053_HASH_CHAINED_CLASSES_NEVER_DELETE_READY"]),
            ("failureMode", "blocked"),
            (
                "source_refs",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#62H Assurance admissibility",
                    "prompt/053.md",
                ],
            ),
            (
                "rationale",
                "Delete-ready posture is forbidden for WORM and hash-chained audit classes even when later lifecycle automation exists.",
            ),
        ]
    ),
    OrderedDict(
        [
            ("auditAdmissibilityDependencyId", "AUDDEP_053_RECOVERY_EVIDENCE_BUNDLE"),
            ("consumerFlow", "recovery_evidence"),
            ("consumerLabel", "Recovery evidence bundle"),
            ("currentState", "watch"),
            ("linkedRecordRefs", ["AR_053_RESILIENCE_ACTION_APPLIED_01"]),
            ("consumerRouteFamilyRefs", ["rf_operations_drilldown"]),
            ("requiredAuthoritativeRefs", ["AuditRecord", "ResilienceActionSettlement", "RecoveryEvidenceArtifact"]),
            ("requiredGraphAuthorityRefs", GRAPH_AUTHORITIES),
            ("requiredContinuityEvidenceRefs", ["OpsContinuityEvidenceSlice"]),
            ("requiredReleaseTupleRefs", ["RC_PRODUCTION_V1", "dcpb::operations_console::planned"]),
            ("requiredFhirCompanionRefs", ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"]),
            ("blockedReasonCodes", ["RISK_053_RECOVERY_GRAPH_REFRESH_PENDING"]),
            ("failureMode", "watch_only"),
            (
                "source_refs",
                [
                    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
                    "blueprint/forensic-audit-findings.md#Finding 113",
                ],
            ),
            (
                "rationale",
                "Recovery evidence must stay on the same graph and audit spine as export, replay, and retention; stale graph refresh leaves it watch-bound.",
            ),
        ]
    ),
]

DEFECTS = [
    OrderedDict(
        [
            ("defectId", "BLOCKER_053_EXPORT_REQUIRES_COMPLETE_GRAPH"),
            ("state", "blocked"),
            ("consumerFlow", "audit_export"),
            ("summary", "Investigation export cannot claim completeness without the current graph snapshot and completeness verdict."),
        ]
    ),
    OrderedDict(
        [
            ("defectId", "BLOCKER_053_RETENTION_GRAPH_INCOMPLETE"),
            ("state", "blocked"),
            ("consumerFlow", "retention_governance"),
            ("summary", "Retention preservation remains archive-only until the admissibility graph proves the exact preserved scope."),
        ]
    ),
    OrderedDict(
        [
            ("defectId", "BLOCKER_053_HASH_CHAINED_CLASSES_NEVER_DELETE_READY"),
            ("state", "blocked"),
            ("consumerFlow", "deletion_certificate"),
            ("summary", "WORM and hash-chained audit classes may never enter ordinary deletion posture."),
        ]
    ),
    OrderedDict(
        [
            ("defectId", "DRIFT_053_BREAK_GLASS_FOLLOW_UP_BURDEN_OPEN"),
            ("state", "watch"),
            ("consumerFlow", "break_glass_review"),
            ("summary", "Break-glass review is still watch-bound while follow-up burden and reason adequacy remain open."),
        ]
    ),
    OrderedDict(
        [
            ("defectId", "RISK_053_RECOVERY_GRAPH_REFRESH_PENDING"),
            ("state", "watch"),
            ("consumerFlow", "recovery_evidence"),
            ("summary", "Recovery evidence remains watch-only until the graph refresh proves the latest rehearsal and continuity artifacts."),
        ]
    ),
]

ASSUMPTIONS = [
    "ASSUMPTION_053_HASH_CLOCKS_USE_UTC_SECOND_PRECISION",
    "ASSUMPTION_053_SUPPORT_REPLAY_REUSES_THE_EXISTING_INVESTIGATION_SCOPE_ENVELOPE",
    "ASSUMPTION_053_FHIR_AUDIT_COMPANIONS_PUBLISH_ONLY_MASKED_HASH_JOIN_OUTPUTS",
]


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def stable_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def stable_hash(value: Any) -> str:
    return sha256_text(stable_json(value))


def merkle_root(hashes: list[str]) -> str:
    if not hashes:
        return sha256_text("")
    level = sorted(hashes)
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        level = [
            sha256_text(level[index] + level[index + 1]) for index in range(0, len(level), 2)
        ]
    return level[0]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def load_context() -> dict[str, Any]:
    frontend = read_json(FRONTEND_MANIFEST_PATH)
    design = read_json(DESIGN_BUNDLE_PATH)
    events = read_json(EVENT_CONTRACTS_PATH)
    fhir = read_json(FHIR_CONTRACTS_PATH)
    release = read_json(RELEASE_PARITY_PATH)
    disclosure_rows = read_csv(AUDIT_DISCLOSURE_PATH)

    frontend_by_surface = {
        row["audienceSurface"]: row for row in frontend["frontendContractManifests"]
    }
    route_to_surface = {
        route_ref: row["audienceSurface"]
        for row in frontend["frontendContractManifests"]
        for route_ref in row["routeFamilyRefs"]
    }
    route_to_bundle = {
        route_ref: row["designContractPublicationBundleRef"]
        for row in frontend["frontendContractManifests"]
        for route_ref in row["routeFamilyRefs"]
    }
    bundle_by_id = {
        row["designContractPublicationBundleId"]: row
        for row in design["designContractPublicationBundles"]
    }
    event_by_name = {
        row["eventName"]: row for row in events["contracts"]
    }
    release_by_id = {
        row["releaseId"]: row for row in release["releaseCandidates"]
    }
    disclosure_by_id = {row["event_family_id"]: row for row in disclosure_rows}
    fhir_companion = next(
        row for row in fhir["contracts"] if row["representationPurpose"] == "audit_companion"
    )

    return {
        "frontend": frontend,
        "design": design,
        "events": events,
        "fhir": fhir,
        "release": release,
        "disclosure_rows": disclosure_rows,
        "frontend_by_surface": frontend_by_surface,
        "route_to_surface": route_to_surface,
        "route_to_bundle": route_to_bundle,
        "bundle_by_id": bundle_by_id,
        "event_by_name": event_by_name,
        "release_by_id": release_by_id,
        "disclosure_by_id": disclosure_by_id,
        "fhir_companion": fhir_companion,
    }


def build_schema() -> dict[str, Any]:
    array_of_strings = {"type": "array", "items": {"type": "string"}, "minItems": 1}
    audit_record_properties: OrderedDict[str, Any] = OrderedDict(
        [
            ("auditRecordId", {"type": "string"}),
            ("chainSequence", {"type": "integer", "minimum": 1}),
            ("actorClass", {"type": "string", "enum": ["patient", "support_agent", "governance_reviewer", "release_manager", "platform_operator", "system_service"]}),
            ("actorRef", {"type": "string"}),
            ("actingContextRef", {"type": "string"}),
            ("actingContextLabel", {"type": "string"}),
            ("actionTaxonomyRef", {"type": "string"}),
            ("actionCode", {"type": "string"}),
            ("actionLabel", {"type": "string"}),
            ("actionCategory", {"type": "string"}),
            ("routeFamilyRef", {"type": "string"}),
            ("routeFamilyLabel", {"type": "string"}),
            ("audienceSurface", {"type": "string"}),
            ("audienceSurfaceLabel", {"type": "string"}),
            ("targetType", {"type": "string"}),
            ("targetId", {"type": "string"}),
            ("reasonCode", {"type": "string"}),
            ("edgeCorrelationId", {"type": "string"}),
            ("routeIntentRef", {"type": "string"}),
            ("commandActionRef", {"type": "string"}),
            ("commandSettlementRef", {"type": "string"}),
            ("uiEventRef", {"type": "string"}),
            ("uiEventCausalityFrameRef", {"type": "string"}),
            ("uiTransitionSettlementRef", {"type": "string"}),
            ("projectionVisibilityRef", {"type": "string"}),
            ("selectedAnchorRef", {"type": "string"}),
            (
                "shellDecisionClass",
                {
                    "type": "string",
                    "enum": ["created", "reused", "restored", "recovered", "replaced", "frozen"],
                },
            ),
            ("disclosureFenceRef", {"type": "string"}),
            ("disclosureMatrixRef", {"type": "string"}),
            ("sourceIpDisposition", {"type": "string", "enum": ["hashed_descriptor", "service_identity_only"]}),
            ("sourceIpHash", {"type": "string"}),
            ("userAgentDisposition", {"type": "string", "enum": ["hashed_descriptor", "service_identity_only"]}),
            ("userAgentHash", {"type": "string"}),
            ("timestamp", {"type": "string"}),
            ("timestampPrecision", {"type": "string", "enum": ["second"]}),
            ("previousHash", {"type": "string"}),
            ("hash", {"type": "string"}),
            ("chainIntegrityState", {"type": "string", "enum": ["exact", "broken"]}),
            ("retentionClassRef", {"type": "string"}),
            ("designContractPublicationBundleRef", {"type": "string"}),
            ("designContractDigestRef", {"type": "string"}),
            ("releaseCandidateRef", {"type": "string"}),
            ("releaseApprovalFreezeRef", {"type": "string"}),
            ("fhirRepresentationContractRef", {"type": "string"}),
            ("fhirCompanionTupleRef", {"type": "string"}),
            ("admissibilityState", {"type": "string", "enum": ["admissible", "watch", "blocked"]}),
            ("defectState", {"type": "string", "enum": ["clean", "watch", "blocked"]}),
            ("admissibilityDependencyRefs", array_of_strings),
            ("source_refs", array_of_strings),
            ("rationale", {"type": "string"}),
            ("supersedesAuditRecordRef", {"type": "string"}),
        ]
    )

    audit_record_required = [
        "auditRecordId",
        "chainSequence",
        "actorClass",
        "actorRef",
        "actingContextRef",
        "actionTaxonomyRef",
        "actionCode",
        "actionCategory",
        "routeFamilyRef",
        "audienceSurface",
        "targetType",
        "targetId",
        "reasonCode",
        "edgeCorrelationId",
        "routeIntentRef",
        "commandActionRef",
        "commandSettlementRef",
        "uiEventRef",
        "uiEventCausalityFrameRef",
        "uiTransitionSettlementRef",
        "projectionVisibilityRef",
        "selectedAnchorRef",
        "shellDecisionClass",
        "disclosureFenceRef",
        "sourceIpDisposition",
        "sourceIpHash",
        "userAgentDisposition",
        "userAgentHash",
        "timestamp",
        "timestampPrecision",
        "previousHash",
        "hash",
        "chainIntegrityState",
        "retentionClassRef",
        "fhirRepresentationContractRef",
        "admissibilityState",
        "defectState",
        "admissibilityDependencyRefs",
        "source_refs",
        "rationale",
    ]

    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.example/schemas/audit-record.schema.json",
        "title": "Vecells AuditRecord schema",
        "type": "object",
        "required": audit_record_required,
        "properties": audit_record_properties,
        "$defs": {
            "auditRecord": {
                "type": "object",
                "required": audit_record_required,
                "properties": audit_record_properties,
            },
            "wormRetentionClass": {
                "type": "object",
                "required": [
                    "wormRetentionClassId",
                    "label",
                    "immutabilityMode",
                    "wormStorageRequired",
                    "hashChainRequired",
                    "replayCritical",
                    "archiveDisposition",
                    "ordinaryDeletionEligible",
                    "deleteReadyProhibited",
                    "requiredGraphAuthorityRefs",
                    "coveredActionCategories",
                    "source_refs",
                    "rationale",
                ],
                "properties": {
                    "wormRetentionClassId": {"type": "string"},
                    "label": {"type": "string"},
                    "immutabilityMode": {
                        "type": "string",
                        "enum": ["worm_hash_chained", "worm_append_only", "hash_chained_archive_only"],
                    },
                    "wormStorageRequired": {"type": "boolean"},
                    "hashChainRequired": {"type": "boolean"},
                    "replayCritical": {"type": "boolean"},
                    "archiveDisposition": {"type": "string", "enum": ["preserve_forever", "preserve_or_archive", "archive_only"]},
                    "ordinaryDeletionEligible": {"type": "boolean"},
                    "deleteReadyProhibited": {"type": "boolean"},
                    "requiredGraphAuthorityRefs": array_of_strings,
                    "coveredActionCategories": array_of_strings,
                    "source_refs": array_of_strings,
                    "rationale": {"type": "string"},
                },
            },
            "admissibilityDependency": {
                "type": "object",
                "required": [
                    "auditAdmissibilityDependencyId",
                    "consumerFlow",
                    "consumerLabel",
                    "currentState",
                    "linkedRecordRefs",
                    "consumerRouteFamilyRefs",
                    "requiredAuthoritativeRefs",
                    "requiredGraphAuthorityRefs",
                    "requiredContinuityEvidenceRefs",
                    "requiredReleaseTupleRefs",
                    "requiredFhirCompanionRefs",
                    "blockedReasonCodes",
                    "failureMode",
                    "source_refs",
                    "rationale",
                ],
                "properties": {
                    "auditAdmissibilityDependencyId": {"type": "string"},
                    "consumerFlow": {"type": "string"},
                    "consumerLabel": {"type": "string"},
                    "currentState": {"type": "string", "enum": ["admissible", "watch", "blocked"]},
                    "linkedRecordRefs": array_of_strings,
                    "consumerRouteFamilyRefs": array_of_strings,
                    "requiredAuthoritativeRefs": array_of_strings,
                    "requiredGraphAuthorityRefs": array_of_strings,
                    "requiredContinuityEvidenceRefs": array_of_strings,
                    "requiredReleaseTupleRefs": array_of_strings,
                    "requiredFhirCompanionRefs": array_of_strings,
                    "blockedReasonCodes": {"type": "array", "items": {"type": "string"}},
                    "failureMode": {"type": "string"},
                    "source_refs": array_of_strings,
                    "rationale": {"type": "string"},
                },
            },
        },
    }


def build_worm_payload() -> dict[str, Any]:
    worm_count = sum(1 for row in RETENTION_CLASSES if row["wormStorageRequired"])
    hash_chain_count = sum(1 for row in RETENTION_CLASSES if row["hashChainRequired"])
    replay_critical_count = sum(1 for row in RETENTION_CLASSES if row["replayCritical"])
    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "worm_retention_class_count": len(RETENTION_CLASSES),
            "worm_storage_required_count": worm_count,
            "hash_chained_class_count": hash_chain_count,
            "replay_critical_class_count": replay_critical_count,
        },
        "wormRetentionClasses": RETENTION_CLASSES,
    }


def build_taxonomy_rows(context: dict[str, Any]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for definition in TAXONOMY_DEFINITIONS:
        event_contract = context["event_by_name"].get(definition["canonicalEventName"])
        rows.append(
            {
                "audit_action_taxonomy_id": definition["auditActionTaxonomyId"],
                "action_code": definition["actionCode"],
                "action_label": definition["actionLabel"],
                "action_category": definition["actionCategory"],
                "actor_class": definition["actorClass"],
                "audience_surface": definition["audienceSurface"],
                "route_family_ref": definition["routeFamilyRef"],
                "target_type": definition["targetType"],
                "worm_append_required": "true" if definition["wormAppendRequired"] else "false",
                "hash_chain_required": "true" if definition["hashChainRequired"] else "false",
                "replay_criticality": definition["replayCriticality"],
                "retention_class_ref": definition["retentionClassRef"],
                "canonical_event_contract_ref": event_contract["canonicalEventContractId"] if event_contract else "",
                "disclosure_matrix_ref": definition["disclosureMatrixRef"],
                "required_join_refs": ";".join(definition["requiredJoinRefs"]),
                "required_graph_authority_refs": ";".join(definition["requiredGraphAuthorityRefs"]),
                "canonical_truth_rule": definition["canonicalTruthRule"],
                "source_refs": ";".join(definition["source_refs"]),
                "rationale": definition["rationale"],
            }
        )
    return rows


def build_companion_rows(context: dict[str, Any], taxonomy_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    fhir_contract = context["fhir_companion"]
    audit_event_profile = next(
        profile["profileCanonicalUrl"]
        for profile in fhir_contract["resourceProfiles"]
        if profile["resourceType"] == "AuditEvent"
    )
    provenance_profile = next(
        profile["profileCanonicalUrl"]
        for profile in fhir_contract["resourceProfiles"]
        if profile["resourceType"] == "Provenance"
    )
    rows: list[dict[str, str]] = []
    for taxonomy in taxonomy_rows:
        disclosure_ref = taxonomy["disclosure_matrix_ref"]
        disclosure_policy = context["disclosure_by_id"][disclosure_ref]["redaction_policy_ref"]
        rows.append(
            {
                "audit_to_fhir_companion_matrix_id": f"AFCM_053_{taxonomy['action_code'].upper()}",
                "audit_action_taxonomy_id": taxonomy["audit_action_taxonomy_id"],
                "action_code": taxonomy["action_code"],
                "fhir_representation_contract_ref": fhir_contract["fhirRepresentationContractId"],
                "audit_event_profile": audit_event_profile,
                "provenance_profile": provenance_profile,
                "companion_generation_mode": "derived_on_append_only",
                "canonical_truth_state": "AuditRecord_canonical_companion_only",
                "admissibility_binding": "same_graph_as_export_replay_retention",
                "disclosure_ceiling_ref": disclosure_policy,
                "source_refs": ";".join(
                    sorted(
                        {
                            "data/analysis/fhir_representation_contracts.json",
                            "docs/architecture/10_audit_posture_and_event_disclosure.md",
                        }
                    )
                ),
                "rationale": "FHIR AuditEvent and Provenance are companion outputs derived from immutable audit and may never replace the internal audit join.",
            }
        )
    return rows


def build_sample_records(
    context: dict[str, Any],
    taxonomy_rows: list[dict[str, str]],
    companion_rows: list[dict[str, str]],
) -> list[dict[str, Any]]:
    taxonomy_by_code = {row["action_code"]: row for row in taxonomy_rows}
    companion_by_code = {row["action_code"]: row for row in companion_rows}
    base_time = datetime.fromisoformat(f"{CAPTURED_ON}T08:00:00+00:00")
    records: list[dict[str, Any]] = []
    previous_hash = "GENESIS_053_AUDIT_JOIN_SPINE"
    for index, plan in enumerate(SAMPLE_RECORD_PLAN, start=1):
        taxonomy = taxonomy_by_code[plan["actionCode"]]
        bundle_ref = context["route_to_bundle"][taxonomy["route_family_ref"]]
        bundle = context["bundle_by_id"][bundle_ref]
        release_candidate = context["release_by_id"][plan["releaseCandidateRef"]]
        companion = companion_by_code[plan["actionCode"]]
        disclosure_row = context["disclosure_by_id"][taxonomy["disclosure_matrix_ref"]]
        timestamp = (base_time + timedelta(minutes=7 * (index - 1))).replace(microsecond=0).isoformat()
        source_ip_seed = f"{plan['actorRef']}::{plan['actionCode']}::source-ip"
        user_agent_seed = f"{plan['actorRef']}::{plan['actionCode']}::user-agent"
        source_ip_disposition = (
            "service_identity_only" if taxonomy["actor_class"] == "system_service" else "hashed_descriptor"
        )
        user_agent_disposition = (
            "service_identity_only" if taxonomy["actor_class"] == "system_service" else "hashed_descriptor"
        )
        record: dict[str, Any] = OrderedDict(
            [
                ("auditRecordId", plan["auditRecordId"]),
                ("chainSequence", index),
                ("actorClass", taxonomy["actor_class"]),
                ("actorRef", plan["actorRef"]),
                ("actingContextRef", plan["actingContextRef"]),
                ("actingContextLabel", plan["actingContextLabel"]),
                ("actionTaxonomyRef", taxonomy["audit_action_taxonomy_id"]),
                ("actionCode", plan["actionCode"]),
                ("actionLabel", taxonomy["action_label"]),
                ("actionCategory", taxonomy["action_category"]),
                ("routeFamilyRef", taxonomy["route_family_ref"]),
                ("routeFamilyLabel", ROUTE_LABELS[taxonomy["route_family_ref"]]),
                ("audienceSurface", taxonomy["audience_surface"]),
                (
                    "audienceSurfaceLabel",
                    context["frontend_by_surface"][taxonomy["audience_surface"]]["audienceSurfaceLabel"],
                ),
                ("targetType", taxonomy["target_type"]),
                ("targetId", plan["targetId"]),
                ("reasonCode", plan["reasonCode"]),
                ("edgeCorrelationId", f"edge::053::{plan['auditRecordId'].lower()}"),
                ("routeIntentRef", f"route-intent::053::{taxonomy['route_family_ref']}::{index:02d}"),
                ("commandActionRef", f"car::053::{plan['auditRecordId'].lower()}"),
                ("commandSettlementRef", f"csr::053::{plan['auditRecordId'].lower()}"),
                ("uiEventRef", f"uie::053::{plan['auditRecordId'].lower()}"),
                ("uiEventCausalityFrameRef", f"uicf::053::{plan['auditRecordId'].lower()}"),
                ("uiTransitionSettlementRef", f"uits::053::{plan['auditRecordId'].lower()}"),
                ("projectionVisibilityRef", f"uipr::053::{plan['auditRecordId'].lower()}"),
                ("selectedAnchorRef", plan["selectedAnchorRef"]),
                ("shellDecisionClass", plan["shellDecisionClass"]),
                ("disclosureFenceRef", f"fence::053::{taxonomy['disclosure_matrix_ref'].lower()}"),
                ("disclosureMatrixRef", taxonomy["disclosure_matrix_ref"]),
                ("sourceIpDisposition", source_ip_disposition),
                ("sourceIpHash", sha256_text(source_ip_seed)),
                ("userAgentDisposition", user_agent_disposition),
                ("userAgentHash", sha256_text(user_agent_seed)),
                ("timestamp", timestamp),
                ("timestampPrecision", "second"),
                ("previousHash", previous_hash),
                ("chainIntegrityState", "exact"),
                ("retentionClassRef", taxonomy["retention_class_ref"]),
                ("designContractPublicationBundleRef", bundle_ref),
                ("designContractDigestRef", bundle["designContractDigestRef"]),
                ("releaseCandidateRef", plan["releaseCandidateRef"]),
                ("releaseApprovalFreezeRef", release_candidate["releaseApprovalFreezeRef"]),
                ("fhirRepresentationContractRef", companion["fhir_representation_contract_ref"]),
                ("fhirCompanionTupleRef", companion["audit_to_fhir_companion_matrix_id"]),
                ("admissibilityState", plan["admissibilityState"]),
                ("defectState", plan["defectState"]),
                ("admissibilityDependencyRefs", plan["admissibilityDependencyRefs"]),
                (
                    "source_refs",
                    sorted(
                        {
                            *taxonomy["source_refs"].split(";"),
                            "data/analysis/design_contract_publication_bundles.json",
                            "data/analysis/release_publication_parity_rules.json",
                        }
                    ),
                ),
                ("rationale", plan["note"]),
            ]
        )
        hash_input = OrderedDict(
            [
                ("auditRecordId", record["auditRecordId"]),
                ("chainSequence", record["chainSequence"]),
                ("actorClass", record["actorClass"]),
                ("actorRef", record["actorRef"]),
                ("actingContextRef", record["actingContextRef"]),
                ("actionTaxonomyRef", record["actionTaxonomyRef"]),
                ("actionCode", record["actionCode"]),
                ("targetType", record["targetType"]),
                ("targetId", record["targetId"]),
                ("reasonCode", record["reasonCode"]),
                ("edgeCorrelationId", record["edgeCorrelationId"]),
                ("routeIntentRef", record["routeIntentRef"]),
                ("commandActionRef", record["commandActionRef"]),
                ("commandSettlementRef", record["commandSettlementRef"]),
                ("uiEventRef", record["uiEventRef"]),
                ("uiEventCausalityFrameRef", record["uiEventCausalityFrameRef"]),
                ("uiTransitionSettlementRef", record["uiTransitionSettlementRef"]),
                ("projectionVisibilityRef", record["projectionVisibilityRef"]),
                ("selectedAnchorRef", record["selectedAnchorRef"]),
                ("shellDecisionClass", record["shellDecisionClass"]),
                ("disclosureFenceRef", record["disclosureFenceRef"]),
                ("sourceIpHash", record["sourceIpHash"]),
                ("userAgentHash", record["userAgentHash"]),
                ("timestamp", record["timestamp"]),
                ("previousHash", record["previousHash"]),
                ("retentionClassRef", record["retentionClassRef"]),
                ("fhirRepresentationContractRef", record["fhirRepresentationContractRef"]),
            ]
        )
        record["hash"] = stable_hash(hash_input)
        previous_hash = record["hash"]
        assert disclosure_row["redaction_policy_ref"]
        records.append(record)
    return records


def build_admissibility_payload(
    context: dict[str, Any],
    taxonomy_rows: list[dict[str, str]],
    companion_rows: list[dict[str, str]],
    records: list[dict[str, Any]],
) -> dict[str, Any]:
    chain_hashes = [record["hash"] for record in records]
    chain_merkle_root = merkle_root(chain_hashes)
    blocked_dependencies = [
        row for row in ADMISSIBILITY_DEFINITIONS if row["currentState"] == "blocked"
    ]
    watch_dependencies = [
        row for row in ADMISSIBILITY_DEFINITIONS if row["currentState"] == "watch"
    ]
    replay_critical_actions = [
        row for row in taxonomy_rows if row["replay_criticality"] == "high"
    ]
    worm_actions = [
        row for row in taxonomy_rows if row["worm_append_required"] == "true"
    ]
    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {
            "frontend_manifest_count": len(context["frontend"]["frontendContractManifests"]),
            "design_bundle_count": len(context["design"]["designContractPublicationBundles"]),
            "canonical_event_contract_count": len(context["events"]["contracts"]),
            "fhir_contract_count": len(context["fhir"]["contracts"]),
            "release_candidate_count": len(context["release"]["releaseCandidates"]),
            "audit_disclosure_family_count": len(context["disclosure_rows"]),
        },
        "summary": {
            "audit_record_count": len(records),
            "action_taxonomy_count": len(taxonomy_rows),
            "worm_retention_class_count": len(RETENTION_CLASSES),
            "fhir_companion_row_count": len(companion_rows),
            "admissibility_dependency_count": len(ADMISSIBILITY_DEFINITIONS),
            "worm_append_required_count": len(worm_actions),
            "replay_critical_action_count": len(replay_critical_actions),
            "chain_break_count": len([row for row in records if row["chainIntegrityState"] == "broken"]),
            "inadmissible_dependency_count": len(blocked_dependencies),
            "watch_dependency_count": len(watch_dependencies),
            "blocked_record_count": len([row for row in records if row["admissibilityState"] == "blocked"]),
        },
        "assumptions": ASSUMPTIONS,
        "defects": DEFECTS,
        "authoritativeAuditJoin": {
            "joinId": "AAJ_053_AUTHORITATIVE_AUDIT_JOIN_V1",
            "canonicalRecordType": "AuditRecord",
            "requiredJoinRefs": JOIN_REFS,
            "requiredProjectionCompanion": "UIProjectionVisibilityReceipt",
            "requiredCommandCompanion": "CommandSettlementRecord",
            "requiredDisclosureCompanion": "UITelemetryDisclosureFence",
            "canonicalTruthRule": "Server acceptance, local acknowledgement, and detached analytics may never replace the immutable audit join.",
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
                "prompt/053.md",
            ],
        },
        "hashChainPolicy": {
            "auditHashPolicyId": "AHP_053_AUDIT_JOIN_CHAIN_V1",
            "canonicalizationMode": "RFC8785_JCS",
            "hashAlgorithm": "SHA-256",
            "previousHashMode": "chain_to_prior_entry_hash",
            "chainRootMode": "Merkle(sorted(auditRecord.hash))",
            "supersessionModel": "append_only_supersedes_reference",
            "integrityVerificationMode": "recompute_hash_and_previous_hash_then_compare_merkle_root",
            "entryHashInputFields": [
                "auditRecordId",
                "chainSequence",
                "actorClass",
                "actorRef",
                "actingContextRef",
                "actionTaxonomyRef",
                "actionCode",
                "targetType",
                "targetId",
                "reasonCode",
                "edgeCorrelationId",
                "routeIntentRef",
                "commandActionRef",
                "commandSettlementRef",
                "uiEventRef",
                "uiEventCausalityFrameRef",
                "uiTransitionSettlementRef",
                "projectionVisibilityRef",
                "selectedAnchorRef",
                "shellDecisionClass",
                "disclosureFenceRef",
                "sourceIpHash",
                "userAgentHash",
                "timestamp",
                "previousHash",
                "retentionClassRef",
                "fhirRepresentationContractRef",
            ],
            "chainMerkleRoot": chain_merkle_root,
            "graphAuthorityRefs": GRAPH_AUTHORITIES,
            "failureState": "blocked",
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
                "blueprint/phase-9-the-assurance-ledger.md#AssuranceEvidenceGraphSnapshot",
            ],
        },
        "sampleAuditRecords": records,
        "admissibilityDependencies": ADMISSIBILITY_DEFINITIONS,
        "graphAuthorities": [
            OrderedDict(
                [
                    ("ref", "AssuranceEvidenceGraphSnapshot"),
                    ("hashRef", "graphHash"),
                    ("purpose", "authoritative admissibility graph for audit, replay, export, retention, and recovery completeness"),
                ]
            ),
            OrderedDict(
                [
                    ("ref", "AssuranceGraphCompletenessVerdict"),
                    ("hashRef", "decisionHash"),
                    ("purpose", "fail-closed completeness verdict over the current admissible graph"),
                ]
            ),
        ],
        "fhirCompanionPolicy": {
            "canonicalContractRef": context["fhir_companion"]["fhirRepresentationContractId"],
            "canonicalTruthState": "AuditRecord_canonical_companion_only",
            "allowedResourceTypes": context["fhir_companion"]["allowedResourceTypes"],
            "requiredProfileCanonicalUrls": context["fhir_companion"]["requiredProfileCanonicalUrls"],
            "source_refs": context["fhir_companion"]["source_refs"],
        },
    }


def build_strategy_doc(
    admissibility_payload: dict[str, Any],
    worm_payload: dict[str, Any],
) -> str:
    summary = admissibility_payload["summary"]
    return "\n".join(
        [
            "# 53 Audit And WORM Strategy",
            "",
            "## Summary",
            "",
            (
                f"Seq_053 publishes `{summary['audit_record_count']}` sample append-only `AuditRecord` rows, "
                f"`{summary['action_taxonomy_count']}` authoritative action-taxonomy rows, "
                f"`{worm_payload['summary']['worm_retention_class_count']}` WORM retention classes, and "
                f"`{summary['admissibility_dependency_count']}` audit admissibility dependencies."
            ),
            "",
            "## Authoritative Audit Join",
            "",
            "- `AuditRecord` is the canonical append-only join across ingress correlation, route intent, command action, command settlement, visible shell decision, and disclosure posture.",
            "- Server acceptance, browser acknowledgement, and detached analytics events are never authoritative substitutes for the audit join.",
            "- Calm or continuity-preserving UI states rely on the same `UIProjectionVisibilityReceipt` and `AuditRecord` chain before they can read as authoritative.",
            "",
            "## WORM And Hash-Chain Law",
            "",
            "- Hashing uses `SHA-256(JCS(record))` with `previousHash` continuity and one Merkle root over the sorted record hashes.",
            "- WORM and hash-chained classes are contract law, not storage folklore; every published class explicitly prohibits ordinary deletion.",
            "- Replay, export, retention, archive, deletion-certificate, and recovery evidence all consume the same Phase 9 admissibility graph authorities.",
            "",
            "## Companion FHIR Policy",
            "",
            "- Internal `AuditRecord` remains canonical runtime truth.",
            "- FHIR `AuditEvent` and `Provenance` are derived companion artifacts only and may never replace immutable audit joins or replay admissibility.",
            "",
            "## Gap Closures",
            "",
            "- Findings `102-106`: continuity, replay, governance, and watch flows now bind to the same immutable audit spine instead of commentary or local shell state.",
            "- Finding `113`: export, replay, retention, archive, and recovery now share one admissibility dependency model instead of local evidence lists.",
            "- Finding `115`: artifact or export handoff now remains governed by the same audit join, disclosure fence, and graph completeness posture.",
            "",
            "## Source Anchors",
            "",
            "- `blueprint/phase-0-the-foundation-protocol.md#AuditRecord`",
            "- `blueprint/phase-0-the-foundation-protocol.md#UIProjectionVisibilityReceipt`",
            "- `blueprint/phase-0-the-foundation-protocol.md#62H Assurance admissibility`",
            "- `blueprint/platform-runtime-and-release-blueprint.md#immutable audit in the WORM ledger`",
            "- `blueprint/phase-9-the-assurance-ledger.md#AssuranceEvidenceGraphSnapshot`",
            "- `blueprint/phase-9-the-assurance-ledger.md#AssuranceGraphCompletenessVerdict`",
            "",
        ]
    )


def build_chain_doc(
    admissibility_payload: dict[str, Any],
    companion_rows: list[dict[str, str]],
) -> str:
    hash_policy = admissibility_payload["hashChainPolicy"]
    first_record = admissibility_payload["sampleAuditRecords"][0]
    return "\n".join(
        [
            "# 53 Audit Chain And Disclosure Model",
            "",
            "## Hash Chain",
            "",
            f"- Canonicalization mode: `{hash_policy['canonicalizationMode']}`.",
            f"- Hash algorithm: `{hash_policy['hashAlgorithm']}`.",
            f"- Chain root: `{hash_policy['chainMerkleRoot']}`.",
            f"- Genesis previous-hash seed: `{first_record['previousHash']}`.",
            "",
            "## Required Audit Join Fields",
            "",
            "| Field | Why it is mandatory |",
            "| --- | --- |",
            "| `edgeCorrelationId` | Immutable ingress join key across browser intent, command dispatch, projection visibility, and audit. |",
            "| `routeIntentRef` | Prevents route-local shell state from standing in for authoritative route authority. |",
            "| `commandActionRef` + `commandSettlementRef` | Binds accepted and authoritative command truth into the same immutable chain. |",
            "| `uiEventRef` + `uiEventCausalityFrameRef` + `uiTransitionSettlementRef` | Keeps UI continuity and settlement explainable rather than inferred from telemetry. |",
            "| `projectionVisibilityRef` | Proves what became visible before calm success, replay restore, or frozen posture. |",
            "| `selectedAnchorRef` + `shellDecisionClass` | Preserves same-shell continuity and restore semantics in replay and investigation. |",
            "| `disclosureFenceRef` | Makes minimum-necessary disclosure part of canonical audit truth. |",
            "",
            "## Supersession And Disclosure",
            "",
            "- Supersession is append-only: a later audit row may point to `supersedesAuditRecordRef`, but earlier rows are never mutated in place.",
            "- Source IP and user-agent handling stay hashed or service-identity-only; raw diagnostic payloads are not required for authoritative replay.",
            "- Disclosure fences and masking policy refs remain first-class so audit and export do not widen beyond the approved scope envelope.",
            "",
            "## FHIR Companion Matrix",
            "",
            f"- Companion rows generated: `{len(companion_rows)}`.",
            "- Every companion row asserts `AuditRecord_canonical_companion_only` and uses the same active audit-companion FHIR contract.",
            "",
        ]
    )


def build_retention_doc(worm_payload: dict[str, Any]) -> str:
    lines = [
        "# 53 WORM Storage And Retention Boundary",
        "",
        "## Retention Classes",
        "",
        "| Class | Mode | Archive disposition | Replay-critical | Delete-ready allowed |",
        "| --- | --- | --- | --- | --- |",
    ]
    for row in worm_payload["wormRetentionClasses"]:
        lines.append(
            f"| {row['wormRetentionClassId']} | {row['immutabilityMode']} | {row['archiveDisposition']} | "
            f"{'yes' if row['replayCritical'] else 'no'} | {'yes' if row['ordinaryDeletionEligible'] else 'no'} |"
        )
    lines.extend(
        [
            "",
            "## Boundary Rules",
            "",
            "- WORM and hash-chained classes never enter ordinary deletion posture.",
            "- Replay, export, archive, deletion-certificate, and recovery proof all remain blocked when the current admissibility graph is missing, stale, cross-scope, or superseded ambiguously.",
            "- Archive-only derivative exports remain governed by the same graph and canonical audit chain; they never become alternate audit truth.",
            "",
        ]
    )
    return "\n".join(lines)


def build_explorer_html() -> str:
    template = """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vecells Audit Ledger Explorer</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #F6F8FB;
        --rail: #EEF2F7;
        --panel: #FFFFFF;
        --inset: #F4F6FB;
        --text-strong: #0F172A;
        --text: #1E293B;
        --muted: #667085;
        --border-subtle: #E2E8F0;
        --border: #CBD5E1;
        --primary: #3559E6;
        --audit: #334155;
        --disclosure: #0EA5A4;
        --warning: #C98900;
        --blocked: #C24141;
        --shadow: 0 22px 40px rgba(15, 23, 42, 0.07);
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(53, 89, 230, 0.06), transparent 26%),
          radial-gradient(circle at 78% 16%, rgba(14, 165, 164, 0.06), transparent 26%),
          linear-gradient(180deg, #F8FAFD, var(--canvas));
        color: var(--text);
      }
      .app {
        max-width: 1500px;
        margin: 0 auto;
        padding: 18px;
      }
      .masthead {
        position: sticky;
        top: 0;
        z-index: 10;
        min-height: 72px;
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 12px 16px;
        border: 1px solid var(--border-subtle);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(12px);
        box-shadow: var(--shadow);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 228px;
      }
      .mark {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        border: 1px solid rgba(15, 23, 42, 0.1);
        background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,246,251,0.96));
        display: grid;
        place-items: center;
        color: var(--audit);
      }
      .brand small,
      .metric span,
      .eyebrow,
      .label {
        display: block;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .brand strong {
        display: block;
        font-size: 16px;
        color: var(--text-strong);
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(120px, 1fr));
        gap: 12px;
        flex: 1;
      }
      .metric {
        padding: 12px 14px;
        border-radius: 18px;
        border: 1px solid var(--border-subtle);
        background: rgba(255, 255, 255, 0.84);
      }
      .metric strong {
        display: block;
        font-size: 22px;
        color: var(--text-strong);
      }
      .layout {
        display: grid;
        grid-template-columns: 292px minmax(0, 1fr) 396px;
        gap: 18px;
        margin-top: 18px;
        align-items: start;
      }
      .rail, .center, .inspector {
        border-radius: 28px;
        border: 1px solid var(--border-subtle);
        background: var(--panel);
        box-shadow: var(--shadow);
      }
      .rail {
        padding: 18px;
        background: linear-gradient(180deg, rgba(255,255,255,0.96), var(--rail));
      }
      .filters {
        display: grid;
        gap: 12px;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 13px;
        color: var(--text-strong);
      }
      select {
        height: 44px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: var(--panel);
        color: var(--text);
        padding: 0 12px;
      }
      .rail-copy {
        margin-top: 16px;
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--border-subtle);
        background: rgba(255,255,255,0.88);
      }
      .center {
        padding: 18px;
        display: grid;
        gap: 18px;
      }
      .panel {
        padding: 18px;
        border-radius: 24px;
        border: 1px solid var(--border-subtle);
        background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,246,251,0.94));
      }
      .ledger-grid {
        min-height: 580px;
        display: grid;
        grid-template-columns: minmax(260px, 0.42fr) minmax(0, 1fr);
        gap: 16px;
      }
      .hash-lane {
        position: relative;
        padding: 8px 0 8px 20px;
      }
      .hash-lane::before {
        content: "";
        position: absolute;
        left: 28px;
        top: 20px;
        bottom: 20px;
        width: 2px;
        background: linear-gradient(180deg, rgba(51,65,85,0.15), rgba(51,65,85,0.45), rgba(14,165,164,0.32));
      }
      .chain-step {
        position: relative;
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
        padding-left: 26px;
      }
      .chain-step button {
        min-height: 44px;
        border-radius: 18px;
        border: 1px solid var(--border-subtle);
        background: rgba(255,255,255,0.94);
        text-align: left;
        padding: 12px 14px;
        cursor: pointer;
        transition: transform 180ms ease, border-color 120ms ease, box-shadow 180ms ease;
      }
      .chain-step button:hover,
      .chain-step button:focus-visible,
      .chain-step button[data-selected="true"] {
        transform: translateY(-1px);
        border-color: rgba(53, 89, 230, 0.28);
        box-shadow: 0 14px 28px rgba(53, 89, 230, 0.08);
        outline: none;
      }
      .chain-step button::before {
        content: "";
        position: absolute;
        left: 0;
        top: 17px;
        width: 16px;
        height: 16px;
        border-radius: 999px;
        border: 2px solid rgba(51,65,85,0.5);
        background: rgba(255,255,255,0.98);
      }
      .chain-step button[data-state="watch"]::before {
        border-color: rgba(201,137,0,0.9);
      }
      .chain-step button[data-state="blocked"]::before {
        border-color: rgba(194,65,65,0.9);
      }
      .mono {
        font-family: ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace;
        font-size: 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        text-align: left;
        padding: 12px 10px;
        border-bottom: 1px solid var(--border-subtle);
        vertical-align: top;
        font-size: 13px;
      }
      th {
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--muted);
      }
      tr[data-selected="true"] {
        background: rgba(53, 89, 230, 0.06);
      }
      tr:focus-visible {
        outline: 2px solid rgba(53, 89, 230, 0.34);
        outline-offset: -2px;
      }
      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(15,23,42,0.08);
        background: rgba(15,23,42,0.04);
        color: var(--text);
        font-size: 12px;
      }
      .chip.watch { background: rgba(201,137,0,0.14); color: var(--warning); }
      .chip.blocked { background: rgba(194,65,65,0.14); color: var(--blocked); }
      .chip.admissible { background: rgba(14,165,164,0.14); color: var(--disclosure); }
      .lower {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 18px;
      }
      .inspector {
        position: sticky;
        top: 90px;
        padding: 18px;
        display: grid;
        gap: 18px;
      }
      .inspector-section {
        display: grid;
        gap: 10px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border-subtle);
      }
      .inspector-section:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .definition-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px 12px;
      }
      .definition-grid div {
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid var(--border-subtle);
        background: rgba(255,255,255,0.9);
      }
      .braid {
        padding: 12px;
        border-radius: 18px;
        border: 1px solid var(--border-subtle);
        background: rgba(255,255,255,0.92);
      }
      .braid svg {
        width: 100%;
        height: 160px;
      }
      .braid-node {
        fill: rgba(255,255,255,0.98);
        stroke: rgba(51,65,85,0.36);
        stroke-width: 1.4;
      }
      .braid-edge {
        stroke: rgba(148,163,184,0.92);
        stroke-width: 1.6;
      }
      .braid-label {
        fill: var(--text-strong);
        font-size: 11px;
        font-weight: 600;
      }
      .braid-sub {
        fill: var(--muted);
        font-size: 10px;
      }
      .defect-strip {
        display: grid;
        gap: 10px;
      }
      .defect-card {
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--border-subtle);
        background: rgba(255,255,255,0.9);
      }
      @media (prefers-reduced-motion: reduce) {
        * {
          animation: none !important;
          transition-duration: 0ms !important;
          scroll-behavior: auto !important;
        }
      }
      @media (max-width: 1260px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .inspector {
          position: static;
        }
      }
      @media (max-width: 980px) {
        .ledger-grid,
        .lower {
          grid-template-columns: 1fr;
        }
        .metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 640px) {
        .metrics,
        .definition-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <header class="masthead" data-testid="masthead">
        <div class="brand">
          <div class="mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M7 24V8h6.2c4.6 0 7.2 2.7 7.2 6.6 0 4.2-2.8 6.6-7.4 6.6H9.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M20.5 24V8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>
              <path d="M24 8v16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>
            </svg>
          </div>
          <div>
            <small>Vecells</small>
            <strong>Audit Ledger Explorer</strong>
          </div>
        </div>
        <div class="metrics" id="metrics"></div>
      </header>
      <div class="layout">
        <aside class="rail" data-testid="filter-rail">
          <div class="filters">
            <label>
              <span class="label">Action Taxonomy</span>
              <select id="filter-taxonomy" data-testid="filter-taxonomy"></select>
            </label>
            <label>
              <span class="label">Actor Class</span>
              <select id="filter-actor" data-testid="filter-actor"></select>
            </label>
            <label>
              <span class="label">WORM Class</span>
              <select id="filter-worm" data-testid="filter-worm"></select>
            </label>
            <label>
              <span class="label">Admissibility</span>
              <select id="filter-admissibility" data-testid="filter-admissibility"></select>
            </label>
            <label>
              <span class="label">Defect State</span>
              <select id="filter-defect" data-testid="filter-defect"></select>
            </label>
          </div>
          <div class="rail-copy">
            <div class="eyebrow">Redacted default</div>
            <p>Safe hashes, route refs, selected anchors, and disclosure fences stay visible by default. Raw IP, user-agent, and payload content do not.</p>
          </div>
        </aside>
        <main class="center">
          <section class="panel ledger-grid">
            <section class="hash-lane" data-testid="chain-lane">
              <div class="eyebrow">Hash-chain lane</div>
              <div id="chain-lane"></div>
            </section>
            <section data-testid="ledger-table">
              <div class="eyebrow">Audit record table</div>
              <table>
                <thead>
                  <tr>
                    <th>Seq</th>
                    <th>Action</th>
                    <th>Route</th>
                    <th>State</th>
                    <th>Hash</th>
                  </tr>
                </thead>
                <tbody id="ledger-body"></tbody>
              </table>
            </section>
          </section>
          <div class="lower">
            <section class="panel" data-testid="retention-matrix">
              <div class="eyebrow">Retention-class matrix</div>
              <table>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Mode</th>
                    <th>Archive</th>
                    <th>Replay-critical</th>
                  </tr>
                </thead>
                <tbody id="retention-body"></tbody>
              </table>
            </section>
            <section class="panel" data-testid="dependency-table">
              <div class="eyebrow">Admissibility dependency table</div>
              <table>
                <thead>
                  <tr>
                    <th>Flow</th>
                    <th>State</th>
                    <th>Blocked reason</th>
                  </tr>
                </thead>
                <tbody id="dependency-body"></tbody>
              </table>
            </section>
          </div>
          <section class="panel" data-testid="defect-strip">
            <div class="eyebrow">Defect strip</div>
            <div class="defect-strip" id="defect-body"></div>
          </section>
        </main>
        <aside class="inspector" data-testid="inspector" id="inspector"></aside>
      </div>
    </div>
    <script type="module">
      const DATA_PATHS = {
        schema: "__SCHEMA_PATH__",
        taxonomy: "__TAXONOMY_PATH__",
        worm: "__WORM_PATH__",
        companion: "__COMPANION_PATH__",
        dependencies: "__DEPENDENCY_PATH__",
      };

      const state = {
        selectedRecordId: null,
        taxonomy: "all",
        actor: "all",
        worm: "all",
        admissibility: "all",
        defect: "all",
      };

      const ids = {
        metrics: document.getElementById("metrics"),
        chainLane: document.getElementById("chain-lane"),
        ledgerBody: document.getElementById("ledger-body"),
        retentionBody: document.getElementById("retention-body"),
        dependencyBody: document.getElementById("dependency-body"),
        defectBody: document.getElementById("defect-body"),
        inspector: document.getElementById("inspector"),
        filterTaxonomy: document.getElementById("filter-taxonomy"),
        filterActor: document.getElementById("filter-actor"),
        filterWorm: document.getElementById("filter-worm"),
        filterAdmissibility: document.getElementById("filter-admissibility"),
        filterDefect: document.getElementById("filter-defect"),
      };

      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      document.body.dataset.reducedMotion = motionQuery.matches ? "true" : "false";
      motionQuery.addEventListener("change", (event) => {
        document.body.dataset.reducedMotion = event.matches ? "true" : "false";
      });

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }

      function toTestId(value) {
        return String(value)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      function parseCsv(text) {
        const rows = [];
        let row = [];
        let cell = "";
        let inQuotes = false;
        for (let index = 0; index < text.length; index += 1) {
          const char = text[index];
          const next = text[index + 1];
          if (char === '"' && inQuotes && next === '"') {
            cell += '"';
            index += 1;
            continue;
          }
          if (char === '"') {
            inQuotes = !inQuotes;
            continue;
          }
          if (char === "," && !inQuotes) {
            row.push(cell);
            cell = "";
            continue;
          }
          if ((char === "\\n" || char === "\\r") && !inQuotes) {
            if (char === "\\r" && next === "\\n") {
              index += 1;
            }
            row.push(cell);
            if (row.some((value) => value.length > 0)) {
              rows.push(row);
            }
            row = [];
            cell = "";
            continue;
          }
          cell += char;
        }
        if (cell.length || row.length) {
          row.push(cell);
          rows.push(row);
        }
        const [headers, ...body] = rows;
        return body.map((values) =>
          Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
        );
      }

      async function loadData() {
        const [schema, taxonomyText, worm, companionText, dependencies] = await Promise.all([
          fetch(DATA_PATHS.schema).then((response) => response.json()),
          fetch(DATA_PATHS.taxonomy).then((response) => response.text()),
          fetch(DATA_PATHS.worm).then((response) => response.json()),
          fetch(DATA_PATHS.companion).then((response) => response.text()),
          fetch(DATA_PATHS.dependencies).then((response) => response.json()),
        ]);
        const taxonomy = parseCsv(taxonomyText);
        const companion = parseCsv(companionText);
        return {
          schema,
          taxonomy,
          worm,
          companion,
          dependencies,
          records: dependencies.sampleAuditRecords,
        };
      }

      function fillSelect(select, values, currentValue, labels = {}) {
        const options = ["all", ...values];
        select.innerHTML = options
          .map((value) => {
            const label = value === "all" ? "All" : labels[value] ?? value;
            return `<option value="${escapeHtml(value)}" ${value === currentValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
          })
          .join("");
      }

      function filteredRecords(data) {
        return data.records.filter((record) => {
          return (
            (state.taxonomy === "all" || record.actionCategory === state.taxonomy) &&
            (state.actor === "all" || record.actorClass === state.actor) &&
            (state.worm === "all" || record.retentionClassRef === state.worm) &&
            (state.admissibility === "all" || record.admissibilityState === state.admissibility) &&
            (state.defect === "all" || record.defectState === state.defect)
          );
        });
      }

      function syncSelection(data) {
        const rows = filteredRecords(data);
        if (!rows.length) {
          state.selectedRecordId = null;
          return;
        }
        if (!rows.some((row) => row.auditRecordId === state.selectedRecordId)) {
          state.selectedRecordId = rows[0].auditRecordId;
        }
      }

      function selectedRecord(data) {
        return data.records.find((row) => row.auditRecordId === state.selectedRecordId) ?? null;
      }

      function selectedTaxonomy(data) {
        const record = selectedRecord(data);
        if (!record) {
          return null;
        }
        return data.taxonomy.find((row) => row.audit_action_taxonomy_id === record.actionTaxonomyRef) ?? null;
      }

      function selectedCompanion(data) {
        const record = selectedRecord(data);
        if (!record) {
          return null;
        }
        return data.companion.find(
          (row) => row.audit_to_fhir_companion_matrix_id === record.fhirCompanionTupleRef,
        ) ?? null;
      }

      function linkedDependencies(data) {
        const record = selectedRecord(data);
        return data.dependencies.admissibilityDependencies.filter((row) => {
          if (state.admissibility !== "all" && row.currentState !== state.admissibility) {
            return false;
          }
          if (!record) {
            return state.admissibility === "all";
          }
          return row.linkedRecordRefs.includes(record.auditRecordId) || state.admissibility !== "all";
        });
      }

      function chipClass(stateValue) {
        return `chip ${escapeHtml(stateValue)}`;
      }

      function renderFilters(data) {
        fillSelect(
          ids.filterTaxonomy,
          [...new Set(data.taxonomy.map((row) => row.action_category))],
          state.taxonomy,
        );
        fillSelect(
          ids.filterActor,
          [...new Set(data.records.map((row) => row.actorClass))],
          state.actor,
        );
        fillSelect(
          ids.filterWorm,
          data.worm.wormRetentionClasses.map((row) => row.wormRetentionClassId),
          state.worm,
        );
        fillSelect(
          ids.filterAdmissibility,
          [...new Set(data.records.map((row) => row.admissibilityState))],
          state.admissibility,
        );
        fillSelect(
          ids.filterDefect,
          [...new Set(data.records.map((row) => row.defectState))],
          state.defect,
        );
      }

      function renderMetrics(data) {
        ids.metrics.innerHTML = [
          ["Audit rows", data.dependencies.summary.audit_record_count],
          ["Chain breaks", data.dependencies.summary.chain_break_count],
          ["WORM classes", data.worm.summary.worm_retention_class_count],
          ["Inadmissible dependencies", data.dependencies.summary.inadmissible_dependency_count],
        ]
          .map(
            ([label, value]) => `
              <div class="metric">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
              </div>`,
          )
          .join("");
      }

      function renderChain(data) {
        const rows = filteredRecords(data);
        ids.chainLane.innerHTML = rows
          .map(
            (record) => `
              <div class="chain-step">
                <button
                  type="button"
                  tabindex="0"
                  data-testid="chain-node-${toTestId(record.auditRecordId)}"
                  data-record-id="${escapeHtml(record.auditRecordId)}"
                  data-state="${escapeHtml(record.admissibilityState)}"
                  data-selected="${record.auditRecordId === state.selectedRecordId}"
                >
                  <span class="eyebrow">${escapeHtml(record.actionLabel)}</span>
                  <strong>${escapeHtml(record.routeFamilyLabel)}</strong>
                  <div class="mono">${escapeHtml(record.hash.slice(0, 16))}</div>
                </button>
              </div>`,
          )
          .join("");
        ids.chainLane.querySelectorAll("button").forEach((node) => {
          node.addEventListener("click", () => {
            state.selectedRecordId = node.dataset.recordId;
            renderAll(data);
          });
          node.addEventListener("keydown", (event) => {
            const nodes = [...ids.chainLane.querySelectorAll("button")];
            const index = nodes.indexOf(node);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const nextIndex =
                event.key === "ArrowDown"
                  ? Math.min(nodes.length - 1, index + 1)
                  : Math.max(0, index - 1);
              state.selectedRecordId = nodes[nextIndex].dataset.recordId;
              renderAll(data);
              ids.chainLane.querySelectorAll("button")[nextIndex]?.focus();
            }
          });
        });
      }

      function renderLedgerTable(data) {
        const rows = filteredRecords(data);
        ids.ledgerBody.innerHTML = rows
          .map(
            (record) => `
              <tr
                tabindex="0"
                data-testid="ledger-row-${toTestId(record.auditRecordId)}"
                data-record-id="${escapeHtml(record.auditRecordId)}"
                data-selected="${record.auditRecordId === state.selectedRecordId}"
              >
                <td>${escapeHtml(record.chainSequence)}</td>
                <td>
                  <div>${escapeHtml(record.actionLabel)}</div>
                  <div class="mono">${escapeHtml(record.auditRecordId)}</div>
                </td>
                <td>${escapeHtml(record.routeFamilyLabel)}</td>
                <td>
                  <div class="chip-row">
                    <span class="${chipClass(record.admissibilityState)}">${escapeHtml(record.admissibilityState)}</span>
                    <span class="${chipClass(record.defectState)}">${escapeHtml(record.defectState)}</span>
                  </div>
                </td>
                <td class="mono">${escapeHtml(record.hash.slice(0, 16))}</td>
              </tr>`,
          )
          .join("");
        ids.ledgerBody.querySelectorAll("tr").forEach((node) => {
          node.addEventListener("click", () => {
            state.selectedRecordId = node.dataset.recordId;
            renderAll(data);
          });
          node.addEventListener("keydown", (event) => {
            const nodes = [...ids.ledgerBody.querySelectorAll("tr")];
            const index = nodes.indexOf(node);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const nextIndex =
                event.key === "ArrowDown"
                  ? Math.min(nodes.length - 1, index + 1)
                  : Math.max(0, index - 1);
              state.selectedRecordId = nodes[nextIndex].dataset.recordId;
              renderAll(data);
              ids.ledgerBody.querySelectorAll("tr")[nextIndex]?.focus();
            }
          });
        });
      }

      function renderRetentionMatrix(data) {
        ids.retentionBody.innerHTML = data.worm.wormRetentionClasses
          .map(
            (row) => `
              <tr data-testid="retention-row-${toTestId(row.wormRetentionClassId)}">
                <td>
                  <div>${escapeHtml(row.label)}</div>
                  <div class="mono">${escapeHtml(row.wormRetentionClassId)}</div>
                </td>
                <td>${escapeHtml(row.immutabilityMode)}</td>
                <td>${escapeHtml(row.archiveDisposition)}</td>
                <td>${row.replayCritical ? "yes" : "no"}</td>
              </tr>`,
          )
          .join("");
      }

      function renderDependencyTable(data) {
        const record = selectedRecord(data);
        const rows = linkedDependencies(data);
        ids.dependencyBody.innerHTML = rows
          .map((row) => {
            const linked = record ? row.linkedRecordRefs.includes(record.auditRecordId) : false;
            return `
              <tr data-testid="dependency-row-${toTestId(row.auditAdmissibilityDependencyId)}" data-linked="${linked}">
                <td>
                  <div>${escapeHtml(row.consumerLabel)}</div>
                  <div class="mono">${escapeHtml(row.auditAdmissibilityDependencyId)}</div>
                </td>
                <td><span class="${chipClass(row.currentState)}">${escapeHtml(row.currentState)}</span></td>
                <td>${escapeHtml((row.blockedReasonCodes || []).join(", ") || "none")}</td>
              </tr>`;
          })
          .join("");
      }

      function renderDefects(data) {
        ids.defectBody.innerHTML = data.dependencies.defects
          .map(
            (defect) => `
              <article class="defect-card" data-testid="defect-${toTestId(defect.defectId)}">
                <div class="chip-row">
                  <span class="${chipClass(defect.state)}">${escapeHtml(defect.state)}</span>
                  <span class="chip">${escapeHtml(defect.consumerFlow)}</span>
                </div>
                <h3>${escapeHtml(defect.defectId)}</h3>
                <p>${escapeHtml(defect.summary)}</p>
              </article>`,
          )
          .join("");
      }

      function renderInspector(data) {
        const record = selectedRecord(data);
        const taxonomy = selectedTaxonomy(data);
        const companion = selectedCompanion(data);
        if (!record || !taxonomy || !companion) {
          ids.inspector.innerHTML = "<p>No record selected.</p>";
          return;
        }
        const linked = linkedDependencies(data);
        ids.inspector.innerHTML = `
          <section class="inspector-section">
            <div class="eyebrow">Selected record</div>
            <h2>${escapeHtml(record.actionLabel)}</h2>
            <div class="chip-row">
              <span class="${chipClass(record.admissibilityState)}">${escapeHtml(record.admissibilityState)}</span>
              <span class="${chipClass(record.defectState)}">${escapeHtml(record.defectState)}</span>
              <span class="chip">${escapeHtml(record.routeFamilyLabel)}</span>
            </div>
            <div class="definition-grid">
              <div><span class="eyebrow">Actor</span><strong>${escapeHtml(record.actorClass)}</strong><div class="mono">${escapeHtml(record.actorRef)}</div></div>
              <div><span class="eyebrow">Context</span><strong>${escapeHtml(record.actingContextLabel)}</strong><div class="mono">${escapeHtml(record.actingContextRef)}</div></div>
              <div><span class="eyebrow">Reason</span><strong>${escapeHtml(record.reasonCode)}</strong></div>
              <div><span class="eyebrow">Retention class</span><strong>${escapeHtml(record.retentionClassRef)}</strong></div>
            </div>
          </section>
          <section class="inspector-section">
            <div class="eyebrow">Causality braid</div>
            <div class="braid" data-testid="causality-braid">
              <svg viewBox="0 0 340 160" role="img" aria-label="Selected record causality braid">
                <line class="braid-edge" x1="38" y1="82" x2="112" y2="48"></line>
                <line class="braid-edge" x1="112" y1="48" x2="182" y2="82"></line>
                <line class="braid-edge" x1="182" y1="82" x2="252" y2="48"></line>
                <line class="braid-edge" x1="252" y1="48" x2="314" y2="82"></line>
                <circle class="braid-node" cx="38" cy="82" r="22"></circle>
                <circle class="braid-node" cx="112" cy="48" r="22"></circle>
                <circle class="braid-node" cx="182" cy="82" r="22"></circle>
                <circle class="braid-node" cx="252" cy="48" r="22"></circle>
                <circle class="braid-node" cx="314" cy="82" r="22"></circle>
                <text class="braid-label" x="38" y="78" text-anchor="middle">Edge</text>
                <text class="braid-sub" x="38" y="94" text-anchor="middle">corr</text>
                <text class="braid-label" x="112" y="44" text-anchor="middle">Route</text>
                <text class="braid-sub" x="112" y="60" text-anchor="middle">intent</text>
                <text class="braid-label" x="182" y="78" text-anchor="middle">Cmd</text>
                <text class="braid-sub" x="182" y="94" text-anchor="middle">settle</text>
                <text class="braid-label" x="252" y="44" text-anchor="middle">Visible</text>
                <text class="braid-sub" x="252" y="60" text-anchor="middle">shell</text>
                <text class="braid-label" x="314" y="78" text-anchor="middle">Fence</text>
                <text class="braid-sub" x="314" y="94" text-anchor="middle">scope</text>
              </svg>
            </div>
            <div class="definition-grid">
              <div><span class="eyebrow">Edge correlation</span><div class="mono">${escapeHtml(record.edgeCorrelationId)}</div></div>
              <div><span class="eyebrow">Route intent</span><div class="mono">${escapeHtml(record.routeIntentRef)}</div></div>
              <div><span class="eyebrow">Command settlement</span><div class="mono">${escapeHtml(record.commandSettlementRef)}</div></div>
              <div><span class="eyebrow">Projection visibility</span><div class="mono">${escapeHtml(record.projectionVisibilityRef)}</div></div>
              <div><span class="eyebrow">Disclosure fence</span><div class="mono">${escapeHtml(record.disclosureFenceRef)}</div></div>
              <div><span class="eyebrow">Selected anchor</span><div class="mono">${escapeHtml(record.selectedAnchorRef)}</div></div>
            </div>
          </section>
          <section class="inspector-section">
            <div class="eyebrow">Disclosure posture</div>
            <div class="definition-grid">
              <div><span class="eyebrow">Disclosure matrix</span><div class="mono">${escapeHtml(record.disclosureMatrixRef)}</div></div>
              <div><span class="eyebrow">Source IP handling</span><strong>${escapeHtml(record.sourceIpDisposition)}</strong></div>
              <div><span class="eyebrow">Source IP hash</span><div class="mono">${escapeHtml(record.sourceIpHash.slice(0, 18))}</div></div>
              <div><span class="eyebrow">User-agent handling</span><strong>${escapeHtml(record.userAgentDisposition)}</strong></div>
            </div>
          </section>
          <section class="inspector-section">
            <div class="eyebrow">FHIR companion linkage</div>
            <div class="definition-grid">
              <div><span class="eyebrow">Contract</span><div class="mono">${escapeHtml(record.fhirRepresentationContractRef)}</div></div>
              <div><span class="eyebrow">Companion tuple</span><div class="mono">${escapeHtml(record.fhirCompanionTupleRef)}</div></div>
              <div><span class="eyebrow">Profiles</span><div class="mono">${escapeHtml(companion.audit_event_profile.split("/").pop())} + ${escapeHtml(companion.provenance_profile.split("/").pop())}</div></div>
              <div><span class="eyebrow">Canonical truth</span><strong>AuditEvent + Provenance companion only</strong></div>
            </div>
          </section>
          <section class="inspector-section">
            <div class="eyebrow">Hash and admissibility</div>
            <div class="definition-grid">
              <div><span class="eyebrow">Previous hash</span><div class="mono">${escapeHtml(record.previousHash.slice(0, 18))}</div></div>
              <div><span class="eyebrow">Current hash</span><div class="mono">${escapeHtml(record.hash.slice(0, 18))}</div></div>
              <div><span class="eyebrow">Chain integrity</span><strong>${escapeHtml(record.chainIntegrityState)}</strong></div>
              <div><span class="eyebrow">Linked dependencies</span><strong>${escapeHtml(linked.length)}</strong></div>
            </div>
          </section>`;
      }

      function renderAll(data) {
        syncSelection(data);
        renderFilters(data);
        renderMetrics(data);
        renderChain(data);
        renderLedgerTable(data);
        renderRetentionMatrix(data);
        renderDependencyTable(data);
        renderDefects(data);
        renderInspector(data);
      }

      function bindFilters(data) {
        const bindings = [
          [ids.filterTaxonomy, "taxonomy"],
          [ids.filterActor, "actor"],
          [ids.filterWorm, "worm"],
          [ids.filterAdmissibility, "admissibility"],
          [ids.filterDefect, "defect"],
        ];
        bindings.forEach(([node, key]) => {
          node.addEventListener("change", (event) => {
            state[key] = event.target.value;
            renderAll(data);
          });
        });
      }

      loadData().then((data) => {
        window.__auditLedgerData = data;
        bindFilters(data);
        renderAll(data);
      });
    </script>
  </body>
</html>
"""
    return (
        template.replace("__SCHEMA_PATH__", "../../data/analysis/audit_record_schema.json")
        .replace("__TAXONOMY_PATH__", "../../data/analysis/audit_action_taxonomy.csv")
        .replace("__WORM_PATH__", "../../data/analysis/worm_retention_classes.json")
        .replace("__COMPANION_PATH__", "../../data/analysis/audit_to_fhir_companion_matrix.csv")
        .replace("__DEPENDENCY_PATH__", "../../data/analysis/audit_admissibility_dependencies.json")
    )


def build_spec_js() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "53_audit_ledger_explorer.html");
        const DEPENDENCY_PATH = path.join(ROOT, "data", "analysis", "audit_admissibility_dependencies.json");

        const DEPENDENCY_PAYLOAD = JSON.parse(fs.readFileSync(DEPENDENCY_PATH, "utf8"));

        export const auditLedgerExplorerCoverage = [
          "taxonomy filtering",
          "record selection",
          "chain and table parity",
          "inspector rendering",
          "keyboard navigation",
          "responsive behavior",
          "reduced motion",
          "accessibility smoke checks",
        ];

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        function toTestId(value) {
          return String(value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch (error) {
            if (!process.argv.includes("--run")) {
              return null;
            }
            throw error;
          }
        }

        function serve(rootDir) {
          const server = http.createServer((request, response) => {
            const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
            let pathname = decodeURIComponent(requestUrl.pathname);
            if (pathname === "/") {
              pathname = "/docs/architecture/53_audit_ledger_explorer.html";
            }
            const filePath = path.join(rootDir, pathname);
            if (!filePath.startsWith(rootDir)) {
              response.writeHead(403);
              response.end("forbidden");
              return;
            }
            fs.readFile(filePath, (error, buffer) => {
              if (error) {
                response.writeHead(404);
                response.end("not found");
                return;
              }
              const extension = path.extname(filePath);
              const type =
                extension === ".html"
                  ? "text/html"
                  : extension === ".json"
                    ? "application/json"
                    : extension === ".csv"
                      ? "text/csv"
                      : "text/plain";
              response.writeHead(200, { "Content-Type": type });
              response.end(buffer);
            });
          });
          return new Promise((resolve, reject) => {
            server.listen(0, "127.0.0.1", () => {
              const address = server.address();
              if (!address || typeof address === "string") {
                reject(new Error("Unable to bind local server."));
                return;
              }
              resolve({
                server,
                url: `http://127.0.0.1:${address.port}/docs/architecture/53_audit_ledger_explorer.html`,
              });
            });
          });
        }

        export async function run() {
          assertCondition(fs.existsSync(HTML_PATH), "Explorer HTML is missing.");
          assertCondition(
            DEPENDENCY_PAYLOAD.summary.audit_record_count === 14,
            "Audit record count drifted from expected baseline.",
          );
          assertCondition(
            DEPENDENCY_PAYLOAD.summary.inadmissible_dependency_count === 4,
            "Inadmissible dependency count drifted from expected fail-closed baseline.",
          );

          const playwright = await importPlaywright();
          if (!playwright) {
            return;
          }

          const { server, url } = await serve(ROOT);
          const browser = await playwright.chromium.launch({ headless: true });

          try {
            const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
            const page = await context.newPage();
            await page.goto(url, { waitUntil: "networkidle" });

            await page.locator("[data-testid='filter-rail']").waitFor();
            await page.locator("[data-testid='chain-lane']").waitFor();
            await page.locator("[data-testid='ledger-table']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialRows = await page.locator("[data-testid^='ledger-row-']").count();
            assertCondition(
              initialRows === DEPENDENCY_PAYLOAD.summary.audit_record_count,
              `Expected ${DEPENDENCY_PAYLOAD.summary.audit_record_count} ledger rows, found ${initialRows}.`,
            );

            const initialChainNodes = await page.locator("[data-testid^='chain-node-']").count();
            assertCondition(
              initialChainNodes === initialRows,
              `Chain and table parity drifted: ${initialChainNodes} chain nodes vs ${initialRows} rows.`,
            );

            await page.locator("[data-testid='filter-taxonomy']").selectOption("support_replay");
            const supportRows = await page.locator("[data-testid^='ledger-row-']").count();
            assertCondition(supportRows === 2, `Support replay filter expected 2 rows, found ${supportRows}.`);

            const supportChainNodes = await page.locator("[data-testid^='chain-node-']").count();
            assertCondition(
              supportChainNodes === supportRows,
              "Support replay filter broke chain/table parity.",
            );

            await page.locator("[data-testid='filter-taxonomy']").selectOption("all");
            await page.locator("[data-testid='filter-admissibility']").selectOption("blocked");
            const blockedRows = await page.locator("[data-testid^='ledger-row-']").count();
            assertCondition(blockedRows === 2, `Blocked admissibility filter expected 2 rows, found ${blockedRows}.`);

            const exportRecordId = "AR_053_AUDIT_EXPORT_GENERATED_01";
            await page.locator(`[data-testid='ledger-row-${toTestId(exportRecordId)}']`).click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("Governed audit export generated") &&
                inspectorText.includes("AuditEvent + Provenance companion only") &&
                inspectorText.includes("blocked"),
              "Inspector lost expected export and companion detail.",
            );

            await page.locator("[data-testid='filter-admissibility']").selectOption("all");
            await page.locator(`[data-testid='ledger-row-${toTestId("AR_053_ROUTE_INTENT_ESTABLISHED_01")}']`).focus();
            await page.keyboard.press("ArrowDown");
            const nextSelected = await page
              .locator(`[data-testid='ledger-row-${toTestId("AR_053_COMMAND_INGESTED_01")}']`)
              .getAttribute("data-selected");
            assertCondition(nextSelected === "true", "ArrowDown did not advance ledger-row selection.");

            const dependencyRows = await page.locator("[data-testid^='dependency-row-']").count();
            assertCondition(dependencyRows >= 1, "Dependency table did not render linked rows.");

            await page.setViewportSize({ width: 390, height: 844 });
            const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(inspectorVisible, "Inspector disappeared at mobile width.");

            const reducedContext = await browser.newContext({
              viewport: { width: 1280, height: 900 },
              reducedMotion: "reduce",
            });
            const reducedPage = await reducedContext.newPage();
            try {
              await reducedPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await reducedPage.evaluate(() => document.body.dataset.reducedMotion);
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await reducedContext.close();
            }

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 8, `Accessibility smoke failed: expected many landmarks, found ${landmarks}.`);
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

        export const auditLedgerExplorerManifest = {
          task: DEPENDENCY_PAYLOAD.task_id,
          records: DEPENDENCY_PAYLOAD.summary.audit_record_count,
          inadmissibleDependencies: DEPENDENCY_PAYLOAD.summary.inadmissible_dependency_count,
          chainBreaks: DEPENDENCY_PAYLOAD.summary.chain_break_count,
        };
        """
    ).strip() + "\n"


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, and audit ledger browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def main() -> None:
    context = load_context()
    schema = build_schema()
    worm_payload = build_worm_payload()
    taxonomy_rows = build_taxonomy_rows(context)
    companion_rows = build_companion_rows(context, taxonomy_rows)
    records = build_sample_records(context, taxonomy_rows, companion_rows)
    admissibility_payload = build_admissibility_payload(context, taxonomy_rows, companion_rows, records)

    taxonomy_fields = [
        "audit_action_taxonomy_id",
        "action_code",
        "action_label",
        "action_category",
        "actor_class",
        "audience_surface",
        "route_family_ref",
        "target_type",
        "worm_append_required",
        "hash_chain_required",
        "replay_criticality",
        "retention_class_ref",
        "canonical_event_contract_ref",
        "disclosure_matrix_ref",
        "required_join_refs",
        "required_graph_authority_refs",
        "canonical_truth_rule",
        "source_refs",
        "rationale",
    ]
    companion_fields = [
        "audit_to_fhir_companion_matrix_id",
        "audit_action_taxonomy_id",
        "action_code",
        "fhir_representation_contract_ref",
        "audit_event_profile",
        "provenance_profile",
        "companion_generation_mode",
        "canonical_truth_state",
        "admissibility_binding",
        "disclosure_ceiling_ref",
        "source_refs",
        "rationale",
    ]

    write_json(AUDIT_SCHEMA_PATH, schema)
    write_csv(AUDIT_TAXONOMY_PATH, taxonomy_fields, taxonomy_rows)
    write_json(WORM_CLASSES_PATH, worm_payload)
    write_csv(AUDIT_FHIR_MATRIX_PATH, companion_fields, companion_rows)
    write_json(ADMISSIBILITY_PATH, admissibility_payload)
    write_text(STRATEGY_DOC_PATH, build_strategy_doc(admissibility_payload, worm_payload))
    write_text(CHAIN_DOC_PATH, build_chain_doc(admissibility_payload, companion_rows))
    write_text(RETENTION_DOC_PATH, build_retention_doc(worm_payload))
    write_text(EXPLORER_PATH, build_explorer_html())
    write_text(SPEC_PATH, build_spec_js())
    update_root_package()
    update_playwright_package()

    print(
        "seq_053 audit and WORM artifacts generated: "
        f"{admissibility_payload['summary']['audit_record_count']} audit records, "
        f"{admissibility_payload['summary']['action_taxonomy_count']} taxonomy rows, "
        f"{worm_payload['summary']['worm_retention_class_count']} retention classes."
    )


if __name__ == "__main__":
    main()
