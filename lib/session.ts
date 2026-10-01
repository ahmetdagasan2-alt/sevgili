import "server-only";
import { redirect } from "next/navigation";
import { auth0 } from "./auth0";
import { nameFromClaims } from "./profiles";

export type AppUser = {
  id: string;
  name: string;
  email?: string;
  picture?: string;
};

/** Returns the signed-in user or redirects to Auth0 login. */
export async function requireUser(returnTo = "/dashboard"): Promise<AppUser> {
  const session = await auth0.getSession();
  if (!session) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  const u = session.user;
  return {
    id: u.sub,
    name: nameFromClaims(u),
    email: u.email,
    picture: u.picture,
  };
}
