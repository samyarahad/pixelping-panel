export interface AdminInfo {
  id: string;
  username: string;
  role: string;
}

export interface VpnUserDto {
  id: string;
  username: string;
  note: string | null;
  status: "active" | "disabled";
  effectiveStatus: "active" | "disabled" | "expired" | "limit";
  quotaGB: number; // 0 = نامحدود
  usedGB: number;
  usedBytes: number;
  quotaBytes: number;
  expiryDate: string | null;
  uuid: string;
  subscriptionToken: string;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  active: number;
  disabled: number;
  expired: number;
  limitReached: number;
  onlineUsers: number;
  totalUsedGB: number;
  totalQuotaGB: number;
  unlimitedUsers: number;
}

export interface ChartPoint {
  day: string;
  downGB: number;
  upGB: number;
}

export interface TopUser {
  username: string;
  usedGB: number;
  quotaGB: number;
  effectiveStatus: string;
}

export interface StatsResponse {
  stats: DashboardStats;
  chart: ChartPoint[];
  topUsers: TopUser[];
  demoMode: boolean;
}

export const statusColors: Record<string, string> = {
  active: "bg-blue-500/15 text-blue-300 border-blue-500/35",
  disabled: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  expired: "bg-red-500/15 text-red-400 border-red-500/30",
  limit: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

/** روزهای باقی‌مانده تا انقضا */
export function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function subLink(token: string): string {
  if (typeof window === "undefined") return `/api/sub/${token}`;
  return `${window.location.origin}/api/sub/${token}`;
}
