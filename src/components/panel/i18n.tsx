"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "fa" | "en";

export const dictionaries = {
  fa: {
    // عمومی
    appName: "PIXEL PING",
    appTagline: "پنل مدیریت VPN",
    loading: "در حال بارگذاری...",
    // ورود
    loginTitle: "ورود به پنل مدیریت",
    loginSubtitle: "برای ادامه وارد حساب خود شوید",
    username: "نام کاربری",
    password: "رمز عبور",
    loginBtn: "ورود به پنل",
    defaultHint: "حساب پیش‌فرض",
    changeAfterLogin: "بعد از ورود تغییر دهید",
    loginFailed: "ورود ناموفق بود",
    serverError: "ارتباط با سرور برقرار نشد",
    showPass: "نمایش رمز",
    hidePass: "مخفی کردن رمز",
    // منو
    dashboard: "داشبورد",
    users: "کاربران",
    settings: "تنظیمات",
    logout: "خروج",
    logoutMsg: "خارج شدید",
    sysAdmin: "مدیر سیستم",
    // داشبورد
    totalUsers: "کل کاربران",
    activeUsers: "کاربران فعال",
    onlineNow: "آنلاین در لحظه",
    totalUsed: "مصرف کل",
    connectedUsers: "کاربران متصل به سرویس",
    disabledN: "غیرفعال",
    expiredN: "منقضی",
    limitN: "اتمام حجم",
    unlimitedN: "کاربر نامحدود",
    ofTotal: "از",
    demoBanner: "حالت نمایشی فعال است — ترافیک و کاربران آنلاین شبیه‌سازی می‌شوند تا داشبورد زنده به نظر برسد.",
    traffic30: "ترافیک ۳۰ روز اخیر",
    download: "دانلود",
    upload: "آپلود",
    topConsumers: "بیشترین مصرف‌کننده‌ها",
    noUsersYet: "هنوز کاربری ثبت نشده است",
    refresh: "به‌روزرسانی",
    unlimited: "نامحدود",
    noLimit: "بدون محدودیت",
    // وضعیت‌ها
    stActive: "فعال",
    stDisabled: "غیرفعال",
    stExpired: "منقضی",
    stLimit: "اتمام حجم",
    // کاربران
    userManagement: "مدیریت کاربران",
    searchUsers: "جستجوی کاربر...",
    all: "همه",
    newUser: "کاربر جدید",
    user: "کاربر",
    status: "وضعیت",
    usageQuota: "مصرف / سهمیه",
    expiry: "انقضا",
    actions: "عملیات",
    details: "جزئیات",
    more: "بیشتر",
    edit: "ویرایش",
    noUserFound: "کاربری یافت نشد",
    createTitle: "ساخت کاربر جدید",
    createDesc: "کانفیگ و لینک اشتراک به صورت خودکار ساخته می‌شود",
    quotaGB: "حجم سهمیه (GB)",
    durationDays: "مدت اعتبار (روز)",
    noExpiry: "بدون انقضا",
    note: "توضیحات",
    noteOptional: "توضیحات (اختیاری)",
    notePlaceholder: "مثلاً: پلن ماهانه ۵۰ گیگ",
    cancel: "انصرف",
    create: "ساخت کاربر",
    save: "ذخیره",
    userCreated: "ساخته شد",
    subReady: "لینک اشتراک آماده است",
    invalidUsername: "نام کاربری نامعتبر",
    invalidUsernameDesc: "۳ تا ۳۲ کاراکتر انگلیسی، عدد و آندرلاین",
    invalidQuota: "حجم نامعتبر است",
    // دیالوگ جزئیات
    subLinkTab: "لینک اشتراک",
    manageTab: "مدیریت کاربر",
    subHint: "این لینک را در کلاینت (v2rayNG، Hiddify، Streisand و ...) وارد کنید:",
    showQR: "نمایش QR Code",
    hideQR: "بستن QR",
    viewOutput: "مشاهده خروجی",
    usedTraffic: "حجم مصرفی",
    createdAt: "تاریخ ساخت",
    daysLeft: "روز مانده",
    expiredAlready: "منقضی",
    toggleDisable: "غیرفعال‌سازی",
    toggleEnable: "فعال‌سازی",
    userDisabled: "کاربر غیرفعال شد",
    userEnabled: "کاربر فعال شد",
    resetTraffic: "ریست ترافیک",
    trafficReset: "ترافیک ریست شد",
    extendSub: "تمیدید اشتراک",
    days: "روز",
    extendBtn: "تمیدید کن",
    extended: "اشتراک تمدید شد",
    addQuota: "افزودن حجم به سهمیه",
    addBtn: "اضافه کن",
    quotaAdded: "حجم اضافه شد",
    resetSubLink: "ریست لینک اشتراک (توکن جدید)",
    subReset: "لینک اشتراک جدید ساخته شد",
    deleteUser: "حذف کامل کاربر",
    deleteConfirmTitle: "حذف کاربر",
    deleteConfirmBody: "این عملیات قابل بازگشت نیست. تمام داده‌های کاربر شامل کانفیگ‌ها و آمارش حذف خواهد شد.",
    yesDelete: "بله، حذف کن",
    deleted: "حذف شد",
    deleteFailed: "حذف ناموفق بود",
    opFailed: "عملیات ناموفق بود",
    copied: "کپی شد",
    copyFailed: "کپی ناموفق بود",
    userEdited: "ویرایش",
    quotaZeroHint: "صفر یعنی نامحدود",
    changesSaved: "تغییرات ذخیره شد",
    saveFailed: "ذخیره ناموفق بود",
    editUser: "ویرایش کاربر",
    // تنظیمات
    panelInfo: "اطلاعات پنل",
    panelInfoDesc: "نام نمایشی پنل و حالت نمایشی",
    panelName: "نام پنل",
    demoMode: "حالت نمایشی (دمو)",
    demoModeDesc: "شبیه‌سازی ترافیک زنده برای تست داشبورد",
    nodeServer: "سرور نود",
    nodeServerDesc: "کجا ترافیک VLESS پردازش شود. خالی = خودِ این پنل (توسیعه پیش‌فرض روی Railway)",
    useOwnServer: "استفاده از سرور خارجی (VPS)",
    host: "آدرس (Host / Domain)",
    hostPlaceholder: "خالی = همین دامنه پنل",
    port: "پورت",
    wsPath: "مسیر WebSocket",
    sni: "SNI",
    protocolsSub: "پروتکل‌های اشتراک",
    protocolsDesc: "پروتکل‌هایی که در لینک اشتراک هر کاربر قرار می‌گیرند",
    saveSettings: "ذخیره تنظیمات",
    settingsSaved: "تنظیمات ذخیره شد",
    adminPassword: "تغییر رمز عبور مدیر",
    adminPasswordDesc: "پس از اولین ورود، رمز پیش‌فرض را عوض کنید",
    currentPass: "رمز فعلی",
    newPass: "رمز جدید (حداقل ۶ کاراکتر)",
    changePass: "تغییر رمز عبور",
    passChanged: "رمز عبور با موفقیت تغییر کرد",
    passChangedOk: "رمز عبور تغییر کرد",
    currentPassWrong: "رمز فعلی اشتباه است",
    passTooShort: "رمز جدید باید حداقل ۶ کاراکتر باشد",
    bothRequired: "هر دو فیلد الزامی است",
    builtInNode: "نود داخلی",
    builtInNodeDesc: "این پنل خودش سرور VLESS دارد — کانفیگ‌ها به همین دامنه اشاره می‌کنند",
    externalNode: "سرور خارجی",
    // فوتر
    footerText: "پنل مدیریت VPN — آماده دیپلوی روی Railway",
    version: "نسخه",
    // خطاها
    reqFailed: "درخواست ناموفق بود",
  },
  en: {
    appName: "PIXEL PING",
    appTagline: "VPN Management Panel",
    loading: "Loading...",
    loginTitle: "Login to Management Panel",
    loginSubtitle: "Sign in to your account to continue",
    username: "Username",
    password: "Password",
    loginBtn: "Sign In",
    defaultHint: "Default account",
    changeAfterLogin: "change it after login",
    loginFailed: "Login failed",
    serverError: "Cannot reach the server",
    showPass: "Show password",
    hidePass: "Hide password",
    dashboard: "Dashboard",
    users: "Users",
    settings: "Settings",
    logout: "Logout",
    logoutMsg: "Logged out",
    sysAdmin: "Administrator",
    totalUsers: "Total Users",
    activeUsers: "Active Users",
    onlineNow: "Online Now",
    totalUsed: "Total Used",
    connectedUsers: "users connected to service",
    disabledN: "disabled",
    expiredN: "expired",
    limitN: "quota reached",
    unlimitedN: "unlimited users",
    ofTotal: "of",
    demoBanner: "Demo mode is ON — traffic and online users are simulated so the dashboard looks alive.",
    traffic30: "Traffic — last 30 days",
    download: "Download",
    upload: "Upload",
    topConsumers: "Top Consumers",
    noUsersYet: "No users yet",
    refresh: "Refresh",
    unlimited: "Unlimited",
    noLimit: "No limit",
    stActive: "Active",
    stDisabled: "Disabled",
    stExpired: "Expired",
    stLimit: "Limit",
    userManagement: "User Management",
    searchUsers: "Search users...",
    all: "All",
    newUser: "New User",
    user: "User",
    status: "Status",
    usageQuota: "Used / Quota",
    expiry: "Expiry",
    actions: "Actions",
    details: "Details",
    more: "More",
    edit: "Edit",
    noUserFound: "No users found",
    createTitle: "Create New User",
    createDesc: "Config and subscription link are generated automatically",
    quotaGB: "Quota (GB)",
    durationDays: "Validity (days)",
    noExpiry: "Never expires",
    note: "Note",
    noteOptional: "Note (optional)",
    notePlaceholder: "e.g. 50GB monthly plan",
    cancel: "Cancel",
    create: "Create User",
    save: "Save",
    userCreated: "created",
    subReady: "Subscription link is ready",
    invalidUsername: "Invalid username",
    invalidUsernameDesc: "3-32 chars: letters, digits, underscore",
    invalidQuota: "Invalid quota",
    subLinkTab: "Subscription",
    manageTab: "Manage User",
    subHint: "Paste this link into your client (v2rayNG, Hiddify, Streisand, ...):",
    showQR: "Show QR Code",
    hideQR: "Hide QR",
    viewOutput: "View output",
    usedTraffic: "Used traffic",
    createdAt: "Created",
    daysLeft: "days left",
    expiredAlready: "Expired",
    toggleDisable: "Disable",
    toggleEnable: "Enable",
    userDisabled: "User disabled",
    userEnabled: "User enabled",
    resetTraffic: "Reset Traffic",
    trafficReset: "Traffic has been reset",
    extendSub: "Extend Subscription",
    days: "days",
    extendBtn: "Extend",
    extended: "Subscription extended",
    addQuota: "Add Quota",
    addBtn: "Add",
    quotaAdded: "Quota added",
    resetSubLink: "Reset Subscription Link (new token)",
    subReset: "New subscription link generated",
    deleteUser: "Delete User Permanently",
    deleteConfirmTitle: "Delete user",
    deleteConfirmBody: "This action cannot be undone. All user data including configs and stats will be removed.",
    yesDelete: "Yes, delete",
    deleted: "deleted",
    deleteFailed: "Delete failed",
    opFailed: "Operation failed",
    copied: "copied",
    copyFailed: "Copy failed",
    userEdited: "Edit",
    quotaZeroHint: "0 means unlimited",
    changesSaved: "Changes saved",
    saveFailed: "Save failed",
    editUser: "Edit User",
    panelInfo: "Panel Info",
    panelInfoDesc: "Display name and demo mode",
    panelName: "Panel Name",
    demoMode: "Demo Mode",
    demoModeDesc: "Simulate live traffic for dashboard testing",
    nodeServer: "Proxy Node",
    nodeServerDesc: "Where VLESS traffic is processed. Empty = this panel itself (default on Railway)",
    useOwnServer: "Use external server (VPS)",
    host: "Host / Domain",
    hostPlaceholder: "empty = this panel domain",
    port: "Port",
    wsPath: "WebSocket Path",
    sni: "SNI",
    protocolsSub: "Subscription Protocols",
    protocolsDesc: "Protocols included in each user's subscription link",
    saveSettings: "Save Settings",
    settingsSaved: "Settings saved",
    adminPassword: "Change Admin Password",
    adminPasswordDesc: "Change the default password after first login",
    currentPass: "Current password",
    newPass: "New password (min 6 chars)",
    changePass: "Change Password",
    passChanged: "Password changed successfully",
    passChangedOk: "Password changed",
    currentPassWrong: "Current password is wrong",
    passTooShort: "New password must be at least 6 characters",
    bothRequired: "Both fields are required",
    builtInNode: "Built-in Node",
    builtInNodeDesc: "This panel includes a real VLESS server — configs point to this very domain",
    externalNode: "External Server",
    footerText: "VPN Management Panel — ready to deploy on Railway",
    version: "v1.0",
    reqFailed: "Request failed",
  },
} as const;

export type Dict = (typeof dictionaries)["fa"];

interface I18nCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: keyof Dict) => string;
  setLang: (l: Lang) => void;
  /** عدد با لوکال مناسب زبان جاری */
  num: (n: number, digits?: number) => string;
  /** تاریخ با لوکال مناسب زبان جاری */
  date: (iso: string | null) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("pp-lang")) as Lang | null;
    if (saved === "en" || saved === "fa") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("pp-lang", l);
    } catch {}
  }, []);

  const t = useCallback((key: keyof Dict) => dictionaries[lang][key] ?? String(key), [lang]);

  const num = useCallback(
    (n: number, digits = 0) =>
      n.toLocaleString(lang === "fa" ? "fa-IR" : "en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }),
    [lang]
  );

  const date = useCallback(
    (iso: string | null) => {
      if (!iso) return lang === "fa" ? "بدون محدودیت" : "No limit";
      try {
        return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium" }).format(new Date(iso));
      } catch {
        return iso;
      }
    },
    [lang]
  );

  return (
    <Ctx.Provider value={{ lang, dir: lang === "fa" ? "rtl" : "ltr", t, setLang, num, date }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
