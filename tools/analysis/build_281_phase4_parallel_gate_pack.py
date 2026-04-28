#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import textwrap
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TODAY = date.today().isoformat()
TASK_ID = "seq_281"
CONTRACT_VERSION = "281.phase4.parallel-gate.v1"
VISUAL_MODE = "Phase4_Parallel_Gate_Board"


def repo_path(relative: str) -> str:
    return str(ROOT / relative)


def read_json(relative: str):
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def write_text(relative: str, content: str) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(relative: str, payload: object) -> None:
    write_text(relative, json.dumps(payload, indent=2))


def write_csv(relative: str, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def yaml_scalar(value: object) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value)
    safe = all(ch.isalnum() or ch in "-_./:" for ch in text)
    if safe and text not in {"true", "false", "null"}:
        return text
    return json.dumps(text)


def emit_yaml(value: object, indent: int = 0) -> str:
    prefix = " " * indent
    if isinstance(value, dict):
        lines: list[str] = []
        for key, nested in value.items():
            if isinstance(nested, (dict, list)):
                lines.append(f"{prefix}{key}:")
                lines.append(emit_yaml(nested, indent + 2))
            else:
                lines.append(f"{prefix}{key}: {yaml_scalar(nested)}")
        return "\n".join(lines)
    if isinstance(value, list):
        lines = []
        for item in value:
            if isinstance(item, (dict, list)):
                nested = emit_yaml(item, indent + 2)
                first, *rest = nested.splitlines()
                lines.append(f"{prefix}- {first.strip()}")
                lines.extend(rest)
            else:
                lines.append(f"{prefix}- {yaml_scalar(item)}")
        return "\n".join(lines)
    return f"{prefix}{yaml_scalar(value)}"


def md_escape(value: object) -> str:
    return str(value).replace("|", "\\|")


def markdown_table(headers: list[str], rows: list[list[object]]) -> str:
    header_row = "| " + " | ".join(headers) + " |"
    rule_row = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = [
        "| " + " | ".join(md_escape(cell) for cell in row) + " |"
        for row in rows
    ]
    return "\n".join([header_row, rule_row, *body])


def prompt_task_id(prompt_number: int) -> str:
    prompt_path = ROOT / "prompt" / f"{prompt_number}.md"
    first_line = prompt_path.read_text(encoding="utf-8").splitlines()[0]
    return first_line.split(" For ", 1)[1].strip()


def short_track_id(prompt_number: int) -> str:
    task_id = prompt_task_id(prompt_number)
    number, mode, *_ = task_id.split("_")
    return f"{mode}_{number}"


PROMPT_IDS = {number: prompt_task_id(number) for number in range(282, 311)}
SHORT_IDS = {number: short_track_id(number) for number in range(282, 311)}


SHARED_REFS = {
    "batch_276_283": repo_path("prompt/shared_operating_contract_276_to_283.md"),
    "batch_284_291": repo_path("prompt/shared_operating_contract_284_to_291.md"),
    "batch_292_299": repo_path("prompt/shared_operating_contract_292_to_299.md"),
    "batch_300_307": repo_path("prompt/shared_operating_contract_300_to_307.md"),
    "batch_308_315": repo_path("prompt/shared_operating_contract_308_to_315.md"),
    "phase4_booking": repo_path("blueprint/phase-4-the-booking-engine.md"),
    "patient_portal": repo_path("blueprint/patient-portal-experience-architecture-blueprint.md"),
    "patient_account": repo_path("blueprint/patient-account-and-communications-blueprint.md"),
    "runtime_release": repo_path("blueprint/platform-runtime-and-release-blueprint.md"),
    "frontend": repo_path("blueprint/platform-frontend-blueprint.md"),
    "phase0": repo_path("blueprint/phase-0-the-foundation-protocol.md"),
    "exit_gate": repo_path("docs/governance/277_phase3_exit_gate_pack.md"),
    "case_pack": repo_path("docs/architecture/278_phase4_booking_case_contract_and_state_machine.md"),
    "capability_pack": repo_path("docs/architecture/279_phase4_provider_capability_matrix_and_adapter_seam.md"),
    "flow_pack": repo_path("docs/architecture/280_phase4_slot_snapshot_offer_commit_manage_contract_pack.md"),
}


FREEZE_CONTRACT_REFS = {
    "278_booking_case_schema": repo_path("data/contracts/278_booking_case.schema.json"),
    "278_booking_intent_schema": repo_path("data/contracts/278_booking_intent_handoff.schema.json"),
    "278_search_policy_schema": repo_path("data/contracts/278_search_policy.schema.json"),
    "278_state_machine": repo_path("data/contracts/278_booking_case_state_machine.json"),
    "278_route_registry": repo_path("data/contracts/278_patient_booking_route_family_registry.yaml"),
    "278_projection_bundle": repo_path("data/contracts/278_patient_appointment_projection_bundle.json"),
    "278_event_catalog": repo_path("data/contracts/278_booking_case_event_catalog.json"),
    "279_matrix_schema": repo_path("data/contracts/279_provider_capability_matrix.schema.json"),
    "279_adapter_registry": repo_path("data/contracts/279_adapter_contract_profile_registry.json"),
    "279_degradation_registry": repo_path("data/contracts/279_dependency_degradation_profile_registry.json"),
    "279_policy_registry": repo_path("data/contracts/279_authoritative_read_and_confirmation_gate_policy_registry.json"),
    "279_binding_schema": repo_path("data/contracts/279_booking_provider_adapter_binding.schema.json"),
    "279_resolution_schema": repo_path("data/contracts/279_booking_capability_resolution.schema.json"),
    "279_projection_schema": repo_path("data/contracts/279_booking_capability_projection.schema.json"),
    "280_slot_search_schema": repo_path("data/contracts/280_slot_search_session.schema.json"),
    "280_provider_search_schema": repo_path("data/contracts/280_provider_search_slice.schema.json"),
    "280_temporal_schema": repo_path("data/contracts/280_temporal_normalization_envelope.schema.json"),
    "280_slot_identity_schema": repo_path("data/contracts/280_canonical_slot_identity.schema.json"),
    "280_snapshot_schema": repo_path("data/contracts/280_slot_set_snapshot.schema.json"),
    "280_snapshot_recovery_schema": repo_path("data/contracts/280_slot_snapshot_recovery_state.schema.json"),
    "280_rank_plan_contract": repo_path("data/contracts/280_rank_plan_and_capacity_rank_proof_contract.json"),
    "280_offer_session_schema": repo_path("data/contracts/280_offer_session.schema.json"),
    "280_reservation_truth_contract": repo_path("data/contracts/280_reservation_truth_projection_contract.json"),
    "280_booking_transaction_schema": repo_path("data/contracts/280_booking_transaction.schema.json"),
    "280_confirmation_truth_schema": repo_path("data/contracts/280_booking_confirmation_truth_projection.schema.json"),
    "280_manage_bundle": repo_path("data/contracts/280_appointment_manage_and_reminder_contract_bundle.json"),
    "280_waitlist_bundle": repo_path("data/contracts/280_waitlist_and_fallback_interface_stubs.json"),
}


EXTERNAL_REFERENCE_NOTES = {
    "taskId": TASK_ID,
    "generatedAt": TODAY,
    "sources": [
        {
            "referenceId": "REF_281_001",
            "name": "Playwright Trace Viewer",
            "url": "https://playwright.dev/docs/trace-viewer",
            "official": True,
            "borrowed": [
                "The board keeps graph and table parity so a browser trace can prove the same state through multiple surfaces.",
                "Inspector-side evidence is deterministic and selection-driven, which keeps trace steps readable."
            ],
            "rejected": [
                "We did not add replay-style animation or timeline scrubbing to the gate board because the gate is a readiness instrument, not a demo trace UI."
            ],
        },
        {
            "referenceId": "REF_281_002",
            "name": "Playwright Visual comparisons",
            "url": "https://playwright.dev/docs/test-snapshots",
            "official": True,
            "borrowed": [
                "The board uses stable spacing, deterministic colors, and fixed track lanes to make screenshot proof reliable."
            ],
            "rejected": [
                "We did not depend on per-run randomized fixtures or external fonts because they would make the launch board proof noisy."
            ],
        },
        {
            "referenceId": "REF_281_003",
            "name": "Playwright Accessibility testing",
            "url": "https://playwright.dev/docs/accessibility-testing",
            "official": True,
            "borrowed": [
                "Every graph region has adjacent list or table parity and named landmarks so accessibility proof is not visual-only."
            ],
            "rejected": [
                "We did not hide load-bearing data behind hover-only affordances."
            ],
        },
        {
            "referenceId": "REF_281_004",
            "name": "Linear changelog",
            "url": "https://linear.app/changelog",
            "official": True,
            "borrowed": [
                "Calm operational chrome, dense summary bands, and restrained rail emphasis."
            ],
            "rejected": [
                "We did not use product-management kanban affordances because the gate is about dependency law, not card movement."
            ],
        },
        {
            "referenceId": "REF_281_005",
            "name": "Vercel Academy nested layouts",
            "url": "https://vercel.com/academy/nextjs-foundations/nested-layouts",
            "official": True,
            "borrowed": [
                "Persistent left rail, shared central canvas, and stable right inspector layout discipline."
            ],
            "rejected": [
                "We did not split launch evidence into detached pages; the gate keeps the decision context in one shell."
            ],
        },
        {
            "referenceId": "REF_281_006",
            "name": "Vercel dashboard navigation",
            "url": "https://vercel.com/docs/dashboard-features/overview",
            "official": True,
            "borrowed": [
                "Compact route-like rail treatment and focused status emphasis."
            ],
            "rejected": [
                "We did not mirror Vercel information architecture because the booking gate has very different dependency semantics."
            ],
        },
        {
            "referenceId": "REF_281_007",
            "name": "IBM Carbon data table usage",
            "url": "https://carbondesignsystem.com/components/data-table/usage/",
            "official": True,
            "borrowed": [
                "Dense lower ledgers with stable headers and sentence-case labeling.",
                "Table parity beside every graphical summary."
            ],
            "rejected": [
                "We did not add multi-select or bulk actions because the gate is read-only governance state."
            ],
        },
        {
            "referenceId": "REF_281_008",
            "name": "NHS Service Manual content",
            "url": "https://service-manual.nhs.uk/content",
            "official": True,
            "borrowed": [
                "Short, direct blocker explanations and explicit next-action wording."
            ],
            "rejected": [
                "We did not use vague programme language for blocked or deferred state."
            ],
        },
        {
            "referenceId": "REF_281_009",
            "name": "NHS Service Manual typography",
            "url": "https://service-manual.nhs.uk/design-system/styles/typography",
            "official": True,
            "borrowed": [
                "Readable restrained type hierarchy for operational evidence."
            ],
            "rejected": [
                "We did not compress long evidence text into tiny labels just to fit more badges."
            ],
        },
        {
            "referenceId": "REF_281_010",
            "name": "GP Connect Appointment Management",
            "url": "https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir",
            "official": True,
            "borrowed": [
                "The readiness model keeps provider integration reality explicit and does not treat supplier support as uniform.",
                "Adapter and capability seams remain typed dependencies rather than assumed live parity."
            ],
            "rejected": [
                "We did not infer live provider manage support from supplier family alone; 279 capability rows remain authoritative."
            ],
        },
    ],
}


INVALIDATION_CHAINS = [
    {
        "chainId": "IC_281_CAPABILITY_TUPLE_DRIFT",
        "title": "Capability tuple drift",
        "summary": "Any matrix, trust, publication, linkage, or governing-object drift supersedes stale search, offer, selection, manage, and command state.",
        "impactObjects": [
            "BookingCapabilityResolution",
            "SlotSetSnapshot",
            "OfferSession",
            "ReservationTruthProjection",
            "PatientAppointmentManageProjection",
            "AppointmentManageCommand",
        ],
        "ownerTrackIds": ["par_283", "par_284", "par_285", "par_286", "par_288", "par_297"],
        "law": "Capability tuple drift invalidates stale snapshots, offers, selected slots, manage views, and command drafts.",
    },
    {
        "chainId": "IC_281_SNAPSHOT_EXPIRY",
        "title": "Snapshot expiry without provenance loss",
        "summary": "Expired snapshots freeze selection and commit paths while preserving evidence and anchor provenance.",
        "impactObjects": [
            "SlotSetSnapshot",
            "SlotSnapshotRecoveryState",
            "OfferSession",
            "BookingTransaction",
        ],
        "ownerTrackIds": ["par_284", "par_285", "par_287", "par_294", "par_295"],
        "law": "Snapshot expiry invalidates selection and commit paths without erasing provenance.",
    },
    {
        "chainId": "IC_281_RESERVATION_CONFIRMATION_MANAGE",
        "title": "Reservation, confirmation, and manage cohesion",
        "summary": "Reservation truth, confirmation truth, appointment record, manage exposure, reminder posture, and reconciliation state cannot drift apart.",
        "impactObjects": [
            "CapacityReservation",
            "ReservationTruthProjection",
            "BookingTransaction",
            "BookingConfirmationTruthProjection",
            "AppointmentRecord",
            "BookingManageSettlement",
            "ReminderPlan",
        ],
        "ownerTrackIds": ["par_286", "par_287", "par_288", "par_289", "par_292", "par_297"],
        "law": "Reservation truth, confirmation truth, and manage exposure cannot drift apart.",
    },
    {
        "chainId": "IC_281_ROUTE_PUBLICATION_CONTINUITY",
        "title": "Route publication and continuity freeze",
        "summary": "Publication, embedded session, or continuity evidence drift freezes stale booking mutation in the same shell.",
        "impactObjects": [
            "BookingContinuityEvidenceProjection",
            "PatientAppointmentWorkspaceProjection",
            "PatientAppointmentManageProjection",
            "PatientAppointmentArtifactProjection",
        ],
        "ownerTrackIds": ["par_288", "par_293", "par_297", "par_300", "par_301", "par_303"],
        "law": "Route publication, embedded session, or continuity-evidence drift freezes stale booking mutation in the same shell.",
    },
    {
        "chainId": "IC_281_WAITLIST_FALLBACK_TYPED",
        "title": "Typed waitlist and fallback obligation chain",
        "summary": "No-supply, deadline, fallback, callback, hub handoff, and assisted-booking branches remain typed and owner-bound.",
        "impactObjects": [
            "WaitlistEntry",
            "WaitlistOffer",
            "WaitlistFallbackObligation",
            "WaitlistContinuationTruthProjection",
            "AssistedBookingSession",
            "BookingExceptionQueue",
        ],
        "ownerTrackIds": ["par_290", "par_291", "par_298", "par_299", "par_301"],
        "law": "Waitlist and fallback obligations remain typed dependencies rather than improvised later branches.",
    },
]


EVENT_OWNER_OVERRIDES = [
    {
        "eventName": "booking.case.created",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_282",
        "status": "consistent",
        "reason": "BookingCase creation stays in the kernel track.",
    },
    {
        "eventName": "booking.capability.resolved",
        "frozenCatalogOwner": "par_283",
        "gateOwner": "par_283",
        "status": "consistent",
        "reason": "Capability tuple resolution stays solely in the capability engine.",
    },
    {
        "eventName": "booking.slots.fetched",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_284",
        "status": "collision_remediated",
        "reason": "Slot fetch lifecycle truth belongs to the slot snapshot pipeline, not the BookingCase kernel.",
    },
    {
        "eventName": "booking.offers.created",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_285",
        "status": "collision_remediated",
        "reason": "Offer generation belongs to the ranking and orchestration track.",
    },
    {
        "eventName": "booking.slot.selected",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_285",
        "status": "collision_remediated",
        "reason": "Selection rules belong to the offer orchestration track before hold and commit authority attach.",
    },
    {
        "eventName": "booking.slot.revalidated",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_287",
        "status": "collision_remediated",
        "reason": "Commit-path revalidation belongs to the booking transaction track.",
    },
    {
        "eventName": "booking.slot.revalidation.failed",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_287",
        "status": "collision_remediated",
        "reason": "Failed revalidation is part of commit-path truth, not case-kernel generic state.",
    },
    {
        "eventName": "booking.commit.started",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_287",
        "status": "collision_remediated",
        "reason": "BookingTransaction owns commit start truth.",
    },
    {
        "eventName": "booking.commit.confirmation_pending",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_287",
        "status": "collision_remediated",
        "reason": "Initial confirmation-pending settlement belongs to commit.",
    },
    {
        "eventName": "booking.commit.reconciliation_pending",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_287",
        "status": "collision_remediated",
        "reason": "Initial ambiguous reconciliation pending is emitted by commit before worker follow-up.",
    },
    {
        "eventName": "booking.commit.confirmed",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_287",
        "status": "collision_remediated",
        "reason": "Immediate authoritative confirmation belongs to commit.",
    },
    {
        "eventName": "booking.commit.ambiguous",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_287",
        "status": "collision_remediated",
        "reason": "Ambiguous commit outcomes originate in commit logic and are later reconciled by 292.",
    },
    {
        "eventName": "booking.confirmation.truth.updated",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_292",
        "status": "collision_remediated",
        "reason": "Ongoing confirmation-truth convergence belongs to reconciliation and dispute handling.",
    },
    {
        "eventName": "booking.appointment.created",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_287",
        "status": "collision_remediated",
        "reason": "AppointmentRecord creation belongs to authoritative commit success.",
    },
    {
        "eventName": "booking.reminders.scheduled",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_289",
        "status": "collision_remediated",
        "reason": "Reminder scheduling belongs to ReminderPlan orchestration.",
    },
    {
        "eventName": "booking.cancelled",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_288",
        "status": "collision_remediated",
        "reason": "Cancel mutations belong to appointment management commands.",
    },
    {
        "eventName": "booking.reschedule.started",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_288",
        "status": "collision_remediated",
        "reason": "Reschedule start belongs to appointment management commands.",
    },
    {
        "eventName": "booking.waitlist.joined",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_290",
        "status": "collision_remediated",
        "reason": "Waitlist entry creation belongs to the smart waitlist track.",
    },
    {
        "eventName": "booking.waitlist.deadline_evaluated",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_290",
        "status": "collision_remediated",
        "reason": "Deadline evaluation belongs to smart waitlist logic.",
    },
    {
        "eventName": "booking.waitlist.offer.sent",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_290",
        "status": "collision_remediated",
        "reason": "Waitlist offers belong to smart waitlist logic.",
    },
    {
        "eventName": "booking.waitlist.offer.accepted",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_290",
        "status": "collision_remediated",
        "reason": "Waitlist offer acceptance belongs to waitlist truth and continuation logic.",
    },
    {
        "eventName": "booking.waitlist.offer.expired",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_290",
        "status": "collision_remediated",
        "reason": "Waitlist offer expiry belongs to waitlist truth and deadline logic.",
    },
    {
        "eventName": "booking.waitlist.offer.superseded",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_290",
        "status": "collision_remediated",
        "reason": "Waitlist offer supersession belongs to waitlist truth and deadline logic.",
    },
    {
        "eventName": "booking.waitlist.fallback.required",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_290",
        "status": "collision_remediated",
        "reason": "Fallback obligation belongs to waitlist and no-supply continuation logic.",
    },
    {
        "eventName": "booking.fallback.callback_requested",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_290",
        "status": "collision_remediated",
        "reason": "Typed callback fallback is decided by waitlist and fallback obligation truth before staff handling.",
    },
    {
        "eventName": "booking.fallback.hub_requested",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_290",
        "status": "collision_remediated",
        "reason": "Typed hub fallback is decided by waitlist and fallback obligation truth before staff handling.",
    },
    {
        "eventName": "booking.exception.raised",
        "frozenCatalogOwner": "par_282",
        "gateOwner": "par_291",
        "status": "collision_remediated",
        "reason": "BookingExceptionQueue ownership belongs to assisted booking and exception handling.",
    },
]


