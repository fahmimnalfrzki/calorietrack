import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/scan");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🍎</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Catat Kalori</h1>
          <p className="mt-2 text-gray-500 text-base">
            Lacak kalori dari foto makanan
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-sm text-gray-600 text-center mb-6">
            Masuk untuk mulai melacak asupan kalori harianmu
          </p>
          <LoginButton />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Foto tidak disimpan. Hanya hasil estimasi yang dicatat.
        </p>
      </div>
    </div>
  );
}
