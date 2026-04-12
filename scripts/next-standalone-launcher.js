const fs = require("node:fs");
const path = require("node:path");

const launcherDir = __dirname;
const serverDir = path.join(launcherDir, "server");

process.env.HOSTNAME = "127.0.0.1";
process.env.PORT = process.env.NEXT_SERVER_PORT || "4120";

const logFile = path.join(process.env.CLINIC_DB_PATH ? path.dirname(process.env.CLINIC_DB_PATH) : launcherDir, "next-server-error.log");

const log = (msg) => {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {}
};

const origError = console.error;
console.error = function(...args) {
  log("STDERR: " + args.join(" "));
  origError.apply(console, args);
};

process.on("uncaughtException", (err) => {
  log(`Uncaught Exception: ${err?.stack || err}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log(`Unhandled Rejection: ${reason?.stack || reason}`);
  process.exit(1);
});

try {
  log(`Starting Next.js server on port ${process.env.PORT}...`);
  process.chdir(serverDir);
  require(path.join(serverDir, "server.js"));
  log("Server script required successfully.");
} catch (err) {
  log(`Failed to start server: ${err?.stack || err}`);
  process.exit(1);
}
