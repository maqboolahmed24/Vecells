#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

IDENTITY_CONTEXT = ROOT / "data/contracts/170_identity_context.schema.json"
EVIDENCE_ENVELOPE = ROOT / "data/contracts/170_identity_evidence_envelope.schema.json"
CAPABILITY_DECISION = ROOT / "data/contracts/170_capability_decision.schema.json"
ROUTE_PROFILES = ROOT / "data/contracts/170_route_capability_profiles.yaml"
AUTHORITY_RULES = ROOT / "data/contracts/170_identity_authority_rules.json"
PATIENT_LINK = ROOT / "data/contracts/170_patient_link_boundary_contract.json"
CAPABILITY_MATRIX = ROOT / "data/analysis/170_capability_matrix.csv"
GAP_LOG = ROOT / "data/analysis/170_trust_gap_log.json"
ARCHITECTURE_DOC = ROOT / "docs/architecture/170_phase2_trust_contract_and_capability_gates.md"
SECURITY_DOC = ROOT / "docs/security/170_identity_authority_and_evidence_vault_rules.md"
API_DOC = ROOT / "docs/api/170_route_capability_profile_registry.md"
ATLAS = ROOT / "docs/frontend/170_phase2_trust_matrix_atlas.html"
PLAYWRIGHT_SPEC = ROOT / "tests/playwright/170_phase2_trust_matrix_atlas.spec.js"
CHECKLIST = ROOT / "prompt/checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
PLAYWRIGHT_PACKAGE = ROOT / "tests/playwright/package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools/analysis/root_script_updates.py"

DECISION_VOCABULARY = {"allow", "step_up_required", "recover_only", "deny"}

REQUIRED_SURFACES = {
    "anonymous_draft_start",
    "anonymous_draft_continue",
    "signed_in_draft_start",
    "authenticated_request_status_view",
    "draft_claim_into_authenticated_account",
    "post_sign_in_attachment_addition",
    "sms_continuation_phone_seeded_draft",
    "future_protected_records",
    "future_booking_surfaces",
    "unknown_protected_route",
}

REQUIRED_SCENARIOS = {
    "anonymous draft start",
    "anonymous draft continue",
    "signed-in draft start",
    "authenticated request status view",
    "draft claim into authenticated account",
    "post-sign-in attachment addition",
    "SMS continuation for phone-seeded drafts",
    "future protected records placeholder",
    "future booking-style surfaces placeholder",
}

FUTURE_SURFACES = {"future_protected_records", "future_booking_surfaces"}

RAW_EVIDENCE_FIELD_NAMES = {
    "rawClaims",
    "rawPayload",
    "phoneNumber",
    "nhsNumber",
    "emailAddress",
    "telephonyIdentifier",
    "oneTimeToken",
    "accessToken",
    "idToken",
    "claimPayload",
    "evidencePayload",
}

REQUIRED_DOC_MARKERS = {
    ARCHITECTURE_DOC: [
        "IdentityBindingAuthority",
        "CapabilityDecision",
        "PatientLink",
        "AccessGrantService",
        "LocalSessionAuthority",
        "allow",
        "step_up_required",
        "recover_only",
        "deny",
    ],
    SECURITY_DOC: [
        "encrypted",
        "append-only",
        "Manual override",
        "Only authority writes binding",
        "masked",
    ],
    API_DOC: [
        "RouteCapabilityProfile",
        "unknownProfileBehavior",
        "future_profile_pending",
        "deny-by-default",
    ],
}

REQUIRED_ATLAS_MARKERS = {
    "Trust_Matrix_Atlas",
    "trust_lattice_mark",
    "filter-rail",
    "decision-filter",
    "route-filter",
    "capability-lattice",
    "capability-lattice-table",
    "route-profile-matrix",
    "route-profile-table",
    "authority-boundary-braid",
    "authority-boundary-table",
    "schema-table",
    "parity-table",
    "inspector",
    "future-profile-banner",
    "--masthead-height: 72px",
    "--left-rail-width: 280px",
    "--right-inspector-width: 408px",
    "1600px",
    "prefers-reduced-motion",
}

REQUIRED_SPEC_MARKERS = {
    "filter synchronization",
    "row/node selection sync",
    "blocked/future profile rendering",
    "keyboard traversal and landmarks",
    "reducedMotion equivalence",
    "diagram/table parity",
    "Trust_Matrix_Atlas",
}


