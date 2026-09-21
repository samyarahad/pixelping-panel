"use client";

import { Users, UserCheck, Activity, Database, TrendingUp, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useI18n } from "./i18n";
import { statusColors, type StatsResponse } from "./types";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  tint,
  pulse,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  pulse?: boolean;
}) {
  return (
    <Card className="glass-card border-border/60 hover:border-primary/35 transition-colors">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
          <Icon className={`w-6 h-6 ${pulse ? "animate-pulse" : ""}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-extrabold num leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardView({ data, refreshing }: { data: StatsResponse | null; refreshing: boolean }) {
  const { t, num, lang } = useI18n();

  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-card h-[92px] animate-pulse" />
        ))}
      </div>
    );
  }

  const { stats, chart, topUsers, demoMode } = data;
  const maxTop = Math.max(...topUsers.map((u) => u.usedGB), 1);
  const stLabel = (s: string) =>
    s === "active" ? t("stActive") : s === "disabled" ? t("stDisabled") : s === "expired" ? t("stExpired") : t("stLimit");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("totalUsers")}
          value={num(stats.total)}
          sub={`${num(stats.disabled)} ${t("disabledN")}`}
          icon={Users}
          tint="bg-blue-500/15 text-blue-300"
        />
        <StatCard
          title={t("activeUsers")}
          value={num(stats.active)}
          sub={`${num(stats.expired)} ${t("expiredN")} · ${num(stats.limitReached)} ${t("limitN")}`}
          icon={UserCheck}
          tint="bg-cyan-500/15 text-cyan-300"
        />
        <StatCard
          title={t("onlineNow")}
          value={num(stats.onlineUsers)}
          sub={t("connectedUsers")}
          icon={Activity}
          tint="bg-blue-600/20 text-blue-300"
          pulse={refreshing}
        />
        <StatCard
          title={t("totalUsed")}
          value={`${num(stats.totalUsedGB, 1)} GB`}
          sub={
            stats.unlimitedUsers > 0
              ? `${num(stats.unlimitedUsers)} ${t("unlimitedN")}`
              : `${t("ofTotal")} ${num(stats.totalQuotaGB, 1)} GB`
          }
          icon={Database}
          tint="bg-violet-500/15 text-violet-300"
        />
      </div>

      {demoMode && (
        <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          {t("demoBanner")}
        </div>
      )}

      <Card className="glass-card border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t("traffic30")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div dir="ltr" className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,140,230,0.12)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#7e93b8", fontSize: 11 }}
                  tickFormatter={(d: string) => d.slice(5)}
                  stroke="rgba(96,140,230,0.2)"
                />
                <YAxis tick={{ fill: "#7e93b8", fontSize: 11 }} stroke="rgba(96,140,230,0.2)" width={45} />
                <Tooltip
                  contentStyle={{
                    background: "#0b1426",
                    border: "1px solid rgba(96,140,230,0.25)",
                    borderRadius: 12,
                    color: "#e8eef8",
                    fontFamily: "Vazirmatn, Inter, sans-serif",
                    boxShadow: "0 0 24px rgba(37,99,235,0.2)",
                  }}
                  labelStyle={{ color: "#7e93b8" }}
                  formatter={(value: number | string, name: string) => [
                    `${Number(value).toLocaleString(lang === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 1 })} GB`,
                    name === "downGB" ? t("download") : t("upload"),
                  ]}
                />
                <Legend
                  formatter={(v: string) => (v === "downGB" ? t("download") : t("upload"))}
                  wrapperStyle={{ fontFamily: "Vazirmatn, Inter, sans-serif", color: "#7e93b8" }}
                />
                <Area type="monotone" dataKey="downGB" stroke="#2563eb" strokeWidth={2} fill="url(#gDown)" />
                <Area type="monotone" dataKey="upGB" stroke="#38bdf8" strokeWidth={2} fill="url(#gUp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Crown className="w-5 h-5 text-amber-400" />
            {t("topConsumers")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topUsers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t("noUsersYet")}</p>
          )}
          {topUsers.map((u) => (
            <div key={u.username} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span dir="ltr" className="font-medium text-sm truncate">{u.username}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[u.effectiveStatus]}`}>
                    {stLabel(u.effectiveStatus)}
                  </Badge>
                </div>
                <span className="text-sm num text-muted-foreground shrink-0">
                  {num(u.usedGB, 1)}
                  <span className="text-xs"> / {u.quotaGB === 0 ? "∞" : `${num(u.quotaGB, 1)} GB`}</span>
                </span>
              </div>
              <Progress
                value={u.quotaGB === 0 ? (u.usedGB / maxTop) * 100 : Math.min(100, (u.usedGB / u.quotaGB) * 100)}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
