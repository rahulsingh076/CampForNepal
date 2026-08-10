# Role QA

| Role | Expected Result |
| --- | --- |
| `customer` | Optional private dashboard only; public planning still works without login |
| `guide` | Seed/data-contract role only; no self-service portal |
| `admin` | Ordinary operations, content, media, events, customers, and print |
| `super_admin` | Admin work plus users, roles, settings, and protected owner actions |

Manual QA must test direct URLs, not only hidden sidebar links. Backend routes
remain the security boundary.

No role may expose environment secrets, password hashes, CSRF tokens, session
metadata, card/bank/OTP data, or raw private audit metadata.
