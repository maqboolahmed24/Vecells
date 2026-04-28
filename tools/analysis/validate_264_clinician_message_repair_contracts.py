#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "264_clinician_message_repair_contract.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "264_clinician_message_repair_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "264_clinician_message_repair_atlas.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "264_clinician_message_repair_topology.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "264_clinician_message_repair_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "264_clinician_message_repair_a11y_notes.md"
NOTES_PATH = ROOT / "data" / "analysis" / "264_algorithm_alignment_notes.md"
MATRIX_PATH = ROOT / "data" / "analysis" / "264_clinician_message_repair_state_matrix.csv"
REFERENCES_PATH = ROOT / "data" / "analysis" / "264_visual_reference_notes.json"
CASES_PATH = ROOT / "data" / "analysis" / "264_delivery_truth_and_repair_cases.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_THREAD_DELIVERY_REPAIR.json"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-clinician-message-repair.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-clinician-message-repair.data.ts",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.css",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.tsx",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    contract = json.loads(read_text(CONTRACT_PATH))
    require(contract["taskId"].startswith("par_264"), "264 contract taskId drifted")
    require(contract["visualMode"] == "Thread_Repair_Studio", "264 visual mode drifted")
    require(
        set(contract["components"])
        == {
            "ClinicianMessageThreadSurface",
            "MessageThreadMasthead",
            "DeliveryTruthLadder",
            "DeliveryDisputeStage",
            "MessageRepairWorkbench",
            "AttachmentRecoveryPrompt",
        },
        "264 component contract drifted",
    )
    require(
        set(contract["domMarkers"])
        == {
            "data-thread-state",
            "data-delivery-truth",
            "data-repair-kind",
            "data-thread-tuple",
            "data-dispute-stage",
        },
        "264 DOM marker contract drifted",
    )

    notes = read_text(NOTES_PATH).lower()
    for token in [
        "clinicianmessagethread",
        "messagedispatchenvelope",
        "messagedeliveryevidencebundle",
        "threadexpectationenvelope",
        "threadresolutiongate",
        "provider-accepted-equals-delivered gap",
        "contradictory same-fence",
        "attachment recovery",
    ]:
        require(token in notes, f"264 notes lost token: {token}")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) >= 8, "264 matrix unexpectedly thin")
    require(
        {"transport_accepted", "evidence_delivered", "disputed", "repair_pending"}
        <= {row["thread_state"] for row in matrix},
        "264 thread-state coverage drifted",
    )
    require(
        {"live", "stale_recoverable", "recovery_only", "blocked"}
        <= {row["mutation_state"] for row in matrix},
        "264 mutation-state coverage drifted",
    )

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {
            "Linear UI refresh",
            "Welcome to the new Linear",
            "Vercel Nested Layouts",
            "Vercel Dashboard Navigation",
            "IBM Carbon Data Table",
            "NHS Content Guide",
            "NHS Typography Guidance",
            "Microsoft Atlas Timeline",
        }
        <= {item["source"] for item in references["references"]},
        "264 visual references drifted",
    )

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 8, "264 case coverage unexpectedly thin")
    require(
        {
            "same-shell-thread-selection-keeps-message-route",
            "transport-accepted-does-not-imply-delivered",
            "contradictory-receipts-freeze-thread",
            "route-repair-and-callback-fallback-stay-visible",
            "attachment-recovery-is-inline",
            "reload-preserves-selected-anchor-and-stage",
        }
        <= {item["id"] for item in cases["cases"]},
        "264 cases drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require(gap["expectedOwnerTask"] == "par_266", "264 gap owner drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "thread_repair_studio",
        "clinicianmessagethreadsurface",
        "messagethreadmasthead",
        "deliverytruthladder",
        "deliverydisputestage",
        "messagerepairworkbench",
        "attachmentrecoveryprompt",
        "provider acceptance is never rendered as final delivery",
    ]:
        require(token in spec, f"264 spec lost token: {token}")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "clinician-message-repair-atlas-root",
        "ClinicianMessageThreadSurface",
        "MessageThreadMasthead",
        "DeliveryTruthLadder",
        "DeliveryDisputeStage",
        "MessageRepairWorkbench",
        "AttachmentRecoveryPrompt",
    ]:
        require(token in atlas, f"264 atlas lost token: {token}")

    diagram = read_text(DIAGRAM_PATH)
    for token in [
        "MessageDispatchEnvelope",
        "MessageDeliveryEvidenceBundle",
        "ThreadExpectationEnvelope",
        "ThreadResolutionGate",
        "WorkspaceFocusProtectionLease",
        "ProtectedCompositionState",
    ]:
        require(token in diagram, f"264 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(
        tokens["tokens"]["desktop"]["chronologyWidth"] == "minmax(840px, 1fr)",
        "264 chronology width token drifted",
    )
    require(tokens["tokens"]["motion"]["laneMorph"] == "180ms", "264 motion token drifted")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "264 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "264 a11y notes lost reduced-motion guidance")
    require("attachment recovery" in a11y, "264 a11y notes lost attachment guidance")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
      require(app_text.count(component_name) >= 1, f"app source missing 264 component: {component_name}")
    for token in [
        'data-testid="ClinicianMessageThreadSurface"',
        'data-testid="MessageThreadMasthead"',
        'data-testid="DeliveryTruthLadder"',
        'data-testid="DeliveryDisputeStage"',
        'data-testid="MessageRepairWorkbench"',
        'data-testid="AttachmentRecoveryPrompt"',
        "Thread_Repair_Studio",
        "/workspace/messages",
        "WorkspaceMessagesRoute",
        "data-thread-state",
        "data-delivery-truth",
        "data-repair-kind",
        "data-thread-tuple",
        "data-dispute-stage",
    ]:
        require(token in app_text, f"app source missing 264 token: {token}")

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
