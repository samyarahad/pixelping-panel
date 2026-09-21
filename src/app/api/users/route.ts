import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { db } from "@/lib/db";
import { requireSession, AuthError } from "@/lib/auth";
import { ensureSeed, getSettings } from "@/lib/seed";
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
  updatedAt: Date;
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

export async function GET() {
  try {
    await ensureSeed();
    await requireSession();
    const users = await db.vpnUser.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ users: users.map(serialize) });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    console.error("users GET error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    await requireSession();
    const body = await req.json().catch(() => null);

    const username = String(body?.username || "").trim();
    if (!username || !/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      return NextResponse.json(
        { error: "نام کاربری باید ۳ تا ۳۲ کاراکتر و فقط شامل حروف انگلیسی، عدد و _ باشد" },
        { status: 400 }
      );
    }

    const exists = await db.vpnUser.findUnique({ where: { username } });
    if (exists) {
      return NextResponse.json({ error: "این نام کاربری قبلاً ثبت شده است" }, { status: 409 });
    }

    const quotaGB = Number(body?.quotaGB ?? 0);
    if (quotaGB < 0 || quotaGB > 1024 * 100) {
      return NextResponse.json({ error: "حجم نامعتبر است" }, { status: 400 });
    }
    const expiryDays = Number(body?.expiryDays ?? 0);
    const protocols = await getSettings().then((s) => (s.protocols || "").split(","));

    const created = await db.vpnUser.create({
      data: {
        username,
        note: body?.note ? String(body.note).slice(0, 300) : null,
        status: "active",
        quotaBytes: quotaGB > 0 ? quotaGB * GB : 0,
        expiryDate: expiryDays > 0 ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null,
        uuid: randomUUID(),
        subscriptionToken: randomBytes(16).toString("hex"),
      },
    });

    return NextResponse.json({ user: serialize(created), protocols }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    console.error("users POST error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
