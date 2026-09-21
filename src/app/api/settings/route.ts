import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, AuthError } from "@/lib/auth";
import { ensureSeed, getSettings } from "@/lib/seed";

const ALLOWED_KEYS = ["panelName", "nodeHost", "nodePort", "wsPath", "sni", "protocols", "demoMode"];

export async function GET() {
  try {
    await ensureSeed();
    await requireSession();
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json().catch(() => null);
    const updates = (body?.settings || {}) as Record<string, string>;

    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      await db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    const settings = await getSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    console.error("settings PUT error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
