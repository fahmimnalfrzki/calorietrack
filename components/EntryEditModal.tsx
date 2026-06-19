"use client";

import { useState } from "react";
import AutoTextarea from "./AutoTextarea";

export interface EditableEntry {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinSource: string;
  carbsSource: string;
  fatSource: string;
  portionGrams: number | null;
  ingredientsNote: string | null;
  createdAt: string;
  wasEdited: boolean;
}

interface Props {
  entry: EditableEntry;
  onSaved: () => void;
  onDeleted: () => void;
  onClose: () => void;
}

const MACROS = [
  { key: "protein", srcKey: "proteinSource", label: "Protein", color: "bg-rose-400" },
  { key: "carbs", srcKey: "carbsSource", label: "Karbo", color: "bg-amber-400" },
  { key: "fat", srcKey: "fatSource", label: "Lemak", color: "bg-sky-400" },
] as const;

export default function EntryEditModal({ entry, onSaved, onDeleted, onClose }: Props) {
  const [data, setData] = useState<EditableEntry>(entry);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof EditableEntry>(key: K, value: EditableEntry[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      onSaved();
    } catch {
      setError("Gagal menyimpan perubahan.");
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/entries?id=${data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDeleted();
    } catch {
      setError("Gagal menghapus data.");
      setBusy(false);
    }
  }

  const isEdit = mode === "edit";
  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data.createdAt));

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "Edit Entri" : "Detail Entri"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Food name */}
        <div className="px-5 pt-4 pb-1">
          {isEdit ? (
            <input
              type="text"
              value={data.foodName}
              onChange={(e) => update("foodName", e.target.value)}
              className="w-full text-lg font-semibold text-gray-900 border-b border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent pb-1"
            />
          ) : (
            <h3 className="text-lg font-semibold text-gray-900 leading-snug">{data.foodName}</h3>
          )}
          {!isEdit && (
            <p className="text-xs text-gray-400 mt-1 capitalize">
              {dateLabel}
              {data.wasEdited && (
                <span className="ml-2 inline-block bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] align-middle">
                  diedit
                </span>
              )}
            </p>
          )}
        </div>

        {/* Calories */}
        <div className="px-5 py-3 flex items-baseline gap-2">
          {isEdit ? (
            <input
              type="number"
              value={data.calories}
              onChange={(e) => update("calories", parseInt(e.target.value) || 0)}
              className="text-5xl font-bold text-gray-900 w-32 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent text-right leading-none"
            />
          ) : (
            <span className="text-5xl font-bold text-gray-900 leading-none">{data.calories}</span>
          )}
          <span className="text-gray-400 text-base font-medium">kkal</span>
        </div>

        {/* Macros + sources */}
        <div className="px-5 py-3 space-y-3 border-t border-gray-100">
          {MACROS.map((m) => (
            <div key={m.key} className="flex gap-3 items-start">
              <div className="flex items-center gap-1.5 w-24 shrink-0 pt-1">
                <span className={`w-2 h-2 rounded-full ${m.color}`} />
                <span className="text-sm font-medium text-gray-700">{m.label}</span>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-baseline gap-1">
                  {isEdit ? (
                    <input
                      type="number"
                      step="0.1"
                      value={data[m.key]}
                      onChange={(e) => update(m.key, parseFloat(e.target.value) || 0)}
                      className="w-16 text-base font-semibold text-gray-900 border-b border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent"
                    />
                  ) : (
                    <span className="text-base font-semibold text-gray-900">{data[m.key]}</span>
                  )}
                  <span className="text-gray-400 text-xs">g</span>
                </div>
                {isEdit ? (
                  <AutoTextarea
                    value={data[m.srcKey] ?? ""}
                    onChange={(e) => update(m.srcKey, e.target.value)}
                    placeholder="Sumber tidak tersedia"
                    className="w-full text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-transparent focus:border-gray-300 focus:bg-white focus:outline-none resize-none placeholder-gray-300 leading-snug"
                  />
                ) : (
                  <p className="text-xs text-gray-500 leading-snug">
                    {data[m.srcKey] || <span className="text-gray-300">Sumber tidak tersedia</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info tambahan (porsi & catatan) — hanya di mode detail */}
        {!isEdit && (data.portionGrams != null || data.ingredientsNote) && (
          <div className="px-5 py-3 border-t border-gray-100 space-y-1.5">
            {data.portionGrams != null && (
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">Porsi:</span> {data.portionGrams} g
              </p>
            )}
            {data.ingredientsNote && (
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">Catatan:</span> {data.ingredientsNote}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mx-5 mb-2 bg-red-50 border border-red-100 rounded-xl p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div
          className="sticky bottom-0 bg-white px-5 pt-4 flex gap-3 border-t border-gray-100"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
        >
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold text-base min-h-[44px] active:opacity-80 transition-opacity disabled:opacity-50"
              >
                {busy ? "Menghapus..." : "Ya, hapus entri ini"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
                className="px-5 bg-gray-100 text-gray-600 rounded-xl py-3 font-medium text-base min-h-[44px] active:bg-gray-200 transition-colors"
              >
                Batal
              </button>
            </>
          ) : isEdit ? (
            <>
              <button
                onClick={handleSave}
                disabled={busy}
                className="flex-1 bg-gray-900 text-white rounded-xl py-3 font-semibold text-base min-h-[44px] active:opacity-80 transition-opacity disabled:opacity-50"
              >
                {busy ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={() => { setData(entry); setMode("view"); setError(null); }}
                disabled={busy}
                className="px-5 bg-gray-100 text-gray-600 rounded-xl py-3 font-medium text-base min-h-[44px] active:bg-gray-200 transition-colors"
              >
                Batal
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setMode("edit")}
                className="flex-1 bg-gray-900 text-white rounded-xl py-3 font-semibold text-base min-h-[44px] active:opacity-80 transition-opacity"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-5 bg-red-50 text-red-600 rounded-xl py-3 font-medium text-base min-h-[44px] active:bg-red-100 transition-colors"
              >
                Hapus
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
