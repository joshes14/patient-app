# Shipping Builds (GitHub Actions)

This app is configured to ship as desktop installers through GitHub Actions, with no containerization required for end users.

## What gets built

- Windows installer (`.exe`) via NSIS
- macOS installer (`.dmg`)

Workflow file: `.github/workflows/tauri-build.yml`

## How to trigger builds

### Manual build

1. Push your code to GitHub.
2. Open **Actions** in your repository.
3. Select **Build Tauri Installers**.
4. Click **Run workflow**.

This uploads build outputs as workflow artifacts.

### Release build (tag)

1. Create and push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

2. The workflow builds installers on Windows and macOS.
3. A GitHub Release is created automatically and files are attached.

## Notes

- Builds happen natively on each OS runner, so Windows `.exe` is produced on Windows CI.
- The packaged app launches a bundled Next.js server sidecar automatically.
- No Docker and no terminal steps are needed for your friend.
- macOS packaging includes an additional re-sign + DMG repack step to avoid the "app is damaged" false-positive on unsigned local bundles.
- Windows build now uses WebView2 `offlineInstaller` mode to reduce first-launch failures on machines missing WebView2 or with restricted network.
- Windows packaging now embeds a full local Node runtime in app resources (instead of only an executable), preventing immediate crashes from missing Node runtime DLLs.

## Local check (optional)

If you want to verify the packaging flow locally before pushing:

```bash
npm run tauri:prepare
```

This prepares standalone Next assets plus the Node sidecar binary used by Tauri bundling.
