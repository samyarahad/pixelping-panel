import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SESSION_COOKIE = "pixelping_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 روز

// مقادیر نمونه/پیش‌فرض که نباید در پروداکشن استفاده شوند → خودکار می‌سازیم
const PLACEHOLDER_SECRET = /^(pixelping|x4g)-(change-this|panel-dev-secret|dev-secret)/i;

let cachedSecret: string | null = null;
let secretPromise: Promise<string> | null = null;

/**
 * کلید امضای نشست — صفر-کانفیگ:
 *   ۱) اگر SESSION_SECRET واقعی تنظیم شده باشد از همان استفاده می‌شود
 *   ۲) وگرنه یک کلید تصادفی قوی ساخته، در دیتابیس (جدول Setting) ذخیره
 *      و در اجراهای بعدی از دیتابیس خوانده می‌شود
 */
export function getSessionSecret(): Promise<string> {
  if (cachedSecret) return Promise.resolve(cachedSecret);
  if (!secretPromise) {
    secretPromise = resolveSecret()
      .then((s) => {
        cachedSecret = s;
        return s;
      })
      .catch((e) => {
        secretPromise = null;
        throw e;
      });
  }
  return secretPromise;
}

async function resolveSecret(): Promise<string> {
  const env = (process.env.SESSION_SECRET || "").trim();
  if (env.length >= 16 && !PLACEHOLDER_SECRET.test(env)) return env;

  try {
    const row = await db.setting.findUnique({ where: { key: "sessionSecret" } });
    if (row?.value) return row.value;

    const generated = randomBytes(32).toString("hex");
    try {
      await db.setting.create({ data: { key: "sessionSecret", value: generated } });
      console.log("[auth] SESSION_SECRET auto-generated and persisted to database");
    } catch {
      // مسابقه‌ی ایجاد همزمان — دوباره بخوان
      const again = await db.setting.findUnique({ where: { key: "sessionSecret" } });
      if (again?.value) return again.value;
    }
    return generated;
  } catch {
    // دیتابیس در دسترس نیست — آخرین راه
    return env || "pixelping-dev-secret-change-me";
  }
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

// ---------- رمزنگاری پسورد (scrypt) ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const hashBuf = Buffer.from(hash, "hex");
    const testBuf = scryptSync(password, salt, 64);
    return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
  } catch {
    return false;
  }
}

// ---------- توکن نشست (HMAC امضا شده) ----------
interface SessionPayload {
  sub: string; // admin id
  username: string;
  role: string;
  exp: number;
}

export async function createSessionToken(admin: {
  id: string;
  username: string;
  role: string;
}): Promise<string> {
  const secret = await getSessionSecret();
  const payload: SessionPayload = {
    sub: admin.id,
    username: admin.username,
    role: admin.role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const secret = await getSessionSecret();
    const expected = sign(body, secret);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- دسترسی از Route Handler ----------
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError();
  return session;
}

export class AuthError extends Error {
  constructor() {
    super("UNAUTHORIZED");
  }
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}
