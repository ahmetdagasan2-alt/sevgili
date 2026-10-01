import "server-only";
import type { Activity } from "./activities";
import { supabaseAdmin } from "./supabase/server";

const COLUMNS = "id, title, description, category, done, done_at, created_at";

/** The user's personal activities (not in any shared list). */
export async function listActivities(userId: string): Promise<Activity[]> {
  const { data, error } = await supabaseAdmin()
    .from("activities")
    .select(COLUMNS)
    .eq("user_id", userId)
    .is("friendship_id", null)
    .order("done", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Activity[];
}

/** A friendship's shared list. Callers must have checked membership first. */
export async function listSharedActivities(friendshipId: string): Promise<Activity[]> {
  const { data, error } = await supabaseAdmin()
    .from("activities")
    .select(COLUMNS)
    .eq("friendship_id", friendshipId)
    .order("done", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Activity[];
}