def fail(message: str) -> None:
    raise SystemExit(f"[phase2-trust-contracts] {message}")


def require_file(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    text = require_file(path)
    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def load_csv(path: Path) -> list[dict[str, str]]:
    text = require_file(path)
    try:
        return list(csv.DictReader(text.splitlines()))
    except csv.Error as error:
        fail(f"{path.relative_to(ROOT)} is invalid CSV: {error}")


def parse_yaml_value(value: str) -> Any:
    trimmed = value.strip()
    if trimmed == "true":
        return True
    if trimmed == "false":
        return False
    if (trimmed.startswith("'") and trimmed.endswith("'")) or (
        trimmed.startswith('"') and trimmed.endswith('"')
    ):
        return trimmed[1:-1]
    return trimmed


def load_route_profiles(path: Path) -> dict[str, Any]:
    text = require_file(path)
    result: dict[str, Any] = {"profiles": []}
    current: dict[str, Any] | None = None
    active_array = ""

    for raw_line in text.splitlines():
        if not raw_line.strip() or raw_line.strip().startswith("#"):
            continue
        if not raw_line.startswith(" "):
            key, _, value = raw_line.partition(":")
            if value.strip():
                result[key] = parse_yaml_value(value)
            current = None
            active_array = ""
            continue
        if raw_line.startswith("  - profileId:"):
            current = {"profileId": parse_yaml_value(raw_line.partition(":")[2])}
            result["profiles"].append(current)
            active_array = ""
            continue
        if current is None or not raw_line.startswith("    "):
            continue
        stripped = raw_line.strip()
        if stripped.startswith("- ") and active_array:
            current[active_array].append(parse_yaml_value(stripped[2:]))
            continue
        key, _, value = stripped.partition(":")
        if value.strip():
            current[key] = parse_yaml_value(value)
            active_array = ""
        else:
            current[key] = []
            active_array = key

    return result


def require_markers(label: str, text: str, markers: set[str] | list[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def iter_property_names(schema: Any) -> set[str]:
    names: set[str] = set()
    if isinstance(schema, dict):
        properties = schema.get("properties")
        if isinstance(properties, dict):
            names.update(properties.keys())
        for value in schema.values():
            names.update(iter_property_names(value))
    elif isinstance(schema, list):
        for item in schema:
            names.update(iter_property_names(item))
    return names


def validate_schemas() -> None:
    identity_context = load_json(IDENTITY_CONTEXT)
    evidence = load_json(EVIDENCE_ENVELOPE)
    decision = load_json(CAPABILITY_DECISION)

    if identity_context.get("title") != "IdentityContext":
        fail("identity context schema title drifted")
    if evidence.get("title") != "IdentityEvidenceEnvelope":
        fail("identity evidence envelope schema title drifted")
    if decision.get("title") != "CapabilityDecision":
        fail("capability decision schema title drifted")

    decision_enum = set(decision["properties"]["decision"]["enum"])
    if decision_enum != DECISION_VOCABULARY:
        fail(f"CapabilityDecision vocabulary drifted: {sorted(decision_enum)}")

    evidence_properties = iter_property_names(evidence)
    leaking_fields = sorted(evidence_properties & RAW_EVIDENCE_FIELD_NAMES)
    if leaking_fields:
        fail(f"evidence envelope exposes raw evidence fields: {', '.join(leaking_fields)}")

    for required_field in [
        "identityContextId",
        "identitySource",
        "verificationLevel",
        "evidenceEnvelopeRef",
        "restrictions",
        "capabilityCeiling",
    ]:
        if required_field not in identity_context.get("required", []):
            fail(f"IdentityContext missing required field {required_field}")


def validate_route_profiles(registry: dict[str, Any]) -> list[dict[str, Any]]:
    profiles = registry.get("profiles", [])
    if not profiles:
        fail("route capability profile registry is empty")
    if registry.get("unknownProfileBehavior") != "deny":
        fail("unknownProfileBehavior must be deny")

    profile_ids = [profile.get("profileId", "") for profile in profiles]
    if len(profile_ids) != len(set(profile_ids)):
        fail("route profile ids are not unique")

    surfaces = {profile.get("surfaceRef") for profile in profiles}
    missing = sorted(REQUIRED_SURFACES - surfaces)
    if missing:
        fail(f"route profile registry missing surfaces: {', '.join(missing)}")

    for profile in profiles:
        profile_id = profile.get("profileId", "")
        decision = profile.get("defaultDecision")
        if decision not in DECISION_VOCABULARY:
            fail(f"{profile_id} uses invalid decision {decision}")
        if profile.get("evidenceBoundary") != "vault_reference_only":
            fail(f"{profile_id} does not declare vault_reference_only evidence boundary")
        if profile.get("surfaceRef") in FUTURE_SURFACES:
            if profile.get("futureProfilePending") is not True:
                fail(f"{profile_id} future placeholder is not marked pending")
            if profile.get("defaultDecision") != "deny":
                fail(f"{profile_id} future placeholder must deny by default")
            if profile.get("grantCeiling") != "future_denied":
                fail(f"{profile_id} future placeholder must use future_denied ceiling")
        if profile.get("surfaceRef") == "unknown_protected_route":
            if profile.get("defaultDecision") != "deny":
                fail("unknown protected route fallback must deny")
            if profile.get("writableAuthorityState") != "blocked":
                fail("unknown protected route fallback must be blocked")

    return profiles


def validate_authority_rules(authority: dict[str, Any]) -> None:
    if authority.get("identityBindingAuthority") != "IdentityBindingAuthority":
        fail("identity binding authority owner drifted")
    if set(authority.get("decisionVocabulary", [])) != DECISION_VOCABULARY:
        fail("authority rules decision vocabulary drifted")

    components = authority.get("components", [])
    if not components:
        fail("authority components are empty")
    component_ids = {component.get("componentId") for component in components}
    for required in [
        "IdentityBindingAuthority",
        "CapabilityDecisionEngine",
        "PatientLink",
        "AccessGrantService",
        "LocalSessionAuthority",
        "SupportOverrideConsole",
        "IdentityEvidenceVault",
    ]:
        if required not in component_ids:
            fail(f"authority rules missing component {required}")

    for component in components:
        component_id = component.get("componentId")
        is_authority = component_id == "IdentityBindingAuthority"
        for field in [
            "canAppendIdentityBinding",
            "canSupersedeIdentityBinding",
            "canFreezeIdentityBinding",
        ]:
            if is_authority:
                if component.get(field) is not True:
                    fail(f"IdentityBindingAuthority must set {field}=true")
            elif component.get(field) is not False:
                fail(f"{component_id} illegally sets {field}=true")
        prohibited = " ".join(component.get("prohibitedActions", []))
        if not is_authority and "mutate" not in prohibited and "identity_binding" not in prohibited:
            fail(f"{component_id} must explicitly prohibit identity binding mutation")


def validate_patient_link(contract: dict[str, Any]) -> None:
    if contract.get("componentId") != "PatientLink":
        fail("patient link boundary component id drifted")
    postures = {item.get("posture") for item in contract.get("patientLinkPostures", [])}
    required = {"unlinked", "candidate", "linked", "conflict", "repair_hold", "restricted"}
    missing = sorted(required - postures)
    if missing:
        fail(f"patient link boundary missing postures: {', '.join(missing)}")
    assertions = " ".join(item.get("statement", "") for item in contract.get("boundaryAssertions", []))
    if "may not append" not in assertions or "PDS" not in assertions:
        fail("patient link boundary must freeze no-mutation and PDS-deferred assertions")


def validate_matrix(rows: list[dict[str, str]], profiles: list[dict[str, Any]]) -> None:
    if not rows:
        fail("capability matrix is empty")
    profile_ids = {profile["profileId"] for profile in profiles}
    scenarios = {row.get("scenario") for row in rows}
    missing_scenarios = sorted(REQUIRED_SCENARIOS - scenarios)
    if missing_scenarios:
        fail(f"capability matrix missing scenarios: {', '.join(missing_scenarios)}")

    for row in rows:
        capability_id = row.get("capability_id", "")
        if row.get("route_profile_ref") not in profile_ids:
            fail(f"{capability_id} references missing route profile {row.get('route_profile_ref')}")
        if row.get("decision") not in DECISION_VOCABULARY:
            fail(f"{capability_id} uses invalid decision {row.get('decision')}")
        if row.get("surface_ref") in FUTURE_SURFACES:
            if row.get("future_profile_pending") != "true":
                fail(f"{capability_id} future matrix row must mark future_profile_pending true")
            if row.get("decision") != "deny":
                fail(f"{capability_id} future matrix row must deny")
        if row.get("identity_binding_authority_mutation") not in {"none", "authority_signal_only"}:
            fail(f"{capability_id} has invalid identity binding mutation posture")


def validate_gap_log(gap_log: dict[str, Any]) -> None:
    if gap_log.get("unresolvedGaps") != []:
        fail("trust gap log must have no unresolved gaps for the freeze")
    closure_ids = {item.get("gapId") for item in gap_log.get("resolvedGaps", [])}
    required = {
        "GAP_RESOLVED_PHASE2_TRUST_ROUTE_CAPABILITY_REGISTRY_V1",
        "GAP_RESOLVED_PHASE2_TRUST_EVIDENCE_VAULT_BOUNDARY_V1",
        "GAP_RESOLVED_PHASE2_TRUST_FUTURE_SURFACE_PLACEHOLDERS_V1",
        "GAP_RESOLVED_PHASE2_TRUST_IDENTITY_REPAIR_AUTHORITY_V1",
        "GAP_RESOLVED_PHASE2_TRUST_UNKNOWN_ROUTE_DENY_V1",
    }
    missing = sorted(required - closure_ids)
    if missing:
        fail(f"gap log missing closures: {', '.join(missing)}")


def validate_documents_and_atlas() -> None:
    for path, markers in REQUIRED_DOC_MARKERS.items():
        require_markers(str(path.relative_to(ROOT)), require_file(path), markers)

    atlas = require_file(ATLAS)
    require_markers(str(ATLAS.relative_to(ROOT)), atlas, REQUIRED_ATLAS_MARKERS)
    for visual, table in [
        ("capability-lattice", "capability-lattice-table"),
        ("route-profile-matrix", "route-profile-table"),
        ("authority-boundary-braid", "authority-boundary-table"),
        ("trust_lattice_mark", "schema-table"),
    ]:
        if not re.search(rf"<td>{re.escape(visual)}</td>\s*<td>{re.escape(table)}</td>", atlas):
            fail(f"atlas parity table does not map {visual} to {table}")

    spec = require_file(PLAYWRIGHT_SPEC)
    require_markers(str(PLAYWRIGHT_SPEC.relative_to(ROOT)), spec, REQUIRED_SPEC_MARKERS)


def validate_package_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    scripts = package.get("scripts", {})
    if scripts.get("validate:phase2-trust-contracts") != (
        "python3 ./tools/analysis/validate_phase2_trust_contracts.py"
    ):
        fail("root package missing validate:phase2-trust-contracts script")
    for script_name in ["bootstrap", "check"]:
        if "pnpm validate:phase2-trust-contracts" not in scripts.get(script_name, ""):
            fail(f"root package {script_name} missing phase2 trust validation")

    playwright_package = load_json(PLAYWRIGHT_PACKAGE)
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        script = playwright_package.get("scripts", {}).get(script_name, "")
        if "170_phase2_trust_matrix_atlas.spec.js" not in script:
            fail(f"tests/playwright {script_name} missing seq_170 spec")

    root_updates = require_file(ROOT_SCRIPT_UPDATES)
    if "validate:phase2-trust-contracts" not in root_updates:
        fail("root_script_updates.py missing phase2 trust script")


def validate_checklist() -> None:
    checklist = require_file(CHECKLIST)
    if not re.search(r"- \[(?:-|X)\] seq_170_", checklist):
        fail("seq_170 is not claimed or complete in prompt/checklist.md")
    if not re.search(r"- \[[Xx]\] seq_169_", checklist):
        fail("seq_169 must be complete before seq_170")


def main() -> int:
    validate_schemas()
    registry = load_route_profiles(ROUTE_PROFILES)
    profiles = validate_route_profiles(registry)
    authority = load_json(AUTHORITY_RULES)
    validate_authority_rules(authority)
    validate_patient_link(load_json(PATIENT_LINK))
    validate_matrix(load_csv(CAPABILITY_MATRIX), profiles)
    validate_gap_log(load_json(GAP_LOG))
    validate_documents_and_atlas()
    validate_package_wiring()
    validate_checklist()
    print("phase2 trust contracts validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
