"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";

interface Props {
  user: { name: string | null; email: string | null; image: string | null };
  isOwner: boolean;
}

interface QuotaStatus {
  hasQuota: boolean;
  remaining: number;
  total: number;
  resetInMs: number | null;
}

function formatResetTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

export default function SettingsClient({ user, isOwner }: Props) {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState(false);
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("gemini_api_key");
    setStoredKey(key);

    if (!isOwner) {
      fetch("/api/quota")
        .then((r) => r.json())
        .then((data) => setQuota(data));
    }
  }, [isOwner]);

  function handleSaveKey() {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    localStorage.setItem("gemini_api_key", trimmed);
    setStoredKey(trimmed);
    setEditingKey(false);
    setNewKey("");
  }

  function handleDeleteKey() {
    localStorage.removeItem("gemini_api_key");
    setStoredKey(null);
    setEditingKey(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* User profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 flex items-center gap-4">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={56}
            height={56}
            className="rounded-full"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
            👤
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{user.name ?? "User"}</p>
          <p className="text-sm text-gray-400">{user.email}</p>
          {isOwner && (
            <span className="inline-block mt-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              Unlimited Access
            </span>
          )}
        </div>
      </div>

      {/* Quota status (non-owner only) */}
      {!isOwner && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Status Kuota Gratis</h2>
          {quota ? (
            <div>
              {quota.hasQuota ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  <p className="text-sm text-gray-700">
                    {quota.remaining} dari {quota.total} scan gratis tersisa
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                    <p className="text-sm text-gray-700">Kuota gratis habis</p>
                  </div>
                  {quota.resetInMs != null && (
                    <p className="text-xs text-gray-400 ml-4">
                      Reset dalam {formatResetTime(quota.resetInMs)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
          )}
        </div>
      )}

      {/* API Key management (non-owner only) */}
      {!isOwner && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">API Key Gemini Pribadi</h2>
          <p className="text-xs text-gray-400 mb-4">
            Diperlukan setelah kuota gratis habis. Tersimpan hanya di browser ini — jika
            ganti device, kamu perlu input ulang.
          </p>

          {!editingKey ? (
            <div>
              {storedKey ? (
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-mono">
                      {storedKey.slice(0, 8)}••••••••{storedKey.slice(-4)}
                    </span>
                    <span className="text-xs text-green-600 font-medium">Tersimpan</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingKey(true); setNewKey(""); }}
                      className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium min-h-[44px] active:bg-gray-50"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={handleDeleteKey}
                      className="flex-1 border border-red-100 text-red-600 rounded-xl py-2.5 text-sm font-medium min-h-[44px] active:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingKey(true)}
                  className="w-full border border-dashed border-gray-200 text-gray-500 rounded-xl py-3 text-sm min-h-[44px] active:bg-gray-50"
                >
                  + Tambah API key
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Paste API key Gemini"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveKey}
                  className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-semibold min-h-[44px] active:opacity-80"
                >
                  Simpan
                </button>
                <button
                  onClick={() => { setEditingKey(false); setNewKey(""); }}
                  className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm font-medium min-h-[44px] active:bg-gray-200"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            Cara dapat API key gratis dari Google AI Studio →
          </a>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full border border-gray-200 text-gray-600 rounded-2xl py-4 text-base font-medium min-h-[44px] active:bg-gray-50 transition-colors mt-2"
      >
        Keluar
      </button>
    </div>
  );
}
