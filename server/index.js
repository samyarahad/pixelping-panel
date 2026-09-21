/**
 * PIXEL PING — Production Edge Server
 * ------------------------------------
 * این سرور در محیط production (مثل Railway) اجرا می‌شود:
 *   1) ترافیک HTTP عادی را به Next.js (standalone) روی پورت داخلی پروکسی می‌کند
 *   2) کانکشن‌های WebSocket با مسیر «/<prefix>/<uuid>» را به عنوان سرور واقعی
 *      پروتکل VLESS (روی WebSocket) می‌پذیرد:
 *        - اعتبارسنجی UUID از دیتابیس (وضعیت/انقضا/سهمیه)
 *        - اتصال TCP به مقصد و عبور دوطرفه داده
 *        - پشتیبانی DNS-over-UDP (فقط پورت 53)
 *        - شمارش ترافیک واقعی هر کاربر و ثبت در دیتابیس
 *
 * اجرا: bun server/index.js
 */

const { spawn } = require("node:child_process");
const dgram = require("node:dgram");
const path = require("node:path");

// مسیر دیتابیس را قبل از ساخت کلاینت Prisma اصلاح کن (صفر-کانفیگ)
const { applyDbPath } = require("./dbpath");
applyDbPath();

const PORT = Number(process.env.PORT || 3000);
const NEXT_INTERNAL_PORT = Number(process.env.NEXT_INTERNAL_PORT || 3001);

