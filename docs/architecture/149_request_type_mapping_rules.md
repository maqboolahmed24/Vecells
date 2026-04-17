# 149 Request Type Mapping Rules

The Phase 1 normalizer publishes one request-shape contract with four request-type branches.

## Symptoms

- Maps all active `symptoms.*` answers into `requestShape.symptoms.*`.
- Preserves `patientNarrative`.
- Sorts `severityClueCodes`.
- Uses onset branch supersession so `onsetDate` and `onsetWindowCode` never coexist in active truth unless the frozen bundle explicitly allowed both.

## Meds

- Maps bounded medication issue and urgency into `requestShape.meds`.
- Keeps `medicineNameState`, `medicineNameText`, and `medicineNameUnknownReason` distinct.
- Preserves `issueNarrative` exactly after deterministic whitespace normalization.

## Admin

- Maps support type, deadline state or date, and reference availability into `requestShape.admin`.
- Keeps `referenceNumber` only when the branch remains active in the frozen submit cut.
- Preserves `patientNarrative`.

## Results

- Maps context, test name, date posture, and patient question into `requestShape.results`.
- Keeps `resultDatePartial` only when the date branch remains active.
- Treats the patient question as the request-field narrative fallback when `freeTextNarrative` is blank.

## Shared rules

- `summaryRenderer` fragments are generated from the question definition and normalized answer value.
- `safetyRelevance` is carried through fragment metadata for later safety work.
- `normalizationTarget` is the only legal source of request-shape meaning.
