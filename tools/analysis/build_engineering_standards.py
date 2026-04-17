#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "engineering"
GITHUB_DIR = ROOT / ".github"
HOOKS_DIR = ROOT / ".githooks"
GIT_HOOK_TOOL_DIR = ROOT / "tools" / "git-hooks"

ROOT_PACKAGE_PATH = ROOT / "package.json"
TOPOLOGY_PATH = DATA_DIR / "repo_topology_manifest.json"
CONTRIBUTING_PATH = ROOT / "CONTRIBUTING.md"
CODING_STANDARDS_PATH = DOCS_DIR / "45_coding_standards.md"
BRANCHING_PATH = DOCS_DIR / "45_branching_strategy.md"
COMMIT_PATH = DOCS_DIR / "45_commit_conventions.md"
PR_HYGIENE_PATH = DOCS_DIR / "45_pr_review_and_release_hygiene.md"
EDITORCONFIG_PATH = ROOT / ".editorconfig"
GITATTRIBUTES_PATH = ROOT / ".gitattributes"
PRETTIER_CONFIG_PATH = ROOT / "prettier.config.mjs"
PRETTIER_IGNORE_PATH = ROOT / ".prettierignore"
POLICY_PATH = GIT_HOOK_TOOL_DIR / "engineering-standards-policy.json"
BRANCH_VALIDATOR_PATH = GIT_HOOK_TOOL_DIR / "validate-branch-name.mjs"
COMMIT_VALIDATOR_PATH = GIT_HOOK_TOOL_DIR / "validate-commit-message.mjs"
COMMIT_MSG_HOOK_PATH = HOOKS_DIR / "commit-msg"
PRE_PUSH_HOOK_PATH = HOOKS_DIR / "pre-push"
CODEOWNERS_PATH = GITHUB_DIR / "CODEOWNERS"
PR_TEMPLATE_PATH = GITHUB_DIR / "pull_request_template.md"
ESLINT_PATH = ROOT / "eslint.config.mjs"
DEV_BOOTSTRAP_PATH = ROOT / "tools" / "dev-bootstrap" / "index.mjs"
DEV_BOOTSTRAP_README_PATH = ROOT / "tools" / "dev-bootstrap" / "README.md"

TASK_ID = "seq_045"
CAPTURED_ON = "2026-04-11"
GENERATED_AT = "2026-04-11T00:00:00+00:00"

ROOT_SCRIPT_UPDATES = {
    "bootstrap": "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && pnpm validate:events && pnpm validate:fhir && pnpm validate:fhir-compiler && pnpm validate:frontend && pnpm validate:api-contract-registry && pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && pnpm validate:adapter-contracts && pnpm validate:verification-ladder && pnpm validate:seed-simulators && pnpm validate:recovery-baseline && pnpm validate:parallel-foundation-gate && pnpm validate:submission-lineage && pnpm validate:submission-promotion && pnpm validate:replay-classification && pnpm validate:evidence-backbone && pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards",
    "check": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && pnpm validate:events && pnpm validate:fhir && pnpm validate:fhir-compiler && pnpm validate:frontend && pnpm validate:api-contract-registry && pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && pnpm validate:adapter-contracts && pnpm validate:verification-ladder && pnpm validate:seed-simulators && pnpm validate:recovery-baseline && pnpm validate:parallel-foundation-gate && pnpm validate:submission-lineage && pnpm validate:submission-promotion && pnpm validate:replay-classification && pnpm validate:evidence-backbone && pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards",
    "codegen": "python3 ./tools/analysis/build_monorepo_scaffold.py && python3 ./tools/analysis/build_runtime_service_scaffold.py && python3 ./tools/analysis/build_domain_package_scaffold.py && python3 ./tools/analysis/build_runtime_topology_manifest.py && python3 ./tools/analysis/build_gateway_surface_map.py && python3 ./tools/analysis/build_event_registry.py && python3 ./tools/analysis/build_submission_and_lineage_backbone.py && python3 ./tools/analysis/build_submission_promotion_mapping.py && python3 ./tools/analysis/build_idempotency_and_collision_review.py && python3 ./tools/analysis/build_evidence_backbone.py && python3 ./tools/analysis/build_fhir_representation_contracts.py && python3 ./tools/analysis/build_frontend_contract_manifests.py && python3 ./tools/analysis/build_api_contract_registry.py && python3 ./tools/analysis/build_release_freeze_and_parity.py && python3 ./tools/analysis/build_design_contract_publication.py && python3 ./tools/analysis/build_audit_and_worm_strategy.py && python3 ./tools/analysis/build_tenant_scope_model.py && python3 ./tools/analysis/build_lifecycle_coordinator_rules.py && python3 ./tools/analysis/build_scoped_mutation_gate_rules.py && python3 ./tools/analysis/build_adapter_contract_profiles.py && python3 ./tools/analysis/build_verification_ladder_and_environment_ring_policy.py && python3 ./tools/analysis/build_seed_data_and_simulator_strategy.py && python3 ./tools/analysis/build_backup_restore_and_recovery_tuple_baseline.py && python3 ./tools/analysis/build_engineering_standards.py && python3 ./tools/analysis/build_parallel_foundation_tracks_gate.py && python3 ./tools/analysis/build_fhir_mapping_compiler.py && pnpm format",
    "format": "prettier --write . --ignore-unknown",
    "format:check": "prettier --check . --ignore-unknown",
    "validate:runtime-topology": "python3 ./tools/analysis/validate_runtime_topology_manifest.py",
    "validate:gateway-surface": "python3 ./tools/analysis/validate_gateway_surface_map.py",
    "validate:events": "python3 ./tools/analysis/validate_event_registry.py",
    "validate:fhir": "python3 ./tools/analysis/validate_fhir_representation_contracts.py",
    "validate:fhir-compiler": "python3 ./tools/analysis/validate_fhir_mapping_compiler.py",
    "validate:frontend": "python3 ./tools/analysis/validate_frontend_contract_manifests.py",
    "validate:api-contract-registry": "python3 ./tools/analysis/validate_api_contract_registry.py",
    "validate:release-parity": "python3 ./tools/analysis/validate_release_freeze_and_parity.py",
    "validate:design-publication": "python3 ./tools/analysis/validate_design_contract_publication.py",
    "validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",
    "validate:tenant-scope": "python3 ./tools/analysis/validate_tenant_scope_model.py",
    "validate:lifecycle": "python3 ./tools/analysis/validate_lifecycle_coordinator_rules.py",
    "validate:mutation-gate": "python3 ./tools/analysis/validate_scoped_mutation_gate.py",
    "validate:adapter-contracts": "python3 ./tools/analysis/validate_adapter_contract_profiles.py",
    "validate:verification-ladder": "python3 ./tools/analysis/validate_verification_ladder.py",
    "validate:seed-simulators": "python3 ./tools/analysis/validate_seed_and_simulator_strategy.py",
    "validate:recovery-baseline": "python3 ./tools/analysis/validate_recovery_tuple_baseline.py",
    "validate:parallel-foundation-gate": "python3 ./tools/analysis/validate_parallel_foundation_gate.py",
    "validate:submission-lineage": "python3 ./tools/analysis/validate_submission_and_lineage_backbone.py",
    "validate:submission-promotion": "python3 ./tools/analysis/validate_submission_promotion_mapping.py",
    "validate:replay-classification": "python3 ./tools/analysis/validate_replay_classification.py",
    "validate:evidence-backbone": "python3 ./tools/analysis/validate_evidence_backbone.py",
    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",
    "branch:check": "node ./tools/git-hooks/validate-branch-name.mjs --current",
    "commit:check": "node ./tools/git-hooks/validate-commit-message.mjs",
}
ROOT_SCRIPT_UPDATES = SHARED_ROOT_SCRIPT_UPDATES

