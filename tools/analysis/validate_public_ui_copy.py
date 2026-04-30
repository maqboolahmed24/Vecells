#!/usr/bin/env python3
"""Fail when public UI copy exposes internal implementation wording."""

from __future__ import annotations

import re
import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SCAN_ROOTS = [
    ROOT / "apps",
    ROOT / "packages" / "design-system" / "src",
    ROOT / "packages" / "persistent-shell" / "src",
    ROOT / "packages" / "surface-postures" / "src",
]

TEXT_EXTENSIONS = {".tsx", ".jsx", ".mdx", ".html"}
MODEL_EXTENSIONS = {".tsx"}

SKIP_PARTS = {
    "dist",
    "coverage",
    "node_modules",
    "generated",
    "__snapshots__",
}

SKIP_SUFFIXES = (
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
    ".generated.ts",
    ".generated.tsx",
    ".d.ts",
)

SKIP_FILENAMES = {
    "token-foundation.ts",
    "automation-telemetry.ts",
}

VISIBLE_FIELD_RE = re.compile(
    r"""
    (?P<field>
      [A-Za-z0-9_]*(?:title|label|summary|body|copy|caption|heading|headline|detail|
      description|message|note|eyebrow|helper|placeholder|ariaLabel|status)[A-Za-z0-9_]*
    )
    \s*:\s*
    (?P<quote>["'`])
    (?P<value>.*?)
    (?P=quote)
    """,
    re.IGNORECASE | re.VERBOSE,
)

ATTR_RE = re.compile(
    r"""
    (?P<name>
      aria-label|title|placeholder|label|summary|body|caption|heading|headline|
      detail|description|message|note|eyebrow|helper|toolbarLabel
    )
    =
    (?P<quote>["'])
    (?P<value>.*?)
    (?P=quote)
    """,
    re.IGNORECASE | re.VERBOSE,
)

JSX_TEXT_RE = re.compile(r">([^<>{}][^<>{]*?)<", re.MULTILINE)

BLOCKED_PATTERNS = [
    ("internal lifecycle term", re.compile(r"\bphase\s*\d+\b", re.IGNORECASE)),
    (
        "implementation wording",
        re.compile(
            r"\b(contract|lineage|provenance|telemetry|kernel|manifest|fixture|stub|posture|governed|bounded|placeholder)\b",
            re.IGNORECASE,
        ),
    ),
    ("implementation routing term", re.compile(r"\b(route family|route guard|route tree|surface tuple)\b", re.IGNORECASE)),
    (
        "internal component label",
        re.compile(
            r"\b("
            r"Diagnostics|DecisionDock|NorthStarBand|Route continuity|Continuity key|Anchor policy|"
            r"OperationalDestinationBinding|BackupRestoreChannelBinding|GovernedExportDestinationBinding|"
            r"RunbookBindingRecord|GovernanceShellConsistencyProjection|LivePhase9ProjectionGateway|"
            r"ScopeTupleInspector|ReleaseFreezeTupleCard|TenantBaselineProfile|ProvenanceStub|"
            r"Activity data log|DOM markers|Return via|OpsReturnToken|Diagnostic only|"
            r"Open alternatives stub|Fake receiver|Fake backup|Fake restore|Fake security"
            r")\b",
            re.IGNORECASE,
        ),
    ),
    (
        "raw diagnostic value",
        re.compile(
            r"\b(?:payload|registry|manifest|evidence|graph|artifact|watch|scope|policy|baseline|lifecycle|scorecard|matrix|pack version|release list|business as usual model|programme row)\s+hash\b",
            re.IGNORECASE,
        ),
    ),
    (
        "raw identifier",
        re.compile(
            r"\b(?:PHASE\d|COPYVAR|APC_|ASPR_|PNRC_|OGC_|ISRC_|ASRB_|rf_|seq_|par_)[A-Za-z0-9_:-]*\b"
        ),
    ),
    ("machine-style token", re.compile(r"\b[a-z][a-z0-9]+_[a-z0-9_]+\b")),
    ("all-caps mock token", re.compile(r"\bMOCK_[A-Z0-9_]+\b")),
]

