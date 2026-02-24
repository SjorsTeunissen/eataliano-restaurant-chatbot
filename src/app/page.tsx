import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          AI<span className="text-blue-400">boy</span>
        </h1>
        <p className="mb-2 text-xl text-gray-300">
          Telegram notifications for Claude Code.
        </p>
        <p className="mb-8 text-gray-400">
          Stop watching the terminal. Get a ping on your phone when Claude Code
          finishes a task.
        </p>

        <div className="mb-12 rounded-lg border border-gray-800 bg-gray-900 p-6 text-left font-mono text-sm text-gray-300">
          <p className="text-gray-500"># How it works</p>
          <p>
            Claude Code finishes{" "}
            <span className="text-yellow-400">&rarr;</span> Stop hook fires{" "}
            <span className="text-yellow-400">&rarr;</span> Calls AIboy API{" "}
            <span className="text-yellow-400">&rarr;</span>{" "}
            <span className="text-blue-400">Telegram message sent</span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/sjorsdonkers/AIboy"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-700 px-8 py-3 font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
          >
            GitHub
          </a>
        </div>

        <div className="mt-16 grid gap-6 text-left sm:grid-cols-3">
          <div className="rounded-lg border border-gray-800 p-5">
            <h3 className="mb-2 font-semibold text-blue-400">1. Create bot</h3>
            <p className="text-sm text-gray-400">
              Message @BotFather on Telegram and create a new bot. Takes 30
              seconds.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 p-5">
            <h3 className="mb-2 font-semibold text-blue-400">2. Register</h3>
            <p className="text-sm text-gray-400">
              Send /start to your bot, copy your chat ID, and register here to
              get an API key.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 p-5">
            <h3 className="mb-2 font-semibold text-blue-400">3. Hook it up</h3>
            <p className="text-sm text-gray-400">
              Add the Stop hook to Claude Code settings. Done — notifications
              flow to your phone.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
