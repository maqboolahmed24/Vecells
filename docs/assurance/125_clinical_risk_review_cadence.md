# 125 Clinical Risk Review Cadence

This document is the human-readable view over [`clinical_review_calendar_seed.json`](../../data/assurance/clinical_review_calendar_seed.json), [`clinical_signoff_gate_requirements.json`](../../data/assurance/clinical_signoff_gate_requirements.json), and [`clinical_risk_review_raci.csv`](../../data/assurance/clinical_risk_review_raci.csv).

## Section A — `Mock_now_execution`

- The repo uses these review event IDs, cadence defaults, and role placeholders now.
- Material changes must enter the signoff graph before merge or release progression.
- `par_123` remains an explicit prerequisite gap for IM1- or SCAL-coupled change classes; those routes stay blocked instead of silently assumed ready.

## Section B — `Actual_production_strategy_later`

- Replace the placeholder roster with named approvers without changing the review-event IDs or the no-self-approval rules.
- Keep the same graph and cadence contracts, then bind them to real governance calendars, named organisations, and live release evidence.
- Extend the same machine-readable artifacts rather than replacing them with ad hoc meeting notes.

## Review Event Calendar

| Event id | Review event | Cadence | Required roles | Next due / SLA |
| --- | --- | --- | --- | --- |
| REV_125_SPRINT_HAZARD_CONTROL_UPDATE | Sprint-level hazard and control update review | fortnightly sprint close | Engineering lead (provisional named approver placeholder), Clinical safety lead / CSO delegate (provisional placeholder), Product owner (provisional named approver placeholder) | 2026-04-24T14:00:00+01:00 |
| REV_125_PREMERGE_MATERIAL_CHANGE | Pre-merge safety-impact review | before merge for material change | Engineering lead (provisional named approver placeholder), Clinical safety lead / CSO delegate (provisional placeholder), Product owner (provisional named approver placeholder) | event_driven |
| REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF | Release-candidate safety signoff | same-day candidate gate | Release and deployment approver (provisional placeholder), Clinical safety lead / CSO delegate (provisional placeholder), Engineering lead (provisional named approver placeholder) | event_driven |
| REV_125_POST_INCIDENT_NEAR_MISS | Post-incident or near-miss review | within two business days of incident classification | Clinical safety lead / CSO delegate (provisional placeholder), Service owner / operations approver (provisional placeholder), Engineering lead (provisional named approver placeholder) | event_driven |
| REV_125_STANDARDS_OR_ONBOARDING_DELTA | Standards-version or onboarding-trigger review | within three business days of standards or onboarding delta | Clinical safety lead / CSO delegate (provisional placeholder), Privacy lead / DPIA owner (provisional placeholder), Security lead (provisional placeholder), Product owner (provisional named approver placeholder) | event_driven |
| REV_125_MONTHLY_CLINICAL_RISK_STANDING | Monthly standing clinical-risk review | first Tuesday monthly | Product owner (provisional named approver placeholder), Engineering lead (provisional named approver placeholder), Clinical safety lead / CSO delegate (provisional placeholder), Service owner / operations approver (provisional placeholder) | 2026-05-05T13:00:00+01:00 |
| REV_125_URGENT_OUT_OF_BAND_BLOCKER | Urgent out-of-band safety review | within one business day of blocker or hazard emergence | Clinical safety lead / CSO delegate (provisional placeholder), Engineering lead (provisional named approver placeholder), Service owner / operations approver (provisional placeholder) | event_driven |

## Assumptions And Open Capacity Gaps

| Gap id | Class | Why it exists | Closure target |
| --- | --- | --- | --- |
| GAP_ROLE_CAPACITY_CLINICAL_SAFETY_LEAD_NAMED_V1 | role_capacity | The clinical safety lead is modeled as a bounded placeholder until the first named roster is published in-repo. | name the clinical safety lead in the live assurance roster before external onboarding or release candidate signoff |
| GAP_ROLE_CAPACITY_INDEPENDENT_SAFETY_REVIEWER_NAMED_V1 | role_capacity | Independent safety review is mandatory for high-impact classes, but the named reviewer roster is not yet fixed in-repo. | bind at least one independent reviewer before any live or pre-production release candidate is promoted |
| GAP_ROLE_CAPACITY_RELEASE_APPROVER_ROSTER_V1 | role_capacity | The release and deployment approver remains a placeholder role in the seed model while the MVP team shape is still provisional. | publish the named release approver roster alongside the first governance review package and release freeze |
| GAP_ROLE_CAPACITY_PRIVACY_AND_SECURITY_ROSTER_V1 | role_capacity | Privacy and security approvals are modeled explicitly now, but the named roster is still placeholder-only. | replace placeholder privacy and security approvers before live onboarding or PHI-bearing release progression |
| PREREQUISITE_GAP_123_IM1_SCAL_READINESS_PACK_PENDING | prerequisite_dependency | The IM1 and SCAL readiness companion pack from par_123 is not yet available, so identity changes with IM1 coupling remain explicitly blocked on that evidence. | consume the par_123 outputs once published and replace blocked IM1/SCAL evidence placeholders with real references |
| ASSUMPTION_REVIEW_CADENCE_SPRINT_FORTNIGHTLY_V1 | cadence_assumption | The seed model assumes a fortnightly sprint review cadence because the live delivery heartbeat is not yet published in a named governance roster. | replace this with the real engineering cadence once the operating calendar is formalised |
| ASSUMPTION_REVIEW_CADENCE_MONTHLY_STANDING_FIRST_TUESDAY_V1 | cadence_assumption | The standing clinical-risk review is seeded as first Tuesday monthly at 13:00 Europe/London to create a bounded default that can later be replaced without changing the review-event IDs. | replace the placeholder slot with the actual governance meeting time |
| ASSUMPTION_REVIEW_CADENCE_RELEASE_CANDIDATE_SAME_DAY_V1 | cadence_assumption | Release candidate signoff is modeled as same-day gated review because release freezes, trust verdicts, and review packages must remain exact for the candidate under review. | narrow the actual SLA if later operational rehearsal demands it |
| ASSUMPTION_REVIEW_CADENCE_POST_INCIDENT_TWO_BUSINESS_DAYS_V1 | cadence_assumption | Post-incident and near-miss review is seeded to occur within two business days to keep late hazard and control drift visible during MVP operations. | replace with the formal incident review policy once named clinical operations governance exists |
