import { GoogleGenerativeAI } from "@google/generative-ai";

export interface NutritionResult {
  isFood: boolean;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Rincian dari komponen makanan mana tiap makro berasal
  proteinSource: string;
  carbsSource: string;
  fatSource: string;
}

export interface HistoryEntry {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionGrams?: number | null;
  ingredientsNote?: string | null;
  wasEdited: boolean;
}

// Coba model pertama dulu, fallback ke berikutnya kalau gagal/tidak tersedia.
// 2.5-flash sengaja ditaruh paling akhir sebagai cadangan terakhir.
const MODEL_FALLBACK_CHAIN = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
];

export async function analyzeFood(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  portionGrams?: number,
  ingredientsNote?: string,
  history?: HistoryEntry[]
): Promise<NutritionResult> {
  const genAI = new GoogleGenerativeAI(apiKey);

  let contextParts = "";

  if (portionGrams) {
    contextParts += `\nBerat total makanan: ${portionGrams} gram.`;
  }

  if (ingredientsNote) {
    contextParts += `\nDeskripsi isi piring dari user: "${ingredientsNote}".`;
  }

  if (history && history.length > 0) {
    const historyText = history
      .map(
        (h) =>
          `- ${h.foodName}${h.ingredientsNote ? ` (${h.ingredientsNote})` : ""}${h.portionGrams ? `, berat ${h.portionGrams}g` : ""}: ${h.calories} kkal, protein ${h.protein}g, karbo ${h.carbs}g, lemak ${h.fat}g${h.wasEdited ? " [data dikonfirmasi user]" : ""}`
      )
      .join("\n");
    contextParts += `\n\nData historis makanan serupa dari user ini (gunakan sebagai referensi kalibrasi):\n${historyText}`;
  }

  const prompt = `Kamu adalah ahli gizi yang menganalisis kandungan nutrisi makanan dari foto.
Analisis makanan dalam foto ini dan berikan estimasi kandungan nutrisinya.${contextParts}

Berikan respons HANYA dalam format JSON berikut, tanpa teks lain:
{
  "isFood": <true kalau foto jelas berisi makanan/minuman yang bisa dimakan, false kalau bukan>,
  "foodName": "nama makanan dalam bahasa Indonesia",
  "calories": <integer kkal>,
  "protein": <gram, satu desimal>,
  "carbs": <gram, satu desimal>,
  "fat": <gram, satu desimal>,
  "proteinSource": "rincian komponen makanan penyumbang protein, sebutkan bahan & perkiraan kontribusinya",
  "carbsSource": "rincian komponen makanan penyumbang karbohidrat, sebutkan bahan & perkiraan kontribusinya",
  "fatSource": "rincian komponen makanan penyumbang lemak, sebutkan bahan & perkiraan kontribusinya"
}

Pedoman:
- PENTING: kalau foto BUKAN makanan/minuman (mis. orang, pemandangan, benda, dokumen), set "isFood": false dan isi field lain dengan 0/string kosong. JANGAN mengarang nilai gizi.
- Kalau foto berisi makanan, set "isFood": true dan isi semua nilai.
- Kalau ada data historis, gunakan sebagai acuan kalibrasi tapi tetap estimasi dari foto
- Kalau ada gramasi, sesuaikan porsi dengan berat tersebut
- Kalau ada deskripsi isi piring, prioritaskan deskripsi untuk identifikasi komponen makanan
- Berikan estimasi yang realistis untuk makanan Indonesia
- Untuk proteinSource/carbsSource/fatSource: jelaskan ringkas tapi spesifik dari bahan mana makro itu berasal, contoh "Ayam goreng ~20g, telur ~6g" untuk protein. Gunakan bahasa Indonesia.`;

  const requestParts = [
    prompt,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ];

  let lastError: unknown = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(requestParts);

      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Respons Gemini tidak valid");

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isFood: parsed.isFood !== false, // default true kalau model tak mengisi
        foodName: parsed.foodName ?? "",
        calories: Math.round(parsed.calories) || 0,
        protein: parseFloat(parsed.protein) || 0,
        carbs: parseFloat(parsed.carbs) || 0,
        fat: parseFloat(parsed.fat) || 0,
        proteinSource: parsed.proteinSource ?? "",
        carbsSource: parsed.carbsSource ?? "",
        fatSource: parsed.fatSource ?? "",
      };
    } catch (err) {
      lastError = err;
      // Lanjut ke model berikutnya kalau model ini tidak tersedia / error.
      console.warn(`Model ${modelName} gagal, mencoba fallback berikutnya:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError ?? new Error("Semua model Gemini gagal merespons");
}
