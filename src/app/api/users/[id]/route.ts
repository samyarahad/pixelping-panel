import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, AuthError } from "@/lib/auth";
import { effectiveStatus } from "@/lib/sub";

const GB = 1024 * 1024 * 1024;

function serialize(u: {
  id: string;
  username: string;
  note: string | null;
  status: string;
  quotaBytes: number;
  usedBytes: number;
  expiryDate: Date | null;
  uuid: string;
  subscriptionToken: string;
  createdAt: Date;
}) {
  return {
    id: u.id,
    username: u.username,
    note: u.note,
    status: u.status,
    effectiveStatus: effectiveStatus(u),
    quotaGB: u.quotaBytes === 0 ? 0 : +(u.quotaBytes / GB).toFixed(2),
    usedGB: +(u.usedBytes / GB).toFixed(2),
    usedBytes: u.usedBytes,
    quotaBytes: u.quotaBytes,
    expiryDate: u.expiryDate?.toISOString() ?? null,
    uuid: u.uuid,
    subscriptionToken: u.subscriptionToken,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const user = await db.vpnUser.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    return NextResponse.json({ user: serialize(user) });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const existing = await db.vpnUser.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });

    const data: Record<string, unknown> = {};

    if (body?.note !== undefined) data.note = body.note ? String(body.note).slice(0, 300) : null;
    if (body?.status !== undefined) {
      if (!["active", "disabled"].includes(body.status)) {
        return NextResponse.json({ error: "وضعیت نامعتبر" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body?.quotaGB !== undefined) {
      const q = Number(body.quotaGB);
      if (q < 0 || q > 1024 * 100) return NextResponse.json({ error: "حجم نامعتبر" }, { status: 400 });
      data.quotaBytes = q > 0 ? q * GB : 0;
    }
    if (body?.expiryDays !== undefined) {
      const d = Number(body.expiryDays);
      if (d < 0) return NextResponse.json({ error: "روز نامعتبر" }, { status: 400 });
      data.expiryDate = d > 0 ? new Date(Date.now() + d * 24 * 60 * 60 * 1000) : null;
    }
    // تمدید: افزودن روز به تاریخ انقضای فعلی
    if (body?.extendDays !== undefined) {
      const d = Number(body.extendDays);
      if (d <= 0) return NextResponse.json({ error: "روز نامعتبر" }, { status: 400 });
      const base = existing.expiryDate && existing.expiryDate.getTime() > Date.now()
        ? existing.expiryDate.getTime()
        : Date.now();
      data.expiryDate = new Date(base + d * 24 * 60 * 60 * 1000);
    }
    // افزودن حجم به سهمیه فعلی
    if (body?.addGB !== undefined) {
      const g = Number(body.addGB);
      if (g <= 0) return NextResponse.json({ error: "حجم نامعتبر" }, { status: 400 });
      const baseQuota = existing.quotaBytes > 0 ? existing.quotaBytes : existing.usedBytes;
      data.quotaBytes = baseQuota + g * GB;
    }

    const updated = await db.vpnUser.update({ where: { id }, data });
    return NextResponse.json({ user: serialize(updated) });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    console.error("user PUT error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    await db.vpnUser.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    console.error("user DELETE error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
