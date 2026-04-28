# 31 Vendor Universe Telephony SMS Email

`seq_031` turns the communications provider question into a family-by-family dossier instead of a single generic "communications vendor" choice. The current recommendation is explicit:

- selected mock-now combined lane: `Vecells Internal Signal Fabric`
- real-later default posture: `split_vendor_preferred`
- current shortlist count: 6
- rejected rows: 2
- official evidence rows: 33
- current gate posture: `withheld`

The shortlist preserves the blueprint rule that transport success never becomes lifecycle authority. Telephony, SMS, and email are scored independently, then compared against combined-suite options only after lock-in and failure-domain penalties are applied.

## Family Posture

## Telephony / IVR
| Vendor | Lane | Mock fit | Actual fit | Replay-safe | Lock-in | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Vecells Internal Voice Twin | mock_only | 98 | 97 | yes | low | Selected mock-now telephony twin. Must preserve call session lifecycle, IVR, recording presence vs absence, transcript readiness, urgent-live preemption, webhook retries, and continuation handoff. |
| Twilio | shortlisted | 82 | 80 | no | high | Strong public sandbox and recording support, but callback authenticity relies on signature validation plus adapter-side dedupe rather than a first-class replay token. |
| Vonage | shortlisted | 80 | 80 | yes | medium | Vonage scores well on signed callbacks, fallback webhooks, DTMF, and recording URLs. It remains slightly behind Twilio on public test-environment depth. |
| Sinch | candidate | 75 | 74 | yes | medium | Technically capable enough to remain in the universe, but the current public evidence set is thinner on sandbox and commercial operations than Twilio or Vonage. |

## SMS
| Vendor | Lane | Mock fit | Actual fit | Replay-safe | Lock-in | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Vecells Internal SMS Rail Twin | mock_only | 98 | 97 | yes | low | Selected mock-now SMS rail. Must preserve accepted vs delayed vs bounced vs expired delivery, wrong-recipient risk, replay-safe callbacks, and non-authoritative transport acceptance. |
| Twilio | shortlisted | 81 | 79 | no | high | High-quality API and callback coverage, but no first-class replay token in the reviewed webhook docs means the adapter must own replay defense. |
| Vonage | shortlisted | 78 | 78 | yes | medium | The strongest current SMS-specific callback security story in the reviewed public material; remains shortlisted despite lighter sandbox depth than Twilio. |
| Sinch | candidate | 72 | 72 | no | medium | Sinch remains a credible universe row because its delivery-report callbacks are detailed, but the public callback-security story is weaker for the exact SMS surface. |

## Email
| Vendor | Lane | Mock fit | Actual fit | Replay-safe | Lock-in | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Vecells Internal Email Rail Twin | mock_only | 98 | 97 | yes | low | Selected mock-now email rail. Must preserve accepted vs delivered vs delayed vs bounced vs complained vs disputed outcomes and controlled resend under the same authoritative chain. |
| Mailgun | shortlisted | 84 | 84 | yes | medium | Best fit for authoritative delivery ambiguity, explicit replay defense, EU region control, and project-style subaccount segmentation. |
| Twilio SendGrid | shortlisted | 80 | 80 | yes | high | Strong webhook security and EU subuser posture offset the sandbox limitation that no event webhooks fire during sandbox-mode validation. |
| Postmark | rejected | 80 | 79 | no | medium | Excellent testing ergonomics and message-stream separation, but current official docs do not meet the replay-safe callback requirement for authoritative delivery evidence. |

## Combined Suite
| Vendor | Lane | Mock fit | Actual fit | Replay-safe | Lock-in | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Vecells Internal Signal Fabric | mock_only | 98 | 97 | yes | low | Mock-now execution stays on the internal combined signal fabric even though real providers are researched now. No external vendor is allowed to become lifecycle authority during MVP buildout. |
| Sinch Communications + Mailgun | candidate | 74 | 73 | yes | high | Interesting medium-term portfolio option, but the reviewed public evidence still favors split vendors for lower coupling and clearer sandbox-to-live behavior. |
| Twilio Communications + Twilio SendGrid | candidate | 76 | 73 | yes | very_high | A credible combined-suite candidate only. It is not shortlisted because split-vendor posture reduces coupling and avoids one vendor becoming hidden lifecycle authority. |
| Vonage-only Single Suite | rejected | 64 | 66 | yes | medium | Useful for voice-plus-SMS comparison, but not admissible as a single all-communications suite for this task. |
