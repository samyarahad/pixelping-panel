# ---------- مرحله ساخت ----------
FROM oven/bun:1.2 AS builder
WORKDIR /app

# نصب وابستگی‌ها
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# کپی سورس و ساخت
COPY . .
RUN bunx prisma generate
# اسکیمای آماده SQLite برای استارت سریع و بدون Prisma CLI در زمان اجرا
# (اگر تولید ناموفق بود، نسخه کامیت‌شده prisma/init.sql استفاده می‌شود)
RUN (bunx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/init.sql \
     && mv /tmp/init.sql prisma/init.sql) \
    || echo "[build] init.sql generation failed — keeping committed prisma/init.sql"
RUN DATABASE_URL=file:/tmp/build.db bun run build

# ---------- مرحله اجرا ----------
FROM oven/bun:1.2 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/pixelping.db
ENV PORT=3000
ENV NEXT_INTERNAL_PORT=3001

# خروجی استندالون (شامل server.js و .next و static و public و node_modules مینیمال)
COPY --from=builder /app/.next/standalone ./

# سرور لبه (پروکسی HTTP + نود VLESS داخلی) + بوت‌استرپ دیتابیس
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma/init.sql ./prisma/init.sql

# کلاینت Prisma در زمان اجرا (شامل کوئری‌انجین) — به کل CLI نیازی نیست
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# ساخت اسکیمای دیتابیس با bun:sqlite و اجرای سرور لبه (پنل + نود VLESS)
CMD ["sh", "-c", "mkdir -p /data && bun server/migrate.js && exec bun server/index.js"]
