#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "identity_binding_manifest.json"
SCOPE_MATRIX_PATH = DATA_DIR / "access_grant_scope_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "grant_supersession_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "68_identity_binding_and_access_grant_design.md"
RULES_DOC_PATH = DOCS_DIR / "68_identity_access_append_only_rules.md"
ATLAS_PATH = DOCS_DIR / "68_identity_access_atlas.html"
SPEC_PATH = TESTS_DIR / "identity-access-atlas.spec.js"


def fail(message: str) -> None:
    raise SystemExit(message)


def load_json(path: Path) -> object:
    if not path.exists():
        fail(f"Missing required JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"Missing required CSV artifact: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    manifest = load_json(MANIFEST_PATH)
    casebook = load_json(CASEBOOK_PATH)
    matrix_rows = load_csv(SCOPE_MATRIX_PATH)

    for required_path in [DESIGN_DOC_PATH, RULES_DOC_PATH, ATLAS_PATH, SPEC_PATH]:
      if not required_path.exists():
        fail(f"Missing required artifact: {required_path}")

    summary = manifest["summary"]
    if summary["identity_binding_count"] != len(manifest["bindings"]):
        fail("identity_binding_count drifted from bindings array.")
    if summary["access_grant_count"] != len(manifest["grants"]):
        fail("access_grant_count drifted from grants array.")
    if summary["scope_envelope_count"] != len(manifest["scope_envelopes"]):
        fail("scope_envelope_count drifted from scope_envelopes array.")
    if summary["redemption_count"] != len(manifest["redemptions"]):
        fail("redemption_count drifted from redemptions array.")
    if summary["supersession_count"] != len(manifest["supersessions"]):
        fail("supersession_count drifted from supersessions array.")

    bindings_by_id = {binding["bindingId"]: binding for binding in manifest["bindings"]}
    envelopes_by_id = {
        envelope["scopeEnvelopeId"]: envelope for envelope in manifest["scope_envelopes"]
    }
    grants_by_id = {grant["grantId"]: grant for grant in manifest["grants"]}

    for binding in manifest["bindings"]:
        if binding["bindingVersion"] == 1 and binding["supersedesBindingRef"] is not None:
            fail(f'Root binding {binding["bindingId"]} may not supersede another binding.')
        if (
            binding["patientRef"] is not None
            and binding["bindingState"] in {"candidate", "provisional_verified", "ambiguous"}
        ):
            fail(
                f'Binding {binding["bindingId"]} cannot carry patientRef while still in non-settled state.'
            )

    for grant in manifest["grants"]:
        envelope = envelopes_by_id.get(grant["scopeEnvelopeRef"])
        if envelope is None:
            fail(f'Grant {grant["grantId"]} references missing scope envelope.')
        if grant["grantFamily"] != envelope["grantFamily"]:
            fail(f'Grant {grant["grantId"]} drifted from its envelope grant family.')
        if grant["actionScope"] != envelope["actionScope"]:
            fail(f'Grant {grant["grantId"]} drifted from its envelope action scope.')
        if grant["routeFamilyRef"] != envelope["routeFamilyRef"]:
            fail(f'Grant {grant["grantId"]} drifted from its envelope route family.')
        if (
            envelope["requiredIdentityBindingRef"]
            and envelope["requiredIdentityBindingRef"] not in bindings_by_id
        ):
            fail(
                f'Envelope {envelope["scopeEnvelopeId"]} references missing binding {envelope["requiredIdentityBindingRef"]}.'
            )
        if grant["grantState"] in {"rotated", "superseded"} and not grant["latestSupersessionRef"]:
            fail(f'Grant {grant["grantId"]} must reference latestSupersessionRef when no longer live.')

    one_time_like = {
        grant["grantId"]: grant
        for grant in manifest["grants"]
        if grant["replayPolicy"] in {"one_time", "rotating"}
    }
    redemption_counts: dict[str, int] = {grant_id: 0 for grant_id in one_time_like}
    for redemption in casebook["redemptions"]:
        grant_ref = redemption["grantRef"]
        if grant_ref in redemption_counts:
            redemption_counts[grant_ref] += 1
    for grant_id, count in redemption_counts.items():
        if count > 1:
            fail(f"Grant {grant_id} has more than one redemption row despite exact-once replay policy.")

    if casebook["summary"]["supersession_count"] != len(casebook["supersessions"]):
        fail("Casebook supersession_count drifted.")
    if casebook["summary"]["redemption_count"] != len(casebook["redemptions"]):
        fail("Casebook redemption_count drifted.")

    if len(matrix_rows) != len(manifest["scope_envelopes"]):
        fail("Scope matrix row count must equal scope envelope count.")

    atlas_html = ATLAS_PATH.read_text(encoding="utf-8")
    for marker in [
        "data-testid=\"binding-chain\"",
        "data-testid=\"grant-lattice\"",
        "data-testid=\"inspector\"",
        "data-testid=\"redemption-log\"",
        "data-testid=\"scope-rule-table\"",
    ]:
        if marker not in atlas_html:
            fail(f"Atlas is missing required marker {marker}.")

    spec_source = SPEC_PATH.read_text(encoding="utf-8")
    for probe in ["binding-state filtering", "selection synchronization", "reduced motion"]:
        if probe not in spec_source:
            fail(f"Spec is missing expected coverage text: {probe}")

    print("identity-access models validated")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        fail(str(error))
