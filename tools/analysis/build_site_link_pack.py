#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-nhs-app-site-link-studio"
APP_SRC_DIR = APP_DIR / "src"
APP_PUBLIC_DIR = APP_DIR / "public"
INFRA_DIR = ROOT / "infra" / "site-links"

TASK_ID = "seq_030"
CAPTURED_ON = "2026-04-09"
VISUAL_MODE = "Linkloom_Metadata_Studio"
MISSION = (
    "Create the NHS App site-link metadata execution pack with one rehearsal-grade placeholder "
    "generator now and one gated environment-specific registration strategy later, while keeping "
    "site links bound to route families, continuity law, and safe return."
)

ALLOWLIST_CSV_PATH = DATA_DIR / "site_link_route_allowlist.csv"
ENV_MATRIX_JSON_PATH = DATA_DIR / "site_link_environment_matrix.json"
PLACEHOLDERS_JSON_PATH = DATA_DIR / "site_link_placeholder_values.json"

STRATEGY_DOC_PATH = DOCS_DIR / "30_site_link_placeholder_strategy.md"
GEN_SPEC_DOC_PATH = DOCS_DIR / "30_assetlinks_and_aasa_generation_spec.md"
ALLOWLIST_DOC_PATH = DOCS_DIR / "30_route_path_allowlist_and_return_rules.md"
HOSTING_DOC_PATH = DOCS_DIR / "30_real_registration_and_hosting_strategy.md"

ASSETLINKS_TEMPLATE_PATH = INFRA_DIR / "assetlinks.template.json"
AASA_TEMPLATE_PATH = INFRA_DIR / "apple-app-site-association.template.json"

APP_PACK_TS_PATH = APP_SRC_DIR / "generated" / "siteLinkPack.ts"
APP_PACK_JSON_PATH = APP_PUBLIC_DIR / "site-link-environment-matrix.json"
APP_README_PATH = APP_DIR / "README.md"
APP_PUBLIC_ASSETLINKS_PATH = APP_PUBLIC_DIR / ".well-known" / "assetlinks.json"
APP_PUBLIC_AASA_PATH = APP_PUBLIC_DIR / ".well-known" / "apple-app-site-association"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "route_family_inventory": DATA_DIR / "route_family_inventory.csv",
    "channel_inventory": DATA_DIR / "channel_inventory.json",
    "nhs_app_stage_progression": DATA_DIR / "nhs_app_stage_progression.json",
    "nhs_app_live_gates": DATA_DIR / "nhs_app_live_gate_checklist.json",
}

SOURCE_PRECEDENCE = [
    "prompt/030.md",
    "prompt/029.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.43 OutboundNavigationGrant",
    "blueprint/phase-0-the-foundation-protocol.md#40A Patient route entry, refresh, back-forward restore, deep-link resolution, step-up return, and recovery resume",
    "blueprint/phase-2-the-identity-and-echoes.md",
    "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity",
    "blueprint/phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours",
    "blueprint/phase-7-inside-the-nhs-app.md#7F. Webview limitations, file handling, and resilient error UX",
    "blueprint/platform-frontend-blueprint.md#OutboundNavigationGrant",
    "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/accessibility-and-content-system-contract.md",
    "blueprint/forensic-audit-findings.md#Finding 90 - The audit still omitted the hardened NHS App embedded-channel control plane",
    "blueprint/forensic-audit-findings.md#Finding 120 - Patient-facing degraded mode could still fragment across entry, section, recovery, embedded, and artifact shells",
    "docs/architecture/04_audience_surface_inventory.md",
    "docs/architecture/14_shell_and_route_runtime_architecture.md",
    "docs/architecture/14_gateway_bff_pattern_and_surface_split.md",
    "docs/external/29_nhs_app_onboarding_strategy.md",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
]

