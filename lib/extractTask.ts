import "server-only";
import OpenAI from "openai";
import type { ExtractResult } from "@/lib/extractTypes";
import { safeJsonParse } from "@/lib/extractTypes";
import { extractTaskWithGemini } from "@/lib/gemini";

export type { ExtractResult } from "@/lib/extractTypes";

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

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

async function extractTaskWithDeepSeek(params: {
  text: string;
  currentDatetimeIso: string;
  timezone: string;
}): Promise<ExtractResult> {
  const text = params.text?.trim();
  if (!text) return { is_task: false };

  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is missing");
  }

  const userPrompt = `
json
CURRENT_DATETIME: ${params.currentDatetimeIso}
TIMEZONE: ${params.timezone} (UTC+06:00)

MESSAGE:
${text}
`.trim();

  const resp = await deepseekClient.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0,
    max_tokens: 700,
    response_format: { type: "json_object" },
  });

  const content = resp.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("DeepSeek returned empty content");

  return safeJsonParse(content);
}

const TASK_TRIGGERS =
  /\b(сделай|сделать|нужно|надо|надо бы|подготовь|подготовить|проверь|проверить|поправь|поправить|добавь|добавить|настрой|настроить|организуй|организовать|напомни|напомнить|отправь|отправить|создай|создать|напиши|написать|позвони|позвонить|купи|купить|закажи|заказать)\b/i;

function extractTaskWithHeuristics(text: string): ExtractResult {
  const t = text?.trim() ?? "";
  if (!t) return { is_task: false };
  if (!TASK_TRIGGERS.test(t)) return { is_task: false };

  const firstLine = t.split(/\r?\n/)[0]?.trim() ?? t.slice(0, 120);
  const title = firstLine.length > 200 ? firstLine.slice(0, 197) + "…" : firstLine;

  return {
    is_task: true,
    task_data: {
      title,
      assignee: null,
      deadline: null,
      priority: "medium",
      description: "",
    },
  };
}

export async function extractTaskFromText(params: {
  text: string;
  currentDatetimeIso: string;
  timezone: string;
}): Promise<ExtractResult> {
  const text = params.text?.trim();
  if (!text) return { is_task: false };

  try {
    const out = await extractTaskWithGemini(params);
    console.log("[AI] Gemini success");
    return out;
  } catch (err) {
    console.warn("[AI] Gemini failed, fallback to DeepSeek", err);
  }

  try {
    return await extractTaskWithDeepSeek(params);
  } catch (err) {
    console.warn("[AI] DeepSeek failed, fallback to rules", err);
  }

  return extractTaskWithHeuristics(text);
}