PRETTIER_VERSION = "3.6.2"
COMMIT_TYPES = [
    "arch",
    "scaffold",
    "feat",
    "fix",
    "test",
    "docs",
    "security",
    "release",
    "migration",
]
RISKY_TYPES = ["release", "migration"]

LEGACY_CODEOWNERS = [
    ("/apps/mock-*/", "@vecells/analysis-validation"),
    ("/services/mock-*/", "@vecells/analysis-validation"),
    ("/reference prompt.zip", "@vecells/analysis-validation"),
]

ROOT_CODEOWNERS = [
    ("/CONTRIBUTING.md", "@vecells/analysis-validation"),
    ("/docs/engineering/", "@vecells/analysis-validation"),
    ("/prompt/", "@vecells/analysis-validation"),
    ("/tools/git-hooks/", "@vecells/analysis-validation"),
    ("/.githooks/", "@vecells/analysis-validation"),
    ("/.github/", "@vecells/analysis-validation"),
    ("/.editorconfig", "@vecells/analysis-validation"),
    ("/.gitattributes", "@vecells/analysis-validation"),
    ("/prettier.config.mjs", "@vecells/analysis-validation"),
    ("/.prettierignore", "@vecells/analysis-validation"),
    ("/eslint.config.mjs", "@vecells/analysis-validation"),
    ("/package.json", "@vecells/analysis-validation"),
    ("/pnpm-workspace.yaml", "@vecells/analysis-validation"),
    ("/nx.json", "@vecells/analysis-validation"),
    ("/tsconfig.base.json", "@vecells/analysis-validation"),
    ("/vitest.workspace.ts", "@vecells/analysis-validation"),
    ("/.env.example", "@vecells/analysis-validation"),
]

