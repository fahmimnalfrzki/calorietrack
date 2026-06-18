import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { usageLog, foodEntries } from "@/lib/db/schema";
import { analyzeFood, HistoryEntry } from "@/lib/gemini";
import { FREE_DAILY_QUOTA, QUOTA_WINDOW_MS } from "@/lib/quota";
import { and, eq, gt, desc, or, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const userEmail = session.user.email;
  const isOwner = userEmail === process.env.OWNER_EMAIL;

  const formData = await req.formData();
  const imageFile = formData.get("image") as File | null;
  const portionGramsRaw = formData.get("portionGrams") as string | null;
  const ingredientsNote = formData.get("ingredientsNote") as string | null;
  const userApiKey = formData.get("apiKey") as string | null;

  if (!imageFile) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const portionGrams = portionGramsRaw ? parseFloat(portionGramsRaw) : undefined;

  // Determine which API key to use
  let apiKey: string;
  let usedOwnKey = false;

  if (isOwner) {
    apiKey = process.env.GEMINI_API_KEY!;
  } else {
    // Cek kuota gratis: maksimal FREE_DAILY_QUOTA scan dalam rolling 24 jam
    const since = new Date(Date.now() - QUOTA_WINDOW_MS);
    const recentUsage = await getDb()
      .select()
      .from(usageLog)
      .where(
        and(
          eq(usageLog.userId, userId),
          eq(usageLog.usedOwnKey, false),
          gt(usageLog.usedAt, since)
        )
      );

    if (recentUsage.length < FREE_DAILY_QUOTA) {
      // Masih ada jatah gratis
      apiKey = process.env.GEMINI_API_KEY!;
      usedOwnKey = false;
    } else if (userApiKey) {
      // Use user's own key
      apiKey = userApiKey;
      usedOwnKey = true;
    } else {
      return NextResponse.json(
        { error: "QUOTA_EXCEEDED", message: "Kuota gratis habis. Diperlukan API key." },
        { status: 429 }
      );
    }
  }

  // Find relevant history entries for calibration
  let historyEntries: HistoryEntry[] = [];
  const searchTerms: string[] = [];

  if (ingredientsNote) {
    const words = ingredientsNote
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((w) => w.length > 2);
    searchTerms.push(...words);
  }

  if (searchTerms.length >= 2) {
    const conditions = searchTerms.slice(0, 5).map((term) =>
      or(
        sql`LOWER(${foodEntries.foodName}) LIKE ${"%" + term + "%"}`,
        sql`LOWER(${foodEntries.ingredientsNote}) LIKE ${"%" + term + "%"}`
      )
    );

    const matchedEntries = await getDb()
      .select()
      .from(foodEntries)
      .where(and(eq(foodEntries.userId, userId), or(...conditions)))
      .orderBy(desc(foodEntries.wasEdited), desc(foodEntries.createdAt))
      .limit(10);

    // Filter entries that match at least 2 terms
    const filtered = matchedEntries.filter((entry) => {
      const text = `${entry.foodName} ${entry.ingredientsNote || ""}`.toLowerCase();
      const matchCount = searchTerms.filter((term) => text.includes(term)).length;
      return matchCount >= 2;
    });

    historyEntries = filtered.slice(0, 3).map((e) => ({
      foodName: e.foodName,
      calories: e.calories,
      protein: parseFloat(e.protein as string),
      carbs: parseFloat(e.carbs as string),
      fat: parseFloat(e.fat as string),
      portionGrams: e.portionGrams ? parseFloat(e.portionGrams as string) : null,
      ingredientsNote: e.ingredientsNote,
      wasEdited: e.wasEdited,
    }));
  }

  // Convert image to base64
  const arrayBuffer = await imageFile.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = imageFile.type || "image/jpeg";

  try {
    const result = await analyzeFood(
      base64,
      mimeType,
      apiKey,
      portionGrams,
      ingredientsNote || undefined,
      historyEntries.length > 0 ? historyEntries : undefined
    );

    // Gambar bukan makanan: jangan potong kuota, beri tahu user.
    if (!result.isFood) {
      return NextResponse.json(
        {
          error: "NOT_FOOD",
          message: "Tidak terdeteksi makanan pada foto. Coba foto makanan/minuman dengan jelas.",
        },
        { status: 422 }
      );
    }

    // Log usage (not for owner)
    if (!isOwner) {
      await getDb().insert(usageLog).values({
        userId,
        usedOwnKey,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: "AI_ERROR", message: "Gagal menganalisis foto. Coba lagi." },
      { status: 500 }
    );
  }
}
