import "server-only";
import { createHmac } from "node:crypto";
import { getProfiles } from "./profiles";
import { supabaseAdmin } from "./supabase/server";

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "note"
  | "shared_photo"
  | "shared_activity"
  | "activity_done"
  | "puzzle_record";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  text: string;
  href: string;
  actorName: string;
  actorAvatar: string | null;
  createdAt: string;
  read: boolean;
};

type Data = { body?: string; count?: number; title?: string; seconds?: number; photoId?: string };

/**
 * Private realtime channel name for a user. Derived with a server secret so it
 * can't be guessed; the pings sent on it carry no data anyway — the browser
 * fetches the actual notifications through an authenticated server action.
 */
export function realtimeChannelFor(userId: string): string {
  const secret = process.env.AUTH0_SECRET ?? "";
  return `n-${createHmac("sha256", secret).update(`notifications:${userId}`).digest("hex").slice(0, 40)}`;
}

/** Wake up the user's open tabs. Best effort: a failed ping never fails the action. */
async function ping(userId: string, type: NotificationType) {
  try {
    await supabaseAdmin().channel(realtimeChannelFor(userId)).httpSend("ping", { type });
  } catch (err) {
    console.error("Bildirim ping'i gönderilemedi", err);
  }
}

/** Record a notification for someone else and ping them. Never throws. */
export async function notify(input: {
  to: string;
  from: string;
  type: NotificationType;
  friendshipId?: string | null;
  data?: Data;
}) {
  if (input.to === input.from) return;
  try {
    const { error } = await supabaseAdmin().from("notifications").insert({
      user_id: input.to,
      actor_id: input.from,
      type: input.type,
      friendship_id: input.friendshipId ?? null,
      data: input.data ?? {},
    });
    if (error) throw error;
    await ping(input.to, input.type);
  } catch (err) {
    console.error("Bildirim kaydedilemedi", err);
  }
}

function describe(type: NotificationType, name: string, d: Data): string {
  switch (type) {
    case "friend_request":
      return `${name} sana arkadaşlık isteği gönderdi`;
    case "friend_accepted":
      return `${name} arkadaşlık isteğini kabul etti 💕`;
    case "note":
      return `${name}: “${d.body ?? ""}”`;
    case "shared_photo":
      return `${name} ortak albüme ${d.count && d.count > 1 ? `${d.count} fotoğraf` : "bir fotoğraf"} ekledi`;
    case "shared_activity":
      return `${name} ortak listeye ekledi: ${d.title ?? ""}`;
    case "activity_done":
      return `${name} “${d.title ?? ""}” aktivitesini tamamlandı olarak işaretledi`;
    case "puzzle_record":
      return `${name} puzzle rekorunu kırdı! 🏆`;
  }
}

function hrefFor(type: NotificationType, friendshipId: string | null, d: Data): string {
  if (!friendshipId || type === "friend_request") return "/friends";
  const space = `/friends/${friendshipId}`;
  switch (type) {
    case "note":
      return `${space}?tab=notlar`;
    case "shared_photo":
      return `${space}?tab=album`;
    case "shared_activity":
    case "activity_done":
      return `${space}?tab=liste`;
    case "puzzle_record":
      return d.photoId ? `/games/puzzle/${d.photoId}?size=3` : `${space}?tab=puzzle`;
    default:
      return space;
  }
}

export async function listNotifications(userId: string, limit = 20): Promise<{ items: NotificationItem[]; unread: number }> {
  const db = supabaseAdmin();
  const [{ data, error }, { count, error: countError }] = await Promise.all([
    db
      .from("notifications")
      .select("id, actor_id, type, friendship_id, data, created_at, read_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
  ]);
  if (error) throw error;
  if (countError) throw countError;

  const profiles = await getProfiles([...new Set(data.map((n) => n.actor_id))]);
  return {
    unread: count ?? 0,
    items: data.map((n) => {
      const actor = profiles.get(n.actor_id);
      const name = actor?.displayName ?? "Bir arkadaşın";
      return {
        id: n.id,
        type: n.type as NotificationType,
        text: describe(n.type as NotificationType, name, n.data as Data),
        href: hrefFor(n.type as NotificationType, n.friendship_id, n.data as Data),
        actorName: name,
        actorAvatar: actor?.avatarUrl ?? null,
        createdAt: n.created_at,
        read: n.read_at !== null,
      };
    }),
  };
}
