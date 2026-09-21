import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const currentPassword = String(body?.currentPassword || "");
    const newPassword = String(body?.newPassword || "");

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "رمز جدید باید حداقل ۶ کاراکتر باشد" }, { status: 400 });
    }

    const admin = await db.panelAdmin.findUnique({ where: { id: session.sub } });
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    if (!verifyPassword(currentPassword, admin.passwordHash)) {
      return NextResponse.json({ error: "رمز فعلی اشتباه است" }, { status: 400 });
    }

    await db.panelAdmin.update({
      where: { id: admin.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    return NextResponse.json({ ok: true, message: "رمز عبور تغییر کرد" });
  } catch (e) {
    console.error("password change error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
