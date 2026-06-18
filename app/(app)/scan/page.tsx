import { auth } from "@/lib/auth";
import ScanClient from "@/components/ScanClient";

export default async function ScanPage() {
  const session = await auth();
  return <ScanClient userEmail={session?.user?.email ?? ""} />;
}
