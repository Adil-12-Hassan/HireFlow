# Contributing to HireFlow

HireFlow is proprietary software developed for ARQYON Tech. Contributions require authorization from the project owner and must comply with the applicable contributor or employment agreement. This document does not grant a license or replace that agreement.

## Workflow

1. Agree on a concrete problem and acceptance criteria with the maintainer.
2. Create a focused branch, such as `feat/proposal-editor` or `fix/session-refresh`.
3. Follow the root README to configure a development environment. Use synthetic test fixtures, not production personal data.
4. Keep changes scoped and preserve existing user work. Update documentation and CHANGLOG.md when behavior changes.
5. Run relevant checks and submit a pull request with evidence.

Do not push directly to a release branch, deploy, or modify shared infrastructure without the project owner’s authorization. These are workflow expectations; repository enforcement must be configured separately.

## Engineering expectations

- Keep TypeScript strict. Avoid `any` casts that conceal errors.
- Preserve API contracts and Zod validation unless a contract change is explicitly agreed.
- Derive the acting user from verified authentication; enforce resource ownership on the server.
- Preserve cookie-based authentication. Never store access or refresh credentials in browser storage.
- Use the shared Axios client and TanStack Query cache; invalidate affected data after mutations.
- Provide loading, empty, error, success, and disabled-action states.
- Support keyboard navigation, meaningful labels, responsive layouts, and reduced motion.
- Render user content safely. Do not execute raw submitted HTML.
- Keep secrets and personal data out of commits, logs, screenshots, fixtures, and issue reports.
- Keep package-lock.json files committed and explain dependency changes.
- Database changes need reviewed, reproducible migrations and rollback considerations. Never modify production data as part of a local check.

## Required validation

From server/: `npm run typecheck`, `npm test`, and `npm run build` for server changes.

From client/: `npm run typecheck`, `node --test tests/editor.test.mjs`, and `npm run build` for client changes. Run client lint when relevant and distinguish pre-existing failures from regressions.

Add meaningful tests for changed behavior. For user-facing changes, check signed-out, applicant, and owner flows as applicable, keyboard access, both themes, and mobile/desktop layouts. State checks you could not perform; never substitute a successful build for a browser or database test.

## Pull request checklist

- Explain the problem and resulting behavior.
- List API, configuration, dependency, and database changes.
- Include exact verification commands and outcomes.
- Include screenshots for visual changes without sensitive data.
- Identify compatibility risks, deployment steps, and rollback needs.
- Link the relevant task and obtain maintainer review.

Report security vulnerabilities privately using SECURITY.md, not a public issue or pull request.
