import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { usageLog } from "@/lib/db/schema";
import { FREE_DAILY_QUOTA, QUOTA_WINDOW_MS } from "@/lib/quota";
import { and, eq, gt, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isOwner = session.user.email === process.env.OWNER_EMAIL;
  if (isOwner) {
    return NextResponse.json({ isOwner: true });
  }

  const since = new Date(Date.now() - QUOTA_WINDOW_MS);
  // Ambil scan gratis dalam window, terbaru dulu, dibatasi sebanyak kuota.
  const recentUsage = await getDb()
    .select()
    .from(usageLog)
    .where(
      and(
        eq(usageLog.userId, session.user.id),
        eq(usageLog.usedOwnKey, false),
        gt(usageLog.usedAt, since)
      )
    )
    .orderBy(desc(usageLog.usedAt))
    .limit(FREE_DAILY_QUOTA);

  const usedCount = recentUsage.length;
  const remaining = Math.max(0, FREE_DAILY_QUOTA - usedCount);
  const hasQuota = remaining > 0;

  let resetInMs: number | null = null;
  if (!hasQuota) {
    // Jatah bebas lagi saat scan terlama (di antara FREE_DAILY_QUOTA terbaru) keluar window.
    // recentUsage diurut desc, jadi elemen terakhir adalah yang paling lama.
    const oldest = recentUsage[recentUsage.length - 1];
    const resetAt = new Date(oldest.usedAt).getTime() + QUOTA_WINDOW_MS;
    resetInMs = resetAt - Date.now();
  }

  return NextResponse.json({
    isOwner: false,
    hasQuota,
    remaining,
    total: FREE_DAILY_QUOTA,
    resetInMs,
  });
}
