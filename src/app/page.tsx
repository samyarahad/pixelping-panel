"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Users, Settings, LogOut, Loader2, Menu, X, RefreshCw, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoginView } from "@/components/panel/login-view";
import { DashboardView } from "@/components/panel/dashboard-view";
import { UsersView } from "@/components/panel/users-view";
import { SettingsView } from "@/components/panel/settings-view";
import { I18nProvider, useI18n } from "@/components/panel/i18n";
import type { AdminInfo, StatsResponse, VpnUserDto } from "@/components/panel/types";

type Tab = "dashboard" | "users" | "settings";

function PanelShell() {
  const { toast } = useToast();
  const { t, lang, setLang } = useI18n();
  const [booting, setBooting] = useState(true);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<VpnUserDto[] | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [panelName, setPanelName] = useState("PIXEL PING");

  const statsTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.admin) setAdmin(data.admin);
      } catch {
        /* بدون نشست */
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const loadStats = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setStatsLoading(true);
    try {
      const res = await fetch("/api/stats");
      if (res.status === 401) {
        setAdmin(null);
        return;
      }
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {
      /* ignore */
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
      /* ignore */
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setPanelName(data.settings.panelName || "PIXEL PING");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    loadStats();
    loadUsers();
    loadSettings();
    statsTimer.current = setInterval(() => {
      if (tab === "dashboard") loadStats(true);
    }, 6000);
    return () => {
      if (statsTimer.current) clearInterval(statsTimer.current);
    };
  }, [admin, tab, loadStats, loadUsers, loadSettings]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setAdmin(null);
    setStats(null);
    setUsers(null);
    setSettings(null);
    toast({ title: t("logoutMsg") });
  }

  if (booting) {
    return (
      <div className="pp-bg-scene flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!admin) return <LoginView onLogin={setAdmin} />;

  const NAV: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { key: "users", label: t("users"), icon: Users },
    { key: "settings", label: t("settings"), icon: Settings },
  ];

  const navBtn = (item: (typeof NAV)[number], onNav?: () => void) => {
    const Icon = item.icon;
    const active = tab === item.key;
    return (
      <button
        key={item.key}
        onClick={() => {
          setTab(item.key);
          onNav?.();
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          active
            ? "bg-primary/15 text-blue-200 border border-primary/40 shadow-[0_0_18px_rgba(37,99,235,0.25)]"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
        }`}
      >
        <Icon className="w-5 h-5" />
        {item.label}
      </button>
    );
  };

  return (
    <div className="pp-bg-scene flex min-h-screen" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* سایدبار دسکتاپ */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-s border-sidebar-border bg-sidebar/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
          { }
          <img src="/logo.svg" alt="logo" className="w-9 h-9" />
          <div className="min-w-0">
            <p className="font-black text-sm leading-none tracking-tight" dir="ltr">
              <span className="text-foreground">PIXEL</span> <span className="text-primary neon-text">PING</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{t("appTagline")}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">{NAV.map((n) => navBtn(n))}</nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-secondary border border-primary/30 flex items-center justify-center text-xs font-bold text-blue-300">
              {admin.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p dir="ltr" className="text-sm font-medium text-start truncate">{admin.username}</p>
              <p className="text-[10px] text-muted-foreground">{t("sysAdmin")}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={handleLogout} aria-label={t("logout")}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* سایدبار موبایل */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute top-0 bottom-0 w-64 bg-sidebar border-s border-sidebar-border flex flex-col ltr:right-0 rtl:left-0 ltr:left-auto rtl:right-auto">
            <div className="flex items-center justify-between px-5 h-16 border-b border-sidebar-border">
              <span className="font-black" dir="ltr">
                PIXEL <span className="text-primary">PING</span>
              </span>
              <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(false)} aria-label="close">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV.map((n) => navBtn(n, () => setSidebarOpen(false)))}
            </nav>
            <div className="p-3 border-t border-sidebar-border">
              <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" /> {t("logout")}
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* محتوا */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/70 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="menu">
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-bold text-lg">
              {tab === "dashboard" ? t("dashboard") : tab === "users" ? t("userManagement") : t("settings")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "fa" ? "en" : "fa")}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              aria-label="Switch language"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              {lang === "fa" ? "EN" : "فا"}
            </button>
            {tab === "dashboard" && (
              <Button size="sm" variant="outline" onClick={() => loadStats(true)} disabled={refreshing} className="gap-1.5">
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{t("refresh")}</span>
              </Button>
            )}
            {tab === "users" && (
              <Button size="sm" variant="outline" onClick={loadUsers} className="gap-1.5">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">{t("refresh")}</span>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {tab === "dashboard" && <DashboardView data={stats} refreshing={refreshing} />}
          {tab === "users" && (
            <UsersView
              users={users}
              loading={usersLoading}
              onRefresh={loadUsers}
              onUserUpdated={(u) =>
                setUsers((prev) => (prev ? prev.map((x) => (x.id === u.id ? u : x)) : [u]))
              }
              onUserDeleted={(id) => setUsers((prev) => (prev ? prev.filter((x) => x.id !== id) : []))}
              onUserCreated={(u) => setUsers((prev) => [u, ...(prev || [])])}
            />
          )}
          {tab === "settings" && <SettingsView settings={settings} onSaved={setSettings} />}
        </main>

        <footer className="border-t border-border py-3 px-6 text-center text-xs text-muted-foreground">
          <span dir="ltr" className="font-semibold">PIXEL PING</span> — {t("footerText")} · {t("version")} 1.0
        </footer>
      </div>
    </div>
  );
}

export default function PixelPingPanel() {
  return (
    <I18nProvider>
      <PanelShell />
    </I18nProvider>
  );
}
