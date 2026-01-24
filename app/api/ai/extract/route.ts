import { NextRequest, NextResponse } from "next/server";
import { extractTaskFromText } from "@/lib/extractTask";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Парсинг тела запроса
    const body = await request.json();
    const { text, chatId, projectId, message } = body;

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
    if (result.is_task && result.task_data && projectId && message) {
      const telegramChatId = message.chat?.id;
      const telegramMessageId = message.message_id;
      const telegramUserId = message.from?.id;

      if (telegramChatId && telegramMessageId && telegramUserId) {
        // Находим UUID создателя задачи (creator_id)
        let creatorId: string | null = null;
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_id", telegramUserId)
          .single();

        if (creatorProfile) {
          creatorId = creatorProfile.id;
        }

        // Находим UUID исполнителя (assignee_id), если указан
        let assigneeId: string | null = null;
        if (result.task_data.assignee) {
          const assigneeValue = result.task_data.assignee.trim();
          
          // Если указан @username
          if (assigneeValue.startsWith("@")) {
            const username = assigneeValue.substring(1);
            const { data: assigneeProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("username", username)
              .single();

            if (assigneeProfile) {
              assigneeId = assigneeProfile.id;
            } else {
              console.warn(`Profile not found for username: ${username}`);
            }
          } else {
            // Если указано имя без @, пытаемся найти по username (без @)
            const { data: assigneeProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("username", assigneeValue)
              .single();

            if (assigneeProfile) {
              assigneeId = assigneeProfile.id;
            } else {
              console.warn(`Profile not found for assignee: ${assigneeValue}`);
            }
          }
        }

        const insertData = {
          project_id: projectId,
          creator_id: creatorId,
          assignee_id: assigneeId,
          title: result.task_data.title,
          deadline: result.task_data.deadline
            ? new Date(result.task_data.deadline).toISOString()
            : null,
          priority: result.task_data.priority,
          description: result.task_data.description || "",
          status: "todo", // Дефолтный статус
          confidence_score: null, // Можно добавить логику для расчета confidence_score
          telegram_chat_id: telegramChatId,
          telegram_message_id: telegramMessageId,
        };

        console.log("Inserting task with data:", insertData);

        const { error } = await supabase.from("tasks").insert(insertData);

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
