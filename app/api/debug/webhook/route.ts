import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    // Проверяем наличие токена
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;

    // Если токена нет, возвращаем только информацию об этом
    if (!hasToken) {
      return NextResponse.json({
        hasToken: false,
        error: "TELEGRAM_BOT_TOKEN is not set",
        webhookInfo: null,
      });
    }

    // Делаем запрос к Telegram API
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const webhookInfo = await response.json();

    return NextResponse.json({
      hasToken: true,
      webhookInfo: webhookInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
        error: error instanceof Error ? error.message : "Unknown error",
        webhookInfo: null,
      },
      { status: 500 }
    );
  }
};
