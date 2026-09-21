import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeed();
    const session = await getSession();
    if (!session) return NextResponse.json({ admin: null }, { status: 200 });

    // اگر رمز ادمین هنوز مقدار پیش‌فرض admin123 است، پنل تغییر اجباری نشان می‌دهد
    let mustChangePassword = false;
    try {
      const row = await db.panelAdmin.findUnique({
        where: { id: session.sub },
        select: { passwordHash: true },
      });
      mustChangePassword = !!row && verifyPassword("admin123", row.passwordHash);
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      admin: { id: session.sub, username: session.username, role: session.role },
      mustChangePassword,
    });
  } catch (e) {
    console.error("me error:", e);
    return NextResponse.json({ admin: null }, { status: 200 });
  }
}
