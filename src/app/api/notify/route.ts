import { NextRequest, NextResponse } from "next/server";
import { getUserByApiKey } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.slice(7);
    const user = await getUserByApiKey(apiKey);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const message = body.message || body.text || "Claude Code task finished.";

    await sendMessage(
      user.chatId,
      `🤖 *Claude Code finished*\n\n${message}`
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