// ---------- مکان سرور استندالون ----------
// دو چیدمان ممکن است:
//   ۱) ریپو/توسعه: <cwd>/.next/standalone/server.js
//   ۲) داکر: محتوای standalone در /app کپی شده ⇒ <cwd>/server.js
function resolveStandaloneServer() {
  const fs = require("node:fs");
  const candidates = [
    path.join(process.cwd(), ".next", "standalone", "server.js"),
    path.join(process.cwd(), "server.js"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

// ---------- دیتابیس ----------
let prisma = null;
try {
  const { PrismaClient } = require("@prisma/client");
  prisma = new PrismaClient();
  prisma
    .$executeRawUnsafe("PRAGMA journal_mode=WAL;")
    .then(() => console.log("[pixel-ping] sqlite WAL mode ensured"))
    .catch(() => {});
  console.log("[pixel-ping] database connected");
} catch (e) {
  console.warn("[pixel-ping] prisma unavailable — node-only mode:", e.message);
}

// ---------- شمارش ترافیک ----------
/** uuid -> { up: number, down: number } */
const pending = new Map();

function bump(uuid, up, down) {
  if (up + down <= 0) return;
  let cur = pending.get(uuid);
  if (!cur) {
    cur = { up: 0, down: 0 };
    pending.set(uuid, cur);
  }
  cur.up += up;
  cur.down += down;
}

async function flushTraffic() {
  if (!prisma || pending.size === 0) return;
  const day = new Date().toISOString().slice(0, 10);
  const entries = [...pending.entries()];
  pending.clear();
  for (const [uuid, { up, down }] of entries) {
    try {
      const user = await prisma.vpnUser.findUnique({ where: { uuid }, select: { id: true } });
      if (!user) continue;
      await prisma.vpnUser.update({
        where: { id: user.id },
        data: { usedBytes: { increment: up + down } },
      });
      await prisma.trafficLog.upsert({
        where: { vpnUserId_day: { vpnUserId: user.id, day } },
        update: { upBytes: { increment: up }, downBytes: { increment: down } },
        create: { vpnUserId: user.id, day, upBytes: up, downBytes: down },
      });
    } catch (e) {
      console.error("[pixel-ping] flush error:", e.message);
    }
  }
}
setInterval(flushTraffic, 10_000).unref();

// ---------- اعتبارسنجی کاربر ----------
async function validateUser(uuid) {
  if (!prisma) return { ok: true, user: null }; // حالت node-only: بدون دیتابیس همه مجاز
  const u = await prisma.vpnUser.findUnique({ where: { uuid } });
  if (!u) return { ok: false, reason: "user-not-found" };
  if (u.status !== "active") return { ok: false, reason: "disabled" };
  if (u.expiryDate && u.expiryDate.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (u.quotaBytes > 0 && u.usedBytes >= u.quotaBytes) return { ok: false, reason: "quota-exceeded" };
  return { ok: true, user: u };
}

// ---------- پارس هدر VLESS ----------
// [ver(1) uuid(16) addonLen(1) addons(N) cmd(1) port(2) addrType(1) addr(...)] + payload
function parseVlessHeader(buf) {
  if (buf.length < 24) return null;
  if (buf[0] !== 0) return null;
  const hex = buf.slice(1, 17).toString("hex");
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  const addonLen = buf[17];
  let off = 18 + addonLen;
  if (buf.length < off + 4) return null;
  const cmd = buf[off++];
  const port = buf.readUInt16BE(off);
  off += 2;
  const addrType = buf[off++];
  let host;
  if (addrType === 1) {
    if (buf.length < off + 4) return null;
    host = [...buf.slice(off, off + 4)].join(".");
    off += 4;
  } else if (addrType === 2) {
    const len = buf[off++];
    if (buf.length < off + len) return null;
    host = buf.slice(off, off + len).toString("latin1");
    off += len;
  } else if (addrType === 3) {
    if (buf.length < off + 16) return null;
    const b = buf.slice(off, off + 16);
    off += 16;
    const parts = [];
    for (let i = 0; i < 16; i += 2) parts.push(b.readUInt16BE(i).toString(16));
    host = parts.join(":");
  } else {
    return null;
  }
  return { uuid, cmd, port, host, rest: buf.slice(off) };
}

const RESP_OK = Buffer.from([0, 0]);

// ---------- TCP (cmd=1) ----------
function handleTcp(ws, header) {
  const st = { up: 0, down: 0 };
  ws.data.st = st;
  ws.data.uuid = header.uuid;
  let opened = false;

  Bun.connect({
    hostname: header.host,
    port: header.port,
    socket: {
      open(sock) {
        opened = true;
        ws.data.sock = sock;
        if (ws.readyState === 1) ws.sendBinary(RESP_OK);
        if (header.rest.length) {
          st.up += header.rest.length;
          sock.write(header.rest);
        }
      },
      data(sock, data) {
        st.down += data.length;
        if (ws.readyState === 1) ws.send(data);
      },
      close() {
        bump(header.uuid, st.up, st.down);
        try {
          ws.close();
        } catch {}
      },
      error(err) {
        console.error(`[vless] tcp ${header.host}:${header.port} error:`, err.message);
        bump(header.uuid, st.up, st.down);
        try {
          ws.close(1011, "target connect failed");
        } catch {}
      },
    },
  }).catch(() => {
    try {
      ws.close(1011, "target unreachable");
    } catch {}
  });

  // اگر کلاینت زودتر قطع شد
  ws.data.onClose = () => {
    bump(header.uuid, st.up, st.down);
    if (opened) {
      try {
        ws.data.sock?.end();
      } catch {}
    }
  };
}

// ---------- UDP / DNS (cmd=2) ----------
function handleUdp(ws, header) {
  if (header.port !== 53) {
    ws.close(1008, "udp only supported for dns (port 53)");
    return;
  }
  const st = { up: header.rest.length, down: 0 };
  const udp = dgram.createSocket("udp4");
  udp.on("message", (msg) => {
    st.down += msg.length;
    if (ws.readyState === 1) ws.send(msg);
  });
  udp.on("error", () => {
    bump(header.uuid, st.up, st.down);
    try {
      ws.close();
    } catch {}
  });
  udp.bind(() => {
    if (ws.readyState === 1) ws.sendBinary(RESP_OK);
    udp.send(header.rest, header.port, header.host);
  });
  ws.data.onClose = () => {
    bump(header.uuid, st.up, st.down);
    try {
      udp.close();
    } catch {}
  };
}

// ---------- هندل پیام اول ----------
function handleVless(ws, firstMsg) {
  const buf = Buffer.isBuffer(firstMsg) ? firstMsg : Buffer.from(firstMsg);
  const header = parseVlessHeader(buf);
  if (!header) {
    ws.close(1008, "bad vless header");
    return;
  }
  // UUID داخل هدر باید با UUID مسیر یکی باشد
  if (ws.data.uuidInPath && header.uuid.toLowerCase() !== ws.data.uuidInPath) {
    ws.close(1008, "uuid mismatch");
    return;
  }

  validateUser(header.uuid)
    .then((v) => {
      if (!v.ok) {
        console.log(`[vless] reject (${v.reason}) uuid=${header.uuid}`);
        ws.close(1008, "rejected: " + v.reason);
        return;
      }
      if (header.cmd === 1) handleTcp(ws, header);
      else if (header.cmd === 2) handleUdp(ws, header);
      else ws.close(1008, "unsupported command");
    })
    .catch((e) => {
      console.error("[vless] validate error:", e.message);
      ws.close(1011, "internal error");
    });
}

// ---------- اجرای Next standalone ----------
function startNext() {
  const standalone = resolveStandaloneServer();
  if (!standalone) {
    console.warn("[pixel-ping] standalone server not found — node-only mode (no HTTP panel)");
    return;
  }
  const child = spawn("bun", [standalone], {
    env: { ...process.env, PORT: String(NEXT_INTERNAL_PORT), HOSTNAME: "127.0.0.1" },
    stdio: "inherit",
  });
  child.on("exit", (code) => {
    console.error(`[pixel-ping] next exited (code ${code}) — restart in 3s`);
    setTimeout(startNext, 3000);
  });
  console.log(`[pixel-ping] next.js on internal port ${NEXT_INTERNAL_PORT}`);
}

// ---------- سرور لبه ----------
function proxyFetch(req) {
  const url = new URL(req.url);
  const target = `http://127.0.0.1:${NEXT_INTERNAL_PORT}${url.pathname}${url.search}`;
  return fetch(target, {
    method: req.method,
    headers: req.headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    duplex: "half",
  }).catch(() => new Response("PIXEL PING: upstream unavailable", { status: 502 }));
}

Bun.serve({
  port: PORT,
  async fetch(req, sv) {
    const url = new URL(req.url);
    const m = url.pathname.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    if (m) {
      const ok = sv.upgrade(req, {
        data: { uuidInPath: m[1].toLowerCase(), sock: null, st: null, onClose: null, handshaken: false },
      });
      if (ok) return;
      return new Response("websocket upgrade failed", { status: 400 });
    }
    if (!prisma) {
      return new Response("PIXEL PING edge node is running (node-only mode)", { status: 200 });
    }
    return proxyFetch(req);
  },
  websocket: {
    message(ws, msg) {
      if (!ws.data.handshaken) {
        ws.data.handshaken = true;
        handleVless(ws, msg);
        return;
      }
      const sock = ws.data.sock;
      if (sock && ws.data.st) {
        const buf = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
        ws.data.st.up += buf.length;
        sock.write(buf);
      }
    },
    close(ws) {
      ws.data.onClose?.();
    },
  },
});

startNext();
console.log(`[pixel-ping] edge server listening on :${PORT}`);
