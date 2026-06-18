"use client";

import { useState, useRef } from "react";
import ApiKeyModal from "./ApiKeyModal";
import AutoTextarea from "./AutoTextarea";
import { normalizeImage } from "@/lib/image";

interface NutritionResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinSource: string;
  carbsSource: string;
  fatSource: string;
}

interface EditableResult extends NutritionResult {
  edited: boolean;
}

export default function ScanClient({ userEmail }: { userEmail: string }) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [portionGrams, setPortionGrams] = useState("");
  const [ingredientsNote, setIngredientsNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [result, setResult] = useState<EditableResult | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function readAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function handleFile(file: File) {
    setResult(null);
    setSaved(false);
    setError(null);
    setProcessingImage(true);
    console.log("[scan] file dipilih:", file.name, file.type, `${(file.size / 1024).toFixed(0)}KB`);

    try {
      // Normalkan ke JPEG (konversi HEIC iPhone + format lain + kompresi).
      const { blob } = await normalizeImage(file);
      console.log("[scan] normalisasi sukses → JPEG", `${(blob.size / 1024).toFixed(0)}KB`);
      // Preview pakai data URL (bebas masalah lifecycle object URL), pasti renderable.
      const dataUrl = await readAsDataUrl(blob);
      setImagePreview(dataUrl);
      setImageFile(new File([blob], "photo.jpg", { type: "image/jpeg" }));
    } catch (err) {
      console.error("[scan] normalisasi GAGAL, fallback ke file asli:", err);
      // Fallback: pakai file asli (Gemini mendukung HEIC; preview mungkin tak tampil di non-Safari).
      try {
        const dataUrl = await readAsDataUrl(file);
        setImagePreview(dataUrl);
      } catch {
        setImagePreview(null);
      }
      setImageFile(file);
    } finally {
      setProcessingImage(false);
    }
  }

  async function handleAnalyze() {
    if (!imageFile) return;
    setLoading(true);
    setError(null);

    const apiKey = localStorage.getItem("gemini_api_key");

    const formData = new FormData();
    formData.append("image", imageFile);
    if (portionGrams) formData.append("portionGrams", portionGrams);
    if (ingredientsNote) formData.append("ingredientsNote", ingredientsNote);
    if (apiKey) formData.append("apiKey", apiKey);

    try {
      const res = await fetch("/api/scan", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "QUOTA_EXCEEDED") {
          setShowApiModal(true);
        } else {
          setError(data.message || "Gagal menganalisis foto.");
        }
        return;
      }

      setResult({ ...data, edited: false });
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi internet kamu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: result.foodName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          proteinSource: result.proteinSource,
          carbsSource: result.carbsSource,
          fatSource: result.fatSource,
          portionGrams: portionGrams ? parseFloat(portionGrams) : null,
          ingredientsNote: ingredientsNote || null,
          wasEdited: result.edited,
        }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        setError("Gagal menyimpan data.");
      }
    } catch {
      setError("Gagal menyimpan data.");
    }
  }

  function handleReset() {
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
    setSaved(false);
    setError(null);
    setPortionGrams("");
    setIngredientsNote("");
  }

  function updateResult(field: keyof NutritionResult, value: string | number) {
    if (!result) return;
    setResult({ ...result, [field]: value, edited: true });
  }

  function handleApiKeySaved() {
    setShowApiModal(false);
    handleAnalyze();
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Scan Makanan</h1>

      {/* Photo input area */}
      {processingImage && !imagePreview ? (
        <div className="rounded-2xl bg-gray-100 aspect-[4/3] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Memproses gambar...</p>
        </div>
      ) : !imagePreview ? (
        <div className="space-y-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full bg-gray-900 text-white rounded-2xl py-4 text-base font-semibold min-h-[56px] flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2" />
            </svg>
            Ambil Foto
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="w-full bg-white border border-gray-200 text-gray-700 rounded-2xl py-4 text-base font-medium min-h-[56px] flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#374151" strokeWidth="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="#374151" />
              <path d="m21 15-5-5L5 21" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Pilih dari Galeri
          </button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Photo preview */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview makanan"
              className="w-full h-full object-cover"
            />
            {!result && !loading && (
              <button
                onClick={handleReset}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Optional fields */}
          {!result && !loading && (
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Berat porsi (gram) — opsional"
                value={portionGrams}
                onChange={(e) => setPortionGrams(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <textarea
                placeholder="Deskripsi isi piring — opsional (misal: nasi goreng, ayam suwir, telur mata sapi)"
                value={ingredientsNote}
                onChange={(e) => setIngredientsNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
              <button
                onClick={handleAnalyze}
                className="w-full bg-gray-900 text-white rounded-2xl py-4 text-base font-semibold min-h-[56px] active:opacity-80 transition-opacity"
              >
                Analisis
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Menganalisis makanan...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Result card */}
          {result && !loading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Food name */}
              <div className="px-5 pt-5 pb-2">
                <input
                  type="text"
                  value={result.foodName}
                  onChange={(e) => updateResult("foodName", e.target.value)}
                  className="w-full text-lg font-semibold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-gray-400 focus:outline-none bg-transparent pb-1"
                />
              </div>

              {/* Calories — big number */}
              <div className="px-5 py-4 flex items-baseline gap-2">
                <input
                  type="number"
                  value={result.calories}
                  onChange={(e) => updateResult("calories", parseInt(e.target.value) || 0)}
                  className="text-6xl font-bold text-gray-900 w-36 border-b-2 border-transparent hover:border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent text-right leading-none"
                />
                <span className="text-gray-400 text-base font-medium">kkal</span>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-gray-100">
                {(["protein", "carbs", "fat"] as const).map((macro) => {
                  const labels = { protein: "Protein", carbs: "Karbo", fat: "Lemak" };
                  return (
                    <div key={macro} className="bg-white px-4 py-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">{labels[macro]}</p>
                      <div className="flex items-baseline justify-center gap-0.5">
                        <input
                          type="number"
                          value={result[macro]}
                          step="0.1"
                          onChange={(e) =>
                            updateResult(macro, parseFloat(e.target.value) || 0)
                          }
                          className="w-14 text-lg font-semibold text-gray-900 text-center border-b border-transparent hover:border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent"
                        />
                        <span className="text-gray-400 text-xs">g</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rincian sumber makro */}
              <div className="px-5 py-4 border-t border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Rincian Nutrisi
                </p>
                {([
                  { key: "proteinSource", label: "Protein", color: "bg-rose-400" },
                  { key: "carbsSource", label: "Karbo", color: "bg-amber-400" },
                  { key: "fatSource", label: "Lemak", color: "bg-sky-400" },
                ] as const).map(({ key, label, color }) => (
                  <div key={key} className="flex gap-3">
                    <div className="flex items-center gap-1.5 w-16 shrink-0 pt-1.5">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-xs font-medium text-gray-600">{label}</span>
                    </div>
                    <AutoTextarea
                      value={result[key]}
                      onChange={(e) => updateResult(key, e.target.value)}
                      placeholder="Sumber tidak tersedia"
                      className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5 border border-transparent focus:border-gray-300 focus:bg-white focus:outline-none resize-none placeholder-gray-300 leading-snug"
                    />
                  </div>
                ))}
              </div>

              {/* Save / Rescan */}
              <div className="px-5 py-4 flex gap-3">
                {!saved ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-gray-900 text-white rounded-xl py-3 font-semibold text-base min-h-[44px] active:opacity-80 transition-opacity"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-medium text-base min-h-[44px] active:bg-gray-200 transition-colors"
                    >
                      Scan ulang
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <p className="text-green-600 font-semibold">Tersimpan ✓</p>
                    <button
                      onClick={handleReset}
                      className="text-gray-500 text-sm underline"
                    >
                      Scan makanan lain
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showApiModal && (
        <ApiKeyModal
          onSave={handleApiKeySaved}
          onClose={() => setShowApiModal(false)}
        />
      )}
    </div>
  );
}
