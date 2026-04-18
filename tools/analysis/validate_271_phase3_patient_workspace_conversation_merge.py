#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ARCHITECTURE_PATH = ROOT / "docs" / "architecture" / "271_phase3_patient_workspace_conversation_merge.md"
STORYBOARD_PATH = ROOT / "docs" / "frontend" / "271_phase3_patient_workspace_conversation_storyboard.html"
TOPOLOGY_PATH = ROOT / "docs" / "frontend" / "271_phase3_patient_workspace_conversation_topology.mmd"
RUNBOOK_PATH = ROOT / "docs" / "operations" / "271_phase3_patient_workspace_conversation_runbook.md"
CONTRACT_PATH = ROOT / "data" / "contracts" / "271_phase3_patient_workspace_conversation_bundle.json"
PARITY_MATRIX_PATH = ROOT / "data" / "analysis" / "271_phase3_patient_staff_parity_matrix.csv"
LINK_MATRIX_PATH = ROOT / "data" / "analysis" / "271_phase3_link_expiry_and_cycle_truth_matrix.csv"
GAP_LOG_PATH = ROOT / "data" / "analysis" / "271_phase3_integration_gap_log.json"
HARDENING_GAP_PATH = ROOT / "data" / "analysis" / "PHASE3_HARDENING_INTERFACE_GAP_PATIENT_WORKSPACE_CONVERSATION.json"
PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
SERVICE_PATHS = [
    ROOT / "services" / "command-api" / "src" / "phase3-patient-workspace-conversation-merge.ts",
    ROOT / "services" / "command-api" / "src" / "service-definition.ts",
    ROOT / "services" / "command-api" / "tests" / "phase3-patient-workspace-conversation-merge.integration.test.js",
]
APP_PATHS = [
    ROOT / "apps" / "patient-web" / "src" / "patient-conversation-surface.model.ts",
    ROOT / "apps" / "patient-web" / "src" / "patient-conversation-surface.tsx",
    ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.tsx",
    ROOT / "apps" / "patient-web" / "src" / "patient-records-communications.model.ts",
    ROOT / "apps" / "patient-web" / "src" / "patient-records-communications.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.data.ts",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-reasoning-layer.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-attachment-thread.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-callback-workbench.data.ts",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-callback-workbench.tsx",
]
PLAYWRIGHT_PATHS = [
    ROOT / "tests" / "playwright" / "271_phase3_patient_workspace.helpers.ts",
    ROOT / "tests" / "playwright" / "271_phase3_patient_workspace_conversation.spec.ts",
    ROOT / "tests" / "playwright" / "271_phase3_patient_workspace_multi_actor.spec.ts",
    ROOT / "tests" / "playwright" / "271_phase3_patient_workspace_conversation.visual.spec.ts",
    ROOT / "tests" / "playwright" / "271_phase3_patient_workspace_recovery.spec.ts",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    contract = json.loads(read_text(CONTRACT_PATH))
    require(
        contract["contractId"] == "271.phase3.patient-workspace-conversation.bundle",
        "271 contractId drifted",
    )
    require(
        contract["schemaVersion"] == "271.phase3.patient-workspace-conversation-merge.v1",
        "271 schemaVersion drifted",
    )
    require(
        contract["serviceName"] == "Phase3PatientWorkspaceConversationMergeApplication",
        "271 serviceName drifted",
    )
    require(
        contract["routeIds"]
        == [
            "workspace_task_phase3_patient_workspace_conversation_current",
            "patient_request_phase3_workspace_conversation_current",
            "patient_message_cluster_phase3_workspace_conversation_current",
        ],
        "271 route ids drifted",
    )
    require(
        {"conversation_more_info", "conversation_callback", "conversation_messages"}
        <= set(contract["patientRouteKeys"]),
        "271 patient route coverage drifted",
    )
    require(
        {"task", "more-info", "callbacks"} <= set(contract["staffRouteKinds"]),
        "271 staff route coverage drifted",
    )
    require(
        {
            "data-phase3-bundle-ref",
            "data-request-lineage-ref",
            "data-reply-window-checkpoint",
            "data-evidence-delta-packet-ref",
            "data-delivery-posture",
            "data-repair-posture",
        }
        <= set(contract["parityMarkers"]),
        "271 parity markers drifted",
    )

    with PARITY_MATRIX_PATH.open(encoding="utf-8", newline="") as handle:
      parity_rows = list(csv.DictReader(handle))
    require(len(parity_rows) >= 6, "271 parity matrix unexpectedly thin")
    require(
        {"task-311", "task-412"} <= {row["taskId"] for row in parity_rows},
        "271 parity matrix lost required task rows",
    )
    require(
        {"answerable", "blocked_by_repair", "read_only"} <= {row["replyEligibilityState"] for row in parity_rows},
        "271 reply eligibility coverage drifted",
    )
    require(
        {"reply_needed", "awaiting_review", "repair_required", "step_up_required"} <= {row["deliveryPosture"] for row in parity_rows},
        "271 delivery posture coverage drifted",
    )

    with LINK_MATRIX_PATH.open(encoding="utf-8", newline="") as handle:
      link_rows = list(csv.DictReader(handle))
    require(len(link_rows) >= 5, "271 link-expiry matrix unexpectedly thin")
    require(
        {"expired", "blocked", "stale", "repair"} <= {row["scenario"] for row in link_rows},
        "271 recovery scenario coverage drifted",
    )
    require(
        {"expired_link", "step_up_required", "secure_link", "signed_in"} <= {row["secureLinkAccessState"] for row in link_rows},
        "271 secure-link state coverage drifted",
    )

    gap_log = json.loads(read_text(GAP_LOG_PATH))
    require(
        gap_log["taskId"] == "seq_271_phase3_merge_Playwright_or_other_appropriate_tooling_integrate_patient_portal_more_info_and_thread_surfaces_with_workspace_actions",
        "271 gap log taskId drifted",
    )
    require(
        {"271-live-query-consumption-pending", "271-external-transport-and-step-up-simulated"}
        <= {gap["gapId"] for gap in gap_log["gaps"]},
        "271 gap log coverage drifted",
    )
    hardening_gap = json.loads(read_text(HARDENING_GAP_PATH))
    require(
        hardening_gap["gapFamily"] == "PHASE3_HARDENING_INTERFACE_GAP_PATIENT_WORKSPACE_CONVERSATION",
        "271 hardening gap family drifted",
    )

    architecture = read_text(ARCHITECTURE_PATH).lower()
    for token in [
        "phase3patientworkspaceconversationmergeapplication",
        "phase3patientworkspaceconversationbundle",
        "moreinforeplywindowcheckpoint",
        "evidencedeltapacket",
        "moreinforesponsedisposition",
        "conversationthreadprojection",
        "patientconversationpreviewdigest",
        "patientreceiptenvelope",
        "conversationcommandsettlement",
    ]:
        require(token in architecture, f"271 architecture doc lost token: {token}")

    storyboard = read_text(STORYBOARD_PATH)
    for token in [
        "271-phase3-patient-workspace-conversation-storyboard-root",
        "Staff more-info -> patient child route",
        "Patient reply -> staff resumed review",
        "Queue -> callback repair",
        "EvidenceDeltaPacket",
        "MoreInfoResponseDisposition",
        "Return to message cluster",
    ]:
        require(token in storyboard, f"271 storyboard lost token: {token}")

    topology = read_text(TOPOLOGY_PATH)
    for token in [
        "Workspace task shell",
        "MoreInfoInlineSideStage",
        "PatientResponseThreadPanel",
        "CallbackDetailSurface",
        "271 merge digest",
        "Message cluster return",
        "Expired link stays same-shell",
    ]:
        require(token in topology, f"271 topology lost token: {token}")

    runbook = read_text(RUNBOOK_PATH).lower()
    for token in [
        "same-lineage",
        "patientresponsethreadpanel",
        "message-cluster launch",
        "expired_link",
        "step_up_required",
        "stale_recoverable",
    ]:
        require(token in runbook, f"271 runbook lost token: {token}")

    script_token = (
        '"validate:271-phase3-patient-workspace-conversation-merge": '
        '"python3 ./tools/analysis/validate_271_phase3_patient_workspace_conversation_merge.py"'
    )
    package_text = read_text(PACKAGE_PATH)
    root_script_updates_text = read_text(ROOT_SCRIPT_UPDATES_PATH)
    require(script_token in package_text, "package.json missing 271 validator script")
    require(script_token in root_script_updates_text, "root_script_updates missing 271 validator script")

    service_text = "\n".join(read_text(path) for path in SERVICE_PATHS)
    for token in [
        "PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SERVICE_NAME",
        "queryTaskConversationMerge",
        "queryRequestConversationMerge",
        "queryClusterConversationMerge",
        "workspace_task_phase3_patient_workspace_conversation_current",
        "patient_request_phase3_workspace_conversation_current",
        "patient_message_cluster_phase3_workspace_conversation_current",
        "request_211_a",
        "request_215_callback",
        "cluster_214_callback",
    ]:
        require(token in service_text, f"271 service source missing token: {token}")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for token in [
        "phase3ConversationBundleRef",
        "requestLineageRef",
        "patientConversationRouteRef",
        "evidenceDeltaPacketRef",
        "moreInfoResponseDispositionRef",
        "data-phase3-bundle-ref",
        "data-request-lineage-ref",
        "data-reply-window-checkpoint",
        "data-delivery-posture",
        "data-repair-posture",
        "message-open-request-conversation",
        "request-detail-open-conversation",
        "cluster_214_callback",
        "request_215_callback",
    ]:
        require(token in app_text, f"271 app source missing token: {token}")

    for path in PLAYWRIGHT_PATHS:
        require(path.exists(), f"Missing 271 Playwright proof: {path}")

    print(
        json.dumps(
            {
                "parityRowCount": len(parity_rows),
                "linkRowCount": len(link_rows),
                "acceptedGapCount": len(gap_log["gaps"]),
                "playwrightSpecCount": len(PLAYWRIGHT_PATHS) - 1,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
