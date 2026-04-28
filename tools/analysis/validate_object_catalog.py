#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

from build_object_catalog import (
    ALIAS_MAP_PATH,
    ATLAS_HTML_PATH,
    FLOW_GAP_NAMES,
    GLOSSARY_CSV_PATH,
    MANDATORY_OBJECT_NAMES,
    MERMAID_PATH,
    OBJECT_ALIAS_MAP_JSON_PATH,
    OBJECT_CATALOG_JSON_PATH,
    OBJECT_KIND_TAXONOMY_JSON_PATH,
    PARSE_SOURCE_FILES,
    RELATIONSHIP_DOC_PATH,
    RELATIONSHIPS_CSV_PATH,
    TRACEABILITY_JSONL_PATH,
    build_flow_required_names,
    build_mentions,
    ensure_prerequisites,
    load_csv,
    load_json,
    load_jsonl,
    object_id_for,
    parse_object_blocks,
)


DELIVERABLES = [
    GLOSSARY_CSV_PATH,
    OBJECT_CATALOG_JSON_PATH,
    RELATIONSHIPS_CSV_PATH,
    OBJECT_ALIAS_MAP_JSON_PATH,
    OBJECT_KIND_TAXONOMY_JSON_PATH,
    TRACEABILITY_JSONL_PATH,
    RELATIONSHIP_DOC_PATH,
    MERMAID_PATH,
    ATLAS_HTML_PATH,
]

EXPECTED_ALIAS_CLASSES = {
    "exact_alias_to_canonical_object",
    "deprecated_shorthand",
    "ambiguous_phrase_requiring_context",
    "not_an_object_phrase",
}

MANDATORY_KIND_EXPECTATIONS = {
    "BookingConfirmationTruthProjection": "projection",
    "HubOfferToConfirmationTruthProjection": "projection",
    "PharmacyOutcomeTruthProjection": "projection",
    "AccessGrant": "grant",
    "RequestLifecycleLease": "lease",
    "VisibilityProjectionPolicy": "policy",
    "AudienceSurfaceRouteContract": "contract",
    "DesignContractPublicationBundle": "bundle",
    "RuntimePublicationBundle": "bundle",
    "CanonicalEventNamespace": "namespace",
    "CanonicalEventContract": "event_contract",
}

CHILD_DOMAIN_GUARD_NAMES = {
    "MoreInfoCycle",
    "BookingCase",
    "HubCoordinationCase",
    "PharmacyCase",
    "CallbackCase",
    "ClinicianMessageThread",
    "AdminResolutionCase",
}

