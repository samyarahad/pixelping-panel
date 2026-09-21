/**
 * PIXEL PING — Runtime DB Bootstrap (بدون وابستگی)
 * ------------------------------------------------
 * به جای «prisma db push» در زمان استارت (که نیازمند کل Prisma CLI و
 * ده‌ها پکیج جانبی مثل effect است)، این اسکریپت با bun:sqlite داخلی،
 * اسکیمای آماده‌شده در prisma/init.sql را در دیتابیس می‌سازد.
 *
 * منطق:
 *   - اگر جدول PanelAdmin موجود باشد ⇒ اسکیما هست، هیچ کاری نکن
 *   - اگر نباشد ⇒ prisma/init.sql را در یک تراکنش اجرا کن
 *
 * اجرا: DATABASE_URL=file:/data/pixelping.db bun server/migrate.js
 */

const { Database } = require("bun:sqlite");
const fs = require("node:fs");
const path = require("node:path");

function resolveDbPath() {
  const raw = process.env.DATABASE_URL || "file:/data/pixelping.db";
  let p = raw.replace(/^file:/, "");
  // آدرس نسبی نسبت به پوشه اجرا
  if (!path.isAbsolute(p)) p = path.join(process.cwd(), p);
  return p;
}

const DB_PATH = resolveDbPath();
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

try {
  db.exec("PRAGMA journal_mode=WAL;");

  const exists = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name='PanelAdmin'")
    .get();

  if (exists) {
    console.log("[pixel-ping] database schema already present — skip init");
  } else {
    const sqlPath = path.join(process.cwd(), "prisma", "init.sql");
    if (!fs.existsSync(sqlPath)) {
      console.error("[pixel-ping] FATAL: prisma/init.sql not found next to the app");
      process.exit(1);
    }
    const sql = fs.readFileSync(sqlPath, "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.exec("COMMIT");
      console.log("[pixel-ping] database schema created:", DB_PATH);
    } catch (e) {
      db.exec("ROLLBACK");
      console.error("[pixel-ping] schema init failed:", e.message);
      process.exit(1);
    }
  }
} finally {
  db.close();
}
