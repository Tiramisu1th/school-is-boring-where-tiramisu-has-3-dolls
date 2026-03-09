# 9 March 2026
## Picking Up
- Migrated the frontend to a TypeScript + Next.js project (`frontend/`) and added placeholder pages for `avalon`, `show-hand`, and `werewolf`.
- Created a robust packaging workflow: `build_for_cpanel.ps1` now builds the frontend, exports a static site to `frontend/out`, and produces a clean `deploy/` folder (and optional `deploy.zip`) ready for cPanel upload.
- Fixed script errors (PowerShell here-string and brace issues), added safety checks, and ensured the script cleans previous deploys before copying.
- Added `.gitignore` entries to avoid committing build artifacts (`.next`, `frontend/out`, `deploy`, `node_modules`) and added README.md with clear build/deploy steps.
- Kept the original `/website` folder untouched as requested and migrated deployment to a new root-based workflow.