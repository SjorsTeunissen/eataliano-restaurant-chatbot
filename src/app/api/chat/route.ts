import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, SYSTEM_PROMPT, FUNCTION_DEFINITIONS } from "@/lib/openai";
import type { ChatMessage } from "@/lib/openai";
import { executeFunctionCall } from "@/lib/chat-functions";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FUNCTION_CALLS = 5;

interface ChatRequestBody {
  message: string;
  session_token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const userMessage = body.message.trim();
    const sessionToken = body.session_token || null;

    // Load or create chat session
    const supabase = createAdminClient();
    let messages: ChatMessage[] = [];
    let sessionId: string | null = null;

    if (sessionToken) {
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("id, messages")
        .eq("session_token", sessionToken)
        .single();

      if (session) {
        sessionId = session.id;
        messages = (session.messages as ChatMessage[]) || [];
      }
    }

    // Add user message to conversation
    messages.push({ role: "user", content: userMessage });

    // Build messages for OpenAI, prepend system prompt
    const openaiMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Call OpenAI with function calling, loop for tool calls
    let functionCallCount = 0;

    while (functionCallCount < MAX_FUNCTION_CALLS) {
      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: openaiMessages,
        tools: FUNCTION_DEFINITIONS,
        temperature: 0.7,
      });

      const choice = completion.choices[0];
      const assistantMessage = choice.message;

      // Add assistant message to both lists
      openaiMessages.push(assistantMessage);
      messages.push(assistantMessage);

      // If no tool calls, we have the final response
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        break;
      }

      // Process tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        functionCallCount++;
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const result = await executeFunctionCall(functionName, functionArgs);

        const toolMessage: ChatMessage = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        };

        openaiMessages.push(toolMessage);
        messages.push(toolMessage);
      }
    }

    // Extract the final assistant text response
    const lastMessage = messages[messages.length - 1];
    const assistantContent =
      lastMessage.role === "assistant" && typeof lastMessage.content === "string"
        ? lastMessage.content
        : "Sorry, ik kon je vraag niet verwerken. Probeer het opnieuw.";

    // Persist chat session
    if (sessionToken) {
      if (sessionId) {
        // Update existing session
        await supabase
          .from("chat_sessions")
          .update({ messages, updated_at: new Date().toISOString() })
          .eq("id", sessionId);
      } else {
        // Create new session
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert({ session_token: sessionToken, messages })
          .select("id")
          .single();

        if (newSession) {
          sessionId = newSession.id;
        }
      }
    }

    return NextResponse.json({
      reply: assistantContent,
      session_id: sessionId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    // Check for OpenAI API errors specifically
    if (message.includes("API key") || message.includes("auth")) {
      return NextResponse.json(
        { error: "Chat service configuration error" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
