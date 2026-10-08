import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { normalizeTimeZone } from "@/lib/dates";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  timezone: string;
};

/** Reads and validates the session once per request. */
export const getSession = cache(async () => {
  // Per-user data is never part of a prerender. Without this, Next's runtime
  // prerender aborts the in-flight DB fetch and Better Auth logs it as an error.
  await connection();
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Data Access Layer entry point: returns the signed-in user or redirects to /login.
 * Call it in every Server Component, Server Action and Route Handler that needs a user.
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id, name, email, timezone } = session.user;
  return { id, name, email, timezone: normalizeTimeZone(timezone) };
}
