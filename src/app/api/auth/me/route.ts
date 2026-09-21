import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeed();
    const session = await getSession();
    if (!session) return NextResponse.json({ admin: null }, { status: 200 });
    return NextResponse.json({
      admin: { id: session.sub, username: session.username, role: session.role },
    });
  } catch (e) {
    console.error("me error:", e);
    return NextResponse.json({ admin: null }, { status: 200 });
  }
}
