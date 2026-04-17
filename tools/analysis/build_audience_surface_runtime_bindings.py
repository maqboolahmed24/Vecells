#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

FUSION_CATALOG_PATH = DATA_DIR / "surface_authority_tuple_catalog.json"
FUSION_VERDICTS_PATH = DATA_DIR / "manifest_fusion_verdicts.json"
FRONTEND_MANIFESTS_PATH = DATA_DIR / "frontend_contract_manifests.json"
DESIGN_BUNDLES_PATH = DATA_DIR / "design_contract_publication_bundles.json"
PARITY_RECORDS_PATH = DATA_DIR / "release_publication_parity_records.json"
RUNTIME_BUNDLES_PATH = DATA_DIR / "runtime_publication_bundles.json"
ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
AUDIENCE_SURFACE_PATH = DATA_DIR / "audience_surface_inventory.csv"
SHELL_CONTRACTS_PATH = DATA_DIR / "persistent_shell_contracts.json"

BINDING_CATALOG_PATH = DATA_DIR / "audience_surface_runtime_bindings.json"
PUBLICATION_PARITY_MATRIX_PATH = DATA_DIR / "publication_parity_matrix.csv"
SURFACE_AUTHORITY_VERDICTS_PATH = DATA_DIR / "surface_authority_verdicts.json"
ROUTE_RECOVERY_DISPOSITION_MATRIX_PATH = DATA_DIR / "route_recovery_disposition_matrix.csv"

BINDINGS_DOC_PATH = DOCS_DIR / "130_audience_surface_runtime_bindings_final.md"
PARITY_DOC_PATH = DOCS_DIR / "130_publication_parity_finalization.md"
VERDICT_DOC_PATH = DOCS_DIR / "130_surface_authority_verdict_matrix.md"
RECOVERY_DOC_PATH = DOCS_DIR / "130_runtime_binding_gap_and_recovery_rules.md"
BOARD_PATH = DOCS_DIR / "130_audience_surface_parity_board.html"

TASK_ID = "seq_130"
VISUAL_MODE = "Audience_Surface_Parity_Board"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]
LOCAL_RUNTIME_BUNDLE_REF = "rpb::local::authoritative"
LOCAL_PARITY_REF = "rpp::local::authoritative"

SOURCE_PRECEDENCE = [
    "prompt/130.md",
    "prompt/shared_operating_contract_126_to_135.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.38 RuntimePublicationBundle",
    "blueprint/phase-0-the-foundation-protocol.md#1.38A AudienceSurfaceRuntimeBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.39 ReleaseRecoveryDisposition",
    "blueprint/phase-0-the-foundation-protocol.md#1.41 RouteFreezeDisposition",
    "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
    "blueprint/platform-frontend-blueprint.md#ProjectionFreshnessEnvelope",
    "blueprint/platform-frontend-blueprint.md#Shell and route-family ownership rules",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "blueprint/forensic-audit-findings.md#Finding 119",
    "blueprint/forensic-audit-findings.md#Finding 120",
    "data/analysis/surface_authority_tuple_catalog.json",
    "data/analysis/manifest_fusion_verdicts.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/design_contract_publication_bundles.json",
    "data/analysis/release_publication_parity_records.json",
    "data/analysis/runtime_publication_bundles.json",
    "data/analysis/persistent_shell_contracts.json",
]

STATE_CATALOG = {
    "bindingState": {
        "publishable_live": "Exact runtime, parity, design, accessibility, and browser posture all align for calm live truth.",
        "recovery_only": "The surface remains visible only for bounded same-shell recovery or guarded operational continuation.",
        "partial": "The tuple exists and parity is exact, but read-only, guarded, or constrained posture still blocks calm live truth.",
        "blocked": "The route or surface is explicitly unpublished, frozen, or missing required authority members.",
        "drifted": "The tuple exists but current runtime/publication truth has drifted and must not present as live.",
    },
    "calmTruthState": {
        "allowed": "Quiet, trustworthy, calmly live posture is legal for this row.",
        "suppressed": "The surface may render summary or fallback posture only; calm truth is withheld.",
        "diagnostic_only": "The row remains diagnostic and inspectable, but not calmly live or reassuring.",
    },
    "writableTruthState": {
        "allowed": "Current tuple permits live writable action posture.",
        "blocked": "Writable action posture is suppressed by current parity, design, accessibility, or freeze law.",
        "recovery_only": "Only bounded recovery mutations are legal; ordinary writable posture stays closed.",
    },
}

VERDICT_RULES = [
    {
        "ruleId": "VR_130_LIVE_REQUIRES_EXACT_PARITY_AND_BROWSER_TRUTH",
        "summary": "A publishable-live or writable row must have exact parity, published runtime truth, passing design posture, complete accessibility, and publishable browser posture.",
    },
    {
        "ruleId": "VR_130_NON_LIVE_REQUIRES_DECLARED_RECOVERY_OR_FREEZE",
        "summary": "Recovery-only, partial, blocked, and drifted rows must name a governing recovery or freeze disposition instead of collapsing to a generic error page.",
    },
    {
        "ruleId": "VR_130_ROUTE_AND_SHELL_COVERAGE_IS_EXPLICIT",
        "summary": "Every current shell-claimed route family and every current inventoried audience surface must appear in the final binding catalog, including blocked rows.",
    },
    {
        "ruleId": "VR_130_SURFACE_TRUTH_SUBORDINATES_TO_PARITY",
        "summary": "Surface calm and writable truth is subordinate to the active ReleasePublicationParityRecord and may not outrun it.",
    },
]

