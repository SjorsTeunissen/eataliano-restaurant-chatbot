#!/usr/bin/env node

// Claude Code Stop hook — sends a Telegram notification via AIboy API.
//
// Usage: pipe Stop hook JSON into this script:
//   echo '{"last_assistant_message":"Done!"}' | node notify-telegram.js
//
// Configure in ~/.claude/settings.json under hooks.Stop

// ---- EDIT THESE TWO VALUES ----
const API_URL = "https://your-app.vercel.app/api/notify"; // Your deployed AIboy URL
const API_KEY = "your-api-key-here"; // From /register page
// --------------------------------

const https = require("https");
const http = require("http");

function post(url, body) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;

    const req = mod.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, data }));
      }
    );

    req.on("error", () => resolve({ status: 0, data: "request failed" }));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ status: 0, data: "timeout" });
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Read stdin (Claude Code pipes the hook payload)
  let input = "";
  process.stdin.setEncoding("utf8");

  await new Promise((resolve) => {
    process.stdin.on("data", (chunk) => (input += chunk));
    process.stdin.on("end", resolve);
    // If no stdin, resolve after a short timeout
    setTimeout(resolve, 1000);
  });

  let payload = {};
  try {
    payload = JSON.parse(input);
  } catch {
    // No valid JSON input — still send a generic notification
  }

  const lastMessage = payload.last_assistant_message || "";
  const cwd = payload.cwd || "";

  // Build a short summary (first 200 chars of the last message)
  const summary = lastMessage.length > 200
    ? lastMessage.slice(0, 200) + "..."
    : lastMessage || "Task completed.";

  const message = cwd
    ? `📁 ${cwd}\n\n${summary}`
    : summary;

  await post(API_URL, { message });
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(0)); // Always exit 0 — never break Claude Code
