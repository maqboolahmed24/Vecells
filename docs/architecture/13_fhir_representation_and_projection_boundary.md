# 13 FHIR Representation And Projection Boundary

        Vecells-first domain truth and FHIR interoperability are separate layers.

        ## One-Way Boundary

        | Boundary | Owner | Write Rule | Read Rule |
| --- | --- | --- | --- |
| Domain aggregates | store_domain_transaction | Command settlements only | Projection workers and governed interoperability mappings only |
| FHIR representations | store_fhir_representation | Published mapping contracts only | Interoperability/export and governed back-office use |
| Browser projections | store_projection_read_models | Projection worker only | Gateway query and live delta only |

        ## Rules

        - Domain aggregates, blockers, settlements, and closure truth live in `store_domain_transaction`.
        - FHIR rows are materialized through published mapping contracts and may be rematerialized from domain events; they do not drive canonical workflow or blocker truth.
        - Projection reads rebuild from canonical event history and published projection contracts, not from raw FHIR rows.
        - Browser routes may never read, join, or infer truth from raw FHIR tables client-side.
        - Any breaking FHIR mapping change requires a new published mapping contract plus replay proof.

        ## Why This Closes The Gap

        This baseline explicitly closes the corpus gap where raw FHIR storage could drift into being treated as primary operational truth. FHIR remains subordinate, one-way, and replayable from the Vecells domain model.
