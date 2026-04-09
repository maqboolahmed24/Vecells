# 30 Assetlinks And AASA Generation Spec

        The generator produces three aligned artifacts:
        1. a path allowlist matrix
        2. Android `assetlinks.json` placeholders
        3. iOS `apple-app-site-association` placeholders

        Android and iOS do not encode path rules identically. Android App Links remain domain-level in the hosted JSON, so Vecells keeps the path allowlist as a separate first-class contract. iOS Associated Domains require explicit path entries, so the same allowlist is expanded into the generated AASA preview.

        ## Environment matrix

        | Environment | Stage | Domain | Android package | iOS appID | Cache-Control |
| --- | --- | --- | --- | --- | --- |
| Local mock | rehearsal_only | links.local.vecells.test | __NHS_APP_ANDROID_PACKAGE_LOCAL_MOCK__ | __NHS_APP_IOS_APP_ID_LOCAL_MOCK__ | public, max-age=60, must-revalidate |
| Sandpit-like | sandpit | links-sandpit.vecells.example | __NHS_APP_ANDROID_PACKAGE_SANDPIT__ | __NHS_APP_IOS_APP_ID_SANDPIT__ | public, max-age=300, must-revalidate |
| AOS-like | aos | links-aos.vecells.example | __NHS_APP_ANDROID_PACKAGE_AOS__ | __NHS_APP_IOS_APP_ID_AOS__ | public, max-age=300, must-revalidate |
| Live placeholder | live | links.vecells.example | __NHS_APP_ANDROID_PACKAGE_LIVE__ | __NHS_APP_IOS_APP_ID_LIVE__ | public, max-age=600, must-revalidate |

        ## Template rules

        - `assetlinks.template.json` carries placeholder Android package and certificate values only.
        - `apple-app-site-association.template.json` carries placeholder iOS appID plus a generated path-list token.
        - environment-specific package names, fingerprints, and appIDs stay placeholder-only until the NHS App team supplies them.
        - approved and conditional route rows may contribute to generated iOS paths; rejected rows never do.

        ## Default generated iOS path allowlist for rehearsal

        | Path |
| --- |
| /appointments |
| /appointments/* |
| /bookings/* |
| /contact-repair/* |
| /messages/* |
| /records/documents/* |
| /records/results/* |
| /recovery/* |
| /requests |
| /requests/* |
| /start-request |

        ## Generator guardrails

        - no wildcard host registration is generated
        - no PHI-bearing query parameters appear in generated paths
        - raw byte or mutation-only URLs are rejected rather than widened into the allowlist
        - local rehearsal files and infra templates are generated from the same underlying data model