OFFICIAL_GUIDANCE = [
    {
        "source_id": "official_nhs_app_web_integration",
        "title": "NHS App web integration",
        "url": "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The NHS App process page remains the external owner for onboarding, environment "
            "progression, and change coordination. Site-link registration belongs inside that "
            "later onboarding lane rather than as a stand-alone shortcut."
        ),
        "grounding": [
            "NHS App integration remains a managed onboarding path rather than an ad hoc supplier-side toggle.",
            "Environment progression still sits behind product review, design, sandpit, AOS, and later release gates.",
            "Channel rollout remains later and coordinated with the NHS App team.",
        ],
    },
    {
        "source_id": "official_web_integration_overview",
        "title": "Web Integration Overview",
        "url": "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The overview page confirms that supplier journeys run inside a tailored NHS App "
            "webview with NHS App-managed jump-off points rather than a separate supplier-owned app."
        ),
        "grounding": [
            "NHS App jump-off points remain coordinated with the onboarding team.",
            "Supplier journeys stay web-based and embedded rather than becoming a second mobile product.",
        ],
    },
    {
        "source_id": "official_web_integration_guidance",
        "title": "Web Integration Guidance",
        "url": "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The guidance page is the current source for supplier-side site-link mechanics and "
            "embedded traffic hints, including `from=nhsApp`, `assetlinks.json`, "
            "`apple-app-site-association`, and NHS App team-supplied environment values."
        ),
        "grounding": [
            "Traffic hints like `from=nhsApp` are guidance for styling and recognition, not standalone trust proof.",
            "Suppliers can enable links from SMS or email to open in NHS App through site links, but changes are required on both sides and must be coordinated with the onboarding team.",
            "Android requires `/.well-known/assetlinks.json` with environment-specific package name and certificate fingerprint supplied by the NHS App team.",
            "iOS requires `/.well-known/apple-app-site-association` with environment-specific `appID` and an explicit path list.",
            "Conventional file download does not work in the webview and browser print is not supported, so raw artifact URLs are not safe site-link targets.",
        ],
    },
    {
        "source_id": "official_js_api_v2",
        "title": "Javascript API v2 Specification",
        "url": "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The JS API v2 spec defines the embedded navigation and byte-delivery bridge, which "
            "shapes which linked routes are safe once the site link resolves into the embedded shell."
        ),
        "grounding": [
            "The current JS API exposes `goToPage`, `openBrowserOverlay`, `openExternalBrowser`, and `downloadFromBytes`.",
            "The embedded route still needs bridge capability and safe-return proof after the site link lands.",
            "The JS API should be loaded inline from the NHS App environment rather than bundled into the client.",
        ],
    },
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    assert_true(bool(rows), f"Cannot write empty CSV: {path}")
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def markdown_table(columns: list[str], rows: list[list[str]]) -> str:
    header = "| " + " | ".join(columns) + " |"
    divider = "| " + " | ".join("---" for _ in columns) + " |"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header, divider, *body])


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_030 prerequisites: " + ", ".join(sorted(missing)))

    phase0_gate = load_json(REQUIRED_INPUTS["phase0_gate_verdict"])
    route_rows = load_csv(REQUIRED_INPUTS["route_family_inventory"])
    channel_inventory = load_json(REQUIRED_INPUTS["channel_inventory"])
    nhs_app_progression = load_json(REQUIRED_INPUTS["nhs_app_stage_progression"])
    nhs_app_live_gates = load_json(REQUIRED_INPUTS["nhs_app_live_gates"])

    route_ids = {row["route_family_id"] for row in route_rows}
    required_routes = {
        "rf_intake_self_service",
        "rf_patient_secure_link_recovery",
        "rf_patient_requests",
        "rf_patient_appointments",
        "rf_patient_health_record",
        "rf_patient_messages",
    }
    assert_true(required_routes.issubset(route_ids), "Route family inventory is missing required patient route families for seq_030")
    assert_true(channel_inventory["inventory_id"] == "channel_inventory_v1", "Unexpected channel inventory version")
    assert_true(nhs_app_progression["task_id"] == "seq_029", "seq_029 NHS App pack is not present or drifted")
    assert_true(nhs_app_live_gates["verdict"] == "blocked", "seq_029 live gates must remain blocked before seq_030")
    assert_true(
        phase0_gate["planning_readiness"]["state"] == "ready_for_external_readiness",
        "Phase 0 planning readiness drifted unexpectedly",
    )
    return {
        "phase0_gate": phase0_gate,
        "route_rows": route_rows,
        "channel_inventory": channel_inventory,
        "nhs_app_progression": nhs_app_progression,
        "nhs_app_live_gates": nhs_app_live_gates,
    }


