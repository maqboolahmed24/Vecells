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
SOURCE = ROOT / "services" / "command-api" / "src" / "identity-evidence-vault.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "identity-evidence-vault.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "092_phase2_identity_evidence_vault.sql"
ARCH_DOC = ROOT / "docs" / "architecture" / "177_identity_evidence_vault_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "177_evidence_encryption_masking_and_access_rules.md"
MATRIX = ROOT / "data" / "analysis" / "177_evidence_namespace_matrix.csv"
CASES = ROOT / "data" / "analysis" / "177_redaction_and_masking_cases.json"
ROOT_PACKAGE = ROOT / "package.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_ENCRYPTED_APPEND_ONLY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_MASKING_HELPERS_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_ACCESS_AUDIT_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_TELEPHONY_NAMESPACE_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_LOOKUP_TOKENIZATION_V1",
}

REQUIRED_NAMESPACES = {
    "auth_claim",
    "userinfo_claim",
    "phone_number",
    "caller_identifier",
    "handset_proof",
    "match_evidence",
    "telephony_capture",
    "repair_signal",
}

SOURCE_MARKERS = {
    "createIdentityEvidenceVaultApplication",
    "createIdentityEvidenceVaultService",
    "createInMemoryIdentityEvidenceVaultRepository",
    "createSimulatorIdentityEvidenceKeyManager",
    "createAuthBridgeEvidenceVaultPort",
    "IdentityEvidenceEnvelope",
    "IdentityEvidenceCiphertext",
    "IdentityEvidenceAccessAuditRecord",
    "IdentityEvidenceLookupToken",
    "IdentityEvidenceLocator",
    "WrappedEvidenceDataKey",
    "redactEvidenceForTelemetry",
    "detectEvidenceLeak",
    "AES-256-GCM",
    "vault_reference_only",
    "IDENTITY_EVIDENCE_STORAGE_RULE_VIOLATION",
    "EVIDENCE_177_WRITE_APPEND_ONLY",
    "EVIDENCE_177_ENVELOPE_ENCRYPTED",
    "EVIDENCE_177_RAW_READ_DENIED",
    "EVIDENCE_177_ACCESS_AUDITED",
    "EVIDENCE_177_LOOKUP_TOKENIZED",
}

MIGRATION_TABLES = {
    "identity_evidence_key_versions",
    "identity_evidence_envelopes",
    "identity_evidence_ciphertexts",
    "identity_evidence_lookup_tokens",
    "identity_evidence_access_audit",
}

MIGRATION_MARKERS = {
    "encrypted_data_key TEXT NOT NULL",
    "ciphertext TEXT NOT NULL",
    "aad_digest TEXT NOT NULL",
    "key_version_ref TEXT NOT NULL",
    "actor_ref TEXT NOT NULL",
    "append_only_sequence INTEGER NOT NULL UNIQUE",
    "idx_identity_evidence_lookup_tokens",
}

REQUIRED_CASES = {
    "EVIDENCE177_AUTH_CLAIMS_ENCRYPTED",
    "EVIDENCE177_RAW_READ_DENIED",
    "EVIDENCE177_PRIVILEGED_READ_AUDITED",
    "EVIDENCE177_PHONE_LOOKUP_TOKENIZED",
    "EVIDENCE177_TELEPHONY_IDENTIFIER_NAMESPACE",
    "EVIDENCE177_KEY_ROTATION_READBACK",
    "EVIDENCE177_TELEMETRY_REDACTION",
    "EVIDENCE177_AUTH_BRIDGE_PORT",
}


def fail(message: str) -> None:
    raise SystemExit(f"[identity-evidence-vault] {message}")


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


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def validate_checklist() -> None:
    for task_id in ["seq_170", "seq_171", "seq_172", "seq_173", "seq_174", "par_175", "par_176"]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_177")
    if checklist_state("par_177") not in {"-", "X"}:
        fail("par_177 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("identity evidence vault source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    for namespace in REQUIRED_NAMESPACES:
        if source.count(namespace) < 2:
            fail(f"source does not classify namespace {namespace}")
    forbidden = {
        "console.log(",
        "localStorage",
        "sessionStorage",
        "document.cookie",
        "Request.patientRef",
        "Episode.patientRef",
        ".patientRef =",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"source contains forbidden evidence shortcuts: {', '.join(present)}")
    if source.count("appendAudit(") < 5:
        fail("writes, reads, lookups, and denials must append access audit records")
    if source.count("lookupHash(") < 2:
        fail("lookup and write paths must use tokenized lookup hashes")
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        {
            "identity_evidence_vault_write",
            "/identity/evidence",
            "IdentityEvidenceEnvelopeContract",
            "identity_evidence_vault_masked_read",
            "/identity/evidence/masked",
            "IdentityEvidenceMaskedReadContract",
        },
    )


