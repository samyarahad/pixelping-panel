import { randomBytes, randomUUID } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

let seedPromise: Promise<void> | null = null;

/** یک‌بار در طول عمر پروسس اجرا می‌شود */
export function ensureSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = doSeed().catch((e) => {
      seedPromise = null;
      throw e;
    });
  }
  return seedPromise;
}

async function doSeed(): Promise<void> {
  // ۱) ادمین پیش‌فرض
  const adminCount = await db.panelAdmin.count();
  if (adminCount === 0) {
    await db.panelAdmin.create({
      data: {
        username: process.env.DEFAULT_ADMIN_USER || "admin",
        passwordHash: hashPassword(process.env.DEFAULT_ADMIN_PASS || "admin123"),
        role: "admin",
      },
    });
    console.log("[seed] default admin created (admin / admin123)");
  }

  // ۲) کاربران نمونه
  const vpnUserCount = await db.vpnUser.count();
  if (vpnUserCount === 0) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const GB = 1024 * 1024 * 1024;

    const samples = [
      { username: "ali_reza", note: "پلن ماهانه ۵۰GB", quota: 50 * GB, used: 23.4 * GB, expiry: now + 30 * day, status: "active" },
      { username: "sara_m", note: "پلن نامحدود ویژه", quota: 0, used: 187.2 * GB, expiry: now + 90 * day, status: "active" },
      { username: "reza_gaming", note: "پلن گیمینگ", quota: 100 * GB, used: 98.7 * GB, expiry: now + 15 * day, status: "active" },
      { username: "mohammad_h", note: "پلن اقتصادی", quota: 20 * GB, used: 4.1 * GB, expiry: now + 7 * day, status: "active" },
      { username: "neda_k", note: "پلن دانشجویی", quota: 30 * GB, used: 12.5 * GB, expiry: now - 2 * day, status: "active" },
      { username: "old_user1", note: "غیرفعال - عدم تمدید", quota: 10 * GB, used: 9.9 * GB, expiry: now - 30 * day, status: "disabled" },
      { username: "test_user", note: "حساب تست", quota: 5 * GB, used: 0.3 * GB, expiry: now + 3 * day, status: "active" },
    ];

    for (const s of samples) {
      await db.vpnUser.create({
        data: {
          username: s.username,
          note: s.note,
          status: s.status,
          quotaBytes: s.quota,
          usedBytes: s.used,
          expiryDate: new Date(s.expiry),
          uuid: randomUUID(),
          subscriptionToken: randomBytes(16).toString("hex"),
        },
      });
    }
    console.log("[seed] sample vpn users created");
  }

  // ۳) لاگ ترافیک ۳۰ روز اخیر (برای نمودار)
  const logCount = await db.trafficLog.count();
  if (logCount === 0) {
    const users = await db.vpnUser.findMany({ select: { id: true } });
    const GB = 1024 * 1024 * 1024;
    const today = new Date();
    const logs: { vpnUserId: string; day: string; upBytes: number; downBytes: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().slice(0, 10);
      // الگوی هفتگی: آخر هفته ترافیک بیشتر
      const weekday = d.getDay();
      const base = (weekday === 4 || weekday === 5 ? 220 : 140) * GB / users.length;
      for (const u of users) {
        const noise = 0.4 + Math.random() * 1.3;
        const down = base * noise;
        const up = down * (0.12 + Math.random() * 0.1);
        logs.push({ vpnUserId: u.id, day: dayStr, upBytes: up, downBytes: down });
      }
    }
    // چانک برای جلوگیری از کوئری خیلی بزرگ
    for (let i = 0; i < logs.length; i += 200) {
      await db.trafficLog.createMany({ data: logs.slice(i, i + 200) });
    }
    console.log("[seed] 30 days traffic logs created");
  }

  // ۴) تنظیمات پیش‌فرض
  const defaults: Record<string, string> = {
    panelName: "PIXEL PING",
    nodeHost: "", // خالی = نود داخلی (خود پنل روی Railway)
    nodePort: "443",
    wsPath: "/pixelws",
    sni: "", // خالی = دامنه نود
    protocols: "vmess,vless,trojan,shadowsocks",
    demoMode: "1",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
}

/** تنظیمات را به صورت آبجکت برمی‌گرداند */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany();
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}
