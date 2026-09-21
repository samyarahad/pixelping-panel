/**
 * PIXEL PING — مسیر دیتابیس (صفر-کانفیگ)
 * ----------------------------------------
 * ترتیب: مسیر DATABASE_URL (اگر پوشه‌اش قابل ساخت/نوشتن باشد)
 *       → /data/pixelping.db (ولوم Railway)
 *       → <cwd>/data/pixelping.db (بدون ولوم — فایل محلی)
 */

const fs = require("node:fs");
const path = require("node:path");

function tryUse(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDbPath() {
  const raw = (process.env.DATABASE_URL || "").trim();
  const candidates = [];
  if (raw) candidates.push(raw.replace(/^file:/, ""));
  candidates.push("/data/pixelping.db", path.join(process.cwd(), "data", "pixelping.db"));

  for (const c of candidates) {
    const abs = path.isAbsolute(c) ? c : path.join(process.cwd(), c);
    if (tryUse(path.dirname(abs))) return abs;
  }
  return path.join(process.cwd(), "data", "pixelping.db");
}

/** DATABASE_URL را در process.env به مسیر قطعیِ قابل‌نوشتن اصلاح می‌کند و مسیر را برمی‌گرداند */
function applyDbPath() {
  const abs = resolveDbPath();
  process.env.DATABASE_URL = "file:" + abs;
  return abs;
}

module.exports = { resolveDbPath, applyDbPath };
