#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from build_requirement_registry import (  # noqa: E402
    BLUEPRINT_DIR,
    DATA_DIR,
    DOCS_DIR,
    FLOW_REQUIRED_TOKENS,
    REQUIREMENT_FIELD_ORDER,
    SOURCE_PRECEDENCE_POLICY,
    parse_markdown_sections,
    parse_phase0_named_contracts,
    read_text,
)


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def load_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def row_search_blob(row: dict) -> str:
    parts = [
        row.get("requirement_title", ""),
        row.get("source_heading_or_logical_block", ""),
        row.get("direct_quote_or_precise_paraphrase", ""),
        row.get("expected_behavior", ""),
        " ".join(row.get("primary_objects", [])),
    ]
    return " ".join(parts).lower()


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def validate_registry() -> None:
    registry_jsonl = DATA_DIR / "requirement_registry.jsonl"
    registry_csv = DATA_DIR / "requirement_registry.csv"
    source_manifest = DATA_DIR / "source_manifest.json"
    precedence_policy = DATA_DIR / "source_precedence_policy.json"

    assert_true(registry_jsonl.exists(), "Missing data/analysis/requirement_registry.jsonl")
    assert_true(registry_csv.exists(), "Missing data/analysis/requirement_registry.csv")
    assert_true(source_manifest.exists(), "Missing data/analysis/source_manifest.json")
    assert_true(precedence_policy.exists(), "Missing data/analysis/source_precedence_policy.json")

    manifest_payload = json.loads(source_manifest.read_text(encoding="utf-8"))
    policy_payload = json.loads(precedence_policy.read_text(encoding="utf-8"))
    jsonl_rows = load_jsonl(registry_jsonl)
    csv_rows = load_csv(registry_csv)

    assert_true(
        policy_payload["resolution_order"] == SOURCE_PRECEDENCE_POLICY["resolution_order"],
        "Source precedence policy resolution order drifted from the scripted contract.",
    )
    assert_true(
        len(jsonl_rows) == len(csv_rows),
        "JSONL and CSV registry row counts do not match.",
    )
    assert_true(jsonl_rows, "Requirement registry is empty.")

    blueprint_sources = sorted(
        path.name
        for path in BLUEPRINT_DIR.iterdir()
        if path.suffix in {".md", ".mmd"}
    )
    manifest_sources = sorted(entry["source_file"] for entry in manifest_payload["sources"])
    assert_true(
        blueprint_sources == manifest_sources,
        "Source manifest does not cover every markdown and Mermaid file in blueprint/.",
    )

    ids = set()
    allowed_statuses = {"extracted", "normalized", "gap_resolved", "conflict_flagged"}
    for row in jsonl_rows:
        assert_true(
            row["requirement_id"] not in ids,
            f"Duplicate requirement_id found: {row['requirement_id']}",
        )
        ids.add(row["requirement_id"])
        for field in ["source_file", "source_heading_or_logical_block", "direct_quote_or_precise_paraphrase"]:
            assert_true(
                bool(str(row.get(field, "")).strip()),
                f"{row['requirement_id']} is missing required source traceability field {field}.",
            )
        assert_true(
            row["source_file"] in manifest_sources,
            f"{row['requirement_id']} references unknown source_file {row['source_file']}.",
        )
        assert_true(
            row["status"] in allowed_statuses,
            f"{row['requirement_id']} has invalid status {row['status']}.",
        )

    phase0_contracts = [item["name"] for item in parse_phase0_named_contracts(BLUEPRINT_DIR / "phase-0-the-foundation-protocol.md")]
    search_blobs = [row_search_blob(row) for row in jsonl_rows]
    for contract_name in phase0_contracts:
        assert_true(
            any(contract_name.lower() in blob for blob in search_blobs),
            f"Canonical Phase 0 contract {contract_name} has no registry row.",
        )

    for contract_name in phase0_contracts:
        appears_later = False
        for filename in blueprint_sources:
            if filename == "phase-0-the-foundation-protocol.md":
                continue
            if contract_name in read_text(BLUEPRINT_DIR / filename):
                appears_later = True
                break
        if appears_later:
            assert_true(
                any(contract_name.lower() in blob for blob in search_blobs),
                f"Canonical contract {contract_name} appears in later docs but not in the registry.",
            )

    for filename in blueprint_sources:
        if not re.match(r"phase-\d-", filename):
            continue
        lines, sections = parse_markdown_sections(read_text(BLUEPRINT_DIR / filename))
        test_sections = [
            section
            for section in sections
            if "tests that must pass" in section["heading"].lower()
            or "tests that must all pass" in section["heading"].lower()
        ]
        if not test_sections:
            continue
        has_test_row = any(
            row["source_file"] == filename and row["requirement_type"] == "test"
            for row in jsonl_rows
        )
        assert_true(
            has_test_row,
            f"{filename} contains mandatory test sections but the registry has no test rows for it.",
        )

    forensic_lines, forensic_sections = parse_markdown_sections(read_text(BLUEPRINT_DIR / "forensic-audit-findings.md"))
    finding_numbers = []
    for section in forensic_sections:
        match = re.match(r"Finding (\d+)\s*-\s*(.+)", section["heading"])
        if section["level"] == 2 and match:
            finding_numbers.append(int(match.group(1)))
    for number in finding_numbers:
        req_id = f"GAP-FINDING-{number:03d}"
        assert_true(
            any(row["requirement_id"] == req_id for row in jsonl_rows),
            f"Forensic finding {number:03d} has no derived gap-closure row.",
        )

    for token in FLOW_REQUIRED_TOKENS:
        assert_true(
            any(token.lower() in blob for blob in search_blobs),
            f"Audited flow token {token} is not represented in the registry.",
        )

    for path in [
        DOCS_DIR / "01_blueprint_source_manifest.md",
        DOCS_DIR / "01_requirement_registry_overview.md",
        DOCS_DIR / "01_requirement_taxonomy.md",
        DOCS_DIR / "01_derived_gap_register.md",
    ]:
        assert_true(path.exists(), f"Missing required analysis document: {path.name}")

    header_fields = csv_rows[0].keys()
    assert_true(
        list(header_fields) == REQUIREMENT_FIELD_ORDER,
        "CSV header order drifted from the expected requirement field order.",
    )


def main() -> None:
    validate_registry()
    print("requirement registry validation passed")


if __name__ == "__main__":
    main()
