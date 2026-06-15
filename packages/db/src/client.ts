import { parseDatabaseEnv } from "@lightsite/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const { DATABASE_URL } = parseDatabaseEnv(process.env);

export const queryClient = postgres(DATABASE_URL, {
  max: 10,
  prepare: false,
});

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;
