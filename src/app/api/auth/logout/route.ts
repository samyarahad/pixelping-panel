import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const opts = sessionCookieOptions();
  res.cookies.set({ ...opts, value: "", maxAge: 0 });
  return res;
}
