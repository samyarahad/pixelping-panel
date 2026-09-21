<div dir="rtl">

# 📡 PIXEL PING

**پنل مدیریت VPN دوزبانه (فارسی / English) با نود VLESS داخلی — آماده دیپلوی روی Railway**

<div dir="ltr">

**Bilingual (FA/EN) VPN management panel with a built-in VLESS node — Railway-ready.**

</div>

---

## ✨ امکانات

- 🛰️ **نود VLESS داخلی** — خود پنل سرور VLESS (روی WebSocket) دارد؛ بدون نیاز به VPS اضافه، کاربران مستقیم از دامنه پنل وصل می‌شوند
- 🔐 **اعتبارسنجی واقعی هر کانکشن** — بررسی UUID، وضعیت، انقضا و سهمیه از دیتابیس
- 📊 **شمارش ترافیک واقعی** — بایت‌های up/down هر کاربر هر ۱۰ ثانیه در دیتابیس ثبت می‌شود
- 👥 **مدیریت کاربران** — ساخت/حذف کاربر، سهمیه حجم، تاریخ انقضا، فعال/غیرفعال، ریست ترافیک، ریست توکن
- 🔗 **لینک اشتراک + QR** — سازگار با v2rayNG، Hiddify، Streisand و ... با هدر استاندارد `Subscription-Userinfo`
- 📈 **داشبورد زنده** — آمار لحظه‌ای، نمودار ترافیک ۳۰ روزه، برترین مصرف‌کننده‌ها
- 🌐 **دوزبانه** — فارسی (RTL) و انگلیسی (LTR) با سوییچ فوری و ذخیره انتخاب
- 🎨 **UI اختصاصی** — تم سرمه‌ای تیره با نئون آبی، افکت دنباله موس، موج‌های متحرک، لوگوی پیکسل‌آرت
- 🚄 **آماده Railway** — Dockerfile + railway.json + healthcheck

## 🛠 تکنولوژی

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma (SQLite) · Recharts · Bun (edge server + VLESS)

## 🚄 دیپلوی روی Railway

راهنمای کامل قدم‌به‌قدم: [`RAILWAY-DEPLOY.md`](./RAILWAY-DEPLOY.md)

خلاصه:

1. در Railway: **New Project → Deploy from GitHub repo** → این ریپو را انتخاب کنید
2. یک **Volume** با مسیر `/data` به سرویس اضافه کنید
3. متغیرهای محیطی: `DATABASE_URL=file:/data/pixelping.db` و `SESSION_SECRET` (تصادفی)
4. **Generate Domain** بگیرید — تمام!

ورود پیش‌فرض: `admin / admin123` — بلافاصله از تنظیمات عوضش کنید.

## 🖥 اجرای محلی

```bash
bun install
bun run db:push
bun run dev          # پنل روی http://localhost:3000
```

اجرای نود VLESS به صورت مستقل (production):

```bash
bun run build
bun server/index.js  # پنل + نود روی یک پورت
```

## 📁 ساختار

```
├── src/app/api/            # APIها: auth, users, stats, settings, sub, health
├── src/components/panel/   # UI پنل (دوزبانه): داشبورد، کاربران، تنظیمات
├── src/lib/                # auth (نشست+رمز)، seed، sub (تولید کانفیگ)
├── server/index.js         # سرور لبه production: پروکسی HTTP + نود VLESS
├── prisma/schema.prisma    # PanelAdmin, VpnUser, TrafficLog, Setting
├── public/logo.svg         # لوگوی PIXEL PING
├── Dockerfile              # بیلد multi-stage برای Railway
└── railway.json            # تنظیمات دیپلوی Railway
```

## 🔒 امنیت

- پسوردها با `scrypt` هش می‌شوند؛ نشست‌ها کوکی `httpOnly` امضاشده (HMAC-SHA256) هستند
- هر کانکشن VLESS قبل از اتصال، اعتبار کاربر را از دیتابیس چک می‌کند
- برای هر کاربر یک UUID و توکن اشتراک یکتا تولید می‌شود (قابل ریست)

</div>
