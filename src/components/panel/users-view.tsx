"use client";

import { useMemo, useState } from "react";
import {
  Search, UserPlus, MoreHorizontal, Eye, Pencil, Loader2, Globe, Lock, Ban,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { UserDetailDialog } from "./user-detail-dialog";
import { useI18n } from "./i18n";
import { statusColors, type VpnUserDto } from "./types";

interface Props {
  users: VpnUserDto[] | null;
  loading: boolean;
  onRefresh: () => void;
  onUserUpdated: (u: VpnUserDto) => void;
  onUserDeleted: (id: string) => void;
  onUserCreated: (u: VpnUserDto) => void;
}

export function UsersView({ users, loading, onUserUpdated, onUserDeleted, onUserCreated }: Props) {
  const { toast } = useToast();
  const { t, num, date } = useI18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "disabled" | "expired" | "limit">("all");
  const [detailUser, setDetailUser] = useState<VpnUserDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<VpnUserDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [fUsername, setFUsername] = useState("");
  const [fQuota, setFQuota] = useState("50");
  const [fUnlimited, setFUnlimited] = useState(false);
  const [fDays, setFDays] = useState("30");
  const [fNoExpiry, setFNoExpiry] = useState(false);
  const [fNote, setFNote] = useState("");

  const [eQuota, setEQuota] = useState("0");
  const [eNote, setENote] = useState("");

  const filtered = useMemo(() => {
    if (!users) return [];
    let list = users;
    if (filter !== "all") list = list.filter((u) => u.effectiveStatus === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((u) => u.username.toLowerCase().includes(q) || (u.note || "").toLowerCase().includes(q));
    return list;
  }, [users, filter, query]);

  function openCreate() {
    setFUsername("");
    setFQuota("50");
    setFUnlimited(false);
    setFDays("30");
    setFNoExpiry(false);
    setFNote("");
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(fUsername)) {
      toast({ title: t("invalidUsername"), description: t("invalidUsernameDesc"), variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fUsername,
          quotaGB: fUnlimited ? 0 : Number(fQuota) || 0,
          expiryDays: fNoExpiry ? 0 : Number(fDays) || 0,
          note: fNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUserCreated(data.user);
      setCreateOpen(false);
      toast({ title: `${data.user.username} ${t("userCreated")}`, description: t("subReady") });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : t("reqFailed"), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  function openEdit(u: VpnUserDto) {
    setEditUser(u);
    setEQuota(String(u.quotaGB || 0));
    setENote(u.note || "");
  }

  async function handleEditSave() {
    if (!editUser) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotaGB: Number(eQuota) || 0, note: eNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUserUpdated(data.user);
      setEditUser(null);
      toast({ title: t("changesSaved") });
    } catch {
      toast({ title: t("saveFailed"), variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  }

  const filters: { key: typeof filter; label: string }[] = [
    { key: "all", label: t("all") },
    { key: "active", label: t("stActive") },
    { key: "expired", label: t("stExpired") },
    { key: "limit", label: t("stLimit") },
    { key: "disabled", label: t("stDisabled") },
  ];

  const stLabel = (s: string) =>
    s === "active" ? t("stActive") : s === "disabled" ? t("stDisabled") : s === "expired" ? t("stExpired") : t("stLimit");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:right-3 ltr:left-3" />
          <Input
            placeholder={t("searchUsers")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rtl:pr-9 ltr:pl-9 bg-secondary/50"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === f.key
                  ? "bg-primary/20 text-blue-200 border-primary/45 shadow-[0_0_12px_rgba(37,99,235,0.25)]"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={openCreate} className="gap-1.5 btn-neon border-0">
          <UserPlus className="w-4 h-4" />
          {t("newUser")}
        </Button>
      </div>

      <Card className="glass-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-start font-medium px-4 py-3">{t("user")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("status")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("usageQuota")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("expiry")}</th>
                  <th className="text-end font-medium px-4 py-3">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      {t("noUserFound")}
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((u) => {
                    const pct = u.quotaGB === 0 ? 0 : Math.min(100, (u.usedGB / u.quotaGB) * 100);
                    const soonExpired =
                      u.expiryDate && u.effectiveStatus === "active" &&
                      new Date(u.expiryDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                    return (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/25 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-primary/12 border border-primary/30 flex items-center justify-center shrink-0">
                              {u.quotaGB === 0 ? (
                                <Globe className="w-4 h-4 text-blue-300" />
                              ) : (
                                <Lock className="w-4 h-4 text-blue-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p dir="ltr" className="font-medium text-start">{u.username}</p>
                              {u.note && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{u.note}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusColors[u.effectiveStatus]}>
                            {stLabel(u.effectiveStatus)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="num text-xs">
                              {num(u.usedGB, 1)}
                              <span className="text-muted-foreground"> / {u.quotaGB === 0 ? "∞" : `${num(u.quotaGB, 1)}`} GB</span>
                            </span>
                          </div>
                          {u.quotaGB > 0 ? (
                            <Progress value={pct} className="h-1.5" />
                          ) : (
                            <div className="h-1.5 rounded-full bg-secondary/60" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${soonExpired ? "text-amber-400 font-medium" : "text-muted-foreground"}`}>
                            {date(u.expiryDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setDetailUser(u)}>
                              <Eye className="w-4 h-4" />
                              {t("details")}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" aria-label={t("more")}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-card">
                                <DropdownMenuItem onClick={() => openEdit(u)}>
                                  <Pencil className="w-4 h-4" /> {t("edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const res = await fetch(`/api/users/${u.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ status: u.status === "active" ? "disabled" : "active" }),
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      onUserUpdated(data.user);
                                      toast({ title: u.status === "active" ? t("userDisabled") : t("userEnabled") });
                                    }
                                  }}
                                >
                                  <Ban className="w-4 h-4" />
                                  {u.status === "active" ? t("toggleDisable") : t("toggleEnable")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ساخت کاربر */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
            <DialogDescription>{t("createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-username">{t("username")}</Label>
              <Input
                id="c-username" dir="ltr" className="text-left bg-secondary/50"
                placeholder="my_user_1" value={fUsername}
                onChange={(e) => setFUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="c-quota">{t("quotaGB")}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t("unlimited")}</span>
                  <Switch checked={fUnlimited} onCheckedChange={setFUnlimited} />
                </div>
              </div>
              {!fUnlimited && (
                <Input
                  id="c-quota" dir="ltr" type="number" min="0" className="text-left bg-secondary/50"
                  value={fQuota} onChange={(e) => setFQuota(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="c-days">{t("durationDays")}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t("noExpiry")}</span>
                  <Switch checked={fNoExpiry} onCheckedChange={setFNoExpiry} />
                </div>
              </div>
              {!fNoExpiry && (
                <Input
                  id="c-days" dir="ltr" type="number" min="1" className="text-left bg-secondary/50"
                  value={fDays} onChange={(e) => setFDays(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-note">{t("noteOptional")}</Label>
              <Textarea
                id="c-note" rows={2} placeholder={t("notePlaceholder")}
                value={fNote} onChange={(e) => setFNote(e.target.value)} className="bg-secondary/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleCreate} disabled={creating} className="btn-neon border-0">
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ویرایش */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-sm glass-card">
          <DialogHeader>
            <DialogTitle>
              {t("editUser")} <span dir="ltr" className="font-mono">{editUser?.username}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-quota">{t("quotaGB")} — {t("quotaZeroHint")}</Label>
              <Input
                id="e-quota" dir="ltr" type="number" min="0" className="text-left bg-secondary/50"
                value={eQuota} onChange={(e) => setEQuota(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-note">{t("note")}</Label>
              <Textarea
                id="e-note" rows={2} value={eNote}
                onChange={(e) => setENote(e.target.value)} className="bg-secondary/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>{t("cancel")}</Button>
            <Button onClick={handleEditSave} disabled={savingEdit} className="btn-neon border-0">
              {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserDetailDialog
        user={detailUser}
        open={!!detailUser}
        onOpenChange={(o) => !o && setDetailUser(null)}
        onUserUpdated={(updated) => {
          onUserUpdated(updated);
          setDetailUser(updated);
        }}
        onUserDeleted={onUserDeleted}
      />
    </div>
  );
}
