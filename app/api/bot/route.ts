import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase";

/**
 * Проверяет, стоит ли вызывать ИИ для обработки сообщения
 * Оптимизация для экономии квот API
 */
function shouldCallAI(text: string): boolean {
  const trimmedText = text.trim();
  
  // Проверка 1: Длина текста меньше 10 символов
  if (trimmedText.length < 10) {
    console.log("[BOT] Text too short, skipping AI call");
    return false;
  }
  
  // Проверка 2: Сообщение состоит только из одного слова
  const words = trimmedText.split(/\s+/);
  if (words.length === 1) {
    console.log("[BOT] Single word message, skipping AI call");
    return false;
  }
  
  // Проверка 3: Сообщение длиннее 30 символов - всегда вызываем ИИ
  if (trimmedText.length > 30) {
    console.log("[BOT] Long message, calling AI");
    return true;
  }
  
  // Проверка 4: Наличие ключевых слов-триггеров
  const triggerWords = [
    'сделай', 'сделать', 'нужно', 'надо', 'подготовь', 'подготовить',
    'завтра', 'сегодня', 'срочно', 'поправь', 'исправь', 'добавь',
    'удали', 'измени', 'обнови', 'создай', 'напиши', 'отправь',
    'проверь', 'посмотри', 'найди', 'заверши', 'закончи', 'начать',
    'начал', 'закончил', 'готово', 'сделано', 'выполнено',
    '@' // Упоминание пользователя
  ];
  
  const lowerText = trimmedText.toLowerCase();
  const hasTrigger = triggerWords.some(word => lowerText.includes(word));
  
  if (hasTrigger) {
    console.log("[BOT] Trigger word found, calling AI");
    return true;
  }
  
  console.log("[BOT] No trigger words and message too short, skipping AI call");
  return false;
}

