import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";
import { extractTask } from "@/lib/extractTask";

// Инициализация бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "");

// Обработчик текстовых сообщений
bot.on("text", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (!text) {
      return;
    }

    // Используем общую функцию извлечения задачи напрямую
    const result = await extractTask(text, chatId);

    // Если произошла ошибка
    if (!result.success) {
      console.error("Error extracting task:", result.error, result.details);
      await ctx.reply("❌ Произошла ошибка при обработке сообщения.");
      return;
    }

    // Если ИИ подтверждает задачу, отвечаем пользователю
    if (result.is_task) {
      await ctx.reply("✅ Задача принята!");
    }
    // Если это не задача, ничего не отвечаем
  } catch (error) {
    console.error("Error in bot text handler:", error);
    try {
      await ctx.reply("❌ Произошла ошибка при обработке сообщения.");
    } catch (replyError) {
      console.error("Error sending error message:", replyError);
    }
  }
});

// Экспорт POST-обработчика для вебхука
export const POST = async (request: NextRequest) => {
  try {
    // Проверка наличия токена бота
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not configured");
      return NextResponse.json(
        { error: "Bot token is not configured" },
        { status: 500 }
      );
    }

    // Получаем тело запроса (обновление от Telegram)
    const body = await request.json();

    // Обрабатываем обновление через бота
    await bot.handleUpdate(body);

    // Telegram требует ответ 200 OK
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in bot webhook handler:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
