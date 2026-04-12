# Shipping Builds (GitHub Actions)

This app is configured to ship as desktop installers through GitHub Actions, with no containerization required for end users.

## What gets built

- Windows installer (`.exe`) via NSIS
- macOS installer (`.dmg`)

Workflow files:

- `.github/workflows/windows-build.yml` (main Windows CI)
- `.github/workflows/release-from-windows.yml` (tag-based GitHub Release)

These workflows use Rust target caching and cancel superseded runs on the same branch/tag to reduce build time.

## How to trigger builds

### Manual build

1. Push your code to GitHub.
2. Open **Actions** in your repository.
3. Select **Build Windows Installer**.
4. Click **Run workflow**.

This uploads build outputs as workflow artifacts.

### Release build (tag)

1. Create and push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

2. The release workflow builds the Windows installer on `windows-latest`.
3. A GitHub Release is created automatically and the `.exe` is attached.

## Notes

- Builds happen natively on Windows runner, so the `.exe` is produced where it will run.
- The packaged app launches a bundled Next.js server sidecar automatically.
- No Docker and no terminal steps are needed for your friend.
- Windows build uses WebView2 `offlineInstaller` mode to reduce first-launch failures on machines missing WebView2 or with restricted network.
- Windows packaging embeds a full local Node runtime in app resources (instead of only an executable), preventing immediate crashes from missing Node runtime DLLs.

## Local check (optional)

If you want to verify the packaging flow locally before pushing:

```bash
npm run tauri:prepare
```

This prepares standalone Next assets plus the Node sidecar binary used by Tauri bundling.
