"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { assertFriendship, isUuid, memberFilter, otherMember, pair } from "@/lib/friends";
import { notify } from "@/lib/notifications";
import { getOrCreateProfile, normalizeFriendCode } from "@/lib/profiles";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

type Result = { ok: true; message: string } | { ok: false; message: string };

function refresh(friendshipId?: string) {
  revalidatePath("/friends");
  revalidatePath("/dashboard");
  if (friendshipId) revalidatePath(`/friends/${friendshipId}`);
}

export async function sendFriendRequest(rawCode: string): Promise<Result> {
  const user = await requireUser();
  const code = normalizeFriendCode(rawCode);
  if (!code) {
    return { ok: false, message: "Geçersiz kod. 8 karakter olmalı (ör. K7Q2-M9XP); kodlarda 0, O, 1, I ve L yok." };
  }

  const db = supabaseAdmin();
  const { data: target, error } = await db
    .from("profiles")
    .select("user_id, display_name")
    .eq("friend_code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!target) return { ok: false, message: "Bu koda sahip kimse bulunamadı" };
  if (target.user_id === user.id) return { ok: false, message: "Bu senin kendi kodun 🙂" };

  // Make sure the requester has a profile too, so the other side sees a name.
  await getOrCreateProfile(user);

  const key = pair(user.id, target.user_id);
  const { data: existing } = await db
    .from("friendships")
    .select("id, status, requested_by")
    .eq("user_a", key.user_a)
    .eq("user_b", key.user_b)
    .maybeSingle();

  if (existing?.status === "accepted") return { ok: false, message: `${target.display_name} zaten arkadaşın` };
  if (existing && existing.requested_by === user.id) {
    return { ok: false, message: "İsteğin zaten gönderildi, cevap bekleniyor" };
  }
  if (existing) {
    // They already asked us — sending a request back means yes.
    const { error: e } = await db
      .from("friendships")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (e) throw new Error(e.message);
    after(() => notify({ to: target.user_id, from: user.id, type: "friend_accepted", friendshipId: existing.id }));
    refresh(existing.id);
    return { ok: true, message: `${target.display_name} ile artık arkadaşsınız 💕` };
  }

  const { data: created, error: e } = await db
    .from("friendships")
    .insert({ ...key, requested_by: user.id })
    .select("id")
    .single();
  if (e) throw new Error(e.message);
  after(() => notify({ to: target.user_id, from: user.id, type: "friend_request", friendshipId: created.id }));
  refresh();
  return { ok: true, message: `${target.display_name} kişisine istek gönderildi` };
}

export async function respondToRequest(friendshipId: string, accept: boolean) {
  const user = await requireUser();
  if (!isUuid(friendshipId)) throw new Error("Geçersiz istek");
  const db = supabaseAdmin();
  // Only the receiving side of a pending request may answer it.
  const query = accept
    ? db.from("friendships").update({ status: "accepted", accepted_at: new Date().toISOString() })
    : db.from("friendships").delete();
  const { data, error } = await query
    .eq("id", friendshipId)
    .eq("status", "pending")
    .neq("requested_by", user.id)
    .or(memberFilter(user.id))
    .select("requested_by");
  if (error) throw new Error(error.message);
  const requester = data?.[0]?.requested_by;
  if (accept && requester) {
    after(() => notify({ to: requester, from: user.id, type: "friend_accepted", friendshipId }));
  }
  refresh(friendshipId);
}

export async function cancelRequest(friendshipId: string) {
  const user = await requireUser();
  if (!isUuid(friendshipId)) throw new Error("Geçersiz istek");
  const { error } = await supabaseAdmin()
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("status", "pending")
    .eq("requested_by", user.id);
  if (error) throw new Error(error.message);
  refresh();
}

/** Shared photos and activities go back to whoever added them (on delete set null). */
export async function removeFriend(friendshipId: string) {
  const user = await requireUser();
  await assertFriendship(user.id, friendshipId);
  const { error } = await supabaseAdmin().from("friendships").delete().eq("id", friendshipId);
  if (error) throw new Error(error.message);
  refresh();
  revalidatePath("/photos");
  revalidatePath("/activities");
}

export async function updateDisplayName(name: string): Promise<Result> {
  const user = await requireUser();
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 40);
  if (!clean) return { ok: false, message: "Ad boş olamaz" };
  await getOrCreateProfile(user);
  const { error } = await supabaseAdmin().from("profiles").update({ display_name: clean }).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return { ok: true, message: "Adın güncellendi" };
}

export async function sendNote(friendshipId: string, body: string) {
  const user = await requireUser();
  const friendship = await assertFriendship(user.id, friendshipId);
  const text = body.trim().slice(0, 280);
  if (!text) throw new Error("Not boş olamaz");
  const { error } = await supabaseAdmin()
    .from("notes")
    .insert({ friendship_id: friendshipId, author_id: user.id, body: text });
  if (error) throw new Error(error.message);
  after(() =>
    notify({
      to: otherMember(friendship, user.id),
      from: user.id,
      type: "note",
      friendshipId,
      data: { body: text.length > 120 ? `${text.slice(0, 117)}…` : text },
    }),
  );
  refresh(friendshipId);
}

export async function markNotesRead(friendshipId: string) {
  const user = await requireUser();
  await assertFriendship(user.id, friendshipId);
  const db = supabaseAdmin();
  const readAt = new Date().toISOString();
  const [notes, notifications] = await Promise.all([
    db
      .from("notes")
      .update({ read_at: readAt })
      .eq("friendship_id", friendshipId)
      .neq("author_id", user.id)
      .is("read_at", null),
    // The bell's "new note" entries for this chat are read too.
    db
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", user.id)
      .eq("friendship_id", friendshipId)
      .eq("type", "note")
      .is("read_at", null),
  ]);
  if (notes.error) throw new Error(notes.error.message);
  if (notifications.error) throw new Error(notifications.error.message);
  refresh(friendshipId);
}
