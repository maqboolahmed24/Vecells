# 31 Vendor Selection Decision Log

| Decision | Status | Choice | Rationale |
| --- | --- | --- | --- |
| DEC_31_001 | accepted | Keep the internal signal fabric as the only selected mock-now lane. | Mock-first remains mandatory and seq_032/033 must not be blocked by live accounts. |
| DEC_31_002 | accepted | Shortlist Twilio and Vonage for telephony. | They have the strongest current public evidence for voice callbacks, fallback routing, IVR, recording references, and governance mechanics. |
| DEC_31_003 | accepted | Shortlist Vonage and Twilio for SMS. | Both publish strong callback evidence; Vonage edges ahead on signed webhook posture while Twilio remains strong on sandbox depth and market maturity. |
| DEC_31_004 | accepted | Shortlist Mailgun and SendGrid for email. | They publish the clearest current official webhook security and region/residency guidance. |
| DEC_31_005 | accepted | Reject Postmark from the actual shortlist. | The reviewed official webhook guidance does not show signed or replay-safe callbacks, which fails the seq_031 evidence bar. |
| DEC_31_006 | accepted | Do not shortlist any combined suite. | Coupling risk and portability penalties outweigh procurement simplification right now. |
| DEC_31_007 | accepted | Carry account/project field-map work into seq_032 and seq_033 only. | This task must prepare the handoff, not mutate real accounts. |

## Family Priority Context

- telephony mock rank: 5
- sms mock rank: 11
- email mock rank: 10
- external gate posture: `withheld`

## Kill Switches

| Kill switch | Family | Trigger | Effect |
| --- | --- | --- | --- |
| KS_COMMS_001 | telephony_ivr | Reject any telephony vendor that lacks callback authenticity proof or forces blind trust in unsigned voice events. | Not shortlistable for seq_032 handoff. |
| KS_COMMS_002 | telephony_ivr | Reject any telephony vendor if call accepted or callback arrival would be mistaken for settled contact truth. | Not shortlistable for seq_032 handoff. |
| KS_COMMS_003 | sms | Reject any SMS vendor that cannot surface queued, delayed, bounced, expired, or wrong-recipient states separately. | Not shortlistable for seq_033 handoff. |
| KS_COMMS_004 | sms | Reject any SMS vendor whose callback channel cannot be authenticated or made replay-safe with documented provider signals. | Not shortlistable for seq_033 handoff. |
| KS_COMMS_005 | email | Reject any email vendor that lacks signed or replay-safe webhook proof for delivery, bounce, and complaint events. | Not shortlistable for seq_033 handoff. |
| KS_COMMS_006 | email | Reject any email vendor that cannot preserve sender/domain verification, event webhook setup, and environment separation cleanly. | Not shortlistable for seq_033 handoff. |
| KS_COMMS_007 | combined | Reject any combined-suite option that wins only by procurement simplicity while increasing lock-in and failure-domain coupling. | Not shortlistable as a cross-family default. |
| KS_COMMS_008 | combined | Reject any combined-suite option that does not cover telephony, SMS, and email together in current reviewed official docs. | Combined row marked rejected. |
| KS_COMMS_009 | mock_lane | Reject any internal twin that skips IVR branches, urgent preemption, webhook disorder, bounce/dispute, or route-repair semantics. | Mock lane not selectable for MVP execution. |
| KS_COMMS_010 | email | Explicit seq_031 rejection: Postmark current official guidance exposes custom headers/basic auth but no signed replay-safe callback proof. | postmark_email stays rejected. |
| KS_COMMS_011 | combined | Reject any combined-suite proposal if seq_032 or seq_033 would be unable to swap vendors per family without lifecycle rewrites. | No combined suite may be defaulted now. |
