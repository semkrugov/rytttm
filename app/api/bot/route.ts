import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    console.log("--- RAW UPDATE ---", body);

    // Получаем chat_id и text
    const chatId = body.message?.chat?.id;
    const text = body.message?.text;

    // Если нет текста, пропускаем
    if (!text || !chatId) {
      return NextResponse.json({ ok: true });
    }

    // Ищем или создаем проект
    const projectId = String(chatId);
    await ensureProject(projectId, body.message.chat.title || `Chat ${projectId}`);

    // Вызываем наш API /api/ai/extract
    try {
      const response = await fetch("https://rytttm.vercel.app/api/ai/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          chatId,
          message: body.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("[BOT] AI extract result:", result);
    } catch (error) {
      console.error("Fetch AI error:", error);
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