DECLARED_DISPOSITION_CATALOG = [
    {
        "dispositionRef": "RFD_130_ASSISTIVE_STANDALONE_PUBLICATION_BLOCK",
        "dispositionKind": "freeze",
        "title": "Standalone assistive publication blocked",
        "summary": "Until a standalone assistive shell, manifest, and runtime binding exist, the route family stays frozen out of direct browser publication.",
    },
    {
        "dispositionRef": "RRD_130_ASSISTIVE_STANDALONE_RETURN_TO_OWNING_SHELL",
        "dispositionKind": "recovery",
        "title": "Return to the owning shell",
        "summary": "Operators must return to the owning staff shell or governed sidecar because no standalone assistive runtime truth is published yet.",
    },
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def load_json(path: Path) -> Any:
    require(path.exists(), f"PREREQUISITE_GAP_130_MISSING::{path.name}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"PREREQUISITE_GAP_130_MISSING::{path.name}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def unique_sorted(values: list[str]) -> list[str]:
    return sorted(dict.fromkeys(value for value in values if value))


def stable_digest(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()[:16]


def humanize_ref(value: str) -> str:
    cleaned = value.replace("RRD_", "").replace("RFD_", "").replace("MFV_127_", "")
    cleaned = cleaned.replace("ASV_130_", "").replace("::", " ").replace("_", " ").replace("-", " ")
    return " ".join(part.capitalize() for part in cleaned.split())


def binding_state_for_tuple(tuple_row: dict[str, Any]) -> str:
    verdict = tuple_row["bindingVerdict"]
    posture = tuple_row.get("browserPostureState")
    writability = tuple_row.get("writabilityState")
    if verdict == "drifted":
        return "drifted"
    if verdict == "blocked" or posture == "blocked":
        return "blocked"
    if posture == "recovery_only" or writability == "recovery_only":
        return "recovery_only"
    if verdict == "exact":
        return "publishable_live"
    return "partial"


def calm_truth_for_tuple(tuple_row: dict[str, Any], binding_state: str) -> str:
    if binding_state == "publishable_live":
        return "allowed"
    disposition_refs = tuple_row.get("releaseRecoveryDispositionRefs", []) + tuple_row.get("routeFreezeDispositionRefs", [])
    if any("DIAGNOSTIC_ONLY" in ref for ref in disposition_refs):
        return "diagnostic_only"
    return "suppressed"


def writable_truth_for_tuple(tuple_row: dict[str, Any], binding_state: str) -> str:
    writability = tuple_row.get("writabilityState", "blocked")
    if binding_state == "publishable_live" and writability in {"writable", "publishable_live"}:
        return "allowed"
    if writability == "recovery_only" or binding_state == "recovery_only":
        return "recovery_only"
    return "blocked"


def gather_shell_route_refs(shell_contracts: dict[str, Any]) -> list[str]:
    refs: list[str] = []
    for shell in shell_contracts.get("shells", []):
        refs.extend(shell.get("routeFamilyRefs", []))
        refs.extend(claim.get("routeFamilyRef", "") for claim in shell.get("routeClaims", []))
    return unique_sorted(refs)


def build_binding_catalog() -> dict[str, Any]:
    fusion_catalog = load_json(FUSION_CATALOG_PATH)
    fusion_verdicts = load_json(FUSION_VERDICTS_PATH)
    frontend_payload = load_json(FRONTEND_MANIFESTS_PATH)
    design_payload = load_json(DESIGN_BUNDLES_PATH)
    parity_payload = load_json(PARITY_RECORDS_PATH)
    runtime_payload = load_json(RUNTIME_BUNDLES_PATH)
    route_inventory = load_csv(ROUTE_FAMILY_PATH)
    audience_inventory = load_csv(AUDIENCE_SURFACE_PATH)
    shell_contracts = load_json(SHELL_CONTRACTS_PATH)

    require(fusion_catalog.get("task_id") == "seq_127", "PREREQUISITE_GAP_130_FUSION_NOT_SEQ_127")
    require(fusion_verdicts.get("task_id") == "seq_127", "PREREQUISITE_GAP_130_FUSION_VERDICTS_NOT_SEQ_127")

    tuple_rows = fusion_catalog["surfaceAuthorityTuples"]
    reason_catalog = fusion_catalog["reasonCatalog"]
    reason_by_ref = {row["reasonRef"]: row for row in reason_catalog}
    frontend_by_id = {
        row["frontendContractManifestId"]: row for row in frontend_payload["frontendContractManifests"]
    }
    design_by_id = {
        row["designContractPublicationBundleId"]: row
        for row in design_payload["designContractPublicationBundles"]
    }
    parity_by_id = {
        row["publicationParityRecordId"]: row for row in parity_payload["releasePublicationParityRecords"]
    }
    runtime_bundle_by_id = {
        row["runtimePublicationBundleId"]: row for row in runtime_payload["runtimePublicationBundles"]
    }

    local_parity = parity_by_id.get(LOCAL_PARITY_REF)
    require(local_parity is not None, "PREREQUISITE_GAP_130_LOCAL_PARITY_MISSING")
    local_runtime_bundle = runtime_bundle_by_id.get(LOCAL_RUNTIME_BUNDLE_REF)
    require(local_runtime_bundle is not None, "PREREQUISITE_GAP_130_LOCAL_RUNTIME_BUNDLE_MISSING")

    route_inventory_refs = {row["route_family_id"] for row in route_inventory}
    audience_inventory_refs = {row["surface_id"] for row in audience_inventory}
    shell_route_refs = set(gather_shell_route_refs(shell_contracts))

    catalog_rows: list[dict[str, Any]] = []
    publication_matrix_rows: list[dict[str, Any]] = []
    recovery_matrix_rows: list[dict[str, Any]] = []
    audience_surface_counts: Counter[str] = Counter()
    shell_counts: Counter[str] = Counter()

    for tuple_row in tuple_rows:
        binding_state = binding_state_for_tuple(tuple_row)
        calm_truth_state = calm_truth_for_tuple(tuple_row, binding_state)
        writable_truth_state = writable_truth_for_tuple(tuple_row, binding_state)

        audience_surface = (
            tuple_row.get("publishedAudienceSurfaceRef")
            or tuple_row.get("audienceSurface")
            or f"gap::{tuple_row['routeFamilyRef']}"
        )
        runtime_binding_id = (
            tuple_row.get("audienceSurfaceRuntimeBindingRef")
            or f"gap::{tuple_row['routeFamilyRef']}"
        )
        surface_verdict_id = f"ASV_130_{tuple_row['tupleId'].replace('FMTUP_127_', '')}"

        frontend_row = frontend_by_id.get(tuple_row.get("frontendContractManifestRef"))
        design_row = design_by_id.get(tuple_row.get("designContractPublicationBundleRef"))
        release_ref = local_parity["releaseRef"]
        recovery_refs = unique_sorted(
            tuple_row.get("releaseRecoveryDispositionRefs", [])
            + tuple_row.get("routeFreezeDispositionRefs", [])
        )
        freeze_refs = unique_sorted(tuple_row.get("routeFreezeDispositionRefs", []))

        notes: list[str] = []
        if (
            tuple_row.get("parityState") == "exact"
            and binding_state != "publishable_live"
        ):
            notes.append(
                "Release parity is exact, but calm live truth is still bounded by browser posture, design lint, or accessibility ceilings."
            )
        if tuple_row["routeFamilyRef"] == "rf_assistive_control_shell":
            recovery_refs = unique_sorted(
                recovery_refs
                + [
                    "RFD_130_ASSISTIVE_STANDALONE_PUBLICATION_BLOCK",
                    "RRD_130_ASSISTIVE_STANDALONE_RETURN_TO_OWNING_SHELL",
                ]
            )
            freeze_refs = unique_sorted(
                freeze_refs + ["RFD_130_ASSISTIVE_STANDALONE_PUBLICATION_BLOCK"]
            )
            notes.append(
                "Standalone assistive control work is explicitly blocked and must route back to the owning shell until a dedicated shell, manifest, and runtime binding are published."
            )
        if tuple_row.get("notes"):
            notes.append(tuple_row["notes"])

        audience_surface_counts[audience_surface] += 1
        shell_counts[tuple_row["shellType"]] += 1

        row = {
            "surfaceAuthorityVerdictId": surface_verdict_id,
            "audienceSurfaceRuntimeBindingId": runtime_binding_id,
            "audienceSurface": audience_surface,
            "audienceSurfaceLabel": frontend_row.get("audienceSurfaceLabel")
            if frontend_row
            else tuple_row["inventorySurfaceLabel"],
            "inventorySurfaceRef": tuple_row.get("inventorySurfaceRef"),
            "inventorySurfaceLabel": tuple_row["inventorySurfaceLabel"],
            "routeFamilyRef": tuple_row["routeFamilyRef"],
            "routeFamilyLabel": tuple_row["routeFamilyLabel"],
            "shellType": tuple_row["shellType"],
            "shellSlug": tuple_row.get("shellSlug"),
            "surfaceRouteContractRef": tuple_row.get("surfaceRouteContractRef"),
            "frontendContractManifestRef": tuple_row.get("frontendContractManifestRef"),
            "runtimePublicationBundleRef": tuple_row.get("runtimePublicationBundleRef"),
            "releasePublicationParityRef": tuple_row.get("releasePublicationParityRef"),
            "releaseRef": release_ref,
            "designContractPublicationBundleRef": tuple_row.get("designContractPublicationBundleRef"),
            "designContractLintVerdictRef": tuple_row.get("designLintVerdictRef"),
            "projectionContractVersionSetRef": tuple_row.get("projectionContractVersionSetRef"),
            "visibilityCoverageRefs": tuple_row.get("visibilityCoverageRefs", []),
            "bindingState": binding_state,
            "calmTruthState": calm_truth_state,
            "writableTruthState": writable_truth_state,
            "recoveryDispositionRefs": recovery_refs,
            "routeFreezeDispositionRefs": freeze_refs,
            "reasonRefs": tuple_row.get("reasonRefs", []),
            "notes": " ".join(notes),
            "tupleId": tuple_row["tupleId"],
            "publishedAudienceSurfaceRef": tuple_row.get("publishedAudienceSurfaceRef"),
            "surfacePublicationRef": tuple_row.get("surfacePublicationRef"),
            "surfaceAuthorityRowRef": tuple_row.get("surfaceAuthorityRowRef"),
            "governingBoundedContextRef": tuple_row.get("governingBoundedContextRef"),
            "canonicalObjectDescriptorRef": tuple_row.get("canonicalObjectDescriptorRef"),
            "continuityEvidenceContractRefs": tuple_row.get("continuityEvidenceContractRefs", []),
            "gatewaySurfaceRefs": tuple_row.get("gatewaySurfaceRefs", []),
            "gatewaySurfacePrimaryRef": tuple_row.get("gatewaySurfacePrimaryRef"),
            "browserVisible": tuple_row.get("browserVisible", True),
            "browserPostureState": tuple_row.get("browserPostureState"),
            "parityState": tuple_row.get("parityState"),
            "publicationState": tuple_row.get("publicationState"),
            "runtimePublicationState": local_runtime_bundle.get("publicationState"),
            "routeExposureState": tuple_row.get("routeExposureState"),
            "accessibilityCoverageState": tuple_row.get("accessibilityCoverageState"),
            "designPublicationState": tuple_row.get("designPublicationState"),
            "bindingDigestRef": tuple_row.get("bindingDigestRef"),
            "sourceTaskRefs": unique_sorted(tuple_row.get("sourceTaskRefs", []) + [TASK_ID]),
            "sourceRefs": tuple_row.get("sourceRefs", []),
            "uiBadgeLabel": binding_state.replace("_", " "),
            "reasonTitles": [
                reason_by_ref.get(reason_ref, {}).get("description", humanize_ref(reason_ref))
                for reason_ref in tuple_row.get("reasonRefs", [])
            ],
        }
        catalog_rows.append(row)

        publication_matrix_rows.append(
            {
                "surface_authority_verdict_id": surface_verdict_id,
                "audience_surface_runtime_binding_id": runtime_binding_id,
                "inventory_surface_ref": row["inventorySurfaceRef"] or "",
                "audience_surface": audience_surface,
                "route_family_ref": row["routeFamilyRef"],
                "shell_type": row["shellType"],
                "binding_state": binding_state,
                "calm_truth_state": calm_truth_state,
                "writable_truth_state": writable_truth_state,
                "parity_state": row["parityState"],
                "publication_state": row["publicationState"],
                "runtime_publication_state": row["runtimePublicationState"],
                "route_exposure_state": row["routeExposureState"],
                "browser_posture_state": row["browserPostureState"],
                "runtime_publication_bundle_ref": row["runtimePublicationBundleRef"],
                "release_publication_parity_ref": row["releasePublicationParityRef"],
                "design_contract_publication_bundle_ref": row["designContractPublicationBundleRef"] or "",
                "design_contract_lint_verdict_ref": row["designContractLintVerdictRef"] or "",
                "projection_contract_version_set_ref": row["projectionContractVersionSetRef"] or "",
                "reason_refs": "; ".join(row["reasonRefs"]),
                "recovery_disposition_refs": "; ".join(row["recoveryDispositionRefs"]),
                "notes": row["notes"],
            }
        )

        for disposition_ref in row["recoveryDispositionRefs"]:
            disposition_kind = "freeze" if disposition_ref.startswith("RFD_") else "recovery"
            recovery_matrix_rows.append(
                {
                    "surface_authority_verdict_id": surface_verdict_id,
                    "audience_surface_runtime_binding_id": runtime_binding_id,
                    "inventory_surface_ref": row["inventorySurfaceRef"] or "",
                    "audience_surface": audience_surface,
                    "route_family_ref": row["routeFamilyRef"],
                    "shell_type": row["shellType"],
                    "binding_state": binding_state,
                    "calm_truth_state": calm_truth_state,
                    "writable_truth_state": writable_truth_state,
                    "disposition_kind": disposition_kind,
                    "disposition_ref": disposition_ref,
                    "disposition_label": humanize_ref(disposition_ref),
                }
            )

    route_refs_in_catalog = {row["routeFamilyRef"] for row in catalog_rows}
    surface_refs_in_catalog = {
        row["inventorySurfaceRef"] for row in catalog_rows if row["inventorySurfaceRef"]
    }

    require(
        route_refs_in_catalog == route_inventory_refs,
        "PREREQUISITE_GAP_130_ROUTE_FAMILY_COVERAGE_DRIFT",
    )
    require(
        surface_refs_in_catalog == audience_inventory_refs,
        "PREREQUISITE_GAP_130_AUDIENCE_SURFACE_COVERAGE_DRIFT",
    )
    require(
        shell_route_refs.issubset(route_refs_in_catalog),
        "PREREQUISITE_GAP_130_SHELL_ROUTE_BINDING_DRIFT",
    )

    binding_counts = Counter(row["bindingState"] for row in catalog_rows)
    calm_counts = Counter(row["calmTruthState"] for row in catalog_rows)
    writable_counts = Counter(row["writableTruthState"] for row in catalog_rows)

    reason_counts = Counter(
        reason_ref for row in catalog_rows for reason_ref in row["reasonRefs"]
    )
    summary = {
        "row_count": len(catalog_rows),
        "inventoried_surface_count": len(audience_inventory_refs),
        "route_family_count": len(route_inventory_refs),
        "publishable_live_count": binding_counts.get("publishable_live", 0),
        "recovery_only_count": binding_counts.get("recovery_only", 0),
        "partial_count": binding_counts.get("partial", 0),
        "blocked_count": binding_counts.get("blocked", 0),
        "drifted_count": binding_counts.get("drifted", 0),
        "calm_allowed_count": calm_counts.get("allowed", 0),
        "calm_suppressed_count": calm_counts.get("suppressed", 0),
        "diagnostic_only_count": calm_counts.get("diagnostic_only", 0),
        "writable_allowed_count": writable_counts.get("allowed", 0),
        "writable_blocked_count": writable_counts.get("blocked", 0),
        "writable_recovery_only_count": writable_counts.get("recovery_only", 0),
    }

    filter_options = {
        "audienceSurfaces": [
            {"value": value, "label": value, "count": audience_surface_counts[value]}
            for value in sorted(audience_surface_counts)
        ],
        "shellTypes": [
            {"value": value, "label": value, "count": shell_counts[value]}
            for value in sorted(shell_counts)
        ],
        "bindingStates": [
            {
                "value": value,
                "label": value.replace("_", " "),
                "count": binding_counts.get(value, 0),
            }
            for value in [
                "publishable_live",
                "recovery_only",
                "partial",
                "blocked",
                "drifted",
            ]
        ],
        "routeFamilies": [
            {
                "value": row["routeFamilyRef"],
                "label": row["routeFamilyLabel"],
            }
            for row in sorted(catalog_rows, key=lambda row: (row["routeFamilyRef"], row["inventorySurfaceLabel"]))
        ],
    }

    state_reference_rows = [
        {
            "bindingState": "publishable_live",
            "title": "Publishable live",
            "summary": "Exact parity, calm truth, and writable action are all legal.",
        },
        {
            "bindingState": "recovery_only",
            "title": "Recovery only",
            "summary": "Only bounded same-shell recovery or fallback action remains legal.",
        },
        {
            "bindingState": "partial",
            "title": "Partial",
            "summary": "The tuple exists but current live truth is still guarded or read-only.",
        },
        {
            "bindingState": "blocked",
            "title": "Blocked",
            "summary": "A hard publication or authority gap prevents live presentation.",
        },
        {
            "bindingState": "drifted",
            "title": "Drifted",
            "summary": "The tuple exists but must not present as live until drift is cleared.",
        },
    ]

    catalog = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Finalize the Phase 0 audience-surface runtime bindings and publication parity so every current audience surface and route family has one explicit live, recovery, blocked, partial, or drifted truth row.",
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": [
            "data/analysis/surface_authority_tuple_catalog.json",
            "data/analysis/manifest_fusion_verdicts.json",
            "data/analysis/frontend_contract_manifests.json",
            "data/analysis/design_contract_publication_bundles.json",
            "data/analysis/release_publication_parity_records.json",
            "data/analysis/runtime_publication_bundles.json",
            "data/analysis/persistent_shell_contracts.json",
        ],
        "assumptions": [
            {
                "assumptionId": "ASSUMPTION_130_SEQ127_IS_CURRENT_SURFACE_JOIN",
                "statement": "seq_127 is the authoritative current join across shells, manifests, design bundles, runtime publication, and local release parity; seq_130 finalizes its row-level live/recovery/writable truth rather than re-inventing that join.",
            },
            {
                "assumptionId": "ASSUMPTION_130_LOCAL_PARITY_STILL_HAS_BROWSER_CEILINGS",
                "statement": "The local release parity row is exact, but current browser truth remains bounded by design lint, accessibility, and browser-posture ceilings; exact parity alone does not reopen calm live posture.",
            },
        ],
        "summary": summary,
        "publicationCeilingReasons": local_parity.get("bindingCeilingReasons", []),
        "localRuntimePublicationBundleRef": LOCAL_RUNTIME_BUNDLE_REF,
        "localReleasePublicationParityRef": LOCAL_PARITY_REF,
        "releaseRef": local_parity["releaseRef"],
        "parityState": local_parity["parityState"],
        "routeExposureState": local_parity["routeExposureState"],
        "matrixGroupStates": local_parity.get("matrixGroupStates", {}),
        "stateCatalog": STATE_CATALOG,
        "verdictRules": VERDICT_RULES,
        "reasonCatalog": reason_catalog,
        "declaredDispositionCatalog": DECLARED_DISPOSITION_CATALOG,
        "reasonCounts": dict(sorted(reason_counts.items())),
        "filterOptions": filter_options,
        "stateReferenceRows": state_reference_rows,
        "surfaceAuthorityRows": catalog_rows,
    }

    verdicts = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "verdictRules": VERDICT_RULES,
        "summary": summary,
        "bindingStateCounts": dict(sorted(binding_counts.items())),
        "calmTruthCounts": dict(sorted(calm_counts.items())),
        "writableTruthCounts": dict(sorted(writable_counts.items())),
        "reasonCounts": dict(sorted(reason_counts.items())),
        "publishableLiveRowRefs": [
            row["surfaceAuthorityVerdictId"]
            for row in catalog_rows
            if row["bindingState"] == "publishable_live"
        ],
        "recoveryOnlyRowRefs": [
            row["surfaceAuthorityVerdictId"]
            for row in catalog_rows
            if row["bindingState"] == "recovery_only"
        ],
        "partialRowRefs": [
            row["surfaceAuthorityVerdictId"]
            for row in catalog_rows
            if row["bindingState"] == "partial"
        ],
        "blockedRowRefs": [
            row["surfaceAuthorityVerdictId"]
            for row in catalog_rows
            if row["bindingState"] == "blocked"
        ],
        "driftedRowRefs": [
            row["surfaceAuthorityVerdictId"]
            for row in catalog_rows
            if row["bindingState"] == "drifted"
        ],
        "declaredDispositionCatalog": DECLARED_DISPOSITION_CATALOG,
        "rows": [
            {
                "surfaceAuthorityVerdictId": row["surfaceAuthorityVerdictId"],
                "audienceSurfaceRuntimeBindingId": row["audienceSurfaceRuntimeBindingId"],
                "inventorySurfaceRef": row["inventorySurfaceRef"],
                "routeFamilyRef": row["routeFamilyRef"],
                "bindingState": row["bindingState"],
                "calmTruthState": row["calmTruthState"],
                "writableTruthState": row["writableTruthState"],
                "reasonRefs": row["reasonRefs"],
                "recoveryDispositionRefs": row["recoveryDispositionRefs"],
            }
            for row in catalog_rows
        ],
    }

    return {
        "catalog": catalog,
        "verdicts": verdicts,
        "publicationMatrixRows": publication_matrix_rows,
        "recoveryMatrixRows": recovery_matrix_rows,
    }


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    table = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    table.extend("| " + " | ".join(row) + " |" for row in rows)
    return "\n".join(table)


