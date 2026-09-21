import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed, getSettings } from "@/lib/seed";
import {
  buildConfigs,
  encodeSubscription,
  isExpired,
  isQuotaFinished,
  resolveNode,
  subscriptionHeaders,
  type SubUserInfo,
} from "@/lib/sub";

/**
 * اندپوینت عمومی اشتراک — کلاینت‌ها (v2rayNG، Hiddify، Streisand و ...)
 * این آدرس را به صورت لینک اشتراک استفاده می‌کنند:
 *   https://<panel-domain>/api/sub/<token>
 * نسخه base64: ?b64=0 برای متن ساده
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await ensureSeed();
    const { token } = await params;
    const user = await db.vpnUser.findUnique({ where: { subscriptionToken: token } });
    if (!user) {
      return new NextResponse("subscription not found", { status: 404 });
    }

    if (user.status === "disabled" || isExpired(user) || isQuotaFinished(user)) {
      return new NextResponse("subscription disabled", { status: 403 });
    }

    const s = await getSettings();
    const protocols = (s.protocols || "vmess,vless,trojan,shadowsocks").split(",").filter(Boolean);

    const subInfo: SubUserInfo = {
      username: user.username,
      uuid: user.uuid,
      upload: 0,
      download: Math.round(user.usedBytes),
      total: Math.round(user.quotaBytes),
      expire: user.expiryDate ? Math.floor(user.expiryDate.getTime() / 1000) : 0,
    };

    // نود: اگر nodeHost خالی باشد، خودِ پنل (دامنه درخواست) استفاده می‌شود
    const reqHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
    const reqProto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "");
    const node = await resolveNode(subInfo, reqHost, reqProto);

    const configs = await buildConfigs(subInfo, protocols, node);

    const wantPlain = req.nextUrl.searchParams.get("b64") === "0";
    const body = encodeSubscription(configs, !wantPlain);
    const headers = subscriptionHeaders(subInfo, `PIXEL-${user.username}`);

    return new NextResponse(body, { status: 200, headers });
  } catch (e) {
    console.error("sub error:", e);
    return new NextResponse("server error", { status: 500 });
  }
}
