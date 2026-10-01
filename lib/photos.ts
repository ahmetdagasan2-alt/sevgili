import "server-only";
import { findFriendship, isUuid } from "./friends";
import { PHOTO_BUCKET, supabaseAdmin } from "./supabase/server";

export type Photo = {
  id: string;
  url: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  /** Who uploaded it */
  userId: string;
  /** Set when the photo lives in a friendship's shared album */
  friendshipId: string | null;
};

type PhotoRow = {
  id: string;
  user_id: string;
  friendship_id: string | null;
  storage_path: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
};

const COLUMNS = "id, user_id, friendship_id, storage_path, caption, width, height, created_at";

const SIGNED_URL_TTL = 60 * 60; // 1 saat
const MIN_REMAINING_MS = 15 * 60 * 1000;

// Reusing signed URLs skips a Supabase round trip on most requests and keeps
// image URLs stable, so the browser can serve them from its cache.
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

async function signedUrlsFor(paths: string[]): Promise<Map<string, string>> {
  const now = Date.now();
  const result = new Map<string, string>();
  const missing: string[] = [];
  for (const p of paths) {
    const hit = signedUrlCache.get(p);
    if (hit && hit.expiresAt - now > MIN_REMAINING_MS) result.set(p, hit.url);
    else missing.push(p);
  }
  if (missing.length > 0) {
    const { data, error } = await supabaseAdmin()
      .storage.from(PHOTO_BUCKET)
      .createSignedUrls(missing, SIGNED_URL_TTL);
    if (error) throw error;
    const expiresAt = now + SIGNED_URL_TTL * 1000;
    for (const d of data) {
      if (!d.path || !d.signedUrl) continue;
      signedUrlCache.set(d.path, { url: d.signedUrl, expiresAt });
      result.set(d.path, d.signedUrl);
    }
  }
  return result;
}

async function withSignedUrls(rows: PhotoRow[]): Promise<Photo[]> {
  if (rows.length === 0) return [];
  const urlByPath = await signedUrlsFor(rows.map((r) => r.storage_path));
  return rows
    .filter((r) => urlByPath.get(r.storage_path))
    .map((r) => ({
      id: r.id,
      url: urlByPath.get(r.storage_path)!,
      caption: r.caption,
      width: r.width,
      height: r.height,
      createdAt: r.created_at,
      userId: r.user_id,
      friendshipId: r.friendship_id,
    }));
}

/** The user's personal photos (not in any shared album). */
export async function listPhotos(userId: string, limit?: number): Promise<Photo[]> {
  let query = supabaseAdmin()
    .from("photos")
    .select(COLUMNS)
    .eq("user_id", userId)
    .is("friendship_id", null)
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return withSignedUrls(data);
}

/**
 * Photos in shared albums. Callers must have checked membership of every id
 * (requireFriendship / acceptedFriendshipIds) before calling.
 */
export async function listSharedPhotos(friendshipIds: string[]): Promise<Photo[]> {
  if (friendshipIds.length === 0) return [];
  const { data, error } = await supabaseAdmin()
    .from("photos")
    .select(COLUMNS)
    .in("friendship_id", friendshipIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withSignedUrls(data);
}

/** A photo the user may see: their own personal photo, or one in a shared album they belong to. */
export async function getPhoto(userId: string, photoId: string): Promise<Photo | null> {
  if (!isUuid(photoId)) return null;
  const { data, error } = await supabaseAdmin().from("photos").select(COLUMNS).eq("id", photoId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const allowed = data.friendship_id
    ? (await findFriendship(userId, data.friendship_id)) !== null
    : data.user_id === userId;
  if (!allowed) return null;
  const [photo] = await withSignedUrls([data]);
  return photo ?? null;
}
