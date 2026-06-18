import { auth } from "@/lib/auth";
import Link from "next/link";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const session = await auth();
  const loggedIn = !!session;

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍎</span>
            <span className="font-bold text-gray-900 text-lg">Catat Kalori</span>
          </div>
          {loggedIn ? (
            <Link
              href="/scan"
              className="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-full min-h-[40px] flex items-center active:opacity-80"
            >
              Buka Dashboard
            </Link>
          ) : (
            <div className="w-auto">
              <LoginButton compact />
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-14 pb-10 text-center">
        <div className="flex justify-center gap-3 text-5xl sm:text-6xl mb-6">
          <span>🍱</span>
          <span>🥗</span>
          <span>🍛</span>
          <span>🔥</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
          Lacak kalori cukup dari{" "}
          <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
            foto makanan
          </span>
        </h1>
        <p className="mt-4 text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
          Foto makananmu, AI langsung memperkirakan kalori, protein, karbohidrat,
          dan lemaknya. Tanpa repot timbang atau cari-cari data manual.
        </p>
        <div className="mt-8 flex justify-center">
          {loggedIn ? (
            <Link
              href="/scan"
              className="bg-gray-900 text-white font-semibold px-6 py-3.5 rounded-full text-base min-h-[48px] flex items-center active:opacity-80"
            >
              Mulai Scan →
            </Link>
          ) : (
            <LoginButton />
          )}
        </div>
        {!loggedIn && (
          <p className="mt-3 text-xs text-gray-400">
            Gratis. Login pakai akun Google.
          </p>
        )}
      </section>

      {/* Overview / fitur */}
      <section className="max-w-5xl mx-auto px-5 py-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: "📷",
              title: "Foto & Analisis",
              desc: "Ambil foto langsung atau pilih dari galeri. AI Gemini mengenali makanan dan menghitung gizinya.",
            },
            {
              icon: "🔥",
              title: "Kalori & Makro",
              desc: "Lihat kalori, protein, karbo, dan lemak — lengkap dengan rincian dari bahan mana asalnya.",
            },
            {
              icon: "📈",
              title: "Tren Harian",
              desc: "Pantau tren konsumsi 7 atau 30 hari, dengan riwayat per hari yang bisa diedit.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cara kerja */}
      <section className="max-w-5xl mx-auto px-5 py-10">
        <h2 className="text-center text-xl font-bold text-gray-900 mb-8">
          Cara kerjanya
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { n: "1", t: "Foto makanan", d: "Jepret piringmu atau unggah dari galeri." },
            { n: "2", t: "AI menganalisis", d: "Estimasi kalori & makro muncul dalam hitungan detik." },
            { n: "3", t: "Simpan & pantau", d: "Data tersimpan ke riwayat dan tren harianmu." },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gray-900 text-white font-bold flex items-center justify-center mb-3">
                {s.n}
              </div>
              <h3 className="font-semibold text-gray-900">{s.t}</h3>
              <p className="text-sm text-gray-500 mt-1">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bawah */}
      {!loggedIn && (
        <section className="max-w-5xl mx-auto px-5 py-12">
          <div className="bg-gray-900 rounded-3xl px-6 py-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Siap mulai?</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Login dengan Google dan catat makananmu yang pertama hari ini.
            </p>
            <div className="flex justify-center">
              <LoginButton />
            </div>
          </div>
        </section>
      )}

      <footer className="max-w-5xl mx-auto px-5 py-8 text-center text-xs text-gray-400 border-t border-gray-100">
        Catat Kalori · Foto tidak disimpan, hanya hasil estimasinya.
      </footer>
    </div>
  );
}
