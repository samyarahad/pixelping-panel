"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Server, Globe2, FlaskConical, ShieldCheck, KeyRound, Radio } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "./i18n";

const PROTOCOLS = [
  { key: "vmess", label: "Vmess" },
  { key: "vless", label: "Vless" },
  { key: "trojan", label: "Trojan" },
  { key: "shadowsocks", label: "Shadowsocks" },
];

interface Props {
  settings: Record<string, string> | null;
  onSaved: (s: Record<string, string>) => void;
}

export function SettingsView({ settings, onSaved }: Props) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [form, setForm] = useState<Record<string, string>>({});
  const [protos, setProtos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [passForm, setPassForm] = useState({ current: "", next: "" });
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
      setProtos((settings.protocols || "").split(",").filter(Boolean));
    }
  }, [settings]);

  if (!settings) return null;

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function changePassword() {
    if (!passForm.current || !passForm.next) {
      toast({ title: t("bothRequired"), variant: "destructive" });
      return;
    }
    setChangingPass(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassForm({ current: "", next: "" });
      toast({ title: t("passChanged") });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : t("saveFailed"), variant: "destructive" });
    } finally {
      setChangingPass(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, protocols: protos.join(",") };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(data.settings);
      toast({ title: t("settingsSaved") });
    } catch {
      toast({ title: t("saveFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const externalNode = !!(form.nodeHost && form.nodeHost.trim());

  return (
    <div className="space-y-4 max-w-2xl">
      {/* پنل */}
      <Card className="glass-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {t("panelInfo")}
          </CardTitle>
          <CardDescription>{t("panelInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="s-name">{t("panelName")}</Label>
            <Input
              id="s-name" dir="ltr" className="text-left bg-secondary/50"
              value={form.panelName || ""} onChange={(e) => set("panelName", e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium">{t("demoMode")}</p>
                <p className="text-xs text-muted-foreground">{t("demoModeDesc")}</p>
              </div>
            </div>
            <Switch
              checked={form.demoMode === "1"}
              onCheckedChange={(v) => set("demoMode", v ? "1" : "0")}
            />
          </div>
        </CardContent>
      </Card>

      {/* نود */}
      <Card className="glass-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Server className="w-5 h-5 text-primary" />
            {t("nodeServer")}
          </CardTitle>
          <CardDescription>{t("nodeServerDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${
              externalNode ? "border-border bg-secondary/30" : "border-primary/40 bg-primary/10 shadow-[0_0_16px_rgba(37,99,235,0.2)]"
            }`}
          >
            <Radio className={`w-5 h-5 ${externalNode ? "text-muted-foreground" : "text-blue-300"}`} />
            <div>
              <p className="text-sm font-semibold">{externalNode ? t("externalNode") : t("builtInNode")}</p>
              <p className="text-xs text-muted-foreground">
                {externalNode ? form.nodeHost : t("builtInNodeDesc")}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-host">{t("host")}</Label>
              <Input
                id="s-host" dir="ltr" className="text-left bg-secondary/50"
                placeholder={t("hostPlaceholder")}
                value={form.nodeHost || ""} onChange={(e) => set("nodeHost", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-port">{t("port")}</Label>
              <Input
                id="s-port" dir="ltr" type="number" className="text-left bg-secondary/50"
                value={form.nodePort || ""} onChange={(e) => set("nodePort", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-path">{t("wsPath")}</Label>
              <Input
                id="s-path" dir="ltr" className="text-left bg-secondary/50"
                placeholder="/pixelws"
                value={form.wsPath || ""} onChange={(e) => set("wsPath", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-sni">{t("sni")}</Label>
              <Input
                id="s-sni" dir="ltr" className="text-left bg-secondary/50"
                placeholder={t("hostPlaceholder")}
                value={form.sni || ""} onChange={(e) => set("sni", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* پروتکل‌ها */}
      <Card className="glass-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Globe2 className="w-5 h-5 text-primary" />
            {t("protocolsSub")}
          </CardTitle>
          <CardDescription>{t("protocolsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROTOCOLS.map((p) => (
              <label
                key={p.key}
                className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2.5 cursor-pointer hover:border-primary/45 transition-colors"
              >
                <Checkbox
                  checked={protos.includes(p.key)}
                  onCheckedChange={(c) =>
                    setProtos((prev) => (c ? [...prev, p.key] : prev.filter((x) => x !== p.key)))
                  }
                />
                <span dir="ltr" className="text-sm font-medium">{p.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* تغییر رمز */}
      <Card className="glass-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <KeyRound className="w-5 h-5 text-primary" />
            {t("adminPassword")}
          </CardTitle>
          <CardDescription>{t("adminPasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-current">{t("currentPass")}</Label>
              <Input
                id="p-current" dir="ltr" type="password" className="text-left bg-secondary/50"
                value={passForm.current} onChange={(e) => setPassForm((p) => ({ ...p, current: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-new">{t("newPass")}</Label>
              <Input
                id="p-new" dir="ltr" type="password" className="text-left bg-secondary/50"
                value={passForm.next} onChange={(e) => setPassForm((p) => ({ ...p, next: e.target.value }))}
              />
            </div>
          </div>
          <Button variant="secondary" onClick={changePassword} disabled={changingPass} className="gap-2">
            {changingPass && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("changePass")}
          </Button>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto gap-2 h-11 px-8 btn-neon border-0">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t("saveSettings")}
      </Button>
    </div>
  );
}
