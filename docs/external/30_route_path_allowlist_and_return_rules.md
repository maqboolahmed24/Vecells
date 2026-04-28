# 30 Route Path Allowlist And Return Rules

        Every candidate site-link path is assessed as a route-family contract. This matrix is the safe surface the later Android and iOS registration must inherit.

        | Decision | Route family | Path pattern | Embedded safe | Requires auth | Requires outbound grant | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| approved | rf_intake_self_service | /start-request | yes | no | no | Derived stable entry path for the rehearsal studio; no patient-specific data belongs in the URL. |
| approved | rf_patient_secure_link_recovery | /recovery/:recoveryToken | conditional | no | no | The token is a grant envelope and must not be logged, copied into analytics, or treated as route truth on its own. |
| approved | rf_patient_requests | /requests | yes | yes | no | This is a safe summary path, not a detached action URL. |
| approved | rf_patient_requests | /requests/:requestId | yes | yes | no | Raw request identifiers remain placeholders in the mock and must never carry PHI-bearing query fragments. |
| conditional | rf_patient_requests | /requests/:requestId/conversation | conditional | yes | no | The site link may land on the owning request shell, but live reply posture still depends on the current cycle-specific projection. |
| approved | rf_patient_appointments | /appointments | yes | yes | no | This is the calm summary path for booking and manage work. |
| approved | rf_patient_appointments | /appointments/:appointmentId/manage | conditional | yes | yes | Calendar or browser-handoff actions stay secondary and require the current embedded capability and return-safe grant. |
| conditional | rf_patient_appointments | /bookings/:bookingCaseId/select | conditional | yes | no | This placeholder path covers waitlist-offer and hub-alternative review without claiming a final mobile path taxonomy is already frozen. |
| conditional | rf_patient_appointments | /bookings/:bookingCaseId/confirm | conditional | yes | no | Confirmation remains inside the same shell and must not become an action-only deep link. |
| conditional | rf_patient_health_record | /records/results/:resultId | conditional | yes | yes | The linked route is safe; any later document handoff still needs artifact-mode truth and an outbound grant. |
| conditional | rf_patient_health_record | /records/documents/:documentId | conditional | yes | yes | Structured same-shell summary is the default; raw file or print exits remain secondary and governed. |
| approved | rf_patient_messages | /messages/:clusterId | yes | yes | no | Cluster-level entry preserves the owning conversation shell. |
| conditional | rf_patient_messages | /messages/:clusterId/thread/:threadId | conditional | yes | no | The route may be linked, but return-safe resolution still belongs to the same cluster shell. |
| conditional | rf_patient_messages | /messages/:clusterId/callback/:callbackCaseId | conditional | yes | no | Callback posture may still downgrade to repair or recovery inside the same shell. |
| conditional | rf_patient_messages | /contact-repair/:repairCaseId | conditional | yes | no | Reachability repair stays in-shell and must not break the blocked offer or callback context. |
| rejected | rf_patient_health_record | /records/documents/:documentId/download | no | yes | yes | Rejected: raw artifact URLs and detached export routes are forbidden; patients must land in the record shell first. |
| rejected | rf_patient_messages | /messages/:threadId | no | yes | no | Rejected: aliases must resolve into the owning cluster shell rather than exposing a second detached message entry contract. |
| rejected | rf_patient_appointments | /bookings/:bookingCaseId/accept | no | yes | no | Rejected: direct action URLs would overexpose live mutation and bypass the governed booking shell. |

        ## Return-safe rules

        - any route that lands inside a patient shell must preserve the owning `PatientNavReturnContract`
        - artifact-capable routes may be linked, but raw file, print, or detached export endpoints remain rejected
        - secure-link continuation remains a recovery route, not a second identity or route-authority model
        - `from=nhsApp` remains a styling and traffic-recognition hint only, never trust proof
