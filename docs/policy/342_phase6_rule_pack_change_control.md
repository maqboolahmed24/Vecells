# 342 Phase 6 Rule Pack Change Control

This document freezes the change-control posture for Phase 6 pharmacy policy packs.

## Promotion law

1. Draft packs may be edited only before promotion.
2. Promotion must create a new `rulePackId` and never mutate an active pack in place.
3. Promotion requires:
   - a complete threshold family set
   - a complete pathway set and timing guardrail binding
   - golden-case regression
   - hazard-traceability review
   - explanation-bundle text parity
4. Historical replay must always be able to resolve the exact pack version used by a case.

## Retirement law

- A pack retires only by explicit `effectiveTo` closure or clear supersession.
- Silent overwrite is forbidden.
- Retired packs stay replayable and queryable for audit, clinical safety, and dispute resolution.

## Safety posture

- Threshold changes are safety-relevant changes because they can alter suitability, fallback, and timing outcomes.
- DCB0129 and DCB0160 expectations therefore apply to pack change control, hazard traceability, and deployment assurance.
- The rule-pack contract is intentionally stronger than a simple clinical content spreadsheet: it is executable release law.

## What later tracks must not do

- Hard-code threshold defaults in runtime code.
- Reorder pathway precedence locally.
- Treat minor-illness fallback as a silent alternative to global blocks.
- Split patient-facing and staff-facing explanation semantics into separate uncontrolled vocabularies.
