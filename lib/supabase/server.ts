import "server-only";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PHOTO_BUCKET = "photos";

/**
 * Storage folder for a user. Auth0 ids look like "google-oauth2|123", and
 * Storage rejects "|" in object keys, so we use a stable hash instead.
 */
export function storageFolder(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 32);
}

let client: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS, so every query MUST be scoped by the
 * Auth0 user id (see requireUser in lib/session.ts). Never import from client code.
 */
export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env.local içinde tanımlı olmalı",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