BROAD_RE = re.compile(
    r"phase|contract|lineage|provenance|telemetry|kernel|manifest|fixture|stub|posture|governed|bounded|placeholder|route family|route guard|route tree|surface tuple|diagnostics|decisiondock|northstarband|route continuity|continuity key|anchor policy|operationaldestinationbinding|backuprestorechannelbinding|governedexportdestinationbinding|runbookbindingrecord|governanceshellconsistencyprojection|livephase9projectiongateway|scopetupleinspector|releasefreezetuplecard|tenantbaselineprofile|provenancestub|activity data log|dom markers|return via|opsreturntoken|diagnostic only|open alternatives stub|fake receiver|fake backup|fake restore|fake security|payload hash|registry hash|manifest hash|evidence hash|graph hash|artifact hash|watch hash|scope hash|policy hash|baseline hash|lifecycle hash|scorecard hash|matrix hash|pack version hash|release list hash|business as usual model hash|programme row hash|[a-z][a-z0-9]+_[a-z0-9_]+|MOCK_",
    re.IGNORECASE,
)

ALLOWED_MACHINE_TOKENS = {
    "aria_label",
    "data_testid",
}

INTERNAL_FIELD_TERMS = (
    "authority",
    "id",
    "kind",
    "policy",
    "ref",
    "status",
    "state",
)

PUBLIC_FIELD_SUFFIXES = (
    "arialabel",
    "body",
    "caption",
    "copy",
    "description",
    "detail",
    "eyebrow",
    "heading",
    "headline",
    "helper",
    "label",
    "message",
    "note",
    "placeholder",
    "summary",
    "title",
)


def should_skip(path: Path) -> bool:
    parts = set(path.relative_to(ROOT).parts)
    if parts & SKIP_PARTS:
        return True
    if path.name in SKIP_FILENAMES:
        return True
    return path.name.endswith(SKIP_SUFFIXES)


def strip_template_expressions(value: str) -> str:
    return re.sub(r"\$\{[^}]*\}", " ", value)


def interesting_text(value: str) -> str:
    value = strip_template_expressions(value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def is_noise(value: str) -> bool:
    if not value:
        return True
    if value.startswith(".") or value.startswith("#"):
        return True
    if value in {"-", "/", "|"}:
        return True
    return False


def check_value(path: Path, line: int, source: str, value: str, findings: list[str]) -> None:
    source_lower = source.lower()
    if any(term in source_lower for term in INTERNAL_FIELD_TERMS) and not source_lower.endswith(PUBLIC_FIELD_SUFFIXES):
        return
    text = interesting_text(value)
    if is_noise(text):
        return
    lower = text.lower()
    for label, pattern in BLOCKED_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue
        if label == "machine-style token" and match.group(0) in ALLOWED_MACHINE_TOKENS:
            continue
        if "mock" in lower and label == "all-caps mock token":
            pass
        findings.append(f"{path.relative_to(ROOT)}:{line}: {label} in {source}: {text}")
        return


def scan_file(path: Path, findings: list[str]) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()

    for line_no, line in enumerate(lines, 1):
        if not BROAD_RE.search(line):
            continue
        if path.suffix in TEXT_EXTENSIONS:
            for match in ATTR_RE.finditer(line):
                check_value(path, line_no, match.group("name"), match.group("value"), findings)
            for match in JSX_TEXT_RE.finditer(line):
                check_value(path, line_no, "jsx text", match.group(1), findings)

        if path.suffix in MODEL_EXTENSIONS:
            for match in VISIBLE_FIELD_RE.finditer(line):
                check_value(path, line_no, match.group("field"), match.group("value"), findings)


def iter_files() -> list[Path]:
    files: list[Path] = []
    for root in SCAN_ROOTS:
        if not root.exists():
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [dirname for dirname in dirnames if dirname not in SKIP_PARTS]
            for filename in filenames:
                path = Path(dirpath) / filename
                if path.is_file() and path.suffix in (TEXT_EXTENSIONS | MODEL_EXTENSIONS) and not should_skip(path):
                    files.append(path)
    return sorted(files)


def main() -> int:
    findings: list[str] = []
    for path in iter_files():
        scan_file(path, findings)

    if findings:
        print("Public UI copy exposes internal implementation wording:")
        for finding in findings[:200]:
            print(f" - {finding}")
        if len(findings) > 200:
            print(f" - ... {len(findings) - 200} more")
        return 1

    print("Public UI copy scan passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
