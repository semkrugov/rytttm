import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const botToken = process.env.TELEGRAM_BOT_TOKEN;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { assigneeId, title, projectTitle, creatorName } = await request.json();

    if (!assigneeId || !botToken) {
      return NextResponse.json({ success: false, error: "Missing assigneeId or bot token" }, { status: 400 });
    }

    // 1. Get assignee's telegram_id
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("telegram_id")
      .eq("id", assigneeId)
      .single();

    if (error || !profile?.telegram_id) {
      console.error("Assignee not found or no telegram_id:", error);
      return NextResponse.json({ success: false, error: "Assignee not found" }, { status: 404 });
    }

    // 2. Send Telegram message
    const message = `🔔 *Новая задача*\n\n📝 ${title}\n📂 Проект: ${projectTitle || "Без проекта"}\n👤 От: ${creatorName || "Неизвестно"}`;
    
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: profile.telegram_id,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error("Telegram API error:", telegramResult);
      return NextResponse.json({ success: false, telegramError: telegramResult }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error in notify route:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}