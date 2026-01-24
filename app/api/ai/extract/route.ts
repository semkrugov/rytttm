import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

// UUID regex для проверки
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Функция для поиска профиля по имени с умной логикой
 * Пытается найти по полному имени, если не находит - пробует по корню
 */
async function findProfileByName(name: string): Promise<string | null> {
  // Очищаем имя от @ и лишних пробелов
  let cleanName = name.trim().replace(/^@/, "").toLowerCase();
  
  console.log("Поиск профиля для имени:", cleanName);

  // Первая попытка: поиск по полному имени
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .or(`username.ilike.%${cleanName}%,display_name.ilike.%${cleanName}%`)
    .limit(1)
    .maybeSingle();

  if (profile) {
    console.log("Профиль найден по полному имени:", cleanName, "->", profile.id);
    return profile.id;
  }

  if (error && error.code !== "PGRST116") {
    console.error("Ошибка при поиске профиля:", error);
  }

  // Вторая попытка: отрезаем окончания и ищем по корню
  // Убираем типичные окончания уменьшительно-ласкательных имен
  const rootName = cleanName
    .replace(/(я|ёк|енька|юша|уша|ик|чик|ка|енька|ечка)$/i, "")
    .replace(/(а|я|о|е|и|ы|у|ю|ь)$/i, "");

  // Если корень отличается от исходного имени и достаточно длинный (минимум 2 символа)
  if (rootName !== cleanName && rootName.length >= 2) {
    console.log("Попытка поиска по корню:", rootName, "(исходное:", cleanName + ")");
    
    const { data: rootProfile, error: rootError } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.ilike.%${rootName}%,display_name.ilike.%${rootName}%`)
      .limit(1)
      .maybeSingle();

    if (rootProfile) {
      console.log("Профиль найден по корню:", rootName, "->", rootProfile.id);
      return rootProfile.id;
    }

    if (rootError && rootError.code !== "PGRST116") {
      console.error("Ошибка при поиске по корню:", rootError);
    }
  }

  console.log("Профиль не найден для имени:", cleanName);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Парсинг тела запроса
    const body = await request.json();
    const { text, chatId, projectId, message } = body;

    console.log("--- AI API START ---", { text, projectId });

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing 'projectId' parameter" },
        { status: 400 }
      );
    }

    // Проверка project_id на UUID
    if (!UUID_REGEX.test(projectId)) {
      console.error("Invalid project_id format (not UUID):", projectId);
      return NextResponse.json(
        { error: "Invalid project_id format. Must be UUID." },
        { status: 400 }
      );
    }

    // Вызываем Gemini API напрямую
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Ты — робот. Проанализируй сообщение: "${text}". Верни ТОЛЬКО JSON объект. Если это задача: {"is_task": true, "title": "название", "priority": "high", "assignee_name": "имя", "confidence_score": 85}. Если нет: {"is_task": false}. 

ВАЖНО для assignee_name: При поиске assignee_name учитывай уменьшительно-ласкательные имена и ники. Например, если в тексте "Ваня", "Ванёк" или "Vanya", а в контексте понятно, что это исполнитель — выдели его основное имя (Иван) или юзернейм. Возвращай имя в именительном падеже без символа @.

Не пиши ничего, кроме JSON.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let rawResponse = (typeof response.text === "function" ? response.text() : response.text) ?? "";

    // Очистка ответа от управляющих символов и markdown
    let cleanText = rawResponse
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
      .replace(/```json|```/g, "")
      .trim();

    console.log("AI CLEANED RESPONSE:", cleanText);

    // Парсинг JSON
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw response:", rawResponse);
      console.error("Cleaned response:", cleanText);
      throw new Error("AI returned invalid JSON");
    }

    // Если это задача, создаем её в Supabase
    if (parsedResult.is_task && parsedResult.title && projectId && message) {
      const telegramUserId = message.from?.id;

      if (telegramUserId) {
        // Находим UUID создателя задачи (creator_id)
        let creatorId: string | null = null;
        const { data: creatorProfile, error: creatorError } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_id", telegramUserId)
          .single();

        if (creatorError && creatorError.code !== "PGRST116") {
          console.error("Error finding creator profile:", creatorError);
        } else if (creatorProfile) {
          creatorId = creatorProfile.id;
        }

        // Находим UUID исполнителя (assignee_id), если указан
        let assigneeId: string | null = null;
        if (parsedResult.assignee_name) {
          assigneeId = await findProfileByName(parsedResult.assignee_name);
        }

        // Обработка confidence_score
        let confidenceScore: number = 80; // Дефолтное значение
        if (parsedResult.confidence_score !== undefined && parsedResult.confidence_score !== null) {
          const score = parseInt(String(parsedResult.confidence_score), 10);
          if (!isNaN(score) && score >= 0 && score <= 100) {
            confidenceScore = score;
          }
        }

        const insertData = {
          project_id: projectId,
          creator_id: creatorId,
          assignee_id: assigneeId,
          title: parsedResult.title,
          priority: parsedResult.priority || "medium",
          description: "",
          status: "todo",
          confidence_score: confidenceScore,
        };

        console.log("Inserting task with data:", insertData);

        const { error, data } = await supabase.from("tasks").insert(insertData).select();

        if (error) {
          console.error("Supabase Insert Error:", error);
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          return NextResponse.json(
            {
              success: false,
              error: "Failed to insert task",
              details: error.message || "Unknown database error",
            },
            { status: 500 }
          );
        }

        console.log("Task inserted successfully:", data);
      }
    }

    // Возвращаем успех
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI ROUTE CRASH:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
