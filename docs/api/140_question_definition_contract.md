# 140 Question Definition Contract

## Contract Fields
| Field | Why it is required |
| --- | --- |
| questionKey | Stable key for rendering, persistence, audit, and diffing. |
| requestType | Primary request-type branch that owns the question. |
| stepKey | Route-step ownership inside the frozen seq_139 journey. |
| answerType | Typed answer contract; meaning cannot be inferred from copy alone. |
| cardinality | Single or multiple answer law. |
| requiredWhen | Machine-readable rule for when the question becomes required. |
| visibilityPredicate | Machine-readable rule for whether the question is visible at all. |
| normalizationTarget | Exact normalized payload field the answer writes to. |
| safetyRelevance | Whether the answer is none, triage relevant, or safety relevant. |
| summaryRenderer | Stable renderer ref for patient review and downstream summary publication. |
| supersessionPolicy | Exact hidden-answer lifecycle and audit retention rule. |
| helpContentRef | Bounded content reference; help copy may change without changing field meaning. |

## Bundle Fields
| Bundle field | Schema excerpt |
| --- | --- |
| bundleRef | {"type": "string", "pattern": "^IEB_140_[A-Z0-9_]+$"} |
| bundleVersion | {"type": "string", "pattern": "^v\\d+\\.\\d+\\.\\d+$"} |
| draftSchemaVersion | {"type": "string", "const": "INTAKE_DRAFT_VIEW_V1"} |
| questionSetVersion | {"type": "string"} |
| contentPackVersion | {"type": "string"} |
| embeddedManifestVersionRef | {"type": "string"} |
| releaseApprovalFreezeRef | {"type": "string"} |
| minimumBridgeCapabilitiesRef | {"type": "string"} |
| effectiveAt | {"type": "string", "format": "date-time"} |
| expiresAt | {"type": "string", "format": "date-time"} |
| compatibilityMode | {"type": "string", "enum": ["resume_compatible", "review_migration_required", "blocked"]} |
| embeddedChromePolicy | {"type": "string", "enum": ["standard", "nhs_embedded_minimal"]} |
| requestTypeTaxonomyRef | {"type": "string", "const": "RTT_140_PHASE1_V1"} |
| questionDefinitionContractRef | {"type": "string", "const": "QDC_140_PHASE1_V1"} |
| decisionTableSetRef | {"type": "string", "const": "QDT_140_PHASE1_V1"} |
| supportedRequestTypes | {"type": "array", "items": {"type": "string", "enum": ["Symptoms", "Meds", "Admin", "Results"]}, "minItems": 4, "uniqueItems": true} |

## Supersession Law
1. Reveal dependent questions in place when the controlling answer requires them.
2. Recompute visibility immediately when the controlling answer changes.
3. Mark newly hidden answers as superseded for audit.
4. Exclude superseded answers from the active summary and normalized payload.
5. Force review confirmation whenever a superseded answer carried `safety_relevant`.
6. Require a fresh answer when a superseded question reappears later.

## Request Type Change Law
- `RTC_140_CONFIRM_AND_SUPERSEDE_V1` is mandatory once any branch answer exists.
- The confirmation screen must explain that the old branch becomes audit-only.
- Active payload and review summary immediately switch to the new branch only after confirmation.
- If the old branch contained any `safety_relevant` answer, the review step must include a safety confirmation checkpoint before submit.

## Unknown Handling
| Policy ref | Questions | Allowed states | Notes |
| --- | --- | --- | --- |
| UNK_140_MEDS_NAME_BOUNDED_V1 | meds.nameKnown, meds.medicineName, meds.nameUnknownReason | known, unknown_or_unsure | Medicine names do not collapse to free text nulls. Unknown or unsure posture is explicit and routes to one bounded reason field. |
| UNK_140_RESULTS_DATE_BOUNDED_V1 | results.dateKnown, results.resultDate | exact_or_approx, not_sure, unknown | Result dates may be exact or approximate when known; otherwise the patient must stay inside the bounded not-sure or unknown states. |
| UNK_140_SYMPTOM_ONSET_BOUNDED_V1 | symptoms.onsetPrecision, symptoms.onsetDate, symptoms.onsetWindow | exact_date, approximate_window, unknown | Onset answers may be exact, approximate, or unknown, but the schema never infers a date from narrative prose. |
