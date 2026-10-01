import "server-only";
import { supabaseAdmin } from "./supabase/server";

export type BestScore = { seconds: number; moves: number } | null;

export type BestByGrid = Record<number, BestScore>;

/**
 * Each player's best score per grid size for one photo, in a single query.
 * In shared albums this is the head-to-head between the two friends.
 */
export async function getBestScoresFor(photoId: string, userIds: string[]): Promise<Record<string, BestByGrid>> {
  const { data, error } = await supabaseAdmin()
    .from("puzzle_scores")
    .select("user_id, grid_size, seconds, moves")
    .eq("photo_id", photoId)
    .in("user_id", userIds)
    .order("seconds", { ascending: true })
    .order("moves", { ascending: true });
  if (error) throw error;
  const best: Record<string, BestByGrid> = Object.fromEntries(userIds.map((id) => [id, {}]));
  for (const row of data) {
    best[row.user_id][row.grid_size] ??= { seconds: row.seconds, moves: row.moves };
  }
  return best;
}

/**
 * How many (photo, grid size) records each player holds across a shared album.
 * Faster time wins; fewer moves breaks a tie.
 */
export async function getHeadToHead(photoIds: string[], userIds: string[]): Promise<Record<string, number>> {
  const wins: Record<string, number> = Object.fromEntries(userIds.map((id) => [id, 0]));
  if (photoIds.length === 0) return wins;
  const { data, error } = await supabaseAdmin()
    .from("puzzle_scores")
    .select("user_id, photo_id, grid_size, seconds, moves")
    .in("photo_id", photoIds)
    .in("user_id", userIds);
  if (error) throw error;
  const best = new Map<string, { userId: string; seconds: number; moves: number }>();
  for (const s of data) {
    const key = `${s.photo_id}:${s.grid_size}`;
    const cur = best.get(key);
    if (!cur || s.seconds < cur.seconds || (s.seconds === cur.seconds && s.moves < cur.moves)) {
      best.set(key, { userId: s.user_id, seconds: s.seconds, moves: s.moves });
    }
  }
  for (const { userId } of best.values()) wins[userId]++;
  return wins;
}

export async function countSolved(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("puzzle_scores")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}
