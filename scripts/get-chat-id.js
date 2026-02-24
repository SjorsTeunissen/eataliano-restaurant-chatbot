const { readFileSync } = require("fs");
const { resolve } = require("path");

const envPath = resolve(__dirname, "..", ".env.local");
let token;

try {
  const env = readFileSync(envPath, "utf-8");
  const match = env.match(/^TELEGRAM_BOT_TOKEN=(.+)$/m);
  if (!match) {
    console.error("TELEGRAM_BOT_TOKEN not found in .env.local");
    process.exit(1);
  }
  token = match[1].trim();
} catch {
  console.error("Could not read .env.local — make sure it exists in the project root.");
  process.exit(1);
}

async function main() {
  console.log("Fetching recent messages from Telegram...\n");

  const res = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates`
  );
  const data = await res.json();

  if (!data.ok) {
    console.error("Telegram API error:", data.description);
    process.exit(1);
  }

  if (!data.result || data.result.length === 0) {
    console.log("No messages found.");
    console.log("Send /start (or any message) to your bot on Telegram, then run this script again.");
    return;
  }

  const chats = new Map();
  for (const update of data.result) {
    const msg = update.message || update.channel_post;
    if (!msg?.chat) continue;
    const { id, first_name, last_name, username } = msg.chat;
    if (!chats.has(id)) {
      const name = [first_name, last_name].filter(Boolean).join(" ");
      chats.set(id, { id, name, username });
    }
  }

  if (chats.size === 0) {
    console.log("No chat messages found in recent updates.");
    console.log("Send /start (or any message) to your bot on Telegram, then run this script again.");
    return;
  }

  for (const chat of chats.values()) {
    const label = chat.username ? `${chat.name} (@${chat.username})` : chat.name;
    console.log(`Your chat ID is: ${chat.id} — ${label}`);
  }

  console.log("\nCopy the chat ID above and paste it into the registration page.");
}

main();
