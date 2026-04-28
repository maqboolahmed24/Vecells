# 349 Package Content Redaction And Provenance Rules

## Minimum-necessary boundary

349 decides package inclusion before transport. It does not defer clinically material inclusion or
redaction choices to adapter code.

The canonical decision states are:

- `included`
- `excluded_by_policy`
- `included_redaction_required`
- `included_summary_only`
- `unavailable`

## Provenance requirements

For every structured lane or supporting artifact, the engine records:

- source artifact ref
- source hash
- derivation ref when derived
- visibility policy ref
- minimum-necessary contract ref
- decision state
- reason code
- redaction transform ref or absence reason
- resulting canonical artifact ref when materialized

## Failure-closed rules

Freeze fails closed if any of the following are unresolved:

- selected-provider tuple drift
- consent checkpoint drift or non-satisfied state
- policy bundle mismatch
- route-intent tuple mismatch
- missing required structured summary without a governed fallback
- canonical representation replay mismatch

## Transport-neutrality rules

349 may reference a canonical `FhirRepresentationSet`, but it may not:

- pick transport mode
- shape payload quirks for `mesh`, `nhsmail_shared_mailbox`, `bars_fhir`, or other adapter modes
- omit content because one later adapter is narrower than another

Transport-specific rendering belongs to `350`, but only from the frozen package boundary.
