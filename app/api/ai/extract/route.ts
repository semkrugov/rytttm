import { NextRequest, NextResponse } from "next/server";
import { extractTaskFromText } from "@/lib/extractTask";

export async function POST(request: NextRequest) {
  try {
    // Парсинг тела запроса
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    // Вызываем extractTaskFromText
    const result = await extractTaskFromText({
      text,
      currentDatetimeIso: new Date().toISOString(),
      timezone: "Asia/Almaty",
    });

    // Возвращаем результат
    return NextResponse.json(result);
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
