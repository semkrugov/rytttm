import { NextRequest, NextResponse } from "next/server";
import { extractTaskFromText } from "@/lib/extractTask";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Парсинг тела запроса
    const body = await request.json();
    const { text, chatId, message } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    console.log("--- AI EXTRACT START ---", text);

    // Вызываем extractTaskFromText
    const result = await extractTaskFromText({
      text,
      currentDatetimeIso: new Date().toISOString(),
      timezone: "Asia/Almaty",
    });

    // Если это задача, создаем её в Supabase
    if (result.is_task && result.task_data && chatId && message) {
      const projectId = String(chatId);
      const telegramChatId = message.chat?.id;
      const telegramMessageId = message.message_id;
      const telegramUserId = message.from?.id;

      if (telegramChatId && telegramMessageId && telegramUserId) {
        const taskData = {
          project_id: projectId,
          title: result.task_data.title,
          assignee: result.task_data.assignee,
          deadline: result.task_data.deadline
            ? new Date(result.task_data.deadline).toISOString()
            : null,
          priority: result.task_data.priority,
          description: result.task_data.description || "",
          telegram_chat_id: telegramChatId,
          telegram_message_id: telegramMessageId,
          created_by_telegram_user_id: telegramUserId,
        };

        const { error } = await supabase.from("tasks").insert(taskData);

        if (error) {
          console.error("Supabase Insert Error:", error);
          return NextResponse.json(
            { success: false, error: "Failed to insert task" },
            { status: 500 }
          );
        }
      }
    }

    // Возвращаем успех
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/ai/extract:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
