import { NextRequest, NextResponse } from "next/server";
import { extractTask } from "@/lib/extractTask";

export async function POST(request: NextRequest) {
  try {
    // Парсинг тела запроса
    const body = await request.json();
    const { text, chat_id } = body;

    // Вызываем общую функцию извлечения задачи
    const result = await extractTask(text, chat_id);

    // Преобразуем результат в HTTP ответ
    if (!result.success) {
      const statusCode = result.error?.includes("not configured") ? 500 : 
                        result.error?.includes("Missing or invalid") ? 400 : 500;
      return NextResponse.json(
        {
          error: result.error,
          details: result.details,
        },
        { status: statusCode }
      );
    }

    // Возвращаем успешный результат
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
