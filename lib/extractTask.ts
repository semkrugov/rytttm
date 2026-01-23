import OpenAI from "openai";

export type ExtractResult =
  | { is_task: false }
  | {
      is_task: true;
      task_data: {
        title: string;
        assignee: string | null;
        deadline: string | null;
        priority: "low" | "medium" | "high";
        description: string;
      };
    };

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

function safeJsonParse(text: string): ExtractResult {
  try {
    const parsed = JSON.parse(text);

    if (parsed && typeof parsed === "object" && parsed.is_task === false) {
      return { is_task: false };
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.is_task === true &&
      parsed.task_data &&
      typeof parsed.task_data.title === "string" &&
      (parsed.task_data.assignee === null || typeof parsed.task_data.assignee === "string") &&
      (parsed.task_data.deadline === null || typeof parsed.task_data.deadline === "string") &&
      (parsed.task_data.priority === "low" ||
        parsed.task_data.priority === "medium" ||
        parsed.task_data.priority === "high") &&
      typeof parsed.task_data.description === "string"
    ) {
      return parsed as ExtractResult;
    }

    return { is_task: false };
  } catch {
    return { is_task: false };
  }
}

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

export async function extractTaskFromText(params: {
  text: string;
  currentDatetimeIso: string;
  timezone: string; // "Asia/Almaty"
}): Promise<ExtractResult> {
  const text = params.text?.trim();
  if (!text) return { is_task: false };

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY is missing");
    return { is_task: false };
  }

  try {
    const userPrompt = `
json
CURRENT_DATETIME: ${params.currentDatetimeIso}
TIMEZONE: ${params.timezone} (UTC+06:00)

MESSAGE:
${text}
`.trim();

    const resp = await client.chat.completions.create({
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
    if (!content) return { is_task: false };

    return safeJsonParse(content);
  } catch (err) {
    console.error("Error in extractTask (DeepSeek):", err);
    return { is_task: false };
  }
}
