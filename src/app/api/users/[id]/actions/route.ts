import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireSession, AuthError } from "@/lib/auth";

/** اکشن‌های سریع: ریست ترافیک و ریست توکن اشتراک */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const action = String(body?.action || "");

    const user = await db.vpnUser.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });

    if (action === "reset-traffic") {
      await db.vpnUser.update({ where: { id }, data: { usedBytes: 0 } });
      await db.trafficLog.deleteMany({ where: { vpnUserId: id } });
      return NextResponse.json({ ok: true, message: "ترافیک کاربر ریست شد" });
    }

    if (action === "reset-sub") {
      const token = randomBytes(16).toString("hex");
      await db.vpnUser.update({ where: { id }, data: { subscriptionToken: token } });
      return NextResponse.json({ ok: true, message: "لینک اشتراک جدید ساخته شد", token });
    }

    return NextResponse.json({ error: "اکشن نامعتبر" }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    console.error("user action error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
