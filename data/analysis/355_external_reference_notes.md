# 355 External Reference Notes

Reviewed on `2026-04-24` for `par_355_phase6_track_backend_build_pharmacy_console_support_region_and_stock_truth_api`.

The local blueprint remained authoritative. The sources below were used only to sharpen stock freshness, governed stock handling, and blocked-posture shaping for later same-shell UI consumption.

## Borrowed guidance

1. [Managing expired stock and decommissioned products](https://www.sps.nhs.uk/articles/managing-expired-stock-and-decommissioned-products/)

- Borrowed:
  - patient safety depends on the right medicine being available in the right quantity and in date
  - robust stock-control processes and regular stock rotation are required
  - stock nearing expiry should be rotated or moved before expiry, and expired stock should not quietly continue in order algorithms
- Implementation effect:
  - 355 models explicit freshness and expiry posture instead of treating last-verified timestamps as descriptive only
  - hard-stop freshness and stale inventory blockers remain first-class backend truth
  - supply and comparison projections keep expiry posture visible so later UI work cannot quietly arm an aging or stale route

2. [Controlled drugs: standard operating procedure guidelines](https://www.gov.uk/government/publications/guidelines-for-standard-operating-procedures/guidelines-for-standard-operating-procedures)

- Borrowed:
  - controlled-drug handling is expected to be covered by end-to-end SOPs
  - SOP coverage includes storage, periodic stock checks, receipt, transport, audits, incident handling, and security
  - even virtual organisations directing flow still need the same governance coverage
- Implementation effect:
  - inventory truth keeps governed-stock, quarantine, trust, and supervisor-hold posture explicit
  - fence invalidation treats policy and security drift as material changes, not cosmetic metadata
  - same-shell support-region truth exposes governed posture instead of flattening controlled stock into ordinary inventory

3. [Transporting controlled drugs: guidance on security measures](https://www.gov.uk/government/publications/transporting-controlled-drugs-guidance-on-security-measures)

- Borrowed:
  - controlled-drug transport requires explicit security measures in transit
  - custody and transfer posture remain operationally meaningful until stock is at a secure location
- Implementation effect:
  - handoff readiness and watch posture stay blocked when governed transport assumptions are not converged
  - action settlement does not allow quiet release language before transfer and continuity evidence agree

4. [Practices referring patients to Pharmacy First for lower acuity minor illnesses and clinical pathway consultations](https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/)

- Borrowed:
  - referrals are to a pharmacy of the patient’s choice
  - the referral depends on patient consent and an electronic referral message
  - pharmacists record and return outcomes to general practice through secure digital routes or email fallback
- Implementation effect:
  - 355 keeps choice truth, consent checkpoint, dispatch truth, and outcome truth as upstream authorities feeding console posture
  - handoff and assurance stay blocked when these upstream authorities have not converged

5. [Community pharmacy advanced service specification: NHS Pharmacy First Service](https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-%20specification-nhs-pharmacy-first-service/)

- Borrowed:
  - the current service document set is versioned and the published clinical materials were updated on `23 September 2025`
  - Pharmacy First operational flow remains bound to the service specification, pathways, and PGD/protocol pack
- Implementation effect:
  - 355 keeps version-shaped, replayable support-region truth rather than assuming one timeless calm release path
  - continuity and assurance remain explicit because service policy and pathway packs can change over time

6. [Interruption page](https://service-manual.nhs.uk/design-system/patterns/interruption-page)

- Borrowed:
  - staff-facing warnings are appropriate for unusual or risky actions
  - when an action should never happen, the system should prevent it rather than merely warn
  - recovery surfaces should keep content brief and provide an explicit return path
- Implementation effect:
  - 355 separates `review_required` from hard blocked posture
  - stale inventory, unresolved settlement, or outcome-review debt remain blocked in backend truth instead of degrading into advisory-only warnings

7. [Error summary](https://service-manual.nhs.uk/design-system/components/error-summary)

- Borrowed:
  - validation posture should be explicit, top-level, and linkable to the offending answers
  - focus should move to the summary when errors are present
- Implementation effect:
  - medication validation and comparison projections preserve explicit blocker codes and line-item refs so later UI work can anchor blocked posture without inventing its own classification layer

8. [Understanding SC 2.4.11: Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)

- Borrowed:
  - focused components must remain visible and not be obscured by overlapping persistent surfaces
- Implementation effect:
  - 355 keeps only one promoted support region authoritative at a time and keeps blocked or recovery posture tied to explicit promoted-region truth
  - later shell work can rely on one backend-driven dominant support region instead of multiple competing surfaces

9. [Understanding SC 1.4.10: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow)

- Borrowed:
  - non-excepted content should reflow within the viewport, while genuinely two-dimensional sections can remain bounded exceptions
  - headings, search, pagination, and surrounding controls still need to reflow even when a bounded table or grid is excepted
- Implementation effect:
  - 355 shapes inventory comparison as one bounded support-region contract while keeping summary, validation, and blocker posture separate and reflow-safe for later frontend consumption
  - the backend preserves one promoted support-region model rather than encouraging detached full-page compare workflows

## Rejected or deliberately not adopted

- Rejected any interpretation that a recent verification timestamp alone proves safe release. The backend still requires explicit freshness state and can hard-stop on stale or unavailable truth.
- Rejected any interpretation that controlled-stock presence alone should change the workflow without explicit governance posture. Controlled or governed handling is modelled as visible backend truth, not as an invisible UI rule.
- Rejected vendor blogs, wholesaler guidance notes, and pharmacy-software product pages as authoritative inputs once current NHS, GOV.UK, and W3C sources were available.
- Rejected any detached compare-page or detached handoff-page model. The local blueprint remains explicit that inventory, compare, and handoff are same-shell support-region or mission-frame postures.
