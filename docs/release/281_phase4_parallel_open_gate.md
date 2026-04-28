# 281 Phase 4 Parallel Open Gate

        ## Verdict

        - gate status: `open_first_wave_with_explicit_blockers`
        - ready now: `par_282, par_283`
        - blocked now: `18`
        - deferred now: `9`

        This is not a symbolic launch. Only `282` and `283` are approved to mutate new production code surfaces immediately.

        ## Ready now

        | Track | Title | Launch packet |
| --- | --- | --- |
| par_282 | Executable BookingCase kernel and durable intent lineage | /Users/test/Code/V/data/launchpacks/281_track_launch_packet_282.json |
| par_283 | Executable capability matrix compiler and tuple resolution engine | /Users/test/Code/V/data/launchpacks/281_track_launch_packet_283.json |

        ## Blocked

        | Track | Title | Exact blocker |
| --- | --- | --- |
| par_284 | Slot search, normalization, and availability snapshot pipeline | Needs executable BookingCase and capability-query surfaces before snapshot production is lawful. |
| par_285 | Slot scoring, offer orchestration, and selection rules | Needs 284 snapshot production and freshness law. |
| par_286 | Reservation authority, soft hold, and real hold flows | Needs offer-session ownership and ranking proof from 285. |
| par_287 | Commit path, revalidation, appointment record, and compensation logic | Needs reservation authority and truthful hold inputs from 286. |
| par_288 | Appointment management cancel, reschedule, and detail update commands | Needs booked appointment truth from 287 and capability projection from 283. |
| par_289 | Reminder scheduler and notification settlement | Needs appointment truth and manage mutation settlement. |
| par_290 | Smart waitlist, transactional autofill, and deadline logic | Needs reservation and commit truth before autofill and fallback obligations are legal. |
| par_291 | Staff-assisted booking exception queue and handoff panel API | Needs waitlist/fallback truth and commit/manage exception inputs. |
| par_292 | Booking reconciliation and external confirmation dispute worker | Needs commit outputs, exception signals, and fallback branches before reconciliation can converge truth. |
| par_293 | Patient appointment scheduling workspace | Needs executable backend booking truth from 282 to 292. |
| par_294 | Slot search results and freshness states | Needs patient workspace shell and backend snapshot truth. |
| par_295 | Offer selection flow with truthful hold posture | Needs 286 reservation truth on top of 294 search results. |
| par_296 | Confirmation pending, disputed, and recovery states | Needs commit and reconciliation truth. |
| par_297 | Appointment detail, cancel, reschedule, and reminder views | Needs 288 and 289 backend manage/reminder implementation plus 296 confirmation recovery. |
| par_298 | Waitlist enrolment, management, and offer acceptance views | Needs 290 waitlist runtime and 297 manage/detail continuity. |
| par_299 | Staff booking handoff panel and assisted booking views | Needs backend assisted-booking and waitlist truth before staff UI can be honest. |
| par_300 | Record-origin continuation and booking entry surfaces | Needs 293, 297, and 299 to land core entry surfaces first. |
| par_301 | Patient action recovery envelopes for booking failures | Needs 296, 298, and 300 before recovery envelopes can be coherent. |

        ## Deferred

        | Track | Title | Deferral reason |
| --- | --- | --- |
| par_302 | Mobile responsive booking and manage flows | Deferred until the core desktop booking and recovery routes are implemented and stable enough to harden responsively. |
| par_303 | Accessibility and artifact parity for booking documents | Deferred until appointment detail, recovery envelopes, and core artifact generation exist. |
| seq_304 | Configure provider sandboxes and callback endpoints | Deferred because 277 and 281 explicitly keep live-provider activation outside the first local-booking implementation wave. |
| seq_305 | Capture provider capability evidence and test credentials | Deferred because provider evidence cannot exist before live sandbox onboarding and remains outside the first local-booking wave. |
| seq_306 | Integrate local booking with triage, portal, and notification workflows | Deferred because integration should consume stable runtime and provider evidence rather than shaping the first local implementation wave. |
| seq_307 | Capability matrix, slot snapshot, hold, commit, and compensation suites | Deferred until the backend runtime path and integration path exist; assurance cannot lead implementation here. |
| seq_308 | Manage, waitlist, assisted booking, and reconciliation suites | Deferred until the later backend and frontend tracks land. |
| seq_309 | Patient and staff booking end-to-end, accessibility, and load suites | Deferred until the end-to-end runtime and UI surface exists. |
| seq_310 | Phase 4 exit gate approve booking engine completion | Deferred because exit approval follows all implementation, provider, integration, and assurance work. |

        ## First-wave merge criteria

        ### `par_282`

        - Schema fields and state vocabulary must remain byte-compatible with 278.
- Migrations must preserve replayable BookingIntent lineage and append-only transition audit.
- Event emission must use the 281 owner remap and never emit slot, offer, reminder, waitlist, or reconciliation events from 282.
- Stale decision epoch, stale request lease, and identity-repair freeze tests must fail closed.
- Telemetry and audit output must remain PHI-safe on case transition surfaces.

        ### `par_283`

        - Schema fields, capability states, and tuple hash inputs must remain byte-compatible with 279.
- Binding compilation must name exactly one current adapter profile, degradation profile, and confirmation gate policy.
- Capability tuple supersession must invalidate stale resolutions without widening patient action scope.
- Blocked reasons and fallback actions must remain machine-readable for downstream UI and support tracks.
- Telemetry and diagnostics must stay PHI-safe and reason-code based.

        ## Launch rule

        Future prompts must consume the launch packets and the owner matrix published here.
        They must not rediscover or renegotiate ownership informally.
