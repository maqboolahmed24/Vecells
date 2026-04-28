# 353 External Reference Notes

Reviewed on `2026-04-23` for `par_353_phase6_track_backend_build_bounce_back_urgent_return_and_reopen_mechanics`.

The local blueprint remained authoritative. The sources below were used only to sharpen channel, urgency, and operational routing choices.

## Borrowed guidance

1. [GP Connect: Update Record](https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record)

- Borrowed:
  - Update Record is limited to community pharmacy consultation summaries for the supported services.
  - Urgent actions or referrals back to general practice are still communicated through local professional processes such as NHSmail or telephone.
  - Safeguarding concerns must not be sent through Update Record.
- Implementation effect:
  - `UrgentReturnDirectRouteProfile.updateRecordForbidden = true`
  - urgent and safeguarding bounce-backs resolve onto direct professional or monitored-email route metadata instead of calm outcome channels

2. [Changes to the GP Contract in 2026/27](https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/)

- Borrowed:
  - practices are required to maintain a dedicated, monitored email address for pharmacy communications
  - that address is explicitly described as a safety-net when GP Connect is unavailable or the activity is not yet supported through GP Connect
- Implementation effect:
  - `UrgentReturnDirectRouteProfile.monitoredSafetyNetRequired = true`
  - routine and urgent return routing keeps a fallback monitored-email reference instead of assuming one live digital route

3. [Practices referring patients to Pharmacy First for lower acuity minor illnesses and clinical pathway consultations](https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/)

- Borrowed:
  - referrals are sent to a pharmacy of the patient’s choice
  - the practice sends an electronic referral with consent
  - consultation outcomes flow back either through secure digital GP system messaging or email fallback
- Implementation effect:
  - bounce-back handling preserves choice and shell continuity instead of replacing provider provenance with a queue-local status
  - patient notification and reachability refresh are modelled as follow-on truth, not as proof that the original referral remained healthy

4. [Community pharmacy advanced service specification: NHS Pharmacy First Service](https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-%20specification-nhs-pharmacy-first-service/)

- Borrowed:
  - the current service materials were updated on 23 September 2025
  - the active operational set is still the service specification plus the clinical pathways, PGDs, and protocol
- Implementation effect:
  - the backend keeps the bounce-back classifier and reopen calculator version-shaped instead of baking one static calm workflow

5. [NHS Pharmacy First clinical pathways PDF](https://www.england.nhs.uk/wp-content/uploads/2023/11/PRN00936_ii_pharmacy-first-clinical-pathways-version-2.5.pdf)

- Borrowed:
  - the pathways explicitly tell pharmacies to consider risk of deterioration, red flags, or serious illness
  - some pathway branches require urgent same-day referral to general practice or the relevant out-of-hours service
  - the pathways carry onward referral and safety-netting obligations rather than assuming the pharmacy can always complete the episode
- Implementation effect:
  - the backend keeps `urgent_gp_return`, `routine_gp_return`, `pharmacy_unable_to_complete`, and `referral_expired` as different authorities
  - reopen priority and `gpActionRequired` remain conservative when red-flag or same-day review posture is present

## Rejected or deliberately not adopted

- Rejected any interpretation that absence of Update Record or absence of a supplier message implies completion. The local blueprint and `352` reconciliation rules stay authoritative there.
- Rejected any flattening of urgent return into ordinary outcome settlement. Official guidance still treats urgent actions and safeguarding as separate local communication paths.
- Rejected any approach that would treat monitored email as the primary calm path. It is implemented as a safety-net route, not as proof that a case is resolved.
- Rejected secondary vendor blogs, slide decks, and summary articles as authoritative inputs. They were not needed once the official NHS England and NHS England Digital sources above were available.
