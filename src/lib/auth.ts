import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { DEFAULT_TIME_ZONE, normalizeTimeZone } from "@/lib/dates";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      timezone: {
        type: "string",
        required: false,
        defaultValue: DEFAULT_TIME_ZONE,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Never trust the client-provided zone blindly.
        before: async (data) => ({
          data: { ...data, timezone: normalizeTimeZone(data.timezone as string | undefined) },
        }),
      },
    },
  },
  // Must be last: lets Server Actions set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
