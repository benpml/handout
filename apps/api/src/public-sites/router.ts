import type { Response } from "express";
import { publicSiteResponseSchema } from "@lightsite/contracts";
import { Router } from "express";
import { asyncHandler } from "../http/async-handler";
import { AppError } from "../http/errors";
import type { PublicSiteResolution, PublicSiteService } from "./service";

export type PublicSiteRouterOptions = {
  publicSiteService: PublicSiteService;
};

const publicSiteSecurityHeaders = {
  "content-security-policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
} as const;

export function createPublicSiteRouter(options: PublicSiteRouterOptions) {
  const router = Router();

  router.use((_request, response, next) => {
    for (const [name, value] of Object.entries(publicSiteSecurityHeaders)) {
      response.setHeader(name, value);
    }

    next();
  });

  router.get("/:workspaceSlug/:siteSlug", asyncHandler(async (request, response) => {
    const result = await options.publicSiteService.resolve({
      workspaceSlug: request.params.workspaceSlug ?? "",
      siteSlug: request.params.siteSlug ?? "",
    });

    sendPublicSiteResolution(result, request.context.requestId, response);
  }));

  router.get("/:workspaceSlug/:siteSlug/:variantSlug", asyncHandler(async (request, response) => {
    const result = await options.publicSiteService.resolve({
      workspaceSlug: request.params.workspaceSlug ?? "",
      siteSlug: request.params.siteSlug ?? "",
      variantSlug: request.params.variantSlug ?? "",
    });

    sendPublicSiteResolution(result, request.context.requestId, response);
  }));

  return router;
}

function sendPublicSiteResolution(
  result: PublicSiteResolution,
  requestId: string,
  response: Response,
) {
  response.setHeader("cache-control", result.cacheControl);

  if (result.status === "invalid_slug") {
    throw new AppError({
      code: "slug.invalid",
      message: result.message,
      status: 404,
    });
  }

  if (result.status === "unavailable") {
    throw new AppError({
      code: "route.not_found",
      message: "Public site is not available.",
      status: 404,
    });
  }

  response.json(publicSiteResponseSchema.parse({
    payload: result.payload,
    requestId,
  }));
}
