import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, AuthError } from "@/lib/auth";
import { ensureSeed, getSettings } from "@/lib/seed";
import { effectiveStatus } from "@/lib/sub";

const GB = 1024 * 1024 * 1024;

export async function GET() {
  try {
    await ensureSeed();
    await requireSession();
    const s = await getSettings();
    const demoMode = s.demoMode === "1";

    // شبیه‌سازی ترافیک زنده در حالت دمو
    if (demoMode) {
      const actives = await db.vpnUser.findMany({
        where: { status: "active" },
        select: { id: true, usedBytes: true, quotaBytes: true },
      });
      const today = new Date().toISOString().slice(0, 10);
      for (const u of actives) {
        if (u.quotaBytes > 0 && u.usedBytes >= u.quotaBytes) continue;
        const down = Math.random() * 120 * 1024 * 1024; // تا ~120MB هر پول
        const up = down * (0.1 + Math.random() * 0.15);
        await db.vpnUser.update({
          where: { id: u.id },
          data: { usedBytes: { increment: down + up } },
        });
        await db.trafficLog.upsert({
          where: { vpnUserId_day: { vpnUserId: u.id, day: today } },
          update: { downBytes: { increment: down }, upBytes: { increment: up } },
          create: { vpnUserId: u.id, day: today, downBytes: down, upBytes: up },
        });
      }
    }

    const users = await db.vpnUser.findMany();
    const stats = {
      total: users.length,
      active: 0,
      disabled: 0,
      expired: 0,
      limitReached: 0,
      onlineUsers: 0,
      totalUsedGB: 0,
      totalQuotaGB: 0,
      unlimitedUsers: 0,
    };
    for (const u of users) {
      const st = effectiveStatus(u);
      if (st === "active") stats.active++;
      else if (st === "disabled") stats.disabled++;
      else if (st === "expired") stats.expired++;
      else if (st === "limit") stats.limitReached++;
      stats.totalUsedGB += u.usedBytes;
      if (u.quotaBytes === 0) stats.unlimitedUsers++;
      else stats.totalQuotaGB += u.quotaBytes;
    }
    stats.totalUsedGB = +(stats.totalUsedGB / GB).toFixed(2);
    stats.totalQuotaGB = +(stats.totalQuotaGB / GB).toFixed(2);
    // کاربران آنلاین (تقریبی بر اساس سهمی از کاربران فعال در حالت دمو)
    stats.onlineUsers = demoMode ? Math.round(stats.active * (0.35 + Math.random() * 0.25)) : 0;

    // نمودار ۳۰ روز
    const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const logs = await db.trafficLog.groupBy({
      by: ["day"],
      where: { day: { gte: since } },
      _sum: { upBytes: true, downBytes: true },
      orderBy: { day: "asc" },
    });
    const chart = logs.map((l) => ({
      day: l.day,
      downGB: +((l._sum.downBytes || 0) / GB).toFixed(2),
      upGB: +((l._sum.upBytes || 0) / GB).toFixed(2),
    }));

    // برترین مصرف‌کننده‌ها
    const top = await db.vpnUser.findMany({
      orderBy: { usedBytes: "desc" },
      take: 5,
      select: { username: true, usedBytes: true, quotaBytes: true, status: true, expiryDate: true },
    });
    const topUsers = top.map((u) => ({
      username: u.username,
      usedGB: +(u.usedBytes / GB).toFixed(1),
      quotaGB: u.quotaBytes === 0 ? 0 : +(u.quotaBytes / GB).toFixed(1),
      effectiveStatus: effectiveStatus(u),
    }));

    return NextResponse.json({ stats, chart, topUsers, demoMode });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    console.error("stats error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
