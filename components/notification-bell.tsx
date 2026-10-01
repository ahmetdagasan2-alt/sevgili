"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { getNotifications, markAllNotificationsRead } from "@/app/(app)/notifications-actions";
import { Avatar } from "@/components/friends/avatar";
import type { NotificationItem } from "@/lib/notifications";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const rtf = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });

/** Dispatch on window when something else marked notifications read. */
export const NOTIFICATIONS_CHANGED = "notifications:changed";

function timeAgo(iso: string, now: number) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "az önce";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}

/**
 * Bell with unread badge + popup. Live updates come as data-less pings on a
 * private Supabase Realtime channel; on each ping we re-fetch through an
 * authenticated server action and refresh the current page in place.
 */
export function NotificationBell({ channel }: { channel: string }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(0);
  const [ringing, setRinging] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const lastSeenId = useRef<string | null>(null);

  const load = useCallback(async (announce: boolean) => {
    try {
      const res = await getNotifications();
      setItems(res.items);
      setUnread(res.unread);
      setNow(Date.now());
      const newest = res.items[0];
      if (announce && newest && !newest.read && newest.id !== lastSeenId.current) {
        toast(newest.text, {
          icon: "🔔",
          action: { label: "Göster", onClick: () => router.push(newest.href) },
        });
        setRinging(true);
        setTimeout(() => setRinging(false), 1200);
      }
      lastSeenId.current = newest?.id ?? null;
    } catch {
      // Signed out or offline — the bell just stays as it is.
    }
  }, [router]);

  // Re-check whenever the tab comes back to the foreground: browsers may sleep
  // the realtime connection of background tabs.
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && load(false);
    const onChanged = () => load(false);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged);
    };
  }, [load]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const sub = supabase
      .channel(channel)
      .on("broadcast", { event: "ping" }, () => {
        load(true);
        // New notes, photos, list items… show up on the open page without a reload.
        router.refresh();
      })
      // Fires on first connect and after every reconnect, so anything sent
      // while we were disconnected is picked up too.
      .subscribe((status) => {
        if (status === "SUBSCRIBED") load(false);
      });
    return () => {
      supabase.removeChannel(sub);
    };
  }, [channel, load, router]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setNow(Date.now());
      if (unread > 0) {
        setUnread(0);
        markAllNotificationsRead().catch(() => {});
      }
    } else {
      // Items opened once are no longer highlighted next time.
      setItems((list) => list.map((i) => ({ ...i, read: true })));
    }
  }

  const Icon = ringing ? BellRing : Bell;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Bildirimler, ${unread} okunmamış` : "Bildirimler"}
        aria-expanded={open}
        className="relative flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Icon className={cn("size-5", ringing && "animate-bounce text-primary")} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-primary-foreground ring-2 ring-cream">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Bildirimler"
          className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-hidden rounded-3xl border border-border bg-card shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-heading text-lg font-semibold text-rose-ink">Bildirimler</p>
          </div>
          <div className="max-h-[calc(70vh-3.5rem)] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Henüz bildirim yok. Arkadaşların bir şey yaptığında burada göreceksin 💌
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <Avatar name={n.actorName} src={n.actorAvatar} className="size-9" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm">{n.text}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt, now)}</p>
                      </div>
                      {!n.read ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
