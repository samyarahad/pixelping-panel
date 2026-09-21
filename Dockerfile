# ---------- مرحله ساخت ----------
FROM oven/bun:1.2 AS builder
WORKDIR /app

# نصب وابستگی‌ها
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# کپی سورس و ساخت
COPY . .
RUN bunx prisma generate
RUN DATABASE_URL=file:/tmp/build.db bun run build

# ---------- مرحله اجرا ----------
FROM oven/bun:1.2 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/x4g.db
ENV PORT=3000
ENV NEXT_INTERNAL_PORT=3001

# خروجی استندالون (شامل static و public و node_modules مینیمال)
COPY --from=builder /app/.next/standalone ./

# سرور لبه (پروکسی HTTP + نود VLESS داخلی)
COPY --from=builder /app/server ./server

# Prisma CLI + کلاینت تولیدشده برای مایگریشن هنگام استارت
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# همگام‌سازی دیتابیس و اجرای سرور لبه (پنل + نود VLESS)
CMD ["sh", "-c", "mkdir -p /data && ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss && exec bun server/index.js"]
