#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


CHECKLIST = ROOT / "prompt" / "checklist.md"
SOURCE = ROOT / "services" / "command-api" / "src" / "pds-enrichment.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "pds-enrichment.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "098_phase2_pds_enrichment.sql"
ARCH_DOC = ROOT / "docs" / "architecture" / "183_optional_pds_adapter_and_enrichment_flow.md"
SECURITY_DOC = (
    ROOT / "docs" / "security" / "183_pds_access_onboarding_and_demographic_separation_controls.md"
)
DECISION_MATRIX = ROOT / "data" / "analysis" / "183_pds_enrichment_decision_matrix.csv"
FALLBACK_CASES = ROOT / "data" / "analysis" / "183_pds_disabled_fallback_and_refresh_cases.json"
ROOT_PACKAGE = ROOT / "package.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_PDS_PROVIDER_PORT_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PDS_FEATURE_FLAG_GATING_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PDS_ONBOARDING_LEGAL_BASIS_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PDS_DATA_CLASS_SEPARATION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PDS_NO_DIRECT_BINDING_AUTHORITY_BYPASS_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PDS_STALE_CACHE_FALLBACK_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PDS_CHANGE_NOTIFICATION_SEAM_V1",
}

SOURCE_MARKERS = {
    "PdsAdapter",
    "PdsEnrichmentOrchestrator",
    "createPdsFhirAdapter",
    "createDisabledPdsAdapter",
    "createPdsEnrichmentApplication",
    "createPatientLinkerPdsEnrichmentProvider",
    "PdsGatingDecisionRecord",
    "PdsEnrichmentRequestRecord",
    "PdsNormalizedDemographicSnapshot",
    "PdsEnrichmentOutcomeRecord",
    "PdsChangeSignalRecord",
    "enabledByDefault: false",
    "PDS_183_DISABLED_BY_DEFAULT",
    "PDS_183_ONBOARDING_INCOMPLETE",
    "PDS_183_LEGAL_BASIS_MISSING",
    "PDS_183_DATA_CLASSES_SEPARATED",
    "PDS_183_NO_DIRECT_BINDING_MUTATION",
    "PDS_183_STALE_CACHE_NOT_FRESH_EVIDENCE",
    "PDS_183_CHANGE_SIGNAL_QUEUED_NOT_MUTATED",
    "authoritativeLocalBindingStateRef: null",
    "communicationPreferenceRef: null",
}

MIGRATION_MARKERS = {
    "phase2_pds_gating_decisions",
    "phase2_pds_enrichment_requests",
    "phase2_pds_normalized_snapshots",
    "phase2_pds_enrichment_outcomes",
    "phase2_pds_change_signals",
    "phase2_pds_adapter_events",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "legal_basis_evidence_ref TEXT",
    "query_digest TEXT NOT NULL",
    "data_class_separation_json TEXT NOT NULL",
    "binding_mutation_prohibited INTEGER NOT NULL CHECK (binding_mutation_prohibited = 1)",
    "mutation_prohibited INTEGER NOT NULL CHECK (mutation_prohibited = 1)",
    "created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'PdsEnrichmentOrchestrator')",
}

SERVICE_MARKERS = {
    "pds_enrichment_evaluate",
    "/identity/pds/enrichment/evaluate",
    "PdsEnrichmentDecisionContract",
    "pds_enrichment_snapshot",
    "/identity/pds/enrichment/snapshots",
    "PdsNormalizedDemographicSnapshotContract",
    "pds_change_signal",
    "/identity/pds/change-signals",
    "PdsChangeSignalContract",
}

DOC_MARKERS = {
    "PdsEnrichmentOrchestrator",
    "PdsAdapter",
    "PatientLinker",
    "IdentityBindingAuthority",
    "PdsNormalizedDemographicSnapshot",
    "PdsChangeSignalRecord",
    "disabled-by-default",
    "legal-basis",
    "NHS login subject claims",
    "communication preferences",
    "OWASP",
    "PDS FHIR API catalogue",
    "National Events Management Service",
}

REQUIRED_OUTCOMES = {
    "disabled",
    "policy_denied",
    "legal_basis_missing",
    "provider_unavailable",
    "parse_error",
    "cache_fresh",
    "stale_cache_used",
    "enriched",
    "queued_refresh",
    "ignored_disabled",
}


def fail(message: str) -> None:
    raise SystemExit(f"[pds-enrichment-flow] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def load_csv(path: Path) -> list[dict[str, str]]:
    try:
        return list(csv.DictReader(read(path).splitlines()))
    except csv.Error as error:
        fail(f"{path.relative_to(ROOT)} is invalid CSV: {error}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def validate_checklist() -> None:
    for task_id in [
        "seq_170",
        "seq_171",
        "seq_172",
        "seq_173",
        "seq_174",
        "par_175",
        "par_176",
        "par_177",
        "par_178",
        "par_179",
        "par_180",
        "par_181",
        "par_182",
    ]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_183")
    if checklist_state("par_183") not in {"-", "X"}:
        fail("par_183 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("PDS enrichment source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    forbidden = {
        "Request.patientRef",
        "Episode.patientRef",
        ".patientRef =",
        ".ownershipState =",
        "directBindingMutation",
        "communicationPreferenceOverwrite",
        "console.log(",
        "PARALLEL_INTERFACE_GAP_PHASE2_PDS.json",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"source contains forbidden PDS authority shortcuts: {', '.join(present)}")
    if source.count("PdsAdapter") < 7:
        fail("source must define and consume a provider-agnostic PdsAdapter port")
    if source.count("PdsGatingDecisionRecord") < 4:
        fail("source must persist explicit PDS gating decisions")
    if source.count("PdsNormalizedDemographicSnapshot") < 5:
        fail("source must persist normalized provenance-aware snapshots")
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, SECURITY_DOC])
    require_markers("docs", combined, DOC_MARKERS | REQUIRED_GAPS)


def validate_decision_matrix() -> None:
    rows = load_csv(DECISION_MATRIX)
    if not rows:
        fail("PDS enrichment decision matrix is empty")
    outcomes = {row.get("outcome_state") for row in rows}
    missing_outcomes = sorted(REQUIRED_OUTCOMES - outcomes)
    if missing_outcomes:
        fail(f"decision matrix missing outcomes: {', '.join(missing_outcomes)}")
    gaps = {row.get("gap_closure") for row in rows}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"decision matrix missing gap closures: {', '.join(missing_gaps)}")
    if not any(row.get("local_flow_continuation") == "local_matching_only" for row in rows):
        fail("decision matrix must prove local matching fallback")


