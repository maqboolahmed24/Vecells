# 31 Actual Provider Shortlist And Due Diligence

The actual-provider-later output is deliberately fail-closed:

- no purchase, number reservation, sender verification, or spend is allowed in seq_031
- current external posture remains `withheld`
- combined suites are evaluated, but none are shortlisted as the default
- seq_032 must only work from the telephony shortlist
- seq_033 must only work from the SMS and email shortlists

## Recommended Strategy

`split_vendor_preferred`

The evidence set shows that one vendor may cover multiple families, but split-vendor posture remains safer because it:

- keeps telephony evidence and urgent-live semantics independent from notification sender/domain concerns
- prevents one commercial platform from becoming hidden lifecycle authority
- makes later exit and per-family swap decisions viable
- keeps email replay-safe callback quality from being diluted by a voice/SMS bundle

## Telephony / IVR
| Vendor | Actual fit | Next task | Why |
| --- | --- | --- | --- |
| Twilio | 80 | seq_032 | Strong public sandbox and recording support, but callback authenticity relies on signature validation plus adapter-side dedupe rather than a first-class replay token. |
| Vonage | 80 | seq_032 | Vonage scores well on signed callbacks, fallback webhooks, DTMF, and recording URLs. It remains slightly behind Twilio on public test-environment depth. |

## SMS
| Vendor | Actual fit | Next task | Why |
| --- | --- | --- | --- |
| Twilio | 79 | seq_033 | High-quality API and callback coverage, but no first-class replay token in the reviewed webhook docs means the adapter must own replay defense. |
| Vonage | 78 | seq_033 | The strongest current SMS-specific callback security story in the reviewed public material; remains shortlisted despite lighter sandbox depth than Twilio. |

## Email
| Vendor | Actual fit | Next task | Why |
| --- | --- | --- | --- |
| Mailgun | 84 | seq_033 | Best fit for authoritative delivery ambiguity, explicit replay defense, EU region control, and project-style subaccount segmentation. |
| Twilio SendGrid | 80 | seq_033 | Strong webhook security and EU subuser posture offset the sandbox limitation that no event webhooks fire during sandbox-mode validation. |

## Handoff Matrix

| Family | Mock provider | Actual shortlist | Handoff |
| --- | --- | --- | --- |
| Telephony / IVR | Vecells Internal Voice Twin | Twilio;Vonage | seq_032 (workspace, number, answer/event/fallback webhooks, recording, and spend gates) |
| SMS | Vecells Internal SMS Rail Twin | Twilio;Vonage | seq_033 (project, sender, webhook, continuation routing, and spend gates) |
| Email | Vecells Internal Email Rail Twin | Mailgun;Twilio SendGrid | seq_033 (project or subuser, sender/domain auth, event webhooks, and spend gates) |
| Combined Suite | Vecells Internal Signal Fabric | none | seq_032_and_seq_033 (combined-suite posture only; telephony and notification tasks stay separately gated) |

## Rejected Or Non-Shortlisted Calls

- `postmark_email` is rejected because the reviewed official webhook guidance exposes custom headers/basic auth but not signed replay-safe callbacks.
- `twilio_sendgrid_suite` and `sinch_mailgun_suite` remain candidates only because combined-suite coupling is still too high for the default posture.
- `vonage_single_suite` is rejected because the reviewed official material does not provide a first-party all-three-family suite.
