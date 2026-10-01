import "server-only";
import { randomInt } from "node:crypto";
import { supabaseAdmin } from "./supabase/server";

export type Profile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  friendCode: string;
};

type ProfileRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  friend_code: string;
};

// No 0/O, 1/I/L — codes are read aloud and typed by hand.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const UNIQUE_VIOLATION = "23505";

/** Best human name from Auth0 claims. */
export function nameFromClaims(u: { given_name?: unknown; nickname?: string; name?: string }): string {
  return (typeof u.given_name === "string" && u.given_name) || u.nickname || u.name || "Sevgilim";
}

export function generateFriendCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Accepts "k7q2m9xp", "K7Q2 M9XP", "k7q2-m9xp"… Returns the canonical form or null. */
export function normalizeFriendCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 8 || [...raw].some((c) => !CODE_ALPHABET.includes(c))) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

const toProfile = (r: ProfileRow): Profile => ({
  userId: r.user_id,
  displayName: r.display_name,
  avatarUrl: r.avatar_url,
  friendCode: r.friend_code,
});

const COLUMNS = "user_id, display_name, avatar_url, friend_code";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin().from("profiles").select(COLUMNS).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? toProfile(data) : null;
}

export async function getProfiles(userIds: string[]): Promise<Map<string, Profile>> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await supabaseAdmin().from("profiles").select(COLUMNS).in("user_id", userIds);
  if (error) throw error;
  return new Map(data.map((r) => [r.user_id, toProfile(r)]));
}

/**
 * Creates the profile if it doesn't exist yet; never overwrites an existing one
 * (the user may have changed their display name).
 */
export async function ensureProfile(user: { id: string; name: string; picture?: string }): Promise<void> {
  const db = supabaseAdmin();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await db.from("profiles").upsert(
      {
        user_id: user.id,
        display_name: user.name.trim().slice(0, 40) || "Sevgilim",
        avatar_url: user.picture ?? null,
        friend_code: generateFriendCode(),
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    if (!error) return;
    // A clash on friend_code (not user_id) — try another code.
    if (error.code !== UNIQUE_VIOLATION) throw error;
  }
  throw new Error("Arkadaş kodu oluşturulamadı");
}

/** Fallback for sessions created before profiles existed. */
export async function getOrCreateProfile(user: { id: string; name: string; picture?: string }): Promise<Profile> {
  const existing = await getProfile(user.id);
  if (existing) return existing;
  await ensureProfile(user);
  const created = await getProfile(user.id);
  if (!created) throw new Error("Profil oluşturulamadı");
  return created;
}
