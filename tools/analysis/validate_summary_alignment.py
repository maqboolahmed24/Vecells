#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from reconcile_summary_layer import (  # noqa: E402
    ALLOWED_CLASSIFICATIONS,
    CONCEPTS,
    CRITICAL_DIMENSIONS,
    DATA_DIR,
    DOCS_DIR,
    PHASE_SEED_ROWS,
    REQUIRED_ALIAS_EXPECTATIONS,
    REQUIRED_CONCEPT_IDS,
    SOURCE_FILES,
    source_column_name,
)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def load_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    matrix_csv = DATA_DIR / "summary_reconciliation_matrix.csv"
    conflicts_json = DATA_DIR / "summary_conflicts.json"
    aliases_json = DATA_DIR / "canonical_term_aliases.json"
    conformance_json = DATA_DIR / "cross_phase_conformance_seed.json"

    for path in [
        matrix_csv,
        conflicts_json,
        aliases_json,
        conformance_json,
        DOCS_DIR / "02_summary_reconciliation_matrix.md",
        DOCS_DIR / "02_summary_reconciliation_decisions.md",
        DOCS_DIR / "02_canonical_term_glossary.md",
        DOCS_DIR / "02_cross_phase_conformance_seed.md",
    ]:
        assert_true(path.exists(), f"Missing required task-002 artifact: {path.name}")

    matrix_rows = load_csv(matrix_csv)
    conflicts_payload = json.loads(conflicts_json.read_text(encoding="utf-8"))
    aliases_payload = json.loads(aliases_json.read_text(encoding="utf-8"))
    conformance_payload = json.loads(conformance_json.read_text(encoding="utf-8"))

    concept_ids = {row["concept_id"] for row in matrix_rows}
    expected_ids = {concept["concept_id"] for concept in CONCEPTS}
    assert_true(
        concept_ids == expected_ids,
        "Matrix concept ids do not match the scripted concept catalog.",
    )
    assert_true(
        REQUIRED_CONCEPT_IDS.issubset(concept_ids),
        "Matrix is missing one or more required reconciliation concepts.",
    )

    for row in matrix_rows:
        assert_true(
            row["classification"] in ALLOWED_CLASSIFICATIONS,
            f"{row['concept_id']} has invalid classification {row['classification']}.",
        )
        assert_true(
            row["canonical_winner_source"],
            f"{row['concept_id']} is missing canonical_winner_source.",
        )
        assert_true(
            row["resolution_summary"],
            f"{row['concept_id']} is missing resolution_summary.",
        )
        for filename in SOURCE_FILES:
            col = source_column_name(filename)
            assert_true(col in row, f"{row['concept_id']} is missing matrix source column {col}.")
        if row["classification"] != "exact_match":
            assert_true(
                row["summary_patch_required"] in {"yes", "no"},
                f"{row['concept_id']} has invalid summary_patch_required value.",
            )
            assert_true(
                row["losing_sources"] or row["summary_patch_required"] == "yes",
                f"{row['concept_id']} is non-exact but has no losing_sources and no patch flag.",
            )

    for row in matrix_rows:
        if row["dimension"] in CRITICAL_DIMENSIONS:
            assert_true(
                row["classification"] != "unresolved_gap",
                f"Critical concept {row['concept_id']} cannot remain an unresolved_gap.",
            )

    non_exact_count = sum(1 for row in matrix_rows if row["classification"] != "exact_match")
    assert_true(
        len(conflicts_payload["rows"]) == non_exact_count,
        "Conflict payload row count does not match the non-exact matrix count.",
    )

    alias_lookup = {
        (row["alias"], row["preferred_term"]): row["alias_status"]
        for row in aliases_payload["rows"]
    }
    for alias, preferred_term in REQUIRED_ALIAS_EXPECTATIONS.items():
        matches = [row for row in aliases_payload["rows"] if row["alias"] == alias]
        assert_true(matches, f"Missing required alias normalization for {alias}.")
        assert_true(
            any(
                preferred_term in row["preferred_term"] or preferred_term in row["rationale"]
                for row in matches
            ),
            f"Alias {alias} does not normalize to the expected preferred term.",
        )

    phase_ids = {row["phase_id"] for row in conformance_payload["rows"]}
    expected_phase_ids = {row["phase_id"] for row in PHASE_SEED_ROWS}
    assert_true(
        phase_ids == expected_phase_ids,
        "Cross-phase conformance seed rows do not match the scripted phase seed set.",
    )
    for row in conformance_payload["rows"]:
        assert_true(
            row["alignment_status"] in {"aligned_seeded", "aligned_with_recorded_decisions", "deferred_scope"},
            f"{row['phase_id']} has invalid alignment_status {row['alignment_status']}.",
        )
        assert_true(
            row["canonical_refs"] and row["summary_refs"],
            f"{row['phase_id']} is missing canonical or summary refs.",
        )
        assert_true(
            row["required_evidence_classes"] and row["required_runtime_publication_tuples"],
            f"{row['phase_id']} is missing evidence classes or runtime/publication tuples.",
        )

    print("summary alignment validation passed")


if __name__ == "__main__":
    main()
