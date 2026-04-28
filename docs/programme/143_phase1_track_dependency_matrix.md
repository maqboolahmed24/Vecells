# 143 Phase 1 Track Dependency Matrix

        This matrix is the exact dependency graph for `par_144` through `par_163`. It is the merge and coordination source of truth for the Phase 1 parallel block.

        | Task | Family | Track | Depends On | Owned Seams | Merge Gates |
| --- | --- | --- | --- | --- | --- |
| par_144 | Backend Foundation | Draft session lease and autosave API | None | SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE | MG_143_BACKEND_CONTRACT, MG_143_RUNTIME_PUBLICATION |
| par_145 | Backend Foundation | Submission envelope validation and required-field rules | par_144 | SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE | MG_143_BACKEND_CONTRACT, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_146 | Backend Foundation | Attachment upload, scan, quarantine, and document reference pipeline | par_144 | SEAM_143_ATTACHMENT_UPLOAD_AND_SCAN_SETTLEMENT | MG_143_BACKEND_CONTRACT, MG_143_RUNTIME_PUBLICATION, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_147 | Backend Foundation | Contact preference capture and masked storage | par_144 | SEAM_143_CONTACT_PREFERENCE_AND_MASKED_ROUTE | MG_143_BACKEND_CONTRACT, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_148 | Backend Foundation | Submission snapshot freeze and promotion transaction | par_144, par_145, par_146, par_147 | SEAM_143_PROMOTION_TRANSACTION_AND_SETTLEMENT_CHAIN | MG_143_BACKEND_CONTRACT, MG_143_RUNTIME_PUBLICATION, MG_143_PATIENT_SHELL_INTEGRATION |
| par_149 | Backend Foundation | Free-text normalization into canonical request shape | par_145, par_146, par_148 | SEAM_143_NORMALIZATION_RESULT_AND_CANONICAL_REQUEST_SHAPE | MG_143_BACKEND_CONTRACT |
| par_150 | Backend Outcome | Rule-based synchronous safety engine | par_145, par_148, par_149 | SEAM_143_SAFETY_DECISION_AND_PREEMPTION_CHAIN | MG_143_BACKEND_CONTRACT, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_151 | Backend Outcome | Urgent-diversion settlement and receipt grammar | par_148, par_149, par_150 | SEAM_143_OUTCOME_ARTIFACT_AND_URGENT_SETTLEMENT | MG_143_BACKEND_CONTRACT, MG_143_RUNTIME_PUBLICATION, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_152 | Backend Outcome | Triage task creation, ETA engine, and minimal status tracking | par_148, par_149, par_150, par_151 | SEAM_143_TRIAGE_STATUS_AND_ETA_PROJECTION | MG_143_BACKEND_CONTRACT, MG_143_RUNTIME_PUBLICATION, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_153 | Backend Outcome | Confirmation notification dispatch and observability | par_147, par_151, par_152 | SEAM_143_NOTIFICATION_PAYLOAD_AND_DISPATCH_EVIDENCE | MG_143_RUNTIME_PUBLICATION, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_154 | Backend Outcome | Promoted-draft token supersession and resume blocking | par_144, par_148 | SEAM_143_SUPERSESSION_AND_RESUME_BLOCKING | MG_143_BACKEND_CONTRACT, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_155 | Frontend Capture | Patient intake mission frame | None | SEAM_143_PATIENT_SHELL_ROUTE_AND_STATE_ADAPTERS | MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_156 | Frontend Capture | Request-type selection and progressive question flow | par_145, par_155 | Consumes only | MG_143_BACKEND_CONTRACT, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_157 | Frontend Capture | Quiet autosave status strip and resume states | par_144, par_154, par_155 | Consumes only | MG_143_BACKEND_CONTRACT, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_158 | Frontend Capture | File upload evidence states and error recovery | par_146, par_155 | Consumes only | MG_143_RUNTIME_PUBLICATION, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_159 | Frontend Capture | Contact preference editor and confirmation copy | par_147, par_153, par_155 | Consumes only | MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_160 | Frontend Outcome | Same-shell urgent diversion surface | par_150, par_151, par_155 | Consumes only | MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_161 | Frontend Outcome | Same-shell receipt and ETA surface | par_151, par_152, par_153, par_155, par_159 | Consumes only | MG_143_RUNTIME_PUBLICATION, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_162 | Frontend Outcome | Minimal track-my-request page | par_152, par_161 | Consumes only | MG_143_RUNTIME_PUBLICATION, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |
| par_163 | Frontend Outcome | Sign-in uplift, refresh, and resume postures | par_154, par_155, par_157, par_160, par_162 | Consumes only | MG_143_RUNTIME_PUBLICATION, MG_143_PATIENT_SHELL_INTEGRATION, MG_143_TEST_ACCESSIBILITY |

        ## Family Counts

        - `backend_foundation`: Backend Foundation = 6 tracks
- `backend_outcome`: Backend Outcome = 5 tracks
- `frontend_capture`: Frontend Capture = 5 tracks
- `frontend_outcome`: Frontend Outcome = 4 tracks
