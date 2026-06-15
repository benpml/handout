import { appBootstrapResponseSchema } from "@lightsite/contracts";
import { Router } from "express";
import { asyncHandler } from "../http/async-handler";
import { AppError } from "../http/errors";
import {
  getDevAppBootstrap,
  isDevAuthBypassEnabled,
} from "./dev-auth";

export function createDevAuthRouter() {
  const router = Router();

  router.post("/auth-bypass", asyncHandler(async (request, response) => {
    if (!isDevAuthBypassEnabled()) {
      throw new AppError({
        code: "dev_auth.disabled",
        message: "Dev auth bypass is disabled.",
        status: 404,
      });
    }

    response.json(appBootstrapResponseSchema.parse({
      ...getDevAppBootstrap(),
      requestId: request.context.requestId,
    }));
  }));

  return router;
}