// Экспорт POST-обработчика для вебхука
export const POST = async (request: NextRequest) => {
  try {
    // Проверка наличия токена бота
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not configured");
      return NextResponse.json({ ok: true }); // Всегда возвращаем 200 OK
    }

    // Получаем тело запроса (обновление от Telegram)
    const body = await request.json();
    console.log("--- RAW UPDATE ---", body);

    const chatMemberUpdate = body.chat_member;
    if (chatMemberUpdate) {
      const chat = chatMemberUpdate.chat;
      const chatId = chat?.id;
      const chatTitle = chat?.title || `Chat ${chatId}`;
      const memberUser = chatMemberUpdate.new_chat_member?.user;
      const memberStatus = chatMemberUpdate.new_chat_member?.status as string | undefined;

      const isJoinedStatus = memberStatus === "member" || memberStatus === "administrator" || memberStatus === "creator";

      if (chatId && memberUser?.id && isJoinedStatus) {
        const projectId = await ensureProject(chatId, chatTitle);
        if (projectId) {
          const profileId = await ensureProfile(memberUser.id, memberUser);
          if (profileId) {
            await ensureProjectMember(projectId, profileId);
            console.log(`[BOT] User ${profileId} auto-added to project ${projectId} after chat join`);
          }
        }
      }

      return NextResponse.json({ ok: true });
    }

    // Получаем chat_id и text
    const chatId = body.message?.chat?.id;
    const text = body.message?.text;
    const chatType = body.message?.chat?.type;

    // Если нет текста, пропускаем
    if (!text || !chatId) {
      return NextResponse.json({ ok: true });
    }

    // Получаем данные пользователя из сообщения
    const telegramUserId = body.message.from?.id;
    if (!telegramUserId) {
      return NextResponse.json({ ok: true });
    }

    // Обработка инвайта: /start inv_<token> в личном чате
    if (chatType === "private" && text.startsWith("/start inv_")) {
      const token = text.slice("/start inv_".length).trim();
      const invitedProjectId = verifyInviteToken(token);

      if (!invitedProjectId) {
        await sendTelegramMessage(chatId, "Ссылка приглашения недействительна или устарела.");
        return NextResponse.json({ ok: true });
      }

      const userProfileId = await ensureProfile(telegramUserId, body.message.from);
      if (!userProfileId) {
        await sendTelegramMessage(chatId, "Не удалось обработать приглашение. Попробуйте позже.");
        return NextResponse.json({ ok: true });
      }

      const { data: projectExists } = await supabase
        .from("projects")
        .select("id")
        .eq("id", invitedProjectId)
        .maybeSingle();

      if (!projectExists) {
        await sendTelegramMessage(chatId, "Проект по этой ссылке не найден.");
        return NextResponse.json({ ok: true });
      }

      const chatJoinLink = await getProjectChatJoinLink(invitedProjectId);
      if (!chatJoinLink) {
        await sendTelegramMessage(
          chatId,
          "Не удалось получить ссылку на чат проекта. Попроси администратора пригласить тебя вручную."
        );
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessageWithButton(
        chatId,
        "Нажми кнопку ниже и вступи в чат проекта. После вступления ты автоматически появишься в участниках проекта в Mini App.",
        "Вступить в чат проекта",
        chatJoinLink
      );
      return NextResponse.json({ ok: true });
    }

    // Авто-регистрация: обеспечиваем наличие проекта, профиля и участника
    // 1. Ищем или создаем проект
    // Получаем название чата: для групп - title, для личных чатов - имя пользователя
    let chatTitle = body.message.chat.title;
    if (!chatTitle) {
      // Для личных чатов используем имя пользователя
      const chat = body.message.chat;
      if (chat.type === "private") {
        const firstName = chat.first_name || "";
        const lastName = chat.last_name || "";
        const username = chat.username ? `@${chat.username}` : "";
        chatTitle = [firstName, lastName].filter(Boolean).join(" ") || username || `User ${chatId}`;
      } else {
        // Для других типов чатов используем fallback
        chatTitle = `Chat ${chatId}`;
      }
    }
    const projectUuid = await ensureProject(chatId, chatTitle);

    if (!projectUuid) {
      console.error("[BOT] Failed to get or create project");
      return NextResponse.json({ ok: true });
    }

    console.log(`[BOT] Нашли проект с UUID: ${projectUuid}`);

    // 2. Ищем или создаем профиль пользователя
    const userProfileId = await ensureProfile(telegramUserId, body.message.from);

    if (!userProfileId) {
      console.error("[BOT] Failed to get or create profile");
      return NextResponse.json({ ok: true });
    }

    // 3. Добавляем пользователя в участники проекта (используем upsert для избежания дублирования)
    await ensureProjectMember(projectUuid, userProfileId);

    console.log(`[BOT] Авто-регистрация завершена: пользователь ${userProfileId} добавлен в проект ${projectUuid}`);

    // Проверяем, стоит ли вызывать ИИ для обработки сообщения
    if (shouldCallAI(text)) {
      // Вызываем наш API /api/ai/extract
      try {
        const response = await fetch("https://rytttm.vercel.app/api/ai/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            chatId,
            projectId: projectUuid,
            message: body.message,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("[BOT] AI extract result:", result);
      } catch (error) {
        console.error("Fetch AI error:", error);
      }
    } else {
      console.log("[BOT] Skipping AI call - message doesn't meet criteria");
    }

    // Всегда возвращаем 200 OK
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[BOT] Error in webhook handler:", error);
    // Всегда возвращаем 200 OK даже при ошибке
    return NextResponse.json({ ok: true });
  }
};

function getInviteSecret(): string | null {
  return process.env.INVITE_SIGNING_SECRET || process.env.TELEGRAM_BOT_TOKEN || null;
}

function verifyInviteToken(token: string): string | null {
  const secret = getInviteSecret();
  if (!secret) return null;

  const [payloadBase64, providedSignature] = token.split(".");
  if (!payloadBase64 || !providedSignature) return null;

  const expectedSignature = createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  const decoded = Buffer.from(payloadBase64, "base64url").toString("utf8");
  const [projectId, expiresAtRaw] = decoded.split(":");
  const expiresAt = Number(expiresAtRaw);

  if (!projectId || !expiresAt || Number.isNaN(expiresAt)) return null;
  if (expiresAt < Math.floor(Date.now() / 1000)) return null;

  return projectId;
}

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
  } catch (error) {
    console.error("[BOT] Failed to send Telegram message:", error);
  }
}

async function sendTelegramMessageWithButton(
  chatId: number,
  text: string,
  buttonText: string,
  buttonUrl: string
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: {
          inline_keyboard: [[{ text: buttonText, url: buttonUrl }]],
        },
      }),
    });
  } catch (error) {
    console.error("[BOT] Failed to send Telegram message with button:", error);
  }
}

