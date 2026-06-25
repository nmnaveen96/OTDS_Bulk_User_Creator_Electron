# OTDS Bulk User Creator — Electron Desktop Build

This desktop version avoids browser CORS because OTDS HTTP calls are made from the Electron main process, not from browser JavaScript.

## What is included

- `index.html` — desktop UI
- `main.js` — Electron main process and OTDS HTTP bridge
- `preload.js` — secure IPC bridge
- `package.json` — run/build scripts

## Prerequisites on the build machine

Install Node.js LTS from your approved software source.

## Run without packaging

```powershell
npm install
npm start
```

## Build a Windows executable

Portable EXE:

```powershell
npm install
npm run build:win
```

Installer EXE:

```powershell
npm install
npm run build:win-exe
```

Output will be under the `dist` folder.

## Recommended OTDS URL values

If OTDS is hosted at:

```text
https://your-otds-host:8443
```

Use:

```text
OTDS REST Base URL: https://your-otds-host:8443/otdsws/rest
Token URL: https://your-otds-host:8443/otdsws/oauth2/token
```

## Important security notes

- This tool stores passwords only in memory while the app is running.
- Use **Dry Run** first.
- The **Allow self-signed / untrusted TLS** option is for approved internal testing only. Prefer fixing certificate trust instead.
- Package and run this tool only on authorised admin workstations.
- Validate the exact OTDS `/users` payload required by your OTDS version before using in production.
