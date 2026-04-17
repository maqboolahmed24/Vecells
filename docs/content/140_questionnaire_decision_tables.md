# 140 Questionnaire Decision Tables

## Conditional Visibility Rules
| Request type | Question | Visibility predicate | Required when | Supersession policy |
| --- | --- | --- | --- | --- |
| Symptoms | symptoms.chestPainLocation | requestType == 'Symptoms' && answers['symptoms.category'] == 'chest_breathing' | requestType == 'Symptoms' && answers['symptoms.category'] == 'chest_breathing' | SUP_140_SAFETY_BRANCH_SUPERSEDE_V1 |
| Symptoms | symptoms.onsetDate | requestType == 'Symptoms' && answers['symptoms.onsetPrecision'] == 'exact_date' | requestType == 'Symptoms' && answers['symptoms.onsetPrecision'] == 'exact_date' | SUP_140_BRANCH_SUPERSEDE_V1 |
| Symptoms | symptoms.onsetWindow | requestType == 'Symptoms' && answers['symptoms.onsetPrecision'] == 'approximate_window' | requestType == 'Symptoms' && answers['symptoms.onsetPrecision'] == 'approximate_window' | SUP_140_BRANCH_SUPERSEDE_V1 |
| Meds | meds.medicineName | requestType == 'Meds' && answers['meds.nameKnown'] == 'known' | requestType == 'Meds' && answers['meds.nameKnown'] == 'known' | SUP_140_BRANCH_SUPERSEDE_V1 |
| Meds | meds.nameUnknownReason | requestType == 'Meds' && answers['meds.nameKnown'] == 'unknown_or_unsure' | requestType == 'Meds' && answers['meds.nameKnown'] == 'unknown_or_unsure' | SUP_140_BRANCH_SUPERSEDE_V1 |
| Admin | admin.deadlineDate | requestType == 'Admin' && answers['admin.deadlineKnown'] == 'deadline_known' | requestType == 'Admin' && answers['admin.deadlineKnown'] == 'deadline_known' | SUP_140_BRANCH_SUPERSEDE_V1 |
| Admin | admin.referenceNumber | requestType == 'Admin' && answers['admin.referenceAvailable'] == 'available' | requestType == 'Admin' && answers['admin.referenceAvailable'] == 'available' | SUP_140_BRANCH_SUPERSEDE_V1 |
| Results | results.resultDate | requestType == 'Results' && answers['results.dateKnown'] == 'exact_or_approx' | requestType == 'Results' && answers['results.dateKnown'] == 'exact_or_approx' | SUP_140_BRANCH_SUPERSEDE_V1 |

## Bundle Compatibility Rules
| Scenario | Applies to | Compatibility mode | Migration action | Confirmation required |
| --- | --- | --- | --- | --- |
| BC_140_SAME_SEMANTICS_PATCH_V1 | Symptoms, Meds, Admin, Results | resume_compatible | resume_existing_draft | no |
| BC_140_EMBEDDED_MANIFEST_ALIGNMENT_V1 | Symptoms, Meds, Admin, Results | review_migration_required | confirm_browser_to_embedded_alignment | yes |
| BC_140_OPTIONAL_BRANCH_ADDITION_V1 | Symptoms, Meds | review_migration_required | show_bundle_diff_and_reanswer_new_branch | yes |
| BC_140_REQUIRED_RULE_DRIFT_V1 | Symptoms, Meds, Admin, Results | blocked | block_resume_and_open_migration_review | yes |
| BC_140_NORMALIZATION_TARGET_DRIFT_V1 | Symptoms, Meds, Admin, Results | blocked | require_new_draft_or_formal_migration | yes |
| BC_140_REQUEST_TYPE_BRANCH_CHANGE_V1 | Symptoms, Meds, Admin, Results | blocked | block_resume_and_reissue_taxonomy | yes |

## Question Set Freeze
- `Symptoms`: symptom category, onset posture, severity clues, worsening-now signal, and free narrative.
- `Meds`: medication issue class, medicine-name posture, issue description, and urgency.
- `Admin`: support type, bounded deadline posture, optional reference hint, and operational detail.
- `Results`: investigation or test context, bounded result date posture, and the patient's exact question.

## Exclusions
- No Phase 1 question may exist only because it is interesting, decorative, or useful later.
- Multi-type intake within one draft is excluded.
- Unknown values must be explicit states, not empty strings that later code might reinterpret.
