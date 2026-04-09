# 29 NHS App Live Gate And Release Strategy

        The live-later path is intentionally fail-closed. Real EOI, sandpit, AOS, SCAL upload, or release activity must not occur from this repository unless the gates below pass and `ALLOW_REAL_PROVIDER_MUTATION=true` is explicitly set.

        ## Live gates

        | Gate ID | Gate | Status | Summary |
        | --- | --- | --- | --- |
        | LIVE_GATE_PHASE7_SCOPE_WINDOW | Phase 7 approved scope window | blocked | Phase 7 remains a deferred channel expansion and is explicitly not a current-baseline go-live gate. |
| LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD | External readiness chain clear | blocked | Planning and architecture foundation are frozen enough to open external-readiness work, but actual Phase 0 entry remains withheld because the current-baseline external-readiness gate is still blocked by onboarding, assurance, and simulator-freeze dependencies. |
| LIVE_GATE_NHS_LOGIN_READY_ENOUGH | NHS login readiness sufficient for NHS App progression | review_required | Seq_024 and seq_025 provide the onboarding and credential capture strategy, but the real NHS login path is still gated and must not be silently treated as live. |
| LIVE_GATE_PATIENT_ELIGIBILITY_EXPLICIT | Patient-facing eligibility explicit | review_required | The patient-facing route inventory and product categories are mapped, but the real patient-service narrative still needs final sponsor-approved wording. |
| LIVE_GATE_COMMISSIONING_EXPLICIT | Commissioning posture explicit | blocked | Commissioning and procurement framework evidence remain placeholders in the current pack and cannot be fabricated. |
| LIVE_GATE_DEMO_ENVIRONMENT_READY | Demo environment and demo-readiness current | review_required | The rehearsal environment exists now, but the real NHS App team-accessible demo environment, seeded data, and demo checklist sign-off remain later. |
| LIVE_GATE_ACCESSIBILITY_EVIDENCE_READY | Accessibility evidence current | review_required | Accessibility audit planning exists, but a fresh NHS App-aligned WCAG 2.2 audit still needs to be commissioned and signed. |
| LIVE_GATE_DESIGN_READINESS_READY | Design readiness current | review_required | The preview lab proves the design direction and embedded behaviour, but the formal NHS App product guidance review remains later. |
| LIVE_GATE_SERVICE_DESK_READY | Service desk and incident posture current | review_required | Service support guidance and incident rehearsal are modelled, but live public-facing service desk evidence is not yet current. |
| LIVE_GATE_NAMED_APPROVER_PRESENT | Named approver present | blocked | No named approver is stored in repo fixtures or this rehearsal pack. |
| LIVE_GATE_ENVIRONMENT_TARGET_PRESENT | Environment target present | blocked | Real submission must name sandpit, AOS, limited release, or full release as the live target. |
| LIVE_GATE_MUTATION_FLAG_ENABLED | ALLOW_REAL_PROVIDER_MUTATION=true | blocked | Dry-run is the only allowed default. Real mutation remains fail-closed until the explicit environment flag is set. |

        ## Release strategy

        - Limited release and full release stay downstream of SCAL, incident rehearsal, and connection agreement readiness.
        - Monthly data and annual assurance are post-live obligations and remain visible from the start.
        - Any route or journey change later must go back through the integration manager rather than bypassing the staged process.

        ## Automation law

        - Browser automation may rehearse dossier completion and gate review now.
        - Real submission remains blocked unless the explicit mutation flag, named approver, and target environment are all present.
        - The dry-run harness must stop before any final-submit action.