OBJECT_OWNER_ROWS = [
    {
        "artifactId": "BookingIntent",
        "artifactType": "object",
        "objectFamilyGroup": "booking_case",
        "ownerTrack": "par_282",
        "ownerRole": "booking_kernel",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_booking_intent_schema"],
        "mutatingTracks": "par_282",
        "consumerTracks": "par_283|par_284|par_287|par_293|seq_306",
        "productionSurfaceRoots": f"{repo_path('packages/domains/booking/src/phase4-booking-case-kernel.ts')}|{repo_path('services/command-api/src/phase4-booking-case.ts')}",
        "ownershipNote": "Phase 4 starts from durable handoff lineage, not route-local state.",
    },
    {
        "artifactId": "BookingCase",
        "artifactType": "object",
        "objectFamilyGroup": "booking_case",
        "ownerTrack": "par_282",
        "ownerRole": "booking_kernel",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_booking_case_schema"],
        "mutatingTracks": "par_282",
        "consumerTracks": "par_283|par_284|par_287|par_288|par_290|par_293|par_299|seq_306",
        "productionSurfaceRoots": f"{repo_path('packages/domains/booking/src/phase4-booking-case-kernel.ts')}|{repo_path('services/command-api/src/phase4-booking-case.ts')}",
        "ownershipNote": "No later track may redefine the BookingCase transition graph.",
    },
    {
        "artifactId": "SearchPolicy",
        "artifactType": "object",
        "objectFamilyGroup": "booking_case",
        "ownerTrack": "par_282",
        "ownerRole": "booking_kernel",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_search_policy_schema"],
        "mutatingTracks": "par_282",
        "consumerTracks": "par_284|par_285|par_287",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-booking-case-kernel.ts"),
        "ownershipNote": "Search policy is case-governed and not re-owned by slot or ranking tracks.",
    },
    {
        "artifactId": "BookingCaseTransitionJournal",
        "artifactType": "object",
        "objectFamilyGroup": "booking_case",
        "ownerTrack": "par_282",
        "ownerRole": "booking_kernel",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_event_catalog"],
        "mutatingTracks": "par_282",
        "consumerTracks": "par_292|seq_307|seq_310",
        "productionSurfaceRoots": repo_path("services/command-api/src/phase4-booking-case.ts"),
        "ownershipNote": "Append-only case transition audit stays in the kernel track.",
    },
    {
        "artifactId": "ProviderCapabilityMatrix",
        "artifactType": "object",
        "objectFamilyGroup": "capability_tuple",
        "ownerTrack": "par_283",
        "ownerRole": "capability_engine",
        "freezeContractRef": FREEZE_CONTRACT_REFS["279_matrix_schema"],
        "mutatingTracks": "par_283",
        "consumerTracks": "par_284|par_288|par_293|par_297|seq_304|seq_305",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-booking-capability-engine.ts"),
        "ownershipNote": "Static inventory never becomes local route heuristics.",
    },
    {
        "artifactId": "AdapterContractProfile",
        "artifactType": "object",
        "objectFamilyGroup": "capability_tuple",
        "ownerTrack": "par_283",
        "ownerRole": "capability_engine",
        "freezeContractRef": FREEZE_CONTRACT_REFS["279_adapter_registry"],
        "mutatingTracks": "par_283",
        "consumerTracks": "par_284|par_287|seq_304",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-booking-capability-engine.ts"),
        "ownershipNote": "Adapter translation stays translation-only.",
    },
    {
        "artifactId": "DependencyDegradationProfile",
        "artifactType": "object",
        "objectFamilyGroup": "capability_tuple",
        "ownerTrack": "par_283",
        "ownerRole": "capability_engine",
        "freezeContractRef": FREEZE_CONTRACT_REFS["279_degradation_registry"],
        "mutatingTracks": "par_283",
        "consumerTracks": "par_284|par_287|par_290|seq_305",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-booking-capability-engine.ts"),
        "ownershipNote": "Degraded-mode truth stays in the capability engine.",
    },
    {
        "artifactId": "AuthoritativeReadAndConfirmationGatePolicy",
        "artifactType": "object",
        "objectFamilyGroup": "capability_tuple",
        "ownerTrack": "par_283",
        "ownerRole": "capability_engine",
        "freezeContractRef": FREEZE_CONTRACT_REFS["279_policy_registry"],
        "mutatingTracks": "par_283",
        "consumerTracks": "par_287|par_288|par_292",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-booking-capability-engine.ts"),
        "ownershipNote": "Confirmation-gate policy is not redefined by commit or reconciliation logic.",
    },
    {
        "artifactId": "BookingProviderAdapterBinding",
        "artifactType": "object",
        "objectFamilyGroup": "capability_tuple",
        "ownerTrack": "par_283",
        "ownerRole": "capability_engine",
        "freezeContractRef": FREEZE_CONTRACT_REFS["279_binding_schema"],
        "mutatingTracks": "par_283",
        "consumerTracks": "par_284|par_286|par_287|par_288|par_292",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-booking-capability-engine.ts"),
        "ownershipNote": "One compiled binding per legal tuple.",
    },
    {
        "artifactId": "BookingCapabilityResolution",
        "artifactType": "object",
        "objectFamilyGroup": "capability_tuple",
        "ownerTrack": "par_283",
        "ownerRole": "capability_engine",
        "freezeContractRef": FREEZE_CONTRACT_REFS["279_resolution_schema"],
        "mutatingTracks": "par_283",
        "consumerTracks": "par_284|par_287|par_288|par_293|par_299|seq_307",
        "productionSurfaceRoots": f"{repo_path('packages/domains/booking/src/phase4-booking-capability-engine.ts')}|{repo_path('services/command-api/src/phase4-booking-capability.ts')}",
        "ownershipNote": "Capability tuple supersession is fail-closed and single-owner.",
    },
    {
        "artifactId": "BookingCapabilityProjection",
        "artifactType": "object",
        "objectFamilyGroup": "capability_tuple",
        "ownerTrack": "par_283",
        "ownerRole": "capability_engine",
        "freezeContractRef": FREEZE_CONTRACT_REFS["279_projection_schema"],
        "mutatingTracks": "par_283",
        "consumerTracks": "par_293|par_297|par_299|par_300",
        "productionSurfaceRoots": f"{repo_path('packages/domains/booking/src/phase4-booking-capability-engine.ts')}|{repo_path('services/command-api/src/phase4-booking-capability.ts')}",
        "ownershipNote": "Patient and staff actionability render from projection, not local capability guesses.",
    },
    {
        "artifactId": "SlotSearchSession",
        "artifactType": "object",
        "objectFamilyGroup": "slot_snapshot",
        "ownerTrack": "par_284",
        "ownerRole": "slot_snapshot_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_slot_search_schema"],
        "mutatingTracks": "par_284",
        "consumerTracks": "par_285|par_294|seq_307",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-slot-search-pipeline.ts"),
        "ownershipNote": "Search session authority begins only after 282 and 283 publish lawful inputs.",
    },
    {
        "artifactId": "ProviderSearchSlice",
        "artifactType": "object",
        "objectFamilyGroup": "slot_snapshot",
        "ownerTrack": "par_284",
        "ownerRole": "slot_snapshot_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_provider_search_schema"],
        "mutatingTracks": "par_284",
        "consumerTracks": "par_285|seq_307",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-slot-search-pipeline.ts"),
        "ownershipNote": "Per-provider availability slice truth belongs to the snapshot pipeline.",
    },
    {
        "artifactId": "TemporalNormalizationEnvelope",
        "artifactType": "object",
        "objectFamilyGroup": "slot_snapshot",
        "ownerTrack": "par_284",
        "ownerRole": "slot_snapshot_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_temporal_schema"],
        "mutatingTracks": "par_284",
        "consumerTracks": "par_285|par_287|par_294",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-slot-search-pipeline.ts"),
        "ownershipNote": "Time normalization stays with the snapshot producer.",
    },
    {
        "artifactId": "CanonicalSlotIdentity",
        "artifactType": "object",
        "objectFamilyGroup": "slot_snapshot",
        "ownerTrack": "par_284",
        "ownerRole": "slot_snapshot_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_slot_identity_schema"],
        "mutatingTracks": "par_284",
        "consumerTracks": "par_285|par_286|par_287|par_294",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-slot-search-pipeline.ts"),
        "ownershipNote": "Canonical slot identity is the dedupe-safe input to ranking and reservation.",
    },
    {
        "artifactId": "NormalizedSlot",
        "artifactType": "object",
        "objectFamilyGroup": "slot_snapshot",
        "ownerTrack": "par_284",
        "ownerRole": "slot_snapshot_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_snapshot_schema"],
        "mutatingTracks": "par_284",
        "consumerTracks": "par_285|par_286|par_294",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-slot-search-pipeline.ts"),
        "ownershipNote": "Normalized slot rows are snapshot-owned, not recreated by ranking.",
    },
    {
        "artifactId": "SnapshotCandidateIndex",
        "artifactType": "object",
        "objectFamilyGroup": "slot_snapshot",
        "ownerTrack": "par_284",
        "ownerRole": "slot_snapshot_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_snapshot_schema"],
        "mutatingTracks": "par_284",
        "consumerTracks": "par_285|par_286|seq_307",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-slot-search-pipeline.ts"),
        "ownershipNote": "Candidate index stays with the snapshot pipeline to preserve provenance.",
    },
    {
        "artifactId": "SlotSetSnapshot",
        "artifactType": "object",
        "objectFamilyGroup": "slot_snapshot",
        "ownerTrack": "par_284",
        "ownerRole": "slot_snapshot_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_snapshot_schema"],
        "mutatingTracks": "par_284",
        "consumerTracks": "par_285|par_286|par_287|par_294|seq_307",
        "productionSurfaceRoots": f"{repo_path('packages/domains/booking/src/phase4-slot-search-pipeline.ts')}|{repo_path('services/command-api/src/phase4-slot-search.ts')}",
        "ownershipNote": "Snapshot expiry invalidation starts here.",
    },
    {
        "artifactId": "SlotSnapshotRecoveryState",
        "artifactType": "object",
        "objectFamilyGroup": "slot_snapshot",
        "ownerTrack": "par_284",
        "ownerRole": "slot_snapshot_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_snapshot_recovery_schema"],
        "mutatingTracks": "par_284",
        "consumerTracks": "par_294|par_301",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-slot-search-pipeline.ts"),
        "ownershipNote": "Same-shell stale and recovery posture stays snapshot-owned.",
    },
    {
        "artifactId": "RankPlan",
        "artifactType": "object",
        "objectFamilyGroup": "offer_ranking",
        "ownerTrack": "par_285",
        "ownerRole": "offer_orchestration",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_rank_plan_contract"],
        "mutatingTracks": "par_285",
        "consumerTracks": "par_294|par_295|seq_307",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-offer-orchestration.ts"),
        "ownershipNote": "Ranking formula execution belongs to the offer track.",
    },
    {
        "artifactId": "CapacityRankProof",
        "artifactType": "object",
        "objectFamilyGroup": "offer_ranking",
        "ownerTrack": "par_285",
        "ownerRole": "offer_orchestration",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_rank_plan_contract"],
        "mutatingTracks": "par_285",
        "consumerTracks": "par_295|seq_307",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-offer-orchestration.ts"),
        "ownershipNote": "Proof rows for ordering and truthful offer explanation stay with ranking.",
    },
    {
        "artifactId": "CapacityRankExplanation",
        "artifactType": "object",
        "objectFamilyGroup": "offer_ranking",
        "ownerTrack": "par_285",
        "ownerRole": "offer_orchestration",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_rank_plan_contract"],
        "mutatingTracks": "par_285",
        "consumerTracks": "par_295",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-offer-orchestration.ts"),
        "ownershipNote": "User-facing ranking explanation remains coupled to proof generation.",
    },
    {
        "artifactId": "OfferSession",
        "artifactType": "object",
        "objectFamilyGroup": "offer_ranking",
        "ownerTrack": "par_285",
        "ownerRole": "offer_orchestration",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_offer_session_schema"],
        "mutatingTracks": "par_285",
        "consumerTracks": "par_286|par_295|seq_307",
        "productionSurfaceRoots": f"{repo_path('packages/domains/booking/src/phase4-offer-orchestration.ts')}|{repo_path('services/command-api/src/phase4-offers.ts')}",
        "ownershipNote": "Offer sessions own truthful non-exclusive posture before reservation.",
    },
    {
        "artifactId": "CapacityReservation",
        "artifactType": "object",
        "objectFamilyGroup": "reservation_truth",
        "ownerTrack": "par_286",
        "ownerRole": "reservation_authority",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_reservation_truth_contract"],
        "mutatingTracks": "par_286",
        "consumerTracks": "par_287|par_295|seq_307",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-reservation-authority.ts"),
        "ownershipNote": "Soft and real holds belong to reservation authority, not offer selection or commit.",
    },
    {
        "artifactId": "ReservationTruthProjection",
        "artifactType": "object",
        "objectFamilyGroup": "reservation_truth",
        "ownerTrack": "par_286",
        "ownerRole": "reservation_authority",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_reservation_truth_contract"],
        "mutatingTracks": "par_286",
        "consumerTracks": "par_287|par_295|par_296|par_298|seq_307",
        "productionSurfaceRoots": f"{repo_path('packages/domains/booking/src/phase4-reservation-authority.ts')}|{repo_path('services/command-api/src/phase4-reservation-authority.ts')}",
        "ownershipNote": "Truthful hold posture is reservation-owned.",
    },
    {
        "artifactId": "BookingTransaction",
        "artifactType": "object",
        "objectFamilyGroup": "commit_truth",
        "ownerTrack": "par_287",
        "ownerRole": "commit_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_booking_transaction_schema"],
        "mutatingTracks": "par_287",
        "consumerTracks": "par_292|par_296|seq_307|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-booking-commit.ts"),
        "ownershipNote": "Commit path and compensation law stay in one track.",
    },
    {
        "artifactId": "ExternalConfirmationGate",
        "artifactType": "object",
        "objectFamilyGroup": "commit_truth",
        "ownerTrack": "par_287",
        "ownerRole": "commit_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_booking_transaction_schema"],
        "mutatingTracks": "par_287|par_292",
        "consumerTracks": "par_296|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-booking-commit.ts"),
        "ownershipNote": "287 owns creation and 292 owns worker-driven progression; 281 marks 292 as the only downstream mutator after creation.",
    },
    {
        "artifactId": "BookingConfirmationTruthProjection",
        "artifactType": "object",
        "objectFamilyGroup": "commit_truth",
        "ownerTrack": "par_287",
        "ownerRole": "commit_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_confirmation_truth_schema"],
        "mutatingTracks": "par_287|par_292",
        "consumerTracks": "par_296|par_297|seq_307|seq_308",
        "productionSurfaceRoots": f"{repo_path('packages/domains/booking/src/phase4-booking-commit.ts')}|{repo_path('services/command-api/src/phase4-booking-commit.ts')}",
        "ownershipNote": "287 owns initial truth write; 292 owns post-commit convergence updates.",
    },
    {
        "artifactId": "AppointmentRecord",
        "artifactType": "object",
        "objectFamilyGroup": "commit_truth",
        "ownerTrack": "par_287",
        "ownerRole": "commit_pipeline",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_confirmation_truth_schema"],
        "mutatingTracks": "par_287|par_288|par_289|par_292",
        "consumerTracks": "par_297|par_300|par_303|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-booking-commit.ts"),
        "ownershipNote": "Authoritative appointment creation belongs to commit; later tracks mutate only through explicit command paths.",
    },
    {
        "artifactId": "AppointmentManageCommand",
        "artifactType": "object",
        "objectFamilyGroup": "manage_and_artifact",
        "ownerTrack": "par_288",
        "ownerRole": "manage_commands",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_manage_bundle"],
        "mutatingTracks": "par_288",
        "consumerTracks": "par_297|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-appointment-manage.ts"),
        "ownershipNote": "Manage command fences stay with one backend owner.",
    },
    {
        "artifactId": "BookingManageSettlement",
        "artifactType": "object",
        "objectFamilyGroup": "manage_and_artifact",
        "ownerTrack": "par_288",
        "ownerRole": "manage_commands",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_manage_bundle"],
        "mutatingTracks": "par_288",
        "consumerTracks": "par_297|par_300|par_301|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-appointment-manage.ts"),
        "ownershipNote": "Manage settlement is distinct from AppointmentRecord and reminder state.",
    },
    {
        "artifactId": "BookingContinuityEvidenceProjection",
        "artifactType": "object",
        "objectFamilyGroup": "manage_and_artifact",
        "ownerTrack": "par_288",
        "ownerRole": "manage_commands",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_manage_bundle"],
        "mutatingTracks": "par_288",
        "consumerTracks": "par_293|par_297|par_300|par_301|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-appointment-manage.ts"),
        "ownershipNote": "Continuity evidence is refreshed by manage settlement, not by frontend shells.",
    },
    {
        "artifactId": "AppointmentPresentationArtifact",
        "artifactType": "object",
        "objectFamilyGroup": "manage_and_artifact",
        "ownerTrack": "par_288",
        "ownerRole": "manage_commands",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_manage_bundle"],
        "mutatingTracks": "par_288|par_303",
        "consumerTracks": "par_297|par_300|par_303",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-appointment-manage.ts"),
        "ownershipNote": "Backend artifact truth is 288-owned; 303 hardens accessibility and parity on the rendered artifact surface.",
    },
    {
        "artifactId": "ReminderPlan",
        "artifactType": "object",
        "objectFamilyGroup": "reminder",
        "ownerTrack": "par_289",
        "ownerRole": "reminder_scheduler",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_manage_bundle"],
        "mutatingTracks": "par_289",
        "consumerTracks": "par_297|seq_308|seq_309",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-reminder-scheduler.ts"),
        "ownershipNote": "Reminder scheduling stays distinct from manage commands and appointment truth.",
    },
    {
        "artifactId": "WaitlistEntry",
        "artifactType": "object",
        "objectFamilyGroup": "waitlist_and_fallback",
        "ownerTrack": "par_290",
        "ownerRole": "waitlist_runtime",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_waitlist_bundle"],
        "mutatingTracks": "par_290",
        "consumerTracks": "par_298|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-smart-waitlist.ts"),
        "ownershipNote": "Waitlist entry ownership is explicit and not left as a generic later seam.",
    },
    {
        "artifactId": "WaitlistDeadlineEvaluation",
        "artifactType": "object",
        "objectFamilyGroup": "waitlist_and_fallback",
        "ownerTrack": "par_290",
        "ownerRole": "waitlist_runtime",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_waitlist_bundle"],
        "mutatingTracks": "par_290",
        "consumerTracks": "par_298|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-smart-waitlist.ts"),
        "ownershipNote": "Deadline truth belongs to waitlist logic.",
    },
    {
        "artifactId": "WaitlistFallbackObligation",
        "artifactType": "object",
        "objectFamilyGroup": "waitlist_and_fallback",
        "ownerTrack": "par_290",
        "ownerRole": "waitlist_runtime",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_waitlist_bundle"],
        "mutatingTracks": "par_290",
        "consumerTracks": "par_291|par_298|par_301|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-smart-waitlist.ts"),
        "ownershipNote": "Fallback obligation typing closes the 'figure it out later' gap.",
    },
    {
        "artifactId": "WaitlistOffer",
        "artifactType": "object",
        "objectFamilyGroup": "waitlist_and_fallback",
        "ownerTrack": "par_290",
        "ownerRole": "waitlist_runtime",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_waitlist_bundle"],
        "mutatingTracks": "par_290",
        "consumerTracks": "par_298|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-smart-waitlist.ts"),
        "ownershipNote": "Offer lifecycle stays in waitlist runtime.",
    },
    {
        "artifactId": "WaitlistContinuationTruthProjection",
        "artifactType": "object",
        "objectFamilyGroup": "waitlist_and_fallback",
        "ownerTrack": "par_290",
        "ownerRole": "waitlist_runtime",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_waitlist_bundle"],
        "mutatingTracks": "par_290",
        "consumerTracks": "par_298|par_301|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-smart-waitlist.ts"),
        "ownershipNote": "Continuation truth stays typed and backend-owned.",
    },
    {
        "artifactId": "AssistedBookingSession",
        "artifactType": "object",
        "objectFamilyGroup": "assisted_booking",
        "ownerTrack": "par_291",
        "ownerRole": "staff_assisted_api",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_projection_bundle"],
        "mutatingTracks": "par_291",
        "consumerTracks": "par_299|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-staff-assisted-booking.ts"),
        "ownershipNote": "Staff-assisted session state belongs to the handoff API track.",
    },
    {
        "artifactId": "BookingException",
        "artifactType": "object",
        "objectFamilyGroup": "assisted_booking",
        "ownerTrack": "par_291",
        "ownerRole": "staff_assisted_api",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_event_catalog"],
        "mutatingTracks": "par_291",
        "consumerTracks": "par_299|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-staff-assisted-booking.ts"),
        "ownershipNote": "Booking exceptions become explicit queueable objects in 291.",
    },
    {
        "artifactId": "BookingExceptionQueue",
        "artifactType": "object",
        "objectFamilyGroup": "assisted_booking",
        "ownerTrack": "par_291",
        "ownerRole": "staff_assisted_api",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_event_catalog"],
        "mutatingTracks": "par_291",
        "consumerTracks": "par_299|seq_308",
        "productionSurfaceRoots": repo_path("packages/domains/booking/src/phase4-staff-assisted-booking.ts"),
        "ownershipNote": "Queue ownership stays with assisted booking and exception handling.",
    },
    {
        "artifactId": "BookingReconciliationActionRecord",
        "artifactType": "object",
        "objectFamilyGroup": "reconciliation",
        "ownerTrack": "par_292",
        "ownerRole": "reconciliation_worker",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_booking_transaction_schema"],
        "mutatingTracks": "par_292",
        "consumerTracks": "par_296|seq_308|seq_309",
        "productionSurfaceRoots": repo_path("services/command-api/src/phase4-booking-reconciliation.ts"),
        "ownershipNote": "Worker-owned settlement lineage for ambiguous or disputed confirmation truth.",
    },
    {
        "artifactId": "ExternalConfirmationEvidenceEnvelope",
        "artifactType": "object",
        "objectFamilyGroup": "reconciliation",
        "ownerTrack": "par_292",
        "ownerRole": "reconciliation_worker",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_confirmation_truth_schema"],
        "mutatingTracks": "par_292",
        "consumerTracks": "par_296|seq_308|seq_309",
        "productionSurfaceRoots": repo_path("services/command-api/src/phase4-booking-reconciliation.ts"),
        "ownershipNote": "Supplier-side confirmation evidence becomes explicit worker-owned input.",
    },
    {
        "artifactId": "PatientAppointmentWorkspaceProjection",
        "artifactType": "projection",
        "objectFamilyGroup": "patient_workspace",
        "ownerTrack": "par_293",
        "ownerRole": "patient_booking_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_projection_bundle"],
        "mutatingTracks": "par_293",
        "consumerTracks": "par_300|par_301|par_302|seq_309",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-booking-workspace.tsx"),
        "ownershipNote": "The patient workspace shell owns workspace projection composition, not backend mutation truth.",
    },
    {
        "artifactId": "PatientAppointmentListProjection",
        "artifactType": "projection",
        "objectFamilyGroup": "patient_workspace",
        "ownerTrack": "par_293",
        "ownerRole": "patient_booking_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_projection_bundle"],
        "mutatingTracks": "par_293",
        "consumerTracks": "par_300|par_302|seq_309",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-booking-workspace.tsx"),
        "ownershipNote": "List projection is workspace-owned, not artifact parity-owned.",
    },
    {
        "artifactId": "SlotSearchResultsSurface",
        "artifactType": "projection",
        "objectFamilyGroup": "patient_search",
        "ownerTrack": "par_294",
        "ownerRole": "patient_booking_search_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_snapshot_schema"],
        "mutatingTracks": "par_294",
        "consumerTracks": "par_295|par_302|seq_309",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-booking-search-results.tsx"),
        "ownershipNote": "Search result rendering is a frontend consumer of snapshot truth.",
    },
    {
        "artifactId": "OfferSelectionSurface",
        "artifactType": "projection",
        "objectFamilyGroup": "patient_selection",
        "ownerTrack": "par_295",
        "ownerRole": "patient_offer_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_offer_session_schema"],
        "mutatingTracks": "par_295",
        "consumerTracks": "par_296|par_302|seq_309",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-offer-selection.tsx"),
        "ownershipNote": "Truthful hold posture rendering belongs to the offer-selection UI track.",
    },
    {
        "artifactId": "BookingConfirmationRecoverySurface",
        "artifactType": "projection",
        "objectFamilyGroup": "patient_confirmation",
        "ownerTrack": "par_296",
        "ownerRole": "patient_confirmation_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_confirmation_truth_schema"],
        "mutatingTracks": "par_296",
        "consumerTracks": "par_301|par_302|seq_309",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-booking-confirmation.tsx"),
        "ownershipNote": "Pending, disputed, and recovery states render from confirmation truth, not route-local heuristics.",
    },
    {
        "artifactId": "PatientAppointmentManageProjection",
        "artifactType": "projection",
        "objectFamilyGroup": "patient_manage",
        "ownerTrack": "par_297",
        "ownerRole": "patient_manage_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_projection_bundle"],
        "mutatingTracks": "par_297",
        "consumerTracks": "par_302|par_303|seq_309",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-appointment-manage.tsx"),
        "ownershipNote": "Manage route composition belongs to 297, while backend manage truth stays in 288 and 289.",
    },
    {
        "artifactId": "WaitlistExperienceSurface",
        "artifactType": "projection",
        "objectFamilyGroup": "patient_waitlist",
        "ownerTrack": "par_298",
        "ownerRole": "patient_waitlist_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["280_waitlist_bundle"],
        "mutatingTracks": "par_298",
        "consumerTracks": "par_301|par_302|seq_309",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-booking-waitlist.tsx"),
        "ownershipNote": "Waitlist enrollment and offer acceptance UI belongs to 298.",
    },
    {
        "artifactId": "StaffBookingHandoffPanel",
        "artifactType": "projection",
        "objectFamilyGroup": "staff_assist",
        "ownerTrack": "par_299",
        "ownerRole": "staff_booking_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_projection_bundle"],
        "mutatingTracks": "par_299",
        "consumerTracks": "seq_309",
        "productionSurfaceRoots": repo_path("apps/clinical-workspace/src/staff-booking-handoff-panel.tsx"),
        "ownershipNote": "Staff assisted booking UI remains a projection over 291-owned backend truth.",
    },
    {
        "artifactId": "RecordOriginBookingEntrySurface",
        "artifactType": "projection",
        "objectFamilyGroup": "record_entry",
        "ownerTrack": "par_300",
        "ownerRole": "patient_record_entry_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_route_registry"],
        "mutatingTracks": "par_300",
        "consumerTracks": "par_301|par_302|seq_309",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-booking-entry.tsx"),
        "ownershipNote": "Record-origin continuation and booking entry surfaces belong to 300.",
    },
    {
        "artifactId": "PatientActionRecoveryEnvelope",
        "artifactType": "projection",
        "objectFamilyGroup": "recovery_envelope",
        "ownerTrack": "par_301",
        "ownerRole": "patient_recovery_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_route_registry"],
        "mutatingTracks": "par_301",
        "consumerTracks": "par_302|seq_309|seq_310",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-booking-recovery.tsx"),
        "ownershipNote": "Recovery envelope rendering belongs to 301 and consumes frozen recovery law.",
    },
    {
        "artifactId": "PatientAppointmentArtifactProjection",
        "artifactType": "projection",
        "objectFamilyGroup": "mobile_and_artifact",
        "ownerTrack": "par_303",
        "ownerRole": "artifact_accessibility_frontend",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_projection_bundle"],
        "mutatingTracks": "par_303",
        "consumerTracks": "seq_309|seq_310",
        "productionSurfaceRoots": repo_path("apps/patient-web/src/patient-booking-artifacts.tsx"),
        "ownershipNote": "Rendered artifact parity and accessibility hardening belongs to 303.",
    },
    {
        "artifactId": "ProviderSandboxConfiguration",
        "artifactType": "surface",
        "objectFamilyGroup": "provider_activation",
        "ownerTrack": "seq_304",
        "ownerRole": "provider_activation",
        "freezeContractRef": FREEZE_CONTRACT_REFS["279_matrix_schema"],
        "mutatingTracks": "seq_304",
        "consumerTracks": "seq_305|seq_306|seq_310",
        "productionSurfaceRoots": repo_path("tools/provider-sandboxes"),
        "ownershipNote": "Live supplier onboarding remains explicitly later and outside the simulator-backed first wave.",
    },
    {
        "artifactId": "ProviderCapabilityEvidencePack",
        "artifactType": "surface",
        "objectFamilyGroup": "provider_activation",
        "ownerTrack": "seq_305",
        "ownerRole": "provider_activation",
        "freezeContractRef": FREEZE_CONTRACT_REFS["279_matrix_schema"],
        "mutatingTracks": "seq_305",
        "consumerTracks": "seq_306|seq_310",
        "productionSurfaceRoots": repo_path("tools/provider-evidence"),
        "ownershipNote": "Real provider evidence is deferred until sandbox configuration exists.",
    },
    {
        "artifactId": "BookingPortalNotificationIntegration",
        "artifactType": "surface",
        "objectFamilyGroup": "integration",
        "ownerTrack": "seq_306",
        "ownerRole": "runtime_integration",
        "freezeContractRef": FREEZE_CONTRACT_REFS["278_route_registry"],
        "mutatingTracks": "seq_306",
        "consumerTracks": "seq_307|seq_308|seq_309|seq_310",
        "productionSurfaceRoots": repo_path("services/command-api/src/phase4-booking-integration.ts"),
        "ownershipNote": "Cross-system integration is explicitly later than the first local booking wave.",
    },
    {
        "artifactId": "Phase4CoreMatrixSuite",
        "artifactType": "suite",
        "objectFamilyGroup": "assurance",
        "ownerTrack": "seq_307",
        "ownerRole": "assurance",
        "freezeContractRef": repo_path("prompt/307.md"),
        "mutatingTracks": "seq_307",
        "consumerTracks": "seq_308|seq_309|seq_310",
        "productionSurfaceRoots": repo_path("tests/playwright"),
        "ownershipNote": "Core booking matrix assurance belongs to 307.",
    },
    {
        "artifactId": "Phase4ManageWaitlistAssistedMatrixSuite",
        "artifactType": "suite",
        "objectFamilyGroup": "assurance",
        "ownerTrack": "seq_308",
        "ownerRole": "assurance",
        "freezeContractRef": repo_path("prompt/308.md"),
        "mutatingTracks": "seq_308",
        "consumerTracks": "seq_309|seq_310",
        "productionSurfaceRoots": repo_path("tests/playwright"),
        "ownershipNote": "Manage, waitlist, assisted booking, and reconciliation assurance belongs to 308.",
    },
    {
        "artifactId": "Phase4BookingE2ESuite",
        "artifactType": "suite",
        "objectFamilyGroup": "assurance",
        "ownerTrack": "seq_309",
        "ownerRole": "assurance",
        "freezeContractRef": repo_path("prompt/309.md"),
        "mutatingTracks": "seq_309",
        "consumerTracks": "seq_310",
        "productionSurfaceRoots": repo_path("tests/playwright"),
        "ownershipNote": "End-to-end patient/staff accessibility and load assurance belongs to 309.",
    },
    {
        "artifactId": "Phase4BookingExitGate",
        "artifactType": "suite",
        "objectFamilyGroup": "assurance",
        "ownerTrack": "seq_310",
        "ownerRole": "governance",
        "freezeContractRef": repo_path("prompt/310.md"),
        "mutatingTracks": "seq_310",
        "consumerTracks": "",
        "productionSurfaceRoots": repo_path("docs/governance"),
        "ownershipNote": "Final phase exit decision belongs to 310.",
    },
]


