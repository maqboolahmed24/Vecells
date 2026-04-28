#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
CONTRACT_PATH = ROOT / "data" / "contracts" / "266_patient_conversation_surface_contract.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "266_patient_conversation_surface_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "266_patient_conversation_surface_atlas.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "266_patient_conversation_surface_topology.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "266_patient_conversation_surface_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "266_patient_conversation_surface_a11y_notes.md"
NOTES_PATH = ROOT / "data" / "analysis" / "266_algorithm_alignment_notes.md"
MATRIX_PATH = ROOT / "data" / "analysis" / "266_patient_conversation_surface_state_matrix.csv"
REFERENCES_PATH = ROOT / "data" / "analysis" / "266_visual_reference_notes.json"
CASES_PATH = ROOT / "data" / "analysis" / "266_request_return_and_contact_repair_cases.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_PATIENT_CONVERSATION_CLUSTER.json"
PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
APP_PATHS = [
    ROOT / "apps" / "patient-web" / "src" / "App.tsx",
    ROOT / "apps" / "patient-web" / "src" / "patient-conversation-surface.tsx",
    ROOT / "apps" / "patient-web" / "src" / "patient-conversation-surface.model.ts",
    ROOT / "apps" / "patient-web" / "src" / "patient-conversation-surface.css",
    ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.tsx",
    ROOT / "apps" / "patient-web" / "src" / "patient-records-communications.tsx",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    checklist = read_text(CHECKLIST)
    require("par_266_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_conversation_surface_for_more_info_callback_and_message_updates" in checklist, "266 checklist row missing")

    contract = json.loads(read_text(CONTRACT_PATH))
    require(contract["taskId"].startswith("par_266"), "266 contract taskId drifted")
    require(contract["visualMode"] == "Calm_Care_Conversation", "266 visual mode drifted")
    require(
        set(contract["components"])
        == {
            "PatientConversationRoute",
            "PatientMoreInfoReplySurface",
            "PatientCallbackStatusCard",
            "PatientMessageThread",
            "PatientContactRepairPrompt",
            "PatientConversationReturnBridge",
        },
        "266 component contract drifted",
    )
    require(
        set(contract["domMarkers"])
        == {
            "data-patient-conversation-state",
            "data-request-return-bundle",
            "data-callback-state",
            "data-contact-repair-state",
            "data-dominant-patient-action",
        },
        "266 DOM marker contract drifted",
    )
    require(len(contract["routes"]) == 5, "266 route family drifted")

    notes = read_text(NOTES_PATH).lower()
    for token in [
        "patientrequestreturnbundle",
        "patientmoreinfostatusprojection",
        "conversationthreadprojection",
        "patientreceiptenvelope",
        "conversationcommandsettlement",
        "patientcallbackstatusprojection",
        "patientcontactrepairprojection",
        "detached-message-center gap",
        "local-countdown-promise gap",
        "buried-contact-repair gap",
        "jargon gap",
        "stale-return-anchor gap",
    ]:
        require(token in notes, f"266 notes lost token: {token}")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) >= 8, "266 matrix unexpectedly thin")
    require(
        {"reply_needed", "contact_repair", "message_update", "stale_recoverable", "blocked_policy", "expired_reply_window"}
        <= {row["patient_conversation_state"] for row in matrix},
        "266 conversation-state coverage drifted",
    )
    require(
        {"request", "messages"} <= {row["return_origin"] for row in matrix},
        "266 return-origin coverage drifted",
    )

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {
            "Linear UI refresh",
            "Welcome to the new Linear",
            "Vercel Nested Layouts",
            "Vercel Dashboard Navigation",
            "IBM Carbon Data Table",
            "NHS Writing NHS messages",
            "NHS Typography Guidance",
        }
        <= {item["source"] for item in references["references"]},
        "266 visual references drifted",
    )

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 8, "266 case coverage unexpectedly thin")
    require(
        {
            "request-detail-launch-preserves-return-bundle",
            "message-cluster-launch-preserves-cluster-return",
            "more-info-send-stays-same-shell",
            "message-reply-pending-does-not-imply-delivered",
            "callback-status-honest-under-repair",
            "contact-repair-becomes-dominant-action",
            "stale-recovery-keeps-anchor-and-copy",
            "blocked-policy-keeps-next-step-in-shell",
            "reload-preserves-anchor-and-route",
        }
        <= {item["id"] for item in cases["cases"]},
        "266 cases drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require(gap["expectedOwnerTask"] == "par_267", "266 gap owner drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "calm_care_conversation",
        "patientconversationroute",
        "patientmoreinforeplysurface",
        "patientcallbackstatuscard",
        "patientmessagethread",
        "patientcontactrepairprompt",
        "patientconversationreturnbridge",
        "reassure first, orient second, act third, explain always",
    ]:
        require(token in spec, f"266 spec lost token: {token}")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "patient-conversation-surface-atlas-root",
        "PatientConversationRoute",
        "PatientMoreInfoReplySurface",
        "PatientCallbackStatusCard",
        "PatientMessageThread",
        "PatientContactRepairPrompt",
        "PatientConversationReturnBridge",
        "patient-conversation-route-map",
        "patient-conversation-blocked-flow",
    ]:
        require(token in atlas, f"266 atlas lost token: {token}")

    diagram = read_text(DIAGRAM_PATH)
    for token in [
        "PatientRequestReturnBundle",
        "PatientMoreInfoStatusProjection",
        "ConversationThreadProjection",
        "PatientReceiptEnvelope",
        "ConversationCommandSettlement",
        "PatientCallbackStatusProjection",
        "PatientContactRepairProjection",
    ]:
        require(token in diagram, f"266 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(tokens["tokens"]["layout"]["desktopReadingColumnMax"] == "800px", "266 reading-column token drifted")
    require(tokens["tokens"]["motion"]["shellMorph"] == "180ms", "266 motion token drifted")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "266 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "266 a11y notes lost reduced-motion guidance")
    require("plain-language" in a11y, "266 a11y notes lost plain-language guidance")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for token in [
        "PatientConversationSurfaceApp",
        "PatientConversationRoute",
        "PatientMoreInfoReplySurface",
        "PatientCallbackStatusCard",
        "PatientMessageThread",
        "PatientContactRepairPrompt",
        "PatientConversationReturnBridge",
        "request-detail-open-conversation",
        "message-open-request-conversation",
        "Calm_Care_Conversation",
        "data-patient-conversation-state",
        "data-request-return-bundle",
        "data-callback-state",
        "data-contact-repair-state",
        "data-dominant-patient-action",
    ]:
        require(token in app_text, f"266 app source missing token: {token}")

    package_text = read_text(PACKAGE_PATH)
    root_script_updates = read_text(ROOT_SCRIPT_UPDATES_PATH)
    require("validate:266-patient-conversation-surface-contracts" in package_text, "package.json missing 266 validator script")
    require("validate:266-patient-conversation-surface-contracts" in root_script_updates, "root_script_updates missing 266 validator script")

    print(
        json.dumps(
            {
                "taskId": contract["taskId"],
                "componentCount": len(contract["components"]),
                "caseCount": len(cases["cases"]),
                "referenceCount": len(references["references"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