def build_docs(catalog: dict[str, Any], verdicts: dict[str, Any]) -> dict[str, str]:
    summary = catalog["summary"]
    rows = catalog["surfaceAuthorityRows"]
    state_rows = [
        [state.replace("_", " "), str(summary[f"{state}_count"])]
        for state in ["publishable_live", "recovery_only", "partial", "blocked", "drifted"]
    ]
    truth_rows = [
        ["allowed", str(summary["calm_allowed_count"]), str(summary["writable_allowed_count"])],
        ["suppressed", str(summary["calm_suppressed_count"]), str(summary["writable_blocked_count"])],
        ["diagnostic_only", str(summary["diagnostic_only_count"]), str(summary["writable_recovery_only_count"])],
    ]
    blocked_rows = [row for row in rows if row["bindingState"] == "blocked"]
    recovery_rows = [row for row in rows if row["bindingState"] == "recovery_only"]

    bindings_doc = dedent(
        f"""
        # Audience Surface Runtime Bindings Final

        `seq_130` finalizes the Phase 0 audience-surface runtime truth by publishing one explicit row per current inventoried surface plus one explicit blocked gap row for the standalone assistive control shell. The catalog is derived from the integrated `seq_127` fusion layer and the current local `ReleasePublicationParityRecord`, not from local page discovery.

        ## Current Estate

        {markdown_table(["Binding state", "Rows"], state_rows)}

        ## Truth Ceiling

        - Local runtime-publication bundle: `{catalog["localRuntimePublicationBundleRef"]}`
        - Local release-publication parity: `{catalog["localReleasePublicationParityRef"]}`
        - Current parity state: `{catalog["parityState"]}`
        - Current route exposure state: `{catalog["routeExposureState"]}`

        The active parity tuple is exact, but current browser truth remains bounded by these ceiling reasons:

        {chr(10).join(f"- {reason}" for reason in catalog["publicationCeilingReasons"])}

        ## Truth Law

        {markdown_table(["Truth state", "Calm rows", "Writable rows"], truth_rows)}

        Exact parity does not reopen calm or writable posture on its own. `publishable_live` still requires exact parity plus publishable browser posture, passing design lint, and complete accessibility.
        """
    ).strip()

    parity_doc = dedent(
        f"""
        # Publication Parity Finalization

        `seq_130` closes the gap between shell existence, frontend-manifest publication, runtime-publication bundles, release-publication parity, and surface-level calm or writable truth. Every current row now names the same active runtime bundle and parity record, then downgrades explicitly instead of implying “live enough.”

        ## Finalization Rules

        {chr(10).join(f"- `{rule['ruleId']}`: {rule['summary']}" for rule in verdicts["verdictRules"])}

        ## Current Parity Result

        - Release reference: `{catalog["releaseRef"]}`
        - Runtime bundle: `{catalog["localRuntimePublicationBundleRef"]}`
        - Release parity record: `{catalog["localReleasePublicationParityRef"]}`
        - Publishable-live rows now: `{summary["publishable_live_count"]}`
        - Recovery-only rows now: `{summary["recovery_only_count"]}`
        - Partial rows now: `{summary["partial_count"]}`
        - Blocked rows now: `{summary["blocked_count"]}`

        The current Phase 0 estate is intentionally honest: the repo publishes exact parity, but no current row is allowed to claim calm live truth until the remaining browser ceilings clear.
        """
    ).strip()

    verdict_doc = dedent(
        f"""
        # Surface Authority Verdict Matrix

        This matrix is the current Phase 0 audience-surface truth layer that gateways, shells, governance, and tests can all consume without recomputing tuple logic ad hoc.

        ## State Counts

        {markdown_table(
            ["State", "Count"],
            [[state.replace("_", " "), str(count)] for state, count in sorted(verdicts["bindingStateCounts"].items())],
        )}

        ## Blocked Rows

        {markdown_table(
            ["Surface", "Route family", "Reasons", "Declared recovery or freeze"],
            [
                [
                    row["inventorySurfaceLabel"],
                    row["routeFamilyRef"],
                    ", ".join(row["reasonRefs"]),
                    ", ".join(row["recoveryDispositionRefs"]),
                ]
                for row in blocked_rows
            ],
        )}

        ## Recovery-Only Rows

        {markdown_table(
            ["Surface", "Route family", "Writable truth", "Declared recovery or freeze"],
            [
                [
                    row["inventorySurfaceLabel"],
                    row["routeFamilyRef"],
                    row["writableTruthState"],
                    ", ".join(row["recoveryDispositionRefs"]),
                ]
                for row in recovery_rows
            ],
        )}
        """
    ).strip()

    recovery_doc = dedent(
        f"""
        # Runtime Binding Gap And Recovery Rules

        The final catalog keeps blocked and recovery-only posture first-class. No row is allowed to degrade into a generic blank state.

        ## Declared Non-Live Dispositions

        {markdown_table(
            ["Disposition ref", "Kind", "Meaning"],
            [
                [row["dispositionRef"], row["dispositionKind"], row["summary"]]
                for row in verdicts["declaredDispositionCatalog"]
            ],
        )}

        ## Current Gap Closures

        - Surfaces do not imply publishable-live posture merely because a shell exists.
        - Exact parity does not outrun browser truth, accessibility, or design publication ceilings.
        - Blocked rows remain explicit, including the standalone assistive shell gap.
        - Recovery-only rows stay bound to declared recovery or freeze dispositions so later tests and governance flows can consume the same machine-readable truth.
        """
    ).strip()

    return {
        "bindings": bindings_doc,
        "parity": parity_doc,
        "verdict": verdict_doc,
        "recovery": recovery_doc,
    }


