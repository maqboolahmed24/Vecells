# 351 External Reference Notes

Reviewed on 2026-04-23 for task `par_351_phase6_track_backend_build_patient_instruction_generation_and_referral_status_projections`.

These sources were used as secondary support only. The local blueprint remained authoritative when translating them into backend state law.

## Borrowed

1. NHS England Pharmacy First service specification  
   URL: https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/  
   Borrowed: patient-facing wording should reflect referral and pharmacy contact flow rather than appointment flow.

2. NHS England update on the Pharmacy First service  
   URL: https://www.england.nhs.uk/long-read/update-on-the-pharmacy-first-service/  
   Borrowed: remote delivery is possible where safe, and contact may happen by phone, video, or in person. This reinforced the instruction grammar for “the pharmacist may speak to you”.

3. NHS service manual: Writing NHS messages  
   URL: https://service-manual.nhs.uk/content/writing-nhs-messages  
   Borrowed: short, direct action-led copy and explicit next-step wording.

4. NHS service manual: Health literacy  
   URL: https://service-manual.nhs.uk/content/health-literacy  
   Borrowed: keep medical or operational wording simple and action-oriented; do not assume users can infer what to do from clinical shorthand.

5. NHS service manual: Accessibility guidance for content  
   URL: https://service-manual.nhs.uk/accessibility/content  
   Borrowed: clear headings and plain content are the primary accessibility control for this status family, so the projection structure keeps explicit headline, next-step, warning, and review fields.

6. NHS service manual: Interruption page  
   URL: https://service-manual.nhs.uk/design-system/patterns/interruption-page  
   Borrowed: urgent and warning content should be brief, exceptional, and reserved for genuinely unusual or serious posture.

7. NHS service manual: Confirmation page  
   URL: https://service-manual.nhs.uk/design-system/patterns/confirmation-page  
   Borrowed: calm completion must include what happens next and when, but only after the backend truth really reaches completion.

8. NHS service manual: A to Z of NHS health writing  
   URL: https://service-manual.nhs.uk/content/a-to-z-of-nhs-health-writing  
   Borrowed: use “text message” rather than “SMS” and prefer commonly understood public language.

## Explicitly rejected or constrained

- I did not adopt confirmation-page language for any state that still had outcome review, reachability repair, or identity hold active.
- I did not carry over any wording that would imply a booked appointment because the local blueprint defines this route as referral and pharmacy contact truth.
- I did not let service-manual presentation patterns override the frozen macro-state law from the local blueprint.
