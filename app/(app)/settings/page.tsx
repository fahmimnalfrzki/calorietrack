import { auth } from "@/lib/auth";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  const isOwner = session?.user?.email === process.env.OWNER_EMAIL;

  return (
    <SettingsClient
      user={{
        name: session?.user?.name ?? null,
        email: session?.user?.email ?? null,
        image: session?.user?.image ?? null,
      }}
      isOwner={isOwner}
    />
  );
}
