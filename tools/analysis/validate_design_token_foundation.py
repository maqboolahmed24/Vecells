#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "design-system"

ARTIFACT_PATH = DATA_DIR / "design_token_export_artifact.json"
PROFILE_PATH = DATA_DIR / "profile_selection_resolutions.json"
CONTRAST_PATH = DATA_DIR / "token_contrast_matrix.csv"
MODE_PATH = DATA_DIR / "token_mode_coverage_matrix.csv"
PUBLICATION_DOC_PATH = DOCS_DIR / "103_design_token_foundation_publication.md"
VISUAL_DOC_PATH = DOCS_DIR / "103_signal_atlas_live_visual_direction.md"
PROFILE_DOC_PATH = DOCS_DIR / "103_token_profile_resolution_strategy.md"
HTML_PATH = DOCS_DIR / "103_design_token_specimen.html"
SVG_PATH = ROOT / "assets" / "brand" / "signal-atlas-live-mark.svg"
SPEC_PATH = PLAYWRIGHT_DIR / "design-token-foundation.spec.js"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_design_token_foundation.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"
INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
TOKEN_SOURCE_PATH = PACKAGE_DIR / "src" / "token-foundation.ts"
STYLESHEET_PATH = PACKAGE_DIR / "src" / "foundation.css"
SCHEMA_PATH = PACKAGE_DIR / "contracts" / "design-token-foundation.schema.json"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
TOKEN_TEST_PATH = PACKAGE_DIR / "tests" / "token-foundation.test.ts"


