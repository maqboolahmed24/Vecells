#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from build_engineering_standards import (
    BRANCH_VALIDATOR_PATH,
    BRANCHING_PATH,
    CODEOWNERS_PATH,
    CODING_STANDARDS_PATH,
    COMMIT_MSG_HOOK_PATH,
    COMMIT_PATH,
    COMMIT_VALIDATOR_PATH,
    CONTRIBUTING_PATH,
    DEV_BOOTSTRAP_PATH,
    DEV_BOOTSTRAP_README_PATH,
    EDITORCONFIG_PATH,
    ESLINT_PATH,
    GITATTRIBUTES_PATH,
    POLICY_PATH,
    PRE_PUSH_HOOK_PATH,
    PRETTIER_CONFIG_PATH,
    PRETTIER_IGNORE_PATH,
    PR_HYGIENE_PATH,
    PR_TEMPLATE_PATH,
    ROOT_PACKAGE_PATH,
    ROOT_SCRIPT_UPDATES,
    TASK_ID,
    build_branch_validator,
    build_branching_strategy,
    build_codeowners,
    build_coding_standards,
    build_commit_conventions,
    build_commit_msg_hook,
    build_commit_validator,
    build_contributing,
    build_dev_bootstrap,
    build_dev_bootstrap_readme,
    build_editorconfig,
    build_eslint_config,
    build_gitattributes,
    build_policy,
    build_pre_push_hook,
    build_prettier_config,
    build_prettier_ignore,
    build_pr_hygiene,
    build_pr_template,
    load_topology,
    read_json,
)


REQUIRED_PATHS = [
    CONTRIBUTING_PATH,
    CODING_STANDARDS_PATH,
    BRANCHING_PATH,
    COMMIT_PATH,
    PR_HYGIENE_PATH,
    EDITORCONFIG_PATH,
    GITATTRIBUTES_PATH,
    PRETTIER_CONFIG_PATH,
    PRETTIER_IGNORE_PATH,
    POLICY_PATH,
    BRANCH_VALIDATOR_PATH,
    COMMIT_VALIDATOR_PATH,
    COMMIT_MSG_HOOK_PATH,
    PRE_PUSH_HOOK_PATH,
    CODEOWNERS_PATH,
    PR_TEMPLATE_PATH,
    ESLINT_PATH,
    DEV_BOOTSTRAP_PATH,
    DEV_BOOTSTRAP_README_PATH,
    ROOT_PACKAGE_PATH,
    Path(__file__),
]


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def assert_text(path: Path, expected: str) -> None:
    actual = path.read_text().rstrip()
    assert_true(actual == expected.rstrip(), f"Content drifted for {path}")


def validate_files_exist() -> None:
    missing = [str(path) for path in REQUIRED_PATHS if not path.exists()]
    assert_true(not missing, "Missing seq_045 deliverables:\n" + "\n".join(missing))


def validate_root_package() -> None:
    package_json = read_json(ROOT_PACKAGE_PATH)
    scripts = package_json.get("scripts", {})
    for key, value in ROOT_SCRIPT_UPDATES.items():
        assert_true(scripts.get(key) == value, f"Root script drifted: {key}")
    dev_dependencies = package_json.get("devDependencies", {})
    assert_true(dev_dependencies.get("prettier") == "3.6.2", "Prettier dependency drifted")


def validate_policy(topology: dict[str, object]) -> None:
    policy = read_json(POLICY_PATH)
    assert_true(policy["task_id"] == TASK_ID, "Engineering policy task id drifted")
    assert_true(policy == build_policy(topology), "Engineering policy drifted")


def validate_docs_and_configs(topology: dict[str, object]) -> None:
    assert_text(EDITORCONFIG_PATH, build_editorconfig())
    assert_text(GITATTRIBUTES_PATH, build_gitattributes())
    assert_text(PRETTIER_CONFIG_PATH, build_prettier_config())
    assert_text(PRETTIER_IGNORE_PATH, build_prettier_ignore())
    assert_text(CODEOWNERS_PATH, build_codeowners(topology))