def build_board_html(catalog: dict[str, Any]) -> str:
    board_payload = {
        "task_id": catalog["task_id"],
        "generated_at": catalog["generated_at"],
        "visual_mode": catalog["visual_mode"],
        "summary": catalog["summary"],
        "stateCatalog": catalog["stateCatalog"],
        "filterOptions": catalog["filterOptions"],
        "stateReferenceRows": catalog["stateReferenceRows"],
        "publicationCeilingReasons": catalog["publicationCeilingReasons"],
        "surfaceAuthorityRows": catalog["surfaceAuthorityRows"],
    }
    json_payload = json.dumps(board_payload, separators=(",", ":"))

    html = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Audience Surface Parity Board</title>
            <style>
              :root {
                --canvas: #F7F8FA;
                --shell: #EEF2F6;
                --panel: #FFFFFF;
                --inset: #E8EEF3;
                --border: rgba(36, 49, 61, 0.12);
                --text-strong: #0F1720;
                --text: #24313D;
                --text-muted: #5E6B78;
                --accent-live: #117A55;
                --accent-diagnostic: #2F6FED;
                --accent-recovery: #B7791F;
                --accent-blocked: #B42318;
                --accent-parity: #5B61F6;
                --accent-partial: #7A5AF8;
                --shadow: 0 20px 50px rgba(15, 23, 32, 0.08);
                --radius-xl: 24px;
                --radius-lg: 20px;
                --radius-md: 16px;
                --radius-sm: 12px;
              }
              * { box-sizing: border-box; }
              html { background: var(--canvas); }
              body {
                margin: 0;
                min-height: 100vh;
                background:
                  radial-gradient(circle at top right, rgba(91, 97, 246, 0.08), transparent 28%),
                  radial-gradient(circle at left 18%, rgba(17, 122, 85, 0.08), transparent 24%),
                  linear-gradient(180deg, var(--canvas), #f1f4f8);
                color: var(--text);
                font-family: "Avenir Next", "Segoe UI", sans-serif;
              }
              body[data-reduced-motion="true"] * {
                animation-duration: 0.01ms !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
              h1, h2, h3, .wordmark {
                font-family: "Iowan Old Style", "Palatino Linotype", serif;
                letter-spacing: 0.01em;
              }
              button, select { font: inherit; }
              .page {
                max-width: 1560px;
                margin: 0 auto;
                padding: 0 20px 40px;
              }
              .masthead {
                position: sticky;
                top: 0;
                z-index: 20;
                height: 72px;
                display: grid;
                grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 220px));
                gap: 14px;
                align-items: center;
                padding: 12px 0;
                background: rgba(247, 248, 250, 0.94);
                backdrop-filter: blur(16px);
              }
              .brand,
              .summary-pill,
              .panel,
              .filter-rail,
              .inspector {
                border: 1px solid var(--border);
                background: rgba(255, 255, 255, 0.92);
                box-shadow: var(--shadow);
              }
              .brand,
              .summary-pill {
                min-height: 48px;
                border-radius: 999px;
                padding: 10px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
              }
              .brand {
                justify-content: space-between;
              }
              .brand-copy {
                display: grid;
                gap: 2px;
              }
              .brand-mode {
                font-size: 11px;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: var(--text-muted);
              }
              .brand-title {
                font-size: 20px;
                color: var(--text-strong);
              }
              .wordmark {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .tuple-mark {
                width: 34px;
                height: 34px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: linear-gradient(135deg, rgba(91, 97, 246, 0.14), rgba(17, 122, 85, 0.12));
              }
              .summary-pill {
                justify-content: space-between;
              }
              .summary-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--text-muted);
              }
              .summary-value {
                font-size: 18px;
                font-weight: 700;
                color: var(--text-strong);
              }
              .layout {
                display: grid;
                grid-template-columns: 280px minmax(0, 1fr) 404px;
                gap: 20px;
                align-items: start;
                margin-top: 20px;
              }
              .filter-rail,
              .inspector {
                position: sticky;
                top: 92px;
                z-index: 1;
                border-radius: var(--radius-xl);
                padding: 18px;
              }
              .filter-rail {
                display: grid;
                gap: 18px;
              }
              .filter-group {
                display: grid;
                gap: 8px;
              }
              .filter-group label {
                font-size: 12px;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.1em;
              }
              select {
                min-height: 44px;
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                background: var(--panel);
                color: var(--text);
                padding: 0 12px;
              }
              .filter-note,
              .inspector-note,
              .caption,
              .legend-copy {
                margin: 0;
                color: var(--text-muted);
                line-height: 1.55;
              }
              .board-stack {
                display: grid;
                gap: 20px;
                position: relative;
                z-index: 2;
              }
              .panel {
                border-radius: var(--radius-xl);
                padding: 18px;
              }
              .panel-header {
                display: flex;
                justify-content: space-between;
                gap: 16px;
                align-items: baseline;
                margin-bottom: 14px;
              }
              .panel-header h2,
              .inspector h2 {
                margin: 0;
                font-size: 20px;
                color: var(--text-strong);
              }
              .panel-header span {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--text-muted);
              }
              .state-reference-table,
              .heatmap-table,
              .parity-table {
                width: 100%;
                border-collapse: collapse;
              }
              .state-reference-table th,
              .state-reference-table td,
              .heatmap-table th,
              .heatmap-table td,
              .parity-table th,
              .parity-table td {
                padding: 11px 12px;
                border-bottom: 1px solid var(--border);
                vertical-align: top;
              }
              .state-reference-table th,
              .heatmap-table th,
              .parity-table th {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
                text-align: left;
              }
              .lattice-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 12px;
              }
              .lattice-node,
              .heatmap-button,
              .table-button {
                width: 100%;
                min-height: 96px;
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(238, 242, 246, 0.86));
                color: inherit;
                text-align: left;
                padding: 14px;
                cursor: pointer;
                transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
              }
              .heatmap-button,
              .table-button {
                min-height: 44px;
                border-radius: var(--radius-sm);
                padding: 0;
                background: transparent;
              }
              .lattice-node:hover,
              .lattice-node:focus-visible,
              .heatmap-button:hover,
              .heatmap-button:focus-visible,
              .table-button:hover,
              .table-button:focus-visible {
                outline: none;
                border-color: rgba(47, 111, 237, 0.44);
                box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.12);
                transform: translateY(-1px);
              }
              [data-selected="true"] {
                border-color: rgba(47, 111, 237, 0.76) !important;
                box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.14);
              }
              .node-topline {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
              }
              .node-title {
                font-size: 16px;
                color: var(--text-strong);
              }
              .node-meta,
              .mono,
              .inspector-list code,
              .heatmap-subtext {
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 12px;
                color: var(--text-muted);
                word-break: break-word;
              }
              .node-summary {
                margin: 10px 0 0;
                color: var(--text-muted);
                line-height: 1.5;
              }
              .badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 30px;
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
                color: white;
                white-space: nowrap;
              }
              .state-publishable_live { background: var(--accent-live); }
              .state-recovery_only { background: var(--accent-recovery); }
              .state-partial { background: var(--accent-parity); }
              .state-blocked { background: var(--accent-blocked); }
              .state-drifted { background: var(--accent-diagnostic); }
              .truth-chip {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 24px;
                padding: 4px 8px;
                border-radius: 999px;
                background: var(--shell);
                color: var(--text);
                font-size: 11px;
                font-weight: 700;
              }
              .heatmap-table tr,
              .parity-table tr {
                min-height: 44px;
              }
              .heatmap-cell {
                display: grid;
                gap: 4px;
                padding: 11px 12px;
              }
              .ladder {
                display: grid;
                gap: 12px;
              }
              .ladder-step {
                min-height: 120px;
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                background: linear-gradient(180deg, rgba(238, 242, 246, 0.94), rgba(255, 255, 255, 0.98));
                padding: 14px;
              }
              .ladder-step-header {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: baseline;
                margin-bottom: 8px;
              }
              .ladder-step h3 {
                margin: 0;
                font-size: 16px;
                color: var(--text-strong);
              }
              .inspector {
                display: grid;
                gap: 16px;
              }
              .inspector-card {
                min-height: 120px;
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(238,242,246,0.9));
                padding: 14px;
                scroll-margin-top: 110px;
              }
              .inspector-list {
                display: grid;
                gap: 8px;
              }
              .inspector-list div {
                display: grid;
                gap: 2px;
              }
              .inspector-key {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
              }
              .ceiling-list {
                display: grid;
                gap: 8px;
                padding-left: 18px;
                margin: 0;
              }
              .legend-stack {
                display: grid;
                gap: 10px;
              }
              .legend-row {
                display: flex;
                gap: 10px;
                align-items: center;
              }
              .visually-hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
              }
              @media (max-width: 1220px) {
                .layout {
                  grid-template-columns: 1fr;
                }
                .filter-rail,
                .inspector {
                  position: static;
                }
              }
              @media (max-width: 980px) {
                .masthead {
                  grid-template-columns: 1fr;
                  height: auto;
                  padding-bottom: 8px;
                }
                .page {
                  padding: 0 12px 24px;
                }
                .panel,
                .filter-rail,
                .inspector {
                  border-radius: 18px;
                }
              }
            </style>
          </head>
          <body>
            <script id="board-data" type="application/json">__BOARD_DATA__</script>
            <div class="page">
              <header class="masthead" aria-label="Board summary">
                <section class="brand">
                  <div class="wordmark">
                    <span class="tuple-mark" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="5" cy="10" r="3.5" stroke="#5B61F6" stroke-width="1.5"></circle>
                        <circle cx="15" cy="5" r="3" stroke="#117A55" stroke-width="1.5"></circle>
                        <circle cx="15" cy="15" r="3" stroke="#B7791F" stroke-width="1.5"></circle>
                        <path d="M8.4 8.2L12.2 6.1M8.4 11.8L12.2 13.9" stroke="#24313D" stroke-width="1.4" stroke-linecap="round"></path>
                      </svg>
                    </span>
                    <div class="brand-copy">
                      <span class="brand-mode">Vecells</span>
                      <span class="brand-title">Audience_Surface_Parity_Board</span>
                    </div>
                  </div>
                  <span class="mono" data-testid="generated-at"></span>
                </section>
                <section class="summary-pill">
                  <div>
                    <div class="summary-label">Current rows</div>
                    <div class="summary-value" data-testid="summary-row-count"></div>
                  </div>
                  <span class="badge state-partial" data-testid="summary-parity-state">exact parity</span>
                </section>
                <section class="summary-pill">
                  <div>
                    <div class="summary-label">Recovery only</div>
                    <div class="summary-value" data-testid="summary-recovery-count"></div>
                  </div>
                  <span class="truth-chip">bounded same-shell</span>
                </section>
                <section class="summary-pill">
                  <div>
                    <div class="summary-label">Blocked</div>
                    <div class="summary-value" data-testid="summary-blocked-count"></div>
                  </div>
                  <span class="truth-chip">explicitly surfaced</span>
                </section>
              </header>

              <div class="layout">
                <nav class="filter-rail" aria-label="Audience surface filters">
                  <div>
                    <h2>Filters</h2>
                    <p class="filter-note">
                      Every filter applies to the lattice, parity heatmap, recovery ladder, and
                      the lower table together.
                    </p>
                  </div>
                  <div class="filter-group">
                    <label for="filter-audience-surface">Audience surface</label>
                    <select id="filter-audience-surface" data-testid="filter-audience-surface"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-shell-type">Shell type</label>
                    <select id="filter-shell-type" data-testid="filter-shell-type"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-binding-state">Binding state</label>
                    <select id="filter-binding-state" data-testid="filter-binding-state"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-route-family">Route family</label>
                    <select id="filter-route-family" data-testid="filter-route-family"></select>
                  </div>
                  <section class="panel">
                    <div class="panel-header">
                      <h2>Ceiling</h2>
                      <span>Current law</span>
                    </div>
                    <ul class="ceiling-list" data-testid="ceiling-reasons"></ul>
                  </section>
                  <section class="panel">
                    <div class="panel-header">
                      <h2>Legend</h2>
                      <span>State law</span>
                    </div>
                    <div class="legend-stack" data-testid="state-legend"></div>
                  </section>
                </nav>

                <main class="board-stack">
                  <section class="panel">
                    <div class="panel-header">
                      <h2>Surface Lattice</h2>
                      <span>Audience and route tuples</span>
                    </div>
                    <p class="caption">
                      One node per current audience-surface plus route-family truth row. Selecting
                      a node synchronizes the parity heatmap, recovery ladder, and inspector.
                    </p>
                    <div class="lattice-grid" data-testid="surface-lattice"></div>
                  </section>

                  <section class="panel">
                    <div class="panel-header">
                      <h2>Parity Heatmap</h2>
                      <span>Calm and writable truth</span>
                    </div>
                    <table class="heatmap-table" data-testid="parity-heatmap">
                      <caption class="visually-hidden">Audience-surface parity heatmap</caption>
                      <thead>
                        <tr>
                          <th scope="col">Surface</th>
                          <th scope="col">Binding</th>
                          <th scope="col">Calm truth</th>
                          <th scope="col">Writable truth</th>
                          <th scope="col">Parity</th>
                        </tr>
                      </thead>
                      <tbody data-testid="heatmap-body"></tbody>
                    </table>
                  </section>

                  <section class="panel">
                    <div class="panel-header">
                      <h2>Recovery Ladder</h2>
                      <span>Declared non-live posture</span>
                    </div>
                    <div class="ladder" data-testid="recovery-ladder"></div>
                  </section>

                  <section class="panel">
                    <div class="panel-header">
                      <h2>Table Parity</h2>
                      <span>Accessible row parity</span>
                    </div>
                    <table class="parity-table" data-testid="table-parity">
                      <caption class="visually-hidden">Audience-surface runtime binding parity table</caption>
                      <thead>
                        <tr>
                          <th scope="col">Surface and route</th>
                          <th scope="col">Binding</th>
                          <th scope="col">Runtime and release</th>
                          <th scope="col">Reasons</th>
                        </tr>
                      </thead>
                      <tbody data-testid="parity-table-body"></tbody>
                    </table>
                  </section>

                  <section class="panel">
                    <div class="panel-header">
                      <h2>State Reference</h2>
                      <span>Rendering law</span>
                    </div>
                    <table class="state-reference-table" data-testid="state-reference-table">
                      <caption class="visually-hidden">Reference rows for live, recovery, partial, blocked, and drifted rendering</caption>
                      <thead>
                        <tr>
                          <th scope="col">State</th>
                          <th scope="col">Rendering summary</th>
                        </tr>
                      </thead>
                      <tbody data-testid="state-reference-body"></tbody>
                    </table>
                  </section>
                </main>

                <aside class="inspector" data-testid="inspector" aria-live="polite">
                  <div>
                    <h2>Inspector</h2>
                    <p class="inspector-note">
                      The inspector exposes the exact tuple and parity basis for the selected row.
                    </p>
                  </div>
                  <section class="inspector-card">
                    <div class="panel-header">
                      <h2>Selected row</h2>
                      <span data-testid="inspector-binding-state"></span>
                    </div>
                    <div class="inspector-list" data-testid="inspector-primary"></div>
                  </section>
                  <section class="inspector-card">
                    <div class="panel-header">
                      <h2>Tuple refs</h2>
                      <span>Exact handles</span>
                    </div>
                    <div class="inspector-list" data-testid="inspector-refs"></div>
                  </section>
                  <section class="inspector-card">
                    <div class="panel-header">
                      <h2>Reason refs</h2>
                      <span>Why this row is bounded</span>
                    </div>
                    <div class="inspector-list" data-testid="inspector-reasons"></div>
                  </section>
                </aside>
              </div>
            </div>

            <script>
              const board = JSON.parse(document.getElementById("board-data").textContent);
              const stateClassByBinding = {
                publishable_live: "state-publishable_live",
                recovery_only: "state-recovery_only",
                partial: "state-partial",
                blocked: "state-blocked",
                drifted: "state-drifted",
              };
              const truthLabel = {
                allowed: "allowed",
                suppressed: "suppressed",
                diagnostic_only: "diagnostic only",
                blocked: "blocked",
                recovery_only: "recovery only",
              };

              const filterEls = {
                audienceSurface: document.querySelector("[data-testid='filter-audience-surface']"),
                shellType: document.querySelector("[data-testid='filter-shell-type']"),
                bindingState: document.querySelector("[data-testid='filter-binding-state']"),
                routeFamily: document.querySelector("[data-testid='filter-route-family']"),
              };

              const latticeEl = document.querySelector("[data-testid='surface-lattice']");
              const heatmapBodyEl = document.querySelector("[data-testid='heatmap-body']");
              const recoveryEl = document.querySelector("[data-testid='recovery-ladder']");
              const tableBodyEl = document.querySelector("[data-testid='parity-table-body']");
              const inspectorPrimaryEl = document.querySelector("[data-testid='inspector-primary']");
              const inspectorRefsEl = document.querySelector("[data-testid='inspector-refs']");
              const inspectorReasonsEl = document.querySelector("[data-testid='inspector-reasons']");
              const inspectorBindingStateEl = document.querySelector("[data-testid='inspector-binding-state']");

              let filters = {
                audienceSurface: "all",
                shellType: "all",
                bindingState: "all",
                routeFamily: "all",
              };
              let selectedId = board.surfaceAuthorityRows[0]?.surfaceAuthorityVerdictId ?? null;

              function setReducedMotionFlag() {
                const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
                const update = () => {
                  document.body.setAttribute("data-reduced-motion", mediaQuery.matches ? "true" : "false");
                };
                update();
                if (typeof mediaQuery.addEventListener === "function") {
                  mediaQuery.addEventListener("change", update);
                } else if (typeof mediaQuery.addListener === "function") {
                  mediaQuery.addListener(update);
                }
              }

              function formatLabel(value) {
                return String(value || "").replace(/_/g, " ");
              }

              function createOption(select, value, label) {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                select.appendChild(option);
              }

              function populateFilters() {
                createOption(filterEls.audienceSurface, "all", "All audience surfaces");
                board.filterOptions.audienceSurfaces.forEach((option) => {
                  createOption(filterEls.audienceSurface, option.value, `${option.label} (${option.count})`);
                });
                createOption(filterEls.shellType, "all", "All shell types");
                board.filterOptions.shellTypes.forEach((option) => {
                  createOption(filterEls.shellType, option.value, `${option.label} (${option.count})`);
                });
                createOption(filterEls.bindingState, "all", "All binding states");
                board.filterOptions.bindingStates.forEach((option) => {
                  createOption(filterEls.bindingState, option.value, `${formatLabel(option.label)} (${option.count})`);
                });
                createOption(filterEls.routeFamily, "all", "All route families");
                const seenRouteRefs = new Set();
                board.filterOptions.routeFamilies.forEach((option) => {
                  if (seenRouteRefs.has(option.value)) return;
                  seenRouteRefs.add(option.value);
                  createOption(filterEls.routeFamily, option.value, `${option.value} · ${option.label}`);
                });
              }

              function getVisibleRows() {
                return board.surfaceAuthorityRows.filter((row) => {
                  if (filters.audienceSurface !== "all" && row.audienceSurface !== filters.audienceSurface) return false;
                  if (filters.shellType !== "all" && row.shellType !== filters.shellType) return false;
                  if (filters.bindingState !== "all" && row.bindingState !== filters.bindingState) return false;
                  if (filters.routeFamily !== "all" && row.routeFamilyRef !== filters.routeFamily) return false;
                  return true;
                });
              }

              function ensureSelection(visibleRows) {
                if (!visibleRows.length) {
                  selectedId = null;
                  return;
                }
                if (!visibleRows.some((row) => row.surfaceAuthorityVerdictId === selectedId)) {
                  selectedId = visibleRows[0].surfaceAuthorityVerdictId;
                }
              }

              function getSelectedRow(visibleRows) {
                return visibleRows.find((row) => row.surfaceAuthorityVerdictId === selectedId) || visibleRows[0] || null;
              }

              function bindDirectionalNavigation(button, visibleRows, currentId) {
                button.addEventListener("keydown", (event) => {
                  if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key)) return;
                  event.preventDefault();
                  const ids = visibleRows.map((row) => row.surfaceAuthorityVerdictId);
                  const currentIndex = ids.indexOf(currentId);
                  if (currentIndex === -1) return;
                  const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
                  const nextIndex = Math.max(0, Math.min(ids.length - 1, currentIndex + delta));
                  selectedId = ids[nextIndex];
                  render();
                  const next = document.querySelector(`[data-row-id="${selectedId}"]`);
                  if (next) next.focus();
                });
              }

              function renderLegend() {
                const legendEl = document.querySelector("[data-testid='state-legend']");
                legendEl.innerHTML = "";
                Object.entries(board.stateCatalog.bindingState).forEach(([state, description]) => {
                  const row = document.createElement("div");
                  row.className = "legend-row";
                  row.innerHTML = `
                    <span class="badge ${stateClassByBinding[state]}">${formatLabel(state)}</span>
                    <p class="legend-copy">${description}</p>
                  `;
                  legendEl.appendChild(row);
                });
              }

              function renderCeilingReasons() {
                const ceilingEl = document.querySelector("[data-testid='ceiling-reasons']");
                ceilingEl.innerHTML = "";
                board.publicationCeilingReasons.forEach((reason) => {
                  const item = document.createElement("li");
                  item.textContent = reason;
                  ceilingEl.appendChild(item);
                });
              }

              function renderStateReference() {
                const body = document.querySelector("[data-testid='state-reference-body']");
                body.innerHTML = "";
                board.stateReferenceRows.forEach((row) => {
                  const tr = document.createElement("tr");
                  tr.setAttribute("data-testid", `state-reference-${row.bindingState}`);
                  tr.innerHTML = `
                    <td>
                      <span class="badge ${stateClassByBinding[row.bindingState]}">${formatLabel(row.bindingState)}</span>
                    </td>
                    <td>${row.summary}</td>
                  `;
                  body.appendChild(tr);
                });
              }

              function renderSummary(visibleRows) {
                document.querySelector("[data-testid='generated-at']").textContent = board.generated_at;
                document.querySelector("[data-testid='summary-row-count']").textContent = String(visibleRows.length);
                document.querySelector("[data-testid='summary-recovery-count']").textContent = String(
                  visibleRows.filter((row) => row.bindingState === "recovery_only").length,
                );
                document.querySelector("[data-testid='summary-blocked-count']").textContent = String(
                  visibleRows.filter((row) => row.bindingState === "blocked").length,
                );
              }

              function renderLattice(visibleRows, selectedRow) {
                latticeEl.innerHTML = "";
                visibleRows.forEach((row) => {
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "lattice-node";
                  button.dataset.testid = `lattice-node-${row.surfaceAuthorityVerdictId}`;
                  button.dataset.rowId = row.surfaceAuthorityVerdictId;
                  button.dataset.selected = String(selectedRow && selectedRow.surfaceAuthorityVerdictId === row.surfaceAuthorityVerdictId);
                  button.setAttribute("data-testid", `lattice-node-${row.surfaceAuthorityVerdictId}`);
                  button.innerHTML = `
                    <div class="node-topline">
                      <div>
                        <div class="node-title">${row.inventorySurfaceLabel}</div>
                        <div class="node-meta">${row.routeFamilyRef}</div>
                      </div>
                      <span class="badge ${stateClassByBinding[row.bindingState]}">${formatLabel(row.bindingState)}</span>
                    </div>
                    <p class="node-summary">${row.audienceSurface} · ${row.shellType} shell</p>
                    <div class="node-meta">${row.calmTruthState} calm · ${row.writableTruthState} writable</div>
                  `;
                  button.addEventListener("click", () => {
                    selectedId = row.surfaceAuthorityVerdictId;
                    render();
                  });
                  bindDirectionalNavigation(button, visibleRows, row.surfaceAuthorityVerdictId);
                  latticeEl.appendChild(button);
                });
              }

              function renderHeatmap(visibleRows, selectedRow) {
                heatmapBodyEl.innerHTML = "";
                visibleRows.forEach((row) => {
                  const tr = document.createElement("tr");
                  tr.dataset.selected = String(selectedRow && selectedRow.surfaceAuthorityVerdictId === row.surfaceAuthorityVerdictId);
                  tr.innerHTML = `
                    <td>
                      <button type="button" class="heatmap-button" data-testid="heatmap-row-${row.surfaceAuthorityVerdictId}" data-row-id="${row.surfaceAuthorityVerdictId}">
                        <div class="heatmap-cell">
                          <strong>${row.inventorySurfaceLabel}</strong>
                          <span class="heatmap-subtext">${row.routeFamilyRef}</span>
                        </div>
                      </button>
                    </td>
                    <td><span class="badge ${stateClassByBinding[row.bindingState]}">${formatLabel(row.bindingState)}</span></td>
                    <td><span class="truth-chip">${truthLabel[row.calmTruthState]}</span></td>
                    <td><span class="truth-chip">${truthLabel[row.writableTruthState]}</span></td>
                    <td><span class="truth-chip">${row.parityState}</span></td>
                  `;
                  const button = tr.querySelector("button");
                  button.addEventListener("click", () => {
                    selectedId = row.surfaceAuthorityVerdictId;
                    render();
                  });
                  bindDirectionalNavigation(button, visibleRows, row.surfaceAuthorityVerdictId);
                  heatmapBodyEl.appendChild(tr);
                });
              }

              function renderRecovery(selectedRow) {
                recoveryEl.innerHTML = "";
                if (!selectedRow) return;
                const primary = document.createElement("div");
                primary.className = "ladder-step";
                primary.setAttribute("data-testid", `recovery-primary-${selectedRow.surfaceAuthorityVerdictId}`);
                primary.innerHTML = `
                  <div class="ladder-step-header">
                    <h3>${selectedRow.inventorySurfaceLabel}</h3>
                    <span class="badge ${stateClassByBinding[selectedRow.bindingState]}">${formatLabel(selectedRow.bindingState)}</span>
                  </div>
                  <p class="caption">${selectedRow.notes}</p>
                `;
                recoveryEl.appendChild(primary);

                selectedRow.recoveryDispositionRefs.forEach((ref, index) => {
                  const step = document.createElement("div");
                  step.className = "ladder-step";
                  step.setAttribute("data-testid", `recovery-step-${index}`);
                  step.innerHTML = `
                    <div class="ladder-step-header">
                      <h3>${ref}</h3>
                      <span class="truth-chip">${ref.startsWith("RFD_") ? "freeze" : "recovery"}</span>
                    </div>
                    <p class="caption">${formatLabel(ref)}</p>
                  `;
                  recoveryEl.appendChild(step);
                });
              }

              function renderInspector(selectedRow) {
                inspectorPrimaryEl.innerHTML = "";
                inspectorRefsEl.innerHTML = "";
                inspectorReasonsEl.innerHTML = "";
                if (!selectedRow) {
                  inspectorBindingStateEl.textContent = "No visible row";
                  return;
                }
                inspectorBindingStateEl.innerHTML = `<span class="badge ${stateClassByBinding[selectedRow.bindingState]}">${formatLabel(selectedRow.bindingState)}</span>`;
                [
                  ["Surface", selectedRow.inventorySurfaceLabel],
                  ["Audience", selectedRow.audienceSurface],
                  ["Route family", selectedRow.routeFamilyRef],
                  ["Shell", selectedRow.shellType],
                  ["Calm truth", selectedRow.calmTruthState],
                  ["Writable truth", selectedRow.writableTruthState],
                ].forEach(([label, value]) => {
                  const wrapper = document.createElement("div");
                  wrapper.innerHTML = `<span class="inspector-key">${label}</span><span>${value}</span>`;
                  inspectorPrimaryEl.appendChild(wrapper);
                });
                [
                  ["Binding id", selectedRow.audienceSurfaceRuntimeBindingId],
                  ["Inventory surface", selectedRow.inventorySurfaceRef || "Not inventoried"],
                  ["Runtime bundle", selectedRow.runtimePublicationBundleRef],
                  ["Release parity", selectedRow.releasePublicationParityRef],
                  ["Manifest", selectedRow.frontendContractManifestRef || "Not published"],
                  ["Design bundle", selectedRow.designContractPublicationBundleRef || "Not published"],
                  ["Projection set", selectedRow.projectionContractVersionSetRef || "Not published"],
                ].forEach(([label, value]) => {
                  const wrapper = document.createElement("div");
                  wrapper.innerHTML = `<span class="inspector-key">${label}</span><code>${value}</code>`;
                  inspectorRefsEl.appendChild(wrapper);
                });
                selectedRow.reasonRefs.forEach((reasonRef) => {
                  const wrapper = document.createElement("div");
                  wrapper.innerHTML = `<span class="inspector-key">${reasonRef}</span><span>${formatLabel(reasonRef)}</span>`;
                  inspectorReasonsEl.appendChild(wrapper);
                });
              }

              function renderTable(visibleRows, selectedRow) {
                tableBodyEl.innerHTML = "";
                visibleRows.forEach((row) => {
                  const tr = document.createElement("tr");
                  tr.dataset.selected = String(selectedRow && selectedRow.surfaceAuthorityVerdictId === row.surfaceAuthorityVerdictId);
                  tr.innerHTML = `
                    <td>
                      <button type="button" class="table-button" data-testid="table-row-${row.surfaceAuthorityVerdictId}" data-row-id="${row.surfaceAuthorityVerdictId}">
                        <div class="heatmap-cell">
                          <strong>${row.inventorySurfaceLabel}</strong>
                          <span class="heatmap-subtext">${row.audienceSurface} · ${row.routeFamilyRef}</span>
                        </div>
                      </button>
                    </td>
                    <td>
                      <div class="heatmap-cell">
                        <span class="badge ${stateClassByBinding[row.bindingState]}">${formatLabel(row.bindingState)}</span>
                        <span class="heatmap-subtext">${row.calmTruthState} calm · ${row.writableTruthState} writable</span>
                      </div>
                    </td>
                    <td>
                      <div class="heatmap-cell">
                        <span class="heatmap-subtext">${row.runtimePublicationBundleRef}</span>
                        <span class="heatmap-subtext">${row.releasePublicationParityRef}</span>
                      </div>
                    </td>
                    <td>
                      <div class="heatmap-cell">
                        <span>${row.reasonRefs.join(", ") || "None"}</span>
                        <span class="heatmap-subtext">${row.recoveryDispositionRefs.join(", ") || "None declared"}</span>
                      </div>
                    </td>
                  `;
                  const button = tr.querySelector("button");
                  button.addEventListener("click", () => {
                    selectedId = row.surfaceAuthorityVerdictId;
                    render();
                  });
                  bindDirectionalNavigation(button, visibleRows, row.surfaceAuthorityVerdictId);
                  tableBodyEl.appendChild(tr);
                });
              }

              function render() {
                const visibleRows = getVisibleRows();
                ensureSelection(visibleRows);
                const selectedRow = getSelectedRow(visibleRows);
                renderSummary(visibleRows);
                renderLattice(visibleRows, selectedRow);
                renderHeatmap(visibleRows, selectedRow);
                renderRecovery(selectedRow);
                renderInspector(selectedRow);
                renderTable(visibleRows, selectedRow);
              }

              function wireFilters() {
                Object.entries(filterEls).forEach(([key, element]) => {
                  element.addEventListener("change", () => {
                    filters[key] = element.value;
                    render();
                  });
                });
              }

              setReducedMotionFlag();
              populateFilters();
              renderLegend();
              renderCeilingReasons();
              renderStateReference();
              wireFilters();
              render();
            </script>
          </body>
        </html>
        """
    ).strip()

    return html.replace("__BOARD_DATA__", json_payload)


def main() -> None:
    built = build_binding_catalog()
    catalog = built["catalog"]
    verdicts = built["verdicts"]
    publication_matrix_rows = built["publicationMatrixRows"]
    recovery_matrix_rows = built["recoveryMatrixRows"]
    docs = build_docs(catalog, verdicts)

    write_json(BINDING_CATALOG_PATH, catalog)
    write_json(SURFACE_AUTHORITY_VERDICTS_PATH, verdicts)
    write_csv(
        PUBLICATION_PARITY_MATRIX_PATH,
        publication_matrix_rows,
        [
            "surface_authority_verdict_id",
            "audience_surface_runtime_binding_id",
            "inventory_surface_ref",
            "audience_surface",
            "route_family_ref",
            "shell_type",
            "binding_state",
            "calm_truth_state",
            "writable_truth_state",
            "parity_state",
            "publication_state",
            "runtime_publication_state",
            "route_exposure_state",
            "browser_posture_state",
            "runtime_publication_bundle_ref",
            "release_publication_parity_ref",
            "design_contract_publication_bundle_ref",
            "design_contract_lint_verdict_ref",
            "projection_contract_version_set_ref",
            "reason_refs",
            "recovery_disposition_refs",
            "notes",
        ],
    )
    write_csv(
        ROUTE_RECOVERY_DISPOSITION_MATRIX_PATH,
        recovery_matrix_rows,
        [
            "surface_authority_verdict_id",
            "audience_surface_runtime_binding_id",
            "inventory_surface_ref",
            "audience_surface",
            "route_family_ref",
            "shell_type",
            "binding_state",
            "calm_truth_state",
            "writable_truth_state",
            "disposition_kind",
            "disposition_ref",
            "disposition_label",
        ],
    )

    write_text(BINDINGS_DOC_PATH, docs["bindings"])
    write_text(PARITY_DOC_PATH, docs["parity"])
    write_text(VERDICT_DOC_PATH, docs["verdict"])
    write_text(RECOVERY_DOC_PATH, docs["recovery"])
    write_text(BOARD_PATH, build_board_html(catalog))

    print(
        f"built {TASK_ID} audience-surface binding artifacts with "
        f"{catalog['summary']['row_count']} rows and "
        f"{catalog['summary']['blocked_count']} blocked rows"
    )


if __name__ == "__main__":
    main()