def validate_migration() -> None:
    migration = read(MIGRATION)
    require_markers("migration", migration, MIGRATION_TABLES | MIGRATION_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, SECURITY_DOC])
    require_markers(
        "docs",
        combined,
        {
            "IdentityEvidenceEnvelope",
            "IdentityEvidenceCiphertext",
            "IdentityEvidenceAccessAuditRecord",
            "IdentityEvidenceKeyVersionRecord",
            "AES-256-GCM",
            "keyVersionRef",
            "maskedDisplay",
            "lookupToken",
            "redactEvidenceForTelemetry",
            "detectEvidenceLeak",
            "append-only",
            "OWASP",
            "NHS login",
            "raw identity evidence may not appear",
        }
        | REQUIRED_GAPS,
    )


def validate_matrix() -> None:
    rows = load_csv(MATRIX)
    namespaces = {row.get("namespace") for row in rows}
    if not REQUIRED_NAMESPACES.issubset(namespaces):
        missing = sorted(REQUIRED_NAMESPACES - namespaces)
        fail(f"namespace matrix missing namespaces: {', '.join(missing)}")
    gap_ids = {row.get("gap_id") for row in rows}
    if not REQUIRED_GAPS.issubset(gap_ids):
        missing = sorted(REQUIRED_GAPS - gap_ids)
        fail(f"namespace matrix missing gaps: {', '.join(missing)}")
    for row in rows:
        namespace = row.get("namespace")
        if row.get("lookup_token_allowed") != "true":
            fail(f"{namespace} must use tokenized lookup refs")
        if not row.get("retention_class"):
            fail(f"{namespace} missing retention_class")
        if not row.get("disclosure_class"):
            fail(f"{namespace} missing disclosure_class")


def validate_cases() -> None:
    payload = load_json(CASES)
    if payload.get("taskId") != "par_177":
        fail("casebook taskId must be par_177")
    if payload.get("schemaVersion") != "170.phase2.trust.v1":
        fail("casebook must bind to task 170 evidence schema")
    gaps = {entry.get("gapId") for entry in payload.get("parallelInterfaceGaps", [])}
    if not REQUIRED_GAPS.issubset(gaps):
        missing = sorted(REQUIRED_GAPS - gaps)
        fail(f"casebook missing gaps: {', '.join(missing)}")
    case_ids = {case.get("caseId") for case in payload.get("cases", [])}
    if not REQUIRED_CASES.issubset(case_ids):
        missing = sorted(REQUIRED_CASES - case_ids)
        fail(f"casebook missing cases: {', '.join(missing)}")
    raw_read_policy = payload.get("rawReadPolicy", {})
    if raw_read_policy.get("requiresPrivilegedFlag") is not True:
        fail("rawReadPolicy must require privileged flag")
    serialized = json.dumps(payload, sort_keys=True)
    if re.search(r"[^\s@]+@[^\s@]+\.[^\s@]+", serialized):
        fail("casebook must not contain raw email-shaped evidence")
    if re.search(r"\+?\d[\d\s().-]{7,}\d", serialized):
        fail("casebook must not contain raw phone-shaped evidence")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "tests",
        test,
        {
            "writes raw NHS login claims as encrypted append-only evidence",
            "denies ordinary raw reads while allowing audited privileged reads",
            "tokenizes phone and caller-id lookups without storing raw lookup values",
            "rotates key versions while preserving old evidence readability",
            "redacts observability payloads and supplies an auth-bridge evidence port adapter",
            "patient@example.test",
            "+447700900177",
            "vault_reference_only",
        },
    )


def validate_root_script_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_identity_evidence_vault.py"
    if scripts.get("validate:identity-evidence-vault") != expected:
        fail("package.json missing validate:identity-evidence-vault script")
    expected_chain = (
        "pnpm validate:domain-transition-schema && pnpm validate:auth-bridge-service "
        "&& pnpm validate:session-governor && pnpm validate:identity-evidence-vault"
    )
    for script_name in ["bootstrap", "check"]:
        if expected_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} is not wired after session governor")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(script_name, ""):
            fail(f"root_script_updates {script_name} is not wired after session governor")
    if ROOT_SCRIPT_UPDATES.get("validate:identity-evidence-vault") != expected:
        fail("root_script_updates missing validate:identity-evidence-vault")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_matrix()
    validate_cases()
    validate_tests()
    validate_root_script_wiring()
    print("[identity-evidence-vault] ok")


if __name__ == "__main__":
    main()
