"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/panel/i18n";

/**
 * صفحۀ تغییر اجباری رمز عبور
 * وقتی رمز ادمین هنوز روی مقدار پیش‌فرض (admin123) است، تا تغییرش ندهند
 * هیچ بخشی از پنل در دسترس نیست.
 */
export function ForceChangePassword({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!currentPassword || !newPassword) {
      setError(t("bothRequired"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("passTooShort"));
      return;
    }
    if (newPassword !== confirm) {
      setError(t("passMismatch"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: t("passChanged") });
        onDone();
      } else {
        setError(data?.error || t("reqFailed"));
      }
    } catch {
      setError(t("reqFailed"));
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full h-11 rounded-xl bg-secondary/50 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none px-3 text-sm";

  return (
    <div className="pp-bg-scene min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-primary/25 bg-card/70 backdrop-blur-xl shadow-[0_0_50px_rgba(37,99,235,0.15)] p-6 sm:p-8">
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.3)]">
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold">{t("forceChangeTitle")}</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">{t("forceChangeDesc")}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <KeyRound className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
            <input
              type={show ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("currentPass")}
              dir="ltr"
              autoComplete="current-password"
              className={`${inputCls} ltr:pl-9 rtl:pr-9`}
            />
          </div>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("newPass")}
              dir="ltr"
              autoComplete="new-password"
              className={`${inputCls} ltr:pl-9 rtl:pr-9`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ltr:right-3 rtl:left-3"
              aria-label="toggle visibility"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t("confirmPass")}
            dir="ltr"
            autoComplete="new-password"
            className={inputCls}
          />

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="btn-neon w-full h-11 rounded-xl gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("changePass")}
          </Button>
        </form>
      </div>
    </div>
  );
}
