import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/telegram";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { first_name?: string };
  };
}

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(update.message.chat.id);
    const text = update.message.text.trim();
    const name = update.message.from?.first_name ?? "there";

    if (text === "/start") {
      await sendMessage(
        chatId,
        `Hey ${name}! 👋\n\nYour chat ID is:\n\`${chatId}\`\n\nCopy this and paste it on the AIboy registration page to connect your notifications.`
      );
    } else {
      await sendMessage(
        chatId,
        `Your chat ID is: \`${chatId}\`\n\nUse this on the AIboy website to register.`
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
