const fs = require("node:fs");
const path = require("node:path");

const launcherDir = __dirname;
const serverDir = path.join(launcherDir, "server");

// Standardize server host and port
process.env.HOSTNAME = "127.0.0.1";
process.env.PORT = process.env.NEXT_SERVER_PORT || "4120";

const logFile = path.join(process.env.CLINIC_DB_PATH ? path.dirname(process.env.CLINIC_DB_PATH) : launcherDir, "next-server-error.log");

// Redirect stdout and stderr to catch any startup errors directly in the launcher process
const logStream = fs.createWriteStream(logFile, { flags: "a" });
process.stdout.write = logStream.write.bind(logStream);
process.stderr.write = logStream.write.bind(logStream);

process.on("uncaughtException", (err) => {
  fs.appendFileSync(logFile, `Uncaught Exception: ${err.stack || err}\n`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  fs.appendFileSync(logFile, `Unhandled Rejection: ${reason}\n`);
  process.exit(1);
});

try {
  // Set working directory to the server dir as expected by Next.js standalone
  process.chdir(serverDir);
  
  // Directly require and run the server in this process to prevent orphaned child processes
  require(path.join(serverDir, "server.js"));
} catch (err) {
  fs.appendFileSync(logFile, `Failed to start server: ${err.stack || err}\n`);
  process.exit(1);
}
