import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { ensureProfile, nameFromClaims } from "./profiles";

export const auth0 = new Auth0Client({
  authorizationParameters: {
    ui_locales: "tr",
  },
  // Runs when a session is created at login — the one place we create the
  // profile, so normal page requests don't pay for an extra query.
  async beforeSessionSaved(session) {
    try {
      await ensureProfile({
        id: session.user.sub,
        name: nameFromClaims(session.user),
        picture: session.user.picture,
      });
    } catch (err) {
      // Never block login; /friends falls back to getOrCreateProfile.
      console.error("Profil oluşturulamadı", err);
    }
    return session;
  },
});
