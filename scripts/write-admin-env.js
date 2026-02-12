const fs = require("fs");
const path = require("path");

const baseUrl =
  (process.env.API_BASE_URL || "").trim() ||
  "http://localhost:3000/api";

const targetDir = path.join(
  __dirname,
  "..",
  "dist",
  "admin",
  "browser"
);
const targetFile = path.join(targetDir, "env.js");

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(
  targetFile,
  `window.__env = { API_BASE_URL: ${JSON.stringify(baseUrl)} };\n`,
  "utf8"
);
