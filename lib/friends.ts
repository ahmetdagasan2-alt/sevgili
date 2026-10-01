import "server-only";
import { notFound } from "next/navigation";
import { getProfiles, type Profile } from "./profiles";
import { supabaseAdmin } from "./supabase/server";

export type FriendshipRow = {
  id: string;
  user_a: string;
  user_b: string;
  requested_by: string;
  status: "pending" | "accepted";
  created_at: string;
  accepted_at: string | null;
};

export type Friend = {
  friendshipId: string;
  profile: Profile;
  since: string;
  sharedPhotos: number;
  sharedActivities: number;
  unreadNotes: number;
};

export type FriendRequest = { friendshipId: string; profile: Profile; createdAt: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID.test(v);

/** Friendships store each pair once, alphabetically. */
export function pair(a: string, b: string): { user_a: string; user_b: string } {
  return a < b ? { user_a: a, user_b: b } : { user_a: b, user_b: a };
}

/** PostgREST `or` filter matching either side; the id is quoted because Auth0 ids contain "|". */
export function memberFilter(userId: string): string {
  const quoted = `"${userId.replace(/["\\]/g, "")}"`;
  return `user_a.eq.${quoted},user_b.eq.${quoted}`;
}

export const otherMember =(f: Pick<FriendshipRow, "user_a" | "user_b">, me: string) =>
  f.user_a === me ? f.user_b : f.user_a;

function fallbackProfile(userId: string): Profile {
  return { userId, displayName: "Arkadaş", avatarUrl: null, friendCode: "" };
}

const COLUMNS = "id, user_a, user_b, requested_by, status, created_at, accepted_at";

/** An accepted friendship the user belongs to, or null. */
export async function findFriendship(userId: string, friendshipId: string): Promise<FriendshipRow | null> {
  if (!isUuid(friendshipId)) return null;
  const { data, error } = await supabaseAdmin()
    .from("friendships")
    .select(COLUMNS)
    .eq("id", friendshipId)
    .eq("status", "accepted")
    .or(memberFilter(userId))
    .maybeSingle();
  if (error) throw error;
  return data as FriendshipRow | null;
}

/** For server actions: throws instead of rendering a 404. */
export async function assertFriendship(userId: string, friendshipId: string): Promise<FriendshipRow> {
  const f = await findFriendship(userId, friendshipId);
  if (!f) throw new Error("Bu arkadaşlık bulunamadı");
  return f;
}

/** For pages: 404 unless the user is a member of this accepted friendship. */
export async function requireFriendship(userId: string, friendshipId: string) {
  const f = await findFriendship(userId, friendshipId);
  if (!f) notFound();
  const friendId = otherMember(f, userId);
  const profiles = await getProfiles([friendId]);
  return {
    friendship: f,
    friendId,
    friend: profiles.get(friendId) ?? fallbackProfile(friendId),
    memberIds: [f.user_a, f.user_b],
  };
}

/** Ids of every accepted friendship of the user — used to authorize shared photos. */
export async function acceptedFriendshipIds(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin()
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(memberFilter(userId));
  if (error) throw error;
  return data.map((r) => r.id);
}

function countBy(rows: { friendship_id: string | null }[]) {
  const counts = new Map<string, number>();
  for (const r of rows) if (r.friendship_id) counts.set(r.friendship_id, (counts.get(r.friendship_id) ?? 0) + 1);
  return counts;
}

export async function listFriendships(userId: string): Promise<{
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("friendships")
    .select(COLUMNS)
    .or(memberFilter(userId))
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data as FriendshipRow[];

  const acceptedIds = rows.filter((r) => r.status === "accepted").map((r) => r.id);
  const [profiles, photos, activities, notes] = await Promise.all([
    getProfiles(rows.map((r) => otherMember(r, userId))),
    acceptedIds.length
      ? db.from("photos").select("friendship_id").in("friendship_id", acceptedIds)
      : { data: [], error: null },
    acceptedIds.length
      ? db.from("activities").select("friendship_id").in("friendship_id", acceptedIds)
      : { data: [], error: null },
    acceptedIds.length
      ? db
          .from("notes")
          .select("friendship_id")
          .in("friendship_id", acceptedIds)
          .neq("author_id", userId)
          .is("read_at", null)
      : { data: [], error: null },
  ]);
  for (const r of [photos, activities, notes]) if (r.error) throw r.error;
  const photoCounts = countBy(photos.data ?? []);
  const activityCounts = countBy(activities.data ?? []);
  const unreadCounts = countBy(notes.data ?? []);

  const profileOf = (r: FriendshipRow) => {
    const id = otherMember(r, userId);
    return profiles.get(id) ?? fallbackProfile(id);
  };

  return {
    friends: rows
      .filter((r) => r.status === "accepted")
      .map((r) => ({
        friendshipId: r.id,
        profile: profileOf(r),
        since: r.accepted_at ?? r.created_at,
        sharedPhotos: photoCounts.get(r.id) ?? 0,
        sharedActivities: activityCounts.get(r.id) ?? 0,
        unreadNotes: unreadCounts.get(r.id) ?? 0,
      })),
    incoming: rows
      .filter((r) => r.status === "pending" && r.requested_by !== userId)
      .map((r) => ({ friendshipId: r.id, profile: profileOf(r), createdAt: r.created_at })),
    outgoing: rows
      .filter((r) => r.status === "pending" && r.requested_by === userId)
      .map((r) => ({ friendshipId: r.id, profile: profileOf(r), createdAt: r.created_at })),
  };
}
