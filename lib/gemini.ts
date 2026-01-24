import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ExtractResult } from "@/lib/extractTypes";
import { safeJsonParse } from "@/lib/extractTypes";

const SYSTEM_PROMPT = `
Ты — AI-менеджер проектов внутри Telegram-бота. Твоя задача — извлекать задачи из сообщений.

Отвечай ТОЛЬКО валидным JSON (без текста, без markdown).

Если задачи нет:
{ "is_task": false }

Если задача есть:
{
  "is_task": true,
  "task_data": {
    "title": "Короткое действие",
    "assignee": "@username или имя или null",
    "deadline": "ISO8601 с таймзоной или null",
    "priority": "low | medium | high",
    "description": "Контекст"
  }
}

Правила:
- is_task=true только если есть поручение/просьба/план: "сделай", "нужно", "надо", "подготовь", "проверь", "поправь", "добавь", "настрой".
- assignee: @username если есть; иначе имя если явно указано; иначе null. Не угадывай.
- deadline: если "утром" = 09:00, "днём" = 14:00, "вечером" = 19:00, если только дата — 18:00. Формат ISO8601 с таймзоной (+06:00).
- priority=high при "срочно/горит/важно/алярм", priority=low при "не к спеху/когда-нибудь/можно позже", иначе medium.
- description: добавь полезный контекст (ссылки/уточнения). Если нет — "".
`.trim();

export async function extractTaskWithGemini(params: {
  text: string;
  currentDatetimeIso: string;
  timezone: string;
}): Promise<ExtractResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const userPrompt = `
CURRENT_DATETIME: ${params.currentDatetimeIso}
TIMEZONE: ${params.timezone} (UTC+06:00)

MESSAGE:
${params.text?.trim() ?? ""}
`.trim();

  const fullPrompt = SYSTEM_PROMPT + "\n\n" + userPrompt;
  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  let raw = (typeof response.text === "function" ? response.text() : response.text) ?? "";

  // Очистка от markdown code blocks
  raw = raw.trim();
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  // Дополнительная очистка от возможных остатков markdown
  raw = raw.replace(/```json|```/g, "").trim();

  if (!raw) {
    throw new Error("Gemini returned empty content");
  }

  return safeJsonParse(raw);
}