def validate_hook_scripts() -> None:
    assert_text(COMMIT_MSG_HOOK_PATH, build_commit_msg_hook())
    assert_text(PRE_PUSH_HOOK_PATH, build_pre_push_hook())
    assert_true(".githooks" in DEV_BOOTSTRAP_PATH.read_text(), "Bootstrap no longer installs git hooks")
    assert_true("pnpm check" in PRE_PUSH_HOOK_PATH.read_text(), "Pre-push hook lost validation command")

    branch_validator_text = BRANCH_VALIDATOR_PATH.read_text()
    for marker in ("engineering-standards-policy.json", "allowed_patterns", "branch-check", "git"):
        assert_true(marker in branch_validator_text, f"Branch validator lost marker {marker}")

    commit_validator_text = COMMIT_VALIDATOR_PATH.read_text()
    for marker in ("required_footers", "Task", "Refs", "risky_footers", "commit-check"):
        assert_true(marker in commit_validator_text, f"Commit validator lost marker {marker}")


def validate_markers() -> None:
    contributing_text = CONTRIBUTING_PATH.read_text()
    assert_true("prompt/checklist.md" in contributing_text, "Contributing guide lost checklist protocol")
    assert_true("pnpm test:e2e" in contributing_text, "Contributing guide lost Playwright command")

    coding_text = CODING_STANDARDS_PATH.read_text()
    for marker in (
        "## Typing Expectations",
        "## Testing Expectations By Layer",
        "## Playwright Expectations For Browser-Visible Work",
        "## Accessibility Expectations",
        "## Package-Boundary And Import Discipline",
    ):
        assert_true(marker in coding_text, f"Coding standards missing marker {marker}")

    branch_text = BRANCHING_PATH.read_text()
    assert_true("seq_" in branch_text and "par_" in branch_text, "Branching strategy lost seq/par guidance")
    assert_true("Force-push" in branch_text, "Branching strategy lost force-push policy")

    commit_text = COMMIT_PATH.read_text()
    for commit_type in ("arch", "scaffold", "feat", "fix", "test", "docs", "security", "release", "migration"):
        assert_true(f"`{commit_type}`" in commit_text, f"Commit conventions missing type {commit_type}")
    assert_true("Task:" in commit_text and "Refs:" in commit_text, "Commit conventions lost required footers")

    review_text = PR_HYGIENE_PATH.read_text()
    for marker in (
        "Route intent or command acceptance",
        "Release controls, parity, or watch posture",
        "Trust posture, authz, or secret handling",
        "Boundary contract or topology drift",
        "Data or contract migration",
    ):
        assert_true(marker in review_text, f"PR hygiene lost risk marker {marker}")

    pr_template_text = PR_TEMPLATE_PATH.read_text()
    for marker in ("## Summary", "## Change Type", "## Validation", "## Review Focus", "## Risk Triggers"):
        assert_true(marker in pr_template_text, f"PR template lost marker {marker}")

    bootstrap_readme_text = DEV_BOOTSTRAP_README_PATH.read_text()
    assert_true("install `.githooks`" in bootstrap_readme_text, "Bootstrap README lost hook installation guidance")

    eslint_text = ESLINT_PATH.read_text()
    for marker in ("no-restricted-imports", "@vecells/domain-*", "@vecells/*/src/*", "services/api-gateway"):
        assert_true(marker in eslint_text, f"ESLint config lost marker {marker}")

    bootstrap_text = DEV_BOOTSTRAP_PATH.read_text()
    for marker in ("core.hooksPath", ".githooks", "pnpm codegen && pnpm check && pnpm test:e2e"):
        assert_true(marker in bootstrap_text, f"Bootstrap script lost marker {marker}")


def main() -> None:
    validate_files_exist()
    topology = load_topology()
    validate_root_package()
    validate_policy(topology)
    validate_docs_and_configs(topology)
    validate_hook_scripts()
    validate_markers()
    print("seq_045 validation passed")


if __name__ == "__main__":
    main()
