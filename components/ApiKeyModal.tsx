"use client";

import { useState } from "react";

interface Props {
  onSave: () => void;
  onClose: () => void;
}

export default function ApiKeyModal({ onSave, onClose }: Props) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    const trimmed = key.trim();
    if (!trimmed) {
      setError("API key tidak boleh kosong.");
      return;
    }
    localStorage.setItem("gemini_api_key", trimmed);
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Kuota gratis habis</h2>
        <p className="text-sm text-gray-500 mb-4">
          Kamu sudah memakai 3 scan gratis dalam 24 jam terakhir. Masukkan API key
          Gemini milikmu untuk melanjutkan tanpa batas.
        </p>

        <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Cara dapat API key gratis:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>
              Buka{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Google AI Studio
              </a>
            </li>
            <li>Login dengan akun Google</li>
            <li>Klik &quot;Get API key&quot; → &quot;Create API key&quot;</li>
            <li>Copy dan paste ke sini</li>
          </ol>
        </div>

        <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">
          ⚠️ API key hanya tersimpan di browser ini. Jika ganti device atau hapus data
          browser, kamu perlu input ulang.
        </div>

        <input
          type="text"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(""); }}
          placeholder="Paste API key Gemini kamu di sini"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 mb-1"
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-gray-900 text-white rounded-xl py-3 font-semibold min-h-[44px] active:opacity-80 transition-opacity"
          >
            Simpan & Analisis
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-medium min-h-[44px] active:bg-gray-200 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
