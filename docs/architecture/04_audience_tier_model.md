# Audience Tier Model

## Axis Definitions

| Axis | Definition | Why it matters | Canonical source |
| --- | --- | --- | --- |
| persona | The human actor or bounded operator mode whose job to be done drives the surface. | Prevents patient, clinician, support, hub, pharmacy, operations, governance, and assistive users from collapsing into one generic actor. | blueprint-init.md#2. Core product surfaces |
| audience_tier | The published visibility and mutation ceiling resolved through AudienceVisibilityCoverage and MinimumNecessaryContract. | Separates who the actor is from what data and actions the current surface is lawfully allowed to expose. | phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers |
| shell_type | The owning persistent shell family that preserves continuity for the active entity and route family. | Stops route prefixes, local layouts, or feature labels from impersonating a different shell family. | phase-0-the-foundation-protocol.md#1.1 PersistentShell |
| channel_profile | The posture adaptation of the owning shell: browser, embedded, or constrained_browser. | Lets embedded or constrained delivery narrow chrome and capability without redefining shell ownership. | phase-0-the-foundation-protocol.md#1.1 PersistentShell |
| ingress_channel | The channel by which the actor enters or resumes the lineage: web, embedded, telephony, secure-link, or support-assisted capture. | Preserves telephony parity and same-lineage continuation without creating a second back-office workflow. | blueprint-init.md#2. Core product surfaces |
| route_family | The routed surface family that claims shell residency and owns the dominant action and continuity rules. | Makes route ownership explicit so /workspace, /ops, /hub, and patient portal sections cannot belong to two shells at once. | platform-frontend-blueprint.md#Shell and route-family ownership rules |

## Phase 0 Base Audience Tiers

| Base tier | Definition | Source |
| --- | --- | --- |
| patient_public | Public-safe patient status, secure-link entry before proof, and governed recovery only. | phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers |
| patient_authenticated | Signed-in patient routes with richer request, booking, message, record, pharmacy, and document visibility after live checks pass. | phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers |
| origin_practice | Practice-owned operational and clinically necessary detail for the current organisation only. | phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers |
| hub_desk | Coordination-safe cross-site visibility for ranked offers, travel constraints, and practice-ack debt, without full clinical narrative. | phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers |
| servicing_site | Service-delivery detail required to fulfil the booked or referred service for the site in scope. | phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers |
| support | Masked summary, chronology, and consequence-preview detail, with stronger gates for identity or access-affecting work. | phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers |

## Derived Surface Tiers Used By This Inventory

| Derived surface tier | Coverage basis | Reason |
| --- | --- | --- |
| patient_grant_scoped | patient_public + PatientAudienceCoverageProjection(purposeOfUse = secure_link_recovery) | The corpus distinguishes grant-scoped recovery posture without minting a separate Phase 0 base tier. |
| patient_embedded_authenticated | patient_authenticated + PatientAudienceCoverageProjection(purposeOfUse = embedded_authenticated) | Embedded patient use is a channel-constrained authenticated posture, not a second shell family. |
| origin_practice_clinical | origin_practice + StaffAudienceCoverageProjection(purposeOfUse = operational_execution) | Separates clinician/designated reviewer work from generic practice ops while preserving the same base visibility tier. |
| origin_practice_operations | origin_practice + StaffAudienceCoverageProjection(purposeOfUse = operational_execution) | Keeps practice-operational actors distinct from clinical reviewers inside the shared workspace shell. |
| operations_control | purpose-of-use-specific control-plane rows for operations surfaces | Operations is a control-room specialization that must not borrow ordinary practice, hub, or support payloads. |
| governance_review | StaffAudienceCoverageProjection(purposeOfUse = governance_review) plus GovernanceScopeToken | Governance/admin/config/comms/access work is a distinct control surface, not an operations subpanel. |
| assistive_adjunct | AssistiveSurfaceBinding bound to the owning shell and current audience coverage | Assistive use is an adjunct posture inside the owning task unless the corpus explicitly calls for standalone evaluation or replay tooling. |

## Resolution Notes

- Grant-scoped patient recovery is a derived audience-surface tier over patient_public plus secure_link_recovery purpose of use; it is not a new shell family.
- Operations and governance are treated as purpose-of-use-specific control-plane tiers so they do not consume ordinary practice or support payloads in richer shells.
- Assistive_adjunct is not a visibility tier that widens data by itself; it inherits the owning shell's current audience coverage and trust envelope.
