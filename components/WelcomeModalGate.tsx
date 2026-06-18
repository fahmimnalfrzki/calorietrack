"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "welcome_dismissed";

export default function WelcomeModalGate({ isOwner }: { isOwner: boolean }) {
  const [show, setShow] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (isOwner) return; // owner unlimited, tidak perlu info kuota
    const hasKey = localStorage.getItem("gemini_api_key");
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!hasKey && !dismissed) setShow(true);
  }, [isOwner]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  function saveKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    localStorage.setItem("gemini_api_key", trimmed);
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl">
        <div className="text-4xl mb-3 text-center">👋</div>
        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">
          Selamat datang di Catat Kalori!
        </h2>
        <p className="text-sm text-gray-500 text-center mb-4">
          Sebelum mulai, satu hal penting soal kuota scan.
        </p>

        <div className="space-y-2 mb-4">
          <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
            <p className="font-medium mb-0.5">Tanpa API key sendiri</p>
            <p className="text-amber-700">
              Gratis, tapi dibatasi <b>maksimal 3 scan per 24 jam</b>.
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-sm text-green-800">
            <p className="font-medium mb-0.5">Dengan API key Gemini sendiri</p>
            <p className="text-green-700">
              Scan <b>tanpa batas</b>. Gratis dari Google AI Studio. Key hanya
              tersimpan di browser ini.
            </p>
          </div>
        </div>

        {!showInput ? (
          <div className="space-y-2">
            <button
              onClick={() => setShowInput(true)}
              className="w-full bg-gray-900 text-white rounded-xl py-3 font-semibold min-h-[44px] active:opacity-80 transition-opacity"
            >
              Input API key sekarang
            </button>
            <button
              onClick={dismiss}
              className="w-full bg-gray-100 text-gray-600 rounded-xl py-3 font-medium min-h-[44px] active:bg-gray-200 transition-colors"
            >
              Nanti saja (pakai 3 scan gratis)
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-600 hover:underline mb-1"
            >
              Cara dapat API key gratis dari Google AI Studio →
            </a>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste API key Gemini kamu"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <div className="flex gap-2">
              <button
                onClick={saveKey}
                className="flex-1 bg-gray-900 text-white rounded-xl py-3 font-semibold min-h-[44px] active:opacity-80 transition-opacity"
              >
                Simpan
              </button>
              <button
                onClick={dismiss}
                className="px-5 bg-gray-100 text-gray-600 rounded-xl py-3 font-medium min-h-[44px] active:bg-gray-200 transition-colors"
              >
                Lewati
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
