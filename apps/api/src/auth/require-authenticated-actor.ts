import type { Request } from "express";
import { AppError } from "../http/errors";
import type { CurrentActor, CurrentActorProvider } from "./current-actor";

export async function requireAuthenticatedActor(
  request: Request,
  getCurrentActor: CurrentActorProvider,
  message = "Sign in to continue.",
): Promise<CurrentActor> {
  const actor = await getCurrentActor(request);

  if (!actor) {
    throw new AppError({
      code: "auth.required",
      message,
      status: 401,
    });
  }

  return actor;
}
