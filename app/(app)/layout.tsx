import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import WelcomeModalGate from "@/components/WelcomeModalGate";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const isOwner = session.user?.email === process.env.OWNER_EMAIL;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* padding bawah = tinggi bottom nav (56px) + safe-area iPhone + buffer,
          supaya konten paling bawah (mis. tombol Logout) tidak tertutup nav */}
      <main
        className="flex-1"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}
      >
        {children}
      </main>
      <BottomNav />
      <WelcomeModalGate isOwner={isOwner} />
    </div>
  );
}
