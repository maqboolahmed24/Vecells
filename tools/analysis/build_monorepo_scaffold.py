#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools"
TOPOLOGY_PATH = DATA_DIR / "repo_topology_manifest.json"

TASK_ID = "seq_042"
VISUAL_MODE = "Foundations_Gallery"
CAPTURED_ON = "2026-04-11"
GENERATED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds")
MISSION = (
    "Scaffold the canonical Vecells Phase 0 monorepo with pnpm plus Nx, buildable placeholder "
    "apps, service skeletons, shared packages, and a foundation gallery that makes shell ownership "
    "visible from day one."
)

OUTPUT_MANIFEST_PATH = DATA_DIR / "monorepo_scaffold_manifest.json"
PLAN_PATH = DOCS_DIR / "42_monorepo_scaffold_plan.md"
GALLERY_PATH = DOCS_DIR / "42_foundation_shell_gallery.html"
VALIDATOR_PATH = TOOLS_DIR / "analysis" / "validate_monorepo_scaffold.py"
PLAYWRIGHT_SPEC_PATH = TESTS_DIR / "foundation-shell-gallery.spec.js"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PNPM_WORKSPACE_PATH = ROOT / "pnpm-workspace.yaml"
NX_PATH = ROOT / "nx.json"
ROOT_TSCONFIG_PATH = ROOT / "tsconfig.base.json"
ESLINT_PATH = ROOT / "eslint.config.mjs"
VITEST_WORKSPACE_PATH = ROOT / "vitest.workspace.ts"
ENV_EXAMPLE_PATH = ROOT / ".env.example"
DEV_BOOTSTRAP_PATH = TOOLS_DIR / "dev-bootstrap" / "index.mjs"
DEV_BOOTSTRAP_README_PATH = TOOLS_DIR / "dev-bootstrap" / "README.md"

ROOT_DEV_DEPENDENCIES = {
    "@eslint/js": "10.0.1",
    "@types/node": "25.6.0",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "@typescript-eslint/eslint-plugin": "8.58.1",
    "@typescript-eslint/parser": "8.58.1",
    "@vitejs/plugin-react": "6.0.1",
    "eslint": "10.2.0",
    "globals": "17.4.0",
    "nx": "22.6.5",
    "playwright": "1.59.1",
    "prettier": "3.6.2",
    "tsx": "4.21.0",
    "typescript": "6.0.2",
    "vite": "8.0.8",
    "vitest": "4.1.4",
}

REACT_VERSION = "19.2.5"
REACT_DOM_VERSION = "19.2.5"

APP_PORTS = {
    "patient-web": {"dev": 4300, "preview": 4400},
    "clinical-workspace": {"dev": 4301, "preview": 4401},
    "ops-console": {"dev": 4302, "preview": 4402},
    "hub-desk": {"dev": 4303, "preview": 4403},
    "pharmacy-console": {"dev": 4304, "preview": 4404},
    "support-workspace": {"dev": 4305, "preview": 4405},
    "governance-console": {"dev": 4306, "preview": 4406},
}

SERVICE_PORTS = {
    "api-gateway": 7100,
    "command-api": 7101,
    "projection-worker": 7102,
    "notification-worker": 7103,
    "adapter-simulators": 7104,
}

WORKSPACE_ENABLED_SPECIALS = {"tool_playwright", "tool_assistive_control_lab"}
NON_WORKSPACE_SPECIALS = {"docs_architecture", "tool_analysis", "tool_architecture"}