GAP_FILES = [
    {
        "relativePath": "data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_EVENT_OWNER_DRIFT.json",
        "payload": {
            "taskId": TASK_ID,
            "missingSurface": "Exact downstream implementation ownership for booking event names frozen too broadly in 278.",
            "expectedOwnerTask": "seq_281",
            "temporaryFallback": "281 publishes an explicit event-owner override registry and blocks downstream tracks from trusting the 278 implementationOwnerTask field directly.",
            "riskIfUnresolved": "282 would absorb slot, offer, reminder, waitlist, and reconciliation ownership that belongs to later tracks.",
            "followUpAction": "Implement tracks 284 to 292 against the 281 override map and keep 278 frozen as the naming pack only.",
        },
    },
    {
        "relativePath": "data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_WAITLIST_FALLBACK_OWNER_MAP.json",
        "payload": {
            "taskId": TASK_ID,
            "missingSurface": "280 gap ownership uses generic labels for waitlist, assisted booking, and provider execution seams.",
            "expectedOwnerTask": "seq_281",
            "temporaryFallback": "281 remaps waitlist to 290, staff-assisted fallback to 291, and reconciliation truth to 292 in one explicit readiness registry.",
            "riskIfUnresolved": "Later tracks could each claim the same fallback or waitlist mutation authority.",
            "followUpAction": "Treat the 281 owner matrix as the authoritative parallel-launch boundary for waitlist and fallback work.",
        },
    },
    {
        "relativePath": "data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json",
        "payload": {
            "taskId": TASK_ID,
            "missingSurface": "Live provider activation, live control-plane feeds, and live browser fetch adoption remain later than the first local-booking wave.",
            "expectedOwnerTask": "seq_304",
            "temporaryFallback": "The first wave stays simulator-backed and contract-faithful; frontend booking routes remain blocked or deferred until runtime truth exists.",
            "riskIfUnresolved": "The gate could overstate readiness and let downstream tracks assume live provider truth or live fetch parity that does not exist yet.",
            "followUpAction": "Keep 304 to 306 deferred until sandbox, evidence, and integration work is explicitly opened.",
        },
    },
]


def make_track(
    number: int,
    title: str,
    status: str,
    owner_role: str,
    object_family_group: str,
    primary_object_families: list[str],
    mutation_authority: list[str],
    consume_only: list[str],
    upstream_tracks: list[str],
    upstream_contracts: list[str],
    invalidation_chains: list[str],
    readiness_reason: str,
    surface_roots: list[str],
    validator_script: str,
    mandatory_tests: list[str],
    expected_dependents: list[str],
    merge_criteria: list[str],
    current_gap_refs: list[str],
    parallel_safe_with: list[str] | None = None,
    blocked_reason: str = "",
    launch_packet_ref: str | None = None,
) -> dict[str, object]:
    track_id = SHORT_IDS[number]
    return {
        "trackId": track_id,
        "promptTaskId": PROMPT_IDS[number],
        "promptPath": repo_path(f"prompt/{number}.md"),
        "sequence": number,
        "title": title,
        "status": status,
        "wave": (
            "first_wave"
            if number in {282, 283}
            else "backend_wave"
            if number <= 292
            else "frontend_wave"
            if number <= 303
            else "deferred_activation"
            if number <= 306
            else "deferred_assurance"
        ),
        "ownerRole": owner_role,
        "objectFamilyGroup": object_family_group,
        "primaryObjectFamilies": primary_object_families,
        "mutationAuthority": mutation_authority,
        "consumeOnly": consume_only,
        "upstreamTrackRefs": upstream_tracks,
        "upstreamContractRefs": upstream_contracts,
        "invalidationChainRefs": invalidation_chains,
        "readinessReason": readiness_reason,
        "blockedReason": blocked_reason,
        "expectedSurfaceRoots": surface_roots,
        "validatorScript": validator_script,
        "mandatoryTests": mandatory_tests,
        "expectedDownstreamDependents": expected_dependents,
        "mergeCriteria": merge_criteria,
        "currentGapRefs": current_gap_refs,
        "parallelSafeWith": parallel_safe_with or [],
        "launchPacketRef": launch_packet_ref,
        "evidenceRefs": [
            repo_path(f"prompt/{number}.md"),
            SHARED_REFS["phase4_booking"],
            SHARED_REFS["phase0"],
        ]
        + upstream_contracts[:4],
    }


