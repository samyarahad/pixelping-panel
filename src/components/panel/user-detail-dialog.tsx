"use client";

import { useState } from "react";
import {
  Copy, QrCode, RefreshCw, KeyRound, Trash2, Power, Plus, CalendarClock, Check, Link2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "./i18n";
import { daysLeft, statusColors, subLink, type VpnUserDto } from "./types";

interface Props {
  user: VpnUserDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: VpnUserDto) => void;
  onUserDeleted: (id: string) => void;
}

export function UserDetailDialog({ user, open, onOpenChange, onUserUpdated, onUserDeleted }: Props) {
  const { toast } = useToast();
  const { t, num, date } = useI18n();
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [extendDays, setExtendDays] = useState("30");
  const [addGB, setAddGB] = useState("10");
  const [copied, setCopied] = useState(false);

  if (!user) return null;
  const link = subLink(user.subscriptionToken);
  const stLabel = (s: string) =>
    s === "active" ? t("stActive") : s === "disabled" ? t("stDisabled") : s === "expired" ? t("stExpired") : t("stLimit");

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: `${label} ${t("copied")}` });
    } catch {
      toast({ title: t("copyFailed"), variant: "destructive" });
    }
  }

  async function postAction(action: string, msg: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${user.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (action === "reset-sub" && data.token) {
        onUserUpdated({ ...user, subscriptionToken: data.token });
      } else if (action === "reset-traffic") {
        onUserUpdated({ ...user, usedGB: 0, usedBytes: 0 });
      }
      toast({ title: msg });
    } catch {
      toast({ title: t("opFailed"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function patchUser(body: Record<string, unknown>, msg: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUserUpdated(data.user);
      toast({ title: msg });
    } catch {
      toast({ title: t("opFailed"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser() {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onUserDeleted(user.id);
      onOpenChange(false);
      toast({ title: `${user.username} ${t("deleted")}` });
    } catch {
      toast({ title: t("deleteFailed"), variant: "destructive" });
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  const usagePct = user.quotaGB === 0 ? 0 : Math.min(100, (user.usedGB / user.quotaGB) * 100);
  const dl = daysLeft(user.expiryDate);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <span dir="ltr" className="font-mono">{user.username}</span>
              <Badge variant="outline" className={statusColors[user.effectiveStatus]}>
                {stLabel(user.effectiveStatus)}
              </Badge>
            </DialogTitle>
            <DialogDescription>{user.note || (user.username)}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="sub" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="sub">{t("subLinkTab")}</TabsTrigger>
              <TabsTrigger value="manage">{t("manageTab")}</TabsTrigger>
            </TabsList>

            <TabsContent value="sub" className="space-y-4 pt-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t("subHint")}</p>
                <div className="flex items-center gap-2">
                  <div dir="ltr" className="flex-1 min-w-0 bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-xs font-mono truncate text-left">
                    {link}
                  </div>
                  <Button size="icon" variant="outline" onClick={() => copy(link, t("subLinkTab"))} aria-label="copy">
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setQrOpen((s) => !s)}>
                  <QrCode className="w-4 h-4" />
                  {qrOpen ? t("hideQR") : t("showQR")}
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`/api/sub/${user.subscriptionToken}?b64=0`} target="_blank" rel="noreferrer">
                    <Link2 className="w-4 h-4" />
                    {t("viewOutput")}
                  </a>
                </Button>
              </div>

              {qrOpen && (
                <div className="flex justify-center p-4 bg-white rounded-xl w-fit mx-auto">
                  <QRCodeSVG value={link} size={200} level="M" />
                </div>
              )}

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">UUID</span>
                  <div className="flex items-center gap-1 min-w-0">
                    <code dir="ltr" className="text-xs font-mono truncate max-w-[220px]">{user.uuid}</code>
                    <button onClick={() => copy(user.uuid, "UUID")} aria-label="copy UUID">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("usedTraffic")}</span>
                  <span className="num">
                    {num(user.usedGB, 1)} / {user.quotaGB === 0 ? t("unlimited") : `${num(user.quotaGB, 1)} GB`}
                    {user.quotaGB > 0 && <span className="text-muted-foreground text-xs"> ({num(Math.round(usagePct))}%)</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("expiry")}</span>
                  <span>
                    {date(user.expiryDate)}
                    {dl !== null && (
                      <span className={`text-xs mx-1 ${dl <= 3 ? "text-red-400" : "text-muted-foreground"}`}>
                        ({dl < 0 ? t("expiredAlready") : `${num(dl)} ${t("daysLeft")}`})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("createdAt")}</span>
                  <span>{date(user.createdAt)}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manage" className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={user.status === "active" ? "destructive" : "default"}
                  className="flex-1"
                  disabled={busy}
                  onClick={() =>
                    patchUser(
                      { status: user.status === "active" ? "disabled" : "active" },
                      user.status === "active" ? t("userDisabled") : t("userEnabled")
                    )
                  }
                >
                  <Power className="w-4 h-4" />
                  {user.status === "active" ? t("toggleDisable") : t("toggleEnable")}
                </Button>
                <Button variant="outline" className="flex-1" disabled={busy} onClick={() => postAction("reset-traffic", t("trafficReset"))}>
                  <RefreshCw className="w-4 h-4" />
                  {t("resetTraffic")}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-primary" /> {t("extendSub")}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    dir="ltr" type="number" min="1" value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)} className="bg-secondary/50 text-left w-24"
                  />
                  <span className="text-sm text-muted-foreground">{t("days")}</span>
                  <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => patchUser({ extendDays: Number(extendDays) }, t("extended"))}>
                    {t("extendBtn")}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary" /> {t("addQuota")}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    dir="ltr" type="number" min="1" value={addGB}
                    onChange={(e) => setAddGB(e.target.value)} className="bg-secondary/50 text-left w-24"
                  />
                  <span className="text-sm text-muted-foreground">GB</span>
                  <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => patchUser({ addGB: Number(addGB) }, t("quotaAdded"))}>
                    {t("addBtn")}
                  </Button>
                </div>
              </div>

              <Separator />

              <Button variant="outline" className="w-full" disabled={busy} onClick={() => postAction("reset-sub", t("subReset"))}>
                <KeyRound className="w-4 h-4" />
                {t("resetSubLink")}
              </Button>

              <Button variant="destructive" className="w-full" disabled={busy} onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-4 h-4" />
                {t("deleteUser")}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteConfirmTitle")} {user.username}؟
            </AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirmBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={deleteUser}>
              {t("yesDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
