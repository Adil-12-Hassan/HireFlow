# Security Policy

HireFlow by ARQYON Tech handles account, professional profile, and hiring information. Security issues must be reported privately.

## Reporting a vulnerability

If the GitHub repository provides **Security → Report a vulnerability**, use that private reporting channel. Otherwise, contact the ARQYON Tech repository owner through an existing, verified private company channel and request a secure reporting route.

A dedicated security mailbox and response service level have not been published in this repository. Do not guess an address, post exploit details in a public issue, or expose personal information while seeking contact. ARQYON Tech should publish and verify a reporting channel before public launch.

Include:

- Affected commit or version and environment.
- A concise description, prerequisites, and potential impact.
- Minimal reproduction steps using accounts and data you control.
- Redacted evidence and any suggested mitigation.

Do not include passwords, session cookies, API keys, or unredacted applicant records. Do not test against production without authorization, access other people’s data, or perform destructive or disruptive testing.

## Support status

The project is under active development. No released-version support matrix or guaranteed remediation timeline is currently declared. Reports should identify the exact affected commit. Maintainers should coordinate acknowledgement, investigation, remediation, regression testing, and disclosure privately.

## Security expectations

- Enforce authorization and privacy on every protected resource at the API boundary.
- Keep authentication credentials in HTTP-only cookies; validate production cookie settings and HTTPS behavior.
- Preserve request validation, origin checks, rate limits, and safe error responses.
- Treat the Supabase service-role credential as server-only privileged access.
- Keep environment files, local databases, keys, and sensitive logs out of source control.
- Review dependencies and preserve their lockfiles.
- Test applicant/owner isolation, private profiles, draft/closed job access, and status-history access.
- Record operational failures without logging credentials or applicant content.

These expectations are not a claim of a completed security audit.

## Suspected credential exposure

Notify the project owner privately. Revoke or rotate the exposed credential through the owning service, assess affected access, and coordinate any repository-history cleanup. Deleting a file or adding it to .gitignore does not remove an already committed secret or revoke it.

## Before production

Assign incident-response ownership, establish private reporting, test backup restoration, validate retention/access policies, and document rollback procedures. Review actual deployment proxy, origin, cookie, and secret configuration rather than relying on local defaults.