SHELLS: dict[str, dict[str, Any]] = {
    "patient-web": {
        "slug": "patient-web",
        "displayName": "Patient Web",
        "namespace": "patient-web",
        "layout": "patient",
        "accentPrimary": "#2F5BFF",
        "accentSecondary": "#0EA5A4",
        "masthead": "Quiet lineage shell",
        "eyebrow": "Patient continuity family",
        "title": "Quiet entry, clear next step, no implied truth.",
        "description": "Premium calm-entry placeholder that proves continuity, spotlight posture, and route ownership without pretending to own lifecycle authority.",
        "chips": ["calm-entry", "continuity-key", "automation-ready"],
        "metrics": [
            {"label": "Continuity ribbon", "value": "Claim -> Resume", "detail": "Secure-link and embedded parity stay visible."},
            {"label": "Next step card", "value": "1 active route", "detail": "Only one obvious patient action is promoted."},
            {"label": "Publication posture", "value": "Derived watch", "detail": "Derived entry routes remain explicit watch items."},
        ],
        "cards": [
            {"kicker": "Lineage", "title": "Claim and continuity stay visible", "body": "The shell keeps claim origin, secure-link recovery, and embedded reuse in one exact ribbon.", "footnote": "No patient shell card claims write ownership."},
            {"kicker": "Spotlight", "title": "Next-step card stays singular", "body": "One promoted task keeps the journey quiet while the route family inventory remains inspectable.", "footnote": "Primary controls stay 44px or larger."},
            {"kicker": "Calm proof", "title": "Continuity diagram never hides parity", "body": "Every visual cue has a parity list so support and audit can read it without relying on the diagram.", "footnote": "Reduced motion falls back to still panels."},
        ],
        "visualTitle": "Continuity diagram",
        "visualRows": [
            {"label": "Claim", "value": "secure-link recovery", "detail": "Entry origin remains attached to the shell."},
            {"label": "Resume", "value": "patient home", "detail": "Home inherits the same continuity key."},
            {"label": "Settle", "value": "appointments or record", "detail": "Destination routes stay explicit and inspectable."},
        ],
        "railTitle": "Shell proofs",
        "railItems": [
            {"title": "Landmark", "detail": "patient-web-shell-root"},
            {"title": "Automation", "detail": "patient-web::hero, patient-web::parity"},
            {"title": "Release", "detail": "Ring alpha with publication watch"},
        ],
        "parityHeaders": ["Patient cue", "Contract posture", "Why visible"],
        "parityRows": [
            ["Claim ribbon", "Route-family proof", "Entry lineage must survive shell transitions."],
            ["Next-step card", "Surface contract", "One promoted action prevents navigation drift."],
            ["Continuity diagram", "Parity table", "Visuals never become the only source of meaning."],
        ],
    },
    "clinical-workspace": {
        "slug": "clinical-workspace",
        "displayName": "Clinical Workspace",
        "namespace": "clinical-workspace",
        "layout": "clinical",
        "accentPrimary": "#4F46E5",
        "accentSecondary": "#0F172A",
        "masthead": "Queue-left decision dock",
        "eyebrow": "Triage workspace family",
        "title": "Queue on the left, decision dock on the right, settlement never buried.",
        "description": "Operational workspace placeholder that keeps review, decision, and settlement explicit while leaving live command truth to later service tasks.",
        "chips": ["queue-first", "decision-dock", "human-checkpoint"],
        "metrics": [
            {"label": "Review lane", "value": "3 visible stops", "detail": "Review, decide, settle stay pinned."},
            {"label": "Checkpoint", "value": "manual hold", "detail": "A human checkpoint remains first-class."},
            {"label": "Assistive seam", "value": "sidecar-ready", "detail": "Assistive residency is explicit, not implied."},
        ],
        "cards": [
            {"kicker": "Queue", "title": "Queue rail keeps provenance tight", "body": "Each row keeps intake origin, safety posture, and current reviewer before any action is suggested.", "footnote": "Arrow keys move through the queue with no hidden focus."},
            {"kicker": "Decision dock", "title": "Decision context is anchored", "body": "The right dock holds evidence, manual checkpoint state, and settlement posture in one place.", "footnote": "Dock panels stay readable at tablet and mobile widths."},
            {"kicker": "Settlement", "title": "Review -> decision -> settlement lane", "body": "The lane diagram remains adjacent to a parity list so automation and accessibility can inspect each stop.", "footnote": "No lane implies automatic write execution."},
        ],
        "visualTitle": "Lane diagram",
        "visualRows": [
            {"label": "Review", "value": "triage context", "detail": "Intake provenance and safety notes remain visible."},
            {"label": "Decision", "value": "manual checkpoint", "detail": "A named reviewer confirms before mutation."},
            {"label": "Settlement", "value": "command handoff", "detail": "Only downstream services own actual command writes."},
        ],
        "railTitle": "Decision rail",
        "railItems": [
            {"title": "Root marker", "detail": "clinical-workspace-shell-root"},
            {"title": "Focus law", "detail": "Queue rows stay keyboard-first"},
            {"title": "Assistive posture", "detail": "Conditional sidecar, never default truth"},
        ],
        "parityHeaders": ["Workspace stop", "Bounded owner", "Operator reason"],
        "parityRows": [
            ["Review", "triage_workspace", "Review context must remain inspectable before any decision."],
            ["Decision", "identity_access + authz policy", "Approval state stays explicit and attributable."],
            ["Settlement", "command-api later task", "The shell surfaces status without claiming command truth."],
        ],
    },
    "ops-console": {
        "slug": "ops-console",
        "displayName": "Ops Console",
        "namespace": "ops-console",
        "layout": "ops",
        "accentPrimary": "#0F9D58",
        "accentSecondary": "#111827",
        "masthead": "Telemetry horizon",
        "eyebrow": "Operations family",
        "title": "A telemetry strip, a compact heat map, and table parity beside every signal.",
        "description": "Operations placeholder shell that foregrounds fleet posture, intervention thresholds, and parity tables while staying visually restrained.",
        "chips": ["telemetry-horizon", "heatmap", "parity-first"],
        "metrics": [
            {"label": "Active watch tuples", "value": "4", "detail": "Only the highest-signal tuples surface in the strip."},
            {"label": "Intervention posture", "value": "guarded", "detail": "Actions remain behind explicit release controls."},
            {"label": "Heat map cells", "value": "6", "detail": "Every cell has a table peer."},
        ],
        "cards": [
            {"kicker": "Strip", "title": "KPI strip favors legibility", "body": "Short values, quiet contrast, and exact labels keep the console readable under pressure.", "footnote": "No gradient-heavy dashboard chrome."},
            {"kicker": "Heat map", "title": "Compact heat map holds table parity", "body": "The visual matrix is restrained and every cell resolves to a plain-language row below it.", "footnote": "Hot spots never exist without literal labels."},
            {"kicker": "Escalation", "title": "Intervention gates stay explicit", "body": "Operators can see where release control or evidence freshness would block a live move.", "footnote": "No implied admin override exists in the placeholder."},
        ],
        "visualTitle": "Telemetry heat map",
        "visualRows": [
            {"label": "Patient home", "value": "steady", "detail": "Continuity and publication remain within tolerance."},
            {"label": "Clinical queue", "value": "watch", "detail": "Manual checkpoint backlog is above nominal."},
            {"label": "Notifications", "value": "guarded", "detail": "Retry matrix is healthy but constrained."},
        ],
        "railTitle": "Ops evidence",
        "railItems": [
            {"title": "Root marker", "detail": "ops-console-shell-root"},
            {"title": "Heat map parity", "detail": "table rows mirror matrix cells"},
            {"title": "Release gate", "detail": "interventions remain ring-scoped"},
        ],
        "parityHeaders": ["Signal", "Console meaning", "Action posture"],
        "parityRows": [
            ["Patient home", "Continuity steady", "Observe only."],
            ["Clinical queue", "Checkpoint backlog", "Escalate with reviewer context."],
            ["Notifications", "Retry healthy", "Watch provider rail before intervention."],
        ],
    },
    "hub-desk": {
        "slug": "hub-desk",
        "displayName": "Hub Desk",
        "namespace": "hub-desk",
        "layout": "hub",
        "accentPrimary": "#3559E6",
        "accentSecondary": "#7C3AED",
        "masthead": "Coordination lane",
        "eyebrow": "Hub coordination family",
        "title": "A coordination lane with alternatives kept side by side instead of hidden in menus.",
        "description": "Hub placeholder shell that makes cross-site coordination, alternatives, and acknowledgement posture explicit inside one controlled workspace.",
        "chips": ["coordination-lane", "alternative-compare", "acknowledgement"],
        "metrics": [
            {"label": "Coordination lane", "value": "4 active stops", "detail": "Case, alternative, acknowledgement, settle."},
            {"label": "Alternative strip", "value": "2 compared", "detail": "Primary and fallback remain side by side."},
            {"label": "Evidence posture", "value": "explicit", "detail": "No route implies confirmation without proof."},
        ],
        "cards": [
            {"kicker": "Case lane", "title": "Case state stays linear", "body": "The lane keeps origin, alternative, acknowledgement, and settlement aligned for the operator.", "footnote": "Comparison never displaces the main case."},
            {"kicker": "Alternatives", "title": "Comparison strip stays visible", "body": "Primary and fallback sites are compared in a narrow strip so tradeoffs are obvious.", "footnote": "No hidden tab owns the fallback story."},
            {"kicker": "Acknowledge", "title": "Acknowledgement posture remains named", "body": "The shell keeps who accepted, what changed, and which contract moved next.", "footnote": "Acknowledgement is not inferred from page exit."},
        ],
        "visualTitle": "Coordination lane",
        "visualRows": [
            {"label": "Case", "value": "hub intake", "detail": "Inbound context and route family stay pinned."},
            {"label": "Alternative", "value": "comparison strip", "detail": "Fallback sites appear beside the primary option."},
            {"label": "Acknowledge", "value": "named receiver", "detail": "Acknowledgement proof stays attributable."},
        ],
        "railTitle": "Coordination proofs",
        "railItems": [
            {"title": "Root marker", "detail": "hub-desk-shell-root"},
            {"title": "Alternative view", "detail": "comparison strip is always on-page"},
            {"title": "Settlement", "detail": "handoff remains explicit"},
        ],
        "parityHeaders": ["Coordination point", "Contract posture", "Why it matters"],
        "parityRows": [
            ["Case", "Hub route family", "Operators keep one stable context anchor."],
            ["Alternative", "Fallback comparison", "Alternatives stay visible and auditable."],
            ["Acknowledge", "Named proof", "Receipt posture survives downstream handoff."],
        ],
    },
    "pharmacy-console": {
        "slug": "pharmacy-console",
        "displayName": "Pharmacy Console",
        "namespace": "pharmacy-console",
        "layout": "pharmacy",
        "accentPrimary": "#147D64",
        "accentSecondary": "#C98900",
        "masthead": "Validation board",
        "eyebrow": "Pharmacy family",
        "title": "Validation cards, consent and proof chips, and provider choice kept in one exact rail.",
        "description": "Pharmacy placeholder shell that favors validation clarity over decorative dashboard treatment and keeps provider-choice evidence explicit.",
        "chips": ["validation-board", "consent-proof", "provider-choice"],
        "metrics": [
            {"label": "Validation cards", "value": "3 pinned", "detail": "Consent, proof, dispatch readiness."},
            {"label": "Provider rail", "value": "2 options", "detail": "Primary and alternative supplier stay visible."},
            {"label": "Proof chips", "value": "28px", "detail": "Compact chips stay readable without crowding."},
        ],
        "cards": [
            {"kicker": "Consent", "title": "Consent and proof sit together", "body": "Validation cards hold consent posture and proof freshness in one exact frame.", "footnote": "Proof never drifts behind a hidden modal."},
            {"kicker": "Provider choice", "title": "Choice rail stays narrow and explicit", "body": "Provider candidates remain visible so dispatch choices can be compared without losing context.", "footnote": "Choice does not imply dispatch authority."},
            {"kicker": "Dispatch", "title": "Dispatch readiness remains stated, not assumed", "body": "The placeholder shows validation status while real dispatch truth waits for later service work.", "footnote": "Live provider actions remain gated elsewhere."},
        ],
        "visualTitle": "Validation board",
        "visualRows": [
            {"label": "Consent", "value": "confirmed", "detail": "Named approval is present and current."},
            {"label": "Proof", "value": "fresh evidence", "detail": "Evidence freshness is explicit before provider moves."},
            {"label": "Choice", "value": "provider rail", "detail": "Primary and fallback providers remain visible."},
        ],
        "railTitle": "Provider rail",
        "railItems": [
            {"title": "Root marker", "detail": "pharmacy-console-shell-root"},
            {"title": "Consent chip", "detail": "28px compact proof chip"},
            {"title": "Choice rail", "detail": "provider alternatives remain visible"},
        ],
        "parityHeaders": ["Pharmacy signal", "Validation meaning", "Operator reading"],
        "parityRows": [
            ["Consent", "Named approval", "A dispatch move cannot proceed without it."],
            ["Proof", "Evidence freshness", "The shell keeps freshness visible beside choice."],
            ["Choice", "Provider comparison", "Operators can compare primary and fallback without context loss."],
        ],
    },
    "support-workspace": {
        "slug": "support-workspace",
        "displayName": "Support Workspace",
        "namespace": "support-workspace",
        "layout": "support",
        "accentPrimary": "#334155",
        "accentSecondary": "#94A3B8",
        "masthead": "Replay timeline",
        "eyebrow": "Support family",
        "title": "Ticket timeline, masked subject card, and replay return strip in one durable shell.",
        "description": "Support placeholder shell that keeps replay posture and masked subject details visible without overloading the operator with dashboard noise.",
        "chips": ["ticket-timeline", "masked-subject", "replay-return"],
        "metrics": [
            {"label": "Replay steps", "value": "3 visible", "detail": "Open, observe, return remain linear."},
            {"label": "Masked card", "value": "subject-safe", "detail": "Masked identity stays clear without overexposure."},
            {"label": "Assist posture", "value": "human-led", "detail": "Support moves stay attributable."},
        ],
        "cards": [
            {"kicker": "Timeline", "title": "Ticket history stays linear", "body": "The timeline keeps ticket origin, current state, and last replay point visible in one column.", "footnote": "No hidden accordion owns the replay story."},
            {"kicker": "Masked subject", "title": "Subject card is restrained and safe", "body": "The subject panel shows only the information a support operator needs at this stage.", "footnote": "Masking remains visible rather than assumed."},
            {"kicker": "Return strip", "title": "Replay always has a return path", "body": "A narrow strip keeps the operator anchored to where they can safely return after observation.", "footnote": "Replay never becomes a dead end."},
        ],
        "visualTitle": "Replay timeline",
        "visualRows": [
            {"label": "Open", "value": "ticket origin", "detail": "Case family and masked subject remain adjacent."},
            {"label": "Observe", "value": "replay segment", "detail": "Replay context never hides the return target."},
            {"label": "Return", "value": "support action strip", "detail": "The operator always has a clear next safe action."},
        ],
        "railTitle": "Support proofs",
        "railItems": [
            {"title": "Root marker", "detail": "support-workspace-shell-root"},
            {"title": "Subject masking", "detail": "masked card stays on-page"},
            {"title": "Replay strip", "detail": "return route remains visible"},
        ],
        "parityHeaders": ["Support cue", "Plain-language parity", "Why visible"],
        "parityRows": [
            ["Open", "Ticket origin visible", "Operators keep case provenance while helping users."],
            ["Observe", "Replay target visible", "Observation never hides the next safe action."],
            ["Return", "Safe return strip", "Support work remains recoverable after replay."],
        ],
    },
    "governance-console": {
        "slug": "governance-console",
        "displayName": "Governance Console",
        "namespace": "governance-console",
        "layout": "governance",
        "accentPrimary": "#6E59D9",
        "accentSecondary": "#1F2937",
        "masthead": "Policy ledger",
        "eyebrow": "Governance family",
        "title": "Policy-ledger cards and a trust tuple strip that stays sober, legible, and exact.",
        "description": "Governance placeholder shell that foregrounds policy state, release freeze posture, and trust tuples without collapsing into admin clutter.",
        "chips": ["policy-ledger", "release-freeze", "trust-tuples"],
        "metrics": [
            {"label": "Ledger cards", "value": "4 visible", "detail": "Policy, release, access, and communication stay separated."},
            {"label": "Trust tuples", "value": "3 pinned", "detail": "Tuple evidence stays in a single strip."},
            {"label": "Freeze posture", "value": "explicit", "detail": "Release freeze never hides behind an icon."},
        ],
        "cards": [
            {"kicker": "Ledger", "title": "Policy cards keep control planes separated", "body": "Governance cards present release, access, messaging, and evidence posture without blending categories.", "footnote": "Each card stays legible at mobile widths."},
            {"kicker": "Freeze", "title": "Release freeze stays literal", "body": "The freeze strip states whether change is blocked, scoped, or being reviewed for promotion.", "footnote": "No ambiguous badge stands in for release law."},
            {"kicker": "Trust tuple", "title": "Tuple strip stays adjacent to parity", "body": "Trust tuples have a neighboring table so automation and reviewers can verify what each tuple means.", "footnote": "Tuple visuals never become the only explanation."},
        ],
        "visualTitle": "Trust tuple strip",
        "visualRows": [
            {"label": "Release", "value": "freeze scoped", "detail": "The scope of freeze is written, not implied."},
            {"label": "Access", "value": "review named", "detail": "Named reviewer remains part of the tuple."},
            {"label": "Evidence", "value": "trust published", "detail": "Evidence freshness and publication state stay visible."},
        ],
        "railTitle": "Governance proofs",
        "railItems": [
            {"title": "Root marker", "detail": "governance-console-shell-root"},
            {"title": "Tuple parity", "detail": "trust tuples mirrored in table form"},
            {"title": "Freeze strip", "detail": "release posture stays literal"},
        ],
        "parityHeaders": ["Governance tuple", "Policy meaning", "Why it stays visible"],
        "parityRows": [
            ["Release", "Freeze scope", "Promotion law cannot hide in decoration."],
            ["Access", "Named review", "Governance work remains attributable."],
            ["Evidence", "Published trust", "Audit posture depends on visible freshness."],
        ],
    },
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def repo_slug(repo_path: str) -> str:
    return Path(repo_path).name


def package_name_for_artifact(artifact: dict[str, Any]) -> str:
    repo_path = artifact["repo_path"]
    if repo_path.startswith("packages/domains/"):
        return f"@vecells/domain-{repo_slug(repo_path).replace('_', '-')}"
    if repo_path.startswith("packages/"):
        return f"@vecells/{repo_slug(repo_path)}"
    if repo_path.startswith("apps/"):
        return f"@vecells/{repo_slug(repo_path)}"
    if repo_path.startswith("services/"):
        return f"@vecells/{repo_slug(repo_path)}"
    if repo_path == "tests/playwright":
        return "@vecells/tests-playwright"
    if repo_path == "tools/assistive-control-lab":
        return "@vecells/assistive-control-lab"
    return f"@vecells/{repo_slug(repo_path)}"


def project_name_for_artifact(artifact: dict[str, Any]) -> str:
    return artifact["artifact_id"].replace("_", "-")


def ensure_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def legacy_noncanonical_paths(topology_paths: set[str]) -> list[str]:
    results: list[str] = []
    for parent in (ROOT / "apps", ROOT / "services"):
        if not parent.exists():
            continue
        for child in sorted(parent.iterdir()):
            if child.is_dir():
                repo_path = str(child.relative_to(ROOT))
                if repo_path not in topology_paths:
                    results.append(repo_path)
    return results


def workspace_enabled(artifact: dict[str, Any]) -> bool:
    return artifact["artifact_type"] in {"app", "service", "package"} or artifact["artifact_id"] in WORKSPACE_ENABLED_SPECIALS


def path_to_schema(path: Path) -> str:
    schema = ROOT / "node_modules" / "nx" / "schemas" / "project-schema.json"
    return os.path.relpath(schema, start=path.parent)


def root_marker_for_shell(shell_slug: str) -> str:
    return f"{shell_slug}-shell-root"


def build_root_package_json(dev_projects: list[str]) -> dict[str, Any]:
    scripts = {
        "build": "nx run-many -t build --all",
        "lint": "nx run-many -t lint --all",
        "typecheck": "nx run-many -t typecheck --all",
        "test": "nx run-many -t test --all",
        "dev": f"nx run-many -t dev --projects={','.join(dev_projects)} --parallel=12",
        "test:e2e": "nx run tool-playwright:e2e",
        "verify:release": "pnpm build && pnpm check && pnpm test:e2e",
        "validate:topology": "python3 ./tools/analysis/validate_repo_topology.py",
    }
    scripts.update(ROOT_SCRIPT_UPDATES)
    return {
        "name": "vecells-phase0-foundation",
        "private": True,
        "version": "0.0.0",
        "type": "module",
        "packageManager": "pnpm@10.23.0",
        "scripts": scripts,
        "devDependencies": ROOT_DEV_DEPENDENCIES,
    }


def build_pnpm_workspace(workspace_paths: list[str]) -> str:
    lines = ["packages:"]
    for path in workspace_paths:
        lines.append(f"  - {path}")
    return "\n".join(lines)


def build_nx_json() -> dict[str, Any]:
    return {
        "$schema": "./node_modules/nx/schemas/nx-schema.json",
        "defaultBase": "main",
        "namedInputs": {
            "default": ["{projectRoot}/**/*", "sharedGlobals"],
            "production": [
                "default",
                "!{projectRoot}/dist/**",
                "!{projectRoot}/coverage/**",
                "!{projectRoot}/README.md",
                "!{projectRoot}/**/*.spec.*",
                "!{projectRoot}/**/*.test.*",
            ],
            "sharedGlobals": [
                "{workspaceRoot}/package.json",
                "{workspaceRoot}/pnpm-workspace.yaml",
                "{workspaceRoot}/nx.json",
                "{workspaceRoot}/tsconfig.base.json",
                "{workspaceRoot}/eslint.config.mjs",
            ],
        },
        "targetDefaults": {
            "build": {"cache": True, "dependsOn": ["^build"], "inputs": ["production", "^production"]},
            "lint": {"cache": True, "inputs": ["default", "{workspaceRoot}/eslint.config.mjs"]},
            "typecheck": {"cache": True, "inputs": ["default", "^default"]},
            "test": {"cache": True, "inputs": ["default", "^default"]},
            "e2e": {"cache": False, "inputs": ["default", "^default"]},
            "dev": {"cache": False},
            "preview": {"cache": False},
        },
    }


def build_root_tsconfig(path_map: dict[str, list[str]]) -> dict[str, Any]:
    return {
        "compilerOptions": {
            "target": "ES2022",
            "module": "ESNext",
            "moduleResolution": "Bundler",
            "ignoreDeprecations": "6.0",
            "lib": ["ES2022", "DOM", "DOM.Iterable"],
            "jsx": "react-jsx",
            "strict": True,
            "noUncheckedIndexedAccess": True,
            "noImplicitOverride": True,
            "useDefineForClassFields": True,
            "resolveJsonModule": True,
            "allowSyntheticDefaultImports": True,
            "esModuleInterop": True,
            "skipLibCheck": True,
            "isolatedModules": True,
            "baseUrl": ".",
            "paths": path_map,
        }
    }


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

        export default [
          {
            ignores: [
              "**/dist/**",
              "**/coverage/**",
              "**/node_modules/**",
              "**/.playwright/**",
              "**/.playwright-cli/**",
            ],
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
            },
          },
        ];
        """
    ).strip()


def build_vitest_workspace() -> str:
    return dedent(
        """
        import { defineWorkspace } from "vitest/config";

        export default defineWorkspace([]);
        """
    ).strip()


def build_env_example(app_artifacts: list[dict[str, Any]], service_artifacts: list[dict[str, Any]]) -> str:
    lines = [
        "# Phase 0 foundation scaffold environment",
        "NODE_ENV=development",
        "VECELLS_ENVIRONMENT=local",
        "",
        "# App preview ports",
    ]
    for artifact in app_artifacts:
        slug = repo_slug(artifact["repo_path"])
        key = slug.replace("-", "_").upper()
        ports = APP_PORTS[slug]
        lines.append(f"{key}_DEV_PORT={ports['dev']}")
        lines.append(f"{key}_PREVIEW_PORT={ports['preview']}")
    lines.extend(["", "# Service ports"])
    for artifact in service_artifacts:
        slug = repo_slug(artifact["repo_path"])
        key = slug.replace("-", "_").upper()
        lines.append(f"{key}_PORT={SERVICE_PORTS[slug]}")
        lines.append(f"{key}_SERVICE_PORT={SERVICE_PORTS[slug]}")
        lines.append(f"{key}_ADMIN_PORT={SERVICE_PORTS[slug] + 100}")
    lines.extend(
        [
            "",
            "# Placeholder runtime posture",
            "ENABLE_ASSISTIVE_CONTROL_LAB=false",
            "RELEASE_RING=alpha",
            "OBSERVABILITY_SAMPLE_RATE=1.0",
        ]
    )
    return "\n".join(lines)


def build_dev_bootstrap() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import path from "node:path";

        const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
        const envExample = path.join(root, ".env.example");

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
          console.log("[dev-bootstrap] continuing with placeholder defaults because seq_042 only scaffolds local foundations.");
        }
        """
    ).strip()


