# Change History

Notable HireFlow changes maintained by ARQYON Tech. The filename CHANGLOG.md follows the project owner’s requested naming. Entries describe source changes, not deployed releases.

## Unreleased

### Added

- Company-branded root documentation, proprietary license, contribution guidance, and security policy.
- Root Git ignore rules for both applications, including .vscode and local environment files.
- Redesigned homepage, theme toggle, responsive navigation, and shared visual styling.
- Animated loading blocks, request progress, and pending-action controls.
- Job description and proposal editors with formatting, preview, undo/redo, and character counts.
- Formatted descriptions and proposals in job/application views.
- A Currently working here experience option that saves a null end date and displays Present.
- Focused tests for formatting, safe rendering, character limits, summaries, and current-role end dates.

### Changed

- Sign-out performs a full navigation to the login page after account-cache cleanup.
- Independent profile refreshes run concurrently.
- Saved job changes update cached details and invalidate job lists.
- Application changes refresh relevant history and list data.
- Failed job-editor loads show an error rather than an indefinite loading state.
- Server and client ignore rules are consolidated at the root; source tests remain trackable.

### Existing foundation

- Cookie-based account authentication and recovery flows.
- Profiles, visibility controls, skills, experience, and projects.
- Job publishing, applications, status management, and application history.

### Not yet delivered

- Editing proposals after submission.
- A complete reproducible database provisioning bundle.
- Verified production deployment, full authenticated browser coverage, and a formal release/support policy.