RELEASE_RISK_PATHS = [
    "services/api-gateway",
    "services/command-api",
    "services/notification-worker",
    "packages/api-contracts",
    "packages/authz-policy",
    "packages/release-controls",
    "packages/domains/release_control",
    "tools/browser-automation",
    "infra/",
    "ops/",
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def load_topology() -> dict[str, Any]:
    return read_json(TOPOLOGY_PATH)


def owner_handle_for_context(context_code: str) -> str:
    return f"@vecells/{context_code.replace('_', '-')}"


def canonical_topology_entries(topology: dict[str, Any]) -> list[tuple[str, str]]:
    entries = []
    for artifact in sorted(topology["artifacts"], key=lambda item: item["repo_path"]):
        entries.append((f"/{artifact['repo_path']}/", owner_handle_for_context(artifact["owner_context_code"])))
    return entries


def build_policy(topology: dict[str, Any]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "topology_summary": topology["summary"],
        "branch_policy": {
            "preferred_namespace": "codex",
            "allowed_patterns": [
                "^main$",
                "^dev$",
                "^(codex|user|agent|automation)/seq-[0-9]{3}-[a-z0-9][a-z0-9-]*$",
                "^(codex|user|agent|automation)/par-[0-9]{3}[a-z]?-[a-z0-9][a-z0-9-]*$",
                "^release/[0-9]{4}-[0-9]{2}-[0-9]{2}(-[a-z0-9-]+)?$",
                "^hotfix/[a-z0-9][a-z0-9-]*$",
            ],
            "examples": [
                "codex/seq-045-engineering-standards",
                "codex/par-046a-runtime-topology",
                "user/seq-052-patient-home-route-family",
                "dev",
                "release/2026-04-11-foundation-cut",
                "hotfix/recover-route-freeze-evidence",
            ],
        },
        "commit_policy": {
            "header_pattern": r"^(arch|scaffold|feat|fix|test|docs|security|release|migration)(\([a-z0-9][a-z0-9/-]*\))?(!)?: .{10,88}$",
            "allowed_types": COMMIT_TYPES,
            "required_footers": ["Task", "Refs"],
            "risky_types": RISKY_TYPES,
            "risky_footers": ["Risk", "Validation"],
            "forbidden_types": ["chore", "misc", "update"],
        },
        "release_risk_paths": RELEASE_RISK_PATHS,
        "source_precedence": [
            "prompt/045.md",
            "prompt/shared_operating_contract_036_to_045.md",
            "prompt/AGENT.md",
            "prompt/checklist.md",
            "docs/architecture/12_language_standards_and_allowed_toolchains.md",
            "docs/architecture/12_testing_toolchain_and_quality_gate_baseline.md",
            "docs/architecture/12_import_boundary_and_codeowners_policy.md",
            "docs/architecture/15_verification_ladder_and_quality_gate_strategy.md",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md",
            "docs/architecture/41_repository_topology_rules.md",
            "docs/architecture/42_monorepo_scaffold_plan.md",
            "docs/architecture/43_service_scaffold_map.md",
            "docs/architecture/44_domain_package_contracts.md",
        ],
    }


def build_contributing(topology: dict[str, Any]) -> str:
    summary = topology["summary"]
    return dedent(
        f"""
        # Contributing

        Vecells is a contract-first monorepo. The contributor workflow is intentionally opinionated so later coding agents, human contributors, and CI all use the same branch, commit, validation, and review model.

        ## Start Here

        1. Claim the next eligible task in `prompt/checklist.md` before editing code.
        2. Read the task prompt plus `prompt/AGENT.md` and keep the checklist serialization intact.
        3. Create one task-scoped branch such as `codex/seq-045-engineering-standards`.
        4. Run `pnpm bootstrap` once per clone or after generator changes.
        5. Before opening a PR, run `pnpm check`. If the change is browser-visible, also run `pnpm test:e2e`.

        ## Canonical Validation Commands

        - `pnpm bootstrap`
        - `pnpm codegen`
        - `pnpm format`
        - `pnpm check`
        - `pnpm test:e2e`
        - `pnpm verify:release`

        ## Current Foundation Scope

        - Canonical topology: `{summary['artifact_count']}` artifacts
        - Apps: `{summary['app_count']}`
        - Services: `{summary['service_count']}`
        - Packages: `{summary['package_count']}`
        - Tooling and docs workspaces: `{summary['special_workspace_count']}`

        ## Non-Negotiables

        - Typed code is the default. “Temporary scaffold” does not waive typing, tests, or boundary discipline.
        - Browser-visible work is not complete without Playwright-or-equivalent proof.
        - Apps consume published contracts; they do not become hidden owners of domain or service truth.
        - Commits must carry architectural signal. `update`, `misc`, and unlabeled bundles are rejected.
        - Every commit must trace back to roadmap work using `Task:` and `Refs:` footers.

        ## Standards Pack

        - [45 Coding Standards](docs/engineering/45_coding_standards.md)
        - [45 Branching Strategy](docs/engineering/45_branching_strategy.md)
        - [45 Commit Conventions](docs/engineering/45_commit_conventions.md)
        - [45 PR Review And Release Hygiene](docs/engineering/45_pr_review_and_release_hygiene.md)

        ## Commit Footer Minimum

        ```text
        Task: seq_045
        Refs: prompt/045.md, prompt/AGENT.md, docs/architecture/41_repository_topology_rules.md
        ```

        Use `Risk:` and `Validation:` footers as well when the change touches release controls, migrations, route intent, trust posture, or other explicitly risky surfaces.
        """
    ).strip()


def build_coding_standards(topology: dict[str, Any]) -> str:
    summary = topology["summary"]
    return dedent(
        f"""
        # 45 Coding Standards

        Vecells publishes one engineering baseline across `{summary['artifact_count']}` canonical artifacts. These rules translate the architecture corpus into day-to-day developer ergonomics so shells, services, shared contracts, and tooling stay aligned.

        ## Source Order

        1. `prompt/AGENT.md` and `prompt/checklist.md` for sequencing and claim law
        2. `prompt/045.md` plus the shared operating contract for seq_036-045
        3. `docs/architecture/41_repository_topology_rules.md`
        4. `docs/architecture/42_monorepo_scaffold_plan.md`
        5. `docs/architecture/43_service_scaffold_map.md`
        6. `docs/architecture/44_domain_package_contracts.md`

        ## Code Style Baseline

        - Use `prettier` for formatting and `eslint` for code-quality enforcement.
        - Default indentation is two spaces for JS, TS, JSON, Markdown, YAML, and shell-compatible text. Python keeps four spaces.
        - Keep files ASCII unless an existing file already uses Unicode for a clear reason.
        - Prefer small modules with explicit names over “misc”, “helpers”, or anonymous shared buckets.
        - Public APIs must be exported through package entrypoints, never through private `src/*` deep imports.

        ## Typing Expectations

        - TypeScript is the default runtime and package language.
        - `strict` TypeScript remains on. Do not weaken compiler settings to land scaffolds or tests.
        - Python stays bounded to repo analysis and validation tools. It may inspect or synthesize; it never owns runtime truth.
        - Contract data crossing package or service boundaries must use explicit types, schemas, or manifest-backed structures.

        ## Testing Expectations By Layer

        - Static and unit: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`
        - Repo topology and generator drift: `pnpm validate:topology`, `pnpm validate:scaffold`, `pnpm validate:services`, `pnpm validate:domains`, `pnpm validate:standards`
        - Browser-visible work: `pnpm test:e2e`
        - Release or migration risk: `pnpm verify:release` plus any task-specific dry runs or migration proofs

        ## Playwright Expectations For Browser-Visible Work

        - Define semantic landmarks and stable `data-testid` markers before polish.
        - Drive critical flows with Playwright while building, not only as a late smoke test.
        - Browser-visible work is incomplete until Playwright covers the user-visible behavior, reduced-motion posture, and chart or diagram parity where relevant.
        - UI-only claims without browser automation evidence do not meet the Vecells definition of done.

        ## Accessibility Expectations

        - Preserve visible focus rings, landmark structure, keyboard access, and readable parity content beside diagrams or visual summaries.
        - Primary controls stay large enough for touch and keyboard operation.
        - Reduced motion must stay functional and truthful, not merely hidden.
        - Accessibility semantics belong in code and contract surfaces, not only in screenshots or review comments.

        ## Performance And Security Hygiene

        - No source secrets, live credentials, or provider identifiers in committed code, snapshots, traces, or logs.
        - Keep logs structured and disclosure-safe; redact tokens, credentials, and patient-sensitive context.
        - Prefer explicit release gates, retry policies, and degraded defaults over silent fallback.
        - Treat dependency, provenance, and watch tuple drift as release blockers rather than operational chores.

        ## Package-Boundary And Import Discipline

        - Apps consume published contracts, design-system APIs, and shared packages only.
        - `services/api-gateway` may publish or enforce contracts and policy, but it does not import domain packages directly.
        - Domain packages do not import sibling domain packages. Shared kernel, published contracts, authz policy, and observability are the allowed seams.
        - Never deep import another workspace’s `src/*`, `internal/*`, `workers/*`, or `repositories/*` paths.
        - If a boundary rule feels awkward, fix the exported seam or the architecture record instead of bypassing the rule locally.

        ## Traceability Expectations

        - Every branch, commit, PR, and generated artifact must point back to a concrete `seq_` or `par_` task.
        - Commits require `Task:` and `Refs:` footers.
        - PRs must name the prompt task, the architecture refs touched, and the exact validation commands run.

        ## Temporary Scaffold Rule

        “Placeholder”, “draft”, and “temporary scaffold” are delivery posture labels, not waivers. The same typing, testing, boundary, accessibility, and traceability rules still apply.
        """
    ).strip()


def build_branching_strategy() -> str:
    return dedent(
        """
        # 45 Branching Strategy

        The branch model exists to reinforce `prompt/checklist.md`, not replace it. Branch names express task scope; the checklist remains the authority on what may start next.

        ## Checklist Serialization First

        - Claim the next eligible `seq_` item before you edit code.
        - A `seq_` branch may cover one sequential task only.
        - A `par_` branch is allowed only when the checklist already marks the work as parallel-safe.
        - Branch names never authorize skipping earlier unchecked sequential work.

        ## Allowed Branch Forms

        - `dev`
        - `codex/seq-045-engineering-standards`
        - `codex/par-046a-runtime-topology`
        - `user/seq-052-patient-home-route-family`
        - `release/2026-04-11-foundation-cut`
        - `hotfix/recover-route-freeze-evidence`

        Prefer the `codex/` namespace for agent-created branches. Human contributors may use `user/`. Automation may use `automation/`.

        ## Branch Rules

        - Keep one concern per branch.
        - Do not stack multiple unrelated prompt tasks into one branch just because they touch nearby files.
        - `dev` is the current integration branch. Rebase or merge from it frequently enough to avoid hidden generator or topology drift.
        - Release and hotfix branches are exceptions and require explicit reviewer acknowledgement because they may bypass the normal prompt ordering.

        ## Force-Push Policy

        - Force-push is allowed only on your own unpublished branch while you are still cleaning local history.
        - Do not force-push a branch once review has started, once CI or automations are attached, or when another contributor is collaborating on it.
        - If a history rewrite would hide evidence, keep the history and make a follow-up commit instead.

        ## Merge Posture

        - Prefer preserving intentional task-scoped commits over collapsing everything into one anonymous squash.
        - If you squash, the resulting commit title and body must still follow the commit taxonomy and required footers.
        """
    ).strip()


def build_commit_conventions() -> str:
    commit_rows = "\n".join(
        f"| `{commit_type}` | {description} |"
        for commit_type, description in [
            ("arch", "Architecture decisions, topology law, boundary rules, ADR-aligned structural changes."),
            ("scaffold", "Generated scaffolds, deterministic builders, workspace skeleton changes, contract-first placeholders."),
            ("feat", "New user-visible or operator-visible behavior within an approved architectural seam."),
            ("fix", "Behavior correction, regression repair, or bug fix."),
            ("test", "New or improved verification, fixtures, or Playwright coverage without primary product behavior change."),
            ("docs", "Documentation-only changes, including standards and operating docs."),
            ("security", "Secret handling, auth hardening, redaction, vulnerability remediation, or security control changes."),
            ("release", "Release-control, provenance, parity, deployment, watch, or recovery posture changes."),
            ("migration", "Schema, contract, data, or compatibility migration work."),
        ]
    )
    return dedent(
        f"""
        # 45 Commit Conventions

        Vecells commit history must communicate architectural intent. Generic labels such as `update`, `misc`, and `chore` are not part of the allowed taxonomy.

        ## Header Format

        ```text
        type(scope)!: short imperative summary
        ```

        - `type` must be one of the approved types below.
        - `scope` is optional but recommended. Use a bounded context, workspace, or subsystem such as `patient-web`, `release-controls`, or `topology`.
        - `!` marks a breaking or high-risk change and triggers extra footer requirements.
        - Keep the summary between 10 and 88 characters and avoid a trailing period.

        ## Allowed Types

        | Type | Use when |
        | --- | --- |
        {commit_rows}

        ## Required Footers

        Every commit must include:

        ```text
        Task: seq_045
        Refs: prompt/045.md, prompt/AGENT.md, docs/architecture/41_repository_topology_rules.md
        ```

        ## Risk Footers

        Commits with type `release`, type `migration`, or a breaking `!` header must also include:

        ```text
        Risk: route-intent, release-control, migration, or trust-posture impact
        Validation: pnpm check; pnpm test:e2e
        ```

        ## Examples

        ```text
        scaffold(topology): add deterministic engineering standards generator

        Task: seq_045
        Refs: prompt/045.md, docs/architecture/41_repository_topology_rules.md
        ```

        ```text
        release(release-controls)!: tighten live mutation evidence gate

        Task: seq_061
        Refs: prompt/061.md, docs/architecture/15_verification_ladder_and_quality_gate_strategy.md
        Risk: release-control and trust-posture enforcement changed
        Validation: pnpm check; pnpm verify:release
        ```
        """
    ).strip()


def build_pr_hygiene() -> str:
    risk_rows = "\n".join(
        [
            "| Route intent or command acceptance | `services/command-api`, `packages/api-contracts`, route binding changes | Named reviewer plus browser and contract evidence |",
            "| Release controls, parity, or watch posture | `packages/release-controls`, `services/api-gateway`, deploy or runbook changes | Release evidence, parity proof, and rollback posture |",
            "| Trust posture, authz, or secret handling | `packages/authz-policy`, auth edge, redaction logic | Security review plus redaction proof |",
            "| Boundary contract or topology drift | package exports, import rules, CODEOWNERS, topology manifest | Architecture review plus validator proof |",
            "| Data or contract migration | migration scripts, schemas, compatibility windows | Migration plan, dry run, recovery plan, and explicit validation |",
        ]
    )
    return dedent(
        f"""
        # 45 PR Review And Release Hygiene

        Pull requests are the review surface where Vecells turns branch and commit signal into release-safe decisions.

        ## PR Size And Shape

        - Prefer one task-scoped concern per PR.
        - Keep behavior, generators, and docs together only when they represent one coherent task.
        - If a PR is large because codegen emitted many deterministic files, call that out explicitly in the summary.

        ## Required PR Contents

        - Task id and prompt link
        - Architecture refs touched
        - Exact validation commands run
        - Browser evidence when the work is browser-visible
        - Risk callout when route intent, release controls, trust posture, migrations, or boundary contracts move

        ## Review Checklist

        - Architecture: does the change preserve topology, ownership, and public contract seams?
        - Security: are secrets, tokens, provider identifiers, and logs still redacted and bounded?
        - Accessibility: does keyboard, focus, semantic structure, and reduced motion still hold?
        - Performance: did the change widen payloads, retries, render cost, or hot paths?
        - Testing: did the author run `pnpm check`, and if browser-visible work changed, `pnpm test:e2e`?

        ## Special Review Triggers

        | Trigger | Typical paths | Extra evidence |
        | --- | --- | --- |
        {risk_rows}

        ## Browser-Visible Work

        - UI work needs Playwright evidence attached in the PR body.
        - If a diagram, cockpit, atlas, or gallery changed, parity tables and reduced-motion posture need to be checked as part of review.

        ## Release And Migration Hygiene

        - Risky changes must be visibly marked in commit type, PR summary, and reviewer checklist.
        - Do not merge release-risk or migration work without a validation note that names the commands run and the rollback or fallback posture.
        - Changes that alter route intent, publication parity, trust posture, or live mutation controls must never hide inside “refactor” language.
        """
    ).strip()


def build_editorconfig() -> str:
    return dedent(
        """
        root = true

        [*]
        charset = utf-8
        end_of_line = lf
        indent_style = space
        indent_size = 2
        insert_final_newline = true
        trim_trailing_whitespace = true

        [*.py]
        indent_size = 4

        [*.md]
        trim_trailing_whitespace = false
        """
    ).strip()


def build_gitattributes() -> str:
    return dedent(
        """
        * text=auto eol=lf

        *.png binary
        *.jpg binary
        *.jpeg binary
        *.gif binary
        *.ico binary
        *.pdf binary
        *.zip binary
        *.woff2 binary

        *.svg text eol=lf
        *.sh text eol=lf
        *.md text eol=lf
        *.yml text eol=lf
        *.yaml text eol=lf
        """
    ).strip()


def build_prettier_config() -> str:
    return dedent(
        """
        export default {
          printWidth: 100,
          semi: true,
          singleQuote: false,
          trailingComma: "all",
          tabWidth: 2,
          useTabs: false,
        };
        """
    ).strip()


def build_prettier_ignore() -> str:
    return dedent(
        """
        node_modules
        dist
        coverage
        .nx
        .playwright
        .playwright-cli
        apps/mock-*
        services/mock-*
        blueprint
        data/analysis
        docs/analysis
        docs/architecture
        docs/external
        infra
        output
        pnpm-lock.yaml
        prompt
        reference prompt.zip
        """
    ).strip()


def build_eslint_config() -> str:
    return dedent(
        """
        import js from "@eslint/js";
        import globals from "globals";
        import tsPlugin from "@typescript-eslint/eslint-plugin";
        import tsParser from "@typescript-eslint/parser";

        const browserNodeGlobals = {
          ...globals.browser,
          ...globals.node,
        };

        const deepImportPatterns = [
          {
            group: [
              "@vecells/*/src/*",
              "@vecells/*/internal/*",
              "@vecells/*/workers/*",
              "@vecells/*/repositories/*",
            ],
            message: "Import only published workspace entrypoints.",
          },
        ];

        const servicePackages = [
          "@vecells/api-gateway",
          "@vecells/command-api",
          "@vecells/projection-worker",
          "@vecells/notification-worker",
          "@vecells/adapter-simulators",
        ];

        const appRestrictedPatterns = [
          ...deepImportPatterns,
          {
            group: ["@vecells/domain-*"],
            message: "Apps consume published contracts and shared packages, not domain packages.",
          },
          {
            group: servicePackages,
            message: "Apps do not import service implementations directly.",
          },
        ];

const domainRestrictedPatterns = [
  ...deepImportPatterns,
  {
    group: ["@vecells/domain-*", "!@vecells/domain-kernel"],
    message: "Domain packages may not import sibling domain packages.",
  },
  {
    group: ["@vecells/design-system", ...servicePackages],
            message: "Domain packages stay runtime-agnostic and UI-agnostic.",
          },
        ];

        const gatewayRestrictedPatterns = [
          ...deepImportPatterns,
          {
            group: ["@vecells/domain-*"],
            message: "The gateway publishes contracts and policy; it does not import domain packages directly.",
          },
        ];

        export default [
          {
            ignores: [
              "**/dist/**",
              "**/coverage/**",
              "**/node_modules/**",
              "**/.playwright/**",
              "**/.playwright-cli/**",
            ],
            linterOptions: {
              reportUnusedDisableDirectives: "error",
            },
          },
          js.configs.recommended,
          {
            files: ["**/*.{ts,tsx,js,mjs,cjs}"],
            languageOptions: {
              parser: tsParser,
              parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: { jsx: true },
              },
              globals: browserNodeGlobals,
            },
            plugins: {
              "@typescript-eslint": tsPlugin,
            },
            rules: {
              ...tsPlugin.configs.recommended.rules,
              "no-console": "off",
              "@typescript-eslint/no-unused-vars": [
                "error",
                {
                  argsIgnorePattern: "^_",
                  varsIgnorePattern: "^_",
                },
              ],
              "no-restricted-imports": ["error", { patterns: deepImportPatterns }],
            },
          },
          {
            files: ["apps/**/*.{ts,tsx,js,mjs,cjs}"],
            rules: {
              "no-restricted-imports": ["error", { patterns: appRestrictedPatterns }],
            },
          },
          {
            files: ["services/api-gateway/**/*.{ts,tsx,js,mjs,cjs}"],
            rules: {
              "no-restricted-imports": ["error", { patterns: gatewayRestrictedPatterns }],
            },
          },
          {
            files: ["packages/domains/**/*.{ts,tsx,js,mjs,cjs}"],
            rules: {
              "no-restricted-imports": ["error", { patterns: domainRestrictedPatterns }],
            },
          },
        ];
        """
    ).strip()


def build_dev_bootstrap() -> str:
    return dedent(
        """
        import { execFileSync } from "node:child_process";
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
        const envExample = path.join(root, ".env.example");
        const hooksPath = ".githooks";

        function installHooks() {
          if (!fs.existsSync(path.join(root, ".git"))) {
            console.log("[dev-bootstrap] no .git directory found, skipping hook installation");
            return;
          }
          execFileSync("git", ["config", "core.hooksPath", hooksPath], { cwd: root, stdio: "ignore" });
          console.log(`[dev-bootstrap] installed git hooks via core.hooksPath=${hooksPath}`);
        }

        const text = fs.readFileSync(envExample, "utf8");
        const expectedKeys = text
          .split("\\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"))
          .map((line) => line.split("=")[0]);

        const missing = expectedKeys.filter((key) => !(key in process.env));
        console.log("[dev-bootstrap] Vecells Phase 0 foundation scaffold");
        console.log(`[dev-bootstrap] expected env keys: ${expectedKeys.length}`);
        console.log(`[dev-bootstrap] missing from current shell: ${missing.length}`);
        if (missing.length > 0) {
          console.log("[dev-bootstrap] continuing with placeholder defaults because the repo still scaffolds local foundations.");
        }
        installHooks();
        console.log("[dev-bootstrap] canonical validation loop: pnpm codegen && pnpm check && pnpm test:e2e");
        """
    ).strip()


def build_dev_bootstrap_readme() -> str:
    return dedent(
        """
        # Dev Bootstrap

        The bootstrap helper prepares a local contributor checkout without pretending to be a production orchestrator.

        Current scope:
        - read `.env.example`
        - list expected keys
        - report which values are missing from the current shell
        - install `.githooks` via `git config core.hooksPath .githooks`
        - print the canonical local validation loop
        """
    ).strip()


def build_branch_validator() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import process from "node:process";
        import { execFileSync } from "node:child_process";
        import { fileURLToPath } from "node:url";

        const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
        const policy = JSON.parse(
          fs.readFileSync(path.join(root, "tools", "git-hooks", "engineering-standards-policy.json"), "utf8"),
        );

        function currentBranch() {
          return execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
        }

        function branchFromArgs() {
          const explicit = process.argv[2];
          if (explicit && explicit !== "--current") {
            return explicit.trim();
          }
          return currentBranch();
        }

        const branch = branchFromArgs();
        if (!branch) {
          console.error("[branch-check] detached HEAD is not allowed for contributor work");
          process.exit(1);
        }

        const allowed = policy.branch_policy.allowed_patterns.some((pattern) => new RegExp(pattern).test(branch));
        if (!allowed) {
          console.error(`[branch-check] branch '${branch}' does not match the Vecells policy`);
          console.error(`[branch-check] allowed examples: ${policy.branch_policy.examples.join(", ")}`);
          process.exit(1);
        }

        console.log(`[branch-check] branch '${branch}' passed`);
        """
    ).strip()


def build_commit_validator() -> str:
    commit_types_literal = json.dumps(COMMIT_TYPES, indent=2)
    risky_types_literal = json.dumps(RISKY_TYPES, indent=2)
    return dedent(
        f"""
        import fs from "node:fs";
        import path from "node:path";
        import process from "node:process";
        import {{ fileURLToPath }} from "node:url";

        const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
        const policy = JSON.parse(
          fs.readFileSync(path.join(root, "tools", "git-hooks", "engineering-standards-policy.json"), "utf8"),
        );

        const allowedTypes = new Set({commit_types_literal});
        const riskyTypes = new Set({risky_types_literal});
        const headerPattern = new RegExp(policy.commit_policy.header_pattern);

        function readMessage() {{
          const messagePath = process.argv[2];
          if (messagePath) {{
            return fs.readFileSync(path.resolve(messagePath), "utf8");
          }}
          return fs.readFileSync(0, "utf8");
        }}

        function footerMap(message) {{
          const map = new Map();
          for (const rawLine of message.split("\\n")) {{
            const line = rawLine.trim();
            if (!line || line.startsWith("#")) {{
              continue;
            }}
            const match = line.match(/^([A-Za-z-]+):\\s*(.+)$/);
            if (match) {{
              map.set(match[1], match[2]);
            }}
          }}
          return map;
        }}

        const message = readMessage();
        const lines = message
          .split("\\n")
          .map((line) => line.trimEnd())
          .filter((line) => line.trim() && !line.startsWith("#"));

        if (lines.length === 0) {{
          console.error("[commit-check] commit message is empty");
          process.exit(1);
        }}

        const header = lines[0];
        if (!headerPattern.test(header)) {{
          console.error("[commit-check] header does not match the Vecells taxonomy");
          process.exit(1);
        }}

        const typeMatch = header.match(/^(?<type>[a-z]+)/);
        const commitType = typeMatch?.groups?.type ?? "";
        if (!allowedTypes.has(commitType)) {{
          console.error(`[commit-check] type '${{commitType}}' is not allowed`);
          process.exit(1);
        }}

        const footers = footerMap(message);
        for (const footer of policy.commit_policy.required_footers) {{
          if (!footers.has(footer)) {{
            console.error(`[commit-check] missing required footer: ${{footer}}`);
            process.exit(1);
          }}
        }}

        const taskFooter = footers.get("Task") ?? "";
        if (!/(seq|par)_[0-9]{{3}}[a-z0-9_]*/.test(taskFooter)) {{
          console.error("[commit-check] Task footer must include a seq_ or par_ identifier");
          process.exit(1);
        }}

        const refsFooter = footers.get("Refs") ?? "";
        if (!refsFooter.includes(".md")) {{
          console.error("[commit-check] Refs footer must include one or more markdown refs");
          process.exit(1);
        }}

        if (riskyTypes.has(commitType) || header.includes("!")) {{
          for (const footer of policy.commit_policy.risky_footers) {{
            if (!footers.has(footer)) {{
              console.error(`[commit-check] missing risky-change footer: ${{footer}}`);
              process.exit(1);
            }}
          }}
        }}

        console.log(`[commit-check] commit header '${{header}}' passed`);
        """
    ).strip()


def build_commit_msg_hook() -> str:
    return dedent(
        """
        #!/bin/sh
        set -eu

        message_file="$1"
        case "$message_file" in
          /*) ;;
          *) message_file="$(pwd)/$message_file" ;;
        esac

        repo_root="$(git rev-parse --show-toplevel)"
        cd "$repo_root"

        node ./tools/git-hooks/validate-commit-message.mjs "$message_file"
        """
    ).strip()


def build_pre_push_hook() -> str:
    return dedent(
        """
        #!/bin/sh
        set -eu

        repo_root="$(git rev-parse --show-toplevel)"
        cd "$repo_root"

        node ./tools/git-hooks/validate-branch-name.mjs --current
        pnpm check
        """
    ).strip()


def build_codeowners(topology: dict[str, Any]) -> str:
    lines = [
        "# Generated by tools/analysis/build_engineering_standards.py",
        "# Canonical topology owners",
    ]
    for pattern, handle in canonical_topology_entries(topology):
        lines.append(f"{pattern} {handle}")
    lines.extend(["", "# Legacy and repo-control paths"])
    for pattern, handle in LEGACY_CODEOWNERS + ROOT_CODEOWNERS:
        lines.append(f"{pattern} {handle}")
    return "\n".join(lines)


def build_pr_template() -> str:
    return dedent(
        """
        ## Summary

        - Task:
        - Prompt:
        - Architecture refs:

        ## Change Type

        - [ ] arch
        - [ ] scaffold
        - [ ] feat
        - [ ] fix
        - [ ] test
        - [ ] docs
        - [ ] security
        - [ ] release
        - [ ] migration

        ## Validation

        - [ ] `pnpm check`
        - [ ] `pnpm test:e2e` when browser-visible work changed
        - [ ] Additional task-specific validation noted below

        Commands run:

        ```text
        pnpm check
        ```

        ## Review Focus

        - [ ] Boundary ownership and public entrypoints stayed intact
        - [ ] Security, redaction, and secret handling were reviewed
        - [ ] Accessibility and reduced-motion behavior were reviewed
        - [ ] Performance or retry posture changes were reviewed

        ## Risk Triggers

        - [ ] Route intent or command acceptance changed
        - [ ] Release controls, parity, or watch posture changed
        - [ ] Trust posture, authz, or secret handling changed
        - [ ] Boundary contracts or topology changed
        - [ ] Data or contract migration changed

        Risk / rollback notes:

        ## Browser Evidence

        - Screenshots, traces, or Playwright notes:
        - Stable `data-testid` markers confirmed:
        """
    ).strip()


def sync_root_package_json() -> None:
    package_json = read_json(ROOT_PACKAGE_PATH)
    scripts = package_json.setdefault("scripts", {})
    scripts.update(ROOT_SCRIPT_UPDATES)
    dev_dependencies = package_json.setdefault("devDependencies", {})
    dev_dependencies["prettier"] = PRETTIER_VERSION
    write_json(ROOT_PACKAGE_PATH, package_json)


def main() -> None:
    topology = load_topology()
    policy = build_policy(topology)

    sync_root_package_json()
    write_text(CONTRIBUTING_PATH, build_contributing(topology))
    write_text(CODING_STANDARDS_PATH, build_coding_standards(topology))
    write_text(BRANCHING_PATH, build_branching_strategy())
    write_text(COMMIT_PATH, build_commit_conventions())
    write_text(PR_HYGIENE_PATH, build_pr_hygiene())
    write_text(EDITORCONFIG_PATH, build_editorconfig())
    write_text(GITATTRIBUTES_PATH, build_gitattributes())
    write_text(PRETTIER_CONFIG_PATH, build_prettier_config())
    write_text(PRETTIER_IGNORE_PATH, build_prettier_ignore())
    write_json(POLICY_PATH, policy)
    write_text(BRANCH_VALIDATOR_PATH, build_branch_validator())
    write_text(COMMIT_VALIDATOR_PATH, build_commit_validator())
    write_text(COMMIT_MSG_HOOK_PATH, build_commit_msg_hook())
    write_text(PRE_PUSH_HOOK_PATH, build_pre_push_hook())
    write_text(CODEOWNERS_PATH, build_codeowners(topology))
    write_text(PR_TEMPLATE_PATH, build_pr_template())
    write_text(ESLINT_PATH, build_eslint_config())
    write_text(DEV_BOOTSTRAP_PATH, build_dev_bootstrap())
    write_text(DEV_BOOTSTRAP_README_PATH, build_dev_bootstrap_readme())
    print("seq_045 engineering standards generated")


if __name__ == "__main__":
    main()
