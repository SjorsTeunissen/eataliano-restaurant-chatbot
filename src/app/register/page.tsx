"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [chatId, setChatId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError("");
    setApiKey("");

    if (!chatId.trim()) {
      setError("Please enter your Telegram chat ID.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setApiKey(data.apiKey);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const hookConfig = `{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \\"C:/Users/sjors/Documents/AIboy/.claude/hooks/notify-telegram.js\\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="mb-2 text-3xl font-bold">Register</h1>
        <p className="mb-8 text-gray-400">
          Connect your Telegram to receive Claude Code notifications.
        </p>

        {/* Step 1 */}
        <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-2 font-semibold text-blue-400">
            Step 1: Get your chat ID
          </h2>
          <p className="text-sm text-gray-400">
            Open Telegram, find your AIboy bot, and send{" "}
            <code className="rounded bg-gray-800 px-1.5 py-0.5">/start</code>.
            The bot will reply with your chat ID.
          </p>
        </div>

        {/* Step 2 */}
        <div className="mb-6">
          <label
            htmlFor="chatId"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Telegram Chat ID
          </label>
          <div className="flex gap-3">
            <input
              id="chatId"
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              placeholder="e.g. 123456789"
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
            <button
              onClick={handleRegister}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "..." : "Register"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-900/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {apiKey && (
          <div className="space-y-6">
            {/* API Key */}
            <div className="rounded-lg border border-green-800 bg-green-900/20 p-5">
              <h2 className="mb-2 font-semibold text-green-400">
                Registration successful!
              </h2>
              <p className="mb-3 text-sm text-gray-400">
                Your API key (save this — it won&apos;t be shown again):
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-gray-900 px-3 py-2 text-sm text-green-300">
                  {apiKey}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(apiKey)}
                  className="rounded bg-gray-800 px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Hook setup instructions */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
              <h2 className="mb-2 font-semibold text-blue-400">
                Step 3: Configure the Stop hook
              </h2>
              <p className="mb-3 text-sm text-gray-400">
                Open the hook script at{" "}
                <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs">
                  .claude/hooks/notify-telegram.js
                </code>{" "}
                and replace the placeholder values with your API URL and key.
              </p>
              <p className="mb-3 text-sm text-gray-400">
                Then add this to{" "}
                <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs">
                  ~/.claude/settings.json
                </code>
                :
              </p>
              <pre className="overflow-x-auto rounded bg-gray-950 p-3 text-xs text-gray-300">
                {hookConfig}
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