EXPECTED_PROFILE_ROWS = {
    "PSR_050_PATIENT_V1",
    "PSR_050_STAFF_V1",
    "PSR_050_HUB_V1",
    "PSR_050_SUPPORT_V1",
    "PSR_050_PHARMACY_V1",
    "PSR_050_OPERATIONS_V1",
    "PSR_050_GOVERNANCE_V1",
    "PSR_103_EMBEDDED_COMPANION_V1",
}
EXPECTED_SHELL_TYPES = {
    "patient",
    "staff",
    "hub",
    "support",
    "pharmacy",
    "operations",
    "governance",
    "embedded",
}
EXPECTED_STATE_ROLES = {"neutral", "active", "review", "insight", "success", "danger"}
EXPECTED_BREAKPOINTS = {"xs", "md", "lg", "xl"}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_103 artifact: {path}")


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    for path in [
        ARTIFACT_PATH,
        PROFILE_PATH,
        CONTRAST_PATH,
        MODE_PATH,
        PUBLICATION_DOC_PATH,
        VISUAL_DOC_PATH,
        PROFILE_DOC_PATH,
        HTML_PATH,
        SVG_PATH,
        SPEC_PATH,
        VALIDATOR_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        PACKAGE_JSON_PATH,
        INDEX_PATH,
        TOKEN_SOURCE_PATH,
        STYLESHEET_PATH,
        SCHEMA_PATH,
        PUBLIC_API_TEST_PATH,
        TOKEN_TEST_PATH,
    ]:
        assert_exists(path)

    artifact = load_json(ARTIFACT_PATH)
    resolution_payload = load_json(PROFILE_PATH)
    contrast_rows = load_csv(CONTRAST_PATH)
    mode_rows = load_csv(MODE_PATH)
    schema = load_json(SCHEMA_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    design_system_package = load_json(PACKAGE_JSON_PATH)

    if artifact["task_id"] != "par_103":
        fail("Design token artifact drifted off par_103.")
    if artifact["visual_mode"] != "Design_Token_Specimen":
        fail("Design token visual mode drifted.")
    if artifact["designTokenFoundation"]["visualLanguage"] != "Signal Atlas Live":
        fail("Visual language drifted off Signal Atlas Live.")
    if artifact["designTokenFoundation"]["overlay"] != "Quiet Clarity":
        fail("Quiet Clarity overlay drifted.")
    if artifact["designTokenFoundation"]["tokenArchitecture"] != [
        "ref.*",
        "sys.*",
        "comp.*",
        "profile.*",
    ]:
        fail("Token architecture drifted from the canonical four-layer graph.")

    summary = artifact["summary"]
    if summary["primitive_group_count"] != len(artifact["primitiveTokenGroups"]):
        fail("primitive_group_count drifted.")
    if summary["semantic_alias_count"] != len(artifact["semanticAliases"]):
        fail("semantic_alias_count drifted.")
    if summary["component_alias_count"] != len(artifact["componentAliases"]):
        fail("component_alias_count drifted.")
    if summary["profile_token_count"] != len(artifact["profileTokens"]):
        fail("profile_token_count drifted.")
    if summary["profile_selection_resolution_count"] != len(artifact["profileSelectionResolutions"]):
        fail("profile_selection_resolution_count drifted.")
    if summary["supported_mode_tuple_count"] != len(mode_rows):
        fail("supported_mode_tuple_count drifted.")
    if summary["contrast_matrix_row_count"] != len(contrast_rows):
        fail("contrast_matrix_row_count drifted.")
    if summary["profile_selection_resolution_count"] != 8:
        fail("par_103 must publish 8 profile-selection rows.")
    if summary["supported_mode_tuple_count"] != 36:
        fail("par_103 must publish 36 supported mode tuples.")

    export_artifact = artifact["designTokenExportArtifact"]
    layering_policy = artifact["tokenKernelLayeringPolicy"]
    if export_artifact["designTokenExportArtifactId"] != "DTEA_SIGNAL_ATLAS_LIVE_CANONICAL_V1":
        fail("DesignTokenExportArtifact id drifted.")
    if layering_policy["tokenKernelLayeringPolicyId"] != "TKLP_SIGNAL_ATLAS_LIVE_V1":
        fail("TokenKernelLayeringPolicy id drifted.")
    if layering_policy["requiredAliasOrder"] != "ref_to_sys_to_comp_to_profile":
        fail("Token alias order drifted.")
    if set(layering_policy["forbiddenOverrideClasses"]) != {
        "route_local_hex",
        "route_local_px",
        "route_local_shadow_stack",
        "route_local_radius_ladder",
        "route_local_telemetry_name",
        "route_local_animation_curve",
    }:
        fail("Forbidden override classes drifted.")

    resolution_rows = artifact["profileSelectionResolutions"]
    resolution_ids = {row["profileSelectionResolutionId"] for row in resolution_rows}
    if resolution_ids != EXPECTED_PROFILE_ROWS:
        fail(f"ProfileSelectionResolution coverage drifted: {resolution_ids ^ EXPECTED_PROFILE_ROWS}")
    shell_types = {row["shellType"] for row in resolution_rows}
    if shell_types != EXPECTED_SHELL_TYPES:
        fail(f"Shell coverage drifted: {shell_types ^ EXPECTED_SHELL_TYPES}")
    if any(row["designTokenExportArtifactRef"] != export_artifact["designTokenExportArtifactId"] for row in resolution_rows):
        fail("Profile rows no longer point at the canonical export artifact.")
    if any(row["tokenKernelLayeringPolicyRef"] != layering_policy["tokenKernelLayeringPolicyId"] for row in resolution_rows):
        fail("Profile rows no longer point at the canonical layering policy.")
    if any(not row["selectionDigestRef"] for row in resolution_rows):
        fail("One or more profile rows lost selectionDigestRef.")

    specimen = artifact["specimen"]
    if specimen["brandMarkPath"] != "assets/brand/signal-atlas-live-mark.svg":
        fail("Specimen brand mark path drifted.")
    if len(specimen["shellProfiles"]) != 8:
        fail("Specimen shell profile count drifted.")
    if {row["shellType"] for row in specimen["shellProfiles"]} != EXPECTED_SHELL_TYPES:
        fail("Specimen shell types drifted.")
    if {row["role"] for row in specimen["semanticStates"]} != EXPECTED_STATE_ROLES:
        fail("Specimen semantic state coverage drifted.")
    if {row["breakpointClass"] for row in specimen["breakpointFrames"]} != EXPECTED_BREAKPOINTS:
        fail("Specimen breakpoint coverage drifted.")
    if [row["label"] for row in specimen["digestChips"]] != ["artifact", "layering", "profiles"]:
        fail("Specimen digest chips drifted.")

    if resolution_payload["task_id"] != "par_103":
        fail("Profile resolution payload drifted off par_103.")
    if resolution_payload["visual_mode"] != "Design_Token_Specimen":
        fail("Profile resolution payload visual mode drifted.")
    if resolution_payload["summary"]["shell_profile_count"] != 8:
        fail("Profile resolution payload shell count drifted.")
    payload_rows = resolution_payload["profileSelectionResolutions"]
    if {row["profileSelectionResolutionId"] for row in payload_rows} != EXPECTED_PROFILE_ROWS:
        fail("Profile resolution payload rows drifted.")

    if len(mode_rows) != 36:
        fail("Mode coverage CSV must publish 36 rows.")
    if len({row["mode_tuple_id"] for row in mode_rows}) != 36:
        fail("Mode coverage CSV lost tuple uniqueness.")
    if {row["theme"] for row in mode_rows} != {"light", "dark"}:
        fail("Mode coverage themes drifted.")
    if {row["contrast"] for row in mode_rows} != {"standard", "high"}:
        fail("Mode coverage contrast modes drifted.")
    if {row["density"] for row in mode_rows} != {"relaxed", "balanced", "compact"}:
        fail("Mode coverage density modes drifted.")
    if {row["motion"] for row in mode_rows} != {"full", "reduced", "essential_only"}:
        fail("Mode coverage motion modes drifted.")
    if {row["status"] for row in mode_rows} != {"supported"}:
        fail("Mode coverage statuses drifted.")

    if len(contrast_rows) < 60:
        fail("Contrast matrix coverage is unexpectedly small.")
    if {row["status"] for row in contrast_rows} != {"pass"}:
        fail("Contrast matrix contains failing rows.")
    if {"surface_text", "focus"} - {row["semantic_role"] for row in contrast_rows}:
        fail("Contrast matrix lost required semantic-role coverage.")

    if schema["title"] != "Design Token Foundation Artifact":
        fail("Design token schema title drifted.")
    required_props = set(schema["required"])
    if {"designTokenExportArtifact", "profileSelectionResolutions", "specimen"} - required_props:
        fail("Design token schema lost required top-level properties.")

    assert_contains(TOKEN_SOURCE_PATH, 'export const DESIGN_TOKEN_FOUNDATION_TASK_ID = "par_103"')
    assert_contains(TOKEN_SOURCE_PATH, 'export const DESIGN_TOKEN_EXPORT_ARTIFACT_ID = "DTEA_SIGNAL_ATLAS_LIVE_CANONICAL_V1"')
    assert_contains(TOKEN_SOURCE_PATH, 'export const TOKEN_KERNEL_LAYERING_POLICY_ID = "TKLP_SIGNAL_ATLAS_LIVE_V1"')
    assert_contains(TOKEN_SOURCE_PATH, 'export const specimenShellProfiles = profileTokens.map(')
    assert_contains(INDEX_PATH, 'from "./token-foundation";')
    assert_contains(STYLESHEET_PATH, ".specimen-page")
    assert_contains(STYLESHEET_PATH, 'body[data-motion="essential_only"]')
    assert_contains(STYLESHEET_PATH, ".semantic-state-wall")
    assert_contains(STYLESHEET_PATH, ".responsive-frame-grid")
    assert_contains(SVG_PATH, 'id="signal-atlas-live-mark"')
    assert_contains(SVG_PATH, 'fill="#2F6FED"')
    assert_contains(PUBLICATION_DOC_PATH, "Signal Atlas Live")
    assert_contains(VISUAL_DOC_PATH, "premium clinical instrument")
    assert_contains(PROFILE_DOC_PATH, "ProfileSelectionResolution")
    assert_contains(HTML_PATH, 'data-testid="specimen-masthead"')
    assert_contains(HTML_PATH, 'data-testid="token-lattice"')
    assert_contains(HTML_PATH, 'data-testid="shell-profile-gallery"')
    assert_contains(HTML_PATH, 'data-testid="profile-inspector"')
    assert_contains(HTML_PATH, 'data-testid="semantic-state-wall"')
    assert_contains(HTML_PATH, 'data-testid="responsive-lattice"')
    assert_contains(HTML_PATH, 'data-testid="motion-lane"')
    assert_contains(HTML_PATH, 'data-testid="parity-sample"')
    assert_contains(HTML_PATH, "../../packages/design-system/src/foundation.css")
    assert_contains(HTML_PATH, "../../data/analysis/design_token_export_artifact.json")
    assert_contains(HTML_PATH, "../../assets/brand/signal-atlas-live-mark.svg")
    assert_contains(SPEC_PATH, "designTokenFoundationCoverage")
    assert_contains(SPEC_PATH, "mode tuple coverage")
    assert_contains(SPEC_PATH, "reduced motion")

    if design_system_package["exports"]["./contracts/design-token-foundation.schema.json"] != "./contracts/design-token-foundation.schema.json":
        fail("Design-system package export for the token-foundation schema drifted.")
    if root_package["scripts"]["validate:design-token-foundation"] != "python3 ./tools/analysis/validate_design_token_foundation.py":
        fail("Root package validate:design-token-foundation script drifted.")
    if "pnpm validate:design-token-foundation" not in root_package["scripts"]["bootstrap"]:
        fail("Root bootstrap script is missing validate:design-token-foundation.")
    if "pnpm validate:design-token-foundation" not in root_package["scripts"]["check"]:
        fail("Root check script is missing validate:design-token-foundation.")
    if ROOT_SCRIPT_UPDATES["bootstrap"] != root_package["scripts"]["bootstrap"]:
        fail("root_script_updates bootstrap drifted from package.json.")
    if ROOT_SCRIPT_UPDATES["check"] != root_package["scripts"]["check"]:
        fail("root_script_updates check drifted from package.json.")
    if ROOT_SCRIPT_UPDATES["validate:design-token-foundation"] != root_package["scripts"]["validate:design-token-foundation"]:
        fail("root_script_updates validate:design-token-foundation drifted from package.json.")

    playwright_scripts = playwright_package["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "design-token-foundation.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright package script {script_name} is missing design-token-foundation.spec.js.")


if __name__ == "__main__":
    main()
