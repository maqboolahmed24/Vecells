# 406 External Reference Notes

Current date reviewed: 2026-04-27.

The local blueprint and 404/405 contracts remain the source of truth. Official references were used only to sharpen audit, local evidence, assurance, and governance posture.

## Official References Reviewed

- NHS England, guidance on AI-enabled ambient scribing products in health and care settings: `https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/`
- NHS Transformation Directorate, IG guidance for using AI-enabled ambient scribing products: `https://transform.england.nhs.uk/information-governance/guidance/using-ai-enabled-ambient-scribing-products-in-health-and-care-settings/`
- NHS England Digital, IM1 Pairing integration and AI deployment guidance: `https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration`
- NHS England Digital, Assurance process for APIs and services: `https://digital.nhs.uk/developer/assurance/process-for-apis-and-services`
- NHS England Digital, How to get assured: `https://digital.nhs.uk/developer/assurance`
- NHS England Digital, Clinical risk management standards: `https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards`

## Borrowed Into 406

- Ambient-scribing guidance says deploying organisations need ongoing quality assurance and monitoring data collected independently from the manufacturer. 406 implements local shadow capture, deterministic replay, labels, adjudication, and summary export evidence rather than relying on supplier claims.
- Ambient-scribing guidance highlights accuracy, omissions, contextual errors, and bias monitoring. 406 represents those as replay metrics inputs, error taxonomy records, adjudication routing, and protected gold evaluation.
- The IG guidance says users remain responsible for accuracy and outputs should be reviewed before record inclusion. 406 keeps labels/adjudication human-authored and does not let replay mutate patient records.
- IM1 guidance says IM1 pairing reviews whole product documentation but does not provide AI-specific technical assurance for models, algorithms, or AI risks; deploying organisations remain responsible for local AI technical assurance. 406 therefore creates a local evaluation corpus, replay harness, and export evidence for later release and safety gates.
- NHS developer assurance guidance says NHS API/service assurance covers regulations, security, clinical safety, technical standards, and information governance before go-live. 406 binds evaluation routes and exports to surface, runtime, disclosure, and audit posture so later approval artifacts are traceable.
- Clinical safety standards guidance treats DCB0129 and DCB0160 as mandatory clinical risk management standards. 406 keeps high/critical findings routed to adjudication and makes audit records available for later safety-case evidence.

## Rejected Or Kept Out Of Scope

- Supplier post-market surveillance evidence was not treated as sufficient for rollout. 406 only stores local evidence refs and summary artifacts; supplier evidence can be linked later by 405/410 release controls.
- Patient-facing ambient-scribe consent and transparency UI wording was not implemented here. Task 406 owns backend evaluation, not visible workspace or patient communication surfaces.
- IM1 pairing documentation was not treated as AI model approval. The replay harness and local labels remain required before any visible assistive rollout.
- Medical-device classification decisions were not embedded in replay code. Task 405 owns regulatory change-control and medical-purpose boundaries; 406 provides evaluation evidence consumed by those gates.
