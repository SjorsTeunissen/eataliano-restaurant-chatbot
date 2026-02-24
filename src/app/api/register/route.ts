import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const { chatId } = await req.json();

    if (!chatId || typeof chatId !== "string") {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }

    // Send a test message to verify the chat ID works
    try {
      await sendMessage(
        chatId,
        "✅ *AIboy connected!*\nYou will receive notifications here when Claude Code finishes a task."
      );
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not send a test message. Make sure you messaged the bot with /start first.",
        },
        { status: 400 }
      );
    }

    const apiKey = await registerUser(chatId);

    return NextResponse.json({ apiKey });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
