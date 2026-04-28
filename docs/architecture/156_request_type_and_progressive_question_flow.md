# 156 Request Type And Progressive Question Flow

`par_156` turns the patient intake mission frame into a real Phase 1 request-type and question journey.

## Source Authority

- `data/contracts/140_request_type_taxonomy.json`
- `data/contracts/140_question_definitions.json`
- `data/contracts/145_validation_error_contract.json`
- `data/contracts/156_progressive_question_ui_contract.json`
- `docs/architecture/155_patient_intake_mission_frame.md`

## Runtime Shape

- The shell remains `Quiet_Clarity_Mission_Frame`.
- The route family remains `rf_intake_self_service`.
- The continuity key remains `patient.portal.requests`.
- Request type selection is semantic, not decorative.
- The details route is one question frame at a time, driven from typed metadata.

## Progressive Flow Rules

- One primary request type per draft.
- One root question group at a time on the details route.
- Direct dependent questions reveal in place beneath the controlling answer.
- Hidden branch answers are superseded and removed from the active summary.
- Safety-relevant supersession clears `reviewAffirmed` and forces a review cue before routine submit.
- Request-type changes mid-draft require explicit confirm-and-supersede.

## Root Question Groups

| Request type | Root groups |
| --- | --- |
| Symptoms | `symptoms.category`, `symptoms.onsetPrecision`, `symptoms.worseningNow`, `symptoms.severityClues`, `symptoms.narrative` |
| Meds | `meds.queryType`, `meds.nameKnown`, `meds.issueDescription`, `meds.urgency` |
| Admin | `admin.supportType`, `admin.deadlineKnown`, `admin.referenceAvailable`, `admin.details` |
| Results | `results.context`, `results.testName`, `results.dateKnown`, `results.question` |

## Reveal Dependencies

- `symptoms.category -> symptoms.chestPainLocation`
- `symptoms.onsetPrecision -> symptoms.onsetDate | symptoms.onsetWindow`
- `meds.nameKnown -> meds.medicineName | meds.nameUnknownReason`
- `admin.deadlineKnown -> admin.deadlineDate`
- `admin.referenceAvailable -> admin.referenceNumber`
- `results.dateKnown -> results.resultDate`

## Review And Summary

- Summary chips are derived only from active, visible answers.
- Superseded answers remain in audit history only.
- The center column shows context chips for prior active answers when they matter to the current frame.
- Helper content is bounded to one `Why we ask this` region for the current question group.
