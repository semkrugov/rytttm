import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";

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

    // Определяем базовый URL для внутреннего запроса
    let baseUrl: string;
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      // Для локальной разработки
      baseUrl = "http://localhost:3000";
    }

    // Делаем запрос к нашему API /api/ai/extract
    const extractResponse = await fetch(`${baseUrl}/api/ai/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        chat_id: chatId,
      }),
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error("Error calling /api/ai/extract:", errorText);
      await ctx.reply("❌ Произошла ошибка при обработке сообщения.");
      return;
    }

    const extractData = await extractResponse.json();

    // Если ИИ подтверждает задачу, отвечаем пользователю
    if (extractData.success && extractData.is_task) {
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
