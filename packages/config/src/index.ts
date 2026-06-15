import { z } from "zod";

export const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(3001),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().url(),
  LOGO_DEV_TOKEN: z.string().min(1).optional(),
  PUBLIC_SITE_ORIGIN: z.string().url().optional(),
  TRACKING_SIGNING_SECRET: z.string().min(32),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(env: NodeJS.ProcessEnv): ApiEnv {
  return apiEnvSchema.parse(env);
}

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function parseDatabaseEnv(env: NodeJS.ProcessEnv): DatabaseEnv {
  return databaseEnvSchema.parse(env);
}
