import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { foodEntries } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await getDb()
    .select()
    .from(foodEntries)
    .where(eq(foodEntries.userId, session.user.id))
    .orderBy(desc(foodEntries.createdAt));

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    foodName, calories, protein, carbs, fat,
    proteinSource, carbsSource, fatSource,
    portionGrams, ingredientsNote, wasEdited,
  } = body;

  if (!foodName || calories == null || protein == null || carbs == null || fat == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [entry] = await getDb()
    .insert(foodEntries)
    .values({
      userId: session.user.id,
      foodName,
      calories: Math.round(calories),
      protein: String(protein),
      carbs: String(carbs),
      fat: String(fat),
      proteinSource: proteinSource || null,
      carbsSource: carbsSource || null,
      fatSource: fatSource || null,
      portionGrams: portionGrams ? String(portionGrams) : null,
      ingredientsNote: ingredientsNote || null,
      wasEdited: wasEdited ?? false,
    })
    .returning();

  return NextResponse.json(entry);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    id, foodName, calories, protein, carbs, fat,
    proteinSource, carbsSource, fatSource,
    portionGrams, ingredientsNote,
  } = body;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const [updated] = await getDb()
    .update(foodEntries)
    .set({
      foodName,
      calories: Math.round(calories),
      protein: String(protein),
      carbs: String(carbs),
      fat: String(fat),
      proteinSource: proteinSource || null,
      carbsSource: carbsSource || null,
      fatSource: fatSource || null,
      portionGrams: portionGrams != null ? String(portionGrams) : null,
      ingredientsNote: ingredientsNote || null,
      wasEdited: true, // edit manual selalu menandai data sebagai terkonfirmasi user
    })
    // Pastikan hanya entri milik user yang bisa diubah
    .where(and(eq(foodEntries.id, id), eq(foodEntries.userId, session.user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Hanya hapus kalau entri milik user yang sedang login
  await getDb()
    .delete(foodEntries)
    .where(and(eq(foodEntries.id, id), eq(foodEntries.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
