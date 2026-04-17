# 140 Request Type Taxonomy

## Mission
Freeze the authoritative Phase 1 taxonomy for `Symptoms`, `Meds`, `Admin`, and `Results` so the intake journey stays server-driven and semantically stable across browser, embedded, and later authenticated shells.

## Canonical Request Types
| Request type | Question set | Semantic schema | Question count | Bounded supplemental tags |
| --- | --- | --- | --- | --- |
| Symptoms | QSET_140_SYMPTOMS_V1 | SEM_140_SYMPTOMS_V1 | 8 | affected_body_area, duration_hint, home_measurement_present |
| Meds | QSET_140_MEDS_V1 | SEM_140_MEDS_V1 | 6 | repeat_supply_hint, side_effect_hint, dose_window_hint |
| Admin | QSET_140_ADMIN_V1 | SEM_140_ADMIN_V1 | 6 | document_channel_hint, deadline_hint, reference_hint |
| Results | QSET_140_RESULTS_V1 | SEM_140_RESULTS_V1 | 5 | test_setting_hint, date_window_hint, follow_up_hint |

## Semantic Law
- One draft carries one primary `requestType` only.
- Supplemental tags may add bounded hints, but they must not create a second semantic schema.
- Typed summary, normalization, and safety meaning come from question definitions and bundle refs, never from prose copy alone.
- Mid-draft request-type changes route through `RTC_140_CONFIRM_AND_SUPERSEDE_V1`; silent semantic remapping is forbidden.
- `IntakeExperienceBundle` remains the only semantic envelope a draft may pin while it is resumable.

## Change Governance
- `resume_compatible` applies only when question meaning, normalization targets, and summary renderer refs remain unchanged.
- `review_migration_required` applies when the same semantics need an explicit patient review before resume, such as embedded manifest alignment or additive branch publication.
- `blocked` applies when question meaning, required-field logic, request-type semantics, or normalization targets drift.

## Gap Closures
| Gap | Resolution |
| --- | --- |
| GAP_RESOLVED_140_REQUEST_TYPE_IS_NOT_LABEL_ONLY | Each request type now has one semantic schema, one question set ref, one normalization namespace, and one bounded supplemental-tag policy. |
| GAP_RESOLVED_140_MEANING_NOT_INFERRED_FROM_COPY | Every rendered question now carries normalizationTarget, summaryRenderer, and safetyRelevance explicitly. |
| GAP_RESOLVED_140_HIDDEN_ANSWERS_SUPERSEDED | Conditional answers are superseded for audit, excluded from the active summary and payload, and can force review confirmation when safety relevant. |
| GAP_RESOLVED_140_REQUEST_TYPE_CHANGE_GOVERNED | Changing request type mid-draft now requires confirm-and-supersede instead of silent remapping. |
| GAP_RESOLVED_140_BUNDLE_MIGRATION_EXPLICIT | Bundle migration now publishes resume_compatible, review_migration_required, and blocked compatibility modes explicitly. |
| GAP_RESOLVED_140_UNKNOWN_VALUES_BOUNDED | Meds names, result dates, and symptom onset now have bounded unknown or approximate states instead of schema-breaking null ambiguity. |

## Assumptions
| Assumption | Summary |
| --- | --- |
| ASSUMPTION_140_ONE_PRIMARY_REQUEST_TYPE_PER_DRAFT | Phase 1 continues to allow only one primary request type per draft. Supplemental tags and narrative hints do not create a second semantic schema. |
| ASSUMPTION_140_SERVER_DRIVEN_QUESTION_SETS_ARE_SIMULATOR_BACKED | Question sets and bundles are published through simulator-backed content bundles for now. Embedded hosts and authenticated shells must consume the same semantics later. |

## Risks
| Risk | Summary |
| --- | --- |
| RISK_140_BUNDLE_DRIFT_NEEDS_STRICT_GATING | Any future copy, safety, or normalization drift in bundle publication must stay behind the compatibility matrix or drafts will become semantically ambiguous. |
| RISK_140_LATER_ATTACHMENT_AND_URGENT_TRACKS_MUST_NOT_FORK_THE_SCHEMA | seq_141 and seq_142 may extend attachment and urgent policy, but they must consume this taxonomy and question contract instead of inventing parallel form meaning. |
