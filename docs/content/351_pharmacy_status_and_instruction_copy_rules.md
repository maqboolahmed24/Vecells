# 351 Pharmacy Status And Instruction Copy Rules

The 351 grammar is versioned by `phase6_pharmacy_patient_copy_v1`.

## Required copy intents

Every patient instruction panel can publish typed copy for:

- what the patient needs to do now
- where to go or who will contact them
- when something may happen
- what to do if symptoms worsen
- review posture
- urgent return posture
- contact-route repair posture
- calm completion posture

## Non-negotiable wording rules

- Do not call a pharmacy referral a booked appointment.
- Use “text message” instead of “SMS”.
- If the next step is uncertain, say that the service will show the next safe step here; do not fill the gap with guesswork.
- If contact-route repair is active, the headline and next-step copy must direct the user to repair contact details before routine reassurance.
- If identity repair is active, keep the pharmacy reference read-only and explain that live pharmacy actions are paused for safety.
- If outcome review is open, say that an update from the pharmacy is being reviewed. Do not say “completed”, “finished”, or equivalent calm language.
- If urgent return is active, tell the patient not to wait for routine pharmacy contact.

## Phrase choices borrowed into the grammar

- Use direct action language and short sentences.
- Make the next step explicit.
- Keep warning content brief and specific.
- Keep confirmation-style calmness only for genuine completion.

## Forbidden phrases for routine pharmacy status

- “Your appointment is booked”
- “Your booking is confirmed”
- “See you at the appointment”
- “The consultation time is confirmed”

These phrases are illegal in the current Phase 6 pharmacy route because the underlying truth model is referral and pharmacy contact, not appointment truth.
