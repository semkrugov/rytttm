import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DEFAULT_BOT_URL = "https://t.me/rytttm_bot";
const INVITE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type Context = {
  params: Promise<{ id: string }>;
};

function getInviteSecret(): string | null {
  return process.env.INVITE_SIGNING_SECRET || process.env.TELEGRAM_BOT_TOKEN || null;
}

function sign(payloadBase64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function createInviteToken(projectId: string, secret: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + INVITE_TTL_SECONDS;
  const payloadBase64 = Buffer.from(`${projectId}:${expiresAt}`, "utf8").toString("base64url");
  const signature = sign(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

function getBotUrl(): string {
  return process.env.NEXT_PUBLIC_BOT_INVITE_URL || process.env.BOT_INVITE_URL || DEFAULT_BOT_URL;
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id: projectId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { requesterId?: string };
    const requesterId = body.requesterId;

    if (!projectId || !requesterId) {
      return NextResponse.json({ error: "projectId and requesterId are required" }, { status: 400 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", requesterId)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: "Failed to validate membership" }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: "Only project members can invite others" }, { status: 403 });
    }

    const secret = getInviteSecret();
    if (!secret) {
      return NextResponse.json({ error: "Invite secret is not configured" }, { status: 500 });
    }

    const token = createInviteToken(projectId, secret);
    const startParam = `inv_${token}`;
    const inviteLink = `${getBotUrl()}?start=${encodeURIComponent(startParam)}`;
    const shareText = "Присоединяйся к проекту в rytttm";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

    return NextResponse.json({
      inviteLink,
      shareUrl,
      expiresInSeconds: INVITE_TTL_SECONDS,
    });
  } catch (error) {
    console.error("[INVITE] Failed to create project invite", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
