import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(process.cwd());
const macBundleDir = join(root, "src-tauri", "target", "release", "bundle", "macos");
const dmgBundleDir = join(root, "src-tauri", "target", "release", "bundle", "dmg");

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (!existsSync(macBundleDir)) {
  throw new Error(`macOS bundle directory not found at ${macBundleDir}`);
}

const appName = readdirSync(macBundleDir).find((name) => name.endsWith(".app"));
if (!appName) {
  throw new Error(`No .app bundle found in ${macBundleDir}`);
}

const appPath = join(macBundleDir, appName);
const volumeName = appName.replace(/\.app$/, "");

mkdirSync(dmgBundleDir, { recursive: true });
const dmgPath = join(dmgBundleDir, `${volumeName}.dmg`);
rmSync(dmgPath, { force: true });

run("codesign", ["--force", "--deep", "--sign", "-", appPath]);
run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);
run("hdiutil", ["create", "-volname", volumeName, "-srcfolder", appPath, "-ov", "-format", "UDZO", dmgPath]);

console.log(`Repacked DMG at ${dmgPath}`);
