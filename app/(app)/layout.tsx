import { AppNav } from "@/components/app-nav";
import { realtimeChannelFor } from "@/lib/notifications";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <AppNav name={user.name} picture={user.picture} notificationChannel={realtimeChannelFor(user.id)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 md:pb-16">{children}</main>
    </>
  );
}
