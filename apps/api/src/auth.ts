import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { bearer } from "better-auth/plugins";
import { validateEmail } from "@handout/domain";
import { env } from "./env";
import { db } from "@handout/db";
import * as databaseSchema from "@handout/db";
import { claimWorkspaceInvitationsForUser } from "./team/repository";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: getTrustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: databaseSchema,
  }),
  plugins: [bearer()],
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const validation = validateEmail(user.email);

          if (!validation.ok) {
            throw APIError.from("BAD_REQUEST", {
              code: validation.code,
              message: validation.message,
            });
          }

          return {
            data: {
              ...user,
              email: validation.email,
              emailVerified: true,
            },
          };
        },
        after: async (user) => {
          await claimWorkspaceInvitationsForUser({
            userId: user.id,
            email: user.email,
          });
        },
      },
    },
  },
});

function getTrustedOrigins() {
  return [
    env.WEB_ORIGIN,
    ...parseOriginList(env.WEB_ORIGINS),
  ];
}

function parseOriginList(value: string | undefined) {
  return value
    ? value
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
    : [];
}