def validate_fallback_cases() -> None:
    data = load_json(FALLBACK_CASES)
    cases = data.get("cases")
    if not isinstance(cases, list):
        fail("fallback cases must contain a cases array")
    case_ids = {case.get("caseId") for case in cases if isinstance(case, dict)}
    required_case_ids = {
        "PDS183_DISABLED_MODE_LOCAL_MATCHING",
        "PDS183_MISSING_ONBOARDING",
        "PDS183_SUCCESS_NORMALIZATION",
        "PDS183_TIMEOUT_FAILS_LOCAL_ONLY",
        "PDS183_STALE_CACHE_MARKED_STALE",
        "PDS183_DATA_CLASS_SEPARATION",
        "PDS183_NO_DIRECT_EXTERNAL_AUTHORITY",
        "PDS183_CHANGE_NOTIFICATION_QUEUED",
    }
    missing_cases = sorted(required_case_ids - case_ids)
    if missing_cases:
        fail(f"fallback cases missing: {', '.join(missing_cases)}")
    gaps = {case.get("gapClosure") for case in cases if isinstance(case, dict)}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"fallback cases missing gap closures: {', '.join(missing_gaps)}")
    joined = json.dumps(data)
    for marker in [
        "authoritativeLocalBindingStateRef",
        "localMatchEvidenceRefs",
        "nhsLoginSubjectClaimRefs",
        "pdsDemographicEvidenceRef",
        "communicationPreferenceRef",
    ]:
        if marker not in joined:
            fail(f"fallback cases missing data-class marker: {marker}")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "tests",
        test,
        {
            "PdsEnrichmentOrchestrator",
            "disabled mode",
            "missing onboarding prerequisites",
            "normalizes successful PDS FHIR responses",
            "timeout and provider failure",
            "stale cache",
            "provenance",
            "data-class separation",
            "direct binding mutation",
            "notification change signals",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    if (
        scripts.get("validate:pds-enrichment-flow")
        != "python3 ./tools/analysis/validate_pds_enrichment_flow.py"
    ):
        fail("package.json missing validate:pds-enrichment-flow script")
    expected = (
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:audit-worm"
    )
    expected_with_request_ownership = (
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:audit-worm"
    )
    expected_with_request_ownership_and_portal = (
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:audit-worm"
    )
    expected_with_request_ownership_portal_and_identity_audit = (
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:audit-worm"
    )
    expected_with_request_ownership_portal_identity_audit_and_telephony_edge = (
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:telephony-edge-ingestion && "
        "pnpm validate:call-session-state-machine && "
        "pnpm validate:telephony-verification-pipeline && "
        "pnpm validate:recording-ingest-pipeline && "
        "pnpm validate:telephony-readiness-pipeline && "
        "pnpm validate:telephony-continuation-grants && "
        "pnpm validate:telephony-convergence && "
        "pnpm validate:phone-followup-resafety && "
        "pnpm validate:195-auth-frontend && "
        "pnpm validate:audit-worm"
    )
    for name in ("bootstrap", "check"):
        if (
            expected not in scripts.get(name, "")
            and expected_with_request_ownership not in scripts.get(name, "")
            and expected_with_request_ownership_and_portal not in scripts.get(name, "")
            and expected_with_request_ownership_portal_and_identity_audit
            not in scripts.get(name, "")
            and expected_with_request_ownership_portal_identity_audit_and_telephony_edge
            not in scripts.get(name, "")
        ):
            fail(f"package.json {name} chain missing PDS enrichment validator")
        if (
            expected not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_request_ownership not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_request_ownership_and_portal not in ROOT_SCRIPT_UPDATES.get(
                name,
                "",
            )
            and expected_with_request_ownership_portal_and_identity_audit
            not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_request_ownership_portal_identity_audit_and_telephony_edge
            not in ROOT_SCRIPT_UPDATES.get(name, "")
        ):
            fail(f"root_script_updates {name} chain missing PDS enrichment validator")
    if (
        ROOT_SCRIPT_UPDATES.get("validate:pds-enrichment-flow")
        != "python3 ./tools/analysis/validate_pds_enrichment_flow.py"
    ):
        fail("root_script_updates missing validate:pds-enrichment-flow")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_decision_matrix()
    validate_fallback_cases()
    validate_tests()
    validate_scripts()
    print("[pds-enrichment-flow] validation passed")


if __name__ == "__main__":
    main()