async function getProjectChatJoinLink(projectId: string): Promise<string | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("telegram_chat_id")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project?.telegram_chat_id) {
    console.error("[BOT] Failed to load project telegram_chat_id for invite:", error);
    return null;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/createChatInviteLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: project.telegram_chat_id,
        creates_join_request: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[BOT] createChatInviteLink http error:", response.status, text);
      return await getPublicChatUrl(project.telegram_chat_id);
    }

    const result = (await response.json()) as {
      ok: boolean;
      result?: { invite_link?: string };
      description?: string;
    };

    if (!result.ok || !result.result?.invite_link) {
      console.error("[BOT] createChatInviteLink failed:", result.description);
      return await getPublicChatUrl(project.telegram_chat_id);
    }

    return result.result.invite_link;
  } catch (error) {
    console.error("[BOT] Failed to create chat invite link:", error);
    return await getPublicChatUrl(project.telegram_chat_id);
  }
}

async function getPublicChatUrl(chatId: number): Promise<string | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[BOT] getChat http error:", response.status, text);
      return null;
    }

    const result = (await response.json()) as {
      ok: boolean;
      result?: { username?: string };
      description?: string;
    };

    const username = result.result?.username;
    if (!result.ok || !username) {
      console.error("[BOT] getChat has no public username:", result.description);
      return null;
    }

    return `https://t.me/${username}`;
  } catch (error) {
    console.error("[BOT] Failed to resolve public chat URL:", error);
    return null;
  }
}

/**
 * Создает проект, если его еще нет, и возвращает его UUID
 */
async function ensureProject(chatId: number, title: string): Promise<string | null> {
  console.log("[BOT] ensureProject", { chatId, title });

  // Ищем проект по telegram_chat_id
  const { data: existingProject, error: selectError } = await supabase
    .from("projects")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .single();

  if (existingProject) {
    // Синхронизируем название проекта с текущим названием чата в Telegram
    await supabase
      .from("projects")
      .update({ title })
      .eq("id", existingProject.id);
    console.log("[BOT] Project found, title synced:", existingProject.id);
    return existingProject.id;
  }

  // Если проекта нет, создаем его
  const { data: newProject, error: insertError } = await supabase
    .from("projects")
    .insert({
      telegram_chat_id: chatId,
      title: title,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[BOT] Error creating project", chatId, insertError);
    return null;
  }

  console.log("[BOT] Project created:", newProject.id);
  return newProject.id;
}

/**
 * Создает профиль пользователя, если его еще нет, и возвращает его UUID
 */
async function ensureProfile(
  telegramUserId: number,
  telegramUser: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  }
): Promise<string | null> {
  console.log("[BOT] ensureProfile", { telegramUserId });

  // Ищем профиль по telegram_id
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("telegram_id", telegramUserId)
    .single();

  if (existingProfile) {
    console.log("[BOT] Profile found:", existingProfile.id);
    
    // Обновляем username, если его нет, но есть first_name
    if (!existingProfile.username && telegramUser.first_name) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username: telegramUser.first_name })
        .eq("id", existingProfile.id);
      
      if (updateError) {
        console.error("[BOT] Error updating username:", updateError);
      } else {
        console.log("[BOT] Updated username for profile:", existingProfile.id);
      }
    }
    
    return existingProfile.id;
  }

  if (selectError && selectError.code !== "PGRST116") {
    console.error("[BOT] Error finding profile:", selectError);
    return null;
  }

  // Если профиля нет, создаем его
  // Используем username из Telegram, если нет - используем first_name
  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      telegram_id: telegramUserId,
      username: telegramUser.username || telegramUser.first_name || null,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[BOT] Error creating profile", telegramUserId, insertError);
    return null;
  }

  console.log("[BOT] Profile created:", newProfile.id);
  return newProfile.id;
}

/**
 * Создает/обновляет участника проекта в таблице project_members
 */
async function ensureProjectMember(
  projectId: string,
  userId: string
): Promise<void> {
  console.log("[BOT] ensureProjectMember", { projectId, userId });

  // Используем upsert с composite primary key
  const { error } = await supabase
    .from("project_members")
    .upsert(
      {
        project_id: projectId,
        user_id: userId,
      },
      {
        onConflict: "project_id,user_id",
      }
    );

  if (error) {
    console.error(
      `[BOT] Error ensuring project member ${userId} in project ${projectId}:`,
      error
    );
  } else {
    console.log(
      `[BOT] Project member ensured: user ${userId} in project ${projectId}`
    );
  }
}