def build_dev_bootstrap_readme() -> str:
    return dedent(
        """
        # Dev Bootstrap

        This lightweight Phase 0 bootstrap helper mirrors the `tools/dev-bootstrap` ownership law from task 012 without claiming full runtime orchestration yet.

        Current scope:
        - read `.env.example`
        - list expected keys
        - report which values are not present in the current shell
        - keep the scaffold bootstrap deterministic and non-destructive
        """
    ).strip()


def build_package_json(
    *,
    package_name: str,
    description: str,
    scripts: dict[str, str],
    dependencies: dict[str, str] | None = None,
    source_export: str | None = None,
    extra_exports: dict[str, str] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "name": package_name,
        "private": True,
        "version": "0.0.0",
        "type": "module",
        "description": description,
        "scripts": scripts,
    }
    if dependencies:
        payload["dependencies"] = dependencies
    if source_export:
        payload["exports"] = {".": source_export, **(extra_exports or {})}
        payload["types"] = source_export
    return payload


def build_project_json(
    *,
    artifact: dict[str, Any],
    project_type: str,
    source_root: str,
    has_dev: bool = False,
    has_preview: bool = False,
    has_e2e: bool = False,
) -> dict[str, Any]:
    targets = {
        "build": {"executor": "nx:run-commands", "options": {"command": "pnpm --dir {projectRoot} build"}},
        "lint": {"executor": "nx:run-commands", "options": {"command": "pnpm --dir {projectRoot} lint"}},
        "test": {"executor": "nx:run-commands", "options": {"command": "pnpm --dir {projectRoot} test"}},
        "typecheck": {"executor": "nx:run-commands", "options": {"command": "pnpm --dir {projectRoot} typecheck"}},
    }
    if has_dev:
        targets["dev"] = {"executor": "nx:run-commands", "options": {"command": "pnpm --dir {projectRoot} dev"}}
    if has_preview:
        targets["preview"] = {"executor": "nx:run-commands", "options": {"command": "pnpm --dir {projectRoot} preview"}}
    if has_e2e:
        targets["e2e"] = {"executor": "nx:run-commands", "options": {"command": "pnpm --dir {projectRoot} e2e"}}

    return {
        "$schema": path_to_schema(ROOT / artifact["repo_path"] / "project.json"),
        "name": project_name_for_artifact(artifact),
        "sourceRoot": source_root,
        "projectType": project_type,
        "tags": [
            f"artifact:{artifact['artifact_type']}",
            f"context:{artifact['owner_context_code']}",
            f"class:{artifact['artifact_class']}",
        ],
        "targets": targets,
    }


def build_workspace_readme(
    artifact: dict[str, Any],
    *,
    package_name: str,
    scripts: dict[str, str],
    extra: str = "",
) -> str:
    allowed = "\n".join(f"- `{item}`" for item in artifact["allowed_dependencies"]) or "- none"
    forbidden = "\n".join(f"- `{item}`" for item in artifact["forbidden_dependencies"]) or "- none"
    refs = "\n".join(f"- `{item}`" for item in ensure_list(artifact["source_refs"])) or "- none"
    script_lines = "\n".join(f"- `{name}`: `{command}`" for name, command in scripts.items())
    return dedent(
        f"""
        # {artifact['display_name']}

        - Package: `{package_name}`
        - Artifact id: `{artifact['artifact_id']}`
        - Repo path: `{artifact['repo_path']}`
        - Owner: `{artifact['owner_context_label']}` (`{artifact['owner_context_code']}`)
        - Topology status: `{artifact['topology_status']}`
        - Defect posture: `{artifact['defect_state']}`

        ## Ownership notes

        {artifact['notes']}

        ## Allowed dependencies

        {allowed}

        ## Forbidden dependencies

        {forbidden}

        ## Source refs

        {refs}

        ## Scripts

        {script_lines}
        {extra}
        """
    ).strip()


def build_tsconfig_app() -> dict[str, Any]:
    return {
        "extends": "../../tsconfig.base.json",
        "compilerOptions": {
            "types": ["vite/client"],
            "noEmit": True,
        },
        "include": ["src"],
    }


def build_tsconfig_library(repo_path: str) -> dict[str, Any]:
    depth = len(Path(repo_path).parts)
    prefix = "/".join(".." for _ in range(depth))
    return {
        "extends": f"{prefix}/tsconfig.base.json",
        "compilerOptions": {
            "rootDir": prefix,
            "outDir": "dist",
            "declaration": True,
            "declarationMap": True,
            "sourceMap": True,
            "types": ["node"],
        },
        "include": ["src"],
    }


def build_vite_config() -> str:
    return dedent(
        """
        import { defineConfig } from "vite";
        import react from "@vitejs/plugin-react";

        export default defineConfig({
          plugins: [react()],
          server: { host: "127.0.0.1" },
          preview: { host: "127.0.0.1" },
        });
        """
    ).strip()