ATLAS_MARKERS = [
    'data-testid="atlas-shell"',
    'data-testid="atlas-nav"',
    'data-testid="filter-search"',
    'data-testid="filter-kind"',
    'data-testid="filter-phase"',
    'data-testid="filter-owner"',
    'data-testid="filter-context-chips"',
    'data-testid="hero-summary"',
    'data-testid="object-table"',
    'data-testid="detail-panel"',
    'data-testid="relationship-graph"',
    'data-testid="relationship-parity-list"',
    'data-testid="spotlight-strip"',
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_catalog() -> dict:
    for path in DELIVERABLES:
        assert_true(path.exists(), f"Missing seq_006 deliverable: {path}")
    return load_json(OBJECT_CATALOG_JSON_PATH)


def load_relationships() -> list[dict[str, str]]:
    return load_csv(RELATIONSHIPS_CSV_PATH)


def load_glossary() -> list[dict[str, str]]:
    return load_csv(GLOSSARY_CSV_PATH)


def load_traceability() -> list[dict]:
    return load_jsonl(TRACEABILITY_JSONL_PATH)


def validate_prerequisites() -> None:
    upstream = ensure_prerequisites()
    assert_true(upstream["requirement_registry_rows"] > 0, "Requirement registry prerequisite count is zero.")
    assert_true(upstream["canonical_term_alias_rows"] > 0, "Canonical alias prerequisite count is zero.")
    assert_true(upstream["route_family_rows"] > 0, "Route family prerequisite count is zero.")
    assert_true(upstream["request_lineage_child_aggregates"] > 0, "Request-lineage prerequisite count is zero.")


def validate_catalog_structure(catalog: dict, glossary_rows: list[dict[str, str]], relationship_rows: list[dict[str, str]], traceability_rows: list[dict]) -> None:
    assert_true(catalog["catalog_id"] == "vecells_object_catalog_v1", "Unexpected catalog_id.")
    assert_true(catalog["summary"]["object_count"] == len(catalog["objects"]), "Object count summary mismatch.")
    assert_true(catalog["summary"]["relationship_count"] == len(relationship_rows), "Relationship count summary mismatch.")
    assert_true(catalog["summary"]["glossary_row_count"] == len(glossary_rows), "Glossary count summary mismatch.")
    assert_true(len(traceability_rows) == len(catalog["objects"]), "Traceability rows must equal object rows.")
    object_ids = {row["object_id"] for row in catalog["objects"]}
    assert_true(len(object_ids) == len(catalog["objects"]), "Object IDs are not unique.")
    assert_true(
        sum(1 for row in glossary_rows if row["entry_type"] == "object") == len(catalog["objects"]),
        "Every catalog object must have a glossary row.",
    )


def validate_phase0_coverage(catalog_by_name: dict[str, dict]) -> None:
    phase0_names = {block.canonical_name for block in parse_object_blocks("phase-0-the-foundation-protocol.md")}
    missing = sorted(name for name in phase0_names if name not in catalog_by_name)
    assert_true(not missing, f"Missing Phase 0 object rows: {', '.join(missing[:12])}")


def validate_mandatory_object_families(catalog_by_name: dict[str, dict]) -> None:
    missing = sorted(name for name in MANDATORY_OBJECT_NAMES if name not in catalog_by_name)
    assert_true(not missing, f"Missing mandatory object families: {', '.join(missing[:12])}")
    for name, kind in MANDATORY_KIND_EXPECTATIONS.items():
        assert_true(
            catalog_by_name[name]["object_kind"] == kind,
            f"{name} should be classified as {kind}, found {catalog_by_name[name]['object_kind']}.",
        )


def validate_orthogonality(catalog_by_name: dict[str, dict]) -> None:
    trio = {catalog_by_name[name]["object_id"] for name in ["Request", "RequestLineage", "LineageCaseLink"]}
    assert_true(len(trio) == 3, "Request, RequestLineage, and LineageCaseLink collapsed into one object.")
    identity_set = {catalog_by_name[name]["object_id"] for name in ["Session", "AccessGrant", "IdentityBinding", "CapabilityDecision"]}
    assert_true(len(identity_set) == 4, "Session, AccessGrant, IdentityBinding, and CapabilityDecision collapsed into one object.")


def validate_alias_map(catalog_by_name: dict[str, dict]) -> None:
    source_alias_rows = load_json(ALIAS_MAP_PATH)["rows"]
    alias_map = load_json(OBJECT_ALIAS_MAP_JSON_PATH)
    resolved_rows = alias_map["rows"]
    assert_true(len(source_alias_rows) == len(resolved_rows), "Alias row count drifted from task 002 output.")
    alias_lookup = {row["alias"]: row for row in resolved_rows}
    missing_aliases = sorted(row["alias"] for row in source_alias_rows if row["alias"] not in alias_lookup)
    assert_true(not missing_aliases, f"Missing alias resolutions: {', '.join(missing_aliases[:8])}")
    for row in resolved_rows:
        assert_true(row["resolution_class"] in EXPECTED_ALIAS_CLASSES, f"Unexpected alias class: {row['resolution_class']}")
        if row["canonical_object_id"]:
            assert_true(
                row["canonical_object_name"] in catalog_by_name,
                f"Alias row points at missing object: {row['canonical_object_name']}",
            )
            assert_true(
                row["canonical_object_id"] == catalog_by_name[row["canonical_object_name"]]["object_id"],
                f"Alias row object ID drifted for {row['alias']}",
            )


def validate_flow_coverage(catalog_by_name: dict[str, dict]) -> None:
    flow_required_names = build_flow_required_names(build_mentions(), set(catalog_by_name))
    missing = sorted(name for name in flow_required_names if name not in catalog_by_name)
    assert_true(not missing, f"Flow-visible objects missing from the catalog: {', '.join(missing[:12])}")
    for gap_name in FLOW_GAP_NAMES:
        assert_true(gap_name in catalog_by_name, f"Flow-derived object missing from catalog: {gap_name}")


def validate_child_domain_guards(catalog_by_name: dict[str, dict]) -> None:
    for name in CHILD_DOMAIN_GUARD_NAMES:
        row = catalog_by_name[name]
        combined = " ".join([row["authoritative_success_or_truth_role"], row["notes"]]).lower()
        assert_true(
            "may never write canonical request.workflowstate directly" in combined,
            f"CONFLICT_OBJECT_OWNERSHIP_{name.upper()}: child-domain write guard is missing.",
        )


def validate_relationships(catalog_by_name: dict[str, dict], relationship_rows: list[dict[str, str]]) -> None:
    assert_true(relationship_rows, "Relationship CSV is empty.")
    relationship_tuples = {
        (row["source_name"], row["relationship_type"], row["target_name"])
        for row in relationship_rows
    }
    for required in [
        ("MoreInfoReplyWindowCheckpoint", "guards", "MoreInfoCycle"),
        ("BookingCase", "guards", "ExternalConfirmationGate"),
        ("HubCoordinationCase", "references", "HubOfferToConfirmationTruthProjection"),
        ("PharmacyOutcomeReconciliationGate", "blocks", "PharmacyCase"),
    ]:
        assert_true(required in relationship_tuples, f"Missing key relationship: {required}")
    for row in relationship_rows:
        assert_true(row["source_name"] in catalog_by_name, f"Relationship source missing from catalog: {row['source_name']}")
        assert_true(row["target_name"] in catalog_by_name, f"Relationship target missing from catalog: {row['target_name']}")


def validate_taxonomy(catalog: dict) -> None:
    taxonomy = load_json(OBJECT_KIND_TAXONOMY_JSON_PATH)
    modeled_count = sum(entry["count"] for entry in taxonomy["object_kind_model"])
    assert_true(modeled_count == len(catalog["objects"]), "Taxonomy kind counts do not sum to object count.")
    kinds = {entry["object_kind"] for entry in taxonomy["object_kind_model"]}
    for row in catalog["objects"]:
        assert_true(row["object_kind"] in kinds, f"Object kind missing from taxonomy: {row['object_kind']}")


def validate_traceability(catalog: dict, traceability_rows: list[dict]) -> None:
    traceability_lookup = {row["object_id"]: row for row in traceability_rows}
    for row in catalog["objects"]:
        traceability = traceability_lookup.get(row["object_id"])
        assert_true(traceability is not None, f"Missing traceability row for {row['object_id']}")
        assert_true(traceability["canonical_source_ref"], f"Traceability missing canonical source ref for {row['object_id']}")
        assert_true(
            traceability["canonical_source_heading_or_block"] == row["canonical_source_heading_or_block"],
            f"Traceability heading drifted for {row['object_id']}",
        )


def validate_atlas(catalog: dict) -> None:
    html_text = ATLAS_HTML_PATH.read_text()
    for marker in ATLAS_MARKERS:
        assert_true(marker in html_text, f"Atlas is missing required marker: {marker}")
    assert_true("http://" not in html_text and "https://" not in html_text, "Atlas must not pull remote assets.")
    assert_true("const atlas" in html_text or 'id="atlas-data"' in html_text, "Atlas data bootstrap is missing.")
    data_match = re.search(r'<script id="atlas-data" type="application/json">(.*?)</script>', html_text, re.S)
    assert_true(data_match is not None, "Atlas embedded data block is missing.")
    embedded = json.loads(data_match.group(1))
    assert_true(
        len(embedded["catalog"]["objects"]) == len(catalog["objects"]),
        "Atlas embedded object count drifted from the catalog.",
    )
    object_ids = {row["object_id"] for row in catalog["objects"]}
    embedded_ids = {row["object_id"] for row in embedded["catalog"]["objects"]}
    assert_true(object_ids == embedded_ids, "Atlas embedded object IDs drifted from the catalog.")


def main() -> None:
    validate_prerequisites()
    catalog = load_catalog()
    glossary_rows = load_glossary()
    relationship_rows = load_relationships()
    traceability_rows = load_traceability()
    catalog_by_name = {row["canonical_name"]: row for row in catalog["objects"]}

    validate_catalog_structure(catalog, glossary_rows, relationship_rows, traceability_rows)
    validate_phase0_coverage(catalog_by_name)
    validate_mandatory_object_families(catalog_by_name)
    validate_orthogonality(catalog_by_name)
    validate_alias_map(catalog_by_name)
    validate_flow_coverage(catalog_by_name)
    validate_child_domain_guards(catalog_by_name)
    validate_relationships(catalog_by_name, relationship_rows)
    validate_taxonomy(catalog)
    validate_traceability(catalog, traceability_rows)
    validate_atlas(catalog)

    print(
        json.dumps(
            {
                "catalog_id": catalog["catalog_id"],
                "object_count": len(catalog["objects"]),
                "gap_object_count": catalog["summary"]["gap_object_count"],
                "relationship_count": len(relationship_rows),
                "alias_resolution_count": len(load_json(OBJECT_ALIAS_MAP_JSON_PATH)["rows"]),
                "status": "ok",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
