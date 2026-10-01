import "server-only";
import { supabaseAdmin } from "./supabase/server";

export type Note = { id: string; authorId: string; body: string; createdAt: string; readAt: string | null };

/** Latest notes of a friendship, oldest first. Callers must have checked membership. */
export async function listNotes(friendshipId: string, limit = 50): Promise<Note[]> {
  const { data, error } = await supabaseAdmin()
    .from("notes")
    .select("id, author_id, body, created_at, read_at")
    .eq("friendship_id", friendshipId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data
    .map((n) => ({ id: n.id, authorId: n.author_id, body: n.body, createdAt: n.created_at, readAt: n.read_at }))
    .reverse();
}

export type UnreadNote = Note & { friendshipId: string };

/** Notes friends left for the user that they haven't opened yet (for the dashboard). */
export async function listUnreadNotes(userId: string, friendshipIds: string[], limit = 3): Promise<UnreadNote[]> {
  if (friendshipIds.length === 0) return [];
  const { data, error } = await supabaseAdmin()
    .from("notes")
    .select("id, friendship_id, author_id, body, created_at, read_at")
    .in("friendship_id", friendshipIds)
    .neq("author_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((n) => ({
    id: n.id,
    friendshipId: n.friendship_id,
    authorId: n.author_id,
    body: n.body,
    createdAt: n.created_at,
    readAt: n.read_at,
  }));
}
