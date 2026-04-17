# 201 Cross-Channel Receipt And Status Parity Surfaces

Task `par_201` publishes the `Parity_Status_Atlas` surface family. The primary
route is `/portal/receipt-status-parity`; additional entry routes demonstrate
public status, phone-origin receipt, and SMS-continuation receipt parity.

## Canonical Receipt And Status Truth

The implementation introduces `ReceiptParityResolver`, which builds every
patient-facing receipt and status surface from the same canonical inputs:

- `PatientReceiptConsistencyEnvelope`
- `PatientReceiptEnvelope`
- `PatientRequestSummaryProjection`
- `PatientRequestDetailProjection`
- `PatientAudienceCoverageProjection`

The resolver emits one `semanticStatusKey` across equivalent web,
authenticated, phone-origin, and SMS-continuation contexts. Channel context may
add provenance notes, but it cannot change the status headline, ETA bucket,
promise state, recovery posture, or next-safe action.

## Reusable Components

The production component set is:

- `ReceiptHero`
- `RequestStatusStrip`
- `RequestStatusSummaryCard`
- `ProvenanceContextChipRow`
- `ReceiptOutcomeBridge`

These components render a full receipt page, request-list row status, request
detail header status, and signed-out minimal status posture. The list and detail
surfaces carry the same `semanticStatusKey` as the receipt hero, closing the
receipt/detail/list contradiction gap.

## Provenance Notes

Provenance notes are drawn from a bounded allowlist:

- `Started on web`
- `Signed in to continue`
- `Started by phone`
- `Added more detail after your call`
- `Used SMS continuation`

Every note is `additiveOnly` and `primaryStatusForbidden`. The notes explain
sequence or entry point only. They never become the primary status message and
never create a phone-only or continuation-only status vocabulary.

## Audience Coverage

Public-safe routes suppress authenticated-only details such as message bodies,
attachment names, staff notes, and raw identifiers. This narrowing changes how
much detail is visible; it does not change core status meaning. The
`ReceiptOutcomeBridge` explicitly records
`publicSafeNarrowingChangesCoreMeaning=false`.

## Route Inventory

| Route | Channel context | Purpose |
| --- | --- | --- |
| `/portal/receipt-status-parity` | authenticated | Full authenticated parity receipt. |
| `/status/REQ-4219` | web_public | Signed-out public-safe minimal status. |
| `/phone/receipt/REQ-4219` | phone_origin | Phone-origin receipt with additive provenance. |
| `/continue/receipt/REQ-4219` | sms_continuation | SMS continuation receipt with same canonical status. |
| `/portal/receipt-status-parity/blocked` | authenticated | Recovery posture and mapped blocked outcome. |

## Safety Rules

- No raw tokens, full phone numbers, webhook bodies, or full patient identifiers
  are rendered.
- No channel-specific template can redefine the canonical status grammar.
- Public-safe narrowing must not leak authenticated-only detail.
- Request list rows, receipt heroes, and request detail headers must agree for
  the same request lineage.
