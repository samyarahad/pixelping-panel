import { getSettings } from "@/lib/seed";

const B64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

export interface SubUserInfo {
  username: string;
  uuid: string;
  upload: number;
  download: number;
  total: number; // 0 = unlimited
  expire: number; // unix seconds, 0 = never
}

/** هدر استاندارد اشتراک برای کلاینت‌ها (v2rayNG, Streisand, Hiddify و ...) */
export function subscriptionHeaders(u: SubUserInfo, profileTitle: string): Record<string, string> {
  return {
    "Content-Type": "text/plain; charset=utf-8",
    "Profile-Title": B64(profileTitle),
    "Profile-Update-Interval": "6",
    "Subscription-Userinfo": `upload=${Math.round(u.upload)}; download=${Math.round(u.download)}; total=${Math.round(u.total)}; expire=${u.expire}`,
  };
}

export interface NodeParams {
  host: string;
  port: number;
  wsPath: string; // شامل /uuid
  sni: string;
  tls: boolean;
}

/**
 * محاسبه پارامترهای نود برای یک کاربر.
 * اگر nodeHost در تنظیمات خالی باشد، خودِ پنل به عنوان نود استفاده می‌شود
 * (سرور VLESS داخلی روی همین دامنه فعال است).
 */
export async function resolveNode(
  u: SubUserInfo,
  reqHost?: string | null,
  reqProto?: string
): Promise<NodeParams> {
  const s = await getSettings();
  const wsBase = (s.wsPath || "/pixelws").replace(/\/+$/, "");
  const wsPath = `${wsBase}/${u.uuid}`;

  const external = !!(s.nodeHost && s.nodeHost.trim());
  if (external) {
    const port = Number(s.nodePort || "443") || 443;
    return {
      host: s.nodeHost.trim(),
      port,
      wsPath,
      sni: s.sni?.trim() || s.nodeHost.trim(),
      tls: port === 443 || s.sni?.trim() !== "",
    };
  }

  // نود داخلی = دامنه خود پنل
  const raw = reqHost || "localhost";
  // جدا کردن پورت احتمالی (مثل localhost:3000) — IPv6 literal بدون براکت نادیده گرفته می‌شود
  let host = raw;
  let portFromHost: number | null = null;
  const m = raw.match(/^(.+):(\d+)$/);
  if (m && !m[1].includes("::")) {
    host = m[1].replace(/^\[|\]$/g, "");
    portFromHost = Number(m[2]);
  }
  const tls = reqProto === "https" || reqProto === "on";
  const port = portFromHost ?? (tls ? 443 : 80);
  return { host, port, wsPath, sni: host, tls };
}

/**
 * لیست کانفیگ‌های یک کاربر را بر اساس پروتکل‌های فعال برمی‌گرداند.
 */
export async function buildConfigs(
  u: SubUserInfo,
  protocols: string[],
  node?: NodeParams
): Promise<string[]> {
  const n =
    node ??
    (await resolveNode(u, null, "https"));
  const { host, port, wsPath, sni, tls } = n;
  const name = encodeURIComponent(`PIXEL-${u.username}`);
  const sec = tls ? "tls" : "none";
  const out: string[] = [];

  if (protocols.includes("vmess")) {
    const vmessJson = {
      v: "2",
      ps: `PIXEL-${u.username}`,
      add: host,
      port: String(port),
      id: u.uuid,
      aid: "0",
      scy: "auto",
      net: "ws",
      type: "none",
      host: "",
      path: wsPath,
      tls: tls ? "tls" : "",
      sni,
      alpn: "",
      fp: "chrome",
    };
    out.push("vmess://" + B64(JSON.stringify(vmessJson)));
  }

  if (protocols.includes("vless")) {
    const params = new URLSearchParams({
      type: "ws",
      path: wsPath,
      security: sec,
      fp: "chrome",
      alpn: "h2,http/1.1",
    });
    if (tls) {
      params.set("sni", sni);
      params.set("host", sni);
    }
    out.push(`vless://${u.uuid}@${host}:${port}?${params.toString()}#${name}`);
  }

  if (protocols.includes("trojan")) {
    const params = new URLSearchParams({
      type: "ws",
      path: wsPath,
      security: sec,
      fp: "chrome",
      alpn: "h2,http/1.1",
    });
    if (tls) {
      params.set("sni", sni);
      params.set("host", sni);
    }
    // برای trojan پسورد همان UUID است
    out.push(`trojan://${u.uuid}@${host}:${port}?${params.toString()}#${name}`);
  }

  if (protocols.includes("shadowsocks")) {
    const method = "chacha20-ietf-poly1305";
    const pass = u.uuid.replace(/-/g, "").slice(0, 16);
    const userinfo = B64(`${method}:${pass}`);
    out.push(`ss://${userinfo}@${host}:${port}?type=ws&path=${encodeURIComponent(wsPath)}#${name}`);
  }

  return out;
}

export function encodeSubscription(lines: string[], base64 = true): string {
  const raw = lines.join("\n");
  return base64 ? B64(raw) : raw;
}

export function isExpired(u: { expiryDate: Date | null }): boolean {
  return !!u.expiryDate && u.expiryDate.getTime() < Date.now();
}

export function isQuotaFinished(u: { quotaBytes: number; usedBytes: number }): boolean {
  return u.quotaBytes > 0 && u.usedBytes >= u.quotaBytes;
}

/** وضعیت مؤثر کاربر با توجه به انقضا/سهمیه */
export function effectiveStatus(u: {
  status: string;
  expiryDate: Date | null;
  quotaBytes: number;
  usedBytes: number;
}): "active" | "disabled" | "expired" | "limit" {
  if (u.status === "disabled") return "disabled";
  if (isExpired(u)) return "expired";
  if (isQuotaFinished(u)) return "limit";
  return "active";
}
