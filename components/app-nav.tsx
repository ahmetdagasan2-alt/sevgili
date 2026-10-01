"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Gamepad2, Heart, House, ListChecks, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";

const LINKS = [
  { href: "/dashboard", label: "Anasayfa", icon: House },
  { href: "/photos", label: "Fotoğraflar", icon: Camera },
  { href: "/games", label: "Oyunlar", icon: Gamepad2 },
  { href: "/activities", label: "Aktiviteler", icon: ListChecks },
  { href: "/friends", label: "Arkadaşlar", icon: Users },
];

/** Swaps the link icon for a beating heart while that navigation is in flight. */
function PendingIcon({ icon: Icon, className }: { icon: typeof House; className: string }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <Heart className={cn(className, "animate-pulse fill-primary text-primary")} />
  ) : (
    <Icon className={className} />
  );
}

export function AppNav({
  name,
  picture,
  notificationChannel,
}: {
  name: string;
  picture?: string;
  notificationChannel: string;
}) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Heart className="size-5 fill-primary text-primary" />
            <span className="font-hand text-2xl text-rose-ink">Bizim Sitemiz</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    active && "bg-primary/10 text-primary",
                  )}
                >
                  <PendingIcon icon={Icon} className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell channel={notificationChannel} />
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picture} alt={name} className="size-8 rounded-full border border-border object-cover" />
            ) : null}
            {/* Plain <a>: logout must be a full navigation, not a client-side route */}
            <a
              href="/auth/logout"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </a>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-cream/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground",
                  active && "text-primary",
                )}
              >
                <PendingIcon icon={Icon} className="size-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
