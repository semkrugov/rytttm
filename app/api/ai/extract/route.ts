import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

// Инициализация Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

interface AIResponse {
  is_task: boolean;
  title?: string;
  priority?: "low" | "medium" | "high";
  assignee_name?: string;
  confidence?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Проверка наличия API ключа
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Парсинг тела запроса
    const body = await request.json();
    const { text, chat_id } = body;

    // Валидация входных данных
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    if (!chat_id || typeof chat_id !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid 'chat_id' parameter (must be number/bigint)" },
        { status: 400 }
      );
    }

    // Промпт для анализа сообщения
    const prompt = `Проанализируй сообщение: "${text}". Если это задача, верни JSON: { "is_task": true, "title": "название", "priority": "low"|"medium"|"high", "assignee_name": "имя", "confidence": 0-100 }. Если нет: { "is_task": false }.

Ответ должен быть только валидным JSON, без дополнительного текста или markdown-разметки.`;

    // Вызов Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiText = response.text();

    // Очистка ответа от markdown-разметки (```json, ```, и т.д.)
    aiText = aiText.trim();
    // Удаляем markdown code blocks
    aiText = aiText.replace(/^```json\s*/i, "");
    aiText = aiText.replace(/^```\s*/i, "");
    aiText = aiText.replace(/\s*```$/i, "");
    aiText = aiText.trim();

    // Парсинг JSON ответа
    let aiResponse: AIResponse;
    try {
      aiResponse = JSON.parse(aiText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiText);
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: aiText },
        { status: 500 }
      );
    }

    // Если это не задача, возвращаем результат
    if (!aiResponse.is_task) {
      return NextResponse.json({
        success: true,
        is_task: false,
        message: "Message is not a task",
      });
    }

    // Валидация данных задачи
    if (!aiResponse.title) {
      return NextResponse.json(
        { error: "AI response missing 'title' field" },
        { status: 500 }
      );
    }

    // ============================================
    // Логика работы с базой данных (Supabase)
    // ============================================

    // 1. Найти или создать проект по telegram_chat_id
    let projectId: string;

    const { data: existingProject, error: projectSearchError } = await supabase
      .from("projects")
      .select("id")
      .eq("telegram_chat_id", chat_id)
      .eq("status", "active")
      .single();

    if (projectSearchError && projectSearchError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error searching for project:", projectSearchError);
      return NextResponse.json(
        { error: "Failed to search for project", details: projectSearchError.message },
        { status: 500 }
      );
    }

    if (existingProject) {
      projectId = existingProject.id;
    } else {
      // Создаем новый проект
      // Используем chat_id как часть названия или можно получить название из Telegram API
      const projectTitle = `Chat ${chat_id}`;

      const { data: newProject, error: projectCreateError } = await supabase
        .from("projects")
        .insert({
          telegram_chat_id: chat_id,
          title: projectTitle,
          status: "active",
        })
        .select("id")
        .single();

      if (projectCreateError || !newProject) {
        console.error("Error creating project:", projectCreateError);
        return NextResponse.json(
          { error: "Failed to create project", details: projectCreateError?.message },
          { status: 500 }
        );
      }

      projectId = newProject.id;
    }

    // 2. Найти пользователя по assignee_name (если указан)
    let assigneeId: string | null = null;

    if (aiResponse.assignee_name) {
      const assigneeName = aiResponse.assignee_name.trim();

      // Ищем по username через ilike (case-insensitive)
      const { data: assignee, error: assigneeSearchError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", assigneeName)
        .single();

      if (assigneeSearchError && assigneeSearchError.code !== "PGRST116") {
        console.error("Error searching for assignee:", assigneeSearchError);
        // Не критичная ошибка - продолжаем без assignee
      } else if (assignee) {
        assigneeId = assignee.id;
      }
    }

    // 3. Создать задачу в таблице tasks
    const taskData: {
      project_id: string;
      assignee_id: string | null;
      title: string;
      status: string;
      priority: string;
      confidence_score: number | null;
    } = {
      project_id: projectId,
      assignee_id: assigneeId,
      title: aiResponse.title,
      status: "todo",
      priority: aiResponse.priority || "medium",
      confidence_score: aiResponse.confidence ?? null,
    };

    const { data: newTask, error: taskCreateError } = await supabase
      .from("tasks")
      .insert(taskData)
      .select("id, title, status, priority, confidence_score")
      .single();

    if (taskCreateError || !newTask) {
      console.error("Error creating task:", taskCreateError);
      return NextResponse.json(
        { error: "Failed to create task", details: taskCreateError?.message },
        { status: 500 }
      );
    }

    // Успешный ответ
    return NextResponse.json({
      success: true,
      is_task: true,
      task: {
        id: newTask.id,
        title: newTask.title,
        status: newTask.status,
        priority: newTask.priority,
        confidence_score: newTask.confidence_score,
        project_id: projectId,
        assignee_id: assigneeId,
      },
    });
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