def shell_contracts_from_topology(app_artifacts: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    payload: dict[str, dict[str, Any]] = {}
    for artifact in app_artifacts:
        slug = repo_slug(artifact["repo_path"])
        payload[slug] = {
            "shellSlug": slug,
            "artifactId": artifact["artifact_id"],
            "ownerContext": artifact["owner_context_code"],
            "routeFamilyIds": [row["route_family_id"] for row in artifact["route_families_owned"]],
            "gatewaySurfaceIds": [row["gateway_surface_id"] for row in artifact["gateway_surfaces_owned"]],
            "routeCount": len(artifact["route_families_owned"]),
            "gatewayCount": len(artifact["gateway_surfaces_owned"]),
            "automationMarkers": [
                root_marker_for_shell(slug),
                f"{slug}::visual",
                f"{slug}::parity",
            ],
        }
    return payload


def build_api_contracts_source(shell_contracts: dict[str, dict[str, Any]]) -> str:
    contracts_literal = json.dumps(shell_contracts, indent=2)
    return dedent(
        f"""
        export const shellSurfaceContracts = {contracts_literal} as const;

        export type ShellSlug = keyof typeof shellSurfaceContracts;
        export type ShellSurfaceContract = (typeof shellSurfaceContracts)[ShellSlug];

        export function getShellContract(shellSlug: ShellSlug): ShellSurfaceContract {{
          return shellSurfaceContracts[shellSlug];
        }}
        """
    ).strip()


def build_release_controls_source(shell_contracts: dict[str, dict[str, Any]]) -> str:
    postures = {
        slug: {
            "ring": "alpha",
            "publication": "watch" if contract["routeCount"] > 5 else "controlled",
            "owner": contract["ownerContext"],
            "automationGate": "stable data-testid contract",
        }
        for slug, contract in shell_contracts.items()
    }
    return dedent(
        f"""
        export const foundationReleasePosture = {json.dumps(postures, indent=2)} as const;

        export type ReleasePosture = (typeof foundationReleasePosture)[keyof typeof foundationReleasePosture];

        export * from "./projection-rebuild";
        """
    ).strip()


def build_observability_source() -> str:
    return dedent(
        """
        export interface ShellTelemetrySnapshot {
          shellSlug: string;
          routeCount: number;
          gatewayCount: number;
          continuityPosture: string;
          publicationPosture: string;
        }

        export function createShellSignal(
          shellSlug: string,
          routeFamilyIds: readonly string[],
          gatewaySurfaceIds: readonly string[],
        ): ShellTelemetrySnapshot {
          return {
            shellSlug,
            routeCount: routeFamilyIds.length,
            gatewayCount: gatewaySurfaceIds.length,
            continuityPosture: routeFamilyIds.length > 5 ? "derived-watch" : "baseline-clear",
            publicationPosture: gatewaySurfaceIds.length > 6 ? "watch" : "controlled",
          };
        }

        export * from "./correlation-spine";
        export * from "./telemetry";
        export * from "./ui-causality";
        """
    ).strip()


def build_domain_kernel_source() -> str:
    return dedent(
        """
        export const packageMetadata = {
          artifactId: "package_domain_kernel",
          packageName: "@vecells/domain-kernel",
          ownerContext: "shared_domain_kernel",
          note: "Canonical shared primitives only.",
        } as const;

        export interface FoundationRef {
          family: string;
          key: string;
        }

        export function makeFoundationRef(family: string, key: string): FoundationRef {
          return { family, key };
        }

        export * from "./request-intake-backbone";
        """
    ).strip()


def build_event_contracts_source() -> str:
    return dedent(
        """
        export interface FoundationEventEnvelope<TPayload> {
          eventType: string;
          emittedAt: string;
          payload: TPayload;
        }

        export function makeFoundationEvent<TPayload>(eventType: string, payload: TPayload): FoundationEventEnvelope<TPayload> {
          return {
            eventType,
            emittedAt: new Date().toISOString(),
            payload,
          };
        }
        """
    ).strip()


def build_fhir_mapping_source() -> str:
    return dedent(
        """
        export const foundationFhirMappings = {
          medication_request: "MedicationRequest",
          booking_window: "Slot",
          audit_snapshot: "AuditEvent",
        } as const;
        """
    ).strip()


def build_authz_policy_source() -> str:
    return dedent(
        """
        export const foundationPolicyScopes = {
          patient_view: ["patient-web"],
          triage_review: ["clinical-workspace"],
          ops_watch: ["ops-console"],
          governance_release: ["governance-console"],
        } as const;
        """
    ).strip()


def build_test_fixtures_source(shell_contracts: dict[str, dict[str, Any]]) -> str:
    fixtures = {
        slug: {
            "routeCount": contract["routeCount"],
            "gatewayCount": contract["gatewayCount"],
            "ownerContext": contract["ownerContext"],
        }
        for slug, contract in shell_contracts.items()
    }
    return dedent(
        f"""
        export const foundationFixtureCatalog = {json.dumps(fixtures, indent=2)} as const;
        """
    ).strip()


def build_design_system_source() -> str:
    return dedent(
        """
        import type { CSSProperties, ReactNode } from "react";

        export interface ShellMetric {
          label: string;
          value: string;
          detail: string;
        }

        export interface ShellCard {
          kicker: string;
          title: string;
          body: string;
          footnote: string;
        }

        export interface ShellVisualRow {
          label: string;
          value: string;
          detail: string;
        }

        export interface ShellRailItem {
          title: string;
          detail: string;
        }

        export interface FoundationShellDefinition {
          slug: string;
          displayName: string;
          namespace: string;
          layout: "patient" | "clinical" | "ops" | "hub" | "pharmacy" | "support" | "governance";
          accentPrimary: string;
          accentSecondary: string;
          masthead: string;
          eyebrow: string;
          title: string;
          description: string;
          chips: string[];
          metrics: ShellMetric[];
          cards: ShellCard[];
          visualTitle: string;
          visualRows: ShellVisualRow[];
          railTitle: string;
          railItems: ShellRailItem[];
          parityHeaders: [string, string, string];
          parityRows: [string, string, string][];
        }

        export interface ReleasePosture {
          ring: string;
          publication: string;
          owner: string;
          automationGate: string;
        }

        export interface ShellContract {
          shellSlug: string;
          artifactId: string;
          ownerContext: string;
          routeFamilyIds: readonly string[];
          gatewaySurfaceIds: readonly string[];
          routeCount: number;
          gatewayCount: number;
          automationMarkers: readonly string[];
        }

        export interface ShellTelemetrySnapshot {
          shellSlug: string;
          routeCount: number;
          gatewayCount: number;
          continuityPosture: string;
          publicationPosture: string;
        }

        export interface FoundationOwnershipProps {
          artifactId: string;
          ownerContext: string;
          rootTestId: string;
        }

        function MetricStrip({ metrics }: { metrics: FoundationShellDefinition["metrics"] }) {
          return (
            <div className="foundation-metrics" data-testid="metric-strip">
              {metrics.map((metric) => (
                <article className="foundation-metric" key={metric.label}>
                  <span className="foundation-kicker">{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.detail}</p>
                </article>
              ))}
            </div>
          );
        }

        function CardGrid({ cards }: { cards: FoundationShellDefinition["cards"] }) {
          return (
            <div className="foundation-card-grid">
              {cards.map((card) => (
                <article className="foundation-card" key={card.title}>
                  <span className="foundation-kicker">{card.kicker}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <small>{card.footnote}</small>
                </article>
              ))}
            </div>
          );
        }

        function VisualRows({
          layout,
          title,
          rows,
        }: {
          layout: FoundationShellDefinition["layout"];
          title: string;
          rows: FoundationShellDefinition["visualRows"];
        }) {
          return (
            <section className={`foundation-visual foundation-visual--${layout}`} data-testid="shell-visual">
              <div className="foundation-panel-header">
                <span className="foundation-kicker">Visual</span>
                <h3>{title}</h3>
              </div>
              <div className="foundation-visual-stack">
                {rows.map((row) => (
                  <article className="foundation-visual-row" data-testid={`${layout}::visual`} key={`${row.label}-${row.value}`}>
                    <strong>{row.label}</strong>
                    <span>{row.value}</span>
                    <p>{row.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        }

        function Rail({ title, items }: { title: string; items: FoundationShellDefinition["railItems"] }) {
          return (
            <section className="foundation-rail">
              <div className="foundation-panel-header">
                <span className="foundation-kicker">Rail</span>
                <h3>{title}</h3>
              </div>
              <ul>
                {items.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        }

        function ParityTable({
          shell,
          contract,
        }: {
          shell: FoundationShellDefinition;
          contract: ShellContract;
        }) {
          return (
            <section className="foundation-parity" data-testid="shell-parity">
              <div className="foundation-panel-header">
                <span className="foundation-kicker">Parity</span>
                <h3>Visual/list parity</h3>
              </div>
              <table data-testid={`${shell.namespace}::parity`}>
                <thead>
                  <tr>
                    {shell.parityHeaders.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shell.parityRows.map((row) => (
                    <tr key={row.join("-")}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td>Route families</td>
                    <td>{contract.routeCount}</td>
                    <td>Route ownership remains visible in every shell placeholder.</td>
                  </tr>
                  <tr>
                    <td>Gateway surfaces</td>
                    <td>{contract.gatewayCount}</td>
                    <td>Gateway breadth is visible without implying live backend completeness.</td>
                  </tr>
                </tbody>
              </table>
            </section>
          );
        }

        function OwnershipStrip({
          ownership,
          release,
          telemetry,
          contract,
        }: {
          ownership: FoundationOwnershipProps;
          release: ReleasePosture;
          telemetry: ShellTelemetrySnapshot;
          contract: ShellContract;
        }) {
          return (
            <section className="foundation-ownership" data-testid="ownership-strip">
              <div>
                <span className="foundation-kicker">Artifact</span>
                <strong>{ownership.artifactId}</strong>
              </div>
              <div>
                <span className="foundation-kicker">Owner</span>
                <strong>{ownership.ownerContext}</strong>
              </div>
              <div>
                <span className="foundation-kicker">Release</span>
                <strong>{release.ring} / {release.publication}</strong>
              </div>
              <div>
                <span className="foundation-kicker">Telemetry</span>
                <strong>{telemetry.continuityPosture}</strong>
              </div>
              <div>
                <span className="foundation-kicker">Markers</span>
                <strong>{contract.automationMarkers.join(", ")}</strong>
              </div>
            </section>
          );
        }

        export function FoundationShellApp({
          shell,
          contract,
          release,
          telemetry,
          ownership,
        }: {
          shell: FoundationShellDefinition;
          contract: ShellContract;
          release: ReleasePosture;
          telemetry: ShellTelemetrySnapshot;
          ownership: FoundationOwnershipProps;
        }) {
          const style = {
            "--accent-primary": shell.accentPrimary,
            "--accent-secondary": shell.accentSecondary,
          } as CSSProperties;

          return (
            <main
              className={`foundation-shell foundation-shell--${shell.layout}`}
              style={style}
              data-shell={shell.slug}
              data-testid={ownership.rootTestId}
              aria-label={`${shell.displayName} placeholder shell`}
            >
              <header className="foundation-masthead">
                <div>
                  <span className="foundation-kicker">{shell.eyebrow}</span>
                  <h1>{shell.displayName}</h1>
                  <p>{shell.title}</p>
                </div>
                <div className="foundation-chip-row">
                  <span className="foundation-chip foundation-chip--masthead">{shell.masthead}</span>
                  {shell.chips.map((chip) => (
                    <span className="foundation-chip" key={chip}>{chip}</span>
                  ))}
                </div>
              </header>
              <OwnershipStrip ownership={ownership} release={release} telemetry={telemetry} contract={contract} />
              <MetricStrip metrics={shell.metrics} />
              <section className="foundation-grid">
                <section className="foundation-panel foundation-panel--primary">
                  <div className="foundation-panel-header">
                    <span className="foundation-kicker">Primary</span>
                    <h2>{shell.description}</h2>
                  </div>
                  <CardGrid cards={shell.cards} />
                </section>
                <section className="foundation-panel foundation-panel--visual">
                  <VisualRows layout={shell.layout} title={shell.visualTitle} rows={shell.visualRows} />
                </section>
                <section className="foundation-panel foundation-panel--rail">
                  <Rail title={shell.railTitle} items={shell.railItems} />
                </section>
                <section className="foundation-panel foundation-panel--parity">
                  <ParityTable shell={shell} contract={contract} />
                </section>
              </section>
            </main>
          );
        }

        export function FoundationStaticLabel({ children }: { children: ReactNode }) {
          return <span className="foundation-chip">{children}</span>;
        }
        """
    ).strip()


def build_design_system_css() -> str:
    return dedent(
        """
        :root {
          color-scheme: light;
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          background: #f5f7fa;
          color: #1d2939;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background:
            radial-gradient(circle at top right, rgba(47, 91, 255, 0.08), transparent 28%),
            radial-gradient(circle at bottom left, rgba(14, 165, 164, 0.08), transparent 25%),
            #f5f7fa;
          color: #1d2939;
        }

        button,
        a,
        input,
        select,
        textarea {
          font: inherit;
        }

        :focus-visible {
          outline: 2px solid var(--accent-primary, #2f5bff);
          outline-offset: 2px;
        }

        .foundation-shell {
          min-height: 100vh;
          padding: 24px;
          max-width: 1440px;
          margin: 0 auto;
        }

        .foundation-masthead {
          min-height: 72px;
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: start;
          padding: 24px 28px;
          border: 1px solid #d0d5dd;
          border-radius: 24px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(238, 242, 246, 0.92));
          box-shadow: 0 18px 60px rgba(16, 24, 40, 0.06);
        }

        .foundation-masthead h1,
        .foundation-panel h2,
        .foundation-panel h3 {
          margin: 0;
          color: #101828;
        }

        .foundation-masthead p,
        .foundation-card p,
        .foundation-visual-row p,
        .foundation-metric p {
          margin: 0;
          color: #667085;
        }

        .foundation-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: end;
        }

        .foundation-chip {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(16, 24, 40, 0.05);
          border: 1px solid rgba(16, 24, 40, 0.08);
          color: #344054;
          font-size: 0.78rem;
          letter-spacing: 0.02em;
        }

        .foundation-chip--masthead {
          background: linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 18%, white), white);
          color: #101828;
        }

        .foundation-kicker {
          display: inline-flex;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.72rem;
          color: #667085;
        }

        .foundation-ownership {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-top: 20px;
          padding: 20px;
          border-radius: 22px;
          background: #ffffff;
          border: 1px solid #e4e7ec;
        }

        .foundation-ownership > div,
        .foundation-metric,
        .foundation-card,
        .foundation-visual-row,
        .foundation-rail li {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 20px;
        }

        .foundation-ownership > div {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .foundation-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .foundation-metric,
        .foundation-card,
        .foundation-panel,
        .foundation-visual,
        .foundation-rail,
        .foundation-parity {
          padding: 20px;
          background: #ffffff;
        }

        .foundation-grid {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 24px;
        }

        .foundation-panel {
          border: 1px solid #d0d5dd;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(238, 242, 246, 0.85));
          box-shadow: 0 20px 45px rgba(16, 24, 40, 0.05);
        }

        .foundation-panel--primary {
          grid-column: span 7;
          min-height: 320px;
        }

        .foundation-panel--visual {
          grid-column: span 5;
          min-height: 320px;
        }

        .foundation-panel--rail {
          grid-column: span 4;
        }

        .foundation-panel--parity {
          grid-column: span 8;
        }

        .foundation-shell--clinical .foundation-panel--primary {
          grid-column: span 5;
        }

        .foundation-shell--clinical .foundation-panel--visual {
          grid-column: span 7;
        }

        .foundation-shell--ops .foundation-panel--primary {
          grid-column: span 12;
        }

        .foundation-shell--ops .foundation-panel--visual,
        .foundation-shell--ops .foundation-panel--parity {
          grid-column: span 6;
        }

        .foundation-shell--hub .foundation-panel--primary,
        .foundation-shell--support .foundation-panel--primary,
        .foundation-shell--governance .foundation-panel--primary {
          grid-column: span 8;
        }

        .foundation-shell--hub .foundation-panel--visual,
        .foundation-shell--support .foundation-panel--visual,
        .foundation-shell--governance .foundation-panel--visual {
          grid-column: span 4;
        }

        .foundation-shell--pharmacy .foundation-panel--visual {
          grid-column: span 4;
        }

        .foundation-shell--pharmacy .foundation-panel--primary {
          grid-column: span 8;
        }

        .foundation-panel-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .foundation-card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          min-height: 160px;
        }

        .foundation-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 160px;
        }

        .foundation-card small {
          color: #475467;
        }

        .foundation-visual-stack {
          display: grid;
          gap: 14px;
        }

        .foundation-visual-row {
          padding: 18px;
          display: grid;
          gap: 8px;
          border-left: 4px solid var(--accent-primary);
          background:
            linear-gradient(90deg, color-mix(in srgb, var(--accent-primary) 8%, white), white);
        }

        .foundation-rail ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 14px;
        }

        .foundation-rail li {
          padding: 16px;
          display: grid;
          gap: 6px;
        }

        .foundation-parity table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.94rem;
        }

        .foundation-parity th,
        .foundation-parity td {
          padding: 12px;
          border-bottom: 1px solid #e4e7ec;
          text-align: left;
          vertical-align: top;
        }

        .foundation-parity th {
          color: #344054;
          background: #eef2f6;
        }

        @media (max-width: 1080px) {
          .foundation-ownership {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .foundation-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .foundation-panel--primary,
          .foundation-panel--visual,
          .foundation-panel--rail,
          .foundation-panel--parity {
            grid-column: span 12;
          }
        }

        @media (max-width: 720px) {
          .foundation-shell {
            padding: 16px;
          }

          .foundation-masthead {
            flex-direction: column;
          }

          .foundation-metrics,
          .foundation-ownership,
          .foundation-card-grid {
            grid-template-columns: 1fr;
          }

          .foundation-grid {
            gap: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
        """
    ).strip()


def build_domain_package_source(artifact: dict[str, Any]) -> str:
    context = artifact["owner_context_code"]
    return dedent(
        f"""
        export const domainModule = {{
          artifactId: "{artifact['artifact_id']}",
          packageName: "{package_name_for_artifact(artifact)}",
          ownerContext: "{context}",
          posture: "{artifact['topology_status']}",
          note: {json.dumps(artifact['notes'])},
        }} as const;
        """
    ).strip()


def build_generic_package_source(artifact: dict[str, Any]) -> str:
    return dedent(
        f"""
        export const packageMetadata = {{
          artifactId: "{artifact['artifact_id']}",
          packageName: "{package_name_for_artifact(artifact)}",
          ownerContext: "{artifact['owner_context_code']}",
          note: {json.dumps(artifact['notes'])},
        }} as const;
        """
    ).strip()


def build_service_source(artifact: dict[str, Any], imports: list[str], manifest_body: str, response_path: str) -> str:
    import_block = "\n".join(imports)
    port = SERVICE_PORTS[repo_slug(artifact["repo_path"])]
    return dedent(
        f"""
        import http from "node:http";
        {import_block}

        const port = Number(process.env.PORT ?? "{port}");

        const scaffold = {manifest_body} as const;

        const server = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {{
          const url = request.url ?? "/";
          if (url === "/health") {{
            response.writeHead(200, {{ "Content-Type": "application/json; charset=utf-8" }});
            response.end(JSON.stringify({{ ok: true, service: scaffold.service, port }}));
            return;
          }}
          if (url === "{response_path}") {{
            response.writeHead(200, {{ "Content-Type": "application/json; charset=utf-8" }});
            response.end(JSON.stringify(scaffold));
            return;
          }}
          response.writeHead(200, {{ "Content-Type": "application/json; charset=utf-8" }});
          response.end(JSON.stringify({{ service: scaffold.service, note: scaffold.note, owner: scaffold.ownerContext }}));
        }});

        server.listen(port, "127.0.0.1", () => {{
          console.log(`[${{scaffold.service}}] placeholder service listening on http://127.0.0.1:${{port}}`);
        }});
        """
    ).strip()


def build_adapter_simulator_service_source() -> str:
    return dedent(
        """
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";
        import { shellSurfaceContracts } from "@vecells/api-contracts";
        import { foundationFhirMappings } from "@vecells/fhir-mapping";
        import { foundationFixtureCatalog } from "@vecells/test-fixtures";
        import { createSimulatorBackplaneRuntime } from "./backplane";

        export { createSimulatorBackplaneRuntime } from "./backplane";
        export { createSimulatorSdk } from "./sdk-clients";
        export type {
          FailureMode,
          RuntimeStateSnapshot,
          SimulatorDeckSnapshot,
          SimulatorFamilyCode,
        } from "./backplane";

        const port = Number(process.env.PORT ?? "7104");

        const scaffold = {
          service: "adapter-simulators",
          ownerContext: "platform_integration",
          note: "Simulator control surface serves deterministic manifest, fixture posture, and HTTP backplane routes.",
          contractCount: Object.keys(shellSurfaceContracts).length,
          mappings: foundationFhirMappings,
          fixtures: foundationFixtureCatalog,
        } as const;

        function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
          return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            request.on("data", (chunk) => {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            request.on("end", () => {
              if (chunks.length === 0) {
                resolve({});
                return;
              }
              try {
                resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
              } catch (error) {
                reject(error);
              }
            });
            request.on("error", reject);
          });
        }

        function sendJson(response: http.ServerResponse, statusCode: number, payload: unknown): void {
          response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
          response.end(JSON.stringify(payload));
        }

        export function createSimulatorBackplaneServer(options?: { readonly rootDir?: string }): http.Server {
          const runtime = createSimulatorBackplaneRuntime(options);

          return http.createServer(async (request, response) => {
            const method = request.method ?? "GET";
            const url = request.url ?? "/";

            try {
              if (method === "GET" && url === "/health") {
                sendJson(response, 200, { ok: true, service: scaffold.service, port });
                return;
              }
              if (method === "GET" && url === "/simulators") {
                sendJson(response, 200, scaffold);
                return;
              }
              if (method === "GET" && url === "/api/control/deck") {
                sendJson(response, 200, runtime.getDeckSnapshot());
                return;
              }
              if (method === "GET" && url === "/api/state") {
                sendJson(response, 200, runtime.getStateSnapshot());
                return;
              }

              const body = method === "POST" ? ((await readJsonBody(request)) as Record<string, unknown>) : {};

              switch (`${method} ${url}`) {
                case "POST /api/control/start":
                  sendJson(response, 200, runtime.start(body.family as never));
                  return;
                case "POST /api/control/stop":
                  sendJson(response, 200, runtime.stop(body.family as never));
                  return;
                case "POST /api/control/reset":
                  sendJson(response, 200, runtime.reset());
                  return;
                case "POST /api/control/reseed":
                  sendJson(response, 200, runtime.reseed(body.seedId as string | undefined));
                  return;
                case "POST /api/control/failure-mode":
                  sendJson(
                    response,
                    200,
                    runtime.setFailureMode(body.family as never, body.failureMode as never),
                  );
                  return;
                case "POST /api/nhs-login/begin":
                  sendJson(response, 200, runtime.beginAuthFlow(body as never));
                  return;
                case "POST /api/nhs-login/callback":
                  sendJson(response, 200, runtime.deliverAuthCallback(body.authSessionRef as string));
                  return;
                case "POST /api/nhs-login/replay":
                  sendJson(response, 200, runtime.replayAuthCallback(body.authSessionRef as string));
                  return;
                case "POST /api/nhs-login/token":
                  sendJson(response, 200, runtime.redeemAuthCode(body as never));
                  return;
                case "POST /api/im1/search":
                  sendJson(response, 200, runtime.searchIm1Slots(body as never));
                  return;
                case "POST /api/im1/hold":
                  sendJson(response, 200, runtime.holdIm1Slot(body as never));
                  return;
                case "POST /api/im1/commit":
                  sendJson(response, 200, runtime.commitIm1Booking(body as never));
                  return;
                case "POST /api/im1/manage":
                  sendJson(response, 200, runtime.manageIm1Appointment(body as never));
                  return;
                case "POST /api/mesh/dispatch":
                  sendJson(response, 200, runtime.dispatchMeshMessage(body as never));
                  return;
                case "POST /api/mesh/poll":
                  sendJson(response, 200, runtime.pollMeshMailbox(body.mailboxKey as string));
                  return;
                case "POST /api/mesh/ack":
                  sendJson(response, 200, runtime.acknowledgeMeshMessage(body.messageRef as string));
                  return;
                case "POST /api/telephony/start":
                  sendJson(response, 200, runtime.startTelephonyCall(body as never));
                  return;
                case "POST /api/telephony/advance":
                  sendJson(response, 200, runtime.advanceTelephonyCall(body.callRef as string));
                  return;
                case "POST /api/telephony/webhook":
                  sendJson(response, 200, runtime.emitTelephonyWebhook(body.callRef as string));
                  return;
                case "POST /api/telephony/retry-webhook":
                  sendJson(response, 200, runtime.retryTelephonyWebhook(body.callRef as string));
                  return;
                case "POST /api/notifications/send":
                  sendJson(response, 200, runtime.sendNotification(body as never));
                  return;
                case "POST /api/notifications/webhook":
                  sendJson(response, 200, runtime.emitNotificationWebhook(body.messageRef as string));
                  return;
                case "POST /api/notifications/repair":
                  sendJson(response, 200, runtime.repairNotification(body.messageRef as string));
                  return;
                case "POST /api/notifications/settle":
                  sendJson(response, 200, runtime.settleNotification(body.messageRef as string));
                  return;
                default:
                  sendJson(response, 404, {
                    error: "route_not_found",
                    message: `No simulator route for ${method} ${url}`,
                  });
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown simulator error";
              sendJson(response, 400, { error: "simulator_request_failed", message });
            }
          });
        }

        function main(): void {
          const server = createSimulatorBackplaneServer();
          server.listen(port, "127.0.0.1", () => {
            console.log(`[${scaffold.service}] simulator service listening on http://127.0.0.1:${port}`);
          });
        }

        const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
        if (entryPath === fileURLToPath(import.meta.url)) {
          main();
        }
        """
    ).strip()


def build_shell_app_source(artifact: dict[str, Any], shell: dict[str, Any]) -> str:
    shell_json = json.dumps(shell, indent=2)
    slug = shell["slug"]
    return dedent(
        f"""
        import {{
          FoundationShellApp,
          type FoundationShellDefinition,
        }} from "@vecells/design-system";
        import "@vecells/design-system/foundation.css";
        import {{ shellSurfaceContracts }} from "@vecells/api-contracts";
        import {{ createShellSignal }} from "@vecells/observability";
        import {{ foundationReleasePosture }} from "@vecells/release-controls";

        const shell = {shell_json} as const satisfies FoundationShellDefinition;
        const contract = shellSurfaceContracts["{slug}"];
        const telemetry = createShellSignal(shell.slug, contract.routeFamilyIds, contract.gatewaySurfaceIds);
        const release = foundationReleasePosture["{slug}"];

        export default function App() {{
          return (
            <FoundationShellApp
              shell={{shell}}
              contract={{contract}}
              release={{release}}
              telemetry={{telemetry}}
              ownership={{{{
                artifactId: "{artifact['artifact_id']}",
                ownerContext: "{artifact['owner_context_code']}",
                rootTestId: "{root_marker_for_shell(slug)}",
              }}}}
            />
          );
        }}
        """
    ).strip()


def build_main_tsx() -> str:
    return dedent(
        """
        import React from "react";
        import ReactDOM from "react-dom/client";
        import App from "./App";

        ReactDOM.createRoot(document.getElementById("root")!).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
        );
        """
    ).strip()


def build_vite_env() -> str:
    return '/// <reference types="vite/client" />'


def build_app_index_html(title: str) -> str:
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>{title}</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
        """
    ).strip()


def build_generic_ts_library_scripts() -> dict[str, str]:
    return {
        "build": "tsc -p tsconfig.json",
        "lint": "eslint src --ext .ts,.tsx",
        "test": "vitest run --passWithNoTests",
        "typecheck": "tsc -p tsconfig.json --noEmit",
    }


def build_service_scripts() -> dict[str, str]:
    scripts = build_generic_ts_library_scripts()
    scripts["dev"] = "tsx watch src/index.ts"
    return scripts


def build_app_scripts(slug: str) -> dict[str, str]:
    ports = APP_PORTS[slug]
    return {
        "dev": f"vite --host 127.0.0.1 --port {ports['dev']}",
        "build": "tsc -p tsconfig.json --noEmit && vite build",
        "lint": "eslint src --ext .ts,.tsx",
        "test": "vitest run --passWithNoTests",
        "typecheck": "tsc -p tsconfig.json --noEmit",
        "preview": f"vite preview --host 127.0.0.1 --port {ports['preview']}",
    }


def build_tests_workspace_scripts() -> dict[str, str]:
    return {
        "build": (
            "node --check foundation-shell-gallery.spec.js && "
            "node --check runtime-topology-atlas.spec.js && "
            "node --check gateway-surface-studio.spec.js && "
            "node --check event-registry-studio.spec.js && "
            "node --check fhir-representation-atlas.spec.js && "
            "node --check frontend-contract-studio.spec.js && "
            "node --check release-parity-cockpit.spec.js && "
            "node --check design-contract-studio.spec.js && node --check audit-ledger-explorer.spec.js"
        ),
        "lint": (
            "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
            "gateway-surface-studio.spec.js event-registry-studio.spec.js "
            "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
            "release-parity-cockpit.spec.js design-contract-studio.spec.js audit-ledger-explorer.spec.js"
        ),
        "test": (
            "node foundation-shell-gallery.spec.js && "
            "node runtime-topology-atlas.spec.js && "
            "node gateway-surface-studio.spec.js && "
            "node event-registry-studio.spec.js && "
            "node fhir-representation-atlas.spec.js && "
            "node frontend-contract-studio.spec.js && "
            "node release-parity-cockpit.spec.js && "
            "node design-contract-studio.spec.js && node audit-ledger-explorer.spec.js"
        ),
        "typecheck": (
            "node --check foundation-shell-gallery.spec.js && "
            "node --check runtime-topology-atlas.spec.js && "
            "node --check gateway-surface-studio.spec.js && "
            "node --check event-registry-studio.spec.js && "
            "node --check fhir-representation-atlas.spec.js && "
            "node --check frontend-contract-studio.spec.js && "
            "node --check release-parity-cockpit.spec.js && "
            "node --check design-contract-studio.spec.js && node --check audit-ledger-explorer.spec.js"
        ),
        "e2e": (
            "node foundation-shell-gallery.spec.js --run && "
            "node runtime-topology-atlas.spec.js --run && "
            "node gateway-surface-studio.spec.js --run && "
            "node event-registry-studio.spec.js --run && "
            "node fhir-representation-atlas.spec.js --run && "
            "node frontend-contract-studio.spec.js --run && "
            "node release-parity-cockpit.spec.js --run && "
            "node design-contract-studio.spec.js --run && node audit-ledger-explorer.spec.js --run"
        ),
    }


def build_assistive_lab_scripts() -> dict[str, str]:
    scripts = build_generic_ts_library_scripts()
    scripts["dev"] = "tsx watch src/index.ts"
    return scripts


def build_assistive_lab_source() -> str:
    return dedent(
        """
        export const assistiveControlLab = {
          posture: "conditional_reserved",
          note: "The assistive control lab remains tools-only in seq_042 and does not own domain truth.",
          stableMarkers: ["assistive-control-lab::status", "assistive-control-lab::checks"],
        } as const;
        """
    ).strip()


def build_tests_workspace_readme() -> str:
    return dedent(
        """
        # Browser Validation Workspace

        This workspace owns browser verification for the static foundation gallery plus the generated runtime topology, gateway, event registry, FHIR representation, frontend manifest, release parity, and design contract studios.

        It intentionally stays detached from live provider state. The required end-to-end contracts are `foundation-shell-gallery.spec.js`, `runtime-topology-atlas.spec.js`, `gateway-surface-studio.spec.js`, `event-registry-studio.spec.js`, `fhir-representation-atlas.spec.js`, `frontend-contract-studio.spec.js`, `release-parity-cockpit.spec.js`, `design-contract-studio.spec.js`, and `audit-ledger-explorer.spec.js`.
        """
    ).strip()


def build_gallery_html(gallery_payload: dict[str, Any]) -> str:
    shell_json = json.dumps(gallery_payload, indent=2)
    template = """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>42 Foundation Shell Gallery</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #F5F7FA;
        --panel: #FFFFFF;
        --inset: #EEF2F6;
        --text-strong: #101828;
        --text: #1D2939;
        --text-muted: #667085;
        --border-subtle: #E4E7EC;
        --border-default: #D0D5DD;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        background:
          radial-gradient(circle at top right, rgba(47, 91, 255, 0.08), transparent 22%),
          radial-gradient(circle at bottom left, rgba(14, 165, 164, 0.08), transparent 24%),
          var(--canvas);
        color: var(--text);
      }

      body[data-reduced-motion="true"] * {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
      }

      button, select { font: inherit; }

      :focus-visible {
        outline: 2px solid var(--accent-primary, #2F5BFF);
        outline-offset: 2px;
      }

      .gallery-shell {
        max-width: 1440px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 24px;
      }

      .gallery-hero {
        min-height: 72px;
        padding: 28px;
        border-radius: 28px;
        background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(238,242,246,0.92));
        border: 1px solid var(--border-default);
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: start;
      }

      .gallery-hero h1,
      .preview-stage h2,
      .preview-stage h3,
      .ownership-strip strong,
      .shell-card strong {
        margin: 0;
        color: var(--text-strong);
      }

      .hero-copy {
        display: grid;
        gap: 8px;
      }

      .hero-copy p,
      .hero-summary span,
      .shell-card p,
      .preview-stage p,
      .preview-rail li,
      td,
      th {
        color: var(--text-muted);
      }

      .hero-summary {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .summary-pill,
      .chip {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid rgba(16,24,40,0.08);
        background: rgba(16,24,40,0.04);
        font-size: 0.78rem;
        letter-spacing: 0.02em;
      }

      .gallery-body {
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr);
        gap: 24px;
      }

      .shell-rail {
        display: grid;
        gap: 12px;
      }

      .shell-card {
        text-align: left;
        width: 100%;
        border-radius: 22px;
        border: 1px solid var(--border-default);
        background: linear-gradient(160deg, rgba(255,255,255,0.98), rgba(238,242,246,0.88));
        padding: 18px;
        display: grid;
        gap: 10px;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
      }

      .shell-card[data-selected="true"] {
        transform: translateY(-2px);
        box-shadow: 0 18px 38px rgba(16,24,40,0.08);
        border-color: var(--accent-primary);
      }

      .preview-wrap {
        display: grid;
        gap: 20px;
      }

      .ownership-strip {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
      }

      .ownership-strip > article,
      .preview-panel,
      .preview-rail li,
      .preview-metric,
      .preview-card,
      .preview-visual-row {
        background: var(--panel);
        border-radius: 20px;
        border: 1px solid var(--border-subtle);
      }

      .ownership-strip > article {
        padding: 14px;
        display: grid;
        gap: 8px;
      }

      .preview-stage {
        padding: 24px;
        border-radius: 28px;
        border: 1px solid var(--border-default);
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(238,242,246,0.84));
        display: grid;
        gap: 20px;
      }

      .preview-header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: start;
      }

      .preview-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 24px;
      }

      .preview-panel--primary { grid-column: span 7; }
      .preview-panel--visual { grid-column: span 5; }
      .preview-panel--rail { grid-column: span 4; }
      .preview-panel--parity { grid-column: span 8; }

      .preview-stage[data-layout="clinical"] .preview-panel--primary { grid-column: span 5; }
      .preview-stage[data-layout="clinical"] .preview-panel--visual { grid-column: span 7; }
      .preview-stage[data-layout="ops"] .preview-panel--primary { grid-column: span 12; }
      .preview-stage[data-layout="ops"] .preview-panel--visual,
      .preview-stage[data-layout="ops"] .preview-panel--parity { grid-column: span 6; }
      .preview-stage[data-layout="hub"] .preview-panel--primary,
      .preview-stage[data-layout="support"] .preview-panel--primary,
      .preview-stage[data-layout="governance"] .preview-panel--primary { grid-column: span 8; }
      .preview-stage[data-layout="hub"] .preview-panel--visual,
      .preview-stage[data-layout="support"] .preview-panel--visual,
      .preview-stage[data-layout="governance"] .preview-panel--visual { grid-column: span 4; }
      .preview-stage[data-layout="pharmacy"] .preview-panel--primary { grid-column: span 8; }
      .preview-stage[data-layout="pharmacy"] .preview-panel--visual { grid-column: span 4; }

      .preview-panel {
        padding: 20px;
        display: grid;
        gap: 16px;
      }

      .preview-kicker {
        text-transform: uppercase;
        font-size: 0.72rem;
        letter-spacing: 0.12em;
        color: var(--text-muted);
      }

      .preview-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .preview-metric,
      .preview-card,
      .preview-visual-row {
        padding: 16px;
        display: grid;
        gap: 8px;
      }

      .preview-card-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .preview-visual-row {
        border-left: 4px solid var(--accent-primary);
        background: linear-gradient(90deg, color-mix(in srgb, var(--accent-primary) 8%, white), white);
      }

      .preview-rail ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 12px;
      }

      .preview-rail li { padding: 14px; }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        text-align: left;
        padding: 12px;
        border-bottom: 1px solid var(--border-subtle);
        vertical-align: top;
      }

      th { background: var(--inset); color: var(--text); }

      @media (max-width: 1080px) {
        .gallery-body { grid-template-columns: 1fr; }
        .preview-grid,
        .ownership-strip,
        .preview-card-grid,
        .preview-metrics { grid-template-columns: 1fr; }
        .preview-panel--primary,
        .preview-panel--visual,
        .preview-panel--rail,
        .preview-panel--parity { grid-column: span 12; }
      }

      @media (max-width: 720px) {
        .gallery-shell { padding: 16px; }
        .gallery-hero,
        .preview-header { flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <main class="gallery-shell" data-testid="gallery-shell">
      <section class="gallery-hero">
        <div class="hero-copy">
          <span class="preview-kicker">Foundations_Gallery</span>
          <h1>Phase 0 foundation shell gallery</h1>
          <p>Canonical shell placeholders share one quiet design language while keeping visibly different operating moods and ownership posture.</p>
        </div>
        <div class="hero-summary" data-testid="hero-summary"></div>
      </section>
      <section class="gallery-body">
        <aside class="shell-rail" data-testid="shell-rail" aria-label="Shell rail"></aside>
        <section class="preview-wrap">
          <section class="ownership-strip" data-testid="ownership-strip" aria-label="Ownership strip"></section>
          <section data-testid="shell-preview"></section>
        </section>
      </section>
    </main>
    <script>
      const galleryData = __GALLERY_DATA__;
      const rail = document.querySelector("[data-testid='shell-rail']");
      const previewHost = document.querySelector("[data-testid='shell-preview']");
      const ownershipStrip = document.querySelector("[data-testid='ownership-strip']");
      const heroSummary = document.querySelector("[data-testid='hero-summary']");
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      document.body.dataset.reducedMotion = String(media.matches);
      document.body.dataset.offlineReady = "true";

      galleryData.heroSummary.forEach((item) => {
        const pill = document.createElement("span");
        pill.className = "summary-pill";
        pill.textContent = item;
        heroSummary.appendChild(pill);
      });

      let selectedSlug = galleryData.shells[0].slug;

      function setAccent(shell) {
        document.body.style.setProperty("--accent-primary", shell.accentPrimary);
        document.body.style.setProperty("--accent-secondary", shell.accentSecondary);
      }

      function renderOwnership(shell) {
        ownershipStrip.replaceChildren();
        const items = [
          ["Artifact", shell.contract.artifactId],
          ["Owner", shell.contract.ownerContext],
          ["Release", `${shell.release.ring} / ${shell.release.publication}`],
          ["Markers", shell.contract.automationMarkers.join(", ")],
          ["Offline", "local-only assets"],
        ];
        items.forEach(([label, value]) => {
          const article = document.createElement("article");
          article.innerHTML = `<span class="preview-kicker">${label}</span><strong>${value}</strong>`;
          ownershipStrip.appendChild(article);
        });
      }

      function renderPreview(shell) {
        setAccent(shell);
        previewHost.innerHTML = `
          <section class="preview-stage" data-layout="${shell.layout}" data-testid="${shell.namespace}-shell-root" aria-label="${shell.displayName} preview shell">
            <header class="preview-header">
              <div>
                <span class="preview-kicker">${shell.eyebrow}</span>
                <h2>${shell.displayName}</h2>
                <p>${shell.title}</p>
              </div>
              <div class="hero-summary">
                <span class="chip">${shell.masthead}</span>
                ${shell.chips.map((chip) => `<span class="chip">${chip}</span>`).join("")}
              </div>
            </header>
            <section class="preview-metrics">
              ${shell.metrics.map((metric) => `
                <article class="preview-metric">
                  <span class="preview-kicker">${metric.label}</span>
                  <strong>${metric.value}</strong>
                  <p>${metric.detail}</p>
                </article>
              `).join("")}
            </section>
            <section class="preview-grid">
              <section class="preview-panel preview-panel--primary">
                <span class="preview-kicker">Primary</span>
                <h3>${shell.description}</h3>
                <div class="preview-card-grid">
                  ${shell.cards.map((card) => `
                    <article class="preview-card">
                      <span class="preview-kicker">${card.kicker}</span>
                      <strong>${card.title}</strong>
                      <p>${card.body}</p>
                    </article>
                  `).join("")}
                </div>
              </section>
              <section class="preview-panel preview-panel--visual">
                <span class="preview-kicker">Visual</span>
                <h3>${shell.visualTitle}</h3>
                ${shell.visualRows.map((row) => `
                  <article class="preview-visual-row" data-testid="${shell.namespace}::visual">
                    <strong>${row.label}</strong>
                    <span>${row.value}</span>
                    <p>${row.detail}</p>
                  </article>
                `).join("")}
              </section>
              <section class="preview-panel preview-panel--rail preview-rail">
                <span class="preview-kicker">Rail</span>
                <h3>${shell.railTitle}</h3>
                <ul>
                  ${shell.railItems.map((item) => `<li><strong>${item.title}</strong><span>${item.detail}</span></li>`).join("")}
                </ul>
              </section>
              <section class="preview-panel preview-panel--parity">
                <span class="preview-kicker">Parity</span>
                <h3>Visual/list parity</h3>
                <table data-testid="parity-table">
                  <thead>
                    <tr>${shell.parityHeaders.map((header) => `<th>${header}</th>`).join("")}</tr>
                  </thead>
                  <tbody>
                    ${shell.parityRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
                    <tr><td>Route families</td><td>${shell.contract.routeCount}</td><td>Route ownership stays visible in the shell preview.</td></tr>
                    <tr><td>Gateway surfaces</td><td>${shell.contract.gatewayCount}</td><td>Surface breadth is explicit without claiming full backend implementation.</td></tr>
                  </tbody>
                </table>
              </section>
            </section>
          </section>
        `;
      }

      function updateSelection(nextSlug) {
        selectedSlug = nextSlug;
        const shell = galleryData.shells.find((item) => item.slug === nextSlug);
        renderOwnership(shell);
        renderPreview(shell);
        rail.querySelectorAll("button").forEach((button) => {
          button.dataset.selected = String(button.dataset.slug === nextSlug);
          button.setAttribute("aria-pressed", String(button.dataset.slug === nextSlug));
        });
      }

      function renderRail() {
        rail.replaceChildren();
        galleryData.shells.forEach((shell, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "shell-card";
          button.dataset.slug = shell.slug;
          button.dataset.selected = String(index === 0);
          button.setAttribute("aria-pressed", String(index === 0));
          button.setAttribute("data-testid", `shell-card-${shell.slug}`);
          button.innerHTML = `
            <span class="preview-kicker">${shell.eyebrow}</span>
            <strong>${shell.displayName}</strong>
            <p>${shell.description}</p>
            <div class="hero-summary">${shell.chips.map((chip) => `<span class="chip">${chip}</span>`).join("")}</div>
          `;
          button.addEventListener("click", () => updateSelection(shell.slug));
          button.addEventListener("keydown", (event) => {
            const cards = Array.from(rail.querySelectorAll("button"));
            const currentIndex = cards.indexOf(button);
            if (event.key === "ArrowDown" || event.key === "ArrowRight") {
              const next = cards[(currentIndex + 1) % cards.length];
              next.focus();
              updateSelection(next.dataset.slug);
              event.preventDefault();
            }
            if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
              const next = cards[(currentIndex - 1 + cards.length) % cards.length];
              next.focus();
              updateSelection(next.dataset.slug);
              event.preventDefault();
            }
          });
          rail.appendChild(button);
        });
      }

      renderRail();
      updateSelection(selectedSlug);
    </script>
  </body>
</html>
"""
    return template.replace("__GALLERY_DATA__", shell_json).strip()


def build_plan_markdown(
    *,
    workspace_entries: list[dict[str, Any]],
    non_workspace_entries: list[dict[str, Any]],
    legacy_dirs: list[str],
) -> str:
    app_count = len([item for item in workspace_entries if item["artifact_type"] == "app"])
    service_count = len([item for item in workspace_entries if item["artifact_type"] == "service"])
    package_count = len([item for item in workspace_entries if item["artifact_type"] == "package"])
    tool_count = len([item for item in workspace_entries if item["artifact_type"] == "tools-only"])
    rows = "\n".join(
        f"| `{entry['project_name']}` | `{entry['repo_path']}` | `{entry['artifact_type']}` | `{entry['owner_context_code']}` | `{', '.join(entry['script_names'])}` |"
        for entry in workspace_entries
    )
    non_workspace_rows = "\n".join(
        f"| `{entry['artifact_id']}` | `{entry['repo_path']}` | `{entry['artifact_type']}` | `{entry['owner_context_code']}` | {entry['workspace_reason']} |"
        for entry in non_workspace_entries
    )
    legacy_list = "\n".join(f"- `{item}`" for item in legacy_dirs) or "- none"
    return dedent(
        f"""
        # 42 Monorepo Scaffold Plan

        `seq_042` wires the canonical Phase 0 workspace baseline chosen in task `012`: `pnpm + Nx`.

        ## What landed

        - Root workspace config now exists with `pnpm-workspace.yaml`, `nx.json`, root TypeScript and ESLint config, a deterministic codegen command, and a local bootstrap helper.
        - Canonical workspace graph is scaffolded now rather than deferred: `{app_count}` apps, `{service_count}` services, `{package_count}` packages, and `{tool_count}` tool/test workspaces.
        - `docs/architecture/42_foundation_shell_gallery.html` makes shell identity, ownership, automation markers, and parity posture visible without external assets.
        - The scaffold manifest records both package-manager workspaces and non-package canonical artifacts so the topology remains explicit.

        ## Workspace table

        | Project | Repo path | Type | Owner | Scripts |
        | --- | --- | --- | --- | --- |
        {rows}

        ## Canonical artifacts kept outside the pnpm workspace

        | Artifact | Repo path | Type | Owner | Reason |
        | --- | --- | --- | --- | --- |
        {non_workspace_rows}

        `docs/architecture`, `tools/analysis`, and `tools/architecture` stay outside the package-manager workspace on purpose. They already hold validated generated documents, Python validators, and architecture control payloads. Seq_042 references them from root commands instead of sweeping them into a synthetic JS package.

        ## Legacy directories intentionally excluded from the canonical workspace graph

        {legacy_list}

        These existing mock apps and mock services remain in the repository but are not absorbed into the canonical monorepo graph. The scaffold manifest records them as legacy exclusions so task `041` stays authoritative.

        ## Shell placeholder rules implemented now

        - Each app imports the shared design system package and uses a unique root `data-testid` marker from day one.
        - Each shell has a visibly different composition while staying inside the shared canvas, token, and motion law.
        - Every visual section has adjacent parity text or table rows so accessibility and automation can inspect the same state.
        - No placeholder shell claims live domain truth it does not own.
        """
    ).strip()


def build_manifest(
    topology_manifest: dict[str, Any],
    workspace_entries: list[dict[str, Any]],
    non_workspace_entries: list[dict[str, Any]],
    legacy_dirs: list[str],
    gallery_payload: dict[str, Any],
) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "captured_on": CAPTURED_ON,
        "generated_at": GENERATED_AT,
        "mission": MISSION,
        "toolchain": "pnpm + Nx",
        "source_precedence": [
            "prompt/042.md",
            "prompt/041.md",
            "prompt/043.md",
            "prompt/044.md",
            "prompt/shared_operating_contract_036_to_045.md",
            "prompt/AGENT.md",
            "prompt/checklist.md",
            "docs/architecture/12_monorepo_build_system_decision.md",
            "docs/architecture/12_developer_experience_and_local_bootstrap.md",
            "data/analysis/repo_topology_manifest.json",
            "docs/architecture/41_repository_topology_rules.md",
            "docs/architecture/41_package_boundary_rules.md",
        ],
        "summary": {
            "topology_artifact_count": topology_manifest["summary"]["artifact_count"],
            "workspace_enabled_count": len(workspace_entries),
            "non_workspace_artifact_count": len(non_workspace_entries),
            "app_count": len([item for item in workspace_entries if item["artifact_type"] == "app"]),
            "service_count": len([item for item in workspace_entries if item["artifact_type"] == "service"]),
            "package_count": len([item for item in workspace_entries if item["artifact_type"] == "package"]),
            "tool_workspace_count": len([item for item in workspace_entries if item["artifact_type"] == "tools-only"]),
            "legacy_exclusion_count": len(legacy_dirs),
            "shell_gallery_count": len(gallery_payload["shells"]),
        },
        "workspace_entries": workspace_entries,
        "non_workspace_entries": non_workspace_entries,
        "legacy_exclusions": legacy_dirs,
        "shell_gallery": gallery_payload,
    }


def main() -> None:
    topology_manifest = read_json(TOPOLOGY_PATH)
    artifacts = topology_manifest["artifacts"]
    artifact_by_id = {artifact["artifact_id"]: artifact for artifact in artifacts}
    topology_paths = {artifact["repo_path"] for artifact in artifacts}
    legacy_dirs = legacy_noncanonical_paths(topology_paths)

    app_artifacts = [artifact for artifact in artifacts if artifact["artifact_type"] == "app"]
    service_artifacts = [artifact for artifact in artifacts if artifact["artifact_type"] == "service"]
    package_artifacts = [artifact for artifact in artifacts if artifact["artifact_type"] == "package"]
    tests_artifact = artifact_by_id["tool_playwright"]
    assistive_artifact = artifact_by_id["tool_assistive_control_lab"]

    workspace_artifacts = [artifact for artifact in artifacts if workspace_enabled(artifact)]
    non_workspace_artifacts = [artifact for artifact in artifacts if artifact["artifact_id"] in NON_WORKSPACE_SPECIALS]

    workspace_paths = [artifact["repo_path"] for artifact in app_artifacts + service_artifacts]
    workspace_paths.extend(["packages/*", "packages/domains/*", tests_artifact["repo_path"], assistive_artifact["repo_path"]])
    dev_projects = [project_name_for_artifact(artifact) for artifact in app_artifacts + service_artifacts]

    path_map = {
        package_name_for_artifact(artifact): [
            f"{artifact['repo_path']}/src/index.tsx" if artifact["artifact_id"] == "package_design_system" else f"{artifact['repo_path']}/src/index.ts"
        ]
        for artifact in package_artifacts + [assistive_artifact]
    }
    path_map["@vecells/design-system/foundation.css"] = ["packages/design-system/src/foundation.css"]

    shell_contracts = shell_contracts_from_topology(app_artifacts)
    release_postures = json.loads(json.dumps({slug: {
        "ring": "alpha",
        "publication": "watch" if contract["routeCount"] > 5 else "controlled",
        "owner": contract["ownerContext"],
        "automationGate": "stable data-testid contract",
    } for slug, contract in shell_contracts.items()}))
    gallery_shells = []
    for artifact in app_artifacts:
        slug = repo_slug(artifact["repo_path"])
        shell = dict(SHELLS[slug])
        shell["contract"] = shell_contracts[slug]
        shell["release"] = release_postures[slug]
        gallery_shells.append(shell)
    gallery_payload = {
        "task": TASK_ID,
        "heroSummary": [
            "pnpm + Nx",
            "7 distinct shell placeholders",
            "no external assets",
            "parity beside every visual",
        ],
        "shells": gallery_shells,
    }

    write_json(ROOT_PACKAGE_PATH, build_root_package_json(dev_projects))
    write_text(PNPM_WORKSPACE_PATH, build_pnpm_workspace(workspace_paths))
    write_json(NX_PATH, build_nx_json())
    write_json(ROOT_TSCONFIG_PATH, build_root_tsconfig(path_map))
    write_text(ESLINT_PATH, build_eslint_config())
    write_text(VITEST_WORKSPACE_PATH, build_vitest_workspace())
    write_text(ENV_EXAMPLE_PATH, build_env_example(app_artifacts, service_artifacts))
    write_text(DEV_BOOTSTRAP_PATH, build_dev_bootstrap())
    write_text(DEV_BOOTSTRAP_README_PATH, build_dev_bootstrap_readme())

    workspace_entries: list[dict[str, Any]] = []
    non_workspace_entries: list[dict[str, Any]] = []

    for artifact in app_artifacts:
        slug = repo_slug(artifact["repo_path"])
        shell = SHELLS[slug]
        repo_root = ROOT / artifact["repo_path"]
        scripts = build_app_scripts(slug)
        package_name = package_name_for_artifact(artifact)
        write_json(
            repo_root / "package.json",
            build_package_json(
                package_name=package_name,
                description=f"{artifact['display_name']} placeholder shell scaffold.",
                scripts=scripts,
                dependencies={
                    "react": REACT_VERSION,
                    "react-dom": REACT_DOM_VERSION,
                    "@vecells/api-contracts": "workspace:*",
                    "@vecells/design-system": "workspace:*",
                    "@vecells/observability": "workspace:*",
                    "@vecells/release-controls": "workspace:*",
                },
            ),
        )
        write_json(repo_root / "tsconfig.json", build_tsconfig_app())
        write_text(repo_root / "vite.config.ts", build_vite_config())
        write_text(repo_root / "index.html", build_app_index_html(artifact["display_name"]))
        write_text(repo_root / "src" / "main.tsx", build_main_tsx())
        write_text(repo_root / "src" / "vite-env.d.ts", build_vite_env())
        write_text(repo_root / "src" / "App.tsx", build_shell_app_source(artifact, shell))
        write_json(
            repo_root / "project.json",
            build_project_json(
                artifact=artifact,
                project_type="application",
                source_root=f"{artifact['repo_path']}/src",
                has_dev=True,
                has_preview=True,
            ),
        )
        extra = f"\n\n## Stable markers\n\n- Root landmark: `{root_marker_for_shell(slug)}`\n- Visual marker: `{slug}::visual`\n- Parity marker: `{slug}::parity`"
        write_text(repo_root / "README.md", build_workspace_readme(artifact, package_name=package_name, scripts=scripts, extra=extra))
        workspace_entries.append(
            {
                "artifact_id": artifact["artifact_id"],
                "project_name": project_name_for_artifact(artifact),
                "package_name": package_name,
                "repo_path": artifact["repo_path"],
                "artifact_type": artifact["artifact_type"],
                "owner_context_code": artifact["owner_context_code"],
                "workspace_enabled": True,
                "script_names": list(scripts.keys()),
                "root_marker": root_marker_for_shell(slug),
            }
        )

    shared_package_sources = {
        "package_domain_kernel": build_domain_kernel_source(),
        "package_event_contracts": build_event_contracts_source(),
        "package_api_contracts": build_api_contracts_source(shell_contracts),
        "package_fhir_mapping": build_fhir_mapping_source(),
        "package_design_system": build_design_system_source(),
        "package_authz_policy": build_authz_policy_source(),
        "package_test_fixtures": build_test_fixtures_source(shell_contracts),
        "package_observability": build_observability_source(),
        "package_release_controls": build_release_controls_source(shell_contracts),
    }

    shared_package_dependencies = {
        "package_domain_kernel": {},
        "package_event_contracts": {"@vecells/domain-kernel": "workspace:*"},
        "package_api_contracts": {
            "@vecells/domain-kernel": "workspace:*",
            "@vecells/event-contracts": "workspace:*",
        },
        "package_fhir_mapping": {
            "@vecells/domain-kernel": "workspace:*",
            "@vecells/event-contracts": "workspace:*",
        },
        "package_design_system": {"react": REACT_VERSION, "react-dom": REACT_DOM_VERSION},
        "package_authz_policy": {
            "@vecells/domain-kernel": "workspace:*",
            "@vecells/event-contracts": "workspace:*",
        },
        "package_test_fixtures": {
            "@vecells/domain-kernel": "workspace:*",
            "@vecells/event-contracts": "workspace:*",
            "@vecells/api-contracts": "workspace:*",
        },
        "package_observability": {"@vecells/domain-kernel": "workspace:*"},
        "package_release_controls": {
            "@vecells/domain-kernel": "workspace:*",
            "@vecells/event-contracts": "workspace:*",
            "@vecells/api-contracts": "workspace:*",
        },
    }

    for artifact in package_artifacts:
        repo_root = ROOT / artifact["repo_path"]
        scripts = build_generic_ts_library_scripts()
        package_name = package_name_for_artifact(artifact)
        dependencies = shared_package_dependencies.get(artifact["artifact_id"], {})
        if artifact["repo_path"].startswith("packages/domains/"):
            dependencies = {
                "@vecells/domain-kernel": "workspace:*",
                "@vecells/event-contracts": "workspace:*",
                "@vecells/authz-policy": "workspace:*",
                "@vecells/observability": "workspace:*",
            }
        write_json(
            repo_root / "package.json",
            build_package_json(
                package_name=package_name,
                description=f"{artifact['display_name']} scaffold package.",
                scripts=scripts,
                dependencies=dependencies,
                source_export="./src/index.tsx" if artifact["artifact_id"] == "package_design_system" else "./src/index.ts",
                extra_exports={"./foundation.css": "./src/foundation.css"} if artifact["artifact_id"] == "package_design_system" else None,
            ),
        )
        write_json(repo_root / "tsconfig.json", build_tsconfig_library(artifact["repo_path"]))
        source = shared_package_sources.get(artifact["artifact_id"], build_domain_package_source(artifact) if artifact["repo_path"].startswith("packages/domains/") else build_generic_package_source(artifact))
        write_text(repo_root / "src" / ("index.tsx" if artifact["artifact_id"] == "package_design_system" else "index.ts"), source)
        if artifact["artifact_id"] == "package_design_system":
            stale_entry = repo_root / "src" / "index.ts"
            if stale_entry.exists():
                stale_entry.unlink()
            write_text(repo_root / "src" / "foundation.css", build_design_system_css())
        write_json(
            repo_root / "project.json",
            build_project_json(
                artifact=artifact,
                project_type="library",
                source_root=f"{artifact['repo_path']}/src",
            ),
        )
        write_text(repo_root / "README.md", build_workspace_readme(artifact, package_name=package_name, scripts=scripts))
        workspace_entries.append(
            {
                "artifact_id": artifact["artifact_id"],
                "project_name": project_name_for_artifact(artifact),
                "package_name": package_name,
                "repo_path": artifact["repo_path"],
                "artifact_type": artifact["artifact_type"],
                "owner_context_code": artifact["owner_context_code"],
                "workspace_enabled": True,
                "script_names": list(scripts.keys()),
            }
        )

    service_sources = {
        "service_api_gateway": build_service_source(
            artifact_by_id["service_api_gateway"],
            [
                'import { shellSurfaceContracts } from "@vecells/api-contracts";',
                'import { foundationPolicyScopes } from "@vecells/authz-policy";',
                'import { foundationReleasePosture } from "@vecells/release-controls";',
                'import { createShellSignal } from "@vecells/observability";',
            ],
            dedent(
                """
                {
                  service: "api-gateway",
                  ownerContext: "platform_runtime",
                  note: "Gateway placeholder exposes route and release posture without claiming command completeness.",
                  routeFamilies: Object.values(shellSurfaceContracts).reduce((count, item) => count + item.routeCount, 0),
                  gatewaySurfaces: Object.values(shellSurfaceContracts).reduce((count, item) => count + item.gatewayCount, 0),
                  samplePolicies: Object.keys(foundationPolicyScopes),
                  watchSignals: Object.values(shellSurfaceContracts).slice(0, 2).map((item) =>
                    createShellSignal(item.shellSlug, item.routeFamilyIds, item.gatewaySurfaceIds),
                  ),
                  releasePosture: foundationReleasePosture["patient-web"],
                }
                """
            ).strip(),
            "/contracts",
        ),
        "service_command_api": build_service_source(
            artifact_by_id["service_command_api"],
            [
                'import { makeFoundationEvent } from "@vecells/event-contracts";',
                'import { foundationPolicyScopes } from "@vecells/authz-policy";',
                'import { packageMetadata as kernelMetadata } from "@vecells/domain-kernel";',
            ],
            dedent(
                """
                {
                  service: "command-api",
                  ownerContext: "platform_runtime",
                  note: "Command placeholder exposes event envelopes and policy scopes, not live mutation semantics.",
                  sampleCommand: makeFoundationEvent("command.placeholder.accepted", {
                    commandId: "cmd-foundation-001",
                    reviewerScope: foundationPolicyScopes.triage_review,
                    kernel: kernelMetadata,
                  }),
                }
                """
            ).strip(),
            "/commands",
        ),
        "service_projection_worker": build_service_source(
            artifact_by_id["service_projection_worker"],
            [
                'import { makeFoundationEvent } from "@vecells/event-contracts";',
                'import { foundationFhirMappings } from "@vecells/fhir-mapping";',
                'import { createShellSignal } from "@vecells/observability";',
            ],
            dedent(
                """
                {
                  service: "projection-worker",
                  ownerContext: "platform_runtime",
                  note: "Projection placeholder exposes mapping posture and worker heartbeat, not authoritative projections.",
                  projectionEvent: makeFoundationEvent("projection.placeholder.rebuilt", {
                    mappings: foundationFhirMappings,
                    watch: createShellSignal("ops-console", ["rf_ops_board"], ["gws_ops_telemetry"]),
                  }),
                }
                """
            ).strip(),
            "/projections",
        ),
        "service_notification_worker": build_service_source(
            artifact_by_id["service_notification_worker"],
            [
                'import { domainModule as communicationsDomain } from "@vecells/domain-communications";',
                'import { domainModule as supportDomain } from "@vecells/domain-support";',
                'import { domainModule as identityDomain } from "@vecells/domain-identity-access";',
                'import { foundationPolicyScopes } from "@vecells/authz-policy";',
            ],
            dedent(
                """
                {
                  service: "notification-worker",
                  ownerContext: "platform_integration",
                  note: "Notification placeholder exposes supported domains and policy envelopes without using real providers.",
                  domains: [communicationsDomain, supportDomain, identityDomain],
                  scopes: foundationPolicyScopes,
                }
                """
            ).strip(),
            "/notifications",
        ),
        "service_adapter_simulators": build_adapter_simulator_service_source(),
    }

    service_dependencies = {
        "service_api_gateway": {
            "@vecells/api-contracts": "workspace:*",
            "@vecells/authz-policy": "workspace:*",
            "@vecells/observability": "workspace:*",
            "@vecells/release-controls": "workspace:*",
        },
        "service_command_api": {
            "@vecells/domain-kernel": "workspace:*",
            "@vecells/event-contracts": "workspace:*",
            "@vecells/authz-policy": "workspace:*",
        },
        "service_projection_worker": {
            "@vecells/event-contracts": "workspace:*",
            "@vecells/fhir-mapping": "workspace:*",
            "@vecells/observability": "workspace:*",
        },
        "service_notification_worker": {
            "@vecells/domain-communications": "workspace:*",
            "@vecells/domain-identity-access": "workspace:*",
            "@vecells/domain-support": "workspace:*",
            "@vecells/authz-policy": "workspace:*",
        },
        "service_adapter_simulators": {
            "@vecells/api-contracts": "workspace:*",
            "@vecells/fhir-mapping": "workspace:*",
            "@vecells/test-fixtures": "workspace:*",
        },
    }

    for artifact in service_artifacts:
        repo_root = ROOT / artifact["repo_path"]
        scripts = build_service_scripts()
        package_name = package_name_for_artifact(artifact)
        write_json(
            repo_root / "package.json",
            build_package_json(
                package_name=package_name,
                description=f"{artifact['display_name']} placeholder service scaffold.",
                scripts=scripts,
                dependencies=service_dependencies.get(artifact["artifact_id"], {}),
            ),
        )
        write_json(repo_root / "tsconfig.json", build_tsconfig_library(artifact["repo_path"]))
        write_text(repo_root / "src" / "index.ts", service_sources[artifact["artifact_id"]])
        write_json(
            repo_root / "project.json",
            build_project_json(
                artifact=artifact,
                project_type="application",
                source_root=f"{artifact['repo_path']}/src",
                has_dev=True,
            ),
        )
        write_text(repo_root / "README.md", build_workspace_readme(artifact, package_name=package_name, scripts=scripts))
        workspace_entries.append(
            {
                "artifact_id": artifact["artifact_id"],
                "project_name": project_name_for_artifact(artifact),
                "package_name": package_name,
                "repo_path": artifact["repo_path"],
                "artifact_type": artifact["artifact_type"],
                "owner_context_code": artifact["owner_context_code"],
                "workspace_enabled": True,
                "script_names": list(scripts.keys()),
                "service_port": SERVICE_PORTS[repo_slug(artifact["repo_path"])],
            }
        )

    assistive_root = ROOT / assistive_artifact["repo_path"]
    assistive_scripts = build_assistive_lab_scripts()
    assistive_package_name = package_name_for_artifact(assistive_artifact)
    write_json(
        assistive_root / "package.json",
        build_package_json(
            package_name=assistive_package_name,
            description="Conditional assistive control lab scaffold.",
            scripts=assistive_scripts,
            dependencies={
                "@vecells/api-contracts": "workspace:*",
                "@vecells/release-controls": "workspace:*",
                "@vecells/observability": "workspace:*",
            },
            source_export="./src/index.ts",
        ),
    )
    write_json(assistive_root / "tsconfig.json", build_tsconfig_library(assistive_artifact["repo_path"]))
    write_text(assistive_root / "src" / "index.ts", build_assistive_lab_source())
    write_json(
        assistive_root / "project.json",
        build_project_json(
            artifact=assistive_artifact,
            project_type="library",
            source_root=f"{assistive_artifact['repo_path']}/src",
            has_dev=True,
        ),
    )
    assistive_extra = "\n\n## Conditional posture\n\n- This workspace remains tools-only.\n- It is intentionally excluded from root `dev` until later tasks activate the assistive sidecar."
    write_text(
        assistive_root / "README.md",
        build_workspace_readme(assistive_artifact, package_name=assistive_package_name, scripts=assistive_scripts, extra=assistive_extra),
    )
    workspace_entries.append(
        {
            "artifact_id": assistive_artifact["artifact_id"],
            "project_name": project_name_for_artifact(assistive_artifact),
            "package_name": assistive_package_name,
            "repo_path": assistive_artifact["repo_path"],
            "artifact_type": assistive_artifact["artifact_type"],
            "owner_context_code": assistive_artifact["owner_context_code"],
            "workspace_enabled": True,
            "script_names": list(assistive_scripts.keys()),
        }
    )

    tests_root = ROOT / tests_artifact["repo_path"]
    tests_scripts = build_tests_workspace_scripts()
    tests_package_name = package_name_for_artifact(tests_artifact)
    write_json(
        tests_root / "package.json",
        build_package_json(
            package_name=tests_package_name,
            description="Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, design contract, and audit ledger browser checks.",
            scripts=tests_scripts,
        ),
    )
    write_json(
        tests_root / "project.json",
        build_project_json(
            artifact=tests_artifact,
            project_type="library",
            source_root=tests_artifact["repo_path"],
            has_e2e=True,
        ),
    )
    write_text(tests_root / "README.md", build_tests_workspace_readme())
    workspace_entries.append(
        {
            "artifact_id": tests_artifact["artifact_id"],
            "project_name": project_name_for_artifact(tests_artifact),
            "package_name": tests_package_name,
            "repo_path": tests_artifact["repo_path"],
            "artifact_type": tests_artifact["artifact_type"],
            "owner_context_code": tests_artifact["owner_context_code"],
            "workspace_enabled": True,
            "script_names": list(tests_scripts.keys()),
        }
    )

    for artifact in non_workspace_artifacts:
        non_workspace_entries.append(
            {
                "artifact_id": artifact["artifact_id"],
                "repo_path": artifact["repo_path"],
                "artifact_type": artifact["artifact_type"],
                "owner_context_code": artifact["owner_context_code"],
                "workspace_reason": "Existing validated docs and Python control roots stay outside pnpm workspace while remaining canonical.",
            }
        )

    workspace_entries.sort(key=lambda item: item["repo_path"])
    non_workspace_entries.sort(key=lambda item: item["repo_path"])

    write_text(
        PLAN_PATH,
        build_plan_markdown(
            workspace_entries=workspace_entries,
            non_workspace_entries=non_workspace_entries,
            legacy_dirs=legacy_dirs,
        ),
    )
    write_text(GALLERY_PATH, build_gallery_html(gallery_payload))

    manifest = build_manifest(
        topology_manifest=topology_manifest,
        workspace_entries=workspace_entries,
        non_workspace_entries=non_workspace_entries,
        legacy_dirs=legacy_dirs,
        gallery_payload=gallery_payload,
    )
    write_json(OUTPUT_MANIFEST_PATH, manifest)

    print(
        f"{TASK_ID} scaffold generated: "
        f"{manifest['summary']['workspace_enabled_count']} workspaces, "
        f"{manifest['summary']['non_workspace_artifact_count']} non-workspace canonical artifacts, "
        f"{manifest['summary']['legacy_exclusion_count']} legacy exclusions."
    )


if __name__ == "__main__":
    main()