TRACKS = [
    make_track(
        282,
        "Executable BookingCase kernel and durable intent lineage",
        "ready",
        "booking_kernel",
        "booking_case",
        ["BookingIntent", "BookingCase", "SearchPolicy", "BookingCaseTransitionJournal"],
        ["BookingIntent", "BookingCase", "SearchPolicy", "BookingCaseTransitionJournal"],
        ["BookingProviderAdapterBinding", "BookingCapabilityResolution", "SlotSetSnapshot", "OfferSession", "CapacityReservation"],
        [],
        [
            FREEZE_CONTRACT_REFS["278_booking_intent_schema"],
            FREEZE_CONTRACT_REFS["278_booking_case_schema"],
            FREEZE_CONTRACT_REFS["278_search_policy_schema"],
            FREEZE_CONTRACT_REFS["278_state_machine"],
            FREEZE_CONTRACT_REFS["278_event_catalog"],
        ],
        ["IC_281_ROUTE_PUBLICATION_CONTINUITY", "IC_281_RESERVATION_CONFIRMATION_MANAGE"],
        "Ready now because 278 froze the case kernel, 279 froze capability inputs, 280 froze downstream typed seams, and 281 forbids 282 from claiming slot or capability ownership.",
        [
            repo_path("packages/domains/booking/src/index.ts"),
            repo_path("packages/domains/booking/src/phase4-booking-case-kernel.ts"),
            repo_path("packages/domains/booking/tests/phase4-booking-case-kernel.test.ts"),
            repo_path("services/command-api/src/phase4-booking-case.ts"),
            repo_path("services/command-api/tests/phase4-booking-case.integration.test.js"),
            repo_path("services/command-api/migrations/131_phase4_booking_case_kernel.sql"),
        ],
        "python3 ./tools/analysis/validate_282_booking_case_kernel.py",
        [
            "pnpm --dir /Users/test/Code/V/packages/domains/booking typecheck",
            "pnpm --dir /Users/test/Code/V/services/command-api typecheck",
            "pnpm --dir /Users/test/Code/V/packages/domains/booking exec vitest run tests/phase4-booking-case-kernel.test.ts",
            "pnpm --dir /Users/test/Code/V/services/command-api exec vitest run tests/phase4-booking-case.integration.test.js",
            "python3 /Users/test/Code/V/tools/analysis/validate_282_booking_case_kernel.py",
        ],
        ["par_284", "par_287", "par_293", "par_299"],
        [
            "Schema fields and state vocabulary must remain byte-compatible with 278.",
            "Migrations must preserve replayable BookingIntent lineage and append-only transition audit.",
            "Event emission must use the 281 owner remap and never emit slot, offer, reminder, waitlist, or reconciliation events from 282.",
            "Stale decision epoch, stale request lease, and identity-repair freeze tests must fail closed.",
            "Telemetry and audit output must remain PHI-safe on case transition surfaces.",
        ],
        [
            repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_EVENT_OWNER_DRIFT.json"),
            repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json"),
        ],
        parallel_safe_with=["par_283"],
        launch_packet_ref=repo_path("data/launchpacks/281_track_launch_packet_282.json"),
    ),
    make_track(
        283,
        "Executable capability matrix compiler and tuple resolution engine",
        "ready",
        "capability_engine",
        "capability_tuple",
        [
            "ProviderCapabilityMatrix",
            "AdapterContractProfile",
            "DependencyDegradationProfile",
            "AuthoritativeReadAndConfirmationGatePolicy",
            "BookingProviderAdapterBinding",
            "BookingCapabilityResolution",
            "BookingCapabilityProjection",
        ],
        [
            "ProviderCapabilityMatrix",
            "AdapterContractProfile",
            "DependencyDegradationProfile",
            "AuthoritativeReadAndConfirmationGatePolicy",
            "BookingProviderAdapterBinding",
            "BookingCapabilityResolution",
            "BookingCapabilityProjection",
        ],
        ["BookingCase", "SearchPolicy", "SlotSearchSession", "AppointmentRecord"],
        [],
        [
            FREEZE_CONTRACT_REFS["279_matrix_schema"],
            FREEZE_CONTRACT_REFS["279_adapter_registry"],
            FREEZE_CONTRACT_REFS["279_degradation_registry"],
            FREEZE_CONTRACT_REFS["279_policy_registry"],
            FREEZE_CONTRACT_REFS["279_binding_schema"],
            FREEZE_CONTRACT_REFS["279_resolution_schema"],
            FREEZE_CONTRACT_REFS["279_projection_schema"],
            FREEZE_CONTRACT_REFS["278_booking_case_schema"],
        ],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Ready now because 279 froze the tuple law and 281 explicitly blocks 283 from redefining BookingCase or slot semantics while allowing a parallel compile-and-resolve path.",
        [
            repo_path("packages/domains/booking/src/index.ts"),
            repo_path("packages/domains/booking/src/phase4-booking-capability-engine.ts"),
            repo_path("packages/domains/booking/tests/phase4-booking-capability-engine.test.ts"),
            repo_path("services/command-api/src/phase4-booking-capability.ts"),
            repo_path("services/command-api/tests/phase4-booking-capability.integration.test.js"),
            repo_path("services/command-api/migrations/132_phase4_booking_capability_engine.sql"),
        ],
        "python3 ./tools/analysis/validate_283_capability_engine.py",
        [
            "pnpm --dir /Users/test/Code/V/packages/domains/booking typecheck",
            "pnpm --dir /Users/test/Code/V/services/command-api typecheck",
            "pnpm --dir /Users/test/Code/V/packages/domains/booking exec vitest run tests/phase4-booking-capability-engine.test.ts",
            "pnpm --dir /Users/test/Code/V/services/command-api exec vitest run tests/phase4-booking-capability.integration.test.js",
            "python3 /Users/test/Code/V/tools/analysis/validate_283_capability_engine.py",
        ],
        ["par_284", "par_288", "par_293", "seq_304", "seq_307"],
        [
            "Schema fields, capability states, and tuple hash inputs must remain byte-compatible with 279.",
            "Binding compilation must name exactly one current adapter profile, degradation profile, and confirmation gate policy.",
            "Capability tuple supersession must invalidate stale resolutions without widening patient action scope.",
            "Blocked reasons and fallback actions must remain machine-readable for downstream UI and support tracks.",
            "Telemetry and diagnostics must stay PHI-safe and reason-code based.",
        ],
        [
            repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_EVENT_OWNER_DRIFT.json"),
            repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json"),
        ],
        parallel_safe_with=["par_282"],
        launch_packet_ref=repo_path("data/launchpacks/281_track_launch_packet_283.json"),
    ),
    make_track(
        284,
        "Slot search, normalization, and availability snapshot pipeline",
        "blocked",
        "slot_snapshot_pipeline",
        "slot_snapshot",
        [
            "SlotSearchSession",
            "ProviderSearchSlice",
            "TemporalNormalizationEnvelope",
            "CanonicalSlotIdentity",
            "NormalizedSlot",
            "SnapshotCandidateIndex",
            "SlotSetSnapshot",
            "SlotSnapshotRecoveryState",
        ],
        [
            "SlotSearchSession",
            "ProviderSearchSlice",
            "TemporalNormalizationEnvelope",
            "CanonicalSlotIdentity",
            "NormalizedSlot",
            "SnapshotCandidateIndex",
            "SlotSetSnapshot",
            "SlotSnapshotRecoveryState",
        ],
        ["BookingCase", "SearchPolicy", "BookingCapabilityResolution", "BookingProviderAdapterBinding"],
        ["par_282", "par_283"],
        [
            FREEZE_CONTRACT_REFS["280_slot_search_schema"],
            FREEZE_CONTRACT_REFS["280_provider_search_schema"],
            FREEZE_CONTRACT_REFS["280_temporal_schema"],
            FREEZE_CONTRACT_REFS["280_slot_identity_schema"],
            FREEZE_CONTRACT_REFS["280_snapshot_schema"],
            FREEZE_CONTRACT_REFS["280_snapshot_recovery_schema"],
        ],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_SNAPSHOT_EXPIRY"],
        "Blocked until 282 publishes durable case creation and 283 publishes live capability resolution queries for the exact tuple.",
        [
            repo_path("packages/domains/booking/src/phase4-slot-search-pipeline.ts"),
            repo_path("services/command-api/src/phase4-slot-search.ts"),
            repo_path("packages/event-contracts/schemas/booking/booking.slots.fetched.v1.schema.json"),
        ],
        "python3 ./tools/analysis/validate_284_slot_snapshot_pipeline.py",
        ["python3 ./tools/analysis/validate_284_slot_snapshot_pipeline.py"],
        ["par_285", "par_294", "seq_307"],
        ["Must consume 282 and 283 surfaces instead of recreating case or capability truth locally."],
        [],
        blocked_reason="Needs executable BookingCase and capability-query surfaces before snapshot production is lawful.",
    ),
    make_track(
        285,
        "Slot scoring, offer orchestration, and selection rules",
        "blocked",
        "offer_orchestration",
        "offer_ranking",
        ["RankPlan", "CapacityRankProof", "CapacityRankExplanation", "OfferSession"],
        ["RankPlan", "CapacityRankProof", "CapacityRankExplanation", "OfferSession"],
        ["SlotSetSnapshot", "CanonicalSlotIdentity", "SearchPolicy"],
        ["par_284"],
        [FREEZE_CONTRACT_REFS["280_rank_plan_contract"], FREEZE_CONTRACT_REFS["280_offer_session_schema"]],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_SNAPSHOT_EXPIRY"],
        "Blocked until 284 publishes canonical snapshot and candidate-index truth.",
        [
            repo_path("packages/domains/booking/src/phase4-offer-orchestration.ts"),
            repo_path("services/command-api/src/phase4-offers.ts"),
            repo_path("packages/event-contracts/schemas/booking/booking.offers.created.v1.schema.json"),
        ],
        "python3 ./tools/analysis/validate_285_capacity_rank_and_offer_sessions.py",
        ["python3 ./tools/analysis/validate_285_capacity_rank_and_offer_sessions.py"],
        ["par_286", "par_295", "seq_307"],
        ["Must keep truthful non-exclusive offer posture distinct from reservation authority."],
        [],
        blocked_reason="Needs 284 snapshot production and freshness law.",
    ),
    make_track(
        286,
        "Reservation authority, soft hold, and real hold flows",
        "blocked",
        "reservation_authority",
        "reservation_truth",
        ["CapacityReservation", "ReservationTruthProjection"],
        ["CapacityReservation", "ReservationTruthProjection"],
        ["OfferSession", "SlotSetSnapshot", "BookingProviderAdapterBinding"],
        ["par_285"],
        [FREEZE_CONTRACT_REFS["280_reservation_truth_contract"], FREEZE_CONTRACT_REFS["280_offer_session_schema"]],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_SNAPSHOT_EXPIRY", "IC_281_RESERVATION_CONFIRMATION_MANAGE"],
        "Blocked until 285 owns ranked offer sessions and truthful selection semantics.",
        [
            repo_path("packages/domains/booking/src/phase4-reservation-authority.ts"),
            repo_path("services/command-api/src/phase4-reservation-authority.ts"),
        ],
        "python3 ./tools/analysis/validate_286_reservation_authority_soft_hold_and_real_hold_flows.py",
        ["python3 ./tools/analysis/validate_286_reservation_authority_soft_hold_and_real_hold_flows.py"],
        ["par_287", "par_290", "par_295", "seq_307"],
        ["Must not let selected state imply held state before reservation truth exists."],
        [],
        blocked_reason="Needs offer-session ownership and ranking proof from 285.",
    ),
    make_track(
        287,
        "Commit path, revalidation, appointment record, and compensation logic",
        "blocked",
        "commit_pipeline",
        "commit_truth",
        ["BookingTransaction", "ExternalConfirmationGate", "BookingConfirmationTruthProjection", "AppointmentRecord"],
        ["BookingTransaction", "ExternalConfirmationGate", "BookingConfirmationTruthProjection", "AppointmentRecord"],
        ["CapacityReservation", "ReservationTruthProjection", "BookingCapabilityResolution", "BookingProviderAdapterBinding"],
        ["par_286"],
        [
            FREEZE_CONTRACT_REFS["280_booking_transaction_schema"],
            FREEZE_CONTRACT_REFS["280_confirmation_truth_schema"],
        ],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_SNAPSHOT_EXPIRY", "IC_281_RESERVATION_CONFIRMATION_MANAGE"],
        "Blocked until 286 publishes hold and reservation truth that commit can lawfully revalidate and consume.",
        [
            repo_path("packages/domains/booking/src/phase4-booking-commit.ts"),
            repo_path("services/command-api/src/phase4-booking-commit.ts"),
            repo_path("packages/event-contracts/schemas/booking/booking.commit.started.v1.schema.json"),
        ],
        "python3 ./tools/analysis/validate_287_booking_commit_pipeline.py",
        ["python3 ./tools/analysis/validate_287_booking_commit_pipeline.py"],
        ["par_288", "par_289", "par_290", "par_292", "par_296", "seq_307", "seq_308"],
        ["Must be the only owner of commit-path state and initial authoritative appointment creation."],
        [],
        blocked_reason="Needs reservation authority and truthful hold inputs from 286.",
    ),
    make_track(
        288,
        "Appointment management cancel, reschedule, and detail update commands",
        "blocked",
        "manage_commands",
        "manage_and_artifact",
        [
            "AppointmentManageCommand",
            "BookingManageSettlement",
            "BookingContinuityEvidenceProjection",
            "AppointmentPresentationArtifact",
        ],
        [
            "AppointmentManageCommand",
            "BookingManageSettlement",
            "BookingContinuityEvidenceProjection",
            "AppointmentPresentationArtifact",
        ],
        ["AppointmentRecord", "BookingCapabilityProjection", "BookingConfirmationTruthProjection"],
        ["par_287", "par_283"],
        [FREEZE_CONTRACT_REFS["280_manage_bundle"], FREEZE_CONTRACT_REFS["279_projection_schema"]],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_RESERVATION_CONFIRMATION_MANAGE", "IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Blocked until 287 publishes appointment truth and 283 publishes live manage exposure truth.",
        [
            repo_path("packages/domains/booking/src/phase4-appointment-manage.ts"),
            repo_path("services/command-api/src/phase4-appointment-manage.ts"),
        ],
        "python3 ./tools/analysis/validate_288_appointment_management_cancel_reschedule_and_detail_update_commands.py",
        ["python3 ./tools/analysis/validate_288_appointment_management_cancel_reschedule_and_detail_update_commands.py"],
        ["par_289", "par_297", "par_300", "seq_308"],
        ["Must preserve same-shell continuity and never infer manage exposure from appointment presence alone."],
        [],
        blocked_reason="Needs booked appointment truth from 287 and capability projection from 283.",
    ),
    make_track(
        289,
        "Reminder scheduler and notification settlement",
        "blocked",
        "reminder_scheduler",
        "reminder",
        ["ReminderPlan"],
        ["ReminderPlan"],
        ["AppointmentRecord", "BookingManageSettlement", "AppointmentPresentationArtifact"],
        ["par_287", "par_288"],
        [FREEZE_CONTRACT_REFS["280_manage_bundle"]],
        ["IC_281_RESERVATION_CONFIRMATION_MANAGE", "IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Blocked until 287 creates authoritative AppointmentRecord and 288 owns reminder-change manage settlement.",
        [
            repo_path("packages/domains/booking/src/phase4-reminder-scheduler.ts"),
            repo_path("services/command-api/src/phase4-reminder-scheduler.ts"),
        ],
        "python3 ./tools/analysis/validate_289_reminder_scheduler_and_notification_settlement_for_appointments.py",
        ["python3 ./tools/analysis/validate_289_reminder_scheduler_and_notification_settlement_for_appointments.py"],
        ["par_297", "seq_308", "seq_309"],
        ["Must keep reminder schedule truth separate from manage command and appointment truth."],
        [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json")],
        blocked_reason="Needs appointment truth and manage mutation settlement.",
    ),
    make_track(
        290,
        "Smart waitlist, transactional autofill, and deadline logic",
        "blocked",
        "waitlist_runtime",
        "waitlist_and_fallback",
        [
            "WaitlistEntry",
            "WaitlistDeadlineEvaluation",
            "WaitlistFallbackObligation",
            "WaitlistOffer",
            "WaitlistContinuationTruthProjection",
        ],
        [
            "WaitlistEntry",
            "WaitlistDeadlineEvaluation",
            "WaitlistFallbackObligation",
            "WaitlistOffer",
            "WaitlistContinuationTruthProjection",
        ],
        ["ReservationTruthProjection", "BookingTransaction", "BookingConfirmationTruthProjection"],
        ["par_286", "par_287"],
        [FREEZE_CONTRACT_REFS["280_waitlist_bundle"]],
        ["IC_281_WAITLIST_FALLBACK_TYPED", "IC_281_RESERVATION_CONFIRMATION_MANAGE"],
        "Blocked until no-supply, unavailable, and commit ambiguity branches are emitted by 286 and 287.",
        [
            repo_path("packages/domains/booking/src/phase4-smart-waitlist.ts"),
            repo_path("services/command-api/src/phase4-smart-waitlist.ts"),
        ],
        "python3 ./tools/analysis/validate_290_smart_waitlist_transactional_autofill_and_deadline_logic.py",
        ["python3 ./tools/analysis/validate_290_smart_waitlist_transactional_autofill_and_deadline_logic.py"],
        ["par_291", "par_298", "par_301", "seq_308"],
        ["Must keep waitlist and fallback typed instead of branching from generic booking failure."],
        [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_WAITLIST_FALLBACK_OWNER_MAP.json")],
        blocked_reason="Needs reservation and commit truth before autofill and fallback obligations are legal.",
    ),
    make_track(
        291,
        "Staff-assisted booking exception queue and handoff panel API",
        "blocked",
        "staff_assisted_api",
        "assisted_booking",
        ["AssistedBookingSession", "BookingException", "BookingExceptionQueue"],
        ["AssistedBookingSession", "BookingException", "BookingExceptionQueue"],
        ["WaitlistFallbackObligation", "BookingTransaction", "BookingManageSettlement"],
        ["par_290", "par_287", "par_288"],
        [FREEZE_CONTRACT_REFS["280_waitlist_bundle"], FREEZE_CONTRACT_REFS["278_event_catalog"]],
        ["IC_281_WAITLIST_FALLBACK_TYPED", "IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Blocked until 290 emits typed fallback obligations and 287/288 publish the exception-causing booking truth.",
        [
            repo_path("packages/domains/booking/src/phase4-staff-assisted-booking.ts"),
            repo_path("services/command-api/src/phase4-staff-assisted-booking.ts"),
        ],
        "python3 ./tools/analysis/validate_291_staff_assisted_booking_exception_queue_and_handoff_panel_api.py",
        ["python3 ./tools/analysis/validate_291_staff_assisted_booking_exception_queue_and_handoff_panel_api.py"],
        ["par_299", "seq_308", "seq_309"],
        ["Must consume fallback obligations instead of inventing a second assisted-booking branch model."],
        [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_WAITLIST_FALLBACK_OWNER_MAP.json")],
        blocked_reason="Needs waitlist/fallback truth and commit/manage exception inputs.",
    ),
    make_track(
        292,
        "Booking reconciliation and external confirmation dispute worker",
        "blocked",
        "reconciliation_worker",
        "reconciliation",
        [
            "BookingReconciliationActionRecord",
            "ExternalConfirmationEvidenceEnvelope",
            "BookingConfirmationTruthProjection",
        ],
        ["BookingReconciliationActionRecord", "ExternalConfirmationEvidenceEnvelope"],
        ["BookingTransaction", "ExternalConfirmationGate", "BookingConfirmationTruthProjection", "AppointmentRecord"],
        ["par_287", "par_290", "par_291"],
        [FREEZE_CONTRACT_REFS["280_booking_transaction_schema"], FREEZE_CONTRACT_REFS["280_confirmation_truth_schema"]],
        ["IC_281_RESERVATION_CONFIRMATION_MANAGE", "IC_281_WAITLIST_FALLBACK_TYPED"],
        "Blocked until 287 emits ambiguous or pending confirmation states and 290/291 publish fallback and exception paths that the worker may settle.",
        [
            repo_path("services/command-api/src/phase4-booking-reconciliation.ts"),
            repo_path("services/command-api/tests/phase4-booking-reconciliation.integration.test.js"),
        ],
        "python3 ./tools/analysis/validate_292_booking_reconciliation_worker.py",
        ["python3 ./tools/analysis/validate_292_booking_reconciliation_worker.py"],
        ["par_293", "par_296", "seq_308", "seq_309"],
        ["Must be the only ongoing owner of confirmation-truth convergence after initial commit settlement."],
        [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_EVENT_OWNER_DRIFT.json")],
        blocked_reason="Needs commit outputs, exception signals, and fallback branches before reconciliation can converge truth.",
    ),
    make_track(
        293,
        "Patient appointment scheduling workspace",
        "blocked",
        "patient_booking_frontend",
        "patient_workspace",
        ["PatientAppointmentWorkspaceProjection", "PatientAppointmentListProjection"],
        ["PatientAppointmentWorkspaceProjection", "PatientAppointmentListProjection"],
        ["BookingCase", "BookingCapabilityProjection", "SlotSetSnapshot", "OfferSession", "BookingConfirmationTruthProjection"],
        ["par_282", "par_283", "par_284", "par_285", "par_287", "par_292"],
        [FREEZE_CONTRACT_REFS["278_route_registry"], FREEZE_CONTRACT_REFS["278_projection_bundle"]],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Blocked until the core backend booking path exists end to end; otherwise the workspace would simulate booking truth locally.",
        [repo_path("apps/patient-web/src/patient-booking-workspace.tsx")],
        "python3 ./tools/analysis/validate_293_patient_booking_workspace.py",
        ["python3 ./tools/analysis/validate_293_patient_booking_workspace.py"],
        ["par_294", "par_300", "par_302", "seq_309"],
        ["Must render from authoritative capability, snapshot, offer, and confirmation projections rather than local heuristics."],
        [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json")],
        blocked_reason="Needs executable backend booking truth from 282 to 292.",
    ),
    make_track(
        294,
        "Slot search results and freshness states",
        "blocked",
        "patient_booking_search_frontend",
        "patient_search",
        ["SlotSearchResultsSurface"],
        ["SlotSearchResultsSurface"],
        ["SlotSetSnapshot", "SlotSnapshotRecoveryState", "CapacityRankProof"],
        ["par_293", "par_284", "par_285"],
        [FREEZE_CONTRACT_REFS["280_snapshot_schema"], FREEZE_CONTRACT_REFS["280_rank_plan_contract"]],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_SNAPSHOT_EXPIRY"],
        "Blocked until 293 establishes the patient booking shell and 284/285 publish snapshot and ranking truth.",
        [repo_path("apps/patient-web/src/patient-booking-search-results.tsx")],
        "python3 ./tools/analysis/validate_294_slot_results_and_freshness.py",
        ["python3 ./tools/analysis/validate_294_slot_results_and_freshness.py"],
        ["par_295", "par_302", "seq_309"],
        ["Must render freshness and stale states from snapshot recovery, not route-local timers."],
        [],
        blocked_reason="Needs patient workspace shell and backend snapshot truth.",
    ),
    make_track(
        295,
        "Offer selection flow with truthful hold posture",
        "blocked",
        "patient_offer_frontend",
        "patient_selection",
        ["OfferSelectionSurface"],
        ["OfferSelectionSurface"],
        ["OfferSession", "ReservationTruthProjection", "CapacityRankProof"],
        ["par_294", "par_286"],
        [FREEZE_CONTRACT_REFS["280_offer_session_schema"], FREEZE_CONTRACT_REFS["280_reservation_truth_contract"]],
        ["IC_281_SNAPSHOT_EXPIRY", "IC_281_RESERVATION_CONFIRMATION_MANAGE"],
        "Blocked until offer and reservation truth exist together.",
        [repo_path("apps/patient-web/src/patient-offer-selection.tsx")],
        "python3 ./tools/analysis/validate_295_offer_selection_truthful_hold.py",
        ["python3 ./tools/analysis/validate_295_offer_selection_truthful_hold.py"],
        ["par_296", "par_302", "seq_309"],
        ["Must keep selected and held postures distinct and consume reservation truth exactly."],
        [],
        blocked_reason="Needs 286 reservation truth on top of 294 search results.",
    ),
    make_track(
        296,
        "Confirmation pending, disputed, and recovery states",
        "blocked",
        "patient_confirmation_frontend",
        "patient_confirmation",
        ["BookingConfirmationRecoverySurface"],
        ["BookingConfirmationRecoverySurface"],
        ["BookingConfirmationTruthProjection", "ExternalConfirmationGate", "BookingReconciliationActionRecord"],
        ["par_295", "par_287", "par_292"],
        [FREEZE_CONTRACT_REFS["280_confirmation_truth_schema"]],
        ["IC_281_RESERVATION_CONFIRMATION_MANAGE", "IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Blocked until 287 and 292 publish authoritative confirmation and dispute truth.",
        [repo_path("apps/patient-web/src/patient-booking-confirmation.tsx")],
        "python3 ./tools/analysis/validate_296_confirmation_pending_disputed_and_recovery.py",
        ["python3 ./tools/analysis/validate_296_confirmation_pending_disputed_and_recovery.py"],
        ["par_297", "par_301", "par_302", "seq_309"],
        ["Must never treat accepted-for-processing as booked truth."],
        [],
        blocked_reason="Needs commit and reconciliation truth.",
    ),
    make_track(
        297,
        "Appointment detail, cancel, reschedule, and reminder views",
        "blocked",
        "patient_manage_frontend",
        "patient_manage",
        ["PatientAppointmentManageProjection"],
        ["PatientAppointmentManageProjection"],
        ["AppointmentRecord", "BookingManageSettlement", "ReminderPlan", "AppointmentPresentationArtifact"],
        ["par_296", "par_288", "par_289"],
        [FREEZE_CONTRACT_REFS["278_projection_bundle"], FREEZE_CONTRACT_REFS["280_manage_bundle"]],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_RESERVATION_CONFIRMATION_MANAGE", "IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Blocked until appointment truth, manage settlement, and reminder scheduling exist.",
        [repo_path("apps/patient-web/src/patient-appointment-manage.tsx")],
        "python3 ./tools/analysis/validate_297_appointment_manage_views.py",
        ["python3 ./tools/analysis/validate_297_appointment_manage_views.py"],
        ["par_298", "par_300", "par_303", "seq_309"],
        ["Must render manage exposure only from capability, continuity, and confirmation truth together."],
        [],
        blocked_reason="Needs 288 and 289 backend manage/reminder implementation plus 296 confirmation recovery.",
    ),
    make_track(
        298,
        "Waitlist enrolment, management, and offer acceptance views",
        "blocked",
        "patient_waitlist_frontend",
        "patient_waitlist",
        ["WaitlistExperienceSurface"],
        ["WaitlistExperienceSurface"],
        ["WaitlistEntry", "WaitlistOffer", "WaitlistContinuationTruthProjection"],
        ["par_297", "par_290"],
        [FREEZE_CONTRACT_REFS["280_waitlist_bundle"]],
        ["IC_281_WAITLIST_FALLBACK_TYPED", "IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Blocked until 290 publishes waitlist truth and 297 publishes appointment detail continuity.",
        [repo_path("apps/patient-web/src/patient-booking-waitlist.tsx")],
        "python3 ./tools/analysis/validate_298_waitlist_views.py",
        ["python3 ./tools/analysis/validate_298_waitlist_views.py"],
        ["par_299", "par_301", "par_302", "seq_309"],
        ["Must consume typed waitlist and fallback reasons instead of inventing local continuation meaning."],
        [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_WAITLIST_FALLBACK_OWNER_MAP.json")],
        blocked_reason="Needs 290 waitlist runtime and 297 manage/detail continuity.",
    ),
    make_track(
        299,
        "Staff booking handoff panel and assisted booking views",
        "blocked",
        "staff_booking_frontend",
        "staff_assist",
        ["StaffBookingHandoffPanel"],
        ["StaffBookingHandoffPanel"],
        ["AssistedBookingSession", "BookingExceptionQueue", "BookingCapabilityProjection"],
        ["par_298", "par_291", "par_283"],
        [FREEZE_CONTRACT_REFS["278_route_registry"], FREEZE_CONTRACT_REFS["279_projection_schema"]],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_WAITLIST_FALLBACK_TYPED", "IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Blocked until 291 publishes assisted-booking API truth and 298 publishes waitlist continuation context.",
        [repo_path("apps/clinical-workspace/src/staff-booking-handoff-panel.tsx")],
        "python3 ./tools/analysis/validate_299_staff_booking_handoff_panel.py",
        ["python3 ./tools/analysis/validate_299_staff_booking_handoff_panel.py"],
        ["par_300", "seq_309"],
        ["Must remain a projection over 291-owned backend truth, not a second assisted-booking state machine."],
        [],
        blocked_reason="Needs backend assisted-booking and waitlist truth before staff UI can be honest.",
    ),
    make_track(
        300,
        "Record-origin continuation and booking entry surfaces",
        "blocked",
        "patient_record_entry_frontend",
        "record_entry",
        ["RecordOriginBookingEntrySurface"],
        ["RecordOriginBookingEntrySurface"],
        ["PatientAppointmentWorkspaceProjection", "PatientAppointmentManageProjection", "StaffBookingHandoffPanel"],
        ["par_293", "par_297", "par_299"],
        [FREEZE_CONTRACT_REFS["278_route_registry"]],
        ["IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Blocked until the patient and staff booking entry routes exist.",
        [repo_path("apps/patient-web/src/patient-booking-entry.tsx")],
        "python3 ./tools/analysis/validate_300_record_origin_booking_entry.py",
        ["python3 ./tools/analysis/validate_300_record_origin_booking_entry.py"],
        ["par_301", "par_302", "seq_309"],
        ["Must consume established route registry and continuity evidence instead of inventing new entry anchors."],
        [],
        blocked_reason="Needs 293, 297, and 299 to land core entry surfaces first.",
    ),
    make_track(
        301,
        "Patient action recovery envelopes for booking failures",
        "blocked",
        "patient_recovery_frontend",
        "recovery_envelope",
        ["PatientActionRecoveryEnvelope"],
        ["PatientActionRecoveryEnvelope"],
        ["BookingConfirmationRecoverySurface", "WaitlistExperienceSurface", "RecordOriginBookingEntrySurface"],
        ["par_296", "par_298", "par_300"],
        [FREEZE_CONTRACT_REFS["278_route_registry"], FREEZE_CONTRACT_REFS["280_waitlist_bundle"]],
        ["IC_281_ROUTE_PUBLICATION_CONTINUITY", "IC_281_WAITLIST_FALLBACK_TYPED"],
        "Blocked until confirmation recovery, waitlist continuity, and entry continuation surfaces exist.",
        [repo_path("apps/patient-web/src/patient-booking-recovery.tsx")],
        "python3 ./tools/analysis/validate_301_booking_recovery_envelopes.py",
        ["python3 ./tools/analysis/validate_301_booking_recovery_envelopes.py"],
        ["par_302", "par_303", "seq_309"],
        ["Must preserve same-shell recovery law from 280 instead of inventing detached failure pages."],
        [],
        blocked_reason="Needs 296, 298, and 300 before recovery envelopes can be coherent.",
    ),
    make_track(
        302,
        "Mobile responsive booking and manage flows",
        "deferred",
        "mobile_hardening",
        "mobile_and_artifact",
        ["MobileResponsiveBookingFlow"],
        ["MobileResponsiveBookingFlow"],
        ["PatientAppointmentWorkspaceProjection", "PatientAppointmentManageProjection", "PatientActionRecoveryEnvelope"],
        ["par_301"],
        [FREEZE_CONTRACT_REFS["278_route_registry"]],
        ["IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Deferred until the core desktop booking and recovery routes are implemented and stable enough to harden responsively.",
        [repo_path("apps/patient-web/src")],
        "python3 ./tools/analysis/validate_302_booking_mobile_responsive.py",
        ["python3 ./tools/analysis/validate_302_booking_mobile_responsive.py"],
        ["seq_309", "seq_310"],
        ["This is polish and device hardening, not a prerequisite for the first backend implementation wave."],
        [],
        blocked_reason="Deferred behind core route implementation.",
    ),
    make_track(
        303,
        "Accessibility and artifact parity for booking documents",
        "deferred",
        "artifact_accessibility_frontend",
        "mobile_and_artifact",
        ["PatientAppointmentArtifactProjection"],
        ["PatientAppointmentArtifactProjection"],
        ["AppointmentPresentationArtifact", "PatientAppointmentManageProjection", "PatientActionRecoveryEnvelope"],
        ["par_301"],
        [FREEZE_CONTRACT_REFS["278_projection_bundle"], FREEZE_CONTRACT_REFS["280_manage_bundle"]],
        ["IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Deferred until appointment detail, recovery envelopes, and core artifact generation exist.",
        [repo_path("apps/patient-web/src/patient-booking-artifacts.tsx")],
        "python3 ./tools/analysis/validate_303_booking_artifact_parity.py",
        ["python3 ./tools/analysis/validate_303_booking_artifact_parity.py"],
        ["seq_309", "seq_310"],
        ["Artifact accessibility hardening follows core artifact generation; it does not unblock the first backend wave."],
        [],
        blocked_reason="Deferred behind core manage, recovery, and artifact generation work.",
    ),
    make_track(
        304,
        "Configure provider sandboxes and callback endpoints",
        "deferred",
        "provider_activation",
        "provider_activation",
        ["ProviderSandboxConfiguration"],
        ["ProviderSandboxConfiguration"],
        ["ProviderCapabilityMatrix", "BookingProviderAdapterBinding"],
        ["par_283"],
        [FREEZE_CONTRACT_REFS["279_matrix_schema"]],
        ["IC_281_CAPABILITY_TUPLE_DRIFT"],
        "Deferred because 277 and 281 explicitly keep live-provider activation outside the first local-booking implementation wave.",
        [repo_path("tools/provider-sandboxes")],
        "python3 ./tools/analysis/validate_304_provider_sandbox_setup.py",
        ["python3 ./tools/analysis/validate_304_provider_sandbox_setup.py"],
        ["seq_305", "seq_306", "seq_310"],
        ["Live supplier onboarding remains later and simulator-backed seams must not be relabeled as ready."],
        [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json")],
        blocked_reason="Deferred by live-provider scope boundary.",
    ),
    make_track(
        305,
        "Capture provider capability evidence and test credentials",
        "deferred",
        "provider_activation",
        "provider_activation",
        ["ProviderCapabilityEvidencePack"],
        ["ProviderCapabilityEvidencePack"],
        ["ProviderSandboxConfiguration", "ProviderCapabilityMatrix"],
        ["seq_304"],
        [FREEZE_CONTRACT_REFS["279_matrix_schema"]],
        ["IC_281_CAPABILITY_TUPLE_DRIFT"],
        "Deferred because provider evidence cannot exist before live sandbox onboarding and remains outside the first local-booking wave.",
        [repo_path("tools/provider-evidence")],
        "python3 ./tools/analysis/validate_305_provider_capability_evidence.py",
        ["python3 ./tools/analysis/validate_305_provider_capability_evidence.py"],
        ["seq_306", "seq_310"],
        ["Evidence capture is intentionally later than local implementation readiness."],
        [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json")],
        blocked_reason="Deferred by live-provider scope boundary.",
    ),
    make_track(
        306,
        "Integrate local booking with triage, portal, and notification workflows",
        "deferred",
        "runtime_integration",
        "integration",
        ["BookingPortalNotificationIntegration"],
        ["BookingPortalNotificationIntegration"],
        ["PatientAppointmentWorkspaceProjection", "ReminderPlan", "ProviderCapabilityEvidencePack"],
        ["seq_305"],
        [FREEZE_CONTRACT_REFS["278_route_registry"], FREEZE_CONTRACT_REFS["280_manage_bundle"]],
        ["IC_281_ROUTE_PUBLICATION_CONTINUITY", "IC_281_RESERVATION_CONFIRMATION_MANAGE"],
        "Deferred because integration should consume stable runtime and provider evidence rather than shaping the first local implementation wave.",
        [repo_path("services/command-api/src/phase4-booking-integration.ts")],
        "python3 ./tools/analysis/validate_306_booking_triage_notification_integration.py",
        ["python3 ./tools/analysis/validate_306_booking_triage_notification_integration.py"],
        ["seq_307", "seq_308", "seq_309", "seq_310"],
        ["Integration remains later than local backend kernel and capability delivery."],
        [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json")],
        blocked_reason="Deferred behind provider onboarding and full frontend/runtime completion.",
    ),
    make_track(
        307,
        "Capability matrix, slot snapshot, hold, commit, and compensation suites",
        "deferred",
        "assurance",
        "assurance",
        ["Phase4CoreMatrixSuite"],
        ["Phase4CoreMatrixSuite"],
        ["BookingCase", "BookingCapabilityResolution", "SlotSetSnapshot", "BookingTransaction"],
        ["seq_306"],
        [repo_path("prompt/307.md")],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_SNAPSHOT_EXPIRY", "IC_281_RESERVATION_CONFIRMATION_MANAGE"],
        "Deferred until the backend runtime path and integration path exist; assurance cannot lead implementation here.",
        [repo_path("tests/playwright")],
        "python3 ./tools/analysis/validate_307_phase4_booking_core_matrix.py",
        ["python3 ./tools/analysis/validate_307_phase4_booking_core_matrix.py"],
        ["seq_308", "seq_309", "seq_310"],
        ["Core suite work follows implementation and integration, not vice versa."],
        [],
        blocked_reason="Deferred until runtime implementation exists.",
    ),
    make_track(
        308,
        "Manage, waitlist, assisted booking, and reconciliation suites",
        "deferred",
        "assurance",
        "assurance",
        ["Phase4ManageWaitlistAssistedMatrixSuite"],
        ["Phase4ManageWaitlistAssistedMatrixSuite"],
        ["BookingManageSettlement", "WaitlistOffer", "AssistedBookingSession", "BookingReconciliationActionRecord"],
        ["seq_307"],
        [repo_path("prompt/308.md")],
        ["IC_281_RESERVATION_CONFIRMATION_MANAGE", "IC_281_WAITLIST_FALLBACK_TYPED"],
        "Deferred until the later backend and frontend tracks land.",
        [repo_path("tests/playwright")],
        "python3 ./tools/analysis/validate_308_phase4_manage_waitlist_assisted_matrix.py",
        ["python3 ./tools/analysis/validate_308_phase4_manage_waitlist_assisted_matrix.py"],
        ["seq_309", "seq_310"],
        ["Assurance remains later than the tracks it proves."],
        [],
        blocked_reason="Deferred until manage, waitlist, assisted, and reconciliation work exists.",
    ),
    make_track(
        309,
        "Patient and staff booking end-to-end, accessibility, and load suites",
        "deferred",
        "assurance",
        "assurance",
        ["Phase4BookingE2ESuite"],
        ["Phase4BookingE2ESuite"],
        ["PatientAppointmentWorkspaceProjection", "StaffBookingHandoffPanel", "PatientActionRecoveryEnvelope"],
        ["seq_308"],
        [repo_path("prompt/309.md")],
        ["IC_281_ROUTE_PUBLICATION_CONTINUITY"],
        "Deferred until the end-to-end runtime and UI surface exists.",
        [repo_path("tests/playwright")],
        "python3 ./tools/analysis/validate_309_phase4_e2e_suite.py",
        ["python3 ./tools/analysis/validate_309_phase4_e2e_suite.py"],
        ["seq_310"],
        ["End-to-end proof is a final-wave activity."],
        [],
        blocked_reason="Deferred until prior implementation and assurance waves finish.",
    ),
    make_track(
        310,
        "Phase 4 exit gate approve booking engine completion",
        "deferred",
        "governance",
        "assurance",
        ["Phase4BookingExitGate"],
        ["Phase4BookingExitGate"],
        ["Phase4CoreMatrixSuite", "Phase4ManageWaitlistAssistedMatrixSuite", "Phase4BookingE2ESuite"],
        ["seq_309"],
        [repo_path("prompt/310.md")],
        ["IC_281_CAPABILITY_TUPLE_DRIFT", "IC_281_SNAPSHOT_EXPIRY", "IC_281_RESERVATION_CONFIRMATION_MANAGE", "IC_281_ROUTE_PUBLICATION_CONTINUITY", "IC_281_WAITLIST_FALLBACK_TYPED"],
        "Deferred because exit approval follows all implementation, provider, integration, and assurance work.",
        [repo_path("docs/governance")],
        "python3 ./tools/analysis/validate_310_phase4_exit_gate.py",
        ["python3 ./tools/analysis/validate_310_phase4_exit_gate.py"],
        [],
        ["Exit approval is the end of the programme wave, not the start."],
        [],
        blocked_reason="Deferred until all prior tracks complete.",
    ),
]


TRACK_INDEX = {track["trackId"]: track for track in TRACKS}
STATUS_COUNTS: dict[str, int] = {}
for track in TRACKS:
    STATUS_COUNTS[track["status"]] = STATUS_COUNTS.get(track["status"], 0) + 1


READY_TRACK_IDS = [track["trackId"] for track in TRACKS if track["status"] == "ready"]


CONSISTENCY_MATRIX_ROWS = [
    {
        "rowId": "CC_281_001",
        "artifact": "BookingIntent -> BookingCase lineage",
        "origin278": "frozen",
        "origin279": "not_applicable",
        "origin280": "consumed_only",
        "ownerTrack": "par_282",
        "consistencyStatus": "consistent",
        "notes": "278 freezes the handoff and 281 keeps 282 as the only kernel owner.",
    },
    {
        "rowId": "CC_281_002",
        "artifact": "BookingCase status vocabulary",
        "origin278": "frozen",
        "origin279": "not_applicable",
        "origin280": "consumed_by_commit_and_manage",
        "ownerTrack": "par_282",
        "consistencyStatus": "consistent",
        "notes": "No later track may fork workflow state vocabulary.",
    },
    {
        "rowId": "CC_281_003",
        "artifact": "SearchPolicy ownership",
        "origin278": "frozen",
        "origin279": "consumed_only",
        "origin280": "consumed_only",
        "ownerTrack": "par_282",
        "consistencyStatus": "consistent",
        "notes": "Search policy remains case-owned even when consumed by snapshot and ranking tracks.",
    },
    {
        "rowId": "CC_281_004",
        "artifact": "Capability tuple inventory/binding/resolution/projection split",
        "origin278": "not_applicable",
        "origin279": "frozen",
        "origin280": "consumed_by_search_commit_manage",
        "ownerTrack": "par_283",
        "consistencyStatus": "consistent",
        "notes": "279 split remains authoritative and 281 preserves it.",
    },
    {
        "rowId": "CC_281_005",
        "artifact": "Capability tuple drift invalidation",
        "origin278": "route_and_case_freeze",
        "origin279": "frozen",
        "origin280": "frozen_formula_consumers",
        "ownerTrack": "par_283",
        "consistencyStatus": "consistent",
        "notes": "281 propagates 279 tuple drift into 284 to 297 consumers without assigning duplicate owners.",
    },
    {
        "rowId": "CC_281_006",
        "artifact": "Slot snapshot and SnapshotSelectable law",
        "origin278": "not_applicable",
        "origin279": "tuple_inputs_only",
        "origin280": "frozen",
        "ownerTrack": "par_284",
        "consistencyStatus": "consistent",
        "notes": "284 owns snapshot production; later tracks consume expiry and provenance state only.",
    },
    {
        "rowId": "CC_281_007",
        "artifact": "Offer truthful non-exclusive posture",
        "origin278": "selection path only",
        "origin279": "capability input only",
        "origin280": "frozen",
        "ownerTrack": "par_285",
        "consistencyStatus": "consistent",
        "notes": "285 owns selection and offer wording before reservation truth starts in 286.",
    },
    {
        "rowId": "CC_281_008",
        "artifact": "Selected vs held distinction",
        "origin278": "selection path only",
        "origin279": "not_applicable",
        "origin280": "frozen",
        "ownerTrack": "par_286",
        "consistencyStatus": "consistent",
        "notes": "281 keeps hold truth in 286 and blocks 295 from faking it in the browser.",
    },
    {
        "rowId": "CC_281_009",
        "artifact": "Commit revalidation and BookingTransaction",
        "origin278": "generic events only",
        "origin279": "binding and policy inputs",
        "origin280": "frozen",
        "ownerTrack": "par_287",
        "consistencyStatus": "consistent",
        "notes": "287 owns commit-path revalidation and transaction state.",
    },
    {
        "rowId": "CC_281_010",
        "artifact": "Reservation truth vs confirmation truth vs manage exposure",
        "origin278": "case-level only",
        "origin279": "gate-policy inputs",
        "origin280": "frozen",
        "ownerTrack": "par_286|par_287|par_288|par_292",
        "consistencyStatus": "consistent_with_split_owners",
        "notes": "281 keeps one owner per object and a typed invalidation chain across them.",
    },
    {
        "rowId": "CC_281_011",
        "artifact": "Reminder scheduling",
        "origin278": "generic event only",
        "origin279": "capability input only",
        "origin280": "frozen",
        "ownerTrack": "par_289",
        "consistencyStatus": "consistent",
        "notes": "ReminderPlan stays first-class and later than manage command settlement.",
    },
    {
        "rowId": "CC_281_012",
        "artifact": "Waitlist and fallback typed seams",
        "origin278": "frozen_names_only",
        "origin279": "not_applicable",
        "origin280": "frozen_but_generic_owner_labels",
        "ownerTrack": "par_290|par_291",
        "consistencyStatus": "collision_remediated",
        "notes": "281 replaces generic owner labels with exact tracks.",
    },
    {
        "rowId": "CC_281_013",
        "artifact": "Assisted booking exception ownership",
        "origin278": "frozen_names_only",
        "origin279": "not_applicable",
        "origin280": "typed fallback inputs only",
        "ownerTrack": "par_291",
        "consistencyStatus": "consistent",
        "notes": "Staff-assisted exception queue remains distinct from waitlist runtime.",
    },
    {
        "rowId": "CC_281_014",
        "artifact": "Confirmation truth convergence worker",
        "origin278": "event catalog generic",
        "origin279": "gate-policy inputs",
        "origin280": "confirmation truth frozen",
        "ownerTrack": "par_292",
        "consistencyStatus": "collision_remediated",
        "notes": "281 reassigns booking.confirmation.truth.updated to 292.",
    },
    {
        "rowId": "CC_281_015",
        "artifact": "Patient workspace route registry and projections",
        "origin278": "frozen",
        "origin279": "capability projection input",
        "origin280": "continuity and manage rules",
        "ownerTrack": "par_293|par_297|par_300|par_301|par_303",
        "consistencyStatus": "consistent_with_split_owners",
        "notes": "281 splits frontend ownership by route family rather than by backend contract pack.",
    },
    {
        "rowId": "CC_281_016",
        "artifact": "Route publication and continuity freeze",
        "origin278": "frozen route registry",
        "origin279": "publication and trust inputs",
        "origin280": "RouteWritable formula",
        "ownerTrack": "par_288|par_293|par_297|par_300|par_301",
        "consistencyStatus": "consistent",
        "notes": "281 keeps the same-shell freeze law intact across backend and frontend tracks.",
    },
    {
        "rowId": "CC_281_017",
        "artifact": "booking.slots.fetched implementation owner",
        "origin278": "par_282",
        "origin279": "not_applicable",
        "origin280": "snapshot contract",
        "ownerTrack": "par_284",
        "consistencyStatus": "collision_remediated",
        "notes": "Explicit gate override blocks 282 from absorbing snapshot event ownership.",
    },
    {
        "rowId": "CC_281_018",
        "artifact": "booking.offers.created implementation owner",
        "origin278": "par_282",
        "origin279": "not_applicable",
        "origin280": "offer contract",
        "ownerTrack": "par_285",
        "consistencyStatus": "collision_remediated",
        "notes": "Explicit gate override assigns offer event ownership to 285.",
    },
    {
        "rowId": "CC_281_019",
        "artifact": "booking.reminders.scheduled implementation owner",
        "origin278": "par_282",
        "origin279": "not_applicable",
        "origin280": "reminder contract",
        "ownerTrack": "par_289",
        "consistencyStatus": "collision_remediated",
        "notes": "Reminder scheduling event belongs to 289 only.",
    },
    {
        "rowId": "CC_281_020",
        "artifact": "Deferred provider activation scope",
        "origin278": "live_later boundary only",
        "origin279": "simulator-backed matrix reality",
        "origin280": "provider execution deferred",
        "ownerTrack": "seq_304|seq_305|seq_306",
        "consistencyStatus": "deferred_by_scope",
        "notes": "281 keeps live-provider activation and evidence out of the first local wave.",
    },
]


LAUNCH_PACKET_282 = {
    "taskId": "par_282",
    "promptTaskId": PROMPT_IDS[282],
    "objective": "Implement the executable BookingCase kernel, durable BookingIntent lineage, and append-only transition journal without re-owning capability, slot, or waitlist semantics.",
    "authoritativeSourceSections": [
        SHARED_REFS["batch_276_283"],
        SHARED_REFS["phase4_booking"] + "#4A. Booking contract, case model, and state machine",
        SHARED_REFS["phase0"],
        SHARED_REFS["case_pack"],
        repo_path("docs/api/281_phase4_track_interface_registry.md"),
    ],
    "objectOwnership": [
        "BookingIntent",
        "BookingCase",
        "SearchPolicy",
        "BookingCaseTransitionJournal",
    ],
    "inputContracts": [
        FREEZE_CONTRACT_REFS["278_booking_intent_schema"],
        FREEZE_CONTRACT_REFS["278_booking_case_schema"],
        FREEZE_CONTRACT_REFS["278_search_policy_schema"],
        FREEZE_CONTRACT_REFS["278_state_machine"],
        FREEZE_CONTRACT_REFS["278_event_catalog"],
        FREEZE_CONTRACT_REFS["279_resolution_schema"],
        FREEZE_CONTRACT_REFS["280_booking_transaction_schema"],
        repo_path("data/contracts/281_phase4_track_readiness_registry.json"),
    ],
    "forbiddenLocalShortcuts": [
        "Do not infer capability from supplier name, route family, or appointment presence.",
        "Do not emit slot, offer, reminder, waitlist, or reconciliation events from 282.",
        "Do not widen or rename BookingCase.status.",
        "Do not close the canonical request from the booking case kernel.",
    ],
    "expectedFiles": TRACK_INDEX["par_282"]["expectedSurfaceRoots"],
    "mandatoryTests": TRACK_INDEX["par_282"]["mandatoryTests"],
    "expectedDownstreamDependents": TRACK_INDEX["par_282"]["expectedDownstreamDependents"],
    "failClosedConditions": [
        "Stale sourceDecisionEpochRef or superseded request lease rejects mutation.",
        "Identity-repair freeze suppresses live booking mutation.",
        "Unknown transition edge rejects with append-only audit.",
        "Any attempt to write later-owned object families from 282 is a gate violation.",
    ],
    "currentGapsAndTemporarySeams": TRACK_INDEX["par_282"]["currentGapRefs"],
    "parallelHandshake": {
        "safeWith": ["par_283"],
        "rule": "282 may consume 279 and 280 refs as opaque typed seams only. It may not implement matrix rows, tuple hashing, or capability projections.",
    },
    "mergeCriteria": TRACK_INDEX["par_282"]["mergeCriteria"],
}


LAUNCH_PACKET_283 = {
    "taskId": "par_283",
    "promptTaskId": PROMPT_IDS[283],
    "objective": "Implement the executable capability matrix compiler and tuple resolution engine without re-owning BookingCase semantics or slot/commit truth.",
    "authoritativeSourceSections": [
        SHARED_REFS["batch_276_283"],
        SHARED_REFS["phase4_booking"] + "#4B. Provider capability matrix and adapter seam",
        SHARED_REFS["runtime_release"],
        SHARED_REFS["capability_pack"],
        repo_path("docs/api/281_phase4_track_interface_registry.md"),
    ],
    "objectOwnership": [
        "ProviderCapabilityMatrix",
        "AdapterContractProfile",
        "DependencyDegradationProfile",
        "AuthoritativeReadAndConfirmationGatePolicy",
        "BookingProviderAdapterBinding",
        "BookingCapabilityResolution",
        "BookingCapabilityProjection",
    ],
    "inputContracts": [
        FREEZE_CONTRACT_REFS["279_matrix_schema"],
        FREEZE_CONTRACT_REFS["279_adapter_registry"],
        FREEZE_CONTRACT_REFS["279_degradation_registry"],
        FREEZE_CONTRACT_REFS["279_policy_registry"],
        FREEZE_CONTRACT_REFS["279_binding_schema"],
        FREEZE_CONTRACT_REFS["279_resolution_schema"],
        FREEZE_CONTRACT_REFS["279_projection_schema"],
        FREEZE_CONTRACT_REFS["278_booking_case_schema"],
        repo_path("data/contracts/281_phase4_track_readiness_registry.json"),
    ],
    "forbiddenLocalShortcuts": [
        "Do not mutate BookingCase.status or SearchPolicy semantics in 283.",
        "Do not infer slot, reservation, confirmation, or waitlist truth from capability alone.",
        "Do not widen patient action scope beyond BookingCapabilityProjection.",
        "Do not let more than one binding or policy seam be current for a legal tuple.",
    ],
    "expectedFiles": TRACK_INDEX["par_283"]["expectedSurfaceRoots"],
    "mandatoryTests": TRACK_INDEX["par_283"]["mandatoryTests"],
    "expectedDownstreamDependents": TRACK_INDEX["par_283"]["expectedDownstreamDependents"],
    "failClosedConditions": [
        "Ambiguous matrix row or binding compilation fails blocked, not partial.",
        "Publication, trust, linkage, or governing-object drift supersedes stale capability resolutions.",
        "Any attempt to render patient self-service actions from blocked or assisted-only capability is a gate violation.",
        "Any attempt to own booking case or slot truth from 283 is a gate violation.",
    ],
    "currentGapsAndTemporarySeams": TRACK_INDEX["par_283"]["currentGapRefs"],
    "parallelHandshake": {
        "safeWith": ["par_282"],
        "rule": "283 consumes BookingCase and SearchPolicy as fixed contract inputs only. It may not redefine case transitions or create a second booking kernel.",
    },
    "mergeCriteria": TRACK_INDEX["par_283"]["mergeCriteria"],
}


READINESS_REGISTRY = {
    "taskId": TASK_ID,
    "contractVersion": CONTRACT_VERSION,
    "generatedAt": TODAY,
    "visualMode": VISUAL_MODE,
    "phase": "phase_4_local_booking_gate",
    "verdict": "open_first_wave_with_explicit_blockers",
    "firstWaveTrackIds": READY_TRACK_IDS,
    "statusCounts": STATUS_COUNTS,
    "trackCount": len(TRACKS),
    "ownerMatrixRef": repo_path("data/analysis/281_phase4_track_owner_matrix.csv"),
    "consistencyMatrixRef": repo_path("data/analysis/281_phase4_contract_consistency_matrix.csv"),
    "dependencyInterfaceMapRef": repo_path("data/contracts/281_phase4_dependency_interface_map.yaml"),
    "gapLogRef": repo_path("data/analysis/281_phase4_parallel_gap_log.json"),
    "eventOwnerOverrides": EVENT_OWNER_OVERRIDES,
    "invalidationChains": INVALIDATION_CHAINS,
    "launchPacketRefs": {
        "par_282": repo_path("data/launchpacks/281_track_launch_packet_282.json"),
        "par_283": repo_path("data/launchpacks/281_track_launch_packet_283.json"),
    },
    "tracks": TRACKS,
}


DEPENDENCY_INTERFACE_MAP = {
    "taskId": TASK_ID,
    "contractVersion": CONTRACT_VERSION,
    "firstWaveTrackIds": READY_TRACK_IDS,
    "tracks": [
        {
            "trackId": track["trackId"],
            "status": track["status"],
            "ownerRole": track["ownerRole"],
            "objectFamilyGroup": track["objectFamilyGroup"],
            "publishes": track["primaryObjectFamilies"],
            "mutates": track["mutationAuthority"],
            "consumes": track["consumeOnly"],
            "upstreamTrackRefs": track["upstreamTrackRefs"],
            "upstreamContractRefs": track["upstreamContractRefs"],
            "invalidationChainRefs": track["invalidationChainRefs"],
            "parallelSafeWith": track["parallelSafeWith"],
        }
        for track in TRACKS
    ],
    "eventOwnerOverrides": EVENT_OWNER_OVERRIDES,
    "interfaceGapRefs": [repo_path(entry["relativePath"]) for entry in GAP_FILES],
}


PARALLEL_GAP_LOG = {
    "taskId": TASK_ID,
    "generatedAt": TODAY,
    "contractVersion": CONTRACT_VERSION,
    "gaps": [
        {
            "gapId": "PHASE4_281_GAP_001",
            "title": "278 event implementation ownership is too broad for downstream parallel work.",
            "status": "remediated_by_gate",
            "ownerTask": TASK_ID,
            "affectedTracks": ["par_282", "par_284", "par_285", "par_287", "par_289", "par_290", "par_291", "par_292"],
            "resolution": "281 publishes the explicit event-owner override registry and treats the 278 implementationOwnerTask field as non-authoritative for parallel launch.",
            "evidenceRefs": [FREEZE_CONTRACT_REFS["278_event_catalog"], repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_EVENT_OWNER_DRIFT.json")],
        },
        {
            "gapId": "PHASE4_281_GAP_002",
            "title": "280 gap ownership uses generic track labels for waitlist and fallback seams.",
            "status": "remediated_by_gate",
            "ownerTask": TASK_ID,
            "affectedTracks": ["par_290", "par_291", "par_292", "par_298", "par_301"],
            "resolution": "281 maps exact owners for waitlist runtime, assisted booking, and reconciliation.",
            "evidenceRefs": [repo_path("data/analysis/PHASE4_INTERFACE_GAP_SLOT_OFFER_COMMIT_MANAGE.json"), repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_WAITLIST_FALLBACK_OWNER_MAP.json")],
        },
        {
            "gapId": "PHASE4_281_GAP_003",
            "title": "Live provider activation and evidence capture remain outside the first local-booking wave.",
            "status": "deferred",
            "ownerTask": "seq_304",
            "affectedTracks": ["seq_304", "seq_305", "seq_306", "seq_310"],
            "resolution": "Keep provider onboarding deferred and simulator-backed until the dedicated activation wave starts.",
            "evidenceRefs": [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json")],
        },
        {
            "gapId": "PHASE4_281_GAP_004",
            "title": "Frontend booking routes cannot switch to live fetch until backend runtime tracks exist.",
            "status": "blocked",
            "ownerTask": "par_293",
            "affectedTracks": ["par_293", "par_294", "par_295", "par_296", "par_297", "par_298", "par_299", "par_300", "par_301"],
            "resolution": "281 blocks the frontend wave behind 282 to 292 rather than letting the shell compose local fake truth.",
            "evidenceRefs": [repo_path("data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_LIVE_PROVIDER_AND_FETCH_ADOPTION.json")],
        },
    ],
}


def render_architecture_doc() -> str:
    first_wave_rows = [
        [track["trackId"], track["title"], ", ".join(track["primaryObjectFamilies"]), ", ".join(track["parallelSafeWith"] or ["none"])]
        for track in TRACKS
        if track["status"] == "ready"
    ]
    dependency_rows = [
        [
            track["trackId"],
            track["status"],
            ", ".join(track["upstreamTrackRefs"]) or "none",
            ", ".join(track["primaryObjectFamilies"]),
            track["blockedReason"] or track["readinessReason"],
        ]
        for track in TRACKS
    ]
    invalidation_rows = [
        [chain["chainId"], chain["title"], ", ".join(chain["ownerTrackIds"]), chain["law"]]
        for chain in INVALIDATION_CHAINS
    ]
    return textwrap.dedent(
        f"""
        # 281 Phase 4 Parallel Track Gate And Dependency Map

        ## Decision

        The local-booking implementation gate opens only two tracks now:

        - `par_282`
        - `par_283`

        Only `par_282` and `par_283` are approved to mutate new production code surfaces immediately.

        Every later track remains explicitly `blocked` or `deferred` until its upstream contracts and mutation authorities exist in production-shaped code.

        ## Why only the first wave opens

        The freeze packs from `278`, `279`, and `280` are sufficient to start:

        1. the executable `BookingCase` kernel
        2. the executable capability compiler and resolution engine

        They are not sufficient to let later tracks improvise ownership for slot search, offers, truthful hold, commit truth, waitlist obligation, or patient-shell recovery. This gate therefore converts the freeze packs into one exact owner map.

        ## First-wave launch table

        {markdown_table(["Track", "Title", "Owned objects", "Parallel-safe with"], first_wave_rows)}

        ## Dependency map

        {markdown_table(["Track", "Status", "Upstream tracks", "Owned objects", "Readiness note"], dependency_rows)}

        ## Invalidation chains

        {markdown_table(["Chain", "Title", "Owning tracks", "Law"], invalidation_rows)}

        ## Owner law

        The owner matrix in [281_phase4_track_owner_matrix.csv]({repo_path('data/analysis/281_phase4_track_owner_matrix.csv')}) is authoritative.

        Every load-bearing Phase 4 object or projection has exactly one owner track.
        Multiple tracks may consume an object. Multiple tracks may not own its mutation semantics.
        No later track may fork workflow state vocabulary.

        ## Collision remediations

        1. `278_booking_case_event_catalog.json` froze correct event names but overly broad implementation owners. `281` remaps the owners explicitly and leaves the naming pack untouched.
        2. `PHASE4_INTERFACE_GAP_SLOT_OFFER_COMMIT_MANAGE.json` used generic future-owner labels. `281` replaces those with exact tracks `290`, `291`, and `292`.
        3. Provider onboarding and runtime integration remain later than the first local-booking wave and stay deferred rather than quietly implied.

        ## Event owner overrides

        The exact event-owner remap is published in the readiness registry and the API interface registry. Downstream implementation must follow the `281` override map, not the broad `implementationOwnerTask` placeholders frozen in `278`.

        ## Append-only evidence

        - readiness registry: [281_phase4_track_readiness_registry.json]({repo_path('data/contracts/281_phase4_track_readiness_registry.json')})
        - dependency map: [281_phase4_dependency_interface_map.yaml]({repo_path('data/contracts/281_phase4_dependency_interface_map.yaml')})
        - consistency matrix: [281_phase4_contract_consistency_matrix.csv]({repo_path('data/analysis/281_phase4_contract_consistency_matrix.csv')})
        - gap log: [281_phase4_parallel_gap_log.json]({repo_path('data/analysis/281_phase4_parallel_gap_log.json')})
        """
    ).strip()


def render_release_doc() -> str:
    ready_rows = [[track["trackId"], track["title"], track["launchPacketRef"]] for track in TRACKS if track["status"] == "ready"]
    blocked_rows = [[track["trackId"], track["title"], track["blockedReason"]] for track in TRACKS if track["status"] == "blocked"]
    deferred_rows = [[track["trackId"], track["title"], track["readinessReason"]] for track in TRACKS if track["status"] == "deferred"]
    return textwrap.dedent(
        f"""
        # 281 Phase 4 Parallel Open Gate

        ## Verdict

        - gate status: `open_first_wave_with_explicit_blockers`
        - ready now: `{", ".join(READY_TRACK_IDS)}`
        - blocked now: `{STATUS_COUNTS['blocked']}`
        - deferred now: `{STATUS_COUNTS['deferred']}`

        This is not a symbolic launch. Only `282` and `283` are approved to mutate new production code surfaces immediately.

        ## Ready now

        {markdown_table(["Track", "Title", "Launch packet"], ready_rows)}

        ## Blocked

        {markdown_table(["Track", "Title", "Exact blocker"], blocked_rows)}

        ## Deferred

        {markdown_table(["Track", "Title", "Deferral reason"], deferred_rows)}

        ## First-wave merge criteria

        ### `par_282`

        {chr(10).join(f"- {criterion}" for criterion in TRACK_INDEX['par_282']['mergeCriteria'])}

        ### `par_283`

        {chr(10).join(f"- {criterion}" for criterion in TRACK_INDEX['par_283']['mergeCriteria'])}

        ## Launch rule

        Future prompts must consume the launch packets and the owner matrix published here.
        They must not rediscover or renegotiate ownership informally.
        """
    ).strip()


def render_api_doc() -> str:
    owner_rows = [
        [
            row["artifactId"],
            row["artifactType"],
            row["ownerTrack"],
            row["objectFamilyGroup"],
            row["consumerTracks"],
        ]
        for row in OBJECT_OWNER_ROWS
    ]
    event_rows = [
        [row["eventName"], row["frozenCatalogOwner"], row["gateOwner"], row["status"], row["reason"]]
        for row in EVENT_OWNER_OVERRIDES
    ]
    surface_rows = [
        [track["trackId"], track["status"], track["ownerRole"], " | ".join(track["expectedSurfaceRoots"][:3])]
        for track in TRACKS
    ]
    return textwrap.dedent(
        f"""
        # 281 Phase 4 Track Interface Registry

        ## Object ownership

        {markdown_table(["Artifact", "Type", "Owner", "Group", "Consumer tracks"], owner_rows)}

        ## Event owner overrides

        {markdown_table(["Event", "278 owner", "281 owner", "Status", "Reason"], event_rows)}

        ## Production code surface roots by track

        {markdown_table(["Track", "Status", "Owner role", "Representative surfaces"], surface_rows)}

        ## Law

        - The 278 to 280 packs freeze names, schemas, and formulas.
        - The 281 registry freezes implementation ownership and launch order.
        - Later tracks may consume the earlier objects, but they may not fork their authoritative meaning.
        """
    ).strip()


def status_label(status: str) -> str:
    return {
        "ready": "Ready",
        "blocked": "Blocked",
        "deferred": "Deferred",
    }[status]


def build_board_payload() -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "generatedAt": TODAY,
        "visualMode": VISUAL_MODE,
        "contractVersion": CONTRACT_VERSION,
        "summaryBands": [
            {"bandId": "ready", "label": "Wave 1 ready", "count": STATUS_COUNTS["ready"], "tone": "ready"},
            {"bandId": "blocked", "label": "Blocked", "count": STATUS_COUNTS["blocked"], "tone": "blocked"},
            {"bandId": "deferred", "label": "Deferred", "count": STATUS_COUNTS["deferred"], "tone": "deferred"},
            {"bandId": "collisions", "label": "Collisions remediated", "count": sum(1 for row in EVENT_OWNER_OVERRIDES if row["status"] == "collision_remediated"), "tone": "dependency"},
        ],
        "tracks": [
            {
                "trackId": track["trackId"],
                "title": track["title"],
                "wave": track["wave"],
                "status": track["status"],
                "statusLabel": status_label(track["status"]),
                "ownerRole": track["ownerRole"],
                "objectFamilyGroup": track["objectFamilyGroup"],
                "primaryObjectFamilies": track["primaryObjectFamilies"],
                "upstreamTrackRefs": track["upstreamTrackRefs"],
                "invalidationChainRefs": track["invalidationChainRefs"],
                "blockedReason": track["blockedReason"],
                "readinessReason": track["readinessReason"],
                "launchPacketRef": track["launchPacketRef"],
                "parallelSafeWith": track["parallelSafeWith"],
                "mergeCriteria": track["mergeCriteria"],
                "mandatoryTests": track["mandatoryTests"],
                "validatorScript": track["validatorScript"],
                "expectedSurfaceRoots": track["expectedSurfaceRoots"],
                "currentGapRefs": track["currentGapRefs"],
                "promptTaskId": track["promptTaskId"],
            }
            for track in TRACKS
        ],
        "objectFamilyGroups": sorted({track["objectFamilyGroup"] for track in TRACKS}),
        "ownerRoles": sorted({track["ownerRole"] for track in TRACKS}),
        "invalidationChains": INVALIDATION_CHAINS,
        "eventOwnerOverrides": EVENT_OWNER_OVERRIDES,
        "consistencyRows": CONSISTENCY_MATRIX_ROWS,
        "gaps": PARALLEL_GAP_LOG["gaps"],
        "firstWaveTrackIds": READY_TRACK_IDS,
        "launchPackets": {
            "par_282": LAUNCH_PACKET_282,
            "par_283": LAUNCH_PACKET_283,
        },
    }


def render_board_html(payload: dict[str, object]) -> str:
    escaped_payload = html.escape(json.dumps(payload))
    return textwrap.dedent(
        f"""
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>281 Phase 4 Parallel Tracks Gate Board</title>
            <style>
              :root {{
                --canvas: #F7F8FA;
                --shell: #EEF2F6;
                --panel: #FFFFFF;
                --inset: #E8EEF3;
                --text-strong: #0F1720;
                --text-default: #24313D;
                --text-muted: #5E6B78;
                --accent-ready: #0F766E;
                --accent-blocked: #B42318;
                --accent-deferred: #B7791F;
                --accent-dependency: #3158E0;
                --accent-risk: #5B61F6;
                --border: rgba(15, 23, 32, 0.08);
                --shadow: 0 18px 40px rgba(15, 23, 32, 0.06);
              }}

              * {{
                box-sizing: border-box;
              }}

              html, body {{
                margin: 0;
                background: var(--canvas);
                color: var(--text-default);
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                letter-spacing: 0;
              }}

              body {{
                padding: 20px;
              }}

              button, select {{
                font: inherit;
                letter-spacing: 0;
              }}

              .board-shell {{
                max-width: 1680px;
                margin: 0 auto;
                background: var(--shell);
                border: 1px solid var(--border);
                box-shadow: var(--shadow);
                min-height: calc(100vh - 40px);
                display: grid;
                grid-template-columns: 300px minmax(0, 1fr) 420px;
                grid-template-rows: 72px auto auto minmax(0, 1fr) auto;
                gap: 0;
                overflow: hidden;
              }}

              .masthead {{
                grid-column: 1 / -1;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 24px;
                border-bottom: 1px solid var(--border);
                background: rgba(255, 255, 255, 0.74);
                backdrop-filter: blur(14px);
              }}

              .brand-lockup {{
                display: flex;
                align-items: center;
                gap: 14px;
              }}

              .grid-mark {{
                width: 30px;
                height: 30px;
                border-radius: 8px;
                background: linear-gradient(135deg, rgba(49, 88, 224, 0.14), rgba(91, 97, 246, 0.08));
                display: grid;
                place-items: center;
              }}

              .wordmark {{
                font-size: 20px;
                font-weight: 700;
                color: var(--text-strong);
              }}

              .wordmark span {{
                color: var(--accent-dependency);
              }}

              .mode-copy {{
                font-size: 12px;
                color: var(--text-muted);
              }}

              .summary-strip {{
                grid-column: 1 / -1;
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
                padding: 16px 20px;
              }}

              .summary-band {{
                background: var(--panel);
                border: 1px solid var(--border);
                padding: 12px 14px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                min-height: 64px;
              }}

              .summary-band strong {{
                font-size: 28px;
                color: var(--text-strong);
              }}

              .tone-ready {{ border-left: 4px solid var(--accent-ready); }}
              .tone-blocked {{ border-left: 4px solid var(--accent-blocked); }}
              .tone-deferred {{ border-left: 4px solid var(--accent-deferred); }}
              .tone-dependency {{ border-left: 4px solid var(--accent-dependency); }}

              .filters {{
                grid-column: 1 / -1;
                display: flex;
                gap: 12px;
                padding: 0 20px 16px;
                flex-wrap: wrap;
              }}

              .filter {{
                display: grid;
                gap: 6px;
              }}

              .filter label {{
                font-size: 12px;
                color: var(--text-muted);
              }}

              .filter select {{
                min-width: 172px;
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 10px 12px;
              }}

              .rail {{
                padding: 0 16px 20px 20px;
                border-right: 1px solid var(--border);
                overflow: auto;
              }}

              .rail h2,
              .center h2,
              .inspector h2,
              .lower-ledger h2 {{
                margin: 0 0 12px;
                font-size: 13px;
                text-transform: uppercase;
                color: var(--text-muted);
                letter-spacing: 0.04em;
              }}

              .track-list {{
                display: grid;
                gap: 8px;
              }}

              .track-button {{
                text-align: left;
                width: 100%;
                border: 1px solid var(--border);
                background: var(--panel);
                padding: 12px;
                border-radius: 8px;
                display: grid;
                gap: 6px;
                cursor: pointer;
                min-height: 78px;
                transition: border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
              }}

              .track-button[aria-current="true"] {{
                border-color: var(--accent-dependency);
                box-shadow: 0 0 0 2px rgba(49, 88, 224, 0.12);
              }}

              .track-button:hover {{
                transform: translateY(-1px);
              }}

              .track-button:focus-visible,
              .graph-node:focus-visible,
              .readiness-row:focus-visible,
              select:focus-visible {{
                outline: 3px solid rgba(49, 88, 224, 0.28);
                outline-offset: 2px;
              }}

              .pill {{
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border-radius: 999px;
                padding: 4px 10px;
                font-size: 12px;
                font-weight: 600;
                width: fit-content;
              }}

              .pill-ready {{ background: rgba(15, 118, 110, 0.12); color: var(--accent-ready); }}
              .pill-blocked {{ background: rgba(180, 35, 24, 0.1); color: var(--accent-blocked); }}
              .pill-deferred {{ background: rgba(183, 121, 31, 0.14); color: var(--accent-deferred); }}

              .track-meta {{
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                font-size: 12px;
                color: var(--text-muted);
              }}

              .center {{
                padding: 0 20px 20px;
                overflow: auto;
              }}

              .panel {{
                background: var(--panel);
                border: 1px solid var(--border);
                padding: 16px;
                margin-bottom: 16px;
              }}

              .panel-head {{
                display: flex;
                justify-content: space-between;
                gap: 16px;
                align-items: baseline;
                margin-bottom: 12px;
              }}

              .panel-head p {{
                margin: 0;
                color: var(--text-muted);
                font-size: 13px;
              }}

              .dependency-layout {{
                display: grid;
                grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
                gap: 16px;
              }}

              .graph-shell {{
                background: var(--inset);
                border-radius: 10px;
                padding: 10px;
                overflow: auto;
              }}

              svg {{
                display: block;
                width: 100%;
                min-width: 680px;
                height: auto;
              }}

              .graph-edge {{
                stroke: rgba(94, 107, 120, 0.34);
                stroke-width: 2;
                fill: none;
              }}

              .graph-edge.highlight {{
                stroke: var(--accent-dependency);
                stroke-width: 3;
              }}

              .graph-node rect {{
                fill: var(--panel);
                stroke: rgba(94, 107, 120, 0.24);
                stroke-width: 1.5;
                rx: 10;
                ry: 10;
              }}

              .graph-node.active rect {{
                stroke: var(--accent-dependency);
                stroke-width: 2.5;
              }}

              .graph-node.ready rect {{ fill: rgba(15, 118, 110, 0.08); }}
              .graph-node.blocked rect {{ fill: rgba(180, 35, 24, 0.06); }}
              .graph-node.deferred rect {{ fill: rgba(183, 121, 31, 0.08); }}
              .graph-node text {{
                fill: var(--text-strong);
                font-size: 12px;
                font-weight: 600;
              }}
              .graph-node .sub {{
                fill: var(--text-muted);
                font-size: 11px;
                font-weight: 500;
              }}

              table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
              }}

              th, td {{
                text-align: left;
                padding: 9px 10px;
                border-bottom: 1px solid rgba(15, 23, 32, 0.07);
                vertical-align: top;
              }}

              th {{
                color: var(--text-muted);
                font-size: 12px;
                font-weight: 600;
              }}

              .readiness-row {{
                cursor: pointer;
                background: transparent;
                border: 0;
                padding: 0;
                width: 100%;
                text-align: inherit;
              }}

              .readiness-row[data-active="true"] {{
                background: rgba(49, 88, 224, 0.06);
              }}

              .braid-grid {{
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                margin-bottom: 12px;
              }}

              .braid-card {{
                background: var(--inset);
                border-radius: 10px;
                padding: 12px;
                border: 1px solid transparent;
              }}

              .braid-card.active {{
                border-color: var(--accent-risk);
              }}

              .braid-card h3 {{
                margin: 0 0 8px;
                font-size: 14px;
                color: var(--text-strong);
              }}

              .braid-card p {{
                margin: 0 0 10px;
                color: var(--text-muted);
                font-size: 13px;
              }}

              .chip-row {{
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
              }}

              .chip {{
                border-radius: 999px;
                background: rgba(49, 88, 224, 0.08);
                color: var(--accent-dependency);
                padding: 4px 8px;
                font-size: 12px;
              }}

              .inspector {{
                padding: 0 20px 20px 16px;
                border-left: 1px solid var(--border);
                overflow: auto;
              }}

              .inspector .panel {{
                position: sticky;
                top: 16px;
              }}

              .inspector dl {{
                display: grid;
                grid-template-columns: 120px minmax(0, 1fr);
                gap: 8px 12px;
                margin: 0;
              }}

              .inspector dt {{
                color: var(--text-muted);
                font-size: 12px;
              }}

              .inspector dd {{
                margin: 0;
                font-size: 13px;
              }}

              .list-block {{
                display: grid;
                gap: 8px;
                margin-top: 12px;
              }}

              .list-block ul {{
                margin: 0;
                padding-left: 18px;
              }}

              .list-block li {{
                margin-bottom: 6px;
                line-height: 1.45;
              }}

              .lower-ledger {{
                grid-column: 1 / -1;
                display: grid;
                grid-template-columns: 1.1fr 0.9fr;
                gap: 16px;
                padding: 0 20px 20px;
              }}

              .muted {{
                color: var(--text-muted);
              }}

              .empty-state {{
                padding: 20px 0;
                color: var(--text-muted);
              }}

              [hidden] {{
                display: none !important;
              }}

              @media (max-width: 1280px) {{
                .board-shell {{
                  grid-template-columns: 280px minmax(0, 1fr);
                }}

                .inspector {{
                  grid-column: 1 / -1;
                  border-left: 0;
                  border-top: 1px solid var(--border);
                  padding-left: 20px;
                }}

                .inspector .panel {{
                  position: static;
                }}
              }}

              @media (max-width: 920px) {{
                body {{
                  padding: 0;
                }}

                .board-shell {{
                  min-height: 100vh;
                  border: 0;
                  border-radius: 0;
                  grid-template-columns: 1fr;
                }}

                .summary-strip,
                .filters,
                .lower-ledger,
                .dependency-layout,
                .braid-grid {{
                  grid-template-columns: 1fr;
                }}

                .rail, .center, .inspector {{
                  border: 0;
                  padding: 0 16px 16px;
                }}

                svg {{
                  min-width: 580px;
                }}
              }}

              @media (prefers-reduced-motion: reduce) {{
                *, *::before, *::after {{
                  animation-duration: 0s !important;
                  animation-iteration-count: 1 !important;
                  transition-duration: 0s !important;
                  scroll-behavior: auto !important;
                }}
              }}
            </style>
          </head>
          <body>
            <main
              class="board-shell"
              data-testid="Phase4ParallelGateBoard"
              data-visual-mode="Phase4_Parallel_Gate_Board"
              data-active-track=""
              data-filter-status="all"
              data-filter-owner="all"
              data-filter-family="all"
              data-filter-chain="all"
              data-reduced-motion="false"
            >
              <header class="masthead" data-testid="GateMasthead">
                <div class="brand-lockup">
                  <div class="grid-mark" aria-hidden="true">
                    <svg
                      data-testid="phase4_launch_grid_mark"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="1.5" y="1.5" width="7" height="7" rx="2" stroke="#3158E0" stroke-width="1.5" />
                      <rect x="11.5" y="1.5" width="7" height="7" rx="2" stroke="#5B61F6" stroke-width="1.5" />
                      <rect x="1.5" y="11.5" width="7" height="7" rx="2" stroke="#0F766E" stroke-width="1.5" />
                      <rect x="11.5" y="11.5" width="7" height="7" rx="2" stroke="#B7791F" stroke-width="1.5" />
                    </svg>
                  </div>
                  <div>
                    <div class="wordmark">Vec<span>ells</span></div>
                    <div class="mode-copy">Phase4_Parallel_Gate_Board</div>
                  </div>
                </div>
                <div class="mode-copy">Generated {TODAY}. One launch board, one owner map, one gate.</div>
              </header>

              <section class="summary-strip" data-testid="GateSummaryStrip" aria-label="Gate summary bands"></section>

              <section class="filters" data-testid="GateFilters" aria-label="Track filters">
                <div class="filter">
                  <label for="status-filter">Status</label>
                  <select id="status-filter" data-testid="StatusFilter">
                    <option value="all">All statuses</option>
                    <option value="ready">Ready</option>
                    <option value="blocked">Blocked</option>
                    <option value="deferred">Deferred</option>
                  </select>
                </div>
                <div class="filter">
                  <label for="owner-filter">Owner</label>
                  <select id="owner-filter" data-testid="OwnerFilter"></select>
                </div>
                <div class="filter">
                  <label for="family-filter">Object family</label>
                  <select id="family-filter" data-testid="ObjectFamilyFilter"></select>
                </div>
                <div class="filter">
                  <label for="chain-filter">Invalidation chain</label>
                  <select id="chain-filter" data-testid="ChainFilter"></select>
                </div>
              </section>

              <aside class="rail" data-testid="TrackRail" aria-labelledby="track-rail-heading">
                <h2 id="track-rail-heading">Tracks</h2>
                <div class="track-list" id="track-list"></div>
              </aside>

              <section class="center" aria-label="Dependency and readiness canvas">
                <section class="panel" data-testid="DependencyLatticeRegion">
                  <div class="panel-head">
                    <div>
                      <h2>Dependency lattice</h2>
                      <p>Tracks, direct blockers, and parallel-safe launch boundary.</p>
                    </div>
                    <div class="muted" id="dependency-summary"></div>
                  </div>
                  <div class="dependency-layout">
                    <div class="graph-shell">
                      <svg
                        id="dependency-lattice"
                        data-testid="DependencyLattice"
                        aria-label="Dependency lattice"
                        role="img"
                        viewBox="0 0 960 720"
                      ></svg>
                    </div>
                    <div>
                      <table data-testid="DependencyLatticeTable">
                        <thead>
                          <tr>
                            <th>Track</th>
                            <th>Status</th>
                            <th>Upstream</th>
                          </tr>
                        </thead>
                        <tbody id="dependency-table-body"></tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section class="panel" data-testid="ReadinessMatrixRegion">
                  <div class="panel-head">
                    <div>
                      <h2>Readiness matrix</h2>
                      <p>Exact launch posture, owner, object family, and blocker law.</p>
                    </div>
                  </div>
                  <table data-testid="ReadinessMatrixTable">
                    <thead>
                      <tr>
                        <th>Track</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Primary objects</th>
                        <th>Readiness note</th>
                      </tr>
                    </thead>
                    <tbody id="readiness-table-body"></tbody>
                  </table>
                </section>

                <section class="panel" data-testid="InvalidationBraidRegion">
                  <div class="panel-head">
                    <div>
                      <h2>Invalidation braid</h2>
                      <p>Cross-track invalidation law that must stay aligned while the programme runs in parallel.</p>
                    </div>
                  </div>
                  <div class="braid-grid" id="braid-grid"></div>
                  <table data-testid="InvalidationBraidTable">
                    <thead>
                      <tr>
                        <th>Chain</th>
                        <th>Owning tracks</th>
                        <th>Law</th>
                      </tr>
                    </thead>
                    <tbody id="braid-table-body"></tbody>
                  </table>
                </section>
              </section>

              <aside class="inspector" aria-label="Launch packet inspector">
                <section class="panel" data-testid="LaunchPacketInspector">
                  <div class="panel-head">
                    <div>
                      <h2>Launch packet inspector</h2>
                      <p id="inspector-caption">Track-specific objective, boundaries, and merge law.</p>
                    </div>
                  </div>
                  <div id="inspector-shell"></div>
                </section>
              </aside>

              <section class="lower-ledger" aria-label="Evidence and gaps">
                <section class="panel" data-testid="EvidenceLedger">
                  <div class="panel-head">
                    <div>
                      <h2>Evidence ledger</h2>
                      <p>Selected-track contract references, surface roots, and mandatory tests.</p>
                    </div>
                  </div>
                  <table data-testid="EvidenceTable">
                    <thead>
                      <tr>
                        <th>Kind</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody id="evidence-table-body"></tbody>
                  </table>
                </section>
                <section class="panel" data-testid="GapLedger">
                  <div class="panel-head">
                    <div>
                      <h2>Gap ledger</h2>
                      <p>Machine-readable unresolved or remediated seams that matter for launch.</p>
                    </div>
                  </div>
                  <table data-testid="GapTable">
                    <thead>
                      <tr>
                        <th>Gap</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Resolution</th>
                      </tr>
                    </thead>
                    <tbody id="gap-table-body"></tbody>
                  </table>
                </section>
              </section>
            </main>

            <script id="atlas-data" type="application/json">{escaped_payload}</script>
            <script>
              const decoder = document.createElement("textarea");
              decoder.innerHTML = document.getElementById("atlas-data").textContent;
              const data = JSON.parse(decoder.value);

              const root = document.querySelector("[data-testid='Phase4ParallelGateBoard']");
              const trackList = document.getElementById("track-list");
              const summaryStrip = document.querySelector("[data-testid='GateSummaryStrip']");
              const ownerFilter = document.getElementById("owner-filter");
              const familyFilter = document.getElementById("family-filter");
              const chainFilter = document.getElementById("chain-filter");
              const statusFilter = document.getElementById("status-filter");
              const dependencySvg = document.getElementById("dependency-lattice");
              const dependencyTableBody = document.getElementById("dependency-table-body");
              const readinessTableBody = document.getElementById("readiness-table-body");
              const braidGrid = document.getElementById("braid-grid");
              const braidTableBody = document.getElementById("braid-table-body");
              const inspectorShell = document.getElementById("inspector-shell");
              const evidenceTableBody = document.getElementById("evidence-table-body");
              const gapTableBody = document.getElementById("gap-table-body");
              const dependencySummary = document.getElementById("dependency-summary");

              const state = {{
                selectedTrackId: data.firstWaveTrackIds[0],
                status: "all",
                owner: "all",
                family: "all",
                chain: "all",
              }};

              const waveOrder = ["first_wave", "backend_wave", "frontend_wave", "deferred_activation", "deferred_assurance"];
              const statusToneClass = {{
                ready: "pill-ready",
                blocked: "pill-blocked",
                deferred: "pill-deferred",
              }};
              const statusColor = {{
                ready: "#0F766E",
                blocked: "#B42318",
                deferred: "#B7791F",
              }};

              function populateFilters() {{
                const owners = ["all", ...data.ownerRoles];
                const families = ["all", ...data.objectFamilyGroups];
                const chains = ["all", ...data.invalidationChains.map((chain) => chain.chainId)];

                ownerFilter.innerHTML = owners
                  .map((owner) => `<option value="${{owner}}">${{owner === "all" ? "All owners" : owner}}</option>`)
                  .join("");
                familyFilter.innerHTML = families
                  .map((family) => `<option value="${{family}}">${{family === "all" ? "All families" : family}}</option>`)
                  .join("");
                chainFilter.innerHTML = chains
                  .map((chain) => `<option value="${{chain}}">${{chain === "all" ? "All chains" : chain}}</option>`)
                  .join("");
              }}

              function matches(track) {{
                const statusMatch = state.status === "all" || track.status === state.status;
                const ownerMatch = state.owner === "all" || track.ownerRole === state.owner;
                const familyMatch = state.family === "all" || track.objectFamilyGroup === state.family;
                const chainMatch =
                  state.chain === "all" || track.invalidationChainRefs.includes(state.chain);
                return statusMatch && ownerMatch && familyMatch && chainMatch;
              }}

              function visibleTracks() {{
                return data.tracks.filter(matches);
              }}

              function ensureSelection(visible) {{
                if (!visible.some((track) => track.trackId === state.selectedTrackId)) {{
                  state.selectedTrackId = visible.length ? visible[0].trackId : data.tracks[0].trackId;
                }}
              }}

              function selectedTrack() {{
                return data.tracks.find((track) => track.trackId === state.selectedTrackId) || data.tracks[0];
              }}

              function relatedTrackIds(track) {{
                const direct = new Set([track.trackId, ...(track.upstreamTrackRefs || []), ...(track.parallelSafeWith || [])]);
                for (const candidate of data.tracks) {{
                  if ((candidate.upstreamTrackRefs || []).includes(track.trackId)) {{
                    direct.add(candidate.trackId);
                  }}
                }}
                return direct;
              }}

              function renderSummary() {{
                summaryStrip.innerHTML = data.summaryBands
                  .map(
                    (band) => `
                      <div class="summary-band tone-${{band.tone}}" data-testid="SummaryBand-${{band.bandId}}">
                        <div>
                          <div class="muted">${{band.label}}</div>
                          <strong>${{band.count}}</strong>
                        </div>
                      </div>
                    `,
                  )
                  .join("");
              }}

              function renderRail(visible) {{
                const related = relatedTrackIds(selectedTrack());
                trackList.innerHTML = visible.length
                  ? visible
                      .map(
                        (track) => `
                          <button
                            type="button"
                            class="track-button"
                            id="TrackButton-${{track.trackId}}"
                            data-testid="TrackButton-${{track.trackId}}"
                            data-status="${{track.status}}"
                            data-owner="${{track.ownerRole}}"
                            data-family="${{track.objectFamilyGroup}}"
                            aria-current="${{track.trackId === state.selectedTrackId ? "true" : "false"}}"
                          >
                            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                              <strong>${{track.trackId}}</strong>
                              <span class="pill ${{statusToneClass[track.status]}}">${{track.statusLabel}}</span>
                            </div>
                            <div>${{track.title}}</div>
                            <div class="track-meta">
                              <span>${{track.ownerRole}}</span>
                              <span>${{track.objectFamilyGroup}}</span>
                              <span>${{related.has(track.trackId) ? "linked" : "peer"}}</span>
                            </div>
                          </button>
                        `,
                      )
                      .join("")
                  : `<div class="empty-state" data-testid="TrackRailEmpty">No tracks match the current filters.</div>`;

                for (const button of trackList.querySelectorAll(".track-button")) {{
                  button.addEventListener("click", () => {{
                    state.selectedTrackId = button.dataset.testid?.replace("TrackButton-", "") || button.id.replace("TrackButton-", "");
                    render();
                  }});
                  button.addEventListener("keydown", (event) => {{
                    const items = [...trackList.querySelectorAll(".track-button")];
                    const index = items.indexOf(button);
                    if (event.key === "ArrowDown" && items[index + 1]) {{
                      event.preventDefault();
                      items[index + 1].focus();
                    }}
                    if (event.key === "ArrowUp" && items[index - 1]) {{
                      event.preventDefault();
                      items[index - 1].focus();
                    }}
                    if ((event.key === "Enter" || event.key === " ") && button.id) {{
                      event.preventDefault();
                      state.selectedTrackId = button.id.replace("TrackButton-", "");
                      render();
                    }}
                  }});
                }}
              }}

              function renderDependencyLattice(visible) {{
                const selected = selectedTrack();
                const related = relatedTrackIds(selected);
                const lanes = waveOrder.filter((wave) => visible.some((track) => track.wave === wave));
                const columnWidth = 176;
                const columnGap = 16;
                const nodeWidth = 160;
                const nodeHeight = 56;
                const rowGap = 18;
                const laneGroups = lanes.map((wave) => visible.filter((track) => track.wave === wave));
                const positions = new Map();
                laneGroups.forEach((tracks, laneIndex) => {{
                  tracks.forEach((track, rowIndex) => {{
                    const x = 20 + laneIndex * (columnWidth + columnGap);
                    const y = 24 + rowIndex * (nodeHeight + rowGap);
                    positions.set(track.trackId, {{ x, y }});
                  }});
                }});
                const maxRows = Math.max(...laneGroups.map((group) => group.length), 1);
                const svgWidth = Math.max(920, 40 + lanes.length * (columnWidth + columnGap));
                const svgHeight = 80 + maxRows * (nodeHeight + rowGap);
                dependencySvg.setAttribute("viewBox", `0 0 ${{svgWidth}} ${{svgHeight}}`);

                const edges = [];
                for (const track of visible) {{
                  const from = positions.get(track.trackId);
                  for (const upstream of track.upstreamTrackRefs) {{
                    if (!positions.has(upstream)) continue;
                    const to = positions.get(upstream);
                    const highlight = related.has(track.trackId) && related.has(upstream);
                    edges.push(`
                      <path
                        class="graph-edge ${{highlight ? "highlight" : ""}}"
                        data-testid="DependencyEdge-${{upstream}}-${{track.trackId}}"
                        d="M ${{to.x + nodeWidth}} ${{to.y + nodeHeight / 2}} C ${{to.x + nodeWidth + 30}} ${{to.y + nodeHeight / 2}}, ${{from.x - 30}} ${{from.y + nodeHeight / 2}}, ${{from.x}} ${{from.y + nodeHeight / 2}}"
                      />
                    `);
                  }}
                }}

                const nodes = visible
                  .map((track) => {{
                    const point = positions.get(track.trackId);
                    const active = track.trackId === state.selectedTrackId;
                    const linked = related.has(track.trackId);
                    return `
                      <g
                        class="graph-node ${{track.status}} ${{active ? "active" : ""}}"
                        data-testid="DependencyNode-${{track.trackId}}"
                        data-track="${{track.trackId}}"
                        tabindex="0"
                        transform="translate(${{point.x}}, ${{point.y}})"
                      >
                        <rect width="${{nodeWidth}}" height="${{nodeHeight}}" />
                        <text x="12" y="22">${{track.trackId}}</text>
                        <text class="sub" x="12" y="40">${{linked ? "linked" : track.statusLabel.toLowerCase()}}</text>
                      </g>
                    `;
                  }})
                  .join("");

                dependencySvg.innerHTML = edges.join("") + nodes;
                dependencySummary.textContent = `${{visible.length}} visible tracks | active ${{selected.trackId}}`;

                for (const node of dependencySvg.querySelectorAll(".graph-node")) {{
                  node.addEventListener("click", () => {{
                    state.selectedTrackId = node.dataset.track;
                    render();
                  }});
                  node.addEventListener("keydown", (event) => {{
                    if (event.key === "Enter" || event.key === " ") {{
                      event.preventDefault();
                      state.selectedTrackId = node.dataset.track;
                      render();
                    }}
                  }});
                }}

                dependencyTableBody.innerHTML = visible
                  .map(
                    (track) => `
                      <tr data-testid="DependencyRow-${{track.trackId}}" data-active="${{track.trackId === state.selectedTrackId ? "true" : "false"}}">
                        <td>${{track.trackId}}</td>
                        <td><span class="pill ${{statusToneClass[track.status]}}">${{track.statusLabel}}</span></td>
                        <td>${{track.upstreamTrackRefs.length ? track.upstreamTrackRefs.join(", ") : "none"}}</td>
                      </tr>
                    `,
                  )
                  .join("");
              }}

              function renderReadinessMatrix(visible) {{
                readinessTableBody.innerHTML = visible
                  .map(
                    (track) => `
                      <tr
                        class="readiness-row"
                        id="ReadinessRow-${{track.trackId}}"
                        data-testid="ReadinessRow-${{track.trackId}}"
                        data-active="${{track.trackId === state.selectedTrackId ? "true" : "false"}}"
                        tabindex="0"
                      >
                        <td>${{track.trackId}}</td>
                        <td><span class="pill ${{statusToneClass[track.status]}}">${{track.statusLabel}}</span></td>
                        <td>${{track.ownerRole}}</td>
                        <td>${{track.primaryObjectFamilies.join(", ")}}</td>
                        <td>${{track.blockedReason || track.readinessReason}}</td>
                      </tr>
                    `,
                  )
                  .join("");

                for (const row of readinessTableBody.querySelectorAll(".readiness-row")) {{
                  row.addEventListener("click", () => {{
                    state.selectedTrackId = row.id.replace("ReadinessRow-", "");
                    render();
                  }});
                  row.addEventListener("keydown", (event) => {{
                    if (event.key === "Enter" || event.key === " ") {{
                      event.preventDefault();
                      state.selectedTrackId = row.id.replace("ReadinessRow-", "");
                      render();
                    }}
                  }});
                }}
              }}

              function renderBraid() {{
                const active = selectedTrack();
                braidGrid.innerHTML = data.invalidationChains
                  .map((chain) => {{
                    const isActive = active.invalidationChainRefs.includes(chain.chainId);
                    return `
                      <article
                        class="braid-card ${{isActive ? "active" : ""}}"
                        data-testid="InvalidationChain-${{chain.chainId}}"
                        data-active="${{isActive ? "true" : "false"}}"
                      >
                        <h3>${{chain.title}}</h3>
                        <p>${{chain.summary}}</p>
                        <div class="chip-row">${{chain.impactObjects.map((item) => `<span class="chip">${{item}}</span>`).join("")}}</div>
                      </article>
                    `;
                  }})
                  .join("");

                braidTableBody.innerHTML = data.invalidationChains
                  .map(
                    (chain) => `
                      <tr data-testid="InvalidationRow-${{chain.chainId}}">
                        <td>${{chain.chainId}}</td>
                        <td>${{chain.ownerTrackIds.join(", ")}}</td>
                        <td>${{chain.law}}</td>
                      </tr>
                    `,
                  )
                  .join("");
              }}

              function renderInspector() {{
                const track = selectedTrack();
                const launchPacket = track.launchPacketRef ? data.launchPackets[track.trackId] : null;
                inspectorShell.innerHTML = `
                  <div class="pill ${{statusToneClass[track.status]}}" data-testid="InspectorStatus">${{track.statusLabel}}</div>
                  <h3 style="margin:12px 0 10px;font-size:20px;color:var(--text-strong);" data-testid="InspectorTrackTitle">${{track.trackId}} · ${{track.title}}</h3>
                  <dl>
                    <dt>Owner</dt>
                    <dd data-testid="InspectorOwner">${{track.ownerRole}}</dd>
                    <dt>Family</dt>
                    <dd data-testid="InspectorFamily">${{track.objectFamilyGroup}}</dd>
                    <dt>Parallel-safe</dt>
                    <dd data-testid="InspectorParallel">${{track.parallelSafeWith.length ? track.parallelSafeWith.join(", ") : "none"}}</dd>
                    <dt>Validator</dt>
                    <dd data-testid="InspectorValidator">${{track.validatorScript}}</dd>
                  </dl>
                  <div class="list-block">
                    <strong>Primary objects</strong>
                    <ul>${{track.primaryObjectFamilies.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
                  </div>
                  <div class="list-block">
                    <strong>${{track.status === "ready" ? "Launch rule" : "Blocker"}}</strong>
                    <div data-testid="InspectorReason">${{track.blockedReason || track.readinessReason}}</div>
                  </div>
                  <div class="list-block">
                    <strong>Merge criteria</strong>
                    <ul>${{track.mergeCriteria.map((item) => `<li>${{item}}</li>`).join("") || "<li>Gate keeps this track out of the first wave.</li>"}}</ul>
                  </div>
                  <div class="list-block">
                    <strong>Mandatory tests</strong>
                    <ul>${{track.mandatoryTests.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
                  </div>
                  <div class="list-block" data-testid="LaunchPacketPanel">
                    <strong>Launch packet</strong>
                    ${{
                      launchPacket
                        ? `<ul>
                            <li><span class="muted">Objective:</span> ${{launchPacket.objective}}</li>
                            <li><span class="muted">Forbidden shortcuts:</span> ${{launchPacket.forbiddenLocalShortcuts.join("; ")}}</li>
                            <li><span class="muted">Fail closed:</span> ${{launchPacket.failClosedConditions.join("; ")}}</li>
                          </ul>`
                        : `<div class="muted">No launch packet is published because this track is not ready to start.</div>`
                    }}
                  </div>
                `;
              }}

              function renderEvidence() {{
                const track = selectedTrack();
                const rows = [
                  ["prompt", track.promptTaskId],
                  ["surface roots", track.expectedSurfaceRoots.join(" | ")],
                  ["upstream contracts", track.upstreamContractRefs.join(" | ") || "none"],
                  ["mandatory tests", track.mandatoryTests.join(" | ")],
                  ["current gaps", track.currentGapRefs.join(" | ") || "none"],
                ];
                evidenceTableBody.innerHTML = rows
                  .map(
                    ([kind, value]) => `
                      <tr data-testid="EvidenceRow-${{kind.replace(/\\s+/g, '-')}}">
                        <td>${{kind}}</td>
                        <td>${{value}}</td>
                      </tr>
                    `,
                  )
                  .join("");
              }}

              function renderGaps() {{
                const track = selectedTrack();
                const visibleGaps = data.gaps.filter(
                  (gap) =>
                    gap.ownerTask === track.trackId ||
                    gap.affectedTracks.includes(track.trackId) ||
                    track.currentGapRefs.some((ref) => ref.endsWith(gap.gapId + ".json")) ||
                    track.currentGapRefs.some((ref) => ref.includes("PHASE4_PARALLEL_INTERFACE_GAP")),
                );
                const rows = visibleGaps.length ? visibleGaps : data.gaps;
                gapTableBody.innerHTML = rows
                  .map(
                    (gap) => `
                      <tr data-testid="GapRow-${{gap.gapId}}">
                        <td>${{gap.gapId}}</td>
                        <td>${{gap.status}}</td>
                        <td>${{gap.ownerTask}}</td>
                        <td>${{gap.resolution}}</td>
                      </tr>
                    `,
                  )
                  .join("");
              }}

              function render() {{
                const visible = visibleTracks();
                ensureSelection(visible);
                const track = selectedTrack();
                root.dataset.activeTrack = track.trackId;
                root.dataset.filterStatus = state.status;
                root.dataset.filterOwner = state.owner;
                root.dataset.filterFamily = state.family;
                root.dataset.filterChain = state.chain;
                renderSummary();
                renderRail(visible);
                renderDependencyLattice(visible);
                renderReadinessMatrix(visible);
                renderBraid();
                renderInspector();
                renderEvidence();
                renderGaps();
              }}

              statusFilter.addEventListener("change", () => {{
                state.status = statusFilter.value;
                render();
              }});
              ownerFilter.addEventListener("change", () => {{
                state.owner = ownerFilter.value;
                render();
              }});
              familyFilter.addEventListener("change", () => {{
                state.family = familyFilter.value;
                render();
              }});
              chainFilter.addEventListener("change", () => {{
                state.chain = chainFilter.value;
                render();
              }});

              root.dataset.reducedMotion =
                window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false";

              populateFilters();
              render();
            </script>
          </body>
        </html>
        """
    ).strip()


def write_gap_files() -> None:
    for entry in GAP_FILES:
        write_json(entry["relativePath"], entry["payload"])


def main() -> None:
    write_gap_files()
    write_json("data/launchpacks/281_track_launch_packet_282.json", LAUNCH_PACKET_282)
    write_json("data/launchpacks/281_track_launch_packet_283.json", LAUNCH_PACKET_283)
    write_json("data/contracts/281_phase4_track_readiness_registry.json", READINESS_REGISTRY)
    write_text("data/contracts/281_phase4_dependency_interface_map.yaml", emit_yaml(DEPENDENCY_INTERFACE_MAP))
    write_json("data/analysis/281_visual_reference_notes.json", EXTERNAL_REFERENCE_NOTES)
    write_csv(
        "data/analysis/281_phase4_contract_consistency_matrix.csv",
        CONSISTENCY_MATRIX_ROWS,
        ["rowId", "artifact", "origin278", "origin279", "origin280", "ownerTrack", "consistencyStatus", "notes"],
    )
    write_csv(
        "data/analysis/281_phase4_track_owner_matrix.csv",
        OBJECT_OWNER_ROWS,
        [
            "artifactId",
            "artifactType",
            "objectFamilyGroup",
            "ownerTrack",
            "ownerRole",
            "freezeContractRef",
            "mutatingTracks",
            "consumerTracks",
            "productionSurfaceRoots",
            "ownershipNote",
        ],
    )
    write_json("data/analysis/281_phase4_parallel_gap_log.json", PARALLEL_GAP_LOG)
    write_text("docs/architecture/281_phase4_parallel_track_gate_and_dependency_map.md", render_architecture_doc())
    write_text("docs/release/281_phase4_parallel_open_gate.md", render_release_doc())
    write_text("docs/api/281_phase4_track_interface_registry.md", render_api_doc())
    write_text("docs/frontend/281_phase4_parallel_tracks_gate_board.html", render_board_html(build_board_payload()))


if __name__ == "__main__":
    main()