def route_lookup(route_rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    return {row["route_family_id"]: row for row in route_rows}


def build_live_gates(phase0_gate: dict[str, Any]) -> dict[str, Any]:
    live_gates = [
        {
            "gate_id": "LIVE_GATE_PHASE7_SCOPE_WINDOW",
            "label": "Phase 7 approved scope window",
            "status": "blocked",
            "summary": "Site-link registration stays deferred until the NHS App channel is inside an approved scope window.",
        },
        {
            "gate_id": "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
            "label": "External readiness chain clear",
            "status": "blocked",
            "summary": (
                "Phase 0 planning is ready for external-readiness work, but the current-baseline "
                "external gate remains withheld and still blocks any real NHS App mutation."
            ),
        },
        {
            "gate_id": "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
            "label": "Environment-specific package, certificate, and appID values supplied",
            "status": "blocked",
            "summary": "Android package name, Android certificate fingerprint, and iOS appID must come from the NHS App team per environment.",
        },
        {
            "gate_id": "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
            "label": "Path allowlist approved and traceable",
            "status": "review_required",
            "summary": "Every registered path must map back to one approved route family, safe return contract, and embedded-safe posture.",
        },
        {
            "gate_id": "LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT",
            "label": "Route continuity and embedded evidence current",
            "status": "review_required",
            "summary": "Linked routes must already satisfy session, continuity, artifact, and return-safe laws before registration.",
        },
        {
            "gate_id": "LIVE_GATE_DOMAIN_OWNERSHIP_PROVEN",
            "label": "Domain ownership, hosting path, and cache controls proven",
            "status": "review_required",
            "summary": "Real `.well-known` hosting requires owned HTTPS domains, exact paths, no hidden redirects, and governed cache controls.",
        },
        {
            "gate_id": "LIVE_GATE_NAMED_APPROVER_PRESENT",
            "label": "Named approver present",
            "status": "blocked",
            "summary": "No named approver is stored in repo fixtures or allowed by default in the rehearsal pack.",
        },
        {
            "gate_id": "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "label": "Environment target present",
            "status": "blocked",
            "summary": "Real registration must target exactly one environment: sandpit, AOS, or live.",
        },
        {
            "gate_id": "LIVE_GATE_MUTATION_FLAG_ENABLED",
            "label": "ALLOW_REAL_PROVIDER_MUTATION=true",
            "status": "blocked",
            "summary": "Dry-run remains the only default; real mutation is fail-closed until the explicit flag is set.",
        },
    ]
    return {
        "planning_readiness": phase0_gate["planning_readiness"]["state"],
        "phase0_entry_verdict": phase0_gate["summary"]["phase0_entry_verdict"],
        "verdict": "blocked",
        "live_gates": live_gates,
        "selector_map": {
            "studio_profile": {
                "environment_switcher": "[data-testid='environment-switcher']",
                "platform_switcher": "[data-testid='platform-switcher']",
                "route_tree": "[data-testid='route-tree']",
                "route_filter": "[data-testid='route-filter']",
                "page_allowlist": "[data-testid='page-tab-Route_Path_Allowlist']",
                "page_android": "[data-testid='page-tab-Android_Assetlinks_Generator']",
                "page_ios": "[data-testid='page-tab-iOS_AASA_Generator']",
                "page_hosting": "[data-testid='page-tab-Local_Hosting_Validator']",
                "page_gates": "[data-testid='page-tab-Real_Registration_Gates']",
                "hosting_panel": "[data-testid='local-hosting-panel']",
                "gate_board": "[data-testid='live-gate-board']",
                "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
                "actual_notice": "[data-testid='actual-submission-notice']",
                "actual_submit": "[data-testid='actual-submit-button']",
            }
        },
        "dry_run_defaults": {
            "default_target_url": "http://127.0.0.1:4181/?page=Real_Registration_Gates&mode=actual",
            "local_assetlinks_url": "http://127.0.0.1:4181/.well-known/assetlinks.json",
            "local_aasa_url": "http://127.0.0.1:4181/.well-known/apple-app-site-association",
        },
    }


def build_environment_profiles() -> list[dict[str, Any]]:
    return [
        {
            "env_id": "local_mock",
            "label": "Local mock",
            "registration_stage": "rehearsal_only",
            "actual_registration_allowed": False,
            "official_values_supplied": False,
            "values_source": "placeholder_only",
            "served_origin": "http://127.0.0.1:4181",
            "domain_placeholder": "links.local.vecells.test",
            "host_status": "local_preview_only",
            "host_notes": "Local hosting proves path shape and asset structure only; it does not prove production DNS or certificate posture.",
            "android_package_name": "__NHS_APP_ANDROID_PACKAGE_LOCAL_MOCK__",
            "android_cert_fingerprints": ["__NHS_APP_ANDROID_SHA256_LOCAL_MOCK__"],
            "ios_app_id": "__NHS_APP_IOS_APP_ID_LOCAL_MOCK__",
            "android_relation": "delegate_permission/common.handle_all_urls",
            "cache_control": "public, max-age=60, must-revalidate",
            "content_type_requirement": "application/json",
            "supplied_by": "Vecells placeholder generator only",
            "notes": "Used for local `.well-known` hosting validation and UI rehearsal.",
        },
        {
            "env_id": "sandpit_like",
            "label": "Sandpit-like",
            "registration_stage": "sandpit",
            "actual_registration_allowed": False,
            "official_values_supplied": False,
            "values_source": "awaiting_nhs_app_team",
            "served_origin": "https://links-sandpit.vecells.example",
            "domain_placeholder": "links-sandpit.vecells.example",
            "host_status": "placeholder_only",
            "host_notes": "The real host must be owned, approved, and coordinated with the onboarding team before registration.",
            "android_package_name": "__NHS_APP_ANDROID_PACKAGE_SANDPIT__",
            "android_cert_fingerprints": ["__NHS_APP_ANDROID_SHA256_SANDPIT__"],
            "ios_app_id": "__NHS_APP_IOS_APP_ID_SANDPIT__",
            "android_relation": "delegate_permission/common.handle_all_urls",
            "cache_control": "public, max-age=300, must-revalidate",
            "content_type_requirement": "application/json",
            "supplied_by": "NHS App onboarding team",
            "notes": "The first real environment where the NHS App team-supplied values become mandatory.",
        },
        {
            "env_id": "aos_like",
            "label": "AOS-like",
            "registration_stage": "aos",
            "actual_registration_allowed": False,
            "official_values_supplied": False,
            "values_source": "awaiting_nhs_app_team",
            "served_origin": "https://links-aos.vecells.example",
            "domain_placeholder": "links-aos.vecells.example",
            "host_status": "placeholder_only",
            "host_notes": "AOS remains blocked until sandpit evidence and environment-specific values are current.",
            "android_package_name": "__NHS_APP_ANDROID_PACKAGE_AOS__",
            "android_cert_fingerprints": ["__NHS_APP_ANDROID_SHA256_AOS__"],
            "ios_app_id": "__NHS_APP_IOS_APP_ID_AOS__",
            "android_relation": "delegate_permission/common.handle_all_urls",
            "cache_control": "public, max-age=300, must-revalidate",
            "content_type_requirement": "application/json",
            "supplied_by": "NHS App onboarding team",
            "notes": "AOS should reuse the same path discipline while carrying different official mobile values.",
        },
        {
            "env_id": "live_placeholder",
            "label": "Live placeholder",
            "registration_stage": "live",
            "actual_registration_allowed": False,
            "official_values_supplied": False,
            "values_source": "awaiting_nhs_app_team",
            "served_origin": "https://links.vecells.example",
            "domain_placeholder": "links.vecells.example",
            "host_status": "placeholder_only",
            "host_notes": "Production registration stays blocked until limited-release readiness, domain ownership proof, and official values all line up.",
            "android_package_name": "__NHS_APP_ANDROID_PACKAGE_LIVE__",
            "android_cert_fingerprints": ["__NHS_APP_ANDROID_SHA256_LIVE__"],
            "ios_app_id": "__NHS_APP_IOS_APP_ID_LIVE__",
            "android_relation": "delegate_permission/common.handle_all_urls",
            "cache_control": "public, max-age=600, must-revalidate",
            "content_type_requirement": "application/json",
            "supplied_by": "NHS App onboarding team",
            "notes": "The placeholder profile exists so final hosting and review can be prepared without claiming live values are already known.",
        },
    ]


def build_route_allowlist(route_rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    routes = route_lookup(route_rows)

    def label(route_id: str) -> str:
        return routes[route_id]["route_family"]

    common_gates = [
        "LIVE_GATE_PHASE7_SCOPE_WINDOW",
        "LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED",
        "LIVE_GATE_PATH_ALLOWLIST_APPROVED",
    ]
    return [
        {
            "path_id": "sl_start_request",
            "allowlist_decision": "approved",
            "route_family_ref": "rf_intake_self_service",
            "route_family_label": label("rf_intake_self_service"),
            "path_pattern": "/start-request",
            "patient_visible_purpose": "Start a new request in the same portal without inventing a second NHS App-only intake flow.",
            "embedded_safe": "yes",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "no",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/start-request",
            "selected_anchor_ref": "start_request_cta",
            "return_contract_ref": "PatientNavReturnContract(intake_entry)",
            "real_registration_gate_refs": common_gates,
            "source_refs": [
                "docs/external/29_nhs_app_onboarding_strategy.md",
                "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity",
            ],
            "notes": "Derived stable entry path for the rehearsal studio; no patient-specific data belongs in the URL.",
        },
        {
            "path_id": "sl_secure_recovery",
            "allowlist_decision": "approved",
            "route_family_ref": "rf_patient_secure_link_recovery",
            "route_family_label": label("rf_patient_secure_link_recovery"),
            "path_pattern": "/recovery/:recoveryToken",
            "patient_visible_purpose": "Resume a specific lineage from a secure continuation link while preserving same-shell recovery.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "no",
            "allows_secure_link_entry": "yes",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/recovery/*",
            "selected_anchor_ref": "recovery_resume_banner",
            "return_contract_ref": "PatientNavReturnContract(recovery_resume)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity",
            ],
            "notes": "The token is a grant envelope and must not be logged, copied into analytics, or treated as route truth on its own.",
        },
        {
            "path_id": "sl_requests_index",
            "allowlist_decision": "approved",
            "route_family_ref": "rf_patient_requests",
            "route_family_label": label("rf_patient_requests"),
            "path_pattern": "/requests",
            "patient_visible_purpose": "Open the patient’s request list with bounded summary and same-shell request continuity.",
            "embedded_safe": "yes",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/requests",
            "selected_anchor_ref": "request_list_primary",
            "return_contract_ref": "PatientNavReturnContract(requests_index)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "docs/architecture/14_shell_and_route_runtime_architecture.md",
            ],
            "notes": "This is a safe summary path, not a detached action URL.",
        },
        {
            "path_id": "sl_request_detail",
            "allowlist_decision": "approved",
            "route_family_ref": "rf_patient_requests",
            "route_family_label": label("rf_patient_requests"),
            "path_pattern": "/requests/:requestId",
            "patient_visible_purpose": "Open one request detail route after auth or governed recovery.",
            "embedded_safe": "yes",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/requests/*",
            "selected_anchor_ref": "request_detail_anchor",
            "return_contract_ref": "PatientNavReturnContract(request_detail)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity",
            ],
            "notes": "Raw request identifiers remain placeholders in the mock and must never carry PHI-bearing query fragments.",
        },
        {
            "path_id": "sl_request_conversation",
            "allowlist_decision": "conditional",
            "route_family_ref": "rf_patient_requests",
            "route_family_label": label("rf_patient_requests"),
            "path_pattern": "/requests/:requestId/conversation",
            "patient_visible_purpose": "Resume more-info or request conversation work inside the owning request shell.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/requests/*",
            "selected_anchor_ref": "request_conversation_anchor",
            "return_contract_ref": "PatientNavReturnContract(request_conversation)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-account-and-communications-blueprint.md",
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
            ],
            "notes": "The site link may land on the owning request shell, but live reply posture still depends on the current cycle-specific projection.",
        },
        {
            "path_id": "sl_appointments_index",
            "allowlist_decision": "approved",
            "route_family_ref": "rf_patient_appointments",
            "route_family_label": label("rf_patient_appointments"),
            "path_pattern": "/appointments",
            "patient_visible_purpose": "Open the appointment list with same-shell continuity and no detached booking fork.",
            "embedded_safe": "yes",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/appointments",
            "selected_anchor_ref": "appointment_list_primary",
            "return_contract_ref": "PatientNavReturnContract(appointments_index)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
            ],
            "notes": "This is the calm summary path for booking and manage work.",
        },
        {
            "path_id": "sl_appointment_manage",
            "allowlist_decision": "approved",
            "route_family_ref": "rf_patient_appointments",
            "route_family_label": label("rf_patient_appointments"),
            "path_pattern": "/appointments/:appointmentId/manage",
            "patient_visible_purpose": "Resume appointment manage, reminder, or calendar actions within the same appointment shell.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "yes",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/appointments/*",
            "selected_anchor_ref": "appointment_manage_panel",
            "return_contract_ref": "PatientNavReturnContract(appointment_manage)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "blueprint/phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours",
            ],
            "notes": "Calendar or browser-handoff actions stay secondary and require the current embedded capability and return-safe grant.",
        },
        {
            "path_id": "sl_booking_select",
            "allowlist_decision": "conditional",
            "route_family_ref": "rf_patient_appointments",
            "route_family_label": label("rf_patient_appointments"),
            "path_pattern": "/bookings/:bookingCaseId/select",
            "patient_visible_purpose": "Review waitlist or alternative slot selection inside the governed booking shell.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/bookings/*",
            "selected_anchor_ref": "booking_select_anchor",
            "return_contract_ref": "PatientNavReturnContract(booking_select)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "blueprint/phase-4-the-booking-engine.md",
            ],
            "notes": "This placeholder path covers waitlist-offer and hub-alternative review without claiming a final mobile path taxonomy is already frozen.",
        },
        {
            "path_id": "sl_booking_confirm",
            "allowlist_decision": "conditional",
            "route_family_ref": "rf_patient_appointments",
            "route_family_label": label("rf_patient_appointments"),
            "path_pattern": "/bookings/:bookingCaseId/confirm",
            "patient_visible_purpose": "Continue confirmation inside the booking shell without exposing a direct raw accept URL.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/bookings/*",
            "selected_anchor_ref": "booking_confirm_anchor",
            "return_contract_ref": "PatientNavReturnContract(booking_confirm)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "blueprint/phase-4-the-booking-engine.md",
            ],
            "notes": "Confirmation remains inside the same shell and must not become an action-only deep link.",
        },
        {
            "path_id": "sl_record_result",
            "allowlist_decision": "conditional",
            "route_family_ref": "rf_patient_health_record",
            "route_family_label": label("rf_patient_health_record"),
            "path_pattern": "/records/results/:resultId",
            "patient_visible_purpose": "Open a result summary route that can degrade to summary-first if byte delivery is not safe.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "yes",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/records/results/*",
            "selected_anchor_ref": "record_result_summary",
            "return_contract_ref": "PatientNavReturnContract(record_result)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "blueprint/platform-frontend-blueprint.md#OutboundNavigationGrant",
            ],
            "notes": "The linked route is safe; any later document handoff still needs artifact-mode truth and an outbound grant.",
        },
        {
            "path_id": "sl_record_document",
            "allowlist_decision": "conditional",
            "route_family_ref": "rf_patient_health_record",
            "route_family_label": label("rf_patient_health_record"),
            "path_pattern": "/records/documents/:documentId",
            "patient_visible_purpose": "Open one document summary route inside the record shell, with byte-safe preview only when allowed.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "yes",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/records/documents/*",
            "selected_anchor_ref": "record_document_summary",
            "return_contract_ref": "PatientNavReturnContract(record_document)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "blueprint/patient-account-and-communications-blueprint.md",
            ],
            "notes": "Structured same-shell summary is the default; raw file or print exits remain secondary and governed.",
        },
        {
            "path_id": "sl_messages_cluster",
            "allowlist_decision": "approved",
            "route_family_ref": "rf_patient_messages",
            "route_family_label": label("rf_patient_messages"),
            "path_pattern": "/messages/:clusterId",
            "patient_visible_purpose": "Open a message cluster summary with bounded reply and callback continuity.",
            "embedded_safe": "yes",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/messages/*",
            "selected_anchor_ref": "message_cluster_anchor",
            "return_contract_ref": "PatientNavReturnContract(messages_cluster)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
            ],
            "notes": "Cluster-level entry preserves the owning conversation shell.",
        },
        {
            "path_id": "sl_message_thread",
            "allowlist_decision": "conditional",
            "route_family_ref": "rf_patient_messages",
            "route_family_label": label("rf_patient_messages"),
            "path_pattern": "/messages/:clusterId/thread/:threadId",
            "patient_visible_purpose": "Resume a specific thread inside the owning message cluster shell.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/messages/*",
            "selected_anchor_ref": "message_thread_anchor",
            "return_contract_ref": "PatientNavReturnContract(message_thread)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
            ],
            "notes": "The route may be linked, but return-safe resolution still belongs to the same cluster shell.",
        },
        {
            "path_id": "sl_message_callback",
            "allowlist_decision": "conditional",
            "route_family_ref": "rf_patient_messages",
            "route_family_label": label("rf_patient_messages"),
            "path_pattern": "/messages/:clusterId/callback/:callbackCaseId",
            "patient_visible_purpose": "Resume callback or live-contact instructions within the owning message shell.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/messages/*",
            "selected_anchor_ref": "callback_case_anchor",
            "return_contract_ref": "PatientNavReturnContract(callback_case)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "blueprint/patient-account-and-communications-blueprint.md",
            ],
            "notes": "Callback posture may still downgrade to repair or recovery inside the same shell.",
        },
        {
            "path_id": "sl_contact_repair",
            "allowlist_decision": "conditional",
            "route_family_ref": "rf_patient_messages",
            "route_family_label": label("rf_patient_messages"),
            "path_pattern": "/contact-repair/:repairCaseId",
            "patient_visible_purpose": "Repair reachability or recipient issues while preserving the blocked action context.",
            "embedded_safe": "conditional",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "yes",
            "placeholder_in_mock": "yes",
            "include_by_default": True,
            "ios_path_pattern": "/contact-repair/*",
            "selected_anchor_ref": "contact_repair_anchor",
            "return_contract_ref": "PatientNavReturnContract(contact_repair)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
                "blueprint/patient-account-and-communications-blueprint.md",
            ],
            "notes": "Reachability repair stays in-shell and must not break the blocked offer or callback context.",
        },
        {
            "path_id": "sl_raw_document_download",
            "allowlist_decision": "rejected",
            "route_family_ref": "rf_patient_health_record",
            "route_family_label": label("rf_patient_health_record"),
            "path_pattern": "/records/documents/:documentId/download",
            "patient_visible_purpose": "Direct raw byte or detached export endpoint.",
            "embedded_safe": "no",
            "requires_outbound_navigation_grant": "yes",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "no",
            "placeholder_in_mock": "no",
            "include_by_default": False,
            "ios_path_pattern": "",
            "selected_anchor_ref": "artifact_summary_panel",
            "return_contract_ref": "PatientNavReturnContract(record_document)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/platform-frontend-blueprint.md#OutboundNavigationGrant",
                "blueprint/patient-account-and-communications-blueprint.md",
            ],
            "notes": "Rejected: raw artifact URLs and detached export routes are forbidden; patients must land in the record shell first.",
        },
        {
            "path_id": "sl_detached_message_alias",
            "allowlist_decision": "rejected",
            "route_family_ref": "rf_patient_messages",
            "route_family_label": label("rf_patient_messages"),
            "path_pattern": "/messages/:threadId",
            "patient_visible_purpose": "Detached alias directly to a thread without the owning cluster shell.",
            "embedded_safe": "no",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "no",
            "placeholder_in_mock": "no",
            "include_by_default": False,
            "ios_path_pattern": "",
            "selected_anchor_ref": "message_thread_anchor",
            "return_contract_ref": "PatientNavReturnContract(message_thread)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/patient-portal-experience-architecture-blueprint.md#1. Shell and route map",
            ],
            "notes": "Rejected: aliases must resolve into the owning cluster shell rather than exposing a second detached message entry contract.",
        },
        {
            "path_id": "sl_raw_accept_action",
            "allowlist_decision": "rejected",
            "route_family_ref": "rf_patient_appointments",
            "route_family_label": label("rf_patient_appointments"),
            "path_pattern": "/bookings/:bookingCaseId/accept",
            "patient_visible_purpose": "Direct mutation-style booking acceptance URL.",
            "embedded_safe": "no",
            "requires_outbound_navigation_grant": "no",
            "requires_authenticated_session": "yes",
            "allows_secure_link_entry": "no",
            "allows_from_nhs_app_query_marker": "no",
            "placeholder_in_mock": "no",
            "include_by_default": False,
            "ios_path_pattern": "",
            "selected_anchor_ref": "booking_confirm_anchor",
            "return_contract_ref": "PatientNavReturnContract(booking_confirm)",
            "real_registration_gate_refs": common_gates + ["LIVE_GATE_CONTINUITY_EVIDENCE_CURRENT"],
            "source_refs": [
                "blueprint/phase-4-the-booking-engine.md",
                "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity",
            ],
            "notes": "Rejected: direct action URLs would overexpose live mutation and bypass the governed booking shell.",
        },
    ]


def build_placeholder_registry(environment_profiles: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "placeholder_domains": [env["domain_placeholder"] for env in environment_profiles],
        "template_tokens": {
            "ANDROID_PACKAGE_NAME": "Environment-specific Android package name supplied by the NHS App team",
            "ANDROID_SHA256_CERT_FINGERPRINT": "Environment-specific Android certificate fingerprint supplied by the NHS App team",
            "IOS_APP_ID": "Environment-specific iOS appID supplied by the NHS App team",
            "IOS_PATHS_ALLOWLIST": "Expanded from the approved route path allowlist for the selected environment",
        },
        "host_management_defaults": {
            "local_mock": "127.0.0.1:4181",
            "sandpit_like": "links-sandpit.vecells.example",
            "aos_like": "links-aos.vecells.example",
            "live_placeholder": "links.vecells.example",
        },
        "guardrails": [
            "No real package IDs, fingerprints, or appIDs are stored in repo outputs.",
            "No wildcard route registration is allowed.",
            "No PHI-bearing query parameters may appear in registered paths.",
            "Placeholder files do not prove production hosting readiness.",
        ],
    }


def ios_paths_for_rows(rows: list[dict[str, Any]], only_mockable: bool = True) -> list[str]:
    paths = []
    for row in rows:
        if only_mockable and row["placeholder_in_mock"] != "yes":
            continue
        if row["allowlist_decision"] == "rejected":
            continue
        if row["ios_path_pattern"]:
            paths.append(row["ios_path_pattern"])
    deduped = sorted(dict.fromkeys(paths))
    return deduped


def build_assetlinks_preview(environment: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "relation": [environment["android_relation"]],
            "target": {
                "namespace": "android_app",
                "package_name": environment["android_package_name"],
                "sha256_cert_fingerprints": environment["android_cert_fingerprints"],
            },
        }
    ]


def build_aasa_preview(environment: dict[str, Any], rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "applinks": {
            "apps": [],
            "details": [
                {
                    "appID": environment["ios_app_id"],
                    "paths": ios_paths_for_rows(rows),
                }
            ],
        }
    }


def csv_rows_for_allowlist(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    csv_rows = []
    for row in rows:
        csv_rows.append(
            {
                "path_id": row["path_id"],
                "allowlist_decision": row["allowlist_decision"],
                "route_family_ref": row["route_family_ref"],
                "path_pattern": row["path_pattern"],
                "patient_visible_purpose": row["patient_visible_purpose"],
                "embedded_safe": row["embedded_safe"],
                "requires_outbound_navigation_grant": row["requires_outbound_navigation_grant"],
                "requires_authenticated_session": row["requires_authenticated_session"],
                "allows_secure_link_entry": row["allows_secure_link_entry"],
                "allows_from_nhs_app_query_marker": row["allows_from_nhs_app_query_marker"],
                "placeholder_in_mock": row["placeholder_in_mock"],
                "real_registration_gate_refs": json.dumps(row["real_registration_gate_refs"]),
                "notes": row["notes"],
            }
        )
    return csv_rows


def render_strategy_doc(pack: dict[str, Any]) -> str:
    official_rows = [
        [row["title"], row["captured_on"], row["summary"], row["url"]]
        for row in pack["official_guidance"]
    ]
    return textwrap.dedent(
        f"""
        # 30 Site Link Placeholder Strategy

        This pack turns NHS App site links into route-contract artifacts rather than ad hoc URL strings. The immediate lane is a safe placeholder generator and local `.well-known` rehearsal setup. The later lane is a blocked registration strategy that waits for NHS App team-supplied environment values, approved path allowlists, and current continuity proof.

        ## Section A — `Mock_now_execution`

        - generate route-family-bound placeholder metadata for Android and iOS from one shared allowlist model
        - make route safety, secure-link posture, and return-safe continuity visible before any environment-specific values exist
        - host local `.well-known` files for rehearsal so the app and tests can validate file presence, shape, and path discipline
        - keep rejected detached aliases and raw action URLs visible so the team cannot silently widen the allowlist later

        ## Section B — `Actual_provider_strategy_later`

        - real registration remains blocked until Phase 7 is in scope, official Android and iOS values are supplied, and the path allowlist is approved
        - the real hosting path must be exact, owned, HTTPS-backed, and coordinated with the NHS App onboarding team
        - the same route matrix generated now is the later source of truth for sandpit, AOS, and live registration packs

        ## Official guidance captured on {CAPTURED_ON}

        {markdown_table(["Source", "Captured on", "Why it matters", "URL"], official_rows)}

        ## Summary

        - Visual mode: `{pack["visual_mode"]}`
        - Route rows: `{pack["summary"]["route_count"]}`
        - Approved rows: `{pack["summary"]["approved_count"]}`
        - Conditional rows: `{pack["summary"]["conditional_count"]}`
        - Rejected rows: `{pack["summary"]["rejected_count"]}`
        - Environment variants: `{pack["summary"]["environment_count"]}`
        - Live gates: `{pack["summary"]["live_gate_count"]}`

        ## Mandatory gap closures

        - Site links are bound to route families, selected anchors, and return contracts rather than plain deep-link strings.
        - Placeholder metadata and later real registration share one environment matrix, so drift becomes machine-detectable.
        - Unsafe detached aliases and direct action URLs are explicit rejected rows, not hidden assumptions.
        - Local `.well-known` hosting is treated as rehearsal evidence only and cannot be mistaken for production readiness.
        """
    )


def render_generation_spec(pack: dict[str, Any], rows: list[dict[str, Any]]) -> str:
    env_rows = [
        [
            env["label"],
            env["registration_stage"],
            env["domain_placeholder"],
            env["android_package_name"],
            env["ios_app_id"],
            env["cache_control"],
        ]
        for env in pack["environment_profiles"]
    ]
    ios_paths = ios_paths_for_rows(rows)
    return textwrap.dedent(
        f"""
        # 30 Assetlinks And AASA Generation Spec

        The generator produces three aligned artifacts:
        1. a path allowlist matrix
        2. Android `assetlinks.json` placeholders
        3. iOS `apple-app-site-association` placeholders

        Android and iOS do not encode path rules identically. Android App Links remain domain-level in the hosted JSON, so Vecells keeps the path allowlist as a separate first-class contract. iOS Associated Domains require explicit path entries, so the same allowlist is expanded into the generated AASA preview.

        ## Environment matrix

        {markdown_table(["Environment", "Stage", "Domain", "Android package", "iOS appID", "Cache-Control"], env_rows)}

        ## Template rules

        - `assetlinks.template.json` carries placeholder Android package and certificate values only.
        - `apple-app-site-association.template.json` carries placeholder iOS appID plus a generated path-list token.
        - environment-specific package names, fingerprints, and appIDs stay placeholder-only until the NHS App team supplies them.
        - approved and conditional route rows may contribute to generated iOS paths; rejected rows never do.

        ## Default generated iOS path allowlist for rehearsal

        {markdown_table(["Path"], [[path] for path in ios_paths])}

        ## Generator guardrails

        - no wildcard host registration is generated
        - no PHI-bearing query parameters appear in generated paths
        - raw byte or mutation-only URLs are rejected rather than widened into the allowlist
        - local rehearsal files and infra templates are generated from the same underlying data model
        """
    )


def render_allowlist_doc(rows: list[dict[str, Any]]) -> str:
    table_rows = [
        [
            row["allowlist_decision"],
            row["route_family_ref"],
            row["path_pattern"],
            row["embedded_safe"],
            row["requires_authenticated_session"],
            row["requires_outbound_navigation_grant"],
            row["notes"],
        ]
        for row in rows
    ]
    return textwrap.dedent(
        f"""
        # 30 Route Path Allowlist And Return Rules

        Every candidate site-link path is assessed as a route-family contract. This matrix is the safe surface the later Android and iOS registration must inherit.

        {markdown_table(
            [
                "Decision",
                "Route family",
                "Path pattern",
                "Embedded safe",
                "Requires auth",
                "Requires outbound grant",
                "Notes",
            ],
            table_rows,
        )}

        ## Return-safe rules

        - any route that lands inside a patient shell must preserve the owning `PatientNavReturnContract`
        - artifact-capable routes may be linked, but raw file, print, or detached export endpoints remain rejected
        - secure-link continuation remains a recovery route, not a second identity or route-authority model
        - `from=nhsApp` remains a styling and traffic-recognition hint only, never trust proof
        """
    )


def render_hosting_doc(pack: dict[str, Any]) -> str:
    gate_rows = [
        [gate["label"], gate["status"], gate["summary"]]
        for gate in pack["live_gate_pack"]["live_gates"]
    ]
    return textwrap.dedent(
        f"""
        # 30 Real Registration And Hosting Strategy

        Real site-link registration is intentionally blocked in this pack. The strategy exists now so later sandpit, AOS, and live work can proceed from a controlled field map rather than re-deriving metadata under pressure.

        ## Hosting strategy

        - host `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` on the owned HTTPS domain for the selected environment
        - avoid hidden redirects, HTML error pages, or CDN rewrites on the exact `.well-known` paths
        - use explicit JSON-compatible content types for both files
        - keep cache TTL short until environment values and path approvals are frozen, then increase only under change control
        - route changes or additional path exposure require the same review path as any other embedded route publication change

        ## Domain and ownership checklist

        - confirm the selected environment host is owned and delegated to the correct Vecells runtime slice
        - confirm release tuple, route publication tuple, and embedded continuity proof are current for every linked route family
        - confirm named approver, environment target, and mutation flag before any real submission or hosting change
        - retain a browser-automation dry-run harness for later evidence capture without writing real values to the repo

        ## Live gates

        {markdown_table(["Gate", "Status", "Meaning"], gate_rows)}

        ## Rehearsal vs real hosting

        Local preview hosting proves only:
        - file path shape
        - generated JSON structure
        - stable local asset fetch behavior

        It does not prove:
        - production DNS ownership
        - correct official Android or iOS values
        - NHS App team approval
        - production cache or CDN behavior
        """
    )


def render_readme(pack: dict[str, Any]) -> str:
    return textwrap.dedent(
        f"""
        # Mock NHS App Site Link Studio

        This app is the seq_030 rehearsal surface for NHS App site-link metadata and path allowlists.

        ## Visual mode

        `{pack["visual_mode"]}`

        ## What it does

        - previews route-family allowlists
        - generates Android `assetlinks.json` placeholders
        - generates iOS `apple-app-site-association` placeholders
        - validates locally hosted `.well-known` assets
        - keeps later real registration fail-closed behind explicit gates

        ## Run

        ```bash
        pnpm install
        pnpm dev
        ```

        ## Build

        ```bash
        pnpm build
        pnpm preview
        ```

        ## Local hosted files

        The preview serves:
        - `/.well-known/assetlinks.json`
        - `/.well-known/apple-app-site-association`

        Those files are rehearsal artifacts generated from the same shared pack as the UI. They intentionally use placeholders and must not be treated as real registration evidence.
        """
    )


def build_pack() -> dict[str, Any]:
    inputs = ensure_inputs()
    route_rows = inputs["route_rows"]
    environment_profiles = build_environment_profiles()
    route_allowlist = build_route_allowlist(route_rows)
    live_gate_pack = build_live_gates(inputs["phase0_gate"])
    placeholder_registry = build_placeholder_registry(environment_profiles)

    local_environment = next(env for env in environment_profiles if env["env_id"] == "local_mock")
    local_assetlinks = build_assetlinks_preview(local_environment)
    local_aasa = build_aasa_preview(local_environment, route_allowlist)

    summary = {
        "route_count": len(route_allowlist),
        "approved_count": sum(1 for row in route_allowlist if row["allowlist_decision"] == "approved"),
        "conditional_count": sum(1 for row in route_allowlist if row["allowlist_decision"] == "conditional"),
        "rejected_count": sum(1 for row in route_allowlist if row["allowlist_decision"] == "rejected"),
        "environment_count": len(environment_profiles),
        "live_gate_count": len(live_gate_pack["live_gates"]),
        "default_ios_path_count": len(ios_paths_for_rows(route_allowlist)),
    }

    pack = {
        "task_id": TASK_ID,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "official_guidance": OFFICIAL_GUIDANCE,
        "upstream_inputs": {
            "phase0_entry_verdict": inputs["phase0_gate"]["summary"]["phase0_entry_verdict"],
            "phase0_planning_readiness": inputs["phase0_gate"]["planning_readiness"]["state"],
            "seq_029_task_id": inputs["nhs_app_progression"]["task_id"],
            "seq_029_live_gate_verdict": inputs["nhs_app_live_gates"]["verdict"],
        },
        "summary": summary,
        "environment_profiles": environment_profiles,
        "route_allowlist": route_allowlist,
        "placeholder_registry": placeholder_registry,
        "live_gate_pack": live_gate_pack,
        "local_hosting_profile": {
            "hosted_environment_id": "local_mock",
            "assetlinks_path": "/.well-known/assetlinks.json",
            "aasa_path": "/.well-known/apple-app-site-association",
            "generated_assetlinks": local_assetlinks,
            "generated_aasa": local_aasa,
            "validation_rules": [
                "reachable over the local preview server",
                "parseable JSON payloads",
                "same generator model as the studio preview",
                "placeholder-only values, never real NHS App environment values",
            ],
        },
    }
    return pack


def write_outputs(pack: dict[str, Any]) -> None:
    allowlist_rows = pack["route_allowlist"]
    placeholder_registry = pack["placeholder_registry"]
    local_hosting_profile = pack["local_hosting_profile"]

    write_csv(ALLOWLIST_CSV_PATH, csv_rows_for_allowlist(allowlist_rows))
    write_json(ENV_MATRIX_JSON_PATH, pack)
    write_json(PLACEHOLDERS_JSON_PATH, placeholder_registry)

    write_text(STRATEGY_DOC_PATH, render_strategy_doc(pack))
    write_text(GEN_SPEC_DOC_PATH, render_generation_spec(pack, allowlist_rows))
    write_text(ALLOWLIST_DOC_PATH, render_allowlist_doc(allowlist_rows))
    write_text(HOSTING_DOC_PATH, render_hosting_doc(pack))

    write_json(
        ASSETLINKS_TEMPLATE_PATH,
        [
            {
                "relation": ["delegate_permission/common.handle_all_urls"],
                "target": {
                    "namespace": "android_app",
                    "package_name": "{{ANDROID_PACKAGE_NAME}}",
                    "sha256_cert_fingerprints": ["{{ANDROID_SHA256_CERT_FINGERPRINT}}"],
                },
            }
        ],
    )
    write_json(
        AASA_TEMPLATE_PATH,
        {
            "applinks": {
                "apps": [],
                "details": [
                    {
                        "appID": "{{IOS_APP_ID}}",
                        "paths": ["{{IOS_PATHS_ALLOWLIST}}"],
                    }
                ],
            }
        },
    )

    APP_SRC_DIR.joinpath("generated").mkdir(parents=True, exist_ok=True)
    APP_PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    write_text(APP_PACK_TS_PATH, "export const siteLinkPack = " + json.dumps(pack, indent=2) + " as const;")
    write_json(APP_PACK_JSON_PATH, pack)
    write_text(APP_README_PATH, render_readme(pack))
    write_json(APP_PUBLIC_ASSETLINKS_PATH, local_hosting_profile["generated_assetlinks"])
    write_text(APP_PUBLIC_AASA_PATH, json.dumps(local_hosting_profile["generated_aasa"], indent=2))


def main() -> None:
    pack = build_pack()
    write_outputs(pack)
    print(
        json.dumps(
            {
                "task_id": pack["task_id"],
                "route_count": pack["summary"]["route_count"],
                "approved_count": pack["summary"]["approved_count"],
                "conditional_count": pack["summary"]["conditional_count"],
                "rejected_count": pack["summary"]["rejected_count"],
                "environment_count": pack["summary"]["environment_count"],
                "live_gate_count": pack["summary"]["live_gate_count"],
            }
        )
    )


if __name__ == "__main__":
    main()
