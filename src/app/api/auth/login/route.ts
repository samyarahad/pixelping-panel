import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/seed";
import { createSessionToken, sessionCookieOptions, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    const body = await req.json().catch(() => null);
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    if (!username || !password) {
      return NextResponse.json({ error: "نام کاربری و رمز عبور الزامی است" }, { status: 400 });
    }

    const admin = await db.panelAdmin.findUnique({ where: { username } });
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
    }

    const token = createSessionToken(admin);
    const res = NextResponse.json({
      ok: true,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
    const opts = sessionCookieOptions();
    res.cookies.set({ ...opts, value: token });
    return res;
  } catch (e) {
    console.error("login error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
