import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

// Инициализация Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

// Массив кандидатов моделей для fallback
const MODEL_CANDIDATES = [
  "gemini-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-1.0-pro",
];

interface AIResponse {
  is_task: boolean;
  title?: string;
  priority?: "low" | "medium" | "high";
  assignee_name?: string;
  confidence?: number;
}

export interface ExtractTaskResult {
  success: boolean;
  is_task: boolean;
  message?: string;
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    confidence_score: number | null;
    project_id: string;
    assignee_id: string | null;
  };
  error?: string;
  details?: string;
}

/**
 * Извлекает задачу из текста с помощью AI и сохраняет в базу данных
 * @param text - Текст сообщения для анализа
 * @param chat_id - ID Telegram чата (bigint)
 * @returns Результат извлечения задачи
 */
export async function extractTask(
  text: string,
  chat_id: number
): Promise<ExtractTaskResult> {
  try {
    // Проверка наличия API ключа
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        is_task: false,
        error: "GEMINI_API_KEY is not configured",
      };
    }

    // Валидация входных данных
    if (!text || typeof text !== "string") {
      return {
        success: false,
        is_task: false,
        error: "Missing or invalid 'text' parameter",
      };
    }

    if (!chat_id || typeof chat_id !== "number") {
      return {
        success: false,
        is_task: false,
        error: "Missing or invalid 'chat_id' parameter (must be number/bigint)",
      };
    }

    // Промпт для анализа сообщения
    const prompt = `Проанализируй сообщение: "${text}". Если это задача, верни JSON: { "is_task": true, "title": "название", "priority": "low"|"medium"|"high", "assignee_name": "имя", "confidence": 0-100 }. Если нет: { "is_task": false }.

Ответ должен быть только валидным JSON, без дополнительного текста или markdown-разметки.`;

    // Пробуем каждую модель из кандидатов
    let aiText: string | null = null;
    let lastError: Error | null = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiText = response.text();
        // Успешно получили ответ - выходим из цикла
        break;
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Проверяем, является ли это ошибкой 404 (модель не найдена)
        const is404 = 
          error?.status === 404 ||
          error?.code === 404 ||
          error?.message?.includes("404") ||
          error?.message?.includes("not found") ||
          error?.message?.includes("NotFound");

        if (is404) {
          // Модель не найдена - пробуем следующую
          console.warn(`Model ${modelName} not found (404), trying next candidate...`);
          continue;
        } else {
          // Другая ошибка - логируем и пробуем следующую модель
          console.warn(`Error with model ${modelName}:`, error?.message || error);
          continue;
        }
      }
    }

    // Если все модели упали
    if (!aiText) {
      console.error("All Gemini models failed. Last error:", lastError);
      return {
        success: true,
        is_task: false,
        message: "AI models unavailable",
      };
    }

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
      return {
        success: false,
        is_task: false,
        error: "Failed to parse AI response",
        details: aiText,
      };
    }

    // Если это не задача, возвращаем результат
    if (!aiResponse.is_task) {
      return {
        success: true,
        is_task: false,
        message: "Message is not a task",
      };
    }

    // Валидация данных задачи
    if (!aiResponse.title) {
      return {
        success: false,
        is_task: false,
        error: "AI response missing 'title' field",
      };
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
      return {
        success: false,
        is_task: false,
        error: "Failed to search for project",
        details: projectSearchError.message,
      };
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
        return {
          success: false,
          is_task: false,
          error: "Failed to create project",
          details: projectCreateError?.message,
        };
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
      return {
        success: false,
        is_task: false,
        error: "Failed to create task",
        details: taskCreateError?.message,
      };
    }

    // Успешный результат
    return {
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
    };
  } catch (error) {
    console.error("Error in extractTask:", error);
    return {
      success: false,
      is_task: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
