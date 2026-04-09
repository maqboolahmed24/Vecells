# Persona Catalog

## Summary

- Personas inventoried: 13
- Upstream requirement rows consumed: 1453
- Upstream summary conflicts consumed: 19

## Why This Exists

This catalog separates persona, audience tier, shell, channel, and route ownership so later auth, frontend, and endpoint work can rely on one actor model instead of rediscovering it from prose.

## Persona Matrix

| Persona | Sub-persona | Audience tier | Shells | Channels | Posture | Primary jobs |
| --- | --- | --- | --- | --- | --- | --- |
| Patient | Anonymous intake starter | patient_public | patient | browser_web | baseline | Describe the issue and submit it into the governed intake pipeline.; Upload optional evidence and contact preferences without leaving the intake lineage. |
| Patient | Authenticated portal user | patient_authenticated | patient | browser_web | baseline | Track requests, appointments, communications, and records inside one signed-in shell.; Perform route-bound post-submit actions only when current capability and settlement truth allows it. |
| Patient | Grant-scoped patient resuming a specific lineage | patient_grant_scoped | patient | sms_secure_link_continuation<br>constrained_browser | baseline | Resume one specific request, message, callback, or booking/manage path without broadening the shell to a full authenticated portal.; Step up into richer self-service only when current grant, route, and publication truth still match. |
| Patient | Phone or IVR caller | patient_public | patient | telephony_ivr | baseline | Start or continue intake through telephony/IVR with parity to digital intake.; Receive optional SMS continuation without changing the underlying request lineage. |
| Patient | Embedded NHS App patient user | patient_embedded_authenticated | patient | embedded_webview | deferred | Use the patient portal through a trusted embedded channel without losing same-shell continuity.; Perform embedded-safe versions of ordinary patient actions when release and bridge posture permit. |
| Staff | Clinician or designated reviewer in Clinical Workspace | origin_practice_clinical | staff | browser_web | baseline | Scan the queue, open the right task, and reach a safe decision quickly.; Use bounded assistive and evidence surfaces without losing task continuity. |
| Staff | Practice operational staff | origin_practice_operations | staff | browser_web | baseline | Work queue items, admin resolution, and operational follow-up in the same workspace shell.; Escalate, hand off, or resume tasks without leaving the queue/task continuity frame. |
| Staff | Hub coordinator | hub_desk | hub | browser_web | baseline | Coordinate cross-site booking or callback fallback from one hub shell.; Keep origin-practice continuity visible while alternatives, callback, or return-to-practice work progresses. |
| Staff | Pharmacy servicing or assurance user | servicing_site | pharmacy | browser_web | baseline | Validate, fulfil, hand off, and assure Pharmacy First work without falling back to generic workspace layout.; Keep settlement and continuity truth attached to the same pharmacy case shell. |
| Staff | Support desk agent | support | support | browser_web<br>support_assisted_capture | baseline | Operate a ticket-centric repair workspace across resend, restore, identity, reachability, and handoff work.; Assist capture into the same request lineage without turning support into a parallel workflow system. |
| Staff | Operations lead or control-room operator | operations_control | operations | browser_web | baseline | Detect bottlenecks and decide where bounded intervention has the highest safe leverage.; Drill into anomalies without losing board state, selection, or return context. |
| Staff | Governance, admin, config, comms, or access lead | governance_review | governance | browser_web | baseline | Review, approve, promote, rollback, configure, and audit governance work inside a dedicated shell.; Pivot to read-only evidence without losing the current governed object, draft, or watch context. |
| Staff | Assistive feature consumer | assistive_adjunct | staff<br>support<br>operations | browser_web | bounded_secondary | Inspect, accept, reject, or ignore assistive suggestions without displacing primary human-led work.; Use provenance, freshness, and rollout posture to decide whether the assistive output is usable. |

## High-signal Notes

- Grant-scoped patient recovery is explicit and does not collapse into the ordinary signed-in portal persona.
- Staff is deliberately split into clinician, practice ops, hub, pharmacy, support, operations, governance, and assistive-adjunct modes.
- Assistive is tracked as a bounded adjunct for live care and support work; standalone assistive shell work stays conditional.

## Assumptions

- ASSUMPTION_AUDIENCE_004_001: Grant-scoped patient recovery is modeled as a derived audience tier over Phase 0 patient_public coverage because the corpus distinguishes secure-link recovery by purpose of use rather than by adding a third mandatory patient base tier.
- ASSUMPTION_CHANNEL_004_002: Telephony/IVR and secure-link continuation are mapped to constrained_browser shell posture where a current shell is preserved, because Phase 0 canonicalizes browser, embedded, and constrained_browser as the only shell channel profiles.
- ASSUMPTION_ROUTE_004_003: Pre-submit intake and standalone assistive-control route families are inventory labels derived from the corpus until later tasks publish concrete URL contracts.
