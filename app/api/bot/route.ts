import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { extractTaskFromText } from "@/lib/extractTask";

// Экспорт POST-обработчика для вебхука
export const POST = async (request: NextRequest) => {
  try {
    // Проверка наличия токена бота
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not configured");
      return NextResponse.json({ ok: true }); // Всегда возвращаем 200 OK
    }

    // Получаем тело запроса (обновление от Telegram)
    const body = await request.json();

    // Логирование входящего апдейта
    const chatId = body.message?.chat?.id || body.message?.new_chat_members?.[0]?.id || null;
    const fromId = body.message?.from?.id || null;
    const text = body.message?.text || null;
    console.log(`[BOT] Incoming update: chat.id=${chatId}, from.id=${fromId}, text=${text?.substring(0, 50)}...`);

    // Обработка обычных сообщений
    if (body.message?.text) {
      const message = body.message;
      const projectId = String(message.chat.id);
      const telegramChatId = message.chat.id;
      const telegramMessageId = message.message_id;
      const telegramUserId = message.from?.id;

      if (!telegramUserId) {
        return NextResponse.json({ ok: true });
      }

      // Создаем/обновляем проект
      await ensureProject(projectId, message.chat.title || `Chat ${projectId}`);

      // Создаем/обновляем участника проекта
      await ensureProjectMember(projectId, message.from);

      // Извлекаем задачу из текста
      const currentDatetimeIso = new Date().toISOString();
      const timezone = "Asia/Almaty";
      
      const extractResult = await extractTaskFromText({
        text: message.text,
        currentDatetimeIso,
        timezone,
      });

      // Логирование результата extractTaskFromText
      console.log(`[BOT] extractTaskFromText result: is_task=${extractResult.is_task}`);

      // Если это задача, создаем её в Supabase
      if (extractResult.is_task && extractResult.task_data) {
        const taskData = {
          project_id: projectId,
          title: extractResult.task_data.title,
          assignee: extractResult.task_data.assignee,
          deadline: extractResult.task_data.deadline
            ? new Date(extractResult.task_data.deadline).toISOString()
            : null,
          priority: extractResult.task_data.priority,
          description: extractResult.task_data.description || "",
          telegram_chat_id: telegramChatId,
          telegram_message_id: telegramMessageId,
          created_by_telegram_user_id: telegramUserId,
        };

        const { error: taskError } = await supabase.from("tasks").insert(taskData);

        if (taskError) {
          console.error(`[BOT] Error inserting task into Supabase:`, taskError);
        } else {
          console.log(`[BOT] Task inserted successfully: project_id=${projectId}, title=${taskData.title}`);
        }
      }
    }

    // Обработка добавления новых участников
    if (body.message?.new_chat_members) {
      const message = body.message;
      const projectId = String(message.chat.id);

      // Создаем/обновляем проект
      await ensureProject(projectId, message.chat.title || `Chat ${projectId}`);

      // Создаем/обновляем каждого нового участника
      for (const newMember of message.new_chat_members) {
        await ensureProjectMember(projectId, newMember);
      }
    }

    // Всегда возвращаем 200 OK
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[BOT] Error in webhook handler:", error);
    // Всегда возвращаем 200 OK даже при ошибке
    return NextResponse.json({ ok: true });
  }
};

/**
 * Создает проект, если его еще нет
 */
async function ensureProject(projectId: string, title: string): Promise<void> {
  console.log("[BOT] ensureProject", { projectId, title });

  const { error } = await supabase
    .from("projects")
    .upsert(
      {
        id: projectId,
        title: title,
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[BOT] Error ensuring project", projectId, error);
  }
}

/**
 * Создает/обновляет участника проекта
 */
async function ensureProjectMember(
  projectId: string,
  user: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from("project_members")
    .upsert(
      {
        project_id: projectId,
        telegram_user_id: user.id,
        username: user.username || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        role: "member",
      },
      { onConflict: "project_id,telegram_user_id" }
    );

  if (error) {
    console.error(`[BOT] Error ensuring project member ${user.id} in project ${projectId}:`, error);
  }
}
