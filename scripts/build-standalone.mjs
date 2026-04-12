import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  NEXT_OUTPUT_MODE: "standalone",
};

const result = spawnSync("npm", ["run", "build"], {
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
