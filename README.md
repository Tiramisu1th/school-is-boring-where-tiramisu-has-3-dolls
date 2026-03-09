# school-is-boring-where-tiramisu-has-3-dolls

Small project that hosts a collection of minigames and a small frontend. This README explains how to build the frontend, produce a single deployable folder for cPanel, and what files you should upload.

**Quick overview**
- Source frontend: `frontend/` (Next.js + TypeScript pages)
- Build output (canonical): `frontend/out/`
- Deploy target produced by the helper script: `deploy/` (or `deploy.zip`)

**Prerequisites (local)**
- Node.js and npm available for the frontend build
- PowerShell (Windows) to run `build_for_cpanel.ps1`
- (Optional) Python if you run any Python services locally

**Build & produce deploy package (recommended)**
1. From project root, build and export the static site:

```powershell
cd frontend
npm install
npm run build
npm run export
cd ..
```

2. Run the packaging script to create a clean `deploy/` folder (and optional ZIP):

```powershell
# create deploy/ only
.\build_for_cpanel.ps1

# create deploy/ and deploy.zip ready to upload
.\build_for_cpanel.ps1 -CreateZip
```

3. Upload the contents of `deploy/` (or upload `deploy.zip` and extract in cPanel `public_html`) to your cPanel `public_html` (use File Manager or FTP).

**What to upload (exactly)**
- `index.html` and any other `.html` pages exported
- `_next/` directory (Next.js static bundles)
- `static` or `assets` if present
- `.htaccess` (the script writes a rewrite file to enable SPA routing)

Do NOT upload the following to public_html:
- `node_modules/`, `frontend/` source, `.next/`, or other development files. Keep them in your repo only.

**If you want server-mode Next.js (Node) instead of static export**
- Use cPanel "Setup Node.js App" and point Application root to `frontend/` and startup file to `server.js` (if you use one). The host will `npm install` and run your Node process. If you do that, you DO NOT upload `deploy/`; instead deploy the app via the Node app UI and ensure `package.json` lists start script.

**Environment & backend notes**
- If your site calls backend APIs, host those APIs separately (Flask or Node). Static exports cannot run server-side API routes. Update the frontend API base URL (`INTERNAL_API_BASE`) at build time or configure the deployed frontend to call the correct endpoint.

**Cleaning and git**
- Generated folders are ignored via `.gitignore`: `deploy/`, `frontend/out`, `.next`, `node_modules`
- If you need to remove an old deploy, delete `deploy/` and recreate by running the script again.

If you want, I can add a short `DEPLOY.md` with step-by-step screenshots for uploading to cPanel or modify the packaging script to upload directly via FTP. Which would you prefer?
