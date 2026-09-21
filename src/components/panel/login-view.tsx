"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Eye, EyeOff, Globe, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "./i18n";
import type { AdminInfo } from "./types";

/** موج‌های متحرک پایین صفحه */
function Waves() {
  const p1 = "M0,64 C180,110 320,10 540,54 C760,98 900,30 1200,60 L1200,140 L0,140 Z";
  const p2 = "M0,80 C240,120 420,40 660,70 C900,100 1040,50 1200,72 L1200,140 L0,140 Z";
  const p3 = "M0,100 C200,130 380,70 620,92 C860,114 1000,80 1200,96 L1200,140 L0,140 Z";
  return (
    <div className="pp-waves" aria-hidden="true">
      <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="pp-wave-1">
        <path d={p1} fill="rgba(37,99,235,0.28)" />
      </svg>
      <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="pp-wave-2">
        <path d={p2} fill="rgba(30,64,175,0.32)" />
      </svg>
      <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="pp-wave-3">
        <path d={p3} fill="rgba(13,28,58,0.85)" />
      </svg>
    </div>
  );
}

/** درخششی که موس را دنبال می‌کند */
function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    const ring = ringRef.current;
    if (!glow || !ring) return;
    let gx = 0,
      gy = 0,
      rx = 0,
      ry = 0,
      raf = 0;

    const onMove = (e: MouseEvent) => {
      gx = e.clientX;
      gy = e.clientY;
      glow.classList.add("on");
      ring.classList.add("on");
      ring.style.left = `${gx}px`;
      ring.style.top = `${gy}px`;
    };
    const loop = () => {
      rx += (gx - rx) * 0.12;
      ry += (gy - ry) * 0.12;
      glow.style.setProperty("--x", `${rx}px`);
      glow.style.setProperty("--y", `${ry}px`);
      glow.style.left = `${rx}px`;
      glow.style.top = `${ry}px`;
      glow.style.transform = "translate(-50%, -50%)";
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={glowRef} className="pp-cursor-glow" />
      <div ref={ringRef} className="pp-cursor-ring" />
    </>
  );
}

export function LoginView({ onLogin }: { onLogin: (admin: AdminInfo, mustChangePassword?: boolean) => void }) {
  const { t, lang, setLang } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("loginFailed"));
        return;
      }
      onLogin(data.admin, !!data.mustChangePassword);
    } catch {
      setError(t("serverError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pp-bg-scene flex items-center justify-center p-4 overflow-hidden">
      <CursorGlow />

      {/* سوییچ زبان */}
      <button
        onClick={() => setLang(lang === "fa" ? "en" : "fa")}
        className="absolute top-5 z-20 flex items-center gap-1.5 rounded-full border border-border bg-card/70 backdrop-blur px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all ltr:right-5 rtl:left-5"
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4 text-primary" />
        {lang === "fa" ? "English" : "فارسی"}
      </button>

      {/* لوگوی بزرگ + برند */}
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-7 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-blue-500/25 blur-2xl" />
            <div className="relative w-20 h-20 rounded-3xl border border-primary/40 bg-card/80 backdrop-blur flex items-center justify-center glow-primary">
              <img src="/logo.svg" alt="PIXEL PING" className="w-14 h-14" />
            </div>
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight" dir="ltr">
            <span className="neon-text text-foreground">PIXEL</span>{" "}
            <span className="neon-text text-primary">PING</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary/70" />
            {t("appTagline")}
          </p>
        </div>

        <Card className="glass-card glow-primary border-border/70">
          <CardHeader className="text-center space-y-1 pb-3">
            <CardTitle className="text-lg font-bold">{t("loginTitle")}</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">{t("loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("username")}</Label>
                <Input
                  id="username"
                  dir="ltr"
                  className="text-left bg-secondary/50 border-input focus-visible:ring-primary/60 h-11"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    dir="ltr"
                    type={showPass ? "text" : "password"}
                    className="text-left bg-secondary/50 border-input focus-visible:ring-primary/60 h-11 pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPass ? t("hidePass") : t("showPass")}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-center">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11 text-base font-bold btn-neon border-0" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("loginBtn")}
              </Button>
            </form>

            <div className="mt-4 flex items-center gap-2 justify-center text-[11px] text-muted-foreground">
              <span>
                {t("defaultHint")}: <code dir="ltr" className="bg-secondary/70 px-1.5 py-0.5 rounded text-blue-300">admin / admin123</code>
              </span>
              <span className="opacity-60">({t("changeAfterLogin")})</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Waves />
    </div>
  );
}
